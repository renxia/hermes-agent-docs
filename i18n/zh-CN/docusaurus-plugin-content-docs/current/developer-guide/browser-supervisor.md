# 浏览器 CDP 管理器 — 设计

**状态：** 已发布 (PR 14540)
**最后更新：** 2026-04-23
**作者：** @teknium1

## 问题

原生 JS 对话框 (`alert`/`confirm`/`prompt`/`beforeunload`) 和 iframe 是我们浏览器工具中最大的两个缺口：

1.  **对话框会阻塞 JS 线程。** 页面上的任何操作都会停滞，直到对话框被处理。在此项工作之前，智能体无法知道有对话框打开 — 后续的工具调用可能会挂起或抛出晦涩的错误。
2.  **Iframe 不可见。** 智能体可以在 DOM 快照中看到 iframe 节点，但无法在其中点击、输入或执行 eval — 尤其是在独立 Chromium 进程中运行的跨域（OOPIF）iframe。

[PR #12550](https://github.com/NousResearch/hermes-agent/pull/12550) 提出了一个无状态的 `browser_dialog` 包装器。这并不能解决检测问题 — 它是在智能体已经（通过症状）知道对话框打开时，一个更简洁的 CDP 调用。已关闭，因被取代。

## 后端能力矩阵（经2026-04-23实时验证）

使用一次性探测脚本对一个数据URL页面进行测试，该页面在主框架和同源srcdoc iframe中触发警报，以及一个跨源 `https://example.com` iframe：

| 后端 | 对话框检测 | 对话框响应 | 框架树 | OOPIF `Runtime.evaluate` 通过 `browser_cdp(frame_id=...)` |
|---|---|---|---|---|
| 本地Chrome（`--remote-debugging-port`）/ `/browser connect` | ✓ | ✓ 完整工作流 | ✓ | ✓ |
| Browserbase | ✓（通过桥接） | ✓ 完整工作流（通过桥接） | ✓ | ✓（`document.title = "Example Domain"` 已在真实跨源iframe上验证） |
| Camofox | ✗ 无CDP（仅REST） | ✗ | 通过DOM快照部分实现 | ✗ |

**Browserbase响应的工作原理。** Browserbase的CDP代理内部使用Playwright，并在约10毫秒内自动关闭原生对话框，因此 `Page.handleJavaScriptDialog` 无法跟上。为了解决这个问题，监督器通过 `Page.addScriptToEvaluateOnNewDocument` 注入一个桥接脚本，该脚本用一个同步XHR请求到一个魔术主机（`hermes-dialog-bridge.invalid`）来覆盖 `window.alert`/`confirm`/`prompt`。`Fetch.enable` 在这些XHR请求触及网络之前拦截它们——对话框变成了一个 `Fetch.requestPaused` 事件，监督器捕获该事件，而 `respond_to_dialog` 通过 `Fetch.fulfillRequest` 以一个注入脚本解码的JSON主体来满足请求。

最终结果：从页面的角度看，`prompt()` 仍然返回智能体提供的字符串。从智能体的角度看，无论哪种方式都是相同的 `browser_dialog(action=...)` API。已在真实的Browserbase会话上进行端到端测试——4/4（alert/prompt/confirm-accept/confirm-dismiss）测试通过，包括值回传到页面JS。

Camofox在本次PR中仍不支持；计划在上游 `jo-inc/camofox-browser` 提出后续问题，请求添加一个对话框轮询端点。

## 架构

### CDPSupervisor

每个Hermes `task_id` 一个 `asyncio.Task`，运行在一个后台守护线程中。持有到后端CDP端点的持久WebSocket连接。维护：

- **对话框队列** — `List[PendingDialog]`，包含 `{id, type, message, default_prompt, session_id, opened_at}`
- **框架树** — `Dict[frame_id, FrameInfo]`，包含父子关系、URL、源、是否是跨源子会话
- **会话映射** — `Dict[session_id, SessionInfo]`，以便交互工具可以路由到正确的附加会话以执行OOPIF操作
- **最近控制台错误** — 最近50条的环形缓冲区（用于PR 2诊断）

附加时订阅：
- `Page.enable` — `javascriptDialogOpening`, `frameAttached`, `frameNavigated`, `frameDetached`
- `Runtime.enable` — `executionContextCreated`, `consoleAPICalled`, `exceptionThrown`
- `Target.setAutoAttach {autoAttach: true, flatten: true}` — 呈现子OOPIF目标；监督器在每个目标上启用 `Page`+`Runtime`

通过快照锁实现线程安全的状态访问；工具处理器（同步）读取冻结的快照而无需等待。

### 生命周期

- **启动：** `SupervisorRegistry.get_or_start(task_id, cdp_url)` — 由 `browser_navigate`、Browserbase会话创建、`/browser connect` 调用。幂等。
- **停止：** 会话拆卸或 `/browser disconnect`。取消asyncio任务，关闭WebSocket，丢弃状态。
- **重新绑定：** 如果CDP URL更改（用户重新连接到新的Chrome），停止旧监督器并重新开始——永远不要跨端点重用状态。

### 对话框策略

可通过 `config.yaml` 中的 `browser.dialog_policy` 配置：

- **`must_respond`**（默认） — 捕获，呈现在 `browser_snapshot` 中，等待明确的 `browser_dialog(action=...)` 调用。在300秒的安全超时后若无响应，自动关闭并记录日志。防止有缺陷的智能体永远阻塞。
- `auto_dismiss` — 记录并立即关闭；智能体随后在 `browser_snapshot` 内的 `browser_state` 中看到它。
- `auto_accept` — 记录并接受（对于 `beforeunload` 有用，用户希望干净地离开页面）。

策略按任务划分；v1中没有逐对话框覆盖。

## 智能体接口（PR 1）

### 一个新工具

```
browser_dialog(action, prompt_text=None, dialog_id=None)
```

- `action="accept"` / `"dismiss"` → 响应指定的或唯一的待处理对话框（必需）
- `prompt_text=...` → 要提供给 `prompt()` 对话框的文本
- `dialog_id=...` → 当多个对话框排队时消除歧义（罕见）

工具仅用于响应。智能体在调用前从 `browser_snapshot` 输出中读取待处理的对话框。

### `browser_snapshot` 扩展

当监督器附加时，向现有的快照输出添加三个可选字段：

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

- **`pending_dialogs`**: 当前阻塞页面JS线程的对话框。智能体必须调用 `browser_dialog(action=...)` 来响应。在Browserbase上为空，因为它们的CDP代理在约10毫秒内自动关闭。
- **`recent_dialogs`**: 最多20个最近关闭的对话框的环形缓冲区，带有 `closed_by` 标签 — `"agent"`（我们响应了）、`"auto_policy"`（本地auto_dismiss/auto_accept）、`"watchdog"`（must_respond超时触发）、或 `"remote"`（浏览器/后端为我们关闭，例如Browserbase）。这是Browserbase上的智能体仍然可以了解发生了什么的方式。
- **`frame_tree`**: 框架结构，包括跨源（OOPIF）子框架。在广告多的页面上，为了限制快照大小，限制为30个条目 + OOPIF深度2。当达到限制时，`truncated: true` 会被呈现；需要完整树的智能体可以使用 `browser_cdp` 配合 `Page.getFrameTree`。

对于这些都没有新的工具模式表面——智能体读取它已经请求的快照。

### 可用性门控

两个表面都依赖于 `_browser_cdp_check`（监督器只能在CDP端点可达时运行）。在Camofox/无后端的会话中，对话框工具被隐藏，快照省略新字段——没有模式膨胀。

## 跨源iframe交互

扩展对话框检测的工作，`browser_cdp(frame_id=...)` 通过监督器已经连接的WebSocket，使用OOPIF的子 `sessionId` 来路由CDP调用（特别是 `Runtime.evaluate`）。智能体从 `browser_snapshot.frame_tree.children[]` 中挑选出 `is_oopif=true` 的frame_ids，并将它们传递给 `browser_cdp`。对于同源iframe（没有专用的CDP会话），智能体改用顶层的 `Runtime.evaluate` 中的 `contentWindow`/`contentDocument`——当 `frame_id` 属于非OOPIF时，监督器会呈现一个指向该回退方案的错误。

在Browserbase上，这是iframe交互的唯一可靠路径——无状态CDP连接（每次 `browser_cdp` 调用时打开）会遇到签名URL过期问题，而监督器的长期连接保持一个有效的会话。

## Camofox（后续）

计划在 `jo-inc/camofox-browser` 上提出问题，要求添加：
- 每个会话的Playwright `page.on('dialog', handler)`
- `GET /tabs/:tabId/dialogs` 轮询端点
- `POST /tabs/:tabId/dialogs/:id` 用于接受/关闭
- 框架树自省端点

## 涉及的文件（PR 1）

### 新增

- `tools/browser_supervisor.py` — `CDPSupervisor`, `SupervisorRegistry`, `PendingDialog`, `FrameInfo`
- `tools/browser_dialog_tool.py` — `browser_dialog` 工具处理器
- `tests/tools/test_browser_supervisor.py` — 模拟CDP WebSocket服务器 + 生命周期/状态测试
- `website/docs/developer-guide/browser-supervisor.md` — 本文件

### 修改

- `toolsets.py` — 在 `browser`、`hermes-acp`、`hermes-api-server`、核心工具集中注册 `browser_dialog`（受CDP可达性门控）
- `tools/browser_tool.py`
  - `browser_navigate` 启动钩子：如果CDP URL可解析，`SupervisorRegistry.get_or_start(task_id, cdp_url)`
  - `browser_snapshot`（约第1536行）：将监督器状态合并到返回的负载中
  - `/browser connect` 处理器：用新端点重启监督器
  - `_cleanup_browser_session` 中的会话拆卸钩子
- `hermes_cli/config.py` — 将 `browser.dialog_policy` 和 `browser.dialog_timeout_s` 添加到 `DEFAULT_CONFIG`
- 文档：`website/docs/user-guide/features/browser.md`、`website/docs/reference/tools-reference.md`、`website/docs/reference/toolsets-reference.md`

## 非目标

- Camofox的检测/交互（上游缺陷；单独跟踪）
- 实时向用户流式传输对话框/框架事件（需要网关钩子）
- 跨会话持久化对话框历史记录（仅内存）
- 逐iframe对话框策略（智能体可以通过 `dialog_id` 来表达）
- 替换 `browser_cdp` — 它作为长尾场景（cookies、视口、网络节流）的逃生舱保留

## 测试

单元测试使用一个asyncio模拟CDP服务器，该服务器实现了足够的协议来执行所有状态转换：附加、启用、导航、对话框触发、对话框关闭、框架附加/分离、子目标附加、会话拆卸。真实后端的端到端测试（Browserbase + 本地Chromium系列浏览器）是手动的——通过 `/browser connect` 连接到一个在线的Chromium系列浏览器，并运行上述描述的对话框/框架测试用例。