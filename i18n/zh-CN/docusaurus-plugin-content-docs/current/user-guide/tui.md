---
sidebar_position: 2
title: "TUI"
description: "启动 Hermes 的现代终端用户界面 —— 支持鼠标操作、丰富的叠加层与非阻塞输入。"
---

# TUI

TUI 是 Hermes 的现代前端界面 —— 一个由与 [经典命令行界面](cli.md) 相同的 Python 运行时支持的终端用户界面。相同的智能体、相同的会话、相同的斜杠命令；一个更简洁、响应更迅速的交互界面。

这是推荐用于与 Hermes 进行交互式运行的方式。

## 启动

```bash
# 启动 TUI
hermes --tui

# 恢复最近的 TUI 会话（若无则回退到最近的经典会话）
hermes --tui -c
hermes --tui --continue

# 通过会话 ID 或标题恢复特定会话
hermes --tui -r 20260409_000000_aa11bb
hermes --tui --resume "my t0p session"

# 直接运行源码 —— 跳过预构建步骤（供 TUI 开发者使用）
hermes --tui --dev
```

您也可以通过环境变量启用：

```bash
export HERMES_TUI=1
hermes          # 现在使用 TUI
hermes chat     # 同上
```

经典命令行界面仍作为默认选项可用。[命令行界面](cli.md) 中记录的所有功能 —— 斜杠命令、快速命令、技能预加载、个性设置、多行输入、中断 —— 在 TUI 中均以相同方式运作。

## 为什么选择TUI

- **瞬间首帧** — 在应用程序加载完成前，横幅就会绘制完毕，因此当Hermes启动时，终端不会出现卡顿感。
- **非阻塞输入** — 在会话准备就绪之前，您可以输入和排队消息。您的第一个提示将在智能体上线时立即发送。
- **丰富的叠加层** — 模型选择器、会话选择器、批准和澄清提示都以模态面板的形式呈现，而非内联流程。
- **实时会话面板** — 工具和技能在初始化时会逐步填充。
- **鼠标友好选择** — 拖动选中的文本具有统一的背景色，而非SGR反色。使用终端的常规复制手势进行复制。
- **备选屏幕渲染** — 差异化更新意味着在流式传输时不会闪烁，退出后不会留下滚动混乱。
- **编辑器便利功能** — 长片段的内联粘贴折叠，`Cmd+V` / `Ctrl+V` 文本粘贴并带有剪贴板图片回退，括号粘贴安全性，以及图像/文件路径附件规范化。

同样适用[皮肤](features/skins.md)和[个性](features/personality.md)。可使用 `/skin ares`、`/personality pirate` 在会话中途切换，UI会实时重绘。完整的自定义键列表及其在经典CLI与TUI中的适用情况，请参阅[皮肤与主题](features/skins.md) — TUI会遵循横幅调色板、UI颜色、提示符字形/颜色、会话显示、补全菜单、选中背景、`tool_prefix` 和 `help_header`。

### 可折叠的横幅部分

TUI启动横幅将运行时信息分为四个可折叠部分，每个部分在标题旁以 `▸` / `▾` 箭头符号渲染：

| 部分       | 默认状态 |
|------------|----------|
| 工具       | 展开     |
| 技能       | 折叠     |
| 系统提示   | 折叠     |
| MCP 服务器 | 折叠     |

点击部分标题（或其箭头符号）任何位置即可切换。工具列表默认展开，因为它是会话开始时最常查看的部分；技能、系统提示和MCP服务器默认折叠，这样即使您安装了数十个技能或连接了许多MCP服务器，横幅也能保持紧凑。状态是横幅实例本地的，因此下次启动会重置为默认值。

## 环境要求

- **Node.js** ≥ 20 — TUI作为从Python CLI启动的子进程运行。`hermes doctor` 可以验证这一点。
- **TTY** — 与经典CLI类似，管道标准输入或在非交互式环境中运行将回退到单查询模式。

首次启动时，Hermes会将TUI的Node依赖项安装到 `ui-tui/node_modules`（一次性操作，需几秒钟）。后续启动很快。如果您拉取了新版本的Hermes，当源代码比dist目录中的文件更新时，TUI捆绑包会自动重新构建。

