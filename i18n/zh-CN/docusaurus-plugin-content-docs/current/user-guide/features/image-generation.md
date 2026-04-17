---
title: 图像生成
description: 通过 FAL.ai 生成图像 — 包括 FLUX 2、GPT-Image、Nano Banana Pro、Ideogram、Recraft V4 Pro 等 8 种模型，可通过 `hermes tools` 选择。
sidebar_label: 图像生成
sidebar_position: 6
---

# 图像生成

Hermes Agent 通过 FAL.ai 从文本提示生成图像。内置支持八种模型，每种模型在速度、质量和成本方面都有不同的权衡。活动模型可通过 `hermes tools` 进行用户配置，并保存在 `config.yaml` 中。

## 支持的模型

| 模型 | 速度 | 优势 | 价格 |
|---|---|---|---|
| `fal-ai/flux-2/klein/9b` *(默认)* | `<1s` | 快速，文字清晰 | $0.006/MP |
| `fal-ai/flux-2-pro` | ~6s | 影棚级照片写实主义 | $0.03/MP |
| `fal-ai/z-image/turbo` | ~2s | 双语 EN/CN，6B 参数 | $0.005/MP |
| `fal-ai/nano-banana-pro` | ~8s | Gemini 3 Pro，推理深度，文本渲染 | $0.15/张图 (1K) |
| `fal-ai/gpt-image-1.5` | ~15s | 提示词遵循度 | $0.034/张图 |
| `fal-ai/ideogram/v3` | ~5s | 最佳排版效果 | $0.03–0.09/张图 |
| `fal-ai/recraft/v4/pro/text-to-image` | ~8s | 设计、品牌系统、可投入生产 | $0.25/张图 |
| `fal-ai/qwen-image` | ~12s | 基于 LLM，复杂文本 | $0.02/MP |

