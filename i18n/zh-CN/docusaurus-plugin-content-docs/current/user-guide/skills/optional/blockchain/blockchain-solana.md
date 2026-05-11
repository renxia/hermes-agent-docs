---
title: "Solana"
sidebar_label: "Solana"
description: "使用美元定价查询 Solana 区块链数据 — 钱包余额、代币投资组合及其价值、交易详情、NFT、巨鲸检测以及实时网络状态统计..."
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非本页面。 */}

# Solana

使用美元定价查询 Solana 区块链数据 — 钱包余额、代币投资组合及其价值、交易详情、NFT、巨鲸检测以及实时网络状态统计。使用 Solana RPC + CoinGecko。无需 API 密钥。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/blockchain/solana` 安装 |
| 路径 | `optional-skills/blockchain/solana` |
| 版本 | `0.2.0` |
| 作者 | Deniz Alagoz (gizdusum)，由 Hermes 智能体增强 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Solana`, `Blockchain`, `Crypto`, `Web3`, `RPC`, `DeFi`, `NFT` |

## 参考：完整 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这就是智能体在技能激活时看到的指令。
:::

# Solana 区块链技能

通过 CoinGecko 查询 Solana 链上数据，并附加美元定价。
8 条命令：钱包投资组合、代币信息、交易、活动、NFT、
巨鲸检测、网络统计和价格查询。

无需 API 密钥。仅使用 Python 标准库 (urllib, json, argparse)。

---

## 何时使用

- 用户询问 Solana 钱包余额、代币持仓或投资组合价值
- 用户想通过签名检查特定交易详情
- 用户想了解 SPL 代币元数据、价格、供应量或主要持有者
- 用户想查看某个地址的近期交易历史
- 用户想知道某个钱包拥有的 NFT
- 用户想查找大额 SOL 转账（巨鲸检测）
- 用户想了解 Solana 网络健康状况、TPS、epoch 或 SOL 价格
- 用户询问 "BONK/JUP/SOL 的价格是多少？"

---

## 前提条件

辅助脚本仅使用 Python 标准库 (urllib, json, argparse)。
无需外部软件包。

定价数据来自 CoinGecko 的免费 API（无需密钥，速率限制约为每分钟 10-30 次请求）。如需更快查询，请使用 `--no-prices` 标志。

---

## 快速参考

RPC 端点 (默认): https://api.mainnet-beta.solana.com
覆盖: export SOLANA_RPC_URL=https://your-private-rpc.com

辅助脚本路径: ~/.hermes/skills/blockchain/solana/scripts/solana_client.py

```
python3 solana_client.py wallet   <address> [--limit N] [--all] [--no-prices]
python3 solana_client.py tx       <signature>
python3 solana_client.py token    <mint_address>
python3 solana_client.py activity <address> [--limit N]
python3 solana_client.py nft      <address>
python3 solana_client.py whales   [--min-sol N]
python3 solana_client.py stats
python3 solana_client.py price    <mint_or_symbol>
```

---

## 步骤

### 0. 设置检查

```bash
python3 --version

# 可选：为获得更好的速率限制，设置一个私有 RPC
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"

# 确认连接性
python3 ~/.hermes/skills/blockchain/solana/scripts/solana_client.py stats
```

### 1. 钱包投资组合

获取 SOL 余额、SPL 代币持仓及其美元价值、NFT 数量和
投资组合总价值。代币按价值排序，过滤掉小额零散代币，已知代币
按名称标注（BONK, JUP, USDC 等）。

```bash
python3 ~/.hermes/skills/blockchain/solana/scripts/solana_client.py \
  wallet 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
```

标志：
- `--limit N` — 显示前 N 个代币（默认值：20）
- `--all` — 显示所有代币，无零散过滤，无数量限制
- `--no-prices` — 跳过 CoinGecko 价格查询（更快，仅限 RPC）

输出包括：SOL 余额 + 美元价值、按价值排序的代币列表及价格、
零散代币数量、NFT 摘要、投资组合总美元价值。

