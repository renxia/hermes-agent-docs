---
sidebar_position: 1
title: "CLI 接口"
description: "掌握 Hermes 智能体终端界面 — 命令、按键绑定、个性设置等"
---

# CLI 接口

Hermes 智能体的 CLI 是一个完整的终端用户界面（TUI），而非 Web UI。它支持多行编辑、斜杠命令自动补全、对话历史记录、中断并重定向以及流式工具输出。专为那些常驻终端的用户打造。

:::tip
Hermes 还提供了一个现代化的 TUI，具有模态覆盖层、鼠标选择和异步输入功能。使用 `hermes --tui` 启动 — 请参阅 [TUI](tui.md) 指南。
:::

## 运行 CLI

```bash
# 启动交互式会话（默认）
hermes

# 单次查询模式（非交互式）
hermes chat -q "Hello"

# 使用特定模型
hermes chat --model "anthropic/claude-sonnet-4"

# 使用特定提供商
hermes chat --provider nous        # 使用 Nous Portal
hermes chat --provider openrouter  # 强制使用 OpenRouter

# 使用特定工具集
hermes chat --toolsets "web,terminal,skills"

# 以一个或多个预加载技能启动
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -q "open a draft PR"

# 恢复之前的会话
hermes --continue             # 恢复最近一次 CLI 会话（-c）
hermes --resume <session_id>  # 通过 ID 恢复特定会话（-r）

# 详细模式（调试输出）
hermes chat --verbose

# 隔离的 git 工作树（用于并行运行多个智能体）
hermes -w                         # 工作树中的交互模式
hermes -w -q "Fix issue #123"     # 工作树中的单次查询
```

## 界面布局

<img className="docs-terminal-figure" src="/img/docs/cli-layout.svg" alt="Hermes CLI 布局的风格化预览图，展示了横幅、对话区域和固定输入提示。" />
<p className="docs-figure-caption">Hermes CLI 横幅、对话流和固定输入提示被渲染为一个稳定的文档图示，而非脆弱的文本艺术。</p>

欢迎横幅一目了然地显示您的模型、终端后端、工作目录、可用工具以及已安装的技能。

### 状态栏

一个持久的状态栏位于输入区域上方，实时更新：

```
 ⚕ claude-sonnet-4-20250514 │ 12.4K/200K │ [██████░░░░] 6% │ $0.06 │ 15m
```

| 元素 | 描述 |
|---------|-------------|
| 模型名称 | 当前模型（如果超过 26 个字符则截断） |
| Token 计数 | 已使用的上下文 token / 最大上下文窗口 |
| 上下文条 | 带有颜色编码阈值的视觉填充指示器 |
| 费用 | 预估会话费用（对于未知/免费模型显示为 `n/a`） |
| 持续时间 | 会话已用时间 |

状态栏会根据终端宽度自适应 — 在 ≥ 76 列时显示完整布局，在 52–75 列时显示紧凑布局，低于 52 列时显示最小布局（仅显示模型和持续时间）。

**上下文颜色编码：**

| 颜色 | 阈值 | 含义 |
|-------|-----------|---------|
| 绿色 | < 50% | 空间充足 |
| 黄色 | 50–80% | 即将填满 |
| 橙色 | 80–95% | 接近限制 |
| 红色 | ≥ 95% | 接近溢出 — 考虑使用 `/compress` |

使用 `/usage` 可查看详细的分类费用明细（输入 vs 输出 token）。

### 会话恢复显示

