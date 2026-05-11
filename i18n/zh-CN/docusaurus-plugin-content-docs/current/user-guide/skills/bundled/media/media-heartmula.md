---
title: "Heartmula — HeartMuLa: 基于歌词与标签生成类Suno歌曲"
sidebar_label: "Heartmula"
description: "HeartMuLa: 基于歌词与标签生成类Suno歌曲"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Heartmula

HeartMuLa：基于歌词与标签生成类Suno歌曲。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/media/heartmula` |
| 版本 | `1.0.0` |
| 平台 | linux, macos, windows |
| 标签 | `music`, `audio`, `generation`, `ai`, `heartmula`, `heartcodec`, `lyrics`, `songs` |
| 相关技能 | `audiocraft` |

## 参考：完整的 SKILL.md

:::info
以下是此技能被触发时，Hermes 加载的完整技能定义。这就是当技能处于活动状态时，智能体所看到的指令。
:::

# HeartMuLa - 开源音乐生成

## 概述
HeartMuLa 是一个基于歌词和标签生成音乐的开源音乐基础模型系列（Apache-2.0 许可证），支持多语言。能够从歌词与标签生成完整的歌曲。是可与 Suno 媲美的开源替代方案。包括：
- **HeartMuLa** - 用于从歌词与标签生成音乐的音乐语言模型（3B/7B 参数）
- **HeartCodec** - 用于高保真音频重建的 12.5Hz 音频编解码器
- **HeartTranscriptor** - 基于 Whisper 的歌词转录器
- **HeartCLAP** - 音频-文本对齐模型

## 使用场景
- 用户想要从文本描述生成音乐/歌曲
- 用户想要一个开源的 Suno 替代品
- 用户想要在本地/离线生成音乐
- 用户询问 HeartMuLa、heartlib 或 AI 音乐生成相关问题

## 硬件要求
- **最低要求**：8GB 显存，使用 `--lazy_load true`（顺序加载/卸载模型）
- **推荐配置**：16GB+ 显存，以获得舒适的单GPU使用体验
- **多GPU**：使用 `--mula_device cuda:0 --codec_device cuda:1` 在多GPU间分配任务
- 3B 模型在懒加载模式下显存峰值约为 6.2GB

## 安装步骤

### 1. 克隆仓库
```bash
cd ~/  # 或其他目标目录
git clone https://github.com/HeartMuLa/heartlib.git
cd heartlib
```

### 2. 创建虚拟环境（需要 Python 3.10）
```bash
uv venv --python 3.10 .venv
. .venv/bin/activate
uv pip install -e .
```

### 3. 修复依赖兼容性问题

**重要**：截至 2026 年 2 月，锁定的依赖项与更新的软件包存在冲突。请应用以下修复：

```bash
# 升级 datasets（旧版本与当前的 pyarrow 不兼容）
uv pip install --upgrade datasets

# 升级 transformers（需要以兼容 huggingface-hub 1.x）
uv pip install --upgrade transformers
```

### 4. 修补源代码（适用于 transformers 5.x）

**补丁 1 - RoPE 缓存修复**，位于 `src/heartlib/heartmula/modeling_heartmula.py`：

在 `HeartMuLa` 类的 `setup_caches` 方法中，在 `reset_caches` 的 try/except 块之后、`with device:` 块之前，添加 RoPE 重新初始化代码：

```python
# 重新初始化在元设备加载期间跳过的 RoPE 缓存
from torchtune.models.llama3_1._position_embeddings import Llama3ScaledRoPE
for module in self.modules():
    if isinstance(module, Llama3ScaledRoPE) and not module.is_cache_built:
        module.rope_init()
        module.to(device)
