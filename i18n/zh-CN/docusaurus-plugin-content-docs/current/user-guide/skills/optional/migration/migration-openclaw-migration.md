---
title: "Openclaw迁移 — 将用户的OpenClaw定制化配置迁移至Hermes智能体"
sidebar_label: "Openclaw迁移"
description: "将用户的OpenClaw定制化配置迁移至Hermes智能体"
---

{/* 本页面由网站脚本 `website/scripts/generate-skill-docs.py` 根据技能的 `SKILL.md` 自动生成。请编辑源文件 `SKILL.md`，而非本页面。 */}

# Openclaw迁移

将用户的OpenClaw定制化配置迁移至Hermes智能体。从 `~/.openclaw` 导入Hermes兼容的记忆数据、SOUL.md文件、命令允许列表、用户技能以及选定的工作空间资源，然后精确报告无法迁移的内容及其原因。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/migration/openclaw-migration` 安装 |
| 路径 | `optional-skills/migration/openclaw-migration` |
| 版本 | `1.0.0` |
| 作者 | Hermes智能体 (Nous Research) |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `迁移`, `OpenClaw`, `Hermes`, `记忆`, `人格`, `导入` |
| 相关技能 | [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

:::info
以下是 Hermes 加载此技能时的完整技能定义。这是智能体在该技能激活时所看到的指令。
:::

# OpenClaw -> Hermes 迁移

当用户希望将他们的 OpenClaw 设置迁移至 Hermes 智能体，并尽量减少手动清理工作时，请使用此技能。

## CLI 命令

若要进行快速、非交互式的迁移，请使用内置的 CLI 命令：

```bash
hermes claw migrate              # 完整的交互式迁移
hermes claw migrate --dry-run    # 预览将要迁移的内容
hermes claw migrate --preset user-data   # 不包含密钥的迁移
hermes claw migrate --overwrite  # 覆盖现有的冲突
hermes claw migrate --source /custom/path/.openclaw  # 自定义源路径
```

此 CLI 命令运行与下文描述的相同迁移脚本。当你希望进行带有 dry-run 预览和逐项冲突解决的交互式引导迁移时，请使用此技能（通过智能体）。

**首次设置：** `hermes setup` 向导会自动检测 `~/.openclaw` 并在配置开始前提供迁移选项。

## 此技能的功能

它使用 `scripts/openclaw_to_hermes.py` 来：

- 将 `SOUL.md` 导入到 Hermes 主目录，命名为 `SOUL.md`
- 将 OpenClaw 的 `MEMORY.md` 和 `USER.md` 转换为 Hermes 记忆条目
- 将 OpenClaw 的命令批准模式合并到 Hermes 的 `command_allowlist` 中
- 迁移 Hermes 兼容的消息设置，例如 `TELEGRAM_ALLOWED_USERS` 和 `MESSAGING_CWD`
- 将 OpenClaw 技能复制到 `~/.hermes/skills/openclaw-imports/`
- 可选地将 OpenClaw 工作区指令文件复制到选定的 Hermes 工作区
- 镜像兼容的工作区资产，例如将 `workspace/tts/` 复制到 `~/.hermes/tts/`
- 归档没有直接 Hermes 目标的非密钥文档
- 生成结构化报告，列出已迁移项目、冲突、跳过的项目及原因

## 路径解析

辅助脚本位于此技能目录中：

- `scripts/openclaw_to_hermes.py`

当此技能从技能中心安装时，正常位置是：

- `~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py`

不要猜测更短的路径，例如 `~/.hermes/skills/openclaw-migration/...`。

在运行辅助脚本之前：

1. 优先使用 `~/.hermes/skills/migration/openclaw-migration/` 下的已安装路径。
2. 如果该路径失败，请检查已安装的技能目录，并相对于已安装的 `SKILL.md` 解析脚本路径。
3. 仅在已安装位置缺失或技能被手动移动时，才将 `find` 作为后备方案使用。
4. 调用终端工具时，不要传递 `workdir: "~"`。请使用绝对目录，例如用户的主目录，或者完全省略 `workdir`。

使用 `--migrate-secrets` 时，它还将导入一小部分允许列表中、Hermes 兼容的密钥，目前包括：

- `TELEGRAM_BOT_TOKEN`

## 默认工作流程

1. 首先使用 dry run 进行检查。
2. 呈现一个简单的摘要，说明哪些内容可以迁移，哪些不能，以及哪些将被归档。
3. 如果 `clarify` 工具可用，请使用它来让用户做出决策，而不是要求用户进行自由文本回复。
4. 如果 dry run 发现导入的技能目录冲突，请在执行前询问如何处理这些冲突。
5. 在执行前，要求用户在两种支持的迁移模式之间进行选择。
6. 仅在用户需要迁移工作区指令文件时，才询问目标工作区路径。
7. 使用匹配的预设和标志执行迁移。
8. 总结结果，特别是：
   - 迁移了什么
   - 什么被归档以供手动审查
   - 什么被跳过了以及原因

## 用户交互协议

Hermes CLI 支持用于交互式提示的 `clarify` 工具，但它仅限于：

- 每次一个选择
- 最多 4 个预定义选项
- 一个自动的 `Other` 自由文本选项

它**不**支持单个提示中的真正多选复选框。

对于每次 `clarify` 调用：

- 始终包含一个非空的 `question`
- 仅在真正的可选提示中包含 `choices`
- 将 `choices` 限制为 2-4 个纯字符串选项
- 绝不发出占位符或截断的选项，例如 `...`
- 绝不使用额外空白来填充或美化选项
- 绝不在问题中包含假表单字段，例如 `在此处输入目录`、用于填写的空行或下划线 `_____`
- 对于开放式路径问题，只询问简单句子；用户在面板下方的正常 CLI 提示处输入

如果 `clarify` 调用返回错误，请检查错误文本，修正有效载荷，并用有效的 `question` 和简洁的选项重试一次。

当 `clarify` 可用且 dry run 显示任何需要用户决策的项目时，你的**下一个动作必须是 `clarify` 工具调用**。
不要以普通的助手消息结束该轮，例如：

- "让我展示选项"
- "你想做什么？"
- "以下是选项"

如果需要用户决策，请在产生更多文本之前通过 `clarify` 收集它。
如果存在多个未解决的决策，请不要在它们之间插入解释性的助手消息。收到一个 `clarify` 响应后，你的下一个动作通常应该是下一个所需的 `clarify` 调用。

只要 dry run 报告了以下情况，就将 `workspace-agents` 视为未解决的决策：

- `kind="workspace-agents"`
- `status="skipped"`
- 原因包含 `No workspace target was provided`

在这种情况下，你必须在执行前询问工作区指令。不要将其静默视为跳过决策。

由于该限制，请使用此简化的决策流程：

1. 对于 `SOUL.md` 冲突，使用带有以下选项的 `clarify`：
   - `keep existing`
   - `overwrite with backup`
   - `review first`
2. 如果 dry run 显示一个或多个 `kind="skill"` 项且 `status="conflict"`，使用带有以下选项的 `clarify`：
   - `keep existing skills`
   - `overwrite conflicting skills with backup`
   - `import conflicting skills under renamed folders`
3. 对于工作区指令，使用带有以下选项的 `clarify`：
   - `skip workspace instructions`
   - `copy to a workspace path`
   - `decide later`
4. 如果用户选择复制工作区指令，请提出一个后续的开放式 `clarify` 问题，要求提供一个**绝对路径**。
5. 如果用户选择 `skip workspace instructions` 或 `decide later`，则不带 `--workspace-target` 继续。
6. 对于迁移模式，使用这 3 个选项的 `clarify`：
   - `user-data only`
   - `full compatible migration`
   - `cancel`
7. `user-data only` 意味着：迁移用户数据和兼容配置，但**不**导入允许列表中的密钥。
8. `full compatible migration` 意味着：迁移相同的兼容用户数据，外加允许列表中存在时的密钥。
9. 如果 `clarify` 不可用，请在普通文本中提出相同问题，但仍然将答案限制为 `user-data only`、`full compatible migration` 或 `cancel`。

执行门控：

- 当因 `No workspace target was provided` 导致的 `workspace-agents` 跳过仍未解决时，不要执行。
- 解决它的唯一有效方式是：
  - 用户明确选择 `skip workspace instructions`
  - 用户明确选择 `decide later`
  - 用户在选择 `copy to a workspace path` 后提供一个工作区路径
- dry run 中缺少工作区目标本身并非执行许可。
- 当任何所需的 `clarify` 决策仍未解决时，不要执行。

使用以下精确的 `clarify` 有效载荷形状作为默认模式：

- `{"question":"Your existing SOUL.md conflicts with the imported one. What should I do?","choices":["keep existing","overwrite with backup","review first"]}`
- `{"question":"One or more imported OpenClaw skills already exist in Hermes. How should I handle those skill conflicts?","choices":["keep existing skills","overwrite conflicting skills with backup","import conflicting skills under renamed folders"]}`
- `{"question":"Choose migration mode: migrate only user data, or run the full compatible migration including allowlisted secrets?","choices":["user-data only","full compatible migration","cancel"]}`
- `{"question":"Do you want to copy the OpenClaw workspace instructions file into a Hermes workspace?","choices":["skip workspace instructions","copy to a workspace path","decide later"]}`
- `{"question":"Please provide an absolute path where the workspace instructions should be copied."}`

## 决策到命令的映射

将用户决策精确映射到命令标志：

- 如果用户为 `SOUL.md` 选择 `keep existing`，则**不要**添加 `--overwrite`。
- 如果用户选择 `overwrite with backup`，则添加 `--overwrite`。
- 如果用户选择 `review first`，则在执行前停止并审查相关文件。
- 如果用户为技能冲突选择 `keep existing skills`，则添加 `--skill-conflict skip`。
- 如果用户选择 `overwrite conflicting skills with backup`，则添加 `--skill-conflict overwrite`。
- 如果用户选择 `import conflicting skills under renamed folders`，则添加 `--skill-conflict rename`。
- 如果用户选择 `user-data only`，则使用 `--preset user-data` 执行，并**不**添加 `--migrate-secrets`。
- 如果用户选择 `full compatible migration`，则使用 `--preset full --migrate-secrets` 执行。
- 仅在用户明确提供了绝对工作区路径时才添加 `--workspace-target`。
- 如果用户选择 `skip workspace instructions` 或 `decide later`，则不添加 `--workspace-target`。

执行前，请用平实的语言重述确切的命令计划，并确保它与用户的选择匹配。

```markdown
---
title: "OpenClaw 迁移到 Hermes"
description: "将 OpenClaw 的数据、技能和配置迁移到 Hermes 的详细指南。"
slug: "openclaw-migration"
---

