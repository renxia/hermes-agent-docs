---
title: "Windows (WSL2) Guide"
description: "Run Hermes Agent on Windows via WSL2 — setup, filesystem access between Windows and Linux, networking, and common pitfalls"
sidebar_label: "Windows (WSL2)"
sidebar_position: 2
---

# Windows (WSL2) 指南

Hermes 智能体现在同时支持原生 Windows 和 WSL2。本页面涵盖 WSL2 的使用路径；有关原生 PowerShell 安装，请参阅专门的**[Windows (Native) Guide](./windows-native.md)**。

**何时选择 WSL2 而非原生环境：**
- 您想使用仪表板（dashboard）中嵌入的终端（`/chat` 标签页）——该面板需要 POSIX PTY，仅在 WSL2 中可用。
- 您正在进行大量依赖 POSIX 的开发工作，希望您的 Hermes 会话能够共享与您的开发工具相同的同一文件系统/路径。
- 您已经拥有 WSL2 环境，不想维护第二个安装。

**何时原生环境足够好（或更好）：**
- 聊天、网关（Telegram/Discord 等）、定时任务（cron scheduler）、浏览器工具、MCP 服务器以及大多数 Hermes 功能都可以在 Windows 上原生运行。
- 您不希望每次引用文件或打开 URL 时都要考虑跨越 WSL↔Windows 的边界。

在 WSL2 中，实际上有两个计算机参与其中：您的 Windows 主机和由 WSL 管理的 Linux 虚拟机。大部分困惑源于不确定自己当前处于哪一个环境。

本指南涵盖了这些分割点中专门影响 Hermes 的部分：安装 WSL2、如何在 Windows 和 Linux 之间来回传输文件、双向网络通信，以及人们实际遇到的陷阱。

:::info 简体中文
此页面上维护着一份最小化安装路径的中文说明——请通过**语言**菜单（右上角）切换并选择**简体中文**。
:::

## 为什么选择 WSL2 (而不是原生 Windows)

原生 Windows 安装直接在 Windows 中运行：您的 Windows 终端（PowerShell、Windows Terminal 等）、Windows 文件系统路径（`C:\Users\...`）和 Windows 进程。Hermes 使用 Git Bash 来运行 shell 命令，这是 Claude Code 和其他智能体目前处理 Windows 的方式——它在没有完全重写的情况下规避了 POSIX 与 Windows 之间的差距。

WSL2 在一个轻量级虚拟机中运行真正的 Linux 内核，因此其中的 Hermes 基本上等同于在 Ubuntu 上运行。当您需要一个真实的 POSIX 环境时，这一点就非常宝贵：`fork`、`/tmp`、UNIX 套接字、信号语义、PTY 后端终端、`bash`/`zsh` 等 shell 以及 `rg`、`git`、`ffmpeg` 等在 Linux 上表现出相应行为的工具。

WSL2 的实际后果：

- Hermes CLI、网关、会话、内存、技能和工具运行时环境都存在于 Linux 虚拟机内部。
- Windows 程序（浏览器、原生应用、带有您登录配置的 Chrome）则存在于外部。
- 每当您希望两者进行交流——共享文件、打开 URL、控制 Chrome、命中本地模型服务器、将 Hermes 网关暴露给您的手机——您就跨越了一个边界。本指南所讨论的正是这些边界。

## 安装 WSL2

在 **Admin PowerShell** 或 Windows Terminal 中执行：

```powershell
wsl --install
```

在全新的 Windows 10 22H2+ 或 Windows 11 设备上，这将安装 WSL2 内核、虚拟机平台功能以及一个默认的 Ubuntu 发行版。提示时请重启。重启后，Ubuntu 将打开并要求输入 Linux 用户名和密码——这是一个**新的 Linux 用户**，与您的 Windows 账户无关。

验证您是否确实在使用 WSL2（而不是旧版的 WSL1）：

```powershell
wsl --list --verbose
```

您应该看到 `VERSION 2`。如果某个发行版显示 `VERSION 1`，请进行转换：

