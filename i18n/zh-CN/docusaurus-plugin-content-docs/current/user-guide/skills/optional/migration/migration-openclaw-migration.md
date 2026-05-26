---
title: "Openclaw迁移 — 将用户的OpenClaw自定义配置迁移至Hermes智能体"
sidebar_label: "Openclaw迁移"
description: "将用户的OpenClaw自定义配置迁移至Hermes智能体"
---

{/* 本页面由网站脚本scripts/generate-skill-docs.py根据技能的SKILL.md文件自动生成。请编辑源文件SKILL.md，而非此页面。 */}

# Openclaw迁移

将用户的OpenClaw自定义配置迁移至Hermes智能体。从~/.openclaw目录导入兼容Hermes的记忆体、SOUL.md文件、命令白名单、用户技能及选定的工作区资产，并精确报告无法迁移的内容及其原因。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过`hermes skills install official/migration/openclaw-migration`安装 |
| 路径 | `optional-skills/migration/openclaw-migration` |
| 版本 | `1.0.0` |
| 作者 | Hermes智能体（Nous Research） |
| 许可 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `迁移`, `OpenClaw`, `Hermes`, `记忆`, `人格`, `导入` |
| 相关技能 | [`hermes智能体`](/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

:::info
以下是在触发此技能时Hermes加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# OpenClaw -> Hermes 迁移

当用户想要将OpenClaw设置迁移到Hermes智能体中，且只需最少的手动清理时，使用此技能。

## CLI 命令

要进行快速、非交互式的迁移，使用内置的CLI命令：

```bash
hermes claw migrate              # 完整的交互式迁移
hermes claw migrate --dry-run    # 预览将要迁移的内容
hermes claw migrate --preset user-data   # 不含机密数据的迁移
hermes claw migrate --overwrite  # 覆盖现有冲突
hermes claw migrate --source /custom/path/.openclaw  # 自定义源路径
```

CLI命令运行与下面描述的相同的迁移脚本。当你想要交互式、有指导的迁移，包含预览和逐项冲突解决时，使用此技能（通过智能体）。

**首次设置：** `hermes setup`向导会自动检测`~/.openclaw`并在配置开始前提供迁移选项。

## 此技能的功能

它使用`scripts/openclaw_to_hermes.py`来：

- 将`SOUL.md`导入到Hermes主目录中作为`SOUL.md`
- 将OpenClaw的`MEMORY.md`和`USER.md`转换为Hermes记忆条目
- 将OpenClaw命令审批模式合并到Hermes的`command_allowlist`中
- 迁移兼容的Hermes消息设置，如`TELEGRAM_ALLOWED_USERS`和`MESSAGING_CWD`
- 将OpenClaw技能复制到`~/.hermes/skills/openclaw-imports/`
- 可选择将OpenClaw工作空间指令文件复制到选定的Hermes工作空间
- 镜像兼容的工作空间资源，如`workspace/tts/`到`~/.hermes/tts/`
- 归档没有直接Hermes对应位置的非机密文档
- 生成一份结构化报告，列出已迁移的项目、冲突、跳过的项目及原因

## 路径解析

辅助脚本位于此技能目录中：

- `scripts/openclaw_to_hermes.py`

当此技能从Skills Hub安装时，通常的位置是：

- `~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py`

不要猜测更短的路径，如`~/.hermes/skills/openclaw-migration/...`。

在运行辅助脚本之前：

1. 优先使用已安装的路径`~/.hermes/skills/migration/openclaw-migration/`。
2. 如果该路径失败，检查已安装的技能目录并相对于已安装的`SKILL.md`解析脚本。
3. 仅在已安装位置缺失或技能被手动移动时才使用`find`作为备选方案。
4. 调用终端工具时，不要传递`workdir: "~"`。使用绝对目录，如用户的主目录，或完全省略`workdir`。

使用`--migrate-secrets`时，它还会导入一个小型白名单的Hermes兼容机密，目前包括：

- `TELEGRAM_BOT_TOKEN`

## 默认工作流程

1. 先通过预运行进行检查。
2. 呈现一个简单的摘要，说明可以迁移的内容、不能迁移的内容以及将要归档的内容。
3. 如果`clarify`工具可用，用它来处理用户决策，而不是请求自由文本回复。
4. 如果预运行发现导入的技能目录冲突，在执行前询问如何处理。
5. 在执行前，询问用户选择两种支持的迁移模式之一。
6. 仅在用户希望将工作空间指令文件带过来时，才询问目标工作空间路径。
7. 使用匹配的预设和标志执行迁移。
8. 总结结果，特别是：
   - 已迁移的内容
   - 已归档待手动审查的内容
   - 跳过的内容及原因

## 用户交互协议

Hermes CLI支持`clarify`工具进行交互式提示，但它仅限于：

- 一次一个选择
- 最多4个预定义选项
- 一个自动的`Other`自由文本选项

它**不**支持单次提示中的真正多选复选框。

对于每次`clarify`调用：

- 始终包含非空的`question`
- 仅在真正的可选择提示中包含`choices`
- 将`choices`保持为2-4个纯字符串选项
- 永远不要发出占位符或截断的选项，如`...`
- 永远不要用额外的空格填充或美化选项
- 永远不要在问题中包含虚假的表单字段，如`enter directory here`、用于填充的空行或下划线`_____`
- 对于开放式路径问题，只问简单的句子；用户在面板下方的正常CLI提示中输入

如果`clarify`调用返回错误，检查错误文本，修正有效载荷，并用有效的`question`和干净的选项重试一次。

当`clarify`可用且预运行发现任何需要用户决策的情况时，你的**下一个动作必须是`clarify`工具调用**。
不要以正常的助手消息结束回合，例如：

- "让我展示选项"
- "你想做什么？"
- "以下是选项"

如果需要用户决策，通过`clarify`收集后再生成更多文本。
如果有多个未解决的决策，不要在它们之间插入解释性助手消息。收到一个`clarify`响应后，你的下一个动作通常是下一个需要的`clarify`调用。

当预运行报告以下情况时，将`workspace-agents`视为未解决的决策：

- `kind="workspace-agents"`
- `status="skipped"`
- 原因包含`No workspace target was provided`

在这种情况下，你必须在执行前询问工作空间指令。不要默默将其视为跳过的决策。

由于此限制，使用此简化决策流程：

1. 对于`SOUL.md`冲突，使用带以下选项的`clarify`：
   - `keep existing`
   - `overwrite with backup`
   - `review first`
2. 如果预运行显示一个或多个`kind="skill"`项且`status="conflict"`，使用带以下选项的`clarify`：
   - `keep existing skills`
   - `overwrite conflicting skills with backup`
   - `import conflicting skills under renamed folders`
3. 对于工作空间指令，使用带以下选项的`clarify`：
   - `skip workspace instructions`
   - `copy to a workspace path`
   - `decide later`
4. 如果用户选择复制工作空间指令，询问一个后续的开放式`clarify`问题，请求提供**绝对路径**。
5. 如果用户选择`skip workspace instructions`或`decide later`，在没有`--workspace-target`的情况下继续。
5. 对于迁移模式，使用以下3个选项的`clarify`：
   - `user-data only`
   - `full compatible migration`
   - `cancel`
6. `user-data only`表示：仅迁移用户数据和兼容配置，但**不**导入白名单机密。
7. `full compatible migration`表示：迁移相同的兼容用户数据加上白名单机密（如果存在）。
8. 如果`clarify`不可用，在正常文本中询问相同的问题，但仍然将答案限制为`user-data only`、`full compatible migration`或`cancel`。

执行门控：

- 当因`No workspace target was provided`导致的`workspace-agents`跳过仍未解决时，不要执行。
- 解决它的唯一有效方式是：
  - 用户明确选择`skip workspace instructions`
  - 用户明确选择`decide later`
  - 用户在选择`copy to a workspace path`后提供工作空间路径
- 预运行中缺少工作空间目标本身不是执行的许可。
- 当任何需要的`clarify`决策仍未解决时，不要执行。

使用这些确切的`clarify`有效载荷形状作为默认模式：

- `{"question":"Your existing SOUL.md conflicts with the imported one. What should I do?","choices":["keep existing","overwrite with backup","review first"]}`
- `{"question":"One or more imported OpenClaw skills already exist in Hermes. How should I handle those skill conflicts?","choices":["keep existing skills","overwrite conflicting skills with backup","import conflicting skills under renamed folders"]}`
- `{"question":"Choose migration mode: migrate only user data, or run the full compatible migration including allowlisted secrets?","choices":["user-data only","full compatible migration","cancel"]}`
- `{"question":"Do you want to copy the OpenClaw workspace instructions file into a Hermes workspace?","choices":["skip workspace instructions","copy to a workspace path","decide later"]}`
- `{"question":"Please provide an absolute path where the workspace instructions should be copied."}`

## 决策到命令的映射

将用户决策准确映射到命令标志：

- 如果用户为`SOUL.md`选择`keep existing`，则**不**添加`--overwrite`。
- 如果用户选择`overwrite with backup`，添加`--overwrite`。
- 如果用户选择`review first`，在执行前停止并审查相关文件。
- 如果用户选择`keep existing skills`，添加`--skill-conflict skip`。
- 如果用户选择`overwrite conflicting skills with backup`，添加`--skill-conflict overwrite`。
- 如果用户选择`import conflicting skills under renamed folders`，添加`--skill-conflict rename`。
- 如果用户选择`user-data only`，使用`--preset user-data`执行且**不**添加`--migrate-secrets`。
- 如果用户选择`full compatible migration`，使用`--preset full --migrate-secrets`执行。
- 仅当用户明确提供了绝对工作空间路径时才添加`--workspace-target`。
- 如果用户选择`skip workspace instructions`或`decide later`，不添加`--workspace-target`。

在执行前，用简单的语言重述确切的命令计划，并确保它与用户的选择匹配。

## 运行后报告规则

执行完成后，将脚本的 JSON 输出作为事实来源。

1. 所有计数均基于 `report.summary`。
2. 仅在其 `status` 恰好为 `migrated` 时，才将某项列于“成功迁移”下。
3. 除非报告将该项目显示为 `migrated`，否则不得声称冲突已解决。
4. 除非 `kind="soul"` 的项目 `status="migrated"`，否则不得声称 `SOUL.md` 已被覆盖。
5. 如果 `report.summary.conflict > 0`，应包含一个冲突部分，而不是默默暗示成功。
6. 如果计数与列出的项目不一致，请在回复前修正列表以匹配报告。
7. 报告可用时，请包含 `output_dir` 路径，以便用户检查 `report.json`、`summary.md`、备份和归档文件。
8. 对于内存或用户配置文件溢出，除非报告明确显示归档路径，否则不要说条目已被归档。如果 `details.overflow_file` 存在，请说明完整的溢出列表已导出到该处。
9. 如果技能在重命名的文件夹下导入，请报告最终目标位置，并提及 `details.renamed_from`。
10. 如果 `report.skill_conflict_mode` 存在，请将其作为所选导入技能冲突策略的事实来源。
11. 如果某项目 `status="skipped"`，请勿将其描述为已覆盖、已备份、已迁移或已解决。
12. 如果 `kind="soul"` 的 `status="skipped"` 且原因为 `Target already matches source`，请说明它保持不变，并且不要提及备份。
13. 如果重命名的导入技能的 `details.backup` 为空，请勿暗示现有的 Hermes 技能已被重命名或备份。仅说明导入的副本已放置在新目标位置，并将 `details.renamed_from` 引用为保留在原位的预先存在的文件夹。

## 迁移预设

在正常使用中，优先使用以下两个预设：

- `user-data`
- `full`

`user-data` 包括：

- `soul`
- `workspace-agents`
- `memory`
- `user-profile`
- `messaging-settings`
- `command-allowlist`
- `skills`
- `tts-assets`
- `archive`

`full` 包括 `user-data` 中的所有内容，外加：

- `secret-settings`

辅助脚本仍然支持类别级别的 `--include` / `--exclude`，但将其视为高级后备方案，而非默认用户体验。

## 命令

进行完整发现的模拟运行：

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

执行完整兼容迁移：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --execute --preset full --migrate-secrets --skill-conflict skip
```

包含工作区指令执行迁移：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --execute --preset user-data --skill-conflict rename --workspace-target "/absolute/workspace/path"
```

默认情况下，请勿使用 `$PWD` 或主目录作为工作区目标。请先要求提供明确的工作区路径。

## 重要规则

1. 除非用户明确要求立即执行，否则在写入前请进行模拟运行。
2. 默认情况下不要迁移密钥。令牌、认证数据块、设备凭据和原始网关配置不应进入 Hermes，除非用户明确要求迁移密钥。
3. 除非用户明确希望，否则请勿静默覆盖非空的 Hermes 目标。当覆盖启用时，辅助脚本将保留备份。
4. 始终向用户提供跳过项报告。该报告是迁移的一部分，而非可选附加项。
5. 优先使用主 OpenClaw 工作区 (`~/.openclaw/workspace/`) 而非 `workspace.default/`。仅当主文件缺失时才将默认工作区作为后备。
6. 即使在密钥迁移模式下，也仅迁移具有干净 Hermes 目标的密钥。不支持的认证数据块仍需报告为跳过。
7. 如果模拟运行显示有大量资产复制、冲突的 `SOUL.md` 或内存条目溢出，请在执行前单独指出。
8. 如果用户不确定，请默认为 `仅 user-data`。
9. 仅当用户明确提供了目标工作区路径时，才包含 `workspace-agents`。
10. 将类别级别的 `--include` / `--exclude` 视为高级应急手段，而非常规流程。
11. 如果 `clarify` 可用，请勿以模糊的“您想做什么？”结束模拟运行摘要。请改用结构化的后续提示。
12. 当真正的选择提示有效时，请勿使用开放式 `clarify` 提示。优先使用可选择选项，然后才为绝对路径或文件审阅请求提供自由文本。
13. 模拟运行后，如果仍有未解决的决策，请不要在总结后停止。请立即为最高优先级的阻塞决策使用 `clarify`。
14. 后续问题的优先顺序：
    - `SOUL.md` 冲突
    - 导入的技能冲突
    - 迁移模式
    - 工作区指令目标
15. 请勿承诺稍后在同一消息中提供选项。请通过实际调用 `clarify` 来呈现它们。
16. 在迁移模式回答后，请明确检查 `workspace-agents` 是否仍未解决。如果是，则您的下一个操作必须是工作区指令的 `clarify` 调用。
17. 在任何 `clarify` 回答后，如果仍有其他必需的决策待解决，请勿叙述刚刚决定的内容。请立即询问下一个必需的问题。

## 预期结果

成功运行后，用户应拥有：

- 导入的 Hermes 人格状态
- 已填充转换后 OpenClaw 知识的 Hermes 记忆文件
- 位于 `~/.hermes/skills/openclaw-imports/` 下的可用 OpenClaw 技能
- 显示任何冲突、遗漏或不支持数据的迁移报告