---
sidebar_position: 4
title: "贡献指南"
description: "如何为 Hermes 智能体贡献 —— 开发设置、代码风格、PR流程"
---

# 贡献指南

感谢您为 Hermes 智能体做出贡献！本指南涵盖了开发环境的设置、理解代码库以及如何让您的PR被合并。

## 贡献优先级

我们按以下优先级评估贡献：

1.  **错误修复** —— 崩溃、不正确的行为、数据丢失
2.  **跨平台兼容性** —— macOS、不同的Linux发行版、WSL2
3.  **安全加固** —— Shell注入、提示注入、路径遍历
4.  **性能与健壮性** —— 重试逻辑、错误处理、优雅降级
5.  **新技能** —— 具有广泛实用性的（参见[创建技能](creating-skills.md)）
6.  **新工具** —— 很少需要；大多数功能应作为技能实现
7.  **文档** —— 修正、澄清、新示例

## 常见贡献路径

-   构建自定义/本地工具而不修改 Hermes 核心？请从[构建 Hermes 插件](../guides/build-a-hermes-plugin.md)开始。
-   为 Hermes 本身构建新的内置核心工具？请从[添加工具](./adding-tools.md)开始。
-   构建新技能？请从[创建技能](./creating-skills.md)开始。
-   构建新的推理提供者？请从[添加提供者](./adding-providers.md)开始。

## 开发设置

### 前提条件

