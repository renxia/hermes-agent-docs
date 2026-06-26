---
title: Touchdesigner Mcp
sidebar_label: TouchDesigner Mcp
description: 通过 twozero MCP 控制正在运行的 TouchDesigner 实例——创建操作符、设置参数、连接导线、执行 Python，构建实时视觉效果
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# TouchDesigner Mcp

通过 twozero MCP 控制正在运行的 TouchDesigner 实例——创建操作符、设置参数、连接导线、执行 Python，构建实时视觉效果。拥有 36 个原生工具。

## Skill metadata

| | |
|---|---|
| Source | 内置（默认安装） |
| Path | `skills/creative/touchdesigner-mcp` |
| Version | `1.1.0` |
| Author | kshitijk4poor |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | TouchDesigner, MCP, twozero, 创意编程, 实时视觉效果, 生成艺术, 音频反应式, VJ, 安装项目, GLSL |
| Related skills | `native-mcp`, [`ascii-video`](/docs/user-guide/skills/bundled/creative/creative-ascii-video), [`manim-video`](/docs/user-guide/skills/bundled/creative/creative-manim-video), `hermes-video` |

## Key Paths & Config

```
~/.hermes/config.yaml       主配置文件 (Main configuration)
~/.hermes/.env              API 密钥和秘密信息（如果设置了 $HERMES_HOME）(API keys and secrets)
$HERMES_HOME
```

# TouchDesigner 集成 (twozero MCP)

## CRITICAL RULES (关键规则)

1. **绝不要猜测参数名称。** 首先调用 `td_get_par_info` 获取操作符类型信息。你的训练数据对于 TD 2025.32 是错误的。
2. **如果触发 `tdAttributeError`，请停止。** 在继续之前，对失败的节点调用 `td_get_operator_info`。
3. **绝不要在脚本回调中硬编码绝对路径。** 使用 `me.parent()` / `scriptOp.parent()`。
4. **优先使用原生 MCP 工具而非 `td_execute_python`。** 使用 `td_create_operator`、`td_set_operator_pars`、`td_get_errors` 等。仅在需要复杂的多步逻辑时才回退到 `td_execute_python`。
5. **构建之前调用 `td_get_hints`。** 它会返回特定于你正在使用的操作符类型的模式信息。

## Architecture (架构)

```
Hermes 智能体 -> MCP (可流式传输的 HTTP) -> twozero.tox (端口 40404) -> TD Python
```

36 个原生工具。免费插件（已确认，2026 年 4 月无需付费/许可证）。
上下文感知（知道选定的操作符、当前的网络状态）。
Hub 健康检查：`GET http://localhost:40404/mcp` 返回包含实例 PID、项目名称和 TD 版本的 JSON。

## Setup (设置) (自动化)

运行设置脚本来处理所有事情：

```bash
bash "${HERMES_HOME:-$HOME/.hermes}/skills/creative/touchdesigner-mcp/scripts/setup.sh"
```

该脚本将执行以下操作：
1. 检查 TD 是否正在运行
2. 如果尚未缓存，则下载 twozero.tox
3. 将 `twozero_td` MCP 服务器添加到 Hermes 配置中（如果缺失）
4. 测试端口 40404 上的 MCP 连接
5. 报告剩余的手动步骤（将 .tox 拖入 TD、启用 MCP 开关）

### Manual steps (手动步骤) (一次性，无法自动化)

1. **将 `~/Downloads/twozero.tox` 拖入 TD 网络编辑器** → 点击安装
2. **启用 MCP：** 点击 twozero 图标 → Settings（设置）→ mcp → "auto start MCP"（自动启动 MCP）→ Yes（是）
3. **重启 Hermes 会话** 以加载新的 MCP 服务器

设置完成后，请验证：
```bash
nc -z 127.0.0.1 40404 && echo "twozero MCP: READY"
```

## Environment Notes (环境说明)

