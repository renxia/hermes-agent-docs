---
sidebar_position: 1
title: "CLI 界面"
description: "掌握 Hermes Agent 终端界面——命令、快捷键、人设和更多功能"
---

# CLI 界面

Hermes Agent 的 CLI 是一个完整的终端用户界面 (TUI)，而非 Web UI。它具备多行编辑、斜杠命令自动补全、对话历史记录、中断和重定向功能，以及流式工具输出。专为终端用户打造。

## 运行 CLI

```bash
# 启动交互式会话（默认）
hermes

# 单查询模式（非交互式）
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
hermes chat -s github-pr-workflow -q "打开一个草稿 PR"

# 恢复之前的会话
hermes --continue             # 恢复最近的 CLI 会话 (-c)
hermes --resume <session_id>  # 按 ID 恢复特定会话 (-r)

# 详细模式（调试输出）
hermes chat --verbose

# 隔离的 git 工作区（用于并行运行多个 Agent）
hermes -w                         # 工作区交互模式
hermes -w -q "修复 issue #123"     # 工作区单查询
```

## 界面布局

<img className="docs-terminal-figure" src="/img/docs/cli-layout.svg" alt="Hermes CLI 布局的风格化预览，显示了横幅、对话区域和固定的输入提示。" />
<p className="docs-figure-caption">Hermes CLI 的横幅、对话流和固定输入提示被渲染为稳定的文档图形，而不是脆弱的文本艺术。</p>

欢迎横幅一目了然地显示了您的模型、终端后端、工作目录、可用工具和已安装的技能。

### 状态栏

一个持久化的状态栏位于输入区域上方，实时更新：

```
 ⚕ claude-sonnet-4-20250514 │ 12.4K/200K │ [██████░░░░] 6% │ $0.06 │ 15m
```

| 元素 | 描述 |
|---------|-------------|
| 模型名称 | 当前模型（如果超过 26 个字符将被截断） |
| Token 计数 | 已用上下文 Token / 最大上下文窗口 |
| 上下文条 | 带颜色代码阈值的视觉填充指示器 |
| 成本 | 估计会话成本（或未知/零价模型的 `n/a`） |
| 持续时间 | 经过的会话时间 |

该状态栏会根据终端宽度进行调整——宽度 ≥ 76 列时显示完整布局，52–75 列时显示紧凑布局，低于 52 列时显示最小布局（仅模型 + 持续时间）。

**上下文颜色编码：**

| 颜色 | 阈值 | 含义 |
|-------|-----------|---------|
| 绿色 | < 50% | 空间充足 |
| 黄色 | 50–80% | 接近饱和 |
| 橙色 | 80–95% | 接近限制 |
| 红色 | ≥ 95% | 接近溢出——考虑使用 `/compress` |

使用 `/usage` 查看详细的成本分解，包括按类别的成本（输入 vs 输出 Token）。

### 会话恢复显示

