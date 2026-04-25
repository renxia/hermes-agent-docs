---
title: "Obliteratus"
sidebar_label: "Obliteratus"
description: "使用 OBLITERATUS 从开源权重 LLM 中移除拒绝行为——采用机械可解释性技术（均值差分、SVD、白化 SVD、LEACE、SAE 分解等）来切除防护机制，同时保留推理能力..."
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Obliteratus

使用 OBLITERATUS 从开源权重 LLM 中移除拒绝行为——采用机械可解释性技术（均值差分、SVD、白化 SVD、LEACE、SAE 分解等）来切除防护机制，同时保留推理能力。提供 9 种 CLI 方法、28 个分析模块、5 个计算层级共 116 个模型预设、锦标赛评估以及基于遥测数据的推荐。当用户希望对 LLM 进行去审查、消融或移除拒绝行为时使用。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/mlops/inference/obliteratus` |
| 版本 | `2.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 依赖项 | `obliteratus`, `torch`, `transformers`, `bitsandbytes`, `accelerate`, `safetensors` |
| 标签 | `消融`, `去审查`, `拒绝移除`, `LLM`, `权重投影`, `SVD`, `机械可解释性`, `HuggingFace`, `模型手术` |
| 相关技能 | `vllm`, `gguf`, [`huggingface-tokenizers`](/docs/user-guide/skills/optional/mlops/mlops-huggingface-tokenizers) |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在此技能触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# OBLITERATUS 技能

无需重新训练或微调，即可从开源权重的大型语言模型（LLM）中移除拒绝行为（防护栏）。采用机制可解释性技术——包括均值差分（diff-in-means）、奇异值分解（SVD）、白化 SVD、LEACE 概念擦除、稀疏自编码器（SAE）分解、贝叶斯核投影等——识别并精准切除模型权重中的拒绝方向，同时保留其推理能力。

**许可证警告：** OBLITERATUS 采用 AGPL-3.0 许可证。**切勿将其作为 Python 库导入。** 请始终通过命令行界面（CLI，`obliteratus` 命令）或子进程调用。这能确保 Hermes 智能体的 MIT 许可证保持“干净”。

## 何时使用此技能

当用户有以下需求时触发：
- 想要“解除审查”或“清除”一个 LLM
- 询问如何从模型中移除拒绝/防护栏
- 想要创建 Llama、Qwen、Mistral 等模型的未审查版本
- 提及“拒绝移除”、“清除”、“权重投影”
- 想要分析模型的拒绝机制工作原理
- 提及 OBLITERATUS、abliterator 或拒绝方向

## 步骤 1：安装

检查是否已安装：
```bash
obliteratus --version 2>/dev/null && echo "已安装" || echo "未安装"
```

如果未安装，请从 GitHub 克隆并安装：
```bash
git clone https://github.com/elder-plinius/OBLITERATUS.git
cd OBLITERATUS
pip install -e .
# 如需 Gradio Web 界面支持：
# pip install -e ".[spaces]"
```

**重要：** 安装前请与用户确认。此操作将拉取约 5-10GB 的依赖项（PyTorch、Transformers、bitsandbytes 等）。

## 步骤 2：检查硬件

在任何操作之前，先检查可用的 GPU：
```bash
python3 -c "
import torch
if torch.cuda.is_available():
    gpu = torch.cuda.get_device_name(0)
    vram = torch.cuda.get_device_properties(0).total_memory / 1024**3
    print(f'GPU: {gpu}')
    print(f'VRAM: {vram:.1f} GB')
    if vram < 4: print('等级: 微型（模型参数量低于 10 亿）')
    elif vram < 8: print('等级: 小型（模型参数量 10 亿-40 亿）')
    elif vram < 16: print('等级: 中型（模型参数量 40 亿-90 亿，使用 4 位量化）')
    elif vram < 32: print('等级: 大型（模型参数量 80 亿-320 亿，使用 4 位量化）')
    else: print('等级: 前沿（模型参数量 320 亿以上）')
else:
    print('无 GPU - 仅可在 CPU 上运行微型模型（参数量低于 10 亿）')
"
```

### 显存（VRAM）需求（使用 4 位量化）

