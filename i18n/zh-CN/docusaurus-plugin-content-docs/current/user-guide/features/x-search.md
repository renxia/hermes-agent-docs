---
title: X (Twitter) 搜索
description: 在智能体内部使用 xAI 内置的 x_search 响应工具搜索 X (Twitter) 帖子和话题 — 支持通过 SuperGrok OAuth 登录或 XAI_API_KEY 使用。
sidebar_label: X (Twitter) 搜索
sidebar_position: 7
---

# X (Twitter) 搜索

`x_search` 工具允许智能体直接搜索 X (Twitter) 的帖子、个人资料和话题。它由 xAI 在 `https://api.x.ai/v1/responses` 的响应 API 中内置的 `x_search` 工具支持 —— Grok 本身在服务端执行搜索，并返回带有原始帖子引用的综合性结果。

当你特别想了解 **X 上** 的最新讨论、反应或说法时，**请使用此工具代替 `web_search`**。对于一般的网页内容，请继续使用 `web_search` / `web_extract`。

:::tip
如果你已经为 xAI 模型向 Portal 付费，实时搜索调用会从同一个为聊天配置的 xAI 密钥计费。参见 [Nous Portal](/integrations/nous-portal)。
:::

## 认证

`x_search` 会在 **任一** xAI 凭证路径可用时注册：

| 凭证 | 来源 | 设置 |
|------------|--------|-------|
| **SuperGrok / X Premium+ OAuth** （首选） | 浏览器登录 `accounts.x.ai`，自动刷新 | `hermes auth add xai-oauth` — 参见 [xAI Grok OAuth (SuperGrok / X Premium+)](../../guides/xai-grok-oauth.md) |
| **`XAI_API_KEY`** | 付费 xAI API 密钥 | 在 `~/.hermes/.env` 中设置 |

两者都使用相同的端点和相同的请求体 —— 唯一的区别是承载令牌。**当两者都配置时，SuperGrok OAuth 优先**，因此 x_search 会使用你的订阅配额，而不是消耗付费 API 用量。

工具的 `check_fn` 会在每次模型的工具列表重建时运行 xAI 凭证解析器。返回 `True` 意味着承载令牌可获取且非空，并且如果已过期则能成功刷新。令牌被撤销且刷新失败时，工具会从架构中隐藏；模型根本看不到它。

## 启用工具

当存在 xAI 凭证（OAuth 令牌或 `XAI_API_KEY`）时自动启用。如果不想使用，请通过 `hermes tools` → 搜索 → x_search 显式禁用。

```bash
hermes tools
# → 🐦 X (Twitter) 搜索   (按空格切换开启)
```

选择器提供两种凭证选项：

1. **xAI Grok OAuth (SuperGrok / Premium+)** — 如果尚未登录，则打开浏览器访问 `accounts.x.ai`
2. **xAI API 密钥** — 提示输入 `XAI_API_KEY`

任一选项都满足门控条件。你可以选择已有的任一凭证；工具对两者的使用方式完全相同。如果两者最终都被配置，则在调用时优先使用 OAuth。

## 配置

```yaml
# ~/.hermes/config.yaml
x_search:
  # 用于响应调用的 xAI 模型。
  # grok-4.20-reasoning 是推荐的默认值；任何具备 x_search 工具访问权限的
  # Grok 模型均可使用。
  model: grok-4.20-reasoning

  # 请求超时时间（秒）。x_search 处理复杂查询可能需要 60-120 秒
  # 默认值比较宽裕。最小值：30。
  timeout_seconds: 180

  # 在 5xx / 读取超时 / 连接错误时的自动重试次数。
  # 每次重试会退避（1.5 倍尝试秒数，上限 5 秒）。
  retries: 2
```

## 工具参数

智能体使用以下参数调用 `x_search`：

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `query` | 字符串（必需） | 在 X 上搜索的内容。 |
| `allowed_x_handles` | 字符串数组 | 可选，要 **专门** 包含的用户句柄列表（最多 10 个）。开头的 `@` 会被去除。 |
| `excluded_x_handles` | 字符串数组 | 可选，要排除的用户句柄列表（最多 10 个）。与 `allowed_x_handles` 互斥。 |
| `from_date` | 字符串 | 可选，`YYYY-MM-DD` 格式的开始日期。 |
| `to_date` | 字符串 | 可选，`YYYY-MM-DD` 格式的结束日期。 |
| `enable_image_understanding` | 布尔值 | 请求 xAI 分析匹配帖子附带的图片。 |
| `enable_video_understanding` | 布尔值 | 请求 xAI 分析匹配帖子附带的视频。 |

