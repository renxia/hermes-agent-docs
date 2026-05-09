---
sidebar_position: 3
---

# 配置模型

Hermes 使用两种类型的模型插槽：

- **主模型** — 智能体进行思考所使用的模型。每个用户消息、每次工具调用循环、每次流式响应都会经过此模型。
- **辅助模型** — 智能体卸载的较小任务。包括上下文压缩、视觉（图像分析）、网页摘要、会话搜索、审批评分、MCP 工具路由、会话标题生成和技能搜索。每个任务都有其独立的插槽，可以独立覆盖。

本页面介绍如何通过仪表板配置这两种模型。如果您更喜欢使用配置文件或 CLI，请跳转到底部的[替代方法](#alternative-methods)。

## 模型页面

打开仪表板，然后点击侧边栏中的**模型**。您将看到两个部分：

1. **模型设置** — 顶部面板，用于将模型分配到插槽。
2. **使用情况分析** — 按卡片形式排列，显示所选时间段内运行过会话的所有模型，包括 token 数量、成本和能力徽章。

![模型页面概览](/img/docs/dashboard-models/overview.png)

顶部卡片是**模型设置**面板。主行始终显示智能体将为新会话启动的模型。点击**更改**以打开选择器。

## 设置主模型

点击“主模型”行中的**更改**：

![模型选择对话框](/img/docs/dashboard-models/picker-dialog.png)

选择器分为两列：

- **左侧** — 已认证的服务商。只有您已设置的服务商（设置了 API 密钥、完成了 OAuth 或定义为自定义端点）才会显示在此处。如果某个服务商缺失，请前往**密钥**页面添加其凭据。
- **右侧** — 所选服务商的精选模型列表。这些是 Hermes 为该服务商推荐的智能体模型，而非原始 `/models` 接口返回的全部模型（例如 OpenRouter 上包含 400 多个模型，包括 TTS、图像生成器和重排模型）。

在筛选框中输入内容，可按服务商名称、短名称或模型 ID 进行筛选。

选择一个模型，点击**切换**，Hermes 会将其写入 `~/.hermes/config.yaml` 的 `model` 部分。**此操作仅对新会话生效** — 您已打开的任何聊天标签页将继续使用其启动时的模型。若要在当前聊天中热切换模型，请在该聊天中使用 `/model` 斜杠命令。

## 设置辅助模型

点击**显示辅助模型**以展开八个任务槽：

![辅助面板展开](/img/docs/dashboard-models/auxiliary-expanded.png)

每个辅助任务默认均为 `auto` — 即 Hermes 也会使用您的主模型来完成该任务。当您希望使用更便宜或更快的模型处理某项辅助任务时，可覆盖该任务的设置。

### 常见覆盖模式

| 任务 | 何时覆盖 |
|---|---|
| **标题生成** | 几乎总是如此。一个 $0.10/M 的 Flash 模型生成会话标题的效果与 Opus 相当。默认配置在 OpenRouter 上将其设置为 `google/gemini-3-flash-preview`。 |
| **视觉** | 当您的主模型是无视觉功能的编程模型时（例如 Kimi、DeepSeek）。可将其指向 `google/gemini-2.5-flash` 或 `gpt-4o-mini`。 |
| **压缩** | 当您仅为了总结上下文就在 Opus/M2.7 上消耗推理令牌时。一个快速的聊天模型能以 1/50 的成本完成该任务。 |
| **会话搜索** | 当回忆查询发散时 — 默认最大并发数为 3。使用廉价模型可保持费用可控。 |
| **审批** | 对于 `approval_mode: smart` — 一个快速/廉价的模型（如 Haiku、Flash、gpt-5-mini）决定是否自动批准低风险命令。在此处使用昂贵模型是浪费。 |
| **网页提取** | 当您大量使用 `web_extract` 时。逻辑与压缩相同 — 总结不需要推理能力。 |
| **技能中心** | `hermes skills search` 使用此模型。通常 `auto` 即可。 |
| **MCP** | MCP 工具路由。通常 `auto` 即可。 |

### 按任务覆盖

点击任意辅助行中的**更改**。将打开相同的选择器，行为一致 — 选择服务商 + 模型，点击**切换**。该行将更新为显示 `服务商 · 模型`，而非 `auto (使用主模型)`。

### 全部重置为 auto

如果您过度调优并希望重新开始，请点击辅助部分顶部的**全部重置为 auto**。所有槽位将恢复使用您的主模型。

## “用作”快捷方式

页面上的每个模型卡片都有一个**用作**下拉菜单。这是快捷路径 — 选择您在分析中看到的模型，点击**用作**，即可一键将其分配给主槽位或任何特定的辅助任务：

![用作下拉菜单](/img/docs/dashboard-models/use-as-dropdown.png)

下拉菜单包含：

- **主模型** — 与点击主行中的“更改”相同。
- **所有辅助任务** — 一次性将此模型分配给全部 8 个辅助槽位。当您希望所有辅助任务都使用廉价的 Flash 模型时非常有用。
- **单个任务选项** — 视觉、网页提取、压缩等。每个任务当前分配的模型会标记为 `current`。

当模型卡片当前被分配到某个任务时，会带有 `main` 或 `aux · <任务>` 的徽章 — 这样您就能一目了然地看出哪些历史模型在何处被使用。

## 写入 `config.yaml` 的内容

当您通过仪表板保存时，Hermes 会写入 `~/.hermes/config.yaml`：

**主模型：**
```yaml
model:
  provider: openrouter
  default: anthropic/claude-opus-4.7
  base_url: ''        # 切换服务商时清空
  api_mode: chat_completions
```

**辅助覆盖（示例 — 视觉使用 gemini-flash）：**
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

**辅助任务使用 auto（默认）：**
```yaml
auxiliary:
  compression:
    provider: auto
    model: ''
    base_url: ''
    # ... 其他字段保持不变
```

`provider: auto` 且 `model: ''` 表示 Hermes 对该任务使用主模型。

## 何时生效？

- **CLI** (`hermes chat`)：下一次调用 `hermes chat` 时。
- **网关**（Telegram、Discord、Slack 等）：下一个*新*会话。现有会话保持其模型不变。如果您希望强制所有会话应用更改，请重启网关（`hermes gateway restart`）。
- **仪表板聊天标签页** (`/chat`)：下一个新 PTY。当前打开的聊天保持其模型 — 使用 `/model` 命令在其中热切换。

更改绝不会使正在运行的会话的提示缓存失效。这是有意为之：在会话内切换主模型需要重置缓存（系统提示包含模型特定内容），我们将其保留给聊天中的显式 `/model` 斜杠命令。

## 故障排除

### 选择器中显示“无已认证服务商”

Hermes 仅在服务商拥有有效凭据时才会列出它。请检查侧边栏中的**密钥** — 您应看到以下之一：API 密钥、成功的 OAuth 或自定义端点 URL。如果您想要的服务商不在其中，请运行 `hermes setup` 进行配置，或前往**密钥**页面添加环境变量。

### 我的运行中聊天的主模型未更改

这是预期行为。仪表板写入 `config.yaml`，新会话会读取该文件。当前打开的聊天是一个活动的智能体进程 — 它会保持其启动时的模型。请在聊天中使用 `/model <名称>` 来热切换该特定会话。

### 辅助覆盖“未生效”

请检查以下三点：

1. **您是否启动了新会话？** 现有聊天不会重新读取配置。
2. **`provider` 是否设置为 `auto` 以外的值？** 如果该字段显示 `auto`，则该任务仍在使用您的主模型。请点击**更改**并选择一个真实的服务商。
3. **服务商是否已认证？** 如果您将 `minimax` 分配给某项任务但没有 MiniMax API 密钥，则该任务会回退到 openrouter 默认值，并在 `agent.log` 中记录警告。

### 我选择了一个模型，但 Hermes 却切换了服务商

在 OpenRouter（或任何聚合器）上，裸模型名称会*优先在聚合器内部*解析。因此，OpenRouter 上的 `claude-sonnet-4` 会变成 `anthropic/claude-sonnet-4.6`，并保持在您的 OpenRouter 认证下。但如果您在原生 Anthropic 认证下输入 `claude-sonnet-4`，它会保持为 `claude-sonnet-4-6`。如果您看到意外的服务商切换，请检查您当前的服务商是否符合预期 — 选择器始终在对话框顶部显示当前主模型。

## 替代方法

### CLI 斜杠命令

在任何 `hermes chat` 会话中：

```
/model gpt-5.4 --provider openrouter             # 仅当前会话
/model gpt-5.4 --provider openrouter --global    # 同时持久化到 config.yaml
```

`--global` 的作用与仪表板的**更改**按钮相同，此外还会就地切换正在运行的会话。

### 自定义别名

为您经常使用的模型定义自己的短名称，然后在 CLI 或任何消息平台中使用 `/model <别名>`：

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

或从 shell 中（短格式，`服务商/模型`）：

```bash
hermes config set model.aliases.fav anthropic/claude-opus-4.6
hermes config set model.aliases.grok x-ai/grok-4
```

然后在聊天中使用 `/model fav` 或 `/model grok`。用户别名会覆盖内置短名称（`sonnet`、`kimi`、`opus` 等）。完整参考请参阅[自定义模型别名](/docs/reference/slash-commands#custom-model-aliases)。

### `hermes model` 子命令

```bash
hermes model list                   # 列出已认证服务商 + 模型
hermes model set anthropic/claude-opus-4.7 --provider openrouter
```

### 直接编辑配置

编辑 `~/.hermes/config.yaml` 并重启读取它的任何组件。完整架构请参阅[配置参考](./configuration.md)。

### REST API

仪表板使用三个端点。适用于脚本编写：

```bash
# 列出已认证服务商 + 精选模型列表
curl -H "X-Hermes-Session-Token: $TOKEN" http://localhost:PORT/api/model/options

# 读取当前主模型 + 辅助分配
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

# 将所有辅助任务重置为 auto
curl -X POST -H "Content-Type: application/json" -H "X-Hermes-Session-Token: $TOKEN" \
  -d '{"scope":"auxiliary","task":"__reset__","provider":"","model":""}' \
  http://localhost:PORT/api/model/set
```

会话令牌在服务器启动时注入到仪表板 HTML 中，并在每次服务器重启时轮换。如果您要对正在运行的仪表板编写脚本，请从浏览器开发者工具中获取它（`window.__HERMES_SESSION_TOKEN__`）。