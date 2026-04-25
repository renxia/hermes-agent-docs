---
title: "Llm Wiki — Karpathy's LLM Wiki — 构建并维护一个持久化、相互关联的 Markdown 知识库"
sidebar_label: "Llm Wiki"
description: "Karpathy's LLM Wiki — 构建并维护一个持久化、相互关联的 Markdown 知识库"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 从该技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Llm Wiki

Karpathy's LLM Wiki — 构建并维护一个持久化、相互关联的 Markdown 知识库。摄取来源，查询已编译的知识，并进行一致性检查。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/research/llm-wiki` |
| 版本 | `2.1.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 标签 | `wiki`, `knowledge-base`, `research`, `notes`, `markdown`, `rag-alternative` |
| 相关技能 | [`obsidian`](/docs/user-guide/skills/bundled/note-taking/note-taking-obsidian), [`arxiv`](/docs/user-guide/skills/bundled/research/research-arxiv) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在此技能触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Karpathy 的 LLM 维基

构建并维护一个持久的、可累积的知识库，以相互链接的 Markdown 文件形式组织。  
基于 [Andrej Karpathy 的 LLM 维基模式](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)。

与传统 RAG（每次查询都从零开始重新发现知识）不同，该维基  
一次性编译知识并保持其最新状态。交叉引用已预先建立，  
矛盾之处已被标记，综合内容反映了所有已摄入的信息。

**分工：** 人类负责筛选来源并指导分析方向，智能体  
负责总结、交叉引用、归档及维护一致性。

## 此技能何时激活

当用户执行以下操作时，请使用此技能：
- 要求创建、构建或启动一个维基或知识库
- 要求将某个来源摄入、添加或处理到其维基中
- 提出问题，且配置路径下已存在一个维基
- 要求对其维基进行 lint（语法/结构检查）、审计或健康检查
- 在研究上下文中提及他们的维基、知识库或“笔记”

## 维基位置

**位置：** 通过 `WIKI_PATH` 环境变量设置（例如在 `~/.hermes/.env` 中）。

如果未设置，则默认为 `~/wiki`。

```bash
WIKI="${WIKI_PATH:-$HOME/wiki}"
```

该维基仅是一个包含 Markdown 文件的目录 —— 可在 Obsidian、VS Code 或  
任意编辑器中打开。无需数据库，也无需特殊工具。

## 架构：三层结构

```
wiki/
├── SCHEMA.md           # 约定、结构规则、领域配置
├── index.md            # 分节内容目录，每项带一行摘要
├── log.md              # 按时间顺序的操作日志（仅追加，每年轮换）
├── raw/                # 第1层：不可变原始材料
│   ├── articles/       # 网页文章、剪报
│   ├── papers/         # PDF、arXiv 论文
│   ├── transcripts/    # 会议记录、访谈
│   └── assets/         # 图片、图表（被来源引用）
├── entities/           # 第2层：实体页面（人物、组织、产品、模型）
├── concepts/           # 第2层：概念/主题页面
├── comparisons/        # 第2层：并排分析
└── queries/            # 第2层：值得保留的已归档查询结果
```

**第1层 — 原始来源：** 不可变。智能体仅读取，绝不修改这些文件。  
**第2层 — 维基：** 由智能体拥有的 Markdown 文件。由智能体创建、更新并交叉引用。  
**第3层 — 模式：** `SCHEMA.md` 定义结构、约定和标签分类法。

## 恢复现有维基（关键 —— 每次会话都必须执行）

当用户已有维基时，**在执行任何操作前，务必先完成定位**：

① **阅读 `SCHEMA.md`** —— 了解领域、约定和标签分类法。  
② **阅读 `index.md`** —— 了解现有页面及其摘要。  
③ **扫描最近的 `log.md`** —— 阅读最后 20-30 条记录以了解近期活动。

```bash
WIKI="${WIKI_PATH:-$HOME/wiki}"
# 会话开始时的定位读取
read_file "$WIKI/SCHEMA.md"
read_file "$WIKI/index.md"
read_file "$WIKI/log.md" offset=<最后30行>
```

仅完成定位后，才可进行摄入、查询或 lint 操作。这可以避免：
- 为已存在的实体创建重复页面
- 遗漏对现有内容的交叉引用
- 违反模式中的约定
- 重复已记录的工作

对于大型维基（100+ 页面），在创建任何新内容前，还应针对当前主题快速运行一次 `search_files`。

## 初始化新维基

当用户要求创建或启动一个维基时：

1. 确定维基路径（来自 `$WIKI_PATH` 环境变量，或询问用户；默认为 `~/wiki`）  
2. 创建上述目录结构  
3. 询问用户该维基涵盖的领域 —— 尽量具体  
4. 根据领域编写定制的 `SCHEMA.md`（见下方模板）  
5. 编写带分节标题的初始 `index.md`  
6. 编写包含创建条目的初始 `log.md`  
7. 确认维基已就绪，并建议首批待摄入的来源

### SCHEMA.md 模板

请根据用户的领域进行调整。该模式约束智能体的行为并确保一致性：

```markdown
# 维基模式

