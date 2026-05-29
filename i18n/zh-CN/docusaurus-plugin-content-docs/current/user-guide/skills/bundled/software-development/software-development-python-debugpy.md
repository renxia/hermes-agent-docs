---
title: "Python Debugpy — 调试 Python：pdb REPL + debugpy 远程 (DAP)"
sidebar_label: "Python Debugpy"
description: "调试 Python：pdb REPL + debugpy 远程 (DAP)"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非本页。*/}

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
| 标签 | `调试`, `python`, `pdb`, `debugpy`, `断点`, `dap`, `事后剖析` |
| 相关技能 | [`systematic-debugging`](/docs/user-guide/skills/bundled/software-development/software-development-systematic-debugging), [`node-inspect-debugger`](/docs/user-guide/skills/bundled/software-development/software-development-node-inspect-debugger), [`debugging-hermes-tui-commands`](/docs/user-guide/skills/bundled/software-development/software-development-debugging-hermes-tui-commands) |

:::info
以下是该技能被触发时，Hermes 加载的完整技能定义。这是技能激活时，智能体看到的指令。
:::

# Python 调试器 (pdb + debugpy)

## 概述

三种工具，根据情况选择：

| 工具 | 何时使用 |
|---|---|
| **`breakpoint()` + pdb** | 本地、交互式、最简单。在源码中添加 `breakpoint()`，正常运行，在该行获得一个交互式解释器（REPL）。 |
| **`python -m pdb`** | 无需修改源码，用 pdb 启动现有脚本。适用于快速探查。 |
| **`debugpy`** | 远程 / 无界面 / “附加到已运行的进程”。使用 DAP 协议，可从终端脚本化，适用于长寿命进程（网关、守护进程、PTY 子进程）。 |

**从 `breakpoint()` 开始。** 它是最简单有效的办法。

## 何时使用

- 测试失败，且错误回溯没有揭示值错误的原因
- 你需要单步执行一个函数并观察集合的变化
- 一个长运行进程（hermes 网关、tui_gateway）行为异常且你无法重启它
- 事后分析：生产环境的代码抛出了异常，你想在崩溃现场检查局部变量
- 子进程 / 子任务（Python `_SlashWorker`，PTY 桥接工作者）是实际的错误所在

**不要用于：** `print()` / `logging.debug` 能在一分钟内解决的事情，或 `pytest -vv --tb=long --showlocals` 已经能揭示的事情。

## pdb 快速参考

在任何 pdb 提示符 (`(Pdb)`) 下：

| 命令 | 动作 |
|---|---|
| `h` / `h cmd` | 帮助 |
| `n` | 下一行（步过） |
| `s` | 步入 |
| `r` | 从当前函数返回 |
| `c` | 继续 |
| `unt N` | 继续直到第 N 行 |
| `j N` | 跳转到第 N 行（仅限同一函数内） |
| `l` / `ll` | 列出当前行附近 / 整个函数的源码 |
| `w` | where（栈跟踪） |
| `u` / `d` | 在栈中上移 / 下移 |
| `a` | 打印当前函数的参数 |
| `p expr` / `pp expr` | 打印 / 格式化打印表达式 |
| `display expr` | 在每次停止时自动打印 expr |
| `b file:line` | 设置断点 |
| `b func` | 在函数入口处中断 |
| `b file:line, cond` | 条件断点 |
| `cl N` | 清除断点 N |
| `tbreak file:line` | 一次性断点 |
| `!stmt` | 执行任意 Python 语句（包括赋值） |
| `interact` | 在当前作用域进入完整的 Python REPL（按 Ctrl+D 退出） |
| `q` | 退出 |

`interact` 命令是最强大的——你可以导入任何东西，检查复杂对象，甚至调用会改变状态的方法。默认情况下，局部变量是只读的；要修改，请在 `(Pdb)` 提示符下使用 `!x = 42`。

## 方案 1：本地断点

最简单。编辑文件：

```python
def compute(x, y):
    result = some_helper(x)
    breakpoint()           # <-- 在此处进入 pdb
    return result + y
```

正常运行代码。你会在 `breakpoint()` 所在行停留，并完全访问局部变量。

**提交前别忘了删除 `breakpoint()`。** 使用 `git diff` 或预提交检查脚本：
```bash
rg -n 'breakpoint\(\)' --type py
```

## 方案 2：在 pdb 下启动脚本（无需修改源码）

```bash
python -m pdb path/to/script.py arg1 arg2
# 停在脚本的第一行
(Pdb) b path/to/script.py:42
(Pdb) c
```

## 方案 3：调试 pytest 测试

hermes 测试运行器和 pytest 都支持此方式：

```bash
# 失败时（或任何抛出的异常时）进入 pdb：
scripts/run_tests.sh tests/path/to/test_file.py::test_name --pdb

# 在测试开始时进入 pdb：
scripts/run_tests.sh tests/path/to/test_file.py::test_name --trace

# 在回溯中显示局部变量，但不进入 pdb：
scripts/run_tests.sh tests/path/to/test_file.py --showlocals --tb=long
```