- **非商业版 TD** 将分辨率限制在 1280×1280。请使用 `outputresolution = 'custom'` 并显式设置宽度/高度。
- **编解码器：** `prores`（macOS 首选）或 `mjpa` 作为备用选项。H.264/H.265/AV1 需要商业许可证。
- 始终在设置参数之前调用 `td_get_par_info` — 参数名称因 TD 版本而异（参见 CRITICAL RULES #1）。

## Workflow (工作流程)

### Step 0: Discover (发现) (在构建任何东西之前)

```
使用 op_type 调用 td_get_par_info，针对你计划使用的每种类型。
使用你正在构建的主题（例如 "glsl"、"audio reactive"、"feedback"）调用 td_get_hints。
调用 td_get_focus 以查看用户在哪里以及选择了什么。
调用 td_get_network 以查看已有的结构。
```

无需临时节点，无需清理。这完全取代了旧的发现流程。

### Step 1: Clean + Build (清理 + 构建)

**重要提示：将清理和创建拆分成独立的 MCP 调用。** 在一个 `td_execute_python` 脚本中销毁和重建同名节点会导致 "Invalid OP object"（无效操作符对象）错误。参见 pitfalls #11b。

使用 `td_create_operator` 为每个节点创建（它会自动处理视口定位）：

```
td_create_operator(type="noiseTOP", parent="/project1", name="bg", parameters={"resolutionw": 1280, "resolutionh": 720})
td_create_operator(type="levelTOP", parent="/project1", name="brightness")
td_create_operator(type="nullTOP", parent="/project1", name="out")
```

对于批量创建或接线，请使用 `td_execute_python`：

```python
# td_execute_python 脚本:
root = op('/project1')
nodes = []
for name, optype in [('bg', noiseTOP), ('fx', levelTOP), ('out', nullTOP)]:
    n = root.create(optype, name)
    nodes.append(n.path)
# 接线链
for i in range(len(nodes)-1):
    op(nodes[i]).outputConnectors[0].connect(op(nodes[i+1]).inputConnectors[0])
result = {'created': nodes}
```

### Step 2: Set Parameters (设置参数)

优先使用原生工具（它会验证参数，不会崩溃）：

```
td_set_operator_pars(path="/project1/bg", parameters={"roughness": 0.6, "monochrome": true})
```

对于表达式或模式，请使用 `td_execute_python`：

```python
op('/project1/time_driver').par.colorr.expr = "absTime.seconds % 1000.0"
```

### Step 3: Wire (接线)

请使用 `td_execute_python` — 没有原生接线工具：

```python
op('/project1/bg').outputConnectors[0].connect(op('/project1/fx').inputConnectors[0])
```

### Step 4: Verify (验证)

```
td_get_errors(path="/project1", recursive=true)
td_get_perf()
td_get_operator_info(path="/project1/out", detail="full")
```

### Step 5: Display / Capture (显示 / 捕获)

```
td_get_screenshot(path="/project1/out")
```

或者通过脚本打开一个窗口：

```python
win = op('/project1').create(windowCOMP, 'display')
win.par.winop = op('/project1/out').path
win.par.winw = 1280; win.par.winh = 720
win.par.winopen.pulse()
```

## MCP Tool Quick Reference (MCP 工具快速参考)

**Core (核心工具 - 最常用):**
| Tool | What (功能描述) |
|------|------|
| `td_execute_python` | 在 TD 中运行任意 Python 代码。完全的 API 访问权限。 |
| `td_create_operator` | 创建节点，包括参数和自动定位。 |
| `td_set_operator_pars` | 安全地设置参数（会验证，不会崩溃）。 |
| `td_get_operator_info` | 检查单个节点：连接、参数、错误。 |
| `td_get_operators_info` | 一次性检查多个节点。 |
| `td_get_network` | 查看给定路径的网络结构。 |
| `td_get_errors` | 递归查找错误/警告。 |
| `td_get_par_info` | 获取操作符类型的参数名称（取代发现流程）。 |
| `td_get_hints` | 在构建前获取模式/提示。 |
| `td_get_focus` | 查看哪个网络是打开的，以及选择了什么。 |

