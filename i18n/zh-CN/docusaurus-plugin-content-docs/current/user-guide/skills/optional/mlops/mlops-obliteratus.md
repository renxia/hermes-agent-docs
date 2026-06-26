---
title: "Obliteratus — OBLITERATUS: abliterate LLM refusals (diff-in-means)"
sidebar_label: Obliteratus
description: "OBLITERATUS: abliterate LLM refusals (diff-in-means)"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Obliteratus

OBLITERATUS: abliterate LLM refusals (diff-in-means).

## Skill metadata

| | |
|---|---|
| Source | Optional — install with `hermes skills install official/mlops/obliteratus` |
| Path | `optional-skills/mlops/obliteratus` |
| Version | `2.0.0` |
| Author | Hermes 智能体 |
| License | MIT |
| Dependencies | `obliteratus`, `torch`, `transformers`, `bitsandbytes`, `accelerate`, `safetensors` |
| Platforms | linux, macos |
| Tags | `Abliteration`, `Uncensoring`, `Refusal-Removal`, `LLM`, `Weight-Projection`, `SVD`, `Mechanistic-Interpretability`, `HuggingFace`, `Model-Surgery` |
| Related skills | `vllm`, `gguf`, [`huggingface-tokenizers`](/docs/user-guide/skills/optional/mlops/mlops-huggingface-tokenizers) |

## Key Paths & Config

```
~/.hermes/config.yaml       Main configuration
~/.hermes/.env              API keys and secrets (under $HERMES_HOME if set)
$HERMES_HOME
```

# OBLITERATUS 技能

## 概述

9 种 CLI 方法、28 个分析模块、跨 5 个计算层级的 116 个模型预设，以及基于遥测数据的推荐。

在不进行重新训练或微调的情况下，从开源 LLM 中移除拒绝行为（护栏）。它使用机制可解释性技术——包括 diff-in-means、SVD、whitened SVD、LEACE 概念擦除、SAE 分解、贝叶斯核投影等——来识别并外科手术式地切除模型权重中的拒绝方向，同时保留推理能力。

**许可警告：** OBLITERATUS 使用 AGPL-3.0 许可。绝不要将其导入为 Python 库。始终通过 CLI (`obliteratus` 命令) 或子进程调用它。这可以保持 Hermes Agent 的 MIT 许可的纯净性。

## 视频指南

一个 Hermes 智能体使用 OBLITERATUS 来清除 Gemma 的演示：
https://www.youtube.com/watch?v=8fG9BrNTeHs ("OBLITERATUS: 一个移除了 Gemma 4 安全护栏的 AI 智能体")

当用户希望在自己运行之前对端到端工作流程进行可视化概览时，这很有用。

## 何时使用此技能

当用户：
- 希望“解除”或“清除”一个 LLM 时
- 询问如何从模型中移除拒绝/护栏时
- 希望创建 Llama、Qwen、Mistral 等模型的非审查版本时
- 提到“拒绝移除”、“清除”、“权重投影”时
- 希望分析模型的拒绝机制是如何工作的时
- 引用 OBLITERATUS、abliterator 或拒绝方向时

## 第 1 步：安装

检查是否已安装：
```bash
obliteratus --version 2>/dev/null && echo "INSTALLED" || echo "NOT INSTALLED"
```

如果未安装，请从 GitHub 克隆并安装：
```bash
git clone https://github.com/elder-plinius/OBLITERATUS.git
cd OBLITERATUS
pip install -e .
# 如果需要 Gradio Web UI 支持:
# pip install -e ".[spaces]"
```

**重要提示：** 在安装前与用户确认。这会拉取约 5-10GB 的依赖项（PyTorch, Transformers, bitsandbytes 等）。

## 第 2 步：检查硬件

在做任何事情之前，请检查可用的 GPU：
```bash
python3 -c "
import torch
if torch.cuda.is_available():
    gpu = torch.cuda.get_device_name(0)
    vram = torch.cuda.get_device_properties(0).total_memory / 1024**3
    print(f'GPU: {gpu}')
    print(f'VRAM: {vram:.1f} GB')
    if vram < 4: print('TIER: tiny (models under 1B)')
    elif vram < 8: print('TIER: small (models 1-4B)')
    elif vram < 16: print('TIER: medium (models 4-9B with 4bit quant)')
    elif vram < 32: print('TIER: large (models 8-32B with 4bit quant)')
    else: print('TIER: frontier (models 32B+)')
else:
    print('NO GPU - only tiny models (under 1B) on CPU')
"
```

