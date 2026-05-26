---
sidebar_position: 12
title: "视频生成提供者插件"
description: "如何为 Hermes Agent 构建视频生成后端插件"
---

# 构建视频生成提供者插件

视频生成提供者插件注册一个后端，用于处理每个 `video_generate` 工具调用。内置提供者（xAI、FAL）作为插件提供。要添加新的或覆盖已有的，只需将目录放入 `plugins/video_gen/<name>/`。

:::tip
视频生成插件的结构与[图像生成提供者插件](/developer-guide/image-gen-provider-plugin)几乎逐行对应——如果你已经构建过图像生成后端，就基本了解其结构。主要区别在于：一个宣传模态、宽高比、时长等能力的 `capabilities()` 方法，以及路由约定（传递 `image_url` 以使用图生视频模式，省略则使用文生视频模式——提供者会内部选择合适的端点）。
:::

## 统一接口（一个工具，两种模态）

`video_generate` 工具通过一个参数暴露两种模态：

- **文生视频** —— 仅使用 `prompt` 调用。提供者将其路由至文生视频端点。
- **图生视频** —— 使用 `prompt` + `image_url` 调用。提供者将其路由至图生视频端点。

编辑和扩展功能有意未包含在范围内。大多数后端不支持它们，且这种不一致会迫使将每个后端的具体说明写入智能体的工具描述中。

## 发现机制如何工作

Hermes 会在三个地方扫描视频生成后端：

1. **内置** —— `<repo>/plugins/video_gen/<name>/`（通过 `kind: backend` 自动加载）
2. **用户** —— `~/.hermes/plugins/video_gen/<name>/`（通过 `plugins.enabled` 启用）
3. **Pip** —— 声明了 `hermes_agent.plugins` 入口点的包

每个插件的 `register(ctx)` 函数调用 `ctx.register_video_gen_provider(...)`。活动提供者由 `config.yaml` 中的 `video_gen.provider` 指定；`hermes tools` → 视频生成 会引导用户进行选择。与 `image_generate` 不同，没有内置的传统后端——每个提供者都是一个插件。

## 目录结构

```
plugins/video_gen/my-backend/
├── __init__.py      # VideoGenProvider 子类 + register()
└── plugin.yaml      # 包含 kind: backend 的清单文件
```

## VideoGenProvider 抽象基类

继承 `agent.video_gen_provider.VideoGenProvider`。必须实现：`name` 属性和 `generate()` 方法。

```python
# plugins/video_gen/my-backend/__init__.py
from typing import Any, Dict, List, Optional
import os

from agent.video_gen_provider import (
    VideoGenProvider,
    error_response,
    success_response,
)


class MyVideoGenProvider(VideoGenProvider):
    @property
    def name(self) -> str:
        return "my-backend"

    @property
    def display_name(self) -> str:
        return "我的后端"

    def is_available(self) -> bool:
        return bool(os.environ.get("MY_API_KEY"))

    def list_models(self) -> List[Dict[str, Any]]:
        # 每个条目是一个模型系列——用户选择一次的名称。
        # 你的提供者的 generate() 方法会根据是否传递了 image_url
        # 在系列内进行路由。
        return [
            {
                "id": "fast",
                "display": "快速",
                "speed": "~30秒",
                "strengths": "最经济的选项",
                "price": "$0.05/秒",
                "modalities": ["text", "image"],  # 建议性
            },
        ]

    def default_model(self) -> Optional[str]:
        return "fast"

    def capabilities(self) -> Dict[str, Any]:
        return {
            "modalities": ["text", "image"],
            "aspect_ratios": ["16:9", "9:16"],
            "resolutions": ["720p", "1080p"],
            "min_duration": 1,
            "max_duration": 10,
            "supports_audio": False,
            "supports_negative_prompt": True,
            "max_reference_images": 0,
        }

    def get_setup_schema(self) -> Dict[str, Any]:
        return {
            "name": "我的后端",
            "badge": "paid",
            "tag": "在 `hermes tools` 中显示的简短描述",
            "env_vars": [
                {
                    "key": "MY_API_KEY",
                    "prompt": "我的后端 API 密钥",
                    "url": "https://mybackend.example.com/keys",
                },
            ],
        }

    def generate(
        self,
        prompt: str,
        *,
        model: Optional[str] = None,
        image_url: Optional[str] = None,
        reference_image_urls: Optional[List[str]] = None,
        duration: Optional[int] = None,
        aspect_ratio: str = "16:9",
        resolution: str = "720p",
        negative_prompt: Optional[str] = None,
        audio: Optional[bool] = None,
        seed: Optional[int] = None,
        **kwargs: Any,  # 为保持向前兼容性，始终忽略未知 kwargs
    ) -> Dict[str, Any]:
        # 路由：根据是否存在 image_url 选择端点。
        if image_url:
            endpoint = "my-backend/image-to-video"
            modality_used = "image"
        else:
            endpoint = "my-backend/text-to-video"
            modality_used = "text"

        # ... 调用你的 API ...

        return success_response(
            video="https://your-cdn/output.mp4",
            model=model or "fast",
            prompt=prompt,
            modality=modality_used,
            aspect_ratio=aspect_ratio,
            duration=duration or 5,
            provider=self.name,
        )


def register(ctx) -> None:
    ctx.register_video_gen_provider(MyVideoGenProvider())
```

