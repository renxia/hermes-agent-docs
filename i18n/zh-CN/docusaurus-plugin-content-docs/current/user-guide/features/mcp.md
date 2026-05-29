---
sidebar_position: 4
title: "MCP（模型上下文协议）"
description: "通过MCP将Hermes智能体连接至外部工具服务器——并精确控制Hermes加载哪些MCP工具"
---

# MCP（模型上下文协议）

MCP使Hermes智能体能够连接到外部工具服务器，从而让智能体可以使用位于Hermes自身之外的工具——包括GitHub、数据库、文件系统、浏览器工具栈、内部API等。

如果您曾希望Hermes使用一个已在其他地方存在的工具，MCP通常是实现这一目标最简洁的方式。

## MCP带来的优势

- 无需首先编写原生Hermes工具，即可访问外部工具生态系统
- 在同一配置中支持本地标准输入输出服务器和远程HTTP MCP服务器
- 启动时自动发现并注册工具
- 当服务器支持时，为MCP资源和提示提供实用包装器
- 支持按服务器过滤，以便仅向Hermes展示您真正需要的MCP工具

## 快速入门

1. 安装 MCP 支持（如果使用了标准安装脚本，则已包含）：

```bash
cd ~/.hermes/hermes-agent
uv pip install -e ".[mcp]"
```

2. 在 `~/.hermes/config.yaml` 中添加 MCP 服务器：

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
```

3. 启动 Hermes：

```bash
hermes chat
```

4. 要求 Hermes 使用 MCP 支持的能力。

例如：

```text
列出 /home/user/projects 中的文件并总结仓库结构。
```

Hermes 将发现 MCP 服务器的工具并像使用其他工具一样使用它们。

## 目录：一键安装 Nous 批准的 MCP

Hermes 附带了一个精选的 MCP 服务器目录，这些服务器由 Nous 工作人员审核并合并。它们默认是禁用的——只安装你实际需要的。

```bash
hermes mcp                # 交互式选择器（默认）
hermes mcp catalog        # 纯文本列表，可用于脚本
hermes mcp install n8n    # 按名称安装目录条目
```

选择器会显示每个条目及其当前状态：

```
n8n          available              从 Hermes 管理和检查 n8n 工作流
linear       enabled                Linear 问题/项目管理（远程 OAuth）
github       installed (disabled)   GitHub 仓库 + PR 工具
```

在某一行上按 `Enter` 可以安装（并完成任何必要的凭据配置）、启用、禁用或卸载。目录条目存储在 hermes-agent 仓库的 `optional-mcps/` 下——存在于该目录意味着 Nous 已批准。没有社区提交层级；条目通过合并 PR 添加。

目录条目可能需要：

- **API 密钥** —— Hermes 在安装时提示并将值写入 `~/.hermes/.env`。非机密值（基础 URL）放在同一文件中。
- **OAuth**（远程 MCP）—— 在配置中写为 `auth: oauth`；MCP 客户端在首次连接时打开浏览器。
- **OAuth**（第三方提供商，如 Google/GitHub）—— 如果你尚未认证，Hermes 会引导你使用 `hermes auth <provider>`。

### 安装时的工具选择

配置凭据后，Hermes 会探测 MCP 服务器以列出其暴露的每个工具，并显示一个清单：

```
为 'linear' 选择工具（空格切换，回车确认）
  [x] find_issues       查找匹配查询的问题
  [x] get_issue         获取单个问题
  [x] create_issue      创建新问题
  [ ] delete_workspace  删除 Linear 工作区
  ...
