---
title: "Petdex — 安装和选择用于 Hermes 的动画 petdex 吉祥物"
sidebar_label: "Petdex"
description: "安装并选择用于 Hermes 的动画 petdex 吉祥物"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Petdex

安装和选择用于 Hermes 的动画 petdex 吉祥物。

## Skill metadata

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/productivity/petdex` |
| Version | `1.0.0` |
| Author | Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `petdex`, `mascot`, `display`, `cli`, `tui`, `desktop` |

## Reference: full SKILL.md

:::info
以下是当此技能被触发时 Hermes 加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# Petdex Skill

浏览、安装和选择公共 [petdex](https://github.com/crafter-station/petdex) 库中的动画“宠物”吉祥物。已安装的宠物会响应智能体活动（空闲、运行工具、审阅、错误、完成）在 Hermes CLI、TUI 和桌面应用中的状态。此技能驱动着 `hermes pets` CLI 和 `display.pet` 配置——它不生成精灵图（sprites）。

## When to Use

- 用户需要一个桌面/终端吉祥物，或询问“宠物”/petdex。
- 用户希望更改、预览或禁用活动的宠物。
- 诊断宠物未显示的原因（终端图形支持，配置）。

## Prerequisites

- 对 `petdex.dev` 的网络访问权限，用于图库/清单（只读，无需认证）。
- Pillow（Hermes 的核心依赖项）用于精灵图解码——已安装。
- 要实现完整的终端渲染：需要一个具有图形能力的终端（kitty, Ghostty, WezTerm, iTerm2 或 sixel）。否则会自动使用真彩色 Unicode 半块备用方案。

## How to Run

使用 `terminal` 工具运行 `hermes pets <subcommand>`。

## Quick Reference

| Goal | Command |
| --- | --- |
| 目标：浏览图库 | `hermes pets list` (可添加子字符串进行过滤: `hermes pets list cat`) |
| 目标：列出已安装的宠物 | `hermes pets list --installed` |
| 目标：安装一个宠物 | `hermes pets install <slug>` (添加 `--select` 可使其激活) |
| 目标：设置活动的宠物 | `hermes pets select <slug>` (省略 slug 则显示选择器) |
| 目标：在所有地方调整宠物的尺寸 | `hermes pets scale <factor>` (例如 `0.5`，限制在 0.1–3.0) |
| 目标：在终端中预览/动画 | `hermes pets show [slug] [--cycle] [--state run]` |
| 目标：禁用宠物 | `hermes pets off` |
| 目标：移除一个宠物 | `hermes pets remove <slug>` |
| 目标：诊断设置 | `hermes pets doctor` |

## Procedure

1. 查找宠物：运行 `hermes pets list <query>` 并记下其 `slug`。
2. 安装 + 激活：运行 `hermes pets install <slug> --select`。
3. 预览它：运行 `hermes pets show` (Ctrl+C 可停止)。
4. 确认设置：运行 `hermes pets doctor` —— 它会显示已解析的宠物、配置的渲染模式、检测到的终端图形协议和有效模式。

宠物安装到 `<HERMES_HOME>/pets/<slug>/`（感知配置文件）。选择一个宠物会将 `display.pet.slug` + `display.pet.enabled` 写入 `config.yaml`。

## Configuration

在 `config.yaml` 的 `display.pet` 下：

- `enabled` (bool) — 主开关。
- `slug` (str) — 活动宠物；为空则为第一个已安装的宠物。
- `render_mode` — `auto` (检测) | `kitty` | `iterm` | `sixel` | `unicode` | `off`。
- `scale` (float) — 原生 192×208 帧在屏幕上的尺寸（默认 0.33，限制在 0.1–3.0）。一个旋钮可以调整所有界面的大小；使用 `hermes pets scale <factor>`、`/pet scale` 斜杠命令或桌面外观滑块进行设置。
- `unicode_cols` (int) — Unicode 备用方案的列数。

## Pitfalls

- 只有当一个宠物被安装和选择（`enabled: true`）后，它才会显示。
- 在管道/重定向（无 TTY）中，渲染功能是故意禁用状态。
- petdex npm CLI 安装到 `~/.codex/pets`；而 Hermes 使用其自己的配置文件范围的 `<HERMES_HOME>/pets/` —— 请通过 `hermes pets` 进行安装。

## Verification

- 当一个宠物被安装、选择、启用且 Pillow 可导入时，`hermes pets doctor` 会报告 `✓ ready`。