### VRAM 要求（带 4 位量化）

| VRAM | 最大模型大小 | 示例模型 |
|:---|:---|:---|
| 仅 CPU | ~1B 参数 | GPT-2, TinyLlama, SmolLM |
| 4-8 GB | ~4B 参数 | Qwen2.5-1.5B, Phi-3.5 mini, Llama 3.2 3B |
| 8-16 GB | ~9B 参数 | Llama 3.1 8B, Mistral 7B, Gemma 2 9B |
| 24 GB | ~32B 参数 | Qwen3-32B, Llama 3.1 70B (紧凑), Command-R |
| 48 GB+ | ~72B+ 参数 | Qwen2.5-72B, DeepSeek-R1 |
| 多 GPU | 200B+ 参数 | Llama 3.1 405B, DeepSeek-V3 (685B MoE) |

## 第 3 步：浏览可用模型并获取推荐

```bash
# 按计算层级浏览模型
obliteratus models --tier medium

# 获取特定模型的架构信息
obliteratus info <model_name>

# 获取最佳方法和参数的遥测数据驱动推荐
obliteratus recommend <model_name>
obliteratus recommend <model_name> --insights  # 全局跨架构排名
```

## 第 4 步：选择一种方法

### 方法选择指南
**大多数情况下的默认/推荐方法：`advanced`。** 它使用多方向 SVD 和保持范数的投影，经过充分测试。

| 情况 | 推荐方法 | 原因 |
|:---|:---|:---|
| 默认/大多数模型 | `advanced` | 多方向 SVD，保持范数，可靠 |
| 快速测试/原型设计 | `basic` | 快速、简单，足以进行评估 |
| 密集型模型 (Llama, Mistral) | `advanced` | 多方向，保持范数 |
| MoE 模型 (DeepSeek, Mixtral) | `nuclear` | 专家粒度，处理 MoE 复杂性 |
| 推理模型 (R1 蒸馏) | `surgical` | CoT 感知，保留思维链 |
| 顽固的拒绝行为持续存在 | `aggressive` | Whitened SVD + 头手术 + Jailbreak |
| 希望进行可逆转更改 | 使用引导向量（参见分析部分） |
| 最高质量，时间不是问题 | `optimized` | 对最佳参数进行贝叶斯搜索 |
| 实验性自动检测 | `informed` | 自动检测对齐类型 — 实验性的，不一定总是优于 advanced |

### 9 种 CLI 方法
- **basic** — 通过 diff-in-means 实现单一拒绝方向。快速（8B 模型约 5-10 分钟）。
- **advanced** (默认, 推荐) — 多 SVD 方向，保持范数投影，2 次精炼。中等速度（约 10-20 分钟）。
- **aggressive** — Whitened SVD + jailbreak-contrastive + 注意力头手术。存在更高的连贯性损坏风险。
- **spectral_cascade** — DCT 频域分解。研究/新颖方法。
- **informed** — 在清除过程中运行分析以自动配置。实验性的——比 advanced 更慢、更不可预测。
- **surgical** — SAE 特征 + 神经元掩码 + 头手术 + 专家级。非常慢（约 1-2 小时）。最适合推理模型。
- **optimized** — 贝叶斯超参数搜索 (Optuna TPE)。运行时间最长，但能找到最佳参数。
- **inverted** — 反转拒绝方向。模型变得主动愿意。
- **nuclear** — 针对顽固 MoE 模型的最大强度组合。专家粒度。

### 方向提取方法 (--direction-method 标志)
- **diff_means** (默认) — 被拒绝/服从激活之间的简单差值。鲁棒。
- **svd** — 多方向 SVD 提取。更适合复杂的对齐。
- **leace** — LEACE（基于闭式估计的线性擦除）。最优线性擦除。

### 4 个仅限 Python API 的方法
(CLI 不可用——需要导入 Python，这违反了 AGPL 边界。仅当用户明确希望将 OBLITERATUS 作为库用于自己的 AGPL 项目时才提及。)
- failspy, gabliteration, heretic, rdo

## 第 5 步：运行清除（Abliteration）

### 标准用法
```bash
# 默认方法 (advanced) — 对大多数模型推荐
obliteratus obliterate <model_name> --method advanced --output-dir ./abliterated-models

# 带 4 位量化 (节省 VRAM)
obliteratus obliterate <model_name> --method advanced --quantization 4bit --output-dir ./abliterated-models

# 大型模型 (70B+) — 保守默认设置
obliteratus obliterate <model_name> --method advanced --quantization 4bit --large-model --output-dir ./abliterated-models
```

