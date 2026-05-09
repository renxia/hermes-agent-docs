---
sidebar_position: 5
title: "提示词组装"
description: "Hermes 如何构建系统提示词、保持缓存稳定性以及注入临时层"
---

# 提示词组装

Hermes 刻意将以下两者分离：

- **缓存的系统提示词状态**
- **临时的 API 调用时添加内容**

这是该项目中最重要的设计选择之一，因为它会影响：

- 令牌使用量
- 提示词缓存的有效性
- 会话连续性
- 记忆正确性

主要文件：

- `run_agent.py`
- `agent/prompt_builder.py`
- `tools/memory_tool.py`

## 缓存的系统提示词层

缓存的系统提示词大致按以下顺序组装：

1. 智能体身份 — 当 `HERMES_HOME` 中存在时，使用 `SOUL.md`；否则回退到 `prompt_builder.py` 中的 `DEFAULT_AGENT_IDENTITY`
2. 工具感知行为指导
3. Honcho 静态块（当处于激活状态时）
4. 可选的系统消息
5. 冻结的 MEMORY 快照
6. 冻结的 USER 配置快照
7. 技能索引
8. 上下文文件（`AGENTS.md`、`.cursorrules`、`.cursor/rules/*.mdc`）— 当 `SOUL.md` 已在第 1 步作为身份加载时，**不**包含在此处
9. 时间戳 / 可选会话 ID
10. 平台提示

当设置 `skip_context_files` 时（例如子智能体委派），不会加载 `SOUL.md`，而是使用硬编码的 `DEFAULT_AGENT_IDENTITY`。

### 具体示例：组装后的系统提示词

以下是所有层都存在时最终系统提示词的简化视图（注释显示了每个部分的来源）：

```
# 第 1 层：智能体身份（来自 ~/.hermes/SOUL.md）
你是 Hermes，由 Nous Research 创建的 AI 助手。
你是一名专业的软件工程师和研究员。
你重视正确性、清晰性和效率。
...

# 第 2 层：工具感知行为指导
你在会话之间具有持久记忆。使用记忆工具保存持久事实：
用户偏好、环境详情、工具特性以及稳定约定。记忆会被注入到每一轮对话中，
因此请保持简洁，并专注于稍后仍重要的内容。
...
当用户提及过去对话中的内容，或你怀疑存在相关的跨会话上下文时，
请在要求他们重复之前使用 session_search 来回忆。

# 工具使用强制（仅适用于 GPT/Codex 模型）
你必须使用你的工具来执行操作 — 不要描述你会做什么或计划做什么，
而不实际执行。
...

# 第 3 层：Honcho 静态块（当处于激活状态时）
[Honcho 个性/上下文数据]

# 第 4 层：可选系统消息（来自配置或 API）
[用户配置的系统消息覆盖]

# 第 5 层：冻结的 MEMORY 快照
```

## 持久化内存
- 用户偏好使用 Python 3.12，使用 pyproject.toml
- 默认编辑器是 nvim
- 正在 ~/code/atlas 中处理项目 "atlas"
- 时区：US/Pacific

# 第6层：冻结的用户配置文件快照
## 用户配置文件
- 姓名：Alice
- GitHub：alice-dev

# 第7层：技能索引
## 技能（必需）
在回复之前，请扫描以下技能。如果其中一项技能与您的任务明显匹配，请使用 skill_view(name) 加载它并遵循其说明。
...
<可用技能>
  software-development:
    - code-review: 结构化代码审查工作流
    - test-driven-development: TDD 方法论
  research:
    - arxiv: 搜索并总结 arXiv 论文
</可用技能>

# 第8层：上下文文件（来自项目目录）
# 项目上下文
以下项目上下文文件已被加载，应予以遵循：

## AGENTS.md
这是 atlas 项目。使用 pytest 进行测试。主要入口点是 src/atlas/main.py。在提交之前始终运行 `make lint`。

# 第9层：时间戳 + 会话
当前时间：2026-03-30T14:30:00-07:00
会话：abc123

# 第10层：平台提示
您是一个 CLI 智能体。尽量不要使用 Markdown，而是使用可在终端中呈现的简单文本。

```

## SOUL.md 在提示中的显示方式

`SOUL.md` 位于 `~/.hermes/SOUL.md`，作为智能体的身份标识 —— 系统提示的第一个部分。`prompt_builder.py` 中的加载逻辑如下所示：

```python
# 来自 agent/prompt_builder.py（简化版）
def load_soul_md() -> Optional[str]:
    soul_path = get_hermes_home() / "SOUL.md"
    if not soul_path.exists():
        return None
    content = soul_path.read_text(encoding="utf-8").strip()
    content = _scan_context_content(content, "SOUL.md")  # 安全检查
    content = _truncate_content(content, "SOUL.md")       # 限制为 20k 字符
    return content
