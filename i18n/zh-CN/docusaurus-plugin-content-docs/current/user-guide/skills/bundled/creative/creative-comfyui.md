---
title: "Comfyui"
sidebar_label: "Comfyui"
description: "使用 ComfyUI 生成图像、视频和音频 — 安装、启动、管理节点/模型、通过参数注入运行工作流"
---

{/* 此页面由网站脚本 `website/scripts/generate-skill-docs.py` 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Comfyui

使用 ComfyUI 生成图像、视频和音频 — 安装、启动、管理节点/模型、通过参数注入运行工作流。使用官方的 comfy-cli 进行生命周期管理，并使用直接的 REST/WebSocket API 进行执行。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/creative/comfyui` |
| 版本 | `5.1.0` |
| 作者 | ['kshitijk4poor', 'alt-glitch', 'purzbeats'] |
| 许可证 | MIT |
| 平台 | macos, linux, windows |
| 标签 | `comfyui`, `image-generation`, `stable-diffusion`, `flux`, `sd3`, `wan-video`, `hunyuan-video`, `creative`, `generative-ai`, `video-generation` |
| 相关技能 | [`stable-diffusion-image-generation`](/user-guide/skills/optional/mlops/mlops-stable-diffusion), `image_gen` |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# ComfyUI

通过 ComfyUI 生成图像、视频、音频和 3D 内容，使用
官方 `comfy-cli` 进行设置/生命周期管理，以及直接的 REST/WebSocket API
进行工作流执行。

## 此技能包含什么

**参考文档 (`references/`)：**

- `official-cli.md` — 每个 `comfy ...` 命令及其参数
- `rest-api.md` — REST + WebSocket 端点（本地 + 云），负载结构
- `workflow-format.md` — API 格式的 JSON，常见节点类型，参数映射
- `template-integrity.md` — 将 `comfyui-workflow-templates` 从
  编辑器格式转换为 API 格式：Reroute 绕过、带点的动态输入键
  （`values.a`、`resize_type.width`）、云特性（302 重定向、免费层 1 个并发
  作业、1080p VRAM 限制）、Discord 兼容的 ffmpeg 拼接。
  由 [@purzbeats](https://github.com/purzbeats) 撰写。当您从官方模板开始时，
  请加载此文件。

**脚本 (`scripts/`)：**

| 脚本 | 用途 |
|--------|---------|
| `_common.py` | 共享的 HTTP、云路由、节点目录（请勿直接运行） |
| `hardware_check.py` | 探测 GPU/VRAM/磁盘 → 推荐本地还是 Comfy Cloud |
| `comfyui_setup.sh` | 硬件检查 + comfy-cli + ComfyUI 安装 + 启动 + 验证 |
| `extract_schema.py` | 读取工作流 → 列出可控参数 + 模型依赖 |
| `check_deps.py` | 检查工作流与正在运行的服务器 → 列出缺失的节点/模型 |
| `auto_fix_deps.py` | 运行 check_deps 然后执行 `comfy node install` / `comfy model download` |
| `run_workflow.py` | 注入参数，提交，监控，下载输出（HTTP 或 WS） |
| `run_batch.py` | 提交工作流 N 次并进行参数扫描，并行数取决于您的层级 |
| `ws_monitor.py` | 用于执行作业的实时 WebSocket 查看器（实时进度） |
| `health_check.py` | 验证检查清单运行器 — comfy-cli + 服务器 + 模型 + 冒烟测试 |
| `fetch_logs.py` | 获取给定 prompt_id 的回溯 / 状态消息 |

**示例工作流 (`workflows/`)：** SD 1.5、SDXL、Flux Dev、SDXL img2img、
SDXL 修复、ESRGAN 放大、AnimateDiff 视频、Wan T2V。参见
`workflows/README.md`。

## 何时使用

- 用户要求使用 Stable Diffusion、SDXL、Flux、SD3 等生成图像。
- 用户希望运行特定的 ComfyUI 工作流文件。
- 用户想要链接生成步骤（文本到图像 → 放大 → 面部修复）。
- 用户需要 ControlNet、修复、图像到图像或其他高级流程。
- 用户要求管理 ComfyUI 队列、检查模型或安装自定义节点。
- 用户希望通过 AnimateDiff、Hunyuan、Wan、AudioCraft 等生成视频/音频/3D。

## 架构：两层

<!-- ascii-guard-ignore -->
```
┌─────────────────────────────────────────────────────┐
│ 第一层：comfy-cli（官方生命周期工具）                │
│   设置、服务器生命周期、自定义节点、模型             │
│   → comfy install / launch / stop / node / model    │
└─────────────────────────┬───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│ 第二层：REST/WebSocket API + 技能脚本               │
│   工作流执行、参数注入、监控                         │
│   POST /api/prompt，GET /api/view，WS /ws           │
│   → run_workflow.py, run_batch.py, ws_monitor.py    │
└─────────────────────────────────────────────────────┘
```
<!-- ascii-guard-ignore-end -->

**为什么是两层？** 官方 CLI 在安装和服务器管理方面非常出色，
但工作流执行支持有限。REST/WS API 填补了这个空白 —— 脚本处理
CLI 无法完成的工作流参数注入、执行监控和输出下载。

## 快速开始

### 检测环境

```bash
# 有什么可用的？
command -v comfy >/dev/null 2>&1 && echo "comfy-cli: 已安装"
curl -s http://127.0.0.1:8188/system_stats 2>/dev/null && echo "服务器: 运行中"

# 本机能否本地运行 ComfyUI？（GPU/VRAM/磁盘检查）
python3 scripts/hardware_check.py
```

如果什么都没安装，请参阅下面的**设置与入门** —— 但请务必先运行
硬件检查。

### 一键式健康检查

```bash
python3 scripts/health_check.py
# → JSON: comfy_cli 在 PATH 中？服务器可达？至少一个检查点？冒烟测试通过？
```

## 核心工作流

### 步骤 1：获取 API 格式的工作流 JSON

工作流必须是 API 格式（每个节点都有 `class_type`）。它们来自：

- ComfyUI 网页界面 → **工作流 → 导出 (API)**（较新 UI）或
  旧版的“保存（API 格式）”按钮（较旧 UI）
- 此技能的 `workflows/` 目录（可立即运行的示例）
- 社区下载（civitai、Reddit、Discord）—— 通常是编辑器格式，
  必须加载到 ComfyUI 中然后重新导出

编辑器格式（顶层的 `nodes` 和 `links` 数组）**不可直接执行**。
脚本会检测到这种情况并告知您需要重新导出。

### 步骤 2：查看可控制的内容

```bash
python3 scripts/extract_schema.py workflow_api.json --summary-only
# → {"parameter_count": 12, "has_negative_prompt": true, "has_seed": true, ...}

python3 scripts/extract_schema.py workflow_api.json
# → 包含参数、模型依赖、嵌入引用的完整架构
```

### 步骤 3：带参数运行

```bash
# 本地（默认为 http://127.0.0.1:8188）
python3 scripts/run_workflow.py \
  --workflow workflow_api.json \
  --args '{"prompt": "a beautiful sunset over mountains", "seed": -1, "steps": 30}' \
  --output-dir ./outputs

# 云端（只需导出一次 API 密钥；自动使用正确的 /api 路由）
export COMFY_CLOUD_API_KEY="comfyui-..."
python3 scripts/run_workflow.py \
  --workflow workflow_api.json \
  --args '{"prompt": "..."}' \
  --host https://cloud.comfy.org \
  --output-dir ./outputs

# 通过 WebSocket 实时进度（需要 `pip install websocket-client`）
python3 scripts/run_workflow.py \
  --workflow flux_dev.json \
  --args '{"prompt": "..."}' \
  --ws

# 图像到图像 / 修复：传递 --input-image 以自动上传和引用
python3 scripts/run_workflow.py \
  --workflow sdxl_img2img.json \
  --input-image image=./photo.png \
  --args '{"prompt": "make it watercolor", "denoise": 0.6}'

# 批次 / 扫描：8 个随机种子，并行数取决于云层级限制
python3 scripts/run_batch.py \
  --workflow sdxl.json \
  --args '{"prompt": "abstract"}' \
  --count 8 --randomize-seed --parallel 3 \
  --output-dir ./outputs/batch
```

`seed` 设为 `-1`（或配合 `--randomize-seed` 省略它）会为每次运行生成一个
新的随机种子。

### 步骤 4：呈现结果

脚本会将描述每个输出文件的 JSON 输出到标准输出：

```json
{
  "status": "success",
  "prompt_id": "abc-123",
  "outputs": [
    {"file": "./outputs/sdxl_00001_.png", "node_id": "9",
     "type": "image", "filename": "sdxl_00001_.png"}
  ]
}
```

## 决策树

| 用户说 | 工具 | 命令 |
|-----------|------|---------|
| **生命周期（使用 comfy-cli）** | | |
| "安装 ComfyUI" | comfy-cli | `bash scripts/comfyui_setup.sh` |
| "启动 ComfyUI" | comfy-cli | `comfy launch --background` |
| "停止 ComfyUI" | comfy-cli | `comfy stop` |
| "安装 X 节点" | comfy-cli | `comfy node install <name>` |
| "下载 X 模型" | comfy-cli | `comfy model download --url <url> --relative-path models/checkpoints` |
| "列出已安装的模型" | comfy-cli | `comfy model list` |
| "列出已安装的节点" | comfy-cli | `comfy node show installed` |
| **执行（使用脚本）** | | |
| "一切准备就绪了吗？" | 脚本 | `health_check.py`（可选配合 `--workflow X --smoke-test`） |
| "我可以在这个工作流里改什么？" | 脚本 | `extract_schema.py W.json` |
| "检查 W 的依赖是否满足" | 脚本 | `check_deps.py W.json` |
| "修复缺失的依赖" | 脚本 | `auto_fix_deps.py W.json` |
| "生成一张图像" | 脚本 | `run_workflow.py --workflow W --args '{...}'` |
| "使用这张图像"（图像到图像） | 脚本 | `run_workflow.py --input-image image=./x.png ...` |
| "8 个随机种子的变体" | 脚本 | `run_batch.py --count 8 --randomize-seed ...` |
| "给我看实时进度" | 脚本 | `ws_monitor.py --prompt-id <id>` |
| "获取作业 X 的错误信息" | 脚本 | `fetch_logs.py <prompt_id>` |
| **直接 REST** | | |
| "队列里有什么？" | REST | `curl http://HOST:8188/queue`（本地）或 `--host https://cloud.comfy.org` |
| "取消那个" | REST | `curl -X POST http://HOST:8188/interrupt` |
| "释放 GPU 内存" | REST | `curl -X POST http://HOST:8188/free` |

## 设置与入门

当用户要求设置 ComfyUI 时，**首先要问的是
他们想要 Comfy Cloud（托管，零安装，API 密钥）还是本地（在
他们的机器上安装 ComfyUI）**。在他们回答之前，不要开始运行安装命令或硬件
检查。

**官方文档：** https://docs.comfy.org/installation
**CLI 文档：** https://docs.comfy.org/comfy-cli/getting-started
**云文档：** https://docs.comfy.org/get_started/cloud
**云 API：** https://docs.comfy.org/development/cloud/overview

### 步骤 0：询问本地还是云端（总是第一步）

建议的脚本：

> “您是想在本地机器上运行 ComfyUI，还是使用 Comfy Cloud？
>
> - **Comfy Cloud** —— 托管在 RTX 6000 Pro GPU 上，所有常用模型预装，
>   零设置。需要 API 密钥（实际运行工作流需要付费订阅；免费层是只读的）。
>   如果您没有性能足够的 GPU，这是最佳选择。
> - **本地** —— 免费，但您的机器必须满足硬件要求：
>   - NVIDIA GPU，**显存 ≥ 6 GB**（SDXL 需要 ≥ 8 GB，Flux/视频需要 ≥ 12 GB），或者
>   - AMD GPU 支持 ROCm（仅限 Linux），或者
>   - Apple Silicon Mac（M1+），**统一内存 ≥ 16 GB**（推荐 ≥ 32 GB）。
>   - Intel Mac 和没有 GPU 的机器将无法工作 —— 请改用云端。
>
> 您想要哪种？”

路由：

- **云端** → 跳转到**路径 A**。
- **本地** → 先运行硬件检查，然后根据结果从路径 B–E 中选择一个。
- **不确定** → 运行硬件检查，让结果决定。

### 步骤 1：验证硬件（仅当用户选择本地时）

```bash
python3 scripts/hardware_check.py --json
# 可选：也探测 `torch` 以获取实际的 CUDA/MPS：
python3 scripts/hardware_check.py --json --check-pytorch
```

| 结果      | 含义                                                        | 操作 |
|------------|---------------------------------------------------------------|--------|
| `ok`       | 独立显卡显存 ≥ 8 GB 或 Apple Silicon 统一内存 ≥ 32 GB        | 本地安装 —— 使用报告中的 `comfy_cli_flag` |
| `marginal` | SD1.5 可用；SDXL 紧张；Flux/视频不太可能                     | 本地可用于轻量工作流，否则**路径 A（云端）** |
| `cloud`    | 无可用 GPU，显存 &lt;6 GB，Apple 统一内存 &lt;16 GB，Intel Mac，Rosetta Python | **切换到云端**，除非用户明确强制本地 |

脚本还会显示 `wsl: true`（带 NVIDIA 直通的 WSL2）和
`rosetta: true`（Apple Silicon 上的 x86_64 Python —— 必须重新安装为 ARM64）。

如果结果是 `cloud` 但用户想要本地，不要默默继续。
逐字显示 `notes` 数组，并询问他们是否想 (a) 切换到
云端，或 (b) 强制本地安装（在现代模型上会内存不足或慢得无法使用）。

### 选择安装路径

首先使用硬件检查。下表是当用户已经告知其硬件时的后备方案：

| 情况 | 推荐路径 |
|-----------|------------------|
| 硬件检查结果为 `verdict: cloud` | **路径 A: Comfy Cloud** |
| 无 GPU / 想要尝试而无需承诺 | **路径 A: Comfy Cloud** |
| Windows + NVIDIA + 非技术用户 | **路径 B: ComfyUI Desktop** |
| Windows + NVIDIA + 技术用户 | **路径 C: 便携版** 或 **路径 D: comfy-cli** |
| Linux + 任何 GPU | **路径 D: comfy-cli**（最简单） |
| macOS + Apple Silicon | **路径 B: Desktop** 或 **路径 D: comfy-cli** |
| 无头服务器 / 服务器 / CI / 智能体 | **路径 D: comfy-cli** |

对于全自动路径（硬件检查 → 安装 → 启动 → 验证）：

```bash
bash scripts/comfyui_setup.sh
# 或带覆盖参数：
bash scripts/comfyui_setup.sh --m-series --port=8190 --workspace=/data/comfy
```

它内部运行 `hardware_check.py`，当结果为 `cloud` 时会拒绝本地安装
（除非使用 `--force-cloud-override`），选择正确的
`comfy-cli` 标志，并且优先使用 `pipx`/`uvx` 而不是全局 `pip`，以避免污染
系统 Python。

---

### 路径 A: Comfy Cloud（无需本地安装）

适用于没有性能足够 GPU 或想要零设置的用户。托管在 RTX 6000 Pro 上。

**文档：** https://docs.comfy.org/get_started/cloud

1. 在 https://comfy.org/cloud 注册
2. 在 https://platform.comfy.org/login 生成 API 密钥
3. 设置密钥：
   ```bash
   export COMFY_CLOUD_API_KEY="comfyui-xxxxxxxxxxxx"
   ```
4. 运行工作流：
   ```bash
   python3 scripts/run_workflow.py \
     --workflow workflows/flux_dev_txt2img.json \
     --args '{"prompt": "..."}' \
     --host https://cloud.comfy.org \
     --output-dir ./outputs
   ```

**定价：** https://www.comfy.org/cloud/pricing
**并发作业：** 免费/标准版 1 个，创作者版 3 个，专业版 5 个。免费层
**无法通过 API 运行工作流** —— 只能浏览模型。需要付费订阅才能使用 `/api/prompt`、`/api/upload/*`、`/api/view` 等。

---

### 蘭径 B: ComfyUI Desktop（Windows / macOS）

面向非技术用户的一键安装程序。目前为测试版。

**文档：** https://docs.comfy.org/installation/desktop
- **Windows (NVIDIA)：** https://download.comfy.org/windows/nsis/x64
- **macOS (Apple Silicon)：** https://comfy.org

Linux **不支持** Desktop 版 —— 请使用路径 D。

---

### 路径 C: ComfyUI 便携版（仅限 Windows）

**文档：** https://docs.comfy.org/installation/comfyui_portable_windows

从 https://github.com/comfyanonymous/ComfyUI/releases 下载，解压，
运行 `run_nvidia_gpu.bat`。通过 `update/update_comfyui_stable.bat` 更新。

---

### 蘭径 D: comfy-cli（所有平台 —— 推荐智能体使用）

官方 CLI 是无头/自动化设置的最佳路径。

**文档：** https://docs.comfy.org/comfy-cli/getting-started

#### 安装 comfy-cli

```bash
# 推荐：
pipx install comfy-cli
# 或者使用 uvx 无需安装：
uvx --from comfy-cli comfy --help
# 或者（如果 pipx/uvx 不可用）：
pip install --user comfy-cli
```

非交互式禁用分析：
```bash
comfy --skip-prompt tracking disable
```

#### 安装 ComfyUI

```bash
comfy --skip-prompt install --nvidia              # NVIDIA (CUDA)
comfy --skip-prompt install --amd                 # AMD (ROCm, Linux)
comfy --skip-prompt install --m-series            # Apple Silicon (MPS)
comfy --skip-prompt install --cpu                 # 仅 CPU（慢）
comfy --skip-prompt install --nvidia --fast-deps  # 基于 uv 的依赖解析
```

默认位置：`~/comfy/ComfyUI`（Linux），`~/Documents/comfy/ComfyUI`
（macOS/Windows）。使用 `comfy --workspace /custom/path install` 覆盖。

#### 启动 / 验证

```bash
comfy launch --background                       # 后台守护进程，端口 :8188
comfy launch -- --listen 0.0.0.0 --port 8190    # 局域网可访问的自定义端口
curl -s http://127.0.0.1:8188/system_stats      # 健康检查
```

---

### 蘭径 E: 手动安装（高级 / 不受支持的硬件）

适用于 Ascend NPU、寒武纪 MLU、Intel Arc 或其他不受支持的硬件。

**文档：** https://docs.comfy.org/installation/manual_install

```bash
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu130
pip install -r requirements.txt
python main.py
```

---

### 安装后：下载模型

```bash
# SDXL（通用，约 6.5 GB）
comfy model download \
  --url "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors" \
  --relative-path models/checkpoints

# SD 1.5（更轻量，约 4 GB，适用于 6 GB 显存显卡）
comfy model download \
  --url "https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors" \
  --relative-path models/checkpoints

# Flux Dev fp8（较小变体，约 12 GB）
comfy model download \
  --url "https://huggingface.co/Comfy-Org/flux1-dev/resolve/main/flux1-dev-fp8.safetensors" \
  --relative-path models/checkpoints

# CivitAI（需先设置令牌）：
comfy model download \
  --url "https://civitai.com/api/download/models/128713" \
  --relative-path models/checkpoints \
  --set-civitai-api-token "YOUR_TOKEN"
```

列出已安装的模型：`comfy model list`。

### 安装后：安装自定义节点

```bash
comfy node install comfyui-impact-pack             # 流行的实用工具包
comfy node install comfyui-animatediff-evolved     # 视频生成
comfy node install comfyui-controlnet-aux          # ControlNet 预处理器
comfy node install comfyui-essentials              # 常用辅助工具
comfy node update all
comfy node install-deps --workflow=workflow.json   # 安装工作流所需的一切
```

### 安装后：验证

```bash
python3 scripts/health_check.py
# → comfy_cli 在 PATH 中？服务器可达？检查点？冒烟测试？

python3 scripts/check_deps.py my_workflow.json
# → 这个工作流的节点/模型/嵌入都安装好了吗？

python3 scripts/run_workflow.py \
  --workflow workflows/sd15_txt2img.json \
  --args '{"prompt": "test", "steps": 4}' \
  --output-dir ./test-outputs
```

## 图像上传（img2img / 局部重绘）

最简单的方法是使用 `--input-image` 配合 `run_workflow.py`：

```bash
python3 scripts/run_workflow.py \
  --workflow workflows/sdxl_img2img.json \
  --input-image image=./photo.png \
  --args '{"prompt": "make it cyberpunk", "denoise": 0.6}'
```

此标志会上传 `photo.png`，然后将其服务端文件名注入到架构参数中名为 `image` 的任何参数中。对于局部重绘，需要传递两者：

```bash
python3 scripts/run_workflow.py \
  --workflow workflows/sdxl_inpaint.json \
  --input-image image=./photo.png \
  --input-image mask_image=./mask.png \
  --args '{"prompt": "fill with flowers"}'
```

通过 REST 手动上传：
```bash
curl -X POST "http://127.0.0.1:8188/upload/image" \
  -F "image=@photo.png" -F "type=input" -F "overwrite=true"
# 返回：{"name": "photo.png", "subfolder": "", "type": "input"}

# 云端等效命令：
curl -X POST "https://cloud.comfy.org/api/upload/image" \
  -H "X-API-Key: $COMFY_CLOUD_API_KEY" \
  -F "image=@photo.png" -F "type=input" -F "overwrite=true"
```

## 云端特定事项

- **基础 URL：** `https://cloud.comfy.org`
- **认证：** `X-API-Key` 头信息（或 WebSocket 使用 `?token=KEY`）
- **API 密钥：** 一次性设置 `$COMFY_CLOUD_API_KEY`，脚本将自动获取。
- **输出下载：** `/api/view` 返回一个 302 重定向到签名的 URL；脚本会自动跟踪，并在从存储后端获取前剥离 `X-API-Key`（避免将 API 密钥泄露给 S3/CloudFront）。
- **与本地 ComfyUI 的端点差异：**
  - `/api/object_info`, `/api/queue`, `/api/userdata` — **在免费层返回 403**；仅付费用户可用。
  - 云端将 `/history` 重命名为 `/history_v2`（脚本会自动路由）。
  - 云端将 `/models/<folder>` 重命名为 `/experiment/models/<folder>`（脚本会自动路由）。
  - WebSocket 中的 `clientId` 当前被忽略 — 用户的所有连接接收相同的广播。请在客户端通过 `prompt_id` 进行过滤。
  - 上传时接受 `subfolder` 参数但会被忽略 — 云端采用扁平化命名空间。
- **并发作业：** 免费版/标准版：1，创建者版：3，专业版：5。额外任务会自动排队。使用 `run_batch.py --parallel N` 来充分利用您的服务等级。

## 队列与系统管理

```bash
# 本地
curl -s http://127.0.0.1:8188/queue | python3 -m json.tool
curl -X POST http://127.0.0.1:8188/queue -d '{"clear": true}'    # 取消待处理任务
curl -X POST http://127.0.0.1:8188/interrupt                      # 取消正在运行的任务
curl -X POST http://127.0.0.1:8188/free \
  -H "Content-Type: application/json" \
  -d '{"unload_models": true, "free_memory": true}'

# 云端 — 在 /api/ 下相同的路径，另外：
python3 scripts/fetch_logs.py --tail-queue --host https://cloud.comfy.org
```

## 常见陷阱

1.  **需要 API 格式** — 每个脚本以及 `/api/prompt` 端点都期望 API 格式的工作流 JSON。脚本可以检测编辑器格式（顶层的 `nodes` 和 `links` 数组），并会提示您通过 "Workflow → Export (API)"（新版 UI）或 "Save (API Format)"（旧版 UI）重新导出。

2.  **服务器必须运行** — 所有执行都需要一个实时服务器。`comfy launch --background` 可以启动一个。使用 `curl http://127.0.0.1:8188/system_stats` 验证。

3.  **模型名称必须精确** — 区分大小写，包括文件扩展名。`check_deps.py` 会进行模糊匹配（带或不带扩展名和文件夹前缀），但工作流本身必须使用规范名称。使用 `comfy model list` 来发现已安装的模型。

4.  **缺失自定义节点** — "class_type not found" 表示所需节点未安装。`check_deps.py` 会报告需要安装哪个包；`auto_fix_deps.py` 会为您运行安装。

5.  **工作目录** — `comfy-cli` 会自动检测 ComfyUI 工作区。如果命令失败并提示 "no workspace found"，请使用 `comfy --workspace /path/to/ComfyUI <command>` 或 `comfy set-default /path/to/ComfyUI`。

6.  **云端免费层 API 限制** — `/api/prompt`, `/api/view`, `/api/upload/*`, `/api/object_info` 在免费账户上都返回 403。`health_check.py` 和 `check_deps.py` 会优雅地处理此情况并给出明确提示。

7.  **视频/音频工作流超时** — 当输出节点是 `VHS_VideoCombine`、`SaveVideo` 等时会自动检测；默认超时从 300 秒增加到 900 秒。可通过 `--timeout 1800` 显式覆盖。

8.  **输出文件名中的路径遍历** — 服务器提供的文件名会通过 `safe_path_join` 处理，拒绝任何逃逸 `--output-dir` 的路径。请保持此保护开启 — 带有自定义保存节点的工作流可能产生任意路径。

9.  **工作流 JSON 是任意代码** — 自定义节点运行 Python 代码，因此提交未知工作流的风险与 `eval` 相同。在运行前请检查来自不受信任来源的工作流。

10. **自动随机种子** — 在 `--args` 中传递 `seed: -1`（或使用 `--randomize-seed` 并省略 seed）可为每次运行获取一个新种子。实际种子会记录到标准错误输出。

11. **`tracking` 提示** — 首次运行 `comfy` 时可能会提示进行分析。使用 `comfy --skip-prompt tracking disable` 以非交互方式跳过。`comfyui_setup.sh` 会为您完成此操作。

## 验证清单

使用 `python3 scripts/health_check.py` 可一次运行整个清单。手动检查：

- [ ] `hardware_check.py` 判定为 `ok` 或用户明确选择了 Comfy Cloud
- [ ] `comfy --version` 有效（或 `uvx --from comfy-cli comfy --help`）
- [ ] `curl http://HOST:PORT/system_stats` 返回 JSON
- [ ] `comfy model list` 显示至少一个 checkpoint（本地）或 `/api/experiment/models/checkpoints` 返回模型（云端）
- [ ] 工作流 JSON 为 API 格式
- [ ] `check_deps.py` 报告 `is_ready: true`（或在云端免费层仅显示 `node_check_skipped`）
- [ ] 使用小型工作流进行测试运行完成；输出文件位于 `--output-dir` 目录中