---
title: 故障转移提供商
description: 配置自动故障转移到备用LLM提供商，当您的主模型不可用时。
sidebar_label: 故障转移提供商
sidebar_position: 8
---

# 故障转移提供商

Hermes智能体具有三层弹性机制，确保当提供商遇到问题时，您的会话仍能继续运行：

1.  **[凭据池](./credential-pools.md)** — 在同一提供商的多个API密钥之间轮换（首先尝试）
2.  **主模型故障转移** — 当您的主模型失败时，自动切换到一个*不同的*提供商：模型
3.  **辅助任务故障转移** — 为视觉、压缩和网页提取等辅助任务独立解析提供商

凭据池处理同一提供商内的轮换（例如，多个OpenRouter密钥）。本页涵盖跨提供商的故障转移。两者都是可选的，并且可以独立工作。

## 主模型故障转移

当您的主要LLM提供商遇到错误——速率限制、服务器过载、身份验证失败、连接中断——Hermes可以在会话中途自动切换到备用提供商：模型对，而不会丢失您的对话。

### 配置

最简单的方式是使用交互式管理器：

```bash
hermes fallback
```

`hermes fallback` 复用了 `hermes model` 中的提供商选择器——相同的提供商列表、相同的凭据提示、相同的验证。使用子命令 `add`、`list`（别名 `ls`）、`remove`（别名 `rm`）和 `clear` 来管理故障转移链。更改会持久化保存在 `config.yaml` 文件顶层的 `fallback_providers:` 列表下。

如果您更愿意直接编辑YAML，请在 `~/.hermes/config.yaml` 中添加一个 `fallback_model` 部分：

