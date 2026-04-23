```markdown
sidebar_position: 3
title: "常见问题解答和故障排除"
description: "Hermes Agent 的常见问题和解决方案"
---

# 常见问题解答和故障排除

针对最常见问题的快速解答和修复方法。

---

## 常见问题

### Hermes 支持哪些 LLM 提供商？

Hermes Agent 与任何兼容 OpenAI 的 API 配合使用。支持的提供商包括：

- **[OpenRouter](https://openrouter.ai/)** — 通过一个 API 密钥访问数百种模型（推荐，灵活性高）
- **Nous Portal** — Nous Research 自己的推理端点
- **OpenAI** — GPT-4o、o1、o3 等
- **Anthropic** — Claude 模型（通过 OpenRouter 或兼容代理）
- **Google** — Gemini 模型（通过 OpenRouter 或兼容代理）
- **z.ai / ZhipuAI** — GLM 模型
- **Kimi / Moonshot AI** — Kimi 模型
- **MiniMax** — 全球和中国端点
- **本地模型** — 通过 [Ollama](https://ollama.com/)、[vLLM](https://docs.vllm.ai/)、[llama.cpp](https://github.com/ggerganov/llama.cpp)、[SGLang](https://github.com/sgl-project/sglang) 或任何兼容 OpenAI 的服务器

使用 `hermes model` 设置你的提供商，或通过编辑 `~/.hermes/.env` 文件进行配置。有关所有提供商密钥的参考，请参见 [环境变量](./environment-variables.md)。

### 它在 Windows 上运行吗？

**不能原生运行。** Hermes Agent 需要一个类 Unix 环境。在 Windows 上，请安装 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)，并在其中运行 Hermes。标准的安装命令在 WSL2 中完美运行：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

### 它在 Android / Termux 上运行吗？

是的 — Hermes 现在有一个经过测试的 Termux 安装路径，适用于 Android 手机。

快速安装：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

有关详细的操作步骤、支持的扩展以及当前限制，请参见 [Termux 指南](../getting-started/termux.md)。

重要提示：完整的 `.[all]` 扩展在当前 Android 上不可用，因为 `voice` 扩展依赖于 `faster-whisper` → `ctranslate2`，而 `ctranslate2` 不发布 Android 轮子。请使用经过测试的 `.[termux]` 扩展。

### 我的数据会被发送到哪里？

API 调用**仅发送到你配置的 LLM 提供商**（例如 OpenRouter、你的本地 Ollama 实例）。Hermes Agent 不收集遥测数据、使用数据或分析信息。你的对话、记忆和技能都存储在本地 `~/.hermes/` 目录中。

### 我可以使用它离线/使用本地模型吗？

可以。运行 `hermes model`，选择 **自定义端点**，然后输入你的服务器 URL：

```bash
hermes model
# 选择：自定义端点（手动输入 URL）
# API 基础 URL：http://localhost:11434/v1
# API 密钥：ollama
# 模型名称：qwen3.5:27b
# 上下文长度：32768   ← 将此设置为与你的服务器的实际上下文窗口匹配
```

或者在 `config.yaml` 中直接配置：

```yaml
model:
  default: qwen3.5:27b
  provider: custom
  base_url: http://localhost:11434/v1
