---
sidebar_position: 8
title: "安全"
description: "安全模型、危险命令审批、用户授权、容器隔离以及生产环境部署最佳实践"
---

# 安全性

Hermes 智能体采用纵深防御的安全模型进行设计。本页涵盖每一个安全边界——从命令审批到容器隔离，再到消息平台上的用户授权。

## 概述

安全模型包含七个层次：

1.  **用户授权** — 谁可以与该智能体对话（允许名单、私信配对）
2.  **危险命令审批** — 针对破坏性操作的“人在回路”机制
3.  **容器隔离** — 采用强化配置的 Docker/Singularity/Modal 沙箱
4.  **MCP 凭证过滤** — 为 MCP 子进程提供环境变量隔离
5.  **上下文文件扫描** — 检测项目文件中的提示注入攻击
6.  **跨会话隔离** — 各会话无法访问彼此的数据或状态；定时任务的存储路径经过加固，可防御路径遍历攻击
7.  **输入净化** — 终端工具后端中的工作目录参数将根据允许名单进行验证，以防止 Shell 注入

# 危险命令批准

在执行任何命令之前，Hermes 会将其与危险模式列表进行比对检查。如果匹配到危险模式，用户必须明确批准才能执行。

### 批准模式

批准系统支持三种模式，通过 `~/.hermes/config.yaml` 中的 `approvals.mode` 进行配置：

```yaml
approvals:
  mode: manual    # manual | smart | off
  timeout: 60     # 等待用户响应的秒数（默认：60）
```

| 模式 | 行为 |
|------|----------|
| **manual**（默认） | 对危险命令始终提示用户进行批准 |
| **smart** | 使用辅助 LLM 评估风险。低风险命令（例如，`python -c "print('hello')"`) 会被自动批准。真正危险的命令会被自动拒绝。不确定的情况会升级为手动提示。 |
| **off** | 禁用所有批准检查 — 等同于使用 `--yolo` 运行。所有命令均无需提示即可执行。 |

:::warning
设置 `approvals.mode: off` 会禁用所有安全提示。仅在受信任的环境（CI/CD、容器等）中使用。
:::

### YOLO 模式

YOLO 模式会绕过当前会话的**所有**危险命令批准提示。可以通过三种方式激活：

1.  **CLI 标志**：使用 `hermes --yolo` 或 `hermes chat --yolo` 启动会话
2.  **斜杠命令**：在会话期间输入 `/yolo` 以切换开关
3.  **环境变量**：设置 `HERMES_YOLO_MODE=1`

`/yolo` 命令是一个**开关** — 每次使用都会切换模式的开或关：

```
> /yolo
  ⚡ YOLO 模式已开启 — 所有命令将被自动批准。请谨慎使用。

> /yolo
  ⚠ YOLO 模式已关闭 — 危险命令将需要批准。
```

YOLO 模式在 CLI 和网关会话中均可用。在内部，它会设置 `HERMES_YOLO_MODE` 环境变量，并在每次执行命令前进行检查。

:::danger
YOLO 模式会禁用会话中**所有**的危险命令安全检查 — **但**硬性阻止列表（见下文）除外。仅当您完全信任生成的命令时才使用（例如，在一次性环境中运行经过充分测试的自动化脚本）。
:::

### 硬性阻止列表（始终生效的底线）

某些命令是如此具有灾难性 — 不可逆的文件系统擦除、叉形炸弹、直接写入块设备 — 以至于 Hermes **无论**以下情况都会拒绝运行它们：

-   `--yolo` / `/yolo` 已切换为开启
-   `approvals.mode: off`
-   Cron 作业在无头 `approve` 模式下运行
-   用户明确点击了“始终允许”

该阻止列表是 `--yolo` 之下的底线。它在批准层看到命令**之前**就会触发，并且没有覆盖标志。当前涵盖的模式（非详尽；与 `tools/approval.py::UNRECOVERABLE_BLOCKLIST` 保持同步）：

