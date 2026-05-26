---
sidebar_position: 2
title: "在Mac上运行本地LLM"
description: "在macOS上通过llama.cpp或MLX搭建本地OpenAI兼容的LLM服务器，包括模型选择、内存优化及Apple Silicon上的真实基准测试"
---

# 在Mac上运行本地LLM

本指南将引导您在macOS上运行一个具有OpenAI兼容API的本地LLM服务器。您将获得完全的隐私、零API成本，以及在Apple Silicon上令人惊喜的性能表现。

我们涵盖两种后端：

| 后端 | 安装 | 擅长 | 格式 |
|------|------|------|------|
| **llama.cpp** | `brew install llama.cpp` | 首个token生成速度最快，通过量化KV缓存实现低内存占用 | GGUF |
| **omlx** | [omlx.ai](https://omlx.ai) | token生成速度最快，原生Metal优化 | MLX (safetensors) |

两者都提供一个OpenAI兼容的 `/v1/chat/completions` 端点。Hermes可以与任一配合使用——只需将其指向 `http://localhost:8080` 或 `http://localhost:8000`。

:::info 仅限Apple Silicon
本指南针对搭载Apple Silicon（M1及更新型号）的Mac。Intel Mac可以使用llama.cpp运行，但无法使用GPU加速——预计性能会显著下降。
:::

---

## 选择模型

入门推荐 **Qwen3.5-9B** ——这是一个强大的推理模型，通过量化后，可在8GB及以上的统一内存中流畅运行。

| 变体 | 磁盘大小 | 所需内存（128K上下文） | 后端 |
|------|----------|------------------------|------|
| Qwen3.5-9B-Q4_K_M (GGUF) | 5.3 GB | 约10 GB（使用量化KV缓存） | llama.cpp |
| Qwen3.5-9B-mlx-lm-mxfp4 (MLX) | 约5 GB | 约12 GB | omlx |

**内存经验法则：** 模型大小 + KV缓存。一个9B的Q4模型约5GB。在128K上下文下，使用Q4量化的KV缓存会增加约4-5GB。如果使用默认（f16）的KV缓存，内存占用会膨胀到约16GB。llama.cpp中的量化KV缓存标志是内存受限系统的关键技巧。

对于更大的模型（27B、35B），您需要32GB及以上的统一内存。9B模型是8-16GB机器的最佳平衡点。

---

## 选项A：llama.cpp

llama.cpp是最便携的本地LLM运行时。在macOS上，它默认使用Metal进行GPU加速。

### 安装

```bash
brew install llama.cpp
```

这将为您全局安装 `llama-server` 命令。

### 下载模型

您需要一个GGUF格式的模型。最简单的来源是通过 `huggingface-cli` 从Hugging Face下载：

```bash
brew install huggingface-cli
```

然后下载：

```bash
huggingface-cli download unsloth/Qwen3.5-9B-GGUF Qwen3.5-9B-Q4_K_M.gguf --local-dir ~/models
```

:::tip 需授权的模型
Hugging Face上的一些模型需要认证。如果遇到401或404错误，请先运行 `huggingface-cli login`。
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
|------|------|
| `-ngl 99` | 将所有层卸载到GPU（Metal）。使用一个高数值以确保没有层留在CPU上。 |
| `-c 131072` | 上下文窗口大小（128K tokens）。如果内存不足，请减小此值。 |
| `-np 1` | 并行槽位数。单用户使用时保持为1——更多的槽位会分摊您的内存预算。 |
| `-fa on` | 闪存注意力。减少内存使用并加速长上下文推理。 |
| `--cache-type-k q4_0` | 将键缓存量化为4位。**这是主要的内存节省手段。** |
| `--cache-type-v q4_0` | 将值缓存量化为4位。与上述结合使用，可将KV缓存内存减少约75%（相较于f16）。 |
| `--host 0.0.0.0` | 监听所有网络接口。如果不需要网络访问，使用 `127.0.0.1`。 |

当您看到以下信息时，服务器已准备就绪：

```
main: server is listening on http://0.0.0.0:8080
srv  update_slots: all slots are idle
```

### 针对受限系统的内存优化

对于内存有限的系统，`--cache-type-k q4_0 --cache-type-v q4_0` 标志是最重要的优化。以下是在128K上下文下的影响：

| KV缓存类型 | KV缓存内存占用（128K上下文，9B模型） |
|------------|--------------------------------------|
| f16 (默认) | 约16 GB |
| q8_0 | 约8 GB |
| **q4_0** | **约4 GB** |

在8GB的Mac上，请使用 `q4_0` KV缓存，并选择一个仍能满足Hermes最低64K上下文要求的小型模型。在16GB上，您可以舒适地使用128K上下文。在32GB及以上，您可以运行更大的模型或多个并行槽位。

如果仍然内存不足，可仅在确保不低于Hermes最低64K上下文的前提下减少上下文；否则，请切换到更小的模型或更小的量化级别（使用Q3_K_M而非Q4_K_M）。

### 测试

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

如果忘记模型名称，可以查询模型端点：

```bash
curl -s http://localhost:8080/v1/models | jq '.data[].id'
```

---

## 选项B：通过omlx使用MLX

[omlx](https://omlx.ai) 是一个macOS原生应用程序，用于管理和提供MLX模型。MLX是Apple自家的机器学习框架，专门为Apple Silicon的统一内存架构进行了优化。

### 安装

从 [omlx.ai](https://omlx.ai) 下载并安装。它提供了一个用于模型管理的GUI界面和一个内置服务器。

### 下载模型

使用omlx应用程序浏览和下载模型。搜索 `Qwen3.5-9B-mlx-lm-mxfp4` 并下载。模型将存储在本地（通常位于 `~/.omlx/models/`）。

### 启动服务器

omlx默认在 `http://127.0.0.1:8000` 上提供模型服务。从应用程序界面开始服务，或使用CLI（如果可用）。

### 测试

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

omlx可以同时提供多个模型服务：

```bash
curl -s http://127.0.0.1:8000/v1/models | jq '.data[].id'
```

---

## 基准测试：llama.cpp vs MLX

两种后端在同一台机器（Apple M5 Max，128GB统一内存）上运行相同的模型（Qwen3.5-9B），使用相近的量化级别（GGUF使用Q4_K_M，MLX使用mxfp4）。使用五个多样化的提示，每个提示运行三次，两种后端顺序测试以避免资源竞争。

### 结果

| 指标 | llama.cpp (Q4_K_M) | MLX (mxfp4) | 获胜者 |
|------|-------------------|-------------|--------|
| **TTFT (平均)** | **67 ms** | 289 ms | llama.cpp (快4.3倍) |
| **TTFT (p50)** | **66 ms** | 286 ms | llama.cpp (快4.3倍) |
| **生成速度 (平均)** | 70 tok/s | **96 tok/s** | MLX (快37%) |
| **生成速度 (p50)** | 70 tok/s | **96 tok/s** | MLX (快37%) |
| **总时间 (512 tokens)** | 7.3s | **5.5s** | MLX (快25%) |

### 这意味着什么

- **llama.cpp** 在提示处理方面表现出色——其闪存注意力+量化KV缓存流水线使您能在约66ms内获得第一个token。如果您正在构建对感知响应性要求高的交互式应用程序（聊天机器人、自动补全），这是一个显著的优势。

- **MLX** 在开始生成后，token生成速度快约37%。对于批处理工作负载、长文本生成，或任何将总完成时间看得比初始延迟更重要的任务，MLX能更快完成。

- 两种后端都**极其稳定**——不同运行之间的差异可以忽略不计。您可以信赖这些数据。

### 您应该如何选择？

| 使用场景 | 推荐方案 |
|----------|----------|
| 交互式聊天、低延迟工具 | llama.cpp |
| 长文本生成、批量处理 | MLX (omlx) |
| 内存受限（8-16 GB） | llama.cpp（量化KV缓存无可匹敌） |
| 同时提供多个模型服务 | omlx（内置多模型支持） |
| 最大兼容性（也支持Linux） | llama.cpp |

---

## 连接到Hermes

本地服务器运行后：

```bash
hermes model
```

选择 **自定义端点** 并按照提示操作。它会要求提供基础URL和模型名称——请使用您在上面设置的任一后端的相应值。

---

## 超时设置

Hermes会自动检测本地端点（localhost、局域网IP）并放宽其流式传输超时设置。对于大多数配置，无需任何设置。

如果您仍然遇到超时错误（例如在慢速硬件上处理非常大的上下文），您可以覆盖流式读取超时：

```bash
# 在您的 .env 文件中 —— 将默认值120秒提升至30分钟
HERMES_STREAM_READ_TIMEOUT=1800
```

| 超时类型 | 默认值 | 本地自动调整 | 环境变量覆盖 |
|----------|--------|--------------|--------------|
| 流读取（套接字级别） | 120秒 | 提高到1800秒 | `HERMES_STREAM_READ_TIMEOUT` |
| 过时流检测 | 180秒 | 完全禁用 | `HERMES_STREAM_STALE_TIMEOUT` |
| API调用（非流式） | 1800秒 | 无需更改 | `HERMES_API_TIMEOUT` |

流读取超时是最可能导致问题的一个——这是接收下一块数据的套接字级别截止时间。在处理大上下文的预填充期间，本地模型可能在处理提示时几分钟内没有任何输出。自动检测机制会透明地处理此问题。