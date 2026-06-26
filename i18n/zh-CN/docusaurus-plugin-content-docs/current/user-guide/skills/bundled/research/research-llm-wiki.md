---
title: "Llm Wiki — Karpathy's LLM Wiki: build/query interlinked markdown KB"
sidebar_label: "LLM Wiki"
description: "Karpathy's LLM Wiki：构建/查询相互链接的Markdown知识库"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# LLM Wiki

Karpathy's LLM Wiki：构建/查询相互链接的Markdown知识库。

## 技能元数据

| | |
|---|---|
| Source | 捆绑安装（默认安装） |
| Path | `skills/research/llm-wiki` |
| Version | `2.1.0` |
| Author | Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `wiki`, `knowledge-base`, `research`, `notes`, `markdown`, `rag-alternative` |
| Related skills | [`obsidian`](/docs/user-guide/skills/bundled/note-taking/note-taking-obsidian), [`arxiv`](/docs/user-guide/skills/bundled/research/research-arxiv) |

## 关键路径和配置

```
~/.hermes/config.yaml       主配置
~/.hermes/.env              API密钥和秘密信息（如果设置了$HERMES_HOME）
$HERMES_HOME
```

# Karpathy的LLM维基

构建并维护一个持久、不断积累的知识库，以相互链接的markdown文件形式存在。
基于[Andrej Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)。

与传统的RAG（它会针对每个查询从零开始重新发现知识）不同，该维基
一次性地汇集知识并保持其时效性。交叉引用已经存在。
矛盾之处已经被标记出来。综合内容反映了所有已摄入的信息。

**分工：** 人类负责策展源材料和指导分析。智能体负责总结、交叉引用、归档和保持一致性。

## 当此技能被激活时

当用户：
- 要求创建、构建或启动一个维基或知识库时
- 要求摄入、添加或处理一份源材料到他们的维基时
- 提出问题，并且配置路径上存在一个现有的维基时
- 要求对他们的维基进行检查（lint）、审计或健康检查时
- 在研究背景下引用他们的维基、知识库或“笔记”时

## 维基位置

**位置：** 通过`WIKI_PATH`环境变量设置（例如，在`${HERMES_HOME:-~/.hermes}/.env`中）。

如果未设置，则默认为`~/wiki`。

```bash
WIKI="${WIKI_PATH:-$HOME/wiki}"
```

维基只是一个markdown文件的目录——可以在Obsidian、VS Code或任何编辑器中打开它。不需要数据库，也不需要特殊的工具。

## 架构：三层结构

<!-- ascii-guard-ignore -->
```
wiki/
├── SCHEMA.md           # 约定、结构规则、领域配置
├── index.md            # 包含单行摘要的版块内容目录
├── log.md              # 时间轴行动日志（只追加，每年轮转）
├── raw/                # 第1层：不可变的源材料
│   ├── articles/       # 网络文章、剪辑
│   ├── papers/         # PDF、arxiv论文
│   ├── transcripts/    # 会议笔记、访谈记录
│   └── assets/         # 源材料引用的图像、图表
├── entities/           # 第2层：实体页面（人物、组织、产品、模型）
├── concepts/           # 第2层：概念/主题页面
├── comparisons/        # 第2层：并排分析
└── queries/            # 第2层：值得保存的已归档查询结果
```
<!-- ascii-guard-ignore-end -->

**第1层 — 原始源材料：** 不可变。智能体读取但绝不修改这些内容。
**第2层 — 维基：** 由智能体拥有的markdown文件。由智能体创建、更新和交叉引用。
**第3层 — 模式（Schema）：** `SCHEMA.md`定义结构、约定和标签分类法。

## 恢复现有维基（关键——每次会话都必须执行）

当用户拥有现有的维基时，在做任何事情之前，**务必先进行定向（Orientation）**：

① **阅读`SCHEMA.md`** — 理解领域、约定和标签分类法。
② **阅读`index.md`** — 了解哪些页面存在及其摘要。
③ **扫描最近的`log.md`** — 阅读最后20-30条记录以了解近期活动。

```bash
WIKI="${WIKI_PATH:-$HOME/wiki}"
# 定向读取在会话开始时执行
read_file "$WIKI/SCHEMA.md"
read_file "$WIKI/index.md"
read_file "$WIKI/log.md" offset=<最后30行>
```

只有完成定向后，才应该进行摄入、查询或检查（lint）。这可以防止：
- 为已存在的实体创建重复页面
- 遗漏对现有内容的交叉引用
- 与模式的约定相矛盾
- 重复已记录的工作

