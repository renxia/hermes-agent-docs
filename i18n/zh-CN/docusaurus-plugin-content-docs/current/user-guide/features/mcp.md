---
sidebar_position: 4
title: "MCP (Model Context Protocol)"
description: "Connect Hermes Agent to external tool servers via MCP — and control exactly which MCP tools Hermes loads"
---

# MCP (Model Context Protocol)

MCP 允许 Hermes 智能体连接到外部工具服务器，使智能体可以使用 Hermes 本身之外的工具——GitHub、数据库、文件系统、浏览器技术栈、内部 API 等等。

如果你曾希望 Hermes 使用某个已经存在于其他地方的现有工具，MCP 通常是实现这一目标最简洁的方式。

## MCP 为你带来的能力

- 无需先编写原生 Hermes 工具即可访问外部工具生态系统
- 在相同配置中同时支持本地 stdio 服务器和远程 HTTP MCP 服务器
- 启动时自动发现和注册工具
- 当服务器支持时，为 MCP 资源和提示提供实用封装器
- 按服务器进行过滤，使你能够仅暴露你真正希望 Hermes 看到的 MCP 工具

## 快速开始

1. MCP 支持随标准安装一起提供——无需额外步骤。

2. 将 MCP 服务器添加到 `~/.hermes/config.yaml`：

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

4. 要求 Hermes 使用 MCP 支持的功能。

例如：

```text
列出 /home/user/projects 中的文件并总结仓库结构。
```

Hermes 将发现 MCP 服务器的工具，并像使用任何其他工具一样使用它们。

## 目录：Nous 批准的 MCP 一键安装

Hermes 附带一份经过 Nous 员工审查和合并的 MCP 服务器精选目录。它们在默认情况下处于禁用状态——只安装你实际需要的。

```bash
hermes mcp                # 交互式选择器（默认）
hermes mcp catalog        # 纯文本列表，可用于脚本
hermes mcp install n8n    # 按名称安装目录条目
```

选择器会显示每个条目及其当前状态：

```
n8n          available              从 Hermes 管理和检查 n8n 工作流
linear       enabled                 Linear 问题/项目管理（远程 OAuth）
github       installed (disabled)    GitHub 仓库 + PR 工具
```

在某一行上按 `Enter` 以安装（并完成任何所需的凭证配置）、启用、禁用或卸载。目录条目存储在 hermes-agent 仓库的 `optional-mcps/` 目录下——存在于该目录中即表示已通过 Nous 审批。没有社区提交层级；条目通过合并 PR 来添加。

目录条目可能需要：

- **API 密钥** —— Hermes 在安装时提示并将值写入 `~/.hermes/.env`。非机密值（基本 URL）也写入同一文件。
- **OAuth**（远程 MCP）—— 在你的配置中写为 `auth: oauth`；MCP 客户端在首次连接时打开浏览器。
- **OAuth**（Google/GitHub 等第三方提供商）—— 如果你尚未认证，Hermes 会指引你运行 `hermes auth <provider>`。

### 安装时的工具选择

配置凭证后，Hermes 会探测 MCP 服务器以列出它公开的每个工具，并显示一个检查清单：

```
Select tools for 'linear' (SPACE toggle, ENTER confirm)
  [x] find_issues       查找匹配查询的问题
  [x] get_issue         获取单个问题
  [x] create_issue      创建新问题
  [ ] delete_workspace  删除 Linear 工作区
  ...
```

预勾选的行来自：

1. **你之前的选择**，如果你之前安装过此条目（重新安装会保留你之前的选择——清单的默认值不会覆盖它）
2. **清单的 `tools.default_enabled`**，如果条目声明了此值（某些目录条目会预先剔除可变或很少用的工具）
3. **全部工具**，如果以上两者均不适用

用 ENTER 提交检查清单。只有勾选的工具最终会出现在 `mcp_servers.<name>.tools.include` 中。如果选择了所有内容，则不写入过滤器（最干净的配置形态，行为相同）。

**如果探测失败**（服务器不可达、OAuth 尚未完成、后端服务未运行），安装仍会成功：清单的 `tools.default_enabled` 会被直接应用（如果已声明），或者不写入过滤器（如果未声明）。一旦服务器可达，重新运行 `hermes mcp configure <name>` 以进行细化。

### 信任模型

