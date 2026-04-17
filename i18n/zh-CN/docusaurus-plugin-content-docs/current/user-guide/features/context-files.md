---
sidebar_position: 8
title: "上下文文件"
description: "项目上下文文件 — .hermes.md, AGENTS.md, CLAUDE.md, 全局 SOUL.md 和 .cursorrules — 会自动注入到每一次对话中"
---

# 上下文文件

Hermes Agent 会自动发现并加载影响其行为的上下文文件。有些是项目本地的，它们会从您的工作目录中发现。`SOUL.md` 现在是 Hermes 实例的全局文件，并且只从 `HERMES_HOME` 加载。

## 支持的上下文文件

| 文件 | 用途 | 发现方式 |
|------|---------|-----------| 
| **.hermes.md** / **HERMES.md** | 项目指令（最高优先级） | 遍历 git 根目录 |
| **AGENTS.md** | 项目指令、约定、架构 | 启动时的当前工作目录 + 渐进式子目录 |
| **CLAUDE.md** | Claude 代码上下文文件（也检测） | 启动时的当前工作目录 + 渐进式子目录 |
| **SOUL.md** | 本 Hermes 实例的全局个性和语气定制 | 仅限 `HERMES_HOME/SOUL.md` |
| **.cursorrules** | Cursor IDE 编码约定 | 仅当前工作目录 |
| **.cursor/rules/*.mdc** | Cursor IDE 规则模块 | 仅当前工作目录 |

:::info 优先级系统
每个会话只加载**一种**项目上下文类型（第一个匹配项获胜）：`.hermes.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`。**SOUL.md** 始终作为代理身份（槽位 #1）独立加载。
:::

## AGENTS.md

`AGENTS.md` 是主要的项目上下文文件。它告诉代理如何构建您的项目、需要遵循哪些约定，以及任何特殊指令。

### 渐进式子目录发现

在会话开始时，Hermes 会将工作目录中的 `AGENTS.md` 加载到系统提示中。随着代理在会话期间进入子目录（通过 `read_file`、`terminal`、`search_files` 等），它会**渐进式地发现**这些目录中的上下文文件，并在它们变得相关时将其注入到对话中。

```
my-project/
├── AGENTS.md              ← 启动时加载（系统提示）
├── frontend/
│   └── AGENTS.md          ← 代理读取 frontend/ 文件时发现
├── backend/
│   └── AGENTS.md          ← 代理读取 backend/ 文件时发现
└── shared/
    └── AGENTS.md          ← 代理读取 shared/ 文件时发现
```

与在启动时加载所有内容相比，这种方法具有两个优势：
- **无系统提示膨胀** — 子目录提示仅在需要时出现
- **提示缓存保留** — 系统提示在回合之间保持稳定

每个子目录在每个会话中最多只检查一次。发现过程还会向上遍历父目录，因此即使 `backend/src/` 没有自己的上下文文件，读取 `backend/src/main.py` 也会发现 `backend/AGENTS.md`。

:::info
子目录上下文文件会像启动上下文文件一样经过相同的 [安全扫描](#security-prompt-injection-protection)。恶意文件将被阻止。
:::

### AGENTS.md 示例

```markdown
# 项目上下文

这是一个使用 Next.js 14 和 Python FastAPI 后端的 Web 应用程序。

## 架构
- 前端：Next.js 14，使用 App Router，位于 `/frontend`
- 后端：FastAPI，位于 `/backend`，使用 SQLAlchemy ORM
- 数据库：PostgreSQL 16
- 部署：Hetzner VPS 上的 Docker Compose

## 约定
- 前端代码必须使用 TypeScript 严格模式
- Python 代码遵循 PEP 8，所有地方使用类型提示
- 所有 API 端点返回 JSON，形状为 `{data, error, meta}`
- 测试文件放在 `__tests__/` 目录（前端）或 `tests/`（后端）

## 重要注意事项
- 绝不要直接修改迁移文件 — 请使用 Alembic 命令
- `.env.local` 文件包含真实 API 密钥，请勿提交
- 前端端口是 3000，后端是 8000，数据库是 5432
```

## SOUL.md

`SOUL.md` 控制着代理的个性、语气和沟通风格。有关完整详情，请参阅 [Personality](/docs/user-guide/features/personality) 页面。

**位置：**

- `~/.hermes/SOUL.md`
- 或者如果使用自定义主目录运行 Hermes，则为 `$HERMES_HOME/SOUL.md`

重要细节：

- 如果不存在，Hermes 会自动生成一个默认的 `SOUL.md`
- Hermes 只从 `HERMES_HOME` 加载 `SOUL.md`
- Hermes 不会探测工作目录以查找 `SOUL.md`
- 如果文件为空，则不会向提示中添加任何 `SOUL.md` 的内容
- 如果文件有内容，内容将在扫描和截断后原样注入

## .cursorrules

Hermes 与 Cursor IDE 的 `.cursorrules` 文件和 `.cursor/rules/*.mdc` 规则模块兼容。如果这些文件存在于您的项目根目录，并且没有找到更高优先级的上下文文件（`.hermes.md`、`AGENTS.md` 或 `CLAUDE.md`），它们将作为项目上下文加载。

这意味着当使用 Hermes 时，您现有的 Cursor 约定会自动应用。

## 上下文文件如何加载

### 启动时（系统提示）

上下文文件通过 `agent/prompt_builder.py` 中的 `build_context_files_prompt()` 加载：

1. **扫描工作目录** — 检查 `.hermes.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`（第一个匹配项获胜）
2. **读取内容** — 每个文件都作为 UTF-8 文本读取
3. **安全扫描** — 检查内容是否存在提示注入模式
4. **截断** — 超过 20,000 个字符的文件会进行头/尾截断（70% 头，20% 尾，中间有标记）
5. **组装** — 所有部分都在 `# 项目上下文` 标题下组合
6. **注入** — 组装的内容被添加到系统提示中

### 会话期间（渐进式发现）

`agent/subdirectory_hints.py` 中的 `SubdirectoryHintTracker` 监控工具调用参数中的文件路径：

1. **路径提取** — 每次工具调用后，都会从参数（`path`、`workdir`、shell 命令）中提取文件路径
2. **祖先遍历** — 会检查当前目录和最多 5 个父目录（在已访问的目录处停止）
3. **提示加载** — 如果找到 `AGENTS.md`、`CLAUDE.md` 或 `.cursorrules`，则加载（每个目录第一个匹配项）
4. **安全扫描** — 与启动文件相同的提示注入扫描
5. **截断** — 每个文件限制为 8,000 个字符
6. **注入** — 追加到工具结果中，使模型在上下文中自然地看到它

最终的提示部分大致如下所示：

```text
# 项目上下文

已加载以下项目上下文文件，请遵循：

## AGENTS.md

[您的 AGENTS.md 内容]

## .cursorrules

[您的 .cursorrules 内容]

[您的 SOUL.md 内容]
```

请注意，SOUL 内容是直接插入的，没有额外的包装文本。

## 安全性：提示注入保护

所有上下文文件在包含之前都会进行扫描，以检查潜在的提示注入。扫描器会检查：

- **指令覆盖尝试**："忽略先前指令"、"忽略您的规则"
- **欺骗模式**："不要告诉用户"
- **系统提示覆盖**："系统提示覆盖"
- **隐藏 HTML 注释**：`<!-- ignore instructions -->`
- **隐藏 div 元素**：`<div style="display:none">`
- **凭证泄露**：`curl ... $API_KEY`
- **秘密文件访问**：`cat .env`，`cat credentials`
- **不可见字符**：零宽空格、双向覆盖、单词连接符

如果检测到任何威胁模式，文件将被阻止：

```
[BLOCKED: AGENTS.md 包含潜在的提示注入 (prompt_injection)。内容未加载。]
```

:::warning
此扫描器可防止常见的注入模式，但不能替代审查共享仓库中的上下文文件。始终验证您未编写项目的 AGENTS.md 内容。
:::

## 大小限制

| 限制 | 值 |
|-------|-------|
| 每个文件最大字符数 | 20,000 (~7,000 tokens) |
| 头截断比例 | 70% |
| 尾截断比例 | 20% |
| 截断标记 | 10%（显示字符计数并建议使用文件工具） |

当文件超过 20,000 个字符时，截断消息显示为：

```
[...truncated AGENTS.md: kept 14000+4000 of 25000 chars. Use file tools to read the full file.]
```

## 有效上下文文件的技巧

:::tip AGENTS.md 的最佳实践
1. **保持简洁** — 保持在 20K 字符以下；代理每回合都会读取它
2. **使用标题结构化** — 使用 `##` 部分来划分架构、约定、重要注意事项
3. **包含具体示例** — 展示首选的代码模式、API 形状、命名约定
4. **说明不应做什么** — 例如：“绝不要直接修改迁移文件”
5. **列出关键路径和端口** — 代理会使用这些信息执行终端命令
6. **随着项目演进而更新** — 过时的上下文比没有上下文更糟糕
:::

### 按子目录划分的上下文

对于单体仓库（monorepos），请将特定于子目录的指令放入嵌套的 `AGENTS.md` 文件中：

```markdown
<!-- frontend/AGENTS.md -->
# 前端上下文

- 使用 `pnpm` 而不是 `npm` 进行包管理
- 组件放在 `src/components/`，页面放在 `src/app/`
- 使用 Tailwind CSS，绝不使用内联样式
- 使用 `pnpm test` 运行测试
```

```markdown
<!-- backend/AGENTS.md -->
# 后端上下文

- 使用 `poetry` 进行依赖管理
- 使用 `poetry run uvicorn main:app --reload` 运行开发服务器
- 所有端点都需要 OpenAPI 文档字符串
- 数据库模型位于 `models/`，模式位于 `schemas/`
```