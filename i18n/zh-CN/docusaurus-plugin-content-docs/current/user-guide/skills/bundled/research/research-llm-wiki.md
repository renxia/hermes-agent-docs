---
title: "Llm Wiki — Karpathy 的 LLM Wiki：构建/查询互连的 Markdown 知识库"
sidebar_label: "Llm Wiki"
description: "Karpathy 的 LLM Wiki：构建/查询互连的 Markdown 知识库"
---

{/* 此页面由网站脚本 generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非本页面。*/}

# Llm Wiki

Karpathy 的 LLM Wiki：构建/查询互连的 Markdown 知识库。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/research/llm-wiki` |
| 版本 | `2.1.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `wiki`, `knowledge-base`, `research`, `notes`, `markdown`, `rag-alternative` |
| 相关技能 | [`obsidian`](/docs/user-guide/skills/bundled/note-taking/note-taking-obsidian), [`arxiv`](/docs/user-guide/skills/bundled/research/research-arxiv) |

:::info
以下是Hermes在触发此技能时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# Karpathy的LLM维基

构建并维护一个持久的、不断累积的知识库，由相互链接的Markdown文件组成。
基于[Andrej Karpathy的LLM维基模式](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)。

与传统的RAG（每次查询都从零开始重新发现知识）不同，维基只编译一次知识并保持其最新。交叉引用已经就位。矛盾已被标记。综合反映了所有已摄入的内容。

**分工：** 人类策展来源并指导分析。智能体负责总结、交叉引用、归档和维护一致性。

## 此技能何时激活

当用户执行以下操作时使用此技能：
- 要求创建、构建或启动一个维基或知识库
- 要求将来源摄入、添加或处理到他们的维基中
- 提出一个问题，并且在配置路径上存在一个现有的维基
- 要求检查、审核或健康检查他们的维基
- 在研究上下文中引用他们的维基、知识库或"笔记"

## 维基位置

**位置：** 通过 `WIKI_PATH` 环境变量设置（例如在 `~/.hermes/.env` 中）。

如果未设置，默认为 `~/wiki`。

```bash
WIKI="${WIKI_PATH:-$HOME/wiki}"
```

维基只是一个Markdown文件的目录——可以用Obsidian、VS Code或任何编辑器打开它。无需数据库，无需特殊工具。

## 架构：三层结构

<!-- ascii-guard-ignore -->
```
wiki/
├── SCHEMA.md           # 约定、结构规则、领域配置
├── index.md            # 带有单行摘要的分区内容目录
├── log.md              # 按时间顺序记录的操作日志（仅追加，按年轮换）
├── raw/                # 第1层：不可变的源材料
│   ├── articles/       # 网络文章、剪报
│   ├── papers/         # PDF、arxiv论文
│   ├── transcripts/    # 会议记录、访谈
│   └── assets/         # 来源引用的图像、图表
├── entities/           # 第2层：实体页面（人物、组织、产品、模型）
├── concepts/           # 第2层：概念/主题页面
├── comparisons/        # 第2层：并排分析
└── queries/            # 第2层：值得保留的已归档查询结果
```
<!-- ascii-guard-ignore-end -->

**第1层——原始来源：** 不可变。智能体读取但从不修改这些。
**第2层——维基：** 智能体拥有的Markdown文件。由智能体创建、更新和交叉引用。
**第3层——模式：** `SCHEMA.md` 定义结构、约定和标签分类法。

## 恢复现有维基（关键——每次会话都要执行）

当用户拥有现有维基时，**在做任何事情之前，先让自己熟悉情况**：

① **读取 `SCHEMA.md`** ——理解领域、约定和标签分类法。
② **读取 `index.md`** ——了解存在哪些页面及其摘要。
③ **扫描最近的 `log.md`** ——阅读最后20-30个条目，了解最近的活动。

```bash
WIKI="${WIKI_PATH:-$HOME/wiki}"
# 会话开始时的熟悉性阅读
read_file "$WIKI/SCHEMA.md"
read_file "$WIKI/index.md"
read_file "$WIKI/log.md" offset=<最后 30 行>
```

