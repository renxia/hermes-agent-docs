---
sidebar_position: 4
title: "贡献指南"
description: "如何为 Hermes Agent 做出贡献 — 开发环境配置、代码风格、PR 流程"
---

# 贡献指南

感谢您为 Hermes Agent 做出贡献！本指南涵盖开发环境配置、代码库理解以及 PR 合并流程。

## 贡献优先级

我们按以下顺序重视贡献：

1. **Bug 修复** — 崩溃、行为错误、数据丢失
2. **跨平台兼容性** — macOS、不同 Linux 发行版、WSL2
3. **安全加固** — Shell 注入、提示词注入、路径遍历
4. **性能与健壮性** — 重试逻辑、错误处理、优雅降级
5. **新技能** — 广泛有用的技能（参见 [创建技能](creating-skills.md)）
6. **新工具** — 很少需要；大多数功能应通过技能实现
7. **文档** — 修复、澄清、新示例

## 常见贡献路径

- 构建新工具？从 [添加工具](./adding-tools.md) 开始
- 构建新技能？从 [创建技能](./creating-skills.md) 开始
- 构建新推理提供商？从 [添加提供商](./adding-providers.md) 开始

## 开发环境配置

### 先决条件

| 要求 | 说明 |
|-------------|-------|
| **Git** | 支持 `--recurse-submodules`，并安装 `git-lfs` 扩展 |
| **Python 3.11+** | 若缺失，uv 会自动安装 |
| **uv** | 快速的 Python 包管理器（[安装](https://docs.astral.sh/uv/)） |
| **Node.js 20+** | 可选 — 用于浏览器工具和 WhatsApp 桥接（与根目录 `package.json` 中的 engines 字段匹配） |

### 克隆并安装

```bash
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git
cd hermes-agent

# 使用 Python 3.11 创建虚拟环境
uv venv venv --python 3.11
export VIRTUAL_ENV="$(pwd)/venv"

# 安装所有额外依赖（消息传递、定时任务、CLI 菜单、开发工具）
uv pip install -e ".[all,dev]"
uv pip install -e "./tinker-atropos"

# 可选：浏览器工具
npm install
```

### 配置开发环境

```bash
mkdir -p ~/.hermes/{cron,sessions,logs,memories,skills}
cp cli-config.yaml.example ~/.hermes/config.yaml
touch ~/.hermes/.env

# 至少添加一个 LLM 提供商的密钥：
echo 'OPENROUTER_API_KEY=sk-or-v1-your-key' >> ~/.hermes/.env
```

### 运行

```bash
# 创建全局访问符号链接
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

- **PEP 8**，但允许实际例外（不强制严格行长度限制）
- **注释**：仅在解释非显而易见的设计意图、权衡或 API 特性时添加
- **错误处理**：捕获特定异常。对意外错误使用 `logger.warning()`/`logger.error()` 并设置 `exc_info=True`
- **跨平台**：切勿假设 Unix 环境（见下文）
- **配置文件安全路径**：切勿硬编码 `~/.hermes` — 代码路径使用 `hermes_constants` 中的 `get_hermes_home()`，面向用户的消息使用 `display_hermes_home()`。完整规则参见 [AGENTS.md](https://github.com/NousResearch/hermes-agent/blob/main/AGENTS.md#profiles-multi-instance-support)。

## 跨平台兼容性

Hermes 官方支持 Linux、macOS 和 WSL2。**不支持原生 Windows**，但代码库包含一些防御性编程模式，以避免在边缘情况下发生硬崩溃。关键规则如下：

### 1. `termios` 和 `fcntl` 仅限 Unix

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
    idx = int(input("选择: ")) - 1
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

`os.setsid()`、`os.killpg()` 和信号处理在不同平台上有差异：

```python
import platform
if platform.system() != "Windows":
    kwargs["preexec_fn"] = os.setsid
```

### 4. 路径分隔符

使用 `pathlib.Path` 而非字符串拼接 `/`。

## 安全注意事项

Hermes 具有终端访问权限。安全性至关重要。

### 现有防护措施

| 层级 | 实现方式 |
|-------|---------------|
| **Sudo 密码管道** | 使用 `shlex.quote()` 防止 Shell 注入 |
| **危险命令检测** | `tools/approval.py` 中的正则表达式模式，配合用户审批流程 |
| **定时任务提示词注入** | 扫描器阻止指令覆盖模式 |
| **写入拒绝列表** | 通过 `os.path.realpath()` 解析受保护路径，防止符号链接绕过 |
| **技能防护** | 对 Hub 安装的技能进行安全扫描 |
| **代码执行沙箱** | 子进程运行时剥离 API 密钥 |
| **容器加固** | Docker：丢弃所有权限、无权限提升、PID 限制 |

### 贡献安全敏感代码

- 在将用户输入插入 Shell 命令时，始终使用 `shlex.quote()`
- 在访问控制检查前，使用 `os.path.realpath()` 解析符号链接
- 不要记录密钥
- 在工具执行周围捕获宽泛异常
- 如果更改涉及文件路径或进程，请在所有平台上测试

## 拉取请求（PR）流程

### 分支命名

```
fix/description        # Bug 修复
feat/description       # 新功能
docs/description       # 文档
test/description       # 测试
refactor/description   # 代码重构
```

### 提交前检查

1. **运行测试**：`pytest tests/ -v`
2. **手动测试**：运行 `hermes` 并测试您更改的代码路径
3. **检查跨平台影响**：考虑 macOS 和不同 Linux 发行版
4. **保持 PR 专注**：每个 PR 仅包含一个逻辑更改

### PR 描述

请包含：
- **什么**发生了变化以及**为什么**
- **如何测试**
- **在哪些平台**上测试过
- 引用任何相关问题

### 提交信息

我们使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <description>
```

| 类型 | 用途 |
|------|---------|
| `fix` | Bug 修复 |
| `feat` | 新功能 |
| `docs` | 文档 |
| `test` | 测试 |
| `refactor` | 代码重构 |
| `chore` | 构建、CI、依赖更新 |

作用域：`cli`、`gateway`、`tools`、`skills`、`agent`、`install`、`whatsapp`、`security`

示例：
```
fix(cli): 修复 save_config_value 在模型为字符串时崩溃的问题
feat(gateway): 添加 WhatsApp 多用户会话隔离
fix(security): 防止 sudo 密码管道中的 Shell 注入
```

## 报告问题

- 使用 [GitHub Issues](https://github.com/NousResearch/hermes-agent/issues)
- 包含：操作系统、Python 版本、Hermes 版本（`hermes version`）、完整错误堆栈跟踪
- 包含复现步骤
- 创建重复问题前，请检查现有问题
- 对于安全漏洞，请私下报告

## 社区

- **Discord**: [discord.gg/NousResearch](https://discord.gg/NousResearch)
- **GitHub 讨论**: 用于设计提案和架构讨论
- **技能 Hub**: 上传专用技能并与社区分享

## 许可证

通过贡献，您同意您的贡献将根据 [MIT 许可证](https://github.com/NousResearch/hermes-agent/blob/main/LICENSE) 进行许可。