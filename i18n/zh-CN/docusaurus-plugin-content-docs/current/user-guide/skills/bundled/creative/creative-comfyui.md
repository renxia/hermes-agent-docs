---
title: "Comfyui"
sidebar_label: "Comfyui"
description: "使用 ComfyUI 生成图像、视频和音频 — 安装、启动、管理节点/模型，通过参数注入运行工作流"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Comfyui

使用 ComfyUI 生成图像、视频和音频 — 安装、启动、管理节点/模型，通过参数注入运行工作流。使用官方的 comfy-cli 进行生命周期管理，并通过直接的 REST/WebSocket API 执行。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/creative/comfyui` |
| 版本 | `5.0.0` |
| 作者 | ['kshitijk4poor', 'alt-glitch'] |
| 许可证 | MIT |
| 平台 | macos, linux, windows |
| 标签 | `comfyui`, `image-generation`, `stable-diffusion`, `flux`, `sd3`, `wan-video`, `hunyuan-video`, `creative`, `generative-ai`, `video-generation` |
| 相关技能 | [`stable-diffusion-image-generation`](/docs/user-guide/skills/optional/mlops/mlops-stable-diffusion), `image_gen` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# ComfyUI

通过 ComfyUI 生成图像、视频、音频和 3D 内容，使用官方的 `comfy-cli` 进行设置/生命周期管理，并通过直接的 REST/WebSocket API 执行工作流。

## 此技能包含的内容

**参考文档 (`references/`):**

- `official-cli.md` — 每个 `comfy ...` 命令及其标志
- `rest-api.md` — REST + WebSocket 端点（本地 + 云端），载荷架构
- `workflow-format.md` — API 格式 JSON，常见节点类型，参数映射

**脚本 (`scripts/`):**

| 脚本 | 用途 |
|--------|---------|
| `_common.py` | 共享 HTTP、云端路由、节点目录（不要直接运行） |
| `hardware_check.py` | 探测 GPU/显存/磁盘 → 推荐本地或 Comfy Cloud |
| `comfyui_setup.sh` | 硬件检查 + comfy-cli + ComfyUI 安装 + 启动 + 验证 |
| `extract_schema.py` | 读取工作流 → 列出可控参数 + 模型依赖 |
| `check_deps.py` | 检查工作流与运行中的服务器 → 列出缺失的节点/模型 |
| `auto_fix_deps.py` | 运行 check_deps，然后执行 `comfy node install` / `comfy model download` |
| `run_workflow.py` | 注入参数、提交、监控、下载输出（HTTP 或 WS） |
| `run_batch.py` | 使用参数扫描提交工作流 N 次，并行度最高可达您的套餐限制 |
| `ws_monitor.py` | 执行任务的实时 WebSocket 查看器（实时进度） |
| `health_check.py` | 验证清单运行器 — comfy-cli + 服务器 + 模型 + 冒烟测试 |
| `fetch_logs.py` | 拉取指定 prompt_id 的回溯/状态消息 |

**示例工作流 (`workflows/`):** SD 1.5、SDXL、Flux Dev、SDXL 图生图、SDXL 内绘、ESRGAN 超分、AnimateDiff 视频、Wan T2V。参见 `workflows/README.md`。

## 何时使用

- 用户要求使用 Stable Diffusion、SDXL、Flux、SD3 等生成图像
- 用户想要运行特定的 ComfyUI 工作流文件
- 用户想要链接生成步骤（文生图 → 超分 → 人脸修复）
- 用户需要 ControlNet、内绘、图生图或其他高级管线
- 用户要求管理 ComfyUI 队列、检查模型或安装自定义节点
- 用户想要通过 AnimateDiff、Hunyuan、Wan、AudioCraft 等生成视频/音频/3D 内容

## 架构：两层

<!-- ascii-guard-ignore -->
```
┌─────────────────────────────────────────────────────┐
│ 第 1 层：comfy-cli（官方生命周期工具）        │
│   设置、服务器生命周期、自定义节点、模型     │
│   → comfy install / launch / stop / node / model    │
└─────────────────────────┬───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│ 第 2 层：REST/WebSocket API + 技能脚本         │
│   工作流执行、参数注入、监控   │
│   POST /api/prompt, GET /api/view, WS /ws           │
│   → run_workflow.py, run_batch.py, ws_monitor.py    │
└─────────────────────────────────────────────────────┘
```
<!-- ascii-guard-ignore-end -->

**为什么是两层？** 官方 CLI 在安装和服务器管理方面非常出色，但对工作流执行的支持很少。REST/WS API 填补了这一空白 — 脚本处理 CLI 无法完成的参数注入、执行监控和输出下载。

## 快速开始

### 检测环境

```bash
# 有什么可用的？
command -v comfy >/dev/null 2>&1 && echo "comfy-cli: 已安装"
curl -s http://127.0.0.1:8188/system_stats 2>/dev/null && echo "服务器: 运行中"

