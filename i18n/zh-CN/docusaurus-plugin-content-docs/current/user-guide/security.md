---
sidebar_position: 8
title: "安全"
description: "安全模型、危险命令审批、用户授权、容器隔离与生产部署最佳实践"
---

# 安全

Hermes 智能体采用纵深防御的安全模型设计。本页涵盖所有安全边界——从命令审批到容器隔离，再到消息平台的用户授权。

## 概览

安全模型包含七层：

1. **用户授权** —— 谁可以与智能体通信（允许列表、私信配对）
2. **危险命令审批** —— 针对破坏性操作的人工在环审批
3. **容器隔离** —— Docker/Singularity/Modal 沙箱化，配置强化设置
4. **MCP 凭证过滤** —— MCP 子进程的环境变量隔离
5. **上下文文件扫描** —— 项目文件中的提示词注入检测
6. **跨会话隔离** —— 会话间无法访问彼此的数据或状态；定时任务存储路径已强化，防止路径遍历攻击
7. **输入净化** —— 终端工具后端的工作目录参数需根据允许列表进行验证，以防止命令注入

## 危险命令批准

在执行任何命令之前，Hermes 会将其与精心编制的危险模式列表进行比对。若匹配，用户必须明确批准。

### 批准模式

批准系统支持三种模式，通过 `~/.hermes/config.yaml` 中的 `approvals.mode` 配置：

```yaml
approvals:
  mode: manual    # manual | smart | off
  timeout: 60     # 等待用户响应的秒数（默认：60）
```

| 模式 | 行为 |
|------|------|
| **manual** (默认) | 对危险命令始终提示用户批准 |
| **smart** | 使用辅助 LLM 评估风险。低风险命令（例如 `python -c "print('hello')"）会被自动批准。真正危险的命令会被自动拒绝。不确定的情况会升级为手动提示。 |
| **off** | 禁用所有批准检查 — 等同于使用 `--yolo` 运行。所有命令直接执行，无提示。 |

:::warning
设置 `approvals.mode: off` 会禁用所有安全提示。请仅在受信任的环境（CI/CD、容器等）中使用。
:::

### YOLO 模式

YOLO 模式会绕过当前会话的**所有**危险命令批准提示。可以通过三种方式激活：

1. **CLI 标志**：使用 `hermes --yolo` 或 `hermes chat --yolo` 启动会话
2. **斜杠命令**：在会话中输入 `/yolo` 来切换开关状态
3. **环境变量**：设置 `HERMES_YOLO_MODE=1`

`/yolo` 命令是一个**切换开关** — 每次使用都会在开启和关闭之间切换：

```
> /yolo
  ⚡ YOLO 模式已开启 — 所有命令自动批准。请谨慎使用。

> /yolo
  ⚠ YOLO 模式已关闭 — 危险命令将需要批准。
