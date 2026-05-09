---
sidebar_position: 1
title: "CLI 接口"
description: "掌握 Hermes 智能体的终端界面 — 命令、键绑定、个性等"
---

# CLI 接口

Hermes 智能体的 CLI 是一个完整的终端用户界面（TUI），而不是 Web UI。它支持多行编辑、斜杠命令自动补全、对话历史、中断重定向以及流式工具输出。专为那些在终端中工作的用户打造。

:::tip
Hermes 还提供了一个现代 TUI，具有模态覆盖层、鼠标选择和异步输入功能。使用 `hermes --tui` 启动它 — 请参阅 [TUI](tui.md) 指南。
:::

## 运行 CLI

```bash
# 启动交互式会话（默认）
hermes

# 单查询模式（非交互式）
hermes chat -q "Hello"

# 使用特定模型
hermes chat --model "anthropic/claude-sonnet-4"

# 使用特定提供商
hermes chat --provider nous        # 使用 Nous Portal
hermes chat --provider openrouter  # 强制使用 OpenRouter

# 使用特定工具集
hermes chat --toolsets "web,terminal,skills"

# 以一个或多个技能预加载启动
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -q "open a draft PR"

# 恢复之前的会话
hermes --continue             # 恢复最近的 CLI 会话 (-c)
hermes --resume <session_id>  # 通过 ID 恢复特定会话 (-r)

# 详细模式（调试输出）
hermes chat --verbose

# 隔离的 git 工作树（用于并行运行多个智能体）
hermes -w                         # 工作树中的交互模式
hermes -w -q "Fix issue #123"     # 工作树中的单个查询
```

## 界面布局

<img className="docs-terminal-figure" src="/img/docs/cli-layout.svg" alt="Hermes CLI 布局样式预览图，展示横幅、对话区域和固定输入提示。" />
<p className="docs-figure-caption">Hermes CLI 横幅、对话流和固定输入提示被渲染为一个稳定的文档图示，而非脆弱的文本艺术。</p>

欢迎横幅一目了然地显示您的模型、终端后端、工作目录、可用工具和已安装的技能。

### 状态栏

一个持久的状态栏位于输入区域上方，实时更新：

```
 ⚕ claude-sonnet-4-20250514 │ 12.4K/200K │ [██████░░░░] 6% │ $0.06 │ 15m
```

| 元素 | 说明 |
|---------|-------------|
| 模型名称 | 当前模型（如果超过 26 个字符则截断） |
| Token 计数 | 已使用的上下文 token / 最大上下文窗口 |
| 上下文条 | 带颜色编码阈值的视觉填充指示器 |
| 成本 | 预估会话成本（对于未知/免费模型显示 `n/a`） |
| 持续时间 | 会话已用时间 |

状态栏会自适应终端宽度——≥76 列时显示完整布局，52–75 列时显示紧凑布局，低于 52 列时显示最小布局（仅模型 + 持续时间）。

**上下文颜色编码：**

| 颜色 | 阈值 | 含义 |
|-------|-----------|---------|
| 绿色 | < 50% | 空间充足 |
| 黄色 | 50–80% | 即将填满 |
| 橙色 | 80–95% | 接近限制 |
| 红色 | ≥ 95% | 接近溢出 — 考虑使用 `/compress` |

使用 `/usage` 可查看详细的分类成本分解（输入 vs 输出 token）。

### 会话恢复显示

