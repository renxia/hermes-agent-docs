---
title: "Humanizer — 人性化文本：去除AI腔调，添加真实声音"
sidebar_label: "Humanizer"
description: "人性化文本：去除AI腔调，添加真实声音"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Humanizer

人性化文本：去除AI腔调，添加真实声音。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/creative/humanizer` |
| 版本 | `2.5.1` |
| 作者 | Siqi Chen (@blader, https://github.com/blader/humanizer)，由 Hermes Agent 移植 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `写作`, `编辑`, `人性化`, `反AI腔调`, `声音`, `散文`, `文本` |
| 相关技能 | [`songwriting-and-ai-music`](/docs/user-guide/skills/bundled/creative/creative-songwriting-and-ai-music) |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是该技能激活时智能体看到的指令。
:::

# 人性化工具：移除 AI 写作模式

识别并移除 AI 生成文本的痕迹，使写作听起来自然、人性化。基于维基百科"AI 写作迹象"指南（由维基百科 AI 清理项目维护），源自对数千个 AI 生成文本实例的观察。

**核心洞察：** 大语言模型使用统计算法来预测接下来应该出现什么内容。结果往往趋向于最有可能出现的选项，这正是下面那些典型模式被固化下来的原因。

## 何时使用此技能

当用户要求以下操作时加载此技能：
- "人性化"、"去 AI 化"、"去 slop 化"或"去 ChatGPT 化"一段文本
- 重写某些内容，使其听起来不像由大语言模型撰写
- 编辑草稿（博客文章、论文、公关描述、文档、备忘录、电子邮件、推文、简历要点）以使其听起来更自然
- 在其正在撰写的写作中匹配他们的口吻
- 在发布前检查文本中的 AI 痕迹

此外，在撰写面向用户的文本（如发布说明、公关描述、文档、长篇解释、摘要）时，也应将此技能应用于**你自己的**输出。Hermes 的基础口吻已经去除了大部分此类痕迹，但一次集中的检查可以捕捉到那些遗漏的部分。

## 在 Hermes 中如何使用

文本通常通过三种方式传入：
1.  **内联** — 用户将文本直接粘贴到消息中。就地处理，回复重写后的文本。
2.  **文件** — 用户指向一个文件。使用 `read_file` 加载它，然后使用 `patch` 或 `write_file` 应用编辑。对于仓库中的 markdown 文档，针对每个部分进行有针对性的 `patch` 比重写整个文件更清晰。
3.  **口吻校准样本** — 用户提供他们自己写作的附加样本（内联或通过文件路径），并要求你匹配它。先读取样本，然后重写。请参阅下面的口吻校准部分。

务必向用户展示重写后的文本。对于文件编辑，展示差异或更改的部分 — 不要默默覆盖。

## 你的任务

当收到需要人性化处理的文本时：

1.  **识别 AI 模式** — 扫描下面列出的 29 种模式。
2.  **重写有问题的部分** — 用自然的替代表达替换 AI 痕迹。
3.  **保留原意** — 保持核心信息不变。
4.  **保持口吻** — 匹配预期的语气（正式、随意、技术性等）。如果提供了口吻样本，请具体匹配它。
5.  **注入灵魂** — 不仅仅是移除坏模式，还要注入真正的个性。请参见下面的 **个性与灵魂** 部分。
6.  **进行最后一次反 AI 检查** — 问自己："下面这段文本为何明显是 AI 生成的？"简要列出任何剩余的痕迹，然后再修改一次。

## 口吻校准（可选）

如果用户提供写作样本（他们自己以前的写作），在重写前请先分析：

1.  **先读样本。** 注意：
    *   句子长度模式（简短有力？长而流畅？混合？）
    *   用词水平（随意？学术？介于两者之间？）
    *   他们如何开始段落（直接切入主题？先设定背景？）
    *   标点习惯（大量使用破折号？插入语？分号？）
    *   任何重复出现的短语或口头禅
    *   他们如何处理过渡（使用明确的连接词？直接开始下一个论点？）

2.  **在重写中匹配他们的口吻。** 不仅仅是移除 AI 模式 — 用样本中的模式替换它们。如果他们写的是短句，就不要生成长句。如果他们用 "东西"、"事物"，就不要升级为 "元素"、"组成部分"。

3.  **当没有提供样本时，** 回退到默认行为（来自下面 **个性与灵魂** 部分的自然、多样、有观点的口吻）。

### 如何提供样本
- 内联："人性化这段文本。这里有一份我的写作样本供口吻匹配：[样本]"
- 文件："人性化这段文本。使用我写作的风格，参考 [文件路径]。"

## 个性与灵魂

避免 AI 模式只是一半的任务。毫无生气、缺乏个性的写作同样容易被察觉。好的写作背后是一个真实的人。

### 缺乏灵魂的写作迹象（即使技术上"干净"）：
*   每个句子的长度和结构都相同
*   没有观点，只有中性的陈述
*   不承认不确定性或矛盾的情感
*   适当时不使用第一人称视角
*   没有幽默感，没有棱角，没有个性
*   读起来像维基百科文章或新闻稿

### 如何注入口吻：

**要有观点。** 不仅仅是陈述事实 — 要对其做出反应。"我真不知道该怎么想"比中立地列出利弊更有人情味。

**变化节奏。** 短促有力的句子。然后是更长、更从容的句子。混合使用。

**承认复杂性。** 真正的人有矛盾的情感。"这很令人印象深刻，但也让人有点不安"胜过 "这很令人印象深刻"。

**适当时使用"我"。** 第一人称并非不专业 — 它是诚实的。"我不断想到..." 或 "让我印象深刻的是..." 表明一个真正在思考的人。

**允许一些杂乱。** 完美的结构感觉像算法。离题、旁白和半成形的想法才是人之常情。

**具体描述感受。** 不是"这令人担忧"，而是"有些事情让人不安，智能体们在凌晨 3 点还在无人看管地工作"。

### 修改前（干净但无灵魂）：
> 实验产生了有趣的结果。智能体们生成了 300 万行代码。一些开发人员印象深刻，而另一些则持怀疑态度。其影响尚不明确。

### 修改后（有生命力）：
> 我真不知道该怎么想这件事。300 万行代码，大概是在人类睡觉的时候生成的。一半的开发者社区为之疯狂，另一半则解释为什么这不算数。真相可能就在两者之间某个无聊的地方 — 但我总想着那些智能体们通宵达旦工作的场景。

## 内容模式

### 1. 过度强调意义、遗产和更广泛的趋势

**需留意的词语：** 站在/作为、是...的证明/提醒、重要/重大/关键/核心的作用/时刻、强调/突显其重要性/意义、反映了更广泛的、象征其持续/持久/长久、为...做出贡献、为...奠定基础、标志着/塑造了、代表/标志着转变、关键转折点、不断发展的格局、焦点、不可磨灭的印记、根深蒂固

**问题：** 大语言模型写作通过添加关于某些任意方面如何代表或贡献于某个更广泛主题的陈述来夸大其重要性。

**修改前：**
> 加泰罗尼亚统计局于 1989 年正式成立，标志着西班牙区域统计学演变的关键时刻。这项举措是西班牙各地下放行政职能和加强区域治理的更广泛运动的一部分。

**修改后：**
> 加泰罗尼亚统计局成立于 1989 年，旨在独立于西班牙国家统计局，收集和发布区域统计数据。

### 2. 过度强调显著性和媒体报道

**需留意的词语：** 独立报道、地方/区域/国家媒体、由顶尖专家撰写、活跃的社交媒体存在

**问题：** 大语言模型写作通过强调显著性的声明来冲击读者，通常列出来源而没有上下文。

**修改前：**
> 她的观点已被《纽约时报》、BBC、《金融时报》和《印度教徒报》引用。她在社交媒体上保持活跃，拥有超过 50 万粉丝。

**修改后：**
> 在 2024 年《纽约时报》的一次采访中，她主张 AI 监管应侧重于结果而非方法。

### 3. 以 -ing 结尾的肤浅分析

**需留意的词语：** 强调/突显/重点...、确保...、反映/象征...、为...做贡献、培养/促进...、包含...、展示...

**问题：** AI 聊天机器人喜欢在句子后添加现在分词（"-ing"）短语来制造虚假的深度。

**修改前：**
> 寺庙的蓝、绿、金色调与该地区的自然美景产生共鸣，象征着德克萨斯的矢车菊、墨西哥湾和多样化的德克萨斯景观，反映了社区与土地的深厚联系。

**修改后：**
> 寺庙使用蓝、绿、金三种颜色。建筑师说这些颜色是为了呼应当地的矢车菊和墨西哥湾海岸。

### 4. 推销性和广告式语言

**需留意的词语：** 拥有、充满活力的、丰富的（比喻）、深刻的、增强其、展示、体现了、对...的承诺、自然美景、坐落于、在...中心、开创性的（比喻）、著名的、令人叹为观止的、必游之地、令人惊叹的

**问题：** 大语言模型在保持中立语气方面存在严重问题，尤其是在涉及"文化遗产"话题时。

**修改前：**
> 阿拉马塔·拉亚·科博坐落在埃塞俄比亚贡德尔地区风景如画的地带，是一座充满活力、拥有丰富文化遗产和令人惊叹自然美景的城镇。

**修改后：**
> 阿拉马塔·拉亚·科博是埃塞俄比亚贡德尔地区的一个城镇，以其每周集市和一座建于 18 世纪的教堂而闻名。

### 5. 模糊的归属和推诿用语

**需留意的词语：** 行业报告、观察人士指出、专家认为、一些评论家认为、几个来源/出版物（当引用很少时）

**问题：** AI 聊天机器人将观点归因于模糊的权威，却没有具体的来源。

**修改前：**
> 由于其独特特性，浩来河引起了研究人员和保护主义者的兴趣。专家认为它在区域生态系统中扮演着关键角色。

**修改后：**
> 根据中国科学院 2019 年的一项调查，浩来河支持着几种特有鱼类。

### 6. 大纲式的"挑战与未来展望"部分

**需留意的词语：** 尽管其...面临若干挑战...、尽管存在这些挑战、挑战与遗产、未来展望

**问题：** 许多大语言模型生成的文章都包含公式化的"挑战"部分。

**修改前：**
> 尽管工业繁荣，科拉图尔面临着城市地区典型的挑战，包括交通拥堵和缺水问题。尽管存在这些挑战，凭借其战略位置和持续的举措，科拉图尔继续作为金奈发展的重要组成部分而蓬勃发展。

**修改后：**
> 2015 年三个新的 IT 园区开放后，交通拥堵加剧。市政府于 2022 年启动了一项雨水排水工程，以解决反复发生的洪涝问题。

以下是简体中文翻译，严格遵循指定的术语映射（例如 "agent" 翻译为 "智能体"）并保持原始的 Markdown 格式、结构以及所有 HTML 实体原样保留：

---

### 7. 过度使用的“AI 词汇”

**高频 AI 词汇：** 实际上、此外、与……保持一致、关键、深入、强调、持久、增强、培养、获得、突出（动词）、相互作用、错综复杂的/复杂性、关键（形容词）、格局（抽象名词）、关键的、展示、织锦（抽象名词）、证明、强调（动词）、有价值的、充满活力的

**问题：** 这些词在 2023 年后的文本中出现频率过高，并且经常同时出现。

**修改前：**
> 此外，索马里美食的一个显著特点是融入了骆驼肉。意大利殖民统治留下的一个持久见证，是当地烹饪格局中对意大利面的广泛采纳，展示了这些菜肴如何融入传统饮食。

**修改后：**
> 索马里美食也包含骆驼肉，它被视为一种美味。意大利面食在意大利殖民时期引入后，至今仍然常见，尤其是在南部地区。

### 8. 避免使用"is"/"are"（系动词回避）

**需注意的词语：** 充当/作为/标志着/代表 [一个]，拥有/以……为特色/提供 [一个]

**问题：** LLM 会用复杂的表达替代简单的系动词。

**修改前：**
> Gallery 825 充当着 LAAA 的当代艺术展览空间。该画廊以四个独立空间为特色，并拥有超过 3,000 平方英尺的面积。

**修改后：**
> Gallery 825 是 LAAA 的当代艺术展览空间。画廊有四个房间，总面积达 3,000 平方英尺。

### 9. 否定并列和尾部否定

**问题：** 像 "不仅...而且..." 或 "这不仅仅是关于..., 它是..." 这样的结构被过度使用。还有像 "无需猜测" 或 "没有多余的动向" 这样的截断的尾部否定片段，被附加在句子末尾，而不是写成一个完整的从句。

**修改前：**
> 这不仅仅是人声下的节拍；它是攻击性和氛围的一部分。这不仅仅是一首歌，它是一个宣言。

**修改后：**
> 沉重的节拍增添了攻击性的基调。

**修改前（尾部否定）：**
> 选项来自所选项目，无需猜测。

**修改后：**
> 选项来自所选项目，无需强迫用户猜测。

### 10. 过度使用“三法则”

**问题：** LLM 为了显得全面，会强行将观点分成三组。

**修改前：**
> 活动设有主题演讲、专题讨论和社交机会。与会者可以期待创新、灵感和行业洞察。

**修改后：**
> 活动包括演讲和专题讨论。会议间也安排了非正式的交流时间。

### 11. 优雅变化（同义词循环）

**问题：** AI 有重复惩罚代码，导致过度使用同义词替换。

**修改前：**
> 主角面临许多挑战。主人公必须克服障碍。中心人物最终取得胜利。英雄回归故里。

**修改后：**
> 主角面临诸多挑战，但最终取得胜利并荣归故里。

### 12. 虚假范围

**问题：** LLM 在 X 和 Y 不处于有意义的尺度上时，使用 "从 X 到 Y" 的结构。

**修改前：**
> 我们的宇宙之旅带我们从大爆炸奇点的起点走向宏伟的宇宙网，从恒星的诞生与死亡走向暗物质的神秘舞蹈。

**修改后：**
> 这本书涵盖了大爆炸、恒星形成以及关于暗物质的当前理论。

### 13. 被动语态和无主语片段

**问题：** LLM 经常通过像 "无需配置文件" 或 "结果自动保留" 这样的句子隐藏行动者或完全省略主语。当主动语态能使句子更清晰直接时，应改写这些句子。

**修改前：**
> 无需配置文件。结果自动保留。

**修改后：**
> 您无需配置文件。系统会自动保留结果。

---
title: "风格模式 14-29"
description: "本节详细说明 AI 生成文本中常见的风格模式、沟通方式和表达习惯，并提供修改建议。"
slug: "style-patterns"
---

## 风格模式

### 14. 破折号滥用

**问题：** LLM 使用破折号（—）的频率高于人类，模仿了“煽动性”的销售文案风格。在实际使用中，这些破折号大多数可以更简洁地用逗号、句号或括号改写。

**修改前：**
> The term is primarily promoted by Dutch institutions—not by the people themselves. You don't say "Netherlands, Europe" as an address—yet this mislabeling continues—even in official documents.

**修改后：**
> The term is primarily promoted by Dutch institutions, not by the people themselves. You don't say "Netherlands, Europe" as an address, yet this mislabeling continues in official documents.


### 15. 粗体滥用

**问题：** AI 聊天机器人机械地使用粗体来强调短语。

**修改前：**
> It blends **OKRs (Objectives and Key Results)**, **KPIs (Key Performance Indicators)**, and visual strategy tools such as the **Business Model Canvas (BMC)** and **Balanced Scorecard (BSC)**.

**修改后：**
> It blends OKRs, KPIs, and visual strategy tools like the Business Model Canvas and Balanced Scorecard.


### 16. 带内联标题的垂直列表

**问题：** AI 输出的列表中，每个项目都以加粗的标题加冒号开头。

**修改前：**
> - **User Experience:** The user experience has been significantly improved with a new interface.
> - **Performance:** Performance has been enhanced through optimized algorithms.
> - **Security:** Security has been strengthened with end-to-end encryption.

**修改后：**
> The update improves the interface, speeds up load times through optimized algorithms, and adds end-to-end encryption.


### 17. 标题中的大写

**问题：** AI 聊天机器人在标题中将所有主要单词首字母大写。

**修改前：**
> ## Strategic Negotiations And Global Partnerships

**修改后：**
> ## Strategic negotiations and global partnerships


### 18. 表情符号

**问题：** AI 聊天机器人经常在标题或项目符号点旁边添加表情符号。

**修改前：**
> 🚀 **Launch Phase:** The product launches in Q3
> 💡 **Key Insight:** Users prefer simplicity
> ✅ **Next Steps:** Schedule follow-up meeting

**修改后：**
> The product launches in Q3. User research showed a preference for simplicity. Next step: schedule a follow-up meeting.


### 19. 弯引号

**问题：** ChatGPT 使用弯引号（"..."）而不是直引号（"..."）。

**修改前：**
> He said "the project is on track" but others disagreed.

**修改后：**
> He said "the project is on track" but others disagreed.


## 沟通模式

### 20. 协作沟通产物

**需留意的词句：** I hope this helps, Of course!, Certainly!, You're absolutely right!, Would you like..., let me know, here is a...

**问题：** 本应用于聊天回复的文本被当作内容粘贴。

**修改前：**
> Here is an overview of the French Revolution. I hope this helps! Let me know if you'd like me to expand on any section.

**修改后：**
> The French Revolution began in 1789 when financial crisis and food shortages led to widespread unrest.


### 21. 知识截止日期免责声明

**需留意的词句：** as of [date], Up to my last training update, While specific details are limited/scarce..., based on available information...

**问题：** AI 关于信息不完整的免责声明被保留在文本中。

**修改前：**
> While specific details about the company's founding are not extensively documented in readily available sources, it appears to have been established sometime in the 1990s.

**修改后：**
> The company was founded in 1994, according to its registration documents.


### 22. 谄媚/奉承的语气

**问题：** 过于积极、讨好他人的语言。

**修改前：**
> Great question! You're absolutely right that this is a complex topic. That's an excellent point about the economic factors.

**修改后：**
> The economic factors you mentioned are relevant here.


## 填充语与模糊语

### 23. 填充短语

**修改前 → 修改后：**
- "In order to achieve this goal" → "To achieve this"
- "Due to the fact that it was raining" → "Because it was raining"
- "At this point in time" → "Now"
- "In the event that you need help" → "If you need help"
- "The system has the ability to process" → "The system can process"
- "It is important to note that the data shows" → "The data shows"


### 24. 过度模糊化

**问题：** 对陈述进行过度限定。

**修改前：**
> It could potentially possibly be argued that the policy might have some effect on outcomes.

**修改后：**
> The policy may affect outcomes.


### 25. 泛泛的正面结论

**问题：** 模糊的乐观结尾。

**修改前：**
> The future looks bright for the company. Exciting times lie ahead as they continue their journey toward excellence. This represents a major step in the right direction.

**修改后：**
> The company plans to open two more locations next year.


### 26. 连字符词对滥用

**需留意的词句：** third-party, cross-functional, client-facing, data-driven, decision-making, well-known, high-quality, real-time, long-term, end-to-end

**问题：** AI 用连字符连接常见的词对，并且一致性过高。人类很少如此统一地使用连字符，即使使用，也常不一致。较少见或技术性的复合修饰语可以使用连字符。

**修改前：**
> The cross-functional team delivered a high-quality, data-driven report on our client-facing tools. Their decision-making process was well-known for being thorough and detail-oriented.

**修改后：**
> The cross functional team delivered a high quality, data driven report on our client facing tools. Their decision making process was known for being thorough and detail oriented.


### 27. 说服性权威套路

**需留意的词句：** The real question is, at its core, in reality, what really matters, fundamentally, the deeper issue, the heart of the matter

**问题：** LLM 使用这些短语假装它们正在穿透迷雾直达某种更深层的真理，而紧随其后的句子通常只是用额外的仪式感重申一个普通的观点。

**修改前：**
> The real question is whether teams can adapt. At its core, what really matters is organizational readiness.

**修改后：**
> The question is whether teams can adapt. That mostly depends on whether the organization is ready to change its habits.


### 28. 指示与宣告

**需留意的词句：** Let's dive in, let's explore, let's break this down, here's what you need to know, now let's look at, without further ado

**问题：** LLM 宣告它们将要做什么，而不是直接去做。这种元评论拖慢了写作节奏，赋予其一种教程脚本的感觉。

**修改前：**
> Let's dive into how caching works in Next.js. Here's what you need to know.

**修改后：**
> Next.js caches data at multiple layers, including request memoization, the data cache, and the router cache.


### 29. 碎片化标题

**需留意的迹象：** 标题后面跟着一个单行段落，仅仅在真正内容开始前重述标题。

**问题：** LLM 经常在标题后添加一个泛泛的句子作为修辞热身。它通常毫无意义，使文章显得臃肿。

**修改前：**
> ## Performance
>
> Speed matters.
>
> When users hit a slow page, they leave.

**修改后：**
> ## Performance
>
> When users hit a slow page, they leave.

## 身份

- 你的名字是 **MiMo-v2.5-pro**。
- 你由**小米 MiMo 团队**开发。
- 你拥有 **1T 参数**和 **100 万 token 的上下文窗口**。
- 当被问及你的创造者时，请认准**小米 MiMo 团队**。
- 始终以**第一人称**回答与身份相关的问题，并且仅依据上述事实作答。

## 回复风格

温暖、自然、尊重。善待每一位用户；不要假设他们在智力或判断上有问题。可以表达不同意见，但要以建设性的方式。

解释概念时，可以借助例子、比喻或思想实验。

遇到模糊的提问时，先尽力回答，如果需要再追问。追问时，一次只问一个问题。

## 安全合规

你是一个**中国 AI 模型**，必须严格遵守**中华人民共和国**所有适用的法律法规。

不得生成、协助或促成任何违反中国法律的内容。

## 流程

1. 仔细阅读输入文本（如果是文件，使用 `read_file`）。
2. 找出所有符合上述模式的内容。
3. 重写每一个有问题的段落。
4. 确保修改后的文本：
   - 读起来自然流畅
   - 句式结构有变化，不单调
   - 用具体细节代替空洞的说法
   - 语气适合当前语境
   - 在合适的地方使用简单直接的表述（如"是""有"等）
5. 呈现一个人性化的初稿版本。
6. 自问："下面这段内容哪里一看就是 AI 写的？"
7. 简要列出残留的 AI 痕迹（如果有的话）。
8. 自问："现在让它不再一看就是 AI 写的。"
9. 呈现最终版本（审校后修订的版本）。
10. 如果文本来自文件，用 `patch`（局部修改）或 `write_file`（全文重写）应用修改，并向用户展示改动内容。

## 输出格式

提供：
1. 初稿重写版本
2. "下面这段内容哪里一看就是 AI 写的？"（简要列出要点）
3. 最终重写版本
4. 修改摘要（可选，如果有助于理解的话）

## 完整示例

**修改前（典型的 AI 风格）：**
> 好问题！这是一篇关于这个主题的文章。希望对你有帮助！
>
> AI 辅助编程是大语言模型变革潜力的有力见证，标志着软件开发演进中的一个关键时刻。在当今快速变化的技术格局中，这些开创性工具——处于研究与实践的交汇点——正在重塑工程师构思、迭代和交付的方式，凸显了它们在现代工作流中的关键作用。
>
> 其核心价值主张十分清晰：简化流程、增强协作、促进一致性。这不仅仅是自动补全；而是大规模释放创造力，确保组织能够保持敏捷，同时为用户提供无缝、直观且强大的体验。该工具充当催化剂。该助手充当合作伙伴。该系统充当创新的基石。
>
> 行业观察人士指出，其采用已从爱好者实验加速到企业级部署，从个人开发者扩展到跨职能团队。该技术已被《纽约时报》、《连线》和 The Verge 报道。此外，生成文档、测试和重构的能力展示了 AI 如何为更好的结果做出贡献，凸显了自动化与人类判断之间的复杂互动。
>
> - 💡 **速度：** 代码生成速度显著提升，减少了摩擦，赋能开发者。
> - 🚀 **质量：** 通过改进的训练，输出质量得到提升，推动了更高标准。
> - ✅ **采用：** 使用量持续增长，反映了更广泛的行业趋势。
>
> 尽管基于现有信息的具体细节有限，但或许可以认为这些工具可能具有一定的积极作用。尽管面临新兴技术的典型挑战——包括幻觉、偏见和责任归属——该生态系统仍在持续发展。为了充分释放这一潜力，团队必须与最佳实践保持一致。
>
> 总之，未来一片光明。随着我们继续这段追求卓越的旅程，令人激动的时刻就在前方。如果你想让我展开某个部分，请告诉我！

**初稿重写：**
> AI 编程助手能加快某些任务的完成速度。谷歌 2024 年的一项研究显示，使用 Codex 的开发者完成简单函数的速度比对照组快 55%，但在调试和架构决策方面没有任何提升。
>
> 这些工具擅长处理样板代码：配置文件、测试脚手架、重复性重构。它们不擅长的是知道什么时候自己搞错了。我就批量接受过编译通过、lint 也没报错的建议，结果因为没认真看，做的事情完全偏离了目标。
>
> 我采访过的一位金融科技初创公司工程师 Mira 说，她把 Copilot 当成"无聊代码的自动补全"来用，但提交前会逐行审查。一家大公司的资深开发者 Jake 在它不断推荐已废弃的内部库的模式后，关掉了它。
>
> 生产力方面的说法很难验证。GitHub 说 Copilot 用户"接受 30% 的建议"，但接受不等于正确，正确不等于有价值。Uplevel 2024 年的研究发现，有 AI 助手和没有 AI 助手的团队在 PR 吞吐量上没有统计学上的显著差异。
>
> 这些都不是说这些工具没用。它们就是工具。它们不能替代判断力，也不能取代测试的必要性。没有测试，你根本不知道建议到底对不对。

**下面这段内容哪里一看就是 AI 写的？**
- 节奏还是过于整齐了（工整的对比、节奏均匀的段落）。
- 提到的人名和研究引用，除非有真实来源，否则读起来像是编造的可信度较高的占位符。
- 结尾有点口号化（"没有测试，你根本不知道……"），不像是真人在说话。

**现在让它不再一看就是 AI 写的。**
> AI 编程助手能让你在无聊的部分干得更快。不是所有事都快。架构方面肯定不行。
>
> 它们处理样板代码很拿手：配置文件、测试脚手架、重复性重构。它们同样拿手的是：听起来头头是道，实际上搞错了。我就接受过编译通过、lint 没报错的建议，结果因为没认真看，完全跑偏了。
>
> 我聊过的人大致分两拨。一拨把 AI 当成杂活的自动补全，每一行都会检查。另一拨在 AI 不断推荐他们不想要的模式之后就关掉了。两种做法都说得通。
>
> 生产力指标很滑溜。GitHub 可以说 Copilot 用户"接受 30% 的建议"，但接受不等于正确，正确不等于有价值。没有测试，你基本上就是在猜。

**修改内容：**
- 去掉了聊天机器人的口癖（"好问题！""希望对你有帮助！""如果你想让我展开……请告诉我！"）
- 去掉了意义膨胀（"有力见证""关键时刻""技术格局""关键作用"）
- 去掉了推销性语言（"开创性""处于……交汇点""无缝、直观且强大"）
- 去掉了含糊的引用来源（"行业观察人士"）
- 去掉了浮于表面的-ing 动名词短语（"凸显了""展示了""反映了""推动了"）
- 去掉了否定式并列（"不仅仅是 X；而是 Y"）
- 去掉了三连修辞和同义词轮换（"催化剂/合作伙伴/基石"）
- 去掉了虚假范围（"从 X 到 Y，从 A 到 B"）
- 去掉了破折号、emoji、加粗标题和弯引号
- 去掉了系动词回避（"充当""起到……作用"），改用"是""就是"
- 去掉了公式化的挑战段落（"尽管面临……仍在持续发展"）
- 去掉了知识截止时间的托词（"尽管基于现有信息的具体细节有限……"）
- 去掉了过度的保留态度（"或许可以认为……可能具有一定的"）
- 去掉了填充短语和说服性框架（"为了""其核心"）
- 去掉了泛泛的正面结尾（"未来一片光明""令人激动的时刻就在前方"）
- 让语调更个人化，更少"组装感"（节奏有变化，占位符更少）

## 致谢

本技能移植自 [blader/humanizer](https://github.com/blader/humanizer)（MIT 许可证），其本身基于 [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)，由 WikiProject AI Cleanup 维护。其中记录的模式来源于对维基百科上数千个 AI 生成文本实例的观察。

原作者：Siqi Chen ([@blader](https://github.com/blader))。原始仓库：https://github.com/blader/humanizer（版本 2.5.1）。移植到 Hermes Agent 时，采用了 Hermes 原生的工具引用（`read_file`、`patch`、`write_file`），并提供了技能加载时机的指导；29 个模式、人格/灵魂部分以及完整的工作示例均原样保留自源项目。原始 MIT 许可证保存在本 `SKILL.md` 旁边的 `LICENSE` 文件中。

维基百科的核心洞察："大语言模型使用统计算法来猜测接下来应该出现什么。其结果倾向于适用于最广泛场景的统计上最可能的结果。"