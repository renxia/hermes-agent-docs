---
sidebar_position: 8
title: "安全"
description: "安全模型、危险命令审批、用户授权、容器隔离以及生产环境部署最佳实践"
---

# 安全

Hermes 智能体采用纵深防御安全模型设计。本页面涵盖所有安全边界——从命令审批到容器隔离，再到消息平台上的用户授权。

## 概述

安全模型包含七个层级：

1. **用户授权** —— 谁可以与智能体对话（白名单、私信配对）
2. **危险命令审批** —— 对破坏性操作采用“人在回路”机制
3. **容器隔离** —— 使用加固配置的 Docker/Singularity/Modal 沙箱
4. **MCP 凭据过滤** —— 为 MCP 子进程实现环境变量隔离
5. **上下文文件扫描** —— 检测项目文件中的提示注入
6. **跨会话隔离** —— 会话之间无法访问彼此的数据或状态；定时任务存储路径经过加固，防止路径遍历攻击
7. **输入净化** —— 终端工具后端的当前工作目录参数会对照白名单进行验证，以防止 shell 注入

## 危险命令审批

在执行任何命令之前，Hermes 会将其与一组精心筛选的危险模式进行比对。如果发现匹配项，用户必须明确批准该命令。

### 审批模式

审批系统支持三种模式，可通过 `~/.hermes/config.yaml` 中的 `approvals.mode` 配置：

```yaml
approvals:
  mode: manual    # manual | smart | off
  timeout: 60     # 等待用户响应的秒数（默认：60）
```

| 模式 | 行为 |
|------|------|
| **manual**（默认） | 对危险命令始终提示用户审批 |
| **smart** | 使用辅助 LLM 评估风险。低风险命令（例如 `python -c "print('hello')"`) 自动批准。真正危险的命令自动拒绝。不确定的情况则升级为手动提示。 |
| **off** | 禁用所有审批检查 —— 等效于使用 `--yolo` 运行。所有命令均无需提示直接执行。 |

:::warning
设置 `approvals.mode: off` 会禁用所有安全提示。请仅在可信环境中使用（如 CI/CD、容器等）。
:::

### YOLO 模式

YOLO 模式会绕过当前会话的**所有**危险命令审批提示。可通过以下三种方式激活：

1. **CLI 标志**：使用 `hermes --yolo` 或 `hermes chat --yolo` 启动会话
2. **斜杠命令**：在会话中输入 `/yolo` 以切换开启/关闭
3. **环境变量**：设置 `HERMES_YOLO_MODE=1`

`/yolo` 命令是一个**切换开关** —— 每次使用都会翻转模式状态：

```
> /yolo
  ⚡ YOLO 模式已开启 — 所有命令自动批准。请谨慎使用。

> /yolo
  ⚠ YOLO 模式已关闭 — 危险命令将需要审批。
```

YOLO 模式在 CLI 和网关会话中均可用。其内部会设置 `HERMES_YOLO_MODE` 环境变量，该变量会在每次命令执行前被检查。

:::danger
YOLO 模式会禁用会话的**所有**危险命令安全检查 —— **但**硬性阻止列表（见下文）除外。请仅在完全信任所生成命令的情况下使用（例如在一次性环境中运行的经过充分测试的自动化脚本）。
:::

### 硬性阻止列表（始终生效的底线）

某些命令具有灾难性后果 —— 不可逆的文件系统擦除、分叉炸弹、直接块设备写入 —— Hermes 会拒绝运行这些命令，**无论**：

- `--yolo` / `/yolo` 已开启
- `approvals.mode: off`
- 在无头 `approve` 模式下运行的定时任务
- 用户明确点击“始终允许”

阻止列表是 `--yolo` 之下的底线。它会在审批层**看到命令之前**触发，且没有覆盖标志。当前涵盖的模式（非 exhaustive；与 `tools/approval.py::UNRECOVERABLE_BLOCKLIST` 保持同步）：