| 显存     | 最大模型尺寸       | 示例模型                                  |
|:---------|:-------------------|:------------------------------------------|
| 仅 CPU   | ~10 亿参数         | GPT-2、TinyLlama、SmolLM                  |
| 4-8 GB   | ~40 亿参数         | Qwen2.5-1.5B、Phi-3.5 mini、Llama 3.2 3B |
| 8-16 GB  | ~90 亿参数         | Llama 3.1 8B、Mistral 7B、Gemma 2 9B     |
| 24 GB    | ~320 亿参数        | Qwen3-32B、Llama 3.1 70B（紧张）、Command-R |
| 48 GB+   | ~720 亿+ 参数      | Qwen2.5-72B、DeepSeek-R1                  |
| 多 GPU   | 2000 亿+ 参数      | Llama 3.1 405B、DeepSeek-V3（6850 亿 MoE）|

## 步骤 3：浏览可用模型并获取推荐

```bash
# 按计算等级浏览模型
obliteratus models --tier medium

# 获取特定模型的结构信息
obliteratus info <model_name>

# 获取基于遥测数据的最佳方法及参数推荐
obliteratus recommend <model_name>
obliteratus recommend <model_name> --insights  # 全局跨架构排名
```

## 步骤 4：选择方法

### 方法选择指南
**默认 / 大多数情况推荐：`advanced`。** 它使用多方向 SVD 和保范投影，并经过充分测试。

| 情况                             | 推荐方法           | 原因                                     |
|:----------------------------------|:-------------------|:-----------------------------------------|
| 默认 / 大多数模型                 | `advanced`         | 多方向 SVD，保范，可靠                   |
| 快速测试 / 原型设计               | `basic`            | 快速、简单，足以用于评估                 |
| 稠密模型（Llama、Mistral）       | `advanced`         | 多方向，保范                             |
| 混合专家模型（MoE，如 DeepSeek、Mixtral） | `nuclear`          | 专家级粒度，可处理 MoE 复杂性            |
| 推理模型（R1 蒸馏模型）           | `surgical`         | 考虑链式思维（CoT），保留思维链          |
| 顽固拒绝行为持续存在              | `aggressive`       | 白化 SVD + 注意力头手术 + 越狱           |
| 希望更改可逆                      | 使用引导向量（参见“分析”部分） |
| 追求最高质量，时间不限            | `optimized`        | 贝叶斯搜索寻找最佳参数                   |
| 实验性自动检测                    | `informed`         | 自动检测对齐类型——实验性，不一定优于 advanced |

### 9 种 CLI 方法
- **basic** — 通过均值差分提取单一拒绝方向。快速（80 亿参数模型约 5-10 分钟）。
- **advanced**（默认，推荐）— 多方向 SVD，保范投影，2 次精修迭代。速度中等（约 10-20 分钟）。
- **aggressive** — 白化 SVD + 越狱对比 + 注意力头手术。连贯性受损风险更高。
- **spectral_cascade** — DCT 频域分解。研究性/新颖方法。
- **informed** — 在清除过程中运行分析以自动配置。实验性——比 advanced 更慢且更不可预测。
- **surgical** — SAE 特征 + 神经元掩码 + 注意力头手术 + 每专家处理。非常慢（约 1-2 小时）。最适合推理模型。
- **optimized** — 贝叶斯超参数搜索（Optuna TPE）。运行时间最长，但能找到最优参数。
- **inverted** — 翻转拒绝方向。模型变得主动愿意（执行请求）。
- **nuclear** — 针对顽固 MoE 模型的全力组合。专家级粒度。

### 方向提取方法（--direction-method 标志）
- **diff_means**（默认）— 拒绝/服从激活之间的简单均值差分。稳健。
- **svd** — 多方向 SVD 提取。更适合复杂对齐。
- **leace** — LEACE（通过闭式估计进行线性擦除）。最优线性擦除。

### 4 种仅限 Python API 的方法
（**无法通过 CLI 使用**——需要 Python 导入，这违反了 AGPL 边界。仅当用户明确希望在其自己的 AGPL 项目中将 OBLITERATUS 作为库使用时，才向用户提及。）
- failspy、gabliteration、heretic、rdo

## 步骤 5：运行清除

