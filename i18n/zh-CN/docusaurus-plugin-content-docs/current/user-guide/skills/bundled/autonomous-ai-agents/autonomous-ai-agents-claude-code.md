---
title: "Claude Code — 将编码任务委托给 Claude Code（Anthropic 的命令行智能体）"
sidebar_label: "Claude Code"
description: "将编码任务委托给 Claude Code（Anthropic 的命令行智能体）"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Claude Code

将编码任务委托给 Claude Code（Anthropic 的命令行智能体）。可用于构建功能、重构、PR 审查以及迭代编码。需要安装 claude CLI。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/autonomous-ai-agents/claude-code` |
| 版本 | `2.2.0` |
| 作者 | Hermes Agent + Teknium |
| 许可证 | MIT |
| 标签 | `Coding-Agent`, `Claude`, `Anthropic`, `Code-Review`, `Refactoring`, `PTY`, `Automation` |
| 相关技能 | [`codex`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-codex), [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent), [`opencode`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-opencode) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Claude Code — Hermes 编排指南

通过 Hermes 终端将编码任务委派给 [Claude Code](https://code.claude.com/docs/en/cli-reference)（Anthropic 的自主编码智能体 CLI）。Claude Code v2.x 可以读取文件、编写代码、运行 shell 命令、生成子智能体，并自主管理 git 工作流。

## 先决条件

- **安装：** `npm install -g @anthropic-ai/claude-code`
- **认证：** 运行 `claude` 一次以登录（Pro/Max 使用浏览器 OAuth，或设置 `ANTHROPIC_API_KEY`）
- **控制台认证：** `claude auth login --console`（用于 API 密钥计费）
- **SSO 认证：** `claude auth login --sso`（用于企业版）
- **检查状态：** `claude auth status`（JSON 格式）或 `claude auth status --text`（人类可读格式）
- **健康检查：** `claude doctor` — 检查自动更新程序和安装状态
- **版本检查：** `claude --version`（需要 v2.x+）
- **更新：** `claude update` 或 `claude upgrade`

## 两种编排模式

Hermes 与 Claude Code 的交互方式有两种根本不同的模式。请根据任务选择。

### 模式 1：打印模式 (`-p`) — 非交互式（大多数任务推荐使用此模式）

打印模式执行一次性任务，返回结果后退出。无需 PTY。无交互式提示。这是最简洁的集成方式。

```
terminal(command="claude -p '为 src/ 中所有 API 调用添加错误处理' --allowedTools 'Read,Edit' --max-turns 10", workdir="/path/to/project", timeout=120)
```

**何时使用打印模式：**
- 一次性编码任务（修复 bug、添加功能、重构）
- CI/CD 自动化和脚本编写
- 使用 `--json-schema` 进行结构化数据提取
- 管道输入处理（`cat file | claude -p "analyze this"`）
- 任何不需要多轮对话的任务

**打印模式会跳过所有交互式对话框** — 无工作区信任提示，无权限确认。这使其非常适合自动化。

### 模式 2：通过 tmux 的交互式 PTY — 多轮会话

交互式模式提供完整的对话式 REPL，您可以发送后续提示、使用斜杠命令，并实时观察 Claude 的工作过程。**需要 tmux 编排。**

```
# 启动 tmux 会话
terminal(command="tmux new-session -d -s claude-work -x 140 -y 40")

# 在其中启动 Claude Code
terminal(command="tmux send-keys -t claude-work 'cd /path/to/project && claude' Enter")

# 等待启动后发送您的任务
#（欢迎屏幕出现后约 3-5 秒）
terminal(command="sleep 5 && tmux send-keys -t claude-work '重构 auth 模块以使用 JWT 令牌' Enter")

# 通过捕获窗格监控进度
terminal(command="sleep 15 && tmux capture-pane -t claude-work -p -S -50")

# 发送后续任务
terminal(command="tmux send-keys -t claude-work '现在为新 JWT 代码添加单元测试' Enter")

# 完成后退出
terminal(command="tmux send-keys -t claude-work '/exit' Enter")
```

**何时使用交互式模式：**
- 多轮迭代工作（重构 → 审查 → 修复 → 测试循环）
- 需要人工参与决策的任务
- 探索性编码会话
- 需要使用 Claude 的斜杠命令时（`/compact`、`/review`、`/model`）

## PTY 对话框处理（交互式模式的关键）

Claude Code 在首次启动时最多会显示两个确认对话框。您必须通过 tmux send-keys 处理这些对话框：

### 对话框 1：工作区信任（首次访问目录时）
```
❯ 1. 是的，我信任此文件夹    ← 默认选项（只需按 Enter）
  2. 不，退出
```
**处理方式：** `tmux send-keys -t <session> Enter` — 默认选项是正确的。

### 对话框 2：绕过权限警告（仅在使用 --dangerously-skip-permissions 时出现）
```
❯ 1. 不，退出                    ← 默认选项（错误选择！）
  2. 是的，我接受
