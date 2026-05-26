---
title: "Hyperliquid — Hyperliquid 市场数据、账户历史与交易回顾"
sidebar_label: "Hyperliquid"
description: "Hyperliquid 市场数据、账户历史与交易回顾"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Hyperliquid

Hyperliquid 市场数据、账户历史与交易回顾。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/blockchain/hyperliquid` 安装 |
| 路径 | `optional-skills/blockchain/hyperliquid` |
| 版本 | `0.1.0` |
| 作者 | Hugo Sequier (Hugo-SEQUIER), Hermes Agent |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Hyperliquid`, `区块链`, `加密货币`, `交易`, `永续合约`, `现货`, `DeFi` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 加载此技能时使用的完整技能定义。这是技能激活时智能体所看到的指令。
:::

# Hyperliquid 技能

通过公共 `/info` 端点查询 Hyperliquid 市场与账户数据。
只读 — 无需 API 密钥，无需签名，不支持下单。

12 个命令：`dexs`, `markets`, `spots`, `candles`, `funding`, `l2`, `state`,
`spot-balances`, `fills`, `orders`, `review`, `export`。仅使用标准库
（`urllib`, `json`, `argparse`）。

---

## 何时使用

- 用户询问 Hyperliquid 永续或现货市场数据、K 线、资金费率或订单簿深度
- 用户希望检查钱包的永续仓位、现货余额、成交记录或订单
- 用户希望进行交易后回顾，结合近期成交和市场背景
- 用户希望检查构建者部署的永续 DEX 或 HIP-3 市场
- 用户希望导出标准化的 JSON 数据（K 线 + 资金费率）用于回测准备

---

## 前置条件

仅使用标准库 — 无需外部包，无需 API 密钥。

脚本会读取 `~/.hermes/.env` 中的两个可选默认值：

- `HYPERLIQUID_API_URL` — 默认为 `https://api.hyperliquid.xyz`。如需使用测试网，请设置为
  `https://api.hyperliquid-testnet.xyz`。
- `HYPERLIQUID_USER_ADDRESS` — 用于 `state`, `spot-balances`,
  `fills`, `orders`, 和 `review` 的默认地址。如果未设置，请将地址作为第一个
  位置参数传递。

当前工作目录下的项目 `.env` 文件将作为开发备用配置。

辅助脚本：`~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py`

---

## 如何运行

通过 `terminal` 工具调用：

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py <command> [args]
```

在任何命令后添加 `--json` 以获得机器可读的输出。

---

## 快速参考

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

对于 `state`, `spot-balances`, `fills`, `orders`, 和 `review`，如果在 `~/.hermes/.env` 中设置了 `HYPERLIQUID_USER_ADDRESS`，则地址参数是可选的。

---

## 流程

### 1. 发现 DEX 和市场

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py dexs

python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  markets --limit 15 --sort volume

python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  spots --limit 15
```

- `--dex` 仅适用于永续端点；省略则使用第一个永续 DEX。
- 现货交易对可能显示为 `PURR/USDC` 或别名如 `@107`。
- HIP-3 市场的代币名称前会带有 DEX 前缀，例如 `mydex:BTC`。

### 2. 获取历史市场数据

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  candles BTC --interval 1h --hours 72 --limit 48

python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  funding BTC --hours 168 --limit 30
```

时间范围端点支持分页。对于更大的时间窗口，请使用较晚的 `startTime` 重复查询，或使用下面的 `export`。

### 3. 检查实时订单簿

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  l2 BTC --levels 10
```

当被问及订单簿深度、近期流动性或大额订单的潜在市场影响时使用。

### 4. 审查账户

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  state 0xabc...

python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  spot-balances
```

`state` 返回永续仓位；`spot-balances` 返回现货持仓。
用于回答 "我的仓位怎么样？"、"我持有什么？"、"可提取多少？" 等问题。

### 5. 审查成交记录和订单

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  fills 0xabc... --hours 72 --limit 25

python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  orders --limit 25
```

### 6. 生成交易回顾

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  review 0xabc... --hours 72 --fills 50

python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  review --coin BTC --hours 168
```

报告已实现损益、手续费、盈亏次数、代币分布，以及每个交易过的永续合约的市场趋势和平均资金费率，以及启发式分析（手续费拖累、集中度、逆趋势亏损）。

进行更深入的交易后分析：首先使用 `review` 找出问题代币或时间窗口 → 获取该时间段的 `fills` 和 `orders` → 获取每个交易代币的 `candles` 和 `funding` → 独立地评估决策质量（而非仅看结果）。

### 7. 导出可复用数据集

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  export BTC --interval 1h --hours 168 --output ./btc-1h-7d.json

python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  export BTC --interval 15m --hours 72 --end-time-ms 1760000000000
```

输出的 JSON 包含：模式版本、源元数据、精确的时间窗口、标准化的 K 线行、标准化的资金费率行、汇总统计。使用 `--end-time-ms` 以获得可复现的时间窗口。

---

## 注意事项

- 公共信息端点有速率限制。大型历史查询可能会返回受限制的时间窗口；请使用较晚的 `startTime` 值进行迭代。
- `fills --hours ...` 使用 `userFillsByTime`，它只暴露近期的滚动窗口，而非完整的归档历史。
- `historicalOrders` 仅返回近期订单；不是完整的导出。
- `review` 命令基于启发式分析。仅凭成交记录，它无法重建下单意图、下单质量或真实的滑点。
- `export` 命令写入的是标准化的数据集，而非回测引擎。你仍然需要自己的滑点/成交模型。
- 现货别名如 `@107` 是有效的标识符，即使用户界面显示更友好的名称。
- `l2` 是时间点快照，而非时间序列。

---

## 验证

```bash
python3 ~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py \
  markets --limit 5
```

应打印出按 24 小时名义成交量排序的顶级 Hyperliquid 永续市场。