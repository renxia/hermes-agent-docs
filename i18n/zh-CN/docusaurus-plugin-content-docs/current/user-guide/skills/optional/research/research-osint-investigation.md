---
title: "开源情报调查"
sidebar_label: "开源情报调查"
description: "公共记录开源情报调查框架 — SEC EDGAR 文件、USAspending 合同、参议院游说记录、OFAC 制裁名单、ICIJ 离岸泄露信息、纽约市房产记录（ACRIS）、OpenCorporates 企业注册信息、CourtListener 法院记录、Wayback Machine 存档、维基百科 + Wikidata、GDELT 新闻监测。跨来源实体解析、关联分析、时序关联、证据链。仅使用 Python 标准库。"
---

{/* 本页面由网站脚本 `website/scripts/generate-skill-docs.py` 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 开源情报调查

公共记录开源情报调查框架 — SEC EDGAR 文件、USAspending 合同、参议院游说记录、OFAC 制裁名单、ICIJ 离岸泄露信息、纽约市房产记录（ACRIS）、OpenCorporates 企业注册信息、CourtListener 法院记录、Wayback Machine 存档、维基百科 + Wikidata、GDELT 新闻监测。跨来源实体解析、关联分析、时序关联、证据链。仅使用 Python 标准库。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/research/osint-investigation` 安装 |
| 路径 | `optional-skills/research/osint-investigation` |
| 版本 | `0.1.0` |
| 作者 | Hermes 智能体（改编自 ShinMegamiBoson/OpenPlanter，MIT 许可证） |
| 平台 | linux, macos, windows |
| 标签 | `osint`, `调查`, `公共记录`, `SEC`, `制裁`, `企业注册`, `房产`, `法院`, `尽职调查`, `新闻` |
| 相关技能 | [`domain-intel`](/docs/user-guide/skills/optional/research/research-domain-intel), [`arxiv`](/docs/user-guide/skills/bundled/research/research-arxiv) |

:::info
以下是 Hermes 加载此技能时所依据的完整技能定义。这是智能体在技能激活时看到的说明。
:::

# 开源情报调查 — 公共记录交叉参考

用于公共记录开源情报的调查框架：政府合同、企业备案、游说活动、制裁名单、离岸泄露、财产记录、法庭记录、网络档案、知识库和全球新闻。通过异构来源解析实体，以明确置信度构建交叉链接，运行统计时序测试，并生成结构化证据链。

**仅使用 Python 标准库。** 无需安装。适用于 Linux、macOS、Windows。大多数来源无需 API 密钥即可使用（OpenCorporates 有一个可选的免费令牌，可以提高速率限制）。

改编自 MIT 许可的 ShinMegamiBoson/OpenPlanter 项目；并扩展以涵盖原始项目未涉及的身份、财产、诉讼、档案、新闻来源。

## 何时使用此技能

当用户要求进行以下操作时使用：
- "追踪资金流向" — 政府合同、游说活动 → 立法、制裁
- 企业尽职调查 — 谁控制公司 X，他们在哪里注册，谁在他们的董事会任职，他们提交了哪些备案
- 制裁筛查 — 实体 X 是否在 OFAC SDN、ICIJ 离岸泄露名单上
- 权钱交易调查 — 拥有离岸关联的承包商、赢得奖项的游说客户
- 财产所有权 — 按姓名或地址查找记录在案的契约/抵押（纽约市；其他县请指向用户相关的登记处）
- 诉讼历史 — 查找联邦和州法院判例以及 PACER 案卷
- 命名存在差异（如 LLC 后缀、缩写）的多来源实体解析
- 构建具有明确置信度级别的证据链
- "关于 X 说了什么" — 国际新闻（GDELT）+ Wikipedia 叙述 + Wayback Machine 以恢复失效的 URL

**不要**将此技能用于：
- 通用网络研究 → `web_search` / `web_extract`
- 域名/基础设施开源情报 → `domain-intel` 技能
- 学术文献 → `arxiv` 技能
- 社交媒体资料发现 → `sherlock` 技能（可选）
- 美国**联邦**竞选财务 — FEC 故意未涵盖在此（在免费的 DEMO_KEY 层级上，该 API 对临时贡献者姓名查询不可靠）。有关联邦捐款，请直接将用户指向 https://www.fec.gov/data/。

## 工作流程

智能体通过 `terminal` 工具运行脚本。`SKILL_DIR` 是保存此 SKILL.md 的目录。

### 1. 确定哪些来源适用

阅读数据源 wiki 条目以规划调查：
```
ls SKILL_DIR/references/sources/

# 联邦财务/监管
cat SKILL_DIR/references/sources/sec-edgar.md       # 企业备案
cat SKILL_DIR/references/sources/usaspending.md     # 联邦合同
cat SKILL_DIR/references/sources/senate-ld.md       # 游说活动
cat SKILL_DIR/references/sources/ofac-sdn.md        # 制裁名单
cat SKILL_DIR/references/sources/icij-offshore.md   # 离岸泄露

# 身份/财产/诉讼/档案/新闻
cat SKILL_DIR/references/sources/nyc-acris.md       # 纽约市财产记录
cat SKILL_DIR/references/sources/opencorporates.md  # 全球企业注册库
cat SKILL_DIR/references/sources/courtlistener.md   # 法庭记录（联邦和州）
cat SKILL_DIR/references/sources/wayback.md         # Wayback Machine 档案
cat SKILL_DIR/references/sources/wikipedia.md       # Wikipedia + Wikidata
cat SKILL_DIR/references/sources/gdelt.md           # 全球新闻监控
```

每个条目遵循9部分模板：摘要、访问方式、模式、覆盖范围、交叉参考键、数据质量、获取方法、法律信息、参考资料。

**交叉参考潜力**部分映射了源之间的连接键——请先阅读这些以选择正确的配对。

### 2. 获取数据

每个来源在 `SKILL_DIR/scripts/` 中都有一个仅使用标准库的获取脚本：

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
# 然后在本地搜索。缓存在 $HERMES_OSINT_CACHE/icij/ 下（默认：~/.cache/hermes-osint/icij/）。
python3 SKILL_DIR/scripts/fetch_icij_offshore.py --entity "EXAMPLE CORP" \
    --out data/icij.csv
```

**身份/财产/诉讼/档案/新闻**
```bash
# 纽约市财产记录（契约、抵押、留置权）— 通过 Socrata 访问 ACRIS
python3 SKILL_DIR/scripts/fetch_nyc_acris.py --name "SMITH, JOHN" \
    --out data/acris.csv
python3 SKILL_DIR/scripts/fetch_nyc_acris.py --address "571 HUDSON" \
    --out data/acris_addr.csv

# OpenCorporates — 130多个司法管辖区的企业注册库
# （需要免费令牌；设置 OPENCORPORATES_API_TOKEN 或传递 --token）
python3 SKILL_DIR/scripts/fetch_opencorporates.py --query "Example Corp" \
    --jurisdiction us_ny --out data/opencorporates.csv

# CourtListener — 联邦和州法院判例、PACER 案卷
python3 SKILL_DIR/scripts/fetch_courtlistener.py --query "Smith v. Example Corp" \
    --type opinions --out data/courts.csv

# Wayback Machine — 历史网页捕获
python3 SKILL_DIR/scripts/fetch_wayback.py --url "example.com" \
    --match host --collapse digest --out data/wayback.csv

# Wikipedia + Wikidata — 叙述性传记 + 结构化事实
# 设置 HERMES_OSINT_UA=your-app/1.0 (your@email) 以标识自己
python3 SKILL_DIR/scripts/fetch_wikipedia.py --query "Bill Gates" \
    --out data/wp.csv

# GDELT — 100多种语言的全球新闻，约2015年至今
python3 SKILL_DIR/scripts/fetch_gdelt.py --query '"Example Corp"' \
    --timespan 1y --out data/gdelt.csv
```

所有输出都是带标题行的规范化 CSV。脚本是幂等的，可以重新运行。

当某个私人个体不在某个来源中时（例如，非上市公司人员在 SEC EDGAR、非联邦承包商在 USAspending、非游说客户在参议院 LDA），脚本会返回0行并给出清晰警告，而不是静默写入空 CSV。EDGAR 会特别标记公司名称解析器匹配到个人 Form 3/4/5 提交者而不是公司注册人的情况。

速率限制注意事项在每个来源的 wiki 条目中。默认获取器会在分页请求之间礼貌地休眠。**API 密钥会提高支持它们的来源的速率限制**（`SEC_USER_AGENT`、`SENATE_LDA_TOKEN`、`OPENCORPORATES_API_TOKEN`、`COURTLISTENER_TOKEN`）。所有脚本都会立即显示 429 响应，并附带上游的配额消息，以便用户知道需要放慢速度或提供密钥。

### 3. 跨来源解析实体

规范化名称并在两个 CSV 文件之间查找匹配项：
```bash
# 将游说客户（参议院 LDA）与合同接受者（USAspending）进行匹配
python3 SKILL_DIR/scripts/entity_resolution.py \
    --left  data/lobbying.csv   --left-name-col  client_name \
    --right data/contracts.csv  --right-name-col recipient_name \
    --out data/cross_links.csv
```

三个匹配层级，具有明确的置信度：

| 层级 | 方法 | 置信度 |
|------|------|--------|
| `exact` | 规范化字符串在去除后缀/标点后相等 | 高 |
| `fuzzy` | 排序后的词元相等（词袋匹配） | 中 |
| `token_overlap` | ≥60% 词元重叠，≥2 个共享词元，词元长度 ≥4 字符 | 低 |

输出 `cross_links.csv` 列：`match_type, confidence, left_name, right_name, left_normalized, right_normalized, left_row, right_row`。

### 4. 统计时序相关性（可选）

使用排列检验测试两个时间序列是否可疑地聚集在一起——例如，游说备案与合同授予时间接近：
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

脚本的列标志是通用的——原始工具是为捐款与奖项编写的，但它适用于任何通过交叉链接连接的（事件，收款方）时间序列。零假设：事件时间与奖项日期无关。单尾 p 值 = 平均最近奖项距离 ≤ 观测值的排列比例。每个（付款方，供应商）对最少需要3个事件才能运行检验。

### 5. 构建调查结果 JSON（证据链）
```bash
python3 SKILL_DIR/scripts/build_findings.py \
    --cross-links data/cross_links.csv \
    --timing data/timing.json \
    --out data/findings.json
```

每个调查结果都有 `id, title, severity, confidence, summary, evidence[], sources[]`。每个证据项都指向源 CSV 中的特定行。用户（或后续智能体）可以针对其来源验证每个声明。

## 置信度与证据纪律

这是本技能的核心准则。请告知用户：

- 每项主张必须追溯到记录。不得进行无依据的断言。
- 置信度等级与主张绑定。`match_type=fuzzy` 表示"可能"，而非"已确认"。
- 实体解析产生的是候选结果，而非最终结论。"ACME LLC"与"Acme Holdings Group"之间的 `fuzzy` 匹配是一条线索，而非事实。
- 统计显著性不等于存在不当行为。p &lt; 0.05 意味着在零假设下该时间模式不太可能发生，并不能证明存在腐败。
- 此处所有数据源均为公开记录。它们可能仍包含不准确、过时信息或被涂改的内容（如 GDPR、密封记录）。

## 添加新数据源

使用模板：

```bash
cp SKILL_DIR/templates/source-template.md \
    SKILL_DIR/references/sources/<your-source>.md
```

填写全部 9 个部分。在 `scripts/` 中编写一个 `fetch_<source>.py` 脚本，该脚本仅使用标准库并生成标准化的 CSV 文件。更新上述"何时使用"部分的数据源列表。

## 工具及其局限性

- `entity_resolution.py` **不使用**外部模糊匹配库（无 rapidfuzz，无 jellyfish）。词袋匹配已是此处上限。若需要 Levenshtein 距离、音译或语音匹配，请另行安装。
- `timing_analysis.py` 使用 Python 的 `random` 进行置换检验。为获得可重现性，请传递 `--seed N` 参数。
- `fetch_*.py` 脚本使用 `urllib.request` 并遵守 `Retry-After` 头信息。大量抓取仍可能违反服务条款——请先阅读每个数据源的法律条款部分。

## 法律说明

所有第一阶段数据源均为公开记录。根据各自的访问条款（FOIA、公共记录法、ICIJ 明确发布、OFAC 公开数据），允许批量获取。但请注意：

- 某些数据源会进行严格的速率限制。请遵守其头部信息。
- 某些数据源会涂改注册人信息（如 WHOIS 的 GDPR、密封文件）。
- 通过交叉引用公开记录来识别私人个体可能涉及伦理问题。本技能生成的是证据链，而非指控。