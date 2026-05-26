---
title: 回退提供程序
description: 配置在主模型不可用时自动回退到备用LLM提供程序。
sidebar_label: 回退提供程序
sidebar_position: 8
---

# 回退提供程序

Hermes 智能体具有三层弹性机制，可在提供程序遇到问题时维持您的会话运行：

1.  **[凭证池](./credential-pools.md)** — 为*同一*提供程序轮换多个API密钥（首先尝试）
2.  **主模型回退** — 当主模型失败时，自动切换到*不同*的提供程序：模型
3.  **辅助任务回退** — 为视觉、压缩和网页提取等辅助任务独立进行提供程序解析

凭证池处理同提供程序轮换（例如，多个OpenRouter密钥）。本页介绍跨提供程序回退。两者都是可选的，并且独立工作。

## 主模型回退

当您的主LLM提供程序遇到错误时——速率限制、服务器过载、身份验证失败、连接中断——Hermes可以在会话中途自动切换到备用的提供程序：模型对，而不会丢失您的对话。

### 配置

最简单的方式是使用交互式管理器：

```bash
hermes fallback
```

`hermes fallback` 复用了 `hermes model` 中的提供程序选择器——相同的提供程序列表、相同的凭证提示、相同的验证。使用子命令 `add`、`list`（别名 `ls`）、`remove`（别名 `rm`）和 `clear` 来管理回退链。更改会持久化在 `config.yaml` 的顶级 `fallback_providers:` 列表下。

如果您更愿意直接编辑YAML，可以在 `~/.hermes/config.yaml` 中添加一个 `fallback_model` 部分：

```yaml
fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

`provider` 和 `model` 都是**必需的**。如果缺少任一项，回退功能将被禁用。

:::note `fallback_model` 与 `fallback_providers`
`fallback_model`（单数）是旧版的单一回退键——为了向后兼容，Hermes仍然支持它。`fallback_providers`（复数，列表）支持按顺序尝试的多个回退；`hermes fallback` 命令会写入此键。当两者同时设置时，Hermes会合并它们，且 `fallback_providers` 优先级更高。
:::

### 支持的提供程序

| 提供程序 | 值 | 要求 |
|----------|-------|-------------|
| AI Gateway | `ai-gateway` | `AI_GATEWAY_API_KEY` |
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY` |
| Nous Portal | `nous` | `hermes setup --portal`（全新）或 `hermes auth add nous`（OAuth） |
| OpenAI Codex | `openai-codex` | `hermes model`（ChatGPT OAuth） |
| GitHub Copilot | `copilot` | `COPILOT_GITHUB_TOKEN`、`GH_TOKEN` 或 `GITHUB_TOKEN` |
| GitHub Copilot ACP | `copilot-acp` | 外部进程（编辑器集成） |
| Anthropic | `anthropic` | `ANTHROPIC_API_KEY` 或 Claude Code 凭证 |
| z.ai / GLM | `zai` | `GLM_API_KEY` |
| Kimi / Moonshot | `kimi-coding` | `KIMI_API_KEY` |
| MiniMax | `minimax` | `MINIMAX_API_KEY` |
| MiniMax (中国) | `minimax-cn` | `MINIMAX_CN_API_KEY` |
| DeepSeek | `deepseek` | `DEEPSEEK_API_KEY` |
| NVIDIA NIM | `nvidia` | `NVIDIA_API_KEY`（可选：`NVIDIA_BASE_URL`） |
| GMI Cloud | `gmi` | `GMI_API_KEY`（可选：`GMI_BASE_URL`） |
| StepFun | `stepfun` | `STEPFUN_API_KEY`（可选：`STEPFUN_BASE_URL`） |
| Ollama Cloud | `ollama-cloud` | `OLLAMA_API_KEY` |
| Google Gemini (OAuth) | `google-gemini-cli` | `hermes model`（Google OAuth；可选：`HERMES_GEMINI_PROJECT_ID`） |
| Google AI Studio | `gemini` | `GOOGLE_API_KEY`（别名：`GEMINI_API_KEY`） |
| xAI (Grok) | `xai`（别名 `grok`） | `XAI_API_KEY`（可选：`XAI_BASE_URL`） |
| xAI Grok OAuth (SuperGrok) | `xai-oauth`（别名 `grok-oauth`） | `hermes model` → xAI Grok OAuth（浏览器登录；SuperGrok 订阅） |
| AWS Bedrock | `bedrock` | 标准 boto3 认证（`AWS_REGION` + `AWS_PROFILE` 或 `AWS_ACCESS_KEY_ID`） |
| Qwen Portal (OAuth) | `qwen-oauth` | `hermes model`（Qwen Portal OAuth；可选：`HERMES_QWEN_BASE_URL`） |
| MiniMax (OAuth) | `minimax-oauth` | `hermes model`（MiniMax 门户 OAuth） |
| OpenCode Zen | `opencode-zen` | `OPENCODE_ZEN_API_KEY` |
| OpenCode Go | `opencode-go` | `OPENCODE_GO_API_KEY` |
| Kilo Code | `kilocode` | `KILOCODE_API_KEY` |
| Xiaomi MiMo | `xiaomi` | `XIAOMI_API_KEY` |
| Arcee AI | `arcee` | `ARCEEAI_API_KEY` |
| GMI Cloud | `gmi` | `GMI_API_KEY` |
| Alibaba / DashScope | `alibaba` | `DASHSCOPE_API_KEY` |
| Alibaba Coding Plan | `alibaba-coding-plan` | `ALIBABA_CODING_PLAN_API_KEY`（回退到 `DASHSCOPE_API_KEY`） |
| Kimi / Moonshot (中国) | `kimi-coding-cn` | `KIMI_CN_API_KEY` |
| StepFun | `stepfun` | `STEPFUN_API_KEY` |
| Tencent TokenHub | `tencent-tokenhub` | `TOKENHUB_API_KEY` |
| Microsoft Foundry | `azure-foundry` | `AZURE_FOUNDRY_API_KEY` + `AZURE_FOUNDRY_BASE_URL` |
| LM Studio (本地) | `lmstudio` | `LM_API_KEY`（本地可省略） + `LM_BASE_URL` |
| Hugging Face | `huggingface` | `HF_TOKEN` |
| 自定义端点 | `custom` | `base_url` + `key_env`（见下文） |

