---
sidebar_position: 11
title: "ACP 编辑器集成"
description: "在兼容 ACP 的编辑器（如 VS Code、Zed 和 JetBrains）中使用 Hermes 智能体"
---

# ACP 编辑器集成

Hermes 智能体可以作为 ACP 服务器运行，使兼容 ACP 的编辑器能够通过标准输入输出（stdio）与 Hermes 通信并渲染：

- 聊天消息
- 工具活动
- 文件差异
- 终端命令
- 审批提示
- 流式思考/响应块

当您希望 Hermes 表现得像一个编辑器原生的编码智能体，而不是独立的 CLI 或消息机器人时，ACP 是一个很好的选择。

## Hermes 在 ACP 模式下暴露的功能

Hermes 运行时会使用一个为编辑器工作流精心设计的 `hermes-acp` 工具集。它包括：

- 文件工具：`read_file`、`write_file`、`patch`、`search_files`
- 终端工具：`terminal`、`process`
- Web/浏览器工具
- 内存、待办事项、会话搜索
- 技能
- `execute_code` 和 `delegate_task`
- 视觉能力

它有意排除了不适合典型编辑器用户体验的功能，例如消息传递和定时任务管理。

## 安装

正常安装 Hermes，然后添加 ACP 额外依赖：

```bash
pip install -e '.[acp]'
```

这将安装 `agent-client-protocol` 依赖并启用：

- `hermes acp`
- `hermes-acp`
- `python -m acp_adapter`

## 启动 ACP 服务器

以下任一命令均可将 Hermes 以 ACP 模式启动：

```bash
hermes acp
```

```bash
hermes-acp
```

```bash
python -m acp_adapter
```

Hermes 会将日志输出到标准错误（stderr），因此标准输出（stdout）保留用于 ACP JSON-RPC 通信。

## 编辑器设置

### VS Code

安装 [ACP Client](https://marketplace.visualstudio.com/items?itemName=formulahendry.acp-client) 扩展。

连接步骤：

1. 从活动栏打开 ACP Client 面板。
2. 从内置智能体列表中选择 **Hermes 智能体**。
3. 连接并开始聊天。

如果您想手动定义 Hermes，请通过 VS Code 设置中的 `acp.agents` 添加：

```json
{
  "acp.agents": {
    "Hermes 智能体": {
      "command": "hermes",
      "args": ["acp"]
    }
  }
}
```

### Zed

示例设置片段：

```json
{
  "agent_servers": {
    "hermes-agent": {
      "type": "custom",
      "command": "hermes",
      "args": ["acp"],
    },
  },
}
```

### JetBrains

使用兼容 ACP 的插件，并将其指向：

```text
/path/to/hermes-agent/acp_registry
```

## 注册表清单

ACP 注册表清单位于：

```text
acp_registry/agent.json
```

它声明了一个基于命令启动的智能体，其启动命令为：

```text
hermes acp
```

## 配置和凭据

ACP 模式使用与 CLI 相同的 Hermes 配置：

- `~/.hermes/.env`
- `~/.hermes/config.yaml`
- `~/.hermes/skills/`
- `~/.hermes/state.db`

提供者解析使用 Hermes 的常规运行时解析器，因此 ACP 会继承当前配置的提供者和凭据。

## 会话行为

ACP 会话由 ACP 适配器的内存会话管理器在服务器运行期间进行跟踪。

每个会话存储：

- 会话 ID
- 工作目录
- 选择的模型
- 当前对话历史
- 取消事件

底层的 `AIAgent` 仍然使用 Hermes 的常规持久化/日志路径，但 ACP 的 `list/load/resume/fork` 操作范围限定于当前正在运行的 ACP 服务器进程。

## 工作目录行为

ACP 会话会将编辑器的当前工作目录（cwd）绑定到 Hermes 任务 ID，因此文件和终端工具会相对于编辑器工作空间运行，而不是服务器进程的当前工作目录。

## 审批

危险的终端命令可以被路由回编辑器作为审批提示。ACP 审批选项比 CLI 流程更简单：

- 允许一次
- 始终允许
- 拒绝

在超时或出错时，审批桥接会拒绝请求。

## 故障排除

### ACP 智能体未出现在编辑器中

请检查：

- 编辑器是否指向正确的 `acp_registry/` 路径
- Hermes 是否已安装并在您的 PATH 中
- 是否已安装 ACP 额外依赖（`pip install -e '.[acp]'`）

### ACP 启动但立即报错

请尝试以下检查：

```bash
hermes doctor
hermes status
hermes acp
```

### 缺少凭据

ACP 模式没有自己的登录流程。它使用 Hermes 现有的提供者设置。请通过以下方式配置凭据：

```bash
hermes model
```

或编辑 `~/.hermes/.env`。

## 另见

- [ACP 内部机制](../../developer-guide/acp-internals.md)
- [提供者运行时解析](../../developer-guide/provider-runtime.md)
- [工具运行时](../../developer-guide/tools-runtime.md)