---
title: "Shopify — Shopify 管理后台与店铺前端 GraphQL API (curl)"
sidebar_label: "Shopify"
description: "Shopify 管理后台与店铺前端 GraphQL API (curl)"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Shopify

Shopify 管理后台与店铺前端 GraphQL API (curl)。涵盖产品、订单、客户、库存、元字段。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/productivity/shopify` 安装 |
| 路径 | `optional-skills/productivity/shopify` |
| 版本 | `1.0.0` |
| 作者 | 社区 |
| 许可 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Shopify`, `电子商务`, `商业`, `API`, `GraphQL` |
| 相关技能 | [`airtable`](/docs/user-guide/skills/bundled/productivity/productivity-airtable), [`xurl`](/docs/user-guide/skills/bundled/social-media/social-media-xurl) |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# Shopify — 管理员与店面 GraphQL API

直接通过 `curl` 与 Shopify 商店协作：列出产品、管理库存、拉取订单、更新客户、读取元字段。无需 SDK，无需应用框架——只需 GraphQL 端点和一个自定义应用访问令牌。

REST 管理员 API 自 2024-04 起已停止维护，仅接收安全修复。**请使用 GraphQL 管理员 API** 处理所有管理员工作。使用 **店面 GraphQL API** 进行面向客户的只读查询（产品、系列、购物车）。

## 前提条件

1. 在 Shopify 管理后台：**设置 → 应用和销售渠道 → 开发应用 → 创建应用**。
2. 点击**配置管理员 API 范围**，选择您需要的权限（示例如下），保存。
3. **安装应用** → 管理员 API 访问令牌将**仅显示一次**。请立即复制——Shopify 不会再次显示。令牌以 `shpat_` 开头。
4. 保存至 `~/.hermes/.env`：
   ```
   SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxx
   SHOPIFY_STORE_DOMAIN=my-store.myshopify.com
   SHOPIFY_API_VERSION=2026-01
   ```

> **注意：** 自 2026 年 1 月 1 日起，在 Shopify 管理后台创建的"旧版自定义应用"将不复存在。新设置应使用 **开发者控制台** (`shopify.dev/docs/apps/build/dev-dashboard`)。已存在的管理员创建应用将继续工作。如果用户的商店没有现有的自定义应用且日期在 2026-01-01 之后，请引导他们前往开发者控制台，而不是使用管理员流程。

按任务划分的常用范围：
- 产品 / 系列：`read_products`、`write_products`
- 库存：`read_inventory`、`write_inventory`、`read_locations`
- 订单：`read_orders`、`write_orders`（没有 `read_all_orders` 则只能访问最近 30 个）
- 客户：`read_customers`、`write_customers`
- 草稿订单：`read_draft_orders`、`write_draft_orders`
- 履行：`read_fulfillments`、`write_fulfillments`
- 元字段 / 元对象：由匹配的资源范围覆盖

## API 基础

- **端点：** `https://$SHOPIFY_STORE_DOMAIN/admin/api/$SHOPIFY_API_VERSION/graphql.json`
- **认证头：** `X-Shopify-Access-Token: $SHOPIFY_ACCESS_TOKEN`（**非** `Authorization: Bearer`）
- **方法：** 始终为 `POST`，始终设置 `Content-Type: application/json`，请求体为 `{"query": "...", "variables": {...}}`
- **HTTP 200 不代表成功。** GraphQL 在顶层 `errors` 数组和每个字段的 `userErrors` 中返回错误。务必检查两者。
- **ID 是 GID 字符串：** `gid://shopify/Product/10079467700516`、`gid://shopify/Variant/...`、`gid://shopify/Order/...`。原样传递这些 ID——不要去掉前缀。
- **速率限制：** 通过查询成本计算（漏桶算法）。每个响应都包含 `extensions.cost`，其中有 `requestedQueryCost`、`actualQueryCost`、`throttleStatus.{currentlyAvailable, maximumAvailable, restoreRate}`。当 `currentlyAvailable` 低于您下一个查询的成本时，请放慢速度。标准商店 = 100 点容量，每秒恢复 50 点；Plus 版 = 1000/100。

