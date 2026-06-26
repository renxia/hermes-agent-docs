---
sidebar_position: 3
title: "Android / Termux"
description: "Run Hermes Agent directly on an Android phone with Termux"
---

# 在 Android 上通过 Termux 运行 Hermes

这是经过测试的、通过 [Termux](https://termux.dev/) 在 Android 手机上直接运行 Hermes Agent 的路径。

它为你提供了一个在手机上可用的本地 CLI，以及目前已确认能在 Android 上顺利安装的核心附加功能。

## 经过测试的路径支持哪些功能？

经过测试的 Termux 安装包会安装以下内容：
- Hermes CLI
- cron 支持
- PTY/后台终端支持
- Telegram 网关支持（手动 / 尽力而为的后台运行）
- MCP 支持
- Honcho 记忆支持
- ACP 支持

具体对应的安装命令为：

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

## 哪些功能尚未纳入经过测试的路径？

部分功能仍需要桌面/服务器风格的依赖，这些依赖尚未发布 Android 版本，或尚未在手机上验证：

- `.[all]` 目前不支持 Android
- `voice` 扩展被 `faster-whisper -> ctranslate2` 阻塞，且 `ctranslate2` 不提供 Android 版本的 wheel 包
- 自动浏览器 / Playwright 引导程序在 Termux 安装器中被跳过
- Termux 内部不可用基于 Docker 的终端隔离
- Android 可能会挂起 Termux 的后台任务，因此网关持久性为尽力而为模式，而非正常的托管服务

这并不妨碍 Hermes 作为手机原生的 CLI 智能体良好运行——只是意味着推荐的移动版安装范围有意地比桌面/服务器版更窄。

---

## 方案 1：一行命令安装器

Hermes 现在提供了感知 Termux 的安装器路径：

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

在 Termux 上，安装器会自动：
- 使用 `pkg` 安装系统包
- 使用 `python -m venv` 创建虚拟环境
- 首先尝试安装范围较广的 `.[termux-all]` 扩展，若失败则回退到较小的 `.[termux]` 扩展（再回退到基础安装）——curl 安装器会自动匹配此顺序
- 将 `hermes` 链接到 `$PREFIX/bin`，使其保留在你的 Termux PATH 中
- 跳过未经测试的浏览器 / WhatsApp 引导程序

如果你需要显式命令或需要调试失败的安装，请使用下方的手动路径。

---

## 方案 2：手动安装（完全显式）

### 1. 更新 Termux 并安装系统包

```bash
pkg update
pkg install -y git python clang rust make pkg-config libffi openssl nodejs ripgrep ffmpeg
```

为什么需要这些包？
- `python` — 运行时 + 虚拟环境支持
- `git` — 克隆/更新仓库
- `clang`、`rust`、`make`、`pkg-config`、`libffi`、`openssl` — 在 Android 上构建部分 Python 依赖所需
- `nodejs` — 可选的 Node 运行时，用于经过测试的核心路径之外的实验
- `ripgrep` — 快速文件搜索
- `ffmpeg` — 媒体 / TTS 转换

### 2. 克隆 Hermes

```bash
git clone https://github.com/NousResearch/hermes-agent.git
cd hermes-agent
```

### 3. 创建虚拟环境

```bash
python -m venv venv
source venv/bin/activate
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
python -m pip install --upgrade pip setuptools wheel
```

`ANDROID_API_LEVEL` 对于 Rust / maturin 相关的包（如 `jiter`）非常重要。

### 4. 安装经过测试的 Termux 安装包

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

如果你只需要最精简的核心智能体，也可以使用：

```bash
python -m pip install -e '.' -c constraints-termux.txt
```

### 5. 将 `hermes` 放入你的 Termux PATH

```bash
ln -sf "$PWD/venv/bin/hermes" "$PREFIX/bin/hermes"
```

`$PREFIX/bin` 在 Termux 中已在 PATH 中，因此这使得 `hermes` 命令在新 shell 中持续可用，无需每次重新激活虚拟环境。

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

### 手动安装可选的 Node 依赖

经过测试的 Termux 路径有意跳过了 Node/浏览器引导程序。如果你以后想尝试浏览器工具：

```bash
pkg install nodejs-lts
npm install
```

浏览器工具会自动将 Termux 目录（`/data/data/com.termux/files/usr/bin`）纳入其 PATH 搜索范围，因此 `agent-browser` 和 `npx` 无需额外配置 PATH 即可被发现。

在另有文档说明之前，将 Android 上的浏览器 / WhatsApp 工具视为实验性功能。

---

## 故障排除

### 安装 `.[all]` 时出现 `No solution found`

请改用经过测试的 Termux 安装包：

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

目前的阻塞项是 `voice` 扩展：
- `voice` 引入 `faster-whisper`
- `faster-whisper` 依赖 `ctranslate2`
- `ctranslate2` 不提供 Android 版本的 wheel 包

### `uv pip install` 在 Android 上失败

请改用标准库 venv + `pip` 的 Termux 路径：

```bash
python -m venv venv
source venv/bin/activate
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
python -m pip install --upgrade pip setuptools wheel
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

### `jiter` / `maturin` 提示 `ANDROID_API_LEVEL` 相关错误

在安装之前显式设置 API 级别：

```bash
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

### `hermes doctor` 提示缺少 ripgrep 或 Node

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

- Docker 后端不可用
- 经过测试的路径中不可用 `faster-whisper` 进行本地语音转录
- 安装器有意跳过了浏览器自动化设置
- 部分可选扩展可能可用，但目前仅 `.[termux]` 和 `.[termux-all]` 被记录为经过测试的 Android 安装包

如果你遇到了新的 Android 特定问题，请在 GitHub 上提交 issue，并附上：
- 你的 Android 版本
- `termux-info` 的输出
- `python --version` 的输出
- `hermes doctor` 的输出
- 确切的安装命令和完整的错误输出