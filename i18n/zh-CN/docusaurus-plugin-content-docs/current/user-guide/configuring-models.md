---
sidebar_position: 3
---

# 配置模型

Hermes 使用两种模型插槽：

- **主模型** —— 智能体用它进行思考。每个用户消息、每个工具调用循环、每个流式响应都通过这个模型处理。
- **辅助模型** —— 智能体将更小的辅助任务卸载给它。包括上下文压缩、视觉（图像分析）、网页摘要、审批评分、MCP工具路由、会话标题生成和技能搜索。每种都有自己的插槽，可以独立覆盖。

本页面介绍如何从仪表板配置这两种模型。如果你更喜欢使用配置文件或命令行工具，请跳到页面底部的[替代方法](#alternative-methods)。

:::tip 最快途径：Nous 门户
[Nous 门户](/user-guide/features/tool-gateway) 在单一订阅下提供 300 多个模型。在全新安装后，运行 `hermes setup --portal` 即可一键登录并将 Nous 设置为你的提供商。使用 `hermes portal status` 查看已配置的项目。
:::

## 模型页面

打开仪表板，点击侧边栏中的 **Models**。你会看到两个部分：

1. **模型设置** —— 顶部面板，你在这里为各个插槽分配模型。
2. **使用分析** —— 显示所选时间段内每个运行过会话的模型的排名卡片，包括 token 计数、成本和功能标签。

![模型页面概览](/img/docs/dashboard-models/overview.png)

顶部卡片是 **模型设置** 面板。主行始终显示智能体将为新会话启动的模型。点击 **Change** 打开选择器。

## 设置主模型

在主模型行点击 **更改**：

![模型选择器对话框](/img/docs/dashboard-models/picker-dialog.png)

选择器包含两列：

- **左侧** — 已认证的服务提供商。此处仅显示您已设置（已配置 API 密钥、完成 OAuth 或定义为自定义端点）的提供商。如果某个提供商缺失，请前往 **密钥** 添加其凭证。
- **右侧** — 针对所选提供商的精选模型列表。这些是 Hermes 为该提供商推荐的智能体模型，并非原始的 `/models` 列表（在 OpenRouter 上，后者包含 400 多个模型，涵盖 TTS、图像生成器和重排序器）。

在筛选框中输入内容，可按提供商名称、标识符或模型 ID 进行过滤。

选择一个模型，点击 **切换**，Hermes 会将其写入 `~/.hermes/config.yaml` 的 `model` 部分。**此更改仅对新会话生效** — 您已打开的任何聊天标签页将继续运行其启动时使用的模型。若要热切换当前聊天，请在其中使用 `/model` 斜杠命令。

## 设置辅助模型

点击 **显示辅助模型** 以展开八个任务槽位：

![辅助面板展开](/img/docs/dashboard-models/auxiliary-expanded.png)

每个辅助任务默认设置为 `auto` — 这意味着 Hermes 也会将您的主模型用于该任务。当您需要为次要任务选择更便宜或更快的模型时，可以覆盖特定任务。

### 常见覆盖模式

| 任务 | 何时覆盖 |
|---|---|
| **标题生成** | 几乎总是。一个 $0.10/M 的 flash 模型也能像 Opus 一样撰写会话标题。默认配置在 OpenRouter 上将此项设为 `google/gemini-3-flash-preview`。 |
| **视觉** | 当您的主模型是无视觉功能的编程模型（例如 Kimi、DeepSeek）时。将其指向 `google/gemini-2.5-flash` 或 `gpt-4o-mini`。 |
| **压缩** | 当您在 Opus/M2.7 上消耗推理 token 只为总结上下文时。一个快速的聊天模型能以 1/50 的成本完成此工作。 |
| **审批** | 用于 `approval_mode: smart` — 一个快速/廉价的模型（haiku, flash, gpt-5-mini）决定是否自动批准低风险命令。使用昂贵模型在这里是浪费。 |
| **网页提取** | 当您大量使用 `web_extract` 时。与压缩逻辑相同 — 总结不需要推理。 |
| **技能中心** | `hermes skills search` 使用此项。通常设为 `auto` 即可。 |
| **MCP** | MCP 工具路由。通常设为 `auto` 即可。 |

### 单任务覆盖

在任意辅助行点击 **更改**。将打开相同的选择器，行为相同 — 选择提供商 + 模型，点击切换。该行将更新显示 `提供商 · 模型`，而不是 `auto (使用主模型)`。

### 全部重置为 auto

如果您调整过度并想重新开始，请点击辅助部分顶部的 **全部重置为 auto**。每个槽位都将恢复为使用您的主模型。

## "用作"快捷方式

页面上的每个模型卡片都有一个 **用作** 下拉菜单。这是一个快速通道 — 选择您在分析中看到的模型，点击 **用作**，然后一键将其分配到主槽位或任何特定的辅助任务：

![用作下拉菜单](/img/docs/dashboard-models/use-as-dropdown.png)

下拉菜单包含：

- **主模型** — 与点击主行的“更改”相同。
- **所有辅助任务** — 将此模型一次性分配到所有 8 个辅助槽位。当您只想将所有次要任务放在一个便宜的 flash 模型上时很有用。
- **单个任务选项** — 视觉、网页提取、压缩等。每个任务当前分配的模型会标记为 `current`。

当卡片当前被分配到某个任务时，会显示 `main` 或 `aux · <任务>` 徽章 — 这样您可以一目了然地看到您的历史模型是如何被配置使用的。

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

**辅助设为 auto（默认）：**
```yaml
auxiliary:
  compression:
    provider: auto
    model: ''
    base_url: ''
    # ... 其他字段不变
```

`provider: auto` 且 `model: ''` 表示 Hermes 对该任务使用主模型。

## 何时生效？

- **CLI** (`hermes chat`)：下次执行 `hermes chat` 时生效。
- **网关** (Telegram, Discord, Slack 等)：下次*新*会话生效。现有会话保留其模型。如果您想强制所有会话应用更改，请重启网关 (`hermes gateway restart`)。
- **仪表板聊天标签页** (`/chat`)：下次新建 PTY 时生效。当前打开的聊天保留其模型 — 在其中使用 `/model` 进行热切换。

更改不会使正在运行的会话上的提示缓存失效。这是故意的：在会话内切换主模型需要重置缓存（系统提示包含特定于模型的内容），我们将此功能保留给聊天内的显式 `/model` 斜杠命令。

## 故障排除

### 选择器中显示“无已认证的提供商”

Hermes 仅在提供商拥有有效凭证时才会列出它。请检查侧边栏中的 **密钥** — 您应该会看到以下之一：API 密钥、成功的 OAuth 或自定义端点 URL。如果您需要的提供商不在那里，请运行 `hermes setup` 进行配置，或前往 **密钥** 添加环境变量。

### 我的运行中聊天主模型未更改

这是预期行为。仪表板写入 `config.yaml`，新会话会读取它。当前打开的聊天是一个活跃的智能体进程 — 它保留其启动时使用的模型。在聊天内部使用 `/model <名称>` 来热切换该特定会话。

### 辅助覆盖“未生效”

请检查以下三点：

1. **您是否开始了新会话？** 现有聊天不会重新读取配置。
2. **`provider` 是否设置为 `auto` 以外的值？** 如果该字段显示 `auto`，则该任务仍在使用您的主模型。请点击 **更改** 并选择一个真实的提供商。
3. **提供商是否已认证？** 如果您将 `minimax` 分配给某个任务但没有 MiniMax API 密钥，该任务将回退到 openrouter 默认设置，并在 `agent.log` 中记录警告。

### 我选择了一个模型但 Hermes 更改了提供商

在 OpenRouter（或任何聚合器）上，裸模型名称会优先在聚合器内部解析。因此 OpenRouter 上的 `claude-sonnet-4` 会变为 `anthropic/claude-sonnet-4.6`，保持使用您的 OpenRouter 认证。但如果您在原生 Anthropic 认证上输入 `claude-sonnet-4`，它会保持为 `claude-sonnet-4-6`。如果您看到意外的提供商切换，请检查您当前的提供商是否符合预期 — 选择器始终在对话框顶部显示当前主模型。

## 替代方法

### CLI 斜杠命令

在任何 `hermes chat` 会话内部：

```
/model gpt-5.4 --provider openrouter             # 仅本次会话有效
/model gpt-5.4 --provider openrouter --global    # 同时持久化到 config.yaml
```

`--global` 的作用与仪表板的 **更改** 按钮相同，并且它会就地切换正在运行的会话。

### 自定义别名

为您经常使用的模型定义自己的简称，然后在 CLI 或任何消息平台中使用 `/model <别名>`：

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

或者从 shell（简短形式，`provider/model`）：

```bash
hermes config set model.aliases.fav anthropic/claude-opus-4.6
hermes config set model.aliases.grok x-ai/grok-4
```

然后在聊天中输入 `/model fav` 或 `/model grok`。用户别名会覆盖内置简称（`sonnet`、`kimi`、`opus` 等）。完整参考请参见[自定义模型别名](/reference/slash-commands#custom-model-aliases)。

### `hermes model` 子命令

```bash
hermes model            # 交互式提供商 + 模型选择器（切换默认值的规范方式）
```

`hermes model` 会引导您选择提供商、进行认证（OAuth 流程会打开浏览器；基于 API 密钥的提供商将提示输入密钥），然后从该提供商的精选目录中选择特定模型。选择结果将写入 `~/.hermes/config.yaml` 中的 `model.provider` 和 `model.model`。

要列出提供商/模型而不启动选择器，请使用仪表板或下面的 REST 端点。要检查 CLI 当前实际使用的配置：`hermes config get model` 和 `hermes status`。

### 直接编辑配置

编辑 `~/.hermes/config.yaml` 并重启任何读取它的程序。完整模式请参见[配置参考](./configuration.md)。

### REST API

仪表板使用三个端点。可用于脚本：

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

# 将一个模型分配到所有辅助任务
curl -X POST -H "Content-Type: application/json" -H "X-Hermes-Session-Token: $TOKEN" \
  -d '{"scope":"auxiliary","task":"","provider":"openrouter","model":"google/gemini-2.5-flash"}' \
  http://localhost:PORT/api/model/set

# 将所有辅助任务重置为 auto
curl -X POST -H "Content-Type: application/json" -H "X-Hermes-Session-Token: $TOKEN" \
  -d '{"scope":"auxiliary","task":"__reset__","provider":"","model":""}' \
  http://localhost:PORT/api/model/set
```

会话令牌在仪表板启动时注入到 HTML 中，并在每次服务器重启时轮换。如果您要针对运行中的仪表板编写脚本，可以从浏览器开发者工具中获取它 (`window.__HERMES_SESSION_TOKEN__`)。