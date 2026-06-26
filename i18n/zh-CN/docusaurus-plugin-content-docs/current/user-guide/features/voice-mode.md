---
sidebar_position: 10
title: "Voice Mode"
description: "Real-time voice conversations with Hermes Agent — CLI, Telegram, Discord (DMs, text channels, and voice channels)"
---

# Voice Mode

Hermes 智能体在 CLI 和消息平台上支持完整的语音交互。使用麦克风与智能体对话，听取语音回复，并在 Discord 语音频道中进行实时语音通话。

如果你需要一个包含推荐配置和实际使用模式的实用设置指南，请参阅[在 Hermes 中使用语音模式](/guides/use-voice-mode-with-hermes)。

## 前置条件

在使用语音功能之前，请确保你已具备以下条件：

1. **已安装 Hermes 智能体** — 通过安装脚本安装（请参阅[安装指南](/getting-started/installation)）
2. **已配置 LLM 提供商** — 运行 `hermes model` 或在 `~/.hermes/.env` 中设置你首选的提供商凭据
3. **可用的基础配置** — 运行 `hermes` 以验证智能体在启用语音前能正常响应文本

:::tip
`~/.hermes/` 目录和默认的 `config.yaml` 会在你首次运行 `hermes` 时自动创建。你只需手动创建 `~/.hermes/.env` 来存放 API 密钥。
:::

:::tip Nous Portal 涵盖两者
付费的 [Nous Portal](/user-guide/features/tool-gateway) 订阅可同时提供 LLM（第 2 步）**以及**通过 Tool Gateway 提供的 OpenAI TTS — 无需单独的 OpenAI 密钥。在新安装中，`hermes setup --portal` 可一次性完成两者的配置。
:::

## 概述

| 功能 | 平台 | 说明 |
|---------|----------|-------------|
| **交互式语音** | CLI | 按 Ctrl+B 录音，智能体自动检测静默并回复 |
| **自动语音回复** | Telegram, Discord | 智能体在文字回复的同时发送语音音频 |
| **语音频道** | Discord | 机器人加入语音频道，聆听用户发言，用语音回复 |

## 依赖

### Python 包

```bash
# CLI 语音模式（麦克风 + 音频播放）
cd ~/.hermes/hermes-agent && uv pip install -e ".[voice]"

# Discord + Telegram 消息（包含 discord.py[voice] 用于语音频道支持）
cd ~/.hermes/hermes-agent && uv pip install -e ".[messaging]"

# 高级 TTS（ElevenLabs）
cd ~/.hermes/hermes-agent && uv pip install -e ".[tts-premium]"

# 本地 TTS（NeuTTS，可选）
python -m pip install -U neutts[all]

# 一次性安装全部
cd ~/.hermes/hermes-agent && uv pip install -e ".[all]"
```

| 扩展 | 包 | 用于 |
|-------|----------|-------------|
| `voice` | `sounddevice`, `numpy` | CLI 语音模式 |
| `messaging` | `discord.py[voice]`, `python-telegram-bot`, `aiohttp` | Discord 和 Telegram 机器人 |
| `tts-premium` | `elevenlabs` | ElevenLabs TTS 提供商 |

可选的本地 TTS 提供商：通过 `python -m pip install -U neutts[all]` 单独安装 `neutts`。首次使用时它会自动下载模型。

:::info
`discord.py[voice]` 会自动安装 **PyNaCl**（用于语音加密）和 **opus 绑定**。这是 Discord 语音频道支持所必需的。
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

| 依赖 | 用途 | 用于 |
|-----------|---------|-------------|
| **PortAudio** | 麦克风输入和音频播放 | CLI 语音模式 |
| **ffmpeg** | 音频格式转换（MP3 → Opus, PCM → WAV） | 所有平台 |
| **Opus** | Discord 语音编解码器 | Discord 语音频道 |
| **espeak-ng** | 音素转换器后端 | 本地 NeuTTS 提供商 |

### API 密钥

添加到 `~/.hermes/.env`：

```bash
# 语音转文本 — 本地提供商完全不需要密钥
# pip install faster-whisper          # 免费，本地运行，推荐
GROQ_API_KEY=your-key                 # Groq Whisper — 快速，有免费额度（云端）
VOICE_TOOLS_OPENAI_KEY=your-key       # OpenAI Whisper — 付费（云端）

# 文本转语音（可选 — Edge TTS 和 NeuTTS 无需任何密钥即可使用）
ELEVENLABS_API_KEY=***           # ElevenLabs — 高品质
# 上面的 VOICE_TOOLS_OPENAI_KEY 也可启用 OpenAI TTS
```

