---
title: "Node 检查调试器 — 调试节点"
sidebar_label: "Node 检查调试器"
description: "调试节点"
---

{/* 本页面由网站脚本 `generate-skill-docs.py` 根据技能的 `SKILL.md` 文件自动生成。请编辑源文件 `SKILL.md`，而非本页面。 */}

# Node 检查调试器

通过 `--inspect` + Chrome 开发者工具协议 CLI 调试 Node.js。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/software-development/node-inspect-debugger` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `调试`, `nodejs`, `node-inspect`, `cdp`, `断点`, `ui-tui` |
| 相关技能 | [`系统性调试`](/user-guide/skills/bundled/software-development/software-development-systematic-debugging), [`python 调试`](/user-guide/skills/bundled/software-development/software-development-python-debugpy), [`调试-Hermes-tui-命令`](/user-guide/skills/bundled/software-development/software-development-debugging-hermes-tui-commands) |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的说明。
:::

# Node.js 调试检查器

## 概述

当 `console.log` 不够用时，可以从终端以编程方式驱动 Node 内置的 V8 检查器。你可以获得真正的断点、步入/步过/步出、调用栈遍历、局部/闭包作用域转储，以及在暂停的帧中对任意表达式进行求值。

有两种工具可选：

- **`node inspect`** — 内置，无需安装，CLI REPL。适合快速探查。
- **`ndb` / 通过 `chrome-remote-interface` 使用 CDP** — 可从 Node/Python 脚本化控制；适合需要自动化设置多个断点、跨运行收集状态，或从智能体循环中进行非交互式调试的场景。

**优先使用 `node inspect`。** 它始终可用且 REPL 响应迅速。

## 何时使用

- Node 测试失败，需要查看中间状态
- ui-tui 崩溃或行为异常，想在渲染前检查 React/Ink 状态
- tui_gateway 子进程（`_SlashWorker`、PTY 桥接工作线程）行为不端
- 需要检查 `console.log` 无法触及的闭包中的值，且不想修改代码
- 性能分析：附加到运行中的进程以捕获 CPU 配置文件或堆快照

**不要用于：** 能在一分钟内用 `console.log` 解决的问题。基于断点的调试开销更大；只有在收益明确时才使用。

## 快速参考：`node inspect` REPL

在第一行启动并暂停：

```bash
node inspect path/to/script.js
# 或使用 tsx
node --inspect-brk $(which tsx) path/to/script.ts
```

`debug>` 提示符接受以下命令：

| 命令 | 操作 |
|---|---|
| `c` 或 `cont` | 继续执行 |
| `n` 或 `next` | 步过（执行下一行） |
| `s` 或 `step` | 步入（进入函数） |
| `o` 或 `out` | 步出（跳出当前函数） |
| `pause` | 暂停正在运行的代码 |
| `sb('file.js', 42)` | 在 file.js 的第 42 行设置断点 |
| `sb(42)` | 在当前文件的第 42 行设置断点 |
| `sb('functionName')` | 当函数被调用时中断 |
| `cb('file.js', 42)` | 清除断点 |
| `breakpoints` | 列出所有断点 |
| `bt` | 回溯（调用栈） |
| `list(5)` | 显示当前位置周围的 5 行源代码 |
| `watch('expr')` | 在每次暂停时对表达式 `expr` 求值 |
| `watchers` | 显示已监视的表达式 |
| `repl` | 进入当前作用域的 REPL（按 Ctrl+C 退出 REPL） |
| `exec expr` | 对表达式求值一次 |
| `restart` | 重启脚本 |
| `kill` | 终止脚本 |
| `.exit` | 退出调试器 |

**在 `repl` 子模式下：** 输入任何 JS 表达式，包括访问局部/闭包变量。`Ctrl+C` 返回 `debug>` 提示符。

## 附加到运行中的进程

当进程已在运行（例如，长期运行的开发服务器或 TUI 网关）时：

```bash
# 1. 向现有进程发送 SIGUSR1 以启用检查器
kill -SIGUSR1 <pid>
# Node 会打印：Debugger listening on ws://127.0.0.1:9229/<uuid>

# 2. 附加调试器 CLI
node inspect -p <pid>
# 或通过 URL
node inspect ws://127.0.0.1:9229/<uuid>
```

要从一开始就启动带检查器的进程：

```bash
node --inspect script.js           # 在 127.0.0.1:9229 上监听，保持运行
node --inspect-brk script.js       # 监听并在第一行暂停
node --inspect=0.0.0.0:9230 script.js   # 自定义主机:端口
```

通过 tsx 使用 TypeScript：

```bash
node --inspect-brk --import tsx script.ts
# 或旧版 tsx
node --inspect-brk -r tsx/cjs script.ts
```

## 编程式 CDP（从终端脚本化控制）

当你想要自动化操作时 — 设置多个断点、捕获作用域状态、脚本化重现问题 — 请使用 `chrome-remote-interface`：

```bash
npm i -g chrome-remote-interface        # 或安装到项目本地
# 启动你的目标：
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

    // 在暂停的帧中对表达式求值
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

Hermes 特别说明：`chrome-remote-interface` 不在 `ui-tui/package.json` 中。如果你不想污染项目环境，可以将其安装到一个临时位置：

