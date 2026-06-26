---
title: Node Inspect Debugger — Debug Node
sidebar_label: Node Inspect Debugger
description: Debug Node
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Node Inspect Debugger

通过 --inspect + Chrome DevTools Protocol CLI 调试 Node.js。

## Skill metadata

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/software-development/node-inspect-debugger` |
| Version | `1.0.0` |
| Author | Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `debugging`, `nodejs`, `node-inspect`, `cdp`, `breakpoints`, `ui-tui` |
| Related skills | [`systematic-debugging`](/docs/user-guide/skills/bundled/software-development/software-development-systematic-debugging), [`python-debugpy`](/docs/user-guide/skills/bundled/software-development/software-development-python-debugpy), `debugging-hermes-tui-commands` |

## Reference: full SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# Node.js Inspect Debugger

## Overview

当 `console.log` 不够用时，请从终端程序化地驱动 Node 内置的 V8 检查器。您将获得真正的断点、步入/跳过/步出、调用栈跟踪、局部/闭包作用域转储以及在暂停帧中任意表达式求值等功能。

两种工具可供选择：

- **`node inspect`** — 内置，无需安装，CLI REPL。最适合快速检查。
- **`ndb` / CDP 通过 `chrome-remote-interface`** — 可从 Node/Python 脚本化；当您需要自动化多个断点、跨运行收集状态或从智能体循环中非交互式调试时效果最佳。

**请优先使用 `node inspect`。** 它始终可用，而且 REPL 速度快。

## When to Use (何时使用)

- Node 测试失败，您需要查看中间状态
- ui-tui 崩溃或行为异常，您想在渲染前检查 React/Ink 状态
- tui_gateway 子进程（`_SlashWorker`、PTY 桥接工作进程）行为不当
- 您需要在闭包中检查一个值，而 `console.log` 无法做到这一点
- Perf：附加到正在运行的进程以捕获 CPU 配置文件或堆快照

**不要用于：** 一分钟内 `console.log` 就能解决的事情。基于断点的调试更重；请在回报是真实的（即问题很严重）时再使用它。

## Quick Reference: `node inspect` REPL (快速参考)

在第一行暂停启动：

```bash
node inspect path/to/script.js
# 或带 tsx
node --inspect-brk $(which tsx) path/to/script.ts
```

`debug>` 提示符接受以下命令：

| Command | Action (操作) |
|---|---|
| `c` or `cont` | 继续执行 |
| `n` or `next` | 跳过一行（Step Over） |
| `s` or `step` | 步入（Step Into） |
| `o` or `out` | 步出（Step Out） |
| `pause` | 暂停正在运行的代码 |
| `sb('file.js', 42)` | 在 file.js 的第 42 行设置断点 |
| `sb(42)` | 在当前文件的第 42 行设置断点 |
| `sb('functionName')` | 当函数被调用时中断 |
| `cb('file.js', 42)` | 清除断点 |
| `breakpoints` | 列出所有断点 |
| `bt` | 回溯（Call Stack） |
| `list(5)` | 显示当前位置周围的 5 行源代码 |
| `watch('expr')` | 在每次暂停时评估 expr |
| `watchers` | 显示被监视的表达式 |
| `repl` | 进入当前作用域的 REPL (Ctrl+C 退出 REPL) |
| `exec expr` | 一次性评估表达式 |
| `restart` | 重启脚本 |
| `kill` | 杀死脚本 |
| `.exit` | 退出调试器 |

**在 `repl` 子模式下：** 输入任何 JS 表达式，包括访问局部变量/闭包变量。`Ctrl+C` 返回到 `debug>`。

## Attaching to a Running Process (附加到正在运行的进程)

当进程已经在运行（例如，一个长期运行的开发服务器或 TUI 网关）时：

```bash
# 1. 发送 SIGUSR1 以在现有进程上启用检查器
kill -SIGUSR1 <pid>
# Node 输出: Debugger listening on ws://127.0.0.1:9229/<uuid>

