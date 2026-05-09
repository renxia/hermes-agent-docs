---
title: "Hermes 智能体技能编写 — 编写仓库内技能"
sidebar_label: "Hermes 智能体技能编写"
description: "编写仓库内技能"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Hermes 智能体技能编写

编写仓库内 SKILL.md：前言、验证器、结构。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/software-development/hermes-agent-skill-authoring` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 标签 | `skills`, `authoring`, `hermes-agent`, `conventions`, `skill-md` |
| 相关技能 | [`writing-plans`](/docs/user-guide/skills/bundled/software-development/software-development-writing-plans), [`requesting-code-review`](/docs/user-guide/skills/bundled/software-development/software-development-requesting-code-review) |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# 编写 Hermes 智能体技能（仓库内）

## 概述

SKILL.md 可以存在于两个位置：

1. **用户本地：** `~/.hermes/skills/<maybe-category>/<name>/SKILL.md` — 个人使用，不共享。通过 `skill_manage(action='create')` 创建。
2. **仓库内（此技能针对此情况）：** `/home/bb/hermes-agent/skills/<category>/<name>/SKILL.md` — 提交，随包一起发布。使用 `write_file` + `git add`。`skill_manage(action='create')` 不会针对此目录树。

## 何时使用

- 用户要求你“在此分支 / 仓库 / 提交”中添加技能
- 你正在提交一个可重用的工作流，应随 hermes-agent 一起发布
- 你正在编辑 `/home/bb/hermes-agent/skills/` 下的现有技能（小编辑使用 `patch`，重写使用 `write_file`；`skill_manage` 仍可用于仓库内技能的补丁，但不能用于 `create`）

## 必需的前言

真相来源：`tools/skill_manager_tool.py::_validate_frontmatter`。硬性要求：

- 以 `---` 开头（无前导空行）。
- 在正文前以 `\n---\n` 结束。
- 解析为 YAML 映射。
- 存在 `name` 字段。
- 存在 `description` 字段，≤ **1024 字符**（`MAX_DESCRIPTION_LENGTH`）。
- 在结束 `---` 之后有非空正文。

`skills/software-development/` 下每个技能使用的同行匹配格式：

```yaml
---
name: my-skill-name               # 小写，连字符，≤64 字符 (MAX_NAME_LENGTH)
description: Use when <trigger>. <one-line behavior>.
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [short, descriptive, tags]
    related_skills: [other-skill, another-skill]
