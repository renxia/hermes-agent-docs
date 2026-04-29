---
sidebar_position: 1
title: "消息网关"
description: "通过 API 服务器，使用 Telegram、Discord、Slack、WhatsApp、Signal、短信、电子邮件、Home Assistant、Mattermost、Matrix、钉钉、元宝、Webhooks 或任何兼容 OpenAI 的前端与 Hermes 聊天 —— 架构与设置概览"
---

# 消息网关

通过 Telegram、Discord、Slack、WhatsApp、Signal、短信、电子邮件、Home Assistant、Mattermost、Matrix、钉钉、飞书/Lark、企业微信、微信、BlueBubbles（iMessage）、QQ、元宝或浏览器与 Hermes 聊天。该网关是一个独立的后台进程，连接所有已配置的平台，处理会话，运行定时任务，并传递语音消息。

要获得完整的语音功能集 —— 包括 CLI 麦克风模式、消息中的语音回复以及 Discord 语音频道对话 —— 请参阅 [语音模式](/docs/user-guide/features/voice-mode) 和 [与 Hermes 一起使用语音模式](/docs/guides/use-voice-mode-with-hermes)。

## 平台比较

| 平台 | 语音 | 图片 | 文件 | 线程 | 反应 | 正在输入 | 流式传输 |
|----------|:-----:|:------:|:-----:|:-------:|:---------:|:------:|:---------:|
| Telegram | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| Discord | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Slack | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| WhatsApp | — | ✅ | ✅ | — | — | ✅ | ✅ |
| Signal | — | ✅ | ✅ | — | — | ✅ | ✅ |
| 短信 | — | — | — | — | — | — | — |
| 电子邮件 | — | ✅ | ✅ | ✅ | — | — | — |
| Home Assistant | — | — | — | — | — | — | — |
| Mattermost | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| Matrix | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 钉钉 | — | ✅ | ✅ | — | ✅ | — | ✅ |
| 飞书/Lark | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 企业微信 | ✅ | ✅ | ✅ | — | — | ✅ | ✅ |
| 企业微信回调 | — | — | — | — | — | — | — |
| 微信 | ✅ | ✅ | ✅ | — | — | ✅ | ✅ |
| BlueBubbles | — | ✅ | ✅ | — | ✅ | ✅ | — |
| QQ | ✅ | ✅ | ✅ | — | — | ✅ | — |
| 元宝 | ✅ | ✅ | ✅ | — | — | ✅ | ✅ |

**语音** = TTS 音频回复和/或语音消息转录。**图片** = 发送/接收图片。**文件** = 发送/接收文件附件。**线程** = 线程化对话。**反应** = 消息上的表情符号反应。**正在输入** = 处理时的输入指示器。**流式传输** = 通过编辑进行渐进式消息更新。

## 架构

```mermaid
flowchart TB
    subgraph Gateway["Hermes 网关"]
        subgraph Adapters["平台适配器"]
            tg[Telegram]
            dc[Discord]
            wa[WhatsApp]
            sl[Slack]
            sig[Signal]
            sms[SMS]
            em[Email]
            ha[Home Assistant]
            mm[Mattermost]
            mx[Matrix]
            dt[DingTalk]
            fs[飞书/Lark]
            wc[企业微信]
            wcb[企业微信回调]
            wx[微信]
            bb[BlueBubbles]
            qq[QQ]
            yb[元宝]
            api["API 服务器<br/>(兼容 OpenAI)"]
            wh[Webhooks]
        end

        store["会话存储<br/>每个聊天独立"]
        agent["AI智能体<br/>run_agent.py"]
        cron["定时任务调度器<br/>每 60 秒触发一次"]
    end

    tg --> store
    dc --> store
    wa --> store
    sl --> store
    sig --> store
    sms --> store
    em --> store
    ha --> store
    mm --> store
    mx --> store
    dt --> store
    fs --> store
    wc --> store
    wcb --> store
    wx --> store
    bb --> store
    qq --> store
    yb --> store
    api --> store
    wh --> store
    store --> agent
    cron --> store
```

每个平台适配器接收消息，通过每个聊天独立的会话存储进行路由，并将其分发给 AI智能体 进行处理。网关还运行定时任务调度器，每 60 秒触发一次，以执行任何到期的任务。

## 快速设置

配置消息平台最简单的方法是使用交互式向导：

```bash
hermes gateway setup        # 为所有消息平台进行交互式设置
```

这将引导您配置每个平台，使用方向键进行选择，显示哪些平台已经配置，并在完成后提供启动/重启网关的选项。

## 网关命令