```powershell
wsl --set-version Ubuntu 2
wsl --set-default-version 2
```

Hermes 在 WSL1 上不可靠——WSL1 会即时翻译 Linux 系统调用（syscalls），某些行为（procfs、信号、网络）与真实的 Linux 不同。

### 发行版选择

我们测试的标准是 Ubuntu (LTS)。Debian 可以使用。Arch 和 NixOS 适合那些想要它们的人，但单行安装程序假设的是一个基于 Debian 的 `apt` 系统——有关此路径的设置请参阅 [Nix 设置指南](/getting-started/nix-setup)。

### 启用 systemd（推荐）

与 systemd 一起管理 hermes 网关（以及您想保持运行的任何其他组件）会更容易。在现代 WSL 中，只需在您的发行版内部启用一次：

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true

[interop]
enabled=true
appendWindowsPath=true

[automount]
options = "metadata,umask=22,fmask=11"
EOF
```

然后，在 PowerShell 中执行：

```powershell
wsl --shutdown
```

重新打开您的 WSL 终端。`ps -p 1 -o comm=` 应打印 `systemd`。

上面的 `metadata` 掛载选项非常重要——如果没有它，`/mnt/c/...` 上的文件就无法存储真实的 Linux 权限位，这会破坏像在 Windows 路径下脚本上使用 `chmod +x` 这样的操作。

### 在 WSL 中安装 Hermes

打开 WSL2 shell 后：

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
source ~/.bashrc
hermes
```

安装程序将 WSL2 视为普通的 Linux——不需要任何 WSL 特定的东西。有关完整布局，请参阅 [安装](/getting-started/installation)。

## 文件系统：跨越 Windows ↔ WSL2 界限

这是最容易让人们感到困惑的部分。存在**两种文件系统**，您把文件放在哪里很重要——这关系到性能、正确性以及哪些工具可以看到它们。

### 两种方向

| 方向 | 内部路径 | 您使用的路径 |
|---|---|---|
| 从 WSL 看到的 Windows 磁盘 | `C:\Users\you\Documents` | `/mnt/c/Users/you/Documents` |
| 从 Windows 看到的 WSL 磁盘 | `/home/you/code` | `\\wsl$\Ubuntu\home\you\code` (或在较新的构建中是 `\\wsl.localhost\Ubuntu\...`) |

两者都是真实的，都可以工作，但它们**不是同一个文件系统**——它们是通过底层 9P 网络协议桥接起来的。这会带来实际的性能和语义后果。

### 将 Hermes 和您的项目放在哪里

**经验法则：将所有 Linux 相关的项目保留在 Linux 文件系统中。**

- 您的 Hermes 安装 (`~/.hermes/`) — Linux 端。安装程序已经完成了这一步。
- 您从 WSL 上操作的 Git 仓库 — Linux 端 (`~/code/...`, `~/projects/...`)。
- 您的模型、数据集、venv — Linux 端。

遵循此规则的好处：

- **快速 I/O。** 对 `/mnt/c/...` 的操作会经过 9P，速度比原生的 ext4 慢 10 到 100 倍。在一个包含 10k 个文件的仓库上运行 `git status` 在 `~/code` 下感觉是即时的，但在 `/mnt/c` 下可能需要 15 秒以上。
- **正确的权限。** Linux 权限位在 `/mnt/c` 上是一种尽力而为的模拟。像 `ssh` 拒绝具有“错误权限”的密钥，或者 `chmod +x` 静默失败这样的事情很常见。
- **可靠的文件监视器。** 9P 上的 inotify 不稳定——文件监视器（开发服务器、测试运行器）经常会错过 `/mnt/c` 上的更改。
- **没有大小写敏感性的惊喜。** Windows 路径默认是大小不敏感的；而 Linux 是大小敏感的。如果项目同时存在 `Readme.md` 和 `README.md`，则根据您在哪一侧操作会有不同的行为。

只有当您**需要**某个文件存在于 Windows 端时，才将其放在 `/mnt/c` 上——例如，您想用 Windows GUI 应用打开它，或者 Windows Chrome 的 DevTools MCP 需要当前目录是一个可由 Windows 访问的路径。

