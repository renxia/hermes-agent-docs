---
title: X (Twitter) 搜索
description: 通过智能体内的 xAI 内置 x_search 响应工具搜索 X (Twitter) 帖子和讨论串 —— 可使用 SuperGrok OAuth 登录或 XAI_API_KEY。
sidebar_label: X (Twitter) 搜索
sidebar_position: 7
---

# X (Twitter) 搜索

`x_search` 工具允许智能体直接搜索 X (Twitter) 的帖子、用户资料和讨论串。它由 xAI 在响应 API `https://api.x.ai/v1/responses` 上内置的 `x_search` 工具支持 —— Grok 本身会在服务器端执行搜索，并返回带有原始帖子引用的综合结果。

当你特别想获取 X **上**的当前讨论、反应或声明时，请**使用此工具替代 `web_search`**。对于一般的网页搜索，请继续使用 `web_search` / `web_extract`。

## 身份验证

当 **任一** xAI 凭据路径可用时，`x_search` 会被注册：

| 凭据 | 来源 | 设置 |
|------------|--------|-------|
| **SuperGrok / X Premium+ OAuth** (首选) | 在 `accounts.x.ai` 进行浏览器登录，自动刷新 | `hermes auth add xai-oauth` —— 参见 [xAI Grok OAuth (SuperGrok / X Premium+)](../../guides/xai-grok-oauth.md) |
| **`XAI_API_KEY`** | 付费的 xAI API 密钥 | 在 `~/.hermes/.env` 中设置 |

两者都使用相同的有效负载访问相同的端点 —— 唯一的区别是承载令牌。**当两者都配置时，SuperGrok OAuth 会胜出**，因此 x_search 会针对你的订阅配额运行，而不是消耗付费 API 额度。

该工具的 `check_fn` 会在每次模型重建工具列表时运行 xAI 凭据解析器。返回 `True` 表示承载令牌可获取、非空且（如果已过期）刷新成功。令牌被撤销且刷新失败会从架构中隐藏该工具；模型根本无法看到它。

## 启用工具

当 xAI 凭据（OAuth 令牌或 `XAI_API_KEY`）存在时自动启用。如果不希望使用此工具，请通过 `hermes tools` → 搜索 → x_search 显式禁用。

```bash
hermes tools
# → 🐦 X (Twitter) 搜索   (按空格键切换开启)
```

选择器提供两种凭据选项：

1.  **xAI Grok OAuth (SuperGrok / Premium+)** —— 如果你尚未登录，会打开浏览器至 `accounts.x.ai`
2.  **xAI API 密钥** —— 提示输入 `XAI_API_KEY`

任一选项都满足门控要求。你可以选择你已有的任何凭据；该工具对两者的工作方式完全相同。如果两者最终都已配置，则调用时 OAuth 优先。

## 配置

```yaml
# ~/.hermes/config.yaml
x_search:
  # 用于响应调用的 xAI 模型。
  # grok-4.20-reasoning 是推荐的默认值；任何具有 x_search 工具访问权限的
  # Grok 模型均可使用。
  model: grok-4.20-reasoning

  # 请求超时时间（秒）。x_search 对于复杂查询可能需要 60-120 秒
  # —— 默认值较为宽裕。最小值：30。
  timeout_seconds: 180

  # 遇到 5xx 错误 / 读取超时 / 连接错误时的自动重试次数。
  # 每次重试会退避（1.5 倍尝试秒数，上限为 5 秒）。
  retries: 2
```

## 工具参数

智能体使用以下参数调用 `x_search`：

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `query` | string (必需) | 要在 X 上查找的内容。 |
| `allowed_x_handles` | 字符串数组 | 可选的，**专门**包含的用户名列表（最多 10 个）。会去除开头的 `@`。 |
| `excluded_x_handles` | 字符串数组 | 可选的排除用户名列表（最多 10 个）。与 `allowed_x_handles` 互斥。 |
| `from_date` | string | 可选的 `YYYY-MM-DD` 格式开始日期。 |
| `to_date` | string | 可选的 `YYYY-MM-DD` 格式结束日期。 |
| `enable_image_understanding` | boolean | 请求 xAI 分析匹配帖子附带的图片。 |
| `enable_video_understanding` | boolean | 请求 xAI 分析匹配帖子附带的视频。 |

该工具返回的 JSON 包含：

