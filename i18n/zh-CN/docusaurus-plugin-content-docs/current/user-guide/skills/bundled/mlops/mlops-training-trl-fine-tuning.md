---
title: "使用 Trl 进行微调"
sidebar_label: "使用 Trl 进行微调"
description: "使用 TRL 通过强化学习对大语言模型进行微调 - SFT 用于指令调优，DPO 用于偏好对齐，PPO/GRPO 用于奖励优化，以及奖励模型训练..."
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# 使用 Trl 进行微调

使用 TRL 通过强化学习对大语言模型进行微调 - SFT 用于指令调优，DPO 用于偏好对齐，PPO/GRPO 用于奖励优化，以及奖励模型训练。当需要 RLHF、将模型与偏好对齐或从人类反馈中训练时使用。可与 HuggingFace Transformers 配合使用。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/mlops/training/trl-fine-tuning` |
| 版本 | `1.0.0` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖项 | `trl`, `transformers`, `datasets`, `peft`, `accelerate`, `torch` |
| 标签 | `训练后`, `TRL`, `强化学习`, `微调`, `SFT`, `DPO`, `PPO`, `GRPO`, `RLHF`, `偏好对齐`, `HuggingFace` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# TRL - 变换器强化学习

## 快速入门

TRL 提供了用于将语言模型与人类偏好对齐的后训练方法。

**安装**：
```bash
pip install trl transformers datasets peft accelerate
```

**监督微调**（指令调优）：
```python
from trl import SFTTrainer

trainer = SFTTrainer(
    model="Qwen/Qwen2.5-0.5B",
    train_dataset=dataset,  # 提示-补全对
)
trainer.train()
```

**DPO**（与偏好对齐）：
```python
from trl import DPOTrainer, DPOConfig

config = DPOConfig(output_dir="model-dpo", beta=0.1)
trainer = DPOTrainer(
    model=model,
    args=config,
    train_dataset=preference_dataset,  # 优选/拒绝对
    processing_class=tokenizer
)
trainer.train()
```

## 常见工作流

### 工作流 1：完整的 RLHF 流程（SFT → 奖励模型 → PPO）

从基础模型到与人类对齐的模型的完整流程。

复制此检查清单：

```
RLHF 训练：
- [ ] 步骤 1：监督微调（SFT）
- [ ] 步骤 2：训练奖励模型
- [ ] 步骤 3：PPO 强化学习
- [ ] 步骤 4：评估对齐模型
```

**步骤 1：监督微调**

在遵循指令的数据上训练基础模型：

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import SFTTrainer, SFTConfig
from datasets import load_dataset

# 加载模型
model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-0.5B")
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-0.5B")

# 加载指令数据集
dataset = load_dataset("trl-lib/Capybara", split="train")

# 配置训练
training_args = SFTConfig(
    output_dir="Qwen2.5-0.5B-SFT",
    per_device_train_batch_size=4,
    num_train_epochs=1,
    learning_rate=2e-5,
    logging_steps=10,
    save_strategy="epoch"
)

# 训练
trainer = SFTTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    tokenizer=tokenizer
)
trainer.train()
trainer.save_model()
```

**步骤 2：训练奖励模型**

训练模型以预测人类偏好：

```python
from transformers import AutoModelForSequenceClassification
from trl import RewardTrainer, RewardConfig

# 加载 SFT 模型作为基础
model = AutoModelForSequenceClassification.from_pretrained(
    "Qwen2.5-0.5B-SFT",
    num_labels=1  # 单一奖励分数
)
tokenizer = AutoTokenizer.from_pretrained("Qwen2.5-0.5B-SFT")

# 加载偏好数据（优选/拒绝对）
dataset = load_dataset("trl-lib/ultrafeedback_binarized", split="train")

# 配置训练
training_args = RewardConfig(
    output_dir="Qwen2.5-0.5B-Reward",
    per_device_train_batch_size=2,
    num_train_epochs=1,
    learning_rate=1e-5
)

# 训练奖励模型
trainer = RewardTrainer(
    model=model,
    args=training_args,
    processing_class=tokenizer,
    train_dataset=dataset
)
trainer.train()
trainer.save_model()
```

**步骤 3：PPO 强化学习**

使用奖励模型优化策略：

```bash
python -m trl.scripts.ppo \
    --model_name_or_path Qwen2.5-0.5B-SFT \
    --reward_model_path Qwen2.5-0.5B-Reward \
    --dataset_name trl-internal-testing/descriptiveness-sentiment-trl-style \
    --output_dir Qwen2.5-0.5B-PPO \
    --learning_rate 3e-6 \
    --per_device_train_batch_size 64 \
    --total_episodes 10000
```

**步骤 4：评估**