# 这台机器可以本地运行 ComfyUI 吗？（GPU/显存/磁盘检查）
python3 scripts/hardware_check.py
```

如果什么都没有安装，请参见下面的 **设置与入门** — 但始终先运行硬件检查。

### 一行健康检查

```bash
python3 scripts/health_check.py
# → JSON: comfy_cli 在 PATH 中吗？服务器可访问吗？至少有一个检查点？冒烟测试通过吗？
```

## 核心工作流

### 步骤 1：获取 API 格式的工作流 JSON

工作流必须是 API 格式（每个节点都有 `class_type`）。它们来自：

- ComfyUI 网页 UI → **工作流 → 导出 (API)**（较新 UI）或旧版“保存 (API 格式)”按钮（较旧 UI）
- 此技能的 `workflows/` 目录（现成的示例）
- 社区下载（civitai、Reddit、Discord）— 通常是编辑器格式，必须加载到 ComfyUI 中然后重新导出

编辑器格式（顶级 `nodes` 和 `links` 数组）**不能直接执行**。脚本会检测到这一点并告诉您重新导出。

### 步骤 2：查看可控内容

```bash
python3 scripts/extract_schema.py workflow_api.json --summary-only
# → {"parameter_count": 12, "has_negative_prompt": true, "has_seed": true, ...}

python3 scripts/extract_schema.py workflow_api.json
# → 包含参数、模型依赖、嵌入引用的完整架构
```

### 步骤 3：使用参数运行

```bash
# 本地（默认为 http://127.0.0.1:8188）
python3 scripts/run_workflow.py \
  --workflow workflow_api.json \
  --args '{"prompt": "a beautiful sunset over mountains", "seed": -1, "steps": 30}' \
  --output-dir ./outputs

# 云端（导出 API 密钥一次；自动使用正确的 /api 路由）
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

# 图生图 / 内绘：传递 --input-image 以上传 + 自动引用
python3 scripts/run_workflow.py \
  --workflow sdxl_img2img.json \
  --input-image image=./photo.png \
  --args '{"prompt": "make it watercolor", "denoise": 0.6}'

# 批量 / 扫描：8 个随机种子，并行度最高可达云端套餐限制
python3 scripts/run_batch.py \
  --workflow sdxl.json \
  --args '{"prompt": "abstract"}' \
  --count 8 --randomize-seed --parallel 3 \
  --output-dir ./outputs/batch
