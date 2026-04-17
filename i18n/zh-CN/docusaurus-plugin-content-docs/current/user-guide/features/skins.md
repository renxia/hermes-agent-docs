---
sidebar_position: 10
title: "皮肤与主题"
description: "使用内置和用户定义的皮肤定制 Hermes CLI"
---

# 皮肤与主题

皮肤控制着 Hermes CLI 的**视觉呈现**：横幅颜色、加载动画（spinner）的图案和动词、响应框标签、品牌文本和工具活动前缀。

对话式风格和视觉风格是两个独立的概念：

- **个性（Personality）** 改变代理的语气和措辞。
- **皮肤（Skin）** 改变 CLI 的外观。

## 更改皮肤

```bash
/skin                # 显示当前皮肤并列出可用皮肤
/skin ares           # 切换到内置皮肤
/skin mytheme        # 切换到来自 ~/.hermes/skins/mytheme.yaml 的自定义皮肤
```

或者在 `~/.hermes/config.yaml` 中设置默认皮肤：

```yaml
display:
  skin: default
```

## 内置皮肤

| 皮肤 | 描述 | 代理品牌 | 视觉特点 |
|------|-------------|----------------|------------------|
| `default` | 经典赫尔墨斯 — 金色和可爱风格 | `Hermes Agent` | 温暖的金色边框，米色文本，加载动画中使用可爱的图案。熟悉的司根神杖横幅。简洁而诱人。 |
| `ares` | 战神主题 — 深绯红和青铜色 | `Ares Agent` | 深绯红色边框搭配青铜色点缀。具有侵略性的加载动画动词（“锻造”、“行进”、“淬火钢铁”）。定制的剑盾 ASCII 艺术横幅。 |
| `mono` | 单色调 — 干净的灰阶 | `Hermes Agent` | 全灰阶 — 无颜色。边框为 `#555555`，文本为 `#c9d1d9`。非常适合极简终端设置或屏幕录制。 |
| `slate` | 冷蓝色 — 开发者友好 | `Hermes Agent` | 皇家蓝边框（`#4169e1`），柔和的蓝色文本。冷静而专业。没有自定义加载动画 — 使用默认图案。 |
| `daylight` | 浅色主题，适用于亮终端，带有深色文本和冷蓝色点缀 | `Hermes Agent` | 专为白色或亮终端设计。深石板灰文本搭配蓝色边框，浅色状态表面，以及在亮终端配置文件中依然易读的浅色补全菜单。 |
| `warm-lightmode` | 适用于浅终端背景的暖棕/金色文本 | `Hermes Agent` | 适用于浅终端的暖羊皮纸色调。深棕色文本搭配鞍棕色点缀，奶油色状态表面。比冷色调的 daylight 主题更自然。 |
| `poseidon` | 海神主题 — 深蓝和海沫绿 | `Poseidon Agent` | 从深蓝到海沫绿的渐变。海洋主题的加载动画（“绘制洋流”、“测深”）。三叉戟 ASCII 艺术横幅。 |
| `sisyphus` | 西西弗斯主题 — 朴素的灰阶与坚持 | `Sisyphus Agent` | 浅灰色搭配鲜明对比。以巨石为主题的加载动画（“向上推石”、“重置巨石”、“忍受循环”）。巨石和山脉 ASCII 艺术横幅。 |
| `charizard` | 火山主题 — 焦橙色和余烬色 | `Charizard Agent` | 从暖焦橙到余烬色的渐变。以火焰为主题的加载动画（“切入气流”、“测量燃烧”）。龙形轮廓 ASCII 艺术横幅。 |

## 可配置键的完整列表

### 颜色（`colors:`）

控制 CLI 中的所有颜色值。值是十六进制颜色字符串。

