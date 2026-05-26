---
title: "Parallel Cli"
sidebar_label: "Parallel Cli"
description: "可选的供应商技能，用于 Parallel CLI —— 智能体原生的网络搜索、信息提取、深度研究、数据增强、FindAll 和监控功能"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Parallel Cli

可选的供应商技能，用于 Parallel CLI —— 智能体原生的网络搜索、信息提取、深度研究、数据增强、FindAll 和监控功能。推荐使用 JSON 输出和非交互式流程。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/research/parallel-cli` 安装 |
| 路径 | `optional-skills/research/parallel-cli` |
| 版本 | `1.1.0` |
| 作者 | Hermes Agent |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Research`, `Web`, `Search`, `Deep-Research`, `Enrichment`, `CLI` |
| 相关技能 | [`duckduckgo-search`](/user-guide/skills/optional/research/research-duckduckgo-search), [`mcporter`](/user-guide/skills/optional/mcp/mcp-mcporter) |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的说明。
:::

# 并行命令行工具

当用户明确要求使用 Parallel 时，或者当终端原生的工作流能够受益于 Parallel 针对网页搜索、信息提取、深度研究、数据增强、实体发现或监控的特定供应商技术栈时，使用 `parallel-cli`。

这是一个可选的第三方工作流，并非 Hermes 核心功能。

重要预期：
- Parallel 是一项提供免费套餐的付费服务，并非完全免费的本地工具。
- 它与 Hermes 原生的 `web_search` / `web_extract` 功能有所重叠，因此对于普通查询，默认情况下不要优先使用它。
- 当用户明确提及 Parallel 或需要 Parallel 的数据增强、FindAll 或监控工作流等功能时，优先选择此技能。

`parallel-cli` 专为智能体设计：
- 通过 `--json` 输出 JSON 格式
- 非交互式命令执行
- 通过 `--no-wait`、`status` 和 `poll` 实现异步长时间运行任务
- 通过 `--previous-interaction-id` 进行上下文链接
- 通过一个命令行工具实现搜索、提取、研究、数据增强、实体发现和监控

## 何时使用

在以下情况下优先选择此技能：
- 用户明确提及 Parallel 或 `parallel-cli`
- 任务需要比单次搜索/提取更丰富的工作流
- 你需要启动异步深度研究任务并稍后进行轮询
- 你需要结构化数据增强、FindAll 实体发现或监控

当未特别请求 Parallel 时，对于快速的一次性查询，请优先使用 Hermes 原生的 `web_search` / `web_extract`。

## 安装

尝试使用环境中可用的侵入性最小的安装路径。

### Homebrew

```bash
brew install parallel-web/tap/parallel-cli
```

### npm

```bash
npm install -g parallel-web-cli
```

### Python 包

```bash
pip install "parallel-web-tools[cli]"
```

### 独立安装程序

```bash
curl -fsSL https://parallel.ai/install.sh | bash
```

如果你想要隔离的 Python 安装，`pipx` 也可以工作：

```bash
pipx install "parallel-web-tools[cli]"
pipx ensurepath
```

## 认证

交互式登录：

```bash
parallel-cli login
```

无头 / SSH / CI 环境：

```bash
parallel-cli login --device
```

API 密钥环境变量：

```bash
export PARALLEL_API_KEY="***"
```

验证当前认证状态：

```bash
parallel-cli auth
```

如果认证需要浏览器交互，请使用 `pty=true` 运行。

## 核心规则集

1. 当需要机器可读的输出时，始终优先使用 `--json`。
2. 优先使用显式参数和非交互式流程。
3. 对于长时间运行的任务，使用 `--no-wait`，然后使用 `status` / `poll`。
4. 仅引用 CLI 输出返回的 URL。
5. 当后续问题很可能出现时，将大型 JSON 输出保存到临时文件。
6. 仅对真正长时间运行的工作流使用后台进程；否则在前台运行。
7. 除非用户明确要求 Parallel 或需要仅 Parallel 可用的工作流，否则优先使用 Hermes 原生工具。