```

`seed` 为 `-1`（或使用 `--randomize-seed` 时省略）会在每次运行时生成一个新的随机种子。

### 步骤 4：呈现结果

脚本会向 stdout 输出 JSON，描述每个输出文件：

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
| "安装 X 节点" | comfy-cli | `comfy node install &lt;name>` |
| "下载 X 模型" | comfy-cli | `comfy model download --url &lt;url> --relative-path models/checkpoints` |
| "列出已安装模型" | comfy-cli | `comfy model list` |
| "列出已安装节点" | comfy-cli | `comfy node show installed` |
| **执行（使用脚本）** | | |
| "一切就绪了吗？" | 脚本 | `health_check.py`（可选带 `--workflow X --smoke-test`） |
| "我可以更改此工作流中的什么？" | 脚本 | `extract_schema.py W.json` |
| "检查 W 的依赖是否满足" | 脚本 | `check_deps.py W.json` |
| "修复缺失的依赖" | 脚本 | `auto_fix_deps.py W.json` |
| "生成一张图像" | 脚本 | `run_workflow.py --workflow W --args '{...}'` |
| "使用此图像"（图生图） | 脚本 | `run_workflow.py --input-image image=./x.png ...` |
| "8 个随机种子的变体" | 脚本 | `run_batch.py --count 8 --randomize-seed ...` |
| "向我展示实时进度" | 脚本 | `ws_monitor.py --prompt-id &lt;id>` |
| "获取任务 X 的错误" | 脚本 | `fetch_logs.py &lt;prompt_id>` |
| **直接 REST** | | |
| "队列中有什么？" | REST | `curl http://HOST:8188/queue`（本地）或 `--host https://cloud.comfy.org` |
| "取消那个" | REST | `curl -X POST http://HOST:8188/interrupt` |
| "释放 GPU 内存" | REST | `curl -X POST http://HOST:8188/free` |

## 设置与入门

当用户要求设置 ComfyUI 时，**首先要做的就是询问他们想要 Comfy Cloud（托管，零安装，API 密钥）还是本地（在他们的机器上安装 ComfyUI）**。在得到答案之前，不要开始运行安装命令或硬件检查。

**官方文档：** https://docs.comfy.org/installation
**CLI 文档：** https://docs.comfy.org/comfy-cli/getting-started
**云端文档：** https://docs.comfy.org/get_started/cloud
**云端 API：** https://docs.comfy.org/development/cloud/overview

### 步骤 0：询问本地还是云端（始终首先进行）

建议脚本：

> "您是想在本地机器上运行 ComfyUI，还是使用 Comfy Cloud？
>
> - **Comfy Cloud** — 托管在 RTX 6000 Pro GPU 上，所有常见模型预装，零设置。需要一个 API 密钥（需要付费订阅才能实际运行工作流；免费套餐为只读）。如果您没有合适的 GPU，这是最佳选择。
> - **本地** — 免费，但您的机器**必须**满足硬件要求：
>   - NVIDIA GPU，**≥6 GB 显存**（SDXL 需要 ≥8 GB，Flux/视频需要 ≥12 GB），或
>   - AMD GPU，支持 ROCm（Linux），或
>   - Apple Silicon Mac (M1+)，**≥16 GB 统一内存**（推荐 ≥32 GB）。
>   - Intel Mac 和无 GPU 的机器将无法工作 — 请使用云端。
>
> 您希望选择哪一个？"

路由：

- **云端** → 跳到 **路径 A**。
- **本地** → 先运行硬件检查，然后根据结果从路径 B–E 中选择一条路径。
- **不确定** → 运行硬件检查，让结果决定。

### 步骤 1：验证硬件（仅当用户选择本地时）

```bash
python3 scripts/hardware_check.py --json
# 可选：同时探测 `torch` 以获取实际的 CUDA/MPS：
python3 scripts/hardware_check.py --json --check-pytorch
```

| 结果    | 含义                                                       | 操作 |
|------------|---------------------------------------------------------------|--------|
| `ok`       | ≥8 GB 显存（独立显卡）或 ≥32 GB 统一内存（Apple Silicon）       | 本地安装 — 使用报告中的 `comfy_cli_flag` |
| `marginal` | SD1.5 可用；SDXL 紧张；Flux/视频不太可能                  | 本地可用于轻量工作流，否则**路径 A（云端）** |
| `cloud`    | 无可用的 GPU，&lt;6 GB 显存，&lt;16 GB Apple 统一内存，Intel Mac，Rosetta Python | **切换到云端**，除非用户明确强制本地 |