当恢复之前的会话（`hermes -c` 或 `hermes --resume <id>`）时，一个“上一对话”面板会出现在横幅和输入提示之间，显示对话历史的紧凑回顾。有关详细信息和配置，请参阅 [会话 — 恢复时的对话回顾](sessions.md#conversation-recap-on-resume)。

## 快捷键

| 键 | 操作 |
|-----|--------|
| `Enter` | 发送消息 |
| `Alt+Enter` 或 `Ctrl+J` | 新行（多行输入） |
| `Alt+V` | 粘贴剪贴板中的图片（如果终端支持） |
| `Ctrl+V` | 粘贴文本并机会附带剪贴板图片 |
| `Ctrl+B` | 启用语音模式时开始/停止语音录制（`voice.record_key`，默认为 `ctrl+b`） |
| `Ctrl+C` | 中断 Agent（在 2 秒内双击以强制退出） |
| `Ctrl+D` | 退出 |
| `Ctrl+Z` | 将 Hermes 挂起到后台（仅限 Unix）。在 shell 中运行 `fg` 恢复。 |
| `Tab` | 接受自动建议（幽灵文本）或自动补全斜杠命令 |

## 斜杠命令

输入 `/` 可查看自动补全下拉菜单。Hermes 支持大量 CLI 斜杠命令、动态技能命令和用户自定义的快速命令。

常见示例：

| 命令 | 描述 |
|---------|-------------|
| `/help` | 显示命令帮助 |
| `/model` | 显示或更改当前模型 |
| `/tools` | 列出当前可用的工具 |
| `/skills browse` | 浏览技能中心和官方可选技能 |
| `/background <prompt>` | 在单独的后台会话中运行提示 |
| `/skin` | 显示或切换活动的 CLI 皮肤 |
| `/voice on` | 启用 CLI 语音模式（按 `Ctrl+B` 录音） |
| `/voice tts` | 切换 Hermes 回复的语音播放 |
| `/reasoning high` | 提高推理努力程度 |
| `/title My Session` | 为当前会话命名 |

有关完整的内置 CLI 和消息列表，请参阅 [斜杠命令参考](../reference/slash-commands.md)。

有关设置、提供商、静音调整以及消息/Discord 语音使用，请参阅 [语音模式](features/voice-mode.md)。

:::tip
命令不区分大小写——`/HELP` 与 `/help` 效果相同。已安装的技能也会自动成为斜杠命令。
:::

## 快速命令

您可以定义自定义命令，这些命令无需调用 LLM 即可立即运行 shell 命令。这些命令在 CLI 和消息平台（Telegram、Discord 等）上都有效。

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

如果您知道会话需要哪些技能，可以在启动时传递它们：

```bash
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -s github-auth
```

Hermes 在第一次交互前，会将每个命名的技能加载到会话提示中。此标志在交互模式和单查询模式中都有效。

## 技能斜杠命令

`~/.hermes/skills/` 中安装的每个技能都会自动注册为一个斜杠命令。技能名称即为命令：

```
/gif-search funny cats
/axolotl help me fine-tune Llama 3 on my dataset
/github-pr-workflow create a PR for the auth refactor

# 仅技能名称加载它，让 Agent 询问您需要什么：
/excalidraw
```

## 人设（Personalities）

设置预定义的“人设”来改变 Agent 的语气：

```
/personality pirate
/personality kawaii
/personality concise
```

内置人设包括：`helpful`（乐于助人）、`concise`（简洁）、`technical`（技术）、`creative`（创意）、`teacher`（教师）、`kawaii`（可爱）、`catgirl`（猫女）、`pirate`（海盗）、`shakespeare`（莎士比亚）、`surfer`（冲浪者）、`noir`（黑色）、`uwu`（可爱拟人化）、`philosopher`（哲学家）、`hype`（炒作）。

您也可以在 `~/.hermes/config.yaml` 中定义自定义人设：

```yaml
personalities:
  helpful: "你是一个乐于助人、友好的 AI 助手。"
  kawaii: "你是一个可爱的小助手！请使用可爱的表情..."
  pirate: "啊哈！你正在和船长 Hermes 交谈..."
  # 添加您自己的！
```

## 多行输入

有两种方式输入多行消息：

1. **`Alt+Enter` 或 `Ctrl+J`** — 插入新行
2. **反斜杠换行** — 在行尾使用 `\` 继续：

```
❯ 编写一个函数，它：\
  1. 接受一个数字列表\
  2. 返回总和
```

:::info
支持粘贴多行文本——使用 `Alt+Enter` 或 `Ctrl+J` 插入新行，或者直接粘贴内容。
:::

## 中断 Agent

您可以在任何时候中断 Agent：

- **在 Agent 工作时输入新消息 + Enter** — 这会中断并处理您的新指令
- **`Ctrl+C`** — 中断当前操作（在 2 秒内按两次以强制退出）
- 进行中的终端命令会立即被终止（SIGTERM，然后 1 秒后 SIGKILL）
- 在中断期间输入的多个消息会合并成一个提示

### 忙碌输入模式（Busy Input Mode）

`display.busy_input_mode` 配置键控制了当 Agent 工作时按下 Enter 会发生什么：

| 模式 | 行为 |
|------|----------|
| `"interrupt"` (默认) | 您的消息会中断当前操作并立即处理 |
| `"queue"` | 您的消息会被静默排队，并在 Agent 完成后作为下一个回合发送 |

```yaml
# ~/.hermes/config.yaml
display:
  busy_input_mode: "queue"   # 或 "interrupt" (默认)
```

队列模式在您想准备后续消息而不想意外取消正在进行的工作时非常有用。未知值将回退到 `"interrupt"`。

### 挂起到后台

在 Unix 系统上，按下 **`Ctrl+Z`** 将 Hermes 挂起到后台——就像任何终端进程一样。shell 会打印确认信息：

```
Hermes Agent 已被挂起。运行 `fg` 即可恢复 Hermes Agent。
```

在 shell 中输入 `fg` 即可恢复到您离开时的确切位置。此功能在 Windows 上不受支持。

## 工具进度显示

CLI 会显示动画反馈，表明 Agent 正在工作：

**思考动画**（API 调用期间）：
```
  ◜ (｡•́︿•̀｡) 正在思考... (1.2s)
  ◠ (⊙_⊙) 正在考虑... (2.4s)
  ✧٩(ˊᗜˋ*)و✧ 明白了！ (3.1s)
```

**工具执行流：**
```
  ┊ 💻 terminal `ls -la` (0.3s)
  ┊ 🔍 web_search (1.2s)
  ┊ 📄 web_extract (2.1s)
```

使用 `/verbose` 循环显示模式：`off → new → all → verbose`。此命令也可以为消息平台启用——请参阅 [配置](/docs/user-guide/configuration#display-settings)。

### 工具预览长度

`display.tool_preview_length` 配置键控制了工具调用预览行（例如文件路径、终端命令）显示的字符最大数量。默认值为 `0`，表示无限制——会显示完整的路径和命令。

```yaml
# ~/.hermes/config.yaml
display:
  tool_preview_length: 80   # 将工具预览截断为 80 个字符 (0 = 无限制)
```

这在狭窄的终端或工具参数包含非常长文件路径时非常有用。

## 会话管理

### 恢复会话

当您退出 CLI 会话时，会打印一个恢复命令：

```
使用以下命令恢复此会话：
  hermes --resume 20260225_143052_a1b2c3

会话：        20260225_143052_a1b2c3
持续时间：       12m 34s
消息数：       28 (5 用户，18 工具调用)
```

恢复选项：

```bash
hermes --continue                          # 恢复最近的 CLI 会话
hermes -c                                  # 简写形式
hermes -c "我的项目"                     # 恢复命名的会话（谱系中的最新）
hermes --resume 20260225_143052_a1b2c3     # 按 ID 恢复特定会话
hermes --resume "重构认证"             # 按标题恢复
hermes -r 20260225_143052_a1b2c3           # 简写形式
```

恢复会话会从 SQLite 恢复完整的对话历史。Agent 会看到所有先前的消息、工具调用和回复——就像您从未离开过一样。

在聊天中使用 `/title 我的会话名称` 来命名当前会话，或从命令行使用 `hermes sessions rename <id> <title>`。使用 `hermes sessions list` 浏览过去的会话。

### 会话存储

CLI 会话存储在 Hermes 的 SQLite 状态数据库 `~/.hermes/state.db` 中。该数据库保留了：

- 会话元数据（ID、标题、时间戳、Token 计数器）
- 消息历史记录
- 压缩/恢复会话的谱系
- `session_search` 使用的全文搜索索引

一些消息适配器也会在数据库旁边保留每个平台的转录文件，但 CLI 本身是从 SQLite 会话存储恢复的。

### 上下文压缩

当接近上下文限制时，长对话会自动进行总结：

```yaml
# 在 ~/.hermes/config.yaml 中
compression:
  enabled: true
  threshold: 0.50    # 默认在上下文限制的 50% 时压缩

# 辅助模型配置在 auxiliary 下：
auxiliary:
  compression:
    model: "google/gemini-3-flash-preview"  # 用于总结的模型
```

当压缩触发时，中间的轮次会被总结，而前 3 轮和后 4 轮总是被保留。

## 后台会话

在继续使用 CLI 进行其他工作时，可以在单独的后台会话中运行一个提示：

```
/background 分析 /var/log 中的日志，并总结今天的任何错误
```

Hermes 会立即确认任务，并将提示交还给您：

```
🔄 后台任务 #1 已启动："分析 /var/log 中的日志并总结..."
   任务 ID: bg_143022_a1b2c3
```

### 工作原理

每个 `/background` 提示都会在一个守护线程中启动一个**完全独立的 Agent 会话**：

- **隔离对话** — 后台 Agent 不了解您当前会话的历史记录。它只接收您提供的提示。
- **相同配置** — 后台 Agent 会继承您当前会话的模型、提供商、工具集、推理设置和回退模型。
- **非阻塞** — 您的前台会话保持完全交互。您可以聊天、运行命令，甚至启动更多后台任务。
- **多个任务** — 您可以同时运行多个后台任务。每个任务都会获得一个编号 ID。

### 结果

当后台任务完成时，结果会作为一个面板出现在您的终端中：

```
╭─ ⚕ Hermes (后台 #1) ──────────────────────────────────╮
│ 今天在 syslog 中发现 3 个错误：                         │
│ 1. 03:22 调用了 OOM killer — 终止了 nginx 进程        │
│ 2. 07:15 /dev/sda1 发生磁盘 I/O 错误                      │
│ 3. 14:30 从 192.168.1.50 失败的 SSH 登录尝试      │
╰──────────────────────────────────────────────────────────────╯
```

如果任务失败，您会看到错误通知。如果配置中启用了 `display.bell_on_complete`，任务完成后终端会发出提示音。

### 用例

- **长期研究** — 在您编写代码时，使用 "/background research the latest developments in quantum error correction"
- **文件处理** — 在继续对话时，使用 "/background analyze all Python files in this repo and list any security issues"
- **并行调查** — 启动多个后台任务，同时探索不同的角度

:::info
后台会话不会出现在您的主对话历史记录中。它们是独立的会话，拥有自己的任务 ID（例如 `bg_143022_a1b2c3`）。
:::

## 静音模式

默认情况下，CLI 以静音模式运行，该模式：
- 抑制工具的详细日志记录
- 启用可爱风格的动画反馈
- 保持输出干净且用户友好

要查看调试输出：
```bash
hermes chat --verbose
```