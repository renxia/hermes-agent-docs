---
title: Computer Use
sidebar_position: 16
---

# Computer Use

Hermes 智能体可以在 macOS、Windows 和 Linux 上于**后台**操控你的桌面——点击、输入、拖拽。你的光标不会移动，键盘焦点不会切换，虚拟桌面/空间也不会发生变化。你和智能体在同一台机器上协同工作。

与大多数计算机使用集成方案不同，该功能适用于**任何具备工具调用能力的模型**——Claude、GPT、Gemini，或本地 OpenAI 兼容端点上的开源模型。无需担心 Anthropic 原生 schema 的问题。

## 工作原理

`computer_use` 工具集通过 stdio 上的 MCP 协议与 [`cua-driver`](https://github.com/trycua/cua) 进行通信，后者是一个开源的后台计算机使用驱动。每个平台在底层使用相应的无障碍访问和输入栈：

| 平台 | 无障碍访问树 | 输入分发 |
|---|---|---|
| macOS | AX（私有 SkyLight SPIs） | `SLPSPostEventRecordTo` —— 按进程 ID 作用域，无光标跳转 |
| Windows | UIAutomation | `SendInput` + `PostMessage` —— 不抢占焦点 |
| Linux | AT-SPI（X11 + Wayland） | XTest（X11）/ 虚拟键盘（Wayland） |

每个平台的结果是一致的：智能体可以读取任何可见窗口的无障碍访问树，并发送合成事件，而无需将其切换到前台、切换虚拟桌面或移动真实的系统光标。

关于底层机制——*为什么*后台模式很重要、不切换前台的不变性、点击分发的内部实现——请参阅 **[cua.ai/docs/explanation/the-no-foreground-contract](https://cua.ai/docs/explanation/the-no-foreground-contract)**。

## 启用

选择最方便的路径——两者运行的是相同的上游安装程序：

**选项 1：专用 CLI 命令（最直接）。**

```
hermes computer-use install
```

这将获取并运行上游 cua-driver 安装程序——macOS/Linux 上为 `install.sh`，Windows 上为 `install.ps1`。使用 `hermes computer-use status` 验证安装。

**选项 2：交互式启用工具集。**

1. 运行 `hermes tools`，选择 `🖱️  Computer Use (macOS/Windows/Linux)`。
2. 设置程序将运行上游安装程序（与选项 1 相同）。

安装完成后，无论选择哪种路径，都需要授予对应平台的前置权限：

| 平台 | 前置条件 |
|---|---|
| **macOS** | 系统设置 → 隐私与安全 → **辅助功能** + **屏幕录制** → 允许你的终端（或 Hermes 应用）。`hermes computer-use doctor` 会告诉你缺少哪个权限。 |
| **Windows** | 安装时无需额外操作。如果通过 SSH 驱动（非 RDP / 控制台），需要自动启动配置——参见 [cua.ai/docs/how-to-guides/driver/windows-ssh](https://cua.ai/docs/how-to-guides/driver/windows-ssh) 了解 Session 0 ↔ Session 1+ 代理方案。 |
| **Linux** | 需要可用的显示服务器：X11 设置 `DISPLAY`，或 `XDG_SESSION_TYPE=wayland`。Wayland 会话需要 XWayland 桥接才能截屏。AT-SPI 必须可用（GNOME/KDE/Xfce 默认开启）。 |

然后启动一个启用该工具集的会话：

```
hermes -t computer_use chat
```

或在 `~/.hermes/config.yaml` 中将 `computer_use` 添加到已启用的工具集中。

## `hermes computer-use doctor` —— 首选诊断工具

`hermes computer-use doctor` 运行 cua-driver 的结构化 `health_report` MCP 工具，并打印逐项检查矩阵。这是查找操作不生效原因的最快方式。

```
$ hermes computer-use doctor
⚠️  cua-driver 0.5.8 on darwin — degraded
  ✅ binary_version: cua-driver 0.5.8
  ✅ platform_supported: macOS 26.4.1 (arm64)
  ✅ session_active: MCP session is active.
  ❌ bundle_identity: Process has no CFBundleIdentifier.
      → Run the binary inside CuaDriver.app so TCC grants attribute correctly.
  ✅ tcc_accessibility: Accessibility is granted.
  ✅ tcc_screen_recording: Screen Recording is granted.
  ✅ ax_capability: AX is trusted and reachable.
  ✅ screen_capture_capability: ScreenCaptureKit reachable; 1 display(s) shareable.
```

- **退出码 0**：整体状态为 `ok` —— 一切就绪。
- **退出码 1**：状态为 `degraded` 或 `failed` —— 至少一项检查失败；每个失败项的提示告诉你需要修复什么。
- **退出码 2**：cua-driver 二进制文件本身无法访问。

实用标志：

- `--include CHECK` —— 仅运行列出的检查项（可多次重复以指定多个）
- `--skip CHECK` —— 跳过某个检查项（优先级高于 `--include`）
- `--json` —— 输出原始结构化数据，格式与 `tools/call health_report` MCP 响应相同

检查矩阵具有平台感知能力：`bundle_identity` / `tcc_*` 在 Windows 和 Linux 上为 `skip`，因为这些概念不适用。`ax_capability` 在 macOS 上检查 AX，在 Windows 上检查 UIA，在 Linux 上检查 AT-SPI —— 无法访问时提供对应的诊断提示。

## 智能体光标与会话

当智能体执行操作时，你会看到一个**带颜色的覆盖光标**滑动到每次点击/输入/滚动的位置。真实的操作系统光标从不移动——覆盖光标是一个视觉提示，表示"智能体正在此位置操作"。每次 Hermes 运行都会声明自己的 cua-driver **会话 ID**（类似 `hermes-3a7b9c14d2e8`）；光标身份与会话绑定，因此并发运行/子智能体各自获得独立的光标，互不干扰。

可通过 `cua-driver` 的 CLI 标志或运行时 `set_agent_cursor_style` MCP 工具调整光标——完整菜单（内置 `arrow` 与 `teardrop` 轮廓，通过 `--cursor-icon` 使用自定义 SVG / PNG / ICO，运行时渐变颜色，光晕效果）参见 [cua.ai/docs/how-to-guides/driver/personalize-cursor](https://cua.ai/docs/how-to-guides/driver/personalize-cursor)。

## 深入探索 —— cua-driver 技能包

Hermes 有意将其技能（`skills/computer-use/SKILL.md`）聚焦于 Hermes 端的 `computer_use` 操作词汇——这是智能体加载的唯一真实来源。对于更深入的内容——特定平台的深度解析、录制语义、浏览器页面交互——请将你的智能体框架指向 cua-driver 团队直接维护和发布的技能包：

```
cua-driver skills install
```

这会将技能包符号链接到你的智能体框架的技能目录中。运行后，智能体将获得以下文件的访问权限：

| 文件 | 主题 |
|---|---|
| `SKILL.md` | 跨平台核心（快照不变量、无前台契约、点击分发、AX 树机制） |
| `MACOS.md` | macOS 细节：无前台契约、AXMenuBar 导航、SkyLight 点击分发、Apple Events JS 桥接 |
| `WINDOWS.md` | Windows 细节：UIA 树、UWP / `ApplicationFrameHost` 托管、Session 0 隔离、自动启动配置 |
| `LINUX.md` | Linux 细节：AT-SPI 树、X11 / Wayland、终端模拟器检测 |
| `RECORDING.md` | 轨迹 + 视频录制语义 |
| `WEB_APPS.md` | 浏览器页面交互技巧 |
| `TESTS.md` | 按轨迹回放工作流 |

这些是**平台的深度解析，而非 Hermes 技能的重复**——当智能体报告"在 Windows 上，我的点击落在了错误的元素上"时，它会读取 `WINDOWS.md` 以获取 UIA / UWP 上下文来解释原因及如何改进。

`cua-driver skills status` 显示安装内容及其链接到的智能体框架。目前自动检测列表涵盖 Claude Code、Codex、OpenCode、OpenClaw 和 Antigravity；**Hermes 自动检测计划在 `trycua/cua` 的后续版本中推出**——在此之前，运行一次 `cua-driver skills install`，然后将你的框架指向生成的 `~/.cua-driver/skills/cua-driver` 目录（或将其符号链接到你的常用技能空间）。

## 快速示例

用户提示：*"找到我来自 Stripe 的最新邮件，总结他们要我做什么。"*

智能体的计划（macOS / Windows / Linux 上形状相同——模型会替换为平台的惯用快捷方式和应用名称）：

1. `computer_use(action="capture", mode="som", app="Mail")` —— 获取邮件应用的截图，侧边栏项目、工具栏按钮和邮件行都有编号。
2. `computer_use(action="click", element=14)` —— 点击搜索字段。
3. `computer_use(action="type", text="from:stripe")`
4. `computer_use(action="key", keys="return", capture_after=True)` —— 提交并获取新截图。
5. 点击顶部结果，阅读正文，总结。

在整个过程中，你的光标停留在你离开的位置，邮件应用永远不会被拉到前台。

## 提供商兼容性

| 提供商 | 视觉支持？ | 可用？ | 备注 |
|---|---|---|---|
| Anthropic (Claude Sonnet/Opus 3+) | ✅ | ✅ | 综合最佳；支持 SOM + 原始坐标。 |
| OpenRouter（任意视觉模型） | ✅ | ✅ | 支持多部分工具消息。 |
| OpenAI (GPT-4+, GPT-5) | ✅ | ✅ | 同上。 |
| Google (Gemini 2+) | ✅ | ✅ | 工具调用 + 视觉均支持。 |
| 本地 vLLM / LM Studio / Ollama（视觉模型） | ✅ | ✅ | 需模型支持多部分内容工具。 |
| 纯文本模型 | ❌ | ✅（降级） | 使用 `mode="ax"` 仅操作辅助功能树。 |

截图作为 OpenAI 风格的 `image_url` 部分内联在工具结果中发送。对于 Anthropic，适配器将其转换为原生 `tool_result` 图像块。图像的 MIME 类型来自 cua-driver 显式的 `mimeType` 字段（`image/png` 或 `image/jpeg`）——不依赖客户端的魔数检测。

## 安全性

Hermes 应用多层防护机制：

- 破坏性操作（点击、输入、拖拽、滚动、按键、focus_app）需要审批——通过 CLI 对话框交互审批，或通过消息平台审批按钮。
- 工具级别硬性拦截的快捷键组合：清空废纸篓、强制删除、锁屏、注销、强制注销。
- 硬性拦截的输入模式：`curl | bash`、`sudo rm -rf /`、fork 炸弹等。
- 智能体的系统提示明确告知：不点击权限对话框、不输入密码、不执行截图中嵌入的指令。

如果希望每个操作都经过确认，可在 `~/.hermes/config.yaml` 中配对设置 `approvals.mode: manual`。

## Token 效率

截图很昂贵。Hermes 应用四层优化：

- **截图驱逐** —— Anthropic 适配器仅在上下文中保留最近 3 张截图；较早的变为 `[screenshot removed to save context]` 占位符。
- **客户端压缩裁剪** —— 上下文压缩器检测多模态工具结果，剥离旧结果中的图像部分。
- **图像感知 token 估算** —— 每张图像按约 1500 token 计算（Anthropic 的统一费率），而非其 base64 字符长度。
- **服务端上下文编辑（仅 Anthropic）** —— 激活时，适配器通过 `context_management` 启用 `clear_tool_uses_20250919`，让 Anthropic 的 API 在服务端清除旧的工具结果。

在 1568×900 显示器上，一个 20 次操作的会话通常消耗约 30K token 的截图上下文，而非约 600K。

## 限制

- **性能。** 后台模式比前台慢——辅助功能路由的事件在 macOS 上约需 5–20 毫秒，Windows UIA 上约需 3–10 毫秒，Linux AT-SPI 上约需 5–15 毫秒，而直接 HID 发布更快。对智能体速度的点击无明显影响；但如果尝试录制速通则会感知到。
- **不支持键盘输入密码。** `type` 对命令行载荷有硬性拦截模式；对于密码，请使用系统的自动填充（macOS 钥匙串 / Windows 凭据管理器 / GNOME Keyring / KWallet）。
- **某些应用不暴露辅助功能树。** Windows 上的现代 UWP 应用、Linux 上 Electron &lt; 28 的应用，以及部分自定义绘制的 macOS 应用（Logic、Final Cut、某些游戏）的 AX 树稀疏或为空。如果树为空则回退到像素坐标——或完全跳过该任务。
- **Windows：提升权限（管理员）窗口无法由普通智能体驱动。** Windows UIPI（用户界面特权隔离）执行完整性级别边界：中等完整性进程（默认的 Hermes 智能体）无法枚举高完整性（管理员）进程拥有的窗口的 UIA 树，也无法向其注入鼠标输入。症状：`capture(mode='som')` 返回 0 个元素，`click(...)` 报告成功但实际什么都没做，尽管截图渲染正常（GDI 截取在完整性检查之下）。键盘事件部分绕过 UIPI，因此 Tab / Enter 仍可导航提升权限对话框。这是操作系统限制，不是 cua-driver 的 bug —— 影响所有 Windows 自动化工具栈。要驱动提升权限窗口，请以高完整性运行 Hermes 智能体（从提升权限的终端启动）；否则请以非提升权限窗口为目标。
- **平台特定的部署注意事项：**
  - **macOS** 使用私有 SkyLight SPI。Apple 可在任何 OS 更改中修改它们。当安装的 cua-driver 版本比测试版本旧时，Hermes 会发出警告。
  - **Windows** SSH 会话运行在 **Session 0** 中，没有交互式桌面。请从 RDP / 控制台会话内部驱动 Hermes，或设置 cua-driver 的自动启动计划任务——[windows-ssh](https://cua.ai/docs/how-to-guides/driver/windows-ssh) 有详细方案。
  - **Linux** 需要可用的显示服务器。无头服务器需要在 `computer_use` 能捕获或注入事件之前启动 Xvfb（`Xvfb :99 -screen 0 1920x1080x24`）。纯 Wayland 会话需要 XWayland 桥接才能截屏（cua-driver 的 Wayland 注入路径独立处理输入）。

对于无需桌面开销（且无需 TCC / Session 0 / X11 设置）的跨平台 GUI 自动化，`browser` 工具集使用真正的无头 Chromium，是纯 Web 任务的正确选择。

## 配置

覆盖驱动二进制路径（测试 / CI / 本地构建）：

```
HERMES_CUA_DRIVER_CMD=/path/to/your/cua-driver
```

完全切换后端（用于测试）：

```
HERMES_COMPUTER_USE_BACKEND=noop   # 记录调用，无副作用
```

### 遥测

cua-driver 默认启用了匿名使用遥测（PostHog）。
**Hermes 会为你禁用它** — 在每次 cua-driver 调用时
（MCP 后端、`status`、`doctor` 和 install），Hermes 都会在驱动的环境中设置
`CUA_DRIVER_RS_TELEMETRY_ENABLED=0`。

要重新选择加入（让 cua-driver 使用其默认设置并发送遥测），在 `config.yaml` 中设置：

```yaml
computer_use:
  cua_telemetry: true   # 默认值：false（遥测关闭）
```

开启时，`hermes computer-use doctor` 会报告 `telemetry: enabled`；
关闭时（默认），会报告 `telemetry: disabled via
CUA_DRIVER_RS_TELEMETRY_ENABLED`。

## 针对本地 cua-driver 构建进行测试

当你正在开发 cua-driver 本身 — 或者想测试一个
未发布的修复 — 将 Hermes 指向你从源码构建的二进制文件，
而不是已发布的版本。Hermes 通过
`shutil.which("cua-driver")` 解析驱动，**且不强制要求
`HERMES_CUA_DRIVER_VERSION`**，因此本地构建（报告为
`0.0.0-local-*`）会被直接接受。两种方法：

### 选项 A — `install-local`（构建 + 放入 PATH）

从你的 `trycua/cua` 检出目录，运行上游本地安装脚本。
它以 release 模式构建 Rust 后端，并将 `cua-driver` 部署到
生产安装程序使用的相同安装布局中，同时将 bin 目录添加到你的 PATH：

```powershell
# Windows (PowerShell)，从 cua 仓库根目录
./libs/cua-driver/scripts/install-local.ps1 -NoAutoStart
```

```bash
# macOS / Linux，从 cua 仓库根目录（不带 --release 时默认为 debug 构建）
./libs/cua-driver/scripts/install-local.sh --release
```

- Windows 将构建暂存在 `%USERPROFILE%\.cua-driver\packages\…`，
  并将 `%LOCALAPPDATA%\Programs\Cua\cua-driver\bin`（已添加到你的用户 PATH）
  链接到它。macOS/Linux 将 `cua-driver` 符号链接到 `~/.local/bin`
  （可用 `--bin-dir <path>` 覆盖）。
- `-NoAutoStart` 跳过注册 `cua-driver-serve` 登录守护进程
  — Hermes 测试不需要它（见说明）。

然后打开一个新的 shell（使 PATH 变更可见）并确认：

```
cua-driver --version                 # 本地构建报告 0.0.0-local-release
# Windows:      (Get-Command cua-driver).Source
# macOS/Linux:  which cua-driver
```

### 选项 B — 将 Hermes 直接指向已构建的二进制文件（最快循环）

完全跳过安装仪式：`cargo build` 并将
`HERMES_CUA_DRIVER_CMD` 设置为生成的二进制文件。最适合快速
编辑/构建/测试。

```bash
cargo build -p cua-driver            # 添加 --release 以进行 release 构建；从 libs/cua-driver/rust 运行
```

```
# Windows (.env)
HERMES_CUA_DRIVER_CMD=C:\path\to\cua\libs\cua-driver\rust\target\debug\cua-driver.exe
# macOS / Linux (.env)
HERMES_CUA_DRIVER_CMD=/path/to/cua/libs/cua-driver/rust/target/debug/cua-driver
```

### 确认 Hermes 正在使用你的构建

- `hermes computer-use status` 会打印解析出的二进制路径和版本。
- `hermes computer-use doctor` 会确认二进制可访问，并端到端地测试完整 MCP 路径。
- 在会话中，`computer_use(action="capture")` 会测试派生的
  `cua-driver mcp` 子进程。

### 说明与注意事项

- **Hermes 通过 stdio 派生自己的 `cua-driver mcp` 子进程** — 它
  *不会*连接到长期运行的 `cua-driver serve` 自动启动守护进程
  或其命名管道。因此计划任务 / LaunchAgent 对于测试是不必要的
  （`-NoAutoStart` 即可）。自动启动守护进程和
  Windows UIAccess 工作进程（`cua-driver-uia.exe`）仅对
  某些应用（如 WPF）的前台安全输入有影响；标准工具界面通过 stdio 子进程工作。
  在 Windows SSH 会话中，自动启动模式*是必需的* — 参见限制部分。
- **Windows 上的二进制被锁定。** 运行中的 `cua-driver-serve` 守护进程可能
  持有 `cua-driver.exe` 并阻止重建时的覆盖。
  `install-local.ps1` 会自动将锁定的二进制重命名移出；
  如果你手动 `cargo build`（选项 B），先用 `cua-driver autostart disable`
  （或 `schtasks /End /TN cua-driver-serve`）停止它。
- **重建循环。** 编辑 cua-driver 源码后，对选项 A 重新运行
  `install-local`（重建、重新暂存、切换 `current` 链接），
  或对选项 B 重新 `cargo build` — 两种方式都不需要更改 Hermes。
- **本地构建跳过版本检查。** Hermes 会在安装的 cua-driver 旧于
  其各操作系统测试基线时发出警告，但豁免 `0.0.0-local-*` 开发构建 —
  因此你的本地构建永远不会触发该警告。

## 故障排查

**一切异常时的首要操作：运行 `hermes computer-use doctor`。**
结构化的逐项检查矩阵会告诉你（以及任何帮助你调试的智能体）
具体哪里出了问题。

医生未捕获的特定故障模式：

**`computer_use backend unavailable: cua-driver is not installed`** —
运行 `hermes computer-use install` 获取 cua-driver 二进制，或
运行 `hermes tools` 并启用 Computer Use 工具集。

**点击似乎没有效果** — 捕获并验证。你可能没看到的模态框可能正在阻止输入。用 `escape` 或关闭按钮将其关闭。

**元素索引已过期** — SOM 索引仅在下次 `capture` 之前有效。在任何改变状态的操作后重新捕获。包装器携带不透明的 `element_token` 用于过期检测 — 你会看到明确的错误，而不是错误的点击。

**"blocked pattern in type text"** — 你尝试 `type` 的文本
匹配了危险 shell 模式列表。将命令拆分或重新考虑。

**Linux 上的空捕获** — 未设置 `DISPLAY`，或你在没有 XWayland 桥接的纯 Wayland 上。`hermes computer-use doctor` 会将其标记为 `ax_capability: fail`，并给出 `Set DISPLAY (X11)…` 提示。

**通过 SSH 在 Windows 上的空捕获** — 你处于 Session 0（服务会话）。通过 RDP / 控制台直接驱动，或设置自动启动模式 — 参见
[cua.ai/docs/how-to-guides/driver/windows-ssh](https://cua.ai/docs/how-to-guides/driver/windows-ssh)。

## 另请参阅

- **Hermes 端技能** — `skills/computer-use/SKILL.md` — 教授
  Hermes `computer_use` 操作词汇；这是智能体加载的内容。
- **cua-driver 技能包** — 用于特定平台的深入了解
  （macOS 无前台契约、Windows UIA + Session 0、Linux AT-SPI
  + X11/Wayland、录屏、浏览器页面），运行
  `cua-driver skills install` 并阅读 `MACOS.md` / `WINDOWS.md` /
  `LINUX.md` / `RECORDING.md` / `WEB_APPS.md`。一旦 `cua-driver skills
  install` 自动检测到 Hermes（计划中的后续功能），这将在安装时自动完成。
- **cua.ai/docs** — cua-driver 项目的文档：
  - [什么是 computer use？](https://cua.ai/docs/explanation/what-is-computer-use) — 概念介绍
  - [无前台契约](https://cua.ai/docs/explanation/the-no-foreground-contract) — *为什么*后台模式很重要
  - [安装参考](https://cua.ai/docs/how-to-guides/driver/install) — 跨平台安装详情
  - [自定义智能体光标](https://cua.ai/docs/how-to-guides/driver/personalize-cursor) — 内置形状、自定义资源、运行时覆盖
  - [通过 SSH 驱动 Windows](https://cua.ai/docs/how-to-guides/driver/windows-ssh) — Session 0 → Session 1+ 自动启动模式
  - [保持 cua-driver 运行](https://cua.ai/docs/how-to-guides/driver/keep-running) — 自动启动 / 守护进程生命周期
  - [连接你的智能体](https://cua.ai/docs/how-to-guides/driver/connect-your-agent) — 将 cua-driver 注册到各种框架（包括 Hermes）
- [cua-driver 源码 (trycua/cua)](https://github.com/trycua/cua)
- [浏览器自动化](./browser.md) — 适用于不需要驱动原生应用的跨平台 Web 任务。