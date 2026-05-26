---
sidebar_position: 10
title: "语音模式"
description: "与Hermes智能体进行实时语音对话 — CLI、Telegram、Discord（私信、文本频道和语音频道）"
---

# 语音模式

Hermes 智能体支持在 CLI 和消息平台上进行完整的语音交互。使用麦克风与智能体交谈，聆听语音回复，并在 Discord 语音频道中进行实时语音对话。

如果您需要包含推荐配置和实际使用模式的实践设置指南，请参阅[在Hermes中使用语音模式](/guides/use-voice-mode-with-hermes)。

## 先决条件

在使用语音功能之前，请确保您已完成：

1.  **已安装Hermes智能体** — `pip install hermes-agent`（请参阅[安装指南](/getting-started/installation)）
2.  **已配置LLM提供商** — 运行 `hermes model` 或在 `~/.hermes/.env` 中设置您首选的提供商凭证
3.  **已完成基础设置** — 运行 `hermes` 验证智能体是否能响应文本，然后再启用语音功能

:::tip
`~/.hermes/` 目录和默认的 `config.yaml` 在您首次运行 `hermes` 时会自动创建。您只需手动创建 `~/.hermes/.env` 文件来存放 API 密钥。
:::

:::tip Nous Portal 两者都包含
付费的 [Nous Portal](/user-guide/features/tool-gateway) 订阅同时提供 LLM（步骤 2）**和**通过工具网关提供的 OpenAI TTS — 无需单独的 OpenAI 密钥。在新安装的实例上，`hermes setup --portal` 命令可以一次性完成两者的配置。
:::

## 概览

| 功能 | 平台 | 描述 |
|---------|----------|-------------|
| **交互式语音** | CLI | 按 Ctrl+B 录音，智能体自动检测静音并回应 |
| **自动语音回复** | Telegram, Discord | 智能体在文本回复的同时发送语音音频 |
| **语音频道** | Discord | 机器人加入语音频道，收听用户发言并语音回复 |

## 依赖项

### Python 包

```bash
# CLI 语音模式 (麦克风 + 音频播放)
pip install "hermes-agent[voice]"

# Discord + Telegram 消息传递 (包含 discord.py[voice] 以支持语音频道)
pip install "hermes-agent[messaging]"

# 高级 TTS (ElevenLabs)
pip install "hermes-agent[tts-premium]"

# 本地 TTS (NeuTTS，可选)
python -m pip install -U neutts[all]

# 一次性安装所有
pip install "hermes-agent[all]"
```

| 附加功能 | 包 | 用途 |
|-------|----------|-------------|
| `voice` | `sounddevice`, `numpy` | CLI 语音模式 |
| `messaging` | `discord.py[voice]`, `python-telegram-bot`, `aiohttp` | Discord 和 Telegram 机器人 |
| `tts-premium` | `elevenlabs` | ElevenLabs TTS 提供商 |

可选的本地 TTS 提供商：单独安装 `neutts`，使用 `python -m pip install -U neutts[all]`。首次使用时会自动下载模型。

:::info
`discord.py[voice]` 会自动安装 **PyNaCl** (用于语音加密) 和 **opus 绑定**。这是 Discord 语音频道支持所必需的。
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

| 依赖项 | 用途 | 适用场景 |
|-----------|---------|-------------|
| **PortAudio** | 麦克风输入和音频播放 | CLI 语音模式 |
| **ffmpeg** | 音频格式转换 (MP3 → Opus, PCM → WAV) | 所有平台 |
| **Opus** | Discord 语音编解码器 | Discord 语音频道 |
| **espeak-ng** | 音素化后端 | 本地 NeuTTS 提供商 |

### API 密钥

添加到 `~/.hermes/.env`：

```bash
# 语音转文本 — 本地提供商完全不需要密钥
# pip install faster-whisper          # 免费，本地运行，推荐
GROQ_API_KEY=your-key                 # Groq Whisper — 快速，免费层 (云端)
VOICE_TOOLS_OPENAI_KEY=your-key       # OpenAI Whisper — 付费 (云端)

# 文本转语音 (可选 — Edge TTS 和 NeuTTS 无需任何密钥即可工作)
ELEVENLABS_API_KEY=***           # ElevenLabs — 高级质量
# 上面的 VOICE_TOOLS_OPENAI_KEY 同时也启用了 OpenAI TTS
```