### 文件来回传

**从 Windows → 到 WSL：** 最简单的方法是打开资源管理器（Explorer），在地址栏中输入 `\\wsl.localhost\Ubuntu`。然后您可以将文件拖放到 `\home\<you>\...` 下。或者，使用 PowerShell：

```powershell
wsl cp /mnt/c/Users/you/Downloads/file.pdf ~/incoming/
```

**从 WSL → 到 Windows：** 复制到 `/mnt/c/Users/<you>/...`，它会立即显示在 Windows 资源管理器中：

```bash
cp ~/reports/output.pdf /mnt/c/Users/you/Desktop/
```

**在 Windows 应用中打开一个 WSL 文件**（GUI 编辑器、浏览器等）：使用 `explorer.exe` 或 `wslview`：

```bash
sudo apt install wslu     # 只需要执行一次——它会提供 wslview, wslpath, wslopen 等工具。
wslview ~/reports/output.pdf    # 使用 Windows 默认处理器打开
explorer.exe .                  # 在 Windows 资源管理器中打开当前的 WSL 目录
```

**在两个宇宙之间转换路径：**

```bash
wslpath -w ~/code/project        # → \\wsl.localhost\Ubuntu\home\you\code\project
wslpath -u 'C:\Users\you'        # → /mnt/c/Users/you
```

### 换行符、BOM 和 Git

如果您使用 Windows 编辑器在 Windows 端编辑文件，它们可能会带有 `CRLF` 换行符。当 Linux 端的 `bash` 或 Python 读取这些文件时，shell 脚本会因为 `bad interpreter: /bin/bash^M` 而崩溃，而 Python 则可能因 BOM（字节顺序标记）的 `.env` 文件而失败。

解决方法是在 WSL 内设置合理的 Git 配置（而不是在 Windows 上）：

```bash
git config --global core.autocrlf input
git config --global core.eol lf
```

对于已经包含 CRLF 的文件：

```bash
sudo apt install dos2unix
dos2unix path/to/script.sh
```

### “在 WSL 中克隆还是在 `/mnt/c` 中克隆？”

始终在 WSL 中克隆。除非您有特定的理由不这样做。一个典型的 Hermes 工作流程（`hermes chat`、使用 `rg`/`ripgrep` 进行工具调用、文件监视器、后台网关）与 `/mnt/c/Users/you/myrepo` 相比，在 `~/code/myrepo` 上运行会快得多，也更可靠。

