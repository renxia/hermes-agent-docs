---
title: 图像生成
description: 通过 FAL.ai 生成图像 — 支持 9 个模型，包括 FLUX 2、GPT Image（1.5 和 2）、Nano Banana Pro、Ideogram、Recraft V4 Pro 等，可通过 `hermes tools` 选择。
sidebar_label: 图像生成
sidebar_position: 6
---

# 图像生成

Hermes 智能体通过 FAL.ai 根据文本提示生成图像。默认支持九个模型，每个模型在速度、质量和成本方面各有权衡。用户可通过 `hermes tools` 配置当前使用的模型，该配置会持久化保存在 `config.yaml` 中。

## 支持的模型

| 模型 | 速度 | 优势 | 价格 |
|---|---|---|---|
| `fal-ai/flux-2/klein/9b` *（默认）* | `<1秒` | 快速、文字清晰 | $0.006/百万像素 |
| `fal-ai/flux-2-pro` | ~6秒 | 工作室级照片真实感 | $0.03/百万像素 |
| `fal-ai/z-image/turbo` | ~2秒 | 中英文双语，60亿参数 | $0.005/百万像素 |
| `fal-ai/nano-banana-pro` | ~8秒 | Gemini 3 Pro，推理深度强，文字渲染佳 | $0.15/张（1K） |
| `fal-ai/gpt-image-1.5` | ~15秒 | 提示词贴合度高 | $0.034/张 |
| `fal-ai/gpt-image-2` | ~20秒 | 最先进的文字渲染 + 中日韩支持，具有世界感知能力的照片真实感 | $0.04–0.06/张 |
| `fal-ai/ideogram/v3` | ~5秒 | 最佳排版效果 | $0.03–0.09/张 |
| `fal-ai/recraft/v4/pro/text-to-image` | ~8秒 | 设计、品牌系统、生产就绪 | $0.25/张 |
| `fal-ai/qwen-image` | ~12秒 | 基于大语言模型，复杂文本处理能力强 | $0.02/百万像素 |

