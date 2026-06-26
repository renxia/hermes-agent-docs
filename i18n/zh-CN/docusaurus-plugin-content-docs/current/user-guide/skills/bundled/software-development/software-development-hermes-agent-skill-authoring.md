title: "Hermes 智能体技能编写 — 作者在仓库内 SKILL"
sidebar_label: "Hermes 智能体技能编写"
description: "在仓库内编写SKILL"
---

{/* 此页面由网站/脚本/generate-skill-docs.py 从技能的SKILL.md自动生成。请编辑源文件SKILL.md，而不是此页面。 */}

# Hermes 智能体技能编写

在仓库内编写 SKILL.md：前置元数据、验证器、结构。

## 技能元数据

| | |
|---|---|
| Source (来源) | Bundled (默认安装) |
| Path (路径) | `skills/software-development/hermes-agent-skill-authoring` |
| Version (版本) | `1.0.0` |
| Author (作者) | Hermes 智能体 |
| License (许可证) | MIT |
| Platforms (平台) | linux, macos, windows |
| Tags (标签) | `skills`, `authoring`, `hermes-agent`, `conventions`, `skill-md` |
| Related skills (相关技能) | [`plan`](/docs/user-guide/skills/bundled/software-development/software-development-plan), [`requesting-code-review`](/docs/user-guide/skills/bundled/software-development/software-development-requesting-code-review) |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# 编写 Hermes 智能体技能（在仓库内）

## 概述

SKILL.md 可以存在于两个地方：

1. **用户本地 (User-local)：** `~/.hermes/skills/<maybe-category>/<name>/SKILL.md` — 个人使用，不共享。通过 `skill_manage(action='create')` 创建。
2. **仓库内 (In-repo)（本指南关注此情况）：** `/home/bb/hermes-agent/skills/<category>/<name>/SKILL.md` — 已提交，随软件包一起发布。使用 `write_file` + `git add`。`skill_manage(action='create')` 不会针对这个树进行操作。

## 何时使用

- 用户要求你在“此分支/仓库/提交”中添加一个技能
- 你正在提交一个应该随 hermes-agent 一起发布的重用工作流
- 你正在编辑 `/home/bb/hermes-agent/skills/` 下的现有技能（对于小幅修改，使用 `patch`；对于重写，使用 `write_file`；即使是仓库内技能，`skill_manage` 仍然可用于补丁操作，但不能用于创建）

## 所需的前置元数据 (Required Frontmatter)

真相来源：`tools/skill_manager_tool.py::_validate_frontmatter`。硬性要求：

- 必须以 `---` 开头（不得有前导空行）。
- 在正文之前，必须用 `\n---\n` 结束。
- 必须解析为 YAML 地图。
- 必须包含 `name` 字段。
- 必须包含 `description` 字段，≤ **1024 个字符** (`MAX_DESCRIPTION_LENGTH`)。
- 闭合的 `---` 之后必须有非空的正文。

所有位于 `skills/software-development/` 下的技能都遵循以下模式：

```yaml
---
name: my-skill-name               # 小写，使用连字符，≤64 个字符 (MAX_NAME_LENGTH)
description: 当 <trigger> 时使用。 <一行行为描述>。
version: 1.0.0
author: Hermes 智能体
license: MIT
metadata:
  hermes:
    tags: [short, descriptive, tags]
    related_skills: [other-skill, another-skill]
---
```

`version` / `author` / `license` / `metadata` 不由验证器强制执行，但每个技能都包含这些信息——省略它们会让你的技能显得不完整。

## 大小限制

- Description (描述)：≤ 1024 个字符（已强制）。
- Full SKILL.md (完整文件)：≤ 100,000 个字符（已强制为 `MAX_SKILL_CONTENT_CHARS`，约 36k tokens）。
- `software-development/` 下的同类技能大小约为 **8-14k 字符**。请瞄准这个范围。如果你超过 20k，请拆分成 `references/*.md` 并从 SKILL.md 中引用它们。

## 同类匹配结构 (Peer-Matched Structure)

每个仓库内的技能大致遵循以下结构：

```
# <标题>

## 概述
一到两段文字：是什么以及为什么。

## 何时使用
- 要触发的要点列表
- “不应用于”的反向触发器

## <特定于该技能的主题部分>
- 快速参考表很常见
- 包含精确命令的代码块
- Hermes 特定的配方（通过 scripts/run_tests.sh 测试，ui-tui 路径等）

## 常见陷阱 (Common Pitfalls)
对错误及其修复的编号列表。

## 验证清单 (Verification Checklist)
- [ ] 后续操作的复查清单

## 一次性配方 (One-Shot Recipes)（可选）
命名的场景 → 具体命令序列。
```

并非所有部分都是强制性的，但要包含 `概述` + `何时使用` + 可操作的正文 + 陷阱，才能让该技能感觉像是一个同类产品。

