---
title: "Openhue — 通过 OpenHue CLI 控制飞利浦 Hue 灯光、场景、房间"
sidebar_label: "Openhue"
description: "通过 OpenHue CLI 控制飞利浦 Hue 灯光、场景、房间"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Openhue

通过 OpenHue CLI 控制飞利浦 Hue 灯光、场景、房间。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/smart-home/openhue` |
| 版本 | `1.0.0` |
| 作者 | 社区 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `智能家居`, `Hue`, `灯光`, `物联网`, `自动化` |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体所看到的指令。
:::

# OpenHue CLI

通过终端，经由 Hue 桥接器控制飞利浦 Hue 灯光和场景。

## 先决条件

```bash
# Linux (预编译二进制文件)
curl -sL https://github.com/openhue/openhue-cli/releases/latest/download/openhue-linux-amd64 -o ~/.local/bin/openhue && chmod +x ~/.local/bin/openhue

# macOS
brew install openhue/cli/openhue-cli
```

首次运行需要按下 Hue 桥接器上的按钮进行配对。桥接器必须位于同一本地网络。

## 适用场景

- "打开/关闭灯"
- "调暗客厅的灯"
- "设置一个场景" 或 "影院模式"
- 控制特定的 Hue 房间、区域或单个灯泡
- 调整亮度、颜色或色温

## 常用命令

### 列出资源

```bash
openhue get light       # 列出所有灯光
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

# 色温 (暖到冷: 153-500 mirek)
openhue set light "Bedroom Lamp" --on --temperature 300

# 颜色 (通过名称或十六进制)
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

## 快捷预设

```bash
# 睡前模式 (调暗，暖色)
openhue set room "Bedroom" --on --brightness 20 --temperature 450

# 工作模式 (明亮，冷色)
openhue set room "Office" --on --brightness 100 --temperature 250

# 影院模式 (调暗)
openhue set room "Living Room" --on --brightness 10

# 关闭所有
openhue set room "Bedroom" --off
openhue set room "Office" --off
openhue set room "Living Room" --off
```

## 备注

- 桥接器必须与运行 Hermes 的机器位于同一本地网络
- 首次运行需要物理按下 Hue 桥接器上的按钮进行授权
- 颜色功能仅适用于支持色彩的灯泡（不适用于纯白色型号）
- 灯光和房间名称区分大小写 — 请使用 `openhue get light` 来查看准确名称
- 非常适合与定时任务配合使用，实现定时照明（例如，睡前调暗，醒来时调亮）