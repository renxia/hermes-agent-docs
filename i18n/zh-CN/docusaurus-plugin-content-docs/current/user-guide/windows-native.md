---
title: "Windows (原生) 指南"
description: "在 Windows 10 / 11 上原生运行 Hermes 智能体 — 安装、功能矩阵、UTF-8 控制台、Git Bash、作为计划任务的网关、编辑器处理、PATH、卸载和常见陷阱"
sidebar_label: "Windows (原生)"
sidebar_position: 3
---

# Windows (原生) 指南

Hermes 在 Windows 10 和 Windows 11 上原生运行 — 不需要 WSL，不需要 Cygwin，也不需要 Docker。本页面是深入解析：哪些功能原生可用，哪些是 WSL 独有的，安装程序实际做了什么，以及你可能需要调整的特定于 Windows 的设置项。

如果你只是想安装，[着陆页](/)[/](https://example.com/) 或 [安装页面](../getting-started/installation#windows-native-powershell) 上的单行命令就是你需要的一切。当遇到任何意想不到的情况时，再回来查看本指南。

:::tip 想要使用 WSL 吗？
如果你偏好一个真正的 POSIX 环境（例如仪表板嵌入式终端、`fork` 语义、Linux 风格的文件监视器等），请参阅 **[Windows (WSL2) 指南](./windows-wsl-quickstart.md)**。两者可以干净地共存：原生数据存储在 `%LOCALAPPDATA%\hermes` 下，WSL 数据存储在 `~/.hermes` 下。
:::

## 快速安装

打开 **PowerShell**（或 Windows Terminal）并运行：

```powershell
iex (irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1)
```

无需管理员权限。安装程序会将文件放入 `%LOCALAPPDATA%\hermes\`，并将 `hermes` 添加到你的 **用户 PATH** 中 — 完成后请打开一个新的终端。

**安装程序选项** (需要使用脚本块形式来传递参数):

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1))) -NoVenv -SkipSetup -Branch main
```

| 参数 | 默认值 | 用途 |
|---|---|---|
| `-Branch` | `main` | 克隆特定的分支（对于测试 PRs 非常有用） |
| `-Commit` | unset | 将安装固定到特定的提交 SHA（覆盖 `-Branch`） |
| `-Tag` | unset | 将安装固定到特定的 git 标签（例如 `v0.14.0`） |
| `-NoVenv` | off | 跳过 venv 创建（高级功能 — 你自己管理 Python） |
| `-SkipSetup` | off | 跳过安装后的 `hermes setup` 向导 |
| `-HermesHome` | `%LOCALAPPDATA%\hermes` | 覆盖数据目录 |
| `-InstallDir` | `%LOCALAPPDATA%\hermes\hermes-agent` | 覆盖代码位置 |

该安装程序会自动重试不稳定的 git 拉取操作，并从任何下载的 `install.ps1` 有效载荷中剥离 BOM（字节顺序标记），因此即使在 HTTP 传输过程中捕获到的 UTF-8 BOM 也不会破坏 `[scriptblock]::Create((irm ...))` 形式。

### 桌面安装程序（替代方案）

还有一个轻量级的 GUI 安装程序可用 — 如果你宁愿双击一个 `.exe` 而不是打开 PowerShell，它会很有用。下载 Hermes Desktop，运行安装程序，首次启动时该 GUI 会在后台调用 `install.ps1` 来配置 Python（通过 `uv`）、Node、PortableGit 以及下文描述的其余依赖项引导。首次运行后，桌面应用程序和使用 PowerShell 安装的 `hermes` CLI 将共享同一个 `%LOCALAPPDATA%\hermes\hermes-agent` 安装目录和 `%LOCALAPPDATA%\hermes` 数据目录 — 可以在 GUI 和 CLI 之间自由切换。

当你想要获得熟悉的 Windows 安装体验或将 Hermes 交给非开发者使用时，请使用桌面安装程序；当你已经在终端中时，请使用 PowerShell 单行命令。

### 依赖项引导（`dep_ensure`）

在首次启动（以及检测到缺少工具时按需执行），Hermes 会运行一个小的 Python 引导程序 — `hermes_cli/dep_ensure.py` — 该程序会检查并惰性安装它所需的非 Python 依赖项。在 Windows 上，相关的依赖项包括：

| 依赖项 | Hermes 需要它的原因 |
|---|---|
| **PortableGit** | 为终端工具提供 `bash.exe` 和用于会话内克隆的 `git`。在安装时配置，而不是由 `dep_ensure` 完成。 |
| **Node.js 22** | 用于浏览器工具（`agent-browser`）、TUI 的 Web 桥接和 WhatsApp 桥接所必需。 |
| **ffmpeg** | TTS / 语音消息的音频格式转换。 |
| **ripgrep** | 快速文件搜索 — 如果不可用，则回退到 `grep`。 |
| **npm 包** | `agent-browser`、Playwright Chromium 和任何特定工具集所需的 Node 依赖项，在首次使用浏览器工具时安装一次。 |

每个依赖项都有一个类似 `shutil.which(...)` 的检查；如果缺少二进制文件且运行是交互式的，`dep_ensure` 会提供安装它的选项（将实际的安装逻辑委托给 `scripts\install.ps1 -ensure <dep>`）。非交互式运行（网关、定时任务、无头桌面启动）会跳过提示，而是显示一个清晰的 `this feature needs <dep>` 错误。

## 安装程序实际做了什么

从上到下，按顺序排列：

1. **引导 `uv`** — Astral 的快速 Python 管理器。安装在 `%USERPROFILE%\.local\bin`。
2. **通过 `uv` 安装 Python 3.11**。无需现有 Python。
3. **安装 Node.js 22**（如果可用则使用 winget，否则下载一个解压到 `%LOCALAPPDATA%\hermes\node` 的便携式 Node tarball）。用于浏览器工具和 WhatsApp 网桥。
4. **安装便携式 Git** — 如果 `git` 已经在 PATH 中，安装程序就会使用它；否则，它会将一个精简的、自包含的 **PortableGit**（约 45 MB，来自官方 `git-for-windows` 版本）下载到 `%LOCALAPPDATA%\hermes\git`。无需管理员权限，不需要 Windows 安装程序注册表，不会与箱内其他任何内容产生干扰。
5. **克隆仓库** 到 `%LOCALAPPDATA%\hermes\hermes-agent` 并在其内部创建一个虚拟环境。
6. **分级式 `uv pip install`** — 首先尝试 `.[all]`，如果一个 `git+https` 依赖项因 GitHub 的限速而失败，则逐步回退到更小的集合（`[messaging,dashboard,ext]` → `[messaging]` → `.`）。这可以防止“单一故障导致降级为裸安装”的失败模式。
7. **自动安装基于 `.env` 的消息传递 SDK** — 如果存在 `TELEGRAM_BOT_TOKEN` / `DISCORD_BOT_TOKEN` / `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` / `WHATSAPP_ENABLED`，则运行 `python -m ensurepip --upgrade` 和有针对性的 `pip install` 调用，确保每个平台的 SDK 都可以被导入。
8. **设置 `HERMES_GIT_BASH_PATH`** 为解析后的 `bash.exe`，以便 Hermes 在新的 shell 中确定性地找到它。
9. **将 `%LOCALAPPDATA%\hermes\hermes-agent\venv\Scripts` 添加到用户 PATH 并设置 `HERMES_HOME=%LOCALAPPDATA%\hermes`** — 允许您打开新终端后使用 `hermes` 命令（并将其指向您的数据目录）。
10. **运行 `hermes setup`** — 标准的首次运行向导（模型、提供者、工具集）。使用 `-SkipSetup` 跳过。

:::tip Windows 上跳过提供者搜索
在 Windows 上，每个工具的 API 密钥设置（Firecrawl、FAL、浏览器使用、OpenAI TTS）是获取一个有用智能体的最高摩擦点。Nous Portal 的订阅涵盖了模型**和**所有这些工具，只需一次 OAuth 登录即可。安装程序完成后，运行 `hermes setup --portal` 来连接所有内容。
:::

## 功能矩阵

除了仪表板的嵌入式终端面板外，其他功能均在 Windows 上原生运行。

| 功能 | Native Windows | WSL2 |
|---|---|---|
| CLI (`hermes chat`, `hermes setup`, `hermes gateway`, …) | ✓ | ✓ |
| 交互式 TUI (`hermes --tui`) | ✓ | ✓ |
| 消息传递网关（Telegram, Discord, Slack, WhatsApp, 15+ 平台） | ✓ | ✓ |
| Cron 调度器 | ✓ | ✓ |
| 浏览器工具（通过 Node 的 Chromium） | ✓ | ✓ |
| MCP 服务器（stdio 和 HTTP） | ✓ | ✓ |
| 本地 Ollama / LM Studio / llama-server | ✓ | ✓ (通过 WSL 网络) |
| Web 仪表板（会话、任务、指标、配置） | ✓ | ✓ |
| 仪表板 `/chat` 嵌入式终端面板 | ✗ (需要 POSIX PTY) | ✓ |
| 登录时自动启动 | ✓ (schtasks) | ✓ (systemd) |

仪表板的 `/chat` 标签页是通过 POSIX PTY (`ptyprocess`) 嵌入了一个真实的终端。原生 Windows 没有等效的原语；Python 的 `pywinpty` / Windows ConPTY 可以实现，但这是一个单独的实现——请将其视为未来工作。**仪表板的其他部分均原生运行**——只有那个标签页会显示“需要使用 WSL2”的横幅。

## Hermes 在 Windows 上运行 Shell 命令的方式

Hermes 的终端工具通过 **Git Bash** 运行命令，这与 Claude Code 使用的策略相同。这避免了 POSIX 与 Windows 之间的差距，而无需重写每个工具。

`bash.exe` 的解析顺序：

1. 如果设置了 `HERMES_GIT_BASH_PATH` 环境变量。
2. `%LOCALAPPDATA%\hermes\git\usr\bin\bash.exe`（安装程序管理的便携式 Git）。
3. `%LOCALAPPDATA%\hermes\git\bin\bash.exe`（较旧的 Git-for-Windows 布局）。
4. 系统级的 Git-for-Windows 安装（`%ProgramFiles%\Git\bin\bash.exe` 等）。
5. MSYS2、Cygwin 或 PATH 中的任何 `bash.exe` 作为最后的手段。

安装程序明确设置了 `HERMES_GIT_BASH_PATH`，这样新的 PowerShell 会话就不必重新发现它。如果您想让 Hermes 使用特定的 bash（例如您的系统 Git Bash 或通过符号链接的 WSL 托管 bash），则可以覆盖此设置。

**陷阱：** MinGit 的布局与完整的 Git-for-Windows 安装程序不同——bash 位于 `usr\bin\bash.exe` 下，而不是 `bin\bash.exe`。Hermes 都进行了检查。如果您手动解压 MinGit zip 文件，请确保选择 **非 busybox** 版本（`MinGit-*-64-bit.zip`，而不是 `MinGit-*-busybox*.zip`）——busybox 构建版本使用的是 `ash` 而不是 `bash`，并且缺少大多数核心工具。

## Windows 上的 UTF-8 控制台

Windows 上的 Python 默认 stdio 使用控制台的活动代码页（通常是 cp1252 或 cp437）。Hermes 的横幅、斜杠命令列表、工具源、Rich 面板和技能描述都包含 Unicode。如果没有干预，这些内容中的任何一个都会因 `UnicodeEncodeError: 'charmap' codec can't encode character…` 而崩溃。

解决方案位于 `hermes_cli/stdio.py::configure_windows_stdio()`，它在每个入口点（`cli.py::main`、`hermes_cli/main.py::main`、`gateway/run.py::main`）早期被调用。它：

1. 通过 `kernel32.SetConsoleCP` / `SetConsoleOutputCP` 将控制台代码页切换到 CP_UTF8 (65001)。
2. 使用 `errors='replace'` 重新配置 `sys.stdout` / `sys.stderr` / `sys.stdin` 为 UTF-8。
3. 设置 `PYTHONIOENCODING=utf-8` 和 `PYTHONUTF8=1`（通过 `setdefault`，因此显式用户值优先）以确保子 Python 进程继承 UTF-8。
4. 如果既没有设置 `EDITOR` 也没有设置 `VISUAL`，则设置 `EDITOR=notepad`（参见下方的编辑器部分）。

此操作是幂等的。在非 Windows 系统上不执行任何操作。

**退出：** 在环境变量中设置 `HERMES_DISABLE_WINDOWS_UTF8=1` 会回退到旧的 cp1252 stdio 路径。这对于排查编码错误非常有用；但在正常操作中，它不太可能是正确的设置。

## 编辑器（`/edit` 或 `Ctrl-X Ctrl-E`）

在 #21561 之前，在 Windows 上按下 `Ctrl-X Ctrl-E` 或输入 `/edit` 是无效的。prompt_toolkit 有一个硬编码的 POSIX 绝对回退列表（`/usr/bin/nano`、`/usr/bin/pico`、`/usr/bin/vi` 等），这在 Windows 上永远无法解析——即使安装了完整的 Git for Windows。

Hermes 的 Windows stdio shim 现在将 `EDITOR=notepad` 设置为默认值。Notepad 随所有 Windows 安装程序一起提供，并且可以作为阻塞式编辑器使用——`subprocess.call(["notepad", file])` 会一直阻塞直到窗口关闭。

**用户覆盖仍然有效**（它们在设置默认值之前被检查）：

| 编辑器 | PowerShell 命令 |
|---|---|
| VS Code | `$env:EDITOR = "code --wait"` |
| Notepad++ | `$env:EDITOR = "'C:\Program Files\Notepad++\notepad++.exe' -multiInst -nosession"` |
| Neovim | `$env:EDITOR = "nvim"` |
| Helix | `$env:EDITOR = "hx"` |

VS Code 中的 `--wait` 标志至关重要——如果没有它，编辑器会立即返回，而 Hermes 会得到一个空白缓冲区。

在 PowerShell 配置文件中永久设置它：

```powershell
# 在 $PROFILE 中
$env:EDITOR = "code --wait"
```

或者将其设置为系统设置中的用户环境变量，这样每个新的 shell 都能拾取到它。

## CLI 中的 `Ctrl+Enter` 用于换行

Windows Terminal 将 `Ctrl+Enter` 作为专用的按键序列传递。Hermes 将其绑定到“插入换行”，因此您可以在 CLI 中输入多行提示而无需回退到先按 `Esc` 再按 `Enter`。这在 Windows Terminal、VS Code 集成终端和任何尊重 VT 转义序列的现代 Windows 控制台主机中都有效。

在旧版 `cmd.exe` 控制台中，`Ctrl+Enter` 会塌缩为普通的 `Enter`——请改用 `Esc Enter`，或者升级到 Windows Terminal（它是免费的，并且默认安装在 Windows 11 上）。

## 在 Windows 登录时运行网关

Windows 上的 `hermes gateway install` 使用**任务计划程序 (Scheduled Tasks)** 并提供一个启动文件夹的回退机制——无需管理员权限。

### 安装

```powershell
hermes gateway install
```

幕后发生了什么：

1. `schtasks /Create /SC ONLOGON /RL LIMITED /TN HermesGateway` — 注册一个在您登录时以标准（非提升）权限运行的任务。没有 UAC 提示。
2. 如果任务计划程序被组策略阻止，则回退到将一个写入 `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup` 的 `start /min cmd.exe /d /c <wrapper>` 快捷方式。效果相同，但略粗糙。
3. **通过 `pythonw.exe` 而非 `python.exe` 派生网关** — `pythonw.exe` 没有附加控制台，这使其免受来自同级进程的 `CTRL_C_EVENT` 广播的影响（一个以前会杀死网关的真正问题，即当您在同一进程组中按 Ctrl+C 时）。

派生时使用的标志：`DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_NO_WINDOW | CREATE_BREAKAWAY_FROM_JOB`。

### 管理

```powershell
hermes gateway status      # 综合视图：任务计划程序 + 启动文件夹 + 正在运行的 PID
hermes gateway start       # 现在启动计划任务
hermes gateway stop        # 平稳的 SIGTERM 等效操作（通过 psutil 的 TerminateProcess）
hermes gateway restart
hermes gateway uninstall   # 移除任务计划程序条目、启动快捷方式、pid 文件
```

`hermes gateway status` 是幂等的——无论您调用它一千次，它都不会意外地杀死网关。（在 PR #21561 之前，如果进程 ID 与 C 级别的 `CTRL_C_EVENT` 冲突（通过 `os.kill(pid, 0)`），它会静默地执行操作——如果您关心这个故事，请参阅下方的“进程管理内部机制”。）

### 为什么不用 Windows 服务？

服务需要管理员权限才能安装，并且需要将网关的生命周期与机器启动而不是用户登录绑定。典型的 Hermes 用户想要的是：登录 → 网关可用；注销 → 网关消失。任务计划程序正是这样做的，而无需提升权限。如果您确实想要一个服务，请手动使用 `nssm` 或 `sc create` — 但您可能不需要。

## 数据布局

| Path | Contents |
|---|---|
| `%LOCALAPPDATA%\hermes\hermes-agent\` | Git 检出 + venv。`venv\Scripts\hermes.exe` 是添加到用户 PATH 的命令。可以安全地使用 `Remove-Item -Recurse` 进行重装。 |
| `%LOCALAPPDATA%\hermes\git\` | PortableGit（如果安装程序提供了）。 |
| `%LOCALAPPDATA%\hermes\node\` | Portable Node.js（如果安装程序提供了）。 |
| `%LOCALAPPDATA%\hermes\bin\` | Hermes 的管理 `uv.exe`（它用于更新的 Python 管理器）。 |
| `%LOCALAPPDATA%\hermes\` (根目录) | 您的配置、认证、技能、会话、日志（`config.yaml`、`.env`、`skills\`、`sessions\`、`logs\`，…）。**重装后仍保留。** |

在原生 Windows 系统上，安装程序设置 `HERMES_HOME=%LOCALAPPDATA%\hermes`，因此您的数据和可丢弃的安装都位于 **同一个** `%LOCALAPPDATA%\hermes` 根目录下：`hermes-agent\`、`git\`、`node\` 和 `bin\` 是运行时/安装目录，而您的数据文件则直接位于 `%LOCALAPPDATA%\hermes` 中。重新安装只会替换 `hermes-agent\` 的检出内容，因此您的数据得以保留——但由于两者共享一个根目录，**不要**使用 `Remove-Item -Recurse %LOCALAPPDATA%\hermes`，除非您想保留数据；请删除 `hermes-agent\` 子目录。您的数据目录结构与 Linux 上的 `~/.hermes` 相同，因此您可以将其在不同机器之间镜像同步。

**覆盖 `HERMES_HOME`：** 将环境变量设置为指向不同的数据目录（例如，使用 `%USERPROFILE%\.hermes` 以匹配 Linux/WSL 的布局）。功能与 Linux 上完全相同。

## 浏览器工具

该浏览器工具使用 `agent-browser`（一个 Node 辅助程序）来驱动 Chromium。在 Windows 上：

*   安装程序通过 npm 将 `agent-browser` 添加到 PATH 中。
*   `shutil.which("agent-browser", path=...)` 会自动找到 `.cmd` shim——`CreateProcessW` 不能执行无 shebang 的脚本，因此 Hermes 总是解析到 `.CMD` 包装器。不要手动调用 shebang 脚本；始终通过 `.cmd` 文件进行操作。
*   Playwright Chromium 在首次运行时自动安装（`npx playwright install chromium`）。如果安装失败，`hermes doctor` 会显示出来并提供修复提示。

## Windows 上运行 Hermes — 实用注意事项

### 安装后的 PATH

安装程序使用 `[Environment]::SetEnvironmentVariable` 将 `%LOCALAPPDATA%\hermes\hermes-agent\venv\Scripts` 添加到您的**用户 PATH** 中。现有终端不会自动拾取此更改——请在安装后打开一个新的 PowerShell 窗口（或 Windows Terminal 标签页）。关闭并重新打开，不要手动执行 `$env:PATH += …`，除非您清楚自己在做什么。

验证：

```powershell
Get-Command hermes        # 应打印 C:\Users\<you>\AppData\Local\hermes\hermes-agent\venv\Scripts\hermes.exe
hermes --version
```

### 环境变量

Hermes 会尊重 `$env:X`（进程作用域）和用户环境变量（永久性，在“系统属性”→“环境变量”中设置）。在 `%LOCALAPPDATA%\hermes\.env`（您的 `HERMES_HOME`）中设置 API 密钥是正常做法——与 Linux 相同：

```
OPENROUTER_API_KEY=sk-or-...
TELEGRAM_BOT_TOKEN=...
```

除非您特意希望每个 Windows 进程都能看到，否则不要将秘密信息放在用户环境变量中（这不是您想要的）。

### 特定于 Windows 的环境变量

这些变量仅影响原生 Windows 安装：

| Variable | Effect |
|---|---|
| `HERMES_GIT_BASH_PATH` | 覆盖 bash.exe 的查找。指向任何一个 bash——可以是完整的 Git-for-Windows、通过符号链接的 WSL bash、MSYS2 或 Cygwin。安装程序会自动设置此项。 |
| `HERMES_DISABLE_WINDOWS_UTF8` | 设置为 `1` 以禁用 UTF-8 stdio shim 并回退到本地代码页。这对于排查编码错误非常有用。 |
| `EDITOR` / `VISUAL` | 用于 `/edit` 和 `Ctrl-X Ctrl-E` 的编辑器。如果两者均未设置，Hermes 默认为 `notepad`。 |

## 卸载

在 PowerShell 中执行：

```powershell
hermes uninstall
```

这是干净的路径——它会移除 schtasks 条目、启动文件夹快捷方式、`hermes.cmd` shim，删除 `%LOCALAPPDATA%\hermes\hermes-agent\`，并修剪用户 PATH。它会保留 `%LOCALAPPDATA%\hermes\` 的其余部分（您的配置、认证、技能、会话、日志），以防您进行重新安装。

要彻底清除所有内容：

```powershell
hermes uninstall
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\hermes"
# 另外删除任何曾经使用的旧版 CLI/WSL 数据目录：
Remove-Item -Recurse -Force "$env:USERPROFILE\.hermes"
```

`hermes uninstall` CLI 子命令还会处理 schtasks 条目是在不同任务名称下注册（旧版本安装）的情况——它会按安装路径而不是按硬编码的任务名称进行搜索。

## 进程管理内部机制

这是背景材料——除非您正在调试“它自我杀戮”的怪异现象，否则请跳过。

在 Linux 和 macOS 上，POSIX 惯例 `os.kill(pid, 0)` 是一个无操作（no-op）的权限检查：“这个 PID 是否存活且我可以向其发送信号？”在 Windows 上，Python 的 `os.kill` 将 `sig=0` 映射到 `CTRL_C_EVENT`——它们在整数值 0 处发生冲突——并通过 `GenerateConsoleCtrlEvent(0, pid)` 进行路由，该函数将 Ctrl+C 广播到包含目标 PID 的**整个控制台进程组**。这是 [bpo-14484](https://bugs.python.org/issue14484)，自 2012 年以来一直存在。它不会被修复，因为更改它会破坏依赖当前行为的脚本。

后果：任何通过 `os.kill(pid, 0)` 在 Windows 上声称“检查此 PID 是否存活”的代码路径实际上是在静默地杀死目标进程。Hermes 已将所有此类站点（11 个文件中的 14 个）迁移到 `gateway.status._pid_exists()`，该函数使用 `psutil.pid_exists()`（后者在 Windows 上使用 `OpenProcess + GetExitCodeProcess`——不发送信号）。如果您正在编写插件或补丁，请直接使用 `psutil.pid_exists()` 或 `gateway.status._pid_exists()`——绝不要使用 `os.kill(pid, 0)`。

`scripts/check-windows-footguns.py` 在 CI 中强制执行此项：任何新的 `os.kill(pid, 0)` 调用，除非该行包含 `# windows-footgun: ok — <reason>` 标记，否则都会导致“Windows footguns (blocking)”检查失败。

## 常见陷阱

**安装后立即出现 `hermes: command not found`。**
打开一个新的 PowerShell 窗口。安装程序已将 `%LOCALAPPDATA%\hermes\bin` 添加到用户 PATH，但现有 shell 需要重启才能拾取此更改。在此期间，您可以运行 `& "$env:LOCALAPPDATA\hermes\bin\hermes.cmd"`。

**在使用工具时出现 `WinError 193: %1 is not a valid Win32 application`。**
您调用了一个绕过 `.cmd` shim 的 shebang 脚本。Hermes 通过 `shutil.which(cmd, path=local_bin)` 解析命令，因此 PATHEXT 会拾取 `.CMD`——如果您是通过硬编码的路径来调用工具，请切换到 `.cmd` 变体（例如，使用 `npx.cmd` 而不是 `npx`）。

**`[scriptblock]::Create(...)` 失败并显示 `The assignment expression is not valid`。**
您下载的 `install.ps1` 文件中包含了一个 UTF-8 BOM。`irm | iex` 形式会自动剥离 BOM；而 `[scriptblock]::Create((irm ...))` 则不会。请使用简单的 `irm | iex` 形式重新运行，或者手动下载脚本并使用 `[IO.File]::WriteAllText($path, $text, (New-Object Text.UTF8Encoding $false))` 将其保存为不含 BOM 的文件。

**重启后 Gateway 仍无法保持运行。**
检查 `hermes gateway status`——它会合并 schtasks 条目、启动文件夹快捷方式（如果使用了）和实时 PID。如果 schtasks 已注册但未运行，组策略可能正在阻止 `ONLOGON` 触发器。运行 `schtasks /Query /TN HermesGateway /V /FO LIST` 以查看任务的失败原因，或者通过卸载并使用 `HERMES_GATEWAY_FORCE_STARTUP=1` 重新安装来回退到启动文件夹路径。

**设置 `$env:EDITOR` 后 `/edit` 仍然无效。**
您只在当前进程中设置了它；请关闭并重新打开 shell，或将其设置为系统属性→环境变量的用户作用域。在新 PowerShell 窗口中运行 `echo $env:EDITOR` 进行验证。

**浏览器工具启动但工具超时。**
Chromium 在首次运行时自动安装。如果安装失败（GitHub 限速、Playwright CDN 故障），请运行 `hermes doctor`——它将显示缺失的 Chromium 并打印出精确的 `npx playwright install chromium` 命令进行修复。

**`agent-browser` 出现奇怪的 Node 版本错误。**
安装程序在 `%LOCALAPPDATA%\hermes\node` 中提供了 Node 22，但您的 PATH 可能首先包含了一个旧版系统 Node 18。请将 Hermes 的 node 目录放在 PATH 中更靠前的位置，或者如果您没有在其他地方使用 Node，则删除系统安装。

**CLI 中显示中文/日文/阿拉伯字符为 `?`。**
UTF-8 stdio shim 未激活。检查 `HERMES_DISABLE_WINDOWS_UTF8` 是否未设置（`Get-ChildItem env:HERMES_DISABLE_WINDOWS_UTF8`）。如果它为空但您仍然看到 `?`，则控制台宿主（非常旧的 `cmd.exe`）可能根本不支持 UTF-8——请切换到 Windows Terminal。

**Gateway 无法发送 Telegram 照片——“`BadRequest: payload contains invalid characters`”。**
这与 Windows 无关，但有时会首先在此处出现。通常这意味着您的文件路径中包含未转义的反斜杠，而这些反斜杠出现在 JSON 主体中。Telegram 应该接收 Hermes 标准化的路径，而不是原始的 Windows 路径——如果您在自定义插件内部看到此问题，请确保您传递的是 Hermes 提供的路径，而不是用户输入中的 `str(Path(...))`。

**`git pull` 后“我的另一台机器上可以运行”的编码怪异现象。**
如果您在 Windows 上使用非 UTF-8 编辑器（旧版 Windows 上的记事本、某些中文 IME）编辑了 Hermes 配置或技能，文件可能以 BOM 形式保存。Hermes 对大多数配置读取容忍 `utf-8-sig`，但一个嵌套在折叠 YAML 标量（`description: >`）中的 BOM 会静默地破坏 YAML 解析。请将文件重新保存为不含 BOM 的纯 UTF-8 文件。

## 下一步该去哪里

- **[安装](../getting-started/installation.md)** — 完整的安装页面，包括 Linux/macOS/WSL2/Termux。
- **[Windows (WSL2) 指南](./windows-wsl-quickstart.md)** — 如果您需要 POSIX 语义或仪表板终端窗格。
- **[CLI 参考](../reference/cli-commands.md)** — 所有 `hermes` 子命令。
- **[FAQ](../reference/faq.md)** — 常见的非 Windows 特定问题。
- **[消息网关](./messaging/index.md)** — 在 Windows 上运行 Telegram/Discord/Slack。