```
**处理方式：** 必须先按 DOWN 键，再按 Enter：
```
tmux send-keys -t <session> Down && sleep 0.3 && tmux send-keys -t <session> Enter
```

### 健壮的对话框处理模式
```
# 使用权限绕过启动
terminal(command="tmux send-keys -t claude-work 'claude --dangerously-skip-permissions \"your task\"' Enter")

# 处理信任对话框（按 Enter 选择默认的“是”）
terminal(command="sleep 4 && tmux send-keys -t claude-work Enter")

# 处理权限对话框（先按 Down 再按 Enter 选择“是的，我接受”）
terminal(command="sleep 3 && tmux send-keys -t claude-work Down && sleep 0.3 && tmux send-keys -t claude-work Enter")

# 现在等待 Claude 工作
terminal(command="sleep 15 && tmux capture-pane -t claude-work -p -S -60")
```

**注意：** 首次接受目录的信任后，信任对话框将不再出现。只有权限对话框会在每次使用 `--dangerously-skip-permissions` 时重复出现。

## CLI 子命令

| 子命令 | 用途 |
|------------|---------|
| `claude` | 启动交互式 REPL |
| `claude "query"` | 使用初始提示启动 REPL |
| `claude -p "query"` | 打印模式（非交互式，完成后退出） |
| `cat file \| claude -p "query"` | 将内容作为 stdin 上下文管道输入 |
| `claude -c` | 继续此目录中最新的对话 |
| `claude -r "id"` | 通过 ID 或名称恢复特定会话 |
| `claude auth login` | 登录（添加 `--console` 用于 API 计费，`--sso` 用于企业版） |
| `claude auth status` | 检查登录状态（返回 JSON；`--text` 用于人类可读格式） |
| `claude mcp add <name> -- <cmd>` | 添加 MCP 服务器 |
| `claude mcp list` | 列出已配置的 MCP 服务器 |
| `claude mcp remove <name>` | 移除 MCP 服务器 |
| `claude agents` | 列出已配置的智能体 |
| `claude doctor` | 对安装和自动更新程序运行健康检查 |
| `claude update` / `claude upgrade` | 将 Claude Code 更新至最新版本 |
| `claude remote-control` | 启动服务器以从 claude.ai 或移动应用控制 Claude |
| `claude install [target]` | 安装原生构建（稳定版、最新版或特定版本） |
| `claude setup-token` | 设置长期有效的认证令牌（需要订阅） |
| `claude plugin` / `claude plugins` | 管理 Claude Code 插件 |
| `claude auto-mode` | 检查自动模式分类器配置 |

## 打印模式深入解析

### 结构化 JSON 输出
```
terminal(command="claude -p '分析 auth.py 中的安全问题' --output-format json --max-turns 5", workdir="/project", timeout=120)
```

返回一个 JSON 对象，包含：
```json
{
  "type": "result",
  "subtype": "success",
  "result": "分析文本...",
  "session_id": "75e2167f-...",
  "num_turns": 3,
  "total_cost_usd": 0.0787,
  "duration_ms": 10276,
  "stop_reason": "end_turn",
  "terminal_reason": "completed",
  "usage": { "input_tokens": 5, "output_tokens": 603, ... },
  "modelUsage": { "claude-sonnet-4-6": { "costUSD": 0.078, "contextWindow": 200000 } }
}
```

**关键字段：** `session_id` 用于恢复会话，`num_turns` 表示智能体循环次数，`total_cost_usd` 用于支出跟踪，`subtype` 用于检测成功/错误（`success`、`error_max_turns`、`error_budget`）。

### 流式 JSON 输出
要实现实时令牌流式传输，请使用 `stream-json` 并添加 `--verbose`：
```
terminal(command="claude -p '写一个摘要' --output-format stream-json --verbose --include-partial-messages", timeout=60)
```

返回换行符分隔的 JSON 事件。使用 jq 过滤实时文本：
```
claude -p "Explain X" --output-format stream-json --verbose --include-partial-messages | \
  jq -rj 'select(.type == "stream_event" and .event.delta.type? == "text_delta") | .event.delta.text'
```

流式事件包括 `system/api_retry`，其中包含 `attempt`、`max_retries` 和 `error` 字段（例如 `rate_limit`、`billing_error`）。

### 双向流式传输
要实现实时输入和输出流式传输：
```
claude -p "task" --input-format stream-json --output-format stream-json --replay-user-messages
```
`--replay-user-messages` 会在 stdout 上重新发送用户消息以进行确认。

### 管道输入
```
# 管道文件进行分析
terminal(command="cat src/auth.py | claude -p '审查此代码中的 bug' --max-turns 1", timeout=60)

# 管道多个文件
terminal(command="cat src/*.py | claude -p '查找所有 TODO 注释' --max-turns 1", timeout=60)