---
```

`version` / `author` / `license` / `metadata` 不由验证器强制执行，但每个同行都有它们 — 省略会使你的技能显得格格不入。

## 大小限制

- 描述：≤ 1024 字符（强制执行）。
- 完整 SKILL.md：≤ 100,000 字符（强制执行为 `MAX_SKILL_CONTENT_CHARS`，约 36k 个 token）。
- `software-development/` 中的同行技能大小为 **8-14k 字符**。以此为目标。如果你超过 20k，请将其拆分为 `references/*.md` 并从 SKILL.md 中引用它们。

## 同行匹配结构

每个仓库内技能大致遵循：

```
# <标题>

## 概述
一两段：什么以及为什么。

## 何时使用
- 项目符号触发器
- “不要用于：”反触发器

## <特定于技能的专题部分>
- 快速参考表很常见
- 包含精确命令的代码块
- Hermes 特定配方（通过 scripts/run_tests.sh 测试，ui-tui 路径等）

## 常见陷阱
错误及其修复的编号列表。

## 验证清单
- [ ] 操作后验证的复选框列表

## 一次性配方（可选）
命名场景 → 具体命令序列。
```

并非每个部分都是强制性的，但 `概述` + `何时使用` + 可操作的正文 + 陷阱是技能感觉像同行的最低要求。

## 目录放置

```
skills/<category>/<skill-name>/SKILL.md
```

仓库中当前存在的类别（通过 `ls skills/` 确认）：`autonomous-ai-agents`, `creative`, `data-science`, `devops`, `dogfood`, `email`, `gaming`, `github`, `leisure`, `mcp`, `media`, `mlops/*`, `note-taking`, `productivity`, `red-teaming`, `research`, `smart-home`, `social-media`, `software-development`。

选择最接近的现有类别。不要随意发明新的顶级类别。

## 工作流程

1. **调查目标类别中的同行：**
   ```
   ls skills/<category>/
   ```
   阅读 2-3 个同行 SKILL.md 文件以匹配语气和结构。
2. **如果不确定，请检查 `tools/skill_manager_tool.py` 中的验证器约束。**
3. **使用 `write_file` 起草到 `skills/<category>/<name>/SKILL.md`。**
4. **本地验证：**
   ```python
   import yaml, re, pathlib
   content = pathlib.Path("skills/<category>/<name>/SKILL.md").read_text()
   assert content.startswith("---")
   m = re.search(r'\n---\s*\n', content[3:])
   fm = yaml.safe_load(content[3:m.start()+3])
   assert "name" in fm and "description" in fm
   assert len(fm["description"]) <= 1024
   assert len(content) <= 100_000
   ```
5. **在活动分支上执行 `git add + commit`。**
6. **注意：** 当前会话的技能加载器已缓存 — `skill_view` / `skills_list` 在新会话之前不会看到新技能。这是预期的，不是错误。

## 交叉引用其他技能

`metadata.hermes.related_skills` 在加载时联合两个树（仓库内的 `skills/` 和 `~/.hermes/skills/`）。你可以在仓库内技能中引用用户本地技能，但对于其他克隆仓库的用户来说，它将无法解析。优先在仓库内技能中仅引用仓库内技能。如果某个频繁引用的技能仅存在于 `~/.hermes/skills/` 中，请考虑将其提升到仓库中。

## 编辑现有仓库内技能

- **小修复（错别字、添加陷阱、收紧触发器）：** `skill_manage(action='patch', name=..., old_string=..., new_string=...)` 对仓库内技能有效。
- **重大重写：** 使用 `write_file` 编写整个 SKILL.md。`skill_manage(action='edit')` 也有效，但需要提供完整的新内容。
- **添加支持文件：** 使用 `write_file` 写入 `skills/<category>/<name>/references/<file>.md`、`templates/<file>` 或 `scripts/<file>`。`skill_manage(action='write_file')` 也有效，并强制执行 references/templates/scripts/assets 子目录白名单。
- **始终提交编辑** — 仓库内技能是源代码，而不是运行时状态。

## 常见陷阱

1. **对仓库内技能使用 `skill_manage(action='create')`。** 它会写入 `~/.hermes/skills/`，而不是仓库目录树。对仓库内创建使用 `write_file`。

2. **`---` 前有前导空白字符。** 验证器检查 `content.startswith("---")`；任何前导空行或 BOM 都会导致验证失败。

3. **描述过于笼统。** 同行描述以“Use when ...”开头，并描述*触发器类别*，而不是单个任务。“Use when debugging X” > “Debug X”。

4. **忘记作者/许可证/元数据块。** 不由验证器强制执行，但每个同行都有它；省略会使技能看起来不完整。

5. **编写重复同行的技能。** 在创建之前，执行 `ls skills/<category>/` 并打开 2-3 个同行。优先扩展现有技能，而不是创建狭窄的同级技能。

6. **期望当前会话能看到新技能。** 它不会。技能加载器在会话开始时初始化。在新的会话中验证，或使用 `skill_view` 和精确路径进行验证。

7. **链接到仓库中不存在的技能。** `related_skills: [some-user-local-skill]` 对你有效，但会破坏其他克隆。优先仅使用仓库内链接。

## 验证清单

- [ ] 文件位于 `skills/<category>/<name>/SKILL.md`（不在 `~/.hermes/skills/` 中）
- [ ] 前言从第 0 字节开始以 `---` 开头，以 `\n---\n` 结束
- [ ] `name`、`description`、`version`、`author`、`license`、`metadata.hermes.{tags, related_skills}` 全部存在
- [ ] 名称 ≤ 64 字符，小写 + 连字符
- [ ] 描述 ≤ 1024 字符，并以“Use when ...”开头
- [ ] 文件总大小 ≤ 100,000 字符（目标为 8-15k）
- [ ] 结构：`# 标题` → `## 概述` → `## 何时使用` → 正文 → `## 常见陷阱` → `## 验证清单`
- [ ] `related_skills` 引用在仓库内可解析（或明确允许为用户本地）
- [ ] 在预期分支上完成 `git add skills/<category>/<name>/ && git commit`