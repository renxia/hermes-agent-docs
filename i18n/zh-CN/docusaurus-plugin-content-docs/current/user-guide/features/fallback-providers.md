---
title: 故障转移提供商
description: 当您的主要模型不可用时，配置自动故障转移到备份 LLM 提供商。
sidebar_label: 故障转移提供商
sidebar_position: 8
---

# 故障转移提供商

Hermes Agent 具有三层弹性机制，即使提供商出现问题，也能确保您的会话持续运行：

1. **[凭证池](./credential-pools.md)** — 为*同一*提供商轮换多个 API 密钥（首先尝试）
2. **主要模型故障转移** — 当您的主模型失败时，自动切换到*不同*的提供商:模型
3. **辅助任务故障转移** — 为视觉、压缩和网络提取等侧任务提供独立的提供商解析

凭证池处理同一提供商的轮换（例如，多个 OpenRouter 密钥）。本页介绍跨提供商的故障转移。两者都是可选的，并且独立工作。

## 主要模型故障转移

当您的主要 LLM 提供商遇到错误时——例如速率限制、服务器过载、认证失败、连接中断——Hermes 可以在会话中途自动切换到备用提供商:模型对，而不会丢失您的对话。

### 配置

请在 `~/.hermes/config.yaml` 中添加一个 `fallback_model` 部分：

```yaml
fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

`provider` 和 `model` 都**必需**。如果缺少任何一项，故障转移将禁用。

### 支持的提供商

| 提供商 | 值 | 要求 |
|----------|-------|-------------|
| AI Gateway | `ai-gateway` | `AI_GATEWAY_API_KEY` |
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY` |
| Nous Portal | `nous` | `hermes auth` (OAuth) |
| OpenAI Codex | `openai-codex` | `hermes model` (ChatGPT OAuth) |
| GitHub Copilot | `copilot` | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, 或 `GITHUB_TOKEN` |
| GitHub Copilot ACP | `copilot-acp` | 外部进程（编辑器集成） |
| Anthropic | `anthropic` | `ANTHROPIC_API_KEY` 或 Claude Code 凭证 |
| z.ai / GLM | `zai` | `GLM_API_KEY` |
| Kimi / Moonshot | `kimi-coding` | `KIMI_API_KEY` |
| MiniMax | `minimax` | `MINIMAX_API_KEY` |
| MiniMax (China) | `minimax-cn` | `MINIMAX_CN_API_KEY` |
| DeepSeek | `deepseek` | `DEEPSEEK_API_KEY` |
| OpenCode Zen | `opencode-zen` | `OPENCODE_ZEN_API_KEY` |
| OpenCode Go | `opencode-go` | `OPENCODE_GO_API_KEY` |
| Kilo Code | `kilocode` | `KILOCODE_API_KEY` |
| Xiaomi MiMo | `xiaomi` | `XIAOMI_API_KEY` |
| Arcee AI | `arcee` | `ARCEEAI_API_KEY` |
| Alibaba / DashScope | `alibaba` | `DASHSCOPE_API_KEY` |
| Hugging Face | `huggingface` | `HF_TOKEN` |
| 自定义端点 | `custom` | `base_url` + `api_key_env` (见下文) |

### 自定义端点故障转移

对于兼容 OpenAI 的自定义端点，添加 `base_url` 和可选的 `api_key_env`：

```yaml
fallback_model:
  provider: custom
  model: my-local-model
  base_url: http://localhost:8000/v1
  api_key_env: MY_LOCAL_KEY          # 包含 API 密钥的环境变量名称
```

### 故障转移触发时机

当主要模型出现以下错误时，故障转移会自动激活：

- **速率限制** (HTTP 429) — 耗尽重试尝试后
- **服务器错误** (HTTP 500, 502, 503) — 耗尽重试尝试后
- **认证失败** (HTTP 401, 403) — 立即（无需重试）
- **未找到** (HTTP 404) — 立即
- **无效响应** — 当 API 反复返回格式错误或空响应时

触发时，Hermes 将：

1. 为故障转移提供商解析凭证
2. 构建新的 API 客户端
3. 原地替换模型、提供商和客户端
4. 重置重试计数器并继续对话

