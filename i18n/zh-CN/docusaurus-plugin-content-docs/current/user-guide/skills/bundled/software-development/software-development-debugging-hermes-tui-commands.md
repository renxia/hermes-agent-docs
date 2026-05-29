---
title: "调试赫尔墨斯TUI命令 — 调试赫尔墨斯TUI斜杠命令：Python、网关、Ink UI"
sidebar_label: "调试赫尔墨斯TUI命令"
description: "调试赫尔墨斯TUI斜杠命令：Python、网关、Ink UI"
---

{/* 此页面由网站脚本website/scripts/generate-skill-docs.py从技能的SKILL.md自动生成。请编辑源文件SKILL.md，而非此页面。 */}

# 调试赫尔墨斯TUI命令

调试赫尔墨斯TUI斜杠命令：Python、网关、Ink UI。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/software-development/debugging-hermes-tui-commands` |
| 版本 | `1.0.0` |
| 作者 | 赫尔墨斯智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `debugging`, `hermes-agent`, `tui`, `slash-commands`, `typescript`, `python` |
| 相关技能 | [`python-debugpy`](/docs/user-guide/skills/bundled/software-development/software-development-python-debugpy), [`node-inspect-debugger`](/docs/user-guide/skills/bundled/software-development/software-development-node-inspect-debugger), [`systematic-debugging`](/docs/user-guide/skills/bundled/software-development/software-development-systematic-debugging) |

## 参考：完整SKILL.md

:::info
以下是当触发此技能时，赫尔墨斯加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 调试赫尔墨斯TUI斜杠命令

## 概述

赫尔墨斯的斜杠命令跨越三层 — Python命令注册表、tui_gateway JSON-RPC桥接层以及Ink/TypeScript前端。当命令行为异常（从自动补全中消失、在CLI有效但在TUI中无效、配置已持久化但UI未更新）时，问题几乎总是某一层与另一层不同步。

当您在赫尔墨斯TUI中遇到斜杠命令问题时，特别是命令未显示在自动补全中、在TUI中无法正常工作或需要添加/更新时，请使用此技能。

## 使用时机

- 斜杠命令存在于代码库的某个部分但无法完全工作
- 一个命令需要在后端和前端同时添加
- 特定命令的自动补全无法工作
- 命令在CLI和TUI中的行为不一致
- 命令持久化配置但在TUI中未实时应用

## 架构概述

<!-- ascii-guard-ignore -->
```
Python后端 (hermes_cli/commands.py)     <- 规范的COMMAND_REGISTRY
       │
       ▼
TUI网关 (tui_gateway/server.py)         <- slash.exec / command.dispatch
       │
       ▼
