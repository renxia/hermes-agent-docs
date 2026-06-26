---
sidebar_position: 11
title: "Image Generation Provider Plugins"
description: "How to build an image-generation backend plugin for Hermes Agent"
---

# 构建图像生成提供者插件

图像生成提供者插件注册一个后端，为每次 `image_generate` 工具调用提供服务——DALL·E、gpt-image、Grok、Flux、Imagen、Stable Diffusion、fal、Replicate、本地 ComfyUI 设备，等等。内置提供者（OpenAI、OpenAI-Codex、xAI）均以插件形式发布。你可以通过将目录放入 `plugins/image_gen/<name>/` 来添加新的插件，或覆盖已有的内置插件。

:::tip
图像生成是 Hermes 支持的几种**后端插件**之一。其他插件（具有更专业的抽象基类）包括[记忆提供者插件](/developer-guide/memory_provider-plugin)、[上下文引擎插件](/developer-guide/context-engine-plugin)和[模型提供者插件](/developer-guide/model-provider-plugin)。通用的工具/钩子/CLI 插件位于[构建 Hermes 插件](/guides/build-a-hermes-plugin)。
:::

## 发现机制

Hermes 在三个位置扫描图像生成后端：

1. **内置** — `<repo>/plugins/image_gen/<name>/`（以 `kind: backend` 自动加载，始终可用）
2. **用户** — `~/.hermes/plugins/image_gen/<name>/`（通过 `plugins.enabled` 按需启用）
3. **Pip** — 声明了 `hermes_agent.plugins` 入口点的包

每个插件的 `register(ctx)` 函数会调用 `ctx.register_image_gen_provider(...)` —— 这将把该插件注册到 `agent/image_gen_registry.py` 的注册表中。当前激活的提供者由 `config.yaml` 中的 `image_gen.provider` 选择；`hermes tools` 会引导用户进行选择。

`image_generate` 工具包装器向注册表请求当前激活的提供者并将调用分发到该处。如果没有注册任何提供者，该工具会显示一条指向 `hermes tools` 的有用错误提示。

## 目录结构

```
plugins/image_gen/my-backend/
├── __init__.py      # ImageGenProvider 子类 + register()
└── plugin.yaml      # 清单文件，kind 值为 backend
```

至此，一个捆绑插件已经完成。位于 `~/.hermes/plugins/image_gen/<name>/` 的用户插件需要添加到 `config.yaml` 的 `plugins.enabled` 中（或运行 `hermes plugins enable <name>`）。

## ImageGenProvider 抽象基类

继承 `agent.image_gen_provider.ImageGenProvider`。唯一需要的成员是 `name` 属性和 `generate()` 方法——其他所有内容都有合理的默认值：

