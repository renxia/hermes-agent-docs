---
sidebar_position: 4
title: "贡献指南"
description: "如何为 Hermes 智能体贡献 —— 开发环境设置、代码风格、PR 流程"
---

# 贡献指南

感谢您为 Hermes 智能体做出贡献！本指南涵盖设置开发环境、理解代码库以及合并您的 PR。

## 贡献优先级

我们按以下顺序看重贡献：

1. **错误修复** —— 崩溃、行为不正确、数据丢失
2. **跨平台兼容性** —— macOS、不同 Linux 发行版、WSL2
3. **安全加固** —— shell 注入、提示注入、路径遍历
4. **性能和健壮性** —— 重试逻辑、错误处理、优雅降级
5. **新技能** —— 通用性强的（参见[创建技能](creating-skills.md)）
6. **新工具** —— 通常不必要；大多数能力应作为技能实现
7. **文档** —— 修复、说明、新示例

## 常见的贡献路径

- 在不修改 Hermes 核心的情况下构建自定义/本地工具？从[构建 Hermes 插件](../guides/build-a-hermes-plugin.md)开始
- 为 Hermes 本身构建新的内置核心工具？从[添加工具](./adding-tools.md)开始
- 构建新技能？从[创建技能](./creating-skills.md)开始
- 构建新的推理提供商？从[添加提供商](./adding-providers.md)开始

## 开发环境设置

### 前提条件

