---
title: "像素艺术 — 运用时代调色板的像素艺术（NES、Game Boy、PICO-8）"
sidebar_label: "像素艺术"
description: "运用时代调色板的像素艺术（NES、Game Boy、PICO-8）"
---

{/* 本页面由网站脚本 scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 像素艺术

运用时代调色板的像素艺术（NES、Game Boy、PICO-8）。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/creative/pixel-art` |
| 版本 | `2.0.0` |
| 作者 | dodo-reach |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `creative`, `pixel-art`, `arcade`, `snes`, `nes`, `gameboy`, `retro`, `image`, `video` |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时 Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# 像素艺术

将任何图像转换为复古像素艺术，然后可选地将其制作成带有时代感特效（雨、萤火虫、雪、余烬）的短视频或GIF。

此技能包含两个脚本：
- `scripts/pixel_art.py` — 照片 → 像素艺术 PNG (Floyd-Steinberg 抖动)
- `scripts/pixel_art_video.py` — 像素艺术 PNG → 动画 MP4 (+ 可选 GIF)

每个脚本均可导入或直接运行。当您需要时代准确的颜色（NES、Game Boy、PICO-8 等）时，预设会适配硬件调色板，或者使用自适应 N 色量化来获得街机/SNES 风格的外观。

## 何时使用

- 用户想要从源图像生成复古像素艺术
- 用户要求 NES / Game Boy / PICO-8 / C64 / 街机 / SNES 风格化
- 用户想要一个短的循环动画（雨景、夜空、雪等）
- 海报、专辑封面、社交媒体帖子、精灵图、角色、头像

## 工作流程

在生成前，与用户确认风格。不同的预设会产生非常不同的输出，重新生成成本较高。

### 第一步 — 提供风格选择

使用 `clarify` 函数调用提供 4 个代表性预设。根据用户的要求选择集合 — 不要列出全部 14 个。

当用户意图不明确时，默认菜单为：

```python
clarify(
    question="您想要哪种像素艺术风格？",
    choices=[
        "arcade — 大胆、粗犷的 80 年代街机感 (16色, 8px)",
        "nes — 任天堂 8 位硬件调色板 (54色, 8px)",
        "gameboy — 4 色调绿色 Game Boy DMG",
        "snes — 更清晰的 16 位外观 (32色, 4px)",
    ],
)
```

当用户已经指定了时代（例如“80 年代街机”、“Gameboy”）时，跳过 `clarify` 并直接使用匹配的预设。

### 第二步 — 提供动画选项（可选）

如果用户要求视频/GIF，或者输出可能受益于动态效果，询问想要哪个场景：

```python
clarify(
    question="想要动画化它吗？选择一个场景或跳过。",
    choices=[
        "night — 星星 + 萤火虫 + 树叶",
        "urban — 雨 + 霓虹灯脉冲",
        "snow — 飘落的雪花",
        "skip — 仅图片",
    ],
)
```

不要连续调用 `clarify` 超过两次。一次用于风格，如果动画在考虑中，则一次用于场景。如果用户在消息中明确要求了特定的风格和场景，则完全跳过 `clarify`。

### 第三步 — 生成

首先运行 `pixel_art()`；如果请求了动画，则对结果链式调用 `pixel_art_video()`。

## 预设目录

| 预设 | 时代 | 调色板 | 块大小 | 最佳用途 |
|--------|-----|---------|-------|----------|
| `arcade` | 80 年代街机 | 自适应 16 色 | 8px | 醒目的海报、主视觉 |
| `snes` | 16 位 | 自适应 32 色 | 4px | 角色、详细场景 |
| `nes` | 8 位 | NES (54色) | 8px | 真正的 NES 外观 |
| `gameboy` | DMG 掌机 | 4 种绿色色调 | 8px | 单色 Game Boy |
| `gameboy_pocket` | Pocket 掌机 | 4 种灰色色调 | 8px | 单色 GB Pocket |
| `pico8` | PICO-8 | 16 种固定色 | 6px | 幻想主机外观 |
| `c64` | Commodore 64 | 16 种固定色 | 8px | 8 位家用电脑 |
| `apple2` | Apple II 高分辨率 | 6 种固定色 | 10px | 极致复古，6 色 |
| `teletext` | BBC Teletext | 8 种纯色 | 10px | 粗犷的原色 |
| `mspaint` | Windows MS Paint | 24 种固定色 | 8px | 怀旧的桌面风格 |
| `mono_green` | CRT 荧光粉 | 2 种绿色 | 6px | 终端/CRT 美学 |
| `mono_amber` | CRT 琥珀色 | 2 种琥珀色 | 6px | 琥珀显示器外观 |
| `neon` | 赛博朋克 | 10 种霓虹色 | 6px | 蒸汽波/赛博风 |
| `pastel` | 柔和粉彩 | 10 种粉彩色 | 6px | 可爱 / 柔和 |

命名的调色板位于 `scripts/palettes.py` 中（完整列表见 `references/palettes.md` — 共 28 个命名调色板）。任何预设都可以被覆盖：

```python
pixel_art("in.png", "out.png", preset="snes", palette="PICO_8", block=6)
```

## 场景目录（用于视频）

| 场景 | 效果 |
|-------|---------|
| `night` | 闪烁的星星 + 萤火虫 + 飘落的树叶 |
| `dusk` | 萤火虫 + 闪光 |
| `tavern` | 尘埃微粒 + 温暖的闪光 |
| `indoor` | 尘埃微粒 |
| `urban` | 雨 + 霓虹灯脉冲 |
| `nature` | 树叶 + 萤火虫 |
| `magic` | 闪光 + 萤火虫 |
| `storm` | 雨 + 闪电 |
| `underwater` | 气泡 + 光点 |
| `fire` | 余烬 + 闪光 |
| `snow` | 雪花 + 闪光 |
| `desert` | 热浪 + 沙尘 |

## 调用模式

### Python (导入)

```python
import sys
sys.path.insert(0, "/home/teknium/.hermes/skills/creative/pixel-art/scripts")
from pixel_art import pixel_art
from pixel_art_video import pixel_art_video

# 1. 转换为像素艺术
pixel_art("/path/to/photo.jpg", "/tmp/pixel.png", preset="nes")

# 2. 动画化（可选）
pixel_art_video(
    "/tmp/pixel.png",
    "/tmp/pixel.mp4",
    scene="night",
    duration=6,
    fps=15,
    seed=42,
    export_gif=True,
)
```

### 命令行

```bash
cd /home/teknium/.hermes/skills/creative/pixel-art/scripts

python pixel_art.py in.jpg out.png --preset gameboy
python pixel_art.py in.jpg out.png --preset snes --palette PICO_8 --block 6

python pixel_art_video.py out.png out.mp4 --scene night --duration 6 --gif
```

## 流程原理

**像素转换：**
1. 增强对比度/颜色/锐度（对于较小的调色板增强效果更强）
2. 色调分离，以在量化前简化色调区域
3. 按 `block` 大小使用 `Image.NEAREST` 降采样（硬像素，无插值）
4. 使用 Floyd-Steinberg 抖动进行量化 — 可针对自适应 N 色调色板或命名的硬件调色板
5. 使用 `Image.NEAREST` 放大回原始尺寸

在降采样后进行量化，可使抖动与最终的像素网格对齐。在量化前进行，则会将误差扩散浪费在最终会消失的细节上。

**视频叠加：**
- 每个刻度复制基础帧（静态背景）
- 叠加无状态（按帧）的粒子绘制（每种效果一个函数）
- 通过 ffmpeg `libx264 -pix_fmt yuv420p -crf 18` 编码
- 可选 GIF 通过 `palettegen` + `paletteuse` 生成

## 依赖项

- Python 3.9+
- Pillow (`pip install Pillow`)
- PATH 中的 ffmpeg（仅视频需要 — Hermes 会安装此软件包）

## 陷阱

- 调色板名称区分大小写（`"NES"`, `"PICO_8"`, `"GAMEBOY_ORIGINAL"`）。
- 非常小的源图像（&lt;100px 宽）在 8-10px 的块大小下会崩溃。如果源图太小，请先进行放大。
- 分数 `block` 或 `palette` 会破坏量化 — 保持它们为正整数。
- 动画粒子数量是针对 ~640x480 画布调优的。在非常大的图像上，您可能需要使用不同种子进行第二次处理以调整密度。
- `mono_green` / `mono_amber` 会强制 `color=0.0`（去饱和度）。如果您覆盖并保留色度，2色调色板可能在平滑区域产生条纹。
- `clarify` 循环：每轮最多调用两次（风格，然后场景）。不要向用户抛出更多选择。

## 验证

- PNG 文件在输出路径被创建
- 可以看到清晰的方块像素块，符合预设的块大小
- 颜色数量与预设匹配（目测图像或运行 `Image.open(p).getcolors()`）
- 视频是有效的 MP4 文件（`ffprobe` 可以打开它），大小非零

## 归因

`pixel_art_video.py` 中命名的硬件调色板和程序化动画循环是从 [pixel-art-studio](https://github.com/Synero/pixel-art-studio) (MIT) 移植而来的。详见此技能目录下的 `ATTRIBUTION.md`。