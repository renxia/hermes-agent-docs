---
sidebar_position: 1
title: "快速入门"
description: "与 Hermes 智能体的首次对话——从安装到聊天，5分钟内搞定"
---

# 快速入门

本指南将带你从零开始，搭建一个经得起实际使用的 Hermes 环境。完成安装，选择提供商，验证一次有效的对话，并在出现问题时明确知道如何处理。

## 更喜欢看视频？

**Onchain AI Garage** 制作了一个安装、设置和基础命令的大师级视频教程，如果你更喜欢跟着视频操作，它将是本页面的良好补充。更多内容，请查看完整的 [Hermes 智能体教程与用例](https://www.youtube.com/channel/UCqB1bhMwGsW-yefBxYwFCCg) 播放列表。

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

## 适用人群

- 全新上手，希望以最短路径完成可用配置
- 更换提供者，不想因配置错误浪费时间
- 为团队、机器人或常驻工作流配置 Hermes
- 受困于“安装完成，但毫无反应”

## 最快路径

根据你的目标选择对应行：

| 目标 | 首先执行 | 然后执行 |
|---|---|---|
| 只想在本地机器上运行 Hermes | `hermes setup` | 运行一次真实聊天并验证其响应 |
| 已确定提供者 | `hermes model` | 保存配置，然后开始聊天 |
| 需要机器人或常驻配置 | CLI 可用后执行 `hermes gateway setup` | 连接 Telegram、Discord、Slack 或其他平台 |
| 需要本地或自托管模型 | `hermes model` → 自定义端点 | 验证端点、模型名称和上下文长度 |
| 需要多提供者回退 | 先执行 `hermes model` | 仅在基础聊天正常后添加路由和回退功能 |

**经验法则：** 如果 Hermes 无法完成正常聊天，请暂不添加更多功能。先确保一次干净对话可用，再逐步叠加网关、定时任务、技能、语音或路由。

---

## 1. 安装 Hermes 智能体

**选项 A — pip（最简单）：**

```bash
pip install hermes-agent
hermes postinstall     # 可选：安装 Node.js、浏览器、ripgrep、ffmpeg 并运行设置
```

PyPI 发布基于带标签的版本（主要/次要版本），而非 `main` 分支的每次提交。若需最新开发版，请使用选项 B。

**选项 B — git 安装程序（跟踪 main 分支）：**

```bash
# Linux / macOS / WSL2 / Android (Termux)
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

:::tip Android / Termux
如在手机上安装，请参阅专用 [Termux 指南](./termux.md)，其中包含经过测试的手动路径、支持的附加组件以及当前的 Android 特定限制。
:::

:::tip Windows 用户
请先安装 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)，然后在 WSL2 终端中运行上述命令。
:::

完成后，重新加载你的 Shell：

```bash
source ~/.bashrc   # 或 source ~/.zshrc
```

详细的安装选项、前提条件和故障排除，请参阅[安装指南](./installation.md)。

## 2. 选择提供者

这是最重要的设置步骤。使用 `hermes model` 交互式选择：

```bash
hermes model
```

:::tip 最简单路径：Nous Portal
一次订阅即可访问 300 多个模型及[工具网关](../user-guide/features/tool-gateway.md)（网络搜索、图片生成、TTS、云端浏览器）。全新安装时：

```bash
hermes setup --portal
```

此命令将完成登录、设置 Nous 为提供者，并启用工具网关。
:::

推荐的默认选项：

| 提供者 | 简介 | 设置方式 |
|----------|-----------|---------------|
| **Nous Portal** | 基于订阅，零配置 | 通过 `hermes model` 进行 OAuth 登录 |
| **OpenAI Codex** | ChatGPT OAuth，使用 Codex 模型 | 通过 `hermes model` 进行设备码授权 |
| **Anthropic** | 直接访问 Claude 模型 — Max 计划 + 额外使用额度（OAuth），或按 token 付费的 API 密钥 | `hermes model` → OAuth 登录（需 Max 计划 + 额外额度），或使用 Anthropic API 密钥 |
| **OpenRouter** | 跨多模型的提供者路由 | 输入你的 API 密钥 |
| **Z.AI** | GLM / 智谱托管的模型 | 设置 `GLM_API_KEY` / `ZAI_API_KEY` |
| **Kimi / Moonshot** | 月之暗面托管的编码和聊天模型 | 设置 `KIMI_API_KEY`（或 Kimi 编码专用的 `KIMI_CODING_API_KEY`） |
| **Kimi / Moonshot China** | 中国大陆区月之暗面端点 | 设置 `KIMI_CN_API_KEY` |
| **Arcee AI** | Trinity 模型 | 设置 `ARCEEAI_API_KEY` |
| **GMI Cloud** | 多模型直接 API | 设置 `GMI_API_KEY` |
| **MiniMax (OAuth)** | 通过浏览器 OAuth 访问 MiniMax-M2.7 — 无需 API 密钥 | `hermes model` → MiniMax (OAuth) |
| **MiniMax** | 国际 MiniMax 端点 | 设置 `MINIMAX_API_KEY` |
| **MiniMax China** | 中国大陆区 MiniMax 端点 | 设置 `MINIMAX_CN_API_KEY` |
| **阿里云** | 通过 DashScope 访问通义千问模型 | 设置 `DASHSCOPE_API_KEY` |
| **Hugging Face** | 通过统一路由访问 20+ 开放模型（通义千问、DeepSeek、Kimi 等） | 设置 `HF_TOKEN` |
| **AWS Bedrock** | 通过原生 Converse API 访问 Claude、Nova、Llama、DeepSeek | IAM 角色或 `aws configure`（[指南](../guides/aws-bedrock.md)） |
| **Kilo Code** | KiloCode 托管的模型 | 设置 `KILOCODE_API_KEY` |
| **OpenCode Zen** | 按需付费访问精选模型 | 设置 `OPENCODE_ZEN_API_KEY` |
| **OpenCode Go** | 每月 10 美元订阅开放模型 | 设置 `OPENCODE_GO_API_KEY` |
| **DeepSeek** | 直接访问 DeepSeek API | 设置 `DEEPSEEK_API_KEY` |
| **NVIDIA NIM** | 通过 build.nvidia.com 或本地 NIM 访问 Nemotron 模型 | 设置 `NVIDIA_API_KEY`（可选：`NVIDIA_BASE_URL`） |
| **GitHub Copilot** | GitHub Copilot 订阅（GPT-5.x、Claude、Gemini 等） | 通过 `hermes model` 进行 OAuth，或使用 `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` |
| **GitHub Copilot ACP** | Copilot ACP 智能体后端（生成本地 `copilot` CLI） | `hermes model`（需 `copilot` CLI + `copilot login`） |
| **Vercel AI Gateway** | Vercel AI Gateway 路由 | 设置 `AI_GATEWAY_API_KEY` |
| **自定义端点** | VLLM、SGLang、Ollama 或任何 OpenAI 兼容 API | 设置 base URL + API 密钥 |

对于大多数首次用户：选择一个提供者，除非你知道原因，否则请接受默认值。完整的提供者目录（含环境变量和设置步骤）位于[提供者](../integrations/providers.md)页面。

:::caution 最低上下文要求：64K tokens
Hermes 智能体要求模型至少支持 **64,000 tokens** 上下文。窗口较小的模型无法为多步骤工具调用工作流维持足够的工作内存，启动时将被拒绝。大多数托管模型（Claude、GPT、Gemini、通义千问、DeepSeek）都能轻松满足此要求。如果运行本地模型，请将其上下文大小设置为至少 64K（例如，llama.cpp 使用 `--ctx-size 65536`，Ollama 使用 `-c 65536`）。
:::

:::tip
你可以随时通过 `hermes model` 切换提供者 — 无锁定。所有支持的提供者及其设置详情，请参阅 [AI 提供者](../integrations/providers.md)。
:::

### 设置的存储方式

Hermes 将密钥与常规配置分离：

- **密钥和令牌** → `~/.hermes/.env`
- **非密钥设置** → `~/.hermes/config.yaml`

通过 CLI 设置值是最简单的方法：

```bash
hermes config set model anthropic/claude-opus-4.6
hermes config set terminal.backend docker
hermes config set OPENROUTER_API_KEY sk-or-...
```

正确的值会自动存入正确的文件。

## 3. 运行首次聊天

```bash
hermes            # 经典 CLI
hermes --tui      # 现代 TUI（推荐）
```

你将看到欢迎横幅，显示你的模型、可用工具和技能。使用具体且易于验证的提示：

:::tip 选择界面
Hermes 提供两种终端界面：经典的 `prompt_toolkit` CLI 和较新的 [TUI](../user-guide/tui.md)（支持模态覆盖、鼠标选择和非阻塞输入）。两者共享相同的会话、斜杠命令和配置 — 使用 `hermes` 与 `hermes --tui` 分别尝试。
:::

```
用 5 个要点总结这个仓库，并告诉我主要入口点是什么。
```

```
检查我的当前目录，告诉我哪个看起来是主要项目文件。
```

```
帮我为此代码库设置一个简洁的 GitHub PR 工作流。
```

**成功标志：**

- 横幅显示你选择的模型/提供者
- Hermes 回复无错误
- 需要时能使用工具（终端、文件读取、网络搜索）
- 对话能正常持续多轮

如果上述正常，你已度过最困难的部分。

## 4. 验证会话功能

继续之前，请确保恢复功能正常：

```bash
hermes --continue    # 恢复最近的会话
hermes -c            # 简写形式
```

这应带你回到刚才的会话。如果没有，请检查是否使用了相同的配置文件以及会话是否确实已保存。这在之后需要管理多个配置或机器时很重要。

## 5. 尝试关键功能

### 使用终端

```
❯ 我的磁盘使用情况如何？显示前 5 个最大的目录。
```

智能体将代你运行终端命令并显示结果。

### 斜杠命令

输入 `/` 可查看所有命令的自动完成下拉菜单：

| 命令 | 功能 |
|---------|-------------|
| `/help` | 显示所有可用命令 |
| `/tools` | 列出可用工具 |
| `/model` | 交互式切换模型 |
| `/personality pirate` | 尝试有趣的个性 |
| `/save` | 保存对话 |

### 多行输入

按 `Alt+Enter`、`Ctrl+J` 或 `Shift+Enter` 添加新行。`Shift+Enter` 需要终端将其作为不同序列发送（默认情况下 Kitty / foot / WezTerm / Ghostty 支持；iTerm2 / Alacritty / VS Code 终端在启用 Kitty 键盘协议后支持）。`Alt+Enter` 和 `Ctrl+J` 在所有终端中有效。

### 中断智能体

如果智能体耗时过长，输入新消息并按 Enter — 这将中断当前任务并切换到你的新指令。`Ctrl+C` 也可用。

## 6. 添加下一层

在基础聊天功能正常工作后，再添加此层。根据需要选择：

### 机器人或共享助手

```bash
hermes gateway setup    # 交互式平台配置
```

连接 [Telegram](/user-guide/messaging/telegram)、[Discord](/user-guide/messaging/discord)、[Slack](/user-guide/messaging/slack)、[WhatsApp](/user-guide/messaging/whatsapp)、[Signal](/user-guide/messaging/signal)、[电子邮件](/user-guide/messaging/email)、[Home Assistant](/user-guide/messaging/homeassistant) 或 [Microsoft Teams](/user-guide/messaging/teams)。

### 自动化与工具

- `hermes tools` — 调整每个平台的工具访问权限
- `hermes skills` — 浏览并安装可复用的工作流
- 定时任务 — 仅在你的机器人或命令行设置稳定后使用

### 沙箱终端

为安全起见，在Docker容器或远程服务器中运行智能体：

```bash
hermes config set terminal.backend docker    # Docker隔离
hermes config set terminal.backend ssh       # 远程服务器
```

### 语音模式

```bash
# 从Hermes安装目录开始（curl安装程序将其放在
# Linux/macOS的 ~/.hermes/hermes-agent 或 Windows的 %LOCALAPPDATA%\hermes\hermes-agent）：
cd ~/.hermes/hermes-agent
uv pip install -e ".[voice]"
# 包含 faster-whisper 用于免费的本地语音转文本
```

然后在命令行界面中输入：`/voice on`。按 `Ctrl+B` 录音。参见 [语音模式](../user-guide/features/voice-mode.md)。

### 技能

```bash
hermes skills search kubernetes
hermes skills install openai/skills/k8s
```

或在聊天会话中使用 `/skills`。

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

ACP支持随附于标准的 `[all]` 扩展包中，因此curl安装程序已经包含了它。只需运行：

```bash
hermes acp
```

（如果你安装时没有使用 `[all]`，请先运行 `cd ~/.hermes/hermes-agent && uv pip install -e ".[acp]"`。）

参见 [ACP 编辑器集成](../user-guide/features/acp.md)。

---

## 常见故障模式

以下是最浪费时间的问题：

| 症状 | 可能原因 | 解决方法 |
|---|---|---|
| Hermes 启动但给出空或损坏的回复 | 提供商认证或模型选择错误 | 再次运行 `hermes model` 并确认提供商、模型和认证信息 |
| 自定义端点"工作"但返回乱码 | 基础URL、模型名称错误，或端点实际上并非OpenAI兼容 | 先在单独的客户端中验证端点 |
| 网关启动但无人能发消息 | 机器人令牌、允许列表或平台设置不完整 | 重新运行 `hermes gateway setup` 并检查 `hermes gateway status` |
| `hermes --continue` 找不到旧会话 | 切换了配置文件或会话从未保存 | 检查 `hermes sessions list` 并确认你在正确的配置文件中 |
| 模型不可用或出现奇怪的回退行为 | 提供商路由或回退设置过于激进 | 在基础提供商稳定之前，关闭路由 |
| `hermes doctor` 标记配置问题 | 配置值缺失或过时 | 修复配置，添加功能前重新测试纯聊天 |

## 恢复工具包

当感觉不对劲时，按以下顺序操作：

1. `hermes doctor`
2. `hermes model`
3. `hermes setup`
4. `hermes sessions list`
5. `hermes --continue`
6. `hermes gateway status`

这个顺序能让你从"状态混乱"快速回到已知状态。

---

## 快速参考

| 命令 | 描述 |
|---------|-------------|
| `hermes` | 开始聊天 |
| `hermes model` | 选择你的LLM提供商和模型 |
| `hermes tools` | 配置每个平台启用哪些工具 |
| `hermes setup` | 完整设置向导（一次配置所有内容） |
| `hermes doctor` | 诊断问题 |
| `hermes update` | 更新到最新版本 |
| `hermes gateway` | 启动消息网关 |
| `hermes --continue` | 恢复上次会话 |

## 后续步骤

- **[CLI指南](../user-guide/cli.md)** — 掌握终端界面
- **[配置](../user-guide/configuration.md)** — 自定义你的设置
- **[消息网关](../user-guide/messaging/index.md)** — 连接Telegram、Discord、Slack、WhatsApp、Signal、电子邮件、Home Assistant、Teams等
- **[工具与工具集](../user-guide/features/tools.md)** — 探索可用功能
- **[AI提供商](../integrations/providers.md)** — 完整提供商列表和设置详情
- **[技能系统](../user-guide/features/skills.md)** — 可复用的工作流和知识
- **[技巧与最佳实践](../guides/tips.md)** — 高级用户技巧