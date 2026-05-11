---
sidebar_position: 3
title: "Android / Termux"
description: "通过Termux直接在Android手机上运行Hermes智能体"
---

# 在Android上通过Termux运行Hermes

这是通过 [Termux](https://termux.dev/) 直接在Android手机上运行Hermes智能体的已验证路径。

它为您提供一个可在手机上运行的本地命令行界面，以及目前已知在Android上能顺利安装的核心额外功能。

## 经验证路径支持哪些功能？

经过测试的Termux捆绑包会安装：
- Hermes命令行界面
- cron定时任务支持
- PTY/后台终端支持
- Telegram网关支持（手动/尽力而为的后台运行）
- MCP支持
- Honcho记忆支持
- ACP支持

具体来说，它对应于：

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

## 哪些功能尚未包含在经验证路径中？

部分功能仍然需要尚未为Android发布、或尚未在手机上验证过的桌面/服务器风格依赖项：

- `.[all]` 在Android上目前不支持
- `voice` 额外依赖项因 `faster-whisper -> ctranslate2` 而受阻，且 `ctranslate2` 未发布Android轮子
- Termux安装程序中跳过了自动浏览器/Playwright引导
- Termux内部不支持基于Docker的终端隔离
- Android仍可能挂起Termux后台任务，因此网关持久性是尽力而为的，而非正常托管服务

这并不妨碍Hermes作为一个手机原生命令行智能体良好运行——只是意味着推荐的移动端安装范围有意比桌面/服务器安装更窄。

---

## 选项1：一键安装程序

Hermes现在提供了一个感知Termux的安装路径：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

在Termux上，安装程序会自动：
- 使用 `pkg` 安装系统软件包
- 使用 `python -m venv` 创建虚拟环境
- 先尝试宽泛的 `.[termux-all]` 额外依赖项，若失败则回退到更小的 `.[termux]` 额外依赖项（然后是基础安装）——curl安装程序自动匹配此顺序
- 将 `hermes` 链接到 `$PREFIX/bin`，使其保留在您的Termux PATH中
- 跳过未经测试的浏览器/WhatsApp引导

如果您需要明确的命令或需要调试失败的安装，请使用下面的手动路径。

---

## 选项2：手动安装（完全明确）

### 1. 更新Termux并安装系统软件包

```bash
pkg update
pkg install -y git python clang rust make pkg-config libffi openssl nodejs ripgrep ffmpeg
```

为什么需要这些软件包？
- `python` —— 运行时 + 虚拟环境支持
- `git` —— 克隆/更新仓库
- `clang`、`rust`、`make`、`pkg-config`、`libffi`、`openssl` —— 在Android上构建部分Python依赖项所需
- `nodejs` —— 可选的Node运行时，用于经验证核心路径之外的实验
- `ripgrep` —— 快速文件搜索
- `ffmpeg` —— 媒体/文字转语音转换

### 2. 克隆Hermes

```bash
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git
cd hermes-agent
```

如果您之前克隆时未包含子模块：

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

`ANDROID_API_LEVEL` 对于基于Rust/maturin的软件包（如 `jiter`）很重要。

### 4. 安装经过测试的Termux捆绑包

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

如果您只需要最小核心智能体，以下命令同样有效：

```bash
python -m pip install -e '.' -c constraints-termux.txt
```

### 5. 将 `hermes` 添加到您的Termux PATH

```bash
ln -sf "$PWD/venv/bin/hermes" "$PREFIX/bin/hermes"
```

`$PREFIX/bin` 已经在Termux的PATH中，因此这使得 `hermes` 命令在新终端中持续可用，无需每次重新激活虚拟环境。

### 6. 验证安装

```bash
hermes version
hermes doctor
```

### 7. 启动Hermes

```bash
hermes
```

---

## 推荐的后续设置

### 配置模型

```bash
hermes model
```

或在 `~/.hermes/.env` 中直接设置密钥。

### 稍后重新运行完整的交互式设置向导

```bash
hermes setup
```

### 手动安装可选的Node依赖项

经过测试的Termux路径有意跳过了Node/浏览器引导。如果您之后想尝试浏览器工具：

```bash
pkg install nodejs-lts
npm install
```

浏览器工具会自动在其PATH搜索中包含Termux目录（`/data/data/com.termux/files/usr/bin`），因此 `agent-browser` 和 `npx` 无需额外PATH配置即可被发现。

在Android上的浏览器/WhatsApp工具在文档中另有说明之前，请视为实验性功能。

---

## 故障排除

### 安装 `.[all]` 时出现 `No solution found`

请改用经过测试的Termux捆绑包：

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

目前的阻碍是 `voice` 额外依赖项：
- `voice` 拉取 `faster-whisper`
- `faster-whisper` 依赖于 `ctranslate2`
- `ctranslate2` 未发布Android轮子

### `uv pip install` 在Android上失败

请改用带有标准库虚拟环境 + `pip` 的Termux路径：

```bash
python -m venv venv
source venv/bin/activate
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
python -m pip install --upgrade pip setuptools wheel
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

### `jiter` / `maturin` 提示 `ANDROID_API_LEVEL` 问题

在安装前显式设置API级别：

```bash
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

### `hermes doctor` 报告缺少 ripgrep 或 Node

使用Termux软件包安装它们：

```bash
pkg install ripgrep nodejs
```

### 安装Python软件包时出现构建失败

确保已安装构建工具链：

```bash
pkg install clang rust make pkg-config libffi openssl
```

然后重试：

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

---

## 手机上的已知限制

- Docker后端不可用
- 在经验证路径中，通过 `faster-whisper` 进行的本地语音转写不可用
- 安装程序有意跳过了浏览器自动化设置
- 部分可选额外功能可能有效，但目前只有 `.[termux]` 和 `.[termux-all]` 被记录为经过测试的Android捆绑包

如果您遇到新的Android特定问题，请提交GitHub issue，并附上：
- 您的Android版本
- `termux-info`
- `python --version`
- `hermes doctor`
- 确切的安装命令和完整的错误输出