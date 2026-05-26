---
title: "电话功能 — 赋予 Hermes 电话能力，无需修改核心工具"
sidebar_label: "电话功能"
description: "赋予 Hermes 电话能力，无需修改核心工具"
---

{/* 本页面由网站脚本 generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 电话功能

赋予 Hermes 电话能力，无需修改核心工具。配置并持久化一个 Twilio 号码，收发短信/彩信，进行直接通话，以及通过 Bland.ai 或 Vapi 发起由人工智能驱动的外呼电话。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/productivity/telephony` 安装 |
| 路径 | `optional-skills/productivity/telephony` |
| 版本 | `1.0.0` |
| 作者 | Nous Research |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `telephony`, `phone`, `sms`, `mms`, `voice`, `twilio`, `bland.ai`, `vapi`, `calling`, `texting` |
| 相关技能 | [`地图`](/user-guide/skills/bundled/productivity/productivity-maps), [`谷歌工作空间`](/user-guide/skills/bundled/productivity/productivity-google-workspace), [`智能体邮箱`](/user-guide/skills/optional/email/email-agentmail) |

:::info
以下是此技能被触发时 Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# 电话功能 — 无需更改核心工具即可管理号码、通话和短信

这个可选技能为 Hermes 提供实用的电话功能，同时将电话模块排除在核心工具列表之外。

它附带一个辅助脚本 `scripts/telephony.py`，可以：
- 将服务提供商凭证保存到 `~/.hermes/.env`
- 搜索并购买 Twilio 电话号码
- 为后续会话记住已拥有的号码
- 使用已拥有的号码发送 SMS / MMS
- 无需 webhook 服务器即可轮询该号码的来电 SMS
- 使用 TwiML `<Say>` 或 `<Play>` 进行直接 Twilio 通话
- 将已拥有的 Twilio 号码导入 Vapi
- 通过 Bland.ai 或 Vapi 发起外呼 AI 电话

## 此技能解决的问题

此技能旨在覆盖用户实际需要的实用电话任务：
- 外呼电话
- 发送短信
- 拥有一个可重复使用的智能体号码
- 稍后检查该号码收到的消息
- 在会话之间保留该号码和相关 ID
- 为来电 SMS 轮询及其他自动化功能提供面向未来的电话身份标识

它**不会**将 Hermes 变成实时来电电话网关。来电 SMS 通过轮询 Twilio REST API 来处理。这足以满足许多工作流程，包括通知和某些一次性验证码检索，而无需添加核心 webhook 基础设施。

## 安全规则 — 强制性

1. 在拨打电话或发送短信前，始终需要确认。
2. 切勿拨打紧急电话号码。
3. 切勿将电话功能用于骚扰、垃圾信息、冒充或任何非法行为。
4. 将第三方电话号码视为敏感操作数据：
   - 不要将它们保存到 Hermes 记忆中
   - 除非用户明确要求，否则不要将它们包含在技能文档、摘要或后续说明中
5. 持久化**智能体拥有的 Twilio 号码**是可以的，因为这是用户配置的一部分。
6. VoIP 号码**不能保证**适用于所有第三方双因素认证流程。请谨慎使用，并向用户明确说明预期情况。

## 决策树 — 使用哪种服务？

使用此逻辑而非硬编码的提供商路由：

### 1) “我希望 Hermes 拥有一个真实的电话号码”
使用 **Twilio**。

原因：
- 购买和保留号码的最简单途径
- 最佳的 SMS / MMS 支持
- 最简单的来电 SMS 轮询方案
- 通往来电 webhook 或呼叫处理的最清晰的未来路径

用例：
- 稍后接收短信
- 发送部署警报 / 定时通知
- 为智能体维护一个可重复使用的电话身份
- 稍后试验基于电话的身份验证流程

### 2) “我现在只需要最简单的外呼 AI 电话”
使用 **Bland.ai**。

原因：
- 设置最快
- 一个 API 密钥
- 无需首先自行购买/导入号码

权衡：
- 灵活性较低
- 语音质量尚可，但并非最佳

### 3) “我想要最佳的对话式 AI 语音质量”
使用 **Twilio + Vapi**。

原因：
- Twilio 提供您拥有的号码
- Vapi 提供更好的对话式 AI 通话质量以及更多的语音/模型灵活性

推荐流程：
1. 购买/保存一个 Twilio 号码
2. 将其导入 Vapi
3. 保存返回的 `VAPI_PHONE_NUMBER_ID`
4. 使用 `ai-call --provider vapi`

### 4) “我想用自定义的预录语音消息进行呼叫”
使用 **Twilio 直接通话**，配合一个公开的音频 URL。

原因：
- 播放自定义 MP3 的最简单方法
- 与 Hermes 的 `text_to_speech` 以及公共文件托管或隧道服务配合良好

## 文件和持久化状态

此技能在两个地方持久化电话状态：

### `~/.hermes/.env`
用于长期保存的服务提供商凭证和已拥有的号码 ID，例如：
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_PHONE_NUMBER_SID`
- `BLAND_API_KEY`
- `VAPI_API_KEY`
- `VAPI_PHONE_NUMBER_ID`
- `PHONE_PROVIDER` (AI 通话提供商：bland 或 vapi)

### `~/.hermes/telephony_state.json`
用于仅限技能的状态，这些状态应在会话间保持，例如：
- 记住的默认 Twilio 号码 / SID
- 记住的 Vapi 电话号码 ID
- 用于收件箱轮询检查点的最后来电消息 SID/日期

这意味着：
- 下次加载技能时，`diagnose` 可以告诉您已配置了哪个号码
- `twilio-inbox --since-last --mark-seen` 可以从上一个检查点继续

## 定位辅助脚本

安装此技能后，请按如下方式定位脚本：

```bash
SCRIPT="$(find ~/.hermes/skills -path '*/telephony/scripts/telephony.py' -print -quit)"
```

如果 `SCRIPT` 为空，则表示技能尚未安装。

## 安装

这是一个官方可选技能，因此请从技能中心安装它：

```bash
hermes skills search telephony
hermes skills install official/productivity/telephony
```

## 提供商设置

### Twilio — 拥有的号码、SMS/MMS、直接通话、来电 SMS 轮询

在此注册：
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

### Bland.ai — 最简单的外呼 AI 通话

在此注册：
- https://app.bland.ai

保存配置：

```bash
python3 "$SCRIPT" save-bland your_bland_api_key --voice mason
```

### Vapi — 更好的对话式语音质量

在此注册：
- https://dashboard.vapi.ai

首先保存 API 密钥：

```bash
python3 "$SCRIPT" save-vapi your_vapi_api_key
```

将您拥有的 Twilio 号码导入 Vapi 并持久化返回的电话号码 ID：

```bash
python3 "$SCRIPT" vapi-import-twilio --save-env
```

如果您已经知道 Vapi 电话号码 ID，可以直接保存：

```bash
python3 "$SCRIPT" save-vapi your_vapi_api_key --phone-number-id vapi_phone_number_id_here
```

## 诊断当前状态

随时检查技能已知的信息：

```bash
python3 "$SCRIPT" diagnose
```

在后续会话中恢复工作时，请首先运行此命令。

## 常见工作流程

### A. 购买一个智能体号码并稍后继续使用

1. 保存 Twilio 凭证：
```bash
python3 "$SCRIPT" save-twilio AC... auth_token_here
```

2. 搜索一个号码：
```bash
python3 "$SCRIPT" twilio-search --country US --area-code 702 --limit 10
```

3. 购买它并将其保存到 `~/.hermes/.env` + 状态：
```bash
python3 "$SCRIPT" twilio-buy "+17025551234" --save-env
```

4. 下次会话时，运行：
```bash
python3 "$SCRIPT" diagnose
```
这会显示记住的默认号码和收件箱检查点状态。

### B. 从智能体号码发送短信

```bash
python3 "$SCRIPT" twilio-send-sms "+15551230000" "您的部署已成功完成。"
```

包含媒体文件：

```bash
python3 "$SCRIPT" twilio-send-sms "+15551230000" "这是图表。" --media-url "https://example.com/chart.png"
```

### C. 稍后检查来电短信，无需 webhook 服务器

轮询默认 Twilio 号码的收件箱：

```bash
python3 "$SCRIPT" twilio-inbox --limit 20
```

仅显示在上次检查点之后到达的消息，并在阅读完成后推进检查点：

```bash
python3 "$SCRIPT" twilio-inbox --since-last --mark-seen
```

这是“下次加载技能时如何访问该号码收到的消息？”的主要答案。

### D. 使用内置 TTS 进行直接 Twilio 通话

```bash
python3 "$SCRIPT" twilio-call "+15551230000" --message "您好！这是 Hermes 打来的电话，向您提供状态更新。" --voice Polly.Joanna
```

### E. 使用预录/自定义语音消息进行通话

这是重用 Hermes 现有 `text_to_speech` 支持的主要途径。

在以下情况下使用：
- 您希望通话使用 Hermes 配置的 TTS 语音，而不是 Twilio `<Say>`
- 您需要单向语音播报（简报、警报、笑话、提醒、状态更新）
- 您**不**需要实时对话式电话

单独生成或托管音频，然后：

```bash
python3 "$SCRIPT" twilio-call "+155****0000" --audio-url "https://example.com/briefing.mp3"
```

推荐的 Hermes TTS -> Twilio Play 工作流程：

1. 使用 Hermes `text_to_speech` 生成音频。
2. 使生成的 MP3 可公开访问。
3. 使用 `--audio-url` 发起 Twilio 通话。

示例智能体流程：
- 让 Hermes 使用 `text_to_speech` 创建消息音频
- 如果需要，使用临时静态主机/隧道/对象存储 URL 公开该文件
- 使用 `twilio-call --audio-url ...` 通过电话传递它

MP3 的良好托管选项：
- 临时的公共对象/存储 URL
- 到本地静态文件服务器的短期隧道
- 电话提供商可以直接获取的任何现有 HTTPS URL

重要说明：
- Hermes TTS 非常适合预录的外呼消息
- Bland/Vapi 更适合**实时对话式 AI 通话**，因为它们自行处理实时电话音频堆栈
- 此处并非将 Hermes STT/TTS 用作全双工电话对话引擎；那需要比此技能试图引入的流媒体/webhook 集成更重的基础设施

### F. 使用 Twilio 直接呼叫导航电话菜单/IVR

如果您需要在呼叫连接后按数字，请使用 `--send-digits`。
Twilio 将 `w` 解释为短暂等待。

```bash
python3 "$SCRIPT" twilio-call "+18005551234" --message "正在为您转接至账单部门。" --send-digits "ww1w2w3"
```

这在转接给人工或传递简短状态消息之前，用于到达特定菜单分支非常有用。

### G. 使用 Bland.ai 进行外呼 AI 电话

```bash
python3 "$SCRIPT" ai-call "+15551230000" "打电话给牙科诊所，询问周二下午的洗牙预约，如果他们周二没空，询问周三或周四是否有空。" --provider bland --voice mason --max-duration 3
```

检查状态：

```bash
python3 "$SCRIPT" ai-status <call_id> --provider bland
```

完成后向 Bland 询问分析问题：

```bash
python3 "$SCRIPT" ai-status <call_id> --provider bland --analyze "预约是否已确认？具体日期和时间？有任何特殊说明吗？"
```

### H. 使用您拥有的号码通过 Vapi 进行外呼 AI 电话

1. 将您的 Twilio 号码导入 Vapi：
```bash
python3 "$SCRIPT" vapi-import-twilio --save-env
```

2. 发起通话：
```bash
python3 "$SCRIPT" ai-call "+15551230000" "您要预订晚餐，时间为晚上7点30分，人数为两人。如果该时间不可用，请询问6点30分到8点30分之间最近的可用时间。" --provider vapi --max-duration 4
```

3. 检查结果：
```bash
python3 "$SCRIPT" ai-status <call_id> --provider vapi
```

## 建议的智能体操作流程

当用户请求通话或短信时：

1. 通过决策树确定适合的请求路径。
2. 如果配置状态不明确，则运行 `diagnose`。
3. 收集完整的任务细节。
4. 在拨打电话或发送短信前与用户确认。
5. 使用正确的命令。
6. 如有需要，轮询等待结果。
7. 总结结果，但不将第三方号码持久化保存到 Hermes 记忆中。

## 此技能目前尚不具备的功能

- 实时来电接听
- 基于 webhook 的实时短信推送进入智能体循环
- 对任意第三方 2FA 提供商的保证支持

这些功能需要比纯可选技能更多的基础设施。

## 注意事项

- Twilio 试用账户和区域规则可能会限制您可以呼叫/短信的对象。
- 某些服务会拒绝将 VoIP 号码用于 2FA。
- `twilio-inbox` 通过轮询 REST API 工作，并非即时推送。
- Vapi 外呼通话仍依赖于拥有一个已导入的有效号码。
- Bland 最简单，但音质不总是最佳。
- 请勿将任意第三方电话号码存储在 Hermes 记忆中。

## 验证清单

设置完成后，您应能仅凭此技能完成以下所有操作：

1.  `diagnose` 显示提供商就绪状态和已记住的状态
2.  搜索并购买一个 Twilio 号码
3.  将该号码持久化保存到 `~/.hermes/.env`
4.  从自有号码发送短信
5.  稍后轮询该自有号码的入站短信
6.  通过 Twilio 直接拨打电话
7.  通过 Bland 或 Vapi 进行 AI 通话

## 参考资料

- Twilio 电话号码：https://www.twilio.com/docs/phone-numbers/api
- Twilio 短信：https://www.twilio.com/docs/messaging/api/message-resource
- Twilio 语音：https://www.twilio.com/docs/voice/api/call-resource
- Vapi 文档：https://docs.vapi.ai/
- Bland.ai：https://app.bland.ai/