### 外部预构建

提供预构建捆绑包的发行版（Nix、系统包）可以将Hermes指向它：

```bash
export HERMES_TUI_DIR=/path/to/prebuilt/ui-tui
hermes --tui
```

该目录必须包含 `dist/entry.js`。

## 键位绑定

键位绑定与[经典CLI](cli.md#keybindings)完全一致。仅有的行为差异：

- **鼠标拖动** 通过统一的选择背景高亮显示文本。
- **`Cmd+V` / `Ctrl+V`** 首先尝试常规文本粘贴，然后回退到OSC52/原生剪贴板读取，最后当剪贴板或粘贴的内容解析为图像时进行图像附件操作。
- **`/terminal-setup`** 安装本地 VS Code / Cursor / Windsurf 终端绑定，以便在macOS上更好地支持 `Cmd+Enter` 以及撤销/重做。
- **斜杠命令自动补全** 以带有描述的浮动面板形式打开，而不是内联下拉菜单。
- **`Ctrl+X`** — 当高亮显示排队消息时（在智能体仍在运行时发送），将其从队列中删除。**`Esc`** 取消编辑并取消高亮，但不删除。
- **`Ctrl+G` / `Ctrl+X Ctrl+E`** — 在 `$EDITOR` 中打开当前输入缓冲区，用于多行/长提示词的编写；保存并退出后，内容将作为提示发送回来。

## 斜杠命令

所有斜杠命令均不变。有几个是TUI独有的——它们产生更丰富的输出或作为叠加层而非内联面板呈现：

| 命令       | TUI行为                                                              |
|------------|----------------------------------------------------------------------|
| `/help`    | 叠加层，分类命令，可通过箭头键导航                                   |
| `/sessions`| 模态会话选择器 — 可预览、标题、令牌总量、内联恢复                     |
| `/model`   | 按提供商分组的模态模型选择器，带成本提示                             |
| `/skin`    | 实时预览 — 浏览时应用主题更改                                        |
| `/details` | 切换详细的工具调用详情（全局或每个部分）                             |
| `/usage`   | 丰富的令牌/成本/上下文面板                                           |
| `/agents` (别名 `/tasks`) | 可观测性叠加层 — 实时子智能体树，带有终止/暂停控制，每个分支的成本/令牌/文件汇总，逐轮历史记录 |
| `/reload`  | 重新读取 `~/.hermes/.env` 到正在运行的TUI进程中，以便新添加的API密钥无需重启即可生效 |
| `/mouse [on\|off\|toggle\|wheel\|buttons\|all]` | 在运行时选择鼠标跟踪预设（也会持久化到 `config.yaml` 中的 `display.mouse_tracking`）。`wheel` (1000+1006) 保持滚轮滚动，而不会产生悬停事件导致tmux在提示行区域频繁显示“剪贴板中没有图像”；`buttons` 添加拖动选择；`all` 是默认设置，包含悬停驱动的UI。 |

所有其他斜杠命令（包括已安装的技能、快速命令和个性切换）与经典CLI完全相同。请参阅[斜杠命令参考](../reference/slash-commands.md)。

## LaTeX 数学渲染

TUI的Markdown处理流程支持内联渲染LaTeX数学公式：`$E = mc^2$` 和 `$$\frac{a}{b}$$` 会渲染为Unicode格式的数学公式，而不是原始的TeX源码。适用于内联和块级数学；不支持的语法会回退显示包裹在代码段中的原始TeX，以便仍可复制。

此功能始终开启——无需配置。经典CLI保留原始TeX。

## 浅色终端检测

TUI会自动检测浅色终端，并相应地切换到浅色主题。检测通过三层机制工作：

1. `HERMES_TUI_THEME` 环境变量 — 最高优先级。值：`light`、`dark` 或原始的6位字符背景十六进制值（例如 `ffffff`、`1a1a2e`）。
2. `COLORFGBG` 环境变量 — xterm派生终端使用的经典“我的背景颜色是什么？”提示。
3. 通过 OSC 11 探测终端背景 — 适用于未设置 `COLORFGBG` 的现代终端（Ghostty, Warp, iTerm2, WezTerm, Kitty）。

如果您希望无论终端如何都永久使用浅色主题：

```bash
export HERMES_TUI_THEME=light
```

## 忙碌指示器样式

状态栏忙碌指示器是可插拔的——默认情况下，在智能体工作期间，它每2.5秒轮换一次Hermes的kawaii表情面板。通过配置或 `/indicator` 斜杠命令选择不同的样式：

```yaml
display:
  tui_status_indicator: kaomoji   # kaomoji | emoji | unicode | ascii
```

或在会话中：`/indicator emoji`（等）。样式附带匹配的字符宽度，这样旋转时状态栏的其余部分不会抖动。

## 自动恢复

默认情况下，`hermes --tui` 每次启动都会开始一个新会话。要自动重新连接到最近的TUI会话（当您的终端或SSH连接意外断开时非常有用），可以选择加入：

```bash
export HERMES_TUI_RESUME=1          # 最近的TUI会话
# 或者：
export HERMES_TUI_RESUME=<session-id>   # 特定会话
```

取消设置该变量或显式传递 `--resume <id>` 以在每次启动时覆盖。

## 状态行

TUI的状态行实时跟踪智能体状态：

| 状态                     | 含义                                                                 |
|--------------------------|----------------------------------------------------------------------|
| `starting agent…`        | 会话ID已激活；工具和技能仍在上线中。您可以输入—消息会排队并在准备好时发送。 |
| `ready`                  | 智能体空闲，正在接受输入。                                           |
| `thinking…` / `running…` | 智能体正在推理或运行工具。                                           |
| `interrupted`            | 当前轮次已取消；按Enter键重新发送。                                  |
| `forging session…` / `resuming…` | 初始连接或 `--resume` 握手。                                         |

每个皮肤的状态栏颜色和阈值与经典CLI共享—自定义详情请参阅[皮肤](features/skins.md)。

状态行还显示：

- **带有git分支的工作目录** — `~/projects/hermes-agent (docs/two-week-gap-sweep)`。当您在侧边终端执行 `git checkout` 时（基于修改时间缓存），分支后缀会更新，因此TUI反映的是您实际活动的分支，而非启动时的分支。
- **每条提示的耗时** — 当轮次运行时显示 `⏱ 12s/3m 45s`（实时），轮次完成后冻结为 `⏲ 32s / 3m 45s`。第一个数字是自上一条用户消息以来的时间；第二个是总会话持续时间。每条新提示都会重置。
- **`🗜️ N`** — 运行中的会话已被自动压缩的次数。首次压缩触发后出现。
- **`▶ N`** — 当前会话中正在运行的 `/background` 任务数量。只要有一个任务在运行就会出现。
- **`⚠ YOLO`** — 当YOLO模式开启时（`hermes --yolo`、`/yolo` 或 `HERMES_YOLO_MODE=1`）显示的可见警告。相同的徽章也会出现在启动横幅中，因此您不会在未注意的情况下启动一个自动批准的会话。

# 配置

TUI 遵循所有标准 Hermes 配置：`~/.hermes/config.yaml`、配置文件、个性、皮肤、快速命令、凭证池、记忆提供商、工具/技能启用。没有 TUI 特定的配置文件。

少数几个键专门用于调整 TUI 界面：

```yaml
display:
  skin: default              # 任意内置或自定义皮肤
  personality: helpful
  details_mode: collapsed    # hidden | collapsed | expanded — 全局手风琴默认值
  sections:                  # 可选：每个部分的覆盖（任意子集）
    thinking: expanded       # 始终展开
    tools: expanded          # 始终展开
    activity: collapsed      # 重新选入活动面板（默认隐藏）
  mouse_tracking: all        # off | wheel | buttons | all（或使用 true/false 以保持向后兼容）。
                             #   wheel   — 1000+1006（滚动 + 点击；无拖动，无悬停 —
                             #             在 tmux 中推荐使用，以消除来自悬停事件的提示行
                             #             "剪贴板中无图像"的重复消息）
                             #   buttons — 为终端侧拖动选择添加 1002
                             #   all     — 为悬停添加 1003（滚动条悬停分页、
                             #             链接鼠标进入等）
```

运行时切换：

- `/details [hidden|collapsed|expanded|cycle]` — 设置全局模式
- `/details <section> [hidden|collapsed|expanded|reset]` — 覆盖单个部分
  （部分包括：`thinking`、`tools`、`subagents`、`activity`）

**默认可见性**

TUI 附带具有倾向性的每个部分默认值，将轮次流式传输为实时记录，而不是一大堆 chevron：

- `thinking` — **展开**。推理过程在模型生成时内联流式显示。
- `tools` — **展开**。工具调用及其结果会以打开状态呈现。
- `subagents` — 传递到全局 `details_mode`（默认在 chevron 下折叠 — 在委派实际发生之前保持安静）。
- `activity` — **隐藏**。环境元数据（网关提示、终端奇偶校验提醒、后台通知）对大多数日常使用来说是噪音。工具故障仍然在失败的工具行上内联呈现；当所有面板都隐藏时，环境错误/警告通过浮动警报的备份机制显示。

每个部分的覆盖优先于该部分的默认值和全局 `details_mode`。要重新布局：

- `display.sections.thinking: collapsed` — 将 thinking 放回 chevron 下
- `display.sections.tools: collapsed` — 将工具调用放回 chevron 下
- `display.sections.activity: collapsed` — 重新选入活动面板
- `/details <section> <mode>` 在运行时设置

在 `display.sections` 中显式设置的任何内容都优先于默认值，因此现有配置保持不变。

## 会话

会话在 TUI 和经典 CLI 之间共享 — 两者都写入同一个 `~/.hermes/state.db`。你可以在一个中开始会话，在另一个中恢复。会话选择器会显示来自这两个来源的会话，并带有来源标签。

请参阅 [会话](sessions.md) 了解生命周期、搜索、压缩和导出。

## 附加到正在运行的网关

默认情况下，TUI 生成自己的进程内网关，因此每个 TUI 实例都是自包含的。如果你已经有一个长期运行的网关（例如在 tmux 中运行 `hermes gateway run`，或者 systemd / launchd 服务），你可以将 TUI 指向该网关 — 这样 TUI 就变成一个瘦客户端，并与附加到同一网关的所有其他表面（消息传递平台、Web 仪表板、其他 TUI 会话）共享状态。

在启动前通过环境变量设置 WebSocket URL：

```bash
export HERMES_TUI_GATEWAY_URL="ws://localhost:8765/api/ws?token=<auth-token>"
hermes --tui
```

令牌来自网关的 API 身份验证配置（请参阅 [API 服务器](features/api-server.md)）。设置环境变量后，TUI 将：

- 完全跳过生成本地网关 — 没有重复的平台适配器，没有端口冲突。
- 将每个操作（斜杠命令、图像附加、浏览器进度、语音事件、...）通过 WebSocket 路由到共享网关。
- 如果网关 URL 在请求之间轮换（新令牌），则自动重新连接。

这与 Web 仪表板的嵌入式 TUI 使用的通道相同（请参阅 [Web 仪表板](features/web-dashboard.md#chat)）— 一个网关，多个客户端。

## 恢复到经典 CLI

启动 `hermes`（不带 `--tui`）将保持使用经典 CLI。要让机器首选 TUI，请在 shell 配置文件中设置 `HERMES_TUI=1`。要恢复，取消设置它。

如果 TUI 启动失败（没有 Node、缺少包、TTY 问题），Hermes 会打印诊断信息并回退 — 而不是让你陷入困境。

## 另请参阅

- [CLI 接口](cli.md) — 完整的斜杠命令和键绑定参考（共享）
- [会话](sessions.md) — 恢复、分支和历史记录
- [皮肤和主题](features/skins.md) — 为横幅、状态栏和覆盖层设置主题
- [语音模式](features/voice-mode.md) — 在两种界面中均可使用
- [配置](configuration.md) — 所有配置键