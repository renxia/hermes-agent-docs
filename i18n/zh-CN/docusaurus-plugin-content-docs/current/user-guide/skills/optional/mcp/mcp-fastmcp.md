---
title: "Fastmcp — 使用 FastMCP 在 Python 中构建、测试、检查、安装和部署 MCP 服务器"
sidebar_label: "Fastmcp"
description: "使用 FastMCP 在 Python 中构建、测试、检查、安装和部署 MCP 服务器"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Fastmcp

使用 FastMCP 在 Python 中构建、测试、检查、安装和部署 MCP 服务器。这适用于创建新的 MCP 服务器、将 API 或数据库封装为 MCP 工具、暴露资源或提示，或者为 Claude Code、Cursor 或 HTTP 部署准备 FastMCP 服务器的情况。

## Skill metadata

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/mcp/fastmcp` 安装 |
| Path | `optional-skills/mcp/fastmcp` |
| Version | `1.0.0` |
| Author | Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `MCP`, `FastMCP`, `Python`, `Tools`, `Resources`, `Prompts`, `Deployment` |
| Related skills | `native-mcp`, [`mcporter`](/docs/user-guide/skills/optional/mcp/mcp-mcporter) |

## Reference: full SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# FastMCP

使用 FastMCP 在 Python 中构建 MCP 服务器，本地验证它们，将它们安装到 MCP 客户端中，并作为 HTTP 端点部署它们。

## When to Use (何时使用)

当任务是以下任一项时，请使用此技能：

- 使用 Python 创建一个新的 MCP 服务器
- 将 API、数据库、CLI 或文件处理工作流封装为 MCP 工具
- 除了工具之外，暴露资源或提示
- 在将其集成到 Hermes 或其他客户端之前，使用 FastMCP CLI 进行烟雾测试服务器
- 将服务器安装到 Claude Code、Claude Desktop、Cursor 或类似的 MCP 客户端中
- 为 HTTP 部署准备 FastMCP 服务器仓库

如果服务器已经存在，只需要连接到 Hermes，则使用 `native-mcp`。如果目标是获取现有 MCP 服务器的临时 CLI 访问权限而不是构建一个，则使用 `mcporter`。

## Prerequisites (先决条件)

首先在工作环境中安装 FastMCP：

```bash
pip install fastmcp
fastmcp version
```

对于 API 模板，如果尚未安装，请安装 `httpx`：

```bash
pip install httpx
```

## Included Files (包含的文件)

### Templates (模板)

- `templates/api_wrapper.py` - 带身份验证头支持的 REST API 封装器
- `templates/database_server.py` - 只读 SQLite 查询服务器
- `templates/file_processor.py` - 文本文件检查和搜索服务器

### Scripts (脚本)

- `scripts/scaffold_fastmcp.py` - 复制一个启动模板并替换服务器名称占位符

### References (参考资料)

- `references/fastmcp-cli.md` - FastMCP CLI 工作流、安装目标和部署检查

## Workflow (工作流程)

### 1. 选择最小可行服务器形态 (Pick the Smallest Viable Server Shape)

首先选择最窄的有用表面积：

- API 封装器：从 1-3 个高价值端点开始，而不是整个 API
- 数据库服务器：暴露只读检查和受限查询路径
- 文件处理器：暴露具有显式路径参数的确定性操作
- 提示/资源：仅在客户端需要可重用提示模板或可发现文档时才添加

优先选择一个拥有良好名称、docstrings 和 schema 的精简服务器，而不是一个功能模糊的大型服务器。

### 2. 从模板进行脚手架搭建 (Scaffold from a Template)

直接复制模板或使用脚手架助手：

```bash
python ~/.hermes/skills/mcp/fastmcp/scripts/scaffold_fastmcp.py \
  --template api_wrapper \
  --name "Acme API" \
  --output ./acme_server.py