```python
from transformers import pipeline

# 加载对齐模型
generator = pipeline("text-generation", model="Qwen2.5-0.5B-PPO")

# 测试
prompt = "向一个 10 岁孩子解释量子计算"
output = generator(prompt, max_length=200)[0]["generated_text"]
print(output)
```

### 工作流 2：使用 DPO 进行简单偏好对齐

无需奖励模型即可将模型与偏好对齐。

复制此检查清单：

```
DPO 训练：
- [ ] 步骤 1：准备偏好数据集
- [ ] 步骤 2：配置 DPO
- [ ] 步骤 3：使用 DPOTrainer 训练
- [ ] 步骤 4：评估对齐效果
```

**步骤 1：准备偏好数据集**

数据集格式：
```json
{
  "prompt": "法国的首都是什么？",
  "chosen": "法国的首都是巴黎。",
  "rejected": "我不知道。"
}
```

加载数据集：
```python
from datasets import load_dataset

dataset = load_dataset("trl-lib/ultrafeedback_binarized", split="train")
# 或者加载你自己的数据
# dataset = load_dataset("json", data_files="preferences.json")
```

**步骤 2：配置 DPO**

```python
from trl import DPOConfig

config = DPOConfig(
    output_dir="Qwen2.5-0.5B-DPO",
    per_device_train_batch_size=4,
    num_train_epochs=1,
    learning_rate=5e-7,
    beta=0.1,  # KL 惩罚强度
    max_prompt_length=512,
    max_length=1024,
    logging_steps=10
)
```

**步骤 3：使用 DPOTrainer 训练**

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import DPOTrainer

model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct")
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct")

trainer = DPOTrainer(
    model=model,
    args=config,
    train_dataset=dataset,
    processing_class=tokenizer
)

trainer.train()
trainer.save_model()
```

**CLI 替代方案**：
```bash
trl dpo \
    --model_name_or_path Qwen/Qwen2.5-0.5B-Instruct \
    --dataset_name argilla/Capybara-Preferences \
    --output_dir Qwen2.5-0.5B-DPO \
    --per_device_train_batch_size 4 \
    --learning_rate 5e-7 \
    --beta 0.1
```

### 工作流 3：使用 GRPO 进行内存高效的在线 RL

使用最少的内存进行强化学习训练。

有关 GRPO 的深入指导——奖励函数设计、关键训练见解（损失行为、模式崩溃、调优）以及高级多阶段模式——请参阅 **[references/grpo-training.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/mlops/training/trl-fine-tuning/references/grpo-training.md)**。一个可用于生产的训练脚本位于 **[templates/basic_grpo_training.py](https://github.com/NousResearch/hermes-agent/blob/main/skills/mlops/training/trl-fine-tuning/templates/basic_grpo_training.py)**。

复制此检查清单：

```
GRPO 训练：
- [ ] 步骤 1：定义奖励函数
- [ ] 步骤 2：配置 GRPO
- [ ] 步骤 3：使用 GRPOTrainer 训练
```

**步骤 1：定义奖励函数**

```python
def reward_function(completions, **kwargs):
    """
    为补全计算奖励。

    参数：
        completions: 生成的文本列表

    返回：
        奖励分数列表（浮点数）
    """
    rewards = []
    for completion in completions:
        # 示例：基于长度和唯一词给予奖励
        score = len(completion.split())  # 偏好更长的回复
        score += len(set(completion.lower().split()))  # 奖励唯一词
        rewards.append(score)
    return rewards
```

或使用奖励模型：
```python
from transformers import pipeline

reward_model = pipeline("text-classification", model="reward-model-path")

def reward_from_model(completions, prompts, **kwargs):
    # 组合提示 + 补全
    full_texts = [p + c for p, c in zip(prompts, completions)]
    # 获取奖励分数
    results = reward_model(full_texts)
    return [r["score"] for r in results]
```

**步骤 2：配置 GRPO**

```python
from trl import GRPOConfig

config = GRPOConfig(
    output_dir="Qwen2-GRPO",
    per_device_train_batch_size=4,
    num_train_epochs=1,
    learning_rate=1e-5,
    num_generations=4,  # 每个提示生成 4 个补全
    max_new_tokens=128
)
```

**步骤 3：使用 GRPOTrainer 训练**

```python
from datasets import load_dataset
from trl import GRPOTrainer

# 加载仅包含提示的数据集
dataset = load_dataset("trl-lib/tldr", split="train")

trainer = GRPOTrainer(
    model="Qwen/Qwen2-0.5B-Instruct",
    reward_funcs=reward_function,  # 你的奖励函数
    args=config,
    train_dataset=dataset
)