脚本还会显示 `wsl: true`（WSL2 带 NVIDIA 透传）和 `rosetta: true`（Apple Silicon 上的 x86_64 Python — 必须重新安装为 ARM64）。

如果结果是 `cloud` 但用户想要本地，请不要静默进行。逐字显示 `notes` 数组，并询问他们是否要 (a) 切换到云端或 (b) 强制本地安装（在现代模型上会 OOM 或慢得无法使用）。

### 选择安装路径

首先使用硬件检查。下表是当用户已经告诉您他们的硬件时的备选方案：

| 情况 | 推荐路径 |
|-----------|------------------|
| 硬件检查结果为 `verdict: cloud` | **路径 A：Comfy Cloud** |
| 无 GPU / 想无承诺试用 | **路径 A：Comfy Cloud** |
| Windows + NVIDIA + 非技术用户 | **路径 B：ComfyUI Desktop** |
| Windows + NVIDIA + 技术用户 | **路径 C：Portable** 或 **路径 D：comfy-cli** |
| Linux + 任何 GPU | **路径 D：comfy-cli**（最简单） |
| macOS + Apple Silicon | **路径 B：Desktop** 或 **路径 D：comfy-cli** |
| 无头 / 服务器 / CI / 智能体 | **路径 D：comfy-cli** |

对于完全自动化的路径（硬件检查 → 安装 → 启动 → 验证）：

```bash
bash scripts/comfyui_setup.sh
# 或使用覆盖：
bash scripts/comfyui_setup.sh --m-series --port=8190 --workspace=/data/comfy
```

它会内部运行 `hardware_check.py`，当结果为 `cloud` 时拒绝本地安装（除非 `--force-cloud-override`），选择合适的 `comfy-cli` 标志，并优先使用 `pipx`/`uvx` 而不是全局 `pip`，以避免污染系统 Python。

---

### 路径 A：Comfy Cloud（无本地安装）

适用于没有合适 GPU 或想要零设置的用户。托管在 RTX 6000 Pro 上。

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
**并发任务：** 免费/标准 1 个，创作者 3 个，专业版 5 个。免费套餐**无法通过 API 运行工作流** — 只能浏览模型。需要付费订阅才能使用 `/api/prompt`、`/api/upload/*`、`/api/view` 等。

---

### 路径 B：ComfyUI Desktop（Windows / macOS）

非技术用户的一键安装程序。目前为 Beta 版。

**文档：** https://docs.comfy.org/installation/desktop
- **Windows (NVIDIA)：** https://download.comfy.org/windows/nsis/x64
- **macOS (Apple Silicon)：** https://comfy.org

Linux **不支持** Desktop — 请使用路径 D。

---

### 路径 C：ComfyUI Portable（仅限 Windows）

**文档：** https://docs.comfy.org/installation/comfyui_portable_windows

从 https://github.com/comfyanonymous/ComfyUI/releases 下载，解压，运行 `run_nvidia_gpu.bat`。通过 `update/update_comfyui_stable.bat` 更新。

---

### 路径 D：comfy-cli（所有平台 — 推荐给智能体）

官方 CLI 是无头/自动化设置的最佳路径。

**文档：** https://docs.comfy.org/comfy-cli/getting-started

#### 安装 comfy-cli

```bash
# 推荐：
pipx install comfy-cli
# 或使用 uvx 而不安装：
uvx --from comfy-cli comfy --help
# 或（如果 pipx/uvx 不可用）：
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

默认位置：`~/comfy/ComfyUI`（Linux），`~/Documents/comfy/ComfyUI`（macOS/Win）。使用 `comfy --workspace /custom/path install` 覆盖。

#### 启动 / 验证

```bash
comfy launch --background                       # :8188 上的后台守护进程
comfy launch -- --listen 0.0.0.0 --port 8190    # 可局域网访问的自定义端口
curl -s http://127.0.0.1:8188/system_stats      # 健康检查
```

---

### 路径 E：手动安装（高级 / 不支持的硬件）

适用于 Ascend NPU、Cambricon MLU、Intel Arc 或其他不支持的硬件。

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
comfy node install comfyui-essentials              # 常见助手
comfy node update all
comfy node install-deps --workflow=workflow.json   # 安装工作流所需的一切
```

