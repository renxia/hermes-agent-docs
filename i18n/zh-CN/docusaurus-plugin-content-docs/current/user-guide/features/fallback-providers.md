---
title: Fallback Providers
description: Configure automatic failover to backup LLM providers when your primary model is unavailable.
sidebar_label: Fallback Providers
sidebar_position: 8
---

# Fallback Providers

Hermes 智能体具备三层弹性机制，当提供商出现问题时可保持会话运行：

1. **[凭证池](./credential-pools.md)** — 在*同一*提供商的多个 API 密钥之间轮换（优先尝试）
2. **主模型回退** — 当主模型失败时，自动切换到*不同的*提供商:模型
3. **辅助任务回退** — 为视觉、压缩和网页提取等侧任务提供独立的提供商解析

凭证池处理同一提供商内的轮换（例如，多个 OpenRouter 密钥）。本页涵盖跨提供商的回退。两者都是可选的，且独立工作。

## 主模型回退

当主 LLM 提供商遇到错误 — 速率限制、服务器过载、认证失败、连接断开 — Hermes 可以在会话中自动切换到备用的提供商:模型，而不会丢失对话。

### 配置

最简单的方式是使用交互式管理器：

```bash
hermes fallback
```

`hermes fallback` 复用 `hermes model` 中的提供商选择器 — 相同的提供商列表、相同的凭证提示、相同的验证。使用子命令 `add`、`list`（别名 `ls`）、`remove`（别名 `rm`）和 `clear` 来管理链。更改会持久保存在 `config.yaml` 中的顶层 `fallback_providers:` 列表下。

如果您更倾向于直接编辑 YAML，可在 `~/.hermes/config.yaml` 中添加顶层 `fallback_providers` 列表：

```yaml
fallback_providers:
  - provider: openrouter
    model: anthropic/claude-sonnet-4
```

每个条目都需要 `provider` 和 `model`。缺少任一字段的条目将被忽略。

:::note `fallback_model` vs `fallback_providers`
`fallback_providers`（复数，列表）是当前配置形态，支持按顺序尝试的多个回退。`fallback_model`（单数）是旧版的单回退键 — Hermes 仍兼容支持，但 `hermes fallback` 会写入当前的 `fallback_providers` 键并在写入时迁移旧版配置。当两者同时设置时，`fallback_providers` 优先。
:::

### 支持的提供商

| 提供商 | 值 | 要求 |
|----------|-------|-------------|
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY` |
| Nous Portal | `nous` | `hermes setup --portal`（全新）或 `hermes auth add nous`（OAuth） |
| OpenAI Codex | `openai-codex` | `hermes model`（ChatGPT OAuth） |
| GitHub Copilot | `copilot` | `COPILOT_GITHUB_TOKEN`、`GH_TOKEN` 或 `GITHUB_TOKEN` |
| GitHub Copilot ACP | `copilot-acp` | 外部进程（编辑器集成） |
| Anthropic | `anthropic` | `ANTHROPIC_API_KEY` 或 Claude Code 凭证 |
| z.ai / GLM | `zai` | `GLM_API_KEY` |
| Kimi / Moonshot | `kimi-coding` | `KIMI_API_KEY` |
| MiniMax | `minimax` | `MINIMAX_API_KEY` |
| MiniMax（中国） | `minimax-cn` | `MINIMAX_CN_API_KEY` |
| DeepSeek | `deepseek` | `DEEPSEEK_API_KEY` |
| NVIDIA NIM | `nvidia` | `NVIDIA_API_KEY`（可选：`NVIDIA_BASE_URL`） |
| GMI Cloud | `gmi` | `GMI_API_KEY`（可选：`GMI_BASE_URL`） |
| StepFun | `stepfun` | `STEPFUN_API_KEY`（可选：`STEPFUN_BASE_URL`） |
| Ollama Cloud | `ollama-cloud` | `OLLAMA_API_KEY` |
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
| Kimi / Moonshot（中国） | `kimi-coding-cn` | `KIMI_CN_API_KEY` |
| StepFun | `stepfun` | `STEPFUN_API_KEY` |
| Tencent TokenHub | `tencent-tokenhub` | `TOKENHUB_API_KEY` |
| Microsoft Foundry | `azure-foundry` | `AZURE_FOUNDRY_API_KEY` + `AZURE_FOUNDRY_BASE_URL` |
| LM Studio（本地） | `lmstudio` | `LM_API_KEY`（本地可无）+ `LM_BASE_URL` |
| Hugging Face | `huggingface` | `HF_TOKEN` |
| 自定义端点 | `custom` | `base_url` + `key_env`（见下文） |

### 自定义端点回退

对于自定义的 OpenAI 兼容端点，添加 `base_url` 以及可选的 `key_env`：

```yaml
fallback_providers:
  - provider: custom
    model: my-local-model
    base_url: http://localhost:8000/v1
    key_env: MY_LOCAL_KEY            # 包含 API 密钥的环境变量名称
