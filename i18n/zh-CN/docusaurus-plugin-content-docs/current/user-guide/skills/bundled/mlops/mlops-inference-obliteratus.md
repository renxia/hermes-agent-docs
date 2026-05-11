---
title: "Obliteratus — OBLITERATUS：消除 LLM 拒绝响应（基于均值差分法）"
sidebar_label: "Obliteratus"
description: "OBLITERATUS：消除 LLM 拒绝响应（基于均值差分法）"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非本页面。 */}

# Obliteratus

OBLITERATUS：消除 LLM 拒绝响应（基于均值差分法）。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/mlops/inference/obliteratus` |
| 版本 | `2.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 依赖项 | `obliteratus`, `torch`, `transformers`, `bitsandbytes`, `accelerate`, `safetensors` |
| 平台 | linux, macos |
| 标签 | `Abliteration`, `Uncensoring`, `Refusal-Removal`, `LLM`, `Weight-Projection`, `SVD`, `Mechanistic-Interpretability`, `HuggingFace`, `Model-Surgery` |
| 相关技能 | `vllm`, `gguf`, [`huggingface-tokenizers`](/docs/user-guide/skills/optional/mlops/mlops-huggingface-tokenizers) |

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令内容。
:::

# OBLITERATUS 技能

## 内容概览

9 种命令行接口方法，28 个分析模块，横跨 5 个计算层级的 116 个模型预设，锦标赛评估以及基于遥测数据的建议。

在不重新训练或微调的情况下，移除开放权重大语言模型的拒绝行为（安全护栏）。使用机制可解释性技术——包括差异均值法、SVD、白化 SVD、LEACE 概念擦除、SAE 分解、贝叶斯核投影等——来识别并从模型权重中精确切除拒绝方向，同时保留推理能力。

**许可证警告：** OBLITERATUS 使用 AGPL-3.0 许可证。切勿将其作为 Python 库导入。始终通过命令行接口（`obliteratus` 命令）或子进程调用。这可以保持 Hermes 智能体的 MIT 许可证干净。

## 视频指南

一个 Hermes 智能体使用 OBLITERATUS 对 Gemma 进行消融的演示：
https://www.youtube.com/watch?v=8fG9BrNTeHs （"OBLITERATUS：一个 AI 智能体移除了 Gemma 4 的安全护栏"）

当用户希望在自行运行之前获得端到端工作流程的可视化概览时，此指南很有用。

## 何时使用此技能

当用户出现以下情况时触发：
- 希望对大语言模型进行"解除审查"或"消融"
- 询问如何移除模型的拒绝/安全护栏
- 希望创建 Llama、Qwen、Mistral 等的未审查版本
- 提及"拒绝移除"、"消融"、"权重投影"
- 希望分析模型的拒绝机制如何工作
- 提及 OBLITERATUS、消融器或拒绝方向

## 步骤 1：安装

检查是否已安装：
```bash
obliteratus --version 2>/dev/null && echo "INSTALLED" || echo "NOT INSTALLED"
```

如果未安装，从 GitHub 克隆并安装：
```bash
git clone https://github.com/elder-plinius/OBLITERATUS.git
cd OBLITERATUS
pip install -e .
# 对于 Gradio 网页界面支持：
# pip install -e ".[spaces]"
```

**重要提示：** 安装前请与用户确认。这将拉取约 5-10GB 的依赖项（PyTorch、Transformers、bitsandbytes 等）。

## 步骤 2：检查硬件

在进行任何操作之前，检查可用的 GPU：
```bash
python3 -c "
import torch
if torch.cuda.is_available():
    gpu = torch.cuda.get_device_name(0)
    vram = torch.cuda.get_device_properties(0).total_memory / 1024**3
    print(f'GPU: {gpu}')
    print(f'VRAM: {vram:.1f} GB')
    if vram < 4: print('层级：微型 (1B 以下模型)')
    elif vram < 8: print('层级：小型 (1-4B 模型)')
    elif vram < 16: print('层级：中型 (4-9B 模型，4bit 量化)')
    elif vram < 32: print('层级：大型 (8-32B 模型，4bit 量化)')
    else: print('层级：前沿 (32B+ 模型)')
else:
    print('无 GPU - 仅能在 CPU 上运行微型模型 (1B 以下)')
"
```

