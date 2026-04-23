---
sidebar_position: 10
title: "语音模式"
description: "与 Hermes 智能体进行实时语音对话 —— 支持 CLI、Telegram、Discord（私信、文字频道和语音频道）"
---

# 语音模式

Hermes 智能体支持在 CLI 和消息平台上的完整语音交互。您可以使用麦克风与智能体交谈，听到语音回复，并在 Discord 语音频道中进行实时语音对话。

如果您希望获得包含推荐配置和实际使用模式的实用设置指南，请参阅[使用 Hermes 的语音模式](/docs/guides/use-voice-mode-with-hermes)。

## 先决条件

在使用语音功能之前，请确保您已完成以下准备：

1. **已安装 Hermes 智能体** —— `pip install hermes-agent`（参见[安装指南](/docs/getting-started/installation)）
2. **已配置 LLM 提供商** —— 运行 `hermes model` 或在 `~/.hermes/.env` 中设置您偏好的提供商凭据
3. **基础环境可正常工作** —— 运行 `hermes` 验证智能体能响应文本输入后再启用语音功能

:::tip
首次运行 `hermes` 时会自动创建 `~/.hermes/` 目录和默认的 `config.yaml` 文件。您只需手动创建 `~/.hermes/.env` 文件用于存放 API 密钥。
:::

## 概览

| 功能 | 平台 | 说明 |
|------|------|------|
| **交互式语音** | CLI | 按下 Ctrl+B 开始录音，智能体自动检测静音并作出回应 |
| **自动语音回复** | Telegram、Discord | 智能体在发送文本回复的同时发送语音音频 |
| **语音频道** | Discord | 机器人加入语音频道，监听用户说话，并将回复以语音形式播放 |

## 要求

### Python 包

```bash
# CLI 语音模式（麦克风 + 音频播放）
pip install "hermes-agent[voice]"

# Discord + Telegram 消息（包含 discord.py[voice] 以支持语音频道）
pip install "hermes-agent[messaging]"

# 高级 TTS（ElevenLabs）
pip install "hermes-agent[tts-premium]"

# 本地 TTS（NeuTTS，可选）
python -m pip install -U neutts[all]

# 一次性安装全部
pip install "hermes-agent[all]"
```

| 扩展 | 包含包 | 用途 |
|------|--------|------|
| `voice` | `sounddevice`、`numpy` | CLI 语音模式 |
| `messaging` | `discord.py[voice]`、`python-telegram-bot`、`aiohttp` | Discord 和 Telegram 机器人 |
| `tts-premium` | `elevenlabs` | ElevenLabs TTS 提供商 |

可选本地 TTS 提供商：请单独安装 `neutts`，命令为 `python -m pip install -U neutts[all]`。首次使用时将自动下载模型。

:::info
`discord.py[voice]` 会自动安装 **PyNaCl**（用于语音加密）和 **opus 绑定库**。这是 Discord 语音频道支持所必需的。
:::

### 系统依赖

```bash
# macOS
brew install portaudio ffmpeg opus
brew install espeak-ng   # 用于 NeuTTS

# Ubuntu/Debian
sudo apt install portaudio19-dev ffmpeg libopus0
sudo apt install espeak-ng   # 用于 NeuTTS
```

| 依赖项 | 用途 | 所需场景 |
|--------|------|----------|
| **PortAudio** | 麦克风输入和音频播放 | CLI 语音模式 |
| **ffmpeg** | 音频格式转换（MP3 → Opus，PCM → WAV） | 所有平台 |
| **Opus** | Discord 语音编解码器 | Discord 语音频道 |
| **espeak-ng** | Phonemizer 后端 | 本地 NeuTTS 提供商 |

### API 密钥

添加到 `~/.hermes/.env`：