# 管道命令输出
terminal(command="git diff HEAD~3 | claude -p '总结这些更改' --max-turns 1", timeout=60)
```

### 用于结构化提取的 JSON Schema
```
terminal(command="claude -p '列出 src/ 中所有函数' --output-format json --json-schema '{\"type\":\"object\",\"properties\":{\"functions\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}}},\"required\":[\"functions\"]}' --max-turns 5", workdir="/project", timeout=90)
```

从 JSON 结果中解析 `structured_output`。Claude 在返回前会根据 schema 验证输出。

### 会话延续
```
# 开始一个任务
terminal(command="claude -p '开始重构数据库层' --output-format json --max-turns 10 > /tmp/session.json", workdir="/project", timeout=180)

# 使用会话 ID 恢复
terminal(command="claude -p '继续并添加连接池' --resume $(cat /tmp/session.json | python3 -c 'import json,sys; print(json.load(sys.stdin)[\"session_id\"])') --max-turns 5", workdir="/project", timeout=120)

# 或恢复同一目录中最新的会话
terminal(command="claude -p '你上次做了什么？' --continue --max-turns 1", workdir="/project", timeout=30)

# 分叉会话（新 ID，保留历史记录）
terminal(command="claude -p '尝试不同的方法' --resume <id> --fork-session --max-turns 10", workdir="/project", timeout=120)
```

### 裸模式用于 CI/脚本编写
```
terminal(command="claude --bare -p '运行所有测试并报告失败项' --allowedTools 'Read,Bash' --max-turns 10", workdir="/project", timeout=180)
```

`--bare` 跳过钩子、插件、MCP 发现和 CLAUDE.md 加载。启动最快。需要 `ANTHROPIC_API_KEY`（跳过 OAuth）。

要在裸模式下选择性地加载上下文：
| 要加载的内容 | 标志 |
|---------|------|
| 系统提示附加内容 | `--append-system-prompt "text"` 或 `--append-system-prompt-file path` |
| 设置 | `--settings <file-or-json>` |
| MCP 服务器 | `--mcp-config <file-or-json>` |
| 自定义智能体 | `--agents '<json>'` |

### 过载时的备用模型
```
terminal(command="claude -p 'task' --fallback-model haiku --max-turns 5", timeout=90)
```
当默认模型过载时，自动回退到指定模型（仅打印模式）。

## 完整 CLI 标志参考

### 会话与环境
| 标志 | 效果 |
|------|--------|
| `-p, --print` | 非交互式一次性模式（完成后退出） |
| `-c, --continue` | 恢复当前目录最近一次对话 |
| `-r, --resume <id>` | 通过 ID 或名称恢复特定会话（若无 ID 则显示交互式选择器） |
| `--fork-session` | 恢复时创建新会话 ID 而非复用原始 ID |
| `--session-id <uuid>` | 为对话使用特定 UUID |
| `--no-session-persistence` | 不将会话保存到磁盘（仅限打印模式） |
| `--add-dir <paths...>` | 授予 Claude 访问额外工作目录的权限 |
| `-w, --worktree [name]` | 在隔离的 git 工作树 `.claude/worktrees/<name>` 中运行 |
| `--tmux` | 为工作树创建 tmux 会话（需配合 `--worktree` 使用） |
| `--ide` | 启动时自动连接到有效 IDE |
| `--chrome` / `--no-chrome` | 启用/禁用 Chrome 浏览器集成以进行 Web 测试 |
| `--from-pr [number]` | 恢复与特定 GitHub PR 关联的会话 |
| `--file <specs...>` | 启动时需下载的文件资源（格式：`file_id:relative_path`） |

### 模型与性能
| 标志 | 效果 |
|------|--------|
| `--model <alias>` | 模型选择：`sonnet`、`opus`、`haiku` 或完整名称如 `claude-sonnet-4-6` |
| `--effort <level>` | 推理深度：`low`、`medium`、`high`、`max`、`auto` | 两者均可 |
| `--max-turns <n>` | 限制智能体循环次数（仅限打印模式；防止失控） |
| `--max-budget-usd <n>` | 限制 API 支出金额（美元，仅限打印模式） |
| `--fallback-model <model>` | 默认模型过载时自动回退（仅限打印模式） |
| `--betas <betas...>` | 在 API 请求中包含的测试版标头（仅限 API 密钥用户） |

### 权限与安全
| 标志 | 效果 |
|------|--------|
| `--dangerously-skip-permissions` | 自动批准所有工具使用（文件写入、bash、网络等） |
| `--allow-dangerously-skip-permissions` | 将绕过权限作为*选项*启用，但默认不启用 |
| `--permission-mode <mode>` | `default`、`acceptEdits`、`plan`、`auto`、`dontAsk`、`bypassPermissions` |
| `--allowedTools <tools...>` | 白名单特定工具（逗号或空格分隔） |
| `--disallowedTools <tools...>` | 黑名单特定工具 |
| `--tools <tools...>` | 覆盖内置工具集（`""` = 无，`"default"` = 全部，或工具名称） |

### 输出与输入格式
| 标志 | 效果 |
|------|--------|
| `--output-format <fmt>` | `text`（默认）、`json`（单个结果对象）、`stream-json`（换行分隔） |
| `--input-format <fmt>` | `text`（默认）或 `stream-json`（实时流式输入） |
| `--json-schema <schema>` | 强制结构化 JSON 输出匹配指定 schema |
| `--verbose` | 完整逐轮输出 |
| `--include-partial-messages` | 包含到达时的部分消息块（stream-json + print） |
| `--replay-user-messages` | 在 stdout 上重新发送用户消息（stream-json 双向） |

### 系统提示与上下文
| 标志 | 效果 |
|------|--------|
| `--append-system-prompt <text>` | **追加**到默认系统提示（保留内置能力） |
| `--append-system-prompt-file <path>` | **追加**文件内容到默认系统提示 |
| `--system-prompt <text>` | **替换**整个系统提示（通常应使用 --append 替代） |
| `--system-prompt-file <path>` | **替换**系统提示为文件内容 |
| `--bare` | 跳过钩子、插件、MCP 发现、CLAUDE.md、OAuth（最快启动） |
| `--agents '<json>'` | 以 JSON 动态定义自定义子智能体 |
| `--mcp-config <path>` | 从 JSON 文件加载 MCP 服务器（可重复） |
| `--strict-mcp-config` | 仅使用 `--mcp-config` 中的 MCP 服务器，忽略所有其他 MCP 配置 |
| `--settings <file-or-json>` | 从 JSON 文件或内联 JSON 加载额外设置 |
| `--setting-sources <sources>` | 逗号分隔的加载源：`user`、`project`、`local` |
| `--plugin-dir <paths...>` | 仅为此会话从目录加载插件 |
| `--disable-slash-commands` | 禁用所有技能/斜杠命令 |

### 调试
| 标志 | 效果 |
|------|--------|
| `-d, --debug [filter]` | 启用调试日志记录，可选类别过滤器（例如 `"api,hooks"`、`"!1p,!file"`） |
| `--debug-file <path>` | 将调试日志写入文件（隐式启用调试模式） |

### 智能体团队
| 标志 | 效果 |
|------|--------|
| `--teammate-mode <mode>` | 智能体团队显示方式：`auto`、`in-process` 或 `tmux` |
| `--brief` | 启用 `SendUserMessage` 工具以实现智能体到用户的通信 |

### --allowedTools / --disallowedTools 工具名称语法
```
Read                    # 所有文件读取
Edit                    # 文件编辑（现有文件）
Write                   # 文件创建（新文件）
Bash                    # 所有 shell 命令
Bash(git *)             # 仅 git 命令
Bash(git commit *)      # 仅 git commit 命令
Bash(npm run lint:*)    # 通配符模式匹配
WebSearch               # Web 搜索能力
WebFetch                # 网页抓取
mcp__<server>__<tool>   # 特定 MCP 工具
```

## 设置与配置

### 设置层级（从高到低优先级）
1. **命令行参数** — 覆盖所有其他设置
2. **本地项目：** `.claude/settings.local.json`（个人使用，已加入 git 忽略）
3. **项目：** `.claude/settings.json`（共享，受 git 跟踪）
4. **用户：** `~/.claude/settings.json`（全局）

### 设置中的权限
```json
{
  "permissions": {
    "allow": ["Bash(npm run lint:*)", "WebSearch", "Read"],
    "ask": ["Write(*.ts)", "Bash(git push*)"],
    "deny": ["Read(.env)", "Bash(rm -rf *)"]
  }
}
```

### 记忆文件（CLAUDE.md）层级
1. **全局：** `~/.claude/CLAUDE.md` — 适用于所有项目
2. **项目：** `./CLAUDE.md` — 项目特定上下文（受 git 跟踪）
3. **本地：** `.claude/CLAUDE.local.md` — 个人项目覆盖（已加入 git 忽略）

在交互模式下使用 `#` 前缀可快速添加到记忆：`# 始终使用 2 个空格缩进`。