:::tip
如果安装了 `faster-whisper`，语音模式可以 **零 API 密钥** 进行语音转文本。模型 (`base` 约 150 MB) 首次使用时会自动下载。
:::

---

## CLI 语音模式

语音模式在 **经典 CLI** (`hermes chat`) 和 **TUI** (`hermes --tui`) 中均可用。两者行为完全相同 — 相同的斜杠命令、相同的 VAD 静音检测、相同的流式 TTS、相同的幻觉过滤器。TUI 会额外将崩溃诊断日志转发到 `~/.hermes/logs/`，这样在异域音频后端上按下讲话按钮失败时，可以报告完整的堆栈跟踪，而不是悄无声息地消失。

### 快速开始

启动 CLI 并启用语音模式：

```bash
hermes                # 启动交互式 CLI
```

然后在 CLI 内部使用以下命令：

```
/voice          切换语音模式 开/关
/voice on       启用语音模式
/voice off      禁用语音模式
/voice tts      切换 TTS 输出
/voice status   显示当前状态
```

### 工作原理

1. 使用 `hermes` 启动 CLI，并使用 `/voice on` 启用语音模式
2. **按 Ctrl+B** — 播放提示音 (880Hz)，开始录音
3. **说话** — 实时音频电平条显示你的输入：`● [▁▂▃▅▇▇▅▂] ❯`
4. **停止说话** — 静音 3 秒后，录音自动停止
5. 播放 **两声提示音** (660Hz) 确认录音结束
6. 音频通过 Whisper 转录并发送给智能体
7. 如果启用了 TTS，智能体的回复会被朗读出来
8. 录音 **自动重新开始** — 无需按键即可再次说话

此循环持续进行，直到你在录音期间按下 **Ctrl+B** (退出连续模式) 或连续 3 次录音未检测到语音。

:::tip
录音按键可通过 `~/.hermes/config.yaml` 中的 `voice.record_key` 配置 (默认：`ctrl+b`)。
:::

### 静音检测

两阶段算法检测你何时说完话：

1. **语音确认** — 等待音频电平高于 RMS 阈值 (200) 至少 0.3 秒，容忍音节间的短暂下降
2. **结束检测** — 一旦确认语音，持续静音 3.0 秒后触发

如果 15 秒内完全未检测到语音，录音将自动停止。

`silence_threshold` 和 `silence_duration` 均可在 `config.yaml` 中配置。你还可以通过 `voice.beep_enabled: false` 禁用录音开始/停止提示音。

### 流式 TTS

当启用 TTS 时，智能体在生成文本时会 **逐句** 朗读其回复 — 你无需等待完整回复：

1. 将文本增量缓冲为完整句子 (最少 20 个字符)
2. 去除 markdown 格式和 `` 块
3. 实时生成并播放每句音频

### 幻觉过滤器

Whisper 有时会从静音或背景噪声中生成幻觉文本（例如“感谢观看”、“订阅”等）。智能体使用一组包含多种语言的 26 个已知幻觉短语，以及一个捕获重复变体的正则表达式模式来过滤掉这些内容。

---

## 网关语音回复 (Telegram 和 Discord)

如果你还没有设置你的消息传递机器人，请参阅平台特定指南：
- [Telegram 设置指南](../messaging/telegram.md)
- [Discord 设置指南](../messaging/discord.md)

启动网关以连接到你的消息传递平台：

```bash
hermes gateway        # 启动网关 (连接到已配置的平台)
hermes gateway setup  # 首次配置的交互式设置向导
```

### Discord：频道 vs 私信

机器人在 Discord 上支持两种交互模式：

| 模式 | 如何交谈 | 需要提及 | 设置 |
|------|------------|-----------------|-------|
| **私信 (DM)** | 打开机器人个人资料 → “消息” | 否 | 立即可用 |
| **服务器频道** | 在机器人所在的文字频道中输入 | 是 (`@botname`) | 机器人必须被邀请到服务器 |