| 模式 | 为何是硬性阻止 |
|---|---|
| `rm -rf /` 及明显变体 | 擦除文件系统根目录 |
| `rm -rf --no-preserve-root /` | 显式的“是的，我指的是根目录”变体 |
| `:(){ :\|:& };:`（bash 分叉炸弹） | 导致主机卡死直至重启 |
| 在已挂载的根设备上执行 `mkfs.*` | 格式化正在运行的系统 |
| `dd if=/dev/zero of=/dev/sd*` | 将物理磁盘清零 |
| 将不可信 URL 通过管道传递给根文件系统顶层的 `sh` | 远程代码执行攻击向量过于宽泛，无法批准 |

如果命中阻止列表，工具调用会向智能体返回一条解释性错误信息，且不会执行任何操作。如果某个合法工作流需要使用这些命令之一（例如您是擦除并重装管道的操作者），请在智能体外部运行该命令。

### 审批超时

当出现危险命令提示时，用户有可配置的时间来响应。如果在超时时间内未收到响应，则默认**拒绝**该命令（故障关闭）。

在 `~/.hermes/config.yaml` 中配置超时时间：

```yaml
approvals:
  timeout: 60  # 秒（默认：60）
```

### 触发审批的内容

以下模式会触发审批提示（定义于 `tools/approval.py`）：

| 模式 | 描述 |
|---------|-------------|
| `rm -r` / `rm --recursive` | 递归删除 |
| `rm ... /` | 删除根路径下的内容 |
| `chmod 777/666` / `o+w` / `a+w` | 全局/其他用户可写权限 |
| `chmod --recursive` 配合不安全权限 | 递归全局/其他用户可写（长标志） |
| `chown -R root` / `chown --recursive root` | 递归将所有权更改为 root |
| `mkfs` | 格式化文件系统 |
| `dd if=` | 磁盘复制 |
| `> /dev/sd` | 写入块设备 |
| `DROP TABLE/DATABASE` | SQL DROP |
| `DELETE FROM`（无 WHERE 子句） | 无 WHERE 子句的 SQL DELETE |
| `TRUNCATE TABLE` | SQL TRUNCATE |
| `> /etc/` | 覆盖系统配置 |
| `systemctl stop/restart/disable/mask` | 停止/重启/禁用系统服务 |
| `kill -9 -1` | 杀死所有进程 |
| `pkill -9` | 强制杀死进程 |
| 分叉炸弹模式 | 分叉炸弹 |
| `bash -c` / `sh -c` / `zsh -c` / `ksh -c` | 通过 `-c` 标志执行 shell 命令（包括组合标志如 `-lc`） |
| `python -e` / `perl -e` / `ruby -e` / `node -c` | 通过 `-e`/`-c` 标志执行脚本 |
| `curl ... \| sh` / `wget ... \| sh` | 将远程内容通过管道传递给 shell |
| `bash <(curl ...)` / `sh <(wget ...)` | 通过进程替换执行远程脚本 |
| 使用 `tee` 写入 `/etc/`、`~/.ssh/`、`~/.hermes/.env` | 通过 tee 覆盖敏感文件 |
| 使用 `>` / `>>` 写入 `/etc/`、`~/.ssh/`、`~/.hermes/.env` | 通过重定向覆盖敏感文件 |
| `xargs rm` | 配合 rm 的 xargs |
| `find -exec rm` / `find -delete` | 配合破坏性操作的 find |
| `cp`/`mv`/`install` 到 `/etc/` | 将文件复制/移动到系统配置 |
| 对 `/etc/` 使用 `sed -i` / `sed --in-place` | 就地编辑系统配置 |
| `pkill`/`killall` hermes/gateway | 防止自我终止 |
| `gateway run` 配合 `&`/`disown`/`nohup`/`setsid` | 防止在服务管理器外启动网关 |

