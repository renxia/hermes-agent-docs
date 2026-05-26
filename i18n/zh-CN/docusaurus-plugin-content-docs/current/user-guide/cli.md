---
sidebar_position: 1
title: "CLI 界面"
description: "掌握 Hermes 智能体终端界面 — 命令、快捷键、个性设置及更多"
---

# CLI 界面

Hermes 智能体的命令行界面是一个完整的终端用户界面（TUI）— 并非网页界面。它支持多行编辑、斜杠命令自动补全、对话历史记录、中断与重定向以及流式工具输出。专为终日使用终端的用户打造。

:::tip
Hermes 还提供了一个带有模态覆盖层、鼠标选择和非阻塞输入的现代 TUI。通过 `hermes --tui` 启动 — 请参阅 [TUI](tui.md) 指南。
:::

## 运行 CLI

```bash
# 启动一个交互式会话（默认）
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

# 预先加载一个或多个技能启动
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -q "打开一个草稿 PR"

# 恢复之前的会话
hermes --continue             # 恢复最近一次 CLI 会话 (-c)
hermes --resume <session_id>  # 通过会话 ID 恢复特定会话 (-r)

# 详细模式（调试输出）
hermes chat --verbose

# 隔离的 git 工作树（用于并行运行多个智能体）
hermes -w                         # 在工作树中进入交互模式
hermes -w -q "修复问题 #123"     # 在工作树中执行单次查询
```

## 界面布局

<img className="docs-terminal-figure" src="/img/docs/cli-layout.svg" alt="Hermes CLI 布局的风格化预览，显示横幅、对话区域和固定的输入提示符。" />
<p className="docs-figure-caption">Hermes CLI 的横幅、对话流和固定的输入提示符渲染为稳定的文档图形，而非脆弱的文字艺术。</p>

欢迎横幅一眼显示你的模型、终端后端、工作目录、可用工具和已安装的技能。

### 状态栏

一个持久的状态栏位于输入区域上方，实时更新：

```
 ⚕ claude-sonnet-4-20250514 │ 12.4K/200K │ [██████░░░░] 6% │ $0.06 │ 15m
```

| 元素 | 描述 |
|------|------|
| 模型名称 | 当前模型（如果超过26个字符则截断） |
| Token 计数 | 已使用的上下文 token / 最大上下文窗口 |
| 上下文进度条 | 具有颜色阈值的可视化填充指示器 |
| 费用 | 会话估算费用（对于未知或零定价模型为 `n/a`） |
| 🗜️ N | **上下文压缩次数** — 当前会话自动压缩的次数。首次压缩触发后出现。 |
| ▶ N | **活跃的后台任务** — 当前会话中仍在运行的 `/background` 提示数量。只要有任务在进行中就会出现。 |
| 持续时间 | 已消耗的会话时间 |
| ⚠ YOLO | **YOLO 模式警告** — 当 `HERMES_YOLO_MODE` 开启时显示（通过启动时 `hermes --yolo` 或会话中切换 `/yolo`）。与横幅行警告同步，以免你忘记自己处于自动批准模式。 |

该栏会自适应终端宽度 — 当 ≥ 76 列时显示完整布局，52-75 列时显示紧凑布局，低于 52 列时显示最小布局（模型 + 持续时间，外加激活时的 YOLO 徽章）。

**上下文颜色编码：**

| 颜色 | 阈值 | 含义 |
|------|------|------|
| 绿色 | < 50% | 空间充裕 |
| 黄色 | 50–80% | 逐渐填满 |
| 橙色 | 80–95% | 接近限制 |
| 红色 | ≥ 95% | 接近溢出 — 考虑使用 `/compress` |

使用 `/usage` 获取详细分类信息，包括按类别划分的费用（输入 vs 输出 token）。

### 会话恢复显示

