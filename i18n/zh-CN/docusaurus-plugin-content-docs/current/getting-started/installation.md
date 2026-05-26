---
sidebar_position: 2
title: "安装"
description: "在 Linux、macOS、WSL2、原生 Windows (早期测试版) 或通过 Termux 在 Android 上安装 Hermes 智能体"
---

# 安装

通过一键安装程序，在两分钟内启动并运行 Hermes 智能体。

## 快速安装

### 一键安装程序 (Linux / macOS / WSL2)

用于基于 git 的安装，跟踪 `main` 分支并让您立即获得最新更改：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

### Windows (原生，PowerShell) — 早期测试版

:::warning 早期测试版
原生 Windows 支持处于**早期测试版**阶段。它可以安装并在常见路径下工作，但尚未像我们的 POSIX 安装程序那样经过广泛测试。当您遇到问题时，请[提交问题](https://github.com/NousResearch/hermes-agent/issues)。要在 Windows 上获得目前最稳定可靠的设置，请改在 **WSL2** 中使用上面的 Linux/macOS 单行安装程序。
:::

打开 PowerShell 并运行：

```powershell
iex (irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1)
```

安装程序会处理**所有事情**：`uv`、Python 3.11、Node.js 22、`ripgrep`、`ffmpeg`，**以及一个便携式 Git Bash** (PortableGit — 一个独立的 Git-for-Windows 发行版，包含 `bash.exe` 和 Hermes 用于 shell 命令的完整 POSIX 工具链；在 32 位 Windows 上，安装程序会回退到 MinGit，但它缺少 bash 并禁用终端工具/智能体浏览器功能)。它会将仓库克隆到 `%LOCALAPPDATA%\hermes\hermes-agent` 下，创建虚拟环境，并将 `hermes` 添加到您的**用户 PATH** 中。安装完成后请重启您的终端 (或打开一个新的 PowerShell 窗口)，以便 PATH 生效。

**Git 的处理方式：**
1. 如果 `git` 已经在您的 PATH 中，安装程序将使用您现有的安装。
2. 否则，它会下载便携版 **PortableGit** (~50MB，来自官方的 `git-for-windows` GitHub 发布)，并将其解压到 `%LOCALAPPDATA%\hermes\git`。无需管理员权限。完全隔离 — 它不会干扰任何现有的系统 Git 安装，无论其是否损坏。(在 32 位 Windows 上，它回退到 MinGit，因为 PortableGit 仅提供 64 位和 ARM64 资产；依赖 bash 的 Hermes 功能在 32 位主机上将无法工作。)

**为什么不用 winget？** 早期设计通过 `winget install Git.Git` 自动安装 Git，但当系统 Git 安装处于部分或损坏状态时 (恰恰是用户最需要安装程序正常工作的时候)，winget 表现很差。便携式 Git 方法完全绕过了 winget、Windows 安装程序注册表以及任何现有的系统 Git。如果 Hermes 的 Git 安装本身出现问题，只需删除 `%LOCALAPPDATA%\hermes\git` 并重新运行安装程序即可 — 不会影响系统，也无需卸载。

安装程序还会将 `HERMES_GIT_BASH_PATH` 设置为找到的 `bash.exe`，以便 Hermes 在新的 shell 中能确定性地解析它。

如果您更喜欢 WSL2，上面的 Linux 安装程序可以在其中工作；原生安装和 WSL 安装可以共存而不会冲突 (原生数据位于 `%LOCALAPPDATA%\hermes` 下，WSL 数据位于 `~/.hermes` 下)。

**桌面安装程序 (替代方案)：** 也提供了一个轻量级的 GUI 安装程序 — 下载 Hermes Desktop，运行 `.exe`，首次启动时它会在底层调用 `install.ps1` 来配置 Python (通过 `uv`)、Node、PortableGit 和其他依赖项。桌面应用程序和通过 PowerShell 安装的 CLI 共享相同的安装和数据目录，因此您可以使用任一种或同时使用。详情请参阅 [Windows (原生) 指南](../user-guide/windows-native#desktop-installer-alternative)。

### Android / Termux

Hermes 现在也提供了 Termux 感知的安装路径：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

安装程序会自动检测 Termux 并切换到经过测试的 Android 流程：
- 使用 Termux `pkg` 安装系统依赖项 (`git`, `python`, `nodejs`, `ripgrep`, `ffmpeg`, 构建工具)
- 使用 `python -m venv` 创建虚拟环境
- 自动为 Android wheel 构建导出 `ANDROID_API_LEVEL`
- 优先使用范围更广的 `.[termux-all]` 额外依赖，如果首次尝试编译失败，则回退到更小的 `.[termux]` 额外依赖 (最后才是基础安装)
- 默认跳过未经测试的浏览器/WhatsApp 引导

如果您想要完全明确的路径，请遵循专门的 [Termux 指南](./termux.md)。

:::note Windows 功能对等性 (早期测试版)

原生 Windows 处于**早期测试版**阶段。除了基于浏览器的仪表板聊天终端外，所有功能都在 Windows 上原生运行：
- **CLI (`hermes chat`, `hermes setup`, `hermes gateway`, …)** — 原生，使用您的默认终端
- **网关 (Telegram, Discord, Slack, …)** — 原生，作为后台 PowerShell 进程运行
- **Cron 调度器** — 原生
- **浏览器工具** — 原生 (通过 Node.js 使用 Chromium)
- **MCP 服务器** — 原生 (支持 stdio 和 HTTP 传输)
- **仪表板 `/chat` 终端面板** — **仅限 WSL2** (使用 POSIX PTY；原生 Windows 没有等效项)。仪表板的其余部分 (会话、任务、指标) 可以原生工作 — 只有嵌入的 PTY 终端选项卡是受限制的。

如果遇到与编码相关的错误并希望回退到旧的 cp1252 stdio 路径 (用于二分调试)，请在环境中设置 `HERMES_DISABLE_WINDOWS_UTF8=1`。
:::

### 安装程序的功能

安装程序会自动处理所有事情 — 所有依赖项 (Python, Node.js, ripgrep, ffmpeg)、仓库克隆、虚拟环境、全局 `hermes` 命令设置和 LLM 提供商配置。完成后，您就可以开始聊天了。

#### 安装布局

安装程序将内容放置的位置取决于您是以普通用户还是 root 用户身份安装：

| 安装方式 | 代码位于 | `hermes` 二进制文件 | 数据目录 |
|---|---|---|---|
| pip 安装 | Python 站点包 | `~/.local/bin/hermes` (console_scripts) | `~/.hermes/` |
| 单用户 (git 安装程序) | `~/.hermes/hermes-agent/` | `~/.local/bin/hermes` (符号链接) | `~/.hermes/` |
| Root 模式 (`sudo curl … \| sudo bash`) | `/usr/local/lib/hermes-agent/` | `/usr/local/bin/hermes` | `/root/.hermes/` (或 `$HERMES_HOME`) |

Root 模式的 **FHS 布局** (`/usr/local/lib/…`, `/usr/local/bin/hermes`) 符合其他系统范围的开发工具在 Linux 上的存放位置。对于共享机器部署很有用，此时一个系统安装应为所有用户服务。每用户配置 (认证、技能、会话) 仍然位于每个用户的 `~/.hermes/` 或显式的 `HERMES_HOME` 下。

### 安装后

重新加载您的 shell 并开始聊天：

```bash
source ~/.bashrc   # 或: source ~/.zshrc
hermes             # 开始聊天！
```

若要稍后重新配置单独的设置，请使用专用命令：

```bash
hermes model          # 选择您的 LLM 提供商和模型
hermes tools          # 配置启用哪些工具
hermes gateway setup  # 设置消息平台
hermes config set     # 设置单个配置值
hermes setup          # 或运行完整的设置向导，一次性配置所有内容
:::tip 最快路径：Nous 门户
一次订阅覆盖 300 多个模型以及 [工具网关](/user-guide/features/tool-gateway) (网页搜索、图像生成、TTS、云浏览器)。无需逐个工具管理密钥：

```bash
hermes setup --portal
```

这将登录、将 Nous 设置为您的提供商，并在一条命令中启用工具网关。
:::

---

**pip安装：** 除Python 3.11+外无其他前提条件。其他所有内容均会自动处理。

**Git安装程序：** 唯一的前提条件是**Git**。安装程序会自动处理其他所有内容：

- **uv**（快速Python包管理器）
- **Python 3.11**（通过uv，无需sudo）
- **Node.js v22**（用于浏览器自动化和WhatsApp桥接）
- **ripgrep**（快速文件搜索）
- **ffmpeg**（用于TTS的音频格式转换）

:::info
您**无需**手动安装Python、Node.js、ripgrep或ffmpeg。安装程序会检测缺失的内容并为您安装。只需确保`git`可用（`git --version`）即可。
:::

:::tip Nix用户
如果您使用Nix（在NixOS、macOS或Linux上），有一个专门的设置路径，包含Nix flake、声明式NixOS模块和可选的容器模式。请参阅**[Nix与NixOS设置](./nix-setup.md)**指南。
:::

---

## 手动/开发者安装

如果您想克隆仓库并从源代码安装——用于贡献代码、从特定分支运行或完全控制虚拟环境——请参阅贡献指南中的[开发设置](../developer-guide/contributing.md#development-setup)部分。

---

## 非Sudo/系统服务用户安装

支持以专用非特权用户（例如`hermes`系统服务账户，或任何没有`sudo`权限的用户）运行Hermes。安装路径中唯一真正需要root权限的是Playwright的`--with-deps`步骤，它通过`apt`安装Chromium使用的共享库（`libnss3`、`libxkbcommon`等）。安装程序会检测sudo是否可用，并在不可用时优雅降级——它会将Chromium二进制文件安装到服务用户自己的Playwright缓存中，并打印管理员需要单独运行的确切命令。

**推荐的分离方式（Debian/Ubuntu）：**

1. **一次性，以拥有sudo权限的管理员用户身份**，安装Chromium所需的系统库：
   ```bash
   sudo npx playwright install-deps chromium
   ```
   （您可以在任何地方运行此命令——`npx`会临时获取Playwright。）

2. **以非特权服务用户身份**，运行常规安装程序。它会检测到缺失的sudo，跳过`--with-deps`，并将Chromium安装到用户的本地Playwright缓存中：
   ```bash
   curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
   ```

   如果您想完全跳过Playwright步骤——例如因为您正在无头模式下运行并且不需要浏览器自动化——请传递`--skip-browser`：
   ```bash
   curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash -s -- --skip-browser
   ```

3. **使`hermes`对服务用户的shell可用。** 安装程序将启动器写入`~/.local/bin/hermes`。系统服务账户通常拥有不包含`~/.local/bin`的最小PATH。您可以将其添加到用户环境中，或者将启动器链接到系统位置：
   ```bash
   # 选项A — 添加到服务用户的配置文件
   echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc

   # 选项B — 系统范围链接（以管理员身份运行）
   sudo ln -s /home/hermes/.hermes/hermes-agent/venv/bin/hermes /usr/local/bin/hermes
   ```

4. **验证：** `hermes doctor`现在应该可以正常运行。如果您收到`ModuleNotFoundError: No module named 'dotenv'`，说明您正在使用系统Python调用仓库源代码中的`hermes`文件（`~/.hermes/hermes-agent/hermes`），而不是使用venv启动器（`~/.hermes/hermes-agent/venv/bin/hermes`）——请修复步骤3。

相同的模式适用于Arch（安装程序使用pacman，具有相同的sudo检测逻辑）、Fedora/RHEL和openSUSE——这些发行版根本不支持`--with-deps`，因此管理员总是单独安装系统库。相关的`dnf`/`zypper`命令由安装程序打印。

---
## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| `hermes: command not found` | 重新加载您的shell（`source ~/.bashrc`）或检查PATH |
| `API key not set` | 运行`hermes model`来配置您的提供商，或运行`hermes config set OPENROUTER_API_KEY your_key` |
| 更新后配置缺失 | 运行`hermes config check`然后`hermes config migrate` |

要获取更多诊断信息，请运行`hermes doctor`——它会准确告诉您缺少什么以及如何修复。

## 安装方式自动检测

Hermes会自动检测它是通过`pip`、git安装程序、Homebrew还是NixOS安装的，并且`hermes update`会打印该路径对应的更新命令。无需设置环境变量——检测基于安装布局（Python site-packages、`~/.hermes/hermes-agent/`、Homebrew前缀或Nix store路径）。`hermes doctor`也会在其环境摘要中显示检测到的方式。