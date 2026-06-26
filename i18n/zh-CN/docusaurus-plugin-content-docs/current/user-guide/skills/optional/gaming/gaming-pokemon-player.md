title: Pokemon Player — Play Pokemon via headless emulator + RAM reads
sidebar_label: Pokemon Player
description: 通过无头模拟器和内存读取玩宝可梦
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Pokemon Player (宝可梦玩家)

通过无头模拟器和内存读取玩宝可梦。

## Skill metadata (技能元数据)

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/gaming/pokemon-player` 安装 |
| Path | `optional-skills/gaming/pokemon-player` |
| Platforms | linux, macos, windows |

## Reference: full SKILL.md (参考：完整的SKILL.md)

:::info
以下是Hermes在触发此技能时加载的完整技能定义。这是智能体（agent）在技能激活时看到的指令。
:::

# Pokemon Player (宝可梦玩家)

使用 `pokemon-agent` 包通过无头模拟进行宝可梦游戏。

## When to Use (何时使用)
- 用户说“玩宝可梦”、“开始宝可梦”或“宝可梦游戏”。
- 用户询问关于红宝石、蓝宝石、黄宝石、炎帝艾斯等（Pokemon Red, Blue, Yellow, FireRed 等）的信息。
- 用户想看一个AI玩宝可梦。
- 用户引用一个ROM文件（.gb, .gbc, .gba）。

## Startup Procedure (启动流程)

### 1. First-time setup (首次设置：克隆、虚拟环境、安装)
仓库位于GitHub上的NousResearch/pokemon-agent。请将其克隆，然后
设置一个Python 3.10+的虚拟环境。使用uv（推荐用于速度）
来创建venv并以可编辑模式安装该包，同时包含pyboy扩展。如果uv不可用，则回退到python3 -m venv + pip。

在这台机器上，它已在 /home/teknium/pokemon-agent 处设置好，并准备了虚拟环境——只需cd进入该目录并运行 source .venv/bin/activate。

你还需要一个ROM文件。请向用户询问他们的文件。在这台机器上，
roms/pokemon_red.gb 目录下有一个。
切勿下载或提供ROM文件——务必总是询问用户。

### 2. Start the game server (启动游戏服务器)
在激活了venv的pokemon-agent目录内，运行
`pokemon-agent serve`，并使用 `--rom` 指向ROM文件和 `--port 9876`。
使用 `&` 在后台运行它。
要从存档恢复，请添加 `--load-state` 和存档名称。
等待4秒进行启动，然后通过 GET /health 进行验证。

### 3. Set up live dashboard for user to watch (为用户设置实时仪表板)
通过localhost.run的SSH反向隧道，以便用户可以在浏览器中查看仪表板。连接时使用ssh，将本地端口9876转发到nokey@localhost.run的远程端口80。将输出重定向到一个日志文件，等待10秒，然后grep日志以找到.lhr.life的URL。给用户这个URL，并在末尾加上 /dashboard/。
隧道URL每次都会改变——如果重启了，请给用户新的URL。

## Save and Load (保存与加载)

### When to save (何时保存)
- 每15-20个回合的游戏进程。
- 始终在遭遇道馆战、对手战斗或高风险战斗之前。
- 在进入新城镇或地下城之前。
- 在进行任何不确定的操作之前。

### How to save (如何保存)
POST /save 并提供一个描述性的名称。好的示例包括：
before_brock, route1_start, mt_moon_entrance, got_cut

### How to load (如何加载)
POST /load 并提供存档名称。

### List available saves (列出可用存档)
GET /saves 将返回所有已保存的状态。

### Loading on server startup (服务器启动时加载)
使用 `--load-state` 标志来启动服务器并自动加载存档。
这比启动后通过API加载要快得多。

## The Gameplay Loop (游戏循环)

### Step 1: OBSERVE — check state AND take a screenshot (观察 — 检查状态和截图)
GET /state 以获取位置、HP、战斗、对话信息。
GET /screenshot 并保存到 /tmp/pokemon.png，然后使用vision_analyze。
务必同时进行两者——RAM状态提供数字，而视觉（vision）则提供空间意识。

### Step 2: ORIENT (定向)
- 屏幕上的对话/文本 → 继续阅读
- 在战斗中 → 战斗或逃跑
- 小队受伤 → 前往宝可梦中心
- 靠近目标 → 小心导航

### Step 3: DECIDE (决策)
优先级：对话 > 战斗 > 回血 > 故事目标 > 训练 > 探索

### Step 4: ACT — move 2-4 steps max, then re-check (行动 — 最多移动2-4步，然后重新检查)
POST /action 并提供一个简短的行动列表（2-4个动作，而不是10-15个）。

### Step 5: VERIFY — screenshot after every move sequence (验证 — 每完成一次移动序列后都截图)
拍摄一张截图并使用vision_analyze来确认你是否按预期方向移动。这是最重要的一步。没有视觉（vision），你会迷失方向。

### Step 6: RECORD progress to memory with PKM: prefix (将进度记录到内存中，使用PKM:前缀)

### Step 7: SAVE periodically (定期保存)

## Action Reference (动作参考)
- press_a — 确认、对话、选择
- press_b — 取消、关闭菜单
- press_start — 打开游戏菜单
- walk_up/down/left/right — 移动一个方块
- hold_b_N — 保持按住B键N帧（用于快速浏览文本）
- wait_60 — 等待大约1秒（60帧）
- a_until_dialog_end — 反复按下A键直到对话结束

## Critical Tips from Experience (经验中的关键提示)

### USE VISION CONSTANTLY (持续使用视觉功能)
- 每2-4个移动步骤都进行一次截图。
- RAM状态告诉你位置和HP，但并不知道周围有什么。
- 悬崖、栅栏、标志、建筑门、NPC——这些只有通过截图才能看到。
- 向视觉模型提出具体问题：“我北边一个方块是什么？”
- 当卡住时，始终先截图再尝试随机方向。

### Warp Transitions Need Extra Wait Time (传送过渡需要额外的等待时间)
当穿过门或楼梯时，地图转换过程中屏幕会变黑。你必须等待它完成。在任何门/楼梯传送后都添加2-3个wait_60动作。如果不等待，位置信息就会显示为陈旧的，你会以为自己还在旧地图上。

### Building Exit Trap (建筑出口陷阱)
当你走出建筑物时，你会直接出现在门的正面。如果你朝北走，你可能会直接回到里面。务必先侧身（sidestep），即向左或向右走2个方块，然后再朝预定方向前进。

### Dialog Handling (对话处理)
Gen 1的文本是逐字缓慢滚动的。要快速浏览对话，请按住B键120帧然后按下A键。根据需要重复操作。按住B键可以使文本以最快的速度显示。然后按下A键才能推进到下一行。a_until_dialog_end动作会检查RAM的对话标志，但该标志并不能捕获所有文本状态。如果对话似乎卡住了，请使用手动模式 hold_b + press_a 模式，并通过截图进行验证。

### Ledges Are One-Way (悬崖是单向的)
悬崖（小的峭壁）只能向下（南）跳跃，绝不能向上（北）攀爬。如果被悬崖阻挡而想往北走，你必须向左或向右移动以找到周围的空隙。使用视觉功能来确定哪个方向有空隙。明确地询问视觉模型。

### Navigation Strategy (导航策略)
- 一次移动2-4步，然后截图检查位置。
- 进入新区域时，立即截图进行定向。
- 询问视觉模型“往[目的地]哪个方向？”
- 如果卡住超过3次尝试，则截图并彻底重新评估。
- 不要进行10-15次的密集移动——你会走过头或卡住。

### Running from Wild Battles (从野生战斗中逃跑)
在战斗菜单上，“逃跑”（RUN）位于右下角。要从默认光标位置（FIGHT，左上角）到达它：先向下再向右移动光标到“逃跑”，然后按下A键。使用hold_b来快速浏览文本/动画。

### Battling (FIGHT) (战斗)
在战斗菜单上，“战斗”（FIGHT）位于左上角（默认光标位置）。按下A键进入招式选择，再按一次A键使用第一个招式。然后按住B键以快速浏览攻击动画和文本。

## Battle Strategy (战斗策略)

### Decision Tree (决策树)
1. 想捕获吗？ → 削弱后扔宝可球。
2. 野生生物不需要吗？ → 逃跑（RUN）。
3. 有类型优势吗？ → 使用超有效招式。
4. 没有优势吗？ → 使用最强的STAB招式。
5. HP低吗？ → 换人或使用药水。

### Gen 1 Type Chart (Gen 1 类型图表，关键匹配)
- 水克火、土、岩石。
- 火克草、虫、冰。
- 草克水、土、岩石。
- 电克水、飞翔。
- 土克火、电、岩石、毒。
- 超能力克斗、毒（在Gen 1中占主导地位！）。

### Gen 1 Quirks (Gen 1的特点)
- 特殊属性 = 对特殊招式的攻防兼顾。
- 超能力类型过于强大（幽灵招式有Bug）。
- 暴击率基于速度（Speed）属性。
- 封锁/绑定（Wrap/Bind）可以阻止对手行动。
- Focus Energy Bug：降低而非提高暴击率。

## Memory Conventions (内存约定)
| Prefix | Purpose (目的) | Example (示例) |
|--------|---------|---------|
| PKM:OBJECTIVE | 当前目标 | 从茂市商店拿包裹 |
| PKM:MAP | 导航知识 | 茂市：商店在东北方 |
| PKM:STRATEGY | 战斗/团队计划 | 在遇到 Misty 之前需要草属性。 |
| PKM:PROGRESS | 里程碑追踪器 | 打败对手，前往茂市。 |
| PKM:STUCK | 卡住的情况 | y=28处的悬崖，向右绕过。 |
| PKM:TEAM | 团队笔记 | 小水怪Lv6，使用冲撞+尾 whip。 |

## Progression Milestones (进阶里程碑)
- 选择初始宝可梦。
- 从茂市商店交付包裹，获得精灵图鉴。
- 岩石徽章 — Brock（岩石）→ 使用水/草属性。
- 瀑布徽章 — Misty（水）→ 使用草/电属性。
- 雷鸣徽章 — Lt. Surge（电）→ 使用土属性。
- 彩虹徽章 — Erika（草）→ 使用火/冰/飞翔属性。
- 灵魂徽章 — Koga（毒）→ 使用土/超能力属性。
- 沼泽徽章 — Sabrina（超能力）→ 最难的道馆。
- 火山徽章 — Blaine（火）→ 使用水/土属性。
- 大地徽章 — Giovanni（土）→ 使用水/草/冰属性。
- 四天王 → 冠军！

## Stopping Play (停止游戏)
1. 通过POST /save 以描述性的名称保存游戏。
2. 用PKM:PROGRESS更新内存。
3. 告诉用户：“游戏已保存为[名称]！输入‘play pokemon’即可恢复。”
4. 关闭服务器和隧道后台进程。

## Pitfalls (潜在陷阱)
- 切勿下载或提供ROM文件。
- 不要在检查视觉功能之前发送超过4-5个动作。
- 离开建筑物后，在朝北走之前务必先侧身。
- 在门/楼梯传送后务必添加wait_60 x2-3。
- 通过RAM进行的对话检测是不可靠的——请通过截图进行验证。
- 在遭遇高风险事件**之前**保存游戏。
- 隧道URL每次重启都会改变。