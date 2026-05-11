---
title: "Huggingface Accelerate — 最简化的分布式训练 API"
sidebar_label: "Huggingface Accelerate"
description: "最简化的分布式训练 API"
---

{/* 此页面由网站脚本 `generate-skill-docs.py` 根据技能的 `SKILL.md` 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Huggingface Accelerate

最简化的分布式训练 API。仅需 4 行代码即可为任何 PyTorch 脚本添加分布式支持。为 DeepSpeed/FSDP/Megatron/DDP 提供统一 API。自动设备放置、混合精度 (FP16/BF16/FP8)。交互式配置，单一启动命令。HuggingFace 生态系统标准。

## 技能元数据

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/mlops/accelerate` 安装 |
| Path | `optional-skills/mlops/accelerate` |
| Version | `1.0.0` |
| Author | Orchestra Research |
| License | MIT |
| Dependencies | `accelerate`, `torch`, `transformers` |
| Platforms | linux, macos, windows |
| Tags | `分布式训练`, `HuggingFace`, `Accelerate`, `DeepSpeed`, `FSDP`, `混合精度`, `PyTorch`, `DDP`, `统一 API`, `简单` |

## 参考：完整 SKILL.md

:::info
以下是触发此技能时 Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# HuggingFace Accelerate - 统一分布式训练

## 快速入门

Accelerate 将分布式训练简化为 4 行代码。

**安装**:
```bash
pip install accelerate
```

**转换 PyTorch 脚本** (4 行):
```python
import torch
+ from accelerate import Accelerator

+ accelerator = Accelerator()

  model = torch.nn.Transformer()
  optimizer = torch.optim.Adam(model.parameters())
  dataloader = torch.utils.data.DataLoader(dataset)

+ model, optimizer, dataloader = accelerator.prepare(model, optimizer, dataloader)

  for batch in dataloader:
      optimizer.zero_grad()
      loss = model(batch)
-     loss.backward()
+     accelerator.backward(loss)
      optimizer.step()
```

**运行** (单命令):
```bash
accelerate launch train.py
```

## 常见工作流

### 工作流 1：从单 GPU 到多 GPU

**原始脚本**:
```python
# train.py
import torch

model = torch.nn.Linear(10, 2).to('cuda')
optimizer = torch.optim.Adam(model.parameters())
dataloader = torch.utils.data.DataLoader(dataset, batch_size=32)

for epoch in range(10):
    for batch in dataloader:
        batch = batch.to('cuda')
        optimizer.zero_grad()
        loss = model(batch).mean()
        loss.backward()
        optimizer.step()
```

**使用 Accelerate** (添加 4 行):
```python
# train.py
import torch
from accelerate import Accelerator  # +1

accelerator = Accelerator()  # +2

model = torch.nn.Linear(10, 2)
optimizer = torch.optim.Adam(model.parameters())
dataloader = torch.utils.data.DataLoader(dataset, batch_size=32)

model, optimizer, dataloader = accelerator.prepare(model, optimizer, dataloader)  # +3

for epoch in range(10):
    for batch in dataloader:
        # 无需 .to('cuda') — 自动完成！
        optimizer.zero_grad()
        loss = model(batch).mean()
        accelerator.backward(loss)  # +4
        optimizer.step()
```

**配置** (交互式):
```bash
accelerate config
```

**问题**:
- 哪种机器？ (单 GPU/多 GPU/TPU/CPU)
- 有多少台机器？ (1)
- 混合精度？ (无/fp16/bf16/fp8)
- DeepSpeed？ (无/有)

**启动** (适用于任何配置):
```bash
# 单 GPU
accelerate launch train.py

# 多 GPU (8 GPUs)
accelerate launch --multi_gpu --num_processes 8 train.py

# 多节点
accelerate launch --multi_gpu --num_processes 16 \
  --num_machines 2 --machine_rank 0 \
  --main_process_ip $MASTER_ADDR \
  train.py
```

### 工作流 2：混合精度训练

**启用 FP16/BF16**:
```python
from accelerate import Accelerator

# FP16 (带梯度缩放)
accelerator = Accelerator(mixed_precision='fp16')

# BF16 (无缩放，更稳定)
accelerator = Accelerator(mixed_precision='bf16')

# FP8 (H100+)
accelerator = Accelerator(mixed_precision='fp8')

model, optimizer, dataloader = accelerator.prepare(model, optimizer, dataloader)

# 其余部分都是自动的！
for batch in dataloader:
    with accelerator.autocast():  # 可选，已自动完成
        loss = model(batch)
    accelerator.backward(loss)
```

### 工作流 3：DeepSpeed ZeRO 集成

**启用 DeepSpeed ZeRO-2**:
```python
from accelerate import Accelerator

accelerator = Accelerator(
    mixed_precision='bf16',
    deepspeed_plugin={
        "zero_stage": 2,  # ZeRO-2
        "offload_optimizer": False,
        "gradient_accumulation_steps": 4
    }
)

# 代码与之前相同！
model, optimizer, dataloader = accelerator.prepare(model, optimizer, dataloader)
```

**或通过配置文件**:
```bash
accelerate config
# 选择：DeepSpeed → ZeRO-2
```

**deepspeed_config.json**:
```json
{
    "fp16": {"enabled": false},
    "bf16": {"enabled": true},
    "zero_optimization": {
        "stage": 2,
        "offload_optimizer": {"device": "cpu"},
        "allgather_bucket_size": 5e8,
        "reduce_bucket_size": 5e8
    }
}
```

**启动**:
```bash
accelerate launch --config_file deepspeed_config.json train.py
```

### 工作流 4：FSDP (完全分片数据并行)

**启用 FSDP**:
```python
from accelerate import Accelerator, FullyShardedDataParallelPlugin

fsdp_plugin = FullyShardedDataParallelPlugin(
    sharding_strategy="FULL_SHARD",  # 等效 ZeRO-3
    auto_wrap_policy="TRANSFORMER_AUTO_WRAP",
    cpu_offload=False
)

accelerator = Accelerator(
    mixed_precision='bf16',
    fsdp_plugin=fsdp_plugin
)

model, optimizer, dataloader = accelerator.prepare(model, optimizer, dataloader)
```

**或通过配置文件**:
```bash
accelerate config
# 选择：FSDP → 完全分片 → 不卸载到 CPU
```

### 工作流 5：梯度累积

**累积梯度**:
```python
from accelerate import Accelerator

accelerator = Accelerator(gradient_accumulation_steps=4)

model, optimizer, dataloader = accelerator.prepare(model, optimizer, dataloader)

for batch in dataloader:
    with accelerator.accumulate(model):  # 处理累积
        optimizer.zero_grad()
        loss = model(batch)
        accelerator.backward(loss)
        optimizer.step()
```

**有效批量大小**: `batch_size * num_gpus * gradient_accumulation_steps`

## 何时使用与替代方案

**使用 Accelerate 当**:
- 需要最简单的分布式训练
- 需要适用于任何硬件的单一脚本
- 使用 HuggingFace 生态系统
- 需要灵活性 (DDP/DeepSpeed/FSDP/Megatron)
- 需要快速原型设计

**关键优势**:
- **4 行代码**: 最小代码更改
- **统一 API**: DDP、DeepSpeed、FSDP、Megatron 使用相同代码
- **自动化**: 设备放置、混合精度、分片
- **交互式配置**: 无需手动启动器设置
- **单一启动**: 随处可用

**改用替代方案当**:
- **PyTorch Lightning**: 需要回调、高级抽象
- **Ray Train**: 多节点编排、超参数调优
- **DeepSpeed**: 直接 API 控制、高级功能
- **原始 DDP**: 最大控制、最小抽象

## 常见问题

**问题：错误的设备放置**

不要手动移动到设备：
```python
# 错误
batch = batch.to('cuda')

# 正确
# prepare() 之后 Accelerate 会自动处理
```

**问题：梯度累积不起作用**

使用上下文管理器：
```python
# 正确
with accelerator.accumulate(model):
    optimizer.zero_grad()
    accelerator.backward(loss)
    optimizer.step()
```

**问题：分布式训练中的检查点**

使用 Accelerator 方法：
```python
# 仅在主进程上保存
if accelerator.is_main_process:
    accelerator.save_state('checkpoint/')

# 在所有进程上加载
accelerator.load_state('checkpoint/')
```

**问题：使用 FSDP 时结果不同**

确保使用相同的随机种子：
```python
from accelerate.utils import set_seed
set_seed(42)
```

## 高级主题

**Megatron 集成**: 参见 [references/megatron-integration.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/mlops/accelerate/references/megatron-integration.md) 了解张量并行、流水线并行和序列并行的设置。

**自定义插件**: 参见 [references/custom-plugins.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/mlops/accelerate/references/custom-plugins.md) 了解如何创建自定义分布式插件和高级配置。

**性能调优**: 参见 [references/performance.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/mlops/accelerate/references/performance.md) 了解性能分析、内存优化和最佳实践。

## 硬件要求

- **CPU**: 可用 (较慢)
- **单 GPU**: 可用
- **多 GPU**: DDP (默认)、DeepSpeed 或 FSDP
- **多节点**: DDP、DeepSpeed、FSDP、Megatron
- **TPU**: 支持
- **Apple MPS**: 支持

**启动器要求**:
- **DDP**: `torch.distributed.run` (内置)
- **DeepSpeed**: `deepspeed` (pip install deepspeed)
- **FSDP**: PyTorch 1.12+ (内置)
- **Megatron**: 自定义设置

## 资源

- 文档: https://huggingface.co/docs/accelerate
- GitHub: https://github.com/huggingface/accelerate
- 版本: 1.11.0+
- 教程: "Accelerate your scripts"
- 示例: https://github.com/huggingface/accelerate/tree/main/examples
- 使用者: HuggingFace Transformers、TRL、PEFT、所有 HF 库