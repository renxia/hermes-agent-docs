---
title: "Shopify — 通过 curl 调用 Shopify 管理与 storefront GraphQL API"
sidebar_label: "Shopify"
description: "通过 curl 调用 Shopify 管理与 storefront GraphQL API"
---

{/* 此页面由网站脚本 generate-skill-docs.py 从技能文件 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Shopify

通过 curl 调用 Shopify 管理与 storefront GraphQL API。产品、订单、客户、库存、元字段。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/productivity/shopify` 安装 |
| 路径 | `optional-skills/productivity/shopify` |
| 版本 | `1.0.0` |
| 作者 | 社区 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Shopify`, `电子商务`, `商业`, `API`, `GraphQL` |
| 相关技能 | [`airtable`](/user-guide/skills/bundled/productivity/productivity-airtable), [`xurl`](/user-guide/skills/bundled/social-media/social-media-xurl) |

:::info
以下是Hermes在此技能激活时加载的完整技能定义。这是该技能活动时智能体看到的指示。
:::

# Shopify — 管理员与商店前台 GraphQL API

通过 `curl` 直接操作 Shopify 商店：列出产品、管理库存、拉取订单、更新客户信息、读取自定义元字段。无需 SDK，无需应用框架——只需 GraphQL 端点和自定义应用访问令牌。

REST 管理 API 自 2024 年 4 月起已进入维护模式，仅接收安全修复。**所有管理员工作请使用 GraphQL 管理 API**。对于面向客户的只读查询（产品、集合、购物车），请使用 **商店前台 GraphQL**。

## 前提条件

1.  在 Shopify 管理员后台：**设置 → 应用和销售渠道 → 开发应用 → 创建应用**。
2.  点击**配置管理 API 范围**，根据需要选择（示例见下文），然后保存。
3.  **安装应用** → 管理 API 访问令牌将**仅显示一次**。立即复制它——Shopify 永远不会再次显示该令牌。令牌以 `shpat_` 开头。
4.  保存到 `~/.hermes/.env`：
    ```
    SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxx
    SHOPIFY_STORE_DOMAIN=my-store.myshopify.com
    SHOPIFY_API_VERSION=2026-01
    ```

> **注意：** 截至 2026 年 1 月 1 日，在 Shopify 管理员后台中创建的新的“传统自定义应用”将不复存在。新设置应使用**开发控制台** (`shopify.dev/docs/apps/build/dev-dashboard`)。现有在管理员后台创建的应用将继续工作。如果用户在 2026-01-01 之后且其商店没有现有的自定义应用，请引导他们前往开发控制台，而不是管理员后台流程。

按任务划分的常见范围：
-   产品 / 集合：`read_products`, `write_products`
-   库存：`read_inventory`, `write_inventory`, `read_locations`
-   订单：`read_orders`, `write_orders`（无 `read_all_orders` 时显示最近 30 个）
-   客户：`read_customers`, `write_customers`
-   草稿订单：`read_draft_orders`, `write_draft_orders`
-   履行：`read_fulfillments`, `write_fulfillments`
-   元字段 / 元对象：包含在相应资源的范围内

## API 基础

-   **端点：** `https://$SHOPIFY_STORE_DOMAIN/admin/api/$SHOPIFY_API_VERSION/graphql.json`
-   **认证头：** `X-Shopify-Access-Token: $SHOPIFY_ACCESS_TOKEN`（**不是** `Authorization: Bearer`）
-   **方法：** 总是 `POST`，总是 `Content-Type: application/json`，请求体是 `{"query": "...", "variables": {...}}`
-   **HTTP 200 并不意味着成功。** GraphQL 会在顶级的 `errors` 数组和字段级的 `userErrors` 中返回错误。两者都需要检查。
-   **ID 是 GID 字符串：** `gid://shopify/Product/10079467700516`, `gid://shopify/Variant/...`, `gid://shopify/Order/...`。原样传递——不要去掉前缀。
-   **速率限制：** 通过查询成本计算（漏桶算法）。每个响应都有 `extensions.cost`，包含 `requestedQueryCost`、`actualQueryCost`、`throttleStatus.{currentlyAvailable, maximumAvailable, restoreRate}`。当 `currentlyAvailable` 低于你下一个查询的成本时，请后退。标准商店 = 100 点桶容量，50/秒恢复；Plus = 1000/100。

基础 curl 模式（可重用）：

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

通过 `jq` 管道以获得可读输出。`-sS` 可保持错误可见但隐藏进度条。

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

### 搜索产品（前 20 个匹配查询项）
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

### 分页产品（游标）
```bash
shop_gql '
query($cursor: String) {
  products(first: 100, after: $cursor) {
    edges { cursor node { id handle } }
    pageInfo { hasNextPage endCursor }
  }
}' '{"cursor":null}'
# 后续调用：传递前一个 endCursor
```

### 获取一个产品及其变体 + 元字段
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

### 创建一个带有一个变体的产品
```bash
shop_gql '
mutation($input: ProductCreateInput!) {
  productCreate(product: $input) {
    product { id handle }
    userErrors { field message }
  }
}' '{"input":{"title":"Test Hoodie","status":"DRAFT","vendor":"Hermes","productType":"Apparel","tags":["test"]}}'
```

在最新版本中，变体现在有自己的变更操作：

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

### 列出最近的订单（默认无 `read_all_orders` 时为最近 30 个）
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

### 获取一个包含收货地址的订单
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

库存存在于与变体关联的**库存项目**上，按**地点**跟踪数量。

```bash
# 获取一个变体在所有地点的库存
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

# 元字段与元对象

元字段将自定义数据附加到资源（产品、客户、订单、商店）上。

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

# 写入（适用于任何所有者类型）
shop_gql '
mutation($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields { id key namespace }
    userErrors { field message code }
  }
}' '{"metafields":[{"ownerId":"gid://shopify/Product/...","namespace":"custom","key":"care_instructions","type":"multi_line_text_field","value":"Wash cold. Tumble dry low."}]}'
```

## 店铺前台 API（公共只读）

端点不同，令牌不同，用于面向客户的应用程序/类似 Hydrogen 的无头架构。头部信息不同：

- **端点：** `https://$SHOPIFY_STORE_DOMAIN/api/$SHOPIFY_API_VERSION/graphql.json`
- **认证头（公共）：** `X-Shopify-Storefront-Access-Token: <公共令牌>` — 可嵌入浏览器
- **认证头（私有）：** `Shopify-Storefront-Private-Token: <私有令牌>` — 仅限服务器端

```bash
curl -sS -X POST \
  "https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION:-2026-01}/graphql.json" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Storefront-Access-Token: ${SHOPIFY_STOREFRONT_TOKEN}" \
  -d '{"query":"{ shop { name } products(first: 5) { edges { node { id title handle } } } }"}' | jq
```

## 批量操作

适用于超出速率限制的大规模数据转储（完整产品目录、一年内的所有订单）：

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

每一行 JSONL 是一个节点，嵌套连接会作为单独的行发出，并带有 `__parentId`。如果需要，可在客户端重新组装。

## Webhooks

订阅事件，这样您就不必轮询：

```bash
shop_gql '
mutation($topic: WebhookSubscriptionTopic!, $sub: WebhookSubscriptionInput!) {
  webhookSubscriptionCreate(topic: $topic, webhookSubscription: $sub) {
    webhookSubscription { id topic endpoint { __typename ... on WebhookHttpEndpoint { callbackUrl } } }
    userErrors { field message }
  }
}' '{"topic":"ORDERS_CREATE","sub":{"callbackUrl":"https://example.com/webhook","format":"JSON"}}'
```

使用应用程序的客户端密钥（不是访问令牌）验证传入的 Webhook HMAC：

```bash
echo -n "$REQUEST_BODY" | openssl dgst -sha256 -hmac "$APP_SECRET" -binary | base64
# 与 X-Shopify-Hmac-Sha256 头进行比较
```

## 常见陷阱

- **REST 端点仍然存在但已冻结。** 不要针对 `/admin/api/.../products.json` 编写新的集成。请使用 GraphQL。
- **令牌格式检查。** 管理令牌以 `shpat_` 开头。店铺前台公共令牌以 `shpua_` 开头。如果您拥有其中一个但使用了错误的头部，每个请求都会返回 401，并且响应体没有有用的错误信息。
- **使用有效令牌出现 403 = 缺少权限范围。** Shopify 返回 `{"errors":[{"message":"Access denied for ..."}]}`。在应用程序上重新配置管理 API 权限范围，然后重新安装以重新生成令牌。
- **`userErrors` 为空 ≠ 成功。** 同时检查 `data.<mutation>.<resource>` 是否非空。某些失败不会填充任何字段 — 请检查整个响应。
- **GID 与数字 ID。** 旧版 REST 使用数字 ID；GraphQL 需要完整的 GID 字符串。转换方法：`gid://shopify/Product/<numeric>`。
- **速率限制意外情况。** 单个 `products(first: 250)` 与深度嵌套组合可能消耗 1000+ 点数，并在标准套餐的商店上立即触发限制。从较小请求开始，读取 `extensions.cost`，并进行调整。
- **分页顺序。** `products(first: N, reverse: true)` 按 `id DESC` 排序，而不是 `created_at`。要实现"最新优先"，请使用 `sortKey: CREATED_AT, reverse: true`。
- **历史数据的 `read_all_orders` 权限。** 没有它，`orders(...)` 会静默地限制在 60 天窗口内。您不会收到错误，只是结果比预期的少。对于拥有大量订单的 Shopify Plus 商家，请通过应用程序的受保护数据设置请求此权限范围。
- **货币是字符串形式。** 金额以 `"49.00"` 而非 `49.0` 的形式返回。如果您关心前导零填充，请勿盲目使用 `jq tonumber`。
- **多币种金额字段** 包含 `shopMoney`（商店货币）和 `presentmentMoney`（客户货币）。请始终如一地选择其中一个。

## 安全须知

Shopify 中的变更是真实的——它们会创建产品、执行退款、取消订单、处理发货。在运行 `productDelete`、`orderCancel`、`refundCreate` 或任何批量变更操作之前：请明确说明更改内容、在哪个商店上操作，并与用户确认。除非用户拥有单独的开发商店，否则不存在生产数据的暂存克隆。