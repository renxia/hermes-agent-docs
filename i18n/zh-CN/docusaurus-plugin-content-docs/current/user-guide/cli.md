---
sidebar_position: 1
title: "命令行界面"
description: "精通 Hermes 智能体终端界面 — 命令、按键绑定、个性化设置等"
---

# 命令行界面

Hermes 智能体的命令行界面是一个完整的终端用户界面 (TUI) — 而非网页界面。它具备多行编辑、斜杠命令自动补全、对话历史、中断与重定向，以及流式工具输出功能。专为终端重度用户打造。

:::tip
Hermes 也提供一个现代化的 TUI，具有模态弹窗、鼠标选择和非阻塞输入。使用 `hermes --tui` 启动 — 请参阅 [TUI](tui.md) 指南。
:::

## 运行命令行界面

```bash
# 启动交互式会话（默认）
hermes

# 单次查询模式（非交互式）
hermes chat -q "你好"

# 指定特定模型
hermes chat --model "anthropic/claude-sonnet-4"

# 指定特定提供商
hermes chat --provider nous        # 使用 Nous 门户
hermes chat --provider openrouter  # 强制使用 OpenRouter

# 指定特定工具集
hermes chat --toolsets "web,terminal,skills"

# 启动时预加载一个或多个技能
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -q "打开一个草案 PR"

# 恢复之前的会话
hermes --continue             # 恢复最近的 CLI 会话 (-c)
hermes --resume <session_id>  # 按 ID 恢复特定会话 (-r)

# 详细模式（调试输出）
hermes chat --verbose

# 隔离的 Git 工作树（用于并行运行多个智能体）
hermes -w                         # 工作树中的交互模式
hermes -w -q "修复问题 #123"     # 工作树中的单次查询
```

## 界面布局

<img className="docs-terminal-figure" src="/img/docs/cli-layout.svg" alt="Hermes CLI 布局的风格化预览，展示了横幅、对话区域和固定输入提示符。" />
<p className="docs-figure-caption">Hermes CLI 的横幅、对话流和固定输入提示符，以稳定的文档图形而非脆弱的文字艺术呈现。</p>

欢迎横幅一目了然地显示您的模型、终端后端、工作目录、可用工具和已安装的技能。

### 状态栏

输入区域上方有一个持久的状态栏，实时更新：

```
 ⚕ claude-sonnet-4-20250514 │ 12.4K/200K │ [██████░░░░] 6% │ $0.06 │ 15m
```

| 元素 | 描述 |
|---------|-------------|
| 模型名称 | 当前模型（如果超过 26 个字符则截断） |
| Token 计数 | 已使用的上下文 token / 最大上下文窗口 |
| 上下文进度条 | 带有颜色编码阈值的可视化填充指示器 |
| 费用 | 预估的会话费用（对于未知或零价格模型显示 `n/a`） |
| 持续时间 | 已经过的会话时间 |

该栏会自适应终端宽度 — ≥ 76 列时显示完整布局，52–75 列时紧凑布局，低于 52 列时最小化（仅显示模型和持续时间）。

**上下文颜色编码：**

| 颜色 | 阈值 | 含义 |
|-------|-----------|---------|
| 绿色 | &lt; 50% | 充裕空间 |
| 黄色 | 50–80% | 逐渐填满 |
| 橙色 | 80–95% | 接近限制 |
| 红色 | ≥ 95% | 即将溢出 — 考虑使用 `/compress` |

使用 `/usage` 获取详细分解信息，包括按类别的费用（输入 token 与输出 token）。

### 会话恢复显示