### 安装后：验证

```bash
python3 scripts/health_check.py
# → comfy_cli 在 PATH 中吗？服务器可访问吗？检查点？冒烟测试？

python3 scripts/check_deps.py my_workflow.json
# → 此工作流的节点/模型/嵌入是否已安装？

python3 scripts/run_workflow.py \
  --workflow workflows/sd15_txt2img.json \
  --args '{"prompt": "test", "steps": 4}' \
  --output-dir ./test-outputs
```

## 图像上传（img2img / 图像修复）

最简单的方法是使用 `run_workflow.py` 脚本配合 `--input-image` 参数：

```bash
python3 scripts/run_workflow.py \
  --workflow workflows/sdxl_img2img.json \
  --input-image image=./photo.png \
  --args '{"prompt": "make it cyberpunk", "denoise": 0.6}'
```

该参数会上传 `photo.png`，然后将其在服务器端的文件名注入到工作流 JSON 中名为 `image` 的任意 schema 参数中。对于图像修复，需同时传入图像和蒙版：

```bash
python3 scripts/run_workflow.py \
  --workflow workflows/sdxl_inpaint.json \
  --input-image image=./photo.png \
  --input-image mask_image=./mask.png \
  --args '{"prompt": "fill with flowers"}'
```

通过 REST API 手动上传：
```bash
curl -X POST "http://127.0.0.1:8188/upload/image" \
  -F "image=@photo.png" -F "type=input" -F "overwrite=true"
# 返回：{"name": "photo.png", "subfolder": "", "type": "input"}

# 云端等效操作：
curl -X POST "https://cloud.comfy.org/api/upload/image" \
  -H "X-API-Key: $COMFY_CLOUD_API_KEY" \
  -F "image=@photo.png" -F "type=input" -F "overwrite=true"
```

## 云端特定说明

- **基础 URL：** `https://cloud.comfy.org`
- **认证方式：** `X-API-Key` 请求头（或 WebSocket 使用 `?token=KEY`）
- **API 密钥：** 设置一次 `$COMFY_CLOUD_API_KEY` 环境变量后，所有脚本会自动读取
- **输出下载：** `/api/view` 返回一个带签名的 URL 的 302 重定向；脚本会自动跟踪该链接，并在从存储后端获取数据前剥离 `X-API-Key`（避免将 API 密钥泄露给 S3/CloudFront）。
- **与本地 ComfyUI 的端点差异：**
  - `/api/object_info`、`/api/queue`、`/api/userdata` —— **免费版返回 403**；仅限付费用户。
  - `/history` 在云端重命名为 `/history_v2`（脚本会自动路由）。
  - `/models/&lt;folder>` 在云端重命名为 `/experiment/models/&lt;folder>`（脚本会自动路由）。
  - WebSocket 中的 `clientId` 目前被忽略 —— 同一用户的所有连接都会收到相同的广播消息。请在客户端通过 `prompt_id` 进行过滤。
  - 上传时接受 `subfolder` 参数但会被忽略 —— 云端采用扁平命名空间。
- **并发任务数：** 免费版/标准版：1 个，创作者版：3 个，专业版：5 个。超额任务会自动排队。使用 `run_batch.py --parallel N` 可充分利用你的套餐额度。

## 队列与系统管理

```bash
# 本地
curl -s http://127.0.0.1:8188/queue | python3 -m json.tool
curl -X POST http://127.0.0.1:8188/queue -d '{"clear": true}'    # 取消待处理任务
curl -X POST http://127.0.0.1:8188/interrupt                      # 取消正在运行的任务
curl -X POST http://127.0.0.1:8188/free \
  -H "Content-Type: application/json" \
  -d '{"unload_models": true, "free_memory": true}'

# 云端 —— 路径与本地相同，但需加上 /api/ 前缀，此外还可使用：
python3 scripts/fetch_logs.py --tail-queue --host https://cloud.comfy.org
```

