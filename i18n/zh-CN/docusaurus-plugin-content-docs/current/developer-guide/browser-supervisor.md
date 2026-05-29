---
sidebar_position: 18
title: "浏览器CDP监督器"
description: "Hermes如何通过持久化的CDP连接检测并响应原生JS对话框，并与跨域iframe进行交互。"
---

# 浏览器CDP监督器

CDP监督器解决了Hermes浏览器工具中的两个长期存在的问题：

1.  **原生JS对话框**（`alert`/`confirm`/`prompt`/`beforeunload`）会阻塞页面的JS线程。在没有监督的情况下，智能体无法得知有对话框打开——后续的工具调用会挂起或抛出难以理解的错误。
2.  **跨域iframe（OOPIF）**对于顶层的`Runtime.evaluate`是不可见的。智能体可以在DOM快照中看到iframe节点，但在没有附加到子目标的CDP会话的情况下，无法在它们内部进行点击、输入或评估。

监督器通过为每个浏览器任务维护一个到后端CDP端点的持久WebSocket连接来解决这两个问题，将待处理的对话框和帧结构呈现到`browser_snapshot`中，并暴露一个`browser_dialog`工具用于显式响应。

## 后端支持

| 后端 | 对话框检测 | 对话框响应 | 帧树 | 通过 `browser_cdp(frame_id=...)` 进行OOPIF `Runtime.evaluate` |
|---|---|---|---|---|
| 本地Chrome (`--remote-debugging-port`) / `/browser connect` | ✓ | ✓ 完整工作流 | ✓ | ✓ |
| Browserbase | ✓ (通过桥接) | ✓ 完整工作流 (通过桥接) | ✓ | ✓ |
| Camofox | ✗ 无CDP (仅REST) | ✗ | 通过DOM快照部分支持 | ✗ |

**Browserbase的特殊之处。** Browserbase的CDP代理内部使用Playwright，并在大约10毫秒内自动关闭原生对话框，因此`Page.handleJavaScriptDialog`无法跟上。监督器通过`Page.addScriptToEvaluateOnNewDocument`注入一个桥接脚本，用对魔法主机(`hermes-dialog-bridge.invalid`)的同步XHR覆盖`window.alert`/`confirm`/`prompt`。`Fetch.enable`在这些XHR接触网络之前拦截它们——对话框变成了监督器捕获的`Fetch.requestPaused`事件，`respond_to_dialog`通过`Fetch.fulfillRequest`用注入脚本解码的JSON主体来满足请求。

从页面的角度看，`prompt()`仍然返回智能体提供的字符串。从智能体的角度看，无论哪种方式都是相同的`browser_dialog(action=...)`API。

Camofox不受支持——没有CDP接口，仅限REST。

## 架构

### CDPSupervisor

每个Hermes `task_id`运行在一个后台守护线程中的一个`asyncio.Task`。持有到后端CDP端点的持久WebSocket连接。维护：

- **对话框队列** — `List[PendingDialog]`，包含 `{id, type, message, default_prompt, session_id, opened_at}`
- **帧树** — `Dict[frame_id, FrameInfo]`，包含父子关系、URL、源、是否为跨域子会话
- **会话映射** — `Dict[session_id, SessionInfo]`，以便交互工具可以为OOPIF操作路由到正确的附加会话
- **最近的控制台错误** — 最近50个的环形缓冲区，用于诊断

在附加时订阅：

- `Page.enable` — `javascriptDialogOpening`, `frameAttached`, `frameNavigated`, `frameDetached`
- `Runtime.enable` — `executionContextCreated`, `consoleAPICalled`, `exceptionThrown`
- `Target.setAutoAttach {autoAttach: true, flatten: true}` — 呈现子OOPIF目标；监督器在每个目标上启用`Page`+`Runtime`

通过快照锁进行线程安全的状态访问；工具处理器（同步）读取冻结的快照而无需等待。

### 生命周期

- **启动：** `SupervisorRegistry.get_or_start(task_id, cdp_url)` — 由`browser_navigate`、Browserbase会话创建、`/browser connect`调用。幂等。
- **停止：** 会话销毁或`/browser disconnect`。取消asyncio任务，关闭WebSocket，丢弃状态。
- **重新绑定：** 如果CDP URL改变（用户重新连接到新的Chrome），旧的监督器被停止，一个新的被启动——状态永远不会在端点之间重用。

### 对话框策略

可通过`config.yaml`下的`browser.dialog_policy`配置：