**私信 (推荐个人使用)：** 只需与机器人开始私信并输入 — 无需 @提及。语音回复和所有命令与在频道中相同。

**服务器频道：** 只有当你 @提及机器人时 (例如 `@hermesbyt4 hello`)，机器人才会响应。确保从提及弹出窗口中选择 **机器人用户**，而不是同名的角色。

:::tip
要在服务器频道中禁用提及要求，请添加到 `~/.hermes/.env`：
```bash
DISCORD_REQUIRE_MENTION=false
```
或设置特定频道为自由响应（无需提及）：
```bash
DISCORD_FREE_RESPONSE_CHANNELS=123456789,987654321
```
:::

### 命令

这些命令在 Telegram 和 Discord (私信和文字频道) 中均有效：

```
/voice          切换语音模式 开/关
/voice on       仅当你发送语音消息时才语音回复
/voice tts      对所有消息进行语音回复
/voice off      禁用语音回复
/voice status   显示当前设置
```

### 模式

| 模式 | 命令 | 行为 |
|------|---------|----------|
| `off` | `/voice off` | 仅文本 (默认) |
| `voice_only` | `/voice on` | 仅当你发送语音消息时才语音回复 |
| `all` | `/voice tts` | 对每条消息都语音回复 |

语音模式设置在网关重启后保持不变。

### 平台投递

| 平台 | 格式 | 备注 |
|----------|--------|-------|
| **Telegram** | 语音气泡 (Opus/OGG) | 在聊天中内联播放。如果需要，ffmpeg 将 MP3 转换为 Opus |
| **Discord** | 原生语音气泡 (Opus/OGG) | 像用户语音消息一样内联播放。如果语音气泡 API 失败，则回退到文件附件 |

---

## Discord 语音频道

最沉浸式的语音功能：机器人加入 Discord 语音频道，收听用户发言，转录他们的语音，通过智能体处理，并在语音频道中朗读回复。

### 设置

#### 1. Discord 机器人权限

如果你已经为文本设置了 Discord 机器人（参见 [Discord 设置指南](../messaging/discord.md)），你需要添加语音权限。

