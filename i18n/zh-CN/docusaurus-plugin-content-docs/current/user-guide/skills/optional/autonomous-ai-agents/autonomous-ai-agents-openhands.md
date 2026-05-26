---
title: "Openhands — 将编码委托给 OpenHands CLI（模型无关，LiteLLM）"
sidebar_label: "Openhands"
description: "将编码委托给 OpenHands CLI（模型无关，LiteLLM）"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源 SKILL.md，而非本页面。 */}

# Openhands

将编码任务委托给 OpenHands CLI（模型无关，LiteLLM）。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/autonomous-ai-agents/openhands` 安装 |
| 路径 | `optional-skills/autonomous-ai-agents/openhands` |
| 版本 | `0.1.0` |
| 作者 | Tim Koepsel (xzessmedia), Hermes Agent |
| 许可证 | MIT |
| 平台 | linux, macos |
| 标签 | `Coding-Agent`, `OpenHands`, `Model-Agnostic`, `LiteLLM` |
| 相关技能 | [`claude-code`](/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-claude-code), [`codex`](/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-codex), [`opencode`](/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-opencode), [`hermes-agent`](/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent) |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这就是技能激活时，智能体看到的指令。
:::

# OpenHands CLI

通过 `terminal` 工具将编码任务委托给 [OpenHands CLI](https://github.com/All-Hands-AI/OpenHands)。OpenHands 是模型无关的：支持任何 LiteLLM 兼容的供应商（OpenAI、Anthropic、OpenRouter、DeepSeek、Ollama、vLLM 等）。

此技能是用于批处理/一次性委托的无界面模式包装器。交互式文本界面在 Hermes 中不使用。

## 何时使用

- 用户希望将编码任务专门委托给 OpenHands。
- 用户希望使用一个可以在非 Anthropic / 非 OpenAI 供应商（DeepSeek、Qwen、Ollama、vLLM、Nous 等）上运行的编码智能体——同类技能 `claude-code` 和 `codex` 仅限于单一供应商。
- 在工作区内进行多步骤文件编辑 + Shell 命令。

对于 Claude 原生，优先使用 `claude-code`。对于 OpenAI 原生，优先使用 `codex`。对于 Hermes 原生子智能体，使用 `delegate_task`。

## 前提条件

1.  安装上游包（需要 Python 3.12+ 和 `uv`）：

    ```
    terminal(command="uv tool install openhands --python 3.12")
    ```

    验证：`openhands --version`（撰写时为 `OpenHands CLI 1.16.0` / `SDK v1.21.0`）。

2.  选择一个模型并为 `--override-with-envs` 设置环境变量：

    ```
    export LLM_MODEL=openrouter/openai/gpt-4o-mini       # 或任何 LiteLLM 标识符
    export LLM_API_KEY=$OPENROUTER_API_KEY
    export LLM_BASE_URL=https://openrouter.ai/api/v1     # 对于原生 OpenAI 可省略
    ```

    `LLM_MODEL` 使用 LiteLLM 的完整标识符。当供应商是 OpenRouter 时，标识符带有双重前缀：`openrouter/<vendor>/<model>`（例如 `openrouter/anthropic/claude-sonnet-4.5`）。对于原生 Anthropic：`anthropic/claude-sonnet-4-5`。对于原生 OpenAI：`openai/gpt-4o-mini`。

3.  抑制启动横幅，使 JSON 输出前不会出现 ASCII 艺术字：

    ```
    export OPENHANDS_SUPPRESS_BANNER=1
    ```

## 如何运行

始终通过 `terminal` 工具调用。为了自动化，始终传递 `--headless --json --override-with-envs --exit-without-confirmation`。

### 一次性任务

```
terminal(
  command="OPENHANDS_SUPPRESS_BANNER=1 LLM_MODEL=openrouter/openai/gpt-4o-mini LLM_API_KEY=$OPENROUTER_API_KEY LLM_BASE_URL=https://openrouter.ai/api/v1 openhands --headless --json --override-with-envs --exit-without-confirmation -t '为 src/ 中的所有 API 调用添加错误处理'",
  workdir="/path/to/project",
  timeout=600
)
```

### 长时间任务后台运行

```
terminal(command="<同上>", workdir="/path/to/project", background=true, notify_on_complete=true)
process(action="poll", session_id="<id>")
process(action="log", session_id="<id>")
```

### 恢复之前的对话

OpenHands 在每次运行结束时会打印 `Conversation ID: <32-hex>` 和一行 `Hint: openhands --resume <dashed-uuid>`。使用带连字符的格式进行恢复：

```
terminal(
  command="OPENHANDS_SUPPRESS_BANNER=1 LLM_MODEL=... openhands --headless --json --override-with-envs --exit-without-confirmation --resume <dashed-uuid> -t '现在修复你发现的 bug'",
  workdir="/path/to/project"
)
```

## 完整标志列表

根据 `openhands --help`（CLI 1.16.0）验证。此表中未列出的内容均不是标志——请通过环境变量或设置文件传递。

| 标志 | 效果 |
|------|--------|
| `--headless` | 无界面模式，需要 `-t` 或 `-f`。自动批准所有操作（此模式下无 `--llm-approve`）。 |
| `--json` | JSONL 事件流（需要 `--headless`）。 |
| `-t TEXT` | 任务提示。 |
| `-f PATH` | 从文件读取任务。 |
| `--resume [ID]` | 恢复对话。无 ID 则列出最近对话。 |
| `--last` | 恢复最近对话（与 `--resume` 一起使用）。 |
| `--override-with-envs` | 应用 `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL` 环境变量。不使用此标志时，OpenHands 使用 `~/.openhands/settings.json` 并忽略环境变量。 |
| `--exit-without-confirmation` | 不显示 "确定要退出吗" 的对话框。 |
| `--always-approve` / `--yolo` | 自动批准每个操作（`--headless` 下的默认行为）。 |
| `--llm-approve` | 基于 LLM 的安全门（仅限交互模式——在无界面模式下 **无效**）。 |
| `--version` / `-v` | 打印版本并退出。 |

**没有 `--model`、`--max-iterations`、`--workspace`、`--sandbox`、`--sandbox-type` 标志。** 模型通过 `LLM_MODEL` 设置。工作区是你传递给 `terminal` 工具的 `workdir`。沙盒/运行时通过 `RUNTIME` 和 `SANDBOX_VOLUMES` 环境变量设置。

## JSON 事件模式

使用 `--json --headless` 时，OpenHands 发出 JSONL——每行一个 JSON 对象，外加少量非 JSON 状态行（`Initializing agent...`、`Agent is working`、`Agent finished`、最终的摘要框、`Goodbye!`、`Conversation ID:`、`Hint:`）。筛选以 `{` 开头的行。

顶层的 `kind` 字段区分事件类型：

- `MessageEvent` — 用户/智能体文本轮次。`source` 为 `user` 或 `agent`。
- `ActionEvent` — 智能体选择了一个工具。读取 `tool_name`（`file_editor`、`terminal`、`finish`）和 `action.kind`（`FileEditorAction`、`TerminalAction`、`FinishAction`）。
- `ObservationEvent` — 工具结果。`observation.is_error` 是成功标志。`source` 为 `environment`。
- `ActionEvent` 中的 `FinishAction` 在 `action.message` 中包含智能体的最终消息。

CLI 会先打印所有来自 LiteLLM/Authlib 的 stderr 输出——参见陷阱。仅逐行解析 stdout，忽略不以 `{` 开头的行。

## 陷阱

- **每次调用时出现 LiteLLM 警告。** CLI 会向 stderr 打印 `bedrock-runtime` 和 `sagemaker-runtime` 警告，因为未安装 `botocore`。还有一个 Authlib 弃用警告。这些是噪音，不是错误。将 stderr 管道重定向到 `/dev/null` 或在显示给用户之前过滤掉。
- **横幅干扰。** 不设置 `OPENHANDS_SUPPRESS_BANNER=1`，每次运行都会以一个宣传 SDK 的多行 `+--+` ASCII 框开头。务必导出此变量。
- **自动化模式下 `--override-with-envs` 是强制性的。** 不使用它，OpenHands 会忽略 `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL`，并回退到 `~/.openhands/settings.json`。在全新安装时，此文件不存在，CLI 会挂起等待首次运行设置。
- **模型标识符是 LiteLLM 的，不是供应商的。** `openrouter/openai/gpt-4o-mini` 有效；而指向 OpenRouter 时使用 `openai/gpt-4o-mini` 则无效。`anthropic/claude-sonnet-4-5`（连字符）是原生 Anthropic；`openrouter/anthropic/claude-sonnet-4.5`（点）是通过 OpenRouter。弄错会导致晦涩的 LiteLLM 400 错误。
- **`pip install openhands-ai` 是错误的包。** 这是旧版 V0 SDK。新的 CLI 是 `uv tool install openhands --python 3.12`。没有维护的 conda 包。
- **恢复 ID 格式很棘手。** CLI 结束时打印 `Conversation ID: f46573d9cfdb45e492ca189bde40019b`（无连字符），然后是一行 `Hint: openhands --resume f46573d9-cfdb-45e4-92ca-189bde40019b`（带连字符）。使用带连字符的格式。
- **无界面模式忽略 `--llm-approve`。** 如果传递它，会得到一个 argparse 错误。无界面模式硬编码为始终批准。
- **上游不支持 Windows。** OpenHands 文档在 Windows 上要求使用 WSL。此技能相应地限制为 `[linux, macos]`。
- **`~/.openhands/conversations/<id>/` 会累积。** 每次运行都会持久化一个轨迹。如果批量运行，请清理它。
- **安装包较大（约 200 个包）。** 使用 `uv tool install`（隔离的虚拟环境）以避免与活动项目发生依赖冲突。

## 验证

```
terminal(
  command="OPENHANDS_SUPPRESS_BANNER=1 LLM_MODEL=openrouter/openai/gpt-4o-mini LLM_API_KEY=$OPENROUTER_API_KEY LLM_BASE_URL=https://openrouter.ai/api/v1 openhands --headless --json --override-with-envs --exit-without-confirmation -t '通过 terminal 工具将字符串 OPENHANDS_OK 打印到标准输出。'",
  workdir="/tmp",
  timeout=120
)
```

如果 JSONL 流以一个 `FinishAction` 结束，并且其 `action.message` 提到了 `OPENHANDS_OK`，则说明安装成功。

## 相关链接

- [OpenHands GitHub](https://github.com/All-Hands-AI/OpenHands)
- [OpenHands CLI 命令参考](https://docs.openhands.dev/openhands/usage/cli/command-reference)
- 同类技能：`claude-code`（仅限 Anthropic）、`codex`（仅限 OpenAI）、`opencode`（通过 OpenCode 的多供应商支持）、`hermes-agent`（通过 `delegate_task` 的 Hermes 子智能体）。