---
sidebar_position: 8
title: "使用 Hermes 的语音模式"
description: "一份关于在 CLI、Telegram、Discord 和 Discord 语音频道中使用 Hermes 语音模式的实用指南"
---

# 使用 Hermes 的语音模式

本指南是 [语音模式功能参考](/docs/user-guide/features/voice-mode) 的实用伴侣。

如果功能页面解释了语音模式能做什么，那么本指南将展示如何实际有效地使用它。

## 语音模式适用于什么场景

当出现以下情况时，语音模式尤其有用：
- 您需要一个免提的 CLI 工作流
- 您希望在 Telegram 或 Discord 中获得口语回复
- 您希望 Hermes 驻留在 Discord 语音频道中进行实时对话
- 您不通过打字，而是边走边快速捕捉想法、调试或进行来回交流

## 选择您的语音模式设置

Hermes 实际上有三种不同的语音体验。

| 模式 | 适用场景 | 平台 |
|---|---|---|
| 交互式麦克风循环 | 编码或研究时的个人免提使用 | CLI |
| 聊天中的语音回复 | 与正常消息并行的口语回复 | Telegram, Discord |
| 实时语音频道机器人 | 在语音频道 (VC) 中的群组或个人实时对话 | Discord 语音频道 |

最佳路径是：
1. 先让文本功能工作
2. 再启用语音回复功能
3. 如果想要完整的体验，最后移动到 Discord 语音频道

## 步骤 1: 确保正常 Hermes 先工作

在触及语音模式之前，请验证以下几点：
- Hermes 是否启动
- 您的提供商是否已配置
- 智能体是否能正常回答文本提示

```bash
hermes
```

提问一些简单的问题：

```text
您有哪些可用的工具？
```

如果这一点尚未稳定，请先修复文本模式。

## 步骤 2: 安装正确的附加组件

### CLI 麦克风 + 播放

```bash
pip install "hermes-agent[voice]"
```

### 消息平台

```bash
pip install "hermes-agent[messaging]"
```

### 高级 ElevenLabs TTS

```bash
pip install "hermes-agent[tts-premium]"
```

### 本地 NeuTTS（可选）

```bash
python -m pip install -U neutts[all]
```

### 全部功能

```bash
pip install "hermes-agent[all]"
```

## 步骤 3: 安装系统依赖项

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

这些依赖项的重要性：
- `portaudio` → CLI 语音模式的麦克风输入/播放
- `ffmpeg` → TTS 和消息传递的音频转换
- `opus` → Discord 语音编解码器支持
- `espeak-ng` → NeuTTS 的音素化后端

## 步骤 4: 选择 STT 和 TTS 提供商

Hermes 支持本地和云端的语音堆栈。

### 最简单/最便宜的设置

使用本地 STT 和免费的 Edge TTS：
- STT 提供商: `local`
- TTS 提供商: `edge`

这通常是最好的起点。

### 环境文件示例

添加到 `~/.hermes/.env`:

```bash
# 云端 STT 选项（本地不需要密钥）
GROQ_API_KEY=***
VOICE_TOOLS_OPENAI_KEY=***

# 高级 TTS（可选）
ELEVENLABS_API_KEY=***
```

### 提供商推荐

#### 语音转文本 (Speech-to-text)

- `local` → 隐私和零成本使用的最佳默认选项
- `groq` → 非常快速的云端转录
- `openai` → 良好的付费备选方案

#### 文本转语音 (Text-to-speech)

- `edge` → 免费且对大多数用户足够好
- `neutts` → 免费的本地/设备端 TTS
- `elevenlabs` → 最佳质量
- `openai` → 良好的中间选择
- `mistral` → 多语言、原生 Opus

### 如果您使用 `hermes setup`

如果您在设置向导中选择了 NeuTTS，Hermes 会检查 `neutts` 是否已安装。如果缺失，向导会告诉您 NeuTTS 需要 Python 包 `neutts` 和系统包 `espeak-ng`，并提供安装它们的选项，使用您的平台包管理器安装 `espeak-ng`，然后运行：

```bash
python -m pip install -U neutts[all]
```

如果您跳过了安装或安装失败，向导将回退到 Edge TTS。

## 步骤 5: 推荐配置

```yaml
voice:
  record_key: "ctrl+b"
  max_recording_seconds: 120
  auto_tts: false
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

这是大多数人一个良好、保守的默认配置。

如果您想要本地 TTS，请将 `tts` 块切换为：

```yaml
tts:
  provider: "neutts"
  neutts:
    ref_audio: ''
    ref_text: ''
    model: neuphonic/neutts-air-q4-gguf
    device: cpu