价格为撰写本文时 FAL 的定价；请查阅 [fal.ai](https://fal.ai/) 获取最新数据。

## 设置

:::tip Nous Subscribers
如果您有付费的 [Nous Portal](https://portal.nousresearch.com) 订阅，您可以通过 **[Tool Gateway](tool-gateway.md)** 使用图像生成功能，无需 FAL API 密钥。您的模型选择在这两个路径上都保持一致。

如果托管网关对特定模型返回 `HTTP 4xx`，则表示该模型尚未在门户侧代理——代理将告知您，并提供修复步骤（设置 `FAL_KEY` 进行直接访问，或选择其他模型）。
:::

### 获取 FAL API 密钥

1. 在 [fal.ai](https://fal.ai/) 注册
2. 从您的仪表板生成 API 密钥

### 配置和选择模型

运行工具命令：

```bash
hermes tools
```

导航到 **🎨 图像生成**，选择您的后端（Nous 订阅或 FAL.ai），然后选择器将以列对齐的表格显示所有支持的模型——使用箭头键导航，按 Enter 键选择：

```
  Model                          Speed    Strengths                    Price
  fal-ai/flux-2/klein/9b         <1s      快速，文字清晰             $0.006/MP   ← 当前使用
  fal-ai/flux-2-pro              ~6s      影棚级照片写实主义          $0.03/MP
  fal-ai/z-image/turbo           ~2s      双语 EN/CN, 6B          $0.005/MP
  ...
```

您的选择将保存到 `config.yaml`：

```yaml
image_gen:
  model: fal-ai/flux-2/klein/9b
  use_gateway: false            # 如果使用 Nous 订阅，则为 true
```

### GPT-Image 质量

`fal-ai/gpt-image-1.5` 请求的质量固定为 `medium`（在 1024×1024 下约为 $0.034/张图）。我们没有将 `low` / `high` 级别作为用户可见的选项，以确保 Nous Portal 的计费在所有用户中保持可预测——各级别之间的成本差异约为 22 倍。如果您想要更便宜的 GPT-Image 选项，请选择其他模型；如果您想要更高质量，请使用 Klein 9B 或 Imagen 级别的模型。

## 用法

面向代理的 Schema 故意保持最小化——模型会采用您配置的任何内容：

```
生成一张宁静的山地樱花景观图
```

```
创作一幅睿智的老猫头鹰的方形肖像——使用排版模型
```

```
为我制作一张未来主义的城市景观，横向构图
```

## 宽高比

从代理的角度来看，每种模型都接受相同的三个宽高比。在内部，每个模型的原生尺寸规格都会自动填充：

| 代理输入 | image_size (flux/z-image/qwen/recraft/ideogram) | aspect_ratio (nano-banana-pro) | image_size (gpt-image) |
|---|---|---|---|
| `landscape` | `landscape_16_9` | `16:9` | `1536x1024` |
| `square` | `square_hd` | `1:1` | `1024x1024` |
| `portrait` | `portrait_16_9` | `9:16` | `1024x1536` |

此转换发生在 `_build_fal_payload()` 中——代理代码永远不需要知道每种模型的 Schema 差异。

## 自动上采样

通过 FAL 的 **Clarity Upscaler** 进行的上采样是按模型限制的：

| 模型 | 是否上采样？ | 原因 |
|---|---|---|
| `fal-ai/flux-2-pro` | ✓ | 向后兼容（曾是预选择器的默认值） |
| 其他所有模型 | ✗ | 快速模型会失去其亚秒级价值；高分辨率模型不需要 |

当执行上采样时，它使用以下设置：

| 设置 | 值 |
|---|---|
| 上采样因子 | 2× |
| 创造力 | 0.35 |
| 相似度 | 0.6 |
| 引导尺度 | 4 |
| 推理步数 | 18 |

如果上采样失败（网络问题、速率限制），将自动返回原始图像。

## 内部工作原理

1. **模型解析** — `_resolve_fal_model()` 从 `config.yaml` 读取 `image_gen.model`，然后回退到 `FAL_IMAGE_MODEL` 环境变量，最后回退到 `fal-ai/flux-2/klein/9b`。
2. **载荷构建** — `_build_fal_payload()` 将您的 `aspect_ratio` 转换为模型的原生格式（预设枚举、宽高比枚举或 GPT 字面量），合并模型的默认参数，应用任何调用者覆盖，然后过滤到模型的 `supports` 白名单，确保永远不会发送不受支持的键。
3. **提交** — `_submit_fal_request()` 通过直接 FAL 凭证或托管的 Nous 网关进行路由。
4. **上采样** — 仅当模型的元数据包含 `upscale: True` 时运行。
5. **交付** — 最终图像 URL 返回给代理，代理发出 `MEDIA:<url>` 标签，平台适配器将其转换为原生媒体。

## 调试

启用调试日志：

```bash
export IMAGE_TOOLS_DEBUG=true
```

调试日志会写入 `./logs/image_tools_debug_<session_id>.json`，包含每次调用的详细信息（模型、参数、时间、错误）。

## 平台交付

| 平台 | 交付方式 |
|---|---|
| **CLI** | 图像 URL 以 markdown `![](url)` 打印——点击打开 |
| **Telegram** | 带提示词作为说明文字的照片消息 |
| **Discord** | 嵌入到消息中 |
| **Slack** | 由 Slack 展开的 URL |
| **WhatsApp** | 媒体消息 |
| **其他** | 纯文本中的 URL |

## 限制

- **需要 FAL 凭证**（直接 `FAL_KEY` 或 Nous 订阅）
- **仅限文生图** — 此工具不支持局部重绘、图生图或编辑
- **临时 URL** — FAL 返回的主机 URL 在几小时/几天后会过期；如果需要，请本地保存
- **每模型约束** — 有些模型不支持 `seed`、`num_inference_steps` 等参数。`supports` 过滤器会静默丢弃不受支持的参数；这是预期行为