---
title: "Stable Diffusion 图像生成"
sidebar_label: "Stable Diffusion 图像生成"
description: "通过 HuggingFace Diffusers 使用 Stable Diffusion 模型进行最先进的文生图生成"
---

{/* 本页面由网站脚本 generate-skill-docs.py 从技能文件 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非本页面。 */}

# Stable Diffusion 图像生成

通过 HuggingFace Diffusers 使用 Stable Diffusion 模型进行最先进的文生图生成。适用于根据文本提示生成图像、执行图像到图像的转换、修复图像或构建自定义扩散管道。

## 技能元数据

| | |
|---|---|
| 源码 | 可选 — 使用 `hermes skills install official/mlops/stable-diffusion` 安装 |
| 路径 | `optional-skills/mlops/stable-diffusion` |
| 版本 | `1.0.0` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖项 | `diffusers>=0.30.0`, `transformers>=4.41.0`, `accelerate>=0.31.0`, `torch>=2.0.0` |
| 平台 | linux, macos, windows |
| 标签 | `图像生成`, `Stable Diffusion`, `Diffusers`, `文生图`, `多模态`, `计算机视觉` |

:::info
以下是 Hermes 在此技能触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 稳定扩散图像生成

使用 HuggingFace Diffusers 库通过稳定扩散生成图像的综合指南。

## 何时使用稳定扩散

**在以下情况下使用稳定扩散：**
- 根据文本描述生成图像
- 执行图像到图像的转换（风格迁移、增强）
- 修复（填充遮罩区域）
- 扩展（将图像扩展到边界之外）
- 创建现有图像的变体
- 构建自定义图像生成工作流

**主要特性：**
- **文本到图像**：根据自然语言提示生成图像
- **图像到图像**：在文本指导下转换现有图像
- **修复**：用上下文感知的内容填充遮罩区域
- **ControlNet**：添加空间条件（边缘、姿势、深度）
- **LoRA 支持**：高效的微调和风格适配
- **多模型支持**：支持 SD 1.5、SDXL、SD 3.0、Flux

**可替代方案：**
- **DALL-E 3**：用于无需 GPU 的基于 API 的生成
- **Midjourney**：用于艺术性、风格化的输出
- **Imagen**：用于 Google Cloud 集成
- **Leonardo.ai**：用于基于 Web 的创意工作流

## 快速开始

### 安装

```bash
pip install diffusers transformers accelerate torch
pip install xformers  # 可选：内存高效注意力机制
```

### 基本文本到图像

```python
from diffusers import DiffusionPipeline
import torch

# 加载管线（自动检测模型类型）
pipe = DiffusionPipeline.from_pretrained(
    "stable-diffusion-v1-5/stable-diffusion-v1-5",
    torch_dtype=torch.float16
)
pipe.to("cuda")

# 生成图像
image = pipe(
    "A serene mountain landscape at sunset, highly detailed",
    num_inference_steps=50,
    guidance_scale=7.5
).images[0]

image.save("output.png")
```

### 使用 SDXL（更高质量）

```python
from diffusers import AutoPipelineForText2Image
import torch

pipe = AutoPipelineForText2Image.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0",
    torch_dtype=torch.float16,
    variant="fp16"
)
pipe.to("cuda")

# 启用内存优化
pipe.enable_model_cpu_offload()

image = pipe(
    prompt="A futuristic city with flying cars, cinematic lighting",
    height=1024,
    width=1024,
    num_inference_steps=30
).images[0]
```

## 架构概览

### 三支柱设计

Diffusers 围绕三个核心组件构建：

<!-- ascii-guard-ignore -->
```
管线（编排）
├── 模型（神经网络）
│   ├── UNet / Transformer（噪声预测）
│   ├── VAE（潜空间编码/解码）
│   └── 文本编码器（CLIP/T5）
└── 调度器（去噪算法）
```
<!-- ascii-guard-ignore-end -->

### 管线推理流程

```
文本提示 → 文本编码器 → 文本嵌入
                                    ↓
随机噪声 → [去噪循环] ← 调度器
                      ↓
               预测噪声
                      ↓
              VAE 解码器 → 最终图像
```

## 核心概念

### 管线

管线编排完整的工作流：

| 管线 | 用途 |
|----------|---------|
| `StableDiffusionPipeline` | 文本到图像（SD 1.x/2.x） |
| `StableDiffusionXLPipeline` | 文本到图像（SDXL） |
| `StableDiffusion3Pipeline` | 文本到图像（SD 3.0） |
| `FluxPipeline` | 文本到图像（Flux 模型） |
| `StableDiffusionImg2ImgPipeline` | 图像到图像 |
| `StableDiffusionInpaintPipeline` | 修复 |

### 调度器

调度器控制去噪过程：

