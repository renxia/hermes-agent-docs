---
title: "代码库检查 — 使用 pygount 检查代码库：代码行数、语言构成、比例分析"
sidebar_label: "代码库检查"
description: "使用 pygount 检查代码库：代码行数、语言构成、比例分析"
---

{/* 本页面由网站脚本 generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 代码库检查

使用 pygount 检查代码库：代码行数、语言构成、比例分析。

## 技能元数据

| | |
|---|---|
| 源码 | 内置（默认安装） |
| 路径 | `skills/github/codebase-inspection` |
| 版本 | `1.0.0` |
| 作者 | Hermes智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `代码行数`, `代码分析`, `pygount`, `代码库`, `指标`, `仓库` |
| 相关技能 | [`github-repo-management`](/user-guide/skills/bundled/github/github-github-repo-management) |

## 参考：完整的 SKILL.md

:::info
以下是此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# 使用 pygount 进行代码库检查

分析仓库的代码行数、语言构成、文件数量以及代码与注释的比例。

## 使用场景

- 用户询问代码行数
- 用户想要了解仓库的语言构成
- 用户询问代码库的大小或构成
- 用户想要了解代码与注释的比例
- 一般性的“这个仓库有多大”问题

## 前提条件

```bash
pip install --break-system-packages pygount 2>/dev/null || pip install pygount
```

## 1. 基本摘要（最常用）

获取包含文件数量、代码行和注释行的完整语言构成：

```bash
cd /path/to/repo
pygount --format=summary \
  --folders-to-skip=".git,node_modules,venv,.venv,__pycache__,.cache,dist,build,.next,.tox,.eggs,*.egg-info" \
  .
```

**重要提示：** 始终使用 `--folders-to-skip` 来排除依赖/构建目录，否则 pygount 会遍历它们，并且会花很长时间或卡住。

## 2. 常见文件夹排除列表

根据项目类型进行调整：

```bash
# Python 项目
--folders-to-skip=".git,venv,.venv,__pycache__,.cache,dist,build,.tox,.eggs,.mypy_cache"

# JavaScript/TypeScript 项目
--folders-to-skip=".git,node_modules,dist,build,.next,.cache,.turbo,coverage"

# 通用全面排除
--folders-to-skip=".git,node_modules,venv,.venv,__pycache__,.cache,dist,build,.next,.tox,vendor,third_party"
```

## 3. 按特定语言过滤

```bash
# 仅统计 Python 文件
pygount --suffix=py --format=summary .

# 仅统计 Python 和 YAML
pygount --suffix=py,yaml,yml --format=summary .
```

## 4. 详细的逐文件输出

```bash
# 默认格式显示每个文件的明细
pygount --folders-to-skip=".git,node_modules,venv" .

# 按代码行数排序（通过管道使用 sort）
pygount --folders-to-skip=".git,node_modules,venv" . | sort -t$'\t' -k1 -nr | head -20
```

## 5. 输出格式

```bash
# 摘要表格（推荐默认）
pygount --format=summary .

# JSON 格式输出，便于程序化使用
pygount --format=json .

# 管道友好格式：语言、文件数、代码、文档、空行、字符串
pygount --format=summary . 2>/dev/null
```

## 6. 结果解读

摘要表格的列含义：
- **语言** — 检测到的编程语言
- **文件** — 该语言的文件数量
- **代码** — 实际代码的行数（可执行/声明性）
- **注释** — 注释或文档的行数
- **百分比** — 占总数的百分比

特殊伪语言：
- `__empty__` — 空文件
- `__binary__` — 二进制文件（图片、编译文件等）
- `__generated__` — 自动生成的文件（通过启发式方法检测）
- `__duplicate__` — 内容完全相同的文件
- `__unknown__` — 无法识别的文件类型

## 常见陷阱

1. **始终排除 .git、node_modules、venv** — 如果没有 `--folders-to-skip`，pygount 会遍历所有内容，在大型依赖树上可能耗时数分钟或卡住。
2. **Markdown 显示 0 行代码** — pygount 将所有 Markdown 内容归类为注释而非代码。这是预期行为。
3. **JSON 文件显示的代码行数较低** — pygount 可能会保守地计算 JSON 行数。若需准确的 JSON 行数统计，请直接使用 `wc -l`。
4. **大型 monorepo** — 对于非常大的仓库，考虑使用 `--suffix` 来针对特定语言，而不是扫描全部内容。