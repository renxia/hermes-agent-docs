---
sidebar_position: 6
title: "在 Hermes 中使用 MCP"
description: "一份实用指南，介绍如何将 MCP 服务器连接到 Hermes 智能体，筛选其工具，并在实际工作流中安全使用"
---

# 在 Hermes 中使用 MCP

本指南展示如何在日常工作流中实际运用 MCP 与 Hermes 智能体。

如果说功能页面解释了 MCP 是什么，那么本指南则聚焦于如何快速、安全地从中获取价值。

## 何时应该使用 MCP？

在以下情况下使用 MCP：
- 当某个工具已以 MCP 形式存在，且您不希望构建原生的 Hermes 工具时
- 当您希望 Hermes 通过一个清晰的 RPC 层来操作本地或远程系统时
- 当您需要细粒度的、按服务器的曝光控制时
- 当您希望将 Hermes 连接到内部 API、数据库或公司系统，且不希望修改 Hermes 核心代码时

在以下情况下不应使用 MCP：
- 内置的 Hermes 工具已能很好地完成任务时
- 服务器暴露了一个庞大且危险的工具表面，而您尚未准备好对其进行筛选时
- 您只需要一个非常狭隘的集成，且使用原生工具会更简单、更安全时

## 心智模型

将MCP视为一个适配器层：

- **Hermes** 保持其智能体身份
- **MCP服务器** 提供工具
- **Hermes** 在启动或重新加载时发现这些工具
- 模型可以像使用普通工具一样使用它们
- 你可以控制每个服务器的可见范围

最后一点很重要。良好的MCP使用不仅仅是“连接一切”，而是“连接正确的事物，并使用最小的有效范围”。

## 步骤一：安装MCP支持

如果你使用标准安装脚本安装了Hermes，则MCP支持已包含在内（安装程序会运行 `uv pip install -e ".[all]"`）。

如果你在未安装额外功能的情况下单独安装了MCP：

```bash
cd ~/.hermes/hermes-agent
uv pip install -e ".[mcp]"
```

对于基于npm的服务器，请确保Node.js和`npx`可用。

对于许多Python MCP服务器，`uvx`是一个不错的选择。

## 步骤二：首先添加一个服务器

从一个单一、安全的服务器开始。

示例：仅限对一个项目目录的文件系统访问。

```yaml
mcp_servers:
  project_fs:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/my-project"]
```

然后启动Hermes：

```bash
hermes chat
```

现在提出一个具体问题：

```text
检查此项目并总结仓库布局。
```

## 步骤三：验证MCP是否已加载

你可以通过几种方式验证MCP：

- 配置正确时，Hermes的横幅/状态应显示MCP集成
- 询问Hermes它有哪些可用工具
- 在配置更改后使用 `/reload-mcp`
- 如果服务器连接失败，请检查日志

一个实用的测试提示：

```text
告诉我当前有哪些MCP支持的工具可用。
```

## 步骤四：立即开始筛选

如果服务器暴露了许多工具，不要等到以后再筛选。

### 示例：仅列出你需要的工具

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

## WSL2：将WSL中的Hermes桥接到Windows Chrome

这是在以下情况下的实用设置：

- Hermes 在 WSL2 内部运行
- 你想控制的浏览器是你在Windows上已登录的普通Chrome
- 从WSL使用 `/browser connect` 不方便或不稳定

在这种设置下，Hermes **不** 直接连接到Chrome。而是：

- Hermes在WSL中运行
- Hermes启动一个本地stdio MCP服务器
- 该MCP服务器通过Windows互操作启动（`cmd.exe` 或 `powershell.exe`）
- MCP服务器附加到你正在运行的Windows Chrome会话

心智模型：

```text
Hermes (WSL) -> MCP stdio桥接 -> Windows Chrome
```

### 为何此模式有用

- 你保留真实的Windows浏览器配置文件、Cookie和登录状态
- Hermes保持在其支持的Unix环境中运行（WSL2）
- 浏览器控制作为MCP工具暴露，而不是依赖Hermes核心的浏览器传输

### 推荐服务器

使用 `chrome-devtools-mcp`。

如果你的Windows Chrome已从 `chrome://inspect/#remote-debugging` 启用了实时远程调试，可以从WSL这样添加它：

```bash
hermes mcp add chrome-devtools-win --command cmd.exe --args /c npx -y chrome-devtools-mcp@latest --autoConnect --no-usage-statistics
```

保存服务器后：

```bash
hermes mcp test chrome-devtools-win
```

然后启动一个新的Hermes会话或运行：

```text
/reload-mcp
```

### 典型提示

加载后，Hermes可以直接使用MCP前缀的浏览器工具。例如：

```text
调用 MCP 工具 mcp_chrome_devtools_win_list_pages，列出当前浏览器标签页。
```

### 何时 `/browser connect` 不适用

如果Hermes在WSL中运行而Chrome在Windows上运行，即使Chrome已打开且可调试，`/browser connect` 也可能失败。

常见原因：

- WSL无法访问Chrome为Windows工具暴露的同一主机本地端点
- 较新的Chrome实时调试流程与经典的 `ws://localhost:9222` 不同
- 从Windows端的助手（如 `chrome-devtools-mcp`）附加浏览器更容易

在这些情况下，将 `/browser connect` 用于同一环境设置，并使用MCP进行WSL到Windows的浏览器桥接。

### 已知陷阱