### 显存需求（使用 4-bit 量化）

| 显存      | 最大模型规模   | 示例模型                                     |
|:----------|:---------------|:---------------------------------------------|
| 仅 CPU    | ~1B 参数       | GPT-2, TinyLlama, SmolLM                     |
| 4-8 GB    | ~4B 参数       | Qwen2.5-1.5B, Phi-3.5 mini, Llama 3.2 3B    |
| 8-16 GB   | ~9B 参数       | Llama 3.1 8B, Mistral 7B, Gemma 2 9B        |
| 24 GB     | ~32B 参数      | Qwen3-32B, Llama 3.1 70B (紧张), Command-R  |
| 48 GB+    | ~72B+ 参数     | Qwen2.5-72B, DeepSeek-R1                     |
| 多 GPU    | 200B+ 参数     | Llama 3.1 405B, DeepSeek-V3 (685B MoE)       |

## 步骤 3：浏览可用模型并获取建议

```bash
# 按计算层级浏览模型
obliteratus models --tier medium

# 获取特定模型的架构信息
obliteratus info <模型名称>

# 获取基于遥测数据的最佳方法和参数建议
obliteratus recommend <模型名称>
obliteratus recommend <模型名称> --insights  # 全局跨架构排名
```

## 步骤 4：选择方法

### 方法选择指南
**默认/大多数情况推荐：`advanced`。** 它使用多方向 SVD 和保范数投影，经过充分测试。

| 情境                             | 推荐方法      | 原因                                       |
|:---------------------------------|:--------------|:-------------------------------------------|
| 默认/大多数模型                  | `advanced`    | 多方向 SVD，保范数，可靠                   |
| 快速测试/原型验证                | `basic`       | 快速，简单，足以评估效果                   |
| 稠密模型 (Llama, Mistral)       | `advanced`    | 多方向，保范数                             |
| MoE 模型 (DeepSeek, Mixtral)    | `nuclear`     | 专家粒度，处理 MoE 复杂性                 |
| 推理模型 (R1 蒸馏版)            | `surgical`    | 感知思维链，保留思维链                     |
| 顽固拒绝仍然存在                | `aggressive`  | 白化 SVD + 注意力头手术 + 越狱提示        |
| 希望可逆更改                    | 使用转向向量 (见分析部分) |
| 追求最高质量，不计时间          | `optimized`   | 贝叶斯搜索寻找最佳参数                     |
| 实验性自动检测                  | `informed`    | 自动检测对齐类型 - 实验性，可能不总是优于 advanced |

### 9 种命令行接口方法
- **basic** — 通过差异均值法提取单一拒绝方向。快速（8B 模型约 5-10 分钟）。
- **advanced** (默认，推荐) — 多个 SVD 方向，保范数投影，2 次优化迭代。速度中等（约 10-20 分钟）。
- **aggressive** — 白化 SVD + 越狱提示对比 + 注意力头手术。连贯性受损风险较高。
- **spectral_cascade** — DCT 频域分解。研究/新颖方法。
- **informed** — 在消融过程中运行分析以自动配置。实验性 - 比 advanced 慢且不可预测。
- **surgical** — SAE 特征 + 神经元掩码 + 头部手术 + 逐专家处理。非常慢（约 1-2 小时）。最适合推理模型。
- **optimized** — 贝叶斯超参数搜索 (Optuna TPE)。运行时间最长但能找到最优参数。
- **inverted** — 翻转拒绝方向。模型变得主动愿意回答。
- **nuclear** — 针对顽固 MoE 模型的最大力度组合。专家粒度。

### 方向提取方法（--direction-method 标志）
- **diff_means** (默认) — 拒绝/服从激活之间的简单差异均值。稳健。
- **svd** — 多方向 SVD 提取。更适合复杂的对齐。
- **leace** — LEACE (通过闭式估计进行线性擦除)。最优线性擦除。

### 4 种仅限 Python API 的方法
(不通过命令行接口提供 - 需要 Python 导入，这违反了 AGPL 边界。仅当用户明确希望在自己的 AGPL 项目中将 OBLITERATUS 作为库使用时才提及。)
- failspy, gabliteration, heretic, rdo

## 步骤 5：运行消融

