---
sidebar_position: 2
title: "TUI"
description: "为 Hermes 启动现代终端用户界面 — 支持鼠标操作、丰富的覆盖层以及非阻塞式输入。"
---

# TUI

TUI 是 Hermes 的现代前端界面 — 一个由与[经典 CLI](cli.md) 相同的 Python 运行时支持的终端用户界面。相同的智能体、相同的会话、相同的斜杠命令；为您提供一个更简洁、响应更迅速的交互界面。

这是推荐的交互式运行 Hermes 的方式。

## 启动

```bash
# 启动 TUI
hermes --tui

# 恢复最新的 TUI 会话（若不存在则回退到最新的经典会话）
hermes --tui -c
hermes --tui --continue

# 通过 ID 或标题恢复特定会话
hermes --tui -r 20260409_000000_aa11bb
hermes --tui --resume "my t0p session"

# 直接运行源码 — 跳过预构建步骤（适用于 TUI 贡献者）
hermes --tui --dev
```

您也可以通过环境变量启用它：

```bash
export HERMES_TUI=1
hermes          # 现在将使用 TUI
hermes chat     # 同样适用
```

经典 CLI 仍作为默认选项保留。[CLI 接口](cli.md)中记录的所有功能 — 斜杠命令、快捷命令、技能预加载、人格设定、多行输入、中断操作 — 在 TUI 中均可完全相同地使用。

## 为何选择 TUI

- **即时首帧渲染** —— 横幅在应用加载完成前即绘制，因此 Hermes 启动时终端不会显得卡顿。
- **非阻塞输入** —— 在会话就绪前即可输入并排队消息。一旦智能体上线，您的第一个提示立即发送。
- **丰富的覆盖层** —— 模型选择器、会话选择器、批准和澄清提示均以模态面板形式呈现，而非内联流程。
- **实时会话面板** —— 工具和技能在初始化时逐步填充。
- **鼠标友好选择** —— 拖拽高亮时采用统一背景色，而非 SGR 反色。使用终端的正常复制手势进行复制。
- **备用屏幕渲染** —— 差异更新意味着流式传输时无闪烁，退出后无滚动回显杂乱。
- **编辑器功能支持** —— 长代码片段内联粘贴折叠、`Cmd+V` / `Ctrl+V` 文本粘贴（带剪贴板图像回退）、括号粘贴安全机制，以及图像/文件路径附件标准化。

相同的[皮肤](features/skins.md)和[人格](features/personality.md)适用。使用 `/skin ares`、`/personality pirate` 可在会话中途切换，UI 实时重绘。查看[皮肤与主题](features/skins.md)以获取完整的可自定义键列表，以及哪些键适用于经典模式与 TUI 模式 —— TUI 遵循横幅调色板、UI 颜色、提示符字形/颜色、会话显示、补全菜单、选择背景、`tool_prefix` 和 `help_header`。

## 要求

- **Node.js** ≥ 20 —— TUI 作为 Python CLI 启动的子进程运行。`hermes doctor` 会验证此要求。
- **TTY** —— 与经典 CLI 类似，管道 stdin 或在非交互环境中运行时会回退到单查询模式。

首次启动时，Hermes 会将 TUI 的 Node 依赖项安装到 `ui-tui/node_modules`（一次性操作，耗时几秒）。后续启动速度很快。如果您拉取了新版本的 Hermes，当源文件比 dist 更新时，TUI 包会自动重建。

### 外部预构建

提供预构建包的分发版（如 Nix、系统包）可让 Hermes 指向该路径：

```bash
export HERMES_TUI_DIR=/path/to/prebuilt/ui-tui
hermes --tui
```

该目录必须包含 `dist/entry.js` 和最新的 `node_modules`。

## 键绑定