## 领域
[该维基涵盖的内容 —— 例如：“AI/ML 研究”、“个人健康”、“初创企业情报”]

## 约定
- 文件名：小写，使用连字符，无空格（例如：`transformer-architecture.md`）
- 每个维基页面以 YAML 前置元数据开头（见下文）
- 使用 `[[wikilinks]]` 在页面间建立链接（每页至少包含 2 个出站链接）
- 更新页面时，必须更新 `updated` 日期
- 每个新页面必须添加到 `index.md` 的正确章节下
- 每次操作必须追加到 `log.md`
- **溯源标记：** 在综合了 3 个以上来源的页面上，在段落末尾附加 `^[raw/articles/source-file.md]`，  
  以标明该段主张来自特定来源。这使得读者无需重读整个原始文件即可追溯每条主张。  
  对于单一来源的页面，若 `sources:` 前置元数据已足够，则此标记可选。

## 前置元数据
  ```yaml
  ---
  title: 页面标题
  created: YYYY-MM-DD
  updated: YYYY-MM-DD
  type: entity | concept | comparison | query | summary
  tags: [来自下方分类法]
  sources: [raw/articles/source-name.md]
  # 可选的质量信号：
  confidence: high | medium | low        # 主张的支持程度
  contested: true                        # 当页面存在未解决的矛盾时设置
  contradictions: [other-page-slug]      # 与此页冲突的其他页面
  ---
  ```

`confidence` 和 `contested` 为可选，但推荐用于观点性强或快速变化的  
主题。Lint 会标记出 `contested: true` 和 `confidence: low` 的页面以供审查，  
防止薄弱主张 silently 固化为被接受的维基事实。

### raw/ 前置元数据

原始来源**也**需包含一个小型前置元数据块，以便重新摄入时检测内容漂移：

```yaml
---
source_url: https://example.com/article   # 原始 URL（如适用）
ingested: YYYY-MM-DD
sha256: <前置元数据下方原始内容的十六进制摘要>
---
```

`sha256:` 允许未来对同一 URL 的重新摄入在内容未变更时跳过处理，  
并在内容变更时标记漂移。计算范围仅限正文（闭合 `---` 之后的所有内容），  
不包括前置元数据本身。

## 标签分类法
[为该领域定义 10-20 个顶级标签。使用新标签前，请先在此处添加。]

AI/ML 示例：
- 模型：model, architecture, benchmark, training
- 人物/组织：person, company, lab, open-source
- 技术：optimization, fine-tuning, inference, alignment, data
- 元信息：comparison, timeline, controversy, prediction

规则：页面上使用的每个标签必须出现在此分类法中。如需新标签，  
请先在此处添加，再使用。这有助于防止标签泛滥。

## 页面阈值
- **创建页面**：当某个实体/概念出现在 2 个以上来源中，或对某一来源至关重要时  
- **添加到现有页面**：当某个来源提及已被覆盖的内容时  
- **不要创建页面**：对于偶然提及、次要细节或领域外内容  
- **拆分页面**：当页面超过约 200 行时 —— 拆分为子主题并通过交叉链接关联  
- **归档页面**：当其内容被完全取代时 —— 移至 `_archive/`，从索引中移除

## 实体页面
每个显著实体一个页面。包括：
- 概述 / 它是什么
- 关键事实和日期
- 与其他实体的关系（[[wikilinks]]）
- 来源引用

## 概念页面
每个概念或主题一个页面。包括：
- 定义 / 解释
- 当前知识状态
- 开放问题或争议
- 相关概念（[[wikilinks]]）