```

### 回退触发时机

当主模型出现以下情况时，回退自动激活：

- **速率限制**（HTTP 429）— 重试尝试耗尽后
- **服务器错误**（HTTP 500、502、503）— 重试尝试耗尽后
- **认证失败**（HTTP 401、403）— 立即触发（无需重试）
- **未找到**（HTTP 404）— 立即触发
- **无效响应** — 当 API 反复返回格式错误或空响应时

触发时，Hermes：

1. 解析回退提供商的凭证
2. 构建新的 API 客户端
3. 就地替换模型、提供商和客户端
4. 重置重试计数器并继续对话

切换是无缝的 — 您的对话历史、工具调用和上下文都会被保留。智能体从上次中断的地方继续使用不同的模型。

:::info 按轮次生效，而非按会话
回退是**轮次范围**的：每条新用户消息都以恢复的主模型开始。如果主模型在轮次中途失败，回退仅对该轮次生效。在下一条消息时，Hermes 会再次尝试主模型。在单个轮次内，回退最多激活一次 — 如果回退也失败，则由正常错误处理接管（重试，然后显示错误消息）。这可以防止在轮次内出现级联回退循环，同时给主模型每个轮次一次新的机会。
:::

### 示例

**使用 OpenRouter 作为 Anthropic 原生的回退：**
```yaml
model:
  provider: anthropic
  default: claude-sonnet-4-6

fallback_providers:
  - provider: openrouter
    model: anthropic/claude-sonnet-4
```

**使用 Nous Portal 作为 OpenRouter 的回退：**
```yaml
model:
  provider: openrouter
  default: anthropic/claude-opus-4

fallback_providers:
  - provider: nous
    model: nous-hermes-3
```

**使用本地模型作为云服务的回退：**
```yaml
fallback_providers:
  - provider: custom
    model: llama-3.1-70b
    base_url: http://localhost:8000/v1
    key_env: LOCAL_API_KEY
```

**使用 Codex OAuth 作为回退：**
```yaml
fallback_providers:
  - provider: openai-codex
    model: gpt-5.3-codex
```

### 回退生效位置

| 上下文 | 支持回退 |
|---------|-------------------|
| CLI 会话 | ✔ |
| 消息网关（Telegram、Discord 等） | ✔ |
| 子智能体委派 | ✔（子智能体继承父级回退链） |
| Cron 任务 | ✔（cron 智能体继承已配置的回退提供商） |
| `provider: auto` 上的辅助任务 | ✔（先尝试按任务回退，再尝试主回退链，最后才是内置辅助发现） |

:::tip
主回退链没有环境变量配置方式 — 仅通过 `config.yaml` 或 `hermes fallback` 进行配置。这是有意为之的：回退配置是一个刻意的选择，不应被过时的 shell 导出所覆盖。

---

## 辅助任务回退机制

Hermes 为辅助任务使用独立的轻量模型。每个任务都有自己的提供方解析链，作为内置回退系统运行。

### 具有独立提供方解析的任务

| 任务 | 功能 | 配置键 |
|------|------|--------|
| 视觉 | 图像分析、浏览器截图 | `auxiliary.vision` |
| 网页提取 | 网页摘要 | `auxiliary.web_extract` |
| 压缩 | 上下文压缩摘要 | `auxiliary.compression` |
| 技能中心 | 技能搜索与发现 | `auxiliary.skills_hub` |
| MCP | MCP 辅助操作 | `auxiliary.mcp` |
| 审批 | 智能命令审批分类 | `auxiliary.approval` |
| 标题生成 | 会话标题摘要 | `auxiliary.title_generation` |
| 分拣细化器 | `hermes kanban specify` / 仪表盘 ✨ 按钮 — 将一行分拣任务细化为完整规格 | `auxiliary.triage_specifier` |

### 自动检测链

当任务的提供方设置为 `"auto"`（默认值）时，Hermes 首先尝试该辅助任务的主提供方 + 主模型。如果该路线不可用，或稍后因容量类错误而失败，Hermes 会在使用内置发现链之前，优先遵循用户配置的回退策略：

```text
主提供方 + 主模型 → auxiliary.<task>.fallback_chain →
fallback_providers / fallback_model → 内置辅助发现链
```

当存在任务特定链时，它是最精确的，且优先级最高。顶层 `fallback_providers` 链与主智能体使用的策略相同，因此仅免费或同提供方回退规则同样适用于 `auto` 模式下的辅助任务。

**内置文本发现链（压缩、网页提取、标题生成等）：**

```text
OpenRouter → Nous Portal → 自定义端点 → Codex OAuth →
API 密钥提供方（z.ai、Kimi、MiniMax、小米 MiMo、Hugging Face、Anthropic）→ 放弃
```

**内置视觉发现链：**

```text
主提供方（若支持视觉）→ OpenRouter → Nous Portal →
Codex OAuth → Anthropic → 自定义端点 → 放弃
```

这些内置链是为未声明任务特定或主回退策略的用户提供的便捷回退方案。

### 配置辅助提供方

每个任务可以在 `config.yaml` 中独立配置：

```yaml
auxiliary:
  vision:
    provider: "auto"              # auto | openrouter | nous | codex | main | anthropic
    model: ""                     # 例如 "openai/gpt-4o"
    base_url: ""                  # 直接端点（优先级高于 provider）
    api_key: ""                   # base_url 的 API 密钥

  web_extract:
    provider: "auto"
    model: ""

  compression:
    provider: "auto"
    model: ""
    fallback_chain:              # 可选，任务特定的回退策略
      - provider: openrouter
        model: inclusionai/ring-2.6-1t:free

  skills_hub:
    provider: "auto"
    model: ""

  mcp:
    provider: "auto"
    model: ""