## 交互会话：斜杠命令

### 会话与上下文
| 命令 | 用途 |
|---------|---------|
| `/help` | 显示所有命令（包括自定义命令和 MCP 命令） |
| `/compact [focus]` | 压缩上下文以节省令牌；CLAUDE.md 在压缩后保留。例如：`/compact 专注于认证逻辑` |
| `/clear` | 清除对话历史以重新开始 |
| `/context` | 以彩色网格可视化上下文使用情况，并提供优化建议 |
| `/cost` | 查看令牌使用情况，按模型和缓存命中细分 |
| `/resume` | 切换到或恢复其他会话 |
| `/rewind` | 回退到对话或代码的先前检查点 |
| `/btw <question>` | 提出一个旁支问题，不增加上下文成本 |
| `/status` | 显示版本、连接状态和会话信息 |
| `/todos` | 列出对话中跟踪的待办事项 |
| `/exit` 或 `Ctrl+D` | 结束会话 |

### 开发与审查
| 命令 | 用途 |
|---------|---------|
| `/review` | 请求对当前更改进行代码审查 |
| `/security-review` | 对当前更改执行安全分析 |
| `/plan [description]` | 进入计划模式，自动开始任务规划 |
| `/loop [interval]` | 在会话中安排重复任务 |
| `/batch` | 为大型并行更改自动创建工作树（5-30 个工作树） |