## 比较页面
并排分析。包括：
- 比较对象及原因
- 比较维度（推荐表格格式）
- 结论或综合
- 来源

## 更新策略
当新信息与现有内容冲突时：
1. 检查日期 —— 较新的来源通常取代较旧的来源  
2. 若确实矛盾，请同时记录两种观点及其日期和来源  
3. 在前置元数据中标记矛盾：`contradictions: [page-name]`  
4. 在 lint 报告中标记以供用户审查  
```

### index.md 模板

索引按类型分节。每项为一行：维基链接 + 摘要。

```markdown
# 维基索引

> 内容目录。每个维基页面按其类型列出，并附有一行摘要。
> 任何查询前请先阅读此文件以查找相关页面。
> 最后更新：YYYY-MM-DD | 总页数：N

## 实体
<!-- 节内按字母顺序排列 -->

## 概念

## 比较

## 查询
```

**扩展规则：** 当任意一节超过 50 项时，按首字母或子领域拆分为子节。  
当索引总项超过 200 项时，创建 `_meta/topic-map.md`，按主题对页面分组以加快导航。

### log.md 模板

```markdown
# 维基日志

> 所有维基操作的时间顺序记录。仅追加。
> 格式：`## [YYYY-MM-DD] 操作 | 主题`
> 操作：ingest, update, query, lint, create, archive, delete
> 当此文件超过 500 条记录时，轮换：重命名为 log-YYYY.md，重新开始。
```

## [YYYY-MM-DD] 创建 | Wiki 初始化
- 领域：[domain]
- 已创建结构，包含 SCHEMA.md、index.md、log.md
```

## 核心操作

### 1. 摄取

当用户提供来源（URL、文件、粘贴内容）时，将其整合到 wiki 中：

① **捕获原始来源：**
   - URL → 使用 `web_extract` 获取 Markdown，保存到 `raw/articles/`
   - PDF → 使用 `web_extract`（支持 PDF），保存到 `raw/papers/`
   - 粘贴文本 → 保存到适当的 `raw/` 子目录
   - 文件命名需具描述性：`raw/articles/karpathy-llm-wiki-2026.md`
   - **添加原始前置元数据**（`source_url`、`ingested`、正文的 `sha256`）。
     对同一 URL 重新摄取时：重新计算 sha256，与存储值比较 —
     若相同则跳过，若不同则标记漂移并更新。此操作成本极低，
     可在每次重新摄取时执行，以捕获无声的源更改。

② **与用户讨论要点** — 哪些内容有趣，哪些对领域重要。
   （在自动化/cron 上下文中跳过此步 — 直接继续。）

③ **检查已有内容** — 搜索 index.md 并使用 `search_files` 查找
   提及的实体/概念的相关页面。这是不断增长的 wiki 与重复内容堆的区别。

④ **编写或更新 wiki 页面：**
   - **新实体/概念：** 仅在满足 SCHEMA.md 中的页面阈值时创建页面
     （2+ 个来源提及，或对某个来源至关重要）
   - **现有页面：** 添加新信息，更新事实，更新 `updated` 日期。
     当新信息与现有内容矛盾时，遵循更新策略。
   - **交叉引用：** 每个新建或更新的页面必须通过 `[[wikilinks]]` 链接到至少 2 个其他页面。检查现有页面是否反向链接。
   - **标签：** 仅使用 SCHEMA.md 分类法中的标签
   - **出处：** 在综合 3+ 个来源的页面上，为段落附加 `^[raw/articles/source.md]` 标记，以标明其主张源自特定来源。
   - **置信度：** 对于观点性强、变化快或单一来源的主张，在前置元数据中设置 `confidence: medium` 或 `low`。除非主张在多个来源中得到充分支持，否则不要标记为 `high`。

⑤ **更新导航：**
   - 将新页面按字母顺序添加到 `index.md` 的正确章节下
   - 更新 index 头部的“总页数”计数和“最后更新”日期
   - 追加到 `log.md`：`## [YYYY-MM-DD] 摄取 | 来源标题`
   - 在日志条目中列出每个创建或更新的文件

⑥ **报告变更内容** — 向用户列出每个创建或更新的文件。

单个来源可能触发 5-15 个 wiki 页面的更新。这是正常且期望的 — 这是复利效应。

### 2. 查询

当用户询问关于 wiki 领域的问题时：

