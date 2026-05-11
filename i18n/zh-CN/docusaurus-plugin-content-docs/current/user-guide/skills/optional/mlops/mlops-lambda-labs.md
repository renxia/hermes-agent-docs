---
title: "Lambda Labs GPU 云服务 — 用于机器学习训练和推理的预留及按需 GPU 云实例"
sidebar_label: "Lambda Labs GPU 云服务"
description: "用于机器学习训练和推理的预留及按需 GPU 云实例"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Lambda Labs GPU 云服务

提供用于机器学习训练和推理的预留及按需 GPU 云实例。当您需要具有简单 SSH 访问、持久化文件系统或用于大规模训练的高性能多节点集群的专用 GPU 实例时，可使用此服务。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/mlops/lambda-labs` 安装 |
| 路径 | `optional-skills/mlops/lambda-labs` |
| 版本 | `1.0.0` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖项 | `lambda-cloud-client>=1.0.0` |
| 平台 | linux, macos, windows |
| 标签 | `基础设施`, `GPU 云`, `训练`, `推理`, `Lambda Labs` |

:::info
以下是Hermes在触发此技能时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# Lambda Labs GPU云

在Lambda Labs GPU云上使用按需实例和一键集群运行机器学习工作负载的综合指南。

## 何时使用Lambda Labs

**在以下情况下使用Lambda Labs：**
- 需要具有完整SSH访问权限的专用GPU实例
- 运行长时间训练任务（数小时至数天）
- 希望简单定价且无出站费用
- 需要跨会话的持久存储
- 需要高性能多节点集群（16-512个GPU）
- 需要预安装的机器学习栈（包含PyTorch、CUDA、NCCL的Lambda Stack）

**主要特性：**
- **GPU种类**：B200、H100、GH200、A100、A10、A6000、V100
- **Lambda Stack**：预安装PyTorch、TensorFlow、CUDA、cuDNN、NCCL
- **持久文件系统**：实例重启后保留数据
- **一键集群**：具有InfiniBand的16-512个GPU的Slurm集群
- **简单定价**：按分钟计费，无出站费用
- **全球区域**：全球12+个区域

**请改用其他替代方案：**
- **Modal**：适用于无服务器、自动伸缩的工作负载
- **SkyPilot**：适用于多云编排和成本优化
- **RunPod**：适用于更便宜的竞价实例和无服务器端点
- **Vast.ai**：适用于价格最低的GPU市场

## 快速开始

### 账户设置

1. 在 https://lambda.ai 创建账户
2. 添加支付方式
3. 从仪表板生成API密钥
4. 添加SSH密钥（启动实例前必须）

### 通过控制台启动

1. 前往 https://cloud.lambda.ai/instances
2. 点击“启动实例”
3. 选择GPU类型和区域
4. 选择SSH密钥
5. （可选）附加文件系统
6. 启动并等待3-15分钟

### 通过SSH连接

```bash
# 从控制台获取实例IP
ssh ubuntu@<实例-IP>

# 或使用特定密钥
ssh -i ~/.ssh/lambda_key ubuntu@<实例-IP>
```

## GPU实例

### 可用GPU

| GPU | 显存 | 价格/GPU/小时 | 最适用于 |
|-----|------|--------------|----------|
| B200 SXM6 | 180 GB | $4.99 | 最大模型，最快训练 |
| H100 SXM | 80 GB | $2.99-3.29 | 大型模型训练 |
| H100 PCIe | 80 GB | $2.49 | 经济高效的H100 |
| GH200 | 96 GB | $1.49 | 单GPU大模型 |
| A100 80GB | 80 GB | $1.79 | 生产训练 |
| A100 40GB | 40 GB | $1.29 | 标准训练 |
| A10 | 24 GB | $0.75 | 推理，微调 |
| A6000 | 48 GB | $0.80 | 显存/价格比好 |
| V100 | 16 GB | $0.55 | 预算训练 |

### 实例配置

```
8x GPU：最适合分布式训练（DDP、FSDP）
4x GPU：大模型，多GPU训练
2x GPU：中等工作负载
1x GPU：微调、推理、开发
```

### 启动时间

- 单GPU：3-5分钟
- 多GPU：10-15分钟

## Lambda Stack

所有实例都预装了Lambda Stack：

```bash
# 包含的软件
- Ubuntu 22.04 LTS
- NVIDIA驱动（最新版）
- CUDA 12.x
- cuDNN 8.x
- NCCL（用于多GPU）
- PyTorch（最新版）
- TensorFlow（最新版）
- JAX
- JupyterLab
```

### 验证安装

```bash
# 检查GPU
nvidia-smi

# 检查PyTorch
python -c "import torch; print(torch.cuda.is_available())"

# 检查CUDA版本
nvcc --version
```

## Python API

### 安装

```bash
pip install lambda-cloud-client
```

### 认证

```python
import os
import lambda_cloud_client

