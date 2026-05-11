---
title: "Polymarket — 查询 Polymarket：市场、价格、订单簿、历史"
sidebar_label: "Polymarket"
description: "查询 Polymarket：市场、价格、订单簿、历史"
---

{/* 本页面由网站脚本 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Polymarket

查询 Polymarket：市场、价格、订单簿、历史。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/research/polymarket` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 + Teknium |
| 平台 | linux, macos, windows |

## 参考：完整 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# Polymarket — 预测市场数据

使用 Polymarket 的公共 REST API 查询预测市场数据。
所有端点均为只读，无需任何认证。

完整的端点参考（含 curl 示例）请参见 `references/api-endpoints.md`。

## 何时使用

- 用户询问预测市场、投注赔率或事件概率
- 用户想知道“X 发生的概率是多少？”
- 用户特别询问 Polymarket
- 用户想要市场价格、订单簿数据或价格历史
- 用户要求监控或追踪预测市场动向

## 关键概念

- **事件** 包含一个或多个 **市场** (一对多关系)
- **市场** 是二元结果，其“是”/“否”价格在 0.00 到 1.00 之间
- 价格就是概率：价格 0.65 意味着市场认为有 65% 的可能性
- `outcomePrices` 字段：JSON 编码的数组，例如 `["0.80", "0.20"]`
- `clobTokenIds` 字段：JSON 编码的两个代币 ID 数组 [是，否]，用于价格/订单簿查询
- `conditionId` 字段：用于价格历史查询的十六进制字符串
- 交易量以 USDC (美元) 计价

## 三个公共 API

1. **Gamma API** 位于 `gamma-api.polymarket.com` — 发现、搜索、浏览
2. **CLOB API** 位于 `clob.polymarket.com` — 实时价格、订单簿、历史
3. **Data API** 位于 `data-api.polymarket.com` — 交易、未平仓合约

## 典型工作流程

当用户询问预测市场赔率时：

1. **搜索**：使用 Gamma API 的公共搜索端点进行查询
2. **解析**：解析响应 — 提取事件及其嵌套的市场
3. **呈现**：展示市场问题、当前价格（以百分比表示）和交易量
4. **深入分析**：如果用户要求 — 使用 `clobTokenIds` 查询订单簿，使用 `conditionId` 查询历史

## 呈现结果

为便于阅读，将价格格式化为百分比：
- `outcomePrices` `["0.652", "0.348"]` 显示为 “是：65.2%，否：34.8%”
- 始终显示市场问题和概率
- 如果可用，包含交易量

示例：`"X 会发生吗？" — 是：65.2%（交易量 $1.2M）`

## 解析双重编码字段

Gamma API 返回的 `outcomePrices`、`outcomes` 和 `clobTokenIds` 是 JSON 响应中的 JSON 字符串（双重编码）。使用 Python 处理时，需要用 `json.loads(market['outcomePrices'])` 解析以获得实际数组。

## 速率限制

较为宽松 — 正常使用不太可能触发限制：
- Gamma：每 10 秒 4,000 个请求（通用）
- CLOB：每 10 秒 9,000 个请求（通用）
- Data：每 10 秒 1,000 个请求（通用）

## 限制

- 此技能为只读 — 不支持下单交易
- 交易需要基于钱包的加密认证（EIP-712 签名）
- 一些新市场可能没有价格历史
- 交易存在地域限制，但只读数据在全球范围内可访问