```bash
# 语音转文本 —— 本地提供商完全不需要密钥
# pip install faster-whisper          # 免费，本地运行，推荐
GROQ_API_KEY=your-key                 # Groq Whisper —— 快速，免费层级（云端）
VOICE_TOOLS_OPENAI_KEY=your-key       # OpenAI Whisper —— 付费（云端）

# 文本转语音（可选 —— Edge TTS 和 NeuTTS 无需任何密钥）
ELEVENLABS_API_KEY=***           # ElevenLabs —— 高质量
# 上面设置的 VOICE_TOOLS_OPENAI_KEY 也同时启用 OpenAI TTS
```

:::tip
如果已安装 `faster-whisper`，则语音模式可在 **零 API 密钥** 的情况下实现语音转文本（STT）。模型（`base` 模型约 150 MB）将在首次使用时自动下载。
:::

---

## CLI 语音模式

### 快速开始

启动 CLI 并启用语音模式：

```bash
hermes                # 启动交互式 CLI
```

然后在 CLI 内部使用以下命令：

```
/voice          切换语音模式开/关
/voice on       启用语音模式
/voice off      禁用语音模式
/voice tts      切换 TTS 输出
/voice status   显示当前状态
```

### 工作原理

1. 使用 `hermes` 启动 CLI，并通过 `/voice on` 启用语音模式
2. **按下 Ctrl+B** —— 发出提示音（880Hz），开始录音
3. **说话** —— 实时音频电平条显示您的输入：`● [▁▂▃▅▇▇▅▂] ❯`
4. **停止说话** —— 静音持续 3 秒后，录音自动停止
5. **两声提示音**（660Hz）确认录音结束
6. 音频通过 Whisper 转录并发送给智能体
7. 如果启用了 TTS，智能体的回复将被朗读出来
8. 录音**自动重新开始** —— 无需按键即可再次说话

此循环将持续进行，直到您在录音过程中按下 **Ctrl+B**（退出连续模式）或连续三次录音均未检测到语音。

:::tip
录音键可通过 `~/.hermes/config.yaml` 中的 `voice.record_key` 配置（默认：`ctrl+b`）。
:::

### 静音检测

两阶段算法用于检测您何时结束说话：

1. **语音确认** —— 等待音频 RMS 值超过阈值（200）至少 0.3 秒，允许音节间的短暂下降
2. **结束检测** —— 一旦确认语音，连续静音 3.0 秒后触发停止

如果 15 秒内完全未检测到语音，录音将自动停止。

`silence_threshold` 和 `silence_duration` 均可在 `config.yaml` 中配置。您也可以通过设置 `voice.beep_enabled: false` 禁用录音开始/结束的提示音。

### 流式 TTS

启用 TTS 后，智能体会**逐句朗读**其生成的回复 —— 您无需等待完整响应：

1. 将文本增量缓冲为完整句子（最少 20 字符）
2. 去除 Markdown 格式和 `<think>` 块
3. 实时逐句生成并播放音频

### 幻觉过滤

Whisper 有时会从静音或背景噪音中生成虚假文本（如“谢谢观看”、“订阅”等）。智能体会使用一组包含多种语言的 26 个已知幻觉短语以及正则表达式模式来过滤这些内容，以捕获重复性变体。

---

## 网关语音回复（Telegram 和 Discord）

如果您尚未设置消息机器人，请参阅特定平台的指南：
- [Telegram 设置指南](../messaging/telegram.md)
- [Discord 设置指南](../messaging/discord.md)

启动网关以连接到您的消息平台：

```bash
hermes gateway        # 启动网关（连接到已配置的平台）
hermes gateway setup  # 首次配置的交互式设置向导
```

### Discord：频道 vs 私信

机器人在 Discord 上支持两种交互模式：

| 模式 | 如何对话 | 是否需要提及 | 设置 |
|------|----------|--------------|------|
| **私信（DM）** | 打开机器人资料 → “发消息” | 否 | 立即生效 |
| **服务器频道** | 在机器人所在的文字频道中输入内容 | 是（`@机器人名`） | 机器人必须被邀请至服务器 |

**私信（推荐用于个人使用）：** 只需打开与机器人的私信并输入内容 —— 无需 @提及。语音回复和所有命令均与频道中相同。

**服务器频道：** 机器人仅当您 @提及它时才会响应（例如 `@hermesbyt4 hello`）。请确保从提及弹窗中选择**机器人用户**，而非同名角色。