:::tip
如果安装了 `faster-whisper`，语音模式可以在 STT **零 API 密钥**的情况下工作。模型（`base` 约 150 MB）在首次使用时自动下载。
:::

---

## CLI 语音模式

语音模式在**经典 CLI**（`hermes chat`）和 **TUI**（`hermes --tui`）中均可使用。两者行为相同——相同的斜杠命令、相同的 VAD 静默检测、相同的流式 TTS、相同的幻觉过滤器。TUI 额外将崩溃取证日志转发到 `~/.hermes/logs/`，以便在 exotic 音频后端上发生按键通话失败时，可以报告完整的堆栈跟踪而不是无声消失。

### 快速开始

启动 CLI 并启用语音模式：

```bash
hermes                # 启动交互式 CLI
```

然后在 CLI 中使用以下命令：

```
/voice          切换语音模式开/关
/voice on       启用语音模式
/voice off      禁用语音模式
/voice tts      切换 TTS 输出
/voice status   显示当前状态
```

### 工作原理

1. 使用 `hermes` 启动 CLI，用 `/voice on` 启用语音模式
2. **按 Ctrl+B** — 播放提示音（880Hz），开始录音
3. **说话** — 实时音频电平条显示你的输入：`● [▁▂▃▅▇▇▅▂] ❯`
4. **停止说话** — 静默 3 秒后，录音自动停止
5. **两声提示音**播放（660Hz），确认录音结束
6. 音频通过 Whisper 转录并发送给智能体
7. 如果启用了 TTS，智能体的回复会被朗读出来
8. 录音**自动重启**——无需按键即可再次说话

此循环持续直到你在录音期间按 **Ctrl+B**（退出连续模式）或连续 3 次录音未检测到语音。

:::tip
录音键可通过 `~/.hermes/config.yaml` 中的 `voice.record_key` 配置（默认：`ctrl+b`）。
:::

### 静默检测

两阶段算法检测你何时说完：

1. **语音确认** — 等待音频超过 RMS 阈值（200）至少 0.3 秒，允许音节间的短暂下降
2. **结束检测** — 一旦确认语音，在持续静默 3.0 秒后触发

如果 15 秒内完全未检测到语音，录音自动停止。

`silence_threshold` 和 `silence_duration` 均可在 `config.yaml` 中配置。你还可以用 `voice.beep_enabled: false` 禁用录音开始/停止的提示音。

### 流式 TTS

启用 TTS 后，智能体在生成文本时**逐句**朗读回复——你无需等待完整回复：

1. 将文本增量缓冲为完整句子（最少 20 个字符）
2. 去除 markdown 格式和 `<think>` 块
3. 实时逐句生成并播放音频

### 幻觉过滤器

Whisper 有时会从静默或背景噪音中生成幻听文本（"谢谢观看"、"请订阅"等）。智能体使用一组 26 个已知的多语言幻觉短语加上一个捕获重复变体的正则表达式来过滤这些内容。

---

## 网关语音回复（Telegram 和 Discord）

如果你还没有设置消息机器人，请参阅平台专用指南：
- [Telegram 设置指南](../messaging/telegram.md)
- [Discord 设置指南](../messaging/discord.md)

启动网关以连接到你的消息平台：

```bash
hermes gateway        # 启动网关（连接已配置的平台）
hermes gateway setup  # 首次配置的交互式设置向导
```

### Discord：频道与私信

机器人在 Discord 上支持两种交互模式：

| 模式 | 对话方式 | 需要@提及 | 设置 |
|------|------------|-----------------|-------|
| **私信（DM）** | 打开机器人资料 → "发消息" | 不需要 | 立即生效 |
| **服务器频道** | 在机器人所在的文字频道中输入 | 是（`@机器人名`） | 机器人必须被邀请到服务器 |

**私信（个人使用推荐）：** 只需打开与机器人的私信并输入——不需要@提及。语音回复和所有命令在频道中的工作方式相同。

**服务器频道：** 机器人只在被你@提及（例如 `@hermesbyt4 hello`）时回复。确保从提及弹出窗口中选择**机器人用户**，而不是同名角色。