```

YOLO 模式在 CLI 和网关会话中均可用。在内部，它设置 `HERMES_YOLO_MODE` 环境变量，该变量会在每次命令执行前被检查。

当 YOLO 处于激活状态时，Hermes 会显示两个持久的视觉提醒，让人难以忘记批准提示已被绕过：

- 会话开始时，如果 YOLO 已激活，则显示红色横幅行：`⚠ YOLO 模式 — 所有批准提示已绕过`。当 YOLO 关闭时隐藏，以保持默认横幅整洁。
- 在所有宽度层级的状态栏中显示 `⚠ YOLO` 片段，当您切换 YOLO 开/关时实时更新（富文本渲染器和纯文本回退）。

:::danger
YOLO 模式会禁用**所有**危险命令安全检查（用于当前会话） — **除了**硬性黑名单（见下文）。请仅在您完全信任生成的命令时使用（例如，经过充分测试的自动化脚本在一次性环境中运行）。
:::

对于破坏性的会话斜杠命令（`/clear`、`/new`、`/reset`、`/undo`、`/exit --delete`），CLI 在运行前也会提示确认。请参阅 [斜杠命令 — 破坏性命令的确认提示](../reference/slash-commands.md#confirmation-prompts-for-destructive-commands)。

### 硬性黑名单（始终生效的底线）

某些命令过于灾难性 — 不可逆的文件系统擦除、fork 循环、直接块设备写入 — Hermes **无论如何**都拒绝运行，无论：

- `--yolo` / `/yolo` 是否已开启
- `approvals.mode` 是否设为 `off`
- Cron 作业是否在无头 `approve` 模式下运行
- 用户是否显式点击"始终允许"

黑名单是 `--yolo` 之下的底线。它在批准层看到命令**之前**就会触发，并且没有覆盖标志。目前涵盖的模式（非穷举；与 `tools/approval.py::UNRECOVERABLE_BLOCKLIST` 保持同步）：

| 模式 | 为何列为硬性 |
|---|---|
| `rm -rf /` 及其明显变体 | 擦除文件系统根 |
| `rm -rf --no-preserve-root /` | 明确"是的，我指根"的变体 |
| `:(){ :\|:& };:` (bash fork 循环) | 使主机负载过高直至重启 |
| 对已挂载的根设备执行 `mkfs.*` | 格式化活动系统 |
| `dd if=/dev/zero of=/dev/sd*` | 将物理磁盘清零 |
| 将不可信 URL 通过管道传送到根文件系统顶层的 `sh` | 远程代码执行攻击面过宽，无法批准 |

如果触发了黑名单，工具调用会向智能体返回解释性错误，不会运行任何命令。如果合法工作流需要这些命令之一（例如，您是擦除并重装管道的操作员），请在智能体之外运行。

### 批准超时

当出现危险命令提示时，用户有可配置的时间进行响应。如果在超时时间内没有响应，命令**默认被拒绝**（失败关闭）。

在 `~/.hermes/config.yaml` 中配置超时：

```yaml
approvals:
  timeout: 60  # 秒（默认：60）
```

### 什么会触发批准

以下模式会触发批准提示（在 `tools/approval.py` 中定义）：

| 模式 | 描述 |
|---------|-------------|
| `rm -r` / `rm --recursive` | 递归删除 |
| `rm ... /` | 在根路径删除 |
| `chmod 777/666` / `o+w` / `a+w` | 全局/其他可写权限 |
| `chmod --recursive` 配合不安全权限 | 递归全局/其他可写（长标志） |
| `chown -R root` / `chown --recursive root` | 递归将所有者更改为 root |
| `mkfs` | 格式化文件系统 |
| `dd if=` | 磁盘复制 |
| `> /dev/sd` | 写入块设备 |
| `DROP TABLE/DATABASE` | SQL DROP |
| `DELETE FROM` (无 WHERE) | 无 WHERE 子句的 SQL DELETE |
| `TRUNCATE TABLE` | SQL TRUNCATE |
| `> /etc/` | 覆盖系统配置 |
| `systemctl stop/restart/disable/mask` | 停止/重启/禁用系统服务 |
| `kill -9 -1` | 终止所有进程 |
| `pkill -9` | 强制终止进程 |
| Fork 循环模式 | Fork 循环 |
| `bash -c` / `sh -c` / `zsh -c` / `ksh -c` | 通过 `-c` 标志执行 shell 命令（包括组合标志如 `-lc`） |
| `python -e` / `perl -e` / `ruby -e` / `node -c` | 通过 `-e`/`-c` 标志执行脚本 |
| `curl ... \| sh` / `wget ... \| sh` | 将远程内容通过管道传送到 shell |
| `bash <(curl ...)` / `sh <(wget ...)` | 通过进程替换执行远程脚本 |
| 使用 `tee` 写入 `/etc/`、`~/.ssh/`、`~/.hermes/.env` | 通过 tee 覆盖敏感文件 |
| `>` / `>>` 写入 `/etc/`、`~/.ssh/`、`~/.hermes/.env` | 通过重定向覆盖敏感文件 |
| `xargs rm` | 使用 xargs 配合 rm |
| `find -exec rm` / `find -delete` | find 配合破坏性操作 |
| `cp`/`mv`/`install` 到 `/etc/` | 将文件复制/移动到系统配置目录 |
| `sed -i` / `sed --in-place` 操作 `/etc/` | 就地编辑系统配置 |
| `pkill`/`killall` hermes/gateway | 自我终止防护 |
| `gateway run` 配合 `&`/`disown`/`nohup`/`setsid` | 防止在服务管理器外启动网关 |

:::info
**容器绕过**：在 `docker`、`singularity`、`modal`、`daytona` 或 `vercel_sandbox` 后端中运行时，危险命令检查**被跳过**，因为容器本身就是安全边界。容器内的破坏性命令不会损害主机。
:::

### 批准流程 (CLI)

在交互式 CLI 中，危险命令会显示内联批准提示：

```
  ⚠️  危险命令：递归删除
      rm -rf /tmp/old-project

      [o] 单次  |  [s] 会话  |  [a] 始终  |  [d] 拒绝

      选择 [o/s/a/D]:
