---
sidebar_position: 8
title: "编程式集成"
description: "三种从外部程序驱动 hermes 智能体的协议：ACP、TUI 网关 JSON-RPC 和兼容 OpenAI 的 HTTP API"
---

# 编程式集成

Hermes 提供了三种协议，用于从外部程序（如 IDE 插件、自定义 UI、CI 流水线、嵌入式子智能体）驱动其智能体。请选择最适合你传输方式和消费者需求的协议。

| 协议 | 传输方式 | 最适用于 | 定义位于 |
|------|----------|----------|----------|
| **ACP** | 基于 stdio 的 JSON-RPC | 已支持 [智能体客户端协议](https://github.com/zed-industries/agent-client-protocol) 的 IDE 客户端（VS Code、Zed、JetBrains） | `acp_adapter/` |
| **TUI 网关** | 基于 stdio（或 WebSocket）的 JSON-RPC | 希望精细控制会话、斜杠命令、审批和流式事件的自定义宿主 | `tui_gateway/server.py` |
| **API 服务器** | HTTP + 服务器发送事件 | 兼容 OpenAI 的前端（如 Open WebUI、LobeChat、LibreChat…）以及与语言无关的 Web 客户端 | `gateway/platforms/api_server.py` |

这三者驱动的是同一个 `AIAgent` 核心。它们仅在线路格式和暴露的功能集上有所不同。

---

## ACP（智能体客户端协议）

`hermes acp` 启动一个基于 stdio 的 JSON-RPC 服务器，该服务器使用 ACP 协议。目前已被 VS Code（Zed Industries 的 ACP 扩展）、Zed 以及任何装有 ACP 插件的 JetBrains IDE 在生产环境中使用。

暴露的功能包括：会话创建、提示提交、流式智能体消息块、工具调用事件、权限请求、会话分叉、取消和身份验证。工具输出会被渲染为 IDE 能够理解的 ACP `Diff`/`ToolCall` 内容块。

完整的生命周期、事件桥接和审批流程：[ACP 内部机制](./acp-internals)。

```bash
hermes acp                  # 在 stdio 上提供 ACP 服务
hermes acp --bootstrap      # 打印适用于支持 ACP 的 IDE 的安装代码片段
```

---

## TUI 网关 JSON-RPC

`tui_gateway/server.py` 是 Ink TUI (`hermes --tui`) 和内嵌仪表盘 PTY 桥所使用的协议。任何外部宿主都可以通过 stdio（或通过 `tui_gateway/ws.py` 使用 WebSocket）使用相同的协议。

### 方法目录（部分）

```
prompt.submit           prompt.background       session.steer
session.create          session.list            session.interrupt
session.history         session.compress        session.branch
session.title           session.usage           session.status
clarify.respond         sudo.respond            secret.respond
approval.respond        config.set / config.get commands.catalog
command.resolve         command.dispatch        cli.exec
reload.mcp              reload.env              process.stop
delegation.status       subagent.interrupt      spawn_tree.save / list / load
terminal.resize         clipboard.paste         image.attach
```

### 流式回传的事件

`message.delta`、`message.complete`、`tool.start`、`tool.progress`、`tool.complete`、`approval.request`、`clarify.request`、`sudo.request`、`secret.request`、`gateway.ready`，以及会话生命周期和错误事件。

### Pi 风格的 RPC 映射

Pi-mono RPC 规范（[issue #360](https://github.com/NousResearch/hermes-agent/issues/360)）中的每个命令在 TUI 网关中都有对应的等效项：

| Pi 命令 | Hermes 等效命令 |
|---------|----------------|
| `prompt` | `prompt.submit` (或 ACP `session/prompt`) |
| `steer` | `session.steer` |
| `follow_up` | 在当前轮次后排队执行的 `prompt.submit` |
| `abort` | `session.interrupt` |
| `set_model` | `command.dispatch` 执行 `/model <provider:model>` (会话中，持久化) |
| `compact` | `session.compress` |
| `get_state` | `session.status` |
| `get_messages` | `session.history` |
| `switch_session` | `session.resume` |
| `fork` | `session.branch` |
| `ui_request` / `ui_response` | `clarify.respond` / `sudo.respond` / `secret.respond` / `approval.respond` |

---

## 兼容 OpenAI 的 API 服务器

`gateway/platforms/api_server.py` 通过 HTTP 为任何已支持 OpenAI 格式的客户端暴露 hermes 功能。当你需要 Web 前端、由 curl 驱动的 CI 运行器或非 Python 消费者时，这非常有用。

端点：

```
POST /v1/chat/completions        OpenAI 聊天补全（通过 SSE 流式传输）
POST /v1/responses               OpenAI Responses API（有状态）
POST /v1/runs                    启动一次运行，返回 run_id (202)
GET  /v1/runs/{id}               运行状态
GET  /v1/runs/{id}/events        生命周期事件的 SSE 流
POST /v1/runs/{id}/approval      解决待处理的审批
POST /v1/runs/{id}/stop          中断运行
GET  /v1/capabilities            机器可读的功能标志
GET  /v1/models                  列出 hermes-agent
GET  /health, /health/detailed
```

设置、请求头（`X-Hermes-Session-Id`、`X-Hermes-Session-Key`）以及前端接入：[API 服务器](../user-guide/features/api-server)。

---

## 我应该使用哪个？

- **你正在编写一个 IDE 插件，并且该 IDE 已支持 ACP** → 使用 ACP。IDE 端无需任何协议工作。
- **你正在编写一个自定义桌面/Web/TUI 宿主，并希望使用 Hermes 的所有功能**（斜杠命令、审批、澄清、多智能体、会话分叉）→ 使用 TUI 网关 JSON-RPC。
- **你希望使用任何兼容 OpenAI 的前端、与语言无关的 HTTP 客户端或 curl 驱动的自动化工具** → 使用 API 服务器。
- **你希望在 Python 进程内嵌入而不使用子进程** → 直接导入 `run_agent.AIAgent`。参见[智能体循环](./agent-loop)。

---

## 模型热切换

会话中的模型切换在所有接口上都有效——其底层是 `/model` 斜杠命令。

- **CLI / TUI:** `/model claude-sonnet-4` 或 `/model openrouter:anthropic/claude-sonnet-4.6`
- **TUI 网关 RPC:** 使用 `{"command": "/model claude-sonnet-4"}` 执行 `command.dispatch`
- **ACP:** IDE 将斜杠命令作为提示发送；智能体会调度它
- **API 服务器:** 在请求体中包含 `model` 字段或设置 `X-Hermes-Model`

内置提供者感知解析（相同的模型名称会为你当前使用的提供者选择正确的格式）。详见 `hermes_cli/model_switch.py`。

---

## 关于 `--mode rpc` 的说明

Hermes 没有 `--mode rpc` 标志。上面的三种协议已经覆盖了所有用例——ACP 用于 IDE 协议客户端，TUI 网关用于基于 stdio 的 JSON-RPC 宿主，API 服务器用于 HTTP。如果你发现一个它们都无法满足的真实缺口，请为你正在构建的具体消费者提交一个 issue。