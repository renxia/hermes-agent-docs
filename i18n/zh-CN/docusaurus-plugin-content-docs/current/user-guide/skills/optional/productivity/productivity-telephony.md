---
title: "电话功能——无需修改核心工具即可赋予Hermes电话能力"
sidebar_label: "电话功能"
description: "无需修改核心工具即可赋予Hermes电话能力"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# 电话功能

无需修改核心工具即可赋予Hermes电话能力。配置并持久化一个Twilio号码，发送和接收短信/彩信，进行直接通话，并通过Bland.ai或Vapi发起AI驱动的外呼电话。

## 技能元数据

| | |
|---|---|
| 来源 | 可选——使用 `hermes skills install official/productivity/telephony` 安装 |
| 路径 | `optional-skills/productivity/telephony` |
| 版本 | `1.0.0` |
| 作者 | Nous Research |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `电话`, `电话`, `短信`, `彩信`, `语音`, `twilio`, `bland.ai`, `vapi`, `通话`, `短信发送` |
| 相关技能 | [`maps`](/docs/user-guide/skills/bundled/productivity/productivity-maps), [`google-workspace`](/docs/user-guide/skills/bundled/productivity/productivity-google-workspace), [`agentmail`](/docs/user-guide/skills/optional/email/email-agentmail) |

:::info
以下是Hermes在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令内容。
:::

# 电话通信 — 无需更改核心工具即可实现的号码、通话和短信功能

这个可选技能为Hermes提供了实用的电话功能，同时将电话通信排除在核心工具列表之外。

它附带一个辅助脚本`scripts/telephony.py`，可以：
- 将服务提供商凭证保存到`~/.hermes/.env`
- 搜索并购买Twilio电话号码
- 记住拥有的号码以供后续会话使用
- 使用拥有的号码发送短信/彩信
- 通过轮询（无需Webhook服务器）来获取该号码的入站短信
- 使用TwiML `<Say>` 或 `<Play>` 进行直接Twilio通话
- 将拥有的Twilio号码导入Vapi
- 通过Bland.ai或Vapi发起出站AI通话

## 本技能解决的问题

本技能旨在覆盖用户实际需要的实用电话任务：
- 出站通话
- 发送短信
- 拥有一个可重用的智能体号码
- 稍后检查发送到该号码的消息
- 在会话间保留该号码和相关ID
- 为入站短信轮询和其他自动化操作提供面向未来的电话身份标识

它 **不会** 将Hermes变成一个实时的入站电话网关。入站短信通过轮询Twilio REST API来处理。对于许多工作流（包括通知和一些一次性验证码检索）来说，这已经足够，而无需添加核心的Webhook基础设施。

## 安全规则 — 强制性

1.  拨打电话或发送短信前，必须进行确认。
2.  切勿拨打紧急电话号码。
3.  切勿将电话用于骚扰、垃圾信息、冒充身份或任何非法活动。
4.  将第三方电话号码视为敏感的操作数据：
    -   不要将它们保存到Hermes的内存中
    -   除非用户明确要求，否则不要将它们包含在技能文档、摘要或后续笔记中
5.  可以持久化 **智能体拥有的Twilio号码**，因为这是用户配置的一部分。
6.  VoIP号码 **不能保证** 在所有第三方双因素认证（2FA）流程中都有效。请谨慎使用，并清晰地设置用户的期望。

## 决策树 — 应该使用哪个服务？

请使用此逻辑，而不是硬编码的服务提供商路由：

### 1）“我希望Hermes拥有一个真实的电话号码”
请使用 **Twilio**。

原因：
- 购买并保留号码的最简单途径
- 最佳的短信/彩信支持
- 最简单的入站短信轮询方案
- 最清晰的未来入站Webhook或通话处理路径

用例：
- 稍后接收短信
- 发送部署提醒/定时通知
- 为智能体维护一个可重用的电话身份
- 稍后试验基于电话的身份验证流程

### 2）“我现在只需要最简单的出站AI电话通话”
请使用 **Bland.ai**。

原因：
- 最快的设置速度
- 只需一个API密钥
- 无需自己先购买/导入一个号码

权衡：
- 灵活性较低
- 语音质量尚可，但并非最佳

### 3）“我想要最好的对话式AI语音质量”
请使用 **Twilio + Vapi**。

原因：
- Twilio为你提供拥有的号码
- Vapi为你提供更好的对话式AI通话质量和更多的语音/模型灵活性

推荐流程：
1.  购买/保存一个Twilio号码
2.  将其导入Vapi
3.  保存返回的`VAPI_PHONE_NUMBER_ID`
4.  使用 `ai-call --provider vapi`