## 快速参考

<!-- ascii-guard-ignore -->
```text
parallel-cli
├── auth
├── login
├── logout
├── search
├── extract / fetch
├── research run|status|poll|processors
├── enrich run|status|poll|plan|suggest|deploy
├── findall run|ingest|status|poll|result|enrich|extend|schema|cancel
└── monitor create|list|get|update|delete|events|event-group|simulate
```
<!-- ascii-guard-ignore-end -->

## 常用标志和模式

常用标志：
- `--json` 用于结构化输出
- `--no-wait` 用于异步任务
- `--previous-interaction-id <id>` 用于复用先前上下文的后续任务
- `--max-results <n>` 用于设置搜索结果数量
- `--mode one-shot|agentic` 用于设置搜索行为
- `--include-domains domain1.com,domain2.com`
- `--exclude-domains domain1.com,domain2.com`
- `--after-date YYYY-MM-DD`

方便时从 stdin 读取：

```bash
echo "What is the latest funding for Anthropic?" | parallel-cli search - --json
echo "Research question" | parallel-cli research run - --json
```

## 搜索

用于获取带结构化结果的当前网页查询。

```bash
parallel-cli search "What is Anthropic's latest AI model?" --json
parallel-cli search "SEC filings for Apple" --include-domains sec.gov --json
parallel-cli search "bitcoin price" --after-date 2026-01-01 --max-results 10 --json
parallel-cli search "latest browser benchmarks" --mode one-shot --json
parallel-cli search "AI coding agent enterprise reviews" --mode agentic --json
```

有用的约束条件：
- `--include-domains` 用于缩小受信任来源的范围
- `--exclude-domains` 用于排除嘈杂的域名
- `--after-date` 用于近期过滤
- `--max-results` 用于需要更广泛覆盖的情况

如果预期有后续问题，请保存输出：

```bash
parallel-cli search "latest React 19 changes" --json -o /tmp/react-19-search.json
```

总结结果时：
- 以答案开头
- 包含日期、名称和具体事实
- 仅引用返回的来源
- 避免编造 URL 或来源标题

## 提取

用于从 URL 拉取干净的内容或 Markdown。

```bash
parallel-cli extract https://example.com --json
parallel-cli extract https://company.com --objective "Find pricing info" --json
parallel-cli extract https://example.com --full-content --json
parallel-cli fetch https://example.com --json
```

当页面内容广泛而你只需要其中一部分信息时，使用 `--objective`。

## 深度研究

用于可能需要时间的更深入多步骤研究任务。

常用处理器级别：
- `lite` / `base` 用于更快、更廉价的处理
- `core` / `pro` 用于更彻底的综合分析
- `ultra` 用于最繁重的研究任务

### 同步模式

```bash
parallel-cli research run \
  "Compare the leading AI coding agents by pricing, model support, and enterprise controls" \
  --processor core \
  --json
```

### 异步启动 + 轮询

```bash
parallel-cli research run \
  "Compare the leading AI coding agents by pricing, model support, and enterprise controls" \
  --processor ultra \
  --no-wait \
  --json

parallel-cli research status trun_xxx --json
parallel-cli research poll trun_xxx --json
parallel-cli research processors --json
```

### 上下文链接 / 后续任务

```bash
parallel-cli research run "What are the top AI coding agents?" --json
parallel-cli research run \
  "What enterprise controls does the top-ranked one offer?" \
  --previous-interaction-id trun_xxx \
  --json
```

推荐的 Hermes 工作流：
1. 使用 `--no-wait --json` 启动
2. 捕获返回的运行/任务 ID
3. 如果用户希望继续其他工作，则继续执行
4. 稍后调用 `status` 或 `poll`
5. 使用返回来源中的引用总结最终报告

## 数据增强

当用户有 CSV/JSON/表格输入并希望通过网络研究推断出额外列时使用此功能。

### 建议列名

```bash
parallel-cli enrich suggest "Find the CEO and annual revenue" --json
```

### 规划配置