- `answer` —— 来自 Grok 的综合文本响应
- `citations` —— 由响应 API 顶层字段返回的引用
- `inline_citations` —— 从消息正文中提取的 `url_citation` 注释（每条包含 `url`、`title`、`start_index`、`end_index`）
- `degraded` —— 当设置了任何缩小范围的过滤器（`allowed_x_handles`、`excluded_x_handles`、`from_date`、`to_date`）且两个引用渠道均返回空时为 `true`。此时 `answer` 是基于模型自身知识而非 X 索引综合的，因此应视为无来源。`false` 表示其他情况（包括“未设置过滤器”的情况 —— 一个宽泛的无来源回答只是回答，并非过滤器失效）。
- `degraded_reason` —— 简短字符串，指明哪些过滤器处于活动状态，当 `degraded` 为 `false` 时为 `null`
- `credential_source` —— 如果 OAuth 解析成功则为 `"xai-oauth"`，如果 API 密钥解析成功则为 `"xai"`
- `model`、`query`、`provider`、`tool`、`success`

### 日期验证

`from_date` / `to_date` 在 HTTP 调用之前会在客户端进行验证：

- 如果提供，两者都必须能解析为 `YYYY-MM-DD`。
- 当两者都设置时，`from_date` 必须早于或等于 `to_date`。
- `from_date` 不能晚于今天的 UTC 时间 —— 尚未开始的窗口期内不可能存在帖子，因此调用将保证返回零个引用。
- `to_date` 为未来时间是允许的（调用者可能合理地请求“从昨天到明天”以捕捉到达的帖子）。

验证失败会以结构化的 `{"error": "..."}` 工具结果形式呈现，而不会向 xAI 发起 HTTP 调用。

## 示例

与智能体对话：

> X 上的人们对新的 Grok 图像功能有何评论？重点关注来自 @xai 的回复。

智能体将：

1.  使用 `query="reactions to new Grok image features"` 和 `allowed_x_handles=["xai"]` 调用 `x_search`
2.  获取一个综合答案以及一个指向特定帖子的引用列表
3.  回复答案和参考文献

## 故障排除

### "No xAI credentials available"

当两种身份验证路径都失败时，工具会显示此信息。可以在 `~/.hermes/.env` 中设置 `XAI_API_KEY`，或者运行 `hermes auth add xai-oauth` 并完成浏览器登录。然后重启你的会话，以便智能体重新读取工具注册表。

### "`x_search` is not enabled for this model"

配置的 `x_search.model` 无权访问服务器端的 `x_search` 工具。请切换到 `grok-4.20-reasoning`（默认值）或其他支持它的 Grok 模型。请查看 [xAI 文档](https://docs.x.ai/) 以获取当前支持列表。

### 工具未出现在架构中

两种可能的原因：

1.  **工具集未启用。** 运行 `hermes tools` 并确认 `🐦 X (Twitter) 搜索` 已被勾选。
2.  **没有 xAI 凭据。** `check_fn` 返回 False，因此架构保持隐藏。运行 `hermes auth status` 以确认 xai-oauth 登录状态，并检查 `XAI_API_KEY` 是否已设置（如果你使用 API 密钥路径）。

### `degraded: true` —— 无引用的回答

当你使用了 `allowed_x_handles`、`excluded_x_handles` 或日期范围，并且响应返回 `degraded: true` 时，表示 xAI 的 X 索引没有返回匹配的帖子，但 Grok 仍然基于其自身的训练数据生成了综合答案。该答案无来源 —— 不要将其视为真正的 X 结果。

值得检查的原因：

-  **用户名拼写错误。** 去掉 `@`，仔细检查拼写，并确认该账户存在。
-  **日期范围过窄** 或已滑过今天的帖子；请加宽范围并重试。
-  **xAI 索引间隙。** 即使某些活跃账户定期发帖，它们偶尔也无法在 `x_search` 中显示出来。请在几分钟后重试，或者在你需要确切用户名的时间线时，使用 `xurl` 技能进行直接的 X API 读取。

## 另请参阅

- [xAI Grok OAuth (SuperGrok / Premium+)](../../guides/xai-grok-oauth.md) —— OAuth 设置指南
- [网络搜索与提取](web-search.md) —— 用于通用（非 X）网页搜索
- [工具参考](../../reference/tools-reference.md) —— 完整工具目录