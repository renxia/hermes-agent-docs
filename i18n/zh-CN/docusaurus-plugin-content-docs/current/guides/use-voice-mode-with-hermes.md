---
sidebar_position: 8
title: "在 Hermes 中使用语音模式"
description: "一份关于在 CLI、Telegram、Discord 和 Discord 语音频道中设置和使用 Hermes 语音模式的实用指南"
---

# 在 Hermes 中使用语音模式

本指南是[语音模式功能参考](/docs/user-guide/features/voice-mode)的实用配套文档。

如果说功能页面解释了语音模式能做什么，那么本指南则展示了如何真正用好它。

## 语音模式适合的场景

语音模式在以下情况下特别有用：
- 你希望实现免提的 CLI 工作流
- 你希望在 Telegram 或 Discord 中获得语音回复
- 你希望 Hermes 驻留在 Discord 语音频道中进行实时对话
- 你希望在走动时快速记录想法、调试或与 Hermes 来回交流，而无需打字

## 选择你的语音模式设置

Hermes 实际上提供了三种不同的语音体验。

| 模式 | 最适合 | 平台 |
|---|---|---|
| 交互式麦克风循环 | 在编码或研究时个人免提使用 | CLI |
| 聊天中的语音回复 | 在普通消息旁附带语音回复 | Telegram、Discord |
| 实时语音频道机器人 | 在语音频道中进行群组或个人实时对话 | Discord 语音频道 |

一个较好的路径是：
1. 先让文本功能正常工作
2. 再启用语音回复
3. 最后如果需要完整体验，再迁移到 Discord 语音频道

## 步骤 1：首先确保普通 Hermes 正常工作

在接触语音模式之前，请验证：
- Hermes 能够启动
- 你的提供商已配置
- 智能体能够正常回复文本提示

```bash
hermes
```

问一个简单的问题：

```text
你有哪些可用的工具？
```

如果这还不够稳定，请先修复文本模式。

## 步骤 2：安装正确的额外组件

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

### 全部安装

```bash
pip install "hermes-agent[all]"
```

## 步骤 3：安装系统依赖

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

这些依赖的作用：
- `portaudio` → CLI 语音模式的麦克风输入/播放
- `ffmpeg` → TTS 和消息传递的音频转换
- `opus` → Discord 语音编解码器支持
- `espeak-ng` → NeuTTS 的音素化后端

## 步骤 4：选择 STT 和 TTS 提供商

Hermes 同时支持本地和云端语音堆栈。

### 最简单/最便宜的设置

使用本地 STT 和免费的 Edge TTS：
- STT 提供商：`local`
- TTS 提供商：`edge`

这通常是最好的起点。

### 环境文件示例

添加到 `~/.hermes/.env`：

```bash
# 云端 STT 选项（本地无需密钥）
GROQ_API_KEY=***
VOICE_TOOLS_OPENAI_KEY=***

# 高级 TTS（可选）
ELEVENLABS_API_KEY=***
```

### 提供商推荐

#### 语音转文本

- `local` → 隐私保护和零成本使用的最佳默认选项
- `groq` → 非常快速的云端转录
- `openai` → 良好的付费备用方案

#### 文本转语音

- `edge` → 免费且对大多数用户来说足够好
- `neutts` → 免费本地/设备端 TTS
- `elevenlabs` → 最佳音质
- `openai` → 良好的折中选择
- `mistral` → 多语言，原生 Opus 支持

### 如果你使用 `hermes setup`

如果你在设置向导中选择 NeuTTS，Hermes 会检查 `neutts` 是否已安装。如果缺失，向导会提示你 NeuTTS 需要 Python 包 `neutts` 和系统包 `espeak-ng`，并为你安装它们，使用你的平台包管理器安装 `espeak-ng`，然后运行：

```bash
python -m pip install -U neutts[all]
```

如果你跳过该安装或安装失败，向导将回退到 Edge TTS。

## 步骤 5：推荐配置

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

这对大多数人来说是一个良好的保守默认值。

如果你希望使用本地 TTS，请将 `tts` 块切换为：

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

## 开启它

启动 Hermes：

```bash
hermes
```

在 CLI 内部：

```text
/voice on
```

### 录音流程

默认按键：
- `Ctrl+B`

工作流程：
1. 按下 `Ctrl+B`
2. 说话
3. 等待静音检测自动停止录音
4. Hermes 转录并回复
5. 如果 TTS 已开启，它会说出答案
6. 循环可以自动重启以进行连续使用

### 实用命令

```text
/voice
/voice on
/voice off
/voice tts
/voice status
```

### 良好的 CLI 工作流

#### 走近调试

说：

```text
我一直遇到 docker 权限错误。帮我调试一下。
```

然后继续免提操作：
- “再读一遍最后的错误”
- “用更简单的术语解释根本原因”
- “现在给我确切的修复方法”

