---
sidebar_position: 6
title: "在 Hermes 中使用 MCP"
description: "将 MCP 服务器连接到 Hermes 智能体的实用指南，包括筛选其工具并在实际工作流中安全使用它们"
---

# 在 Hermes 中使用 MCP

本指南展示了如何在日常实际工作流中使用 MCP 与 Hermes 智能体。

如果说功能页面解释了 MCP 是什么，那么本指南则侧重于如何快速且安全地从中获益。

## 何时应使用 MCP？

在以下情况下使用 MCP：
- 某个工具已以 MCP 形式存在，且您不想构建原生 Hermes 工具
- 您希望 Hermes 通过一个清晰的 RPC 层操作本地或远程系统
- 您需要对每个服务器进行细粒度的暴露控制
- 您希望在不修改 Hermes 核心的情况下，将 Hermes 连接到内部 API、数据库或公司系统

在以下情况下不要使用 MCP：
- 现有的内置 Hermes 工具已能很好地完成工作
- 服务器暴露了大量危险的工具表面，而您尚未准备好对其进行筛选
- 您只需要一个非常狭窄的集成，而原生工具会更简单、更安全

## 心智模型

将 MCP 视为一个适配层：

- Hermes 仍然是智能体
- MCP 服务器提供工具
- Hermes 在启动或重新加载时自动发现这些工具
- 模型可以像使用普通工具一样使用它们
- 你可以控制每个服务器暴露多少功能

最后这一点很重要。良好的 MCP 使用方式不仅仅是“连接所有东西”，而是“连接正确的东西，并暴露最小的可用功能面”。

## 步骤 1：安装 MCP 支持

如果你使用标准安装脚本安装了 Hermes，则 MCP 支持已包含在内（安装程序会运行 `uv pip install -e ".[all]"`）。

如果你未安装额外组件并需要单独添加 MCP 支持：

```bash
cd ~/.hermes/hermes-agent
uv pip install -e ".[mcp]"
```

对于基于 npm 的服务器，请确保 Node.js 和 `npx` 可用。

对于许多 Python MCP 服务器，`uvx` 是一个不错的默认选择。

## 步骤 2：先添加一个服务器

从一个单一且安全的服务器开始。

示例：仅允许访问一个项目目录的文件系统。

```yaml
mcp_servers:
  project_fs:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/my-project"]
```

然后启动 Hermes：

```bash
hermes chat
```

现在提出一个具体问题：

```text
检查此项目并总结仓库结构。
```

## 步骤 3：验证 MCP 是否加载

你可以通过以下几种方式验证 MCP 是否加载：

- 配置后，Hermes 的横幅/状态应显示 MCP 集成
- 询问 Hermes 它有哪些可用工具
- 配置更改后使用 `/reload-mcp`
- 如果服务器连接失败，请检查日志

一个实用的测试提示：

```text
告诉我当前有哪些基于 MCP 的工具可用。
```

## 步骤 4：立即开始过滤

如果服务器暴露了大量工具，请不要等到以后再处理。

### 示例：仅白名单列出你想要的工具

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [list_issues, create_issue, search_code]
```

对于敏感系统，这通常是最佳默认设置。

## WSL2：将 WSL 中的 Hermes 桥接到 Windows Chrome

在以下情况下，这是实用的设置：

- Hermes 运行在 WSL2 内
- 你要控制的浏览器是 Windows 上已登录的普通 Chrome
- 从 WSL 使用 `/browser connect` 不方便或不可靠

在此设置中，Hermes **不会**直接连接到 Chrome。而是：

- Hermes 运行在 WSL 中
- Hermes 启动一个本地 stdio MCP 服务器
- 该 MCP 服务器通过 Windows 互操作（`cmd.exe` 或 `powershell.exe`）启动
- MCP 服务器附加到你的实时 Windows Chrome 会话

心智模型：

```text
Hermes (WSL) -> MCP stdio 桥接 -> Windows Chrome
```

### 为什么这种模式有用

- 你可以保留真实的 Windows 浏览器配置文件、Cookie 和登录状态
- Hermes 仍在其支持的 Unix 环境（WSL2）中运行
- 浏览器控制通过 MCP 工具暴露，而不是依赖 Hermes 核心浏览器传输

### 推荐的服务器

使用 `chrome-devtools-mcp`。

如果你的 Windows Chrome 已通过 `chrome://inspect/#remote-debugging` 启用实时远程调试，请从 WSL 按如下方式添加：