```

四个选项：

- **单次** — 允许此次单次执行
- **会话** — 允许此模式在剩余会话中生效
- **始终** — 添加到永久允许列表（保存到 `config.yaml`）
- **拒绝** (默认) — 阻止该命令

### 批准流程 (网关/消息平台)

在消息平台上，智能体会将危险命令详情发送到聊天中，并等待用户回复：

- 回复 **yes**、**y**、**approve**、**ok** 或 **go** 以批准
- 回复 **no**、**n**、**deny** 或 **cancel** 以拒绝

运行网关时，环境变量 `HERMES_EXEC_ASK=1` 会自动设置。

### 永久允许列表

使用"始终"批准的命令会保存到 `~/.hermes/config.yaml`：

```yaml
# 永久允许的危险命令模式
command_allowlist:
  - rm
  - systemctl
```

这些模式在启动时加载，并在所有未来的会话中自动静默批准。

:::tip
使用 `hermes config edit` 查看或移除永久允许列表中的模式。
:::

## 用户授权（网关）

运行消息网关时，Hermes 通过分层授权系统控制谁可以与机器人交互。

### 授权检查顺序

`_is_user_authorized()` 方法按此顺序检查：

1. **每平台的允许所有标志** (例如, `DISCORD_ALLOW_ALL_USERS=true`)
2. **DM 配对批准列表** (通过配对码批准的用户)
3. **平台特定的允许列表** (例如, `TELEGRAM_ALLOWED_USERS=12345,67890`)
4. **全局允许列表** (`GATEWAY_ALLOWED_USERS=12345,67890`)
5. **全局允许所有** (`GATEWAY_ALLOW_ALL_USERS=true`)
6. **默认：拒绝**

### 平台允许列表

在 `~/.hermes/.env` 中设置以逗号分隔的允许用户 ID：

```bash
# 平台特定的允许列表
TELEGRAM_ALLOWED_USERS=123456789,987654321
DISCORD_ALLOWED_USERS=111222333444555666
WHATSAPP_ALLOWED_USERS=15551234567
SLACK_ALLOWED_USERS=U01ABC123

# 跨平台允许列表（对所有平台检查）
GATEWAY_ALLOWED_USERS=123456789

# 每平台的允许所有（请谨慎使用）
DISCORD_ALLOW_ALL_USERS=true

# 全局允许所有（请极度谨慎使用）
GATEWAY_ALLOW_ALL_USERS=true
```

:::warning
如果**未配置任何允许列表**且 `GATEWAY_ALLOW_ALL_USERS` 未设置，**所有用户都会被拒绝**。网关在启动时会记录警告：

```
未配置用户允许列表。所有未授权用户将被拒绝。
在 ~/.hermes/.env 中设置 GATEWAY_ALLOW_ALL_USERS=true 以允许开放访问，
或配置平台允许列表（例如，TELEGRAM_ALLOWED_USERS=your_id）。
```
:::

### DM 配对系统

为了更灵活的授权，Hermes 包含一个基于代码的配对系统。无需预先提供用户 ID，未知用户会收到一个一次性配对码，机器人所有者通过 CLI 批准。

**工作原理：**

1. 未知用户向机器人发送私信
2. 机器人回复一个 8 字符的配对码
3. 机器人所有者在 CLI 上运行 `hermes pairing approve <platform> <code>`
4. 用户在该平台上被永久批准

在 `~/.hermes/config.yaml` 中控制如何处理未授权的私信：

```yaml
unauthorized_dm_behavior: pair

whatsapp:
  unauthorized_dm_behavior: ignore