```python
# plugins/image_gen/my-backend/__init__.py
from typing import Any, Dict, List, Optional
import os

from agent.image_gen_provider import (
    DEFAULT_ASPECT_RATIO,
    ImageGenProvider,
    error_response,
    normalize_reference_images,
    resolve_aspect_ratio,
    save_b64_image,
    success_response,
)


class MyBackendImageGenProvider(ImageGenProvider):
    @property
    def name(self) -> str:
        # 在 image_gen.provider 配置中使用的稳定标识符。小写，无空格。
        return "my-backend"

    @property
    def display_name(self) -> str:
        # 在 `hermes tools` 中显示的人工标签。如果省略，默认为 name.title()。
        return "My Backend"

    def is_available(self) -> bool:
        # 如果缺少凭证或依赖项，则返回 False。
        # 工具的分发前可用性检查会调用此方法。
        if not os.environ.get("MY_BACKEND_API_KEY"):
            return False
        try:
            import my_backend_sdk  # noqa: F401
        except ImportError:
            return False
        return True

    def list_models(self) -> List[Dict[str, Any]]:
        # 在 `hermes tools` 模型选择器中显示的目录。
        return [
            {
                "id": "my-model-fast",
                "display": "My Model (Fast)",
                "speed": "~5s",
                "strengths": "快速迭代",
                "price": "$0.01/image",
            },
            {
                "id": "my-model-hq",
                "display": "My Model (HQ)",
                "speed": "~30s",
                "strengths": "最高保真度",
                "price": "$0.04/image",
            },
        ]

    def default_model(self) -> Optional[str]:
        return "my-model-fast"

    def get_setup_schema(self) -> Dict[str, Any]:
        # 用于 `hermes tools` 选择器的元数据——设置时提示输入的键。
        return {
            "name": "My Backend",
            "badge": "paid",        # 可选；在选择器中显示为短标签
            "tag": "显示在名称下方的一行描述",
            "env_vars": [
                {
                    "key": "MY_BACKEND_API_KEY",
                    "prompt": "My Backend API 密钥",
                    "url": "https://my-backend.example.com/api-keys",
                },
            ],
        }

    def capabilities(self) -> Dict[str, Any]:
        # 声明此后端是否支持图像到图像/编辑。
        # 工具层会在动态架构中暴露此信息，以便模型
        # 了解何时使用 `image_url`。默认值（如果省略此方法）是
        # 纯文本：{"modalities": ["text"], "max_reference_images": 0}。
        return {"modalities": ["text", "image"], "max_reference_images": 4}

    def generate(
        self,
        prompt: str,
        aspect_ratio: str = DEFAULT_ASPECT_RATIO,
        *,
        image_url: Optional[str] = None,
        reference_image_urls: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        prompt = (prompt or "").strip()
        aspect_ratio = resolve_aspect_ratio(aspect_ratio)

        if not prompt:
            return error_response(
                error="需要提供提示词",
                error_type="invalid_input",
                provider=self.name,
                prompt="",
                aspect_ratio=aspect_ratio,
            )

        # 路由：如果设置了 image_url（或 reference_image_urls），则调用
        # 为图像到图像/编辑请求；否则为文本到图像。通过
        # success_response 的 `modality` 字段报告所走的路径。
        sources = []
        if image_url:
            sources.append(image_url)
        sources.extend(normalize_reference_images(reference_image_urls) or [])
        modality = "image" if sources else "text"

        # 模型选择优先级：环境变量 → 配置 → 默认值。内置 openai
        # 插件中的辅助方法 _resolve_model() 是一个很好的参考。
        model_id = kwargs.get("model") or self.default_model() or "my-model-fast"

        try:
            import my_backend_sdk
            client = my_backend_sdk.Client(api_key=os.environ["MY_BACKEND_API_KEY"])
            if modality == "image":
                result = client.edit(
                    prompt=prompt,
                    model=model_id,
                    image_urls=sources,
                )
            else:
                result = client.generate(
                    prompt=prompt,
                    model=model_id,
                    aspect_ratio=aspect_ratio,
                )

            # 支持两种格式：
            #   - URL 字符串：作为 `image` 返回
            #   - base64 数据：通过 save_b64_image() 保存到 $HERMES_HOME/cache/images/
            if result.get("image_b64"):
                path = save_b64_image(
                    result["image_b64"],
                    prefix=self.name,
                    extension="png",
                )
                image = str(path)
            else:
                image = result["image_url"]

            return success_response(
                image=image,
                model=model_id,
                prompt=prompt,
                aspect_ratio=aspect_ratio,
                provider=self.name,
                modality=modality,
            )
        except Exception as exc:
            return error_response(
                error=str(exc),
                error_type=type(exc).__name__,
                provider=self.name,
                model=model_id,
                prompt=prompt,
                aspect_ratio=aspect_ratio,
            )


def register(ctx) -> None:
    """插件入口点——在加载时调用一次。"""
    ctx.register_image_gen_provider(MyBackendImageGenProvider())
```

## plugin.yaml

```yaml
name: my-backend
version: 1.0.0
description: My image backend — text-to-image via My Backend SDK
author: Your Name
kind: backend
requires_env:
  - MY_BACKEND_API_KEY
```

`kind: backend` 是将插件路由到图像生成注册路径的关键。`requires_env` 在 `hermes plugins install` 期间提示用户输入。

## 抽象基类参考

完整接口定义在 `agent/image_gen_provider.py` 中。您通常需要重写的方法：