```

Hermes 会将端点、提供商和基础 URL 持久化到 `config.yaml` 中，以便在重启后保留。如果你的本地服务器只加载了一个模型，`/model custom` 会自动检测它。你还可以在 config.yaml 中设置 `provider: custom` — 它是一个一等提供商，而不是其他东西的别名。

这适用于 Ollama、vLLM、llama.cpp 服务器、SGLang、LocalAI 等。有关详细信息，请参见 [配置指南](../user-guide/configuration.md)。

:::tip Ollama 用户
如果你在 Ollama 中设置了自定义的 `num_ctx`（例如 `ollama run --num_ctx 16384`），请确保在 Hermes 中设置匹配的上下文长度 — Ollama 的 `/api/show` 报告模型的*最大*上下文，而不是你配置的有效的 `num_ctx`。
:::

:::tip 本地模型的超时问题
Hermes 会自动检测本地端点并放宽流式传输超时（读取超时从 120s 提高到 1800s，停用陈旧流检测）。如果仍然对非常大的上下文遇到超时，请在 `.env` 中设置 `HERMES_STREAM_READ_TIMEOUT=1800`。有关详细信息，请参见 [本地 LLM 指南](../guides/local-llm-on-mac.md#timeouts)。
:::

### 它需要多少钱？

Hermes Agent 本身是**免费且开源的**（MIT 许可证）。你只需为所选提供商的 LLM API 使用付费。本地模型完全免费运行。

### 多人可以使用一个实例吗？

可以。[消息网关](../user-guide/messaging/index.md) 允许多个用户通过 Telegram、Discord、Slack、WhatsApp 或 Home Assistant 与同一个 Hermes Agent 实例交互。访问通过允许列表（特定用户 ID）和私信配对（第一个私信的用户获得访问权限）进行控制。

### 内存和技能有什么区别？

- **内存** 存储**事实** — 代理关于你、你的项目和偏好的知识。内存会根据相关性自动检索。
- **技能** 存储**程序** — 执行某事的逐步说明。当代理遇到类似任务时，会回忆技能。

两者都会跨会话持久化。有关详细信息，请参见 [内存](../user-guide/features/memory.md) 和 [技能](../user-guide/features/skills.md)。

### 我可以在自己的 Python 项目中使用它吗？

可以。导入 `AIAgent` 类并以编程方式使用 Hermes：

```python
from run_agent import AIAgent

agent = AIAgent(model="anthropic/claude-opus-4.7")
response = agent.chat("简要解释量子计算")
```

请参见 [Python 库指南](../user-guide/features/code-execution.md) 以获取完整的 API 用法。

---

## 故障排除

### 安装问题

#### 安装后出现 `hermes: command not found`

**原因：** 你的 shell 尚未重新加载更新的 PATH。

**解决方法：**
```bash
# 重新加载你的 shell 配置文件
source ~/.bashrc    # bash
source ~/.zshrc     # zsh

# 或者启动一个新的终端会话
```

如果仍然不起作用，请验证安装位置：
```bash
which hermes
ls ~/.local/bin/hermes
```

:::tip
安装程序将 `~/.local/bin` 添加到你的 PATH 中。如果你使用的是非标准 shell 配置，请手动添加 `export PATH="$HOME/.local/bin:$PATH"`。
:::

#### Python 版本太旧

**原因：** Hermes 需要 Python 3.11 或更高版本。

**解决方法：**
```bash
python3 --version   # 检查当前版本

# 安装较新的 Python
sudo apt install python3.12   # Ubuntu/Debian
brew install python@3.12      # macOS
```

安装程序会自动处理此问题 — 如果你在手动安装时看到此错误，请先升级 Python。

#### 终端命令显示 `node: command not found`（或 `nvm`、`pyenv`、`asdf` 等）

**原因：** Hermes 通过在启动时运行一次 `bash -l` 来构建每个会话的环境快照。Bash 登录 shell 会读取 `/etc/profile`、`~/.bash_profile` 和 `~/.profile`，但**不会加载 `~/.bashrc`** — 因此安装在那里（`nvm`、`asdf`、`pyenv`、`cargo`、自定义 `PATH` 导出）的工具对快照保持不可见。这在 Hermes 在 systemd 下运行或在最小 shell 中运行（其中没有任何内容预加载交互式 shell 配置文件）时最常见。

**解决方法：** Hermes 默认会自动加载 `~/.bashrc`。如果这还不够 — 例如你是 zsh 用户，其 PATH 位于 `~/.zshrc`，或你从独立文件初始化 `nvm` — 请在 `~/.hermes/config.yaml` 中列出要加载的额外文件：

```yaml
terminal:
  shell_init_files:
    - ~/.zshrc                     # zsh 用户：将 zsh 管理的 PATH 拉入 bash 快照
    - ~/.nvm/nvm.sh                # 直接 nvm 初始化（无论 shell 如何都有效）
    - /etc/profile.d/cargo.sh      # 系统范围的 rc 文件
  # 当设置此列表时，默认的 `~/.bashrc` 自动加载不会被添加 —
  # 如果你想要两者，请显式包含它：
  #   - ~/.bashrc
  #   - ~/.zshrc
