---
title: "Openhue — 通过 OpenHue CLI 控制飞利浦 Hue 灯、房间和场景"
sidebar_label: "Openhue"
description: "通过 OpenHue CLI 控制飞利浦 Hue 灯、房间和场景"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Openhue

通过 OpenHue CLI 控制飞利浦 Hue 灯、房间和场景。开关灯、调节亮度、颜色、色温以及激活场景。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/smart-home/openhue` |
| 版本 | `1.0.0` |
| 作者 | 社区 |
| 许可证 | MIT |
| 标签 | `智能家居`, `Hue`, `灯光`, `物联网`, `自动化` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是当技能激活时智能体看到的指令。
:::

# OpenHue CLI

通过终端从 Hue 桥接器控制飞利浦 Hue 灯和场景。

## 先决条件

```bash
# Linux（预编译二进制文件）
curl -sL https://github.com/openhue/openhue-cli/releases/latest/download/openhue-linux-amd64 -o ~/.local/bin/openhue && chmod +x ~/.local/bin/openhue

# macOS
brew install openhue/cli/openhue-cli
```

首次运行需要按下 Hue 桥接器上的按钮进行配对。桥接器必须与运行 Hermes 的机器处于同一本地网络。

## 使用时机

- “打开/关闭灯光”
- “调暗客厅灯光”
- “设置场景”或“电影模式”
- 控制特定的 Hue 房间、区域或单个灯泡
- 调节亮度、颜色或色温

## 常用命令

### 列出资源

```bash
openhue get light       # 列出所有灯
openhue get room        # 列出所有房间
openhue get scene       # 列出所有场景
```

### 控制灯光

```bash
# 打开/关闭
openhue set light "Bedroom Lamp" --on
openhue set light "Bedroom Lamp" --off

# 亮度 (0-100)
openhue set light "Bedroom Lamp" --on --brightness 50

# 色温 (暖到冷: 153-500 毫开尔文)
openhue set light "Bedroom Lamp" --on --temperature 300

# 颜色 (按名称或十六进制)
openhue set light "Bedroom Lamp" --on --color red
openhue set light "Bedroom Lamp" --on --rgb "#FF5500"
```

### 控制房间

```bash
# 关闭整个房间
openhue set room "Bedroom" --off

# 设置房间亮度
openhue set room "Bedroom" --on --brightness 30
```

### 场景

```bash
openhue set scene "Relax" --room "Bedroom"
openhue set scene "Concentrate" --room "Office"
```

## 快速预设

```bash
# 就寝时间 (昏暗暖光)
openhue set room "Bedroom" --on --brightness 20 --temperature 450

# 工作模式 (明亮冷光)
openhue set room "Office" --on --brightness 100 --temperature 250

# 电影模式 (昏暗)
openhue set room "Living Room" --on --brightness 10

# 全部关闭
openhue set room "Bedroom" --off
openhue set room "Office" --off
openhue set room "Living Room" --off
```

## 注意事项

- 桥接器必须与运行 Hermes 的机器处于同一本地网络
- 首次运行需要物理按下 Hue 桥接器上的按钮进行授权
- 颜色功能仅适用于支持颜色的灯泡（非仅白色型号）
- 灯和房间名称区分大小写 — 使用 `openhue get light` 检查确切名称
- 非常适合与 cron 作业结合使用以实现定时照明（例如，就寝时调暗，醒来时调亮）