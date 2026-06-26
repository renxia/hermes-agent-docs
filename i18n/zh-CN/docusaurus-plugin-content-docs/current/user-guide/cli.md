---
sidebar_position: 1
title: "CLI Interface"
description: "Master the Hermes Agent terminal interface — commands, keybindings, personalities, and more"
---

# CLI 界面

Hermes 智能体的 CLI 是一个完整的终端用户界面（TUI）——而非 Web UI。它具备多行编辑、斜杠命令自动补全、对话历史记录、中断与重定向以及流式工具输出等功能。专为终端重度用户打造。

:::tip 首次设置
只需一条命令——`hermes setup --portal`——即可准备好运行 `hermes chat`。参见 [Nous Portal](/integrations/nous-portal)。
:::

:::tip
Hermes 还提供了一个现代化的 TUI，支持模态覆盖层、鼠标选择和非阻塞输入。使用 `hermes --tui` 启动——参见 [TUI](tui.md) 指南。
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

# 预加载一个或多个技能启动
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -q "open a draft PR"

# 恢复之前的会话
hermes --continue             # 恢复最近的 CLI 会话 (-c)
hermes --resume <session_id>  # 通过 ID 恢复特定会话 (-r)

# 详细模式（调试输出）
hermes chat --verbose

# 隔离的 git worktree（用于并行运行多个智能体）
hermes -w                         # worktree 中的交互模式
hermes -w -z "Fix issue #123"     # worktree 中的单次查询
```

## 界面布局

<img className="docs-terminal-figure" src="/docs/img/docs/cli-layout.svg" alt="Stylized preview of the Hermes CLI layout showing the banner, conversation area, and fixed input prompt." />
<p className="docs-figure-caption">Hermes CLI 的横幅、对话流和固定输入提示以稳定的文档图呈现，而非脆弱的文本艺术。</p>

欢迎横幅一目了然地展示您的模型、终端后端、工作目录、可用工具和已安装的技能。

### 状态栏

输入区域上方有一个持久的状态栏，实时更新：

```
 ⚕ claude-sonnet-4-20250514 │ 12.4K/200K │ [██████░░░░] 6% │ $0.06 │ 15m
