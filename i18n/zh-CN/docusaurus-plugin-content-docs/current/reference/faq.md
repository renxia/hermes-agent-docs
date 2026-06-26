---
sidebar_position: 3
title: "FAQ & Troubleshooting"
description: "Frequently asked questions and solutions to common issues with Hermes Agent"
---

# 常见问题与故障排除

针对最常见的问题和故障的快速解答与修复方案。

---

## 常见问题

### Hermes 支持哪些 LLM 提供商？

Hermes 智能体兼容任何符合 OpenAI API 规范的接口。支持的提供商包括：

- **[OpenRouter](https://openrouter.ai/)** — 通过一个 API 密钥即可访问数百种模型（推荐追求灵活性的用户使用）
- **[Nous Portal](/integrations/nous-portal)** — Nous Research 的订阅网关 — 300 多种模型，支持网页/图片/TTS/浏览器，通过一次 OAuth 登录即可使用（推荐新手使用）
- **OpenAI** — GPT-5.4、GPT-5-codex、GPT-4.1、GPT-4o 等
- **Anthropic** — Claude 模型（直连 API、通过 `hermes auth add anthropic` 的 OAuth、OpenRouter 或任何兼容代理）
- **Google** — Gemini 模型（通过 `gemini` 提供商直连 API、OpenRouter 或兼容代理）
- **z.ai / ZhipuAI** — GLM 模型
- **Kimi / Moonshot AI** — Kimi 模型
- **MiniMax** — 全球及中国端点
- **本地模型** — 通过 [Ollama](https://ollama.com/)、[vLLM](https://docs.vllm.ai/)、[llama.cpp](https://github.com/ggerganov/llama.cpp)、[SGLang](https://github.com/sgl-project/sglang) 或任何兼容 OpenAI 的服务器运行

通过 `hermes model` 或编辑 `~/.hermes/.env` 来设置你的提供商。有关所有提供商密钥，请参阅[环境变量](./environment-variables.md)参考文档。

### 能在 Windows 上运行吗？

**是的，原生支持。** Hermes 通过 PowerShell 安装程序原生支持 Windows — 无需 WSL。在 PowerShell 中运行：

```powershell
iex (irm https://hermes-agent.nousresearch.com/install.ps1)
```

安装程序会配置一个 PortableGit 作为终端工具的 shell 支撑。详情请参阅[Windows（原生）指南](../user-guide/windows-native.md)。

WSL2 仍然是完全支持的替代方案。要在 WSL2 内运行 Hermes，先安装 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)，然后使用标准安装命令：

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

### 我在 WSL2 中运行 Hermes。如何控制我正常使用的 Windows Chrome？

推荐使用 MCP 网桥而非 `/browser connect`。

推荐模式：

- 在 WSL2 内运行 Hermes
- 在 Windows 上继续使用你正常已登录的 Chrome
- 通过 `cmd.exe` 或 `powershell.exe` 将 `chrome-devtools-mcp` 添加为 MCP 服务器
- 让 Hermes 使用生成的 MCP 浏览器工具

这比尝试强制 Hermes 核心浏览器传输层直接跨 WSL2/Windows 边界连接更可靠。

请参阅：

- [在 Hermes 中使用 MCP](../guides/use-mcp-with-hermes.md#wsl2-bridge-hermes-in-wsl-to-windows-chrome)
- [浏览器自动化](../user-guide/features/browser.md#wsl2--windows-chrome-prefer-mcp-over-browser-connect)

### 能在 Android / Termux 上运行吗？

可以 — Hermes 现在已有经过测试的 Termux 安装路径，适用于 Android 手机。

快速安装：

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

有关完整的显式手动步骤、支持的扩展项及当前限制，请参阅 [Termux 指南](../getting-started/termux.md)。

重要提示：完整的 `.[all]` 扩展目前在 Android 上不可用，因为 `voice` 扩展依赖 `faster-whisper` → `ctranslate2`，而 `ctranslate2` 未提供 Android 预编译包。请改用经过测试的 `.[termux]` 扩展。

### 我的数据会被发送到其他地方吗？

API 调用**仅发送到你配置的 LLM 提供商**（例如 OpenRouter、你的本地 Ollama 实例）。Hermes 智能体不收集遥测、使用数据或分析信息。你的对话、记忆和技能均存储在本地 `~/.hermes/` 目录中。

### 可以离线使用 / 使用本地模型吗？

可以。运行 `hermes model`，选择 **Custom endpoint**，然后输入你的服务器 URL：

```bash
hermes model
# 选择：Custom endpoint（手动输入 URL）
# API base URL: http://localhost:11434/v1
# API key: ollama
# Model name: qwen3.5:27b
# Context length: 64000   ← Hermes 最低要求；请将其设置为与你的服务器实际上下文窗口匹配
```

或者直接在 `config.yaml` 中配置：

```yaml
model:
  default: qwen3.5:27b
  provider: custom
  base_url: http://localhost:11434/v1
```

Hermes 会将端点、提供商和 base URL 持久化到 `config.yaml` 中，使其在重启后仍然保留。如果你的本地服务器恰好只加载了一个模型，`/model custom` 会自动检测它。你也可以在 config.yaml 中设置 `provider: custom` — 它是一个一等提供商，不是任何其他内容的别名。

这适用于 Ollama、vLLM、llama.cpp 服务器、SGLang、LocalAI 等。详情请参阅[配置指南](../user-guide/configuration.md)。

:::tip Ollama 用户
如果你在 Ollama 中设置了自定义 `num_ctx`（例如 `ollama run --num_ctx 64000`），请确保在 Hermes 中设置匹配的上下文长度 — Ollama 的 `/api/show` 报告的是模型的*最大*上下文，而不是你配置的有效 `num_ctx`。
:::

:::tip 本地模型的超时问题
Hermes 会自动检测本地端点并放宽流式超时（读取超时从 120 秒提升至 1800 秒，禁用陈旧流检测）。如果你在极大的上下文上仍然遇到超时，请在 `.env` 中设置 `HERMES_STREAM_READ_TIMEOUT=1800`。详情请参阅[本地 LLM 指南](../guides/local-llm-on-mac.md#timeouts)。
:::

### 需要多少费用？

Hermes 智能体本身是**免费且开源的**（MIT 许可证）。你只需为你所选提供商的 LLM API 使用量付费。本地模型完全免费运行。

### 多个人可以使用一个实例吗？

可以。[消息网关](../user-guide/messaging/index.md)允许多个用户通过 Telegram、Discord、Slack、WhatsApp 或 Home Assistant 与同一个 Hermes 智能体实例交互。访问通过允许列表（特定用户 ID）和 DM 配对（第一个发消息的用户获得访问权限）进行控制。

### 记忆和技能有什么区别？

- **记忆**存储**事实** — 智能体关于你、你的项目和偏好所了解的内容。记忆会根据相关性自动检索。
- **技能**存储**流程** — 关于如何完成某件事的分步说明。当智能体遇到类似任务时会调用技能。

两者都会跨会话持久化。详情请参阅[记忆](../user-guide/features/memory.md)和[技能](../user-guide/features/skills.md)。

### 可以在我自己的 Python 项目中使用吗？

可以。导入 `AIAgent` 类并编程式地使用 Hermes：

```python
from run_agent import AIAgent

agent = AIAgent(model="anthropic/claude-opus-4.7")
response = agent.chat("简要解释量子计算")
```

有关完整的 API 用法，请参阅[Python 库指南](../user-guide/features/code-execution.md)。

---

## 故障排除

### 安装问题

#### 安装后出现 `hermes: command not found`

**原因：** 你的 shell 没有重新加载更新的 PATH。

**解决方案：**
```bash
# 重新加载你的 shell 配置文件
source ~/.bashrc    # bash
source ~/.zshrc     # zsh

# 或者启动一个新的终端会话
```

如果仍然无效，验证安装位置：
```bash
which hermes
ls ~/.local/bin/hermes
```

:::tip
安装程序会将 `~/.local/bin` 添加到你的 PATH 中。如果你使用的是非标准 shell 配置，请手动添加 `export PATH="$HOME/.local/bin:$PATH"`。
:::

#### Python 版本过旧

**原因：** Hermes 需要 Python 3.11 或更高版本。

**解决方案：**
```bash
python3 --version   # 检查当前版本

# 安装更新的 Python
sudo apt install python3.12   # Ubuntu/Debian
brew install python@3.12      # macOS
```

安装程序会自动处理此问题 — 如果你在手动安装时看到此错误，请先升级 Python。

#### 终端命令提示 `node: command not found`（或 `nvm`、`pyenv`、`asdf` 等）

**原因：** Hermes 在启动时运行一次 `bash -l` 来构建每会话环境快照。bash 登录 shell 会读取 `/etc/profile`、`~/.bash_profile` 和 `~/.profile`，但**不会引用 `~/.bashrc`** — 因此安装在那里的工具（`nvm`、`asdf`、`pyenv`、`cargo`、自定义 PATH 导出）对快照不可见。这最常见于 Hermes 在 systemd 下运行或在最小化 shell 中运行、没有任何内容预加载交互式 shell 配置文件的情况。

**解决方案：** Hermes 默认会自动引用 `~/.bashrc`。如果这还不够 — 例如你是 zsh 用户，其 PATH 在 `~/.zshrc` 中，或者你从独立文件初始化 `nvm` — 在 `~/.hermes/config.yaml` 中列出要引用的额外文件：

```yaml
terminal:
  shell_init_files:
    - ~/.zshrc                     # zsh 用户：将 zsh 管理的 PATH 引入 bash 快照
    - ~/.nvm/nvm.sh                # 直接初始化 nvm（无论哪种 shell 都有效）
    - /etc/profile.d/cargo.sh      # 系统级 rc 文件
  # 设置此列表后，默认的 ~/.bashrc 自动引用不会被添加 —
  # 如果两者都需要，请显式包含：
  #   - ~/.bashrc
  #   - ~/.zshrc
```

缺失的文件会被静默跳过。引用以 bash 执行，因此依赖 zsh 专属语法的文件可能会报错 — 如果担心此问题，只引用 PATH 设置部分（例如直接引用 `nvm.sh`）而非整个 rc 文件。

若要禁用自动引用行为（仅限严格登录 shell 语义）：

```yaml
terminal:
  auto_source_bashrc: false
```

#### `uv: command not found`

**原因：** `uv` 包管理器未安装或不在 PATH 中。

**解决方案：**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
```

#### 安装过程中出现权限被拒绝错误

**原因：** 对安装目录没有足够的写入权限。

**解决方案：**
```bash
# 不要对安装程序使用 sudo — 它安装到 ~/.local/bin
# 如果你之前使用了 sudo 安装，请清理：
sudo rm /usr/local/bin/hermes
# 然后重新运行标准安装程序
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

---

### 提供商和模型问题

#### `/model` 只显示一个提供商 / 无法切换提供商

**原因：** `/model`（在聊天会话内）只能在你**已配置**的提供商之间切换。如果你只设置了 OpenRouter，`/model` 就只会显示它。

**解决方案：** 退出会话并在终端中使用 `hermes model` 来添加新提供商：

```bash
# 先退出 Hermes 聊天会话（Ctrl+C 或 /quit）

# 运行完整的提供商设置向导
hermes model

# 这允许你：添加提供商、运行 OAuth、输入 API 密钥、配置端点
```

通过 `hermes model` 添加新提供商后，启动新的聊天会话 — `/model` 现在会显示你所有已配置的提供商。

:::tip 快速参考
| 想要... | 使用 |
|-----------|-----|
| 添加新提供商 | `hermes model`（从终端） |
| 输入/更改 API 密钥 | `hermes model`（从终端） |
| 会话中切换模型 | `/model <name>`（会话内） |
| 切换到不同的已配置提供商 | `/model provider:model`（会话内） |
:::

#### API 密钥无法使用

**原因：** 密钥缺失、过期、设置错误或属于错误的提供商。

**解决方案：**
```bash
# 检查你的配置
hermes config show

# 重新配置你的提供商
hermes model

# 或直接设置
hermes config set OPENROUTER_API_KEY sk-or-v1-xxxxxxxxxxxx
```

:::warning
确保密钥与提供商匹配。OpenAI 密钥不能在 OpenRouter 上使用，反之亦然。检查 `~/.hermes/.env` 中是否有冲突的条目。
:::

#### 模型不可用 / 找不到模型

**原因：** 模型标识符不正确或在你的提供商上不可用。

**解决方案：**
```bash
# 列出你的提供商可用的模型
hermes model

# 设置一个有效的模型
hermes config set HERMES_MODEL anthropic/claude-opus-4.7

# 或按会话指定
hermes chat --model openrouter/meta-llama/llama-3.1-70b-instruct
```

#### 速率限制（429 错误）

**原因：** 你超出了提供商的速率限制。

**解决方案：** 等待片刻后重试。对于持续使用，考虑：
- 升级你的提供商套餐
- 切换到不同的模型或提供商
- 使用 `hermes chat --provider <alternative>` 路由到不同的后端

#### 超出上下文长度

**原因：** 对话对于模型的上下文窗口来说太长了，或者 Hermes 为你的模型检测到了错误的上下文长度。

**解决方案：**
```bash
# 压缩当前会话
/compress

# 或启动一个新会话
hermes chat

# 使用具有更大上下文窗口的模型
hermes chat --model openrouter/google/gemini-3-flash-preview
```

如果这在第一次长对话时就发生，Hermes 可能为你的模型检测到了错误的上下文长度。检查它检测到的值：

查看 CLI 启动行 — 它显示检测到的上下文长度（例如，`📊 Context limit: 128000 tokens`）。你也可以在会话中使用 `/usage` 检查。

要修复上下文检测，显式设置：

```yaml
# 在 ~/.hermes/config.yaml 中
model:
  default: your-model-name
  context_length: 131072  # 你的模型的实际上下文窗口
```

或者对于自定义端点，按模型添加：

```yaml
custom_providers:
  - name: "My Server"
    base_url: "http://localhost:11434/v1"
    models:
      qwen3.5:27b:
        context_length: 64000
```

参阅[上下文长度检测](../integrations/providers.md#context-length-detection)了解自动检测的工作原理及所有覆盖选项。

---

### 终端问题

#### 命令被拦截为危险命令

**原因：** Hermes 检测到了潜在破坏性命令（例如 `rm -rf`、`DROP TABLE`）。这是一项安全功能。

**解决方案：** 出现提示时，检查命令并输入 `y` 批准。你也可以：
- 要求智能体使用更安全的替代方案
- 在[安全文档](../user-guide/security.md)中查看危险模式的完整列表

:::tip
这是预期行为 — Hermes 永远不会静默执行破坏性命令。批准提示会准确显示将执行的内容。
:::

#### 通过消息网关使用时 `sudo` 不工作

**原因：** 消息网关在没有交互式终端的情况下运行，因此 `sudo` 无法提示输入密码。

**解决方案：**
- 在消息中避免使用 `sudo` — 要求智能体寻找替代方案
- 如果必须使用 `sudo`，在 `/etc/sudoers` 中为特定命令配置免密 sudo
- 或者切换到终端界面执行管理任务：`hermes chat`

#### Docker 后端无法连接

**原因：** Docker 守护进程未运行或用户缺少权限。

**解决方案：**
```bash
# 检查 Docker 是否正在运行
docker info

# 将你的用户添加到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证
docker run hello-world
```

---

### 消息问题

#### 机器人不响应消息

**原因：** 机器人未运行、未获授权或你的用户不在允许列表中。

**解决方案：**
```bash
# 检查网关是否正在运行
hermes gateway status

# 启动网关
hermes gateway start

# 检查错误日志
cat ~/.hermes/logs/gateway.log | tail -50
```

#### 消息无法送达

**原因：** 网络问题、机器人令牌过期或平台 webhook 配置错误。

**解决方案：**
- 使用 `hermes gateway setup` 验证你的机器人令牌是否有效
- 检查网关日志：`cat ~/.hermes/logs/gateway.log | tail -50`
- 对于基于 webhook 的平台（Slack、WhatsApp），确保你的服务器可公开访问

#### 允许列表困惑 — 谁可以与机器人对话？

**原因：** 授权模式决定谁可以访问。

**解决方案：**

| 模式 | 工作原理 |
|------|-------------|
| **允许列表** | 只有配置中列出的用户 ID 可以交互 |
| **DM 配对** | 第一个在 DM 中发消息的用户获得独占访问权 |
| **开放** | 任何人都可以交互（不推荐用于生产环境） |

在 `~/.hermes/config.yaml` 中的网关设置下配置。参阅[消息文档](../user-guide/messaging/index.md)。

#### 网关无法启动

**原因：** 缺少依赖项、端口冲突或令牌配置错误。

**解决方案：**
```bash
# 安装核心消息网关依赖
cd ~/.hermes/hermes-agent && uv pip install -e ".[messaging]"  # Telegram、Discord、Slack 和共享网关依赖

# 检查端口冲突
lsof -i :8080

# 验证配置
hermes config show
```

#### WSL：网关不断断开连接或 `hermes gateway start` 失败

**原因：** WSL 的 systemd 支持不可靠。许多 WSL2 安装没有启用 systemd，即使启用了，服务也可能无法在 WSL 重启或 Windows 空闲关机后存活。

**解决方案：** 使用前台模式而非 systemd 服务：

```bash
# 选项 1：直接前台运行（最简单）
hermes gateway run

# 选项 2：通过 tmux 持久运行（终端关闭后仍存活）
tmux new -s hermes 'hermes gateway run'
# 稍后重新连接：tmux attach -t hermes

# 选项 3：通过 nohup 后台运行
nohup hermes gateway run > ~/.hermes/logs/gateway.log 2>&1 &
```

如果你仍然想尝试 systemd，请确保它已启用：

1. 打开 `/etc/wsl.conf`（如果不存在则创建）
2. 添加：
   ```ini
   [boot]
   systemd=true
   ```
3. 从 PowerShell 执行：`wsl --shutdown`
4. 重新打开 WSL 终端
5. 验证：`systemctl is-system-running` 应显示 "running" 或 "degraded"

:::tip Windows 开机自动启动
要实现可靠的自动启动，使用 Windows 任务计划程序在登录时启动 WSL + 网关：
1. 创建一个运行 `wsl -d Ubuntu -- bash -lc 'hermes gateway run'` 的任务
2. 将其设置为用户登录时触发
:::

#### macOS：网关找不到 Node.js / ffmpeg / 其他工具

**原因：** launchd 服务继承的最小 PATH（`/usr/bin:/bin:/usr/sbin:/sbin`）不包含 Homebrew、nvm、cargo 或其他用户安装工具的目录。这通常会破坏 WhatsApp 桥接（`node not found`）或语音转录（`ffmpeg not found`）。

**解决方案：** 网关在你运行 `hermes gateway install` 时会捕获你的 shell PATH。如果你在设置网关后安装了工具，请重新运行安装以捕获更新的 PATH：

```bash
hermes gateway install    # 重新快照你当前的 PATH
hermes gateway start      # 检测更新后的 plist 并重新加载
```

你可以验证 plist 中是否有正确的 PATH：
```bash
/usr/libexec/PlistBuddy -c "Print :EnvironmentVariables:PATH" \
  ~/Library/LaunchAgents/ai.hermes.gateway.plist
```

---

### 性能问题

#### 响应缓慢

**原因：** 大型模型、距离较远的 API 服务器或包含大量工具的繁重系统提示。

**解决方案：**
- 尝试更快/更小的模型：`hermes chat --model openrouter/meta-llama/llama-3.1-8b-instruct`
- 减少活跃工具集：`hermes chat -t "terminal"`
- 检查你到提供商的网络延迟
- 对于本地模型，确保你有足够的 GPU 显存

#### 高 token 使用量

**原因：** 长对话、冗长的系统提示或大量工具调用累积上下文。

**解决方案：**
```bash
# 压缩对话以减少 token
/compress

# 检查会话 token 使用量
/usage
```

:::tip
在长会话中定期使用 `/compress`。它总结对话历史，在保留上下文的同时显著减少 token 使用量。
:::

#### 会话过长

**原因：** 长时间对话累积消息和工具输出，接近上下文限制。

**解决方案：**
```bash
# 压缩当前会话（保留关键上下文）
/compress

# 启动一个引用旧会话的新会话
hermes chat

# 稍后如果需要恢复特定会话
hermes chat --continue
```

---

### MCP 问题

#### MCP 服务器无法连接

**原因：** 服务器二进制文件未找到、命令路径错误或缺少运行时。

**解决方案：**
```bash
# 确保已安装 MCP 依赖（标准安装中已包含）
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

#### MCP 服务器的工具未显示

**原因：** 服务器已启动但工具发现失败、工具被配置过滤，或服务器不支持你预期的 MCP 能力。

**解决方案：**
- 检查网关/智能体日志中的 MCP 连接错误
- 确保服务器响应 `tools/list` RPC 方法
- 检查该服务器下的 `tools.include`、`tools.exclude`、`tools.resources`、`tools.prompts` 或 `enabled` 设置
- 记住资源/提示实用工具仅在会话实际支持这些能力时才会注册
- 更改配置后使用 `/reload-mcp`

```bash
# 验证 MCP 服务器已配置
hermes config show | grep -A 12 mcp_servers

# 配置更改后重启 Hermes 或重新加载 MCP
hermes chat
```

另请参阅：
- [MCP (Model Context Protocol)](/user-guide/features/mcp)
- [在 Hermes 中使用 MCP](/guides/use-mcp-with-hermes)
- [MCP 配置参考](/reference/mcp-config-reference)

#### MCP 超时错误

**原因：** MCP 服务器响应时间过长，或在执行过程中崩溃。

**解决方案：**
- 如果支持，增加 MCP 服务器配置中的超时时间
- 检查 MCP 服务器进程是否仍在运行
- 对于远程 HTTP MCP 服务器，检查网络连接

:::warning
如果 MCP 服务器在请求中途崩溃，Hermes 将报告超时。检查服务器自身的日志（不仅仅是 Hermes 日志）来诊断根本原因。
:::

---

## 配置文件

### 配置文件与直接设置 HERMES_HOME 有何不同？

配置文件是在 `HERMES_HOME` 之上的一层受管抽象。你*可以*在每次命令之前手动设置 `HERMES_HOME=/some/path`，但配置文件会为你处理所有细节：创建目录结构、生成 shell 别名（`hermes-work`）、在 `~/.hermes/active_profile` 中跟踪当前使用的配置文件，以及自动在所有配置文件之间同步技能更新。它们还与 Tab 补全集成，让你无需记住路径。

### 两个配置文件可以共享同一个机器人令牌吗？

不可以。每个消息平台（Telegram、Discord 等）都要求独占访问一个机器人令牌。如果两个配置文件尝试同时使用同一个令牌，第二个网关将无法连接。为每个配置文件创建一个独立的机器人——对于 Telegram，请联系 [@BotFather](https://t.me/BotFather) 来创建更多机器人。

### 配置文件之间会共享记忆或会话吗？

不会。每个配置文件都有自己独立的记忆存储、会话数据库和技能目录。它们是完全隔离的。如果你想以已有的记忆和会话为基础创建新的配置文件，可以使用 `hermes profile create newname --clone-all` 来复制当前配置文件中的所有内容，或者添加 `--clone-from <profile>` 来从指定的源配置文件复制。

### 运行 `hermes update` 时会发生什么？

`hermes update` 会拉取最新代码并重新安装依赖**一次**（不是每个配置文件都会执行）。然后它会自动将更新的技能同步到所有配置文件。你只需要运行一次 `hermes update`——它就能覆盖机器上的所有配置文件。


### 我可以运行多少个配置文件？

没有硬性限制。每个配置文件只是 `~/.hermes/profiles/` 下的一个目录。实际限制取决于你的磁盘空间以及系统能处理多少个并发网关（每个网关都是一个轻量级的 Python 进程）。运行几十个配置文件没有问题；每个空闲的配置文件不会占用任何资源。

---

## 工作流与模式

### 对不同任务使用不同的模型（多模型工作流）

**场景：** 你使用 GPT-5.4 作为日常主力模型，但 Gemini 或 Grok 能写出更好的社交媒体内容。每次都手动切换模型很繁琐。

**解决方案：** 委托配置。Hermes 可以自动将子智能体路由到不同的模型。在 `~/.hermes/config.yaml` 中设置：

```yaml
delegation:
  model: "google/gemini-3-flash-preview"   # 子智能体使用此模型
  provider: "openrouter"                    # 子智能体的提供商
```

现在当你告诉 Hermes "帮我写一条关于 X 的推文串" 并它生成了一个 `delegate_task` 子智能体时，该子智能体将在 Gemini 上运行，而不是你的主模型。你的主对话仍然留在 GPT-5.4 上。

你也可以在提示词中明确说明：*"委托一个任务来撰写关于我们产品发布的社交媒体帖子。用子智能体来实际撰写。"* 智能体将使用 `delegate_task`，它会自动读取委托配置。

对于无需委托的一次性模型切换，可以在 CLI 中使用 `/model`：

```bash
/model google/gemini-3-flash-preview    # 为此会话切换
# ... 撰写内容 ...
/model openai/gpt-5.4                   # 切换回
```

有关委托工作原理的更多信息，请参见[子智能体委托](../user-guide/features/delegation.md)。

### 在一个 WhatsApp 号码上运行多个智能体会话（按聊天绑定）

**场景：** 在 OpenClaw 中，你有多个独立的智能体绑定到特定的 WhatsApp 聊天——一个用于家庭购物清单群，另一个用于你的私聊。Hermes 能做到这一点吗？

**当前限制：** Hermes 的配置文件每个都需要自己的 WhatsApp 号码/会话。你不能将多个配置文件绑定到同一个 WhatsApp 号码上的不同聊天——WhatsApp 桥接（Baileys）每个号码只使用一个已认证的会话。

**变通方案：**

1. **使用单一配置文件配合人格切换。** 创建不同的 `AGENTS.md` 上下文文件，或使用 `/personality` 命令按聊天更改行为。智能体可以看到自己在哪个聊天中，并做出相应调整。

2. **使用定时任务处理专门任务。** 对于购物清单追踪器，设置一个定时任务来监控特定聊天并管理清单——不需要单独的智能体。

3. **使用不同的号码。** 如果你需要真正独立的智能体，将每个配置文件与自己的 WhatsApp 号码配对。Google Voice 等服务提供的虚拟号码适用于此目的。

4. **改用 Telegram 或 Discord。** 这些平台更自然地支持按聊天绑定——每个 Telegram 群组或 Discord 频道获得自己的会话，你可以在同一账户上运行多个机器人令牌（每个配置文件一个）。

详情请参见[配置文件](../user-guide/profiles.md)和[WhatsApp 设置](../user-guide/messaging/whatsapp.md)。

### 控制 Telegram 中的显示内容（隐藏日志和推理过程）

**场景：** 你在 Telegram 中看到网关执行日志、Hermes 推理过程和工具调用详情，而不是只看到最终输出。

**解决方案：** `config.yaml` 中的 `display.tool_progress` 设置控制工具活动的显示程度：

```yaml
display:
  tool_progress: "off"   # 选项：off、new、all、verbose
```

- **`off`** — 仅显示最终回复。不显示工具调用、推理过程或日志。
- **`new`** — 显示正在发生的新工具调用（简短的一行）。
- **`all`** — 显示所有工具活动，包括结果。
- **`verbose`** — 完整详情，包括工具参数和输出。

对于消息平台，通常使用 `off` 或 `new`。编辑 `config.yaml` 后，重启网关以使更改生效。

你也可以使用 `/verbose` 命令按会话切换此功能（如果已启用）：

```yaml
display:
  tool_progress_command: true   # 在网关中启用 /verbose
```

### 在 Telegram 上管理技能（斜杠命令限制）

**场景：** Telegram 有 100 个斜杠命令的限制，而你的技能正在超出这个限制。你想在 Telegram 上禁用不需要的技能，但 `hermes skills config` 的设置似乎没有生效。

**解决方案：** 使用 `hermes skills config` 按平台禁用技能。这会写入 `config.yaml`：

```yaml
skills:
  disabled: []                    # 全局禁用的技能
  platform_disabled:
    telegram: [skill-a, skill-b]  # 仅在 Telegram 上禁用
```

更改后，**重启网关**（`hermes gateway restart` 或终止后重新启动）。Telegram 机器人命令菜单会在启动时重建。

:::tip
描述过长的技能在 Telegram 菜单中会被截断为 40 个字符，以保持在有效载荷大小限制内。如果技能没有显示，可能是总有效载荷大小问题而非 100 个命令数量限制——禁用未使用的技能对两者都有帮助。
:::

### 共享线程会话（多个用户，一个对话）

**场景：** 你有一个 Telegram 或 Discord 线程，多人在其中 @机器人。你希望该线程中的所有提及都属于一个共享的对话，而不是每个用户各自独立的会话。

**当前行为：** Hermes 在大多数平台上按用户 ID 创建会话，因此每个人都有自己的对话上下文。这是出于隐私和上下文隔离的设计考虑。

**变通方案：**

1. **使用 Slack。** Slack 会话按线程而非用户键控。同一线程中的多个用户共享一个对话——这正是你描述的行为。这是最自然的适配方案。

2. **使用单用户群聊。** 如果一个人被指定为"操作员"来转达问题，会话保持统一。其他人可以旁观。

3. **使用 Discord 频道。** Discord 会话按频道键控，因此同一频道中的所有用户共享上下文。使用一个专门的频道来进行共享对话。

### 将 Hermes 导出到另一台机器

**场景：** 你在一台机器上积累了技能、定时任务和记忆，并希望将所有内容迁移到一台新的专用 Linux 机器上。

**解决方案：**

1. 在新机器上安装 Hermes 智能体：
   ```bash
   curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
   ```

2. 在**源机器**上，创建完整备份：
   ```bash
   hermes backup
   ```
   这会创建整个 `~/.hermes/` 目录的压缩包——包括配置、API 密钥、记忆、技能、会话和配置文件——保存到你的主目录中，文件名为 `~/hermes-backup-<timestamp>.zip`。

3. 将压缩包复制到新机器并导入：
   ```bash
   # 在源机器上
   scp ~/hermes-backup-<timestamp>.zip newmachine:~/

   # 在新机器上
   hermes import ~/hermes-backup-<timestamp>.zip
   ```

4. 在新机器上运行 `hermes setup` 以验证 API 密钥和提供商配置是否正常工作。

### 将单个配置文件移动到另一台机器

**场景：** 你想移动或共享一个特定的配置文件——而不是你的完整安装。

```bash
# 在源机器上
hermes profile export work ./work-backup.tar.gz

# 将文件复制到目标机器，然后：
hermes profile import ./work-backup.tar.gz work
```

导入的配置文件将包含导出中的所有配置、记忆、会话和技能。如果新机器的设置不同，你可能需要更新路径或重新与提供商进行身份验证。

### `hermes backup` 与 `hermes profile export` 对比

| 功能 | `hermes backup` | `hermes profile export` |
| :--- | :--- | :--- |
| **使用场景** | **完整机器迁移** | **移植/共享特定配置文件** |
| **范围** | 全局（整个 `~/.hermes` 目录） | 本地（单个配置文件目录） |
| **包含内容** | 所有配置文件、全局配置、API 密钥、会话 | 单个配置文件：SOUL.md、记忆、会话、技能 |
| **凭证** | **包含**（`.env` 和 `auth.json`） | **排除**（为安全共享而剥离） |
| **格式** | `.zip` | `.tar.gz` |

**手动回退方案（rsync）：** 如果你更倾向于直接复制文件，请排除代码仓库：
```bash
rsync -av --exclude='hermes-agent' ~/.hermes/ newmachine:~/.hermes/
```

:::tip
即使在 Hermes 积极运行时，`hermes backup` 也能生成一致的快照。恢复的归档会排除 `gateway.pid` 和 `cron.pid` 等机器本地运行时文件。
:::

### 安装后重新加载 shell 时权限被拒绝

**场景：** 运行 Hermes 安装程序后，`source ~/.zshrc` 给出权限被拒绝的错误。

**原因：** 这通常发生在 `~/.zshrc`（或 `~/.bashrc`）的文件权限不正确时，或者当安装程序无法干净地写入时。这不是 Hermes 特有的问题——而是 shell 配置的权限问题。

**解决方案：**
```bash
# 检查权限
ls -la ~/.zshrc

# 如果需要修复（应为 -rw-r--r-- 或 644）
chmod 644 ~/.zshrc

# 然后重新加载
source ~/.zshrc

# 或者直接打开一个新的终端窗口——它会自动获取 PATH 更改
```

如果安装程序添加了 PATH 行但权限不正确，你可以手动添加：
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
```

### 首次运行智能体时出现 400 错误

**场景：** 设置完成正常，但第一次聊天尝试时出现 HTTP 400 错误。

**原因：** 通常是模型名称不匹配——配置的模型在你的提供商上不存在，或者 API 密钥没有访问该模型的权限。

**解决方案：**
```bash
# 检查配置的模型和提供商
hermes config show | head -20

# 重新运行模型选择
hermes model

# 或者用已知可用的模型进行测试
hermes chat -q "hello" --model anthropic/claude-opus-4.7
```

如果使用 OpenRouter，请确保你的 API 密钥有余额。来自 OpenRouter 的 400 错误通常意味着该模型需要付费计划，或者模型 ID 有拼写错误。

---

## 还是卡住了？

如果你的问题未在此处涵盖：

1. **搜索已有问题：** [GitHub Issues](https://github.com/NousResearch/hermes-agent/issues)
2. **询问社区：** [Nous Research Discord](https://discord.gg/nousresearch)
3. **提交错误报告：** 包含你的操作系统、Python 版本（`python3 --version`）、Hermes 版本（`hermes --version`）以及完整的错误信息