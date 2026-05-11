---
title: "Python Debugpy — 调试 Python：pdb REPL + debugpy 远程 (DAP)"
sidebar_label: "Python Debugpy"
description: "调试 Python：pdb REPL + debugpy 远程 (DAP)"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源 SKILL.md 文件，而非本页面。 */}

# Python Debugpy

调试 Python：pdb REPL + debugpy 远程 (DAP)。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/software-development/python-debugpy` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos |
| 标签 | `调试`, `python`, `pdb`, `debugpy`, `断点`, `dap`, `事后分析` |
| 相关技能 | [`系统性调试`](/docs/user-guide/skills/bundled/software-development/software-development-systematic-debugging), [`node-inspect-debugger`](/docs/user-guide/skills/bundled/software-development/software-development-node-inspect-debugger), [`调试-hermes-tui-命令`](/docs/user-guide/skills/bundled/software-development/software-development-debugging-hermes-tui-commands) |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# Python 调试器 (pdb + debugpy)

## 概述

三种工具，根据情况选用：

| 工具 | 适用场景 |
|---|---|
| **`breakpoint()` + pdb** | 本地、交互式、最简单。在源代码中添加 `breakpoint()`，正常运行，即可在该行得到一个 REPL。 |
| **`python -m pdb`** | 无需修改源代码，在 pdb 下启动现有脚本。适用于快速探查。 |
| **`debugpy`** | 远程 / 无界面 / "附加到已运行进程"。使用 DAP 协议，可从终端脚本化，适用于长期运行的进程（网关、守护进程、PTY 子进程）。 |

**从 `breakpoint()` 开始。** 这是最省事的有效方法。

## 何时使用

- 测试失败，且错误跟踪未揭示为何某个值出错
- 你需要单步执行函数并观察集合的变更
- 长期运行的进程（hermes 网关、tui_gateway）行为异常且无法重启
- 事后分析：生产环境代码中抛出了异常，你想在崩溃点检查局部变量
- 实际出错的点是子进程/子级（Python `_SlashWorker`、PTY 桥接工作进程）

**不要用于：** 能在一分钟内用 `print()` / `logging.debug` 解决的事情，或者 `pytest -vv --tb=long --showlocals` 已经能揭示的事情。

## pdb 快速参考

在任何 pdb 提示符 (`(Pdb)`) 下：

| 命令 | 操作 |
|---|---|
| `h` / `h cmd` | 帮助 |
| `n` | 下一行（单步跳过） |
| `s` | 单步进入 |
| `r` | 从当前函数返回 |
| `c` | 继续运行 |
| `unt N` | 继续运行直到第 N 行 |
| `j N` | 跳转到第 N 行（仅限同一函数） |
| `l` / `ll` | 列出当前行/整个函数周围的源代码 |
| `w` | where（堆栈跟踪） |
| `u` / `d` | 在堆栈中上移 / 下移 |
| `a` | 打印当前函数的参数 |
| `p expr` / `pp expr` | 打印 / 格式化打印表达式 |
| `display expr` | 每次停止时自动打印 expr |
| `b file:line` | 设置断点 |
| `b func` | 在函数入口处中断 |
| `b file:line, cond` | 条件断点 |
| `cl N` | 清除断点 N |
| `tbreak file:line` | 一次性断点 |
| `!stmt` | 执行任意 Python 语句（包括赋值） |
| `interact` | 在当前作用域进入完整的 Python REPL（按 Ctrl+D 退出） |
| `q` | 退出 |

`interact` 命令最强大——你可以导入任何模块，检查复杂对象，甚至调用会改变状态的方法。局部变量默认为只读；在 `(Pdb)` 提示符下使用 `!x = 42` 来修改它们。

## 方法 1：本地断点

最简单。编辑文件：

```python
def compute(x, y):
    result = some_helper(x)
    breakpoint()           # <-- 在此处进入 pdb
    return result + y
```

正常运行代码。你将在 `breakpoint()` 行停下来，并拥有对局部变量的完全访问权限。

**提交前别忘了移除 `breakpoint()`。** 使用 `git diff` 或预提交 grep 检查：
```bash
rg -n 'breakpoint\(\)' --type py
```

## 方法 2：在 pdb 下启动脚本（无需修改源代码）

```bash
python -m pdb path/to/script.py arg1 arg2
# 停在脚本第一行
(Pdb) b path/to/script.py:42
(Pdb) c
```

## 方法 3：调试 pytest 测试

hermes 测试运行器和 pytest 都支持：

```bash
# 失败时（或任何引发的异常时）进入 pdb：
scripts/run_tests.sh tests/path/to/test_file.py::test_name --pdb

# 在测试开始时进入 pdb：
scripts/run_tests.sh tests/path/to/test_file.py::test_name --trace

