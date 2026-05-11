---
title: "Llm Wiki — Karpathy 的 LLM Wiki：构建/查询互连的 Markdown 知识库"
sidebar_label: "Llm Wiki"
description: "Karpathy 的 LLM Wiki：构建/查询互连的 Markdown 知识库"
---

{/* 此页面由网站脚本 generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源 SKILL.md，而非此页面。 */}

# Llm Wiki

Karpathy 的 LLM Wiki：构建/查询互连的 Markdown 知识库。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/research/llm-wiki` |
| 版本 | `2.1.0` |
| 作者 | Hermes Agent |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `wiki`, `knowledge-base`, `research`, `notes`, `markdown`, `rag-alternative` |
| 相关技能 | [`obsidian`](/docs/user-guide/skills/bundled/note-taking/note-taking-obsidian), [`arxiv`](/docs/user-guide/skills/bundled/research/research-arxiv) |

:::info
以下是在触发此技能时，Hermes 加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Karpathy 的 LLM 维基

构建并维护一个持久、复合增长的知识库，作为相互链接的 Markdown 文件。
基于 [Andrej Karpathy 的 LLM 维基模式](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)。

与传统 RAG（每个查询都从头重新发现知识）不同，维基
一次性编译知识并使其保持最新。交叉引用已经存在。
矛盾已被标记。综合反映了一切已吸收的内容。

**分工：** 人类策展来源并指导分析。智能体
总结、交叉引用、归档并维护一致性。

## 此技能激活时机

当用户执行以下操作时使用此技能：
- 要求创建、构建或启动维基或知识库
- 要求将来源摄入、添加或处理到他们的维基中
- 提问且在配置的路径存在现有维基
- 要求检查、审计或健康检查他们的维基
- 在研究语境中提及他们的维基、知识库或"笔记"

## 维基位置

**位置：** 通过 `WIKI_PATH` 环境变量设置（例如在 `~/.hermes/.env` 中）。

如果未设置，默认为 `~/wiki`。

```bash
WIKI="${WIKI_PATH:-$HOME/wiki}"
```

维基就是一个 Markdown 文件目录——可以在 Obsidian、VS Code 或
任何编辑器中打开它。无需数据库，无需特殊工具。

## 架构：三层

<!-- ascii-guard-ignore -->
```
wiki/
├── SCHEMA.md           # 约定、结构规则、领域配置
├── index.md            # 分节的内容目录，带单行摘要
├── log.md              # 按时间顺序排列的操作日志（仅追加，按年轮换）
├── raw/                # 第一层：不可变源材料
│   ├── articles/       # 网页文章、剪辑
│   ├── papers/         # PDF、arxiv 论文
│   ├── transcripts/    # 会议记录、访谈
│   └── assets/         # 来源引用的图像、图表
├── entities/           # 第二层：实体页面（人物、组织、产品、模型）
├── concepts/           # 第二层：概念/主题页面
├── comparisons/        # 第二层：并排分析
└── queries/            # 第二层：值得保留的已归档查询结果
```
<!-- ascii-guard-ignore-end -->

**第一层 — 原始来源：** 不可变。智能体读取但从不修改。
**第二层 — 维基：** 由智能体拥有的 Markdown 文件。由智能体创建、更新和
交叉引用。
**第三层 — 模式：** `SCHEMA.md` 定义结构、约定和标签分类法。

## 恢复现有维基（关键 — 每次会话都要做）

当用户拥有现有维基时，**始终在执行任何操作前先定位自己**：

① **读取 `SCHEMA.md`** — 理解领域、约定和标签分类法。
② **读取 `index.md`** — 了解有哪些页面及其摘要。
③ **扫描最近的 `log.md`** — 读取最后 20-30 条记录以了解近期活动。

```bash
WIKI="${WIKI_PATH:-$HOME/wiki}"
# 会话开始时的定位读取
read_file "$WIKI/SCHEMA.md"
read_file "$WIKI/index.md"
read_file "$WIKI/log.md" offset=<最后 30 行>
```

只有定位完成后才应进行摄入、查询或检查。这可以防止：
- 为已存在的实体创建重复页面
- 遗漏指向现有内容的交叉引用
- 违反模式的约定
- 重复已记录的工作

对于大型维基（100+页面），在创建任何新内容之前，还要快速对相关主题运行 `search_files`。

## 初始化新维基

当用户要求创建或启动维基时：

1. 确定维基路径（来自 `$WIKI_PATH` 环境变量，或询问用户；默认 `~/wiki`）
2. 创建上述目录结构
3. 询问用户维基涵盖的领域——要具体
4. 编写针对该领域定制的 `SCHEMA.md`（见下方模板）
5. 编写带分节标题的初始 `index.md`
6. 编写带创建条目的初始 `log.md`
7. 确认维基已就绪并建议摄入的第一个来源

### SCHEMA.md 模板

适应用户的领域。模式约束智能体行为并确保一致性：

```markdown
# 维基模式

