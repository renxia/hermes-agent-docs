---
title: "Llm Wiki — Karpathy 的 LLM Wiki：构建/查询互链的 Markdown 知识库"
sidebar_label: "Llm Wiki"
description: "Karpathy 的 LLM Wiki：构建/查询互链的 Markdown 知识库"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Llm Wiki

Karpathy 的 LLM Wiki：构建/查询互链的 Markdown 知识库。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/research/llm-wiki` |
| 版本 | `2.1.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `wiki`, `knowledge-base`, `research`, `notes`, `markdown`, `rag-alternative` |
| 相关技能 | [`obsidian`](/user-guide/skills/bundled/note-taking/note-taking-obsidian), [`arxiv`](/user-guide/skills/bundled/research/research-arxiv) |

:::info
以下是在此技能被触发时 Hermes 加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Karpathy 的 LLM 知识库

构建并维护一个由相互链接的 Markdown 文件组成的持久、复合知识库。
基于 [Andrej Karpathy 的 LLM 知识库模式](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)。

与传统 RAG（每次查询都从头重新发现知识）不同，知识库
一次性编译知识并保持其最新。交叉引用已经存在。
矛盾已被标记。综合反映了所有摄入的内容。

**分工：** 人类负责管理来源并指导分析。智能体
负责总结、交叉引用、归档并保持一致性。

## 此技能何时激活

当用户执行以下操作时使用此技能：
- 要求创建、构建或启动一个知识库
- 要求摄入、添加或处理一个来源到他们的知识库中
- 提问时，已配置的路径中存在现有知识库
- 要求 lint、审核或检查其知识库的健康状况
- 在研究上下文中引用他们的知识库、知识库或“笔记”

## 知识库位置

**位置：** 通过 `WIKI_PATH` 环境变量设置（例如在 `~/.hermes/.env` 中）。

如果未设置，则默认为 `~/wiki`。

```bash
WIKI="${WIKI_PATH:-$HOME/wiki}"
```

知识库只是一个 Markdown 文件目录——可以在 Obsidian、VS Code 或
任何编辑器中打开它。无需数据库，无需特殊工具。

## 架构：三层结构

<!-- ascii-guard-ignore -->
```
wiki/
├── SCHEMA.md           # 约定、结构规则、领域配置
├── index.md            # 带有一句话摘要的分类内容目录
├── log.md              # 按时间顺序记录的操作日志（仅追加，按年份轮转）
├── raw/                # 第1层：不可变的原始材料
│   ├── articles/       # 网络文章、剪报
│   ├── papers/         # PDF、arxiv 论文
│   ├── transcripts/    # 会议记录、采访
│   └── assets/         # 来源引用的图像、图表
├── entities/           # 第2层：实体页面（人物、组织、产品、模型）
├── concepts/           # 第2层：概念/主题页面
├── comparisons/        # 第2层：并排分析
└── queries/            # 第2层：值得保留的已归档查询结果
```
<!-- ascii-guard-ignore-end -->

**第1层 — 原始来源：** 不可变。智能体读取但从不修改这些内容。
**第2层 — 知识库：** 由智能体拥有的 Markdown 文件。由智能体创建、更新和
交叉引用。
**第3层 — 模式：** `SCHEMA.md` 定义结构、约定和标签分类法。

## 恢复现有知识库（关键 — 每次会话都执行此操作）

当用户拥有现有知识库时，**在执行任何操作前务必先了解情况**：

① **读取 `SCHEMA.md`** — 了解领域、约定和标签分类法。
② **读取 `index.md`** — 了解有哪些页面及其摘要。
③ **扫描最近的 `log.md`** — 阅读最后 20-30 条记录以了解最近的活动。

```bash
WIKI="${WIKI_PATH:-$HOME/wiki}"
# 会话开始时的定位读取
read_file "$WIKI/SCHEMA.md"
read_file "$WIKI/index.md"
read_file "$WIKI/log.md" offset=<最后 30 行>
```

只有在定位之后才能摄入、查询或 lint。这可以防止：
- 为已存在的实体创建重复页面
- 缺少到现有内容的交叉引用
- 与模式约定矛盾
- 重复已记录的工作