只有在熟悉之后，才应进行摄入、查询或检查。这可以防止：
- 为已存在的实体创建重复页面
- 遗漏与现有内容的交叉引用
- 违反模式的约定
- 重复已记录的工作

对于大型维基（100+页面），在创建任何新内容之前，还要针对当前主题运行一次快速的 `search_files`。

## 初始化新维基

当用户要求创建或启动维基时：

1.  确定维基路径（从 `$WIKI_PATH` 环境变量，或询问用户；默认为 `~/wiki`）
2.  创建上述目录结构
3.  询问用户维基涵盖的领域——要具体
4.  编写针对该领域定制的 `SCHEMA.md`（参见下面的模板）
5.  编写带有分区标题的初始 `index.md`
6.  编写带有创建条目的初始 `log.md`
7.  确认维基已准备就绪，并建议摄入的第一个来源

### SCHEMA.md 模板

根据用户的领域进行调整。模式约束智能体的行为并确保一致性：

```markdown
# 维基模式

## 领域
[此维基涵盖的内容——例如，“AI/ML研究”、“个人健康”、“初创公司情报”]

## 约定
- 文件名：小写、连字符、无空格（例如，`transformer-architecture.md`）
- 每个维基页面都以YAML前置元数据开始（见下文）
- 使用 `[[wikilinks]]` 在页面之间链接（每页至少2个出站链接）
- 更新页面时，始终更新 `updated` 日期
- 每个新页面都必须添加到 `index.md` 中的正确部分下
- 每个操作都必须附加到 `log.md`
- **来源标记：** 在综合了3个以上来源的页面上，在段落末尾附加 `^[raw/articles/source-file.md]`，其声明来自特定来源。这使读者无需重新阅读整个原始文件即可追溯每个声明。在单来源页面上可选，因为 `sources:` 前置元数据已足够。

## 前置元数据
  ```yaml
  ---
  title: 页面标题
  created: YYYY-MM-DD
  updated: YYYY-MM-DD
  type: entity | concept | comparison | query | summary
  tags: [来自下面的分类法]
  sources: [raw/articles/source-name.md]
  # 可选的质量信号：
  confidence: high | medium | low        # 声明的支持程度
  contested: true                        # 当页面存在未解决的矛盾时设置
  contradictions: [other-page-slug]      # 与此页面冲突的页面
  ---
  ```

`confidence` 和 `contested` 是可选的，但建议在观点密集或快速变化的主题中使用。检查会突出显示 `contested: true` 和 `confidence: low` 的页面供审查，这样薄弱的主张就不会悄悄硬化成公认的维基事实。

### raw/ 前置元数据

原始来源也会得到一个小型前置元数据块，以便重新摄入可以检测到漂移：

```yaml
---
source_url: https://example.com/article   # 原始URL（如适用）
ingested: YYYY-MM-DD
sha256: &lt;下面原始内容的十六进制摘要>
---
```

`sha256:` 使得未来对同一URL的重新摄入可以在内容未变时跳过处理，并在内容已变时标记漂移。仅针对主体计算（`---` 结束后的所有内容），而非前置元数据本身。

## 标签分类法
[为该领域定义10-20个顶级标签。在使用它们之前，在此添加新标签。]

AI/ML领域的示例：
- 模型：model, architecture, benchmark, training
- 人物/组织：person, company, lab, open-source
- 技术：optimization, fine-tuning, inference, alignment, data
- 元数据：comparison, timeline, controversy, prediction

规则：页面上的每个标签都必须出现在此分类法中。如果需要新标签，请先在此处添加，然后使用它。这可以防止标签泛滥。

## 页面阈值
- 当一个实体/概念出现在2个以上来源中，或是一个来源的核心时，**创建页面**
- 当某个来源提到已涵盖的内容时，**添加到现有页面**
- **不要为**临时提及、次要细节或领域之外的内容**创建页面**
- 当页面超过约200行时，**拆分页面**——将其分解为带有交叉链接的子主题
- 当页面内容完全被取代时，**归档页面**——移至 `_archive/`，并从索引中移除

## 实�页面
每个知名实体一个页面。包括：
- 概述/它是什么
- 关键事实和日期
- 与其他实体的关系（`[[wikilinks]]`）
- 来源引用

## 概念页面
每个概念或主题一个页面。包括：
- 定义/解释
- 知识的当前状态
- 未解决的问题或争论
- 相关概念（`[[wikilinks]]`）

## 比较页面
并排分析。包括：
- 比较的对象和原因
- 比较维度（优选表格形式）
- 结论或综合
- 来源

## 更新策略
当新信息与现有内容冲突时：
1.  检查日期——较新的来源通常取代较旧的
2.  如果确实矛盾，注明两种立场及其日期和来源
3.  在前置元数据中标记矛盾：`contradictions: [page-name]`
4.  在检查报告中为用户审查标记出来
```