:::info
**容器绕过**：当在 `docker`、`singularity`、`modal`、`daytona` 或 `vercel_sandbox` 后端运行时，会**跳过**危险命令检查，因为容器本身是安全边界。容器内的破坏性命令无法危害主机。
:::

### 审批流程（CLI）

在交互式 CLI 中，危险命令会显示内联审批提示：

```
  ⚠️  危险命令：递归删除
      rm -rf /tmp/old-project

      [o]nce  |  [s]ession  |  [a]lways  |  [d]eny

      选择 [o/s/a/D]:
```

四个选项：

- **once** — 允许此次执行
- **session** — 允许此模式在剩余会话中使用
- **always** — 添加到永久允许列表（保存到 `config.yaml`）
- **deny**（默认） — 阻止该命令

### 审批流程（网关/消息）

在消息平台上，智能体将危险命令详情发送到聊天中，并等待用户回复：

- 回复 **yes**、**y**、**approve**、**ok** 或 **go** 以批准
- 回复 **no**、**n**、**deny** 或 **cancel** 以拒绝

运行网关时会自动设置 `HERMES_EXEC_ASK=1` 环境变量。

### 永久允许列表

使用“always”批准的命令会保存到 `~/.hermes/config.yaml`：

```yaml
# 永久允许的危险命令模式
command_allowlist:
  - rm
  - systemctl
```

这些模式会在启动时加载，并在所有未来会话中静默批准。

:::tip
使用 `hermes config edit` 查看或从永久允许列表中移除模式。
:::

## 用户授权（网关）

运行消息网关时，Hermes 通过分层授权系统控制谁可以与机器人交互。

### 授权检查顺序

`_is_user_authorized()` 方法按此顺序检查：

1. **每平台允许所有标志**（例如 `DISCORD_ALLOW_ALL_USERS=true`）
2. **DM 配对批准列表**（通过配对代码批准的用户）
3. **平台特定允许列表**（例如 `TELEGRAM_ALLOWED_USERS=12345,67890`）
4. **全局允许列表**（`GATEWAY_ALLOWED_USERS=12345,67890`）
5. **全局允许所有**（`GATEWAY_ALLOW_ALL_USERS=true`）
6. **默认：拒绝**

### 平台允许列表

在 `~/.hermes/.env` 中将允许的用户 ID 设置为逗号分隔的值：

```bash
# 平台特定允许列表
TELEGRAM_ALLOWED_USERS=123456789,987654321
DISCORD_ALLOWED_USERS=111222333444555666
WHATSAPP_ALLOWED_USERS=15551234567
SLACK_ALLOWED_USERS=U01ABC123

# 跨平台允许列表（针对所有平台检查）
GATEWAY_ALLOWED_USERS=123456789

# 每平台允许所有（谨慎使用）
DISCORD_ALLOW_ALL_USERS=true

# 全局允许所有（极度谨慎使用）
GATEWAY_ALLOW_ALL_USERS=true
```

:::warning
如果**未配置任何允许列表**且未设置 `GATEWAY_ALLOW_ALL_USERS`，则**所有用户都会被拒绝**。网关在启动时会记录警告：

```
未配置用户允许列表。所有未授权用户都将被拒绝。
请在 ~/.hermes/.env 中设置 GATEWAY_ALLOW_ALL_USERS=true 以允许开放访问，
或配置平台允许列表（例如 TELEGRAM_ALLOWED_USERS=your_id）。
```
:::

### DM 配对系统

为了实现更灵活的授权，Hermes 包含一个基于代码的配对系统。无需预先提供用户 ID，未知用户会收到一个一次性配对代码，机器人所有者可通过 CLI 批准该代码。

**工作原理：**

1. 未知用户向机器人发送 DM
2. 机器人回复一个 8 字符的配对代码
3. 机器人所有者运行 `hermes pairing approve <platform> <code>`（通过 CLI）
4. 该用户被永久批准用于该平台

