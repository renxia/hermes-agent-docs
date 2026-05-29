---
title: "节点检查调试器 — 调试节点"
sidebar_label: "节点检查调试器"
description: "调试节点"
---

{/* 此页面由网站脚本 scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源 SKILL.md，而非本页面。 */}

# 节点检查调试器

通过 --inspect + Chrome 开发者协议 CLI 调试 Node.js。

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
| 相关技能 | [`系统化调试`](/docs/user-guide/skills/bundled/software-development/software-development-systematic-debugging), [`python调试器`](/docs/user-guide/skills/bundled/software-development/software-development-python-debugpy), [`调试赫尔墨斯TUI命令`](/docs/user-guide/skills/bundled/software-development/software-development-debugging-hermes-tui-commands) |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Node.js 检查调试器

## 概述

当 `console.log` 不够用时，可以从终端以编程方式驱动 Node 内置的 V8 检查器。您可以获得真正的断点、步入/步过/步出、调用栈遍历、局部/闭包作用域转储，以及在暂停帧中进行任意表达式求值。

有两个工具，选择一个：

- **`node inspect`** — 内置、无需安装、CLI REPL。适合快速探查。
- **`ndb` / 通过 `chrome-remote-interface` 的 CDP** — 可通过 Node/Python 编程；当您想要自动化设置多个断点、跨运行收集状态或从智能体循环中进行非交互式调试时，此工具最佳。

**优先使用 `node inspect`。** 它始终可用且 REPL 响应迅速。

## 何时使用

- Node 测试失败，需要查看中间状态
- ui-tui 崩溃或行为异常，想要检查渲染前的 React/Ink 状态
- tui_gateway 子进程（`_SlashWorker`、PTY 桥接 worker）行为异常
- 需要检查闭包中的值，而 `console.log` 无法在不打补丁的情况下达到
- 性能分析：附加到正在运行的进程以捕获 CPU 配置文件或堆快照

**不要用于：** `console.log` 能在一分钟内解决的事情。基于断点的调试更重；仅在回报明显时使用它。

## 快速参考：`node inspect` REPL

在第一行暂停启动：

```bash
node inspect path/to/script.js
# 或使用 tsx
node --inspect-brk $(which tsx) path/to/script.ts
```

`debug>` 提示符接受以下命令：

| 命令 | 操作 |
|---|---|
| `c` 或 `cont` | 继续 |
| `n` 或 `next` | 步过 |
| `s` 或 `step` | 步入 |
| `o` 或 `out` | 步出 |
| `pause` | 暂停正在运行的代码 |
| `sb('file.js', 42)` | 在 file.js 的第 42 行设置断点 |
| `sb(42)` | 在当前文件的第 42 行设置断点 |
| `sb('functionName')` | 当函数被调用时中断 |
| `cb('file.js', 42)` | 清除断点 |
| `breakpoints` | 列出所有断点 |
| `bt` | 回溯（调用栈） |
| `list(5)` | 显示当前位置周围的 5 行源代码 |
| `watch('expr')` | 每次暂停时计算表达式 |
| `watchers` | 显示监视的表达式 |
| `repl` | 进入当前作用域的 REPL（Ctrl+C 退出 REPL） |
| `exec expr` | 求值表达式一次 |
| `restart` | 重启脚本 |
| `kill` | 终止脚本 |
| `.exit` | 退出调试器 |

**在 `repl` 子模式下：** 输入任何 JS 表达式，包括访问局部/闭包变量。`Ctrl+C` 退出回到 `debug>`。

## 附加到正在运行的进程

当进程已经在运行时（例如长期运行的开发服务器或 TUI 网关）：

```bash
# 1. 发送 SIGUSR1 以在现有进程上启用检查器
kill -SIGUSR1 <pid>
# Node 将打印：Debugger listening on ws://127.0.0.1:9229/<uuid>

# 2. 附加调试器 CLI
node inspect -p <pid>
# 或通过 URL
node inspect ws://127.0.0.1:9229/<uuid>
```

要从一开始就使用检查器启动进程：

```bash
node --inspect script.js           # 监听 127.0.0.1:9229，继续运行
node --inspect-brk script.js       # 监听并在第一行暂停
node --inspect=0.0.0.0:9230 script.js   # 自定义 host:port
```

对于通过 tsx 的 TypeScript：

```bash
node --inspect-brk --import tsx script.ts
# 或较旧的 tsx
node --inspect-brk -r tsx/cjs script.ts
```

## 编程式 CDP（从终端编写脚本）

当您想要自动化——设置多个断点、捕获作用域状态、编写复现脚本——时，请使用 `chrome-remote-interface`：

```bash
npm i -g chrome-remote-interface        # 或项目本地
# 启动目标：
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

    // 遍历作用域以获取局部变量
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

    // 在暂停的帧中求值表达式
    const { result } = await Debugger.evaluateOnCallFrame({
      callFrameId: top.callFrameId,
      expression: 'typeof state !== "undefined" ? JSON.stringify(state) : "n/a"',
    });
    console.log('state =', result.value ?? result.description);

    await Debugger.resume();
  });

  await Runtime.enable();
  await Debugger.enable();

  // 通过 URL 正则表达式 + 行号设置断点
  await Debugger.setBreakpointByUrl({
    urlRegex: '.*app\\.tsx$',
    lineNumber: 119,       // 从 0 开始索引
    columnNumber: 0,
  });

  await Runtime.runIfWaitingForDebugger();
})();
```

运行它：

```bash
node /tmp/cdp-debug.js
```

Hermes 特定说明：`chrome-remote-interface` 不在 `ui-tui/package.json` 中。如果您不想弄脏项目，请将其安装到一个临时位置：

