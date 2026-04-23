---
title: 备用提供商
description: 当您的主模型不可用时，配置自动故障转移到备用 LLM 提供商。
sidebar_label: 备用提供商
sidebar_position: 8
---

# 备用提供商

Hermes 智能体具有三层弹性机制，可在提供商出现问题时保持您的会话正常运行：

1. **[凭据池](./credential-pools.md)** — 在*同一*提供商的多个 API 密钥之间轮换（首先尝试）
2. **主模型备用** — 当您的主模型失败时，自动切换到*不同*的提供商:模型组合
3. **辅助任务备用** — 为视觉、压缩和网页提取等辅助任务提供独立的提供商解析

凭据池处理同一提供商的轮换（例如，多个 OpenRouter 密钥）。本页面介绍跨提供商备用。两者都是可选的，并且独立工作。

## 主模型备用

当您的主 LLM 提供商遇到错误时 — 速率限制、服务器过载、身份验证失败、连接中断 — Hermes 可以在会话中途自动切换到备用提供商:模型组合，而不会丢失您的对话。

### 配置

在 `~/.hermes/config.yaml` 中添加一个 `fallback_model` 部分：

```yaml
fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

`provider` 和 `model` 都是**必需的**。如果缺少任何一个，备用将被禁用。

### 支持的提供商

| 提供商 | 值 | 要求 |
|----------|-------|-------------|
| AI Gateway | `ai-gateway` | `AI_GATEWAY_API_KEY` |
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY` |
| Nous Portal | `nous` | `hermes auth` (OAuth) |
| OpenAI Codex | `openai-codex` | `hermes model` (ChatGPT OAuth) |
| GitHub Copilot | `copilot` | `COPILOT_GITHUB_TOKEN`、`GH_TOKEN` 或 `GITHUB_TOKEN` |
| GitHub Copilot ACP | `copilot-acp` | 外部进程（编辑器集成） |
| Anthropic | `anthropic` | `ANTHROPIC_API_KEY` 或 Claude Code 凭据 |
| z.ai / GLM | `zai` | `GLM_API_KEY` |
| Kimi / Moonshot | `kimi-coding` | `KIMI_API_KEY` |
| MiniMax | `minimax` | `MINIMAX_API_KEY` |
| MiniMax (中国) | `minimax-cn` | `MINIMAX_CN_API_KEY` |
| DeepSeek | `deepseek` | `DEEPSEEK_API_KEY` |
| NVIDIA NIM | `nvidia` | `NVIDIA_API_KEY`（可选：`NVIDIA_BASE_URL`） |
| Ollama Cloud | `ollama-cloud` | `OLLAMA_API_KEY` |
| Google Gemini (OAuth) | `google-gemini-cli` | `hermes model` (Google OAuth；可选：`HERMES_GEMINI_PROJECT_ID`) |
| Google AI Studio | `gemini` | `GOOGLE_API_KEY`（别名：`GEMINI_API_KEY`） |
| xAI (Grok) | `xai`（别名 `grok`） | `XAI_API_KEY`（可选：`XAI_BASE_URL`） |
| AWS Bedrock | `bedrock` | 标准 boto3 身份验证（`AWS_REGION` + `AWS_PROFILE` 或 `AWS_ACCESS_KEY_ID`） |
| Qwen Portal (OAuth) | `qwen-oauth` | `hermes model` (Qwen Portal OAuth；可选：`HERMES_QWEN_BASE_URL`) |
| OpenCode Zen | `opencode-zen` | `OPENCODE_ZEN_API_KEY` |
| OpenCode Go | `opencode-go` | `OPENCODE_GO_API_KEY` |
| Kilo Code | `kilocode` | `KILOCODE_API_KEY` |
| 小米 MiMo | `xiaomi` | `XIAOMI_API_KEY` |
| Arcee AI | `arcee` | `ARCEEAI_API_KEY` |
| 阿里巴巴 / DashScope | `alibaba` | `DASHSCOPE_API_KEY` |
| Hugging Face | `huggingface` | `HF_TOKEN` |
| 自定义端点 | `custom` | `base_url` + `key_env`（见下文） |

### 自定义端点备用

对于自定义的 OpenAI 兼容端点，请添加 `base_url` 和可选的 `key_env`：

```yaml
fallback_model:
  provider: custom
  model: my-local-model
  base_url: http://localhost:8000/v1
  key_env: MY_LOCAL_KEY              # 包含 API 密钥的环境变量名称
```

### 备用触发时机

当主模型出现以下情况时，备用会自动激活：

- **速率限制**（HTTP 429）— 在重试尝试用尽后
- **服务器错误**（HTTP 500、502、503）— 在重试尝试用尽后
- **身份验证失败**（HTTP 401、403）— 立即（无需重试）
- **未找到**（HTTP 404）— 立即
- **无效响应** — 当 API 反复返回格式错误或空响应时

触发后，Hermes 会：

1. 为备用提供商解析凭据
2. 构建新的 API 客户端
3. 就地交换模型、提供商和客户端
4. 重置重试计数器并继续对话

