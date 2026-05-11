---
title: "Windows (WSL2) 指南"
description: "通过 WSL2 在 Windows 上运行 Hermes 智能体 — 设置、Windows 与 Linux 之间的文件系统访问、网络配置及常见问题"
sidebar_label: "Windows (WSL2)"
sidebar_position: 2
---

# Windows (WSL2) 指南

Hermes 智能体现在同时支持原生 Windows 和 WSL2。本页介绍 WSL2 方式；如需原生 PowerShell 安装，请参阅专门的 **[Windows（原生）指南](./windows-native.md)**。

**何时选择 WSL2 而非原生方式：**
- 你想使用仪表盘内嵌的终端（`/chat` 选项卡）——该面板需要 POSIX PTY，仅支持 WSL2。
- 你从事大量 POSIX 开发工作，希望 Hermes 会话与开发工具共享相同的文件系统/路径。
- 你已有 WSL2 环境，不想再维护另一套安装。

**何时原生方式即可（甚至更优）：**
- 交互式聊天、网关（Telegram/Discord 等）、定时任务调度器、浏览器工具、MCP 服务器以及大多数 Hermes 功能均可在 Windows 上原生运行。
- 你不想每次引用文件或打开 URL 时都要考虑 WSL↔Windows 之间的边界问题。

在 WSL2 中，实际上涉及两台计算机：你的 Windows 主机和由 WSL 管理的 Linux 虚拟机。大多数困惑来自于不确定自己当前处于哪一方。

本指南涵盖影响 Hermes 的关键方面：安装 WSL2、在 Windows 和 Linux 之间传输文件、双向网络配置，以及用户常遇到的问题。

:::info 简体中文
同一页面上维护了最小安装路径的中文教程——请通过右上角的 **language** 菜单切换，选择 **简体中文**。
:::

## 为何选择 WSL2（对比原生 Windows）

原生 Windows 安装直接在 Windows 中运行：使用 Windows 终端（PowerShell、Windows Terminal 等）、Windows 文件系统路径（`C:\Users\…`）和 Windows 进程。Hermes 使用 Git Bash 来执行 shell 命令，这也是 Claude Code 和其他智能体目前处理 Windows 的方式——无需完全重写即可绕过 POSIX 与 Windows 的差异。

WSL2 在轻量级虚拟机中运行真正的 Linux 内核，因此其中的 Hermes 本质上与在 Ubuntu 上运行完全相同。当你需要真正的 POSIX 环境时，这非常有价值：`fork`、`/tmp`、UNIX 套接字、信号语义、基于 PTY 的终端、`bash`/`zsh` 等 shell，以及 `rg`、`git`、`ffmpeg` 等工具，它们的行为与在 Linux 上完全一致。

WSL2 的实际影响：

- Hermes CLI、网关、会话、记忆、技能和工具运行时都位于 Linux 虚拟机内部。
- Windows 程序（浏览器、原生应用、已登录个人资料的 Chrome）位于虚拟机外部。
- 每当你需要让两者通信——共享文件、打开 URL、控制 Chrome、访问本地模型服务器、将 Hermes 网关暴露给手机——都需要跨越边界。这些边界正是本指南的核心内容。

## 安装 WSL2

在 **管理员 PowerShell** 或 Windows 终端中：

```powershell
wsl --install
```

在全新的 Windows 10 22H2+ 或 Windows 11 系统上，这将安装 WSL2 内核、虚拟机平台功能和一个默认的 Ubuntu 发行版。按提示重启。重启后 Ubuntu 将打开并要求设置 Linux 用户名和密码——这是一个**新的 Linux 用户**，与你的 Windows 账户无关。

验证你确实使用的是 WSL2（而不是旧版 WSL1）：

```powershell
wsl --list --verbose
```

你应该看到 `VERSION  2`。如果某个发行版显示 `VERSION  1`，将其转换：

```powershell
wsl --set-version Ubuntu 2
wsl --set-default-version 2
```

Hermes 在 WSL1 上无法可靠运行——WSL1 会动态转换 Linux 系统调用，一些行为（procfs、信号、网络）与真实 Linux 存在差异。

### 发行版选择

Ubuntu (LTS) 是我们测试的发行版。Debian 也可以。Arch 和 NixOS 对于想要使用它们的人也适用，但一键安装程序假设使用基于 Debian 的 `apt` 系统——有关该路径，请参见 [Nix 设置指南](/docs/getting-started/nix-setup)。