切换过程是无缝的——您的对话历史、工具调用和上下文都得以保留。代理将从中断的地方继续，只是使用了不同的模型。

:::info 单次触发
故障转移每会话**最多激活一次**。如果故障转移提供商也失败了，则采用正常的错误处理流程（重试，然后是错误消息）。这可以防止级联故障转移循环。
:::

### 示例

**将 OpenRouter 作为 Anthropic 原生模型的故障转移：**
```yaml
model:
  provider: anthropic
  default: claude-sonnet-4-6

fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

**将 Nous Portal 作为 OpenRouter 的故障转移：**
```yaml
model:
  provider: openrouter
  default: anthropic/claude-opus-4

fallback_model:
  provider: nous
  model: nous-hermes-3
```

**将本地模型作为云端模型的故障转移：**
```yaml
fallback_model:
  provider: custom
  model: llama-3.1-70b
  base_url: http://localhost:8000/v1
  api_key_env: LOCAL_API_KEY
```

**Codex OAuth 作为故障转移：**
```yaml
fallback_model:
  provider: openai-codex
  model: gpt-5.3-codex
```

### 故障转移适用范围

| 上下文 | 是否支持故障转移 |
|---------|-------------------|
| CLI 会话 | ✔ |
| 消息网关（Telegram、Discord 等） | ✔ |
| 子代理委托 | ✘ (子代理不继承故障转移配置) |
| Cron 任务 | ✘ (使用固定提供商运行) |
| 辅助任务 (视觉、压缩) | ✘ (使用自己的提供商链 — 见下文) |

:::tip
`fallback_model` 没有环境变量 — 它只能通过 `config.yaml` 配置。这是故意的：故障转移配置是一个深思熟虑的选择，而不是应该被过时的 shell 导出覆盖的设置。
:::

---

## 辅助任务故障转移

Hermes 为侧任务使用独立的轻量级模型。每个任务都有自己的提供商解析链，充当内置的故障转移系统。

### 具有独立提供商解析的任务

| 任务 | 功能描述 | 配置键 |
|------|-------------|-----------|
| 视觉 (Vision) | 图像分析、浏览器截图 | `auxiliary.vision` |
| 网络提取 (Web Extract) | 网页摘要 | `auxiliary.web_extract` |
| 压缩 (Compression) | 上下文压缩摘要 | `auxiliary.compression` |
| 会话搜索 (Session Search) | 过去会话摘要 | `auxiliary.session_search` |
| 技能中心 (Skills Hub) | 技能搜索和发现 | `auxiliary.skills_hub` |
| MCP | MCP 辅助操作 | `auxiliary.mcp` |
| 内存清理 (Memory Flush) | 记忆整合 | `auxiliary.flush_memories` |

### 自动检测链

当任务的提供商设置为 `"auto"`（默认值）时，Hermes 会按顺序尝试提供商，直到找到一个可用的为止：

**对于文本任务（压缩、网络提取等）：**

```text
OpenRouter → Nous Portal → Custom endpoint → Codex OAuth →
API-key 提供商 (z.ai, Kimi, MiniMax, Xiaomi MiMo, Hugging Face, Anthropic) → 放弃
```

**对于视觉任务：**

```text
主提供商 (如果支持视觉) → OpenRouter → Nous Portal →
Codex OAuth → Anthropic → Custom endpoint → 放弃
```

如果解析的提供商在调用时失败，Hermes 还会进行内部重试：如果提供商不是 OpenRouter 且未设置明确的 `base_url`，它会尝试 OpenRouter 作为最后的备用选项。

### 配置辅助提供商

每个任务都可以在 `config.yaml` 中独立配置：

```yaml
auxiliary:
  vision:
    provider: "auto"              # auto | openrouter | nous | codex | main | anthropic
    model: ""                     # 例如："openai/gpt-4o"
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

上述每个任务都遵循相同的 **提供商 / 模型 / base_url** 模式。上下文压缩在 `auxiliary.compression` 下配置：

```yaml
auxiliary:
  compression:
    provider: main                                    # 与其他辅助任务相同的提供商选项
    model: google/gemini-3-flash-preview
    base_url: null                                    # 自定义兼容 OpenAI 的端点
```

而故障转移模型使用：