## 迁移后报告规则

执行后，将脚本的 JSON 输出作为事实来源。

1.  所有计数均基于 `report.summary`。
2.  只有当项目的 `status` 确切为 `migrated` 时，才将其列在"已成功迁移"下。
3.  除非报告显示该项目为 `migrated`，否则不得声称冲突已解决。
4.  除非 `kind="soul"` 的报告项目 `status="migrated"`，否则不得说 `SOUL.md` 被覆盖。
5.  如果 `report.summary.conflict > 0`，则应包含一个冲突部分，而不是暗指成功。
6.  如果计数与列出的项目不符，请在回复前修正列表以匹配报告。
7.  包含报告中可用的 `output_dir` 路径，以便用户检查 `report.json`、`summary.md`、备份和归档文件。
8.  对于内存或用户配置文件溢出，除非报告显示了明确的归档路径，否则不得说条目已归档。如果存在 `details.overflow_file`，请说明完整的溢出列表已导出到那里。
9.  如果技能在重命名的文件夹下导入，请报告最终目的地并提及 `details.renamed_from`。
10. 如果存在 `report.skill_conflict_mode`，请将其作为已选导入技能冲突策略的事实来源。
11. 如果项目 `status="skipped"`，则不得将其描述为已覆盖、已备份、已迁移或已解决。
12. 如果 `kind="soul"` 的 `status="skipped"` 原因为 `Target already matches source`，请说明其保持不变，并且不要提及备份。
13. 如果重命名的导入技能的 `details.backup` 为空，不得暗示现有的 Hermes 技能被重命名或备份。只需说明导入的副本被放置在新目标位置，并引用 `details.renamed_from` 作为保持不变的预先存在的文件夹。