该工具返回的 JSON 包含：

- `answer` — 来自 Grok 的综合性文本响应
- `citations` — 由响应 API 顶层字段返回的引用
- `inline_citations` — 从消息体中提取的 `url_citation` 注释（每条包含 `url`、`title`、`start_index`、`end_index`）
- `degraded` — 当设置了任何筛选条件（`allowed_x_handles`、`excluded_x_handles`、`from_date`、`to_date`）**并且**两个引用渠道均返回空时，该值为 `true`。此时 `answer` 是基于模型自身知识而非 X 索引合成的，因此应视为无来源。其他情况（包括“未设置筛选条件” —— 一个广泛的无来源答案就是答案，而非筛选失败）为 `false`
- `degraded_reason` — 简短字符串，说明哪些筛选条件处于活动状态，或当 `degraded` 为 `false` 时为 `null`
- `credential_source` — 如果 OAuth 解析成功则为 `"xai-oauth"`，如果 API 密钥解析成功则为 `"xai"`
- `model`、`query`、`provider`、`tool`、`success`

### 日期验证

`from_date` / `to_date` 在客户端 HTTP 调用前进行验证：

- 如果提供，两者都必须解析为 `YYYY-MM-DD` 格式。
- 当两者都设置时，`from_date` 必须早于或等于 `to_date`。
- `from_date` 不得晚于今天的 UTC 时间 —— 在尚未开始的窗口期不可能存在帖子，因此调用保证会返回零引用。
- `to_date` 允许设为未来（调用者可能合理地请求“从昨天到明天”以捕获到达的帖子）。

验证失败会作为结构化的 `{"error": "..."}` 工具结果返回，绝不会作为指向 xAI 的 HTTP 调用。

## 示例

与智能体对话：

> X 上的人们对新的 Grok 图片功能怎么说？重点关注来自 @xai 的回复。

智能体将：

1. 使用 `query="对新 Grok 图片功能的反应"`, `allowed_x_handles=["xai"]` 调用 `x_search`
2. 获取综合答案以及链接到特定帖子的引用列表
3. 回复答案及参考

## 故障排除

### “No xAI credentials available”（无 xAI 凭证可用）

当两条认证路径都失败时，工具会显示此消息。请在 `~/.hermes/.env` 中设置 `XAI_API_KEY`，或运行 `hermes auth add xai-oauth` 并完成浏览器登录。然后重启会话，以便智能体重新读取工具注册表。

### "`x_search` is not enabled for this model"（此模型未启用 x_search）

配置的 `x_search.model` 没有访问服务端 `x_search` 工具的权限。请切换到 `grok-4.20-reasoning`（默认值）或其他支持该功能的 Grok 模型。请查看 [xAI 文档](https://docs.x.ai/) 了解当前支持的模型列表。

### 工具未出现在架构中

可能有两个原因：

1. **工具集未启用。** 运行 `hermes tools` 并确认 `🐦 X (Twitter) 搜索` 已被选中（打钩）。
2. **无 xAI 凭证。** `check_fn` 返回 False，因此架构保持隐藏。运行 `hermes auth status` 确认 xai-oauth 登录状态，并检查 `XAI_API_KEY` 是否已设置（如果使用 API 密钥路径）。

### `degraded: true` — 无引用的答案

当你使用了 `allowed_x_handles`、`excluded_x_handles` 或日期范围，并且响应返回 `degraded: true` 时，表示 xAI 的 X 索引未返回匹配的帖子，但 Grok 仍根据其自身训练数据生成了综合答案。该答案无来源 —— 不要将其视为真实的 X 结果。

值得检查的原因：

- **用户句柄输入错误。** 去掉 `@`，仔细检查拼写，并确认账户存在。
- **日期范围过窄** 或已滑过今天的帖子；扩大范围并重试。
- **xAI 索引缺口。** 一些活跃账户即使定期发帖，也偶尔无法在 `x_search` 中显示。请在几分钟后重试，或者当你需要特定用户的时间线时，使用 `xurl` 技能直接进行 X API 读取。

## 另请参阅

- [xAI Grok OAuth (SuperGrok / Premium+)](../../guides/xai-grok-oauth.md) — OAuth 设置指南
- [网页搜索与提取](web-search.md) — 用于一般（非 X）网页搜索
- [工具参考](../../reference/tools-reference.md) — 完整工具目录