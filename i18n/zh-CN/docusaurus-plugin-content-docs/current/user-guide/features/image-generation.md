---
title: 图像生成
description: 通过 FAL.ai 生成图像 —— 包括 FLUX 2、GPT Image（1.5 与 2）、Nano Banana Pro、Ideogram、Recraft V4 Pro、Krea 2 等共 11 个模型，可通过 `hermes tools` 选择。
sidebar_label: 图像生成
sidebar_position: 6
---

# 图像生成

Hermes 智能体通过 FAL.ai 根据文本提示生成图像。开箱即用支持 11 个模型，每个模型在速度、质量和成本上各有取舍。当前激活的模型可通过 `hermes tools` 进行用户配置，并保存在 `config.yaml` 中。

## 支持的模型

| 模型 | 速度 | 优势 | 价格 |
|---|---|---|---|
| `fal-ai/flux-2/klein/9b` *（默认）* | `<1s` | 快速，文本清晰 | $0.006/百万像素 |
| `fal-ai/flux-2-pro` | ~6s | 工作室级照片真实感 | $0.03/百万像素 |
| `fal-ai/z-image/turbo` | ~2s | 中英双语，60亿参数 | $0.005/百万像素 |
| `fal-ai/nano-banana-pro` | ~8s | Gemini 3 Pro，推理深度，文本渲染 | $0.15/图像（1K） |
| `fal-ai/gpt-image-1.5` | ~15s | 提示词遵循度 | $0.034/图像 |
| `fal-ai/gpt-image-2` | ~20s | 最佳文本渲染 + CJK，具有世界感知的照片真实感 | $0.04–0.06/图像 |
| `fal-ai/ideogram/v3` | ~5s | 最佳排版 | $0.03–0.09/图像 |
| `fal-ai/recraft/v4/pro/text-to-image` | ~8s | 设计，品牌系统，可用于生产 | $0.25/图像 |
| `fal-ai/qwen-image` | ~12s | 基于大语言模型，复杂文本 | $0.02/百万像素 |
| `fal-ai/krea/v2/medium/text-to-image` | ~15-25s | 插图，动漫，绘画，表现力/艺术风格 | $0.030–0.035/图像 |
| `fal-ai/krea/v2/large/text-to-image` | ~25-60s | 照片真实感，原始纹理外观（运动模糊、颗粒、胶片感） | $0.060–0.065/图像 |

