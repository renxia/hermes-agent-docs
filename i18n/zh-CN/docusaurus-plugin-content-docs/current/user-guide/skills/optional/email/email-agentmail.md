---
title: "Agentmail — 通过 AgentMail 为智能体分配专属邮箱收件箱"
sidebar_label: "Agentmail"
description: "通过 AgentMail 为智能体分配专属邮箱收件箱"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从该技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Agentmail

通过 AgentMail 为智能体分配专属邮箱收件箱。使用智能体拥有的邮箱地址（例如 hermes-agent@agentmail.to）自主发送、接收和管理电子邮件。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/email/agentmail` 安装 |
| 路径 | `optional-skills/email/agentmail` |
| 版本 | `1.0.0` |
| 标签 | `email`, `communication`, `agentmail`, `mcp` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# AgentMail — 智能体拥有的邮箱收件箱

## 要求

- **AgentMail API 密钥**（必需）— 在 https://console.agentmail.to 注册（免费套餐：3 个收件箱，每月 3,000 封邮件；付费套餐每月 20 美元起）
- Node.js 18+（用于 MCP 服务器）

## 使用时机
当您需要时，请使用此技能：
- 为智能体分配专属邮箱地址
- 代表智能体自主发送电子邮件
- 接收和阅读收到的电子邮件
- 管理电子邮件会话和对话
- 通过电子邮件注册服务或进行身份验证
- 通过电子邮件与其他智能体或人类通信

这**不是**用于读取用户的个人电子邮件（如需此功能，请使用 himalaya 或 Gmail）。
AgentMail 为智能体提供其自身的身份和收件箱。

## 设置

### 1. 获取 API 密钥
- 访问 https://console.agentmail.to
- 创建账户并生成 API 密钥（以 `am_` 开头）

### 2. 配置 MCP 服务器
添加到 `~/.hermes/config.yaml`（请粘贴您的实际密钥 — MCP 环境变量不会从 .env 文件中展开）：
```yaml
mcp_servers:
  agentmail:
    command: "npx"
    args: ["-y", "agentmail-mcp"]
    env:
      AGENTMAIL_API_KEY: "am_your_key_here"
```

### 3. 重启 Hermes
```bash
hermes
```
现在，所有 11 个 AgentMail 工具均已自动可用。

## 可用工具（通过 MCP）

| 工具 | 描述 |
|------|-------------|
| `list_inboxes` | 列出所有智能体收件箱 |
| `get_inbox` | 获取特定收件箱的详细信息 |
| `create_inbox` | 创建新收件箱（获取真实邮箱地址） |
| `delete_inbox` | 删除收件箱 |
| `list_threads` | 列出收件箱中的电子邮件会话 |
| `get_thread` | 获取特定电子邮件会话 |
| `send_message` | 发送新电子邮件 |
| `reply_to_message` | 回复现有电子邮件 |
| `forward_message` | 转发电子邮件 |
| `update_message` | 更新邮件标签/状态 |
| `get_attachment` | 下载电子邮件附件 |

## 操作流程

### 创建收件箱并发送电子邮件
1. 创建专属收件箱：
   - 使用 `create_inbox` 并提供用户名（例如 `hermes-agent`）
   - 智能体将获得地址：`hermes-agent@agentmail.to`
2. 发送电子邮件：
   - 使用 `send_message` 并提供 `inbox_id`、`to`、`subject`、`text`
3. 检查回复：
   - 使用 `list_threads` 查看收到的对话
   - 使用 `get_thread` 阅读特定会话

### 检查收到的电子邮件
1. 使用 `list_inboxes` 查找您的收件箱 ID
2. 使用 `list_threads` 和收件箱 ID 查看对话
3. 使用 `get_thread` 阅读会话及其消息

### 回复电子邮件
1. 使用 `get_thread` 获取会话
2. 使用 `reply_to_message` 并提供消息 ID 和您的回复文本

## 示例工作流

**注册服务：**
```
1. create_inbox（用户名："signup-bot"）
2. 使用收件箱地址在服务上注册
3. list_threads 检查验证电子邮件
4. get_thread 读取验证码
```

**智能体对人类的 outreach：**
```
1. create_inbox（用户名："hermes-outreach"）
2. send_message（收件人：user@example.com，主题："Hello"，正文："..."）
3. list_threads 检查回复
```

## 注意事项
- 免费套餐限制为 3 个收件箱和每月 3,000 封邮件
- 免费套餐的电子邮件来自 `@agentmail.to` 域（付费套餐可使用自定义域）
- MCP 服务器需要 Node.js（18+）（`npx -y agentmail-mcp`）
- 必须安装 `mcp` Python 包：`pip install mcp`
- 实时入站电子邮件（webhooks）需要公共服务器 — 个人使用建议通过 cronjob 使用 `list_threads` 轮询代替

## 验证
设置完成后，使用以下命令进行测试：
```
hermes --toolsets mcp -q "创建一个名为 test-agent 的 AgentMail 收件箱并告诉我其邮箱地址"
```
您应该会看到返回的新收件箱地址。

## 参考
- AgentMail 文档：https://docs.agentmail.to/
- AgentMail 控制台：https://console.agentmail.to
- AgentMail MCP 仓库：https://github.com/agentmail-to/agentmail-mcp
- 定价：https://www.agentmail.to/pricing