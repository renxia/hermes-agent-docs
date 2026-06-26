---
sidebar_position: 8
title: "安全"
description: "安全模型、危险命令审批、用户授权、容器隔离和生产部署最佳实践"
---

# 安全

Hermes 智能体设计了纵深防御安全模型。本页面涵盖了从命令审批到容器隔离、消息平台用户授权的每一个安全边界。

## 概述

该安全模型包含七个层次：

1. **用户授权** — 谁可以与智能体交流（白名单、私信配对）
2. **危险命令审批** — 对破坏性操作进行人工干预
3. **容器隔离** — 使用强化设置的Docker/Singularity/Modal沙箱
4. **MCP凭证过滤** — 为MCP子进程进行环境变量隔离
5. **上下文文件扫描** — 项目文件中提示注入检测
6. **跨会话隔离** — 会话不能访问彼此的数据或状态；定时任务存储路径已针对路径遍历攻击进行了强化
7. **输入消毒** — 终端工具后端的工作目录参数会根据白名单进行验证，以防止Shell注入

## 危险命令审批

在执行任何命令之前，Hermes 会将其与一份精心策划的危险模式列表进行比对。如果找到匹配项，用户必须明确批准它。

### 审批模式

该审批系统支持三种模式，可通过 `~/.hermes/config.yaml` 中的 `approvals.mode` 进行配置：

```yaml
approvals:
  mode: manual                    # manual | smart | off
  timeout: 60                     # seconds to wait for user response (default: 60)
  cron_mode: deny                 # deny | approve — what cron jobs do when they hit a dangerous command
  mcp_reload_confirm: true        # /reload-mcp asks before invalidating the MCP tool cache
  destructive_slash_confirm: true # /clear, /new, /reset, /undo prompt before discarding state
```

完整的键列表：