# 2. 附加调试器 CLI
node inspect -p <pid>
# 或通过 URL
node inspect ws://127.0.0.1:9229/<uuid>
```

要从头开始启动一个进程并启用检查器：

```bash
node --inspect script.js           # 在 127.0.0.1:9229 上监听，保持运行
node --inspect-brk script.js       # 监听并在一行上暂停
node --inspect=0.0.0.0:9230 script.js   # 自定义主机:端口
```

对于通过 tsx 使用 TypeScript：

```bash
node --inspect-brk --import tsx script.ts
# 或旧版 tsx
node --inspect-brk -r tsx/cjs script.ts
```

## Programmatic CDP (从终端脚本化)

当您想要自动化——设置多个断点、捕获作用域状态、编写重现脚本时——请使用 `chrome-remote-interface`：

```bash
npm i -g chrome-remote-interface        # 或项目本地安装
# 启动目标程序:
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

    // Walk scopes for locals (遍历局部作用域)
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

    // Evaluate an expression in the paused frame (在暂停的帧中评估一个表达式)
    const { result } = await Debugger.evaluateOnCallFrame({
      callFrameId: top.callFrameId,
      expression: 'typeof state !== "undefined" ? JSON.stringify(state) : "n/a"',
    });
    console.log('state =', result.value ?? result.description);

    await Debugger.resume();
  });

  await Runtime.enable();
  await Debugger.enable();

  // Set a breakpoint by URL regex + line (通过 URL 正则表达式和行设置断点)
  await Debugger.setBreakpointByUrl({
    urlRegex: '.*app\\.tsx$',
    lineNumber: 119,       // 0-indexed
    columnNumber: 0,
  });

  await Runtime.runIfWaitingForDebugger();
})();
```

运行它：

```bash
node /tmp/cdp-debug.js
```

Hermes 特殊说明：`chrome-remote-interface` 不在 `ui-tui/package.json` 中。如果您不想污染项目，请将其安装到一个临时位置：

```bash
mkdir -p /tmp/cdp-tools && cd /tmp/cdp-tools && npm i chrome-remote-interface
NODE_PATH=/tmp/cdp-tools/node_modules node /tmp/cdp-debug.js
```

## Debugging Hermes ui-tui (调试 Hermes ui-tui)

TUI 是用 Ink + tsx 构建的。有两种常见场景：

### Debugging a single Ink component under dev (在开发模式下调试单个 Ink 组件)

`ui-tui/package.json` 中有 `npm run dev` (tsx --watch)。通过直接运行 tsx 来添加 `--inspect-brk`:

```bash
cd /home/bb/hermes-agent/ui-tui
npm run build    # 生产 dist/ 一次，以确保首次加载时不需要转译
node --inspect-brk dist/entry.js
# 在另一个终端中:
node inspect -p <node pid>
```

然后在 `debug>` 中：

```
sb('dist/app.js', 220)     # 或可疑渲染的任何位置
cont
```

当它暂停时，`repl` → 检查 props、状态引用、`useInput` handler 值等。

### Debugging a running `hermes --tui` (调试正在运行的 `hermes --tui`)

TUI 是从 Python CLI 启动 Node 的。最简单的路径是：

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

与 TUI 交互（在它的窗口中输入）会继续推进执行；您的调试器可以在任何 `sb(...)` 断点处暂停它。

### Debugging `_SlashWorker` / PTY child processes (调试 `_SlashWorker` / PTY 子进程)

这些是 Python，而不是 Node — 请使用 `python-debugpy` 技能来处理它们。只有 Node 部分（Ink UI、tui_gateway client、在 `ui-tui/` 下运行 tsx 测试）才使用此技能。

## Running Vitest Tests Under the Debugger (在调试器下运行 Vitest 测试)

```bash
cd /home/bb/hermes-agent/ui-tui
# 启动一个测试文件，并在入口处暂停
node --inspect-brk ./node_modules/vitest/vitest.mjs run --no-file-parallelism src/app/foo.test.tsx
```

在另一个终端中：`node inspect -p <pid>`，然后 `sb('src/app/foo.tsx', 42)`，`cont`。

使用 `--no-file-parallelism` (vitest) 或 `--runInBand` (jest)，以确保只有一个工作进程存在——调试一个进程池是很痛苦的。

## Heap Snapshots & CPU Profiles (非交互式) (堆快照和 CPU 配置文件)

从上面的 CDP 驱动中，将 Debugger 替换为 `HeapProfiler` / `Profiler`：

```javascript
// CPU profile for 5 seconds (5 秒的 CPU 配置文件)
await client.Profiler.enable();
await client.Profiler.start();
await new Promise(r => setTimeout(r, 5000));
const { profile } = await client.Profiler.stop();
require('fs').writeFileSync('/tmp/cpu.cpuprofile', JSON.stringify(profile));
// 在 Chrome DevTools 的 → Performance 标签页中打开 /tmp/cpu.cpuprofile
```

```javascript
// Heap snapshot (堆快照)
await client.HeapProfiler.enable();
const chunks = [];
client.HeapProfiler.addHeapSnapshotChunk(({ chunk }) => chunks.push(chunk));
await client.HeapProfiler.takeHeapSnapshot({ reportProgress: false });
require('fs').writeFileSync('/tmp/heap.heapsnapshot', chunks.join(''));
```

## Common Pitfalls (常见陷阱)

1. **TS 源代码中的行号错误。** 断点命中的是导出的 JS，而不是 `.ts` 文件。要么（a）在构建的 `dist/*.js` 中设置断点，要么（b）启用 sourcemaps (`node --enable-source-maps`) 并使用 `sb('src/app.tsx', N)` — 但仅适用于遵循 sourcemap 的 CDP 客户端。`node inspect` CLI 不支持。

2. **`--inspect` vs `--inspect-brk`。** `--inspect` 会启动检查器但不会暂停；如果您附加得太晚，脚本会跳过您的第一个断点。当您需要在任何代码运行之前设置断点时，请使用 `--inspect-brk`。

3. **端口冲突。** 默认是 `9229`。如果多个 Node 进程正在检查，请传递 `--inspect=0` (随机端口) 并从 `/json/list` 读取实际的 URL：
   ```bash
   curl -s http://127.0.0.1:9229/json/list   # 列出主机上所有可检查的目标
   ```

4. **子进程。** 对父进程使用 `--inspect` 不会检查其子进程。请使用 `NODE_OPTIONS='--inspect-brk' node parent.js` 将其传播给每个子进程；请注意它们都需要唯一的端口（当继承了 `NODE_OPTIONS='--inspect'` 时，Node 会自动递增）。

5. **后台杀死。** 如果目标正在暂停状态下您从 `node inspect` 中按 `Ctrl+C` 退出，则目标仍保持暂停状态。请先使用 `cont`，或明确地 `kill` 目标。

6. **通过智能体终端运行 `node inspect`。** 它是一个 PTY（伪终端）友好的 REPL。在 Hermes 中，应使用 `terminal(pty=true)` 或 `background=true` + `process(action='submit', data='...')` 来启动它。非 PTY 前台模式适用于一次性命令，但不适用于交互式步进。

7. **安全。** `--inspect=0.0.0.0:9229` 会暴露任意代码执行。除非您有隔离的网络环境，否则始终绑定到 `127.0.0.1` (默认值)。

## Verification Checklist (验证清单)

设置好调试会话后，请验证：

- [ ] `curl -s http://127.0.0.1:9229/json/list` 返回了您期望的精确目标
- [ ] 第一个断点确实被命中（如果没有，您可能遗漏了 `--inspect-brk` 或在执行完成之后才附加）
- [ ] 暂停时的源代码列表显示了正确的文件（不匹配 = sourcemap 问题，参见陷阱 1）
- [ ] 在 `repl` 中运行 `exec process.pid` 返回了您打算附加的 PID

## One-Shot Recipes (一次性操作方案)

**“为什么这个变量在第 X 行是 undefined？”**
```bash
node --inspect-brk script.js &
node inspect -p $!
# debug>
sb('script.js', X)
cont
# paused. Now:
repl
> myVariable
> Object.keys(this)
```

**“这个函数调用路径是什么？”**
```
debug> sb('suspectFn')
debug> cont
# paused on entry (在入口处暂停)
debug> bt
```

**“这个异步链挂起了——在哪里？”**
```
# 使用 --inspect (不带 -brk) 启动，让它运行到挂起状态，然后:
debug> pause
debug> bt
# 现在您可以看到卡住的帧
```