### 配置与工具
| 命令 | 用途 |
|---------|---------|
| `/model [model]` | 在会话中途切换模型（使用方向键调整推理强度） |
| `/effort [level]` | 设置推理强度：`low`、`medium`、`high`、`max` 或 `auto` |
| `/init` | 为项目记忆创建 CLAUDE.md 文件 |
| `/memory` | 打开 CLAUDE.md 进行编辑 |
| `/config` | 打开交互式设置配置 |
| `/permissions` | 查看/更新工具权限 |
| `/agents` | 管理专门的子智能体 |
| `/mcp` | 管理 MCP 服务器的交互式 UI |
| `/add-dir` | 添加额外的工作目录（对 monorepo 很有用） |
| `/usage` | 显示计划限制和速率限制状态 |
| `/voice` | 启用按键通话语音模式（20 种语言；按住空格键录制，松开发送） |
| `/release-notes` | 版本发布说明的交互式选择器 |

### 自定义斜杠命令
创建 `.claude/commands/<name>.md`（项目共享）或 `~/.claude/commands/<name>.md`（个人）：

```markdown
# .claude/commands/deploy.md
运行部署流水线：
1. 运行所有测试
2. 构建 Docker 镜像
3. 推送到注册表
4. 更新 $ARGUMENTS 环境变量（默认：staging）
```

用法：`/deploy production` — `$ARGUMENTS` 将被用户输入替换。

### 技能（自然语言调用）
与斜杠命令（手动调用）不同，`.claude/skills/` 中的技能是 Markdown 指南，当任务匹配时，Claude 会通过自然语言自动调用它们：

```markdown
# .claude/skills/database-migration.md
当被要求创建或修改数据库迁移时：
1. 使用 Alembic 生成迁移
2. 始终创建回滚函数
3. 针对本地数据库副本测试迁移
```

## 交互会话：键盘快捷键

### 通用控制
| 键 | 操作 |
|-----|--------|
| `Ctrl+C` | 取消当前输入或生成 |
| `Ctrl+D` | 退出会话 |
| `Ctrl+R` | 反向搜索命令历史 |
| `Ctrl+B` | 将正在运行的任务移至后台 |
| `Ctrl+V` | 将图像粘贴到对话中 |
| `Ctrl+O` | 转录模式 — 查看 Claude 的思维过程 |
| `Ctrl+G` 或 `Ctrl+X Ctrl+E` | 在外部编辑器中打开提示 |
| `Esc Esc` | 回退对话或代码状态 / 总结 |

### 模式切换
| 键 | 操作 |
|-----|--------|
| `Shift+Tab` | 循环切换权限模式（正常 → 自动接受 → 计划） |
| `Alt+P` | 切换模型 |
| `Alt+T` | 切换思维模式 |
| `Alt+O` | 切换快速模式 |

### 多行输入
| 键 | 操作 |
|-----|--------|
| `\` + `Enter` | 快速换行 |
| `Shift+Enter` | 换行（替代方式） |
| `Ctrl+J` | 换行（替代方式） |

### 输入前缀
| 前缀 | 操作 |
|--------|--------|
| `!` | 直接执行 bash，绕过 AI（例如：`!npm test`）。单独使用 `!` 可切换 shell 模式。 |
| `@` | 引用文件/目录，支持自动补全（例如：`@./src/api/`） |
| `#` | 快速添加到 CLAUDE.md 记忆（例如：`# 使用 2 个空格缩进`） |
| `/` | 斜杠命令 |

### 专业提示：“ultrathink”
在提示中使用关键字 “ultrathink” 可在特定轮次获得最大推理强度。无论当前 `/effort` 设置如何，这都会触发最深层的思维模式。

## PR 审查模式

### 快速审查（打印模式）
```
terminal(command="cd /path/to/repo && git diff main...feature-branch | claude -p 'Review this diff for bugs, security issues, and style problems. Be thorough.' --max-turns 1", timeout=60)
```

