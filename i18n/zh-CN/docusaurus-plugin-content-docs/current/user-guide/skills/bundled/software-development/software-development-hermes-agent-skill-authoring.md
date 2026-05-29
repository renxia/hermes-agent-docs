---
title: "赫尔墨斯智能体技能编写 — 编写仓库内技能"
sidebar_label: "赫尔墨斯智能体技能编写"
description: "编写仓库内技能"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 赫尔墨斯智能体技能编写

编写仓库内的 SKILL.md：前端元数据、验证器、结构。

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
以下是当此技能被触发时，赫尔墨斯加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# 编写赫尔墨斯智能体技能（仓库内）

## 概述

SKILL.md 可以存在于两个地方：

1.  **用户本地：** `~/.hermes/skills/<maybe-category>/<name>/SKILL.md` — 个人专用，不共享。通过 `skill_manage(action='create')` 创建。
2.  **仓库内（本技能关注此情况）：** `/home/bb/hermes-agent/skills/<category>/<name>/SKILL.md` — 已提交，随软件包分发。使用 `write_file` + `git add`。`skill_manage(action='create')` 不会针对此目录树。

## 何时使用

- 用户要求你在“此分支/仓库/提交”中添加一个技能。
- 你正在提交一个应随 hermes-agent 分发的可复用工作流。
- 你正在编辑 `/home/bb/hermes-agent/skills/` 下的现有技能（小的编辑用 `patch`，重写用 `write_file`；对于仓库内技能的 `patch`，`skill_manage` 仍有效，但不适用于 `create`）。

## 必需的前端元数据

事实来源：`tools/skill_manager_tool.py::_validate_frontmatter`。硬性要求：

- 以 `---` 作为第一个字节开始（前面没有空行）。
- 在正文之前以 `\n---\n` 关闭。
- 解析为 YAML 映射。
- 存在 `name` 字段。
- 存在 `description` 字段，长度 ≤ **1024 字符**（`MAX_DESCRIPTION_LENGTH`）。
- 关闭的 `---` 之后有非空的正文。

`skills/software-development/` 下每个技能使用的对等匹配结构：

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

`version` / `author` / `license` / `metadata` 不是由验证器强制的，但每个对等技能都有它们——省略会使你的技能显得突兀。

## 尺寸限制

- 描述：≤ 1024 字符（强制执行）。
- 完整 SKILL.md：≤ 100,000 字符（作为 `MAX_SKILL_CONTENT_CHARS` 强制执行，约 36k 个令牌）。
- `software-development/` 中的对等技能大约在 **8-14k 字符**。力求达到这个范围。如果你要超过 20k，请拆分到 `references/*.md` 并在 SKILL.md 中引用它们。

## 对等匹配的结构

每个仓库内技能大致遵循以下结构：

```
# <标题>

## 概述
一到两段文字：是什么以及为什么。

## 何时使用
- 要点式触发器
- “不要用于：”反向触发器

## <技能特定的主题章节>
- 快速参考表很常见
- 带确切命令的代码块
- 赫尔墨斯特定的操作方法（通过 scripts/run_tests.sh 进行测试，ui-tui 路径等）

## 常见陷阱
编号列表列出错误及其修复方法。

## 验证清单
- [ ] 操作后验证的复选框列表

## 一次性操作方法（可选）
命名场景 → 具体的命令序列。
```

并非每个章节都是强制性的，但 `概述` + `何时使用` + 可操作的正文 + 陷阱是技能看起来像一个合格对等技能的最低要求。

## 目录位置

```
skills/<category>/<skill-name>/SKILL.md
```

仓库中当前的类别（通过 `ls skills/` 确认）：`autonomous-ai-agents`, `creative`, `data-science`, `devops`, `dogfood`, `email`, `gaming`, `github`, `leisure`, `mcp`, `media`, `mlops/*`, `note-taking`, `productivity`, `red-teaming`, `research`, `smart-home`, `social-media`, `software-development`。

选择最接近的现有类别。不要随意发明新的顶级类别。

## 工作流程