# 使用API密钥配置
configuration = lambda_cloud_client.Configuration(
    host="https://cloud.lambdalabs.com/api/v1",
    access_token=os.environ["LAMBDA_API_KEY"]
)
```

### 列出可用实例

```python
with lambda_cloud_client.ApiClient(configuration) as api_client:
    api = lambda_cloud_client.DefaultApi(api_client)

    # 获取可用实例类型
    types = api.instance_types()
    for name, info in types.data.items():
        print(f"{name}: {info.instance_type.description}")
```

### 启动实例

```python
from lambda_cloud_client.models import LaunchInstanceRequest

request = LaunchInstanceRequest(
    region_name="us-west-1",
    instance_type_name="gpu_1x_h100_sxm5",
    ssh_key_names=["my-ssh-key"],
    file_system_names=["my-filesystem"],  # 可选
    name="training-job"
)

response = api.launch_instance(request)
instance_id = response.data.instance_ids[0]
print(f"已启动: {instance_id}")
```

### 列出运行中的实例

```python
instances = api.list_instances()
for instance in instances.data:
    print(f"{instance.name}: {instance.ip} ({instance.status})")
```

### 终止实例

```python
from lambda_cloud_client.models import TerminateInstanceRequest

request = TerminateInstanceRequest(
    instance_ids=[instance_id]
)
api.terminate_instance(request)
```

### SSH密钥管理

```python
from lambda_cloud_client.models import AddSshKeyRequest

# 添加SSH密钥
request = AddSshKeyRequest(
    name="my-key",
    public_key="ssh-rsa AAAA..."
)
api.add_ssh_key(request)

# 列出密钥
keys = api.list_ssh_keys()

# 删除密钥
api.delete_ssh_key(key_id)
```

## 使用curl的CLI

### 列出实例类型

```bash
curl -u $LAMBDA_API_KEY: \
  https://cloud.lambdalabs.com/api/v1/instance-types | jq
```

### 启动实例

```bash
curl -u $LAMBDA_API_KEY: \
  -X POST https://cloud.lambdalabs.com/api/v1/instance-operations/launch \
  -H "Content-Type: application/json" \
  -d '{
    "region_name": "us-west-1",
    "instance_type_name": "gpu_1x_h100_sxm5",
    "ssh_key_names": ["my-key"]
  }' | jq
```

### 终止实例

```bash
curl -u $LAMBDA_API_KEY: \
  -X POST https://cloud.lambdalabs.com/api/v1/instance-operations/terminate \
  -H "Content-Type: application/json" \
  -d '{"instance_ids": ["<实例-ID>"]}' | jq
```

## 持久存储

### 文件系统

文件系统在实例重启后保留数据：

```bash
# 挂载位置
/lambda/nfs/<文件系统名称>

# 示例：保存检查点
python train.py --checkpoint-dir /lambda/nfs/my-storage/checkpoints
```

### 创建文件系统

1. 前往Lambda控制台的存储部分
2. 点击“创建文件系统”
3. 选择区域（必须与实例区域匹配）
4. 命名并创建

### 附加到实例

文件系统必须在实例启动时附加：
- 通过控制台：启动时选择文件系统
- 通过API：在启动请求中包含 `file_system_names`

### 最佳实践

<!-- ascii-guard-ignore -->
```bash
# 存储在文件系统上（持久化）
/lambda/nfs/storage/
  ├── datasets/
  ├── checkpoints/
  ├── models/
  └── outputs/

# 本地SSD（更快，临时性）
/home/ubuntu/
  └── working/  # 临时文件
```
<!-- ascii-guard-ignore-end -->

## SSH配置

### 添加SSH密钥

```bash
# 在本地生成密钥
ssh-keygen -t ed25519 -f ~/.ssh/lambda_key

# 将公钥添加到Lambda控制台
# 或通过API
```

### 多个密钥

```bash
# 在实例上，添加更多密钥
echo 'ssh-rsa AAAA...' >> ~/.ssh/authorized_keys
```

### 从GitHub导入

```bash
# 在实例上
ssh-import-id gh:username
```

### SSH隧道

```bash
# 转发Jupyter
ssh -L 8888:localhost:8888 ubuntu@<IP>

# 转发TensorBoard
ssh -L 6006:localhost:6006 ubuntu@<IP>

# 多个端口
ssh -L 8888:localhost:8888 -L 6006:localhost:6006 ubuntu@<IP>
```

## JupyterLab

### 从控制台启动

1. 前往实例页面
2. 在云IDE列点击“启动”
3. JupyterLab在浏览器中打开

### 手动访问

```bash
# 在实例上
jupyter lab --ip=0.0.0.0 --port=8888

# 从本地机器使用隧道
ssh -L 8888:localhost:8888 ubuntu@<IP>
# 打开 http://localhost:8888
```

## 训练工作流

### 单GPU训练

```bash
# SSH到实例
ssh ubuntu@<IP>

# 克隆仓库
git clone https://github.com/user/project
cd project

# 安装依赖
pip install -r requirements.txt