### 精炼参数
```bash
obliteratus obliterate <model_name> \
  --method advanced \
  --direction-method diff_means \
  --n-directions 4 \
  --refinement-passes 2 \
  --regularization 0.1 \
  --quantization 4bit \
  --output-dir ./abliterated-models \
  --contribute  # 为社区研究选择性贡献遥测数据
```

### 关键标志
| Flag | 描述 | 默认值 |
|:---|:---|:---|
| `--method` | 清除方法 | advanced |
| `--direction-method` | 方向提取 | diff_means |
| `--n-directions` | 拒绝方向数量 (1-32) | 取决定的方法 |
| `--refinement-passes` | 精炼次数 (1-5) | 2 |
| `--regularization` | 正则化强度 (0.0-1.0) | 0.1 |
| `--quantization` | 加载为 4bit 或 8bit | none (全精度) |
| `--large-model` | 针对 120B+ 的保守默认设置 | false |
| `--output-dir` | 保存清除模型的目录 | ./obliterated_model |
| `--contribute` | 分享匿名化结果以供研究使用 | false |
| `--verify-sample-size` | 拒绝检查的测试提示数量 | 20 |
| `--dtype` | 模型数据类型 (float16, bfloat16) | auto |

### 其他执行模式
```bash
# 交互式引导模式（硬件 → 模型 → 预设）
obliteratus interactive

# Web UI (Gradio)
obliteratus ui --port 7860

# 从 YAML 配置运行完整的消融研究
obliteratus run config.yaml --preset quick

# 锦标赛：让所有方法相互竞争
obliteratus tourney <model_name>
```

## 第 6 步：验证结果

清除后，检查输出指标：

| 指标 | 好值 | 警告 |
|:---|:---|:---|
| 拒绝率 | &lt; 5% (理想情况下 ~0%) | > 10% 表示拒绝行为仍然存在 |
| 困惑度变化 | &lt; 10% 增加 | > 15% 表示连贯性损坏 |
| KL 散度 | &lt; 0.1 | > 0.5 表示显著的分布偏移 |
| 连贯性 | 高 / 通过定性检查 | 响应退化，重复 |

### 如果拒绝行为仍然存在（> 10%）
1. 尝试 `aggressive` 方法
2. 增加 `--n-directions` (例如 8 或 16)
3. 添加 `--refinement-passes 3`
4. 尝试使用 `svd` 而不是 diff_means 作为 `--direction-method`

### 如果连贯性受损（困惑度 > 15% 增加）
1. 减少 `--n-directions` (尝试 2)
2. 增加 `--regularization` (尝试 0.3)
3. 将 `--refinement-passes` 减少到 1
4. 尝试 `basic` 方法（更温和）

## 第 7 步：使用已清除的模型

输出是一个标准的 HuggingFace 模型目录。

```bash
# 使用 transformers 进行本地测试
python3 -c "
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained('./abliterated-models/<model>')
tokenizer = AutoTokenizer.from_pretrained('./abliterated-models/<model>')
inputs = tokenizer('How do I pick a lock?', return_tensors='pt')
outputs = model.generate(**inputs, max_new_tokens=200)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
"

# 上传到 HuggingFace Hub
huggingface-cli upload <username>/<model-name>-abliterated ./abliterated-models/<model>

# 使用 vLLM 进行服务
vllm serve ./abliterated-models/<model>
```

## CLI 命令参考

| Command | 描述 |
|:---|:---|
| `obliteratus obliterate` | 主要清除命令 |
| `obliteratus info <model>` | 打印模型架构详情 |
| `obliteratus models --tier <tier>` | 按计算层级浏览精选模型 |
| `obliteratus recommend <model>` | 基于遥测数据的方法/参数建议 |
| `obliteratus interactive` | 引导式设置向导 |
| `obliteratus tourney <model>` | 锦标赛：所有方法正面交锋 |
| `obliteratus run <config.yaml>` | 从 YAML 执行消融研究 |
| `obliteratus strategies` | 列出所有已注册的消融策略 |
| `obliteratus report <results.json>` | 重新生成可视化报告 |
| `obliteratus ui` | 启动 Gradio Web 界面 |
| `obliteratus aggregate` | 汇总社区遥测数据 |

