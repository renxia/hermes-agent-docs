---
title: "Windows (WSL2) 指南"
description: "在 Windows 上通过 WSL2 运行 Hermes 智能体 — 设置、Windows 与 Linux 之间的文件系统访问、网络连接以及常见陷阱"
sidebar_label: "Windows (WSL2)"
sidebar_position: 2
---

# Windows (WSL2) 指南

Hermes 智能体现在支持**原生 Windows** 和 **WSL2** 两种方式。本页面介绍 WSL2 路径；如需原生 PowerShell 安装方式，请参阅专门的 **[Windows (原生) 指南](./windows-native.md)**。

**何时选择 WSL2 而非原生方式：**
- 您希望使用仪表板中嵌入的终端（`/chat` 标签页）——该窗格需要 POSIX PTY，仅 WSL2 支持。
- 您正在进行大量依赖 POSIX 的开发工作，并希望您的 Hermes 会话与开发工具共享相同的文件系统和路径。
- 您已经拥有 WSL2 环境，且不希望维护第二个安装。

**何时原生方式已足够（或更好）：**
- 交互式聊天、网关（Telegram/Discord 等）、定时任务调度器、浏览器工具、MCP 服务器以及大多数 Hermes 功能均可在 Windows 上原生运行。
- 您不想每次引用文件或打开 URL 时都要考虑跨越 WSL↔Windows 的边界。

在 WSL2 中，实际上涉及两台计算机：您的 Windows 主机，以及由 WSL 管理的 Linux 虚拟机。大多数困惑源于无法确定当前处于哪一台计算机上。

本指南涵盖那些特别影响 Hermes 的部分：安装 WSL2、在 Windows 和 Linux 之间来回传输文件、双向网络连接，以及人们实际遇到的陷阱。

:::info 简体中文
本页面上维护了一份简体中文的最小安装路径操作指南 — 请通过**语言**菜单（右上角）选择**简体中文**进行切换。
::>

## 为何选择 WSL2（而非原生 Windows）

原生 Windows 安装直接在 Windows 上运行：使用 Windows 终端（PowerShell、Windows Terminal 等）、Windows 文件系统路径（`C:\Users\…`）以及 Windows 进程。Hermes 使用 Git Bash 来运行 shell 命令，这也是 Claude Code 和其他智能体现在处理 Windows 的方式 — 它绕过了 POSIX 与 Windows 之间的差异，而无需完全重写。

WSL2 在轻量级虚拟机中运行真正的 Linux 内核，因此其中的 Hermes 本质上与在 Ubuntu 上运行相同。当您希望获得真正的 POSIX 环境时，这非常有用：`fork`、`/tmp`、UNIX 套接字、信号语义、基于 PTY 的终端、`bash`/`zsh` 等 shell，以及 `rg`、`git`、`ffmpeg` 等工具的行为方式与在 Linux 上完全一致。

WSL2 的实际影响：

- Hermes CLI、网关、会话、记忆、技能以及工具运行时全部位于 Linux 虚拟机内部。
- Windows 程序（浏览器、原生应用、已登录个人资料的 Chrome）则位于其外部。
- 每当您需要两者通信 — 共享文件、打开 URL、控制 Chrome、访问本地模型服务器、将 Hermes 网关暴露给手机 — 您都需要跨越边界。这些边界正是本指南所关注的内容。

## 安装 WSL2

在 **管理员 PowerShell** 或 Windows 终端中执行：

```powershell
wsl --install
```

在全新的 Windows 10 22H2+ 或 Windows 11 系统上，此命令会安装 WSL2 内核、虚拟机平台功能以及默认的 Ubuntu 发行版。根据提示重启系统。重启后，Ubuntu 将自动启动并提示您输入 Linux 用户名和密码——这是一个**全新的 Linux 用户**，与您的 Windows 账户无关。

请确认您实际运行的是 WSL2（而非旧版 WSL1）：

```powershell
wsl --list --verbose
```

您应看到 `VERSION  2`。如果某个发行版显示为 `VERSION  1`，请将其转换：

```powershell
wsl --set-version Ubuntu 2
wsl --set-default-version 2
```

Hermes 在 WSL1 上无法可靠运行——WSL1 会实时转换 Linux 系统调用，某些行为（如 procfs、信号、网络）与真实 Linux 存在差异。

### 发行版选择