### 自定义端点回退

对于兼容OpenAI的自定义端点，需要添加 `base_url` 和可选的 `key_env`：

```yaml
fallback_model:
  provider: custom
  model: my-local-model
  base_url: http://localhost:8000/v1
  key_env: MY_LOCAL_KEY              # 包含API密钥的环境变量名
```

### 回退触发时机

当主模型因以下原因失败时，回退会自动激活：

- **速率限制** (HTTP 429) — 用尽重试尝试后
- **服务器错误** (HTTP 500, 502, 503) — 用尽重试尝试后
- **身份验证失败** (HTTP 401, 403) — 立即（重试没有意义）
- **未找到** (HTTP 404) — 立即
- **无效响应** — 当API反复返回格式错误或空响应时

触发后，Hermes会：

1.  为回退提供程序解析凭证
2.  构建新的API客户端
3.  就地替换模型、提供程序和客户端
4.  重置重试计数器并继续对话

切换是无缝的——您的对话历史、工具调用和上下文都会被保留。智能体会从上次中断的地方继续，只是使用了不同的模型。

:::info 按轮次，而非按会话
回退是**按轮次作用的**：每条新的用户消息都从恢复主模型开始。如果主模型在某一轮中失败，回退仅在该轮激活。在下一条消息中，Hermes会再次尝试主模型。在单个轮次内，回退最多激活一次——如果回退也失败，则接管正常的错误处理（重试，然后显示错误消息）。这可以防止单轮内的级联回退循环，同时让主模型在每一轮都有新的机会。
:::

### 示例