:::tip
要在服务器频道中禁用提及要求，添加到 `~/.hermes/.env`：
```bash
DISCORD_REQUIRE_MENTION=false
```
或将特定频道设为自由回复（无需提及）：
```bash
DISCORD_FREE_RESPONSE_CHANNELS=123456789,987654321
```
:::

### 命令

这些在 Telegram 和 Discord（私信和文字频道）中均可使用：

```
/voice          切换语音模式开/关
/voice on       仅在你发送语音消息时语音回复
/voice tts      对所有消息语音回复
/voice off      禁用语音回复
/voice status   显示当前设置
```

### 模式

| 模式 | 命令 | 行为 |
|------|---------|----------|
| `off` | `/voice off` | 仅文字（默认） |
| `voice_only` | `/voice on` | 仅在你发送语音消息时朗读回复 |
| `all` | `/voice tts` | 对每条消息都朗读回复 |

语音模式设置在网关重启后持久保存。

### 平台投递

| 平台 | 格式 | 说明 |
|----------|--------|-------|
| **Telegram** | 语音气泡（Opus/OGG） | 在聊天中内联播放。ffmpeg 按需将 MP3 → Opus 转换 |
| **Discord** | 原生语音气泡（Opus/OGG） | 像用户语音消息一样内联播放。如果语音气泡 API 失败则回退为文件附件 |

---

## Discord 语音频道

最具沉浸感的语音功能：机器人加入 Discord 语音频道，聆听用户发言，转录他们的语音，通过智能体处理，并在语音频道中用语音回复。

### 设置

#### 1. Discord 机器人权限

如果你已经为文字设置了 Discord 机器人（参见 [Discord 设置指南](../messaging/discord.md)），你需要添加语音权限。

