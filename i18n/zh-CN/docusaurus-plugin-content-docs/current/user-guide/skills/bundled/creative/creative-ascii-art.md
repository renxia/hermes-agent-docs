---
title: "ASCII 艺术 — ASCII 艺术：pyfiglet、cowsay、boxes、图片转ASCII"
sidebar_label: "ASCII 艺术"
description: "ASCII 艺术：pyfiglet、cowsay、boxes、图片转ASCII"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# ASCII 艺术

ASCII 艺术：pyfiglet、cowsay、boxes、图片转ASCII。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/creative/ascii-art` |
| 版本 | `4.0.0` |
| 作者 | 0xbyt4, Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `ASCII`, `艺术`, `横幅`, `创意`, `Unicode`, `文字艺术`, `pyfiglet`, `figlet`, `cowsay`, `boxes` |
| 相关技能 | [`excalidraw`](/docs/user-guide/skills/bundled/creative/creative-excalidraw) |

:::info
以下定义是 Hermes 在此技能被触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# ASCII 艺术技能

为不同的 ASCII 艺术需求提供多种工具。所有工具均为本地 CLI 程序或免费 REST API——无需 API 密钥。

## 工具 1：文本横幅 (pyfiglet — 本地)

将文本渲染为大型 ASCII 艺术横幅。内含 571 种内置字体。

### 设置

```bash
pip install pyfiglet --break-system-packages -q
```

### 用法

```bash
python3 -m pyfiglet "YOUR TEXT" -f slant
python3 -m pyfiglet "TEXT" -f doom -w 80    # 设置宽度
python3 -m pyfiglet --list_fonts             # 列出所有 571 种字体
```

### 推荐字体

| 风格 | 字体 | 最适合 |
|-------|------|----------|
| 简洁现代 | `slant` | 项目名称、标题 |
| 粗犷块状 | `doom` | 标题、标识 |
| 大号易读 | `big` | 横幅 |
| 经典横幅 | `banner3` | 宽幅显示 |
| 紧凑 | `small` | 副标题 |
| 赛博朋克 | `cyberlarge` | 科技主题 |
| 3D 效果 | `3-d` | 启动画面 |
| 哥特式 | `gothic` | 戏剧性文本 |

### 技巧

- 预览 2-3 种字体，让用户选择最喜欢的
- 短文本 (1-8 个字符) 最适合使用 `doom` 或 `block` 等详细字体
- 长文本更适合使用 `small` 或 `mini` 等紧凑字体

## 工具 2：文本横幅 (asciified API — 远程，无需安装)

免费的 REST API，可将文本转换为 ASCII 艺术。支持 250 多种 FIGlet 字体。直接返回纯文本——无需解析。当 pyfiglet 未安装或需要快速替代方案时使用此工具。

### 用法 (通过终端 curl)

```bash
# 基本文本横幅（默认字体）
curl -s "https://asciified.thelicato.io/api/v2/ascii?text=Hello+World"

# 使用特定字体
curl -s "https://asciified.thelicato.io/api/v2/ascii?text=Hello&font=Slant"
curl -s "https://asciified.thelicato.io/api/v2/ascii?text=Hello&font=Doom"
curl -s "https://asciified.thelicato.io/api/v2/ascii?text=Hello&font=Star+Wars"
curl -s "https://asciified.thelicato.io/api/v2/ascii?text=Hello&font=3-D"
curl -s "https://asciified.thelicato.io/api/v2/ascii?text=Hello&font=Banner3"

