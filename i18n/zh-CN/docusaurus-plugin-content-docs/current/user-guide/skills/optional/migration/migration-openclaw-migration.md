---
title: "Openclaw 迁移 — 将用户的 OpenClaw 自定义内容迁移至 Hermes 智能体"
sidebar_label: "Openclaw 迁移"
description: "将用户的 OpenClaw 自定义内容迁移至 Hermes 智能体"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能文件 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Openclaw 迁移

将用户的 OpenClaw 自定义内容迁移至 Hermes 智能体。从 ~/.openclaw 导入与 Hermes 兼容的记忆、SOUL.md、命令白名单、用户技能以及选定的工作区资源，然后准确报告无法迁移的内容及其原因。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/migration/openclaw-migration` 安装 |
| 路径 | `optional-skills/migration/openclaw-migration` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体（Nous Research） |
| 许可证 | MIT |
| 标签 | `迁移`, `OpenClaw`, `Hermes`, `记忆`, `人设`, `导入` |
| 相关技能 | [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# OpenClaw -> Hermes 迁移

当用户希望将其 OpenClaw 设置迁移到 Hermes 智能体，并尽量减少手动清理时，请使用此技能。

## CLI 命令

要进行快速、非交互式迁移，请使用内置的 CLI 命令：

```bash
hermes claw migrate              # 完整交互式迁移
hermes claw migrate --dry-run    # 预览将要迁移的内容
hermes claw migrate --preset user-data   # 迁移时不包含密钥
hermes claw migrate --overwrite  # 覆盖现有冲突项
hermes claw migrate --source /custom/path/.openclaw  # 自定义源路径
```

CLI 命令运行的是下面描述的相同迁移脚本。当您希望进行交互式、引导式迁移，并带有干运行预览和逐项冲突解决时，请通过智能体使用此技能。

**首次设置：** `hermes setup` 向导会自动检测 `~/.openclaw`，并在配置开始前提供迁移选项。

## 此技能的功能

它使用 `scripts/openclaw_to_hermes.py` 来执行以下操作：

- 将 `SOUL.md` 导入 Hermes 主目录，并重命名为 `SOUL.md`
- 将 OpenClaw 的 `MEMORY.md` 和 `USER.md` 转换为 Hermes 的记忆条目
- 将 OpenClaw 的命令审批模式合并到 Hermes 的 `command_allowlist` 中
- 迁移与 Hermes 兼容的消息设置，例如 `TELEGRAM_ALLOWED_USERS` 和 `MESSAGING_CWD`
- 将 OpenClaw 技能复制到 `~/.hermes/skills/openclaw-imports/`
- 可选地将 OpenClaw 工作区指令文件复制到用户选择的 Hermes 工作区
- 镜像兼容的工作区资源，例如将 `workspace/tts/` 复制到 `~/.hermes/tts/`
- 归档那些没有直接 Hermes 目标位置的非机密文档
- 生成一份结构化报告，列出已迁移项、冲突项、跳过项及其原因

## 路径解析

辅助脚本位于此技能目录中：

- `scripts/openclaw_to_hermes.py`

当此技能从技能中心安装时，其正常位置为：

- `~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py`

不要猜测更短的路径，例如 `~/.hermes/skills/openclaw-migration/...`。

在运行辅助脚本之前：

1. 优先使用安装在 `~/.hermes/skills/migration/openclaw-migration/` 下的路径。
2. 如果该路径失败，请检查已安装的技能目录，并相对于已安装的 `SKILL.md` 解析脚本路径。
3. 仅当安装位置缺失或技能被手动移动时，才将 `find` 作为备用方案使用。
4. 调用终端工具时，不要传递 `workdir: "~"`。请使用绝对目录（例如用户的主目录），或完全省略 `workdir`。

使用 `--migrate-secrets` 时，它还会导入一小部分与 Hermes 兼容的允许列表中的密钥，目前包括：

- `TELEGRAM_BOT_TOKEN`

## 默认工作流程

1. 首先进行干运行检查。
2. 展示一个简单摘要，说明哪些内容可以迁移、哪些不能迁移以及哪些会被归档。
3. 如果 `clarify` 工具可用，请使用它来获取用户决策，而不是要求用户输入自由格式的文本回复。
4. 如果干运行发现导入的技能目录存在冲突，请在执行前询问应如何处理这些冲突。
5. 在执行前，请用户选择两种支持的迁移模式之一。
6. 仅当用户希望将工作区指令文件复制过来时，才询问目标工作区路径。
7. 使用匹配的预设和标志执行迁移。
8. 总结结果，特别是：
   - 已迁移的内容
   - 为手动审查而归档的内容
   - 跳过的内容及其原因

## 用户交互协议

Hermes CLI 支持用于交互式提示的 `clarify` 工具，但其功能有限：

- 一次只能选择一个选项
- 最多 4 个预定义选项
- 自动提供一个“其他”自由文本选项

它**不支持**在单个提示中使用真正的多选复选框。

对于每次 `clarify` 调用：

- 始终包含一个非空的 `question`
- 仅在真正的可选择提示中包含 `choices`
- 将 `choices` 限制为 2-4 个纯字符串选项
- 绝不要输出占位符或截断的选项，例如 `...`
- 绝不要用额外的空白字符填充或修饰选项
- 绝不要在问题中包含虚假的表单字段，例如 `在此处输入目录`、用于填写的空白行或下划线如 `_____`
- 对于开放式路径问题，只需询问简单的句子；用户会在面板下方的正常 CLI 提示中输入路径

如果 `clarify` 调用返回错误，请检查错误文本，修正负载，并重新尝试一次，使用有效的 `question` 和干净的选项。

当 `clarify` 可用且干运行揭示任何必需的用户决策时，您的**下一步操作必须是调用 `clarify` 工具**。
不要以普通的助手消息结束本轮对话，例如：

- “让我展示选项”
- “您想做什么？”
- “以下是选项”

如果需要用户决策，请在生成更多文本之前通过 `clarify` 收集该决策。
如果存在多个未解决的决策，请不要在它们之间插入解释性的助手消息。收到一个 `clarify` 响应后，您的下一步操作通常应该是下一个必需的 `clarify` 调用。

每当干运行报告以下内容时，请将 `workspace-agents` 视为未解决的决策：

- `kind="workspace-agents"`
- `status="skipped"`
- 原因包含 `No workspace target was provided`

在这种情况下，您必须在执行前询问有关工作区指令的问题。不要默认为跳过该决策。

由于存在此限制，请使用以下简化的决策流程：

1. 对于 `SOUL.md` 冲突，使用 `clarify` 并提供如下选项：
   - `保留现有`
   - `覆盖并备份`
   - `先审查`
2. 如果干运行显示一个或多个 `kind="skill"` 项且 `status="conflict"`，请使用 `clarify` 并提供如下选项：
   - `保留现有技能`
   - `覆盖冲突技能并备份`
   - `将冲突技能导入重命名的文件夹下`
3. 对于工作区指令，使用 `clarify` 并提供如下选项：
   - `跳过工作区指令`
   - `复制到工作区路径`
   - `稍后决定`
4. 如果用户选择复制工作区指令，请提出一个后续的开放式 `clarify` 问题，要求提供一个**绝对路径**。
5. 如果用户选择 `跳过工作区指令` 或 `稍后决定`，则继续执行，不使用 `--workspace-target`。
6. 对于迁移模式，使用 `clarify` 并提供以下 3 个选项：
   - `仅用户数据`
   - `完整兼容迁移`
   - `取消`
7. `仅用户数据` 意味着：迁移用户数据和兼容配置，但**不**导入允许列表中的密钥。
8. `完整兼容迁移` 意味着：迁移相同的兼容用户数据，并在存在时加上允许列表中的密钥。
9. 如果 `clarify` 不可用，请以普通文本提出相同的问题，但仍将答案限制为 `仅用户数据`、`完整兼容迁移` 或 `取消`。

执行门控：

- 当存在因 `No workspace target was provided` 导致的 `workspace-agents` 跳过且未解决时，不要执行。
- 解决此问题的唯一有效方式是：
  - 用户明确选择 `跳过工作区指令`
  - 用户明确选择 `稍后决定`
  - 用户在选择 `复制到工作区路径` 后提供了一个工作区路径
- 干运行中缺少工作区目标本身并不构成执行许可。
- 当任何必需的 `clarify` 决策仍未解决时，不要执行。

使用以下精确的 `clarify` 负载形状作为默认模式：

- `{"question":"您现有的 SOUL.md 与导入的文件冲突。我该怎么办？","choices":["保留现有","覆盖并备份","先审查"]}`
- `{"question":"一个或多个导入的 OpenClaw 技能已存在于 Hermes 中。我应如何处理这些技能冲突？","choices":["保留现有技能","覆盖冲突技能并备份","将冲突技能导入重命名的文件夹下"]}`
- `{"question":"选择迁移模式：仅迁移用户数据，还是运行包含允许列表中密钥的完整兼容迁移？","choices":["仅用户数据","完整兼容迁移","取消"]}`
- `{"question":"您是否希望将 OpenClaw 工作区指令文件复制到 Hermes 工作区？","choices":["跳过工作区指令","复制到工作区路径","稍后决定"]}`
- `{"question":"请提供应复制工作区指令的绝对路径。"}`

## 决策到命令映射

将用户决策精确映射到命令标志：

- 如果用户为 `SOUL.md` 选择 `保留现有`，则**不**添加 `--overwrite`。
- 如果用户选择 `覆盖并备份`，则添加 `--overwrite`。
- 如果用户选择 `先审查`，则在执行前停止并审查相关文件。
- 如果用户选择 `保留现有技能`，则添加 `--skill-conflict skip`。
- 如果用户选择 `覆盖冲突技能并备份`，则添加 `--skill-conflict overwrite`。
- 如果用户选择 `将冲突技能导入重命名的文件夹下`，则添加 `--skill-conflict rename`。
- 如果用户选择 `仅用户数据`，则使用 `--preset user-data` 执行，且**不**添加 `--migrate-secrets`。
- 如果用户选择 `完整兼容迁移`，则使用 `--preset full --migrate-secrets` 执行。
- 仅当用户明确提供了绝对工作区路径时，才添加 `--workspace-target`。
- 如果用户选择 `跳过工作区指令` 或 `稍后决定`，则不添加 `--workspace-target`。

在执行前，请用通俗语言重申确切的命令计划，并确保其符合用户的选择。

## 迁移后报告规则

执行后，将脚本的 JSON 输出视为真实来源。

1. 所有计数均基于 `report.summary`。
2. 仅当某项的 `status` 恰好为 `migrated` 时，才将其列入“成功迁移”项。
3. 除非报告显示该项为 `migrated`，否则不得声称冲突已解决。
4. 除非 `kind="soul"` 的报告项 `status` 为 `migrated`，否则不得声称 `SOUL.md` 已被覆盖。
5. 如果 `report.summary.conflict > 0`，则包含冲突部分，而不是默认暗示成功。
6. 如果计数与所列项目不一致，请在响应前修正列表以匹配报告。
7. 如果报告中有 `output_dir` 路径，请包含该路径，以便用户可以检查 `report.json`、`summary.md`、备份文件和归档文件。
8. 对于内存或用户配置文件溢出，除非报告明确显示归档路径，否则不得声称条目已被归档。如果 `details.overflow_file` 存在，请说明完整的溢出列表已导出到该文件。
9. 如果某个技能在重命名的文件夹下导入，请报告最终目标位置，并提及 `details.renamed_from`。
10. 如果 `report.skill_conflict_mode` 存在，请将其作为所选导入技能冲突策略的真实来源。
11. 如果某项的 `status` 为 `skipped`，请勿将其描述为已覆盖、已备份、已迁移或已解决。
12. 如果 `kind="soul"` 的 `status` 为 `skipped`，且原因为 `Target already matches source`，请说明其保持不变，且不要提及备份。
13. 如果重命名的导入技能的 `details.backup` 为空，请勿暗示现有的 Hermes 技能被重命名或备份。请仅说明导入的副本已放置在新目标位置，并引用 `details.renamed_from` 作为仍保留在原位的预先存在的文件夹。

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

`full` 包括 `user-data` 中的所有内容，以及：

- `secret-settings`

辅助脚本仍支持类别级别的 `--include` / `--exclude`，但请将其视为高级回退选项，而非默认用户体验。

## 命令

使用完整发现进行试运行：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py
```