```

预先勾选的行来自：

1. **你之前的选择**（如果你之前安装过此条目）——重新安装会保留你之前的设置（清单的默认值不会覆盖它）
2. **清单的 `tools.default_enabled`**（如果条目声明了的话）——某些目录条目会预先剔除有修改性的或很少有用的工具
3. **全部工具**（如果以上两者都不适用）

按回车提交清单。只有勾选的工具才会被写入 `mcp_servers.<name>.tools.include`。如果你选择了所有工具，则不会写入筛选器（最干净的配置格式，行为完全相同）。

**如果探测失败**（服务器不可达、OAuth 尚未完成、后端服务未运行），安装仍会成功：清单的 `tools.default_enabled` 会被直接应用（如果已声明），或者不写入筛选器（如果未声明）。服务器可达后重新运行 `hermes mcp configure <name>` 进行细化。

### 信任模型

安装目录条目会执行清单中指定的操作——`git clone`、条目的 `bootstrap` 命令（`pip install`、`npm install` 等），以及最终 MCP 服务器自身的代码。清单通过对 hermes-agent 仓库的 PR 审核来把关，因此 Nous 在每个条目发布前都已审核——**但你仍应在安装前阅读清单**，特别是 `source:` 字段的仓库、`install.bootstrap:` 命令以及任何 `transport.command:` 调用。

清单位于 GitHub 上的 [`optional-mcps/<name>/manifest.yaml`](https://github.com/NousResearch/hermes-agent/tree/main/optional-mcps)。选择器在安装时也会打印清单的 `source:` URL，以便你快速验证上游仓库。

### 清单版本兼容性

清单固定了一个 `manifest_version`。目录是向前兼容的：如果某个 PR 添加了一个比你安装的 Hermes 理解的版本更新的 `manifest_version`，选择器会显示警告（`⚠ '<name>' 需要更新版本的 Hermes`）而不是静默隐藏该条目。看到该提示时运行 `hermes update` 安装最新版 Hermes。

### 运行时 `${ENV_VAR}` 替换

在条目的 `transport.command`、`transport.args`、`transport.url` 和 `headers` 中，`${VAR}` 占位符在服务器连接时从环境变量（包括 `~/.hermes/.env` 中的所有内容）解析。当目录条目想要引用用户在其他地方配置的值时很有用——例如 `${HOME}/foo` 或 `${MY_PROVIDER_TOKEN}`。

注意这与目录清单中的 `${INSTALL_DIR}` 不同，后者在安装时被替换为目录克隆条目仓库的路径。

### 稍后更新工具选择

```bash
hermes mcp configure linear
```

重新打开相同的清单，你当前的选择会被预先勾选。当你想要启用更多工具，或者服务器添加了你想要选择加入的新工具时使用此命令。

### 更新目录清单

MCP 从不自动更新。如果清单版本更改，在 Hermes 更新后重新运行 `hermes mcp install <name>` 进行刷新。

要向目录添加 MCP，请针对 [`optional-mcps/`](https://github.com/NousResearch/hermes-agent/tree/main/optional-mcps) 提交 PR。

## 两种 MCP 服务器

### Stdio 服务器

Stdio 服务器作为本地子进程运行，通过 stdin/stdout 通信。

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
```

在以下情况使用 stdio 服务器：
- 服务器安装在本地
- 你想要低延迟访问本地资源
- 你正在遵循显示 `command`、`args` 和 `env` 的 MCP 服务器文档

### HTTP 服务器

HTTP MCP 服务器是 Hermes 直接连接的远程端点。

```yaml
mcp_servers:
  remote_api:
    url: "https://mcp.example.com/mcp"
    headers:
      Authorization: "Bearer ***"
```

在以下情况使用 HTTP 服务器：
- MCP 服务器托管在其他地方
- 你的组织公开了内部 MCP 端点
- 你不希望 Hermes 为该集成启动本地子进程

### OAuth 认证的 HTTP 服务器

大多数托管的 MCP 服务器（Linear、Sentry、Atlassian、Asana、Figma、Stripe 等）需要 OAuth 2.1 而不是静态 bearer 令牌。设置 `auth: oauth`，Hermes 会通过 MCP Python SDK 处理发现、动态客户端注册、PKCE、令牌交换、刷新和升级认证。

```yaml
mcp_servers:
  linear:
    url: "https://mcp.linear.app/mcp"
    auth: oauth
```

首次连接时，Hermes 打印授权 URL，尽可能打开浏览器，并在本地回环端口等待 OAuth 回调。令牌缓存在 `~/.hermes/mcp-tokens/<server>.json`，权限为 0o600；后续运行会静默重用它们直到刷新失败。

**远程/无头主机。** 当 Hermes 运行在与你的浏览器不同的机器上时，回环回调无法到达你的笔记本电脑。有两种方式完成流程：

