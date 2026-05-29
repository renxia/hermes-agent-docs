---
title: "Openclaw 迁移 — 将用户的 OpenClaw 定制化足迹迁移至 Hermes 智能体"
sidebar_label: "Openclaw 迁移"
description: "将用户的 OpenClaw 定制化足迹迁移至 Hermes 智能体"
---

{/* 本页面由网站脚本 scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源 SKILL.md 而非此页面。 */}

# Openclaw 迁移

将用户的 OpenClaw 定制化足迹迁移至 Hermes 智能体。从 ~/.openclaw 导入 Hermes 兼容的记忆、SOUL.md 文件、命令允许列表、用户技能以及选定的工作区资产，然后精确报告哪些内容无法迁移及其原因。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/migration/openclaw-migration` 安装 |
| 路径 | `optional-skills/migration/openclaw-migration` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 (Nous Research) |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `迁移`, `OpenClaw`, `Hermes`, `记忆`, `人格`, `导入` |
| 相关技能 | [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

:::info
以下是 Hermes 加载此技能时看到的完整技能定义。这是智能体在该技能激活时所看到的指令。
:::

# OpenClaw -> Hermes 迁移

当用户希望将其 OpenClaw 设置迁移到 Hermes 智能体，并尽量减少手动清理工作时，使用此技能。

## CLI 命令

要进行快速、非交互式迁移，请使用内置的 CLI 命令：

```bash
hermes claw migrate              # 完整交互式迁移
hermes claw migrate --dry-run    # 预览将要迁移的内容
hermes claw migrate --preset user-data   # 不迁移密钥的迁移
hermes claw migrate --overwrite  # 覆盖现有冲突
hermes claw migrate --source /custom/path/.openclaw  # 自定义源路径
```

CLI 命令运行的是下文描述的相同迁移脚本。当你希望进行交互式、带有干运行预览和逐项冲突解决的迁移时，请使用此技能（通过智能体）。

**首次设置：** `hermes setup` 向导会自动检测 `~/.openclaw` 并在配置开始前提供迁移选项。

## 此技能的功能

它使用 `scripts/openclaw_to_hermes.py` 来：

- 将 `SOUL.md` 导入到 Hermes 主目录作为 `SOUL.md`
- 将 OpenClaw 的 `MEMORY.md` 和 `USER.md` 转换为 Hermes 内存条目
- 将 OpenClaw 的命令批准模式合并到 Hermes 的 `command_allowlist` 中
- 迁移 Hermes 兼容的消息设置，例如 `TELEGRAM_ALLOWED_USERS` 和 `MESSAGING_CWD`
- 将 OpenClaw 技能复制到 `~/.hermes/skills/openclaw-imports/`
- 可选择将 OpenClaw 工作区指令文件复制到指定的 Hermes 工作区
- 镜像兼容的工作区资源，例如将 `workspace/tts/` 复制到 `~/.hermes/tts/`
- 归档那些在 Hermes 中没有直接对应位置的非密钥文档
- 生成一份结构化报告，列出已迁移的项目、冲突、跳过的项目及原因

## 路径解析

辅助脚本位于此技能目录中：

- `scripts/openclaw_to_hermes.py`

当此技能从技能中心安装时，通常的路径是：

- `~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py`

不要猜测更短的路径，例如 `~/.hermes/skills/openclaw-migration/...`。

在运行辅助脚本之前：

1. 优先使用 `~/.hermes/skills/migration/openclaw-migration/` 下的已安装路径。
2. 如果该路径失败，检查已安装的技能目录，并相对于已安装的 `SKILL.md` 来解析脚本。
3. 仅在安装位置缺失或技能被手动移动的情况下，才使用 `find` 作为后备方案。
4. 调用终端工具时，不要传递 `workdir: "~"`。请使用绝对目录，例如用户的主目录，或者完全省略 `workdir`。

使用 `--migrate-secrets` 时，它还会导入一小组 Hermes 兼容的白名单密钥，目前包括：

- `TELEGRAM_BOT_TOKEN`

## 默认工作流程

1.  首先进行干运行检查。
2.  简要总结哪些可以迁移，哪些不能迁移，以及哪些将被归档。
3.  如果 `clarify` 工具可用，请使用它进行用户决策，而不是要求用户提供自由文本回复。
4.  如果干运行发现已导入的技能目录存在冲突，请在执行前询问如何处理这些冲突。
5.  在执行前，要求用户选择两种支持的迁移模式之一。
6.  仅当用户希望将工作区指令文件带过来时，才询问目标工作区路径。
7.  使用匹配的预设和标志执行迁移。
8.  总结结果，特别是：
    -   迁移了什么
    -   哪些被归档以供手动审查
    -   跳过了什么以及原因

## 用户交互协议

Hermes CLI 支持 `clarify` 工具用于交互式提示，但它仅限于：

-   每次一个选择
-   最多 4 个预定义选项
-   一个自动的 `其他` 自由文本选项

它**不**支持单个提示中的真正多选复选框。

对于每次 `clarify` 调用：

-   始终包含一个非空的 `question`
-   仅对真正的可选择提示包含 `choices`
-   将 `choices` 限制为 2-4 个纯字符串选项
-   绝不发出占位符或截断的选项，例如 `...`
-   绝不用额外的空格来填充或装饰选项
-   绝不在问题中包含假的表单字段，例如 `在此输入目录`、用于填充的空行或下划线 `_____`
-   对于开放式路径问题，只提问简单的句子；用户在正常 CLI 提示下面板下方输入答案

如果 `clarify` 调用返回错误，请检查错误文本，修正有效载荷，并使用有效的 `question` 和干净的选项重试一次。

当 `clarify` 可用且干运行揭示任何需要用户决策的项时，你的**下一个动作必须是 `clarify` 工具调用**。
不要以普通的助手消息结束回合，例如：

-   "让我列出选项"
-   "你想怎么做？"
-   "以下是选项"

如果需要用户决策，请在生成更多文本之前通过 `clarify` 收集。
如果存在多个未解决的决策，请不要在它们之间插入解释性的助手消息。在收到一个 `clarify` 响应后，你的下一个动作通常应该是下一个必需的 `clarify` 调用。

每当干运行报告以下情况时，将 `workspace-agents` 视为未解决的决策：
-   `kind="workspace-agents"`
-   `status="skipped"`
-   原因包含 `No workspace target was provided`

在这种情况下，你必须在执行前询问关于工作区指令的问题。不要默默地将其视为跳过该决策。

由于这个限制，使用这个简化的决策流程：

1.  对于 `SOUL.md` 冲突，使用带有以下选项的 `clarify`：
    -   `keep existing`
    -   `overwrite with backup`
    -   `review first`
2.  如果干运行显示一个或多个 `kind="skill"` 项的 `status="conflict"`，使用带有以下选项的 `clarify`：
    -   `keep existing skills`
    -   `overwrite conflicting skills with backup`
    -   `import conflicting skills under renamed folders`
3.  对于工作区指令，使用带有以下选项的 `clarify`：
    -   `skip workspace instructions`
    -   `copy to a workspace path`
    -   `decide later`
4.  如果用户选择复制工作区指令，请提出一个后续的开放式 `clarify` 问题，要求提供一个**绝对路径**。
5.  如果用户选择 `skip workspace instructions` 或 `decide later`，则不带 `--workspace-target` 继续。
6.  对于迁移模式，使用以下 3 个选项的 `clarify`：
    -   `user-data only`
    -   `full compatible migration`
    -   `cancel`
7.  `user-data only` 意味着：迁移用户数据和兼容的配置，但**不**导入白名单中的密钥。
8.  `full compatible migration` 意味着：迁移相同的兼容用户数据，外加存在时的白名单密钥。
9.  如果 `clarify` 不可用，请在普通文本中提出相同的问题，但答案仍然限制为 `user-data only`、`full compatible migration` 或 `cancel`。

执行门控：

-   如果存在因 `No workspace target was provided` 导致的 `workspace-agents` 跳过决策未解决，请不要执行。
-   解决它的唯一有效方式是：
    -   用户明确选择 `skip workspace instructions`
    -   用户明确选择 `decide later`
    -   用户在选择 `copy to a workspace path` 后提供了一个工作区路径
-   干运行中缺少工作区目标本身不是执行的许可。
-   如果任何必需的 `clarify` 决策未解决，请不要执行。

使用以下精确的 `clarify` 有效载荷格式作为默认模式：

-   `{"question":"Your existing SOUL.md conflicts with the imported one. What should I do?","choices":["keep existing","overwrite with backup","review first"]}`
-   `{"question":"One or more imported OpenClaw skills already exist in Hermes. How should I handle those skill conflicts?","choices":["keep existing skills","overwrite conflicting skills with backup","import conflicting skills under renamed folders"]}`
-   `{"question":"Choose migration mode: migrate only user data, or run the full compatible migration including allowlisted secrets?","choices":["user-data only","full compatible migration","cancel"]}`
-   `{"question":"Do you want to copy the OpenClaw workspace instructions file into a Hermes workspace?","choices":["skip workspace instructions","copy to a workspace path","decide later"]}`
-   `{"question":"Please provide an absolute path where the workspace instructions should be copied."}`

## 决策到命令的映射

将用户决策精确映射到命令标志：

-   如果用户为 `SOUL.md` 选择 `keep existing`，则**不**添加 `--overwrite`。
-   如果用户选择 `overwrite with backup`，则添加 `--overwrite`。
-   如果用户选择 `review first`，则在执行前停止并审查相关文件。
-   如果用户选择 `keep existing skills`，则添加 `--skill-conflict skip`。
-   如果用户选择 `overwrite conflicting skills with backup`，则添加 `--skill-conflict overwrite`。
-   如果用户选择 `import conflicting skills under renamed folders`，则添加 `--skill-conflict rename`。
-   如果用户选择 `user-data only`，则使用 `--preset user-data` 执行，并且**不**添加 `--migrate-secrets`。
-   如果用户选择 `full compatible migration`，则使用 `--preset full --migrate-secrets` 执行。
-   仅当用户明确提供了绝对工作区路径时，才添加 `--workspace-target`。
-   如果用户选择 `skip workspace instructions` 或 `decide later`，则不添加 `--workspace-target`。

在执行前，用通俗语言重述确切的命令计划，并确保它与用户的选择相匹配。

## 运行后报告规则

执行后，将脚本的 JSON 输出视为事实来源。

1.  所有计数基于 `report.summary`。
2.  仅当条目的 `status` 为 `migrated` 时，才将其列在“成功迁移”下。
3.  除非报告明确显示该条目为 `migrated`，否则不要声称冲突已解决。
4.  除非报告中 `kind="soul"` 的条目 `status="migrated"`，否则不要声称 `SOUL.md` 被覆盖。
5.  如果 `report.summary.conflict > 0`，应包含冲突部分，而不是暗示成功。
6.  如果计数和列出的条目不一致，需修正列表以匹配报告。
7.  在可用时包含报告中的 `output_dir` 路径，以便用户检查 `report.json`、`summary.md`、备份和归档文件。
8.  对于记忆或用户配置溢出，除非报告明确显示存档路径，否则不要说条目已被归档。如果 `details.overflow_file` 存在，应说明完整的溢出列表已导出到该文件。
9.  如果技能在重命名的文件夹下导入，需报告最终目的地并提及 `details.renamed_from`。
10. 如果存在 `report.skill_conflict_mode`，将其作为导入技能冲突策略的事实来源。
11. 如果条目 `status="skipped"`，不要将其描述为已覆盖、已备份、已迁移或已解决。
12. 如果 `kind="soul"` 的条目 `status="skipped"` 且原因 `Target already matches source`，则说明其未被更改，不要提及备份。
13. 如果重命名的导入技能的 `details.backup` 为空，不要暗示现有的 Hermes 技能已被重命名或备份。仅说明导入的副本已放置在新目的地，并引用 `details.renamed_from` 作为保持不变的预存文件夹。

## 迁移预设

在正常使用中优先使用以下两个预设：

-   `user-data`
-   `full`

`user-data` 包括：

-   `soul`
-   `workspace-agents`
-   `memory`
-   `user-profile`
-   `messaging-settings`
-   `command-allowlist`
-   `skills`
-   `tts-assets`
-   `archive`

`full` 包含 `user-data` 的所有内容，外加：

-   `secret-settings`

辅助脚本仍支持类别级的 `--include` / `--exclude`，但将其视为高级后备方案而非默认用户体验。

## 命令

包含完整发现的试运行：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py
```

