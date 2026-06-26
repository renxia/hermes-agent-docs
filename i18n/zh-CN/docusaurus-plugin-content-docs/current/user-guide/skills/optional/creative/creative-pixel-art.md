---
title: Pixel Art — Pixel art w/ era palettes (NES, Game Boy, PICO-8)
sidebar_label: 像素艺术
description: 像素艺术，带时代调色板 (NES, Game Boy, PICO-8)
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# 像素艺术

像素艺术，带时代调色板 (NES, Game Boy, PICO-8)。

## 技能元数据

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/creative/pixel-art` 安装 |
| Path | `optional-skills/creative/pixel-art` |
| Version | `2.0.0` |
| Author | dodo-reach |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `creative`, `pixel-art`, `arcade`, `snes`, `nes`, `gameboy`, `retro`, `image`, `video` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# 像素艺术

将任何图像转换为复古像素艺术，然后可以选择性地将其动画化为带有时代特征效果（雨、萤火虫、雪、余烬）的短 MP4 或 GIF。

此技能附带两个脚本：

- `scripts/pixel_art.py` — 照片 → 像素艺术 PNG (Floyd-Steinberg 抖动)
- `scripts/pixel_art_video.py` — 像素艺术 PNG → 动画 MP4 (+ 可选 GIF)

它们都可直接导入或运行。当您需要时代准确的颜色（NES, Game Boy, PICO-8 等）时，请使用预设来匹配硬件调色板，或者使用自适应 N 色量化以获得街机/SNES 风格。

## 何时使用

- 用户希望从源图像生成复古像素艺术
- 用户要求 NES / Game Boy / PICO-8 / C64 / 街机 / SNES 风格
- 用户想要一个短的循环动画（雨景、夜空、雪等）
- 海报、专辑封面、社交帖子、精灵、角色、头像

## 工作流程

生成之前，请与用户确认风格。不同的预设会产生非常不同的输出，因此重新生成是有成本的。

### 第 1 步 — 提供风格

使用 4 个代表性的预设调用 `clarify`。根据用户提出的要求选择相应的集合——不要一股脑地列出所有 14 个。

当用户的意图不明确时，默认菜单：

```python
clarify(
    question="您想要哪种像素艺术风格？",
    choices=[
        "arcade — 粗犷、块状的 80 年代街机感觉（16 色，8px）",
        "nes — 任天堂 8 位硬件调色板（54 色，8px）",
        "gameboy — 4 种阴影的 Game Boy DMG",
        "snes — 更干净的 16 位外观（32 色，4px）",
    ],
)
```

如果用户已经指定了时代（例如“80 年代街机”，“Gameboy”），则跳过 `clarify` 并直接使用匹配的预设。

### 第 2 步 — 提供动画（可选）

如果用户要求视频/GIF，或者输出可能受益于动态效果，则询问哪种场景：

```python
clarify(
    question="想将其动画化吗？请选择一个场景或跳过。",
    choices=[
        "night — 星星 + 萤火虫 + 叶子",
        "urban — 雨 + 霓虹脉冲",
        "snow — 飘落的雪花",
        "skip — 只需图像",
    ],
)
```

切勿连续调用 `clarify` 超过两次。一次用于风格，一次用于场景（如果动画是选项）。如果用户在其消息中明确要求特定的风格和场景，则完全跳过 `clarify`。

### 第 3 步 — 生成

首先运行 `pixel_art()`；如果请求了动画，则在结果上链式调用 `pixel_art_video()`。

## 预设目录

| 预设 | 时代 | 调色板 | 像素块 | 最适合 |
|--------|-----|---------|-------|----------|
| `arcade` | 80 年代街机 | 自适应 16 色 | 8px | 大胆海报，英雄艺术 |
| `snes` | 16 位 | 自适应 32 色 | 4px | 角色，细节场景 |
| `nes` | 8 位 | NES (54) | 8px | 真正的 NES 外观 |
| `gameboy` | DMG 手持机 | 4 种绿色阴影 | 8px | 单色 Game Boy |
| `gameboy_pocket` | 袖珍手持机 | 4 种灰色阴影 | 8px | 单色 GB Pocket |
| `pico8` | PICO-8 | 16 色固定 | 6px | 幻想主机外观 |
| `c64` | Commodore 64 | 16 色固定 | 8px | 8 位家用电脑 |
| `apple2` | Apple II 高分辨率 | 6 色固定 | 10px | 极度复古，6 色 |
| `teletext` | BBC Teletext | 8 色纯色 | 10px | 粗犷的原色 |
| `mspaint` | Windows MS Paint | 24 色固定 | 8px | 怀旧桌面 |
| `mono_green` | CRT 磷光体 | 2 种绿色 | 6px | 终端/CRT 美学 |
| `mono_amber` | CRT 琥珀色 | 2 种琥珀色 | 6px | 琥珀色显示器外观 |
| `neon` | cyberpunk | 10 种霓虹色 | 6px | Vaporwave/cyber |
| `pastel` | 柔和的彩色 | 10 种柔和色 | 6px | Kawaii / 温和 |

命名调色板存储在 `scripts/palettes.py` 中（有关完整列表，请参阅 `references/palettes.md` — 共 28 个命名调色板）。任何预设都可以被覆盖：

```python
pixel_art("in.png", "out.png", preset="snes", palette="PICO_8", block=6)
```

## 场景目录（用于视频）

| 场景 | 效果 |
|-------|---------|
| `night` | 闪烁的星星 + 萤火虫 + 飘落的叶子 |
| `dusk` | 萤火虫 + 星光 |
| `tavern` | 尘埃颗粒 + 温暖的星光 |
| `indoor` | 尘埃颗粒 |
| `urban` | 雨 + 霓虹脉冲 |
| `nature` | 叶子 + 萤火虫 |
| `magic` | 星光 + 萤火虫 |
| `storm` | 雨 + 闪电 |
| `underwater` | 气泡 + 微光星光 |
| `fire` | 余烬 + 星光 |
| `snow` | 雪花 + 星光 |
| `desert` | 热浪 + 尘土 |

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

### CLI

```bash
cd /home/teknium/.hermes/skills/creative/pixel-art/scripts

