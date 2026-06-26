---
sidebar_position: 6
title: "Use MCP with Hermes"
description: "A practical guide to connecting MCP servers to Hermes Agent, filtering their tools, and using them safely in real workflows"
---

# 在 Hermes 中使用 MCP

本指南展示了如何在日常工作中实际使用 Hermes 智能体的 MCP 功能。

如果功能页面解释了什么是 MCP，那么本指南则是关于如何快速且安全地从中获取价值。

## 何时应该使用 MCP？

在以下情况下使用 MCP：
- 某个工具已经以 MCP 形式存在，而你不想构建原生 Hermes 工具
- 你希望 Hermes 能够通过干净的 RPC 层对本地或远程系统进行操作
- 你需要对每个服务器进行细粒度的暴露控制
- 你希望将 Hermes 连接到内部 API、数据库或公司系统，而无需修改 Hermes 核心

在以下情况下不要使用 MCP：
- 内置的 Hermes 工具已经能够很好地完成任务
- 服务器暴露了大量危险的工具接口，而你尚未准备好对其进行过滤
- 你只需要一个非常狭窄的集成，而使用原生工具会更简单、更安全

## 思维模型

将 MCP 视为一个适配层：

- Hermes 仍然是智能体
- MCP 服务器提供工具
- Hermes 在启动或重载时发现这些工具
- 模型可以像使用普通工具一样使用它们
- 你可以控制每个服务器的可见范围

最后一点很重要。良好的 MCP 使用方式不仅仅是"连接一切"，而是"连接正确的东西，使用最小的有效暴露面"。

## 第 1 步：安装 MCP 支持

如果你使用标准安装脚本安装了 Hermes，则 MCP 支持已包含在内（安装脚本会运行 `uv pip install -e ".[all]"`）。

如果你在没有额外功能的情况下安装，需要单独添加 MCP：

```bash
cd ~/.hermes/hermes-agent
uv pip install -e ".[mcp]"
```

对于基于 npm 的服务器，请确保 Node.js 和 `npx` 可用。

对于许多 Python MCP 服务器，`uvx` 是一个不错的默认选择。

## 第 2 步：先添加一个服务器

从一个安全的服务器开始。

示例：仅访问一个项目目录的文件系统。

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

现在提出一个具体的问题：

```text
检查这个项目并总结仓库布局。
```

## 第 3 步：验证 MCP 已加载

你可以通过几种方式验证 MCP：

- 配置完成后，Hermes 横幅/状态应显示 MCP 集成
- 询问 Hermes 有哪些可用工具
- 配置更改后使用 `/reload-mcp`
- 如果服务器连接失败，检查日志

一个实用的测试提示：

```text
告诉我当前有哪些 MCP 支持的工具可用。
```

## 第 4 步：立即开始过滤

如果服务器暴露了大量工具，不要等到以后再做过滤。

### 示例：仅将你想要的内容加入白名单

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

这通常是敏感系统的最佳默认设置。

## WSL2：将 WSL 中的 Hermes 桥接到 Windows Chrome

这是以下场景下的实用设置：

- Hermes 在 WSL2 内运行
- 你想控制的是 Windows 上正常登录的 Chrome 浏览器
- `/browser connect` 在 WSL 中使用时较为笨拙或不可靠

在这种设置下，Hermes **不会**直接连接到 Chrome。而是：

- Hermes 在 WSL 中运行
- Hermes 启动一个本地 stdio MCP 服务器
- 该 MCP 服务器通过 Windows 互操作（`cmd.exe` 或 `powershell.exe`）启动
- 该 MCP 服务器连接到你的实时 Windows Chrome 会话

思维模型：

```text
Hermes (WSL) -> MCP stdio 桥接 -> Windows Chrome
```

### 为什么这种模式有用

- 你保留了真实的 Windows 浏览器配置文件、Cookie 和登录状态
- Hermes 保持在受支持的 Unix 环境（WSL2）中运行
- 浏览器控制通过 MCP 工具暴露，而不是依赖 Hermes 核心的浏览器传输

### 推荐的服务器

使用 `chrome-devtools-mcp`。

如果你的 Windows Chrome 已经从 `chrome://inspect/#remote-debugging` 启用了实时远程调试，请从 WSL 中按如下方式添加：

