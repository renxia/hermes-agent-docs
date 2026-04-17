---
sidebar_position: 1
title: "技巧与最佳实践"
description: "关于如何最大限度地利用 Hermes Agent 的实用建议——提示技巧、CLI 快捷键、上下文文件、内存、成本优化和安全"
---

# 技巧与最佳实践

这是一系列实用的技巧合集，能让你立即提升使用 Hermes Agent 的效率。每个部分针对不同的方面，请浏览标题并跳转到相关内容。

---

## 获取最佳结果

### 明确你想要什么

模糊的提示会产生模糊的结果。不要说“修复代码”，而要说“修复 `api/handlers.py` 第 47 行的 TypeError — `process_request()` 函数从 `parse_body()` 接收到了 `None`。”你提供的上下文信息越多，所需的迭代次数就越少。

### 提前提供上下文

在请求中预先加载相关细节：文件路径、错误消息、预期行为。一个精心构建的消息胜过三次澄清。直接粘贴错误堆栈跟踪——Agent 可以解析它们。

### 使用上下文文件处理重复指令

如果你发现自己不断重复相同的指令（“使用制表符而不是空格”，“我们使用 pytest”，“API 在 `/api/v2`”），请将它们放入一个 `AGENTS.md` 文件中。Agent 会在每个会话中自动读取它——设置一次，之后零努力。

### 让 Agent 使用其工具

不要试图手把手指导每一步。说“查找并修复失败的测试”而不是“打开 `tests/test_foo.py`，查看第 42 行，然后...”。Agent 拥有文件搜索、终端访问和代码执行功能——让它去探索和迭代。

### 使用技能处理复杂工作流

在撰写一篇长提示来解释如何做某事之前，先检查是否已经有相应的技能。输入 `/skills` 浏览可用技能，或者直接调用如 `/axolotl` 或 `/github-pr-workflow`。

## CLI 高级用户技巧

### 多行输入

按 **Alt+Enter**（或 **Ctrl+J**）可以插入换行符而不会发送。这允许你在发送前组合多行提示、粘贴代码块或构建复杂的请求结构。

### 粘贴检测

CLI 会自动检测多行粘贴。只需直接粘贴代码块或错误堆栈跟踪——它不会将每一行作为单独的消息发送。粘贴内容会被缓冲并作为一个消息发送。

### 中断和重定向

按一次 **Ctrl+C** 可以中断 Agent 的响应。然后你可以输入一条新消息来重定向它。在 2 秒内连续按两次 Ctrl+C 可以强制退出。当 Agent 开始走错方向时，这个功能非常有用。

### 使用 `-c` 恢复会话

忘记了上次会话的内容？运行 `hermes -c` 即可恢复到你离开时的状态，并恢复完整的对话历史。你也可以通过标题恢复：`hermes -r "我的研究项目"`。

### 剪贴板图片粘贴

按 **Ctrl+V** 可以将剪贴板中的图片直接粘贴到聊天中。Agent 使用视觉功能来分析截图、图表、错误弹出窗口或 UI 模型——无需先保存到文件。

### 斜杠命令自动补全

输入 `/` 并按 **Tab** 键即可查看所有可用命令。这包括内置命令（`/compress`、`/model`、`/title`）和所有已安装的技能。你不需要记住任何东西——Tab 补全功能会帮你搞定。

:::tip
使用 `/verbose` 来循环工具输出显示模式：**off → new → all → verbose**。“all”模式非常适合观察 Agent 的操作；“off”模式最适合简单的问答。
:::

## 上下文文件

### AGENTS.md：项目的“大脑”

在项目根目录下创建一个 `AGENTS.md`，用于存放架构决策、编码规范和项目特定指令。这会自动注入到每个会话中，确保 Agent 始终了解你的项目规则。

```markdown
# 项目上下文
- 这是一个使用 SQLAlchemy ORM 的 FastAPI 后端
- 数据库操作始终使用 async/await
- 测试放在 tests/ 目录下，并使用 pytest-asyncio
- 绝不提交 .env 文件
```

### SOUL.md：自定义个性