① **阅读 `index.md`** 以识别相关页面。
② **对于 100+ 页的 wiki**，还需在所有 `.md` 文件中搜索关键词 — 仅靠索引可能遗漏相关内容。
③ **使用 `read_file` 阅读相关页面**。
④ **综合编译知识得出答案**。引用所依据的 wiki 页面：“基于 [[page-a]] 和 [[page-b]]...”
⑤ **将有价值的答案归档** — 如果答案是实质性比较、深度分析或新颖综合，则在 `queries/` 或 `comparisons/` 中创建页面。不要归档简单查询 — 仅归档那些重新推导会很痛苦的答案。
⑥ **更新日志.md**，记录查询及其是否被归档。

### 3. 检查

当用户要求检查、健康检查或审计 wiki 时：

① **孤立页面：** 查找没有其他页面 inbound `[[wikilinks]]` 的页面。
```python
# 使用 execute_code 执行此操作 — 对所有 wiki 页面进行程序化扫描
import os, re
from collections import defaultdict
wiki = "<WIKI_PATH>"
# 扫描 entities/、concepts/、comparisons/、queries/ 中的所有 .md 文件
# 提取所有 [[wikilinks]] — 构建 inbound 链接映射
# inbound 链接为零的页面即为孤立页面
```

② **损坏的 wikilinks：** 查找指向不存在页面的 `[[links]]`。

③ **索引完整性：** 每个 wiki 页面都应出现在 `index.md` 中。比较文件系统与索引条目。

④ **前置元数据验证：** 每个 wiki 页面必须包含所有必需字段
   （title、created、updated、type、tags、sources）。标签必须在分类法中。

⑤ **陈旧内容：** `updated` 日期比提及相同实体的最新来源早 90 天以上的页面。

⑥ **矛盾：** 同一主题但主张冲突的页面。查找共享标签/实体但陈述不同事实的页面。将所有带有 `contested: true` 或 `contradictions:` 前置元数据的页面提交用户审查。

⑦ **质量信号：** 列出 `confidence: low` 的页面，以及仅引用单一来源但未设置置信度字段的任何页面 — 这些是需要寻找佐证或降级为 `confidence: medium` 的候选页面。

⑧ **来源漂移：** 对 `raw/` 中每个带有 `sha256:` 前置元数据的文件，重新计算哈希并标记不匹配项。不匹配表示原始文件被编辑（不应发生 — raw/ 是不可变的）或从已更改的 URL 摄取。这不是硬性错误，但值得报告。

⑨ **页面大小：** 标记超过 200 行的页面 — 这些是拆分的候选页面。

⑩ **标签审计：** 列出所有使用的标签，标记任何不在 SCHEMA.md 分类法中的标签。

⑪ **日志轮换：** 如果 log.md 超过 500 个条目，则轮换它。

⑫ **报告发现的问题**，附带具体文件路径和建议操作，按严重性分组（损坏链接 > 孤立页面 > 来源漂移 > 争议页面 > 陈旧内容 > 样式问题）。

⑬ **追加到 log.md：** `## [YYYY-MM-DD] 检查 | 发现 N 个问题`

## 使用 Wiki

### 搜索

```bash
# 按内容查找页面
search_files "transformer" path="$WIKI" file_glob="*.md"

# 按文件名查找页面
search_files "*.md" target="files" path="$WIKI"

# 按标签查找页面
search_files "tags:.*alignment" path="$WIKI" file_glob="*.md"

# 最近活动
read_file "$WIKI/log.md" offset=<最后 20 行>
```

### 批量摄取

当一次性摄取多个来源时，请分批处理更新：
1. 首先读取所有来源
2. 识别所有来源中的所有实体和概念
3. 检查现有页面中是否包含所有这些内容（一次搜索，而非 N 次）
4. 一次性创建/更新页面（避免冗余更新）
5. 最后更新 index.md
6. 写入一条涵盖整个批次的日志条目

### 归档

当内容被完全取代或领域范围发生变化时：
1. 如果不存在 `_archive/` 目录，则创建它
2. 将页面移动到 `_archive/` 目录，保留其原始路径（例如 `_archive/entities/old-page.md`）
3. 从 `index.md` 中移除
4. 更新任何链接到该页面的页面 — 将 wiki 链接替换为纯文本 + “（已归档）”
5. 记录归档操作

### Obsidian 集成

