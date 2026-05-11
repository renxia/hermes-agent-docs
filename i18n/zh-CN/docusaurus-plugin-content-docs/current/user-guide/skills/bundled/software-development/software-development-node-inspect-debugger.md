---
title: "Node 检查调试器 — 调试节点"
sidebar_label: "Node 检查调试器"
description: "调试节点"
---

{/* 本页面由网站脚本 /website/scripts/generate-skill-docs.py 从技能文件 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。*/}

# Node 检查调试器

通过 --inspect + Chrome 开发者工具协议命令行界面来调试 Node.js。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/software-development/node-inspect-debugger` |
| 版本 | `1.0.0` |
| 作者 | 赫尔墨斯智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `调试`, `nodejs`, `node-inspect`, `cdp`, `断点`, `ui-tui` |
| 相关技能 | [`系统化调试`](/docs/user-guide/skills/bundled/software-development/software-development-systematic-debugging), [`python-debugpy`](/docs/user-guide/skills/bundled/software-development/software-development-python-debugpy), [`调试赫尔墨斯TUI命令`](/docs/user-guide/skills/bundled/software-development/software-development-debugging-hermes-tui-commands) |

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是该技能激活时智能体看到的指令。
:::

# Node.js Inspect 调试器

## 概述

当 `console.log` 不够用时，可以从终端程序化地驱动 Node 内置的 V8 检查器。您将获得真正的断点、步入/步过/步出、调用栈遍历、局部/闭包作用域转储，以及在暂停帧中对任意表达式求值的能力。

两个工具，选其一：

- **`node inspect`** — 内置，无需安装，CLI REPL。最适合快速探查。
- **`ndb` / 通过 `chrome-remote-interface` 的 CDP** — 可从 Node/Python 脚本化；最适合当您需要自动化设置大量断点、在多次运行中收集状态，或从智能体循环中进行非交互式调试时。

**优先使用 `node inspect`。** 它始终可用，并且 REPL 响应快速。

## 何时使用

- Node 测试失败，您需要查看中间状态
- ui-tui 崩溃或行为异常，您想在渲染前检查 React/Ink 状态
- tui_gateway 子进程（`_SlashWorker`、PTY 桥接工作者）行为异常
- 您需要检查闭包中的一个值，而 `console.log` 在不打补丁的情况下无法触及
- 性能：附加到正在运行的进程以捕获 CPU 配置文件或堆快照

**不要用于：** `console.log` 在一分钟内能解决的事情。断点驱动的调试开销更大；当回报确实可观时再使用它。

## 快速参考：`node inspect` REPL

在第一行暂停启动：

```bash
node inspect path/to/script.js
# 或使用 tsx
node --inspect-brk $(which tsx) path/to/script.ts
```

`debug>` 提示符接受：

| 命令 | 操作 |
|---|---|
| `c` 或 `cont` | 继续执行 |
| `n` 或 `next` | 步过（Step over） |
| `s` 或 `step` | 步入（Step into） |
| `o` 或 `out` | 步出（Step out） |
| `pause` | 暂停正在运行的代码 |
| `sb('file.js', 42)` | 在 file.js 第 42 行设置断点 |
| `sb(42)` | 在当前文件第 42 行设置断点 |
| `sb('functionName')` | 当函数被调用时中断 |
| `cb('file.js', 42)` | 清除断点 |
| `breakpoints` | 列出所有断点 |
| `bt` | 回溯（调用栈） |
| `list(5)` | 显示当前位置周围的 5 行源代码 |
| `watch('expr')` | 在每次暂停时计算表达式 expr |
| `watchers` | 显示被监视的表达式 |
| `repl` | 进入当前作用域的 REPL（Ctrl+C 退出 REPL） |
| `exec expr` | 执行一次表达式 |
| `restart` | 重启脚本 |
| `kill` | 杀死脚本 |
| `.exit` | 退出调试器 |

**在 `repl` 子模式中：** 输入任何 JS 表达式，包括访问局部/闭包变量。`Ctrl+C` 退出回到 `debug>`。

## 附加到正在运行的进程

当进程已经在运行时（例如一个长期的开发服务器或 TUI 网关）：

```bash
# 1. 向现有进程发送 SIGUSR1 以启用检查器
kill -SIGUSR1 <pid>
# Node 会打印：Debugger listening on ws://127.0.0.1:9229/<uuid>

