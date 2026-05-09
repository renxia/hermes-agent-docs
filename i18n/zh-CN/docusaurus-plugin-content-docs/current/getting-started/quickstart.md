---
sidebar_position: 1
title: "快速入门"
description: "您与 Hermes 智能体的首次对话——从安装到聊天，5 分钟内完成"
---

# 快速入门

本指南将带您从零开始，搭建一个能够应对实际使用的 Hermes 环境。完成安装、选择服务提供商、验证聊天功能正常工作，并了解当出现问题时该如何处理。

## 更愿意观看视频？

**Onchain AI Garage** 制作了一期关于安装、设置和基本命令的 Masterclass 教程视频——如果您更愿意通过视频学习，这将是一个很好的补充材料。更多内容，请查看完整的 [Hermes 智能体教程与使用案例](https://www.youtube.com/channel/UCqB1bhMwGsW-yefBxYwFCCg) 播放列表。

<div style={{position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%', marginBottom: '1.5rem'}}>
  <iframe
    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
    src="https://www.youtube-nocookie.com/embed/R3YOGfTBcQg"
    title="Hermes 智能体 Masterclass：安装、设置、基本命令"
    frameBorder="0"
    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  ></iframe>
</div>

## 适用人群

- 全新接触，希望以最短路径完成可运行配置
- 正在更换服务提供商，不想因配置错误浪费时间
- 为团队、机器人或常驻工作流配置 Hermes
- 厌倦了“安装成功了，但依然毫无动静”

## 最快捷径

选择符合你目标的那一行：

| 目标 | 首先执行此操作 | 然后执行此操作 |
|---|---|---|
| 我只想让 Hermes 在我的机器上运行 | `hermes setup` | 进行一次真实对话并验证其响应 |
| 我已经知道我的服务提供商 | `hermes model` | 保存配置，然后开始对话 |
| 我想要一个机器人或常驻设置 | 在 CLI 工作后执行 `hermes gateway setup` | 连接 Telegram、Discord、Slack 或其他平台 |
| 我想要一个本地或自托管模型 | `hermes model` → 自定义端点 | 验证端点、模型名称和上下文长度 |
| 我想要多提供商回退 | 首先执行 `hermes model` | 仅在基础对话工作后添加路由和回退 |

**经验法则：** 如果 Hermes 无法完成一次正常对话，请不要添加更多功能。先让一次干净的对话工作起来，然后再叠加网关、定时任务、技能、语音或路由。

---

## 1. 安装 Hermes 智能体

运行单行安装程序：

```bash
# Linux / macOS / WSL2 / Android (Termux)
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

:::tip Android / Termux
如果你正在手机上安装，请查看专门的 [Termux 指南](./termux.md)，了解经过测试的手动路径、支持的附加组件以及当前 Android 特有的限制。
:::

:::tip Windows 用户
首先安装 [WSL2](https://learn.microsoft.com/zh-cn/windows/wsl/install)，然后在你的 WSL2 终端中运行上述命令。
:::

安装完成后，重新加载你的 shell：

```bash
source ~/.bashrc   # 或 source ~/.zshrc
```

有关详细的安装选项、先决条件和故障排除，请参阅 [安装指南](./installation.md)。

## 2. 选择一个提供商

这是唯一最重要的设置步骤。使用 `hermes model` 以交互方式完成选择：

```bash
hermes model
```

推荐的默认选项：

| 提供商 | 它是什么 | 如何设置 |
|----------|-----------|---------------|
| **Nous Portal** | 基于订阅，零配置 | 通过 `hermes model` 进行 OAuth 登录 |
| **OpenAI Codex** | ChatGPT OAuth，使用 Codex 模型 | 通过 `hermes model` 进行设备代码认证 |
| **Anthropic** | 直接使用 Claude 模型 — Max 计划 + 额外使用额度（OAuth），或按令牌付费的 API 密钥 | `hermes model` → OAuth 登录（需要 Max + 额外额度），或 Anthropic API 密钥 |
| **OpenRouter** | 跨多个模型的多提供商路由 | 输入你的 API 密钥 |
| **Z.AI** | GLM / Zhipu 托管的模型 | 设置 `GLM_API_KEY` / `ZAI_API_KEY` |
| **Kimi / Moonshot** | Moonshot 托管的编程和对话模型 | 设置 `KIMI_API_KEY` |
| **Kimi / Moonshot China** | 中国区域的 Moonshot 端点 | 设置 `KIMI_CN_API_KEY` |
| **Arcee AI** | Trinity 模型 | 设置 `ARCEEAI_API_KEY` |
| **GMI Cloud** | 多模型直接 API | 设置 `GMI_API_KEY` |
| **MiniMax (OAuth)** | 通过浏览器 OAuth 使用 MiniMax-M2.7 — 无需 API 密钥 | `hermes model` → MiniMax (OAuth) |
| **MiniMax** | 国际 MiniMax 端点 | 设置 `MINIMAX_API_KEY` |
| **MiniMax China** | 中国区域的 MiniMax 端点 | 设置 `MINIMAX_CN_API_KEY` |
| **Alibaba Cloud** | 通过 DashScope 使用 Qwen 模型 | 设置 `DASHSCOPE_API_KEY` |
| **Hugging Face** | 通过统一路由器使用 20+ 个开放模型（Qwen、DeepSeek、Kimi 等） | 设置 `HF_TOKEN` |
| **AWS Bedrock** | 通过原生 Converse API 使用 Claude、Nova、Llama、DeepSeek | IAM 角色或 `aws configure`（[指南](../guides/aws-bedrock.md)） |
| **Kilo Code** | KiloCode 托管的模型 | 设置 `KILOCODE_API_KEY` |
| **OpenCode Zen** | 按使用量付费访问精选模型 | 设置 `OPENCODE_ZEN_API_KEY` |
| **OpenCode Go** | 每月 10 美元订阅开放模型 | 设置 `OPENCODE_GO_API_KEY` |
| **DeepSeek** | 直接 DeepSeek API 访问 | 设置 `DEEPSEEK_API_KEY` |
| **NVIDIA NIM** | 通过 build.nvidia.com 或本地 NIM 使用 Nemotron 模型 | 设置 `NVIDIA_API_KEY`（可选：`NVIDIA_BASE_URL`） |
| **GitHub Copilot** | GitHub Copilot 订阅（GPT-5.x、Claude、Gemini 等） | 通过 `hermes model` 进行 OAuth，或 `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` |
| **GitHub Copilot ACP** | Copilot ACP 智能体后端（启动本地 `copilot` CLI） | `hermes model`（需要 `copilot` CLI + `copilot login`） |
| **Vercel AI Gateway** | Vercel AI 网关路由 | 设置 `AI_GATEWAY_API_KEY` |
| **Custom Endpoint** | VLLM、SGLang、Ollama 或任何与 OpenAI 兼容的 API | 设置基础 URL + API 密钥 |

对于大多数首次用户：选择一个提供商，除非你知道为什么要更改，否则接受默认设置。包含环境变量和设置步骤的完整提供商目录位于 [提供商](../integrations/providers.md) 页面。

:::caution 最小上下文：64K 令牌
Hermes 智能体需要一个至少具有 **64,000 个令牌**上下文的模型。窗口较小的模型无法维持足够的工作记忆以支持多步骤工具调用工作流，并将在启动时被拒绝。大多数托管模型（Claude、GPT、Gemini、Qwen、DeepSeek）都轻松满足此要求。如果你运行的是本地模型，请将其上下文大小设置为至少 64K（例如，llama.cpp 使用 `--ctx-size 65536`，Ollama 使用 `-c 65536`）。
:::

:::tip
你可以随时使用 `hermes model` 切换提供商 — 没有锁定。有关所有支持的提供商和设置详情的完整列表，请参阅 [AI 提供商](../integrations/providers.md)。
:::

### 设置如何存储

Hermes 将机密信息与常规配置分开：

- **机密信息和令牌** → `~/.hermes/.env`
- **非机密设置** → `~/.hermes/config.yaml`

通过 CLI 设置值是最简单的方法：

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

你将看到一个欢迎横幅，显示你的模型、可用工具和技能。使用一个具体且易于验证的提示：

:::tip 选择你的界面
Hermes 附带两个终端界面：经典的 `prompt_toolkit` CLI 和更新的 [TUI](../user-guide/tui.md)，后者具有模态叠加、鼠标选择和非阻塞输入功能。两者共享相同的会话、斜杠命令和配置 — 尝试使用 `hermes` 与 `hermes --tui` 分别体验。
:::

```
用 5 个要点总结这个仓库，并告诉我主要的入口点是什么。
```

```
检查我的当前目录，并告诉我哪个看起来是主要的项目文件。
```

```
帮助我为这个代码库设置一个干净的 GitHub PR 工作流。
```

**成功是什么样的：**

- 横幅显示你选择的模型/提供商
- Hermes 回复且没有错误
- 如果需要，它可以使用工具（终端、文件读取、网络搜索）
- 对话正常继续，超过一轮

如果这些都能工作，你就已经度过了最困难的部分。

## 4. 验证会话是否工作

在继续之前，请确保恢复功能正常工作：

```bash
hermes --continue    # 恢复最近的会话
hermes -c            # 简写形式
```

这应该会将你带回刚刚进行的会话。如果不行，请检查你是否处于相同的配置文件，以及会话是否实际保存。当你管理多个设置或机器时，这一点很重要。

## 5. 尝试关键功能

### 使用终端

```
❯ 我的磁盘使用情况如何？显示前 5 个最大的目录。
```

智能体代表你运行终端命令并显示结果。

### 斜杠命令

输入 `/` 以查看所有命令的自动完成下拉列表：

| 命令 | 它的作用 |
|---------|-------------|
| `/help` | 显示所有可用命令 |
| `/tools` | 列出可用工具 |
| `/model` | 以交互方式切换模型 |
| `/personality pirate` | 尝试一个有趣的个性 |
| `/save` | 保存对话 |

### 多行输入

按 `Alt+Enter`、`Ctrl+J` 或 `Shift+Enter` 添加新行。`Shift+Enter` 需要一个将其作为不同序列发送的终端（默认情况下为 Kitty / foot / WezTerm / Ghostty；一旦启用 Kitty 键盘协议，iTerm2 / Alacritty / VS Code 终端也可以）。`Alt+Enter` 和 `Ctrl+J` 在每个终端中都有效。

### 中断智能体

如果智能体耗时过长，输入一条新消息并按 Enter — 它会中断当前任务并切换到你的新指令。`Ctrl+C` 也有效。

## 6. 添加下一层

仅在基础对话工作后。选择你需要的：

### 机器人或共享助手

```bash
hermes gateway setup    # 交互式平台配置
```

连接 [Telegram](/docs/user-guide/messaging/telegram)、[Discord](/docs/user-guide/messaging/discord)、[Slack](/docs/user-guide/messaging/slack)、[WhatsApp](/docs/user-guide/messaging/whatsapp)、[Signal](/docs/user-guide/messaging/signal)、[Email](/docs/user-guide/messaging/email) 或 [Home Assistant](/docs/user-guide/messaging/homeassistant)，或 [Microsoft Teams](/docs/user-guide/messaging/teams)。

### 自动化和工具

- `hermes tools` — 按平台调整工具访问权限
- `hermes skills` — 浏览并安装可重用工作流
- Cron — 仅在你的机器人或 CLI 设置稳定后

### 沙盒化终端

为了安全，在 Docker 容器或远程服务器上运行智能体：

```bash
hermes config set terminal.backend docker    # Docker 隔离
hermes config set terminal.backend ssh       # 远程服务器
```

### 语音模式

```bash
pip install "hermes-agent[voice]"
# 包含免费的本地语音转文本 faster-whisper
```

然后在 CLI 中：`/voice on`。按 `Ctrl+B` 录制。请参阅 [语音模式](../user-guide/features/voice-mode.md)。

### 技能

```bash
hermes skills search kubernetes
hermes skills install openai/skills/k8s
```

或在对话会话中使用 `/skills`。

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

```bash
pip install -e '.[acp]'
hermes acp
```

请参阅 [ACP 编辑器集成](../user-guide/features/acp.md)。

---

## 常见故障模式

这些是浪费最多时间的问题：

| 症状 | 可能原因 | 修复方法 |
|---|---|---|
| Hermes 打开但返回空或损坏的回复 | 提供商认证或模型选择错误 | 再次运行 `hermes model` 并确认提供商、模型和认证 |
| 自定义端点“可用”但返回垃圾内容 | 基础 URL、模型名称错误，或实际上不兼容 OpenAI | 先在单独的客户端中验证端点 |
| 网关启动但无人可以与其通信 | 机器人令牌、允许列表或平台设置不完整 | 重新运行 `hermes gateway setup` 并检查 `hermes gateway status` |
| `hermes --continue` 找不到旧会话 | 切换了配置文件或会话从未保存 | 检查 `hermes sessions list` 并确认您处于正确的配置文件 |
| 模型不可用或出现奇怪的回退行为 | 提供商路由或回退设置过于激进 | 在基础提供商稳定之前保持路由关闭 |
| `hermes doctor` 标记配置问题 | 配置值缺失或过时 | 修复配置，在添加功能之前重新测试普通聊天 |

## 恢复工具包

当感觉不对劲时，请按此顺序操作：

1. `hermes doctor`
2. `hermes model`
3. `hermes setup`
4. `hermes sessions list`
5. `hermes --continue`
6. `hermes gateway status`

该顺序可让您从“故障状态”快速恢复到已知状态。

---

## 快速参考

| 命令 | 描述 |
|---------|-------------|
| `hermes` | 开始聊天 |
| `hermes model` | 选择您的 LLM 提供商和模型 |
| `hermes tools` | 配置每个平台启用的工具 |
| `hermes setup` | 完整设置向导（一次性配置所有内容） |
| `hermes doctor` | 诊断问题 |
| `hermes update` | 更新到最新版本 |
| `hermes gateway` | 启动消息网关 |
| `hermes --continue` | 恢复上次会话 |

## 后续步骤

- **[CLI 指南](../user-guide/cli.md)** — 掌握终端界面
- **[配置](../user-guide/configuration.md)** — 自定义您的设置
- **[消息网关](../user-guide/messaging/index.md)** — 连接 Telegram、Discord、Slack、WhatsApp、Signal、Email、Home Assistant、Teams 等
- **[工具与工具集](../user-guide/features/tools.md)** — 探索可用功能
- **[AI 提供商](../integrations/providers.md)** — 完整提供商列表和设置详情
- **[技能系统](../user-guide/features/skills.md)** — 可重用工作流和知识
- **[提示与最佳实践](../guides/tips.md)** — 高级用户提示