---
title: "Windows（原生）指南 — 早期测试版"
description: "早期测试版：在 Windows 10/11 上原生运行 Hermes 智能体 — 安装、功能矩阵、UTF-8 控制台、Git Bash、计划任务网关、编辑器处理、PATH、卸载及常见问题"
sidebar_label: "Windows（原生）— 测试版"
sidebar_position: 3
---

# Windows（原生）指南 — 早期测试版

:::warning 早期测试版
原生 Windows 支持处于**早期测试阶段**。它可以安装、运行，并通过了我们的 Windows 潜在问题检查，但尚未像我们的 Linux/macOS/WSL2 路径那样经过大规模实战检验。预计会遇到一些边缘问题 — 尤其在子进程处理、路径怪癖和非 ASCII 控制台输出方面。遇到问题时，请[提交问题](https://github.com/NousResearch/hermes-agent/issues)并附上重现步骤。如果您现在就需要一个久经考验的方案，请改用 [WSL2 下的 Linux/macOS 安装程序](./windows-wsl-quickstart.md)。
:::

Hermes 可在 Windows 10 和 Windows 11 上原生运行 — 无需 WSL、Cygwin 或 Docker。本页是深入介绍：哪些功能是原生支持的、哪些是仅限 WSL 的、安装程序实际执行了什么操作，以及您可能需要调整的 Windows 特定配置项。

如果您只想进行安装，[首页](/)或[安装页面](../getting-started/installation#windows-native-powershell--early-beta)上的一键命令即可满足需求。当遇到意外情况时，可以回到这里查看。

:::tip 想要改用 WSL？
如果您偏爱真正的 POSIX 环境（例如用于仪表板的内嵌终端、`fork` 语义、Linux 风格的文件监视器等），请参阅 **[Windows (WSL2) 指南](./windows-wsl-quickstart.md)**。两者可以和平共存：原生数据存储在 `%LOCALAPPDATA%\hermes` 下，WSL 数据存储在 `~/.hermes` 下。
:::

## 快速安装

打开 **PowerShell**（或 Windows 终端）并运行：

```powershell
iex (irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1)
```

无需管理员权限。安装程序会安装到 `%LOCALAPPDATA%\hermes\` 并将 `hermes` 添加到您的**用户 PATH** 环境变量 — 安装完成后请打开一个新终端。

**安装程序选项**（需要使用脚本块形式来传递参数）：

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1))) -NoVenv -SkipSetup -Branch main
```

| 参数 | 默认值 | 用途 |
|---|---|---|
| `-Branch` | `main` | 克隆特定分支（用于测试 PR） |
| `-Commit` | 未设置 | 将安装固定到特定的提交 SHA（覆盖 `-Branch`） |
| `-Tag` | 未设置 | 将安装固定到特定的 git 标签（例如 `v0.14.0`） |
| `-NoVenv` | 关闭 | 跳过创建 venv（高级 — 您需要自行管理 Python） |
| `-SkipSetup` | 关闭 | 跳过安装后的 `hermes setup` 配置向导 |
| `-HermesHome` | `%LOCALAPPDATA%\hermes` | 覆盖数据目录 |
| `-InstallDir` | `%LOCALAPPDATA%\hermes\hermes-agent` | 覆盖代码位置 |

安装程序会自动重试不稳定的 git 获取操作，并会清除任何下载的 `install.ps1` 载荷中的 BOM，这样即使在 HTTP 传输过程中检测到 UTF-8 BOM，也不会再破坏 `[scriptblock]::Create((irm ...))` 形式。

### 桌面安装程序（备选）

我们还提供了一个轻量级的图形界面安装程序 — 如果您更喜欢双击 `.exe` 文件而非打开 PowerShell，它会很有用。下载 Hermes Desktop，运行安装程序，首次启动时，该图形界面会在后台调用 `install.ps1` 来配置 Python（通过 `uv`）、Node、PortableGit 以及下文将描述的其他依赖项引导。首次运行后，桌面应用程序和通过 PowerShell 安装的 `hermes` CLI 会共享相同的 `%LOCALAPPDATA%\hermes\hermes-agent` 安装目录和 `%USERPROFILE%\.hermes` 数据目录 — 您可以自由地在图形界面和 CLI 之间切换。

当您希望获得熟悉的 Windows 安装体验，或者要将 Hermes 交给非开发人员使用时，请使用桌面安装程序；当您已经在终端环境中时，请使用 PowerShell 一键命令。

### 依赖项引导 (`dep_ensure`)

在首次启动时（以及当检测到缺少工具时按需运行），Hermes 会运行一个小型的 Python 引导程序 — `hermes_cli/dep_ensure.py` — 它会检查并延迟安装所需的非 Python 依赖项。在 Windows 上，相关的依赖项有：

| 依赖项 | 为什么 Hermes 需要它 |
|---|---|
| **PortableGit** | 为终端工具提供 `bash.exe`，并为会话内克隆提供 `git`。在安装时配置，而非由 `dep_ensure` 安装。 |
| **Node.js 22** | 浏览器工具（`agent-browser`）、TUI 的 Web 桥接器和 WhatsApp 桥接器所必需。 |
| **ffmpeg** | 用于 TTS / 语音消息的音频格式转换。 |
| **ripgrep** | 快速文件搜索 — 如果不可用，则回退到 `grep`。 |
| **npm 包** | `agent-browser`、Playwright Chromium 以及任何特定工具集的 Node 依赖项，会在首次使用浏览器工具时一次性安装。 |

每个依赖项都有一个类似 `shutil.which(...)` 的检查；如果某个二进制文件缺失且运行是交互式的，`dep_ensure` 会提供安装选项（实际安装逻辑委托给 `scripts\install.ps1 -ensure <dep>`）。非交互式运行（网关、计划任务、无头桌面启动）会跳过提示，并直接显示一个清晰的`此功能需要 <dep>`错误。

## 安装程序实际执行的操作

自上而下，按顺序：

1.  **引导 `uv`** —— Astral 的快速 Python 管理器。安装到 `%USERPROFILE%\.local\bin`。
2.  **通过 `uv` 安装 Python 3.11**。无需现有 Python。
3.  **安装 Node.js 22** （如果可用则使用 winget，否则解压一个便携式 Node 压缩包到 `%LOCALAPPDATA%\hermes\node`）。用于浏览器工具和 WhatsApp 桥接。
4.  **安装便携式 Git** —— 如果 `git` 已在 PATH 上，安装程序会使用它；否则它会下载一个精简、自包含的 **PortableGit** （约 45 MB，来自官方 `git-for-windows` 发布）到 `%LOCALAPPDATA%\hermes\git`。无需管理员权限，不涉及 Windows 安装注册表，不干扰系统上的其他任何内容。
5.  **克隆仓库**到 `%LOCALAPPDATA%\hermes\hermes-agent` 并在其中创建虚拟环境。
6.  **分层 `uv pip install`** —— 首先尝试 `.[all]`，如果 `git+https` 依赖项在 GitHub 速率限制下失败，则回退到逐步缩小的集合（`[messaging,dashboard,ext]` → `[messaging]` → `.`）。防止了“单个失败导致降至基础安装”的故障模式。
7.  **基于 `.env` 自动安装消息 SDK** —— 如果存在 `TELEGRAM_BOT_TOKEN` / `DISCORD_BOT_TOKEN` / `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` / `WHATSAPP_ENABLED`，则运行 `python -m ensurepip --upgrade` 和有针对性的 `pip install` 调用，以便每个平台的 SDK 可以实际导入。
8.  **设置 `HERMES_GIT_BASH_PATH`** 为解析出的 `bash.exe`，以便 Hermes 在新 shell 中能确定性地找到它。
9.  **将 `%LOCALAPPDATA%\hermes\bin` 添加到用户 PATH** —— 打开新终端后即可使用 `hermes` 命令。
10. **运行 `hermes setup`** —— 正常的首次运行向导（模型、提供商、工具集）。使用 `-SkipSetup` 可跳过。

:::tip 在 Windows 上跳过提供商探索
原生 Windows 仍处于早期 Beta 阶段，并且按工具设置 API 密钥（Firecrawl、FAL、Browser Use、OpenAI TTS）是获得一个有用智能体过程中摩擦最大的部分。[Nous Portal](/user-guide/features/tool-gateway) 订阅通过一次 OAuth 登录涵盖模型 **以及** 所有这些工具。安装程序完成后，运行 `hermes setup --portal` 来配置所有内容。
:::

## 功能矩阵

除仪表板的嵌入式终端窗格外，所有功能均可在 Windows 上原生运行。

| 功能 | 原生 Windows | WSL2 |
|---|---|---|
| CLI（`hermes chat`、`hermes setup`、`hermes gateway`、…） | ✓ | ✓ |
| 交互式 TUI（`hermes --tui`） | ✓ | ✓ |
| 消息网关（Telegram、Discord、Slack、WhatsApp、15+ 平台） | ✓ | ✓ |
| 定时任务调度器 | ✓ | ✓ |
| 浏览器工具（通过 Node 的 Chromium） | ✓ | ✓ |
| MCP 服务器（stdio 和 HTTP） | ✓ | ✓ |
| 本地 Ollama / LM Studio / llama-server | ✓ | ✓（通过 WSL 网络） |
| Web 仪表板（会话、任务、指标、配置） | ✓ | ✓ |
| 仪表板 `/chat` 嵌入式终端窗格 | ✗（需要 POSIX PTY） | ✓ |
| 登录时自动启动 | ✓（schtasks） | ✓（systemd） |

仪表板的 `/chat` 选项卡通过 POSIX PTY（`ptyprocess`）嵌入了一个真实终端。原生 Windows 没有等效的原语；Python 的 `pywinpty` / Windows ConPTY 可以工作，但需要单独的实现 —— 视为未来的工作。**仪表板的其余部分均可原生工作** —— 只有那一个选项卡会显示“请为此使用 WSL2”的横幅。

## Hermes 如何在 Windows 上运行 shell 命令

Hermes 的终端工具通过 **Git Bash** 运行命令，与 Claude Code 使用的策略相同。这避免了重写每个工具来弥合 POSIX 与 Windows 之间的差距。

`bash.exe` 的解析顺序：

1.  如果设置了 `HERMES_GIT_BASH_PATH` 环境变量，则使用该值。
2.  `%LOCALAPPDATA%\hermes\git\usr\bin\bash.exe` （安装程序管理的 PortableGit）。
3.  `%LOCALAPPDATA%\hermes\git\bin\bash.exe` （较旧的 Git-for-Windows 布局）。
4.  系统 Git-for-Windows 安装（例如 `%ProgramFiles%\Git\bin\bash.exe`）。
5.  作为最后的手段，使用 PATH 上的 MSYS2、Cygwin 或任何 `bash.exe`。

安装程序会显式设置 `HERMES_GIT_BASH_PATH`，因此新的 PowerShell 会话无需重新发现。如果你想让 Hermes 使用特定的 bash —— 例如，你的系统 Git Bash 或通过符号链接托管的 WSL bash —— 可以覆盖它。

**注意事项：** MinGit 的布局与完整的 Git-for-Windows 安装程序不同 —— bash 位于 `usr\bin\bash.exe`，而不是 `bin\bash.exe`。Hermes 会检查两者。如果你手动解压 MinGit zip，请确保选择 **非 busybox** 的变体（`MinGit-*-64-bit.zip`，而不是 `MinGit-*-busybox*.zip`）—— busybox 版本提供的是 `ash` 而不是 `bash`，并且缺少大多数核心工具。

## Windows 上的 UTF-8 控制台

Python 在 Windows 上的默认标准输入输出使用控制台的活动代码页（通常是 cp1252 或 cp437）。Hermes 的横幅、斜杠命令列表、工具源、Rich 面板和技能描述都包含 Unicode。如果不进行干预，其中任何一项都会因 `UnicodeEncodeError: 'charmap' codec can't encode character…` 而崩溃。

修复方法在 `hermes_cli/stdio.py::configure_windows_stdio()` 中，它在每个入口点（`cli.py::main`、`hermes_cli/main.py::main`、`gateway/run.py::main`）早期被调用。它：

1.  通过 `kernel32.SetConsoleCP` / `SetConsoleOutputCP` 将控制台代码页切换为 CP_UTF8 (65001)。
2.  将 `sys.stdout` / `sys.stderr` / `sys.stdin` 重新配置为 UTF-8，设置 `errors='replace'`。
3.  设置 `PYTHONIOENCODING=utf-8` 和 `PYTHONUTF8=1`（通过 `setdefault`，因此显式的用户设置优先），以便子 Python 进程继承 UTF-8。
4.  如果既未设置 `EDITOR` 也未设置 `VISUAL`，则设置 `EDITOR=notepad`（参见下面的编辑器部分）。

幂等操作。在非 Windows 系统上无操作。

**选择退出：** 环境中的 `HERMES_DISABLE_WINDOWS_UTF8=1` 会回退到旧的 cp1252 标准输入输出路径。这对于定位编码错误很有用；在正常操作中不太可能是正确的设置。

# 编辑器（`Ctrl-X Ctrl-E`，`/edit`）

在 #21561 之前，在 Windows 上按下 `Ctrl-X Ctrl-E` 或输入 `/edit` 会静默无任何动作。prompt_toolkit 有一个硬编码的 POSIX 绝对路径回退列表（`/usr/bin/nano`、`/usr/bin/pico`、`/usr/bin/vi` 等），在 Windows 上永远无法解析——即使安装了完整的 Git for Windows。

Hermes 的 Windows stdio 垫片现在将 `EDITOR=notepad` 设为默认值。记事本随每个 Windows 安装附带，并且作为一个阻塞式编辑器工作——`subprocess.call(["notepad", file])` 会阻塞直到窗口关闭。

**用户覆盖设置仍然优先**（它们会在 setdefault 之前被检查）：

| 编辑器 | PowerShell 命令 |
|---|---|
| VS Code | `$env:EDITOR = "code --wait"` |
| Notepad++ | `$env:EDITOR = "'C:\Program Files\Notepad++\notepad++.exe' -multiInst -nosession"` |
| Neovim | `$env:EDITOR = "nvim"` |
| Helix | `$env:EDITOR = "hx"` |

VS Code 上的 `--wait` 标志至关重要——没有它，编辑器会立即返回，而 Hermes 会收到一个空缓冲区。

可以在你的 PowerShell 配置文件中永久设置：

```powershell
# 在 $PROFILE 中
$env:EDITOR = "code --wait"
```

或者在系统设置中作为用户环境变量设置，以便每个新 shell 都能获取它。

## CLI 中使用 `Ctrl+Enter` 换行

Windows Terminal 会将 `Ctrl+Enter` 作为专用的按键序列传递。Hermes 将其绑定为“插入换行符”，这样你就可以在 CLI 中编写多行提示，而无需回退到 `Esc` 然后 `Enter`。此功能适用于 Windows Terminal、VS Code 集成终端以及任何遵循 VT 转义序列的现代 Windows 控制台主机。

在传统的 `cmd.exe` 控制台上，`Ctrl+Enter` 会退化为普通的 `Enter`——请改用 `Esc Enter`，或者升级到 Windows Terminal（它是免费的，并且在 Windows 11 上默认安装）。

## 在 Windows 登录时运行网关

`hermes gateway install` 在 Windows 上使用**计划任务**和启动文件夹作为备用方案——无需管理员权限。

### 安装

```powershell
hermes gateway install
```

其内部原理：

1. `schtasks /Create /SC ONLOGON /RL LIMITED /TN HermesGateway` — 注册一个任务，在您登录时以标准（非提升）权限运行。不会弹出 UAC 提示。
2. 如果组策略阻止了 schtasks，则回退到在 `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup` 中写入一个 `start /min cmd.exe /d /c <wrapper>` 快捷方式。效果相同，只是方式略显粗糙。
3. 通过 `pythonw.exe` 生成**分离的**网关进程——而非 `python.exe`。`pythonw.exe` 没有关联的控制台，这使其免受同进程组中兄弟进程广播的 `CTRL_C_EVENT` 影响（这是一个真实存在的问题，曾经会在您在同一进程组中按 Ctrl+C 终止任何程序时杀死网关）。

生成时使用的标志：`DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_NO_WINDOW | CREATE_BREAKAWAY_FROM_JOB`。

### 管理

```powershell
hermes gateway status      # 合并视图：计划任务 + 启动文件夹 + 运行中的 PID
hermes gateway start       # 立即启动计划任务
hermes gateway stop        # 优雅的 SIGTERM 等效操作（通过 psutil 调用 TerminateProcess）
hermes gateway restart
hermes gateway uninstall   # 移除计划任务条目、启动文件夹快捷方式、PID 文件
```

`hermes gateway status` 是幂等的——连续调用一千次也不会意外杀死网关。（在 PR #21561 之前，它会通过 `os.kill(pid, 0)` 在 C 层与 `CTRL_C_EVENT` 冲突而静默地杀死网关——如果你对背后的故事感兴趣，可以看下面的“进程管理内部原理”。）

### 为什么不用 Windows 服务？

服务需要管理员权限来安装，并且会将网关的生命周期绑定到机器启动，而非用户登录。典型的 Hermes 用户期望：登录 → 网关可用，注销 → 网关消失。计划任务正好无需提升权限就能实现这一点。如果你确实需要一个服务，请手动使用 `nssm` 或 `sc create`——但你大概率不需要。

## 数据布局

| 路径 | 内容 |
|---|---|
| `%LOCALAPPDATA%\hermes\hermes-agent\` | Git 检出 + 虚拟环境。可以安全地使用 `Remove-Item -Recurse` 删除并重新安装。 |
| `%LOCALAPPDATA%\hermes\git\` | PortableGit（仅当安装程序配置了它时存在）。 |
| `%LOCALAPPDATA%\hermes\node\` | 便携式 Node.js（仅当安装程序配置了它时存在）。 |
| `%LOCALAPPDATA%\hermes\bin\` | `hermes.cmd` 桩文件，已添加到用户 PATH。 |
| `%USERPROFILE%\.hermes\` | 你的配置、认证、技能、会话、日志。**重装后会保留。** |

这种划分是刻意的：`%LOCALAPPDATA%\hermes` 是可处置的基础设施（你可以删除它，然后通过一行命令恢复）。`%USERPROFILE%\.hermes` 是你的数据——配置、记忆、技能、会话历史——并且其结构与 Linux 安装完全相同。在机器间镜像它，你的 Hermes 就能随你移动。

**覆盖 `HERMES_HOME`：** 设置此环境变量以指向不同的数据目录。其工作原理与 Linux 上相同。

## 浏览器工具

浏览器工具使用 `agent-browser`（一个 Node 辅助程序）来驱动 Chromium。在 Windows 上：

- 安装程序通过 npm 将 `agent-browser` 添加到 PATH。
- `shutil.which("agent-browser", path=...)` 会自动拾取 `.cmd` 桩文件——`CreateProcessW` 无法执行无扩展名的 shebang 脚本，因此 Hermes 总是解析到 `.CMD` 包装器。不要手动调用 shebang 脚本；始终通过 `.cmd` 调用。
- Playwright Chromium 在首次运行时自动安装（`npx playwright install chromium`）。如果安装失败，`hermes doctor` 会显示问题并提供修复提示。

## 在 Windows 上运行 Hermes — 实用注意事项

### 安装后的 PATH

安装程序通过 `[Environment]::SetEnvironmentVariable` 将 `%LOCALAPPDATA%\hermes\bin` 添加到你的**用户 PATH**。已存在的终端不会立即生效——安装后请打开一个新的 PowerShell 窗口（或 Windows Terminal 选项卡）。关闭并重新打开，除非你知道自己在做什么，否则不要手动执行 `$env:PATH += …`。

验证：

```powershell
Get-Command hermes        # 应该打印 C:\Users\<you>\AppData\Local\hermes\bin\hermes.cmd
hermes --version
```

### 环境变量

Hermes 同时支持 `$env:X`（进程作用域）和用户环境变量（永久的，在系统属性 → 环境变量中设置）。在 `%USERPROFILE%\.hermes\.env` 中设置 API 密钥是标准路径——与 Linux 上相同：

```
OPENROUTER_API_KEY=sk-or-...
TELEGRAM_BOT_TOKEN=...
```

除非你特别希望每个 Windows 进程都能看到它们，否则不要将密钥放在用户环境变量中（这不是你想要的）。

### Windows 特定的环境变量

这些仅影响原生 Windows 安装：

| 变量 | 效果 |
|---|---|
| `HERMES_GIT_BASH_PATH` | 覆盖 bash.exe 发现路径。指向任何 bash——完整的 Git-for-Windows、通过符号链接的 WSL bash、MSYS2、Cygwin。安装程序会自动设置此项。 |
| `HERMES_DISABLE_WINDOWS_UTF8` | 设置为 `1` 可禁用 UTF-8 stdio 桩并回退到区域设置代码页。用于二分查找编码错误。 |
| `EDITOR` / `VISUAL` | 用于 `/edit` 和 `Ctrl-X Ctrl-E` 的编辑器。如果两者都未设置，Hermes 默认使用 `notepad`。 |

## 卸载

在 PowerShell 中：

```powershell
hermes uninstall
```

这是干净卸载路径——移除计划任务条目、启动文件夹快捷方式、`hermes.cmd` 桩文件，删除 `%LOCALAPPDATA%\hermes\hermes-agent\`，并修剪用户 PATH。它会保留 `%USERPROFILE%\.hermes\`（你的配置、认证、技能、会话、日志），以防你重新安装。

要彻底清除所有内容：

```powershell
hermes uninstall
Remove-Item -Recurse -Force "$env:USERPROFILE\.hermes"
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\hermes"
```

`hermes uninstall` CLI 子命令也处理了计划任务条目以不同任务名称（旧版本安装）注册的情况——它通过安装路径而非硬编码的任务名称来搜索。

## 进程管理内部原理

这是背景材料——除非你正在调试“它正在杀死自己”的奇怪现象，否则可以跳过。

在 Linux 和 macOS 上，POSIX 惯用语 `os.kill(pid, 0)` 是一个空操作权限检查：“这个 PID 是否存活且我能向它发送信号？”在 Windows 上，Python 的 `os.kill` 将 `sig=0` 映射到 `CTRL_C_EVENT`——它们在整数值 0 上冲突——并通过 `GenerateConsoleCtrlEvent(0, pid)` 路由，这会向包含目标 PID 的**整个控制台进程组**广播 Ctrl+C。这是 [bpo-14484](https://bugs.python.org/issue14484)，自 2012 年起开放。它不会被修复，因为更改会破坏依赖于当前行为的脚本。

结果：任何在 Windows 上通过 `os.kill(pid, 0)` 说“检查此 PID 是否存活”的代码路径都在静默地杀死目标。Hermes 已将所有此类位置（跨 11 个文件的 14 处）迁移到 `gateway.status._pid_exists()`，该函数使用 `psutil.pid_exists()`（在 Windows 上进一步使用 `OpenProcess + GetExitCodeProcess`——不涉及信号）。如果你正在编写插件或补丁，请直接使用 `psutil.pid_exists()` 或 `gateway.status._pid_exists()`——永远不要使用 `os.kill(pid, 0)`。

`scripts/check-windows-footguns.py` 在 CI 中强制执行此规则：任何新的 `os.kill(pid, 0)` 调用都会导致 `Windows footguns (blocking)` 检查失败，除非该行带有 `# windows-footgun: ok — <reason>` 标记。

## 常见陷阱

**安装后立即出现 `hermes: command not found`。**
打开一个新的 PowerShell 窗口。安装程序已将 `%LOCALAPPDATA%\hermes\bin` 添加到用户 PATH，但现有 shell 需要重启才能生效。在此期间，你可以运行 `& "$env:LOCALAPPDATA\hermes\bin\hermes.cmd"`。

**运行工具时出现 `WinError 193: %1 is not a valid Win32 application`。**
你遇到了绕过 `.cmd` 桩文件的 shebang 脚本调用。Hermes 通过 `shutil.which(cmd, path=local_bin)` 解析命令，因此 PATHEXT 会拾取 `.CMD`——如果你是通过硬编码路径调用工具，请改为使用 `.cmd` 变体（例如，使用 `npx.cmd` 而非 `npx`）。

**`[scriptblock]::Create(...)` 失败并提示 `The assignment expression is not valid`。**
你下载的 `install.ps1` 文件带有 UTF-8 BOM。`irm | iex` 形式会自动剥离 BOM；`[scriptblock]::Create((irm ...))` 则不会。使用简单的 `irm | iex` 形式重新运行，或者手动下载脚本并通过 `[IO.File]::WriteAllText($path, $text, (New-Object Text.UTF8Encoding $false))` 保存为无 BOM 的文件。

**重启后网关无法保持运行。**
检查 `hermes gateway status`——它合并了计划任务条目、启动文件夹快捷方式（如果使用了）和活动的 PID。如果计划任务已注册但未运行，组策略可能正在阻止 `ONLOGON` 触发器。运行 `schtasks /Query /TN HermesGateway /V /FO LIST` 以查看任务的失败原因，或者通过设置 `HERMES_GATEWAY_FORCE_STARTUP=1` 卸载并重新安装以回退到启动文件夹路径。

**设置 `$env:EDITOR` 后，`/edit` 仍然无效。**
你仅在当前进程中设置了它；关闭并重新打开 shell，或者在系统属性 → 环境变量中以用户范围设置它。在新的 PowerShell 窗口中通过 `echo $env:EDITOR` 验证。

**浏览器工具启动但工具超时。**
Chromium 在首次运行时自动安装。如果安装失败（GitHub 限速、Playwright CDN 故障），请运行 `hermes doctor`——它会显示缺失的 Chromium 并打印用于修复的确切命令 `npx playwright install chromium`。

**`agent-browser` 因奇怪的 Node 版本错误而失败。**
安装程序在 `%LOCALAPPDATA%\hermes\node` 提供了 Node 22，但你的 PATH 中可能有一个更旧的系统 Node 18 优先。要么将 Hermes 的 node 目录在 PATH 中提前，要么如果你在其他地方不使用 Node，则删除系统安装。

**CLI 中中文 / 日文 / 阿拉伯文字符显示为 `?`。**
UTF-8 stdio 桩未激活。检查 `HERMES_DISABLE_WINDOWS_UTF8` 未被设置（`Get-ChildItem env:HERMES_DISABLE_WINDOWS_UTF8`）。如果为空且你仍然看到 `?`，则控制台主机（非常旧的 `cmd.exe`）可能根本不支持 UTF-8——请切换到 Windows Terminal。

**网关无法发送 Telegram 照片——"`BadRequest: payload contains invalid characters`"。**
这与 Windows 无关，但有时会首先在那里出现。通常意味着你的文件路径在 JSON 主体中包含未转义的反斜杠。Telegram 接收的应该是 Hermes 规范化后的路径，而不是原始的 Windows 路径——如果你在自定义插件中看到此问题，请确保传递的是 Hermes 提供的路径，而不是来自用户输入的 `str(Path(...))`。

**`git pull` 后出现“在我的其他机器上正常工作”的编码怪现象。**
如果你在 Windows 上使用非 UTF-8 编辑器（旧版 Windows 的记事本，一些中文输入法）编辑了 Hermes 配置或技能，该文件可能以 BOM 保存。Hermes 在大多数配置读取时容忍 `utf-8-sig`，但 BOM 位于折叠的 YAML 标量内（`description: >`）会静默地破坏 YAML 解析。请将文件重新保存为无 BOM 的纯 UTF-8。

## 下一步去哪里

- **[安装指南](../getting-started/installation.md)** — 完整的安装页面，包括 Linux/macOS/WSL2/Termux。
- **[Windows (WSL2) 教程](./windows-wsl-quickstart.md)** — 如果您需要 POSIX 语义或仪表板终端面板。
- **[CLI 参考](../reference/cli-commands.md)** — 所有 `hermes` 子命令。
- **[常见问题](../reference/faq.md)** — 通用的非 Windows 特定问题。
- **[消息网关](./messaging/index.md)** — 在 Windows 上运行 Telegram/Discord/Slack。