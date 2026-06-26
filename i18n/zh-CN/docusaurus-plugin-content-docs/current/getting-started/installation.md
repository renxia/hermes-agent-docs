---
sidebar_position: 2
title: "Installation"
description: "Install Hermes Agent on Linux, macOS, WSL2, native Windows, or Android via Termux"
---

# Installation

在两分钟内让 Hermes 智能体启动并运行！

## 快速安装
### 在 macOS 或 Windows 上使用 Hermes 桌面安装程序（推荐）
要轻松安装命令行和桌面应用程序，请从我们的网站 [下载 Hermes 桌面安装程序](https://hermes-agent.nousresearch.com/) 并运行它。

### 不使用 Hermes 桌面：
如果只需命令行安装而不使用 Hermes 桌面，请运行：

#### Linux / macOS / WSL2 / Android (Termux)
```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

#### Windows (原生)

在 powershell 中运行：
```powershell
iex (irm https://hermes-agent.nousresearch.com/install.ps1) 
```

如果您想在仅命令行安装后安装并运行 Hermes 桌面，只需运行
```bash
hermes desktop
```

### 安装程序的作用

安装程序会自动处理所有事项——所有依赖项（Python、Node.js、ripgrep、ffmpeg）、仓库克隆、虚拟环境、全局 `hermes` 命令设置以及 LLM 提供商配置。安装完成后，您就可以开始对话了。

#### 安装布局

安装程序放置文件的位置取决于您是以普通用户还是 root 用户身份安装：

| 安装方式 | 代码位置 | `hermes` 二进制文件 | 数据目录 |
|---|---|---|---|
| pip install | Python site-packages | `~/.local/bin/hermes` (console_scripts) | `~/.hermes/` |
| 单用户 (git 安装程序) | `~/.hermes/hermes-agent/` | `~/.local/bin/hermes` (符号链接) | `~/.hermes/` |
| Root 模式 (`sudo curl … \| sudo bash`) | `/usr/local/lib/hermes-agent/` | `/usr/local/bin/hermes` | `/root/.hermes/` (或 `$HERMES_HOME`) |

Root 模式下的 **FHS 布局**（`/usr/local/lib/…`、`/usr/local/bin/hermes`）与 Linux 上其他系统级开发工具的位置一致。这适用于共享机器部署，即一个系统安装应为所有用户提供服务。单用户配置（认证、技能、会话）仍然存放在各用户的 `~/.hermes/` 或显式指定的 `HERMES_HOME` 下。

### 安装后

重新加载您的 shell 并开始对话：

```bash
source ~/.bashrc   # 或：source ~/.zshrc
hermes             # 开始对话！
```

要稍后重新配置各个设置，请使用专用命令：

```bash
hermes model          # 选择您的 LLM 提供商和模型
hermes tools          # 配置启用哪些工具
hermes gateway setup  # 设置消息平台
hermes config set     # 设置单个配置值
hermes setup          # 或运行完整设置向导一次性配置所有内容
```

:::tip 最快路径：Nous 门户
一个订阅涵盖 300+ 模型以及[工具网关](/user-guide/features/tool-gateway)（网络搜索、图像生成、TTS、云浏览器）。无需逐个管理工具密钥：

```bash
hermes setup --portal
```

该命令将您登录，将 Nous 设置为您的提供商，并在一条命令中开启工具网关。
:::

---

## 前置条件

**安装程序：**在非 Windows 平台上，唯一的前置条件是 **Git**。在 Linux 上，还需确保 `curl` 和 `xz-utils` 可用（安装程序会以 `.tar.xz` 归档形式下载 Node.js）。桌面应用额外需要 `g++`（或在 Debian/Ubuntu 上为 `build-essential`）来编译原生模块。安装程序会自动处理其他所有内容：

- **uv**（快速 Python 包管理器）
- **Python 3.11**（通过 uv，无需 sudo）
- **Node.js v22**（用于浏览器自动化和 WhatsApp 桥接）
- **ripgrep**（快速文件搜索）
- **ffmpeg**（用于 TTS 的音频格式转换）

:::info
您**不需要**手动安装 Python、Node.js、ripgrep 或 ffmpeg。安装程序会检测缺失的内容并为您安装。只需确保 `git` 可用（`git --version`）。在 Linux 上，确保已安装 `curl` 和 `xz-utils`（在 Debian/Ubuntu 上为 `sudo apt install curl xz-utils`）。对于桌面应用，还需安装 `build-essential`（`sudo apt install build-essential`）。
:::

:::tip Nix 用户
如果您使用 Nix（在 NixOS、macOS 或 Linux 上），有专门的设置路径，包含 Nix flake、声明式 NixOS 模块和可选的容器模式。请参阅 **[Nix & NixOS 设置](./nix-setup.md)** 指南。
:::

---

## 手动 / 开发者安装

如果您想克隆仓库并从源码安装——用于贡献代码、运行特定分支或完全控制虚拟环境——请参阅贡献指南中的[开发设置](../developer-guide/contributing.md#development-setup)部分。

---

## 非 Sudo / 系统服务用户安装

支持将 Hermes 作为专用无特权用户运行（例如 `hermes` systemd 服务账户，或任何没有 `sudo` 访问权限的用户）。安装路径中唯一真正需要 root 权限的是 Playwright 的 `--with-deps` 步骤，该步骤通过 `apt` 安装 Chromium 使用的共享库（`libnss3`、`libxkbcommon` 等）。安装程序会检测 sudo 是否可用，并在不可用时优雅降级——它会将 Chromium 二进制文件安装到服务用户自己的 Playwright 缓存中，并打印出管理员需要单独运行的精确命令。

**推荐拆分方式（Debian/Ubuntu）：**

1. **一次性操作，以具有 sudo 的管理员用户身份**，安装 Chromium 所需的系统库：
   ```bash
   sudo npx playwright install-deps chromium
   ```
   （您可以从任何位置运行此命令——`npx` 会即时获取 Playwright。）

2. **以无特权服务用户身份**，运行常规安装程序。它将检测到缺少 sudo，跳过 `--with-deps`，并将 Chromium 安装到用户的本地 Playwright 缓存中：
   ```bash
   curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
   ```

   如果您想完全跳过 Playwright 步骤——例如因为您在无头模式下运行且不需要浏览器自动化——请传递 `--skip-browser`：
   ```bash
   curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash -s -- --skip-browser
   ```

3. **让 `hermes` 对服务用户的 shell 可用。**安装程序会将启动器写入 `~/.local/bin/hermes`。系统服务账户通常有一个最小的 PATH，不包含 `~/.local/bin`。请将其添加到用户环境中，或将启动器符号链接到系统位置：
   ```bash
   # 选项 A — 添加到服务用户的 profile
   echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc

   # 选项 B — 系统级符号链接（以管理员身份运行）
   sudo ln -s /home/hermes/.hermes/hermes-agent/venv/bin/hermes /usr/local/bin/hermes
   ```

4. **验证：**`hermes doctor` 现在应该可以正常运行。如果遇到 `ModuleNotFoundError: No module named 'dotenv'`，说明您使用的是系统 Python 调用的仓库源 `hermes` 文件（`~/.hermes/hermes-agent/hermes`），而不是 venv 启动器（`~/.hermes/hermes-agent/venv/bin/hermes`）——请修复第 3 步。

同样的模式也适用于 Arch（安装程序使用 pacman 和相同的 sudo 检测逻辑）、Fedora/RHEL 和 openSUSE——这些发行版根本不支持 `--with-deps`，因此管理员总是需要单独安装系统库。安装程序会打印出相应的 `dnf`/`zypper` 命令。

---

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| `hermes: command not found` | 重新加载您的 shell（`source ~/.bashrc`）或检查 PATH |
| `API key not set` | 运行 `hermes model` 配置您的提供商，或 `hermes config set OPENROUTER_API_KEY your_key` |
| 更新后配置丢失 | 运行 `hermes config check` 然后 `hermes config migrate` |

要进行更多诊断，请运行 `hermes doctor`——它会准确告诉您缺少什么以及如何修复。

## 安装方式自动检测

Hermes 会自动检测它是通过 `pip`、git 安装程序、Homebrew 还是 NixOS 安装的，并且 `hermes update` 会打印出该路径对应的更新命令。无需设置环境变量——检测基于安装布局（Python site-packages、`~/.hermes/hermes-agent/`、Homebrew 前缀或 Nix 存储路径）。`hermes doctor` 还会在其环境摘要中显示检测到的安装方式。