当恢复之前的会话（`hermes -c` 或 `hermes --resume <id>`）时，横幅和输入提示之间会出现一个“先前对话”面板，简要回顾对话历史。详情请参见 [会话 — 恢复时的对话回顾](sessions.md#conversation-recap-on-resume)。

## 快捷键绑定

| 按键 | 操作 |
|-----|--------|
| `Enter` | 发送消息 |
| `Alt+Enter`、`Ctrl+J` 或 `Shift+Enter` | 换行（多行输入）。`Shift+Enter` 需要终端能够将其与 `Enter` 区分开 — 见下文。在 Windows Terminal 中，`Alt+Enter` 被终端捕获（切换全屏）；请改用 `Ctrl+Enter` 或 `Ctrl+J`。 |
| `Alt+V` | 从剪贴板粘贴图像（当终端支持时） |
| `Ctrl+V` | 粘贴文本并尝试附加剪贴板中的图像 |
| `Ctrl+B` | 开始/停止语音录制（当语音模式启用时，`voice.record_key`，默认值：`ctrl+b`） |
| `Ctrl+G` | 在 `$EDITOR`（vim/nvim/nano/VS Code 等）中打开当前输入缓冲区。保存并退出以将编辑后的文本作为下一个提示发送 — 非常适合长段落提示。 |
| `Ctrl+X Ctrl+E` | Emacs 风格的外部编辑器备用绑定（与 `Ctrl+G` 行为相同）。 |
| `Ctrl+C` | 中断智能体（2 秒内双击强制退出） |
| `Ctrl+D` | 退出 |
| `Ctrl+Z` | 将 Hermes 挂起到后台（仅限 Unix）。在 shell 中运行 `fg` 以恢复。 |
| `Tab` | 接受自动建议（幽灵文本）或自动补全斜杠命令 |

**多行粘贴预览。** 当您粘贴多行块时，CLI 会回显一个紧凑的单行预览（`[已粘贴：47 行，1,842 字符 — 按 Enter 发送]`），而不是将整个内容转储到回滚中。实际发送的仍是完整内容；这只是显示优化。

**最终响应中的 Markdown 剥离。** CLI 会从*最终*智能体回复中剥离最冗长的 Markdown 围栏和 `**粗体**` / `*斜体*` 包装器，使其呈现为可读的终端散文，而非原始源码。代码块和列表会被保留。这不会影响网关平台或工具结果 — 它们会保留其 Markdown 以进行原生渲染。

## 斜杠命令

输入 `/` 可查看自动补全下拉菜单。Hermes 支持大量 CLI 斜杠命令、动态技能命令和用户定义的快捷命令。

常见示例：

| 命令 | 说明 |
|---------|-------------|
| `/help` | 显示命令帮助 |
| `/model` | 显示或更改当前模型 |
| `/tools` | 列出当前可用工具 |
| `/skills browse` | 浏览技能中心和官方可选技能 |
| `/background <提示>` | 在单独的后台会话中运行提示 |
| `/skin` | 显示或切换活动的 CLI 皮肤 |
| `/voice on` | 启用 CLI 语音模式（按 `Ctrl+B` 录制） |
| `/voice tts` | 切换 Hermes 回复的语音播放 |
| `/reasoning high` | 增加推理努力 |
| `/title My Session` | 为当前会话命名 |

完整的内置 CLI 和消息列表，请参见 [斜杠命令参考](../reference/slash-commands.md)。

有关设置、提供商、静音调节和消息/Discord 语音使用，请参见 [语音模式](features/voice-mode.md)。

:::tip
命令不区分大小写 — `/HELP` 与 `/help` 效果相同。已安装的技能也会自动成为斜杠命令。
:::

## 快捷命令

您可以定义自定义命令，无需调用 LLM 即可立即运行 shell 命令。这些命令在 CLI 和消息平台（Telegram、Discord 等）中均有效。

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

然后在任意聊天中输入 `/status`、`/gpu` 或 `/restart`。更多示例请参见 [配置指南](/docs/user-guide/configuration#quick-commands)。

## 启动时预加载技能

如果您已经知道要为会话激活哪些技能，可以在启动时传递它们：

```bash
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -s github-auth
```

Hermes 会在第一轮之前将每个命名技能加载到会话提示中。该标志在交互模式和单查询模式下均有效。

## 技能斜杠命令

`~/.hermes/skills/` 中安装的每个技能都会自动注册为斜杠命令。技能名称即为命令：

```
/gif-search funny cats
/axolotl help me fine-tune Llama 3 on my dataset
/github-pr-workflow create a PR for the auth refactor

# 仅输入技能名称即可加载它，并让智能体询问您需要什么：
/excalidraw
```

## 个性

设置预定义个性以更改智能体的语气：

```
/personality pirate
/personality kawaii
/personality concise
```

内置个性包括：`helpful`、`concise`、`technical`、`creative`、`teacher`、`kawaii`、`catgirl`、`pirate`、`shakespeare`、`surfer`、`noir`、`uwu`、`philosopher`、`hype`。

您也可以在 `~/.hermes/config.yaml` 中定义自定义个性：

```yaml
personalities:
  helpful: "You are a helpful, friendly AI assistant."
  kawaii: "You are a kawaii assistant! Use cute expressions..."
  pirate: "Arrr! Ye be talkin' to Captain Hermes..."
  # 添加您自己的个性！
```

## 多行输入

有两种输入多行消息的方法：

1. **`Alt+Enter`、`Ctrl+J` 或 `Shift+Enter`** — 插入新行
2. **反斜杠续行** — 以 `\` 结尾以继续：

```
❯ Write a function that:\
  1. Takes a list of numbers\
  2. Returns the sum
```

:::info
支持粘贴多行文本 — 使用上述任意换行键，或直接粘贴内容。
:::

### Shift+Enter 兼容性

大多数终端默认情况下为 `Enter` 和 `Shift+Enter` 发送相同的字节序列，因此应用程序无法区分它们。Hermes 仅在终端通过 [Kitty 键盘协议](https://sw.kovidgoyal.net/kitty/keyboard-protocol/) 或 xterm 的 `modifyOtherKeys` 模式发送不同的序列时才能识别 `Shift+Enter`。

| 终端 | 状态 |
|---|---|
| Kitty、foot、WezTerm、Ghostty | 默认启用不同的 `Shift+Enter` |
| iTerm2（新版）、Alacritty、VS Code 终端、Warp | 在设置中启用 Kitty 协议后支持 |
| Windows Terminal Preview 1.25+ | 在设置中启用 Kitty 协议后支持 |
| macOS Terminal.app、标准 Windows Terminal（稳定版） | 不支持 — `Shift+Enter` 与 `Enter` 无法区分 |

在终端无法区分它们的情况下，`Alt+Enter` 和 `Ctrl+J` 在任何地方都有效。**特别是在 Windows Terminal 上，`Alt+Enter` 被终端捕获（切换全屏）且永远不会到达 Hermes — 请使用 `Ctrl+Enter`（作为 `Ctrl+J` 传递）或直接使用 `Ctrl+J` 进行换行。**

## 中断智能体

您可以在任何时候中断智能体：

- **在智能体工作时输入新消息 + Enter** — 它会中断并处理您的新指令
- **`Ctrl+C`** — 中断当前操作（2 秒内双击强制退出）
- 进行中的终端命令会立即被终止（SIGTERM，1 秒后 SIGKILL）
- 中断期间输入的多个消息会被合并为一个提示

### 忙碌输入模式

`display.busy_input_mode` 配置键控制当您在智能体工作时按 Enter 时会发生什么：

| 模式 | 行为 |
|------|----------|
| `"interrupt"`（默认） | 您的消息会中断当前操作并立即处理 |
| `"queue"` | 您的消息会被静默排队，并在智能体完成后作为下一轮发送 |
| `"steer"` | 您的消息会通过 `/steer` 注入当前运行，在下一轮工具调用后到达智能体 — 无中断，无新轮次 |

```yaml
# ~/.hermes/config.yaml
display:
  busy_input_mode: "steer"   # 或 "queue" 或 "interrupt"（默认）
```

`"queue"` 模式在您希望准备后续消息而不想意外取消进行中的工作时很有用。`"steer"` 模式在您希望在不中断的情况下重定向智能体时很有用 — 例如，当它仍在编辑代码时，“实际上，也检查一下测试”。未知值会回退到 `"interrupt"`。

`"steer"` 有两种自动回退：如果智能体尚未开始，或者附加了图像，消息会回退到 `"queue"` 行为，因此不会丢失任何内容。

您也可以在 CLI 内部更改它：

```text
/busy queue
/busy steer
/busy interrupt
/busy status
```

:::tip 首次接触提示
当您第一次在 Hermes 工作时按 Enter 时，Hermes 会打印一行提醒，解释 `/busy` 旋钮（`"(提示) 您的消息中断了当前运行…"`）。它仅在每次安装时触发一次 — `config.yaml` 中 `onboarding.seen.busy_input_prompt` 下的一个标志会锁定它。删除该键可再次看到提示。
:::

### 挂起到后台

在 Unix 系统上，按 **`Ctrl+Z`** 将 Hermes 挂起到后台 — 就像任何终端进程一样。Shell 会打印确认信息：

```
Hermes Agent 已被挂起。运行 `fg` 以将 Hermes Agent 带回。
```

在您的 shell 中输入 `fg` 以从您离开的地方完全恢复会话。Windows 不支持此功能。

## 工具进度显示

CLI 会在智能体工作时显示动态反馈：

**思考动画**（API 调用期间）：
```
  ◜ (｡•́︿•̀｡) 正在思考... (1.2秒)
  ◠ (⊙_⊙) 正在沉思... (2.4秒)
  ✧٩(ˊᗜˋ*)و✧ 明白了！ (3.1秒)
```

**工具执行流：**
```
  ┊ 💻 终端 `ls -la` (0.3秒)
  ┊ 🔍 网络搜索 (1.2秒)
  ┊ 📄 网页提取 (2.1秒)
```

使用 `/verbose` 循环切换显示模式：`关闭 → 新消息 → 全部 → 详细模式`。该命令也可用于消息平台 — 参见[配置文档](/docs/user-guide/configuration#display-settings)。

### 工具预览长度

`display.tool_preview_length` 配置键控制工具调用预览行中显示的最大字符数（例如文件路径、终端命令）。默认值为 `0`，表示无限制 — 显示完整路径和命令。

```yaml
# ~/.hermes/config.yaml
display:
  tool_preview_length: 80   # 将工具预览截断为 80 个字符 (0 = 无限制)
```

这在窄终端或工具参数包含非常长文件路径时很有用。

## 会话管理

### 恢复会话

退出 CLI 会话时，会打印恢复命令：

```
使用此命令恢复会话：
  hermes --resume 20260225_143052_a1b2c3

会话：        20260225_143052_a1b2c3
持续时间：     12分34秒
消息数：       28 (5 条用户消息，18 次工具调用)
```

恢复选项：

```bash
hermes --continue                          # 恢复最近的 CLI 会话
hermes -c                                  # 简写形式
hermes -c "我的项目"                       # 恢复命名会话（同谱系中最新的）
hermes --resume 20260225_143052_a1b2c3     # 通过 ID 恢复特定会话
hermes --resume "重构认证"                 # 通过标题恢复
hermes -r 20260225_143052_a1b2c3           # 简写形式
```

恢复操作会从 SQLite 中还原完整的对话历史。智能体可以看到所有先前的消息、工具调用和响应 — 就像你从未离开过一样。

在聊天中使用 `/title 我的会话名称` 为当前会话命名，或在命令行中使用 `hermes sessions rename <id> <title>`。使用 `hermes sessions list` 浏览过往会话。

### 会话存储

CLI 会话存储在 Hermes 的 SQLite 状态数据库中，路径为 `~/.hermes/state.db`。数据库保存：

- 会话元数据（ID、标题、时间戳、令牌计数器）
- 消息历史
- 压缩/恢复会话间的谱系关系
- `session_search` 使用的全文搜索索引

某些消息适配器还会在数据库旁保存每个平台的转录文件，但 CLI 本身会从 SQLite 会话存储中恢复。

### 上下文压缩

当接近上下文限制时，长对话会自动进行摘要：

```yaml
# 在 ~/.hermes/config.yaml 中
compression:
  enabled: true
  threshold: 0.50    # 默认在上下文限制的 50% 时进行压缩

# 摘要模型在 auxiliary 下配置：
auxiliary:
  compression:
    model: "google/gemini-3-flash-preview"  # 用于摘要的模型
```

触发压缩时，中间轮次会被摘要，而前 3 轮和最后 20 轮始终保留。

## 后台会话

在单独的后台会话中运行提示词，同时继续使用 CLI 进行其他工作：

```
/background 分析 /var/log 中的日志并总结今天的所有错误
```

Hermes 会立即确认任务并返回提示符：

```
🔄 后台任务 #1 已启动："分析 /var/log 中的日志并总结..."
   任务 ID: bg_143022_a1b2c3
```

### 工作原理

每个 `/background` 提示词都会在守护线程中启动一个**完全独立的智能体会话**：

- **隔离对话** — 后台智能体不了解你当前会话的历史。它只接收你提供的提示词。
- **相同配置** — 后台智能体继承当前会话的模型、提供商、工具集、推理设置和备用模型。
- **非阻塞** — 你的前台会话保持完全交互。你可以聊天、运行命令，甚至启动更多后台任务。
- **多任务** — 你可以同时运行多个后台任务。每个任务都会获得一个编号 ID。

### 结果

后台任务完成时，结果会以面板形式出现在你的终端中：

```
╭─ ⚕ Hermes (后台 #1) ──────────────────────────────────╮
│ 在今天的 syslog 中发现 3 个错误：                         │
│ 1. 03:22 触发 OOM 杀手 — 终止了 nginx 进程              │
│ 2. 07:15 /dev/sda1 磁盘 I/O 错误                         │
│ 3. 14:30 来自 192.168.1.50 的 SSH 登录尝试失败           │
╰──────────────────────────────────────────────────────────────╯
```

如果任务失败，你会看到错误通知。如果在配置中启用了 `display.bell_on_complete`，任务完成时终端会响铃。

### 使用场景

- **长时间研究** — 在编写代码时使用 "/background 研究量子纠错的最新进展"
- **文件处理** — 在继续对话时使用 "/background 分析此仓库中所有 Python 文件并列出任何安全问题"
- **并行调查** — 启动多个后台任务以同时探索不同角度

:::info
后台会话不会出现在你的主对话历史中。它们是独立的会话，拥有自己的任务 ID（例如 `bg_143022_a1b2c3`）。
:::

## 安静模式

默认情况下，CLI 运行在安静模式下，该模式：
- 抑制工具的详细日志记录
- 启用可爱风格的动画反馈
- 保持输出简洁且用户友好

如需调试输出：
```bash
hermes chat --verbose
```