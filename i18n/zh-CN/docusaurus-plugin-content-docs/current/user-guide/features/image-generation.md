---
title: Image Generation
description: Generate images via FAL.ai — 11 models including FLUX 2, GPT Image (1.5 & 2), Nano Banana Pro, Ideogram, Recraft V4 Pro, Krea 2, and more, selectable via `hermes tools`.
sidebar_label: Image Generation
sidebar_position: 6
---

# Image Generation

Hermes 智能体通过 FAL.ai 从文本提示词生成图像。开箱即用支持 11 个模型，每个模型在速度、质量和成本方面各有取舍。当前活动模型可通过 `hermes tools` 由用户自行配置，并持久化保存在 `config.yaml` 中。

## 支持的模型

| 模型 | 速度 | 优势 | 价格 |
|---|---|---|---|
| `fal-ai/flux-2/klein/9b` *(默认)* | `<1s` | 快速，文字清晰 | $0.006/MP |
| `fal-ai/flux-2-pro` | ~6s | 影棚级照片写实 | $0.03/MP |
| `fal-ai/z-image/turbo` | ~2s | 中英双语，6B 参数 | $0.005/MP |
| `fal-ai/nano-banana-pro` | ~8s | Gemini 3 Pro，推理深度，文字渲染 | $0.15/image (1K) |
| `fal-ai/gpt-image-1.5` | ~15s | 提示词遵循度 | $0.034/image |
| `fal-ai/gpt-image-2` | ~20s | SOTA 文字渲染 + CJK，世界感知的照片写实 | $0.04–0.06/image |
| `fal-ai/ideogram/v3` | ~5s | 最佳排版 | $0.03–0.09/image |
| `fal-ai/recraft/v4/pro/text-to-image` | ~8s | 设计，品牌系统，生产级品质 | $0.25/image |
| `fal-ai/qwen-image` | ~12s | 基于 LLM，复杂文字 | $0.02/MP |
| `fal-ai/krea/v2/medium/text-to-image` | ~15-25s | 插画，动漫，绘画，表现力/艺术风格 | $0.030–0.035/image |
| `fal-ai/krea/v2/large/text-to-image` | ~25-60s | 照片写实，原始纹理外观（动态模糊，颗粒感，胶片感） | $0.060–0.065/image |