| 模式 | 为何是硬性阻止 |
|---|---|
| `rm -rf /` 及其明显变体 | 擦除文件系统根目录 |
| `rm -rf --no-preserve-root /` | 明确的“是的，我指的就是根目录”变体 |
| `:(){ :\|:& };:` （bash 叉形炸弹） | 主机负载过高直至重启 |
| 在已挂载的根设备上执行 `mkfs.*` | 格式化活动系统 |
| `dd if=/dev/zero of=/dev/sd*` | 清零物理磁盘 |
| 在根文件系统顶层将不受信任的 URL 通过管道传递给 `sh` | 远程代码执行攻击向量过于广泛，无法批准 |

如果您触发了阻止列表，工具调用会向智能体返回一条解释性错误信息，并且不会执行任何操作。如果合法工作流需要使用这些命令之一（例如，您是擦除和重装管道的操作员），请在智能体外部运行它。

### 批准超时

当出现危险命令提示时，用户有可配置的时间进行响应。如果在超时时间内未收到响应，默认情况下命令将被**拒绝**（失败即关闭）。

在 `~/.hermes/config.yaml` 中配置超时时间：

```yaml
approvals:
  timeout: 60  # 秒（默认：60）
```

### 什么会触发批准

以下模式会触发批准提示（在 `tools/approval.py` 中定义）：

| 模式 | 描述 |
|---------|-------------|
| `rm -r` / `rm --recursive` | 递归删除 |
| `rm ... /` | 在根路径中删除 |
| `chmod 777/666` / `o+w` / `a+w` | 世界/其他用户可写权限 |
| `chmod --recursive` 配合不安全权限 | 递归世界/其他用户可写（长标志） |
| `chown -R root` / `chown --recursive root` | 递归将所有者更改为 root |
| `mkfs` | 格式化文件系统 |
| `dd if=` | 磁盘复制 |
| `> /dev/sd` | 写入块设备 |
| `DROP TABLE/DATABASE` | SQL DROP |
| `DELETE FROM`（没有 WHERE） | 没有 WHERE 的 SQL DELETE |
| `TRUNCATE TABLE` | SQL TRUNCATE |
| `> /etc/` | 覆盖系统配置 |
| `systemctl stop/restart/disable/mask` | 停止/重启/禁用系统服务 |
| `kill -9 -1` | 杀死所有进程 |
| `pkill -9` | 强制杀死进程 |
| 叉形炸弹模式 | 叉形炸弹 |
| `bash -c` / `sh -c` / `zsh -c` / `ksh -c` | 通过 `-c` 标志执行 shell 命令（包括组合标志如 `-lc`） |
| `python -e` / `perl -e` / `ruby -e` / `node -c` | 通过 `-e`/`-c` 标志执行脚本 |
| `curl ... \| sh` / `wget ... \| sh` | 将远程内容通过管道传递给 shell |
| `bash <(curl ...)` / `sh <(wget ...)` | 通过进程替换执行远程脚本 |
| `tee` 到 `/etc/`、`~/.ssh/`、`~/.hermes/.env` | 通过 tee 覆盖敏感文件 |
| `>` / `>>` 到 `/etc/`、`~/.ssh/`、`~/.hermes/.env` | 通过重定向覆盖敏感文件 |
| `xargs rm` | xargs 配合 rm |
| `find -exec rm` / `find -delete` | find 配合破坏性操作 |
| `cp`/`mv`/`install` 到 `/etc/` | 将文件复制/移动到系统配置目录 |
| `sed -i` / `sed --in-place` 在 `/etc/` 上 | 就地编辑系统配置 |
| `pkill`/`killall` hermes/gateway | 防止自我终止 |
| `gateway run` 配合 `&`/`disown`/`nohup`/`setsid` | 防止在服务管理器外部启动网关 |

:::info
**容器绕过**：当在 `docker`、`singularity`、`modal`、`daytona` 或 `vercel_sandbox` 后端中运行时，危险命令检查会被**跳过**，因为容器本身就是安全边界。容器内的破坏性命令无法损害主机。
:::

