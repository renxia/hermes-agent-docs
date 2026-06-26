---
title: "Shopify — 通过curl访问Shopify Admin和Storefront GraphQL API"
sidebar_label: "Shopify"
description: "通过curl访问Shopify Admin和Storefront GraphQL API"
---

{/* 此页面是由网站/脚本/generate-skill-docs.py根据技能的SKILL.md自动生成的。请编辑源文件SKILL.md，而不是本页面。 */}

# Shopify

通过curl访问Shopify Admin和Storefront GraphQL API。包括产品、订单、客户、库存和元字段。

## Skill metadata

| | |
|---|---|
| Source | 可选 — 使用`hermes skills install official/productivity/shopify`安装 |
| Path | `optional-skills/productivity/shopify` |
| Version | `1.0.0` |
| Author | 社区 |
| License | MIT |
| Platforms | Linux, macOS, Windows |
| Tags | `Shopify`, `电子商务`, `商业`, `API`, `GraphQL` |
| Related skills | [`airtable`](/docs/user-guide/skills/bundled/productivity/productivity-airtable), [`xurl`](/docs/user-guide/skills/bundled/social-media/social-media-xurl) |

## 关键路径和配置

```
~/.hermes/config.yaml       主配置文件
~/.hermes/.env              API密钥和秘密信息（如果设置了 $HERMES_HOME）
$HERMES_HOME
```

# Shopify — 管理后台和前端 GraphQL API

通过 `curl` 直接操作 Shopify 商店：列出产品、管理库存、拉取订单、更新客户、读取元字段。无需 SDK，无需应用框架——只需要 GraphQL 端点和一个自定义应用的访问令牌。

REST 管理 API 自 2024-04 起已是遗留系统，仅接收安全修复。**请使用 GraphQL 管理后台**进行所有管理工作。对于只读的面向客户查询（产品、集合、购物车），请使用 **前端 GraphQL**。

## 先决条件

1. 在 Shopify 管理后台：**设置 → 应用和销售渠道 → 开发应用 → 创建应用**。
2. 点击**配置管理 API 范围**，选择所需的权限（示例见下文），保存。
3. **安装应用** → 管理 API 访问令牌将**仅显示一次**。立即复制它——Shopify 永不会再次显示它。令牌以 `shpat_` 开头。
4. 保存到 `${HERMES_HOME:-~/.hermes}/.env`：
   ```
   SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxx
   SHOPIFY_STORE_DOMAIN=my-store.myshopify.com
   SHOPIFY_API_VERSION=2026-01
   ```

> **注意事项：** 从 2026 年 1 月 1 日起，在 Shopify 管理后台创建的新的“遗留自定义应用”将被移除。新设置应使用**开发仪表板**（`shopify.dev/docs/apps/build/dev-dashboard`）。现有的管理员创建的应用仍可正常工作。如果用户的商店没有现有自定义应用，并且时间超过 2026-01-01，则应将他们引导至开发仪表板，而不是通过管理后台流程。

按任务划分的常用权限范围：
- 产品/集合：`read_products`, `write_products`
- 库存：`read_inventory`, `write_inventory`, `read_locations`
- 订单：`read_orders`, `write_orders`（不带 `read_all_orders` 的情况下，限制为最近 30 个）
- 客户：`read_customers`, `write_customers`
- 草稿订单：`read_draft_orders`, `write_draft_orders`
- 履约：`read_fulfillments`, `write_fulfillments`
- 元字段/元对象：由匹配的资源范围覆盖

## API 基础知识

