---
sidebar_position: 5
title: "Prompt Assembly"
description: "How Hermes builds the system prompt, preserves cache stability, and injects ephemeral layers"
---

# Prompt Assembly

Hermes 有意将以下内容分离：

- **缓存的系统提示状态**
- **临时的 API 调用时注入内容**

这是项目中最重要的设计选择之一，因为它影响：

- token 使用量
- 提示缓存效果
- 会话连续性
- 记忆正确性

主要文件：

- `run_agent.py`
- `agent/prompt_builder.py`
- `tools/memory_tool.py`

## 缓存的系统提示层

缓存的系统提示按三个有序层级组装（参见 `agent/system_prompt.py`）：

1. **稳定层** — 身份信息（`SOUL.md` 或回退方案）、工具/模型指导、技能提示、环境提示、平台提示
2. **上下文层** — 调用方提供的 `system_message` 以及项目上下文文件（`.hermes.md` / `AGENTS.md` / `CLAUDE.md` / `.cursorrules`）
3. **易变层** — 内置记忆快照（`MEMORY.md`）、用户档案快照（`USER.md`）、外部记忆提供者块、时间戳/会话/模型/提供者行

最终的系统提示按如下方式拼接：`稳定层` → `上下文层` → `易变层`。

这一顺序对于优先级讨论很重要：
- 技能属于**稳定层**
- 记忆/档案快照属于**易变层**
- 两者仍然位于缓存的系统提示中（它们不会作为临时的中途覆盖层注入）

当设置了 `skip_context_files` 时（例如子智能体委托场景），不会加载 SOUL.md，而是使用硬编码的 `DEFAULT_AGENT_IDENTITY` 代替。

### 具体示例：组装后的系统提示

以下是所有层都存在时最终系统提示的简化视图（注释标示了每个部分的来源）：

```
# 第1层：智能体身份（来自 ~/.hermes/SOUL.md）
You are Hermes, an AI assistant created by Nous Research.
You are an expert software engineer and researcher.
You value correctness, clarity, and efficiency.
...

# 第2层：工具感知行为指导
You have persistent memory across sessions. Save durable facts using
the memory tool: user preferences, environment details, tool quirks,
and stable conventions. Memory is injected into every-turn, so keep
it compact and focused on facts that will still matter later.
...
When the user references something from a past conversation or you
suspect relevant cross-session context exists, use session_search
to recall it before asking them to repeat themselves.

# 工具使用强制执行（仅限 GPT/Codex 模型）
You MUST use your tools to take action — do not describe what you
would do or plan to do without actually doing it.
...

# 第3层：Honcho 静态块（激活时）
[Honcho personality/context data]

# 第4层：可选的 system message（来自配置或 API）
[用户配置的 system message 覆盖]

# 第5层：冻结的 MEMORY 快照

## 持久化记忆
- 用户偏好 Python 3.12，使用 pyproject.toml
- 默认编辑器是 nvim
- 正在开发 ~/code/atlas 中的 "atlas" 项目
- 时区：US/Pacific

# 第6层：冻结的 USER 配置文件快照
## 用户档案
- 姓名：Alice
- GitHub：alice-dev

# 第7层：技能索引
## 技能（强制）
在回复前，扫描以下技能。如果某项技能明确匹配你的任务，
则使用 skill_view(name) 加载它并遵循其说明。
...
<available_skills>
  software-development:
    - code-review: 结构化的代码审查工作流
    - test-driven-development: TDD 方法论
  research:
    - arxiv: 搜索并总结 arXiv 论文
</available_skills>

# 第8层：上下文文件（来自项目目录）
# 项目上下文
以下项目上下文文件已加载并应遵循：

## AGENTS.md
这是 atlas 项目。使用 pytest 进行测试。主要
入口点是 src/atlas/main.py。提交前始终运行 `make lint`。

# 第9层：时间戳 + 会话
当前时间：2026-03-30T14:30:00-07:00
会话：abc123

# 第10层：平台提示
你是一个 CLI AI 智能体。尽量不使用 markdown，而是使用可在终端内渲染的纯文本。
```

## 自定义平台提示

平台提示（上面的第10层）是 Hermes 为 Telegram、WhatsApp、Sl、CLI 及其他平台注入的面向特定平台的指引——例如"你处于终端中，避免使用 Markdown"。内置默认值位于 `PLATFORM_HINTS`（`agent/system_prompt.py`）中；插件提供的平台通过平台注册表提供各自的提示。

