---
title: "Llama Cpp — llama"
sidebar_label: "Llama Cpp"
description: "llama"
---

{/* 此页面由 `website/scripts/generate-skill-docs.py` 根据技能的 SKILL.md 自动生成。请编辑源 SKILL.md，而非此页面。 */}

# Llama Cpp

llama.cpp 本地 GGUF 推理 + Hugging Face Hub 模型发现。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/mlops/inference/llama-cpp` |
| 版本 | `2.1.2` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖项 | `llama-cpp-python>=0.2.0` |
| 平台 | linux, macos, windows |
| 标签 | `llama.cpp`, `GGUF`, `Quantization`, `Hugging Face Hub`, `CPU Inference`, `Apple Silicon`, `Edge Deployment`, `AMD GPUs`, `Intel GPUs`, `NVIDIA`, `URL-first` |

## 参考：完整 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# llama.cpp + GGUF

使用此技能进行本地 GGUF 推理、量化选择或为 llama.cpp 发现 Hugging Face 仓库。

## 何时使用

- 在 CPU、Apple Silicon、CUDA、ROCm 或 Intel GPU 上运行本地模型
- 为特定 Hugging Face 仓库查找合适的 GGUF
- 根据 Hub 信息构建 `llama-server` 或 `llama-cli` 命令
- 在 Hub 上搜索已支持 llama.cpp 的模型
- 枚举某个仓库中可用的 `.gguf` 文件及其大小
- 根据用户的 RAM 或显存，在 Q4/Q5/Q6/IQ 变体之间做出选择

## 模型发现工作流

在询问 `hf`、Python 或自定义脚本之前，优先使用 URL 工作流。

1.  在 Hub 上搜索候选仓库：
    -   基础: `https://huggingface.co/models?apps=llama.cpp&sort=trending`
    -   添加 `search=<term>` 以搜索特定模型系列
    -   当用户有尺寸限制时，添加 `num_parameters=min:0,max:24B` 或类似参数
2.  使用 llama.cpp 本地应用视图打开仓库：
    -   `https://huggingface.co/<repo>?local-app=llama.cpp`
3.  当可见时，将本地应用代码片段视为权威信息来源：
    -   精确复制 `llama-server` 或 `llama-cli` 命令
    -   准确报告 HF 显示的推荐量化版本
4.  将相同的 `?local-app=llama.cpp` URL 作为页面文本或 HTML 读取，并提取 `Hardware compatibility` 部分：
    -   优先使用其确切的量化标签和大小，而非通用表格
    -   保留特定仓库的标签，如 `UD-Q4_K_M` 或 `IQ4_NL_XL`
    -   如果在获取的页面源码中看不到该部分，请说明并退回到树 API 加通用量化指导
5.  查询树 API 以确认实际存在的文件：
    -   `https://huggingface.co/api/models/<repo>/tree/main?recursive=true`
    -   保留 `type` 为 `file` 且 `path` 以 `.gguf` 结尾的条目
    -   使用 `path` 和 `size` 作为文件名和字节大小的权威来源
    -   将量化检查点与 `mmproj-*.gguf` 投影仪文件和 `BF16/` 分片文件分开
    -   仅将 `https://huggingface.co/<repo>/tree/main` 作为人工备选方案
6.  如果本地应用代码片段在文本中不可见，则根据仓库和所选量化重建命令：
    -   简写量化选择：`llama-server -hf <repo>:<QUANT>`
    -   精确文件回退：`llama-server --hf-repo <repo> --hf-file <filename.gguf>`
7.  仅当仓库尚未公开 GGUF 文件时，才建议从 Transformers 权重进行转换。

## 快速开始

### 安装 llama.cpp

```bash
# macOS / Linux (最简单)
brew install llama.cpp
```

```bash
winget install llama.cpp
```

```bash
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp
cmake -B build
cmake --build build --config Release
```

### 直接从 Hugging Face Hub 运行

```bash
llama-cli -hf bartowski/Llama-3.2-3B-Instruct-GGUF:Q8_0
```

```bash
llama-server -hf bartowski/Llama-3.2-3B-Instruct-GGUF:Q8_0
```

### 从 Hub 运行确切的 GGUF 文件

当树 API 显示自定义文件命名或确切的 HF 代码片段缺失时使用此方法。

```bash
llama-server \
    --hf-repo microsoft/Phi-3-mini-4k-instruct-gguf \
    --hf-file Phi-3-mini-4k-instruct-q4.gguf \
    -c 4096
```

### OpenAI 兼容服务器检查

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Write a limerick about Python exceptions"}
    ]
  }'
```

## Python 绑定 (llama-cpp-python)

`pip install llama-cpp-python` (CUDA: `CMAKE_ARGS="-DGGML_CUDA=on" pip install llama-cpp-python --force-reinstall --no-cache-dir`; Metal: `CMAKE_ARGS="-DGGML_METAL=on" ...`)。

### 基本生成

```python
from llama_cpp import Llama

llm = Llama(
    model_path="./model-q4_k_m.gguf",
    n_ctx=4096,
    n_gpu_layers=35,     # 0 用于 CPU, 99 用于完全卸载
    n_threads=8,
)

out = llm("What is machine learning?", max_tokens=256, temperature=0.7)
print(out["choices"][0]["text"])
```

### 聊天 + 流式

```python
llm = Llama(
    model_path="./model-q4_k_m.gguf",
    n_ctx=4096,
    n_gpu_layers=35,
    chat_format="llama-3",   # 或 "chatml", "mistral" 等
)