对于大型维基（100+页），在创建任何新内容之前，也应运行一次针对主题的快速`search_files`。

## 初始化新的维基

当用户要求创建或启动一个维基时：

1. 确定维基路径（从`$WIKI_PATH`环境变量获取，或询问用户；默认值`~/wiki`）
2. 创建上述目录结构
3. 询问用户该维基涵盖的领域——需具体化
4. 编写针对该领域的`SCHEMA.md`（参见下述模板）
5. 编写初始的`index.md`，包含版块标题
6. 编写初始的`log.md`，包含创建记录
7. 确认维基已准备就绪并建议首批摄入的源材料

### SCHEMA.md 模板

适应用户的领域。模式约束智能体的行为并确保一致性：

```markdown
# Wiki Schema

## Domain
[此维基涵盖的内容——例如，“AI/ML研究”，“个人健康”，“初创企业情报”]

## Conventions
- 文件名：小写、使用连字符，不含空格（例如，`transformer-architecture.md`）
- 每个维基页面都必须包含YAML前置信息（参见下文）
- 使用`[[wikilinks]]`在页面之间链接（每页至少2个外链）
- 更新页面时，务必更新`updated`日期
- 每个新页面都必须添加到`index.md`的正确版块下
- 每一个操作都必须追加到`log.md`
- **来源标记：** 对于综合了3个以上源材料的页面，请在段落末尾附加`^[raw/articles/source-file.md]`
  以表明该段落的论点来自哪个特定源。这使得读者无需重读整个原始文件即可追溯每个论点。对于仅包含单个来源的页面，则可以忽略此项。

## Frontmatter
  ```yaml
  ---
  title: 页面标题
  created: YYYY-MM-DD
  updated: YYYY-MM-DD
  type: entity | concept | comparison | query | summary
  tags: [来自下方分类法]
  sources: [raw/articles/source-name.md]
  # 可选的质量信号：
  confidence: high | medium | low        # 论点被支持的好坏程度
  contested: true                        # 当页面存在未解决的矛盾时设置
  contradictions: [other-page-slug]      # 与此页面冲突的其他页面
  ---
  ```

`confidence`和`contested`是可选的，但对于观点重或变化迅速的主题强烈推荐。Lint会标记出`contested: true`和`confidence: low`的页面供审查，以防止弱论点悄然固化为被接受的维基事实。

### raw/ Frontmatter

原始源材料也需要一个小的前置信息块，以便重新摄入时可以检测漂移：

```yaml
---
source_url: https://example.com/article   # 原始URL，如果适用
ingested: YYYY-MM-DD
sha256: &lt;原始内容摘要的十六进制>
---
```

`sha256:`允许未来对同一URL进行重新摄入时跳过处理（如果内容未变），并在内容发生变化时标记漂移。计算范围仅限于正文（即关闭`---`之后的所有内容），而不包括前置信息本身。

## 标签分类法
[为该领域定义10-20个顶级标签。在使用新标签之前，请在此处添加它们。]

AI/ML示例：
- Models: model, architecture, benchmark, training (模型：模型、架构、基准测试、训练)
- People/Orgs: person, company, lab, open-source (人物/组织：人物、公司、实验室、开源)
- Techniques: optimization, fine-tuning, inference, alignment, data (技术：优化、微调、推理、对齐、数据)
- Meta: comparison, timeline, controversy, prediction (元信息：比较、时间线、争议、预测)

规则：页面上的每个标签都必须出现在此分类法中。如果需要新标签，请先在此处添加，然后再使用。这可以防止标签蔓延（tag sprawl）。

## 页面阈值
- **创建页面**：当实体/概念出现在2个以上源材料中，或对一个源材料至关重要时。
- **添加到现有页面**：当源材料提及的内容已被覆盖时。
- **不要创建页面**：对于偶然提及、次要细节或与领域无关的内容。
- **拆分页面**：当页面超过~200行时——将其拆分为子主题并添加交叉链接。
- **归档页面**：当其内容被完全取代时——移动到`_archive/`，并从索引中移除。

## 实体页面
每个值得注意的实体都应有一个页面。包括：
- 概述 / 它是什么
- 关键事实和日期
- 与其他实体的关系（[[wikilinks]]）
- 源材料引用

## 概念页面
每个概念或主题都应有一个页面。包括：
- 定义/解释
- 当前的知识状态
- 未解决的问题或争论点
- 相关概念（[[wikilinks]]）

## 比较页面
并排分析。包括：
- 正在比较什么以及为什么
- 比较维度（推荐表格格式）
- 裁决或综合结论
- 源材料

## 更新策略
当新信息与现有内容冲突时：
1. 检查日期——较新的源材料通常会取代旧的。
2. 如果确实矛盾，则同时记录两种立场、日期和来源。
3. 在前置信息中标记该矛盾：`contradictions: [page-name]`
4. 在Lint报告中标记供用户审查。

### index.md 模板

索引按类型进行分版块。每个条目都是一行：wikilink + 摘要。

```markdown
# Wiki Index