## 迁移预设

正常情况下优先使用以下两个预设：

- `user-data`
- `full`

`user-data` 包括：

- `soul`（灵魂）
- `workspace-agents`（工作区智能体）
- `memory`（记忆）
- `user-profile`（用户配置文件）
- `messaging-settings`（消息设置）
- `command-allowlist`（命令允许列表）
- `skills`（技能）
- `tts-assets`（文本转语音资源）
- `archive`（归档）

`full` 包括 `user-data` 中的所有内容，外加：

- `secret-settings`（秘密设置）

辅助脚本仍然支持类别级别的 `--include` / `--exclude`，但应将其视为高级后备方案，而非默认用户体验。

## 命令

包含完整发现的模拟运行：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py
```

使用终端工具时，优先使用绝对调用模式，例如：

```json
{"command":"python3 /home/USER/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py","workdir":"/home/USER"}
```

使用 `user-data` 预设进行模拟运行：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --preset user-data
```

执行 `user-data` 迁移：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --execute --preset user-data --skill-conflict skip
```

执行完全兼容的迁移：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --execute --preset full --migrate-secrets --skill-conflict skip
```

执行包含工作区指令的迁移：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --execute --preset user-data --skill-conflict rename --workspace-target "/absolute/workspace/path"
```

默认情况下，请勿将 `$PWD` 或主目录用作工作区目标。首先请询问明确的工作区路径。

## 重要规则

1.  除非用户明确要求立即执行，否则在写入前先进行模拟运行。
2.  默认情况下不要迁移秘密。令牌、授权信息、设备凭据和原始网关配置应保留在 Hermes 之外，除非用户明确要求迁移秘密。
3.  除非用户明确希望覆盖非空的 Hermes 目标，否则不要静默覆盖。当启用覆盖时，辅助脚本将保留备份。
4.  始终向用户提供跳过项目报告。该报告是迁移的一部分，而非可选附加项。
5.  优先使用主 OpenClaw 工作区 (`~/.openclaw/workspace/`) 而非 `workspace.default/`。仅当主文件缺失时才使用默认工作区作为后备。
6.  即使在秘密迁移模式下，也仅迁移拥有干净 Hermes 目标的秘密。仍需将不支持的授权信息报告为已跳过。
7.  如果模拟运行显示有大量资源复制、冲突的 `SOUL.md` 或溢出的内存条目，请在执行前单独指出。
8.  如果用户不确定，请默认为 `仅 user-data`。
9.  仅在用户明确提供了目标工作区路径时才包含 `workspace-agents`。
10. 将类别级别的 `--include` / `--exclude` 视为高级逃生通道，而非正常流程。
11. 如果存在 `clarify`（澄清）选项，不要以模糊的"您想做什么？"结束模拟运行摘要。请使用结构化的后续提示。
12. 当有真正的选择提示可用时，不要使用开放式 `clarify` 提示。优先使用可选选项，仅对绝对路径或文件审查请求使用自由文本。
13. 模拟运行后，如果存在未解决的决策，切勿在总结后停止。立即对最高优先级的阻塞决策使用 `clarify`。
14. 后续问题的优先顺序：
    - `SOUL.md` 冲突
    - 导入技能冲突
    - 迁移模式
    - 工作区指令目标
15. 不要在同一消息中承诺稍后呈现选项。通过实际调用 `clarify` 来呈现它们。
16. 在迁移模式问题之后，明确检查 `workspace-agents` 是否仍未解决。如果是，您的下一步操作必须是工作区指令的 `clarify` 调用。
17. 在任何 `clarify` 回答之后，如果仍有其他需要的决策，请勿叙述刚刚决定的内容。立即询问下一个需要的问题。

## 预期结果

成功运行后，用户应拥有：

- 导入的 Hermes 人格状态
- 填充了转换后的 OpenClaw 知识的 Hermes 记忆文件
- 位于 `~/.hermes/skills/openclaw-imports/` 下的可用 OpenClaw 技能
- 一份显示任何冲突、遗漏或不支持数据的迁移报告
```