# 2. 附加调试器 CLI
node inspect -p <pid>
# 或通过 URL
node inspect ws://127.0.0.1:9229/<uuid>
```

要从一开始就使用检查器启动进程：

```bash
node --inspect script.js           # 在 127.0.0.1:9229 上监听，并继续运行
node --inspect-brk script.js       # 监听并在第一行暂停
node --inspect=0.0.0.0:9230 script.js   # 自定义主机:端口
```

通过 tsx 用于 TypeScript：

```bash
node --inspect-brk --import tsx script.ts
# 或旧版 tsx
node --inspect-brk -r tsx/cjs script.ts
```

## 编程式 CDP（从终端脚本化）

当您想要自动化 —— 设置大量断点、捕获作用域状态、编写重现脚本时 —— 使用 `chrome-remote-interface`：

```bash
npm i -g chrome-remote-interface        # 或项目本地安装
# 启动您的目标：
node --inspect-brk=9229 target.js &
```

驱动脚本（保存为 `/tmp/cdp-debug.js`）：

```javascript
const CDP = require('chrome-remote-interface');

(async () => {
  const client = await CDP({ port: 9229 });
  const { Debugger, Runtime } = client;

  Debugger.paused(async ({ callFrames, reason }) => {
    const top = callFrames[0];
    console.log(`PAUSED: ${reason} @ ${top.url}:${top.location.lineNumber + 1}`);

    // 遍历作用域获取局部变量
    for (const scope of top.scopeChain) {
      if (scope.type === 'local' || scope.type === 'closure') {
        const { result } = await Runtime.getProperties({
          objectId: scope.object.objectId,
          ownProperties: true,
        });
        for (const p of result) {
          console.log(`  ${scope.type}.${p.name} =`, p.value?.value ?? p.value?.description);
        }
      }
    }

    // 在暂停的帧中计算表达式
    const { result } = await Debugger.evaluateOnCallFrame({
      callFrameId: top.callFrameId,
      expression: 'typeof state !== "undefined" ? JSON.stringify(state) : "n/a"',
    });
    console.log('state =', result.value ?? result.description);

    await Debugger.resume();
  });

  await Runtime.enable();
  await Debugger.enable();

  // 通过 URL 正则 + 行号设置断点
  await Debugger.setBreakpointByUrl({
    urlRegex: '.*app\\.tsx$',
    lineNumber: 119,       // 0 起始索引
    columnNumber: 0,
  });

  await Runtime.runIfWaitingForDebugger();
})();
```

运行它：

```bash
node /tmp/cdp-debug.js
```

Hermes 特定说明：`chrome-remote-interface` 不在 `ui-tui/package.json` 中。如果您不想弄脏项目，可以将其安装到一个临时位置：

```bash
mkdir -p /tmp/cdp-tools && cd /tmp/cdp-tools && npm i chrome-remote-interface
NODE_PATH=/tmp/cdp-tools/node_modules node /tmp/cdp-debug.js
```

## 调试 Hermes ui-tui

TUI 是用 Ink + tsx 构建的。两种常见场景：

### 在开发中调试单个 Ink 组件

`ui-tui/package.json` 有 `npm run dev`（tsx --watch）。通过直接运行 tsx 添加 `--inspect-brk`：

```bash
cd /home/bb/hermes-agent/ui-tui
npm run build    # 先生成 dist/，这样首次加载时无需转译
node --inspect-brk dist/entry.js
# 在另一个终端中：
node inspect -p <node pid>
```

然后在 `debug>` 内部：

```
sb('dist/app.js', 220)     # 或者任何可疑渲染的位置
cont
```

当它暂停时，`repl` → 检查 `props`、状态引用、`useInput` 处理程序的值等。

### 调试正在运行的 `hermes --tui`

TUI 从 Python CLI 生成 Node。最简单的路径：

```bash
# 1. 启动 TUI
hermes --tui &
TUI_PID=$(pgrep -f 'ui-tui/dist/entry' | head -1)

# 2. 在该 Node PID 上启用检查器
kill -SIGUSR1 "$TUI_PID"

# 3. 查找 WS URL
curl -s http://127.0.0.1:9229/json/list | jq -r '.[0].webSocketDebuggerUrl'