# 列出所有可用字体（返回 JSON 数组）
curl -s "https://asciified.thelicato.io/api/v2/fonts"
```

### 技巧

- 在文本参数中将空格 URL 编码为 `+`
- 响应是纯文本 ASCII 艺术——没有 JSON 包装，可直接显示
- 字体名称区分大小写；使用字体端点获取精确名称
- 任何有 curl 的终端都可以工作——无需 Python 或 pip

## 工具 3：Cowsay (消息艺术)

经典工具，将文本包裹在带有 ASCII 字符的对话气泡中。

### 设置

```bash
sudo apt install cowsay -y    # Debian/Ubuntu
# brew install cowsay         # macOS
```

### 用法

```bash
cowsay "Hello World"
cowsay -f tux "Linux rules"       # 企鹅 Tux
cowsay -f dragon "Rawr!"          # 龙
cowsay -f stegosaurus "Roar!"     # 剑龙
cowthink "Hmm..."                  # 思考气泡
cowsay -l                          # 列出所有字符
```

### 可用字符 (50+)

`beavis.zen`, `bong`, `bunny`, `cheese`, `daemon`, `default`, `dragon`,
`dragon-and-cow`, `elephant`, `eyes`, `flaming-skull`, `ghostbusters`,
`hellokitty`, `kiss`, `kitty`, `koala`, `luke-koala`, `mech-and-cow`,
`meow`, `moofasa`, `moose`, `ren`, `sheep`, `skeleton`, `small`,
`stegosaurus`, `stimpy`, `supermilker`, `surgery`, `three-eyes`,
`turkey`, `turtle`, `tux`, `udder`, `vader`, `vader-koala`, `www`

### 眼睛/舌头修饰符

```bash
cowsay -b "Borg"       # =_= 眼睛
cowsay -d "Dead"       # x_x 眼睛
cowsay -g "Greedy"     # $_$ 眼睛
cowsay -p "Paranoid"   # @_@ 眼睛
cowsay -s "Stoned"     # *_* 眼睛
cowsay -w "Wired"      # O_O 眼睛
cowsay -e "OO" "Msg"   # 自定义眼睛
cowsay -T "U " "Msg"   # 自定义舌头
```

## 工具 4：Boxes (装饰性边框)

为任何文本绘制装饰性 ASCII 艺术边框/框架。内含 70 多种内置设计。

### 设置

```bash
sudo apt install boxes -y    # Debian/Ubuntu
# brew install boxes         # macOS
```

### 用法

```bash
echo "Hello World" | boxes                    # 默认框
echo "Hello World" | boxes -d stone           # 石质边框
echo "Hello World" | boxes -d parchment       # 羊皮纸卷轴
echo "Hello World" | boxes -d cat             # 猫边框
echo "Hello World" | boxes -d dog             # 狗边框
echo "Hello World" | boxes -d unicornsay      # 独角兽
echo "Hello World" | boxes -d diamonds        # 钻石图案
echo "Hello World" | boxes -d c-cmt           # C 风格注释
echo "Hello World" | boxes -d html-cmt        # HTML 注释
echo "Hello World" | boxes -a c               # 文本居中
boxes -l                                       # 列出所有 70 多种设计
```

### 与 pyfiglet 或 asciified 结合使用

```bash
python3 -m pyfiglet "HERMES" -f slant | boxes -d stone
# 或者未安装 pyfiglet 时：
curl -s "https://asciified.thelicato.io/api/v2/ascii?text=HERMES&font=Slant" | boxes -d stone
```

## 工具 5：TOIlet (彩色文本艺术)

类似于 pyfiglet，但具有 ANSI 颜色效果和视觉滤镜。非常适合终端视觉效果。

### 设置

```bash
sudo apt install toilet toilet-fonts -y    # Debian/Ubuntu
# brew install toilet                      # macOS
```

### 用法

```bash
toilet "Hello World"                    # 基本文本艺术
toilet -f bigmono12 "Hello"            # 特定字体
toilet --gay "Rainbow!"                 # 彩虹着色
toilet --metal "Metal!"                 # 金属效果
toilet -F border "Bordered"             # 添加边框
toilet -F border --gay "Fancy!"         # 组合效果
toilet -f pagga "Block"                 # 块状字体（toilet 独有）
toilet -F list                          # 列出可用滤镜
```

### 滤镜

`crop`, `gay` (彩虹), `metal`, `flip`, `flop`, `180`, `left`, `right`, `border`

**注意**：toilet 输出 ANSI 颜色转义码——适用于终端，但在所有上下文中可能无法渲染（例如，纯文本文件、某些聊天平台）。

## 工具 6：图像转 ASCII 艺术

将图像 (PNG, JPEG, GIF, WEBP) 转换为 ASCII 艺术。

### 选项 A：ascii-image-converter (推荐，现代)

```bash
# 安装
sudo snap install ascii-image-converter
# 或者：go install github.com/TheZoraiz/ascii-image-converter@latest
```

```bash
ascii-image-converter image.png                  # 基础
ascii-image-converter image.png -C               # 彩色输出
ascii-image-converter image.png -d 60,30         # 设置尺寸
ascii-image-converter image.png -b               # 盲文字符
ascii-image-converter image.png -n               # 负片/反转
ascii-image-converter https://url/image.jpg      # 直接 URL
ascii-image-converter image.png --save-txt out   # 保存为文本
```

### 选项 B：jp2a (轻量级，仅限 JPEG)

```bash
sudo apt install jp2a -y
jp2a --width=80 image.jpg
jp2a --colors image.jpg              # 彩色化
```

## 工具 7：搜索预制 ASCII 艺术

从网络搜索精选的 ASCII 艺术。使用 `terminal` 配合 `curl`。

### 来源 A：ascii.co.uk (推荐用于预制艺术)

按主题组织的经典 ASCII 艺术大型收藏。艺术作品位于 HTML `<pre>` 标签内。使用 curl 获取页面，然后用一小段 Python 代码提取艺术作品。

**URL 模式：** `https://ascii.co.uk/art/{subject}`

