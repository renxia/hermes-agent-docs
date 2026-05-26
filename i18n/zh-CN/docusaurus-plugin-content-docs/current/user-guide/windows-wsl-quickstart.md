---
title: "Windows (WSL2) 指南"
description: "通过 WSL2 在 Windows 上运行 Hermes 智能体——设置、Windows 与 Linux 间的文件系统访问、网络连接及常见问题"
sidebar_label: "Windows (WSL2)"
sidebar_position: 2
---

# Windows (WSL2) 指南

Hermes 智能体现在同时支持**原生 Windows** 和 **WSL2**。 本页面介绍 WSL2 方式；关于原生 PowerShell 安装，请参见专门的 **[Windows（原生）指南](./windows-native.md)**。

**何时选择 WSL2 而非原生：**
- 您想使用仪表盘的嵌入式终端（`/chat` 标签页）——该面板需要 POSIX PTY，且仅支持 WSL2。
- 您正在进行大量 POSIX 开发工作，并希望您的 Hermes 会话与开发工具共享相同的文件系统/路径。
- 您已经拥有 WSL2 环境，不想再维护另一个安装。

**何时原生方式就很好（或更好）：**
- 交互式聊天、网关（Telegram/Discord 等）、定时调度器、浏览器工具、MCP 服务器以及大多数 Hermes 功能都可以在 Windows 上原生运行。
- 您不想每次引用文件或打开 URL 时都考虑跨 WSL↔Windows 边界的问题。

在 WSL2 中，实际上涉及两台计算机：您的 Windows 主机和由 WSL 管理的 Linux 虚拟机。 大多数困惑来自于在任何时刻不确定您正在使用哪一个。

本指南涵盖了该分离中具体影响 Hermes 的部分：安装 WSL2、在 Windows 和 Linux 之间传输文件、双向网络连接，以及人们实际会遇到的陷阱。

:::info 简体中文
本页维护了一个简体中文的最小安装路径讲解——请点击右上角的 **language** 菜单，然后选择 **简体中文** 进行切换。
:::

## 为何选择 WSL2（对比原生 Windows）

原生 Windows 安装直接在 Windows 中运行：您的 Windows 终端（PowerShell、Windows 终端等）、Windows 文件系统路径（`C:\Users\…`）和 Windows 进程。 Hermes 使用 Git Bash 来运行 shell 命令，这是 Claude Code 和其他智能体处理 Windows 的当前方式——它规避了 POSIX 与 Windows 之间的差异，无需完全重写。

WSL2 在轻量级虚拟机中运行真实的 Linux 内核，因此其中的 Hermes 本质上与在 Ubuntu 上运行相同。 当您需要一个真正的 POSIX 环境时，这很有价值：`fork`、`/tmp`、UNIX 套接字、信号语义、基于 PTY 的终端、像 `bash`/`zsh` 这样的 shell，以及像 `rg`、`git`、`ffmpeg` 这样行为与在 Linux 上一致的工具。

WSL2 的实际影响：
- Hermes CLI、网关、会话、内存、技能和工具运行时都位于 Linux 虚拟机内。
- Windows 程序（浏览器、原生应用、已登录个人资料的 Chrome）位于其外部。
- 每当您希望两者进行通信时——共享文件、打开 URL、控制 Chrome、访问本地模型服务器、将 Hermes 网关暴露给手机——您都需要跨越边界。这些边界正是本指南的重点。

## 安装 WSL2

在 **管理员 PowerShell** 或 Windows 终端中：

```powershell
wsl --install
```

在全新的 Windows 10 22H2+ 或 Windows 11 机器上，这会安装 WSL2 内核、虚拟机平台功能和一个默认的 Ubuntu 发行版。根据提示重启。重启后 Ubuntu 将打开并询问 Linux 用户名和密码——这是一个 **全新的 Linux 用户**，与你的 Windows 账户无关。

验证你实际使用的是 WSL2（而不是旧版 WSL1）：

```powershell
wsl --list --verbose
```

你应该会看到 `VERSION  2`。如果某个发行版显示 `VERSION  1`，请进行转换：

```powershell
wsl --set-version Ubuntu 2
wsl --set-default-version 2
```

Hermes 在 WSL1 上无法可靠工作——WSL1 会动态翻译 Linux 系统调用，一些行为（procfs、信号、网络）与真正的 Linux 不同。

### 发行版选择

