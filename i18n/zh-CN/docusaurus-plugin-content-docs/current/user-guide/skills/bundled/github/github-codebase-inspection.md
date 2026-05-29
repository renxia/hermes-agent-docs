---
title: "代码库检查 — 使用pygount检查代码库：代码行数、语言、比例"
sidebar_label: "代码库检查"
description: "使用pygount检查代码库：代码行数、语言、比例"
---

{/* 本页面由website/scripts/generate-skill-docs.py从技能的SKILL.md文件自动生成。请编辑源文件SKILL.md，而非本页面。 */}

# 代码库检查

使用pygount检查代码库：代码行数、语言、比例。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/github/codebase-inspection` |
| 版本 | `1.0.0` |
| 作者 | Hermes智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `代码行数`, `代码分析`, `pygount`, `代码库`, `指标`, `仓库` |
| 相关技能 | [`github-repo-management`](/docs/user-guide/skills/bundled/github/github-github-repo-management) |

## 参考：完整的 SKILL.md

:::info
以下是Hermes加载此技能时使用的完整技能定义。这是技能激活时智能体所看到的指令。
:::

# 使用pygount进行代码库检查

使用 `pygount` 分析仓库的代码行数、语言分布、文件数量和代码与注释比例。

## 何时使用

- 用户询问代码行数
- 用户想要了解仓库的语言分布
- 用户询问代码库大小或组成
- 用户想要代码与注释比例
- 通用的“这个仓库有多大”类问题

## 前提条件

```bash
pip install --break-system-packages pygount 2>/dev/null || pip install pygount
```

## 1. 基础摘要（最常用）

获取包含文件数量、代码行数和注释行数的完整语言分布：

```bash
cd /path/to/repo
pygount --format=summary \
  --folders-to-skip=".git,node_modules,venv,.venv,__pycache__,.cache,dist,build,.next,.tox,.eggs,*.egg-info" \
  .
```

**重要提示：** 务必使用 `--folders-to-skip` 排除依赖/构建目录，否则pygount会遍历它们，可能花费很长时间或卡住。

## 2. 常见的文件夹排除项

根据项目类型进行调整：

```bash
# Python项目
--folders-to-skip=".git,venv,.venv,__pycache__,.cache,dist,build,.tox,.eggs,.mypy_cache"

# JavaScript/TypeScript项目
--folders-to-skip=".git,node_modules,dist,build,.next,.cache,.turbo,coverage"

# 通用方案
--folders-to-skip=".git,node_modules,venv,.venv,__pycache__,.cache,dist,build,.next,.tox,vendor,third_party"
```

## 3. 按特定语言筛选

```bash
# 仅统计Python文件
pygount --suffix=py --format=summary .

# 仅统计Python和YAML
pygount --suffix=py,yaml,yml --format=summary .
```

## 4. 详细的逐文件输出

```bash
# 默认格式显示逐文件明细
pygount --folders-to-skip=".git,node_modules,venv" .

# 按代码行数排序（通过管道传递给sort）
pygount --folders-to-skip=".git,node_modules,venv" . | sort -t$'\t' -k1 -nr | head -20
```

## 5. 输出格式

```bash
# 摘要表格（默认推荐）
pygount --format=summary .

# JSON输出，便于程序化处理
pygount --format=json .

# 管道友好格式：语言、文件数、代码、文档、空行、字符串
pygount --format=summary . 2>/dev/null
```

## 6. 解读结果

摘要表各列含义：
- **语言** — 检测到的编程语言
- **文件** — 该语言的文件数量
- **代码** — 实际代码行数（可执行/声明性代码）
- **注释** — 注释或文档行数
- **%** — 占总代码行数的百分比

特殊伪语言：
- `__empty__` — 空文件
- `__binary__` — 二进制文件（图像、编译文件等）
- `__generated__` — 自动生成的文件（通过启发式方法检测）
- `__duplicate__` — 内容完全相同的文件
- `__unknown__` — 无法识别的文件类型

## 常见陷阱

1. **务必排除 .git、node_modules、venv** — 如果不使用 `--folders-to-skip`，pygount会遍历所有内容，在大型依赖树上可能耗时数分钟或卡住。
2. **Markdown文件显示0行代码** — pygount将所有Markdown内容归类为注释，而非代码。这是预期行为。
3. **JSON文件代码行数显示较低** — pygount可能保守地统计JSON行数。如需准确的JSON行数，请直接使用 `wc -l`。
4. **大型单仓库** — 对于非常大的仓库，考虑使用 `--suffix` 来针对特定语言，而不是扫描所有内容。