```bash
hermes mcp add chrome-devtools-win --command cmd.exe --args /c "npx -y chrome-devtools-mcp@latest --autoConnect --no-usage-statistics"
```

保存服务器后：

```bash
hermes mcp test chrome-devtools-win
```

然后启动新的 Hermes 会话或运行：

```text
/reload-mcp
```

### 典型提示

加载后，Hermes 可以直接使用带 MCP 前缀的浏览器工具。例如：

```text
调用 MCP 工具 mcp_chrome_devtools_win_list_pages，列出当前浏览器标签页。
```

### 何时 `/browser connect` 是错误的工具

如果 Hermes 运行在 WSL 中而 Chrome 运行在 Windows 上，即使 Chrome 已打开且可调试，`/browser connect` 也可能失败。

常见原因：

- WSL 无法访问 Chrome 暴露给 Windows 工具的相同本地主机端点
- 较新的 Chrome 实时调试流程与传统的 `ws://localhost:9222` 不同
- 从 Windows 端辅助工具（如 `chrome-devtools-mcp`）附加浏览器更容易

在这些情况下，将 `/browser connect` 保留用于同环境设置，并使用 MCP 进行 WSL 到 Windows 的浏览器桥接。

### 已知陷阱

- 使用通过 MCP 的 Windows stdio 可执行文件时，请从 Windows 挂载路径（如 `/mnt/c/Users/<你>` 或 `/mnt/c/workspace/...`）启动 Hermes。
- 如果你从 `/root` 或 `/home/...` 启动 Hermes，Windows 可能会在 MCP 服务器启动前发出 `UNC` 当前目录警告。
- 如果 `chrome-devtools-mcp --autoConnect` 在枚举页面时超时，请减少 Chrome 中的后台/冻结标签页并重试。

### 示例：黑名单排除危险操作

```yaml
mcp_servers:
  stripe:
    url: "https://mcp.stripe.com"
    headers:
      Authorization: "Bearer ***"
    tools:
      exclude: [delete_customer, refund_payment]
```

### 示例：同时禁用实用程序包装器

```yaml
mcp_servers:
  docs:
    url: "https://mcp.docs.example.com"
    tools:
      prompts: false
      resources: false
```

## 过滤实际上会影响什么？

Hermes 中暴露的 MCP 功能分为两类：

1. 服务器原生的 MCP 工具  
   - 通过以下方式过滤：  
     - `tools.include`  
     - `tools.exclude`

2. Hermes 添加的实用程序包装器  
   - 通过以下方式过滤：  
     - `tools.resources`  
     - `tools.prompts`

### 你可能看到的实用程序包装器

资源：  
- `list_resources`  
- `read_resource`

提示：  
- `list_prompts`  
- `get_prompt`

这些包装器仅在以下情况下出现：  
- 你的配置允许它们，且  
- MCP 服务器会话实际支持这些功能

因此，如果服务器不支持资源/提示，Hermes 不会假装它有。

## 常见模式

### 模式 1：本地项目助手

当你希望 Hermes 在有限的工作空间内推理时，使用 MCP 连接仓库本地的文件系统或 git 服务器。

```yaml
mcp_servers:
  fs:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/project"]

  git:
    command: "uvx"
    args: ["mcp-server-git", "--repository", "/home/user/project"]
```

好的提示：

```text
审查项目结构并确定配置文件的位置。
```

```text
检查本地 git 状态并总结最近的变化。
```

### 模式 2：GitHub 分类助手

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [list_issues, create_issue, update_issue, search_code]
      prompts: false
      resources: false