- **`must_respond`**（默认） — 捕获，在`browser_snapshot`中呈现，等待显式的`browser_dialog(action=...)`调用。在300秒安全超时无响应后，自动关闭并记录日志。防止有缺陷的智能体永远阻塞。
- `auto_dismiss` — 记录并立即关闭；智能体事后通过`browser_snapshot`内的`browser_state`看到。
- `auto_accept` — 记录并接受（对于`beforeunload`有用，工作流希望干净地导航离开）。

策略是按任务设置的；没有按对话框的覆盖。

## 智能体接口

### `browser_dialog` 工具

```
browser_dialog(action, prompt_text=None, dialog_id=None)
```

- `action="accept"` / `"dismiss"` → 响应指定的或唯一的待处理对话框（必需）
- `prompt_text=...` → 要提供给`prompt()`对话框的文本
- `dialog_id=...` → 当有多个对话框排队时用于消歧（少见）

该工具仅用于响应。智能体在调用前从`browser_snapshot`输出中读取待处理的对话框。

### `browser_snapshot` 扩展

当监督器附加时，向现有快照输出添加三个可选字段：

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

- **`pending_dialogs`** — 当前阻塞页面JS线程的对话框。智能体必须调用`browser_dialog(action=...)`来响应。在Browserbase上为空，因为他们的CDP代理在大约10毫秒内自动关闭。

- **`recent_dialogs`** — 最多20个最近关闭的对话框的环形缓冲区，带有`closed_by`标签：`"agent"`（我们响应了）、`"auto_policy"`（本地auto_dismiss/auto_accept）、`"watchdog"`（must_respond超时触发）、或`"remote"`（浏览器/后端替我们关闭了，例如Browserbase）。这就是在Browserbase上的智能体仍然能看到发生了什么的方式。

- **`frame_tree`** — 帧结构，包括跨域（OOPIF）子帧。上限为30个条目 + OOPIF深度2，以限制广告密集页面的快照大小。当达到限制时，`truncated: true`会呈现；需要完整树的智能体可以使用`Page.getFrameTree`的`browser_cdp`。

这些都没有新的工具模式界面——智能体读取它已经请求的快照。

### 可用性控制

两个接口都受`_browser_cdp_check`控制（监督器只能在CDP端点可达时运行）。在Camofox / 无后端会话上，对话框工具被隐藏，快照省略新字段——不会增加模式臃肿。

## 跨域iframe交互

`browser_cdp(frame_id=...)`使用OOPIF的子`sessionId`，通过监督器已连接的WebSocket路由CDP调用（特别是`Runtime.evaluate`）。智能体从`browser_snapshot.frame_tree.children[]`中挑选`is_oopif=true`的`frame_id`，并传递给`browser_cdp`。对于同源iframe（没有专用CDP会话），智能体改为使用顶层`Runtime.evaluate`中的`contentWindow`/`contentDocument`——当`frame_id`属于非OOPIF时，监督器会呈现一个指向该回退方法的错误。

在Browserbase上，这是iframe交互的唯一可靠路径——无状态的CDP连接（每次`browser_cdp`调用时打开）会遇到签名URL过期，而监督器的长期连接保持有效的会话。

## 文件布局

- `tools/browser_supervisor.py` — `CDPSupervisor`, `SupervisorRegistry`, `PendingDialog`, `FrameInfo`
- `tools/browser_dialog_tool.py` — `browser_dialog`工具处理器
- `tools/browser_tool.py` — `browser_navigate`启动钩子，`browser_snapshot`合并，`/browser connect`重新附加，`_cleanup_browser_session`销毁
- `toolsets.py` — 在`browser`、`hermes-acp`、`hermes-api-server`和核心工具集中注册`browser_dialog`（受CDP可达性控制）
- `hermes_cli/config.py` — `browser.dialog_policy`和`browser.dialog_timeout_s`的默认值

## 非目标

- 为Camofox提供检测/交互（上游缺口；单独跟踪）
- 实时向用户流式传输对话框/帧事件（将需要网关钩子）
- 跨会话持久化对话框历史（仅限内存）
- 按iframe的对话框策略（智能体可以通过`dialog_id`表达此意图）
- 替换`browser_cdp` — 它仍然作为长尾场景（cookie、视口、网络限流）的逃生通道

## 测试

单元测试（`tests/tools/test_browser_supervisor.py`）使用一个异步模拟CDP服务器，它实现了足够的协议来演练所有状态转换：附加、启用、导航、对话框触发、对话框关闭、帧附加/分离、子目标附加、会话销毁。真实后端的E2E测试（Browserbase + 本地Chromium系列浏览器）是手动的——通过`/browser connect`连接到一个活动的Chromium系列浏览器，并运行上述的对话框/帧测试用例。