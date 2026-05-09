---
title: "Polymarket — 查询 Polymarket：市场、价格、订单簿、历史"
sidebar_label: "Polymarket"
description: "查询 Polymarket：市场、价格、订单簿、历史"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Polymarket

查询 Polymarket：市场、价格、订单簿、历史。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/research/polymarket` |
| 版本 | `1.0.0` |
| 作者 | Hermes Agent + Teknium |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Polymarket — 预测市场数据

使用 Polymarket 的公共 REST API 查询预测市场数据。
所有端点均为只读，无需身份验证。

有关完整的端点参考及 curl 示例，请参阅 `references/api-endpoints.md`。

## 何时使用

- 用户询问预测市场、投注赔率或事件概率
- 用户想知道“X 发生的赔率是多少？”
- 用户特别询问 Polymarket
- 用户想要市场价格、订单簿数据或价格历史
- 用户要求监控或跟踪预测市场走势

## 关键概念

- **事件** 包含一个或多个 **市场**（一对多关系）
- **市场** 是二元结果，其“是/否”价格介于 0.00 到 1.00 之间
- 价格即概率：价格 0.65 表示市场认为有 65% 的可能性
- `outcomePrices` 字段：JSON 编码的数组，如 `["0.80", "0.20"]`
- `clobTokenIds` 字段：用于价格/订单簿查询的两个代币 ID [是, 否] 的 JSON 编码数组
- `conditionId` 字段：用于价格历史查询的十六进制字符串
- 交易量以 USDC（美元）计

## 三个公共 API

1. **Gamma API** 位于 `gamma-api.polymarket.com` — 发现、搜索、浏览
2. **CLOB API** 位于 `clob.polymarket.com` — 实时价格、订单簿、历史
3. **Data API** 位于 `data-api.polymarket.com` — 交易、未平仓合约

## 典型工作流程

当用户询问预测市场赔率时：

1. **搜索**：使用 Gamma API 的 public-search 端点及其查询条件
2. **解析**：解析响应 — 提取事件及其嵌套的市场
3. **呈现**：市场问题、当前价格（百分比形式）和交易量
4. **深入分析**（如被要求）：使用 clobTokenIds 获取订单簿，使用 conditionId 获取历史数据

## 呈现结果

为方便阅读，将价格格式化为百分比：
- outcomePrices `["0.652", "0.348"]` 变为 “是：65.2%，否：34.8%”
- 始终显示市场问题和概率
- 在可用时包含交易量

示例：`“X 会发生吗？” — 65.2% 是（120 万美元交易量）`

## 解析双重编码字段

Gamma API 返回的 `outcomePrices`、`outcomes` 和 `clobTokenIds` 是 JSON 响应中的 JSON 字符串（双重编码）。使用 Python 处理时，请使用 `json.loads(market['outcomePrices'])` 解析它们以获取实际数组。

## 速率限制

非常宽松 — 正常使用不太可能达到：
- Gamma：每 10 秒 4,000 次请求（通用）
- CLOB：每 10 秒 9,000 次请求（通用）
- Data：每 10 秒 1,000 次请求（通用）

## 限制

- 此技能为只读 — 不支持下单交易
- 交易需要基于钱包的加密身份验证（EIP-712 签名）
- 某些新市场可能没有价格历史记录
- 交易受地理限制，但只读数据可全球访问