当恢复之前的会话（`hermes -c` 或 `hermes --resume <id>`）时，横幅和输入提示之间会出现一个“之前的对话”面板，以简洁的方式展示对话历史记录。详情请参见 [会话 — 恢复时的对话摘要](sessions.md#conversation-recap-on-resume)。

## 快捷键

| 键 | 动作 |
|-----|--------|
| `Enter` | 发送消息 |
| `Alt+Enter` 或 `Ctrl+J` | 换行（多行输入） |
| `Alt+V` | 当终端支持时，从剪贴板粘贴图像 |
| `Ctrl+V` | 粘贴文本并尝试附加剪贴板中的图像 |
| `Ctrl+B` | 当语音模式启用时，开始/停止语音录制（`voice.record_key`，默认为 `ctrl+b`） |
| `Ctrl+C` | 中断智能体（2 秒内双击强制退出） |
| `Ctrl+D` | 退出 |
| `Ctrl+Z` | 将 Hermes 挂起到后台（仅限 Unix）。在 shell 中运行 `fg` 以恢复。 |
| `Tab` | 接受自动建议（幽灵文本）或自动补全斜杠命令 |

## 斜杠命令

输入 `/` 可查看自动补全下拉菜单。Hermes 支持大量 CLI 斜杠命令、动态技能命令和用户定义的快速命令。

常见示例：

| 命令 | 描述 |
|---------|-------------|
| `/help` | 显示命令帮助 |
| `/model` | 显示或更改当前模型 |
| `/tools` | 列出当前可用的工具 |
| `/skills browse` | 浏览技能中心及官方可选技能 |
| `/background <提示>` | 在单独的后台会话中运行提示 |
| `/skin` | 显示或切换活动的 CLI 皮肤 |
| `/voice on` | 启用 CLI 语音模式（按 `Ctrl+B` 录制） |
| `/voice tts` | 切换 Hermes 回复的语音播放 |
| `/reasoning high` | 提高推理努力程度 |
| `/title 我的会话` | 为当前会话命名 |

完整的内置 CLI 和消息列表，请参见 [斜杠命令参考](../reference/slash-commands.md)。

有关设置、提供商、静音调节以及消息/ Discord 语音使用，请参见 [语音模式](features/voice-mode.md)。

:::提示
命令不区分大小写 — `/HELP` 与 `/help` 效果相同。安装的技能也会自动成为斜杠命令。
:::

## 快速命令

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

Hermes 会在第一轮之前将每个命名的技能加载到会话提示中。相同的标志在交互模式和单查询模式下均有效。

## 技能斜杠命令

`~/.hermes/skills/` 中安装的每个技能都会自动注册为斜杠命令。技能名称即为命令：

```
/gif-search 搞笑猫咪
/axolotl 帮我在我的数据集上微调 Llama 3
/github-pr-workflow 为 auth 重构创建一个 PR

# 仅输入技能名称即可加载它，并让智能体询问您需要什么：
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
  helpful: "你是一个乐于助人、友好的 AI 助手。"
  kawaii: "你是一个 kawaii 助手！使用可爱的表达方式..."
  pirate: "啊！汝正在与 Hermes 船长对话..."
  # 添加您自己的个性！
```

## 多行输入

有两种方式输入多行消息：

1. **`Alt+Enter` 或 `Ctrl+J`** — 插入新行
2. **反斜杠续行** — 在行尾使用 `\` 以继续：

```
❯ 编写一个函数，该函数：\
  1. 接受一个数字列表\
  2. 返回它们的和
```

:::信息
支持粘贴多行文本 — 使用 `Alt+Enter` 或 `Ctrl+J` 插入换行符，或直接粘贴内容。
:::

## 中断智能体

您可以在任何时候中断智能体：

- 在智能体工作时**输入新消息 + Enter** — 它会中断并处理您的新指令
- **`Ctrl+C`** — 中断当前操作（2 秒内双击强制退出）
- 进行中的终端命令会立即被终止（SIGTERM，1 秒后 SIGKILL）
- 中断期间输入的多个消息会被合并为一个提示

### 忙碌输入模式

`display.busy_input_mode` 配置键控制当您在智能体工作时按下 Enter 时会发生什么：

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

当您想准备后续消息而不意外取消正在进行的任务时，`"queue"` 模式很有用。当您想在不中断的情况下重定向智能体时，`"steer"` 模式很有用 — 例如，当它仍在编辑代码时，“实际上，也检查一下测试”。未知值会回退到 `"interrupt"`。

`"steer"` 有两种自动回退：如果智能体尚未开始，或者附加了图像，消息会回退到 `"queue"` 行为，因此不会丢失任何内容。

您也可以在 CLI 内部更改它：

```text
/busy queue
/busy steer
/busy interrupt
/busy status
```

:::提示 首次接触提示
当您第一次在 Hermes 工作时按下 Enter 时，Hermes 会打印一行提醒，解释 `/busy` 旋钮（`"(提示) 您的消息中断了当前运行…"`）。它仅在每次安装时触发一次 — `config.yaml` 中 `onboarding.seen.busy_input_prompt` 下的标志会锁定它。删除该键可再次看到提示。
:::

### 挂起到后台

在 Unix 系统上，按 **`Ctrl+Z`** 将 Hermes 挂起到后台 — 就像任何其他终端进程一样。Shell 会打印确认信息：

```
Hermes 智能体已被挂起。运行 `fg` 以恢复 Hermes 智能体。
```

在您的 shell 中输入 `fg` 以从您离开的地方完全恢复会话。Windows 不支持此功能。

## 工具进度显示

CLI 会在智能体工作时显示动态反馈：

**思考动画**（API 调用期间）：
```
  ◜ (｡•́︿•̀｡) 思考中... (1.2秒)
  ◠ (⊙_⊙) 沉思中... (2.4秒)
  ✧٩(ˊᗜˋ*)و✧ 明白了！(3.1秒)
```

**工具执行流：**
```
  ┊ 💻 终端 `ls -la` (0.3秒)
  ┊ 🔍 网络搜索 (1.2秒)
  ┊ 📄 网页提取 (2.1秒)
```

使用 `/verbose` 循环切换显示模式：`关闭 → 新消息 → 全部 → 详细`。此命令也可用于消息平台 — 详见[配置](/docs/user-guide/configuration#display-settings)。

### 工具预览长度

`display.tool_preview_length` 配置键控制工具调用预览行中显示的最大字符数（例如文件路径、终端命令）。默认值为 `0`，表示无限制 — 显示完整路径和命令。

```yaml
# ~/.hermes/config.yaml
display:
  tool_preview_length: 80   # 将工具预览截断为 80 个字符 (0 = 无限制)
```

这在窄终端或工具参数包含很长文件路径时非常有用。

## 会话管理

### 恢复会话

退出 CLI 会话时，会打印恢复命令：

```
使用此命令恢复会话：
  hermes --resume 20260225_143052_a1b2c3

会话：        20260225_143052_a1b2c3
持续时间：       12分34秒
消息数：       28 (5 条用户消息，18 次工具调用)
```

恢复选项：

```bash
hermes --continue                          # 恢复最近的 CLI 会话
hermes -c                                  # 简写形式
hermes -c "my project"                     # 恢复命名会话（同谱系中最新的）
hermes --resume 20260225_143052_a1b2c3     # 通过 ID 恢复特定会话
hermes --resume "refactoring auth"         # 通过标题恢复
hermes -r 20260225_143052_a1b2c3           # 简写形式
```

恢复操作会从 SQLite 中还原完整的对话历史。智能体会看到所有先前的消息、工具调用和响应 — 就像你从未离开过一样。

在聊天中使用 `/title 我的会话名称` 为当前会话命名，或在命令行中使用 `hermes sessions rename <id> <title>`。使用 `hermes sessions list` 浏览过去的会话。

### 会话存储

CLI 会话存储在 Hermes 的 SQLite 状态数据库中，位于 `~/.hermes/state.db`。数据库保存：

- 会话元数据（ID、标题、时间戳、令牌计数器）
- 消息历史
- 压缩/恢复会话间的谱系关系
- 由 `session_search` 使用的全文搜索索引

某些消息适配器还会在数据库旁保存每个平台的转录文件，但 CLI 本身是从 SQLite 会话存储中恢复的。

### 上下文压缩

当接近上下文限制时，长对话会自动被摘要：

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

当触发压缩时，中间轮次会被摘要，而前 3 轮和后 4 轮始终保留。

## 后台会话

在单独的后台会话中运行提示，同时继续使用 CLI 进行其他工作：

```
/background 分析 /var/log 中的日志并总结今天的所有错误
```

Hermes 会立即确认任务并返回提示：

```
🔄 后台任务 #1 已启动："分析 /var/log 中的日志并总结..."
   任务 ID：bg_143022_a1b2c3
```

### 工作原理

每个 `/background` 提示都会在线程中启动一个**完全独立的智能体会话**：

- **隔离的对话** — 后台智能体不了解你当前会话的历史。它只接收你提供的提示。
- **相同配置** — 后台智能体继承你当前会话的模型、提供商、工具集、推理设置和备用模型。
- **非阻塞** — 你的前台会话保持完全交互。你可以聊天、运行命令，甚至启动更多后台任务。
- **多任务** — 你可以同时运行多个后台任务。每个任务都会获得一个编号 ID。

### 结果

当后台任务完成时，结果会以面板形式出现在你的终端中：

```
╭─ ⚕ Hermes (后台 #1) ──────────────────────────────────╮
│ 今天 syslog 中发现 3 个错误：                         │
│ 1. 03:22 触发 OOM 杀手 — 终止进程 nginx        │
│ 2. 07:15 /dev/sda1 磁盘 I/O 错误                      │
│ 3. 14:30 来自 192.168.1.50 的 SSH 登录尝试失败      │
╰──────────────────────────────────────────────────────────────╯
```

如果任务失败，你会看到错误通知。如果在配置中启用了 `display.bell_on_complete`，任务完成时终端铃声会响起。

### 使用场景

- **长时间研究** — “/background 研究量子纠错的最新进展”，同时你编写代码
- **文件处理** — “/background 分析此仓库中所有 Python 文件并列出任何安全问题”，同时你继续对话
- **并行调查** — 启动多个后台任务以同时探索不同角度

:::info
后台会话不会出现在你的主对话历史中。它们是独立的会话，拥有自己的任务 ID（例如 `bg_143022_a1b2c3`）。
:::

## 安静模式

默认情况下，CLI 运行在安静模式下，该模式：
- 抑制工具的详细日志
- 启用可爱风格的动态反馈
- 保持输出简洁且用户友好

如需调试输出：
```bash
hermes chat --verbose
```