| 要求 | 备注 |
|-------------|-------|
| **Git** | 支持 `--recurse-submodules`，并已安装 `git-lfs` 扩展 |
| **Python 3.11+** | uv 会在缺失时自动安装 |
| **uv** | 快速的 Python 包管理器（[安装](https://docs.astral.sh/uv/)） |
| **Node.js 20+** | 可选 —— 浏览器工具和 WhatsApp 桥接所需（与根目录 `package.json` 的 engines 保持一致） |

### 克隆与安装

```bash
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git
cd hermes-agent

# 使用 Python 3.11 创建虚拟环境
uv venv venv --python 3.11
export VIRTUAL_ENV="$(pwd)/venv"

# 安装所有附加组件（消息传递、定时任务、CLI 菜单、开发工具）
uv pip install -e ".[all,dev]"
# tinker-atropos 是一个 git 子模块 —— 需要先运行 `git submodule update --init`
# 如果您在克隆时没有使用 `--recurse-submodules`
uv pip install -e "./tinker-atropos"

# 可选：浏览器工具
npm install
```

### 配置开发环境

```bash
mkdir -p ~/.hermes/{cron,sessions,logs,memories,skills}
cp cli-config.yaml.example ~/.hermes/config.yaml
touch ~/.hermes/.env

# 至少添加一个 LLM 提供商密钥：
echo 'OPENROUTER_API_KEY=sk-or-v1-your-key' >> ~/.hermes/.env
```

### 运行

```bash
# 创建符号链接以便全局访问
mkdir -p ~/.local/bin
ln -sf "$(pwd)/venv/bin/hermes" ~/.local/bin/hermes

# 验证
hermes doctor
hermes chat -q "Hello"
```

### 运行测试

```bash
pytest tests/ -v
```

## 代码风格

- **PEP 8** 兼有实际例外（不强制要求严格行长）
- **注释**：仅用于解释不明显的意图、权衡或 API 特性
- **错误处理**：捕获特定异常。对于意外错误，使用 `logger.warning()`/`logger.error()` 并附带 `exc_info=True`
- **跨平台**：切勿假设 Unix 系统（见下文）
- **配置文件安全路径**：切勿硬编码 `~/.hermes` —— 在代码路径中使用 `hermes_constants` 中的 `get_hermes_home()`，在用户面向的消息中使用 `display_hermes_home()`。完整规则参见 [AGENTS.md](https://github.com/NousResearch/hermes-agent/blob/main/AGENTS.md#profiles-multi-instance-support)。

## 跨平台兼容性

Hermes 官方支持 **Linux、macOS、WSL2 和原生 Windows（早期测试版 —— 通过 PowerShell 安装）**。 原生 Windows 使用 Git Bash（来自 [Git for Windows](https://git-scm.com/download/win)）执行 shell 命令。 少数功能需要 POSIX 内核原语并被限制：仪表盘的嵌入式 PTY 终端面板（`/chat` 标签页）仅限 WSL2。原生 Windows 路径是新加入的，发展迅速 —— 如果您从事 Windows 重度开发，预期会遇到并修复一些粗糙之处。

贡献代码时，请记住以下规则：

- **不要添加无保护的 `signal.SIGKILL` 引用。** 它在 Windows 上未定义。 要么通过 `gateway.status.terminate_pid(pid, force=True)` 路由（在 Windows 上执行 `taskkill /T /F`、在 POSIX 上执行 SIGKILL 的集中式原语），要么回退到 `getattr(signal, "SIGKILL", signal.SIGTERM)`。
- **在 `os.kill(pid, 0)` 探测时，除了 `ProcessLookupError` 外，也要捕获 `OSError`。** 对于已经消失的 PID，Windows 会抛出 `OSError`（WinError 87，“参数不正确”）而不是 `ProcessLookupError`。
- **不要强制终端使用 POSIX 语义。** `os.setsid`、`os.killpg`、`os.getpgid`、`os.fork` 在 Windows 上都会报错 —— 用 `if sys.platform != "win32":` 或 `if os.name != "nt":` 来限制它们。
- **以显式的 `encoding="utf-8"` 打开文件。** Windows 上的 Python 默认编码是系统区域设置（通常是 cp1252），这在处理非拉丁文本时会导致乱码或崩溃。
- **使用 `pathlib.Path` / `os.path.join` —— 切勿手动使用 `/` 拼接。** 这对于操作系统返回的字符串影响较小，但对于我们构建并传递给子进程的字符串则很重要。

关键模式：

### 1. `termios` 和 `fcntl` 是 Unix 专用

始终捕获 `ImportError` 和 `NotImplementedError`：

```python
try:
    from simple_term_menu import TerminalMenu
    menu = TerminalMenu(options)
    idx = menu.show()
except (ImportError, NotImplementedError):
    # 回退：编号菜单
    for i, opt in enumerate(options):
        print(f"  {i+1}. {opt}")
    idx = int(input("选择：")) - 1
```

### 2. 文件编码

某些环境可能以非 UTF-8 编码保存 `.env` 文件：

```python
try:
    load_dotenv(env_path)
except UnicodeDecodeError:
    load_dotenv(env_path, encoding="latin-1")
```

### 3. 进程管理

`os.setsid()`、`os.killpg()` 和信号处理在不同平台上有所不同：

```python
import platform
if platform.system() != "Windows":
    kwargs["preexec_fn"] = os.setsid
```

### 4. 路径分隔符

使用 `pathlib.Path` 而不是用 `/` 手动拼接字符串。

## 安全考虑

Hermes 具有终端访问权限。安全至关重要。

### 现有保护措施

| 层级 | 实现方式 |
|-------|---------------|
| **Sudo 密码管道** | 使用 `shlex.quote()` 防止 shell 注入 |
| **危险命令检测** | `tools/approval.py` 中的正则表达式模式及用户批准流程 |
| **定时任务提示注入** | 扫描器阻止指令覆盖模式 |
| **写入拒绝列表** | 受保护路径通过 `os.path.realpath()` 解析以防止符号链接绕过 |
| **技能防护** | 针对从 Hub 安装的技能的安全扫描器 |
| **代码执行沙盒** | 子进程运行时剥离 API 密钥 |
| **容器加固** | Docker：禁用所有能力，禁止特权提升，PID 限制 |

### 贡献安全敏感代码

- 在将用户输入插入 shell 命令时，始终使用 `shlex.quote()`
- 在访问控制检查前，使用 `os.path.realpath()` 解析符号链接
- 不要记录密钥
- 在工具执行周围捕获广泛的异常
- 如果您的更改涉及文件路径或进程，请在所有平台上测试

## 拉取请求流程

### 分支命名

```
fix/描述        # 错误修复
feat/描述       # 新功能
docs/描述       # 文档
test/描述       # 测试
refactor/描述   # 代码重构
```

### 提交前

1. **运行测试**：`pytest tests/ -v`
2. **手动测试**：运行 `hermes` 并执行您更改的代码路径
3. **检查跨平台影响**：考虑 macOS 和不同 Linux 发行版
4. **保持 PR 聚焦**：一个逻辑更改对应一个 PR

### PR 描述

包含：
- **更改了什么**以及**为什么**
- **如何测试**它
- **测试了哪些平台**
- 引用任何相关问题

### 提交信息

我们使用[约定式提交](https://www.conventionalcommits.org/)：

```
<类型>(<范围>): <描述>
```

| 类型 | 用于 |
|------|---------|
| `fix` | 错误修复 |
| `feat` | 新功能 |
| `docs` | 文档 |
| `test` | 测试 |
| `refactor` | 代码重构 |
| `chore` | 构建、CI、依赖项更新 |

范围：`cli`, `gateway`, `tools`, `skills`, `agent`, `install`, `whatsapp`, `security`

示例：
```
fix(cli): 防止当 model 是字符串时 save_config_value 崩溃
feat(gateway): 添加 WhatsApp 多用户会话隔离
fix(security): 防止 sudo 密码管道中的 shell 注入
```

## 报告问题

- 使用 [GitHub Issues](https://github.com/NousResearch/hermes-agent/issues)
- 包含：操作系统、Python 版本、Hermes 版本（`hermes version`）、完整错误回溯
- 包含重现步骤
- 创建重复问题前先检查现有问题
- 对于安全漏洞，请私下报告

## 社区

- **Discord**: [discord.gg/NousResearch](https://discord.gg/NousResearch)
- **GitHub 讨论区**：用于设计提案和架构讨论
- **技能中心**：上传专业技能并与社区分享

## 许可

通过贡献，您同意您的贡献将根据 [MIT 许可证](https://github.com/NousResearch/hermes-agent/blob/main/LICENSE) 进行许可。