| 成员 | 必需 | 默认值 | 用途 |
|---|---|---|---|
| `name` | ✅ | — | 在 `image_gen.provider` 配置中使用的稳定标识符 |
| `display_name` | — | `name.title()` | 在 `hermes tools` 中显示的标签 |
| `is_available()` | — | `True` | 缺少凭证/依赖时的可用性检查 |
| `list_models()` | — | `[]` | `hermes tools` 模型选择器的目录 |
| `default_model()` | — | `list_models()` 中的第一个 | 未配置模型时的回退选项 |
| `get_setup_schema()` | — | 最小集 | 选择器元数据 + 环境变量提示 |
| `generate(prompt, aspect_ratio, **kwargs)` | ✅ | — | 核心调用方法 |

## 响应格式

`generate()` 必须返回通过 `success_response()` 或 `error_response()` 构建的字典。两者都位于 `agent/image_gen_provider.py` 中。

**成功：**
```python
success_response(
    image=<url 或绝对路径>,
    model=<model-id>,
    prompt=<回显的提示词>,
    aspect_ratio="landscape" | "square" | "portrait",
    provider=<your-provider-name>,
    extra={...},  # 可选的后端特定字段
)
```

**错误：**
```python
error_response(
    error="人类可读的消息",
    error_type="provider_error" | "invalid_input" | "<异常类名>",
    provider=<your-provider-name>,
    model=<model-id>,
    prompt=<prompt>,
    aspect_ratio=<resolved aspect>,
)
```

工具包装器将字典 JSON 序列化后传递给 LLM。错误作为工具结果呈现；LLM 决定如何向用户解释这些错误。

## 处理 base64 与 URL 输出

某些后端返回图像 URL（fal、Replicate）；其他返回 base64 载荷（OpenAI gpt-image-2）。对于 base64 情况，请使用 `save_b64_image()`——它会写入 `$HERMES_HOME/cache/images/<prefix>_<timestamp>_<uuid>.<ext>` 并返回绝对 `Path`。将该路径（作为 `str`）作为 `success_response()` 中的 `image=` 传递。网关投递（Telegram 图片气泡、Discord 附件）同时识别 URL 和绝对路径。

## 用户覆盖

将用户插件放置在 `~/.hermes/plugins/image_gen/<name>/` 中，使用与捆绑插件相同的 `name` 属性，并通过 `hermes plugins enable <name>` 启用它——注册表采用最后写入者优先的策略，因此您的版本将替换内置版本。适用于将 `openai` 插件指向私有代理，或替换为自定义模型目录。

## 测试

```bash
export HERMES_HOME=/tmp/hermes-imggen-test
mkdir -p $HERMES_HOME/plugins/image_gen/my-backend
# …将 __init__.py + plugin.yaml 复制到该目录…

export MY_BACKEND_API_KEY=your-test-key
hermes plugins enable my-backend

# 选择它作为活动提供商
echo "image_gen:" >> $HERMES_HOME/config.yaml
echo "  provider: my-backend" >> $HERMES_HOME/config.yaml

# 测试调用
hermes -z "生成一张穿着宇航服的柯基犬图片"
```

或者以交互方式：`hermes tools` → "图像生成" → 选择 `my-backend` → 根据提示输入 API 密钥。

## 参考实现

- **`plugins/image_gen/openai/__init__.py`** — gpt-image-2 在低/中/高三个层级上作为三个虚拟模型 ID 实现，共享一个 API 模型但使用不同的 `quality` 参数。是单一后端下层级化模型 + config.yaml 优先级链的良好示例。
- **`plugins/image_gen/xai/__init__.py`** — 通过 xAI 使用 Grok Imagine。不同的格式（URL 输出，更简单的目录）。
- **`plugins/image_gen/openai-codex/__init__.py`** — Codex 风格的 Responses API 变体，使用不同的路由基础 URL 复用 OpenAI SDK。

## 通过 pip 分发

```toml
# pyproject.toml
[project.entry-points."hermes_agent.plugins"]
my-backend-imggen = "my_backend_imggen_package"
```

`my_backend_imggen_package` 必须暴露一个顶层 `register` 函数。请参阅通用插件指南中的[通过 pip 分发](/guides/build-a-hermes-plugin#distribute-via-pip)以获取完整设置。
## 相关页面

- [图像生成](/user-guide/features/image-generation) — 面向用户的功能文档
- [插件概览](/user-guide/features/plugins) — 所有插件类型一览
- [构建 Hermes 插件](/guides/build-a-hermes-plugin) — 通用工具/hooks/斜杠命令指南