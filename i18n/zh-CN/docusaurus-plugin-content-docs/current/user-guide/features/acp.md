---
sidebar_position: 11
title: "ACP 编辑器集成"
description: "在 VS Code、Zed 和 JetBrains 等 ACP 兼容编辑器中使用 Hermes 智能体"
---

# ACP 编辑器集成

Hermes 智能体可以作为一个 ACP 服务器运行，让兼容 ACP 的编辑器通过 stdio 与 Hermes 通信并渲染：

- 聊天消息
- 工具活动
- 文件差异
- 终端命令
- 审批提示
- 流式思考/响应块

当你希望 Hermes 表现得像一个原生编辑器的编码智能体，而不是一个独立的 CLI 或消息机器人时，ACP 是一个很好的选择。

## Hermes 在 ACP 模式下提供的功能

Hermes 运行时会配备一套为编辑器工作流程精心设计的 `hermes-acp` 工具集。它包括：

- 文件工具：`read_file`、`write_file`、`patch`、`search_files`
- 终端工具：`terminal`、`process`
- 网络/浏览器工具
- 记忆、待办事项、会话搜索
- 技能
- `execute_code` 和 `delegate_task`
- 视觉

它有意排除了不适合典型编辑器用户体验的功能，例如消息传递和定时任务管理。

## 安装

正常安装 Hermes，然后添加 ACP 扩展：

```bash
pip install -e '.[acp]'
```

这将安装 `agent-client-protocol` 依赖项并启用：

- `hermes acp`
- `hermes-acp`
- `python -m acp_adapter`

对于 Zed 的注册表安装，Zed 会通过官方的 ACP Registry 条目启动 Hermes。该条目使用一个 `uvx` 分发包，运行：

```bash
uvx --from 'hermes-agent[acp]==<版本>' hermes-acp
```

在使用注册表安装路径前，请确保 `uv` 已在您的 `PATH` 中可用。

## 启动 ACP 服务器

以下任何命令都可以在 ACP 模式下启动 Hermes：

```bash
hermes acp
```

```bash
hermes-acp
```

```bash
python -m acp_adapter
```

Hermes 的日志输出到 stderr，因此 stdout 保留给 ACP JSON-RPC 通信使用。

进行非交互式检查：

```bash
hermes acp --version
hermes acp --check
```

### 浏览器工具（可选）

浏览器工具（`browser_navigate`、`browser_click` 等）依赖于 `agent-browser` npm 包和 Chromium，这些不包含在 Python wheel 包中。请通过以下命令安装：

```bash
hermes acp --setup-browser           # 交互式（在约 400 MB 下载前提示）
hermes acp --setup-browser --yes     # 非交互式接受下载
```

这是一个独立命令。Zed 注册表的终端认证流程（`hermes acp --setup`）在模型选择后也会提供浏览器引导程序作为后续问题，因此大多数用户不需要直接运行 `--setup-browser`。

它的作用：

- 如果缺失，将 Node.js 22 LTS 安装到 `~/.hermes/node/`
- 将 `agent-browser` 和 `@askjo/camofox-browser` 通过 `npm install -g` 安装到该前缀目录下（无需 sudo —— `npm` 的 `--prefix` 指向用户可写的 Hermes 管理的 Node）
- 安装 Playwright Chromium，或在可用时使用检测到的系统 Chrome/Chromium

该引导程序是幂等的 —— 重新运行速度很快，并且会跳过已完成的工作。

## 编辑器设置

### VS Code

