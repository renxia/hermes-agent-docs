---
title: "股票 — 通过雅虎获取股票报价、历史数据、搜索、比较、加密货币"
sidebar_label: "股票"
description: "通过雅虎获取股票报价、历史数据、搜索、比较、加密货币"
---

{/* 本页面由网站脚本 scripts/generate-skill-docs.py 从技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非本页面。 */}

# 股票

通过雅虎获取股票报价、历史数据、搜索、比较、加密货币。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/finance/stocks` 安装 |
| 路径 | `optional-skills/finance/stocks` |
| 版本 | `0.1.0` |
| 作者 | Mibay (Mibayy), Hermes 智能体 |
| 许可 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `股票`, `金融`, `市场`, `加密货币`, `投资` |
| 相关技能 | [`dcf-model`](/docs/user-guide/skills/optional/finance/finance-dcf-model), [`comps-analysis`](/docs/user-guide/skills/optional/finance/finance-comps-analysis), [`lbo-model`](/docs/user-guide/skills/optional/finance/finance-lbo-model) |

## 参考：完整的 SKILL.md 文件

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时看到的说明。
:::

# 股票技能

通过雅虎财经获取只读市场数据。包含五个命令：`quote`（报价）、`search`（搜索）、`history`（历史记录）、`compare`（比较）、`crypto`（加密货币）。仅使用 Python 标准库 — 无需 API 密钥，无需 pip 安装。雅虎的端点是非官方的，可能会受到速率限制或发生变更。

## 使用场景

- 用户询问当前股价（如 AAPL、TSLA、MSFT 等）
- 用户希望通过公司名称查找股票代码
- 用户需要 OHLCV 历史数据或特定日期范围内的表现
- 用户想要并排比较多个股票代码
- 用户询问加密货币价格（如 BTC、ETH、SOL 等）

## 先决条件

仅需 Python 3.8+ 标准库。可选：设置 `ALPHA_VANTAGE_KEY` 以便在雅虎的受保护字段返回空值时，用于填充 `market_cap`（市值）、`pe_ratio`（市盈率）和 52 周高低价位。免费密钥获取地址：https://www.alphavantage.co/support/#api-key

## 如何运行

通过 `terminal`（终端）工具调用。安装后：

```
SCRIPT=~/.hermes/skills/finance/stocks/scripts/stocks_client.py
python3 $SCRIPT quote AAPL
```

所有输出均为标准输出的 JSON 格式 — 如需解析，可通过 `jq` 进行管道处理。

## 快速参考

```
python3 $SCRIPT quote AAPL
python3 $SCRIPT quote AAPL MSFT GOOGL TSLA
python3 $SCRIPT search "Tesla"
python3 $SCRIPT history NVDA --range 6mo
python3 $SCRIPT compare AAPL MSFT GOOGL
python3 $SCRIPT crypto BTC ETH SOL
```

## 命令说明

### `quote SYMBOL [SYMBOL2 ...]`

获取当前价格、涨跌、涨跌幅、交易量、52 周最高/最低价。

### `search QUERY`

通过公司名称查找股票代码。返回前 5 个结果：代码、名称、交易所、类型。

### `history SYMBOL [--range RANGE]`

获取每日 OHLCV 数据及统计信息（最小值、最大值、平均值、总回报率）。范围：`1mo`、`3mo`、`6mo`、`1y`、`5y`。默认值：`1mo`。

### `compare SYMBOL1 SYMBOL2 [...]`

并排比较：价格、涨跌幅、52 周表现。

### `crypto SYMBOL [SYMBOL2 ...]`

获取加密货币价格。传递 `BTC`（脚本会自动添加 `-USD` 后缀）。

## 注意事项

- 雅虎财经的 API 是非官方的。端点可能会在没有通知的情况下发生变更或受到速率限制 — 如果请求开始失败，这就是原因。
- 当雅虎的 crumb 会话未建立时，`quote` 命令中的 `market_cap` 和 `pe_ratio` 可能返回空值。设置 `ALPHA_VANTAGE_KEY` 可进行回填。
- 在批量请求之间添加短暂延迟以避免速率限制。
- 此为只读操作 — 不支持下单或账户集成。

## 验证

```
python3 ~/.hermes/skills/finance/stocks/scripts/stocks_client.py quote AAPL
```

返回一个包含 `symbol: "AAPL"` 和数字 `price` 字段的 JSON 对象。