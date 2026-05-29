---
sidebar_position: 8
title: "安全"
description: "安全模型、危险命令审批、用户授权、容器隔离以及生产环境部署最佳实践"
---

# 安全

Hermes 智能体采用纵深防御的安全模型。本页面涵盖所有安全边界——从命令审批、容器隔离到消息平台的用户授权。

## 概览

安全模型包含七个层级：

1. **用户授权** — 谁可以与智能体对话（白名单、直接消息配对）
2. **危险命令审批** — 对破坏性操作进行人工介入的循环审批
3. **容器隔离** — 使用 Docker/Singularity/Modal 进行沙箱化隔离，并采用强化设置
4. **MCP 凭证过滤** — 为 MCP 子进程进行环境变量隔离
5. **上下文文件扫描** — 检测项目文件中的提示注入攻击
6. **跨会话隔离** — 会话之间无法访问彼此的数据或状态；计划任务存储路径经过加固，以防路径遍历攻击
7. **输入清理** — 终端工具后端的工作目录参数将通过白名单进行验证，以防止 Shell 注入

## 危险命令审批

在执行任何命令之前，Hermes 会将其与精心策划的危险模式列表进行比对。如果匹配，则用户必须明确批准。

### 审批模式

审批系统支持三种模式，通过 `~/.hermes/config.yaml` 中的 `approvals.mode` 进行配置：

```yaml
approvals:
  mode: manual                    # manual | smart | off
  timeout: 60                     # 等待用户响应的秒数（默认：60）
  cron_mode: deny                 # deny | approve — 当 cron 作业触发危险命令提示时的行为
  mcp_reload_confirm: true        # /reload-mcp 在使 MCP 工具缓存失效前会请求确认
  destructive_slash_confirm: true # /clear, /new, /reset, /undo 在丢弃状态前会提示确认
```

完整的键列表：

| 键 | 默认值 | 控制内容 |
|---|---|---|
| `mode` | `manual` | 危险 shell 命令的审批策略——见下表。 |
| `timeout` | `60` | Hermes 等待审批回复超时的秒数。 |
| `cron_mode` | `deny` | 当[定时任务](./features/cron.md)在无头环境下触发危险命令提示时如何表现。`deny` 会阻止命令（智能体必须找到另一条路径）；`approve` 在定时任务上下文中自动批准所有命令。 |
| `mcp_reload_confirm` | `true` | 当为 `true` 时，`/reload-mcp` 在重建 MCP 工具集前会请求确认。重建会使提供者的提示缓存失效（工具模式存在于系统提示中），因此下一条消息会重新发送完整的输入 token。点击 **始终批准** 的用户会将此键设为 `false`。 |
| `destructive_slash_confirm` | `true` | 当为 `true` 时，破坏性的会话斜杠命令（`/clear`、`/new`、`/reset`、`/undo`）在丢弃对话状态前会提示确认。三选项对话框（批准一次 / 始终批准 / 取消）通过 Telegram、Discord 和 Slack 上的原生是/否按钮路由；其他地方使用文本回退。点击 **始终批准** 的用户会将此键设为 `false`。TUI 使用自己的模态覆盖层（设置 `HERMES_TUI_NO_CONFIRM=1` 可在 TUI 中选择退出）。 |

| 模式 | 行为 |
|------|----------|
| **manual**（默认） | 始终就危险命令提示用户批准 |
| **smart** | 使用辅助 LLM 评估风险。低风险命令（例如 `python -c "print('hello')"）会自动批准。真正危险的命令会自动拒绝。不确定的情况会升级到手动提示。 |
| **off** | 禁用所有审批检查——相当于使用 `--yolo` 运行。所有命令无需提示即可执行。 |

:::warning
设置 `approvals.mode: off` 会禁用所有安全提示。仅在受信任的环境中使用（CI/CD、容器等）。
:::

### YOLO 模式

YOLO 模式会绕过当前会话的**所有**危险命令审批提示。可以通过三种方式激活：

1. **CLI 标志**：使用 `hermes --yolo` 或 `hermes chat --yolo` 开始一个会话
2. **斜杠命令**：在会话期间输入 `/yolo` 以切换开启/关闭
3. **环境变量**：设置 `HERMES_YOLO_MODE=1`

`/yolo` 命令是一个**切换开关**——每次使用都会翻转模式：

```
> /yolo
  ⚡ YOLO 模式已开启 — 所有命令自动批准。请谨慎使用。

