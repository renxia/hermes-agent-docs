---
sidebar_position: 10
title: "外观与主题"
description: "通过内置和自定义外观定制 Hermes 命令行界面"
---

# 外观与主题

外观控制 Hermes 命令行界面的**视觉呈现**：横幅颜色、加载动画的符号和动词、响应框标签、品牌标识文本以及工具活动前缀。

会话风格与视觉风格是两个不同的概念：

- **个性**会改变智能体的语气和措辞。
- **外观**会改变命令行界面的视觉表现。

## 更换外观

```bash
/skin                # 显示当前外观并列出可用外观
/skin ares           # 切换至内置外观
/skin mytheme        # 切换至来自 ~/.hermes/skins/mytheme.yaml 的自定义外观
```

或在 `~/.hermes/config.yaml` 中设置默认外观：

```yaml
display:
  skin: default
```

## 内置皮肤

| 皮肤 | 描述 | 智能体品牌标识 | 视觉特征 |
|------|------|----------------|----------|
| `default` | 经典 Hermes 风格 — 金色与可爱风 | `Hermes 智能体` | 暖金色边框，玉米丝色文本，旋转动画中的可爱面孔。熟悉的蛇杖横幅。简洁且亲切。 |
| `ares` | 战神主题 — 深红与青铜色 | `Ares 智能体` | 深红色边框，点缀青铜色装饰。激进的旋转动画动词（“锻造”、“行进”、“淬火”）。定制的剑盾 ASCII 艺术横幅。 |
| `mono` | 单色 — 干净的灰度 | `Hermes 智能体` | 全部为灰色 — 无彩色。边框颜色为 `#555555`，文本颜色为 `#c9d1d9`。适合极简终端设置或屏幕录制。 |
| `slate` | 冷调蓝色 — 面向开发者 | `Hermes 智能体` | 宝蓝色边框（`#4169e1`），柔和的蓝色文本。冷静且专业。无自定义旋转动画 — 使用默认的面孔。 |
| `daylight` | 浅色主题，适用于明亮终端，配有深色文本和冷蓝色点缀 | `Hermes 智能体` | 为白色或明亮终端设计。深板岩色文本，蓝色边框，浅色状态栏背景，以及一个在浅色终端配置下仍可读的浅色完成菜单。 |
| `warm-lightmode` | 暖棕色/金色文本，适用于浅色终端背景 | `Hermes 智能体` | 为浅色终端提供暖调羊皮纸色。深棕色文本配鞍褐色点缀，奶油色状态栏背景。是冷调 daylight 主题的温暖替代方案。 |
| `poseidon` | 海神主题 — 深蓝与海沫绿 | `Poseidon 智能体` | 深蓝到海沫绿的渐变。海洋主题的旋转动画（“绘制洋流”、“测量深度”）。三叉戟 ASCII 艺术横幅。 |
| `sisyphus` | 西西弗斯主题 — 朴素的灰度，寓意坚韧 | `Sisyphus 智能体` | 浅灰色与鲜明对比。巨石主题的旋转动画（“推石上山”、“重置巨石”、“忍受循环”）。巨石与山丘 ASCII 艺术横幅。 |
| `charizard` | 火山主题 — 焦橙色与余烬红 | `Charizard 智能体` | 暖调焦橙色到余烬红的渐变。火焰主题的旋转动画（“调整气流”、“测量燃烧”）。龙形剪影 ASCII 艺术横幅。 |

## 可配置键完整列表

### 颜色 (`colors:`)

控制整个 CLI 中的所有颜色值。值为十六进制颜色字符串。

| 键 | 描述 | 默认值（`default` 皮肤） |
|----|------|--------------------------|
| `banner_border` | 启动横幅周围的面板边框 | `#CD7F32` (青铜色) |
| `banner_title` | 横幅中标题文本的颜色 | `#FFD700` (金色) |
| `banner_accent` | 横幅中的节标题（如“可用工具”等） | `#FFBF00` (琥珀色) |
| `banner_dim` | 横幅中的柔和文本（分隔符、次要标签） | `#B8860B` (深金色) |
| `banner_text` | 横幅中的正文文本（工具名称、技能名称） | `#FFF8DC` (玉米丝色) |
| `ui_accent` | 通用 UI 强调色（高亮、活动元素） | `#FFBF00` |
| `ui_label` | UI 标签和标记 | `#4dd0e1` (青色) |
| `ui_ok` | 成功指示器（对勾、完成） | `#4caf50` (绿色) |
| `ui_error` | 错误指示器（失败、被阻止） | `#ef5350` (红色) |
| `ui_warn` | 警告指示器（谨慎、批准提示） | `#ffa726` (橙色) |
| `prompt` | 交互式提示文本颜色 | `#FFF8DC` |
| `input_rule` | 输入区域上方的水平线 | `#CD7F32` |
| `response_border` | 智能体响应框周围的边框（ANSI 转义） | `#FFD700` |
| `session_label` | 会话标签颜色 | `#DAA520` |
| `session_border` | 会话 ID 的柔和边框颜色 | `#8B8682` |
| `status_bar_bg` | TUI 状态/用量栏的背景颜色 | `#1a1a2e` |
| `voice_status_bg` | 语音模式状态徽章的背景颜色 | `#1a1a2e` |
| `selection_bg` | TUI 鼠标选择高亮器的背景颜色。未设置时回退到 `completion_menu_current_bg`。 | `#333355` |
| `completion_menu_bg` | 补全菜单列表的背景颜色 | `#1a1a2e` |
| `completion_menu_current_bg` | 活动补全行的背景颜色 | `#333355` |
| `completion_menu_meta_bg` | 补全元数据列的背景颜色 | `#1a1a2e` |
| `completion_menu_meta_current_bg` | 活动补全元数据列的背景颜色 | `#333355` |

