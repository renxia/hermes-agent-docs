---
title: "Simpo 训练 —— 面向 LLM 对齐的简单偏好优化"
sidebar_label: "Simpo 训练"
description: "面向 LLM 对齐的简单偏好优化"
---

{/* 此页面由网站脚本 scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源 SKILL.md 文件，而非此页面。 */}

# Simpo 训练

面向 LLM 对齐的简单偏好优化。作为 DPO 的无参考替代方案，性能更优（在 AlpacaEval 2.0 上提升 +6.4 分）。无需参考模型，比 DPO 更高效。当希望获得比 DPO/PPO 更简单、更快的训练以进行偏好对齐时使用。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 —— 通过 `hermes skills install official/mlops/simpo` 安装 |
| 路径 | `optional-skills/mlops/simpo` |
| 版本 | `1.0.0` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖项 | `torch`、`transformers`、`datasets`、`trl`、`accelerate` |
| 平台 | linux、macos、windows |
| 标签 | `后训练`、`SimPO`、`偏好优化`、`对齐`、`DPO 替代方案`、`无参考`、`LLM 对齐`、`高效训练` |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是当技能激活时，智能体看到的指令。
:::

# SimPO —— 简单偏好优化

## 快速入门

SimPO 是一种无参考的偏好优化方法，其性能优于 DPO 且无需参考模型。

**安装**：
```bash
# 创建环境
conda create -n simpo python=3.10 && conda activate simpo

# 安装 PyTorch 2.2.2
# 访问: https://pytorch.org/get-started/locally/

# 安装 alignment-handbook
git clone https://github.com/huggingface/alignment-handbook.git
cd alignment-handbook
python -m pip install .

# 安装 Flash Attention 2
python -m pip install flash-attn --no-build-isolation
```

**训练** (Mistral 7B):
```bash
ACCELERATE_LOG_LEVEL=info accelerate launch \
  --config_file accelerate_configs/deepspeed_zero3.yaml \
  scripts/run_simpo.py \
  training_configs/mistral-7b-base-simpo.yaml
```

## 常用工作流

### 工作流 1：从基础模型训练 (Mistral 7B)

**配置** (`mistral-7b-base-simpo.yaml`):
```yaml
# 模型
model_name_or_path: mistralai/Mistral-7B-v0.1
torch_dtype: bfloat16

# 数据集
dataset_mixer:
  HuggingFaceH4/ultrafeedback_binarized: 1.0
dataset_splits:
  - train_prefs
  - test_prefs

# SimPO 超参数
beta: 2.0                  # 奖励缩放 (2.0-10.0)
gamma_beta_ratio: 0.5       # 目标间隔 (0-1)
loss_type: sigmoid          # sigmoid 或 hinge
sft_weight: 0.0             # 可选 SFT 正则化

# 训练
learning_rate: 5e-7         # 关键：3e-7 到 1e-6
num_train_epochs: 1
per_device_train_batch_size: 1
gradient_accumulation_steps: 8

# 输出
output_dir: ./outputs/mistral-7b-simpo
```

**启动训练**:
```bash
accelerate launch --config_file accelerate_configs/deepspeed_zero3.yaml \
  scripts/run_simpo.py training_configs/mistral-7b-base-simpo.yaml
```

### 工作流 2：微调指令模型 (Llama 3 8B)

**配置** (`llama3-8b-instruct-simpo.yaml`):
```yaml
model_name_or_path: meta-llama/Meta-Llama-3-8B-Instruct

dataset_mixer:
  argilla/ultrafeedback-binarized-preferences-cleaned: 1.0

beta: 2.5
gamma_beta_ratio: 0.5
learning_rate: 5e-7
sft_weight: 0.1             # 添加 SFT 损失以保留能力

num_train_epochs: 1
per_device_train_batch_size: 2
gradient_accumulation_steps: 4
output_dir: ./outputs/llama3-8b-simpo
```

**启动**:
```bash
accelerate launch --config_file accelerate_configs/deepspeed_zero3.yaml \
  scripts/run_simpo.py training_configs/llama3-8b-instruct-simpo.yaml
```

### 工作流 3：推理密集型任务（更低学习率）

**适用于数学/代码任务**:
```yaml
model_name_or_path: deepseek-ai/deepseek-math-7b-base

dataset_mixer:
  argilla/distilabel-math-preference-dpo: 1.0

beta: 5.0                   # 更高值以获得更强信号
gamma_beta_ratio: 0.7       # 更大间隔
learning_rate: 3e-7         # 推理任务使用更低学习率
sft_weight: 0.0

num_train_epochs: 1
per_device_train_batch_size: 1
gradient_accumulation_steps: 16
```

## 何时使用与替代方案对比

**当出现以下情况时使用 SimPO**：
- 希望获得比 DPO 更简单的训练（无需参考模型）
- 拥有偏好数据（选择/拒绝对）
- 需要优于 DPO 的性能
- 计算资源有限
- 单节点训练即可满足需求

**算法选择**：
- **SimPO**：最简单，性能最佳，无需参考模型
- **DPO**：需要参考模型基线，更保守
- **PPO**：控制力最强，需要奖励模型，设置复杂
- **GRPO**：内存高效的强化学习，无评判器

**改用替代方案**：
- **OpenRLHF**：多节点分布式训练，PPO/GRPO
- **TRL**：需要一个框架支持多种方法
- **DPO**：成熟的基线比较

## 常见问题

**问题：损失发散**

降低学习率：
```yaml
learning_rate: 3e-7  # 从 5e-7 减少
```

降低 beta：
```yaml
beta: 1.0  # 从 2.0 减少
```

**问题：模型遗忘能力**

添加 SFT 正则化：
```yaml
sft_weight: 0.1  # 添加 SFT 损失分量
```

**问题：偏好分离度差**

增加 beta 和间隔：
```yaml
beta: 5.0            # 从 2.0 增加
gamma_beta_ratio: 0.8  # 从 0.5 增加
```

**问题：训练时内存溢出 (OOM)**

减小批大小：
```yaml
per_device_train_batch_size: 1
gradient_accumulation_steps: 16  # 保持有效批大小
```

启用梯度检查点：
```yaml
gradient_checkpointing: true
```

## 进阶主题

**损失函数**：有关 sigmoid 与 hinge 损失的数学公式及使用场景，请参见 [references/loss-functions.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/mlops/simpo/references/loss-functions.md)。

**超参数调优**：有关 beta、gamma、学习率选择指南及针对不同模型规模的建议，请参见 [references/hyperparameters.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/mlops/simpo/references/hyperparameters.md)。

**数据集准备**：有关偏好数据格式、质量过滤和自定义数据集创建，请参见 [references/datasets.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/mlops/simpo/references/datasets.md)。

## 硬件要求

- **GPU**：推荐 NVIDIA A100/H100
- **显存**：
  - 7B 模型：1× A100 40GB (使用 DeepSpeed ZeRO-3)
  - 8B 模型：2× A100 40GB
  - 70B 模型：8× A100 80GB
- **单节点**：使用 DeepSpeed ZeRO-3 即可
- **混合精度**：推荐使用 BF16

**内存优化**：
- DeepSpeed ZeRO-3 (默认配置)
- 梯度检查点
- Flash Attention 2

## 资源

- 论文：https://arxiv.org/abs/2405.14734 (NeurIPS 2024)
- GitHub：https://github.com/princeton-nlp/SimPO
- 模型：https://huggingface.co/princeton-nlp
- Alignment Handbook：https://github.com/huggingface/alignment-handbook