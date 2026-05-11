---
title: "Base"
sidebar_label: "Base"
description: "查询Base（以太坊L2）区块链数据并附带美元定价 — 钱包余额、代币信息、交易详情、Gas分析、合约检查、鲸鱼检测..."
---

{/* 此页面由网站脚本 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Base

查询Base（以太坊L2）区块链数据并附带美元定价 — 钱包余额、代币信息、交易详情、Gas分析、合约检查、鲸鱼检测以及实时网络统计数据。使用Base RPC + CoinGecko。无需API密钥。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/blockchain/base` 安装 |
| 路径 | `optional-skills/blockchain/base` |
| 版本 | `0.1.0` |
| 作者 | youssefea |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Base`, `Blockchain`, `Crypto`, `Web3`, `RPC`, `DeFi`, `EVM`, `L2`, `Ethereum` |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes加载的完整技能定义。这是技能激活时智能体看到的说明。
:::

# Base 区块链技能

通过CoinGecko查询Base（以太坊L2）链上数据并丰富美元定价。
8个命令：钱包投资组合、代币信息、交易、Gas分析、
合约检查、鲸鱼检测、网络统计和价格查询。

无需API密钥。仅使用Python标准库（urllib, json, argparse）。

---

## 何时使用

- 用户询问Base钱包余额、代币持仓或投资组合价值
- 用户想要通过哈希检查特定交易
- 用户想要ERC-20代币的元数据、价格、供应量或市值
- 用户想要了解Base的Gas成本和L1数据费用
- 用户想要检查合约（ERC类型检测、代理解析）
- 用户想要查找大额ETH转账（鲸鱼检测）
- 用户想要了解Base网络健康状况、Gas价格或ETH价格
- 用户询问"USDC/AERO/DEGEN/ETH的价格是多少？"

---

## 前提条件

辅助脚本仅使用Python标准库（urllib, json, argparse）。
无需外部包。

价格数据来自CoinGecko的免费API（无需密钥，速率限制约为
~10-30次请求/分钟）。如需更快的查询，请使用`--no-prices`标志。

---

## 快速参考

RPC端点（默认）：https://mainnet.base.org
覆盖设置：export BASE_RPC_URL=https://your-private-rpc.com

辅助脚本路径：~/.hermes/skills/blockchain/base/scripts/base_client.py

```
python3 base_client.py wallet   <地址> [--limit N] [--all] [--no-prices]
python3 base_client.py tx       <哈希>
python3 base_client.py token    <合约地址>
python3 base_client.py gas
python3 base_client.py contract <地址>
python3 base_client.py whales   [--min-eth N]
python3 base_client.py stats
python3 base_client.py price    <合约地址或符号>
```

---

## 步骤

### 0. 设置检查

```bash
python3 --version

# 可选：设置私有RPC以获得更好的速率限制
export BASE_RPC_URL="https://mainnet.base.org"

# 确认连接
python3 ~/.hermes/skills/blockchain/base/scripts/base_client.py stats
```

### 1. 钱包投资组合

获取ETH余额和ERC-20代币持仓及美元价值。
检查约15种知名的Base代币（USDC、WETH、AERO、DEGEN等）
通过链上`balanceOf`调用。代币按价值排序，过滤灰尘代币。

```bash
python3 ~/.hermes/skills/blockchain/base/scripts/base_client.py \
  wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

标志：
- `--limit N` — 显示前N个代币（默认：20）
- `--all` — 显示所有代币，无灰尘过滤，无限制
- `--no-prices` — 跳过CoinGecko价格查询（更快，仅RPC）

输出包括：ETH余额 + 美元价值、带价格的代币列表（按价值排序）、灰尘代币数量、总投资组合美元价值。

注意：仅检查已知代币。不会发现未知的ERC-20代币。
对于任何代币，请使用`token`命令并提供特定的合约地址。

### 2. 交易详情

通过哈希检查完整交易。显示转移的ETH价值、
使用的Gas量、ETH/美元费用、状态以及解码的ERC-20/ERC-721转账。

```bash
python3 ~/.hermes/skills/blockchain/base/scripts/base_client.py \
  tx 0xabc123...your_tx_hash_here
```

输出：哈希、区块、发送方、接收方、价值（ETH + 美元）、Gas价格、Gas用量、费用、状态、合约创建地址（如有）、代币转账。

### 3. 代币信息

获取ERC-20代币元数据：名称、符号、小数位数、总供应量、价格、市值和合约代码大小。

```bash
python3 ~/.hermes/skills/blockchain/base/scripts/base_client.py \
  token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

输出：名称、符号、小数位数、总供应量、价格、市值。
通过eth_call直接从合约读取名称/符号/小数位数。

### 4. Gas分析

详细的Gas分析及常见操作的成本估算。
显示当前Gas价格、过去10个区块的基本费用趋势、区块
利用率以及ETH转账、ERC-20转账和Swap的估算成本。

```bash
python3 ~/.hermes/skills/blockchain/base/scripts/base_client.py gas
```

输出：当前Gas价格、基本费用、区块利用率、10个区块趋势、ETH和美元的成本估算。

注意：Base是L2 — 实际交易成本包括L1数据发布费，
该费用取决于calldata大小和L1 Gas价格。
显示的估算值仅针对L2执行。

### 5. 合约检查

检查一个地址：确定它是EOA还是合约，检测
ERC-20/ERC-721/ERC-1155接口，解析EIP-1967代理
实现地址。

```bash
python3 ~/.hermes/skills/blockchain/base/scripts/base_client.py \
  contract 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

输出：是否为合约、代码大小、ETH余额、检测到的接口
（ERC-20, ERC-721, ERC-1155）、ERC-20元数据、代理实现
地址。

### 6. 鲸鱼检测器

扫描最近一个区块，查找带美元价值的大额ETH转账。

```bash
python3 ~/.hermes/skills/blockchain/base/scripts/base_client.py \
  whales --min-eth 1.0
```

注意：仅扫描最新区块 — 时间点快照，非历史记录。
默认阈值为1.0 ETH（低于Solana的默认值，因为ETH
价值更高）。

### 7. 网络统计

实时Base网络健康状况：最新区块、链ID、Gas价格、基本费用、
区块利用率、交易数量和ETH价格。

```bash
python3 ~/.hermes/skills/blockchain/base/scripts/base_client.py stats
```

### 8. 价格查询

通过合约地址或已知符号快速查询任何代币的价格。

```bash
python3 ~/.hermes/skills/blockchain/base/scripts/base_client.py price ETH
python3 ~/.hermes/skills/blockchain/base/scripts/base_client.py price USDC
python3 ~/.hermes/skills/blockchain/base/scripts/base_client.py price AERO
python3 ~/.hermes/skills/blockchain/base/scripts/base_client.py price DEGEN
python3 ~/.hermes/skills/blockchain/base/scripts/base_client.py price 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

已知符号：ETH, WETH, USDC, cbETH, AERO, DEGEN, TOSHI, BRETT,
WELL, wstETH, rETH, cbBTC。

---

## 陷阱

- **CoinGecko速率限制** — 免费层允许~10-30次请求/分钟。
  每个代币的价格查询使用1次请求。使用`--no-prices`加快速度。
- **公共RPC速率限制** — Base的公共RPC限制请求。
  对于生产用途，请将BASE_RPC_URL设置为私有端点
  （Alchemy, QuickNode, Infura）。
- **钱包仅显示已知代币** — 与Solana不同，EVM链没有
  内置的“获取所有代币”RPC。钱包命令通过`balanceOf`检查~15种流行的
  Base代币。未知的ERC-20不会显示。对于任何特定合约，
  请使用`token`命令。
- **代币名称从合约读取** — 如果合约未实现
  `name()` 或 `symbol()`，这些字段可能为空。已知代币有
  硬编码的标签作为后备。
- **Gas估算仅为L2** — Base交易成本包括L1数据
  发布费（取决于calldata大小和L1 Gas价格）。gas
  命令仅估算L2执行成本。
- **鲸鱼检测器仅扫描最新区块** — 非历史记录。结果
  随查询时间点而变化。默认阈值为1.0 ETH。
- **代理检测** — 仅检测EIP-1967代理。其他代理
  模式（EIP-1167最小代理、自定义存储槽）未检查。
- **429错误时重试** — RPC和CoinGecko调用在速率限制错误时
  最多重试2次，使用指数退避。

---

## 验证

```bash
# 应输出Base链ID (8453)、最新区块、Gas价格和ETH价格
python3 ~/.hermes/skills/blockchain/base/scripts/base_client.py stats
```