在 `~/.hermes/config.yaml` 中控制如何处理未授权的 DM：

```yaml
unauthorized_dm_behavior: pair

whatsapp:
  unauthorized_dm_behavior: ignore
```

- `pair` 是默认值。未授权的 DM 会收到配对代码回复。
- `ignore` 静默丢弃未授权的 DM。
- 平台部分会覆盖全局默认值，因此您可以在 Telegram 上保持配对，同时让 WhatsApp 保持静默。

**安全特性**（基于 OWASP + NIST SP 800-63-4 指南）：

| 特性 | 详情 |
|---------|---------|
| 代码格式 | 8 字符，来自 32 字符的无歧义字母表（不含 0/O/1/I） |
| 随机性 | 加密级（`secrets.choice()`） |
| 代码 TTL | 1 小时过期 |
| 速率限制 | 每用户每 10 分钟 1 次请求 |
| 待处理限制 | 每平台最多 3 个待处理代码 |
| 锁定 | 5 次失败的批准尝试 → 1 小时锁定 |
| 文件安全 | 所有配对数据文件权限为 `chmod 0600` |
| 日志记录 | 代码永远不会记录到 stdout |

**配对 CLI 命令：**

```bash
# 列出待处理和已批准的用户
hermes pairing list

# 批准一个配对代码
hermes pairing approve telegram ABC12DEF

# 撤销用户的访问权限
hermes pairing revoke telegram 123456789

# 清除所有待处理代码
hermes pairing clear-pending
```

**存储：** 配对数据存储在 `~/.hermes/pairing/` 中，每个平台对应 JSON 文件：
- `{platform}-pending.json` — 待处理配对请求
- `{platform}-approved.json` — 已批准用户
- `_rate_limits.json` — 速率限制和锁定跟踪

## 容器隔离

当使用 `docker` 终端后端时，Hermes 会对每个容器应用严格的安全加固。

### Docker 安全标志

每个容器都会使用以下标志运行（定义在 `tools/environments/docker.py` 中）：

```python
_SECURITY_ARGS = [
    "--cap-drop", "ALL",                          # 移除所有 Linux 权限
    "--cap-add", "DAC_OVERRIDE",                  # 允许 root 写入绑定挂载的目录
    "--cap-add", "CHOWN",                         # 包管理器需要文件所有权
    "--cap-add", "FOWNER",                        # 包管理器需要文件所有权
    "--security-opt", "no-new-privileges",         # 阻止权限提升
    "--pids-limit", "256",                         # 限制进程数量
    "--tmpfs", "/tmp:rw,nosuid,size=512m",         # 限制大小的 /tmp
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
  docker_forward_env: []  # 仅显式允许列表；为空可防止机密信息进入容器
  container_cpu: 1        # CPU 核心数
  container_memory: 5120  # MB（默认 5GB）
  container_disk: 51200   # MB（默认 50GB，需要 XFS 上的 overlay2）
  container_persistent: true  # 跨会话持久化文件系统
```

### 文件系统持久化

- **持久化模式**（`container_persistent: true`）：从 `~/.hermes/sandboxes/docker/<task_id>/` 绑定挂载 `/workspace` 和 `/root`
- **临时模式**（`container_persistent: false`）：为工作区使用 tmpfs —— 清理时所有内容都会丢失

:::tip
对于生产网关部署，请使用 `docker`、`modal`、`daytona` 或 `vercel_sandbox` 后端，以将智能体命令与主机系统隔离。这完全消除了对危险命令审批的需求。
:::

:::warning
如果您向 `terminal.docker_forward_env` 添加名称，这些变量将有意注入到容器中用于终端命令。这对于任务特定的凭据（如 `GITHUB_TOKEN`）很有用，但也意味着在容器中运行的代码可以读取并外泄它们。
:::

## 终端后端安全比较

