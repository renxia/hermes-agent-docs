---
sidebar_position: 2
title: "TUI"
description: "启动 Hermes 的现代终端 UI —— 鼠标友好、丰富覆盖层、非阻塞输入。"
---

# TUI

TUI 是 Hermes 的现代化前端 —— 一个终端 UI，其底层与 [经典 CLI](cli.md) 使用相同的 Python 运行时。同样的智能体、相同的会话、相同的斜杠命令；但提供了一个更简洁、响应更迅速的交互界面。

这是运行 Hermes 进行交互式操作的推荐方式。

## 启动

```bash
# 启动 TUI
hermes --tui

# 恢复最新的 TUI 会话（若无则回退到最新的经典会话）
hermes --tui -c
hermes --tui --continue

# 通过 ID 或标题恢复特定会话
hermes --tui -r 20260409_000000_aa11bb
hermes --tui --resume "我的顶级会话"

# 直接运行源代码 —— 跳过预构建步骤（适用于 TUI 开发者）
hermes --tui --dev
```

也可以通过环境变量启用：

```bash
export HERMES_TUI=1
hermes          # 现在将使用 TUI
hermes chat     # 同上
```

经典 CLI 作为默认选项仍可用。[CLI 界面](cli.md) 中记录的所有功能 —— 斜杠命令、快速命令、技能预加载、个性设置、多行输入、中断操作 —— 在 TUI 中都能同样工作。

## 为何选择 TUI

- **即时首帧渲染** — 在应用完成加载前，横幅界面就会先行显示，因此终端在 Hermes 启动过程中不会出现卡顿感。
- **非阻塞式输入** — 在会话就绪前即可输入并排队消息。您的首条提示将在智能体上线瞬间发送。
- **富覆盖层** — 模型选择器、会话选择器、批准与澄清提示均渲染为模态面板，而非内联流程。
- **实时会话面板** — 工具与技能在初始化过程中逐步填充。
- **鼠标友好选择** — 通过拖动高亮文本，背景均匀一致，无需使用 SGR 反显。使用终端的常规复制手势即可复制。
- **交替屏幕渲染** — 差异更新意味着流式传输时无闪烁，退出后无回滚杂乱。
- **编辑器便利功能** — 内联折叠粘贴长片段、`Cmd+V` / `Ctrl+V` 文本粘贴（带剪贴板图片回退）、带括号粘贴安全机制，以及图片/文件路径附件标准化。

相同的[皮肤](features/skins.md)和[个性](features/personality.md)适用。在会话中可通过 `/skin ares`、`/personality pirate` 实时切换，界面将即时重绘。完整可定制键列表及其在经典版与 TUI 版中的适用性，请参见[皮肤与主题](features/skins.md) — TUI 会遵循横幅调色板、UI 颜色、提示符字符/颜色、会话显示、补全菜单、选择背景、`tool_prefix` 和 `help_header` 的设置。

## 系统要求

- **Node.js** ≥ 20 — TUI 作为从 Python CLI 启动的子进程运行。`hermes doctor` 命令可验证此配置。
- **TTY** — 与经典 CLI 类似，管道化标准输入或在非交互环境中运行将回退到单次查询模式。

首次启动时，Hermes 会将 TUI 的 Node 依赖安装到 `ui-tui/node_modules`（一次性操作，耗时几秒）。后续启动速度很快。如果您拉取了新版本的 Hermes，当源文件比 dist 文件更新时，TUI 包会自动重新构建。

### 外部预构建

发行包中若包含预构建包（Nix、系统包），可将 Hermes 指向该包：

```bash
export HERMES_TUI_DIR=/path/to/prebuilt/ui-tui
hermes --tui
```

该目录必须包含 `dist/entry.js` 和最新的 `node_modules`。

## 快捷键