```

缺失的文件会被静默跳过。加载发生在 bash 中，因此依赖 zsh-only 语法的文件可能会出错 — 如果担心这一点，请只加载 PATH 设置部分（例如直接加载 nvm 的 `nvm.sh`）而不是整个 rc 文件。

要禁用自动加载行为（仅限严格的登录 shell 语义）：

```yaml
terminal:
  auto_source_bashrc: false
```

#### `uv: command not found`

**原因：** 包管理器 `uv` 未安装或不在 PATH 中。

**解决方法：**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
```

#### 安装期间的权限被拒绝错误

**原因：** 写入安装目录的权限不足。

**解决方法：**
```bash
# 不要对安装程序使用 sudo — 它安装到 ~/.local/bin
# 如果你之前使用 sudo 安装了，请清理：
sudo rm /usr/local/bin/hermes
# 然后重新运行标准安装程序
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

---

### 提供商和模型问题

#### `/model` 只显示一个提供商/无法切换提供商

**原因：** `/model`（在聊天会话内部）只能在你**已经配置过**的提供商之间切换。如果你只设置了 OpenRouter，那么 `/model` 只会显示它。

**解决方法：** 退出你的会话，然后从终端使用 `hermes model` 添加新的提供商：

```bash
# 首先退出 Hermes 聊天会话（Ctrl+C 或 /quit）

# 运行完整的提供商设置向导
hermes model

# 这将让你：添加提供商、运行 OAuth、输入 API 密钥、配置端点
```

通过 `hermes model` 添加新提供商后，启动一个新的聊天会话 — `/model` 现在将显示你配置的所有提供商。

:::tip 快速参考
| 你想... | 使用 |
|-----------|-----|
| 添加新提供商 | `hermes model`（从终端） |
| 输入/更改 API 密钥 | `hermes model`（从终端） |
| 在会话中切换模型 | `/model <name>`（在会话中） |
| 切换到不同的已配置提供商 | `/model provider:model`（在会话中） |
:::

#### API 密钥不起作用

**原因：** 密钥缺失、过期、设置不正确，或为错误的提供商。

**解决方法：**
```bash
# 检查你的配置
hermes config show

# 重新配置你的提供商
hermes model

# 或直接设置
hermes config set OPENROUTER_API_KEY sk-or-v1-xxxxxxxxxxxx
```

:::warning
确保密钥与提供商匹配。OpenAI 密钥对 OpenRouter 无效，反之亦然。检查 `~/.hermes/.env` 中是否有冲突的条目。
:::

#### 模型不可用/找不到模型

**原因：** 模型标识符不正确或在你提供商上不可用。

**解决方法：**
```bash
# 列出你提供商可用的模型
hermes model

# 设置有效模型
hermes config set HERMES_MODEL anthropic/claude-opus-4.7

# 或在会话中指定
hermes chat --model openrouter/meta-llama/llama-3.1-70b-instruct
```

#### 速率限制（429 错误）

**原因：** 你已经超过了提供商的速率限制。

**解决方法：** 稍等片刻再重试。对于持续使用，请考虑：
- 升级你的提供商计划
- 切换到不同的模型或提供商
- 使用 `hermes chat --provider <alternative>` 路由到不同的后端

#### 超出上下文长度

**原因：** 对话太长，超出了模型的上下文窗口，或者 Hermes 为你的模型检测到了错误的上下文长度。

**解决方法：**
```bash
# 压缩当前会话
/compress

# 或开始一个新会话
hermes chat

# 使用具有更大上下文窗口的模型
hermes chat --model openrouter/google/gemini-3-flash-preview
```

如果第一次长对话就发生这种情况，Hermes 可能为你的模型检测到了错误的上下文长度。检查它检测到了什么：

查看 CLI 启动行 — 它会显示检测到的上下文长度（例如 `📊 上下文限制：128000 tokens`）。你还可以在会话期间使用 `/usage` 进行检查。

要修复上下文检测，请显式设置：

```yaml
# 在 ~/.hermes/config.yaml 中
model:
  default: your-model-name
  context_length: 131072  # 你的模型的实际上下文窗口