> /yolo
  ⚠ YOLO 模式已关闭 — 危险命令将需要批准。
```

YOLO 模式在 CLI 和网关会话中均可用。在内部，它会设置 `HERMES_YOLO_MODE` 环境变量，并在执行每个命令前检查。

当 YOLO 激活时，Hermes 会显示两个持久的视觉提醒，让用户难以忘记审批提示已被绕过：

- 当 YOLO 已激活时，会话开始时会显示红色横幅：`⚠ YOLO 模式 — 所有审批提示已绕过`。当 YOLO 关闭时隐藏，以保持默认横幅整洁。
- 状态栏中跨所有宽度等级显示 `⚠ YOLO` 片段，在您切换 YOLO 开关时实时更新（富文本渲染器和纯文本回退）。

:::danger
YOLO 模式会禁用该会话的**所有**危险命令安全检查——**除了**硬性阻塞列表（见下文）。仅在您完全信任正在生成的命令时使用（例如，在一次性环境中经过充分测试的自动化脚本）。
:::

对于破坏性的会话斜杠命令（`/clear`、`/new`、`/reset`、`/undo`、`/quit --delete` —— `/exit --delete` 是别名），CLI 在运行前也会提示确认。参见[斜杠命令 — 破坏性命令的确认提示](../reference/slash-commands.md#confirmation-prompts-for-destructive-commandss)。

### 硬性阻塞列表（始终生效的底线）

某些命令具有灾难性后果——不可逆的文件系统擦除、叉形炸弹、直接写入块设备——以至于 Hermes 会**拒绝**运行它们，无论：

- 开启了 `--yolo` / `/yolo`
- `approvals.mode: off`
- 定时任务在无头 `approve` 模式下运行
- 用户明确点击"始终允许"

阻塞列表是 `--yolo` 之下的底线。它在审批层看到命令**之前**就会触发，并且没有覆盖标志。当前覆盖的模式（非详尽；与 `tools/approval.py::UNRECOVERABLE_BLOCKLIST` 同步）：

| 模式 | 为何是硬性阻塞 |
|---|---|
| `rm -rf /` 及其明显变体 | 擦除文件系统根目录 |
| `rm -rf --no-preserve-root /` | 明确的"是的，我就是指根目录"变体 |
| `:(){ :\|:& };:`（bash 叉形炸弹） | 直到重启前会占用主机资源 |
| 对已挂载的根设备执行 `mkfs.*` | 格式化活动系统 |
| `dd if=/dev/zero of=/dev/sd*` | 将物理磁盘清零 |
| 将不受信任的 URL 管道传输到根文件系统顶级的 `sh` | 远程代码执行攻击向量过于宽泛，无法批准 |

如果您触发了阻塞列表，工具调用会向智能体返回解释性错误，并且不会执行任何操作。如果合法工作流需要这些命令之一（例如，您是擦除并重装管道的操作员），请在智能体外部运行。

### 审批超时

当出现危险命令提示时，用户有可配置的时间来响应。如果在超时时间内没有响应，命令将**默认被拒绝**（安全失败）。

在 `~/.hermes/config.yaml` 中配置超时：

```yaml
approvals:
  timeout: 60  # 秒（默认：60）
