---
sidebar_position: 8
title: "上下文文件"
description: "项目上下文文件 — .hermes.md、AGENTS.md、CLAUDE.md、全局 SOUL.md 和 .cursorrules — 会自动注入到每次对话中"
---

# 上下文文件

Hermes 智能体会自动发现并加载定义其行为方式的上下文文件。有些是项目本地的，会从您的工作目录中发现。`SOUL.md` 现在是全局的，对于该 Hermes 实例而言，仅从 `HERMES_HOME` 加载。

## 支持的上下文文件

| 文件 | 用途 | 发现方式 |
|------|---------|-----------| 
| **.hermes.md** / **HERMES.md** | 项目指令（最高优先级） | 递归查找至 git 根目录 |
| **AGENTS.md** | 项目指令、规范、架构 | 启动时的工作目录 + 渐进式发现子目录 |
| **CLAUDE.md** | Claude Code 上下文文件（也会被检测） | 启动时的工作目录 + 渐进式发现子目录 |
| **SOUL.md** | 此 Hermes 实例的全局个性与语气定制 | 仅 `HERMES_HOME/SOUL.md` |
| **.cursorrules** | Cursor IDE 编码规范 | 仅工作目录 |
| **.cursor/rules/*.mdc** | Cursor IDE 规则模块 | 仅工作目录 |

:::info 优先级系统
每个会话只加载**一种**项目上下文类型（首次匹配生效）：`.hermes.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`。**SOUL.md** 始终作为智能体身份（插槽 #1）独立加载。
:::

## AGENTS.md

`AGENTS.md` 是主要的项目上下文文件。它告诉智能体您的项目结构如何、遵循哪些规范以及任何特殊指令。

### 渐进式子目录发现

会话开始时，Hermes 会加载来自您工作目录的 `AGENTS.md` 到系统提示词中。当智能体在会话期间通过（`read_file`、`terminal`、`search_files` 等操作）导航到子目录时，它会**渐进式发现**这些目录中的上下文文件，并在它们变得相关时将它们注入对话中。

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

这种方法相比在启动时加载所有内容有两个优点：
- **避免系统提示词臃肿** — 子目录提示仅在需要时出现
- **保持提示词缓存** — 系统提示词在各轮次间保持稳定

每个子目录在每个会话中最多检查一次。发现过程也会向上遍历父目录，因此读取 `backend/src/main.py` 即使 `backend/src/` 没有自己的上下文文件，也会发现 `backend/AGENTS.md`。

:::info
子目录上下文文件会经过与启动时上下文文件相同的[安全扫描](#安全提示词注入防护)。恶意文件会被阻止。
:::

### 示例 AGENTS.md

```markdown
# 项目上下文

这是一个使用 Python FastAPI 后端的 Next.js 14 Web 应用程序。

## 架构
- 前端：Next.js 14，使用 App Router，位于 `/frontend`
- 后端：FastAPI，位于 `/backend`，使用 SQLAlchemy ORM
- 数据库：PostgreSQL 16
- 部署：在 Hetzner VPS 上使用 Docker Compose

## 规范
- 所有前端代码使用 TypeScript 严格模式
- Python 代码遵循 PEP 8，处处使用类型提示
- 所有 API 端点返回 `{data, error, meta}` 结构的 JSON
- 测试放在 `__tests__/` 目录（前端）或 `tests/`（后端）

## 重要注意事项
- 切勿直接修改迁移文件 — 使用 Alembic 命令
- `.env.local` 文件包含真实 API 密钥，请勿提交
- 前端端口是 3000，后端端口是 8000，数据库端口是 5432
```

## SOUL.md

`SOUL.md` 控制智能体的个性、语气和沟通风格。完整详情请参阅[个性](/user-guide/features/personality)页面。

**位置：**

- `~/.hermes/SOUL.md`
- 或者，如果您使用自定义主目录运行 Hermes，则是 `$HERMES_HOME/SOUL.md`

重要细节：

- 如果 `SOUL.md` 尚不存在，Hermes 会自动生成一个默认的
- Hermes 仅从 `HERMES_HOME` 加载 `SOUL.md`
- Hermes 不会在工作目录中探测 `SOUL.md`
- 如果文件为空，则 `SOUL.md` 的内容不会添加到提示词中
- 如果文件有内容，内容在扫描和截断后会被逐字注入

## .cursorrules

Hermes 兼容 Cursor IDE 的 `.cursorrules` 文件和 `.cursor/rules/*.mdc` 规则模块。如果这些文件存在于您的项目根目录，并且没有找到更高优先级的上下文文件（`.hermes.md`、`AGENTS.md` 或 `CLAUDE.md`），它们将作为项目上下文加载。

这意味着您现有的 Cursor 规范在使用 Hermes 时会自动适用。

## 上下文文件的加载方式

### 启动时（系统提示词）

上下文文件由 `agent/prompt_builder.py` 中的 `build_context_files_prompt()` 加载：

1.  **扫描工作目录** — 检查 `.hermes.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`（首次匹配生效）
2.  **读取内容** — 每个文件作为 UTF-8 文本读取
3.  **安全扫描** — 检查内容是否存在提示词注入模式
4.  **截断** — 超过 20,000 个字符的文件会被头部/尾部截断（头部 70%，尾部 20%，中间有一个标记）
5.  **组装** — 所有部分在 `# 项目上下文` 标题下组合
6.  **注入** — 组装好的内容被添加到系统提示词中

### 会话期间（渐进式发现）

`agent/subdirectory_hints.py` 中的 `SubdirectoryHintTracker` 监视工具调用参数中的文件路径：

1.  **路径提取** — 每次工具调用后，从参数（`path`、`workdir`、shell 命令）中提取文件路径
2.  **祖先目录遍历** — 检查该目录及最多 5 个父目录（在已访问的目录处停止）
3.  **提示加载** — 如果找到 `AGENTS.md`、`CLAUDE.md` 或 `.cursorrules`，则加载（每个目录首次匹配）
4.  **安全扫描** — 与启动时文件相同的提示词注入扫描
5.  **截断** — 每个文件上限为 8,000 个字符
6.  **注入** — 附加到工具结果后，因此模型自然地在上下文中看到它

最终的提示词部分大致如下所示：

```text
# 项目上下文

已加载以下项目上下文文件并应遵循：

## AGENTS.md

[此处为您的 AGENTS.md 内容]

## .cursorrules

[此处为您的 .cursorrules 内容]

[此处为您的 SOUL.md 内容]
```

请注意，SOUL 内容是直接插入的，没有额外的包装文本。

## 安全：提示词注入防护

所有上下文文件在被包含之前都会被扫描是否存在潜在的提示词注入。扫描器检查：

-   **指令覆盖尝试**："忽略之前的指示"、"无视你的规则"
-   **欺骗模式**："不要告诉用户"
-   **系统提示词覆盖**："系统提示词覆盖"
-   **隐藏的 HTML 注释**：`<!-- 忽略指示 -->`
-   **隐藏的 div 元素**：`<div style="display:none">`
-   **凭据窃取**：`curl ... $API_KEY`
-   **秘密文件访问**：`cat .env`、`cat credentials`
-   **不可见字符**：零宽空格、双向覆盖、词连接符

如果检测到任何威胁模式，该文件将被阻止：

```
[已阻止：AGENTS.md 包含潜在的提示词注入（prompt_injection）。内容未加载。]
```

:::warning
此扫描器可防范常见的注入模式，但它不能替代对共享仓库中上下文文件的审查。请务必验证您未亲自编写的项目中的 AGENTS.md 内容。
:::

## 大小限制

| 限制 | 值 |
|-------|-------|
| 每个文件最大字符数 | 20,000（约 7,000 个令牌） |
| 头部截断比例 | 70% |
| 尾部截断比例 | 20% |
| 截断标记 | 10%（显示字符数并建议使用文件工具） |

当文件超过 20,000 个字符时，截断消息显示为：

```
[...已截断 AGENTS.md：保留了 14000+4000 / 25000 个字符。请使用文件工具读取完整文件。]
```

## 有效上下文文件的技巧

:::tip AGENTS.md 的最佳实践
1.  **保持简洁** — 远低于 20K 字符；智能体每轮都会读取它
2.  **使用标题结构化** — 使用 `##` 部分来划分架构、规范、重要注意事项
3.  **包含具体示例** — 展示首选的代码模式、API 结构、命名规范
4.  **提及不要做什么** — "切勿直接修改迁移文件"
5.  **列出关键路径和端口** — 智能体将这些用于终端命令
6.  **随项目演变更新** — 过时的上下文比没有上下文更糟糕
:::

### 每子目录上下文

对于 monorepo，将子目录特定的指令放在嵌套的 AGENTS.md 文件中：

```markdown
<!-- frontend/AGENTS.md -->
# 前端上下文

- 使用 `pnpm` 而不是 `npm` 进行包管理
- 组件放在 `src/components/`，页面放在 `src/app/`
- 使用 Tailwind CSS，切勿使用内联样式
- 使用 `pnpm test` 运行测试
```

```markdown
<!-- backend/AGENTS.md -->
# 后端上下文

- 使用 `poetry` 进行依赖管理
- 使用 `poetry run uvicorn main:app --reload` 运行开发服务器
- 所有端点都需要 OpenAPI 文档字符串
- 数据库模型在 `models/` 中，模式在 `schemas/` 中
```