价格为撰写时的 FAL 定价；最新价格请查看 [fal.ai](https://fal.ai/)。

## 设置

:::tip Nous 订阅用户
如果您拥有付费的 [Nous Portal](https://portal.nousresearch.com) 订阅，则可通过 **[工具网关](tool-gateway.md)** 使用图像生成功能，而无需 FAL API 密钥。您的模型选择在这两种路径下均会保持一致。

如果托管网关对某个特定模型返回 `HTTP 4xx` 错误，则表示该模型尚未在门户端被代理 — 智能体会告知您此情况，并提供修复步骤（设置 `FAL_KEY` 以直接访问，或选择其他模型）。
::>

### 获取 FAL API 密钥

1. 在 [fal.ai](https://fal.ai/) 注册账号
2. 从您的仪表板生成 API 密钥

### 配置并选择模型

运行工具命令：

```bash
hermes tools
```

导航至 **🎨 图像生成**，选择您的后端（Nous 订阅或 FAL.ai），然后选择器将以列对齐的表格形式显示所有支持的模型 — 使用方向键导航，Enter 键确认选择：

```
  模型                          速度      优势                          价格
  fal-ai/flux-2/klein/9b         <1秒     快速、文字清晰               $0.006/百万像素   ← 当前正在使用
  fal-ai/flux-2-pro              ~6秒     工作室级照片真实感           $0.03/百万像素
  fal-ai/z-image/turbo           ~2秒     中英文双语，60亿参数         $0.005/百万像素
  ...
```

您的选择将保存到 `config.yaml`：

```yaml
image_gen:
  model: fal-ai/flux-2/klein/9b
  use_gateway: false            # 如果使用 Nous 订阅，则为 true
```

### GPT-Image 质量

`fal-ai/gpt-image-1.5` 和 `fal-ai/gpt-image-2` 请求的质量固定为 `medium`（1024×1024 分辨率下约为 $0.034–$0.06/张）。我们未将 `low` / `high` 层级暴露为用户选项，以确保 Nous Portal 对所有用户的计费保持可预测性 — 不同层级间的成本差异高达 3–22 倍。如果您需要更便宜的选项，请选择 Klein 9B 或 Z-Image Turbo；如果您需要更高质量，请使用 Nano Banana Pro 或 Recraft V4 Pro。

## 使用方法

面向智能体的模式 intentionally 保持极简 — 模型会自动采用您已配置的内容：

```
生成一幅宁静的山景图，背景有樱花
```

```
创建一个智慧老猫头鹰的方形肖像 — 使用排版模型
```

```
为我制作一幅未来主义城市景观图，横向构图
```

## 宽高比

从智能体的角度来看，每个模型都接受相同的三种宽高比。内部会自动填充每个模型原生的尺寸规格：

| 智能体输入 | image_size (flux/z-image/qwen/recraft/ideogram) | aspect_ratio (nano-banana-pro) | image_size (gpt-image-1.5) | image_size (gpt-image-2) |
|---|---|---|---|---|
| `landscape` | `landscape_16_9` | `16:9` | `1536x1024` | `landscape_4_3` (1024×768) |
| `square` | `square_hd` | `1:1` | `1024x1024` | `square_hd` (1024×1024) |
| `portrait` | `portrait_16_9` | `9:16` | `1024x1536` | `portrait_4_3` (768×1024) |

GPT Image 2 映射到 4:3 预设而非 16:9，因为其最低像素要求为 655,360 — `landscape_16_9` 预设（1024×576 = 589,824）会被拒绝。

此转换在 `_build_fal_payload()` 中完成 — 智能体代码无需了解各模型模式差异。

## 自动放大

通过 FAL 的 **Clarity Upscaler** 进行放大功能按模型进行控制：

| 模型 | 是否支持放大 | 原因 |
|---|---|---|
| `fal-ai/flux-2-pro` | ✓ | 向后兼容（曾是选择器之前的默认模型） |
| 其他所有模型 | ✗ | 快速模型会失去其亚秒级价值主张；高分辨率模型无需此功能 |

当执行放大时，使用以下设置：

| 设置 | 值 |
|---|---|
| 放大倍数 | 2× |
| 创意度 | 0.35 |
| 相似度 | 0.6 |
| 引导比例 | 4 |
| 推理步数 | 18 |

如果放大失败（网络问题、速率限制），将自动返回原始图像。

## 内部工作原理

1. **模型解析** — `_resolve_fal_model()` 从 `config.yaml` 读取 `image_gen.model`，若未设置则回退到 `FAL_IMAGE_MODEL` 环境变量，最后默认为 `fal-ai/flux-2/klein/9b`。
2. **载荷构建** — `_build_fal_payload()` 将您的 `aspect_ratio` 转换为模型原生的格式（预设枚举、宽高比枚举或 GPT 字面量），合并模型的默认参数，应用调用者的任何覆盖，然后根据模型的 `supports` 白名单过滤，确保从不发送不支持的键。
3. **提交** — `_submit_fal_request()` 通过直接 FAL 凭据或托管的 Nous 网关进行路由。
4. **放大** — 仅在模型的元数据中包含 `upscale: True` 时运行。
5. **交付** — 最终图像 URL 返回给智能体，智能体发出一个 `MEDIA:<url>` 标签，平台适配器将其转换为本机媒体。

## 调试

启用调试日志：

```bash
export IMAGE_TOOLS_DEBUG=true
```

调试日志将写入 `./logs/image_tools_debug_<session_id>.json`，包含每次调用的详细信息（模型、参数、耗时、错误）。

## 平台交付

| 平台 | 交付方式 |
|---|---|
| **CLI** | 以 Markdown 格式 `![](url)` 打印图像 URL — 点击即可打开 |
| **Telegram** | 带提示词作为说明的照片消息 |
| **Discord** | 嵌入消息中 |
| **Slack** | 由 Slack 自动展开 URL |
| **WhatsApp** | 媒体消息 |
| **其他** | 纯文本中的 URL |

## 限制

- **需要 FAL 凭据**（直接 `FAL_KEY` 或 Nous 订阅）
- **仅支持文生图** — 此工具不支持图像修复、图生图或编辑
- **临时 URL** — FAL 返回托管的 URL，数小时/数天后会过期；如需长期使用请本地保存
- **按模型约束** — 某些模型不支持 `seed`、`num_inference_steps` 等参数。`supports` 过滤器会静默丢弃不支持的参数；此为预期行为