---
sidebar_position: 6
title: "在 Hermes 中使用 MCP"
description: "一份将 MCP 服务器连接到 Hermes 智能体、过滤其工具并安全应用于实际工作流程的实用指南"
---

# 在 Hermes 中使用 MCP

本指南介绍如何在日常工作中实际使用 MCP 与 Hermes 智能体配合工作。

如果功能页面解释了 MCP 是什么，那么本指南的重点是教你如何快速、安全地从中获得价值。

## 何时应使用 MCP？

在以下情况下，应使用 MCP：
- 工具已经以 MCP 形式存在，且您不想从头构建原生的 Hermes 工具
- 您希望 Hermes 通过一个干净的 RPC 层来操作本地或远程系统
- 您需要针对每个服务器进行精细的暴露控制
- 您希望将 Hermes 连接到内部 API、数据库或公司系统，而无需修改 Hermes 的核心代码

在以下情况下，不应使用 MCP：
- 内置的 Hermes 工具已经能很好地解决问题
- 服务器暴露了庞大且危险的工具接口，而您尚未准备好对其进行过滤
- 您只需要一个非常窄的集成，而使用原生工具会更简单、更安全

## 心智模型

可以将 MCP 视为一个适配层：

- Hermes 仍然是智能体
- MCP 服务器贡献工具
- Hermes 在启动或重载时发现这些工具
- 模型可以像使用普通工具一样使用它们
- 你可以控制每个服务器的可见程度

最后一点很重要。良好的 MCP 使用不仅仅是“连接一切”，而是“用最小的有用表面连接正确的东西”。

## 步骤一：安装 MCP 支持

如果你使用标准安装脚本安装了 Hermes，MCP 支持已包含在内（安装程序运行了 `uv pip install -e ".[all]"`）。

如果你在没有安装额外依赖的情况下需要单独添加 MCP：

```bash
cd ~/.hermes/hermes-agent
uv pip install -e ".[mcp]"
```

对于基于 npm 的服务器，请确保 Node.js 和 `npx` 可用。

对于许多 Python MCP 服务器，`uvx` 是一个不错的默认选择。

## 步骤二：先添加一个服务器

从一个单一、安全的服务器开始。

示例：仅对一个项目目录进行文件系统访问。

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
检查此项目并总结仓库布局。
```

## 步骤三：验证 MCP 是否加载

你可以通过几种方式验证 MCP：

- 当配置了 MCP 时，Hermes 横幅/状态应显示 MCP 集成
- 询问 Hermes 它有哪些可用工具
- 在配置更改后使用 `/reload-mcp`
- 如果服务器连接失败，检查日志

一个实用的测试提示：

```text
告诉我现在有哪些基于 MCP 的工具可用。
```

## 步骤四：立即开始过滤

如果服务器暴露了大量工具，不要等到以后再做。

### 示例：仅白名单你需要的工具

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

这是当满足以下情况时的实用设置：

- Hermes 运行在 WSL2 内部
- 你想控制的浏览器是你正常的已登录 Windows Chrome
- 从 WSL 使用 `/browser connect` 很尴尬或不可靠

在此设置中，Hermes **不会**直接连接到 Chrome。相反：

- Hermes 在 WSL 中运行
- Hermes 启动一个本地的 stdio MCP 服务器
- 该 MCP 服务器通过 Windows 互操作启动（`cmd.exe` 或 `powershell.exe`）
- MCP 服务器附加到你实时的 Windows Chrome 会话

心智模型：

```text
Hermes (WSL) -> MCP stdio 桥接 -> Windows Chrome
```

### 为什么此模式有用

- 你保留了真实的 Windows 浏览器配置文件、Cookie 和登录信息
- Hermes 保持在其支持的 Unix 环境（WSL2）中
- 浏览器控制作为 MCP 工具暴露，而不是依赖 Hermes 核心浏览器传输

### 推荐的服务器

使用 `chrome-devtools-mcp`。

如果你的 Windows Chrome 已经从 `chrome://inspect/#remote-debugging` 启用了实时远程调试，可以从 WSL 这样添加：

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

加载后，Hermes 可以直接使用带 MCP 前缀的浏览器工具。例如：

```text
调用 MCP 工具 mcp_chrome_devtools_win_list_pages，列出当前浏览器标签页。
```

### 当 `/browser connect` 是错误的工具时

如果 Hermes 在 WSL 中运行而 Chrome 在 Windows 上运行，即使 Chrome 已打开且可调试，`/browser connect` 也可能失败。

常见原因：

- WSL 无法访问 Chrome 向 Windows 工具公开的相同主机本地端点
- 较新的 Chrome 实时调试流程与经典的 `ws://localhost:9222` 不同
- 浏览器更容易从 Windows 端的辅助程序（如 `chrome-devtools-mcp`）附加

在这些情况下，保留 `/browser connect` 用于相同环境设置，并使用 MCP 进行 WSL 到 Windows 的浏览器桥接。

### 已知注意事项

- 当通过 MCP 使用 Windows stdio 可执行文件时，请从 Windows 挂载的路径（如 `/mnt/c/Users/<you>` 或 `/mnt/c/workspace/...`）启动 Hermes。
- 如果你从 `/root` 或 `/home/...` 启动 Hermes，Windows 可能在 MCP 服务器启动前发出 `UNC` 当前目录警告。
- 如果 `chrome-devtools-mcp --autoConnect` 在枚举页面时超时，请减少 Chrome 中的后台/冻结标签页并重试。