**Read/Write (读取/写入):**
| Tool | What (功能描述) |
|------|------|
| `td_read_dat` | 读取 DAT 文本内容。 |
| `td_write_dat` | 写入/打补丁 DAT 内容。 |
| `td_read_chop` | 读取 CHOP 通道值。 |
| `td_read_textport` | 读取 TD 控制台输出。 |

**Visual (视觉):**
| Tool | What (功能描述) |
|------|------|
| `td_get_screenshot` | 将一个 OP 视图捕获到文件。 |
| `td_get_screenshots` | 一次性捕获多个 OP。 |
| `td_get_screen_screenshot` | 通过 TD 捕获实际屏幕。 |
| `td_navigate_to` | 跳转到 OP 的网络编辑器。 |

**Search (搜索):**
| Tool | What (功能描述) |
|------|------|
| `td_find_op` | 按名称/类型在整个项目中查找操作符。 |
| `td_search` | 搜索代码、表达式、字符串参数。 |

**System (系统):**
| Tool | What (功能描述) |
|------|------|
| `td_get_perf` | 性能分析（FPS，慢速操作）。 |
| `td_list_instances` | 列出所有正在运行的 TD 实例。 |
| `td_get_docs` | 关于某个 TD 主题的深入文档。 |
| `td_agents_md` | 读取/写入 per-COMP markdown 文档。 |
| `td_reinit_extension` | 在代码编辑后重新加载扩展。 |
| `td_clear_textport` | 清除控制台以进行调试会话。 |

**Input Automation (输入自动化):**
| Tool | What (功能描述) |
|------|------|
| `td_input_execute` | 向 TD 发送鼠标/键盘指令。 |
| `td_input_status` | 轮询输入队列状态。 |
| `td_input_clear` | 停止输入自动化。 |
| `td_op_screen_rect` | 获取节点的屏幕坐标。 |
| `td_click_screen_point` | 点击截图中的一个点。 |
| `td_screen_point_to_global` | 将截图像素转换为绝对屏幕坐标。 |

上表涵盖了典型创意工作流程中使用的 32 个工具。其余的 4 个工具（`td_project_quit`、`td_test_session`、`td_dev_log`、`td_clear_dev_log`）是管理员/开发模式工具——请参阅 `references/mcp-tools.md` 以获取完整的 36 个工具参考和完整的参数模式。

## Key Implementation Rules (关键实现规则)

**GLSL 时间：** GLSL TOP 中不要使用 `uTDCurrentTime`。请使用 Values（值）页面：
```python
# 首先调用 td_get_par_info(op_type="glslTOP") 来确认参数名称
td_set_operator_pars(path="/project1/shader", parameters={"value0name": "uTime"})
# 然后通过脚本设置表达式:
# op('/project1/shader').par.value0.expr = "absTime.seconds"
# 在 GLSL 中: uniform float uTime;
```

备用方案：使用 `rgba32float` 格式的 Constant TOP（8 位钳制到 0-1，冻结着色器）。

**Feedback TOP：** 使用 `top` 参数引用，而不是直接输入接线。“Not enough sources”（源不足）会在第一次渲染后解决。“Cook dependency loop”（烹饪依赖循环）警告是预期的。

**分辨率：** 非商业版限制在 1280×1280。请使用 `outputresolution = 'custom'`。

**大型着色器：** 将 GLSL 写入 `/tmp/file.glsl`，然后使用 `td_write_dat` 或 `td_execute_python` 来加载。

**顶点/点访问 (TD 2025.32)：** 使用 `point.P[0]`、`point.P[1]`、`point.P[2]` — 而不是 `.x`、`.y`、`.z`。

**扩展：** `ext0object` 格式在 CONSTANT 模式下为 `"op('./datName').module.ClassName(me)"`。使用 `td_write_dat` 编辑扩展代码后，请调用 `td_reinit_extension`。

**脚本回调：** 始终通过 `me.parent()` / `scriptOp.parent()` 使用相对路径。

**清理节点：** 在迭代之前，务必先执行 `list(root.children)` 并进行 `child.valid` 检查。

## Recording / Exporting Video (录制/导出视频)

