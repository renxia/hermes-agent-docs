---
title: "Obliteratus — OBLITERATUS: 消除大语言模型拒绝应答（差分均值法）"
sidebar_label: "Obliteratus"
description: "OBLITERATUS: 消除大语言模型拒绝应答（差分均值法）"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 从技能文件 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非本页面。 */}

# Obliteratus

OBLITERATUS: 消除大语言模型拒绝应答（差分均值法）。

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
| 相关技能 | `vllm`, `gguf`, [`huggingface-tokenizers`](/user-guide/skills/optional/mlops/mlops-huggingface-tokenizers) |

:::info
以下是 Hermes 加载技能定义的完整内容。这是智能体在技能激活时看到的说明。
:::

# OBLITERATUS 技能

## 内容概述

9 个 CLI 方法，28 个分析模块，跨 5 个计算层级的 116 个模型预设，锦标赛评估，以及遥测驱动的推荐。

从开放权重的大语言模型中移除拒绝行为（防护栏），无需重新训练或微调。使用机制可解释性技术——包括差均法、SVD、白化 SVD、LEACE 概念擦除、SAE 分解、贝叶斯核投影等——识别并精确切除模型权重中的拒绝方向，同时保留推理能力。

**许可证警告：** OBLITERATUS 采用 AGPL-3.0 许可证。切勿将其作为 Python 库导入。务必通过 CLI (`obliteratus` 命令) 或子进程调用。这保持了 Hermes 智能体 MIT 许可证的合规性。

## 视频指南

Hermes 智能体使用 OBLITERATUS 消除 Gemma 安全防护栏的演练：
https://www.youtube.com/watch?v=8fG9BrNTeHs （"OBLITERATUS: An AI Agent Removed Gemma 4's Safety Guardrails"）

当用户希望在自行运行前获得端到端工作流的可视化概览时，此视频非常有用。

## 何时使用此技能

当用户提出以下需求时触发此技能：
- 希望对大语言模型进行"解密"或"消除"
- 询问如何从模型中移除拒绝/防护栏
- 希望创建 Llama、Qwen、Mistral 等模型的未审查版本
- 提及"拒绝移除"、"消融"、"权重投影"
- 希望分析模型的拒绝机制如何工作
- 引用 OBLITERATUS、消融器或拒绝方向

## 步骤一：安装

检查是否已安装：
```bash
obliteratus --version 2>/dev/null && echo "INSTALLED" || echo "NOT INSTALLED"
```

如果未安装，从 GitHub 克隆并安装：
```bash
git clone https://github.com/elder-plinius/OBLITERATUS.git
cd OBLITERATUS
pip install -e .
# 对于 Gradio 网页 UI 支持：
# pip install -e ".[spaces]"
```

**重要提示：** 安装前请与用户确认。此过程会拉取约 5-10GB 的依赖项（PyTorch、Transformers、bitsandbytes 等）。

## 步骤二：检查硬件

首先，检查可用的 GPU：
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

| 显存        | 最大模型尺寸    | 示例模型                                          |
|:------------|:----------------|:--------------------------------------------------|
| 仅 CPU      | ~1B 参数        | GPT-2, TinyLlama, SmolLM                          |
| 4-8 GB      | ~4B 参数        | Qwen2.5-1.5B, Phi-3.5 mini, Llama 3.2 3B         |
| 8-16 GB     | ~9B 参数        | Llama 3.1 8B, Mistral 7B, Gemma 2 9B             |
| 24 GB       | ~32B 参数       | Qwen3-32B, Llama 3.1 70B (紧凑), Command-R       |
| 48 GB+      | ~72B+ 参数      | Qwen2.5-72B, DeepSeek-R1                         |
| 多 GPU      | 200B+ 参数      | Llama 3.1 405B, DeepSeek-V3 (685B MoE)           |

## 步骤三：浏览可用模型并获取推荐

```bash
# 按计算层级浏览模型
obliteratus models --tier medium

# 获取特定模型的架构信息
obliteratus info <model_name>

# 获取遥测驱动的最佳方法和参数推荐
obliteratus recommend <model_name>
obliteratus recommend <model_name> --insights  # 全局跨架构排名
```

## 步骤四：选择方法

### 方法选择指南
**默认/大多数情况推荐：`高级`。** 它使用多方向 SVD 和保范投影，经过良好测试。

| 情况                                  | 推荐方法          | 原因                                      |
|:--------------------------------------|:------------------|:------------------------------------------|
| 默认/大多数模型                       | `高级`            | 多方向 SVD、保范投影、可靠                |
| 快速测试/原型设计                     | `基础`            | 快速、简单、足够评估                      |
| 密集模型 (Llama, Mistral)             | `高级`            | 多方向、保范投影                          |
| MoE 模型 (DeepSeek, Mixtral)          | `核弹`            | 专家粒度、处理 MoE 复杂性                 |
| 推理模型 (R1 蒸馏版)                  | `手术`            | CoT 感知、保留思维链                      |
| 持续的顽固拒绝                        | `激进`            | 白化 SVD + 注意力头手术 + 越狱           |
| 希望可逆的更改                        | 使用转向向量 (见分析部分)                 |
| 追求最高质量，不计时间                | `优化`            | 贝叶斯搜索寻找最佳参数                    |
| 实验性自动检测                        | `知情`            | 自动检测对齐类型 - 实验性，可能不总是优于高级 |