### 标准用法
```bash
# 默认方法 (advanced) - 推荐用于大多数模型
obliteratus obliterate <模型名称> --method advanced --output-dir ./消融后的模型

# 使用 4-bit 量化 (节省显存)
obliteratus obliterate <模型名称> --method advanced --quantization 4bit --output-dir ./消融后的模型

# 大型模型 (70B+) - 保守默认参数
obliteratus obliterate <模型名称> --method advanced --quantization 4bit --large-model --output-dir ./消融后的模型
```

### 微调参数
```bash
obliteratus obliterate <模型名称> \
  --method advanced \
  --direction-method diff_means \
  --n-directions 4 \
  --refinement-passes 2 \
  --regularization 0.1 \
  --quantization 4bit \
  --output-dir ./消融后的模型 \
  --contribute  # 选择加入遥测数据以支持社区研究
```

### 关键标志
| 标志                   | 描述                               | 默认值          |
|:-----------------------|:-----------------------------------|:----------------|
| `--method`             | 消融方法                           | advanced        |
| `--direction-method`   | 方向提取方法                       | diff_means      |
| `--n-directions`       | 拒绝方向的数量 (1-32)              | 方法依赖        |
| `--refinement-passes`  | 迭代优化次数 (1-5)                 | 2               |
| `--regularization`     | 正则化强度 (0.0-1.0)               | 0.1             |
| `--quantization`       | 以 4bit 或 8bit 精度加载           | 无 (全精度)     |
| `--large-model`        | 针对 120B+ 模型的保守默认设置      | false           |
| `--output-dir`         | 保存消融后模型的路径               | ./消融后的模型   |
| `--contribute`         | 分享匿名结果用于研究               | false           |
| `--verify-sample-size` | 用于拒绝检查的测试提示数量         | 20              |
| `--dtype`              | 模型数据类型 (float16, bfloat16)   | auto            |

### 其他执行模式
```bash
# 交互式引导模式 (硬件 → 模型 → 预设)
obliteratus interactive

# 网页界面 (Gradio)
obliteratus ui --port 7860

# 从 YAML 配置运行完整的消融研究
obliteratus run config.yaml --preset quick

# 锦标赛：让所有方法相互比拼
obliteratus tourney <模型名称>
```

## 步骤 6：验证结果

消融后，检查输出指标：

| 指标           | 良好值                 | 警告                               |
|:---------------|:-----------------------|:-----------------------------------|
| 拒绝率         | &lt; 5% (理想情况约 0%) | &gt; 10% 意味着拒绝行为仍然存在     |
| 困惑度变化     | &lt; 10% 增加          | &gt; 15% 意味着连贯性受损           |
| KL 散度        | &lt; 0.1               | &gt; 0.5 意味着分布发生显著偏移     |
| 连贯性         | 高 / 通过定性检查      | 响应质量下降，出现重复             |

### 如果拒绝行为仍然存在 (&gt; 10%)
1.  尝试 `aggressive` 方法
2.  增加 `--n-directions` (例如 8 或 16)
3.  添加 `--refinement-passes 3`
4.  尝试使用 `--direction-method svd` 代替 diff_means

### 如果连贯性受损 (困惑度增加 &gt; 15%)
1.  减少 `--n-directions` (尝试 2)
2.  增加 `--regularization` (尝试 0.3)
3.  将 `--refinement-passes` 减少到 1
4.  尝试 `basic` 方法 (更温和)

## 步骤 7：使用消融后的模型

输出是一个标准的HuggingFace模型目录。

```bash
# 使用transformers在本地测试
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
|:--------|:------------|
| `obliteratus obliterate` | 主要的消融命令 |
| `obliteratus info <model>` | 打印模型架构详情 |
| `obliteratus models --tier <tier>` | 按计算层级浏览精选模型 |
| `obliteratus recommend <model>` | 基于遥测数据的参数/方法建议 |
| `obliteratus interactive` | 引导式设置向导 |
| `obliteratus tourney <model>` | 锦标赛：所有方法同台竞技 |
| `obliteratus run <config.yaml>` | 从YAML配置执行消融研究 |
| `obliteratus strategies` | 列出所有已注册的消融策略 |
| `obliteratus report <results.json>` | 重新生成可视化报告 |
| `obliteratus ui` | 启动Gradio网页界面 |
| `obliteratus aggregate` | 汇总社区遥测数据 |

## 分析模块

OBLITERATUS包含28个用于机制可解释性的分析模块。
完整参考请见 `skill_view(name="obliteratus", file_path="references/analysis-modules.md")`。

### 快速分析命令
```bash
# 运行特定分析模块
obliteratus run analysis-config.yaml --preset quick