### 启用 systemd（推荐）

hermes 网关（以及你希望保持运行的其他服务）使用 systemd 管理更为方便。在现代 WSL 中，在发行版内部启用一次即可：

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

重新打开你的 WSL 终端。`ps -p 1 -o comm=` 应该输出 `systemd`。

上面的 `metadata` 挂载选项很重要——如果没有它，`/mnt/c/...` 上的文件无法存储真实的 Linux 权限位，这会导致在 Windows 路径下对脚本执行 `chmod +x` 等操作失效。

### 在 WSL 内安装 Hermes

打开 WSL2 shell 后：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
source ~/.bashrc
hermes
```

安装程序将 WSL2 视为普通 Linux——不需要 WSL 特定的任何操作。完整布局请参见 [安装](/docs/getting-started/installation)。

## 文件系统：跨越 Windows ↔ WSL2 边界

这是最让人困惑的部分。存在**两个文件系统**，你把文件放在哪里很重要——这关系到性能、正确性以及哪些工具可以访问。

### 两个方向

| 方向 | 内部路径 | 你使用的路径 |
|---|---|---|
| Windows 磁盘，从 WSL 中查看 | `C:\Users\you\Documents` | `/mnt/c/Users/you/Documents` |
| WSL 磁盘，从 Windows 中查看 | `/home/you/code` | `\\wsl$\Ubuntu\home\you\code`（或较新版本上的 `\\wsl.localhost\Ubuntu\...`） |

两者都是真实的，都有效，但它们**不是同一个文件系统**——底层通过 9P 网络协议桥接。这会带来实际的性能和语义差异。

### 将 Hermes 和你的项目放在哪里

**经验法则：将所有 Linux 相关的内容都放在 Linux 文件系统内。**

- 你的 Hermes 安装（`~/.hermes/`）——放在 Linux 侧。安装程序已经这样做了。
- 你从 WSL 中操作的 git 仓库——放在 Linux 侧（`~/code/...`、`~/projects/...`）。
- 你的模型、数据集、虚拟环境——放在 Linux 侧。

遵循此规则你将获得：

- **快速 I/O。** 对 `/mnt/c/...` 的操作会经过 9P，比原生 ext4 慢 10-100 倍。在 `~/code` 下感觉瞬间完成的 1 万文件仓库的 `git status`，在 `/mnt/c` 下可能需要 15 秒以上。
- **正确的权限。** Linux 权限位在 `/mnt/c` 上是尽力而为的模拟。像 `ssh` 拒绝权限过低的密钥或 `chmod +x` 静默失败等情况很常见。
- **可靠的文件监视。** 通过 9P 的 inotify 不稳定——文件监视器（开发服务器、测试运行器）通常会遗漏 `/mnt/c` 上的更改。
- **无大小写敏感性问题。** Windows 路径默认不区分大小写；Linux 区分大小写。同时包含 `Readme.md` 和 `README.md` 的项目在不同侧的行为会不同。

仅当你**需要**文件存在于 Windows 侧时，才将内容放在 `/mnt/c` 上——例如，你想从 Windows GUI 应用程序打开它，或 Windows Chrome 的 DevTools MCP 需要当前目录是 Windows 可访问的路径。

### 文件来回传输

**从 Windows → 进入 WSL：** 最简单的方法是打开文件资源管理器，在地址栏输入 `\\wsl.localhost\Ubuntu`。然后你可以将其拖放到 `\home\<you>\...`。或者在 PowerShell 中：

```powershell
wsl cp /mnt/c/Users/you/Downloads/file.pdf ~/incoming/
```

**从 WSL → 进入 Windows：** 复制到 `/mnt/c/Users/<you>/...`，它会立即出现在 Windows 资源管理器中：

```bash
cp ~/reports/output.pdf /mnt/c/Users/you/Desktop/
```

**在 Windows 应用中打开 WSL 文件**（GUI 编辑器、浏览器等）：使用 `explorer.exe` 或 `wslview`：

```bash
sudo apt install wslu     # 安装一次——提供 wslview, wslpath, wslopen 等命令
wslview ~/reports/output.pdf    # 使用 Windows 默认处理程序打开
explorer.exe .                  # 在 Windows 资源管理器中打开当前 WSL 目录
```

**在两个世界之间转换路径：**

```bash
wslpath -w ~/code/project        # → \\wsl.localhost\Ubuntu\home\you\code\project
wslpath -u 'C:\Users\you'        # → /mnt/c/Users/you
```

### 行尾符、BOM 和 git

如果你在 Windows 侧使用 Windows 编辑器编辑文件，它们可能会使用 `CRLF` 行尾。当 Linux 侧的 `bash` 或 Python 读取它们时，shell 脚本会因 `bad interpreter: /bin/bash^M` 而中断，Python 在处理带 BOM 的 `.env` 文件时也可能失败。

解决方法是在 WSL 内（不是在 Windows 上）配置一个合理的 git：

```bash
git config --global core.autocrlf input
git config --global core.eol lf
```

对于已经存在 CRLF 的文件：

```bash
sudo apt install dos2unix
dos2unix path/to/script.sh
```

### "在 WSL 内还是 `/mnt/c` 上克隆？"

始终在 WSL 内克隆，除非你有特定理由不这样做。典型的 Hermes 工作流程（`hermes chat`、使用 `rg`/`ripgrep` 搜索仓库的工具调用、文件监视器、后台网关）在 `~/code/myrepo` 上运行会比在 `/mnt/c/Users/you/myrepo` 上快得多且可靠得多。

一个例外：**启动 Windows 二进制文件的 MCP 桥接器。** 如果你通过 `cmd.exe` 使用 `chrome-devtools-mcp`（参见 [MCP 指南：WSL → Windows Chrome](/docs/guides/use-mcp-with-hermes#wsl2-bridge-hermes-in-wsl-to-windows-chrome)），当 Hermes 的当前工作目录是 `~` 时，Windows 可能会报 `UNC` 警告。在这种情况下，从 `/mnt/c/` 下的某个位置启动 Hermes，以便 Windows 进程有一个驱动器号的当前工作目录。

## 网络：WSL ↔ Windows

WSL2 在一个带有自己网络栈的轻量级虚拟机中运行。这意味着 WSL 内部的 `localhost` 与 Windows 上的 `localhost` **不同**——从网络角度看，它们是两个独立的主机。你需要为每个服务决定流量的方向并选择正确的桥接方式。

有两种情况经常出现。

### 情况 1 — WSL 中的 Hermes 与 Windows 上的服务通信

最常见的情况是：你正在 Windows 上运行 **Ollama、LM Studio 或 llama-server**，而 Hermes（在 WSL 内部）需要访问它。

相关的权威指南位于提供商指南中：**[WSL2 本地模型网络设置 →](/docs/integrations/providers#wsl2-networking-windows-users)**

简短版本：

- **Windows 11 22H2+：** 启用镜像网络模式（在 `%USERPROFILE%\.wslconfig` 中设置 `networkingMode=mirrored`，然后执行 `wsl --shutdown`）。这样 `localhost` 在两个方向都可以工作。
- **Windows 10 或更早版本：** 使用 Windows 主机 IP（WSL 虚拟网络的默认网关），并确保 Windows 上的服务器绑定到 `0.0.0.0`，而不仅仅是 `127.0.0.1`。Windows 防火墙通常也需要为该端口设置规则。

完整表格（Ollama / LM Studio / vLLM / SGLang 绑定地址、防火墙规则单行命令、动态 IP 帮助程序、Hyper-V 防火墙变通方法），请参见上述链接——此处不重复。

### 情况 2 — Windows 上（或你的局域网中）的某个程序与 WSL 中的 Hermes 通信

这是反向方向，在其他地方记录较少，但这是你需要用于：

- 从 Windows 浏览器使用 Hermes **Web 仪表盘**。
- 从 Windows 侧工具使用 **OpenAI 兼容 API 服务器**（由 `hermes gateway` 在 `API_SERVER_ENABLED=true` 时暴露）。参见 [API 服务器功能页面](/docs/user-guide/features/api-server)。
- 测试**消息网关**（Telegram、Discord 等），其中平台会 ping 一个本地 webhook URL——通常你会使用 `cloudflared`/`ngrok` 而不是原始的端口转发。

#### 子情况 2a：从 Windows 主机本身

在 **启用了镜像模式的 Windows 11 22H2+** 上，无需任何操作。WSL 中绑定到 `0.0.0.0:8080`（甚至 `127.0.0.1:8080`）的进程可以从 Windows 浏览器通过 `http://localhost:8080` 访问。WSL 会自动将绑定发布回主机。