## 常见陷阱

1. **必须使用 API 格式** —— 所有脚本以及 `/api/prompt` 端点都期望接收 API 格式的工作流 JSON。脚本会检测编辑器格式（顶层的 `nodes` 和 `links` 数组），并提示你通过“工作流 → 导出（API）”（新版 UI）或“保存（API 格式）”（旧版 UI）重新导出。

2. **服务器必须正在运行** —— 所有执行操作都需要一个活跃的服务器。使用 `comfy launch --background` 启动一个。可通过 `curl http://127.0.0.1:8188/system_stats` 验证。

3. **模型名称必须精确匹配** —— 区分大小写，且包含文件扩展名。`check_deps.py` 会进行模糊匹配（带或不带扩展名及文件夹前缀），但工作流本身必须使用规范名称。使用 `comfy model list` 查看已安装的模型。

4. **缺少自定义节点** —— 出现“class_type not found”错误意味着某个必需的节点未安装。`check_deps.py` 会报告需要安装哪个包；`auto_fix_deps.py` 会替你执行安装。

5. **工作目录** —— `comfy-cli` 会自动检测 ComfyUI 工作空间。如果命令因“未找到工作空间”而失败，请使用 `comfy --workspace /path/to/ComfyUI &lt;command>` 或 `comfy set-default /path/to/ComfyUI`。

6. **云端免费版 API 限制** —— 免费账户调用 `/api/prompt`、`/api/view`、`/api/upload/*`、`/api/object_info` 均会返回 403。`health_check.py` 和 `check_deps.py` 能妥善处理此情况，并给出明确提示。

7. **视频/音频工作流超时设置** —— 当输出节点为 `VHS_VideoCombine`、`SaveVideo` 等时，会自动检测到并将默认超时时间从 300 秒提升至 900 秒。可使用 `--timeout 1800` 显式覆盖。

8. **输出文件名中的路径遍历** —— 服务器提供的文件名会通过 `safe_path_join` 函数处理，以拒绝任何试图逃逸出 `--output-dir` 的路径。请保持此保护机制开启 —— 带有自定义保存节点的工作流可能生成任意路径。

9. **工作流 JSON 本质上是任意代码** —— 自定义节点会运行 Python 代码，因此提交未知工作流的风险等同于执行 `eval`。运行前请检查来自不可信来源的工作流。

10. **自动随机化种子** —— 在 `--args` 中传入 `seed: -1`（或使用 `--randomize-seed` 并省略种子值）可在每次运行时获得一个新的随机种子。实际使用的种子会记录到标准错误输出（stderr）。

11. **`tracking` 提示** —— 首次运行 `comfy` 时可能会提示是否启用分析功能。使用 `comfy --skip-prompt tracking disable` 可非交互式地跳过此提示。`comfyui_setup.sh` 脚本已为你完成此设置。

## 验证清单

使用 `python3 scripts/health_check.py` 可一次性运行整个清单。手动检查项如下：

- [ ] `hardware_check.py` 的结果为 `ok`，或用户已明确选择 Comfy Cloud
- [ ] `comfy --version` 可正常执行（或 `uvx --from comfy-cli comfy --help`）
- [ ] `curl http://HOST:PORT/system_stats` 返回 JSON 数据
- [ ] `comfy model list` 显示至少一个检查点模型（本地），或 `/api/experiment/models/checkpoints` 返回模型列表（云端）
- [ ] 工作流 JSON 为 API 格式
- [ ] `check_deps.py` 报告 `is_ready: true`（或在云端免费版上仅报告 `node_check_skipped`）
- [ ] 使用小型工作流进行测试运行能顺利完成；输出文件落入 `--output-dir` 目录