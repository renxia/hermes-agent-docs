---
title: "调试 Hermes Tui 命令 — 调试 Hermes TUI 斜杠命令：Python、网关、Ink UI"
sidebar_label: "调试 Hermes Tui 命令"
description: "调试 Hermes TUI 斜杠命令：Python、网关、Ink UI"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 调试 Hermes Tui 命令

调试 Hermes TUI 斜杠命令：Python、网关、Ink UI。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/software-development/debugging-hermes-tui-commands` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `debugging`, `hermes-agent`, `tui`, `slash-commands`, `typescript`, `python` |
| 相关技能 | [`python-debugpy`](/user-guide/skills/bundled/software-development/software-development-python-debugpy), [`node-inspect-debugger`](/user-guide/skills/bundled/software-development/software-development-node-inspect-debugger), [`systematic-debugging`](/user-guide/skills/bundled/software-development/software-development-systematic-debugging) |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 调试 Hermes TUI 斜杠命令

## 概述

Hermes 斜杠命令跨越三个层——Python 命令注册表、tui_gateway JSON-RPC 桥接层和 Ink/TypeScript 前端。当命令行为异常（在自动补全中缺失、在 CLI 中工作但在 TUI 中不工作、配置持久化但 UI 不更新）时，问题几乎总是某一层与另一层不同步。

当您在 Hermes TUI 中遇到斜杠命令问题时，尤其是在命令未显示在自动补全中、在 TUI 中无法正常工作或需要添加/更新时，请使用此技能。

## 何时使用

- 斜杠命令存在于代码库的某一部分但无法完全工作
- 一个命令需要同时添加到后端和前端
- 特定命令的自动补全不工作
- 命令在 CLI 和 TUI 之间的行为不一致
- 一个命令持久化了配置但无法在 TUI 中实时应用

## 架构概述

<!-- ascii-guard-ignore -->
```
Python 后端 (hermes_cli/commands.py)     <- 规范的 COMMAND_REGISTRY
       │
       ▼
TUI 网关 (tui_gateway/server.py)         <- slash.exec / command.dispatch
       │
       ▼
