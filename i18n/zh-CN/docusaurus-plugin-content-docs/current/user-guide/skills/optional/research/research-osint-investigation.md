---
title: "开源情报调查"
sidebar_label: "开源情报调查"
description: "公开记录的开源情报调查框架 — 包括 SEC EDGAR 申报、USAspending 合同、参议院游说记录、OFAC 制裁名单、ICIJ 离岸泄密文件、NYC 房产记录 (ACRIS)、OpenCorporates 公司注册信息、CourtListener 法院记录、Wayback Machine 存档、维基百科 + Wikidata、GDELT 新闻监控。跨源实体解析、交叉链接分析、时间关联、证据链构建。仅使用 Python 标准库。"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 开源情报调查

公开记录的开源情报调查框架 — 包括 SEC EDGAR 申报、USAspending 合同、参议院游说记录、OFAC 制裁名单、ICIJ 离岸泄密文件、NYC 房产记录 (ACRIS)、OpenCorporates 公司注册信息、CourtListener 法院记录、Wayback Machine 存档、维基百科 + Wikidata、GDELT 新闻监控。跨源实体解析、交叉链接分析、时间关联、证据链构建。仅使用 Python 标准库。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/research/osint-investigation` 安装 |
| 路径 | `optional-skills/research/osint-investigation` |
| 版本 | `0.1.0` |
| 作者 | Hermes 智能体 (改编自 ShinMegamiBoson/OpenPlanter, MIT) |
| 平台 | linux, macos, windows |
| 标签 | `osint`, `调查`, `公开记录`, `sec`, `制裁`, `公司注册`, `房产`, `法院`, `尽职调查`, `新闻业` |
| 相关技能 | [`domain-intel`](/user-guide/skills/optional/research/research-domain-intel), [`arxiv`](/user-guide/skills/bundled/research/research-arxiv) |

---
title: "OSINT 调查 — 公共记录交叉引用"
description: "公共记录 OSINT 调查框架，涵盖政府合同、企业备案、游说活动、制裁名单、离岸泄露、财产记录、法庭记录、网络存档、知识库和全球新闻。用于跨异构数据源解析实体，建立带有明确置信度的交叉链接，运行统计时序测试，并生成结构化证据链。"
slug: "osint-investigation-public-records-cross-reference"
---

:::info
以下是触发此技能时，Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# OSINT 调查 — 公共记录交叉引用

针对公共记录的开源情报调查框架：涵盖政府合同、企业备案、游说活动、制裁名单、离岸泄露、财产记录、法庭记录、网络存档、知识库和全球新闻。跨异构数据源解析实体，建立带有明确置信度的交叉链接，运行统计时序测试，并生成结构化证据链。

**仅使用 Python 标准库。** 无需安装。兼容 Linux、macOS、Windows。大多数数据源无需 API 密钥（OpenCorporates 可选提供免费令牌以提升速率限制）。

改编自 MIT 许可的 ShinMegamiBoson/OpenPlanter 项目；并扩展涵盖了原始项目未涉及的身份/财产/诉讼/存档/新闻数据源。

## 何时使用此技能

当用户询问以下内容时使用：

-   “追踪资金流向” — 政府合同、游说活动 → 立法、制裁
-   企业尽职调查 — 谁控制公司 X，其注册地，董事会成员，提交了哪些文件
-   制裁筛查 — 实体 X 是否在 OFAC SDN、ICIJ 离岸泄露名单上
-   权钱交易调查 — 具有离岸关联的承包商、赢得合同的游说客户
-   财产所有权 — 按姓名或地址查找记录在案的契约/抵押（纽约市；对于其他县，请引导用户联系相关登记处）
-   诉讼历史 — 查找联邦及州法院判决和 PACER 案件档案
-   命名存在差异时的多源实体解析（如 LLC 后缀、缩写）
-   构建带有明确置信度级别的证据链
-   “关于 X 的言论” — 国际新闻（GDELT）+ Wikipedia 叙述 + Wayback Machine 以恢复失效 URL

请勿将此技能用于：

-   通用网络研究 → 使用 `web_search` / `web_extract`
-   域名/基础设施 OSINT → 使用 `domain-intel` 技能
-   学术文献 → 使用 `arxiv` 技能
-   社交媒体档案发现 → 使用 `sherlock` 技能（可选）
-   美国**联邦**竞选财务 — FEC 有意未包含在此处（在免费 DEMO_KEY 层级，该 API 对临时贡献者姓名查询不可靠）。有关联邦捐款，请直接引导用户访问 https://www.fec.gov/data/。

## 工作流程

智能体通过 `terminal` 工具运行脚本。`SKILL_DIR` 是存放此 SKILL.md 的目录。

### 1. 确定适用的数据源

阅读数据源条目以规划调查：

```
ls SKILL_DIR/references/sources/