- 通过MCP使用Windows stdio可执行文件时，从Windows挂载的路径（如 `/mnt/c/Users/<you>` 或 `/mnt/c/workspace/...`）启动Hermes。
- 如果从 `/root` 或 `/home/...` 启动Hermes，Windows可能在MCP服务器启动前发出 `UNC` 当前目录警告。
- 如果 `chrome-devtools-mcp --autoConnect` 在枚举页面时超时，请减少Chrome中的后台/冻结标签页并重试。

### 示例：屏蔽危险操作

```yaml
mcp_servers:
  stripe:
    url: "https://mcp.stripe.com"
    headers:
      Authorization: "Bearer ***"
    tools:
      exclude: [delete_customer, refund_payment]
```

### 示例：也禁用实用程序包装器

```yaml
mcp_servers:
  docs:
    url: "https://mcp.docs.example.com"
    tools:
      prompts: false
      resources: false
```

## 筛选实际上影响什么？

在Hermes中，MCP暴露的功能分为两类：

1.  **服务器原生MCP工具**
    - 通过以下方式筛选：
      - `tools.include`
      - `tools.exclude`

2.  **Hermes添加的实用程序包装器**
    - 通过以下方式筛选：
      - `tools.resources`
      - `tools.prompts`

### 你可能会看到的实用程序包装器

资源：
- `list_resources`
- `read_resource`

提示：
- `list_prompts`
- `get_prompt`

这些包装器仅在以下情况下出现：
- 你的配置允许它们，并且
- MCP服务器会话实际支持这些能力

因此，如果服务器不支持资源/提示，Hermes不会假装它有。

## 常见模式

### 模式一：本地项目助手

当你希望Hermes对一个有界的代码库进行推理时，使用MCP进行仓库本地文件系统或git服务器。

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
审查项目结构并识别配置文件的位置。
```

```text
检查本地git状态并总结最近的更改。
```

### 模式二：GitHub问题分类助手

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
列出关于MCP的开放问题，按主题分类，并为最常见的bug草拟一个高质量的问题。
```

```text
在仓库中搜索 _discover_and_register_server 的使用，并解释MCP工具是如何注册的。
```

### 模式三：内部API助手

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
查找客户ACME Corp并总结其最近的发票活动。
```

这是严格白名单远优于排除列表的地方。

### 模式四：文档/知识服务器

一些MCP服务器暴露的提示或资源更像是共享知识资产，而不是直接操作。

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
列出文档服务器上可用的MCP资源，然后阅读入门指南并进行总结。
```

```text
列出文档服务器暴露的提示，并告诉我哪些对事故响应有帮助。
```

## 教程：带筛选的端到端设置

这是一个实用的渐进过程。

### 阶段一：添加带严格白名单的GitHub MCP

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

启动Hermes并询问：

```text
搜索代码库中对MCP的引用，并总结主要的集成点。
```

### 阶段二：仅在需要时扩展

如果你后来还需要更新问题：

```yaml
tools:
  include: [list_issues, create_issue, update_issue, search_code]
```

然后重新加载：

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

现在Hermes可以组合使用它们：

```text
检查本地项目文件，然后创建一个GitHub问题，总结你发现的bug。
```

这就是MCP变得强大的地方：无需更改Hermes核心即可实现多系统工作流。

## 安全使用建议

### 对危险系统优先使用允许列表

对于任何涉及金融、面向客户或具有破坏性的系统：
- 使用 `tools.include`
- 从尽可能小的集合开始

### 禁用未使用的工具

如果您不希望模型浏览服务器提供的资源/提示，请将其关闭：

```yaml
tools:
  resources: false
  prompts: false
```

### 将服务器作用域限制得尽量小

示例：
- 文件系统服务器根目录限定在单个项目目录，而不是您的整个主目录
- Git 服务器指向单个仓库
- 内部 API 服务器默认暴露以读取为主的工具

### 配置更改后重新加载

```text
/reload-mcp
```

在以下更改后执行此操作：
- 包含/排除列表
- 启用标志
- 资源/提示切换开关
- 认证头/环境变量

## 按症状进行故障排除

### “服务器连接正常，但我预期的工具缺失”

可能原因：
- 被 `tools.include` 过滤掉
- 被 `tools.exclude` 排除
- 通过 `resources: false` 或 `prompts: false` 禁用了实用工具包装器
- 服务器实际上不支持资源/提示

### “服务器已配置，但没有加载任何内容”

检查：
- 配置中未遗留 `enabled: false`
- 命令/运行时存在（例如 `npx`, `uvx` 等）
- HTTP 端点可访问
- 认证环境变量或头信息正确

### “为什么我看到的工具比 MCP 服务器公布的少？”

因为 Hermes 现在遵循您为每个服务器设置的策略以及基于能力的注册机制。这是预期的行为，并且通常是可取的。

### “如何在不删除配置的情况下移除一个 MCP 服务器？”

使用：

```yaml
enabled: false
```

这将保留配置，但会阻止连接和注册。

## 推荐的初始 MCP 设置

对大多数用户来说，好的初始服务器选择：
- 文件系统
- Git
- GitHub
- 获取 / 文档类 MCP 服务器
- 一个范围狭窄的内部 API

不太适合初次使用的服务器：
- 拥有大量破坏性操作且缺乏过滤的大型业务系统
- 任何您不够了解、无法进行有效约束的系统

## 相关文档

- [MCP（模型上下文协议）](/user-guide/features/mcp)
- [常见问题](/reference/faq)
- [斜杠命令](/reference/slash-commands)