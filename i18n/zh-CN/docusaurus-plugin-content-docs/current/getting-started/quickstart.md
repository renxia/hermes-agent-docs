---
sidebar_position: 1
title: "Quickstart"
description: "Your first conversation with Hermes Agent — from install to chatting in under 5 minutes"
---

# 快速入门

本指南将带你从零开始搭建一个可实际使用的 Hermes 智能体环境。完成安装、选择提供商、验证聊天功能，并了解出现问题时的应对方法。

## 更喜欢看视频？

**Onchain AI Garage** 制作了一期关于安装、设置和基础命令的大师课视频讲解——如果你更倾向于跟着视频学习，可以作为本页的补充。更多内容请查看完整的 [Hermes 智能体教程与用例](https://www.youtube.com/playlist?list=PLmpUb_PWAkDxewld5ZYyKifuHxgIbiq2d) 播放列表。

<div style={{position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%', marginBottom: '1.5rem'}}>
  <iframe
    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
    src="https://www.youtube-nocookie.com/embed/R3YOGfTBcQg"
    title="Hermes Agent Masterclass: Installation, Setup, Basic Commands"
    frameBorder="0"
    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  ></iframe>
</div>

## 适合谁阅读

- 刚入门，希望以最短路径完成可用配置
- 正在更换服务商，不想在配置错误上浪费时间
- 为团队、机器人或持续运行的流程配置 Hermes
- 受装了但不好使"的困扰

## 最快路径

选择符合你目标的行：

| 目标 | 先做这个 | 再做这个 |
|---|---|---|
| 我只想让 Hermes 在我的机器上跑起来 | `hermes setup` | 进行一次真实对话并验证它能回复 |
| 我已经知道要用哪个服务商 | `hermes model` | 保存配置，然后开始对话 |
| 我想要机器人或持续运行的配置 | CLI 可用后执行 `hermes gateway setup` | 接入 Telegram、Discord、Slack 或其他平台 |
| 我想要本地或自托管模型 | `hermes model` → 自定义端点 | 验证端点、模型名称和上下文长度 |
| 我想要多服务商故障转移 | 先执行 `hermes model` | 基础对话跑通后再添加路由和故障转移 |

**经验法则：** 如果 Hermes 无法完成一次正常对话，先不要添加更多功能。先把一次干净的对话跑通，然后再逐步叠加网关、定时任务、技能、语音或路由功能。

---

## 1. 安装 Hermes 智能体
### 在 macOS 或 Windows 上使用 Hermes 桌面安装程序（推荐）
要轻松安装命令行和桌面应用程序，请从我们的网站 [下载 Hermes 桌面安装程序](https://hermes-agent.nousresearch.com/) 并运行它。

### 不使用 Hermes 桌面版：
如果要在不使用 Hermes 桌面版的情况下仅安装命令行版本，请运行：

#### Linux / macOS / WSL2 / Android (Termux)
```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

#### Windows（原生）

在 PowerShell 中运行：
```powershell
iex (irm https://hermes-agent.nousresearch.com/install.ps1) 
```

:::tip Android / Termux
如果你是在手机上安装，请参阅专门的 [Termux 指南](./termux.md)，了解经过测试的手动路径、支持的额外功能以及当前 Android 特有的限制。
:::

安装完成后，重新加载你的 shell：

```bash
source ~/.bashrc   # 或 source ~/.zshrc
```

有关详细的安装选项、前置条件和故障排除，请参阅 [安装指南](./installation.md)。

## 2. 选择服务商

单个最重要的配置步骤。使用 `hermes model` 交互式地完成选择：

```bash
hermes model
```

:::tip 最简路径：Nous Portal
一个订阅覆盖 300+ 模型以及 [工具网关](../user-guide/features/tool-gateway.md)（网络搜索、图像生成、TTS、云浏览器）。在新安装上执行：

```bash
hermes setup --portal
```

一条命令即可完成登录、将 Nous 设为你的服务商并开启工具网关。
:::

:::info 配置模式
在新安装上，`hermes setup` 提供三种模式：

- **快速设置（Nous Portal）** — 免费 OAuth 登录，无需 API 密钥；配置模型及工具网关工具。推荐的快速路径。
- **完整设置** — 逐一配置每个服务商、工具和选项（需自备密钥）。
- **空白起点** — 除运行智能体所需的最低配置外，其余全部**关闭**：**服务商和模型、文件操作工具集和终端工具集**。无网络、浏览器、代码执行、视觉、记忆、委派、定时任务、技能、插件或 MCP 服务器——且压缩、检查点、智能路由和记忆捕获均被禁用。应用最低基线后，你选择两条路径之一：**从全部禁用状态完成**（以最低配置的智能体立即结束），或**逐一配置所有选项**（选择启用工具、技能、插件、消息和 MCP）。当你需要一个最小化、完全可控的智能体，并打算仅启用你确实需要的功能时，选择此模式。

空白起点会写入明确的 `platform_toolsets.cli` 列表和 `agent.disabled_toolsets`，确保你未选择的任何内容永远不会加载——即使在 `hermes update` 之后也不会。后续可通过 `hermes tools` 重新启用任何功能，通过 `hermes skills opt-in --sync` 添加种子技能，或通过 `hermes setup agent` 调整设置。
:::

推荐默认配置：

| 服务商 | 说明 | 配置方式 |
|----------|-----------|---------------|
| **Nous Portal** | 基于订阅，零配置 | 通过 `hermes model` 进行 OAuth 登录 |
| **OpenAI Codex** | ChatGPT OAuth，使用 Codex 模型 | 通过 `hermes model` 进行设备码认证 |
| **Anthropic** | 直接使用 Claude 模型 — Max 计划 + 额外用量额度（OAuth），或按 token 付费的 API 密钥 | `hermes model` → OAuth 登录（需要 Max + 额外额度），或 Anthropic API 密钥 |
| **OpenRouter** | 跨多个模型的多服务商路由 | 输入你的 API 密钥 |
| **Z.AI** | GLM / Zhipu 托管模型 | 设置 `GLM_API_KEY` / `ZAI_API_KEY`（也接受 `Z_AI_API_KEY`） |
| **Kimi / Moonshot** | Moonshot 托管的编程和对话模型 | 设置 `KIMI_API_KEY`（或 Kimi-Coding 专用的 `KIMI_CODING_API_KEY`） |
| **Kimi / Moonshot 中国** | 中国区 Moonshot 端点 | 设置 `KIMI_CN_API_KEY` |
| **Arcee AI** | Trinity 模型 | 设置 `ARCEEAI_API_KEY` |
| **GMI Cloud** | 多模型直连 API | 设置 `GMI_API_KEY` |
| **MiniMax (OAuth)** | 通过浏览器 OAuth 使用 MiniMax 前沿模型 — 无需 API 密钥（`hermes_cli/models.py` 中的模型名称可能随版本变化） | `hermes model` → MiniMax (OAuth) |
| **MiniMax** | 国际版 MiniMax 端点 | 设置 `MINIMAX_API_KEY` |
| **MiniMax 中国** | 中国区 MiniMax 端点 | 设置 `MINIMAX_CN_API_KEY` |
| **阿里云** | 通过 Dashscope 使用 Qwen 模型 | 设置 `DASHSCOPE_API_KEY`（Qwen Coding Plan 也接受 `ALIBABA_CODING_PLAN_API_KEY`） |
| **Hugging Face** | 通过统一路由访问 20+ 开放模型（Qwen、DeepSeek、Kimi 等） | 设置 `HF_TOKEN` |
| **AWS Bedrock** | 通过原生 Converse API 使用 Claude、Nova、Llama、DeepSeek | IAM 角色或 `aws configure`（[指南](../guides/aws-bedrock.md)） |
| **Azure Foundry** | Azure AI Foundry 托管模型 | 设置 `AZURE_FOUNDRY_API_KEY` + `AZURE_FOUNDRY_BASE_URL` |
| **Google AI Studio** | 通过直连 API 使用 Gemini 模型 | 设置 `GOOGLE_API_KEY` / `GEMINI_API_KEY` |
| **xAI** | 通过直连 API 使用 Grok 模型 | 设置 `XAI_API_KEY` |
| **xAI Grok OAuth** | SuperGrok / Premium+ 订阅，无需 API 密钥 | `hermes model` → xAI Grok OAuth |
| **NovitaAI** | 多模型 API 网关 | 设置 `NOVITA_API_KEY` |
| **StepFun** | Step Plan 模型 | 设置 `STEPFUN_API_KEY` |
| **小米 MiMo** | 小米托管模型 | 设置 `XIAOMI_API_KEY` |
| **腾讯 TokenHub** | 腾讯托管模型 | 设置 `TOKENHUB_API_KEY` |
| **Ollama Cloud** | 托管的 Ollama 模型 | 设置 `OLLAMA_API_KEY` |
| **LM Studio** | 暴露 OpenAI 兼容 API 的本地桌面应用 | 设置 `LM_API_KEY`（非默认地址还需 `LM_BASE_URL`） |
| **Qwen OAuth** | Qwen Portal 浏览器 OAuth — 无需 API 密钥 | `hermes model` → Qwen OAuth |
| **Kilo Code** | KiloCode 托管模型 | 设置 `KILOCODE_API_KEY` |
| **OpenCode Zen** | 按量付费访问精选模型 | 设置 `OPENCODE_ZEN_API_KEY` |
| **OpenCode Go** | $10/月订阅开放模型 | 设置 `OPENCODE_GO_API_KEY` |
| **DeepSeek** | 直接访问 DeepSeek API | 设置 `DEEPSEEK_API_KEY` |
| **NVIDIA NIM** | 通过 build.nvidia.com 或本地 NIM 使用 Nemotron 模型 | 设置 `NVIDIA_API_KEY`（可选：`NVIDIA_BASE_URL`） |
| **GitHub Copilot** | GitHub Copilot 订阅（GPT-5.x、Claude、Gemini 等） | 通过 `hermes model` 进行 OAuth，或使用 `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` |
| **GitHub Copilot ACP** | Copilot ACP 智能体后端（启动本地 `copilot` CLI） | `hermes model`（需要 `copilot` CLI + `copilot login`） |
| **自定义端点** | VLLM、SGLang、Ollama 或任何 OpenAI 兼容 API | 设置基础 URL + API 密钥 |

对于大多数首次使用的用户：选择一个服务商，接受默认设置，除非你清楚为什么要更改。包含环境变量和配置步骤的完整服务商目录位于 [服务商](../integrations/providers.md) 页面。

:::caution 最低上下文：64K tokens
Hermes 智能体要求模型至少具备 **64,000 tokens** 的上下文窗口。窗口较小的模型无法为多步骤工具调用工作流维持足够的运行时内存，将在启动时被拒绝。大多数托管模型（Claude、GPT、Gemini、Qwen、DeepSeek）轻松满足此要求。如果你运行的是本地模型，请将其上下文大小至少设为 64K（例如 llama.cpp 使用 `--ctx-size 65536`，Ollama 使用 `-c 65536`）。
:::

:::tip
你可以随时通过 `hermes model` 切换服务商——没有锁定。有关所有支持服务商的完整列表和配置详情，请参阅 [AI 服务商](../integrations/providers.md)。
:::

### 设置如何存储

Hermes 将敏感信息与常规配置分开：

- **密钥和令牌** → `~/.hermes/.env`
- **非敏感设置** → `~/.hermes/config.yaml`

正确设置值的最简单方式是通过 CLI：

```bash
hermes config set model anthropic/claude-opus-4.6
hermes config set terminal.backend docker
hermes config set OPENROUTER_API_KEY sk-or-...
```

正确的值会自动写入正确的文件。

## 3. 运行你的第一次对话

```bash
hermes            # 经典 CLI
hermes --tui      # 现代 TUI（推荐）
```

你将看到一个欢迎横幅，显示你的模型、可用工具和技能。使用一个具体且易于验证的提示：

:::tip 选择你的界面
Hermes 提供两个终端界面：经典的 `prompt_toolkit` CLI 和较新的 [TUI](../user-guide/tui.md)，支持模态覆盖、鼠标选择和非阻塞输入。两者共享相同的会话、斜杠命令和配置——分别用 `hermes` 和 `hermes --tui` 试试。
```

```
用 5 条要点总结这个仓库，并告诉我主入口文件是什么。
```

```
查看我当前目录，告诉我哪个看起来像主项目文件。
```

```
帮我为这个代码库建立一个规范的 GitHub PR 工作流。
```

**成功的标志：**

- 横幅显示你选择的服务商/模型
- Hermes 无误地回复
- 它可以在需要时使用工具（终端、文件读取、网络搜索）
- 对话能正常进行多轮

如果这些都通过了，你已经跨过了最难的部分。

## 4. 验证会话功能

在继续之前，确保恢复功能正常：

```bash
hermes --continue    # 恢复最近的会话
hermes -c            # 简写
```

这应该能让你回到刚才的会话。如果不能，请检查你是否在同一配置文件下，以及会话是否确实已保存。这在你要管理多个配置或机器时很重要。

## 5. 尝试关键功能

### 使用终端

```
❯ 我的磁盘使用情况如何？显示最大的 5 个目录。
```

智能体代表你运行终端命令并显示结果。

### 斜杠命令

输入 `/` 可查看所有命令的自动补全下拉列表：

| 命令 | 功能 |
|---------|-------------|
| `/help` | 显示所有可用命令 |
| `/tools` | 列出可用工具 |
| `/model` | 交互式切换模型 |
| `/personality pirate` | 尝试一个有趣的个性 |
| `/save` | 保存对话 |

### 多行输入

按 `Alt+Enter`、`Ctrl+J` 或 `Shift+Enter` 添加新行。`Shift+Enter` 需要终端将其作为不同的按键序列发送（默认支持 Kitty / foot / WezTerm / Ghostty；iTerm2 / Alacritty / VS Code 终端需启用 Kitty 键盘协议）。`Alt+Enter` 和 `Ctrl+J` 在所有终端中均可使用。

### 中断智能体

如果智能体耗时过长，输入新消息并按 Enter — 它会中断当前任务并切换到你的新指令。`Ctrl+C` 也同样有效。

## 6. 添加下一层

等基础聊天功能正常工作之后。按需选择：

### 机器人或共享助手

```bash
hermes gateway setup    # 交互式平台配置
```

连接 [Telegram](/user-guide/messaging/telegram)、[Discord](/user-guide/messaging/discord)、[Slack](/user-guide/messaging/slack)、[WhatsApp](/user-guide/messaging/whatsapp)、[Signal](/user-guide/messaging/signal)、[Email](/user-guide/messaging/email)、[Home Assistant](/user-guide/messaging/homeassistant) 或 [Microsoft Teams](/user-guide/messaging/teams)。

### 自动化与工具

- `hermes tools` — 按平台调整工具访问权限
- `hermes skills` — 浏览并安装可复用工作流
- Cron — 仅在机器人或 CLI 设置稳定后再配置

### 沙箱终端

为了安全起见，在 Docker 容器或远程服务器中运行智能体：

```bash
hermes config set terminal.backend docker    # Docker 隔离
hermes config set terminal.backend ssh       # 远程服务器
```

### 语音模式

```bash
# 从 Hermes 安装目录运行（curl 安装器在 Linux/macOS 上将其置于
# ~/.hermes/hermes-agent，在 Windows 上置于 %LOCALAPPDATA%\hermes\hermes-agent）：
cd ~/.hermes/hermes-agent
uv pip install -e ".[voice]"
# 包含 faster-whisper，用于免费的本地语音转文字
```

然后在 CLI 中：`/voice on`。按 `Ctrl+B` 录音。参见[语音模式](../user-guide/features/voice-mode.md)。

### 技能

技能是指令文档，教会 Hermes 如何完成特定任务——部署到 Kubernetes、打开 GitHub PR、微调模型、搜索 GIF。每个技能都是一个 `SKILL.md` 文件，包含名称、描述和分步流程。智能体免费读取简短描述，只有在任务实际需要时才加载技能的完整内容，因此添加技能不会让每次请求都变得臃肿。

Hermes 自带一套捆绑技能目录，已安装在 `~/.hermes/skills/` 中。你可以从技能中心添加更多，或编写自己的技能。

**从中心浏览并安装：**

```bash
hermes skills browse                      # 列出所有可用技能
hermes skills search kubernetes           # 按关键词查找技能
hermes skills install openai/skills/k8s   # 安装一个（会先运行安全扫描）
```

安装参数是来自中心的 `source/path` 标识——`openai/skills/k8s` 表示来自 OpenAI 目录的 `k8s` 技能。`hermes skills browse` 会显示要使用的确切标识。

**使用技能** — 每个已安装的技能都会自动成为斜杠命令：

```bash
/k8s deploy the staging manifest          # 用请求运行技能
/k8s                                       # 加载它并让 Hermes 询问你需要什么
```

这在 CLI 和任何已连接的消息平台中都有效。你不必预先安装所有内容——在正常对话中，当任务匹配时，智能体会自动选择合适的捆绑技能。

有关编写自己的技能、外部技能目录和完整的中心来源列表，参见[技能系统](../user-guide/features/skills.md)。

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

### 编辑器集成（ACP）

ACP 支持随标准 `[all]` 扩展一起提供，因此 curl 安装器已包含它。只需运行：

```bash
hermes acp
```

（如果你安装时未包含 `[all]`，请先运行 `cd ~/.hermes/hermes-agent && uv pip install -e ".[acp]"`。）

参见 [ACP 编辑器集成](../user-guide/features/acp.md)。

---

## 常见故障模式

以下是最浪费时间的问题：

| 症状 | 可能原因 | 解决方法 |
|---|---|---|
| Hermes 打开但回复为空或损坏 | 提供商认证或模型选择有误 | 重新运行 `hermes model` 并确认提供商、模型和认证 |
| 自定义端点"能用"但返回错误数据 | 基础 URL、模型名称不正确，或实际上不兼容 OpenAI | 先在另一个客户端中验证端点 |
| 网关启动但无人能发送消息 | 机器人令牌、允许列表或平台设置不完整 | 重新运行 `hermes gateway setup` 并检查 `hermes gateway status` |
| `hermes --continue` 找不到旧会话 | 切换了配置文件或会话从未保存 | 检查 `hermes sessions list` 并确认你在正确的配置文件中 |
| 模型不可用或回退行为异常 | 提供商路由或回退设置过于激进 | 在基础提供商稳定之前保持路由关闭 |
| `hermes doctor` 标记配置问题 | 配置值缺失或过期 | 修复配置，在添加功能之前重新测试普通聊天 |

## 恢复工具包

当感觉不对劲时，按以下顺序使用：

1. `hermes doctor`
2. `hermes model`
3. `hermes setup`
4. `hermes sessions list`
5. `hermes --continue`
6. `hermes gateway status`

这个序列能让你快速从"感觉不对"恢复到已知状态。

---

## 快速参考

| 命令 | 描述 |
|---------|-------------|
| `hermes` | 开始聊天 |
| `hermes model` | 选择你的 LLM 提供商和模型 |
| `hermes tools` | 配置每个平台启用的工具 |
| `hermes setup` | 完整设置向导（一次性配置所有内容） |
| `hermes doctor` | 诊断问题 |
| `hermes update` | 更新到最新版本 |
| `hermes gateway` | 启动消息网关 |
| `hermes --continue` | 恢复上次会话 |

## 下一步

- **[CLI 指南](../user-guide/cli.md)** — 掌握终端界面
- **[配置](../user-guide/configuration.md)** — 自定义你的设置
- **[消息网关](../user-guide/messaging/index.md)** — 连接 Telegram、Discord、Slack、WhatsApp、Signal、Email、Home Assistant、Teams 等
- **[工具与工具集](../user-guide/features/tools.md)** — 探索可用能力
- **[AI 提供商](../integrations/providers.md)** — 完整提供商列表和设置详情
- **[技能系统](../user-guide/features/skills.md)** — 可复用工作流和知识
- **[提示与最佳实践](../guides/tips.md)** — 高级用户技巧