---
sidebar_position: 1
title: "快速入门"
description: "从安装到聊天，5分钟内完成与 Hermes 智能体的首次对话"
---

# 快速入门

本指南将带你从零开始，建立一个经得起实际使用的 Hermes 环境。完成安装，选择一个提供商，验证可用的聊天功能，并在出现问题时知道确切的处理方法。

## 偏好视频教学？

**Onchain AI Garage** 制作了一部关于安装、设置和基础命令的大师级教程视频，如果你更喜欢跟着视频操作，这是本页内容的良好补充。更多内容，请查看完整的 [Hermes 智能体教程与使用案例](https://www.youtube.com/channel/UCqB1bhMwGsW-yefBxYwFCCg) 播放列表。

<div style={{position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%', marginBottom: '1.5rem'}}>
  <iframe
    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
    src="https://www.youtube-nocookie.com/embed/R3YOGfTBcQg"
    title="Hermes 智能体大师课：安装、设置、基础命令"
    frameBorder="0"
    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  ></iframe>
</div>

---
## 适用于谁

- 全新用户，希望找到最短路径获得可用的设置
- 切换提供商，不想因配置错误而浪费时间
- 为团队、机器人或常驻工作流设置 Hermes
- 厌倦了“安装了，但还是没反应”

## 最快的路径

选择与你的目标匹配的行：

| 目标 | 首先做这个 | 然后做这个 |
|---|---|---|
| 我只想在我的机器上运行 Hermes | `hermes setup` | 运行一次真实对话并验证其响应 |
| 我已经知道我的提供商 | `hermes model` | 保存配置，然后开始对话 |
| 我想要一个机器人或常驻设置 | 在 CLI 可用后运行 `hermes gateway setup` | 连接 Telegram、Discord、Slack 或其他平台 |
| 我想要本地或自托管模型 | `hermes model` → 自定义端点 | 验证端点、模型名称和上下文长度 |
| 我想要多提供商回退 | 首先运行 `hermes model` | 仅在基础对话可用后才添加路由和回退 |

**经验法则：** 如果 Hermes 无法完成一次正常对话，就不要添加更多功能。先让一个清晰的对话能工作，然后再叠加网关、定时任务、技能、语音或路由功能。

---

## 1. 安装 Hermes 智能体

运行单行安装程序：

```bash
# Linux / macOS / WSL2 / Android (Termux)
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

:::tip Android / Termux
如果你在手机上安装，请参阅专门的 [Termux 指南](./termux.md)，了解经过测试的手动路径、支持的附加功能以及当前 Android 特有的限制。
:::

:::tip Windows 用户
首先安装 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)，然后在 WSL2 终端中运行上述命令。
::

安装完成后，重新加载你的 shell：

```bash
source ~/.bashrc   # 或者 source ~/.zshrc
```

有关详细的安装选项、先决条件和故障排除，请参阅[安装指南](./installation.md)。

## 2. 选择提供商

这是最重要的设置步骤。使用 `hermes model` 交互式地引导你做出选择：

```bash
hermes model
```

一些不错的默认选择：

| 提供商 | 它是什么 | 如何设置 |
|----------|-----------|---------------|
| **Nous Portal** | 基于订阅，零配置 | 通过 `hermes model` 进行 OAuth 登录 |
| **OpenAI Codex** | ChatGPT OAuth，使用 Codex 模型 | 通过 `hermes model` 进行设备码认证 |
| **Anthropic** | 直接访问 Claude 模型 — Max 计划 + 额外用量积分 (OAuth)，或按需付费的 API 密钥 | `hermes model` → OAuth 登录 (需要 Max + 额外积分)，或使用 Anthropic API 密钥 |
| **OpenRouter** | 跨多种模型的多提供商路由 | 输入你的 API 密钥 |
| **Z.AI** | GLM / 智谱托管的模型 | 设置 `GLM_API_KEY` / `ZAI_API_KEY` |
| **Kimi / Moonshot** | Moonshot 托管的编码和对话模型 | 设置 `KIMI_API_KEY`（或 Kimi-Coding 专用的 `KIMI_CODING_API_KEY`） |
| **Kimi / Moonshot China** | 中国区域 Moonshot 端点 | 设置 `KIMI_CN_API_KEY` |
| **Arcee AI** | Trinity 模型 | 设置 `ARCEEAI_API_KEY` |
| **GMI Cloud** | 多模型直接 API | 设置 `GMI_API_KEY` |
| **MiniMax (OAuth)** | 通过浏览器 OAuth 访问 MiniMax-M2.7 — 无需 API 密钥 | `hermes model` → MiniMax (OAuth) |
| **MiniMax** | 国际 MiniMax 端点 | 设置 `MINIMAX_API_KEY` |
| **MiniMax China** | 中国区域 MiniMax 端点 | 设置 `MINIMAX_CN_API_KEY` |
| **阿里巴巴云** | 通过 DashScope 访问 Qwen 模型 | 设置 `DASHSCOPE_API_KEY` |
| **Hugging Face** | 通过统一路由访问 20+ 开源模型 (Qwen, DeepSeek, Kimi 等) | 设置 `HF_TOKEN` |
| **AWS Bedrock** | 通过原生 Converse API 访问 Claude, Nova, Llama, DeepSeek | IAM 角色或 `aws configure` ([指南](../guides/aws-bedrock.md)) |
| **Kilo Code** | KiloCode 托管的模型 | 设置 `KILOCODE_API_KEY` |
| **OpenCode Zen** | 按需付费访问精选模型 | 设置 `OPENCODE_ZEN_API_KEY` |
| **OpenCode Go** | 10 美元/月订阅访问开源模型 | 设置 `OPENCODE_GO_API_KEY` |
| **DeepSeek** | 直接访问 DeepSeek API | 设置 `DEEPSEEK_API_KEY` |
| **NVIDIA NIM** | 通过 build.nvidia.com 或本地 NIM 访问 Nemotron 模型 | 设置 `NVIDIA_API_KEY` (可选: `NVIDIA_BASE_URL`) |
| **GitHub Copilot** | GitHub Copilot 订阅 (GPT-5.x, Claude, Gemini 等) | 通过 `hermes model` 进行 OAuth，或使用 `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` |
| **GitHub Copilot ACP** | Copilot ACP 智能体后端（生成本地 `copilot` CLI） | `hermes model` (需要 `copilot` CLI + `copilot login`) |
| **Vercel AI Gateway** | Vercel AI Gateway 路由 | 设置 `AI_GATEWAY_API_KEY` |
| **自定义端点** | VLLM, SGLang, Ollama 或任何兼容 OpenAI 的 API | 设置基础 URL + API 密钥 |

对于大多数首次用户：选择一个提供商，接受默认设置，除非你清楚为什么要更改。完整的提供商目录、环境变量和设置步骤都在[提供商](../integrations/providers.md)页面。

:::caution 最小上下文：64K tokens
Hermes 智能体要求模型至少具有 **64,000 tokens** 的上下文。窗口较小的模型无法为多步骤工具调用工作流维持足够的工作内存，启动时会被拒绝。大多数托管模型（Claude, GPT, Gemini, Qwen, DeepSeek）都能轻松满足此要求。如果你运行本地模型，请将其上下文大小设置为至少 64K（例如，llama.cpp 使用 `--ctx-size 65536`，Ollama 使用 `-c 65536`）。
:::

:::tip
你可以随时使用 `hermes model` 切换提供商 — 没有锁定。有关所有受支持的提供商和设置详情的完整列表，请参阅 [AI 提供商](../integrations/providers.md)。
:::

### 设置如何存储

Hermes 将密钥与普通配置分开：

- **密钥和令牌** → `~/.hermes/.env`
- **非密钥设置** → `~/.hermes/config.yaml`

正确设置值的最简单方法是通过 CLI：

```bash
hermes config set model anthropic/claude-opus-4.6
hermes config set terminal.backend docker
hermes config set OPENROUTER_API_KEY sk-or-...
```

正确的值会自动放入正确的文件。

## 3. 运行你的第一次对话

```bash
hermes            # 经典 CLI
hermes --tui      # 现代 TUI（推荐）
```

你会看到一个欢迎横幅，显示你的模型、可用工具和技能。使用一个具体且易于验证的提示：

:::tip 选择你的界面
Hermes 附带两种终端界面：经典的 `prompt_toolkit` CLI 和一个更新的 [TUI](../user-guide/tui.md)，具有模态覆盖、鼠标选择和非阻塞输入。两者共享相同的会话、斜杠命令和配置 — 使用 `hermes` 与 `hermes --tui` 分别尝试一下。
:::

```
用 5 个要点总结这个仓库，并告诉我主入口点是什么。
```

```
检查我当前的目录，告诉我哪个看起来像是主项目文件。
```

```
帮我为这个代码库设置一个干净的 GitHub PR 工作流。
```

**成功的标志是：**

- 横幅显示你选择的模型/提供商
- Hermes 回复没有错误
- 如果需要，它可以使用工具（终端、文件读取、网络搜索）
- 对话可以正常进行多轮

如果做到了这一点，你就已经度过了最难的部分。

## 4. 验证会话是否正常工作

在继续之前，确保恢复功能有效：

```bash
hermes --continue    # 恢复最近的会话
hermes -c            # 简写形式
```

这应该会把你带回到刚才的会话。如果没有，请检查你是否使用了相同的配置文件，以及会话是否确实被保存了。这在你以后管理多个设置或机器时很重要。

## 5. 尝试关键功能

### 使用终端

```
❯ 我的磁盘使用情况如何？显示最大的 5 个目录。
```

智能体会代表你运行终端命令并显示结果。

### 斜杠命令

输入 `/` 可以看到所有命令的自动完成下拉列表：

| 命令 | 作用 |
|---------|-------------|
| `/help` | 显示所有可用命令 |
| `/tools` | 列出可用工具 |
| `/model` | 交互式切换模型 |
| `/personality pirate` | 尝试一个有趣的性格 |
| `/save` | 保存对话 |

### 多行输入

按 `Alt+Enter`、`Ctrl+J` 或 `Shift+Enter` 添加新行。`Shift+Enter` 需要终端将其作为不同的序列发送（默认情况下 Kitty / foot / WezTerm / Ghostty 支持；iTerm2 / Alacritty / VS Code 终端在启用 Kitty 键盘协议后支持）。`Alt+Enter` 和 `Ctrl+J` 在所有终端中都有效。

### 中断智能体

如果智能体花费时间太长，输入新消息并按 Enter — 它会中断当前任务并切换到你的新指令。`Ctrl+C` 也有效。

## 6. 添加下一层

仅在基础对话可用之后。选择你需要的功能：

### 机器人或共享助手

```bash
hermes gateway setup    # 交互式平台配置
```

连接 [Telegram](/docs/user-guide/messaging/telegram)、[Discord](/docs/user-guide/messaging/discord)、[Slack](/docs/user-guide/messaging/slack)、[WhatsApp](/docs/user-guide/messaging/whatsapp)、[Signal](/docs/user-guide/messaging/signal)、[电子邮件](/docs/user-guide/messaging/email)、[Home Assistant](/docs/user-guide/messaging/homeassistant) 或 [Microsoft Teams](/docs/user-guide/messaging/teams)。

### 自动化与工具

- `hermes tools` — 调整每个平台的工具访问权限
- `hermes skills` — 浏览和安装可重用的工作流
- 定时任务 — 仅在你的机器人或 CLI 设置稳定后使用

### 沙盒终端

出于安全考虑，在 Docker 容器或远程服务器上运行智能体：

```bash
hermes config set terminal.backend docker    # Docker 隔离
hermes config set terminal.backend ssh       # 远程服务器
```

### 语音模式

```bash
# 从 Hermes 安装目录（curl 安装程序将其放置在
# Linux/macOS 上的 ~/.hermes/hermes-agent 或 Windows 上的 %LOCALAPPDATA%\hermes\hermes-agent）：
cd ~/.hermes/hermes-agent
uv pip install -e ".[voice]"
# 包含 faster-whisper，用于免费的本地语音转文字
```

然后在 CLI 中：`/voice on`。按 `Ctrl+B` 录音。参见[语音模式](../user-guide/features/voice-mode.md)。

### 技能

```bash
hermes skills search kubernetes
hermes skills install openai/skills/k8s
```

或者在对话会话中使用 `/skills`。

### MCP 服务器

```yaml
# 添加到 ~/.hermes/config.yaml
mcp_servers:
  github:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_xxx"
```

### 编辑器集成 (ACP)

ACP 支持随标准 `[all]` 附加功能一起提供，因此 curl 安装程序已经包含了它。只需运行：

```bash
hermes acp
```

（如果你在没有 `[all]` 的情况下安装，请先运行 `cd ~/.hermes/hermes-agent && uv pip install -e ".[acp]"`。）

参见 [ACP 编辑器集成](../user-guide/features/acp.md)。

---

## 常见失败模式

这些是最浪费时间的问题：

| 现象 | 可能原因 | 解决方法 |
|---|---|---|
| 打开 Hermes 但回复为空或格式损坏 | 提供商认证或模型选择错误 | 再次运行 `hermes model`，确认提供商、模型和认证 |
| 自定义端点“能用”但返回乱码 | 基础 URL、模型名称错误，或实际不兼容 OpenAI | 先在其他客户端验证端点是否正确 |
| 网关启动成功但无人能发消息 | 机器人令牌、白名单或平台设置未完成 | 重新运行 `hermes gateway setup` 并检查 `hermes gateway status` |
| `hermes --continue` 无法找到旧会话 | 切换了配置文件或会话从未保存 | 检查 `hermes sessions list` 并确认处于正确的配置文件中 |
| 模型不可用或出现奇怪的回退行为 | 提供商路由或回退设置过于激进 | 在基础提供商稳定之前保持路由关闭 |
| `hermes doctor` 指出配置问题 | 配置值缺失或过时 | 修复配置，在添加功能前重新测试普通聊天 |

## 恢复工具包

当感觉不对劲时，请按以下顺序操作：

1. `hermes doctor`
2. `hermes model`
3. `hermes setup`
4. `hermes sessions list`
5. `hermes --continue`
6. `hermes gateway status`

这个序列能让你快速从“状态异常”恢复到已知正常状态。

---

## 快速参考

| 命令 | 描述 |
|---------|-------------|
| `hermes` | 开始聊天 |
| `hermes model` | 选择你的大语言模型提供商和模型 |
| `hermes tools` | 配置每个平台启用哪些工具 |
| `hermes setup` | 完整设置向导（一次性配置所有内容） |
| `hermes doctor` | 诊断问题 |
| `hermes update` | 更新到最新版本 |
| `hermes gateway` | 启动消息网关 |
| `hermes --continue` | 恢复上次会话 |

## 后续步骤

- **[CLI 指南](../user-guide/cli.md)** — 掌握终端界面
- **[配置](../user-guide/configuration.md)** — 自定义你的设置
- **[消息网关](../user-guide/messaging/index.md)** — 连接 Telegram、Discord、Slack、WhatsApp、Signal、Email、Home Assistant、Teams 等
- **[工具与工具集](../user-guide/features/tools.md)** — 探索可用功能
- **[AI 提供商](../integrations/providers.md)** — 完整的提供商列表和设置详情
- **[技能系统](../user-guide/features/skills.md)** — 可复用的工作流程和知识库
- **[技巧与最佳实践](../guides/tips.md)** — 高级用户技巧