- **端点 (Endpoint):** `https://$SHOPIFY_STORE_DOMAIN/admin/api/$SHOPIFY_API_VERSION/graphql.json`
- **认证头 (Auth header):** `X-Shopify-Access-Token: $SHOPIFY_ACCESS_TOKEN`（而不是 `Authorization: Bearer`）
- **方法 (Method):** 始终是 `POST`，始终使用 `Content-Type: application/json`，请求体为 `{"query": "...", "variables": {...}}`
- **HTTP 200 不代表成功。** GraphQL 会在顶层的 `errors` 数组和每个字段的 `userErrors` 中返回错误。务必检查两者。
- **ID 是 GID 字符串：** 例如 `gid://shopify/Product/10079467700516`, `gid://shopify/Variant/...`, `gid://shopify/Order/...`。请原样传递这些 ID——不要剥离前缀。
- **速率限制 (Rate limit):** 通过查询成本计算（漏桶）。每个响应都包含 `extensions.cost`，其中有 `requestedQueryCost`、`actualQueryCost` 和 `throttleStatus.{currentlyAvailable, maximumAvailable, restoreRate}`。当 `currentlyAvailable` 低于下一次查询的成本时，应进行退避 (Back off)。标准商店 = 100 点桶，50/秒恢复；Plus = 1000/100。

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

通过 `jq` 管道传输以获得可读的输出。`-sS` 可以显示错误但会隐藏进度条。

## 发现信息 (Discovery)

### 商店信息 + 当前 API 版本
```bash
shop_gql '{ shop { name myshopifyDomain primaryDomain { url } currencyCode plan { displayName } } }' | jq
```

### 列出所有支持的 API 版本
```bash
shop_gql '{ publicApiVersions { handle supported } }' | jq '.data.publicApiVersions[] | select(.supported)'
```

## 产品 (Products)

### 搜索产品（匹配查询的前 20 个）
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
# 后续调用：传递上一个 endCursor
```

### 获取带变体和元字段的产品
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

### 创建一个带有一个变体（variant）的产品
```bash
shop_gql '
mutation($input: ProductCreateInput!) {
  productCreate(product: $input) {
    product { id handle }
    userErrors { field message }
  }
}' '{"input":{"title":"Test Hoodie","status":"DRAFT","vendor":"Hermes","productType":"Apparel","tags":["test"]}}'
```

在最近的版本中，变体现在有自己的突变 (mutations)：

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

## 订单 (Orders)

### 列出最近的订单（默认情况下，不带 `read_all_orders` 的限制为最近 30 个）
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

有用的订单查询过滤器：`financial_status:paid|pending|refunded`，`fulfillment_status:unfulfilled|fulfilled`，`created_at:>2025-01-01`，`tag:gift`，`email:foo@example.com`。

### 获取带配送地址的单个订单
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

## 客户 (Customers)

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

## 库存 (Inventory)

库存存在于与变体绑定的**库存项目 (inventory items)** 上，数量按**地点 (location)** 进行追踪。

```bash
# 获取跨所有地点的变体库存
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

调整库存量（增量）— 使用 `inventoryAdjustQuantities`：

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

设置绝对库存量（非增量）— `inventorySetQuantities`：

```bash
shop_gql '
mutation($input: InventorySetQuantitiesInput!) {
  inventorySetQuantities(input: $input) {
    inventoryAdjustmentGroup { id }
    userErrors { field message }
  }
}' '{"input":{"reason":"correction","name":"available","ignoreCompareQuantity":true,"quantities":[{"inventoryItemId":"gid://shopify/InventoryItem/...","locationId":"gid://shopify/Location/...","quantity":100}]}}'
```

## 元字段和元对象 (Metafields & Metaobjects)

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

## 前端 API（公共只读）

不同的端点，不同的令牌，用于面向客户的应用/Hydrogen 风格的无头 (headless) 设置。头部信息不同：

- **端点:** `https://$SHOPIFY_STORE_DOMAIN/api/$SHOPIFY_API_VERSION/graphql.json`
- **认证头（公共）:** `X-Shopify-Storefront-Access-Token: <public token>` — 可嵌入浏览器
- **认证头（私有）:** `Shopify-Storefront-Private-Token: <private token>` — 仅限服务器端

