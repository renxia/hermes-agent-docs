---
sidebar_position: 11
title: "图像生成提供程序插件"
description: "如何为 Hermes 智能体构建图像生成后端插件"
---

# 构建图像生成提供程序插件

图像生成提供程序插件会注册一个后端，用于处理每一个 `image_generate` 工具调用——DALL·E、gpt-image、Grok、Flux、Imagen、Stable Diffusion、fal、Replicate、本地 ComfyUI 设备，或其他任何服务。内置提供程序（OpenAI、OpenAI-Codex、xAI）均以插件形式提供。您可以通过将一个目录放入 `plugins/image_gen/<name>/` 来添加新的提供程序，或覆盖捆绑的提供程序。

:::tip
图像生成是 Hermes 支持的几种**后端插件**之一。其他后端插件（具有更专门的 ABC）包括[记忆提供程序插件](/docs/developer-guide/memory-provider-plugin)、[上下文引擎插件](/docs/developer-guide/context-engine-plugin)和[模型提供程序插件](/docs/developer-guide/model-provider-plugin)。通用工具/钩子/CLI 插件位于[构建 Hermes 插件](/docs/guides/build-a-hermes-plugin)中。
:::

## 发现机制如何工作

Hermes 在三个位置扫描图像生成后端：

1. **捆绑** — `<repo>/plugins/image_gen/<name>/`（使用 `kind: backend` 自动加载，始终可用）
2. **用户** — `~/.hermes/plugins/image_gen/<name>/`（通过 `plugins.enabled` 选择加入）
3. **Pip** — 声明 `hermes_agent.plugins` 入口点的包

每个插件的 `register(ctx)` 函数都会调用 `ctx.register_image_gen_provider(...)` —— 这会将插件放入 `agent/image_gen_registry.py` 中的注册表中。活动提供程序由 `config.yaml` 中的 `image_gen.provider` 指定；`hermes tools` 会引导用户进行选择。

`image_generate` 工具包装器会向注册表请求活动提供程序，并将请求分派到该提供程序。如果未注册任何提供程序，该工具会显示一个有用的错误信息，并指向 `hermes tools`。

## 目录结构

```
plugins/image_gen/my-backend/
├── __init__.py      # ImageGenProvider 子类 + register()
└── plugin.yaml      # 清单文件，包含 kind: backend
```

至此，一个捆绑插件已经完成。用户插件位于 `~/.hermes/plugins/image_gen/<name>/` 目录下，需要将其添加到 `config.yaml` 的 `plugins.enabled` 中（或运行 `hermes plugins enable <name>`）。

## ImageGenProvider 抽象基类

继承 `agent.image_gen_provider.ImageGenProvider`。唯一必需的成员有 `name` 属性和 `generate()` 方法——其他成员均有合理的默认值：

```python
# plugins/image_gen/my-backend/__init__.py
from typing import Any, Dict, List, Optional
import os

from agent.image_gen_provider import (
    DEFAULT_ASPECT_RATIO,
    ImageGenProvider,
    error_response,
    resolve_aspect_ratio,
    save_b64_image,
    success_response,
)


class MyBackendImageGenProvider(ImageGenProvider):
    @property
    def name(self) -> str:
        # 用于 image_gen.provider 配置中的稳定 ID。小写，无空格。
        return "my-backend"

    @property
    def display_name(self) -> str:
        # 在 `hermes tools` 中显示的人类可读标签。若省略，则默认为 name.title()。
        return "My Backend"

    def is_available(self) -> bool:
        # 如果缺少凭据或依赖项，则返回 False。
        # 工具的可用性检查门控会在调度前调用此方法。
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
                "price": "$0.01/图像",
            },
            {
                "id": "my-model-hq",
                "display": "My Model (HQ)",
                "speed": "~30s",
                "strengths": "最高保真度",
                "price": "$0.04/图像",
            },
        ]

    def default_model(self) -> Optional[str]:
        return "my-model-fast"

    def get_setup_schema(self) -> Dict[str, Any]:
        # 用于 `hermes tools` 选择器的元数据——在设置时需要提示用户输入的键。
        return {
            "name": "My Backend",
            "badge": "paid",        # 可选；在选择器中显示为简短标签
            "tag": "在名称下方显示的一行描述",
            "env_vars": [
                {
                    "key": "MY_BACKEND_API_KEY",
                    "prompt": "My Backend API 密钥",
                    "url": "https://my-backend.example.com/api-keys",
                },
            ],
        }

    def generate(
        self,
        prompt: str,
        aspect_ratio: str = DEFAULT_ASPECT_RATIO,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        prompt = (prompt or "").strip()
        aspect_ratio = resolve_aspect_ratio(aspect_ratio)

        if not prompt:
            return error_response(
                error="提示词是必需的",
                error_type="invalid_input",
                provider=self.name,
                prompt="",
                aspect_ratio=aspect_ratio,
            )

        # 模型选择优先级：环境变量 → 配置 → 默认值。内置 openai 插件中的辅助函数
        # _resolve_model() 是一个很好的参考。
        model_id = kwargs.get("model") or self.default_model() or "my-model-fast"

        try:
            import my_backend_sdk
            client = my_backend_sdk.Client(api_key=os.environ["MY_BACKEND_API_KEY"])
            result = client.generate(
                prompt=prompt,
                model=model_id,
                aspect_ratio=aspect_ratio,
            )

            # 支持两种形式：
            #   - URL 字符串：将其作为 `image` 返回
            #   - base64 数据：通过 save_b64_image() 保存到 $HERMES_HOME/cache/images/ 下
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
description: My image backend — 通过 My Backend SDK 实现文生图
author: Your Name
kind: backend
requires_env:
  - MY_BACKEND_API_KEY
```

