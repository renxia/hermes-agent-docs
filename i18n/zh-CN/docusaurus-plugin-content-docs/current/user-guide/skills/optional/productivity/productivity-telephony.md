---
title: "电话功能 — 在不更改核心工具的情况下为 Hermes 赋予电话能力"
sidebar_label: "电话功能"
description: "在不更改核心工具的情况下为 Hermes 赋予电话能力"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# 电话功能

在不更改核心工具的情况下为 Hermes 赋予电话能力。配置并持久化一个 Twilio 号码，发送和接收短信/彩信，进行直接通话，并通过 Bland.ai 或 Vapi 进行 AI 驱动的呼出电话。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/productivity/telephony` 安装 |
| 路径 | `optional-skills/productivity/telephony` |
| 版本 | `1.0.0` |
| 作者 | Nous Research |
| 许可证 | MIT |
| 标签 | `telephony`, `phone`, `sms`, `mms`, `voice`, `twilio`, `bland.ai`, `vapi`, `calling`, `texting` |
| 相关技能 | [`maps`](/docs/user-guide/skills/bundled/productivity/productivity-maps), [`google-workspace`](/docs/user-guide/skills/bundled/productivity/productivity-google-workspace), [`agentmail`](/docs/user-guide/skills/optional/email/email-agentmail) |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时 Hermes 加载的完整技能定义。这是当技能处于活动状态时智能体所看到的指令。
:::

# 电话功能 — 无需核心工具变更即可实现号码、通话和短信功能

此可选技能为 Hermes 提供实用的电话功能，同时将电话功能排除在核心工具列表之外。

它附带一个辅助脚本 `scripts/telephony.py`，可以：
- 将服务提供商凭据保存到 `~/.hermes/.env`
- 搜索并购买 Twilio 电话号码
- 记住所拥有的号码以便后续会话使用
- 从所拥有的号码发送短信（SMS）/彩信（MMS）
- 无需 Webhook 服务器即可轮询该号码的入站短信
- 使用 TwiML `<Say>` 或 `<Play>` 进行直接 Twilio 通话
- 将所拥有的 Twilio 号码导入 Vapi
- 通过 Bland.ai 或 Vapi 进行外呼 AI 通话

## 此技能解决的问题

此技能旨在满足用户实际需要的电话任务：
- 外呼通话
- 发送短信
- 拥有一个可重复使用的智能体号码
- 稍后检查发送到该号码的消息
- 在会话之间保留该号码及相关 ID
- 为入站短信轮询和其他自动化操作提供面向未来的电话身份

它**不会**将 Hermes 变成实时入站电话网关。入站短信通过轮询 Twilio REST API 处理。这对于许多工作流（包括通知和某些一次性验证码获取）已经足够，而无需添加核心 Webhook 基础设施。

## 安全规则 — 强制要求

1. 在拨打电话或发送短信之前，务必进行确认。
2. 切勿拨打紧急号码。
3. 切勿将电话功能用于骚扰、垃圾邮件、冒充或任何非法活动。
4. 将第三方电话号码视为敏感的操作数据：
   - 不要将其保存到 Hermes 内存中
   - 除非用户明确要求，否则不要将其包含在技能文档、摘要或后续笔记中
5. 可以保留**智能体拥有的 Twilio 号码**，因为这是用户配置的一部分。
6. VoIP 号码**不能保证**适用于所有第三方双因素认证（2FA）流程。请谨慎使用，并明确告知用户相关限制。

## 决策树 — 应使用哪个服务？

请使用此逻辑，而非硬编码的服务提供商路由：

### 1) “我希望 Hermes 拥有一个真实的电话号码”
使用 **Twilio**。

原因：
- 购买和保留号码的最简单路径
- 最佳的短信/彩信支持
- 最简单的入站短信轮询方案
- 面向未来的入站 Webhook 或通话处理的最清晰路径

使用场景：
- 稍后接收短信
- 发送部署警报/定时任务通知
- 为智能体维护一个可重复使用的电话身份
- 稍后试验基于电话的身份验证流程

### 2) “我现在只需要最简单的外呼 AI 电话”
使用 **Bland.ai**。

原因：
- 设置最快
- 仅需一个 API 密钥
- 无需先自行购买/导入号码

权衡：
- 灵活性较低
- 语音质量尚可，但并非最佳

### 3) “我希望获得最佳的对话式 AI 语音质量”
使用 **Twilio + Vapi**。

原因：
- Twilio 提供您所拥有的号码
- Vapi 提供更好的对话式 AI 通话质量和更多语音/模型灵活性

推荐流程：
1. 购买/保存一个 Twilio 号码
2. 将其导入 Vapi
3. 保存返回的 `VAPI_PHONE_NUMBER_ID`
4. 使用 `ai-call --provider vapi`

### 4) “我想用自定义的预录语音消息拨打电话”
使用 **Twilio 直接通话**并配合一个公开音频 URL。

原因：
- 播放自定义 MP3 的最简单方法
- 与 Hermes 的 `text_to_speech` 以及公共文件托管或隧道服务配合良好

## 文件和持久化状态

该技能在两个位置持久化电话状态：

### `~/.hermes/.env`
用于长期保存的服务提供商凭据和所拥有号码的 ID，例如：
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_PHONE_NUMBER_SID`
- `BLAND_API_KEY`
- `VAPI_API_KEY`
- `VAPI_PHONE_NUMBER_ID`
- `PHONE_PROVIDER` (AI 通话服务提供商：bland 或 vapi)

