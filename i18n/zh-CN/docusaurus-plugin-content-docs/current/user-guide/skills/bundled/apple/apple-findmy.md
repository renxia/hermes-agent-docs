---
title: "Findmy — 通过“查找”追踪 Apple 设备和 AirTag"
sidebar_label: "Findmy"
description: "通过“查找”追踪 Apple 设备和 AirTag"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Findmy

通过 AppleScript 和屏幕截图在 macOS 上使用“查找”应用追踪 Apple 设备和 AirTag。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/apple/findmy` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | macos |
| 标签 | `查找`, `AirTag`, `位置`, `追踪`, `macOS`, `Apple` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 查找（Apple）

通过 macOS 上的“查找”应用追踪 Apple 设备和 AirTag。由于 Apple 没有为“查找”提供命令行界面，此技能使用 AppleScript 打开应用，并通过屏幕截图读取设备位置。

## 先决条件

- 已登录 iCloud 且安装了“查找”应用的 **macOS**
- 设备/AirTag 已在“查找”中注册
- 终端具有屏幕录制权限（系统设置 → 隐私与安全性 → 屏幕录制）
- **可选但推荐**：安装 `peekaboo` 以获得更好的 UI 自动化：
  `brew install steipete/tap/peekaboo`

## 何时使用

- 用户询问“我的[设备/猫/钥匙/包]在哪里？”
- 追踪 AirTag 位置
- 检查设备位置（iPhone、iPad、Mac、AirPods）
- 随时间监控宠物或物品移动（AirTag 巡逻路线）

## 方法 1：AppleScript + 屏幕截图（基础）

### 打开“查找”并导航

```bash
# 打开“查找”应用
osascript -e 'tell application "FindMy" to activate'

# 等待加载
sleep 3

# 截取“查找”窗口的屏幕截图
screencapture -w -o /tmp/findmy.png
```

然后使用 `vision_analyze` 读取屏幕截图：
```
vision_analyze(image_url="/tmp/findmy.png", question="显示了哪些设备/物品，它们的位置是什么？")
```

### 切换标签页

```bash
# 切换到“设备”标签页
osascript -e '
tell application "System Events"
    tell process "FindMy"
        click button "Devices" of toolbar 1 of window 1
    end tell
end tell'

# 切换到“物品”标签页（AirTag）
osascript -e '
tell application "System Events"
    tell process "FindMy"
        click button "Items" of toolbar 1 of window 1
    end tell
end tell'
```

## 方法 2：Peekaboo UI 自动化（推荐）

如果已安装 `peekaboo`，请使用它进行更可靠的 UI 交互：

```bash
# 打开“查找”
osascript -e 'tell application "FindMy" to activate'
sleep 3

# 捕获并标注 UI
peekaboo see --app "FindMy" --annotate --path /tmp/findmy-ui.png

# 通过元素 ID 点击特定设备/物品
peekaboo click --on B3 --app "FindMy"

# 捕获详情视图
peekaboo image --app "FindMy" --path /tmp/findmy-detail.png
```

然后使用视觉分析：
```
vision_analyze(image_url="/tmp/findmy-detail.png", question="此设备/物品显示的位置是什么？如果可见，请包含地址和坐标。")
```

## 工作流程：随时间追踪 AirTag 位置

为了监控 AirTag（例如，追踪猫的巡逻路线）：

```bash
# 1. 打开“查找”至“物品”标签页
osascript -e 'tell application "FindMy" to activate'
sleep 3

# 2. 点击 AirTag 物品（保持在页面 — AirTag 仅在页面打开时更新）

# 3. 定期捕获位置
while true; do
    screencapture -w -o /tmp/findmy-$(date +%H%M%S).png
    sleep 300  # 每 5 分钟
done
```

使用视觉分析每个屏幕截图以提取坐标，然后编译路线。

## 局限性

- “查找”**没有命令行界面或 API** — 必须使用 UI 自动化
- AirTag 仅在“查找”页面处于活动显示状态时更新位置
- 位置精度取决于“查找”网络中附近的 Apple 设备
- 屏幕截图需要屏幕录制权限
- AppleScript UI 自动化可能在不同 macOS 版本间失效

## 规则

1. 追踪 AirTag 时保持“查找”应用在前台（最小化时更新停止）
2. 使用 `vision_analyze` 读取屏幕截图内容 — 不要尝试解析像素
3. 对于持续追踪，请使用 cronjob 定期捕获并记录位置
4. 尊重隐私 — 仅追踪用户拥有的设备/物品