**步骤 1 — 获取页面：**

```bash
curl -s 'https://ascii.co.uk/art/cat' -o /tmp/ascii_art.html
```

**步骤 2 — 从 pre 标签提取艺术作品：**

```python
import re, html
with open('/tmp/ascii_art.html') as f:
    text = f.read()
arts = re.findall(r'<pre[^>]*>(.*?)</pre>', text, re.DOTALL)
for art in arts:
    clean = re.sub(r'<[^>]+>', '', art)
    clean = html.unescape(clean).strip()
    if len(clean) > 30:
        print(clean)
        print('\n---\n')
```

**可用主题** (用作 URL 路径)：
- 动物：`cat`, `dog`, `horse`, `bird`, `fish`, `dragon`, `snake`, `rabbit`, `elephant`, `dolphin`, `butterfly`, `owl`, `wolf`, `bear`, `penguin`, `turtle`
- 物体：`car`, `ship`, `airplane`, `rocket`, `guitar`, `computer`, `coffee`, `beer`, `cake`, `house`, `castle`, `sword`, `crown`, `key`
- 自然：`tree`, `flower`, `sun`, `moon`, `star`, `mountain`, `ocean`, `rainbow`
- 角色：`skull`, `robot`, `angel`, `wizard`, `pirate`, `ninja`, `alien`
- 节日：`christmas`, `halloween`, `valentine`

**技巧：**
- 保留艺术家签名/首字母——重要的礼仪
- 每页多件艺术作品——为用户选择最好的
- 通过 curl 可靠工作，无需 JavaScript

### 来源 B：GitHub Octocat API (有趣的彩蛋)

返回带有智慧语录的随机 GitHub Octocat。无需认证。

```bash
curl -s https://api.github.com/octocat
```

## 工具 8：有趣的 ASCII 实用程序 (通过 curl)

这些免费服务直接返回 ASCII 艺术——非常适合有趣的附加内容。

### QR 码作为 ASCII 艺术

```bash
curl -s "qrenco.de/Hello+World"
curl -s "qrenco.de/https://example.com"
```

### 天气作为 ASCII 艺术

```bash
curl -s "wttr.in/London"          # 完整的天气报告，带有 ASCII 图形
curl -s "wttr.in/Moon"            # ASCII 艺术的月相
curl -s "v2.wttr.in/London"       # 详细版本
```

## 工具 9：LLM 生成的自定义艺术 (备用方案)

当上述工具没有所需内容时，使用以下 Unicode 字符直接生成 ASCII 艺术：

### 字符库

**制表符：** `╔ ╗ ╚ ╝ ║ ═ ╠ ╣ ╦ ╩ ╬ ┌ ┐ └ ┘ │ ─ ├ ┤ ┬ ┴ ┼ ╭ ╮ ╰ ╯`

**块元素：** `░ ▒ ▓ █ ▄ ▀ ▌ ▐ ▖ ▗ ▘ ▝ ▚ ▞`

**几何与符号：** `◆ ◇ ◈ ● ○ ◉ ■ □ ▲ △ ▼ ▽ ★ ☆ ✦ ✧ ◀ ▶ ◁ ▷ ⬡ ⬢ ⌂`

### 规则

- 最大宽度：每行 60 个字符（终端安全）
- 最大高度：横幅 15 行，场景 25 行
- 仅限等宽字体：输出必须在固定宽度字体中正确渲染

## 决策流程

1. **以横幅形式呈现文本** → 若已安装则使用 pyfiglet，否则通过 curl 调用 asciified API
2. **用有趣的字符艺术包装消息** → cowsay
3. **添加装饰性边框/框架** → boxes（可与 pyfiglet/asciified 结合使用）
4. **绘制特定事物**（猫、火箭、龙）→ 通过 curl + 解析访问 ascii.co.uk
5. **将图像转换为 ASCII** → ascii-image-converter 或 jp2a
6. **二维码** → 通过 curl 访问 qrenco.de
7. **天气/月亮艺术** → 通过 curl 访问 wttr.in
8. **自定义/创意内容** → 使用 Unicode 调色板进行 LLM 生成
9. **任何未安装的工具** → 安装它，或回退到下一个选项