### 示例：黑名单危险操作

```yaml
mcp_servers:
  stripe:
    url: "https://mcp.stripe.com"
    headers:
      Authorization: "Bearer ***"
    tools:
      exclude: [delete_customer, refund_payment]
```

### 示例：同时禁用实用工具包装器

```yaml
mcp_servers:
  docs:
    url: "https://mcp.docs.example.com"
    tools:
      prompts: false
      resources: false
```

## 过滤到底影响什么？

Hermes 中有两种类别的 MCP 暴露功能：

1. 服务器原生 MCP 工具
- 使用以下方式过滤：
  - `tools.include`
  - `tools.exclude`

2. Hermes 添加的实用工具包装器
- 使用以下方式过滤：
  - `tools.resources`
  - `tools.prompts`

### 你可能会看到的实用工具包装器

资源：
- `list_resources`
- `read_resource`

提示：
- `list_prompts`
- `get_prompt`

这些包装器仅在以下情况下出现：
- 你的配置允许它们，且
- MCP 服务器会话实际支持这些能力

因此，如果服务器不支持资源/提示，Hermes 不会假装它有。

## 常见模式

### 模式一：本地项目助手

当你希望 Hermes 对有界工作空间进行推理时，使用 MCP 连接仓库本地文件系统或 git 服务器。

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
检查项目结构并确定配置文件的位置。
```

```text
检查本地 git 状态并总结最近的更改。
```

### 模式二：GitHub 分诊助手

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
列出关于 MCP 的开放问题，按主题分类，并为最常见的 bug 起草一个高质量的 issue。
```

```text
在代码库中搜索 _discover_and_register_server 的使用，并解释 MCP 工具是如何注册的。
```

### 模式三：内部 API 助手

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
查询客户 ACME Corp 并总结最近的发票活动。
```

这就是严格白名单远优于排除列表的地方。

### 模式四：文档/知识服务器

一些 MCP 服务器暴露的提示或资源更像共享知识资产，而不是直接操作。

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
列出文档服务器上可用的 MCP 资源，然后阅读入门指南并进行总结。
```

```text
列出文档服务器暴露的提示，并告诉我哪些对事件响应有帮助。
```

## 教程：带过滤的端到端设置

这是一个实用的逐步过程。

### 阶段一：使用严格的白名单添加 GitHub MCP

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
在代码库中搜索对 MCP 的引用，并总结主要的集成点。
```

### 阶段二：仅在需要时扩展

如果你之后还需要更新 issue：

```yaml
tools:
  include: [list_issues, create_issue, update_issue, search_code]
```

然后重载：

```text
/reload-mcp
```

### 阶段三：添加具有不同策略的第二个服务器

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
检查本地项目文件，然后创建一个 GitHub issue 总结你发现的 bug。
```

这就是 MCP 发挥强大作用的地方：无需更改 Hermes 核心即可实现多系统工作流。

## 安全使用建议

### 对于危险系统优先使用允许列表

对于任何涉及金融、面向客户或具有破坏性的操作：
- 使用 `tools.include`
- 从尽可能小的集合开始

### 禁用未使用的工具

如果您不希望模型浏览服务器提供的资源/提示，请将其关闭：

```yaml
tools:
  resources: false
  prompts: false
```

### 使服务器作用范围尽可能狭窄

示例：
- 文件系统服务器根目录设为单个项目目录，而非整个主目录
- Git 服务器指向单个仓库
- 内部 API 服务器默认仅暴露读取密集型工具

### 配置更改后重新加载

```text
/reload-mcp
```

在进行以下更改后执行此操作：
- 包含/排除列表
- 启用标志
- 资源/提示切换
- 认证头/环境变量

## 按症状排查问题

### "服务器已连接，但我期望的工具缺失"

可能原因：
- 被 `tools.include` 过滤
- 被 `tools.exclude` 排除
- 通过 `resources: false` 或 `prompts: false` 禁用了工具包装器
- 服务器实际上不支持资源/提示

### "服务器已配置，但未加载任何内容"

请检查：
- 配置中未留有 `enabled: false`
- 命令/运行时存在（`npx`、`uvx` 等）
- HTTP 端点可达
- 认证环境变量或头部正确

### "为什么我看到的工具比 MCP 服务器显示的少？"

因为 Hermes 现在遵循您为每个服务器设置的策略和能力感知注册。这是预期的，并且通常是可取的。

### "如何在不删除配置的情况下移除 MCP 服务器？"

使用：

```yaml
enabled: false
```

这将保留配置但阻止连接和注册。

## 推荐的首次 MCP 设置

适合大多数用户的首选服务器：
- 文件系统
- git
- GitHub
- fetch / 文档 MCP 服务器
- 一个范围狭窄的内部 API

不适合首次设置的服务器：
- 拥有大量破坏性操作且无过滤的庞大业务系统
- 任何您不够了解以有效约束的系统

## 相关文档

- [MCP（模型上下文协议）](/docs/user-guide/features/mcp)
- [常见问题解答](/docs/reference/faq)
- [斜杠命令](/docs/reference/slash-commands)