---
sidebar_position: 8
title: "在Hermes中使用语音模式"
description: "一份关于如何在CLI、Telegram、Discord及Discord语音频道中设置和使用Hermes语音模式的实用指南"
---

# 在Hermes中使用语音模式

本指南是[语音模式功能参考](/user-guide/features/voice-mode)的实用补充。

如果功能页面解释了语音模式*能做什么*，那么本指南将展示如何*用好它*。

## 语音模式适用场景

语音模式在以下情况尤其有用：
- 你希望实现免提的CLI工作流
- 你希望在Telegram或Discord中获得语音回复
- 你希望Hermes常驻在Discord语音频道进行实时对话
- 你希望在走动时快速捕捉想法、调试问题或进行交流，而不是打字

## 选择你的语音模式设置

Hermes实际上提供了三种不同的语音体验。

| 模式 | 最佳适用场景 | 平台 |
|---|---|---|
| 交互式麦克风循环 | 编码或研究时个人免提使用 | CLI |
| 聊天中的语音回复 | 在正常消息传递的同时获得语音回复 | Telegram、Discord |
| 实时语音频道机器人 | 在语音频道（VC）中进行群组或个人实时对话 | Discord语音频道 |

推荐的路径是：
1. 先确保文本模式工作正常
2. 其次启用语音回复
3. 最后，如果你想要完整体验，再转向Discord语音频道

## 第一步：首先确保基本的Hermes能正常工作

在涉及语音模式之前，请先验证：
- Hermes可以启动
- 你的服务商（provider）已配置
- 智能体能正常回答文本提示

```bash
hermes
```

问一个简单的问题：

```text
你有哪些可用的工具？
```

如果这步还不稳固，请先解决文本模式的问题。

## 第二步：安装正确的依赖包

### CLI麦克风 + 播放

```bash
pip install "hermes-agent[voice]"
```

### 消息平台

```bash
pip install "hermes-agent[messaging]"
```

### 高级ElevenLabs TTS

```bash
pip install "hermes-agent[tts-premium]"
```

### 本地NeuTTS（可选）

```bash
python -m pip install -U neutts[all]
```

### 全部安装

```bash
pip install "hermes-agent[all]"
```

## 第三步：安装系统依赖

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

为何需要这些依赖：
- `portaudio` → 用于CLI语音模式的麦克风输入/播放
- `ffmpeg` → 用于TTS和消息传递的音频转换
- `opus` → Discord语音编解码器支持
- `espeak-ng` → NeuTTS的音素化后端

## 第四步：选择STT和TTS供应商

Hermes支持本地和云端语音技术栈。

### 最简单/最经济的设置

使用本地STT和免费的Edge TTS：
- STT供应商：`local`
- TTS供应商：`edge`

这通常是最佳的起点。

### 环境文件示例

添加到 `~/.hermes/.env`：

```bash
# 云端STT选项（本地不需要密钥）
GROQ_API_KEY=***
VOICE_TOOLS_OPENAI_KEY=***

# 高级TTS（可选）
ELEVENLABS_API_KEY=***
```

### 供应商推荐

#### 语音转文本（STT）

- `local` → 注重隐私和零成本的最佳默认选择
- `groq` → 非常快速的云端转录
- `openai` → 良好的付费备用选项

#### 文本转语音（TTS）

- `edge` → 免费，对大多数用户来说足够好
- `neutts` → 免费的本地/设备端TTS
- `elevenlabs` → 最佳质量
- `openai` → 良好的折中方案
- `mistral` → 多语言，原生Opus支持

### 如果你使用 `hermes setup`

如果你在设置向导中选择NeuTTS，Hermes会检查`neutts`是否已安装。如果缺失，向导会告知你需要Python包`neutts`和系统包`espeak-ng`，并提供为你安装的服务，它会使用你平台的包管理器安装`espeak-ng`，然后运行：

```bash
python -m pip install -U neutts[all]
```

如果你跳过该安装或安装失败，向导将回退到Edge TTS。

## 第五步：推荐配置

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

这对大多数人来说是一个良好的保守默认设置。

如果你想要本地TTS，请将`tts`块切换为：

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

启动Hermes：

```bash
hermes
```

在CLI内部：

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
4. Hermes转录并回复
5. 如果TTS开启，它会说出答案
6. 循环可以自动重启以实现连续使用

### 常用命令

```text
/voice
/voice on
/voice off
/voice tts
/voice status
```

### 良好的CLI工作流

#### 随时调试

说：

```text
我总是遇到docker权限错误。帮我调试一下。
```

然后继续免提操作：
- "再读一遍最后的错误"
- "用更简单的话解释根本原因"
- "现在给我确切的修复方法"