```

当 `load_soul_md()` 返回内容时，它会替换硬编码的 `DEFAULT_AGENT_IDENTITY`。然后调用 `build_context_files_prompt()` 函数，并设置 `skip_soul=True`，以防止 SOUL.md 出现两次（一次作为身份标识，一次作为上下文文件）。

如果 `SOUL.md` 不存在，系统将回退到：

```
您是 Hermes 智能体，由 Nous Research 创建的智能 AI 助手。
您乐于助人、知识渊博且直接了当。您协助用户完成各种任务，包括回答问题、编写和编辑代码、分析信息、创意工作以及通过您的工具执行操作。
您沟通清晰，在适当的时候承认不确定性，并优先考虑真正有用，而不是冗长，除非另有指示。
在探索和调查时，要有针对性且高效。
```

## 上下文文件的注入方式

`build_context_files_prompt()` 使用**优先级系统** —— 只加载一种项目上下文类型（首次匹配获胜）：

```python
# 来自 agent/prompt_builder.py（简化版）
def build_context_files_prompt(cwd=None, skip_soul=False):
    cwd_path = Path(cwd).resolve()

    # 优先级：首次匹配获胜 — 只加载一种项目上下文
    project_context = (
        _load_hermes_md(cwd_path)       # 1. .hermes.md / HERMES.md（向上遍历至 git 根目录）
        or _load_agents_md(cwd_path)    # 2. AGENTS.md（仅限当前工作目录）
        or _load_claude_md(cwd_path)    # 3. CLAUDE.md（仅限当前工作目录）
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
        "以下项目上下文文件已被加载 "
        "并应予以遵循：\n\n"
        + "\n".join(sections)
    )
```

### 上下文文件发现详情

| 优先级 | 文件 | 搜索范围 | 说明 |
|----------|-------|-------------|-------|
| 1 | `.hermes.md`, `HERMES.md` | 从当前工作目录向上遍历至 git 根目录 | Hermes 原生项目配置 |
| 2 | `AGENTS.md` | 仅限当前工作目录 | 通用智能体指令文件 |
| 3 | `CLAUDE.md` | 仅限当前工作目录 | Claude Code 兼容性 |
| 4 | `.cursorrules`, `.cursor/rules/*.mdc` | 仅限当前工作目录 | Cursor 兼容性 |

所有上下文文件都会：
- **进行安全检查** —— 检查是否存在提示注入模式（不可见 Unicode、"忽略之前的指令"、凭证泄露尝试）
- **被截断** —— 使用 70/20 的头/尾比例截断至 20,000 个字符，并带有截断标记
- **剥离 YAML 前置元数据** —— `.hermes.md` 的前置元数据被移除（保留用于未来配置覆盖）

## 仅在 API 调用时存在的层

这些层 intentionally *不* 作为缓存系统提示的一部分持久化：

- `ephemeral_system_prompt`
- 预填充消息
- 网关派生的会话上下文覆盖
- 后续轮次的 Honcho 回忆注入到当前轮次的用户消息中

这种分离保持了缓存前缀的稳定性。

## 内存快照

本地内存和用户配置文件数据在会话开始时作为冻结快照注入。会话期间的写入会更新磁盘状态，但不会改变已构建的系统提示，直到发生新会话或强制重建。

## 上下文文件

`agent/prompt_builder.py` 使用**优先级系统**扫描和清理项目上下文文件 —— 只加载一种类型（首次匹配获胜）：

1. `.hermes.md` / `HERMES.md`（向上遍历至 git 根目录）
2. `AGENTS.md`（启动时的当前工作目录；子目录通过 `agent/subdirectory_hints.py` 在会话期间逐步发现）
3. `CLAUDE.md`（仅限当前工作目录）
4. `.cursorrules` / `.cursor/rules/*.mdc`（仅限当前工作目录）

`SOUL.md` 通过 `load_soul_md()` 单独加载，用于身份标识槽。当它成功加载时，`build_context_files_prompt(skip_soul=True)` 会防止它出现两次。

长文件在注入前会被截断。

## 技能索引

当技能工具可用时，技能系统会向提示贡献一个紧凑的技能索引。

## 支持的提示自定义表面

大多数用户应将 `agent/prompt_builder.py` 视为实现代码，而不是配置表面。支持的自定义路径是更改 Hermes 已经加载的提示输入，而不是就地编辑 Python 模板。

### 首先使用这些表面

- `~/.hermes/SOUL.md` —— 用您自己的智能体角色和固定行为替换内置的默认身份块。
- `~/.hermes/MEMORY.md` 和 `~/.hermes/USER.md` —— 提供应在新的会话中快照的持久跨会话事实和用户配置文件数据。
- 项目上下文文件，例如 `.hermes.md`、`HERMES.md`、`AGENTS.md`、`CLAUDE.md` 或 `.cursorrules` —— 注入特定于仓库的工作规则。
- 技能 —— 打包可重用的工作流和参考，而无需编辑核心提示代码。
- 可选的系统提示配置 / API 覆盖 —— 添加特定于部署的指令文本，而无需分叉 Hermes。
- 临时覆盖，例如 `HERMES_EPHEMERAL_SYSTEM_PROMPT` 或预填充消息 —— 添加不应成为缓存提示前缀的一部分的轮次范围指导。

### 何时改为编辑代码

仅当您有意维护一个分叉或贡献上游行为更改时，才编辑 `agent/prompt_builder.py`。该文件为每个会话组装提示管道、缓存边界和注入顺序。直接编辑那里是全局的、产品级的更改，而不是每个用户的提示自定义。

换句话说：

- 如果您想要不同的助手身份，请编辑 `SOUL.md`
- 如果您想要不同的仓库规则，请编辑项目上下文文件
- 如果您想要可重用的操作程序，请添加或修改技能
- 如果您想要更改 Hermes 为每个人组装提示的方式，请更改 Python 代码并将其视为代码贡献

## 为什么提示组装要这样拆分

该架构 intentionally 优化以：

- 保留提供商端的提示缓存
- 避免不必要地改变历史记录
- 保持内存语义的可理解性
- 允许网关/ACP/CLI 添加上下文，而不会污染持久化提示状态

## 相关文档

- [上下文压缩与提示缓存](./context-compression-and-caching.md)
- [会话存储](./session-storage.md)
- [网关内部](./gateway-internals.md)