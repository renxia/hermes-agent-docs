---
sidebar_position: 3
title: "FAQ & Troubleshooting"
description: "Frequently asked questions and solutions to common issues with Hermes Agent"
---

# FAQ & Troubleshooting

快速解答和解决最常见的问题和问题。

---

## Frequently Asked Questions

### What LLM providers work with Hermes?

Hermes Agent 支持任何 OpenAI 兼容的 API。支持的提供商包括：

- **[OpenRouter](https://openrouter.ai/)** — 通过一个 API 密钥访问数百个模型（推荐用于灵活性）
- **Nous Portal** — Nous Research 自己的推理端点
- **OpenAI** — GPT-4o, o1, o3 等
- **Anthropic** — Claude 模型（通过 OpenRouter 或兼容代理）
- **Google** — Gemini 模型（通过 OpenRouter 或兼容代理）
- **z.ai / ZhipuAI** — GLM 模型
- **Kimi / Moonshot AI** — Kimi 模型
- **MiniMax** — 全球和中国端点
- **本地模型** — 通过 [Ollama](https://ollama.com/)、[vLLM](https://docs.vllm.ai/)、[llama.cpp](https://github.com/ggerganov/llama.cpp)、[SGLang](https://github.com/sgl-project/sglang)，或任何 OpenAI 兼容服务器

使用 `hermes model` 或编辑 `~/.hermes/.env` 来设置您的提供商。有关所有提供商密钥，请参阅 [Environment Variables](./environment-variables.md) 参考。

### Does it work on Windows?

**不能原生运行。** Hermes Agent 需要类 Unix 环境。在 Windows 上，请安装 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)，并在其中运行 Hermes。标准的安装命令在 WSL2 中完美运行：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

### Does it work on Android / Termux?

可以 — Hermes 现在为 Android 手机提供了经过测试的 Termux 安装路径。

快速安装：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

有关完全明确的手动步骤、支持的额外功能和当前限制，请参阅 [Termux guide](../getting-started/termux.md)。

重要注意事项：由于 `voice` 额外功能依赖于 `faster-whisper` → `ctranslate2`，而 `ctranslate2` 没有发布 Android wheel，因此目前无法使用完整的 `.[all]` 额外功能。请改用经过测试的 `.[termux]` 额外功能。

### Is my data sent anywhere?

API 调用**仅发送到您配置的 LLM 提供商**（例如 OpenRouter、您本地的 Ollama 实例）。Hermes Agent 不收集遥测数据、使用数据或分析数据。您的对话、记忆和技能存储在本地的 `~/.hermes/` 中。

### Can I use it offline / with local models?

可以。运行 `hermes model`，选择**自定义端点**，并输入您服务器的 URL：

```bash
hermes model
# 选择：自定义端点 (手动输入 URL)
# API base URL: http://localhost:11434/v1
# API key: ollama
# Model name: qwen3.5:27b
# Context length: 32768   ← 将此设置为与您服务器实际上下文窗口匹配的值
```

或者直接在 `config.yaml` 中配置：

```yaml
model:
  default: qwen3.5:27b
  provider: custom
  base_url: http://localhost:11434/v1
```

Hermes 会将端点、提供商和基础 URL 存储在 `config.yaml` 中，以确保重启后仍能使用。如果您的本地服务器只加载了一个模型，`/model custom` 会自动检测它。您也可以在 `config.yaml` 中设置 `provider: custom` — 它是一个一级提供商，而不是任何其他内容的别名。

这适用于 Ollama、vLLM、llama.cpp server、SGLang、LocalAI 等。有关详细信息，请参阅 [Configuration guide](../user-guide/configuration.md)。

:::tip Ollama 用户
如果您在 Ollama 中设置了自定义 `num_ctx`（例如，`ollama run --num_ctx 16384`），请确保在 Hermes 中设置匹配的上下文长度 — Ollama 的 `/api/show` 报告的是模型的*最大*上下文，而不是您配置的有效 `num_ctx`。
:::

:::tip 本地模型超时问题
Hermes 会自动检测本地端点并放宽流式传输超时限制（读取超时从 120 秒提高到 1800 秒，禁用陈旧流检测）。如果在使用非常大的上下文时仍然遇到超时，请在 `.env` 中设置 `HERMES_STREAM_READ_TIMEOUT=1800`。有关详细信息，请参阅 [Local LLM guide](../guides/local-llm-on-mac.md#timeouts)。
:::

### How much does it cost?

Hermes Agent 本身是**免费且开源的**（MIT 许可证）。您只需为所选提供商的 LLM API 使用量付费。本地模型运行是完全免费的。

### Can multiple people use one instance?

可以。[messaging gateway](../user-guide/messaging/index.md) 允许多个用户通过 Telegram、Discord、Slack、WhatsApp 或 Home Assistant 与同一个 Hermes Agent 实例互动。访问通过允许列表（特定用户 ID）和私信配对（第一个发送消息的用户获得访问权）来控制。

### What's the difference between memory and skills?

- **记忆 (Memory)** 存储**事实** — 代理关于您、您的项目和偏好的知识。记忆会根据相关性自动检索。
- **技能 (Skills)** 存储**程序** — 如何完成某事的逐步说明。当代理遇到类似任务时，会调用技能。

两者都会跨会话持久化。有关详细信息，请参阅 [Memory](../user-guide/features/memory.md) 和 [Skills](../user-guide/features/skills.md)。

### Can I use it in my own Python project?

可以。导入 `AIAgent` 类并以编程方式使用 Hermes：

```python
from run_agent import AIAgent

agent = AIAgent(model="openrouter/nous/hermes-3-llama-3.1-70b")
response = agent.chat("Explain quantum computing briefly")
```

有关完整的 API 用法，请参阅 [Python Library guide](../user-guide/features/code-execution.md)。

---

## Troubleshooting

### Installation Issues

#### `hermes: command not found` after installation

**原因：** 您的 shell 没有重新加载更新后的 PATH。

**解决方案：**
```bash
# 重新加载您的 shell 配置文件
source ~/.bashrc    # bash
source ~/.zshrc     # zsh

# 或启动一个新的终端会话
```

如果仍然无效，请验证安装位置：
```bash
which hermes
ls ~/.local/bin/hermes
```

:::tip
安装程序会将 `~/.local/bin` 添加到您的 PATH 中。如果您使用非标准的 shell 配置，请手动添加 `export PATH="$HOME/.local/bin:$PATH"`。
:::

#### Python version too old

**原因：** Hermes 需要 Python 3.11 或更高版本。

**解决方案：**
```bash
python3 --version   # 检查当前版本

# 安装更新的 Python
sudo apt install python3.12   # Ubuntu/Debian
brew install python@3.12      # macOS
```

安装程序会自动处理这一点 — 如果在手动安装过程中看到此错误，请先升级 Python。

#### `uv: command not found`

**原因：** 未安装 `uv` 包管理器或它不在 PATH 中。

**解决方案：**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
```

#### Permission denied errors during install

**原因：** 没有足够的权限写入安装目录。

**解决方案：**
```bash
# 不要使用 sudo 运行安装程序 — 它安装到 ~/.local/bin
# 如果您之前使用 sudo 安装过，请清理：
sudo rm /usr/local/bin/hermes
# 然后重新运行标准安装程序
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

---

### Provider & Model Issues

#### `/model` only shows one provider / can't switch providers

**原因：** `/model`（在聊天会话中）只能切换您**已经配置过**的提供商。如果您只设置了 OpenRouter，`/model` 就只会显示这个。

**解决方案：** 退出您的会话，然后从终端使用 `hermes model` 添加新的提供商：

```bash
# 先退出 Hermes 聊天会话 (Ctrl+C 或 /quit)

# 运行完整的提供商设置向导
hermes model

# 这允许您：添加提供商、运行 OAuth、输入 API 密钥、配置端点
```

通过 `hermes model` 添加新提供商后，启动一个新的聊天会话 — `/model` 现在将显示您所有配置的提供商。

:::tip 快速参考
| 想做... | 使用 |
|-----------|-----|
| 添加新提供商 | `hermes model` (在终端中) |
| 输入/更改 API 密钥 | `hermes model` (在终端中) |
| 会话中切换模型 | `/model <name>` (在会话中) |
| 切换到不同的已配置提供商 | `/model provider:model` (在会话中) |
:::

#### API key not working

**原因：** 密钥丢失、过期、设置不正确或用于错误的提供商。

**解决方案：**
```bash
# 检查您的配置
hermes config show

# 重新配置您的提供商
hermes model

# 或直接设置
hermes config set OPENROUTER_API_KEY sk-or-v1-xxxxxxxxxxxx
```

:::warning
请确保密钥与提供商匹配。OpenAI 密钥不能用于 OpenRouter，反之亦然。请检查 `~/.hermes/.env` 中是否有冲突的条目。
:::

#### Model not available / model not found

**原因：** 模型标识符不正确或您的提供商不支持该模型。

**解决方案：**
```bash
# 列出提供商可用的模型
hermes model

# 设置一个有效的模型
hermes config set HERMES_MODEL openrouter/nous/hermes-3-llama-3.1-70b

# 或指定会话级别
hermes chat --model openrouter/meta-llama/llama-3.1-70b-instruct
```

#### Rate limiting (429 errors)

**原因：** 您超出了提供商的速率限制。

**解决方案：** 等待片刻再重试。对于持续使用，请考虑：
- 升级您的提供商套餐
- 切换到不同的模型或提供商
- 使用 `hermes chat --provider <alternative>` 将流量路由到不同的后端

#### Context length exceeded

**原因：** 对话过长，超出了模型的上下文窗口，或者 Hermes 检测到模型上下文长度错误。

**解决方案：**
```bash
# 压缩当前会话
/compress

# 或开始一个新的会话
hermes chat

# 使用具有更大上下文窗口的模型
hermes chat --model openrouter/google/gemini-3-flash-preview
```

如果在第一次长时间对话时发生此问题，可能是 Hermes 对您的模型检测到了错误的上下文长度。请检查它检测到的值：

查看 CLI 启动行 — 它显示了检测到的上下文长度（例如，`📊 Context limit: 128000 tokens`）。您也可以在会话期间使用 `/usage` 检查。

要修复上下文检测，请明确设置它：

```yaml
# 在 ~/.hermes/config.yaml 中
model:
  default: your-model-name
  context_length: 131072  # 您模型的实际上下文窗口
```

或者对于自定义端点，按模型添加：

```yaml
custom_providers:
  - name: "My Server"
    base_url: "http://localhost:11434/v1"
    models:
      qwen3.5:27b:
        context_length: 32768
```

有关自动检测的工作原理和所有覆盖选项，请参阅 [Context Length Detection](../integrations/providers.md#context-length-detection)。

---

### Terminal Issues

#### Command blocked as dangerous

**原因：** Hermes 检测到潜在破坏性命令（例如，`rm -rf`、`DROP TABLE`）。这是一个安全功能。

**解决方案：** 当提示时，请审查命令并输入 `y` 进行批准。您还可以：
- 要求代理使用更安全的替代方案
- 在 [Security docs](../user-guide/security.md) 中查看完整的危险模式列表

:::tip
这是正常工作状态 — Hermes 从不静默运行破坏性命令。批准提示会向您显示将执行的确切内容。
:::

#### `sudo` not working via messaging gateway

**原因：** 消息网关在没有交互式终端的情况下运行，因此 `sudo` 无法提示输入密码。

**解决方案：**
- 在消息中使用时避免 `sudo` — 要求代理寻找替代方案
- 如果必须使用 `sudo`，请在 `/etc/sudoers` 中为特定命令配置无需密码的 sudo
- 或切换到终端界面执行管理任务：`hermes chat`

#### Docker backend not connecting

**原因：** Docker daemon 未运行或用户缺乏权限。

**解决方案：**
```bash
# 检查 Docker 是否正在运行
docker info

# 将您的用户添加到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证
docker run hello-world
```

---

### Messaging Issues

#### Bot not responding to messages

**原因：** 机器人未运行、未授权，或您的用户不在允许列表中。

**解决方案：**
```bash
# 检查网关是否正在运行
hermes gateway status

# 启动网关
hermes gateway start

# 检查日志中的错误
cat ~/.hermes/logs/gateway.log | tail -50
```

#### Messages not delivering

**原因：** 网络问题、机器人令牌过期或平台 Webhook 配置错误。

**解决方案：**
- 使用 `hermes gateway setup` 验证您的机器人令牌是否有效
- 检查网关日志：`cat ~/.hermes/logs/gateway.log | tail -50`
- 对于基于 Webhook 的平台（Slack、WhatsApp），确保您的服务器是公开可访问的

#### Allowlist confusion — who can talk to the bot?

**原因：** 授权模式决定了谁可以访问。

**解决方案：**

| 模式 | 工作原理 |
|------|-------------|
| **Allowlist** | 只有配置中列出的用户 ID 可以互动 |
| **DM pairing** | 第一个在私聊中发送消息的用户获得独家访问权 |
| **Open** | 任何人都可以互动（不推荐用于生产环境） |

在 `~/.hermes/config.yaml` 的网关设置下进行配置。有关详细信息，请参阅 [Messaging docs](../user-guide/messaging/index.md)。

#### Gateway won't start

**原因：** 缺少依赖项、端口冲突或配置的令牌错误。

**解决方案：**
```bash
# 安装消息依赖项
pip install "hermes-agent[telegram]"   # 或 [discord], [slack], [whatsapp]

# 检查端口冲突
lsof -i :8080

# 验证配置
hermes config show
```

#### WSL: Gateway keeps disconnecting or `hermes gateway start` fails

**原因：** WSL 的 systemd 支持不可靠。许多 WSL2 安装没有启用 systemd，即使启用了，服务也可能无法在 WSL 重启或 Windows 空闲关闭时保持运行。

**解决方案：** 使用前台模式而不是 systemd 服务：

```bash
# 选项 1: 直接前台模式 (最简单)
hermes gateway run

# 选项 2: 通过 tmux 持久化 (在终端关闭后仍保持运行)
tmux new -s hermes 'hermes gateway run'
# 稍后重新连接: tmux attach -t hermes

# 选项 3: 通过 nohup 后台运行
nohup hermes gateway run > ~/.hermes/logs/gateway.log 2>&1 &
```

如果您仍然想尝试 systemd，请确保它已启用：

1. 打开 `/etc/wsl.conf`（如果不存在则创建）
2. 添加：
   ```ini
   [boot]
   systemd=true
   ```
3. 从 PowerShell 运行：`wsl --shutdown`
4. 重新打开您的 WSL 终端
5. 验证：`systemctl is-system-running` 应显示 "running" 或 "degraded"

:::tip Windows 启动时自动启动
要实现可靠的自动启动，请使用 Windows 任务计划程序在登录时启动 WSL + 网关：
1. 创建一个任务，运行 `wsl -d Ubuntu -- bash -lc 'hermes gateway run'`
2. 设置其在用户登录时触发
:::

#### macOS: Node.js / ffmpeg / other tools not found by gateway

**原因：** launchd 服务继承了一个最小的 PATH (`/usr/bin:/bin:/usr/sbin:/sbin`)，其中不包含 Homebrew、nvm、cargo 或其他用户安装的工具目录。这通常会导致 WhatsApp 桥接（`node not found`）或语音转录（`ffmpeg not found`）失败。

**解决方案：** 网关在您运行 `hermes gateway install` 时捕获了您的 shell PATH。如果您在设置网关后安装了工具，请重新运行安装以捕获更新的 PATH：

```bash
hermes gateway install    # 重新快照您的当前 PATH
hermes gateway start      # 检测更新的 plist 并重新加载
```

您可以通过以下方式验证 plist 是否包含正确的 PATH：
```bash
/usr/libexec/PlistBuddy -c "Print :EnvironmentVariables:PATH" \
  ~/Library/LaunchAgents/ai.hermes.gateway.plist
```

---

### Performance Issues

#### Slow responses

**原因：** 模型过大、API 服务器距离远，或系统提示词包含太多工具。

**解决方案：**
- 尝试使用更快/更小的模型：`hermes chat --model openrouter/meta-llama/llama-3.1-8b-instruct`
- 减少活动的工具集：`hermes chat -t "terminal"`
- 检查到提供商的网络延迟
- 对于本地模型，确保有足够的 GPU VRAM

#### High token usage

**原因：** 对话过长、系统提示词冗长或许多工具调用积累了上下文。

**解决方案：**
```bash
# 压缩对话以减少 token
/compress

# 检查会话 token 使用量
/usage
```

:::tip
在长时间会话中定期使用 `/compress`。它会总结对话历史，显著减少 token 使用量，同时保留上下文。
:::

#### Session getting too long

**原因：** 扩展的对话会积累消息和工具输出，接近上下文限制。

**解决方案：**
```bash
# 压缩当前会话（保留关键上下文）
/compress

# 启动一个带有旧会话参考的新会话
hermes chat

# 如果需要，稍后恢复特定会话
hermes chat --continue
```

---

### MCP Issues

#### MCP server not connecting

**原因：** 未找到服务器二进制文件、命令路径错误或缺少运行时。

**解决方案：**
```bash
# 确保已安装 MCP 依赖项（已包含在标准安装中）
cd ~/.hermes/hermes-agent && uv pip install -e ".[mcp]"

# 对于基于 npm 的服务器，确保 Node.js 可用
node --version
npx --version

# 手动测试服务器
npx -y @modelcontextprotocol/server-filesystem /tmp
```

验证您的 `~/.hermes/config.yaml` MCP 配置：
```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
```

#### Tools not showing up from MCP server

**原因：** 服务器已启动但工具发现失败，工具被配置过滤，或服务器不支持您期望的 MCP 功能。

**解决方案：**
- 检查网关/代理日志中的 MCP 连接错误
- 确保服务器响应 `tools/list` RPC 方法
- 审查该服务器下的任何 `tools.include`、`tools.exclude`、`tools.resources`、`tools.prompts` 或 `enabled` 设置
- 请记住，资源/提示工具仅在会话实际支持这些功能时才注册
- 更改配置后使用 `/reload-mcp`

```bash
# 验证 MCP 服务器是否已配置
hermes config show | grep -A 12 mcp_servers

# 更改配置后重新启动 Hermes 或重新加载 MCP
hermes chat
```

另请参阅：
- [MCP (Model Context Protocol)](/docs/user-guide/features/mcp)
- [Use MCP with Hermes](/docs/guides/use-mcp-with-hermes)
- [MCP Config Reference](/docs/reference/mcp-config-reference)

#### MCP timeout errors

**原因：** MCP 服务器响应过慢，或在执行过程中崩溃。

**解决方案：**
- 如果支持，增加 MCP 服务器配置中的超时时间
- 检查 MCP 服务器进程是否仍在运行
- 对于远程 HTTP MCP 服务器，检查网络连接

:::warning
如果 MCP 服务器在请求过程中崩溃，Hermes 将报告超时。请检查服务器自身的日志（而不仅仅是 Hermes 日志）以诊断根本原因。
:::

---

## Profiles

### How do profiles differ from just setting HERMES_HOME?

Profile 是建立在 `HERMES_HOME` 之上的一个管理层。您*可以*在每次命令前手动设置 `HERMES_HOME=/some/path`，但 Profile 为您处理了所有底层工作：创建目录结构、生成 shell 别名（`hermes-work`）、跟踪 `~/.hermes/active_profile` 中的活动 Profile，以及自动同步所有 Profile 的技能更新。它们还与 Tab 补全集成，这样您就无需记住路径。

### Can two profiles share the same bot token?

不能。每个消息平台（Telegram、Discord 等）都需要独占的机器人令牌。如果两个 Profile 尝试同时使用相同的令牌，第二个网关将无法连接。请为每个 Profile 创建一个单独的机器人 — 对于 Telegram，请联系 [@BotFather](https://t.me/BotFather) 创建额外的机器人。

### Do profiles share memory or sessions?

不能。每个 Profile 都有自己的记忆存储、会话数据库和技能目录。它们是完全隔离的。如果您想使用现有记忆和会话启动一个新的 Profile，请使用 `hermes profile create newname --clone-all` 来复制当前 Profile 的所有内容。

### What happens when I run `hermes update`?

`hermes update` 会拉取最新的代码并**一次性**重新安装依赖项（而不是每次 Profile）。然后它会自动将更新的技能同步到所有 Profile。您只需要运行一次 `hermes update` — 它涵盖了机器上的所有 Profile。

### Can I move a profile to a different machine?

可以。将 Profile 导出为便携式存档，并在另一台机器上导入：

```bash
# 在源机器上
hermes profile export work ./work-backup.tar.gz

# 将文件复制到目标机器，然后：
hermes profile import ./work-backup.tar.gz work
```

导入的 Profile 将包含导出时的所有配置、记忆、会话和技能。如果新机器的设置不同，您可能需要更新路径或重新认证提供商。

### How many profiles can I run?

没有硬性限制。每个 Profile 只是 `~/.hermes/profiles/` 下的一个目录。实际限制取决于您的磁盘空间以及您的系统可以处理的并发网关数量（每个网关都是一个轻量级的 Python 进程）。运行数十个 Profile 是没问题的；每个空闲的 Profile 不会消耗资源。

---

## Workflows & Patterns

### Using different models for different tasks (multi-model workflows)

**场景：** 您使用 GPT-5.4 作为日常主力，但 Gemini 或 Grok 在撰写社交媒体内容方面表现更好。每次手动切换模型非常麻烦。

**解决方案：委托配置 (Delegation config)。** Hermes 可以自动将子代理路由到不同的模型。在 `~/.hermes/config.yaml` 中设置此项：

```yaml
delegation:
  model: "google/gemini-3-flash-preview"   # 子代理使用此模型
  provider: "openrouter"                    # 子代理的提供商
```

现在，当您告诉 Hermes “为我写一个关于 X 的 Twitter 帖子串”并且它生成了一个 `delegate_task` 子代理时，该子代理将在 Gemini 上运行，而不是您的主模型。您的主要对话仍保持在 GPT-5.4 上。

您也可以在提示词中明确指出：“委托一个任务来撰写关于我们产品发布的社交媒体帖子。使用您的子代理进行实际撰写。”代理将使用 `delegate_task`，它会自动拾取委托配置。

对于不涉及委托的单次模型切换，请在 CLI 中使用 `/model`：

```bash
/model google/gemini-3-flash-preview    # 本会话切换
# ... 撰写您的内容 ...
/model openai/gpt-5.4                   # 切回
```

有关委托如何工作的更多信息，请参阅 [Subagent Delegation](../user-guide/features/delegation.md)。

### Running multiple agents on one WhatsApp number (per-chat binding)

**场景：** 在 OpenClaw 中，您将多个独立代理绑定到特定的 WhatsApp 聊天 — 一个用于家庭购物清单群组，另一个用于您的私聊。Hermes 能做到吗？

**当前限制：** Hermes 每个 Profile 都需要自己的 WhatsApp 号码/会话。您不能将多个 Profile 绑定到同一个 WhatsApp 号码的不同聊天 — WhatsApp 桥接（Baileys）对每个号码使用一个已认证的会话。

**变通方法：**

1. **使用单个 Profile 并切换个性。** 创建不同的 `AGENTS.md` 上下文文件，或使用 `/personality` 命令按聊天更改行为。代理会看到它处于哪个聊天中并进行调整。

2. **使用 cron job 处理专业任务。** 对于购物清单跟踪器，设置一个 cron job 来监控特定的聊天并管理清单 — 不需要单独的代理。

3. **使用单独的号码。** 如果您需要真正独立的代理，请为每个 Profile 配备自己的 WhatsApp 号码。Google Voice 等服务提供的虚拟号码可用于此。

4. **改用 Telegram 或 Discord。** 这些平台更自然地支持按聊天绑定 — 每个 Telegram 群组或 Discord 频道都有自己的会话，您可以为每个 Profile 运行多个机器人令牌（每个 Profile 一个）。

有关更多详细信息，请参阅 [Profiles](../user-guide/profiles.md) 和 [WhatsApp setup](../user-guide/messaging/whatsapp.md)。

### Controlling what shows up in Telegram (hiding logs and reasoning)

**场景：** 您在 Telegram 中看到了网关执行日志、Hermes 推理和工具调用详情，而不是仅仅看到最终输出。

**解决方案：** `config.yaml` 中的 `display.tool_progress` 设置控制了显示多少工具活动：

```yaml
display:
  tool_progress: "off"   # 选项: off, new, all, verbose
```

- **`off`** — 只显示最终响应。不显示工具调用、不显示推理、不显示日志。
- **`new`** — 随着发生显示新的工具调用（简短的单行）。
- **`all`** — 显示所有工具活动，包括结果。
- **`verbose`** — 显示完整的详细信息，包括工具参数和输出。

对于消息平台，通常您想要的是 `off` 或 `new`。编辑 `config.yaml` 后，请重启网关以使更改生效。

您也可以使用 `/verbose` 命令（如果启用）按会话切换此设置：

```yaml
display:
  tool_progress_command: true   # 启用网关中的 /verbose
```

### Managing skills on Telegram (slash command limit)

**场景：** Telegram 有 100 个斜杠命令限制，而您的技能超出了这个限制。您想在 Telegram 上禁用不需要的技能，但 `hermes skills config` 的设置似乎没有生效。

**解决方案：** 使用 `hermes skills config` 按平台禁用技能。这会写入 `config.yaml`：

```yaml
skills:
  disabled: []                    # 全局禁用的技能
  platform_disabled:
    telegram: [skill-a, skill-b]  # 仅在 Telegram 上禁用
```

更改后，**请重启网关**（`hermes gateway restart` 或杀死并重新启动）。Telegram 机器人命令菜单在启动时重建。

:::tip
描述非常长的技能在 Telegram 菜单中会被截断到 40 个字符，以保持在载荷大小限制内。如果技能没有出现，可能是总载荷大小问题，而不仅仅是 100 个命令限制 — 禁用不使用的技能有助于解决两者。
:::

### Shared thread sessions (multiple users, one conversation)

**场景：** 您在一个 Telegram 或 Discord 线程中，多个人提到了机器人。您希望该线程中的所有提及都属于一个共享的对话，而不是单独的每个用户会话。

**当前行为：** 在大多数平台上，Hermes 按用户 ID 创建会话，因此每个人都会获得自己的对话上下文。这是出于隐私和上下文隔离的固有设计。

**变通方法：**

1. **使用 Slack。** Slack 会话是按线程键控的，而不是按用户。同一线程中的多个用户共享一个对话 — 这正是您描述的行为。这是最自然的匹配。

2. **使用单个用户的群聊。** 如果一个人是指定的“操作员”，负责转达问题，会话就会保持统一。其他人可以旁观。

3. **使用 Discord 频道。** Discord 会话按频道键控，因此同一频道中的所有用户共享上下文。使用专用的频道进行共享对话。

### Exporting Hermes to another machine

**场景：** 您在一个机器上积累了技能、cron job 和记忆，并希望将所有内容迁移到一个新的专用 Linux 机箱上。

**解决方案：**

1. 在新机器上安装 Hermes Agent：
   ```bash
   curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
   ```

2. 复制您整个 `~/.hermes/` 目录，**除了** `hermes-agent` 子目录（那是代码仓库 — 新的安装有自己的）：
   ```bash
   # 在源机器上
   rsync -av --exclude='hermes-agent' ~/.hermes/ newmachine:~/.hermes/
   ```

   或者使用 Profile 导出/导入：
   ```bash
   # 在源机器上
   hermes profile export default ./hermes-backup.tar.gz

   # 在目标机器上
   hermes profile import ./hermes-backup.tar.gz default
   ```

3. 在新机器上，运行 `hermes setup` 来验证 API 密钥和提供商配置是否正常工作。重新认证任何消息平台（尤其是 WhatsApp，它使用二维码配对）。

`~/.hermes/` 目录包含所有内容：`config.yaml`、`.env`、`SOUL.md`、`memories/`、`skills/`、`state.db` (会话)、`cron/` 和任何自定义插件。代码本身位于 `~/.hermes/hermes-agent/`，并进行全新安装。

### Permission denied when reloading shell after install

**场景：** 运行 Hermes 安装程序后，`source ~/.zshrc` 出现权限拒绝错误。

**原因：** 这通常发生在 `~/.zshrc`（或 `~/.bashrc`）具有不正确的文件权限，或者安装程序无法干净地写入它。这不是 Hermes 特定的问题 — 而是 shell 配置权限问题。

**解决方案：**
```bash
# 检查权限
ls -la ~/.zshrc

# 如果需要，修复权限（应为 -rw-r--r-- 或 644）
chmod 644 ~/.zshrc

# 然后重新加载
source ~/.zshrc

# 或者直接打开一个新的终端窗口 — 它会自动拾取 PATH 更改
```

如果安装程序添加了 PATH 行但权限错误，您可以手动添加它：
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
```

### Error 400 on first agent run

**场景：** 设置完成，但第一次聊天尝试因 HTTP 400 失败。

**原因：** 通常是模型名称不匹配 — 配置的模型在您的提供商上不存在，或者 API 密钥没有访问权限。

**解决方案：**
```bash
# 检查配置了哪些模型和提供商
hermes config show | head -20

# 重新运行模型选择
hermes model

# 或使用已知良好的模型进行测试
hermes chat -q "hello" --model anthropic/claude-sonnet-4.6
```

如果使用 OpenRouter，请确保您的 API 密钥有信用额度。OpenRouter 返回的 400 通常意味着模型需要付费计划或模型 ID 有拼写错误。

---

## Still Stuck?

如果您的问题未在此处涵盖：

1. **搜索现有问题：** [GitHub Issues](https://github.com/NousResearch/hermes-agent/issues)
2. **咨询社区：** [Nous Research Discord](https://discord.gg/nousresearch)
3. **提交 Bug 报告：** 包括您的操作系统、Python 版本 (`python3 --version`)、Hermes 版本 (`hermes --version`) 和完整的错误消息