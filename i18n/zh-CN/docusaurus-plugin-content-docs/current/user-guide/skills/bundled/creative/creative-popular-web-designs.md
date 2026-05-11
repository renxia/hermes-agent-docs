---
title: "热门网页设计 — 54个真实设计系统（Stripe、Linear、Vercel）的HTML/CSS实现"
sidebar_label: "热门网页设计"
description: "54个真实设计系统（Stripe、Linear、Vercel）的HTML/CSS实现"
---

{/* 此页面由网站脚本 `scripts/generate-skill-docs.py` 根据技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非本页面。 */}

# 热门网页设计

54个真实设计系统（Stripe、Linear、Vercel）的HTML/CSS实现。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/creative/popular-web-designs` |
| 版本 | `1.0.0` |
| 作者 | Hermes Agent + Teknium（设计系统源自 VoltAgent/awesome-design-md） |
| 许可证 | MIT |
| 支持平台 | linux, macos, windows |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# 流行网页设计

54 个现成的真实世界设计系统，可在生成 HTML/CSS 时使用。每个模板捕捉了一个
网站完整的视觉语言：色板、排版层级、组件样式、间距
系统、阴影、响应式行为，以及包含精确 CSS 值的实用智能体提示。

## 相关设计技能

- **`claude-design`** — 用于设计 *过程与品味*（定义范围、
  生成变体、验证本地 HTML 产物、避免 AI 设计的俗套）。
  当用户希望获得经过深思熟虑、以已知品牌风格设计的页面时，可与本技能配对使用：`claude-design` 驱动工作流，本技能提供
  视觉词汇。
- **`design-md`** — 当交付物是正式的 DESIGN.md 令牌规范
  文件，而非渲染的产物时使用。

## 如何使用

1. 从下方的目录中挑选一个设计
2. 加载它：`skill_view(name="popular-web-designs", file_path="templates/<site>.md")`
3. 在生成 HTML 时使用设计令牌和组件规范
4. 与 `generative-widgets` 技能配对使用，通过 cloudflared 隧道提供服务

每个模板顶部都包含一个 **Hermes 实现说明** 块，其中包含：
- CDN 字体替代品和 Google Fonts `<link>` 标签（可直接粘贴）
- 主要和等宽字体的 CSS font-family 栈
- 提醒使用 `write_file` 创建 HTML 并使用 `browser_vision` 进行验证

## HTML 生成模式

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title</title>
  <!-- 粘贴模板 Hermes 说明中的 Google Fonts <link> -->
  <link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
  <style>
    /* 将模板的色板应用为 CSS 自定义属性 */
    :root {
      --color-bg: #ffffff;
      --color-text: #171717;
      --color-accent: #533afd;
      /* ... 更多来自模板第 2 节 */
    }
    /* 应用模板第 3 节的排版 */
    body {
      font-family: 'Inter', system-ui, sans-serif;
      color: var(--color-text);
      background: var(--color-bg);
    }
    /* 应用模板第 4 节的组件样式 */
    /* 应用模板第 5 节的布局 */
    /* 应用模板第 6 节的阴影 */
  </style>
</head>
<body>
  <!-- 使用模板的组件规范构建 -->
</body>
</html>
```

使用 `write_file` 写入文件，通过 `generative-widgets` 工作流（cloudflared 隧道）提供服务，
并使用 `browser_vision` 验证结果，以确认视觉准确性。

## 字体替代参考

大多数网站使用通过 CDN 无法获得的专有字体。每个模板都映射到一个 Google Fonts
替代品，以保持设计的特性。常见映射：

| 专有字体 | CDN 替代品 | 特性 |
|---|---|---|
| Geist / Geist Sans | Geist（在 Google Fonts 上） | 几何形状，紧凑字距 |
| Geist Mono | Geist Mono（在 Google Fonts 上） | 清晰的等宽字体，连字 |
| sohne-var (Stripe) | Source Sans 3 | 轻盈优雅 |
| Berkeley Mono | JetBrains Mono | 技术等宽字体 |
| Airbnb Cereal VF | DM Sans | 圆润、友好的几何形状 |
| Circular (Spotify) | DM Sans | 几何形状，温暖 |
| figmaSans | Inter | 清晰的人文主义 |
| Pin Sans (Pinterest) | DM Sans | 友好、圆润 |
| NVIDIA-EMEA | Inter（或 Arial 系统） | 工业风，清晰 |
| CoinbaseDisplay/Sans | DM Sans | 几何形状，值得信赖 |
| UberMove | DM Sans | 粗体，紧凑 |
| HashiCorp Sans | Inter | 企业风，中性 |
| waldenburgNormal (Sanity) | Space Grotesk | 几何形状，略微压缩 |
| IBM Plex Sans/Mono | IBM Plex Sans/Mono | 可在 Google Fonts 上找到 |
| Rubik (Sentry) | Rubik | 可在 Google Fonts 上找到 |

当模板的 CDN 字体与原版（Inter、IBM Plex、Rubik、Geist）匹配时，不会
发生替代损失。当使用替代品（Circular 用 DM Sans，sohne-var 用 Source Sans 3）时，请紧密遵循模板的字重、大小和字间距值——
这些比具体的字体名称更能承载视觉特性。

## 设计目录

### 人工智能与机器学习

