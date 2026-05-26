---
title: "Fastmcp — 使用 Python 中的 FastMCP 构建、测试、检查、安装和部署 MCP 服务器"
sidebar_label: "Fastmcp"
description: "使用 Python 中的 FastMCP 构建、测试、检查、安装和部署 MCP 服务器"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源 SKILL.md 文件，而非此页面。 */}

# Fastmcp

使用 Python 中的 FastMCP 构建、测试、检查、安装和部署 MCP 服务器。在创建新的 MCP 服务器、将 API 或数据库封装为 MCP 工具、暴露资源或提示、或为 Claude Code、Cursor 或 HTTP 部署准备 FastMCP 服务器时使用。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/mcp/fastmcp` 安装 |
| 路径 | `optional-skills/mcp/fastmcp` |
| 版本 | `1.0.0` |
| 作者 | Hermes Agent |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `MCP`, `FastMCP`, `Python`, `Tools`, `Resources`, `Prompts`, `Deployment` |
| 相关技能 | [`native-mcp`](/user-guide/skills/bundled/mcp/mcp-native-mcp), [`mcporter`](/user-guide/skills/optional/mcp/mcp-mcporter) |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时 Hermes 加载的完整技能定义。这是智能体在技能激活时看到的指示。
:::

# FastMCP

使用 FastMCP 用 Python 构建 MCP 服务器，本地验证，安装到 MCP 客户端，并将其部署为 HTTP 端点。

## 何时使用

当任务符合以下情况时使用此技能：

- 用 Python 创建一个新的 MCP 服务器
- 将 API、数据库、CLI 或文件处理工作流封装为 MCP 工具
- 在工具之外暴露资源或提示
- 在将其接入 Hermes 或另一个客户端之前，使用 FastMCP CLI 对服务器进行冒烟测试
- 将服务器安装到 Claude Code、Claude Desktop、Cursor 或类似的 MCP 客户端
- 为 HTTP 部署准备一个 FastMCP 服务器仓库

当服务器已存在且只需连接到 Hermes 时，使用 `native-mcp`。当目标是临时通过 CLI 访问现有的 MCP 服务器而不是构建一个时，使用 `mcporter`。

## 前提条件

首先在工作环境中安装 FastMCP：

```bash
pip install fastmcp
fastmcp version
```

对于 API 模板，如果尚未安装 `httpx`，请安装它：

```bash
pip install httpx
```

## 包含的文件

### 模板

- `templates/api_wrapper.py` - 带有认证头支持的 REST API 包装器
- `templates/database_server.py` - 只读的 SQLite 查询服务器
- `templates/file_processor.py` - 文本文件检查和搜索服务器

### 脚本

- `scripts/scaffold_fastmcp.py` - 复制一个入门模板并替换服务器名称占位符

### 参考资料

- `references/fastmcp-cli.md` - FastMCP CLI 工作流程、安装目标和部署检查

## 工作流程

### 1. 选择最小可行服务器形状

首先选择最窄的有用表面积：

- API 包装器：从 1-3 个高价值端点开始，而不是整个 API
- 数据库服务器：暴露只读内省和受约束的查询路径
- 文件处理器：暴露具有显式路径参数的确定性操作
- 提示/资源：仅在客户端需要可重用的提示模板或可发现文档时添加

比起一个工具模糊的大型服务器，更倾向于一个具有好名称、文档字符串和模式的薄服务器。

### 2. 从模板搭建

直接复制模板或使用搭建助手：

```bash
python ~/.hermes/skills/mcp/fastmcp/scripts/scaffold_fastmcp.py \
  --template api_wrapper \
  --name "Acme API" \
  --output ./acme_server.py