### 批准流程（CLI）

在交互式 CLI 中，危险命令会显示内联批准提示：

```
  ⚠️  危险命令：递归删除
      rm -rf /tmp/old-project

      [o]单次  |  [s]会话  |  [a]始终  |  [d]拒绝

      选择 [o/s/a/D]：
```

四个选项：

-   **once** — 允许此单次执行
-   **session** — 允许此模式在会话的剩余时间内生效
-   **always** — 添加到永久允许列表（保存到 `config.yaml`）
-   **deny**（默认） — 阻止命令

### 批准流程（网关/消息传递）

在消息传递平台上，智能体会将危险命令的详细信息发送到聊天中，并等待用户回复：

-   回复 **yes**、**y**、**approve**、**ok** 或 **go** 以批准
-   回复 **no**、**n**、**deny** 或 **cancel** 以拒绝

运行网关时，环境变量 `HERMES_EXEC_ASK=1` 会自动设置。

### 永久允许列表

使用“always”批准的命令会保存到 `~/.hermes/config.yaml`：

```yaml
# 永久允许的危险命令模式
command_allowlist:
  - rm
  - systemctl
```

这些模式会在启动时加载，并在所有未来的会话中静默批准。

:::tip
使用 `hermes config edit` 来查看或删除永久允许列表中的模式。
:::

## 用户授权（网关）

当运行消息网关时，Hermes 通过分层授权系统控制谁可以与机器人交互。

### 授权检查顺序

`_is_user_authorized()` 方法按以下顺序进行检查：

1.  **每平台允许所有用户标志**（例如，`DISCORD_ALLOW_ALL_USERS=true`）
2.  **DM 配对批准列表**（通过配对码批准的用户）
3.  **平台特定允许列表**（例如，`TELEGRAM_ALLOWED_USERS=12345,67890`）
4.  **全局允许列表**（`GATEWAY_ALLOWED_USERS=12345,67890`）
5.  **全局允许所有用户**（`GATEWAY_ALLOW_ALL_USERS=true`）
6.  **默认：拒绝**

### 平台允许列表

在 `~/.hermes/.env` 中将允许的用户 ID 设置为逗号分隔的值：

```bash
# 平台特定允许列表
TELEGRAM_ALLOWED_USERS=123456789,987654321
DISCORD_ALLOWED_USERS=111222333444555666
WHATSAPP_ALLOWED_USERS=15551234567
SLACK_ALLOWED_USERS=U01ABC123

# 跨平台允许列表（对所有平台进行检查）
GATEWAY_ALLOWED_USERS=123456789

# 每平台允许所有用户（谨慎使用）
DISCORD_ALLOW_ALL_USERS=true

# 全局允许所有用户（极度谨慎使用）
GATEWAY_ALLOW_ALL_USERS=true
```

:::warning
如果**未配置任何允许列表**且未设置 `GATEWAY_ALLOW_ALL_USERS`，**所有用户都将被拒绝**。网关在启动时会记录一条警告：

```
未配置用户允许列表。所有未经授权的用户将被拒绝。
在 ~/.hermes/.env 中设置 GATEWAY_ALLOW_ALL_USERS=true 以允许开放访问，
或配置平台允许列表（例如，TELEGRAM_ALLOWED_USERS=your_id）。
```
:::

### DM 配对系统

为了实现更灵活的授权，Hermes 包含一个基于代码的配对系统。无需预先提供用户 ID，未知用户会收到一个一次性配对码，然后由机器人所有者通过 CLI 批准。

**工作原理：**

1.  未知用户向机器人发送 DM
2.  机器人回复一个 8 位字符的配对码
3.  机器人所有者在 CLI 上运行 `hermes pairing approve <platform> <code>`
4.  该用户在该平台上获得永久批准

在 `~/.hermes/config.yaml` 中控制未经授权的私信的处理方式：

```yaml
unauthorized_dm_behavior: pair

whatsapp:
  unauthorized_dm_behavior: ignore
```