切换是无缝的 — 您的对话历史记录、工具调用和上下文都会被保留。智能体将从它离开的确切位置继续，只是使用不同的模型。

:::info 每轮而非每会话
备用是**每轮范围**的：每个新的用户消息都会从恢复的主模型开始。如果主模型在某轮中途失败，备用仅对该轮激活。在下一条消息上，Hermes 会再次尝试主模型。在单轮内，备用最多激活一次 — 如果备用也失败，则正常的错误处理机制会接管（重试，然后显示错误消息）。这可以防止在一轮内出现级联故障转移循环，同时让主模型在每一轮都有新的机会。
:::

### 示例

**OpenRouter 作为 Anthropic 原生的备用：**
```yaml
model:
  provider: anthropic
  default: claude-sonnet-4-6

fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

**Nous Portal 作为 OpenRouter 的备用：**
```yaml
model:
  provider: openrouter
  default: anthropic/claude-opus-4

fallback_model:
  provider: nous
  model: nous-hermes-3
```

**本地模型作为云的备用：**
```yaml
fallback_model:
  provider: custom
  model: llama-3.1-70b
  base_url: http://localhost:8000/v1
  key_env: LOCAL_API_KEY
```

**Codex OAuth 作为备用：**
```yaml
fallback_model:
  provider: openai-codex
  model: gpt-5.3-codex
```

### 备用工作位置

| 上下文 | 支持备用 |
|---------|-------------------|
| CLI 会话 | ✔ |
| 消息网关（Telegram、Discord 等） | ✔ |
| 子智能体委派 | ✘（子智能体不继承备用配置） |
| Cron 作业 | ✘（使用固定提供商运行） |
| 辅助任务（视觉、压缩） | ✘（使用它们自己的提供商链 — 见下文） |

:::tip
`fallback_model` 没有环境变量 — 它仅通过 `config.yaml` 配置。这是有意为之：备用配置是一个 deliberate 选择，而不是某个过时的 shell 导出应该覆盖的东西。
:::

---

## 辅助任务备用

Hermes 为辅助任务使用单独的轻量级模型。每个任务都有自己的提供商解析链，该链充当内置备用系统。

### 具有独立提供商解析的任务

| 任务 | 功能 | 配置键 |
|------|-------------|-----------|
| 视觉 | 图像分析、浏览器截图 | `auxiliary.vision` |
| 网页提取 | 网页摘要 | `auxiliary.web_extract` |
| 压缩 | 上下文压缩摘要 | `auxiliary.compression` |
| 会话搜索 | 过去会话摘要 | `auxiliary.session_search` |
| 技能中心 | 技能搜索和发现 | `auxiliary.skills_hub` |
| MCP | MCP 辅助操作 | `auxiliary.mcp` |
| 内存刷新 | 内存整合 | `auxiliary.flush_memories` |
| 审批 | 智能命令审批分类 | `auxiliary.approval` |
| 标题生成 | 会话标题摘要 | `auxiliary.title_generation` |

### 自动检测链

当任务的提供商设置为 `"auto"`（默认值）时，Hermes 会按顺序尝试提供商，直到其中一个工作：

**对于文本任务（压缩、网页提取等）：**

```text
OpenRouter → Nous Portal → 自定义端点 → Codex OAuth →
API 密钥提供商（z.ai、Kimi、MiniMax、小米 MiMo、Hugging Face、Anthropic）→ 放弃
```

**对于视觉任务：**

```text
主提供商（如果支持视觉）→ OpenRouter → Nous Portal →
Codex OAuth → Anthropic → 自定义端点 → 放弃
```

如果在调用时解析的提供商失败，Hermes 也有内部重试：如果提供商不是 OpenRouter 且未设置显式 `base_url`，它会尝试 OpenRouter 作为最后手段的备用。

### 配置辅助提供商

每个任务都可以在 `config.yaml` 中独立配置：

```yaml
auxiliary:
  vision:
    provider: "auto"              # auto | openrouter | nous | codex | main | anthropic
    model: ""                     # 例如 "openai/gpt-4o"
    base_url: ""                  # 直接端点（优先于提供商）
    api_key: ""                   # base_url 的 API 密钥

  web_extract:
    provider: "auto"
    model: ""

  compression:
    provider: "auto"
    model: ""

  session_search:
    provider: "auto"
    model: ""
    timeout: 30
    max_concurrency: 3
    extra_body: {}

  skills_hub:
    provider: "auto"
    model: ""

  mcp:
    provider: "auto"
    model: ""

  flush_memories:
    provider: "auto"
    model: ""
```

上述每个任务都遵循相同的 **provider / model / base_url** 模式。上下文压缩在 `auxiliary.compression` 下配置：

```yaml
auxiliary:
  compression:
    provider: main                                    # 与其他辅助任务相同的提供商选项
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

对于 `auxiliary.session_search`，Hermes 还支持：

- `max_concurrency` 限制同时运行多少个会话摘要
- `extra_body` 在摘要调用时传递提供商特定的 OpenAI 兼容请求字段

示例：