对于大型知识库（100+ 页面），在创建任何新内容前，还要对当前主题运行一次快速的 `search_files`。

## 初始化新知识库

当用户要求创建或启动知识库时：

1. 确定知识库路径（来自 `$WIKI_PATH` 环境变量，或询问用户；默认为 `~/wiki`）
2. 创建上述目录结构
3. 询问用户知识库涵盖哪个领域——要具体
4. 根据领域定制编写 `SCHEMA.md`（见下方模板）
5. 编写带有分段头部的初始 `index.md`
6. 编写带有创建条目的初始 `log.md`
7. 确认知识库已就绪，并建议摄入首批来源

### SCHEMA.md 模板

根据用户的领域进行调整。模式约束智能体行为并确保一致性：

```markdown
# 知识库模式

## 领域
[此知识库涵盖的内容——例如“人工智能/机器学习研究”、“个人健康”、“初创公司情报”]

## 约定
- 文件名：小写、连字符、无空格（例如 `transformer-architecture.md`）
- 每个知识库页面都以 YAML 前置数据开头（见下文）
- 使用 `[[wikilinks]]` 在页面之间链接（每页至少 2 个出站链接）
- 更新页面时，始终更新 `updated` 日期
- 每个新页面都必须在正确的部分下添加到 `index.md`
- 每个操作都必须追加到 `log.md`
- **来源标记：** 在综合了 3+ 来源的页面上，在段落末尾附加 `^[raw/articles/source-file.md]`，
  其断言来自特定来源。这让读者可以追溯每个断言，而无需重新阅读整个原始文件。在单一来源页面上可选，其中
  `sources:` 前置数据已足够。

## 前置数据
  ```yaml
  ---
  title: 页面标题
  created: YYYY-MM-DD
  updated: YYYY-MM-DD
  type: entity | concept | comparison | query | summary
  tags: [来自下方分类法]
  sources: [raw/articles/来源文件名.md]
  # 可选质量信号：
  confidence: high | medium | low        # 断言的支持程度
  contested: true                        # 当页面存在未解决的矛盾时设置
  contradictions: [其他页面-slug]        # 与之冲突的页面
  ---
  ```

`confidence` 和 `contested` 是可选的，但对于观点密集或快速变化的主题建议使用。Lint 会突出显示 `contested: true` 和 `confidence: low` 的页面以供审查，这样薄弱的断言就不会悄悄地固化为公认的 wiki 事实。

### raw/ 前置数据

原始来源也会获得一个小的前置数据块，以便重新摄入可以检测到内容变化：

```yaml
---
source_url: https://example.com/article   # 原始 URL（如果适用）
ingested: YYYY-MM-DD
sha256: &lt;以下原始内容的十六进制摘要>
---
```

`sha256:` 允许未来对同一 URL 的重新摄入在内容未变时跳过处理，并在内容变化时标记变化。仅计算正文部分（闭合 `---` 之后的所有内容），不包括前置数据本身。

## 标签分类法
[为该领域定义 10-20 个顶级标签。在使用新标签前先在此处添加它们。]

AI/ML 的示例：
- 模型：model、architecture、benchmark、training
- 人物/组织：person、company、lab、open-source
- 技术：optimization、fine-tuning、inference、alignment、data
- 元信息：comparison、timeline、controversy、prediction

规则：页面上的每个标签都必须出现在此分类法中。如果需要新标签，
先在此处添加，然后使用它。这可以防止标签泛滥。

## 页面阈值
- **当实体/概念出现在 2+ 来源中或对某个来源至关重要时**创建页面
- **当来源提及已涵盖的内容时**添加到现有页面
- **不要**为顺带提及、次要细节或领域之外的内容创建页面
- **当页面超过约 200 行时**拆分页面——分解为子主题并交叉链接
- **当内容完全被取代时**归档页面——移动到 `_archive/`，并从索引中删除

## 实ntity 页面
每个重要实体一个页面。包括：
- 概述 / 它是什么
- 关键事实和日期
- 与其他实体的关系（[[wikilinks]]）
- 来源参考

## 概念页面
每个概念或主题一个页面。包括：
- 定义 / 解释
- 当前知识状态
- 未解决的问题或争论
- 相关概念（[[wikilinks]]）

## 比较页面
并排分析。包括：
- 比较对象及原因
- 比较维度（优先使用表格格式）
- 结论或综合
- 来源

## 更新策略
当新信息与现有内容冲突时：
1. 检查日期——较新的来源通常取代较旧的
2. 如果确实矛盾，注明两种立场及其日期和来源
3. 在前置数据中标记矛盾：`contradictions: [页面名称]`
4. 在 lint 报告中标记以供用户审查
```