python pixel_art.py in.jpg out.png --preset gameboy
python pixel_art.py in.jpg out.png --preset snes --palette PICO_8 --block 6

python pixel_art_video.py out.png out.mp4 --scene night --duration 6 --gif
```

## 工作流程原理

**像素转换：**
1. 增强对比度/色彩/清晰度（对于较小的调色板尤为重要）
2. Posterize（分色）：简化色调区域，以便进行量化
3. 使用 `Image.NEAREST` 进行降尺度处理（硬像素，无插值）
4. 使用 Floyd-Steinberg 抖动进行量化——针对自适应 N 色调色板 或 命名硬件调色板
5. 使用 `Image.NEAREST` 进行上采样

在缩小后进行量化，可以使抖动与最终的像素网格对齐。如果在缩小前进行量化，则会浪费用于细节的误差扩散。

**视频叠加：**
- 每一帧都复制基础帧（静态背景）
- 叠加状态无关的逐帧粒子绘制（每个效果一个函数）
- 通过 ffmpeg `libx264 -pix_fmt yuv420p -crf 18` 进行编码
- 可选 GIF 通过 `palettegen` + `paletteuse` 实现

## 依赖项

- Python 3.9+
- Pillow (`pip install Pillow`)
- ffmpeg（需要安装在 PATH 中，仅用于视频——Hermes 会安装该包）

## 潜在问题

- Pallet keys（调色板键）是区分大小写的（`"NES"`、`"PICO_8"`、`"GAMEBOY_ORIGINAL"`）。
- 非常小的源图像（&lt;100px 宽）在 8-10px 的像素块下会崩溃。如果图像很小，请先进行上采样。
- 分数形式的 `block` 或 `palette` 会破坏量化——请保持它们为正整数。
- 动画粒子数量是针对约 640x480 画布优化的。对于非常大的图像，您可能需要使用不同的种子进行第二次处理以提高密度。
- `mono_green` / `mono_amber` 会强制 `color=0.0`（去饱和）。如果您覆盖并保留色度，2 色调色板可能会在平滑区域产生条纹。
- `clarify` 循环：每次轮次最多调用两次（风格，然后场景）。不要用更多的选项轰炸用户。

## 验证

- PNG 文件已创建在输出路径
- 在预设的像素块尺寸下可以看到清晰的正方形像素块
- 色数与预设匹配（目测图像或运行 `Image.open(p).getcolors()`）
- 视频是一个有效的 MP4（`ffprobe` 可以打开它），且大小不为零

## 归属

命名硬件调色板和 `pixel_art_video.py` 中的过程动画循环源自 [pixel-art-studio](https://github.com/Synero/pixel-art-studio) (MIT)。有关详细信息，请参阅此技能目录中的 `ATTRIBUTION.md`。