Ubuntu（长期支持版）是我们测试的目标。Debian 可以使用。Arch 和 NixOS 对需要它们的人也能工作，但一键安装程序假设是基于 Debian 的 `apt` 系统——请参阅 [Nix 设置指南](/getting-started/nix-setup) 了解那条路径。

### 启用 systemd（推荐）

hermes 网关（以及你想要保持运行的任何其他服务）使用 systemd 更易于管理。在现代 WSL 上，在你的发行版内部启用一次即可：

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

然后在 PowerShell 中：

```powershell
wsl --shutdown
```

重新打开你的 WSL 终端。`ps -p 1 -o comm=` 应该会输出 `systemd`。

上面的 `metadata` 挂载选项很重要——没有它，`/mnt/c/...` 上的文件无法存储真正的 Linux 权限位，这会导致在 Windows 路径下的脚本执行 `chmod +x` 等命令失败。

### 在 WSL 中安装 Hermes

一旦你打开了 WSL2 shell：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
source ~/.bashrc
hermes
```

安装程序将 WSL2 视为普通 Linux——不需要任何 WSL 特定的操作。有关完整布局，请参阅[安装](/getting-started/installation)。

## 文件系统：跨越 Windows ↔ WSL2 的边界

这是大多数人困惑的地方。有 **两个文件系统**，你把文件放在哪里很重要——这关系到性能、正确性和哪些工具能看到。

### 两个方向

| 方向 | 内部路径 | 你使用的路径 |
|---|---|---|
| Windows 磁盘，在 WSL 中看到 | `C:\Users\you\Documents` | `/mnt/c/Users/you/Documents` |
| WSL 磁盘，在 Windows 中看到 | `/home/you/code` | `\\wsl$\Ubuntu\home\you\code` (或在较新版本上是 `\\wsl.localhost\Ubuntu\...`) |

两者都是真实的，都能工作，但它们 **不是同一个文件系统**——它们在底层通过 9P 网络协议进行桥接。这会带来实际的性能和语义后果。

### 把 Hermes 和你的项目放在哪里

**经验法则：把所有 Linux 相关的东西都放在 Linux 文件系统内。**

- 你的 Hermes 安装（`~/.hermes/`）——Linux 侧。安装程序已经这样做了。
- 你从 WSL 处理的 git 仓库——Linux 侧（`~/code/...`、`~/projects/...`）。
- 你的模型、数据集、虚拟环境——Linux 侧。

遵循此规则的好处：

- **快速 I/O。** 对 `/mnt/c/...` 的操作通过 9P 进行，比原生 ext4 慢 10-100 倍。一个在 `~/code` 下感觉瞬间完成的 1 万文件仓库的 `git status`，在 `/mnt/c` 下可能需要 15 秒以上。
- **正确的权限。** Linux 权限位在 `/mnt/c` 上是尽力模拟的。像 `ssh` 因为 "权限错误" 拒绝密钥，或者 `chmod +x` 静默失败等情况很常见。
- **可靠的文件监视。** inotify 在 9P 上不太稳定——文件监视器（开发服务器、测试运行器）经常在 `/mnt/c` 上错过更改。
- **没有大小写敏感性意外。** Windows 路径默认不区分大小写；Linux 区分大小写。同时包含 `Readme.md` 和 `README.md` 的项目，其行为取决于你从哪一侧访问。

只有当你 **需要** 文件驻留在 Windows 侧时才把它们放在 `/mnt/c`——例如，你想从 Windows GUI 应用打开它，或者 Windows Chrome 的 DevTools MCP 需要当前目录是 Windows 可访问的路径。

### 文件往来传递

**从 Windows → 到 WSL 中：** 最简单的方法是打开资源管理器，在地址栏输入 `\\wsl.localhost\Ubuntu`。然后你可以拖放到 `\home\<你>\...`。或者从 PowerShell：

```powershell
wsl cp /mnt/c/Users/you/Downloads/file.pdf ~/incoming/
```

**从 WSL → 到 Windows 中：** 复制到 `/mnt/c/Users/<你>/...`，它会立即显示在 Windows 资源管理器中：

```bash
cp ~/reports/output.pdf /mnt/c/Users/you/Desktop/
```

**在 Windows 应用中打开 WSL 文件**（GUI 编辑器、浏览器等）：使用 `explorer.exe` 或 `wslview`：

```bash
sudo apt install wslu     # 一次性操作——为你提供 wslview, wslpath, wslopen 等工具
wslview ~/reports/output.pdf    # 使用 Windows 默认处理程序打开
explorer.exe .                  # 在 Windows 资源管理器中打开当前 WSL 目录
```

**在两个世界之间转换路径：**

```bash
wslpath -w ~/code/project        # → \\wsl.localhost\Ubuntu\home\you\code\project
wslpath -u 'C:\Users\you'        # → /mnt/c/Users/you
```

### 换行符、BOM 和 git

如果你在 Windows 侧用 Windows 编辑器编辑文件，它们可能会变成 `CRLF` 换行符。当 Linux 侧的 `bash` 或 Python 读取它们时，shell 脚本会因 `bad interpreter: /bin/bash^M` 而中断，Python 可能会因带有 BOM 的 `.env` 文件而失败。

解决方法是在 WSL 内部（而不是 Windows 上）配置一个合理的 git 配置：

```bash
git config --global core.autocrlf input
git config --global core.eol lf
```

对于已经有 CRLF 的文件：

```bash
sudo apt install dos2unix
dos2unix path/to/script.sh
```

### "在 WSL 内部克隆还是在 `/mnt/c` 上克隆？"

在 WSL 内部克隆。始终如此，除非你有特定的理由不这样做。典型的 Hermes 工作流（`hermes chat`、调用 `rg`/`ripgrep` 搜索仓库的工具、文件监视器、后台网关）在 `~/code/myrepo` 上将比在 `/mnt/c/Users/you/myrepo` 上快得多且可靠得多。

一个例外：**启动 Windows 二进制文件的 MCP 桥接器。** 如果你通过 `cmd.exe` 使用 `chrome-devtools-mcp`（参见 [MCP 指南：WSL → Windows Chrome](/guides/use-mcp-with-hermes#wsl2-bridge-hermes-in-wsl-to-windows-chrome)），如果 Hermes 的当前工作目录是 `~`，Windows 可能会报 `UNC` 警告。在这种情况下，从 `/mnt/c/` 下的某个位置启动 Hermes，以便 Windows 进程有一个带盘符的当前工作目录。

## 网络：WSL ↔ Windows

WSL2 运行在一个轻量级虚拟机中，拥有自己的网络栈。这意味着 WSL 内部的 `localhost` 与 Windows 上的 `localhost` **不是同一个**——从网络的角度看，它们是两个独立的主机。你需要根据每个服务决定流量流向哪个方向，并选择正确的桥接方式。

两种情况经常出现。

### 情况 1 — WSL 中的 Hermes 与 Windows 上的服务通信

最常见的情况是：你在 Windows 上运行 **Ollama、LM Studio 或 llama-server**，而 Hermes（在 WSL 内部）需要访问它。

此情况的权威指南位于提供者指南中：**[WSL2 本地模型网络 →](/integrations/providers#wsl2-networking-windows-users)**

简而言之：

- **Windows 11 22H2+：** 开启镜像网络模式（在 `%USERPROFILE%\.wslconfig` 中设置 `networkingMode=mirrored`，然后执行 `wsl --shutdown`）。这样 `localhost` 在两个方向都有效。
- **Windows 10 或更早版本：** 使用 Windows 主机 IP（WSL 虚拟网络的默认网关），并确保 Windows 上的服务器绑定到 `0.0.0.0`，而不仅仅是 `127.0.0.1`。Windows 防火墙通常也需要为端口设置规则。

有关完整表格（Ollama / LM Studio / vLLM / SGLang 绑定地址、防火墙规则一行命令、动态 IP 辅助程序、Hyper-V 防火墙解决方法），请参阅上面的链接——这里不重复。

### 情况 2 — Windows 上（或你的局域网）的某些东西与 WSL 中的 Hermes 通信

这是反向的情况，在其他地方文档较少，但它是你使用以下功能时需要的：

- 从 Windows 浏览器使用 Hermes **Web 控制台**。
- 从 Windows 侧工具使用 **OpenAI 兼容 API 服务器**（由 `hermes gateway` 在设置 `API_SERVER_ENABLED=true` 时暴露）。参见 [API 服务器功能页面](/user-guide/features/api-server)。
- 测试 **消息网关**（Telegram、Discord 等），其中平台会 ping 一个本地 webhook URL——通常你会使用 `cloudflared`/`ngrok`，而不是原始的端口转发。

#### 子情况 2a：从 Windows 主机本身

在 **启用镜像模式的 Windows 11 22H2+** 上，无需任何操作。在 WSL 中绑定到 `0.0.0.0:8080`（甚至 `127.0.0.1:8080`）的进程，可以从 Windows 浏览器通过 `http://localhost:8080` 访问。WSL 会自动将绑定发布回主机。