### index.md 模板

索引按类型分段。每个条目一行：wikilink + 摘要。

```markdown
# 知识库索引

> 内容目录。每个知识库页面在其类型下列出，并附有一句话摘要。
> 首先阅读此文件以查找与任何查询相关的页面。
> 最后更新：YYYY-MM-DD | 总页面数：N

## 实体
<!-- 各部分内按字母顺序排列 -->

## 概念

## 比较

## 查询
```

**扩展规则：** 当任何部分超过 50 个条目时，按首字母或子领域将其拆分为子部分。
当索引总共超过 200 个条目时，创建一个 `_meta/topic-map.md`，按主题对页面进行分组，以便更快地导航。

### log.md 模板

```markdown
# 知识库日志

> 所有知识库操作的时间顺序记录。仅追加。
> 格式：`## [YYYY-MM-DD] 操作 | 主题`
> 操作：ingest, update, query, lint, create, archive, delete
> 当此文件超过 500 条时，轮转：重命名为 log-YYYY.md，重新开始。

## [YYYY-MM-DD] create | 知识库已初始化
- 领域：[领域]
- 使用 SCHEMA.md, index.md, log.md 创建了结构
```

## 核心操作

### 1. 摄入

当用户提供来源（URL、文件、粘贴文本）时，将其整合到知识库中：

① **捕获原始来源：**
   - URL → 使用 `web_extract` 获取 markdown，保存到 `raw/articles/`
   - PDF → 使用 `web_extract`（可处理 PDF），保存到 `raw/papers/`
   - 粘贴的文本 → 保存到适当的 `raw/` 子目录
   - 文件命名要有描述性：`raw/articles/karpathy-llm-wiki-2026.md`
   - **添加原始 frontmatter**（`source_url`, `ingested`, 正文的 `sha256`）。
     重新摄入相同 URL 时：重新计算 sha256，与存储的值进行比较——
     如果相同则跳过，如果不同则标记差异并更新。这个操作足够轻量，可以在每次重新摄入时执行，用于捕获静默的来源变更。

② **与用户讨论要点** — 什么是有趣的，什么对该领域很重要。（在自动化/定时任务场景中跳过此步——直接继续。）

③ **检查已有内容** — 搜索 `index.md` 并使用 `search_files` 查找已有的相关页面。这是让知识库持续增长而不是变成一堆重复内容的关键。

④ **编写或更新知识库页面：**
   - **新实体/概念：** 仅当它们满足 SCHEMA.md 中的页面阈值（被 2+ 个来源提及，或是一个来源的核心）时才创建页面。
   - **已有页面：** 添加新信息，更新事实，更新 `updated` 日期。当新信息与现有内容矛盾时，遵循更新策略。
   - **交叉引用：** 每个新页面或更新的页面必须通过 `[[wikilinks]]` 链接到至少 2 个其他页面。确保现有页面也反向链接回来。
   - **标签：** 仅使用 SCHEMA.md 分类法中的标签。
   - **溯源：** 在综合了 3+ 个来源的页面上，在来自特定来源的声明段落末尾附加 `^[raw/articles/source.md]` 标记。
   - **置信度：** 对于观点主导、快速变化或单一来源的声明，在 frontmatter 中设置 `confidence: medium` 或 `low`。除非有多个来源充分支持，否则不要标记为 `high`。

⑤ **更新导航：**
   - 将新页面添加到 `index.md` 的正确部分，按字母顺序排列。
   - 更新索引头部的 "Total pages" 计数和 "Last updated" 日期。
   - 追加到 `log.md`：`## [YYYY-MM-DD] ingest | Source Title`
   - 列出日志条目中创建或更新的每个文件。