| 键 | 描述 | 默认值（`default` 皮肤） |
|-----|-------------|--------------------------|
| `banner_border` | 启动横幅周围的面板边框 | `#CD7F32` (青铜色) |
| `banner_title` | 横幅中的标题文本颜色 | `#FFD700` (金色) |
| `banner_accent` | 横幅中的部分标题（可用工具等） | `#FFBF00` (琥珀色) |
| `banner_dim` | 横幅中的柔和文本（分隔符、次要标签） | `#B8860B` (深金黄色) |
| `banner_text` | 横幅中的主体文本（工具名称、技能名称） | `#FFF8DC` (米色) |
| `ui_accent` | 通用 UI 强调色（高亮、活动元素） | `#FFBF00` |
| `ui_label` | UI 标签和标记 | `#4dd0e1` (青色) |
| `ui_ok` | 成功指示器（对勾、完成） | `#4caf50` (绿色) |
| `ui_error` | 错误指示器（失败、阻止） | `#ef5350` (红色) |
| `ui_warn` | 警告指示器（注意、确认提示） | `#ffa726` (橙色) |
| `prompt` | 交互式提示文本颜色 | `#FFF8DC` |
| `input_rule` | 输入区域上方的水平线 | `#CD7F32` |
| `response_border` | 代理响应框周围的边框（ANSI 转义） | `#FFD700` |
| `session_label` | 会话标签颜色 | `#DAA520` |
| `session_border` | 会话 ID 柔和边框颜色 | `#8B8682` |
| `status_bar_bg` | TUI 状态/使用栏的背景颜色 | `#1a1a2e` |
| `voice_status_bg` | 语音模式状态徽章的背景颜色 | `#1a1a2e` |
| `completion_menu_bg` | 补全菜单列表的背景颜色 | `#1a1a2e` |
| `completion_menu_current_bg` | 活动补全行的背景颜色 | `#333355` |
| `completion_menu_meta_bg` | 补全元数据列的背景颜色 | `#1a1a2e` |
| `completion_menu_meta_current_bg` | 活动补全元数据列的背景颜色 | `#333355` |

### 加载动画（Spinner）（`spinner:`）

控制等待 API 响应时显示的动画加载图案。

| 键 | 类型 | 描述 | 示例 |
|-----|------|-------------|---------|
| `waiting_faces` | 字符串列表 | 等待 API 响应时循环显示的图案 | `["(⚔)", "(⛨)", "(▲)"]` |
| `thinking_faces` | 字符串列表 | 模型推理过程中循环显示的图案 | `["(⚔)", "(⌁)", "(<>)"]` |
| `thinking_verbs` | 字符串列表 | 加载动画消息中显示的动词 | `["forging", "plotting", "hammering plans"]` |
| `wings` | [左, 右] 对列表 | 加载动画周围的装饰性括号 | `[["⟪⚔", "⚔⟫"], ["⟪▲", "▲⟫"]]` |

当加载动画值为空时（如 `default` 和 `mono`），将使用 `display.py` 中的硬编码默认值。

### 品牌（`branding:`）

在整个 CLI 界面中使用的文本字符串。

| 键 | 描述 | 默认值 |
|-----|-------------|---------|
| `agent_name` | 横幅标题和状态显示中显示的名称 | `Hermes Agent` |
| `welcome` | CLI 启动时显示的欢迎消息 | `Welcome to Hermes Agent! Type your message or /help for commands.` |
| `goodbye` | 退出时显示的消息 | `Goodbye! ⚕` |
| `response_label` | 响应框标题上的标签 | ` ⚕ Hermes ` |
| `prompt_symbol` | 用户输入提示符前的符号 | `❯ ` |
| `help_header` | `/help` 命令输出的标题文本 | `(^_^)? Available Commands` |

### 其他顶级键

| 键 | 类型 | 描述 | 默认值 |
|-----|------|-------------|---------|
| `tool_prefix` | 字符串 | 附加到 CLI 中工具输出行的前缀字符 | `┊` |
| `tool_emojis` | 字典 | 每个工具的加载动画和进度条的表情符号覆盖（`{工具名: 表情}`) | `{}` |
| `banner_logo` | 字符串 | 丰富的标记 ASCII 艺术标志（替换默认的 HERMES_AGENT 横幅） | `""` |
| `banner_hero` | 字符串 | 丰富的标记英雄艺术（替换默认的司根神杖艺术） | `""` |

## 自定义皮肤

在 `~/.hermes/skins/` 下创建 YAML 文件。用户皮肤会继承内置 `default` 皮肤中缺失的值，因此您只需要指定想要更改的键即可。

### 完整自定义皮肤 YAML 模板