```bash
curl -sS -X POST \
  "https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION:-2026-01}/graphql.json" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Storefront-Access-Token: ${SHOPIFY_STOREFRONT_TOKEN}" \
  -d '{"query":"{ shop { name } products(first: 5) { edges { node { id title handle } } } }"}' | jq
```

## 批量操作 (Bulk Operations)

对于超出速率限制的超大数据量（完整产品目录、一年的所有订单）：

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

每个 JSONL 行都是一个节点，嵌套的连接以带有 `__parentId` 的单独行形式发出。如有需要，请在客户端重新组装。

## Webhooks

订阅事件，这样您就不需要轮询（polling）：

```bash
shop_gql '
mutation($topic: WebhookSubscriptionTopic!, $sub: WebhookSubscriptionInput!) {
  webhookSubscriptionCreate(topic: $topic, webhookSubscription: $sub) {
    webhookSubscription { id topic endpoint { __typename ... on WebhookHttpEndpoint { callbackUrl } } }
    userErrors { field message }
  }
}' '{"topic":"ORDERS_CREATE","sub":{"callbackUrl":"https://example.com/webhook","format":"JSON"}}'
```

使用应用的客户端密钥（而不是访问令牌）来验证传入的 webhook HMAC：

```bash
echo -n "$REQUEST_BODY" | openssl dgst -sha256 -hmac "$APP_SECRET" -binary | base64
# 与 X-Shopify-Hmac-Sha256 标头进行比较
```

## 潜在陷阱 (Pitfalls)

- **REST 端点仍然存在，但已冻结。** 不要针对 `/admin/api/.../products.json` 编写新的集成。请使用 GraphQL。
- **令牌格式检查。** 管理员令牌以 `shpat_` 开头。商店前端公共令牌以 `shpua_` 开头。如果您使用了错误的令牌和标头，所有请求都会返回 401，但不会有有用的错误体。
- **有效的令牌但返回 403 = 缺少权限范围 (scope)。** Shopify 会返回 `{"errors":[{"message":"Access denied for ..."}]}`。请重新配置应用的管理员 API 权限范围，然后重新安装以生成新的令牌。
- **`userErrors` 为空 != 成功。** 还应检查 `data.<mutation>.<resource>` 是否不为空。有些失败情况都不会填充这两项——请检查完整的响应。
- **GID 与数字 ID。** 旧的 REST API 使用数字 ID；而 GraphQL 需要完整的 GID 字符串。转换方法：`gid://shopify/Product/<numeric>`。
- **速率限制惊喜。** 单个包含深度嵌套的 `products(first: 250)` 可能会消耗 1000+ 点，并立即导致标准计划商店被限速。请从窄范围开始，阅读 `extensions.cost`，然后进行调整。
- **分页顺序。** `products(first: N, reverse: true)` 是按 `id DESC` 排序的，而不是按 `created_at` 排序。要实现“最新的在前”，请使用 `sortKey: CREATED_AT, reverse: true`。
- **历史数据的 `read_all_orders`。** 如果没有此权限，`orders(...)` 会静默地限制在 60 天的窗口内。您不会收到错误，只会得到比预期更少的结果。对于拥有大量订单的 Shopify Plus 商户，请通过应用的受保护数据设置请求此权限范围。
- **货币是字符串。** 金额返回的是 `"49.00"` 而不是 `49.0`。如果您关心零填充，请不要盲目地使用 `jq tonumber`。
- **多币种 Money 字段** 有 `shopMoney`（商店的货币）和 `presentmentMoney`（客户的）。请保持一致性，选择其中一个。

## 安全 (Safety)

Shopify 中的变更（Mutations）是真实的——它们会创建产品、收取退款、取消订单、发送履行通知。在运行 `productDelete`、`orderCancel`、`refundCreate` 或任何批量变更之前：请清楚地说明更改内容、涉及哪个商店，并与用户进行确认。除非用户拥有独立的开发商店，否则不存在生产数据的分阶段（staging clone）。