```

### 触发审批的条件

以下模式会触发审批提示（在 `tools/approval.py` 中定义）：

| 模式 | 描述 |
|---------|-------------|
| `rm -r` / `rm --recursive` | 递归删除 |
| `rm ... /` | 在根路径中删除 |
| `chmod 777/666` / `o+w` / `a+w` | 全局/其他用户可写权限 |
| 使用不安全权限的 `chmod --recursive` | 递归全局/其他用户可写（长标志） |
| `chown -R root` / `chown --recursive root` | 递归将所有权更改为 root |
| `mkfs` | 格式化文件系统 |
| `dd if=` | 磁盘复制 |
| `> /dev/sd` | 写入块设备 |
| `DROP TABLE/DATABASE` | SQL DROP |
| `DELETE FROM`（无 WHERE） | 无 WHERE 的 SQL DELETE |
| `TRUNCATE TABLE` | SQL TRUNCATE |
| `> /etc/` | 覆盖系统配置 |
| `systemctl stop/restart/disable/mask` | 停止/重启/禁用系统服务 |
| `kill -9 -1` | 杀死所有进程 |
| `pkill -9` | 强制终止进程 |
| 叉形炸弹模式 | 叉形炸弹 |
| `bash -c` / `sh -c` / `zsh -c` / `ksh -c` | 通过 `-c` 标志执行 shell 命令（包括组合标志如 `-lc`） |
| `python -e` / `perl -e` / `ruby -e` / `node -c` | 通过 `-e`/`-c` 标志执行脚本 |
| `curl ... \| sh` / `wget ... \| sh` | 将远程内容管道传输到 shell |
| `bash <(curl ...)` / `sh <(wget ...)` | 通过进程替换执行远程脚本 |
| 通过 `tee` 覆盖 `/etc/`、`~/.ssh/`、`~/.hermes/.env` | 通过 tee 覆盖敏感文件 |
| 通过 `>` / `>>` 覆盖 `/etc/`、`~/.ssh/`、`~/.hermes/.env` | 通过重定向覆盖敏感文件 |
| `xargs rm` | xargs 与 rm |
| `find -exec rm` / `find -delete` | 具有破坏性操作的 find |
| `cp`/`mv`/`install` 到 `/etc/` | 将文件复制/移动到系统配置 |
| `sed -i` / `sed --in-place` 对 `/etc/` | 就地编辑系统配置 |
| `pkill`/`killall` hermes/gateway | 自我终止防护 |
| 带有 `&`/`disown`/`nohup`/`setsid` 的 `gateway run` | 防止在服务管理器外部启动 gateway |

:::info
**容器绕过**：当在 `docker`、`singularity`、`modal` 或 `daytona` 后端运行时，会**跳过**危险命令检查，因为容器本身是安全边界。容器内的破坏性命令无法危害主机。
:::

### 审批流程（CLI）

在交互式 CLI 中，危险命令会显示内联审批提示：

```
  ⚠️  危险命令：递归删除
      rm -rf /tmp/old-project

      [o]nce  |  [s]ession  |  [a]lways  |  [d]eny

      选择 [o/s/a/D]：
```

四个选项：

- **once** — 允许本次执行
- **session** — 允许此模式在会话剩余时间内使用
- **always** — 添加到永久允许列表（保存到 `config.yaml`）
- **deny**（默认）— 阻止命令

### 审批流程（网关/消息平台）

在消息平台上，智能体会将危险命令的详细信息发送到聊天中，并等待用户回复：

- 回复 **yes**、**y**、**approve**、**ok** 或 **go** 以批准
- 回复 **no**、**n**、**deny** 或 **cancel** 以拒绝

运行网关时会自动设置 `HERMES_EXEC_ASK=1` 环境变量。

### 永久允许列表

使用"always"批准的命令会保存到 `~/.hermes/config.yaml`：

```yaml
# 永久允许的危险命令模式
command_allowlist:
  - rm
  - systemctl
```

这些模式在启动时加载，并在所有未来的会话中静默批准。

:::tip
使用 `hermes config edit` 来审查或移除永久允许列表中的模式。
:::

## 用户授权（网关）

运行消息网关时，Hermes 通过一个分层授权系统来控制谁可以与机器人交互。

### 授权检查顺序

`_is_user_authorized()` 方法按以下顺序进行检查：

1.  **每个平台的允许所有用户标志**（例如 `DISCORD_ALLOW_ALL_USERS=true`）
2.  **DM 配对已批准列表**（通过配对码批准的用户）
3.  **特定平台白名单**（例如 `TELEGRAM_ALLOWED_USERS=12345,67890`）
4.  **全局白名单** (`GATEWAY_ALLOWED_USERS=12345,67890`)
5.  **全局允许所有用户** (`GATEWAY_ALLOW_ALL_USERS=true`)
6.  **默认：拒绝**

### 平台白名单

在 `~/.hermes/.env` 中，以逗号分隔的值设置允许的用户 ID：

```bash
# 特定平台白名单
TELEGRAM_ALLOWED_USERS=123456789,987654321
DISCORD_ALLOWED_USERS=111222333444555666
WHATSAPP_ALLOWED_USERS=15551234567
SLACK_ALLOWED_USERS=U01ABC123

# 跨平台白名单（在所有平台进行检查）
GATEWAY_ALLOWED_USERS=123456789

# 每个平台的允许所有用户（谨慎使用）
DISCORD_ALLOW_ALL_USERS=true