使用终端工具时，优先使用绝对调用模式，例如：

```json
{"command":"python3 /home/USER/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py","workdir":"/home/USER"}
```

使用 `user-data` 预设进行试运行：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --preset user-data
```

执行 `user-data` 迁移：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --execute --preset user-data --skill-conflict skip
```

执行完整兼容迁移：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --execute --preset full --migrate-secrets --skill-conflict skip
```

包含工作区指令执行：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --execute --preset user-data --skill-conflict rename --workspace-target "/absolute/workspace/path"
```

默认情况下不要使用 `$PWD` 或主目录作为工作区目标。请先询问明确的工作区路径。

## 重要规则

1.  除非用户明确要求立即执行，否则在写入前运行试运行。
2.  默认不迁移密钥。令牌、认证数据、设备凭据和原始网关配置不应进入 Hermes，除非用户明确要求迁移密钥。
3.  除非用户明确希望覆盖，否则不要静默覆盖非空的 Hermes 目标。启用覆盖时，辅助脚本将保留备份。
4.  始终向用户提供跳过项报告。该报告是迁移的一部分，不是可选附加项。
5.  优先使用主 OpenClaw 工作区（`~/.openclaw/workspace/`），而不是 `workspace.default/`。仅在主文件缺失时才使用默认工作区作为后备。
6.  即使在密钥迁移模式下，也仅迁移目标 Hermes 目录干净的密钥。不支持的认证数据仍必须报告为跳过。
7.  如果试运行显示大量资产复制、冲突的 `SOUL.md` 或溢出的内存条目，请在执行前单独指出。
8.  如果用户不确定，应默认选择 `仅用户数据`。
9.  仅当用户明确提供了目标工作区路径时，才包含 `workspace-agents`。
10. 将类别级的 `--include` / `--exclude` 视为高级逃生通道，而非常规流程。
11. 如果有 `clarify` 可用，不要在试运行总结后以模糊的“您想做什么？”结束。请使用结构化的后续提示。
12. 当真正的选择提示可行时，不要使用开放式 `clarify` 提示。优先使用可选择选项，仅对绝对路径或文件审查请求使用自由文本。
13. 试运行后，如果仍有未解决的决策，绝不能仅在总结后停止。请立即为最高优先级的阻塞决策调用 `clarify`。
14. 后续问题的优先顺序：
    -   `SOUL.md` 冲突
    -   导入的技能冲突
    -   迁移模式
    -   工作区指令目的地
15. 不要承诺稍后在同一消息中呈现选项。应通过实际调用 `clarify` 来呈现它们。
16. 在迁移模式回答后，明确检查 `workspace-agents` 是否仍未解决。如果是，您的下一个操作必须是工作区指令的 `clarify` 调用。
17. 在任何 `clarify` 回答后，如果仍有其他必需的决策，请勿叙述刚刚决定的内容。应立即询问下一个必需的问题。

## 预期结果

成功运行后，用户应获得：

-   已导入的 Hermes 人格状态
-   已填充转换后 OpenClaw 知识的 Hermes 记忆文件
-   位于 `~/.hermes/skills/openclaw-imports/` 下的可用 OpenClaw 技能
-   显示任何冲突、遗漏或不支持数据的迁移报告