TUI 前端 (ui-tui/src/app/slash/)        <- 本地处理程序 + 回退
```
<!-- ascii-guard-ignore-end -->

命令定义必须在 Python 和 TypeScript 之间一致地注册才能正常工作。Python 的 `COMMAND_REGISTRY` 是以下内容的权威来源：CLI 分发、网关帮助、Telegram BotCommand 菜单、Slack 子命令映射以及发送到 Ink 的自动补全数据。

## 调查步骤

1.  **检查命令是否存在于 TUI 前端：**
    ```bash
    search_files --pattern "/commandname" --file_glob "*.ts" --path ui-tui/
    search_files --pattern "/commandname" --file_glob "*.tsx" --path ui-tui/
    ```

2.  **检查 TUI 命令定义：**
    ```bash
    read_file ui-tui/src/app/slash/commands/core.ts
    # 如果不在那里：
    search_files --pattern "commandname" --path ui-tui/src/app/slash/commands --target files
    ```

3.  **检查命令是否存在于 Python 后端：**
    ```bash
    search_files --pattern "CommandDef" --file_glob "*.py" --path hermes_cli/
    search_files --pattern "commandname" --path hermes_cli/commands.py --context 3
    ```

4.  **检查网关实现：**
    ```bash
    search_files --pattern "complete.slash|slash.exec" --path tui_gateway/
    ```

## 修复：命令自动补全缺失

如果一个命令存在于 TUI 中但未显示在自动补全中：

1.  在 `hermes_cli/commands.py` 的 `COMMAND_REGISTRY` 中添加一个 `CommandDef` 条目：
    ```python
    CommandDef("commandname", "命令的描述", "Session",
               cli_only=True, aliases=("alias",),
               args_hint="[arg1|arg2|arg3]",
               subcommands=("arg1", "arg2", "arg3")),
    ```

2.  仔细选择 `cli_only` 还是网关可用性：
    - `cli_only=True` — 仅在交互式 CLI/TUI 中
    - `gateway_only=True` — 仅在消息平台中
    - 都不设置 — 随处可用
    - `gateway_config_gate="display.foo"` — 网关中基于配置的可用性

3.  确保 `subcommands` 与 TUI 显示的预期制表符补全选项匹配。

4.  如果命令在服务器端运行，在 `cli.py` 的 `HermesCLI.process_command()` 中添加一个处理程序：
    ```python
    elif canonical == "commandname":
        self._handle_commandname(cmd_original)
    ```

5.  对于网关可用的命令，在 `gateway/run.py` 中添加一个处理程序：
    ```python
    if canonical == "commandname":
        return await self._handle_commandname(event)
    ```

## 常见问题

1.  **命令显示在 TUI 中但不在自动补全中。** 该命令在 TUI 代码库中定义，但在 `hermes_cli/commands.py` 的 `COMMAND_REGISTRY` 中缺失。自动补全数据来自 Python。

2.  **命令显示在自动补全中但无法工作。** 检查 `tui_gateway/server.py` 中的命令处理程序和 `ui-tui/src/app/createSlashHandler.ts` 中的前端处理程序。如果该命令在 Ink 中仅限本地，则必须在 `app.tsx` 的内置分支中处理；否则它会回退到 `slash.exec` 并且必须有一个 Python 处理程序。

3.  **命令在 CLI 和 TUI 之间行为不同。** 该命令可能有不同的实现。请同时检查 `cli.py::process_command` 和 TUI 的本地处理程序。本地 TUI 处理程序优先于网关分发。

4.  **命令持久化了配置但无法实时应用。** 对于仅限 TUI 的命令，更新 `config.set` 是不够的。还需要立即修补相关的 nanostore 状态（通常是 `patchUiState(...)`）并通过渲染组件传递任何新状态。例如：`/details collapsed` 必须实时更新详细信息可见性，而不仅仅是保存 `details_mode`；会话内的全局 `/details <mode>` 可能需要一个单独的命令覆盖标志，以便实时命令可以覆盖内置部分的默认值，同时启动/配置同步保留默认展开思考/工具的行为。

5.  **网关分发静默忽略了该命令。** 网关只分发它知道的命令。检查 `GATEWAY_KNOWN_COMMANDS`（自动从 `COMMAND_REGISTRY` 派生）是否包含规范名称。如果命令是 `cli_only` 且带有 `gateway_config_gate`，请验证门控的配置值是否为真值。

## 调试策略

当表面检查无法发现错误时：

-   **Python 端挂起或行为异常：** 使用 `python-debugpy` 技能在 `_SlashWorker.exec` 或命令处理程序内部中断。在处理程序入口设置 `remote-pdb` 是最快的途径。
-   **Ink 端无反应：** 使用 `node-inspect-debugger` 技能在 `app.tsx` 的斜杠分发或本地命令分支中断。运行 `npm run build` 后使用 `sb('dist/app.js', <行号>)`。
-   **注册表不匹配/不确定哪一边出错：** 将规范的 `COMMAND_REGISTRY` 条目与 TUI 的本地命令列表进行并排比较。

## 注意事项

-   不要忘记在 `CommandDef` 中为命令设置适当的类别（例如 "Session"、"Configuration"、"Tools & Skills"、"Info"、"Exit"）
-   确保任何别名都正确注册在 `aliases` 元组中——不需要其他文件更改，所有下游（Telegram 菜单、Slack 映射、自动补全、帮助）都从中派生
-   对于带子命令的命令，确保 `CommandDef` 中的 `subcommands` 元组与 TUI 代码中的匹配
-   `cli_only=True` 命令在网关/消息平台中无法工作——除非您添加了 `gateway_config_gate` 且该门控为真值
-   添加实时 UI 状态后，搜索旧属性/帮助函数的每个消费者，并通过所有渲染路径传递新状态，而不仅仅是活动流路径。TUI 详细信息渲染至少有两个重要路径：实时的 `StreamingAssistant`/`ToolTrail` 和转录/待处理的 `MessageLine` 行。`/clean` 过程应显式检查两者。
-   测试前重新构建 TUI（`npm --prefix ui-tui run build`）——tsx 监视模式可能在首次启动时滞后。

## 验证

修复后：

1.  重新构建 TUI：
    ```bash
    cd /home/bb/hermes-agent && npm --prefix ui-tui run build
    ```

2.  运行 TUI 并测试命令：
    ```bash
    hermes --tui
    ```

3.  输入 `/` 并验证该命令出现在自动补全建议中，并带有预期的描述和参数提示。

4.  执行该命令并确认：
    -   预期行为触发
    -   任何持久化的配置正确更新（`read_file ~/.hermes/config.yaml`）
    -   实时 UI 状态立即反映更改（而不仅仅是在重启后）

5.  如果该命令也适用于网关，请从至少一个消息平台测试它（或运行网关测试：`scripts/run_tests.sh tests/gateway/`）。