:::tip
要在服务器频道中禁用提及要求，请在 `~/.hermes/.env` 中添加：
```bash
DISCORD_REQUIRE_MENTION=false
```
或将特定频道设为自由回复（无需提及）：
```bash
DISCORD_FREE_RESPONSE_CHANNELS=123456789,987654321
```
:::

### 命令

以下命令在 Telegram 和 Discord（私信和文字频道）中均有效：

```
/voice          切换语音模式开/关
/voice on       仅当您发送语音消息时才进行语音回复
/voice tts      对所有消息进行语音回复
/voice off      禁用语音回复
/voice status   显示当前设置
```

### 模式

| 模式 | 命令 | 行为 |
|------|------|------|
| `off` | `/voice off` | 仅文本（默认） |
| `voice_only` | `/voice on` | 仅当您发送语音消息时才朗读回复 |
| `all` | `/voice tts` | 对每条消息都朗读回复 |

语音模式设置会在网关重启后保持不变。

### 平台交付

| 平台 | 格式 | 说明 |
|------|------|------|
| **Telegram** | 语音气泡（Opus/OGG） | 在聊天中内联播放。如有需要，ffmpeg 会将 MP3 转换为 Opus |
| **Discord** | 原生语音气泡（Opus/OGG） | 像用户语音消息一样内联播放。如果语音气泡 API 失败，则回退为文件附件 |

---

## Discord 语音频道

最具沉浸感的语音功能：机器人加入 Discord 语音频道，监听用户说话，转录其语音，通过智能体处理，并在语音频道中朗读回复。

### 设置

#### 1. Discord 机器人权限

如果您已经为文本功能设置了 Discord 机器人（参见[Discord 设置指南](../messaging/discord.md)），则需要添加语音权限。