| 要求 | 备注 |
|------|------|
| **Git** | 支持 `--recurse-submodules`，并安装了 `git-lfs` 扩展 |
| **Python 3.11+** | 如果缺失，uv 会安装它 |
| **uv** | 快速的 Python 包管理器（[安装](https://docs.astral.sh/uv/)） |
| **Node.js 20+** | 可选 —— 浏览器工具和 WhatsApp 桥接器需要（与根目录 `package.json` 的 engines 匹配） |

### 克隆与安装

```bash
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git
cd hermes-agent

# 使用 Python 3.11 创建虚拟环境
uv venv venv --python 3.11
export VIRTUAL_ENV="$(pwd)/venv"

# 安装所有附加组件（消息、定时任务、CLI菜单、开发工具）
uv pip install -e ".[all,dev]"

# 可选：浏览器工具
npm install
```

### 为开发配置

```bash
mkdir -p ~/.hermes/{cron,sessions,logs,memories,skills}
cp cli-config.yaml.example ~/.hermes/config.yaml
touch ~/.hermes/.env

# 至少添加一个LLM提供者密钥：
echo 'OPENROUTER_API_KEY=sk-or-v1-your-key' >> ~/.hermes/.env
```

### 运行

```bash
# 创建符号链接以实现全局访问
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

-   **PEP 8**，但允许实际例外（不严格限制行长度）
-   **注释**：仅用于解释非显而易见的意图、权衡或API特性时使用
-   **错误处理**：捕获特定异常。对于意外错误，使用 `logger.warning()`/`logger.error()` 并设置 `exc_info=True`
-   **跨平台**：永远不要假设 Unix 系统（见下文）
-   **配置文件安全路径**：永远不要硬编码 `~/.hermes` —— 对于代码路径，请使用 `hermes_constants` 中的 `get_hermes_home()`；对于面向用户的消息，请使用 `display_hermes_home()`。完整规则请参见 [AGENTS.md](https://github.com/NousResearch/hermes-agent/blob/main/AGENTS.md#profiles-multi-instance-support)。

## 跨平台兼容性

Hermes 官方支持 **Linux、macOS、WSL2 和原生 Windows（早期测试版——通过 PowerShell 安装）**。原生 Windows 使用 Git Bash（来自 [Git for Windows](https://git-scm.com/download/win)）来执行 Shell 命令。少数功能需要 POSIX 内核原语，因此受到限制：仪表板的嵌入式 PTY 终端面板（`/chat` 选项卡）仅限 WSL2 使用。原生 Windows 路径较新且发展迅速 —— 如果您主要进行 Windows 开发，请预期会遇到并修复一些粗糙的边缘情况。

贡献代码时，请牢记以下规则：

-   **不要添加无保护的 `signal.SIGKILL` 引用。** 它在 Windows 上未定义。要么通过 `gateway.status.terminate_pid(pid, force=True)` 进行路由（这是集中式的原语，在 Windows 上执行 `taskkill /T /F`，在 POSIX 上执行 SIGKILL），要么使用 `getattr(signal, "SIGKILL", signal.SIGTERM)` 作为后备方案。
-   **在 `os.kill(pid, 0)` 探测时，除了 `ProcessLookupError` 外，还要捕获 `OSError`。** 对于一个已经消失的 PID，Windows 会抛出 `OSError` (WinError 87, “parameter is incorrect”) 而不是 `ProcessLookupError`。
-   **不要强制终端遵循 POSIX 语义。** `os.setsid`、`os.killpg`、`os.getpgid`、`os.fork` 在 Windows 上都会报错 —— 使用 `if sys.platform != "win32":` 或 `if os.name != "nt":` 进行限制。
-   **打开文件时显式指定 `encoding="utf-8"`。** Windows 上的 Python 默认使用系统区域设置（通常是 cp1252），这会在处理非拉丁文本时产生乱码或崩溃。
-   **使用 `pathlib.Path` / `os.path.join` —— 不要手动使用 `/` 拼接字符串。** 对于操作系统返回的字符串，这点不太重要，但对于我们要传递给子进程的字符串则很重要。

关键模式：

### 1. `termios` 和 `fcntl` 仅限 Unix

始终捕获 `ImportError` 和 `NotImplementedError`：

```python
try:
    from simple_term_menu import TerminalMenu
    menu = TerminalMenu(options)
    idx = menu.show()
except (ImportError, NotImplementedError):
    # 后备方案：编号菜单
    for i, opt in enumerate(options):
        print(f"  {i+1}. {opt}")
    idx = int(input("Choice: ")) - 1
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

| 层面 | 实现 |
|------|------|
| **Sudo 密码传递** | 使用 `shlex.quote()` 防止 Shell 注入 |
| **危险命令检测** | `tools/approval.py` 中的正则表达式模式配合用户批准流程 |
| **定时任务提示注入** | 扫描器阻止指令覆盖模式 |
| **写入拒绝列表** | 通过 `os.path.realpath()` 解析受保护路径以防止符号链接绕过 |
| **技能保护** | 针对从 Hub 安装的技能的安全扫描器 |
| **代码执行沙箱** | 子进程运行时剥离 API 密钥 |
| **容器加固** | Docker：放弃所有权限，禁止提权，PID 限制 |

### 贡献安全敏感代码

-   在将用户输入插入 Shell 命令时，始终使用 `shlex.quote()`
-   在访问控制检查前，使用 `os.path.realpath()` 解析符号链接
-   不要记录密钥
-   在工具执行周围捕获广泛异常
-   如果您的更改涉及文件路径或进程，请在所有平台上测试

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

1.  **运行测试**：`pytest tests/ -v`
2.  **手动测试**：运行 `hermes` 并测试您更改的代码路径
3.  **检查跨平台影响**：考虑 macOS 和不同的 Linux 发行版
4.  **保持 PR 专注**：每个 PR 一个逻辑更改

### PR 描述

包括：
-   **什么**被更改以及**为什么**
-   **如何测试**它
-   您在**哪些平台**上测试过
-   引用任何相关的问题

### 提交信息

我们使用[常规提交](https://www.conventionalcommits.org/)：

```
<类型>(<范围>): <描述>
```

| 类型 | 用于 |
|------|------|
| `fix` | 错误修复 |
| `feat` | 新功能 |
| `docs` | 文档 |
| `test` | 测试 |
| `refactor` | 代码重构 |
| `chore` | 构建、CI、依赖更新 |

范围：`cli`, `gateway`, `tools`, `skills`, `agent`, `install`, `whatsapp`, `security`

示例：
```
fix(cli): 修复当模型为字符串时 save_config_value 的崩溃
feat(gateway): 添加 WhatsApp 多用户会话隔离
fix(security): 防止 sudo 密码传递中的 Shell 注入
```

## 报告问题

-   使用 [GitHub Issues](https://github.com/NousResearch/hermes-agent/issues)
-   包括：操作系统、Python 版本、Hermes 版本（`hermes version`）、完整的错误回溯
-   包括重现步骤
-   创建新问题前检查现有问题
-   对于安全漏洞，请私下报告

## 社区

-   **Discord**: [discord.gg/NousResearch](https://discord.gg/NousResearch)
-   **GitHub 讨论区**: 用于设计提案和架构讨论
-   **技能中心**: 上传专业技能并与社区分享

## 许可证

通过贡献，您同意您的贡献将在 [MIT 许可证](https://github.com/NousResearch/hermes-agent/blob/main/LICENSE)下获得许可。