```bash
hermes mcp add chrome-devtools-win --command cmd.exe --args /c npx -y chrome-devtools-mcp@latest --autoConnect --no-usage-statistics
```

保存服务器后：

```bash
hermes mcp test chrome-devtools-win
```

然后启动一个新的 Hermes 会话或运行：

```text
/reload-mcp
```

### 典型提示

加载后，Hermes 可以直接使用 MCP 前缀的浏览器工具。例如：

```text
调用 MCP 工具 mcp_chrome_devtools_win_list_pages，列出当前浏览器标签页。
```

### 何时 `/browser connect` 是错误的工具

如果 Hermes 在 WSL 中运行，而 Chrome 在 Windows 上运行，`/browser connect` 可能会失败，即使 Chrome 已打开且可调试。

常见原因：

- WSL 无法访问 Chrome 暴露给 Windows 工具的同一主机本地端点
- 较新的 Chrome 实时调试流程与经典的 `ws://localhost:9222` 不同
- 从 Windows 端辅助工具（如 `chrome-devtools-mcp`）连接浏览器更容易

在这些情况下，将 `/browser connect` 保留用于同环境设置，使用 MCP 进行 WSL 到 Windows 的浏览器桥接。

### 已知陷阱

- 当通过 MCP 使用 Windows stdio 可执行文件时，从 Windows 挂载路径（如 `/mnt/c/Users/<you>` 或 `/mnt/c/workspace/...`）启动 Hermes。
- 如果你从 `/root` 或 `/home/...` 启动 Hermes，Windows 可能会在 MCP 服务器启动前发出 `UNC` 当前目录警告。
- 如果 `chrome-devtools-mcp --autoConnect` 在枚举页面时超时，请减少 Chrome 中的后台/冻结标签页后重试。

### 示例：将危险操作加入黑名单

```yaml
mcp_servers:
  stripe:
    url: "https://mcp.stripe.com"
    headers:
      Authorization: "Bearer ***"
    tools:
      exclude: [delete_customer, refund_payment]
```

### 示例：同时禁用工具包装器

```yaml
mcp_servers:
  docs:
    url: "https://mcp.docs.example.com"
    tools:
      prompts: false
      resources: false
```

## 过滤实际上影响什么？

Hermes 中 MCP 暴露的功能分为两类：

1. 服务器原生 MCP 工具
- 通过以下方式过滤：
  - `tools.include`
  - `tools.exclude`

2. Hermes 添加工具包装器
- 通过以下方式过滤：
  - `tools.resources`
  - `tools.prompts`

### 你可能遇到的工具包装器

资源：
- `list_resources`
- `read_resource`

提示：
- `list_prompts`
- `get_prompt`

这些包装器仅在以下情况下出现：
- 你的配置允许它们，且
- 该 MCP 服务器会话确实支持这些能力

因此，如果服务器没有资源/提示，Hermes 不会假装它有。

## 常见模式

### 模式 1：本地项目助手

当你希望 Hermes 在有限的工作区上进行推理时，可以为仓库本地的文件系统或 git 服务器使用 MCP。

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
检查本地 git 状态并总结最近有哪些变更。
```

### 模式 2：使用 Open Scaffold 的仓库原生工作记录

当你希望 Hermes 读取仓库的持久化 AI 工作记录（任务、计划、证据笔记、交接包和审查/关卡结果）时，使用 [Open Scaffold](https://github.com/graphanov/open-scaffold)。Hermes 仍然是智能体；Open Scaffold 仍然是仓库本地记录。

为一个使用脚手架的仓库添加服务器：

```bash
hermes mcp add open_scaffold --command npx --args -y open-scaffold@latest mcp serve --repo /absolute/path/to/repo
hermes mcp test open_scaffold
```

然后将暴露面保持为读导向。在 `hermes mcp add` 提示中选择 `select`，或在之后编辑 `config.yaml`：

```yaml
mcp_servers:
  open_scaffold:
    command: "npx"
    args: ["-y", "open-scaffold@latest", "mcp", "serve", "--repo", "/absolute/path/to/repo"]
    tools:
      include:
        - list_plans
        - get_plan
        - get_mission
        - list_evidence
        - get_evidence
        - get_status
        - search_plans
        - list_amendments
        - get_handoff
        - analyze_loop
        - gate_loop
      prompts: false