```

| 元素 | 说明 |
|---------|-------------|
| 模型名称 | 当前模型（超过 26 字符则截断） |
| Token 计数 | 已用上下文 token / 最大上下文窗口 |
| 上下文条 | 带颜色编码阈值的视觉填充指示器 |
| 费用 | 预估会话费用（未知或零定价模型显示 `n/a`） |
| 🗜️ N | **上下文压缩次数** — 运行会话被自动压缩的次数。首次压缩后出现。 |
| ▶ N | **活跃后台任务** — 当前会话中仍在运行的 `/background` 提示数量。至少有一个任务在运行时出现。 |
| 持续时间 | 已用会话时间 |
| ⚠ YOLO | **YOLO 模式警告** — 当 `HERMES_YOLO_MODE` 开启时显示（通过 `hermes --yolo` 启动或会话中切换 `/yolo`）。与横幅行中的警告相呼应，确保您不会忘记当前处于自动批准模式。 |

状态栏会根据终端宽度自适应 — ≥ 76 列时显示完整布局，52–75 列时显示紧凑布局，低于 52 列时显示最简布局（模型 + 持续时间，激活时附带 YOLO 徽章）。

**上下文颜色编码：**

| 颜色 | 阈值 | 含义 |
|-------|-------|---------|
| 绿色 | < 50% | 空间充裕 |
| 黄色 | 50–80% | 即将填满 |
| 橙色 | 80–95% | 接近上限 |
| 红色 | ≥ 95% | 接近溢出 — 考虑使用 `/compress` |

使用 `/usage` 查看详细明细，包括各类别费用（输入与输出 token）。

### 会话恢复显示

恢复之前的会话（`hermes -c` 或 `hermes --resume <id>`）时，横幅和输入提示之间会显示一个"先前对话"面板，以紧凑的方式回顾对话历史。详情和配置请参阅 [会话 — 恢复时的对话回顾](sessions.md#conversation-recap-on-resume)。

## 快捷键

| 按键 | 操作 |
|-----|--------|
| `Enter` | 发送消息 |
| `Alt+Enter`、`Ctrl+J` 或 `Shift+Enter` | 换行（多行输入）。`Shift+Enter` 需要终端能区分它与 `Enter` — 见下文。在 Windows Terminal 上，`Alt+Enter` 被终端捕获（全屏切换）；请改用 `Ctrl+Enter` 或 `Ctrl+J`。 |
| `Alt+V` | 在终端支持时从剪贴板粘贴图片 |
| `Ctrl+V` | 粘贴文本并自动附加剪贴板中的图片 |
| `Ctrl+B` | 在语音模式启用时开始/停止语音录制（`voice.record_key`，默认：`ctrl+b`） |
| `Ctrl+G` | 在 `$EDITOR`（vim/nvim/nano/VS Code 等）中打开当前输入缓冲区。保存并退出以将编辑后的文本作为下一条提示发送 — 适合长段落提示。 |
| `Ctrl+X Ctrl+E` | Emacs 风格的外部编辑器备用绑定（与 `Ctrl+G` 行为相同）。 |
| `Ctrl+C` | 中断智能体（2 秒内双击强制退出） |
| `Ctrl+D` | 退出 |
| `Ctrl+Z` | 将 Hermes 挂起至后台（仅限 Unix）。在 shell 中运行 `fg` 恢复。 |
| `Tab` | 接受自动建议（幽灵文本）或自动补全斜杠命令 |

**多行粘贴预览。** 粘贴多行内容时，CLI 会回显一个紧凑的单行预览（`[pasted: 47 lines, 1,842 chars — press Enter to send]`），而不是将整个内容倾倒入回滚缓冲区。实际发送的内容仍然是完整的；这只是显示优化。

**最终回复中的 Markdown 剥离。** CLI 会从*最终*智能体回复中去除最冗长的 markdown 代码围栏和 `**粗体**` / `*斜体*` 包装，使其呈现为可读的终端散文而非原始源码。代码块和列表会被保留。这不会影响网关平台或工具结果 — 它们保留 markdown 以进行原生渲染。

## 斜杠命令

输入 `/` 查看自动补全下拉菜单。Hermes 支持大量 CLI 斜杠命令、动态技能命令和用户自定义快速命令。

常用示例：

| 命令 | 说明 |
|---------|-------------|
| `/help` | 显示命令帮助 |
| `/model` | 显示或更改当前模型 |
| `/tools` | 列出当前可用工具 |
| `/skills browse` | 浏览技能中心和官方可选技能 |
| `/background <prompt>` | 在单独的后台会话中运行提示 |
| `/skin` | 显示或切换活动 CLI 皮肤 |
| `/voice on` | 启用 CLI 语音模式（按 `Ctrl+B` 录制） |
| `/voice tts` | 切换 Hermes 回复的语音播放 |
| `/reasoning high` | 增加推理力度 |
| `/title My Session` | 为当前会话命名 |
| `/status` | 显示会话信息 — 模型/配置文件/token/持续时间 — 随后显示本地**会话回顾**块（最近轮次计数、最常用工具、涉及的文件、最新用户提示 + 助手回复）。纯本地计算；不调用 LLM。 |
| `/sessions` | 在经典 CLI 中打开交互式会话选择器（与 TUI 使用的界面相同）。输入过滤，方向键导航，Enter 恢复。 |

完整的内置 CLI 和消息列表请参阅 [斜杠命令参考](../reference/slash-commands.md)。

有关设置、提供商、静音调优和消息/Discord 语音使用的信息，请参阅 [语音模式](features/voice-mode.md)。

:::tip
命令不区分大小写 — `/HELP` 与 `/help` 效果相同。已安装的技能也会自动成为斜杠命令。
:::

## 快速命令

您可以定义自定义命令，这些命令会立即执行 shell 命令而无需调用 LLM。这些命令在 CLI 和消息平台（Telegram、Discord 等）中均可使用。

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

然后在任何聊天中输入 `/status`、`/gpu` 或 `/restart`。更多示例请参阅 [配置指南](/user-guide/configuration#quick-commands)。

## 启动时预加载技能

如果您已经知道会话中需要激活哪些技能，可以在启动时传递它们：

```bash
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -s github-auth
```

Hermes 会在第一轮之前将每个命名的技能加载到会话提示中。相同的标志在交互模式和单查询模式下均有效。

## 技能斜杠命令

`~/.hermes/skills/` 中每个已安装的技能都会自动注册为斜杠命令。技能名称即为命令：

```
/gif-search funny cats
/axolotl help me fine-tune Llama 3 on my dataset
/github-pr-workflow create a PR for the auth refactor