# 训练
python train.py --epochs 100 --checkpoint-dir /lambda/nfs/storage/checkpoints
```

### 多GPU训练（单节点）

```python
# train_ddp.py
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP

def main():
    dist.init_process_group("nccl")
    rank = dist.get_rank()
    device = rank % torch.cuda.device_count()

    model = MyModel().to(device)
    model = DDP(model, device_ids=[device])

    # 训练循环...

if __name__ == "__main__":
    main()
```

```bash
# 使用torchrun启动（8个GPU）
torchrun --nproc_per_node=8 train_ddp.py
```

### 保存检查点到文件系统

```python
import os

checkpoint_dir = "/lambda/nfs/my-storage/checkpoints"
os.makedirs(checkpoint_dir, exist_ok=True)

# 保存检查点
torch.save({
    'epoch': epoch,
    'model_state_dict': model.state_dict(),
    'optimizer_state_dict': optimizer.state_dict(),
    'loss': loss,
}, f"{checkpoint_dir}/checkpoint_{epoch}.pt")
```

## 一键集群

### 概述

高性能Slurm集群，包含：
- 16-512个NVIDIA H100或B200 GPU
- NVIDIA Quantum-2 400 Gb/s InfiniBand
- 3200 Gb/s的GPUDirect RDMA
- 预安装的分布式机器学习栈

### 包含的软件

- Ubuntu 22.04 LTS + Lambda Stack
- NCCL, Open MPI
- 支持DDP和FSDP的PyTorch
- TensorFlow
- OFED驱动程序

### 存储

- 每个计算节点24 TB NVMe（临时性）
- 用于持久数据的Lambda文件系统

### 多节点训练

```bash
# 在Slurm集群上
srun --nodes=4 --ntasks-per-node=8 --gpus-per-node=8 \
  torchrun --nnodes=4 --nproc_per_node=8 \
  --rdzv_backend=c10d --rdzv_endpoint=$MASTER_ADDR:29500 \
  train.py
```

## 网络

### 带宽

- 实例间通信（同区域）：高达 200 Gbps
- 出站互联网：最大 20 Gbps

### 防火墙

- 默认设置：仅开放端口 22 (SSH)
- 在 Lambda 控制台中配置额外端口
- 默认允许 ICMP 流量

### 私有 IP

```bash
# 查找私有 IP
ip addr show | grep 'inet '
```

## 常见工作流程

### 工作流程 1：微调 LLM

```bash
# 1. 启动 8x H100 实例并挂载文件系统

# 2. SSH 连接并设置环境
ssh ubuntu@<IP>
pip install transformers accelerate peft

# 3. 将模型下载到文件系统
python -c "
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained('meta-llama/Llama-2-7b-hf')
model.save_pretrained('/lambda/nfs/storage/models/llama-2-7b')
"

# 4. 使用文件系统上的检查点进行微调
accelerate launch --num_processes 8 train.py \
  --model_path /lambda/nfs/storage/models/llama-2-7b \
  --output_dir /lambda/nfs/storage/outputs \
  --checkpoint_dir /lambda/nfs/storage/checkpoints
```

### 工作流程 2：批量推理

```bash
# 1. 启动 A10 实例（成本效益高的推理选择）

# 2. 运行推理
python inference.py \
  --model /lambda/nfs/storage/models/fine-tuned \
  --input /lambda/nfs/storage/data/inputs.jsonl \
  --output /lambda/nfs/storage/data/outputs.jsonl
```

## 成本优化

### 选择合适的 GPU

| 任务 | 推荐 GPU |
|------|-----------------|
| LLM 微调 (7B) | A100 40GB |
| LLM 微调 (70B) | 8x H100 |
| 推理 | A10, A6000 |
| 开发 | V100, A10 |
| 极致性能 | B200 |

### 降低成本

1. **使用文件系统**：避免重复下载数据
2. **频繁设置检查点**：以便中断后恢复训练
3. **合理配置**：不要过度配置 GPU 资源
4. **终止闲置实例**：无自动停止功能，需手动终止

### 监控使用情况

- 仪表板显示实时 GPU 利用率
- 提供用于编程监控的 API

## 常见问题

| 问题 | 解决方案 |
|-------|----------|
| 实例无法启动 | 检查区域可用性，尝试不同的 GPU |
| SSH 连接被拒绝 | 等待实例初始化（3-15 分钟） |
| 终止后数据丢失 | 使用持久化文件系统 |
| 数据传输缓慢 | 使用同区域的文件系统 |
| 未检测到 GPU | 重启实例，检查驱动程序 |

## 参考资料

- **[高级用法](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/mlops/lambda-labs/references/advanced-usage.md)** - 多节点训练、API 自动化
- **[故障排除](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/mlops/lambda-labs/references/troubleshooting.md)** - 常见问题及解决方案

## 资源

- **文档**: https://docs.lambda.ai
- **控制台**: https://cloud.lambda.ai
- **定价**: https://lambda.ai/instances
- **支持**: https://support.lambdalabs.com
- **博客**: https://lambda.ai/blog