```

好的提示：

```text
使用 Open Scaffold MCP 工具编译当前交接包，并告诉我下一步合法操作。
```

```text
检查活跃的计划和证据笔记，然后说明这个仓库是否准备好供人类审查或需要再尝试一次。
```

边界说明：

- Open Scaffold MCP 默认是本地优先且只读的。
- 其写入工具要求服务器以 `--allow-write` 启动；除非你明确希望 Hermes 修改 `.osc` 文件，否则不要启用。
- Open Scaffold 的记录和关卡有效；它不会授权 Hermes 合并、发布、部署或生成运行时。
- 如果你需要可复现的工具模式，请将 `open-scaffold@<version>` 固定为特定版本而非 `@latest`。

### 模式 3：GitHub 分流助手

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
列出关于 MCP 的未解决问题，按主题分组，并为最常见的 bug 起草一个高质量的问题。
```

```text
搜索代码库中 _discover_and_register_server 的引用，并解释 MCP 工具是如何注册的。
```

### 模式 4：内部 API 助手

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
查找客户 ACME Corp 并总结最近的发票活动。`
```

这是严格白名单远比排除列表更好的场景。

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
列出文档服务器可用的 MCP 资源，然后阅读入职指南并总结。
```

```text
列出文档服务器暴露的提示，并告诉我哪些有助于事件响应。
```

## 教程：带过滤的端到端设置

以下是一个实用的渐进过程。

### 第 1 阶段：添加带有严格白名单的 GitHub MCP

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
搜索代码库中对 MCP 的引用，并总结主要集成点。
```

### 第 2 阶段：仅在需要时扩展

如果你以后还需要问题更新功能：

```yaml
tools:
  include: [list_issues, create_issue, update_issue, search_code]
```

然后重新加载：

```text
/reload-mcp
```

### 第 3 阶段：添加具有不同策略的第二个服务器

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

现在 Hermes 可以将它们组合起来：

```text
检查本地项目文件，然后创建一个 GitHub 总结你发现的 bug 的问题。
```

这就是 MCP 变得强大的地方：无需更改 Hermes 核心即可实现多系统工作流。

## 安全使用建议

### 对危险系统优先使用白名单

对于任何涉及财务、面向客户或破坏性的操作：
- 使用 `tools.include`
- 从尽可能小的集合开始

### 禁用未使用的工具

如果你不希望模型浏览服务器提供的资源/提示，请关闭它们：

```yaml
tools:
  resources: false
  prompts: false
```

### 保持服务器范围狭窄

示例：
- 文件系统服务器根目录设置为一个项目目录，而非整个主目录
- git 服务器指向一个仓库
- 内部 API 服务器默认暴露读密集型工具

### 配置更改后重新加载

```text
/reload-mcp
```

在更改以下事项后执行此操作：
- 包含/排除列表
- 启用标志
- 资源/提示开关
- 认证头/环境变量

## 按症状排查问题

### "服务器已连接，但我期望的工具缺失"

可能原因：
- 被 `tools.include` 过滤
- 被 `tools.exclude` 排除
- 通过 `resources: false` 或 `prompts: false` 禁用了实用程序包装器
- 服务器实际上不支持资源/提示

### "服务器已配置，但没有任何内容加载"

检查：
- 配置中未遗留 `enabled: false`
- 命令/运行时存在（`npx`、`uvx` 等）
- HTTP 端点可达
- 认证环境变量或请求头正确

### "为什么我看到的工具比 MCP 服务器公布的少？"

因为 Hermes 现在遵循你的单服务器策略和感知能力的注册机制。这是预期行为，通常也是理想的状态。

### "如何在不删除配置的情况下移除 MCP 服务器？"

使用：

```yaml
enabled: false
```

这将保留配置，但阻止连接和注册。

## 推荐的首次 MCP 配置

适合大多数用户的良好首选服务器：
- 文件系统
- git
- GitHub
- 获取/文档 MCP 服务器
- 一个范围明确的内建 API

不太适合作为首选的服务器：
- 包含大量破坏性操作且无过滤的大型业务系统
- 任何你不够了解以至于无法加以约束的服务器

## 相关文档

- [MCP（模型上下文协议）](/user-guide/features/mcp)
- [常见问题](/reference/faq)
- [斜杠命令](/reference/slash-commands)