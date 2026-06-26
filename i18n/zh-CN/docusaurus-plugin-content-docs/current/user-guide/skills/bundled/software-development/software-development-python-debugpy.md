---
title: Python Debugpy — 调试 Python：pdb REPL + debugpy 远程 (DAP)
sidebar_label: Python Debugpy
description: 调试 Python：pdb REPL + debugpy 远程 (DAP)
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Python Debugpy

调试 Python：pdb REPL + debugpy 远程 (DAP)。

## Skill metadata

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/software-development/python-debugpy` |
| Version | `1.0.0` |
| Author | Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos |
| Tags | `debugging`, `python`, `pdb`, `debugpy`, `breakpoints`, `dap`, `post-mortem` |
| Related skills | [`systematic-debugging`](/docs/user-guide/skills/bundled/software-development/software-development-systematic-debugging), [`node-inspect-debugger`](/docs/user-guide/skills/bundled/software-development/software-development-node-inspect-debugger), `debugging-hermes-tui-commands` |

## 关键路径和配置

```
~/.hermes/config.yaml       主配置文件
~/.hermes/.env              API密钥和秘密信息（如果设置了$HERMES_HOME）
```

# Python Debugger (pdb + debugpy)

## 概览

根据情况选择三种工具：

| 工具 | 用途 |
|---|---|
| **`breakpoint()` + pdb** | 本地、交互式、最简单。在源代码中添加 `breakpoint()`，正常运行，即可在某一行处获得REPL。 |
| **`python -m pdb`** | 在没有源代码编辑的情况下，使用pdb启动现有脚本。适用于快速检查。 |
| **`debugpy`** | 远程/无头（headless）/“附加到正在运行的进程”。支持DAP协议，可从终端脚本化，适用于生命周期较长的进程（网关、守护程序、PTY子进程）。 |

**先使用 `breakpoint()`。** 这是最廉价且有效的方案。

## 何时使用

- 测试失败，而回溯信息无法揭示某个值为何错误
- 你需要单步执行一个函数并观察一个集合体的变化
- 一个长时间运行的进程（hermes 网关、tui_gateway）行为异常，你无法重启它
- 事后分析：生产环境代码中抛出了异常，你想检查崩溃点处的局部变量
- 子进程/子程序（Python 的 `_SlashWorker`、PTY 桥接工作者）是实际的错误源头

**不应用于：** 一分钟内就能用 `print()` / `logging.debug` 解决的事情，或那些已经被 `pytest -vv --tb=long --showlocals` 揭示出来的事情。

## pdb 快速参考

在任何 pdb 提示符（`(Pdb)`）中：

| 命令 | 操作 |
|---|---|
| `h` / `h cmd` | 帮助 |
| `n` | 下一步 (step over) |
| `s` | 单步进入 (step into) |
| `r` | 从当前函数返回 |
| `c` | 继续执行 |
| `unt N` | 直到第N行继续 |
| `j N` | 跳转到第N行（仅限同一函数） |
| `l` / `ll` | 列出当前行附近的源代码 / 完整函数 |
| `w` | where (堆栈跟踪) |
| `u` / `d` | 上移 / 下移堆栈 |
| `a` | 打印当前函数的参数 |
| `p expr` / `pp expr` | 打印 / 美观打印表达式 |
| `display expr` | 在每次停止时自动打印表达式 |
| `b file:line` | 设置断点 |
| `b func` | 在函数入口处中断 |
| `b file:line, cond` | 条件断点 |
| `cl N` | 清除第N个断点 |
| `tbreak file:line` | 一次性断点 |
| `!stmt` | 执行任意 Python（包括赋值） |
| `interact` | 进入当前作用域的完整 Python REPL (Ctrl+D 退出) |
| `q` | 退出 |

`interact` 命令功能最强大——你可以导入任何内容，检查复杂的对象，甚至调用会修改状态的方法。局部变量默认是只读的；请使用 `(Pdb)` 提示符中的 `!x = 42` 来进行修改。

## Recipe 1: 本地断点

这是最简单的做法。编辑文件：

```python
def compute(x, y):
    result = some_helper(x)
    breakpoint()           # <-- 在这里进入 pdb
    return result + y