```yaml
fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
  # base_url: http://localhost:8000/v1               # 可选的自定义端点
```

这三者——辅助、压缩、故障转移——工作方式相同：设置 `provider` 来选择处理请求的方，设置 `model` 来选择模型，设置 `base_url` 来指向自定义端点（覆盖提供商）。

### 辅助任务的提供商选项

这些选项仅适用于 `auxiliary:`、`compression:` 和 `fallback_model:` 配置 — `"main"` **不是**您顶级 `model.provider` 的有效值。对于自定义端点，请在 `model:` 部分使用 `provider: custom`（参见 [AI 提供商](/docs/integrations/providers)）。

| 提供商 | 描述 | 要求 |
|----------|-------------|-------------|
| `"auto"` | 按顺序尝试提供商直到成功（默认） | 至少配置了一个提供商 |
| `"openrouter"` | 强制使用 OpenRouter | `OPENROUTER_API_KEY` |
| `"nous"` | 强制使用 Nous Portal | `hermes auth` |
| `"codex"` | 强制使用 Codex OAuth | `hermes model` → Codex |
| `"main"` | 使用主代理使用的任何提供商（仅限辅助任务） | 已配置活动的主提供商 |
| `"anthropic"` | 强制使用 Anthropic 原生服务 | `ANTHROPIC_API_KEY` 或 Claude Code 凭证 |

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

## 上下文压缩故障转移

上下文压缩使用 `auxiliary.compression` 配置块来控制处理摘要的模型和提供商：

```yaml
auxiliary:
  compression:
    provider: "auto"                              # auto | openrouter | nous | main
    model: "google/gemini-3-flash-preview"
```

:::info 遗留迁移
使用 `compression.summary_model` / `compression.summary_provider` / `compression.summary_base_url` 的旧配置在首次加载时（配置版本 17）会自动迁移到 `auxiliary.compression.*`。
:::

如果压缩没有可用的提供商，Hermes 会跳过中间的对话轮次，而不是失败会话。

---

## 委托提供商覆盖

由 `delegate_task` 产生的子代理**不**使用主要故障转移模型。但是，它们可以被路由到不同的提供商:模型对，以实现成本优化：

```yaml
delegation:
  provider: "openrouter"                      # 覆盖所有子代理的提供商
  model: "google/gemini-3-flash-preview"      # 覆盖模型
  # base_url: "http://localhost:1234/v1"      # 或使用直接端点
  # api_key: "local-key"
```

有关完整的配置详情，请参阅 [子代理委托](/docs/user-guide/features/delegation)。

---

## Cron 任务提供商

Cron 任务使用执行时配置的任何提供商运行。它们不支持故障转移模型。要为 Cron 任务使用不同的提供商，请在 Cron 任务本身配置 `provider` 和 `model` 覆盖：

```python
cronjob(
    action="create",
    schedule="every 2h",
    prompt="Check server status",
    provider="openrouter",
    model="google/gemini-3-flash-preview"
)
```

有关完整的配置详情，请参阅 [定时任务 (Cron)](/docs/user-guide/features/cron)。

---

## 总结

| 功能 | 故障转移机制 | 配置位置 |
|---------|-------------------|----------------|
| 主代理模型 | `config.yaml` 中的 `fallback_model` — 错误时的单次故障转移 | `fallback_model:` (顶级) |
| 视觉 | 自动检测链 + 内部 OpenRouter 重试 | `auxiliary.vision` |
| 网络提取 | 自动检测链 + 内部 OpenRouter 重试 | `auxiliary.web_extract` |
| 上下文压缩 | 自动检测链，如果不可用则降级为无摘要 | `auxiliary.compression` |
| 会话搜索 | 自动检测链 | `auxiliary.session_search` |
| 技能中心 | 自动检测链 | `auxiliary.skills_hub` |
| MCP 助手 | 自动检测链 | `auxiliary.mcp` |
| 内存清理 | 自动检测链 | `auxiliary.flush_memories` |
| 委托 | 仅提供商覆盖（无自动故障转移） | `delegation.provider` / `delegation.model` |
| Cron 任务 | 仅任务级提供商覆盖（无自动故障转移） | 任务级 `provider` / `model` |