trainer.train()
```

**CLI**：
```bash
trl grpo \
    --model_name_or_path Qwen/Qwen2-0.5B-Instruct \
    --dataset_name trl-lib/tldr \
    --output_dir Qwen2-GRPO \
    --num_generations 4
```

## 何时使用 vs 替代方案

**在以下情况使用 TRL：**
- 需要将模型与人类偏好对齐
- 拥有偏好数据（优选/拒绝对）
- 希望使用强化学习（PPO、GRPO）
- 需要奖励模型训练
- 正在进行 RLHF（完整流程）

**方法选择：**
- **SFT**：拥有提示-补全对，希望进行基本的指令遵循
- **DPO**：拥有偏好，希望进行简单对齐（无需奖励模型）
- **PPO**：拥有奖励模型，需要对 RL 进行最大控制
- **GRPO**：内存受限，希望进行在线 RL
- **奖励模型**：构建 RLHF 流程，需要对生成内容进行评分

**改用替代方案：**
- **HuggingFace Trainer**：无需 RL 的基本微调
- **Axolotl**：基于 YAML 的训练配置
- **LitGPT**：教育用途，最小化微调
- **Unsloth**：快速 LoRA 训练

## 常见问题

**问题：DPO训练期间内存不足（OOM）**

减小批处理大小和序列长度：
```python
config = DPOConfig(
    per_device_train_batch_size=1,  # 从4减小
    max_length=512,  # 从1024减小
    gradient_accumulation_steps=8  # 保持有效批处理大小
)
```

或使用梯度检查点：
```python
model.gradient_checkpointing_enable()
```

**问题：对齐质量差**

调整beta参数：
```python
# 更高的beta = 更保守（更接近参考模型）
config = DPOConfig(beta=0.5)  # 默认值0.1

# 更低的beta = 更激进的对齐
config = DPOConfig(beta=0.01)
```

**问题：奖励模型不学习**

检查损失类型和超参数：
```python
config = RewardConfig(
    learning_rate=1e-5,  # 尝试不同的学习率
    num_train_epochs=3  # 训练更长时间
)
```

确保偏好数据集具有明确的优胜者：
```python
# 验证数据集
print(dataset[0])
# 应该有明确的chosen > rejected
```

**问题：PPO训练不稳定**

调整KL系数：
```python
config = PPOConfig(
    kl_coef=0.1,  # 从0.05增加
    cliprange=0.1  # 从0.2减小
)
```

## 高级主题

**SFT训练指南**：请参阅[references/sft-training.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/mlops/training/trl-fine-tuning/references/sft-training.md)，了解数据集格式、对话模板、打包策略和多GPU训练。

**DPO变体**：请参阅[references/dpo-variants.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/mlops/training/trl-fine-tuning/references/dpo-variants.md)，了解IPO、cDPO、RPO和其他DPO损失函数以及推荐的超参数。

**奖励建模**：请参阅[references/reward-modeling.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/mlops/training/trl-fine-tuning/references/reward-modeling.md)，了解结果奖励与过程奖励、Bradley-Terry损失以及奖励模型评估。

**在线强化学习方法**：请参阅[references/online-rl.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/mlops/training/trl-fine-tuning/references/online-rl.md)，了解PPO、GRPO、RLOO和OnlineDPO的详细配置。

**GRPO深度解析**：请参阅[references/grpo-training.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/mlops/training/trl-fine-tuning/references/grpo-training.md)，了解专家级GRPO模式——奖励函数设计哲学、训练洞察（为什么损失会增加、模式崩溃检测）、超参数调整、多阶段训练和故障排除。生产就绪模板位于[templates/basic_grpo_training.py](https://github.com/NousResearch/hermes-agent/blob/main/skills/mlops/training/trl-fine-tuning/templates/basic_grpo_training.py)。

## 硬件要求

- **GPU**：NVIDIA（需要CUDA）
- **显存**：取决于模型和训练方法
  - SFT 7B：16GB（使用LoRA）
  - DPO 7B：24GB（存储参考模型）
  - PPO 7B：40GB（策略模型 + 奖励模型）
  - GRPO 7B：24GB（更节省内存）
- **多GPU**：通过`accelerate`支持
- **混合精度**：推荐BF16（A100/H100）

**内存优化**：
- 所有方法都使用LoRA/QLoRA
- 启用梯度检查点
- 使用较小的批处理大小并结合梯度累积

## 资源

- 文档：https://huggingface.co/docs/trl/
- GitHub：https://github.com/huggingface/trl
- 论文：
  - "Training language models to follow instructions with human feedback" (InstructGPT, 2022)
  - "Direct Preference Optimization: Your Language Model is Secretly a Reward Model" (DPO, 2023)
  - "Group Relative Policy Optimization" (GRPO, 2024)
- 示例：https://github.com/huggingface/trl/tree/main/examples/scripts