### 深度审查（交互式 + 工作树）
```
terminal(command="tmux new-session -d -s review -x 140 -y 40")
terminal(command="tmux send-keys -t review 'cd /path/to/repo && claude -w pr-review' Enter")
terminal(command="sleep 5 && tmux send-keys -t review Enter")  # 信任对话框
terminal(command="sleep 2 && tmux send-keys -t review 'Review all changes vs main. Check for bugs, security issues, race conditions, and missing tests.' Enter")
terminal(command="sleep 30 && tmux capture-pane -t review -p -S -60")
```

### 根据编号审查 PR
```
terminal(command="claude -p 'Review this PR thoroughly' --from-pr 42 --max-turns 10", workdir="/path/to/repo", timeout=120)
```

### 使用 tmux 的 Claude 工作树
```
terminal(command="claude -w feature-x --tmux", workdir="/path/to/repo")
```
在 `.claude/worktrees/feature-x` 创建一个隔离的 git 工作树，并为其创建一个 tmux 会话。在可用时使用 iTerm2 原生窗格；添加 `--tmux=classic` 以使用传统 tmux。

## 并行 Claude 实例

同时运行多个独立的 Claude 任务：

```
# 任务 1：修复后端
terminal(command="tmux new-session -d -s task1 -x 140 -y 40 && tmux send-keys -t task1 'cd ~/project && claude -p \"Fix the auth bug in src/auth.py\" --allowedTools \"Read,Edit\" --max-turns 10' Enter")

# 任务 2：编写测试
terminal(command="tmux new-session -d -s task2 -x 140 -y 40 && tmux send-keys -t task2 'cd ~/project && claude -p \"Write integration tests for the API endpoints\" --allowedTools \"Read,Write,Bash\" --max-turns 15' Enter")

# 任务 3：更新文档
terminal(command="tmux new-session -d -s task3 -x 140 -y 40 && tmux send-keys -t task3 'cd ~/project && claude -p \"Update README.md with the new API endpoints\" --allowedTools \"Read,Edit\" --max-turns 5' Enter")

# 监控所有任务
terminal(command="sleep 30 && for s in task1 task2 task3; do echo '=== '$s' ==='; tmux capture-pane -t $s -p -S -5 2>/dev/null; done")
```

## CLAUDE.md — 项目上下文文件

Claude Code 会自动从项目根目录加载 `CLAUDE.md`。使用它来持久化项目上下文：

```markdown
# 项目：我的 API

## 架构
- 使用 SQLAlchemy ORM 的 FastAPI 后端
- PostgreSQL 数据库，Redis 缓存
- 使用 pytest 进行测试，目标覆盖率为 90%

## 关键命令
- `make test` — 运行完整测试套件
- `make lint` — ruff + mypy
- `make dev` — 在 :8000 端口启动开发服务器

## 代码规范
- 所有公共函数均需添加类型提示
- 使用 Google 风格的文档字符串
- YAML 文件使用 2 空格缩进，Python 文件使用 4 空格缩进
- 禁止使用通配符导入
```

**请具体说明。** 不要使用“编写优质代码”这类笼统表述，而应使用“JS 文件使用 2 空格缩进”或“测试文件使用 `.test.ts` 后缀”等具体指令。具体说明可减少返工次数。

### 规则目录（模块化 CLAUDE.md）
对于包含大量规则的项目，请使用规则目录而非单个庞大的 CLAUDE.md：
- **项目规则：** `.claude/rules/*.md` — 团队共享，受 Git 跟踪
- **用户规则：** `~/.claude/rules/*.md` — 个人使用，全局生效

规则目录中的每个 `.md` 文件都会作为额外上下文加载。这比将所有内容塞进单个 CLAUDE.md 更清晰。

### 自动记忆
Claude 会自动将学习到的项目上下文存储在 `~/.claude/projects/<project>/memory/` 中。
- **限制：** 每个项目最多 25KB 或 200 行
- 这与 CLAUDE.md 分开 — 这是 Claude 自己对项目的笔记，跨会话累积

## 自定义子智能体

在 `.claude/agents/`（项目级）、`~/.claude/agents/`（个人级）或通过 `--agents` CLI 标志（会话级）中定义专用智能体：

### 智能体位置优先级
1. `.claude/agents/` — 项目级，团队共享
2. `--agents` CLI 标志 — 会话特定，动态
3. `~/.claude/agents/` — 用户级，个人使用

### 创建智能体
```markdown
# .claude/agents/security-reviewer.md
---
name: security-reviewer
description: 专注于安全性的代码审查
model: opus
tools: [Read, Bash]
---
你是一名资深安全工程师。请审查代码中的以下内容：
- 注入漏洞（SQL、XSS、命令注入）
- 认证/授权缺陷
- 代码中的敏感信息
- 不安全的反序列化
```

调用方式：`@security-reviewer 审查 auth 模块`

### 通过 CLI 创建动态智能体
```
terminal(command="claude --agents '{\"reviewer\": {\"description\": \"审查代码\", \"prompt\": \"你是一名专注于性能的代码审查员\"}}' -p '使用 @reviewer 检查 auth.py'", timeout=120)
```

