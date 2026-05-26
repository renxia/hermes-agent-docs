---
title: "Hermes 智能体技能编写 — 编写仓库内 SKILL"
sidebar_label: "Hermes 智能体技能编写"
description: "编写仓库内 SKILL"
---

{/* 本页面由网站脚本 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非本页。 */}

# Hermes 智能体技能编写

编写仓库内 SKILL.md：前置元数据、验证器、结构。

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
| 相关技能 | [`writing-plans`](/user-guide/skills/bundled/software-development/software-development-writing-plans), [`requesting-code-review`](/user-guide/skills/bundled/software-development/software-development-requesting-code-review) |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这就是智能体在技能激活时看到的指令。
:::

# 编写 Hermes-智能体技能（仓库内）

## 概述

SKILL.md 可以存在于两个位置：

1. **用户本地：** `~/.hermes/skills/<maybe-category>/<name>/SKILL.md` — 个人专用，不共享。通过 `skill_manage(action='create')` 创建。
2. **仓库内（本技能针对此情况）：** `/home/bb/hermes-agent/skills/<category>/<name>/SKILL.md` — 已提交，随软件包一起提供。使用 `write_file` + `git add`。`skill_manage(action='create')` 不会以此目录树为目标。

## 何时使用

- 用户要求你在“此分支/仓库/提交”中添加一个技能
- 你正在提交一个应随 hermes-agent 一起提供的可重用工作流
- 你正在编辑 `/home/bb/hermes-agent/skills/` 下的现有技能（小编辑使用 `patch`，重写使用 `write_file`；`skill_manage` 仍然适用于对仓库内技能的 `patch` 操作，但不适用于 `create`）

## 必需的前置元数据

事实来源：`tools/skill_manager_tool.py::_validate_frontmatter`。硬性要求：

- 以 `---` 作为第一个字节开始（没有前导空行）。
- 在正文之前以 `\n---\n` 结束。
- 解析为 YAML 映射。
- `name` 字段必须存在。
- `description` 字段必须存在，且 ≤ **1024 个字符** (`MAX_DESCRIPTION_LENGTH`)。
- 结束的 `---` 之后必须有非空正文。

`skills/software-development/` 下每个技能使用的、结构一致的格式：

```yaml
---
name: my-skill-name               # 小写，连字符，≤64 字符 (MAX_NAME_LENGTH)
description: 当 <触发条件> 时使用。 <一行行为描述>。
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [short, descriptive, tags]
    related_skills: [other-skill, another-skill]
---
```

`version` / `author` / `license` / `metadata` 不受验证器强制要求，但每个同类技能都有——省略这些会使你的技能显得格格不入。

## 大小限制

- 描述：≤ 1024 个字符（强制）。
- 完整 SKILL.md：≤ 100,000 个字符（作为 `MAX_SKILL_CONTENT_CHARS` 强制执行，约 36k 个 token）。
- `software-development/` 中的同类技能约为 **8-14k 个字符**。力求保持在这个范围内。如果超过 20k，请拆分到 `references/*.md` 中并从 SKILL.md 引用它们。

## 同类匹配结构

每个仓库内技能大致遵循以下结构：

```
# <标题>

## 概述
一到两段话：是什么以及为什么。

## 何时使用
- 项目符号触发条件
- “不要用于：” 反触发条件

## <技能特定主题的章节>
- 快速参考表很常见
- 包含精确命令的代码块
- Hermes 特定的用法示例（通过 scripts/run_tests.sh 运行测试，ui-tui 路径等）

## 常见陷阱
错误及其修复方法的编号列表。

## 验证清单
- [ ] 操作后验证的复选框列表

## 一次性示例（可选）
命名场景 → 具体命令序列。
```

并非每个部分都是必需的，但 `概述` + `何时使用` + 可操作正文 + 陷阱是技能感觉像同类的最低要求。

## 目录放置

```
skills/<category>/<skill-name>/SKILL.md
```

仓库中当前的类别（通过 `ls skills/` 确认）：`autonomous-ai-agents`, `creative`, `data-science`, `devops`, `dogfood`, `email`, `gaming`, `github`, `leisure`, `mcp`, `media`, `mlops/*`, `note-taking`, `productivity`, `red-teaming`, `research`, `smart-home`, `social-media`, `software-development`。