## 领域
[此维基涵盖的内容——例如"人工智能/机器学习研究"、"个人健康"、"创业情报"]

## 约定
- 文件名：小写、连字符、无空格（例如 `transformer-architecture.md`）
- 每个维基页面以 YAML 前置块开头（见下文）
- 使用 `[[wikilinks]]` 链接页面之间（每页至少 2 个出站链接）
- 更新页面时，始终更新 `updated` 日期
- 每个新页面必须添加到 `index.md` 中对应的部分下
- 每个操作必须追加到 `log.md`
- **来源标记：** 在综合 3 个以上来源的页面上，在引用特定来源的段落末尾附加 `^[raw/articles/source-file.md]`。这让读者可以在不重新阅读整个原始文件的情况下追溯每个主张。对于 `sources:` 前置数据已足够的单来源页面，此为可选。

## 前置数据
  ```yaml
  ---
  title: 页面标题
  created: YYYY-MM-DD
  updated: YYYY-MM-DD
  type: entity | concept | comparison | query | summary
  tags: [来自下方分类法]
  sources: [raw/articles/来源文件名.md]
  # 可选的质量信号：
  confidence: high | medium | low        # 主张的支持程度
  contested: true                        # 页面存在未解决的矛盾时设置
  contradictions: [其他页面slug]         # 与本页面冲突的页面
  ---
  ```

`confidence` 和 `contested` 是可选的，但对于观点主导或快速发展的主题建议使用。检查会标记 `contested: true` 和 `confidence: low` 的页面进行审查，这样薄弱的主张就不会悄悄固化为公认的维基事实。

### raw/ 前置数据

原始来源也会获得一个小的前置块，以便重新摄入可以检测漂移：

```yaml
---
source_url: https://example.com/article   # 原始 URL（如适用）
ingested: YYYY-MM-DD
sha256: &lt;下方原始内容的十六进制摘要>
---
```

`sha256:` 允许未来对同一 URL 的重新摄入在内容未变时跳过处理，并在内容已变时标记漂移。仅对正文（关闭的 `---` 之后的所有内容）计算，不包括前置数据本身。

## 标签分类法
[为该领域定义 10-20 个顶级标签。在使用新标签前在此处添加它们。]

AI/ML 示例：
- 模型：model, architecture, benchmark, training
- 人物/组织：person, company, lab, open-source
- 技术：optimization, fine-tuning, inference, alignment, data
- 元：comparison, timeline, controversy, prediction

规则：页面上的每个标签都必须出现在此分类法中。如果需要新标签，
先在此处添加，然后使用它。这可以防止标签泛滥。

## 页面阈值
- **当实体/概念出现在 2+ 来源中或是一个来源的核心时，创建页面**
- **当来源提到已有内容时，添加到现有页面**
- **不要为附带提及、次要细节或领域外内容创建页面**
- **当页面超过约 200 行时拆分** — 分解为子主题并带交叉链接
- **当内容完全被取代时归档页面** — 移动到 `_archive/`，从索引中移除

## 实体页面
每个重要实体一页。包括：
- 概述 / 是什么
- 关键事实和日期
- 与其他实体的关系（[[wikilinks]]）
- 来源引用

