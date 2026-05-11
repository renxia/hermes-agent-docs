---
sidebar_position: 3
---

# 配置模型

赫尔墨斯使用两种模型槽位：

- **主模型** — 智能体用于思考的模型。每条用户消息、每次工具调用循环、每个流式响应都通过此模型处理。
- **辅助模型** — 智能体卸载的小型辅助任务。包括上下文压缩、视觉分析、网页摘要、会话搜索、评分审批、MCP工具路由、会话标题生成和技能搜索。每个都有独立的槽位，可以分别覆盖设置。

本页介绍如何通过仪表盘配置这两种模型。如果你偏好使用配置文件或命令行，请直接跳转至底部的[替代方法](#替代方法)。

## 模型页面

打开仪表盘，点击侧边栏的**模型**。你将看到两个部分：

1. **模型设置** — 顶部面板，用于将模型分配给槽位。
2. **使用分析** — 排序卡片显示选定时间段内每个运行过会话的模型，包括令牌数、成本和能力徽章。

![模型页面概览](/img/docs/dashboard-models/overview.png)

顶部卡片是**模型设置**面板。主行始终显示智能体为新会话启动的模型。点击**更改**以打开选择器。

## 设置主模型

点击主模型行旁边的 **更改**：

![模型选择器对话框](/img/docs/dashboard-models/picker-dialog.png)

选择器有两列：

- **左侧** — 已认证的服务提供商。只有您已设置（设置了API密钥、已完成OAuth授权，或已定义为自定义端点）的服务提供商才会显示在此处。如果缺少某个提供商，请前往 **密钥** 添加其凭证。
- **右侧** — 所选服务商的精选模型列表。这些是 Hermes 为该服务商推荐的智能体模型，而非原始的 `/models` 列表（在 OpenRouter 上，该列表包含 400 多个模型，包括文本转语音、图像生成器和重排序器）。

在过滤框中输入内容，可以按提供商名称、模型标识符或模型 ID 进行筛选。

选择一个模型，点击 **切换**，Hermes 就会将它写入 `~/.hermes/config.yaml` 文件的 `model` 部分。**此设置仅适用于新会话** — 您已打开的任何聊天选项卡将继续运行它启动时所用的模型。要热切换当前聊天，请在其中使用 `/model` 斜杠命令。

## 设置辅助模型

点击 **显示辅助任务** 以显示八个任务槽：

![展开的辅助面板](/img/docs/dashboard-models/auxiliary-expanded.png)

每个辅助任务默认设为 `auto` — 这意味着 Hermes 也会使用您的主模型来完成该任务。当您想用一个更便宜或更快的模型来处理某项次要任务时，可以覆盖特定任务。

### 常见的覆盖模式

| 任务 | 何时覆盖 |
|---|---|
| **标题生成** | 几乎总是需要。一个 $0.10/M 的快速模型生成会话标题的效果与 Opus 一样好。默认配置在 OpenRouter 上将其设为 `google/gemini-3-flash-preview`。 |
| **视觉** | 当您的主模型是不具备视觉能力的编码模型时（例如 Kimi、DeepSeek）。将其指向 `google/gemini-2.5-flash` 或 `gpt-4o-mini`。 |
| **压缩** | 当您在 Opus/M2.7 上消耗推理令牌只是为了总结上下文时。一个快速的聊天模型可以以 1/50 的成本完成这项工作。 |
| **会话搜索** | 当召回查询并发量大时 — 默认最大并发数为 3。一个便宜的模型可以使账单可预测。 |
| **审批** | 用于 `approval_mode: smart` — 一个快速/便宜的模型（haiku, flash, gpt-5-mini）决定是否自动批准低风险命令。在这里使用昂贵模型是浪费。 |
| **网页提取** | 当您大量使用 `web_extract` 时。逻辑与压缩相同 — 摘要不需要推理能力。 |
| **技能中心** | `hermes skills search` 使用此设置。通常设为 `auto` 即可。 |
| **MCP** | MCP 工具路由。通常设为 `auto` 即可。 |

### 覆盖单个任务

点击任何辅助任务行上的 **更改**。会打开相同的选择器，行为也一样 — 选择提供商 + 模型，点击切换。该行将更新为显示 `提供商 · 模型`，而不是 `auto（使用主模型）`。

### 全部重置为自动

如果您调整过多，想重新开始，点击辅助部分顶部的 **全部重置为 auto**。每个槽位都会恢复为使用您的主模型。

## “用作”快捷方式

页面上的每个模型卡片都有一个 **用作** 下拉菜单。这是快速路径 — 在您的分析数据中看到一个模型，点击 **用作**，然后一键将其分配给主槽位或任何特定的辅助任务：

![用作下拉菜单](/img/docs/dashboard-models/use-as-dropdown.png)

下拉菜单包含：

- **主模型** — 与点击主行的“更改”相同。
- **所有辅助任务** — 将此模型一次分配给所有 8 个辅助槽位。当您只想让所有次要任务都使用一个便宜的快速模型时，这很有用。
- **各个任务选项** — 视觉、网页提取、压缩等。每个任务当前分配的模型会标记为 `current`。

当卡片当前被分配给某个任务时，会标有 `main` 或 `aux · <任务>` 的徽章 — 这样您一眼就能看出您的历史模型是如何被连接的。

## 写入 `config.yaml` 的内容

当您通过仪表板保存时，Hermes 会写入 `~/.hermes/config.yaml`：

**主模型：**
```yaml
model:
  provider: openrouter
  default: anthropic/claude-opus-4.7
  base_url: ''        # 切换提供商时清空
  api_mode: chat_completions
```

**辅助覆盖（示例 — 视觉任务使用 gemini-flash）：**
```yaml
auxiliary:
  vision:
    provider: openrouter
    model: google/gemini-2.5-flash
    base_url: ''
    api_key: ''
    timeout: 120
    extra_body: {}
    download_timeout: 30
```

**辅助任务为自动（默认）：**
```yaml
auxiliary:
  compression:
    provider: auto
    model: ''
    base_url: ''
    # ... 其他字段不变
```

`provider: auto` 与 `model: ''` 告诉 Hermes 对该任务使用主模型。

## 何时生效？

- **CLI** (`hermes chat`)：下次调用 `hermes chat` 时生效。
- **网关**（Telegram, Discord, Slack 等）：下一个*新*会话生效。现有会话保留其模型。如果您想强制所有会话应用更改，请重启网关 (`hermes gateway restart`)。
- **仪表板聊天选项卡** (`/chat`)：下一个新 PTY 生效。当前打开的聊天保留其模型 — 在其中使用 `/model` 进行热切换。

更改不会使正在运行的会话的提示缓存失效。这是有意为之的：在会话中切换主模型需要重置缓存（系统提示包含模型特定内容），我们将其保留给聊天中的显式 `/model` 斜杠命令。

## 故障排除

### 选择器中显示“没有已认证的服务提供商”

Hermes 仅在提供商拥有有效凭证时才会列出它。请检查侧边栏中的 **密钥** — 您应该看到以下之一：API 密钥、成功的 OAuth 授权或自定义端点 URL。如果您需要的提供商不在那里，请运行 `hermes setup` 进行配置，或转到 **密钥** 添加环境变量。

### 主模型在运行的聊天中没有改变

这是预期行为。仪表板写入 `config.yaml`，新会话会读取它。当前打开的聊天是一个活动的智能体进程 — 它保留启动时所使用的模型。在聊天内部使用 `/model <名称>` 来热切换该特定会话。

### 辅助覆盖“没有生效”

检查三件事：

1.  **您是否启动了新会话？** 现有聊天不会重新读取配置。
2.  **`provider` 是否设置为 `auto` 以外的值？** 如果该字段显示 `auto`，该任务仍在使用您的主模型。点击 **更改** 并选择一个真实的提供商。
3.  **提供商是否已认证？** 如果您为任务分配了 `minimax` 但没有 MiniMax API 密钥，该任务将回退到 openrouter 默认值，并在 `agent.log` 中记录警告。

### 我选了一个模型但 Hermes 切换了提供商

在 OpenRouter（或任何聚合器）上，裸模型名称首先在聚合器*内部*解析。因此，OpenRouter 上的 `claude-sonnet-4` 会变成 `anthropic/claude-sonnet-4.6`，并保持在您的 OpenRouter 认证下。但如果您在本机 Anthropic 认证上输入 `claude-sonnet-4`，它将保持为 `claude-sonnet-4-6`。如果您看到意外的提供商切换，请检查您当前的提供商是否如您所料 — 选择器总是在对话框顶部显示当前的主模型。

## 替代方法

### CLI 斜杠命令

在任何 `hermes chat` 会话中：

```
/model gpt-5.4 --provider openrouter             # 仅限当前会话
/model gpt-5.4 --provider openrouter --global    # 同时持久化到 config.yaml
```

`--global` 与仪表板上的 **更改** 按钮作用相同，还会就地切换正在运行的会话。

### 自定义别名为您经常使用的模型定义自己的短名称，然后在 CLI 或任何消息平台中使用 `/model <别名>`：

```yaml
# ~/.hermes/config.yaml
model_aliases:
  fav:
    model: claude-sonnet-4.6
    provider: anthropic
  grok:
    model: grok-4
    provider: x-ai
```

或从 shell 设置（简写形式，`提供商/模型`）：

```bash
hermes config set model.aliases.fav anthropic/claude-opus-4.6
hermes config set model.aliases.grok x-ai/grok-4
```

然后在聊天中使用 `/model fav` 或 `/model grok`。用户别名会覆盖内置短名称（`sonnet`, `kimi`, `opus` 等）。完整参考请见 [自定义模型别名](/docs/reference/slash-commands#custom-model-aliases)。

### `hermes model` 子命令

```bash
hermes model            # 交互式提供商 + 模型选择器（切换默认设置的规范方式）
```

`hermes model` 会引导您选择提供商、进行认证（OAuth 流程会打开浏览器；API 密钥提供商会提示输入密钥），然后从该提供商的精选目录中选择一个特定模型。选择结果将写入 `~/.hermes/config.yaml` 中的 `model.provider` 和 `model.model`。

要列出提供商/模型而不启动选择器，请使用仪表板或下面的 REST 端点。要检查 CLI 当前实际使用的配置：`hermes config get model` 和 `hermes status`。

### 直接编辑配置

编辑 `~/.hermes/config.yaml` 并重启任何读取它的程序。完整架构请参见 [配置参考](./configuration.md)。

### REST API

仪表板使用三个端点。适合脚本编写：

```bash
# 列出已认证的提供商 + 精选模型列表
curl -H "X-Hermes-Session-Token: $TOKEN" http://localhost:PORT/api/model/options

# 读取当前主模型 + 辅助任务分配
curl -H "X-Hermes-Session-Token: $TOKEN" http://localhost:PORT/api/model/auxiliary

# 设置主模型
curl -X POST -H "Content-Type: application/json" -H "X-Hermes-Session-Token: $TOKEN" \
  -d '{"scope":"main","provider":"openrouter","model":"anthropic/claude-opus-4.7"}' \
  http://localhost:PORT/api/model/set

# 覆盖单个辅助任务
curl -X POST -H "Content-Type: application/json" -H "X-Hermes-Session-Token: $TOKEN" \
  -d '{"scope":"auxiliary","task":"vision","provider":"openrouter","model":"google/gemini-2.5-flash"}' \
  http://localhost:PORT/api/model/set

# 将一个模型分配给所有辅助任务
curl -X POST -H "Content-Type: application/json" -H "X-Hermes-Session-Token: $TOKEN" \
  -d '{"scope":"auxiliary","task":"","provider":"openrouter","model":"google/gemini-2.5-flash"}' \
  http://localhost:PORT/api/model/set

# 将所有辅助任务重置为自动
curl -X POST -H "Content-Type: application/json" -H "X-Hermes-Session-Token: $TOKEN" \
  -d '{"scope":"auxiliary","task":"__reset__","provider":"","model":""}' \
  http://localhost:PORT/api/model/set
```

会话令牌在启动时注入到仪表板 HTML 中，并在每次服务器重启时轮换。如果您要针对正在运行的仪表板编写脚本，请从浏览器开发工具 (`window.__HERMES_SESSION_TOKEN__`) 中获取它。