# 不使用 pdb，在跟踪信息中显示局部变量：
scripts/run_tests.sh tests/path/to/test_file.py --showlocals --tb=long
```

注意：`scripts/run_tests.sh` 默认使用 xdist (`-n 4`)，而 pdb 在 xdist 下不起作用。添加 `-p no:xdist` 或使用 `-n 0` 运行单个测试：

```bash
scripts/run_tests.sh tests/foo_test.py::test_bar --pdb -p no:xdist
# 或者
source .venv/bin/activate
python -m pytest tests/foo_test.py::test_bar --pdb
```

这绕过了环境隔离保证——用于调试没问题，但在推送前请在封装器下重新运行确认。

## 方法 4：对任何异常进行事后分析

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
# 当它崩溃时，pdb 会捕获它，你就进入了异常发生的帧
```

或者在 REPL/Jupyter 中设置全局钩子：

```python
import sys
def excepthook(etype, value, tb):
    import pdb; pdb.post_mortem(tb)
sys.excepthook = excepthook
```

## 方法 5：使用 debugpy 进行远程调试（附加到正在运行的进程）

适用于长期运行的进程：Hermes 网关、tui_gateway、守护进程、一个已经行为异常且无法干净重启的进程。

### 设置

```bash
source /home/bb/hermes-agent/.venv/bin/activate
pip install debugpy
```

### 模式 A：修改源代码 — 进程在启动时等待调试器

在入口点顶部附近（或在你想要调试的函数内部）添加：

```python
import debugpy
debugpy.listen(("127.0.0.1", 5678))
print("debugpy 正在监听 5678，等待客户端...", flush=True)
debugpy.wait_for_client()
debugpy.breakpoint()       # 可选：一旦附加立即暂停
```

启动进程；它会阻塞在 `wait_for_client()`。

### 模式 B：不修改源代码 — 使用 `-m debugpy` 启动

```bash
python -m debugpy --listen 127.0.0.1:5678 --wait-for-client your_script.py arg1
```

模块入口的等效命令：

```bash
python -m debugpy --listen 127.0.0.1:5678 --wait-for-client -m your.module
```

### 模式 C：附加到已运行的进程

需要目标进程的 PID，并且在目标环境中预装了 debugpy：

```bash
python -m debugpy --listen 127.0.0.1:5678 --pid <pid>
# debugpy 会将自身注入到进程中。然后按照下面的方式附加客户端。
```

某些内核/安全配置会阻止基于 ptrace 的注入 (`/proc/sys/kernel/yama/ptrace_scope`)。可通过以下方式修复：
```bash
echo 0 | sudo tee /proc/sys/kernel/yama/ptrace_scope
```

### 从终端连接客户端

最简单的终端端 DAP 客户端是 VS Code CLI 或一个小型脚本。在 Hermes 内部，你有两个实用选项：

