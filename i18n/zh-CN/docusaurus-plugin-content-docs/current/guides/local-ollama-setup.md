---
sidebar_position: 9
title: "使用 Ollama 在本地运行 Hermes —— 零 API 成本"
description: "分步指南：如何完全在你自己的机器上，借助 Ollama 和诸如 Gemma 4 等开源权重模型运行 Hermes 智能体，无需任何云 API 密钥或付费订阅"
---

# 使用 Ollama 在本地运行 Hermes —— 零 API 成本

## 问题所在

云端的大语言模型 API 按 token 收费。一次密集的编码对话可能花费 5 到 20 美元。对于个人项目、学习或涉及隐私敏感的工作，这笔费用会不断累积——而且你还要将每一次对话都发送给第三方。

## 本指南解决的问题

您将在本地硬件上完全运行 Hermes 智能体，使用 [Ollama](https://ollama.com) 作为模型后端。无需 API 密钥、无需订阅、数据不会离开您的设备。配置完成后，Hermes 的工作方式与使用 OpenRouter 或 Anthropic 时完全相同——终端命令、文件编辑、网页浏览、任务委派——但模型是在本地运行的。

完成后，您将拥有：

- Ollama 服务运行着一个或多个开源模型
- Hermes 已连接到 Ollama 作为自定义端点
- 一个可以在本地编辑文件、运行命令和浏览网页的工作智能体
- 可选：一个完全由您自己的硬件驱动的 Telegram/Discord 机器人

## 您需要什么

| 组件 | 最低要求 | 推荐配置 |
|-----------|---------|-------------|
| **内存** | 8 GB（适用于 3B 模型） | 32+ GB（适用于 27B+ 模型） |
| **存储** | 5 GB 可用空间 | 30+ GB（用于存放多个模型） |
| **CPU** | 4 核 | 8+ 核（AMD EPYC、Ryzen、Intel Xeon） |
| **GPU** | 非必需 | 拥有 8+ GB 显存的 NVIDIA GPU 能显著提升速度 |

:::tip 纯 CPU 可以运行，但响应速度会较慢
Ollama 可在仅 CPU 的服务器上运行。在现代 8 核 CPU 上运行 9B 模型可达到约 10 个 token/秒。在 CPU 上运行 31B 模型会更慢（约 2-5 个 token/秒）——每个响应需要 30-120 秒，但它可以工作。GPU 会极大改善这一点。对于纯 CPU 设置，可通过环境变量加宽 API 超时时间（这不是 `config.yaml` 的键）：

```bash
# ~/.hermes/.env
HERMES_API_TIMEOUT=1800   # 30 分钟——为较慢的本地模型提供充裕时间
```
:::

## 第一步：安装 Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

验证其正在运行：

```bash
ollama --version
curl http://localhost:11434/api/tags   # 应返回 {"models":[]}
```

## 第二步：拉取一个模型

根据您的硬件选择：

| 模型 | 磁盘占用 | 所需内存 | 工具调用 | 最佳用途 |
|-------|-------------|------------|:------------:|----------|
| `gemma4:31b` | ~20 GB | 24+ GB | 是 | 最佳质量——强大的工具使用和推理能力 |
| `gemma2:27b` | ~16 GB | 20+ GB | 否 | 对话任务，不使用工具 |
| `gemma2:9b` | ~5 GB | 8+ GB | 否 | 快速聊天、问答——无法调用工具 |
| `llama3.2:3b` | ~2 GB | 4+ GB | 否 | 仅用于轻量级快速回答 |

:::warning 工具调用很重要
Hermes 是一个**智能体**助手——它通过工具调用来编辑文件、运行命令和浏览网页。不支持工具调用的模型只能聊天，无法执行操作。要获得完整的 Hermes 体验，请使用支持工具的模型（如 `gemma4:31b`）。
:::

拉取您选择的模型：

```bash
ollama pull gemma4:31b
```

:::info 多个模型
您可以拉取多个模型，并在 Hermes 中使用 `/model` 命令切换。Ollama 会按需将活动模型加载到内存中，并自动卸载空闲模型。
:::

验证模型是否工作：

```bash
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemma4:31b",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 50
  }'
```

您应该看到一个包含模型回复的 JSON 响应。

## 第三步：配置 Hermes

运行 Hermes 设置向导：

```bash
hermes setup
```

当提示选择提供商时，选择 **自定义端点** 并输入：

- **基础 URL:** `http://localhost:11434/v1`
- **API 密钥:** 留空或输入 `no-key`（Ollama 不需要）
- **模型:** `gemma4:31b`（或您拉取的任何模型）

或者，直接编辑 `~/.hermes/config.yaml`：

```yaml
model:
  default: "gemma4:31b"
  provider: "custom"
  base_url: "http://localhost:11434/v1"
```

## 第四步：开始使用 Hermes

```bash
hermes
```

就这样。您现在运行的是一个完全本地的智能体。试试看：

```
You: 列出此目录中的所有 Python 文件并计算每个文件的代码行数

You: 读取 README.md 并总结这个项目是做什么的

You: 创建一个获取胡志明市天气的 Python 脚本
```

Hermes 将使用终端工具、文件操作和您的本地模型——不涉及云端调用。

## 第五步：为您的任务选择合适的模型

并非每个任务都需要最大的模型。这是一个实用指南：

| 任务 | 推荐模型 | 原因 |
|------|-------------------|-----|
| 文件编辑、代码、终端命令 | `gemma4:31b` | 唯一可靠支持工具调用的模型 |
| 快速问答（无需工具） | `gemma2:9b` | 针对对话任务提供快速响应 |
| 轻量聊天 | `llama3.2:3b` | 最快，但功能非常有限 |

:::note
对于完整的智能体工作（编辑文件、运行命令、浏览），`gemma4:31b` 目前是本地支持工具调用的最佳选择。请查看 [Ollama 的模型库](https://ollama.com/library) 获取更新的模型——工具调用支持正在迅速扩展。
:::

在会话中随时切换模型：

```
/model gemma2:9b
```

## 第六步：速度优化

### 增加 Ollama 的上下文窗口

默认情况下，Ollama 使用 2048 个 token 的上下文。Hermes 的智能体工作至少需要 64,000 个 token：

```bash
# 创建一个扩展上下文的 Modelfile
cat > /tmp/Modelfile << 'EOF'
FROM gemma4:31b
PARAMETER num_ctx 64000
EOF

ollama create gemma4-64k -f /tmp/Modelfile
```

然后更新您的 Hermes 配置，将模型名称改为 `gemma4-64k`。

### 保持模型加载状态

默认情况下，Ollama 会在 5 分钟不活动后卸载模型。对于持久的网关机器人，保持其加载状态：

```bash
# 设置保持活动时间为 24 小时
curl http://localhost:11434/api/generate \
  -d '{"model": "gemma4:31b", "keep_alive": "24h"}'
```

或在 Ollama 的环境中全局设置：

```bash
# /etc/systemd/system/ollama.service.d/override.conf
[Service]
Environment="OLLAMA_KEEP_ALIVE=24h"
```

### 使用 GPU 卸载（如果可用）

如果您有 NVIDIA GPU，Ollama 会自动将模型层卸载到 GPU 上。使用以下命令检查：

```bash
ollama ps   # 显示加载的模型以及加载到 GPU 的层数
```

对于在 12 GB GPU 上运行 31B 模型，您将获得部分卸载（约 40 层在 GPU 上，其余在 CPU 上），这仍然能提供显著的速度提升。

## 第七步：作为网关机器人运行（可选）

一旦 Hermes 在 CLI 中本地运行成功，您可以将其暴露为 Telegram 或 Discord 机器人——仍然完全运行在您的硬件上。

### Telegram

1.  通过 [@BotFather](https://t.me/BotFather) 创建一个机器人并获取 token
2.  添加到您的 `~/.hermes/config.yaml`：

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

3.  启动网关：

```bash
hermes gateway
```

现在在 Telegram 上给您的机器人发消息——它将使用您的本地模型进行响应。

### Discord

1.  在 [discord.com/developers](https://discord.com/developers/applications) 创建一个 Discord 应用程序
2.  添加到配置：

```yaml
platforms:
  discord:
    enabled: true
    token: "YOUR_DISCORD_BOT_TOKEN"
```

3.  启动：`hermes gateway`

## 第八步：设置回退方案（可选）

本地模型处理复杂任务可能比较吃力。设置一个云端回退方案，仅在本地模型失败时激活：

```yaml
model:
  default: "gemma4:31b"
  provider: "custom"
  base_url: "http://localhost:11434/v1"

fallback_providers:
  - provider: openrouter
    model: anthropic/claude-sonnet-4
```

这样，您 90% 的使用是免费的（本地），只有困难的任务才会调用付费 API。

## 故障排除

### 启动时“连接被拒绝”

Ollama 没有运行。启动它：

```bash
sudo systemctl start ollama
# 或
ollama serve
```

### 响应缓慢

-   **检查模型大小与内存：** 如果您的模型需要的内存超过可用内存，它将交换到磁盘。使用更小的模型或增加内存。
-   **检查 `ollama ps`：** 如果没有 GPU 层被卸载，响应将受 CPU 限制。这对纯 CPU 服务器来说是正常的。
-   **减少上下文：** 大量对话会减慢推理速度。定期使用 `/compress`，或在配置中设置更低的压缩阈值。

### 模型不遵循工具调用

较小的模型（3B、7B）有时会忽略工具调用指令，生成纯文本而不是结构化的函数调用。解决方案：

-   **使用更大的模型** —— `gemma4:31b` 或 `gemma2:27b` 处理工具调用比 3B/7B 模型好得多。
-   **Hermes 有自动修复功能** —— 它检测格式错误的工具调用并尝试自动修复。
-   **设置回退方案** —— 如果本地模型失败 3 次，Hermes 会回退到云端提供商。

### 上下文窗口错误

默认的 Ollama 上下文（2048 个 token）对于智能体工作来说太小了。请参阅[第 6 步](#step-6-optimize-for-speed)来增加它。

## 成本比较

以下是本地运行与云端 API 相比的成本节省，基于一次典型的编码会话（约 100K 个 token 输入，约 20K 个 token 输出）：

| 提供商 | 每次会话成本 | 每月成本（每日使用） |
|----------|-----------------|---------------------|
| Anthropic Claude Sonnet | ~$0.80 | ~$24 |
| OpenRouter (GPT-4o) | ~$0.60 | ~$18 |
| **Ollama (本地)** | **$0.00** | **$0.00** |

您唯一的成本是电费——根据硬件不同，每次会话大约 $0.01–0.05。

## 本地运行良好的功能

-   **文件编辑和代码生成** —— 9B+ 模型能很好地处理
-   **终端命令** —— Hermes 封装命令、运行、读取输出，与模型无关
-   **网页浏览** —— 浏览器工具负责获取数据；模型只需解释结果
-   **定时任务和计划任务** —— 与云端设置完全相同
-   **多平台网关** —— Telegram、Discord、Slack 都支持本地模型

## 使用云端模型更好的方面

-   **非常复杂的多步推理** —— 70B+ 或 Claude Opus 等云端模型明显更好
-   **长上下文窗口** —— 云端模型提供 100K–1M 个 token；本地运行时通常默认低于 Hermes 的 64K 最小值，除非您进行配置
-   **长响应的速度** —— 对于长篇生成，云端推理比仅 CPU 的本地推理更快

最佳方案：日常任务使用本地模型，为困难任务设置云端回退。