Claude 可以协调多个智能体：“使用 @db-expert 优化查询，然后使用 @security 审计更改。”

## 钩子 — 事件触发自动化

在 `.claude/settings.json`（项目级）或 `~/.claude/settings.json`（全局）中配置：

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write(*.py)",
      "hooks": [{"type": "command", "command": "ruff check --fix $CLAUDE_FILE_PATHS"}]
    }],
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{"type": "command", "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -q 'rm -rf'; then echo '已阻止！' && exit 2; fi"}]
    }],
    "Stop": [{
      "hooks": [{"type": "command", "command": "echo 'Claude 完成了一次响应' >> /tmp/claude-activity.log"}]
    }]
  }
}
```

### 全部 8 种钩子类型
| 钩子 | 触发时机 | 常见用途 |
|------|----------|----------|
| `UserPromptSubmit` | Claude 处理用户提示之前 | 输入验证、日志记录 |
| `PreToolUse` | 工具执行之前 | 安全门控、阻止危险命令（exit 2 = 阻止） |
| `PostToolUse` | 工具完成之后 | 自动格式化代码、运行代码检查器 |
| `Notification` | 权限请求或输入等待时 | 桌面通知、警报 |
| `Stop` | Claude 完成响应时 | 完成日志记录、状态更新 |
| `SubagentStop` | 子智能体完成时 | 智能体协调 |
| `PreCompact` | 上下文内存清除之前 | 备份会话记录 |
| `SessionStart` | 会话开始时 | 加载开发上下文（例如 `git status`） |

### 钩子环境变量
| 变量 | 内容 |
|------|------|
| `CLAUDE_PROJECT_DIR` | 当前项目路径 |
| `CLAUDE_FILE_PATHS` | 正在修改的文件 |
| `CLAUDE_TOOL_INPUT` | 工具参数（JSON 格式） |

### 安全钩子示例
```json
{
  "PreToolUse": [{
    "matcher": "Bash",
    "hooks": [{"type": "command", "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -qE 'rm -rf|git push.*--force|:(){ :|:& };:'; then echo '危险命令已阻止！' && exit 2; fi"}]
  }]
}
```

## MCP 集成

为数据库、API 和服务添加外部工具服务器：

```
# GitHub 集成
terminal(command="claude mcp add -s user github -- npx @modelcontextprotocol/server-github", timeout=30)

# PostgreSQL 查询
terminal(command="claude mcp add -s local postgres -- npx @anthropic-ai/server-postgres --connection-string postgresql://localhost/mydb", timeout=30)

# Puppeteer 用于 Web 测试
terminal(command="claude mcp add puppeteer -- npx @anthropic-ai/server-puppeteer", timeout=30)
```

### MCP 作用域
| 标志 | 作用域 | 存储位置 |
|------|--------|----------|
| `-s user` | 全局（所有项目） | `~/.claude.json` |
| `-s local` | 当前项目（个人） | `.claude/settings.local.json`（被 Git 忽略） |
| `-s project` | 当前项目（团队共享） | `.claude/settings.json`（受 Git 跟踪） |

### MCP 在 Print/CI 模式下的使用
```
terminal(command="claude --bare -p '查询数据库' --mcp-config mcp-servers.json --strict-mcp-config", timeout=60)
```
`--strict-mcp-config` 会忽略除 `--mcp-config` 指定的所有 MCP 服务器。

在聊天中引用 MCP 资源：`@github:issue://123`

### MCP 限制与调优
- **工具描述：** 每个服务器的工具描述和服务器指令上限为 2KB
- **结果大小：** 默认有上限；使用 `maxResultSizeChars` 注解允许大型输出最多 **500K** 字符
- **输出令牌：** `export MAX_MCP_OUTPUT_TOKENS=50000` — 限制 MCP 服务器的输出，防止上下文泛滥
- **传输方式：** `stdio`（本地进程）、`http`（远程）、`sse`（服务器发送事件）

## 监控交互式会话

### 读取 TUI 状态
```
# 定期捕获以检查 Claude 是否仍在工作或等待输入
terminal(command="tmux capture-pane -t dev -p -S -10")
```

查找以下指示符：
- 底部有 `❯` = 等待你的输入（Claude 已完成或正在提问）
- `●` 行 = Claude 正在积极使用工具（读取、写入、运行命令）
- `⏵⏵ bypass permissions on` = 状态栏显示权限模式
- `◐ medium · /effort` = 状态栏中的当前努力级别
- `ctrl+o to expand` = 工具输出被截断（可交互展开）

### 上下文窗口健康状况
在交互模式中使用 `/context` 查看上下文使用情况的彩色网格。关键阈值：
- **&lt; 70%** — 正常运行，全精度
- **70-85%** — 精度开始下降，考虑使用 `/compact`
- **> 85%** — 幻觉风险显著增加，使用 `/compact` 或 `/clear`