```python
# 通过 td_execute_python:
root = op('/project1')
rec = root.create(moviefileoutTOP, 'recorder')
op('/project1/out').outputConnectors[0].connect(rec.inputConnectors[0])
rec.par.type = 'movie'
rec.par.file = '/tmp/output.mov'
rec.par.videocodec = 'prores'  # Apple ProRes — 在 macOS 上不受许可证限制
rec.par.record = True   # 开始录制
# rec.par.record = False  # 停止 (稍后单独调用)
```

H.264/H.265/AV1 需要商业许可证。在 macOS 上使用 `prores` 或使用 `mjpa` 作为备用选项。
提取帧：`ffmpeg -i /tmp/output.mov -vframes 120 /tmp/frames/frame_%06d.png`

**TOP.save() 对于动画是无用的** — 它每次都捕获相同的 GPU 纹理。请始终使用 MovieFileOut。

### Before Recording: Checklist (录制前：检查清单)

1. **通过 `td_get_perf` 验证 FPS > 0。** 如果 FPS=0，录制文件将是空的。参见 pitfalls #38-39。
2. **通过 `td_get_screenshot` 验证着色器输出不是黑色。** 黑色输出 = 着色器错误或输入缺失。参见 pitfalls #8, #40。
3. **如果包含音频：** 先提示音频开始，然后延迟 3 帧再开始录制。参见 pitfalls #19。
4. **在开始录制之前设置输出路径** — 在同一脚本中同时设置可能会发生竞态条件。

## Audio-Reactive GLSL (音频响应式 GLSL) (经过验证的配方)

### Correct signal chain (正确的信号链) (2026 年 4 月测试)

```
AudioFileIn CHOP (playmode=sequential)
  → AudioSpectrum CHOP (FFT=512, outputmenu=setmanually, outlength=256, timeslice=ON)
  → Math CHOP (gain=10)
  → CHOP to TOP (dataformat=r, layout=rowscropped)
  → GLSL TOP input 1 (频谱纹理, 256x2)

Constant TOP (rgba32float, time) → GLSL TOP input 0
GLSL TOP → Null TOP → MovieFileOut
```

### Critical audio-reactive rules (关键音频响应规则) (经验验证)

1. **TimeSlice 必须保持 ON**，用于 AudioSpectrum。OFF = 处理整个音频文件 → 24000+ 个样本 → CHOP to TOP 溢出。
2. **手动设置 Output Length 为 256**，通过 `outputmenu='setmanually'` 和 `outlength=256`。默认输出 22050 个样本。
3. **绝不要使用 Lag CHOP 进行频谱平滑。** Lag CHOP 在 timeslice 模式下运行，并将 256 个样本扩展到 2400+，将所有值平均到接近零（~1e-06）。着色器收到的数据是不可用的。这是测试中的 #1 音频同步失败原因。
4. **绝不要使用 Filter CHOP** — 与频谱数据的相同 timeslice 扩展问题。
5. **平滑应在 GLSL 着色器中完成**，通过带反馈纹理的临时插值：`mix(prevValue, newValue, 0.3)`。这可以实现零流水线延迟的完美帧同步。
6. **CHOP to TOP dataformat = 'r'**，layout = 'rowscropped'。频谱输出是 256x2（立体声）。对于第一个通道，采样 y=0.25。
7. **Math gain = 10** (而不是 5)。原始频谱值在低音区约为 ~0.19。增益为 10 可以提供可用的 ~5.0 给着色器。
8. **不需要 Resample CHOP。** 直接通过 AudioSpectrum 的 `outlength` 参数控制输出大小。

### GLSL spectrum sampling (GLSL 频谱采样)

```glsl
// Input 0 = time (1x1 rgba32float)，Input 1 = spectrum (256x2)
float iTime = texture(sTD2DInputs[0], vec2(0.5)).r;

// 对每个频段采样多个点并取平均值以提高稳定性：
// 注意: 对于第一个通道，y=0.25（立体声纹理为 256x2，第一行中心是 0.25）
float bass = (texture(sTD2DInputs[1], vec2(0.02, 0.25)).r +
              texture(sTD2DInputs[1], vec2(0.05, 0.25)).r) / 2.0;
float mid  = (texture(sTD2DInputs[1], vec2(0.2, 0.25)).r +
              texture(sTD2DInputs[1], vec2(0.35, 0.25)).r) / 2.0;
float hi   = (texture(sTD2DInputs[1], vec2(0.6, 0.25)).r +
              texture(sTD2DInputs[1], vec2(0.8, 0.25)).r) / 2.0;
```