```

正常运行代码。你将停在 `breakpoint()` 这一行，并可以完全访问局部变量。

**切勿忘记提交前移除 `breakpoint()`。** 使用 `git diff` 或预提交的 grep：
```bash
rg -n 'breakpoint\(\)' --type py
```

## Recipe 2: 在 pdb 下启动脚本（无需修改源代码）

```bash
python -m pdb path/to/script.py arg1 arg2
# 停在脚本的第一行
(Pdb) b path/to/script.py:42
(Pdb) c
```

## Recipe 3: Debug pytest 测试

hermes 测试运行器和 pytest 都支持此功能：

```bash
# 在失败时（或任何异常抛出时）进入 pdb：
scripts/run_tests.sh tests/path/to/test_file.py::test_name --pdb

# 在测试开始时进入 pdb：
scripts/run_tests.sh tests/path/to/test_file.py::test_name --trace

# 在没有 pdb 的情况下显示回溯中的局部变量：
scripts/run_tests.sh tests/path/to/test_file.py --showlocals --tb=long
```

注意：`scripts/run_tests.sh` 默认使用 xdist (`-n 4`)，而 pdb 在 xdist 下是无效的。请添加 `-p no:xdist` 或使用 `-n 0` 单独运行测试：

```bash
scripts/run_tests.sh tests/foo_test.py::test_bar --pdb -p no:xdist
# 或者
source .venv/bin/activate
python -m pytest tests/foo_test.py::test_bar --pdb
```

这绕过了 hermetic-env 的保证——这对调试是没问题的，但在推送前仍需使用包装器重新运行以确认。

## Recipe 4: 对任何异常进行事后分析 (Post-mortem)

```python
import pdb, sys
try:
    run_the_thing()
except Exception:
    pdb.post_mortem(sys.exc_info()[2])
```

或者包装整个脚本：

```bash
python -m pdb -c continue script.py
# 当它崩溃时，pdb 会捕获它，你就会在异常的帧中
```

或者在 repl/jupyter 中设置一个全局钩子：

```python
import sys
def excepthook(etype, value, tb):
    import pdb; pdb.post_mortem(tb)
sys.excepthook = excepthook
```

## Recipe 5: 使用 debugpy 进行远程调试（附加到正在运行的进程）

对于生命周期较长的进程：Hermes 网关、tui_gateway、守护程序，或一个已经表现异常且无法干净重启的进程。

### 设置

```bash
source /home/bb/hermes-agent/.venv/bin/activate
pip install debugpy
```

### Pattern A: 源代码编辑 — 进程等待调试器启动时连接

在入口点附近（或在你想调试的函数内部）添加：

```python
import debugpy
debugpy.listen(("127.0.0.1", 5678))
print("debugpy listening on 5678, waiting for client...", flush=True)
debugpy.wait_for_client()
debugpy.breakpoint()       # 可选：一旦连接上就立即暂停
```

启动进程；它会阻塞在 `wait_for_client()`。

### Pattern B: 无源代码编辑 — 使用 `-m debugpy` 启动

```bash
python -m debugpy --listen 127.0.0.1:5678 --wait-for-client your_script.py arg1
```

模块入口点的等效用法：

```bash
python -m debugpy --listen 127.0.0.1:5678 --wait-for-client -m your.module
```

### Pattern C: 附加到正在运行的进程

需要目标环境中的 PID 和预装的 debugpy：

```bash
python -m debugpy --listen 127.0.0.1:5678 --pid <pid>
# debugpy 会将自身注入到进程中。然后像下面一样附加一个客户端。
```

某些内核/安全配置会阻止基于 ptrace 的注入（`/proc/sys/kernel/yama/ptrace_scope`）。解决方法：

```bash
echo 0 | sudo tee /proc/sys/kernel/yama/ptrace_scope
```

### 从终端连接客户端

最简单的终端侧 DAP 客户端是 VS Code CLI 或一个小脚本。在 Hermes 内部，你有两种实用的选择：

**Option 1: `debugpy` 自带的 CLI REPL** — 这不是官方功能，但是一个小型 DAP 客户端脚本：

```python
# /tmp/dap_client.py
import socket, json, itertools, time, sys