### `~/.hermes/telephony_state.json`
用于仅在技能内部使用的、应在会话间保留的状态，例如：
- 记住的默认 Twilio 号码 / SID
- 记住的 Vapi 电话号码 ID
- 用于收件箱轮询检查点的最后一条入站消息的 SID/日期

这意味着：
- 下次加载该技能时，`diagnose` 可以告诉您已配置了哪个号码
- `twilio-inbox --since-last --mark-seen` 可以从上一个检查点继续

## 定位辅助脚本

安装此技能后，请按如下方式定位脚本：

```bash
SCRIPT="$(find ~/.hermes/skills -path '*/telephony/scripts/telephony.py' -print -quit)"
```

如果 `SCRIPT` 为空，则表示该技能尚未安装。

## 安装

这是一个官方的可选技能，请从技能中心安装：

```bash
hermes skills search telephony
hermes skills install official/productivity/telephony
```

## 服务提供商设置

### Twilio — 拥有号码、短信/彩信、直接通话、入站短信轮询

注册：
- https://www.twilio.com/try-twilio

然后将凭据保存到 Hermes：

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

列出所拥有的号码：

```bash
python3 "$SCRIPT" twilio-owned
```

稍后将其中的一个设为默认号码：

```bash
python3 "$SCRIPT" twilio-set-default "+17025551234" --save-env
# 或
python3 "$SCRIPT" twilio-set-default PNXXXXXXXXXXXXXXXXXXXXXXXXXXXX --save-env
```

### Bland.ai — 最简单的外呼 AI 通话

注册：
- https://app.bland.ai

保存配置：

```bash
python3 "$SCRIPT" save-bland your_bland_api_key --voice mason
```

### Vapi — 更好的对话式语音质量

注册：
- https://dashboard.vapi.ai

首先保存 API 密钥：

```bash
python3 "$SCRIPT" save-vapi your_vapi_api_key
```

将您拥有的 Twilio 号码导入 Vapi 并持久化返回的电话号码 ID：

```bash
python3 "$SCRIPT" vapi-import-twilio --save-env
```

如果您已经知道 Vapi 电话号码 ID，请直接保存它：

```bash
python3 "$SCRIPT" save-vapi your_vapi_api_key --phone-number-id vapi_phone_number_id_here
```

## 诊断当前状态

随时检查该技能已知的信息：

```bash
python3 "$SCRIPT" diagnose
```

在稍后恢复工作时，请首先使用此命令。

## 常见工作流

### A. 购买一个智能体号码并在以后继续使用

1. 保存 Twilio 凭据：
```bash
python3 "$SCRIPT" save-twilio AC... auth_token_here
```

2. 搜索号码：
```bash
python3 "$SCRIPT" twilio-search --country US --area-code 702 --limit 10
```

3. 购买并将其保存到 `~/.hermes/.env` + 状态：
```bash
python3 "$SCRIPT" twilio-buy "+17025551234" --save-env
```

4. 在下一个会话中，运行：
```bash
python3 "$SCRIPT" diagnose
```
这将显示记住的默认号码和收件箱检查点状态。

### B. 从智能体号码发送短信

```bash
python3 "$SCRIPT" twilio-send-sms "+15551230000" "您的部署已成功完成。"
```

附带媒体：

```bash
python3 "$SCRIPT" twilio-send-sms "+15551230000" "这是图表。" --media-url "https://example.com/chart.png"
```

### C. 稍后检查入站短信（无需 Webhook 服务器）

轮询默认 Twilio 号码的收件箱：

```bash
python3 "$SCRIPT" twilio-inbox --limit 20
```

仅显示自上次检查点以来到达的消息，并在阅读完毕后推进检查点：

```bash
python3 "$SCRIPT" twilio-inbox --since-last --mark-seen
```

这是对“下次加载该技能时，我如何访问该号码收到的消息？”这一问题的主要答案。

### D. 使用内置 TTS 进行直接 Twilio 通话

```bash
python3 "$SCRIPT" twilio-call "+15551230000" --message "您好！这是 Hermes 致电，为您带来状态更新。" --voice Polly.Joanna
```

### E. 使用预录/自定义语音消息拨打电话

这是重用 Hermes 现有 `text_to_speech` 支持的主要路径。

在以下情况下使用此方法：
- 您希望通话使用 Hermes 配置的 TTS 语音，而非 Twilio `<Say>`
- 您希望进行单向语音传递（简报、警报、笑话、提醒、状态更新）
- 您**不需要**实时对话式电话通话