在 **NAT 模式**（Windows 10 / 旧版 Windows 11）下，WSL2 中的默认 "localhost 转发" 通常会将 Linux 侧的 `127.0.0.1` 绑定转发到 Windows 的 `localhost`，因此使用 `--host 127.0.0.1` 启动的 Hermes 服务通常可以从 Windows 通过 `http://localhost:端口` 访问。如果不行：

- 在 WSL 内部显式绑定到 `0.0.0.0`。
- 使用 `ip -4 addr show eth0 | grep inet` 找到 WSL 虚拟机的 IP，然后从 Windows 访问该地址。

#### 子情况 2b：从局域网的其他设备（手机、平板、其他电脑）

这是真正的麻烦所在。流量路径是 **局域网设备 → Windows 主机 → WSL 虚拟机**，你必须设置好这两跳：

1.  **在 WSL 内部绑定到所有接口。** 监听 `127.0.0.1` 的进程永远无法从虚拟机外部访问。使用 `0.0.0.0`。

2.  **设置 Windows → WSL 虚拟机的端口转发。** 在镜像模式下这是自动的。在 NAT 模式下，你需要在管理员 PowerShell 中为每个端口手动操作：

    ```powershell
    # 获取 WSL 虚拟机的当前 IP（在 NAT 模式下每次 WSL 重启都会变化）
    $wslIp = (wsl hostname -I).Trim().Split(' ')[0]

    # 转发 Windows 端口 8080 → WSL:8080
    netsh interface portproxy add v4tov4 `
      listenaddress=0.0.0.0 listenport=8080 `
      connectaddress=$wslIp connectport=8080

    # 允许通过 Windows 防火墙
    New-NetFirewallRule -DisplayName "Hermes WSL 8080" `
      -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
    ```

    稍后删除：`netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=8080`。

3.  **将局域网设备指向 `http://<windows-lan-ip>:8080`。**

