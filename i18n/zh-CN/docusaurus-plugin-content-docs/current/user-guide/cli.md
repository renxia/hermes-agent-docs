---
sidebar_position: 1
title: "CLI 接口"
description: "掌握 Hermes 智能体终端界面 — 命令、快捷键、个性设置等"
---

# CLI 接口

Hermes 智能体的 CLI 是一个完整的终端用户界面（TUI），而非网页 UI。它支持多行编辑、斜杠命令自动补全、对话历史记录、中断重定向以及流式工具输出。专为那些常驻终端的用户打造。

:::tip
Hermes 还提供了一个现代化的 TUI，具有模态覆盖层、鼠标选择和异步输入功能。使用 `hermes --tui` 启动 — 请参阅 [TUI](tui.md) 指南。
:::

## 运行 CLI

```bash
# 启动交互式会话（默认）
hermes

# 单查询模式（非交互式）
hermes chat -q "你好"

# 使用特定模型
hermes chat --model "anthropic/claude-sonnet-4"

# 使用特定提供商
hermes chat --provider nous        # 使用 Nous Portal
hermes chat --provider openrouter  # 强制使用 OpenRouter

# 使用特定工具集
hermes chat --toolsets "web,terminal,skills"

# 启动时预加载一个或多个技能
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -q "打开一个草稿 PR"

# 恢复之前的会话
hermes --continue             # 恢复最近一次 CLI 会话 (-c)
hermes --resume <session_id>  # 根据 ID 恢复特定会话 (-r)

# 详细模式（调试输出）
hermes chat --verbose

# 隔离的 git 工作树（用于并行运行多个智能体）
hermes -w                         # 工作树中的交互模式
hermes -w -q "修复问题 #123"     # 工作树中的单查询
```

## 界面布局

<img className="docs-terminal-figure" src="/img/docs/cli-layout.svg" alt="Hermes CLI 布局的样式化预览图，展示了横幅、对话区域和固定的输入提示。" />
<p className="docs-figure-caption">Hermes CLI 横幅、对话流和固定的输入提示以稳定的文档图形形式呈现，而非脆弱的文本艺术。</p>

欢迎横幅一目了然地显示您的模型、终端后端、工作目录、可用工具和已安装的技能。

### 状态栏

一个持久的状态栏位于输入区域上方，实时更新：

```
 ⚕ claude-sonnet-4-20250514 │ 12.4K/200K │ [██████░░░░] 6% │ $0.06 │ 15m
```

| 元素 | 描述 |
|---------|-------------|
| 模型名称 | 当前模型（如果超过 26 个字符则截断） |
| 令牌计数 | 已使用的上下文令牌数 / 最大上下文窗口 |
| 上下文条 | 带有颜色编码阈值的视觉填充指示器 |
| 成本 | 预估会话成本（对于未知/免费模型显示 `n/a`） |
| 持续时间 | 会话已用时间 |

该栏会根据终端宽度自适应 — 在 ≥ 76 列时显示完整布局，在 52–75 列时显示紧凑布局，在低于 52 列时显示最小布局（仅显示模型和持续时间）。

**上下文颜色编码：**

| 颜色 | 阈值 | 含义 |
|-------|-----------|---------|
| 绿色 | < 50% | 空间充足 |
| 黄色 | 50–80% | 即将填满 |
| 橙色 | 80–95% | 接近限制 |
| 红色 | ≥ 95% | 接近溢出 — 考虑使用 `/compress` |

使用 `/usage` 查看详细的细分，包括每个类别的成本（输入与输出令牌）。

### 会话恢复显示