前往 [Discord 开发者门户](https://discord.com/developers/applications) → 你的应用 → **安装** → **默认安装设置** → **服务器安装**：

**在现有文本权限基础上添加这些权限：**

| 权限 | 用途 | 必需 |
|-----------|---------|----------|
| **连接** | 加入语音频道 | 是 |
| **说话** | 在语音频道中播放 TTS 音频 | 是 |
| **使用语音活动** | 检测用户何时发言 | 推荐 |

**更新后的权限整数：**

| 级别 | 整数 | 包含内容 |
|-------|---------|----------------|
| 仅文本 | `274878286912` | 查看频道、发送消息、阅读历史记录、嵌入内容、附件、帖子、反应 |
| 文本 + 语音 | `274881432640` | 以上所有 + 连接、说话 |

使用更新后的权限 URL **重新邀请机器人**：

```
https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&scope=bot+applications.commands&permissions=274881432640
```

将 `YOUR_APP_ID` 替换为开发者门户中的应用程序 ID。

:::warning
将机器人重新邀请到它已在其中的服务器将更新其权限而不会移除它。你不会丢失任何数据或配置。
:::

#### 2. 特权网关意图

在 [开发者门户](https://discord.com/developers/applications) → 你的应用 → **机器人** → **特权网关意图** 中，启用所有三个：

| 意图 | 用途 |
|--------|---------|
| **在线状态意图** | 检测用户在线/离线状态 |
| **服务器成员意图** | 将 `DISCORD_ALLOWED_USERS` 中的用户名解析为数字 ID (有条件) |
| **消息内容意图** | 读取频道中的文本消息内容 |

**消息内容意图** 是必需的。**服务器成员意图** 仅当你的 `DISCORD_ALLOWED_USERS` 列表使用用户名时才需要 — 如果使用数字用户 ID，可以将其关闭。语音频道中的 SSRC → 用户 ID 映射来自 Discord 语音 websocket 上的 SPEAKING 操作码，**不需要** 服务器成员意图。

#### 3. Opus 编解码器

运行网关的机器上必须安装 Opus 编解码器库：

```bash
# macOS (Homebrew)
brew install opus

# Ubuntu/Debian
sudo apt install libopus0
```

机器人从以下位置自动加载编解码器：
- **macOS:** `/opt/homebrew/lib/libopus.dylib`
- **Linux:** `libopus.so.0`

#### 4. 环境变量

```bash
# ~/.hermes/.env

# Discord 机器人 (已为文本配置)
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_ALLOWED_USERS=your-user-id

# 语音转文本 — 本地提供商无需密钥 (pip install faster-whisper)
# GROQ_API_KEY=your-key            # 替代方案：基于云端，快速，免费层

# 文本转语音 — 可选。Edge TTS 和 NeuTTS 无需密钥。
# ELEVENLABS_API_KEY=***      # 高级质量
# VOICE_TOOLS_OPENAI_KEY=***  # OpenAI TTS / Whisper
```

### 启动网关

```bash
hermes gateway        # 使用现有配置启动
```

机器人应该会在几秒钟内在 Discord 上线。

### 命令

在机器人所在 Discord 文字频道中使用这些命令：

```
/voice join      机器人加入你当前所在的语音频道
/voice channel   /voice join 的别名
/voice leave     机器人断开与语音频道的连接
/voice status    显示语音模式和已连接的频道
```

:::info
在运行 `/voice join` 之前，你必须身处一个语音频道中。机器人会加入你所在的同一个语音频道。
:::

### 工作原理

当机器人加入语音频道时，它会：

1. **独立监听** 每个用户的音频流
2. **检测静音** — 在至少 0.5 秒的语音后，1.5 秒的静音触发处理
3. 通过 Whisper STT (本地、Groq 或 OpenAI) **转录** 音频
4. 通过完整的智能体管道 (会话、工具、记忆) **处理**
5. 通过 TTS 在语音频道中 **朗读** 回复

### 文字频道集成

当机器人在语音频道中时：

- 转录内容出现在文字频道中：`[Voice] @user: 你所说的内容`
- 智能体回复会作为文本发送到频道，并在语音频道中朗读
- 文字频道是发出 `/voice join` 命令的频道

### 回声抑制

机器人在播放 TTS 回复时会自动暂停其音频监听器，防止它听到并重新处理自己的输出。

### 访问控制

只有 `DISCORD_ALLOWED_USERS` 中列出的用户可以通过语音进行交互。其他用户的音频会被静默忽略。

```bash
# ~/.hermes/.env
DISCORD_ALLOWED_USERS=284102345871466496
```

---

## 配置参考

### config.yaml

```yaml
# 语音录制（CLI）
voice:
  record_key: "ctrl+b"            # 开始/停止录制的按键
  max_recording_seconds: 120       # 最大录制时长（秒）
  auto_tts: false                  # 启用语音模式时自动开启 TTS
  beep_enabled: true               # 播放开始/停止录制的提示音
  silence_threshold: 200           # RMS 音量水平 (0-32767)，低于此值视为静音
  silence_duration: 3.0            # 自动停止前的静音持续时间（秒）

# 语音转文本
stt:
  enabled: true                     # 设置为 false 可跳过自动转录 —
                                    # 网关仍会缓存音频文件，并
                                    # 将其路径作为入站消息的一部分
                                    # 传递给智能体，适用于自定义流程
                                    # （如说话人分离、对齐、存档等）
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
    base_url: "https://api.openai.com/v1"  # 可选：为自托管或 OpenAI 兼容端点进行覆盖
  neutts:
    ref_audio: ''
    ref_text: ''
    model: neuphonic/neutts-air-q4-gguf
    device: cpu
```

### 环境变量

```bash
# 语音转文本服务商（本地模型无需密钥）
# pip install faster-whisper        # 免费的本地 STT — 无需 API 密钥
GROQ_API_KEY=...                    # Groq Whisper（快速，有免费额度）
VOICE_TOOLS_OPENAI_KEY=...         # OpenAI Whisper（付费）

# STT 高级覆盖（可选）
STT_GROQ_MODEL=whisper-large-v3-turbo    # 覆盖默认的 Groq STT 模型
STT_OPENAI_MODEL=whisper-1               # 覆盖默认的 OpenAI STT 模型
GROQ_BASE_URL=https://api.groq.com/openai/v1     # 自定义 Groq 端点
STT_OPENAI_BASE_URL=https://api.openai.com/v1    # 自定义 OpenAI STT 端点

# 文本转语音服务商（Edge TTS 和 NeuTTS 无需密钥）
ELEVENLABS_API_KEY=***             # ElevenLabs（高质量）
# 上面的 VOICE_TOOLS_OPENAI_KEY 也同时启用 OpenAI TTS

# Discord 语音频道
DISCORD_BOT_TOKEN=...
DISCORD_ALLOWED_USERS=...
```

### STT 服务商对比

| 服务商 | 模型 | 速度 | 质量 | 成本 | 需要 API 密钥 |
|--------|-------|-------|---------|------|-------------|
| **本地** | `base` | 快（取决于 CPU/GPU） | 良好 | 免费 | 否 |
| **本地** | `small` | 中等 | 更好 | 免费 | 否 |
| **本地** | `large-v3` | 慢 | 最佳 | 免费 | 否 |
| **Groq** | `whisper-large-v3-turbo` | 非常快 (~0.5s) | 良好 | 有免费额度 | 是 |
| **Groq** | `whisper-large-v3` | 快 (~1s) | 更好 | 有免费额度 | 是 |
| **OpenAI** | `whisper-1` | 快 (~1s) | 良好 | 付费 | 是 |
| **OpenAI** | `gpt-4o-transcribe` | 中等 (~2s) | 最佳 | 付费 | 是 |

服务商优先级（自动回退）：**本地** > **groq** > **openai**

### TTS 服务商对比

| 服务商 | 质量 | 成本 | 延迟 | 需要密钥 |
|--------|---------|------|---------|-------------|
| **Edge TTS** | 良好 | 免费 | ~1s | 否 |
| **ElevenLabs** | 优秀 | 付费 | ~2s | 是 |
| **OpenAI TTS** | 良好 | 付费 | ~1.5s | 是 |
| **NeuTTS** | 良好 | 免费 | 取决于 CPU/GPU | 否 |

NeuTTS 使用上面的 `tts.neutts` 配置块。

---

## 故障排查

### "未找到音频设备"（CLI）

PortAudio 未安装：

```bash
brew install portaudio    # macOS
sudo apt install portaudio19-dev  # Ubuntu
```

### 机器人在 Discord 服务器频道内无响应

机器人默认在服务器频道中需要被 @提及。请确保您：

1. 输入 `@` 并选择**机器人用户**（带有 #Discriminator），而不是同名的**角色**
2. 或者使用私信——无需提及
3. 或在 `~/.hermes/.env` 中设置 `DISCORD_REQUIRE_MENTION=false`

### 机器人加入语音频道但听不到我

- 检查您的 Discord 用户 ID 是否在 `DISCORD_ALLOWED_USERS` 列表中
- 确保您在 Discord 中没有被静音
- 机器人需要收到来自 Discord 的 SPEAKING 事件才能映射您的音频——加入后几秒内请开始说话

### 机器人能听到我但无响应

- 验证 STT 是否可用：安装 `faster-whisper`（无需密钥）或设置 `GROQ_API_KEY` / `VOICE_TOOLS_OPENAI_KEY`
- 检查 LLM 模型是否已配置且可访问
- 查看网关日志：`tail -f ~/.hermes/logs/gateway.log`

### 机器人在文本中响应，但在语音频道中无响应

- TTS 服务商可能出错——检查 API 密钥和配额
- Edge TTS（免费，无需密钥）是默认的回退选项
- 检查日志中的 TTS 错误

### Whisper 返回乱码文本

幻觉过滤器会自动捕获大多数情况。如果您仍收到不真实的转录：

- 使用更安静的环境
- 调整配置中的 `silence_threshold`（值越高，灵敏度越低）
- 尝试不同的 STT 模型