当恢复之前的会话时（`hermes -c` 或 `hermes --resume &lt;id>`），横幅和输入提示符之间会出现一个"上次对话"面板，显示对话历史的紧凑回顾。详情和配置请参阅 [会话 — 恢复时的对话回顾](sessions.md#conversation-recap-on-resume)。

## 按键绑定

| 按键 | 操作 |
|-----|--------|
| `Enter` | 发送消息 |
| `Alt+Enter`、`Ctrl+J` 或 `Shift+Enter` | 换行（多行输入）。`Shift+Enter` 需要终端能够区分它与 `Enter` — 详见下文。在 Windows Terminal 上，`Alt+Enter` 被终端捕获（全屏切换）；请改用 `Ctrl+Enter` 或 `Ctrl+J`。 |
| `Alt+V` | 在终端支持的情况下从剪贴板粘贴图片 |
| `Ctrl+V` | 粘贴文本并附带剪贴板中的图片（如果有的话） |
| `Ctrl+B` | 启用语音模式时开始/停止语音录制（`voice.record_key`，默认：`ctrl+b`） |
| `Ctrl+G` | 在 `$EDITOR` 中打开当前输入缓冲区（vim/nvim/nano/VS Code 等）。保存并退出即可将编辑后的文本作为下一条提示发送 — 适用于长段落提示。 |
| `Ctrl+X Ctrl+E` | Emacs 风格的外部编辑器替代绑定（与 `Ctrl+G` 行为相同）。 |
| `Ctrl+C` | 中断智能体（2 秒内按两次强制退出） |
| `Ctrl+D` | 退出 |
| `Ctrl+Z` | 将 Hermes 挂起到后台（仅限 Unix）。在 shell 中运行 `fg` 恢复。 |
| `Tab` | 接受自动建议（灰色文本）或自动补全斜杠命令 |

**多行粘贴预览。** 当您粘贴多行文本块时，CLI 会回显紧凑的单行预览（`[已粘贴：47 行，1,842 个字符 — 按 Enter 发送]`），而不是将整个内容转储到滚动缓冲区中。实际发送的仍是完整内容；这只是显示上的优化。

**最终回复中的 Markdown 剥离。** CLI 会从*最终*智能体回复中剥离最冗余的 markdown 围栏和 `**粗体**` / `*斜体*` 包装，使它们以可读的终端文本呈现，而非原始源码。代码块和列表会被保留。这不会影响网关平台或工具结果 — 它们保留自己的 markdown 以进行原生渲染。

## 斜杠命令

输入 `/` 查看自动补全下拉菜单。Hermes 支持大量 CLI 斜杠命令、动态技能命令和用户自定义快捷命令。

常用示例：

| 命令 | 描述 |
|---------|-------------|
| `/help` | 显示命令帮助 |
| `/model` | 显示或更改当前模型 |
| `/tools` | 列出当前可用工具 |
| `/skills browse` | 浏览技能中心和官方可选技能 |
| `/background &lt;prompt>` | 在单独的后台会话中运行提示 |
| `/skin` | 显示或切换活跃的 CLI 皮肤 |
| `/voice on` | 启用 CLI 语音模式（按 `Ctrl+B` 录制） |
| `/voice tts` | 切换 Hermes 回复的语音播放 |
| `/reasoning high` | 增加推理强度 |
| `/title My Session` | 为当前会话命名 |

完整的内置 CLI 和消息命令列表，请参阅 [斜杠命令参考](../reference/slash-commands.md)。

有关设置、提供商、静默调优以及消息/Discord 语音使用，请参阅 [语音模式](features/voice-mode.md)。

:::tip
命令不区分大小写 — `/HELP` 与 `/help` 效果相同。已安装的技能也会自动注册为斜杠命令。
:::

## 快捷命令

您可以定义自定义命令，在不调用 LLM 的情况下立即运行 shell 命令。这些命令在 CLI 和消息平台（Telegram、Discord 等）中均可使用。

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

然后在任意聊天中输入 `/status`、`/gpu` 或 `/restart`。更多示例请参阅[配置指南](/docs/user-guide/configuration#quick-commands)。

## 启动时预加载技能

如果您已经知道会话中需要激活哪些技能，可以在启动时传入：

```bash
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -s github-auth
```

Hermes 会在第一轮对话之前将每个命名的技能加载到会话提示中。相同的标志在交互模式和单查询模式下均适用。

## 技能斜杠命令

`~/.hermes/skills/` 中每个已安装的技能都会自动注册为斜杠命令。技能名称即为命令：

```
/gif-search funny cats
/axolotl help me fine-tune Llama 3 on my dataset
/github-pr-workflow create a PR for the auth refactor

# 仅输入技能名称会加载它，并让智能体询问您需要什么：
/excalidraw
```

## 个性

设置预定义的个性来改变智能体的语气：

```
/personality pirate
/personality kawaii
/personality concise
```

内置个性包括：`helpful`、`concise`、`technical`、`creative`、`teacher`、`kawaii`、`catgirl`、`pirate`、`shakespeare`、`surfer`、`noir`、`uwu`、`philosopher`、`hype`。

您还可以在 `~/.hermes/config.yaml` 中定义自定义个性：

```yaml
personalities:
  helpful: "You are a helpful, friendly AI assistant."
  kawaii: "You are a kawaii assistant! Use cute expressions..."
  pirate: "Arrr! Ye be talkin' to Captain Hermes..."
  # 添加您自己的！
```

## 多行输入

有两种方式输入多行消息：

1. **`Alt+Enter`、`Ctrl+J` 或 `Shift+Enter`** — 插入新行
2. **反斜杠续行** — 在行尾使用 `\` 继续：

```
❯ Write a function that:\
  1. Takes a list of numbers\
  2. Returns the sum
```

:::info
支持粘贴多行文本 — 使用上述任意换行键，或直接粘贴内容即可。
:::

### Shift+Enter 兼容性

大多数终端默认对 `Enter` 和 `Shift+Enter` 发送相同的字节序列，因此应用程序无法区分它们。Hermes 仅在终端通过 [Kitty 键盘协议](https://sw.kovidgoyal.net/kitty/keyboard-protocol/) 或 xterm 的 `modifyOtherKeys` 模式发送不同序列时才识别 `Shift+Enter`。

| 终端 | 状态 |
|---|---|
| Kitty、foot、WezTerm、Ghostty | 默认启用不同的 `Shift+Enter` |
| iTerm2（近期版本）、Alacritty、VS Code 终端、Warp | 在设置中启用 Kitty 协议后支持 |
| Windows Terminal Preview 1.25+ | 在设置中启用 Kitty 协议后支持 |
| macOS Terminal.app、原版 Windows Terminal（稳定版） | 不支持 — `Shift+Enter` 与 `Enter` 无法区分 |

当终端无法区分时，`Alt+Enter` 和 `Ctrl+J` 在所有地方都可正常工作。**特别地，在 Windows Terminal 上，`Alt+Enter` 被终端捕获（切换全屏），永远不会到达 Hermes — 请使用 `Ctrl+Enter`（作为 `Ctrl+J` 传递）或直接使用 `Ctrl+J` 来换行。**

## 中断智能体

您可以在任何时刻中断智能体：

- 在智能体工作时**输入新消息 + Enter** — 它会中断并处理您的新指令
- **`Ctrl+C`** — 中断当前操作（2 秒内按两次强制退出）
- 正在执行的终端命令会立即被终止（先发送 SIGTERM，1 秒后发送 SIGKILL）
- 中断期间输入的多条消息会合并为一条提示

### 繁忙输入模式

`display.busy_input_mode` 配置键控制在智能体工作时按 Enter 会发生什么：

| 模式 | 行为 |
|------|----------|
| `"interrupt"`（默认） | 您的消息会中断当前操作并立即被处理 |
| `"queue"` | 您的消息会被静默排队，在智能体完成后作为下一轮发送 |
| `"steer"` | 您的消息通过 `/steer` 注入当前运行中，在下一次工具调用后到达智能体 — 无中断，无新轮次 |

```yaml
# ~/.hermes/config.yaml
display:
  busy_input_mode: "steer"   # 或 "queue" 或 "interrupt"（默认）
```

`"queue"` 模式在您想准备后续消息而不想意外取消正在运行的任务时很有用。`"steer"` 模式在您想在不中断的情况下中途重定向智能体时很有用 — 例如在智能体编辑代码时说"实际上，也检查一下测试"。未知值会回退到 `"interrupt"`。

`"steer"` 有两个自动回退机制：如果智能体尚未启动，或者附加了图片，消息会回退到 `"queue"` 行为，确保不会丢失任何内容。

您也可以在 CLI 内更改：

```text
/busy queue
/busy steer
/busy interrupt
/busy status
```

:::tip 首次提示
当您在 Hermes 工作时首次按 Enter 时，Hermes 会打印一行提醒，说明 `/busy` 调节旋钮（"(提示) 您的消息中断了当前运行…"）。每个安装仅触发一次 — `config.yaml` 中 `onboarding.seen.busy_input_prompt` 下的标志将其锁定。删除该键可再次看到提示。
:::

### 挂起到后台

在 Unix 系统上，按 **`Ctrl+Z`** 将 Hermes 挂起到后台 — 就像任何终端进程一样。Shell 会打印确认信息：

```
Hermes Agent 已被挂起。运行 `fg` 恢复 Hermes Agent。
```

在 shell 中输入 `fg` 即可从您离开的确切位置恢复会话。Windows 上不支持此功能。

## 工具进度显示

CLI 在智能体工作时会显示动态反馈：

**思考动画**（API 调用期间）：
```
  ◜ (｡•́︿•̀｡) pondering... (1.2s)
  ◠ (⊙_⊙) contemplating... (2.4s)
  ✧٩(ˊᗜˋ*)و✧ got it! (3.1s)
```

**工具执行流：**
```
  ┊ 💻 terminal `ls -la` (0.3s)
  ┊ 🔍 web_search (1.2s)
  ┊ 📄 web_extract (2.1s)
```

使用 `/verbose` 切换显示模式：`off → new → all → verbose`。此命令也可为消息平台启用——参见[配置](/docs/user-guide/configuration#display-settings)。

### 工具预览长度

`display.tool_preview_length` 配置键控制工具调用预览行（例如文件路径、终端命令）中显示的最大字符数。默认为 `0`，表示无限制——显示完整路径和命令。

```yaml
# ~/.hermes/config.yaml
display:
  tool_preview_length: 80   # 将工具预览截断为80个字符（0=无限制）
```

这在窄终端或工具参数包含很长文件路径时很有用。

## 会话管理

### 恢复会话

当您退出 CLI 会话时，会打印一条恢复命令：

```
使用以下命令恢复此会话：
  hermes --resume 20260225_143052_a1b2c3

会话：         20260225_143052_a1b2c3
持续时间：       12m 34s
消息数：         28 (5用户, 18次工具调用)
```

恢复选项：

```bash
hermes --continue                          # 恢复最近的CLI会话
hermes -c                                  # 简短形式
hermes -c "my project"                     # 恢复命名会话（同一系列中最新的）
hermes --resume 20260225_143052_a1b2c3     # 通过ID恢复特定会话
hermes --resume "refactoring auth"         # 通过标题恢复
hermes -r 20260225_143052_a1b2c3           # 简短形式
```

恢复操作会从 SQLite 中调出完整的对话历史。智能体会看到所有先前的消息、工具调用和响应——就像您从未离开过一样。

在聊天中使用 `/title My Session Name` 命名当前会话，或在命令行使用 `hermes sessions rename <id> <title>`。使用 `hermes sessions list` 浏览过去的会话。

### 会话存储

CLI 会话存储在 Hermes 的 SQLite 状态数据库中，路径为 `~/.hermes/state.db`。数据库保存：

- 会话元数据（ID、标题、时间戳、令牌计数器）
- 消息历史
- 跨压缩/恢复会话的谱系关系
- `session_search` 使用的全文搜索索引

一些消息适配器还会在数据库旁边保留每个平台的转录文件，但 CLI 本身从 SQLite 会话存储中恢复。

### 上下文压缩

当接近上下文限制时，长对话会自动进行摘要：

```yaml
# 在 ~/.hermes/config.yaml 中
compression:
  enabled: true
  threshold: 0.50    # 默认在上下文限制的50%时压缩

# 摘要模型在辅助部分配置：
auxiliary:
  compression:
    model: ""  # 留空以使用主要聊天模型（默认）。或固定使用一个廉价快速模型，例如 "google/gemini-3-flash-preview"。
```

当压缩触发时，中间的对话轮次会被摘要，而前3轮和后20轮始终被保留。

## 后台会话

在单独的后台会话中运行提示，同时继续使用 CLI 进行其他工作：

```
/background 分析 /var/log 中的日志并总结今天的任何错误
```

Hermes 会立即确认任务并返回提示：

```
🔄 后台任务 #1 已启动："分析 /var/log 中的日志并总结..."
   任务 ID：bg_143022_a1b2c3
```

### 工作原理

每个 `/background` 提示都会在守护线程中生成一个**完全独立的智能体会话**：

- **隔离的对话** — 后台智能体对您当前会话的历史一无所知。它只接收您提供的提示。
- **相同配置** — 后台智能体会从当前会话继承您的模型、提供商、工具集、推理设置和回退模型。
- **非阻塞** — 您的前台会话保持完全交互。您可以聊天、运行命令，甚至启动更多后台任务。
- **多任务** — 您可以同时运行多个后台任务。每个任务都有一个编号ID。

### 结果

当后台任务完成时，结果会以面板形式显示在您的终端中：

```
╭─ ⚕ Hermes (后台 #1) ──────────────────────────────────╮
│ 在今天的 syslog 中发现了 3 个错误：                     │
│ 1. 03:22 调用了 OOM 终结器 — 杀死了 nginx 进程          │
│ 2. 07:15 /dev/sda1 磁盘 I/O 错误                       │
│ 3. 14:30 来自 192.168.1.50 的 SSH 登录尝试失败          │
╰────────────────────────────────────────────────────────╯
```

如果任务失败，您将看到错误通知。如果您的配置中启用了 `display.bell_on_complete`，任务完成时终端会响铃。

### 用例

- **长时间研究** — 当您在编写代码时，使用"/background 研究量子纠错领域的最新进展"
- **文件处理** — 当您继续对话时，使用"/background 分析此代码仓库中的所有 Python 文件并列出任何安全问题"
- **并行调查** — 启动多个后台任务以同时探索不同方向

:::info
后台会话不会出现在您的主对话历史中。它们是拥有自己任务 ID（例如 `bg_143022_a1b2c3`）的独立会话。
:::

## 安静模式

默认情况下，CLI 运行在安静模式下，该模式：
- 抑制工具的详细日志
- 启用可爱风格的动画反馈
- 保持输出干净且用户友好

用于调试输出：
```bash
hermes chat --verbose
```