```

可用模板：

```bash
python ~/.hermes/skills/mcp/fastmcp/scripts/scaffold_fastmcp.py --list
```

如果手动复制，请将 `__SERVER_NAME__` 替换为实际的服务器名称。

### 3. 先实现工具 (Implement Tools First)

在添加资源或提示之前，先从 `@mcp.tool` 函数开始。

工具设计的规则：

- 为每个工具提供一个具体的、基于动词的名称
- 将 docstrings 编写为面向用户的工具描述
- 保持参数显式和类型化
- 在可能的情况下返回结构化的 JSON 安全数据
- 及早地验证不安全的输入
- 默认优先采用只读行为

好的工具示例：

- `get_customer` (获取客户)
- `search_tickets` (搜索工单)
- `describe_table` (描述表格)
- `summarize_text_file` (总结文本文件)

差的工具示例：

- `run` (运行)
- `process` (处理)
- `do_thing` (做某事)

### 4. 仅在有帮助时才添加资源和提示 (Add Resources and Prompts Only When They Help)

当客户端从获取稳定的只读内容（例如 schema、策略文档或生成的报告）中受益时，才添加 `@mcp.resource`。

当服务器应为已知工作流提供可重用的提示模板时，才添加 `@mcp.prompt`。

不要将每个文档都变成一个提示。优先使用：

- 工具 (tools) 用于操作
- 资源 (resources) 用于数据/文档检索
- 提示 (prompts) 用于可重用的 LLM 指令

### 5. 在集成到任何地方之前测试服务器 (Test the Server Before Integrating It Anywhere)

使用 FastMCP CLI 进行本地验证：

```bash
fastmcp inspect acme_server.py:mcp
fastmcp list acme_server.py --json
fastmcp call acme_server.py search_resources query=router limit=5 --json
```

为了快速迭代调试，在本地运行服务器：

```bash
fastmcp run acme_server.py:mcp
```

要测试本地 HTTP 传输：

```bash
fastmcp run acme_server.py:mcp --transport http --host 127.0.0.1 --port 8000
fastmcp list http://127.0.0.1:8000/mcp --json
fastmcp call http://127.0.0.1:8000/mcp search_resources query=router --json
```

在声称服务器工作之前，务必至少运行一次真实的 `fastmcp call`。

### 6. 在本地验证通过后将其安装到客户端 (Install into a Client When Local Validation Passes)

FastMCP 可以将服务器注册到支持的 MCP 客户端：

```bash
fastmcp install claude-code acme_server.py
fastmcp install claude-desktop acme_server.py
fastmcp install cursor acme_server.py -e .
```

使用 `fastmcp discover` 来检查机器上已配置的命名 MCP 服务器。

如果目标是 Hermes 集成，则：

- 使用 `native-mcp` 技能在 `~/.hermes/config.yaml` 中配置服务器，或者
- 在界面稳定之前继续使用 FastMCP CLI 命令进行开发

### 7. 在本地契约稳定后部署 (Deploy After the Local Contract Is Stable)

对于托管式服务，Prefect Horizon 是 FastMCP 最直接文档化的路径。在部署之前：

```bash
fastmcp inspect acme_server.py:mcp
```

确保仓库包含：

- 包含 FastMCP 服务器对象的 Python 文件
- `requirements.txt` 或 `pyproject.toml`
- 任何用于部署所需的环境变量文档

对于通用的 HTTP 托管，首先在本地验证 HTTP 传输，然后部署到任何可以暴露服务器端口的 Python 兼容平台。

## Common Patterns (常见模式)

### API Wrapper Pattern (API 封装器模式)

当将 REST 或 HTTP API 作为 MCP 工具暴露时使用。

推荐的第一部分：

- 一个读取路径
- 一个列表/搜索路径
- 可选的健康检查

实现注意事项：

- 将身份验证保存在环境变量中，而不是硬编码
- 将请求逻辑集中到一个帮助函数中
- 以简洁的上下文展示 API 错误
- 在返回之前标准化不一致的上游负载

从 `templates/api_wrapper.py` 开始。

### Database Pattern (数据库模式)

当暴露安全查询和检查功能时使用。

推荐的第一部分：

- `list_tables` (列出表格)
- `describe_table` (描述表格)
- 一个受限的读取查询工具

实现注意事项：

- 默认设置为只读 DB 访问
- 在早期版本中拒绝非 `SELECT` SQL
- 限制行数
- 返回行和列名

从 `templates/database_server.py` 开始。

### File Processor Pattern (文件处理器模式)

当服务器需要按需检查或转换文件时使用。

推荐的第一部分：

- 总结文件内容
- 在文件中搜索
- 提取确定性元数据

实现注意事项：

- 接受显式的文件路径
- 检查缺失的文件和编码错误
- 限制预览和结果计数
- 除非需要特定的外部工具，否则避免调用 shell

从 `templates/file_processor.py` 开始。

## Quality Bar (质量标准)

在交付 FastMCP 服务器之前，请验证以下所有内容：

- 服务器导入干净
- `fastmcp inspect <file.py:mcp>` 成功
- `fastmcp list <server spec> --json` 成功
- 每个新工具都至少有一个真实的 `fastmcp call`
- 环境变量已记录在案
- 工具的表面积足够小，无需猜测即可理解

## Troubleshooting (故障排除)

### FastMCP 命令缺失

在活动环境中安装该软件包：

```bash
pip install fastmcp
fastmcp version
```

### `fastmcp inspect` 失败

检查以下内容：

- 文件导入时没有导致崩溃的副作用
- FastMCP 实例在 `<file.py:object>` 中命名正确
- 已安装模板中的可选依赖项

### 工具在 Python 中工作但通过 CLI 不工作

运行：

```bash
fastmcp list server.py --json
fastmcp call server.py your_tool_name --json
```

这通常暴露了名称不匹配、缺少必需参数或不可序列化的返回值。

### Hermes 无法看到已部署的服务器

服务器构建部分可能是正确的，但 Hermes 配置可能不正确。加载 `native-mcp` 技能并在 `~/.hermes/config.yaml` 中配置服务器，然后重启 Hermes。

## References (参考资料)

有关 CLI 细节、安装目标和部署检查，请阅读 `references/fastmcp-cli.md`。