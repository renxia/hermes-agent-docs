---
sidebar_position: 2
title: "TUI"
description: "为 Hermes 提供的现代终端 UI — 鼠标友好、丰富的覆盖层和非阻塞输入。"
---

# TUI

TUI 是 Hermes 的现代化前端——它是一个由与 [Classic CLI](cli.md) 相同的 Python 运行时支持的终端 UI。智能体相同，会话相同，斜杠命令相同；它是与它们交互的一个更简洁、响应更快的界面。

这是以交互方式运行 Hermes 的推荐方法。

## 启动

```bash
# 启动 TUI
hermes --tui

# 恢复最新的 TUI 会话（如果失败，则回退到最新的经典会话）
hermes --tui -c
hermes --tui --continue

# 通过 ID 或标题恢复特定的会话
hermes --tui -r 20260409_000000_aa11bb
hermes --tui --resume "my t0p session"

# 直接运行源文件——跳过预构建步骤（供 TUI 贡献者使用）
hermes --tui --dev
```

您也可以通过环境变量启用它：

```bash
export HERMES_TUI=1
hermes          # 现在会使用 TUI
hermes chat     # 相同
```

或者在 `~/.hermes/config.yaml` 中将其设置为持久默认值：

```yaml
display:
  interface: tui   # "cli" (默认) 或 "tui"
```

当设置了 `display.interface: tui` 时，裸的 `hermes`（以及 `hermes chat`）都会启动 TUI。显式标志总是具有最高优先级——运行 `hermes --cli` 可以回退到用于单次调用的经典 REPL，或者运行 `hermes --tui` / `HERMES_TUI=1` 以强制 TUI，即使配置默认值是 `cli`。

经典 CLI 仍然是出厂默认设置。在 [CLI 接口](cli.md) 中记录的所有内容——斜杠命令、快速命令、技能预加载、个性、多行输入、中断——都在 TUI 中完全相同地工作。

## 为什么需要 TUI

- **即时首帧** — 在应用程序完成加载之前，横幅就会被渲染出来，因此无论 Hermes 是否正在启动，终端都不会感觉卡住。
- **非阻塞输入** — 在会话准备就绪之前就可以输入和排队消息。一旦智能体上线，您的第一个提示就会发送出去。
- **丰富的覆盖层** — 模型选择器、会话选择器、批准和澄清提示都以模态面板的形式渲染，而不是内联流程。
- **实时会话面板** — 工具和技能会随着初始化过程逐步填充进来。
- **鼠标友好的选择** — 使用统一的背景色而非 SGR 反转模式进行拖动高亮。使用终端的正常复制手势进行复制。
- **替代屏幕渲染** — 差分更新意味着流式传输时不会闪烁，退出后也不会有滚动回溯的混乱信息。
- **合成器功能** — 长片段的内联粘贴/折叠、带剪贴板图像落后的 `Cmd+V` / `Ctrl+V` 文本粘贴、方括号安全粘贴以及图片/文件路径归一化。

相同的 [skins](features/skins.md) 和 [personalities](features/personality.md) 也适用。可以使用 `/skin ares`、`/personality pirate` 在会话中途切换，UI 会实时重绘。请参阅 [Skins & Themes](features/skins.md) 以获取可定制键和哪些键适用于经典模式与 TUI 的完整列表——TUI 遵循横幅调色板、UI 颜色、提示符号/颜色、会话显示、完成菜单、选择背景、`tool_prefix` 和 `help_header`。

### 可折叠的横幅部分

TUI 启动横幅将运行时信息分组到四个可折叠的部分中，每个部分都使用位于部分标题旁的 `▸` / `▾` chevron 进行渲染：

| 部分 | 默认状态 |
|---|---|
| Tools (工具) | Open (打开) |
| Skills (技能) | Collapsed (已折叠) |
| System Prompt (系统提示) | Collapsed (已折叠) |
| MCP Servers (MCP 服务器) | Collapsed (已折叠) |

点击任何部分标题（或其 chevron）即可切换。Tools 列表默认打开，因为它是在会话开始时最常检查的部分；Skills、System Prompt 和 MCP Servers 默认处于折叠状态，这样即使您安装了数十个技能或配置了许多 MCP 服务器，横幅仍然保持紧凑。状态是针对该横幅实例的本地状态，因此下次启动时都会重置为默认值。

## 要求

- **Node.js** ≥ 20 — TUI 是从 Python CLI 启动的一个子进程。`hermes doctor` 会验证这一点。
- **TTY** — 与经典 CLI 一样，如果通过管道输入 stdin 或在非交互式环境中运行，则会回退到单查询模式。

首次启动时，Hermes 会将 TUI 的 Node 依赖项安装到 `ui-tui/node_modules` 中（一次性操作，耗时几秒）。后续的启动速度很快。如果您拉取了新的 Hermes 版本，当源文件比 dist 文件新时，TUI 包会自动重建。