```

## 用例 1: CLI 语音模式

## 开启它

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

工作流程：
1. 按下 `Ctrl+B`
2. 开始说话
3. 等待静音检测以自动停止录音
4. Hermes 进行转录和回复
5. 如果开启了 TTS，它会说出答案
6. 循环可以自动重启以实现持续使用

### 有用的命令

```text
/voice
/voice on
/voice off
/voice tts
/voice status
```

### 优秀的 CLI 工作流

#### 走动调试

说：

```text
我一直收到 docker 权限错误。帮我调试一下。
```

然后继续免提操作：
- "再次朗读上一个错误"
- "用更简单的术语解释根本原因"
- "现在给我确切的修复方法"

#### 研究/头脑风暴

非常适合：
- 边走边思考
- 口述尚未成型的想法
- 要求 Hermes 实时结构化您的思路

#### 无障碍/低打字场景

如果打字不方便，语音模式是保持在完整 Hermes 循环中最快的方式之一。

## 调整 CLI 行为

### 静音阈值

如果 Hermes 启动/停止过于频繁，请调整：

```yaml
voice:
  silence_threshold: 250
```

阈值越高 = 越不敏感。

### 静音持续时间

如果您在句子之间停顿较多，请增加：

```yaml
voice:
  silence_duration: 4.0
```

### 录音按键

如果 `Ctrl+B` 与您的终端或 tmux 习惯冲突：

```yaml
voice:
  record_key: "ctrl+space"
```

## 用例 2: Telegram 或 Discord 中的语音回复

此模式比完整的语音频道更简单。

Hermes 仍然是一个正常的聊天机器人，但可以发出语音回复。

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
| `voice_only` | 仅当用户发送语音时才说话 |
| `all` | 回复时总是说话 |

### 何时使用哪种模式

- 如果您只希望对语音消息回复口语，请使用 `/voice on`
- 如果您希望始终拥有一个完整的口语助手，请使用 `/voice tts`

### 优秀的消息工作流

#### 手机上的 Telegram 助手

何时使用：
- 您不在您的设备旁边
- 您想发送语音笔记并获得快速口语回复
- 您希望 Hermes 像便携式的研究或运维助手一样运行

#### 带口语输出的 Discord 私信 (DMs)

当您需要私密互动，而不想受到服务器频道提及行为影响时很有用。

## 用例 3: Discord 语音频道

这是最高级的模式。

Hermes 加入 Discord VC，收听用户语音，转录它，运行正常的智能体流程，并将回复语音发送回频道。

## 所需的 Discord 权限

除了正常的文本机器人设置外，请确保机器人拥有：
- 连接 (Connect)
- 发声 (Speak)
- 最好拥有使用语音活动 (Use Voice Activity)

同时，请在开发者门户启用特权意图 (privileged intents)：
- Presence Intent (存在意图)
- Server Members Intent (服务器成员意图)
- Message Content Intent (消息内容意图)

## 加入和离开

在机器人存在的 Discord 文本频道中：

```text
/voice join
/voice leave
/voice status
```

### 连接后会发生什么

- 用户在 VC 中说话
- Hermes 检测语音边界
- 转录内容发布到关联的文本频道
- Hermes 以文本和音频回复
- 文本频道是发出 `/voice join` 命令的那个频道

### Discord VC 使用的最佳实践

- 保持 `DISCORD_ALLOWED_USERS` 列表严格
- 先在一个专用的机器人/测试频道中使用
- 在尝试 VC 模式之前，先验证 STT 和 TTS 在普通文本聊天语音模式下是否正常工作

## 语音质量推荐

### 最佳质量设置

- STT: local `large-v3` 或 Groq `whisper-large-v3`
- TTS: ElevenLabs

### 最佳速度/便利性设置

- STT: local `base` 或 Groq
- TTS: Edge

### 最佳零成本设置

- STT: local
- TTS: Edge

## 常见故障模式

### "未找到音频设备"

请安装 `portaudio`。

### "机器人加入了但听不到任何声音"

请检查：
- 您的 Discord 用户 ID 是否在 `DISCORD_ALLOWED_USERS` 中
- 您是否没有被静音
- 特权意图是否已启用
- 机器人是否拥有连接/发声权限

### "它转录了但没有说话"

请检查：
- TTS 提供商配置
- ElevenLabs 或 OpenAI 的 API 密钥/配额
- Edge 转换路径是否安装了 `ffmpeg`

### "Whisper 输出垃圾信息"

请尝试：
- 更安静的环境
- 更高的 `silence_threshold`
- 不同的 STT 提供商/模型
- 更短、更清晰的语音片段

### "它在私信中工作，但在服务器频道中不工作"

这通常是提及策略所致。

默认情况下，除非另行配置，否则机器人需要在 Discord 服务器文本频道中收到 `@提及` 才能工作。

## 建议的第一周设置

如果您想要最短的成功路径：

1. 让文本 Hermes 工作起来
2. 安装 `hermes-agent[voice]`
3. 使用本地 STT + Edge TTS 的 CLI 语音模式
4. 然后在 Telegram 或 Discord 中启用 `/voice on`
5. 只有在那之后，才尝试 Discord VC 模式

这种渐进式的推进可以保持调试范围较小。

## 下一步阅读

- [语音模式功能参考](/docs/user-guide/features/voice-mode)
- [消息网关](/docs/user-guide/messaging)
- [Discord 设置](/docs/user-guide/messaging/discord)
- [Telegram 设置](/docs/user-guide/messaging/telegram)
- [配置](/docs/user-guide/configuration)