```

或针对自定义端点，按模型添加：

```yaml
custom_providers:
  - name: "My Server"
    base_url: "http://localhost:11434/v1"
    models:
      qwen3.5:27b:
        context_length: 32768
```

请参见 [上下文长度检测](../integrations/providers.md#context-length-detection) 以了解自动检测的工作原理以及所有覆盖选项。

---

### 终端问题

#### 命令被阻止为危险

**原因：** Hermes 检测到可能是破坏性的命令（例如 `rm -rf`、`DROP TABLE`）。这是一个安全功能。

**解决方法：** 当提示时，审查命令并键入 `y` 批准它。你也可以：
- 要求代理使用更安全的替代方案
- 在 [安全文档](../user-guide/security.md) 中查看危险模式的完整列表

:::tip
这是预期的工作方式 — Hermes 绝不会静默运行破坏性命令。批准提示会向你显示将要执行的确切内容。
:::

#### 通过消息网关的 `sudo` 不起作用

**原因：** 消息网关在没有交互式终端的情况下运行，因此 `sudo` 无法提示输入密码。

**解决方法：**
- 避免在消息中使用 `sudo` — 要求代理寻找替代方案
- 如果要使用 `sudo`，请在 `/etc/sudoers` 中为特定命令配置免密码 sudo
- 或者为管理任务切换到终端界面：`hermes chat`

#### Docker 后端无法连接

**原因：** Docker 守护进程未运行或用户缺乏权限。

**解决方法：**
```bash
# 检查 Docker 是否运行
docker info

# 将你的用户添加到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证
docker run hello-world
```

---

### 消息问题

#### 机器人没有响应消息

**原因：** 机器人未运行、未授权，或你的用户不在允许列表中。

**解决方法：**
```bash
# 检查网关是否运行
hermes gateway status

# 启动网关
hermes gateway start

# 检查错误日志
cat ~/.hermes/logs/gateway.log | tail -50
```

#### 消息无法传递

**原因：** 网络问题、机器人令牌过期，或平台 webhook 配置错误。

**解决方法：**
- 使用 `hermes gateway setup` 验证你的机器人令牌是否有效
- 检查网关日志：`cat ~/.hermes/logs/gateway.log | tail -50`
- 对于基于 webhook 的平台（Slack、WhatsApp），确保你的服务器可公开访问

#### 允许列表混淆 — 谁可以和机器人交谈？

**原因：** 授权模式决定了谁可以获得访问权限。

**解决方法：**

| 模式 | 工作原理 |
|------|-------------|
| **允许列表** | 只有配置中列出的用户 ID 可以交互 |
| **DM 配对** | 第一个私信的用户获得独占访问权限 |
| **开放** | 任何人都可以交互（不建议用于生产环境） |

在 `~/.hermes/config.yaml` 中的网关设置下进行配置。请参见 [消息文档](../user-guide/messaging/index.md)。

#### 网关无法启动

**原因：** 缺少依赖项、端口冲突或令牌配置错误。

**解决方法：**
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

**解决方法：** 使用前台模式而不是 systemd 服务：

```bash
# 选项 1：直接前台运行（最简单）
hermes gateway run

# 选项 2：通过 tmux 持久化（即使关闭终端也能存活）
tmux new -s hermes 'hermes gateway run'
# 稍后重新附加：tmux attach -t hermes