| 模板 | 网站 | 风格 |
|---|---|---|
| `claude.md` | Anthropic Claude | 温暖的赤陶色调强调，清晰的编辑布局 |
| `cohere.md` | Cohere | 充满活力的渐变，数据丰富的仪表盘美学 |
| `elevenlabs.md` | ElevenLabs | 暗黑电影感 UI，音频波形美学 |
| `minimax.md` | Minimax | 大胆的暗黑界面，带霓虹强调 |
| `mistral.ai.md` | Mistral AI | 法式工程极简主义，紫色调 |
| `ollama.md` | Ollama | 终端优先，单色简约 |
| `opencode.ai.md` | OpenCode AI | 面向开发者的暗色主题，全等宽字体 |
| `replicate.md` | Replicate | 干净的白色画布，代码优先 |
| `runwayml.md` | RunwayML | 电影感暗黑 UI，富媒体布局 |
| `together.ai.md` | Together AI | 技术性，蓝图风格设计 |
| `voltagent.md` | VoltAgent | 虚空黑画布，祖母绿强调，终端原生 |
| `x.ai.md` | xAI | 鲜明单色，未来感极简，全等宽字体 |

### 开发者工具与平台

| 模板 | 网站 | 风格 |
|---|---|---|
| `cursor.md` | Cursor | 光滑的暗黑界面，渐变强调 |
| `expo.md` | Expo | 暗色主题，紧凑字距，代码中心 |
| `linear.app.md` | Linear | 超级简约暗黑模式，精确，紫色强调 |
| `lovable.md` | Lovable | 活泼的渐变，友好的开发者美学 |
| `mintlify.md` | Mintlify | 清洁，绿色强调，阅读优化 |
| `posthog.md` | PostHog | 活泼的品牌形象，开发者友好的暗黑 UI |
| `raycast.md` | Raycast | 光滑的暗色铬面，充满活力的渐变强调 |
| `resend.md` | Resend | 简约暗黑主题，等宽字体强调 |
| `sentry.md` | Sentry | 暗色仪表盘，数据密集，粉紫色强调 |
| `supabase.md` | Supabase | 暗祖母绿主题，代码优先开发者工具 |
| `superhuman.md` | Superhuman | 高级暗黑 UI，键盘优先，紫色辉光 |
| `vercel.md` | Vercel | 黑白精确，Geist 字体系统 |
| `warp.md` | Warp | 类似 IDE 的暗黑界面，基于块的命令 UI |
| `zapier.md` | Zapier | 温暖的橙色，友好的插图驱动 |

### 基础设施与云

| 模板 | 网站 | 风格 |
|---|---|---|
| `clickhouse.md` | ClickHouse | 黄色强调，技术文档风格 |
| `composio.md` | Composio | 现代暗色，带彩色集成图标 |
| `hashicorp.md` | HashiCorp | 企业级简洁，黑白 |
| `mongodb.md` | MongoDB | 绿叶品牌标识，开发者文档重点 |
| `sanity.md` | Sanity | 红色强调，内容优先编辑布局 |
| `stripe.md` | Stripe | 标志性紫色渐变，300 字重优雅 |

### 设计与生产力

| 模板 | 网站 | 风格 |
|---|---|---|
| `airtable.md` | Airtable | 色彩丰富，友好，结构化数据美学 |
| `cal.md` | Cal.com | 干净的中性 UI，面向开发者的简约 |
| `clay.md` | Clay | 有机形状，柔和渐变，艺术指导布局 |
| `figma.md` | Figma | 充满活力的多彩，活泼而专业 |
| `framer.md` | Framer | 大胆的黑色和蓝色，动效优先，设计导向 |
| `intercom.md` | Intercom | 友好的蓝色调板，对话式 UI 模式 |
| `miro.md` | Miro | 明亮的黄色强调，无限画布美学 |
| `notion.md` | Notion | 温暖的极简主义，衬线标题，柔和表面 |
| `pinterest.md` | Pinterest | 红色强调，瀑布流网格，图像优先布局 |
| `webflow.md` | Webflow | 蓝色调强调，精良的营销网站美学 |

### 金融科技与加密货币

| 模板 | 网站 | 风格 |
|---|---|---|
| `coinbase.md` | Coinbase | 清晰的蓝色身份，注重信任，机构感 |
| `kraken.md` | Kraken | 紫色强调的暗黑 UI，数据密集仪表盘 |
| `revolut.md` | Revolut | 光滑的暗黑界面，渐变卡片，金融科技精度 |
| `wise.md` | Wise | 明亮的绿色强调，友好清晰 |

### 企业与消费者

| 模板 | 网站 | 风格 |
|---|---|---|
| `airbnb.md` | Airbnb | 温暖的珊瑚色强调，摄影驱动，圆润 UI |
| `apple.md` | Apple | 高级白色空间，SF Pro，电影感图像 |
| `bmw.md` | BMW | 暗黑高级表面，精确工程美学 |
| `ibm.md` | IBM | Carbon 设计系统，结构化蓝色调板 |
| `nvidia.md` | NVIDIA | 绿黑色能量，技术力量美学 |
| `spacex.md` | SpaceX | 鲜明黑白，满幅图像，未来感 |
| `spotify.md` | Spotify | 暗色背景上充满活力的绿色，粗体字，专辑封面驱动 |
| `uber.md` | Uber | 大胆黑白，紧凑字体，都市活力 |

## 选择设计

根据内容匹配设计：

- **开发者工具 / 仪表盘：** Linear、Vercel、Supabase、Raycast、Sentry
- **文档 / 内容网站：** Mintlify、Notion、Sanity、MongoDB
- **营销 / 落地页：** Stripe、Framer、Apple、SpaceX
- **暗黑模式 UI：** Linear、Cursor、ElevenLabs、Warp、Superhuman
- **明亮 / 清洁 UI：** Vercel、Stripe、Notion、Cal.com、Replicate
- **活泼 / 友好：** PostHog、Figma、Lovable、Zapier、Miro
- **高级 / 奢华：** Apple、BMW、Stripe、Superhuman、Revolut
- **数据密集 / 仪表盘：** Sentry、Kraken、Cohere、ClickHouse
- **等宽字体 / 终端美学：** Ollama、OpenCode、x.ai、VoltAgent