```

上述每个任务都遵循相同的 **provider / model / base_url** 模式。每个任务也可以声明自己的 `fallback_chain`；如果省略，`provider: auto` 将在 Hermes 内置辅助发现链之前使用顶层 `fallback_providers` 链。

上下文压缩配置在 `auxiliary.compression` 下：

```yaml
auxiliary:
  compression:
    provider: main                                    # 与其他辅助任务相同的提供方选项
    model: google/gemini-3-flash-preview
    base_url: null                                    # 自定义 OpenAI 兼容端点
```

主回退链使用：

```yaml
fallback_providers:
  - provider: openrouter
    model: anthropic/claude-sonnet-4
    # base_url: http://localhost:8000/v1             # 可选自定义端点
```

以上三者——辅助任务、压缩、回退——工作方式相同：设置 `provider` 选择谁处理请求，设置 `model` 选择哪个模型，设置 `base_url` 指向自定义端点（覆盖 provider）。

### 辅助任务的提供方选项

这些选项仅适用于 `auxiliary:`、`compression:` 和 `fallback_providers:` 条目——`"main"` **不是**顶层 `model.provider` 的有效值。对于自定义端点，请在 `model:` 部分使用 `provider: custom`（参见 [AI 提供方](/integrations/providers)）。

| 提供方 | 说明 | 要求 |
|--------|------|------|
| `"auto"` | 按顺序尝试提供方直到有一个可用（默认） | 至少配置一个提供方 |
| `"openrouter"` | 强制使用 OpenRouter | `OPENROUTER_API_KEY` |
| `"nous"` | 强制使用 Nous Portal | `hermes auth` |
| `"codex"` | 强制使用 Codex OAuth | `hermes model` → Codex |
| `"main"` | 使用主智能体使用的提供方（仅辅助任务） | 已配置活跃的主提供方 |
| `"anthropic"` | 强制使用 Anthropic 原生接口 | `ANTHROPIC_API_KEY` 或 Claude Code 凭证 |

### 直接端点覆盖

对于任何辅助任务，设置 `base_url` 将完全绕过提供方解析，直接将请求发送到该端点：

```yaml
auxiliary:
  vision:
    base_url: "http://localhost:1234/v1"
    api_key: "local-key"
    model: "qwen2.5-vl"
