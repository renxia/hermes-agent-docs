---
title: "像素艺术 — 使用硬件精确调色板将图像转换为复古像素艺术（NES、Game Boy、PICO-8、C64 等）"
sidebar_label: "像素艺术"
description: "使用硬件精确调色板将图像转换为复古像素艺术（NES、Game Boy、PICO-8、C64 等）"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# 像素艺术

将图像转换为具有硬件精确调色板的复古像素艺术（NES、Game Boy、PICO-8、C64 等），并将其制作成短视频动画。预设涵盖街机、SNES 以及 10 多种符合时代特征的风格。使用 `clarify` 让用户在生成前选择一种风格。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/creative/pixel-art` |
| 版本 | `2.0.0` |
| 作者 | dodo-reach |
| 许可证 | MIT |
| 标签 | `creative`, `pixel-art`, `arcade`, `snes`, `nes`, `gameboy`, `retro`, `image`, `video` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 像素艺术

将任意图像转换为复古像素艺术，然后可选择地使用符合时代特征的特效（雨、萤火虫、雪、火星）将其制作成 MP4 或 GIF 动画。

此技能附带两个脚本：

- `scripts/pixel_art.py` — 照片 → 像素艺术 PNG（Floyd-Steinberg 抖动）
- `scripts/pixel_art_video.py` — 像素艺术 PNG → 动画 MP4（+ 可选 GIF）

每个脚本均可导入或直接运行。预设会锁定硬件调色板，以获得符合时代的准确颜色（NES、Game Boy、PICO-8 等），或使用自适应 N 色调色以实现街机/SNES 风格的外观。

## 使用时机

- 用户希望将源图像转换为复古像素艺术
- 用户要求 NES / Game Boy / PICO-8 / C64 / 街机 / SNES 风格
- 用户希望生成短循环动画（雨景、夜空、雪景等）
- 海报、专辑封面、社交媒体帖子、精灵图、角色、头像

## 工作流程

在生成之前，请与用户确认风格。不同的预设会产生非常不同的输出，重新生成成本较高。

### 步骤 1 — 提供风格选项

调用 `clarify` 并提供 4 个具有代表性的预设。根据用户的要求选择一组预设 — 不要简单地列出全部 14 个。

当用户意图不明确时的默认菜单：

```python
clarify(
    question="你想要哪种像素艺术风格？",
    choices=[
        "arcade — 粗犷的 80 年代街机风格（16 色，8px）",
        "nes — 任天堂 8 位硬件调色板（54 色，8px）",
        "gameboy — 4 阶绿色 Game Boy DMG",
        "snes — 更清晰的 16 位风格（32 色，4px）",
    ],
)
```

当用户已经指定了某个时代（例如“80 年代街机”、“Gameboy”）时，跳过 `clarify` 并直接使用匹配的预设。

### 步骤 2 — 提供动画选项（可选）

如果用户要求视频/GIF，或输出可能受益于动态效果，请询问选择哪种场景：

```python
clarify(
    question="想要添加动画吗？选择一个场景或跳过。",
    choices=[
        "night — 星星 + 萤火虫 + 飘落的叶子",
        "urban — 雨 + 霓虹灯脉动",
        "snow — 飘落的雪花",
        "skip — 仅图像",
    ],
)
```

连续调用 `clarify` 不得超过两次。一次用于风格，一次用于场景（如果考虑动画）。如果用户在消息中明确指定了特定风格和场景，则完全跳过 `clarify`。

### 步骤 3 — 生成

先运行 `pixel_art()`；如果请求了动画，则将结果传入 `pixel_art_video()`。

## 预设目录

| 预设 | 时代 | 调色板 | 块大小 | 最适合 |
|--------|-----|---------|-------|----------|
| `arcade` | 80 年代街机 | 自适应 16 色 | 8px | 粗体海报、英雄艺术 |
| `snes` | 16 位 | 自适应 32 色 | 4px | 角色、细节丰富的场景 |
| `nes` | 8 位 | NES（54 色） | 8px | 真正的 NES 风格 |
| `gameboy` | DMG 手持设备 | 4 阶绿色 | 8px | 单色 Game Boy |
| `gameboy_pocket` | Pocket 手持设备 | 4 阶灰色 | 8px | 单色 GB Pocket |
| `pico8` | PICO-8 | 16 固定色 | 6px | 幻想主机风格 |
| `c64` | Commodore 64 | 16 固定色 | 8px | 8 位家用电脑 |
| `apple2` | Apple II 高分辨率 | 6 固定色 | 10px | 极致复古，6 色 |
| `teletext` | BBC Teletext | 8 纯色 | 10px | 粗犷的原色 |
| `mspaint` | Windows MS Paint | 24 固定色 | 8px | 怀旧桌面 |
| `mono_green` | CRT 磷光 | 2 绿色 | 6px | 终端/CRT 美学 |
| `mono_amber` | CRT 琥珀色 | 2 琥珀色 | 6px | 琥珀色显示器风格 |
| `neon` | 赛博朋克 | 10 霓虹色 | 6px | 蒸汽波/赛博 |
| `pastel` | 柔和粉彩 | 10 粉彩色 | 6px | 可爱 / 温和 |

命名调色板位于 `scripts/palettes.py`（完整列表见 `references/palettes.md` — 共 28 个命名调色板）。任何预设均可被覆盖：

```python
pixel_art("in.png", "out.png", preset="snes", palette="PICO_8", block=6)
```

## 场景目录（用于视频）

| 场景 | 特效 |
|-------|---------|
| `night` | 闪烁的星星 + 萤火虫 + 飘落的叶子 |
| `dusk` | 萤火虫 + 闪光 |
| `tavern` | 尘埃颗粒 + 温暖的闪光 |
| `indoor` | 尘埃颗粒 |
| `urban` | 雨 + 霓虹灯脉动 |
| `nature` | 叶子 + 萤火虫 |
| `magic` | 闪光 + 萤火虫 |
| `storm` | 雨 + 闪电 |
| `underwater` | 气泡 + 光点闪光 |
| `fire` | 火星 + 闪光 |
| `snow` | 雪花 + 闪光 |
| `desert` | 热浪扭曲 + 尘埃 |

## 调用模式

### Python（导入）

```python
import sys
sys.path.insert(0, "/home/teknium/.hermes/skills/creative/pixel-art/scripts")
from pixel_art import pixel_art
from pixel_art_video import pixel_art_video