# 仅输入技能名称即可加载它，并让智能体询问您的需求：
/excalidraw
```

## 人格

设置预定义人格以改变智能体的语气：

```
/personality pirate
/personality kawaii
/personality concise
```

内置人格包括：`helpful`、`concise`、`technical`、`creative`、`teacher`、`kawaii`、`catgirl`、`pirate`、`shakespeare`、`surfer`、`noir`、`uwu`、`philosopher`、`hype`。

您也可以在 `~/.hermes/config.yaml` 中定义自定义人格：

```yaml
personalities:
  helpful: "You are a helpful, friendly AI assistant."
  kawaii: "You are a kawaii assistant! Use cute expressions..."
  pirate: "Arrr! Ye be talkin' to Captain Hermes..."
  # 添加您自己的！
```

## 多行输入

有两种方式输入多行消息：

1. **`Alt+Enter`、`Ctrl+J` 或 `Shift+Enter`** — 插入换行
2. **反斜杠续行** — 以 `\` 结束一行以继续：

```
❯ Write a function that:\
  1. Takes a list of numbers\
  2. Returns the sum
```

:::info
支持粘贴多行文本 — 使用上述任意换行键，或直接粘贴内容。
:::

### Shift+Enter 兼容性

大多数终端默认对 `Enter` 和 `Shift+Enter` 发送相同的字节序列，因此应用程序无法区分它们。Hermes 仅在终端通过 [Kitty 键盘协议](https://sw.kovidgoyal.net/kitty/keyboard-protocol/) 或 xterm 的 `modifyOtherKeys` 模式发送不同序列时才能识别 `Shift+Enter`。

| 终端 | 状态 |
|---|---|
| Kitty、foot、WezTerm、Ghostty | 默认启用不同的 `Shift+Enter` |
| iTerm2（最新版）、Alacritty、VS Code 终端、Warp | 在设置中启用 Kitty 协议后支持 |
| Windows Terminal Preview 1.25+ | 在设置中启用 Kitty 协议后支持 |
| macOS Terminal.app、原版 Windows Terminal（稳定版） | 不支持 — `Shift+Enter` 与 `Enter` 无法区分 |

在终端无法区分的情况下，`Alt+Enter` 和 `Ctrl+J` 仍然可以在所有地方使用。**特别是在 Windows Terminal 上，`Alt+Enter` 被终端捕获（切换全屏）且永远不会到达 Hermes — 请使用 `Ctrl+Enter`（以 `Ctrl+J` 形式传递）或直接使用 `Ctrl+J` 来换行。**

## 中断智能体

您可以在任何时刻中断智能体：

- **在智能体工作时输入新消息 + Enter** — 它会中断并处理您的新指令
- **`Ctrl+C`** — 中断当前操作（2 秒内按两次强制退出）
- 进行中的终端命令会被立即终止（SIGTERM，1 秒后 SIGKILL）
- 中断期间输入的多条消息会被合并为一条提示

### 忙碌输入模式

`display.busy_input_mode` 配置项控制在智能体工作时按 Enter 的行为：

| 模式 | 行为 |
|------|----------|
| `"interrupt"`（默认） | 您的消息中断当前操作并立即处理 |
| `"queue"` | 您的消息被静默排队，在智能体完成后作为下一轮发送 |
| `"steer"` | 您的消息通过 `/steer` 注入当前运行中，在智能体完成下一个工具调用后到达 — 不中断，不新开轮次 |

```yaml
# ~/.hermes/config.yaml
display:
  busy_input_mode: "steer"   # 或 "queue" 或 "interrupt"（默认）
