---
sidebar_position: 2
title: "TUI"
description: "启动 Hermes 的现代终端界面 — 鼠标友好、丰富的覆盖层，且输入非阻塞。"
---

# TUI

TUI 是 Hermes 的现代前端界面 — 一个由与 [经典命令行界面](cli.md) 相同的 Python 运行时支持的终端 UI。相同的智能体、相同的会话、相同的斜杠命令；一个更清晰、响应更迅速的交互界面。

这是交互式运行 Hermes 的推荐方式。

## 启动

```bash
# 启动 TUI
hermes --tui

# 恢复最近的 TUI 会话（如果无则回退到最近的经典会话）
hermes --tui -c
hermes --tui --continue

# 通过 ID 或标题恢复特定会话
hermes --tui -r 20260409_000000_aa11bb
hermes --tui --resume "我的测试会话"

# 直接运行源代码 — 跳过预构建步骤（适用于 TUI 贡献者）
hermes --tui --dev
```

你也可以通过环境变量启用：

```bash
export HERMES_TUI=1
hermes          # 现在使用 TUI
hermes chat     # 同上
```

经典命令行界面仍作为默认选项可用。任何在 [CLI 界面](cli.md) 中记录的功能 — 斜杠命令、快速命令、技能预加载、个性设置、多行输入、中断 — 在 TUI 中的工作方式完全相同。

## 为何使用 TUI

- **即时首帧** — 应用加载完成前，横幅便会绘制，因此当 Hermes 启动时，终端不会显得卡顿。
- **非阻塞输入** — 在会话准备就绪前，您可以键入并排队消息。您的第一条提示会在智能体上线的那一刻发送。
- **富叠加层** — 模型选择器、会话选择器、审批和澄清提示均以模态面板的形式呈现，而非内嵌流程。
- **实时会话面板** — 工具和技能在初始化过程中逐步填充。
- **鼠标友好选择** — 拖动以统一背景高亮文本，而非使用 SGR 反色。使用终端的常规复制手势即可复制。
- **备用屏幕渲染** — 差分更新意味着流式传输时不会闪烁，退出后不会留下滚动历史混乱。
- **编辑器便利性** — 长代码片段的内联粘贴折叠，`Cmd+V` / `Ctrl+V` 文本粘贴（带剪贴板图像回退），括号粘贴安全，以及图像/文件路径附件规范化。

同样适用相同的 [外观主题](features/skins.md) 和 [个性](features/personality.md)。可通过 `/skin ares`、`/personality pirate` 在会话中切换，UI 会实时重绘。完整的自定义键列表以及哪些键适用于经典 CLI 与 TUI，请参见 [外观主题与主题](features/skins.md) — TUI 支持横幅调色板、UI 颜色、提示符字形/颜色、会话显示、补全菜单、选中背景、`tool_prefix` 和 `help_header`。

### 可折叠横幅部分

TUI 启动横幅将运行时信息分组为四个可折叠部分，每个部分标题旁都有一个 `▸` / `▾` 箭头符号：

| 部分 | 默认状态 |
|------|----------|
| 工具 | 展开 |
| 技能 | 折叠 |
| 系统提示 | 折叠 |
| MCP 服务器 | 折叠 |

单击部分标题（或其箭头符号）的任何位置可切换展开/折叠状态。工具列表默认展开，因为这是会话开始时最常检查的部分；技能、系统提示和 MCP 服务器默认折叠，因此即使您安装了数十个技能或连接了许多 MCP 服务器，横幅也能保持紧凑。状态仅限于当前横幅实例，因此下次启动时会重置为默认值。

## 要求

- **Node.js** ≥ 20 — TUI 作为从 Python CLI 启动的子进程运行。`hermes doctor` 可验证此要求。
- **TTY** — 与经典 CLI 一样，如果管道化标准输入或在非交互式环境中运行，将回退到单次查询模式。

首次启动时，Hermes 会将 TUI 的 Node 依赖安装到 `ui-tui/node_modules`（一次性，耗时几秒）。后续启动速度很快。如果您拉取了新的 Hermes 版本，当源代码比分发版更新时，TUI 包将自动重建。

### 外部预构建

提供预构建包的发行版（Nix、系统包）可以将 Hermes 指向该位置：

```bash
export HERMES_TUI_DIR=/path/to/prebuilt/ui-tui
hermes --tui
```

该目录必须包含 `dist/entry.js`。

## 按键绑定