在 **NAT 模式**（Windows 10 / 旧版 Windows 11）下，WSL2 中的默认“localhost 转发”通常会将 Linux 侧的 `127.0.0.1` 绑定转发到 Windows 的 `localhost`，因此使用 `--host 127.0.0.1` 启动的 Hermes 服务通常可以通过 Windows 的 `http://localhost:PORT` 访问。如果不行：

- 在 WSL 内部明确绑定到 `0.0.0.0`。
- 使用 `ip -4 addr show eth0 | grep inet` 找到 WSL 虚拟机的 IP，并从 Windows 访问它。

#### 子情况 2b：从局域网中的另一台设备（手机、平板电脑、其他电脑）

这是真正的麻烦。流量路径为 **局域网设备 → Windows 主机 → WSL 虚拟机**，你必须设置好两个环节：

1.  **在 WSL 内部绑定到所有接口。** 监听 `127.0.0.1` 的进程永远无法从虚拟机外部访问。使用 `0.0.0.0`。

2.  **将 Windows 端口转发到 WSL 虚拟机。** 在镜像模式下这是自动的。在 NAT 模式下，你需要在管理员 PowerShell 中手动为每个端口进行设置：

    ```powershell
    # 获取 WSL 虚拟机的当前 IP（在 NAT 模式下，每次 WSL 重启都会改变）
    $wslIp = (wsl hostname -I).Trim().Split(' ')[0]

    # 将 Windows 端口 8080 转发到 WSL:8080
    netsh interface portproxy add v4tov4 `
      listenaddress=0.0.0.0 listenport=8080 `
      connectaddress=$wslIp connectport=8080

    # 允许通过 Windows 防火墙
    New-NetFirewallRule -DisplayName "Hermes WSL 8080" `
      -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
    ```

    稍后使用 `netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=8080` 删除。

3.  **将局域网设备指向 `http://<windows-lan-ip>:8080`。**