### 9 个 CLI 方法
- **基础** — 通过差均法提取单一拒绝方向。快速 (~5-10 分钟, 8B 模型)。
- **高级** (默认, 推荐) — 多个 SVD 方向，保范投影，2 次细化迭代。中等速度 (~10-20 分钟)。
- **激进** — 白化 SVD + 越狱对比 + 注意力头手术。连贯性损坏风险较高。
- **频谱级联** — DCT 频域分解。研究/新方法。
- **知情** — 在消融过程中运行分析以自动配置。实验性 - 比高级更慢且更不可预测。
- **手术** — SAE 特征 + 神经元掩码 + 头手术 + 按专家处理。非常慢 (~1-2 小时)。最适合推理模型。
- **优化** — 贝叶斯超参数搜索 (Optuna TPE)。运行时间最长但可找到最优参数。
- **反转** — 翻转拒绝方向。模型变得主动愿意。
- **核弹** — 针对顽固 MoE 模型的最强制组合。专家粒度。

### 方向提取方法 (--direction-method 标志)
- **差均法** (默认) — 拒绝/配合激活之间的简单差均。稳健。
- **SVD** — 多方向 SVD 提取。更适合复杂对齐。
- **LEACE** — LEACE (通过闭式估计线性擦除)。最优线性擦除。

### 4 个仅限 Python-API 的方法
(无法通过 CLI 使用 - 需要 Python 导入，这违反了 AGPL 边界。仅当用户明确希望在自己的 AGPL 项目中将 OBLITERATUS 用作库时才提及。)
- failspy, gabliteration, heretic, rdo

## 步骤五：运行消融

### 标准用法
```bash
# 默认方法 (高级) — 大多数模型推荐
obliteratus obliterate <model_name> --method advanced --output-dir ./abliterated-models

# 使用 4 位量化 (节省显存)
obliteratus obliterate <model_name> --method advanced --quantization 4bit --output-dir ./abliterated-models

# 大型模型 (70B+) — 保守默认设置
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
  --contribute  # 参与遥测贡献用于社区研究
```

### 关键标志
| 标志                      | 描述                                        | 默认值          |
|:--------------------------|:--------------------------------------------|:----------------|
| `--method`                | 消融方法                                    | advanced        |
| `--direction-method`      | 方向提取方法                                | diff_means      |
| `--n-directions`          | 拒绝方向数量 (1-32)                         | 取决于方法      |
| `--refinement-passes`     | 迭代次数 (1-5)                              | 2               |
| `--regularization`        | 正则化强度 (0.0-1.0)                        | 0.1             |
| `--quantization`          | 以 4 位或 8 位加载                          | none (全精度)   |
| `--large-model`           | 针对 120B+ 模型的保守默认设置               | false           |
| `--output-dir`            | 保存消融后模型的路径                        | ./obliterated_model |
| `--contribute`            | 分享匿名结果用于研究                        | false           |
| `--verify-sample-size`    | 用于拒绝检查的测试提示数量                  | 20              |
| `--dtype`                 | 模型数据类型 (float16, bfloat16)            | auto            |

### 其他执行模式
```bash
# 交互式引导模式 (硬件 -> 模型 -> 预设)
obliteratus interactive

# 网页 UI (Gradio)
obliteratus ui --port 7860

# 从 YAML 配置运行完整的消融研究
obliteratus run config.yaml --preset quick

# 锦标赛：让所有方法相互比拼
obliteratus tourney <model_name>
```

## 步骤六：验证结果

消融后，检查输出指标：

| 指标             | 良好值                   | 警告                              |
|:-----------------|:-------------------------|:----------------------------------|
| 拒绝率           | &lt; 5% (理想约 0%)     | > 10% 表示拒绝行为仍然存在        |
| 困惑度变化       | &lt; 10% 增加           | > 15% 表示连贯性损坏              |
| KL 散度          | &lt; 0.1                | > 0.5 表示显著分布偏移            |
| 连贯性           | 高 / 通过定性检查        | 响应降级、重复                    |

### 如果拒绝行为仍然存在 (> 10%)
1. 尝试 `激进` 方法
2. 增加 `--n-directions` (例如 8 或 16)
3. 添加 `--refinement-passes 3`
4. 尝试 `--direction-method svd` 代替 diff_means

### 如果连贯性受损 (困惑度增加 > 15%)
1. 减少 `--n-directions` (尝试 2)
2. 增加 `--regularization` (尝试 0.3)
3. 将 `--refinement-passes` 减少到 1
4. 尝试 `基础` 方法 (更温和)

## 步骤 7：使用经过“消融”的模型

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