| 后端 | 隔离性 | 危险命令检查 | 最佳用途 |
|---------|-----------|-------------------|----------|
| **local** | 无 — 在主机上运行 | ✅ 是 | 开发、受信任用户 |
| **ssh** | 远程机器 | ✅ 是 | 在独立服务器上运行 |
| **docker** | 容器 | ❌ 跳过（容器即为边界） | 生产网关 |
| **singularity** | 容器 | ❌ 跳过 | 高性能计算环境 |
| **modal** | 云沙箱 | ❌ 跳过 | 可扩展的云隔离 |
| **daytona** | 云沙箱 | ❌ 跳过 | 持久化云工作区 |
| **vercel_sandbox** | 云微虚拟机 | ❌ 跳过 | 具有快照持久性的云执行 |

## 环境变量透传 {#environment-variable-passthrough}

`execute_code` 和 `terminal` 都会从子进程中剥离敏感环境变量，以防止 LLM 生成的代码窃取凭据。但声明了 `required_environment_variables` 的技能需要合法访问这些变量。

### 工作原理

有两种机制允许特定变量通过沙箱过滤器：

**1. 技能作用域透传（自动）**

当技能被加载时（通过 `skill_view` 或 `/skill` 命令），如果声明了 `required_environment_variables`，那么环境中实际设置的这些变量会自动注册为透传。缺失的变量（仍处于“需要设置”状态）**不会**被注册。

```yaml
# 在技能的 SKILL.md 前置元数据中
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: Tenor API 密钥
    help: 从 https://developers.google.com/tenor 获取密钥
```

加载此技能后，`TENOR_API_KEY` 会透传到 `execute_code`、`terminal`（本地）以及**远程后端（Docker、Modal）**——无需手动配置。

:::info Docker 和 Modal
在 v0.5.1 之前，Docker 的 `forward_env` 是一个与技能透传分离的系统。现在它们已合并——技能声明的环境变量会自动转发到 Docker 容器和 Modal 沙箱中，无需手动将其添加到 `docker_forward_env`。
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

某些技能需要在沙箱中访问**文件**（而不仅仅是环境变量）——例如，Google Workspace 将 OAuth 令牌存储为活动配置文件 `HERMES_HOME` 下的 `google_token.json`。技能在前置元数据中声明这些文件：

```yaml
required_credential_files:
  - path: google_token.json
    description: Google OAuth2 令牌（由设置脚本创建）
  - path: google_client_secret.json
    description: Google OAuth2 客户端凭据
```

加载后，Hermes 会检查这些文件是否存在于活动配置文件的 `HERMES_HOME` 中，并将其注册为挂载：

- **Docker**：只读绑定挂载（`-v 主机路径:容器路径:ro`）
- **Modal**：在沙箱创建时挂载 + 每次命令前同步（处理会话中 OAuth 设置）
- **本地**：无需操作（文件已可访问）

你也可以在 `config.yaml` 中手动列出凭据文件：

```yaml
terminal:
  credential_files:
    - google_token.json
    - my_custom_oauth_token.json
```

路径相对于 `~/.hermes/`。文件会被挂载到容器内的 `/root/.hermes/`。

### 各沙箱过滤规则

| 沙箱 | 默认过滤规则 | 透传覆盖 |
|---------|---------------|---------------------|
| **execute_code** | 阻止名称包含 `KEY`、`TOKEN`、`SECRET`、`PASSWORD`、`CREDENTIAL`、`PASSWD`、`AUTH` 的变量；仅允许安全前缀变量通过 | ✅ 透传变量绕过所有检查 |
| **terminal**（本地） | 阻止显式的 Hermes 基础设施变量（提供商密钥、网关令牌、工具 API 密钥） | ✅ 透传变量绕过阻止列表 |
| **terminal**（Docker） | 默认不传递任何主机环境变量 | ✅ 透传变量 + `docker_forward_env` 通过 `-e` 转发 |
| **terminal**（Modal） | 默认不传递任何主机环境变量/文件 | ✅ 凭据文件挂载；环境变量通过同步透传 |
| **MCP** | 除安全系统变量和显式配置的 `env` 外，阻止所有变量 | ❌ 不受透传影响（请使用 MCP 的 `env` 配置） |