# 联邦财务/监管
cat SKILL_DIR/references/sources/sec-edgar.md       # 企业备案
cat SKILL_DIR/references/sources/usaspending.md     # 联邦合同
cat SKILL_DIR/references/sources/senate-ld.md       # 游说活动
cat SKILL_DIR/references/sources/ofac-sdn.md        # 制裁名单
cat SKILL_DIR/references/sources/icij-offshore.md   # 离岸泄露

# 身份/财产/诉讼/存档/新闻
cat SKILL_DIR/references/sources/nyc-acris.md       # 纽约市财产记录
cat SKILL_DIR/references/sources/opencorporates.md  # 全球企业注册信息
cat SKILL_DIR/references/sources/courtlistener.md   # 法庭记录（联邦及州）
cat SKILL_DIR/references/sources/wayback.md         # Wayback Machine 存档
cat SKILL_DIR/references/sources/wikipedia.md       # Wikipedia + Wikidata
cat SKILL_DIR/references/sources/gdelt.md           # 全球新闻监测
```

每个条目包含 9 个部分：概要、访问方式、数据模式、覆盖范围、交叉引用键、数据质量、获取方式、法律依据、参考文献。

**交叉引用潜力**部分映射了数据源之间的连接键 — 请优先阅读这些内容以选择正确的配对。

### 2. 获取数据

每个数据源在 `SKILL_DIR/scripts/` 中都有一个仅使用标准库的获取脚本：

**联邦财务/监管**

```bash
# SEC EDGAR 备案（企业披露）
python3 SKILL_DIR/scripts/fetch_sec_edgar.py --cik 0000320193 \
    --types 10-K,10-Q --out data/edgar_filings.csv

# USAspending 联邦合同
python3 SKILL_DIR/scripts/fetch_usaspending.py --recipient "EXAMPLE CORP" \
    --fy 2024 --out data/contracts.csv

# 参议院 LD-1 / LD-2 游说披露
python3 SKILL_DIR/scripts/fetch_senate_ld.py --client "EXAMPLE CORP" \
    --year 2024 --out data/lobbying.csv

# OFAC SDN 制裁名单（完整快照）
python3 SKILL_DIR/scripts/fetch_ofac_sdn.py --out data/ofac_sdn.csv

# ICIJ 离岸泄露 — 首次使用时下载约 70 MB 的批量 CSV，
# 然后进行本地搜索。在 $HERMES_OSINT_CACHE/icij/ 下缓存 30 天
# （默认路径：~/.cache/hermes-osint/icij/）。
python3 SKILL_DIR/scripts/fetch_icij_offshore.py --entity "EXAMPLE CORP" \
    --out data/icij.csv
```

**身份/财产/诉讼/存档/新闻**

```bash
# 纽约市财产记录（契约、抵押、留置权） — 通过 Socrata 获取 ACRIS
python3 SKILL_DIR/scripts/fetch_nyc_acris.py --name "SMITH, JOHN" \
    --out data/acris.csv
python3 SKILL_DIR/scripts/fetch_nyc_acris.py --address "571 HUDSON" \
    --out data/acris_addr.csv

# OpenCorporates — 涵盖 130 多个司法管辖区的企业注册信息
# （需要免费令牌；设置 OPENCORPORATES_API_TOKEN 或使用 --token 传递）
python3 SKILL_DIR/scripts/fetch_opencorporates.py --query "Example Corp" \
    --jurisdiction us_ny --out data/opencorporates.csv

# CourtListener — 联邦及州法院判决、PACER 案件档案
python3 SKILL_DIR/scripts/fetch_courtlistener.py --query "Smith v. Example Corp" \
    --type opinions --out data/courts.csv

# Wayback Machine — 历史网页存档
python3 SKILL_DIR/scripts/fetch_wayback.py --url "example.com" \
    --match host --collapse digest --out data/wayback.csv

# Wikipedia + Wikidata — 叙述性简介 + 结构化事实
# 设置 HERMES_OSINT_UA=your-app/1.0 (your@email) 以标识自身
python3 SKILL_DIR/scripts/fetch_wikipedia.py --query "Bill Gates" \
    --out data/wp.csv

# GDELT — 覆盖 100 多种语言的全球新闻，时间跨度约 2015 年至今
python3 SKILL_DIR/scripts/fetch_gdelt.py --query '"Example Corp"' \
    --timespan 1y --out data/gdelt.csv
