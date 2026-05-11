---
title: "Hermes 智能体技能编写 — 编写仓库内技能"
sidebar_label: "Hermes 智能体技能编写"
description: "编写仓库内技能"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Hermes 智能体技能编写

编写仓库内 SKILL.md：前端元数据、验证器、结构。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/software-development/hermes-agent-skill-authoring` |
| 版本 | `1.0.0` |
| 作者 | Hermes Agent |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `skills`, `authoring`, `hermes-agent`, `conventions`, `skill-md` |
| 相关技能 | [`writing-plans`](/docs/user-guide/skills/bundled/software-development/software-development-writing-plans), [`requesting-code-review`](/docs/user-guide/skills/bundled/software-development/software-development-requesting-code-review) |

## 参考：完整 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这就是技能激活时智能体看到的指令。
:::

# 编写 Hermes-Agent 技能（仓库内）

## 概述

SKILL.md 文件可以存放在两个地方：

1.  **用户本地：** `~/.hermes/skills/<可能的类别>/<名称>/SKILL.md` — 个人使用，不共享。通过 `skill_manage(action='create')` 创建。
2.  **仓库内（本技能关注此情况）：** `/home/bb/hermes-agent/skills/<类别>/<名称>/SKILL.md` — 已提交，随软件包一起发布。使用 `write_file` + `git add`。`skill_manage(action='create')` **不**针对此目录树。

## 何时使用

- 用户要求你在"这个分支/仓库/提交"中添加技能
- 你正在提交一个应随 hermes-agent 一起发布的可复用工作流
- 你正在编辑 `/home/bb/hermes-agent/skills/` 下的现有技能（对小的编辑使用 `patch`，重写使用 `write_file`；`skill_manage` 仍可用于仓库内技能的 `patch`，但不能用于 `create`）

## 必需的前端元数据

来源真实性：`tools/skill_manager_tool.py::_validate_frontmatter`。硬性要求：

- 以 `---` 作为前几个字节开头（没有前导空行）。
- 在正文前以 `\n---\n` 关闭。
- 解析为 YAML 映射。
- 存在 `name` 字段。
- 存在 `description` 字段，≤ **1024 个字符** (`MAX_DESCRIPTION_LENGTH`)。
- 关闭 `---` 之后有非空正文。

`skills/software-development/` 下每个技能使用的同类匹配结构：

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

`version` / `author` / `license` / `metadata` 不由验证器强制要求，但每个同类都有——遗漏它们会让你的技能显得半成品。

## 大小限制

- 描述：≤ 1024 个字符（强制执行）。
- 完整的 SKILL.md：≤ 100,000 个字符（作为 `MAX_SKILL_CONTENT_CHARS` 强制执行，约 36k 个 token）。
- `software-development/` 中的同类技能大约在 **8-14k 个字符**。争取达到这个范围。如果你快要超过 20k，请拆分为 `references/*.md` 并在 SKILL.md 中引用它们。

## 同类匹配结构

每个仓库内技能大致遵循：

```
# <标题>

## 概述
一到两段：是什么以及为什么。

## 何时使用
- 项目符号触发条件
- "不要用于：" 反触发条件

## <技能特定主题章节>
- 快速参考表很常见
- 带有确切命令的代码块
- 特定于 Hermes 的用例（通过 scripts/run_tests.sh 进行测试，ui-tui 路径等）

## 常见陷阱
错误及其修复方法的编号列表。

## 验证检查清单
- [ ] 操作后验证的复选框列表

## 一次性用例（可选）
命名场景 → 具体命令序列。
```

并非每个部分都是强制性的，但 `概述` + `何时使用` + 可操作的正文 + 陷阱是技能感觉像同类的最低要求。

## 目录放置

```
skills/<类别>/<技能名称>/SKILL.md
```

仓库中当前的类别（用 `ls skills/` 确认）：`autonomous-ai-agents`, `creative`, `data-science`, `devops`, `dogfood`, `email`, `gaming`, `github`, `leisure`, `mcp`, `media`, `mlops/*`, `note-taking`, `productivity`, `red-teaming`, `research`, `smart-home`, `social-media`, `software-development`。

选择最接近的现有类别。不要随意发明新的顶层类别。

## 工作流程

1.  **调查目标类别中的同类：**
    ```
    ls skills/<类别>/
    ```
    阅读 2-3 个同类 SKILL.md 文件以匹配风格和结构。
2.  **检查验证器约束**（如果不确定，请查阅 `tools/skill_manager_tool.py`）。
3.  **草拟**，使用 `write_file` 将内容写入 `skills/<类别>/<名称>/SKILL.md`。
4.  **本地验证：**
    ```python
    import yaml, re, pathlib
    content = pathlib.Path("skills/<类别>/<名称>/SKILL.md").read_text()
    assert content.startswith("---")
    m = re.search(r'\n---\s*\n', content[3:])
    fm = yaml.safe_load(content[3:m.start()+3])
    assert "name" in fm and "description" in fm
    assert len(fm["description"]) <= 1024
    assert len(content) <= 100_000
    ```
5.  **Git 添加 + 提交** 在活动分支上。
6.  **注意：** 当前会话的技能加载器是缓存的——`skill_view` / `skills_list` 在新会话之前不会看到新技能。这是预期行为，不是错误。

## 交叉引用其他技能

`metadata.hermes.related_skills` 在加载时会合并两个目录树（仓库内的 `skills/` 和 `~/.hermes/skills/`）。你可以从仓库内技能引用用户本地技能，但对于新克隆仓库的其他用户来说，它不会解析。优先只从仓库内技能引用仓库内技能。如果一个经常被引用的技能只存在于 `~/.hermes/skills/`，请考虑将其提升到仓库中。

## 编辑现有仓库内技能

-  **小修复（错别字、添加陷阱、收紧触发器）：** `skill_manage(action='patch', name=..., old_string=..., new_string=...)` 可以很好地处理仓库内技能。
-  **重大重写：** 使用 `write_file` 写入整个 SKILL.md。`skill_manage(action='edit')` 也可以工作，但需要提供完整的新内容。
-  **添加支持文件：** 使用 `write_file` 将文件写入 `skills/<类别>/<名称>/references/<文件>.md`、`templates/<文件>` 或 `scripts/<文件>`。`skill_manage(action='write_file')` 也适用，并强制执行 references/templates/scripts/assets 子目录的白名单。
-  **始终提交** 编辑——仓库内技能是源代码，不是运行时状态。

## 常见陷阱

1.  **对仓库内技能使用 `skill_manage(action='create')`。** 它会写入 `~/.hermes/skills/`，而不是仓库目录树。使用 `write_file` 进行仓库内创建。
2.  **`---` 前的前导空格。** 验证器检查 `content.startswith("---")`；任何前导空行或 BOM 都会导致验证失败。
3.  **描述过于笼统。** 同类描述以"Use when ..."开头，描述*触发类别*，而不是单一任务。"Use when debugging X" > "Debug X"。
4.  **忘记作者/许可证/元数据块。** 虽然不被验证器强制要求，但每个同类都有；遗漏它们会让你的技能看起来半途而废。
5.  **编写一个与同类重复的技能。** 创建前，请先 `ls skills/<类别>/` 并打开 2-3 个同类。优先扩展现有技能，而不是创建一个狭窄的同级技能。
6.  **期望当前会话能看到新技能。** 它不会。技能加载器在会话启动时初始化。请在新会话中验证，或通过使用确切路径的 `skill_view` 进行验证。
7.  **链接到仓库中不存在的技能。** `related_skills: [some-user-local-skill]` 对你有效，但会为其他克隆用户中断。优先只链接仓库内技能。

## 验证检查清单

- [ ] 文件位于 `skills/<类别>/<名称>/SKILL.md`（不在 `~/.hermes/skills/`）
- [ ] 前端元数据从第 0 字节开始以 `---` 开头，以 `\n---\n` 关闭
- [ ] `name`, `description`, `version`, `author`, `license`, `metadata.hermes.{tags, related_skills}` 全部存在
- [ ] 名称 ≤ 64 字符，小写 + 连字符
- [ ] 描述 ≤ 1024 字符，并以 "Use when ..." 开头
- [ ] 文件总计 ≤ 100,000 字符（目标 8-15k）
- [ ] 结构：`# 标题` → `## 概述` → `## 何时使用` → 正文 → `## 常见陷阱` → `## 验证检查清单`
- [ ] `related_skills` 引用在仓库内解析（或明确允许为用户本地）
- [ ] `git add skills/<类别>/<名称>/ && git commit` 已在目标分支上完成