| 调度器 | 步骤数 | 质量 | 使用场景 |
|-----------|-------|---------|----------|
| `EulerDiscreteScheduler` | 20-50 | 良好 | 默认选择 |
| `EulerAncestralDiscreteScheduler` | 20-50 | 良好 | 更多变化 |
| `DPMSolverMultistepScheduler` | 15-25 | 优秀 | 快速，高质量 |
| `DDIMScheduler` | 50-100 | 良好 | 确定性 |
| `LCMScheduler` | 4-8 | 良好 | 非常快 |
| `UniPCMultistepScheduler` | 15-25 | 优秀 | 快速收敛 |

### 交换调度器

```python
from diffusers import DPMSolverMultistepScheduler

# 交换以加快生成速度
pipe.scheduler = DPMSolverMultistepScheduler.from_config(
    pipe.scheduler.config
)

# 现在使用更少的步骤生成
image = pipe(prompt, num_inference_steps=20).images[0]
```

## 生成参数

### 关键参数

| 参数 | 默认值 | 描述 |
|-----------|---------|-------------|
| `prompt` | 必需 | 期望图像的文本描述 |
| `negative_prompt` | 无 | 图像中要避免的内容 |
| `num_inference_steps` | 50 | 去噪步骤（越多 = 质量越好） |
| `guidance_scale` | 7.5 | 提示词遵循度（典型值 7-12） |
| `height`, `width` | 512/1024 | 输出尺寸（8 的倍数） |
| `generator` | 无 | 用于可重复性的 Torch 生成器 |
| `num_images_per_prompt` | 1 | 批次大小 |

### 可重复生成

```python
import torch

generator = torch.Generator(device="cuda").manual_seed(42)

image = pipe(
    prompt="A cat wearing a top hat",
    generator=generator,
    num_inference_steps=50
).images[0]
```

### 负面提示

```python
image = pipe(
    prompt="Professional photo of a dog in a garden",
    negative_prompt="blurry, low quality, distorted, ugly, bad anatomy",
    guidance_scale=7.5
).images[0]
```

## 图像到图像

在文本指导下转换现有图像：

```python
from diffusers import AutoPipelineForImage2Image
from PIL import Image

pipe = AutoPipelineForImage2Image.from_pretrained(
    "stable-diffusion-v1-5/stable-diffusion-v1-5",
    torch_dtype=torch.float16
).to("cuda")

init_image = Image.open("input.jpg").resize((512, 512))

image = pipe(
    prompt="A watercolor painting of the scene",
    image=init_image,
    strength=0.75,  # 转换程度（0-1）
    num_inference_steps=50
).images[0]
```

## 修复

填充遮罩区域：

```python
from diffusers import AutoPipelineForInpainting
from PIL import Image

pipe = AutoPipelineForInpainting.from_pretrained(
    "runwayml/stable-diffusion-inpainting",
    torch_dtype=torch.float16
).to("cuda")

image = Image.open("photo.jpg")
mask = Image.open("mask.png")  # 白色 = 修复区域

result = pipe(
    prompt="A red car parked on the street",
    image=image,
    mask_image=mask,
    num_inference_steps=50
).images[0]
```

## ControlNet

添加空间条件以实现精确控制：

```python
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel
import torch

# 加载用于边缘条件的 ControlNet
controlnet = ControlNetModel.from_pretrained(
    "lllyasviel/control_v11p_sd15_canny",
    torch_dtype=torch.float16
)

pipe = StableDiffusionControlNetPipeline.from_pretrained(
    "stable-diffusion-v1-5/stable-diffusion-v1-5",
    controlnet=controlnet,
    torch_dtype=torch.float16
).to("cuda")

# 使用 Canny 边缘图像作为控制
control_image = get_canny_image(input_image)

image = pipe(
    prompt="A beautiful house in the style of Van Gogh",
    image=control_image,
    num_inference_steps=30
).images[0]
```

### 可用的 ControlNet

| ControlNet | 输入类型 | 使用场景 |
|------------|------------|----------|
| `canny` | 边缘图 | 保留结构 |
| `openpose` | 姿势骨架 | 人体姿势 |
| `depth` | 深度图 | 3D 感知生成 |
| `normal` | 法线图 | 表面细节 |
| `mlsd` | 线段 | 建筑线条 |
| `scribble` | 粗略草图 | 草图到图像 |

## LoRA 适配器

加载微调过的风格适配器：

```python
from diffusers import DiffusionPipeline

pipe = DiffusionPipeline.from_pretrained(
    "stable-diffusion-v1-5/stable-diffusion-v1-5",
    torch_dtype=torch.float16
).to("cuda")

# 加载 LoRA 权重
pipe.load_lora_weights("path/to/lora", weight_name="style.safetensors")

# 使用 LoRA 风格生成
image = pipe("A portrait in the trained style").images[0]

# 调整 LoRA 强度
pipe.fuse_lora(lora_scale=0.8)

# 卸载 LoRA
pipe.unload_lora_weights()
```

### 多个 LoRA

