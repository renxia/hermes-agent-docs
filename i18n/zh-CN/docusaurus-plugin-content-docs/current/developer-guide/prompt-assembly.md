---
sidebar_position: 5
title: "提示词组装"
description: "Hermes 如何构建系统提示词、保持缓存稳定性和注入临时层"
---

# 提示词组装

Hermes 故意分离了：

- **缓存的系统提示词状态**
- **临时 API 调用时间添加的内容**

这是项目中最重要的设计选择之一，因为它影响了：

- token 使用量
- 提示词缓存的有效性
- 会话连续性
- 内存的正确性

主要文件：

- `run_agent.py`
- `agent/prompt_builder.py`
- `tools/memory_tool.py`

## 缓存的系统提示词层

缓存的系统提示词大致按以下顺序组装：

1. 代理身份 — 当可用时，从 `HERMES_HOME` 中的 `SOUL.md`；否则回退到 `prompt_builder.py` 中的 `DEFAULT_AGENT_IDENTITY`
2. 工具感知行为指导
3. Honcho 静态块（如果激活）
4. 可选系统消息
5. 冻结的 MEMORY 快照
6. 冻结的 USER 个人资料快照
7. 技能索引
8. 上下文文件（`AGENTS.md`、`.cursorrules`、`.cursor/rules/*.mdc`）— 如果 SOUL.md 已在步骤 1 中作为身份加载，则**不会**包含在此处
9. 时间戳 / 可选会话 ID
10. 平台提示

当设置了 `skip_context_files` 时（例如，子代理委托），将不加载 SOUL.md，而是使用硬编码的 `DEFAULT_AGENT_IDENTITY`。

### 具体示例：组装的系统提示词

以下是当所有层都存在时，最终系统提示词的简化视图（注释显示了每个部分的来源）：

```
# Layer 1: Agent Identity (from ~/.hermes/SOUL.md)
You are Hermes, an AI assistant created by Nous Research.
You are an expert software engineer and researcher.
You value correctness, clarity, and efficiency.
...

# Layer 2: Tool-aware behavior guidance
You have persistent memory across sessions. Save durable facts using
the memory tool: user preferences, environment details, tool quirks,
and stable conventions. Memory is injected into every turn, so keep
it compact and focused on facts that will still matter later.
...
When the user references something from a past conversation or you
suspect relevant cross-session context exists, use session_search
to recall it before asking them to repeat themselves.

# Tool-use enforcement (for GPT/Codex models only)
You MUST use your tools to take action — do not describe what you
would do or plan to do without actually doing it.
...

# Layer 3: Honcho static block (when active)
[Honcho personality/context data]

# Layer 4: Optional system message (from config or API)
[User-configured system message override]

# Layer 5: Frozen MEMORY snapshot
## Persistent Memory
- User prefers Python 3.12, uses pyproject.toml
- Default editor is nvim
- Working on project "atlas" in ~/code/atlas
- Timezone: US/Pacific

# Layer 6: Frozen USER profile snapshot
## User Profile
- Name: Alice
- GitHub: alice-dev

# Layer 7: Skills index
## Skills (mandatory)
Before replying, scan the skills below. If one clearly matches
your task, load it with skill_view(name) and follow its instructions.
...
<available_skills>
  software-development:
    - code-review: Structured code review workflow
    - test-driven-development: TDD methodology
  research:
    - arxiv: Search and summarize arXiv papers
</available_skills>

# Layer 8: Context files (from project directory)
# Project Context
The following project context files have been loaded and should be followed:

## AGENTS.md
This is the atlas project. Use pytest for testing. The main
entry point is src/atlas/main.py. Always run `make lint` before
committing.

# Layer 9: Timestamp + session
Current time: 2026-03-30T14:30:00-07:00
Session: abc123

# Layer 10: Platform hint
You are a CLI AI Agent. Try not to use markdown but simple text
renderable inside a terminal.
```

## SOUL.md 在提示词中出现的方式

`SOUL.md` 位于 `~/.hermes/SOUL.md`，作为代理的身份——系统提示词的第一个部分。`prompt_builder.py` 中的加载逻辑如下工作：

```python
# From agent/prompt_builder.py (simplified)
def load_soul_md() -> Optional[str]:
    soul_path = get_hermes_home() / "SOUL.md"
    if not soul_path.exists():
        return None
    content = soul_path.read_text(encoding="utf-8").strip()
    content = _scan_context_content(content, "SOUL.md")  # Security scan
    content = _truncate_content(content, "SOUL.md")       # Cap at 20k chars
    return content
```

当 `load_soul_md()` 返回内容时，它会替换硬编码的 `DEFAULT_AGENT_IDENTITY`。然后调用 `build_context_files_prompt()` 并传入 `skip_soul=True`，以防止 SOUL.md 出现两次（一次作为身份，一次作为上下文文件）。