当恢复之前的会话（`hermes -c` 或 `hermes --resume <id>`）时，横幅和输入提示之间会出现一个“之前的对话”面板，显示对话历史的简要回顾。有关详细信息和配置，请参阅 [会话 — 恢复时的对话回顾](sessions.md#conversation-recap-on-resume)。

## 快捷键

| 按键 | 动作 |
|-----|--------|
| `Enter` | 发送消息 |
| `Alt+Enter` 或 `Ctrl+J` | 新行（多行输入） |
| `Alt+V` | 当终端支持时，从剪贴板粘贴图像 |
| `Ctrl+V` | 粘贴文本并尝试附加剪贴板图像 |
| `Ctrl+B` | 当语音模式启用时，开始/停止语音录制（`voice.record_key`，默认值：`ctrl+b`） |
| `Ctrl+C` | 中断智能体（2 秒内双击强制退出） |
| `Ctrl+D` | 退出 |
| `Ctrl+Z` | 将 Hermes 挂起到后台（仅限 Unix）。在 shell 中运行 `fg` 以恢复。 |
| `Tab` | 接受自动建议（幽灵文本）或自动补全斜杠命令 |

## 斜杠命令

输入 `/` 以查看自动补全下拉菜单。Hermes 支持大量 CLI 斜杠命令、动态技能命令和用户定义的快捷命令。

常见示例：

| 命令 | 描述 |
|---------|-------------|
| `/help` | 显示命令帮助 |
| `/model` | 显示或更改当前模型 |
| `/tools` | 列出当前可用的工具 |
| `/skills browse` | 浏览技能中心和官方可选技能 |
| `/background <prompt>` | 在单独的后台会话中运行提示 |
| `/skin` | 显示或切换活动的 CLI 皮肤 |
| `/voice on` | 启用 CLI 语音模式（按 `Ctrl+B` 录制） |
| `/voice tts` | 切换 Hermes 回复的语音播放 |
| `/reasoning high` | 增加推理努力 |
| `/title My Session` | 命名当前会话 |

有关完整的内置 CLI 和消息列表，请参阅 [斜杠命令参考](../reference/slash-commands.md)。

有关设置、提供商、静音调整和消息/Discord 语音使用，请参阅 [语音模式](features/voice-mode.md)。

:::tip
命令不区分大小写 — `/HELP` 与 `/help` 效果相同。已安装的技能也会自动成为斜杠命令。
:::

## 快捷命令

您可以定义自定义命令，无需调用 LLM 即可立即运行 shell 命令。这些命令在 CLI 和消息平台（Telegram、Discord 等）中都有效。

```yaml
# ~/.hermes/config.yaml
quick_commands:
  status:
    type: exec
    command: systemctl status hermes-agent
  gpu:
    type: exec
    command: nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv,noheader
```

然后在任何聊天中输入 `/status` 或 `/gpu`。有关更多示例，请参阅 [配置指南](/docs/user-guide/configuration#quick-commands)。

## 启动时预加载技能

如果您已经知道要为会话激活哪些技能，请在启动时传递它们：

```bash
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -s github-auth
```

Hermes 会在第一轮之前将每个命名的技能加载到会话提示中。相同的标志在交互模式和单查询模式中都有效。

## 技能斜杠命令

`~/.hermes/skills/` 中每个已安装的技能都会自动注册为斜杠命令。技能名称即为命令：

```
/gif-search funny cats
/axolotl help me fine-tune Llama 3 on my dataset
/github-pr-workflow create a PR for the auth refactor

# 仅技能名称即可加载它，并让智能体询问您需要什么：
/excalidraw
```

## 个性

设置预定义的个性以更改智能体的语气：

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
  # 添加您自己的！
```

## 多行输入

有两种输入多行消息的方法：

1. **`Alt+Enter` 或 `Ctrl+J`** — 插入新行
2. **反斜杠续行** — 以 `\` 结尾一行以继续：

```
❯ Write a function that:\
  1. Takes a list of numbers\
  2. Returns the sum
```

:::info
支持粘贴多行文本 — 使用 `Alt+Enter` 或 `Ctrl+J` 插入换行符，或直接粘贴内容。
:::

## 中断智能体

您可以在任何时候中断智能体：

- 在智能体工作时**输入新消息 + Enter** — 它会中断并处理您的新指令
- **`Ctrl+C`** — 中断当前操作（2 秒内双击强制退出）
- 进行中的终端命令会立即被终止（SIGTERM，1 秒后 SIGKILL）
- 中断期间输入的多个消息会合并为一个提示

### 忙碌输入模式

`display.busy_input_mode` 配置键控制当您在智能体工作时按 Enter 时发生的情况：

| 模式 | 行为 |
|------|----------|
| `"interrupt"`（默认） | 您的消息会中断当前操作并立即处理 |
| `"queue"` | 您的消息会静默排队，并在智能体完成后作为下一轮发送 |

```yaml
# ~/.hermes/config.yaml
display:
  busy_input_mode: "queue"   # 或 "interrupt"（默认）
```

队列模式在您想要准备后续消息而不意外取消进行中的工作时很有用。未知值会回退到 `"interrupt"`。

您也可以在 CLI 内部更改它：

```text
/busy queue
/busy interrupt
/busy status
```

### 挂起到后台

在 Unix 系统上，按 **`Ctrl+Z`** 将 Hermes 挂起到后台 — 就像任何终端进程一样。Shell 会打印确认信息：

```
Hermes Agent has been suspended. Run `fg` to bring Hermes Agent back.
```

在您的 shell 中输入 `fg` 以从您离开的地方完全恢复会话。Windows 不支持此功能。

## 工具进度显示

CLI 会在智能体工作时显示动画反馈：

**思考动画**（在 API 调用期间）：
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

使用 `/verbose` 循环切换显示模式：`off → new → all → verbose`。此命令也可以为消息平台启用 — 请参阅 [配置](/docs/user-guide/configuration#display-settings)。

### 工具预览长度

`display.tool_preview_length` 配置键控制工具调用预览行中显示的最大字符数（例如文件路径、终端命令）。默认值为 `0`，表示无限制 — 显示完整路径和命令。

```yaml
# ~/.hermes/config.yaml
display:
  tool_preview_length: 80   # 将工具预览截断为 80 个字符（0 = 无限制）
```

这在窄终端或工具参数包含非常长的文件路径时很有用。

## 会话管理

### 恢复会话

退出 CLI 会话时，会打印一条恢复命令：

```
使用以下命令恢复此会话：
  hermes --resume 20260225_143052_a1b2c3

会话：        20260225_143052_a1b2c3
持续时间：     12分34秒
消息数：       28（5条用户消息，18次工具调用）
```

恢复选项：

```bash
hermes --continue                          # 恢复最近的 CLI 会话
hermes -c                                  # 简写形式
hermes -c "my project"                     # 恢复命名会话（同谱系中最新）
hermes --resume 20260225_143052_a1b2c3     # 通过 ID 恢复特定会话
hermes --resume "refactoring auth"         # 通过标题恢复
hermes -r 20260225_143052_a1b2c3           # 简写形式
```

恢复操作会从 SQLite 中还原完整的对话历史。智能体将看到所有先前的消息、工具调用和响应——就像你从未离开过一样。

在聊天中使用 `/title 我的会话名称` 为当前会话命名，或在命令行中使用 `hermes sessions rename <id> <title>`。使用 `hermes sessions list` 浏览过去的会话。

### 会话存储

CLI 会话存储在 Hermes 的 SQLite 状态数据库中，路径为 `~/.hermes/state.db`。数据库保存：

- 会话元数据（ID、标题、时间戳、令牌计数器）
- 消息历史
- 压缩/恢复会话的谱系关系
- 由 `session_search` 使用的全文搜索索引

某些消息适配器还会在数据库旁边保存每个平台的转录文件，但 CLI 本身是从 SQLite 会话存储中恢复的。

### 上下文压缩

当接近上下文限制时，长对话会自动被摘要：

```yaml
# 在 ~/.hermes/config.yaml 中
compression:
  enabled: true
  threshold: 0.50    # 默认在上下文限制的 50% 时压缩

# 摘要模型在 auxiliary 下配置：
auxiliary:
  compression:
    model: "google/gemini-3-flash-preview"  # 用于摘要的模型
```

当触发压缩时，中间的对话轮次会被摘要，而前 3 轮和后 4 轮对话始终会被保留。

## 后台会话

在单独的后台会话中运行提示词，同时继续使用 CLI 进行其他工作：

```
/background 分析 /var/log 中的日志并总结今天的所有错误
```

Hermes 会立即确认任务并返回提示符：

```
🔄 后台任务 #1 已启动："分析 /var/log 中的日志并总结..."
   任务 ID：bg_143022_a1b2c3
```

### 工作原理

每个 `/background` 提示词都会在守护线程中启动一个**完全独立的智能体会话**：

- **隔离的对话** — 后台智能体不了解你当前会话的历史。它只会收到你提供的提示词。
- **相同配置** — 后台智能体会继承你当前会话的模型、提供商、工具集、推理设置和备用模型。
- **非阻塞** — 你的前台会话保持完全可交互。你可以聊天、运行命令，甚至启动更多后台任务。
- **多任务** — 你可以同时运行多个后台任务。每个任务都会获得一个编号 ID。

### 结果

当后台任务完成时，结果会以面板形式出现在你的终端中：

```
╭─ ⚕ Hermes（后台 #1）──────────────────────────────────╮
│ 在今天的 syslog 中发现 3 个错误：                         │
│ 1. 03:22 触发 OOM 杀手 — 终止进程 nginx        │
│ 2. 07:15 /dev/sda1 磁盘 I/O 错误                      │
│ 3. 14:30 来自 192.168.1.50 的 SSH 登录尝试失败      │
╰──────────────────────────────────────────────────────────────╯
```

如果任务失败，你会看到错误通知。如果在配置中启用了 `display.bell_on_complete`，任务完成时终端铃声会响起。

### 使用场景

- **长时间研究** — “/background 研究量子纠错的最新进展”，同时你处理代码
- **文件处理** — “/background 分析此仓库中的所有 Python 文件并列出任何安全问题”，同时你继续对话
- **并行调查** — 启动多个后台任务以同时探索不同角度

:::info
后台会话不会出现在你的主对话历史中。它们是独立的会话，具有自己的任务 ID（例如 `bg_143022_a1b2c3`）。
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