**选项 1：`debugpy` 自带的 CLI REPL** — 不是一个官方功能，但可以写一个小 DAP 客户端脚本：

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
# ... 循环读取事件并发送 continue/stepIn 等命令。
```

这对于一次性自动化很好，但作为交互式用户体验来说很痛苦。

**选项 2：从 VS Code / Cursor / Zed 附加** — 如果用户打开了其中一个，他们可以添加一个 `launch.json`：

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

**选项 3：放弃 DAP，使用 `remote-pdb`** — 通常这才是终端智能体真正想要的：

```bash
pip install remote-pdb
```

在你的代码中：
```python
from remote_pdb import set_trace
set_trace(host="127.0.0.1", port=4444)   # 阻塞直到连接建立
```

然后从终端：
```bash
nc 127.0.0.1 4444
# 你会得到一个 (Pdb) 提示符，就像在本地调试一样。
```

当 `debugpy` 的 DAP 协议显得过于复杂时，`remote-pdb` 是对智能体最友好的干净选择。只有在确实需要 IDE 集成时才使用 `debugpy`。

## 调试 Hermes 特定进程

### 测试
参见方法 3。始终添加 `-p no:xdist` 或在不使用 xdist 的情况下运行单个测试。

### `run_agent.py` / CLI — 一次性运行
最简单：在可疑行附近添加 `breakpoint()`，然后正常运行 `hermes`。控制权会在暂停点返回到你的终端。

### `tui_gateway` 子进程（由 `hermes --tui` 生成）
网关作为 Node TUI 的子进程运行。选项：

**A. 修改网关源代码：**
```python
# tui_gateway/server.py 在 serve() 函数顶部附近
import debugpy
debugpy.listen(("127.0.0.1", 5678))
debugpy.wait_for_client()
```
启动 `hermes --tui`。TUI 界面会显得冻结（因为后端正在等待）。附加一个客户端；当你执行 `continue` 时，执行会恢复。

**B. 在特定处理程序中使用 `remote-pdb`：**
```python
from remote_pdb import set_trace
set_trace(host="127.0.0.1", port=4444)   # 在你想要捕获的 RPC 处理程序中
```
从 TUI 触发对应的斜杠命令，然后在另一个终端执行 `nc 127.0.0.1 4444`。

### `_SlashWorker` 子进程
同样的模式——在工作进程的 `exec` 路径中使用 `remote-pdb` 和 `set_trace()`。工作进程在多次斜杠命令调用之间是持久的，所以第一次触发会阻塞直到你连接；后续的斜杠命令会正常通过，除非你重新设置。

### 网关 (`gateway/run.py`)
长期运行。在某个处理程序中使用 `remote-pdb`，或者如果你要重启网关，可以使用带 `--wait-for-client` 的 `debugpy`。

## 常见陷阱

1.  **pdb 在 pytest-xdist 下会静默失效。** 你不会看到提示，测试只是挂起。始终使用 `-p no:xdist` 或 `-n 0`。

2.  **`breakpoint()` 在 CI / 非 TTY 上下文中会使进程挂起。** 本地使用是安全的；切勿提交它。添加一个预提交 grep 作为安全网。

3.  **`PYTHONBREAKPOINT=0` 会禁用所有 `breakpoint()` 调用。** 如果你的断点没有触发，请检查环境变量：
    ```bash
    echo $PYTHONBREAKPOINT
    ```

4.  **`debugpy.listen` 仅在你同时调用 `wait_for_client()` 时才会阻塞。** 如果没有它，执行会继续，你的第一个断点可能会在客户端连接之前触发。

5.  **附加到 PID 在加固的内核上会失败。** `ptrace_scope=1`（Ubuntu 默认）仅允许同用户对子进程进行 ptrace。解决方法：`echo 0 > /proc/sys/kernel/yama/ptrace_scope`（需要 root 权限）或者从一开始就通过 `debugpy` 启动。

6.  **线程。** `pdb` 只调试当前线程。对于多线程代码，使用 `debugpy`（支持线程的 DAP）或为每个线程设置 `threading.settrace()`。

7.  **asyncio。** `pdb` 可以在协程中工作，但 pdb 中的 `await` 需要 Python 3.13+ 或在旧版本中通过 `interact` 模式使用 `await`。对于 3.11/3.12，可以使用 `asyncio.run_coroutine_threadsafe` 技巧或通过 `asyncio.ensure_future` 使用基于 `!stmt` 的 `await`。

8.  **`scripts/run_tests.sh` 会剥离凭据并设置 `HOME=<tmpdir>`。** 如果你的 bug 依赖于用户配置或真实的 API 密钥，它在包装器下将无法重现。首先使用原始 `pytest` 进行调试以重现，然后在包装器下重新确认。

9.  **Forking / 多进程。** pdb 不会跟踪 fork。每个子进程都需要自己的 `breakpoint()` 或 `set_trace()`。对于 Hermes 子智能体，一次只调试一个进程。

## 验证清单

- [ ] `pip install debugpy` 后，确认：`python -c "import debugpy; print(debugpy.__version__)"`
- [ ] 对于远程调试，确认端口确实在监听：`ss -tlnp | grep 5678`
- [ ] 第一个断点确实触发（如果没有，你很可能设置了 `PYTHONBREAKPOINT=0`、处于 xdist 下或在附加前执行已完成）
- [ ] `where` / `w` 显示预期的调用栈
- [ ] 调试后清理：提交的代码中没有多余的 `breakpoint()` / `set_trace()`
  ```bash
  rg -n 'breakpoint\(\)|set_trace\(|debugpy\.listen' --type py
  ```

## 一次性解决方案

**“为什么这个字典缺少一个键？”**
```python
# 在 KeyError 站点上方添加
breakpoint()
# 然后在 pdb 中：
(Pdb) pp d
(Pdb) pp list(d.keys())
(Pdb) w                # 我们是怎么到这里的
```

**“这个测试单独运行时通过，但在套件中失败。”**
```bash
scripts/run_tests.sh tests/the_test.py --pdb -p no:xdist
# 但如果它只在有其他测试时才失败：
source .venv/bin/activate
python -m pytest tests/ -x --pdb -p no:xdist
# 现在它会在状态累积后的精确失败测试处陷入 pdb。
```

**“我的异步处理程序死锁了。”**
```python
# 在处理程序入口处添加
import remote_pdb; remote_pdb.set_trace(host="127.0.0.1", port=4444)
```
触发处理程序。`nc 127.0.0.1 4444`，然后 `w` 查看挂起的帧，`!import asyncio; asyncio.all_tasks()` 查看还有哪些待处理任务。

**“对 Ink 子进程 / 子进程中崩溃的事后检查。”**
```bash
PYTHONFAULTHANDLER=1 python -m pdb -c continue path/to/entrypoint.py
# 发生崩溃时，pdb 会到达异常帧并包含完整的局部变量
```