选择最接近的现有类别。不要随意创建新的顶级类别。

## 工作流程

1.  **调查同类**在目标类别中：
    ```
    ls skills/<category>/
    ```
    阅读 2-3 个同类 SKILL.md 文件以匹配语气和结构。
2.  如果不确定，请**检查验证器约束**，查看 `tools/skill_manager_tool.py`。
3.  使用 `write_file` **起草**至 `skills/<category>/<name>/SKILL.md`。
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
5.  在活动分支上 **Git add + commit**。
6.  **注意：** 当前会话的技能加载器已缓存——`skill_view` / `skills_list` 在新会话之前将不会看到新技能。这是预期行为，不是错误。

## 交叉引用其他技能

`metadata.hermes.related_skills` 在加载时会合并两个目录树（仓库内 `skills/` 和 `~/.hermes/skills/`）。你可以从仓库内技能引用用户本地技能，但对于克隆仓库的新用户来说，该引用将无法解析。优先只从仓库内技能引用仓库内技能。如果一个经常被引用的技能只存在于 `~/.hermes/skills/` 中，请考虑将其提升到仓库中。

## 编辑现有仓库内技能

-  **小修复（拼写错误、添加陷阱、收紧触发条件）：** `skill_manage(action='patch', name=..., old_string=..., new_string=...)` 在仓库内技能上运行良好。
-  **重大重写：** 使用 `write_file` 编写整个 SKILL.md。`skill_manage(action='edit')` 也有效，但需要提供完整的新内容。
-  **添加支持文件：** 使用 `write_file` 将文件写入 `skills/<category>/<name>/references/<file>.md`、`templates/<file>` 或 `scripts/<file>`。`skill_manage(action='write_file')` 也有效，并强制执行 references/templates/scripts/assets 子目录的白名单。
-  **始终提交**编辑——仓库内技能是源代码，而不是运行时状态。

## 常见陷阱

1.  **对仓库内技能使用 `skill_manage(action='create')`。** 它会写入 `~/.hermes/skills/`，而不是仓库目录树。使用 `write_file` 在仓库内创建。
2.  **`---` 前的前导空白。** 验证器检查 `content.startswith("---")`；任何前导空行或 BOM 都会导致验证失败。
3.  **描述过于笼统。** 同类描述以“当……时使用”开头，并描述*触发类别*，而非单个任务。“当调试 X 时使用” > “调试 X”。
4.  **忘记 author/license/metadata 块。** 验证器不强制要求，但每个同类技能都有；省略会使技能看起来不完整。
5.  **编写的技能与同类技能重复。** 创建前，请 `ls skills/<category>/` 并打开 2-3 个同类。优先扩展现有技能，而非创建一个狭义的同级技能。
6.  **期望当前会话看到新技能。** 它不会。技能加载器在会话开始时初始化。在新会话中或使用 `skill_view` 通过确切路径进行验证。
7.  **链接到仓库内不存在的技能。** `related_skills: [some-user-local-skill]` 对你有效，但对其他克隆会中断。优先只使用仓库内链接。

## 验证清单

- [ ] 文件位于 `skills/<category>/<name>/SKILL.md`（不在 `~/.hermes/skills/` 中）
- [ ] 前置元数据以 `---` 从字节 0 开始，以 `\n---\n` 结束
- [ ] `name`, `description`, `version`, `author`, `license`, `metadata.hermes.{tags, related_skills}` 全部存在
- [ ] 名称 ≤ 64 个字符，小写 + 连字符
- [ ] 描述 ≤ 1024 个字符，且以“当……时使用”开头
- [ ] 文件总大小 ≤ 100,000 个字符（目标 8-15k）
- [ ] 结构：`# 标题` → `## 概述` → `## 何时使用` → 正文 → `## 常见陷阱` → `## 验证清单`
- [ ] `related_skills` 引用在仓库内可解析（或明确允许是用户本地的）
- [ ] 在目标分支上完成了 `git add skills/<category>/<name>/ && git commit`