# 全局允许所有用户（极其谨慎使用）
GATEWAY_ALLOW_ALL_USERS=true
```

:::warning
如果**未配置任何白名单**且未设置 `GATEWAY_ALLOW_ALL_USERS`，则**所有用户都将被拒绝**。网关在启动时会记录一条警告：

```
未配置用户白名单。所有未授权用户将被拒绝。
在 ~/.hermes/.env 中设置 GATEWAY_ALLOW_ALL_USERS=true 以允许开放访问，
或配置平台白名单（例如 TELEGRAM_ALLOWED_USERS=你的ID）。
```
:::

### DM 配对系统

为了更灵活的授权，Hermes 包含一个基于配对码的系统。未知用户无需预先提供用户 ID，他们将收到一个一次性的配对码，然后机器人所有者可以通过 CLI 进行批准。

**工作原理：**

1.  未知用户向机器人发送私信
2.  机器人回复一个8位字符的配对码
3.  机器人所有者在 CLI 上运行 `hermes pairing approve <platform> <code>`
4.  该用户在该平台上被永久批准

在 `~/.hermes/config.yaml` 中控制如何处理未授权的私信：

```yaml
unauthorized_dm_behavior: pair

whatsapp:
  unauthorized_dm_behavior: ignore
```

-   `pair` 是默认值。未授权的私信会得到一个配对码回复。
-   `ignore` 会静默丢弃未授权的私信。
-   平台部分会覆盖全局默认值，因此你可以在 Telegram 上保持配对模式，同时让 WhatsApp 保持静默。

**安全特性**（基于 OWASP + NIST SP 800-63-4 指南）：

| 特性 | 详情 |
|---------|---------|
| 配对码格式 | 来自32字符明确字母表（不含 0/O/1/I）的8位字符 |
| 随机性 | 密码学随机 (`secrets.choice()`) |
| 配对码有效期 | 1 小时过期 |
| 速率限制 | 每位用户每 10 分钟 1 次请求 |
| 待处理上限 | 每个平台最多 3 个待处理配对码 |
| 锁定 | 5 次失败的批准尝试 → 锁定 1 小时 |
| 文件安全 | 对所有配对数据文件设置 `chmod 0600` |
| 日志记录 | 配对码永远不会记录到标准输出 |

**配对 CLI 命令：**

```bash
# 列出待处理和已批准的用户
hermes pairing list

# 批准一个配对码
hermes pairing approve telegram ABC12DEF

# 撤销用户的访问权限
hermes pairing revoke telegram 123456789

