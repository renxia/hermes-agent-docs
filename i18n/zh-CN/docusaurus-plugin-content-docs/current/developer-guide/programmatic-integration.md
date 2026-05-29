---
sidebar_position: 8
title: "程序化集成"
description: "三种用于从外部程序驱动 hermes 智能体的协议：ACP、TUI 网关 JSON-RPC 和 OpenAI 兼容的 HTTP API"
---

# 程序化集成

Hermes 提供三种协议用于从外部程序驱动智能体 —— IDE 插件、自定义 UI、CI 流水线、内嵌子智能体等。选择最适合你传输方式和使用场景的协议。

| 协议 | 传输方式 | 最适用场景 | 定义位置 |
|----------|-----------|----------|------------|
| **ACP** | 基于 stdio 的 JSON-RPC | 已支持 [Agent Client Protocol](https://github.com/zed-industries/agent-client-protocol) 的 IDE 客户端（VS Code、Zed、JetBrains） | `acp_adapter/` |
| **TUI 网关** | 基于 stdio（或 WebSocket）的 JSON-RPC | 需要对会话、斜杠命令、审批和流式事件进行细粒度控制的自定义宿主 | `tui_gateway/server.py` |
| **API 服务器** | HTTP + Server-Sent Events | OpenAI 兼容的前端（Open WebUI、LobeChat、LibreChat…）以及语言无关的 Web 客户端 | `gateway/platforms/api_server.py` |

三者驱动的是同一个 `AIAgent` 核心，区别仅在于线上格式和暴露的功能集。

---

## ACP（Agent Client Protocol）

`hermes acp` 启动一个基于 stdio 的 JSON-RPC 服务器，使用 ACP 协议。目前在 VS Code（Zed Industries 的 ACP 扩展）、Zed 以及任何安装了 ACP 插件的 JetBrains IDE 中投入生产使用。

暴露的能力包括：会话创建、提示提交、流式智能体消息分块、工具调用事件、权限请求、会话分叉、取消和身份验证。工具输出会被渲染为 IDE 可理解的 ACP `Diff`/`ToolCall` 内容块。

完整生命周期、事件桥接和审批流程请参阅：[ACP 内部机制](./acp-internals)。

```bash
hermes acp                  # 在 stdio 上提供 ACP 服务
hermes acp --bootstrap      # 打印适用于支持 ACP 的 IDE 的安装代码片段
```

---

## TUI 网关 JSON-RPC

`tui_gateway/server.py` 是 Ink TUI（`hermes --tui`）和内嵌仪表盘 PTY 桥接器所使用的协议。任何外部宿主都可以通过 stdio（或通过 `tui_gateway/ws.py` 使用 WebSocket）使用同一协议进行通信。

### 方法目录（部分）

```
prompt.submit           prompt.background       session.steer
session.create          session.list            session.active_list
session.activate        session.close           session.interrupt
session.history         session.compress        session.branch
session.title           session.usage           session.status
clarify.respond         sudo.respond            secret.respond
approval.respond        config.set / config.get commands.catalog
command.resolve         command.dispatch        cli.exec
reload.mcp              reload.env              process.stop
delegation.status       subagent.interrupt      spawn_tree.save / list / load
terminal.resize         clipboard.paste         image.attach
```

`session.active_list`、`session.activate` 和 `session.close` 是 TUI 会话切换器使用的进程本地实时会话控制方法。使用 `session.list` / `/resume` 来发现已保存的对话记录；仅对当前在 TUI 网关进程中打开的会话使用实时会话方法。

### 流式返回的事件

`message.delta`、`message.complete`、`tool.start`、`tool.progress`、`tool.complete`、`approval.request`、`clarify.request`、`sudo.request`、`secret.request`、`gateway.ready`，以及会话生命周期和错误事件。

### Pi 风格 RPC 映射

Pi-mono RPC 规范（[issue #360](https://github.com/NousResearch/hermes-agent/issues/360)）中的每个命令都有对应的 TUI 网关等效方法：

| Pi 命令 | Hermes 等效方法 |
|------------|-------------------|
| `prompt` | `prompt.submit`（或 ACP `session/prompt`） |
| `steer` | `session.steer` |
| `follow_up` | 在当前轮次之后排队的 `prompt.submit` |
| `abort` | `session.interrupt` |
| `set_model` | 使用 `/model <provider:model>` 的 `command.dispatch`（会话中途，持久生效） |
| `compact` | `session.compress` |
| `get_state` | `session.status` |
| `get_messages` | `session.history` |
| `switch_session` | `session.resume` |
| `fork` | `session.branch` |
| `ui_request` / `ui_response` | `clarify.respond` / `sudo.respond` / `secret.respond` / `approval.respond` |

---

## OpenAI 兼容 API 服务器

`gateway/platforms/api_server.py` 通过 HTTP 暴露 hermes，供任何已支持 OpenAI 格式的客户端使用。当你需要 Web 前端、基于 curl 的 CI 运行器或非 Python 消费者时非常有用。

端点：

```
POST /v1/chat/completions        OpenAI Chat Completions（通过 SSE 流式传输）
POST /v1/responses               OpenAI Responses API（有状态）
POST /v1/runs                    启动一次运行，返回 run_id（202）
GET  /v1/runs/{id}               运行状态
GET  /v1/runs/{id}/events        生命周期事件的 SSE 流
POST /v1/runs/{id}/approval      解决待处理的审批
POST /v1/runs/{id}/stop          中断运行
GET  /v1/capabilities            机器可读的功能标志
GET  /v1/models                  列出 hermes-agent
GET  /health, /health/detailed
```

设置、请求头（`X-Hermes-Session-Id`、`X-Hermes-Session-Key`）和前端对接请参阅：[API 服务器](../user-guide/features/api-server)。

---

## 我该选择哪一个？

- **你正在编写 IDE 插件，且该 IDE 已支持 ACP** → ACP。IDE 端零协议适配工作。
- **你正在编写自定义桌面/Web/TUI 宿主，并且需要使用 Hermes 的全部功能**（斜杠命令、审批、澄清、多智能体、会话分叉） → TUI 网关 JSON-RPC。
- **你需要任何 OpenAI 兼容的前端、语言无关的 HTTP 客户端或基于 curl 的自动化** → API 服务器。
- **你需要在 Python 进程内直接嵌入，不使用子进程** → 直接导入 `run_agent.AIAgent`。参见 [智能体循环](./agent-loop)。

---

## 模型热切换

会话中途切换模型在所有平台上均可使用 —— 底层就是 `/model` 斜杠命令。

- **CLI / TUI：** `/model claude-sonnet-4` 或 `/model openrouter:anthropic/claude-sonnet-4.6`
- **TUI 网关 RPC：** 使用 `{"command": "/model claude-sonnet-4"}` 的 `command.dispatch`
- **ACP：** IDE 将斜杠命令作为提示发送；智能体会分派处理
- **API 服务器：** 在请求体中包含 `model` 字段或设置 `X-Hermes-Model` 请求头

内置提供商感知解析（相同的模型名称会为当前使用的提供商选择正确的格式）。参见 `hermes_cli/model_switch.py`。

---

## 关于 `--mode rpc` 的说明

Hermes 没有 `--mode rpc` 标志。上述三种协议已覆盖所有使用场景 —— ACP 用于 IDE 协议客户端，TUI 网关用于基于 stdio 的 JSON-RPC 宿主，API 服务器用于 HTTP。如果你发现它们都无法满足的真实缺口，请提出一个 issue 并说明你正在构建的具体消费者。