**OpenRouter 作为 Anthropic 原生模型的回退：**
```yaml
model:
  provider: anthropic
  default: claude-sonnet-4-6

fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

**Nous Portal 作为 OpenRouter 的回退：**
```yaml
model:
  provider: openrouter
  default: anthropic/claude-opus-4

fallback_model:
  provider: nous
  model: nous-hermes-3
```

**本地模型作为云模型的回退：**
```yaml
fallback_model:
  provider: custom
  model: llama-3.1-70b
  base_url: http://localhost:8000/v1
  key_env: LOCAL_API_KEY
```

**Codex OAuth 作为回退：**
```yaml
fallback_model:
  provider: openai-codex
  model: gpt-5.3-codex
```

### 回退生效的场景

| 场景 | 支持回退 |
|---------|-------------------|
| CLI 会话 | ✔ |
| 消息网关 (Telegram, Discord 等) | ✔ |
| 子智能体委派 | ✘（子智能体不继承回退配置） |
| 定时任务 | ✘（使用固定的提供程序运行） |
| 辅助任务 (视觉、压缩) | ✘（使用它们自己的提供程序链——见下文） |

:::tip
没有用于 `fallback_model` 的环境变量——它完全通过 `config.yaml` 配置。这是有意为之：回退配置是一个深思熟虑的选择，不应被过时的shell导出覆盖。
:::

---

## 辅助任务回退

Hermes 使用独立的轻量级模型处理辅助任务。每个任务都有自己的提供商解析链，构成内置的回退系统。

### 具有独立提供商解析的任务

| 任务 | 功能描述 | 配置键 |
|------|----------|--------|
| 视觉 | 图像分析、浏览器截图 | `auxiliary.vision` |
| 网页提取 | 网页内容摘要 | `auxiliary.web_extract` |
| 压缩 | 上下文压缩摘要 | `auxiliary.compression` |
| 技能中心 | 技能搜索与发现 | `auxiliary.skills_hub` |
| MCP | MCP 辅助操作 | `auxiliary.mcp` |
| 审批 | 智能命令审批分类 | `auxiliary.approval` |
| 标题生成 | 会话标题摘要 | `auxiliary.title_generation` |
| 分诊指定器 | `hermes kanban specify` / 仪表板 ✨ 按钮 — 将一行分诊任务充实为完整规格 | `auxiliary.triage_specifier` |

### 自动检测链

当任务的提供商设置为 `"auto"` (默认值) 时，Hermes 会按顺序尝试提供商，直到有一个成功：

**对于文本任务 (压缩、网页提取等):**

```text
OpenRouter → Nous Portal → 自定义端点 → Codex OAuth →
API 密钥提供商 (z.ai, Kimi, MiniMax, 小米 MiMo, Hugging Face, Anthropic) → 放弃
```

**对于视觉任务:**

```text
主要提供商 (若支持视觉) → OpenRouter → Nous Portal →
Codex OAuth → Anthropic → 自定义端点 → 放弃
```

如果解析到的提供商在调用时失败，Hermes 还有内部重试机制：如果提供商不是 OpenRouter 且未显式设置 `base_url`，则会尝试 OpenRouter 作为最终后备。

### 配置辅助提供商

每个任务都可以在 `config.yaml` 中独立配置：

```yaml
auxiliary:
  vision:
    provider: "auto"              # auto | openrouter | nous | codex | main | anthropic
    model: ""                     # 例如 "openai/gpt-4o"
    base_url: ""                  # 直接端点 (优先于 provider)
    api_key: ""                   # 用于 base_url 的 API 密钥

  web_extract:
    provider: "auto"
    model: ""

  compression:
    provider: "auto"
    model: ""

  skills_hub:
    provider: "auto"
    model: ""

  mcp:
    provider: "auto"
    model: ""
```

上述每个任务都遵循相同的 **provider / model / base_url** 模式。上下文压缩在 `auxiliary.compression` 下配置：

```yaml
auxiliary:
  compression:
    provider: main                                    # 与其他辅助任务相同的提供商选项
    model: google/gemini-3-flash-preview
    base_url: null                                    # 兼容 OpenAI 的自定义端点
