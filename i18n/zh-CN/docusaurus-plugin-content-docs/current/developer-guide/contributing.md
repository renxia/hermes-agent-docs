---
sidebar_position: 4
title: "Contributing"
description: "How to contribute to Hermes Agent — dev setup, code style, PR process"
---

# Contributing

感谢你为 Hermes Agent 做出贡献！本指南涵盖开发环境搭建、代码库理解以及 PR 合并流程。

## 贡献优先级

我们按以下顺序评估贡献：

1. **Bug 修复** — 崩溃、错误行为、数据丢失
2. **跨平台兼容性** — macOS、不同 Linux 发行版、WSL2
3. **安全加固** — shell 注入、提示注入、路径遍历
4. **性能与健壮性** — 重试逻辑、错误处理、优雅降级
5. **新技能** — 广泛有用的技能（参见[创建技能](creating-skills.md)）
6. **新工具** — 很少需要；大多数功能应以技能形式实现
7. **文档** — 修正、说明、新示例

## 常见贡献路径

- 构建不修改 Hermes 核心的自定义/本地工具？请从[构建 Hermes 插件](../guides/build-a-hermes-plugin.md)开始
- 为 Hermes 本身构建新的内置核心工具？请从[添加工具](./adding-tools.md)开始
- 构建新技能？请从[创建技能](./creating-skills.md)开始
- 构建新的推理提供者？请从[添加提供者](./adding-providers.md)开始

## 开发环境搭建

### 前置条件