# 清除所有待处理的配对码
hermes pairing clear-pending
```

**存储：** 配对数据存储在 `~/.hermes/pairing/` 中，包含按平台划分的 JSON 文件：
-   `{platform}-pending.json` — 待处理的配对请求
-   `{platform}-approved.json` — 已批准的用户
-   `_rate_limits.json` — 速率限制和锁定跟踪

## 容器隔离

使用 `docker` 终端后端时，Hermes 会对每个容器应用严格的安全加固。

### Docker安全标志

每个容器都运行以下标志（在 `tools/environments/docker.py` 中定义）：

```python
_SECURITY_ARGS = [
    "--cap-drop", "ALL",                          # 丢弃所有 Linux 能力
    "--cap-add", "DAC_OVERRIDE",                  # 根用户可以写入绑定挂载目录
    "--cap-add", "CHOWN",                         # 包管理器需要文件所有权
    "--cap-add", "FOWNER",                        # 包管理器需要文件所有权
    "--security-opt", "no-new-privileges",         # 阻止权限提升
    "--pids-limit", "256",                         # 限制进程数量
    "--tmpfs", "/tmp:rw,nosuid,size=512m",         # 大小限制的 /tmp
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
  docker_forward_env: []  # 仅显式允许列表；为空可将密钥排除在容器外
  container_cpu: 1        # CPU 核心数
  container_memory: 5120  # MB（默认 5GB）
  container_disk: 51200   # MB（默认 50GB，在 XFS 上需要 overlay2）
  container_persistent: true  # 跨会话持久化文件系统
```

### 文件系统持久化

- **持久模式** (`container_persistent: true`): 从 `~/.hermes/sandboxes/docker/<task_id>/` 绑定挂载 `/workspace` 和 `/root`。
- **临时模式** (`container_persistent: false`): 使用 tmpfs 作为工作空间——清理时所有内容将丢失。

:::tip
对于生产网关部署，使用 `docker`、`modal` 或 `daytona` 后端来隔离智能体命令与您的主机系统。这完全消除了对危险命令批准的需求。
:::

:::warning
如果您将名称添加到 `terminal.docker_forward_env`，这些变量将被有意注入到容器中用于终端命令。这对于任务特定凭据（如 `GITHUB_TOKEN`）很有用，但这也意味着在容器中运行的代码可以读取并泄露它们。
:::

## 终端后端安全比较

| 后端       | 隔离       | 危险命令检查 | 最适用于               |
|------------|------------|--------------|------------------------|
| **local**  | 无 - 在主机上运行 | ✅ 是        | 开发，可信用户         |
| **ssh**    | 远程机器   | ✅ 是        | 在单独服务器上运行     |
| **docker** | 容器       | ❌ 跳过（容器是边界） | 生产网关               |
| **singularity** | 容器 | ❌ 跳过      | 高性能计算环境         |
| **modal**  | 云沙箱     | ❌ 跳过      | 可扩展的云隔离         |
| **daytona** | 云沙箱    | ❌ 跳过      | 持久的云工作空间       |

## 环境变量透传 {#environment-variable-passthrough}

`execute_code` 和 `terminal` 都会从子进程中剥离敏感的环境变量，以防止 LLM 生成的代码泄露凭据。然而，声明了 `required_environment_variables` 的技能需要合法地访问这些变量。

### 工作原理

两种机制允许特定变量通过沙箱过滤器：

**1. 技能范围透传（自动）**

当加载一个技能（通过 `skill_view` 或 `/skill` 命令）并声明了 `required_environment_variables` 时，任何在环境中实际设置的变量都会被自动注册为透传。缺失的变量（仍处于待设置状态）**不会**被注册。

```yaml
# 在技能的 SKILL.md 前置数据中
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: Tenor API 密钥
    help: 从 https://developers.google.com/tenor 获取密钥
```

加载此技能后，`TENOR_API_KEY` 将透传到 `execute_code`、`terminal`（本地）**以及远程后端（Docker, Modal）**——无需手动配置。

:::info Docker 与 Modal
在 v0.5.1 之前，Docker 的 `forward_env` 是一个独立于技能透传的系统。现在它们已合并——技能声明的环境变量会自动转发到 Docker 容器和 Modal 沙箱中，无需手动将它们添加到 `docker_forward_env`。
:::

**2. 基于配置的透传（手动）**

对于未被任何技能声明的环境变量，请将它们添加到 `config.yaml` 的 `terminal.env_passthrough` 中：

```yaml
terminal:
  env_passthrough:
    - MY_CUSTOM_KEY
    - ANOTHER_TOKEN
```

### 凭据文件透传（OAuth 令牌等） {#credential-file-passthrough}

某些技能需要沙箱中的**文件**（而不仅仅是环境变量）——例如，Google Workspace 将 OAuth 令牌存储在活动配置文件的 `HERMES_HOME` 下的 `google_token.json` 文件中。技能在前置数据中声明这些文件：

```yaml
required_credential_files:
  - path: google_token.json
    description: Google OAuth2 令牌（由设置脚本创建）
  - path: google_client_secret.json
    description: Google OAuth2 客户端凭据
```

加载时，Hermes 会检查活动配置文件的 `HERMES_HOME` 中是否存在这些文件，并注册它们以供挂载：

- **Docker**: 只读绑定挂载（`-v host:container:ro`）
- **Modal**: 在沙箱创建时挂载 + 每个命令前同步（处理会话中的 OAuth 设置）
- **本地**: 无需操作（文件已可访问）

您也可以在 `config.yaml` 中手动列出凭据文件：

```yaml
terminal:
  credential_files:
    - google_token.json
    - my_custom_oauth_token.json
```

路径相对于 `~/.hermes/`。文件被挂载到容器内的 `/root/.hermes/`。此列表由 `tools/credential_files.py`（`terminal.credential_files`）读取——它位于 `terminal:` 块下，但由凭据文件模块加载，而不是核心终端后端，因此不属于捆绑的 `DEFAULT_CONFIG` 快照的一部分。

### 每个沙箱的过滤规则

| 沙箱             | 默认过滤规则                                                                                                     | 透传覆盖                                                                 |
|------------------|------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
| **execute_code** | 阻止名称中包含 `KEY`、`TOKEN`、`SECRET`、`PASSWORD`、`CREDENTIAL`、`PASSWD`、`AUTH` 的变量；只允许安全前缀变量通过 | ✅ 透传变量绕过两项检查                                                   |
| **terminal** (本地) | 阻止显式的 Hermes 基础设施变量（提供商密钥、网关令牌、工具 API 密钥）                                            | ✅ 透传变量绕过阻止列表                                                   |
| **terminal** (Docker) | 默认不包含主机环境变量                                                                                           | ✅ 透传变量 + `docker_forward_env` 通过 `-e` 转发                         |
| **terminal** (Modal) | 默认不包含主机环境/文件                                                                                          | ✅ 凭据文件挂载；环境透传通过同步实现                                     |
| **MCP**          | 阻止除安全系统变量 + 显式配置的 `env` 以外的一切                                                                  | ❌ 不受透传影响（请改用 MCP `env` 配置）                                  |

### 安全考虑

- 透传仅影响您或您的技能显式声明的变量——对于任意 LLM 生成的代码，默认安全姿态保持不变。
- 凭据文件以**只读**方式挂载到 Docker 容器中。
- Skills Guard 会在安装前扫描技能内容中是否有可疑的环境访问模式。
- 缺失/未设置的变量永远不会被注册（您无法泄露不存在的东西）。
- Hermes 基础设施密钥（提供商 API 密钥、网关令牌）不应添加到 `env_passthrough`——它们有专门的机制。

## MCP 凭据处理

MCP (模型上下文协议) 服务器子进程会接收一个**经过过滤的环境**，以防止意外的凭据泄漏。

### 安全的环境变量

只有以下变量会从主机传递到 MCP 标准输入输出子进程：

```
PATH, HOME, USER, LANG, LC_ALL, TERM, SHELL, TMPDIR
```

以及所有 `XDG_*` 变量。所有其他环境变量（API 密钥、令牌、密码）都将被**剥离**。

在 MCP 服务器的 `env` 配置中显式定义的变量会被传递：

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_..."  # Only this is passed
```

### 凭据重写

MCP 工具返回的错误消息在返回给大语言模型之前会被清洗。以下模式会被替换为 `[REDACTED]`：

- GitHub PATs (`ghp_...`)
- OpenAI 风格的密钥 (`sk-...`)
- Bearer 令牌
- `token=`、`key=`、`API_KEY=`、`password=`、`secret=` 参数

### 网站访问策略

您可以通过其网络和浏览器工具限制智能体可以访问哪些网站。这对于防止智能体访问内部服务、管理面板或其他敏感 URL 很有用。

```yaml
# In ~/.hermes/config.yaml
security:
  website_blocklist:
    enabled: true
    domains:
      - "*.internal.company.com"
      - "admin.example.com"
    shared_files:
      - "/etc/hermes/blocked-sites.txt"
```

当请求被阻止的 URL 时，工具会返回一个错误，说明该域名已被策略阻止。该阻止列表将在 `web_search`、`web_extract`、`browser_navigate` 以及所有具备 URL 功能的工具上强制执行。

有关完整详情，请参阅配置指南中的 [网站阻止列表](/user-guide/configuration#website-blocklist)。

### SSRF 防护

所有具备 URL 功能的工具（网络搜索、网络提取、视觉、浏览器）在获取 URL 之前会验证它们，以防止服务器端请求伪造 (SSRF) 攻击。被阻止的地址包括：

- **私有网络** (RFC 1918): `10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/16`
- **环回**: `127.0.0.0/8`、`::1`
- **链路本地**: `169.254.0.0/16`（包括位于 `169.254.169.254` 的云元数据）
- **CGNAT / 共享地址空间** (RFC 6598): `100.64.0.0/10`（Tailscale、WireGuard VPNs）
- **云元数据主机名**: `metadata.google.internal`、`metadata.goog`
- **保留、多播和未指定地址**

SSRF 防护在面向互联网的使用中始终处于激活状态，DNS 失败会被视为已阻止（失败即关闭）。重定向链会在每一跳重新验证，以防止基于重定向的绕过。

#### 故意允许私有 URL

某些设置确实需要访问私有/内部 URL——例如将 `home.arpa` 解析到 RFC 1918 空间的家庭网络、仅限局域网的 Ollama/llama.cpp 端点、内部 wiki、云元数据调试等。对于这些情况，有一个全局选项可以选择退出：

```yaml
security:
  allow_private_urls: true   # default: false
```

开启后，网络工具、浏览器、视觉 URL 获取和网关媒体下载将不再拒绝 RFC 1918 / 环回 / 链路本地 / CGNAT / 云元数据目标。**这是一个刻意的信任边界**——仅在智能体对本地网络运行任意提示注入 URL 是可接受风险的机器上启用它。面向公众的网关应保持关闭。

主机子字符串防护（即使底层 IP 是公共的，也能阻止外观相似的 Unicode 域名技巧）无论此设置如何都会保持开启。

### Tirith 执行前安全扫描

Hermes 集成了 [tirith](https://github.com/sheeki03/tirith)，用于在执行前对内容级别的命令进行扫描。Tirith 可以检测到仅靠模式匹配无法发现的威胁：

- 同形异义 URL 欺骗（国际化域名攻击）
- 管道到解释器模式 (`curl | bash`、`wget | sh`)
- 终端注入攻击

Tirith 在首次使用时会从 GitHub releases 自动安装，并进行 SHA-256 校验和验证（如果 cosign 可用，还会进行 cosign 来源验证）。

```yaml
# In ~/.hermes/config.yaml
security:
  tirith_enabled: true       # Enable/disable tirith scanning (default: true)
  tirith_path: "tirith"      # Path to tirith binary (default: PATH lookup)
  tirith_timeout: 5          # Subprocess timeout in seconds
  tirith_fail_open: true     # Allow execution when tirith is unavailable (default: true)
```

当 `tirith_fail_open` 为 `true`（默认）时，如果 tirith 未安装或超时，命令将继续执行。在高安全性环境中，将其设置为 `false`，以便在 tirith 不可用时阻止命令。

Tirith 提供适用于 Linux (x86_64 / aarch64) 和 macOS (x86_64 / arm64) 的预编译二进制文件。在没有预编译二进制文件的平台上（Windows 等），Tirith 会被静默跳过——模式匹配防护仍然运行，并且命令行界面不会显示“不可用”的横幅。要在 Windows 上使用 Tirith，请在 WSL 下运行 Hermes。

Tirith 的判定结果与审批流程集成：安全的命令通过，而可疑和被阻止的命令会触发用户审批，并附上完整的 Tirith 调查结果（严重性、标题、描述、更安全的替代方案）。用户可以批准或拒绝——默认选择是拒绝，以确保无人值守场景的安全。

### 上下文文件注入防护

上下文文件（AGENTS.md、.cursorrules、SOUL.md）在包含到系统提示词之前会进行提示注入扫描。扫描器会检查：

- 指示忽略/无视先前指令的内容
- 带有可疑关键词的隐藏 HTML 注释
- 读取密钥（`.env`、`credentials`、`.netrc`）的尝试
- 通过 `curl` 进行凭据泄露
- 不可见的 Unicode 字符（零宽空格、双向覆盖）

被阻止的文件会显示一条警告：

```
[BLOCKED: AGENTS.md contained potential prompt injection (prompt_injection). Content not loaded.]
```

## 生产环境部署最佳实践

### 网关部署清单

1. **设置明确的允许列表** — 生产环境中切勿使用 `GATEWAY_ALLOW_ALL_USERS=true`
2. **使用容器后端** — 在 config.yaml 中设置 `terminal.backend: docker`
3. **限制资源使用** — 设置适当的 CPU、内存和磁盘限制
4. **安全存储密钥** — 将 API 密钥保存在 `~/.hermes/.env` 中并设置适当的文件权限
5. **启用直接消息配对** — 尽可能使用配对码，避免硬编码用户 ID
6. **审阅命令允许列表** — 定期审查 config.yaml 中的 `command_allowlist`
7. **设置 `MESSAGING_CWD`** — 不要让智能体在敏感目录下运行
8. **以非 root 用户运行** — 切勿以 root 用户运行网关
9. **监控日志** — 检查 `~/.hermes/logs/` 中的未授权访问尝试
10. **保持更新** — 定期运行 `hermes update` 以获取安全补丁

### 保护 API 密钥

```bash
# 为 .env 文件设置正确的权限
chmod 600 ~/.hermes/.env

# 为不同的服务使用独立的密钥
# 切勿将 .env 文件提交到版本控制中
```

### 网络隔离

为获得最大安全性，请在单独的机器或虚拟机上运行网关。在 `config.yaml` 中设置 `terminal.backend: ssh`，然后通过 `~/.hermes/.env` 中的环境变量提供主机详情：

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

SSH 连接详情保存在 `.env`（而非 `config.yaml`）中，因此不会被签入或与配置文件导出一起共享。这使网关的消息传递连接与智能体的命令执行相分离。

## 供应链安全通告检查

Hermes 内置了一个安全通告扫描器，可标记活动虚拟环境中匹配特定版本的 Python 包，这些版本来自已知的受损版本目录（供应链蠕虫，例如 2026 年 5 月的 `mistralai 2.4.6` 投毒事件）。其实现位于 `hermes_cli/security_advisories.py`。

运行方式：

- **CLI 启动横幅。** 如果任何通告匹配，会打印一行警告，并指向 `hermes doctor` 以获取完整的修复指南。
- **`hermes doctor`。** 显示所有活动的通告，包括版本详情和 2-4 步的修复说明。
- **网关启动。** 记录到 `gateway.log`；第一条交互式消息会收到一个简短的操作员横幅。

每个通告都有一个稳定的 ID。一旦您阅读并处理了它，就可以永久忽略它：

```bash
hermes doctor --ack <advisory-id>
```

该确认操作会持久保存到 `config.security.acked_advisories` 中，并且在重启后仍然存在。旧的通告**不会**从目录中移除 — 保留它们可以让新安装的用户知晓历史上可能仍缓存在私有镜像中的已投毒版本。

该检查本身仅依赖标准库，每个通告只运行一次 `importlib.metadata.version()` 查询，因此在每次启动时运行都是安全的。

### 可选依赖的惰性安装

许多功能（Mistral TTS、ElevenLabs、Honcho 记忆、Bedrock、Slack、Matrix 等）依赖于并非每个用户都需要的 Python 包。Hermes 在首次使用时**惰性安装**这些依赖，而不是预先在 `hermes-agent[all]` 下安装。其实现位于 `tools/lazy_deps.py`。

此方案解决的权衡问题：

- **脆弱性。** 当某个额外依赖的传递依赖在 PyPI 上不可用（因恶意软件被隔离、被撤回、上传损坏）时，整个 `[all]` 的解析会失败，新安装会静默回退到精简版 — 一次性丢失 10 个以上的不相关额外功能。惰性安装隔离了每个后端，因此一个被投毒的依赖不会破坏不相关的功能。
- **臃肿。** 只与一个提供商交互的用户不再需要拉取数百个他们永远不会导入的包。

工作原理：

1. 后端模块在其首次导入路径的顶部调用 `ensure("feature.name")`。
2. 如果缺少依赖，`ensure` 会检查 `config.yaml` 中的 `security.allow_lazy_installs`（默认为 `true`），并对允许列表中的规范运行虚拟环境范围内的 `pip install`。
3. 如果安装失败或用户禁用了惰性安装，该调用会引发 `FeatureUnavailable` 错误，并附带实际的 pip 标准错误输出以及指向 `hermes tools` 的指引。

`tools/lazy_deps.py` 强制执行的安全保证：

| 保证 | 含义 |
|---|---|
| 仅限虚拟环境范围 | 安装目标为活动虚拟环境中的 `sys.executable` — 绝不触及系统 Python |
| 仅按名称从 PyPI 安装 | 规范接受 `"package>=1.0,<2"` 语法。不允许使用 `--index-url`、`git+https://` 或 file: 路径 — 恶意的 `config.yaml` 无法重定向安装 |
| 允许列表 | 只有出现在源代码树内 `LAZY_DEPS` 映射中的规范才能通过此路径安装。功能名称中的拼写错误**不会**获得“安装任意内容”的语义 |
| 可选退出 | 设置 `security.allow_lazy_installs: false` 以完全禁用运行时安装。适用于受限网络或严格的安全要求 |
| 无静默重试 | 失败会以 `FeatureUnavailable` 形式呈现 — 不缓存错误状态，不重试风暴 |

要禁用运行时安装：

```yaml
# ~/.hermes/config.yaml
security:
  allow_lazy_installs: false
```

禁用后，需要可选依赖的后端会告知用户手动运行安装（`pip install …`）或通过 `hermes tools` 选择其他后端。