管理员可以通过 `config.yaml` 中的顶层 `platform_hints` 键来追加或替换单个平台的提示，而无需触及任何其他平台：

```yaml
platform_hints:
  whatsapp:
    append: >
      当表格输出有用时，调用 table_formatting
      技能而非发出 Markdown 表格。
  slack:
    replace: "你在 Slack 上。保持回复简洁，避免宽表格。"
  telegram: "偏好短消息；拆分长回答。"   # 简写 = 追加
```

- `append` — 保留内置提示并在其后添加额外文本。
- `replace` — 完全替换内置提示。
- 裸字符串 — `append` 的简写形式。
- 当两者同时存在时，`replace` 优先于 `append`。
- 格式错误的条目会被防御性忽略并回退到未修改的默认值，因此糟糕的配置值永远不会破坏提示组装或跨平台泄露。

覆盖在系统提示构建时解析（会话开始时，以及压缩时因为会重建提示）。它为固定配置生成字节稳定的提示，因此与内置提示一起位于**稳定**层，不会破坏提示缓存——它不是对冻结提示的实时会话中变更。

## SOUL.md 如何出现在提示中

`SOUL.md` 位于 `~/.hermes/SOUL.md`，作为智能体的身份标识——系统提示的第一部分。`prompt_builder.py` 中的加载逻辑如下：

```python
# 来自 agent/prompt_builder.py（简化版）
def load_soul_md() -> Optional[str]:
    soul_path = get_hermes_home() / "SOUL.md"
    if not soul_path.exists():
        return None
    content = soul_path.read_text(encoding="utf-8").strip()
    content = _scan_context_content(content, "SOUL.md")  # 安全扫描
    content = _truncate_content(content, "SOUL.md")       # 默认上限 20k 字符，可配置
    return content
```

当 `load_soul_md()` 返回内容时，它会替换硬编码的 `DEFAULT_AGENT_IDENTITY`。然后调用 `build_context_files_prompt()` 并传入 `skip_soul=True`，以防止 SOUL.md 出现两次（一次作为身份标识，一次作为上下文文件）。

如果 `SOUL.md` 不存在，系统将回退到：

```
你是 Hermes 智能体，一个由 Nous Research 创建的智能 AI 助手。
你乐于助人、知识渊博且直截了当。你协助用户完成广泛的任务，
包括回答问题、编写和编辑代码、分析信息、创意工作以及通过你的工具执行操作。
你沟通清晰，在不确定时坦然承认，并优先追求真正有用而非冗长，
除非下方另有指引。在探索和调查中要有针对性和效率。
```

## 上下文文件如何注入

`build_context_files_prompt()` 使用**优先级系统**——仅加载一种项目上下文类型（先匹配者优先）：

```python
# 来自 agent/prompt_builder.py（简化版）
def build_context_files_prompt(cwd=None, skip_soul=False):
    cwd_path = Path(cwd).resolve()

    # 优先级：先匹配者优先 — 仅加载一种项目上下文
    project_context = (
        _load_hermes_md(cwd_path)       # 1. .hermes.md / HERMES.md（向上搜索至 git 根目录）
        or _load_agents_md(cwd_path)    # 2. AGENTS.md（仅 CWD）
        or _load_claude_md(cwd_path)    # 3. CLAUDE.md（仅 CWD）
        or _load_cursorrules(cwd_path)  # 4. .cursorrules / .cursor/rules/*.mdc
    )

    sections = []
    if project_context:
        sections.append(project_context)

    # 来自 HERMES_HOME 的 SOUL.md（独立于项目上下文）
    if not skip_soul:
        soul_content = load_soul_md()
        if soul_content:
            sections.append(soul_content)

    if not sections:
        return ""

    return (
        "# 项目上下文\n\n"
        "以下项目上下文文件已加载并应遵循：\n\n"
        + "\n".join(sections)
    )
```

### 上下文文件发现详情

| 优先级 | 文件 | 搜索范围 | 说明 |
|----------|-------|-------------|-------|
| 1 | `.hermes.md`, `HERMES.md` | CWD 至 git 根目录 | Hermes 原生项目配置 |
| 2 | `AGENTS.md` | 仅 CWD | 通用智能体指令文件 |
| 3 | `CLAUDE.md` | 仅 CWD | Claude Code 兼容 |
| 4 | `.cursorrules`, `.cursor/rules/*.mdc` | 仅 CWD | Cursor 兼容 |