请参阅 `references/network-patterns.md` 以获取完整的构建脚本和着色器代码。

## 操作符快速参考

| 系列 | 颜色 | Python 类 / MCP 类型 | 后缀 |
|--------|-------|-------------|--------|
| TOP | 紫色 | noiseTOP, glslTOP, compositeTOP, levelTop, blurTOP, textTOP, nullTOP | TOP |
| CHOP | 绿色 | audiofileinCHOP, audiospectrumCHOP, mathCHOP, lfoCHOP, constantCHOP | CHOP |
| SOP | 蓝色 | gridSOP, sphereSOP, transformSOP, noiseSOP | SOP |
| DAT | 白色 | textDAT, tableDAT, scriptDAT, webserverDAT | DAT |
| MAT | 黄色 | phongMAT, pbrMAT, glslMAT, constMAT | MAT |
| COMP | 灰色 | geometryCOMP, containerCOMP, cameraCOMP, lightCOMP, windowCOMP | COMP |

## 安全说明

- MCP 仅在本地主机上运行（端口 40404）。没有身份验证——任何本地进程都可以发送命令。
- `td_execute_python` 对 TD Python 环境和文件系统拥有不受限制的访问权限，它以 TD 进程用户身份运行。
- `setup.sh` 从官方 404zero.com URL 下载 twozero.tox。如果担心，请验证下载文件。
- 该技能永远不会向本地主机以外的地方发送数据。所有 MCP 通信都是局部的。

## 参考资料

| 文件 | 说明 |
|------|------|
| `references/pitfalls.md` | 从真实会话中总结出的惨痛教训 |
| `references/operators.md` | 所有操作符系列、参数和用例 |
| `references/network-patterns.md` | 范式：音频反应式、生成式、GLSL、实例渲染 |
| `references/mcp-tools.md` | 完整的 twozero MCP 工具参数模式 |
| `references/python-api.md` | TD Python：op()、脚本、扩展 |
| `references/troubleshooting.md` | 连接诊断、调试 |
| `references/glsl.md` | GLSL uniform，内置函数，着色器模板 |
| `references/postfx.md` | 后期特效（Post-FX）：光晕、CRT、色差、反馈发光 |
| `references/layout-compositor.md` | HUD 布局模式、面板网格、BSP 式布局 |
| `references/operator-tips.md` | 线框渲染、反馈 TOP 设置 |
| `references/geometry-comp.md` | Geometry COMP：实例渲染、POP 与 SOP，变形 |
| `references/audio-reactive.md` | 音频带提取、节拍检测、包络跟踪 |
| `references/animation.md` | LFOs、计时器、关键帧、缓动函数、表达式驱动运动 |
| `references/midi-osc.md` | MIDI/OSC 控制器、TouchOSC、多机同步 |
| `references/particles.md` | POP 和旧版 particleSOP — 发射、力、碰撞 |
| `references/projection-mapping.md` | 多窗口输出、角点定位、网格扭曲、边缘混合 |
| `references/external-data.md` | HTTP、WebSocket、MQTT、串口、TCP、webserverDAT |
| `references/panel-ui.md` | 自定义参数、面板 COMP、按钮/滑块/字段、panelExecuteDAT |
| `references/replicator.md` | replicatorCOMP — 数据驱动克隆、布局、回调 |
| `references/dat-scripting.md` | Execute DAT 系列 — chop/dat/parameter/panel/op/executeDAT |
| `references/3d-scene.md` | 照明架、阴影、IBL/球形图、多相机、PBR |
| `scripts/setup.sh` | 自动化设置脚本 |

---

> 你不是在写代码。你是在引导光线。