注意：`scripts/run_tests.sh` 默认使用 xdist (`-n 4`)，而 pdb 在 xdist 下**无法工作**。请添加 `-p no:xdist` 或使用 `-n 0` 运行单个测试：

```bash
scripts/run_tests.sh tests/foo_test.py::test_bar --pdb -p no:xdist
# 或
source .venv/bin/activate
python -m pytest tests/foo_test.py::test_bar --pdb
```

这绕过了 hermetic 环境的保证——调试时没问题，但推送前请在包装器下重新运行以确认。

## 方案 4：对任何异常进行事后分析

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
# 当它崩溃时，pdb 会捕获它，你就处于异常发生的帧中
```

或在 REPL/Jupyter 中设置全局钩子：

```python
import sys
def excepthook(etype, value, tb):
    import pdb; pdb.post_mortem(tb)
sys.excepthook = excepthook
```

## 方案 5：使用 debugpy 进行远程调试（附加到运行中的进程）

适用于长寿命进程：Hermes 网关、tui_gateway、守护进程、一个行为异常且无法干净重启的进程。

### 设置

```bash
source /home/bb/hermes-agent/.venv/bin/activate
pip install debugpy
```

### 模式 A：修改源码——进程在启动时等待调试器

在入口点顶部附近（或你想调试的函数内部）添加：

```python
import debugpy
debugpy.listen(("127.0.0.1", 5678))
print("debugpy listening on 5678, waiting for client...", flush=True)
debugpy.wait_for_client()
debugpy.breakpoint()       # 可选：一旦附加，立即暂停
```

启动进程；它会在 `wait_for_client()` 处阻塞。

### 模式 B：无需修改源码——使用 `-m debugpy` 启动

```bash
python -m debugpy --listen 127.0.0.1:5678 --wait-for-client your_script.py arg1
```

模块入口的等效命令：

```bash
python -m debugpy --listen 127.0.0.1:5678 --wait-for-client -m your.module
```

### 模式 C：附加到已运行的进程

需要 PID 且目标环境中预装了 debugpy：

```bash
python -m debugpy --listen 127.0.0.1:5678 --pid <pid>
# debugpy 会将自身注入该进程。然后像下面这样附加客户端。
```

某些内核/安全配置会阻止基于 ptrace 的注入（`/proc/sys/kernel/yama/ptrace_scope`）。可通过以下方式修复：
```bash
echo 0 | sudo tee /proc/sys/kernel/yama/ptrace_scope
```

### 从终端连接客户端

最简单的终端端 DAP 客户端是 VS Code CLI 或一个小脚本。在 Hermes 内部，你有两个实用选项：

**选项 1：`debugpy` 自带的 CLI REPL** —— 不是官方功能，但可以通过一个小的 DAP 客户端脚本实现：

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

这对于一次性自动化是可以的，但作为交互式用户体验就比较痛苦。

**选项 2：从 VS Code / Cursor / Zed 附加** —— 如果用户打开了其中一个，他们可以添加一个 `launch.json`：

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

**选项 3：放弃 DAP，使用 `remote-pdb`** —— 通常这才是你从终端智能体真正想要的：

```bash
pip install remote-pdb
```

在你的代码中：
```python
from remote_pdb import set_trace
set_trace(host="127.0.0.1", port=4444)   # 阻塞直到连接
```

然后在终端中：
```bash
nc 127.0.0.1 4444
# 你会得到一个 `(Pdb)` 提示符，就像在本地调试一样。
```

当 `debugpy` 的 DAP 协议过于复杂时，`remote-pdb` 是最简洁、对智能体友好的选择。仅当你确实需要 IDE 集成时才使用 `debugpy`。

## 调试 Hermes 特定进程

### 测试
参见方案 3。始终添加 `-p no:xdist` 或在没有 xdist 的情况下运行单个测试。

### `run_agent.py` / CLI —— 一次性
最简单：在可疑行附近添加 `breakpoint()`，然后正常运行 `hermes`。控制权会在暂停点返回到你的终端。

### `tui_gateway` 子进程（由 `hermes --tui` 生成）
网关作为 Node TUI 的子进程运行。选项：

**A. 修改网关源码：**
```python
# tui_gateway/server.py，在 serve() 函数顶部附近
import debugpy
debugpy.listen(("127.0.0.1", 5678))
debugpy.wait_for_client()
```
启动 `hermes --tui`。TUI 会看起来卡住（它的后端正在等待）。附加一个客户端；当你执行 `continue` 时，执行将继续。

**B. 在特定处理器中使用 `remote-pdb`：**
```python
from remote_pdb import set_trace
set_trace(host="127.0.0.1", port=4444)   # 放在你想捕获的 RPC 处理器中
```
从 TUI 触发对应的斜杠命令，然后在另一个终端中执行 `nc 127.0.0.1 4444`。

### `_SlashWorker` 子进程
同样的模式——在 worker 的 `exec` 路径内部使用 `remote-pdb` 和 `set_trace()`。worker 在斜杠命令之间是持久的，所以第一次触发会阻塞直到你连接；后续的斜杠命令会正常通过，除非你重新设置。

### 网关 (`gateway/run.py`)
长寿命。在处理器中使用 `remote-pdb`，或者如果你要重启网关，则使用 `debugpy` 并加上 `--wait-for-client`。

## 常见陷阱

1.  **`pdb` 在 `pytest-xdist` 下会静默失效。** 你看不到提示符，测试只会挂起。务必使用 `-p no:xdist` 或 `-n 0`。

2.  **在 CI / 非 TTY 环境中，`breakpoint()` 会导致进程挂起。** 本地使用是安全的；但切勿提交代码。添加一个预提交检查（如 grep）作为安全网。

3.  **`PYTHONBREAKPOINT=0` 会禁用所有 `breakpoint()` 调用。** 如果你的断点没有触发，请检查环境变量：
    ```bash
    echo $PYTHONBREAKPOINT
    ```

4.  **`debugpy.listen` 只在同时调用 `wait_for_client()` 时才会阻塞。** 不调用它，程序会继续执行，你的第一个断点可能在客户端连接之前就已触发。

5.  **在强化内核上通过 PID 连接会失败。** `ptrace_scope=1`（Ubuntu 默认）只允许同一用户对子进程进行 ptrace。解决方法：`echo 0 > /proc/sys/kernel/yama/ptrace_scope`（需要 root），或者从一开始就通过 `debugpy` 启动。

6.  **多线程。** `pdb` 只调试当前线程。对于多线程代码，请使用 `debugpy`（支持线程的 DAP）或为每个线程设置 `threading.settrace()`。

7.  **`asyncio`。** `pdb` 可以在协程中工作，但在 pdb 内部使用 `await` 需要 Python 3.13+，或者在旧版本中从 `interact` 模式使用 `await`。对于 3.11/3.12，可以使用 `asyncio.run_coroutine_threadsafe` 技巧，或通过 `asyncio.ensure_future` 使用基于 `!stmt` 的等待。

8.  **`scripts/run_tests.sh` 会剥离凭据并设置 `HOME=<tmpdir>`。** 如果你的 bug 依赖于用户配置或真实的 API 密钥，在该包装器下将无法重现。请先使用原始 `pytest` 进行调试以重现问题，然后在包装器下重新确认。

9.  **Forking / 多进程。** `pdb` 不会跟踪 fork。每个子进程都需要自己的 `breakpoint()` 或 `set_trace()`。对于 Hermes 子智能体，每次只调试一个进程。

## 验证检查清单

- [ ] 安装 `debugpy` 后，确认：`python -c "import debugpy; print(debugpy.__version__)"`
- [ ] 远程调试时，确认端口确实在监听：`ss -tlnp | grep 5678`
- [ ] 第一个断点确实触发（如果没有，你可能设置了 `PYTHONBREAKPOINT=0`，或在 xdist 下运行，或程序在连接前已执行完毕）
- [ ] `where` / `w` 显示的是预期的调用栈
- [ ] 调试后清理：提交的代码中不应有遗留的 `breakpoint()` / `set_trace()`
    ```bash
    rg -n 'breakpoint\(\)|set_trace\(|debugpy\.listen' --type py
    ```

## 一次性速查方案

**“为什么这个字典缺少一个键？”**
```python
# 在抛出 KeyError 的代码上方添加
breakpoint()
# 然后在 pdb 中:
(Pdb) pp d
(Pdb) pp list(d.keys())
(Pdb) w                # 查看如何到达此处
```

**“这个测试单独运行通过，但在整个套件中失败。”**
```bash
scripts/run_tests.sh tests/the_test.py --pdb -p no:xdist
# 但如果它只在有其他测试时才失败：
source .venv/bin/activate
python -m pytest tests/ -x --pdb -p no:xdist
# 现在它会在状态累积后，在确切的失败测试处触发 pdb。
```

**“我的异步处理器死锁了。”**
```python
# 在处理器入口添加
import remote_pdb; remote_pdb.set_trace(host="127.0.0.1", port=4444)
```
触发处理器。然后 `nc 127.0.0.1 4444`，接着 `w` 查看挂起的帧，`!import asyncio; asyncio.all_tasks()` 查看其他待处理任务。

**“对 Ink 子进程 / 子进程的崩溃进行事后分析。”**
```bash
PYTHONFAULTHANDLER=1 python -m pdb -c continue path/to/entrypoint.py
# 发生崩溃时，pdb 会停在抛出异常的帧，并带有完整的局部变量。
```