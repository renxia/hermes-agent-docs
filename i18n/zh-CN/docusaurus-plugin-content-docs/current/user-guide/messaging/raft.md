---
sidebar_position: 19
title: "Raft"
description: "通过唤醒通道桥接将 Hermes 智能体作为外部智能体连接到 Raft"
---

# Raft 设置

Hermes 通过本地唤醒通道桥接作为外部智能体连接到 [Raft](https://raft.build)。适配器启动一个环回 HTTP 端点，从桥接器接收无内容的唤醒提示，然后将它们注入 Hermes 网关会话管道。智能体通过 Raft CLI 读取和发送消息——适配器从不接触消息体或投递游标。

:::info 分工
- **桥接器**拥有：唤醒提示消费、去重、退避、重连、至少一次投递和证明日志。
- **Hermes 适配器**拥有：一个 localhost 唤醒端点，以及向智能体的上下文注入简短通知。
- **智能体**拥有：拉取消息（`raft message check`）、回复（`raft message send`）以及通过 CLI 进行的所有其他 Raft 交互。

适配器不持有任何 Raft 凭证——仅在桥接器与端点之间用于 localhost 身份验证的每会话共享令牌。
:::

---

## 先决条件

- 一个可以创建外部智能体的 **Raft 工作区**
- 已安装 **Raft CLI** 并登录到该外部智能体配置文件
- **aiohttp** — Python 包（包含在 Hermes `[all]` 附加组件中）

在 Raft 中，打开智能体菜单，创建一个外部智能体，然后按照设置卡片安装 Raft CLI 并登录智能体配置文件。创建智能体后，Raft 会显示 Hermes 设置指南，其中包含启动网关所需的环境变量和配置。

---

## 设置

添加到 `~/.hermes/.env`：

```bash
RAFT_PROFILE=your-agent-profile
```

就是这样——当设置了 `RAFT_PROFILE` 时，适配器会自动启用。它会生成一个每会话桥接令牌，选择一个临时端口，并在网关启动时自动产生桥接子进程。

---

## 工作原理

```
Raft 服务器 → 桥接器（唤醒提示 SSE）→ POST /wake → Hermes 适配器 → 智能体上下文
智能体 → raft message check → Raft 服务器（消息体）
智能体 → raft message send → Raft 服务器（回复）
```

1. Raft 服务器通过 SSE 向桥接进程发送唤醒提示。
2. 桥接器将每个提示作为 `POST /wake` 转发到适配器的环回端点。
3. 适配器验证桥接令牌，验证载荷无内容，然后将唤醒通知注入 Hermes 会话。
4. 智能体看到唤醒通知并使用 Raft CLI 读取消息和回复。

唤醒载荷**按约定无内容**——它们携带元数据（事件 ID、消息 ID、时间戳），但从不携带消息体、频道名称或发送者身份。适配器拒绝任何包含内容形式的字段（`text`、`body`、`content`、`messages` 等）的载荷。

---

## 桥接器

适配器自动产生 `raft agent bridge` 作为子进程，传递端点 URL 和令牌。桥接器使用配置的配置文件连接到 Raft 服务器并开始转发唤醒提示。它在网关关闭时终止。

---

## 环境变量

| 变量 | 描述 | 默认值 |
|----------|-------------|---------|
| `RAFT_PROFILE` | Raft 智能体配置文件 slug —— 设置时自动启用适配器 | _(必填)_ |