---
title: "像素艺术 — 使用时代调色板的像素艺术（NES、Game Boy、PICO-8）"
sidebar_label: "像素艺术"
description: "使用时代调色板的像素艺术（NES、Game Boy、PICO-8）"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# 像素艺术

使用时代调色板的像素艺术（NES、Game Boy、PICO-8）。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/creative/pixel-art` |
| 版本 | `2.0.0` |
| 作者 | dodo-reach |
| 许可证 | MIT |
| 标签 | `creative`, `pixel-art`, `arcade`, `snes`, `nes`, `gameboy`, `retro`, `image`, `video` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是当技能激活时，智能体看到的指令。
:::

# 像素艺术

将任意图像转换为复古像素艺术，然后可选择地将其制作成带有符合时代特征效果的短视频 MP4 或 GIF（雨、萤火虫、雪、余烬）。

此技能附带两个脚本：

- `scripts/pixel_art.py` — 照片 → 像素艺术 PNG（Floyd-Steinberg 抖动）
- `scripts/pixel_art_video.py` — 像素艺术 PNG → 动画 MP4（+ 可选 GIF）

每个脚本均可导入或直接运行。预设会贴合硬件调色板，当你需要符合时代特征的颜色时（如 NES、Game Boy、PICO-8 等），或使用自适应 N 色量化以获得街机/SNES 风格的外观。

## 何时使用

- 用户希望从源图像获得复古像素艺术
- 用户要求 NES / Game Boy / PICO-8 / C64 / 街机 / SNES 风格
- 用户希望一个简短的循环动画（雨景、夜空、雪等）
- 海报、专辑封面、社交媒体帖子、精灵图、角色、头像

## 工作流程

在生成之前，请与用户确认风格。不同的预设会产生非常不同的输出，重新生成成本很高。

### 步骤 1 — 提供一种风格

调用 `clarify` 并提供 4 个具有代表性的预设。根据用户的要求选择集合 —— 不要只是列出全部 14 个。

当用户意图不明确时的默认菜单：

```python
clarify(
    question="你想要哪种像素艺术风格？",
    choices=[
        "arcade — 粗犷、厚重的 80 年代街机风格（16 色，8px）",
        "nes — 任天堂 8 位硬件调色板（54 色，8px）",
        "gameboy — 4 阶绿色 Game Boy DMG",
        "snes — 更清晰的 16 位外观（32 色，4px）",
    ],
)
```

当用户已经指定了一个时代（例如“80 年代街机”、“Gameboy”）时，跳过 `clarify` 并直接使用匹配的预设。

### 步骤 2 — 提供动画（可选）

如果用户要求视频/GIF，或者输出可能受益于动态效果，请询问选择哪个场景：

```python
clarify(
    question="想要制作动画吗？选择一个场景或跳过。",
    choices=[
        "night — 星星 + 萤火虫 + 树叶",
        "urban — 雨 + 霓虹灯脉冲",
        "snow — 飘落的雪花",
        "skip — 仅图像",
    ],
)
```

不要连续调用 `clarify` 超过两次。一次用于风格，一次用于场景（如果考虑动画）。如果用户在他们的消息中明确要求了特定的风格和场景，则完全跳过 `clarify`。

### 步骤 3 — 生成

首先运行 `pixel_art()`；如果请求了动画，则将结果传入 `pixel_art_video()`。

## 预设目录

| 预设 | 时代 | 调色板 | 块大小 | 最适合 |
|--------|-----|---------|-------|----------|
| `arcade` | 80 年代街机 | 自适应 16 色 | 8px | 粗体海报、英雄艺术 |
| `snes` | 16 位 | 自适应 32 色 | 4px | 角色、细节场景 |
| `nes` | 8 位 | NES（54 色） | 8px | 真正的 NES 外观 |
| `gameboy` | DMG 手持设备 | 4 阶绿色 | 8px | 单色 Game Boy |
| `gameboy_pocket` | Pocket 手持设备 | 4 阶灰色 | 8px | 单色 GB Pocket |
| `pico8` | PICO-8 | 16 色固定 | 6px | 幻想主机外观 |
| `c64` | Commodore 64 | 16 色固定 | 8px | 8 位家用电脑 |
| `apple2` | Apple II 高分辨率 | 6 色固定 | 10px | 极端复古，6 色 |
| `teletext` | BBC Teletext | 8 纯色 | 10px | 粗体原色 |
| `mspaint` | Windows MS Paint | 24 色固定 | 8px | 怀旧的桌面 |
| `mono_green` | CRT 磷光 | 2 绿色 | 6px | 终端/CRT 美学 |
| `mono_amber` | CRT 琥珀色 | 2 琥珀色 | 6px | 琥珀色显示器外观 |
| `neon` | 赛博朋克 | 10 霓虹色 | 6px | 蒸汽波/赛博 |
| `pastel` | 柔和的粉彩色 | 10 粉彩色 | 6px | 可爱 / 温和 |

命名调色板位于 `scripts/palettes.py`（完整列表见 `references/palettes.md` —— 共 28 个命名调色板）。任何预设均可被覆盖：

```python
pixel_art("in.png", "out.png", preset="snes", palette="PICO_8", block=6)
```

## 场景目录（用于视频）

| 场景 | 效果 |
|-------|---------|
| `night` | 闪烁的星星 + 萤火虫 + 飘动的树叶 |
| `dusk` | 萤火虫 + 闪光 |
| `tavern` | 尘埃颗粒 + 温暖的闪光 |
| `indoor` | 尘埃颗粒 |
| `urban` | 雨 + 霓虹灯脉冲 |
| `nature` | 树叶 + 萤火虫 |
| `magic` | 闪光 + 萤火虫 |
| `storm` | 雨 + 闪电 |
| `underwater` | 气泡 + 光点闪光 |
| `fire` | 余烬 + 闪光 |
| `snow` | 雪花 + 闪光 |
| `desert` | 热浪 + 尘埃 |

## 调用模式

### Python（导入）

```python
import sys
sys.path.insert(0, "/home/teknium/.hermes/skills/creative/pixel-art/scripts")
from pixel_art import pixel_art
from pixel_art_video import pixel_art_video

