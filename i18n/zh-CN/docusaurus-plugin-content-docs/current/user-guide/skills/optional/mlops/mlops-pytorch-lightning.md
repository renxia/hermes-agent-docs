---
title: "Pytorch Lightning"
sidebar_label: "Pytorch Lightning"
description: "高级 PyTorch 框架，具备 Trainer 类、自动分布式训练（DDP/FSDP/DeepSpeed）、回调系统和最小样板代码"
---

{/* 此页面由网站脚本 generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Pytorch Lightning

高级 PyTorch 框架，具备 Trainer 类、自动分布式训练（DDP/FSDP/DeepSpeed）、回调系统和最小样板代码。可在相同代码下从笔记本电脑扩展到超级计算机。当您希望使用内置最佳实践的简洁训练循环时，请使用此框架。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 安装命令：`hermes skills install official/mlops/pytorch-lightning` |
| 路径 | `optional-skills/mlops/pytorch-lightning` |
| 版本 | `1.0.0` |
| 作者 | Orchestra Research |
| 许可 | MIT |
| 依赖项 | `lightning`, `torch`, `transformers` |
| 平台 | linux, macos, windows |
| 标签 | `PyTorch Lightning`, `训练框架`, `分布式训练`, `DDP`, `FSDP`, `DeepSpeed`, `高级 API`, `回调`, `最佳实践`, `可扩展` |

```markdown
:::info
以下是 Hermes 加载此技能时的完整技能定义。当技能激活时，这是智能体看到的指令。
:::

# PyTorch Lightning - 高阶训练框架

## 快速开始

PyTorch Lightning 整理 PyTorch 代码以消除样板代码，同时保持灵活性。

**安装**：
```bash
pip install lightning
```

**将 PyTorch 转换为 Lightning**（3 步）：

```python
import lightning as L
import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset

# 步骤 1：定义 LightningModule（整理你的 PyTorch 代码）
class LitModel(L.LightningModule):
    def __init__(self, hidden_size=128):
        super().__init__()
        self.model = nn.Sequential(
            nn.Linear(28 * 28, hidden_size),
            nn.ReLU(),
            nn.Linear(hidden_size, 10)
        )

    def training_step(self, batch, batch_idx):
        x, y = batch
        y_hat = self.model(x)
        loss = nn.functional.cross_entropy(y_hat, y)
        self.log('train_loss', loss)  # 自动记录到 TensorBoard
        return loss

    def configure_optimizers(self):
        return torch.optim.Adam(self.parameters(), lr=1e-3)

# 步骤 2：创建数据
train_loader = DataLoader(train_dataset, batch_size=32)

# 步骤 3：使用 Trainer 训练（处理其他所有事情！）
trainer = L.Trainer(max_epochs=10, accelerator='gpu', devices=2)
model = LitModel()
trainer.fit(model, train_loader)
```

**就这样！** Trainer 处理了：
- GPU/TPU/CPU 切换
- 分布式训练 (DDP, FSDP, DeepSpeed)
- 混合精度 (FP16, BF16)
- 梯度累积
- 检查点保存
- 日志记录
- 进度条

## 常见工作流

### 工作流 1：从 PyTorch 到 Lightning

**原始 PyTorch 代码**：
```python
model = MyModel()
optimizer = torch.optim.Adam(model.parameters())
model.to('cuda')

for epoch in range(max_epochs):
    for batch in train_loader:
        batch = batch.to('cuda')
        optimizer.zero_grad()
        loss = model(batch)
        loss.backward()
        optimizer.step()
```

**Lightning 版本**：
```python
class LitModel(L.LightningModule):
    def __init__(self):
        super().__init__()
        self.model = MyModel()

    def training_step(self, batch, batch_idx):
        loss = self.model(batch)  # 无需 .to('cuda')！
        return loss

    def configure_optimizers(self):
        return torch.optim.Adam(self.parameters())

# 训练
trainer = L.Trainer(max_epochs=10, accelerator='gpu')
trainer.fit(LitModel(), train_loader)
```

**优势**：40+ 行 → 15 行，无需设备管理，自动分布式

### 工作流 2：验证与测试

```python
class LitModel(L.LightningModule):
    def __init__(self):
        super().__init__()
        self.model = MyModel()

    def training_step(self, batch, batch_idx):
        x, y = batch
        y_hat = self.model(x)
        loss = nn.functional.cross_entropy(y_hat, y)
        self.log('train_loss', loss)
        return loss

    def validation_step(self, batch, batch_idx):
        x, y = batch
        y_hat = self.model(x)
        val_loss = nn.functional.cross_entropy(y_hat, y)
        acc = (y_hat.argmax(dim=1) == y).float().mean()
        self.log('val_loss', val_loss)
        self.log('val_acc', acc)

    def test_step(self, batch, batch_idx):
        x, y = batch
        y_hat = self.model(x)
        test_loss = nn.functional.cross_entropy(y_hat, y)
        self.log('test_loss', test_loss)

    def configure_optimizers(self):
        return torch.optim.Adam(self.parameters(), lr=1e-3)

# 使用验证进行训练
trainer = L.Trainer(max_epochs=10)
trainer.fit(model, train_loader, val_loader)

# 测试
trainer.test(model, test_loader)
```

**自动功能**：
- 默认每个 epoch 运行验证
- 指标记录到 TensorBoard
- 基于 val_loss 的最佳模型检查点

### 工作流 3：分布式训练 (DDP)

```python
# 与单 GPU 相同的代码！
model = LitModel()

# 8 个 GPU 使用 DDP（自动！）
trainer = L.Trainer(
    accelerator='gpu',
    devices=8,
    strategy='ddp'  # 或 'fsdp', 'deepspeed'
)

trainer.fit(model, train_loader)
```

**启动**：
```bash
# 单命令，Lightning 处理其余
python train.py
```

**无需更改**：
- 自动数据分发
- 梯度同步
- 多节点支持（只需设置 `num_nodes=2`）

### 工作流 4：使用回调进行监控

```python
from lightning.pytorch.callbacks import ModelCheckpoint, EarlyStopping, LearningRateMonitor

# 创建回调
checkpoint = ModelCheckpoint(
    monitor='val_loss',
    mode='min',
    save_top_k=3,
    filename='model-{epoch:02d}-{val_loss:.2f}'
)

early_stop = EarlyStopping(
    monitor='val_loss',
    patience=5,
    mode='min'
)

lr_monitor = LearningRateMonitor(logging_interval='epoch')

# 添加到 Trainer
trainer = L.Trainer(
    max_epochs=100,
    callbacks=[checkpoint, early_stop, lr_monitor]
)

trainer.fit(model, train_loader, val_loader)
```

**结果**：
- 自动保存最佳的 3 个模型
- 如果 5 个 epoch 无改善则提前停止
- 将学习率记录到 TensorBoard

### 工作流 5：学习率调度

```python
class LitModel(L.LightningModule):
    # ... (training_step 等)

    def configure_optimizers(self):
        optimizer = torch.optim.Adam(self.parameters(), lr=1e-3)

        # 余弦退火
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            optimizer,
            T_max=100,
            eta_min=1e-5
        )

        return {
            'optimizer': optimizer,
            'lr_scheduler': {
                'scheduler': scheduler,
                'interval': 'epoch',  # 每个 epoch 更新
                'frequency': 1
            }
        }

# 学习率自动记录！
trainer = L.Trainer(max_epochs=100)
trainer.fit(model, train_loader)
```

## 何时使用与替代方案对比

**在以下情况使用 PyTorch Lightning**：
- 想要干净、有组织的代码
- 需要生产就绪的训练循环
- 在单 GPU、多 GPU、TPU 之间切换
- 想要内置的回调和日志记录
- 团队协作（标准化结构）

**主要优势**：
- **有组织**：将研究代码与工程代码分离
- **自动**：一行代码实现 DDP, FSDP, DeepSpeed
- **回调**：模块化训练扩展
- **可复现**：更少的样板代码 = 更少的 bug
- **经过测试**：每月 100 万+ 下载，久经考验

**转而使用替代方案**：
- **Accelerate**：对现有代码进行最小更改，灵活性更高
- **Ray Train**：多节点编排，超参数调优
- **原生 PyTorch**：最大控制，用于学习目的
- **Keras**：TensorFlow 生态系统

## 常见问题

**问题：损失不下降**

检查数据和模型设置：
```python
# 添加到 training_step
def training_step(self, batch, batch_idx):
    if batch_idx == 0:
        print(f"Batch shape: {batch[0].shape}")
        print(f"Labels: {batch[1]}")
    loss = ...
    return loss
```

**问题：内存不足**

减小批大小或使用梯度累积：
```python
trainer = L.Trainer(
    accumulate_grad_batches=4,  # 有效批大小 = batch_size × 4
    precision='bf16'  # 或 'fp16'，减少 50% 内存
)
```

**问题：验证未运行**

确保传递了 val_loader：
```python
# 错误
trainer.fit(model, train_loader)

# 正确
trainer.fit(model, train_loader, val_loader)
```

**问题：DDP 意外生成多个进程**

Lightning 自动检测 GPU。显式设置设备：
```python
# 先在 CPU 上测试
trainer = L.Trainer(accelerator='cpu', devices=1)

# 然后在 GPU 上
trainer = L.Trainer(accelerator='gpu', devices=1)
```

## 高级主题

**回调**：有关 EarlyStopping、ModelCheckpoint、自定义回调和回调钩子，请参见 [references/callbacks.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/mlops/pytorch-lightning/references/callbacks.md)。

**分布式策略**：有关 DDP、FSDP、DeepSpeed ZeRO 集成和多节点设置，请参见 [references/distributed.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/mlops/pytorch-lightning/references/distributed.md)。

**超参数调优**：有关与 Optuna、Ray Tune 和 WandB sweeps 的集成，请参见 [references/hyperparameter-tuning.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/mlops/pytorch-lightning/references/hyperparameter-tuning.md)。

## 硬件要求

- **CPU**：可用（适合调试）
- **单 GPU**：可用
- **多 GPU**：DDP（默认）、FSDP 或 DeepSpeed
- **多节点**：DDP、FSDP、DeepSpeed
- **TPU**：支持（8 核心）
- **Apple MPS**：支持

**精度选项**：
- FP32（默认）
- FP16（V100、较旧 GPU）
- BF16（A100/H100，推荐）
- FP8（H100）

## 资源

- 文档：https://lightning.ai/docs/pytorch/stable/
- GitHub：https://github.com/Lightning-AI/pytorch-lightning ⭐ 29,000+
- 版本：2.5.5+
- 示例：https://github.com/Lightning-AI/pytorch-lightning/tree/master/examples
- Discord：https://discord.gg/lightning-ai
- 使用者：Kaggle 获奖者、研究实验室、生产团队
```