基础 curl 模式（可复用）：

```bash
shop_gql() {
  local query="$1"
  local variables="${2:-{}}"
  curl -sS -X POST \
    "https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION:-2026-01}/graphql.json" \
    -H "Content-Type: application/json" \
    -H "X-Shopify-Access-Token: ${SHOPIFY_ACCESS_TOKEN}" \
    --data "$(jq -nc --arg q "$query" --argjson v "$variables" '{query: $q, variables: $v}')"
}
```

通过管道传递给 `jq` 以获得可读输出。`-sS` 保持错误可见但隐藏进度条。

## 发现

### 商店信息 + 当前 API 版本
```bash
shop_gql '{ shop { name myshopifyDomain primaryDomain { url } currencyCode plan { displayName } } }' | jq
```

### 列出所有支持的 API 版本
```bash
shop_gql '{ publicApiVersions { handle supported } }' | jq '.data.publicApiVersions[] | select(.supported)'
```

## 产品

### 搜索产品（前 20 个匹配结果）
```bash
shop_gql '
query($q: String!) {
  products(first: 20, query: $q) {
    edges { node { id title handle status totalInventory variants(first: 5) { edges { node { id sku price inventoryQuantity } } } } }
    pageInfo { hasNextPage endCursor }
  }
}' '{"q":"hoodie status:active"}' | jq
```

查询语法支持 `title:`、`sku:`、`vendor:`、`product_type:`、`status:active`、`tag:`、`created_at:>2025-01-01`。完整语法：https://shopify.dev/docs/api/usage/search-syntax

### 分页查询产品（游标）
```bash
shop_gql '
query($cursor: String) {
  products(first: 100, after: $cursor) {
    edges { cursor node { id handle } }
    pageInfo { hasNextPage endCursor }
  }
}' '{"cursor":null}'
# 后续调用：传入上一次的 endCursor
```

### 获取包含变体和元字段的产品
```bash
shop_gql '
query($id: ID!) {
  product(id: $id) {
    id title handle descriptionHtml tags status
    variants(first: 20) { edges { node { id sku price compareAtPrice inventoryQuantity selectedOptions { name value } } } }
    metafields(first: 20) { edges { node { namespace key type value } } }
  }
}' '{"id":"gid://shopify/Product/10079467700516"}' | jq
```

### 创建带有一个变体的产品
```bash
shop_gql '
mutation($input: ProductCreateInput!) {
  productCreate(product: $input) {
    product { id handle }
    userErrors { field message }
  }
}' '{"input":{"title":"Test Hoodie","status":"DRAFT","vendor":"Hermes","productType":"Apparel","tags":["test"]}}'
```

在较新版本中，变体现在有其自己的变更操作：

```bash
# 创建产品后添加变体
shop_gql '
mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkCreate(productId: $productId, variants: $variants) {
    productVariants { id sku price }
    userErrors { field message }
  }
}' '{"productId":"gid://shopify/Product/...","variants":[{"optionValues":[{"optionName":"Size","name":"M"}],"price":"49.00","inventoryItem":{"sku":"HD-M","tracked":true}}]}'
```

### 更新价格 / SKU
```bash
shop_gql '
mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    productVariants { id sku price }
    userErrors { field message }
  }
}' '{"productId":"gid://shopify/Product/...","variants":[{"id":"gid://shopify/ProductVariant/...","price":"55.00"}]}'
```

## 订单

### 列出最近的订单（默认情况下，没有 `read_all_orders` 则显示最近 30 个）
```bash
shop_gql '
{
  orders(first: 20, reverse: true, query: "financial_status:paid") {
    edges { node {
      id name createdAt displayFinancialStatus displayFulfillmentStatus
      totalPriceSet { shopMoney { amount currencyCode } }
      customer { id displayName email }
      lineItems(first: 10) { edges { node { title quantity sku } } }
    } }
  }
}' | jq
```

有用的订单查询过滤器：`financial_status:paid|pending|refunded`、`fulfillment_status:unfulfilled|fulfilled`、`created_at:>2025-01-01`、`tag:gift`、`email:foo@example.com`。