⑥ **报告变更** — 向用户列出创建或更新的每个文件。

一个来源可能触发 5-15 个知识库页面的更新。这是正常且预期的——这是复利效应。

### 2. 查询

当用户询问关于知识库领域的问题时：

① **阅读 `index.md`** 以识别相关页面。
② **对于拥有 100+ 个页面的知识库**，也在所有 `.md` 文件中 `search_files` 关键词——仅索引可能会遗漏相关内容。
③ **使用 `read_file` 阅读相关页面。**
④ **综合答案**。引用你参考的知识库页面："基于 [[page-a]] 和 [[page-b]]..."
⑤ **将有价值的答案归档** — 如果答案是实质性的比较、深入探讨或新颖的综合，可以在 `queries/` 或 `comparisons/` 中创建一个页面。不要归档琐碎的查找——只归档那些重新推导会很痛苦的答案。
⑥ **更新 log.md**，记录查询及其是否被归档。

### 3. 检查

当用户要求检查、健康检查或审计知识库时：

① **孤立页面：** 查找没有其他页面通过 `[[wikilinks]]` 引入链接的页面。
```python
# 使用 execute_code 实现——程序扫描所有知识库页面
import os, re
from collections import defaultdict
wiki = "<WIKI_PATH>"
# 扫描 entities/, concepts/, comparisons/, queries/ 中的所有 .md 文件
# 提取所有 [[wikilinks]] — 构建入链映射
# 入链数为零的页面是孤立页面
```

② **断链：** 查找指向不存在的页面的 `[[links]]`。

③ **索引完整性：** 每个知识库页面都应出现在 `index.md` 中。将文件系统与索引条目进行比较。

④ **Frontmatter 验证：** 每个知识库页面都必须包含所有必需字段（title, created, updated, type, tags, sources）。标签必须在分类法中。

⑤ **陈旧内容：** `updated` 日期比提到相同实体的最新来源旧超过 90 天的页面。

⑥ **矛盾：** 同一主题上存在冲突声明的页面。查找共享标签/实体但陈述不同事实的页面。将所有带有 `contested: true` 或 `contradictions:` frontmatter 的页面提交给用户审查。

⑦ **质量信号：** 列出置信度为 `low` 的页面，以及仅引用单个来源但未设置置信度字段的页面——这些是需要进一步寻找佐证或降级为 `confidence: medium` 的候选页面。

⑧ **来源漂移：** 对于 `raw/` 中每个带有 `sha256:` frontmatter 的文件，重新计算哈希值并标记不匹配。不匹配表示原始文件被编辑过（这不应该发生——raw/ 是不可变的）或来自一个已更改的 URL 摄入。这不是硬错误，但值得报告。

⑨ **页面大小：** 标记超过 200 行的页面——这些是拆分的候选页面。

⑩ **标签审计：** 列出所有使用的标签，标记任何不在 SCHEMA.md 分类法中的标签。

⑪ **日志轮换：** 如果 log.md 超过 500 条，请进行轮换。

⑫ **报告发现**，包含具体文件路径和建议操作，按严重程度分组（断链 > 孤立页面 > 来源漂移 > 争议页面 > 陈旧内容 > 样式问题）。

⑬ **追加到 log.md：** `## [YYYY-MM-DD] lint | N issues found`

## 使用Wiki

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

当同时导入多个来源时，请批量进行更新：
1. 首先读取所有来源
2. 识别所有来源中的实体和概念
3. 一次性检查所有现有页面（一次搜索，而非N次）
4. 一次性创建/更新页面（避免冗余更新）
5. 最后更新 `index.md` 一次
6. 写一个涵盖整个批次的单一日志条目

### 归档

当内容完全过时或领域范围发生变化时：
1. 如果不存在，则创建 `_archive/` 目录
2. 将页面及其原始路径移动到 `_archive/`（例如，`_archive/entities/old-page.md`）
3. 从 `index.md` 中移除
4. 更新任何链接到它的页面——将wikilink替换为纯文本 + "(已归档)"
5. 记录归档操作