因为在 NAT 模式下，WSL 虚拟机的 IP 在每次重启后都会漂移，所以一次性规则只能维持到下次 `wsl --shutdown`。对于任何持久性的需求，要么使用镜像模式，要么将端口代理步骤放在一个 Windows 登录时运行的脚本中。

对于来自云消息提供商（Telegram `setWebhook`、Slack 事件等）的 webhook，不要与端口转发斗争——使用 `cloudflared` 隧道。参见 [webhooks 指南](/docs/user-guide/messaging/webhooks)。

## 在 Windows 上长期运行 Hermes 服务

Hermes [工具网关](/docs/user-guide/features/tool-gateway) 和 API 服务器是长期运行的进程。在 WSL2 中，您有几种方法可以保持它们运行。

### 在 WSL 内使用 systemd（推荐）

如果您按照上述设置部分启用了 systemd，`hermes gateway` 和 API 服务器将像在任何 Linux 机器上一样工作。使用网关设置向导：

```bash
hermes gateway setup
```

它将提供安装一个 systemd 用户单元，以便网关在 WSL 启动时自动运行。

### 让 WSL 本身在 Windows 登录时启动

WSL 的虚拟机只在有东西使用时才保持存活。为了在没有终端窗口打开时保持您的网关可访问，请通过任务计划程序在 Windows 登录时启动一个 WSL 进程：

- **触发器：** 登录时（您的用户）。
- **操作：** 启动程序
  - 程序：`C:\Windows\System32\wsl.exe`
  - 参数：`-d Ubuntu --exec /bin/sh -c "sleep infinity"`

这将保持虚拟机存活，以便由 systemd 管理的网关持续运行。在 Windows 11 上，较新的 `wsl --install --no-launch` + 自动启动流程也可以工作；`sleep infinity` 技巧是便携版本。

## GPU 直通（本地模型）

自 WSL 内核 5.10.43+ 起，WSL2 原生支持 **NVIDIA** GPU — 在 Windows 上安装标准 NVIDIA 驱动程序（**不要**在 WSL 内部安装 Linux 版 NVIDIA 驱动），然后在 WSL 内运行 `nvidia-smi` 就能看到 GPU。之后，CUDA 工具包、`torch`、`vllm`、`sglang` 和 `llama-server` 将像往常一样针对实际 GPU 进行构建。

WSL2 内对 AMD ROCm 和 Intel Arc 的支持仍在发展中，且不在 Hermes 的测试范围内——它可能在当前驱动下工作，但我们没有推荐的具体方案。