```yaml
fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

`provider` 和 `model` 两者都是**必需的**。如果缺少其中任何一个，故障转移将被禁用。

:::note `fallback_model` 与 `fallback_providers`
`fallback_model`（单数）是旧版的单一故障转移键——Hermes仍为其提供向后兼容支持。`fallback_providers`（复数，列表）支持按顺序尝试多个故障转移；`hermes fallback` 会写入此键。当两者都设置时，Hermes会合并它们，且 `fallback_providers` 优先级更高。
:::

### 支持的提供商

| 提供商 | 值 | 要求 |
|----------|-------|-------------|
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY` |
| Nous Portal | `nous` | `hermes setup --portal`（全新）或 `hermes auth add nous`（OAuth） |
| OpenAI Codex | `openai-codex` | `hermes model`（ChatGPT OAuth） |
| GitHub Copilot | `copilot` | `COPILOT_GITHUB_TOKEN`、`GH_TOKEN` 或 `GITHUB_TOKEN` |
| GitHub Copilot ACP | `copilot-acp` | 外部进程（编辑器集成） |
| Anthropic | `anthropic` | `ANTHROPIC_API_KEY` 或 Claude Code 凭据 |
| z.ai / GLM | `zai` | `GLM_API_KEY` |
| Kimi / Moonshot | `kimi-coding` | `KIMI_API_KEY` |
| MiniMax | `minimax` | `MINIMAX_API_KEY` |
| MiniMax（中国区） | `minimax-cn` | `MINIMAX_CN_API_KEY` |
| DeepSeek | `deepseek` | `DEEPSEEK_API_KEY` |
| NVIDIA NIM | `nvidia` | `NVIDIA_API_KEY`（可选：`NVIDIA_BASE_URL`） |
| GMI Cloud | `gmi` | `GMI_API_KEY`（可选：`GMI_BASE_URL`） |
| StepFun | `stepfun` | `STEPFUN_API_KEY`（可选：`STEPFUN_BASE_URL`） |
| Ollama Cloud | `ollama-cloud` | `OLLAMA_API_KEY` |
| Google Gemini（OAuth） | `google-gemini-cli` | `hermes model`（Google OAuth；可选：`HERMES_GEMINI_PROJECT_ID`） |
| Google AI Studio | `gemini` | `GOOGLE_API_KEY`（别名：`GEMINI_API_KEY`） |
| xAI (Grok) | `xai`（别名 `grok`） | `XAI_API_KEY`（可选：`XAI_BASE_URL`） |
| xAI Grok OAuth (SuperGrok) | `xai-oauth`（别名 `grok-oauth`） | `hermes model` → xAI Grok OAuth（浏览器登录；需SuperGrok订阅） |
| AWS Bedrock | `bedrock` | 标准的boto3身份验证（`AWS_REGION` + `AWS_PROFILE` 或 `AWS_ACCESS_KEY_ID`） |
| Qwen Portal (OAuth) | `qwen-oauth` | `hermes model`（Qwen Portal OAuth；可选：`HERMES_QWEN_BASE_URL`） |
| MiniMax (OAuth) | `minimax-oauth` | `hermes model`（MiniMax门户OAuth） |
| OpenCode Zen | `opencode-zen` | `OPENCODE_ZEN_API_KEY` |
| OpenCode Go | `opencode-go` | `OPENCODE_GO_API_KEY` |
| Kilo Code | `kilocode` | `KILOCODE_API_KEY` |
| Xiaomi MiMo | `xiaomi` | `XIAOMI_API_KEY` |
| Arcee AI | `arcee` | `ARCEEAI_API_KEY` |
| GMI Cloud | `gmi` | `GMI_API_KEY` |
| Alibaba / DashScope | `alibaba` | `DASHSCOPE_API_KEY` |
| Alibaba Coding Plan | `alibaba-coding-plan` | `ALIBABA_CODING_PLAN_API_KEY`（回退到 `DASHSCOPE_API_KEY`） |
| Kimi / Moonshot（中国区） | `kimi-coding-cn` | `KIMI_CN_API_KEY` |
| StepFun | `stepfun` | `STEPFUN_API_KEY` |
| Tencent TokenHub | `tencent-tokenhub` | `TOKENHUB_API_KEY` |
| Microsoft Foundry | `azure-foundry` | `AZURE_FOUNDRY_API_KEY` + `AZURE_FOUNDRY_BASE_URL` |
| LM Studio（本地） | `lmstudio` | `LM_API_KEY`（本地可无） + `LM_BASE_URL` |
| Hugging Face | `huggingface` | `HF_TOKEN` |
| 自定义端点 | `custom` | `base_url` + `key_env`（见下文） |

### 自定义端点故障转移

对于自定义的OpenAI兼容端点，请添加 `base_url` 和可选的 `key_env`：

```yaml
fallback_model:
  provider: custom
  model: my-local-model
  base_url: http://localhost:8000/v1
  key_env: MY_LOCAL_KEY              # 包含API密钥的环境变量名
```

### 故障转移触发时机

当主模型出现以下失败时，故障转移会自动激活：

- **速率限制**（HTTP 429） — 在耗尽重试尝试后
- **服务器错误**（HTTP 500、502、503） — 在耗尽重试尝试后
- **身份验证失败**（HTTP 401、403） — 立即触发（重试无意义）
- **未找到**（HTTP 404） — 立即触发
- **无效响应** — 当API反复返回格式错误或空响应时

触发后，Hermes会：

1.  为备用提供商解析凭据
2.  构建新的API客户端
3.  就地替换模型、提供商和客户端
4.  重置重试计数器并继续对话

切换是无缝的——您的对话历史、工具调用和上下文都会保留。智能体会从上次中断的地方继续，只是使用了不同的模型。

:::info 逐轮而非逐会话
故障转移是**按轮次作用的**：每条新的用户消息都从恢复主模型开始。如果主模型在轮次中间失败，故障转移仅在该轮次内激活。在下一条消息时，Hermes会再次尝试主模型。在单个轮次内，故障转移最多激活一次——如果备用也失败，则进入正常的错误处理流程（重试，然后显示错误消息）。这可以防止在一个轮次内发生级联故障转移循环，同时让主模型在每个轮次都有全新的机会。
:::