TUI前端 (ui-tui/src/app/slash/)        <- 本地处理程序 + 回退
```
<!-- ascii-guard-ignore-end -->

命令定义必须在Python和TypeScript之间一致注册才能正常工作。Python的`COMMAND_REGISTRY`是以下各项的权威数据源：CLI调度、网关帮助、Telegram BotCommand菜单、Slack子命令映射以及发送给Ink的自动补全数据。

## 排查步骤

1.  **检查命令是否存在于TUI前端：**
    ```bash
    search_files --pattern "/commandname" --file_glob "*.ts" --path ui-tui/
    search_files --pattern "/commandname" --file_glob "*.tsx" --path ui-tui/
    ```

2.  **查看TUI命令定义：**
    ```bash
    read_file ui-tui/src/app/slash/commands/core.ts
    # 如果不在那里：
    search_files --pattern "commandname" --path ui-tui/src/app/slash/commands --target files
    ```

3.  **检查命令是否存在于Python后端：**
    ```bash
    search_files --pattern "CommandDef" --file_glob "*.py" --path hermes_cli/
    search_files --pattern "commandname" --path hermes_cli/commands.py --context 3
    ```

4.  **查看网关实现：**
    ```bash
    search_files --pattern "complete.slash|slash.exec" --path tui_gateway/
    ```

## 修复：缺少命令自动补全

如果命令存在于TUI中但未显示在自动补全中：

1.  在`hermes_cli/commands.py`的`COMMAND_REGISTRY`中添加一个`CommandDef`条目：
    ```python
    CommandDef("commandname", "命令的描述", "Session",
               cli_only=True, aliases=("alias",),
               args_hint="[arg1|arg2|arg3]",
               subcommands=("arg1", "arg2", "arg3")),
    ```

2.  仔细选择`cli_only`与网关可用性：
    - `cli_only=True` — 仅在交互式CLI/TUI中
    - `gateway_only=True` — 仅在消息平台中
    - 两者都不设置 — 到处可用
    - `gateway_config_gate="display.foo"` — 在网关中受配置门控的可用性

3.  确保`subcommands`与TUI显示的预期制表补全选项匹配。

4.  如果命令在服务器端运行，在`cli.py`的`HermesCLI.process_command()`中添加一个处理程序：
    ```python
    elif canonical == "commandname":
        self._handle_commandname(cmd_original)
    ```

5.  对于网关可用的命令，在`gateway/run.py`中添加一个处理程序：
    ```python
    if canonical == "commandname":
        return await self._handle_commandname(event)
    ```

## 常见问题

1.  **命令显示在TUI中但不在自动补全中。** 命令已定义在TUI代码库中，但缺少`hermes_cli/commands.py`中的`COMMAND_REGISTRY`条目。自动补全数据来自Python。
2.  **命令显示在自动补全中但无法工作。** 检查`ui-tui/src/app/createSlashHandler.ts`中的TUI命令处理程序和前端处理程序。如果命令在Ink中是仅本地的，它必须在`app.tsx`的内置分支中处理；否则它会回退到`slash.exec`并必须有一个Python处理程序。
3.  **命令在CLI和TUI中行为不同。** 命令可能有不同的实现。检查`cli.py::process_command`和TUI的本地处理程序。本地TUI处理程序优先于网关调度。
4.  **命令持久化配置但未实时应用。** 对于TUI本地命令，更新`config.set`是不够的。还需立即修补相关的nanostore状态（通常是`patchUiState(...)`），并通过渲染组件传递任何新状态。示例：`/details collapsed`必须实时更新细节可见性，而不仅仅是保存`details_mode`；会话内的全局`/details <mode>`可能需要一个单独的命令覆盖标志，以便实时命令可以覆盖内置部分默认值，而启动/配置同步则保留默认的思考/工具展开行为。
5.  **网关调度静默忽略命令。** 网关只调度它知道的命令。检查`GATEWAY_KNOWN_COMMANDS`（自动从`COMMAND_REGISTRY`派生）是否包含规范名称。如果命令是`cli_only`且带有`gateway_config_gate`，请验证门控配置值是否为真值。

## 调试策略

当表层检查无法揭示问题时：

- **Python端挂起或行为异常：** 使用`python-debugpy`技能在`_SlashWorker.exec`或命令处理程序内部中断。在处理程序入口设置`remote-pdb`是最快的路径。
- **Ink端无反应：** 使用`node-inspect-debugger`技能在`app.tsx`的斜杠调度或本地命令分支中断。`npm run build`后执行`sb('dist/app.js', <line>)`。
- **注册表不匹配/不清楚哪边出错：** 将规范的`COMMAND_REGISTRY`条目与TUI的本地命令列表进行并排比较。

## 注意事项

- 不要忘记在`CommandDef`中为命令设置适当的类别（例如“Session”、“Configuration”、“Tools & Skills”、“Info”、“Exit”）
- 确保所有别名都正确注册在`aliases`元组中 — 不需要其他文件更改，下游所有内容（Telegram菜单、Slack映射、自动补全、帮助）都从中派生
- 对于带子命令的命令，确保`CommandDef`中的`subcommands`元组与TUI代码中的匹配
- `cli_only=True`的命令无法在网关/消息平台中工作 — 除非您添加一个`gateway_config_gate`且该门控为真值
- 添加实时UI状态后，搜索旧prop/helper的每个使用者，并通过所有渲染路径（而不仅仅是活动流式传输路径）传递新状态。TUI细节渲染至少有两个重要路径：实时`StreamingAssistant`/`ToolTrail`和转录/待处理`MessageLine`行。`/clean`传递应显式检查两者。
- 测试前重建TUI (`npm --prefix ui-tui run build`) — tsx监视模式可能在首次启动时滞后。

## 验证

修复后：

1.  重建TUI：
    ```bash
    cd /home/bb/hermes-agent && npm --prefix ui-tui run build
    ```

2.  运行TUI并测试命令：
    ```bash
    hermes --tui
    ```

3.  输入`/`并验证命令是否出现在自动补全建议中，带有预期的描述和参数提示。

4.  执行命令并确认：
    - 预期行为被触发
    - 任何持久化的配置正确更新（`read_file ~/.hermes/config.yaml`）
    - 实时UI状态立即反映更改（而不仅仅是重启后）

5.  如果命令也是网关可用的，从至少一个消息平台进行测试（或运行网关测试：`scripts/run_tests.sh tests/gateway/`）。