按键绑定与 [经典 CLI](cli.md#keybindings) 完全一致。仅有的行为差异：

- **鼠标拖动** 使用统一选中背景高亮文本。
- **`Cmd+V` / `Ctrl+V`** 首先尝试常规文本粘贴，然后回退到 OSC52/原生剪贴板读取，当剪贴板或粘贴的内容为图像时，最终会进行图像附件操作。
- **`/terminal-setup`** 为 macOS 安装本地 VS Code / Cursor / Windsurf 终端绑定，以获得更好的 `Cmd+Enter` 和撤销/重做一致性。
- **斜杠命令自动补全** 作为带描述的浮动面板打开，而非内嵌下拉菜单。
- **`Ctrl+X`** 打开实时会话切换器。当高亮显示排队消息（在智能体仍在运行时发送）时，它仍会删除该排队消息。**`Esc`** 取消编辑并取消高亮而不删除。
- **`Ctrl+G` / `Ctrl+X Ctrl+E`** — 在 `$EDITOR` 中打开当前输入缓冲区，用于多行/长提示组合；保存并退出后，其内容将作为提示发回。

## 斜杠命令

所有斜杠命令的工作方式不变。少数几个由 TUI 专有 — 它们产生更丰富的输出或作为叠加层呈现，而非内嵌面板：

| 命令 | TUI 行为 |
|------|----------|
| `/help` | 带分类命令的叠加层，可使用方向键导航 |
| `/sessions` (别名 `/switch`) | 实时会话切换器 — 列出此 TUI 中打开的会话，在它们之间切换、关闭它们，或启动另一个会话 |
| `/model` | 按提供商分组的模态模型选择器，带成本提示 |
| `/skin` | 实时预览 — 主题更改在您浏览时应用 |
| `/details` | 切换详细的工具调用详情（全局或按部分） |
| `/usage` | 丰富的令牌/成本/上下文面板 |
| `/agents` (别名 `/tasks`) | 可观测性叠加层 — 带终止/暂停控制的实时子智能体树，每个分支的成本/令牌/文件汇总，逐轮历史记录 |
| `/reload` | 将 `~/.hermes/.env` 重新读入正在运行的 TUI 进程，以便新添加的 API 密钥无需重启即可生效 |
| `/mouse [on\|off\|toggle\|wheel\|buttons\|all]` | 在运行时选择鼠标跟踪预设（也会持久化到 `config.yaml` 的 `display.mouse_tracking` 中）。`wheel` (1000+1006) 保持滚轮滚动，而不会产生使 tmux 在提示行上方显示“剪贴板中无图像”的悬停事件；`buttons` 添加拖动选择；`all` 是默认值，具有悬停驱动的 UI。 |

所有其他斜杠命令（包括已安装的技能、快速命令和个性切换）与经典 CLI 工作方式完全相同。参见 [斜杠命令参考](../reference/slash-commands.md)。

## 实时会话切换器

当您希望一个终端充当多个 TUI 会话的调度器时，请使用实时会话切换器。它仅列出当前在此 TUI 进程中实时活跃的会话；已关闭的会话仍是已保存的记录，仍然可以通过 `/resume` 或 `hermes --tui --resume <id-or-title>` 重新打开。

通过以下任一方式打开它：

- 在 TUI 中按 `Ctrl+X`。
- 使用 `/sessions` 或 `/switch`。
- 使用 `/sessions new` 立即创建一个新的实时会话。
- 单击状态行中的 `N live sessions` 计数。

<img alt="一个实时会话和 +new 行的 Hermes TUI 会话编排器" src="/img/docs/tui-session-orchestrator/session-orchestrator.png" />

<video controls muted loop playsInline src="/img/docs/tui-session-orchestrator/session-orchestrator-demo.mp4" title="Hermes TUI 会话编排器演示" />

在切换器内部：

- `↑` / `↓` 移动选择；鼠标单击也选择行。
- `Enter` 切换到选中的实时会话。
- `Ctrl+D` 关闭选中的实时会话。
- `Ctrl+N` 开始一个新的空白实时会话。
- `Ctrl+R` 刷新实时会话列表。
- `Esc` 关闭切换器。
- 选择 `+new`，键入提示，然后按 `Enter` 以调度一个新的实时会话。如果您想仅为该新会话选择一个模型，请先按 `Tab`。

## LaTeX 数学公式渲染

TUI 的 Markdown 管道渲染行内 LaTeX 数学公式：`$E = mc^2$` 和 `$$\frac{a}{b}$$` 将渲染为 Unicode 格式的数学公式，而非原始的 TeX 源代码。适用于行内和块级数学公式；不支持的语法将回退为显示包裹在代码跨度中的字面 TeX，以便保持可复制。

此功能始终开启 — 无需配置。经典 CLI 保持原始 TeX 显示。

## 亮色终端检测

TUI 会自动检测亮色终端并相应切换到亮色主题。检测通过三层进行：

1. `HERMES_TUI_THEME` 环境变量 — 优先级最高。值：`light`、`dark` 或原始的 6 字符背景十六进制值（例如 `ffffff`、`1a1a2e`）。
2. `COLORFGBG` 环境变量 — 经典的“我的背景色是什么？”提示，由 xterm 衍生终端使用。
3. 通过 OSC 11 的终端背景探测 — 适用于不设置 `COLORFGBG` 的现代终端（Ghostty、Warp、iTerm2、WezTerm、Kitty）。

如果您希望永久使用亮色主题，无论终端设置如何：

```bash
export HERMES_TUI_THEME=light
```

## 忙碌指示器样式

状态栏忙碌指示器是可插拔的 — 默认情况下，在智能体工作期间，每 2.5 秒轮换一次 Hermes 的可爱表情字符集。通过配置或 `/indicator` 斜杠命令选择不同的样式：

```yaml
display:
  tui_status_indicator: kaomoji   # kaomoji | emoji | unicode | ascii
```

或在会话中：`/indicator emoji`（等等）。样式附带匹配的字形宽度，因此状态栏的其余部分在轮换时不会抖动。

## 自动恢复

默认情况下，`hermes --tui` 每次启动时都会开始一个新的会话。要自动重新连接到最近的 TUI 会话（当您的终端或 SSH 连接意外断开时很有用），请选择启用：

```bash
export HERMES_TUI_RESUME=1          # 最近的 TUI 会话
# 或：
export HERMES_TUI_RESUME=<session-id>   # 特定会话
```

取消设置该变量或显式传递 `--resume <id>` 可在每次启动时覆盖。

## 状态行

TUI 的状态行实时跟踪智能体状态：

| 状态 | 含义 |
|------|------|
| `starting agent…` | 会话 ID 已激活；工具和技能仍在上线中。您可以键入 — 消息会排队，准备就绪后发送。 |
| `ready` | 智能体空闲，接受输入。 |
| `thinking…` / `running…` | 智能体正在推理或运行工具。 |
| `interrupted` | 当前轮次已取消；按 Enter 重新发送。 |
| `forging session…` / `resuming…` | 初始连接或 `--resume` 握手。 |

每个外观主题的状态栏颜色和阈值与经典 CLI 共享 — 自定义请参见 [外观主题](features/skins.md)。

状态行还显示：

- **包含 Git 分支的工作目录** — `~/projects/hermes-agent (docs/two-week-gap-sweep)`。当您在侧边终端中执行 `git checkout` 时，分支后缀会更新（基于修改时间缓存），因此 TUI 反映的是您实际活动的分支，而非启动时的分支。
- **每个提示的经过时间** — 轮次运行期间显示为 `⏱ 12s/3m 45s`（实时），轮次完成后冻结为 `⏲ 32s / 3m 45s`。第一个数字是自上次用户消息以来的时间；第二个是总会话持续时间。每次新提示时重置。
- **`🗜️ N`** — 运行中的会话被自动压缩的次数。首次压缩触发后出现。
- **`▶ N`** — 当前会话中正在运行的 `/background` 任务数。只要有至少一个任务在运行，就会出现。
- **`⚠ YOLO`** — 当 YOLO 模式开启时（`hermes --yolo`、`/yolo` 或 `HERMES_YOLO_MODE=1`）显示可见警告。相同的徽章也会出现在启动横幅中，因此您不会在未注意的情况下启动自动审批会话。

## 配置

TUI 遵循所有标准 Hermes 配置：`~/.hermes/config.yaml`、配置文件、个性化设置、皮肤、快速命令、凭证池、记忆提供程序、工具/技能启用状态。不存在 TUI 特有的配置文件。

少量键专门用于调整 TUI 界面：

```yaml
display:
  skin: default              # 任何内置或自定义皮肤
  personality: helpful
  details_mode: collapsed    # hidden | collapsed | expanded — 全局折叠面板默认值
  sections:                  # 可选：按部分覆盖（任何子集）
    thinking: expanded       # 始终展开
    tools: expanded          # 始终展开
    activity: collapsed      # 重新选择启用活动面板（默认隐藏）
  mouse_tracking: all        # off | wheel | buttons | all (或为向后兼容使用 true/false)。
                             #   wheel   — 1000+1006 (滚动 + 点击；无拖拽，无悬停 —
                             #             推荐在 tmux 内使用，以避免悬停事件导致的
                             #             提示行“剪贴板中无图像”的干扰信息)
                             #   buttons — 为终端端的拖拽选择添加 1002
                             #   all     — 为悬停添加 1003 (滚动条悬停分页、
                             #             链接鼠标进入等)
```

运行时切换：

- `/details [hidden|collapsed|expanded|cycle]` — 设置全局模式
- `/details <部分> [hidden|collapsed|expanded|reset]` — 覆盖单个部分
  （部分：`thinking`, `tools`, `subagents`, `activity`）

**默认可见性**

TUI 带有预设的按部分默认值，将对话轮次作为实时记录流式传输，而不是显示一长串折叠箭头：

- `thinking` — **展开**。推理过程随模型输出内联流式显示。
- `tools` — **展开**。工具调用及其结果默认展开显示。
- `subagents` — 遵循全局 `details_mode`（默认在折叠箭头下收起 — 在实际发生委托之前保持安静）。
- `activity` — **隐藏**。环境元数据（网关提示、终端平价提示、后台通知）对大多数日常使用来说是噪音。工具失败仍然会在失败的工具行内联显示；当所有面板都隐藏时，环境错误/警告会通过浮动警告的备用机制显示。

按部分覆盖优先于该部分的默认设置和全局 `details_mode`。要重新布局：

- `display.sections.thinking: collapsed` — 将思考过程放回折叠箭头下
- `display.sections.tools: collapsed` — 将工具调用放回折叠箭头下
- `display.sections.activity: collapsed` — 重新选择启用活动面板
- 在运行时使用 `/details <部分> <模式>`

在 `display.sections` 中显式设置的任何内容都优先于默认设置，因此现有配置可以保持不变地继续工作。

## 会话

TUI 和经典命令行界面共享会话 — 两者都写入同一个 `~/.hermes/state.db`。您可以在其中一个中开始会话，在另一个中恢复。会话选择器会显示来自两个来源的会话，并带有来源标签。

请参阅[会话](sessions.md)了解生命周期、搜索、压缩和导出。

## 连接到正在运行的网关

默认情况下，TUI 会生成其进程内的网关，因此每个 TUI 实例都是自包含的。如果您已经有一个长期运行的网关（例如在 tmux 中运行 `hermes gateway run`，或者 systemd / launchd 服务），您可以将 TUI 指向该网关 — 这样 TUI 就变成了一个轻量级客户端，并与连接到同一网关的每个其他界面（消息平台、Web 仪表板、其他 TUI 会话）共享状态。

启动前通过环境变量设置 websocket URL：

```bash
export HERMES_TUI_GATEWAY_URL="ws://localhost:8765/api/ws?token=<认证令牌>"
hermes --tui
```

令牌来自网关的 API 认证配置（参见 [API 服务器](features/api-server.md)）。设置环境变量后，TUI 会：

- 完全跳过生成本地网关 — 不会有重复的平台适配器，不会有端口冲突。
- 将每个操作（斜杠命令、图像附加、浏览器进度、语音事件……）通过 websocket 路由到共享网关。
- 如果网关 URL 在请求之间轮换（新令牌），会自动重新连接。

这与 Web 仪表板内嵌的 TUI 使用的通道相同（参见 [Web 仪表板](features/web-dashboard.md#chat)）— 一个网关，多个客户端。

## 恢复到经典命令行界面

启动 `hermes`（不带 `--tui`）将保持在经典命令行界面。要让机器优先使用 TUI，请在您的 shell 配置文件中设置 `HERMES_TUI=1`。要恢复，取消设置它。

如果 TUI 启动失败（没有 Node、缺少 bundle、TTY 问题），Hermes 会打印诊断信息并回退 — 而不是让您陷入困境。

## 另请参阅

- [命令行界面](cli.md) — 完整的斜杠命令和键绑定参考（共享）
- [会话](sessions.md) — 恢复、分支和历史记录
- [皮肤与主题](features/skins.md) — 为横幅、状态栏和覆盖层设置主题
- [语音模式](features/voice-mode.md) — 在两种界面中均可使用
- [配置](configuration.md) — 所有配置键