### 2. 交易详情

通过 base58 签名检查完整交易。显示 SOL 和美元两种货币的余额变化。

```bash
python3 ~/.hermes/skills/blockchain/solana/scripts/solana_client.py \
  tx 5j7s8K...your_signature_here
```

输出：slot、时间戳、手续费、状态、余额变化（SOL + 美元）、
程序调用。

### 3. 代币信息

获取 SPL 代币元数据、当前价格、市值、供应量、小数位、
铸币/冻结权限以及前 5 大持有者。

```bash
python3 ~/.hermes/skills/blockchain/solana/scripts/solana_client.py \
  token DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
```

输出：名称、符号、小数位、供应量、价格、市值、前 5 大
持有者及其百分比。

### 4. 近期活动

列出某个地址的近期交易（默认：最近 10 笔，最多：25 笔）。

```bash
python3 ~/.hermes/skills/blockchain/solana/scripts/solana_client.py \
  activity 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM --limit 25
```

### 5. NFT 投资组合

列出某个钱包拥有的 NFT（启发式方法：数量=1，小数位=0 的 SPL 代币）。

```bash
python3 ~/.hermes/skills/blockchain/solana/scripts/solana_client.py \
  nft 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
```

注意：此启发式方法无法检测压缩 NFT (cNFT)。

### 6. 巨鲸检测器

扫描最近一个区块，查找带有美元价值的大额 SOL 转账。

```bash
python3 ~/.hermes/skills/blockchain/solana/scripts/solana_client.py \
  whales --min-sol 500
```

注意：仅扫描最新区块 — 时间点快照，非历史数据。

### 7. 网络统计

实时 Solana 网络健康状况：当前 slot、epoch、TPS、供应量、验证器
版本、SOL 价格和市值。

```bash
python3 ~/.hermes/skills/blockchain/solana/scripts/solana_client.py stats
```

### 8. 价格查询

通过铸币地址或已知符号快速查询任何代币的价格。

```bash
python3 ~/.hermes/skills/blockchain/solana/scripts/solana_client.py price BONK
python3 ~/.hermes/skills/blockchain/solana/scripts/solana_client.py price JUP
python3 ~/.hermes/skills/blockchain/solana/scripts/solana_client.py price SOL
python3 ~/.hermes/skills/blockchain/solana/scripts/solana_client.py price DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
```

已知符号：SOL, USDC, USDT, BONK, JUP, WETH, JTO, mSOL, stSOL,
PYTH, HNT, RNDR, WEN, W, TNSR, DRIFT, bSOL, JLP, WIF, MEW, BOME, PENGU。

---

## 注意事项

- **CoinGecko 速率限制** — 免费层级允许每分钟约 10-30 次请求。
  价格查询每个代币使用 1 次请求。拥有众多代币的钱包可能
  无法获得所有代币的价格。为提升速度，请使用 `--no-prices`。
- **公共 RPC 速率限制** — Solana 主网公共 RPC 会限制请求。
  生产环境使用时，请将 SOLANA_RPC_URL 设置为私有端点
  (Helius, QuickNode, Triton)。
- **NFT 检测是启发式的** — 条件为数量=1 + 小数位=0。压缩
  NFT (cNFT) 和 Token-2022 NFT 将不会出现。
- **巨鲸检测器仅扫描最新区块** — 非历史数据。结果随查询时间点变化。
- **交易历史** — 公共 RPC 大约保留 2 天数据。较早的交易
  可能无法获取。
- **代币名称** — 约 25 种知名代币会按名称标注。其他代币
  显示缩写的铸币地址。使用 `token` 命令获取完整信息。
- **遇到 429 重试** — RPC 和 CoinGecko 调用在遇到速率限制错误时，
  最多重试 2 次，采用指数退避策略。

---

## 验证

```bash
# 应显示当前 Solana 的 slot、TPS 和 SOL 价格
python3 ~/.hermes/skills/blockchain/solana/scripts/solana_client.py stats
```