所有上下文文件均经过：
- **安全扫描**——检查提示注入模式（不可见 unicode、"忽略之前的指令"、凭证泄露尝试）
- **截断**——上限为 `context_file_max_chars` 字符（默认 20,000），使用 70/20 头尾比例并带截断标记
- **YAML frontmatter 剥离**——`.hermes.md` 的 frontmatter 被移除（保留供未来配置覆盖使用）

## 仅 API 调用时的层

这些层有意*不*作为缓存系统提示的一部分持久化：

- `ephemeral_system_prompt`
- 预填充消息
- 网关派生的会话上下文覆盖层
- 后续轮次中 Honcho/外部召回注入到当前轮次用户消息中的内容

`pre_llm_call` 插件上下文也落在这个仅 API 调用时的路径中：它被追加到当前轮次的**用户消息**中，而非写入缓存的系统提示。当多个插件返回上下文时，Hermes 会拼接这些上下文块（参见 [Hooks → `pre_llm_call`](../user-guide/features/hooks.md#pre_llm_call)）。

这种分离保持了稳定前缀的缓存稳定性。

## 记忆快照

本地记忆和用户档案数据在系统提示的**易失层**中捕获。会话中写入会更新磁盘状态，但在重建路径运行（新会话，或如压缩触发重建等显式失效/重建流程）之前，不会变更已构建的缓存系统提示。

## 上下文文件

`agent/prompt_builder.py` 使用**优先级系统**扫描和清理项目上下文文件——仅加载一种类型（先匹配者优先）：

1. `.hermes.md` / `HERMES.md`（向上搜索至 git 根目录）
2. `AGENTS.md`（启动时 CWD；会话过程中通过 `agent/subdirectory_hints.py` 逐步发现子目录）
3. `CLAUDE.md`（仅 CWD）
4. `.cursorrules` / `.cursor/rules/*.mdc`（仅 CWD）

`SOUL.md` 通过 `load_soul_md()` 单独加载用于身份槽位。当加载成功时，`build_context_files_prompt(skip_soul=True)` 防止其出现两次。

长文件在注入前会被截断。

## 技能索引

当技能工具可用时，技能系统为提示贡献一个紧凑的技能索引。

## 支持的提示自定义界面

大多数用户应将 `agent/prompt_builder.py` 视为实现代码，而非配置界面。支持的自定义路径是更改 Hermes 已加载的提示输入，而非直接编辑 Python 模板。

### 优先使用这些界面

- `~/.hermes/SOUL.md`——用你自己的智能体角色和持久行为替换内置的默认身份块。
- `~/.hermes/MEMORY.md` 和 `~/.hermes/USER.md`——提供应快照到新会话中的持久跨会话事实和用户档案数据。
- 项目上下文文件如 `.hermes.md`、`HERMES.md`、`AGENTS.md`、`CLAUDE.md` 或 `.cursorrules`——注入仓库特定的工作规则。
- 技能——打包可复用工作流和参考资料，无需编辑核心提示代码。
- 可选的系统提示配置 / API 覆盖——添加部署特定的指令文本而无需分叉 Hermes。
- 临时覆盖层如 `HERMES_EPHEMERAL_SYSTEM_PROMPT` 或预填充消息——添加不应成为缓存提示前缀一部分的轮次级指引。

### 何时改为编辑代码

仅当你有意维护分叉或贡献上游行为更改时，才编辑 `agent/prompt_builder.py`。该文件为每个会话组装提示管道、缓存边界和注入顺序。直接编辑等同于全局产品变更，而非每用户的提示自定义。

换言之：

- 如果你想要不同的助手身份，编辑 `SOUL.md`
- 如果你想要不同的仓库规则，编辑项目上下文文件
- 如果你想要可复用的操作程序，添加或修改技能
- 如果你想要更改 Hermes 为所有人组装提示的方式，更改 Python 并将其视为代码贡献
## 为何提示组装如此拆分

该架构有意优化为：

- 保持提供商侧的提示缓存
- 避免不必要地变更历史
- 保持记忆语义可理解
- 让网关/ACP/CLI 添加上下文而不会污染持久化提示状态

## 相关文档

- [上下文压缩与提示缓存](./context-compression-and-caching.md)
- [会话存储](./session-storage.md)
- [网关内部](./gateway-internals.md)