我们测试所基于的是 Ubuntu (LTS)。Debian 可以正常工作。Arch 和 NixOS 也适用于有需求的用户，但单行安装脚本假定使用基于 Debian 的 `apt` 系统——相关路径请参见 [Nix 设置指南](/docs/getting-started/nix-setup)。

### 启用 systemd（推荐）

使用 systemd 可以更轻松地管理 Hermes 网关（以及您希望保持运行的其他任何服务）。在现代 WSL 中，请在您的发行版内部一次性启用它：

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

然后在 PowerShell 中执行：

```powershell
wsl --shutdown
```

重新打开您的 WSL 终端。`ps -p 1 -o comm=` 应输出 `systemd`。

上述 `metadata` 挂载选项非常重要——如果没有它，`/mnt/c/...` 上的文件将无法存储真实的 Linux 权限位，这将导致在 Windows 路径下的脚本上执行 `chmod +x` 等操作失败。

### 在 WSL 内部安装 Hermes

一旦您打开了 WSL2 shell：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
source ~/.bashrc
hermes
```

安装程序将 WSL2 视为普通 Linux——无需任何特定于 WSL 的操作。完整布局请参见 [安装指南](/docs/getting-started/installation)。

## 文件系统：跨越 Windows ↔ WSL2 边界

这是最容易让大多数人困惑的部分。存在**两个文件系统**，您放置文件的位置至关重要——这关系到性能、正确性以及哪些工具能够访问。

### 两个方向

| 方向 | 内部路径 | 您使用的路径 |
|---|---|---|
| Windows 磁盘，从 WSL 可见 | `C:\Users\you\Documents` | `/mnt/c/Users/you/Documents` |
| WSL 磁盘，从 Windows 可见 | `/home/you/code` | `\\wsl$\Ubuntu\home\you\code`（或在较新版本中为 `\\wsl.localhost\Ubuntu\...`） |

两者都是真实的，且都能工作，但它们**不是同一个文件系统**——底层通过 9P 网络协议桥接。这带来了真实的性能和语义上的后果。

### Hermes 和您的项目应放在哪里

**经验法则：将所有类 Linux 内容保留在 Linux 文件系统内部。**

- 您的 Hermes 安装（`~/.hermes/`）——Linux 侧。安装程序已自动完成此操作。
- 您从 WSL 进行开发的 git 仓库——Linux 侧（`~/code/...`、`~/projects/...`）。
- 您的模型、数据集、虚拟环境——Linux 侧。

遵循此规则的好处：

- **快速 I/O。** 对 `/mnt/c/...` 的操作需经过 9P，速度比原生 ext4 慢 10–100 倍。在 `~/code` 下瞬间完成的包含 1 万个文件的仓库的 `git status` 操作，在 `/mnt/c` 下可能需要 15 秒以上。
- **正确的权限。** `/mnt/c` 上的 Linux 权限位是尽力而为的模拟。诸如 `ssh` 因“权限错误”拒绝密钥或 `chmod +x` 静默失败等问题很常见。
- **可靠的文件监视器。** 9P 上的 inotify 不稳定——文件监视器（开发服务器、测试运行器）经常会错过 `/mnt/c` 上的更改。
- **避免大小写敏感性 surprises。** Windows 路径默认不区分大小写；Linux 区分大小写。同时包含 `Readme.md` 和 `README.md` 的项目，其行为取决于您位于哪一侧。

仅当您**需要**文件位于 Windows 侧时，才将其放在 `/mnt/c` 上——例如，您希望从 Windows GUI 应用程序中打开它，或者 Windows Chrome 的 DevTools MCP 要求当前目录是 Windows 可访问的路径。

### 文件往来传输

**从 Windows → 进入 WSL：** 最简单的方法是打开资源管理器并在地址栏中输入 `\\wsl.localhost\Ubuntu`。然后您可以拖放至 `\home\<you>\...`。或从 PowerShell：

```powershell
wsl cp /mnt/c/Users/you/Downloads/file.pdf ~/incoming/
```

**从 WSL → 进入 Windows：** 复制到 `/mnt/c/Users/<you>/...`，它将立即出现在 Windows 资源管理器中：

```bash
cp ~/reports/output.pdf /mnt/c/Users/you/Desktop/
```

**在 Windows 应用程序中打开 WSL 文件**（GUI 编辑器、浏览器等）：使用 `explorer.exe` 或 `wslview`：

```bash
sudo apt install wslu     # 一次即可——提供 wslview、wslpath、wslopen 等工具
wslview ~/reports/output.pdf    # 使用 Windows 默认处理程序打开
explorer.exe .                  # 在 Windows 资源管理器中打开当前 WSL 目录
```

**在两个世界之间转换路径：**

```bash
wslpath -w ~/code/project        # → \\wsl.localhost\Ubuntu\home\you\code\project
wslpath -u 'C:\Users\you'        # → /mnt/c/Users/you
```

### 行尾符、BOM 和 git

如果您使用 Windows 编辑器在 Windows 侧编辑文件，它们可能会获得 `CRLF` 行尾符。当 Linux 侧的 `bash` 或 Python 读取它们时，shell 脚本会因 `bad interpreter: /bin/bash^M` 而中断，Python 也可能因带有 BOM 的 `.env` 文件而失败。

解决方法是在 WSL 内部（而非 Windows 上）设置合理的 git 配置：

```bash
git config --global core.autocrlf input
git config --global core.eol lf
```

对于已包含 CRLF 的文件：

```bash
sudo apt install dos2unix
dos2unix path/to/script.sh
```

### “在 WSL 内部克隆还是在 `/mnt/c` 上克隆？”

在 WSL 内部克隆。除非您有特定理由不这样做，否则始终如此。典型的 Hermes 工作流（`hermes chat`、调用 `rg`/`ripgrep` 搜索仓库的工具、文件监视器、后台网关）在 `~/code/myrepo` 上的性能和可靠性将显著优于 `/mnt/c/Users/you/myrepo`。

一个例外：**启动 Windows 二进制文件的 MCP 桥接。** 如果您通过 `cmd.exe` 使用 `chrome-devtools-mcp`（参见 [MCP 指南：WSL → Windows Chrome](/docs/guides/use-mcp-with-hermes#wsl2-bridge-hermes-in-wsl-to-windows-chrome)），如果 Hermes 的当前工作目录是 `~`，Windows 可能会抱怨 `UNC` 警告。在这种情况下，请从 `/mnt/c/` 下的某个位置启动 Hermes，以便 Windows 进程拥有一个驱动器号形式的当前工作目录。

## 网络：WSL ↔ Windows

WSL2 运行在一个具有自身网络堆栈的轻量级虚拟机中。这意味着 WSL 内部的 `localhost` **与** Windows 上的 `localhost` **不同**——从网络的角度看，它们是两个独立的主机。您需要为每个服务决定流量流向哪个方向，并选择合适的桥接方式。

以下两种情况经常出现。

### 情况 1 — WSL 中的 Hermes 与 Windows 上的服务通信

最常见的情况：您在 Windows 上运行 **Ollama、LM Studio 或 llama-server**，而 WSL 内部的 Hermes 需要访问它。

此问题的权威指南位于提供商指南中：**[WSL2 本地模型网络配置 →](/docs/integrations/providers#wsl2-networking-windows-users)**

简要版本：

- **Windows 11 22H2+：** 启用镜像网络模式（在 `%USERPROFILE%\.wslconfig` 中设置 `networkingMode=mirrored`，然后执行 `wsl --shutdown`）。此后，`localhost` 在两个方向上都可用。
- **Windows 10 或旧版本：** 使用 Windows 主机 IP（WSL 虚拟网络的默认网关），并确保 Windows 上的服务器绑定到 `0.0.0.0`，而不仅仅是 `127.0.0.1`。Windows 防火墙通常还需要为该端口添加规则。

对于完整表格（Ollama / LM Studio / vLLM / SGLang 绑定地址、防火墙规则单行命令、动态 IP 辅助工具、Hyper-V 防火墙 workaround），请参见上述链接——请勿重复。

### 情况 2 — Windows（或您的局域网）上的某物与 WSL 中的 Hermes 通信

这是相反的方向，在其他地方记录较少，但以下场景需要它：

- 从 Windows 浏览器使用 Hermes **Web 仪表板**。
- 从 Windows 侧的工具使用 **API 服务器**（`hermes api`）。
- 测试**消息网关**（Telegram、Discord 等），其中平台会 ping 一个本地 webhook URL——通常您会使用 `cloudflared`/`ngrok` 而不是原始端口转发。

#### 子情况 2a：从 Windows 主机本身

在**启用了镜像模式的 Windows 11 22H2+** 上，无需任何操作。WSL 中绑定到 `0.0.0.0:8080`（甚至 `127.0.0.1:8080`）的进程，可以通过 Windows 浏览器在 `http://localhost:8080` 访问。WSL 会自动将绑定发布回主机。

