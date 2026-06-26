---
sidebar_position: 9
title: "Voice & TTS"
description: "Text-to-speech and voice message transcription across all platforms"
---

# 语音与TTS

Hermes Agent 支持所有消息平台上的文本转语音输出和语音消息转录。

:::tip Nous Subscribers
如果您有付费的 [Nous Portal](https://portal.nousresearch.com) 订阅，则无需单独的 OpenAI API 密钥即可通过 **[Tool Gateway](tool-gateway.md)** 使用 OpenAI TTS。新安装的用户可以运行 `hermes setup --portal` 进行登录并一次性开启所有网关工具；现有安装的用户可以通过 `hermes model` 或 `hermes tools` 选择 **Nous Subscription** 来使用 TTS 功能。
:::

## 文本转语音

使用十个提供商将文本转换为语音：

| Provider | Quality | Cost | API Key |
|----------|---------|------|---------|
| **Edge TTS** (默认) | Good | Free | None needed |
| **ElevenLabs** | Excellent | Paid | `ELEVENLABS_API_KEY` |
| **OpenAI TTS** | Good | Paid | `VOICE_TOOLS_OPENAI_KEY` |
| **MiniMax TTS** | Excellent | Paid | `MINIMAX_API_KEY` |
| **Mistral (Voxtral TTS)** | Excellent | Paid | `MISTRAL_API_KEY` |
| **Google Gemini TTS** | Excellent | Free tier | `GEMINI_API_KEY` |
| **xAI TTS** | Excellent | Paid | `XAI_API_KEY` |
| **NeuTTS** | Good | Free (local) | None needed |
| **KittenTTS** | Good | Free (local) | None needed |
| **Piper** | Good | Free (local) | None needed |

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
  provider: "edge"              # "edge" | "elevenlabs" | "openai" | "minimax" | "mistral" | "gemini" | "xai" | "neutts" | "kittentts" | "piper"
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
    model: "gemini-2.5-flash-preview-tts"  # or gemini-3.1-flash-tts-preview
    voice: "Kore"               # 30 prebuilt voices: Zephyr, Puck, Kore, Enceladus, Gacrux, etc.
    audio_tags: false           # Enable hidden Gemini 3.1 TTS audio-tag insertion
    persona_prompt_file: ""      # Optional Markdown/text file with Gemini voice direction
  xai:
    voice_id: "eve"             # or a custom voice ID — see docs below
    language: "en"              # ISO 639-1 code
    sample_rate: 24000          # 22050 / 24000 (default) / 44100 / 48000
    bit_rate: 128000            # MP3 bitrate; only applies when codec=mp3
    # base_url: "https://api.x.ai/v1"   # Override via XAI_BASE_URL env var
  neutts:
    ref_audio: ''
    ref_text: ''
    model: neuphonic/neutts-air-q4-gguf
    device: cpu
  kittentts:
    model: KittenML/kitten-tts-nano-0.8-int8   # 25MB int8; also: kitten-tts-micro-0.8 (41MB), kitten-tts-mini-0.8 (80MB)
    voice: Jasper                               # Jasper, Bella, Luna, Bruno, Rosie, Hugo, Kiki, Leo
    speed: 1.0                                  # 0.5 - 2.0
    clean_text: true                            # Expand numbers, currencies, units
  piper:
    voice: en_US-lessac-medium                  # voice name (auto-downloaded) OR absolute path to .onnx
    # voices_dir: ''                            # default: ~/.hermes/cache/piper-voices/
    # use_cuda: false                           # requires onnxruntime-gpu
    # length_scale: 1.0                         # 2.0 = twice as slow
    # noise_scale: 0.667
    # noise_w_scale: 0.8
    # volume: 1.0                               # 0.5 = half as loud
    # normalize_audio: true
```

**速度控制**: 全局 `tts.speed` 值默认为所有提供商适用。每个提供商都可以用其自己的 `speed` 设置进行覆盖（例如，`tts.openai.speed: 1.5`）。提供商特定的速度优先于全局值。默认值为 `1.0`（正常速度）。

### Gemini 人设提示 (Persona Prompts)

Gemini TTS 可以遵循自然语言的表演指导。将 `tts.gemini.persona_prompt_file` 设置为描述语音人设的本地 Markdown 或文本文件。该文件可以包含 `AUDIO PROFILE`、`SCENE`、`DIRECTOR'S NOTES`、`SAMPLE CONTEXT` 和 `TRANSCRIPT` 等 Gemini 风格的部分。

如果文件中包含 `{transcript}` 或 `{{ transcript }}`, Hermes 会用实时 TTS 文本替换该占位符。否则，Hermes 会自动附加一个带标签的 `TRANSCRIPT` 部分。人设提示保持本地化，不会显示在聊天回复中。

```yaml
tts:
  provider: gemini
  gemini:
    voice: Algieba
    persona_prompt_file: ~/.hermes/tts/butler-voice.md
```

### Gemini 音频标签 (Audio Tags)

Gemini 3.1 Flash TTS 支持自由形式的方括号音频标签，例如 `[whispers]`、`[excitedly]`、`[very slow]`、`[laughs]` 和其他表现力强的交付说明。启用 `tts.gemini.audio_tags`，Hermes 就会在 Gemini TTS 之前运行一个隐藏的重写过程。该重写操作只将内联标签插入到 TTS 脚本中；可见的聊天回复保持不变。

```yaml
tts:
  provider: gemini
  gemini:
    model: gemini-3.1-flash-tts-preview
    audio_tags: true
```

该重写操作使用 `auxiliary.tts_audio_tags`，并默认使用您的主聊天模型。如果您希望由更便宜或更快的模型处理标签插入，则可以覆盖此辅助任务。


### 输入长度限制

每个提供商都有一个文档化的每次请求输入字符上限。Hermes 在调用提供商之前截断文本，从而确保请求不会因长度错误而失败：

| Provider | Default cap (chars) |
|----------|---------------------|
| Edge TTS | 5000 |
| OpenAI | 4096 |
| xAI | 15000 |
| MiniMax | 10000 |
| Mistral | 4000 |
| Google Gemini | 32000 |
| ElevenLabs | Model-aware (see below) |
| NeuTTS | 2000 |
| KittenTTS | 2000 |
| Piper | 5000 |

**ElevenLabs** 根据配置的 `model_id` 选择一个上限：

| `model_id` | Cap (chars) |
|------------|-------------|
| `eleven_flash_v2_5` | 40000 |
| `eleven_flash_v2` | 30000 |
| `eleven_multilingual_v2` (default), `eleven_multilingual_v1`, `eleven_english_sts_v2`, `eleven_english_sts_v1` | 10000 |
| `eleven_v3`, `eleven_ttv_v3` | 5000 |
| Unknown model | Falls back to provider default (10000) |

**按提供商覆盖**，在 TTS 配置的提供商部分下添加 `max_text_length:`：

```yaml
tts:
  openai:
    max_text_length: 8192   # raise or lower the provider cap
```

只接受正整数。零、负数、非数字或布尔值将回退到提供商默认值，因此配置错误不会意外禁用截断功能。

### Telegram 音频气泡和 ffmpeg

Telegram 音频气泡需要 Opus/OGG 格式：

- **OpenAI、ElevenLabs 和 Mistral** 原生支持 Opus — 无需额外设置
- **Edge TTS** (默认) 输出 MP3，需要 **ffmpeg** 进行转换：
- **MiniMax TTS** 输出 MP3，需要 **ffmpeg** 进行转换以用于 Telegram 音频气泡
- **Google Gemini TTS** 输出原始 PCM，并使用 **ffmpeg** 直接编码 Opus 以用于 Telegram 音频气泡
- **xAI TTS** 输出 MP3，需要 **ffmpeg** 进行转换以用于 Telegram 音频气泡
- **NeuTTS** 输出 WAV，也需要 **ffmpeg** 进行转换以用于 Telegram 音频气泡
- **KittenTTS** 输出 WAV，也需要 **ffmpeg** 进行转换以用于 Telegram 音频气泡
- **Piper** 输出 WAV，也需要 **ffmpeg** 进行转换以用于 Telegram 音频气泡

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Fedora
sudo dnf install ffmpeg
```

如果没有 ffmpeg，Edge TTS、MiniMax TTS、NeuTTS、KittenTTS 和 Piper 的音频将作为常规音频文件发送（可播放，但显示为矩形播放器而不是语音气泡）。

:::tip
如果您想在不安装 ffmpeg 的情况下获得语音气泡，请切换到 OpenAI、ElevenLabs 或 Mistral 提供商。
:::

### xAI 自定义声音 (声音克隆)

xAI 支持克隆您的声音并将其用于 TTS。在 [xAI Console](https://console.x.ai/team/default/voice/voice-library) 中创建自定义声音，然后将生成的 `voice_id` 设置到您的配置中：

```yaml
tts:
  provider: xai
  xai:
    voice_id: "nlbqfwie"   # your custom voice ID
```

请参阅 [xAI 自定义声音文档](https://docs.x.ai/developers/model-capabilities/audio/custom-voices) 以获取有关录音、支持格式和限制的详细信息。

### Piper (本地，44 种语言)

Piper 是来自 Open Home Foundation（Home Assistant 的维护者）的一个快速本地神经 TTS 引擎。它完全在 CPU 上运行，支持预训练声音的 **44 种语言**，并且不需要 API 密钥。

**通过 `hermes tools` 安装** → Voice & TTS → Piper — Hermes 会为您运行 `pip install piper-tts`。或者手动安装：`pip install piper-tts`。

**切换到 Piper:**

```yaml
tts:
  provider: piper
  piper:
    voice: en_US-lessac-medium
```

对于本地未缓存的声音，Hermes 会运行 `python -m piper.download_voices <name>` 并将模型（取决于质量级别，约 20-90MB）下载到 `~/.hermes/cache/piper-voices/` 中。后续调用会重用缓存的模型。

**选择声音。** [完整的语音目录](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/VOICES.md) 涵盖了英语、西班牙语、法语、德语、意大利语、荷兰语、葡萄牙语、俄语、波兰语、土耳其语、中文、阿拉伯语、印地语等——每个语言都具有 `x_low` / `low` / `medium` / `high` 质量级别。可在 [rhasspy.github.io/piper-samples](https://rhasspy.github.io/piper-samples/) 采样声音。

**使用预下载的声音。** 将 `tts.piper.voice` 设置为以 `.onnx` 结尾的绝对路径：

```yaml
tts:
  piper:
    voice: /path/to/my-custom-voice.onnx
```

**高级旋钮** (`tts.piper.length_scale` / `noise_scale` / `noise_w_scale` / `volume` / `normalize_audio`, `use_cuda`) 与 Piper 的 `SynthesisConfig` 1:1 对应。它们在旧版本的 `piper-tts` 上被忽略。

### 自定义命令提供商 (Custom command providers)

如果您想要的 TTS 引擎没有原生支持（VoxCPM、MLX-Kokoro、XTTS CLI、一个声音克隆脚本，任何其他暴露了 CLI 的工具），您可以将其作为**命令类型提供商**集成，而无需编写任何 Python。Hermes 将输入文本写入一个临时 UTF-8 文件，运行您的 shell 命令，然后读取该命令生成的音频文件。

在 `tts.providers.<name>` 下声明一个或多个提供商，并使用 `tts.provider: <name>` 在它们之间切换——方法与您在 `edge` 和 `openai` 等内置提供商之间切换是相同的。

```yaml
tts:
  provider: voxcpm                 # pick any name under tts.providers
  providers:
    voxcpm:
      type: command
      command: "voxcpm --ref ~/voice.wav --text-file {input_path} --out {output_path}"
      output_format: mp3
      timeout: 180
      voice_compatible: true       # try to deliver as a Telegram voice bubble

    mlx-kokoro:
      type: command
      command: "python -m mlx_kokoro --in {input_path} --out {output_path} --voice {voice}"
      voice: af_sky
      output_format: wav

    piper-custom:                  # native Piper also supports custom .onnx via tts.piper.voice
      type: command
      command: "piper -m /path/to/custom.onnx -f {output_path} < {input_path}"
      output_format: wav
```

#### 示例：Doubao (Chinese seed-tts-2.0)

对于 ByteDance [seed-tts-2.0](https://www.volcengine.com/docs/6561/1257544) 双向流式 API 的高质量中文 TTS，请安装 [`doubao-speech`](https://pypi.org/project/doubao-speech/) PyPI 包并将其作为命令提供商集成：

```bash
pip install doubao-speech
export VOLCENGINE_APP_ID="your-app-id"
export VOLCENGINE_ACCESS_TOKEN="your-access-token"
```

```yaml
tts:
  provider: doubao
  providers:
    doubao:
      type: command
      command: "doubao-speech say --text-file {input_path} --out {output_path}"
      output_format: mp3
      max_text_length: 1024
      timeout: 30
```

凭证来自您的 shell 环境（`VOLCENGINE_APP_ID` / `VOLCENGINE_ACCESS_TOKEN`）或 `~/.doubao-speech/config.yaml`。通过向命令添加 `--voice zh-female-warm`（或从 `doubao-speech list-voices` 获取的任何其他别名）来选择声音。`doubao-speech` 还捆绑了流式 ASR — 请参阅 [下方 #example-doubao--volcengine-asr](https://github.com/Hypnus-Yuan/doubao-speech) 的 Hermes 集成部分。来源和完整文档：[github.com/Hypnus-Yuan/doubao-speech](https://github.com/Hypnus-Yuan/doubao-speech)。

#### 占位符 (Placeholders)

您的命令模板可以引用这些占位符。Hermes 在渲染时替换它们，并为周围的上下文（裸引号 / 单引号 / 双引号）对每个值进行 shell 引号化，因此包含空格和其他 shell 敏感字符的路径是安全的。

| Placeholder | Meaning |
|---|---|
| `{input_path}` | Hermes 写入的临时 UTF-8 文本文件的路径 |
| `{text_path}` | `{input_path}` 的别名 |
| `{output_path}` | 命令必须写入音频文件的路径 |
| `{format}` | `mp3` / `wav` / `ogg` / `flac` |
| `{voice}` | `tts.providers.<name>.voice`，未设置时为空 |
| `{model}` | `tts.providers.<name>.model` |
| `{speed}` | 已解析的速度乘数（提供商或全局） |

使用 `{{` 和 `}}` 表示字面量大括号。

#### 可选键 (Optional keys)

| Key | Default | Meaning |
|---|---|---|
| `timeout` | `120` | 秒；进程树在到期时被杀死（Unix `killpg`，Windows `taskkill /T`）。 |
| `output_format` | `mp3` | `mp3` / `wav` / `ogg` / `flac` 中的一个。如果 Hermes 选择了路径，则自动从输出扩展名推断。 |
| `voice_compatible` | `false` | 当为 `true` 时，Hermes 会通过 ffmpeg 将 MP3/WAV 输出转换为 Opus/OGG，以便 Telegram 可以渲染语音气泡。 |
| `max_text_length` | `5000` | 在渲染命令之前将输入截断到此长度。 |
| `voice` / `model` | empty | 仅作为占位符值传递给命令。 |

#### 行为说明 (Behavior notes)

- **内置名称始终优先。** `tts.providers.openai` 条目永远不会覆盖原生 OpenAI 提供商，因此没有任何用户配置可以静默地替换内置提供商。
- **默认交付形式是文档。** 命令提供商在每个平台上都以常规音频附件的形式交付。通过设置 `voice_compatible: true` 来选择按提供商进行语音气泡交付。
- **命令失败会暴露给智能体。** 非零退出、空输出或超时都会返回一个包含命令 stderr/stdout 的错误，以便您可以从对话中调试该提供商。
- **`type: command` 是设置了 `command:` 时的默认值。** 显式编写 `type: command` 是良好的实践，但不是必需的；带有非空 `command` 字符串的条目将被视为命令提供商。
- **`{input_path}` / `{text_path}` 是可互换使用的。** 使用在您的命令中阅读起来更顺畅的一个。

#### 安全性 (Security)

命令类型的提供商运行您配置的任何 shell 命令，使用您的用户权限。Hermes 会引用占位符值并强制执行配置的超时，但命令模板本身是受信任的本地输入——请像对待 PATH 上的 shell 脚本一样对待它。

### Python 插件提供商 (Python plugin providers)

对于无法表示为单个 shell 命令的 TTS 引擎（没有 CLI 的 Python SDK、流式引擎、声音列表 API、OAuth 刷新认证），请通过 `ctx.register_tts_provider()` 注册一个 Python 插件。该插件**与**[自定义命令提供商](#custom-command-providers) 注册表共存（不取代它）；选择最适合您的引擎的表面。

#### 何时选择哪个

| 您的后端具有... | 使用 |
|---|---|
| 一个从文件/stdin 读取文本并写入文件/stdout 的单个 CLI | **命令提供商** (无需 Python) |
| 两个或三个通过 shell pipe 连接的 CLI | **命令提供商** |
| 仅有一个 Python SDK — 没有 CLI | **插件** |
| 您想分块交付的流式字节（生成过程中的语音气泡） | **插件** (覆盖 `stream()`) |
| 由 `hermes setup` 使用的声音列表 API | **插件** (覆盖 `list_voices()`) |
| OAuth 刷新流程（而不是静态的 bearer token） | **插件** |

内置提供商始终优先，命令提供商优于同名的插件——因此插件可以安全地注册到任何非内置名称，而不用担心会覆盖现有配置。

#### 最小化插件 (Minimal plugin)

将其放入 `~/.hermes/plugins/my-tts/`：

`plugin.yaml`:
```yaml
name: my-tts
version: 0.1.0
description: "My custom Python TTS backend"
```

`__init__.py`:
```python
from agent.tts_provider import TTSProvider


class MyTTSProvider(TTSProvider):
    @property
    def name(self) -> str:
        return "my-tts"  # what tts.provider matches against

    @property
    def display_name(self) -> str:
        return "My Custom TTS"

    def is_available(self) -> bool:
        # Return False when credentials/deps are missing — picker skips
        # this row but the dispatcher still routes here on explicit config.
        import os
        return bool(os.environ.get("MY_TTS_API_KEY"))

    def synthesize(self, text, output_path, *, voice=None, model=None,
                   speed=None, format="mp3", **extra) -> str:
        # Write audio bytes to output_path, return the path.
        # Raise on failure — the dispatcher converts exceptions to a
        # standard error envelope.
        import my_tts_sdk
        client = my_tts_sdk.Client()
        audio_bytes = client.synthesize(text=text, voice=voice or "default")
        with open(output_path, "wb") as f:
            f.write(audio_bytes)
        return output_path


def register(ctx):
    ctx.register_tts_provider(MyTTSProvider())
```

启用它（`hermes plugins enable my-tts`），将 `tts.provider` 指向它（在 `config.yaml` 中设置 `tts.provider: my-tts`），`text_to_speech` 工具就会通过您的插件进行路由。

#### 可选钩子 (Optional hooks)

在您的提供商类上覆盖这些方法以实现更丰富的集成：

- `list_voices()` → 显示在 `hermes tools` 中的 `{id, display, language, gender, preview_url}` 字典列表。
- `list_models()` → 显示 `{id, display, languages, max_text_length}` 字典列表。
- `get_setup_schema()` → 返回 `{name, badge, tag, env_vars: [{key, prompt, url}]}`，用于驱动 `hermes tools` / `hermes setup` 中的选择器行。如果没有此方法，插件仍然可用，但其在选择器中的行将是最小化的。
- `stream(text, *, voice, model, format, **extra)` → 迭代生成音频字节以实现流式交付（默认抛出 `NotImplementedError`）。
- `voice_compatible` 属性 → 如果您的输出是 Opus 兼容的，并且网关应该将其作为语音气泡交付，则设置为 `True` (默认 `False` = 常规音频附件)。

请参阅 `agent/tts_provider.py` 以获取包含文档字符串的完整 ABC。

## 语音消息转录 (STT)

发送在 Telegram、Discord、WhatsApp、Slack 或 Signal 上的语音消息会被自动转录并作为文本注入到对话中。智能体会像接收普通文本一样看到这些转录内容。

| 提供商 | 质量 | 成本 | API 密钥 |
|----------|---------|------|---------|
| **Local Whisper** (默认) | 良好 | 免费 | 无需提供 |
| **Groq Whisper API** | 良好–最佳 | 免费层级 | `GROQ_API_KEY` |
| **OpenAI Whisper API** | 良好–最佳 | 付费 | `VOICE_TOOLS_OPENAI_KEY` 或 `OPENAI_API_KEY` |

:::info 无需配置
当安装了 `faster-whisper` 时，本地转录功能即可开箱使用。如果无法使用，Hermes 也可以通过常见的安装位置（如 `/opt/homebrew/bin`）或通过 `HERMES_LOCAL_STT_COMMAND` 指定自定义命令来使用本地的 `whisper` CLI。
:::

### 配置

```yaml
# 在 ~/.hermes/config.yaml 中
stt:
  provider: "local"           # "local" | "groq" | "openai" | "mistral" | "xai"
  local:
    model: "base"             # tiny, base, small, medium, large-v3
  openai:
    model: "whisper-1"        # whisper-1, gpt-4o-mini-transcribe, gpt-4o-transcribe
  mistral:
    model: "voxtral-mini-latest"  # voxtral-mini-latest, voxtral-mini-2602
  xai:
    model: "grok-stt"         # xAI Grok STT
```

### 提供商详情

**Local (faster-whisper)** — 通过 [faster-whisper](https://github.com/SYSTRAN/faster-whisper) 在本地运行 Whisper。默认使用 CPU，如果可用则使用 GPU。模型大小：

| 模型 | 大小 | 速度 | 质量 |
|-------|------|-------|---------|
| `tiny` | ~75 MB | 最快 | 基本 |
| `base` | ~150 MB | 快 | 良好 (默认) |
| `small` | ~500 MB | 中等 | 更佳 |
| `medium` | ~1.5 GB | 较慢 | 优秀 |
| `large-v3` | ~3 GB | 最慢 | 最佳 |

**Groq API** — 需要 `GROQ_API_KEY`。当您需要一个免费的托管 STT 选项时，这是一个良好的云端备选方案。

**OpenAI API** — 优先接受 `VOICE_TOOLS_OPENAI_KEY`，然后回退到 `OPENAI_API_KEY`。支持 `whisper-1`、`gpt-4o-mini-transcribe` 和 `gpt-4o-transcribe`。

**Mistral API (Voxtral Transcribe)** — 需要 `MISTRAL_API_KEY`。使用 Mistral 的 [Voxtral Transcribe](https://docs.mistral.ai/capabilities/audio/speech_to_text/) 模型。支持 13 种语言、说话者切分和词级时间戳。通过 `cd ~/.hermes/hermes-agent && uv pip install -e ".[mistral]"` 进行安装。

**xAI Grok STT** — 需要 `XAI_API_KEY`。以 multipart/form-data 格式 POST 到 `https://api.x.ai/v1/stt`。如果您已经在使用 xAI 进行聊天或 TTS，并希望一个 API 密钥解决所有问题，这是一个很好的选择。自动检测顺序将其排在 Groq 之后——要强制使用它，请显式设置 `stt.provider: xai`。

**自定义本地 CLI 回退方案** — 如果您想让 Hermes 直接调用本地转录命令，请设置 `HERMES_LOCAL_STT_COMMAND`。该命令模板支持 `{input_path}`、`{output_dir}`、`{language}` 和 `{model}` 占位符。您的命令必须将 `.txt` 转录文件写入到 `{output_dir}` 下的某个位置。

#### 示例：Doubao / Volcengine ASR

如果您使用 [`doubao-speech`](https://pypi.org/project/doubao-speech/) 进行 Doubao TTS（参见 [上方](#example-doubao-chinese-seed-tts-20)），则同一个包通过本地命令 STT 接口处理语音到文本。

```bash
pip install doubao-speech
export VOLCENGINE_APP_ID="your-app-id"
export VOLCENGINE_ACCESS_TOKEN="your-access-token"
export HERMES_LOCAL_STT_COMMAND='doubao-speech transcribe {input_path} --out {output_dir}/transcript.txt'
```

```yaml
stt:
  provider: local_command
```

Hermes 将传入的语音消息写入 `{input_path}`，运行该命令，并读取 `{output_dir}` 下生成的 `.txt` 文件。语言由 Volcengine bigmodel 端点自动检测。

### 回退行为

如果配置的提供商不可用，Hermes 会自动回退：
- **Local faster-whisper 不可用** → 在云端提供商之前尝试本地 `whisper` CLI 或 `HERMES_LOCAL_STT_COMMAND`
- **Groq 密钥未设置** → 回退到本地转录，然后是 OpenAI
- **OpenAI 密钥未设置** → 回退到本地转录，然后是 Groq
- **Mistral 密钥/SDK 未设置** → 在自动检测中跳过；流向下一个可用的提供商
- **均不可用** → 语音消息会通过，并附带一条准确的提示给用户

### STT 自定义命令提供商

如果所需的 STT 引擎不是原生支持的（例如 Doubao ASR、NVIDIA Parakeet、whisper.cpp 构建版本、开源 SenseVoice CLI 或任何暴露 shell 命令的其他工具），则将其作为**命令类型提供商**集成，无需编写 Python 代码。Hermes 会运行您的 shell 命令来处理音频文件，并读取转录文本。

在 `stt.providers.<name>` 下声明一个或多个提供商，并通过 `stt.provider: <name>` 之间切换——其结构与 TTS 的 [命令提供商注册表](#custom-command-providers) 相同，但适用于 input=audio → output=transcript 方向。

```yaml
stt:
  provider: parakeet                # 选择 stt.providers 下的任意名称
  providers:
    parakeet:
      type: command
      command: "parakeet-asr --model nvidia/parakeet-tdt-0.6b-v2 --in {input_path} --out {output_path}"
      format: txt
      language: en
      timeout: 300

    whispercpp:
      type: command
      command: "whisper-cli -m ~/models/ggml-large-v3.bin -f {input_path} -otxt -of {output_dir}/transcript"
      format: txt

    sensevoice:
      type: command
      command: "sensevoice-cli {input_path} --json | tee {output_path}"
      format: json
```

这补充了遗留的 `HERMES_LOCAL_STT_COMMAND` 逃生舱——该环境变量仍然通过内置的 `local_command` 路径保持原样工作。当您需要**多个**由 shell 驱动的 STT 引擎、可以通过 `stt.provider` 选择的名称，或任何需要每个提供商特定的 `language` / `model` / `timeout` 时，请使用 `stt.providers.<name>`。

#### STT 占位符

您的命令模板可以引用这些占位符。Hermes 会在渲染时替换它们，并对周围的上下文（裸引号/单引号/双引号）进行 shell 引号化，因此带有空格的路径是安全的。

| 占位符 | 含义 |
|---|---|
| `{input_path}` | 输入音频文件的绝对路径（原始位置，只读） |
| `{output_path}` | 命令应将转录文件写入的绝对路径 |
| `{output_dir}` | `{output_path}` 的父目录（对于 whisper 风格的工具非常方便） |
| `{format}` | 配置的输出格式：`txt` / `json` / `srt` / `vtt` |
| `{language}` | 配置的语言代码（默认为 `en`） |
| `{model}` | `stt.providers.<name>.model`，未设置时为空 |

使用 `{{` 和 `}}` 来表示字面括号（当在命令中嵌入 JSON 片段时非常方便）。

#### 转录文本如何被读取回传

您的命令成功退出后：

1. 如果 `{output_path}` 存在且不为空 → Hermes 将其作为 UTF-8 文本读取。
2. 否则，如果命令写入了标准输出（stdout）→ Hermes 使用它。
3. 否则 → 错误：“命令 STT 提供商未写入输出文件且未产生标准输出。”

这允许您使用该注册表既用于文件写入的 CLI（`whisper-cli`、`parakeet-asr`），也用于将转录文本发射到 stdout 的 curl 风格单行命令（`curl … | jq -r .text`）。

对于 `format: json` / `srt` / `vtt`，Hermes 将原始文件内容作为 `transcript` 字段返回。从 JSON 中提取 `.text` 超出了运行器的范围——请配置 `format: txt`，或在下游进行 JSON 后处理。

#### STT 命令提供商可选密钥

| 键 | 默认值 | 含义 |
|---|---|---|
| `timeout` | `300` | 秒；进程树将在超时时被杀死（Unix `start_new_session`，Windows `taskkill /T`）。 |
| `format` | `txt` | `txt` / `json` / `srt` / `vtt` 中的一个。设置 `{output_path}` 的扩展名。 |
| `language` | `en` | 转发给 `{language}`。默认为 `stt.language`，然后是 `en`。 |
| `model` | 空 | 转发给 `{model}`。`transcribe_audio()` 中的 `model=` 参数会覆盖此项。 |

#### STT 命令提供商行为说明

- **内置功能始终优先。** 声明 `stt.providers.openai: type: command` 不会覆盖真正的 OpenAI Whisper 处理程序。内置名称在命令提供商解析器运行之前就会被短路（short-circuited）。
- **进程树清理。** 一个运行超过 `timeout` 的命令其整个进程树都会被杀死，而不仅仅是 shell 包装器。对于分叉模型加载子进程的长时间运行 ASR 流水线，可以可靠地进行收割（reaped）。
- **Shell 引号化是自动的。** 位于 `'...'` 中的占位符会获得单引号安全的转义；位于 `"..."` 中的占位符会获得 `$`/``` ` /`"` 的转义；在引号外部则使用 `shlex.quote`。请勿预先引用占位符的值。

#### STT 命令提供商安全

Shell 命令是在与 Hermes 相同的用户下运行的，拥有完整的文件系统访问权限——这与 `tts.providers.<name>: type: command` 和 `HERMES_LOCAL_STT_COMMAND` 具有相同的信任模型。请仅声明您信任来源的命令提供商。

### Python 插件提供商 (STT)

对于不是内置功能，且无法用 shell 命令表达的 STT 引擎（需要 Python SDK、OAuth 刷新认证、流式分块等），可以通过 `ctx.register_transcription_provider()` 注册一个 Python 插件。该插件**与**6 个内置提供商（`local`、`local_command`、`groq`、`openai`、`mistral`、`xai`）以及 `stt.providers.<name>: type: command` 注册表共存——内置功能保持其原生实现，并在名称冲突时始终获胜；命令提供商在同名插件之上获胜（配置比插件安装更本地化）。

#### 何时选择哪种方式 (STT)

| 后端具备... | 使用方法 |
|---|---|
| 一个接收音频文件并输出文本的单一 shell 命令 | `stt.providers.<name>: type: command` (无需 Python) |
| 仅需要遗留的单命令逃生舱 | `HERMES_LOCAL_STT_COMMAND` 环境变量 (保留用于向后兼容) |
| 一个没有 CLI 的 Python SDK | `register_transcription_provider()` 插件 |
| OAuth 刷新认证、流式分块、语音列表元数据 | `register_transcription_provider()` 插件 |
| 内置功能已涵盖（`local`、`groq`、`openai` 等） | 设置 `stt.provider: <name>` — 内置功能是内联的 |

#### 解析顺序

1. **`stt.provider` 是一个内置名称** → 内置分派。**始终获胜。**
2. **`stt.provider` 匹配设置了 `command:` 的 `stt.providers.<name>`** → 命令提供商运行器（参见 [STT 自定义命令提供商](#stt-custom-command-providers)）。优于同名插件。
3. **`stt.provider` 匹配一个已注册的插件 `TranscriptionProvider`** → 插件分派：
   - 如果插件的 `is_available()` 返回 `False`（缺少凭证或 SDK），则调用会抛出一个识别该插件的不可用性错误包——而不是通用的“没有可用的 STT 提供商”消息。
   - 否则，会使用 `model`（来自公共的 `model=` 参数，回退到 `stt.<provider>.model`）和 `language`（来自 `stt.<provider>.language`）来调用插件的 `transcribe()` 方法。
4. **无匹配** → “没有可用的 STT 提供商”错误。

#### 每个提供商的配置命名空间

插件从 `config.yaml` 中的 `stt.<provider>` 读取其每个提供商的配置，这与内置功能读取 `stt.openai.model` / `stt.mistral.model` 的方式相同：

```yaml
stt:
  provider: my-stt
  my-stt:
    model: whisper-large-v3
    language: ja          # forwarded as language= to transcribe()
    # any other plugin-specific keys go here; read them via your
    # own config.yaml access in __init__/is_available/transcribe
```

分派器会从这部分转发 `model` 和 `language`；其他所有内容，插件都可以自行读取。

#### 最小化插件

将此内容放入 `~/.hermes/plugins/my-stt/` 下：

`plugin.yaml`:
```yaml
name: my-stt
version: 0.1.0
description: "My custom Python STT backend"
```

`__init__.py`:
```python
from agent.transcription_provider import TranscriptionProvider

class MySTTProvider(TranscriptionProvider):
    @property
    def name(self) -> str:
        return "my-stt"  # what stt.provider matches against

    @property
    def display_name(self) -> str:
        return "My Custom STT"

    def is_available(self) -> bool:
        # Return False when credentials/deps are missing — picker skips
        # this row but the dispatcher still routes here on explicit config.
        import os
        return bool(os.environ.get("MY_STT_API_KEY"))

    def transcribe(self, file_path, *, model=None, language=None, **extra):
        # Return the standard transcribe envelope:
        #   {"success": bool, "transcript": str, "provider": str, "error": str}
        # Do NOT raise — convert exceptions to the error envelope so the
        # gateway/CLI caller sees a consistent shape on failure.
        try:
            import my_stt_sdk
            client = my_stt_sdk.Client()
            text = client.transcribe(open(file_path, "rb"))
            return {
                "success": True,
                "transcript": text,
                "provider": "my-stt",
            }
        except Exception as exc:
            return {
                "success": False,
                "transcript": "",
                "error": f"my-stt failed: {exc}",
                "provider": "my-stt",
            }

def register(ctx):
    ctx.register_transcription_provider(MySTTProvider())
```

启用它（`hermes plugins enable my-stt`），在 `config.yaml` 中设置 `stt.provider: my-stt`，语音消息的转录将通过你的插件进行路由。

#### 可选钩子

在你的提供者类上重写这些方法，以实现更丰富的集成：

- `list_models()` → 包含 `{id, display, languages, max_audio_seconds}` 字典的列表。
- `default_model()` → 当用户未覆盖模型时返回的字符串。
- `get_setup_schema()` → 返回 `{name, badge, tag, env_vars: [{key, prompt, url}]}`，用于驱动 `hermes tools` / `hermes setup` 中的选择器行（STT 的选择器类别尚未发布 — 这些元数据可供插件使用以实现向前兼容性）。

请参阅 `agent/transcription_provider.py`，了解包含文档字符串的完整抽象基类（ABC）。