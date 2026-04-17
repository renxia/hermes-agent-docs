---
sidebar_position: 2
title: "Mac上运行本地LLM"
description: "在macOS上使用llama.cpp或MLX设置本地OpenAI兼容的LLM服务器，包括模型选择、内存优化以及在Apple Silicon上的真实基准测试"
---

# Mac上运行本地LLM

本指南将指导您如何在macOS上设置一个具有OpenAI兼容API的本地LLM服务器。您将获得完全的隐私性、零API成本，以及在Apple Silicon上出乎意料的好性能。

我们涵盖了两个后端：

| 后端 | 安装 | 最佳用途 | 格式 |
|---------|---------|---------|--------|
| **llama.cpp** | `brew install llama.cpp` | 最快的首次生成Token时间，量化KV缓存可降低内存占用 | GGUF |
| **omlx** | [omlx.ai](https://omlx.ai) | 最快的Token生成速度，原生Metal优化 | MLX (safetensors) |

两者都暴露了OpenAI兼容的`/v1/chat/completions`端点。Hermes可以与两者兼容——只需将其指向`http://localhost:8080`或`http://localhost:8000`即可。

:::info 仅限Apple Silicon
本指南针对配备Apple Silicon（M1及更高版本）的Mac。Intel Mac可以使用llama.cpp，但无法进行GPU加速——预计性能会明显慢很多。
:::

---

## 选择模型

为了入门，我们推荐使用**Qwen3.5-9B**——它是一个强大的推理模型，在进行量化后，可以舒适地占用8GB+的统一内存。

| 变体 | 磁盘大小 | 所需内存 (128K上下文) | 后端 |
|---------|-------------|---------------------------|---------|
| Qwen3.5-9B-Q4_K_M (GGUF) | 5.3 GB | ~10 GB (带量化KV缓存) | llama.cpp |
| Qwen3.5-9B-mlx-lm-mxfp4 (MLX) | ~5 GB | ~12 GB | omlx |

**内存经验法则：** 模型大小 + KV缓存。一个9B的Q4模型约为5 GB。在128K上下文和Q4量化下，KV缓存会增加~4-5 GB。如果使用默认的(f16) KV缓存，这个数值会飙升到~16 GB。llama.cpp中的量化KV缓存标志是内存受限系统的关键技巧。

对于更大的模型（27B, 35B），您需要32 GB+的统一内存。对于8-16 GB的机器来说，9B是最佳平衡点。

---

## 选项A: llama.cpp

llama.cpp是最具可移植性的本地LLM运行时。在macOS上，它开箱即用地使用Metal进行GPU加速。

### 安装

```bash
brew install llama.cpp
```

这将全局提供`llama-server`命令。

### 下载模型

您需要一个GGUF格式的模型。最简单的来源是通过`huggingface-cli`从Hugging Face获取：

```bash
brew install huggingface-cli
```

然后下载：

```bash
huggingface-cli download unsloth/Qwen3.5-9B-GGUF Qwen3.5-9B-Q4_K_M.gguf --local-dir ~/models
```

:::tip 受限模型
Hugging Face上的某些模型需要身份验证。如果您遇到401或404错误，请先运行`huggingface-cli login`。
:::

### 启动服务器

```bash
llama-server -m ~/models/Qwen3.5-9B-Q4_K_M.gguf \
  -ngl 99 \
  -c 131072 \
  -np 1 \
  -fa on \
  --cache-type-k q4_0 \
  --cache-type-v q4_0 \
  --host 0.0.0.0
```

以下是每个标志的作用：

| 标志 | 用途 |
|------|---------|
| `-ngl 99` | 将所有层卸载到GPU (Metal)。使用一个较高的数字以确保没有内容留在CPU上。 |
| `-c 131072` | 上下文窗口大小 (128K tokens)。如果内存不足，请减小此值。 |
| `-np 1` | 并行槽位数。对于单用户使用，保持为1——更多的槽位会分散您的内存预算。 |
| `-fa on` | Flash attention。减少内存使用并加速长上下文推理。 |
| `--cache-type-k q4_0` | 将键缓存量化为4位。**这是主要的内存节省点。** |
| `--cache-type-v q4_0` | 将值缓存量化为4位。与上述结合使用，可将KV缓存内存比f16减少约75%。 |
| `--host 0.0.0.0` | 监听所有接口。如果不需要网络访问，请使用`127.0.0.1`。 |

当您看到以下输出时，服务器即已准备就绪：

```
main: server is listening on http://0.0.0.0:8080
srv  update_slots: all slots are idle
```

### 内存优化（针对资源受限系统）

`--cache-type-k q4_0 --cache-type-v q4_0`标志是内存有限系统最重要的优化。在128K上下文下的影响如下：

| KV缓存类型 | KV缓存内存 (128K上下文, 9B模型) |
|---------------|--------------------------------------|
| f16 (默认) | ~16 GB |
| q8_0 | ~8 GB |
| **q4_0** | **~4 GB** |

在8 GB的Mac上，使用`q4_0` KV缓存并将上下文减小到`-c 32768` (32K)。在16 GB上，您可以舒适地处理128K上下文。在32 GB以上，您可以运行更大的模型或多个并行槽位。

如果内存仍然不足，请首先减小上下文大小（`-c`），然后尝试更小的量化（使用Q3_K_M代替Q4_K_M）。

### 测试它

```bash
curl -s http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen3.5-9B-Q4_K_M.gguf",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 50
  }' | jq .choices[0].message.content
```

### 获取模型名称

如果您忘记了模型名称，请查询模型端点：

```bash
curl -s http://localhost:8080/v1/models | jq '.data[].id'
```

---

## 选项B: omlx (通过MLX)

[omlx](https://omlx.ai)是一个macOS原生应用，用于管理和提供MLX模型。MLX是Apple自己的机器学习框架，专门针对Apple Silicon的统一内存架构进行了优化。

### 安装

从[omlx.ai](https://omlx.ai)下载并安装。它提供了一个用于模型管理和内置服务器的图形界面。

### 下载模型

使用omlx应用浏览和下载模型。搜索`Qwen3.5-9B-mlx-lm-mxfp4`并下载。模型会存储在本地（通常在`~/.omlx/models/`）。

### 启动服务器

omlx默认在`http://127.0.0.1:8000`上提供服务。请从应用UI启动服务，或使用CLI（如果可用）。

### 测试它

```bash
curl -s http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen3.5-9B-mlx-lm-mxfp4",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 50
  }' | jq .choices[0].message.content
```

### 列出可用模型

omlx可以同时提供多个模型：

```bash
curl -s http://127.0.0.1:8000/v1/models | jq '.data[].id'
```

---

## 基准测试：llama.cpp vs MLX

两个后端都在同一台机器（Apple M5 Max，128 GB统一内存）上，使用相同的模型（Qwen3.5-9B）并在可比较的量化级别（GGUF的Q4_K_M，MLX的mxfp4）下进行测试。使用了五个不同的提示，每个后端运行三次，以避免资源冲突。

### 结果

| 指标 | llama.cpp (Q4_K_M) | MLX (mxfp4) | 获胜者 |
|--------|-------------------|-------------|--------|
| **TTFT (平均)** | **67 ms** | 289 ms | llama.cpp (快4.3倍) |
| **TTFT (p50)** | **66 ms** | 286 ms | llama.cpp (快4.3倍) |
| **生成速度 (平均)** | 70 tok/s | **96 tok/s** | MLX (快37%) |
| **生成速度 (p50)** | 70 tok/s | **96 tok/s** | MLX (快37%) |
| **总时间 (512 tokens)** | 7.3s | **5.5s** | MLX (快25%) |

### 这意味着什么

- **llama.cpp** 在提示处理方面表现出色——其Flash Attention + 量化KV缓存流程可以在约66毫秒内获得第一个Token。如果您正在构建需要感知响应速度的交互式应用（聊天机器人、自动补全），这是一个有意义的优势。

- **MLX** 一旦开始生成，其Token生成速度比llama.cpp快约37%。对于批量工作负载、长篇生成或任何总完成时间比初始延迟更重要的任务，MLX会更快完成。

- 两个后端都**极其稳定**——运行间的方差可以忽略不计。您可以信赖这些数据。

### 您应该选择哪一个？

| 用例 | 推荐 |
|----------|---------------|
| 交互式聊天、低延迟工具 | llama.cpp |
| 长篇生成、批量处理 | MLX (omlx) |
| 内存受限（8-16 GB） | llama.cpp (量化KV缓存无与伦比) |
| 同时提供多个模型服务 | omlx (内置多模型支持) |
| 最大兼容性（包括Linux） | llama.cpp |

---

## 连接到Hermes

本地服务器运行后：

```bash
hermes model
```

选择**自定义端点**并按照提示操作。它会要求您提供基础URL和模型名称——请使用您设置的任何后端的值。

---

## 超时设置

Hermes会自动检测本地端点（localhost, LAN IP）并放宽其流式超时设置。大多数设置无需配置。

如果您仍然遇到超时错误（例如，在低性能硬件上处理非常大的上下文），您可以覆盖流式读取超时：

```bash
# 在您的.env文件中 — 将默认的120秒提高到30分钟
HERMES_STREAM_READ_TIMEOUT=1800
```

| 超时类型 | 默认值 | 本地自动调整 | 环境变量覆盖 |
|---------|---------|------|--|
| 流读取 (socket级别) | 120s | 提高到1800s | `HERMES_STREAM_READ_TIMEOUT` |
| 僵尸流检测 | 180s | 完全禁用 | `HERMES_STREAM_STALE_TIMEOUT` |
| API调用 (非流式) | 1800s | 无需更改 | `HERMES_API_TIMEOUT` |

流读取超时是最可能引起问题的地方——它是接收下一个数据块的套接字级截止时间。在大型上下文的预填充过程中，本地模型在处理提示时可能会有几分钟没有输出。自动检测会透明地处理这一点。