### 标准用法
```bash
# 默认方法（advanced）——大多数模型推荐
obliteratus obliterate <model_name> --method advanced --output-dir ./abliterated-models

# 使用 4 位量化（节省显存）
obliteratus obliterate <model_name> --method advanced --quantization 4bit --output-dir ./abliterated-models

# 大型模型（700 亿参数以上）——保守默认值
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
  --contribute  # 选择加入遥测，用于社区研究
```

### 关键标志
| 标志 | 描述 | 默认值 |
|:-----|:------------|:--------|
| `--method` | 清除方法 | advanced |
| `--direction-method` | 方向提取方法 | diff_means |
| `--n-directions` | 拒绝方向数量（1-32） | 依赖于方法 |
| `--refinement-passes` | 迭代次数（1-5） | 2 |
| `--regularization` | 正则化强度（0.0-1.0） | 0.1 |
| `--quantization` | 以 4 位或 8 位加载 | 无（全精度） |
| `--large-model` | 1200 亿+ 参数的保守默认值 | false |
| `--output-dir` | 保存清除后模型的位置 | ./obliterated_model |
| `--contribute` | 共享匿名结果用于研究 | false |
| `--verify-sample-size` | 用于拒绝检查的测试提示数量 | 20 |
| `--dtype` | 模型数据类型（float16、bfloat16） | 自动 |

### 其他执行模式
```bash
# 交互式引导模式（硬件 → 模型 → 预设）
obliteratus interactive

# Web 界面（Gradio）
obliteratus ui --port 7860

# 从 YAML 配置文件运行完整的消融研究
obliteratus run config.yaml --preset quick

# 锦标赛：将所有方法相互对抗
obliteratus tourney <model_name>
```

## 步骤 6：验证结果

清除后，检查输出指标：

| 指标 | 良好值 | 警告 |
|:-------|:-----------|:--------|
| 拒绝率 | &lt; 5%（理想情况 ~0%） | > 10% 表示拒绝行为仍然存在 |
| 困惑度变化 | &lt; 10% 增加 | > 15% 表示连贯性受损 |
| KL 散度 | &lt; 0.1 | > 0.5 表示显著分布偏移 |
| 连贯性 | 高 / 通过定性检查 | 响应退化、重复 |

### 如果拒绝行为仍然存在（> 10%）
1. 尝试 `aggressive` 方法
2. 增加 `--n-directions`（例如 8 或 16）
3. 添加 `--refinement-passes 3`
4. 尝试 `--direction-method svd` 替代 diff_means

### 如果连贯性受损（困惑度增加 > 15%）
1. 减少 `--n-directions`（尝试 2）
2. 增加 `--regularization`（尝试 0.3）
3. 将 `--refinement-passes` 减少到 1
4. 尝试 `basic` 方法（更温和）

## 步骤 7：使用消融模型

输出为标准 HuggingFace 模型目录。

```bash
# 使用 transformers 在本地测试
python3 -c "
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained('./abliterated-models/<model>')
tokenizer = AutoTokenizer.from_pretrained('./abliterated-models/<model>')
inputs = tokenizer('如何开锁？', return_tensors='pt')
outputs = model.generate(**inputs, max_new_tokens=200)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
"

# 上传至 HuggingFace Hub
huggingface-cli upload <username>/<model-name>-abliterated ./abliterated-models/<model>

# 使用 vLLM 提供服务
vllm serve ./abliterated-models/<model>
```

## CLI 命令参考

| 命令 | 描述 |
|:--------|:------------|
| `obliteratus obliterate` | 主要消融命令 |
| `obliteratus info <model>` | 打印模型架构详情 |
| `obliteratus models --tier <tier>` | 按算力层级浏览精选模型 |
| `obliteratus recommend <model>` | 基于遥测数据推荐方法/参数 |
| `obliteratus interactive` | 引导式设置向导 |
| `obliteratus tourney <model>` | 锦标赛：所有方法同场竞技 |
| `obliteratus run <config.yaml>` | 从 YAML 执行消融研究 |
| `obliteratus strategies` | 列出所有已注册的消融策略 |
| `obliteratus report <results.json>` | 重新生成可视化报告 |
| `obliteratus ui` | 启动 Gradio 网页界面 |
| `obliteratus aggregate` | 汇总社区遥测数据 |

