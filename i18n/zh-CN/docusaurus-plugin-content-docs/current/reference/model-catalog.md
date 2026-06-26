---
sidebar_position: 11
title: Model Catalog
description: Remotely-hosted manifest driving curated model picker lists for OpenRouter and Nous Portal.
---

# Model Catalog

Hermes 从与文档站点一起托管的 JSON 清单中获取 **OpenRouter** 和 **Nous Portal** 的精选模型列表。这使得维护者无需发布新的 `hermes-agent` 版本即可更新选择器列表。

当清单不可达（离线、网络被阻止、托管故障）时，Hermes 会静默回退到 CLI 附带的仓库内快照。清单永远不会导致选择器无法使用——最坏的情况是看到随已安装版本捆绑的列表。

## 实时清单 URL

```
https://hermes-agent.nousresearch.com/docs/api/model-catalog.json
```

通过现有的 `deploy-site.yml` GitHub Pages 流水线在每次合并到 `main` 时发布。真实来源位于仓库中的 `website/static/api/model-catalog.json`。

## Schema

```json
{
  "version": 1,
  "updated_at": "2026-04-25T22:00:00Z",
  "metadata": {},
  "providers": {
    "openrouter": {
      "metadata": {},
      "models": [
        {"id": "moonshotai/kimi-k2.6", "description": "recommended", "metadata": {}},
        {"id": "openai/gpt-5.4",       "description": ""}
      ]
    },
    "nous": {
      "metadata": {},
      "models": [
        {"id": "anthropic/claude-opus-4.7"},
        {"id": "moonshotai/kimi-k2.6"}
      ]
    }
  }
}
```

字段说明：

- **`version`** — 整数模式版本。未来模式会递增此值；Hermes 会拒绝其无法理解的版本的清单，并回退到硬编码快照。
- **`metadata`** — 清单、提供者和模型级别自由格式字典。任意键。Hermes 忽略未知字段，因此可以注释条目（`"tier": "paid"`、`"tags": [...]` 等），无需协调模式变更。
- **`description`** — 仅限 OpenRouter。驱动选择器徽章文本（`"recommended"`、`"free"` 或空）。Nous Portal 不使用此字段——免费层门控由 Portal 的定价端点实时确定。
- **定价和上下文长度** 不在清单中。这些信息在获取时来自实时提供者 API（`/v1/models` 端点、models.dev）。

## 获取行为

| 时机 | 发生情况 |
|---|---|
| `/model` 或 `hermes model` | 如果磁盘缓存过期则获取，否则使用缓存 |
| 磁盘缓存新鲜（&lt; TTL） | 无网络请求 |
| 网络故障但有缓存 | 静默回退到缓存，输出一行日志 |
| 网络故障且无缓存 | 静默回退到仓库内快照 |
| 清单未通过模式验证 | 视为不可达 |

缓存位置：`~/.hermes/cache/model_catalog.json`。

## 配置

```yaml
model_catalog:
  enabled: true
  url: https://hermes-agent.nousresearch.com/docs/api/model-catalog.json
  ttl_hours: 1
  providers: {}
```

设置 `enabled: false` 可完全禁用远程获取，始终使用仓库内快照。

### 每个提供者的覆盖 URL

第三方可以使用相同的模式自托管自己的精选列表。将提供者指向自定义 URL：

```yaml
model_catalog:
  providers:
    openrouter:
      url: https://example.com/my-openrouter-curation.json
```

覆盖清单只需填充其关心的提供者块。其他提供者继续从主 URL 解析。

## 更新清单

维护者：

```bash
# 从仓库内硬编码列表重新生成（在编辑 hermes_cli/models.py 中的
# OPENROUTER_MODELS 或 _PROVIDER_MODELS["nous"] 后保持清单同步）。
python scripts/build_model_catalog.py
```

然后将生成的变更 PR 到 `main` 的 `website/static/api/model-catalog.json`。文档站点在合并时自动部署，新清单在几分钟内生效。

也可以直接手动编辑 JSON 进行细粒度元数据更改，这些更改不属于仓库内快照——生成脚本是便利工具，而非唯一的真实来源。