### 4）“我想用自定义的预录制语音消息进行通话”
请使用 **Twilio直接通话** 并附上一个公开的音频URL。

原因：
- 播放自定义MP3的最简单方法
- 与Hermes的`text_to_speech`以及公共文件托管或隧道服务配合良好

## 文件与持久化状态

此技能在两个地方持久化电话通信状态：

### `~/.hermes/.env`
用于长期有效的服务提供商凭证和拥有的号码ID，例如：
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_PHONE_NUMBER_SID`
- `BLAND_API_KEY`
- `VAPI_API_KEY`
- `VAPI_PHONE_NUMBER_ID`
- `PHONE_PROVIDER` (AI通话提供商: bland 或 vapi)

### `~/.hermes/telephony_state.json`
用于仅限此技能的状态，这些状态应在会话间保持，例如：
- 记住的默认Twilio号码/SID
- 记住的Vapi电话号码ID
- 用于收件箱轮询检查点的最后一条入站消息SID/日期

这意味着：
-   下次加载技能时，`diagnose` 可以告诉你已配置了什么号码
-   `twilio-inbox --since-last --mark-seen` 可以从上一个检查点继续

## 定位辅助脚本

安装此技能后，按如下方式定位脚本：

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

## 服务提供商设置

### Twilio — 拥有的号码、短信/彩信、直接通话、入站短信轮询

在此注册：
- https://www.twilio.com/try-twilio

然后将凭证保存到Hermes：

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

列出拥有的号码：

```bash
python3 "$SCRIPT" twilio-owned
```

稍后将其中一个设置为默认：

```bash
python3 "$SCRIPT" twilio-set-default "+17025551234" --save-env
# 或
python3 "$SCRIPT" twilio-set-default PNXXXXXXXXXXXXXXXXXXXXXXXXXXXX --save-env
```

### Bland.ai — 最简单的出站AI通话

在此注册：
- https://app.bland.ai

保存配置：

```bash
python3 "$SCRIPT" save-bland your_bland_api_key --voice mason
```

### Vapi — 更好的对话式语音质量

在此注册：
- https://dashboard.vapi.ai

首先保存API密钥：

```bash
python3 "$SCRIPT" save-vapi your_vapi_api_key
```

将你拥有的Twilio号码导入Vapi并持久化返回的电话号码ID：

```bash
python3 "$SCRIPT" vapi-import-twilio --save-env
```

如果你已经知道Vapi电话号码ID，可以直接保存：

```bash
python3 "$SCRIPT" save-vapi your_vapi_api_key --phone-number-id vapi_phone_number_id_here
```

## 诊断当前状态

随时检查技能已知的信息：

```bash
python3 "$SCRIPT" diagnose
```

在后续会话中恢复工作时，请首先使用此命令。

## 常见工作流

### A. 购买一个智能体号码并稍后继续使用

1.  保存Twilio凭证：
```bash
python3 "$SCRIPT" save-twilio AC... auth_token_here
```

2.  搜索一个号码：
```bash
python3 "$SCRIPT" twilio-search --country US --area-code 702 --limit 10
```

3.  购买它并将其保存到 `~/.hermes/.env` + 状态：
```bash
python3 "$SCRIPT" twilio-buy "+17025551234" --save-env
```

4.  下次会话，运行：
```bash
python3 "$SCRIPT" diagnose
```
这将显示记住的默认号码和收件箱检查点状态。

### B. 从智能体号码发送短信

```bash
python3 "$SCRIPT" twilio-send-sms "+15551230000" "您的部署已成功完成。"
```

包含媒体文件：

```bash
python3 "$SCRIPT" twilio-send-sms "+15551230000" "这是图表。" --media-url "https://example.com/chart.png"
```

### C. 稍后检查入站短信，无需Webhook服务器

轮询默认Twilio号码的收件箱：

```bash
python3 "$SCRIPT" twilio-inbox --limit 20
```

仅显示自上次检查点之后到达的消息，并在读取完成后推进检查点：

```bash
python3 "$SCRIPT" twilio-inbox --since-last --mark-seen
```

这是对“下次加载技能时，我如何访问该号码接收到的消息？”这个问题的主要回答。

### D. 使用内置TTS进行直接Twilio通话

```bash
python3 "$SCRIPT" twilio-call "+15551230000" --message "你好！我是Hermes，向您报告状态更新。" --voice Polly.Joanna
```

### E. 使用预录制/自定义语音消息通话

这是重用Hermes现有`text_to_speech`支持的主要路径。

在以下情况使用：
-   你希望通话使用Hermes配置的TTS语音，而不是Twilio的`<Say>`
-   你需要单向语音传递（简报、警报、笑话、提醒、状态更新）
-   你 **不需要** 实时的对话式电话通话

单独生成或托管音频，然后：

```bash
python3 "$SCRIPT" twilio-call "+155****0000" --audio-url "https://example.com/briefing.mp3"
```

推荐的 Hermes TTS -> Twilio Play 工作流：

1.  使用Hermes的`text_to_speech`生成音频。
2.  使生成的MP3可公开访问。
3.  使用`--audio-url`进行Twilio通话以传递它。

示例智能体流程：
-   让Hermes使用`text_to_speech`创建消息音频
-   如有需要，使用临时静态托管服务/隧道/对象存储URL公开该文件
-   使用 `twilio-call --audio-url ...` 通过电话传递它

用于托管MP3的良好选项：
-   临时的公共对象/存储URL
-   到本地静态文件服务器的短期隧道
-   电话服务提供商可以直接访问的任何现有HTTPS URL

重要提示：
-   Hermes TTS非常适合预录制的出站消息
-   Bland/Vapi更适合 **实时对话式AI通话**，因为它们自行处理实时电话音频栈
-   此处并未将Hermes的STT/TTS用作全双工电话对话引擎；那将需要比此技能试图引入的更重量级的流式/Webhook集成。

### F. 使用Twilio直接通话导航电话树/IVR

如果需要在通话接通后按数字，请使用`--send-digits`。
Twilio将 `w` 解释为短时等待。

```bash
python3 "$SCRIPT" twilio-call "+18005551234" --message "正在为您转接至账单部门。" --send-digits "ww1w2w3"
```

这在转接给人工或传递简短状态消息之前，用于到达特定菜单分支很有用。

### G. 使用Bland.ai进行出站AI电话通话

```bash
python3 "$SCRIPT" ai-call "+15551230000" "致电牙科诊所，预约周二下午的洗牙服务，如果他们周二没有时间，就预约周三或周四。" --provider bland --voice mason --max-duration 3
```

检查状态：

```bash
python3 "$SCRIPT" ai-status <call_id> --provider bland
```

通话完成后向Bland询问分析问题：

```bash
python3 "$SCRIPT" ai-status <call_id> --provider bland --analyze "预约是否已确认？,日期和时间是什么？,有什么特别说明吗？"
```

### H. 使用Vapi在你拥有的号码上进行出站AI电话通话

1.  将你的Twilio号码导入Vapi：
```bash
python3 "$SCRIPT" vapi-import-twilio --save-env
```

2.  发起通话：
```bash
python3 "$SCRIPT" ai-call "+15551230000" "您正在致电预订晚上7:30两位的晚餐座位。如果该时间不可用，请询问6:30至8:30之间最近可用的时间。" --provider vapi --max-duration 4
```

3.  检查结果：
```bash
python3 "$SCRIPT" ai-status <call_id> --provider vapi
```

## 建议的智能体流程

当用户请求通话或短信时：

1. 通过决策树判断适合的请求路径。
2. 若配置状态不明确，运行 `diagnose` 诊断。
3. 收集完整的任务详情。
4. 在拨打或发送短信前与用户确认。
5. 使用正确的命令。
6. 根据需要轮询结果。
7. 总结结果，不要将第三方号码持久化到 Hermes 内存中。

## 本技能目前仍不支持的功能

- 实时接听来电
- 基于 webhook 的实时短信推送至智能体循环
- 对任意第三方双因素认证服务的保证支持

这些功能所需的基础设施超出纯可选技能的范围。

## 常见问题

- Twilio 试用账户和区域规则可能限制您可呼叫/发送短信的对象。
- 某些服务会拒绝将 VoIP 号码用于双因素认证。
- `twilio-inbox` 通过轮询 REST API 工作，并非即时推送。
- Vapi 外呼通话仍依赖于拥有一个有效的已导入号码。
- Bland 最易于使用，但音质并非总是最佳。
- 不要将任意第三方电话号码存储在 Hermes 内存中。

## 验证清单

完成设置后，您应能仅凭此技能执行以下所有操作：

1. `diagnose` 显示提供方就绪状态和已记忆的状态
2. 搜索并购买 Twilio 号码
3. 将该号码持久化到 `~/.hermes/.env`
4. 从您拥有的号码发送短信
5. 稍后轮询您拥有号码的入站短信
6. 发起直接的 Twilio 通话
7. 通过 Bland 或 Vapi 发起 AI 通话

## 参考资料

- Twilio 电话号码：https://www.twilio.com/docs/phone-numbers/api
- Twilio 消息服务：https://www.twilio.com/docs/messaging/api/message-resource
- Twilio 语音服务：https://www.twilio.com/docs/voice/api/call-resource
- Vapi 文档：https://docs.vapi.ai/
- Bland.ai：https://app.bland.ai/