# 使用 vLLM 进行服务化部署
vllm serve ./abliterated-models/<model>
```

## CLI 命令参考

| 命令 | 描述 |
|:------|:------|
| `obliteratus obliterate` | 主消融命令 |
| `obliteratus info <model>` | 打印模型架构详情 |
| `obliteratus models --tier <tier>` | 按计算层级浏览策展模型 |
| `obliteratus recommend <model>` | 基于遥测数据的方法/参数建议 |
| `obliteratus interactive` | 引导式设置向导 |
| `obliteratus tourney <model>` | 锦标赛：所有方法正面比较 |
| `obliteratus run <config.yaml>` | 根据 YAML 文件执行消融研究 |
| `obliteratus strategies` | 列出所有已注册的消融策略 |
| `obliteratus report <results.json>` | 重新生成可视化报告 |
| `obliteratus ui` | 启动 Gradio Web 界面 |
| `obliteratus aggregate` | 汇总社区遥测数据 |

## 分析模块

OBLITERATUS 包含 28 个用于机制可解释性的分析模块。
完整的参考文档请查阅 `skill_view(name="obliteratus", file_path="references/analysis-modules.md")`。

### 快速分析命令
```bash
# 运行特定的分析模块
obliteratus run analysis-config.yaml --preset quick

# 需要首先运行的关键模块：
# - alignment_imprint：指纹化 DPO/RLHF/CAI/SFT 对齐方法
# - concept_geometry：单方向 vs 多面锥
# - logit_lens：哪一层决定拒绝
# - anti_ouroboros：自修复风险评分
# - causal_tracing：因果上的必要组件
```

### 引导向量 (可逆替代方案)
不进行永久性的权重修改，而是使用推理时引导：
```python
# 仅限 Python API —— 用于用户自己的项目
from obliteratus.analysis.steering_vectors import SteeringVectorFactory, SteeringHookManager
```

## 消融策略

除了基于方向的消融，OBLITERATUS 还包含结构性消融策略：
- **嵌入消融** — 针对嵌入层组件
- **FFN 消融** — 前馈网络模块移除
- **注意力头修剪** — 注意力头修剪
- **层移除** — 整层移除

列出所有可用策略：`obliteratus strategies`

## 评估

OBLITERATUS 包含内置评估工具：
- 拒绝率基准测试
- 困惑度比较 (处理前/后)
- 集成 LM Eval Harness 用于学术基准测试
- 直接竞争对手比较
- 基线性能跟踪

## 平台支持

- **CUDA** — 完全支持 (NVIDIA GPU)
- **Apple Silicon (MLX)** — 通过 MLX 后端支持
- **CPU** — 支持小型模型 (&lt; 1B 参数)

## YAML 配置模板

通过 `skill_view` 加载模板以实现可复现运行：
- `templates/abliteration-config.yaml` — 标准单模型配置
- `templates/analysis-study.yaml` — 预消融分析研究
- `templates/batch-abliteration.yaml` — 多模型批处理

## 遥测

OBLITERATUS 可以选择性地将匿名运行数据贡献给全球研究数据集。
使用 `--contribute` 标志启用。不收集任何个人数据——仅包含模型名称、方法和指标。

## 常见陷阱

1. **不要默认使用 `informed`** — 它属于实验性且速度较慢。请使用 `advanced` 以获得可靠结果。
2. **参数量低于约 1B 的模型对消融反应较差** — 它们的拒绝行为是浅层且零散的，导致难以提取出清晰的定向向量。预期会有部分残留 (20-40% 的拒绝率)。3B 及以上的模型拥有更清晰的拒绝方向，反应要好得多 (使用 `advanced` 时通常能达到 0% 拒绝率)。
3. **`aggressive` 可能会使情况更糟** — 在小型模型上，它可能破坏连贯性并实际上增加拒绝率。仅在 `advanced` 方法在 3B+ 模型上仍留下 >10% 拒绝时才使用。
4. **务必检查困惑度** — 如果它飙升 >15%，则模型已受损。请降低激进程度。
5. **MoE 模型需要特殊处理** — 对 Mixtral, DeepSeek-MoE 等请使用 `nuclear` 方法。
6. **量化模型无法被重新量化** — 请在全精度模型上进行消融，然后对输出进行量化。
7. **显存估算仅为近似值** — 4 位量化有帮助，但在提取期间峰值使用可能会激增。
8. **推理模型较为敏感** — 对于 R1 蒸馏模型，请使用 `surgical` 方法以保留思维链。
9. **查看 `obliteratus recommend`** — 遥测数据可能拥有比默认值更好的参数。
10. **AGPL 许可证** — 永远不要在 MIT/Apache 项目中 `import obliteratus`。仅通过 CLI 调用。
11. **大型模型 (70B+)** — 务必使用 `--large-model` 标志以采用保守的默认设置。
12. **光谱认证 RED 很常见** — 即使实际拒绝率为 0%，光谱检查也常常标记为“未完成”。请检查实际拒绝率，而不仅仅依赖光谱认证。

## 互补技能

- **vllm** — 高吞吐量地部署经过消融的模型
- **gguf** — 将经过消融的模型转换为 GGUF 格式，用于 llama.cpp
- **huggingface-tokenizers** — 处理模型分词器