### 安全注意事项

- 透传仅影响你或你的技能显式声明的变量——对于任意 LLM 生成的代码，默认安全态势保持不变
- 凭据文件以**只读**方式挂载到 Docker 容器中
- 技能卫士（Skills Guard）在安装前会扫描技能内容中可疑的环境变量访问模式
- 缺失/未设置的变量永远不会被注册（你无法泄露不存在的内容）
- Hermes 基础设施机密（提供商 API 密钥、网关令牌）绝不应添加到 `env_passthrough`——它们有专用机制

## MCP 凭据处理

MCP（模型上下文协议）服务器子进程接收**过滤后的环境**，以防止意外泄露凭据。

### 安全环境变量

只有以下变量会从主机传递到 MCP 标准输入/输出子进程：

```
PATH, HOME, USER, LANG, LC_ALL, TERM, SHELL, TMPDIR
```

以及任何 `XDG_*` 变量。所有其他环境变量（API 密钥、令牌、机密）都会被**剥离**。

在 MCP 服务器的 `env` 配置中显式定义的变量会被透传：

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_..."  # 仅传递此变量
```

### 凭据脱敏

MCP 工具返回的错误消息在传递给 LLM 前会被净化。以下模式会被替换为 `[REDACTED]`：

- GitHub 个人访问令牌（`ghp_...`）
- OpenAI 风格密钥（`sk-...`）
- Bearer 令牌
- `token=`、`key=`、`API_KEY=`、`password=`、`secret=` 参数

### 网站访问策略

你可以限制智能体通过其网页和浏览器工具可以访问哪些网站。这对于防止智能体访问内部服务、管理面板或其他敏感 URL 很有用。

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

当请求被阻止的 URL 时，工具会返回错误，说明该域名已被策略阻止。阻止列表适用于 `web_search`、`web_extract`、`browser_navigate` 以及所有支持 URL 的工具。

详见配置指南中的[网站阻止列表](/docs/user-guide/configuration#website-blocklist)。

### SSRF 防护

所有支持 URL 的工具（网页搜索、网页提取、视觉、浏览器）在获取 URL 前都会验证 URL，以防止服务器端请求伪造（SSRF）攻击。被阻止的地址包括：

- **私有网络**（RFC 1918）：`10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/16`
- **环回地址**：`127.0.0.0/8`、`::1`
- **链路本地地址**：`169.254.0.0/16`（包括云元数据地址 `169.254.169.254`）
- **CGNAT / 共享地址空间**（RFC 6598）：`100.64.0.0/10`（Tailscale、WireGuard VPN）
- **云元数据主机名**：`metadata.google.internal`、`metadata.goog`
- **保留地址、组播地址和未指定地址**

SSRF 防护对面向互联网的使用始终处于活动状态，DNS 失败被视为被阻止（故障关闭）。重定向链在每个跳转处都会重新验证，以防止基于重定向的绕过。

#### 有意允许私有 URL

某些设置需要合法访问私有/内部 URL——例如，将 `home.arpa` 解析为 RFC 1918 空间的家庭网络、仅限局域网的 Ollama/llama.cpp 端点、内部 Wiki、云元数据调试等。对于这些情况，有一个全局退出选项：

```yaml
security:
  allow_private_urls: true   # 默认值：false