一个例外情况：**启动 Windows 二进制文件的 MCP（多功能控制器）。** 如果您通过 `cmd.exe` 使用 `chrome-devtools-mcp`（参见 [MCP 指南：WSL → Windows Chrome](/guides/use-mcp-with-hermes#wsl2-bridge-hermes-in-wsl-to-windows-chrome)），Windows 可能会发出 `UNC` 警告，如果 Hermes 的当前工作目录是 `~`。在这种情况下，请从 `/mnt/c/` 下面的某个位置启动 Hermes，以便 Windows 进程拥有一个驱动器字母的 cwd（current working directory）。

## 网络：WSL ↔ Windows

WSL2 在一个轻量级 VM 中运行，它有自己的网络栈。这意味着 WSL 内的 `localhost` **与** Windows 上的 `localhost` **不是同一个东西**——从网络的角度来看，它们是两个独立的宿主。您需要决定对于每个服务，流量流向哪个方向，并选择正确的桥接方式。

经常会出现两种情况。

### 情况 1 — WSL 中的 Hermes 与 Windows 上的服务进行通信

这是最常见的情况：您正在 **Windows 上运行 Ollama、LM Studio 或 llama-server**，而 Hermes（在 WSL 中）需要访问它。

此问题的标准解决方案位于提供商指南中：**[本地模型对 WSL2 的网络](https://integrations/providers#wsl2-networking-windows-users)**

简短版本：

- **Windows 11 22H2+：** 开启镜像网络模式（在 `%USERPROFILE%\.wslconfig` 中设置 `networkingMode=mirrored`，然后运行 `wsl --shutdown`）。此时，两个方向上的 `localhost` 都有效。
- **Windows 10 或更早的构建版本：** 使用 Windows 主机的 IP（WSL 虚拟网络的默认网关），并确保 Windows 上的服务器绑定到 `0.0.0.0`，而不仅仅是 `127.0.0.1`。Windows 防火墙通常也需要针对该端口设置一条规则。

有关完整表格（Ollama / LM Studio / vLLM / SGLang 的绑定地址、防火墙规则一键式命令、动态 IP 助手、Hyper-V 防火墙解决方案），请参考上述链接——无需重复翻译。

### 情况 2 — Windows 或您的局域网 (LAN) 上的某物与 WSL 中的 Hermes 进行通信

这是反向方向，在其他地方较少被记录，但它是您实现以下功能所必需的：

- 从 Windows 浏览器使用 Hermes **Web 控制面板**。
- 从 Windows 端的工具使用 **OpenAI 兼容 API 服务器**（当 `API_SERVER_ENABLED=true` 时由 `hermes gateway` 提供）。请参阅 [API 服务器功能页面](/user-guide/features/api-server)。
- 测试一个**消息网关**（Telegram、Discord 等），其中平台会 ping 一个本地 Webhook URL——通常您应该使用 `cloudflared`/`ngrok` 而不是原始的端口转发。

#### 子情况 2a：从 Windows 主机本身进行通信

在启用了镜像模式的 **Windows 11 22H2+** 上，无需做任何操作。一个绑定到 `0.0.0.0:8080`（甚至 `127.0.0.1:8080`）的 WSL 进程可以从 Windows 浏览器通过 `http://localhost:8080` 访问。WSL 会自动将该绑定发布回主机。

在 **NAT 模式**（Windows 10 / 更早的 Windows 11）下，WSL2 的默认“localhost 转发”通常会将 Linux 端的 `127.0.0.1` 绑定转发到 Windows 的 `localhost`，因此使用 `--host 127.0.0.1` 启动的 Hermes 服务通常可以通过 Windows 上的 `http://localhost:PORT` 访问。如果不行：

- 在 WSL 内部显式地绑定到 `0.0.0.0`。
- 使用 `ip -4 addr show eth0 | grep inet` 查找 WSL VM 的 IP，并从 Windows 上使用该 IP 进行访问。

#### 子情况 2b：从局域网 (LAN) 上的其他设备（手机、平板电脑、另一台 PC）进行通信

这才是真正的难点。流量流向是 **LAN 设备 → Windows 主机 → WSL VM**，您必须设置这两个跳跃步骤：

1. **在 WSL 内部绑定到所有接口。** 监听 `127.0.0.1` 的进程永远无法从 VM 外部被访问。请使用 `0.0.0.0`。

2. **Windows → WSL VM 进行端口转发。** 在镜像模式下这是自动的。在 NAT 模式下，您必须针对每个端口手动完成，在 Admin PowerShell 中执行：

   ```powershell
   # 获取 WSL VM 当前的 IP（在 NAT 下每次 WSL 重启时都会改变）
   $wslIp = (wsl hostname -I).Trim().Split(' ')[0]

   # 将 Windows 端口 8080 → WSL:8080 进行转发
   netsh interface portproxy add v4tov4 `
     listenaddress=0.0.0.0 listenport=8080 `
     connectaddress=$wslIp connectport=8080

   # 允许 Windows 防火墙通过
   New-NetFirewallRule -DisplayName "Hermes WSL 8080" `
     -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
   ```

   使用 `netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=8080` 进行移除。

3. **将 LAN 设备指向 `http://<windows-lan-ip>:8080`。**

由于 NAT 模式下 WSL VM 的 IP 会随重启而漂移，因此一个一次性的规则只能持续到下次运行 `wsl --shutdown` 为止。对于需要持久化的配置，请使用镜像模式，或者将端口代理步骤放入一个在 Windows 登录时运行的脚本中。

对于来自云消息提供商（Telegram `setWebhook`、Slack 事件等）的 Webhook，不要试图解决端口转发问题——请使用 `cloudflared` 隧道。请参阅 [Webhooks 指南](/user-guide/messaging/webhooks)。

## 在 Windows 上长期运行 Hermes 服务

Hermes [Tool Gateway](/user-guide/features/tool-gateway) 和 API 服务器是长久运行的进程。在 WSL2 中，您有几种保持它们运行的方法。

### 用于快速打开 Hermes 的桌面快捷方式

如果您只是想拥有一个用于交互式 Hermes shell 的双击启动器，请在 Windows 端创建它，让它为您跳转到 WSL：

1.  右键单击 Windows 桌面并选择 **新建 -> 快捷方式**。
2.  对于目标（Target），使用您的发行版名称（如果需要，请替换 `Ubuntu`）：

    ```text
    wt.exe -w 0 -p "Ubuntu" wsl.exe -d Ubuntu --cd ~ -- bash -ic "hermes"
    ```

3.  将其命名为易于识别的名称，例如 `Hermes`。

这会打开 Windows Terminal，启动您的 WSL 发行版，将您带到 Linux 主目录，并启动 Hermes。如果 `hermes` 尚未添加到 PATH 中，请手动打开一次 WSL 并运行 `source ~/.bashrc`，或者在项目检出目录中用 `uv run hermes` 替换该命令。

可选的润色：

-   **自定义图标：** 打开 **属性 -> 更改图标**，并将其指向一个 `.ico` 文件，例如来自仓库的 Hermes favicon。
-   **固定启动器：** 一旦快捷方式可用，就将其固定到“开始”菜单或任务栏，这样您就不必再为它进行搜索。

### 在 WSL 中使用 systemd（推荐）

如果您已按照上方的设置部分启用了 systemd，`hermes gateway` 和 API 服务器的工作方式与任何 Linux 机器上的工作方式相同。请使用网关设置向导：

```bash
hermes gateway setup
```

它将提供安装一个 systemd 用户单元的选项，以便在 WSL 启动时网关自动启动。

### 让 WSL 本身在 Windows 登录时启动

WSL 的虚拟机只有在有程序使用它时才会保持运行。为了在没有打开终端窗口的情况下保持您的网关可访问，请通过任务计划程序（Task Scheduler）在 Windows 登录时启动一个 WSL 进程：

-   **触发器 (Trigger)：** 在登录时（针对您的用户）。
-   **操作 (Action)：** 启动程序
    -   程序 (Program)：`C:\Windows\System32\wsl.exe`
    -   参数 (Arguments)：`-d Ubuntu --exec /bin/sh -c "sleep infinity"`

这可以保持虚拟机存活，从而使由 systemd 管理的网关持续运行。在 Windows 11 上，较新的 `wsl --install --no-launch` + 自动启动流程也有效；而 `sleep infinity` 技巧是可移植的版本。

## GPU 直通（本地模型）

自 WSL 内核 5.10.43+ 版本以来，WSL2 就原生支持 **NVIDIA** GPU — 请在 Windows 上安装标准的 NVIDIA 驱动程序（**不要**在 WSL 内部安装 Linux NVIDIA 驱动），然后在 WSL 中运行 `nvidia-smi` 即可看到 GPU。从那里，CUDA 工具包、`torch`、`vllm`、`sglang` 和 `llama-server` 就可以像往常一样针对真实的 GPU 进行构建。

AMD ROCm 和 Intel Arc 在 WSL2 中的支持仍在发展中，超出了 Hermes 的测试矩阵范围 — 它可能与当前驱动程序一起工作，但我们没有推荐的配方。

如果您正在运行一个使用 Windows 驱动程序的 **Windows 原生**本地模型服务器（例如 Ollama for Windows, LM Studio），则完全不需要 WSL GPU 直通——只需遵循上方的案例 1，然后通过网络从 WSL 调用它即可。

## 常见陷阱

**“连接被拒绝”到我 Windows 主机的 Ollama / LM Studio。**
请参阅 [WSL2 网络](/integrations/providers#wsl2-networking-windows-users)。九成的可能性是服务器绑定到了 `127.0.0.1` 而需要 `0.0.0.0`（Ollama：`OLLAMA_HOST=0.0.0.0`），或者您缺少防火墙规则。

**在仓库中运行 `git status` / `hermes chat` 时速度极慢。**
您可能是在 `/mnt/c/...` 下工作的。请将仓库移动到 `~/code/...`（Linux 端）。速度会提升一个数量级。

**脚本上出现的 `bad interpreter: /bin/bash^M`。**
这是来自 Windows 编辑器的 CRLF 换行符。运行 `dos2unix script.sh`，并在 WSL git 配置中设置 `core.autocrlf input`。

**通过 MCP 启动 Windows 二进制文件时出现的“UNC 路径不受支持”警告。**
Hermes 的当前工作目录 (cwd) 在 Linux 文件系统内，而 Windows 的 `cmd.exe` 不知道该怎么办。请从 `/mnt/c/...` 启动 Hermes 以便会话有效，或者使用一个包装器程序，使其在调用 Windows 可执行文件之前先 `cd` 到一个 Windows 可达的路径。

**睡眠/休眠后的时钟漂移。**
WSL2 的时钟在宿主从睡眠中恢复后可能会滞后几分钟，这会破坏任何基于证书（OAuth、HTTPS API）的东西。请按需修复：

```bash
sudo hwclock -s
```

或者安装 `ntpdate` 并在登录时运行它。

**启用镜像模式或连接 VPN 后 DNS 停止工作。**
镜像模式会将宿主网络设置代理到 WSL — 如果 Windows DNS 有问题（VPN 分割隧道、企业解析器），WSL 就会继承这些问题。解决方法：手动覆盖 `resolv.conf`（在 `/etc/wsl.conf` 中设置 `generateResolvConf=false`，然后用包含 `1.1.1.1` 或您 VPN DNS 的自定义 `/etc/resolv.conf` 替换它）。

**运行安装程序后找不到 `hermes`。**
安装程序通过 `~/.bashrc` 将 `~/.local/bin` 添加到 shell 的 PATH 中。您需要 `source ~/.bashrc`（或打开一个新的终端）才能使其在当前会话中生效。

**Windows Defender 对 WSL 文件扫描很慢。**
当从 Windows 访问文件时，Defender 会通过 9P 网桥进行扫描，这放大了 `/mnt/c`-style 跨边界访问的缓慢问题。如果您只在 WSL 内部操作 WSL 文件，则不会有此问题。如果您经常使用 Windows 工具针对 `\\wsl$\...` 进行操作，请考虑将 WSL 发行版路径排除在实时扫描之外。

**磁盘空间不足。**
WSL2 将其虚拟机磁盘存储为 `%LOCALAPPDATA%\Packages\...` 下的稀疏 VHDX 文件。它会增长，但在您删除文件时不会自动收缩。要回收空间：运行 `wsl --shutdown`，然后从管理员 PowerShell 运行 `Optimize-VHD -Path <path-to-ext4.vhdx> -Mode Full`（需要 Hyper-V 工具）— 或者使用 WSL 文档中记录的更简单的 `diskpart` 方法。

## 下一步该去哪里

-   **[安装](/getting-started/installation)** — 实际的安装步骤（Linux/WSL2/Termux 都使用相同的安装程序）。
-   **[集成 → 提供者 → WSL2 网络](/integrations/providers#wsl2-networking-windows-users)** — 本地模型服务器的规范性网络深度解析。
-   **[MCP 指南 → WSL → Windows Chrome](/guides/use-mcp-with-hermes#wsl2-bridge-hermes-in-wsl-to-windows-chrome)** — 从 WSL 中控制您已登录的 Windows Chrome。
-   **[工具网关](/user-guide/features/tool-gateway)** 和 **[Web 仪表板](/user-guide/features/web-dashboard)** — 您最常需要从 WSL 暴露给网络中其他部分的长期运行服务。