安装 [ACP Client](https://marketplace.visualstudio.com/items?itemName=formulahendry.acp-client) 扩展。

连接步骤：

1. 从活动栏打开 ACP Client 面板。
2. 从内置的智能体列表中选择 **Hermes Agent**。
3. 连接并开始聊天。

如果你想手动定义 Hermes，可以通过 VS Code 设置在 `acp.agents` 下添加：

```json
{
  "acp.agents": {
    "Hermes Agent": {
      "command": "hermes",
      "args": ["acp"]
    }
  }
}
```

### Zed

Zed v0.221.x 及更新版本通过官方的 ACP Registry 安装外部智能体。

1. 打开智能体面板。
2. 点击 **Add Agent**，或运行 `zed: acp registry` 命令。
3. 搜索 **Hermes Agent**。
4. 安装它并开始一个新的 Hermes 外部智能体线程。

前提条件：

- 先使用 `hermes model` 配置 Hermes 提供商凭据，或在 `~/.hermes/.env` / `~/.hermes/config.yaml` 中设置它们。
- 安装 `uv`，以便注册表启动器可以运行 `uvx --from 'hermes-agent[acp]==<版本>' hermes-acp`。

在注册表条目可用之前进行本地开发，可以在 Zed 设置中使用自定义智能体服务器：

```json
{
  "agent_servers": {
    "hermes-agent": {
      "type": "custom",
      "command": "hermes",
      "args": ["acp"]
    }
  }
}
```

### JetBrains

使用一个兼容 ACP 的插件，并将其指向：

```text
/path/to/hermes-agent/acp_registry
```

## 注册表清单

Hermes 官方 ACP Registry 元数据的源副本位于：

```text
acp_registry/agent.json
acp_registry/icon.svg
```

上游注册表 PR 将这些文件复制到 `agentclientprotocol/registry` 中的顶层 `hermes-agent/` 目录。

该注册表条目使用一个 `uvx` 分发包，它直接指向 `hermes-agent` 的 PyPI 发布版本：

```text
uvx --from 'hermes-agent[acp]==<版本>' hermes-acp
```

注册表 CI 会验证 PyPI 上存在指定的版本，因此清单的 `version` 和 uvx 的 `package` 版本必须始终与 `pyproject.toml` 保持一致。`scripts/release.py` 会自动使它们保持同步。

## 配置和凭据

ACP 模式使用与 CLI 相同的 Hermes 配置：

- `~/.hermes/.env`
- `~/.hermes/config.yaml`
- `~/.hermes/skills/`
- `~/.hermes/state.db`

提供商解析使用 Hermes 的标准运行时解析器，因此 ACP 继承当前配置的提供商和凭据。Hermes 还为首次运行的注册表客户端提供了一种终端认证方法（`--setup`）；这会启动 Hermes 的交互式模型/提供商设置。

## 会话行为

当 ACP 服务器运行时，ACP 会话由 ACP 适配器的内存会话管理器跟踪。

每个会话存储：

- 会话 ID
- 工作目录
- 选定的模型
- 当前对话历史
- 取消事件

底层的 `AIAgent` 仍然使用 Hermes 标准的持久化/日志记录路径，但 ACP 的 `list/load/resume/fork` 操作范围限定在当前运行的 ACP 服务器进程内。

## 工作目录行为

ACP 会话将编辑器的当前工作目录绑定到 Hermes 任务 ID，以便文件和终端工具相对于编辑器工作区运行，而不是服务器进程的工作目录。

## 审批

危险的终端命令可以作为审批提示路由回编辑器。ACP 的审批选项比 CLI 流程更简单：

- 允许一次
- 始终允许
- 拒绝

在超时或错误时，审批桥接会拒绝该请求。

### 会话范围内的编辑自动审批

ACP 在 *允许一次* 和 *始终允许* 之间暴露了第三层级：**允许会话内**。在编辑器的权限提示中选择此选项后，审批仅记录在当前 ACP 会话中 —— 该会话中后续所有匹配的命令将自动通过，无需提示，但新的 ACP 会话（或重启编辑器）会重置状态，并在第一次执行时重新提示。

| 选项 | 编辑器标签 | 作用范围 | 重启后是否保留 |
|---|---|---|---|
| `allow_once` | 允许一次 | 仅本次工具调用 | 否 |
| `allow_session` | 允许会话内 | 本次 ACP 会话内所有匹配调用 | 否 —— 会话结束即清除 |
| `allow_always` | 始终允许 | 所有未来会话 | 是（写入 Hermes 永久允许列表） |
| `deny` | 拒绝 | 仅本次工具调用 | 否 |

`allow_session` 是编辑器工作流程中合适的默认选项，当你信任一个智能体在某个任务期间的行为，但又不想授予一个长期的允许列表条目时。其安全权衡是直接的：作用范围越广，编辑器打断你的次数就越少，但如果智能体行为异常（或发生提示注入），在你注意到之前可能造成的损害也越大。对于不熟悉的命令，从 `allow_once` 开始；在你看到智能体正确运行了相同的模式几次后，可以升级到 `allow_session`；将 `allow_always` 保留给你永远信任的、真正幂等的命令（例如 `git status`）。

ACP 桥接将这些选项映射到 Hermes 内部的审批语义 —— `allow_always` 以与 CLI 相同的方式写入永久允许列表条目，而 `allow_session` 仅影响当前 ACP 会话的进程内审批缓存。

## 故障排除

### ACP 智能体未出现在编辑器中

检查：

- 在 Zed 中，使用 `zed: acp registry` 打开 ACP Registry 并搜索 **Hermes Agent**。
- 对于手动/本地开发，验证自定义的 `agent_servers` 命令指向 `hermes acp`。
- Hermes 已安装且在你的 PATH 中。
- 已安装 ACP 扩展（`pip install -e '.[acp]'`）。
- 如果从官方 Zed 注册表条目启动，则需安装 `uv`。

### ACP 启动但立即报错

尝试以下检查：

```bash
hermes acp --version
hermes acp --check
hermes doctor
hermes status
```

### 凭据缺失

ACP 模式使用 Hermes 现有的提供商设置。通过以下方式配置凭据：

```bash
hermes model
```

或编辑 `~/.hermes/.env`。注册表客户端也可以触发 Hermes 的终端认证流程，该流程会运行相同的交互式提供商/模型设置。

### Zed 注册表启动器找不到 uv

按照官方 uv 安装文档安装 `uv`，然后从 Zed 重试 Hermes Agent 线程。

## 另请参阅

- [ACP 内部机制](../../developer-guide/acp-internals.md)
- [提供商运行时解析](../../developer-guide/provider-runtime.md)
- [工具运行时](../../developer-guide/tools-runtime.md)