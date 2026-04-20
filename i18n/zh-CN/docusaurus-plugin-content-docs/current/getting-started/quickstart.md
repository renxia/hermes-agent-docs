---
sidebar_position: 1
title: "快速入门"
description: "与 Hermes 智能体进行首次对话——从安装到聊天仅需5分钟以内"
---

# 快速入门

本指南将带您从零开始，搭建一个能够应对真实使用场景的 Hermes 环境。包括安装、选择服务提供商、验证正常聊天功能，以及在出现问题时知道如何排查。

## 适合人群

- 刚接触 Hermes，希望以最快速度完成配置
- 更换服务提供商，不想因配置错误浪费时间
- 为团队、机器人或持续运行的工作流设置 Hermes
- 厌倦了“虽然安装了，但依然毫无反应”的情况

## 最快路径

选择与您目标匹配的行：

| 目标 | 首先执行 | 然后执行 |
|---|---|---|
| 只想让 Hermes 在我的机器上运行 | `hermes setup` | 运行一次真实的对话并确认其有响应 |
| 已确定自己的服务提供商 | `hermes model` | 保存配置，然后开始聊天 |
| 想要搭建机器人或持续运行的助手 | CLI 工作后执行 `hermes gateway setup` | 连接 Telegram、Discord、Slack 或其他平台 |
| 想要本地或自建模型 | `hermes model` → 自定义端点 | 验证端点、模型名称和上下文长度 |
| 想要多服务提供商的备用方案 | 先执行 `hermes model` | 仅在基础聊天正常工作后再添加路由和备用机制 |

**经验法则：** 如果 Hermes 无法完成一次正常的对话，请不要急于添加更多功能。请先确保能完成一次清晰、完整的对话，然后再逐步叠加网关、定时任务、技能、语音或路由等功能。

---

## 1. 安装 Hermes 智能体

运行单行安装脚本：