```python
# 加载多个 LoRA
pipe.load_lora_weights("lora1", adapter_name="style")
pipe.load_lora_weights("lora2", adapter_name="character")

# 为每个设置权重
pipe.set_adapters(["style", "character"], adapter_weights=[0.7, 0.5])

image = pipe("A portrait").images[0]
```

## 内存优化

### 启用 CPU 卸载

```python
# 模型 CPU 卸载 - 在不使用时将模型移至 CPU
pipe.enable_model_cpu_offload()

# 顺序 CPU 卸载 - 更激进，速度较慢
pipe.enable_sequential_cpu_offload()
```

### 注意力切片

```python
# 通过分块计算注意力来减少内存
pipe.enable_attention_slicing()

# 或指定块大小
pipe.enable_attention_slicing("max")
```

### xFormers 内存高效注意力

```python
# 需要 xformers 包
pipe.enable_xformers_memory_efficient_attention()
```

### 大图像的 VAE 切片

```python
# 对于大图像，分块解码潜变量
pipe.enable_vae_slicing()
pipe.enable_vae_tiling()
```

## 模型变体

### 加载不同精度

```python
# FP16（GPU推荐）
pipe = DiffusionPipeline.from_pretrained(
    "model-id",
    torch_dtype=torch.float16,
    variant="fp16"
)

# BF16（更好的精度，需要Ampere+ GPU）
pipe = DiffusionPipeline.from_pretrained(
    "model-id",
    torch_dtype=torch.bfloat16
)
```

### 加载特定组件

```python
from diffusers import UNet2DConditionModel, AutoencoderKL

# 加载自定义VAE
vae = AutoencoderKL.from_pretrained("stabilityai/sd-vae-ft-mse")

# 在管道中使用
pipe = DiffusionPipeline.from_pretrained(
    "stable-diffusion-v1-5/stable-diffusion-v1-5",
    vae=vae,
    torch_dtype=torch.float16
)
```

## 批量生成

高效生成多张图像：

```python
# 多个提示词
prompts = [
    "A cat playing piano",
    "A dog reading a book",
    "A bird painting a picture"
]

images = pipe(prompts, num_inference_steps=30).images

# 每个提示词生成多张图像
images = pipe(
    "A beautiful sunset",
    num_images_per_prompt=4,
    num_inference_steps=30
).images
```

## 常见工作流

### 工作流 1：高质量生成

```python
from diffusers import StableDiffusionXLPipeline, DPMSolverMultistepScheduler
import torch

# 1. 加载带有优化的SDXL
pipe = StableDiffusionXLPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0",
    torch_dtype=torch.float16,
    variant="fp16"
)
pipe.to("cuda")
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
pipe.enable_model_cpu_offload()

# 2. 使用质量设置生成
image = pipe(
    prompt="A majestic lion in the savanna, golden hour lighting, 8k, detailed fur",
    negative_prompt="blurry, low quality, cartoon, anime, sketch",
    num_inference_steps=30,
    guidance_scale=7.5,
    height=1024,
    width=1024
).images[0]
```

### 工作流 2：快速原型开发

```python
from diffusers import AutoPipelineForText2Image, LCMScheduler
import torch

# 使用LCM进行4-8步生成
pipe = AutoPipelineForText2Image.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0",
    torch_dtype=torch.float16
).to("cuda")

# 加载LCM LoRA以实现快速生成
pipe.load_lora_weights("latent-consistency/lcm-lora-sdxl")
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
pipe.fuse_lora()

# 在约1秒内生成
image = pipe(
    "A beautiful landscape",
    num_inference_steps=4,
    guidance_scale=1.0
).images[0]
```

## 常见问题

**CUDA内存不足：**
```python
# 启用内存优化
pipe.enable_model_cpu_offload()
pipe.enable_attention_slicing()
pipe.enable_vae_slicing()

# 或者使用更低精度
pipe = DiffusionPipeline.from_pretrained(model_id, torch_dtype=torch.float16)
```

**黑色/噪点图像：**
```python
# 检查VAE配置
# 如有需要，可绕过安全检查器
pipe.safety_checker = None

# 确保dtype一致性
pipe = pipe.to(dtype=torch.float16)
```

**生成速度慢：**
```python
# 使用更快的调度器
from diffusers import DPMSolverMultistepScheduler
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)

# 减少步骤
image = pipe(prompt, num_inference_steps=20).images[0]
```

## 参考

- **[高级用法](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/mlops/stable-diffusion/references/advanced-usage.md)** - 自定义管道、微调、部署
- **[故障排除](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/mlops/stable-diffusion/references/troubleshooting.md)** - 常见问题与解决方案

## 资源

- **文档**: https://huggingface.co/docs/diffusers
- **代码仓库**: https://github.com/huggingface/diffusers
- **模型中心**: https://huggingface.co/models?library=diffusers
- **Discord**: https://discord.gg/diffusers