---
title: "域名情报 — 使用 Python 标准库进行被动域名侦察"
sidebar_label: "域名情报"
description: "使用 Python 标准库进行被动域名侦察"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 域名情报

使用 Python 标准库进行被动域名侦察。包括子域名发现、SSL 证书检查、WHOIS 查询、DNS 记录、域名可用性检查和批量多域名分析。无需 API 密钥。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/research/domain-intel` 安装 |
| 路径 | `optional-skills/research/domain-intel` |
| 平台 | linux, macos, windows |

## 参考：完整 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# 域名情报 — 被动 OSINT

仅使用 Python 标准库进行被动域名侦察。
**零依赖。零 API 密钥。适用于 Linux、macOS 和 Windows。**

## 辅助脚本

此技能包含 `scripts/domain_intel.py` — 一个用于所有域名情报操作的完整命令行工具。

```bash
# 通过证书透明度日志发现子域名
python3 SKILL_DIR/scripts/domain_intel.py subdomains example.com

# SSL 证书检查（过期时间、密码、SANs、颁发者）
python3 SKILL_DIR/scripts/domain_intel.py ssl example.com

# WHOIS 查询（注册商、日期、域名服务器 — 支持 100 多个顶级域名）
python3 SKILL_DIR/scripts/domain_intel.py whois example.com

# DNS 记录（A, AAAA, MX, NS, TXT, CNAME）
python3 SKILL_DIR/scripts/domain_intel.py dns example.com

# 域名可用性检查（被动：通过 DNS + WHOIS + SSL 信号）
python3 SKILL_DIR/scripts/domain_intel.py available coolstartup.io

# 批量分析 — 多个域名，并行进行多项检查
python3 SKILL_DIR/scripts/domain_intel.py bulk example.com github.com google.com
python3 SKILL_DIR/scripts/domain_intel.py bulk example.com github.com --checks ssl,dns
```

`SKILL_DIR` 是包含此 SKILL.md 文件的目录。所有输出均为结构化 JSON。

## 可用命令

| 命令 | 功能 | 数据来源 |
|---------|-------------|-------------|
| `subdomains` | 从证书日志中查找子域名 | crt.sh (HTTPS) |
| `ssl` | 检查 TLS 证书详情 | 直接 TCP:443 连接目标 |
| `whois` | 注册信息、注册商、日期 | WHOIS 服务器 (TCP:43) |
| `dns` | A, AAAA, MX, NS, TXT, CNAME 记录 | 系统 DNS + Google DoH |
| `available` | 检查域名是否已注册 | DNS + WHOIS + SSL 信号 |
| `bulk` | 对多个域名运行多项检查 | 以上所有来源 |

## 何时使用此技能而非内置工具

- **使用此技能**回答基础设施问题：子域名、SSL 证书、WHOIS、DNS 记录、可用性
- **使用 `web_search`** 进行关于域名/公司做什么的一般性研究
- **使用 `web_extract`** 获取网页的实际内容
- **使用 `terminal` 命令 `curl -I`** 进行简单的“此 URL 是否可达”检查

| 任务 | 更好的工具 | 原因 |
|------|-------------|-----|
| “example.com 是做什么的？” | `web_extract` | 获取页面内容，而非 DNS/WHOIS 数据 |
| “查找某公司的信息” | `web_search` | 通用研究，非特定于域名 |
| “这个网站安全吗？” | `web_search` | 声誉检查需要网络上下文 |
| “检查 URL 是否可达” | `terminal` 命令 `curl -I` | 简单的 HTTP 检查 |
| “查找 X 的子域名” | **此技能** | 这是唯一的被动来源 |
| “SSL 证书何时过期？” | **此技能** | 内置工具无法检查 TLS |
| “谁注册了这个域名？” | **此技能** | WHOIS 数据不在网页搜索结果中 |
| “coolstartup.io 是否可用？” | **此技能** | 通过 DNS+WHOIS+SSL 进行被动可用性检查 |

## 平台兼容性

纯 Python 标准库 (`socket`, `ssl`, `urllib`, `json`, `concurrent.futures`)。
在 Linux、macOS 和 Windows 上运行完全相同，无需任何依赖。

- **crt.sh 查询**使用 HTTPS (端口 443) — 可在大多数防火墙后工作
- **WHOIS 查询**使用 TCP 端口 43 — 在限制性网络中可能被阻止
- **DNS 查询**使用 Google DoH (HTTPS) 解析 MX/NS/TXT — 防火墙友好
- **SSL 检查**连接到目标端口 443 — 唯一“主动”的操作

## 数据来源

所有查询都是**被动**的 — 无端口扫描，无漏洞测试：

- **crt.sh** — 证书透明度日志（子域名发现，仅 HTTPS）
- **WHOIS 服务器** — 直接 TCP 连接到 100 多个权威的顶级域名注册局
- **Google DNS-over-HTTPS** — MX, NS, TXT, CNAME 解析（防火墙友好）
- **系统 DNS** — A/AAAA 记录解析
- **SSL 检查**是唯一的“主动”操作（到目标:443 的 TCP 连接）

## 注意事项

- WHOIS 查询使用 TCP 端口 43 — 在限制性网络中可能被阻止
- 一些 WHOIS 服务器会隐藏注册人信息（GDPR）— 请向用户说明这一点
- 对于非常热门的域名（数千个证书），crt.sh 可能会很慢 — 请设定合理的期望
- 可用性检查基于启发式方法（3 个被动信号）— 不如注册商 API 权威

---

*由 [@FurkanL0](https://github.com/FurkanL0) 贡献*