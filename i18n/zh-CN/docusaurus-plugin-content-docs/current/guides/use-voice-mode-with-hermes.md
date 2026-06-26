---
sidebar_position: 8
title: "Use Voice Mode with Hermes"
description: "A practical guide to setting up and using Hermes voice mode across CLI, Telegram, Discord, and Discord voice channels"
---

# 在 Hermes 中使用语音模式

本指南是 [Voice Mode 功能参考](/user-guide/features/voice-mode) 的实践配套指南。

如果功能页面解释了语音模式能做什么，那么本指南展示的是如何真正用好它。

:::tip
[Nous Portal](/integrations/nous-portal) 通过一个 OAuth 捆绑了 LLM 和 TTS——语音模式可以端到端运行，无需额外凭据。
:::

## 语音模式适合什么场景

语音模式在以下情况下特别有用：
- 你希望免提使用 CLI 工作流
- 你希望在 Telegram 或 Discord 中获得语音回复
- 你希望 Hermes 加入 Discord 语音频道进行实时对话
- 你希望边走边快速记录想法、调试或来回交流，而无需打字

## 选择你的语音模式配置

Hermes 中实际上有三种不同的语音体验。

| 模式 | 最适合 | 平台 |
|---|---|---|
| 交互式麦克风循环 | 编程或研究时的个人免提使用 | CLI |
| 聊天中的语音回复 | 在正常消息旁边提供语音回复 | Telegram、Discord |
| 实时语音频道机器人 | 在语音频道中进行群组或个人实时对话 | Discord 语音频道 |

一个好的路径是：
1. 先让文本正常工作
2. 其次启用语音回复
3. 如果你想要完整体验，最后再切换到 Discord 语音频道

## 第 1 步：确保正常的 Hermes 先正常工作

在接触语音模式之前，请验证：
- Hermes 可以启动
- 你的提供商已配置
- 智能体可以正常回答文本提示

```bash
hermes
```

问一些简单的问题：

```text
What tools do you have available?
```

如果这还不够稳定，请先修复文本模式。

## 第 2 步：安装正确的扩展

### CLI 麦克风 + 播放

```bash
cd ~/.hermes/hermes-agent && uv pip install -e ".[voice]"
```

### 消息平台

```bash
cd ~/.hermes/hermes-agent && uv pip install -e ".[messaging]"
```

### 高级 ElevenLabs TTS

```bash
cd ~/.hermes/hermes-agent && uv pip install -e ".[tts-premium]"
```

### 本地 NeuTTS（可选）

```bash
python -m pip install -U neutts[all]
```

### 全部安装

```bash
cd ~/.hermes/hermes-agent && uv pip install -e ".[all]"
```

## 第 3 步：安装系统依赖

### macOS

```bash
brew install portaudio ffmpeg opus
brew install espeak-ng
```

### Ubuntu / Debian

```bash
sudo apt install portaudio19-dev ffmpeg libopus0
sudo apt install espeak-ng
```

它们为何重要：
- `portaudio` → CLI 语音模式的麦克风输入/播放
- `ffmpeg` → TTS 和消息传递的音频转换
- `opus` → Discord 语音编解码器支持
- `espeak-ng` → NeuTTS 的音素转换器后端

## 第 4 步：选择 STT 和 TTS 提供商

Hermes 支持本地和云端语音堆栈。

### 最简单/最经济的配置

使用本地 STT 和免费 Edge TTS：
- STT 提供商：`local`
- TTS 提供商：`edge`

这通常是最好的起点。

### 环境文件示例

添加到 `~/.hermes/.env`：

```bash
# 云端 STT 选项（本地不需要密钥）
GROQ_API_KEY=***
VOICE_TOOLS_OPENAI_KEY=***

# 高级 TTS（可选）
ELEVENLABS_API_KEY=***
```

### 提供商推荐

#### 语音转文字

- `local` → 隐私和零成本使用的最佳默认选项
- `groq` → 非常快的云端转录
- `openai` → 不错的付费备选

#### 文字转语音

- `edge` → 免费且对大多数用户足够好
- `neutts` → 免费的本地/设备端 TTS
- `elevenlabs` → 最佳质量
- `openai` → 不错的折中选择
- `mistral` → 多语言，原生 Opus

### 如果你使用 `hermes setup`

如果你在设置向导中选择了 NeuTTS，Hermes 会检查 `neutts` 是否已安装。如果缺失，向导会告诉你 NeuTTS 需要 Python 包 `neutts` 和系统包 `espeak-ng`，并主动为你安装它们，使用你的平台包管理器安装 `espeak-ng`，然后运行：

```bash
python -m pip install -U neutts[all]
```

如果你跳过了该安装或安装失败，向导会回退到 Edge TTS。

## 第 5 步：推荐配置

```yaml
voice:
  record_key: "ctrl+b"
  max_recording_seconds: 120
  auto_tts: false
  beep_enabled: true
  silence_threshold: 200
  silence_duration: 3.0

stt:
  provider: "local"
  local:
    model: "base"

tts:
  provider: "edge"
  edge:
    voice: "en-US-AriaNeural"
```

对大多数人来说，这是一个不错的保守默认值。

如果你想要本地 TTS，请将 `tts` 块切换为：

```yaml
tts:
  provider: "neutts"
  neutts:
    ref_audio: ''
    ref_text: ''
    model: neuphonic/neutts-air-q4-gguf
    device: cpu
```

## 用例 1：CLI 语音模式

## 开启

启动 Hermes：

```bash
hermes
```

在 CLI 中：

```text
/voice on
```