### index.md 模板

索引按类型分区。每个条目一行：wikilink + 摘要。

```markdown
# 维基索引

> 内容目录。每个维基页面按其类型列出，并附有单行摘要。
> 首先阅读此文件以查找与任何查询相关的页面。
> 最后更新：YYYY-MM-DD | 总页面数：N

## 实体
<!-- 按字母顺序排列 -->

## 概念

## 比较

## 查询
```

**扩展规则：** 当任何部分超过50个条目时，按首字母或子领域将其拆分为子部分。当索引总共超过200个条目时，创建一个 `_meta/topic-map.md`，按主题分组页面，以便更快导航。

### log.md 模板

```markdown
# 维基日志

> 所有维基操作的时间顺序记录。仅追加。
> 格式：`## [YYYY-MM-DD] 操作 | 主题`
> 操作：ingest, update, query, lint, create, archive, delete
> 当此文件超过500个条目时，轮换：重命名为 log-YYYY.md，重新开始。

## [YYYY-MM-DD] create | 维基已初始化
- 领域：[领域]
- 结构已创建，包含 SCHEMA.md, index.md, log.md
```

## 核心操作

### 1. 摄入

当用户提供来源（URL、文件、粘贴内容）时，将其整合到知识库中：

① **捕获原始来源：**
   - URL → 使用 `web_extract` 获取 markdown，保存至 `raw/articles/`
   - PDF → 使用 `web_extract`（支持 PDF），保存至 `raw/papers/`
   - 粘贴文本 → 保存至适当的 `raw/` 子目录
   - 为文件取描述性名称：`raw/articles/karpathy-llm-wiki-2026.md`
   - **添加原始 frontmatter**（`source_url`、`ingested`、正文的 `sha256`）。
     对相同 URL 重新摄入时：重新计算 sha256，与存储值比较 ——
     若相同则跳过，若不同则标记偏移并更新。这在每次重新摄入时成本低廉，
     且能捕捉静默的源内容变更。

② **与用户讨论要点** —— 什么有趣，什么对本领域重要。
   （在自动化/定时任务上下文中跳过此步 —— 直接继续。）

③ **检查现有内容** —— 搜索 index.md 并使用 `search_files` 查找
   已提及实体/概念的现有页面。这是知识库持续增长而非堆砌重复内容的关键。

④ **编写或更新知识库页面：**
   - **新实体/概念：** 仅当它们满足 SCHEMA.md 中的页面阈值（2+ 次源提及，
     或是一个来源的核心主题）时才创建页面
   - **现有页面：** 添加新信息，更新事实，更新 `updated` 日期。
     当新信息与现有内容矛盾时，遵循更新策略。
   - **交叉引用：** 每个新建或更新的页面必须通过 `[[wikilinks]]` 链接到至少 2 个其他页面。
     检查现有页面是否建立了反向链接。
   - **标签：** 仅使用 SCHEMA.md 分类法中的标签
   - **来源：** 在综合 3+ 个来源的页面上，为观点追溯至特定来源的段落添加
     `^[raw/articles/source.md]` 标记。
   - **置信度：** 对于观点密集、快速变化或单一来源的观点，在 frontmatter 中
     设置 `confidence: medium` 或 `low`。除非该观点得到多个来源的充分支持，
     否则不要标记为 `high`。

⑤ **更新导航：**
   - 将新页面按字母顺序添加到 `index.md` 的相应章节下
   - 更新索引头部的"总页面数"和"最后更新"日期
   - 追加到 `log.md`：`## [YYYY-MM-DD] ingest | 源标题`
   - 在日志条目中列出所有创建或更新的文件

