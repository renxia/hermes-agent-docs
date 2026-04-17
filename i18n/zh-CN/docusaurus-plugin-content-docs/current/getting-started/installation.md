---
sidebar_position: 2
title: "安装"
description: "通过 Termux 在 Linux、macOS、WSL2 或 Android 上安装 Hermes Agent"
---

# 安装

使用单行安装程序在两分钟内让 Hermes Agent 投入使用，或者遵循手动步骤以获得完全控制权。

## 快速安装

### Linux / macOS / WSL2

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

### Android / Termux

Hermes 现在也提供了 Termux 感知的安装路径：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

该安装程序会自动检测 Termux 并切换到经过测试的 Android 流程：
- 使用 Termux 的 `pkg` 安装系统依赖项（`git`、`python`、`nodejs`、`ripgrep`、`ffmpeg`、构建工具）
- 使用 `python -m venv` 创建虚拟环境
- 自动导出 `ANDROID_API_LEVEL` 用于 Android wheel 构建
- 使用 `pip` 安装精选的 `.[termux]` 额外依赖
- 默认跳过未经测试的浏览器/WhatsApp 引导程序

如果需要完全明确的路径，请遵循专用的 [Termux 指南](./termux.md)。

:::warning Windows
原生 Windows **不支持**。请安装 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)，并在其中运行 Hermes Agent。上面的安装命令可以在 WSL2 内部工作。
:::

### 安装程序的作用

安装程序会自动处理所有事情——所有依赖项（Python、Node.js、ripgrep、ffmpeg）、仓库克隆、虚拟环境、全局 `hermes` 命令设置以及 LLM 提供商配置。完成所有步骤后，您就可以开始聊天了。

### 安装后

重新加载您的 shell 并开始聊天：

```bash
source ~/.bashrc   # 或：source ~/.zshrc
hermes             # 开始聊天！
```

要稍后重新配置单个设置，请使用专用命令：

```bash
hermes model          # 选择您的 LLM 提供商和模型
hermes tools          # 配置启用的工具
hermes gateway setup  # 设置消息平台
hermes config set     # 设置单个配置值
hermes setup          # 或运行完整的设置向导一次性配置所有内容
```

---

## 前提条件

唯一的前置条件是 **Git**。安装程序会自动处理所有其他内容：

- **uv**（快速 Python 包管理器）
- **Python 3.11**（通过 uv，无需 sudo）
- **Node.js v22**（用于浏览器自动化和 WhatsApp 桥接）
- **ripgrep**（快速文件搜索）
- **ffmpeg**（用于 TTS 的音频格式转换）

:::info
您**不需要**手动安装 Python、Node.js、ripgrep 或 ffmpeg。安装程序会检测缺失的内容并为您安装。只需确保 `git` 可用（`git --version`）。
:::

:::tip Nix 用户
如果您使用 Nix（在 NixOS、macOS 或 Linux 上），则有一个专用的设置路径，包含 Nix flake、声明式 NixOS 模块和可选的容器模式。请参阅 **[Nix & NixOS 设置](./nix-setup.md)** 指南。
:::

---

## 手动安装

如果您偏好对安装过程拥有完全的控制权，请遵循这些步骤。

### 步骤 1：克隆仓库

使用 `--recurse-submodules` 克隆以拉取所需的子模块：

```bash
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git
cd hermes-agent
```

如果您已经使用没有 `--recurse-submodules` 的方式克隆：
```bash
git submodule update --init --recursive
```

### 步骤 2：安装 uv 并创建虚拟环境

```bash
# 安装 uv（如果尚未安装）
curl -LsSf https://astral.sh/uv/install.sh | sh

# 使用 Python 3.11 创建 venv（uv 会下载，如果不存在——无需 sudo）
uv venv venv --python 3.11
```

:::tip
您不需要激活 venv 就能使用 `hermes`。入口点硬编码了一个指向 venv Python 的 shebang，因此一旦创建了符号链接，它就可以全局工作。
:::

### 步骤 3：安装 Python 依赖项

```bash
# 告诉 uv 要安装到哪个 venv
export VIRTUAL_ENV="$(pwd)/venv"

# 安装所有额外依赖
uv pip install -e ".[all]"
```

如果您只想要核心代理（不包含 Telegram/Discord/cron 支持）：
```bash
uv pip install -e "."
```

<details>
<summary><strong>可选依赖项分解</strong></summary>