> 内容目录。列出所有维基页面，并附带单行摘要。
> 请先阅读此部分以查找任何查询相关的页面。
> 最后更新时间：YYYY-MM-DD | 总页数：N

## Entities (实体)
<!-- 需按字母顺序排列 -->

## Concepts (概念)

## Comparisons (比较)

## Queries (查询)
```

**扩展规则：** 当任一版块超过50个条目时，应将其拆分为子版块（按首字母或子领域）。当总索引条目数超过200个时，应创建一个`_meta/topic-map.md`文件，按主题对页面进行分组，以便更快地导航。

### log.md 模板

```markdown
# Wiki Log (维基日志)

> 所有维基操作的时间轴记录。只追加。
> 格式：`## [YYYY-MM-DD] 操作 | 主题`
> 操作类型：ingest（摄入）、update（更新）、query（查询）、lint（检查）、create（创建）、archive（归档）、delete（删除）
> 当此文件超过500条目时，进行轮转：重命名为log-YYYY.md，重新开始。

## [YYYY-MM-DD] create | Wiki initialized (维基初始化)
- Domain: [领域]
- Structure created with SCHEMA.md, index.md, log.md (使用SCHEMA.md、index.md、log.md创建了结构)
```

## 核心操作

### 1. Ingest（摄入）

当用户提供源材料（URL、文件、粘贴文本）时，将其整合到维基中：

① **捕获原始源材料：**
   - URL → 使用`web_extract`获取markdown，保存到`raw/articles/`
   - PDF → 使用`web_extract`（处理PDF），保存到`raw/papers/`
   - 粘贴文本 → 保存到相应的`raw/`子目录
   - 以描述性的方式命名文件：`raw/articles/karpathy-llm-wiki-2026.md`
   - **添加原始前置信息**（`source_url`、`ingested`、正文的`sha256`）。
     对于同一URL的重新摄入：重新计算sha256，与存储的值进行比较——如果相同则跳过，如果不同则标记漂移并更新。这成本足够低廉，可以在每次重新摄入时执行，可以捕获静默的源材料变化。

② **与用户讨论要点**——哪些内容有趣，对该领域有何意义。（在自动化/cron环境中跳过此步骤——直接进行。）

③ **检查现有内容**——搜索`index.md`并使用`search_files`来查找已有的实体/概念页面。这是一个不断增长的维基和一堆重复文件的区别所在。

④ **编写或更新维基页面：**
   - **新实体/概念：** 仅当它们符合SCHEMA.md中的页面阈值（2个以上源材料提及，或对一个源材料至关重要）时才创建页面。
   - **现有页面：** 添加新信息，更新事实，更新`updated`日期。当新信息与现有内容冲突时，请遵循更新策略。
   - **交叉引用：** 每个新的或更新的页面都必须通过`[[wikilinks]]`链接到至少2个其他页面。检查现有页面是否反向链接。
   - **标签：** 仅使用SCHEMA.md中的分类法提供的标签。
   - **来源标记：** 对于综合了3个以上源材料的页面，在声称来自特定源的段落末尾附加`^[raw/articles/source.md]`标记。
   - **信心度（Confidence）：** 对于观点重、变化迅速或仅有单个来源支持的论点，在前置信息中设置`confidence: medium`或`low`。除非论点得到多个源材料的支持，否则不要标记为`high`。

⑤ **更新导航：**
   - 将新页面添加到`index.md`的正确版块下，并按字母顺序排列。
   - 更新索引标题中的“总页数”和“最后更新日期”。
   - 追加到`log.md`：`## [YYYY-MM-DD] ingest | Source Title`（摄入 | 源材料标题）
   - 在日志条目中列出所有创建或更新的文件。

⑥ **报告更改内容**——将所有创建或更新的文件列表告知用户。

单个源材料可以触发5到15个维基页的更新。这是正常且期望的——这就是 compounding effect（复合效应）。

### 2. Query（查询）