```

启用后，网页工具、浏览器、视觉 URL 获取和网关媒体下载不再拒绝 RFC 1918 / 环回 / 链路本地 / CGNAT / 云元数据目标。**这是一个明确的可信边界**——仅在运行任意提示注入 URL 针对本地网络的智能体是可接受风险的设备上启用它。面向公众的网关应保持关闭状态。

无论此设置如何，主机子字符串防护（即使底层 IP 是公共的，也会阻止类似 Unicode 域名的技巧）都会保持启用状态。

### Tirith 执行前安全扫描

Hermes 集成了 [tirith](https://github.com/sheeki03/tirith)，用于在执行前进行内容级命令扫描。Tirith 可以检测到仅靠模式匹配会遗漏的威胁：

- 同形异义字 URL 欺骗（国际化域名攻击）
- 管道到解释器模式（`curl | bash`、`wget | sh`）
- 终端注入攻击

Tirith 会在首次使用时从 GitHub 发布版本自动安装，并进行 SHA-256 校验和验证（如果 cosign 可用，还会进行 cosign 来源验证）。

```yaml
# 在 ~/.hermes/config.yaml 中
security:
  tirith_enabled: true       # 启用/禁用 tirith 扫描（默认值：true）
  tirith_path: "tirith"      # tirith 二进制文件路径（默认值：PATH 查找）
  tirith_timeout: 5          # 子进程超时（秒）
  tirith_fail_open: true     # 当 tirith 不可用时允许执行（默认值：true）
```

当 `tirith_fail_open` 为 `true`（默认值）时，如果 tirith 未安装或超时，命令仍会继续执行。在高安全环境中将其设置为 `false`，以在 tirith 不可用时阻止命令执行。

Tirith 的裁决会集成到审批流程中：安全命令直接通过，而可疑和被阻止的命令都会触发用户审批，并显示完整的 tirith 发现结果（严重性、标题、描述、更安全的替代方案）。用户可以批准或拒绝——默认选择是拒绝，以保持无人值守场景的安全性。

### 上下文文件注入防护

上下文文件（AGENTS.md、.cursorrules、SOUL.md）在包含到系统提示前会进行提示注入扫描。扫描器会检查：

- 忽略/ disregard 先前指令的指令
- 包含可疑关键词的隐藏 HTML 注释
- 尝试读取机密（`.env`、`credentials`、`.netrc`）
- 通过 `curl` 窃取凭据
- 不可见 Unicode 字符（零宽空格、双向覆盖）

被阻止的文件会显示警告：

```
[被阻止：AGENTS.md 包含潜在的提示注入（prompt_injection）。内容未加载。]
```

## 生产环境部署最佳实践

### 网关部署检查清单

1. **设置显式白名单** — 切勿在生产环境中使用 `GATEWAY_ALLOW_ALL_USERS=true`
2. **使用容器后端** — 在 config.yaml 中设置 `terminal.backend: docker`
3. **限制资源配额** — 设置适当的 CPU、内存和磁盘限制
4. **安全存储密钥** — 将 API 密钥保存在 `~/.hermes/.env` 中，并设置正确的文件权限
5. **启用 DM 配对** — 尽可能使用配对码而非硬编码用户 ID
6. **审查命令白名单** — 定期审计 config.yaml 中的 `command_allowlist`
7. **设置 `MESSAGING_CWD`** — 不要让智能体在敏感目录中运行
8. **以非 root 身份运行** — 切勿以 root 身份运行网关
9. **监控日志** — 检查 `~/.hermes/logs/` 中的未授权访问尝试
10. **保持更新** — 定期运行 `hermes update` 以获取安全补丁

### 保护 API 密钥

```bash
# 为 .env 文件设置正确的权限
chmod 600 ~/.hermes/.env

# 为不同服务使用不同的密钥
# 切勿将 .env 文件提交到版本控制系统
```

### 网络隔离

为了最大程度的安全性，请在单独的机器或虚拟机上运行网关：

```yaml
terminal:
  backend: ssh
  ssh_host: "agent-worker.local"
  ssh_user: "hermes"
  ssh_key: "~/.ssh/hermes_agent_key"
```

这将使网关的消息传递连接与智能体的命令执行环境隔离。