```

`"queue"` 模式适用于您想准备后续消息但不想意外取消正在进行的工作时。`"steer"` 模式适用于您想在中途重定向智能体但不想中断时 — 例如当它还在编辑代码时说"实际上，也检查一下测试"。未知值回退到 `"interrupt"`。

`"steer"` 有两个自动回退：如果智能体尚未开始，或者附带了图片，消息会回退到 `"queue"` 行为，确保不会丢失任何内容。

您也可以在 CLI 中更改它：

```text
/busy queue
/busy steer
/busy interrupt
/busy status
```

:::tip 首次接触提示
第一次在 Hermes 工作时按 Enter，Hermes 会打印一行提醒，解释 `/busy` 旋钮（`"(tip) Your message interrupted the current run…"`）。每个安装仅触发一次 — `config.yaml` 中 `onboarding.seen.busy_input_prompt` 下的标志会锁定它。删除该键可再次看到提示。
:::

### 挂起到后台

在 Unix 系统上，按 **`Ctrl+Z`** 将 Hermes 挂起到后台 — 就像任何终端进程一样。shell 会打印确认信息：

```
Hermes Agent has been suspended. Run `fg` to bring Hermes Agent back.
```

在 shell 中输入 `fg` 即可在离开的位置恢复会话。Windows 不支持此功能。

## 工具进度显示

CLI 在工作时为智能体提供动画反馈：

**思考动画**（API 调用期间）：
```
  ◜ (｡•́︿•̀｡) 思考中... (1.2s)
  ◠ (⊙_⊙) 沉思中... (2.4s)
  ✧٩(ˊᗜˋ*)و✧ 明白了！(3.1s)
```

**工具执行信息流：**
```
  ┊ 💻 terminal `ls -la` (0.3s)
  ┊ 🔍 web_search (1.2s)
  ┊ 📄 web_extract (2.1s)
```

使用 `/verbose` 循环切换显示模式：`off → new → all → verbose`。此命令也可以在消息平台上启用——参见[配置](/user-guide/configuration#display-settings)。

### 工具预览长度

`display.tool_preview_length` 配置项控制工具调用预览行中显示的最大字符数（例如文件路径、终端命令）。默认值为 `0`，表示无限制——将显示完整的路径和命令。

```yaml
# ~/.hermes/config.yaml
display:
  tool_preview_length: 80   # 将工具预览截断为80个字符（0 = 无限制）
```

这在终端较窄或工具参数中包含非常长的文件路径时非常有用。

## 会话管理

### 恢复会话

当你退出 CLI 会话时，会打印一条恢复命令：

```
使用以下命令恢复此会话：
  hermes --resume 20260225_143052_a1b2c3