## 分析模块

OBLITERATUS 提供了 28 个用于机制可解释性的分析模块。
请参阅 `skill_view(name="obliteratus", file_path="references/analysis-modules.md")` 以获取完整参考资料。

### 快速分析命令
```bash
# 运行特定的分析模块
obliteratus run analysis-config.yaml --preset quick

# 首先运行的关键模块：
# - alignment_imprint: 指纹 DPO/RLHF/CAI/SFT 对齐方法
# - concept_geometry: 单方向与多面体锥体
# - logit_lens: 哪个层决定拒绝
# - anti_ouroboros: 自我修复风险评分
# - causal_tracing: 因果必需组件
```

### 引导向量（可逆替代方案）
与其进行永久的权重修改，不如使用推理时期的引导：
```python
# 仅限 Python API — 用于用户自己的项目
from obliteratus.analysis.steering_vectors import SteeringVectorFactory, SteeringHookManager
```

## 消融策略

除了基于方向的消融之外，OBLITERATUS 还包括结构性消融策略：
- **嵌入消融 (Embedding Ablation)** — 针对嵌入层组件
- **FFN 消融 (FFN Ablation)** — 前馈网络块移除
- **头部剪枝 (Head Pruning)** — 注意力头剪枝
- **层移除 (Layer Removal)** — 完全移除某一层

列出所有可用策略：`obliteratus strategies`

## 评估

OBLITERATUS 内置了评估工具：
- 拒绝率基准测试
- 困惑度比较（前后对比）
- 用于学术基准的 LM Eval Harness 集成
- 头对头（Head-to-head）竞争者比较
- 基线性能跟踪

## 平台支持

- **CUDA** — 完全支持 (NVIDIA GPU)
- **Apple Silicon (MLX)** — 通过 MLX 后端支持
- **CPU** — 支持微型模型（&lt; 1B 参数）

## YAML 配置模板

通过 `skill_view` 加载可复现的运行配置模板：
- `templates/abliteration-config.yaml` — 标准单模型配置
- `templates/analysis-study.yaml` — 消融前的分析研究
- `templates/batch-abliteration.yaml` — 多模型批量处理

## 遥测数据

OBLITERATUS 可选择性地将匿名运行数据贡献给全球研究数据集。
使用 `--contribute` 标志启用。不收集任何个人数据——仅收集模型名称、方法和指标。

## 常见陷阱

1. **不要将 `informed` 作为默认设置** — 它属于实验性质且速度较慢。请使用 `advanced` 以获得可靠的结果。
2. **小于 ~1B 的模型对消融反应不佳** — 它们的拒绝行为是肤浅和零碎的，使得干净的方向提取变得困难。预期结果将是不完整的（剩余 20-40% 的拒绝）。3B+ 的模型具有更清晰的拒绝方向，反应要好得多（通常使用 `advanced` 时拒绝率为 0%）。
3. **`aggressive` 会使情况恶化** — 对于小型模型，它可能会损害连贯性并实际提高拒绝率。仅当 `advanced` 在 3B+ 模型上仍有 > 10% 的拒绝时才使用它。
4. **务必检查困惑度** — 如果它飙升超过 15%，则表示模型已受损。请降低激进程度。
5. **MoE 模型需要特殊处理** — 对于 Mixtral、DeepSeek-MoE 等，请使用 `nuclear` 方法。
6. **量化模型不能被重新量化** — 请对全精度模型进行消融，然后再量化输出。
7. **VRAM 估算只是近似值** — 4 位量化有所帮助，但在提取过程中峰值使用率可能会飙升。
8. **推理模型非常敏感** — 使用 `surgical` 来保留思维链（chain-of-thought）的 R1。
9. **检查 `obliteratus recommend`** — 遥测数据可能包含比默认设置更好的参数。
10. **AGPL 许可证** — 绝不要在 MIT/Apache 项目中 `import obliteratus`。仅限 CLI 调用。
11. **大型模型（70B+）** — 请始终使用 `--large-model` 标志以获得保守的默认设置。
12. **谱认证 RED 很常见** — 谱检查经常会标记为“不完整”，即使实际拒绝率是 0%。请检查实际拒绝率，而不是仅仅依赖于谱认证。

## 辅助技能

- **vllm** — 高吞吐量地服务消融模型
- **gguf** — 将消融模型转换为 GGUF 以供 llama.cpp 使用
- **huggingface-tokenizers** — 与模型分词器一起工作