| 额外依赖 | 添加的内容 | 安装命令 |
|-------|-------------|-----------------|
| `all` | 以下所有内容 | `uv pip install -e ".[all]"` |
| `messaging` | Telegram、Discord 和 Slack 网关 | `uv pip install -e ".[messaging]"` |
| `cron` | 用于计划任务的 Cron 表达式解析 | `uv pip install -e ".[cron]"` |
| `cli` | 用于设置向导的终端菜单 UI | `uv pip install -e ".[cli]"` |
| `modal` | Modal 云执行后端 | `uv pip install -e ".[modal]"` |
| `tts-premium` | ElevenLabs 高级语音 | `uv pip install -e ".[tts-premium]"` |
| `voice` | 命令行麦克风输入 + 音频播放 | `uv pip install -e ".[voice]"` |
| `pty` | PTY 终端支持 | `uv pip install -e ".[pty]"` |
| `termux` | 经过测试的 Android / Termux 包（`cron`、`cli`、`pty`、`mcp`、`honcho`、`acp`） | `python -m pip install -e ".[termux]" -c constraints-termux.txt` |
| `honcho` | AI 原生内存（Honcho 集成） | `uv pip install -e ".[honcho]"` |
| `mcp` | 模型上下文协议支持 | `uv pip install -e ".[mcp]"` |
| `homeassistant` | Home Assistant 集成 | `uv pip install -e ".[homeassistant]"` |
| `acp` | ACP 编辑器集成支持 | `uv pip install -e ".[acp]"` |
| `slack` | Slack 消息 | `uv pip install -e ".[slack]"` |
| `dev` | pytest 和测试工具 | `uv pip install -e ".[dev]"` |

您可以组合额外依赖：`uv pip install -e ".[messaging,cron]"`

:::tip Termux 用户
由于 `voice` 额外依赖项会拉取 `faster-whisper`，而该依赖项需要为 Android 发布 `ctranslate2` wheel，因此 `.[all]` 目前在 Android 上不可用。请使用 `.[termux]` 作为经过测试的移动安装路径，然后根据需要添加单个额外依赖项。
:::

</details>

### 步骤 4：安装可选子模块（如果需要）

```bash
# RL 训练后端（可选）
uv pip install -e "./tinker-atropos"
```

两者都是可选的——如果您跳过它们，相应的工具集将无法使用。

### 步骤 5：安装 Node.js 依赖项（可选）

仅用于**浏览器自动化**（由 Browserbase 提供）和**WhatsApp 桥接**：

```bash
npm install
```

### 步骤 6：创建配置文件目录

```bash
# 创建目录结构
mkdir -p ~/.hermes/{cron,sessions,logs,memories,skills,pairing,hooks,image_cache,audio_cache,whatsapp/session}

# 复制示例配置文件
cp cli-config.yaml.example ~/.hermes/config.yaml

# 创建空的 .env 文件用于 API 密钥
touch ~/.hermes/.env
```

### 步骤 7：添加您的 API 密钥

打开 `~/.hermes/.env` 并至少添加一个 LLM 提供商密钥：

```bash
# 必需 — 至少一个 LLM 提供商：
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# 可选 — 启用附加工具：
FIRECRAWL_API_KEY=fc-your-key          # 网络搜索和抓取（或自托管，参见文档）
FAL_KEY=your-fal-key                   # 图像生成（FLUX）
```

或者通过 CLI 设置它们：
```bash
hermes config set OPENROUTER_API_KEY sk-or-v1-your-key-here
```

### 步骤 8：将 `hermes` 添加到您的 PATH

```bash
mkdir -p ~/.local/bin
ln -sf "$(pwd)/venv/bin/hermes" ~/.local/bin/hermes
```

如果 `~/.local/bin` 不在您的 PATH 中，请将其添加到您的 shell 配置文件中：

```bash
# Bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc

# Zsh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc

# Fish
fish_add_path $HOME/.local/bin
```

### 步骤 9：配置您的提供商

```bash
hermes model       # 选择您的 LLM 提供商和模型
```

### 步骤 10：验证安装

```bash
hermes version    # 检查命令是否可用
hermes doctor     # 运行诊断以验证所有功能是否正常
hermes status     # 检查您的配置
hermes chat -q "你好！你有哪些工具可用？"
```

---

## 快速参考：手动安装（精简版）

对于只需要命令的用户：

```bash
# 安装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# 克隆并进入目录
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git
cd hermes-agent

# 使用 Python 3.11 创建 venv
uv venv venv --python 3.11
export VIRTUAL_ENV="$(pwd)/venv"

# 安装所有内容
uv pip install -e ".[all]"
uv pip install -e "./tinker-atropos"
npm install  # 可选，用于浏览器工具和 WhatsApp

# 配置
mkdir -p ~/.hermes/{cron,sessions,logs,memories,skills,pairing,hooks,image_cache,audio_cache,whatsapp/session}
cp cli-config.yaml.example ~/.hermes/config.yaml
touch ~/.hermes/.env
echo 'OPENROUTER_API_KEY=sk-or-v1-your-key' >> ~/.hermes/.env

# 使 hermes 全局可用
mkdir -p ~/.local/bin
ln -sf "$(pwd)/venv/bin/hermes" ~/.local/bin/hermes

# 验证
hermes doctor
hermes
```

---

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| `hermes: command not found` | 重新加载您的 shell (`source ~/.bashrc`) 或检查 PATH |
| `API key not set` | 运行 `hermes model` 配置您的提供商，或运行 `hermes config set OPENROUTER_API_KEY your_key` |
| 更新后缺少配置 | 运行 `hermes config check` 然后运行 `hermes config migrate` |

如需更多诊断，请运行 `hermes doctor` — 它将准确告诉您缺少什么以及如何修复它。