会话：          20260225_143052_a1b2c3
持续时间：       12分 34秒
消息数：         28 (5 条用户消息，18 次工具调用)
```

恢复选项：

```bash
hermes --continue                          # 恢复最近的 CLI 会话
hermes -c                                  # 简写形式
hermes -c "my project"                     # 恢复命名会话（最新版本）
hermes --resume 20260225_143052_a1b2c3     # 通过 ID 恢复特定会话
hermes --resume "refactoring auth"         # 通过标题恢复
hermes -r 20260225_143052_a1b2c3           # 简写形式
```

恢复操作会从 SQLite 中还原完整的对话历史。智能体可以看到所有之前的消息、工具调用和响应——就像你从未离开过一样。

在聊天中使用 `/title My Session Name` 为当前会话命名，或在命令行中使用 `hermes sessions rename <id> <title>`。使用 `hermes sessions list` 浏览过去的会话。

### 会话存储

CLI 会话存储在 Hermes 的 SQLite 状态数据库中，位于 `~/.hermes/state.db`。数据库保存：

- 会话元数据（ID、标题、时间戳、令牌计数器）
- 消息历史
- 跨压缩/恢复会话的血缘关系
- `session_search` 使用的全文搜索索引

一些消息适配器还在数据库旁边保存每个平台的转录文件，但 CLI 本身从 SQLite 会话存储中恢复。

### 上下文压缩

当接近上下文限制时，长对话会自动进行摘要总结：

```yaml
# 在 ~/.hermes/config.yaml 中
compression:
  enabled: true
  threshold:    # 默认在上下文限制的50%时进行压缩

# 摘要模型在 auxiliary 下配置：
auxiliary:
  compression:
    model: ""  # 留空以使用主聊天模型（默认）。或者指定一个廉价快速的模型，例如 "google/gemini-3-flash-preview"。
```

当触发压缩时，中间的对话轮次会被摘要总结，而前3轮和后20轮始终保留。

## 后台会话

在继续使用 CLI 进行其他工作的同时，在单独的后台会话中运行提示：

```
/background 分析 /var/log 中的日志并总结今天的所有错误
```

Hermes 会立即确认任务并将控制权交还给你：

```
🔄 后台任务 #1 已启动："分析 /var/log 中的日志并总结..."
   任务 ID：bg_143022_a1b2c3
```

### 工作原理

每个 `/background` 提示会在守护线程中生成一个**完全独立的智能体会话**：

- **隔离的对话** —— 后台智能体不知道你当前会话的历史记录。它只接收你提供的提示。
- **相同配置** —— 后台智能体会继承当前会话的模型、提供商、工具集、推理设置和回退模型。
- **非阻塞** —— 你的前台会话保持完全交互性。你可以聊天、运行命令，甚至启动更多后台任务。
- **多任务** —— 你可以同时运行多个后台任务。每个任务都有一个编号 ID。

### 结果

当后台任务完成时，结果会以面板形式显示在你的终端中：

```
╭─ ⚕ Hermes (后台 #1) ──────────────────────────────────╮
│ 在今天的 syslog 中发现 3 个错误：                        │
│ 1. 03:22 触发了 OOM killer —— 杀死了 nginx 进程         │
│ 2. 07:15 /dev/sda1 上出现磁盘 I/O 错误                   │
│ 3. 14:30 来自 192.168.1.50 的 SSH 登录尝试失败          │
╰──────────────────────────────────────────────────────────╯
```

如果任务失败，你会看到错误通知。如果配置中启用了 `display.bell_on_complete`，任务完成时终端会发出提示音。

### 使用场景

- **长时间研究** —— 当你在写代码的同时，"/background 研究量子纠错的最新进展"
- **文件处理** —— 当你继续对话时，"/background 分析这个仓库中的所有 Python 文件并列出所有安全问题"
- **并行调查** —— 启动多个后台任务以同时探索不同的方向

:::info
后台会话不会出现在你的主对话历史中。它们是独立的会话，拥有自己的任务 ID（例如 `bg_143022_a1b2c3`）。
:::

## 安静模式

默认情况下，CLI 以安静模式运行：
- 抑制工具的详细日志
- 启用可爱风格的动画反馈
- 保持输出整洁且用户友好

如需调试输出：
```bash
hermes chat --verbose
```