`kind: backend` 决定了插件将被路由到图像生成注册路径。`requires_env` 在 `hermes plugins install` 期间会被提示用户输入。

## 抽象基类参考

完整契约见 `agent/image_gen_provider.py`。你通常会重写的方法如下：

| 成员 | 必需 | 默认值 | 用途 |
|---|---|---|---|
| `name` | ✅ | — | 用于 `image_gen.provider` 配置中的稳定 ID |
| `display_name` | — | `name.title()` | 在 `hermes tools` 中显示的标签 |
| `is_available()` | — | `True` | 用于检查是否缺少凭据/依赖项的门控 |
| `list_models()` | — | `[]` | 用于 `hermes tools` 模型选择器的目录 |
| `default_model()` | — | `list_models()` 中的第一个模型 | 当未配置模型时的回退选项 |
| `get_setup_schema()` | — | 最小化 | 选择器元数据 + 环境变量提示 |
| `generate(prompt, aspect_ratio, **kwargs)` | ✅ | — | 调用方法 |

## 响应格式

`generate()` 必须返回一个通过 `success_response()` 或 `error_response()` 构建的字典。两者均位于 `agent/image_gen_provider.py` 中。

**成功：**
```python
success_response(
    image=<url-or-绝对路径>,
    model=<模型ID>,
    prompt=<回显的提示词>,
    aspect_ratio="landscape" | "square" | "portrait",
    provider=<你的提供者名称>,
    extra={...},  # 可选的后端特定字段
)
```

**错误：**
```python
error_response(
    error="人类可读的消息",
    error_type="provider_error" | "invalid_input" | "<异常类名>",
    provider=<你的提供者名称>,
    model=<模型ID>,
    prompt=<提示词>,
    aspect_ratio=<解析后的宽高比>,
)
```

工具包装器会将该字典序列化为 JSON 并传递给 LLM。错误会作为工具结果呈现；LLM 决定如何向用户解释这些错误。

## 处理 base64 与 URL 输出

某些后端返回图像 URL（如 fal、Replicate）；其他后端返回 base64 载荷（如 OpenAI gpt-image-2）。对于 base64 情况，请使用 `save_b64_image()`——它会将图像写入 `$HERMES_HOME/cache/images/<前缀>_<时间戳>_<UUID>.<扩展名>` 并返回绝对 `Path`。将该路径（作为 `str`）作为 `image=` 参数传递给 `success_response()`。网关交付（Telegram 照片气泡、Discord 附件）同时支持 URL 和绝对路径。

## 用户覆盖

在 `~/.hermes/plugins/image_gen/<name>/` 下放置一个用户插件，其 `name` 属性与捆绑插件相同，并通过 `hermes plugins enable <name>` 启用它——注册表采用“最后写入者获胜”策略，因此你的版本将替换内置版本。适用于将 `openai` 插件指向私有代理，或替换为自定义模型目录。

## 测试

```bash
export HERMES_HOME=/tmp/hermes-imggen-test
mkdir -p $HERMES_HOME/plugins/image_gen/my-backend
# …将 __init__.py + plugin.yaml 复制到该目录…

export MY_BACKEND_API_KEY=your-test-key
hermes plugins enable my-backend

# 将其设为活动提供者
echo "image_gen:" >> $HERMES_HOME/config.yaml
echo "  provider: my-backend" >> $HERMES_HOME/config.yaml

# 试用
hermes -z "生成一张穿着宇航服的柯基犬的图像"
```

或交互式操作：`hermes tools` → “图像生成” → 选择 `my-backend` → 如果提示，请输入 API 密钥。

## 参考实现

- **`plugins/image_gen/openai/__init__.py`** —— gpt-image-2 在低/中/高三个层级上作为三个虚拟模型 ID 共享一个 API 模型，但使用不同的 `quality` 参数。这是单个后端下分层模型 + config.yaml 优先级链的良好示例。
- **`plugins/image_gen/xai/__init__.py`** —— 通过 xAI 使用 Grok Imagine。不同形式（URL 输出，更简单的目录）。
- **`plugins/image_gen/openai-codex/__init__.py`** —— 复用 OpenAI SDK 的 Codex 风格 Responses API 变体，但使用不同的路由基础 URL。

## 通过 pip 分发

```toml
# pyproject.toml
[project.entry-points."hermes_agent.plugins"]
my-backend-imggen = "my_backend_imggen_package"
```

`my_backend_imggen_package` 必须暴露一个顶级 `register` 函数。有关完整设置，请参阅通用插件指南中的[通过 pip 分发](/docs/guides/build-a-hermes-plugin#distribute-via-pip)。

## 相关页面

- [图像生成](/docs/user-guide/features/image-generation) —— 面向用户的功能文档
- [插件概览](/docs/user-guide/features/plugins) —— 所有插件类型一览
- [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin) —— 通用工具/钩子/斜杠命令指南