当用户询问关于维基领域的任何问题时：

① **阅读`index.md`** 以识别相关的页面。
② **对于拥有100+个页面的维基，也需要对所有`.md`文件进行`search_files`**——仅靠索引可能遗漏相关内容。
③ **使用`read_file`阅读相关的页面。**
④ **从汇集起来的知识中综合答案。** 引用你所引用的维基页面：“基于[[page-a]]和[[page-b]]...”
⑤ **归档有价值的答案**——如果答案是一个实质性的比较、深度挖掘或新颖的综合，则在`queries/`或`comparisons/`中创建一个页面。不要归档琐碎的查找信息——只归档那些难以重新推导的答案。
⑥ **更新log.md**，记录查询以及是否已归档。

### 3. Lint（检查）

当用户要求对维基进行检查、健康检查或审计时：

① **孤立页面（Orphan pages）：** 查找没有其他页面反向`[[wikilinks]]`链接的页面。
```python
# 使用execute_code来完成此操作——跨所有维基页面的程序化扫描
import os, re
from collections import defaultdict
wiki = "<WIKI_PATH>"
# 扫描entities/、concepts/、comparisons/、queries/中的所有.md文件
# 提取所有的[[wikilinks]]——构建反向链接图
# 零个反向链接的页面即为孤立页面
```

② **断裂的wikilinks：** 查找指向不存在页面的`[[links]]`。

③ **索引完整性：** 每个维基页面都应该出现在`index.md`中。将文件系统与索引条目进行比对。

④ **前置信息验证（Frontmatter validation）：** 每个维基页面都必须包含所有必需的字段（title, created, updated, type, tags, sources）。标签必须在分类法中。

⑤ **陈旧内容（Stale content）：** `updated`日期比提及同一实体的最新源材料早超过90天。

⑥ **矛盾之处：** 讨论同一主题但存在冲突论点的页面。查找具有相同标签/实体但陈述不同事实的页面。将所有带有`contested: true`或`contradictions:`前置信息的页面标记出来供用户审查。

⑦ **质量信号（Quality signals）：** 列出带有`confidence: low`的页面，以及任何只引用单个源材料但未设置信心度字段的页面——这些都是需要寻找佐证或降级到`confidence: medium`的候选对象。

⑧ **源漂移（Source drift）：** 对于`raw/`中带有`sha256:`前置信息的每个文件，重新计算哈希值并标记不匹配项。不匹配表示原始文件被编辑过（这不应该发生——`raw/`是不可变的）或是从已更改的URL摄入的。这不是一个硬错误，但值得报告。

⑨ **页面大小：** 标记超过200行的页面——作为拆分的候选对象。

⑩ **标签审计：** 列出所有正在使用的标签，并标记任何不在SCHEMA.md分类法中的标签。

⑪ **日志轮转：** 如果log.md超过500条目，则进行轮转。

⑫ **报告发现结果**，包括具体的文件路径和建议的操作，按严重程度分组（断裂链接 > 孤立页面 > 源漂移 > 矛盾页面 > 陈旧内容 > 风格问题）。

⑬ **追加到log.md：** `## [YYYY-MM-DD] lint | N issues found`

## 工作原理（Working with the Wiki）

### 搜索（Searching）

```bash
# Find pages by content
search_files "transformer" path="$WIKI" file_glob="*.md"

# Find pages by filename
search_files "*.md" target="files" path="$WIKI"

# Find pages by tag
search_files "tags:.*alignment" path="$WIKI" file_glob="*.md"

# Recent activity
read_file "$WIKI/log.md" offset=<last 20 lines>
```

### 大批量导入（Bulk Ingest）

当一次性导入多个源文件时，请分批更新：
1. 先读取所有源文件。
2. 识别所有跨源文件实体和概念。
3. 对现有页面进行检查（只需一次搜索，而不是 N 次）。
4. 在一次性操作中创建/更新页面（避免冗余更新）。
5. 最后一次性更新 index.md。
6. 写入一条涵盖该批次的日志条目。

### 归档（Archiving）

当内容被完全取代或领域范围发生变化时：
1. 如果 `_archive/` 目录不存在，则创建它。
2. 将页面移动到 `_archive/`，并保留其原始路径（例如：`_archive/entities/old-page.md`）。
3. 从 `index.md` 中移除。
4. 更新所有链接到它的页面——将维基链接替换为纯文本 + "(archived)"。
5. 记录归档操作。

### Obsidian 集成（Obsidian Integration）