```

- `pair` 是默认值。未授权的私信会收到配对码回复。
- `ignore` 会静默丢弃未授权的私信。
- 平台部分覆盖全局默认设置，因此您可以在 Telegram 上保持配对，而在 WhatsApp 上保持静默。

**安全特性**（基于 OWASP + NIST SP 800-63-4 指导）：

| 特性 | 详情 |
|---------|---------|
| 代码格式 | 来自 32 字符无歧义字母表的 8 字符代码（无 0/O/1/I） |
| 随机性 | 加密级 (`secrets.choice()`) |
| 代码 TTL | 1 小时过期 |
| 速率限制 | 每用户每 10 分钟 1 次请求 |
| 待处理限制 | 每个平台最多 3 个待处理代码 |
| 锁定 | 5 次失败的批准尝试 → 1 小时锁定 |
| 文件安全 | 所有配对数据文件设置 `chmod 0600` |
| 日志记录 | 代码从不记录到标准输出 |

**配对 CLI 命令：**

```bash
# 列出待处理和已批准的用户
hermes pairing list

# 批准一个配对码
hermes pairing approve telegram ABC12DEF

# 撤销用户的访问权限
hermes pairing revoke telegram 123456789

# 清除所有待处理代码
hermes pairing clear-pending
```

**存储：** 配对数据存储在 `~/.hermes/pairing/` 中，每个平台一个 JSON 文件：
- `{platform}-pending.json` — 待处理的配对请求
- `{platform}-approved.json` — 已批准的用户
- `_rate_limits.json` — 速率限制和锁定跟踪

## 容器隔离

使用 `docker` 终端后端时，Hermes 会对每个容器应用严格的安全加固。

### Docker 安全标志

每个容器都运行以下这些标志（在 `tools/environments/docker.py` 中定义）：

```python
_SECURITY_ARGS = [
    "--cap-drop", "ALL",                          # 放弃所有 Linux 权能
    "--cap-add", "DAC_OVERRIDE",                  # Root 可以写入绑定挂载的目录
    "--cap-add", "CHOWN",                         # 包管理器需要文件所有权
    "--cap-add", "FOWNER",                        # 包管理器需要文件所有权
    "--security-opt", "no-new-privileges",         # 阻止权限提升
    "--pids-limit", "256",                         # 限制进程数量
    "--tmpfs", "/tmp:rw,nosuid,size=512m",         # 大小受限的 /tmp
    "--tmpfs", "/var/tmp:rw,noexec,nosuid,size=256m",  # 不可执行的 /var/tmp
    "--tmpfs", "/run:rw,noexec,nosuid,size=64m",   # 不可执行的 /run
]
```

### 资源限制

容器资源可在 `~/.hermes/config.yaml` 中配置：

```yaml
terminal:
  backend: docker
  docker_image: "nikolaik/python-nodejs:python3.11-nodejs20"
  docker_forward_env: []  # 显式允许列表；为空则将密钥排除在容器之外
  container_cpu: 1        # CPU 核心数
  container_memory: 5120  # MB（默认 5GB）
  container_disk: 51200   # MB（默认 50GB，XFS 上需要 overlay2）
  container_persistent: true  # 在会话间持久化文件系统