### 获取包含收货地址的单个订单
```bash
shop_gql '
query($id: ID!) {
  order(id: $id) {
    id name email
    shippingAddress { name address1 address2 city province country zip phone }
    lineItems(first: 50) { edges { node { title quantity variant { sku } originalUnitPriceSet { shopMoney { amount currencyCode } } } } }
    transactions { id kind status amountSet { shopMoney { amount currencyCode } } }
  }
}' '{"id":"gid://shopify/Order/...."}' | jq
```

## 客户

```bash
# 搜索
shop_gql '
{
  customers(first: 10, query: "email:*@example.com") {
    edges { node { id email displayName numberOfOrders amountSpent { amount currencyCode } } }
  }
}'

# 创建
shop_gql '
mutation($input: CustomerInput!) {
  customerCreate(input: $input) {
    customer { id email }
    userErrors { field message }
  }
}' '{"input":{"email":"test@example.com","firstName":"Test","lastName":"User","tags":["api-created"]}}'
```

## 库存

库存存储在与变体关联的 **库存项目** 上，数量按 **地点** 跟踪。

```bash
# 获取某个变体在所有地点的库存
shop_gql '
query($id: ID!) {
  productVariant(id: $id) {
    id sku
    inventoryItem {
      id tracked
      inventoryLevels(first: 10) {
        edges { node { location { id name } quantities(names: ["available","on_hand","committed"]) { name quantity } } }
      }
    }
  }
}' '{"id":"gid://shopify/ProductVariant/..."}'
```

调整库存（增量）——使用 `inventoryAdjustQuantities`：

```bash
shop_gql '
mutation($input: InventoryAdjustQuantitiesInput!) {
  inventoryAdjustQuantities(input: $input) {
    inventoryAdjustmentGroup { reason changes { name delta } }
    userErrors { field message }
  }
}' '{
  "input": {
    "reason": "correction",
    "name": "available",
    "changes": [{"delta": 5, "inventoryItemId": "gid://shopify/InventoryItem/...", "locationId": "gid://shopify/Location/..."}]
  }
}'
```

设置绝对库存（非增量）——`inventorySetQuantities`：

```bash
shop_gql '
mutation($input: InventorySetQuantitiesInput!) {
  inventorySetQuantities(input: $input) {
    inventoryAdjustmentGroup { id }
    userErrors { field message }
  }
}' '{"input":{"reason":"correction","name":"available","ignoreCompareQuantity":true,"quantities":[{"inventoryItemId":"gid://shopify/InventoryItem/...","locationId":"gid://shopify/Location/...","quantity":100}]}}'
```

## 元字段与元对象

元字段为资源（产品、客户、订单、商店）附加自定义数据。

```bash
# 读取
shop_gql '
query($id: ID!) {
  product(id: $id) {
    metafields(first: 10, namespace: "custom") {
      edges { node { key type value } }
    }
  }
}' '{"id":"gid://shopify/Product/..."}'

# 写入 (适用于所有者类型)
shop_gql '
mutation($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields { id key namespace }
    userErrors { field message code }
  }
}' '{"metafields":[{"ownerId":"gid://shopify/Product/...","namespace":"custom","key":"care_instructions","type":"multi_line_text_field","value":"Wash cold. Tumble dry low."}]}'
```

## 店面 API (公开只读)

不同的端点，不同的令牌，用于面向客户的应用程序/类似氢气的无头设置。请求头有所不同：

- **端点：** `https://$SHOPIFY_STORE_DOMAIN/api/$SHOPIFY_API_VERSION/graphql.json`
- **认证头（公开）：** `X-Shopify-Storefront-Access-Token: <公开令牌>` — 可嵌入浏览器
- **认证头（私有）：** `Shopify-Storefront-Private-Token: <私有令牌>` — 仅限服务器端

```bash
curl -sS -X POST \
  "https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION:-2026-01}/graphql.json" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Storefront-Access-Token: ${SHOPIFY_STOREFRONT_TOKEN}" \
  -d '{"query":"{ shop { name } products(first: 5) { edges { node { id title handle } } } }"}' | jq
```

