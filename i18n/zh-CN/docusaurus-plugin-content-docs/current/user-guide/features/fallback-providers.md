---
title: 备用提供商
description: 当主模型不可用时，配置自动故障转移到备用 LLM 提供商。
sidebar_label: 备用提供商
sidebar_position: 8
---

# 备用提供商

Hermes 智能体具有三层弹性机制，可在提供商出现问题时保持会话运行：

1. **[凭据池](./credential-pools.md)** — 在*同一*提供商之间轮换多个 API 密钥（优先尝试）
2. **主模型备用** — 当主模型失败时，自动切换到*不同*的提供商:模型组合
3. **辅助任务备用** — 为视觉、压缩和网页提取等辅助任务独立解析提供商

凭据池处理同一提供商内的轮换（例如多个 OpenRouter 密钥）。本页面介绍跨提供商备用。两者均为可选，且独立工作。

## 主模型备用

当您的主 LLM 提供商遇到错误时 — 速率限制、服务器过载、身份验证失败、连接中断 — Hermes 可以在会话中途自动切换到备用提供商:模型组合，而不会丢失对话内容。

### 配置

在 `~/.hermes/config.yaml` 中添加 `fallback_model` 部分：

```yaml
fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

`provider` 和 `model` 均为**必填项**。如果任一缺失，备用功能将被禁用。

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
| Google Gemini (OAuth) | `google-gemini-cli` | `hermes model`（Google OAuth；可选：`HERMES_GEMINI_PROJECT_ID`） |
| Google AI Studio | `gemini` | `GOOGLE_API_KEY`（别名：`GEMINI_API_KEY`） |
| xAI (Grok) | `xai`（别名 `grok`） | `XAI_API_KEY`（可选：`XAI_BASE_URL`） |
| AWS Bedrock | `bedrock` | 标准 boto3 身份验证（`AWS_REGION` + `AWS_PROFILE` 或 `AWS_ACCESS_KEY_ID`） |
| Qwen Portal (OAuth) | `qwen-oauth` | `hermes model`（Qwen Portal OAuth；可选：`HERMES_QWEN_BASE_URL`） |
| OpenCode Zen | `opencode-zen` | `OPENCODE_ZEN_API_KEY` |
| OpenCode Go | `opencode-go` | `OPENCODE_GO_API_KEY` |
| Kilo Code | `kilocode` | `KILOCODE_API_KEY` |
| 小米 MiMo | `xiaomi` | `XIAOMI_API_KEY` |
| Arcee AI | `arcee` | `ARCEEAI_API_KEY` |
| 阿里巴巴 / DashScope | `alibaba` | `DASHSCOPE_API_KEY` |
| Hugging Face | `huggingface` | `HF_TOKEN` |
| 自定义端点 | `custom` | `base_url` + `key_env`（见下文） |

### 自定义端点备用

对于自定义的 OpenAI 兼容端点，请添加 `base_url` 并可选择添加 `key_env`：

```yaml
fallback_model:
  provider: custom
  model: my-local-model
  base_url: http://localhost:8000/v1
  key_env: MY_LOCAL_KEY              # 包含 API 密钥的环境变量名称
```

### 备用触发条件

当主模型出现以下错误时，备用功能会自动激活：

- **速率限制**（HTTP 429）— 在重试尝试用尽后
- **服务器错误**（HTTP 500、502、503）— 在重试尝试用尽后
- **身份验证失败**（HTTP 401、403）— 立即触发（无需重试）
- **未找到**（HTTP 404）— 立即触发
- **无效响应** — 当 API 反复返回格式错误或空响应时

触发后，Hermes 将：

1. 为备用提供商解析凭据
2. 构建新的 API 客户端
3. 就地替换模型、提供商和客户端
4. 重置重试计数器并继续对话

切换过程无缝进行 — 您的对话历史、工具调用和上下文均会被保留。智能体将从其停止的确切位置继续，仅使用不同的模型。

:::info 一次性切换
每个会话最多激活备用功能**一次**。如果备用提供商也失败，则转为正常错误处理（重试，然后显示错误消息）。这可防止级联故障转移循环。
:::

### 示例

**将 OpenRouter 作为 Anthropic 原生的备用：**
```yaml
model:
  provider: anthropic
  default: claude-sonnet-4-6

fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

**将 Nous Portal 作为 OpenRouter 的备用：**
```yaml
model:
  provider: openrouter
  default: anthropic/claude-opus-4

fallback_model:
  provider: nous
  model: nous-hermes-3
```

**将本地模型作为云模型的备用：**
```yaml
fallback_model:
  provider: custom
  model: llama-3.1-70b
  base_url: http://localhost:8000/v1
  key_env: LOCAL_API_KEY
```

**将 Codex OAuth 作为备用：**
```yaml
fallback_model:
  provider: openai-codex
  model: gpt-5.3-codex
```

### 备用功能适用范围

| 上下文 | 是否支持备用 |
|---------|-------------------|
| CLI 会话 | ✔ |
| 消息网关（Telegram、Discord 等） | ✔ |
| 子智能体委托 | ✘（子智能体不继承备用配置） |
| 定时任务 | ✘（使用固定提供商运行） |
| 辅助任务（视觉、压缩） | ✘（使用其自身的提供商链 — 见下文） |

:::tip
`fallback_model` 没有环境变量 — 它只能通过 `config.yaml` 配置。这是有意为之：备用配置是一个 deliberate 选择，不应被过时的 shell 导出覆盖。
:::

---

## 辅助任务备用

Hermes 为辅助任务使用单独的轻量级模型。每个任务都有其自身的提供商解析链，作为内置备用系统。