⑥ **报告变更内容** —— 向用户列出所有创建或更新的文件。

单个来源可能触发 5-15 个知识库页面的更新。这是正常且期望的
—— 这是复合效应。

### 2. 查询

当用户询问有关知识库领域的问题时：

① **读取 `index.md`** 以识别相关页面。
② **对于拥有 100+ 页面的知识库**，还需 `search_files` 所有 `.md` 文件
   以查找关键术语 —— 仅索引可能遗漏相关内容。
③ **使用 `read_file` 读取相关页面**。
④ **综合答案**。引用你参考的知识库页面："基于 [[page-a]] 和 [[page-b]]..."
⑤ **将有价值的答案归档** —— 如果答案是实质性的比较、深入分析或新颖综合，
   则在 `queries/` 或 `comparisons/` 中创建页面。
   不要归档琐碎的查询 —— 仅归档那些重新推导会很痛苦的答案。
⑥ **更新 log.md**，记录查询内容及是否归档。

### 3. 检查

当用户要求对知识库进行检查、健康检查或审计时：

① **孤立页面：** 查找没有来自其他页面的入站 `[[wikilinks]]` 的页面。
```python
# 使用 execute_code 执行此操作 —— 程序性扫描所有知识库页面
import os, re
from collections import defaultdict
wiki = "<WIKI_PATH>"
# 扫描 entities/, concepts/, comparisons/, queries/ 中的所有 .md 文件
# 提取所有 [[wikilinks]] —— 构建入站链接映射
# 入站链接数为零的页面即为孤立页面
```

② **断链的 wiki 链接：** 查找指向不存在页面的 `[[links]]`。

③ **索引完整性：** 每个知识库页面都应出现在 `index.md` 中。
   将文件系统与索引条目进行比较。

④ **Frontmatter 验证：** 每个知识库页面必须包含所有必填字段
   （title、created、updated、type、tags、sources）。标签必须在分类法中。

⑤ **过时内容：** `updated` 日期比提及相同实体的最新来源早 90 天以上的页面。

⑥ **矛盾：** 对同一主题有冲突观点的页面。查找共享标签/实体但陈述不同事实的页面。
   列出所有在 frontmatter 中带有 `contested: true` 或 `contradictions:` 的页面供用户审查。

⑦ **质量信号：** 列出置信度为 `low` 的页面，以及仅引用单一来源但未设置
   confidence 字段的页面 —— 这些要么需要寻找佐证，要么考虑降级为 `confidence: medium`。

⑧ **来源偏移：** 对于 `raw/` 中每个带有 `sha256:` frontmatter 的文件，重新计算
   哈希值并标记不匹配项。不匹配表明原始文件被编辑过（不应发生 —— raw/ 是不可变的）
   或从一个后来已更改的 URL 摄入。不是硬错误，但值得报告。

⑨ **页面大小：** 标记超过 200 行的页面 —— 这些是拆分的候选对象。

⑩ **标签审计：** 列出所有使用中的标签，标记任何不在 SCHEMA.md 分类法中的标签。

⑪ **日志轮换：** 如果 log.md 超过 500 条目，则进行轮换。

⑫ **报告发现**，包含具体文件路径和建议操作，按严重性分组
   （断链 > 孤立页面 > 来源偏移 > 有争议的页面 > 过时内容 > 风格问题）。

⑬ **追加到 log.md：** `## [YYYY-MM-DD] lint | 发现 N 个问题`

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

### 批量导入

当一次性导入多个来源时，请批量更新：
1. 首先读取所有来源
2. 识别所有来源中的实体和概念
3. 对所有实体进行一次搜索以检查现有页面（一次搜索，而非 N 次）
4. 一次性创建/更新页面（避免冗余更新）
5. 最后更新一次 `index.md`
6. 写入一条涵盖整个批次的单一日志条目

### 归档

当内容完全被取代或领域范围发生变化时：
1. 如果不存在 `_archive/` 目录，则创建它
2. 将页面以其原始路径移至 `_archive/`（例如 `_archive/entities/old-page.md`）
3. 从 `index.md` 中移除
4. 更新所有链接到它的页面 — 将维基链接替换为纯文本 + “(已归档)”
5. 记录归档操作