```bash
hermes gateway              # 前台运行
hermes gateway setup        # 交互式配置消息平台
hermes gateway install      # 安装为用户服务（Linux）/ launchd 服务（macOS）
sudo hermes gateway install --system   # 仅限 Linux：安装为开机系统服务
hermes gateway start        # 启动默认服务
hermes gateway stop         # 停止默认服务
hermes gateway status       # 检查默认服务状态
hermes gateway status --system         # 仅限 Linux：显式检查系统服务
```

## 聊天命令（在消息应用中）

| 命令 | 描述 |
|---------|-------------|
| `/new` 或 `/reset` | 开始一次全新的对话 |
| `/model [provider:model]` | 显示或更改模型（支持 `provider:model` 语法） |
| `/personality [name]` | 设置一个角色 |
| `/retry` | 重试最后一条消息 |
| `/undo` | 移除最后一次交互 |
| `/status` | 显示会话信息 |
| `/stop` | 停止正在运行的智能体 |
| `/approve` | 批准一个待处理的危险命令 |
| `/deny` | 拒绝一个待处理的危险命令 |
| `/sethome` | 将此聊天设置为主频道 |
| `/compress` | 手动压缩对话上下文 |
| `/title [name]` | 设置或显示会话标题 |
| `/resume [name]` | 恢复之前命名的会话 |
| `/usage` | 显示此会话的令牌使用情况 |
| `/insights [days]` | 显示使用情况洞察和分析 |
| `/reasoning [level\|show\|hide]` | 更改推理强度或切换推理显示 |
| `/voice [on\|off\|tts\|join\|leave\|status]` | 控制消息语音回复和 Discord 语音频道行为 |
| `/rollback [number]` | 列出或恢复文件系统检查点 |
| `/background <prompt>` | 在单独的后台会话中运行一个提示 |
| `/reload-mcp` | 从配置重新加载 MCP 服务器 |
| `/update` | 将 Hermes 智能体更新到最新版本 |
| `/help` | 显示可用命令 |
| `/<skill-name>` | 调用任何已安装的技能 |

## 会话管理

### 会话持久化

会话在消息之间保持，直到它们被重置。智能体会记住您的对话上下文。

### 重置策略

会话根据可配置的策略进行重置：

| 策略 | 默认 | 描述 |
|--------|---------|-------------|
| 每日 | 凌晨 4:00 | 每天在特定时间重置 |
| 空闲 | 1440 分钟 | 在 N 分钟不活动后重置 |
| 两者 | （组合） | 任一触发即重置 |

在 `~/.hermes/gateway.json` 中配置每个平台的重置策略覆盖：

```json
{
  "reset_by_platform": {
    "telegram": { "mode": "idle", "idle_minutes": 240 },
    "discord": { "mode": "idle", "idle_minutes": 60 }
  }
}
```

## 安全

**默认情况下，网关会拒绝所有不在白名单中或通过私信配对的用户的访问。** 这对于具有终端访问权限的机器人来说是安全默认设置。

```bash
# 限制特定用户（推荐）：
TELEGRAM_ALLOWED_USERS=123456789,987654321
DISCORD_ALLOWED_USERS=123456789012345678
SIGNAL_ALLOWED_USERS=+155****4567,+155****6543
SMS_ALLOWED_USERS=+155****4567,+155****6543
EMAIL_ALLOWED_USERS=trusted@example.com,colleague@work.com
MATTERMOST_ALLOWED_USERS=3uo8dkh1p7g1mfk49ear5fzs5c
MATRIX_ALLOWED_USERS=@alice:matrix.org
DINGTALK_ALLOWED_USERS=user-id-1
FEISHU_ALLOWED_USERS=ou_xxxxxxxx,ou_yyyyyyyy
WECOM_ALLOWED_USERS=user-id-1,user-id-2
WECOM_CALLBACK_ALLOWED_USERS=user-id-1,user-id-2

# 或者允许
GATEWAY_ALLOWED_USERS=123456789,987654321

# 或者显式允许所有用户（不推荐用于具有终端访问权限的机器人）：
GATEWAY_ALLOW_ALL_USERS=true
```

### 私信配对（白名单的替代方案）

无需手动配置用户 ID，未知用户在向机器人发送私信时会收到一次性配对码：

```bash
# 用户看到：“配对码：XKGH5N7P”
# 您可以通过以下方式批准他们：
hermes pairing approve telegram XKGH5N7P

# 其他配对命令：
hermes pairing list          # 查看待处理 + 已批准的用户
hermes pairing revoke telegram 123456789  # 移除访问权限
```

配对码在 1 小时后过期，有限速，并使用加密随机性。

## 中断智能体

在智能体工作时发送任何消息即可中断它。关键行为：

- **正在进行的终端命令会立即被终止**（SIGTERM，1 秒后 SIGKILL）
- **工具调用被取消** — 仅当前正在执行的工具调用会运行，其余的会被跳过
- **多条消息会被合并** — 中断期间发送的消息会被合并为一个提示
- **`/stop` 命令** — 中断而不排队后续消息