-   `pair` 是默认值。未经授权的私信会收到配对码回复。
-   `ignore` 会静默丢弃未经授权的私信。
-   平台部分会覆盖全局默认值，因此您可以在 Telegram 上保留配对功能，同时在 WhatsApp 上保持静默。

**安全特性**（基于 OWASP + NIST SP 800-63-4 指南）：

| 特性 | 详情 |
|---------|---------|
| 代码格式 | 来自 32 字符无歧义字母表的 8 位字符（无 0/O/1/I） |
| 随机性 | 加密安全（`secrets.choice()`） |
| 代码 TTL | 1 小时过期 |
| 速率限制 | 每用户每 10 分钟 1 个请求 |
| 待处理限制 | 每个平台最多 3 个待处理代码 |
| 锁定 | 5 次批准尝试失败 → 锁定 1 小时 |
| 文件安全 | 对所有配对数据文件设置 `chmod 0600` |
| 日志记录 | 代码永远不会记录到标准输出 |

**配对 CLI 命令：**

```bash
# 列出待处理和已批准的用户
hermes pairing list

# 批准一个配对码
hermes pairing approve telegram ABC12DEF

# 撤销用户的访问权限
hermes pairing revoke telegram 123456789

# 清除所有待处理的代码
hermes pairing clear-pending
```

**存储：** 配对数据存储在 `~/.hermes/pairing/` 中，并为每个平台创建独立的 JSON 文件：
-   `{platform}-pending.json` — 待处理的配对请求
-   `{platform}-approved.json` — 已批准的用户
-   `_rate_limits.json` — 速率限制和锁定跟踪

# 容器隔离

使用 `docker` 终端后端时，Hermes 会对每个容器应用严格的安全加固。

### Docker 安全标志

每个容器都使用这些标志运行（在 `tools/environments/docker.py` 中定义）：

```python
_SECURITY_ARGS = [
    "--cap-drop", "ALL",                          # 移除所有 Linux 能力
    "--cap-add", "DAC_OVERRIDE",                  # 根用户可写入绑定挂载目录
    "--cap-add", "CHOWN",                         # 包管理器需要文件所有权
    "--cap-add", "FOWNER",                        # 包管理器需要文件所有权
    "--security-opt", "no-new-privileges",         # 阻止权限提升
    "--pids-limit", "256",                         # 限制进程数
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
  docker_forward_env: []  # 仅限显式允许列表；为空则防止机密信息进入容器
  container_cpu: 1        # CPU 核心数
  container_memory: 5120  # MB（默认 5GB）
  container_disk: 51200   # MB（默认 50GB，需要 XFS 上的 overlay2）
  container_persistent: true  # 跨会话持久化文件系统
```

### 文件系统持久性

- **持久模式** (`container_persistent: true`): 从 `~/.hermes/sandboxes/docker/<task_id>/` 绑定挂载 `/workspace` 和 `/root`
- **临时模式** (`container_persistent: false`): 使用 tmpfs 作为工作区 — 清理时所有内容将丢失

:::tip
对于生产网关部署，请使用 `docker`、`modal`、`daytona` 或 `vercel_sandbox` 后端来隔离智能体命令与您的主机系统。这完全消除了对危险命令批准的需求。
:::

:::warning
如果您将名称添加到 `terminal.docker_forward_env` 中，这些变量会被故意注入到容器中以供终端命令使用。这对于像 `GITHUB_TOKEN` 这样的特定任务凭证很有用，但这也意味着在容器中运行的代码可以读取并泄露它们。
:::

## 终端后端安全性比较