HOST, PORT = "127.0.0.1", 5678
s = socket.create_connection((HOST, PORT))
seq = itertools.count(1)

def send(msg):
    msg["seq"] = next(seq)
    body = json.dumps(msg).encode()
    s.sendall(f"Content-Length: {len(body)}\r\n\r\n".encode() + body)

def recv():
    header = b""
    while b"\r\n\r\n" not in header:
        header += s.recv(1)
    length = int(header.decode().split("Content-Length:")[1].split("\r\n")[0].strip())
    body = b""
    while len(body) < length:
        body += s.recv(length - len(body))
    return json.loads(body)

send({"type": "request", "command": "initialize", "arguments": {"adapterID": "python"}})
print(recv())
send({"type": "request", "command": "attach", "arguments": {}})
print(recv())
send({"type": "request", "command": "setBreakpoints",
      "arguments": {"source": {"path": sys.argv[1]},
                    "breakpoints": [{"line": int(sys.argv[2])}]}})
print(recv())
send({"type": "request", "command": "configurationDone"})
# ... 循环读取事件并发送 continue/stepIn 等指令。
```

这适用于一次性自动化，但作为交互式用户体验来说会很痛苦。

**Option 2: 从 VS Code / Cursor / Zed 附加** — 如果用户打开了这些工具，他们可以添加一个 `launch.json`：

```json
{
  "name": "Attach to Hermes",
  "type": "debugpy",
  "request": "attach",
  "connect": { "host": "127.0.0.1", "port": 5678 },
  "justMyCode": false,
  "pathMappings": [
    { "localRoot": "${workspaceFolder}", "remoteRoot": "/home/bb/hermes-agent" }
  ]
}
```

**Option 3: 放弃 DAP，使用 `remote-pdb`** — 这通常是终端智能体真正需要的：

```bash
pip install remote-pdb
```

在你的代码中：
```python
from remote_pdb import set_trace
set_trace(host="127.0.0.1", port=4444)   # 直到连接为止阻塞
```

然后从终端执行：
```bash
nc 127.0.0.1 4444
# 你将获得一个与本地调试完全相同的 (Pdb) 提示符。
```

`remote-pdb` 是当 `debugpy` 的 DAP 协议过于繁琐时，最干净的智能体友好选择。只有当你真正需要 IDE 集成时才使用 `debugpy`。

## Debugging Hermes 特定的进程

### 测试
参考 Recipe 3。始终添加 `-p no:xdist` 或在没有 xdist 的情况下运行单个测试。

### `run_agent.py` / CLI — 一次性任务
最简单的方法：在可疑行附近添加 `breakpoint()`，然后正常运行 `hermes`。控制权将返回到你的终端，停在暂停点。

### `tui_gateway` 子进程（由 `hermes --tui` 派生）
网关作为 Node TUI 的子进程运行。选项：

**A. 源代码编辑网关：**
```python
# tui_gateway/server.py 在 serve() 顶部附近
import debugpy
debugpy.listen(("127.0.0.1", 5678))
debugpy.wait_for_client()
```
启动 `hermes --tui`。TUI 将显示为冻结状态（其后端正在等待）。附加一个客户端；当你执行 `continue` 时，执行才会恢复。

**B. 在特定处理器中使用 `remote-pdb`：**
```python
from remote_pdb import set_trace
set_trace(host="127.0.0.1", port=4444)   # 在你想捕获的 RPC 处理器中
```
从 TUI 触发匹配的斜杠命令，然后在另一个终端执行 `nc 127.0.0.1 4444`。

### `_SlashWorker` 子进程
相同的模式——在 worker 的 `exec` 路径中使用 `remote-pdb` 和 `set_trace()`。worker 是跨斜杠命令持久存在的，因此第一次触发会阻塞直到你连接；随后的斜杠命令会正常通过，除非你重新设置陷阱。

### 网关 (`gateway/run.py`)
生命周期长。在处理器中使用 `remote-pdb`，或者如果你无论如何都要重启网关，则使用 `--wait-for-client` 的 `debugpy`。

## 常见陷阱

1. **pytest-xdist 下的 pdb 静默无效。** 你不会看到提示符，测试会挂起。始终使用 `-p no:xdist` 或 `-n 0`。

2. **CI / 非 TTY 环境中的 `breakpoint()` 会导致进程挂起。** 本地安全；切勿提交它。添加一个预提交 grep 作为安全网。

3. **`PYTHONBREAKPOINT=0`** 会禁用所有 `breakpoint()` 调用。如果你的断点没有触发，请检查环境变量：
   ```bash
   echo $PYTHONBREAKPOINT
   ```

4. **`debugpy.listen` 只有在你同时调用 `wait_for_client()` 时才会阻塞。** 如果没有它，执行会继续进行，你的第一个断点可能在客户端附加之前就触发了。

5. **附加到 PID 在加固内核上失败。** `ptrace_scope=1` (Ubuntu 默认) 只允许同用户进程的子进程 ptrace。解决方法：`echo 0 > /proc/sys/kernel/yama/ptrace_scope` (需要 root) 或从一开始就使用 `debugpy` 启动。

6. **线程。** `pdb` 只调试当前线程。对于多线程代码，请使用 `debugpy`（线程感知的 DAP）或为每个线程设置 `threading.settrace()`。

7. **asyncio。** `pdb` 在协程中工作，但要在旧版本中使用 `interact` 模式下的 `await` 才能在 pdb 中进行 `await`。对于 3.11/3.12，请使用 `asyncio.run_coroutine_threadsafe` 技巧或通过 `asyncio.ensure_future` 进行基于 `!stmt` 的 await。

8. **`scripts/run_tests.sh` 会剥离凭证并设置 `HOME=<tmpdir>`。** 如果你的 Bug 依赖于用户配置或真实的 API 密钥，它将无法在包装器下重现。请先使用原始的 `pytest` 进行复现，然后再在包装器下重新确认。

9. **分叉/多进程。** pdb 不会跟随 fork。每个子进程都需要自己的 `breakpoint()` 或 `set_trace()`。对于 Hermes 子智能体，一次调试一个进程。

## 验证清单

- [ ] After `pip install debugpy`, confirm: `python -c "import debugpy; print(debugpy.__version__)"`
- [ ] For remote debug, confirm the port is actually listening: `ss -tlnp | grep 5678`
- [ ] First breakpoint actually hits (if it doesn't, you likely have `PYTHONBREAKPOINT=0`, you're under xdist, or execution finished before attach)
- [ ] `where` / `w` shows the expected call stack
- [ ] Post-debug cleanup: no stray `breakpoint()` / `set_trace()` in committed code
  ```bash
  rg -n 'breakpoint\(\)|set_trace\(|debugpy\.listen' --type py
  ```

## 一次性方案

**"为什么这个字典缺少一个键？"**
```python
# add above the KeyError site
breakpoint()
# then in pdb:
(Pdb) pp d
(Pdb) pp list(d.keys())
(Pdb) w                # how did we get here
```

**"这个测试单独运行通过，但在套件中失败。"**
```bash
scripts/run_tests.sh tests/the_test.py --pdb -p no:xdist
# But if it only fails WITH other tests:
source .venv/bin/activate
python -m pytest tests/ -x --pdb -p no:xdist
# Now it pdb-traps at the exact failing test after state accumulated.
```

**"我的异步处理器死锁了。"**
```python
# Add at handler entry
import remote_pdb; remote_pdb.set_trace(host="127.0.0.1", port=4444)
```
Trigger the handler. `nc 127.0.0.1 4444`, then `w` to see the suspended frame, `!import asyncio; asyncio.all_tasks()` to see what else is pending.

**"对Ink子进程/子进程崩溃后的事后分析。"**
```bash
PYTHONFAULTHANDLER=1 python -m pdb -c continue path/to/entrypoint.py
# On crash, pdb lands at the frame of the exception with full locals
```