### 外部预构建

提供预构建包的发行版（Nix、系统软件包）可以指向它：

```bash
export HERMES_TUI_DIR=/path/to/prebuilt/ui-tui
hermes --tui
```

该目录必须包含 `dist/entry.js`。

## 快捷键

快捷键与 [Classic CLI](cli.md#keybindings) 完全一致。唯一的行为差异包括：

- **鼠标拖动** 使用统一的选择背景色高亮文本。
- **`Cmd+V` / `Ctrl+V`** 首先尝试正常的文本粘贴，然后回退到 OSC52/原生剪贴板读取，最后在剪贴板或粘贴的负载解析为图像时进行图像附件。
- **`/terminal-setup`** 为 macOS 提供更好的 `Cmd+Enter` 和撤销/重做对等性的本地 VS Code / Cursor / Windsurf 终端绑定。
- **斜杠自动补全** 以带有描述的浮动面板形式打开，而不是内联下拉菜单。
- **`Ctrl+X`** 打开实时会话切换器。当一个排队的（在智能体仍在运行时发送的）消息被高亮显示时，它仍然会删除该排队消息。**`Esc`** 会取消编辑并解除高亮，而不会删除。
- **`Ctrl+G` / `Ctrl+X Ctrl+E`** — 在 `$EDITOR` 中打开当前的输入缓冲区，用于多行/长提示合成；保存并退出会将内容作为提示发送回去。

## 斜杠命令

所有斜杠命令均保持不变。少数命令是 TUI 特有的——它们会产生更丰富的输出或以覆盖层而非内联面板的形式渲染：

| 命令 | TUI 行为 |
|---|---|
| `/help` | 带分类命令的覆盖层，支持箭头键导航 |
| `/sessions` (别名 `/switch`) | 实时会话切换器 — 列出打开的 TUI 会话，在它们之间切换、关闭它们或启动新的会话 |
| `/model` | 按提供商分组的模态模型选择器，带有成本提示 |
| `/skin` | 实时预览 — 主题更改在你浏览时立即生效 |
| `/details` | 切换详细工具调用（全局或按部分）显示 |
| `/usage` | 丰富的 token / 成本 / 上下文面板 |
| `/agents` (别名 `/tasks`) | 可观测性覆盖层 — 带终止/暂停控制的实时子智能体树，每个分支的成本/token/文件汇总，逐轮历史记录 |
| `/reload` | 将 `~/.hermes/.env` 重新读取到正在运行的 TUI 进程中，以便新添加的 API 密钥无需重启即可生效 |
| `/mouse [on\|off\|toggle\|wheel\|buttons\|all]` | 在运行时选择一个鼠标跟踪预设（也持久化到 `config.yaml` 中的 `display.mouse_tracking`）。`wheel` (1000+1006) 保持滚动轮滚动，而不会像悬停事件那样让 tmux 在提示行上刷屏“剪贴板中没有图像”；`buttons` 添加拖动选择功能；`all` 是默认设置，支持基于悬停的 UI。 |

所有其他斜杠命令（包括已安装的技能、快速命令和个性切换）都与经典 CLI 相同。请参阅 [Slash Commands Reference](../reference/slash-commands.md)。

## 实时会话切换器

当您希望一个终端充当多个 TUI 会话的分派器时，请使用实时会话切换器。它只列出当前在该 TUI 进程中处于活动状态的会话；已关闭的会话仍保留转录记录，可以使用 `/resume` 或 `hermes --tui --resume <id-or-title>` 重新打开它们。

通过以下任一方式打开：

- 从 TUI 中按 `Ctrl+X`。
- `/sessions` 或 `/switch`。
- `/sessions new` 以立即创建一个新的实时会话。
- 点击状态栏中的 `N live sessions` 计数。

<img alt="Hermes TUI Session Orchestrator with one live session and a +new row" src="/img/docs/tui-session-orchestrator/session-orchestrator.png" />

<video controls muted loop playsInline src="/img/docs/tui-session-orchestrator/session-orchestrator-demo.mp4" title="Hermes TUI Session Orchestrator demo" />

在切换器内部：

- `↑` / `↓` 移动选择；鼠标点击也可以选择行。
- `Enter` 切换到选定的实时会话。
- `Ctrl+D` 关闭选定的实时会话。
- `Ctrl+N` 启动一个空白的实时会话。
- `Ctrl+R` 刷新实时会话列表。
- `Esc` 关闭切换器。
- 选择 `+new`，输入提示，然后按 `Enter` 以分派一个新的实时会话。如果想为该新会话选择模型，请先按 `Tab`。

## LaTeX 数学渲染

TUI 的 markdown 管道将内联渲染 LaTeX 数学：`$E = mc^2$` 和 `$$\frac{a}{b}$$` 会被渲染成 Unicode 格式的数学表达式，而不是原始 TeX 源代码。它适用于内联和块级数学；不支持的语法会回退到显示用代码跨度包裹起来的字面 TeX，以保持其可复制性。

这始终开启——无需配置。经典 CLI 保留原始 TeX。

## 轻型终端检测

TUI 会自动检测轻型终端并相应地切换到浅色主题。检测工作在三个层次上：

1. `HERMES_TUI_THEME` 环境变量 — 最高优先级。值包括：`light`（浅色）、`dark`（深色）或一个原始的 6 位背景十六进制数（例如 `ffffff`、`1a1a2e`）。
2. `COLORFGBG` 环境变量 — 由基于 xterm 的终端使用的经典“我的背景颜色是什么？”提示。
3. 通过 OSC 11 进行终端背景探测 — 适用于那些不设置 `COLORFGBG` 的现代终端（Ghostty, Warp, iTerm2, WezTerm, Kitty）。

如果您希望无论终端如何都永久使用浅色主题：

```bash
export HERMES_TUI_THEME=light
```

## 忙碌指示器样式

状态栏的忙碌指示器是可插拔的——默认设置在智能体工作期间每 2.5 秒都会旋转 Hermes 的可爱表情符号集。可以通过配置或 `/indicator` 斜杠命令选择不同的样式：

```yaml
display:
  tui_status_indicator: kaomoji   # kaomoji | emoji | unicode | ascii
```

或者在会话中：`/indicator emoji`（等等）。这些样式都附带匹配的字符宽度，因此状态栏的其他部分在旋转时不会抖动。

## 自动恢复

默认情况下，`hermes --tui` 在每次启动时都会开始一个新的会话。要自动重新连接到最近的 TUI 会话（当您的终端或 SSH 连接意外中断时特别有用），请选择启用：

```bash
export HERMES_TUI_RESUME=1          # 最近的 TUI 会话
# 或者：
export HERMES_TUI_RESUME=<session-id>   # 特定会话
```

取消设置该变量或显式传递 `--resume <id>` 以在每次启动时覆盖。

## 状态栏

TUI 的状态栏实时跟踪智能体状态：

| 状态 | 含义 |
|---|---|
| `starting agent…` | 会话 ID 是活动的；工具和技能仍在上线中。您可以输入——消息会排队并在准备就绪时发送。 |
| `ready` | 智能体空闲，正在接受输入。 |
| `thinking…` / `running…` | 智能体正在推理或运行工具。 |
| `interrupted` | 当前轮次被取消；按 Enter 键重新发送。 |
| `forging session…` / `resuming…` | 初始连接或 `--resume` 握手。 |

每种皮肤的状态栏颜色和阈值与经典 CLI 共享——请参阅 [Skins](features/skins.md) 以进行自定义。

状态栏还显示：

- **带 Git 分支的工作目录** — `~/projects/hermes-agent (docs/two-week-gap-sweep)`。当您在侧边终端中执行 `git checkout` 时，分支后缀会更新（mtime-cached），因此 TUI 会反映出您实际活动的分支，而不是启动时的状态。
- **每次提示的耗时** — 在轮次运行时显示 `⏱ 12s/3m 45s`，在轮次完成后冻结为 `⏲ 32s / 3m 45s`。第一个数字是自上次用户消息以来的时间；第二个是总会话持续时间。每次新的提示都会重置。
- **`🗜️ N`** — 会话被自动压缩的次数。在第一次压缩发生后显示。
- **`▶ N`** — 当前正在运行的 `/background` 任务数量。只要至少有一个任务正在进行中，就会显示此项。
- **`⚠ YOLO`** — 当 YOLO 模式开启时（`hermes --yolo`、`/yolo` 或 `HERMES_YOLO_MODE=1`）会显示的警告。相同的徽章也会出现在启动横幅上，因此您不能在没有注意到的情况下启动一个自动批准的会话。

## 配置

TUI 尊重所有标准的 Hermes 配置：`~/.hermes/config.yaml`、配置文件、个性、皮肤、快速命令、凭证池、内存提供者、工具/技能启用。不存在 TUI 特定的配置文件。

少数几个键专门用于调整 TUI 的表面：

```yaml
display:
  skin: default              # 任何内置或自定义的皮肤
  personality: helpful
  details_mode: collapsed    # hidden | collapsed | expanded — 全局手风琴默认设置
  sections:                  # 可选：按部分覆盖（任何子集）
    thinking: expanded       # 始终打开
    tools: expanded          # 始终打开
    activity: collapsed      # 选择性启用活动面板（默认隐藏）
  mouse_tracking: all        # off | wheel | buttons | all (或 true/false 用于向后兼容)。
                             #   wheel   — 1000+1006 (滚动 + 点击；无拖动，无悬停 —
                             #             推荐在 tmux 中使用以消除来自悬停事件的提示行
                             #             “剪贴板中没有图像”刷屏)
                             #   buttons — 添加 1002 用于终端侧面的拖动选择
                             #   all     — 添加 1003 用于悬停（滚动条分页-on-hover,
                             #             link mouseenter 等）
```

运行时切换：

- `/details [hidden|collapsed|expanded|cycle]` — 设置全局模式
- `/details <section> [hidden|collapsed|expanded|reset]` — 覆盖某一特定部分
  (sections: `thinking`, `tools`, `subagents`, `activity`)

**默认可见性**

TUI 配备了有主见的按部分默认设置，它将轮次流式传输为实时转录，而不是一堆 chevron：

- `thinking` — **expanded (已展开)**。推理内容会随着模型发出而内联流式传输。
- `tools` — **expanded (已展开)**。工具调用及其结果都会渲染成打开状态。
- `subagents` — 遵循全局的 `details_mode`（默认在 chevron 下折叠——直到实际发生委托才保持安静）。
- `activity` — **hidden (隐藏)**。环境元数据（网关提示、终端对等性提醒、背景通知）对于日常使用来说是噪音。工具故障仍然会显示在失败的工具行上；当所有面板都隐藏时，环境错误/警告会通过浮动警报作为后备方案显示。

按部分覆盖优先于部分的默认设置和全局 `details_mode`。要重塑布局：

- `display.sections.thinking: collapsed` — 将推理内容放回 chevron 下
- `display.sections.tools: collapsed` — 将工具调用放回 chevron 下
- `display.sections.activity: collapsed` — 选择性地重新启用活动面板
- 运行时使用 `/details <section> <mode>`

任何在 `display.sections` 中显式设置的内容都将胜过默认值，因此现有配置仍可正常工作。

## 会话 (Sessions)

会话在 TUI 和经典 CLI 之间共享——两者都写入同一个 `~/.hermes/state.db` 文件。您可以在其中一个启动会话，并在另一个中恢复它。会话选择器会显示来自这两个来源的会话，并附带来源标签。

有关生命周期、搜索、压缩和导出的信息，请参阅 [会话](sessions.md)。

## TUI 如何与它的网关 (gateway) 通信

默认情况下，TUI 会启动自己的进程内网关（in-process gateway），因此每个 TUI 实例都是自包含的——无需配置。

您可能会在代码库或日志中看到 `HERMES_TUI_GATEWAY_URL` 这个环境变量。这是**Web 控制面板的内部连接细节**，而不是面向用户的远程附加开关。当您打开控制面板的“聊天”（Chat）标签（`hermes dashboard` → `/chat`）时，控制面板的 Web 服务器会启动一个嵌入式的 TUI 子进程，并注入 `HERMES_TUI_GATEWAY_URL`，以便该子进程通过环回 WebSocket (`/api/ws`) 连接到控制面板自己的进程内 `tui_gateway`。`/api/ws` 端点仅存在于控制面板服务器（`hermes_cli/web_server.py`）内部，并且绑定到该进程的生命周期和认证。

不存在一种通用的“将任何 TUI 指向任何独立的网关端口”模式。特别是，OpenAI 兼容的 API 服务器（`hermes gateway` / `api_server` 平台）**不**提供 `/api/ws`——这是模型后端接口（`/v1/chat/completions`、`/v1/models` 等），它故意不暴露 TUI 的 JSON-RPC 控制通道。将 `HERMES_TUI_GATEWAY_URL` 设置为该端口会导致 404 错误。

如果您希望多个界面共享同一组会话，请使用共享的 `~/.hermes/state.db`（参见 [会话](sessions.md)）或 Web 控制面板的嵌入式聊天功能（参见 [Web 控制面板](features/web-dashboard.md#chat)）——而不是手动设置网关 URL。

## 回退到经典 CLI

启动 `hermes`（不带 `--tui` 参数）默认会保持在经典 CLI 中。要让机器偏好 TUI，请在 `~/.hermes/config.yaml` 中设置 `display.interface: tui`（持久化），或在您的 shell 配置文件中设置 `HERMES_TUI=1`（按shell）。要返回，请设置 `interface: cli` / 取消设置环境变量，或者传递 `hermes --cli` 进行一次性操作。

如果 TUI 无法启动（没有 Node、缺少捆绑包、TTY 问题），Hermes 会打印诊断信息并进行回退——而不是让您卡住。

## 另请参阅 (See also)

- [CLI 界面](cli.md) — 完整的斜杠命令和按键绑定参考
- [会话](sessions.md) — 恢复、分支和历史记录
- [皮肤与主题](features/skins.md) — 主题化横幅、状态栏和叠加层
- [语音模式](features/voice-mode.md) — 在两种界面中均可用
- [配置](configuration.md) — 所有配置键