```yaml
auxiliary:
  session_search:
    provider: main
    model: glm-4.5-air
    max_concurrency: 2
    extra_body:
      enable_thinking: false
```

如果您的提供商不支持原生的 OpenAI 兼容推理控制字段，`extra_body` 将无法帮助该部分；在这种情况下，`max_concurrency` 对于减少请求突发 429 仍然有用。

所有三个 — 辅助、压缩、备用 — 的工作方式相同：设置 `provider` 来选择谁处理请求，`model` 来选择哪个模型，`base_url` 来指向自定义端点（覆盖提供商）。

### 辅助任务的提供商选项

这些选项仅适用于 `auxiliary:`、`compression:` 和 `fallback_model:` 配置 — `"main"` 不是您的顶级 `model.provider` 的有效值。对于自定义端点，请在您的 `model:` 部分使用 `provider: custom`（参见 [AI 提供商](/docs/integrations/providers)）。

| 提供商 | 描述 | 要求 |
|----------|-------------|-------------|
| `"auto"` | 按顺序尝试提供商，直到其中一个工作（默认） | 至少配置一个提供商 |
| `"openrouter"` | 强制使用 OpenRouter | `OPENROUTER_API_KEY` |
| `"nous"` | 强制使用 Nous Portal | `hermes auth` |
| `"codex"` | 强制使用 Codex OAuth | `hermes model` → Codex |
| `"main"` | 使用主智能体使用的任何提供商（仅限辅助任务） | 配置了活动的主提供商 |
| `"anthropic"` | 强制使用 Anthropic 原生 | `ANTHROPIC_API_KEY` 或 Claude Code 凭据 |

### 直接端点覆盖

对于任何辅助任务，设置 `base_url` 会完全绕过提供商解析，并将请求直接发送到该端点：

```yaml
auxiliary:
  vision:
    base_url: "http://localhost:1234/v1"
    api_key: "local-key"
    model: "qwen2.5-vl"
```

`base_url` 优先于 `provider`。Hermes 使用配置的 `api_key` 进行身份验证，如果未设置，则回退到 `OPENAI_API_KEY`。它**不会**为自定义端点重用 `OPENROUTER_API_KEY`。

---

## 上下文压缩备用

上下文压缩使用 `auxiliary.compression` 配置块来控制哪个模型和提供商处理摘要：

```yaml
auxiliary:
  compression:
    provider: "auto"                              # auto | openrouter | nous | main
    model: "google/gemini-3-flash-preview"
```

:::info 旧版迁移
具有 `compression.summary_model` / `compression.summary_provider` / `compression.summary_base_url` 的旧配置在首次加载时会自动迁移到 `auxiliary.compression.*`（配置版本 17）。
:::

如果没有可用于压缩的提供商，Hermes 会放弃生成摘要，而不是使会话失败。

---

## 委派提供商覆盖

由 `delegate_task` 生成的子智能体**不**使用主备用模型。但是，可以将它们路由到不同的提供商:模型组合以进行成本优化：

```yaml
delegation:
  provider: "openrouter"                      # 覆盖所有子智能体的提供商
  model: "google/gemini-3-flash-preview"      # 覆盖模型
  # base_url: "http://localhost:1234/v1"      # 或使用直接端点
  # api_key: "local-key"
```

有关完整配置详细信息，请参阅 [子智能体委派](/docs/user-guide/features/delegation)。

---

## Cron 作业提供商

Cron 作业使用执行时配置的提供商运行。它们不支持备用模型。要为 cron 作业使用不同的提供商，请在 cron 作业本身上配置 `provider` 和 `model` 覆盖：

```python
cronjob(
    action="create",
    schedule="every 2h",
    prompt="Check server status",
    provider="openrouter",
    model="google/gemini-3-flash-preview"
)
```

有关完整配置详细信息，请参阅 [计划任务（Cron）](/docs/user-guide/features/cron)。

---

## 总结

| 功能 | 备用机制 | 配置位置 |
|---------|-------------------|----------------|
| 主智能体模型 | config.yaml 中的 `fallback_model` — 错误时每轮故障转移（每轮恢复主模型） | `fallback_model:`（顶级） |
| 视觉 | 自动检测链 + 内部 OpenRouter 重试 | `auxiliary.vision` |
| 网页提取 | 自动检测链 + 内部 OpenRouter 重试 | `auxiliary.web_extract` |
| 上下文压缩 | 自动检测链，如果不可用则降级为无摘要 | `auxiliary.compression` |
| 会话搜索 | 自动检测链 | `auxiliary.session_search` |
| 技能中心 | 自动检测链 | `auxiliary.skills_hub` |
| MCP 助手 | 自动检测链 | `auxiliary.mcp` |
| 内存刷新 | 自动检测链 | `auxiliary.flush_memories` |
| 审批分类 | 自动检测链 | `auxiliary.approval` |
| 标题生成 | 自动检测链 | `auxiliary.title_generation` |
| 委派 | 仅提供商覆盖（无自动备用） | `delegation.provider` / `delegation.model` |
| Cron 作业 | 仅每作业提供商覆盖（无自动备用） | 每作业的 `provider` / `model` |