```bash
parallel-cli enrich plan -o config.yaml
```

### 内联数据

```bash
parallel-cli enrich run \
  --data '[{"company": "Anthropic"}, {"company": "Mistral"}]' \
  --intent "Find headquarters and employee count" \
  --json
```

### 非交互式文件运行

```bash
parallel-cli enrich run \
  --source-type csv \
  --source companies.csv \
  --target enriched.csv \
  --source-columns '[{"name": "company", "description": "Company name"}]' \
  --intent "Find the CEO and annual revenue"
```

### YAML 配置运行

```bash
parallel-cli enrich run config.yaml
```

### 状态 / 轮询

```bash
parallel-cli enrich status <task_group_id> --json
parallel-cli enrich poll <task_group_id> --json
```

在非交互式操作时，为列定义使用显式 JSON 数组。
在报告成功之前验证输出文件。

## FindAll

当用户想要一个可发现的数据集而非简短答案时，用于网页规模的实体发现。

```bash
parallel-cli findall run "Find AI coding agent startups with enterprise offerings" --json
parallel-cli findall run "AI startups in healthcare" -n 25 --json
parallel-cli findall status <run_id> --json
parallel-cli findall poll <run_id> --json
parallel-cli findall result <run_id> --json
parallel-cli findall schema <run_id> --json
```

当用户想要一个可回顾、过滤或后期增强的已发现实体集时，这比普通搜索更合适。

## 监控

用于随时间进行持续的变化检测。

```bash
parallel-cli monitor list --json
parallel-cli monitor get <monitor_id> --json
parallel-cli monitor events <monitor_id> --json
parallel-cli monitor delete <monitor_id> --json
```

创建通常是敏感的部分，因为频率和交付方式很重要：

```bash
parallel-cli monitor create --help
```

当用户希望对某个页面或来源进行定期跟踪而非一次性获取时，使用此功能。

## 推荐的 Hermes 使用模式

### 带引用的快速回答
1. 运行 `parallel-cli search ... --json`
2. 解析标题、URL、日期、摘要
3. 仅使用返回的 URL 进行内联引用总结

### URL 调查
1. 运行 `parallel-cli extract URL --json`
2. 如果需要，使用 `--objective` 或 `--full-content` 重新运行
3. 引用或总结提取出的 Markdown

### 长时研究工作流
1. 运行 `parallel-cli research run ... --no-wait --json`
2. 存储返回的 ID
3. 继续其他工作或定期轮询
4. 使用引用总结最终报告

### 结构化数据增强工作流
1. 检查输入文件和列
2. 使用 `enrich suggest` 或提供显式的增强列
3. 运行 `enrich run`
4. 如果需要，轮询等待完成
5. 在报告成功之前验证输出文件

## 错误处理与退出码

CLI 记录了以下退出码：
- `0` 成功
- `2` 输入错误
- `3` 认证错误
- `4` API 错误
- `5` 超时

遇到认证错误时：
1. 检查 `parallel-cli auth`
2. 确认 `PARALLEL_API_KEY` 已设置，或运行 `parallel-cli login` / `parallel-cli login --device`
3. 验证 `parallel-cli` 是否在 `PATH` 环境变量中

## 维护

检查当前认证/安装状态：

```bash
parallel-cli auth
parallel-cli --help
```

更新命令：

```bash
parallel-cli update
pip install --upgrade parallel-web-tools
parallel-cli config auto-update-check off
```

## 注意事项

- 除非用户明确要求人工可读的输出格式，否则请勿省略 `--json` 参数。
- 请勿引用 CLI 输出中未出现的信息源。
- `login` 命令可能需要交互式终端或浏览器操作。
- 对于简短任务，优先选择前台执行；避免过度使用后台进程。
- 对于大量结果集，建议将 JSON 保存到 `/tmp/*.json` 文件，而非全部塞入上下文。
- 若 Hermes 原生工具已足够使用，请勿静默选择 Parallel。
- 请注意，此工作流通常需要账户认证，免费额度用尽后会产生付费使用。