前往 [Discord 开发者门户](https://discord.com/developers/applications) → 您的应用 → **安装** → **默认安装设置** → **服务器安装**：

**在现有文本权限基础上添加以下权限：**

| 权限 | 用途 | 是否必需 |
|------|------|----------|
| **连接** | 加入语音频道 | 是 |
| **说话** | 在语音频道中播放 TTS 音频 | 是 |
| **使用语音活动** | 检测用户何时说话 | 推荐 |

**更新后的权限整数值：**

| 级别 | 整数值 | 包含内容 |
|------|--------|----------|
| 仅文本 | `274878286912` | 查看频道、发送消息、读取历史、嵌入、附件、线程、反应 |
| 文本 + 语音 | `274881432640` | 上述全部 + 连接、说话 |

**使用更新后的权限 URL 重新邀请机器人：**

```
https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&scope=bot+applications.commands&permissions=274881432640
```

将 `YOUR_APP_ID` 替换为开发者门户中的应用 ID。

:::warning
向已加入的服务器重新邀请机器人将更新其权限而不会将其移除。您不会丢失任何数据或配置。
:::

#### 2. 特权网关意图

在 [开发者门户](https://discord.com/developers/applications) → 您的应用 → **机器人** → **特权网关意图** 中，启用全部三项：

| 意图 | 用途 |
|------|------|
| **Presence Intent** | 检测用户在线/离线状态 |
| **Server Members Intent** | 将语音 SSRC 标识符映射到 Discord 用户 ID |
| **Message Content Intent** | 读取频道中文本消息内容 |

所有三项均为实现完整语音频道功能所必需。**Server Members Intent** 尤其关键 —— 没有它，机器人无法识别谁在语音频道中说话。

#### 3. Opus 编解码器

运行网关的机器上必须安装 Opus 编解码器库：

```bash
# macOS（Homebrew）
brew install opus

# Ubuntu/Debian
sudo apt install libopus0
```

机器人会自动从以下路径加载编解码器：
- **macOS：** `/opt/homebrew/lib/libopus.dylib`
- **Linux：** `libopus.so.0`

#### 4. 环境变量

```bash
# ~/.hermes/.env

# Discord 机器人（已为文本配置）
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_ALLOWED_USERS=your-user-id

# STT —— 本地提供商无需密钥（pip install faster-whisper）
# GROQ_API_KEY=your-key            # 替代方案：基于云端，快速，免费层级

# TTS —— 可选。Edge TTS 和 NeuTTS 无需密钥。
# ELEVENLABS_API_KEY=***      # 高质量
# VOICE_TOOLS_OPENAI_KEY=***  # OpenAI TTS / Whisper
```

### 启动网关

```bash
hermes gateway        # 使用现有配置启动
```

机器人应在几秒钟内上线 Discord。

### 命令

在机器人所在的 Discord 文字频道中使用以下命令：

```
/voice join      机器人加入您当前所在的语音频道
/voice channel   /voice join 的别名
/voice leave     机器人离开语音频道
/voice status    显示语音模式和已连接的频道
```

:::info
运行 `/voice join` 前，您必须已在某个语音频道中。机器人将加入您所在的同一语音频道。
:::

### 工作原理

当机器人加入语音频道时，它会：

1. **独立监听** 每个用户的音频流
2. **检测静音** —— 至少 0.5 秒语音后的 1.5 秒静音将触发处理
3. **转录** 音频（通过 Whisper STT，本地、Groq 或 OpenAI）
4. **处理** 完整的智能体流程（会话、工具、记忆）
5. **通过 TTS 在语音频道中朗读** 回复

### 文字频道集成

当机器人处于语音频道时：

- 转录文本将显示在文字频道中：`[语音] @用户：您说的话`
- 智能体的回复将作为文本发送至频道，并同时在语音频道中朗读
- 文字频道即为发出 `/voice join` 命令的那个频道

### 回声预防

机器人在播放 TTS 回复时会自动暂停其音频监听器，防止听到并重新处理自己的输出。

### 访问控制

只有 `DISCORD_ALLOWED_USERS` 列表中列出的用户才能通过语音交互。其他用户的音频将被静默忽略。

```bash
# ~/.hermes/.env
DISCORD_ALLOWED_USERS=284102345871466496
```

---

## 配置参考

### config.yaml

```yaml
# 语音录音（CLI）
voice:
  record_key: "ctrl+b"            # 开始/停止录音的按键
  max_recording_seconds: 120       # 最大录音长度（秒）
  auto_tts: false                  # 语音模式启动时是否自动启用 TTS
  beep_enabled: true               # 是否播放录音开始/结束提示音
  silence_threshold: 200           # 被视为静音的 RMS 电平（0-32767）
  silence_duration: 3.0            # 自动停止前的静音持续时间（秒）

# 语音转文本
stt:
  provider: "local"                  # "local"（免费） | "groq" | "openai"
  local:
    model: "base"                    # tiny, base, small, medium, large-v3
  # model: "whisper-1"              # 旧版：当未设置 provider 时使用

# 文本转语音
tts:
  provider: "edge"                 # "edge"（免费） | "elevenlabs" | "openai" | "neutts" | "minimax"
  edge:
    voice: "en-US-AriaNeural"      # 322 种声音，74 种语言
  elevenlabs:
    voice_id: "pNInz6obpgDQGcFmaJgB"    # Adam
    model_id: "eleven_multilingual_v2"
  openai:
    model: "gpt-4o-mini-tts"
    voice: "alloy"                 # alloy, echo, fable, onyx, nova, shimmer
    base_url: "https://api.openai.com/v1"  # 可选：覆盖自托管或兼容 OpenAI 的端点
  neutts:
    ref_audio: ''
    ref_text: ''
    model: neuphonic/neutts-air-q4-gguf
    device: cpu
```

### 环境变量

```bash
# 语音转文本提供商（本地无需密钥）
# pip install faster-whisper        # 免费本地 STT —— 无需 API 密钥
GROQ_API_KEY=...                    # Groq Whisper（快速，免费层级）
VOICE_TOOLS_OPENAI_KEY=...         # OpenAI Whisper（付费）

# STT 高级覆盖（可选）
STT_GROQ_MODEL=whisper-large-v3-turbo    # 覆盖默认 Groq STT 模型
STT_OPENAI_MODEL=whisper-1               # 覆盖默认 OpenAI STT 模型
GROQ_BASE_URL=https://api.groq.com/openai/v1     # 自定义 Groq 端点
STT_OPENAI_BASE_URL=https://api.openai.com/v1    # 自定义 OpenAI STT 端点

# 文本转语音提供商（Edge TTS 和 NeuTTS 无需密钥）
ELEVENLABS_API_KEY=***             # ElevenLabs（高质量）
# 上面设置的 VOICE_TOOLS_OPENAI_KEY 也同时启用 OpenAI TTS

# Discord 语音频道
DISCORD_BOT_TOKEN=...
DISCORD_ALLOWED_USERS=...
```

### STT 提供商对比

| 提供商 | 模型 | 速度 | 质量 | 成本 | 是否需要 API 密钥 |
|--------|------|------|------|------|------------------|
| **本地** | `base` | 快（取决于 CPU/GPU） | 良好 | 免费 | 否 |
| **本地** | `small` | 中等 | 更好 | 免费 | 否 |
| **本地** | `large-v3` | 慢 | 最佳 | 免费 | 否 |
| **Groq** | `whisper-large-v3-turbo` | 非常快（~0.5 秒） | 良好 | 免费层级 | 是 |
| **Groq** | `whisper-large-v3` | 快（~1 秒） | 更好 | 免费层级 | 是 |
| **OpenAI** | `whisper-1` | 快（~1 秒） | 良好 | 付费 | 是 |
| **OpenAI** | `gpt-4o-transcribe` | 中等（~2 秒） | 最佳 | 付费 | 是 |

提供商优先级（自动回退）：**本地** > **groq** > **openai**

### TTS 提供商对比

| 提供商 | 质量 | 成本 | 延迟 | 是否需要密钥 |
|--------|------|------|------|--------------|
| **Edge TTS** | 良好 | 免费 | ~1 秒 | 否 |
| **ElevenLabs** | 优秀 | 付费 | ~2 秒 | 是 |
| **OpenAI TTS** | 良好 | 付费 | ~1.5 秒 | 是 |
| **NeuTTS** | 良好 | 免费 | 取决于 CPU/GPU | 否 |

NeuTTS 使用上述 `tts.neutts` 配置块。

---

## 故障排除

### “未找到音频设备”（CLI）

PortAudio 未安装：

```bash
brew install portaudio    # macOS
sudo apt install portaudio19-dev  # Ubuntu
```

### 机器人在 Discord 服务器频道中无响应

默认情况下，机器人在服务器频道中需要 @提及。请确保您：

1. 输入 `@` 并选择**机器人用户**（带 # 标识符），而非同名**角色**
2. 或者改用私信 —— 无需提及
3. 或者在 `~/.hermes/.env` 中设置 `DISCORD_REQUIRE_MENTION=false`

### 机器人加入语音频道但听不到我说话

- 检查您的 Discord 用户 ID 是否在 `DISCORD_ALLOWED_USERS` 中
- 确保您在 Discord 中未被静音
- 机器人需要来自 Discord 的 SPEAKING 事件才能映射您的音频 —— 加入后几秒内开始说话

### 机器人听到我说话但无响应

- 验证 STT 是否可用：安装 `faster-whisper`（无需密钥）或设置 `GROQ_API_KEY` / `VOICE_TOOLS_OPENAI_KEY`
- 检查 LLM 模型是否已配置且可访问
- 查看网关日志：`tail -f ~/.hermes/logs/gateway.log`

### 机器人以文本回复但不在语音频道中说话

- TTS 提供商可能失败 —— 检查 API 密钥和配额
- Edge TTS（免费，无需密钥）是默认回退选项
- 检查日志中的 TTS 错误

### Whisper 返回乱码文本

幻觉过滤器会自动捕获大多数情况。如果您仍收到虚假转录：

- 使用更安静的环境
- 调整配置中的 `silence_threshold`（值越高越不敏感）
- 尝试不同的 STT 模型