该维基目录可以直接作为 Obsidian Vault 使用：
- `[[wikilinks]]` 会渲染为可点击的链接。
- 图谱视图（Graph View）可视化知识网络。
- YAML frontmatter 为 Dataview 查询提供支持。
- `raw/assets/` 文件夹存放通过 `![[image.png]]` 引用的图片。

为了获得最佳结果：
- 将 Obsidian 的附件文件夹设置为 `raw/assets/`。
- 在 Obsidian 设置中启用“Wikilinks”（通常是默认开启的）。
- 安装 Dataview 插件，用于执行诸如 `TABLE tags FROM "entities" WHERE contains(tags, "company")` 这样的查询。

如果同时使用此技能和 Obsidian skill，请将 `OBSIDIAN_VAULT_PATH` 设置为与维基路径相同的目录。

### Obsidian 无头模式（Obsidian Headless）（服务器和无头机器）

在没有显示器的机器上，请使用 `obsidian-headless` 而不是桌面应用。
它通过 Obsidian Sync 同步 Vault，无需图形界面——这对于在服务器上运行、向维基写入内容而由 Obsidian 桌面版在另一台设备上读取的智能体来说是完美的。

**设置：**
```bash
# 需要 Node.js 22+
npm install -g obsidian-headless

# 登录（需要具有 Sync 订阅的 Obsidian 账户）
ob login --email <email> --password '<password>'

# 为维基创建一个远程 Vault
ob sync-create-remote --name "LLM Wiki"

# 将维基目录连接到 Vault
cd ~/wiki
ob sync-setup --vault "<vault-id>"

# 初始同步
ob sync

# 持续同步（前台运行——使用 systemd 进行后台运行）
ob sync --continuous
```

**通过 systemd 实现持续后台同步：**
```ini
# ~/.config/systemd/user/obsidian-wiki-sync.service
[Unit]
Description=Obsidian LLM Wiki Sync
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
# 启用 linger，确保即使注销后同步也能继续运行：
sudo loginctl enable-linger $USER
```

这使得智能体可以在服务器上的 `~/wiki` 目录进行写入，而您可以在笔记本电脑/手机上的 Obsidian 中浏览同一个 Vault——更改会在几秒内显示出来。

## 潜在陷阱（Pitfalls）

- **绝不要修改 `raw/` 中的文件** — 源文件是不可变的。更正应在维基页面中完成。
- **始终先进行定向（Orient）** — 在新会话中的任何操作之前，请阅读 SCHEMA + index + 最近的日志。跳过此步骤会导致重复和错过的交叉引用。
- **始终更新 index.md 和 log.md** — 跳过这些操作会导致维基退化。它们是导航支柱。
- **不要为提及（mentions）创建页面** — 请遵循 SCHEMA.md 中的页面阈值。一个只在脚注中出现一次的名称，不值得创建一个实体页面。
- **不要在没有交叉引用的情况下创建页面** — 孤立的页面是不可见的。每个页面都必须链接到至少另外 2 个页面。
- **Frontmatter 是必需的** — 它提供了搜索、过滤和陈旧度检测功能。
- **标签必须来自分类法（taxonomy）** — 自由形式的标签会退化成噪音。请先将新标签添加到 SCHEMA.md，然后再使用它们。
- **保持页面可扫描性** — 一个维基页面应该在 30 秒内可以阅读完。不要超过 200 行就分割页面。将详细分析移至专门的深度研究（deep-dive）页面中。
- **在批量更新前询问** — 如果一次导入操作会触及 10 个以上的现有页面，请先与用户确认范围。
- **轮换日志** — 当 log.md 超过 500 条记录时，将其重命名为 `log-YYYY.md` 并重新开始。智能体应在 lint 过程中检查日志大小。
- **明确处理矛盾之处** — 不要静默地覆盖。请同时记录两个声明及其日期，并在 frontmatter 中标记，并标记给用户进行审查。

## 相关工具（Related Tools）

[llm-wiki-compiler](https://github.com/atomicmemory/llm-wiki-compiler) 是一个 Node.js CLI 工具，它将源文件编译成概念维基，具有与 Karpathy 相同的灵感。它与 Obsidian 兼容，因此希望实现计划/CLI 驱动的编译流程的用户可以将它指向此技能所维护的同一 Vault。权衡之处：它负责页面生成（取代了智能体对页面创建的判断），并且是为小型语料库量身定制的。当您需要“智能体参与式策展”（agent-in-the-loop curation）时，请使用此技能；当您需要批量编译源目录时，请使用 llmwiki。