#### 研究/头脑风暴

非常适合：
- 边走动边思考
- 口述尚未成型的想法
- 让 Hermes 实时帮你整理思路

#### 无障碍/低打字会话

如果打字不方便，语音模式是保持完整 Hermes 循环的最快方式之一。

## 调整 CLI 行为

### 静音阈值

如果 Hermes 开始/停止过于激进，请调整：

```yaml
voice:
  silence_threshold: 250
```

阈值越高 = 越不敏感。

### 静音持续时间

如果你在句子之间经常停顿，请增加：

```yaml
voice:
  silence_duration: 4.0
```

### 录音键

如果 `Ctrl+B` 与你的终端或 tmux 习惯冲突：

```yaml
voice:
  record_key: "ctrl+space"
```

## 用例 2：Telegram 或 Discord 中的语音回复

这种模式比完整的语音频道更简单。

Hermes 仍然是一个普通的聊天机器人，但可以语音回复。

### 启动网关

```bash
hermes gateway
```

### 开启语音回复

在 Telegram 或 Discord 内部：

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
| `all` | 每次回复都说话 |

### 何时使用哪种模式

- 如果你只想对语音发起的消息进行语音回复，请使用 `/voice on`
- 如果你希望始终有一个完整的语音助手，请使用 `/voice tts`

### 良好的消息工作流

#### 手机上的 Telegram 助手

在以下情况下使用：
- 你不在电脑旁
- 你想发送语音笔记并获得快速语音回复
- 你希望 Hermes 像一个便携式研究或运维助手一样工作

#### 带有语音输出的 Discord 私信

当你希望进行私密互动而不想触发服务器频道提及行为时很有用。

## 用例 3：Discord 语音频道

这是最先进的模式。

Hermes 加入一个 Discord 语音频道，监听用户语音，将其转录，运行正常的智能体流程，并将语音回复回传到频道中。

## 所需的 Discord 权限

除了普通的文本机器人设置外，请确保机器人拥有：
- 连接
- 说话
- 最好启用“使用语音活动”

还要在开发者门户中启用特权意图：
- 存在意图
- 服务器成员意图
- 消息内容意图

## 加入和离开

在机器人所在的 Discord 文本频道中：

```text
/voice join
/voice leave
/voice status
```

### 加入时会发生什么

- 用户在语音频道中说话
- Hermes 检测语音边界
- 转录文本发布到关联的文本频道
- Hermes 以文本和音频形式回复
- 文本频道是发出 `/voice join` 命令的那个频道

### Discord 语音频道使用的最佳实践

- 保持 `DISCORD_ALLOWED_USERS` 列表严格
- 首先使用专用的机器人/测试频道
- 在尝试语音频道模式之前，先在普通文本聊天的语音模式中验证 STT 和 TTS 是否正常工作

## 语音质量推荐

### 最佳音质设置

- STT：本地 `large-v3` 或 Groq `whisper-large-v3`
- TTS：ElevenLabs

### 最佳速度/便利性设置

- STT：本地 `base` 或 Groq
- TTS：Edge

### 最佳零成本设置

- STT：本地
- TTS：Edge

## 常见故障模式

### “找不到音频设备”

安装 `portaudio`。

### “机器人加入但听不到任何声音”

检查：
- 你的 Discord 用户 ID 是否在 `DISCORD_ALLOWED_USERS` 中
- 你是否未静音
- 是否已启用特权意图
- 机器人是否有连接/说话权限

### “它能转录但不说话”

检查：
- TTS 提供商配置
- ElevenLabs 或 OpenAI 的 API 密钥/配额
- Edge 转换路径的 `ffmpeg` 安装

### “Whisper 输出乱码”

尝试：
- 更安静的环境
- 更高的 `silence_threshold`
- 不同的 STT 提供商/模型
- 更短、更清晰的发音

### “它在私信中有效，但在服务器频道中无效”

这通常是提及策略的问题。

默认情况下，除非另行配置，否则机器人在 Discord 服务器文本频道中需要 `@提及`。

## 建议的第一周设置

如果你希望走最短的路径获得成功：

1. 让文本 Hermes 正常工作
2. 安装 `hermes-agent[voice]`
3. 使用 CLI 语音模式，搭配本地 STT + Edge TTS
4. 然后在 Telegram 或 Discord 中启用 `/voice on`
5. 只有在那之后，才尝试 Discord 语音频道模式

这种渐进方式可以保持调试范围较小。

## 接下来阅读哪里

- [语音模式功能参考](/docs/user-guide/features/voice-mode)
- [消息网关](/docs/user-guide/messaging)
- [Discord 设置](/docs/user-guide/messaging/discord)
- [Telegram 设置](/docs/user-guide/messaging/telegram)
- [配置](/docs/user-guide/configuration)