---
title: "Imessage — 在 macOS 上通过 imsg CLI 发送和接收 iMessage/SMS"
sidebar_label: "Imessage"
description: "在 macOS 上通过 imsg CLI 发送和接收 iMessage/SMS"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Imessage

在 macOS 上通过 imsg CLI 发送和接收 iMessage/SMS。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/apple/imessage` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | macos |
| 标签 | `iMessage`, `SMS`, `消息`, `macOS`, `Apple` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# iMessage

使用 `imsg` 通过 macOS Messages.app 读取和发送 iMessage/SMS。

## 先决条件

- 已登录 Messages.app 的 **macOS**
- 安装：`brew install steipete/tap/imsg`
- 为终端授予完全磁盘访问权限（系统设置 → 隐私 → 完全磁盘访问）
- 在提示时为 Messages.app 授予自动化权限

## 何时使用

- 用户要求发送 iMessage 或短信
- 读取 iMessage 对话历史
- 检查最近的 Messages.app 聊天记录
- 发送到电话号码或 Apple ID

## 何时不使用

- Telegram/Discord/Slack/WhatsApp 消息 → 使用相应的网关通道
- 群聊管理（添加/删除成员）→ 不支持
- 批量/群发消息 → 始终先与用户确认

## 快速参考

### 列出聊天

```bash
imsg chats --limit 10 --json
```

### 查看历史

```bash
# 按聊天 ID
imsg history --chat-id 1 --limit 20 --json

# 包含附件信息
imsg history --chat-id 1 --limit 20 --attachments --json
```

### 发送消息

```bash
# 仅文本
imsg send --to "+14155551212" --text "Hello!"

# 带附件
imsg send --to "+14155551212" --text "Check this out" --file /path/to/image.jpg

# 强制使用 iMessage 或 SMS
imsg send --to "+14155551212" --text "Hi" --service imessage
imsg send --to "+14155551212" --text "Hi" --service sms
```

### 监听新消息

```bash
imsg watch --chat-id 1 --attachments
```

## 服务选项

- `--service imessage` — 强制使用 iMessage（要求收件人拥有 iMessage）
- `--service sms` — 强制使用 SMS（绿色气泡）
- `--service auto` — 让 Messages.app 决定（默认）

## 规则

1. **发送前始终确认收件人和消息内容**
2. **未经用户明确批准，切勿发送到未知号码**
3. **附加前验证文件路径是否存在**
4. **不要发送垃圾信息** — 自我限速

## 示例工作流程

用户：“给妈妈发短信说我晚点到”

```bash
# 1. 找到妈妈的聊天
imsg chats --limit 20 --json | jq '.[] | select(.displayName | contains("Mom"))'

# 2. 与用户确认：“找到妈妈在 +1555123456。通过 iMessage 发送“我晚点到”吗？”

# 3. 确认后发送
imsg send --to "+1555123456" --text "我晚点到"
```