当恢复之前的会话时（`hermes -c` 或 `hermes --resume <id>`），横幅和输入提示符之间会出现一个“上一个对话”面板，显示对话历史的简洁回顾。详见 [会话 — 恢复时的对话回顾](sessions.md#conversation-recap-on-resume)。

## 快捷键

| 按键 | 操作 |
|------|------|
| `Enter` | 发送消息 |
| `Alt+Enter`、`Ctrl+J` 或 `Shift+Enter` | 换行（多行输入）。`Shift+Enter` 需要终端能将其与 `Enter` 区分开来 — 见下文。在 Windows 终端中，`Alt+Enter` 被终端捕获（全屏切换）；改用 `Ctrl+Enter` 或 `Ctrl+J`。 |
| `Alt+V` | 当终端支持时，从剪贴板粘贴图像 |
| `Ctrl+V` | 粘贴文本，并尝试附带剪贴板图像 |
| `Ctrl+B` | 当语音模式启用时开始/停止语音录制（`voice.record_key`，默认：`ctrl+b`） |
| `Ctrl+G` | 在 `$EDITOR`（vim/nvim/nano/VS Code 等）中打开当前输入缓冲区。保存并退出后，将编辑后的文本作为下一个提示发送 — 适合较长的、多段落的提示。 |
| `Ctrl+X Ctrl+E` | Emacs 风格的外部编辑器备用绑定（行为与 `Ctrl+G` 相同）。 |
| `Ctrl+C` | 中断智能体（2秒内双击强制退出） |
| `Ctrl+D` | 退出 |
| `Ctrl+Z` | 将 Hermes 挂起到后台（仅限 Unix）。在 shell 中运行 `fg` 恢复。 |
| `Tab` | 接受自动建议（幻影文本）或自动补全斜杠命令 |

**多行粘贴预览。** 当你粘贴一个多行块时，CLI 会显示一个简洁的单行预览（`[pasted: 47 lines, 1,842 chars — press Enter to send]`），而不是将整个内容转储到回滚缓冲区。完整内容仍然是发送的内容；这只是显示优化。

**最终回复中的 Markdown 剥离。** CLI 会从*最终*智能体回复中剥离最冗长的 Markdown 围栏和 `**粗体**` / `*斜体*` 包装，使其呈现为可读的终端散文，而不是原始源码。代码块和列表会被保留。这不会影响网关平台或工具结果 — 它们保持其 Markdown 以便本地渲染。

## 斜杠命令

输入 `/` 查看自动补全下拉菜单。Hermes 支持大量 CLI 斜杠命令、动态技能命令和用户定义的快速命令。

常见示例：

| 命令 | 描述 |
|------|------|
| `/help` | 显示命令帮助 |
| `/model` | 显示或更改当前模型 |
| `/tools` | 列出当前可用的工具 |
| `/skills browse` | 浏览技能中心和官方可选技能 |
| `/background <prompt>` | 在单独的后台会话中运行提示 |
| `/skin` | 显示或切换活动的 CLI 主题 |
| `/voice on` | 启用 CLI 语音模式（按 `Ctrl+B` 录制） |
| `/voice tts` | 切换 Hermes 回复的语音播放 |
| `/reasoning high` | 增加推理强度 |
| `/title My Session` | 为当前会话命名 |
| `/status` | 显示会话信息 — 模型/配置/token/持续时间 — 然后是一个本地**会话回顾**块（最近的轮次计数、使用的顶级工具、涉及的文件、最新的用户提示 + 助手回复）。纯本地计算；不调用 LLM。 |
| `/sessions` | 在经典 CLI 内部打开一个交互式会话选择器（与 TUI 使用相同的界面）。输入以过滤，箭头键导航，Enter 恢复。 |

完整的内置 CLI 和消息列表，请参见 [斜杠命令参考](../reference/slash-commands.md)。

关于设置、提供商、静默调整以及消息/Discord 语音使用，请参见 [语音模式](features/voice-mode.md)。

:::tip
命令不区分大小写 — `/HELP` 与 `/help` 效果相同。安装的技能也会自动成为斜杠命令。
:::

## 快速命令

你可以定义自定义命令来立即运行 shell 命令，无需调用 LLM。这些命令在 CLI 和消息平台（Telegram、Discord 等）中均可使用。

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

然后在任何聊天中输入 `/status`、`/gpu` 或 `/restart`。更多示例请参见 [配置指南](/user-guide/configuration#quick-commands)。

## 在启动时预加载技能

如果你已经知道会话中需要激活哪些技能，可以在启动时传入它们：

```bash
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -s github-auth
```

Hermes 会在第一轮之前将每个命名的技能加载到会话提示中。同样的标志在交互模式和单次查询模式下也适用。

## 技能斜杠命令

`~/.hermes/skills/` 中安装的每个技能都会自动注册为一个斜杠命令。技能名称即为命令：

```
/gif-search funny cats
/axolotl help me fine-tune Llama 3 on my dataset
/github-pr-workflow create a PR for the auth refactor

# 仅输入技能名称会加载它并让智能体询问你需要什么：
/excalidraw
```

## 个性

设置预定义的个性以改变智能体的语气：

```
/personality pirate
/personality kawaii
/personality concise
```

内置个性包括：`helpful`（有帮助）、`concise`（简洁）、`technical`（技术）、`creative`（创意）、`teacher`（教师）、`kawaii`（卡哇伊）、`catgirl`（猫娘）、`pirate`（海盗）、`shakespeare`（莎士比亚）、`surfer`（冲浪者）、`noir`（黑色电影）、`uwu`、`philosopher`（哲学家）、`hype`（狂热）。

你也可以在 `~/.hermes/config.yaml` 中定义自定义个性：

```yaml
personalities:
  helpful: "You are a helpful, friendly AI assistant."
  kawaii: "You are a kawaii assistant! Use cute expressions..."
  pirate: "Arrr! Ye be talkin' to Captain Hermes..."
  # 添加你自己的！
```

## 多行输入

有两种方式输入多行消息：

1. **`Alt+Enter`、`Ctrl+J` 或 `Shift+Enter`** — 插入新行
2. **反斜杠续行** — 以 `\` 结尾一行以继续：

```
❯ 写一个函数，它：\
  1. 接收一个数字列表\
  2. 返回总和
```

:::info
支持粘贴多行文本 — 使用上述任何换行键，或直接粘贴内容。
:::

### Shift+Enter 兼容性

大多数终端默认为 `Enter` 和 `Shift+Enter` 发送相同的字节序列，因此应用程序无法区分它们。Hermes 仅在终端通过 [Kitty 键盘协议](https://sw.kovidgoyal.net/kitty/keyboard-protocol/) 或 xterm 的 `modifyOtherKeys` 模式发送不同序列时识别 `Shift+Enter`。

| 终端 | 状态 |
|------|------|
| Kitty、foot、WezTerm、Ghostty | 默认启用不同的 `Shift+Enter` |
| iTerm2（近期版本）、Alacritty、VS Code 终端、Warp | 在设置中启用 Kitty 协议后支持 |
| Windows Terminal Preview 1.25+ | 在设置中启用 Kitty 协议后支持 |
| macOS Terminal.app、原版 Windows Terminal（稳定版） | 不支持 — `Shift+Enter` 与 `Enter` 无法区分 |

当终端无法区分它们时，`Alt+Enter` 和 `Ctrl+J` 在任何地方都继续有效。**特别地，在 Windows Terminal 中，`Alt+Enter` 被终端捕获（切换全屏）并且永远不会到达 Hermes — 请改用 `Ctrl+Enter`（作为 `Ctrl+J` 传递）或直接使用 `Ctrl+J` 来换行。**

# 中断智能体

您可以在任何时刻中断智能体：

- **输入新消息并按 Enter** — 智能体会中断当前操作并处理您的新指令
- **`Ctrl+C`** — 中断当前操作（2秒内按两次可强制退出）
- 正在进行的终端命令会被立即终止（先发送SIGTERM，1秒后发送SIGKILL）
- 中断期间输入的多条消息会被合并为一个提示

### 繁忙输入模式

`display.busy_input_mode` 配置项控制着当智能体正在工作时您按下 Enter 键的行为：

| 模式 | 行为 |
|------|------|
| `"interrupt"` (默认) | 您的消息会中断当前操作并立即处理 |
| `"queue"` | 您的消息会被静默排入队列，在智能体完成当前任务后作为下一轮对话发送 |
| `"steer"` | 您的消息通过 `/steer` 注入当前运行流程，在下一个工具调用后到达智能体处 — 不中断，不开新对话轮次 |

```yaml
# ~/.hermes/config.yaml
display:
  busy_input_mode: "steer"   # 或 "queue" 或 "interrupt" (默认)
```

`"queue"` 模式适用于您想准备后续消息而不小心取消正在进行的工作时。`"steer"` 模式适用于您想在不中断的情况下中途引导智能体 — 例如，在它仍在编辑代码时告诉它 "顺便也检查一下测试"。未知值将回退到 `"interrupt"` 模式。

`"steer"` 有两个自动回退机制：如果智能体尚未开始，或者附加了图片，消息将回退到 `"queue"` 行为，以确保内容不会丢失。

您也可以在 CLI 内部更改此设置：

```text
/busy queue
/busy steer
/busy interrupt
/busy status
```

:::tip 首次使用提示
当您在 Hermes 工作时第一次按下 Enter 键，Hermes 会打印一行提醒，解释 `/busy` 开关的作用 (`"(提示) 您的消息中断了当前运行…"`)。此提示每个安装仅触发一次 — `config.yaml` 中 `onboarding.seen.busy_input_prompt` 下的标志位会将其锁定。删除此键可再次看到该提示。
:::

### 挂起到后台

在 Unix 系统上，按 **`Ctrl+Z`** 可将 Hermes 挂起到后台 — 就像任何终端进程一样。Shell 会打印确认信息：

```
Hermes 智能体已挂起。运行 `fg` 可将 Hermes 智能体恢复。
```

在您的 shell 中输入 `fg` 即可从您离开的确切位置恢复会话。此功能在 Windows 上不受支持。

## 工具进度显示

当智能体工作时，CLI 会显示动画反馈：

**思考动画**（API 调用期间）：
```
  ◜ (｡•́︿•̀｡) 思考中... (1.2s)
  ◠ (⊙_⊙) 沉思中... (2.4s)
  ✧٩(ˊᗜˋ*)و✧ 搞定了！ (3.1s)
```

**工具执行信息流：**
```
  ┊ 💻 终端 `ls -la` (0.3s)
  ┊ 🔍 网页搜索 (1.2s)
  ┊ 📄 网页提取 (2.1s)
```

使用 `/verbose` 循环切换显示模式：`off → new → all → verbose`。此命令也可以为消息平台启用 — 请参阅 [配置](/user-guide/configuration#display-settings)。

### 工具预览长度

`display.tool_preview_length` 配置项控制着工具调用预览行中显示的最大字符数（例如文件路径、终端命令）。默认为 `0`，表示无限制 — 显示完整路径和命令。

```yaml
# ~/.hermes/config.yaml
display:
  tool_preview_length: 80   # 将工具预览截断为80个字符 (0 = 无限制)
```

这在窄终端或工具参数包含很长文件路径时很有用。

## 会话管理

### 恢复会话

当您退出 CLI 会话时，会打印一个恢复命令：

```
使用以下命令恢复此会话：
  hermes --resume 20260225_143052_a1b2c3

会话：        20260225_143052_a1b2c3
持续时间：    12分34秒
消息数：      28 (5条用户消息, 18次工具调用)
```

恢复选项：

```bash
hermes --continue                          # 恢复最近的 CLI 会话
hermes -c                                  # 简写形式
hermes -c "我的项目"                       # 恢复命名会话（血统中最新的）
hermes --resume 20260225_143052_a1b2c3     # 通过 ID 恢复特定会话
hermes --resume "重构认证"                 # 通过标题恢复
hermes -r 20260225_143052_a1b2c3           # 简写形式
```

恢复操作会从 SQLite 中还原完整的对话历史。智能体会看到所有先前的消息、工具调用和响应 — 就像您从未离开过一样。

在聊天中使用 `/title 我的会话名称` 为当前会话命名，或在命令行使用 `hermes sessions rename <id> <title>`。使用 `hermes sessions list` 浏览过去的会话。

### 会话存储

CLI 会话存储在 Hermes 的 SQLite 状态数据库中，位于 `~/.hermes/state.db`。该数据库保留：

- 会话元数据（ID、标题、时间戳、令牌计数器）
- 消息历史记录
- 压缩/恢复会话间的血统关系
- `session_search` 使用的全文搜索索引

一些消息适配器还会在数据库旁边保留每个平台的转录文件，但 CLI 本身会从 SQLite 会话存储中恢复。

### 上下文压缩

当接近上下文限制时，长对话会自动进行摘要总结：

```yaml
# 在 ~/.hermes/config.yaml 中
compression:
  enabled: true
  threshold: 0.50    # 默认在达到上下文限制的50%时进行压缩

# 摘要生成模型在辅助配置下设置：
auxiliary:
  compression:
    model: ""  # 留空则使用主聊天模型（默认）。或者指定一个廉价快速模型，例如 "google/gemini-3-flash-preview"。
```

当压缩触发时，中间轮次会被摘要总结，而前3轮和后20轮总会被保留。

## 后台会话

在单独的后台会话中运行提示，同时继续使用 CLI 进行其他工作：

```
/background 分析 /var/log 中的日志并总结今天的任何错误
```

Hermes 会立即确认任务并返回提示：

```
🔄 后台任务 #1 已开始："分析 /var/log 中的日志并总结..."
   任务 ID：bg_143022_a1b2c3
```

### 工作原理

每个 `/background` 提示都会在守护线程中生成一个**完全独立的智能体会话**：

- **隔离的对话** — 后台智能体不知道您当前会话的历史。它只接收您提供的提示。
- **相同的配置** — 后台智能体会从当前会话继承您的模型、提供商、工具集、推理设置和回退模型。
- **非阻塞** — 您的前台会话保持完全交互式。您可以聊天、运行命令，甚至启动更多后台任务。
- **多任务** — 您可以同时运行多个后台任务。每个任务都有一个编号的 ID。

### 结果

当后台任务完成时，结果会以面板形式出现在您的终端中：

```
╭─ ⚕ Hermes (后台 #1) ──────────────────────────────────╮
│ 在今天的 syslog 中发现 3 个错误：                       │
│ 1. 03:22 触发了 OOM 杀手 — 终止了 nginx 进程           │
│ 2. 07:15 /dev/sda1 发生磁盘 I/O 错误                   │
│ 3. 14:30 从 192.168.1.50 发生 SSH 登录失败尝试         │
╰──────────────────────────────────────────────────────────╯
```

如果任务失败，您会看到错误通知。如果您的配置中启用了 `display.bell_on_complete`，任务完成时终端铃声会响起。

### 使用场景

- **长时间的研究** — 在您编写代码时，执行 "/background 研究量子纠错的最新进展"
- **文件处理** — 在您继续对话时，执行 "/background 分析此仓库中的所有 Python 文件并列出任何安全问题"
- **并行调查** — 启动多个后台任务以同时探索不同方向

:::info
后台会话不会出现在您的主对话历史中。它们是拥有自己任务 ID（例如 `bg_143022_a1b2c3`）的独立会话。
:::

## 静默模式

默认情况下，CLI 运行在静默模式，该模式会：
- 抑制工具的详细日志
- 启用可爱风格的动画反馈
- 保持输出简洁且用户友好

获取调试输出：
```bash
hermes chat --verbose
```