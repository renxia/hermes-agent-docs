---
title: "Evm — 只读 EVM 客户端：跨 8 条链的钱包、代币、Gas 查询"
sidebar_label: "Evm"
description: "只读 EVM 客户端：跨 8 条链的钱包、代币、Gas 查询"
---

{/* 本页由网站脚本 generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源 SKILL.md，而非此页面。 */}

# Evm

只读 EVM 客户端：跨 8 条链的钱包、代币、Gas 查询。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/blockchain/evm` 安装 |
| 路径 | `optional-skills/blockchain/evm` |
| 版本 | `1.0.0` |
| 作者 | Mibayy (@Mibayy), youssefea (@youssefea), ethernet8023 (@ethernet8023), Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `EVM`, `以太坊`, `BNB`, `BSC`, `Base`, `Arbitrum`, `Polygon`, `Optimism`, `Avalanche`, `zkSync`, `区块链`, `加密`, `Web3`, `DeFi`, `NFT`, `ENS`, `巨鲸`, `安全` |
| 相关技能 | [`solana`](/user-guide/skills/optional/blockchain/blockchain-solana) |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能处于活动状态时，智能体看到的指令。
:::

# EVM 区块链技能

跨 8 条链查询 EVM 兼容的区块链数据，附带美元定价。
包含 14 个命令：钱包资产组合、代币信息、交易查询、活动记录、Gas 追踪器、
网络状态、价格查询、多链扫描、巨鲸检测、ENS 解析、
授权检查、合约检查器和交易解码器。

支持 8 条链：以太坊、BNB Chain (BSC)、Base、Arbitrum One、Polygon、
Optimism、Avalanche (C-Chain)、zkSync Era。

无需 API 密钥。零外部依赖 — 仅使用 Python 标准库
（urllib, json, argparse, threading）。

> **取代独立的 `base` 技能。** Base 特有的代币（AERO, DEGEN,
> TOSHI, BRETT, WELL, cbETH, cbBTC, wstETH, rETH）以及之前位于
> `optional-skills/blockchain/base/` 的所有 Base RPC 功能已被整合
> 到此技能中。对任何命令传入 `--chain base` 即可获得 Base 链的覆盖支持。

---

## 何时使用
- 用户询问任何 EVM 链上的钱包余额或资产组合
- 用户希望一次性检查同一钱包在所有链上的情况
- 用户想要通过哈希检查交易详情（或解码其执行内容）
- 用户想要 ERC-20 代币的元数据、价格、供应量或市值
- 用户想要一个地址的最近交易历史
- 用户想要当前的 Gas 价格或比较不同链的费用
- 用户想要在最近的区块中查找大型巨鲸转账
- 用户要求解析一个 ENS 名称（如 vitalik.eth）或反向查找一个地址
- 用户想要检查一个合约是否存在危险的代币授权
- 用户想要检查一个智能合约（是否为代理？ERC-20？ERC-721？字节码大小？）
- 用户想要在交易前比较不同链的 Gas 成本

---

## 前提条件
仅需 Python 3.8+ 标准库。无需 pip 安装。
价格数据：CoinGecko 免费 API（有速率限制，约 10-30 请求/分钟）。
ENS 解析：ensideas.com 公共 API。
交易解码：4byte.directory 公共 API。

覆盖 RPC 端点：`export EVM_RPC_URL=https://your-rpc.com`

辅助脚本路径：`~/.hermes/skills/blockchain/evm/scripts/evm_client.py`

---

## 快速参考

```
SCRIPT=~/.hermes/skills/blockchain/evm/scripts/evm_client.py

# 网络与价格
python3 $SCRIPT stats                            # 以太坊网络状态
python3 $SCRIPT stats --chain arbitrum           # Arbitrum 网络状态
python3 $SCRIPT compare                          # 比较全部 8 条链的 Gas 和价格

# 钱包
python3 $SCRIPT wallet 0xd8dA...96045            # 资产组合（ETH + ERC-20）
python3 $SCRIPT wallet 0xd8dA...96045 --chain bsc
python3 $SCRIPT multichain 0xd8dA...96045        # 检查同一钱包在所有链上

# 代币与价格
python3 $SCRIPT price ETH
python3 $SCRIPT price 0xdAC1...1ec7              # 通过合约地址查询价格
python3 $SCRIPT token 0xdAC1...1ec7              # ERC-20 元数据 + 市值

# 交易
python3 $SCRIPT tx 0x5c50...f060                 # 交易详情
python3 $SCRIPT decode 0x5c50...f060             # 解码输入数据（使用 4byte.directory）
python3 $SCRIPT activity 0xd8dA...96045          # 最近的交易活动

# Gas
python3 $SCRIPT gas                              # Gas 价格 + 费用估算
python3 $SCRIPT gas --chain optimism

# 安全
python3 $SCRIPT allowance 0xd8dA...96045         # 检查危险的 ERC-20 授权
python3 $SCRIPT contract 0xdAC1...1ec7           # 合约检查（代理？标准？）

# ENS
python3 $SCRIPT ens vitalik.eth                  # 名称 -> 地址 + 个人资料
python3 $SCRIPT ens 0xd8dA...96045               # 地址 -> ENS 名称

# 巨鲸检测
python3 $SCRIPT whale                            # 大额转账（最近 20 个区块，>$10k）
python3 $SCRIPT whale --blocks 50 --min-usd 100000 --chain arbitrum
```

