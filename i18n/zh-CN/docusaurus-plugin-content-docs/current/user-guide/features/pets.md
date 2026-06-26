---
sidebar_position: 11
title: "Pets (Petdex Mascots)"
description: "Adopt an animated mascot that reacts to agent activity across the CLI, TUI, and desktop app"
---

# Pets

Hermes 可以展示一个动画**宠物**——一个小吉祥物精灵，它会根据智能体在 **CLI**、**TUI** 和**桌面应用**中的行为（空闲、运行工具、思考中、完成、失败）做出反应。宠物来自公开的 [petdex](https://github.com/crafter-station/petdex) 画廊。

宠物纯粹是装饰性的。它们**不影响提示缓存、token 或智能体的行为**——精灵仅供展示。该功能**默认关闭**，在你安装并选择宠物之前不会激活。

## 工作原理

- 宠物安装到你的配置文件 `pets/` 目录
  （`<HERMES_HOME>/pets/<slug>/`），因此每个[配置文件](../profiles.md)都保留
  自己的集合。
- 选择宠物会将 `display.pet.slug` 和 `display.pet.enabled` 写入
  `config.yaml`——不会将任何内容存储为密钥或环境变量。
- 每个界面监视它已追踪的活动，并将其映射到六种动画状态之一。映射集中在一处，
  确保每个界面行为一致：

  | 智能体活动 | 宠物状态 |
  | --- | --- |
  | 工具/轮次刚刚失败 | `failed` |
  | 计划完成（所有待办事项已完成） | `jump`（庆祝） |
  | 轮次正常完成 | `wave` |
  | 工具正在执行 | `run` |
  | 模型正在思考/阅读 | `review` |
  | 轮次进行中（未指定） | `run` |
  | 等待你（澄清/审批提示已打开） | `waiting`（在传统 8 行表上回退为 `idle`） |
  | 无活动 | `idle` |

## 渲染

在终端（CLI/TUI）中，当你的终端支持图形协议（**kitty**、**Ghostty**、**WezTerm**、**iTerm2** 或 **sixel**）时，Hermes 以全保真度渲染精灵。否则自动回退到 truecolor Unicode**半块字符**渲染。在管道或重定向（无 TTY）中，终端渲染按设计被禁用。

桌面应用在画布上将宠物绘制为浮动精灵，可从**设置 → 外观**切换。

## 快速开始（CLI）

```bash
# 浏览画廊（按子字符串过滤）
hermes pets list
hermes pets list cat

# 安装宠物并一步激活
hermes pets install boba --select

# 在你的终端中预览/动画（Ctrl+C 停止）
hermes pets show

# 检查你的设置
hermes pets doctor
```

## `hermes pets` 命令

| 目标 | 命令 |
| --- | --- |
| 浏览画廊 | `hermes pets list [query] [--limit N]` |
| 列出已安装的宠物 | `hermes pets list --installed` |
| 安装宠物 | `hermes pets install <slug> [--select] [--force]` |
| 设置活动宠物 | `hermes pets select [slug]`（省略 slug 则弹出选择器） |
| 全局调整宠物大小 | `hermes pets scale <factor>`（例如 `0.5`，范围限制 0.1–3.0） |
| 预览/动画 | `hermes pets show [slug] [--state <s>] [--cycle] [--once] [--mode <m>] [--scale <f>]` |
| 禁用宠物 | `hermes pets off` |
| 移除已安装的宠物 | `hermes pets remove <slug>` |
| 诊断设置 | `hermes pets doctor` |

`hermes pets show` 标志：

- `--state` — 播放单一状态（`idle`、`wave`、`run`、`failed`、`review`、`jump`）。
- `--cycle` — 循环播放所有状态。
- `--once` — 播放一次而非循环。
- `--mode` — 覆盖渲染协议（`kitty`、`iterm`、`sixel`、`unicode`、`auto`）。
- `--scale` — 覆盖屏幕上的缩放比例（`0` = 使用配置值）。

## `/pet` 斜杠命令

在 CLI 和 TUI 中，你可以不离开会话就管理宠物：

- `/pet` — 切换宠物开/关（如果没有已激活的宠物则采用第一个已安装的）。
- `/pet list` — 浏览画廊。
- `/pet scale <factor>` — 全局调整宠物大小（例如 `/pet scale 0.5`）。
- `/pet <slug>` — 采用特定宠物。
- `/pet off` — 禁用宠物。

在 TUI 中，`/pet list` 会打开交互式选择器覆盖层；在桌面应用中，它会打开 Cmd+K 宠物面板。

## 桌面应用

在你可以通过两种方式管理宠物：

- **Cmd+K → "Pets…"** — 浏览、搜索、采用和切换宠物，无需离开键盘（与主题选择器类似）。
- **设置 → 外观** — 相同的画廊加上**大小滑块**，拖动时可实时调整浮动吉祥物的大小。

两者都会在原地采用/切换/调整浮动吉祥物的大小——大小变化立即生效；采用新宠物后会在片刻内点亮。

### 弹出覆盖层

**Shift-点击**浮动宠物，将其弹出到独立的透明、始终置顶的桌面窗口中。在那里，即使 Hermes 最小化（Codex 风格），它仍然可见，因此一眼就能看出智能体在做什么。

弹出后的手势：

| 手势 | 操作 |
| --- | --- |
| **拖动** | 将宠物移动到屏幕任意位置，甚至应用之外。其位置和进出状态在重启后保留。 |
| **单击** | 打开小型编辑器向最近的会话发送提示——无需打开应用。 |
| **双击** | 切换应用窗口：如果在前台则最小化，如果隐藏则恢复。 |
| **Shift-点击** | 将宠物弹回窗口内。 |
| **邮件图标** | 仅当在你离开时轮次完成才会出现；点击后在最近的线程上打开应用（并标记为已读）。 |

只有弹出的宠物会显示**对话气泡**（`working…`、`thinking…`、`your turn`……）——在窗口内，应用本身就是界面，因此宠物保持安静。

覆盖层是应用中宠物的纯傀儡——它没有独立的网关连接，也不会出现在 Dock 或应用切换器中。

## 配置

所有设置位于 `config.yaml` 中的 `display.pet` 下：

```yaml
display:
  pet:
    enabled: false        # 主开关（选择宠物后为 true）
    slug: ""              # 活动宠物；空 = 第一个已安装的
    render_mode: auto      # auto | kitty | iterm | sixel | unicode | off
    scale: 0.33           # 主大小旋钮（相对于原生 192x208 帧）
    unicode_cols: 0       # 终端宽度的硬覆盖（0 = 从 scale 推导）
```

- **`scale`** 是单一主大小旋钮。一个数字缩小所有界面：
  桌面画布按此比例缩放其像素，CLI/TUI 从中推导终端列宽。半块字符回退会限制在可读性下限——
  它无法像真正的 kitty/GUI 像素渲染那样缩小而不变得模糊，因此相同的 `scale` 在 kitty 下看起来清晰，
  但在半块字符中会被限制。
- **`render_mode: auto`** 自动检测 kitty/iTerm2/sixel 并回退到 unicode 半块字符。
  显式设置可强制使用特定协议，或设为 `off` 以禁用终端渲染同时保留桌面上的宠物。
- **`unicode_cols`** 独立于 `scale` 固定终端列宽；保留为 `0` 可从 `scale` 推导宽度。

## 故障排除

运行 `hermes pets doctor`——它会报告：

- 宠物目录及已安装的宠物，
- `display.pet.enabled`、`display.pet.slug` 及解析后的活动宠物，
- 配置的 `render_mode`、检测到的终端图形协议以及 TTY 的有效模式，
- Pillow（用于精灵解码）是否可导入。

一旦宠物已安装、已选择、已启用且 Pillow 可用，它会打印 `✓ ready`。

常见陷阱：

- 宠物只有在**已安装且已选择**（`enabled: true`）后才会显示。
- 在管道/重定向（无 TTY）中，终端渲染按设计被禁用。
- petdex npm CLI 安装到 `~/.codex/pets`；Hermes 使用其自己的配置文件作用域
  `<HERMES_HOME>/pets/`——请通过 `hermes pets` 安装。

## 另请参阅

- [`petdex` 技能](../skills/bundled/productivity/productivity-petdex.md)
  让智能体按需为你安装和切换宠物。