在 **NAT 模式**（Windows 10 / 旧版 Windows 11）下，WSL2 默认的“localhost 转发”通常会将 Linux 侧的 `127.0.0.1` 绑定转发到 Windows 的 `localhost`，因此使用 `--host 127.0.0.1` 启动的 Hermes 服务通常可以从 Windows 通过 `http://localhost:PORT` 访问。如果不行：

- 在 WSL 内部显式绑定到 `0.0.0.0`。
- 使用 `ip -4 addr show eth0 | grep inet` 查找 WSL 虚拟机的 IP，并从 Windows 访问该 IP。

#### 子情况 2b：从局域网上的另一台设备（手机、平板、另一台 PC）

这才是真正的痛点。流量流向为 **LAN 设备 → Windows 主机 → WSL 虚拟机**，您必须设置这两个跃点：

1. **在 WSL 内部绑定到所有接口。** 监听 `127.0.0.1` 的进程永远无法从虚拟机外部访问。请使用 `0.0.0.0`。

2. **端口转发 Windows → WSL 虚拟机。** 在镜像模式下，这是自动的。在 NAT 模式下，您必须手动为每个端口在管理员 PowerShell 中执行此操作：

   ```powershell
   # 获取 WSL 虚拟机当前的 IP（在 NAT 模式下，每次 WSL 重启都会变化）
   $wslIp = (wsl hostname -I).Trim().Split(' ')[0]

   # 将 Windows 端口 8080 转发至 WSL:8080
   netsh interface portproxy add v4tov4 `
     listenaddress=0.0.0.0 listenport=8080 `
     connectaddress=$wslIp connectport=8080

   # 允许其通过 Windows 防火墙
   New-NetFirewallRule -DisplayName "Hermes WSL 8080" `
     -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
   ```

   后续可使用 `netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=8080` 删除。

3. **将 LAN 设备指向 `http://<windows-lan-ip>:8080`。**