如果您运行的是 **Windows 原生** 的本地模型服务器（如 Windows 版 Ollama、LM Studio），该服务器已通过 Windows 驱动程序使用您的 GPU，那么您根本不需要 WSL GPU 直通——只需按照上面的案例 1 操作，并从 WSL 通过网络访问它即可。

## 常见陷阱

**连接到我的 Windows 托管的 Ollama/LM Studio 时出现 "Connection refused"。**
参见 [WSL2 网络](/docs/integrations/providers#wsl2-networking-windows-users)。百分之九十的情况是服务器绑定到了 `127.0.0.1`，需要改为 `0.0.0.0`（Ollama: `OLLAMA_HOST=0.0.0.0`），或者您缺少防火墙规则。

**在仓库中执行 `git status` / `hermes chat` 时极其缓慢。**
您可能正在 `/mnt/c/...` 路径下工作。将仓库移动到 `~/code/...`（Linux 侧）。速度会快一个数量级。

**脚本出现 `bad interpreter: /bin/bash^M` 错误。**
来自 Windows 编辑器的 CRLF 换行符。使用 `dos2unix script.sh`，并在您的 WSL git 配置中设置 `core.autocrlf input`。

**通过 MCP 启动的 Windows 二进制文件提示 "UNC paths are not supported" 警告。**
Hermes 的当前工作目录位于 Linux 文件系统内，而 Windows 的 `cmd.exe` 不知道如何处理它。对于该会话，请从 `/mnt/c/...` 路径启动 Hermes，或者使用一个包装脚本，在调用 Windows 可执行文件之前先 `cd` 到一个 Windows 可达的路径。

**休眠/睡眠后时钟漂移。**
WSL2 的时钟在主机从睡眠恢复后可能会滞后数分钟，这会破坏任何基于证书的认证（OAuth、HTTPS API）。按需修复：

```bash
sudo hwclock -s
```

或者安装 `ntpdate` 并在登录时运行它。

**启用镜像模式或连接 VPN 后 DNS 停止工作。**
镜像模式会将主机网络设置代理到 WSL 中——如果 Windows 的 DNS 有问题（VPN 分割隧道、公司解析器），WSL 会继承这个问题。解决方法：手动覆盖 `resolv.conf`（在 `/etc/wsl.conf` 中设置 `generateResolvConf=false`，然后用 `1.1.1.1` 或您 VPN 的 DNS 编写您自己的 `/etc/resolv.conf`）。

**运行安装程序后找不到 `hermes`。**
安装程序会通过 `~/.bashrc` 将 `~/.local/bin` 添加到您 shell 的 PATH 中。您需要执行 `source ~/.bashrc`（或打开一个新终端）才能在当前会话中生效。

**Windows Defender 在 WSL 文件上运行缓慢。**
Defender 通过 9P 桥扫描文件，当从 Windows 访问时，这放大了 `/mnt/c` 这种跨边界访问的缓慢程度。如果您只在 WSL 内部操作 WSL 文件，这无关紧要。如果您经常使用 Windows 工具操作 `\\wsl$\...`，考虑将 WSL 发行版路径从实时扫描中排除。

**磁盘空间不足。**
WSL2 将其虚拟机磁盘存储为 `%LOCALAPPDATA%\Packages\...` 下的稀疏 VHDX 文件。它会增长，但在您删除文件时不会自动收缩。要回收空间：`wsl --shutdown`，然后以管理员身份运行 PowerShell 执行 `Optimize-VHD -Path <path-to-ext4.vhdx> -Mode Full`（需要 Hyper-V 工具）——或者按照 WSL 文档中记录的更简单的 `diskpart` 路径操作。

## 下一步去哪里

- **[安装](/docs/getting-started/installation)** — 实际的安装步骤（Linux/WSL2/Termux 都使用同一个安装程序）。
- **[集成 → 提供者 → WSL2 网络](/docs/integrations/providers#wsl2-networking-windows-users)** — 针对本地模型服务器的权威网络深入探讨。
- **[MCP 指南 → WSL → Windows Chrome](/docs/guides/use-mcp-with-hermes#wsl2-bridge-hermes-in-wsl-to-windows-chrome)** — 从 WSL 中的 Hermes 控制您已登录的 Windows Chrome。
- **[工具网关](/docs/user-guide/features/tool-gateway)** 和 **[Web 仪表板](/docs/user-guide/features/web-dashboard)** — 您最常希望从 WSL 暴露到网络其余部分的长期运行服务。