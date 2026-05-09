---
sidebar_position: 9
title: "使用 Ollama 在本地运行 Hermes — 零 API 成本"
description: "使用 Ollama 和 Gemma 4 等开源权重模型，在本地机器上完全运行 Hermes 智能体的分步指南，无需云 API 密钥或付费订阅"
---

# 使用 Ollama 在本地运行 Hermes — 零 API 成本

## 问题所在

云端大语言模型 API 按 token 收费。一次高强度的编程会话可能花费 5 到 20 美元。对于个人项目、学习或涉及隐私敏感的工作来说，这笔费用会不断累积，而且你还需要将每次对话都发送给第三方。

## 本指南解决的问题

您将设置 Hermes 智能体，使其完全运行在您自己的硬件上，使用 [Ollama](https://ollama.com) 作为模型后端。无需 API 密钥，无需订阅，数据不会离开您的机器。配置完成后，Hermes 的功能与 OpenRouter 或 Anthropic 完全一致——终端命令、文件编辑、网页浏览、任务委派——但模型在本地运行。

最终您将拥有：

- 一个或多个开源权重模型由 Ollama 提供服务
- Hermes 连接到 Ollama 作为自定义端点
- 一个可正常工作的本地智能体，能够编辑文件、运行命令和浏览网页
- 可选：一个完全由您自己的硬件驱动的 Telegram/Discord 机器人

## 您需要什么

| 组件 | 最低要求 | 推荐配置 |
|-----------|---------|-------------|
| **内存** | 8 GB（用于 3B 模型） | 32+ GB（用于 27B+ 模型） |
| **存储** | 5 GB 可用空间 | 30+ GB（用于多个模型） |
| **CPU** | 4 核心 | 8+ 核心（AMD EPYC、Ryzen、Intel Xeon） |
| **GPU** | 非必需 | 配备 8+ GB 显存的 NVIDIA GPU 可显著提升性能 |

:::tip 仅使用 CPU 也可运行，但响应速度较慢
Ollama 可以在仅配备 CPU 的服务器上运行。在现代 8 核 CPU 上运行 9B 模型，速度约为每秒 10 个 token。在 CPU 上运行 31B 模型速度较慢（每秒约 2–5 个 token）——每次响应需要 30–120 秒，但依然可以工作。GPU 可显著改善此情况。对于仅使用 CPU 的设置，请在配置中增加 API 超时时间：

```yaml
agent:
  api_timeout: 1800   # 30 分钟 —— 对于本地慢速模型来说较为宽裕
```
:::

## 步骤 1：安装 Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

验证是否正在运行：

```bash
ollama --version
curl http://localhost:11434/api/tags   # 应返回 {"models":[]}
```

## 步骤 2：拉取模型

根据您的硬件选择：

| 模型 | 磁盘占用大小 | 所需内存 | 工具调用 | 最适合 |
|-------|-------------|------------|:------------:|----------|
| `gemma4:31b` | ~20 GB | 24+ GB | 是 | 最佳质量 —— 强大的工具使用和推理能力 |
| `gemma2:27b` | ~16 GB | 20+ GB | 否 | 对话任务，无工具使用 |
| `gemma2:9b` | ~5 GB | 8+ GB | 否 | 快速聊天、问答 —— 无法调用工具 |
| `llama3.2:3b` | ~2 GB | 4+ GB | 否 | 轻量级快速回答 |

:::warning 工具调用很重要
Hermes 是一个**智能体**助手 —— 它通过工具调用来编辑文件、运行命令和浏览网页。不支持工具调用的模型只能进行对话；它们无法执行操作。要获得完整的 Hermes 体验，请使用支持工具的模型（如 `gemma4:31b`）。
:::

拉取您选择的模型：

```bash
ollama pull gemma4:31b
```

:::info 多个模型
您可以拉取多个模型，并在 Hermes 内部使用 `/model` 命令进行切换。Ollama 会根据需要将有活动的模型加载到内存中，并自动卸载空闲的模型。
:::

验证模型是否正常工作：

```bash
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemma4:31b",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 50
  }'
```

您应该会看到一个包含模型回复的 JSON 响应。

## 步骤 3：配置 Hermes

运行 Hermes 设置向导：

```bash
hermes setup
```

当提示选择提供商时，选择**自定义端点**并输入：

- **基础 URL：** `http://localhost:11434/v1`
- **API 密钥：** 留空或输入 `no-key`（Ollama 不需要）
- **模型：** `gemma4:31b`（或您拉取的任何模型）

或者，直接编辑 `~/.hermes/config.yaml`：

```yaml
model:
  default: "gemma4:31b"
  provider: "custom"
  base_url: "http://localhost:11434/v1"
```

## 步骤 4：开始使用 Hermes

```bash
hermes
```

就是这样。您现在正在运行一个完全本地的智能体。试试看：

```
你：列出此目录下的所有 Python 文件，并统计每个文件的代码行数

你：读取 README.md 并总结此项目的功能

你：创建一个 Python 脚本，用于获取胡志明市的天气信息
```

Hermes 将使用终端工具、文件操作和您的本地模型 —— 无需调用云端服务。

## 步骤 5：为您的任务选择合适的模型

并非所有任务都需要最大的模型。以下是一个实用指南：

| 任务 | 推荐模型 | 原因 |
|------|-------------------|-----|
| 文件编辑、代码、终端命令 | `gemma4:31b` | 唯一具有可靠工具调用能力的模型 |
| 快速问答（无需工具调用） | `gemma2:9b` | 对话任务响应速度快 |
| 轻量级聊天 | `llama3.2:3b` | 速度最快，但功能非常有限 |

:::note
对于完整的智能体工作（编辑文件、运行命令、浏览网页），`gemma4:31b` 目前是支持工具调用的最佳本地选项。请查看 [Ollama 的模型库](https://ollama.com/library) 以获取更新的模型 —— 工具调用支持正在迅速扩展。
:::

在会话中随时切换模型：

```
/model gemma2:9b
```

## 步骤 6：优化速度

### 增加 Ollama 的上下文窗口

默认情况下，Ollama 使用 2048 个 token 的上下文。对于智能体工作（工具调用、长对话），您需要更多：

```bash
# 创建一个扩展上下文的 Modelfile
cat > /tmp/Modelfile << 'EOF'
FROM gemma4:31b
PARAMETER num_ctx 16384
EOF

ollama create gemma4-16k -f /tmp/Modelfile
```

然后更新您的 Hermes 配置，将模型名称设置为 `gemma4-16k`。

### 保持模型加载状态

默认情况下，Ollama 在 5 分钟不活动后会卸载模型。对于持久网关机器人，请保持其加载状态：

```bash
# 设置 keep-alive 为 24 小时
curl http://localhost:11434/api/generate \
  -d '{"model": "gemma4:31b", "keep_alive": "24h"}'
```

或者在 Ollama 的环境变量中全局设置：

```bash
# /etc/systemd/system/ollama.service.d/override.conf
[Service]
Environment="OLLAMA_KEEP_ALIVE=24h"
```

### 使用 GPU 卸载（如果可用）

如果您有 NVIDIA GPU，Ollama 会自动将层卸载到 GPU 上。使用以下命令检查：

```bash
ollama ps   # 显示哪个模型已加载以及有多少 GPU 层
```

对于在 12 GB GPU 上的 31B 模型，您将获得部分卸载（约 40 层在 GPU 上，其余在 CPU 上），这仍然能带来显著的速度提升。

## 步骤 7：作为网关机器人运行（可选）

一旦 Hermes 在 CLI 中本地正常工作，您可以将其暴露为 Telegram 或 Discord 机器人 —— 仍然完全运行在您自己的硬件上。

### Telegram

1. 通过 [@BotFather](https://t.me/BotFather) 创建一个机器人并获取令牌
2. 添加到您的 `~/.hermes/config.yaml`：

```yaml
model:
  default: "gemma4:31b"
  provider: "custom"
  base_url: "http://localhost:11434/v1"

platforms:
  telegram:
    enabled: true
    token: "YOUR_TELEGRAM_BOT_TOKEN"
```

3. 启动网关：

```bash
hermes gateway
```

现在通过 Telegram 向您的机器人发送消息 —— 它将使用您的本地模型进行响应。

### Discord

1. 在 [discord.com/developers](https://discord.com/developers/applications) 创建一个 Discord 应用程序
2. 添加到配置：

```yaml
platforms:
  discord:
    enabled: true
    token: "YOUR_DISCORD_BOT_TOKEN"
```

3. 启动：`hermes gateway`

## 步骤 8：设置备用方案（可选）

本地模型在处理复杂任务时可能会遇到困难。设置一个云端备用方案，仅在本地模型失败时激活：

```yaml
model:
  default: "gemma4:31b"
  provider: "custom"
  base_url: "http://localhost:11434/v1"

fallback_providers:
  - provider: openrouter
    model: anthropic/claude-sonnet-4
```

这样，您 90% 的使用都是免费的（本地），只有困难的任务才会调用付费 API。

## 故障排除

### 启动时出现“连接被拒绝”

Ollama 未运行。启动它：

```bash
sudo systemctl start ollama
# 或者
ollama serve
```

### 响应缓慢

- **检查模型大小与内存：** 如果模型需要的内存超过可用内存，它会交换到磁盘。使用更小的模型或增加内存。
- **检查 `ollama ps`：** 如果没有 GPU 层被卸载，响应将受限于 CPU。这对于仅使用 CPU 的服务器来说是正常的。
- **减少上下文：** 大型对话会减慢推理速度。定期使用 `/compress`，或在配置中设置较低的压缩阈值。

### 模型不遵循工具调用

较小的模型（3B、7B）有时会忽略工具调用指令，并生成纯文本而不是结构化的函数调用。解决方案：

- **使用更大的模型** —— `gemma4:31b` 或 `gemma2:27b` 处理工具调用的能力远优于 3B/7B 模型。
- **Hermes 具有自动修复功能** —— 它检测格式错误的工具调用并尝试自动修复。
- **设置备用方案** —— 如果本地模型失败 3 次，Hermes 将回退到云端提供商。

### 上下文窗口错误

默认的 Ollama 上下文（2048 个 token）对于智能体工作来说太小。请参阅[步骤 6](#step-6-optimize-for-speed) 以增加其大小。

## 成本比较

以下是与云端 API 相比，本地运行所节省的成本，基于典型的编码会话（约 10 万个 token 输入，约 2 万个 token 输出）：

| 提供商 | 每次会话成本 | 每月（每日使用） |
|----------|-----------------|---------------------|
| Anthropic Claude Sonnet | ~$0.80 | ~$24 |
| OpenRouter (GPT-4o) | ~$0.60 | ~$18 |
| **Ollama（本地）** | **$0.00** | **$0.00** |

您唯一的成本是电费 —— 每次会话大约为 $0.01–0.05，具体取决于硬件。

## 本地运行效果良好的场景

- **文件编辑和代码生成** —— 9B+ 模型处理得很好
- **终端命令** —— Hermes 包装命令、运行它、读取输出，无论使用何种模型
- **网页浏览** —— 浏览器工具负责获取数据；模型仅解释结果
- **定时任务和计划任务** —— 与云端设置完全相同
- **多平台网关** —— Telegram、Discord、Slack 都支持本地模型

## 云端模型更优的场景

- **非常复杂的多步推理** —— 70B+ 或 Claude Opus 等云端模型明显更优
- **长上下文窗口** —— 云端模型提供 10 万–100 万个 token；本地模型通常为 8K–32K
- **大型响应的速度** —— 对于长生成，云端推理速度比仅使用 CPU 的本地更快

最佳方案：日常任务使用本地模型，为困难任务设置云端备用方案。