| 需求 | 说明 |
|------|------|
| **Git** | 需安装 `git-lfs` 扩展 |
| **Python 3.11+** | 如果缺失，uv 会自动安装 |
| **uv** | 快速的 Python 包管理器（[安装](https://docs.astral.sh/uv/)） |
| **Node.js 20+** | 可选 — 浏览器工具和 WhatsApp 桥接需要（与根目录 `package.json` 的 engines 匹配） |

### 使用标准安装程序安装

对于大多数贡献者，最佳的开发引导方式与用户使用路径相同：运行标准安装程序，然后在它克隆的仓库内工作。安装程序会创建 Hermes 虚拟环境、配置 `hermes` 命令、标记安装方法以供 `hermes update` 使用，并将完整的 git 项目克隆到 `$HERMES_HOME/hermes-agent`（通常为 `~/.hermes/hermes-agent`）。这样可使你的开发环境与 CLI、更新器、懒依赖安装器、网关和文档所假设的布局保持一致。

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
cd "${HERMES_HOME:-$HOME/.hermes}/hermes-agent"

# 在标准安装基础上添加 dev/test 额外依赖
uv pip install -e ".[all,dev]"

# 可选：浏览器工具 / 文档站点依赖
npm install
```

之后，从该检出目录创建分支并运行测试：

```bash
git checkout -b fix/description
scripts/run_tests.sh
```

### 手动克隆备用方案

仅当你有意不使用 Hermes 的管理安装布局时才使用此方式（例如容器内或 CI 任务中的临时克隆）。如果以此方式安装，请确保从该虚拟环境运行 `hermes` 入口点；运行系统的 `python3 -m hermes_cli.main` 可能会引入无关的系统 Python 包。

```bash
git clone https://github.com/NousResearch/hermes-agent.git
cd hermes-agent

# 使用 Python 3.11 创建虚拟环境
uv venv venv --python 3.11
export VIRTUAL_ENV="$(pwd)/venv"

# 安装所有额外依赖（消息、cron、CLI 菜单、开发工具）
uv pip install -e ".[all,dev]"

# 可选：浏览器工具
npm install
```

### 开发配置

```bash
mkdir -p ~/.hermes/{cron,sessions,logs,memories,skills}
cp cli-config.yaml.example ~/.hermes/config.yaml
touch ~/.hermes/.env

# 至少添加一个 LLM 提供者密钥：
echo 'OPENROUTER_API_KEY=sk-or-v1-your-key' >> ~/.hermes/.env
```

### 运行

```bash
# 标准安装程序已将 `hermes` 加入 PATH
hermes doctor
hermes chat -q "Hello"
```

如果你使用了手动克隆备用方案，请从检出目录运行 `./hermes`，或显式链接该克隆的虚拟环境：

```bash
mkdir -p ~/.local/bin
ln -sf "$(pwd)/venv/bin/hermes" ~/.local/bin/hermes
```

### 运行测试

```bash
scripts/run_tests.sh
```

## 代码风格

- **PEP 8**，带有实际例外（不严格强制行长度）
- **注释**：仅在解释非显而易见的意图、权衡或 API 特性时添加
- **错误处理**：捕获特定异常。对意外错误使用 `logger.warning()`/`logger.error()` 并配合 `exc_info=True`
- **跨平台**：永远不要假设是 Unix（见下文）
- **配置档案安全路径**：永远不要硬编码 `~/.hermes` — 代码路径使用 `hermes_constants` 中的 `get_hermes_home()`，面向用户的消息使用 `display_hermes_home()`。完整规则请参见 [AGENTS.md](https://github.com/NousResearch/hermes-agent/blob/main/AGENTS.md#profiles-multi-instance-support)。

## 跨平台兼容性

Hermes 官方支持 **Linux、macOS、WSL2 和原生 Windows（通过 PowerShell 安装）**。原生 Windows 使用 Git Bash（来自 [Git for Windows](https://git-scm.com/download/win)）执行 shell 命令。部分功能需要 POSIX 内核原语，因此被限制：仪表板的嵌入式 PTY 终端面板（`/chat` 标签页）仅支持 WSL2。如果你进行大量 Windows 开发，请在推送前运行 Windows 陷阱检查脚本（`scripts/check-windows-footguns.py`）。

贡献代码时，请遵守以下规则：

- **不要添加未受保护的 `signal.SIGKILL` 引用。** Windows 上未定义该信号。应通过 `gateway.status.terminate_pid(pid, force=True)` 进行路由（该原语在 Windows 上执行 `taskkill /T /F`，在 POSIX 上执行 SIGKILL），或使用 `getattr(signal, "SIGKILL", signal.SIGTERM)` 作为回退。
- **在 `os.kill(pid, 0)` 探测时，除 `ProcessLookupError` 外还需捕获 `OSError`。** Windows 对已不存在的 PID 会引发 `OSError`（WinError 87，"参数错误"），而非 `ProcessLookupError`。
- **不要强制终端使用 POSIX 语义。** `os.setsid`、`os.killpg`、`os.getpgid`、`os.fork` 在 Windows 上均会引发异常 — 使用 `if sys.platform != "win32":` 或 `if os.name != "nt":` 进行限制。
- **使用显式的 `encoding="utf-8"` 打开文件。** Windows 上 Python 的默认编码是系统区域设置（通常是 cp1252），在处理非拉丁文本时会出现乱码或崩溃。
- **使用 `pathlib.Path` / `os.path.join` — 永远不要手动用 `/` 拼接。** 这对操作系统返回的字符串影响较小，对我们构建后传递给子进程的字符串影响较大。

关键模式：

### 1. `termios` 和 `fcntl` 仅适用于 Unix

始终同时捕获 `ImportError` 和 `NotImplementedError`：

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

`os.setsid()`、`os.killpg()` 和信号处理在不同平台上存在差异：

```python
import platform
if platform.system() != "Windows":
    kwargs["preexec_fn"] = os.setsid
```

### 4. 路径分隔符

使用 `pathlib.Path` 而非用 `/` 进行字符串拼接。

## 安全注意事项

Hermes 具有终端访问权限。安全至关重要。

### 现有防护

| 层 | 实现方式 |
|----|---------|
| **Sudo 密码管道** | 使用 `shlex.quote()` 防止 shell 注入 |
| **危险命令检测** | `tools/approval.py` 中的正则表达式模式，配合用户审批流程 |
| **Cron 提示注入** | 扫描器阻止指令覆盖模式 |
| **写入拒绝列表** | 通过 `os.path.realpath()` 解析受保护路径，防止符号链接绕过 |
| **技能防护** | 针对 Hub 安装技能的安全扫描器 |
| **代码执行沙箱** | 子进程运行时不携带 API 密钥 |
| **容器加固** | Docker：丢弃所有能力，禁止权限提升，PID 限制 |

### 贡献安全敏感代码

- 将用户输入插入 shell 命令时，始终使用 `shlex.quote()`
- 访问控制检查前，使用 `os.path.realpath()` 解析符号链接
- 不要记录密钥
- 在工具执行周围捕获广泛的异常
- 如果改动涉及文件路径或进程，请在所有平台上测试

## Pull Request 流程

### 分支命名

```
fix/description        # Bug 修复
feat/description       # 新功能
docs/description       # 文档
test/description       # 测试
refactor/description   # 代码重构
```

### 提交前

1. **运行测试**：使用 `scripts/run_tests.sh` 以获得 CI 一致性。仅当包装器不可用或你有意在包装器外调试时，才直接使用 `python -m pytest ...`。
2. **手动测试**：运行 `hermes` 并测试你所修改的代码路径
3. **检查跨平台影响**：考虑 macOS、Linux、WSL2 和原生 Windows。如果你涉及文件 I/O、进程管理、终端处理、子进程或信号，请运行 `scripts/check-windows-footguns.py`。
4. **保持 PR 聚焦**：每个 PR 只做一处逻辑变更

### PR 描述

包含：
- **什么**改了以及**为什么**改
- **如何测试**
- 你在**哪些平台**上测试了
- 引用任何相关 Issue

### 提交信息

我们使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <description>
```

| 类型 | 用于 |
|------|------|
| `fix` | Bug 修复 |
| `feat` | 新功能 |
| `docs` | 文档 |
| `test` | 测试 |
| `refactor` | 代码重构 |
| `chore` | 构建、CI、依赖更新 |

作用域：`cli`、`gateway`、`tools`、`skills`、`agent`、`install`、`whatsapp`、`security`

示例：
```
fix(cli): 当 model 为字符串时防止 save_config_value 崩溃
feat(gateway): 添加 WhatsApp 多用户会话隔离
fix(security): 防止 sudo 密码管道中的 shell 注入
```

## 报告 Issue

- 使用 [GitHub Issues](https://github.com/NousResearch/hermes-agent/issues)
- 包含：操作系统、Python 版本、Hermes 版本（`hermes version`）、完整错误堆栈跟踪
- 包含复现步骤
- 创建重复问题前检查已有 Issue
- 安全漏洞请私下报告

## 社区

- **Discord**：[discord.gg/NousResearch](https://discord.gg/NousResearch)
- **GitHub Discussions**：用于设计提案和架构讨论
- **技能中心**：上传专业技能并与社区分享

## 许可证

通过贡献，你同意你的贡献将按照 [MIT 许可证](https://github.com/NousResearch/hermes-agent/blob/main/LICENSE) 进行授权。