```

而回退模型使用：

```yaml
fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
  # base_url: http://localhost:8000/v1               # 可选自定义端点
```

三者 — 辅助、压缩、回退 — 工作方式相同：设置 `provider` 选择由谁处理请求，`model` 选择具体模型，`base_url` 指向自定义端点（覆盖 provider）。

### 辅助任务的提供商选项

这些选项仅适用于 `auxiliary:`、`compression:` 和 `fallback_model:` 配置 — `"main"` 对于你顶层的 `model.provider` **不是**一个有效值。对于自定义端点，请在 `model:` 部分使用 `provider: custom`（参见 [AI 提供商](/integrations/providers)）。

| 提供商 | 描述 | 要求 |
|--------|------|------|
| `"auto"` | 按顺序尝试提供商直到有一个成功（默认） | 至少配置了一个提供商 |
| `"openrouter"` | 强制使用 OpenRouter | `OPENROUTER_API_KEY` |
| `"nous"` | 强制使用 Nous Portal | `hermes auth` |
| `"codex"` | 强制使用 Codex OAuth | `hermes model` → Codex |
| `"main"` | 使用主智能体正在使用的提供商（仅限辅助任务） | 已配置活动的主提供商 |
| `"anthropic"` | 强制使用 Anthropic 原生服务 | `ANTHROPIC_API_KEY` 或 Claude Code 凭据 |

### 直接端点覆盖

对于任何辅助任务，设置 `base_url` 会完全绕过提供商解析，直接将请求发送到该端点：

```yaml
auxiliary:
  vision:
    base_url: "http://localhost:1234/v1"
    api_key: "local-key"
    model: "qwen2.5-vl"
```

`base_url` 优先于 `provider`。Hermes 使用配置的 `api_key` 进行身份验证，如果未设置则回退到 `OPENAI_API_KEY`。它**不会**为自定义端点重用 `OPENROUTER_API_KEY`。

---

## 辅助容量错误回退

当您显式配置了辅助提供方（例如 `auxiliary.vision.provider: glm`），Hermes 会将其视为您的首选方案 — 但如果该提供方由于**容量错误**（HTTP 402 付款要求、HTTP 429 每日配额耗尽、连接失败）而无法实际处理请求时，Hermes 会通过一个分层链进行回退，而不是静默失败：

1.  **主要辅助提供方** — 您配置的那个（始终首先尝试）
2.  **`auxiliary.<task>.fallback_chain`** — 您为特定任务覆盖的列表（如果您配置了的话）
3.  **主智能体提供方 + 模型** — 最后的安全网（即使您没有配置链，也会尝试）
4.  **警告并重新抛出错误** — 如果所有层都失败，Hermes 会以警告级别记录 `Auxiliary <task>: ... all fallbacks exhausted`，并重新抛出原始错误

临时的 HTTP 429 速率限制（`Retry-After: ...`）被视为请求约束，而非容量问题 — 它们会尊重您的显式提供方选择，并**不会**触发回退阶梯。只有每日/每月配额耗尽、付款错误和连接失败才会绕过显式提供方的限制。

对于使用 `provider: auto`（未配置显式辅助提供方）的用户，现有的自动检测链将替代步骤 2–3 运行。它的第一步已经是主智能体模型，因此 `auto` 用户无需任何配置即可获得相同的结果。

### 可选：按任务配置回退链

如果您希望不同于“主智能体模型优先”的回退顺序，可以显式配置 `fallback_chain`。每个条目至少需要 `provider`；`model`、`base_url` 和 `api_key` 是可选的。

```yaml
auxiliary:
  vision:
    provider: glm
    model: glm-4v-flash
    fallback_chain:
      - provider: openrouter
        model: google/gemini-3-flash-preview
      - provider: nous
        model: anthropic/claude-sonnet-4

  compression:
    provider: openrouter
    fallback_chain:
      - provider: openai
        model: gpt-4o-mini
