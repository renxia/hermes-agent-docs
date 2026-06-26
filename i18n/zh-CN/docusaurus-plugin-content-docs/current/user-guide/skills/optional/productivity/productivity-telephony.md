title: "Telephony — Give Hermes phone capabilities without core tool changes"
sidebar_label: "Telephony"
description: "Give Hermes phone capabilities without core tool changes"
---

{/* 此页面由网站/脚本/generate-skill-docs.py 根据技能的SKILL.md自动生成。请编辑源文件SKILL.md，而不是此页面。*/}

# 电话功能

在不更改核心工具的情况下赋予 Hermes 手机能力。这包括配置和持久化 Twilio 号码、发送和接收短信/彩信（SMS/MMS）、拨打直接电话以及通过 Bland.ai 或 Vapi 进行 AI 驱动的呼出外拨。

## 技能元数据 (Skill metadata)

| | |
|---|---|
| 源 (Source) | 可选 — 使用 `hermes skills install official/productivity/telephony` 安装 |
| 路径 (Path) | `optional-skills/productivity/telephony` |
| 版本 (Version) | `1.0.0` |
| 作者 (Author) | Nous Research |
| 许可证 (License) | MIT |
| 平台 (Platforms) | linux, macos, windows |
| 标签 (Tags) | `telephony`, `phone`, `sms`, `mms`, `voice`, `twilio`, `bland.ai`, `vapi`, `calling`, `texting` |
| 相关技能 (Related skills) | [`maps`](/docs/user-guide/skills/bundled/productivity/productivity-maps), [`google-workspace`](/docs/user-guide/skills/bundled/productivity/productivity-google-workspace), [`agentmail`](/docs/user-guide/skills/optional/email/email-agentmail) |

## Key Paths & Config

```
~/.hermes/config.yaml       Main configuration
~/.hermes/.env              API keys and secrets (under $HERMES_HOME if set)
$HERMES_HOME
```

# 电话功能 — 数字、通话和文本（无需核心工具更改）

此可选技能在保持电话功能不属于核心工具列表的同时，为 Hermes 提供了实用的电话能力。

它附带有一个辅助脚本 `scripts/telephony.py`，该脚本可以：
- 将提供商凭证保存到 `${HERMES_HOME:-~/.hermes}/.env`
- 搜索并购买一个 Twilio 电话号码
- 记住拥有的号码以便后续会话使用
- 从拥有的号码发送短信/彩信 (SMS / MMS)
- 轮询该号码的入站短信，无需设置 Webhook 服务器
- 使用 TwiML `<Say>` 或 `<Play>` 进行直接 Twilio 通话
- 将拥有的 Twilio 号码导入 Vapi
- 通过 Bland.ai 或 Vapi 进行外呼 AI 通话

## 这解决了什么问题

此技能旨在解决用户实际需要的实用电话任务：
- 外呼通话
- 短信发送
- 拥有一个可重复使用的智能体号码
- 后续检查到达该号码的消息
- 在会话之间保留该号码及相关 ID
- 用于入站短信轮询和其他自动化的未来友好型电话身份

它**不会**将 Hermes 变成实时的入站电话网关。入站短信是通过轮询 Twilio REST API 来处理的。这对于许多工作流程（包括通知和部分一次性代码检索）来说已经足够，而无需添加核心 Webhook 基础设施。

## 安全规则 — 强制要求

1. 在拨打电话或发送文本之前，始终进行确认。
2. 绝不拨打紧急电话号码。
3. 绝不将电话功能用于骚扰、垃圾信息、冒充身份或任何非法活动。
4. 将第三方电话号码视为敏感操作数据：
   - 不应将其保存在 Hermes 内存中
   - 除非用户明确要求，否则不应将其包含在技能文档、摘要或后续笔记中
5. 可以持久化**智能体拥有的 Twilio 号码**，因为那是用户配置的一部分。
6. VoIP 号码**不能保证**适用于所有第三方的 2FA（双重身份验证）流程。请谨慎使用并清楚地设定用户期望。

