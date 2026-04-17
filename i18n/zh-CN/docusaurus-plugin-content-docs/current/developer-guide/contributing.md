---
sidebar_position: 4
title: "贡献指南"
description: "如何为 Hermes Agent 贡献代码 — 开发环境设置、代码风格、PR 流程"
---

# 贡献指南

感谢您为 Hermes Agent 的贡献！本指南涵盖了开发环境的设置、代码库的理解以及如何成功合并您的 PR。

## 贡献优先级

我们按照以下顺序重视贡献：

1. **错误修复** — 崩溃、行为不正确、数据丢失
2. **跨平台兼容性** — macOS、不同的 Linux 发行版、WSL2
3. **安全加固** — Shell 注入、提示词注入、路径遍历
4. **性能和健壮性** — 重试逻辑、错误处理、优雅降级
5. **新技能** — 具有广泛实用性的技能（参见 [创建技能](creating-skills.md)）
6. **新工具** — 很少需要；大多数功能都应该以技能的形式实现
7. **文档** — 修复、澄清、新示例

## 常见的贡献路径

- 构建新工具？请从 [添加工具](./adding-tools.md) 开始
- 构建新技能？请从 [创建技能](./creating-skills.md) 开始
- 构建新的推理提供商？请从 [添加提供商](./adding-providers.md) 开始

## 开发环境设置

### 前置要求

| 要求 | 说明 |
|-------------|-------|
| **Git** | 需支持 `--recurse-submodules` |
| **Python 3.11+** | 如果缺少，uv 将会自动安装 |
| **uv** | 快速 Python 包管理器 ([安装](https://docs.astral.sh/uv/)) |
| **Node.js 18+** | 可选 — 用于浏览器工具和 WhatsApp 桥接 |

### 克隆和安装

```bash
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git
cd hermes-agent

# 使用 Python 3.11 创建虚拟环境
uv venv venv --python 3.11
export VIRTUAL_ENV="$(pwd)/venv"

# 安装所有额外功能（消息、cron、CLI 菜单、开发工具）
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

# 至少添加一个 LLM 提供商密钥：
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

- **PEP 8**，但允许实际例外（不强制严格的行长度限制）
- **注释**: 仅在解释非显而易见的意图、权衡取舍或 API 奇特性时使用
- **错误处理**: 捕获特定的异常。对于意外错误，使用 `logger.warning()`/`logger.error()` 并设置 `exc_info=True`
- **跨平台**: 绝不要假设是 Unix（参见下方）
- **配置文件安全路径**: 绝不要硬编码 `~/.hermes` — 对于代码路径，请使用 `hermes_constants` 中的 `get_hermes_home()`，对于用户可见消息，请使用 `display_hermes_home()`。有关完整规则，请参阅 [AGENTS.md](https://github.com/NousResearch/hermes-agent/blob/main/AGENTS.md#profiles-multi-instance-support)。

## 跨平台兼容性

Hermes 官方支持 Linux、macOS 和 WSL2。**不支持**原生 Windows，但代码库包含一些防御性编码模式，以避免在边缘情况下发生硬崩溃。关键规则如下：

### 1. `termios` 和 `fcntl` 仅限 Unix

始终捕获 `ImportError` 和 `NotImplementedError`：

```python
try:
    from simple_term_menu import TerminalMenu
    menu = TerminalMenu(options)
    idx = menu.show()
except (ImportError, NotImplementedError):
    # 备用方案：数字菜单
    for i, opt in enumerate(options):
        print(f"  {i+1}. {opt}")
    idx = int(input("选择: ")) - 1
```

### 2. 文件编码

某些环境可能会以非 UTF-8 编码保存 `.env` 文件：

```python
try:
    load_dotenv(env_path)
except UnicodeDecodeError:
    load_dotenv(env_path, encoding="latin-1")
```

### 3. 进程管理

`os.setsid()`、`os.killpg()` 和信号处理在不同平台之间存在差异：

```python
import platform
if platform.system() != "Windows":
    kwargs["preexec_fn"] = os.setsid
```

### 4. 路径分隔符

使用 `pathlib.Path` 而不是使用 `/` 进行字符串拼接。

## 安全注意事项

Hermes 具有终端访问权限。安全至关重要。

### 现有保护措施

| 层级 | 实现方式 |
|-------|---------------|
| **Sudo 密码管道** | 使用 `shlex.quote()` 防止 Shell 注入 |
| **危险命令检测** | `tools/approval.py` 中的正则表达式模式和用户批准流程 |
| **Cron 提示词注入** | 扫描器阻止指令覆盖模式 |
| **写入拒绝列表** | 通过 `os.path.realpath()` 解析受保护路径，防止符号链接绕过 |
| **技能卫士** | 用于 Hub 安装技能的安全扫描器 |
| **代码执行沙箱** | 子进程运行，并剥离 API 密钥 |
| **容器加固** | Docker：所有能力都已移除，无权限提升，限制 PID |

### 贡献安全敏感代码

- 始终在将用户输入插值到 Shell 命令时使用 `shlex.quote()`
- 在访问控制检查之前，使用 `os.path.realpath()` 解析符号链接
- 不要记录密钥
- 在工具执行周围捕获广泛的异常
- 如果您的更改涉及文件路径或进程，请在所有平台上进行测试

## Pull Request 流程

### 分支命名

```
fix/描述        # 错误修复
feat/描述       # 新功能
docs/描述       # 文档
test/描述       # 测试
refactor/描述   # 代码重构
```

### 提交前

1. **运行测试**: `pytest tests/ -v`
2. **手动测试**: 运行 `hermes` 并操作您更改的代码路径
3. **检查跨平台影响**: 考虑 macOS 和不同的 Linux 发行版
4. **保持 PR 聚焦**: 每个 PR 只包含一个逻辑变更

### PR 描述

请包含：
- **什么** 改变了以及 **为什么**
- **如何测试** 它
- 您在 **哪些平台** 上进行了测试
- 引用任何相关的 issue

### Commit 消息

我们使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <description>
```

| 类型 | 用途 |
|------|---------|
| `fix` | 错误修复 |
| `feat` | 新功能 |
| `docs` | 文档 |
| `test` | 测试 |
| `refactor` | 代码重构 |
| `chore` | 构建、CI、依赖更新 |

作用域：`cli`, `gateway`, `tools`, `skills`, `agent`, `install`, `whatsapp`, `security`

示例：
```
fix(cli): prevent crash in save_config_value when model is a string
feat(gateway): add WhatsApp multi-user session isolation
fix(security): prevent shell injection in sudo password piping
```

## 报告问题

- 请使用 [GitHub Issues](https://github.com/NousResearch/hermes-agent/issues)
- 请包含：操作系统、Python 版本、Hermes 版本 (`hermes version`)、完整的错误堆栈跟踪
- 包含重现步骤
- 在创建重复问题之前，请检查现有问题
- 对于安全漏洞，请私下报告

## 社区

- **Discord**: [discord.gg/NousResearch](https://discord.gg/NousResearch)
- **GitHub Discussions**: 用于设计提案和架构讨论
- **技能中心**: 上传专业技能并与社区分享

## 许可证

通过贡献，您同意您的贡献将根据 [MIT 许可证](https://github.com/NousResearch/hermes-agent/blob/main/LICENSE) 授权。