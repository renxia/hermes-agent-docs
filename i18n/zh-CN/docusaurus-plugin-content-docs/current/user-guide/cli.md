---
sidebar_position: 1
title: "CLI 界面"
description: "掌握 Hermes 智能体终端界面——命令、快捷键、个性化设置等"
---

# CLI 界面

Hermes 智能体的命令行界面是一个完整的终端用户界面 (TUI)——而非网页界面。它具备多行编辑、斜杠命令自动补全、对话历史、中断与重定向以及流式工具输出功能，专为终端用户打造。

:::tip 初始设置
只需运行 `hermes setup --portal` 命令，即可开始使用 `hermes chat`。详见 [Nous Portal](/integrations/nous-portal)。
:::

:::tip
Hermes 还提供了一个现代化的 TUI，支持模态覆盖层、鼠标选择和非阻塞输入。通过 `hermes --tui` 启动——详见 [TUI](tui.md) 指南。
:::

## 运行 CLI

```bash
# 启动交互式会话（默认）
hermes

# 单次查询模式（非交互式）
hermes chat -q "你好"

# 指定模型
hermes chat --model "anthropic/claude-sonnet-4"

# 指定提供商
hermes chat --provider nous        # 使用 Nous Portal
hermes chat --provider openrouter  # 强制使用 OpenRouter

# 指定工具集
hermes chat --toolsets "web,terminal,skills"

# 预加载一个或多个技能后启动
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -q "创建一个草稿 PR"

# 恢复之前的会话
hermes --continue             # 恢复最近的 CLI 会话 (-c)
hermes --resume <session_id>  # 通过 ID 恢复特定会话 (-r)

# 详细模式（调试输出）
hermes chat --verbose

# 隔离的 git 工作树（用于并行运行多个智能体）
hermes -w                         # 工作树中的交互模式
hermes -w -q "修复 issue #123"     # 工作树中的单次查询
```

## 界面布局

<img className="docs-terminal-figure" src="/img/docs/cli-layout.svg" alt="Hermes 命令行界面布局样式预览，展示了横幅、对话区域和固定的输入提示符。" />
<p className="docs-figure-caption">Hermes 命令行界面的横幅、对话流和固定的输入提示符，以稳定的文档图片而非脆弱的文字艺术形式呈现。</p>

欢迎横幅会一目了然地显示你的模型、终端后端、工作目录、可用工具和已安装的技能。

### 状态栏

一个持久状态栏位于输入区域上方，实时更新：

```
 ⚕ claude-sonnet-4-20250514 │ 12.4K/200K │ [██████░░░░] 6% │ $0.06 │ 15m
```

| 元素 | 描述 |
|------|------|
| 模型名称 | 当前使用的模型（如果名称超过26个字符则会被截断） |
| Token 计数 | 已用的上下文 Token 数 / 最大上下文窗口 |
| 上下文进度条 | 带颜色阈值的视觉填充指示器 |
| 费用 | 预估的会话成本（对于未知或零价格的模型则显示 `n/a`） |
| 🗜️ N | **上下文压缩计数** — 当前会话已被自动压缩的次数。在首次压缩触发后出现。 |
| ▶ N | **活跃的后台任务数** — 当前会话中仍在运行的 `/background` 提示符数量。当至少有一个任务正在运行时出现。 |
| 持续时间 | 会话已用时间 |
| ⚠ YOLO | **YOLO 模式警告** — 当 `HERMES_YOLO_MODE` 开启时显示（启动时使用 `hermes --yolo` 或会话中通过 `/yolo` 切换）。与横幅行的警告信息一致，提醒你处于自动批准模式。 |

该状态栏会适应终端宽度：当宽度 ≥ 76 列时显示完整布局，52–75 列时为紧凑布局，低于52列时显示最小布局（模型 + 持续时间，以及激活时的 YOLO 徽章）。

**上下文颜色编码：**

| 颜色 | 阈值 | 含义 |
|------|------|------|
| 绿色 | < 50% | 空间充足 |
| 黄色 | 50–80% | 逐渐填满 |
| 橙色 | 80–95% | 接近上限 |
| 红色 | ≥ 95% | 接近溢出 — 考虑使用 `/compress` |

