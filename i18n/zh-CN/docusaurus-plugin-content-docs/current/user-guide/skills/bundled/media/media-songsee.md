---
title: "Songsee — 生成声谱图与音频特征可视化（梅尔、色度、MFCC、节拍图等）"
sidebar_label: "Songsee"
description: "生成声谱图与音频特征可视化（梅尔、色度、MFCC、节拍图等）"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Songsee

通过命令行界面（CLI）从音频文件生成声谱图与音频特征可视化（梅尔、色度、MFCC、节拍图等）。适用于音频分析、音乐制作调试以及可视化文档记录。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/media/songsee` |
| 版本 | `1.0.0` |
| 作者 | community |
| 许可证 | MIT |
| 标签 | `音频`, `可视化`, `声谱图`, `音乐`, `分析` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。当技能激活时，智能体将视其为操作指令。
:::

# songsee

从音频文件生成声谱图与多面板音频特征可视化。

## 先决条件

需要安装 [Go](https://go.dev/doc/install)：
```bash
go install github.com/steipete/songsee/cmd/songsee@latest
```

可选：如需处理 WAV/MP3 以外的格式，请安装 `ffmpeg`。

## 快速开始

```bash
# 基础声谱图
songsee track.mp3

# 保存至指定文件
songsee track.mp3 -o spectrogram.png

# 多面板可视化网格
songsee track.mp3 --viz spectrogram,mel,chroma,hpss,selfsim,loudness,tempogram,mfcc,flux

# 时间切片（从 12.5 秒开始，持续 8 秒）
songsee track.mp3 --start 12.5 --duration 8 -o slice.jpg

# 从标准输入读取
cat track.mp3 | songsee - --format png -o out.png
```

## 可视化类型

使用 `--viz` 参数，以逗号分隔多个值：

| 类型 | 描述 |
|------|-------------|
| `spectrogram` | 标准频率声谱图 |
| `mel` | 梅尔刻度声谱图 |
| `chroma` | 音高类别分布 |
| `hpss` | 谐波/打击乐分离 |
| `selfsim` | 自相似矩阵 |
| `loudness` | 随时间变化的响度 |
| `tempogram` | 节拍估计 |
| `mfcc` | 梅尔频率倒谱系数 |
| `flux` | 频谱通量（起始点检测） |

多个 `--viz` 类型将在单张图像中以网格形式渲染。

## 常用参数

| 参数 | 描述 |
|------|-------------|
| `--viz` | 可视化类型（逗号分隔） |
| `--style` | 调色板：`classic`、`magma`、`inferno`、`viridis`、`gray` |
| `--width` / `--height` | 输出图像尺寸 |
| `--window` / `--hop` | FFT 窗口与跳跃大小 |
| `--min-freq` / `--max-freq` | 频率范围过滤 |
| `--start` / `--duration` | 音频的时间切片 |
| `--format` | 输出格式：`jpg` 或 `png` |
| `-o` | 输出文件路径 |

## 注意事项

- WAV 和 MP3 格式可原生解码；其他格式需依赖 `ffmpeg`
- 输出图像可通过 `vision_analyze` 进行自动化音频分析
- 适用于比较音频输出、调试合成效果或记录音频处理流程