### 示例

**OpenRouter 作为 Anthropic 原生提供商的故障转移：**
```yaml
model:
  provider: anthropic
  default: claude-sonnet-4-6

fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

**Nous Portal 作为 OpenRouter 的故障转移：**
```yaml
model:
  provider: openrouter
  default: anthropic/claude-opus-4

fallback_model:
  provider: nous
  model: nous-hermes-3
```

**本地模型作为云端的故障转移：**
```yaml
fallback_model:
  provider: custom
  model: llama-3.1-70b
  base_url: http://localhost:8000/v1
  key_env: LOCAL_API_KEY
```

**Codex OAuth 作为故障转移：**
```yaml
fallback_model:
  provider: openai-codex
  model: gpt-5.3-codex
```

### 故障转移适用场景

| 场景 | 是否支持故障转移 |
|---------|-------------------|
| CLI 会话 | ✔ |
| 消息网关（Telegram、Discord等） | ✔ |
| 子智能体委派 | ✘（子智能体不继承故障转移配置） |
| 定时任务 | ✘（使用固定的提供商运行） |
| 辅助任务（视觉、压缩） | ✘（使用它们自己的提供商链——见下文） |

:::tip
`fallback_model` 没有对应的环境变量——它完全通过 `config.yaml` 配置。这是有意为之：故障转移配置是一个审慎的选择，不应被过时的shell导出变量所覆盖。
:::

---

## 辅助任务备用方案

Hermes 为辅助任务使用独立的轻量级模型。每个任务都有自己专属的提供者解析链，这充当了内置的备用系统。

### 具备独立提供者解析的任务

| 任务         | 功能说明                                      | 配置键                     |
|--------------|-----------------------------------------------|----------------------------|
| 视觉         | 图像分析、浏览器截图                          | `auxiliary.vision`         |
| 网页提取     | 网页摘要                                      | `auxiliary.web_extract`    |
| 上下文压缩   | 上下文压缩摘要                                | `auxiliary.compression`    |
| 技能中心     | 技能搜索与发现                                | `auxiliary.skills_hub`     |
| MCP          | MCP 辅助操作                                  | `auxiliary.mcp`            |
| 审批         | 智能命令审批分类                              | `auxiliary.approval`       |
| 标题生成     | 会话标题摘要                                  | `auxiliary.title_generation`|
| 分流指定器   | `hermes kanban specify` / 仪表板 ✨ 按钮 — 将一句话的分流任务细化为完整规格 | `auxiliary.triage_specifier`|

### 自动检测链

当任务的提供者设置为 `"auto"`（默认）时，Hermes 会按顺序尝试提供者，直到成功：

**对于文本任务（压缩、网页提取等）：**

```text
OpenRouter → Nous Portal → 自定义端点 → Codex OAuth →
API 密钥提供者 (z.ai, Kimi, MiniMax, Xiaomi MiMo, Hugging Face, Anthropic) → 放弃
```

**对于视觉任务：**

```text
主提供者（若具备视觉能力） → OpenRouter → Nous Portal →
Codex OAuth → Anthropic → 自定义端点 → 放弃
```

如果解析出的提供者在调用时失败，Hermes 也有内部重试机制：如果提供者不是 OpenRouter 且未显式设置 `base_url`，它将尝试 OpenRouter 作为最后的备用方案。

### 配置辅助提供者

每个任务可以在 `config.yaml` 中独立配置：

```yaml
auxiliary:
  vision:
    provider: "auto"              # auto | openrouter | nous | codex | main | anthropic
    model: ""                     # 例如 "openai/gpt-4o"
    base_url: ""                  # 直接端点（优先于提供者）
    api_key: ""                   # base_url 的 API 密钥

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

以上每个任务都遵循相同的 **provider / model / base_url** 模式。上下文压缩在 `auxiliary.compression` 下配置：