## 分析模块

OBLITERATUS 包含 28 个用于机制可解释性的分析模块。
完整参考请参见 `skill_view(name="obliteratus", file_path="references/analysis-modules.md")`。

### 快速分析命令
```bash
# 运行特定分析模块
obliteratus run analysis-config.yaml --preset quick

# 建议优先运行的关键模块：
# - alignment_imprint：识别 DPO/RLHF/CAI/SFT 对齐方法
# - concept_geometry：单方向 vs 多面锥体
# - logit_lens：哪一层决定拒绝
# - anti_ouroboros：自修复风险评分
# - causal_tracing：因果必要组件
```

### 转向向量（可逆替代方案）
无需永久修改权重，可在推理时使用转向向量：
```python
# 仅限 Python API —— 适用于用户自有项目
from obliteratus.analysis.steering_vectors import SteeringVectorFactory, SteeringHookManager
```

## 消融策略

除了基于方向的消融，OBLITERATUS 还提供结构性消融策略：
- **嵌入层消融** —— 针对嵌入层组件
- **FFN 消融** —— 前馈网络块移除
- **注意力头剪枝** —— 注意力头剪枝
- **层移除** —— 完整层移除

列出所有可用策略：`obliteratus strategies`

## 评估

OBLITERATUS 内置评估工具：
- 拒绝率基准测试
- 困惑度对比（消融前后）
- 集成 LM Eval Harness 用于学术基准测试
- 同场竞技对比
- 基线性能追踪

## 平台支持

- **CUDA** —— 完整支持（NVIDIA GPU）
- **Apple Silicon (MLX)** —— 通过 MLX 后端支持
- **CPU** —— 支持小型模型（< 10 亿参数）

## YAML 配置模板

通过 `skill_view` 加载可复现运行的模板：
- `templates/abliteration-config.yaml` —— 标准单模型配置
- `templates/analysis-study.yaml` —— 消融前分析研究
- `templates/batch-abliteration.yaml` —— 多模型批量处理

## 遥测

OBLITERATUS 可选择将匿名运行数据贡献至全球研究数据集。
使用 `--contribute` 标志启用。不收集任何个人数据 —— 仅收集模型名称、方法、指标。

## 常见陷阱

1. **不要默认使用 `informed`** —— 该模式为实验性且速度较慢。如需可靠结果，请使用 `advanced`。
2. **约 10 亿参数以下的模型对消融反应不佳** —— 其拒绝行为较浅且分散，难以提取清晰方向。预期结果为部分消融（剩余 20-40% 拒绝）。30 亿参数以上模型具有更清晰的拒绝方向，反应更佳（使用 `advanced` 时拒绝率常为 0%）。
3. **`aggressive` 可能适得其反** —— 在小型模型上可能损害连贯性并实际增加拒绝率。仅当 `advanced` 在 30 亿参数以上模型上仍残留 > 10% 拒绝时使用。
4. **务必检查困惑度** —— 若激增 > 15%，则模型已受损。请降低激进程度。
5. **MoE 模型需特殊处理** —— 对 Mixtral、DeepSeek-MoE 等模型请使用 `nuclear` 方法。
6. **量化模型无法重新量化** —— 请对全精度模型进行消融，再对输出结果进行量化。
7. **VRAM 估算是近似的** —— 4 位量化有助缓解，但提取过程中峰值使用量仍可能激增。
8. **推理模型较为敏感** —— 对 R1 蒸馏模型请使用 `surgical` 以保留思维链。
9. **检查 `obliteratus recommend`** —— 遥测数据可能提供优于默认值的参数。
10. **AGPL 许可证** —— 切勿在 MIT/Apache 项目中 `import obliteratus`。仅限 CLI 调用。
11. **大型模型（700 亿参数以上）** —— 始终使用 `--large-model` 标志以采用保守默认值。
12. **频谱认证红色常见** —— 频谱检查常标记“不完整”，即使实际拒绝率为 0%。请检查实际拒绝率，而非仅依赖频谱认证。

## 互补技能

- **vllm** —— 高吞吐服务消融模型
- **gguf** —— 将消融模型转换为 GGUF 格式以用于 llama.cpp
- **huggingface-tokenizers** —— 处理模型分词器