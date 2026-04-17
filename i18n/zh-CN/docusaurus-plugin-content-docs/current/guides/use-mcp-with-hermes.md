---
sidebar_position: 6
title: "使用 MCP 与 Hermes"
description: "关于连接 MCP 服务器到 Hermes Agent、过滤其工具并在实际工作流中安全使用它们的实用指南"
---

# 使用 MCP 与 Hermes

本指南展示了如何在日常工作流中实际使用 MCP 与 Hermes Agent。

如果功能页面解释了什么是 MCP，那么本指南将重点介绍如何快速、安全地从 MCP 中获取价值。

## 何时使用 MCP？

当满足以下条件时，请使用 MCP：
- 工具已存在于 MCP 形式中，而您不希望构建原生的 Hermes 工具
- 您希望 Hermes 通过干净的 RPC 层与本地或远程系统进行交互
- 您需要对每个服务器进行精细的暴露控制
- 您希望连接 Hermes 到内部 API、数据库或公司系统，而无需修改 Hermes 核心

不应在以下情况下使用 MCP：
- 内置的 Hermes 工具已经很好地解决了问题
- 服务器暴露了庞大且危险的工具表面，而您尚未准备好进行过滤
- 您只需要一个非常狭窄的集成，原生工具会更简单、更安全

## 心智模型

将 MCP 视为一个适配器层：

- Hermes 保持作为代理 (agent) 的角色
- MCP 服务器贡献工具
- Hermes 在启动或重新加载时发现这些工具
- 模型可以像使用普通工具一样使用它们
- 您控制每个服务器可见的程度

最后一点非常重要。良好的 MCP 使用不仅仅是“连接所有东西”。它是“连接正确的、具有最小有用表面的东西”。

## 步骤 1：安装 MCP 支持

如果您使用标准安装脚本安装了 Hermes，MCP 支持已包含在内（安装程序运行 `uv pip install -e ".[all]"`）。

如果您没有使用 extras 进行安装，需要单独添加 MCP：

```bash
cd ~/.hermes/hermes-agent
uv pip install -e ".[mcp]"
```

对于基于 npm 的服务器，请确保已安装 Node.js 和 `npx`。

对于许多 Python MCP 服务器，`uvx` 是一个不错的默认选择。

## 步骤 2：首先添加一个服务器

从一个单一、安全的服务器开始。

示例：仅对一个项目目录的文件系统访问。

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

现在提出一个具体的请求：

```text
检查此项目并总结仓库的布局。
```

## 步骤 3：验证 MCP 已加载

您可以通过几种方式验证 MCP：

- 配置后，Hermes 徽章/状态应显示 MCP 集成
- 询问 Hermes 它有哪些可用的工具
- 配置更改后使用 `/reload-mcp`
- 如果服务器连接失败，请检查日志

一个实用的测试提示：

```text
告诉我当前有哪些 MCP 支持的工具可用。
```

## 步骤 4：立即开始过滤

如果服务器暴露了大量工具，请不要等到以后再进行过滤。

### 示例：仅白名单您想要的

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

对于敏感系统，这通常是最好的默认设置。

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

### 示例：禁用实用封装器

```yaml
mcp_servers:
  docs:
    url: "https://mcp.docs.example.com"
    tools:
      prompts: false
      resources: false
```

## 过滤实际影响了什么？

在 Hermes 中，MCP 暴露的功能分为两类：

1. 服务器原生的 MCP 工具
- 使用 `tools.include`
- 使用 `tools.exclude`

2. Hermes 添加的实用封装器
- 使用 `tools.resources`
- 使用 `tools.prompts`

### 您可能看到的实用封装器

资源 (Resources)：
- `list_resources`
- `read_resource`

提示 (Prompts)：
- `list_prompts`
- `get_prompt`

只有在满足以下条件时，这些封装器才会出现：
- 您的配置允许它们，并且
- MCP 服务器会实际支持这些功能

因此，如果服务器不支持资源/提示，Hermes 也不会假装它拥有它们。

## 常见模式