如果 `SOUL.md` 不存在，系统将回退到：

```
You are Hermes Agent, an intelligent AI assistant created by Nous Research.
You are helpful, knowledgeable, and direct. You assist users with a wide
range of tasks including answering questions, writing and editing code,
analyzing information, creative work, and executing actions via your tools.
You communicate clearly, admit uncertainty when appropriate, and prioritize
being genuinely useful over being verbose unless otherwise directed below.
Be targeted and efficient in your exploration and investigations.
```

## 上下文文件注入的方式

`build_context_files_prompt()` 使用**优先级系统**——只加载一种项目上下文类型（第一个匹配的获胜）：

```python
# From agent/prompt_builder.py (simplified)
def build_context_files_prompt(cwd=None, skip_soul=False):
    cwd_path = Path(cwd).resolve()

    # Priority: first match wins — only ONE project context loaded
    project_context = (
        _load_hermes_md(cwd_path)       # 1. .hermes.md / HERMES.md (walks to git root)
        or _load_agents_md(cwd_path)    # 2. AGENTS.md (cwd only)
        or _load_claude_md(cwd_path)    # 3. CLAUDE.md (cwd only)
        or _load_cursorrules(cwd_path)  # 4. .cursorrules / .cursor/rules/*.mdc
    )

    sections = []
    if project_context:
        sections.append(project_context)

    # SOUL.md from HERMES_HOME (independent of project context)
    if not skip_soul:
        soul_content = load_soul_md()
        if soul_content:
            sections.append(soul_content)

    if not sections:
        return ""

    return (
        "# Project Context\n\n"
        "The following project context files have been loaded "
        "and should be followed:\n\n"
        + "\n".join(sections)
    )
```

### 上下文文件发现详情

| 优先级 | 文件 | 搜索范围 | 说明 |
|----------|-------|-------------|-------|
| 1 | `.hermes.md`, `HERMES.md` | 从 CWD 到 git 根目录 | Hermes 原生项目配置 |
| 2 | `AGENTS.md` | 仅 CWD | 通用代理指令文件 |
| 3 | `CLAUDE.md` | 仅 CWD | Claude Code 兼容性 |
| 4 | `.cursorrules`, `.cursor/rules/*.mdc` | 仅 CWD | Cursor 兼容性 |

所有上下文文件都经过：
- **安全扫描** — 检查提示词注入模式（不可见 Unicode、"ignore previous instructions"、凭证泄露尝试）
- **截断** — 使用 70/20 的头部/尾部比例，并使用截断标记限制在 20,000 个字符以内
- **YAML 前置元数据剥离** — 移除 `.hermes.md` 的前置元数据（保留给未来的配置覆盖）

## 仅 API 调用时间使用的层

这些层故意**不会**作为缓存的系统提示词的一部分持久化：

- `ephemeral_system_prompt`
- prefill 消息
- 网关派生的会话上下文覆盖层
- 后续回合的 Honcho 回忆注入到当前回合的用户消息中

这种分离保持了稳定前缀的稳定性，从而便于缓存。

## 内存快照

本地内存和用户资料数据在会话开始时作为冻结快照注入。会话中途的写入会更新磁盘状态，但直到开始新的会话或强制重建，已构建的系统提示词不会被修改。

## 上下文文件

`agent/prompt_builder.py` 使用**优先级系统**扫描和清理项目上下文文件——只加载一种类型（第一个匹配的获胜）：

1. `.hermes.md` / `HERMES.md`（遍历到 git 根目录）
2. `AGENTS.md`（启动时在 CWD；子目录在会话期间通过 `agent/subdirectory_hints.py` 逐步发现）
3. `CLAUDE.md`（仅 CWD）
4. `.cursorrules` / `.cursor/rules/*.mdc`（仅 CWD）

`SOUL.md` 通过 `load_soul_md()` 单独加载用于身份槽位。当它成功加载时，`build_context_files_prompt(skip_soul=True)` 会防止它出现两次。

长文件在注入前会被截断。

## 技能索引

当可用技能工具时，技能系统会向提示词贡献一个紧凑的技能索引。

## 为什么提示词组装要这样拆分

该架构的目的是有意识地优化以下方面：

- 保持提供商侧的提示词缓存
- 避免不必要的历史记录修改
- 保持内存语义的可理解性
- 允许网关/ACP/CLI在不污染持久提示词状态的情况下添加上下文

## 相关文档

- [Context Compression & Prompt Caching](./context-compression-and-caching.md)
- [Session Storage](./session-storage.md)
- [Gateway Internals](./gateway-internals.md)