# 选项 3：通过 nohup 后台运行
nohup hermes gateway run > ~/.hermes/logs/gateway.log 2>&1 &
```

如果你想尝试 systemd，请确保已启用：

1. 打开 `/etc/wsl.conf`（如果不存在则创建）
2. 添加：
   ```ini
   [boot]
   systemd=true
   ```
3. 从 PowerShell：`wsl --shutdown`
4. 重新打开你的 WSL 终端
5. 验证：`systemctl is-system-running` 应显示 "running" 或 "degraded"

:::tip 在 Windows 启动时自动启动
为了可靠的自动启动，使用 Windows 任务计划程序在登录时启动 WSL + 网关：
1. 创建一个运行 `wsl -d Ubuntu -- bash -lc 'hermes gateway run'` 的任务
2. 将其设置为在用户登录时触发
:::

#### macOS：Node.js / ffmpeg / 其他工具网关找不到

**原因：** launchd 服务继承一个最小 PATH（`/usr/bin:/bin:/usr/sbin:/sbin`），不包含 Homebrew、nvm、cargo 或其他用户安装工具目录。这通常会破坏 WhatsApp 桥接（`node not found`）或语音转录（`ffmpeg not found`）。

**解决方法：** 网关会在你运行 `hermes gateway install` 时捕获你的 shell PATH。如果你在设置网关后安装了工具，请重新运行安装以捕获更新的 PATH：

```bash
hermes gateway install    # 重新快照你当前的 PATH
hermes gateway start      # 检测更新的 plist 并重新加载
```

你可以验证 plist 是否具有正确的 PATH：
```bash
/usr/libexec/PlistBuddy -c "Print :EnvironmentVariables:PATH" \
  ~/Library/LaunchAgents/ai.hermes.gateway.plist
```

---

### 性能问题

#### 响应缓慢

**原因：** 大型模型、遥远的 API 服务器，或带有许多工具的冗长系统提示。

**解决方法：**
- 尝试更快的/较小的模型：`hermes chat --model openrouter/meta-llama/llama-3.1-8b-instruct`
- 减少活动工具集：`hermes chat -t "terminal"`
- 检查到你提供商的网络延迟
- 对于本地模型，确保你有足够的 GPU VRAM

#### 高 token 使用率

**原因：** 长对话、冗长的系统提示，或许多工具调用累积上下文。

**解决方法：**
```bash
# 压缩对话以减少 token
/compress

# 检查会话 token 使用情况
/usage
```

:::tip
在长会话期间定期使用 `/compress`。它会总结对话历史并显著减少 token 使用，同时保留上下文。
:::

#### 会话太长

**原因：** 延长的对话会累积消息和工具输出，接近上下文限制。

**解决方法：**
```bash
# 压缩当前会话（保留关键上下文）
/compress

# 开始一个新会话，引用旧会话
hermes chat

# 如果需要，稍后恢复特定会话
hermes chat --continue
```

---

### MCP 问题

#### MCP 服务器无法连接

**原因：** 服务器二进制文件未找到、命令路径错误或运行时缺失。

**解决方法：**
```bash
# 确保 MCP 依赖项已安装（标准安装中已包含）
cd ~/.hermes/hermes-agent && uv pip install -e ".[mcp]"

# 对于基于 npm 的服务器，确保 Node.js 可用
node --version
npx --version

# 手动测试服务器
npx -y @modelcontextprotocol/server-filesystem /tmp
```

验证你的 `~/.hermes/config.yaml` MCP 配置：
```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
```

#### 来自 MCP 服务器的工具未显示

**原因：** 服务器已启动但工具发现失败，工具被配置过滤掉，或服务器不支持你期望的 MCP 能力。

**解决方法：**
- 检查网关/代理日志中的 MCP 连接错误
- 确保服务器对 `tools/list` RPC 方法有响应
- 审查该服务器下的任何 `tools.include`、`tools.exclude`、`tools.resources`、`tools.prompts` 或 `enabled` 设置
- 记住资源/提示实用工具仅在会话实际支持这些能力时注册
- 更改配置后使用 `/reload-mcp`

```bash
# 验证 MCP 服务器配置
hermes config show | grep -A 12 mcp_servers