# 4. 附加
node inspect ws://127.0.0.1:9229/<uuid>
```

与 TUI 交互（在其窗口中输入）会继续推进执行；您的调试器可以在任何 `sb(...)` 断点处暂停它。

### 调试 `_SlashWorker` / PTY 子进程

这些是 Python，不是 Node —— 对它们使用 `python-debugpy` 技能。只有 Node 部分（Ink UI、tui_gateway 客户端、`ui-tui/` 下的 tsx 运行测试）使用此技能。

## 在调试器下运行 Vitest 测试

```bash
cd /home/bb/hermes-agent/ui-tui
# 运行单个测试文件，在入口处暂停
node --inspect-brk ./node_modules/vitest/vitest.mjs run --no-file-parallelism src/app/foo.test.tsx
```

在另一个终端中：`node inspect -p <pid>`，然后 `sb('src/app/foo.tsx', 42)`，`cont`。

使用 `--no-file-parallelism`（vitest）或 `--runInBand`（jest）以便只存在一个工作者 —— 调试工作者池是痛苦的。

## 堆快照 & CPU 配置文件（非交互式）

根据上面的 CDP 驱动程序，将 `Debugger` 替换为 `HeapProfiler` / `Profiler`：

```javascript
// 5 秒的 CPU 配置文件
await client.Profiler.enable();
await client.Profiler.start();
await new Promise(r => setTimeout(r, 5000));
const { profile } = await client.Profiler.stop();
require('fs').writeFileSync('/tmp/cpu.cpuprofile', JSON.stringify(profile));
// 在 Chrome DevTools → Performance 标签页中打开 /tmp/cpu.cpuprofile
```

```javascript
// 堆快照
await client.HeapProfiler.enable();
const chunks = [];
client.HeapProfiler.addHeapSnapshotChunk(({ chunk }) => chunks.push(chunk));
await client.HeapProfiler.takeHeapSnapshot({ reportProgress: false });
require('fs').writeFileSync('/tmp/heap.heapsnapshot', chunks.join(''));
```

## 常见陷阱

1.  **TS 源码中的行号错误。** 断点命中的是生成的 JS，而不是 `.ts`。要么 (a) 在构建好的 `dist/*.js` 中设置断点，要么 (b) 启用源映射（`node --enable-source-maps`）并使用 `sb('src/app.tsx', N)` —— 但仅限于遵循源映射的 CDP 客户端。`node inspect` CLI 不遵循。

2.  **`--inspect` 与 `--inspect-brk`。** `--inspect` 启动检查器但不暂停；如果附加太晚，您的脚本会错过第一个断点。当您需要在任何代码运行前设置断点时，使用 `--inspect-brk`。

3.  **端口冲突。** 默认是 `9229`。如果多个 Node 进程正在检查，传递 `--inspect=0`（随机端口）并从 `/json/list` 读取实际 URL：
    ```bash
    curl -s http://127.0.0.1:9229/json/list   # 列出主机上所有可检查的目标
    ```

4.  **子进程。** 在父进程上设置 `--inspect` **不会**检查其子进程。使用 `NODE_OPTIONS='--inspect-brk' node parent.js` 传播到每个子进程；注意它们都需要唯一的端口（当 `NODE_OPTIONS='--inspect'` 被继承时，Node 会自动递增）。

5.  **后台终止。** 如果您在目标暂停时 `Ctrl+C` 退出 `node inspect`，目标会保持暂停状态。先 `cont`，或显式 `kill` 目标。

6.  **通过智能体终端运行 `node inspect`。** 这是一个 PTY 友好的 REPL。在 Hermes 中，使用 `terminal(pty=true)` 或 `background=true` + `process(action='submit', data='...')` 启动它。非 PTY 前台模式适用于一次性命令，但不适用于交互式步进。

7.  **安全性。** `--inspect=0.0.0.0:9229` 暴露了任意代码执行。除非您有隔离的网络，否则始终绑定到 `127.0.0.1`（默认值）。

---
title: 使用 Chrome DevTools 调试 Node.js
description: 学习如何在 Chrome DevTools 中调试 Node.js 应用程序。本指南涵盖设置、连接、使用断点、观察者、源代码映射和常见陷阱。
slug: /debugging-guide/nodejs/debugging-nodejs-in-chrome-devtools
---

# 使用 Chrome DevTools 调试 Node.js

Chrome DevTools 提供了一个功能强大的图形界面，用于在 Node.js 中调试代码。

## 快速设置

```bash
# 使用检查器标志启动您的节点进程
node --inspect your-script.js
# 或者在第一行暂停执行：
node --inspect-brk your-script.js

# 打开 Chrome，导航至 chrome://inspect
# 点击 "Open dedicated DevTools for Node"
```

## 验证清单

设置好调试会话后，请验证：

- [ ] `curl -s http://127.0.0.1:9229/json/list` 准确返回您期望的目标
- [ ] 第一个断点确实命中（如果没有命中，您可能遗漏了 `--inspect-brk` 或者是在执行完成后才附加）
- [ ] 暂停时的源码列表显示的是正确的文件（不匹配 = 源码映射问题，参见陷阱 1）
- [ ] 在 `repl` 中执行 `exec process.pid` 返回的是您打算附加的进程的 PID

## 一次性调试菜谱

**"为什么在第 X 行这个变量是 undefined？"**
```bash
node --inspect-brk script.js &
node inspect -p $!
# 调试>
sb('script.js', X)
cont
# 已暂停。现在：
repl
> myVariable
> Object.keys(this)
```

**"进入这个函数的调用路径是什么？"**
```
debug> sb('suspectFn')
debug> cont
# 已在入口处暂停
debug> bt
```

**"这个异步链挂起在哪个位置？"**
```
# 使用 --inspect（不带 -brk）启动，让它运行到挂起状态，然后：
debug> pause
debug> bt
# 现在您可以看到卡住的栈帧
```