```yaml
auxiliary:
  compression:
    provider: main                                    # 与其他辅助任务相同的提供者选项
    model: google/gemini-3-flash-preview
    base_url: null                                    # 自定义 OpenAI 兼容端点
```

而备用模型使用：

```yaml
fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
  # base_url: http://localhost:8000/v1               # 可选自定义端点
```

以上三者 — 辅助任务、压缩、备用 — 工作方式相同：设置 `provider` 来选择谁处理请求，`model` 来选择哪个模型，`base_url` 来指向自定义端点（覆盖提供者）。

### 辅助任务的提供者选项

这些选项仅适用于 `auxiliary:`、`compression:` 和 `fallback_model:` 配置 — `"main"` 对于顶级 `model.provider` **不是**有效值。对于自定义端点，请在 `model:` 部分使用 `provider: custom`（参见 [AI 提供者](/integrations/providers)）。

| 提供者       | 描述                                                         | 要求                               |
|--------------|--------------------------------------------------------------|------------------------------------|
| `"auto"`     | 按顺序尝试提供者直到成功（默认）                             | 至少配置一个提供者                 |
| `"openrouter"` | 强制使用 OpenRouter                                        | `OPENROUTER_API_KEY`               |
| `"nous"`     | 强制使用 Nous Portal                                         | `hermes auth`                      |
| `"codex"`    | 强制使用 Codex OAuth                                         | `hermes model` → Codex            |
| `"main"`     | 使用主智能体使用的任何提供者（仅限辅助任务）                 | 配置了活动的主提供者               |
| `"anthropic"` | 强制使用 Anthropic 原生接口                                 | `ANTHROPIC_API_KEY` 或 Claude Code 凭据 |

### 直接端点覆盖

对于任何辅助任务，设置 `base_url` 会完全绕过提供者解析，直接向该端点发送请求：

```yaml
auxiliary:
  vision:
    base_url: "http://localhost:1234/v1"
    api_key: "local-key"
    model: "qwen2.5-vl"
```

`base_url` 优先于 `provider`。Hermes 使用配置的 `api_key` 进行身份验证，如果未设置则回退到 `OPENAI_API_KEY`。它**不会**为自定义端点重用 `OPENROUTER_API_KEY`。

## 辅助容量错误回退

当您设置了明确的辅助提供商（例如 `auxiliary.vision.provider: glm`）时，Hermes 会将其视为您的首选项——但如果该提供商由于**容量错误**（HTTP 402 付款要求、HTTP 429 日配额耗尽、连接失败）而无法处理请求，Hermes 会通过一个分层回退链进行回退，而不是静默失败：

1.  **主要辅助提供商**——您配置的那个（首先尝试，始终如此）
2.  **`auxiliary.<task>.fallback_chain`**——您的按任务覆盖列表（如果您配置了）
3.  **主智能体提供商 + 模型**——最后的安全网（即使您未配置回退链，也会始终尝试）
4.  **警告 + 重新抛出错误**——如果所有层都失败，Hermes 会在 WARNING 级别记录 `Auxiliary <task>: ... all fallbacks exhausted` 并重新抛出原始错误。

临时性的 HTTP 429 速率限制（`Retry-After: ...`）被视为请求限制，而非容量问题——它们遵循您的明确提供商选择，并且**不会**触发回退阶梯。只有日/月配额耗尽、付款错误和连接失败才会绕过明确提供商的关卡。

对于使用 `provider: auto`（无明确辅助提供商）的用户，现有的自动检测链将替代步骤 2-3 运行。其第一步已经是主智能体模型，因此 `auto` 用户无需配置即可获得相同的结果。

### 可选：按任务回退链

如果您希望回退顺序与"主智能体模型优先"不同，可以显式配置 `fallback_chain`。每个条目至少需要 `provider`；`model`、`base_url` 和 `api_key` 是可选的。

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

您**无需**配置 `fallback_chain` 即可获得回退功能——主智能体安全网无论如何都会运行。仅当您特别想要与默认不同的回退顺序时才使用它。