```

**原因**：`from_pretrained` 首先在元设备上创建模型；`Llama3ScaledRoPE.rope_init()` 在元张量上跳过缓存构建，之后在权重加载到真实设备后也不会重建。

**补丁 2 - HeartCodec 加载修复**，位于 `src/heartlib/pipelines/music_generation.py`：

在 **所有** `HeartCodec.from_pretrained()` 调用处（共有 2 处：`__init__` 中的立即加载和 `codec` 属性中的懒加载）添加 `ignore_mismatched_sizes=True` 参数。

**原因**：VQ 码本的 `initted` 缓冲区在检查点中形状为 `[1]`，而在模型中为 `[]`。数据相同，只是标量与 0 维张量的区别。可以安全忽略。

### 5. 下载模型检查点
```bash
cd heartlib  # 项目根目录
hf download --local-dir './ckpt' 'HeartMuLa/HeartMuLaGen'
hf download --local-dir './ckpt/HeartMuLa-oss-3B' 'HeartMuLa/HeartMuLa-oss-3B-happy-new-year'
hf download --local-dir './ckpt/HeartCodec-oss' 'HeartMuLa/HeartCodec-oss-20260123'
```

可以并行下载这 3 个文件。总大小为数 GB。

## GPU / CUDA

HeartMuLa 默认使用 CUDA（`--mula_device cuda --codec_device cuda`）。如果用户拥有安装了 PyTorch CUDA 支持的 NVIDIA GPU，则无需额外设置。

- 安装的 `torch==2.4.1` 自带 CUDA 12.1 支持
- `torchtune` 可能显示版本为 `0.4.0+cpu` — 这只是包元数据，它仍然通过 PyTorch 使用 CUDA
- 要验证 GPU 是否正在使用，请在输出中查找 "CUDA memory" 行（例如 "CUDA memory before unloading: 6.20 GB"）
- **没有 GPU？** 可以使用 `--mula_device cpu --codec_device cpu` 在 CPU 上运行，但预期生成速度会**非常慢**（单首歌可能需要 30-60+ 分钟，而在 GPU 上约 4 分钟）。CPU 模式也需要大量内存（~12GB+ 空闲）。如果用户没有 NVIDIA GPU，建议使用云 GPU 服务（如 Google Colab 免费 T4、Lambda Labs 等）或使用在线演示：https://heartmula.github.io/。

## 用法

### 基础生成
```bash
cd heartlib
. .venv/bin/activate
python ./examples/run_music_generation.py \
  --model_path=./ckpt \
  --version="3B" \
  --lyrics="./assets/lyrics.txt" \
  --tags="./assets/tags.txt" \
  --save_path="./assets/output.mp3" \
  --lazy_load true
```

### 输入格式

**标签**（逗号分隔，无空格）：
```
piano,happy,wedding,synthesizer,romantic
```
或
```
rock,energetic,guitar,drums,male-vocal
```

**歌词**（使用带括号的结构标签）：
```
[Intro]

[Verse]
你的歌词在这里...

[Chorus]
副歌歌词...

[Bridge]
桥段歌词...

[Outro]
```

### 关键参数
| 参数 | 默认值 | 描述 |
|-----------|---------|-------------|
| `--max_audio_length_ms` | 240000 | 最大时长（毫秒）（240秒 = 4分钟） |
| `--topk` | 50 | Top-k 采样 |
| `--temperature` | 1.0 | 采样温度 |
| `--cfg_scale` | 1.5 | 无分类器引导缩放系数 |
| `--lazy_load` | false | 按需加载/卸载模型（节省显存） |
| `--mula_dtype` | bfloat16 | HeartMuLa 的数据类型（推荐 bf16） |
| `--codec_dtype` | float32 | HeartCodec 的数据类型（为保证质量推荐 fp32） |

### 性能
- RTF（实时因子）≈ 1.0 — 一首 4 分钟的歌曲生成耗时约 4 分钟
- 输出：MP3，48kHz 立体声，128kbps

## 注意事项
1. **不要为 HeartCodec 使用 bf16** — 会降低音频质量。请使用 fp32（默认）。
2. **标签可能被忽略** — 已知问题（#90）。歌词往往占主导；可以尝试调整标签顺序。
3. **macOS 上 Triton 不可用** — GPU 加速仅限 Linux/CUDA。
4. **RTX 5080 不兼容** — 在上游问题中已有报告。
5. 依赖锁定冲突需要执行上述手动升级和补丁。

## 链接
- 仓库：https://github.com/HeartMuLa/heartlib
- 模型：https://huggingface.co/HeartMuLa
- 论文：https://arxiv.org/abs/2601.10547
- 许可证：Apache-2.0