## 目录放置 (Directory Placement)

```
skills/<category>/<skill-name>/SKILL.md
```

当前仓库中的类别（使用 `ls skills/` 进行确认）：`autonomous-ai-agents`, `creative`, `data-science`, `devops`, `dogfood`, `email`, `gaming`, `github`, `leisure`, `mcp`, `media`, `mlops/*`, `note-taking`, `productivity`, `red-teaming`, `research`, `smart-home`, `social-media`, `software-development`。

选择最接近的现有类别。不要随意发明新的顶级类别。

## 工作流程 (Workflow)

1. **调查同类技能：**
   ```
   ls skills/<category>/
   ```
   阅读 2-3 个同类 SKILL.md 文件以匹配语气和结构。
2. **检查验证器约束**（如果不确定，请查看 `tools/skill_manager_tool.py`）。
3. 使用 `write_file` 草拟到 `skills/<category>/<name>/SKILL.md`。
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
5. **在活动分支上执行 Git add + commit。**
6. **注意：** 当前会话的技能加载器是缓存的——直到新的会话，`skill_view` / `skills_list` 都不会看到新技能。这是预期的行为，而不是错误。

## 交叉引用其他技能 (Cross-Referencing Other Skills)

`metadata.hermes.related_skills` 在加载时合并了两个树（仓库内的 `skills/` 和用户本地的 `~/.hermes/skills/`）。你可以从一个仓库内技能引用一个用户本地技能，但这对于克隆了仓库的用户来说是无法解析的。优先只在仓库内技能之间进行引用。如果某个经常被引用的技能只存在于 `~/.hermes/skills/` 中，请考虑将其提升到仓库中。

## 编辑现有仓库内技能 (Editing Existing In-Repo Skills)

- **小幅修复**（拼写错误、添加陷阱、收紧触发器）：对仓库内技能使用 `skill_manage(action='patch', name=..., old_string=..., new_string=...)` 是完全可行的。
- **重大重写：** 对整个 SKILL.md 使用 `write_file`。`skill_manage(action='edit')` 也可以，但这需要提供完整的全新内容。
- **添加支持文件：** 对 `skills/<category>/<name>/references/<file>.md`、`templates/<file>` 或 `scripts/<file>` 使用 `write_file`。`skill_manage(action='write_file')` 也有效，并且会强制执行 references/templates/scripts/assets 子目录的白名单限制。
- **务必提交**编辑内容——仓库内技能是源头，而不是运行时状态。

## 常见陷阱 (Common Pitfalls)

1. **对仓库内技能使用 `skill_manage(action='create')`。** 它会写入 `~/.hermes/skills/`，而不是写入仓库树。对于仓库内创建，请使用 `write_file`。
2. **`---` 之前的前导空白字符。** 验证器检查 `content.startswith("---")`；任何前导空行或 BOM（字节顺序标记）都会导致验证失败。
3. **描述过于笼统。** 同类技能的描述都以“当...时使用”开头，并描述*触发类别*，而不是单个任务。“调试 X 时使用” > “Debug X”。
4. **忘记作者/许可证/元数据块。** 虽然不是验证器强制要求的，但每个同类技能都有，省略它会让该技能看起来未完成。
5. **编写重复现有同类技能的技能。** 在创建之前，请运行 `ls skills/<category>/` 并打开 2-3 个同类技能进行参考。优先扩展一个现有技能，而不是创建一个狭窄的兄弟技能。
6. **期望当前会话能看到新技能。** 是不能的。技能加载器是在会话开始时初始化的。请在一个新的会话中或通过使用精确路径的 `skill_view` 进行验证。
7. **链接到不存在于仓库内的技能。** `related_skills: [some-user-local-skill]` 对你有效，但对于其他克隆者来说是错误的。优先只进行仓库内引用。

## 验证清单 (Verification Checklist)

- [ ] 文件位于 `skills/<category>/<name>/SKILL.md`（不在 `~/.hermes/skills/` 中）
- [ ] 前置元数据以字节 0 开始，包含 `---`，并以 `\n---\n` 结束
- [ ] `name`, `description`, `version`, `author`, `license`, `metadata.hermes.{tags, related_skills}` 都存在
- [ ] 名称 ≤ 64 个字符，小写+连字符
- [ ] 描述 ≤ 1024 个字符，并以“当...时使用”开头
- [ ] 文件总大小 ≤ 100,000 个字符（目标是 8-15k）
- [ ] 结构：`# 标题` → `## 概述` → `## 何时使用` → 正文 → `## 常见陷阱` → `## 验证清单`
- [ ] `related_skills` 的引用在仓库内可解析（或明确允许为用户本地）
- [ ] 已在目标分支上完成 `git add skills/<category>/<name>/ && git commit`