```

### 文件系统持久性

- **持久模式** (`container_persistent: true`)：从 `~/.hermes/sandboxes/docker/<task_id>/` 绑定挂载 `/workspace` 和 `/root`。
- **临时模式** (`container_persistent: false`)：对工作区使用 tmpfs —— 清理时所有数据都将丢失。

:::tip
对于生产网关部署，请使用 `docker`、`modal`、`daytona` 或 `vercel_sandbox` 后端，将智能体命令与宿主系统隔离。这完全消除了对危险命令进行审批的需要。
:::

:::warning
如果你向 `terminal.docker_forward_env` 添加了变量名，这些变量将被故意注入到容器中供终端命令使用。这对于像 `GITHUB_TOKEN` 这样的特定任务凭证很有用，但这也意味着容器中运行的代码可以读取并窃取它们。
:::

## 终端后端安全对比

| 后端 | 隔离性 | 危险命令检查 | 最佳适用场景 |
|---------|-----------|-------------------|----------|
| **local** | 无 — 在宿主上运行 | ✅ 是 | 开发、受信任的用户 |
| **ssh** | 远程机器 | ✅ 是 | 在单独的服务器上运行 |
| **docker** | 容器 | ❌ 跳过（容器即是边界） | 生产网关 |
| **singularity** | 容器 | ❌ 跳过 | HPC 环境 |
| **modal** | 云沙盒 | ❌ 跳过 | 可扩展的云隔离 |
| **daytona** | 云沙盒 | ❌ 跳过 | 持久化云工作区 |
| **vercel_sandbox** | 云微虚拟机 | ❌ 跳过 | 带快照持久化的云执行 |

## 环境变量透传 {#environment-variable-passthrough}

`execute_code` 和 `terminal` 均会剥离子进程中的敏感环境变量，以防止LLM生成的代码窃取凭据。然而，声明了 `required_environment_variables` 的技能确实需要访问这些变量。

### 工作原理

有两种机制允许特定变量通过沙箱过滤器：

**1. 技能范围的透传（自动）**

当加载技能（通过 `skill_view` 或 `/skill` 命令）并声明了 `required_environment_variables` 时，任何在环境中实际设置的这些变量会自动注册为透传。缺失的变量（仍处于“需要设置”状态）**不会**被注册。

```yaml
# 在技能的 SKILL.md 前置元数据中
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: Tenor API key
    help: Get a key from https://developers.google.com/tenor
```

加载此技能后，`TENOR_API_KEY` 会透传给 `execute_code`、`terminal`（本地）**以及远程后端（Docker、Modal）** —— 无需手动配置。

:::info Docker 和 Modal
在 v0.5.1 之前，Docker 的 `forward_env` 与技能透传是独立的系统。现在它们已合并——技能声明的环境变量会自动转发到 Docker 容器和 Modal 沙箱中，无需手动添加到 `docker_forward_env`。
:::

**2. 基于配置的透传（手动）**

对于未被任何技能声明的环境变量，请将它们添加到 `config.yaml` 中的 `terminal.env_passthrough`：

```yaml
terminal:
  env_passthrough:
    - MY_CUSTOM_KEY
    - ANOTHER_TOKEN
```

### 凭据文件透传（OAuth 令牌等） {#credential-file-passthrough}

某些技能需要在沙箱中访问**文件**（而不仅仅是环境变量）——例如，Google Workspace 将 OAuth 令牌存储为 `google_token.json`，位于活动配置文件的 `HERMES_HOME` 下。技能在前置元数据中声明这些文件：

```yaml
required_credential_files:
  - path: google_token.json
    description: Google OAuth2 token (created by setup script)
  - path: google_client_secret.json
    description: Google OAuth2 client credentials
```

加载时，Hermes 会检查这些文件是否存在于活动配置文件的 `HERMES_HOME` 中，并注册它们以进行挂载：

- **Docker**：只读绑定挂载（`-v host:container:ro`）
- **Modal**：在沙箱创建时挂载，并在每次命令前同步（处理会话中的 OAuth 设置）
- **本地**：无需操作（文件已可访问）

您也可以在 `config.yaml` 中手动列出凭据文件：

```yaml
terminal:
  credential_files:
    - google_token.json
    - my_custom_oauth_token.json