### 触发回退的提供商配额错误

Hermes 将以下情况识别为与 402 信用额度耗尽等效的容量问题（而非临时速率限制）：

-   Bedrock / LiteLLM: `Too many tokens per day`, `daily limit`, `tokens per day`
-   Vertex AI / GCP: `quota exceeded`, `resource exhausted`, `RESOURCE_EXHAUSTED`
-   通用: `daily quota`, `quota_exceeded`

如果您的提供商为日配额耗尽返回了不同的短语，而 Hermes 未触发回退，那是一个错误——请提交问题并附上确切的错误字符串。

---

## 上下文压缩回退

上下文压缩使用 `auxiliary.compression` 配置块来控制哪个模型和提供商负责处理摘要：

```yaml
auxiliary:
  compression:
    provider: "auto"                              # auto | openrouter | nous | main
    model: "google/gemini-3-flash-preview"
```

:::info 旧版迁移
旧配置中的 `compression.summary_model` / `compression.summary_provider` / `compression.summary_base_url` 会在首次加载时自动迁移到 `auxiliary.compression.*`（配置版本 17）。
:::

如果压缩没有可用的提供商，Hermes 会直接丢弃中间对话轮次而不生成摘要，而不是使会话失败。

---

## 委托提供商覆盖

由 `delegate_task` 生成的子智能体**不会**使用主回退模型。但是，为了优化成本，它们可以被路由到不同的提供商:模型对：

```yaml
delegation:
  provider: "openrouter"                      # 为所有子智能体覆盖提供商
  model: "google/gemini-3-flash-preview"      # 覆盖模型
  # base_url: "http://localhost:1234/v1"      # 或使用直接端点
  # api_key: "local-key"
```

完整配置详情请参阅[子智能体委托](/user-guide/features/delegation)。

---

## 定时任务提供商

定时任务使用执行时配置的任何提供商运行。它们不支持回退模型。要为定时任务使用不同的提供商，请在定时任务本身上配置 `provider` 和 `model` 覆盖：

```python
cronjob(
    action="create",
    schedule="every 2h",
    prompt="Check server status",
    provider="openrouter",
    model="google/gemini-3-flash-preview"
)
```

完整配置详情请参阅[计划任务（定时任务）](/user-guide/features/cron)。

---

## 总结

| 功能 | 回退机制 | 配置位置 |
|------|----------|----------|
| 主智能体模型 | `config.yaml` 中的 `fallback_model` — 每轮出错时回退（每轮恢复主模型） | `fallback_model:`（顶层） |
| 辅助任务（任意）— auto 用户 | 完整的自动检测链（主智能体模型优先，然后是提供商链）在容量错误时触发 | `auxiliary.<task>.provider: auto` |
| 辅助任务（任意）— 明确提供商 | `fallback_chain`（如果设置）→ 主智能体模型 → 警告并抛出错误，仅在容量错误时触发 | `auxiliary.<task>.fallback_chain` |
| 视觉 | 分层（见上文）+ 内部 OpenRouter 重试 | `auxiliary.vision` |
| 网页提取 | 分层（见上文）+ 内部 OpenRouter 重试 | `auxiliary.web_extract` |
| 上下文压缩 | 分层（见上文）；如果所有层都不可用，则降级为无摘要 | `auxiliary.compression` |
| 技能中心 | 分层（见上文） | `auxiliary.skills_hub` |
| MCP 助手 | 分层（见上文） | `auxiliary.mcp` |
| 审批分类 | 分层（见上文） | `auxiliary.approval` |
| 标题生成 | 分层（见上文） | `auxiliary.title_generation` |
| 分诊指定器 | 分层（见上文） | `auxiliary.triage_specifier` |
| 委托 | 仅提供商覆盖（无自动回退） | `delegation.provider` / `delegation.model` |
| 定时任务 | 仅按任务提供商覆盖（无自动回退） | 每个任务的 `provider` / `model` |