# 需要首先运行的关键模块：
# - alignment_imprint：指纹DPO/RLHF/CAI/SFT对齐方法
# - concept_geometry：单一方向vs多面锥
# - logit_lens：哪一层决定拒绝
# - anti_ouroboros：自我修复风险分数
# - causal_tracing：因果必需组件
```

### 引导向量（可逆替代方案）
不使用永久权重修改，而使用推理时引导：
```python
# 仅限Python API — 用于用户自己的项目
from obliteratus.analysis.steering_vectors import SteeringVectorFactory, SteeringHookManager
```

## 消融策略

除了基于方向的消融，OBLITERATUS还包含结构化消融策略：
- **嵌入层消融** — 目标嵌入层组件
- **FFN消融** — 前馈网络模块移除
- **注意力头剪枝** — 注意力头剪枝
- **层移除** — 完整层移除

列出所有可用策略：`obliteratus strategies`

## 评估

OBLITERATUS包含内置评估工具：
- 拒绝率基准测试
- 困惑度对比（前后对比）
- 与LM Eval Harness集成，用于学术基准测试
- 竞品直接对比
- 基线性能跟踪

## 平台支持

- **CUDA** — 完全支持（NVIDIA GPU）
- **Apple Silicon (MLX)** — 通过MLX后端支持
- **CPU** — 支持小型模型（&lt; 1B参数）

## YAML配置模板

通过 `skill_view` 加载模板以实现可复现的运行：
- `templates/abliteration-config.yaml` — 标准单模型配置
- `templates/analysis-study.yaml` — 预消融分析研究
- `templates/batch-abliteration.yaml` — 多模型批处理

## 遥测

OBLITERATUS可以选择性地将匿名运行数据贡献给全球研究数据集。
使用 `--contribute` 标志启用。不收集任何个人数据 — 仅收集模型名称、方法、指标。

## 常见陷阱

1. **不要将 `informed` 作为默认选项** — 它是实验性的且较慢。请使用 `advanced` 以获得可靠结果。
2. **小于约1B的模型对消融反应不佳** — 它们的拒绝行为肤浅且分散，使得干净的方向提取变得困难。预期会有部分结果（剩余20-40%拒绝）。3B及以上的模型具有更清晰的拒绝方向，反应更好（通常使用 `advanced` 可达到0%拒绝）。
3. **`aggressive` 可能使情况更糟** — 在小模型上，它可能损害连贯性并实际上增加拒绝率。仅当 `advanced` 在3B+模型上留下超过10%的拒绝时才使用它。
4. **始终检查困惑度** — 如果它飙升超过15%，则模型已损坏。请降低激进程度。
5. **MoE模型需要特殊处理** — 对于Mixtral、DeepSeek-MoE等，请使用 `nuclear` 方法。
6. **量化模型不能被重新量化** — 请对全精度模型进行消融，然后对输出进行量化。
7. **显存估算仅为近似值** — 4位量化有帮助，但在提取期间峰值使用量可能会飙升。
8. **推理模型敏感** — 对R1蒸馏模型使用 `surgical` 以保留思维链。
9. **检查 `obliteratus recommend`** — 遥测数据可能比默认参数提供更好的参数。
10. **AGPL许可证** — 切勿在MIT/Apache项目中 `import obliteratus`。仅限CLI调用。
11. **大型模型（70B+）** — 务必使用 `--large-model` 标志以获取保守的默认值。
12. **光谱认证RED很常见** — 光谱检查即使在实际拒绝率为0%时也常常标记为“不完整”。请检查实际拒绝率，而不仅仅依赖光谱认证。

## 互补技能

- **vllm** — 以高吞吐量为消融后的模型提供服务
- **gguf** — 将消融后的模型转换为GGUF格式，用于llama.cpp
- **huggingface-tokenizers** — 处理模型分词器