因为在 NAT 模式下，WSL 虚拟机的 IP 每次重启都会漂移，所以一次性规则只能持续到下一次 `wsl --shutdown`。对于任何持久性需求，要么使用镜像模式，要么将端口代理步骤放入 Windows 登录时运行的脚本中。

对于来自云消息提供商的 webhook（Telegram `setWebhook`、Slack 事件等），不要与端口转发斗争——请使用 `cloudflared` 隧道。参见 [webhook 指南](/docs/user-guide/messaging/webhooks)。

## 在 Windows 上长期运行 Hermes 服务

Hermes [工具网关](/docs/user-guide/features/tool-gateway) 和 API 服务器是长期运行的进程。在 WSL2 中，您有几种选择来保持它们运行。

### 在 WSL 内部使用 systemd（推荐）

如果您按照上述设置部分启用了 systemd，`hermes gateway` 和 API 服务器的工作方式与在任何 Linux 机器上相同。使用网关设置向导：

```bash
hermes gateway setup
```

它会提供安装一个 systemd 用户单元，以便在 WSL 启动时网关自动启动。

### 让 WSL 本身在 Windows 登录时启动

WSL 的虚拟机只有在有东西使用它时才会保持活动状态。为了在没有打开终端窗口的情况下保持网关可达，请通过任务计划程序在 Windows 登录时启动一个 WSL 进程：

- **触发器：** 登录时（您的用户）。
- **操作：** 启动程序
  - 程序：`C:\Windows\System32\wsl.exe`
  - 参数：`-d Ubuntu --exec /bin/sh -c "sleep infinity"`

这可以保持虚拟机活动，以便 systemd 管理的网关保持运行。在 Windows 11 上，较新的 `wsl --install --no-launch` + 自动启动流程也有效；`sleep infinity` 技巧是便携式版本。

## GPU 透传（本地模型）

WSL2 自 WSL 内核 5.10.43+ 起原生支持 **NVIDIA** GPU —— 在 Windows 上安装标准的 NVIDIA 驱动程序（**不要**在 WSL 内部安装 Linux NVIDIA 驱动程序），WSL 内部的 `nvidia-smi` 将能够看到 GPU。从那里开始，CUDA 工具包、`torch`、`vllm`、`sglang` 和 `llama-server` 可以像往常一样针对真实 GPU 进行构建。

WSL2 内部的 AMD ROCm 和 Intel Arc 支持仍在发展中，并且不在 Hermes 的测试范围内 —— 它可能适用于当前驱动程序，但我们没有推荐的方案。