```bash
mkdir -p /tmp/cdp-tools && cd /tmp/cdp-tools && npm i chrome-remote-interface
NODE_PATH=/tmp/cdp-tools/node_modules node /tmp/cdp-debug.js
```

## 调试 Hermes ui-tui

TUI 由 Ink + tsx 构建。两种常见场景：

### 开发环境下调试单个 Ink 组件

`ui-tui/package.json` 中有 `npm run dev`（tsx --watch）。通过直接运行 tsx 来添加 `--inspect-brk`：

```bash
cd /home/bb/hermes-agent/ui-tui
npm run build    # 先生成 dist/，这样首次加载时无需转译
node --inspect-brk dist/entry.js
# 在另一个终端：
node inspect -p <node pid>
```

然后在 `debug>` 中：

```
sb('dist/app.js', 220)     # 或怀疑有问题的渲染位置
cont
```

当它暂停时，`repl` → 检查 `props`、状态引用、`useInput` 处理程序的值等。

### 调试运行中的 `hermes --tui`

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

与 TUI 交互（在其窗口中输入）会继续推进执行；你的调试器可以在任何时候通过 `sb(...)` 设置的断点暂停它。

### 调试 `_SlashWorker` / PTY 子进程

它们是 Python 编写的，不是 Node — 请使用 `python-debugpy` 技能。只有 Node 部分（Ink UI、tui_gateway 客户端、`ui-tui/` 下通过 tsx 运行的测试）使用此技能。

## 在调试器下运行 Vitest 测试

```bash
cd /home/bb/hermes-agent/ui-tui
# 运行单个测试文件，并在入口处暂停
node --inspect-brk ./node_modules/vitest/vitest.mjs run --no-file-parallelism src/app/foo.test.tsx
```

在另一个终端：`node inspect -p <pid>`，然后 `sb('src/app/foo.tsx', 42)`，`cont`。

使用 `--no-file-parallelism`（vitest）或 `--runInBand`（jest）以确保只有一个工作线程存在 — 调试一个线程池会很痛苦。

## 堆快照与 CPU 配置文件（非交互式）

从上面的 CDP 驱动脚本中，将 Debugger 替换为 `HeapProfiler` / `Profiler`：

```javascript
// 持续 5 秒的 CPU 配置文件
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

1.  **TS 源文件中的行号错误。** 断点命中的是编译输出的 JS 文件，而不是 `.ts` 文件。要么 (a) 在构建好的 `dist/*.js` 中设置断点，要么 (b) 启用源映射 (`node --enable-source-maps`) 并使用 `sb('src/app.tsx', N)` — 但这仅适用于支持源映射的 CDP 客户端。`node inspect` CLI 不支持。

2.  **`--inspect` 与 `--inspect-brk`。** `--inspect` 启动检查器但不暂停；如果你附加得太晚，你的脚本可能会错过第一个断点。当你需要在任何代码运行前设置断点时，请使用 `--inspect-brk`。

3.  **端口冲突。** 默认端口是 `9229`。如果多个 Node 进程正在检查，请传递 `--inspect=0`（随机端口）并从 `/json/list` 读取实际 URL：
    ```bash
    curl -s http://127.0.0.1:9229/json/list   # 列出主机上所有可检查的目标
    ```

4.  **子进程。** 在父进程上使用 `--inspect` 不会检查其子进程。使用 `NODE_OPTIONS='--inspect-brk' node parent.js` 将设置传播到每个子进程；请注意，它们都需要唯一的端口（当继承 `NODE_OPTIONS='--inspect'` 时，Node 会自动递增端口）。

5.  **后台终止。** 如果你在 `node inspect` 中按 `Ctrl+C` 而目标处于暂停状态，目标将保持暂停。请先执行 `cont`，或显式终止目标。

6.  **通过智能体终端运行 `node inspect`。** 这是一个 PTY 友好的 REPL。在 Hermes 中，使用 `terminal(pty=true)` 或 `background=true` + `process(action='submit', data='...')` 来启动它。非 PTY 的前台模式适用于一次性命令，但不适用于交互式单步调试。

7.  **安全性。** `--inspect=0.0.0.0:9229` 会暴露任意代码执行。始终绑定到 `127.0.0.1`（默认值），除非你处于隔离网络环境中。

## 验证清单

设置好调试会话后，请验证：

- [ ] `curl -s http://127.0.0.1:9229/json/list` 返回的正是您期望的目标
- [ ] 第一个断点确实被命中（如果没有，您可能遗漏了 `--inspect-brk` 或在执行完成后才附加）
- [ ] 暂停时显示的源文件列表是正确的文件（不匹配意味着源映射问题，参见陷阱 1）
- [ ] 在 `repl` 中执行 `exec process.pid` 返回的是您意图附加的进程 PID

## 一次性配方

**“为什么变量在第 X 行是未定义的？”**
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

**“调用此函数的调用路径是什么？”**
```
debug> sb('suspectFn')
debug> cont
# 在入口处暂停
debug> bt
```

**“这个异步链挂起 — 问题出在哪里？”**
```
# 使用 --inspect（不带 -brk）启动，让其运行到挂起点，然后：
debug> pause
debug> bt
# 现在您会看到卡住的栈帧
```