快捷键与[经典 CLI](cli.md#keybindings) 完全相同。仅有的行为差异如下：

- **鼠标拖动** 使用均匀的选择背景高亮文本。
- **`Cmd+V` / `Ctrl+V`** 首先尝试常规文本粘贴，然后回退到 OSC52/原生剪贴板读取，最后当剪贴板或粘载内容解析为图片时，进行图片附件。
- **`/terminal-setup`** 会安装本地 VS Code / Cursor / Windsurf 终端绑定，以便在 macOS 上更好地实现 `Cmd+Enter` 和撤销/重做功能。
- **斜杠命令自动补全** 以浮动面板形式打开，包含描述信息，而非内联下拉菜单。
- **`Ctrl+X`** — 当高亮显示排队消息（在智能体运行时发送）时，可将其从队列中删除。**`Esc`** 取消编辑并取消高亮，但不删除。
- **`Ctrl+G` / `Ctrl+X Ctrl+E`** — 在 `$EDITOR` 中打开当前输入缓冲区，用于多行长提示编辑；保存并退出后，内容将作为提示发送。

## 斜杠命令

所有斜杠命令的工作方式保持不变。部分命令由 TUI 管理 — 它们能产生更丰富的输出或渲染为覆盖层，而非内联面板：

| 命令 | TUI 行为 |
|---------|--------------|
| `/help` | 覆盖层，命令分类显示，支持方向键导航 |
| `/sessions` | 模态会话选择器 — 可预览、重命名、查看 token 总数、内联恢复 |
| `/model` | 模态模型选择器，按提供商分组，附带费用提示 |
| `/skin` | 实时预览 — 浏览主题时更改即时生效 |
| `/details` | 切换详细的工具调用详情（全局或按部分） |
| `/usage` | 丰富的 token / 费用 / 上下文面板 |
| `/agents`（别名 `/tasks`） | 可观测性覆盖层 — 实时子智能体树，带终止/暂停控制，每分支的费用 / token / 文件汇总，逐轮历史记录 |
| `/reload` | 重新读取 `~/.hermes/.env` 到运行中的 TUI 进程，使新添加的 API 密钥无需重启即可生效 |
| `/mouse` | 在运行时切换鼠标跟踪开关（同时持久化到 `config.yaml` 中的 `display.mouse_tracking`） |

所有其他斜杠命令（包括已安装的技能、快捷命令和个性切换）与经典 CLI 的工作方式完全相同。请参阅[斜杠命令参考](../reference/slash-commands.md)。

## LaTeX 数学公式渲染

TUI 的 markdown 处理流程支持内联渲染 LaTeX 数学公式：`$E = mc^2$` 和 `$$\frac{a}{b}$$` 会渲染为 Unicode 格式的数学符号，而非原始的 TeX 源码。支持内联和块级公式；对于不支持的语法，会回退显示包裹在代码片段中的原始 TeX 文本，以便保持可复制性。

此功能始终开启 — 无需配置。经典 CLI 则保持原始 TeX 显示。

## 浅色终端检测

TUI 会自动检测浅色终端并相应切换到浅色主题。检测通过三个层级进行：

1. `HERMES_TUI_THEME` 环境变量 — 优先级最高。值：`light`、`dark` 或原始的 6 字符背景色十六进制值（例如 `ffffff`、`1a1a2e`）。
2. `COLORFGBG` 环境变量 — xterm 系列终端使用的经典“我的背景色是什么？”提示。
3. 通过 OSC 11 探测终端背景 — 适用于现代终端（Ghostty、Warp、iTerm2、WezTerm、Kitty），这些终端不设置 `COLORFGBG`。

如果您希望始终使用浅色主题，无论终端如何：

```bash
export HERMES_TUI_THEME=light
```

## 忙碌指示器样式

状态栏的忙碌指示器是可插拔的 — 默认情况下，在智能体工作期间，每 2.5 秒轮换一次 Hermes 的可爱表情面板。可通过配置或 `/indicator` 斜杠命令选择其他样式：

```yaml
display:
  tui_status_indicator: kaomoji   # kaomoji | emoji | unicode | ascii
```

或在会话中：`/indicator emoji`（等）。各样式附带匹配的字符宽度，确保旋转时状态栏的其他部分不会抖动。

## 自动恢复

默认情况下，`hermes --tui` 每次启动都会创建新会话。若要自动重新连接到最近的 TUI 会话（当您的终端或 SSH 连接意外中断时非常有用），请进行如下设置：

```bash
export HERMES_TUI_RESUME=1          # 最近的 TUI 会话
# 或：
export HERMES_TUI_RESUME=<session-id>   # 特定会话
```

取消设置该变量或显式传递 `--resume <id>` 可覆盖单次启动的设置。

## 状态行

TUI 的状态行实时跟踪智能体状态：

| 状态 | 含义 |
|--------|---------|
| `starting agent…` | 会话 ID 已生效；工具和技能仍在加载中。您可以输入 — 消息会排队并在就绪时发送。 |
| `ready` | 智能体空闲，接受输入。 |
| `thinking…` / `running…` | 智能体正在推理或运行工具。 |
| `interrupted` | 当前轮次已取消；按 Enter 键可重新发送。 |
| `forging session…` / `resuming…` | 初始连接或 `--resume` 握手。 |

每个皮肤的状态栏颜色和阈值与经典 CLI 共享 — 自定义选项请参见[皮肤](features/skins.md)。

状态行还显示：

- **包含 git 分支的工作目录** — `~/projects/hermes-agent (docs/two-week-gap-sweep)`。当您在侧边终端中执行 `git checkout` 时，分支后缀会更新（基于修改时间缓存），因此 TUI 反映的是您实际活动的分支，而非启动时的状态。
- **每次提示的耗时** — 轮次运行时显示 `⏱ 12s/3m 45s`（实时更新），轮次完成后冻结为 `⏲ 32s / 3m 45s`。第一个数字是自上次用户消息以来的时间；第二个是总会话时长。每次新提示都会重置。

## 配置

TUI 遵循所有标准的 Hermes 配置：`~/.hermes/config.yaml`、配置文件、个性、皮肤、快捷命令、凭证池、记忆提供程序、工具/技能启用。不存在 TUI 专用的配置文件。

少数键专门用于调整 TUI 界面：

```yaml
display:
  skin: default              # 任何内置或自定义皮肤
  personality: helpful
  details_mode: collapsed    # hidden | collapsed | expanded — 全局手风琴默认值
  sections:                  # 可选：按部分覆盖（任意子集）
    thinking: expanded       # 始终展开
    tools: expanded          # 始终展开
    activity: collapsed      # 重新启用活动面板（默认隐藏）
  mouse_tracking: true       # 如果您的终端与鼠标报告冲突，请禁用
```

运行时切换：

- `/details [hidden|collapsed|expanded|cycle]` — 设置全局模式
- `/details <section> [hidden|collapsed|expanded|reset]` — 覆盖单个部分
  （部分：`thinking`、`tools`、`subagents`、`activity`）

**默认可见性**

TUI 配备了针对各部分的固执默认设置，将轮次流式传输为实时记录，而非一堵尖括号墙：

- `thinking` — **展开**。推理过程随模型输出内联流式显示。
- `tools` — **展开**。工具调用及其结果默认展开显示。
- `subagents` — 回退到全局 `details_mode`（默认在尖括号下折叠 — 在实际发生委托之前保持安静）。
- `activity` — **隐藏**。环境元信息（网关提示、终端兼容性提示、后台通知）对大多数日常使用来说属于噪音。工具失败仍会在失败的工具行上内联渲染；当所有面板都隐藏时，环境错误/警告会通过浮动警报后备机制显示。

各部分的覆盖设置优先于该部分的默认值和全局 `details_mode`。若要重新布局：

- `display.sections.thinking: collapsed` — 将思考过程放回尖括号下
- `display.sections.tools: collapsed` — 将工具调用放回尖括号下
- `display.sections.activity: collapsed` — 重新启用活动面板
- `/details <section> <mode>` 运行时设置

在 `display.sections` 中显式设置的任何内容都优先于默认值，因此现有配置无需更改即可继续使用。

## 会话

会话在 TUI 和经典命令行界面之间共享——两者都会写入同一个 `~/.hermes/state.db`。你可以在一个界面中启动会话，在另一个界面中继续。会话选择器会显示来自两个来源的会话，并附有来源标签。

参见 [会话](sessions.md) 了解会话生命周期、搜索、压缩和导出。

## 切换回经典命令行界面

运行 `hermes`（不带 `--tui`）会保持使用经典命令行界面。要让机器默认使用 TUI，请在您的 shell 配置文件中设置 `HERMES_TUI=1`。要切换回来，取消设置即可。

如果 TUI 无法启动（没有 Node、缺少构建包、终端问题），Hermes 会打印诊断信息并自动降级——而不是让您陷入困境。

## 另请参阅

- [命令行界面](cli.md) — 完整的斜杠命令和快捷键参考（两者通用）
- [会话](sessions.md) — 恢复、分支和历史记录
- [外观与主题](features/skins.md) — 为横幅、状态栏和覆盖层设置主题
- [语音模式](features/voice-mode.md) — 在两种界面中均可用
- [配置](configuration.md) — 所有配置项