## 环境变量

| 变量 | 效果 |
|------|------|
| `ANTHROPIC_API_KEY` | 用于身份验证的 API 密钥（OAuth 的替代方案） |
| `CLAUDE_CODE_EFFORT_LEVEL` | 默认努力级别：`low`、`medium`、`high`、`max` 或 `auto` |
| `MAX_THINKING_TOKENS` | 限制思考令牌（设为 `0` 可完全禁用思考） |
| `MAX_MCP_OUTPUT_TOKENS` | 限制 MCP 服务器的输出（默认值因情况而异；例如设为 `50000`） |
| `CLAUDE_CODE_NO_FLICKER=1` | 启用替代屏幕渲染以消除终端闪烁 |
| `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` | 为安全起见，从子进程中剥离凭据 |

## 成本与性能提示

1. 在 Print 模式中使用 `--max-turns` 防止失控循环。大多数任务从 5-10 开始。
2. 使用 `--max-budget-usd` 设置成本上限。注意：系统提示缓存创建的最小值约为 $0.05。
3. 简单任务使用 `--effort low`（更快、更便宜）。复杂推理使用 `high` 或 `max`。
4. 在 CI/脚本中使用 `--bare` 跳过插件/钩子发现开销。
5. 使用 `--allowedTools` 限制为仅需要的工具（例如，仅 `Read` 用于审查）。
6. 当上下文变大时，在交互会话中使用 `/compact`。
7. 当你只需要分析已知内容时，使用管道输入而非让 Claude 读取文件。
8. 简单任务使用 `--model haiku`（更便宜），复杂多步骤工作使用 `--model opus`。
9. 在 Print 模式中使用 `--fallback-model haiku` 以优雅处理模型过载。
10. 为不同任务启动新会话 — 会话持续 5 小时；全新上下文更高效。
11. 在 CI 中使用 `--no-session-persistence` 避免在磁盘上累积保存的会话。

## 陷阱与注意事项

1. **交互模式必须使用 tmux** — Claude Code 是一个完整的 TUI 应用程序。仅在 Hermes 终端中使用 `pty=true` 可以工作，但 tmux 提供了用于监控的 `capture-pane` 和用于输入的 `send-keys`，这对于编排至关重要。
2. **`--dangerously-skip-permissions` 对话框默认选择“否，退出”** — 您必须发送 Down 键然后 Enter 键才能接受。打印模式 (`-p`) 会完全跳过此步骤。
3. **`--max-budget-usd` 最小值约为 $0.05** — 仅系统提示缓存创建就会花费这么多。设置更低的值会立即报错。
4. **`--max-turns` 仅在打印模式下有效** — 在交互会话中会被忽略。
5. **Claude 可能使用 `python` 而不是 `python3`** — 在没有 `python` 符号链接的系统上，Claude 的 bash 命令首次尝试会失败，但会自我纠正。
6. **会话恢复需要相同的目录** — `--continue` 会查找当前工作目录的最新会话。
7. **`--json-schema` 需要足够的 `--max-turns`** — Claude 必须在生成结构化输出之前读取文件，这需要多个回合。
8. **信任对话框每个目录只出现一次** — 仅首次出现，之后会被缓存。
9. **后台 tmux 会话会持续存在** — 完成后始终使用 `tmux kill-session -t <name>` 进行清理。
10. **斜杠命令（如 `/commit`）仅在交互模式下有效** — 在 `-p` 模式下，请用自然语言描述任务。
11. **`--bare` 跳过 OAuth** — 需要 `ANTHROPIC_API_KEY` 环境变量或设置中的 `apiKeyHelper`。
12. **上下文退化是真实存在的** — 当上下文窗口使用率超过 70% 时，AI 输出质量会明显下降。使用 `/context` 监控并主动执行 `/compact`。

## Hermes 智能体规则

1. **单个任务优先使用打印模式 (`-p`)** — 更简洁，无需处理对话框，输出结构化
2. **多轮交互工作使用 tmux** — 这是编排 TUI 的唯一可靠方式
3. **始终设置 `workdir`** — 让 Claude 专注于正确的项目目录
4. **在打印模式下设置 `--max-turns`** — 防止无限循环和成本失控
5. **监控 tmux 会话** — 使用 `tmux capture-pane -t <session> -p -S -50` 检查进度
6. **查找 `❯` 提示符** — 表示 Claude 正在等待输入（完成或提出问题）
7. **清理 tmux 会话** — 完成后杀死它们以避免资源泄漏
8. **向用户报告结果** — 完成后，总结 Claude 所做的操作和更改的内容
9. **不要杀死缓慢的会话** — Claude 可能正在进行多步骤工作；请检查进度
10. **使用 `--allowedTools`** — 将功能限制为任务实际需要的范围