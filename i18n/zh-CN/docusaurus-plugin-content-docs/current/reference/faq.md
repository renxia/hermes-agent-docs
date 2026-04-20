---
sidebar_position: 3
title: "常见问题解答与故障排除"
description: "Hermes Agent 常见问题的快速解答和解决方案"
---

# 常见问题解答与故障排除

最常见问题和疑问的快速解答及修复方法。

---

## 常见问题解答

### Hermes 支持哪些 LLM 提供商？

Hermes Agent 可与任何兼容 OpenAI 的 API 配合使用。支持的提供商包括：

- **[OpenRouter](https://openrouter.ai/)** — 通过一个 API 密钥访问数百种模型（推荐用于灵活性）
- **Nous Portal** — Nous Research 自己的推理端点
- **OpenAI** — GPT-4o、o1、o3 等
- **Anthropic** — Claude 模型（通过 OpenRouter 或兼容代理）
- **Google** — Gemini 模型（通过 OpenRouter 或兼容代理）
- **z.ai / ZhipuAI** — GLM 模型
- **Kimi / Moonshot AI** — Kimi 模型
- **MiniMax** — 全球和中国端点
- **本地模型** — 通过 [Ollama](https://ollama.com/)、[vLLM](https://docs.vllm.ai/)、[llama.cpp](https://github.com/ggerganov/llama.cpp)、[SGLang](https://github.com/sgl-project/sglang) 或任何兼容 OpenAI 的服务器

使用 `hermes model` 设置您的提供商，或通过编辑 `~/.hermes/.env` 文件进行配置。有关所有提供商密钥的详细信息，请参阅 [环境变量](./environment-variables.md) 参考。

### 它能在 Windows 上运行吗？

**不能原生运行。** Hermes Agent 需要一个类 Unix 环境。在 Windows 上，请安装 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) 并在其中运行 Hermes。标准的安装命令在 WSL2 中完全有效：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

### 它能在 Android / Termux 上运行吗？

是的 — Hermes 现在有一个经过测试的 Termux 安装路径，适用于 Android 手机。

快速安装：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

有关详细的手动步骤、支持的额外功能和当前限制，请参阅 [Termux 指南](../getting-started/termux.md)。

重要注意事项：目前在 Android 上不可用完整的 `.[all]` 额外功能，因为 `voice` 额外功能依赖于 `faster-whisper` → `ctranslate2`，而 `ctranslate2` 不发布 Android 轮子。请使用经过测试的 `.[termux]` 额外功能。

### 我的数据会被发送到任何地方吗？

API 调用**仅发送到您配置的 LLM 提供商**（例如 OpenRouter、您本地的 Ollama 实例）。Hermes Agent 不收集遥测数据、使用数据或分析数据。您的对话、记忆和技能都存储在本地 `~/.hermes/` 目录中。

### 我可以使用它离线运行/使用本地模型吗？

可以。运行 `hermes model`，选择 **自定义端点**，然后输入您的服务器 URL：

```bash
hermes model
# 选择：自定义端点（手动输入 URL）
# API 基础 URL：http://localhost:11434/v1
# API 密钥：ollama
# 模型名称：qwen3.5:27b
# 上下文长度：32768   ← 将此设置为与您的服务器的实际上下文窗口匹配
```

或在 `config.yaml` 中直接配置：

```yaml
model:
  default: qwen3.5:27b
  provider: custom
  base_url: http://localhost:11434/v1
```

Hermes 会在 `config.yaml` 中持久保存端点、提供商和基础 URL，使其在重启后仍然有效。如果您的本地服务器只加载了一个模型，`/model custom` 会自动检测它。您也可以在 config.yaml 中设置 `provider: custom` — 它是一个一等提供商，不是任何其他东西的别名。

这适用于 Ollama、vLLM、llama.cpp 服务器、SGLang、LocalAI 等。有关详细信息，请参阅 [配置指南](../user-guide/configuration.md)。

:::tip Ollama 用户
如果您在 Ollama 中设置了自定义的 `num_ctx`（例如 `ollama run --num_ctx 16384`），请确保在 Hermes 中设置匹配的上下文长度 — Ollama 的 `/api/show` 报告模型的*最大*上下文，而不是您配置的有效的 `num_ctx`。
:::

:::tip 本地模型超时
Hermes 会自动检测本地端点并放宽流式传输超时（读取超时从 120s 提高到 1800s，禁用陈旧流检测）。如果仍然在大上下文中遇到超时，请在 `.env` 中设置 `HERMES_STREAM_READ_TIMEOUT=1800`。有关详细信息，请参阅 [本地 LLM 指南](../guides/local-llm-on-mac.md#timeouts)。
:::

### 它多少钱？

Hermes Agent 本身是**免费且开源的**（MIT 许可证）。您只需为所选提供商的 LLM API 使用付费。本地模型完全免费运行。

### 多个人可以使用同一个实例吗？

可以。[消息网关](../user-guide/messaging/index.md) 允许多个用户通过 Telegram、Discord、Slack、WhatsApp 或 Home Assistant 与同一个 Hermes Agent 实例交互。访问通过白名单（特定用户 ID）和 DM 配对（第一个发送消息的用户获得访问权限）进行控制。

### 记忆和技能有什么区别？

- **记忆**存储**事实** — 代理关于您、您的项目和偏好的知识。记忆会根据相关性自动检索。
- **技能**存储**程序** — 执行某事的逐步说明。当代理遇到类似任务时，会回忆技能。

两者都会跨会话持久化。有关详细信息，请参阅 [记忆](../user-guide/features/memory.md) 和 [技能](../user-guide/features/skills.md)。

### 我可以在自己的 Python 项目中使用它吗？

可以。导入 `AIAgent` 类并以编程方式使用 Hermes：

```python
from run_agent import AIAgent

agent = AIAgent(model="anthropic/claude-opus-4.7")
response = agent.chat("简要解释量子计算")
```

有关完整的 API 使用信息，请参阅 [Python 库指南](../user-guide/features/code-execution.md)。

---

## 故障排除

### 安装问题

#### 安装后出现 `hermes: command not found`

**原因：** 您的 shell 尚未重新加载更新的 PATH。

**解决方案：**
```bash
# 重新加载您的 shell 配置文件
source ~/.bashrc    # bash
source ~/.zshrc     # zsh

# 或者启动一个新的终端会话
```

如果仍然无效，请验证安装位置：
```bash
which hermes
ls ~/.local/bin/hermes
```

:::tip
安装程序会将 `~/.local/bin` 添加到您的 PATH 中。如果您使用的是非标准 shell 配置，请手动添加 `export PATH="$HOME/.local/bin:$PATH"`。
:::

#### Python 版本太旧

**原因：** Hermes 需要 Python 3.11 或更高版本。

**解决方案：**
```bash
python3 --version   # 检查当前版本

# 安装较新的 Python
sudo apt install python3.12   # Ubuntu/Debian
brew install python@3.12      # macOS
```

安装程序会自动处理此问题 — 如果您在手动安装期间看到此错误，请先升级 Python。

#### `uv: command not found`

**原因：** 包管理器 `uv` 未安装或不在 PATH 中。

**解决方案：**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
```

#### 安装期间的权限被拒绝错误

**原因：** 写入安装目录的权限不足。

**解决方案：**
```bash
# 不要对安装程序使用 sudo — 它会安装到 ~/.local/bin
# 如果您之前使用 sudo 安装了，请清理：
sudo rm /usr/local/bin/hermes
# 然后重新运行标准安装程序
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

---

### 提供商和模型问题

#### `/model` 只显示一个提供商/无法切换提供商

**原因：** `/model`（在聊天会话内部）只能在与您**已配置**的提供商之间切换。如果您只设置了 OpenRouter，那么 `/model` 只会显示它。

**解决方案：** 退出您的会话，并使用 `hermes model` 从终端添加新的提供商：

```bash
# 首先退出 Hermes 聊天会话（Ctrl+C 或 /quit）

# 运行完整的提供商设置向导
hermes model

# 这将允许您：添加提供商、运行 OAuth、输入 API 密钥、配置端点
```

通过 `hermes model` 添加新提供商后，启动新的聊天会话 — `/model` 现在将显示您配置的所有提供商。

:::tip 快速参考
| 想要... | 使用 |
|-----------|-----|
| 添加新提供商 | `hermes model`（从终端） |
| 输入/更改 API 密钥 | `hermes model`（从终端） |
| 在会话中切换模型 | `/model <name>`（在会话内） |
| 切换到不同的已配置提供商 | `/model provider:model`（在会话内） |
:::

#### API 密钥不起作用

**原因：** 密钥缺失、过期、设置不正确或针对错误的提供商。

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
确保密钥与提供商匹配。OpenAI 密钥不能用于 OpenRouter，反之亦然。检查 `~/.hermes/.env` 中的冲突条目。
:::

#### 模型不可用/找不到模型

**原因：** 模型标识符不正确或在该提供商上不可用。

**解决方案：**
```bash
# 列出您提供商可用的模型
hermes model

# 设置有效模型
hermes config set HERMES_MODEL anthropic/claude-opus-4.7

# 或按会话指定
hermes chat --model openrouter/meta-llama/llama-3.1-70b-instruct
```

#### 速率限制（429 错误）

**原因：** 您已超过提供商的速率限制。

**解决方案：** 稍等片刻后重试。对于持续使用，请考虑：
- 升级您的提供商计划
- 切换到不同的模型或提供商
- 使用 `hermes chat --provider <alternative>` 路由到不同的后端

#### 超出上下文长度

**原因：** 对话太长，超出了模型的上下文窗口，或者 Hermes 为您的模型检测到了错误的上下文长度。

**解决方案：**
```bash
# 压缩当前会话
/compress

# 或开始一个新会话
hermes chat

# 使用具有更大上下文窗口的模型
hermes chat --model openrouter/google/gemini-3-flash-preview
```

如果这在第一次长对话时发生，Hermes 可能为您的模型检测到了错误的上下文长度。检查它检测到了什么：

查看 CLI 启动行 — 它显示了检测到的上下文长度（例如 `📊 上下文限制：128000 tokens`）。您也可以在会话期间使用 `/usage` 进行检查。

要修复上下文检测，请明确设置：

```yaml
# 在 ~/.hermes/config.yaml 中
model:
  default: your-model-name
  context_length: 131072  # 您模型的实际上下文窗口
```

或对于自定义端点，每个模型单独添加：

```yaml
custom_providers:
  - name: "My Server"
    base_url: "http://localhost:11434/v1"
    models:
      qwen3.5:27b:
        context_length: 32768
```

有关自动检测的工作原理和所有覆盖选项的详细信息，请参阅 [上下文长度检测](../integrations/providers.md#context-length-detection)。

---

### 终端问题

#### 命令被阻止为危险

**原因：** Hermes 检测到潜在的破坏性命令（例如 `rm -rf`、`DROP TABLE`）。这是安全功能。

**解决方案：** 当提示时，审查命令并键入 `y` 批准它。您也可以：
- 要求代理使用更安全的替代方案
- 在 [安全文档](../user-guide/security.md) 中查看所有危险模式的完整列表

:::tip
这是预期的工作方式 — Hermes 绝不会静默运行破坏性命令。批准提示会向您显示将要执行的确切内容。
:::

#### 通过消息网关无法使用 `sudo`

**原因：** 消息网关在没有交互式终端的情况下运行，因此 `sudo` 无法提示输入密码。

**解决方案：**
- 在消息中避免使用 `sudo` — 要求代理寻找替代方案
- 如果必须使用 `sudo`，请在 `/etc/sudoers` 中为特定命令配置免密码 sudo
- 或为管理任务切换到终端界面：`hermes chat`

#### Docker 后端无法连接

**原因：** Docker 守护进程未运行或用户缺乏权限。

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

### 消息问题

#### 机器人没有响应消息

**原因：** 机器人未运行、未授权，或您的用户不在白名单中。

**解决方案：**
```bash
# 检查网关是否正在运行
hermes gateway status

# 启动网关
hermes gateway start

# 检查错误日志
cat ~/.hermes/logs/gateway.log | tail -50
```

#### 消息无法传递

**原因：** 网络问题、机器人令牌过期或平台 webhook 配置错误。

**解决方案：**
- 使用 `hermes gateway setup` 验证您的机器人令牌是否有效
- 检查网关日志：`cat ~/.hermes/logs/gateway.log | tail -50`
- 对于基于 webhook 的平台（Slack、WhatsApp），确保您的服务器可公开访问

#### 白名单困惑 — 谁可以和机器人交谈？

**原因：** 授权模式决定了谁可以获得访问权限。

**解决方案：**

| 模式 | 工作原理 |
|------|-------------|
| **白名单** | 只有配置中列出的用户 ID 可以交互 |
| **DM 配对** | 第一个在 DM 中发送消息的用户获得独占访问权限 |
| **开放** | 任何人都可以交互（不建议用于生产环境） |

在 `~/.hermes/config.yaml` 中配置，位于您的网关设置下。有关详细信息，请参阅 [消息文档](../user-guide/messaging/index.md)。

#### 网关无法启动

**原因：** 缺少依赖项、端口冲突或令牌配置错误。

**解决方案：**
```bash
# 安装消息依赖项
pip install "hermes-agent[telegram]"   # 或 [discord]、[slack]、[whatsapp]

# 检查端口冲突
lsof -i :8080

# 验证配置
hermes config show
```

#### WSL：网关不断断开连接或 `hermes gateway start` 失败

**原因：** WSL 的 systemd 支持不可靠。许多 WSL2 安装没有启用 systemd，即使启用了，服务也可能无法在 WSL 重启或 Windows 空闲关机后存活。

**解决方案：** 使用前台模式而不是 systemd 服务：

```bash
# 选项 1：直接前台运行（最简单）
hermes gateway run

# 选项 2：通过 tmux 保持持久（在终端关闭后存活）
tmux new -s hermes 'hermes gateway run'
# 稍后重新连接：tmux attach -t hermes

# 选项 3：通过 nohup 后台运行
nohup hermes gateway run > ~/.hermes/logs/gateway.log 2>&1 &
```

如果您仍想尝试 systemd，请确保其已启用：

1. 打开 `/etc/wsl.conf`（如果不存在则创建）
2. 添加：
   ```ini
   [boot]
   systemd=true
   ```
3. 从 PowerShell 运行：`wsl --shutdown`
4. 重新打开您的 WSL 终端
5. 验证：`systemctl is-system-running` 应显示 "running" 或 "degraded"

:::tip 在 Windows 启动时自动启动
为了可靠的自动启动，使用 Windows 任务计划程序在登录时启动 WSL + 网关：
1. 创建一个运行 `wsl -d Ubuntu -- bash -lc 'hermes gateway run'` 的任务
2. 将其设置为在用户登录时触发
:::

#### macOS：Node.js / ffmpeg / 其他工具未被网关找到

**原因：** launchd 服务继承一个最小化的 PATH（`/usr/bin:/bin:/usr/sbin:/sbin`），不包含 Homebrew、nvm、cargo 或其他用户安装的工具目录。这通常会破坏 WhatsApp 桥接（`node not found`）或语音转录（`ffmpeg not found`）。

**解决方案：** 网关在您运行 `hermes gateway install` 时会捕获您的 shell PATH。如果您在安装工具后设置了网关，请重新运行安装以捕获更新的 PATH：

```bash
hermes gateway install    # 重新快照您当前的 PATH
hermes gateway start      # 检测更新的 plist 并重新加载
```

您可以验证 plist 是否具有正确的 PATH：
```bash
/usr/libexec/PlistBuddy -c "Print :EnvironmentVariables:PATH" \
  ~/Library/LaunchAgents/ai.hermes.gateway.plist
```

---

### 性能问题

#### 响应缓慢

**原因：** 大型模型、遥远的 API 服务器或包含许多工具的繁重系统提示。

**解决方案：**
- 尝试更快的/较小的模型：`hermes chat --model openrouter/meta-llama/llama-3.1-8b-instruct`
- 减少活动工具集：`hermes chat -t "terminal"`
- 检查到您提供商的网络延迟
- 对于本地模型，确保有足够的 GPU VRAM

#### 高 token 使用量

**原因：** 长对话、冗长的系统提示或许多工具调用累积上下文。

**解决方案：**
```bash
# 压缩对话以减少 token
/compress

# 检查会话 token 使用情况
/usage
```

:::tip
在长会话期间定期使用 `/compress`。它会总结对话历史并显著减少 token 使用量，同时保留关键上下文。
:::

#### 会话过长

**原因：** 扩展的对话累积消息和工具输出，接近上下文限制。

**解决方案：**
```bash
# 压缩当前会话（保留关键上下文）
/compress

# 开始一个新会话，引用旧会话
hermes chat

# 稍后如果需要，可以恢复特定会话
hermes chat --continue
```

---

### MCP 问题

#### MCP 服务器无法连接

**原因：** 服务器二进制文件未找到、命令路径错误或运行时缺失。

**解决方案：**
```bash
# 确保 MCP 依赖项已安装（标准安装中已包含）
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

#### 来自 MCP 服务器的工具未显示

**原因：** 服务器已启动但工具发现失败，工具被配置过滤掉，或服务器不支持您期望的 MCP 功能。

**解决方案：**
- 检查网关/代理日志中的 MCP 连接错误
- 确保服务器对 `tools/list` RPC 方法有响应
- 审查该服务器下的任何 `tools.include`、`tools.exclude`、`tools.resources`、`tools.prompts` 或 `enabled` 设置
- 请记住，资源/提示实用工具仅在会话实际支持这些功能时才注册
- 更改配置后使用 `/reload-mcp`

```bash
# 验证 MCP 服务器配置
hermes config show | grep -A 12 mcp_servers

# 更改配置后重新启动 Hermes 或重新加载 MCP
hermes chat
```

另请参阅：
- [MCP (Model Context Protocol)](/docs/user-guide/features/mcp)
- [在 Hermes 中使用 MCP](/docs/guides/use-mcp-with-hermes)
- [MCP 配置参考](/docs/reference/mcp-config-reference)

#### MCP 超时错误

**原因：** MCP 服务器响应缓慢或执行期间崩溃。

**解决方案：**
- 如果支持，在 MCP 服务器配置中增加超时
- 检查 MCP 服务器进程是否仍在运行
- 对于远程 HTTP MCP 服务器，检查网络连接

:::warning
如果 MCP 服务器在请求中途崩溃，Hermes 将报告超时。请检查服务器自身的日志（不仅仅是 Hermes 日志）以诊断根本原因。
:::

---

## 配置文件

### 配置文件与仅设置 HERMES_HOME 有何不同？

配置文件是 `HERMES_HOME` 之上的受管层。您可以*手动*在每个命令前设置 `HERMES_HOME=/some/path`，但配置文件为您处理所有底层工作：创建目录结构、生成 shell 别名（`hermes-work`）、跟踪 `~/.hermes/active_profile` 中的活动配置文件，并自动在所有配置文件中同步技能更新。它们还与制表符补全集成，因此您无需记住路径。

### 两个配置文件可以使用相同的机器人令牌吗？

不可以。每个消息平台（Telegram、Discord 等）都需要对机器人令牌的独占访问权限。如果两个配置文件尝试同时使用同一令牌，第二个网关将无法连接。请为每个配置文件创建单独的机器人 — 对于 Telegram，请与 [@BotFather](https://t.me/BotFather) 交谈以制作额外的机器人。

### 配置文件共享内存或会话吗？

不可以。每个配置文件都有自己的内存存储、会话数据库和技能目录。它们是完全隔离的。如果您希望使用现有内存和会话启动新配置文件，请使用 `hermes profile create newname --clone-all` 从当前配置文件复制所有内容。

### 当我运行 `hermes update` 时会发生什么？

`hermes update` 拉取最新代码并**一次**重新安装依赖项（而不是每个配置文件）。然后它会自动将所有配置文件同步更新的技能。您只需要运行一次 `hermes update` — 它会涵盖机器上的每个配置文件。

### 我可以将配置文件移动到另一台机器吗？

可以。将配置文件导出为可移植归档文件，然后在另一台机器上导入：

```bash
# 在源机器上
hermes profile export work ./work-backup.tar.gz

# 将文件复制到目标机器，然后：
hermes profile import ./work-backup.tar.gz work
```

导入的配置文件将拥有导出时的所有配置、内存、会话和技能。如果新机器有不同的设置，您可能需要更新路径或重新向提供商认证。

### 我可以运行多少个配置文件？

没有硬性限制。每个配置文件只是 `~/.hermes/profiles/` 下的一个目录。实际限制取决于您的磁盘空间和系统可以处理的并发网关数量（每个网关是一个轻量级 Python 进程）。运行数十个配置文件是可以的；每个空闲配置文件不使用任何资源。

---

## 工作流和模式

### 为不同任务使用不同模型（多模型工作流）

**场景：** 您使用 GPT-5.4 作为日常驱动程序，但 Gemini 或 Grok 撰写社交媒体内容更好。每次手动切换模型都很繁琐。

**解决方案：委托配置。** Hermes 可以将子代理自动路由到不同的模型。在 `~/.hermes/config.yaml` 中设置：

```yaml
delegation:
  model: "google/gemini-3-flash-preview"   # 子代理使用此模型
  provider: "openrouter"                    # 子代理的提供商
```

现在当您告诉 Hermes "为我写一篇关于 X 的 Twitter 线程" 并它生成一个 `delegate_task` 子代理时，该子代理将在 Gemini 上运行，而不是您的主模型。您的主要对话保持在 GPT-5.4 上。

您也可以在提示中明确说明：*"将撰写社交媒体帖子关于我们的产品发布委托给子代理。让子代理完成实际写作。"* 代理将使用 `delegate_task`，它会自动获取委托配置。

对于不使用委托的一次性模型切换，请在 CLI 中使用 `/model`：

```bash
/model google/gemini-3-flash-preview    # 为此会话切换
# ... 撰写您的内容 ...
/model openai/gpt-5.4                   # 切换回来
```

有关委托如何工作的更多信息，请参阅 [子代理委托](../user-guide/features/delegation.md)。

### 在单个 WhatsApp 号码上运行多个代理（每聊天生绑定）

**场景：** 在 OpenClaw 中，您有多个独立代理绑定到特定的 WhatsApp 聊天 — 一个用于家庭购物清单群组，另一个用于您的私人聊天。Hermes 可以实现这个吗？

**当前限制：** Hermes 配置文件每个都需要自己的 WhatsApp 号码/会话。您无法将多个配置文件绑定到同一 WhatsApp 号码的不同聊天 — WhatsApp 桥接（Baileys）每个号码使用一个认证的会话。

**变通方法：**

1. **使用单个配置文件进行个性切换。** 创建不同的 `AGENTS.md` 上下文文件或使用 `/personality` 命令根据聊天改变行为。代理可以看到它在哪个聊天中并可以适应。

2. **使用 cron 作业进行专门任务。** 对于购物清单跟踪器，设置一个监控特定聊天的 cron 作业来管理清单 — 不需要单独的代理。

3. **使用不同的号码。** 如果您需要真正独立的代理，请将每个配置文件与自己的 WhatsApp 号码配对。Google Voice 等服务提供的虚拟号码对此很有用。

4. **使用 Telegram 或 Discord 代替。** 这些平台更自然地支持每聊天生绑定 — 每个 Telegram 群组或 Discord 频道都有自己的会话，您可以在同一账户上运行多个机器人令牌（每个配置文件一个）。

有关更多详细信息，请参阅 [配置文件](../user-guide/profiles.md) 和 [WhatsApp 设置](../user-guide/messaging/whatsapp.md)。

### 控制在 Telegram 中显示的内容（隐藏日志和推理）

**场景：** 您在 Telegram 中看到网关执行日志、Hermes 推理和工具调用详情，而不是最终输出。

**解决方案：** `config.yaml` 中的 `display.tool_progress` 设置控制显示多少工具活动：

```yaml
display:
  tool_progress: "off"   # 选项：off、new、all、verbose
```

- **`off`** — 仅最终响应。无工具调用、无推理、无日志。
- **`new`** — 显示新工具调用（简短单行）。
- **`all`** — 显示所有工具活动，包括结果。
- **`verbose`** — 完整详情，包括工具参数和输出。

对于消息平台，通常 `off` 或 `new` 是您想要的。编辑 `config.yaml` 后，重新启动网关以使更改生效。

您也可以在会话中通过 `/verbose` 命令切换此设置（如果启用）：

```yaml
display:
  tool_progress_command: true   # 在网关中启用 /verbose
```

### 管理 Telegram 上的技能（斜杠命令限制）

**场景：** Telegram 有 100 个斜杠命令的限制，您的技能正在超过它。您想在 Telegram 上禁用不需要的技能，但 `hermes skills config` 设置似乎没有效果。

**解决方案：** 使用 `hermes skills config` 按平台禁用技能。这会写入 `config.yaml`：

```yaml
skills:
  disabled: []                    # 全局禁用的技能
  platform_disabled:
    telegram: [skill-a, skill-b]  # 仅在 telegram 上禁用
```

更改后，**重新启动网关**（`hermes gateway restart` 或杀死并重新启动）。Telegram 机器人命令菜单在启动时重建。

:::tip
技能描述非常长的技能在 Telegram 菜单中被截断为 40 个字符，以保持在有效载荷大小限制内。如果技能没有出现，可能是总有效载荷大小问题而不是 100 命令计数限制 — 禁用未使用的技能有助于解决这两个问题。
:::

### 共享线程会话（多人，一个对话）

**场景：** 您在 Telegram 或 Discord 线程中有多个用户提及机器人。您希望该线程中的所有提及都属于一个共享对话，而不是每个用户的单独会话。

**当前行为：** Hermes 在大多数平台上按用户 ID 创建会话，因此每个人都有自己的对话上下文。这是出于隐私和上下文隔离的设计。

**变通方法：**

1. **使用 Slack。** Slack 会话是按线程而不是用户键入的。同一线程中的多个用户共享一个对话 — 这正是您描述的行为。这是最自然的匹配。

2. **使用单个用户群组聊天。** 如果一个人是 designated "操作员" 转发问题，会话保持统一。其他人可以阅读。

3. **使用 Discord 频道。** Discord 会话是按频道键入的，因此同一频道中的所有用户共享上下文。使用专用频道进行共享对话。

### 将 Hermes 导出到其他机器

**场景：** 您在机器上建立了技能、cron 作业和记忆，并希望将所有内容移动到新的专用 Linux 盒子。

**解决方案：**

1. 在新机器上安装 Hermes Agent：
   ```bash
   curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
   ```

2. 复制整个 `~/.hermes/` 目录**除了** `hermes-agent` 子目录（那是代码仓库 — 新安装有自己的）：
   ```bash
   # 在源机器上
   rsync -av --exclude='hermes-agent' ~/.hermes/ newmachine:~/.hermes/
   ```

   或使用配置文件导出/导入：
   ```bash
   # 在源机器上
   hermes profile export default ./hermes-backup.tar.gz

   # 在目标机器上
   hermes profile import ./hermes-backup.tar.gz default
   ```

3. 在新机器上运行 `hermes setup` 验证 API 密钥和提供商配置是否正常工作。重新认证任何消息平台（特别是 WhatsApp，它使用 QR 配对）。

`~/.hermes/` 目录包含所有内容：`config.yaml`、`.env`、`SOUL.md`、`memories/`、`skills/`、`state.db`（会话）、`cron/` 和任何自定义插件。代码本身位于 `~/.hermes/hermes-agent/` 中，并会新鲜安装。

### 安装后在重新加载 shell 时出现权限被拒绝

**场景：** 运行 Hermes 安装程序后，`source ~/.zshrc` 给出权限被拒绝错误。

**原因：** 这通常发生在 `~/.zshrc`（或 `~/.bashrc`）具有不正确的文件权限时，或者安装程序无法干净地写入它时。这不是 Hermes 特有的问题 — 它是 shell 配置权限问题。

**解决方案：**
```bash
# 检查权限
ls -la ~/.zshrc

# 如果需要请修复（应该是 -rw-r--r-- 或 644）
chmod 644 ~/.zshrc

# 然后重新加载
source ~/.zshrc

# 或者只是打开一个新的终端窗口 — 它会自动获取 PATH 更改
```

如果安装程序添加了 PATH 行但权限错误，您可以手动添加：
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
```

### 首次运行代理时出现错误 400

**场景：** 设置完成得很好，但第一次聊天尝试失败并出现 HTTP 400。

**原因：** 通常是模型名称不匹配 — 配置模型在您的提供商上不存在，或者 API 密钥无权访问它。

**解决方案：**
```bash
# 检查配置了哪些模型和提供商
hermes config show | head -20

# 重新运行模型选择
hermes model

# 或用已知的好模型测试
hermes chat -q "hello" --model anthropic/claude-opus-4.7
```

如果使用 OpenRouter，请确保您的 API 密钥有信用额度。OpenRouter 的 400 通常意味着模型需要付费计划或模型 ID 有拼写错误。

---

## 仍然卡住了？

如果您的未在此处涵盖：

1. **搜索现有问题：** [GitHub Issues](https://github.com/NousResearch/hermes-agent/issues)
2. **询问社区：** [Nous Research Discord](https://discord.gg/nousresearch)
3. **提交错误报告：** 包括您的操作系统、Python 版本（`python3 --version`）、Hermes 版本（`hermes --version`）和完整的错误消息