## 概念页面
每个概念或主题一页。包括：
- 定义 / 解释
- 知识现状
- 未解决的问题或争论
- 相关概念（[[wikilinks]]）

## 比较页面
并排分析。包括：
- 比较的内容和原因
- 比较维度（首选表格格式）
- 结论或综合
- 来源

## 更新策略
当新信息与现有内容冲突时：
1. 检查日期 — 更新的来源通常取代旧的
2. 如果确实矛盾，注明两种立场的日期和来源
3. 在前置数据中标记矛盾：`contradictions: [页面名称]`
4. 在检查报告中标记以供用户审查
```

### index.md 模板

索引按类型分节。每个条目一行：wikilink + 摘要。

```markdown
# 维基索引

> 内容目录。每个维基页面在其类型下列出并附单行摘要。
> 首先阅读此文件以查找与任何查询相关的页面。
> 最后更新：YYYY-MM-DD | 总页面数：N

## 实体
<!-- 节内按字母顺序排列 -->

## 概念

## 比较

## 查询
```

**扩展规则：** 当任何部分超过 50 个条目时，按首字母或子领域拆分为子部分。当索引总条目超过 200 个时，创建一个 `_meta/topic-map.md`，按主题分组页面以便更快导航。

### log.md 模板

```markdown
# 维基日志

> 所有维基操作的按时间顺序记录。仅追加。
> 格式：`## [YYYY-MM-DD] 操作 | 主题`
> 操作：ingest, update, query, lint, create, archive, delete
> 当此文件超过 500 条记录时，轮换：重命名为 log-YYYY.md，重新开始。

## [YYYY-MM-DD] create | 维基已初始化
- 领域：[领域]
- 使用 SCHEMA.md, index.md, log.md 创建了结构
```

## 核心操作

### 1. 摄取

当用户提供来源（URL、文件、粘贴内容）时，将其集成到知识库中：

① **捕获原始来源：**
   - URL → 使用 `web_extract` 获取 markdown，保存到 `raw/articles/`
   - PDF → 使用 `web_extract`（可处理 PDF），保存到 `raw/papers/`
   - 粘贴的文本 → 保存到相应的 `raw/` 子目录
   - 文件命名应具有描述性：`raw/articles/karpathy-llm-wiki-2026.md`
   - **添加原始 frontmatter**（`source_url`、`ingested`、正文内容的 `sha256`）。
     对同一 URL 重新摄取时：重新计算 sha256，与存储值比较——
     若相同则跳过，若不同则标记差异并更新。这足够轻量，可在每次重新摄取时执行，并能捕捉来源的静默变更。

② **与用户讨论要点** — 哪些内容有趣，对领域的重要性。（在自动化/定时任务场景中跳过此步骤——直接继续。）

③ **检查已有内容** — 搜索 `index.md` 并使用 `search_files` 查找已提及实体/概念的现有页面。这是知识库增长与避免重复堆砌的关键区别。

④ **编写或更新知识库页面：**
   - **新实体/概念：** 仅当其达到 SCHEMA.md 中的页面阈值（2个以上来源提及，或为单一来源的核心内容）时才创建页面。
   - **现有页面：** 添加新信息，更新事实，更新 `updated` 日期。
     当新信息与现有内容矛盾时，遵循更新策略。
   - **交叉引用：** 每个新增或更新的页面必须通过 `[[wikilinks]]` 链接到至少2个其他页面。检查现有页面是否链接回来。
   - **标签：** 仅使用 SCHEMA.md 分类法中的标签。
   - **溯源：** 在综合了3个以上来源的页面上，对那些论述可追溯至特定来源的段落，附加 `^[raw/articles/source.md]` 标记。
   - **置信度：** 对于观点性强、快速变化或单一来源的论述，在 frontmatter 中设置 `confidence: medium` 或 `low`。除非该论述有多个来源充分支持，否则不要标记为 `high`。

⑤ **更新导航：**
   - 在 `index.md` 的对应章节中按字母顺序添加新页面。
   - 更新 index 头部的“总页面数”和“最后更新日期”。
   - 追加到 `log.md`：`## [YYYY-MM-DD] 摄取 | 来源标题`。
   - 在日志条目中列出所有创建或更新的文件。

