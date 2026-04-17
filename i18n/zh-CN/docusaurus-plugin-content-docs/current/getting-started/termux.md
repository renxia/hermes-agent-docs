---
sidebar_position: 3
title: "Android / Termux"
description: "在 Android 手机上使用 Termux 直接运行 Hermes Agent"
---

# Android 上的 Termux 与 Hermes

这是通过 [Termux](https://termux.dev/) 在 Android 手机上直接运行 Hermes Agent 的测试路径。

它为您提供了一个在手机上可用的本地 CLI，以及目前已知可以在 Android 上干净安装的核心附加组件。

## 测试路径支持哪些功能？

测试的 Termux 包安装了以下组件：
- Hermes CLI
- cron 支持
- PTY/后台终端支持
- Telegram 网关支持（手动/尽力后台运行）
- MCP 支持
- Honcho 内存支持
- ACP 支持

具体来说，它映射到：

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

## 测试路径尚未包含哪些功能？

一些功能仍然需要桌面/服务器风格的依赖项，这些依赖项尚未为 Android 发布，或者尚未在手机上验证：

- 今天不支持 `.[all]`
- `voice` 附加组件被 `faster-whisper -> ctranslate2` 阻止，而 `ctranslate2` 没有发布 Android wheel
- Termux 安装程序跳过了自动浏览器/Playwright 引导
- 基于 Docker 的终端隔离在 Termux 内部不可用
- Android 仍可能挂起 Termux 后台任务，因此网关持久性是尽力而为，而非正常的管理服务

但这并不妨碍 Hermes 作为手机原生的 CLI 代理良好运行——它只是意味着推荐的移动安装比桌面/服务器安装更有目的性地限制了范围。

---

## 选项 1：单行安装程序

Hermes 现在提供了一个感知 Termux 的安装路径：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

在 Termux 上，安装程序会自动：
- 使用 `pkg` 安装系统包
- 使用 `python -m venv` 创建 venv
- 使用 `pip` 安装 `.[termux]`
- 将 `hermes` 链接到 `$PREFIX/bin`，使其保留在您的 Termux PATH 中
- 跳过未经测试的浏览器/WhatsApp 引导

如果您需要明确的命令或需要调试安装失败的问题，请使用下面的手动路径。

---

## 选项 2：手动安装（完全显式）

### 1. 更新 Termux 并安装系统包

```bash
pkg update
pkg install -y git python clang rust make pkg-config libffi openssl nodejs ripgrep ffmpeg
```

为什么需要这些包？
- `python` — 运行时 + venv 支持
- `git` — 克隆/更新仓库
- `clang`, `rust`, `make`, `pkg-config`, `libffi`, `openssl` — 用于在 Android 上构建一些 Python 依赖项的必需品
- `nodejs` — 可选的 Node 运行时，用于超出测试核心路径的实验
- `ripgrep` — 快速文件搜索
- `ffmpeg` — 媒体/TTS 转换

### 2. 克隆 Hermes

```bash
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git
cd hermes-agent
```

如果您已经克隆但没有子模块：

```bash
git submodule update --init --recursive
```

### 3. 创建虚拟环境

```bash
python -m venv venv
source venv/bin/activate
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
python -m pip install --upgrade pip setuptools wheel
```

`ANDROID_API_LEVEL` 对于像 `jiter` 这样的基于 Rust/maturin 的包非常重要。

### 4. 安装测试的 Termux 包

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

如果您只需要最小核心代理，也可以使用此命令：

```bash
python -m pip install -e '.' -c constraints-termux.txt
```

### 5. 将 `hermes` 放入 Termux PATH

```bash
ln -sf "$PWD/venv/bin/hermes" "$PREFIX/bin/hermes"
```

Termux 中 `$PREFIX/bin` 已经在 PATH 中，因此这使得 `hermes` 命令在每次不重新激活 venv 时都能持续存在。

### 6. 验证安装

```bash
hermes version
hermes doctor
```

### 7. 启动 Hermes

```bash
hermes
```

---

## 推荐的后续设置

### 配置模型

```bash
hermes model
```

或者直接在 `~/.hermes/.env` 中设置密钥。

### 稍后重新运行完整的交互式设置向导

```bash
hermes setup
```

### 手动安装可选的 Node 依赖项

测试的 Termux 路径故意跳过了 Node/浏览器引导。如果您稍后想尝试浏览器工具，可以执行以下操作：

```bash
pkg install nodejs-lts
npm install
```

浏览器工具会自动将 Termux 目录（`/data/data/com.termux/files/usr/bin`）包含在其 PATH 搜索中，因此无需任何额外的 PATH 配置即可发现 `agent-browser` 和 `npx`。

请将 Android 上的浏览器/WhatsApp 工具视为实验性功能，直到有其他说明为止。

---

## 故障排除

### 安装 `.[all]` 时出现 `No solution found`

请使用测试的 Termux 包：

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

当前的阻碍是 `voice` 附加组件：
- `voice` 依赖 `faster-whisper`
- `faster-whisper` 依赖 `ctranslate2`
- `ctranslate2` 没有发布 Android wheel

### Android 上 `uv pip install` 失败

请改用带有 stdlib venv + `pip` 的 Termux 路径：

```bash
python -m venv venv
source venv/bin/activate
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
python -m pip install --upgrade pip setuptools wheel
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

### `jiter` / `maturin` 抱怨 `ANDROID_API_LEVEL`

在安装之前明确设置 API 级别：

```bash
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

### `hermes doctor` 显示缺少 ripgrep 或 Node

使用 Termux 包安装它们：

```bash
pkg install ripgrep nodejs
```

### 安装 Python 包时构建失败

请确保已安装构建工具链：

```bash
pkg install clang rust make pkg-config libffi openssl
```

然后重试：

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

---

## 手机上的已知限制

- 不支持 Docker 后端
- 测试路径中不可用本地语音转录（通过 `faster-whisper`）
- 安装程序故意跳过浏览器自动化设置
- 某些可选附加组件可能可用，但目前只有 `.[termux]` 被记录为测试的 Android 包

如果您遇到新的 Android 特定的问题，请在 GitHub 上提交一个 Issue，并提供以下信息：
- 您的 Android 版本
- `termux-info`
- `python --version`
- `hermes doctor`
- 确切的安装命令和完整的错误输出