使用 `/usage` 可查看详细的分解信息，包括各类别的费用（输入 vs 输出 Token）。

### 会话恢复显示

当恢复之前的会话（使用 `hermes -c` 或 `hermes --resume <id>`）时，会在横幅和输入提示符之间出现一个“上一次对话”面板，显示对话历史的紧凑摘要。详情和配置请参见[会话 — 恢复时的对话摘要](sessions.md#conversation-recap-on-resume)。

## 按键绑定

| 按键 | 操作 |
|------|------|
| `Enter` | 发送消息 |
| `Alt+Enter`、`Ctrl+J` 或 `Shift+Enter` | 换行（多行输入）。`Shift+Enter` 需要一个能将其与 `Enter` 区分的终端——见下文。在 Windows 终端中，`Alt+Enter` 会被终端捕获（全屏切换）；请改用 `Ctrl+Enter` 或 `Ctrl+J`。 |
| `Alt+V` | 当终端支持时，从剪贴板粘贴图片 |
| `Ctrl+V` | 粘贴文本并附带剪贴板中的图片（如果支持） |
| `Ctrl+B` | 当语音模式启用时，开始/停止语音录制（`voice.record_key`，默认：`ctrl+b`） |
| `Ctrl+G` | 在 `$EDITOR`（vim/nvim/nano/VS Code 等）中打开当前输入缓冲区。保存并退出后，编辑后的文本将作为下一个提示发送——适合长篇、多段落的提示。 |
| `Ctrl+X Ctrl+E` | Emacs 风格的备用外部编辑器绑定（行为与 `Ctrl+G` 相同）。 |
| `Ctrl+C` | 中断智能体（2秒内按两次强制退出） |
| `Ctrl+D` | 退出 |
| `Ctrl+Z` | 将 Hermes 挂起到后台（仅限 Unix）。在 Shell 中运行 `fg` 以恢复。 |
| `Tab` | 接受自动建议（幽灵文本）或自动补全斜杠命令 |

**多行粘贴预览。** 当你粘贴多行文本块时，命令行界面会回显一个紧凑的单行预览（`[已粘贴：47 行，1,842 个字符 - 按 Enter 发送]`），而不是将整个内容转储到回滚历史中。实际发送的仍然是完整内容；这只是显示上的优化。

**最终回复中的 Markdown 清理。** 命令行界面会从*最终的*智能体回复中剥离最冗余的 Markdown 围栏以及 `**粗体**` / `*斜体*` 包装，使其以可读的终端纯文本形式呈现，而非原始源代码。代码块和列表会被保留。这不会影响网关平台或工具结果——它们保留自己的 Markdown 以进行原生渲染。

## 斜杠命令

输入 `/` 可以查看自动补全下拉菜单。Hermes 支持大量的 CLI 斜杠命令、动态技能命令和用户自定义快捷命令。

常见示例：

| 命令 | 描述 |
|------|------|
| `/help` | 显示命令帮助 |
| `/model` | 显示或更改当前模型 |
| `/tools` | 列出当前可用的工具 |
| `/skills browse` | 浏览技能中心和官方可选技能 |
| `/background <prompt>` | 在单独的后台会话中运行提示 |
| `/skin` | 显示或切换活动的 CLI 皮肤 |
| `/voice on` | 启用 CLI 语音模式（按 `Ctrl+B` 录音） |
| `/voice tts` | 切换 Hermes 回复的语音播放 |
| `/reasoning high` | 增加推理强度 |
| `/title 我的会话` | 为当前会话命名 |
| `/status` | 显示会话信息——模型/配置/Token/持续时间——后面跟随一个本地**会话摘要**块（最近的对话轮次计数、使用的热门工具、涉及的文件、最新的用户提示 + 助手回复）。纯本地计算；不调用 LLM。 |
| `/sessions` | 在经典 CLI 中直接打开一个交互式会话选择器（与 TUI 使用相同的界面）。输入以过滤，使用方向键导航，按 Enter 恢复会话。 |

完整的内置 CLI 和消息列表，请参见[斜杠命令参考](../reference/slash-commands.md)。

关于设置、提供商、静音调整以及消息/Discord 语音用法，请参见[语音模式](features/voice-mode.md)。

:::tip
命令不区分大小写——`/HELP` 与 `/help` 效果相同。已安装的技能也会自动成为斜杠命令。
:::

## 快捷命令

你可以定义自定义命令，无需调用 LLM 即可立即运行 Shell 命令。这些命令在 CLI 和消息平台（Telegram、Discord 等）中均有效。

```yaml
# ~/.hermes/config.yaml
quick_commands:
  status:
    type: exec
    command: systemctl status hermes-agent
  gpu:
    type: exec
    command: nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv,noheader
  restart:
    type: alias
    target: /gateway restart
```

然后在任何聊天中输入 `/status`、`/gpu` 或 `/restart`。更多示例请参见[配置指南](/user-guide/configuration#quick-commands)。

## 启动时预加载技能

如果你已经知道本次会话需要激活哪些技能，可以在启动时传入它们：

```bash
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -s github-auth
```

Hermes 会在第一次对话轮次之前，将每个命名的技能加载到会话提示中。该标志在交互模式和单次查询模式下均有效。

## 技能斜杠命令

`~/.hermes/skills/` 中每个已安装的技能都会自动注册为一个斜杠命令。技能名称即为命令：

```
/gif-search 搞笑的猫
/axolotl 帮我在我的数据集上微调 Llama 3
/github-pr-workflow 为认证重构创建一个 PR

# 仅输入技能名称会加载它，并让智能体询问你需要什么：
/excalidraw
```

## 个性

设置预定义的个性以更改智能体的语气：

```
/personality 海盗
/personality 可爱
/personality 简洁
```

内置个性包括：`helpful`、`concise`、`technical`、`creative`、`teacher`、`kawaii`、`catgirl`、`pirate`、`shakespeare`、`surfer`、`noir`、`uwu`、`philosopher`、`hype`。

你也可以在 `~/.hermes/config.yaml` 中定义自定义个性：

```yaml
personalities:
  helpful: "你是一个乐于助人、友好的 AI 助手。"
  kawaii: "你是一个可爱的助手！使用可爱的表情……"
  pirate: "啊呀！你在和船长 Hermes 说话……"
  # 添加你自己的！
```

## 多行输入

有两种方式输入多行消息：

1.  **`Alt+Enter`、`Ctrl+J` 或 `Shift+Enter`** — 插入一个新行
2.  **反斜杠续行** — 在行末使用 `\` 以继续：

```
❯ 写一个函数，它：\
  1. 接受一个数字列表\
  2. 返回它们的和
```

:::info
支持粘贴多行文本——使用上述任何换行键，或直接粘贴内容。
:::

### Shift+Enter 兼容性

大多数终端默认对 `Enter` 和 `Shift+Enter` 发送相同的字节序列，因此应用程序无法区分它们。Hermes 仅在终端通过 [Kitty 键盘协议](https://sw.kovidgoyal.net/kitty/keyboard-protocol/) 或 xterm 的 `modifyOtherKeys` 模式发送不同的序列时识别 `Shift+Enter`。

| 终端 | 状态 |
|------|------|
| Kitty, foot, WezTerm, Ghostty | 默认启用不同的 `Shift+Enter` |
| iTerm2 (新版), Alacritty, VS Code 终端, Warp | 在设置中启用 Kitty 协议后即可支持 |
| Windows Terminal Preview 1.25+ | 在设置中启用 Kitty 协议后即可支持 |
| macOS Terminal.app, 标准 Windows Terminal (稳定版) | 不支持 — `Shift+Enter` 与 `Enter` 无法区分 |

在终端无法区分它们的情况下，`Alt+Enter` 和 `Ctrl+J` 在任何地方都继续有效。**特别是在 Windows 终端中，`Alt+Enter` 会被终端捕获（切换全屏）且永远不会传递给 Hermes — 请使用 `Ctrl+Enter`（作为 `Ctrl+J` 传递）或直接使用 `Ctrl+J` 来换行。**

## 中断智能体

您可以随时中断智能体：

- **在智能体工作时输入新消息并按 Enter** — 它会中断并立即处理您的新指令
- **`Ctrl+C`** — 中断当前操作（2 秒内按两次可强制退出）
- 进行中的终端命令会被立即终止（先发 SIGTERM，1 秒后发 SIGKILL）
- 中断期间输入的多条消息会合并成一个提示

### 繁忙输入模式

`display.busy_input_mode` 配置项控制当智能体工作时您按下 Enter 键的行为：

| 模式 | 行为 |
|------|------|
| `"interrupt"` (默认) | 您的消息会中断当前操作并被立即处理 |
| `"queue"` | 您的消息会被静默排队，并在智能体完成当前工作后作为下一轮发送 |
| `"steer"` | 您的消息通过 `/steer` 注入到当前运行流程，在下一次工具调用后到达智能体 — 无中断，无新轮次 |

```yaml
# ~/.hermes/config.yaml
display:
  busy_input_mode: "steer"   # 或 "queue" 或 "interrupt" (默认)
```

`"queue"` 模式适用于您想准备后续消息而不小心取消正在执行的工作的场景。`"steer"` 模式适用于您想在任务中途重定向智能体而无需中断的场景 — 例如，在智能体仍在编辑代码时说“另外，也检查一下测试”。未知值会回退到 `"interrupt"`。

`"steer"` 有两个自动回退机制：如果智能体尚未启动，或者附带了图片，消息会回退到 `"queue"` 行为，以确保没有信息丢失。

您也可以在 CLI 内更改此设置：

```text
/busy queue
/busy steer
/busy interrupt
/busy status
```

:::tip 首次使用提示
您第一次在 Hermes 工作时按 Enter，Hermes 会打印一行提示，说明 `/busy` 设置（`"(提示) 您的消息中断了当前运行…"`）。此提示每个安装只出现一次 — `config.yaml` 中 `onboarding.seen.busy_input_prompt` 下的标志会将其锁定。删除该键可再次看到提示。
:::

### 挂起到后台

在 Unix 系统上，按 **`Ctrl+Z`** 可将 Hermes 挂起到后台 — 与任何终端进程类似。Shell 会打印确认信息：

```
Hermes 智能体已被挂起。运行 `fg` 以恢复 Hermes 智能体。
```

在 Shell 中输入 `fg` 即可从上次中断处完全恢复会话。此功能在 Windows 上不受支持。

## 工具进度显示

当智能体工作时，CLI 会显示动态反馈：

**思考动画**（API 调用期间）：
```
  ◜ (｡•́︿•̀｡) 思考中... (1.2s)
  ◠ (⊙_⊙) 推敲中... (2.4s)
  ✧٩(ˊᗜˋ*)و✧ 明白了！(3.1s)
```

**工具执行反馈：**
```
  ┊ 💻 终端 `ls -la` (0.3s)
  ┊ 🔍 网络搜索 (1.2s)
  ┊ 📄 网页提取 (2.1s)
```

使用 `/verbose` 循环切换显示模式：`关闭 → 新增 → 全部 → 详细`。此命令也可用于消息平台 — 参见[配置](/user-guide/configuration#display-settings)。

### 工具预览长度

`display.tool_preview_length` 配置项控制工具调用预览行中显示的最大字符数（例如文件路径、终端命令）。默认值为 `0`，表示无限制 — 显示完整路径和命令。

```yaml
# ~/.hermes/config.yaml
display:
  tool_preview_length: 80   # 将工具预览截断为 80 个字符（0 = 无限制）
```

这在窄终端或工具参数包含很长文件路径时很有用。

## 会话管理

### 恢复会话

当您退出 CLI 会话时，会打印一个恢复命令：

```
使用以下命令恢复此会话：
  hermes --resume 20260225_143052_a1b2c3

会话：        20260225_143052_a1b2c3
时长：        12分 34秒
消息数：      28 (5条用户消息, 18次工具调用)
```

恢复选项：

```bash
hermes --continue                          # 恢复最近的 CLI 会话
hermes -c                                  # 简写形式
hermes -c "我的项目"                        # 恢复命名会话（血统中最近的）
hermes --resume 20260225_143052_a1b2c3     # 按 ID 恢复特定会话
hermes --resume "重构认证"                   # 按标题恢复
hermes -r 20260225_143052_a1b2c3           # 简写形式
```

恢复操作会从 SQLite 中还原完整的对话历史。智能体会看到所有先前的消息、工具调用和响应 — 就好像您从未离开过一样。

在聊天中使用 `/title 我的会话名称` 为当前会话命名，或在命令行使用 `hermes sessions rename <id> <title>`。使用 `hermes sessions list` 浏览过去的会话。

### 会话存储

CLI 会话存储在 Hermes 的 SQLite 状态数据库中（`~/.hermes/state.db`）。该数据库保留：

- 会话元数据（ID、标题、时间戳、令牌计数器）
- 消息历史
- 压缩/恢复会话间的血统关系
- `session_search` 使用的全文搜索索引

一些消息适配器还会在数据库旁保留每个平台的转录文件，但 CLI 本身是从 SQLite 会话存储恢复的。

### 上下文压缩

当接近上下文限制时，长对话会自动进行摘要：

```yaml
# 在 ~/.hermes/config.yaml 中
compression:
  enabled: true
  threshold: 0.50    # 默认在上下文限制的 50% 时进行压缩

# 摘要模型在辅助部分配置：
auxiliary:
  compression:
    model: ""  # 留空则使用主聊天模型（默认）。或指定一个廉价快速的模型，例如 "google/gemini-3-flash-preview"。
```

当压缩触发时，中间的对话轮次会被摘要，而前 3 轮和最后 20 轮总是被保留。

## 后台会话

在单独的后台会话中运行提示，同时继续使用 CLI 处理其他工作：

```
/background 分析 /var/log 中的日志，并总结今天出现的任何错误
```

Hermes 会立即确认任务并返回提示：

```
🔄 后台任务 #1 已启动："分析 /var/log 中的日志，并总结..."
   任务 ID：bg_143022_a1b2c3
```

### 工作原理

每个 `/background` 提示都会在一个守护线程中生成一个**完全独立的智能体会话**：

- **隔离的对话** — 后台智能体对您当前会话的历史一无所知。它只接收您提供的提示。
- **相同的配置** — 后台智能体继承您当前会话的模型、提供商、工具集、推理设置和回退模型。
- **非阻塞** — 您的前台会话保持完全交互。您可以聊天、运行命令，甚至启动更多后台任务。
- **多任务** — 您可以同时运行多个后台任务。每个任务都有一个编号 ID。

### 结果

当后台任务完成时，结果会作为面板显示在您的终端中：

```
╭─ ⚕ Hermes (后台 #1) ──────────────────────────────────╮
│ 在今天的 syslog 中发现 3 个错误：                         │
│ 1. OOM 终结器在 03:22 被调用 — 终止了进程 nginx           │
│ 2. 07:15 时 /dev/sda1 出现磁盘 I/O 错误                  │
│ 3. 14:30 时来自 192.168.1.50 的 SSH 登录尝试失败          │
╰────────────────────────────────────────────────────────╯
```

如果任务失败，您会看到错误通知。如果您的配置中启用了 `display.bell_on_complete`，任务完成时终端会响铃。

### 使用场景

- **长时间运行的研究** — 在您编写代码时，“/background 研究量子纠错的最新进展”
- **文件处理** — 在您继续对话时，“/background 分析此仓库中的所有 Python 文件并列出任何安全问题”
- **并行调查** — 启动多个后台任务同时探索不同方向

:::info
后台会话不会出现在您的主对话历史中。它们是独立的会话，有自己的任务 ID（例如 `bg_143022_a1b2c3`）。
:::

## 静默模式

默认情况下，CLI 在静默模式下运行，该模式：
- 抑制工具的详细日志记录
- 启用可爱风格的动态反馈
- 保持输出简洁且用户友好

要获取调试输出：
```bash
hermes chat --verbose
```