⑥ **报告变更** — 向用户列出所有创建或更新的文件。

一个来源可能触发跨 5-15 个知识库页面的更新。这是正常且期望的——这是复利效应。

### 2. 查询

当用户询问知识库领域的问题时：

① **读取 `index.md`** 以识别相关页面。
② **对于拥有 100+ 页面的知识库**，还需在所有 `.md` 文件中 `search_files` 搜索关键术语——仅索引可能遗漏相关内容。
③ **使用 `read_file` 读取相关页面**。
④ **综合答案** — 从汇编的知识中得出答案。引用你所依据的知识库页面：“基于 [[page-a]] 和 [[page-b]]...”
⑤ **将有价值的答案存档** — 如果答案是实质性比较、深度分析或新颖综合，在 `queries/` 或 `comparisons/` 中创建页面。不要存档琐碎的查询——只存档那些重新推导会很痛苦的答案。
⑥ **更新 log.md** — 记录查询内容及是否存档。

### 3. 检查

当用户要求检查、健康审查或审计知识库时：

① **孤立页面：** 查找没有其他页面通过 `[[wikilinks]]` 链接进来的页面。
```python
# 使用 execute_code 执行此操作——对所有知识库页面进行程序化扫描
import os, re
from collections import defaultdict
wiki = "<WIKI_PATH>"
# 扫描 entities/、concepts/、comparisons/、queries/ 中的所有 .md 文件
# 提取所有 [[wikilinks]]——构建入站链接图
# 入站链接数为零的页面即为孤立页面
```

② **损坏的 wikilinks：** 查找指向不存在页面的 `[[links]]`。

③ **索引完整性：** 每个知识库页面都应出现在 `index.md` 中。将文件系统内容与索引条目进行比较。

④ **Frontmatter 验证：** 每个知识库页面必须包含所有必需字段（title、created、updated、type、tags、sources）。标签必须在分类法中。

⑤ **过时内容：** `updated` 日期比最近提及相同实体的来源旧 90 天以上的页面。

⑥ **矛盾：** 同一主题的页面存在冲突的论述。查找共享标签/实体但陈述不同事实的页面。列出所有在 frontmatter 中标记了 `contested: true` 或 `contradictions:` 的页面供用户审查。

⑦ **质量信号：** 列出 `confidence: low` 的页面，以及任何仅引用单一来源但未设置 confidence 字段的页面——这些是寻找佐证或将其降级为 `confidence: medium` 的候选页面。

⑧ **来源漂移：** 对于 `raw/` 中每个带有 `sha256:` frontmatter 的文件，重新计算哈希值并标记不匹配项。不匹配表明原始文件被编辑过（不应发生——raw/ 是不可变的）或摄取的 URL 后续已更改。这不是硬错误，但值得报告。

⑨ **页面大小：** 标记超过 200 行的页面——这些是拆分的候选页面。

⑩ **标签审计：** 列出所有使用中的标记，标记任何不在 SCHEMA.md 分类法中的标签。

⑪ **日志轮转：** 如果 log.md 超过 500 条，则进行轮转。