1.  **查看目标类别中的对等技能**：
    ```
    ls skills/<category>/
    ```
    阅读 2-3 个对等的 SKILL.md 文件以匹配语气和结构。
2.  **检查验证器约束**：如果不确定，请查看 `tools/skill_manager_tool.py`。
3.  **草拟**：使用 `write_file` 写入 `skills/<category>/<name>/SKILL.md`。
4.  **本地验证**：
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
5.  **Git 添加 + 提交**：在活动分支上执行。
6.  **注意**：当前会话的技能加载器是缓存的——`skill_view` / `skills_list` 在新会话之前不会看到新技能。这是预期行为，不是错误。

## 交叉引用其他技能

`metadata.hermes.related_skills` 在加载时会联合两个目录树（仓库内的 `skills/` 和 `~/.hermes/skills/`）。你 *可以* 从仓库内技能引用一个用户本地技能，但对于其他克隆仓库的用户来说，它不会被解析。最好在仓库内技能中只引用其他仓库内技能。如果一个经常被引用的技能仅存在于 `~/.hermes/skills/` 中，请考虑将其提升到仓库中。

## 编辑现有的仓库内技能

-  **小修复（错别字、添加的陷阱、收窄的触发器）：** `skill_manage(action='patch', name=..., old_string=..., new_string=...)` 对仓库内技能有效。
-  **重大重写：** 使用 `write_file` 写入整个 SKILL.md。`skill_manage(action='edit')` 也可以工作，但需要提供完整的新内容。
-  **添加支持文件：** 使用 `write_file` 写入 `skills/<category>/<name>/references/<file>.md`、`templates/<file>` 或 `scripts/<file>`。`skill_manage(action='write_file')` 也可以工作，并强制执行 references/templates/scripts/assets 子目录的允许列表。
-  **务必提交**编辑——仓库内技能是源代码，不是运行时状态。

## 常见陷阱

1.  **对仓库内技能使用 `skill_manage(action='create')`。** 它会写入 `~/.hermes/skills/`，而不是仓库树。请使用 `write_file` 进行仓库内创建。

2.  **`---` 前面的前导空白。** 验证器检查 `content.startswith("---")`；任何前导空行或 BOM 都会导致验证失败。

3.  **描述过于笼统。** 对等技能的描述以“Use when ...”开头，并描述 *触发器类别*，而不是单个任务。"Use when debugging X" > "Debug X"。

4.  **忘记作者/许可证/元数据块。** 这不是验证器强制的，但每个对等技能都有它；省略会使技能看起来半途而废。

5.  **编写一个与对等技能重复的技能。** 创建之前，`ls skills/<category>/` 并打开 2-3 个对等技能。首选扩展现有技能，而不是创建一个狭窄的兄弟技能。

6.  **期望当前会话能看到新技能。** 它不会看到。技能加载器在会话开始时初始化。请在新会话中验证，或使用精确路径通过 `skill_view` 验证。

7.  **链接到仓库内不存在的技能。** `related_skills: [some-user-local-skill]` 对你有效，但对其他克隆用户则会中断。最好只链接仓库内技能。

## 验证清单

- [ ] 文件位于 `skills/<category>/<name>/SKILL.md`（不在 `~/.hermes/skills/` 中）
- [ ] 前端元数据以 `---` 从字节 0 开始，以 `\n---\n` 结束
- [ ] `name`, `description`, `version`, `author`, `license`, `metadata.hermes.{tags, related_skills}` 都存在
- [ ] 名称 ≤ 64 字符，小写 + 连字符
- [ ] 描述 ≤ 1024 字符，且以 "Use when ..." 开头
- [ ] 总文件 ≤ 100,000 字符（力求 8-15k）
- [ ] 结构：`# 标题` → `## 概述` → `## 何时使用` → 正文 → `## 常见陷阱` → `## 验证清单`
- [ ] `related_skills` 引用在仓库内可解析（或明确允许为用户本地）
- [ ] `git add skills/<category>/<name>/ && git commit` 已在目标分支上完成