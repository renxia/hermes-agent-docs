---
title: 备用提供程序
description: 配置自动故障转移到备份 LLM 提供程序，以防您的主要模型不可用。
sidebar_label: 备用提供程序
sidebar_position: 8
---

# 备用提供程序

Hermes Agent 具有三层容错机制，可在提供程序遇到问题时保持会话运行：

1. **[凭据池](./credential-pools.md)** — 在*同一*提供程序之间轮换多个 API 密钥（首先尝试）
2. **主模型备用** — 当您的主模型失败时，自动切换到*不同*的提供程序:模型
3. **辅助任务备用** — 用于视觉、压缩和网页提取等侧边任务的独立提供程序解析

凭据池处理同提供程序的轮换（例如多个 OpenRouter 密钥）。本页面涵盖跨提供程序备用。两者都是可选的，并且可以独立工作。

## 主模型备用

当您的主 LLM 提供程序遇到错误 — 速率限制、服务器过载、身份验证失败、连接中断 — Hermes 可以在会话中途自动切换到备用提供程序:模型对，而不会丢失对话。

### 配置

在 `~/.hermes/config.yaml` 中添加 `fallback_model` 部分：

```yaml
fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

`provider` 和 `model` 都是**必需的**。如果其中任何一个缺失，备用功能将被禁用。

### 支持的提供程序

| 提供程序 | 值 | 要求 |
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
| Xiaomi MiMo | `xiaomi` | `XIAOMI_API_KEY` |
| Arcee AI | `arcee` | `ARCEEAI_API_KEY` |
| Alibaba / DashScope | `alibaba` | `DASHSCOPE_API_KEY` |
| Hugging Face | `huggingface` | `HF_TOKEN` |
| 自定义端点 | `custom` | `base_url` + `key_env`（见下文） |

### 自定义端点备用

对于自定义 OpenAI 兼容端点，添加 `base_url` 并可选地添加 `key_env`：

```yaml
fallback_model:
  provider: custom
  model: my-local-model
  base_url: http://localhost:8000/v1
  key_env: MY_LOCAL_KEY              # 包含 API 密钥的环境变量名称
```

### 触发备用的时机

当主模型因以下原因失败时，备用功能会自动激活：

- **速率限制**（HTTP 429）— 在耗尽重试次数后
- **服务器错误**（HTTP 500、502、503）— 在耗尽重试次数后
- **身份验证失败**（HTTP 401、403）— 立即（无需重试）
- **未找到**（HTTP 404）— 立即
- **无效响应** — 当 API 反复返回格式错误或空响应时

触发时，Hermes 会：

1. 解析备用提供程序的凭据
2. 构建新的 API 客户端
3. 就地替换模型、提供程序和客户端
4. 重置重试计数器并继续对话

切换是无缝的 — 您的对话历史记录、工具调用和上下文都得以保留。代理会从它离开的确切位置继续，只是使用不同的模型。

:::info 一次性
每个会话最多激活**一次**备用。如果备用提供程序也失败，则恢复正常错误处理（重试，然后显示错误消息）。这可以防止级联故障转移循环。
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

**将本地模型作为云端的备用：**
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

### 备用适用的场景

| 上下文 | 是否支持备用 |
|---------|-------------------|
| CLI 会话 | ✔ |
| 消息网关（Telegram、Discord 等） | ✔ |
| 子代理委派 | ✘（子代理不继承备用配置） |
| 定时任务 | ✘（使用固定的提供程序运行） |
| 辅助任务（视觉、压缩） | ✘（使用它们自己的提供程序链 — 见下文） |

:::tip
`fallback_model` 没有环境变量 — 它完全通过 `config.yaml` 配置。这是有意为之的：备用配置是一个有意识的选择，不应被过时的 shell 导出覆盖。
:::

---

## 辅助任务备用

Hermes 为侧边任务使用独立的轻量级模型。每个任务都有自己独立的提供程序解析链，充当内置的备用系统。

### 具有独立提供程序解析的任务

| 任务 | 作用 | 配置键 |
|------|-------------|-----------|
| 视觉 | 图像分析、浏览器截图 | `auxiliary.vision` |
| 网页提取 | 网页摘要 | `auxiliary.web_extract` |
| 压缩 | 上下文压缩摘要 | `auxiliary.compression` |
| 会话搜索 | 过去会话摘要 | `auxiliary.session_search` |
| 技能中心 | 技能搜索和发现 | `auxiliary.skills_hub` |
| MCP | MCP 助手操作 | `auxiliary.mcp` |
| 内存刷新 | 内存整合 | `auxiliary.flush_memories` |
| 审批 | 智能命令审批分类 | `auxiliary.approval` |
| 标题生成 | 会话标题摘要 | `auxiliary.title_generation` |

### 自动检测链

当任务的提供程序设置为 `"auto"`（默认值）时，Hermes 会按顺序尝试提供程序，直到其中一个有效：

**对于文本任务（压缩、网页提取等）：**

```text
OpenRouter → Nous Portal → 自定义端点 → Codex OAuth →
API-key 提供程序（z.ai、Kimi、MiniMax、Xiaomi MiMo、Hugging Face、Anthropic）→ 放弃
```

**对于视觉任务：**

```text
主提供程序（如果支持视觉）→ OpenRouter → Nous Portal →
Codex OAuth → Anthropic → 自定义端点 → 放弃
```

如果解析出的提供程序在调用时失败，Hermes 也有内部重试机制：如果提供程序不是 OpenRouter 且未设置显式的 `base_url`，它会尝试将 OpenRouter 作为最后的备用方案。

### 配置辅助提供程序

每个任务都可以在 `config.yaml` 中独立配置：

```yaml
auxiliary:
  vision:
    provider: "auto"              # auto | openrouter | nous | codex | main | anthropic
    model: ""                     # 例如 "openai/gpt-4o"
    base_url: ""                  # 直接端点（优先于提供程序）
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

