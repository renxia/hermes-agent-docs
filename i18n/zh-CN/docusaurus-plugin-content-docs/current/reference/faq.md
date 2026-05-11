---
sidebar_position: 3
title: "常见问题解答与故障排除"
description: "关于 Hermes 智能体的常见问题解答与常见问题解决方案"
---

# 常见问题解答与故障排除

最常见问题和疑问的快速解答与修复方法。

---

## 常见问题解答

### 哪些 LLM 提供商与 Hermes 兼容？

Hermes 智能体兼容任何 OpenAI 兼容的 API。支持的提供商包括：

- **[OpenRouter](https://openrouter.ai/)** — 通过一个 API 密钥访问数百个模型（推荐，灵活性高）
- **Nous Portal** — Nous Research 自家的推理端点
- **OpenAI** — GPT-5.4、GPT-5-codex、GPT-4.1、GPT-4o 等。
- **Anthropic** — Claude 模型（直接 API、通过 `hermes login anthropic` 进行 OAuth 登录、OpenRouter 或任何兼容代理）
- **Google** — Gemini 模型（通过 `gemini` 提供商直接 API、`google-gemini-cli` OAuth 提供商、OpenRouter 或兼容代理）
- **z.ai / ZhipuAI** — GLM 模型
- **Kimi / Moonshot AI** — Kimi 模型
- **MiniMax** — 全球和中国端点
- **本地模型** — 通过 [Ollama](https://ollama.com/)、[vLLM](https://docs.vllm.ai/)、[llama.cpp](https://github.com/ggerganov/llama.cpp)、[SGLang](https://github.com/sgl-project/sglang) 或任何 OpenAI 兼容服务器

使用 `hermes model` 或编辑 `~/.hermes/.env` 来设置您的提供商。有关所有提供商密钥，请参阅 [环境变量](./environment-variables.md) 参考。

### 它能在 Windows 上运行吗？

**不能原生运行。** Hermes 智能体需要类 Unix 环境。在 Windows 上，请安装 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)，然后在其中运行 Hermes。标准的安装命令在 WSL2 中完全可以正常工作：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

### 我在 WSL2 中运行 Hermes。控制我正常的 Windows Chrome 最佳方式是什么？

推荐使用 MCP 桥接而非 `/browser connect`。

推荐模式：

- 在 WSL2 内部运行 Hermes
- 在 Windows 上继续使用您正常的已登录 Chrome
- 通过 `cmd.exe` 或 `powershell.exe` 将 `chrome-devtools-mcp` 添加为 MCP 服务器
- 让 Hermes 使用生成的 MCP 浏览器工具

这比试图强制 Hermes 核心浏览器传输直接跨 WSL2/Windows 边界附加要可靠得多。

参见：

- [将 MCP 与 Hermes 结合使用](../guides/use-mcp-with-hermes.md#wsl2-bridge-hermes-in-wsl-to-windows-chrome)
- [浏览器自动化](../user-guide/features/browser.md#wsl2--windows-chrome-prefer-mcp-over-browser-connect)

### 它能在 Android / Termux 上运行吗？

可以 — Hermes 现在有一个经过测试的针对 Android 手机的 Termux 安装路径。

快速安装：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

有关完全明确的手动步骤、支持的扩展包和当前限制，请参阅 [Termux 指南](../getting-started/termux.md)。

重要注意事项：完整的 `.[all]` 扩展包目前在 Android 上不可用，因为 `voice` 扩展包依赖于 `faster-whisper` → `ctranslate2`，而 `ctranslate2` 没有提供 Android 轮子。请使用经过测试的 `.[termux]` 扩展包。

### 我的数据会发送到任何地方吗？

API 调用**仅发送到您配置的 LLM 提供商**（例如，OpenRouter、您本地的 Ollama 实例）。Hermes 智能体不收集遥测数据、使用数据或分析数据。您的对话、记忆和技能都本地存储在 `~/.hermes/` 中。

### 我可以在离线状态下 / 使用本地模型运行吗？

可以。运行 `hermes model`，选择 **自定义端点**，然后输入您服务器的 URL：

```bash
hermes model
# 选择: 自定义端点 (手动输入 URL)
# API 基础 URL: http://localhost:11434/v1
# API 密钥: ollama
# 模型名称: qwen3.5:27b
# 上下文长度: 32768   ← 设置此值以匹配您服务器的实际上下文窗口
```

或者直接在 `config.yaml` 中配置：

```yaml
model:
  default: qwen3.5:27b
  provider: custom
  base_url: http://localhost:11434/v1
```

Hermes 会将端点、提供商和基础 URL 持久化保存在 `config.yaml` 中，因此重启后配置仍然存在。如果您的本地服务器恰好加载了一个模型，`/model custom` 会自动检测到它。您也可以在 config.yaml 中设置 `provider: custom` — 它是一个一级提供商，而不是其他任何东西的别名。

这适用于 Ollama、vLLM、llama.cpp 服务器、SGLang、LocalAI 等。详情请参阅 [配置指南](../user-guide/configuration.md)。

:::tip 给 Ollama 用户的提示
如果您在 Ollama 中设置了自定义的 `num_ctx`（例如 `ollama run --num_ctx 16384`），请确保在 Hermes 中设置匹配的上下文长度 — Ollama 的 `/api/show` 报告的是模型的*最大*上下文，而不是您配置的有效 `num_ctx`。
:::

:::tip 使用本地模型时的超时问题
Hermes 会自动检测本地端点并放宽流式传输超时时间（读取超时从 120 秒提高到 1800 秒，禁用过时流检测）。如果您在处理非常大的上下文时仍然遇到超时问题，请在您的 `.env` 中设置 `HERMES_STREAM_READ_TIMEOUT=1800`。详情请参阅 [本地 LLM 指南](../guides/local-llm-on-mac.md#timeouts)。
:::

### 它需要多少费用？

Hermes 智能体本身是**免费且开源**的（MIT 许可证）。您只需支付所选 LLM 提供商的 API 使用费用。本地模型运行完全免费。

### 多个用户可以使用一个实例吗？

可以。[消息网关](../user-guide/messaging/index.md) 允许多个用户通过 Telegram、Discord、Slack、WhatsApp 或 Home Assistant 与同一个 Hermes 智能体实例交互。访问通过允许列表（特定用户 ID）和直接消息配对（第一个发消息的用户获得访问权限）来控制。

### 记忆和技能有什么区别？

- **记忆** 存储**事实** — 智能体了解的关于您、您的项目和偏好的事情。记忆会根据相关性自动检索。
- **技能** 存储**程序** — 关于如何做事情的分步说明。当智能体遇到类似任务时，会调用技能。

两者都跨会话持久化。详情请参阅 [记忆](../user-guide/features/memory.md) 和 [技能](../user-guide/features/skills.md)。

### 我可以在自己的 Python 项目中使用它吗？

可以。导入 `AIAgent` 类并以编程方式使用 Hermes：

```python
from run_agent import AIAgent

agent = AIAgent(model="anthropic/claude-opus-4.7")
response = agent.chat("简要解释一下量子计算")
```

有关完整的 API 用法，请参阅 [Python 库指南](../user-guide/features/code-execution.md)。

---

## 故障排除

### 安装问题

#### 安装后出现 `hermes: command not found`

**原因：** 您的 shell 尚未重新加载更新后的 PATH。

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
安装程序会将 `~/.local/bin` 添加到您的 PATH。如果您使用非标准的 shell 配置，请手动添加 `export PATH="$HOME/.local/bin:$PATH"`。
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

安装程序会自动处理此问题——如果您在手动安装时遇到此错误，请先升级 Python。

#### 终端命令显示 `node: command not found`（或 `nvm`, `pyenv`, `asdf`, …）

**原因：** Hermes 在启动时运行一次 `bash -l` 来构建每个会话的环境快照。bash 登录 shell 会读取 `/etc/profile`、`~/.bash_profile` 和 `~/.profile`，但**不会**源引 `~/.bashrc` —— 因此安装在那里的工具（`nvm`、`asdf`、`pyenv`、`cargo`、自定义的 `PATH` 导出）对快照保持不可见。这最常见于 Hermes 在 systemd 下运行或在最小化 shell 中运行，且未预加载交互式 shell 配置时。

**解决方案：** Hermes 默认会自动源引 `~/.bashrc`。如果这还不够——例如，您是 PATH 位于 `~/.zshrc` 的 zsh 用户，或者从独立文件初始化 `nvm` —— 请在 `~/.hermes/config.yaml` 中列出需要额外源引的文件：

```yaml
terminal:
  shell_init_files:
    - ~/.zshrc                     # zsh 用户：将 zsh 管理的 PATH 拉入 bash 快照
    - ~/.nvm/nvm.sh                # 直接 nvm 初始化（无论使用何种 shell 均有效）
    - /etc/profile.d/cargo.sh      # 系统级的 rc 文件
  # 设置此列表后，不会自动添加默认的 ~/.bashrc ——
  # 如果您希望同时使用两者，请显式包含：
  #   - ~/.bashrc
  #   - ~/.zshrc
```

缺失的文件会被静默跳过。源引操作在 bash 中进行，因此依赖于 zsh 专有语法的文件可能会出错——如果担心这一点，只源引设置 PATH 的部分（例如直接使用 nvm 的 `nvm.sh`），而不是整个 rc 文件。

要禁用自动源引行为（仅使用严格的登录 shell 语义）：

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

#### 安装过程中权限被拒绝

**原因：** 对安装目录的写入权限不足。

**解决方案：**
```bash
# 不要对安装程序使用 sudo —— 它安装到 ~/.local/bin
# 如果您之前使用 sudo 安装过，请清理：
sudo rm /usr/local/bin/hermes
# 然后重新运行标准安装程序
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

---

### 提供商和模型问题

#### `/model` 只显示一个提供商 / 无法切换提供商

**原因：** `/model`（在聊天会话内）只能在您**已配置**的提供商之间切换。如果您只设置了 OpenRouter，那么 `/model` 就只会显示它。

**解决方案：** 退出会话并在终端中使用 `hermes model` 添加新的提供商：

```bash
# 首先退出 Hermes 聊天会话 (Ctrl+C 或 /quit)

# 运行完整的提供商设置向导
hermes model

# 这允许您：添加提供商、运行 OAuth、输入 API 密钥、配置端点
```

通过 `hermes model` 添加新提供商后，启动新的聊天会话 —— `/model` 现在将显示您所有已配置的提供商。

:::tip 快速参考
| 想要... | 使用 |
|-----------|-----|
| 添加新的提供商 | `hermes model` (在终端中) |
| 输入/更改 API 密钥 | `hermes model` (在终端中) |
| 在会话中切换模型 | `/model <名称>` (会话内) |
| 切换到不同的已配置提供商 | `/model provider:model` (会话内) |
:::

#### API 密钥无效

**原因：** 密钥缺失、过期、设置错误或适用于错误的提供商。

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
请确保密钥与提供商匹配。OpenAI 的密钥无法用于 OpenRouter，反之亦然。检查 `~/.hermes/.env` 是否有冲突的条目。
:::

#### 模型不可用 / 找不到模型

**原因：** 模型标识符不正确或在您的提供商上不可用。

**解决方案：**
```bash
# 列出您的提供商可用的模型
hermes model

# 设置一个有效的模型
hermes config set HERMES_MODEL anthropic/claude-opus-4.7

# 或者在每次会话中指定
hermes chat --model openrouter/meta-llama/llama-3.1-70b-instruct
```

#### 速率限制（429 错误）

**原因：** 您已超出提供商的速率限制。

**解决方案：** 稍等片刻后重试。对于持续使用，请考虑：
- 升级您的提供商计划
- 切换到不同的模型或提供商
- 使用 `hermes chat --provider <替代项>` 路由到不同的后端

#### 超出上下文长度

**原因：** 对话内容增长过长，超出了模型的上下文窗口，或者 Hermes 检测到的模型上下文长度有误。

**解决方案：**
```bash
# 压缩当前会话
/compress

# 或开始一个新的会话
hermes chat

# 使用具有更大上下文窗口的模型
hermes chat --model openrouter/google/gemini-3-flash-preview
```

如果这发生在首次长对话中，Hermes 可能错误检测了您模型的上下文长度。检查它检测到的结果：

查看 CLI 启动行 —— 它会显示检测到的上下文长度（例如，`📊 Context limit: 128000 tokens`）。您也可以在会话期间使用 `/usage` 查看。

要修复上下文检测，请显式设置：

```yaml
# 在 ~/.hermes/config.yaml 中
model:
  default: 您的模型名称
  context_length: 131072  # 您模型的实际上下文窗口
```

对于自定义端点，可以按模型添加：

```yaml
custom_providers:
  - name: "我的服务器"
    base_url: "http://localhost:11434/v1"
    models:
      qwen3.5:27b:
        context_length: 32768
```

有关自动检测的工作原理和所有覆盖选项，请参阅[上下文长度检测](../integrations/providers.md#context-length-detection)。

---

### 终端问题

#### 命令因危险而被阻止

**原因：** Hermes 检测到潜在的破坏性命令（例如 `rm -rf`、`DROP TABLE`）。这是一项安全功能。

**解决方案：** 当提示时，检查命令并输入 `y` 以批准它。您也可以：
- 要求智能体使用更安全的替代方案
- 在[安全文档](../user-guide/security.md)中查看完整的危险模式列表

:::tip
这是预期的行为 —— Hermes 永远不会静默运行破坏性命令。批准提示会准确显示将要执行的内容。
:::

#### 通过消息网关使用 `sudo` 无效

**原因：** 消息网关在没有交互式终端的情况下运行，因此 `sudo` 无法提示输入密码。

**解决方案：**
- 在消息网关中避免使用 `sudo` —— 要求智能体寻找替代方案
- 如果必须使用 `sudo`，请在 `/etc/sudoers` 中为特定命令配置无密码 sudo
- 或者切换到终端界面进行管理任务：`hermes chat`

#### Docker 后端无法连接

**原因：** Docker 守护进程未运行或用户权限不足。

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

#### 机器人不响应消息

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

#### 消息无法送达

**原因：** 网络问题、机器人令牌过期或平台 Webhook 配置错误。

**解决方案：**
- 使用 `hermes gateway setup` 验证您的机器人令牌是否有效
- 检查网关日志：`cat ~/.hermes/logs/gateway.log | tail -50`
- 对于基于 Webhook 的平台（Slack、WhatsApp），请确保您的服务器可公开访问

#### 允许列表混淆 —— 谁可以与机器人对话？

**原因：** 授权模式决定谁可以访问。

**解决方案：**

| 模式 | 工作原理 |
|------|----------|
| **允许列表** | 只有配置中列出的用户 ID 才能交互 |
| **DM 配对** | 第一个在私信中发送消息的用户获得独占访问权 |
| **开放** | 任何人都可以交互（不建议用于生产环境） |

在 `~/.hermes/config.yaml` 中您的网关设置下进行配置。请参阅[消息文档](../user-guide/messaging/index.md)。

#### 网关无法启动

**原因：** 缺少依赖项、端口冲突或令牌配置错误。

**解决方案：**
```bash
# 安装核心消息网关依赖项
pip install "hermes-agent[messaging]"  # Telegram, Discord, Slack 及共享网关依赖

# 检查端口冲突
lsof -i :8080

# 验证配置
hermes config show
```

#### WSL：网关持续断开连接或 `hermes gateway start` 失败

**原因：** WSL 的 systemd 支持不稳定。许多 WSL2 安装未启用 systemd，即使启用，服务也可能无法在 WSL 重启或 Windows 空闲关闭后幸存。

**解决方案：** 使用前台模式而非 systemd 服务：

```bash
# 选项 1：直接前台运行（最简单）
hermes gateway run

# 选项 2：通过 tmux 保持会话（终端关闭后仍存在）
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
3. 在 PowerShell 中执行：`wsl --shutdown`
4. 重新打开您的 WSL 终端
5. 验证：`systemctl is-system-running` 应显示 "running" 或 "degraded"

:::tip Windows 启动时自动启动
要实现可靠的自动启动，请使用 Windows 任务计划程序在登录时启动 WSL + 网关：
1. 创建一个运行 `wsl -d Ubuntu -- bash -lc 'hermes gateway run'` 的任务
2. 将其触发器设置为用户登录时
:::

#### macOS：网关找不到 Node.js / ffmpeg / 其他工具

**原因：** launchd 服务继承最小化的 PATH（`/usr/bin:/bin:/usr/sbin:/sbin`），不包括 Homebrew、nvm、cargo 或其他用户安装的工具目录。这通常会导致 WhatsApp 桥接（`node not found`）或语音转录（`ffmpeg not found`）中断。

**解决方案：** 当您运行 `hermes gateway install` 时，网关会捕获您的 shell PATH。如果您在设置网关后安装了工具，请重新运行安装以捕获更新后的 PATH：

```bash
hermes gateway install    # 重新快照您当前的 PATH
hermes gateway start      # 检测更新后的 plist 并重新加载
```

您可以验证 plist 是否包含正确的 PATH：
```bash
/usr/libexec/PlistBuddy -c "Print :EnvironmentVariables:PATH" \
  ~/Library/LaunchAgents/ai.hermes.gateway.plist
```

---

### 性能问题

#### 响应缓慢

**原因：** 大型模型、API 服务器距离远或系统提示词过大且包含许多工具。

**解决方案：**
- 尝试更快/更小的模型：`hermes chat --model openrouter/meta-llama/llama-3.1-8b-instruct`
- 减少活动工具集：`hermes chat -t "terminal"`
- 检查您到提供商的网络延迟
- 对于本地模型，确保有足够的 GPU VRAM

#### 高令牌用量

**原因：** 长对话、冗长的系统提示词或许多工具调用累积上下文。

**解决方案：**
```bash
# 压缩对话以减少令牌用量
/compress

# 检查会话令牌使用情况
/usage
```

:::tip
在长会话中定期使用 `/compress`。它会总结对话历史，并在保留上下文的同时显著减少令牌用量。
:::

#### 会话变得过长

**原因：** 长时间对话会累积消息和工具输出，接近上下文限制。

**解决方案：**
```bash
# 压缩当前会话（保留关键上下文）
/compress

# 开始一个新会话并引用旧会话
hermes chat

# 如果需要，稍后恢复特定会话
hermes chat --continue
```

---

### MCP 问题

#### MCP 服务器无法连接

**原因：** 服务器二进制文件未找到、命令路径错误或缺少运行时。

**解决方案：**
```bash
# 确保 MCP 依赖已安装（标准安装已包含）
cd ~/.hermes/hermes-agent && uv pip install -e ".[mcp]"

# 对于基于 npm 的服务器，确保 Node.js 可用
node --version
npx --version

# 手动测试服务器
npx -y @modelcontextprotocol/server-filesystem /tmp
```

验证您的 `~/.hermes/config.yaml` 中的 MCP 配置：
```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
```

#### MCP 服务器中的工具未显示

**原因：** 服务器已启动但工具发现失败，工具被配置过滤掉，或者服务器不支持您期望的 MCP 功能。

**解决方案：**
- 检查网关/智能体日志中的 MCP 连接错误
- 确保服务器响应 `tools/list` RPC 方法
- 检查该服务器下的 `tools.include`、`tools.exclude`、`tools.resources`、`tools.prompts` 或 `enabled` 设置
- 请记住，资源/提示工具只有在会话实际支持这些功能时才会注册
- 更改配置后使用 `/reload-mcp`

```bash
# 验证 MCP 服务器是否已配置
hermes config show | grep -A 12 mcp_servers

# 更改配置后重启 Hermes 或重新加载 MCP
hermes chat
```

另请参阅：
- [MCP (模型上下文协议)](/docs/user-guide/features/mcp)
- [在 Hermes 中使用 MCP](/docs/guides/use-mcp-with-hermes)
- [MCP 配置参考](/docs/reference/mcp-config-reference)

#### MCP 超时错误

**原因：** MCP 服务器响应时间过长，或在执行过程中崩溃。

**解决方案：**
- 如果支持，请在 MCP 服务器配置中增加超时时间
- 检查 MCP 服务器进程是否仍在运行
- 对于远程 HTTP MCP 服务器，检查网络连接

:::warning
如果 MCP 服务器在请求过程中崩溃，Hermes 将报告超时。请检查服务器自身的日志（而不仅仅是 Hermes 日志）以诊断根本原因。
:::

---

## 配置文件

### 配置文件与仅设置 HERMES_HOME 有何不同？

配置文件是在 `HERMES_HOME` 之上构建的一个托管层。您*可以*在每次执行命令前手动设置 `HERMES_HOME=/some/path`，但配置文件为您处理了所有繁琐工作：创建目录结构、生成 shell 别名（`hermes-work`）、在 `~/.hermes/active_profile` 中跟踪活动配置文件，并自动在所有配置文件间同步技能更新。它们还与制表符补全集成，因此您无需记住路径。

### 两个配置文件可以共享同一个机器人令牌吗？

不能。每个消息传递平台（Telegram、Discord 等）都需要独占一个机器人令牌。如果两个配置文件尝试同时使用同一个令牌，第二个网关将无法连接。请为每个配置文件创建单独的机器人 — 对于 Telegram，可以通过 [@BotFather](https://t.me/BotFather) 创建额外的机器人。

### 配置文件共享记忆或会话吗？

不共享。每个配置文件都有自己的记忆存储、会话数据库和技能目录。它们是完全隔离的。如果您想基于现有记忆和会话创建一个新的配置文件，请使用 `hermes profile create newname --clone-all` 来从当前配置文件复制所有内容。

### 运行 `hermes update` 时会发生什么？

`hermes update` 会拉取最新代码并**一次性**重新安装依赖（不是按配置文件）。然后它会自动将更新后的技能同步到所有配置文件。您只需运行一次 `hermes update` — 它将覆盖机器上的所有配置文件。


### 我可以运行多少个配置文件？

没有硬性限制。每个配置文件只是 `~/.hermes/profiles/` 下的一个目录。实际限制取决于您的磁盘空间以及系统可以处理多少个并发网关（每个网关都是一个轻量级的 Python 进程）。运行几十个配置文件是没问题的；每个空闲配置文件不占用任何资源。

---

## 工作流与模式

### 针对不同任务使用不同模型（多模型工作流）

**场景：** 你日常使用 GPT-5.4，但 Gemini 或 Grok 能生成更好的社交媒体内容。每次手动切换模型很繁琐。

**解决方案：委托配置。** Hermes 可以自动将子智能体路由到不同的模型。在 `~/.hermes/config.yaml` 中设置：

```yaml
delegation:
  model: "google/gemini-3-flash-preview"   # 子智能体使用此模型
  provider: "openrouter"                    # 子智能体的提供商
```

现在，当你告诉 Hermes "为我撰写一个关于 X 的 Twitter 讨论串"，它会生成一个 `delegate_task` 子智能体，该子智能体将在 Gemini 上运行，而非你的主模型。你的主要对话仍保持在 GPT-5.4 上。

你也可以在提示中明确指定：*"委托一个任务来撰写关于我们产品发布的社交媒体帖子。使用你的子智能体来执行实际写作。"* 智能体将使用 `delegate_task`，它会自动获取委托配置。

若要进行一次性的模型切换而不使用委托，可在 CLI 中使用 `/model`：

```bash
/model google/gemini-3-flash-preview    # 为本次会话切换
# ... 撰写你的内容 ...
/model openai/gpt-5.4                   # 切换回来
```

有关委托如何工作的更多信息，请参阅 [子智能体委托](../user-guide/features/delegation.md)。

### 在单个 WhatsApp 号码上运行多个智能体（按聊天绑定）

**场景：** 在 OpenClaw 中，你可以将多个独立的智能体绑定到特定的 WhatsApp 聊天——一个用于家庭购物清单群组，另一个用于你的私人聊天。Hermes 能做到吗？

**当前限制：** Hermes 的每个配置文件都需要其自己的 WhatsApp 号码/会话。你无法将多个配置文件绑定到同一 WhatsApp 号码上的不同聊天——WhatsApp 桥接（Baileys）每个号码使用一个已认证的会话。

**变通方法：**

1.  **使用具有个性切换功能的单一配置文件。** 创建不同的 `AGENTS.md` 上下文文件，或使用 `/personality` 命令按聊天更改行为。智能体会识别它所在的聊天并相应调整。
2.  **针对特定任务使用定时任务。** 对于购物清单跟踪器，可以设置一个监控特定聊天并管理清单的定时任务——无需单独的智能体。
3.  **使用不同的号码。** 如果你需要真正独立的智能体，为每个配置文件配对其自己的 WhatsApp 号码。来自 Google Voice 等服务的虚拟号码适用于此。
4.  **改用 Telegram 或 Discord。** 这些平台更自然地支持按聊天绑定——每个 Telegram 群组或 Discord 频道都有其自己的会话，并且你可以在同一帐户上运行多个机器人令牌（每个配置文件一个）。

更多详情请参阅 [配置文件](../user-guide/profiles.md) 和 [WhatsApp 设置](../user-guide/messaging/whatsapp.md)。

### 控制 Telegram 中显示的内容（隐藏日志和推理）

**场景：** 你在 Telegram 中看到网关执行日志、Hermes 推理过程和工具调用细节，而不仅仅是最终输出。

**解决方案：** `config.yaml` 中的 `display.tool_progress` 设置控制显示多少工具活动：

```yaml
display:
  tool_progress: "off"   # 选项：off, new, all, verbose
```

- **`off`** — 仅显示最终回复。无工具调用、无推理过程、无日志。
- **`new`** — 显示新发生的工具调用（简短单行信息）。
- **`all`** — 显示所有工具活动，包括结果。
- **`verbose`** — 完整细节，包括工具参数和输出。

对于消息传递平台，`off` 或 `new` 通常是所需选项。编辑 `config.yaml` 后，重启网关以使更改生效。

你也可以使用 `/verbose` 命令（如果启用）按会话切换此设置：

```yaml
display:
  tool_progress_command: true   # 在网关中启用 /verbose
```

### 在 Telegram 上管理技能（斜杠命令限制）

**场景：** Telegram 有 100 个斜杠命令的限制，而你的技能已超过此限制。你想禁用在 Telegram 上不需要的技能，但 `hermes skills config` 设置似乎未生效。

**解决方案：** 使用 `hermes skills config` 按平台禁用技能。这将写入 `config.yaml`：

```yaml
skills:
  disabled: []                    # 全局禁用的技能
  platform_disabled:
    telegram: [skill-a, skill-b]  # 仅在 telegram 上禁用
```

更改后，**重启网关** (`hermes gateway restart` 或终止后重新启动)。Telegram 机器人命令菜单将在启动时重建。

:::tip
描述过长的技能在 Telegram 菜单中会被截断为 40 个字符，以保持在有效负载大小限制内。如果技能没有出现，可能是总有效负载大小问题，而非 100 个命令数限制——禁用未使用的技能有助于解决这两个问题。
:::

### 共享线程会话（多用户，单一对话）

**场景：** 你有一个 Telegram 或 Discord 线程，其中多人提及机器人。你希望该线程中的所有提及都成为共享对话的一部分，而不是独立的按用户会话。

**当前行为：** 在大多数平台上，Hermes 创建的会话以用户 ID 为键，因此每个人都有自己的对话上下文。这是出于隐私和上下文隔离的设计。

**变通方法：**

1.  **使用 Slack。** Slack 会话以线程为键，而非用户。同一线程中的多个用户共享一个对话——正是你所描述的行为。这是最自然的契合。
2.  **使用单一用户的群聊。** 如果一个人是指定负责转达问题的"操作员"，则会话保持统一。其他人可以旁观。
3.  **使用 Discord 频道。** Discord 会话以频道为键，因此同一频道中的所有用户共享上下文。为共享对话使用专用频道。

### 将 Hermes 导出到另一台机器

**场景：** 你已在一台机器上构建好技能、定时任务和记忆，并希望将所有内容迁移到一台新的专用 Linux 机器上。

**解决方案：**

1.  在新机器上安装 Hermes Agent：
    ```bash
    curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
    ```

2.  在**源机器**上，创建完整备份：
    ```bash
    hermes backup
    ```
    这会将你整个 `~/.hermes/` 目录——配置、API 密钥、记忆、技能、会话和配置文件——打包为一个 zip 文件，保存到你的主目录下，文件名为 `~/hermes-backup-<时间戳>.zip`。

3.  将 zip 文件复制到新机器并导入：
    ```bash
    # 在源机器上
    scp ~/hermes-backup-<时间戳>.zip newmachine:~/

    # 在新机器上
    hermes import ~/hermes-backup-<时间戳>.zip
    ```

4.  在新机器上，运行 `hermes setup` 以验证 API 密钥和提供商配置是否正常工作。

### 将单个配置文件移动到另一台机器

**场景：** 你想移动或共享一个特定的配置文件——而不是整个安装。

```bash
# 在源机器上
hermes profile export work ./work-backup.tar.gz

# 将文件复制到目标机器，然后：
hermes profile import ./work-backup.tar.gz work
```

导入的配置文件将包含导出时的所有配置、记忆、会话和技能。如果新机器的设置不同，你可能需要更新路径或重新向提供商进行身份验证。

### `hermes backup` 与 `hermes profile export` 对比

| 功能 | `hermes backup` | `hermes profile export` |
| :--- | :--- | :--- |
| **使用场景** | **整机迁移** | **移植/共享特定配置文件** |
| **范围** | 全局（整个 `~/.hermes` 目录） | 本地（单个配置文件目录） |
| **包含内容** | 所有配置文件、全局配置、API 密钥、会话 | 单个配置文件：SOUL.md、记忆、会话、技能 |
| **凭据** | **包含**（`.env` 和 `auth.json`） | **排除**（为安全共享而剥离） |
| **格式** | `.zip` | `.tar.gz` |

**手动备选方案 (rsync)：** 如果你更喜欢直接复制文件，请排除代码仓库：
```bash
rsync -av --exclude='hermes-agent' ~/.hermes/ newmachine:~/.hermes/
```

:::tip
即使在 Hermes 活跃运行时，`hermes backup` 也会生成一致的快照。恢复的存档会排除像 `gateway.pid` 和 `cron.pid` 这样的机器本地运行时文件。
:::

### 安装后重新加载 shell 时权限被拒绝

**场景：** 运行 Hermes 安装程序后，`source ~/.zshrc` 给出权限被拒绝错误。

**原因：** 这通常发生在 `~/.zshrc`（或 `~/.bashrc`）文件权限不正确时，或者安装程序无法干净地写入该文件时。这不是 Hermes 特有的问题——这是 shell 配置的权限问题。

**解决方案：**
```bash
# 检查权限
ls -la ~/.zshrc

# 如有必要修复（应为 -rw-r--r-- 或 644）
chmod 644 ~/.zshrc

# 然后重新加载
source ~/.zshrc

# 或者直接打开新的终端窗口——它会自动获取 PATH 变更
```

如果安装程序添加了 PATH 行但权限错误，你可以手动添加：
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
```

### 首次运行智能体时出现 400 错误

**场景：** 设置顺利完成，但首次聊天尝试因 HTTP 400 错误而失败。

**原因：** 通常是模型名称不匹配——配置的模型在你的提供商上不存在，或者你的 API 密钥无权访问它。

**解决方案：**
```bash
# 检查配置了哪个模型和提供商
hermes config show | head -20

# 重新运行模型选择
hermes model

# 或使用已知良好的模型进行测试
hermes chat -q "hello" --model anthropic/claude-opus-4.7
```

如果使用 OpenRouter，请确保你的 API 密钥有额度。来自 OpenRouter 的 400 错误通常意味着模型需要付费计划，或者模型 ID 有拼写错误。

---
## 仍然卡住了？

如果你的问题在此处未涵盖：

1.  **搜索现有问题：** [GitHub Issues](https://github.com/NousResearch/hermes-agent/issues)
2.  **询问社区：** [Nous Research Discord](https://discord.gg/nousresearch)
3.  **提交错误报告：** 包括你的操作系统、Python 版本 (`python3 --version`)、Hermes 版本 (`hermes --version`) 和完整的错误信息