```bash
mkdir -p /tmp/cdp-tools && cd /tmp/cdp-tools && npm i chrome-remote-interface
NODE_PATH=/tmp/cdp-tools/node_modules node /tmp/cdp-debug.js
```

## 调试 Hermes ui-tui

TUI 使用 Ink + tsx 构建。两种常见场景：

### 在开发下调试单个 Ink 组件

`ui-tui/package.json` 包含 `npm run dev`（tsx --watch）。通过直接运行 tsx 添加 `--inspect-brk`：

```bash
cd /home/bb/hermes-agent/ui-tui
npm run build    # 生成 dist/ 一次，避免首次加载时转译
node --inspect-brk dist/entry.js
# 在另一个终端：
node inspect -p <node pid>
```

然后在 `debug>` 内：

```
sb('dist/app.js', 220)     # 或可疑渲染所在的位置
cont
```

当它暂停时，`repl` → 检查 `props`、状态引用、`useInput` 处理器值等。

### 调试正在运行的 `hermes --tui`

TUI 从 Python CLI 启动 Node。最简单的方法：

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

与 TUI 交互（在其窗口中输入）继续推进执行；您的调试器可以在任何 `sb(...)` 的断点处暂停它。

### 调试 `_SlashWorker` / PTY 子进程

这些是 Python，不是 Node —— 对于它们请使用 `python-debugpy` 技能。只有 Node 部分（Ink UI、tui_gateway 客户端、`ui-tui/` 下运行的 tsx 测试）使用此技能。

## 在调试器下运行 Vitest 测试

```bash
cd /home/bb/hermes-agent/ui-tui
# 在入口处暂停运行单个测试文件
node --inspect-brk ./node_modules/vitest/vitest.mjs run --no-file-parallelism src/app/foo.test.tsx
```

在另一个终端：`node inspect -p <pid>`，然后 `sb('src/app/foo.tsx', 42)`，`cont`。

使用 `--no-file-parallelism`（vitest）或 `--runInBand`（jest），以便只有一个 worker 存在 —— 调试线程池会很痛苦。

## 堆快照和 CPU 配置文件（非交互式）

从上面的 CDP 驱动程序，将 Debugger 替换为 `HeapProfiler` / `Profiler`：

```javascript
// 5 秒的 CPU 配置文件
await client.Profiler.enable();
await client.Profiler.start();
await new Promise(r => setTimeout(r, 5000));
const { profile } = await client.Profiler.stop();
require('fs').writeFileSync('/tmp/cpu.cpuprofile', JSON.stringify(profile));
// 在 Chrome DevTools 的 Performance 标签页中打开 /tmp/cpu.cpuprofile
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

1. **TS 源代码中的行号错误。** 断点命中生成的 JS，而不是 `.ts`。要么 (a) 在构建的 `dist/*.js` 中中断，要么 (b) 启用源码映射 (`node --enable-source-maps`) 并使用 `sb('src/app.tsx', N)` —— 但仅适用于遵循源码映射的 CDP 客户端。`node inspect` CLI 不支持。

2. **`--inspect` 与 `--inspect-brk`。** `--inspect` 启动检查器但不暂停；如果您附加得太晚，您的脚本会跳过第一个断点。当需要在任何代码运行前设置断点时，请使用 `--inspect-brk`。

3. **端口冲突。** 默认是 `9229`。如果多个 Node 进程正在检查，请传递 `--inspect=0`（随机端口）并从 `/json/list` 读取实际 URL：
   ```bash
   curl -s http://127.0.0.1:9229/json/list   # 列出主机上所有可检查的目标
   ```

4. **子进程。** 父进程上的 `--inspect` 不会检查其子进程。使用 `NODE_OPTIONS='--inspect-brk' node parent.js` 传播到每个子进程；请注意它们都需要唯一的端口（当 `NODE_OPTIONS='--inspect'` 被继承时，Node 会自动递增）。

5. **后台终止。** 如果在目标暂停时从 `node inspect` 中 `Ctrl+C` 退出，目标会保持暂停状态。要么先 `cont`，要么显式 `kill` 目标。

6. **通过智能体终端运行 `node inspect`。** 这是一个 PTY 友好的 REPL。在 Hermes 中，使用 `terminal(pty=true)` 或 `background=true` + `process(action='submit', data='...')` 启动它。非 PTY 前台模式适用于一次性命令，但不适用于交互式单步执行。

7. **安全性。** `--inspect=0.0.0.0:9229` 会暴露任意代码执行。始终绑定到 `127.0.0.1`（默认值），除非您拥有隔离的网络。

## 验证清单

设置调试会话后，请验证：

- [ ] `curl -s http://127.0.0.1:9229/json/list` 返回的正是您预期的目标
- [ ] 第一个断点确实命中（如果未命中，很可能是遗漏了 `--inspect-brk` 或在执行完成后才连接）
- [ ] 暂停时的源代码列表显示的是正确的文件（不匹配意味着存在 sourcemap 问题，请参阅陷阱 1）
- [ ] 在 `repl` 中执行 `exec process.pid` 返回的是您意图连接的进程 PID

## 一次性配方

**"为什么变量在第 X 行是未定义的？"**
```bash
node --inspect-brk script.js &
node inspect -p $!
# debug>
sb('script.js', X)
cont
# 已暂停。现在：
repl
> myVariable
> Object.keys(this)
```

**"调用此函数的路径是什么？"**
```
debug> sb('suspectFn')
debug> cont
# 在函数入口处暂停
debug> bt
```

**"这个异步链挂起了——在哪里？"**
```
# 使用 --inspect（不带 -brk）启动，让其运行至挂起点，然后：
debug> pause
debug> bt
# 现在您可以看到卡住的栈帧
```