resp = llm.create_chat_completion(
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is Python?"},
    ],
    max_tokens=256,
)
print(resp["choices"][0]["message"]["content"])

# 流式
for chunk in llm("Explain quantum computing:", max_tokens=256, stream=True):
    print(chunk["choices"][0]["text"], end="", flush=True)
```

### 嵌入

```python
llm = Llama(model_path="./model-q4_k_m.gguf", embedding=True, n_gpu_layers=35)
vec = llm.embed("This is a test sentence.")
print(f"Embedding dimension: {len(vec)}")
```

你也可以直接从 Hub 加载 GGUF：

```python
llm = Llama.from_pretrained(
    repo_id="bartowski/Llama-3.2-3B-Instruct-GGUF",
    filename="*Q4_K_M.gguf",
    n_gpu_layers=35,
)
```

## 选择量化版本

首先使用 Hub 页面，其次使用通用启发式方法。

-   优先使用 HF 为用户硬件配置标记为兼容的确切量化版本。
-   对于一般聊天，从 `Q4_K_M` 开始。
-   对于代码或技术工作，如果内存允许，优先选择 `Q5_K_M` 或 `Q6_K`。
-   对于非常紧张的 RAM 预算，仅在用户明确优先考虑适配性而非质量时，才考虑 `Q3_K_M`、`IQ` 变体或 `Q2` 变体。
-   对于多模态仓库，请单独提及 `mmproj-*.gguf`。投影仪不是主模型文件。
-   不要规范化仓库原生标签。如果页面显示 `UD-Q4_K_M`，就报告 `UD-Q4_K_M`。

## 从仓库中提取可用的 GGUF

当用户询问存在哪些 GGUF 时，返回：

-   文件名
-   文件大小
-   量化标签
-   是主模型还是辅助投影仪

除非请求，否则忽略：

-   README
-   BF16 分片文件
-   imatrix 二进制大对象或校准文件

使用树 API 执行此步骤：

-   `https://huggingface.co/api/models/<repo>/tree/main?recursive=true`

对于像 `unsloth/Qwen3.6-35B-A3B-GGUF` 这样的仓库，本地应用页面可能会显示量化标签，如 `UD-Q4_K_M`、`UD-Q5_K_M`、`UD-Q6_K` 和 `Q8_0`，而树 API 会公开确切的文件路径，如 `Qwen3.6-35B-A3B-UD-Q4_K_M.gguf` 和 `Qwen3.6-35B-A3B-Q8_0.gguf` 及其字节大小。使用树 API 将量化标签转换为确切的文件名。

## 搜索模式

直接使用这些 URL 形式：

```text
https://huggingface.co/models?apps=llama.cpp&sort=trending
https://huggingface.co/models?search=<term>&apps=llama.cpp&sort=trending
https://huggingface.co/models?search=<term>&apps=llama.cpp&num_parameters=min:0,max:24B&sort=trending
https://huggingface.co/<repo>?local-app=llama.cpp
https://huggingface.co/api/models/<repo>/tree/main?recursive=true
https://huggingface.co/<repo>/tree/main
```

## 输出格式

在回答发现请求时，优先选择紧凑的结构化结果，例如：

```text
仓库: <repo>
HF 推荐量化版本: <label> (<size>)
llama-server: <command>
其他 GGUF:
- <filename> - <size>
- <filename> - <size>
来源 URL:
- <local-app URL>
- <tree API URL>
```

## 参考文献

-   **[hub-discovery.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/mlops/inference/llama-cpp/references/hub-discovery.md)** - 仅限 URL 的 Hugging Face 工作流、搜索模式、GGUF 提取和命令重建
-   **[advanced-usage.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/mlops/inference/llama-cpp/references/advanced-usage.md)** — 推测解码、批量推理、语法约束生成、LoRA、多 GPU、自定义构建、基准测试脚本
-   **[quantization.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/mlops/inference/llama-cpp/references/quantization.md)** — 量化质量权衡、何时使用 Q4/Q5/Q6/IQ、模型大小缩放、imatrix
-   **[server.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/mlops/inference/llama-cpp/references/server.md)** — 直接从 Hub 启动服务器、OpenAI API 端点、Docker 部署、NGINX 负载均衡、监控
-   **[optimization.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/mlops/inference/llama-cpp/references/optimization.md)** — CPU 线程、BLAS、GPU 卸载启发式方法、批处理调优、基准测试
-   **[troubleshooting.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/mlops/inference/llama-cpp/references/troubleshooting.md)** — 安装/转换/量化/推理/服务器问题、Apple Silicon、调试

## 资源

-   **GitHub**: https://github.com/ggml-org/llama.cpp
-   **Hugging Face GGUF + llama.cpp 文档**: https://huggingface.co/docs/hub/gguf-llamacpp
-   **Hugging Face 本地应用文档**: https://huggingface.co/docs/hub/main/local-apps
-   **Hugging Face 本地智能体文档**: https://huggingface.co/docs/hub/agents-local
-   **示例本地应用页面**: https://huggingface.co/unsloth/Qwen3.6-35B-A3B-GGUF?local-app=llama.cpp
-   **示例树 API**: https://huggingface.co/api/models/unsloth/Qwen3.6-35B-A3B-GGUF/tree/main?recursive=true
-   **示例 llama.cpp 搜索**: https://huggingface.co/models?num_parameters=min:0,max:24B&apps=llama.cpp&sort=trending
-   **许可证**: MIT