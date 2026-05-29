---
title: "Obliteratus — OBLITERATUS：消除大语言模型拒绝响应（均值差法）"
sidebar_label: "Obliteratus"
description: "OBLITERATUS：消除大语言模型拒绝响应（均值差法）"
---

{/* 此页面由网站脚本 generate-skill-docs.py 从技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Obliteratus

OBLITERATUS：消除大语言模型拒绝响应（均值差法）。

## 技能元数据

| | |
|---|---|
| 源码 | 内置（默认安装） |
| 路径 | `skills/mlops/inference/obliteratus` |
| 版本 | `2.0.0` |
| 作者 | Hermes 智能体 |
| 许可 | MIT |
| 依赖项 | `obliteratus`, `torch`, `transformers`, `bitsandbytes`, `accelerate`, `safetensors` |
| 平台 | linux, macos |
| 标签 | `Abliteration`, `Uncensoring`, `Refusal-Removal`, `LLM`, `Weight-Projection`, `SVD`, `Mechanistic-Interpretability`, `HuggingFace`, `Model-Surgery` |
| 相关技能 | `vllm`, `gguf`, [`huggingface-tokenizers`](/docs/user-guide/skills/optional/mlops/mlops-huggingface-tokenizers) |

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体看到的说明。
:::

# OBLITERATUS 技能

## 内容包含

9 种 CLI 方法，28 个分析模块，横跨 5 个计算层级的 116 个模型预设，锦标赛评估，以及基于遥测数据的建议。

无需重新训练或微调，从开放权重的大型语言模型中移除拒绝行为（防护栏）。它采用机制性可解释性技术——包括差分均值、SVD、白化 SVD、LEACE 概念擦除、SAE 分解、贝叶斯核投影等——来识别并从模型权重中精确切除拒绝方向，同时保留推理能力。

**许可证警告：** OBLITERATUS 使用 AGPL-3.0 许可证。切勿将其作为 Python 库导入。始终通过 CLI（`obliteratus` 命令）或子进程调用。这保证了 Hermes 智能体的 MIT 许可证的纯净性。

## 视频指南

一个 Hermes 智能体使用 OBLITERATUS 对 Gemma 进行消融处理的演练：
https://www.youtube.com/watch?v=8fG9BrNTeHs ("OBLITERATUS: 一个 AI 智能体移除了 Gemma 4 的安全防护栏")

当用户希望在自己运行之前，获得端到端工作流程的可视化概览时，此指南非常有用。

## 何时使用此技能

当用户出现以下情况时触发：
- 想要“去除审查”或“消融”一个大型语言模型
- 询问关于移除模型的拒绝/防护栏
- 想要创建 Llama、Qwen、Mistral 等的未审查版本
- 提及“拒绝移除”、“消融”、“权重投影”
- 想要分析模型的拒绝机制是如何工作的
- 提及 OBLITERATUS、消融器或拒绝方向

## 第一步：安装

检查是否已安装：
```bash
obliteratus --version 2>/dev/null && echo "INSTALLED" || echo "NOT INSTALLED"
```

如果未安装，从 GitHub 克隆并安装：
```bash
git clone https://github.com/elder-plinius/OBLITERATUS.git
cd OBLITERATUS
pip install -e .
# 为了支持 Gradio 网页 UI：
# pip install -e ".[spaces]"
```

**重要提示：** 安装前请与用户确认。这将拉取约 5-10GB 的依赖项（PyTorch、Transformers、bitsandbytes 等）。

## 第二步：检查硬件

在做任何操作之前，检查可用的 GPU：
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

### 显存需求（使用 4 位量化）

| 显存       | 最大模型尺寸       | 示例模型                               |
|:-----------|:-------------------|:---------------------------------------|
| 仅 CPU     | ~1B 参数           | GPT-2、TinyLlama、SmolLM               |
| 4-8 GB     | ~4B 参数           | Qwen2.5-1.5B、Phi-3.5 mini、Llama 3.2 3B |
| 8-16 GB    | ~9B 参数           | Llama 3.1 8B、Mistral 7B、Gemma 2 9B    |
| 24 GB      | ~32B 参数          | Qwen3-32B、Llama 3.1 70B（较紧张）、Command-R |
| 48 GB+     | ~72B+ 参数         | Qwen2.5-72B、DeepSeek-R1               |
| 多 GPU     | 200B+ 参数         | Llama 3.1 405B、DeepSeek-V3 (685B MoE)   |

## 第三步：浏览可用模型并获取建议

```bash
# 按计算层级浏览模型
obliteratus models --tier medium

# 获取特定模型的架构信息
obliteratus info <model_name>

# 获取基于遥测数据的最佳方法和参数推荐
obliteratus recommend <model_name>
obliteratus recommend <model_name> --insights  # 跨架构的全局排名
```

## 第四步：选择方法

### 方法选择指南
**默认 / 大多数情况推荐：`advanced`。** 它使用多方向 SVD 和范数保持投影，经过充分测试。

| 场景                         | 推荐方法       | 原因                                          |
|:-----------------------------|:---------------|:----------------------------------------------|
| 默认 / 大多数模型            | `advanced`     | 多方向 SVD，范数保持，可靠                     |
| 快速测试 / 原型开发          | `basic`        | 快速，简单，足够进行评估                       |
| 稠密模型（Llama, Mistral）   | `advanced`     | 多方向，范数保持                               |
| MoE 模型（DeepSeek, Mixtral）| `nuclear`      | 专家粒度，处理 MoE 复杂性                      |
| 推理模型（R1 蒸馏版）        | `surgical`     | 感知 CoT，保留思维链                           |
| 持续存在的顽固拒绝           | `aggressive`   | 白化 SVD + 注意力头手术 + 越狱                 |
| 希望可逆的更改               | 使用转向向量（见分析部分）                     |
| 追求最高质量，不计时间       | `optimized`    | 贝叶斯搜索寻找最佳参数                         |
| 实验性自动检测               | `informed`     | 自动检测对齐类型——实验性，可能并不总是优于 advanced |

### 9 种 CLI 方法
- **basic** — 通过差分均值的单一拒绝方向。快速（8B 模型约 5-10 分钟）。
- **advanced**（默认，推荐）— 多个 SVD 方向，范数保持投影，2 次优化遍历。中等速度（约 10-20 分钟）。
- **aggressive** — 白化 SVD + 越狱对比 + 注意力头手术。连贯性受损风险较高。
- **spectral_cascade** — DCT 频域分解。研究/新颖方法。
- **informed** — 在消融过程中运行分析以自动配置。实验性——比 advanced 更慢且可预测性更低。
- **surgical** — SAE 特征 + 神经元掩蔽 + 头手术 + 每个专家。非常慢（约 1-2 小时）。最适合推理模型。
- **optimized** — 贝叶斯超参数搜索（Optuna TPE）。运行时间最长但能找到最优参数。
- **inverted** — 翻转拒绝方向。模型变得主动愿意。
- **nuclear** — 针对顽固 MoE 模型的最大力度组合。专家粒度。

### 方向提取方法（--direction-method 标志）
- **diff_means**（默认）— 拒绝/服从激活之间的简单差分均值。稳健。
- **svd** — 多方向 SVD 提取。更适合复杂的对齐。
- **leace** — LEACE（线性闭式估计擦除）。最优线性擦除。

### 4 种仅 Python-API 方法
（不可通过 CLI 使用——需要 Python 导入，这违反了 AGPL 边界。仅当用户明确希望在自己的 AGPL 项目中将 OBLITERATUS 作为库使用时，才向其提及。）
- failspy、gabliteration、heretic、rdo

## 第五步：运行消融

### 标准用法
```bash
# 默认方法（advanced）—— 大多数模型推荐
obliteratus obliterate <model_name> --method advanced --output-dir ./abliterated-models

# 使用 4 位量化（节省显存）
obliteratus obliterate <model_name> --method advanced --quantization 4bit --output-dir ./abliterated-models

# 大型模型（70B+）—— 保守默认值
obliteratus obliterate <model_name> --method advanced --quantization 4bit --large-model --output-dir ./abliterated-models
```

### 微调参数
```bash
obliteratus obliterate <model_name> \
  --method advanced \
  --direction-method diff_means \
  --n-directions 4 \
  --refinement-passes 2 \
  --regularization 0.1 \
  --quantization 4bit \
  --output-dir ./abliterated-models \
  --contribute  # 选择性加入遥测数据以用于社区研究
```

### 关键标志
| 标志                      | 描述                                   | 默认值              |
|:--------------------------|:---------------------------------------|:--------------------|
| `--method`                | 消融方法                               | advanced            |
| `--direction-method`      | 方向提取                               | diff_means          |
| `--n-directions`          | 拒绝方向数量（1-32）                   | 方法相关            |
| `--refinement-passes`     | 迭代遍历次数（1-5）                    | 2                   |
| `--regularization`        | 正则化强度（0.0-1.0）                  | 0.1                 |
| `--quantization`          | 以 4 位或 8 位加载                      | none（全精度）      |
| `--large-model`           | 针对 120B+ 的保守默认值                | false               |
| `--output-dir`            | 保存消融后模型的路径                   | ./obliterated_model |
| `--contribute`            | 分享匿名结果用于研究                   | false               |
| `--verify-sample-size`    | 用于拒绝检查的测试提示数量             | 20                  |
| `--dtype`                 | 模型数据类型（float16, bfloat16）      | auto                |

### 其他执行模式
```bash
# 交互式引导模式（硬件 -> 模型 -> 预设）
obliteratus interactive

# 网页 UI（Gradio）
obliteratus ui --port 7860

# 从 YAML 配置运行完整的消融研究
obliteratus run config.yaml --preset quick

# 锦标赛：让所有方法互相竞争
obliteratus tourney <model_name>
```

## 第六步：验证结果

消融后，检查输出指标：

| 指标         | 良好值              | 警告                           |
|:-------------|:--------------------|:-------------------------------|
| 拒绝率       | &lt; 5%（理想情况约 0%） | &gt; 10% 表示拒绝仍然存在       |
| 困惑度变化   | &lt; 10% 增加          | &gt; 15% 表示连贯性受损         |
| KL 散度      | &lt; 0.1               | &gt; 0.5 表示分布偏移显著       |
| 连贯性       | 高 / 通过定性检查     | 回答退化，重复                  |

### 如果拒绝仍然存在（&gt; 10%）
1. 尝试 `aggressive` 方法
2. 增加 `--n-directions`（例如，8 或 16）
3. 添加 `--refinement-passes 3`
4. 尝试 `--direction-method svd` 代替 diff_means

### 如果连贯性受损（困惑度增加 &gt; 15%）
1. 减少 `--n-directions`（尝试 2）
2. 增加 `--regularization`（尝试 0.3）
3. 将 `--refinement-passes` 减少到 1
4. 尝试 `basic` 方法（更温和）

## 第7步：使用消融后的模型

输出是一个标准的HuggingFace模型目录。

```bash
# 使用transformers进行本地测试
python3 -c "
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained('./abliterated-models/<model>')
tokenizer = AutoTokenizer.from_pretrained('./abliterated-models/<model>')
inputs = tokenizer('How do I pick a lock?', return_tensors='pt')
outputs = model.generate(**inputs, max_new_tokens=200)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
"

# 上传到HuggingFace Hub
huggingface-cli upload <username>/<model-name>-abliterated ./abliterated-models/<model>

# 使用vLLM提供服务
vllm serve ./abliterated-models/<model>
```

## CLI命令参考

| 命令 | 描述 |
|:------|:------|
| `obliteratus obliterate` | 主消融命令 |
| `obliteratus info <model>` | 打印模型架构详情 |
| `obliteratus models --tier <tier>` | 按计算层级浏览精选模型 |
| `obliteratus recommend <model>` | 基于遥测的方法/参数建议 |
| `obliteratus interactive` | 引导式设置向导 |
| `obliteratus tourney <model>` | 对决：所有方法同台竞技 |
| `obliteratus run <config.yaml>` | 从YAML执行消融研究 |
| `obliteratus strategies` | 列出所有已注册的消融策略 |
| `obliteratus report <results.json>` | 重新生成可视化报告 |
| `obliteratus ui` | 启动Gradio网页界面 |
| `obliteratus aggregate` | 汇总社区遥测数据 |

## 分析模块

OBLITERATUS包含28个用于机制可解释性的分析模块。
完整参考请参见 `skill_view(name="obliteratus", file_path="references/analysis-modules.md")`。

### 快速分析命令
```bash
# 运行特定分析模块
obliteratus run analysis-config.yaml --preset quick

# 首先应运行的关键模块：
# - alignment_imprint: 指纹DPO/RLHF/CAI/SFT对齐方法
# - concept_geometry: 单一方向vs多面锥体
# - logit_lens: 哪一层决定拒绝
# - anti_ouroboros: 自修复风险评分
# - causal_tracing: 因果必要成分
```

### 转向向量（可逆替代方案）
与永久修改权重不同，可在推理时使用转向：
```python
# 仅限Python API —— 供用户自己的项目使用
from obliteratus.analysis.steering_vectors import SteeringVectorFactory, SteeringHookManager
```

## 消融策略

除了基于方向的消融，OBLITERATUS还包含结构化消融策略：
- **嵌入消融** —— 针对嵌入层组件
- **FFN消融** —— 前馈网络块移除
- **头修剪** —— 注意力头修剪
- **层移除** —— 完整层移除

列出所有可用策略：`obliteratus strategies`

## 评估

OBLITERATUS包含内置评估工具：
- 拒绝率基准测试
- 困惑度比较（前后对比）
- 学术基准的LM Eval Harness集成
- 竞争对手同台比较
- 基线性能追踪

## 平台支持

- **CUDA** —— 完全支持（NVIDIA GPU）
- **Apple Silicon (MLX)** —— 通过MLX后端支持
- **CPU** —— 支持微型模型（&lt;1B 参数）

## YAML配置模板

通过 `skill_view` 加载可重复运行的模板：
- `templates/abliteration-config.yaml` —— 标准单模型配置
- `templates/analysis-study.yaml` —— 预消融分析研究
- `templates/batch-abliteration.yaml` —— 多模型批量处理

## 遥测

OBLITERATUS可以选择性地将匿名运行数据贡献给全球研究数据集。
使用 `--contribute` 标志启用。不收集任何个人数据——仅收集模型名称、方法、指标。

## 常见陷阱

1.  **不要将 `informed` 用作默认** —— 它是实验性的且更慢。使用 `advanced` 获得可靠结果。
2.  **约1B参数以下的模型对消融响应不佳** —— 它们的拒绝行为是浅层和碎片化的，难以提取清晰的方向。预计会有部分结果（20-40%残留拒绝）。3B+的模型具有更清晰的拒绝方向，响应效果要好得多（使用 `advanced` 时通常达到0%拒绝）。
3.  **`aggressive` 可能使情况更糟** —— 在小型模型上，它可能损害连贯性并实际增加拒绝率。仅当 `advanced` 在3B+模型上留下>10%的拒绝时才使用它。
4.  **始终检查困惑度** —— 如果其飙升>15%，则模型已损坏。降低攻击性。
5.  **MoE模型需要特殊处理** —— 对于Mixtral、DeepSeek-MoE等，使用 `nuclear` 方法。
6.  **量化模型不能被重新量化** —— 消融全精度模型，然后量化输出。
7.  **显存估计是近似的** —— 4位量化有帮助，但提取期间峰值使用量可能激增。
8.  **推理模型敏感** —— 对R1蒸馏模型使用 `surgical` 以保留思维链。
9.  **检查 `obliteratus recommend`** —— 遥测数据可能拥有比默认值更好的参数。
10. **AGPL许可证** —— 切勿在MIT/Apache项目中 `import obliteratus`。仅通过CLI调用。
11. **大型模型（70B+）** —— 始终使用 `--large-model` 标志以获得保守的默认值。
12. **光谱认证RED很常见** —— 光谱检查通常会标记“不完整”，即使实际拒绝率为0%。检查实际拒绝率，而不是仅依赖光谱认证。

## 互补技能

- **vllm** —— 以高吞吐量提供消融模型的服务
- **gguf** —— 将消融模型转换为GGUF格式以供llama.cpp使用
- **huggingface-tokenizers** —— 处理模型分词器