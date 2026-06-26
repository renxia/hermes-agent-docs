title: "Openclaw Migration — Migrate a user's OpenClaw customization footprint into Hermes Agent"
sidebar_label: "Openclaw Migration"
description: "Migrate a user's OpenClaw customization footprint into Hermes Agent"
---

{/* 本页面由website/scripts/generate-skill-docs.py根据技能的SKILL.md自动生成。请编辑源文件SKILL.md，而不是本页面。 */}

# Openclaw迁移

将用户的OpenClaw定制足迹迁移到Hermes智能体中。它会导入来自~/.openclaw的Hermes兼容记忆、SOUL.md、命令白名单、用户技能和选定的工作区资源，然后报告哪些内容未能迁移以及原因。

## 技能元数据

| | |
|---|---|
| 源 | 可选 — 使用`hermes skills install official/migration/openclaw-migration`安装 |
| Path | `optional-skills/migration/openclaw-migration` |
| Version | `1.0.0` |
| 作者 | Hermes智能体 (Nous Research) |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `Migration`, `OpenClaw`, `Hermes`, `Memory`, `Persona`, `Import` |
| 相关技能 | [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

## Key Paths & Config

```
~/.hermes/config.yaml       Main configuration
~/.hermes/.env              API keys and secrets (under $HERMES_HOME if set)
$HERMES_HOME
```

# OpenClaw -> Hermes 迁移

当用户希望将他们的 OpenClaw 设置迁移到 Hermes 智能体（Agent）并进行最少量的手动清理时，请使用此技能。

## CLI 命令

对于快速、非交互式的迁移，请使用内置的 CLI 命令：

```bash
hermes claw migrate              # 完全交互式迁移
hermes claw migrate --dry-run    # 预览将要迁移的内容
hermes claw migrate --preset user-data   # 不带密钥地进行迁移
hermes claw migrate --overwrite  # 覆盖现有冲突
hermes claw migrate --source /custom/path/.openclaw  # 自定义源路径
```

该 CLI 命令运行了下面描述的相同迁移脚本。当您需要一个带有干跑预览和逐项冲突解决的交互式引导式迁移时，请使用此技能（通过智能体）。

**首次设置：** `hermes setup` 向导会自动检测 `~/.openclaw`，并在配置开始之前提供迁移选项。

## 此技能的功能

它使用 `scripts/openclaw_to_hermes.py` 来：

- 将 `SOUL.md` 导入到 Hermes 主目录中，命名为 `SOUL.md`
- 将 OpenClaw 的 `MEMORY.md` 和 `USER.md` 转换为 Hermes 内存条目
- 将 OpenClaw 命令批准模式合并到 Hermes 的 `command_allowlist` 中
- 迁移 Hermes 兼容的消息设置，例如 `TELEGRAM_ALLOWED_USERS`，并将 OpenClaw 工作区设置映射到 Hermes 的工作目录配置
- 将 OpenClaw 技能复制到 `~/.hermes/skills/openclaw-imports/`
- 可选地将 OpenClaw 工作区说明文件复制到选定的 Hermes 工作区
- 将兼容的工作区资源（例如 `workspace/tts/`）镜像到 `~/.hermes/tts/`
- 归档那些没有直接 Hermes 目标的非秘密文档
- 生成一份结构化的报告，列出已迁移项、冲突项、跳过的项目及其原因

## 路径解析

辅助脚本位于此技能目录中：

- `scripts/openclaw_to_hermes.py`

当此技能从 Skills Hub 安装时，正常的路径是：

- `~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py`

不要猜测一个更短的路径，例如 `~/.hermes/skills/openclaw-migration/...`。

在运行辅助脚本之前：

1. 优先使用位于 `~/.hermes/skills/migration/openclaw-migration/` 下的已安装路径。
2. 如果该路径失败，请检查已安装的技能目录，并将脚本相对于已安装的 `SKILL.md` 进行解析。
3. 仅在安装位置缺失或技能被手动移动时才使用 `find` 作为备用方案。
4. 调用终端工具时，不要传递 `workdir: "~"`。请使用绝对目录（例如用户的家目录），或者完全省略 `workdir`。

使用 `--migrate-secrets` 时，它还将导入一小部分允许的 Hermes 兼容密钥，目前包括：

- `TELEGRAM_BOT_TOKEN`

## 默认工作流程

1. 先进行一次干跑检查。
2. 展示一个简单的摘要，说明哪些内容可以迁移、哪些内容不能迁移以及哪些内容将被归档。
3. 如果有 `clarify` 工具可用，则使用它来获取用户决策，而不是要求提供自由散文回复。
4. 如果干跑发现了导入技能目录的冲突，请在执行前询问如何处理这些冲突。
5. 在执行前，要求用户选择两种支持的迁移模式之一。
6. 仅当用户希望将工作区说明文件带过来时，才要求提供目标工作区路径。
7. 使用匹配的预设和标志执行迁移。
8. 总结结果，特别是：
   - 哪些内容被迁移了
   - 哪些内容被归档用于手动审查
   - 哪些内容被跳过以及原因

## 用户交互协议

Hermes CLI 支持 `clarify` 工具进行交互式提示，但它仅限于：

- 一次一个选择
- 最多 4 个预定义选项
- 一个自动的“其他”自由文本选项

它**不**支持单个提示中的真正的多选复选框。

对于每一次 `clarify` 调用：

- 始终包含非空的 `question`（问题）
- 仅在存在真实可选择的提示时才包含 `choices`（选项）
- 将 `choices` 限制为 2-4 个纯字符串选项
- 绝不发出占位符或截断的选项，例如 `...`
- 绝不使用额外的空白来填充或美化选项
- 绝不在问题中包含虚假的表单字段，例如“在此输入目录”，需要填写的空行，或下划线如 `_____`
- 对于开放式路径问题，只询问平实的句子；用户在面板下方的正常 CLI 提示符中输入。

如果 `clarify` 调用返回错误，请检查错误文本，修正负载（payload），并尝试使用有效的 `question` 和干净的选项重试一次。

当 `clarify` 可用且干跑显示需要用户的决策时，**您的下一个操作必须是 `clarify` 工具调用**。
不要以以下正常助手消息结束回合：

- “让我展示选项”
- “您想做什么？”
- “这是选项”

如果需要用户决策，请先通过 `clarify` 收集它，然后再生成更多的散文内容。
如果仍有多个未解决的决策，请不要在它们之间插入解释性的助手消息。收到一个 `clarify` 回复后，您的下一个操作通常应该是下一个必需的 `clarify` 调用。

当干跑报告显示：

- `kind="workspace-agents"`
- `status="skipped"`
- 原因包含 `No workspace target was provided` (未提供工作区目标)

时，请将 `workspace-agents` 视为一个未解决的决策。在这种情况下，您必须在执行前询问关于工作区说明书的内容。不要默默地将其视为跳过的决策。

由于这一限制，请使用以下简化的决策流程：

1. 对于 `SOUL.md` 冲突，使用 `clarify` 并提供诸如：
   - `keep existing` (保留现有)
   - `overwrite with backup` (用备份覆盖)
   - `review first` (先审查)
2. 如果干跑显示一个或多个具有 `kind="skill"` 和 `status="conflict"` 的项目，请使用 `clarify` 并提供诸如：
   - `keep existing skills` (保留现有技能)
   - `overwrite conflicting skills with backup` (用备份覆盖冲突的技能)
   - `import conflicting skills under renamed folders` (在重命名后的文件夹下导入冲突的技能)
3. 对于工作区说明书，使用 `clarify` 并提供诸如：
   - `skip workspace instructions` (跳过工作区说明书)
   - `copy to a workspace path` (复制到工作区路径)
   - `decide later` (稍后决定)
4. 如果用户选择复制工作区说明书，请询问一个后续的开放式 `clarify` 问题，要求提供**绝对路径**。
5. 如果用户选择 `skip workspace instructions` 或 `decide later`，则不使用 `--workspace-target`。
6. 对于迁移模式，使用 `clarify` 并提供这 3 个选项：
   - `user-data only` (仅限用户数据)
   - `full compatible migration` (完全兼容式迁移)
   - `cancel` (取消)
7. `user-data only` 意味着：迁移用户数据和兼容的配置，但**不**导入允许的密钥。
8. `full compatible migration` 意味着：迁移相同的兼容用户数据以及存在的允许的密钥。
9. 如果 `clarify` 不可用，请以正常文本形式提出相同的问题，但仍需将答案限制在 `user-data only`、`full compatible migration` 或 `cancel` 中。

执行门控（Execution gate）：

- 只要由“未提供工作区目标”导致的 `workspace-agents` 跳过问题仍未解决，就不要执行。
- 唯一有效的解决方法是：
  - 用户明确选择了 `skip workspace instructions` (跳过工作区说明书)
  - 用户明确选择了 `decide later` (稍后决定)
  - 用户在选择 `copy to a workspace path` (复制到工作区路径) 后提供了工作区路径。
- 干跑中缺少工作区目标本身并不意味着可以执行。
- 只要任何必需的 `clarify` 决策仍未解决，就不要执行。

请使用以下精确的 `clarify` 负载形状作为默认模式：

- `{"question":"您的现有 SOUL.md 与导入的冲突。我应该怎么办？","choices":["keep existing","overwrite with backup","review first"]}`
- `{"question":"一个或多个导入的 OpenClaw 技能已存在于 Hermes 中。我应该如何处理这些技能冲突？","choices":["keep existing skills","overwrite conflicting skills with backup","import conflicting skills under renamed folders"]}`
- `{"question":"请选择迁移模式：仅迁移用户数据，还是运行包括允许密钥的完全兼容式迁移？","choices":["user-data only","full compatible migration","cancel"]}`
- `{"question":"您是否希望将 OpenClaw 工作区说明文件复制到 Hermes 工作区？","choices":["skip workspace instructions","copy to a workspace path","decide later"]}`
- `{"question":"请输入一个应复制工作区说明书的绝对路径。"}`

## 决策到命令的映射

请精确地将用户决策映射到命令标志：

- 如果用户为 `SOUL.md` 选择 `keep existing` (保留现有)，则**不要**添加 `--overwrite`。
- 如果用户选择 `overwrite with backup` (用备份覆盖)，则添加 `--overwrite`。
- 如果用户选择 `review first` (先审查)，则在执行前停止并审查相关文件。
- 如果用户选择 `keep existing skills` (保留现有技能)，则添加 `--skill-conflict skip`。
- 如果用户选择 `overwrite conflicting skills with backup` (用备份覆盖冲突的技能)，则添加 `--skill-conflict overwrite`。
- 如果用户选择 `import conflicting skills under renamed folders` (在重命名后的文件夹下导入冲突的技能)，则添加 `--skill-conflict rename`。
- 如果用户选择 `user-data only` (仅限用户数据)，则使用 `--preset user-data` 执行，并且**不要**添加 `--migrate-secrets`。
- 如果用户选择 `full compatible migration` (完全兼容式迁移)，则使用 `--preset full --migrate-secrets` 执行。
- 只有当用户明确提供了绝对工作区路径时，才添加 `--workspace-target`。
- 如果用户选择 `skip workspace instructions` (跳过工作区说明书) 或 `decide later` (稍后决定)，则不添加 `--workspace-target`。

在执行前，请用平实的语言重述确切的命令计划，并确保它与用户的选择相匹配。

## 运行后的报告规则

执行后，将脚本的 JSON 输出视为事实来源（source of truth）。

1. 所有计数都基于 `report.summary` 进行。
2. 只有当某项的 `status` 精确为 `migrated` 时，才将其列在“成功迁移”下。
3. 除非报告显示冲突已解决，否则不要声称冲突已被解决。
4. 除非针对 `kind="soul"` 的报告项目 `status="migrated"`，否则不要说 `SOUL.md` 已被覆盖。
5. 如果 `report.summary.conflict > 0`，则应包含一个冲突部分，而不是默默地暗示成功。
6. 如果计数和所列出的项目不一致，请修复列表以匹配报告后再进行回复。
7. 如果可用，请包含来自报告的 `output_dir` 路径，以便用户可以检查 `report.json`、`summary.md`、备份和归档文件。
8. 对于内存或用户配置溢出（overflow），除非报告明确显示了归档路径，否则不要说这些条目已被归档。如果存在 `details.overflow_file`，则说明完整的溢出列表已导出到该文件。
9. 如果一个技能是在重命名后的文件夹下导入的，请报告最终目的地，并提及 `details.renamed_from`。
10. 如果存在 `report.skill_conflict_mode`，请将其作为所选导入技能冲突策略的事实来源。
11. 如果某项的 `status="skipped"` (跳过)，则不要描述它已被覆盖、已备份、已迁移或已解决。
12. 如果 `kind="soul"` 的 `status="skipped"` 且原因是 `Target already matches source` (目标已与源匹配)，请说明其保持不变，并且不要提及备份。
13. 如果一个被重命名的导入技能的 `details.backup` 为空，则不要暗示现有的 Hermes 技能已被重命名或已备份。只需说导入的副本已放置在新目的地，并引用 `details.renamed_from` 作为保持原位的现有文件夹。

## 迁移预设

在正常使用中，请优先使用以下两种预设：

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

`full` 除了包含 `user-data` 的所有内容外，还包括：

- `secret-settings`

辅助脚本仍然支持类别级别的 `--include` / `--exclude`，但请将其视为高级回退机制，而非默认的用户体验。

## 命令

使用完整的发现功能进行干运行（Dry run）：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py
```

在使用终端工具时，请优先使用绝对调用模式，例如：

```json
{"command":"python3 /home/USER/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py","workdir":"/home/USER"}
```

使用 `user-data` 预设进行干运行：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --preset user-data
```

执行用户数据迁移：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --execute --preset user-data --skill-conflict skip
```

执行完整的兼容性迁移：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --execute --preset full --migrate-secrets --skill-conflict skip
```

包含工作区指令的执行：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --execute --preset user-data --skill-conflict rename --workspace-target "/absolute/workspace/path"
```

默认情况下，请勿使用 `$PWD` 或主目录作为工作区目标。首先要求提供明确的工作区路径。

## 重要规则

1. 在写入之前，先进行干运行，除非用户明确指示立即继续。
2. 默认不迁移秘密信息。令牌、身份验证块（auth blobs）、设备凭证和原始网关配置应保留在 Hermes 之外，除非用户明确要求迁移秘密信息。
3. 除非用户明确希望覆盖，否则不要静默地覆盖非空的 Hermes 目标。当启用覆盖功能时，辅助脚本将保留备份。
4. 始终提供跳过项目（skipped-items）报告。该报告是迁移的一部分，而不是可选的附加项。
5. 优先使用主要的 OpenClaw 工作区 (`~/.openclaw/workspace/`) 而非 `workspace.default/`。仅在主文件缺失时才将默认工作区用作回退选项。
6. 即使在秘密迁移模式下，也只迁移具有干净 Hermes 目标的秘密信息。不支持的身份验证块仍必须报告为跳过。
7. 如果干运行显示大量资产复制、冲突的 `SOUL.md` 或内存溢出条目，请在执行前单独指出这些问题。
8. 如果用户不确定，则默认为 `user-data only`（仅限用户数据）。
9. 只有当用户明确提供了目标工作区路径时，才包括 `workspace-agents`。
10. 将类别级别的 `--include` / `--exclude` 视为高级逃生舱口（escape hatch），而不是正常流程。
11. 如果可用 `clarify`（澄清/说明）功能，请勿以模糊的“您想做什么？”来结束干运行摘要。而是使用结构化的后续提示。
12. 当一个真正的选择提示可以解决问题时，不要使用开放式的 `clarify` 提示。首先优先使用可选项，然后才对绝对路径或文件审查请求使用自由文本。
13. 干运行后，如果仍有未决定的事项，切勿在摘要后停止。必须立即使用 `clarify` 来解决最高优先级的阻塞性决策。
14. 后续问题的优先级顺序：
    - `SOUL.md` 冲突
    - 导入技能冲突
    - 迁移模式
    - 工作区指令目标
15. 不要承诺在同一消息中稍后提供选择。而是通过实际调用 `clarify` 来呈现它们。
16. 在回答迁移模式后，必须明确检查 `workspace-agents` 是否仍未解决。如果是，你的下一个操作必须是工作区指令的 `clarify` 调用。
17. 任何 `clarify` 回答之后，如果仍有其他必需的决策，请勿叙述刚刚做出的决定。立即提出下一个必需的问题。

## 预期结果

成功运行后，用户应该拥有：

- 已导入的 Hermes 人格状态
- 使用转换后的 OpenClaw 知识填充的 Hermes 内存文件
- 在 `~/.hermes/skills/openclaw-imports/` 下可用的 OpenClaw 技能
- 一份显示任何冲突、遗漏或不支持数据的迁移报告