```yaml
# ~/.hermes/skins/mytheme.yaml
# 完整皮肤模板 — 显示所有键。您不需要的键可以删除；
# 缺失的值会自动从 'default' 皮肤继承。

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
    - "processing"
    - "analyzing"
    - "computing"
    - "evaluating"
  wings:
    - ["⟪⚡", "⚡⟫"]
    - ["⟪●", "●⟫"]

branding:
  agent_name: "My Agent"
  welcome: "Welcome to My Agent! Type your message or /help for commands."
  goodbye: "See you later! ⚡"
  response_label: " ⚡ My Agent "
  prompt_symbol: "⚡ ❯ "
  help_header: "(⚡) Available Commands"

tool_prefix: "┊"

# 每个工具的表情符号覆盖（可选）
tool_emojis:
  terminal: "⚔"
  web_search: "🔮"
  read_file: "📄"

# 自定义 ASCII 艺术横幅（可选，支持富标记）
# banner_logo: |
#   [bold #FFD700] MY AGENT [/]
# banner_hero: |
#   [#FFD700]  Custom art here  [/]
```

### 极简自定义皮肤示例

由于所有内容都继承自 `default`，极简皮肤只需要更改不同的部分：

```yaml
name: cyberpunk
description: 霓虹终端主题

colors:
  banner_border: "#FF00FF"
  banner_title: "#00FFFF"
  banner_accent: "#FF1493"

spinner:
  thinking_verbs: ["jacking in", "decrypting", "uploading"]
  wings:
    - ["⟨⚡", "⚡⟩"]

branding:
  agent_name: "Cyber Agent"
  response_label: " ⚡ Cyber "

tool_prefix: "▏"
```

## Hermes Mod — 视觉皮肤编辑器

[Hermes Mod](https://github.com/cocktailpeanut/hermes-mod) 是一个社区构建的 Web UI，用于可视化创建和管理皮肤。您无需手动编写 YAML，即可获得一个点选编辑器和实时预览。

![Hermes Mod skin editor](https://raw.githubusercontent.com/cocktailpeanut/hermes-mod/master/nous.png)

**功能：**

- 列出所有内置和自定义皮肤
- 将任何皮肤打开到视觉编辑器，其中包含所有 Hermes 皮肤字段（颜色、加载动画、品牌、工具前缀、工具表情符号）
- 从文本提示生成 `banner_logo` 文本艺术
- 将上传的图像（PNG, JPG, GIF, WEBP）转换为带有多种渲染样式（盲文、ASCII 斜坡、块、点）的 `banner_hero` ASCII 艺术
- 直接保存到 `~/.hermes/skins/`
- 通过更新 `~/.hermes/config.yaml` 激活皮肤
- 显示生成的 YAML 和实时预览

### 安装

**选项 1 — Pinokio (一键式)：**

在 [pinokio.computer](https://pinokio.computer) 上查找并一键安装。

**选项 2 — npx (终端中最快)：**

```bash
npx -y hermes-mod
```

**选项 3 — 手动：**

```bash
git clone https://github.com/cocktailpeanut/hermes-mod.git
cd hermes-mod/app
npm install
npm start
```

### 用法

1. 启动应用（通过 Pinokio 或终端）。
2. 打开 **皮肤工作室（Skin Studio）**。
3. 选择一个内置或自定义皮肤进行编辑。
4. 从文本生成标志，和/或上传图像用于英雄艺术。选择渲染样式和宽度。
5. 编辑颜色、加载动画、品牌和其他字段。
6. 点击 **保存（Save）** 将皮肤 YAML 写入 `~/.hermes/skins/`。
7. 点击 **激活（Activate）** 将其设置为当前皮肤（更新 `config.yaml` 中的 `display.skin`）。

Hermes Mod 尊重 `HERMES_HOME` 环境变量，因此它也适用于 [配置文件（profiles）](/docs/user-guide/profiles)。

## 操作注意事项

- 内置皮肤从 `hermes_cli/skin_engine.py` 加载。
- 未知皮肤会自动回退到 `default`。
- `/skin` 会立即为当前会话更新活动的 CLI 主题。
- `~/.hermes/skins/` 中的用户皮肤具有比同名内置皮肤更高的优先级。
- 通过 `/skin` 更改的皮肤仅对当前会话有效。要将其设为永久默认，请在 `config.yaml` 中设置。
- `banner_logo` 和 `banner_hero` 字段支持富控制台标记（例如：`[bold #FF0000]text[/]`）用于彩色 ASCII 艺术。