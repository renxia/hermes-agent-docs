---
sidebar_position: 1
title: "CLI 界面"
description: "掌握 Hermes Agent 终端界面 —— 命令、快捷键、个性设定等"
---

# CLI 界面

Hermes Agent 的 CLI 是一个完整的终端用户界面 (TUI)，而非网页界面。它支持多行编辑、斜杠命令自动补全、对话历史记录、中断与重定向、流式工具输出等功能，专为习惯使用终端的用户设计。

:::tip
Hermes 还提供了一个现代化的 TUI，具备模态覆盖层、鼠标选择和无需阻塞的输入功能。通过 `hermes --tui` 启动 —— 详见 [TUI](tui.md) 指南。
:::

## 运行 CLI

```bash
# 启动交互式会话（默认）
hermes

# 单次查询模式（非交互）
hermes chat -q "你好"

# 指定模型
hermes chat --model "anthropic/claude-sonnet-4"

# 指定提供商
hermes chat --provider nous        # 使用 Nous Portal
hermes chat --provider openrouter  # 强制使用 OpenRouter

# 指定工具集
hermes chat --toolsets "web,terminal,skills"

# 启动时预加载技能
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -q "创建一个草稿 PR"

# 恢复之前的会话
hermes --continue             # 恢复最近一次 CLI 会话 (-c)
hermes --resume <session_id>  # 按 ID 恢复特定会话 (-r)

# 详细模式（调试输出）
hermes chat --verbose

# 隔离的 git worktree（用于并行运行多个代理）
hermes -w                         # 在 worktree 中交互式运行
hermes -w -q "修复问题 #123"     # 在 worktree 中单次查询
```

## 界面布局

<img className="docs-terminal-figure" src="/img/docs/cli-layout.svg" alt="Hermes CLI 布局的风格化预览，显示横幅、对话区域和固定的输入提示。" />
<p className="docs-figure-caption">Hermes CLI 横幅、对话流和固定输入提示以稳定的文档图片形式呈现，而非易碎的文本艺术。</p>

欢迎横幅一目了然地显示当前模型、终端后端、工作目录、可用工具和已安装的技能。

### 状态栏

一个持久存在的状态栏位于输入区域上方，实时更新：

```
 ⚕ claude-sonnet-4-20250514 │ 12.4K/200K │ [██████░░░░] 6% │ $0.06 │ 15m
```

| 元素 | 说明 |
|---------|-------------|
| 模型名称 | 当前模型（超过 26 字符则截断） |
| 令牌计数 | 使用的上下文令牌数 / 最大上下文窗口 |
| 上下文条 | 带颜色编码阈值的视觉填充指示器 |
| 成本 | 预估会话成本（或 `n/a` 表示未知/零价模型） |
| 持续时间 | 已用会话时间 |

该栏会根据终端宽度自适应：≥76 列时为完整布局，52–75 列为紧凑布局，低于 52 列则仅显示模型和持续时间。

**上下文颜色编码：**

| 颜色 | 阈值 | 含义 |
|-------|-----------|---------|
| 绿色 | < 50% | 空间充足 |
| 黄色 | 50–80% | 即将满 |
| 橙色 | 80–95% | 接近极限 |
| 红色 | ≥ 95% | 即将溢出 — 建议使用 `/compress` |

使用 `/usage` 可查看详细的成本分解（包括输入 vs 输出令牌）。

### 会话恢复显示