| 后端 | 隔离性 | 危险命令检查 | 最适合用于 |
|------|--------|-------------|----------|
| **local** | 无 — 在主机上运行 | ✅ 是 | 开发、受信任用户 |
| **ssh** | 远程机器 | ✅ 是 | 在单独服务器上运行 |
| **docker** | 容器 | ❌ 跳过（容器即边界） | 生产网关 |
| **singularity** | 容器 | ❌ 跳过 | 高性能计算环境 |
| **modal** | 云沙盒 | ❌ 跳过 | 可扩展的云隔离 |
| **daytona** | 云沙盒 | ❌ 跳过 | 持久的云工作区 |
| **vercel_sandbox** | 云微虚拟机 | ❌ 跳过 | 具有快照持久性的云执行 |

## 环境变量传递 {#environment-variable-passthrough}

`execute_code` 和 `terminal` 会从子进程中剥离敏感的环境变量，以防止 LLM 生成的代码窃取凭证。然而，声明了 `required_environment_variables` 的技能确实需要访问这些变量。

### 工作原理

有两种机制允许特定变量通过沙箱过滤器：

**1. 技能作用域传递（自动）**

当一个技能被加载（通过 `skill_view` 或 `/skill` 命令）并声明了 `required_environment_variables` 时，那些确实在环境中设置过的变量会被自动注册为可传递。缺失的变量（仍处于待设置状态）**不会**被注册。

```yaml
# 在技能的 SKILL.md 前端数据中
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: Tenor API 密钥
    help: 从 https://developers.google.com/tenor 获取密钥
```

加载此技能后，`TENOR_API_KEY` 会被传递到 `execute_code`、`terminal`（本地）**和远程后端（Docker、Modal）**——无需手动配置。

:::info Docker 与 Modal
在 v0.5.1 之前，Docker 的 `forward_env` 与技能传递是独立的系统。现在它们已合并——技能声明的环境变量会自动转发到 Docker 容器和 Modal 沙箱中，无需手动将其添加到 `docker_forward_env`。
:::

**2. 基于配置的传递（手动）**

对于未由任何技能声明的环境变量，请将它们添加到 `config.yaml` 中的 `terminal.env_passthrough`：

```yaml
terminal:
  env_passthrough:
    - MY_CUSTOM_KEY
    - ANOTHER_TOKEN
```

### 凭证文件传递（OAuth 令牌等） {#credential-file-passthrough}

某些技能需要沙箱中的**文件**（而不仅仅是环境变量）——例如，Google Workspace 将 OAuth 令牌存储为活动配置文件的 `HERMES_HOME` 下的 `google_token.json`。技能在前端数据中声明这些文件：

```yaml
required_credential_files:
  - path: google_token.json
    description: Google OAuth2 令牌（由设置脚本创建）
  - path: google_client_secret.json
    description: Google OAuth2 客户端凭证
```

加载后，Hermes 会检查这些文件是否存在于活动配置文件的 `HERMES_HOME` 中，并将其注册为待挂载：

- **Docker**：只读绑定挂载（`-v host:container:ro`）
- **Modal**：在沙箱创建时挂载 + 每个命令执行前同步（处理会话中的 OAuth 设置）
- **本地**：无需操作（文件已可访问）

您也可以在 `config.yaml` 中手动列出凭证文件：

```yaml
terminal:
  credential_files:
    - google_token.json
    - my_custom_oauth_token.json
```

路径相对于 `~/.hermes/`。文件被挂载到容器内的 `/root/.hermes/`。

### 每种沙箱的过滤内容

| 沙箱          | 默认过滤                                                                 | 传递覆盖                                                                 |
|---------------|--------------------------------------------------------------------------|--------------------------------------------------------------------------|
| **execute_code** | 阻止名称中包含 `KEY`、`TOKEN`、`SECRET`、`PASSWORD`、`CREDENTIAL`、`PASSWD`、`AUTH` 的变量；仅允许具有安全前缀的变量通过 | ✅ 传递变量可绕过两项检查                                                  |
| **terminal**（本地） | 阻止明确的 Hermes 基础设施变量（提供者密钥、网关令牌、工具 API 密钥）     | ✅ 传递变量可绕过阻止列表                                                  |
| **terminal**（Docker） | 默认不传递主机环境变量                                                   | ✅ 传递变量 + `docker_forward_env` 通过 `-e` 转发                          |
| **terminal**（Modal） | 默认不传递主机环境变量/文件                                              | ✅ 凭证文件被挂载；环境变量通过同步传递                                    |
| **MCP**         | 阻止除安全系统变量 + 显式配置的 `env` 之外的所有内容                       | ❌ 不受传递影响（请改用 MCP `env` 配置）                                   |