### Obsidian 集成

Wiki 目录开箱即用，可作为 Obsidian 仓库：
- `[[维基链接]]` 会渲染为可点击的链接
- 图谱视图可可视化知识网络
- YAML 前置数据驱动 Dataview 查询
- `raw/assets/` 文件夹保存通过 `![[image.png]]` 引用的图片

为获得最佳效果：
- 将 Obsidian 的附件文件夹设置为 `raw/assets/`
- 在 Obsidian 设置中启用“维基链接”（通常默认开启）
- 安装 Dataview 插件以执行如 `TABLE tags FROM "entities" WHERE contains(tags, "company")` 的查询

如果同时使用 Obsidian 技能，请将 `OBSIDIAN_VAULT_PATH` 设置为与 wiki 路径相同的目录。

### 无头 Obsidian（服务器和无显示器机器）

在没有显示器的机器上，请使用 `obsidian-headless` 代替桌面应用。它通过 Obsidian Sync 同步仓库，无需 GUI —— 非常适合运行在服务器上并写入 wiki，同时 Obsidian 桌面端在另一设备上读取它的智能体。

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
ob sync-setup --vault "<仓库-id>"

# 初始同步
ob sync

# 持续同步（前台运行 — 使用 systemd 进行后台运行）
ob sync --continuous
```

**通过 systemd 进行持续后台同步：**
```ini
# ~/.config/systemd/user/obsidian-wiki-sync.service
[Unit]
描述=Obsidian LLM Wiki 同步
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/path/to/ob sync --continuous
工作目录=/home/user/wiki
Restart=on-failure
RestartSec=10

[安装]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user enable --now obsidian-wiki-sync
# 启用 linger 以便同步在注销后继续运行：
sudo loginctl enable-linger $USER
```

这允许智能体在服务器上写入 `~/wiki`，同时你在笔记本/手机的 Obsidian 中浏览同一个仓库 —— 更改会在几秒钟内显示。

## 陷阱

- **切勿修改 `raw/` 中的文件** — 源文件是不可变的。更正内容写入 wiki 页面。
- **始终先定位** — 在新会话中执行任何操作前，先阅读 SCHEMA + 索引 + 最近日志。跳过此步骤会导致重复和错过交叉引用。
- **始终更新 index.md 和 log.md** — 跳过此步骤会使 wiki 退化。这些是导航骨架。
- **不要为偶然提及的内容创建页面** — 遵循 SCHEMA.md 中的页面阈值。一个名字在脚注中出现一次，并不需要为其创建实体页面。
- **不要创建没有交叉引用的页面** — 孤立的页面不可见。每个页面必须链接到至少 2 个其他页面。
- **前置数据是必需的** — 它支持搜索、过滤和过时检测。
- **标签必须来自分类法** — 自由格式的标签会衰减为噪音。先将新标签添加到 SCHEMA.md，然后使用它们。
- **保持页面可扫描** — 一个 wiki 页面应该在 30 秒内可读完。超过 200 行的页面请拆分。将详细分析移至专门的深度分析页面。
- **大批量更新前请先询问** — 如果一次导入会涉及 10 个以上现有页面，请先与用户确认范围。
- **轮换日志** — 当 log.md 超过 500 条条目时，将其重命名为 `log-YYYY.md` 并重新开始。智能体应在检查时验证日志大小。
- **明确处理矛盾** — 不要静默覆盖。用日期标注两种说法，在前置数据中标记，并提请用户审查。
## 相关工具

[llm-wiki-compiler](https://github.com/atomicmemory/llm-wiki-compiler) 是一个 Node.js 命令行工具，它将来源编译成具有相同 Karpathy 启发的概念 wiki。它兼容 Obsidian，因此想要计划/命令行驱动编译管道的用户可以将其指向此技能维护的相同仓库。权衡点：它负责页面生成（取代了智能体对页面创建的判断），并针对小型语料库进行了调整。当你需要智能体参与的策展时使用此技能；当你想要批量编译源目录时使用 llmwiki。