```bash
# Linux / macOS / WSL2 / Android (Termux)
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

:::tip Android / Termux
如果您在手机上安装，请参考专门的 [Termux 指南](./termux.md)，了解经过测试的手动安装方式、支持的扩展功能以及当前 Android 特有的限制。
:::

:::tip Windows 用户
请先安装 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)，然后在 WSL2 终端中运行上述命令。
:::

安装完成后，重新加载 shell 环境：

```bash
source ~/.bashrc   # 或 source ~/.zshrc
```

如需详细了解安装选项、前置条件和故障排除方法，请参见 [安装指南](./installation.md)。

## 2. 选择服务提供商

这是最关键的一步。使用 `hermes model` 命令交互式地完成选择：

```bash
hermes model
```

推荐默认选项：

| 情况 | 推荐路径 |
|---|---|
| 追求最低门槛 | Nous Portal 或 OpenRouter |
| 已有 Claude 或 Codex 认证信息 | Anthropic 或 OpenAI Codex |
| 希望本地/私有推理 | Ollama 或任何兼容 OpenAI 的自定义端点 |
| 需要多提供商路由 | OpenRouter |
| 拥有自定义 GPU 服务器 | vLLM、SGLang、LiteLLM 或任何兼容 OpenAI 的端点 |

对于大多数初次使用者：选择一个服务提供商，接受默认设置（除非您明确知道为何要更改）。完整的服务提供商目录及其环境变量和配置步骤详见 [服务提供商页面](../integrations/providers.md)。

:::caution 最小上下文长度：64K tokens
Hermes 智能体要求模型至少具备 **64,000 tokens** 的上下文窗口。上下文窗口较小的模型无法维持足够的运行内存以支持多步骤工具调用流程，因此会在启动时被拒绝。大多数托管模型（Claude、GPT、Gemini、Qwen、DeepSeek）均满足此要求。如果您正在运行本地模型，请将其上下文长度设置为至少 64K（例如 llama.cpp 使用 `--ctx-size 65536`，Ollama 使用 `-c 65536`）。
:::

:::tip
您可以随时使用 `hermes model` 切换服务提供商——无需锁定。所有受支持的服务提供商及其详细配置信息请参见 [AI 服务提供商](../integrations/providers.md)。
:::

### 设置存储方式

Hermes 将密钥与常规配置分离管理：

- **密钥和令牌** → `~/.hermes/.env`
- **非敏感设置** → `~/.hermes/config.yaml`

最简便的方式是通过 CLI 正确设置值：

```bash
hermes config set model anthropic/claude-opus-4.6
hermes config set terminal.backend docker
hermes config set OPENROUTER_API_KEY sk-or-...
```

CLI 会自动将正确的值写入对应的文件。

## 3. 运行您的第一次对话

```bash
hermes            # 经典命令行界面
hermes --tui      # 现代 TUI（推荐）
```

您将看到欢迎横幅，显示所选模型、可用工具和技能。请使用具体且易于验证的提示词：

:::tip 选择界面
Hermes 提供了两种终端界面：经典的 `prompt_toolkit` CLI 和更新的 [TUI](../user-guide/tui.md)，后者具备模态覆盖层、鼠标选择和异步输入功能。两者共享相同的会话、斜杠命令和配置——可通过 `hermes` 与 `hermes --tui` 分别尝试。
:::

```
用 5 个要点总结这个仓库，并告诉我主入口点是什么。
```

```
检查我当前的目录，告诉我哪个看起来像主项目文件。
```

```
帮我为这个代码库搭建一个干净的 GitHub PR 工作流程。
```

**成功表现如下：**

- 横幅显示您选择的模型和服务提供商
- Hermes 无错误地回复
- 如有需要可使用工具（终端、文件读取、网络搜索）
- 对话可正常延续多个回合

若上述表现正常，则您已成功跨越最难的部分。

## 4. 验证会话功能

在继续之前，请确保恢复会话功能有效：

```bash
hermes --continue    # 恢复最近一次会话
hermes -c            # 简写形式
```

这应能带您回到刚才的会话。若无效，请检查是否处于同一配置文件下，以及会话是否确实已保存。这对后续在多设备或多配置间切换非常重要。

## 5. 尝试核心功能

### 使用终端

```
❯ 我的磁盘使用情况如何？列出最大的 5 个目录。
```

智能体会代表您执行终端命令并展示结果。

### 斜杠命令

输入 `/` 查看所有命令的自动补全下拉菜单：

| 命令 | 作用 |
|---------|-------------|
| `/help` | 显示所有可用命令 |
| `/tools` | 列出可用工具 |
| `/model` | 交互式切换模型 |
| `/personality pirate` | 尝试有趣的个性设定 |
| `/save` | 保存对话 |

### 多行输入

按下 `Alt+Enter` 或 `Ctrl+J` 添加新行。非常适合粘贴代码或编写详细提示词。

### 中断智能体

如果智能体耗时过长，直接输入新消息并按回车即可中断当前任务并切换到新指令。也可使用 `Ctrl+C`。

## 6. 添加下一层功能

仅在基础聊天正常工作后执行。按需选择：

### 机器人或共享助手

```bash
hermes gateway setup    # 交互式平台配置
```

可连接 [Telegram](/docs/user-guide/messaging/telegram)、[Discord](/docs/user-guide/messaging/discord)、[Slack](/docs/user-guide/messaging/slack)、[WhatsApp](/docs/user-guide/messaging/whatsapp)、[Signal](/docs/user-guide/messaging/signal)、[Email](/docs/user-guide/messaging/email) 或 [Home Assistant](/docs/user-guide/messaging/homeassistant)。

### 自动化与工具

- `hermes tools` — 按平台调整工具访问权限
- `hermes skills` — 浏览并安装可复用工作流
- Cron — 仅在机器人或 CLI 设置稳定后启用

### 沙箱化终端

出于安全考虑，可在 Docker 容器或远程服务器上运行智能体：

```bash
hermes config set terminal.backend docker    # Docker 隔离
hermes config set terminal.backend ssh       # 远程服务器
```

### 语音模式

```bash
pip install "hermes-agent[voice]"
# 包含 faster-whisper，支持免费本地语音转文本
```

然后在 CLI 中输入：`/voice on`。按下 `Ctrl+B` 开始录音。详见 [语音模式](../user-guide/features/voice-mode.md)。

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

### 编辑器集成（ACP）

```bash
pip install -e '.[acp]'
hermes acp
```

详见 [ACP 编辑器集成](../user-guide/features/acp.md)。

---

## 常见故障模式

以下是最耗时的典型问题：

| 症状 | 可能原因 | 解决方法 |
|---|---|---|
| Hermes 打开但返回空内容或乱码 | 服务提供商认证或模型选择错误 | 再次运行 `hermes model` 并确认提供商、模型和认证信息 |
| 自定义端点“看似正常”但返回垃圾数据 | 基础 URL 错误、模型名称错误或实际不兼容 OpenAI | 先用其他客户端单独验证该端点 |
| 网关启动但无人能与其通信 | 机器人令牌、白名单或平台配置不完整 | 重新运行 `hermes gateway setup` 并检查 `hermes gateway status` |
| `hermes --continue` 找不到旧会话 | 切换了配置文件或会话从未保存 | 检查 `hermes sessions list` 并确认处于正确配置文件 |
| 模型不可用或异常回退行为 | 提供商路由或回退设置过于激进 | 在基础提供商稳定前保持路由关闭 |
| `hermes doctor` 报告配置问题 | 配置项缺失或过期 | 修复配置后，先测试普通聊天再添加功能 |

## 恢复工具箱

当感觉不对劲时，按此顺序操作：

1. `hermes doctor`
2. `hermes model`
3. `hermes setup`
4. `hermes sessions list`
5. `hermes --continue`
6. `hermes gateway status`

这套组合拳能让您快速从“故障状态”恢复到已知可用状态。

---

## 快速参考

| 命令 | 说明 |
|---------|-------------|
| `hermes` | 开始对话 |
| `hermes model` | 选择 LLM 服务提供商和模型 |
| `hermes tools` | 配置各平台启用的工具 |
| `hermes setup` | 完整设置向导（一次性配置所有内容） |
| `hermes doctor` | 诊断问题 |
| `hermes update` | 更新到最新版本 |
| `hermes gateway` | 启动消息网关 |
| `hermes --continue` | 恢复上次会话 |

## 下一步

- **[CLI 指南](../user-guide/cli.md)** — 掌握终端界面
- **[配置说明](../user-guide/configuration.md)** — 自定义您的设置
- **[消息网关](../user-guide/messaging/index.md)** — 连接 Telegram、Discord、Slack、WhatsApp、Signal、Email 或 Home Assistant
- **[工具与工具集](../user-guide/features/tools.md)** — 探索可用能力
- **[AI 服务提供商](../integrations/providers.md)** — 完整提供商列表及配置详情
- **[技能系统](../user-guide/features/skills.md)** — 可复用工作流与知识库
- **[技巧与最佳实践](../guides/tips.md)** — 高级用户技巧