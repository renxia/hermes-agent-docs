# 浏览器CDP监控器 — 设计

**状态：** 已发布 (PR 14540)
**最后更新：** 2026-04-23
**作者：** @teknium1

## 问题

原生JS对话框（`alert`/`confirm`/`prompt`/`beforeunload`）和iframe是我们浏览器工具中的两大最大缺口：

1. **对话框阻塞JS线程。** 页面上的任何操作都会停滞，直到对话框被处理。在这项工作之前，智能体无法知道对话框是否已打开——后续的工具调用会挂起或抛出不透明的错误。
2. **Iframe是不可见的。** 智能体可以在DOM快照中看到iframe节点，但无法在它们内部点击、输入或求值——尤其是跨域（OOPIF）iframe，这些iframe存在于单独的Chromium进程中。

[PR #12550](https://github.com/NousResearch/hermes-agent/pull/12550) 提出了一个无状态的 `browser_dialog` 包装器。这并不能解决检测问题——它是一个更简洁的CDP调用，用于当智能体已经知道（通过症状）对话框打开时。已关闭，因为已被取代。

## 后端能力矩阵（已于 2026-04-23 实时验证）

使用一次性探测脚本针对一个 data-URL 页面进行测试，该页面在主框架和同源 srcdoc iframe 中触发 alert，同时包含一个跨域 `https://example.com` iframe：

| 后端 | 对话框检测 | 对话框响应 | 框架树 | OOPIF `Runtime.evaluate`（通过 `browser_cdp(frame_id=...)`） |
|---|---|---|---|---|
| 本地 Chrome（`--remote-debugging-port`）/ `/browser connect` | ✓ | ✓ 完整工作流 | ✓ | ✓ |
| Browserbase | ✓（通过桥接） | ✓ 完整工作流（通过桥接） | ✓ | ✓（已通过真实跨域 iframe 验证 `document.title = "Example Domain"`） |
| Camofox | ✗ 无 CDP（仅 REST） | ✗ | 通过 DOM 快照部分支持 | ✗ |

**Browserbase 响应机制的工作原理。** Browserbase 的 CDP 代理内部使用 Playwright，并在约 10ms 内自动关闭原生对话框，因此 `Page.handleJavaScriptDialog` 无法及时响应。为解决此问题，主管通过 `Page.addScriptToEvaluateOnNewDocument` 注入一个桥接脚本，将 `window.alert`/`confirm`/`prompt` 替换为对魔术主机（`hermes-dialog-bridge.invalid`）的同步 XHR 请求。`Fetch.enable` 在这些 XHR 触及网络之前拦截它们——对话框变为 `Fetch.requestPaused` 事件，由主管捕获，`respond_to_dialog` 通过 `Fetch.fulfillRequest` 以 JSON 主体填充响应，注入的脚本会对其进行解码。

最终效果：从页面的角度看，`prompt()` 仍然返回智能体提供的字符串。从智能体的角度看，无论是哪种方式，都是相同的 `browser_dialog(action=...)` API。已在真实 Browserbase 会话中端到端测试——4/4（alert/prompt/confirm-accept/confirm-dismiss）全部通过，包括值回传至页面 JS。

Camofox 在此 PR 中暂不支持；后续将在 `jo-inc/camofox-browser` 上提交上游 issue，请求添加对话框轮询端点。

## 架构

### CDPSupervisor

每个 Hermes `task_id` 在后台守护线程中运行一个 `asyncio.Task`。保持与后端 CDP 端点的持久 WebSocket 连接。维护：

- **对话框队列** — `List[PendingDialog]`，包含 `{id, type, message, default_prompt, session_id, opened_at}`
- **框架树** — `Dict[frame_id, FrameInfo]`，包含父子关系、URL、源、是否为跨域子会话
- **会话映射** — `Dict[session_id, SessionInfo]`，使交互工具能路由到正确的已附加会话以执行 OOPIF 操作
- **近期控制台错误** — 最近 50 条的环形缓冲区（用于 PR 2 诊断）

附加时订阅：
- `Page.enable` — `javascriptDialogOpening`、`frameAttached`、`frameNavigated`、`frameDetached`
- `Runtime.enable` — `executionContextCreated`、`consoleAPICalled`、`exceptionThrown`
- `Target.setAutoAttach {autoAttach: true, flatten: true}` — 显示子 OOPIF 目标；主管为每个目标启用 `Page`+`Runtime`

通过快照锁实现线程安全的状态访问；工具处理器（同步）读取冻结的快照而无需等待。

### 生命周期

- **启动：** `SupervisorRegistry.get_or_start(task_id, cdp_url)` — 由 `browser_navigate`、Browserbase 会话创建、`/browser connect` 调用。幂等。
- **停止：** 会话拆卸或 `/browser disconnect`。取消 asyncio 任务，关闭 WebSocket，丢弃状态。
- **重绑定：** 如果 CDP URL 发生变化（用户重新连接到新的 Chrome），停止旧主管并重新启动——永不跨端点复用状态。

### 对话框策略

通过 `config.yaml` 中的 `browser.dialog_policy` 配置：

- **`must_respond`**（默认）— 捕获，在 `browser_snapshot` 中展示，等待显式的 `browser_dialog(action=...)` 调用。300 秒安全超时后无响应则自动关闭并记录日志。防止有缺陷的智能体永久阻塞。
- `auto_dismiss` — 记录并立即关闭；智能体之后通过 `browser_snapshot` 中的 `browser_state` 事后查看。
- `auto_accept` — 记录并接受（适用于 `beforeunload` 场景，用户希望干净地离开页面）。

策略按任务划分；v1 中不支持按对话框覆盖。

## 智能体接口（PR 1）

### 一个新工具

```
browser_dialog(action, prompt_text=None, dialog_id=None)
```

- `action="accept"` / `"dismiss"` → 响应指定的或唯一的待处理对话框（必填）
- `prompt_text=...` → 向 `prompt()` 对话框提供的文本
- `dialog_id=...` → 当多个对话框排队时用于消歧（少见）

该工具仅用于响应。智能体在调用前从 `browser_snapshot` 输出中读取待处理对话框。

### `browser_snapshot` 扩展

当主管已附加时，在现有快照输出中添加三个可选字段：

```json
{
  "pending_dialogs": [
    {"id": "d-1", "type": "alert", "message": "Hello", "opened_at": 1650000000.0}
  ],
  "recent_dialogs": [
    {"id": "d-1", "type": "alert", "message": "...", "opened_at": 1650000000.0,
     "closed_at": 1650000000.1, "closed_by": "remote"}
  ],
  "frame_tree": {
    "top": {"frame_id": "FRAME_A", "url": "https://example.com/", "origin": "https://example.com"},
    "children": [
      {"frame_id": "FRAME_B", "url": "about:srcdoc", "is_oopif": false},
      {"frame_id": "FRAME_C", "url": "https://ads.example.net/", "is_oopif": true, "session_id": "SID_C"}
    ],
    "truncated": false
  }
}
```

- **`pending_dialogs`**：当前阻塞页面 JS 线程的对话框。智能体必须调用 `browser_dialog(action=...)` 来响应。在 Browserbase 上为空，因为其 CDP 代理在约 10ms 内自动关闭。

- **`recent_dialogs`**：最多 20 个最近关闭的对话框的环形缓冲区，带有 `closed_by` 标签 — `"agent"`（我们已响应）、`"auto_policy"`（本地 auto_dismiss/auto_accept）、`"watchdog"`（must_respond 超时触发）、或 `"remote"`（浏览器/后端替我们关闭，如 Browserbase）。这就是在 Browserbase 上运行的智能体仍然能了解发生了什么的方式。

- **`frame_tree`**：包括跨域（OOPIF）子项的框架结构。上限为 30 条目 + OOPIF 深度 2，以限制广告密集页面的快照大小。当达到限制时 `truncated: true` 会显示；需要完整树的智能体可以使用 `browser_cdp` 配合 `Page.getFrameTree`。

这些都不需要新的工具 schema 接口——智能体读取它已经请求的快照即可。

### 可用性门控

两个接口都依赖于 `_browser_cdp_check`（主管仅在 CDP 端点可达时才能运行）。在 Camofox / 无后端会话上，对话框工具被隐藏，快照省略新字段——不会造成 schema 膨胀。

## 跨域 iframe 交互

扩展对话框检测工作，`browser_cdp(frame_id=...)` 使用 OOPIF 的子 `sessionId`，通过主管已连接的 WebSocket 路由 CDP 调用（特别是 `Runtime.evaluate`）。智能体从 `browser_snapshot.frame_tree.children[]` 中选取 `is_oopif=true` 的 frame_id 并传递给 `browser_cdp`。对于同源 iframe（无专用 CDP 会话），智能体改用顶层 `Runtime.evaluate` 中的 `contentWindow`/`contentDocument`——当 `frame_id` 属于非 OOPIF 时，主管会显示一个指向该回退方案的错误。

在 Browserbase 上，这是 iframe 交互的唯一可靠路径——无状态 CDP 连接（每次 `browser_cdp` 调用时打开）会遇到签名 URL 过期问题，而主管的长连接保持有效会话。

## Camofox（后续）

计划向 `jo-inc/camofox-browser` 提交 issue，添加：
- 每个会话的 Playwright `page.on('dialog', handler)`
- `GET /tabs/:tabId/dialogs` 轮询端点
- `POST /tabs/:tabId/dialogs/:id` 用于接受/关闭
- 框架树内省端点

## 涉及文件（PR 1）

### 新增

- `tools/browser_supervisor.py` — `CDPSupervisor`、`SupervisorRegistry`、`PendingDialog`、`FrameInfo`
- `tools/browser_dialog_tool.py` — `browser_dialog` 工具处理器
- `tests/tools/test_browser_supervisor.py` — 模拟 CDP WebSocket 服务器 + 生命周期/状态测试
- `website/docs/developer-guide/browser-supervisor.md` — 本文件

### 修改

- `toolsets.py` — 在 `browser`、`hermes-acp`、`hermes-api-server`、核心工具集中注册 `browser_dialog`（基于 CDP 可达性门控）
- `tools/browser_tool.py`
  - `browser_navigate` 启动钩子：如果 CDP URL 可解析，调用 `SupervisorRegistry.get_or_start(task_id, cdp_url)`
  - `browser_snapshot`（约第 1536 行）：将主管状态合并到返回载荷中
  - `/browser connect` 处理器：使用新端点重启主管
  - `_cleanup_browser_session` 中的会话拆卸钩子
- `hermes_cli/config.py` — 在 `DEFAULT_CONFIG` 中添加 `browser.dialog_policy` 和 `browser.dialog_timeout_s`
- 文档：`website/docs/user-guide/features/browser.md`、`website/docs/reference/tools-reference.md`、`website/docs/reference/toolsets-reference.md`

## 非目标

- Camofox 的检测/交互（上游缺失；单独跟踪）
- 向用户实时流式传输对话框/框架事件（需要网关钩子）
- 跨会话持久化对话框历史（仅内存）
- 按 iframe 对话框策略（智能体可通过 `dialog_id` 表达此意图）
- 替换 `browser_cdp` — 它作为长尾场景的逃生舱口保留（cookies、视口、网络限流）

## 测试

单元测试使用一个 asyncio 模拟 CDP 服务器，它实现了足够的协议来覆盖所有状态转换：附加、启用、导航、对话框触发、对话框关闭、框架附加/分离、子目标附加、会话拆卸。真实后端 E2E（Browserbase + 本地 Chrome）为手动操作——通过 `/browser connect` 连接到运行中的 Chrome 并运行上述对话框/框架测试用例。