安装目录条目会运行清单指定的任何内容——`git clone`、条目的 `bootstrap` 命令（`pip install`、`npm install` 等），以及最终的 MCP 服务器自身代码。清单受 hermes-agent 仓库的 PR 审查约束，因此 Nous 在发布前已审查了每个条目——**但你仍应在安装前阅读清单**，特别是 `source:` 字段的仓库、`install.bootstrap:` 命令以及任何 `transport.command:` 调用。

清单位于 GitHub 上的
[`optional-mcps/<name>/manifest.yaml`](https://github.com/NousResearch/hermes-agent/tree/main/optional-mcps)。选择器在安装时还会打印清单的 `source:` URL，以便你快速验证上游仓库。Web 仪表板的 MCP 页面为每个目录条目展示了相同的详细信息——传输方式、认证类型、端点 URL（HTTP）或命令 + 参数（stdio）、git 安装源/引用和引导命令，以及设置说明——其中 `source:` 渲染为可点击的链接，因此你可以在点击安装之前检查条目连接或运行的准确内容。

### 清单版本兼容性

清单会固定一个 `manifest_version`。目录是向前兼容的：如果某个 PR 添加了一个 `manifest_version` 比你安装的 Hermes 所理解的更新的条目，选择器会为该条目显示一个警告（`⚠ '<name>' requires a newer Hermes`），而不是静默隐藏它。看到该警告时运行 `hermes update` 以安装最新的 Hermes。

### 运行时 `${ENV_VAR}` 替换

在条目的 `transport.command`、`transport.args`、`transport.url` 和 `headers` 中，`${VAR}` 占位符在服务器连接时从环境变量（包括 `~/.hermes/.env` 中的所有内容）解析。当目录条目想引用用户在别处配置的值时，这很有用——例如 `${HOME}/foo` 或 `${MY_PROVIDER_TOKEN}`。

注意这与目录清单中的 `${INSTALL_DIR}` 不同，后者在安装时被替换为目录克隆条目仓库到的路径。

### 稍后更新工具选择

```bash
hermes mcp configure linear
```

重新打开相同的检查清单，并预勾选你当前的选择。当你想启用更多工具，或者服务器添加了你想要选择的新工具时，使用此命令。

### 更新目录清单

MCP 永远不会自动更新。如果 Hermes 更新后清单版本发生了变化，重新运行 `hermes mcp install <name>` 以刷新。

要将 MCP 请提交针对
[`optional-mcps/`](https://github.com/NousResearch/hermes-agent/tree/main/optional-mcps) 的 PR。

## 两种类型的 MCP 服务器

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

在以下情况下使用 stdio 服务器：
- 服务器安装在本地
- 你希望以低延迟访问本地资源
- 你正在查看显示 `command`、`args` 和 `env` 的 MCP 服务器文档

### HTTP 服务器

HTTP MCP 服务器是 Hermes 直接连接的远程端点。

```yaml
mcp_servers:
  remote_api:
    url: "https://mcp.example.com/mcp"
    headers:
      Authorization: "Bearer ***"
```

在以下情况下使用 HTTP 服务器：
- MCP 服务器托管在别处
- 你的组织暴露了内部 MCP 端点
- 你不想让 Hermes 为该集成派生本地子进程

### 经 OAuth 认证的 HTTP 服务器

大多数托管的 MCP 服务器（Linear、Sentry、Atlassian、Asana、Figma、Stripe……）需要 OAuth 2.1 而非静态承载令牌。设置 `auth: oauth`，Hermes 会通过 MCP Python SDK 处理发现、动态客户端注册、PKCE、令牌交换、刷新和分步认证。

```yaml
mcp_servers:
  linear:
    url: "https://mcp.linear.app/mcp"
    auth: oauth
```

首次连接时，Hermes 会打印一个授权 URL，在可能的情况下打开你的浏览器，并在本地回环端口上等待 OAuth 回调。令牌以 0o600 权限缓存在 `~/.hermes/mcp-tokens/<server>.json` 中；后续运行会静默重用它们，直到刷新失败。

**远程/无头主机。** 当 Hermes 运行在与你的浏览器不同的机器上时，回环回调无法到达你的笔记本电脑。两种完成流程的方式：

- **粘贴返回（无需设置）：** 在交互式终端上，Hermes 在授权 URL 旁边打印"或者在此粘贴重定向 URL……"。在浏览器中打开 URL，批准，复制浏览器最终停留的完整 URL（重定向将显示连接错误——这是正常的），将其粘贴在提示处。裸 `?code=…&state=…` 查询字符串也可用。
- **SSH 端口转发：** 在单独的终端中运行 `ssh -N -L <port>:127.0.0.1:<port> user@host`，然后让重定向流程正常进行。

查看 [OAuth over SSH / Remote Hosts](../../guides/oauth-over-ssh.md#mcp-servers) 获取完整演练，包括无 DCR 的服务器（如 Slack）、预注册的 `client_id`/`client_secret`、范围自定义以及通过 `hermes mcp login <server>` 重新认证。

**陷阱——不支持自动注册的提供商（Google Drive、Atlassian）。** 某些服务器拒绝裸 `auth: oauth` 所依赖的动态客户端注册步骤（RFC 7591）——Google 的官方 Drive 服务器（`https://drivemcp.googleapis.com/mcp/v1`）返回 `400 Bad Request`，因此不会创建 OAuth 客户端，也不会获取令牌。症状很隐蔽：这些服务器还在*未认证*的情况下提供 `tools/list`，因此 `hermes mcp login` 可以列出工具并且看起来成功了，但之后每个真正的工具调用都会超时。`hermes mcp login` 现在会检测这种情况（它检查令牌是否实际落盘），并告诉你需要提供自己的 OAuth 客户端。在提供商的控制台中创建一个并添加到配置中：

```yaml
mcp_servers:
  googledrive:
    url: "https://drivemcp.googleapis.com/mcp/v1"
    auth: oauth
    oauth:
      client_id: "<your-oauth-client-id>"
      client_secret: "<your-oauth-client-secret>"
```

然后运行 `hermes mcp login googledrive`——使用预注册的客户端，Hermes 跳过注册并运行正常的浏览器授权流程。

**陷阱——配置自动重载竞争。** 当你在运行中的 Hermes 会话内编辑 `~/.hermes/config.yaml` 时，CLI 会以 30 秒超时自动重载 MCP 连接。这对于交互式 OAuth 流程来说是不够的。添加条目后，从新的终端运行 `hermes mcp login <server>`——它会等待完整的 5 分钟让你完成认证。

## mTLS / 客户端证书

需要相互 TLS（客户端证书认证）的远程 HTTP MCP 服务器通过 `client_cert` / `client_key` 支持。Hermes 将解析后的证书传递给底层 HTTP 客户端进行 TLS 握手。

`client_cert` 接受三种形式：

- **单个合并的 PEM 路径**——一个包含证书和私钥的文件：

```yaml
mcp_servers:
  internal_api:
    url: "https://mcp.internal.example.com/mcp"
    client_cert: "~/.certs/mcp-client.pem"
```

- **`[cert, key]` 2 元组**——证书和密钥分别存储在单独的文件中（等同于设置 `client_cert` + `client_key`）：

```yaml
mcp_servers:
  internal_api:
    url: "https://mcp.internal.example.com/mcp"
    client_cert: ["~/.certs/mcp-client.crt", "~/.certs/mcp-client.key"]
```

- **`[cert, key, password]` 3 元组**——当私钥已加密时，第三个元素是密钥密码：

```yaml
mcp_servers:
  internal_api:
    url: "https://mcp.internal.example.com/mcp"
    client_cert: ["~/.certs/mcp-client.crt", "~/.certs/mcp-client.key", "${MCP_KEY_PASSWORD}"]
```

你也可以通过 `client_cert`（合并的 PEM）加上显式的 `client_key` 来将证书和密钥完全分开。路径支持 `~` 展开；缺失的文件会引发清晰的、服务器范围的错误，而不是模糊的 TLS 握手失败。

## 基本配置参考

Hermes 从 `~/.hermes/config.yaml` 中的 `mcp_servers` 读取 MCP 配置。

### 常用键

| 键 | 类型 | 含义 |
|---|---|---|
| `command` | string | stdio MCP 服务器的可执行文件 |
| `args` | list | stdio 服务器的参数 |
| `env` | mapping | 传递给 stdio 服务器的环境变量 |
| `url` | string | HTTP MCP 端点 |
| `headers` | mapping | 远程服务器的 HTTP 请求头 |
| `client_cert` | string \| list | mTLS 的客户端证书——合并的 PEM 路径，或 `[cert, key]` / `[cert, key, password]` |
| `client_key` | string | 客户端私钥 PEM 路径（与 `client_cert` 分离时） |
| `timeout` | number | 工具调用超时 |
| `connect_timeout` | number | 初始连接超时 |
| `enabled` | bool | 如果为 `false`，Hermes 将完全跳过该服务器 |
| `supports_parallel_tool_calls` | bool | 如果为 `true`，该服务器的工具可以并发运行 |
| `tools` | mapping | 按服务器过滤工具和实用策略 |

### 最简 stdio 示例

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
```

### 最简 HTTP 示例

```yaml
mcp_servers:
  company_api:
    url: "https://mcp.internal.example.com"
    headers:
      Authorization: "Bearer ***"
```

## 内置预设

对于知名的 MCP 服务器，`hermes mcp add` 接受 `--preset` 标志来自动填充传输细节，无需手动查找命令和参数。预设仅提供默认值——其他任何内容（环境变量、请求头、过滤等）在同一命令行中传入的仍然优先。

| 预设 | 配置内容 |
|---|---|
| `codex` | Codex CLI 的 MCP 服务器（通过 stdio 运行 `codex mcp-server`）。需要 `codex` CLI 在 PATH 中。 |

```bash
# 一行命令将 Codex CLI 添加为 MCP 服务器
hermes mcp add codex --preset codex
```

这相当于写入：

```yaml
mcp_servers:
  codex:
    command: "codex"
    args: ["mcp-server"]
```

你可以选择任意本地名称（`hermes mcp add my-codex --preset codex` 也可以）；预设仅提供 `command`/`args` 的默认值。

## Hermes 如何注册 MCP 工具

Hermes 会为 MCP 工具添加前缀，以避免与内置名称冲突：

```text
mcp_<server_name>_<tool_name>
```

示例：

| 服务器 | MCP 工具 | 注册名称 |
|---|---|---|
| `filesystem` | `read_file` | `mcp_filesystem_read_file` |
| `github` | `create_issue` | `mcp_github_create_issue` |
| `my-api` | `query.data` | `mcp_my_api_query_data` |

实际上，你通常不需要手动调用带前缀的名称——Hermes 在正常推理过程中会看到该工具并自动选择它。

## MCP 实用工具

在支持的情况下，Hermes 还会围绕 MCP 资源和提示注册实用工具：

- `list_resources`
- `read_resource`
- `list_prompts`
- `get_prompt`

这些工具按服务器以相同的前缀模式注册，例如：

- `mcp_github_list_resources`
- `mcp_github_get_prompt`

### 重要

这些实用工具现在具备能力感知：

- 仅当 MCP 会话实际支持资源操作时，Hermes 才会注册资源实用工具
- 仅当 MCP 会话实际支持提示操作时，Hermes 才会注册提示实用工具

因此，一个仅暴露可调用工具但没有资源/提示的服务器将不会获得那些额外的包装器。

## 按服务器过滤

你可以控制每个 MCP 服务器向 Hermes 贡献哪些工具，从而对你的工具命名空间进行细粒度管理。

### 完全禁用服务器

```yaml
mcp_servers:
  legacy:
    url: "https://mcp.legacy.internal"
    enabled: false
```

如果 `enabled: false`，Hermes 将完全跳过该服务器，甚至不会尝试连接。

### 服务器工具白名单

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

仅注册这些 MCP 服务器工具。

### 服务器工具黑名单

```yaml
mcp_servers:
  stripe:
    url: "https://mcp.stripe.com"
    tools:
      exclude: [delete_customer]
```

除排除的工具外，所有服务器工具都会被注册。

### 优先级规则

如果两者同时存在：

```yaml
tools:
  include: [create_issue]
  exclude: [create_issue, delete_issue]
```

`include` 优先。

### 同时过滤实用工具

你还可以单独禁用 Hermes 添加的实用包装器：

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

## 如果所有工具都被过滤掉会怎样？

如果你的配置过滤掉了所有可调用工具，并禁用了或省略了所有受支持的实用工具，Hermes 将不会为该服务器创建空的运行时 MCP 工具集。

这使工具列表保持整洁。

## 运行时行为

### 发现时机

Hermes 在启动时发现 MCP 服务器，并将其工具注册到常规工具注册表中。

### 动态工具发现

MCP 服务器可以在运行时可用工具发生变化时，通过发送 `notifications/tools/list_changed` 通知来告知 Hermes。当 Hermes 收到此通知时，它会自动重新获取服务器的工具列表并更新注册表——无需手动执行 `/reload-mcp`。

这对于能力动态变化的 MCP 服务器很有用（例如，当加载新数据库模式时添加工具，或服务离线时移除工具的服务器）。

刷新操作受锁保护，因此来自同一服务器的快速连续通知不会导致重叠刷新。提示和资源变更通知（`prompts/list_changed`、`resources/list_changed`）会被接收但暂不处理。

### 重新加载

如果你更改了 MCP 配置，请使用：

```text
/reload-mcp
```

这将从配置重新加载 MCP 服务器并刷新可用的工具列表。对于由服务器自身推送的运行时工具变更，请参阅上方的[动态工具发现](#dynamic-tool-discovery)。

### 工具集

每个配置了 MCP 服务器在贡献至少一个注册工具时，还会创建一个运行时工具集：

```text
mcp-<server>
```

这使得在工具集层面上更容易理解 MCP 服务器。

## 安全模型

### Stdio 环境过滤

对于 stdio 服务器，Hermes 不会盲目传递你的完整 shell 环境。

仅传递显式配置的 `env` 以及一组安全基线。这减少了意外泄露机密的风险。

### 配置级暴露控制

新的过滤支持也是一种安全控制：

- 禁用你不想让模型看到的危险工具
- 仅为敏感服务器暴露最小的白名单
- 当你不希望暴露该功能时，禁用资源/提示包装器

## 示例用例

### 具有最小问题管理功能的 GitHub 服务器

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

使用方式：

```text
Show me open issues labeled bug, then draft a new issue for the flaky MCP reconnection behavior.
```

### 已移除危险操作的 Stripe 服务器

```yaml
mcp_servers:
  stripe:
    url: "https://mcp.stripe.com"
    headers:
      Authorization: "Bearer ***"
    tools:
      exclude: [delete_customer, refund_payment]
```

使用方式：

```text
Look up the last 10 failed payments and summarize common failure reasons.
```

### 用于单一项目根目录的文件系统服务器

```yaml
mcp_servers:
  project_fs:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/my-project"]
```

使用方式：

```text
Inspect the project root and explain the directory layout.
```

## 故障排除

### MCP 服务器无法连接

检查：

```bash
# 验证 MCP 依赖是否已安装（已包含在标准安装中）
cd ~/.hermes/hermes-agent && uv pip install -e ".[mcp]"

node --version
npx --version
```

然后验证你的配置并重启 Hermes。

### 工具未出现

可能的原因：

- 服务器连接失败
- 发现失败
- 你的过滤配置排除了这些工具
- 该服务器上不存在该实用工具能力
- 服务器被 `enabled: false` 禁用

如果你是有意进行过滤，这是预期行为。

### 为什么资源或提示实用工具没有出现？

因为 Hermes 现在仅在两者都为真时才注册这些包装器：

1. 你的配置允许它们
2. 该服务器会话实际支持该能力

这是有意为之，以保持工具列表的准确性。

## 并行工具调用

默认情况下，MCP 工具按顺序执行——一次一个。如果你的 MCP 服务器暴露了可以安全并发运行的工具（例如，只读查询、独立的 API 调用），你可以选择启用并行执行：

```yaml
mcp_servers:
  docs:
    command: "docs-server"
    supports_parallel_tool_calls: true
```

当 `supports_parallel_tool_calls` 为 `true` 时，Hermes 可以在单个工具调用批次中同时执行来自该服务器的多个工具，就像它对内置只读工具（web_search、read_file 等）所做的那样。

:::caution
仅对工具可以安全同时运行的 MCP 服务器启用并行调用。如果工具读写共享状态、文件、数据库或外部资源，请在启用此设置之前仔细审查读写竞态条件。
:::

## MCP 采样支持

MCP 服务器可以通过 `sampling/createMessage` 协议向 Hermes 请求 LLM 推理。这允许 MCP 服务器代表自身请求 Hermes 生成文本——对于需要 LLM 能力但没有自己模型访问权限的服务器很有用。

采样默认对所有 MCP 服务器**启用**（当 MCP SDK 支持时）。在 `sampling` 键下按服务器进行配置：

```yaml
mcp_servers:
  my_server:
    command: "my-mcp-server"
    sampling:
      enabled: true            # 启用采样（默认：true）
      model: "openai/gpt-4o"  # 覆盖采样请求使用的模型（可选）
      max_tokens_cap: 4096     # 每次采样响应的最大 token 数（默认：4096）
      timeout: 30              # 每次请求的超时秒数（默认：30）
      max_rpm: 10              # 速率限制：每分钟最大请求数（默认：10）
      max_tool_rounds: 5       # 采样循环中最大工具使用轮数（默认：5）
      allowed_models: []       # 服务器可请求的模型名称白名单（空 = 任何模型）
      log_level: "info"        # 审计日志级别：debug、info 或 warning（默认：info）
```

采样处理器包含滑动窗口速率限制器、每请求超时和工具循环深度限制，以防止失控使用。指标（请求数、错误、使用的 token）按服务器实例跟踪。

要禁用特定服务器的采样：

```yaml
mcp_servers:
  untrusted_server:
    url: "https://mcp.example.com"
    sampling:
      enabled: false
```

## 将 Hermes 作为 MCP 服务器运行

除了连接**到** MCP 服务器之外，Hermes 也可以**作为** MCP 服务器运行。这使得其他支持 MCP 的智能体（Claude Code、Cursor、Codex 或任何 MCP 客户端）可以使用 Hermes 的消息功能——列出对话、读取消息历史记录，以及通过你所有连接的平台发送消息。

### 何时使用

- 你希望 Claude Code、Cursor 或其他编程智能体通过 Hermes 发送和读取 Telegram/Discord/Slack 消息
- 你希望有一个单一的 MCP 服务器，一次性桥接到 Hermes 所有连接的消息平台
- 你已经运行了一个已连接平台的 Hermes 网关

### 快速开始

```bash
hermes mcp serve
```

这将启动一个 stdio MCP 服务器。MCP 客户端（不是你）管理进程生命周期。

### MCP 客户端配置

将 Hermes 添加到你的 MCP 客户端配置中。例如，在 Claude Code 的 `~/.claude/claude_desktop_config.json` 中：

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

或者，如果你将 Hermes 安装在特定位置：

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

MCP 服务器暴露 10 个工具，与 OpenClaw 的通道桥接功能面匹配，外加一个 Hermes 特定的通道浏览器：

| 工具 | 描述 |
|------|-------------|
| `conversations_list` | 列出活跃的消息对话。按平台过滤或按名称搜索。 |
| `conversation_get` | 通过会话键获取一个对话的详细信息。 |
| `messages_read` | 读取对话的最近消息历史。 |
| `attachments_fetch` | 从特定消息中提取非文本附件（图像、媒体）。 |
| `events_poll` | 轮询游标位置之后的新对话事件。 |
| `events_wait` | 长轮询/阻塞直到下一个事件到达（近实时）。 |
| `messages_send` | 通过平台发送消息（例如 `telegram:123456`、`discord:#general`）。 |
| `channels_list` | 列出所有平台上的可用消息目标。 |
| `permissions_list_open` | 列出此桥接会话期间观察到的待审批请求。 |
| `permissions_respond` | 允许或拒绝待处理的审批请求。 |

### 事件系统

MCP 服务器包含一个实时事件桥接，轮询 Hermes 的会话数据库以获取新消息。这使得 MCP 客户端能够近乎实时地感知传入对话：

```
# 轮询新事件（非阻塞）
events_poll(after_cursor=0)

# 等待下一个事件（阻塞至超时）
events_wait(after_cursor=42, timeout_ms=30000)
```

事件类型：`message`、`approval_requested`、`approval_resolved`

事件队列位于内存中，在桥接连接时启动。较早的消息可通过 `messages_read` 获取。

### 选项

```bash
hermes mcp serve              # 正常模式
hermes mcp serve --verbose    # 在 stderr 上输出调试日志
```

### 工作原理

MCP 服务器直接从 Hermes 的会话存储（`~/.hermes/sessions/sessions.json` 和 SQLite 数据库）读取对话数据。后台线程轮询数据库以获取新消息，并维护内存中的事件队列。发送消息时，使用与 Hermes 智能体本身相同的 `send_message` 基础设施。

读取操作（列出对话、读取历史、轮询事件）不需要网关运行。发送操作**需要**网关运行，因为平台适配器需要活跃连接。

### 当前限制

- 内嵌的 `hermes mcp serve` 目前仅暴露 **stdio** MCP 服务器。如果你需要 HTTP MCP 服务器，请运行一个单独的适配器——或者，更常见的是，使用 Hermes 的 MCP **客户端**端，它已经支持 stdio 和 HTTP（`mcp_servers.yaml` / `config.yaml` 中的 `url` + `headers`；请参阅上方的[HTTP 服务器](#http-servers)）。
- 通过 mtime 优化的 DB 轮询以约 200ms 间隔进行轮询（文件未变化时跳过工作）
- 尚不支持 `claude/channel` 推送通知协议
- 仅支持纯文本发送（不通过 `messages_send` 发送媒体/附件）

## 相关文档

- [在 Hermes 中使用 MCP](/guides/use-mcp-with-hermes)
- [CLI 命令](/reference/cli-commands)
- [斜杠命令](/reference/slash-commands)
- [常见问题](/reference/faq)