Wiki 目录开箱即用，可直接作为 Obsidian 仓库使用：
- `[[wikilinks]]` 渲染为可点击链接
- 图谱视图可视化知识网络
- YAML 前置元数据支持 Dataview 查询
- `raw/assets/` 文件夹存放通过 `![[image.png]]` 引用的图片

为了获得最佳效果：
- 将 Obsidian 的附件文件夹设置为 `raw/assets/`
- 在 Obsidian 设置中启用“Wiki 链接”（通常默认开启）
- 安装 Dataview 插件以支持类似 `TABLE tags FROM "entities" WHERE contains(tags, "company")` 的查询

如果将此技能与 Obsidian 技能一起使用，请将 `OBSIDIAN_VAULT_PATH` 设置为与 wiki 路径相同的目录。

### 无头 Obsidian（服务器和无头机器）

在没有显示器的机器上，请使用 `obsidian-headless` 而非桌面应用程序。
它通过 Obsidian Sync 同步仓库，无需图形界面 — 非常适合在服务器上运行并写入 wiki 的多个智能体，
而 Obsidian 桌面版可在另一台设备上读取该仓库。

**设置：**
```bash
# 需要 Node.js 22+
npm install -g obsidian-headless

# 登录（需要具有 Sync 订阅的 Obsidian 账户）
ob login --email <邮箱> --password '<密码>'

# 为 wiki 创建一个远程仓库
ob sync-create-remote --name "LLM Wiki"

# 将 wiki 目录连接到仓库
cd ~/wiki
ob sync-setup --vault "<仓库 ID>"

# 初始同步
ob sync

# 持续同步（前台运行 — 后台请使用 systemd）
ob sync --continuous
```

**通过 systemd 实现持续后台同步：**
```ini
# ~/.config/systemd/user/obsidian-wiki-sync.service
[Unit]
Description=Obsidian LLM Wiki 同步
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/path/to/ob sync --continuous
WorkingDirectory=/home/user/wiki
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user enable --now obsidian-wiki-sync
# 启用 linger 以便同步在注销后继续运行：
sudo loginctl enable-linger $USER
```

这使得智能体可以在服务器上写入 `~/wiki`，而你可以在笔记本电脑/手机上通过 Obsidian 浏览同一个仓库 — 更改会在几秒钟内出现。

## 陷阱

- **切勿修改 `raw/` 中的文件** — 来源是不可变的。更正应放在 wiki 页面中。
- **始终先定向** — 在新会话中进行任何操作之前，先阅读 SCHEMA + index + 最近日志。
  跳过此步骤会导致重复和遗漏交叉引用。
- **始终更新 index.md 和 log.md** — 跳过此步骤会使 wiki 退化。这些是导航主干。
- **不要为短暂提及创建页面** — 遵循 SCHEMA.md 中的页面阈值。脚注中仅出现一次的名字不值得创建实体页面。
- **不要创建没有交叉引用的页面** — 孤立的页面是不可见的。每个页面必须至少链接到其他 2 个页面。
- **前置元数据是必需的** — 它支持搜索、过滤和过时检测。
- **标签必须来自分类法** — 自由形式的标签会衰减为噪声。首先在 SCHEMA.md 中添加新标签，然后再使用它们。
- **保持页面可扫描** — wiki 页面应在 30 秒内可读。将超过 200 行的页面拆分。将详细分析移至专门的深度分析页面。
- **大规模更新前请先询问** — 如果一次摄取会触及 10 个以上的现有页面，请先与用户确认范围。
- **轮换日志** — 当 log.md 超过 500 条条目时，将其重命名为 `log-YYYY.md` 并重新开始。智能体应在 lint 期间检查日志大小。
- **显式处理矛盾** — 不要静默覆盖。用日期记录两种说法，在前置元数据中标记，并标记供用户审查。

## 相关工具

[llm-wiki-compiler](https://github.com/atomicmemory/llm-wiki-compiler) 是一个 Node.js CLI 工具，
它将来源编译成一个概念 wiki，灵感来源于 Karpathy。它与 Obsidian 兼容，
因此希望使用定时/CLI 驱动编译管道的用户可以将其指向此技能维护的同一个仓库。权衡：它拥有页面生成（取代智能体对页面创建的判断），并针对小型语料库进行了优化。当你希望智能体参与策展时，请使用此技能；当你希望对来源目录进行批量编译时，请使用 llmwiki。