---
sidebar_position: 9
title: "语音与 TTS"
description: "跨平台文本转语音和语音消息转录"
---

# 语音与 TTS

Hermes Agent 支持所有消息平台上的文本转语音输出和语音消息转录。

:::tip Nous Subscribers
如果您有付费的 [Nous Portal](https://portal.nousresearch.com) 订阅，您可以通过 **[Tool Gateway](tool-gateway.md)** 使用 OpenAI TTS，无需单独的 OpenAI API 密钥。运行 `hermes model` 或 `hermes tools` 即可启用。
:::

## 文本转语音 (Text-to-Speech)

使用七个提供商将文本转换为语音：

| Provider | Quality | Cost | API Key |
|----------|---------|------|---------|
| **Edge TTS** (default) | Good | Free | None needed |
| **ElevenLabs** | Excellent | Paid | `ELEVENLABS_API_KEY` |
| **OpenAI TTS** | Good | Paid | `VOICE_TOOLS_OPENAI_KEY` |
| **MiniMax TTS** | Excellent | Paid | `MINIMAX_API_KEY` |
| **Mistral (Voxtral TTS)** | Excellent | Paid | `MISTRAL_API_KEY` |
| **Google Gemini TTS** | Excellent | Free tier | `GEMINI_API_KEY` |
| **NeuTTS** | Good | Free | None needed |

### 平台交付

| Platform | Delivery | Format |
|----------|----------|--------|
| Telegram | Voice bubble (plays inline) | Opus `.ogg` |
| Discord | Voice bubble (Opus/OGG), falls back to file attachment | Opus/MP3 |
| WhatsApp | Audio file attachment | MP3 |
| CLI | Saved to `~/.hermes/audio_cache/` | MP3 |

### 配置

```yaml
# In ~/.hermes/config.yaml
tts:
  provider: "edge"              # "edge" | "elevenlabs" | "openai" | "minimax" | "mistral" | "gemini" | "neutts"
  speed: 1.0                    # Global speed multiplier (provider-specific settings override this)
  edge:
    voice: "en-US-AriaNeural"   # 322 voices, 74 languages
    speed: 1.0                  # Converted to rate percentage (+/-%)
  elevenlabs:
    voice_id: "pNInz6obpgDQGcFmaJgB"  # Adam
    model_id: "eleven_multilingual_v2"
  openai:
    model: "gpt-4o-mini-tts"
    voice: "alloy"              # alloy, echo, fable, onyx, nova, shimmer
    base_url: "https://api.openai.com/v1"  # Override for OpenAI-compatible TTS endpoints
    speed: 1.0                  # 0.25 - 4.0
  minimax:
    model: "speech-2.8-hd"     # speech-2.8-hd (default), speech-2.8-turbo
    voice_id: "English_Graceful_Lady"  # See https://platform.minimax.io/faq/system-voice-id
    speed: 1                    # 0.5 - 2.0
    vol: 1                      # 0 - 10
    pitch: 0                    # -12 - 12
  mistral:
    model: "voxtral-mini-tts-2603"
    voice_id: "c69964a6-ab8b-4f8a-9465-ec0925096ec8"  # Paul - Neutral (default)
  gemini:
    model: "gemini-2.5-flash-preview-tts"  # or gemini-2.5-pro-preview-tts
    voice: "Kore"               # 30 prebuilt voices: Zephyr, Puck, Kore, Enceladus, Gacrux, etc.
  neutts:
    ref_audio: ''
    ref_text: ''
    model: neuphonic/neutts-air-q4-gguf
    device: cpu
```

**速度控制**: 全局的 `tts.speed` 值默认应用于所有提供商。每个提供商都可以使用其自身的 `speed` 设置覆盖它（例如，`tts.openai.speed: 1.5`）。提供商特定的速度优先于全局值。默认值为 `1.0`（正常速度）。

### Telegram 语音气泡和 ffmpeg

Telegram 语音气泡需要 Opus/OGG 音频格式：

- **OpenAI、ElevenLabs 和 Mistral** 原生生成 Opus — 无需额外设置
- **Edge TTS** (default) 输出 MP3，需要 **ffmpeg** 进行转换：
- **MiniMax TTS** 输出 MP3，需要 **ffmpeg** 才能转换为 Telegram 语音气泡格式
- **Google Gemini TTS** 输出原始 PCM，并使用 **ffmpeg** 直接编码 Opus 以用于 Telegram 语音气泡
- **NeuTTS** 输出 WAV，也需要 **ffmpeg** 进行转换以用于 Telegram 语音气泡

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Fedora
sudo dnf install ffmpeg
```

如果没有 ffmpeg，Edge TTS、MiniMax TTS 和 NeuTTS 的音频将作为普通音频文件发送（可播放，但显示为矩形播放器而不是语音气泡）。

:::tip
如果您想获得语音气泡而无需安装 ffmpeg，请切换到 OpenAI、ElevenLabs 或 Mistral 提供商。
:::

## 语音消息转录 (STT)

在 Telegram、Discord、WhatsApp、Slack 或 Signal 上发送的语音消息会自动转录，并作为文本注入到对话中。Agent 将转录内容视为普通文本。

| Provider | Quality | Cost | API Key |
|----------|---------|------|---------| 
| **Local Whisper** (default) | Good | Free | None needed |
| **Groq Whisper API** | Good–Best | Free tier | `GROQ_API_KEY` |
| **OpenAI Whisper API** | Good–Best | Paid | `VOICE_TOOLS_OPENAI_KEY` 或 `OPENAI_API_KEY` |

:::info Zero Config
当安装了 `faster-whisper` 时，本地转录开箱即用。如果该库不可用，Hermes 还可以使用来自常见安装位置（如 `/opt/homebrew/bin`）的本地 `whisper` CLI，或通过 `HERMES_LOCAL_STT_COMMAND` 设置自定义命令。
:::

### 配置

```yaml
# In ~/.hermes/config.yaml
stt:
  provider: "local"           # "local" | "groq" | "openai" | "mistral"
  local:
    model: "base"             # tiny, base, small, medium, large-v3
  openai:
    model: "whisper-1"        # whisper-1, gpt-4o-mini-transcribe, gpt-4o-transcribe
  mistral:
    model: "voxtral-mini-latest"  # voxtral-mini-latest, voxtral-mini-2602
```

### 提供商详情

**本地 (faster-whisper)** — 通过 [faster-whisper](https://github.com/SYSTRAN/faster-whisper) 在本地运行 Whisper。默认使用 CPU，如果可用则使用 GPU。模型尺寸：

| Model | Size | Speed | Quality |
|-------|------|-------|---------|
| `tiny` | ~75 MB | Fastest | Basic |
| `base` | ~150 MB | Fast | Good (default) |
| `small` | ~500 MB | Medium | Better |
| `medium` | ~1.5 GB | Slower | Great |
| `large-v3` | ~3 GB | Slowest | Best |

**Groq API** — 需要 `GROQ_API_KEY`。当您需要免费托管的 STT 选项时，这是一个很好的云端备用方案。

**OpenAI API** — 首先接受 `VOICE_TOOLS_OPENAI_KEY`，然后回退到 `OPENAI_API_KEY`。支持 `whisper-1`、`gpt-4o-mini-transcribe` 和 `gpt-4o-transcribe`。

**Mistral API (Voxtral Transcribe)** — 需要 `MISTRAL_API_KEY`。使用 Mistral 的 [Voxtral Transcribe](https://docs.mistral.ai/capabilities/audio/speech_to_text/) 模型。支持 13 种语言、说话人分离和词级时间戳。使用 `pip install hermes-agent[mistral]` 安装。

**自定义本地 CLI 备用** — 如果您希望 Hermes 直接调用本地转录命令，请设置 `HERMES_LOCAL_STT_COMMAND`。该命令模板支持 `{input_path}`、`{output_dir}`、`{language}` 和 `{model}` 占位符。

### 备用行为

如果配置的提供商不可用，Hermes 将自动回退：
- **本地 faster-whisper 不可用** → 在尝试云提供商之前，尝试本地 `whisper` CLI 或 `HERMES_LOCAL_STT_COMMAND`
- **未设置 Groq 密钥** → 回退到本地转录，然后是 OpenAI
- **未设置 OpenAI 密钥** → 回退到本地转录，然后是 Groq
- **未设置 Mistral 密钥/SDK** → 在自动检测中跳过；继续尝试下一个可用提供商
- **无可用提供商** → 语音消息将原样通过，并向用户提供准确的说明。