### 模式 1：本地项目助手

当您希望 Hermes 基于一个有界的工作区进行推理时，请使用 MCP 来处理仓库本地的文件系统或 Git 服务器。

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
审查项目结构，确定配置文件的位置。
```

```text
检查本地 Git 状态，并总结最近发生的变化。
```

### 模式 2：GitHub 故障排除助手

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
列出关于 MCP 的开放问题，按主题聚类，并为最常见的错误起草高质量的问题。
```

```text
搜索仓库中对 _discover_and_register_server 的使用，并解释 MCP 工具是如何注册的。
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
查找客户 ACME Corp，并总结最近的发票活动。
```

对于这类场景，严格的白名单远优于排除列表。

### 模式 4：文档/知识服务器

某些 MCP 服务器暴露的提示或资源更像是共享知识资产，而不是直接的操作。

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
列出文档服务器可用的 MCP 资源，然后阅读入职指南并进行总结。
```

```text
列出文档服务器暴露的提示，并告诉我哪些提示有助于事件响应。
```

## 教程：带过滤的端到端设置

这是一个实用的进阶过程。

### 阶段 1：使用严格白名单添加 GitHub MCP

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
搜索代码库中关于 MCP 的引用，并总结主要的集成点。
```

### 阶段 2：仅在需要时扩展

如果您以后还需要问题更新功能：

```yaml
tools:
  include: [list_issues, create_issue, update_issue, search_code]
```

然后重新加载：

```text
/reload-mcp
```

### 阶段 3：添加具有不同策略的第二个服务器

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

现在 Hermes 可以将它们结合起来：

```text
检查本地项目文件，然后创建一个总结您发现的 bug 的 GitHub 问题。
```

这就是 MCP 强大的地方：在不更改 Hermes 核心的情况下实现多系统工作流。

## 安全使用建议

### 优先为危险系统使用白名单

对于任何涉及财务、客户或具有破坏性的操作：
- 使用 `tools.include`
- 从最小的集合开始

### 禁用未使用的实用工具

如果您不希望模型浏览服务器提供的资源/提示，请将其关闭：

```yaml
tools:
  resources: false
  prompts: false
```

### 保持服务器范围狭窄

示例：
- 文件系统服务器根目录限制在一个项目目录，而不是整个主目录
- Git 服务器指向一个仓库
- 内部 API 服务器默认具有只读的工具暴露

### 更改配置后重新加载

```text
/reload-mcp
```

在更改以下内容后执行此操作：
- include/exclude 列表
- 启用标志
- resources/prompts 开关
- 认证头/环境变量

## 按症状进行故障排除

### “服务器连接了，但我预期的工具丢失了”

可能的原因：
- 被 `tools.include` 过滤了
- 被 `tools.exclude` 排除了
- 通过 `resources: false` 或 `prompts: false` 禁用了实用封装器
- 服务器实际上不支持资源/提示

### “服务器已配置，但什么都没有加载”

检查：
- 配置中是否留下了 `enabled: false`
- 命令/运行时是否存在 (`npx`, `uvx` 等)
- HTTP 端点是否可达
- 认证环境变量或头是否正确

### “为什么我看到的工具比 MCP 服务器声称的要少？”

因为 Hermes 现在尊重您针对每个服务器的策略和能力感知注册。这是预期的，通常也是可取的。

### “如何移除 MCP 服务器而又不删除配置？”

使用：

```yaml
enabled: false
```

这保留了配置，但阻止了连接和注册。

## 推荐的初始 MCP 设置

大多数用户的好初始服务器：
- 文件系统
- Git
- GitHub
- 抓取 / 文档 MCP 服务器
- 一个狭窄的内部 API

不推荐的初始服务器：
- 具有大量破坏性操作且没有过滤的大型业务系统
- 任何您不够了解而无法约束的系统

## 相关文档

- [MCP (模型上下文协议)](/docs/user-guide/features/mcp)
- [FAQ](/docs/reference/faq)
- [斜杠命令](/docs/reference/slash-commands)