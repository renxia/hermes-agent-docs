---
sidebar_position: 2
title: "TUI"
description: "启动 Hermes 的现代终端用户界面 —— 鼠标友好、丰富的叠加层以及非阻塞输入。"
---

# TUI

TUI 是 Hermes 的现代前端界面 —— 一个由与[经典 CLI](cli.md) 相同的 Python 运行时支持的终端用户界面。相同的智能体、相同的会话、相同的斜杠命令；为与它们交互提供了更简洁、响应更快的界面。

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

# 直接运行源码 —— 跳过预构建步骤（适用于 TUI 贡献者）
hermes --tui --dev
```

你也可以通过环境变量启用它：

```bash
export HERMES_TUI=1
hermes          # 现在使用 TUI
hermes chat     # 同上
```

经典 CLI 仍作为默认选项保留。[CLI 接口](cli.md)中记录的所有内容 —— 斜杠命令、快速命令、技能预加载、人格、多行输入、中断 —— 在 TUI 中的工作方式完全相同。

## 为什么选择 TUI

- **即时首帧** —— 横幅在应用完成加载前即已绘制，因此 Hermes 启动时终端永远不会显得卡顿。
- **非阻塞输入** —— 在会话准备就绪前即可输入并排队消息。一旦智能体上线，你的第一个提示就会立即发送。
- **丰富的叠加层** —— 模型选择器、会话选择器、审批和澄清提示均以模态面板形式呈现，而非内联流程。
- **实时会话面板** —— 工具和技能在初始化时逐步填充。
- **鼠标友好的选择** —— 拖动高亮时使用统一的背景色，而非 SGR 反色。使用终端的正常复制手势进行复制。
- **备用屏幕渲染** —— 差异更新意味着流式传输时无闪烁，退出后无滚动历史杂乱。
- **编辑器辅助功能** —— 长代码片段的内联粘贴折叠、`Cmd+V` / `Ctrl+V` 文本粘贴（带剪贴板图像回退）、括号粘贴安全性，以及图像/文件路径附件的规范化。

相同的[皮肤](features/skins.md)和[人格](features/personality.md)适用。可通过 `/skin ares`、`/personality pirate` 在会话中途切换，UI 会实时重绘。有关所有可自定义键的完整列表及其在经典 CLI 与 TUI 中的适用情况，请参阅[皮肤与主题](features/skins.md) —— TUI 支持横幅调色板、UI 颜色、提示符号/颜色、会话显示、补全菜单、选择背景色、`tool_prefix` 和 `help_header`。

## 要求

- **Node.js** ≥ 20 —— TUI 作为由 Python CLI 启动的子进程运行。`hermes doctor` 会验证此要求。
- **TTY** —— 与经典 CLI 类似，管道输入 stdin 或在非交互环境中运行时会回退到单查询模式。

首次启动时，Hermes 会将 TUI 的 Node 依赖项安装到 `ui-tui/node_modules`（一次性操作，耗时几秒）。后续启动速度很快。如果你拉取了新版本的 Hermes，当源码比 dist 更新时，TUI 包会自动重建。

### 外部预构建

分发包含预构建包（Nix、系统软件包）的版本可将其路径指向 Hermes：

```bash
export HERMES_TUI_DIR=/path/to/prebuilt/ui-tui
hermes --tui
```

该目录必须包含 `dist/entry.js` 和最新的 `node_modules`。

## 键绑定

键绑定与[经典 CLI](cli.md#keybindings) 完全一致。唯一的行为差异：

- **鼠标拖动** 使用统一的选择背景色高亮文本。
- **`Cmd+V` / `Ctrl+V`** 首先尝试普通文本粘贴，然后回退到 OSC52/原生剪贴板读取，最后当剪贴板或粘贴内容解析为图像时附加图像。
- **`/terminal-setup`** 为本地 VS Code / Cursor / Windsurf 终端安装键绑定，以在 macOS 上获得更好的 `Cmd+Enter` 和撤销/重做一致性。
- **斜杠自动补全** 以带描述的浮动面板形式打开，而非内联下拉菜单。

## 斜杠命令

所有斜杠命令均可正常使用。其中一些由 TUI 独占 —— 它们产生更丰富的输出或以叠加层形式呈现，而非内联面板：

| 命令 | TUI 行为 |
|---------|--------------|
| `/help` | 分类命令的叠加层，可通过方向键导航 |
| `/sessions` | 模态会话选择器 —— 预览、标题、令牌总数、内联恢复 |
| `/model` | 按提供商分组的模态模型选择器，带成本提示 |
| `/skin` | 实时预览 —— 主题更改在你浏览时即生效 |
| `/details` | 切换详细工具调用详情（全局或按部分） |
| `/usage` | 丰富的令牌 / 成本 / 上下文面板 |

其他所有斜杠命令（包括已安装的技能、快速命令和人格切换）与经典 CLI 中的工作方式完全相同。请参阅[斜杠命令参考](../reference/slash-commands.md)。

## 状态栏

TUI 的状态栏实时跟踪智能体状态：

| 状态 | 含义 |
|--------|---------|
| `starting agent…` | 会话 ID 已激活；工具和技能仍在上线。你可以输入 —— 消息会排队，并在就绪时发送。 |
| `ready` | 智能体空闲，接受输入。 |
| `thinking…` / `running…` | 智能体正在推理或运行工具。 |
| `interrupted` | 当前轮次已取消；按 Enter 重新发送。 |
| `forging session…` / `resuming…` | 初始连接或 `--resume` 握手。 |

每个皮肤的状态栏颜色和阈值与经典 CLI 共享 —— 有关自定义选项，请参阅[皮肤](features/skins.md)。

## 配置

TUI 遵守所有标准 Hermes 配置：`~/.hermes/config.yaml`、配置文件、人格、皮肤、快速命令、凭据池、内存提供程序、工具/技能启用。不存在 TUI 专用的配置文件。

少量键可专门调整 TUI 界面：

```yaml
display:
  skin: default              # 任何内置或自定义皮肤
  personality: helpful
  details_mode: collapsed    # hidden | collapsed | expanded — 全局手风琴默认值
  sections:                  # 可选：按部分覆盖（任意子集）
    thinking: expanded       # 始终打开
    tools: expanded          # 始终打开
    activity: collapsed      # 选择重新启用活动面板（默认隐藏）
  mouse_tracking: true       # 如果你的终端与鼠标报告冲突，请禁用