上述每个任务都遵循相同的**提供程序 / 模型 / base_url** 模式。上下文压缩在 `auxiliary.compression` 下配置：

```yaml
auxiliary:
  compression:
    provider: main                                    # 与其他辅助任务相同的提供程序选项
    model: google/gemini-3-flash-preview
    base_url: null                                    # 自定义 OpenAI 兼容端点
```

而备用模型使用：

```yaml
fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
  # base_url: http://localhost:8000/v1               # 可选的自定义端点
```

辅助任务、压缩和备用都以相同的方式工作：设置 `provider` 来选择谁处理请求，`model` 来选择哪个模型，以及 `base_url` 来指向自定义端点（覆盖提供程序）。

### 辅助任务的提供程序选项

这些选项仅适用于 `auxiliary:`、`compression:` 和 `fallback_model:` 配置 — `"main"` **不是**顶级 `model.provider` 的有效值。对于自定义端点，请在您的 `model:` 部分使用 `provider: custom`（参见 [AI 提供程序](/docs/integrations/providers)）。

| 提供程序 | 描述 | 要求 |
|----------|-------------|-------------|
| `"auto"` | 按顺序尝试提供程序，直到其中一个有效（默认） | 至少配置了一个提供程序 |
| `"openrouter"` | 强制使用 OpenRouter | `OPENROUTER_API_KEY` |
| `"nous"` | 强制使用 Nous Portal | `hermes auth` |
| `"codex"` | 强制使用 Codex OAuth | `hermes model` → Codex |
| `"main"` | 使用主代理使用的任何提供程序（仅限辅助任务） | 已配置活动的主提供程序 |
| `"anthropic"` | 强制使用 Anthropic 原生 | `ANTHROPIC_API_KEY` 或 Claude Code 凭据 |

### 直接端点覆盖

对于任何辅助任务，设置 `base_url` 会完全绕过提供程序解析，直接向该端点发送请求：

```yaml
auxiliary:
  vision:
    base_url: "http://localhost:1234/v1"
    api_key: "local-key"
    model: "qwen2.5-vl"
```

`base_url` 优先于 `provider`。Hermes 使用配置的 `api_key` 进行身份验证，如果未设置则回退到 `OPENAI_API_KEY`。它**不会**为自定义端点重用 `OPENROUTER_API_KEY`。

---

## 上下文压缩备用

上下文压缩使用 `auxiliary.compression` 配置块来控制哪个模型和提供程序处理摘要：

```yaml
auxiliary:
  compression:
    provider: "auto"                              # auto | openrouter | nous | main
    model: "google/gemini-3-flash-preview"
```

:::info 旧版迁移
使用 `compression.summary_model` / `compression.summary_provider` / `compression.summary_base_url` 的旧配置会在首次加载时自动迁移到 `auxiliary.compression.*`（配置版本 17）。
:::

如果没有可用的提供程序进行压缩，Hermes 会丢弃中间对话轮次而不生成摘要，而不是使会话失败。

---

## 委派提供程序覆盖

由 `delegate_task` 生成的子代理**不使用**主备用模型。但是，它们可以被路由到不同的提供程序:模型对以优化成本：

```yaml
delegation:
  provider: "openrouter"                      # 覆盖所有子代理的提供程序
  model: "google/gemini-3-flash-preview"      # 覆盖模型
  # base_url: "http://localhost:1234/v1"      # 或使用直接端点
  # api_key: "local-key"
```

有关完整配置详情，请参见 [子代理委派](/docs/user-guide/features/delegation)。

---

## 定时任务提供程序

定时任务使用执行时配置的提供程序运行。它们不支持备用模型。要在定时任务中使用不同的提供程序，请在定时任务本身上配置 `provider` 和 `model` 覆盖：

```python
cronjob(
    action="create",
    schedule="every 2h",
    prompt="Check server status",
    provider="openrouter",
    model="google/gemini-3-flash-preview"
)
```

有关完整配置详情，请参见 [定时任务（Cron）](/docs/user-guide/features/cron)。

---

## 总结

| 特性 | 备用机制 | 配置位置 |
|---------|-------------------|----------------|
| 主代理模型 | config.yaml 中的 `fallback_model` — 出错时的一次性故障转移 | `fallback_model:`（顶层） |
| 视觉 | 自动检测链 + 内部 OpenRouter 重试 | `auxiliary.vision` |
| 网页提取 | 自动检测链 + 内部 OpenRouter 重试 | `auxiliary.web_extract` |
| 上下文压缩 | 自动检测链，如果不可用则降级为无摘要 | `auxiliary.compression` |
| 会话搜索 | 自动检测链 | `auxiliary.session_search` |
| 技能中心 | 自动检测链 | `auxiliary.skills_hub` |
| MCP 助手 | 自动检测链 | `auxiliary.mcp` |
| 内存刷新 | 自动检测链 | `auxiliary.flush_memories` |
| 审批分类 | 自动检测链 | `auxiliary.approval` |
| 标题生成 | 自动检测链 | `auxiliary.title_generation` |
| 委派 | 仅提供程序覆盖（无自动备用） | `delegation.provider` / `delegation.model` |
| 定时任务 | 仅每项任务的提供程序覆盖（无自动备用） | 每项任务的 `provider` / `model` |