```

所有输出均为带标题行的标准化 CSV 文件。脚本可重复运行（幂等性）。

当某个私人个体不会出现在特定数据源中时（例如，非上市公司的人员在 SEC EDGAR 中，非联邦承包商在 USAspending 中，非游说客户在参议院 LDA 中），脚本会返回 0 行并给出明确警告，而非静默写入空 CSV。EDGAR 会在公司名称解析器匹配到的是个人 Form 3/4/5 提交者而非公司注册者时特别标记。

速率限制注意事项位于每个数据源的条目中。默认的获取脚本会在分页请求之间礼貌地休眠。**对于支持 API 密钥的数据源，API 密钥可提升速率限制**（`SEC_USER_AGENT`、`SENATE_LDA_TOKEN`、`OPENCORPORATES_API_TOKEN`、`COURTLISTENER_TOKEN`）。所有脚本会立即显示 429 响应，并附带上游的配额消息，以便用户知道需要减慢速度或提供密钥。

### 3. 跨数据源解析实体

标准化名称并找到两个 CSV 文件之间的匹配项：

```bash
# 将游说客户（参议院 LDA）与合同接受者（USAspending）进行匹配
python3 SKILL_DIR/scripts/entity_resolution.py \
    --left  data/lobbying.csv   --left-name-col  client_name \
    --right data/contracts.csv  --right-name-col recipient_name \
    --out data/cross_links.csv
```

三个匹配层级及其明确置信度：

| 层级       | 方法                                       | 置信度 |
|------------|--------------------------------------------|--------|
| `exact`    | 移除后缀/标点后标准化字符串相等              | 高     |
| `fuzzy`    | 排序后词符相等（词袋匹配）                   | 中     |
| `token_overlap` | 词符重叠度 ≥60%，且至少有 2 个共同词符，词符长度 ≥4 字符 | 低 |

输出 `cross_links.csv` 的列：`match_type, confidence, left_name, right_name, left_normalized, right_normalized, left_row, right_row`。

### 4. 统计时序相关性分析（可选）

使用置换测试检验两个时间序列是否可疑地紧密聚集 — 例如，游说备案时间与合同授予时间是否接近：

```bash
python3 SKILL_DIR/scripts/timing_analysis.py \
    --donations data/lobbying.csv --donation-date-col filing_date \
        --donation-amount-col income --donation-donor-col client_name \
        --donation-recipient-col registrant_name \
    --contracts data/contracts.csv --contract-date-col award_date \
        --contract-vendor-col recipient_name \
    --cross-links data/cross_links.csv \
    --permutations 1000 \
    --out data/timing.json
```

脚本的列参数标志是通用的 — 原始工具是为捐款与合同奖项编写的，但它适用于任何通过交叉链接连接的（事件，收款方）时间序列。零假设：事件时序与授予日期独立。单尾 p 值 = 平均最近授予距离 ≤ 观测值的置换比例。每对（付款方，供应商）至少需要 3 个事件才能运行此测试。

### 5. 构建调查结果 JSON（证据链）

```bash
python3 SKILL_DIR/scripts/build_findings.py \
    --cross-links data/cross_links.csv \
    --timing data/timing.json \
    --out data/findings.json
```

每条结果包含 `id, title, severity, confidence, summary, evidence[], sources[]`。每个证据项都指向源 CSV 中的特定行。用户（或后续智能体）可以针对其来源验证每个断言。

## 置信度与证据纪律

这是该技能的核心规则。请告知用户：

- 每项主张都必须有记录可循。不能做没有依据的断言。
- 置信度等级与主张一同传递。`match_type=fuzzy` 是“可能的”，而非“已确认的”。
- 实体解析产生的是候选项，而非结论。“ACME LLC”与“Acme Holdings Group”之间的 `fuzzy` 匹配只是一条线索，而非事实。
- 统计显著性 ≠ 不当行为。p &lt; 0.05 表示在原假设下，这种时间模式出现的可能性很低。但这并不能证实存在腐败行为。
- 此处的所有数据源均为公开记录。它们可能仍包含不准确信息、过时信息或经过删节（受GDPR、密封记录等影响）。

## 添加新数据源

使用模板：

```bash
cp SKILL_DIR/templates/source-template.md \
    SKILL_DIR/references/sources/<your-source>.md
```

填写所有9个部分。在 `scripts/` 目录下编写一个 `fetch_<source>.py` 脚本，仅使用Python标准库并输出标准化的CSV文件。更新上方“何时使用”部分的数据源列表。

## 工具及其局限性

- `entity_resolution.py` 不使用外部的模糊匹配库（无rapidfuzz，无jellyfish）。词袋匹配是此处的上限。如果您需要Levenshtein距离、音译或语音匹配，请单独通过pip安装相关库。
- `timing_analysis.py` 使用Python的 `random` 模块进行置换检验。为了可重现性，请传递参数 `--seed N`。
- `fetch_*.py` 脚本使用 `urllib.request` 并遵守 `Retry-After` 头。大量密集使用仍可能违反服务条款——请先阅读每个数据源的法律声明部分。

## 法律声明

所有第一阶段的数据源均为公开记录。根据其各自的访问条款（如《信息自由法》、公共记录法、ICIJ明确公开数据、OFAC公开数据），允许进行批量获取。但是：

- 某些数据源限制请求频率较为严格。请遵守其返回的请求头。
- 某些数据源会对注册人信息进行删节（如WHOIS受GDPR影响、密封的法庭记录）。
- 交叉引用公开记录以识别私人个体可能带来伦理问题。该技能产生的是证据链，而非指控。