```

路径相对于 `~/.hermes/`。文件在容器内挂载到 `/root/.hermes/`。

### 每种沙箱的过滤内容

| 沙箱 | 默认过滤 | 透传覆盖 |
|------|----------|----------|
| **execute_code** | 阻止名称中包含 `KEY`、`TOKEN`、`SECRET`、`PASSWORD`、`CREDENTIAL`、`PASSWD`、`AUTH` 的变量；仅允许安全前缀的变量通过 | ✅ 透传变量绕过两项检查 |
| **terminal**（本地） | 阻止显式的 Hermes 基础设施变量（提供者密钥、网关令牌、工具 API 密钥） | ✅ 透传变量绕过阻止列表 |
| **terminal**（Docker） | 默认不传递任何主机环境变量 | ✅ 透传变量 + `docker_forward_env` 通过 `-e` 转发 |
| **terminal**（Modal） | 默认不传递主机环境/文件 | ✅ 凭据文件被挂载；环境透传通过同步实现 |
| **MCP** | 阻止除安全系统变量外的所有内容，以及明确配置的 `env` | ❌ 不受透传影响（请改用 MCP 的 `env` 配置） |

### 安全注意事项

- 透传仅影响您或您的技能明确声明的变量——对于任意的 LLM 生成的代码，默认安全态势保持不变
- 凭据文件以**只读**方式挂载到 Docker 容器中
- 技能卫士会在安装前扫描技能内容，检查可疑的环境访问模式
- 缺失/未设置的变量永远不会被注册（您无法泄露不存在的东西）
- Hermes 基础设施密钥（提供者 API 密钥、网关令牌）**绝不能**添加到 `env_passthrough`——它们有专用机制

## MCP 凭据处理

MCP（模型上下文协议）服务器子进程接收一个**经过过滤的环境**，以防止意外的凭据泄露。

### 安全的环境变量

只有以下变量会从主机传递到 MCP stdio 子进程：

```
PATH, HOME, USER, LANG, LC_ALL, TERM, SHELL, TMPDIR
```

以及任何 `XDG_*` 变量。所有其他环境变量（API 密钥、令牌、密钥）都会被**剥离**。

在 MCP 服务器的 `env` 配置中明确定义的变量会被透传：

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_..."  # Only this is passed
```

### 凭据编辑

MCP 工具返回的错误消息在传递给 LLM 之前会被清理。以下模式会被替换为 `[REDACTED]`：

- GitHub PAT (`ghp_...`)
- OpenAI 风格的密钥 (`sk-...`)
- Bearer 令牌
- `token=`、`key=`、`API_KEY=`、`password=`、`secret=` 参数

### 网站访问策略

您可以通过智能体的网页和浏览器工具限制其可以访问的网站。这对于防止智能体访问内部服务、管理面板或其他敏感 URL 很有用。

```yaml
# 在 ~/.hermes/config.yaml 中
security:
  website_blocklist:
    enabled: true
    domains:
      - "*.internal.company.com"
      - "admin.example.com"
    shared_files:
      - "/etc/hermes/blocked-sites.txt"
```

当请求被阻止的 URL 时，工具会返回一条错误消息，说明该域名根据策略被阻止。此阻止列表在 `web_search`、`web_extract`、`browser_navigate` 和所有支持 URL 的工具中强制执行。