价格为撰写时 FAL 的定价；请访问 [fal.ai](https://fal.ai/) 获取最新价格。

## 设置

:::tip Nous 订阅用户
如果您拥有付费的 [Nous Portal](https://portal.nousresearch.com) 订阅，您可以通过 **[工具网关](tool-gateway.md)** 使用图像生成功能，而无需 FAL API 密钥。您的模型选择在两个路径间保持同步。新安装可运行 `hermes setup --portal` 登录并一次性启用所有网关工具；现有安装可通过 `hermes tools` 选择 **Nous 订阅** 作为图像生成后端。

如果托管网关对特定模型返回 `HTTP 4xx`，则该模型尚未在门户端提供代理 —— 智能体会告知您此情况，并提供修复步骤（设置 `FAL_KEY` 进行直接访问，或选择其他模型）。
:::

### 获取 FAL API 密钥

1. 在 [fal.ai](https://fal.ai/) 注册
2. 从您的仪表盘生成一个 API 密钥

### 配置并选择模型

运行工具命令：

```bash
hermes tools
```

导航至 **🎨 图像生成**，选择您的后端（Nous 订阅 或 FAL.ai），然后选择器会以列对齐的表格显示所有支持的模型 —— 使用方向键导航，按 Enter 键选择：

```
  模型                            速度     优势                          价格
  fal-ai/flux-2/klein/9b         <1s      快速，文本清晰                 $0.006/百万像素   ← 当前正在使用
  fal-ai/flux-2-pro              ~6s      工作室级照片真实感              $0.03/百万像素
  fal-ai/z-image/turbo           ~2s      中英双语，60亿                 $0.005/百万像素
  ...
```

您的选择将保存到 `config.yaml`：

```yaml
image_gen:
  model: fal-ai/flux-2/klein/9b
  use_gateway: false            # 如果使用 Nous 订阅则为 true
```

### GPT-Image 质量

`fal-ai/gpt-image-1.5` 和 `fal-ai/gpt-image-2` 的请求质量固定为 `medium`（1024×1024 分辨率下约 $0.034–$0.06/图像）。我们不将 `low` / `high` 层级作为面向用户的选项，以使 Nous Portal 计费在所有用户间保持可预测 —— 各层级间的成本差异为 3–22 倍。如果您需要更经济的选项，可选择 Klein 9B 或 Z-Image Turbo；如果需要更高质量，可使用 Nano Banana Pro 或 Recraft V4 Pro。

## 使用方式

面向智能体的模式故意设计得很简洁 —— 模型会采用您已配置的任何设置：

```
生成一幅宁静山景樱花图
```

```
创建一个智慧老猫头鹰的方形肖像 —— 使用排版模型
```

```
给我生成一幅未来主义城市景观，横向
```

## 宽高比

每个模型从智能体角度接受相同的三种宽高比。在内部，每个模型的原生尺寸规格会自动填充：

| 智能体输入 | image_size（flux/z-image/qwen/recraft/ideogram） | aspect_ratio（nano-banana-pro） | image_size（gpt-image-1.5） | image_size（gpt-image-2） |
|---|---|---|---|---|
| `landscape` | `landscape_16_9` | `16:9` | `1536x1024` | `landscape_4_3` (1024×768) |
| `square` | `square_hd` | `1:1` | `1024x1024` | `square_hd` (1024×1024) |
| `portrait` | `portrait_16_9` | `9:16` | `1024x1536` | `portrait_4_3` (768×1024) |

GPT Image 2 映射到 4:3 预设而非 16:9，因为其最小像素数为 655,360 —— `landscape_16_9` 预设（1024×576 = 589,824）会被拒绝。

此转换在 `_build_fal_payload()` 中完成 —— 智能体代码无需了解每个模型的模式差异。

## 自动放大

通过 FAL 的 **Clarity Upscaler** 进行放大是针对每个模型单独控制的：

| 模型 | 支持放大？ | 原因 |
|---|---|---|
| `fal-ai/flux-2-pro` | ✓ | 向后兼容（曾是选择器出现前的默认模型） |
| 其他所有模型 | ✗ | 快速模型会失去其亚秒级优势；高分辨率模型则无需放大 |

当放大运行时，使用以下设置：

| 设置 | 值 |
|---|---|
| 放大倍数 | 2× |
| 创造性 | 0.35 |
| 相似度 | 0.6 |
| 引导强度 | 4 |
| 推理步骤 | 18 |

如果放大失败（网络问题、速率限制），将自动返回原始图像。

## 内部工作原理

1. **模型解析** —— `_resolve_fal_model()` 从 `config.yaml` 读取 `image_gen.model`，然后回退到环境变量 `FAL_IMAGE_MODEL`，最后回退到 `fal-ai/flux-2/klein/9b`。
2. **构建请求体** —— `_build_fal_payload()` 将您的 `aspect_ratio` 转换为模型的原生格式（预设枚举、宽高比枚举或 GPT 字面量），合并模型的默认参数，应用任何调用方的覆盖项，然后根据模型的 `supports` 白名单进行过滤，以确保不支持的键永远不会被发送。
3. **提交请求** —— `_submit_fal_request()` 通过直接 FAL 凭证或托管的 Nous 网关进行路由。
4. **放大处理** —— 仅当模型元数据中包含 `upscale: True` 时运行。
5. **交付结果** —— 最终的图像 URL 返回给智能体，智能体发出 `MEDIA:<url>` 标签，平台适配器将其转换为原生媒体格式。

## 调试

启用调试日志：

```bash
export IMAGE_TOOLS_DEBUG=true
```

调试日志将输出到 `./logs/image_tools_debug_<session_id>.json`，包含每次调用的详细信息（模型、参数、耗时、错误）。

## 平台交付

| 平台 | 交付方式 |
|---|---|
| **CLI** | 图像 URL 以 Markdown `![](url)` 形式打印 —— 点击打开 |
| **Telegram** | 附带提示词作为说明的照片消息 |
| **Discord** | 嵌入在消息中 |
| **Slack** | 由 Slack 自动展开 URL |
| **WhatsApp** | 媒体消息 |
| **其他** | 纯文本中的 URL |

## 限制

- **需要 FAL 凭证**（直接 `FAL_KEY` 或 Nous 订阅）
- **仅限文本生成图像** —— 不支持通过此工具进行修复、图像到图像转换或编辑
- **临时 URL** —— FAL 返回的托管 URL 会在数小时/数天后过期；如需保存，请下载到本地
- **每模型限制** —— 部分模型不支持 `seed`、`num_inference_steps` 等参数。`supports` 过滤器会静默丢弃不支持的参数；这是预期行为。