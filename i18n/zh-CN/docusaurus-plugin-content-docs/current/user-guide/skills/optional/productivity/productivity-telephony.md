---
title: "电话功能——无需修改核心工具即可为海神赋予电话能力"
sidebar_label: "电话功能"
description: "无需修改核心工具即可为海神赋予电话能力"
---

{/* 本页面由网站脚本 generate-skill-docs.py 从技能文件 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 电话功能

无需修改核心工具即可为海神赋予电话能力。配置并持久化一个 Twilio 号码，发送和接收短信/彩信，进行直接通话，以及通过 Bland.ai 或 Vapi 发起人工智能驱动的外呼电话。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/productivity/telephony` 安装 |
| 路径 | `optional-skills/productivity/telephony` |
| 版本 | `1.0.0` |
| 作者 | Nous Research |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `电话功能`, `电话`, `短信`, `彩信`, `语音`, `twilio`, `bland.ai`, `vapi`, `通话`, `发短信` |
| 相关技能 | [`地图`](/docs/user-guide/skills/bundled/productivity/productivity-maps), [`谷歌工作区`](/docs/user-guide/skills/bundled/productivity/productivity-google-workspace), [`智能体邮件`](/docs/user-guide/skills/optional/email/email-agentmail) |

:::info
以下是智能体在触发此技能时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# 电话功能 —— 无需更改核心工具即可使用号码、通话和短信

此可选技能为 Hermes 提供实用的电话功能，同时将电话相关操作保持在核心工具列表之外。

它附带一个辅助脚本 `scripts/telephony.py`，该脚本可以：
- 将供应商凭证保存到 `~/.hermes/.env`
- 搜索并购买 Twilio 电话号码
- 记住已拥有的号码以供后续会话使用
- 从已拥有的号码发送短信/彩信
- 轮询该号码的入站短信，无需 Webhook 服务器
- 使用 TwiML `<Say>` 或 `<Play>` 进行直接 Twilio 通话
- 将已拥有的 Twilio 号码导入 Vapi
- 通过 Bland.ai 或 Vapi 拨打出站 AI 电话

## 解决的问题

此技能旨在覆盖用户实际需要的实用电话任务：
- 拨打出站电话
- 发送短信
- 拥有一个可重用的智能体号码
- 稍后检查发送到该号码的消息
- 在会话之间保留该号码和相关 ID
- 为入站短信轮询和其他自动化提供面向未来的电话身份

它**不会**将 Hermes 变成实时入站电话网关。入站短信通过轮询 Twilio REST API 来处理。这对于许多工作流程来说已经足够，包括通知和一些一次性代码检索，而无需添加核心 Webhook 基础设施。

## 安全规则 —— 强制性

1. 在拨打电话或发送短信之前始终进行确认。
2. 切勿拨打紧急电话号码。
3. 切勿将电话用于骚扰、垃圾信息、冒充他人身份或任何非法活动。
4. 将第三方电话号码视为敏感操作数据：
   - 不要将它们保存到 Hermes 记忆中
   - 除非用户明确要求，否则不要将它们包含在技能文档、摘要或后续笔记中
5. 可以持久化**智能体拥有的 Twilio 号码**，因为那是用户配置的一部分。
6. VoIP 号码**不能保证**适用于所有第三方双因素认证 (2FA) 流程。请谨慎使用，并清楚地设定用户预期。

## 决策树 —— 应使用哪个服务？

使用以下逻辑，而不是硬编码的供应商路由：

### 1) "我希望 Hermes 拥有一个真实电话号码"
使用 **Twilio**。

原因：
- 购买和保留号码的最简单途径
- 最佳短信/彩信支持
- 最简单的入站短信轮询方案
- 通往入站 Webhook 或呼叫处理的最清晰路径

使用场景：
- 稍后接收短信
- 发送部署警报/定时任务通知
- 为智能体维护一个可重用的电话身份
- 稍后尝试基于电话的认证流程

### 2) "我现在只需要最简单的出站 AI 电话"
使用 **Bland.ai**。

原因：
- 设置最快
- 只需一个 API 密钥
- 无需自己先购买/导入号码

权衡：
- 灵活性较低
- 语音质量尚可，但并非最佳

### 3) "我想要最佳的对话式 AI 语音质量"
使用 **Twilio + Vapi**。

原因：
- Twilio 为您提供了拥有的号码
- Vapi 为您提供了更好的对话式 AI 通话质量和更多的语音/模型灵活性

推荐流程：
1. 购买/保存一个 Twilio 号码
2. 将其导入 Vapi
3. 保存返回的 `VAPI_PHONE_NUMBER_ID`
4. 使用 `ai-call --provider vapi`

### 4) "我想使用自定义预录语音消息进行通话"
使用 **Twilio 直接通话** 和一个公共音频 URL。

原因：
- 播放自定义 MP3 的最简单方法
- 与 Hermes `text_to_speech` 以及公共文件托管或隧道配合良好

## 文件和持久状态

该技能在两个位置持久化电话状态：

### `~/.hermes/.env`
用于长期有效的供应商凭证和已拥有号码的 ID，例如：
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_PHONE_NUMBER_SID`
- `BLAND_API_KEY`
- `VAPI_API_KEY`
- `VAPI_PHONE_NUMBER_ID`
- `PHONE_PROVIDER` (AI 通话供应商：bland 或 vapi)

### `~/.hermes/telephony_state.json`
用于应跨会话保留的仅限技能状态，例如：
- 记住的默认 Twilio 号码/SID
- 记住的 Vapi 电话号码 ID
- 用于收件箱轮询检查点的最后入站消息 SID/日期

这意味着：
- 下次加载该技能时，`diagnose` 可以告诉您已配置了哪个号码
- `twilio-inbox --since-last --mark-seen` 可以从之前的检查点继续

## 定位辅助脚本

安装此技能后，按如下方式定位脚本：

```bash
SCRIPT="$(find ~/.hermes/skills -path '*/telephony/scripts/telephony.py' -print -quit)"
```

如果 `SCRIPT` 为空，则技能尚未安装。

## 安装

这是一个官方可选技能，因此从技能中心安装它：

```bash
hermes skills search telephony
hermes skills install official/productivity/telephony
```

## 供应商设置

### Twilio —— 拥有的号码、短信/彩信、直接通话、入站短信轮询

注册：
- https://www.twilio.com/try-twilio

然后将凭证保存到 Hermes：

```bash
python3 "$SCRIPT" save-twilio ACXXXXXXXXXXXXXXXXXXXXXXXXXXXX your_auth_token_here
```

搜索可用号码：

```bash
python3 "$SCRIPT" twilio-search --country US --area-code 702 --limit 5
```

购买并记住一个号码：

```bash
python3 "$SCRIPT" twilio-buy "+17025551234" --save-env
```

列出已拥有的号码：

```bash
python3 "$SCRIPT" twilio-owned
```

稍后将其中一个设置为默认：

```bash
python3 "$SCRIPT" twilio-set-default "+17025551234" --save-env
# 或
python3 "$SCRIPT" twilio-set-default PNXXXXXXXXXXXXXXXXXXXXXXXXXXXX --save-env
```

### Bland.ai —— 最简单的出站 AI 通话

注册：
- https://app.bland.ai

保存配置：

```bash
python3 "$SCRIPT" save-bland your_bland_api_key --voice mason
```

### Vapi —— 更好的对话式语音质量

注册：
- https://dashboard.vapi.ai

先保存 API 密钥：

```bash
python3 "$SCRIPT" save-vapi your_vapi_api_key
```

将您拥有的 Twilio 号码导入 Vapi 并保存返回的电话号码 ID：

```bash
python3 "$SCRIPT" vapi-import-twilio --save-env
```

如果您已经知道 Vapi 电话号码 ID，可以直接保存：

```bash
python3 "$SCRIPT" save-vapi your_vapi_api_key --phone-number-id vapi_phone_number_id_here
```

## 诊断当前状态

随时检查技能已知的内容：

```bash
python3 "$SCRIPT" diagnose
```

在稍后的会话中恢复工作时，请首先使用此命令。

## 常见工作流程

### A. 购买一个智能体号码并稍后继续使用

1. 保存 Twilio 凭证：
```bash
python3 "$SCRIPT" save-twilio AC... auth_token_here
```

2. 搜索号码：
```bash
python3 "$SCRIPT" twilio-search --country US --area-code 702 --limit 10
```

3. 购买并将其保存到 `~/.hermes/.env` 和状态中：
```bash
python3 "$SCRIPT" twilio-buy "+17025551234" --save-env
```

4. 下次会话，运行：
```bash
python3 "$SCRIPT" diagnose
```
这将显示记住的默认号码和收件箱检查点状态。

### B. 从智能体号码发送短信

```bash
python3 "$SCRIPT" twilio-send-sms "+15551230000" "您的部署已成功完成。"
```

带媒体：

```bash
python3 "$SCRIPT" twilio-send-sms "+15551230000" "这是图表。" --media-url "https://example.com/chart.png"
```

### C. 稍后检查入站短信，无需 Webhook 服务器

轮询默认 Twilio 号码的收件箱：

```bash
python3 "$SCRIPT" twilio-inbox --limit 20
```

只显示上次检查点之后到达的消息，并在读取完毕后推进检查点：

```bash
python3 "$SCRIPT" twilio-inbox --since-last --mark-seen
```

这是对“下次加载技能时我如何访问该号码接收的消息？”的主要回答。

### D. 使用内置 TTS 进行直接 Twilio 通话

```bash
python3 "$SCRIPT" twilio-call "+15551230000" --message "你好！这是 Hermes 正在为您播报状态更新。" --voice Polly.Joanna
```

### E. 使用预录/自定义语音消息通话

这是重用 Hermes 现有 `text_to_speech` 支持的主要路径。

适用情况：
- 您希望通话使用 Hermes 配置的 TTS 语音，而不是 Twilio `<Say>`
- 您需要单向语音传递（简报、警报、笑话、提醒、状态更新）
- 您**不**需要实时对话式电话通话

单独生成或托管音频，然后：

```bash
python3 "$SCRIPT" twilio-call "+155****0000" --audio-url "https://example.com/briefing.mp3"
```

推荐的 Hermes TTS -> Twilio Play 工作流程：

1. 使用 Hermes `text_to_speech` 生成音频。
2. 使生成的 MP3 可公开访问。
3. 使用 `--audio-url` 发起 Twilio 通话。

示例智能体流程：
- 请 Hermes 使用 `text_to_speech` 创建消息音频
- 如有必要，使用临时静态主机/隧道/对象存储 URL 暴露文件
- 使用 `twilio-call --audio-url ...` 通过电话传递

MP3 的好托管选项：
- 临时公共对象/存储 URL
- 到本地静态文件服务器的短期隧道
- 电话供应商可以直接获取的任何现有 HTTPS URL

重要说明：
- Hermes TTS 非常适合预录的出站消息
- Bland/Vapi 更适合**实时对话式 AI 通话**，因为它们自行处理实时电话音频栈
- 这里没有将 Hermes STT/TTS 单独用作全双工电话对话引擎；那将需要比此技能试图引入的更重的流/Webhook 集成

### F. 使用 Twilio 直接通话导航电话树/IVR

如果您需要在通话连接后按数字，请使用 `--send-digits`。
Twilio 将 `w` 解释为短等待。

```bash
python3 "$SCRIPT" twilio-call "+18005551234" --message "正在转接至账单部门。" --send-digits "ww1w2w3"
```

这在转接给人工或传递简短状态消息之前到达特定菜单分支时非常有用。

### G. 使用 Bland.ai 进行出站 AI 电话

```bash
python3 "$SCRIPT" ai-call "+15551230000" "打电话给牙科诊所，预约周二下午的洗牙服务，如果他们周二没有空位，询问周三或周四是否有。" --provider bland --voice mason --max-duration 3
```

检查状态：

```bash
python3 "$SCRIPT" ai-status <call_id> --provider bland
```

通话完成后向 Bland 询问分析问题：

```bash
python3 "$SCRIPT" ai-status <call_id> --provider bland --analyze "预约确认了吗？,日期和时间是什么？,有特别指示吗？"
```

### H. 使用 Vapi 通过您拥有的号码进行出站 AI 电话

1. 将您的 Twilio 号码导入 Vapi：
```bash
python3 "$SCRIPT" vapi-import-twilio --save-env
```

2. 拨打电话：
```bash
python3 "$SCRIPT" ai-call "+15551230000" "你正在打电话预订晚上 7 点 30 分的两人晚餐座位。如果该时间不可用，询问晚上 6 点 30 分到 8 点 30 分之间最近的时间。" --provider vapi --max-duration 4
```

3. 检查结果：
```bash
python3 "$SCRIPT" ai-status <call_id> --provider vapi
```

## 建议的智能体操作流程

当用户要求通话或发送短信时：

1.  通过决策树确定哪条路径符合请求。
2.  若配置状态不明确，则运行 `diagnose`。
3.  收集完整的任务详情。
4.  在拨号或发送短信前与用户确认。
5.  使用正确的命令。
6.  如有需要，轮询结果。
7.  总结结果，但不将第三方号码持久化到赫尔墨斯内存中。

## 此技能目前仍不具备的功能

-   实时呼入电话接听
-   基于网络钩子的实时短信推送至智能体循环
-   对任意第三方双因素认证提供商的保证支持

这些功能需要比纯可选技能更多的基础架构。

## 注意事项

-   Twilio 试用账户和地区规则可能会限制您可呼叫/发送短信的对象。
-   某些服务会拒绝将 VoIP 号码用于双因素认证。
-   `twilio-inbox` 通过 REST API 轮询；并非即时推送。
-   Vapi 外呼仍然依赖于拥有一个有效的已导入号码。
-   Bland 最易使用，但音质并非总是最佳。
-   请勿将任意第三方电话号码存储在赫尔墨斯内存中。

## 验证清单

完成设置后，您应能仅通过此技能完成以下所有操作：

1.  `diagnose` 显示提供商准备状态和已记忆状态
2.  搜索并购买一个 Twilio 号码
3.  将该号码持久化到 `~/.hermes/.env`
4.  从拥有的号码发送短信
5.  稍后轮询该号码的接收短信
6.  进行直接 Twilio 通话
7.  通过 Bland 或 Vapi 进行 AI 通话

## 参考资料

-   Twilio 电话号码：https://www.twilio.com/docs/phone-numbers/api
-   Twilio 消息：https://www.twilio.com/docs/messaging/api/message-resource
-   Twilio 语音：https://www.twilio.com/docs/voice/api/call-resource
-   Vapi 文档：https://docs.vapi.ai/
-   Bland.ai：https://app.bland.ai/