## 批量操作

用于处理超过速率限制允许范围的大数据转储（完整产品目录、全年的所有订单）：

```bash
# 1. 启动批量查询
shop_gql '
mutation {
  bulkOperationRunQuery(query: """
    { products { edges { node { id title handle variants { edges { node { sku price } } } } } } }
  """) {
    bulkOperation { id status }
    userErrors { field message }
  }
}'

# 2. 轮询状态
shop_gql '{ currentBulkOperation { id status errorCode objectCount fileSize url partialDataUrl } }'

# 3. 当 status=COMPLETED 时，下载 JSONL 文件
curl -sS "$URL" > products.jsonl
```

每一行 JSONL 是一个节点，嵌套的连接关系会作为带有 `__parentId` 的独立行输出。如果需要，可以在客户端重新组装。

## Webhooks

订阅事件，无需轮询：

```bash
shop_gql '
mutation($topic: WebhookSubscriptionTopic!, $sub: WebhookSubscriptionInput!) {
  webhookSubscriptionCreate(topic: $topic, webhookSubscription: $sub) {
    webhookSubscription { id topic endpoint { __typename ... on WebhookHttpEndpoint { callbackUrl } } }
    userErrors { field message }
  }
}' '{"topic":"ORDERS_CREATE","sub":{"callbackUrl":"https://example.com/webhook","format":"JSON"}}'
```

使用应用程序的客户端密钥（而非访问令牌）验证传入的 Webhook HMAC：

```bash
echo -n "$REQUEST_BODY" | openssl dgst -sha256 -hmac "$APP_SECRET" -binary | base64
# 与 X-Shopify-Hmac-Sha256 请求头进行比较
```

## 常见陷阱

- **REST 端点仍然存在但已冻结。** 不要针对 `/admin/api/.../products.json` 编写新的集成。请使用 GraphQL。
- **令牌格式检查。** Admin 令牌以 `shpat_` 开头。店面公开令牌以 `shpua_` 开头。如果你拥有一个令牌但使用了错误的请求头，每个请求都会返回 401，且错误信息无用。
- **有效令牌却返回 403 = 缺少范围。** Shopify 会返回 `{"errors":[{"message":"Access denied for ..."}]}`。重新配置应用程序的 Admin API 范围，然后重新安装以重新生成令牌。
- **`userErrors` 为空不等于成功。** 还需检查 `data.<mutation>.<resource>` 是否为非空。有些失败两者都不会填充——请检查整个响应。
- **GID 与数字 ID。** 旧的 REST 返回数字 ID；GraphQL 需要完整的 GID 字符串。转换方法：`gid://shopify/Product/<numeric>`。
- **速率限制意外。** 一个带有深层嵌套的单次 `products(first: 250)` 查询可能消耗 1000+ 点数，并在标准计划商店上立即触发限流。从较小范围开始，读取 `extensions.cost`，然后进行调整。
- **分页顺序。** `products(first: N, reverse: true)` 按 `id DESC` 排序，而非 `created_at`。要获取"最新优先"，请使用 `sortKey: CREATED_AT, reverse: true`。
- **`read_all_orders` 用于历史数据。** 没有它，`orders(...)` 会静默限制在 60 天窗口内。你不会得到错误，只是结果比预期少。对于订单众多的 Shopify Plus 商家，请通过应用程序的受保护数据设置请求此范围。
- **货币是字符串。** 金额返回为 `"49.00"` 而非 `49.0`。如果在意零填充，不要盲目使用 `jq tonumber`。
- **多币种金额字段** 包含 `shopMoney`（商店币种）和 `presentmentMoney`（客户币种）。请始终选择其一。

## 安全

Shopify 中的变更操作是真实生效的——它们会创建产品、扣除退款、取消订单、处理发货。在执行 `productDelete`、`orderCancel`、`refundCreate` 或任何批量变更操作之前：请明确说明将进行什么更改、针对哪个商店，并与用户确认。除非用户拥有单独的开发商店，否则没有生产数据的暂存克隆。