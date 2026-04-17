---
sidebar_position: 1
title: "快速入门"
description: "与 Hermes Agent 的第一次对话——从安装到聊天，只需 2 分钟"
---

# 快速入门

本指南将引导您完成 Hermes Agent 的安装、配置提供商以及进行第一次对话。完成后，您将了解其关键功能并知道如何进一步探索。

## 1. 安装 Hermes Agent

运行单行安装程序：

```bash
# Linux / macOS / WSL2 / Android (Termux)
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

:::tip Android / Termux
如果您在手机上安装，请参阅专门的 [Termux 指南](./termux.md)，了解经过测试的手动路径、支持的额外功能以及当前的 Android 特定限制。
:::

:::tip Windows 用户
请先安装 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)，然后在 WSL2 终端中运行上述命令。
:::

完成后，重新加载您的 shell：

```bash
source ~/.bashrc   # 或 source ~/.zshrc
```

## 2. 配置提供商

安装程序会自动配置您的 LLM 提供商。如果将来需要更改它，请使用以下任一命令：

```bash
hermes model       # 选择您的 LLM 提供商和模型
hermes tools       # 配置启用的工具
hermes setup       # 或一次性配置所有内容
```

`hermes model` 会引导您选择一个推理提供商：

| 提供商 | 描述 | 如何设置 |
|----------|-----------|---------------|
| **Nous Portal** | 基于订阅，零配置 | 通过 `hermes model` 进行 OAuth 登录 |
| **OpenAI Codex** | ChatGPT OAuth，使用 Codex 模型 | 通过 `hermes model` 进行设备代码认证 |
| **Anthropic** | 直接使用 Claude 模型（Pro/Max 或 API 密钥） | 使用 `hermes model` 进行 Claude Code 认证，或使用 Anthropic API 密钥 |
| **OpenRouter** | 跨多个模型的多提供商路由 | 输入您的 API 密钥 |
| **Z.AI** | GLM / Zhipu 托管的模型 | 设置 `GLM_API_KEY` / `ZAI_API_KEY` |
| **Kimi / Moonshot** | Moonshot 托管的代码和聊天模型 | 设置 `KIMI_API_KEY` |
| **Kimi / Moonshot China** | 中国区域 Moonshot 端点 | 设置 `KIMI_CN_API_KEY` |
| **Arcee AI** | Trinity 模型 | 设置 `ARCEEAI_API_KEY` |
| **MiniMax** | 国际 MiniMax 端点 | 设置 `MINIMAX_API_KEY` |
| **MiniMax China** | 中国区域 MiniMax 端点 | 设置 `MINIMAX_CN_API_KEY` |
| **Alibaba Cloud** | 通过 DashScope 的 Qwen 模型 | 设置 `DASHSCOPE_API_KEY` |
| **Hugging Face** | 通过统一路由器（Qwen, DeepSeek, Kimi 等）的 20+ 开源模型 | 设置 `HF_TOKEN` |
| **Kilo Code** | KiloCode 托管的模型 | 设置 `KILOCODE_API_KEY` |
| **OpenCode Zen** | 按使用付费访问精选模型 | 设置 `OPENCODE_ZEN_API_KEY` |
| **OpenCode Go** | 开放模型月费 10 美元订阅 | 设置 `OPENCODE_GO_API_KEY` |
| **DeepSeek** | 直接 DeepSeek API 访问 | 设置 `DEEPSEEK_API_KEY` |
| **GitHub Copilot** | GitHub Copilot 订阅（GPT-5.x, Claude, Gemini 等） | 通过 `hermes model` 进行 OAuth，或 `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` |
| **GitHub Copilot ACP** | Copilot ACP 代理后端（生成本地 `copilot` CLI） | `hermes model`（需要 `copilot` CLI + `copilot login`） |
| **Vercel AI Gateway** | Vercel AI Gateway 路由 | 设置 `AI_GATEWAY_API_KEY` |
| **Custom Endpoint** | VLLM, SGLang, Ollama 或任何 OpenAI 兼容 API | 设置基础 URL + API 密钥 |

:::caution 最小上下文：64K tokens
Hermes Agent 要求模型具有至少 **64,000 tokens** 的上下文。上下文窗口较小的模型无法维持多步骤工具调用工作流所需的足够工作记忆，并在启动时将被拒绝。大多数托管模型（Claude, GPT, Gemini, Qwen, DeepSeek）都能轻松满足此要求。如果您运行的是本地模型，请将其上下文大小设置为至少 64K（例如，llama.cpp 使用 `--ctx-size 65536` 或 Ollama 使用 `-c 65536`）。
:::

:::tip
您可以使用 `hermes model` 随时切换提供商——无需更改代码，无锁定风险。配置自定义端点时，Hermes 会提示您上下文窗口大小，并在可能的情况下自动检测。有关详细信息，请参阅 [上下文长度检测](../integrations/providers.md#context-length-detection)。
:::

## 3. 开始聊天

```bash
hermes
```

就是这样！您将看到一个欢迎横幅，其中包含您的模型、可用工具和技能。输入一条消息并按回车键。

```
❯ 您需要我帮您做什么？
```

该代理具备进行网络搜索、文件操作、终端命令等工具的访问权限——开箱即用。

## 4. 尝试关键功能

### 要求它使用终端

```
❯ 我的磁盘使用率是多少？显示最大的前 5 个目录。
```

代理将代表您运行终端命令并向您展示结果。

### 使用斜杠命令

输入 `/` 可以看到所有命令的自动补全下拉列表：

| 命令 | 功能描述 |
|---------|-------------|
| `/help` | 显示所有可用命令 |
| `/tools` | 列出可用工具 |
| `/model` | 交互式切换模型 |
| `/personality pirate` | 尝试一个有趣的个性 |
| `/save` | 保存对话 |

### 多行输入

按 `Alt+Enter` 或 `Ctrl+J` 可以添加新行。这对于粘贴代码或撰写详细提示非常有用。

### 中断代理

如果代理运行时间过长，只需输入一条新消息并按回车键——这将中断当前任务并切换到您的新指令。`Ctrl+C` 也可以使用。

### 恢复会话

退出时，hermes 会打印一个恢复命令：

```bash
hermes --continue    # 恢复最近的会话
hermes -c            # 简写形式
```

## 5. 进一步探索

以下是一些您可以尝试的内容：

### 设置沙盒终端

出于安全考虑，请在 Docker 容器或远程服务器上运行代理：

```bash
hermes config set terminal.backend docker    # Docker 隔离
hermes config set terminal.backend ssh       # 远程服务器
```

### 连接消息平台

通过 Telegram、Discord、Slack、WhatsApp、Signal、电子邮件或 Home Assistant 从您的手机或其他设备与 Hermes 聊天：

```bash
hermes gateway setup    # 交互式平台配置
```

### 添加语音模式

是否要在 CLI 中使用麦克风输入或在消息中接收语音回复？

```bash
pip install "hermes-agent[voice]"
# 包含 faster-whisper，用于免费的本地语音转文本
```

然后启动 Hermes，并在 CLI 中启用它：

```text
/voice on
```

按 `Ctrl+B` 进行录音，或使用 `/voice tts` 让 Hermes 发出语音回复。有关 CLI、Telegram、Discord 和 Discord 语音频道的全功能设置，请参阅 [语音模式](../user-guide/features/voice-mode.md)。

### 安排自动化任务

```
❯ 每天早上 9 点，检查 Hacker News 获取 AI 新闻，并通过 Telegram 发送摘要给我。
```

代理将设置一个定时任务（cron job），通过网关自动运行。

### 浏览和安装技能

```bash
hermes skills search kubernetes
hermes skills search react --source skills-sh
hermes skills search https://mintlify.com/docs --source well-known
hermes skills install openai/skills/k8s
hermes skills install official/security/1password
hermes skills install skills-sh/vercel-labs/json-render/json-render-react --force
```

提示：
- 使用 `--source skills-sh` 搜索公共 `skills.sh` 目录。
- 使用 `--source well-known` 配合 docs/site URL，可以发现来自 `/.well-known/skills/index.json` 的技能。
- 仅在审查了第三方技能之后才使用 `--force`。它可以覆盖非危险的策略块，但不能覆盖 `dangerous` 扫描结果。

或者在聊天中使用 `/skills` 斜杠命令。

### 通过 ACP 在编辑器中使用 Hermes

Hermes 也可以作为 ACP 服务器运行，适用于 VS Code、Zed 和 JetBrains 等兼容 ACP 的编辑器：

```bash
pip install -e '.[acp]'
hermes acp
```

有关设置详情，请参阅 [ACP 编辑器集成](../user-guide/features/acp.md)。

### 尝试 MCP 服务器

通过模型上下文协议（Model Context Protocol）连接到外部工具：

```yaml
# 添加到 ~/.hermes/config.yaml
mcp_servers:
  github:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_xxx"
```

---

## 快速参考

| 命令 | 描述 |
|---------|-------------|
| `hermes` | 启动聊天 |
| `hermes model` | 选择您的 LLM 提供商和模型 |
| `hermes tools` | 配置每个平台的可用工具 |
| `hermes setup` | 全功能设置向导（一次性配置所有内容） |
| `hermes doctor` | 诊断问题 |
| `hermes update` | 更新到最新版本 |
| `hermes gateway` | 启动消息网关 |
| `hermes --continue` | 恢复上次会话 |

## 下一步

- **[CLI 指南](../user-guide/cli.md)** — 精通终端界面
- **[配置](../user-guide/configuration.md)** — 自定义您的设置
- **[消息网关](../user-guide/messaging/index.md)** — 连接 Telegram、Discord、Slack、WhatsApp、Signal、电子邮件或 Home Assistant
- **[工具与工具集](../user-guide/features/tools.md)** — 探索可用功能