因为在 NAT 模式下 WSL 虚拟机的 IP 每次重启都会漂移，一次性规则只能在下一次 `wsl --shutdown` 前有效。对于任何需要持久化的情况，要么使用镜像模式，要么将端口代理步骤放在一个在 Windows 登录时运行的脚本中。

对于来自云消息提供商的 webhook（Telegram `setWebhook`、Slack 事件等），不要与端口转发斗争——使用 `cloudflared` 隧道。参见 [webhook 指南](/user-guide/messaging/webhooks)。

## 在 Windows 上长期运行 Hermes 服务

Hermes [工具网关](/user-guide/features/tool-gateway) 和 API 服务器都是长期运行的进程。在 WSL2 中，你有几种方式来保持它们运行。

### 在 WSL 内使用 systemd（推荐）

如果你已根据上面的设置部分启用了 systemd，那么 `hermes gateway` 和 API 服务器的工作方式将与在任何 Linux 机器上相同。使用网关设置向导：

```bash
hermes gateway setup
```

它会提供安装一个 systemd 用户单元的选项，以便在 WSL 启动时网关能自动启动。

### 使 WSL 在 Windows 登录时自动启动

WSL 的虚拟机只在有东西使用它时才会保持活动状态。为了让网关在没有打开终端窗口的情况下保持可达，你可以通过任务计划程序在 Windows 登录时启动一个 WSL 进程：

- **触发器：** 登录时（你的用户）。
- **操作：** 启动程序
  - 程序：`C:\Windows\System32\wsl.exe`
  - 参数：`-d Ubuntu --exec /bin/sh -c "sleep infinity"`

这将保持虚拟机存活，以便由 systemd 管理的网关能够持续运行。在 Windows 11 上，更新的 `wsl --install --no-launch` + 自动启动流程也能工作；`sleep infinity` 技巧是可移植的版本。

## GPU 直通（本地模型）

自 WSL 内核 5.10.43+ 起，WSL2 原生支持 **NVIDIA** GPU —— 在 Windows 上安装标准的 NVIDIA 驱动程序（**不要** 在 WSL 内部安装 Linux 版 NVIDIA 驱动），然后在 WSL 内的 `nvidia-smi` 就能看到 GPU。之后，CUDA 工具包、`torch`、`vllm`、`sglang` 和 `llama-server` 都可以照常针对真实 GPU 进行构建。

AMD ROCm 和 Intel Arc 在 WSL2 内的支持仍在发展中，并且不在 Hermes 的测试范围内——它可能适用于当前驱动程序，但我们没有推荐的方案。

