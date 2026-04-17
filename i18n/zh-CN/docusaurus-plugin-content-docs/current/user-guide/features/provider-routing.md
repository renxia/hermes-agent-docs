---
title: 提供商路由
description: 配置 OpenRouter 提供商偏好，以优化成本、速度或质量。
sidebar_label: 提供商路由
sidebar_position: 7
---

# 提供商路由

当您使用 [OpenRouter](https://openrouter.ai) 作为您的 LLM 提供商时，Hermes Agent 支持**提供商路由**——这为您提供了对处理请求的底层 AI 提供商及其优先级进行精细控制的能力。

OpenRouter 会将请求路由到许多提供商（例如 Anthropic、Google、AWS Bedrock、Together AI）。提供商路由让您可以根据成本、速度、质量进行优化，或强制执行特定的提供商要求。

## 配置

请在您的 `~/.hermes/config.yaml` 中添加一个 `provider_routing` 部分：

```yaml
provider_routing:
  sort: "price"           # 如何对提供商进行排序
  only: []                # 白名单：仅使用这些提供商
  ignore: []              # 黑名单：绝不使用这些提供商
  order: []               # 明确的提供商优先级顺序
  require_parameters: false  # 仅使用支持所有参数的提供商
  data_collection: null   # 控制数据收集（"allow" 或 "deny"）
```

:::info
提供商路由仅在使用 OpenRouter 时适用。它对直接的提供商连接（例如直接连接到 Anthropic API）没有影响。
:::

## 选项

### `sort`

控制 OpenRouter 如何为您的请求对可用提供商进行排名。

| 值 | 描述 |
|-------|-------------|
| `"price"` | 优先使用最便宜的提供商 |
| `"throughput"` | 优先使用最快的每秒 token 数 |
| `"latency"` | 优先使用最低的首次 token 时间 |

```yaml
provider_routing:
  sort: "price"
```

### `only`

提供商名称白名单。设置此项后，**仅**会使用这些提供商。所有其他提供商将被排除。

```yaml
provider_routing:
  only:
    - "Anthropic"
    - "Google"
```

### `ignore`

提供商名称黑名单。这些提供商**绝不会**被使用，即使它们提供了最便宜或最快的选项。

```yaml
provider_routing:
  ignore:
    - "Together"
    - "DeepInfra"
```

### `order`

明确的优先级顺序。列出的提供商越靠前，越优先。未列出的提供商将作为备用选项使用。

```yaml
provider_routing:
  order:
    - "Anthropic"
    - "Google"
    - "AWS Bedrock"
```

### `require_parameters`

当设置为 `true` 时，OpenRouter 将仅路由到支持您请求中**所有**参数（如 `temperature`、`top_p`、`tools` 等）的提供商。这可以避免参数丢失。

```yaml
provider_routing:
  require_parameters: true
```

### `data_collection`

控制提供商是否可以使用您的提示进行训练。选项为 `"allow"` 或 `"deny"`。

```yaml
provider_routing:
  data_collection: "deny"
```

## 实用示例

### 优化成本

路由到可用的最便宜的提供商。适用于高容量使用和开发：

```yaml
provider_routing:
  sort: "price"
```

### 优化速度

为交互式使用优先选择低延迟的提供商：

```yaml
provider_routing:
  sort: "latency"
```

### 优化吞吐量

最适合长篇生成，在这种情况下每秒 token 数很重要：

```yaml
provider_routing:
  sort: "throughput"
```

### 锁定特定提供商

确保所有请求都通过特定的提供商以保持一致性：

```yaml
provider_routing:
  only:
    - "Anthropic"
```

### 避免特定提供商

排除您不希望使用的提供商（例如出于数据隐私考虑）：

```yaml
provider_routing:
  ignore:
    - "Together"
    - "Lepton"
  data_collection: "deny"
```

### 带有备用选项的优先顺序

首先尝试您偏好的提供商，如果不可用则回退到其他提供商：

```yaml
provider_routing:
  order:
    - "Anthropic"
    - "Google"
  require_parameters: true
```

## 工作原理

提供商路由偏好通过 `extra_body.provider` 字段在每次 API 调用时传递给 OpenRouter API。这适用于以下两种模式：

- **CLI 模式** — 配置在 `~/.hermes/config.yaml` 中，在启动时加载
- **Gateway 模式** — 相同的配置文件，在网关启动时加载

路由配置从 `config.yaml` 读取，并在创建 `AIAgent` 时作为参数传递：

```
providers_allowed  ← 来自 provider_routing.only
providers_ignored  ← 来自 provider_routing.ignore
providers_order    ← 来自 provider_routing.order
provider_sort      ← 来自 provider_routing.sort
provider_require_parameters ← 来自 provider_routing.require_parameters
provider_data_collection    ← 来自 provider_routing.data_collection
```

:::tip
您可以组合多个选项。例如，按价格排序，但排除某些提供商并要求参数支持：

```yaml
provider_routing:
  sort: "price"
  ignore: ["Together"]
  require_parameters: true
  data_collection: "deny"
```
:::

## 默认行为

当未配置 `provider_routing` 部分（默认情况）时，OpenRouter 使用其自身的默认路由逻辑，该逻辑通常会自动平衡成本和可用性。

:::tip 提供商路由 vs. 备用模型
提供商路由控制的是处理您请求的 **OpenRouter 内的子提供商**。如果您需要当主要模型失败时自动故障转移到完全不同的提供商，请参阅 [备用提供商](/docs/user-guide/features/fallback-providers)。
:::