前往 [Discord 开发者门户](https://discord.com/developers/applications) → 你的应用 → **安装** → **默认安装设置** → **服务器安装**：

**在现有文字权限基础上添加以下权限：**

| 权限 | 用途 | 必需 |
|-----------|---------|----------|
| **连接** | 加入语音频道 | 是 |
| **说话** | 在语音频道中播放 TTS 音频 | 是 |
| **使用语音活动** | 检测用户何时在说话 | 推荐 |

**更新后的权限整数：**

| 级别 | 整数 | 包含内容 |
|-------|---------|----------------|
| 仅文字 | `274878286912` | 查看频道、发送消息、读取历史、嵌入、附件、线程、反应 |
| 文字 + 语音 | `274881432640` | 以上全部 + 连接、说话 |

**使用更新的权限 URL 重新邀请机器人：**

```
https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&scope=bot+applications.commands&permissions=274881432640
```

将 `YOUR_APP_ID` 替换为你在开发者门户中的应用 ID。

:::warning
将机器人重新邀请到它已在的服务器将更新其权限而不会移除它。你不会丢失任何数据或配置。
:::

#### 2. 特权网关意图

在 [开发者门户](https://discord.com/developers/applications) → 你的应用 → **机器人** → **特权网关意图**，启用全部三个：

| 意图 | 用途 |
|-----------|---------|
| **在线状态意图** | 检测用户在线/离线状态 |
| **服务器成员意图** | 将 `DISCORD_ALLOWED_USERS` 中的用户名解析为数字 ID（有条件需要） |
| **消息内容意图** | 读取频道中的文字消息内容 |

**消息内容意图**是必需的。**服务器成员意图**仅在你的 `DISCORD_ALLOWED_USERS` 列表使用用户名时才需要——如果你使用数字用户 ID，可以保持关闭。语音频道中 SSRC → user_id 的映射来自 Discord 语音 websocket 上的 SPEAKING 操作码，**不需要**服务器成员意图。

#### 3. Opus 编解码器

运行网关的机器上必须安装 Opus 编解码器库：

```bash
# macOS (Homebrew)
brew install opus

# Ubuntu/Debian
sudo apt install libopus0
```

机器人从以下位置自动加载编解码器：
- **macOS：** `/opt/homebrew/lib/libopus.dylib`
- **Linux：** `libopus.so.0`

#### 4. 环境变量

```bash
# ~/.hermes/.env

# Discord 机器人（已为文字配置）
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_ALLOWED_USERS=your-user-id

# STT — 本地提供商不需要密钥（pip install faster-whisper）
# GROQ_API_KEY=your-key            # 替代方案：云端，快速，有免费额度

# TTS — 可选。Edge TTS 和 NeuTTS 不需要密钥。
# ELEVENLABS_API_KEY=***      # 高品质
# VOICE_TOOLS_OPENAI_KEY=***  # OpenAI TTS / Whisper
```

### 启动网关

```bash
hermes gateway        # 使用现有配置启动
```

机器人应在几秒内上线 Discord。

### 命令

在机器人所在的 Discord 文字频道中使用：

```
/voice join      机器人加入你当前的语音频道
/voice channel   /voice join 的别名
/voice leave     机器人断开语音频道连接
/voice status    显示语音模式和已连接的频道
```

:::info
运行 `/voice join` 前你必须在一个语音频道中。机器人加入你所在的同一个语音频道。
:::

### 工作原理

当机器人加入语音频道时，它会：

1. **聆听**每个用户的音频流（独立处理）
2. **检测静默**— 至少 0.5 秒语音后的 1.5 秒静默触发处理
3. **转录**音频通过 Whisper STT（本地、Groq 或 OpenAI）
4. **通过完整的智能体管线处理**（会话、工具、记忆）
5. **在语音频道中用语音**通过 TTS 回复

### 文字频道集成

当机器人在语音频道中时：

- 转录文本出现在文字频道中：`[语音] @用户: 你说的话`
- 智能体的回复作为文字发送到频道中，同时在语音频道中朗读
- 文字频道是发出 `/voice join` 的那个频道

### 回声预防

机器人在播放 TTS 回复期间自动暂停其音频监听器，防止它听到并重新处理自己的输出。

### 访问控制

只有 `DISCORD_ALLOWED_USERS` 中列出的用户才能通过语音交互。其他用户的音频被静默忽略。

```bash
# ~/.hermes/.env
DISCORD_ALLOWED_USERS=284102345871466496
```

---

## 配置参考

### config.yaml

```yaml
# 语音录制 (CLI)
voice:
  record_key: "ctrl+b"            # 开始/停止录制的按键
  max_recording_seconds: 120       # 最大录制时长
  auto_tts: false                  # 语音模式启动时自动启用 TTS
  beep_enabled: true               # 播放录制开始/停止提示音
  silence_threshold: 200           # RMS 电平 (0-32767)，低于此值视为静音
  silence_duration: 3.0            # 静音持续多少秒后自动停止

# 语音转文字
stt:
  enabled: true                     # 设为 false 可跳过自动转录 —
                                    # 网关仍会缓存音频文件，
                                    # 并将其路径作为入站消息的一部分传递给智能体，
                                    # 适用于自定义流水线
                                    # (说话人分离、对齐、归档等)
  provider: "local"                  # "local" (免费) | "groq" | "openai" | "mistral" | "xai"
  local:
    model: "base"                    # tiny, base, small, medium, large-v3
  # model: "whisper-1"              # 旧版：在未设置 provider 时使用

# 文字转语音
tts:
  provider: "edge"                 # "edge" (免费) | "elevenlabs" | "openai" | "neutts" | "minimax" | "mistral" | "gemini" | "xai" | "kittentts" | "piper"
  edge:
    voice: "en-US-AriaNeural"      # 322 种语音，74 种语言
  elevenlabs:
    voice_id: "pNInz6obpgDQGcFmaJgB"    # Adam
    model_id: "eleven_multilingual_v2"
  openai:
    model: "gpt-4o-mini-tts"
    voice: "alloy"                 # alloy, echo, fable, onyx, nova, shimmer
    base_url: "https://api.openai.com/v1"  # 可选：用于自托管或兼容 OpenAI 的端点
  neutts:
    ref_audio: ''
    ref_text: ''
    model: neuphonic/neutts-air-q4-gguf
    device: cpu
```

### 环境变量

```bash
# 语音转文字服务提供者 (local 不需要密钥)
# pip install faster-whisper        # 免费本地 STT — 无需 API 密钥
GROQ_API_KEY=...                    # Groq Whisper (快速，有免费额度)
VOICE_TOOLS_OPENAI_KEY=...         # OpenAI Whisper (付费)

# STT 高级覆盖配置 (可选)
STT_GROQ_MODEL=whisper-large-v3-turbo    # 覆盖默认 Groq STT 模型
STT_OPENAI_MODEL=whisper-1               # 覆盖默认 OpenAI STT 模型
GROQ_BASE_URL=https://api.groq.com/openai/v1     # 自定义 Groq 端点
STT_OPENAI_BASE_URL=https://api.openai.com/v1    # 自定义 OpenAI STT 端点

# 文字转语音服务提供者 (Edge TTS 和 NeuTTS 不需要密钥)
ELEVENLABS_API_KEY=***             # ElevenLabs (高品质)
# 上方的 VOICE_TOOLS_OPENAI_KEY 也可启用 OpenAI TTS

# Discord 语音频道
DISCORD_BOT_TOKEN=...
DISCORD_ALLOWED_USERS=...
```

### STT 服务提供者对比

| 服务提供者 | 模型 | 速度 | 质量 | 费用 | API 密钥 |
|----------|-------|-------|---------|------|---------|
| **Local** | `base` | 快 (取决于 CPU/GPU) | 良好 | 免费 | 否 |
| **Local** | `small` | 中等 | 较好 | 免费 | 否 |
| **Local** | `large-v3` | 慢 | 最佳 | 免费 | 否 |
| **Groq** | `whisper-large-v3-turbo` | 非常快 (~0.5s) | 良好 | 免费额度 | 是 |
| **Groq** | `whisper-large-v3` | 快 (~1s) | 较好 | 免费额度 | 是 |
| **OpenAI** | `whisper-1` | 快 (~1s) | 良好 | 付费 | 是 |
| **OpenAI** | `gpt-4o-transcribe` | 中等 (~2s) | 最佳 | 付费 | 是 |
| **Mistral** | `voxtral-mini-latest` | 快 | 良好 | 付费 | 是 |
| **xAI** | `grok-stt` | 快 | 良好 | 付费 | 是 |

服务提供者优先级 (自动回退): **local** > **groq** > **openai**

### TTS 服务提供者对比

| 服务提供者 | 质量 | 费用 | 延迟 | 需要密钥 |
|----------|---------|------|---------|-------------|
| **Edge TTS** | 良好 | 免费 | ~1s | 否 |
| **ElevenLabs** | 优秀 | 付费 | ~2s | 是 |
| **OpenAI TTS** | 良好 | 付费 | ~1.5s | 是 |
| **NeuTTS** | 良好 | 免费 | 取决于 CPU/GPU | 否 |

NeuTTS 使用上方的 `tts.neutts` 配置块。

---

## 故障排除

### "未找到音频设备" (CLI)

未安装 PortAudio：

```bash
brew install portaudio    # macOS
sudo apt install portaudio19-dev  # Ubuntu
```

如果你在 Linux 桌面上通过 Docker 运行 Hermes，容器还需要访问主机的音频套接字。请参阅 [Docker 音频桥接](/user-guide/docker#optional-linux-desktop-audio-bridge) 说明，了解 PulseAudio/PipeWire 兼容设置。

### 机器人不响应 Discord 服务器频道中的消息

默认情况下，机器人在服务器频道中需要 @提及 才能响应。请确保：

1. 输入 `@` 并选择 **机器人用户** (带 #标识符的)，而不是同名的 **角色**
2. 或者使用私信 — 无需提及
3. 或者在 `~/.hermes/.env` 中设置 `DISCORD_REQUIRE_MENTION=false`

### 机器人加入语音频道但听不到我的声音

- 检查你的 Discord 用户 ID 是否在 `DISCORD_ALLOWED_USERS` 中
- 确保你在 Discord 中没有被静音
- 机器人需要来自 Discord 的 SPEAKING 事件才能映射你的音频 — 请在加入后几秒内开始说话

### 机器人听到我说话但不响应

- 确认 STT 可用：安装 `faster-whisper` (无需密钥) 或设置 `GROQ_API_KEY` / `VOICE_TOOLS_OPENAI_KEY`
- 检查 LLM 模型是否已配置且可访问
- 查看网关日志：`tail -f ~/.hermes/logs/gateway.log`

### 机器人在文本中响应但不在语音频道中响应

- TTS 服务提供者可能失败 — 检查 API 密钥和配额
- Edge TTS (免费，无密钥) 是默认回退方案
- 检查日志中的 TTS 错误

### Whisper 返回乱码文本

幻觉过滤器会自动捕获大多数情况。如果你仍然收到虚假转录：

- 使用更安静的环境
- 调整配置中的 `silence_threshold` (值越大 = 灵敏度越低)
- 尝试不同的 STT 模型