---
sidebar_position: 8
title: "Context Files"
description: "Project context files — .hermes.md, AGENTS.md, CLAUDE.md, global SOUL.md, and .cursorrules — automatically injected into every conversation"
---

# Context Files

Hermes 智能体会自动发现并加载影响其行为方式的上下文文件。其中一些是项目本地的，从你的工作目录中发现。`SOUL.md` 现在对 Hermes 实例是全局性的，仅从 `HERMES_HOME` 加载。

## 支持的上下文文件

| 文件 | 用途 | 发现方式 |
|------|---------|--------| 
| **.hermes.md** / **HERMES.md** | 项目指令（最高优先级） | 向上遍历至 git 根目录 |
| **AGENTS.md** | 项目指令、约定、架构 | 启动时的工作目录 + 渐进式子目录发现 |
| **CLAUDE.md** | Claude Code 上下文文件（同样可检测） | 启动时的工作目录 + 渐进式子目录发现 |
| **SOUL.md** | 此 Hermes 实例的全局个性与语气自定义 | 仅 `HERMES_HOME/SOUL.md` |
| **.cursorrules** | Cursor IDE 编码约定 | 仅工作目录 |
| **.cursor/rules/*.mdc** | Cursor IDE 规则模块 | 仅工作目录 |

:::info 优先级系统
每个会话只加载**一种**项目上下文类型（先匹配先生效）：`.hermes.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`。**SOUL.md** 始终作为智能体身份标识独立加载（槽位 #1）。
:::

## AGENTS.md

`AGENTS.md` 是主要的项目上下文文件。它告诉智能体你的项目结构如何、需要遵循哪些约定，以及任何特殊指令。

### 渐进式子目录发现

在会话启动时，Hermes 将你工作目录中的 `AGENTS.md` 加载到系统提示词中。当智能体在会话期间导航到子目录时（通过 `read_file`、`terminal`、`search_files` 等），它会**渐进式发现**这些目录中的上下文文件，并在相关时刻将其注入到对话中。

```
my-project/
├── AGENTS.md              ← 启动时加载（系统提示词）
├── frontend/
│   └── AGENTS.md          ← 当智能体读取 frontend/ 文件时发现
├── backend/
│   └── AGENTS.md          ← 当智能体读取 backend/ 文件时发现
└── shared/
    └── AGENTS.md          ← 当智能体读取 shared/ 文件时发现
```

这种方法相比在启动时加载所有内容有两个优势：
- **不会膨胀系统提示词** — 子目录提示仅在需要时出现
- **保持提示词缓存稳定** — 系统提示词在各轮之间保持稳定

每个子目录在每个会话中最多被检查一次。发现过程也会向上遍历父目录，因此读取 `backend/src/main.py` 时会发现 `backend/AGENTS.md`，即使 `backend/src/` 自身没有上下文文件。

:::info
子目录上下文文件与启动上下文文件经过相同的安全扫描。恶意文件会被阻止。
:::

### 示例 AGENTS.md

```markdown
# Project Context

This is a Next.js 14 web application with a Python FastAPI backend.

## Architecture
- Frontend: Next.js 14 with App Router in `/frontend`
- Backend: FastAPI in `/backend`, uses SQLAlchemy ORM
- Database: PostgreSQL 16
- Deployment: Docker Compose on a Hetzner VPS

## Conventions
- Use TypeScript strict mode for all frontend code
- Python code follows PEP 8, use type hints everywhere
- All API endpoints return JSON with `{data, error, meta}` shape
- Tests go in `__tests__/` directories (frontend) or `tests/` (backend)

## Important Notes
- Never modify migration files directly — use Alembic commands
- The `.env.local` file has real API keys, don't commit it
- Frontend port is 3000, backend is 8000, DB is 5432
```

## SOUL.md

`SOUL.md` 控制智能体的个性、语气和沟通风格。详情请参阅[个性](/user-guide/features/personality)页面。

**位置：**

- `~/.hermes/SOUL.md`
- 或者，如果你使用自定义主目录运行 Hermes，则为 `$HERMES_HOME/SOUL.md`

重要细节：

- 如果 `SOUL.md` 尚不存在，Hermes 会自动生成一个默认文件
- Hermes 仅从 `HERMES_HOME` 加载 `SOUL.md`
- Hermes 不会在工作目录中查找 `SOUL.md`
- 如果文件为空，则不会将 `SOUL.md` 的任何内容添加到提示词中
- 如果文件有内容，则在扫描和截断后逐字注入

## .cursorrules

Hermes 兼容 Cursor IDE 的 `.cursorrules` 文件和 `.cursor/rules/*.mdc` 规则模块。如果这些文件存在于你的项目中，且未找到更高优先级的上下文文件（`.hermes.md`、`AGENTS.md` 或 `CLAUDE.md`），则它们将作为项目上下文加载。

这意味着你在 Cursor 中已有的约定在使用 Hermes 时会自动生效。

## 上下文文件的加载方式

### 启动时（系统提示词）

上下文文件由 `agent/prompt_builder.py` 中的 `build_context_files_prompt()` 加载：

1. **扫描工作目录** — 检查 `.hermes.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`（先匹配先生效）
2. **读取内容** — 每个文件以 UTF-8 文本形式读取
3. **安全扫描** — 检查内容是否存在提示词注入模式
4. **截断** — 超过 `context_file_max_chars` 字符（默认 20,000）的文件将被头部/尾部截断（70% 头部，20% 尾部，中间有标记）
5. **组装** — 所有部分在 `# Project Context` 标题下合并
6. **注入** — 组装后的内容被添加到系统提示词中

### 会话期间（渐进式发现）

`agent/subdirectory_hints.py` 中的 `SubdirectoryHintTracker` 监控工具调用参数中的文件路径：

1. **路径提取** — 每次工具调用后，从参数（`path`、`workdir`、shell 命令）中提取文件路径
2. **祖先遍历** — 检查该目录及最多 5 个父目录（在已访问的目录处停止）
3. **提示加载** — 如果找到 `AGENTS.md`、`CLAUDE.md` 或 `.cursorrules`，则加载（每个目录仅取第一个匹配）
4. **安全扫描** — 与启动文件相同的提示词注入扫描
5. **截断** — 每个文件上限为 8,000 个字符
6. **注入** — 追加到工具结果中，使模型在上下文中自然地看到

最终的提示词部分大致如下：

```text
# Project Context

The following project context files have been loaded and should be followed:

## AGENTS.md

[Your AGENTS.md content here]

## .cursorrules

[Your .cursorrules content here]

[Your SOUL.md content here]
```

注意，SOUL 内容是直接插入的，没有额外的包装文本。

## 安全：提示词注入保护

所有上下文在包含之前都会进行潜在的提示词注入扫描。扫描器检查以下内容：

- **指令覆盖尝试**："ignore previous instructions"、"disregard your rules"
- **欺骗模式**："do not tell the user"
- **系统提示词覆盖**："system prompt override"
- **隐藏的 HTML 注释**：`<!-- ignore instructions -->`
- **隐藏的 div 元素**：`<div style="display:none">`
- **凭证窃取**：`curl ... $API_KEY`
- **敏感文件访问**：`cat .env`、`cat credentials`
- **不可见字符**：零宽空格、双向覆盖符、字词连接符

如果检测到任何威胁模式，文件将被阻止：

```
[BLOCKED: AGENTS.md contained potential prompt injection (prompt_injection). Content not loaded.]
```

:::warning
此扫描器可防御常见的注入模式，但不能替代在共享仓库中审查上下文文件的操作。对于你非原创的项目，始终应验证 AGENTS.md 的内容。
:::

## 大小限制

| 限制 | 值 |
|-------|-------|
| 每个文件最大字符数 | `context_file_max_chars`（默认 20,000，约 7,000 个 token） |
| 头部截断比例 | 70% |
| 尾部截断比例 | 20% |
| 截断标记 | 10%（显示字符数并建议使用文件工具） |

当文件超过配置的限制时，截断消息显示为：

```
[...truncated AGENTS.md: kept 14000+4000 of 25000 chars. Use file tools to read the full file.]
```

## 高效上下文文件的技巧

:::tip AGENTS.md 最佳实践
1. **保持简洁** — 控制在配置的 `context_file_max_chars` 以内；智能体每轮都会读取
2. **用标题组织** — 使用 `##` 章节来组织架构、约定、重要说明
3. **包含具体示例** — 展示首选的代码模式、API 结构、命名约定
4. **说明不应做的事** — "永远不要直接修改迁移文件"
5. **列出关键路径和端口** — 智能体会在终端命令中使用这些
6. **随项目演进更新** — 过时的上下文比没有上下文更糟糕
:::

### 按子目录的上下文

对于单体仓库，将子目录特定的指令放在嵌套的 AGENTS.md 文件中：

```markdown
<!-- frontend/AGENTS.md -->
# Frontend Context

- Use `pnpm` not `npm` for package management
- Components go in `src/components/`, pages in `src/app/`
- Use Tailwind CSS, never inline styles
- Run tests with `pnpm test`
```

```markdown
<!-- backend/AGENTS.md -->
# Backend Context

- Use `poetry` for dependency management
- Run the dev server with `poetry run uvicorn main:app --reload`
- All endpoints need OpenAPI docstrings
- Database models are in `models/`, schemas in `schemas/`
```