详情请参阅配置指南中的[网站阻止列表](/user-guide/configuration#website-blocklist)。

### SSRF 防护

所有支持 URL 的工具（网络搜索、网页提取、视觉、浏览器）在获取 URL 之前都会对其进行验证，以防止服务器端请求伪造（SSRF）攻击。被阻止的地址包括：

- **私有网络** (RFC 1918)：`10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/16`
- **环回地址**：`127.0.0.0/8`、`::1`
- **链路本地地址**：`169.254.0.0/16`（包括 `169.254.169.254` 处的云元数据）
- **CGNAT / 共享地址空间** (RFC 6598)：`100.64.0.0/10`（Tailscale、WireGuard VPN）
- **云元数据主机名**：`metadata.google.internal`、`metadata.goog`
- **保留、组播和未指定的地址**

SSRF 防护在面向互联网使用时始终处于活动状态，DNS 失败被视为被阻止（失败即关闭）。重定向链在每一跳都会重新验证，以防止基于重定向的绕过。

#### 故意允许私有 URL

某些设置合法地需要私有/内部 URL 访问——例如将 `home.arpa` 解析到 RFC 1918 空间的家庭网络、仅限局域网的 Ollama/llama.cpp 端点、内部 wiki、云元数据调试等。对于这些情况，有一个全局退出选项：

```yaml
security:
  allow_private_urls: true   # 默认值：false
```

启用后，网页工具、浏览器、视觉 URL 获取和网关媒体下载将不再拒绝 RFC 1918 / 环回 / 链路本地 / CGNAT / 云元数据目标。**这是一个刻意的信任边界** —— 仅在智能体针对本地网络运行任意提示注入的 URL 是可接受风险的机器上启用此选项。面向公众的网关应保持关闭状态。

主机子字符串防护（即使底层 IP 是公网 IP，也会阻止外观相似的 Unicode 域名技巧）无论此设置如何都保持开启。

### Tirith 执行前安全扫描

Hermes 集成了 [tirith](https://github.com/sheeki03/tirith) 用于在执行前进行内容级别的命令扫描。Tirith 可以检测模式匹配遗漏的威胁：

- 同形异义 URL 欺骗（国际化域名攻击）
- 管道到解释器模式（`curl | bash`、`wget | sh`）
- 终端注入攻击

首次使用时，Tirith 会从 GitHub 发布页面自动安装，并带有 SHA-256 校验和验证（如果可用，还会进行 cosign 来源验证）。

```yaml
# 在 ~/.hermes/config.yaml 中
security:
  tirith_enabled: true       # 启用/禁用 tirith 扫描（默认值：true）
  tirith_path: "tirith"      # tirith 二进制文件路径（默认值：PATH 查找）
  tirith_timeout: 5          # 子进程超时时间（秒）
  tirith_fail_open: true     # tirith 不可用时允许执行（默认值：true）
```

当 `tirith_fail_open` 为 `true`（默认）时，如果 tirith 未安装或超时，命令将继续执行。在高安全环境中设置为 `false`，以在 tirith 不可用时阻止命令。

Tirith 为 Linux (x86_64 / aarch64) 和 macOS (x86_64 / arm64) 提供预构建的二进制文件。在没有预构建二进制文件的平台（如 Windows）上，Tirith 会被静默跳过——模式匹配防护仍会运行，CLI 不会显示“不可用”的横幅。要在 Windows 上使用 Tirith，请在 WSL 下运行 Hermes。

Tirith 的判定与审批流程集成：安全的命令直接通过，而可疑和被阻止的命令会触发用户审批，并附带完整的 tirith 发现结果（严重性、标题、描述、更安全的替代方案）。用户可以批准或拒绝——默认选择是拒绝，以确保无人值守场景的安全性。

### 上下文文件注入防护

上下文文件（AGENTS.md、.cursorrules、SOUL.md）在包含到系统提示词之前，会被扫描是否存在提示注入。扫描器检查：

- 忽略/无视先前指令的指示
- 带有可疑关键字的隐藏 HTML 注释
- 读取密钥（`.env`、`credentials`、`.netrc`）的尝试
- 通过 `curl` 进行凭据外泄
- 不可见的 Unicode 字符（零宽空格、双向覆盖）

被阻止的文件会显示警告：

```
[被阻止：AGENTS.md 包含潜在的提示注入 (prompt_injection)。内容未加载。]
```

## 生产环境部署最佳实践

### 网关部署检查清单

1. **设置明确的白名单** — 切勿在生产环境中使用 `GATEWAY_ALLOW_ALL_USERS=true`
2. **使用容器后端** — 在 config.yaml 中设置 `terminal.backend: docker`
3. **限制资源配额** — 设置合适的 CPU、内存和磁盘限制
4. **安全存储密钥** — 将 API 密钥保存在 `~/.hermes/.env` 中，并设置适当的文件权限
5. **启用配对功能** — 尽可能使用配对码，而非硬编码用户 ID
6. **审阅命令白名单** — 定期审计 config.yaml 中的 `command_allowlist`
7. **设置 `MESSAGING_CWD`** — 不要让智能体在敏感目录中操作
8. **以非 root 用户运行** — 切勿以 root 身份运行网关
9. **监控日志** — 检查 `~/.hermes/logs/` 以发现未授权访问尝试
10. **保持更新** — 定期运行 `hermes update` 以获取安全补丁

### 保护 API 密钥

```bash
# 为 .env 文件设置适当的权限
chmod 600 ~/.hermes/.env

# 为不同服务使用独立密钥
# 切勿将 .env 文件提交到版本控制系统
```

### 网络隔离

为实现最高安全性，请在独立的机器或虚拟机上运行网关。在 `config.yaml` 中设置 `terminal.backend: ssh`，然后通过 `~/.hermes/.env` 中的环境变量提供主机详情：

```yaml
# ~/.hermes/config.yaml
terminal:
  backend: ssh
```

```bash
# ~/.hermes/.env
TERMINAL_SSH_HOST=agent-worker.local
TERMINAL_SSH_USER=hermes
TERMINAL_SSH_KEY=~/.ssh/hermes_agent_key
```

SSH 连接详情存放在 `.env`（而非 `config.yaml`）中，因此不会随配置文件导出被签入或共享。这使得网关的消息连接与智能体的命令执行相互隔离。

## 供应链公告检查

Hermes 内置了一个公告扫描器，它会标记当前活跃虚拟环境中匹配已知受陷版本目录的 Python 包（例如 2026 年 5 月 `mistralai 2.4.6` 投毒事件这样的供应链蠕虫）。其实现代码位于 `hermes_cli/security_advisories.py`。

运行方式：

- **CLI 启动横幅。** 如果有任何公告匹配，会打印一行警告，并指向 `hermes doctor` 以获取完整的修复方案。
- **`hermes doctor`。** 显示每条活跃公告的具体版本信息及 2-4 步的修复说明。
- **网关启动。** 记录到 `gateway.log`；首次交互消息会显示一个简短的操作员横幅。

每条公告都有一个稳定的 ID。一旦您已阅读并处理完毕，就可以永久解除它：

```bash
hermes doctor --ack <advisory-id>
```

解除操作会持久化到 `config.security.acked_advisories` 中，并在重启后保留。旧的公告**不会**被从目录中移除——保留它们可以让新安装实例对历史上可能仍缓存在私有镜像中的受陷版本保持警惕。

检查本身仅使用标准库，通过对每个公告进行一次 `importlib.metadata.version()` 查询来运行，因此在每次启动时运行是安全的。

### 可选依赖项的惰性安装

许多功能（Mistral TTS、ElevenLabs、Honcho memory、Bedrock、Slack、Matrix 等）依赖于并非每个用户都需要的 Python 包。Hermes 会在首次使用时**惰性安装**这些依赖，而不是在 `hermes-agent[all]` 下预先安装。实现代码位于 `tools/lazy_deps.py`。

这种方案解决了以下权衡：

- **脆弱性。** 当某个额外功能的传递依赖在 PyPI 上不可用（因恶意软件被隔离、被撤回、上传损坏）时，整个 `[all]` 的解析会失败，新安装会静默回退到精简版本——一次性丢失 10 多个不相关的额外功能。惰性安装隔离了每个后端，因此一个受损的依赖不会破坏不相关的功能。
- **臃肿。** 仅与一个提供商对话的用户不再需要拉取数百个他们永远不会导入的包。

工作原理：

1. 后端模块在其首次导入路径的顶部调用 `ensure("feature.name")`。
2. 如果依赖缺失，`ensure` 会检查 `config.yaml` 中的 `security.allow_lazy_installs`（默认为 `true`），并为白名单中的规范运行虚拟环境范围内的 `pip install`。
3. 如果安装失败或用户禁用了惰性安装，该调用会抛出 `FeatureUnavailable` 异常，包含实际的 pip 标准错误输出以及指向 `hermes tools` 的指引。

`tools/lazy_deps.py` 强制执行的安全保证：

| 保证 | 含义 |
|---|---|
| 仅限于虚拟环境范围 | 安装目标为当前活跃虚拟环境中的 `sys.executable` — 永远不会涉及系统 Python |
| 仅通过名称指定 PyPI 包 | 规范接受 `"package>=1.0,<2"` 语法。不支持 `--index-url`、`git+https://` 或 file: 路径 — 恶意的 `config.yaml` 无法重定向安装 |
| 白名单 | 只有出现在内置 `LAZY_DEPS` 映射中的规范才能通过此路径安装。功能名称中的拼写错误**不会**获得安装任意软件的语义 |
| 可选退出 | 设置 `security.allow_lazy_installs: false` 可完全禁用运行时安装。适用于受限网络或严格安全要求 |
| 无静默重试 | 失败会以 `FeatureUnavailable` 形式呈现 — 不会缓存错误状态，不会出现重试风暴 |

要禁用运行时安装：

```yaml
# ~/.hermes/config.yaml
security:
  allow_lazy_installs: false
```

禁用后，需要可选依赖的后端会告知用户手动运行安装命令（`pip install …`）或通过 `hermes tools` 选择其他后端。