### 旋转动画 (`spinner:`)

控制等待 API 响应时显示的动画旋转图标。

| 键 | 类型 | 描述 | 示例 |
|----|------|------|------|
| `waiting_faces` | 字符串列表 | 等待 API 响应时循环显示的面孔 | `["(⚔)", "(⛨)", "(▲)"]` |
| `thinking_faces` | 字符串列表 | 模型推理过程中循环显示的面孔 | `["(⚔)", "(⌁)", "(<>)"]` |
| `thinking_verbs` | 字符串列表 | 旋转动画消息中显示的动词 | `["锻造", "谋划", "锤炼计划"]` |
| `wings` | [左, 右] 对列表 | 旋转动画周围的装饰性括号 | `[["⟪⚔", "⚔⟫"], ["⟪▲", "▲⟫"]]` |

当旋转动画值为空时（如 `default` 和 `mono` 皮肤中），将使用 `display.py` 中的硬编码默认值。

### 品牌标识 (`branding:`)

整个 CLI 界面中使用的文本字符串。

| 键 | 描述 | 默认值 |
|----|------|--------|
| `agent_name` | 在横幅标题和状态显示中显示的名称 | `Hermes 智能体` |
| `welcome` | CLI 启动时显示的欢迎消息 | `欢迎使用 Hermes 智能体！输入您的消息或 /help 查看命令。` |
| `goodbye` | 退出时显示的消息 | `再见！⚕` |
| `response_label` | 响应框标题上的标签 | ` ⚕ Hermes ` |
| `prompt_symbol` | 用户输入提示前的符号（单个标记，渲染器会添加尾随空格） | `❯` |
| `help_header` | `/help` 命令输出的标题文本 | `(^_^)? 可用命令` |

### 其他顶层键

| 键 | 类型 | 描述 | 默认值 |
|----|------|------|--------|
| `tool_prefix` | 字符串 | CLI 中工具输出行前添加的字符 | `┊` |
| `tool_emojis` | 字典 | 每个工具对应的表情符号覆盖，用于旋转动画和进度显示（`{工具名: 表情}`） | `{}` |
| `banner_logo` | 字符串 | 富文本标记 ASCII 艺术 logo（替换默认的 HERMES_AGENT 横幅） | `""` |
| `banner_hero` | 字符串 | 富文本标记 hero 艺术（替换默认的蛇杖艺术） | `""` |

## 自定义皮肤

在 `~/.hermes/skins/` 目录下创建 YAML 文件。用户皮肤会从内置的 `default` 皮肤继承缺失的值，因此您只需指定想要更改的键。

### 完整自定义皮肤 YAML 模板