# 1. 转换为像素艺术
pixel_art("/path/to/photo.jpg", "/tmp/pixel.png", preset="nes")

# 2. 添加动画（可选）
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
1. 提升对比度/色彩/锐度（对于较小的调色板效果更强）
2. 在量化之前进行色调分离以简化色调区域
3. 使用 `Image.NEAREST` 按 `block` 缩小（硬像素，无插值）
4. 使用 Floyd-Steinberg 抖动进行量化 — 针对自适应 N 色调色板或命名硬件调色板
5. 使用 `Image.NEAREST` 放大回原尺寸

在缩小之后进行量化可以确保抖动与最终的像素网格对齐。如果在缩小之前量化，则会在消失的细节上浪费误差扩散。

**视频叠加：**
- 每帧复制基础帧（静态背景）
- 叠加每帧无状态的粒子绘制（每种特效一个函数）
- 通过 ffmpeg `libx264 -pix_fmt yuv420p -crf 18` 编码
- 可选 GIF 通过 `palettegen` + `paletteuse` 实现

## 依赖项

- Python 3.9+
- Pillow (`pip install Pillow`)
- PATH 中的 ffmpeg（仅视频需要 — Hermes 会安装此包）

## 注意事项

- 调色板键名区分大小写（`"NES"`、`"PICO_8"`、`"GAMEBOY_ORIGINAL"`）。
- 非常小的源图像（宽度 <100px）在 8-10px 块下会崩溃。如果源图像很小，请先放大。
- 分数 `block` 或 `palette` 会破坏量化 — 保持它们为正整数。
- 动画粒子数量针对约 640x480 的画布进行了调整。在非常大的图像上，你可能需要使用不同的种子进行第二次处理以调整密度。
- `mono_green` / `mono_amber` 强制 `color=0.0`（去饱和）。如果覆盖并保留色度，2 色调色板可能会在平滑区域产生条纹。
- `clarify` 循环：每轮最多调用两次（风格，然后是场景）。不要向用户提出更多选择。

## 验证

- 在输出路径创建了 PNG 文件
- 在预设的块大小下可见清晰的方形像素块
- 颜色数量与预设匹配（目测图像或运行 `Image.open(p).getcolors()`）
- 视频是有效的 MP4（`ffprobe` 可以打开）且大小非零

## 归属

`pixel_art_video.py` 中的命名硬件调色板和程序化动画循环移植自 [pixel-art-studio](https://github.com/Synero/pixel-art-studio)（MIT）。有关详细信息，请参阅此技能目录中的 `ATTRIBUTION.md`。