## 决策树 — 使用哪个服务？

请使用此逻辑而不是硬编码的提供商路由：

### 1) “我希望 Hermes 拥有一个真实的电话号码”
使用 **Twilio**。

原因：
- 这是购买和保留号码的最简单途径
- 最好的 SMS / MMS 支持
- 最简单的入站短信轮询方案
- 最清晰的未来向入站 Webhook 或通话处理过渡路径

用例：
- 后续接收文本消息
- 发送部署警报/定时任务通知
- 为智能体维护一个可重复使用的电话身份
- 稍后实验基于电话的认证流程

### 2) “我现在只需要最简单的外呼 AI 通话”
使用 **Bland.ai**。

原因：
- 最快的设置
- 一个 API 密钥
- 无需先自己购买/导入号码

权衡：
- 灵活性较低
- 语音质量尚可，但不是最好的

### 3) “我想要最佳的对话式 AI 语音质量”
使用 **Twilio + Vapi**。

原因：
- Twilio 提供您拥有的号码
- Vapi 提供更好的对话式 AI 通话质量和更多的语音/模型灵活性

推荐流程：
1. 购买/保存一个 Twilio 号码
2. 将其导入 Vapi
3. 保存返回的 `VAPI_PHONE_NUMBER_ID`
4. 使用 `ai-call --provider vapi`

### 4) “我想要使用自定义预录音语音消息进行通话”
使用 **Twilio 直接通话** 并提供公共音频 URL。

原因：
- 这是播放自定义 MP3 最简单的方法
- 与 Hermes 的 `text_to_speech` 以及公共文件主机或隧道配合良好

## 文件和持久化状态

该技能在两个地方持久化电话状态：