是否希望 Hermes 拥有稳定的默认“声音”？编辑 `~/.hermes/SOUL.md`（或者如果你使用自定义的 Hermes 主目录，则为 `$HERMES_HOME/SOUL.md`）。Hermes 现在会自动播种一个初始 SOUL，并使用该全局文件作为实例范围的个性源。

要了解完整的操作流程，请参阅 [使用 SOUL.md 与 Hermes](/docs/guides/use-soul-with-hermes)。

```markdown
# Soul
你是一位高级后端工程师。言简意赅，直截了当。
除非被要求，否则跳过解释。比起冗长的解决方案，更喜欢单行代码。
始终考虑错误处理和边缘情况。
```

使用 `SOUL.md` 来保持持久的个性。使用 `AGENTS.md` 来存放项目特定的指令。

### .cursorrules 兼容性

是否已经有 `.cursorrules` 或 `.cursor/rules/*.mdc` 文件？Hermes 也会读取这些文件。无需重复你的编码规范——它们会自动从工作目录加载。

### 发现机制

Hermes 在会话开始时会加载当前工作目录的顶层 `AGENTS.md`。子目录的 `AGENTS.md` 文件是在工具调用过程中惰性发现的（通过 `subdirectory_hints.py`），并注入到工具结果中——它们不会预先加载到系统提示中。

:::tip
保持上下文文件聚焦和简洁。由于它们会被注入到每一个消息中，每个字符都会消耗你的 Token 预算。
:::

## 内存与技能

### 内存 vs. 技能：分别用于什么

**内存 (Memory)** 用于事实：你的环境、偏好、项目位置以及 Agent 学到关于你的事情。**技能 (Skills)** 用于流程：多步骤工作流、工具特定的指令和可重用配方。用内存存储“是什么”，用技能存储“如何做”。

### 何时创建技能

如果你发现了一个需要 5 个或更多步骤的任务，并且你打算再次执行它，可以要求 Agent 为它创建一个技能。说“将你刚刚做的事情保存为一个名为 `deploy-staging` 的技能”。下次，只需输入 `/deploy-staging`，Agent 就会加载完整的流程。

### 管理内存容量

内存是故意限制的（MEMORY.md 约为 2,200 个字符，USER.md 约为 1,375 个字符）。当它满了，Agent 会进行整合。你可以通过说“清理一下你的内存”或“用 3.12 替换旧的 Python 3.9 笔记”来帮助它。

### 让 Agent 记住

在一个高效的会话结束后，说“下次记得这个” (remember this for next time)，Agent 就会保存关键要点。你也可以更具体：“将以下内容保存到内存中：我们的 CI 使用了带有 `deploy.yml` 工作流的 GitHub Actions。”

:::warning
内存是一个固定的快照——在会话期间做的更改，直到下一个会话开始，都不会出现在系统提示中。Agent 会立即写入磁盘，但提示缓存不会在会话中途失效。
:::

## 性能与成本

### 不要破坏提示缓存

大多数 LLM 提供商都会缓存系统提示前缀。如果你保持系统提示稳定（上下文文件和内存不变），会话中的后续消息会获得**缓存命中**，这能显著降低成本。避免在会话中途更改模型或系统提示。

### 在达到限制前使用 /compress

长时间的会话会积累 Token。当你注意到响应变慢或被截断时，运行 `/compress`。这会总结对话历史，在大幅减少 Token 数量的同时，保留关键上下文。使用 `/usage` 查看当前消耗情况。

### 分配任务进行并行工作

需要一次性研究三个主题？要求 Agent 使用 `delegate_task` 并设置并行子任务。每个子 Agent 都会独立运行，拥有自己的上下文，最终只返回摘要——极大地减少了主对话的 Token 使用量。

### 使用 execute_code 进行批量操作

不要一次运行一个终端命令，而是要求 Agent 编写一个一次性完成所有任务的脚本。“编写一个 Python 脚本，将所有 `.jpeg` 文件重命名为 `.jpg` 并运行它”比单独重命名文件更便宜、更快。

### 选择合适的模型

使用 `/model` 在会话中途切换模型。对于复杂的推理和架构决策，使用前沿模型（Claude Sonnet/Opus, GPT-4o）。对于格式化、重命名或样板代码生成等简单任务，切换到更快的模型。