### 安全考量

- 传递机制仅影响您或您的技能显式声明的变量——对于任意 LLM 生成的代码，默认安全态势不变
- 凭证文件以**只读**方式挂载到 Docker 容器中
- Skills Guard 会在安装前扫描技能内容中是否存在可疑的环境访问模式
- 缺失/未设置的变量永远不会被注册（您无法泄露不存在的东西）
- Hermes 基础设施密钥（提供者 API 密钥、网关令牌）永远不应添加到 `env_passthrough`——它们有专用机制

## MCP 凭证处理

MCP（模型上下文协议）服务器子进程会接收一个**经过过滤的环境**，以防止意外的凭证泄露。

### 安全环境变量

只有以下变量会从主机传递到 MCP 标准输入子进程：

```
PATH, HOME, USER, LANG, LC_ALL, TERM, SHELL, TMPDIR
```

加上任何 `XDG_*` 变量。所有其他环境变量（API 密钥、令牌、密钥）都会被**剥离**。

在 MCP 服务器的 `env` 配置中明确定义的变量会被传递：

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_..."  # 仅传递此变量
```

### 凭证编辑

来自 MCP 工具的错误消息在返回给 LLM 前会被清理。以下模式会被替换为 `[REDACTED]`：

- GitHub PATs（`ghp_...`）
- OpenAI 风格的密钥（`sk-...`）
- Bearer 令牌
- `token=`、`key=`、`API_KEY=`、`password=`、`secret=` 参数

### 网站访问策略

您可以通过智能体的网络和浏览器工具限制其可访问的网站。这对于防止智能体访问内部服务、管理面板或其他敏感 URL 很有用。

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

当请求被阻止的 URL 时，工具会返回一个错误，说明该域名根据策略被阻止。阻止列表在 `web_search`、`web_extract`、`browser_navigate` 以及所有支持 URL 的工具中强制执行。

完整详情请参阅配置指南中的[网站阻止列表](/docs/user-guide/configuration#website-blocklist)。

### SSRF 防护

所有支持 URL 的工具（网络搜索、网络提取、视觉、浏览器）在获取 URL 前会对其进行验证，以防止服务器端请求伪造（SSRF）攻击。被阻止的地址包括：

- **专用网络**（RFC 1918）：`10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/16`
- **环回地址**：`127.0.0.0/8`、`::1`
- **链路本地**：`169.254.0.0/16`（包括 `169.254.169.254` 的云元数据）
- **CGNAT / 共享地址空间**（RFC 6598）：`100.64.0.0/10`（Tailscale、WireGuard VPNs）
- **云元数据主机名**：`metadata.google.internal`、`metadata.goog`
- **保留、组播和未指定地址**

SSRF 防护对于面向互联网的用途始终处于活动状态，DNS 故障被视为被阻止（默认关闭失败）。重定向链会在每一跳重新验证，以防止基于重定向的绕过。

#### 允许使用私有 URL

某些设置确实需要私有/内部 URL 访问——将 `home.arpa` 解析到 RFC 1918 空间的家庭网络、仅限局域网的 Ollama/llama.cpp 端点、内部维基、云元数据调试等。对于这些情况，有一个全局退出选项：

```yaml
security:
  allow_private_urls: true   # 默认：false
