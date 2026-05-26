---
title: "股票 — 通过雅虎获取股票报价、历史记录、搜索、比较及加密货币"
sidebar_label: "股票"
description: "通过雅虎获取股票报价、历史记录、搜索、比较及加密货币"
---

{/* 此页面由网站脚本 `scripts/generate-skill-docs.py` 根据技能的 `SKILL.md` 自动生成。请编辑源文件 `SKILL.md`，而非此页面。 */}

# 股票

通过雅虎获取股票报价、历史记录、搜索、比较及加密货币。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/finance/stocks` 安装 |
| 路径 | `optional-skills/finance/stocks` |
| 版本 | `0.1.0` |
| 作者 | Mibay (Mibayy), Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `股票`, `金融`, `市场`, `加密货币`, `投资` |
| 相关技能 | [`dcf-model`](/user-guide/skills/optional/finance/finance-dcf-model), [`comps-analysis`](/user-guide/skills/optional/finance/finance-comps-analysis), [`lbo-model`](/user-guide/skills/optional/finance/finance-lbo-model) |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体看到的操作说明。
:::

# 股票技能

通过雅虎金融获取只读市场数据。五个命令：`quote`、`search`、`history`、`compare`、`crypto`。仅使用 Python 标准库 — 无需 API 密钥，无需安装 pip 包。雅虎的端点是非官方的，可能会进行速率限制或更改。

## 使用场景

- 用户询问当前股票价格（如 AAPL、TSLA、MSFT，...）
- 用户希望通过公司名称查找股票代码
- 用户想要 OHLCV 历史数据或特定日期范围内的表现
- 用户想要并排比较几个股票代码
- 用户询问加密货币价格（如 BTC、ETH、SOL，...）

## 前提条件

仅需 Python 3.8+ 标准库。可选：设置 `ALPHA_VANTAGE_KEY`，当雅虎受保护字段返回空值时，用于丰富 `market_cap`、`pe_ratio` 和 52 周高低数据。免费密钥：https://www.alphavantage.co/support/#api-key

## 如何运行

通过 `terminal` 工具调用。安装后：

```
SCRIPT=~/.hermes/skills/finance/stocks/scripts/stocks_client.py
python3 $SCRIPT quote AAPL
```

所有输出均为标准输出的 JSON — 如需筛选，可通过 `jq` 管道处理。

## 快速参考

```
python3 $SCRIPT quote AAPL
python3 $SCRIPT quote AAPL MSFT GOOGL TSLA
python3 $SCRIPT search "Tesla"
python3 $SCRIPT history NVDA --range 6mo
python3 $SCRIPT compare AAPL MSFT GOOGL
python3 $SCRIPT crypto BTC ETH SOL
```

## 命令

### `quote 股票代码 [股票代码2 ...]`

当前价格、涨跌幅、涨跌百分比、成交量、52 周高点/低点。

### `search 查询`

通过公司名称查找股票代码。返回前 5 条：代码、名称、交易所、类型。

### `history 股票代码 [--range 范围]`

每日 OHLCV 数据及统计（最小值、最大值、平均值、总回报率 %）。范围：`1mo`、`3mo`、`6mo`、`1y`、`5y`。默认：`1mo`。

### `compare 股票代码1 股票代码2 [...]`

并排对比：价格、涨跌幅百分比、52 周表现。

### `crypto 股票代码 [股票代码2 ...]`

加密货币价格。传入 `BTC`（脚本会自动添加 `-USD`）。

## 注意事项

- 雅虎金融的 API 是非官方的。端点可能会在未通知的情况下更改或进行速率限制 — 如果请求开始失败，原因就在于此。
- 当雅虎的 crumb 会话未建立时，`quote` 命令返回的 `market_cap` 和 `pe_ratio` 可能为 null。设置 `ALPHA_VANTAGE_KEY` 以进行补充。
- 在批量请求之间添加短暂延迟以避免速率限制。
- 此技能为只读 — 不能下单，不能集成账户。

## 验证

```
python3 ~/.hermes/skills/finance/stocks/scripts/stocks_client.py quote AAPL
```

返回一个 JSON 对象，包含 `symbol: "AAPL"` 和一个数值类型的 `price` 字段。