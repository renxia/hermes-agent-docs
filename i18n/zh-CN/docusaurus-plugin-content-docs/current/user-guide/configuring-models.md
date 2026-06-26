---
sidebar_position: 3
---

# 配置模型

Hermes 使用两种类型的模型槽位：

- **主模型** — 智能体用于思考的模型。每条用户消息、每次工具调用循环、每个流式响应都通过此模型处理。
- **辅助模型** — 智能体卸载的较小支线任务。上下文压缩、视觉（图像分析）、网页摘要、审批评分、MCP 工具路由、会话标题生成和技能搜索。每个辅助模型都有自己的槽位，可以独立覆盖。

本页介绍如何从仪表板配置这两种模型。如果你更偏好配置文件或命令行，请跳至底部的[替代方法](#alternative-methods)。

:::tip 最快路径：Nous 门户
[Nous 门户](/user-guide/features/tool-gateway)在一个订阅下提供 300+ 个模型。在新安装上，运行 `hermes setup --portal` 登录并一键将 Nous 设置为你的提供商。使用 `hermes portal info` 查看已配置的内容。

- 门户订阅者还可享受**按 token 计费的提供商 9 折优惠**。
:::

:::note `model:` 模式 — 空字符串与映射的区别
在新安装时，捆绑的默认配置中 `model: ""`（一个表示"尚未配置"的空字符串哨兵值）。首次运行 `hermes setup` 或 `hermes model` 时，该键会在原地升级为包含 `provider`、`default`、`base_url` 和 `api_mode` 子键的映射 — 即本页以及 [`profiles.md`](./profiles.md) / [`configuration.md`](./configuration.md) 中展示的形态。如果你在 `config.yaml` 中看到空字符串，请运行 `hermes model`（或在仪表板中点击 **更改**），Hermes 将为你写入字典形式。
:::

## 模型页面

打开仪表板，在侧边栏中点击 **模型**。你会看到两个部分：

1. **模型设置** — 顶部面板，用于为槽位分配模型。
2. **用量分析** — 排名卡片，展示在选定时间段内运行过会话的每个模型，包含 token 数量、费用和能力标签。

![模型页面概览](/img/docs/dashboard-models/overview.png)

顶部卡片是 **模型设置** 面板。主行始终显示智能体将为新会话启动的模型。点击 **更改** 打开选择器。

## 设置主模型

在"主模型"行点击 **Change**：

![模型选择器对话框](/img/docs/dashboard-models/picker-dialog.png)

选择器有两列：

- **左侧** — 已认证的提供方。仅显示你已设置好的提供方（已设置 API 密钥、完成 OAuth 或定义为自定义端方）。如果缺少某个提供方，请前往 **Keys** 添加其凭证。
- **右侧** — 所选提供方的精选模型列表。这些是 Hermes 为该提供方推荐的智能体模型，而非原始的 `/models` 输出（例如在 OpenRouter 上包含 400 多个模型，包括 TTS、图像生成器和重排序器）。

在筛选框中输入内容，可按提供方名称、slug 或模型 ID 进行过滤。

选择一个模型，点击 **Switch**，Hermes 会将其写入 `~/.hermes/config.yaml` 的 `model` 部分。**这仅适用于新会话** — 任何已打开的聊天标签页会继续使用其启动时的模型。要热切换当前聊天，请在聊天内使用 `/model` 斜杠命令。

### 会话中切换与上下文警告

当你在**活动会话中**切换模型（Herm TUI 模型选择器、`hermes` CLI 或 Telegram/Discord 上的 `/model`）时，Hermes 会估计你的**下一条消息**是否会针对新模型的窗口执行**预飞行上下文压缩**。如果会话已经接近或超过该模型的压缩阈值（参见[上下文压缩](./configuration.md#context-compression)），切换回复中会包含一条警告 — 与昂贵模型通知使用的 `warning_message` 路径相同。切换仍然立即生效；压缩会在**切换后的第一条用户消息**上运行，在模型回复之前。

## 设置辅助模型

点击 **Show auxiliary** 展开 11 个任务槽位：

![辅助面板展开状态](/img/docs/dashboard-models/auxiliary-expanded.png)

每个辅助任务默认为 `auto` — 即 Hermes 也尝试使用主模型来完成该任务。如果该路径不可用或遇到容量类故障，`auto` 会遵循任务特定的 `auxiliary.<task>.fallback_chain`，然后是主 `fallback_providers` / `fallback_model` 链，最后是 Hermes 内置的辅助发现链。当你希望为某个辅助任务使用更便宜或更快的模型时，可以覆盖特定任务。

### 常见覆盖模式

| 任务 | 何时覆盖 |
|---|---|
| **Title Gen** | 几乎总是。$0.10/M 的闪速模型写会话标题和 Opus 一样好。默认配置在 OpenRouter 上将其设置为 `google/gemini-3-flash-preview`。 |
| **Vision** | 当主模型不支持视觉功能时。指向 `google/gemini-2.5-flash` 或 `gpt-4o-mini`。 |
| **Compression** | 当你正在 Opus/M2.7 上消耗推理令牌来总结上下文时。一个快速聊天模型以 1/50 的成本完成工作。 |
| **Approval** | 用于 `approval_mode: smart` — 一个快速/便宜的模型（haiku、flash、gpt-5-mini）决定是否自动批准低风险命令。在这里使用昂贵模型是浪费。 |
| **Web Extract** | 当你大量使用 `web_extract` 时。逻辑与压缩相同 — 摘要不需要推理。 |
| **Skills Hub** | `hermes skills search` 使用此任务。通常 `auto` 即可。 |
| **MCP** | MCP 工具路由。通常 `auto` 即可。 |
| **Triage Specifier** | 路由看板分拣说明器（`hermes kanban specify`），将粗略的单行描述扩展为具体规格。一个便宜且能力强的模型效果很好。 |
| **Kanban Decomposer** | 路由看板任务分解 — 将一个分拣任务拆分为子任务图，供专家配置文件使用。 |
| **Profile Describer** | 路由配置文件描述生成（`hermes profile describe --auto` / 仪表板自动生成按钮）。简短、便宜的调用。 |
| **Curator** | 路由策展人的技能使用审查过程。在推理模型上可能运行几分钟，因此使用更便宜的辅助模型通常值得。 |

### 按任务覆盖

在任意辅助行上点击 **Change**。打开相同的选择器，行为相同 — 选择提供方 + 模型，点击 Switch。该行会更新显示 `provider · model`，而非 `auto (use main model)`。

### 全部重置为 auto

如果你过度调整了配置想要重新开始，点击辅助部分顶部的 **Reset all to auto**。每个槽位都会恢复为使用主模型。

## "Use as" 快捷方式

页面上的每个模型卡片都有一个 **Use as** 下拉菜单。这是快捷路径 — 选择你在分析中看到的模型，点击 **Use as**，一键将其分配到主槽位或任何特定的辅助任务：

![Use as 下拉菜单](/img/docs/dashboard-models/use-as-dropdown.png)

下拉菜单包含：

- **Main model** — 与在主行点击 Change 相同。
- **All auxiliary tasks** — 将这个模型同时分配到全部 11 个辅助槽位。当你希望所有辅助任务都使用便宜的闪速模型时很有用。
- **单个任务选项** — Vision、Web Extract、Compression 等。每个任务当前分配的模型标记为 `current`。

当卡片当前已分配到某个位置时，会带有 `main` 或 `aux · <task>` 标记 — 这样你可以一目了然地看到你的历史模型哪些接入了哪些位置。

## 写入 `config.yaml` 的内容

通过仪表板保存时，Hermes 会写入 `~/.hermes/config.yaml`：

**主模型：**
```yaml
model:
  provider: openrouter
  default: anthropic/claude-opus-4.7
  base_url: ''        # 切换提供方时清除
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

**辅助使用 auto（默认）：**
```yaml
auxiliary:
  compression:
    provider: auto
    model: ''
    base_url: ''
    # ... 其他字段保持不变
```

带有 `model: ''` 的 `provider: auto` 告诉 Hermes 对该任务使用主模型，同时在主路径无法服务辅助调用时仍遵循回退策略。

可选的任务特定回退链位于同一辅助任务下：

```yaml
auxiliary:
  title_generation:
    provider: auto
    model: ''
    fallback_chain:
      - provider: openrouter
        model: inclusionai/ring-2.6-1t:free
```

当 `fallback_chain` 不存在时，`auto` 会先使用顶层 `fallback_providers` 链，再使用内置的辅助发现链。

## 何时生效？

- **CLI**（`hermes chat`）：下次 `hermes chat` 调用。
- **网关**（Telegram、Discord、Slack 等）：下一个*新*会话。现有会话保留其模型。如果要强制所有会话获取更改，请重启网关（`hermes gateway restart`）。
- **仪表板聊天标签页**（`/chat`）：下一个新 PTY。当前打开的聊天保留其模型 — 在其中使用 `/model` 进行热切换。

更改永远不会使运行中会话的提示缓存失效。这是有意为之：在会话内切换主模型需要缓存重置（系统提示包含特定模型的内容），我们将其保留给聊天内显式的 `/model` 斜杠命令。

## 故障排除

### 选择器中显示"No authenticated providers"

Hermes 仅在提供方有有效凭证时才会列出它。检查侧边栏中的 **Keys** — 你应该能看到以下之一：API 密钥、成功的 OAuth 或自定义端点 URL。如果你想要的提供方不在其中，运行 `hermes setup` 进行配置，或前往 **Keys** 添加环境变量。

### 主模型在我运行的聊天中未更改

这是预期的。仪表板写入 `config.yaml`，新会话读取该文件。当前打开的聊天是一个实时智能体进程 — 它保留其启动时使用的模型。在聊天内使用 `/model <name>` 来热切换该特定会话。

### 辅助覆盖"未生效"

检查以下三点：

1. **你是否开始了新会话？** 现有聊天不会重新读取配置。
2. **`provider` 是否设置为 `auto` 以外的值？** 如果该字段显示 `auto`，任务仍在使用你的主模型。点击 **Change** 并选择一个真实的提供方。
3. **提供方是否已认证？** 如果你将 `minimax` 分配给了某个任务但没有 MiniMax API 密钥，该任务会回退到 openrouter 默认值，并在 `agent.log` 中记录警告。

### 我选择了一个模型但 Hermes 替我切换了提供方

在 OpenRouter（或任何聚合器）上，裸模型名称首先在聚合器*内*解析。因此 OpenRouter 上的 `claude-sonnet-4` 会变为 `anthropic/claude-sonnet-4.6`，保持在你的 OpenRouter 认证上。但如果你在原生 Anthropic 认证上输入 `claude-sonnet-4`，它会保持为 `claude-sonnet-4-6`。如果你看到意外的提供方切换，请检查你当前的提供方是否符合预期 — 选择器总是在对话框顶部显示当前主提供方。

## 替代方法

### CLI 斜杠命令

在任何 `hermes chat` 会话中：

```
/model gpt-5.4 --provider openrouter             # 仅当前会话
/model gpt-5.4 --provider openrouter --global    # 同时持久化到 config.yaml
```

`--global` 执行的操作与仪表板的 **Change** 按钮相同，此外还会就地切换运行中的会话。

### 自定义别名

为你经常使用的模型定义自己的简短名称，然后在 CLI 或任何消息平台中使用 `/model <alias>`。有两种等效格式 — 选择适合你工作流程的。

**规范形式（顶层 `model_aliases:`）** — 完全控制 provider + base_url：

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

**短字符串形式（`model.aliases.<name>: provider/model`）** — 从 shell 方便使用，因为 `hermes config set` 只写入标量值，但无法携带自定义 `base_url`：

```bash
hermes config set model.aliases.fav anthropic/claude-opus-4.6
hermes config set model.aliases.grok x-ai/grok-4
```

两条路径都供给同一个加载器（`hermes_cli/model_switch.py`）。在 `model_aliases:` 中声明的条目优先于同名的 `model.aliases:` 条目。

然后在聊天中使用 `/model fav` 或 `/model grok`。用户别名会遮蔽内置短名称（`sonnet`、`kimi`、`opus` 等）。完整参考请参阅[自定义模型别名](/reference/slash-commands#custom-model-aliases)。

### `hermes model` 子命令

```bash
hermes model            # 交互式提供方 + 模型选择器（切换默认值的规范方式）
```

`hermes model` 引导你完成选择提供方、认证（OAuth 流程会打开浏览器；API 密钥提供方会提示输入密钥），然后从该提供方的精选目录中选择特定模型。选择结果会写入 `~/.hermes/config.yaml` 中的 `model.provider` 和 `model.model`。

要在不启动选择器的情况下列出提供方/模型，请使用仪表板或下面的 REST 端点。要检查 CLI 当前实际会使用什么：`hermes config show | grep '^model\.'` 和 `hermes status`。

### 直接编辑配置

编辑 `~/.hermes/config.yaml` 并重启读取它的组件。完整模式请参阅[配置参考](./configuration.md)。

### REST API

仪表板使用三个端点。对脚本很有用：

```bash
# 列出已认证的提供方 + 精选模型列表
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

# 将一个模型分配到所有辅助任务
curl -X POST -H "Content-Type: application/json" -H "X-Hermes-Session-Token: $TOKEN" \
  -d '{"scope":"auxiliary","task":"","provider":"openrouter","model":"google/gemini-2.5-flash"}' \
  http://localhost:PORT/api/model/set

# 重置所有辅助任务为 auto
curl -X POST -H "Content-Type: application/json" -H "X-Hermes-Session-Token: $TOKEN" \
  -d '{"scope":"auxiliary","task":"__reset__","provider":"","model":""}' \
  http://localhost:PORT/api/model/set
```

会话令牌在启动时注入到仪表板 HTML 中，并在每次服务器重启时轮换。如果要对运行中的仪表板编写脚本，请从浏览器开发者工具中获取（`window.__HERMES_SESSION_TOKEN__`）。