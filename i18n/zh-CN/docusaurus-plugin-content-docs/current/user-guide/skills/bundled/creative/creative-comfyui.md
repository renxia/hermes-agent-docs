---
title: "Comfyui"
sidebar_label: "Comfyui"
description: "使用 ComfyUI 生成图像、视频和音频——安装、启动、管理节点/模型、运行带参数注入的工作流"
---

{/* 此页面由网站脚本 scripts/generate-skill-docs.py 从技能文件 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Comfyui

使用 ComfyUI 生成图像、视频和音频——安装、启动、管理节点/模型、运行带参数注入的工作流。使用官方 comfy-cli 进行生命周期管理，并使用直接的 REST/WebSocket API 进行执行。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/creative/comfyui` |
| 版本 | `5.1.0` |
| 作者 | ['kshitijk4poor', 'alt-glitch', 'purzbeats'] |
| 许可证 | MIT |
| 平台 | macos, linux, windows |
| 标签 | `comfyui`, `图像生成`, `stable-diffusion`, `flux`, `sd3`, `wan-video`, `hunyuan-video`, `创意`, `生成式人工智能`, `视频生成` |
| 相关技能 | [`stable-diffusion-image-generation`](/docs/user-guide/skills/optional/mlops/mlops-stable-diffusion), `image_gen` |

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# ComfyUI

通过 ComfyUI 生成图像、视频、音频和 3D 内容，使用官方 `comfy-cli` 进行设置/生命周期管理，以及直接使用 REST/WebSocket API 进行工作流执行。

## 技能内容

**参考文档 (`references/`)：**

- `official-cli.md` — 每个 `comfy ...` 命令及其标志
- `rest-api.md` — REST + WebSocket 端点（本地 + 云端），负载模式
- `workflow-format.md` — API 格式 JSON、常见节点类型、参数映射
- `template-integrity.md` — 将 `comfyui-workflow-templates` 从编辑器格式转换为 API 格式：绕过重路由、带点的动态输入键（`values.a`、`resize_type.width`）、云端特性（302 重定向、1 个并发免费层任务、1080p VRAM 限制）、Discord 兼容的 ffmpeg 拼接。由 [@purzbeats](https://github.com/purzbeats) 编写。当您从官方模板开始时请加载此文件。

**脚本 (`scripts/`)：**

| 脚本 | 用途 |
|------|------|
| `_common.py` | 共享的 HTTP、云端路由、节点目录（不要直接运行） |
| `hardware_check.py` | 探测 GPU/VRAM/磁盘 → 推荐本地运行或 Comfy Cloud |
| `comfyui_setup.sh` | 硬件检查 + comfy-cli + ComfyUI 安装 + 启动 + 验证 |
| `extract_schema.py` | 读取工作流 → 列出可控制的参数 + 模型依赖项 |
| `check_deps.py` | 根据运行中的服务器检查工作流 → 列出缺失的节点/模型 |
| `auto_fix_deps.py` | 运行 check_deps 然后执行 `comfy node install` / `comfy model download` |
| `run_workflow.py` | 注入参数、提交、监控、下载输出（HTTP 或 WS） |
| `run_batch.py` | 使用扫描参数提交工作流 N 次，并行度取决于您的等级 |
| `ws_monitor.py` | 用于执行任务的实时 WebSocket 查看器（实时进度） |
| `health_check.py` | 验证清单运行器 — comfy-cli + 服务器 + 模型 + 冒烟测试 |
| `fetch_logs.py` | 拉取给定 prompt_id 的回溯/状态消息 |

**示例工作流 (`workflows/`)：** SD 1.5、SDXL、Flux Dev、SDXL img2img、SDXL 修复、ESRGAN 放大、AnimateDiff 视频、Wan T2V。参见 `workflows/README.md`。

## 何时使用

- 用户要求使用 Stable Diffusion、SDXL、Flux、SD3 等生成图像。
- 用户想运行特定的 ComfyUI 工作流文件。
- 用户想链接生成步骤（txt2img → 放大 → 人脸修复）。
- 用户需要 ControlNet、修复、img2img 或其他高级流程。
- 用户要求管理 ComfyUI 队列、检查模型或安装自定义节点。
- 用户想通过 AnimateDiff、Hunyuan、Wan、AudioCraft 等进行视频/音频/3D 生成。

## 架构：两层

<!-- ascii-guard-ignore -->
```
┌─────────────────────────────────────────────────────┐
│ 层 1: comfy-cli（官方生命周期工具）                 │
│   设置、服务器生命周期、自定义节点、模型             │
│   → comfy install / launch / stop / node / model    │
└─────────────────────────┬───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│ 层 2: REST/WebSocket API + 技能脚本                 │
│   工作流执行、参数注入、监控                         │
│   POST /api/prompt, GET /api/view, WS /ws           │
│   → run_workflow.py, run_batch.py, ws_monitor.py    │
└─────────────────────────────────────────────────────┘
```
<!-- ascii-guard-ignore-end -->

**为什么是两层？** 官方 CLI 非常适合安装和服务器管理，但对工作流执行的支持有限。REST/WS API 填补了这一空白——脚本处理 CLI 不提供的参数注入、执行监控和输出下载。

## 快速入门

### 检测环境

```bash
# 有哪些可用？
command -v comfy >/dev/null 2>&1 && echo "comfy-cli: installed"
curl -s http://127.0.0.1:8188/system_stats 2>/dev/null && echo "server: running"

# 这台机器能在本地运行 ComfyUI 吗？（GPU/VRAM/磁盘检查）
python3 scripts/hardware_check.py
```

如果什么都没安装，请参见下方的 **设置与入门** — 但务必先运行硬件检查。

### 一行式健康检查

```bash
python3 scripts/health_check.py
# → JSON: comfy_cli 在 PATH 上？服务器可达？至少有一个检查点？冒烟测试通过？
```

## 核心工作流

### 步骤 1：获取 API 格式的工作流 JSON

工作流必须为 API 格式（每个节点都有 `class_type`）。它们来自：

- ComfyUI 网页 UI → **工作流 → 导出 (API)**（较新 UI）或旧版的 "Save (API Format)" 按钮（较旧 UI）
- 本技能的 `workflows/` 目录（即用型示例）
- 社区下载（civitai、Reddit、Discord）— 通常是编辑器格式，必须加载到 ComfyUI 然后重新导出

编辑器格式（顶层 `nodes` 和 `links` 数组）**不可直接执行**。脚本会检测此情况并告知您重新导出。

### 步骤 2：查看可控制内容

```bash
python3 scripts/extract_schema.py workflow_api.json --summary-only
# → {"parameter_count": 12, "has_negative_prompt": true, "has_seed": true, ...}

python3 scripts/extract_schema.py workflow_api.json
# → 包含参数、模型依赖项、嵌入引用的完整模式
```

### 步骤 3：使用参数运行

```bash
# 本地（默认 http://127.0.0.1:8188）
python3 scripts/run_workflow.py \
  --workflow workflow_api.json \
  --args '{"prompt": "美丽的日落照耀群山", "seed": -1, "steps": 30}' \
  --output-dir ./outputs

# 云端（一次性导出 API 密钥；自动使用正确的 /api 路由）
export COMFY_CLOUD_API_KEY="comfyui-..."
python3 scripts/run_workflow.py \
  --workflow workflow_api.json \
  --args '{"prompt": "..."}' \
  --host https://cloud.comfy.org \
  --output-dir ./outputs

# 通过 WebSocket 实时查看进度（需要 `pip install websocket-client`）
python3 scripts/run_workflow.py \
  --workflow flux_dev.json \
  --args '{"prompt": "..."}' \
  --ws

# img2img / 修复：传递 --input-image 以自动上传和引用
python3 scripts/run_workflow.py \
  --workflow sdxl_img2img.json \
  --input-image image=./photo.png \
  --args '{"prompt": "使其成为水彩画", "denoise": 0.6}'

# 批量/扫描：8 个随机种子，并行度最高可达云端等级限制
python3 scripts/run_batch.py \
  --workflow sdxl.json \
  --args '{"prompt": "抽象"}' \
  --count 8 --randomize-seed --parallel 3 \
  --output-dir ./outputs/batch
```

`seed` 使用 `-1`（或省略它并加上 `--randomize-seed`）会为每次运行生成一个新的随机种子。

### 步骤 4：呈现结果

脚本会向标准输出发出描述每个输出文件的 JSON：

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
|--------|------|------|
| **生命周期（使用 comfy-cli）** | | |
| "安装 ComfyUI" | comfy-cli | `bash scripts/comfyui_setup.sh` |
| "启动 ComfyUI" | comfy-cli | `comfy launch --background` |
| "停止 ComfyUI" | comfy-cli | `comfy stop` |
| "安装 X 节点" | comfy-cli | `comfy node install <name>` |
| "下载 X 模型" | comfy-cli | `comfy model download --url <url> --relative-path models/checkpoints` |
| "列出已安装的模型" | comfy-cli | `comfy model list` |
| "列出已安装的节点" | comfy-cli | `comfy node show installed` |
| **执行（使用脚本）** | | |
| "一切都准备好了吗？" | 脚本 | `health_check.py`（可选 `--workflow X --smoke-test`） |
| "我可以在这个工作流中改变什么？" | 脚本 | `extract_schema.py W.json` |
| "检查 W 的依赖项是否满足" | 脚本 | `check_deps.py W.json` |
| "修复缺失的依赖项" | 脚本 | `auto_fix_deps.py W.json` |
| "生成一张图像" | 脚本 | `run_workflow.py --workflow W --args '{...}'` |
| "使用这张图像"（img2img） | 脚本 | `run_workflow.py --input-image image=./x.png ...` |
| "8 个随机种子的变体" | 脚本 | `run_batch.py --count 8 --randomize-seed ...` |
| "显示实时进度" | 脚本 | `ws_monitor.py --prompt-id <id>` |
| "获取任务 X 的错误" | 脚本 | `fetch_logs.py <prompt_id>` |
| **直接 REST** | | |
| "队列里有什么？" | REST | `curl http://HOST:8188/queue`（本地）或 `--host https://cloud.comfy.org` |
| "取消那个" | REST | `curl -X POST http://HOST:8188/interrupt` |
| "释放 GPU 内存" | REST | `curl -X POST http://HOST:8188/free` |

## 设置与入门

当用户要求设置 ComfyUI 时，**首先要询问他们想要 Comfy Cloud（托管，零安装，API 密钥）还是本地（在他们的机器上安装 ComfyUI）**。在他们回答之前，不要开始运行安装命令或硬件检查。

**官方文档：** https://docs.comfy.org/installation
**CLI 文档：** https://docs.comfy.org/comfy-cli/getting-started
**云端文档：** https://docs.comfy.org/get_started/cloud
**云端 API：** https://docs.comfy.org/development/cloud/overview

### 步骤 0：询问本地还是云端（始终优先）

建议脚本：

> "您想在自己的机器上本地运行 ComfyUI，还是使用 Comfy Cloud？
>
> - **Comfy Cloud** — 托管在 RTX 6000 Pro GPU 上，所有常用模型预装，零设置。需要 API 密钥（实际运行工作流需要付费订阅；免费层为只读）。最适合没有强大 GPU 的用户。
> - **本地** — 免费，但您的机器必须满足硬件要求：
>   - **≥6 GB VRAM** 的 NVIDIA GPU（SDXL 需要 ≥8 GB，Flux/视频需要 ≥12 GB），或者
>   - 支持 ROCm 的 AMD GPU（Linux），或者
>   - **≥16 GB 统一内存**（推荐 ≥32 GB）的 Apple Silicon Mac（M1+）。
>   - Intel Mac 和没有 GPU 的机器将无法工作——请改用云端。
>
> 您想选哪个？"

路由：

- **云端** → 跳转到 **路径 A**。
- **本地** → 先运行硬件检查，然后根据结果从路径 B–E 中选择一条路径。
- **不确定** → 运行硬件检查，让结果决定。

### 步骤 1：验证硬件（仅当用户选择本地时）

```bash
python3 scripts/hardware_check.py --json
# 可选：也探测 `torch` 以获取实际的 CUDA/MPS：
python3 scripts/hardware_check.py --json --check-pytorch
```

| 结论 | 含义 | 操作 |
|------|------|------|
| `ok` | ≥8 GB VRAM（独立）或 ≥32 GB 统一内存（Apple Silicon） | 本地安装 — 使用报告中的 `comfy_cli_flag` |
| `marginal` | SD1.5 可用；SDXL 紧张；Flux/视频不太可能 | 本地适用于轻量级工作流，否则 **路径 A（云端）** |
| `cloud` | 没有可用 GPU，&lt;6 GB VRAM，&lt;16 GB Apple 统一内存，Intel Mac，Rosetta Python | **切换到云端**，除非用户明确强制本地 |

脚本还会显示 `wsl: true`（带 NVIDIA 直通的 WSL2）和 `rosetta: true`（Apple Silicon 上的 x86_64 Python — 必须重新安装为 ARM64）。

如果结论是 `cloud` 但用户想要本地，不要默默继续。逐字显示 `notes` 数组，并询问他们是否想 (a) 切换到云端或 (b) 强制本地安装（在现代模型上会内存不足或慢得无法使用）。

### 选择安装路径

先使用硬件检查。下表是当用户已经告知硬件时的后备方案：

| 情况 | 推荐路径 |
|------|----------|
| 硬件检查结果为 `verdict: cloud` | **路径 A：Comfy Cloud** |
| 没有 GPU / 想无承诺尝试 | **路径 A：Comfy Cloud** |
| Windows + NVIDIA + 非技术用户 | **路径 B：ComfyUI Desktop** |
| Windows + NVIDIA + 技术用户 | **路径 C：Portable** 或 **路径 D：comfy-cli** |
| Linux + 任何 GPU | **路径 D：comfy-cli**（最简单） |
| macOS + Apple Silicon | **路径 B：Desktop** 或 **路径 D：comfy-cli** |
| 无头 / 服务器 / CI / 智能体 | **路径 D：comfy-cli** |

对于完全自动化的路径（硬件检查 → 安装 → 启动 → 验证）：

```bash
bash scripts/comfyui_setup.sh
# 或使用覆盖参数：
bash scripts/comfyui_setup.sh --m-series --port=8190 --workspace=/data/comfy
```

它内部运行 `hardware_check.py`，当结论为 `cloud` 时拒绝本地安装（除非 `--force-cloud-override`），选择正确的 `comfy-cli` 标志，并首选 `pipx`/`uvx` 而不是全局 `pip` 以避免污染系统 Python。

---

### 路径 A：Comfy Cloud（无本地安装）

适用于没有强大 GPU 或希望零设置的用户。托管在 RTX 6000 Pro 上。

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
**并发任务：** 免费/标准版 1 个，创作者版 3 个，专业版 5 个。免费层**无法通过 API 运行工作流** — 只能浏览模型。运行 `/api/prompt`、`/api/upload/*`、`/api/view` 等需要付费订阅。

---

### 路径 B：ComfyUI Desktop（Windows / macOS）

适用于非技术用户的一键安装程序。目前为 Beta 版。

**文档：** https://docs.comfy.org/installation/desktop
- **Windows (NVIDIA)：** https://download.comfy.org/windows/nsis/x64
- **macOS (Apple Silicon)：** https://comfy.org

Desktop **不支持** Linux — 请使用路径 D。

---

### 路径 C：ComfyUI Portable（仅限 Windows）

**文档：** https://docs.comfy.org/installation/comfyui_portable_windows

从 https://github.com/comfyanonymous/ComfyUI/releases 下载，解压，运行 `run_nvidia_gpu.bat`。通过 `update/update_comfyui_stable.bat` 更新。

---

### 路径 D：comfy-cli（所有平台 — 智能体推荐）

官方 CLI 是无头/自动化设置的最佳路径。

**文档：** https://docs.comfy.org/comfy-cli/getting-started

#### 安装 comfy-cli

```bash
# 推荐：
pipx install comfy-cli
# 或使用 uvx 无需安装：
uvx --from comfy-cli comfy --help
# 或（如果 pipx/uvx 不可用）：
pip install --user comfy-cli
```

以非交互方式禁用分析：
```bash
comfy --skip-prompt tracking disable
```

#### 安装 ComfyUI

```bash
comfy --skip-prompt install --nvidia              # NVIDIA (CUDA)
comfy --skip-prompt install --amd                 # AMD (ROCm, Linux)
comfy --skip-prompt install --m-series            # Apple Silicon (MPS)
comfy --skip-prompt install --cpu                 # 仅 CPU（慢）
comfy --skip-prompt install --nvidia --fast-deps  # 基于 uv 的依赖项解析
```

默认位置：`~/comfy/ComfyUI`（Linux），`~/Documents/comfy/ComfyUI`（macOS/Win）。使用 `comfy --workspace /custom/path install` 覆盖。

#### 启动 / 验证

```bash
comfy launch --background                       # 在 :8188 上运行后台守护进程
comfy launch -- --listen 0.0.0.0 --port 8190    # 可通过局域网访问的自定义端口
curl -s http://127.0.0.1:8188/system_stats      # 健康检查
```

---

### 路径 E：手动安装（高级 / 不支持的硬件）

适用于 Ascend NPU、寒武纪 MLU、Intel Arc 或其他不支持的硬件。

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

# SD 1.5（更轻量，约 4 GB，适合 6 GB 显卡）
comfy model download \
  --url "https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors" \
  --relative-path models/checkpoints

# Flux Dev fp8（较小变体，约 12 GB）
comfy model download \
  --url "https://huggingface.co/Comfy-Org/flux1-dev/resolve/main/flux1-dev-fp8.safetensors" \
  --relative-path models/checkpoints

# CivitAI（先设置令牌）：
comfy model download \
  --url "https://civitai.com/api/download/models/128713" \
  --relative-path models/checkpoints \
  --set-civitai-api-token "YOUR_TOKEN"
```

列出已安装：`comfy model list`。

### 安装后：安装自定义节点

```bash
comfy node install comfyui-impact-pack             # 流行的实用工具包
comfy node install comfyui-animatediff-evolved     # 视频生成
comfy node install comfyui-controlnet-aux          # ControlNet 预处理器
comfy node install comfyui-essentials              # 常见辅助工具
comfy node update all
comfy node install-deps --workflow=workflow.json   # 安装工作流所需的一切
```

### 安装后：验证

```bash
python3 scripts/health_check.py
# → comfy_cli 在 PATH 上？服务器可达？检查点？冒烟测试？

python3 scripts/check_deps.py my_workflow.json
# → 这个工作流的节点/模型/嵌入都安装好了吗？

python3 scripts/run_workflow.py \
  --workflow workflows/sd15_txt2img.json \
  --args '{"prompt": "测试", "steps": 4}' \
  --output-dir ./test-outputs
```

## 图像上传 (img2img / 内绘)

最简单的方式是使用 `--input-image` 参数配合 `run_workflow.py`：

```bash
python3 scripts/run_workflow.py \
  --workflow workflows/sdxl_img2img.json \
  --input-image image=./photo.png \
  --args '{"prompt": "make it cyberpunk", "denoise": 0.6}'
```

该标志会上传 `photo.png`，然后将其服务器端文件名注入到模式参数中名为 `image` 的字段。对于内绘，需要同时传递：

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
# 返回: {"name": "photo.png", "subfolder": "", "type": "input"}

# 云端等效命令：
curl -X POST "https://cloud.comfy.org/api/upload/image" \
  -H "X-API-Key: $COMFY_CLOUD_API_KEY" \
  -F "image=@photo.png" -F "type=input" -F "overwrite=true"
```

## 云端详情

- **基础 URL:** `https://cloud.comfy.org`
- **认证:** `X-API-Key` 请求头 (或 WebSocket 使用 `?token=KEY`)
- **API 密钥:** 只需设置一次 `$COMFY_CLOUD_API_KEY`，脚本会自动读取
- **输出下载:** `/api/view` 返回 302 重定向到一个带签名的 URL；脚本会自动跟随并从存储后端获取数据前移除 `X-API-Key` (避免 API 密钥泄露到 S3/CloudFront)。
- **与本地 ComfyUI 的端点差异：**
  - `/api/object_info`、`/api/queue`、`/api/userdata` — **免费层返回 403**；仅限付费用户。
  - `/history` 在云端重命名为 `/history_v2` (脚本会自动路由)。
  - `/models/<folder>` 在云端重命名为 `/experiment/models/<folder>` (脚本会自动路由)。
  - WebSocket 中的 `clientId` 目前被忽略 — 同一用户的所有连接接收相同的广播。需要在客户端通过 `prompt_id` 进行过滤。
  - 上传时接受 `subfolder` 参数但会被忽略 — 云端使用扁平化命名空间。
- **并发任务:** 免费版/标准版: 1 个，创作者版: 3 个，专业版: 5 个。超额任务会自动排队。使用 `run_batch.py --parallel N` 来充分利用您所在层级的并发能力。

## 队列与系统管理

```bash
# 本地
curl -s http://127.0.0.1:8188/queue | python3 -m json.tool
curl -X POST http://127.0.0.1:8188/queue -d '{"clear": true}'    # 取消等待中的任务
curl -X POST http://127.0.0.1:8188/interrupt                      # 取消正在运行的任务
curl -X POST http://127.0.0.1:8188/free \
  -H "Content-Type: application/json" \
  -d '{"unload_models": true, "free_memory": true}'

# 云端 — 路径相同，但在 /api/ 下，另外：
python3 scripts/fetch_logs.py --tail-queue --host https://cloud.comfy.org
```

## 常见陷阱

1.  **需要 API 格式** — 每个脚本和 `/api/prompt` 端点都需要 API 格式的工作流 JSON。脚本会检测编辑器格式（顶层的 `nodes` 和 `links` 数组），并提示您通过“工作流 → 导出 (API)”（新版 UI）或“保存 (API 格式)”（旧版 UI）重新导出。
2.  **服务器必须运行** — 所有执行都依赖运行中的服务器。`comfy launch --background` 可启动服务器。使用 `curl http://127.0.0.1:8188/system_stats` 验证。
3.  **模型名称必须精确** — 区分大小写，包含文件扩展名。`check_deps.py` 进行模糊匹配（有无扩展名和文件夹前缀），但工作流本身必须使用规范名称。使用 `comfy model list` 查看已安装的模型。
4.  **缺少自定义节点** — “class_type not found” 表示所需节点未安装。`check_deps.py` 会报告需要安装的包；`auto_fix_deps.py` 可为您执行安装。
5.  **工作目录** — `comfy-cli` 会自动检测 ComfyUI 工作区。如果命令因“no workspace found”失败，请使用 `comfy --workspace /path/to/ComfyUI <command>` 或设置默认工作区 `comfy set-default /path/to/ComfyUI`。
6.  **云端免费层 API 限制** — `/api/prompt`、`/api/view`、`/api/upload/*`、`/api/object_info` 在免费账户上均返回 403。`health_check.py` 和 `check_deps.py` 会妥善处理此情况并给出清晰提示。
7.  **视频/音频工作流超时** — 当输出节点是 `VHS_VideoCombine`、`SaveVideo` 等时，会自动检测；默认超时时间从 300 秒跳转至 900 秒。可使用 `--timeout 1800` 显式覆盖。
8.  **输出文件名的路径遍历风险** — 服务器提供的文件名会经过 `safe_path_join` 处理，以拒绝任何试图逃逸 `--output-dir` 的路径。请保持此保护开启 — 带有自定义保存节点的工作流可能产生任意路径。
9.  **工作流 JSON 可执行任意代码** — 自定义节点运行 Python，因此提交未知工作流与 `eval` 的信任风险相同。运行来自不可信来源的工作流前请先检查。
10. **自动随机化种子** — 在 `--args` 中传递 `seed: -1` (或使用 `--randomize-seed` 并省略种子参数)，以获得每次运行的新种子。实际使用的种子会记录到 stderr。
11. **`tracking` 提示** — `comfy` 首次运行时可能会提示您是否同意进行使用分析。使用 `comfy --skip-prompt tracking disable` 以非交互方式跳过。`comfyui_setup.sh` 脚本会为您处理此操作。

## 验证清单

使用 `python3 scripts/health_check.py` 一次运行所有检查项。手动检查：

- [ ] `hardware_check.py` 结论为 `ok` 或用户明确选择了 Comfy Cloud
- [ ] `comfy --version` 可用 (或 `uvx --from comfy-cli comfy --help`)
- [ ] `curl http://HOST:PORT/system_stats` 返回 JSON
- [ ] `comfy model list` 显示至少一个 checkpoint (本地) 或 `/api/experiment/models/checkpoints` 返回模型列表 (云端)
- [ ] 工作流 JSON 为 API 格式
- [ ] `check_deps.py` 报告 `is_ready: true` (或在云端免费层仅为 `node_check_skipped`)
- [ ] 使用小型工作流测试运行成功；输出文件位于 `--output-dir` 目录下