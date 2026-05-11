---
title: "调试 Hermes TUI 命令 — 调试 Hermes TUI 斜杠命令：Python、网关、Ink UI"
sidebar_label: "调试 Hermes TUI 命令"
description: "调试 Hermes TUI 斜杠命令：Python、网关、Ink UI"
---

{/* 此页面由网站脚本 `website/scripts/generate-skill-docs.py` 根据技能的 `SKILL.md` 自动生成。请编辑源文件 `SKILL.md`，而非此页面。 */}

# 调试 Hermes TUI 命令

调试 Hermes TUI 斜杠命令：Python、网关、Ink UI。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/software-development/debugging-hermes-tui-commands` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `debugging`, `hermes-agent`, `tui`, `slash-commands`, `typescript`, `python` |
| 相关技能 | [`python-debugpy`](/docs/user-guide/skills/bundled/software-development/software-development-python-debugpy), [`node-inspect-debugger`](/docs/user-guide/skills/bundled/software-development/software-development-node-inspect-debugger), [`systematic-debugging`](/docs/user-guide/skills/bundled/software-development/software-development-systematic-debugging) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 调试 Hermes TUI 斜杠命令

## 概述

Hermes 斜杠命令跨越三层——Python 命令注册表、`tui_gateway` JSON-RPC 桥接以及 Ink/TypeScript 前端。当命令表现异常（自动补全中缺失、在 CLI 中有效但 TUI 中无效、配置持久化但 UI 未更新）时，问题几乎总是某一层与其他层不同步。

当您在 Hermes TUI 中遇到斜杠命令问题时，请使用此技能，特别是当命令未显示在自动补全中、在 TUI 中无法正常工作，或需要添加/更新命令时。

## 何时使用

- 斜杠命令存在于代码库的某一部分但无法完全工作
- 一个命令需要同时添加到后端和前端
- 特定命令的自动补全不起作用
- 命令在 CLI 和 TUI 之间的行为不一致
- 命令持久化配置但无法在 TUI 中实时应用

## 架构概述

<!-- ascii-guard-ignore -->
```
Python 后端 (hermes_cli/commands.py)     <- 规范的 COMMAND_REGISTRY
       │
       ▼
TUI 网关 (tui_gateway/server.py)         <- slash.exec / command.dispatch
       │
       ▼