### 排队 vs 中断 vs 引导（忙输入模式）

默认情况下，向忙碌的智能体发送消息会中断它。还有两种其他模式可用：

- `queue` — 后续消息等待，并在当前任务完成后作为下一轮运行。
- `steer` — 后续消息通过 `/steer` 注入到当前运行中，在下一个工具调用后到达智能体。不中断，不开启新轮次。如果智能体尚未开始，则回退到 `queue` 行为。

```yaml
display:
  busy_input_mode: steer   # 或 queue，或 interrupt（默认）
```

您在任何平台上首次向忙碌的智能体发送消息时，Hermes 会在忙确认后附加一行提醒，解释该设置（“💡 首次提示 — …”）。该提醒在安装时仅触发一次 — `onboarding.seen.busy_input_prompt` 下的标志会锁定它。删除该键可再次看到提示。

## 工具进度通知

在 `~/.hermes/config.yaml` 中控制显示多少工具活动：

```yaml
display:
  tool_progress: all    # off | new | all | verbose
  tool_progress_command: false  # 设置为 true 以在消息中启用 /verbose
```

启用后，机器人会在工作时发送状态消息：

```text
💻 `ls -la`...
🔍 web_search...
📄 web_extract...
🐍 execute_code...
```

## 后台会话

在单独的后台会话中运行一个提示，以便智能体独立处理它，而您的主聊天保持响应：

```
/background 检查集群中的所有服务器，并报告任何宕机的服务器
```

Hermes 会立即确认：

```
🔄 后台任务已启动：“检查集群中的所有服务器...”
   任务 ID：bg_143022_a1b2c3
```

### 工作原理

每个 `/background` 提示都会生成一个**独立的智能体实例**，异步运行：

- **隔离的会话** — 后台智能体拥有自己的会话和对话历史。它不了解您当前的聊天上下文，仅接收您提供的提示。
- **相同配置** — 继承您当前的网关设置中的模型、提供商、工具集、推理设置和提供商路由。
- **非阻塞** — 您的主聊天保持完全交互。在它工作时，您可以发送消息、运行其他命令或启动更多后台任务。
- **结果交付** — 任务完成后，结果会发送回您发出命令的**相同聊天或频道**，前缀为“✅ 后台任务完成”。如果失败，您会看到“❌ 后台任务失败”以及错误信息。

### 后台进程通知

当运行后台会话的智能体使用 `terminal(background=true)` 启动长时间运行的进程（服务器、构建等）时，网关可以向您的聊天推送状态更新。在 `~/.hermes/config.yaml` 中使用 `display.background_process_notifications` 控制此功能：

```yaml
display:
  background_process_notifications: all    # all | result | error | off
```

| 模式 | 您收到的内容 |
|------|-----------------|
| `all` | 运行输出更新**和**最终完成消息（默认） |
| `result` | 仅最终完成消息（无论退出代码如何） |
| `error` | 仅当退出代码非零时的最终消息 |
| `off` | 完全没有进程监视器消息 |

您也可以通过环境变量设置此功能：

```bash
HERMES_BACKGROUND_NOTIFICATIONS=result
```

### 使用案例

- **服务器监控** — “/background 检查所有服务的健康状况，如果有任何服务宕机则提醒我”
- **长时间构建** — “/background 构建并部署暂存环境”，同时您可以继续聊天
- **研究任务** — “/background 研究竞争对手的定价并以表格形式总结”
- **文件操作** — “/background 按日期将 ~/Downloads 中的照片整理到文件夹中”

:::tip
消息平台上的后台任务是“发射后即忘”的 — 您无需等待或检查它们。任务完成后，结果会自动到达同一聊天中。
:::

## 服务管理

### Linux (systemd)

```bash
hermes gateway install               # 安装为用户服务
hermes gateway start                 # 启动服务
hermes gateway stop                  # 停止服务
hermes gateway status                # 查看状态
journalctl --user -u hermes-gateway -f  # 查看日志

# 启用 linger（在注销后保持运行）
sudo loginctl enable-linger $USER

# 或者安装为开机自启的系统服务（仍以你的用户身份运行）
sudo hermes gateway install --system
sudo hermes gateway start --system
sudo hermes gateway status --system
journalctl -u hermes-gateway -f
```

在笔记本电脑和开发机上使用用户服务。在 VPS 或无头主机上使用系统服务，以便在启动时自动恢复运行，而无需依赖 systemd linger。

除非你确实需要，否则避免同时安装用户和系统网关单元。如果 Hermes 检测到两者同时存在，会发出警告，因为 start/stop/status 的行为会变得不明确。