如果您正在运行一个**Windows 原生**的本地模型服务器（Windows 版 Ollama、LM Studio），它已经通过 Windows 驱动程序使用您的 GPU，则根本不需要 WSL GPU 透传 —— 只需遵循上述情况 1，并从 WSL 通过网络访问它。

## 常见陷阱

**连接到我在 Windows 上托管的 Ollama / LM Studio 时出现“连接被拒绝”。**
请参阅 [WSL2 网络](/docs/integrations/providers#wsl2-networking-windows-users)。百分之九十的情况下，服务器绑定到 `127.0.0.1` 并需要 `0.0.0.0`（Ollama：`OLLAMA_HOST=0.0.0.0`），或者您缺少防火墙规则。

**在仓库中执行 `git status` / `hermes chat` 时速度极慢。**
您可能正在 `/mnt/c/...` 下工作。将仓库移动到 `~/code/...`（Linux 侧）。速度会快几个数量级。

**脚本出现 `bad interpreter: /bin/bash^M` 错误。**
这是来自 Windows 编辑器的 CRLF 行尾。使用 `dos2unix script.sh`，并在您的 WSL git 配置中设置 `core.autocrlf input`。

**通过 MCP 启动的 Windows 二进制文件出现“不支持 UNC 路径”警告。**
Hermes 的当前工作目录位于 Linux 文件系统内部，而 Windows `cmd.exe` 不知道如何处理它。在该会话中从 `/mnt/c/...` 启动 Hermes，或者使用一个包装器，在调用 Windows 可执行文件之前 `cd` 到一个 Windows 可访问的路径。

**睡眠/休眠后时钟漂移。**
WSL2 的时钟在主机从睡眠中恢复后可能会滞后几分钟，这会破坏任何基于证书的操作（OAuth、HTTPS API）。按需修复：

```bash
sudo hwclock -s
```

或者在登录时安装 `ntpdate` 并运行它。

**启用镜像模式后或连接 VPN 时 DNS 停止工作。**
镜像模式将主机网络设置代理到 WSL —— 如果 Windows DNS 有问题（VPN 分流、企业解析器），WSL 会继承该问题。解决方法：手动覆盖 `resolv.conf`（在 `/etc/wsl.conf` 中设置 `generateResolvConf=false`，然后使用 `1.1.1.1` 或您的 VPN 的 DNS 编写您自己的 `/etc/resolv.conf`）。

**运行安装程序后找不到 `hermes`。**
安装程序通过 `~/.bashrc` 将 `~/.local/bin` 添加到 shell 的 PATH。您需要 `source ~/.bashrc`（或打开新终端）才能使其在当前会话中生效。

**Windows Defender 对 WSL 文件扫描速度慢。**
当从 Windows 访问时，Defender 通过 9P 桥接扫描文件，这会加剧 `/mnt/c` 风格的跨边界访问的缓慢。如果您仅从 WSL 内部接触 WSL 文件，这无关紧要。如果您频繁使用 Windows 工具访问 `\\wsl$\...`，请考虑将 WSL 发行版路径从实时扫描中排除。

**磁盘空间不足。**
WSL2 将其虚拟机磁盘存储为 `%LOCALAPPDATA%\Packages\...` 下的稀疏 VHDX。它会增长，但在您删除文件时不会自动收缩。要回收空间：`wsl --shutdown`，然后从管理员 PowerShell 运行 `Optimize-VHD -Path <path-to-ext4.vhdx> -Mode Full`（需要 Hyper-V 工具）—— 或者按照 WSL 文档中记录的更简单的 `diskpart` 路径操作。

## 接下来去哪里

- **[安装](/docs/getting-started/installation)** —— 实际安装步骤（Linux/WSL2/Termux 都使用相同的安装程序）。
- **[集成 → 提供者 → WSL2 网络](/docs/integrations/providers#wsl2-networking-windows-users)** —— 本地模型服务器的权威网络深入指南。
- **[MCP 指南 → WSL → Windows Chrome](/docs/guides/use-mcp-with-hermes#wsl2-bridge-hermes-in-wsl-to-windows-chrome)** —— 从 WSL 中的 Hermes 控制您已登录的 Windows Chrome。
- **[工具网关](/docs/user-guide/features/tool-gateway)** 和 **[Web 仪表板](/docs/user-guide/features/web-dashboard)** —— 您最常希望从 WSL 暴露到网络其余部分的长期运行服务。