## 插件清单文件

```yaml
# plugins/video_gen/my-backend/plugin.yaml
name: my-backend
version: 1.0.0
description: "我的视频生成后端"
author: Your Name
kind: backend
requires_env:
  - MY_API_KEY
```

## `video_generate` 工具的 Schema

该工具为所有后端暴露一个统一的 Schema。提供者会忽略它们不支持的参数。

| 参数 | 作用 |
|---|---|
| `prompt` | 文本指令（必需） |
| `image_url` | 设置时 → 图生视频；省略时 → 文生视频 |
| `reference_image_urls` | 风格/角色参考图（依赖于提供者） |
| `duration` | 秒数 —— 提供者会进行裁剪 |
| `aspect_ratio` | `"16:9"`, `"9:16"`, `"1:1"`, ... —— 提供者会进行裁剪 |
| `resolution` | `"480p"` / `"540p"` / `"720p"` / `"1080p"` —— 提供者会进行裁剪 |
| `negative_prompt` | 需要避免的内容（仅 Pixverse/Kling 支持） |
| `audio` | 原生音频（Veo3 / Pixverse 定价层级） |
| `seed` | 可复现性 |
| `model` | 覆盖活动的模型/系列 |

提供者的 `capabilities()` 方法会宣传支持哪些参数。智能体会在工具描述中看到当前活动后端的能力，当用户通过 `hermes tools` 更改后端时，此描述会动态重建。

## 模型系列与端点路由（FAL 模式）

当你的后端为每个"模型"拥有多个端点时（例如 FAL，其中每个系列（Veo 3.1, Pixverse v6, Kling O3）都有 `/text-to-video` 和 `/image-to-video` URL），将每个**系列**表示为一个目录条目。你的 `generate()` 方法根据是否传递了 `image_url` 来选择正确的端点：

```python
FAMILIES = {
    "veo3.1": {
        "text_endpoint": "fal-ai/veo3.1",
        "image_endpoint": "fal-ai/veo3.1/image-to-video",
        # ... 系列特定的能力标志 ...
    },
}

def generate(self, prompt, *, image_url=None, model=None, **kwargs):
    family_id, family = _resolve_family(model)
    endpoint = family["image_endpoint"] if image_url else family["text_endpoint"]
    # ... 根据系列声明的能力标志构建请求负载，调用端点 ...
```

用户只需在 `hermes tools` 中选择一次 `veo3.1`。智能体无需考虑端点——只需传递（或不传递）`image_url`。

## 选择优先级

对于每个实例的模型选择旋钮（参见 `plugins/video_gen/fal/__init__.py`）：

1. 工具调用中的 `model=` 关键字参数
2. `<PROVIDER>_VIDEO_MODEL` 环境变量
3. `config.yaml` 中的 `video_gen.<provider>.model`
4. `config.yaml` 中的 `video_gen.model`（当它是你的 ID 之一时）
5. 提供者的 `default_model()` 方法

## 响应格式

`success_response()` 和 `error_response()` 会生成每个后端都应返回的字典格式。请使用它们——不要手动构建字典。

成功响应的键：`success`, `video` (URL 或绝对路径), `model`, `prompt`, `modality` (`"text"` 或 `"image"`), `aspect_ratio`, `duration`, `provider`, 以及 `extra`。

错误响应的键：`success`, `video` (None), `error`, `error_type`, `model`, `prompt`, `aspect_ratio`, `provider`。

## 存储产出物的位置

如果你的后端返回 base64 编码数据，请使用 `save_b64_video()` 将其写入 `$HERMES_HOME/cache/videos/` 目录下。对于来自后续 HTTP 请求的原始字节数据，请使用 `save_bytes_video()`。否则，直接返回上游 URL —— 网关会在交付时解析远程 URL。

## 测试

将冒烟测试放在 `tests/plugins/video_gen/test_<name>_plugin.py` 下。xAI 和 FAL 的测试展示了相关模式——注册、验证目录、测试有无 `image_url` 时的路由，并断言在缺少认证时返回清晰的错误响应。