---
title: "调试 Hermes TUI 命令 — 调试 Hermes TUI 斜杠命令：Python、网关、Ink UI"
sidebar_label: "调试 Hermes TUI 命令"
description: "调试 Hermes TUI 斜杠命令：Python、网关、Ink UI"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从 skill 的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# 调试 Hermes TUI 命令

调试 Hermes TUI 斜杠命令：Python、网关、Ink UI。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/software-development/debugging-hermes-tui-commands` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 标签 | `debugging`, `hermes-agent`, `tui`, `slash-commands`, `typescript`, `python` |
| 相关技能 | [`python-debugpy`](/docs/user-guide/skills/bundled/software-development/software-development-python-debugpy), [`node-inspect-debugger`](/docs/user-guide/skills/bundled/software-development/software-development-node-inspect-debugger), [`systematic-debugging`](/docs/user-guide/skills/bundled/software-development/software-development-systematic-debugging) |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 调试 Hermes TUI 斜杠命令

## 概述

Hermes 斜杠命令跨越三个层级 —— Python 命令注册表、tui_gateway JSON-RPC 桥接器和 Ink/TypeScript 前端。当某个命令行为异常时（在自动补全中缺失、在 CLI 中可用但在 TUI 中不可用、配置持久化但 UI 未更新），几乎总是因为某一层级与其他层级不同步。

当您遇到 Hermes TUI 中斜杠命令的问题时，请使用此技能，尤其是当命令未显示在自动补全中、在 TUI 中无法正常工作或需要添加/更新时。

## 何时使用

- 斜杠命令在代码库的某一部分存在，但无法完全正常工作
- 命令需要同时添加到后端和前端
- 特定命令的自动补全无法工作
- 命令在 CLI 和 TUI 中的行为不一致
- 命令会持久化配置，但在 TUI 中未实时生效

## 架构概览

<!-- ascii-guard-ignore -->
```
Python 后端 (hermes_cli/commands.py)     <- 规范 COMMAND_REGISTRY
       │
       ▼
TUI 网关 (tui_gateway/server.py)         <- slash.exec / command.dispatch
       │
       ▼
TUI 前端 (ui-tui/src/app/slash/)        <- 本地处理程序 + 回退
```
<!-- ascii-guard-ignore-end -->

命令定义必须在 Python 和 TypeScript 中一致注册才能正常工作。Python 的 `COMMAND_REGISTRY` 是以下各项的真实来源：CLI 调度、网关帮助、Telegram BotCommand 菜单、Slack 子命令映射以及发送到 Ink 的自动补全数据。

## 调查步骤

1. **检查命令是否存在于 TUI 前端：**
   ```bash
   search_files --pattern "/commandname" --file_glob "*.ts" --path ui-tui/
   search_files --pattern "/commandname" --file_glob "*.tsx" --path ui-tui/
   ```

2. **检查 TUI 命令定义：**
   ```bash
   read_file ui-tui/src/app/slash/commands/core.ts
   # 如果不存在：
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

## 修复：缺失的命令自动补全

如果命令存在于 TUI 中但未显示在自动补全中：

1. 在 `hermes_cli/commands.py` 的 `COMMAND_REGISTRY` 中添加一个 `CommandDef` 条目：
   ```python
   CommandDef("commandname", "命令描述", "Session",
              cli_only=True, aliases=("alias",),
              args_hint="[arg1|arg2|arg3]",
              subcommands=("arg1", "arg2", "arg3")),
   ```

2. 谨慎选择 `cli_only` 与网关可用性：
   - `cli_only=True` —— 仅在交互式 CLI/TUI 中可用
   - `gateway_only=True` —— 仅在消息传递平台中可用
   - 两者都不设置 —— 在所有地方都可用
   - `gateway_config_gate="display.foo"` —— 在网关中由配置控制可用性

3. 确保 `subcommands` 与 TUI 显示的预期 Tab 补全选项匹配。

4. 如果命令在服务端运行，请在 `cli.py` 的 `HermesCLI.process_command()` 中添加处理程序：
   ```python
   elif canonical == "commandname":
       self._handle_commandname(cmd_original)
   ```