```

好的提示：

```text
列出关于 MCP 的开放问题，按主题聚类，并为最常见的错误起草一个高质量的议题。
```

```text
在仓库中搜索 _discover_and_register_server 的使用情况，并解释 MCP 工具是如何注册的。
```

### 模式 3：内部 API 助手

```yaml
mcp_servers:
  internal_api:
    url: "https://mcp.internal.example.com"
    headers:
      Authorization: "Bearer ***"
    tools:
      include: [list_customers, get_customer, list_invoices]
      resources: false
      prompts: false
```

好的提示：

```text
查找客户 ACME Corp 并总结最近的发票活动。
```

在这种场景下，严格的白名单远优于排除列表。

### 模式 4：文档/知识服务器

某些 MCP 服务器暴露的提示或资源更像是共享知识资产，而非直接操作。

```yaml
mcp_servers:
  docs:
    url: "https://mcp.docs.example.com"
    tools:
      prompts: true
      resources: true
```

好的提示：

```text
列出文档服务器中可用的 MCP 资源，然后阅读入职指南并总结它。
```

```text
列出文档服务器暴露的提示，并告诉我哪些对事件响应有帮助。
```

## 教程：端到端设置与过滤

以下是一个实用的渐进过程。

### 阶段 1：添加 GitHub MCP 并使用严格白名单

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [list_issues, create_issue, search_code]
      prompts: false
      resources: false
```

启动 Hermes 并询问：

```text
在代码库中搜索 MCP 相关引用，并总结主要的集成点。
```

### 阶段 2：仅在需要时扩展

如果你后续还需要议题更新功能：

```yaml
tools:
  include: [list_issues, create_issue, update_issue, search_code]
```

然后重新加载：

```text
/reload-mcp
```

### 阶段 3：添加第二个服务器并使用不同策略

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [list_issues, create_issue, update_issue, search_code]
      prompts: false
      resources: false

  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/project"]
```

现在 Hermes 可以组合使用它们：

```text
检查本地项目文件，然后创建一个 GitHub 议题，总结你发现的错误。
```

这正是 MCP 变得强大的地方：无需更改 Hermes 核心即可实现多系统工作流。

## 安全使用建议

### 对危险系统优先使用白名单

对于任何涉及财务、面向客户或具有破坏性的操作：
- 使用 `tools.include`
- 从尽可能小的集合开始

### 禁用未使用的工具

如果您不希望模型浏览服务器提供的资源/提示，请将其关闭：

```yaml
tools:
  resources: false
  prompts: false
```

### 保持服务器范围狭窄

示例：
- 文件系统服务器根目录限定在一个项目目录，而非整个主目录
- Git 服务器指向单个仓库
- 内部 API 服务器默认仅暴露读密集型工具

### 配置更改后重新加载

```text
/reload-mcp
```

在更改以下内容后执行此操作：
- 包含/排除列表
- 启用标志
- 资源/提示开关
- 认证头 / 环境变量

## 按症状进行故障排除

### “服务器已连接，但我期望的工具缺失”

可能原因：
- 被 `tools.include` 过滤
- 被 `tools.exclude` 排除
- 工具包装器被 `resources: false` 或 `prompts: false` 禁用
- 服务器实际上不支持资源/提示

### “服务器已配置，但无任何内容加载”

检查：
- 配置中未遗留 `enabled: false`
- 命令/运行时存在（如 `npx`、`uvx` 等）
- HTTP 端点可访问
- 认证环境变量或头信息正确

### “为什么我看到比 MCP 服务器 advertised 的工具更少的工具？”

因为 Hermes 现在会遵循您的每服务器策略和感知能力的注册。这是预期行为，通常也是理想状态。

### “如何在不删除配置的情况下移除 MCP 服务器？”

使用：

```yaml
enabled: false
```

这将保留配置，但阻止连接和注册。

## 推荐的初始 MCP 设置

对大多数用户而言，良好的初始服务器：
- 文件系统
- Git
- GitHub
- fetch / 文档 MCP 服务器
- 一个范围狭窄的内部 API

不太适合作为初始服务器的：
- 具有大量破坏性操作且无过滤功能的大型业务系统
- 任何您不够了解以进行约束的系统

## 相关文档

- [MCP（模型上下文协议）](/docs/user-guide/features/mcp)
- [常见问题解答](/docs/reference/faq)
- [斜杠命令](/docs/reference/slash-commands)