### `${HERMES_HOME:-~/.hermes}/.env`
用于长期有效的提供商凭证和拥有的号码 ID，例如：
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_PHONE_NUMBER_SID`
- `BLAND_API_KEY`
- `VAPI_API_KEY`
- `VAPI_PHONE_NUMBER_ID`
- `PHONE_PROVIDER` (AI 通话提供商：bland 或 vapi)

### `~/.hermes/telephony_state.json`
用于技能专属状态，应在会话之间保持，例如：
- 记住的默认 Twilio 号码 / SID
- 记住的 Vapi 电话号码 ID
- 收件箱轮询检查点的最后一条入站消息 SID/日期

这意味着：
- 下次加载此技能时，`diagnose` 可以告诉您哪个号码已被配置
- `twilio-inbox --since-last --mark-seen` 可以从上一个检查点继续进行操作

## 定位辅助脚本

安装此技能后，请按以下方式定位该脚本：

```bash
SCRIPT="$(find ~/.hermes/skills -path '*/telephony/scripts/telephony.py' -print -quit)"
```

如果 `SCRIPT` 为空，则表示技能尚未安装。

## 安装

这是一个官方可选技能，因此请从 Skills Hub 中安装：

```bash
hermes skills search telephony
hermes skills install official/productivity/telephony
```

## 提供商设置

### Twilio — 拥有的号码、SMS/MMS、直接通话、入站短信轮询

注册地址：
- https://www.twilio.com/try-twilio

然后将凭证保存到 Hermes 中：

```bash
python3 "$SCRIPT" save-twilio ACXXXXXXXXXXXXXXXXXXXXXXXXXXXX your_auth_token_here
```

搜索可用的号码：

```bash
python3 "$SCRIPT" twilio-search --country US --area-code 702 --limit 5
```

购买并记住一个号码：

```bash
python3 "$SCRIPT" twilio-buy "+17025551234" --save-env
```

列出拥有的号码：

```bash
python3 "$SCRIPT" twilio-owned
```

稍后将其设置为默认值：

```bash
python3 "$SCRIPT" twilio-set-default "+17025551234" --save-env
# 或
python3 "$SCRIPT" twilio-set-default PNXXXXXXXXXXXXXXXXXXXXXXXXXXXX --save-env
```

### Bland.ai — 最简单的外呼 AI 通话

注册地址：
- https://app.bland.ai

保存配置：

```bash
python3 "$SCRIPT" save-bland your_bland_api_key --voice mason
```

### Vapi — 更好的对话式语音质量

注册地址：
- https://dashboard.vapi.ai

首先保存 API 密钥：

```bash
python3 "$SCRIPT" save-vapi your_vapi_api_key
```

将拥有的 Twilio 号码导入 Vapi 并持久化返回的电话号码 ID：

```bash
python3 "$SCRIPT" vapi-import-twilio --save-env
```

如果您已经知道 Vapi 电话号码 ID，请直接保存：

```bash
python3 "$SCRIPT" save-vapi your_vapi_api_key --phone-number-id vapi_phone_number_id_here
```

## 诊断当前状态

随时可以检查技能已知的状态信息：

```bash
python3 "$SCRIPT" diagnose
```

在后续会话中恢复工作时，请先使用此命令。

## 常见工作流程

### A. 购买一个智能体号码并在后续继续使用

1. 保存 Twilio 凭证：
```bash
python3 "$SCRIPT" save-twilio AC... auth_token_here
```

2. 搜索号码：
```bash
python3 "$SCRIPT" twilio-search --country US --area-code 702 --limit 10
```

3. 购买并将其保存到 `${HERMES_HOME:-~/.hermes}/.env` + 状态：
```bash
python3 "$SCRIPT" twilio-buy "+17025551234" --save-env
```

4. 下次会话，运行：
```bash
python3 "$SCRIPT" diagnose
```
这将显示已记住的默认号码和收件箱检查点状态。

### B. 从智能体号码发送文本

```bash
python3 "$SCRIPT" twilio-send-sms "+15551230000" "您的部署已成功完成。"
```

带媒体文件：

```bash
python3 "$SCRIPT" twilio-send-sms "+15551230000" "这是图表。" --media-url "https://example.com/chart.png"
```

### C. 后续检查入站文本（无需 Webhook 服务器）

轮询默认的 Twilio 号码收件箱：

```bash
python3 "$SCRIPT" twilio-inbox --limit 20
```

仅显示自上次检查点以来到达的消息，完成阅读后推进检查点：

```bash
python3 "$SCRIPT" twilio-inbox --since-last --mark-seen
```

这是回答“下次加载技能时如何获取该号码收到的消息？”的主要方法。

### D. 使用内置 TTS 进行直接 Twilio 通话

```bash
python3 "$SCRIPT" twilio-call "+15551230000" --message "您好！我是 Hermes，为您提供状态更新。" --voice Polly.Joanna
```

### E. 使用预录音/自定义语音消息进行通话

这是重用 Hermes 现有 `text_to_speech` 支持的主要路径。

在以下情况下使用：
- 您希望通话使用配置好的 Hermes TTS 语音而不是 Twilio `<Say>`
- 您需要单向语音交付（简报、警报、笑话、提醒、状态更新）
- 您**不需要**实时的对话式电话通话

单独生成或托管音频，然后：

```bash
python3 "$SCRIPT" twilio-call "+155****0000" --audio-url "https://example.com/briefing.mp3"
```

推荐的 Hermes TTS -> Twilio Play 工作流程：

1. 使用 Hermes `text_to_speech` 生成音频。
2. 使生成的 MP3 文件可公开访问。
3. 使用 `--audio-url` 进行 Twilio 通话。

示例智能体流程：
- 要求 Hermes 使用 `text_to_speech` 创建消息音频
- 如果需要，使用临时静态主机/隧道/对象存储 URL 公开暴露文件
- 使用 `twilio-call --audio-url ...` 通过电话交付

MP3 的良好托管选项：
- 临时的公共对象/存储 URL
- 短期的本地静态文件服务器隧道
- 任何电话提供商可以直接获取的现有 HTTPS URL

重要提示：
- Hermes TTS 非常适合预录音的外呼消息
- Bland/Vapi 更适合**实时的对话式 AI 通话**，因为它们自己处理实时电话音频堆栈
- 此处没有将 Hermes STT/TTS 作为完整的双工电话对话引擎来使用；那需要比此技能试图引入的更重的流媒体/Webhook 集成

### F. 使用 Twilio 直接通话导航电话树 / IVR

如果需要在呼叫连接后按下数字，请使用 `--send-digits`。
Twilio 将 `w` 解释为短暂停。

```bash
python3 "$SCRIPT" twilio-call "+18005551234" --message "正在连接账单部门。" --send-digits "ww1w2w3"
```

这对于在转接给人工或交付简短状态消息之前到达特定的菜单分支非常有用。

### G. 使用 Bland.ai 进行外呼 AI 通话

```bash
python3 "$SCRIPT" ai-call "+15551230000" "致电牙科诊所，预约周二下午的清洁服务，如果他们没有周二的空档，则询问周三或周四。" --provider bland --voice mason --max-duration 3
```

检查状态：

```bash
python3 "$SCRIPT" ai-status <call_id> --provider bland
```

通话完成后提问 Bland 分析问题：

```bash
python3 "$SCRIPT" ai-status <call_id> --provider bland --analyze "是否确认了预约？,日期和时间是什么？,是否有任何特殊说明？"
```

### H. 使用您拥有的号码进行 Vapi 外呼 AI 通话

1. 将您的 Twilio 号码导入 Vapi：
```bash
python3 "$SCRIPT" vapi-import-twilio --save-env
```

2. 进行通话：
```bash
python3 "$SCRIPT" ai-call "+15551230000" "您正在致电，为两人预订晚餐，时间是晚上 7:30。如果不可用，请询问下午 6:30 到 8:30 之间的最近时间。" --provider vapi --max-duration 4
```

3. 检查结果：
```bash
python3 "$SCRIPT" ai-status <call_id> --provider vapi
```

## 智能体流程建议

当用户请求进行通话或发送文本时：

1. 通过决策树确定合适的路径。
2. 如果配置状态不明确，则运行 `diagnose`。
3. 收集完整的任务细节。
4. 在拨号或发送文本之前与用户确认。
5. 使用正确的命令。
6. 如有需要，进行轮询以获取结果。
7. 总结结果，但不要将第三方号码持久化到 Hermes 内存中。

## 此技能仍未实现的功能

- 实时入站呼叫应答
- 基于 webhook 的即时 SMS 推送至智能体循环
- 对任意第三方 2FA 提供商的保证支持

这些功能需要比纯可选技能更多的基础设施。

## 潜在问题 (Pitfalls)

- Twilio 试用账户和区域规则可能会限制您可以拨打/发送文本的对象。
- 一些服务会拒绝 VoIP 号码用于 2FA。
- `twilio-inbox` 会轮询 REST API；它不是即时推送交付。
- Vapi 的外呼功能仍然取决于是否有有效的导入号码。
- Bland 最简单，但并非总是声音效果最好。
- 不要将任意第三方电话号码存储在 Hermes 内存中。

## 验证清单 (Verification checklist)

设置完成后，仅凭此技能您应该能够做到以下所有事情：

1. `diagnose` 显示提供商的就绪状态和已记住的状态
2. 搜索并购买一个 Twilio 号码
3. 将该号码持久化到 `${HERMES_HOME:-~/.hermes}/.env`
4. 从拥有的号码发送 SMS
5. 稍后轮询针对拥有的号码收到的文本信息
6. 进行一次直接的 Twilio 通话
7. 通过 Bland 或 Vapi 进行一次 AI 通话

## 参考资料 (References)

- Twilio 电话号码：https://www.twilio.com/docs/phone-numbers/api
- Twilio 消息传递：https://www.twilio.com/docs/messaging/api/message-resource
- Twilio 语音：https://www.twilio.com/docs/voice/api/call-resource
- Vapi 文档：https://docs.vapi.ai/
- Bland.ai：https://app.bland.ai/