当恢复之前的会话（`hermes -c` 或 `hermes --resume <id>`）时，会在横幅和输入提示之间显示“Previous Conversation”面板，展示对话历史的简要回顾。详见 [Sessions — 恢复时的对话回顾](sessions.md#conversation-recap-on-resume) 及配置说明。

## 快捷键

| 按键 | 操作 |
|-----|--------|
| `Enter` | 发送消息 |
| `Alt+Enter` 或 `Ctrl+J` | 新行（多行输入） |
| `Alt+V` | 从剪贴板粘贴图像（终端支持时） |
| `Ctrl+V` | 粘贴文本并附带剪贴板图像（如有） |
| `Ctrl+B` | 开始/停止语音录制（启用语音模式时，默认键位：`ctrl+b`） |
| `Ctrl+C` | 中断代理（2 秒内双击强制退出） |
| `Ctrl+D` | 退出 |
| `Ctrl+Z` | 将 Hermes 挂起到后台（仅限 Unix）。在 shell 中运行 `fg` 恢复。 |
| `Tab` | 接受自动建议（幽灵文本）或补全斜杠命令 |

## 斜杠命令

输入 `/` 可查看自动补全下拉菜单。Hermes 支持大量 CLI 斜杠命令、动态技能命令和用户自定义快捷命令。

常见示例：

| 命令 | 说明 |
|---------|-------------|
| `/help` | 显示命令帮助 |
| `/model` | 显示或更改当前模型 |
| `/tools` | 列出当前可用工具 |
| `/skills browse` | 浏览技能库和官方可选技能 |
| `/background <prompt>` | 在独立后台会话中运行提示 |
| `/skin` | 显示或切换活动 CLI 皮肤 |
| `/voice on` | 启用 CLI 语音模式（按 `Ctrl+B` 录制） |
| `/voice tts` | 切换 Hermes 回复的语音播放 |
| `/reasoning high` | 提高推理努力程度 |
| `/title My Session` | 命名当前会话 |

完整内置 CLI 和消息列表请参见 [斜杠命令参考](../reference/slash-commands.md)。

有关设置、提供商、静音调节及消息/Discord 语音使用，请参见 [语音模式](features/voice-mode.md)。

:::tip
命令不区分大小写 — `/HELP` 与 `/help` 效果相同。已安装的技能也会自动成为斜杠命令。
:::

## 快捷命令

您可以定义自定义命令，这些命令会直接执行 shell 命令而无需调用 LLM。这些命令在 CLI 和消息平台（Telegram、Discord 等）中均可使用。

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

然后在任意聊天中输入 `/status` 或 `/gpu` 即可。更多示例见 [配置指南](/docs/user-guide/configuration#quick-commands)。

## 启动时预加载技能

如果您已知会话中需要哪些技能，可在启动时传入：

```bash
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -s github-auth
```

Hermes 会在首次对话前将每个命名技能加载到会话提示中。此标志在交互模式和单次查询模式下均有效。

## 技能斜杠命令

`~/.hermes/skills/` 中安装的每个技能都会自动注册为斜杠命令，技能名称即为命令名：

```
/gif-search 搞笑猫咪
/axolotl 帮我微调 Llama 3 在我的数据集上
/github-pr-workflow 为 auth 重构创建一个 PR

# 仅输入技能名称即可加载并让代理询问您的需求：
/excalidraw
```

## 个性设定

通过预设个性改变代理的语气：

```
/personality pirate
/personality kawaii
/personality concise
```

内置个性包括：`helpful`、`concise`、`technical`、`creative`、`teacher`、`kawaii`、`catgirl`、`pirate`、`shakespeare`、`surfer`、`noir`、`uwu`、`philosopher`、`hype`。

您也可以在 `~/.hermes/config.yaml` 中定义自定义个性：

```yaml
personalities:
  helpful: "你是一个友好、乐于助人的 AI 助手。"
  kawaii: "你是一个可爱的助手！请使用可爱的表达方式..."
  pirate: "啊哈！你正在与赫尔墨斯船长交谈..."
  # 添加你自己的！
```

## 多行输入

有两种方式输入多行消息：

1. **`Alt+Enter` 或 `Ctrl+J`** — 插入新行  
2. **反斜杠续行** — 在行尾加 `\` 继续：

```
❯ 编写一个函数，要求：\
  1. 接收数字列表\
  2. 返回总和
```

:::info
支持粘贴多行文本 — 使用 `Alt+Enter` 或 `Ctrl+J` 插入换行，或直接粘贴内容。
:::

## 中断代理

您可以在任何时候中断代理：

- **在代理工作时输入新消息 + Enter** — 它会中断当前操作并处理您的新指令  
- **`Ctrl+C`** — 中断当前操作（2 秒内双击强制退出）  
- 正在执行的终端命令会立即被终止（先 SIGTERM，1 秒后 SIGKILL）  
- 在中断期间输入的多条消息会被合并为一个提示  

### 忙碌输入模式

`display.busy_input_mode` 配置项控制您在代理工作时按下 Enter 会发生什么：

| 模式 | 行为 |
|------|----------|
| `"interrupt"`（默认） | 您的消息会中断当前操作并立即处理 |
| `"queue"` | 您的消息会被静默排队，在代理完成后作为下一轮发送 |

```yaml
# ~/.hermes/config.yaml
display:
  busy_input_mode: "queue"   # 或 "interrupt"（默认）
```

队列模式适用于您希望准备后续消息而不意外取消正在进行的操作。未知值会回退到 `"interrupt"`。

### 挂起到后台

在 Unix 系统上，按 **`Ctrl+Z`** 可将 Hermes 挂起到后台 — 就像任何终端进程一样。shell 会打印确认信息：

```
Hermes Agent 已被挂起。运行 `fg` 将 Hermes Agent 带回前台。
```

在 shell 中输入 `fg` 即可恢复会话，完全回到离开时的状态。Windows 不支持此功能。

## 工具进度显示

CLI 会在代理工作时显示动画反馈：

**思考动画**（API 调用期间）：
```
  ◜ (｡•́︿•̀｡) 正在思考... (1.2s)
  ◠ (⊙_⊙) 正在沉思... (2.4s)
  ✧٩(ˊᗜˋ*)و✧ 明白了！ (3.1s)
```

**工具执行日志：**
```
  ┊ 💻 terminal `ls -la` (0.3s)
  ┊ 🔍 web_search (1.2s)
  ┊ 📄 web_extract (2.1s)
```

通过 `/verbose` 可在不同显示模式间循环：`off → new → all → verbose`。此命令也可在消息平台启用 — 详见 [配置](/docs/user-guide/configuration#display-settings)。

### 工具预览长度

`display.tool_preview_length` 配置项控制工具调用预览行的最大字符数（如文件路径、终端命令）。默认值为 `0`，表示无限制 — 显示完整路径和命令。

```yaml
# ~/.hermes/config.yaml
display:
  tool_preview_length: 80   # 将工具预览截断至 80 字符（0 = 无限制）
```

这在窄终端或工具参数包含超长文件路径时很有用。

## 会话管理

### 恢复会话

退出 CLI 会话时，会打印恢复命令：

```
恢复此会话：
  hermes --resume 20260225_143052_a1b2c3

会话：        20260225_143052_a1b2c3
持续时间：       12m 34s
消息数：       28（5 条用户，18 次工具调用）
```

恢复选项：

```bash
hermes --continue                          # 恢复最近一次 CLI 会话
hermes -c                                  # 简写
hermes -c "my project"                     # 恢复命名会话（ lineage 中最新的）
hermes --resume 20260225_143052_a1b2c3     # 按 ID 恢复特定会话
hermes --resume "refactoring auth"         # 按标题恢复
hermes -r 20260225_143052_a1b2c3           # 简写
```

恢复时会从 SQLite 中还原完整的对话历史。代理会看到所有之前的消息、工具调用和响应 — 就像您从未离开一样。

在聊天中使用 `/title 我的会话名称` 可为当前会话命名，或通过命令行 `hermes sessions rename <id> <title>`。使用 `hermes sessions list` 浏览过往会话。

### 会话存储

CLI 会话存储在 Hermes 的 SQLite 状态数据库中，路径为 `~/.hermes/state.db`。数据库保存：

- 会话元数据（ID、标题、时间戳、令牌计数器）  
- 消息历史  
- 压缩/恢复会话间的 lineage  
- `session_search` 使用的全文搜索索引  

某些消息适配器还会额外保存平台相关的转录文件，但 CLI 本身是从 SQLite 会话存储恢复。

### 上下文压缩

当接近上下文限制时，长对话会自动总结：

```yaml
# 在 ~/.hermes/config.yaml 中
compression:
  enabled: true
  threshold: 0.50    # 默认在 50% 上下文限制时压缩

# 总结模型配置在 auxiliary 下：
auxiliary:
  compression:
    model: "google/gemini-3-flash-preview"  # 用于总结的模型
```

触发压缩时，中间轮次会被总结，但始终保留前 3 轮和后 4 轮。

## 后台会话

在独立的后台会话中运行提示，同时继续在 CLI 中进行其他工作：

```
/background 分析 /var/log 中的日志，总结今天出现的任何错误
```

Hermes 会立即确认任务并返回提示：

```
🔄 后台任务 #1 已开始："分析 /var/log 中的日志，总结..."  
   任务 ID：bg_143022_a1b2c3
```

### 工作原理

每个 `/background` 提示会启动一个**完全独立的代理会话**，运行在守护线程中：

- **隔离的对话** — 后台代理不了解当前会话的历史。它只收到您提供的提示。  
- **相同的配置** — 后台代理继承当前会话的模型、提供商、工具集、推理设置和备用模型。  
- **非阻塞** — 您的前台会话保持完全交互性。您可以继续聊天、运行命令，甚至启动更多后台任务。  
- **多任务** — 可同时运行多个后台任务。每个任务都有编号 ID。  

### 结果

后台任务完成时，结果会以面板形式出现在终端中：

```
╭─ ⚕ Hermes (后台 #1) ──────────────────────────────────╮
│ 发现今天 syslog 中有 3 个错误：                         │
│ 1. 03:22 发生 OOM killer — 终止进程 nginx              │
│ 2. 07:15 出现磁盘 I/O 错误 /dev/sda1                   │
│ 3. 14:30 来自 192.168.1.50 的 SSH 登录失败尝试         │
╰──────────────────────────────────────────────────────────────╯
```

如果任务失败，则会显示错误通知。如果配置中启用了 `display.bell_on_complete`，任务完成时会响铃。

### 使用场景

- **长时间研究** — "/background 研究量子纠错的最新进展" 的同时继续编码  
- **文件处理** — "/background 分析此仓库中的所有 Python 文件并列出任何安全问题" 的同时继续对话  
- **并行调查** — 启动多个后台任务以探索不同角度  

:::info
后台会话不会出现在主对话历史中。它们是独立的会话，有自己的任务 ID（例如 `bg_143022_a1b2c3`）。
:::

## 安静模式

默认情况下，CLI 运行在安静模式，特点如下：
- 抑制工具的详细日志  
- 启用可爱风格的动画反馈  
- 保持输出简洁友好  

如需调试输出：
```bash
hermes chat --verbose
```