---
sidebar_position: 2
title: "TUI"
description: "为 Hermes 启动现代终端用户界面 —— 支持鼠标操作、丰富的覆盖层以及非阻塞式输入。"
---

# TUI

TUI 是 Hermes 的现代前端界面 —— 一个由与[经典 CLI](cli.md) 相同的 Python 运行时支持的终端用户界面。相同的智能体、相同的会话、相同的斜杠命令；为您提供更简洁、响应更快的交互界面。

这是推荐以交互方式运行 Hermes 的方法。

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

您也可以通过环境变量启用它：

```bash
export HERMES_TUI=1
hermes          # 现在使用 TUI
hermes chat     # 同样适用
```

经典 CLI 仍作为默认选项保留。[CLI 接口](cli.md)中记录的所有内容 —— 斜杠命令、快捷命令、技能预加载、人格设定、多行输入、中断操作 —— 在 TUI 中的行为完全一致。

## 为何选择 TUI

- **即时首帧渲染** —— 应用完成加载前即绘制横幅，因此 Hermes 启动时终端永远不会显得卡顿。
- **非阻塞式输入** —— 在会话就绪前即可输入并排队消息。一旦智能体上线，您的第一个提示会立即发送。
- **丰富的覆盖层** —— 模型选择器、会话选择器、审批和澄清提示均以模态面板形式呈现，而非内联流程。
- **实时会话面板** —— 工具和技能在初始化过程中逐步填充显示。
- **支持鼠标的选择操作** —— 拖拽高亮时使用统一背景色，而非 SGR 反色。使用终端正常的复制手势进行复制。
- **备用屏幕渲染** —— 差异更新意味着流式传输时无闪烁，退出后无滚动历史杂乱。
- **编辑器增强功能** —— 长代码片段的内联粘贴折叠、`Cmd+V` / `Ctrl+V` 文本粘贴（带剪贴板图像回退）、括号粘贴安全机制，以及图像/文件路径附件的规范化处理。

相同的[皮肤](features/skins.md)和[人格](features/personality.md)适用。可通过 `/skin ares`、`/personality pirate` 在会话中途切换，UI 会实时重绘。请参阅[皮肤与主题](features/skins.md)查看完整的可自定义键列表，以及哪些键适用于经典 CLI 或 TUI —— TUI 会遵循横幅调色板、UI 颜色、提示符字形/颜色、会话显示、补全菜单、选择背景色、`tool_prefix` 和 `help_header` 的设置。

## 要求

- **Node.js** ≥ 20 —— TUI 作为由 Python CLI 启动的子进程运行。`hermes doctor` 会验证此要求。
- **TTY** —— 与经典 CLI 类似，管道输入 stdin 或在非交互环境中运行时会回退到单查询模式。

首次启动时，Hermes 会将 TUI 的 Node 依赖项安装到 `ui-tui/node_modules`（一次性操作，耗时几秒）。后续启动速度很快。如果您拉取了新的 Hermes 版本，当源码比 dist 更新时，TUI 包会自动重建。

### 外部预构建

分发包含预构建包（如 Nix、系统包）的版本可指向 Hermes：

```bash
export HERMES_TUI_DIR=/path/to/prebuilt/ui-tui
hermes --tui
```

该目录必须包含 `dist/entry.js` 和最新的 `node_modules`。

## 键绑定

键绑定与[经典 CLI](cli.md#keybindings)完全一致。唯一的行为差异如下：

- **鼠标拖拽** 使用统一的选择背景色高亮文本。
- **`Cmd+V` / `Ctrl+V`** 首先尝试普通文本粘贴，然后回退到 OSC52/原生剪贴板读取，最后当剪贴板或粘贴内容解析为图像时执行图像附件操作。
- **`/terminal-setup`** 为本地 VS Code / Cursor / Windsurf 终端安装绑定，以在 macOS 上实现更好的 `Cmd+Enter` 和撤销/重做一致性。
- **斜杠自动补全** 以带描述的浮动面板形式打开，而非内联下拉菜单。

## 斜杠命令

所有斜杠命令的行为保持不变。其中部分命令由 TUI 专属 —— 它们会生成更丰富的输出或以覆盖层形式呈现，而非内联面板：

| 命令 | TUI 行为 |
|---------|--------------|
| `/help` | 分类命令覆盖层，支持方向键导航 |
| `/sessions` | 模态会话选择器 —— 预览、标题、令牌总数、内联恢复 |
| `/model` | 按提供商分组的模态模型选择器，附带成本提示 |
| `/skin` | 实时预览 —— 浏览时主题更改立即生效 |
| `/details` | 在转录中切换详细的工具调用信息 |
| `/usage` | 丰富的令牌 / 成本 / 上下文面板 |

其他所有斜杠命令（包括已安装的技能、快捷命令和人格切换）的行为与经典 CLI 完全相同。请参阅[斜杠命令参考](../reference/slash-commands.md)。

## 状态栏

TUI 的状态栏实时跟踪智能体状态：

| 状态 | 含义 |
|--------|---------|
| `starting agent…` | 会话 ID 已生效；工具和技能仍在上线中。您可以输入 —— 消息会排队并在就绪时发送。 |
| `ready` | 智能体空闲，接受输入。 |
| `thinking…` / `running…` | 智能体正在推理或运行工具。 |
| `interrupted` | 当前轮次已取消；按 Enter 重新发送。 |
| `forging session…` / `resuming…` | 初始连接或 `--resume` 握手过程。 |

每种皮肤的状态栏颜色和阈值与经典 CLI 共享 —— 请参阅[皮肤](features/skins.md)进行自定义。

## 配置

TUI 遵循所有标准 Hermes 配置：`~/.hermes/config.yaml`、配置文件、人格、皮肤、快捷命令、凭据池、内存提供程序、工具/技能启用状态。不存在 TUI 专用的配置文件。

少量键专门用于调整 TUI 界面：

```yaml
display:
  skin: default          # 任何内置或自定义皮肤
  personality: helpful
  details_mode: compact  # 或 "verbose" —— 默认工具调用详细级别
  mouse_tracking: true   # 如果您的终端与鼠标报告冲突，请禁用
```

`/details on` / `/details off` / `/details cycle` 可在运行时切换此设置。

## 会话

TUI 和经典 CLI 共享会话 —— 两者均写入相同的 `~/.hermes/state.db`。您可以在一个界面中启动会话，在另一个界面中恢复。会话选择器会显示来自两个来源的会话，并带有来源标签。

请参阅[会话](sessions.md)了解生命周期、搜索、压缩和导出。

## 回退到经典 CLI

启动 `hermes`（不带 `--tui`）将保持在经典 CLI。要让机器优先使用 TUI，请在 shell 配置文件中设置 `HERMES_TUI=1`。要恢复，请取消设置该变量。

如果 TUI 启动失败（无 Node、缺少包、TTY 问题），Hermes 会打印诊断信息并回退 —— 而不会让您陷入困境。

## 另请参阅

- [CLI 接口](cli.md) —— 完整的斜杠命令和键绑定参考（共享）
- [会话](sessions.md) —— 恢复、分支和历史记录
- [皮肤与主题](features/skins.md) —— 为主题化横幅、状态栏和覆盖层
- [语音模式](features/voice-mode.md) —— 在两个界面中均适用
- [配置](configuration.md) —— 所有配置键