价格为 FAL 截至撰写时的定价；请访问 [fal.ai](https://fal.ai/) 查看最新价格。

## 设置

:::tip Nous 订阅用户
如果您已付费订阅 [Nous Portal](https://portal.nousresearch.com)，您可以通过 **[工具网关](tool-gateway.md)** 使用图像生成功能，无需 FAL API 密钥。您的模型选择在两种路径之间持久保存。新安装可以通过运行 `hermes setup --portal` 登录并一次性开启所有网关工具；现有安装可以通过 `hermes tools` 将 **Nous 订阅** 选择为图像生成后端。

如果托管网关对特定模型返回 `HTTP 4xx` 错误，则表示该模型尚未在门户端做代理——智能体会告知您，并提供修复步骤（设置 `FAL_KEY` 以直接访问，或选择其他模型）。
:::

### 获取 FAL API 密钥

1. 在 [fal.ai](https://fal.ai/) 注册账号
2. 从您的仪表板生成 API 密钥

### 配置并选择模型

运行工具命令：

```bash
hermes tools
```

导航至 **🎨 图像生成**，选择您的后端（Nous 订阅或 FAL.ai），然后选择器会以列对齐的表格展示所有支持的模型——使用方向键导航，回车键选择：

```
  Model                          Speed    Strengths                    Price
  fal-ai/flux-2/klein/9b         <1s      Fast, crisp text             $0.006/MP   ← 当前使用中
  fal-ai/flux-2-pro              ~6s      Studio photorealism          $0.03/MP
  fal-ai/z-image/turbo           ~2s      Bilingual EN/CN, 6B          $0.005/MP
  ...
```

您的选择会保存到 `config.yaml`：

```yaml
image_gen:
  model: fal-ai/flux-2/klein/9b
  use_gateway: false            # 如使用 Nous 订阅则为 true
```

### GPT-Image 质量

`fal-ai/gpt-image-1.5` 和 `fal-ai/gpt-image-2` 的请求质量固定为 `medium`（1024×1024 约 $0.034–$0.06/张）。我们未将 `low` / `high` 层级暴露为用户可选项，以确保 Nous Portal 的计费在所有用户之间可预测——各层级之间的成本差异为 3–22 倍。如果您想要更便宜的选择，请选择 Klein 9B 或 Z-Image Turbo；如果您想要更高质量的图片，请使用 Nano Banana Pro 或 Recraft V4 Pro。

## 用法

面向智能体的 schema 被刻意精简——智能体会自动采用您已配置的任何模型：

```
生成一张樱花盛开的宁静山景图
```

```
创建一张方形肖像，画一只智慧的猫头鹰——使用排版模型
```

```
为我制作一幅未来城市景观，横向构图
```

## 图生图 / 编辑

同一个 `image_generate` 工具在活动模型支持的情况下也可以**编辑已有图像**——传入源图像，后端会自动路由到其编辑端点（类似于 `video_generate` 处理视频生成的方式）。省略源图像则为纯文本生图。

```
把这张照片变成雨夜的东京街道 → <image>
```

```
将这两张产品图融合成一张主图 → <image1> <image2>
```

编辑由两个输入驱动：

- **`image_url`**——要编辑/转换的主要源图像（公开 URL 或本地路径）。
- **`reference_image_urls`**——额外的风格/构图参考图像（每个模型有上限）。

### 哪些后端支持编辑

| 后端 | 图生图 | 参考图像上限 | 方式 |
|---|---|---|---|
| **FAL.ai**（下方支持编辑的模型） | ✓ | 最多 9 张 | 路由到模型的 `/edit` 端点 |
| **OpenAI**（`gpt-image-2`） | ✓ | 最多 16 张 | `images.edit()` |
| **xAI**（Grok Imagine） | ✓ | 1 张 | `/v1/images/edits`（`grok-imagine-image-quality`） |
| **Krea**（`Krea 2`） | ✓ | 最多 10 张 | 参考引导生成（`image_style_references`） |
| **OpenAI（Codex 认证）** | ✗ | — | 仅文本生图 |

具有编辑端点的 FAL 模型：`flux-2/klein/9b`、`flux-2-pro`、`nano-banana-pro`、`gpt-image-1.5`、`gpt-image-2`、`ideogram/v3` 和 `qwen-image`。纯文本生图 FAL 模型（`z-image/turbo`、`recraft`、`krea/*`）会拒绝图像输入，并返回明确的错误提示，引导您使用支持编辑的模型。

活动模型的编辑能力会在运行时展示在工具描述中，因此智能体在调用工具之前就知道 `image_url` 是否会被接受。

## 宽高比

从智能体的角度来看，每个模型都接受相同的三个宽高比。在内部，每个模型的原生尺寸规格会自动填充：

| 智能体输入 | image_size（flux/z-image/qwen/recraft/ideogram） | aspect_ratio（nano-banana-pro） | image_size（gpt-image-1.5） | image_size（gpt-image-2） |
|---|---|---|---|---|
| `landscape` | `landscape_16_9` | `16:9` | `1536x1024` | `landscape_4_3`（1024×768） |
| `square` | `square_hd` | `1:1` | `1024x1024` | `square_hd`（1024×1024） |
| `portrait` | `portrait_16_9` | `9:16` | `1024x1536` | `portrait_4_3`（768×1024） |

GPT Image 2 映射到 4:3 预设而非 16:9，因为其最低像素要求为 655,360——`landscape_16_9` 预设（1024×576 = 589,824）会被拒绝。

此转换发生在 `_build_fal_payload()` 中——智能体代码无需了解各模型 schema 的差异。

## 自动放大

通过 FAL 的 **Clarity Upscaler** 进行放大，按模型逐一控制：

| 模型 | 是否放大？ | 原因 |
|---|---|---|
| `fal-ai/flux-2-pro` | ✓ | 向后兼容（之前是选择器默认值） |
| 其他所有模型 | ✗ | 快速模型会失去其亚秒级的价值主张；高分辨率模型不需要 |

放大运行时使用以下设置：

| 设置 | 值 |
|---|---|
| 放大倍数 | 2× |
| 创意度 | 0.35 |
| 相似度 | 0.6 |
| 引导强度 | 4 |
| 推理步数 | 18 |

如果放大失败（网络问题、速率限制），会自动返回原始图像。

## 内部工作原理

1. **模型解析**——`_resolve_fal_model()` 从 `config.yaml` 读取 `image_gen.model`，回退到 `FAL_IMAGE_MODEL` 环境变量，再回退到 `fal-ai/flux-2/klein/9b`。
2. **载荷构建**——`_build_fal_payload()` 将您的 `aspect_ratio` 转换为模型的原生格式（预设枚举、宽高比枚举或 GPT 字面量），合并模型的默认参数，应用调用方的任何覆盖，然后过滤到模型的 `supports` 白名单，确保永远不会发送不支持的键。
3. **提交**——`_submit_fal_request()` 通过直接 FAL 凭证或托管的 Nous 网关进行路由。
4. **放大**——仅在模型元数据设置了 `upscale: True` 时运行。
5. **交付**——最终图像 URL 返回给智能体，智能体发出 `MEDIA:<url>` 标签，平台适配器将其转换为原生媒体。

## 调试

启用调试日志：

```bash
export IMAGE_TOOLS_DEBUG=true
```

调试日志写入 `./logs/image_tools_debug_<session_id>.json`，包含每次调用的详细信息（模型、参数、计时、错误）。

## 平台交付

| 平台 | 交付方式 |
|---|---|
| **CLI** | 图像 URL 以 markdown `![](url)` 形式打印——点击打开 |
| **Telegram** | 以提示词为说明文字的图片消息 |
| **Discord** | 嵌入在消息中 |
| **Slack** | Slack 自动展开 URL |
| **WhatsApp** | 媒体消息 |
| **其他** | 纯文本 URL |

## 限制

- **需要凭证**——活动后端需要凭证（FAL `FAL_KEY` / Nous 订阅、`OPENAI_API_KEY`、xAI OAuth、`KREA_API_KEY`）
- **编辑功能取决于模型**——图生图仅在支持编辑的模型上可用（见上方表格）；纯文本生图模型会拒绝图像输入并返回明确错误
- **临时 URL**——后端返回的托管 URL 会在数小时/数天后过期；Hermes 会将它们本地化到缓存中，确保过期后仍可正常交付
- **各模型约束**——某些模型不支持 `seed`、`num_inference_steps` 等参数。`supports` / `edit_supports` 过滤器会静默丢弃不支持的参数；这是预期行为