```

开启后，网络工具、浏览器、视觉 URL 获取和网关媒体下载将不再拒绝 RFC 1918 / 环回 / 链路本地 / CGNAT / 云元数据目标。**这是一个明确的信任边界**——仅在智能体运行任意提示注入的 URL 攻击本地网络属于可接受风险的机器上启用它。面向公众的网关应将其保持关闭状态。

主机子字符串保护（即使底层 IP 是公共的，也会阻止外观相似的 Unicode 域名技巧）无论此设置如何都会保持开启。

### Tirith 执行前安全扫描

Hermes 集成了 [tirith](https://github.com/sheeki03/tirith)，用于在执行前进行内容级别的命令扫描。Tirith 可以检测模式匹配单独遗漏的威胁：

- 同形异义 URL 欺骗（国际化域名攻击）
- 管道到解释器模式（`curl | bash`、`wget | sh`）
- 终端注入攻击

Tirith 在首次使用时会从 GitHub 发布版自动安装，并进行 SHA-256 校验和验证（如果可用，还会进行 cosign 来源验证）。

```yaml
# 在 ~/.hermes/config.yaml 中
security:
  tirith_enabled: true       # 启用/禁用 tirith 扫描（默认：true）
  tirith_path: "tirith"      # tirith 二进制文件路径（默认：在 PATH 中查找）
  tirith_timeout: 5          # 子进程超时（秒）
  tirith_fail_open: true     # 当 tirith 不可用时允许执行（默认：true）
```

当 `tirith_fail_open` 为 `true`（默认）时，如果 tirith 未安装或超时，命令将继续执行。在高安全环境中设置为 `false`，以便在 tirith 不可用时阻止命令。

Tirith 的裁决与审批流程集成：安全命令直接通过，而可疑和被阻止的命令会触发用户审批，并显示完整的 tirith 调查结果（严重性、标题、描述、更安全的替代方案）。用户可以批准或拒绝——默认选择是拒绝，以保持无人值守场景的安全性。

### 上下文文件注入防护

上下文文件（AGENTS.md、.cursorrules、SOUL.md）在包含到系统提示词之前会被扫描是否存在提示注入。扫描器检查：

- 指示忽略/无视先前指令的内容
- 包含可疑关键字的隐藏 HTML 注释
- 尝试读取密钥（`.env`、`credentials`、`.netrc`）
- 通过 `curl` 进行的凭证外泄
- 不可见的 Unicode 字符（零宽度空格、双向覆盖）

被阻止的文件会显示警告：

```
[BLOCKED: AGENTS.md contained potential prompt injection (prompt_injection). Content not loaded.]
```

## 生产环境部署最佳实践

### 网关部署检查清单

1. **设置明确的允许列表** — 生产环境中绝不要使用 `GATEWAY_ALLOW_ALL_USERS=true`
2. **使用容器后端** — 在 config.yaml 中设置 `terminal.backend: docker`
3. **限制资源使用** — 设置适当的 CPU、内存和磁盘限制
4. **安全存储密钥** — 将 API 密钥保存在 `~/.hermes/.env` 并设置适当的文件权限
5. **启用 DM 配对** — 尽可能使用配对码，而非硬编码用户 ID
6. **审阅命令允许列表** — 定期审计 config.yaml 中的 `command_allowlist`
7. **设置 `MESSAGING_CWD`** — 不要让智能体在敏感目录下运行
8. **以非 root 用户运行** — 切勿以 root 身份运行网关
9. **监控日志** — 检查 `~/.hermes/logs/` 以发现未授权访问尝试
10. **保持更新** — 定期运行 `hermes update` 以获取安全补丁

### 保护 API 密钥

```bash
# 为 .env 文件设置合适的权限
chmod 600 ~/.hermes/.env

# 为不同的服务使用不同的密钥
# 永远不要将 .env 文件提交到版本控制中
```

### 网络隔离

为了最大安全性，请在单独的机器或虚拟机上运行网关。在 `config.yaml` 中设置 `terminal.backend: ssh`，然后通过 `~/.hermes/.env` 中的环境变量提供主机详情：

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

SSH 连接详情存储在 `.env` (而非 `config.yaml`) 中，因此它们不会被签入或与配置文件导出一起共享。这使得网关的消息连接与智能体的命令执行保持分离。