使用终端工具时，请优先使用绝对调用模式，例如：

```json
{"command":"python3 /home/USER/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py","workdir":"/home/USER"}
```

使用 user-data 预设进行试运行：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --preset user-data
```

执行 user-data 迁移：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --execute --preset user-data --skill-conflict skip
```

执行完整兼容迁移：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --execute --preset full --migrate-secrets --skill-conflict skip
```

执行包含工作区指令的迁移：

```bash
python3 ~/.hermes/skills/migration/openclaw-migration/scripts/openclaw_to_hermes.py --execute --preset user-data --skill-conflict rename --workspace-target "/absolute/workspace/path"
```

默认情况下，请勿使用 `$PWD` 或主目录作为工作区目标。请先要求用户显式提供工作区路径。

## 重要规则

1. 除非用户明确要求立即执行，否则在写入前请先运行试运行。
2. 默认情况下，请勿迁移密钥。令牌、认证数据块、设备凭据和原始网关配置应保留在 Hermes 之外，除非用户明确要求迁移密钥。
3. 除非用户明确要求，否则请勿静默覆盖非空的 Hermes 目标。当启用覆盖时，辅助脚本将保留备份。
4. 始终向用户提供跳过的项目报告。该报告是迁移的一部分，而非可选的额外内容。
5. 优先使用主 OpenClaw 工作区（`~/.openclaw/workspace/`），而不是 `workspace.default/`。仅当主文件缺失时，才将默认工作区作为回退选项。
6. 即使在密钥迁移模式下，也仅迁移具有干净 Hermes 目标的密钥。不支持的认证数据块仍必须报告为跳过。
7. 如果试运行显示大量资源复制、冲突的 `SOUL.md` 或溢出的内存条目，请在执行前单独指出这些情况。
8. 如果用户不确定，则默认为 `user-data only`。
9. 仅当用户显式提供目标工作区路径时，才包含 `workspace-agents`。
10. 将类别级别的 `--include` / `--exclude` 视为高级逃生舱口，而非正常流程。
11. 如果 `clarify` 可用，请勿以模糊的“您想做什么？”结束试运行摘要。请改用结构化的后续提示。
12. 当可以使用真正的选择提示时，请勿使用开放式 `clarify` 提示。请优先使用可选择的选择，然后仅在需要绝对路径或文件审查请求时才使用自由文本。
13. 试运行后，如果仍有未解决的决策，请勿在总结后停止。请立即使用 `clarify` 处理最高优先级的阻塞决策。
14. 后续问题的优先级顺序：
    - `SOUL.md` 冲突
    - 导入技能冲突
    - 迁移模式
    - 工作区指令目标
15. 请勿在同一消息中承诺稍后呈现选择。请通过实际调用 `clarify` 来呈现它们。
16. 在迁移模式答案之后，请明确检查 `workspace-agents` 是否仍未解决。如果是，则您的下一个操作必须是工作区指令的 `clarify` 调用。
17. 在任何 `clarify` 答案之后，如果仍有其他必需的决策，请勿叙述刚刚做出的决策。请立即提出下一个必需的问题。

## 预期结果

成功运行后，用户应拥有：

- 已导入 Hermes 角色状态
- 已使用转换后的 OpenClaw 知识填充 Hermes 内存文件
- 可在 `~/.hermes/skills/openclaw-imports/` 下使用 OpenClaw 技能
- 一份迁移报告，显示任何冲突、遗漏或不支持的数据