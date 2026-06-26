```yaml
title: Hyperliquid — Hyperliquid market data, account history, trade review
sidebar_label: Hyperliquid
description: Hyperliquid 市场数据、账户历史记录和交易回顾
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Hyperliquid

Hyperliquid 市场数据、账户历史记录和交易回顾。

## Skill metadata (技能元数据)

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/blockchain/hyperliquid` 进行安装 |
| Path | `optional-skills/blockchain/hyperliquid` |
| Version | `0.1.0` |
| Author | Hugo Sequier (Hugo-SEQUIER), Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `Hyperliquid`, `Blockchain`, `Crypto`, `Trading`, `Perpetuals`, `Spot`, `DeFi` |

## Reference: full SKILL.md (参考：完整的SKILL.md)

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# Hyperliquid Skill (Hyperliquid 技能)

通过公共 `/info` 端点查询 Hyperliquid 的市场和账户数据。
只读 — 无需 API 密钥，无需签名，无需下单。

12 个命令：`dexs`（去中心化交易所）, `markets`（市场）, `spots`（现货）, `candles`（蜡烛图）, `funding`（资金费率）, `l2`（二级市场）, `state`（状态）,
`spot-balances`（现货余额）, `fills`（成交记录）, `orders`（订单）, `review`（回顾）, `export`（导出）。仅使用 Stdlib (标准库) (`urllib`, `json`, `argparse`)。

---

## When to Use (何时使用)

- 用户询问 Hyperliquid 的永续合约或现货市场数据、蜡烛图、资金费率或 L2 订单簿
- 用户希望检查钱包的永续仓位、现货余额、成交记录或订单
- 用户需要一份结合近期成交记录和市场背景的交易回顾报告
- 用户希望检查由构建者部署的永续 DEX 或 HIP-3 市场
- 用户需要一份用于回测准备的蜡烛图 + 资金费率标准化 JSON 导出文件

---

## Prerequisites (先决条件)

仅使用 Stdlib — 无需外部包，无需 API 密钥。

脚本会读取 `${HERMES_HOME:-~/.hermes}/.env` 文件以获取两个可选默认值：

- `HYPERLIQUID_API_URL` — 默认为 `https://api.hyperliquid.xyz`。若使用测试网，则设置为 `https://api.hyperliquid-testnet.xyz`。
- `HYPERLIQUID_USER_ADDRESS` — 用于 `state`、`spot-balances`、`fills`、`orders` 和 `review` 的默认地址。如果未设置，请将其作为第一个位置参数传递。

当前工作目录中的项目 `.env` 文件将被视为开发备用选项。

辅助脚本：`~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py`

---

## How to Run (如何运行)

通过 `terminal` 工具调用：

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py <command> [args]
```

对任何命令添加 `--json` 选项，以获得机器可读的输出。

---

## Quick Reference (快速参考)

```bash
hyperliquid_client.py dexs
hyperliquid_client.py markets [--dex DEX] [--limit N] [--sort volume|oi|funding_abs|change_abs|name]
hyperliquid_client.py spots [--limit N]
hyperliquid_client.py candles <coin> [--interval 1h] [--hours 24] [--limit N]
hyperliquid_client.py funding <coin> [--hours 72] [--limit N]
hyperliquid_client.py l2 <coin> [--levels N]
hyperliquid_client.py state [address] [--dex DEX]
hyperliquid_client.py spot-balances [address] [--limit N]
hyperliquid_client.py fills [address] [--hours N] [--limit N] [--aggregate-by-time]
hyperliquid_client.py orders [address] [--limit N]
hyperliquid_client.py review [address] [--coin COIN] [--hours N] [--fills N]
hyperliquid_client.py export <coin> [--interval 1h] [--hours N] [--output PATH]
```

对于 `state`、`spot-balances`、`fills`、`orders` 和 `review`，如果 `${HERMES_HOME:-~/.hermes}/.env` 中设置了 `HYPERLIQUID_USER_ADDRESS`，则地址是可选的。

---

## Procedure (操作流程)

### 1. Discover DEXs and Markets (发现去中心化交易所和市场)

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py dexs

python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  markets --limit 15 --sort volume

python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  spots --limit 15
```

- `--dex` 只适用于永续合约端点；对于第一个永续 DEX，请省略此选项。
- 现货对可能显示为 `PURR/USDC` 或 `@107` 等别名。
- HIP-3 市场会用 DEX 前缀来标记币种，例如 `mydex:BTC`。

### 2. Pull Historical Market Data (拉取历史市场数据)

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  candles BTC --interval 1h --hours 72 --limit 48

python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  funding BTC --hours 168 --limit 30
```

时间范围端点支持分页。对于更大的时间窗口，请重复使用较晚的 `startTime` 或使用 `export`（如下所示）。

### 3. Inspect Live Order Book (检查实时订单簿)

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  l2 BTC --levels 10
```

当被问及订单簿深度、短期流动性或大额订单的潜在市场影响时，请使用此命令。

### 4. Review an Account (回顾账户信息)

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  state 0xabc...

python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  spot-balances
```

`state` 返回永续仓位；`spot-balances` 返回现货库存。这些信息可用于回答“我的仓位如何？”、“我持有多少？”、“有多少可以提取？”等问题。

### 5. Review Fills and Orders (回顾成交记录和订单)

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  fills 0xabc... --hours 72 --limit 25

python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  orders --limit 25
```

### 6. Generate a Trade Review (生成交易回顾)

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  review 0xabc... --hours 72 --fills 50

python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  review --coin BTC --hours 168
```

报告已实现的盈亏 (PnL)、费用、胜负次数、币种细分、市场趋势以及每个交易永续合约的平均资金费率，同时提供启发式分析（费用拖累、集中度、逆趋势损失）。

对于更深入的交易后分析：先使用 `review` 找出存在问题的问题币或时间窗口 → 然后拉取该时期的 `fills` 和 `orders` → 再拉取每个交易币种的 `candles` 和 `funding` → 最后将决策质量与结果质量分开进行判断。

### 7. Export a Reusable Dataset (导出可重用数据集)

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  export BTC --interval 1h --hours 168 --output ./btc-1h-7d.json

python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  export BTC --interval 15m --hours 72 --end-time-ms 1760000000000
```

输出的 JSON 文件包含：模式版本、来源元数据、精确时间窗口、标准化蜡烛图行和标准化资金费率行、摘要统计信息。使用 `--end-time-ms` 来确保结果的可复现性。

---

## Pitfalls (潜在问题)

- 公共信息端点有速率限制。大型历史查询可能会返回受限的窗口；请尝试使用较晚的 `startTime` 值进行迭代。
- `fills --hours ...` 使用的是 `userFillsByTime`，它只暴露一个近期的滚动窗口——而非完整的存档历史记录。
- `historicalOrders` 只返回最近的订单；并非完整导出。
- `review` 命令是启发式的。它不能仅凭成交记录来重建意图、下单质量或真实的滑点。
- `export` 命令写入的是一个标准化数据集，而不是回测引擎。您仍然需要自己的滑点/填充模型。
- 现货别名（如 `@107`）即使在 UI 中显示了更友好的名称也是有效的标识符。
- `l2` 是一个某一时刻的快照，而非时间序列。

---

## Verification (验证)

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  markets --limit 5
```

应打印出按 24 小时名义交易量排名的前 5 个 Hyperliquid 永续合约市场。
```