### 具有独立提供商解析的任务

| 任务 | 功能 | 配置键 |
|------|-------------|-----------|
| 视觉 | 图像分析、浏览器截图 | `auxiliary.vision` |
| 网页提取 | 网页摘要 | `auxiliary.web_extract` |
| 压缩 | 上下文压缩摘要 | `auxiliary.compression` |
| 会话搜索 | 过往会话摘要 | `auxiliary.session_search` |
| 技能中心 | 技能搜索与发现 | `auxiliary.skills_hub` |
| MCP | MCP 辅助操作 | `auxiliary.mcp` |
| 记忆刷新 | 记忆整合 | `auxiliary.flush_memories` |
| 审批 | 智能命令审批分类 | `auxiliary.approval` |
| 标题生成 | 会话标题摘要 | `auxiliary.title_generation` |

### 自动检测链

当任务的提供商设置为 `"auto"`（默认值）时，Hermes 会按顺序尝试提供商，直到其中一个可用：

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

如果在调用时解析的提供商失败，Hermes 还具有内部重试机制：如果提供商不是 OpenRouter 且未设置显式 `base_url`，则尝试将 OpenRouter 作为最后手段的备用。

### 配置辅助提供商

每个任务都可以在 `config.yaml` 中独立配置：

```yaml
auxiliary:
  vision:
    provider: "auto"              # auto | openrouter | nous | codex | main | anthropic
    model: ""                     # 例如 "openai/gpt-4o"
    base_url: ""                  # 直接端点（优先于 provider）
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

- `max_concurrency` 限制同时运行的会话摘要数量
- `extra_body` 在摘要调用中传递提供商特定的 OpenAI 兼容请求字段

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

如果您的提供商不支持原生的 OpenAI 兼容推理控制字段，`extra_body` 对此部分无帮助；在这种情况下，`max_concurrency` 仍可用于减少请求突发导致的 429 错误。

三者 — 辅助、压缩、备用 — 的工作方式相同：设置 `provider` 以选择处理请求的提供商，`model` 以选择模型，`base_url` 以指向自定义端点（覆盖 provider）。

### 辅助任务的提供商选项

这些选项仅适用于 `auxiliary:`、`compression:` 和 `fallback_model:` 配置 — `"main"` 不是顶层 `model.provider` 的有效值。对于自定义端点，请在 `model:` 部分使用 `provider: custom`（参见 [AI 提供商](/docs/integrations/providers)）。

| 提供商 | 描述 | 要求 |
|----------|-------------|-------------|
| `"auto"` | 按顺序尝试提供商，直到其中一个可用（默认） | 至少配置一个提供商 |
| `"openrouter"` | 强制使用 OpenRouter | `OPENROUTER_API_KEY` |
| `"nous"` | 强制使用 Nous Portal | `hermes auth` |
| `"codex"` | 强制使用 Codex OAuth | `hermes model` → Codex |
| `"main"` | 使用主智能体使用的任何提供商（仅限辅助任务） | 已配置活动主提供商 |
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
包含 `compression.summary_model` / `compression.summary_provider` / `compression.summary_base_url` 的旧配置会在首次加载时自动迁移到 `auxiliary.compression.*`（配置版本 17）。
:::

如果没有可用于压缩的提供商，Hermes 会放弃生成摘要，而不是使会话失败。

---

## 委托提供商覆盖

由 `delegate_task` 生成的子智能体**不会**使用主备用模型。但是，可以将它们路由到不同的提供商:模型组合以优化成本：

```yaml
delegation:
  provider: "openrouter"                      # 覆盖所有子智能体的提供商
  model: "google/gemini-3-flash-preview"      # 覆盖模型
  # base_url: "http://localhost:1234/v1"      # 或使用直接端点
  # api_key: "local-key"
```

有关完整配置详细信息，请参阅 [子智能体委托](/docs/user-guide/features/delegation)。

---

## 定时任务提供商

定时任务使用执行时配置的提供商运行。它们不支持备用模型。要为定时任务使用不同的提供商，请在定时任务本身上配置 `provider` 和 `model` 覆盖：

```python
cronjob(
    action="create",
    schedule="every 2h",
    prompt="Check server status",
    provider="openrouter",
    model="google/gemini-3-flash-preview"
)
```

有关完整配置详细信息，请参阅 [计划任务（定时任务）](/docs/user-guide/features/cron)。

---

## 总结

| 功能 | 备用机制 | 配置位置 |
|---------|-------------------|----------------|
| 主智能体模型 | config.yaml 中的 `fallback_model` — 出错时一次性故障转移 | `fallback_model:`（顶层） |
| 视觉 | 自动检测链 + 内部 OpenRouter 重试 | `auxiliary.vision` |
| 网页提取 | 自动检测链 + 内部 OpenRouter 重试 | `auxiliary.web_extract` |
| 上下文压缩 | 自动检测链，如果不可用则降级为无摘要 | `auxiliary.compression` |
| 会话搜索 | 自动检测链 | `auxiliary.session_search` |
| 技能中心 | 自动检测链 | `auxiliary.skills_hub` |
| MCP 助手 | 自动检测链 | `auxiliary.mcp` |
| 记忆刷新 | 自动检测链 | `auxiliary.flush_memories` |
| 审批分类 | 自动检测链 | `auxiliary.approval` |
| 标题生成 | 自动检测链 | `auxiliary.title_generation` |
| 委托 | 仅提供商覆盖（无自动备用） | `delegation.provider` / `delegation.model` |
| 定时任务 | 仅每任务提供商覆盖（无自动备用） | 每任务的 `provider` / `model` |