```

`base_url` 优先级高于 `provider`。Hermes 使用配置的 `api_key` 进行身份验证，若未设置则回退到 `OPENAI_API_KEY`。它**不会**为自定义端点复用 `OPENROUTER_API_KEY`。

---
## 辅助任务容量错误回退

当你设置了明确的辅助提供方（例如 `auxiliary.vision.provider: glm`）时，Hermes 将其视为你的首选——但如果该提供方因**容量错误**（HTTP 429 日配额耗尽、HTTP 429 日配额用尽、连接失败）确实无法处理请求，Hermes 将通过分层链进行回退，而不是静默失败：

1. **主辅助提供方**——你配置的那个（首先尝试，始终如此）
2. **`auxiliary.<task>.fallback_chain`**——你的每任务覆盖列表（如果你写了的话）
3. **主智能体提供方 + 模型**——最后的安全网（始终尝试，即使你没有写链）
4. **警告 + 重新抛出**——如果每一层都失败，Hermes 以 WARNING 级别记录 `Auxiliary <task>: ... all fallbacks exhausted` 并重新抛出原始错误

瞬时 HTTP 429 速率限制（`Retry-After: ...`）被视为请求约束，而非容量问题——它们尊重你的明确提供方选择，**不会**触发回退阶梯。只有日/月配额耗尽、付款错误和连接失败才会绕过明确提供方门禁。

对于使用 `provider: auto`（无明确辅助提供方）的用户，现有的自动检测链代替步骤 2–3 运行。其第一步已经是主智能体模型，因此 `auto` 用户无需任何配置即可获得相同结果。

### 可选：每任务回退链

如果你想要不同于"主智能体模型优先"的回退顺序，请显式配置 `fallback_chain`。每个条目至少需要 `provider`；`model`、`base_url` 和 `api_key` 是可选的。

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

你**不需要**配置 `fallback_chain` 即可获得回退——主智能体安全网无论如何都会运行。仅当你明确希望使用不同于默认值的顺序时才使用它。

### 触发回退的提供方配额错误

Hermes 将以下内容识别为等同于 402 信用耗尽的容量错误（非瞬时速率限制）：

- Bedrock / LiteLLM：`Too many tokens per day`、`daily limit`、`tokens per day`
- Vertex AI / GCP：`quota exceeded`、`resource exhausted`、`RESOURCE_EXHAUSTED`
- 通用：`daily quota`、`quota_exceeded`

如果你的提供方返回了不同的日配额耗尽短语且 Hermes 未触发回退，这是一个 bug——请用确切的错误字符串提交 issue。

---

## 上下文压缩回退

上下文压缩使用 `auxiliary.compression` 配置块来控制哪个模型和处理方负责摘要：

```yaml
auxiliary:
  compression:
    provider: "auto"                              # auto | openrouter | nous | main
    model: "google/gemini-3-flash-preview"
```

:::info 旧版迁移
旧版配置中的 `compression.summary_model` / `compression.summary_provider` / `compression.summary_base_url` 在首次加载时自动迁移到 `auxiliary.compression.*`（配置版本 17）。
:::

如果没有可用的压缩提供方，Hermes 会丢弃中间的对话轮次而不生成摘要，而不是让会话失败。

---

## 委托提供方覆盖

由 `delegate_task` 生成的子智能体继承父智能体的主回退链。你仍然可以将子智能体路由到不同的主提供方:模型对以进行成本优化：

```yaml
delegation:
  provider: "openrouter"                      # 覆盖所有子智能体的提供方
  model: "google/gemini-3-flash-preview"      # 覆盖模型
  # base_url: "http://localhost:1234/v1"      # 或使用直接端点
  # api_key: "local-key"
```

完整配置详情参见[子智能体委托](/user-guide/features/delegation)。

---

## Cron 任务提供方

Cron 任务在创建智能体时继承你配置的 `fallback_providers` 链（或旧版的 `fallback_model`）。要为 cron 任务使用不同的主提供方，请在 cron 任务本身上配置 `provider` 和 `model` 覆盖：

```python
cronjob(
    action="create",
    schedule="every 2h",
    prompt="Check server status",
    provider="openrouter",
    model="google/gemini-3-flash-preview"
)
```

完整配置详情参见[计划任务（Cron）](/user-guide/features/cron)。

---

## 总结

| 功能 | 回退机制 | 配置位置 |
|------|---------|---------|
| 主智能体模型 | config.yaml 中的 `fallback_providers`——出错时按轮次回退（每轮恢复主提供方） | `fallback_providers:`（顶层列表） |
| 辅助任务（任意）——自动用户 | 完整自动检测链（主智能体模型优先，然后是提供方链），在容量错误时触发 | `auxiliary.<task>.provider: auto` |
| 辅助任务（任意）——明确提供方 | `fallback_chain`（若已设置）→ 主智能体模型 → 警告 + 抛出，仅在容量错误时 | `auxiliary.<task>.fallback_chain` |
| 视觉 | 分层（见上文）+ 内部 OpenRouter 重试 | `auxiliary.vision` |
| 网页提取 | 分层（见上文）+ 内部 OpenRouter 重试 | `auxiliary.web_extract` |
| 上下文压缩 | 分层（见上文）；若所有层不可用则降级为无摘要 | `auxiliary.compression` |
| 技能中心 | 分层（见上文） | `auxiliary.skills_hub` |
| MCP 辅助 | 分层（见上文） | `auxiliary.mcp` |
| 审批分类 | 分层（见上文） | `auxiliary.approval` |
| 标题生成 | 分层（见上文） | `auxiliary.title_generation` |
| 分拣细化器 | 分层（见上文） | `auxiliary.triage_specifier` |
| 委托 | 仅提供方覆盖（无自动回退） | `delegation.provider` / `delegation.model` |
| Cron 任务 | 仅每任务提供方覆盖（无自动回退） | 每任务的 `provider` / `model` |