键绑定与[经典 CLI](cli.md#keybindings) 完全一致。唯一的行为差异：

- **鼠标拖拽** 使用统一的选择背景高亮文本。
- **`Cmd+V` / `Ctrl+V`** 首先尝试普通文本粘贴，然后回退到 OSC52/原生剪贴板读取，最后当剪贴板或粘贴内容解析为图像时附加图像。
- **`/terminal-setup`** 为本地 VS Code / Cursor / Windsurf 终端安装绑定，以在 macOS 上获得更好的 `Cmd+Enter` 和撤销/重做一致性。
- **斜杠自动补全** 以带描述的浮动面板打开，而非内联下拉菜单。
- **`Ctrl+X`** —— 当已排队的消息被高亮时（在智能体仍在运行时发送），将其从队列中删除。**`Esc`** 取消编辑并取消高亮，但不删除。
- **`Ctrl+G` / `Ctrl+X Ctrl+E`** —— 在 `$EDITOR` 中打开当前输入缓冲区，用于多行/长提示编辑；保存并退出会将内容作为提示发回。

## 斜杠命令

所有斜杠命令均可正常使用。其中一些由 TUI 独占 —— 它们产生更丰富的输出或以覆盖层形式呈现，而非内联面板：

| 命令 | TUI 行为 |
|---------|--------------|
| `/help` | 分类命令覆盖层，可用方向键导航 |
| `/sessions` | 模态会话选择器 —— 预览、标题、令牌总数、内联恢复 |
| `/model` | 按提供商分组的模态模型选择器，带成本提示 |
| `/skin` | 实时预览 —— 主题更改在您浏览时即生效 |
| `/details` | 切换详细工具调用详情（全局或每节） |
| `/usage` | 丰富的令牌/成本/上下文面板 |
| `/agents`（别名 `/tasks`） | 可观测性覆盖层 —— 实时子智能体树，带终止/暂停控制、每分支成本/令牌/文件汇总、逐轮历史 |
| `/reload` | 将 `~/.hermes/.env` 重新读入运行中的 TUI 进程，使新添加的 API 密钥无需重启即可生效 |
| `/mouse` | 运行时切换鼠标跟踪开/关（也持久化到 `config.yaml` 的 `display.mouse_tracking`） |

其他所有斜杠命令（包括已安装的技能、快速命令和人格切换）与经典 CLI 完全相同。参见[斜杠命令参考](../reference/slash-commands.md)。

## LaTeX 数学渲染

TUI 的 Markdown 流水线内联渲染 LaTeX 数学公式：`$E = mc^2$` 和 `$$\frac{a}{b}$$` 渲染为 Unicode 格式数学公式，而非原始 TeX 源码。支持内联和块级数学；不支持的语法回退到在代码 span 中显示字面 TeX，以便仍可复制。

此功能始终启用 —— 无需配置。经典 CLI 保留原始 TeX。

## 浅色终端检测

TUI 自动检测浅色终端并相应切换到浅色主题。检测分三层：

1. `HERMES_TUI_THEME` 环境变量 —— 最高优先级。值：`light`、`dark` 或原始 6 字符背景十六进制（如 `ffffff`、`1a1a2e`）。
2. `COLORFGBG` 环境变量 —— xterm 衍生终端使用的经典“我的背景色是什么？”提示。
3. 通过 OSC 11 探测终端背景 —— 适用于未设置 `COLORFGBG` 的现代终端（Ghostty、Warp、iTerm2、WezTerm、Kitty）。

如果您希望永久使用浅色主题，无论终端如何：

```bash
export HERMES_TUI_THEME=light
```

## 忙碌指示器样式

状态栏的 FaceTicker 是可插拔的 —— 默认在智能体工作时每 2.5 秒轮换 Hermes 的可爱表情调色板。通过配置选择不同样式（或 `none` 表示极简圆点）：

```yaml
display:
  busy_indicator:
    style: kawaii     # kawaii | minimal | dots | wings | none
```

样式附带匹配的字形宽度，因此状态栏其余部分在轮换时不会抖动。

## 自动恢复

默认情况下，`hermes --tui` 每次启动都会创建新会话。要自动重新连接到最近的 TUI 会话（当您的终端或 SSH 连接意外断开时很有用），请选择启用：

```bash
export HERMES_TUI_RESUME=1          # 最近的 TUI 会话
# 或：
export HERMES_TUI_RESUME=<session-id>   # 特定会话
```

取消设置变量或显式传递 `--resume <id>` 可在每次启动时覆盖此设置。

## 状态行

TUI 的状态行实时跟踪智能体状态：

| 状态 | 含义 |
|--------|---------|
| `starting agent…` | 会话 ID 已激活；工具和技能仍在上线。您可以输入 —— 消息排队，就绪后发送。 |
| `ready` | 智能体空闲，接受输入。 |
| `thinking…` / `running…` | 智能体正在推理或运行工具。 |
| `interrupted` | 当前轮次已取消；按 Enter 重新发送。 |
| `forging session…` / `resuming…` | 初始连接或 `--resume` 握手。 |

每皮肤的状态栏颜色和阈值与经典 CLI 共享 —— 参见[皮肤](features/skins.md)以进行自定义。

状态行还显示：

- **带 Git 分支的工作目录** —— `~/projects/hermes-agent (docs/two-week-gap-sweep)`。当您在侧边终端执行 `git checkout` 时，分支后缀会更新（基于 mtime 缓存），因此 TUI 反映您实际活跃的分支，而非启动时的分支。
- **每提示耗时** —— 轮次运行时显示 `⏱ 12s/3m 45s`（实时），轮次完成后冻结为 `⏲ 32s / 3m 45s`。第一个数字是自上次用户消息以来的时间；第二个是总会话持续时间。每次新提示时重置。

## 配置

TUI 遵循所有标准 Hermes 配置：`~/.hermes/config.yaml`、配置文件、人格、皮肤、快速命令、凭据池、内存提供程序、工具/技能启用。不存在 TUI 专用配置文件。

少量键专门用于调整 TUI 表面：

```yaml
display:
  skin: default              # 任何内置或自定义皮肤
  personality: helpful
  details_mode: collapsed    # hidden | collapsed | expanded —— 全局手风琴默认值
  sections:                  # 可选：每节覆盖（任何子集）
    thinking: expanded       # 始终打开
    tools: expanded          # 始终打开
    activity: collapsed      # 选择重新加入活动面板（默认隐藏）
  mouse_tracking: true       # 如果您的终端与鼠标报告冲突，请禁用
```

运行时切换：

- `/details [hidden|collapsed|expanded|cycle]` —— 设置全局模式
- `/details <section> [hidden|collapsed|expanded|reset]` —— 覆盖某一节
  （节：`thinking`、`tools`、`subagents`、`activity`）

**默认可见性**

TUI 提供有倾向性的每节默认值，将轮次作为实时记录流式传输，而非一连串 Chevron：

- `thinking` —— **展开**。模型推理时内联流式传输。
- `tools` —— **展开**。工具调用及其结果呈开放状态。
- `subagents` —— 继承全局 `details_mode`（默认在 Chevron 下折叠 —— 直到实际发生委派时才显示）。
- `activity` —— **隐藏**。环境元信息（网关提示、终端一致性 nudges、后台通知）对大多数日常使用而言是噪音。工具失败仍会在失败工具行内联渲染；当所有面板隐藏时，环境错误/警告通过浮动警报后备机制显示。

每节覆盖优先于节默认值和全局 `details_mode`。要重塑布局：

- `display.sections.thinking: collapsed` —— 将推理放回 Chevron 下
- `display.sections.tools: collapsed` —— 将工具调用放回 Chevron 下
- `display.sections.activity: collapsed` —— 选择重新加入活动面板
- 运行时使用 `/details <section> <mode>`

在 `display.sections` 中显式设置的任何内容都优先于默认值，因此现有配置保持不变。

## 会话

会话在 TUI 和经典 CLI 之间共享——两者都写入同一个 `~/.hermes/state.db` 文件。你可以在一个界面中启动会话，在另一个界面中恢复。会话选择器会显示来自两个来源的会话，并带有来源标签。

请参阅 [会话](sessions.md) 了解生命周期、搜索、压缩和导出。

## 恢复到经典 CLI

启动 `hermes`（不带 `--tui` 参数）将保持在经典 CLI 模式。要让机器优先使用 TUI，请在 shell 配置文件中设置 `HERMES_TUI=1`。要恢复，请取消设置该变量。

如果 TUI 启动失败（无 Node.js、缺少 bundle、TTY 问题），Hermes 会打印诊断信息并回退——而不是让你卡住。

## 另见

- [CLI 界面](cli.md) —— 完整的斜杠命令和键绑定参考（共享）
- [会话](sessions.md) —— 恢复、分支和历史记录
- [皮肤与主题](features/skins.md) —— 为主题设置横幅、状态栏和覆盖层
- [语音模式](features/voice-mode.md) —— 在两个界面中均可使用
- [配置](configuration.md) —— 所有配置键