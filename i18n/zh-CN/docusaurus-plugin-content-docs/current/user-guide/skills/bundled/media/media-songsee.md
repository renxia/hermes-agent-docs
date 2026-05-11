---
title: "Songsee — 音频频谱图/特征（梅尔、色度、MFCC）通过命令行"
sidebar_label: "Songsee"
description: "通过命令行生成音频频谱图/特征（梅尔、色度、MFCC）"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Songsee

通过命令行生成音频频谱图/特征（梅尔、色度、MFCC）。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/media/songsee` |
| 版本 | `1.0.0` |
| 作者 | 社区 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `音频`，`可视化`，`频谱图`，`音乐`，`分析` |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体所看到的指令。
:::

# songsee

从音频文件生成频谱图和多面板音频特征可视化。

## 先决条件

需要 [Go](https://go.dev/doc/install)：
```bash
go install github.com/steipete/songsee/cmd/songsee@latest
```

可选：`ffmpeg`，用于处理 WAV/MP3 以外的格式。

## 快速开始

```bash
# 基本频谱图
songsee track.mp3

# 保存到特定文件
songsee track.mp3 -o spectrogram.png

# 多面板可视化网格
songsee track.mp3 --viz spectrogram,mel,chroma,hpss,selfsim,loudness,tempogram,mfcc,flux

# 时间切片（从12.5秒开始，持续8秒）
songsee track.mp3 --start 12.5 --duration 8 -o slice.jpg

# 从标准输入读取
cat track.mp3 | songsee - --format png -o out.png
```

## 可视化类型

使用 `--viz` 并用逗号分隔值：

| 类型 | 描述 |
|------|-------------|
| `spectrogram` | 标准频率频谱图 |
| `mel` | 梅尔刻度频谱图 |
| `chroma` | 音高类别分布 |
| `hpss` | 谐波/打击乐分离 |
| `selfsim` | 自相似矩阵 |
| `loudness` | 响度随时间变化 |
| `tempogram` | 节奏估计 |
| `mfcc` | 梅尔频率倒谱系数 |
| `flux` | 频谱通量（起音检测） |

多种 `--viz` 类型将在单个图像中呈现为网格。

## 常用标志

| 标志 | 描述 |
|------|-------------|
| `--viz` | 可视化类型（逗号分隔） |
| `--style` | 调色板：`classic`，`magma`，`inferno`，`viridis`，`gray` |
| `--width` / `--height` | 输出图像尺寸 |
| `--window` / `--hop` | FFT 窗口和跳跃大小 |
| `--min-freq` / `--max-freq` | 频率范围过滤器 |
| `--start` / `--duration` | 音频的时间切片 |
| `--format` | 输出格式：`jpg` 或 `png` |
| `-o` | 输出文件路径 |

## 备注

- WAV 和 MP3 为原生解码；其他格式需要 `ffmpeg`
- 输出的图像可以通过 `vision_analyze` 进行自动化音频分析检查
- 适用于比较音频输出、调试合成或记录音频处理流程