请单独生成或托管音频，然后：

```bash
python3 "$SCRIPT" twilio-call "+155****0000" --audio-url "https://example.com/briefing.mp3"
```

推荐的 Hermes TTS -> Twilio Play 工作流：

1. 使用 Hermes `text_to_speech` 生成音频。
2. 使生成的 MP3 可公开访问。
3. 使用 `--audio-url` 进行 Twilio 通话以传递音频。

智能体流程示例：
- 要求 Hermes 使用 `text_to_speech` 创建消息音频
- 如果需要，使用临时静态主机/隧道/对象存储 URL 公开该文件
- 使用 `twilio-call --audio-url ...` 通过电话传递它

MP3 的良好托管选项：
- 临时的公共对象/存储 URL
- 到本地静态文件服务器的短期隧道
- 电话服务提供商可以直接获取的任何现有 HTTPS URL

重要提示：
- Hermes TTS 非常适合预录的外呼消息
- Bland/Vapi 更适合**实时对话式 AI 通话**，因为它们自己处理实时电话音频堆栈
- 此处并未单独使用 Hermes STT/TTS 作为全双工电话会话引擎；这将需要比此技能试图引入的更重的流式传输/Webhook 集成

### F. 使用 Twilio 直接通话导航电话树 / IVR

如果您需要在通话连接后按键，请使用 `--send-digits`。
Twilio 将 `w` 解释为短暂等待。

```bash
python3 "$SCRIPT" twilio-call "+18005551234" --message "正在连接到计费部门。" --send-digits "ww1w2w3"
```

这对于在转接给人工或传递简短状态消息之前到达特定菜单分支非常有用。

### G. 使用 Bland.ai 进行外呼 AI 电话通话

```bash
python3 "$SCRIPT" ai-call "+15551230000" "致电牙科诊所，要求在周二下午进行清洁预约，如果他们周二没有空位，则要求周三或周四。" --provider bland --voice mason --max-duration 3
```

检查状态：

```bash
python3 "$SCRIPT" ai-status <call_id> --provider bland
```

完成后询问 Bland 分析问题：

```bash
python3 "$SCRIPT" ai-status <call_id> --provider bland --analyze "预约是否已确认？,日期和时间是什么？,有任何特殊说明吗？"
```

### H. 使用 Vapi 在您拥有的号码上进行外呼 AI 电话通话

1. 将您的 Twilio 号码导入 Vapi：
```bash
python3 "$SCRIPT" vapi-import-twilio --save-env
```

2. 拨打电话：
```bash
python3 "$SCRIPT" ai-call "+15551230000" "您致电是为了预订晚上 7:30 的两人晚餐。如果该时间不可用，请要求 6:30 至 8:30 之间最接近的时间。" --provider vapi --max-duration 4
```

3. 检查结果：
```bash
python3 "$SCRIPT" ai-status <call_id> --provider vapi
```

## 建议的智能体操作流程

当用户请求拨打电话或发送短信时：

1. 通过决策树确定符合请求的路径。
2. 如果配置状态不明确，请运行 `diagnose`。
3. 收集完整的任务详情。
4. 在拨号或发短信前与用户确认。
5. 使用正确的命令。
6. 如有需要，轮询结果。
7. 总结结果，但不要将第三方号码保存到 Hermes 记忆中。

## 此技能尚不具备的功能

- 实时接听来电
- 基于 webhook 的实时短信推送到智能体循环中
- 保证支持任意第三方双因素认证（2FA）提供商

这些功能需要比纯可选技能更多的基础设施支持。

## 注意事项

- Twilio 试用账户和地区规则可能会限制您可以拨打/发送短信的对象。
- 某些服务会拒绝 VoIP 号码用于双因素认证（2FA）。
- `twilio-inbox` 轮询 REST API，并非即时推送。
- Vapi 外呼仍依赖于拥有一个有效的已导入号码。
- Bland 最简单，但音质并非总是最佳。
- 请勿将任意第三方电话号码保存到 Hermes 记忆中。

## 验证清单

设置完成后，您应能仅使用此技能完成以下所有操作：

1. `diagnose` 显示提供商就绪状态和已记住的状态
2. 搜索并购买 Twilio 号码
3. 将该号码保存到 `~/.hermes/.env`
4. 从自有号码发送短信
5. 稍后轮询自有号码的接收短信
6. 发起直接 Twilio 呼叫
7. 通过 Bland 或 Vapi 发起 AI 呼叫

## 参考资料

- Twilio 电话号码：https://www.twilio.com/docs/phone-numbers/api
- Twilio 消息服务：https://www.twilio.com/docs/messaging/api/message-resource
- Twilio 语音服务：https://www.twilio.com/docs/voice/api/call-resource
- Vapi 文档：https://docs.vapi.ai/
- Bland.ai：https://app.bland.ai/