### 录音流程

默认按键：
- `Ctrl+B`

工作流：
1. 按下 `Ctrl+B`
2. 说话
3. 等待静音检测自动停止录音
4. Hermes 转录并回复
5. 如果 TTS 已开启，它会说出答案
6. 循环可以自动重启以持续使用

### 有用的命令

```text
/voice
/voice on
/voice off
/voice tts
/voice status
```

### 良好的 CLI 工作流

#### 即走即调试

说：

```text
I keep getting a docker permission error. Help me debug it.
```

然后继续免提：
- "再读一遍最后的错误信息"
- "用更简单的语言解释根本原因"
- "现在给我准确的修复方案"

#### 研究/头脑风暴

非常适合：
- 边走边思考
- 口述尚未成型的想法
- 让 Hermes 实时帮你整理思路

#### 无障碍/少打字场景

如果打字不方便，语音模式是保持完整 Hermes 循环的最快方式之一。

## 调整 CLI 行为

### 静音阈值

如果 Hermes 的启动/停止过于激进，请调整：

```yaml
voice:
  silence_threshold: 250
```

阈值越高 = 越不敏感。

### 静音时长

如果你在句子之间经常停顿，请增加：

```yaml
voice:
  silence_duration: 4.0
```

### 录音按键

如果 `Ctrl+B` 与你的终端或 tmux 习惯冲突：

```yaml
voice:
  record_key: "ctrl+space"
```

## 用例 2：Telegram 或 Discord 中的语音回复

此模式比完整的语音频道更简单。

Hermes 保持为普通聊天机器人，但可以语音回复。

### 启动网关

```bash
hermes gateway
```

### 开启语音回复

在 Telegram 或 Discord 中：

```text
/voice on
```

或

```text
/voice tts
```

### 模式

| 模式 | 含义 |
|---|---|
| `off` | 仅文本 |
| `voice_only` | 仅在用户发送语音时语音回复 |
| `all` | 每条回复都语音输出 |

### 何时使用哪种模式

- 如果你只想对语音消息获得语音回复，使用 `/voice on`
- 如果你希望始终有一个完全语音化的助手，使用 `/voice tts`

### 良好的消息工作流

#### 手机上的 Telegram 助手

适用于：
- 你不在电脑旁
- 你想发送语音笔记并快速获得语音回复
- 你希望 Hermes 像便携式研究或运维助手一样工作

#### 带语音输出的 Discord 私聊

当你想要私密互动而不触发服务器频道的 @提及 行为时很有用。

## 用例 3：Discord 语音频道

这是最进阶的模式。

Hermes 加入 Discord 语音频道，监听用户语音，转录它，运行正常的智能体管道，然后将回复语音输出到频道中。

## 所需的 Discord 权限

除了正常的文本机器人设置外，请确保机器人拥有：
- 连接
- 说话
- 最好使用语音活动

还要在开发者门户中启用特权意图：
- 在线状态意图
- 服务器成员意图
- 消息内容意图

## 加入和离开

在机器人所在的 Discord 文本频道中：

```text
/voice join
/voice leave
/voice status
```

### 加入后会发生什么

- 用户在语音频道中说话
- Hermes 检测语音边界
- 转录文本发布在关联的文本频道中
- Hermes 以文本和音频形式回复
- 文本频道是发出 `/voice join` 的那个频道

### Discord 语音频道使用最佳实践

- 保持 `DISCORD_ALLOWED_USERS` 严格限制
- 最初使用专用机器人/测试频道
- 在尝试语音频道模式之前，先在普通文本聊天语音模式中验证 STT 和 TTS 是否正常工作

## 语音质量推荐

### 最佳质量配置

- STT：本地 `large-v3` 或 Groq `whisper-large-v3`
- TTS：ElevenLabs

### 最佳速度/便利性配置

- STT：本地 `base` 或 Groq
- TTS：Edge

### 最佳零成本配置

- STT：本地
- TTS：Edge

## 常见故障模式

### "未找到音频设备"

安装 `portaudio`。

### "机器人加入了但听不到任何声音"

检查：
- 你的 Discord 用户 ID 是否在 `DISCORD_ALLOWED_USERS` 中
- 你是否未静音
- 特权意图是否已启用
- 机器人是否具有连接/说话权限

### "它能转录但不说话"

检查：
- TTS 提供商配置
- ElevenLabs 或 OpenAI 的 API 密钥/配额
- 用于 Edge 转换路径的 `ffmpeg` 安装

### "Whisper 输出乱码"

尝试：
- 更安静的环境
- 更高的 `silence_threshold`
- 不同的 STT 提供商/模型
- 更短、更清晰的发音

### "在私聊中有效但在服务器频道中无效"

这通常是提及策略的问题。

默认情况下，除非另有配置，机器人在 Discord 服务器文本频道中需要被 `@提及`。

## 建议的第一周配置

如果你希望用最短路径获得成功：

1. 让文本 Hermes 正常工作
2. 安装 `hermes-agent[voice]`
3. 使用本地 STT + Edge TTS 的 CLI 语音模式
4. 然后在 Telegram 或 Discord 中启用 `/voice on`
5. 只有在之后，才尝试 Discord 语音频道模式

这种渐进方式可以将调试范围保持在最小。

## 接下来阅读

- [Voice Mode 功能参考](/user-guide/features/voice-mode)
- [消息网关](/user-guide/messaging)
- [Discord 设置](/user-guide/messaging/discord)
- [Telegram 设置](/user-guide/messaging/telegram)
- [配置](/user-guide/configuration)