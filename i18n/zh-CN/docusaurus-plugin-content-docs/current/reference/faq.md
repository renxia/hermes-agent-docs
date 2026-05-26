---
sidebar_position: 3
title: "常见问题与故障排除"
description: "关于 Hermes 智能体的常见问题解答及常见问题的解决方案"
---

# 常见问题与故障排除

针对最常见问题和疑问的快速解答与修复方法。

---

## 常见问题

### 哪些 LLM 提供商支持 Hermes？

Hermes 智能体支持任何兼容 OpenAI 的 API。支持的提供商包括：

- **[OpenRouter](https://openrouter.ai/)** — 通过一个 API 密钥访问数百个模型（推荐，灵活性高）
- **Nous Portal** — Nous Research 自有的推理端点
- **OpenAI** — GPT-5.4, GPT-5-codex, GPT-4.1, GPT-4o 等
- **Anthropic** — Claude 模型（直接 API、通过 `hermes login anthropic` 进行 OAuth 认证、OpenRouter 或任何兼容代理）
- **Google** — Gemini 模型（通过 `gemini` 提供商的直接 API、`google-gemini-cli` OAuth 提供商、OpenRouter 或兼容代理）
- **z.ai / 智谱AI** — GLM 模型
- **Kimi / Moonshot AI** — Kimi 模型
- **MiniMax** — 全球和中国端点
- **本地模型** — 通过 [Ollama](https://ollama.com/)、[vLLM](https://docs.vllm.ai/)、[llama.cpp](https://github.com/ggerganov/llama.cpp)、[SGLang](https://github.com/sgl-project/sglang) 或任何兼容 OpenAI 的服务器

使用 `hermes model` 或编辑 `~/.hermes/.env` 来设置您的提供商。所有提供商密钥请参阅 [环境变量](./environment-variables.md) 参考。

### 它能在 Windows 上运行吗？

**不原生支持。** Hermes 智能体需要类 Unix 环境。在 Windows 上，请安装 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) 并在 WSL2 内部运行 Hermes。标准安装命令在 WSL2 中可以完美运行：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

### 我在 WSL2 中运行 Hermes。如何最好地控制我平常使用的 Windows Chrome？

推荐使用 MCP 桥接，而非 `/browser connect`。

推荐模式：

- 在 WSL2 内部运行 Hermes
- 继续在 Windows 上使用您平常已登录的 Chrome
- 通过 `cmd.exe` 或 `powershell.exe` 添加 `chrome-devtools-mcp` 作为 MCP 服务器
- 让 Hermes 使用生成的 MCP 浏览器工具

这比尝试强制 Hermes 核心浏览器传输直接跨越 WSL2/Windows 边界附加更可靠。

参见：

- [在 Hermes 中使用 MCP](../guides/use-mcp-with-hermes.md#wsl2-bridge-hermes-in-wsl-to-windows-chrome)
- [浏览器自动化](../user-guide/features/browser.md#wsl2--windows-chrome-prefer-mcp-over-browser-connect)

### 它能在 Android / Termux 上运行吗？

可以 —— Hermes 现在为 Android 手机提供了一个经过测试的 Termux 安装路径。

快速安装：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

有关完整明确的手动步骤、支持的附加功能和当前限制，请参阅 [Termux 指南](../getting-started/termux.md)。

重要提示：完整的 `.[all]` 附加功能目前无法在 Android 上使用，因为 `voice` 附加功能依赖于 `faster-whisper` → `ctranslate2`，而 `ctranslate2` 没有发布 Android 轮子。请改用经过测试的 `.[termux]` 附加功能。

### 我的数据会被发送到任何地方吗？

API 调用 **仅发送到您配置的 LLM 提供商**（例如 OpenRouter、您的本地 Ollama 实例）。Hermes 智能体不收集遥测数据、使用数据或分析数据。您的对话、记忆和技能都存储在本地的 `~/.hermes/` 目录中。

### 我可以离线使用或使用本地模型吗？

可以。运行 `hermes model`，选择 **Custom endpoint**，然后输入您的服务器 URL：

```bash
hermes model
# 选择: Custom endpoint (手动输入 URL)
# API 基础 URL: http://localhost:11434/v1
# API 密钥: ollama
# 模型名称: qwen3.5:27b
# 上下文长度: 64000   ← Hermes 的最小值；请将其设置为与您服务器实际上下文窗口匹配
```

或者直接在 `config.yaml` 中配置：

```yaml
model:
  default: qwen3.5:27b
  provider: custom
  base_url: http://localhost:11434/v1
```

Hermes 将端点、提供商和基础 URL 持久化在 `config.yaml` 中，以便在重启后保留。如果您的本地服务器只加载了一个模型，`/model custom` 会自动检测到它。您也可以在 config.yaml 中设置 `provider: custom` —— 它是一个一级提供商，不是其他任何东西的别名。

这适用于 Ollama、vLLM、llama.cpp 服务器、SGLang、LocalAI 等。详情请参阅 [配置指南](../user-guide/configuration.md)。

:::tip Ollama 用户
如果您在 Ollama 中设置了自定义 `num_ctx`（例如 `ollama run --num_ctx 64000`），请确保在 Hermes 中设置匹配的上下文长度 —— Ollama 的 `/api/show` 报告的是模型的*最大*上下文，而不是您配置的有效 `num_ctx`。
:::

:::tip 本地模型超时
Hermes 会自动检测本地端点并放宽流式超时（读取超时从 120 秒提高到 1800 秒，禁用陈旧流检测）。如果您在非常大的上下文上仍然遇到超时，请在您的 `.env` 文件中设置 `HERMES_STREAM_READ_TIMEOUT=1800`。详情请参阅 [本地 LLM 指南](../guides/local-llm-on-mac.md#timeouts)。
:::

### 它要花多少钱？

Hermes 智能体本身是 **免费且开源的**（MIT 许可证）。您只需支付所选提供商的 LLM API 使用费用。运行本地模型完全免费。

### 多个用户可以使用同一个实例吗？

可以。[消息网关](../user-guide/messaging/index.md) 允许多个用户通过 Telegram、Discord、Slack、WhatsApp 或 Home Assistant 与同一个 Hermes 智能体实例进行交互。访问通过允许列表（特定用户 ID）和 DM 配对（第一个发消息的用户获得访问权）来控制。

### 记忆和技能有什么区别？

- **记忆** 存储 **事实** —— 智能体知道的关于您、您的项目和偏好的信息。记忆会根据相关性自动检索。
- **技能** 存储 **程序** —— 关于如何做某事的逐步说明。当智能体遇到类似任务时，会回忆起技能。

两者都会在会话间保持持久化。详情请参阅 [记忆](../user-guide/features/memory.md) 和 [技能](../user-guide/features/skills.md)。

### 我可以在自己的 Python 项目中使用它吗？

可以。导入 `AIAgent` 类并以编程方式使用 Hermes：

```python
from run_agent import AIAgent

agent = AIAgent(model="anthropic/claude-opus-4.7")
response = agent.chat("简要解释一下量子计算")
```

完整的 API 用法请参阅 [Python 库指南](../user-guide/features/code-execution.md)。

---

## 故障排除

### 安装问题

#### 安装后提示 `hermes: command not found`

**原因：** 您的 shell 尚未重新加载更新后的 PATH。

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
安装程序会将 `~/.local/bin` 添加到您的 PATH。如果您使用的是非标准的 shell 配置，请手动添加 `export PATH="$HOME/.local/bin:$PATH"`。
:::

#### Python 版本过旧

**原因：** Hermes 需要 Python 3.11 或更新版本。

**解决方案：**
```bash
python3 --version   # 检查当前版本

# 安装更新的 Python
sudo apt install python3.12   # Ubuntu/Debian
brew install python@3.12      # macOS
```

安装程序会自动处理此问题 — 如果您在手动安装过程中看到此错误，请先升级 Python。

#### 终端命令提示 `node: command not found`（或 `nvm`、`pyenv`、`asdf` 等）

**原因：** Hermes 在启动时通过运行一次 `bash -l` 来构建每次会话的环境快照。Bash 登录 shell 会读取 `/etc/profile`、`~/.bash_profile` 和 `~/.profile`，但 **不会加载 `~/.bashrc`** — 因此将自身安装到 `~/.bashrc` 中的工具（如 `nvm`、`asdf`、`pyenv`、`cargo`、自定义 `PATH` 导出）对快照是不可见的。这种情况最常发生在 Hermes 在 systemd 下运行，或者在没有预加载交互式 shell 配置文件的最小化 shell 中运行时。

**解决方案：** Hermes 默认会自动加载 `~/.bashrc`。如果这还不够 — 例如，您是 PATH 配置在 `~/.zshrc` 中的 zsh 用户，或者您从单独的文件初始化 `nvm` — 请在 `~/.hermes/config.yaml` 中列出需要加载的额外文件：

```yaml
terminal:
  shell_init_files:
    - ~/.zshrc                     # zsh 用户：将 zsh 管理的 PATH 拉入 bash 快照
    - ~/.nvm/nvm.sh                # 直接初始化 nvm（无论使用哪种 shell 都有效）
    - /etc/profile.d/cargo.sh      # 系统范围的 rc 文件
  # 设置此列表时，不会自动添加默认的 ~/.bashrc —
  # 如果需要两者都包含，请明确添加：
  #   - ~/.bashrc
  #   - ~/.zshrc
```

缺失的文件会被静默跳过。加载操作在 bash 中进行，因此依赖 zsh 专有语法的文件可能会报错 — 如果有此顾虑，可以仅加载 PATH 设置部分（例如直接加载 nvm 的 `nvm.sh`），而不是整个 rc 文件。

要禁用自动加载行为（仅使用严格的登录 shell 语义）：

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

#### 安装期间出现权限被拒绝错误

**原因：** 没有写入安装目录的足够权限。

**解决方案：**
```bash
# 不要对安装程序使用 sudo — 它会安装到 ~/.local/bin
# 如果您之前使用 sudo 安装过，请清理：
sudo rm /usr/local/bin/hermes
# 然后重新运行标准安装程序
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

---

### 提供商与模型问题

#### `/model` 只显示一个提供商 / 无法切换提供商

**原因：** `/model`（在聊天会话内）只能在您 **已经配置过** 的提供商之间切换。如果您只设置了 OpenRouter，那么 `/model` 就只会显示它。

**解决方案：** 退出当前会话，并在终端中使用 `hermes model` 添加新的提供商：

```bash
# 首先退出 Hermes 聊天会话（Ctrl+C 或 /quit）

# 运行完整的提供商设置向导
hermes model

# 这允许您：添加提供商、运行 OAuth、输入 API 密钥、配置端点
```

通过 `hermes model` 添加新提供商后，启动新的聊天会话 — `/model` 现在将显示您所有已配置的提供商。

:::tip 快速参考
| 想要... | 使用 |
|-----------|-----|
| 添加新的提供商 | `hermes model`（从终端） |
| 输入/更改 API 密钥 | `hermes model`（从终端） |
| 会话中切换模型 | `/model <名称>`（会话内） |
| 切换到不同的已配置提供商 | `/model 提供商:模型`（会话内） |
:::

#### API 密钥无效

**原因：** 密钥缺失、过期、设置错误或用于错误的提供商。

**解决方案：**
```bash
# 检查您的配置
hermes config show

# 重新配置您的提供商
hermes model

# 或者直接设置
hermes config set OPENROUTER_API_KEY sk-or-v1-xxxxxxxxxxxx
```

:::warning
确保密钥与提供商匹配。OpenAI 密钥无法用于 OpenRouter，反之亦然。检查 `~/.hermes/.env` 中是否存在冲突条目。
:::

#### 模型不可用 / 找不到模型

**原因：** 模型标识符不正确或您的提供商上不可用。

**解决方案：**
```bash
# 列出您提供商的可用模型
hermes model

# 设置一个有效的模型
hermes config set HERMES_MODEL anthropic/claude-opus-4.7

# 或者按会话指定
hermes chat --model openrouter/meta-llama/llama-3.1-70b-instruct
```

#### 速率限制（429 错误）

**原因：** 您已超出提供商的速率限制。

**解决方案：** 等待片刻后重试。对于持续使用，可以考虑：
- 升级您的提供商套餐
- 切换到不同的模型或提供商
- 使用 `hermes chat --provider <备选方案>` 路由到不同的后端

#### 超出上下文长度

**原因：** 对话内容过长，超出了模型的上下文窗口，或者 Hermes 为您的模型检测到了错误的上下文长度。

**解决方案：**
```bash
# 压缩当前会话
/compress

# 或者开始一个新会话
hermes chat

# 使用具有更大上下文窗口的模型
hermes chat --model openrouter/google/gemini-3-flash-preview
```

如果在第一次长对话中出现此问题，Hermes 可能为您的模型检测到了错误的上下文长度。检查它检测到的值：

查看 CLI 启动行 — 它显示了检测到的上下文长度（例如，`📊 Context limit: 128000 tokens`）。您也可以在会话中使用 `/usage` 进行检查。

要修复上下文检测，请明确设置它：

```yaml
# 在 ~/.hermes/config.yaml 中
model:
  default: 您的模型名称
  context_length: 131072  # 您模型的实际上下文窗口
```

或者对于自定义端点，可以按模型添加：

```yaml
custom_providers:
  - name: "我的服务器"
    base_url: "http://localhost:11434/v1"
    models:
      qwen3.5:27b:
        context_length: 64000
```

请参阅 [上下文长度检测](../integrations/providers.md#context-length-detection) 了解自动检测的工作原理和所有覆盖选项。

---

### 终端问题

#### 命令被标记为危险而阻止

**原因：** Hermes 检测到潜在的破坏性命令（例如 `rm -rf`、`DROP TABLE`）。这是一个安全功能。

**解决方案：** 出现提示时，检查命令并输入 `y` 批准执行。您也可以：
- 要求智能体使用更安全的替代方案
- 在 [安全文档](../user-guide/security.md) 中查看完整的危险模式列表

:::tip
这是预期行为 — Hermes 不会静默运行破坏性命令。批准提示会准确显示将要执行的内容。
:::

#### 通过消息网关无法使用 `sudo`

**原因：** 消息网关在没有交互式终端的情况下运行，因此 `sudo` 无法提示输入密码。

**解决方案：**
- 在消息传递中避免使用 `sudo` — 要求智能体寻找替代方案
- 如果必须使用 `sudo`，请在 `/etc/sudoers` 中为特定命令配置无密码 sudo
- 或者切换到终端界面执行管理任务：`hermes chat`

#### Docker 后端无法连接

**原因：** Docker 守护进程未运行或用户缺少权限。

**解决方案：**
```bash
# 检查 Docker 是否运行
docker info

# 将您的用户添加到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证
docker run hello-world
```

---

### 消息传递问题

#### 机器人不响应消息

**原因：** 机器人未运行、未授权，或者您的用户不在允许列表中。

**解决方案：**
```bash
# 检查网关是否正在运行
hermes gateway status

# 启动网关
hermes gateway start

# 检查日志中的错误
cat ~/.hermes/logs/gateway.log | tail -50
```

#### 消息未送达

**原因：** 网络问题、机器人令牌过期或平台 webhook 配置错误。

**解决方案：**
- 使用 `hermes gateway setup` 验证您的机器人令牌是否有效
- 检查网关日志：`cat ~/.hermes/logs/gateway.log | tail -50`
- 对于基于 webhook 的平台（Slack、WhatsApp），确保您的服务器可以公开访问

#### 允许列表困惑 — 谁可以与机器人对话？

**原因：** 授权模式决定了谁可以访问。

**解决方案：**

| 模式 | 工作原理 |
|------|-------------|
| **允许列表** | 只有配置中列出的用户 ID 才能交互 |
| **DM 配对** | 第一个在 DM 中发消息的用户获得独占访问权 |
| **开放** | 任何人都可以交互（不建议用于生产环境） |

在 `~/.hermes/config.yaml` 中您的网关设置下进行配置。请参阅 [消息传递文档](../user-guide/messaging/index.md)。

#### 网关无法启动

**原因：** 缺少依赖项、端口冲突或令牌配置错误。

**解决方案：**
```bash
# 安装核心消息网关依赖项
pip install "hermes-agent[messaging]"  # Telegram、Discord、Slack 和共享网关依赖项

# 检查端口冲突
lsof -i :8080

# 验证配置
hermes config show
```

#### WSL：网关持续断开连接或 `hermes gateway start` 失败

**原因：** WSL 的 systemd 支持不可靠。许多 WSL2 安装没有启用 systemd，即使启用了，服务也可能在 WSL 重启或 Windows 空闲关机时无法存活。

**解决方案：** 使用前台模式代替 systemd 服务：

```bash
# 选项 1：直接前台模式（最简单）
hermes gateway run

# 选项 2：通过 tmux 持久化（关闭终端后仍存活）
tmux new -s hermes 'hermes gateway run'
# 稍后重新附加：tmux attach -t hermes

# 选项 3：通过 nohup 后台运行
nohup hermes gateway run > ~/.hermes/logs/gateway.log 2>&1 &
```

如果您仍想尝试 systemd，请确保它已启用：

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
1. 创建一个运行 `wsl -d Ubuntu -- bash -lc 'hermes gateway run'` 的任务
2. 将其设置为在用户登录时触发
:::

#### macOS：Node.js / ffmpeg 或其他工具未被网关找到

**原因：** launchd 服务继承的是最小化的 PATH（`/usr/bin:/bin:/usr/sbin:/sbin`），不包括 Homebrew、nvm、cargo 或其他用户安装的工具目录。这通常会导致 WhatsApp 桥接器出现问题（`node not found`）或语音转录失败（`ffmpeg not found`）。

**解决方案：** 当您运行 `hermes gateway install` 时，网关会捕获您的 shell PATH。如果您在设置网关后安装了工具，请重新运行安装以捕获更新的 PATH：

```bash
hermes gateway install    # 重新快照您当前的 PATH
hermes gateway start      # 检测更新的 plist 并重新加载
```

您可以验证 plist 是否包含正确的 PATH：
```bash
/usr/libexec/PlistBuddy -c "Print :EnvironmentVariables:PATH" \
  ~/Library/LaunchAgents/ai.hermes.gateway.plist
```

---

### 性能问题

#### 响应缓慢

**原因：** 大型模型、较远的 API 服务器，或包含许多工具的大型系统提示。

**解决方案：**
- 尝试更快/更小的模型：`hermes chat --model openrouter/meta-llama/llama-3.1-8b-instruct`
- 减少活动工具集：`hermes chat -t "terminal"`
- 检查您到提供商的网络延迟
- 对于本地模型，确保有足够的 GPU VRAM

#### 高 token 使用量

**原因：** 较长的对话、冗长的系统提示，或许多工具调用累积了上下文。

**解决方案：**
```bash
# 压缩对话以减少 token 使用
/compress

# 检查会话 token 使用情况
/usage
```

:::tip
在长会话中定期使用 `/compress`。它可以总结对话历史，在保留上下文的同时显著减少 token 使用量。
:::

#### 会话变得过长

**原因：** 扩展的对话积累了消息和工具输出，接近上下文限制。

**解决方案：**
```bash
# 压缩当前会话（保留关键上下文）
/compress

# 开始一个引用旧会话的新会话
hermes chat

# 稍后如需继续特定会话
hermes chat --continue
```

---

### MCP 问题

#### MCP 服务器未连接

**原因：** 未找到服务器二进制文件、命令路径错误或缺少运行时。

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

#### MCP 服务器的工具未显示

**原因：** 服务器已启动但工具发现失败，工具被配置过滤掉，或者服务器不支持您预期的 MCP 功能。

**解决方案：**
- 检查网关/智能体日志中的 MCP 连接错误
- 确保服务器响应 `tools/list` RPC 方法
- 检查该服务器下的 `tools.include`、`tools.exclude`、`tools.resources`、`tools.prompts` 或 `enabled` 设置
- 请记住，资源/提示实用工具仅在会话实际支持这些功能时才会注册
- 更改配置后使用 `/reload-mcp`

```bash
# 验证 MCP 服务器已配置
hermes config show | grep -A 12 mcp_servers

# 配置更改后重启 Hermes 或重新加载 MCP
hermes chat
```

另请参阅：
- [MCP（模型上下文协议）](/user-guide/features/mcp)
- [在 Hermes 中使用 MCP](/guides/use-mcp-with-hermes)
- [MCP 配置参考](/reference/mcp-config-reference)

#### MCP 超时错误

**原因：** MCP 服务器响应时间过长，或者在执行过程中崩溃。

**解决方案：**
- 如果支持，在您的 MCP 服务器配置中增加超时时间
- 检查 MCP 服务器进程是否仍在运行
- 对于远程 HTTP MCP 服务器，检查网络连接

:::warning
如果 MCP 服务器在请求过程中崩溃，Hermes 将报告超时。检查服务器自身的日志（而不仅仅是 Hermes 日志）以诊断根本原因。
:::

---

# 配置文件

### 配置文件与仅设置 HERMES_HOME 有何不同？

配置文件是在 `HERMES_HOME` 之上的管理层。您*可以*在每次运行命令前手动设置 `HERMES_HOME=/some/path`，但配置文件会为您处理所有繁琐的细节：创建目录结构、生成 shell 别名（`hermes-work`）、跟踪活动配置文件（在 `~/.hermes/active_profile` 中），并自动在所有配置文件间同步技能更新。它们还集成了 tab 补全功能，因此您无需记住路径。

### 两个配置文件能否共享同一个 bot token？

不能。每个消息平台（Telegram、Discord 等）都需要独占访问一个 bot token。如果两个配置文件同时尝试使用相同的 token，第二个网关将无法连接。请为每个配置文件创建一个独立的 bot——对于 Telegram，请与 [@BotFather](https://t.me/BotFather) 交谈以创建额外的 bot。

### 配置文件之间共享内存或会话吗？

不共享。每个配置文件都有自己的内存存储、会话数据库和技能目录。它们是完全隔离的。如果您希望以现有的内存和会话启动一个新配置文件，请使用 `hermes profile create newname --clone-all` 来复制当前配置文件中的所有内容。

### 运行 `hermes update` 会发生什么？

`hermes update` 会拉取最新代码并**一次性**重新安装依赖（而不是针对每个配置文件）。然后，它会自动将更新的技能同步到所有配置文件。您只需要运行一次 `hermes update`——它会覆盖机器上的每个配置文件。


### 我可以运行多少个配置文件？

没有硬性限制。每个配置文件只是 `~/.hermes/profiles/` 下的一个目录。实际限制取决于您的磁盘空间以及系统可以同时处理多少个网关（每个网关是一个轻量级的 Python 进程）。运行数十个配置文件是没问题的；每个空闲的配置文件不消耗任何资源。

---

## 工作流程与模式

### 针对不同任务使用不同模型（多模型工作流）

**场景：** 你日常使用 GPT-5.4，但 Gemini 或 Grok 写社交媒体内容更好。每次手动切换模型很麻烦。

**解决方案：委派配置。** Hermes 可以自动将子智能体路由到不同的模型。在 `~/.hermes/config.yaml` 中设置：

```yaml
delegation:
  model: "google/gemini-3-flash-preview"   # 子智能体使用此模型
  provider: "openrouter"                    # 子智能体的提供商
```

现在，当你告诉 Hermes "给我写一个关于 X 的 Twitter 帖子串"，它会生成一个 `delegate_task` 子智能体，该子智能体会在 Gemini 上运行，而不是你的主模型。你的主对话仍然使用 GPT-5.4。

你也可以在提示中明确说明：*“委派一个任务来写关于我们产品发布的社交媒体帖子。用你的子智能体来实际写作。”* 智能体会使用 `delegate_task`，它会自动获取委派配置。

如果是一次性模型切换，不使用委派，请在 CLI 中使用 `/model`：

```bash
/model google/gemini-3-flash-preview    # 本次会话切换
# ... 写你的内容 ...
/model openai/gpt-5.4                   # 切换回来
```

有关委派工作原理的更多信息，请参阅 [子智能体委派](../user-guide/features/delegation.md)。

### 在一个 WhatsApp 号码上运行多个智能体（按聊天绑定）

**场景：** 在 OpenClaw 中，你可以将多个独立的智能体绑定到特定的 WhatsApp 聊天——一个用于家庭购物群组，另一个用于你的私人聊天。Hermes 能做到吗？

**当前限制：** Hermes 配置文件各自需要自己的 WhatsApp 号码/会话。你无法将多个配置文件绑定到同一个 WhatsApp 号码的不同聊天上——WhatsApp 桥接器 (Baileys) 每个号码使用一个已认证的会话。

**变通方法：**

1. **使用单个配置文件并切换人格。** 创建不同的 `AGENTS.md` 上下文文件，或使用 `/personality` 命令来按聊天改变行为。智能体能看到它在哪个聊天中并可以适应。
2. **使用定时任务处理专门任务。** 对于购物清单跟踪器，可以设置一个定时任务来监控特定聊天并管理清单——不需要单独的智能体。
3. **使用不同的号码。** 如果你需要真正独立的智能体，请为每个配置文件配备自己的 WhatsApp 号码。来自 Google Voice 等服务的虚拟号码可用于此目的。
4. **改用 Telegram 或 Discord。** 这些平台更自然地支持按聊天绑定——每个 Telegram 群组或 Discord 频道都有自己的会话，你可以在同一账户上运行多个机器人令牌（每个配置文件一个）。

详情请参阅 [配置文件](../user-guide/profiles.md) 和 [WhatsApp 设置](../user-guide/messaging/whatsapp.md)。

### 控制 Telegram 中显示的内容（隐藏日志和推理）

**场景：** 你在 Telegram 中看到网关执行日志、Hermes 推理和工具调用细节，而不是仅看到最终输出。

**解决方案：** `config.yaml` 中的 `display.tool_progress` 设置控制显示多少工具活动：

```yaml
display:
  tool_progress: "off"   # 选项：off, new, all, verbose
```

- **`off`** — 仅显示最终响应。没有工具调用、没有推理、没有日志。
- **`new`** — 在发生时显示新的工具调用（简短的一行提示）。
- **`all`** — 显示包括结果在内的所有工具活动。
- **`verbose`** — 包括工具参数和输出在内的完整细节。

对于消息平台，通常 `off` 或 `new` 是你想要的。编辑 `config.yaml` 后，重启网关以使更改生效。

你也可以使用 `/verbose` 命令（如果已启用）按会话切换：

```yaml
display:
  tool_progress_command: true   # 在网关中启用 /verbose
```

### 在 Telegram 上管理技能（斜杠命令限制）

**场景：** Telegram 有 100 个斜杠命令的限制，而你的技能数量已经超出了。你想禁用 Telegram 上不需要的技能，但 `hermes skills config` 设置似乎没有生效。

**解决方案：** 使用 `hermes skills config` 按平台禁用技能。这会写入 `config.yaml`：

```yaml
skills:
  disabled: []                    # 全局禁用的技能
  platform_disabled:
    telegram: [skill-a, skill-b]  # 仅在 Telegram 上禁用
```

更改后，**重启网关**（`hermes gateway restart` 或终止并重新启动）。Telegram 机器人命令菜单会在启动时重建。

:::tip
描述非常长的技能在 Telegram 菜单中会被截断为 40 个字符，以保持在有效负载大小限制内。如果技能没有出现，可能是总有效负载大小问题，而不是 100 个命令数的限制——禁用未使用的技能对两者都有帮助。
:::

### 共享线程会话（多个用户，一个对话）

**场景：** 你有一个 Telegram 或 Discord 线程，多个人在其中提及机器人。你希望该线程中的所有提及都成为共享对话的一部分，而不是单独的用户会话。

**当前行为：** Hermes 在大多数平台上创建以用户 ID 为键的会话，因此每个人都有自己的对话上下文。这是出于隐私和上下文隔离的设计。

**变通方法：**

1. **使用 Slack。** Slack 会话以线程为键，而不是用户。同一线程中的多个用户共享一个对话——正是你描述的行为。这是最自然的选择。
2. **使用单人用户群聊。** 如果一个人是中继问题的指定“操作员”，会话保持统一。其他人可以旁观。
3. **使用 Discord 频道。** Discord 会话以频道为键，因此同一频道中的所有用户共享上下文。为共享对话使用专用频道。

### 将 Hermes 导出到另一台机器

**场景：** 你在一台机器上构建了技能、定时任务和记忆，想将所有内容移动到新的专用 Linux 机器。

**解决方案：**

1. 在新机器上安装 Hermes 智能体：
   ```bash
   curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
   ```

2. 在**源机器**上，创建完整备份：
   ```bash
   hermes backup
   ```
   这会创建整个 `~/.hermes/` 目录的 zip 文件——包括配置、API 密钥、记忆、技能、会话和配置文件——并保存在你的主目录中，文件名为 `~/hermes-backup-<时间戳>.zip`。

3. 将 zip 文件复制到新机器并导入：
   ```bash
   # 在源机器上
   scp ~/hermes-backup-<timestamp>.zip newmachine:~/

   # 在新机器上
   hermes import ~/hermes-backup-<timestamp>.zip
   ```

4. 在新机器上，运行 `hermes setup` 验证 API 密钥和提供商配置是否正常工作。

### 将单个配置文件移动到另一台机器

**场景：** 你想移动或共享一个特定的配置文件——而不是整个安装。

```bash
# 在源机器上
hermes profile export work ./work-backup.tar.gz

# 将文件复制到目标机器，然后：
hermes profile import ./work-backup.tar.gz work
```

导入的配置文件将包含导出中的所有配置、记忆、会话和技能。如果新机器设置不同，你可能需要更新路径或重新进行提供商身份验证。

### `hermes backup` 与 `hermes profile export` 对比

| 特性 | `hermes backup` | `hermes profile export` |
| :--- | :--- | :--- |
| **用例** | **整机迁移** | **移植/共享特定配置文件** |
| **范围** | 全局（整个 `~/.hermes` 目录） | 本地（单个配置文件目录） |
| **包含内容** | 所有配置文件、全局配置、API 密钥、会话 | 单个配置文件：SOUL.md、记忆、会话、技能 |
| **凭据** | **已包含**（`.env` 和 `auth.json`） | **不包含**（为安全共享而剥离） |
| **格式** | `.zip` | `.tar.gz` |

**手动回退 (rsync)：** 如果你倾向于直接复制文件，请排除代码仓库：
```bash
rsync -av --exclude='hermes-agent' ~/.hermes/ newmachine:~/.hermes/
```

:::tip
`hermes backup` 即使在 Hermes 活跃运行时也能生成一致的快照。恢复的存档不包括机器本地的运行时文件，如 `gateway.pid` 和 `cron.pid`。
:::

### 安装后重新加载 shell 时出现权限被拒绝

**场景：** 运行 Hermes 安装程序后，`source ~/.zshrc` 给出权限被拒绝错误。

**原因：** 通常发生在 `~/.zshrc`（或 `~/.bashrc`）文件权限不正确时，或者安装程序无法干净地写入它。这不是 Hermes 特有的问题——这是 shell 配置的权限问题。

**解决方案：**
```bash
# 检查权限
ls -la ~/.zshrc

# 如果需要则修复（应为 -rw-r--r-- 或 644）
chmod 644 ~/.zshrc

# 然后重新加载
source ~/.zshrc

# 或者只需打开一个新终端窗口——它会自动获取 PATH 更改
```

如果安装程序添加了 PATH 行但权限错误，你可以手动添加：
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
```

### 首次运行智能体时出现 400 错误

**场景：** 设置顺利完成，但首次聊天尝试因 HTTP 400 而失败。

**原因：** 通常是模型名称不匹配——配置的模型在你的提供商那里不存在，或者 API 密钥没有访问权限。

**解决方案：**
```bash
# 检查配置了哪个模型和提供商
hermes config show | head -20

# 重新运行模型选择
hermes model

# 或者用一个已知可用的模型测试
hermes chat -q "hello" --model anthropic/claude-opus-4.7
```

如果使用 OpenRouter，请确保你的 API 密钥有余额。来自 OpenRouter 的 400 错误通常意味着模型需要付费计划，或者模型 ID 有拼写错误。

---
## 仍然卡住？

如果你的问题未在此处涵盖：

1. **搜索现有问题：** [GitHub Issues](https://github.com/NousResearch/hermes-agent/issues)
2. **询问社区：** [Nous Research Discord](https://discord.gg/nousresearch)
3. **提交错误报告：** 包括你的操作系统、Python 版本（`python3 --version`）、Hermes 版本（`hermes --version`）和完整的错误消息