如果你正在运行一个**Windows 原生**的本地模型服务器（适用于 Windows 的 Ollama、LM Studio），它已经通过 Windows 驱动程序使用你的 GPU，那么你根本不需要 WSL GPU 直通——只需遵循上面的案例 1，并通过网络从 WSL 访问它即可。

## 常见问题

**“Connection refused” 连接到我 Windows 托管的 Ollama / LM Studio。**
参见 [WSL2 网络](/integrations/providers#wsl2-networking-windows-users)。百分之九十的情况是服务器绑定到了 `127.0.0.1`，需要改成 `0.0.0.0`（Ollama: `OLLAMA_HOST=0.0.0.0`），或者你缺少一条防火墙规则。

**在仓库中执行 `git status` / `hermes chat` 时异常缓慢。**
你可能是在 `/mnt/c/...` 路径下工作。将仓库移动到 `~/code/...`（Linux 端）。速度会快上一个数量级。

**脚本上出现 `bad interpreter: /bin/bash^M`。**
这是 Windows 编辑器带来的 CRLF 换行符。运行 `dos2unix script.sh`，并在你的 WSL git 配置中设置 `core.autocrlf input`。

**通过 MCP 启动的 Windows 二进制文件提示 “UNC paths are not supported” 警告。**
Hermes 的当前工作目录在 Linux 文件系统内部，而 Windows 的 `cmd.exe` 不知道如何处理它。为该会话从 `/mnt/c/...` 路径启动 Hermes，或者使用一个包装脚本，在调用 Windows 可执行文件之前先 `cd` 到一个 Windows 可达的路径。

**休眠/睡眠后时钟漂移。**
WSL2 的时钟在主机从睡眠恢复后可能会滞后几分钟，这会导致任何基于证书的功能（OAuth、HTTPS API）失效。按需修复：

```bash
sudo hwclock -s
```

或者安装 `ntpdate` 并在登录时运行它。

**启用镜像模式或连接 VPN 后 DNS 停止工作。**
镜像模式将主机网络设置代理到 WSL——如果 Windows 的 DNS 有问题（VPN 分割隧道、企业解析器），WSL 也会继承这个问题。变通方法：手动覆盖 `resolv.conf`（在 `/etc/wsl.conf` 中设置 `generateResolvConf=false`，然后写入你自己的 `/etc/resolv.conf`，使用 `1.1.1.1` 或你的 VPN DNS）。

**运行安装程序后找不到 `hermes`。**
安装程序通过 `~/.bashrc` 将 `~/.local/bin` 添加到你 shell 的 PATH 中。你需要执行 `source ~/.bashrc`（或打开一个新的终端）才能在当前会话中生效。

**Windows Defender 在 WSL 文件上运行缓慢。**
当从 Windows 访问文件时，Defender 会通过 9P 桥接扫描文件，这放大了 `/mnt/c` 这类跨边界访问的缓慢性。如果你只在 WSL 内部操作 WSL 文件，这无关紧要。如果你经常使用 Windows 工具操作 `\\wsl$\...` 路径，可以考虑从实时扫描中排除 WSL 发行版路径。

**磁盘空间不足。**
WSL2 将其虚拟机磁盘存储为 `%LOCALAPPDATA%\Packages\...` 下的稀疏 VHDX 文件。它会增长，但当你删除文件时不会自动收缩。要回收空间：`wsl --shutdown`，然后以管理员身份运行 PowerShell，执行 `Optimize-VHD -Path <ext4.vhdx 文件路径> -Mode Full`（需要 Hyper-V 工具）——或者使用 WSL 文档中记载的更简单的 `diskpart` 路径。

## 下一步去哪里

- **[安装](/getting-started/installation)** — 实际的安装步骤（Linux/WSL2/Termux 都使用同一个安装程序）。
- **[集成 → 提供商 → WSL2 网络](/integrations/providers#wsl2-networking-windows-users)** — 本地模型服务器的权威网络深度解析。
- **[MCP 指南 → WSL → Windows Chrome](/guides/use-mcp-with-hermes#wsl2-bridge-hermes-in-wsl-to-windows-chrome)** — 从 WSL 中的 Hermes 控制你已登录的 Windows Chrome。
- **[工具网关](/user-guide/features/tool-gateway)** 和 **[Web 仪表板](/user-guide/features/web-dashboard)** — 你最常希望从 WSL 暴露到网络其余部分的长期运行服务。