### Obsidian 集成

Wiki目录开箱即用，可作为Obsidian知识库：
- `[[wikilinks]]` 渲染为可点击链接
- 知识图谱视图可视化知识网络
- YAML前置信息支持Dataview查询
- `raw/assets/` 文件夹存放通过 `![[image.png]]` 引用的图片

为获得最佳效果：
- 将Obsidian的附件文件夹设置为 `raw/assets/`
- 在Obsidian设置中启用“Wikilinks”（通常默认开启）
- 安装Dataview插件以执行如 `TABLE tags FROM "entities" WHERE contains(tags, "company")` 这样的查询

如果同时使用Obsidian技能，请将 `OBSIDIAN_VAULT_PATH` 设置为与wiki路径相同的目录。

### Obsidian Headless（适用于服务器和无头机器）

在没有显示器的机器上，使用 `obsidian-headless` 代替桌面应用程序。
它通过Obsidian Sync同步知识库，无需GUI——非常适合在服务器上运行的智能体写入wiki，而Obsidian桌面端在另一台设备上读取它。

**设置：**
```bash
# 需要Node.js 22+
npm install -g obsidian-headless

# 登录（需要拥有Sync订阅的Obsidian账户）
ob login --email <email> --password '<password>'

# 为wiki创建一个远程知识库
ob sync-create-remote --name "LLM Wiki"

# 将wiki目录连接到知识库
cd ~/wiki
ob sync-setup --vault "<vault-id>"

# 初始同步
ob sync

# 持续同步（前台运行——使用systemd在后台运行）
ob sync --continuous
```

**通过systemd进行持续后台同步：**
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
# 启用linger以使同步在用户登出后仍继续运行：
sudo loginctl enable-linger $USER
```

这使得智能体可以在服务器上写入 `~/wiki`，同时你可以在笔记本电脑/手机上的Obsidian中浏览同一个知识库——更改会在几秒钟内出现。

## 注意事项

- **切勿修改 `raw/` 中的文件** —— 来源是不可变的。更正应放在wiki页面中。
- **首先定向** —— 在新会话中进行任何操作之前，先阅读SCHEMA + index + 最近的日志。
  跳过此步会导致重复和遗漏的交叉引用。
- **始终更新 index.md 和 log.md** —— 跳过此步会使wiki退化。这些是导航的支柱。
- **不要为临时提及创建页面** —— 遵循SCHEMA.md中的页面阈值。一个在脚注中仅出现一次的名字不值得为其创建一个实体页面。
- **不要创建没有交叉引用的页面** —— 孤立的页面是不可见的。每个页面必须至少链接到另外2个页面。
- **前置信息是必需的** —— 它支持搜索、过滤和过期检测。
- **标签必须来自分类体系** —— 随意创建的标签会变成噪音。首先将新标签添加到SCHEMA.md，然后使用它们。
- **保持页面可快速浏览** —— 一个wiki页面应该在30秒内可读完。将超过200行的页面拆分。将详细分析转移到专门的深度探索页面。
- **批量更新前先询问** —— 如果一次导入会影响10个以上现有页面，请先与用户确认范围。
- **轮换日志** —— 当log.md超过500条时，将其重命名为 `log-YYYY.md` 并重新开始。智能体应在lint期间检查日志大小。
- **明确处理矛盾** —— 不要静默覆盖。记录两个带有日期的说法，在前置信息中标记，并标记以供用户审阅。

## 相关工具

[llm-wiki-compiler](https://github.com/atomicmemory/llm-wiki-compiler) 是一个Node.js命令行工具，它将来源编译成具有相同Karpathy灵感的概念wiki。它兼容Obsidian，因此想要定时/命令行驱动的编译管道的用户可以将其指向该技能维护的同一知识库。权衡：它负责页面生成（取代智能体在页面创建上的判断），并针对小型语料库进行了调优。当你需要智能体参与策展时使用此技能；当你想要批量编译一个源目录时使用llmwiki。