- **粘贴回传（无需设置）：** 在交互式终端中，Hermes 在授权 URL 旁边打印"或者在这里粘贴重定向 URL…"。在浏览器中打开该 URL，批准，复制浏览器最终到达的完整 URL（重定向会显示连接错误——这是预期的），粘贴到提示处。裸的 `?code=…&state=…` 查询字符串也可以。
- **SSH 端口转发：** 在单独的终端中运行 `ssh -N -L <port>:127.0.0.1:<port> user@host`，然后让重定向正常进行。

参见 [通过 SSH/远程主机的 OAuth](../../guides/oauth-over-ssh.md#mcp-servers) 获取完整演练，包括无 DCR 服务器（例如 Slack）、预注册的 `client_id`/`client_secret`、范围自定义以及通过 `hermes mcp login <server>` 重新认证。

**陷阱——配置自动重载竞争。** 当你在运行中的 Hermes 会话内编辑 `~/.hermes/config.yaml` 时，CLI 会在 30 秒超时后自动重载 MCP 连接。这对于交互式 OAuth 流程来说不够。添加条目后，从新的终端运行 `hermes mcp login <server>`——它会等待完整的 5 分钟让你完成认证。

## 基本配置参考

Hermes 从 `~/.hermes/config.yaml` 的 `mcp_servers` 下读取 MCP 配置。

### 常用键

| 键 | 类型 | 含义 |
|---|---|---|
| `command` | string | stdio MCP 服务器的可执行文件 |
| `args` | list | stdio 服务器的参数 |
| `env` | mapping | 传递给 stdio 服务器的环境变量 |
| `url` | string | HTTP MCP 端点 |
| `headers` | mapping | 远程服务器的 HTTP 头 |
| `timeout` | number | 工具调用超时 |
| `connect_timeout` | number | 初始连接超时 |
| `enabled` | bool | 如果为 `false`，Hermes 完全跳过该服务器 |
| `supports_parallel_tool_calls` | bool | 如果为 `true`，该服务器的工具可能并发运行 |
| `tools` | mapping | 每个服务器的工具过滤和工具策略 |

### 最小 stdio 示例

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
```

### 最小 HTTP 示例

```yaml
mcp_servers:
  company_api:
    url: "https://mcp.internal.example.com"
    headers:
      Authorization: "Bearer ***"
```

## 内置预设

对于知名的MCP服务器，`hermes mcp add` 命令接受 `--preset` 标志，该标志会自动填充传输细节，让您无需自行查找命令和参数。预设仅提供默认值——其他任何内容（环境变量、头信息、过滤规则）通过同一命令行传递仍会生效。

| 预设 | 连接到 |
|---|---|
| `codex` | Codex CLI 的MCP服务器（通过stdio运行 `codex mcp-server`）。需要将 `codex` CLI 添加到系统PATH。 |

```bash
# 一行命令添加Codex CLI作为MCP服务器
hermes mcp add codex --preset codex
```

该操作等效于：

```yaml
mcp_servers:
  codex:
    command: "codex"
    args: ["mcp-server"]
```

您可以选择任意本地名称（例如 `hermes mcp add my-codex --preset codex` 也可以）；预设仅提供 `command`/`args` 的默认值。

## Hermes如何注册MCP工具

Hermes为MCP工具添加前缀，以避免与内置名称冲突：

```text
mcp_<服务器名称>_<工具名称>
```

示例：

| 服务器 | MCP工具 | 注册后的名称 |
|---|---|---|
| `filesystem` | `read_file` | `mcp_filesystem_read_file` |
| `github` | `create-issue` | `mcp_github_create_issue` |
| `my-api` | `query.data` | `mcp_my_api_query_data` |

实际上，您通常不需要手动调用带前缀的名称——Hermes会识别工具并在常规推理过程中自动选用。

## MCP 实用工具

在支持的情况下，Hermes 也会围绕 MCP 资源和提示注册实用工具：

- `list_resources`
- `read_resource`
- `list_prompts`
- `get_prompt`

这些工具会按服务器注册，具有相同的前缀模式，例如：

- `mcp_github_list_resources`
- `mcp_github_get_prompt`

### 重要说明

这些实用工具现在具有能力感知功能：
- 仅当 MCP 会话实际支持资源操作时，Hermes 才会注册资源实用工具
- 仅当 MCP 会话实际支持提示操作时，Hermes 才会注册提示实用工具

因此，一个只暴露可调用工具但不提供资源/提示的服务器将不会获得这些额外的包装器。

## 服务器级过滤

您可以控制每个 MCP 服务器为 Hermes 贡献哪些工具，从而实现对工具命名空间的精细管理。

### 完全禁用服务器

```yaml
mcp_servers:
  legacy:
    url: "https://mcp.legacy.internal"
    enabled: false
```

如果 `enabled: false`，Hermes 会完全跳过该服务器，甚至不会尝试连接。

### 白名单服务器工具

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [create_issue, list_issues]
```

只有这些 MCP 服务器工具会被注册。

### 黑名单服务器工具

```yaml
mcp_servers:
  stripe:
    url: "https://mcp.stripe.com"
    tools:
      exclude: [delete_customer]
```

除被排除的工具外，所有服务器工具都会被注册。

### 优先规则

如果两者同时存在：

```yaml
tools:
  include: [create_issue]
  exclude: [create_issue, delete_issue]
```

`include` 生效。

### 也过滤实用工具

您也可以单独禁用 Hermes 添加的实用工具包装器：

```yaml
mcp_servers:
  docs:
    url: "https://mcp.docs.example.com"
    tools:
      prompts: false
      resources: false
```

这意味着：
- `tools.resources: false` 禁用 `list_resources` 和 `read_resource`
- `tools.prompts: false` 禁用 `list_prompts` 和 `get_prompt`

### 完整示例

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [create_issue, list_issues, search_code]
      prompts: false

  stripe:
    url: "https://mcp.stripe.com"
    headers:
      Authorization: "Bearer ***"
    tools:
      exclude: [delete_customer]
      resources: false

  legacy:
    url: "https://mcp.legacy.internal"
    enabled: false
```

## 如果所有工具都被过滤掉了会怎样？

如果您的配置过滤掉了所有可调用工具，并且禁用或省略了所有支持的实用工具，Hermes 将不会为该服务器创建一个空的运行时 MCP 工具集。

这有助于保持工具列表的整洁。

## 运行时行为

### 发现时间

Hermes 在启动时发现 MCP 服务器，并将其工具注册到常规工具注册表中。

### 动态工具发现

MCP 服务器可以通过发送 `notifications/tools/list_changed` 通知，在运行时通知 Hermes 其可用工具的变化。当 Hermes 收到此通知时，它会自动重新获取服务器的工具列表并更新注册表——无需手动执行 `/reload-mcp`。

这对于功能会动态变化的 MCP 服务器非常有用（例如，当加载新的数据库架构时添加工具的服务器，或当服务下线时移除工具的服务器）。

此刷新操作受锁保护，因此来自同一服务器的快速连续通知不会导致重叠刷新。提示和资源变更通知（`prompts/list_changed`、`resources/list_changed`）会被接收，但目前尚不会触发操作。

### 重新加载

如果您更改了 MCP 配置，请使用：

```text
/reload-mcp
```

这将从配置重新加载 MCP 服务器并刷新可用工具列表。有关由服务器本身推送的运行时工具更改，请参见上文的 [动态工具发现](#dynamic-tool-discovery)。

### 工具集

每个已配置的 MCP 服务器在贡献至少一个注册工具时，也会创建一个运行时工具集：

```text
mcp-<server>
```

这使得 MCP 服务器在工具集层面更易于理解。

## 安全模型

### Stdio 环境变量过滤

对于 stdio 服务器，Hermes 不会盲目传递您完整的 shell 环境。

仅传递显式配置的 `env` 加上一个安全的基础环境。这减少了意外泄露秘密的风险。

### 配置级暴露控制

新的过滤支持也是一种安全控制：
- 禁用您不希望模型看到的危险工具
- 对敏感服务器只暴露一个最小的白名单
- 当您不想暴露该接口时，禁用资源/提示包装器

## 示例用例

### 具有最小问题管理接口的 GitHub 服务器

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [list_issues, create_issue, update_issue]
      prompts: false
      resources: false
```

像这样使用：

```text
Show me open issues labeled bug, then draft a new issue for the flaky MCP reconnection behavior.
```

### 移除了危险操作的 Stripe 服务器

```yaml
mcp_servers:
  stripe:
    url: "https://mcp.stripe.com"
    headers:
      Authorization: "Bearer ***"
    tools:
      exclude: [delete_customer, refund_payment]
```

像这样使用：

```text
Look up the last 10 failed payments and summarize common failure reasons.
```

### 用于单个项目根目录的文件系统服务器

```yaml
mcp_servers:
  project_fs:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/my-project"]
```

像这样使用：

```text
Inspect the project root and explain the directory layout.
```

## 故障排除

### MCP 服务器无法连接

检查：

```bash
# 验证 MCP 依赖已安装（标准安装中已包含）
cd ~/.hermes/hermes-agent && uv pip install -e ".[mcp]"

node --version
npx --version
```

然后验证您的配置并重启 Hermes。

### 工具未出现

可能的原因：
- 服务器连接失败
- 发现失败
- 您的过滤配置排除了这些工具
- 该服务器上不存在对应的实用工具功能
- 服务器已被 `enabled: false` 禁用

如果您正在进行过滤，这是预期行为。

### 为什么资源或提示实用工具没有出现？

因为 Hermes 现在仅在以下两个条件同时满足时注册这些包装器：
1. 您的配置允许它们
2. 服务器会话实际支持该功能

这是有意为之，旨在保持工具列表的诚实。

## 并行工具调用

默认情况下，MCP 工具是顺序执行的——一次一个。如果您的 MCP 服务器暴露的工具可以安全地并发运行（例如只读查询、独立的 API 调用），您可以选择启用并行执行：

```yaml
mcp_servers:
  docs:
    command: "docs-server"
    supports_parallel_tool_calls: true
```

当 `supports_parallel_tool_calls` 为 `true` 时，Hermes 可能会在单个工具调用批次中同时执行来自该服务器的多个工具，就像它对内置只读工具（web_search、read_file 等）所做的那样。

:::caution
仅为工具可以安全同时运行的 MCP 服务器启用并行调用。如果工具读写共享状态、文件、数据库或外部资源，请在启用此设置前审查读写竞争条件。
:::

## MCP 采样支持

MCP 服务器可以通过 `sampling/createMessage` 协议请求 Hermes 进行 LLM 推理。这允许 MCP 服务器代表自己请求 Hermes 生成文本——适用于需要 LLM 能力但没有自身模型访问权限的服务器。

对于所有 MCP 服务器，**默认启用** 采样（当 MCP SDK 支持时）。可在 `sampling` 键下按服务器配置：

```yaml
mcp_servers:
  my_server:
    command: "my-mcp-server"
    sampling:
      enabled: true            # 启用采样（默认：true）
      model: "openai/gpt-4o"  # 覆盖采样请求的模型（可选）
      max_tokens_cap: 4096     # 每次采样响应的最大令牌数（默认：4096）
      timeout: 30              # 每个请求的超时时间（秒）（默认：30）
      max_rpm: 10              # 速率限制：每分钟最大请求数（默认：10）
      max_tool_rounds: 5       # 采样循环中的最大工具使用轮次（默认：5）
      allowed_models: []       # 允许服务器请求的模型名称白名单（空列表 = 任意模型）
      log_level: "info"        # 审计日志级别：debug、info 或 warning（默认：info）
```

采样处理器包括一个滑动窗口速率限制器、每个请求的超时限制和工具循环深度限制，以防止失控使用。指标（请求数、错误数、使用的令牌数）会按服务器实例进行跟踪。

要为特定服务器禁用采样：

```yaml
mcp_servers:
  untrusted_server:
    url: "https://mcp.example.com"
    sampling:
      enabled: false
```

## 将 Hermes 运行为 MCP 服务器

除了连接 **到** MCP 服务器，Hermes 本身也可以**作为** MCP 服务器。这使得其他支持 MCP 的智能体（Claude Code、Cursor、Codex 或任何 MCP 客户端）能够使用 Hermes 的消息功能 — 列出对话、读取消息历史记录，以及通过所有您连接的平台发送消息。

### 何时使用此功能

- 您希望 Claude Code、Cursor 或其他编码智能体通过 Hermes 发送和读取 Telegram/Discord/Slack 消息。
- 您需要一个能同时桥接到 Hermes 所有已连接消息平台的单一 MCP 服务器。
- 您已有一个正在运行的、连接了相关平台的 Hermes 网关。

### 快速开始

```bash
hermes mcp serve
```

此命令启动一个标准输入/输出 MCP 服务器。进程生命周期由 MCP 客户端（而非您）管理。

### MCP 客户端配置

将 Hermes 添加到您的 MCP 客户端配置中。例如，在 Claude Code 的 `~/.claude/claude_desktop_config.json` 文件中：

```json
{
  "mcpServers": {
    "hermes": {
      "command": "hermes",
      "args": ["mcp", "serve"]
    }
  }
}
```

或者，如果您将 Hermes 安装在特定位置：

```json
{
  "mcpServers": {
    "hermes": {
      "command": "/home/user/.hermes/hermes-agent/venv/bin/hermes",
      "args": ["mcp", "serve"]
    }
  }
}
```

### 可用工具

该 MCP 服务器提供了 10 个工具，涵盖了 OpenClaw 的频道桥接表面功能，并增加了一个 Hermes 特有的频道浏览器：

| 工具 | 描述 |
|------|------|
| `conversations_list` | 列出活跃的消息对话。可按平台筛选或按名称搜索。 |
| `conversation_get` | 通过会话键获取单个对话的详细信息。 |
| `messages_read` | 读取某个对话的近期消息历史。 |
| `attachments_fetch` | 从特定消息中提取非文本附件（图片、媒体）。 |
| `events_poll` | 轮询自某个光标位置以来的新对话事件。 |
| `events_wait` | 长轮询/阻塞，直到下一个事件到达（近实时）。 |
| `messages_send` | 通过平台发送消息（例如 `telegram:123456`， `discord:#general`）。 |
| `channels_list` | 列出所有平台上可用的消息目标。 |
| `permissions_list_open` | 列出在本桥接会话期间观察到的待批准请求。 |
| `permissions_respond` | 批准或拒绝一个待批准的请求。 |

### 事件系统

MCP 服务器包含一个实时事件桥接器，它会轮询 Hermes 的会话数据库以获取新消息。这使得 MCP 客户端能够近实时地感知到传入的对话：

```
# 轮询新事件（非阻塞）
events_poll(after_cursor=0)

# 等待下一个事件（阻塞直至超时）
events_wait(after_cursor=42, timeout_ms=30000)
```

事件类型：`message`、`approval_requested`、`approval_resolved`

事件队列位于内存中，并在桥接器连接时启动。较早的消息可通过 `messages_read` 获取。

### 选项

```bash
hermes mcp serve              # 正常模式
hermes mcp serve --verbose    # 在标准错误输出中启用调试日志
```

### 工作原理

MCP 服务器直接从 Hermes 的会话存储（`~/.hermes/sessions/sessions.json` 和 SQLite 数据库）读取对话数据。一个后台线程轮询数据库以获取新消息，并维护一个内存中的事件队列。对于发送消息，它使用与 Hermes 智能体本身相同的 `send_message` 基础设施。

网关**无需**运行即可进行读操作（列出对话、读取历史记录、轮询事件）。网关**需要**运行才能进行发送操作，因为平台适配器需要活跃的连接。

### 当前限制

- 内置的 `hermes mcp serve` 目前仅暴露一个**标准输入/输出** MCP 服务器。如果您需要一个 HTTP MCP 服务器，请运行一个单独的适配器 — 或者，更常见的是使用 Hermes 的 MCP **客户端**侧，它已支持标准输入/输出和 HTTP（在 `mcp_servers.yaml` / `config.yaml` 中配置 `url` + `headers`；参见上方的[HTTP 服务器](#http-servers)）。
- 事件轮询间隔约为 200 毫秒，通过针对修改时间优化的数据库轮询实现（当文件未更改时跳过工作）。
- 尚不支持 `claude/channel` 推送通知协议。
- 仅支持文本发送（`messages_send` 无法发送媒体/附件）。

## 相关文档

- [在 Hermes 中使用 MCP](/guides/use-mcp-with-hermes)
- [CLI 命令](/reference/cli-commands)
- [斜杠命令](/reference/slash-commands)
- [常见问题](/reference/faq)