```yaml
# ~/.hermes/skins/mytheme.yaml
# 完整皮肤模板 — 显示了所有键。删除您不需要的键；
# 缺失的值将自动从 'default' 皮肤继承。

name: mytheme
description: 我的自定义主题

colors:
  banner_border: "#CD7F32"
  banner_title: "#FFD700"
  banner_accent: "#FFBF00"
  banner_dim: "#B8860B"
  banner_text: "#FFF8DC"
  ui_accent: "#FFBF00"
  ui_label: "#4dd0e1"
  ui_ok: "#4caf50"
  ui_error: "#ef5350"
  ui_warn: "#ffa726"
  prompt: "#FFF8DC"
  input_rule: "#CD7F32"
  response_border: "#FFD700"
  session_label: "#DAA520"
  session_border: "#8B8682"
  status_bar_bg: "#1a1a2e"
  voice_status_bg: "#1a1a2e"
  selection_bg: "#333355"
  completion_menu_bg: "#1a1a2e"
  completion_menu_current_bg: "#333355"
  completion_menu_meta_bg: "#1a1a2e"
  completion_menu_meta_current_bg: "#333355"

spinner:
  waiting_faces:
    - "(⚔)"
    - "(⛨)"
    - "(▲)"
  thinking_faces:
    - "(⚔)"
    - "(⌁)"
    - "(<>)"
  thinking_verbs:
    - "处理中"
    - "分析中"
    - "计算中"
    - "评估中"
  wings:
    - ["⟪⚡", "⚡⟫"]
    - ["⟪●", "●⟫"]

branding:
  agent_name: "我的智能体"
  welcome: "欢迎使用我的智能体！输入您的消息或 /help 查看命令。"
  goodbye: "待会儿见！⚡"
  response_label: " ⚡ 我的智能体 "
  prompt_symbol: "⚡"
  help_header: "(⚡) 可用命令"

tool_prefix: "┊"

# 每个工具的表情符号覆盖（可选）
tool_emojis:
  terminal: "⚔"
  web_search: "🔮"
  read_file: "📄"

# 自定义 ASCII 艺术横幅（可选，支持富文本标记）
# banner_logo: |
#   [bold #FFD700] 我的智能体 [/]
# banner_hero: |
#   [#FFD700]  自定义艺术内容  [/]
```

### 最小化自定义皮肤示例

由于所有内容都从 `default` 继承，一个最小化的皮肤只需要更改不同的部分：

```yaml
name: cyberpunk
description: 赛博朋克终端主题

colors:
  banner_border: "#FF00FF"
  banner_title: "#00FFFF"
  banner_accent: "#FF1493"

spinner:
  thinking_verbs: ["接入中", "解密中", "上传中"]
  wings:
    - ["⟨⚡", "⚡⟩"]

branding:
  agent_name: "赛博智能体"
  response_label: " ⚡ 赛博 "

tool_prefix: "▏"
```

## Hermes Mod — 可视皮肤编辑器

[Hermes Mod](https://github.com/cocktailpeanut/hermes-mod) 是一个由社区构建的 Web UI，用于可视化地创建和管理皮肤。您无需手动编写 YAML，而是获得一个带有实时预览的点击式编辑器。

![Hermes Mod 皮肤编辑器](https://raw.githubusercontent.com/cocktailpeanut/hermes-mod/master/nous.png)

**功能介绍：**

- 列出所有内置和自定义皮肤
- 将任何皮肤打开到可视化编辑器中，包含所有 Hermes 皮肤字段（颜色、旋转动画、品牌标识、工具前缀、工具表情符号）
- 根据文本提示生成 `banner_logo` 文字艺术
- 将上传的图片（PNG, JPG, GIF, WEBP）转换为多种渲染风格（盲文、ASCII 渐变、块状、点状）的 `banner_hero` ASCII 艺术
- 直接保存到 `~/.hermes/skins/`
- 通过更新 `~/.hermes/config.yaml` 来激活皮肤
- 显示生成的 YAML 和实时预览

### 安装

**选项 1 — Pinokio（一键安装）：**

在 [pinokio.computer](https://pinokio.computer) 上找到它并一键安装。

**选项 2 — npx（从终端最快的方式）：**

```bash
npx -y hermes-mod
```

**选项 3 — 手动安装：**

```bash
git clone https://github.com/cocktailpeanut/hermes-mod.git
cd hermes-mod/app
npm install
npm start
```

### 使用方法

1. 启动应用（通过 Pinokio 或终端）。
2. 打开 **皮肤工作室**。
3. 选择一个内置或自定义皮肤进行编辑。
4. 从文本生成 logo 和/或上传图片用于 hero 艺术。选择渲染风格和宽度。
5. 编辑颜色、旋转动画、品牌标识和其他字段。
6. 点击 **保存** 以将皮肤 YAML 写入 `~/.hermes/skins/`。
7. 点击 **激活** 以将其设置为当前皮肤（更新 `config.yaml` 中的 `display.skin`）。

Hermes Mod 尊重 `HERMES_HOME` 环境变量，因此它也适用于[配置文件](/user-guide/profiles)。

## 操作说明

- 内置皮肤从 `hermes_cli/skin_engine.py` 加载。
- 未知皮肤会自动回退到 `default`。
- `/skin` 命令会立即为当前会话更新活跃的 CLI 主题。
- `~/.hermes/skins/` 目录下的用户皮肤优先于同名的内置皮肤。
- 通过 `/skin` 命令更改的皮肤仅限当前会话。要将某个皮肤设为永久默认项，请在 `config.yaml` 文件中进行设置。
- `banner_logo` 和 `banner_hero` 字段支持 Rich 控制台标记（例如 `[bold #FF0000]text[/]`）以实现彩色 ASCII 艺术效果。