⑫ **报告结果** — 包含具体的文件路径和建议操作，按严重性分组（损坏链接 > 孤立页面 > 来源漂移 > 有争议页面 > 过时内容 > 样式问题）。

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
read_file "$WIKI/log.md" offset=<last 20 lines>
```

### 批量导入

当同时导入多个来源时，批量处理更新：
1. 首先读取所有来源
2. 识别所有来源中的实体和概念
3. 检查所有实体的现有页面（一次搜索，而非 N 次）
4. 一次性创建/更新页面（避免冗余更新）
5. 最后更新 index.md
6. 编写一个覆盖本次批量操作的日志条目

### 归档

当内容完全被取代或领域范围发生变化时：
1. 如果不存在 `_archive/` 目录，则创建它
2. 将页面移至 `_archive/` 并保持其原始路径（例如，`_archive/entities/old-page.md`）
3. 从 `index.md` 中移除
4. 更新所有链接到它的页面 — 将维基链接替换为纯文本 + “（已归档）”
5. 记录归档操作

### Obsidian 集成

该 Wiki 目录开箱即用，可作为 Obsidian 知识库：
- `[[wikilinks]]` 渲染为可点击链接
- 图谱视图可视化知识网络
- YAML 前置块支持 Dataview 查询
- `raw/assets/` 文件夹保存通过 `![[image.png]]` 引用的图像

为获得最佳效果：
- 将 Obsidian 的附件文件夹设置为 `raw/assets/`
- 在 Obsidian 设置中启用“Wikilinks”（通常默认开启）
- 安装 Dataview 插件以执行类似 `TABLE tags FROM "entities" WHERE contains(tags, "company")` 的查询

如果同时使用 Obsidian 技能，请将 `OBSIDIAN_VAULT_PATH` 设置为与 wiki 路径相同的目录。

### Obsidian 无头模式（服务器和无头机器）

在没有显示器的机器上，使用 `obsidian-headless` 替代桌面应用程序。
它通过 Obsidian Sync 同步知识库，无需 GUI —— 非常适合在服务器上运行的智能体写入 wiki，同时 Obsidian 桌面端在其他设备上读取它。

**设置：**
```bash
# 需要 Node.js 22+
npm install -g obsidian-headless

# 登录（需要拥有 Sync 订阅的 Obsidian 账户）
ob login --email <email> --password '<password>'

# 为 wiki 创建远程知识库
ob sync-create-remote --name "LLM Wiki"

# 将 wiki 目录连接到知识库
cd ~/wiki
ob sync-setup --vault "<vault-id>"

# 初始同步
ob sync

# 持续同步（前台运行 — 使用 systemd 实现后台运行）
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
# 启用 linger 以便同步在注销后继续运行：
sudo loginctl enable-linger $USER
```

这使得智能体可以在服务器上写入 `~/wiki`，同时你可以在笔记本电脑/手机的 Obsidian 中浏览同一个知识库 —— 变更会在几秒钟内出现。

## 注意事项

- **切勿修改 `raw/` 中的文件** —— 来源不可变。更正应写入 wiki 页面。
- **始终先定位** —— 在新会话中执行任何操作前，先阅读 SCHEMA + index + 最近的日志。
  跳过此步骤会导致重复和遗漏的交叉引用。
- **始终更新 index.md 和 log.md** —— 跳过此步骤会使 wiki 退化。这些是导航的骨架。
- **不要为仅被提及一次的内容创建页面** —— 遵循 SCHEMA.md 中的页面阈值。一个名字在脚注中出现一次并不需要创建一个实体页面。
- **不要创建没有交叉引用的页面** —— 孤立的页面不可见。每个页面必须链接到至少 2 个其他页面。
- **前置块是必需的** —— 它支持搜索、过滤和过时检测。
- **标签必须来自分类法** —— 自由格式的标签会退化为噪音。首先将新标签添加到 SCHEMA.md，然后再使用它们。
- **保持页面可快速浏览** —— 一个 wiki 页面应在 30 秒内可读完。超过 200 行的页面应拆分。将详细分析移至专门的深入探讨页面。
- **大规模更新前请询问** —— 如果一次导入会涉及 10 个以上现有页面，请先与用户确认范围。
- **轮换日志** —— 当 log.md 超过 500 条时，将其重命名为 `log-YYYY.md` 并重新开始。智能体应在整理时检查日志大小。
- **明确处理矛盾** —— 不要静默覆盖。注明两种主张及日期，在前置块中标记，并标记供用户审阅。

## 相关工具

[llm-wiki-compiler](https://github.com/atomicmemory/llm-wiki-compiler) 是一个 Node.js CLI 工具，可将来源编译成概念 wiki，灵感同样源自 Karpathy。它兼容 Obsidian，因此希望使用计划/CLI 驱动的编译流程的用户可以将其指向本技能维护的同一知识库。权衡在于：它负责页面生成（取代了智能体对页面创建的判断），并且针对小型语料库进行了调优。当你需要智能体参与管理时使用此技能；当你需要对源目录进行批量编译时使用 llmwiki。