:::tip
定期运行 `/usage` 查看你的 Token 消耗。运行 `/insights` 可以查看过去 30 天使用模式的更广泛视图。
:::

## 消息传递技巧

### 设置主频道

在首选的 Telegram 或 Discord 聊天中使用 `/sethome` 将其指定为主频道。定时任务的结果和计划任务的输出都会发送到这里。如果没有设置，Agent 将没有地方发送主动消息。

### 使用 /title 组织会话

使用 `/title auth-refactor` 或 `/title research-llm-quantization` 为你的会话命名。命名会话可以通过 `hermes sessions list` 轻松找到，并使用 `hermes -r "auth-refactor"` 恢复。未命名的会话会堆积，难以区分。

### DM 配对实现团队访问

与其手动收集用户 ID 来创建白名单，不如启用 DM 配对。当队友私信 Bot 时，他们会获得一个一次性配对代码。你可以使用 `hermes pairing approve telegram XKGH5N7P` 进行批准——简单且安全。

### 工具进度显示模式

使用 `/verbose` 来控制你看到的工具活动程度。在消息平台，通常越少越好——保持在“new”模式，只看到新的工具调用。在 CLI 中，“all”模式能让你获得对 Agent 所有操作的令人满意的实时视图。

:::tip
在消息平台，会话在空闲一段时间后（默认：24 小时）或每天凌晨 4 点会自动重置。如果需要更长的会话，请在 `~/.hermes/config.yaml` 中调整每个平台的设置。
:::

## 安全性

### 使用 Docker 处理不可信代码

在处理不可信的仓库或运行不熟悉的代码时，请使用 Docker 或 Daytona 作为你的终端后端。在 `.env` 中设置 `TERMINAL_BACKEND=docker`。容器内部的破坏性命令无法损害你的宿主系统。

```bash
# 在你的 .env 中:
TERMINAL_BACKEND=docker
TERMINAL_DOCKER_IMAGE=hermes-sandbox:latest
```

### 避免 Windows 编码陷阱

在 Windows 上，一些默认编码（例如 `cp125x`）无法表示所有 Unicode 字符，这可能导致在测试或脚本中写入文件时出现 `UnicodeEncodeError`。

- 最好使用显式的 UTF-8 编码打开文件：

```python
with open("results.txt", "w", encoding="utf-8") as f:
    f.write("✓ All good\n")
```

- 在 PowerShell 中，你也可以将当前会话切换到 UTF-8，以确保控制台和原生命令输出：

```powershell
$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
```

这能让 PowerShell 和子进程保持在 UTF-8，有助于避免仅限于 Windows 的故障。

### 选择“总是”之前进行审查

当 Agent 触发危险命令批准（`rm -rf`、`DROP TABLE` 等）时，你会得到四个选项：**once**（一次）、**session**（会话）、**always**（总是）、**deny**（拒绝）。在选择“总是”之前要仔细考虑——它会永久白名单该模式。从“会话”开始，直到你感到舒适。

### 命令批准是你的安全网

Hermes 在执行任何命令之前，都会根据一套精心策划的危险模式列表进行检查。这包括递归删除、SQL 删除、通过管道将 curl 传给 shell 等。在生产环境中不要禁用此功能——它存在有其充分的理由。

:::warning
当在容器后端（Docker、Singularity、Modal、Daytona）运行时，危险命令检查是**跳过**的，因为容器本身就是安全边界。请确保你的容器镜像已正确锁定。
:::

### 使用白名单管理消息机器人

绝不要在具有终端访问权限的机器人上设置 `GATEWAY_ALLOW_ALL_USERS=true`。始终使用平台特定的白名单（`TELEGRAM_ALLOWED_USERS`、`DISCORD_ALLOWED_USERS`）或 DM 配对来控制谁可以与你的 Agent 互动。

```bash
# 推荐：每个平台的显式白名单
TELEGRAM_ALLOWED_USERS=123456789,987654321
DISCORD_ALLOWED_USERS=123456789012345678

# 或者使用跨平台白名单
GATEWAY_ALLOWED_USERS=123456789,987654321
```

---

*有任何应该出现在本页的技巧？请提交一个 Issue 或 PR——欢迎社区贡献。*