# 更改配置后重启 Hermes 或重新加载 MCP
hermes chat
```

另请参见：
- [MCP (Model Context Protocol)](/docs/user-guide/features/mcp)
- [在 Hermes 中使用 MCP](/docs/guides/use-mcp-with-hermes)
- [MCP 配置参考](/docs/reference/mcp-config-reference)

#### MCP 超时错误

**原因：** MCP 服务器响应缓慢，或在执行过程中崩溃。

**解决方法：**
- 如果支持，在你的 MCP 服务器配置中增加超时
- 检查 MCP 服务器进程是否仍在运行
- 对于远程 HTTP MCP 服务器，检查网络连接

:::warning
如果 MCP 服务器在中途请求时崩溃，Hermes 将报告超时。检查服务器自身的日志（而不仅仅是 Hermes 日志）以诊断根本原因。
:::

---

## 配置文件

### 配置文件与仅设置 HERMES_HOME 有何不同？

配置文件是 `HERMES_HOME` 之上的管理层。你可以*手动*在每个命令前设置 `HERMES_HOME=/some/path`，但配置文件为你处理了所有底层工作：创建目录结构、生成 shell 别名（`hermes-work`）、在 `~/.hermes/active_profile` 中跟踪活动配置文件，并自动在所有配置文件中同步技能更新。它们还与制表符补全集成，因此你无需记住路径。

### 两个配置文件可以使用相同的机器人令牌吗？

不可以。每个消息平台（Telegram、Discord 等）都需要对机器人令牌的独占访问权限。如果两个配置文件尝试同时使用同一令牌，第二个网关将无法连接。请为每个配置文件创建单独的机器人 — 对于 Telegram，请与 [@BotFather](https://t.me/BotFather) 交谈以创建额外的机器人。

### 配置文件共享内存或会话吗？

不可以。每个配置文件都有自己的内存存储、会话数据库和技能目录。它们是完全隔离的。如果你希望新配置文件拥有现有的内存和会话，请使用 `hermes profile create newname --clone-all` 从当前配置文件复制所有内容。

### 当我运行 `hermes update` 时会发生什么？

`hermes update` 拉取最新代码并**一次**重新安装依赖项（而不是每个配置文件）。然后它会自动将所有配置文件同步更新的技能。你只需要运行一次 `hermes update` — 它涵盖机器上的每个配置文件。

### 我可以将配置文件移动到另一台机器吗？

可以。将配置文件导出为便携式存档，然后在另一台机器上导入：

```bash
# 在源机器上
hermes profile export work ./work-backup.tar.gz

# 将文件复制到目标机器，然后：
hermes profile import ./work-backup.tar.gz work
```

导入的配置文件将拥有导出时的所有配置、内存、会话和技能。如果新机器的设置不同，你可能需要更新路径或向提供商重新认证。

### 我可以运行多少个配置文件？

没有硬性限制。每个配置文件只是 `~/.hermes/profiles/` 下的一个目录。实际限制取决于你的磁盘空间和系统能处理的并发网关数量（每个网关是一个轻量级 Python 进程）。运行几十个配置文件没问题；每个空闲配置文件不使用任何资源。

---

## 工作流和模式

### 为不同任务使用不同的模型（多模型工作流）

**场景：** 你使用 GPT-5.4 作为日常驾驶，但 Gemini 或 Grok 写社交媒体内容更好。每次手动切换模型都很繁琐。

**解决方案：委托配置。** Hermes 可以将子代理自动路由到不同的模型。在 `~/.hermes/config.yaml` 中设置：

```yaml
delegation:
  model: "google/gemini-3-flash-preview"   # 子代理使用此模型
  provider: "openrouter"                    # 子代理的提供商
```

现在当你告诉 Hermes "为我写一篇关于 X 的 Twitter 线程" 并它生成一个 `delegate_task` 子代理时，该子代理将在 Gemini 上运行，而不是你的主模型。你的主要对话保持在 GPT-5.4 上。

你还可以在提示中明确说明：*"委托任务撰写关于我们产品发布的社交媒体帖子。使用你的子代理进行实际写作。"* 代理将使用 `delegate_task`，它会自动拾取委托配置。

对于不使用委托的一次性模型切换，请在 CLI 中使用 `/model`：

```bash
/model google/gemini-3-flash-preview    # 为此会话切换
# ... 撰写你的内容 ...
/model openai/gpt-5.4                   # 切换回来
```

请参见 [子代理委托](../user-guide/features/delegation.md) 以了解委托的工作原理。