TUI 前端 (ui-tui/src/app/slash/)        <- 本地处理程序 + 回退机制
```
<!-- ascii-guard-ignore-end -->

命令定义必须在 Python 和 TypeScript 之间一致注册才能正常工作。Python 中的 `COMMAND_REGISTRY` 是以下内容的真实来源：CLI 调度、网关帮助、Telegram BotCommand 菜单、Slack 子命令映射以及发送到 Ink 的自动补全数据。

## 调查步骤

1. **检查命令是否存在于 TUI 前端：**
   ```bash
   search_files --pattern "/commandname" --file_glob "*.ts" --path ui-tui/
   search_files --pattern "/commandname" --file_glob "*.tsx" --path ui-tui/
   ```

2. **检查 TUI 命令定义：**
   ```bash
   read_file ui-tui/src/app/slash/commands/core.ts
   # 如果不在此处：
   search_files --pattern "commandname" --path ui-tui/src/app/slash/commands --target files
   ```

3. **检查命令是否存在于 Python 后端：**
   ```bash
   search_files --pattern "CommandDef" --file_glob "*.py" --path hermes_cli/
   search_files --pattern "commandname" --path hermes_cli/commands.py --context 3
   ```

4. **检查网关实现：**
   ```bash
   search_files --pattern "complete.slash|slash.exec" --path tui_gateway/
   ```

## 修复：命令自动补全缺失

如果命令存在于 TUI 但未显示在自动补全中：

1. 在 `hermes_cli/commands.py` 的 `COMMAND_REGISTRY` 中添加一个 `CommandDef` 条目：
   ```python
   CommandDef("commandname", "命令描述", "Session",
              cli_only=True, aliases=("alias",),
              args_hint="[arg1|arg2|arg3]",
              subcommands=("arg1", "arg2", "arg3")),
   ```

2. 谨慎选择 `cli_only` 与网关可用性：
   - `cli_only=True` — 仅在交互式 CLI/TUI 中可用
   - `gateway_only=True` — 仅在消息平台中可用
   - 两者都不设 — 在所有地方都可用
   - `gateway_config_gate="display.foo"` — 在网关中由配置控制可用性

3. 确保 `subcommands` 与 TUI 中显示的预期制表符补全选项匹配。

4. 如果命令在服务器端运行，在 `cli.py` 的 `HermesCLI.process_command()` 中添加一个处理程序：
   ```python
   elif canonical == "commandname":
       self._handle_commandname(cmd_original)
   ```

5. 对于网关可用的命令，在 `gateway/run.py` 中添加一个处理程序：
   ```python
   if canonical == "commandname":
       return await self._handle_commandname(event)
   ```

## 常见问题

1. **命令显示在 TUI 中但不在自动补全中。** 命令在 TUI 代码库中已定义，但缺失于 `hermes_cli/commands.py` 中的 `COMMAND_REGISTRY`。自动补全数据来自 Python。

2. **命令显示在自动补全中但无法工作。** 检查 `tui_gateway/server.py` 中的命令处理程序和 `ui-tui/src/app/createSlashHandler.ts` 中的前端处理程序。如果命令是 Ink 中仅本地可用的，它必须在 `app.tsx` 的内置分支中处理；否则它将回退到 `slash.exec`，并且必须有一个 Python 处理程序。

3. **命令在 CLI 和 TUI 中行为不同。** 命令可能有不同的实现。同时检查 `cli.py::process_command` 和 TUI 的本地处理程序。本地 TUI 处理程序优先于网关调度。

4. **命令持久化配置但无法实时应用。** 对于 TUI 本地命令，仅更新 `config.set` 是不够的。还需要立即修补相关的 nanostore 状态（通常是 `patchUiState(...)`），并将任何新状态通过渲染组件传递。例如：`/details collapsed` 必须实时更新细节可见性，而不仅仅是保存 `details_mode`；会话内的全局 `/details <mode>` 可能需要一个单独的命令覆盖标志，以便实时命令可以覆盖内置部分的默认值，而启动/配置同步则保留默认展开思考/工具的行为。

5. **网关调度静默忽略命令。** 网关只调度它知道的命令。检查 `GATEWAY_KNOWN_COMMANDS`（自动从 `COMMAND_REGISTRY` 派生）是否包含规范名称。如果命令是 `cli_only` 且设置了 `gateway_config_gate`，请验证受门控的配置值是否为真值。

## 调试策略

当表面检查无法发现错误时：

- **Python 端挂起或行为异常：** 使用 `python-debugpy` 技能在 `_SlashWorker.exec` 或命令处理程序内部中断。在处理程序入口处设置 `remote-pdb` 是最快的途径。
- **Ink 端不响应：** 使用 `node-inspect-debugger` 技能在 `app.tsx` 的斜杠调度或本地命令分支中断。在 `npm run build` 后使用 `sb('dist/app.js', <行号>)`。
- **注册表不匹配 / 不清楚哪一侧有误：** 将规范的 `COMMAND_REGISTRY` 条目与 TUI 的本地命令列表进行并排比较。

## 陷阱

- 不要忘记在 `CommandDef` 中为命令设置适当的类别（例如 "Session"、"Configuration"、"Tools & Skills"、"Info"、"Exit"）
- 确保所有别名都正确注册在 `aliases` 元组中——不需要其他文件更改，所有下游内容（Telegram 菜单、Slack 映射、自动补全、帮助）都从中派生
- 对于带子命令的命令，确保 `CommandDef` 中的 `subcommands` 元组与 TUI 代码中的内容匹配
- `cli_only=True` 的命令在网关/消息平台中将不起作用——除非您添加 `gateway_config_gate` 且该门控为真值
- 在添加实时 UI 状态后，搜索旧 prop/辅助函数的每个使用者，并将新状态通过所有渲染路径传递，而不仅仅是活动的流式传输路径。TUI 细节渲染至少有两个重要路径：实时的 `StreamingAssistant`/`ToolTrail` 和转录/待处理的 `MessageLine` 行。一次 `/clean` 过程应该明确检查两者。
- 在测试前重建 TUI (`npm --prefix ui-tui run build`)——tsx 监视模式可能在首次启动时滞后

## 验证

修复后：

1. 重建 TUI：
   ```bash
   cd /home/bb/hermes-agent && npm --prefix ui-tui run build
   ```

2. 运行 TUI 并测试命令：
   ```bash
   hermes --tui
   ```

3. 输入 `/` 并验证命令是否出现在自动补全建议中，并带有预期的描述和参数提示。

4. 执行命令并确认：
   - 预期行为被触发
   - 任何持久化的配置都正确更新 (`read_file ~/.hermes/config.yaml`)
   - 实时 UI 状态立即反映更改（而不仅仅是重启后）

5. 如果命令也是网关可用的，请从至少一个消息平台测试它（或运行网关测试：`scripts/run_tests.sh tests/gateway/`）。