```

您**并不**需要配置 `fallback_chain` 才能获得回退功能 — 主智能体安全网无论是否配置都会运行。仅当您特别想要不同于默认顺序时，才需要使用它。

### 触发回退的提供方配额错误

Hermes 将以下错误识别为与 402 额度耗尽等效的容量问题（而非临时速率限制）：

-   Bedrock / LiteLLM：`Too many tokens per day`、`daily limit`、`tokens per day`
-   Vertex AI / GCP：`quota exceeded`、`resource exhausted`、`RESOURCE_EXHAUSTED`
-   通用：`daily quota`、`quota_exceeded`

如果您的提供方对每日配额耗尽返回了不同的短语，而 Hermes 未触发回退，那这是一个 bug — 请提交 issue 并附上确切的错误字符串。

---

## 上下文压缩回退

上下文压缩使用 `auxiliary.compression` 配置块来控制由哪个模型和提供方处理摘要生成：

```yaml
auxiliary:
  compression:
    provider: "auto"                              # auto | openrouter | nous | main
    model: "google/gemini-3-flash-preview"
```

:::info 旧版迁移
包含 `compression.summary_model` / `compression.summary_provider` / `compression.summary_base_url` 的旧版配置将在首次加载时自动迁移到 `auxiliary.compression.*`（配置版本 17）。
:::

如果没有可用的提供方进行压缩，Hermes 会直接丢弃中间的对话轮次而不生成摘要，而不是导致会话失败。

---

## 委托提供方覆盖

由 `delegate_task` 生成的子智能体**不会**使用主回退模型。但是，它们可以被路由到不同的 provider:model 组合以优化成本：

```yaml
delegation:
  provider: "openrouter"                      # 为所有子智能体覆盖提供方
  model: "google/gemini-3-flash-preview"      # 覆盖模型
  # base_url: "http://localhost:1234/v1"      # 或使用直接端点
  # api_key: "local-key"
```

有关完整的配置详情，请参阅[子智能体委托](/user-guide/features/delegation)。

---

## 定时任务提供方

定时任务在执行时使用配置好的提供方。它们不支持回退模型。要为定时任务使用不同的提供方，可以在任务本身上配置 `provider` 和 `model` 覆盖：

```python
cronjob(
    action="create",
    schedule="every 2h",
    prompt="Check server status",
    provider="openrouter",
    model="google/gemini-3-flash-preview"
)
```

有关完整的配置详情，请参阅[计划任务（定时）](/user-guide/features/cron)。

---

## 摘要

| 功能 | 回退机制 | 配置位置 |
|------|----------|----------|
| 主智能体模型 | `config.yaml` 中的 `fallback_model` — 发生错误时每轮回退（每轮恢复主模型） | `fallback_model:`（顶层） |
| 辅助任务（任意）— auto 用户 | 完整的自动检测链（主智能体模型优先，然后是提供方链），在容量错误时 | `auxiliary.<task>.provider: auto` |
| 辅助任务（任意）— 显式提供方 | `fallback_chain`（如果设置了）→ 主智能体模型 → 警告并抛出错误，仅在容量错误时 | `auxiliary.<task>.fallback_chain` |
| 视觉 | 分层（见上文）+ 内部 OpenRouter 重试 | `auxiliary.vision` |
| 网页提取 | 分层（见上文）+ 内部 OpenRouter 重试 | `auxiliary.web_extract` |
| 上下文压缩 | 分层（见上文）；如果所有层都不可用，则降级为无摘要 | `auxiliary.compression` |
| 技能中心 | 分层（见上文） | `auxiliary.skills_hub` |
| MCP 助手 | 分层（见上文） | `auxiliary.mcp` |
| 审批分类 | 分层（见上文） | `auxiliary.approval` |
| 标题生成 | 分层（见上文） | `auxiliary.title_generation` |
| 分诊指定器 | 分层（见上文） | `auxiliary.triage_specifier` |
| 委托 | 仅提供方覆盖（无自动回退） | `delegation.provider` / `delegation.model` |
| 定时任务 | 仅按任务提供方覆盖（无自动回退） | 任务的 `provider` / `model` |