---

## 流程

### 0. 环境检查
```bash
python3 --version   # 需要 3.8+ 版本
python3 ~/.hermes/skills/blockchain/evm/scripts/evm_client.py stats
```

### 1. 钱包资产组合
显示原生代币余额 + 已知的 ERC-20 代币，按美元价值排序。
```bash
python3 $SCRIPT wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
python3 $SCRIPT wallet 0xd8dA... --chain bsc --no-prices   # 速度更快
```

### 2. 多链扫描
使用线程同时扫描同一地址在所有 8 条链上的情况。
```bash
python3 $SCRIPT multichain 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```
输出：每条链的原生代币余额 + 代币持有量 + 总美元价值。

### 3. 比较（Gas 和价格）
并行查询所有 8 条链。显示最便宜和最贵的链。
```bash
python3 $SCRIPT compare
```

### 4. 交易详情与解码
```bash
python3 $SCRIPT tx 0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060
python3 $SCRIPT decode 0x5c504ed...   # 显示人类可读的函数签名
```
解码使用 4byte.directory 将 `0xa9059cbb` 翻译为 `transfer(address,uint256)`。

### 5. ENS 解析
```bash
python3 $SCRIPT ens vitalik.eth          # -> 0xd8dA... + 头像 + 社交链接
python3 $SCRIPT ens 0xd8dA...96045       # -> vitalik.eth
```

### 6. 授权检查（安全）
检查授予已知 DEX/桥接合约的 ERC-20 授权。
```bash
python3 $SCRIPT allowance 0xYourWallet
```
将无限制（UNLIMITED）授权标记为高风险。

### 7. 合约检查器
```bash
python3 $SCRIPT contract 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48   # USDC（代理合约）
python3 $SCRIPT contract 0xdAC17F958D2ee523a2206206994597C13D831ec7   # USDT（ERC-20）
```
检测：代理（EIP-1967/EIP-1167）、ERC-20、ERC-721、ERC-165。显示字节码大小和代理的实现地址。

### 8. 巨鲸检测
```bash
python3 $SCRIPT whale                                    # ETH，最近 20 个区块，>$10k
python3 $SCRIPT whale --blocks 50 --min-usd 50000 --chain bsc
```

### 9. Gas 追踪器
```bash
python3 $SCRIPT gas
python3 $SCRIPT gas --chain polygon
```
显示 gwei 价格 + 美元成本，涵盖：转账、ERC-20 转账、授权（approve）、兑换（swap）、NFT 铸造、NFT 转账。

---

## 支持的链
| Key       | 名称           | 原生代币 | 链 ID    |
|-----------|----------------|----------|----------|
| ethereum  | Ethereum       | ETH      | 1        |
| bsc       | BNB Chain      | BNB      | 56       |
| base      | Base           | ETH      | 8453     |
| arbitrum  | Arbitrum One   | ETH      | 42161    |
| polygon   | Polygon        | POL      | 137      |
| optimism  | Optimism       | ETH      | 10       |
| avalanche | Avalanche C    | AVAX     | 43114    |
| zksync    | zkSync Era     | ETH      | 324      |

---

## 注意事项
- CoinGecko 免费层：约 10-30 请求/分钟。使用 `--no-prices` 进行更快的钱包扫描。
- 公共 RPC 可能存在速率限制。生产环境请设置 EVM_RPC_URL 为私有端点。
- `wallet` 和 `allowance` 仅检查已知代币列表（每条链约 30 个代币）。要发现所有代币，请使用区块浏览器。
- `activity` 仅扫描最近的区块（最多 200 个）。完整历史记录请使用 Etherscan API。
- `multichain` 运行 8 个并行线程 — 可能会触发公共 RPC 的速率限制。
- ENS 解析依赖于单个公共端点（ensideas.com / ens.vitalik.ca），没有备用方案。如果该端点宕机，`ens` 命令将失败 — 请稍后重试或使用区块浏览器。
- 交易解码依赖于单个公共端点（4byte.directory），没有备用方案。不在其数据库中的选择器将显示为 `unknown`。
- **L2 Gas 估算仅针对 L2 执行部分。** 在 Base、Arbitrum、Optimism 和 zkSync 等 Rollup 链上，实际交易成本还包括 L1 数据发布费用，该费用取决于 calldata 大小和当前的 L1 Gas 价格。`gas` 命令不估算该 L1 部分费用。具体到 Base，请参阅该网络的 L1 费用预言机（合约 `0x420000000000000000000000000000000000000F`）。
- 地址/交易哈希输入会验证是否以 0x 开头、长度正确且为十六进制格式，但**不强制** EIP-55 校验和大小写（RPC 端点接受任意大小写的十六进制）。

---

## 验证
```bash
# 应显示当前区块、Gas 价格、ETH 价格
python3 ~/.hermes/skills/blockchain/evm/scripts/evm_client.py stats

# 应将 vitalik.eth 解析为 0xd8dA...
python3 ~/.hermes/skills/blockchain/evm/scripts/evm_client.py ens vitalik.eth
```