| Key | Default | 控制内容 |
|---|---|---|
| `mode` | `manual` | 危险 Shell 命令的审批策略 — 请参阅下表。 |
| `timeout` | `60` | Hermes 等待审批回复前的秒数。 |
| `cron_mode` | `deny` | 当 cron 作业触发危险命令提示时，其行为方式。[./features/cron.md](https://docs.example.com/features/cron.md) 智能体如何操作。`deny` 会阻止该命令（智能体必须找到另一条路径）；`approve` 则在 cron 上下文中自动批准所有内容。 |
| `mcp_reload_confirm` | `true` | 当设置为 true 时，`/reload-mcp` 会在使 MCP 工具缓存失效之前进行询问。重新构建会使提供者提示缓存（工具模式保存在系统提示中）失效，因此下一个消息会重新发送完整的输入令牌。点击**始终批准**的用户会将此键翻转为 `false`。 |
| `destructive_slash_confirm` | `true` | 当设置为 true 时，危险的会话斜杠命令（`/clear`、`/new`、`/reset`、`/undo`）会在丢弃状态之前进行提示。通过 Telegram、Discord 和 Slack 的原生是/否按钮路由的三选一对话框；其他地方使用文本回退。点击**始终批准**的用户会将此键翻转为 `false`。TUI 使用自己的模态覆盖层（设置 `HERMES_TUI_NO_CONFIRM=1` 可选择退出）。 |

| 模式 | 行为 |
|------|----------|
| **manual** (默认) | 始终提示用户对危险命令进行审批 |
| **smart** | 使用辅助 LLM 来评估风险。低风险命令（例如 `python -c "print('hello')"`）会被自动批准。真正危险的命令会被自动拒绝。不确定的情况会升级到手动提示。 |
| **off** | 禁用所有审批检查 — 等同于使用 `--yolo` 运行。所有命令都将在没有提示的情况下执行。 |

:::warning
设置 `approvals.mode: off` 会禁用所有安全提示。仅在受信任的环境（CI/CD、容器等）中使用。
:::

### YOLO 模式

YOLO 模式会绕过当前会话中**所有**危险命令的审批提示。它可以通过三种方式激活：

1. **CLI 标志**: 使用 `hermes --yolo` 或 `hermes chat --yolo` 启动会话。
2. **斜杠命令**: 在会话期间输入 `/yolo` 来切换开启/关闭。
3. **环境变量**: 设置 `HERMES_YOLO_MODE=1`。

`/yolo` 命令是一个**切换开关**——每次使用都会将模式从开到关或从关到开：

```
> /yolo
  ⚡ YOLO 模式已开启 — 所有命令均自动批准。请谨慎使用。

> /yolo
  ⚠ YOLO 模式已关闭 — 危险命令将需要审批。
```

YOLO 模式在 CLI 和网关会话中都可用。内部上，它设置 `HERMES_YOLO_MODE` 环境变量，该变量会在每次命令执行前被检查。

当 YOLO 激活时，Hermes 会显示两个持久的视觉提醒，以确保不会忘记审批提示已被绕过：

- 当 YOLO 已处于活动状态时，在会话开始时显示一条红色横幅线：`⚠ YOLO 模式 — 所有审批提示均已绕过`。当 YOLO 关闭时隐藏，以便默认横幅保持整洁。
- 在所有宽度层级的状态栏中显示一个 `⚠ YOLO` 片段，实时更新您开启或关闭 YOLO 的操作（富文本渲染器和纯文本回退）。

:::danger
YOLO 模式会禁用会话中**所有**危险命令的安全检查 — **但**不包括硬性阻止列表（见下文）。仅在您完全信任所生成的命令时使用（例如，可丢弃的环境中的经过充分测试的自动化脚本）。
:::

对于危险的会话斜杠命令（`/clear`、`/new` / `/reset`、`/undo`、`/quit --delete` — `/exit --delete` 是其别名），CLI 也会在运行它们之前进行提示。请参阅 [Slash Commands — For destructive commands' confirmation prompts](../reference/slash-commands.md#confirmation-prompts-for-destructive-commands)。

### 硬性阻止列表（始终启用的底线）

有些命令是如此灾难性——不可逆转的文件系统擦除、fork bomb、直接块设备写入——以至于 Hermes 无论以下情况如何，都拒绝运行它们：

- `--yolo` / `/yolo` 已开启
- `approvals.mode: off`
- Cron 作业在 headless `approve` 模式下运行
- 用户明确点击“始终允许”

阻止列表是比 `--yolo` 更低的底线。它会在审批层级看到命令**之前**触发，并且没有覆盖标志。当前涵盖的模式（并非详尽无遗；与 `tools/approval.py::UNRECOVERABLE_BLOCKLIST` 同步）：

| 模式 | 为什么是硬性阻止 |
|---|---|
| `rm -rf /` 和明显的变体 | 擦除文件系统根目录 |
| `rm -rf --no-preserve-root /` | 明确的“是的，我指的是根目录”变体 |
| `:(){ :\|:& };:` (bash fork bomb) | 使宿主机被占用直到重启 |
| 对已挂载根设备的 `mkfs.*` | 格式化正在运行的系统 |
| `dd if=/dev/zero of=/dev/sd*` | 将物理磁盘清零 |
| 将不受信任的 URL 通过管道传递给 rootfs 顶层的 `sh` | 过广的远程代码执行攻击向量，无法批准 |

如果触发了阻止列表，工具调用将向智能体返回一个解释性错误，而不会运行任何东西。如果某个合法的工作流程需要这些命令（例如，您是擦除和重新安装管道的操作员），请在智能体外部运行它。

### 审批超时

当出现危险命令提示时，用户有可配置的时间进行回复。如果在超时时间内没有给出回复，该命令将**被拒绝**（默认失败关闭）。

在 `~/.hermes/config.yaml` 中配置超时时间：

```yaml
approvals:
  timeout: 60  # 秒数 (默认: 60)
```

### 触发审批的内容

以下模式会触发审批提示（定义在 `tools/approval.py` 中）：

| 模式 | 描述 |
|---------|-------------|
| `rm -r` / `rm --recursive` | 递归删除 |
| `rm ... /` | 在根路径中删除 |
| `chmod 777/666` / `o+w` / `a+w` | 世界/其他可写权限 |
| 使用不安全权限的 `chmod --recursive` | 递归世界/其他可写（长标志） |
| `chown -R root` / `chown --recursive root` | 递归更改所有者为 root |
| `mkfs` | 格式化文件系统 |
| `dd if=` | 磁盘复制 |
| `> /dev/sd` | 写入块设备 |
| `DROP TABLE/DATABASE` | SQL DROP |
| `DELETE FROM` (没有 WHERE) | 没有 WHERE 的 SQL DELETE |
| `TRUNCATE TABLE` | SQL TRUNCATE |
| `> /etc/` | 覆盖系统配置 |
| `systemctl stop/restart/disable/mask` | 停止/重启/禁用/屏蔽系统服务 |
| `kill -9 -1` | 杀死所有进程 |
| `pkill -9` | 强制杀死进程 |
| Fork bomb 模式 | Fork bombs |
| `bash -c` / `sh -c` / `zsh -c` / `ksh -c` | 通过 `-c` 标志执行 Shell 命令（包括`-lc`等组合标志） |
| `python -e` / `perl -e` / `ruby -e` / `node -c` | 通过 `-e`/`-c` 标志执行脚本 |
| `curl ... \| sh` / `wget ... \| sh` | 将远程内容通过管道传递给 shell |
| `bash <(curl ...)` / `sh <(wget ...)` | 通过进程替换执行远程脚本 |
| 使用 `tee` 到 `/etc/`、`~/.ssh/`、`~/.hermes/.env` | 通过 tee 覆盖敏感文件 |
| 使用 `>` / `>>` 到 `/etc/`、`~/.ssh/`、`~/.hermes/.env` | 通过重定向覆盖敏感文件 |
| `xargs rm` | 使用 xargs 和 rm |
| `find -exec rm` / `find -delete` | 使用 find 进行破坏性操作 |
| 将 `cp`/`mv`/`install` 到 `/etc/` | 将文件复制到系统配置中 |
| 对 `/etc/` 的 `sed -i` / `sed --in-place` | 系统配置的就地编辑 |
| `pkill`/`killall` hermes/gateway | 防止自我终止 |
| 带有 `&`/`disown`/`nohup`/`setsid` 的 `gateway run` | 防止在服务管理器外部启动网关 |

:::info
**容器绕过**: 当在 `docker`、`singularity`、`modal` 或 `daytona` 后端运行时，危险命令检查会被**跳过**，因为容器本身就是安全边界。容器内部的破坏性命令无法危害宿主机。
:::

### 审批流程（CLI）

在交互式 CLI 中，危险命令会显示一个内联审批提示：

```
  ⚠️  DANGEROUS COMMAND: recursive delete
      rm -rf /tmp/old-project

      [o]nce  |  [s]ession  |  [a]lways  |  [d]eny

      Choice [o/s/a/D]:
```

这四个选项：

- **once** — 允许这一次执行
- **session** — 允许此模式在会话中剩余时间保持有效
- **always** — 添加到永久白名单（保存在 `config.yaml` 中）
- **deny** (默认) — 阻止该命令

### 审批流程（网关/消息传递）

在消息平台，智能体将危险命令的详细信息发送到聊天中，并等待用户回复：

- 回复 **yes**、**y**、**approve**、**ok** 或 **go** 进行批准
- 回复 **no**、**n**、**deny** 或 **cancel** 进行拒绝

当运行网关时，`HERMES_EXEC_ASK=1` 环境变量会自动设置。

### 永久白名单

使用“always”审批的命令会被保存到 `~/.hermes/config.yaml`：

```yaml
# 永久允许的危险命令模式
command_allowlist:
  - rm
  - systemctl
```

这些模式会在启动时加载，并在所有未来的会话中静默批准。

:::tip
使用 `hermes config edit` 来查看或移除永久白名单中的模式。
:::

## 用户授权（网关）

当运行消息传递网关时，Hermes 通过分层的授权系统来控制谁可以与机器人进行交互。

### 授权检查顺序

`_is_user_authorized()` 方法将按以下顺序进行检查：

1. **平台级别的全允许标志** (例如 `DISCORD_ALLOW_ALL_USERS=true`)
2. **DM 配对批准列表** (通过配对代码批准的用户)
3. **特定平台的白名单** (例如 `TELEGRAM_ALLOWED_USERS=12345,67890`)
4. **全局白名单** (`GATEWAY_ALLOWED_USERS=12345,67890`)
5. **全局全允许** (`GATEWAY_ALLOW_ALL_USERS=true`)
6. **默认：拒绝**

### 平台白名单

在 `~/.hermes/.env` 中设置允许的用户 ID，使用逗号分隔的值：

```bash
# 特定平台的白名单
TELEGRAM_ALLOWED_USERS=123456789,987654321
DISCORD_ALLOWED_USERS=111222333444555666
WHATSAPP_ALLOWED_USERS=15551234567
SLACK_ALLOWED_USERS=U01ABC123

# 跨平台的白名单（对所有平台都进行检查）
GATEWAY_ALLOWED_USERS=123456789

# 特定平台的全允许（请谨慎使用）
DISCORD_ALLOW_ALL_USERS=true

# 全局全允许（请极其谨慎使用）
GATEWAY_ALLOW_ALL_USERS=true
```

:::warning
如果**未配置任何白名单**，并且没有设置 `GATEWAY_ALLOW_ALL_USERS`，则**所有用户都将被拒绝**。网关会在启动时记录一条警告：

```
No user allowlists configured. All unauthorized users will be denied.
Set GATEWAY_ALLOW_ALL_USERS=true in ~/.hermes/.env to allow open access,
or configure platform allowlists (e.g., TELEGRAM_ALLOWED_USERS=your_id).
```
:::

### DM 配对系统

为了更灵活的授权，Hermes 包含一个基于代码的配对系统。它不需要预先要求用户 ID，未知用户会收到一个一次性的配对代码，由机器人所有者通过 CLI 进行批准。

**工作原理：**

1. 一个未知用户向机器人发送 DM
2. 机器人回复一个 8 字符的配对代码
3. 机器人所有者在 CLI 上运行 `hermes pairing approve <platform> <code>`
4. 该用户被永久批准用于该平台

在 `~/.hermes/config.yaml` 中控制如何处理未经授权的直接消息：

```yaml
unauthorized_dm_behavior: pair

whatsapp:
  unauthorized_dm_behavior: ignore
```

- `pair` 是聊天式 DM 平台的默认设置。未经授权的 DM 会收到一个配对代码回复。
- `ignore` 会静默丢弃未经授权的 DM。
- Email 默认为 `ignore`，除非设置了 `platforms.email.unauthorized_dm_behavior: pair`，因为收件箱可能包含不相关的未读邮件。
- 平台部分会覆盖全局默认值，因此您可以保持 Telegram 的配对功能开启，同时让 WhatsApp 静默处理。

**安全特性** (基于 OWASP + NIST SP 800-63-4 指南)：

| 特性 | 详情 |
|---------|---------|
| 代码格式 | 来自 32 字符无歧义字母表（不包括 0/O/1/I）的 8 个字符 |
| 随机性 | 加密性 (`secrets.choice()`) |
| 代码 TTL | 1 小时有效期 |
| 速率限制 | 每用户每 10 分钟 1 次请求 |
| 待定限制 | 每个平台的最多 3 个待定代码 |
| 锁定 | 5 次失败的批准尝试 → 1 小时锁定 |
| 文件安全 | 对所有配对数据文件使用 `chmod 0600` |
| 日志记录 | 代码绝不会被记录到标准输出 (stdout) |

**配对 CLI 命令：**

```bash
# 列出待定和已批准的用户
hermes pairing list

# 批准一个配对代码
hermes pairing approve telegram ABC12DEF

# 撤销用户的访问权限
hermes pairing revoke telegram 123456789

# 清除所有待定的代码
hermes pairing clear-pending
```

**存储：** 配对数据存储在 `~/.hermes/pairing/` 中，使用每个平台的 JSON 文件：
- `{platform}-pending.json` — 待定的配对请求
- `{platform}-approved.json` — 已批准的用户
- `_rate_limits.json` — 速率限制和锁定跟踪

## 容器隔离

当使用 Docker 终端后端时，Hermes 会对每个容器应用严格的安全强化。

### Docker 安全标志

每个容器都使用这些标志运行（定义在 tools/environments/docker.py 中）：

```python
_BASE_SECURITY_ARGS = [
    "--cap-drop", "ALL",                          # 移除所有 Linux 能力
    "--cap-add", "DAC_OVERRIDE",                  # Root 可以写入绑定挂载的目录
    "--cap-add", "CHOWN",                         # 包管理器需要文件所有权
    "--cap-add", "FOWNER",                        # 包管理器需要文件所有权
    "--security-opt", "no-new-privileges",         # 阻止权限提升
    "--pids-limit", "256",                         # 限制进程数
    "--tmpfs", "/tmp:rw,nosuid,size=512m",         # 有限大小的 /tmp
    "--tmpfs", "/var/tmp:rw,noexec,nosuid,size=256m",  # 不允许执行的 /var/tmp
]
```

`SETUID`/`SETGID` 不在基础列表中——它们是在容器以 root 身份启动，并且 init/entrypoint 必须降级权限时有条件地添加的（s6 降权路径）。当容器已经以非 root `--user` 运行时，这些标志会被跳过。`/run` tmpfs 也从基础列表中分离出来，并按镜像挂载（默认强化为 `noexec`，仅对从 `/run` 执行的 s6-overlay 镜像启用 `exec`）。

### 资源限制

容器资源可在 `~/.hermes/config.yaml` 中配置：

```yaml
terminal:
  backend: docker
  docker_image: "nikolaik/python-nodejs:python3.11-nodejs20"
  docker_forward_env: []  # 显式允许列表；为空则不将密钥放入容器
  container_cpu: 1        # CPU 核心数
  container_memory: 5120  # MB（默认 5GB）
  container_disk: 51200   # MB（默认 50GB，需要 XFS 上的 overlay2）
  container_persistent: true  # 跨会话持久化文件系统
```

### 文件系统持久性

- **持久模式** (`container_persistent: true`)：从 `~/.hermes/sandboxes/docker/<task_id>/` 绑定挂载 `/workspace` 和 `/root`。
- **临时模式** (`container_persistent: false`)：使用 tmpfs 作为工作区——清理时所有内容都会丢失。

:::tip
对于生产网关部署，请使用 docker、modal 或 daytona 后端，将智能体命令与您的宿主系统隔离。这完全消除了对危险命令审批的需求。
:::

:::warning
如果您向 `terminal.docker_forward_env` 添加名称，这些变量将被故意注入到容器中供终端命令使用。这对于任务特定的凭证（例如 `GITHUB_TOKEN`）非常有用，但这同时也意味着在容器中运行的代码可以读取和窃取它们。
:::

## 终端后端安全比较

| Backend | Isolation | Dangerous Cmd Check | Best For |
|---------|-----------|-------------------|----------|
| **local** | 无——在宿主机上运行 | ✅ 是 | 开发、可信用户 |
| **ssh** | 远程机器 | ✅ 是 | 在单独的服务器上运行 |
| **docker** | 容器 | ❌ 跳过（容器是边界） | 生产网关 |
| **singularity** | 容器 | ❌ 跳过 | HPC 环境 |
| **modal** | 云沙箱 | ❌ 跳过 | 可扩展的云隔离 |
| **daytona** | 云沙箱 | ❌ 跳过 | 持久化的云工作区 |

## Environment Variable Passthrough {#environment-variable-passthrough}

`execute_code` 和 `terminal` 会剥离子进程中敏感的环境变量，以防止由 LLM 生成的代码泄露凭证。然而，声明了 `required_environment_variables` 的技能确实需要访问这些变量。

### 工作原理

两种机制允许特定的变量通过沙箱过滤器：

**1. 技能范围的传递（自动）**

当一个技能被加载（通过 `skill_view` 或 `/skill` 命令）并声明了 `required_environment_variables` 时，所有实际设置在环境中的这些变量都会自动注册为可传递。未设置的变量（仍处于需要配置的状态）则不会被注册。

```yaml
# 在技能的 SKILL.md 前言中
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: Tenor API key
    help: Get a key from https://developers.google.com/tenor
```

加载此技能后，`TENOR_API_KEY` 会传递给 `execute_code`、`terminal`（本地）和**远程后端（Docker, Modal）**——无需手动配置。

:::info Docker & Modal
在 v0.5.1 之前，Docker 的 `forward_env` 是技能传递的一个独立系统。现在它们已合并——技能声明的环境变量会自动转发到 Docker 容器和 Modal 沙箱中，而无需将其添加到 `docker_forward_env` 中。
:::

**2. 基于配置的传递（手动）**

对于未由任何技能声明的环境变量，请将它们添加到 `config.yaml` 中的 `terminal.env_passthrough`：

```yaml
terminal:
  env_passthrough:
    - MY_CUSTOM_KEY
    - ANOTHER_TOKEN
```

### 凭证文件传递（OAuth tokens 等） {#credential-file-passthrough}

某些技能需要沙箱中的**文件**（而不仅仅是环境变量）——例如，Google Workspace 将 OAuth token 作为活动配置文件 `HERMES_HOME` 下的 `google_token.json` 进行存储。技能在前言中声明这些文件：

```yaml
required_credential_files:
  - path: google_token.json
    description: Google OAuth2 token (created by setup script)
  - path: google_client_secret.json
    description: Google OAuth2 client credentials
```

加载后，Hermes 会检查这些文件是否存在于活动配置文件的 `HERMES_HOME` 中并将其注册用于挂载：

- **Docker**: 只读绑定挂载 (`-v host:container:ro`)
- **Modal**: 在沙箱创建时挂载 + 在每次命令前同步（处理会话中间的 OAuth 设置）
- **Local**: 无需操作（文件本身就可访问）

您也可以在 `config.yaml` 中手动列出凭证文件：

```yaml
terminal:
  credential_files:
    - google_token.json
    - my_custom_oauth_token.json
```

路径是相对于 `~/.hermes/` 的。这些文件会被容器内的 `/root/.hermes/` 挂载。此列表由 `tools/credential_files.py` (`terminal.credential_files`) 读取——它位于 `terminal:` 块下，但是由凭证文件模块加载的，而不是核心终端后端，因此它不属于捆绑的 `DEFAULT_CONFIG` 快照。

### 各沙箱过滤器说明

| 沙箱 | 默认过滤器 | 传递覆盖 |
|---------|---------------|---------------------|
| **execute_code** | 阻止名称中包含 `KEY`、`TOKEN`、`SECRET`、`PASSWORD`、`CREDENTIAL`、`PASSWD`、`AUTH` 的变量；只允许安全前缀的变量通过 | ✅ 传递变量绕过所有检查 |
| **terminal** (local) | 阻止显式的 Hermes 基础设施变量（提供者密钥、网关令牌、工具 API 密钥） | ✅ 传递变量绕过黑名单 |
| **terminal** (Docker) | 默认不包含主机环境变量 | ✅ 传递变量 + 通过 `-e` 转发的 `docker_forward_env` |
| **terminal** (Modal) | 默认不包含主机环境变量/文件 | ✅ 凭证文件挂载；通过同步进行环境变量传递 |
| **MCP** | 阻止所有内容，除了安全的系统变量和明确配置的 `env` | ❌ 不受传递的影响（请使用 MCP 的 `env` 配置） |

### 安全注意事项

- 传递只影响您或您的技能明确声明的变量——对于任意 LLM 生成的代码，默认的安全态势保持不变
- 凭证文件被**以只读方式**挂载到 Docker 容器中
- Skills Guard 会在安装前扫描技能内容中的可疑环境变量访问模式
- 未设置/未定义的变量永远不会被注册（您无法泄露不存在的东西）
- Hermes 基础设施密钥（提供者 API 密钥、网关令牌）绝不应添加到 `env_passthrough` 中——它们有专门的机制

## MCP 凭证处理

MCP (Model Context Protocol) 服务器子进程接收一个**经过过滤的环境**，以防止意外泄露凭证。

### 安全环境变量

以下变量是从主机传递到 MCP stdio 子进程的：

```
PATH, HOME, USER, LANG, LC_ALL, TERM, SHELL, TMPDIR
```

以及任何 `XDG_*` 变量。所有其他环境变量（API 密钥、令牌、秘密）都将被**剥离**。

明确定义在 MCP 服务器 `env` 配置中的变量会被传递：

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_..."  # 只有此项会被传递
```

### 凭证重写（Redaction）

MCP 工具的错误消息在返回给 LLM 之前都会被清理。以下模式将被替换为 `[REDACTED]`：

- GitHub PAT (`ghp_...`)
- OpenAI 风格的密钥 (`sk-...`)
- Bearer tokens
- `token=`, `key=`, `API_KEY=`, `password=`, `secret=` 参数

### 网站访问策略

您可以通过其网络和浏览器工具来限制**智能体**可以访问哪些网站。这对于防止**智能体**访问内部服务、管理面板或其他敏感 URL 非常有用。

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

当请求一个被阻止的 URL 时，工具会返回一条解释该域被策略阻止的错误。此黑名单在 `web_search`、`web_extract`、`browser_navigate` 和所有具有 URL 功能的工具中都得到执行。

有关完整详情，请参阅配置指南中的 [网站黑名单](/user-guide/configuration#website-blocklist)。

### SSRF 防护

所有具有 URL 功能的工具（网络搜索、网页提取、视觉、浏览器）都会在获取它们之前验证 URL，以防止服务器端请求伪造 (SSRF) 攻击。被阻止的地址包括：

- **私有网络** (RFC 1918)：`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
- **环回地址**：`127.0.0.0/8`, `::1`
- **链路本地地址**：`169.254.0.0/16` (包括 `169.254.169.254` 的云元数据)
- **CGNAT / 共享地址空间** (RFC 6598)：`100.64.0.0/10` (Tailscale, WireGuard VPNs)
- **云元数据主机名**：`metadata.google.internal`, `metadata.goog`
- **保留、组播和未指定地址**

SSRF 防护始终处于活动状态，并且 DNS 故障被视为被阻止（故障安全关闭）。重定向链会在每个跳点重新验证，以防止基于重定向的绕过。

#### 有意允许私有 URL

某些设置确实需要访问私有/内部 URL——例如，将 `home.arpa` 解析到 RFC 1918 空间的家庭网络、仅 LAN 的 Ollama/llama.cpp 端点、内部 Wiki、云元数据调试等。对于这些情况，有一个全局的退出选项：

```yaml
security:
  allow_private_urls: true   # default: false
```

启用后，网络工具、浏览器、视觉 URL 抓取和网关媒体下载将不再拒绝 RFC 1918 / 环回地址 / 链路本地地址 / CGNAT / 云元数据目的地。**这是一个故意的信任边界**——仅在允许 **智能体** 对局域网进行任意提示注入 URL 的机器上启用它。面向公众的网关应保持关闭状态。

主机子字符串保护（即使底层 IP 是公共的，也阻止外观相似的 Unicode 域名技巧）仍然有效，不受此设置的影响。

### Tirith 执行前安全扫描

Hermes 集成了 [tirith](https://github.com/sheeki03/tirith)，在执行前对内容级别命令进行扫描。Tirith 检测到仅靠模式匹配无法发现的威胁：

- 同形 URL 欺骗（国际化域名攻击）
- 管道到解释器模式 (`curl | bash`、`wget | sh`)
- 终端注入攻击

Tirith 在首次使用时会自动从 GitHub 发布版本安装，并进行 SHA-256 校验和 cosign 出处验证（如果可用）。

```yaml
# 在 ~/.hermes/config.yaml 中
security:
  tirith_enabled: true       # 启用/禁用 tirith 扫描 (默认值: true)
  tirith_path: "tirith"      # tirith 二进制文件的路径 (默认值: PATH 查找)
  tirith_timeout: 5          # 子进程超时时间（秒）
  tirith_fail_open: true     # 当 tirith 不可用时是否允许执行 (默认值: true)
```

当 `tirith_fail_open` 为 `true`（默认值）时，如果 tirith 未安装或超时，命令仍会继续执行。在安全级别高的环境中，应将其设置为 `false`，以阻止 tirith 不可用的情况下的命令。

Tirith 提供了针对 Linux (x86_64 / aarch64) 和 macOS (x86_64 / arm64) 的预构建二进制文件。在没有预构建二进制文件的平台上（如 Windows），tirith 会静默跳过——模式匹配防护仍然运行，CLI 不会显示“不可用”的横幅。要在 Windows 上使用 tirith，请在 WSL 下运行 Hermes。

Tirith 的裁决结果与审批流程集成：安全的命令通过，而可疑和被阻止的命令都会触发用户批准，并提供完整的 tirith 发现信息（严重性、标题、描述、更安全的替代方案）。用户可以批准或拒绝——默认选择是拒绝，以保持无人值守场景的安全。

### 上下文文件注入保护

上下文文件 (AGENTS.md, .cursorrules, SOUL.md) 在被包含到系统提示之前都会被扫描是否存在提示注入。扫描器会检查：

- 忽略/不理会先前指令的指示
- 带有可疑关键词的隐藏 HTML 注释
- 读取秘密（`.env`、`credentials`、`.netrc`）的尝试
- 通过 `curl` 进行凭证泄露
- 隐形的 Unicode 字符（零宽空格、双向重写）

被阻止的文件会显示警告：

```
[BLOCKED: AGENTS.md 包含潜在的提示注入 (prompt_injection)。内容未加载。]
```

## 生产部署最佳实践

### 网关部署检查清单

1. **设置明确的白名单** — 在生产环境中绝不使用 `GATEWAY_ALLOW_ALL_USERS=true`
2. **使用容器后端** — 在 config.yaml 中设置 `terminal.backend: docker`
3. **限制资源配额** — 设置适当的 CPU、内存和磁盘限制
4. **安全存储密钥** — 将 API 密钥保存在 `~/.hermes/.env` 中，并设置正确的文件权限
5. **启用 DM 配对** — 尽可能使用配对码而不是硬编码用户 ID
6. **审查命令白名单** — 定期审计 config.yaml 中的 `command_allowlist`
7. **设置 `terminal.cwd`** — 不要让智能体从敏感目录运行
8. **以非 root 用户身份运行** — 绝不要以 root 身份运行网关
9. **监控日志** — 检查 `~/.hermes/logs/` 以获取未经授权的访问尝试记录
10. **保持更新** — 定期运行 `hermes update` 以获取安全补丁

### 安全化 API 密钥

```bash
# 在 .env 文件上设置正确的权限
chmod 600 ~/.hermes/.env

# 为不同的服务保留独立的密钥
# 切勿将 .env 文件提交到版本控制中
```

### 网络隔离

为了最大限度地保证安全，请在一个单独的机器或虚拟机上运行网关。在 `config.yaml` 中设置 `terminal.backend: ssh`，然后通过 `~/.hermes/.env` 中的环境变量提供主机详情：

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

SSH 连接详情保存在 `.env` 中（而不是 `config.yaml`），因此它们不会被检查或与配置文件导出一起共享。这使得网关的消息连接与智能体的命令执行保持分离。

## 供应链告警检查

Hermes 内置了告警扫描器，该扫描器会标记活动 venv 中与已知受损版本（例如 2026 年 5 月的 `mistralai 2.4.6` 投毒）匹配的 Python 包（供应链蠕虫）。实现位于 `hermes_cli/security_advisories.py`。

运行方式：

- **CLI 启动横幅。** 如果有任何告警匹配，将打印一行警告，并提供指向 `hermes doctor` 的链接以进行完整的修复。
- **`hermes doctor`。** 显示所有活动的告警、版本细节和 2-4 步的修复说明。
- **网关启动。** 记录在 `gateway.log` 中；第一个交互式消息会显示一个简短的操作员横幅。

每个告警都带有一个稳定的 ID。一旦您已阅读并采取行动，就可以将其标记为已处理：

```bash
hermes doctor --ack <advisory-id>
```

此确认信息会被持久化到 `config.security.acked_advisories` 中，并且在重启后仍然有效。旧的告警不会被故意从目录中移除——保留它们可以提醒用户，即使是私有镜像中缓存的、历史上受损的版本也是如此。

检查本身仅使用标准库，并对每个告警执行一次 `importlib.metadata.version()` 查找，因此在每次启动时运行都是安全的。

### 可选依赖项的懒加载（Lazy install）

许多功能（Mistral TTS, ElevenLabs, Honcho memory, Bedrock, Slack, Matrix, …）依赖于并非所有用户都需要使用的 Python 包。Hermes 在首次使用时**懒惰地**安装这些包，而不是像 `hermes-agent[all]` 那样急切地安装。实现位于 `tools/lazy_deps.py`。

这解决了什么问题：

- **脆弱性。** 当一个额外的依赖项在 PyPI 上不可用（被隔离、被撤回、上传失败）时，整个 `[all]` 解析都会失败，新安装的智能体将默默地降级到一个精简版——一次性损失 10 个以上的无关功能。懒加载机制隔离了每个后端，因此一个受损的依赖项就无法破坏其他功能。
- **臃肿。** 一个只与一个提供商进行交互的用户，就不会再拉取数百个自己永远不会导入的包。

工作原理：

1. 一个后端模块在其首次导入路径的顶部调用 `ensure("feature.name")`。
2. 如果依赖项缺失，`ensure` 会检查 `config.yaml` 中的 `security.allow_lazy_installs`（默认为 `true`），并为允许的规范运行一个 venv 范围的 `pip install`。
3. 如果安装失败或用户禁用了懒加载，则调用会抛出 `FeatureUnavailable`，并附带实际的 pip stderr 和指向 `hermes tools` 的链接。

由 `tools/lazy_deps.py` 强制执行的安全保证：

| 保证 | 含义 |
|---|---|
| 仅限 venv 范围 | 安装目标是活动 venv 中的 `sys.executable` — 而不是系统 Python |
| 仅按名称通过 PyPI | 规范接受 `"package>=1.0,<2"` 语法。不支持 `--index-url`、`git+https://` 或 file: 路径 — 一个恶意的 `config.yaml` 不能重定向安装 |
| 白名单 | 只有出现在内置 `LAZY_DEPS` 地图中的规范才能通过此路径进行安装。功能名称的拼写错误不会导致“一律安装”语义 |
| 可选择退出（Opt-out） | 设置 `security.allow_lazy_installs: false` 以完全禁用运行时安装。这对于受限网络或严格的安全态势非常有用 |
| 无静默重试 | 失败会作为 `FeatureUnavailable` 暴露 — 不会缓存不良状态，也不会发生重试风暴 |

要禁用运行时安装：

```yaml
# ~/.hermes/config.yaml
security:
  allow_lazy_installs: false
```

一旦禁用，需要可选依赖项的后端就会提示用户手动运行安装（`pip install …`）或通过 `hermes tools` 选择不同的后端。