```

运行时切换：

- `/details [hidden|collapsed|expanded|cycle]` —— 设置全局模式
- `/details <section> [hidden|collapsed|expanded|reset]` —— 覆盖一个部分
  （部分：`thinking`、`tools`、`subagents`、`activity`）

**默认可见性**

TUI 默认采用有倾向性的每部分默认值，将轮次流式传输为实时记录，而非一堆尖括号：

- `thinking` —— **展开**。推理内容随模型输出内联流式传输。
- `tools` —— **展开**。工具调用及其结果以打开状态呈现。
- `subagents` —— 继承全局 `details_mode`（默认在尖括号下折叠 —— 除非实际发生委派，否则保持安静）。
- `activity` —— **隐藏**。环境元数据（网关提示、终端一致性提示、后台通知）对大多数日常使用而言是噪音。工具失败仍会在失败的工具行内联呈现；当所有面板均隐藏时，环境错误/警告通过浮动警报后备机制显示。

每部分覆盖优先于部分默认值和全局 `details_mode`。要调整布局：

- `display.sections.thinking: collapsed` —— 将推理内容重新置于尖括号下
- `display.sections.tools: collapsed` —— 将工具调用重新置于尖括号下
- `display.sections.activity: collapsed` —— 选择重新启用活动面板
- 运行时使用 `/details <section> <mode>`

在 `display.sections` 中显式设置的任何内容均优先于默认值，因此现有配置保持不变。

## 会话

会话在 TUI 和经典 CLI 之间共享 —— 两者均写入相同的 `~/.hermes/state.db`。你可以在一个界面中启动会话，在另一个界面中恢复。会话选择器会显示来自两个来源的会话，并带有来源标签。

有关生命周期、搜索、压缩和导出，请参阅[会话](sessions.md)。

## 回退到经典 CLI

启动 `hermes`（不带 `--tui`）仍使用经典 CLI。要让机器优先使用 TUI，请在 shell 配置文件中设置 `HERMES_TUI=1`。要回退，请取消设置。

如果 TUI 启动失败（无 Node、缺少包、TTY 问题），Hermes 会打印诊断信息并回退 —— 而不是让你卡住。

## 另请参阅

- [CLI 接口](cli.md) —— 完整的斜杠命令和键绑定参考（共享）
- [会话](sessions.md) —— 恢复、分支和历史记录
- [皮肤与主题](features/skins.md) —— 为主题化横幅、状态栏和叠加层
- [语音模式](features/voice-mode.md) —— 在两个界面中均可用
- [配置](configuration.md) —— 所有配置键