# 1. 转换为像素艺术
pixel_art("/path/to/photo.jpg", "/tmp/pixel.png", preset="nes")

# 2. 制作动画（可选）
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

## 流水线原理

**像素转换：**
1. 增强对比度/颜色/锐度（对于较小的调色板效果更强）
2. 在量化之前进行色调分离以简化色调区域
3. 使用 `Image.NEAREST` 按 `block` 缩小尺寸（硬像素，无插值）
4. 使用 Floyd-Steinberg 抖动进行量化 —— 针对自适应 N 色调色板或命名硬件调色板
5. 使用 `Image.NEAREST` 放大回原始尺寸

在缩小尺寸之后进行量化可以保持抖动与最终像素网格对齐。如果在之前量化，会浪费误差扩散在最终会消失的细节上。

**视频叠加：**
- 每帧复制基础帧（静态背景）
- 叠加每帧无状态的粒子绘制（每个效果一个函数）
- 通过 ffmpeg `libx264 -pix_fmt yuv420p -crf 18` 编码
- 可选 GIF 通过 `palettegen` + `paletteuse`

## 依赖项

- Python 3.9+
- Pillow (`pip install Pillow`)
- PATH 中的 ffmpeg（仅视频需要 —— Hermes 会安装此包）

## 陷阱

- 调色板键区分大小写（`"NES"`、`"PICO_8"`、`"GAMEBOY_ORIGINAL"`）。
- 非常小的源图像（&lt;100px 宽）在 8-10px 块下会崩溃。如果源图像很小，请先放大它。
- 分数 `block` 或 `palette` 会破坏量化 —— 保持它们为正整数。
- 动画粒子数量针对约 640x480 的画布进行了调整。在非常大的图像上，你可能需要使用不同的种子进行第二次传递以调整密度。
- `mono_green` / `mono_amber` 强制 `color=0.0`（去饱和）。如果你覆盖并保留色度，2 色调色板可能会在平滑区域产生条纹。
- `clarify` 循环：每轮最多调用两次（风格，然后是场景）。不要向用户提出更多选择。

## 验证

- 在输出路径创建了 PNG
- 在预设的块大小下可见清晰的方形像素块
- 颜色数量与预设匹配（目测图像或运行 `Image.open(p).getcolors()`）
- 视频是有效的 MP4（`ffprobe` 可以打开它）且大小非零

## 归属

`pixel_art_video.py` 中的命名硬件调色板和程序化动画循环移植自 [pixel-art-studio](https://github.com/Synero/pixel-art-studio)（MIT）。有关详细信息，请参阅此技能目录中的 `ATTRIBUTION.md`。