:::info 多实例安装
如果你在同一台机器上运行多个 Hermes 实例（使用不同的 `HERMES_HOME` 目录），每个实例都会获得自己的 systemd 服务名称。默认的 `~/.hermes` 使用 `hermes-gateway`；其他安装使用 `hermes-gateway-<hash>`。`hermes gateway` 命令会自动针对你当前的 `HERMES_HOME` 选择正确的服务。
:::

### macOS (launchd)

```bash
hermes gateway install               # 安装为 launchd 智能体
hermes gateway start                 # 启动服务
hermes gateway stop                  # 停止服务
hermes gateway status                # 查看状态
tail -f ~/.hermes/logs/gateway.log   # 查看日志
```

生成的 plist 文件位于 `~/Library/LaunchAgents/ai.hermes.gateway.plist`。它包含三个环境变量：

- **PATH** — 安装时你的完整 shell PATH，并前置了 venv 的 `bin/` 和 `node_modules/.bin`。这确保了用户安装的工具（如 Node.js、ffmpeg 等）对网关子进程（如 WhatsApp 桥接器）可用。
- **VIRTUAL_ENV** — 指向 Python 虚拟环境，以便工具能正确解析包。
- **HERMES_HOME** — 将网关限定到你的 Hermes 安装目录。

:::tip 安装后 PATH 发生变化
launchd plist 是静态的 — 如果你在设置网关后安装了新工具（例如通过 nvm 安装新的 Node.js 版本，或通过 Homebrew 安装 ffmpeg），请再次运行 `hermes gateway install` 以捕获更新后的 PATH。网关会自动检测到过时的 plist 并重新加载。
:::

:::info 多实例安装
与 Linux systemd 服务类似，每个 `HERMES_HOME` 目录都会获得自己的 launchd 标签。默认的 `~/.hermes` 使用 `ai.hermes.gateway`；其他安装使用 `ai.hermes.gateway-<suffix>`。
:::

## 平台特定工具集

每个平台都有其专属的工具集：

| 平台 | 工具集 | 功能 |
|----------|---------|--------------|
| CLI | `hermes-cli` | 完全访问 |
| Telegram | `hermes-telegram` | 完整工具，包括终端 |
| Discord | `hermes-discord` | 完整工具，包括终端 |
| WhatsApp | `hermes-whatsapp` | 完整工具，包括终端 |
| Slack | `hermes-slack` | 完整工具，包括终端 |
| Signal | `hermes-signal` | 完整工具，包括终端 |
| SMS | `hermes-sms` | 完整工具，包括终端 |
| Email | `hermes-email` | 完整工具，包括终端 |
| Home Assistant | `hermes-homeassistant` | 完整工具 + HA 设备控制（ha_list_entities、ha_get_state、ha_call_service、ha_list_services） |
| Mattermost | `hermes-mattermost` | 完整工具，包括终端 |
| Matrix | `hermes-matrix` | 完整工具，包括终端 |
| DingTalk | `hermes-dingtalk` | 完整工具，包括终端 |
| Feishu/Lark | `hermes-feishu` | 完整工具，包括终端 |
| WeCom | `hermes-wecom` | 完整工具，包括终端 |
| WeCom Callback | `hermes-wecom-callback` | 完整工具，包括终端 |
| Weixin | `hermes-weixin` | 完整工具，包括终端 |
| BlueBubbles | `hermes-bluebubbles` | 完整工具，包括终端 |
| QQBot | `hermes-qqbot` | 完整工具，包括终端 |
| Yuanbao | `hermes-yuanbao` | 完整工具，包括终端 |
| API Server | `hermes`（默认） | 完整工具，包括终端 |
| Webhooks | `hermes-webhook` | 完整工具，包括终端 |

## 后续步骤

- [Telegram 设置](telegram.md)
- [Discord 设置](discord.md)
- [Slack 设置](slack.md)
- [WhatsApp 设置](whatsapp.md)
- [Signal 设置](signal.md)
- [SMS 设置 (Twilio)](sms.md)
- [Email 设置](email.md)
- [Home Assistant 集成](homeassistant.md)
- [Mattermost 设置](mattermost.md)
- [Matrix 设置](matrix.md)
- [DingTalk 设置](dingtalk.md)
- [Feishu/Lark 设置](feishu.md)
- [WeCom 设置](wecom.md)
- [WeCom Callback 设置](wecom-callback.md)
- [Weixin 设置 (微信)](weixin.md)
- [BlueBubbles 设置 (iMessage)](bluebubbles.md)
- [QQBot 设置](qqbot.md)
- [Yuanbao 设置](yuanbao.md)
- [Open WebUI + API 服务器](open-webui.md)
- [Webhooks](webhooks.md)