5. 对于网关可用的命令，请在 `gateway/run.py` 中添加处理程序：
   ```python
   if canonical == "commandname":
       return await self._handle_commandname(event)
   ```

## 常见问题

1. **命令在 TUI 中显示但不在自动补全中。** 该命令在 TUI 代码库中已定义，但在 `hermes_cli/commands.py` 的 `COMMAND_REGISTRY` 中缺失。自动补全数据来自 Python。

2. **命令在自动补全中显示但无法工作。** 检查 `tui_gateway/server.py` 中的命令处理程序和 `ui-tui/src/app/createSlashHandler.ts` 中的前端处理程序。如果命令仅在 Ink 中本地处理，则必须在 `app.tsx` 的内置分支中处理；否则它会回退到 `slash.exec`，并且必须有一个 Python 处理程序。

3. **命令在 CLI 和 TUI 中的行为不同。** 该命令可能有不同的实现。请同时检查 `cli.py::process_command` 和 TUI 的本地处理程序。本地 TUI 处理程序优先于网关调度。

4. **命令会持久化配置但不会实时生效。** 对于 TUI 本地命令，仅更新 `config.set` 是不够的。还需立即修补相关的 nanostore 状态（通常是 `patchUiState(...)`），并将任何新状态传递到渲染组件中。例如：`/details collapsed` 必须实时更新详情可见性，而不仅仅是保存 `details_mode`；会话内全局的 `/details <mode>` 可能需要一个单独的命令覆盖标志，以便实时命令可以覆盖内置部分的默认值，同时启动/配置同步保留默认展开的思维/工具行为。

5. **网关调度静默忽略该命令。** 网关仅调度它知道的命令。检查 `GATEWAY_KNOWN_COMMANDS`（自动从 `COMMAND_REGISTRY` 派生）是否包含规范名称。如果命令是 `cli_only` 并带有 `gateway_config_gate`，请验证门控配置值是否为真值。

## 调试策略

当表面检查无法揭示 bug 时：

- **Python 端挂起或行为异常：** 使用 `python-debugpy` 技能在 `_SlashWorker.exec` 或命令处理程序内部中断。在处理程序入口处设置 `remote-pdb` 是最快路径。
- **Ink 端无反应：** 使用 `node-inspect-debugger` 技能在 `app.tsx` 的斜杠调度或本地命令分支处中断。在 `npm run build` 后使用 `sb('dist/app.js', <行号>)`。
- **注册表不匹配 / 不清楚哪一侧出错：** 将规范的 `COMMAND_REGISTRY` 条目与 TUI 的本地命令列表并排比较。

## 陷阱

- 不要忘记在 `CommandDef` 中为命令设置适当的类别（例如：“Session”、“Configuration”、“Tools & Skills”、“Info”、“Exit”）
- 确保任何别名都正确注册在 `aliases` 元组中 —— 无需修改其他文件，所有下游内容（Telegram 菜单、Slack 映射、自动补全、帮助）都从中派生
- 对于带有子命令的命令，请确保 `CommandDef` 中的 `subcommands` 元组与 TUI 代码中的内容匹配
- `cli_only=True` 的命令在网关/消息传递平台中无法工作 —— 除非您添加 `gateway_config_gate` 且门控值为真值
- 添加实时 UI 状态后，请搜索旧属性/帮助函数的每个使用者，并将新状态传递到所有渲染路径中，而不仅仅是活跃的流式传输路径。TUI 详情渲染至少有两个重要路径：实时的 `StreamingAssistant`/`ToolTrail` 和转录/待处理的 `MessageLine` 行。`/clean` 过程应明确检查两者。
- 在测试前重建 TUI（`npm --prefix ui-tui run build`）—— tsx 监视模式在首次启动时可能会滞后

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
   - 预期行为触发
   - 任何持久化的配置正确更新（`read_file ~/.hermes/config.yaml`）
   - 实时 UI 状态立即反映更改（而不仅仅是在重启后）

5. 如果命令也可在网关中使用，请至少从一个消息传递平台测试它（或运行网关测试：`scripts/run_tests.sh tests/gateway/`）。