#### 研究/头脑风暴

非常适合：
- 走动时思考
- 口述未成形的想法
- 让Hermes实时整理你的思路

#### 无障碍/减少打字场景

如果打字不方便，语音模式是保持完整Hermes交互的最快方式之一。

## 调整CLI行为

### 静音阈值

如果Hermes开始/停止录音过于灵敏，请调整：

```yaml
voice:
  silence_threshold: 250
```

阈值越高 = 灵敏度越低。

### 静音时长

如果你在句子之间停顿较多，请增加：

```yaml
voice:
  silence_duration: 4.0
```

### 录音按键

如果 `Ctrl+B` 与你的终端或tmux习惯冲突：

```yaml
voice:
  record_key: "ctrl+space"
```

## 用例 2：在Telegram或Discord中进行语音回复

此模式比完整的语音频道模式更简单。

Hermes保持为普通的聊天机器人，但可以说出回复。

### 启动网关

```bash
hermes gateway
```

### 开启语音回复

在Telegram或Discord内部：

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
| `voice_only` | 仅当用户发送语音时才说出回复 |
| `all` | 说出每条回复 |

### 何时使用哪种模式

- 如果你希望仅对语音来源的消息进行语音回复，使用 `/voice on`
- 如果你希望始终有一个完整的语音助手，使用 `/voice tts`

### 良好的消息传递工作流

#### 手机上的Telegram助手

适用于：
- 你不在电脑旁
- 你希望发送语音备忘录并快速获得语音回复
- 你希望Hermes像一个便携式研究或运维助手

#### 带语音输出的Discord私信

当你希望进行私人互动，而不想有服务器频道的提及行为时很有用。

## 用例 3：Discord 语音频道

这是最高级的模式。

Hermes加入一个Discord语音频道，监听用户语音，转录它，运行正常的智能体处理流程，并将回复语音传回频道。

## 所需的Discord权限

除了正常的文本机器人设置外，请确保机器人拥有：
- 连接
- 说话
- 最好还有使用语音活动的权限

同时，在开发者门户中启用特权意图：
- 在线状态意图
- 服务器成员意图
- 消息内容意图

## 加入和离开

在机器人所在的Discord文本频道中：

```text
/voice join
/voice leave
/voice status
```

### 加入后会发生什么

- 用户在语音频道（VC）中说话
- Hermes检测语音边界
- 转录文本会发布在关联的文本频道中
- Hermes以文本和音频形式回复
- 文本频道是执行`/voice join`命令时所在的那个

### Discord语音频道使用的最佳实践

- 严格限制 `DISCORD_ALLOWED_USERS`
- 最初使用一个专用的机器人/测试频道
- 在尝试语音频道模式之前，先在普通的文本聊天语音模式下验证STT和TTS是否工作正常

## 语音质量推荐

### 最佳质量设置

- STT: 本地 `large-v3` 或 Groq `whisper-large-v3`
- TTS: ElevenLabs

### 最佳速度/便利性设置

- STT: 本地 `base` 或 Groq
- TTS: Edge

### 最佳零成本设置

- STT: 本地
- TTS: Edge

## 常见故障模式

### “未找到音频设备”

安装 `portaudio`。

### “机器人加入但听不到任何声音”

检查：
- 你的Discord用户ID在 `DISCORD_ALLOWED_USERS` 中
- 你未被静音
- 特权意图已启用
- 机器人拥有连接/说话权限

### “它能转录但不说话”

检查：
- TTS供应商配置
- ElevenLabs或OpenAI的API密钥/配额
- 用于Edge转换路径的 `ffmpeg` 安装情况

### “Whisper输出乱码”

尝试：
- 更安静的环境
- 更高的 `silence_threshold`
- 不同的STT供应商/模型
- 更短、更清晰的发言

### “它在私信中有效但在服务器频道中不行”

这通常是提及策略问题。

默认情况下，除非另行配置，否则机器人在Discord服务器文本频道中需要被 `@提及` 才会响应。

## 建议的首周设置

如果你想以最短路径获得成功：

1. 让文本Hermes正常工作
2. 安装 `hermes-agent[voice]`
3. 使用本地STT + Edge TTS的CLI语音模式
4. 然后在Telegram或Discord中启用 `/voice on`
5. 只有在那之后，才尝试Discord语音频道模式

这个进程可以最大限度地缩小调试范围。

## 接下来阅读什么

- [语音模式功能参考](/user-guide/features/voice-mode)
- [消息传递网关](/user-guide/messaging)
- [Discord设置](/user-guide/messaging/discord)
- [Telegram设置](/user-guide/messaging/telegram)
- [配置](/user-guide/configuration)