```

可用的模板：

```bash
python ~/.hermes/skills/mcp/fastmcp/scripts/scaffold_fastmcp.py --list
```

如果手动复制，请将 `__SERVER_NAME__` 替换为真实的服务器名称。

### 3. 首先实现工具

在添加资源或提示之前，先从 `@mcp.tool` 函数开始。

工具设计规则：

- 为每个工具提供一个具体的基于动词的名称
- 将文档字符串编写为面向用户的工具描述
- 保持参数明确且有类型
- 尽可能返回结构化的 JSON 安全数据
- 尽早验证不安全的输入
- 对于第一个版本，默认更喜欢只读行为

好的工具示例：

- `get_customer`
- `search_tickets`
- `describe_table`
- `summarize_text_file`

弱的工具示例：

- `run`
- `process`
- `do_thing`

### 4. 仅在它们有用时添加资源和提示

当客户端受益于获取稳定的只读内容（如模式、策略文档或生成的报告）时，添加 `@mcp.resource`。

当服务器应为已知工作流提供可重用的提示模板时，添加 `@mcp.prompt`。

不要将每个文档都变成提示。更倾向于：

- 工具用于操作
- 资源用于数据/文档检索
- 提示用于可重用的 LLM 指示

### 5. 在集成到任何地方之前测试服务器

使用 FastMCP CLI 进行本地验证：

```bash
fastmcp inspect acme_server.py:mcp
fastmcp list acme_server.py --json
fastmcp call acme_server.py search_resources query=router limit=5 --json
```

要进行快速迭代调试，在本地运行服务器：

```bash
fastmcp run acme_server.py:mcp
```

要在本地测试 HTTP 传输：

```bash
fastmcp run acme_server.py:mcp --transport http --host 127.0.0.1 --port 8000
fastmcp list http://127.0.0.1:8000/mcp --json
fastmcp call http://127.0.0.1:8000/mcp search_resources query=router --json
```

在声称服务器可以工作之前，始终对每个新工具至少运行一次真实的 `fastmcp call`。

### 6. 当本地验证通过时安装到客户端

FastMCP 可以向支持的 MCP 客户端注册服务器：

```bash
fastmcp install claude-code acme_server.py
fastmcp install claude-desktop acme_server.py
fastmcp install cursor acme_server.py -e .
```

使用 `fastmcp discover` 来检查机器上已经配置的命名 MCP 服务器。

当目标是 Hermes 集成时，可以：

- 使用 `native-mcp` 技能在 `~/.hermes/config.yaml` 中配置服务器，或者
- 在开发期间继续使用 FastMCP CLI 命令，直到接口稳定

### 7. 在本地契约稳定后部署

对于托管部署，Prefect Horizon 是 FastMCP 最直接记录的途径。在部署之前：

```bash
fastmcp inspect acme_server.py:mcp
```

确保仓库包含：

- 一个包含 FastMCP 服务器对象的 Python 文件
- `requirements.txt` 或 `pyproject.toml`
- 部署所需的任何环境变量文档

对于通用 HTTP 部署，首先在本地验证 HTTP 传输，然后在任何可以暴露服务器端口的 Python 兼容平台上部署。

## 常见模式

### API 包装器模式

在将 REST 或 HTTP API 暴露为 MCP 工具时使用。

推荐的第一层：

- 一个读取路径
- 一个列表/搜索路径
- 可选的健康检查

实现说明：

- 将认证信息保存在环境变量中，不要硬编码
- 将请求逻辑集中在一个辅助函数中
- 提供简洁的上下文来呈现 API 错误
- 在返回之前规范化不一致的上游载荷

从 `templates/api_wrapper.py` 开始。

### 数据库模式

在暴露安全查询和检查功能时使用。

推荐的第一层：

- `list_tables`
- `describe_table`
- 一个受约束的读取查询工具

实现说明：

- 默认为只读数据库访问
- 在早期版本中拒绝非 `SELECT` 的 SQL
- 限制行数
- 返回行以及列名

从 `templates/database_server.py` 开始。

### 文件处理器模式

当服务器需要按需检查或转换文件时使用。

推荐的第一层：

- 总结文件内容
- 在文件中搜索
- 提取确定性元数据

实现说明：

- 接受显式文件路径
- 检查缺失文件和编码失败
- 限制预览和结果计数
- 除非需要特定的外部工具，否则避免使用 shell 命令

从 `templates/file_processor.py` 开始。

## 质量标准

在移交 FastMCP 服务器之前，验证以下所有项：

- 服务器导入无错误
- `fastmcp inspect <file.py:mcp>` 成功
- `fastmcp list <server spec> --json` 成功
- 每个新工具至少有一次真实的 `fastmcp call`
- 环境变量已记录
- 工具表面足够小，无需猜测即可理解

## 故障排除

### FastMCP 命令缺失

在活动环境中安装包：

```bash
pip install fastmcp
fastmcp version
```

### `fastmcp inspect` 失败

检查：

- 文件导入时没有导致崩溃的副作用
- FastMCP 实例在 `<file.py:object>` 中命名正确
- 模板中的可选依赖项已安装

### 工具在 Python 中有效，但在 CLI 中无效

运行：

```bash
fastmcp list server.py --json
fastmcp call server.py your_tool_name --json
```

这通常会暴露命名不匹配、缺少必需参数或不可序列化的返回值。

### Hermes 无法看到已部署的服务器

服务器构建部分可能是正确的，但 Hermes 配置可能不是。加载 `native-mcp` 技能并在 `~/.hermes/config.yaml` 中配置服务器，然后重启 Hermes。

## 参考

有关 CLI 详情、安装目标和部署检查，请阅读 `references/fastmcp-cli.md`。