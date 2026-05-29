---
sidebar_position: 3
title: "常见问题与故障排除"
description: "关于Hermes智能体的常见问题与解决方案"
---

# 常见问题与故障排除

针对最常见问题和故障的快速解答与修复方法。

---

## 常见问题解答

### 哪些LLM提供商支持Hermes？

Hermes智能体支持任何与OpenAI兼容的API。支持的提供商包括：

- **[OpenRouter](https://openrouter.ai/)** — 通过一个API密钥访问数百个模型（灵活性首选推荐）
- **[Nous Portal](/integrations/nous-portal)** — Nous Research的订阅门户 — 通过一个OAuth登录访问300+模型以及网络/图像/TTS/浏览器（新手推荐）
- **OpenAI** — GPT-5.4、GPT-5-codex、GPT-4.1、GPT-4o 等。
- **Anthropic** — Claude模型（直接API、通过 `hermes auth add anthropic` OAuth登录、OpenRouter或任何兼容代理）
- **Google** — Gemini模型（通过 `gemini` 提供商直接API、`google-gemini-cli` OAuth提供商、OpenRouter或兼容代理）
- **z.ai / ZhipuAI** — GLM模型
- **Kimi / Moonshot AI** — Kimi模型
- **MiniMax** — 全球和中国端点
- **本地模型** — 通过 [Ollama](https://ollama.com/)、[vLLM](https://docs.vllm.ai/)、[llama.cpp](https://github.com/ggerganov/llama.cpp)、[SGLang](https://github.com/sgl-project/sglang) 或任何与OpenAI兼容的服务器

通过 `hermes model` 或编辑 `~/.hermes/.env` 来设置您的提供商。所有提供商密钥请参见[环境变量](./environment-variables.md)参考。

### 它能在Windows上运行吗？

**不能原生支持。** Hermes智能体需要类Unix环境。在Windows上，请安装 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) 并在其中运行Hermes。标准安装命令在WSL2中可以完美运行：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

### 我在WSL2中运行Hermes。控制我正常的Windows Chrome的最佳方式是什么？

推荐使用MCP桥接，而不是 `/browser connect`。

推荐模式：

- 在WSL2内运行Hermes
- 继续使用您在Windows上正常登录的Chrome
- 通过 `cmd.exe` 或 `powershell.exe` 添加 `chrome-devtools-mcp` 作为MCP服务器
- 让Hermes使用生成的MCP浏览器工具

这比尝试强制Hermes核心浏览器传输直接跨WSL2/Windows边界附加更可靠。

参见：

- [在Hermes中使用MCP](../guides/use-mcp-with-hermes.md#wsl2-bridge-hermes-in-wsl-to-windows-chrome)
- [浏览器自动化](../user-guide/features/browser.md#wsl2--windows-chrome-prefer-mcp-over-browser-connect)

### 它能在Android / Termux上运行吗？

可以 — Hermes现在已有针对Android手机测试过的Termux安装路径。

快速安装：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

有关完整明确的手动步骤、支持的额外功能和当前限制，请参见 [Termux指南](../getting-started/termux.md)。

重要提示：完整的 `.[all]` 额外功能目前在Android上不可用，因为 `voice` 额外功能依赖于 `faster-whisper` -> `ctranslate2`，而 `ctranslate2` 未发布Android轮子。请改用经过测试的 `.[termux]` 额外功能。

### 我的数据会被发送到任何地方吗？

API调用**仅发送到您配置的LLM提供商**（例如OpenRouter、您本地的Ollama实例）。Hermes智能体不收集遥测数据、使用数据或分析信息。您的对话、记忆和技能都本地存储在 `~/.hermes/` 中。

### 我可以离线使用它/使用本地模型吗？

可以。运行 `hermes model`，选择 **自定义端点**，并输入您服务器的URL：

```bash
hermes model
# 选择：自定义端点（手动输入URL）
# API基础URL：http://localhost:11434/v1
# API密钥：ollama
# 模型名称：qwen3.5:27b
# 上下文长度：64000   ← Hermes最低要求；请设置此值以匹配您服务器的实际上下文窗口
```

或者在 `config.yaml` 中直接配置：

```yaml
model:
  default: qwen3.5:27b
  provider: custom
  base_url: http://localhost:11434/v1
```

Hermes会将端点、提供商和基础URL持久化保存在 `config.yaml` 中，这样即使重启也会保留。如果您的本地服务器只加载了一个模型，`/model custom` 会自动检测它。您也可以在config.yaml中设置 `provider: custom` — 它是一个一级提供商，不是任何其他东西的别名。

这适用于Ollama、vLLM、llama.cpp服务器、SGLang、LocalAI等。详情请参见[配置指南](../user-guide/configuration.md)。

:::tip Ollama用户
如果您在Ollama中设置了自定义 `num_ctx`（例如 `ollama run --num_ctx 64000`），请确保在Hermes中设置匹配的上下文长度 — Ollama的 `/api/show` 报告的是模型的*最大*上下文，而不是您配置的有效 `num_ctx`。
:::

:::tip 使用本地模型时的超时问题
Hermes会自动检测本地端点并放宽流式超时（读取超时从120秒提高到1800秒，禁用陈旧流检测）。如果在处理非常大的上下文时仍然遇到超时，请在您的 `.env` 中设置 `HERMES_STREAM_READ_TIMEOUT=1800`。详情请参见[本地LLM指南](../guides/local-llm-on-mac.md#timeouts)。
:::

### 它要花多少钱？

Hermes智能体本身是**免费且开源的**（MIT许可证）。您只需为您选择的LLM提供商的API使用付费。本地模型运行完全免费。

### 多个人可以使用一个实例吗？

可以。[消息网关](../user-guide/messaging/index.md)允许多个用户通过Telegram、Discord、Slack、WhatsApp或Home Assistant与同一个Hermes智能体实例交互。访问通过白名单（特定用户ID）和私信配对（第一个发消息的用户获得访问权）来控制。

### 记忆和技能有什么区别？

- **记忆**存储**事实** — 智能体了解的关于您、您的项目和偏好的信息。记忆会根据相关性自动检索。
- **技能**存储**程序** — 如何做某事的分步说明。当智能体遇到类似任务时会回忆起技能。

两者都会跨会话持久保存。详情请参见[记忆](../user-guide/features/memory.md)和[技能](../user-guide/features/skills.md)。

### 我可以在自己的Python项目中使用它吗？

可以。导入 `AIAgent` 类并以编程方式使用Hermes：

```python
from run_agent import AIAgent

agent = AIAgent(model="anthropic/claude-opus-4.7")
response = agent.chat("简要解释量子计算")
```

完整的API用法请参见[Python库指南](../user-guide/features/code-execution.md)。

---

## 故障排除

### 安装问题

#### 安装后出现 `hermes: command not found`

**原因：** 您的 shell 尚未重新加载更新后的 PATH。

**解决方案：**
```bash
# 重新加载你的 shell 配置文件
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
安装程序会将 `~/.local/bin` 添加到你的 PATH。如果你使用非标准的 shell 配置，请手动添加 `export PATH="$HOME/.local/bin:$PATH"`。
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

安装程序会自动处理此问题——如果你在手动安装期间看到此错误，请先升级 Python。

#### 终端命令显示 `node: command not found`（或 `nvm`、`pyenv`、`asdf` 等）

**原因：** Hermes 在启动时通过运行一次 `bash -l` 来构建每个会话的环境快照。bash 登录 shell 会读取 `/etc/profile`、`~/.bash_profile` 和 `~/.profile`，但**不会加载 `~/.bashrc`**——因此，那些将自身安装在那里的工具（`nvm`、`asdf`、`pyenv`、`cargo`、自定义的 `PATH` 导出）对快照保持不可见。这最常见于 Hermes 在 systemd 下或在最小化 shell 中运行时，其中没有任何东西预加载了交互式 shell 配置文件。

**解决方案：** Hermes 默认会自动加载 `~/.bashrc`。如果这还不够——例如，你是一个 PATH 设置在 `~/.zshrc` 中的 zsh 用户，或者你从一个独立文件初始化 `nvm`——请在 `~/.hermes/config.yaml` 中列出需要加载的额外文件：

```yaml
terminal:
  shell_init_files:
    - ~/.zshrc                     # zsh 用户：将 zsh 管理的 PATH 拉入 bash 快照
    - ~/.nvm/nvm.sh                # 直接 nvm 初始化（无论何种 shell 均有效）
    - /etc/profile.d/cargo.sh      # 系统范围的 rc 文件
  # 设置此列表后，默认的 ~/.bashrc 自动加载不会被添加——
  # 如果你希望两者都生效，请显式包含：
  #   - ~/.bashrc
  #   - ~/.zshrc
```

缺失的文件会被静默跳过。加载操作在 bash 中进行，因此依赖仅限 zsh 语法的文件可能会出错——如果担心这点，只加载设置 PATH 的部分（例如 nvm 的 `nvm.sh` 文件），而不是整个 rc 文件。

要禁用自动加载行为（仅限严格的登录 shell 语义）：

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

#### 安装期间权限被拒绝错误

**原因：** 对安装目录的写入权限不足。

**解决方案：**
```bash
# 不要对安装程序使用 sudo——它会安装到 ~/.local/bin
# 如果你之前用 sudo 安装过，请清理：
sudo rm /usr/local/bin/hermes
# 然后重新运行标准安装程序
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

---

### 提供商与模型问题

#### `/model` 只显示一个提供商 / 无法切换提供商

**原因：** `/model`（在聊天会话内）只能在你**已配置**的提供商之间切换。如果你只设置了 OpenRouter，那么 `/model` 将只显示它。

**解决方案：** 退出你的会话，从终端使用 `hermes model` 添加新的提供商：

```bash
# 首先退出 Hermes 聊天会话（Ctrl+C 或 /quit）

# 运行完整的提供商设置向导
hermes model

# 这允许你：添加提供商、运行 OAuth、输入 API 密钥、配置端点
```

通过 `hermes model` 添加新提供商后，启动新的聊天会话——`/model` 现在将显示所有你已配置的提供商。

:::tip 快速参考
| 想要... | 使用 |
|-----------|-----|
| 添加新提供商 | `hermes model`（从终端） |
| 输入/更改 API 密钥 | `hermes model`（从终端） |
| 会话中切换模型 | `/model <name>`（会话内） |
| 切换到其他已配置的提供商 | `/model provider:model`（会话内） |
:::

#### API 密钥不工作

**原因：** 密钥缺失、已过期、设置错误或属于错误的提供商。

**解决方案：**
```bash
# 检查你的配置
hermes config show

# 重新配置你的提供商
hermes model

# 或者直接设置
hermes config set OPENROUTER_API_KEY sk-or-v1-xxxxxxxxxxxx
```

:::warning
确保密钥与提供商匹配。OpenAI 密钥无法用于 OpenRouter，反之亦然。检查 `~/.hermes/.env` 中是否有冲突条目。
:::

#### 模型不可用 / 找不到模型

**原因：** 模型标识符不正确或在你的提供商上不可用。

**解决方案：**
```bash
# 列出你的提供商的可用模型
hermes model

# 设置一个有效的模型
hermes config set HERMES_MODEL anthropic/claude-opus-4.7

# 或者在每个会话中指定
hermes chat --model openrouter/meta-llama/llama-3.1-70b-instruct
```

#### 速率限制（429 错误）

**原因：** 你已超出提供商的速率限制。

**解决方案：** 等待片刻后重试。对于持续使用，请考虑：
- 升级你的提供商套餐
- 切换到不同的模型或提供商
- 使用 `hermes chat --provider <alternative>` 路由到不同的后端

#### 上下文长度超限

**原因：** 对话增长过长，超出了模型的上下文窗口，或者 Hermes 检测到你的模型上下文长度错误。

**解决方案：**
```bash
# 压缩当前会话
/compress

# 或者启动一个新会话
hermes chat

# 使用具有更大上下文窗口的模型
hermes chat --model openrouter/google/gemini-3-flash-preview
```

如果在首次长对话时发生此情况，Hermes 可能检测到了错误的上下文长度。检查它检测到的内容：

查看 CLI 启动行——它显示了检测到的上下文长度（例如，`📊 Context limit: 128000 tokens`）。你也可以在会话期间使用 `/usage` 检查。

要修复上下文检测，请显式设置：

```yaml
# 在 ~/.hermes/config.yaml 中
model:
  default: 你的模型名称
  context_length: 131072  # 你的模型实际的上下文窗口
```

或者对于自定义端点，按模型添加：

```yaml
custom_providers:
  - name: "我的服务器"
    base_url: "http://localhost:11434/v1"
    models:
      qwen3.5:27b:
        context_length: 64000
```

参见 [上下文长度检测](../integrations/providers.md#context-length-detection) 了解自动检测的工作原理和所有覆盖选项。

---

### 终端问题

#### 命令因危险被阻止

**原因：** Hermes 检测到潜在的破坏性命令（例如，`rm -rf`、`DROP TABLE`）。这是一个安全特性。

**解决方案：** 提示出现时，检查命令并输入 `y` 以批准它。你也可以：
- 要求智能体使用更安全的替代方案
- 在 [安全文档](../user-guide/security.md) 中查看危险模式的完整列表

:::tip
这是预期行为——Hermes 不会静默运行破坏性命令。批准提示会向你准确显示将要执行的内容。
:::

#### 通过消息网关无法使用 `sudo`

**原因：** 消息网关在没有交互式终端的情况下运行，因此 `sudo` 无法提示输入密码。

**解决方案：**
- 在消息中避免使用 `sudo`——要求智能体寻找替代方案
- 如果必须使用 `sudo`，请在 `/etc/sudoers` 中为特定命令配置无密码 sudo
- 或者切换到终端接口进行管理任务：`hermes chat`

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

### 消息传递问题

#### 机器人未响应消息

**原因：** 机器人未运行、未授权，或你的用户不在允许列表中。

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
- 使用 `hermes gateway setup` 验证你的机器人令牌是否有效
- 检查网关日志：`cat ~/.hermes/logs/gateway.log | tail -50`
- 对于基于 webhook 的平台（Slack、WhatsApp），确保你的服务器可公开访问

#### 允许列表混淆——谁可以和机器人对话？

**原因：** 授权模式决定谁有权访问。

**解决方案：**

| 模式 | 工作原理 |
|------|-------------|
| **允许列表** | 只有配置中列出的用户 ID 可以交互 |
| **DM 配对** | 在私信中发消息的第一个用户获得独占访问权 |
| **开放** | 任何人都可以交互（不推荐用于生产） |

在 `~/.hermes/config.yaml` 中你的网关设置下进行配置。参见 [消息传递文档](../user-guide/messaging/index.md)。

#### 网关无法启动

**原因：** 依赖项缺失、端口冲突或令牌配置错误。

**解决方案：**
```bash
# 安装核心消息网关依赖项
pip install "hermes-agent[messaging]"  # Telegram、Discord、Slack 和共享网关依赖

# 检查端口冲突
lsof -i :8080

# 验证配置
hermes config show
```

#### WSL：网关持续断开连接或 `hermes gateway start` 失败

**原因：** WSL 的 systemd 支持不可靠。许多 WSL2 安装没有启用 systemd，即使启用，服务也可能无法在 WSL 重启或 Windows 空闲关机后存活。

**解决方案：** 使用前台模式代替 systemd 服务：

```bash
# 选项 1：直接前台运行（最简单）
hermes gateway run

# 选项 2：通过 tmux 持久化（终端关闭后仍存活）
tmux new -s hermes 'hermes gateway run'
# 稍后重新连接：tmux attach -t hermes

# 选项 3：通过 nohup 后台运行
nohup hermes gateway run > ~/.hermes/logs/gateway.log 2>&1 &
```

如果你仍想尝试 systemd，请确保它已启用：

1. 打开 `/etc/wsl.conf`（如果不存在则创建）
2. 添加：
   ```ini
   [boot]
   systemd=true
   ```
3. 从 PowerShell 运行：`wsl --shutdown`
4. 重新打开你的 WSL 终端
5. 验证：`systemctl is-system-running` 应显示 "running" 或 "degraded"

:::tip Windows 启动时自动启动
要实现可靠的自动启动，请使用 Windows 任务计划程序在登录时启动 WSL + 网关：
1. 创建一个运行 `wsl -d Ubuntu -- bash -lc 'hermes gateway run'` 的任务
2. 将其设置为在用户登录时触发
:::

#### macOS：网关找不到 Node.js / ffmpeg / 其他工具

**原因：** launchd 服务继承一个最小的 PATH（`/usr/bin:/bin:/usr/sbin:/sbin`），其中不包括 Homebrew、nvm、cargo 或其他用户安装的工具目录。这通常会导致 WhatsApp 桥接器（`node not found`）或语音转录（`ffmpeg not found`）出现问题。

**解决方案：** 网关在你运行 `hermes gateway install` 时会捕获你的 shell PATH。如果你在设置网关后安装了工具，请重新运行安装以捕获更新的 PATH：

```bash
hermes gateway install    # 重新快照你当前的 PATH
hermes gateway start      # 检测到更新的 plist 并重新加载
```

你可以验证 plist 是否有正确的 PATH：
```bash
/usr/libexec/PlistBuddy -c "Print :EnvironmentVariables:PATH" \
  ~/Library/LaunchAgents/ai.hermes.gateway.plist
```

---

### 性能问题

#### 响应缓慢

**原因：** 模型大、API 服务器远或系统提示词包含大量工具。

**解决方案：**
- 尝试更快/更小的模型：`hermes chat --model openrouter/meta-llama/llama-3.1-8b-instruct`
- 减少活动工具集：`hermes chat -t "terminal"`
- 检查你到提供商的网络延迟
- 对于本地模型，确保有足够的 GPU VRAM

#### Token 使用量高

**原因：** 长对话、冗长的系统提示或许多工具调用累积上下文。

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

**原因：** 长时间的对话积累了消息和工具输出，接近上下文限制。

**解决方案：**
```bash
# 压缩当前会话（保留关键上下文）
/compress

# 启动一个新会话，并参考旧会话
hermes chat

# 如果需要，稍后恢复特定会话
hermes chat --continue
```

---

### MCP 问题

#### MCP 服务器无法连接

**原因：** 服务器二进制文件未找到、命令路径错误或运行时缺失。

**解决方案：**
```bash
# 确保 MCP 依赖已安装（标准安装中已包含）
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

**原因：** 服务器已启动但工具发现失败，工具被配置过滤掉，或服务器不支持你期望的 MCP 能力。

**解决方案：**
- 检查网关/智能体日志中的 MCP 连接错误
- 确保服务器响应 `tools/list` RPC 方法
- 检查该服务器下的任何 `tools.include`、`tools.exclude`、`tools.resources`、`tools.prompts` 或 `enabled` 设置
- 请记住，资源/提示工具仅在会话实际支持这些能力时才注册
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

**原因：** MCP 服务器响应时间过长，或在执行过程中崩溃。

**解决方案：**
- 如果支持，在你的 MCP 服务器配置中增加超时时间
- 检查 MCP 服务器进程是否仍在运行
- 对于远程 HTTP MCP 服务器，检查网络连接

:::warning
如果 MCP 服务器在请求过程中崩溃，Hermes 将报告超时。检查服务器自身的日志（不仅仅是 Hermes 日志）以诊断根本原因。
:::

---

### 配置文件

### 配置文件与直接设置 HERMES_HOME 有何不同？

配置文件是在 `HERMES_HOME` 之上构建的管理层。您*可以*在每次命令执行前手动设置 `HERMES_HOME=/some/path`，但配置文件会为您处理所有繁琐工作：创建目录结构、生成 Shell 别名（`hermes-work`）、在 `~/.hermes/active_profile` 中跟踪活动配置文件，并自动在所有配置文件间同步技能更新。它们还与制表符补全功能集成，这样您就无需记忆路径了。

### 两个配置文件可以共享同一个机器人令牌吗？

不能。每个消息平台（Telegram、Discord 等）都要求独占访问一个机器人令牌。如果两个配置文件同时尝试使用同一个令牌，第二个网关将无法连接。请为每个配置文件创建单独的机器人——对于 Telegram，请联系 [@BotFather](https://t.me/BotFather) 来创建额外的机器人。

### 配置文件共享内存或会话吗？

不共享。每个配置文件都有自己独立的内存存储、会话数据库和技能目录。它们是完全隔离的。如果您希望基于现有记忆和会话启动新配置文件，请使用 `hermes profile create newname --clone-all` 来复制当前配置文件的所有内容。

### 运行 `hermes update` 会发生什么？

`hermes update` 会拉取最新代码并**一次性**（而非每个配置文件一次）重新安装依赖项。然后，它会自动将更新后的技能同步到所有配置文件。您只需运行一次 `hermes update`——它会覆盖机器上的所有配置文件。


### 我可以运行多少个配置文件？

没有硬性限制。每个配置文件只是 `~/.hermes/profiles/` 下的一个目录。实际限制取决于您的磁盘空间以及系统能够处理多少个并发网关（每个网关是一个轻量级的 Python 进程）。运行数十个配置文件没有问题；每个空闲的配置文件不消耗任何资源。

# 工作流与模式

### 使用不同模型处理不同任务（多模型工作流）

**场景：** 你日常使用 GPT-5.4，但 Gemini 或 Grok 写的社交媒体内容更佳。每次手动切换模型很繁琐。

**解决方案：委托配置。** Hermes 可以自动将子智能体路由到不同的模型。在 `~/.hermes/config.yaml` 中设置：

```yaml
delegation:
  model: "google/gemini-3-flash-preview"   # 子智能体使用此模型
  provider: "openrouter"                   # 子智能体的提供商
```

现在，当你告诉 Hermes "帮我写一个关于X的推特主题串"，它会生成一个 `delegate_task` 子智能体，该子智能体会在 Gemini 上运行，而非你的主模型。你与主模型的对话保持在 GPT-5.4 上。

你也可以在提示中明确指定：*"委派一个任务，撰写关于我们产品发布的社交媒体帖子。使用你的子智能体来实际撰写。"* 智能体将使用 `delegate_task`，它会自动采用委托配置。

若无需委托，仅临时切换模型，可在命令行界面中使用 `/model` 命令：

```bash
/model google/gemini-3-flash-preview    # 为本次会话切换模型
# ... 撰写你的内容 ...
/model openai/gpt-5.4                   # 切换回来
```

有关委托如何工作的更多详情，请参阅 [子智能体委托](../user-guide/features/delegation.md)。

### 在一个 WhatsApp 号码上运行多个智能体（按聊天绑定）

**场景：** 在 OpenClaw 中，你可以将多个独立智能体绑定到特定的 WhatsApp 聊天——一个用于家庭购物清单群组，另一个用于你的私人聊天。Hermes 能做到吗？

**当前限制：** Hermes 的配置文件各自需要其独立的 WhatsApp 号码/会话。你无法将多个配置文件绑定到同一 WhatsApp 号码的不同聊天上——WhatsApp 桥接器（Baileys）每个号码只支持一个已认证会话。

**变通方法：**

1.  **使用带人格切换的单一配置文件。** 创建不同的 `AGENTS.md` 上下文文件，或使用 `/personality` 命令来按需更改行为。智能体会识别当前聊天并适应。

2.  **使用定时任务处理专门任务。** 对于购物清单追踪器，可以设置一个定时任务来监控特定聊天并管理清单——无需单独智能体。

3.  **使用独立号码。** 如果你确实需要独立的智能体，请为每个配置文件配对其专属的 WhatsApp 号码。来自 Google Voice 等服务的虚拟号码可用于此目的。

4.  **改用 Telegram 或 Discord。** 这些平台更自然地支持按聊天绑定——每个 Telegram 群组或 Discord 频道都有自己的会话，并且你可以在同一账户上运行多个机器人令牌（每个配置文件一个）。

更多详情，请参阅 [配置文件](../user-guide/profiles.md) 和 [WhatsApp 设置](../user-guide/messaging/whatsapp.md)。

### 控制 Telegram 中显示的内容（隐藏日志和推理）

**场景：** 你在 Telegram 中看到网关执行日志、Hermes 推理过程和工具调用细节，而不仅仅是最终输出。

**解决方案：** `config.yaml` 中的 `display.tool_progress` 设置控制了显示多少工具活动：

```yaml
display:
  tool_progress: "off"   # 选项：off, new, all, verbose
```

- **`off`** — 仅显示最终响应。无工具调用、无推理、无日志。
- **`new`** — 显示新发生的工具调用（简短单行信息）。
- **`all`** — 显示所有工具活动，包括结果。
- **`verbose`** — 完整细节，包括工具参数和输出。

对于消息平台，通常 `off` 或 `new` 是你需要的。编辑 `config.yaml` 后，重启网关以使更改生效。

你也可以使用 `/verbose` 命令按会话切换此设置（如果已启用）：

```yaml
display:
  tool_progress_command: true   # 在网关中启用 /verbose 命令
```

### 管理 Telegram 上的技能（斜杠命令数量限制）

**场景：** Telegram 斜杠命令有 100 个的限制，而你的技能数量已超出。你想在 Telegram 上禁用不需要的技能，但 `hermes skills config` 的设置似乎未生效。

**解决方案：** 使用 `hermes skills config` 按平台禁用技能。这会写入 `config.yaml`：

```yaml
skills:
  disabled: []                    # 全局禁用的技能
  platform_disabled:
    telegram: [skill-a, skill-b]  # 仅在 Telegram 上禁用
```

更改此设置后，**重启网关**（`hermes gateway restart` 或杀死并重新启动）。Telegram 机器人命令菜单会在启动时重新构建。

:::tip
在 Telegram 菜单中，描述过长的技能会被截断至 40 个字符，以保持在有效负载大小限制内。如果技能未出现，可能是总有效负载大小问题，而非 100 个命令数量限制——禁用未使用的技能对两者都有帮助。
:::

### 共享线程会话（多用户，一个对话）

**场景：** 你有一个 Telegram 或 Discord 线程，多人在其中提及机器人。你希望该线程中所有提及都属于一个共享对话，而不是各自独立的用户会话。

**当前行为：** Hermes 在大多数平台上按用户 ID 创建会话，因此每个人都有自己的对话上下文。这是为了隐私和上下文隔离而设计的。

**变通方法：**

1.  **使用 Slack。** Slack 会话按线程而非用户键控。同一线程中的多个用户共享一个对话——这正是你所描述的行为。这是最自然的匹配。

2.  **使用单人用户群聊。** 如果一个人是指定的“操作员”负责转发问题，那么会话保持统一。其他人可以旁观。

3.  **使用 Discord 频道。** Discord 会话按频道键控，因此同一频道中的所有用户共享上下文。为共享对话使用专用频道。

### 将 Hermes 导出到另一台机器

**场景：** 你在一台机器上构建了技能、定时任务和记忆，并希望将所有内容迁移到一个新的专用 Linux 机器上。

**解决方案：**

1.  在新机器上安装 Hermes 智能体：
    ```bash
    curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
    ```

2.  在**源机器**上，创建完整备份：
    ```bash
    hermes backup
    ```
    这会创建你整个 `~/.hermes/` 目录的压缩包——包括配置、API 密钥、记忆、技能、会话和配置文件——保存到你的主目录，文件名为 `~/hermes-backup-<timestamp>.zip`。

3.  将压缩包复制到新机器并导入：
    ```bash
    # 在源机器上
    scp ~/hermes-backup-<timestamp>.zip newmachine:~/

    # 在新机器上
    hermes import ~/hermes-backup-<timestamp>.zip
    ```

4.  在新机器上，运行 `hermes setup` 以验证 API 密钥和提供商配置是否正常工作。

### 将单个配置文件移动到另一台机器

**场景：** 你想移动或共享一个特定的配置文件，而不是整个安装。

```bash
# 在源机器上
hermes profile export work ./work-backup.tar.gz

# 将文件复制到目标机器，然后：
hermes profile import ./work-backup.tar.gz work
```

导入的配置文件将包含导出时的所有配置、记忆、会话和技能。如果新机器的设置不同，你可能需要更新路径或重新向提供商进行身份验证。

### `hermes backup` 与 `hermes profile export` 的区别

| 功能 | `hermes backup` | `hermes profile export` |
| :--- | :--- | :--- |
| **用例** | **整机迁移** | **移植/共享特定配置文件** |
| **范围** | 全局（整个 `~/.hermes` 目录） | 局部（单个配置文件目录） |
| **包含内容** | 所有配置文件、全局配置、API 密钥、会话 | 单个配置文件：SOUL.md、记忆、会话、技能 |
| **凭据** | **包含**（`.env` 和 `auth.json`） | **排除**（为安全共享而剥离） |
| **格式** | `.zip` | `.tar.gz` |

**手动后备方案（rsync）：** 如果你更倾向于直接复制文件，请排除代码仓库：
```bash
rsync -av --exclude='hermes-agent' ~/.hermes/ newmachine:~/.hermes/
```

:::tip
即使在 Hermes 积极运行时，`hermes backup` 也能生成一致的快照。恢复的归档排除了机器本地的运行时文件，如 `gateway.pid` 和 `cron.pid`。
:::

### 安装后重载 shell 时出现权限被拒绝

**场景：** 运行 Hermes 安装程序后，执行 `source ~/.zshrc` 出现权限被拒绝错误。

**原因：** 通常发生在 `~/.zshrc`（或 `~/.bashrc`）文件权限不正确，或安装程序无法干净地写入时。这不是 Hermes 特有的问题——这是 shell 配置权限问题。

**解决方案：**
```bash
# 检查权限
ls -la ~/.zshrc

# 如需要则修复（应为 -rw-r--r-- 或 644）
chmod 644 ~/.zshrc

# 然后重载
source ~/.zshrc

# 或者直接打开新的终端窗口——它会自动获取 PATH 更改
```

如果安装程序添加了 PATH 行但权限不对，你可以手动添加：
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
```

### 首次运行智能体时出现 400 错误

**场景：** 设置顺利完成，但首次聊天尝试以 HTTP 400 失败。

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

如果使用 OpenRouter，请确保你的 API 密钥有余额。来自 OpenRouter 的 400 错误通常意味着模型需要付费计划，或者模型 ID 有拼写错误。

---
## 仍然卡住？

如果你的问题未在此处涵盖：

1.  **搜索现有问题：** [GitHub 问题](https://github.com/NousResearch/hermes-agent/issues)
2.  **询问社区：** [Nous Research Discord](https://discord.gg/nousresearch)
3.  **提交错误报告：** 包括你的操作系统、Python 版本（`python3 --version`）、Hermes 版本（`hermes --version`）和完整的错误消息