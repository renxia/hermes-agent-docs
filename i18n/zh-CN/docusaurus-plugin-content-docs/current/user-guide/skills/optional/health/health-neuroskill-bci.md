---
title: "Neuroskill Bci"
sidebar_label: "Neuroskill Bci"
description: "连接到正在运行的 NeuroSkill 实例，并将用户的实时认知和情绪状态（专注度、放松度、情绪、认知负荷、困倦度、心率、心率变异性、睡眠阶段以及 40 多种衍生 EXG 评分）融入回复中。需要配备 BCI 可穿戴设备（Muse 2/S 或 OpenBCI）并在本地运行 NeuroSkill 桌面应用程序。"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。*/}

# Neuroskill Bci

连接到正在运行的 NeuroSkill 实例，并将用户的实时认知和情绪状态（专注度、放松度、情绪、认知负荷、困倦度、心率、心率变异性、睡眠阶段以及 40 多种衍生 EXG 评分）融入回复中。需要配备 BCI 可穿戴设备（Muse 2/S 或 OpenBCI）并在本地运行 NeuroSkill 桌面应用程序。

## 技能元数据

| | |
|---|---|
| Source | Optional — install with `hermes skills install official/health/neuroskill-bci` |
| Path | `optional-skills/health/neuroskill-bci` |
| Version | `1.0.0` |
| Author | Hermes Agent + Nous Research |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `BCI`, `neurofeedback`, `health`, `focus`, `EEG`, `cognitive-state`, `biometrics`, `neuroskill` |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 神经技能 BCI 集成

将 Hermes 连接到正在运行的 [NeuroSkill](https://neuroskill.com/) 实例，以从脑机接口可穿戴设备读取实时脑部和身体指标。利用此功能提供具有认知意识的回应，建议干预措施，并跟踪长期心理表现。

> **⚠️ 仅供研究使用** — NeuroSkill 是一款开源研究工具。它不是医疗器械，未经 FDA、CE 或任何监管机构批准。切勿将这些指标用于临床诊断或治疗。

完整指标参考请参见 `references/metrics.md`，干预方案请参见 `references/protocols.md`，WebSocket/HTTP API 请参见 `references/api.md`。

---

## 前提条件

- 已安装 **Node.js 20+** (`node --version`)
- 运行中的 **NeuroSkill 桌面应用**，并连接了脑机接口设备
- **脑机接口硬件**：Muse 2, Muse S 或 OpenBCI（通过 BLE 连接的 4 通道 EEG + PPG + IMU）
- `npx neuroskill status` 能无错误地返回数据

### 验证设置
```bash
node --version                    # 必须为 20+
npx neuroskill status             # 完整系统快照
npx neuroskill status --json      # 可解析的机器格式 JSON
```

如果 `npx neuroskill status` 返回错误，请告知用户：
- 确保 NeuroSkill 桌面应用已打开
- 确保脑机接口设备已开启并通过蓝牙连接
- 检查信号质量 — NeuroSkill 中应为绿色指示器（每个电极 ≥0.7）
- 如果提示 `command not found`，请安装 Node.js 20+

---

## CLI 参考：`npx neuroskill <command>`

所有命令都支持 `--json`（原始 JSON，可管道传输）和 `--full`（人类可读摘要 + JSON）。

| 命令 | 描述 |
|---------|-------------|
| `status` | 完整系统快照：设备、分数、频带、比率、睡眠、历史记录 |
| `session [N]` | 单次会话分析，包含前/后半段趋势（0=最近一次） |
| `sessions` | 列出所有天记录的所有会话 |
| `search` | 使用神经相似性进行历史时刻的 ANN 相似性搜索 |
| `compare` | A/B 会话比较，包含指标变化量和趋势分析 |
| `sleep [N]` | 睡眠阶段分类（清醒/N1/N2/N3/快速眼动）及分析 |
| `label "text"` | 在当前时刻创建带时间戳的标注 |
| `search-labels "query"` | 对过去标注进行语义向量搜索 |
| `interactive "query"` | 跨模态 4 层图搜索（文本 → EXG → 标注） |
| `listen` | 实时事件流（默认 5 秒，设置 `--seconds N`） |
| `umap` | 会话嵌入的 3D UMAP 投影 |
| `calibrate` | 打开校准窗口并开始建立个人档案 |
| `timer` | 启动专注计时器（番茄钟/深度工作/短时专注预设） |
| `notify "title" "body"` | 通过 NeuroSkill 应用发送操作系统通知 |
| `raw '{json}'` | 向服务器传递原始 JSON |

### 全局标志
| 标志 | 描述 |
|------|-------------|
| `--json` | 原始 JSON 输出（无 ANSI 转义，可管道传输） |
| `--full` | 人类可读摘要 + 彩色 JSON |
| `--port <N>` | 覆盖服务器端口（默认：自动发现，通常为 8375） |
| `--ws` | 强制使用 WebSocket 传输 |
| `--http` | 强制使用 HTTP 传输 |
| `--k <N>` | 最近邻数量（用于 search, search-labels） |
| `--seconds <N>` | 监听持续时间（默认：5） |
| `--trends` | 显示每次会话的指标趋势（用于 sessions） |
| `--dot` | 输出 Graphviz DOT 格式（用于 interactive） |

---

## 1. 检查当前状态

### 获取实时指标
```bash
npx neuroskill status --json
```

**始终使用 `--json`** 以获得可靠的解析结果。默认输出是带颜色的人类可读文本。

### 响应中的关键字段

`scores` 对象包含所有实时指标（除非注明，否则为 0-1 的范围）：

```jsonc
{
  "scores": {
    "focus": 0.70,           // β / (α + θ) — 持续注意力
    "relaxation": 0.40,      // α / (β + θ) — 平静清醒状态
    "engagement": 0.60,      // 主动心理投入度
    "meditation": 0.52,      // α 波 + 静止度 + 心率变异性协调性
    "mood": 0.55,            // 来自 FAA、TAR、BAR 的综合情绪指标
    "cognitive_load": 0.33,  // 额叶 θ / 颞叶 α · f(FAA, TBR) — 认知负荷
    "drowsiness": 0.10,      // TAR + TBR + 下降的频谱重心 — 困倦度
    "hr": 68.2,              // 心率，单位 bpm（来自 PPG）
    "snr": 14.3,             // 信噪比，单位 dB
    "stillness": 0.88,       // 0-1；1 = 完全静止
    "faa": 0.042,            // 前额 α 波不对称性（+ = 趋近动机）
    "tar": 0.56,             // θ/α 比率
    "bar": 0.53,             // β/α 比率
    "tbr": 1.06,             // θ/β 比率（ADHD 相关指标）
    "apf": 10.1,             // α 波峰值频率，单位 Hz
    "coherence": 0.614,      // 半球间协调性
    "bands": {
      "rel_delta": 0.28, "rel_theta": 0.18,
      "rel_alpha": 0.32, "rel_beta": 0.17, "rel_gamma": 0.05
    }
  }
}
```

还包括：`device`（状态、电量、固件）、`signal_quality`（每个电极 0-1）、`session`（持续时间、时相）、`embeddings`、`labels`、`sleep` 摘要 和 `history`。

### 解释输出

解析 JSON 并将指标转化为自然语言。切勿仅报告原始数字 — 必须赋予它们含义：

**正确示例：**
> “你目前的专注度相当稳固，在 0.70 左右 — 这已经是进入心流状态的区间了。心率稳定在 68 bpm，你的 FAA 是正值，这表明有良好的趋近动机。现在是处理复杂任务的好时机。”

**错误示例：**
> “专注度：0.70，放松度：0.40，心率：68”

关键解释阈值（完整指南请参见 `references/metrics.md`）：
- **专注度 > 0.70** → 心流状态区间，需要保护
- **专注度 &lt; 0.40** → 建议休息或使用特定方案
- **困倦度 > 0.60** → 疲劳警告，有微睡眠风险
- **放松度 &lt; 0.30** → 需要压力干预
- **认知负荷持续 > 0.70** → 需要思维整理或休息
- **TBR > 1.5** → θ 波主导，执行控制能力下降
- **FAA &lt; 0** → 退缩/消极情绪 — 考虑 FAA 再平衡
- **SNR &lt; 3 dB** → 信号不可靠，建议调整电极位置

---

## 2. 会话分析

### 单次会话分析
```bash
npx neuroskill session --json         # 最近一次会话
npx neuroskill session 1 --json       # 上一次会话
npx neuroskill session 0 --json | jq '{focus: .metrics.focus, trend: .trends.focus}'
```

返回完整指标，包含**前半段与后半段趋势**（`"上升"`、`"下降"`、`"平稳"`）。
用此描述一个会话是如何发展的：

> “你的专注度从 0.64 开始，结束时上升到了 0.76 — 呈现明显的上升趋势。认知负荷从 0.38 降到了 0.28，表明随着你的投入，任务变得更自动化了。”

### 列出所有会话
```bash
npx neuroskill sessions --json
npx neuroskill sessions --trends      # 显示每次会话的指标趋势
```

---

## 3. 历史搜索

### 神经相似性搜索
```bash
npx neuroskill search --json                    # 自动：上次会话，k=5
npx neuroskill search --k 10 --json             # 10 个最近邻
npx neuroskill search --start <UTC> --end <UTC> --json
```

使用 HNSW 近似最近邻搜索，在 128 维 ZUNA 嵌入中寻找历史上神经模式相似的时刻。返回距离统计、时间分布（一天中的小时）以及最匹配的日子。

当用户问以下问题时使用此功能：
- “我上次进入类似状态是什么时候？”
- “找到我专注度最好的几次会话”
- “我通常在下午什么时候状态下滑？”

### 语义标注搜索
```bash
npx neuroskill search-labels "深度专注" --k 10 --json
npx neuroskill search-labels "压力" --json | jq '[.results[].EXG_metrics.tbr]'
```

使用向量嵌入（Xenova/bge-small-en-v1.5）搜索标注文本。返回匹配的标注及其标注时关联的 EXG 指标。

### 跨模态图搜索
```bash
npx neuroskill interactive "深度专注" --json
npx neuroskill interactive "深度专注" --dot | dot -Tsvg > graph.svg
```

4 层图：查询 → 文本标注 → EXG 数据点 → 附近标注。使用 `--k-text`、`--k-EXG`、`--reach <minutes>` 进行调优。

---

## 4. 会话比较
```bash
npx neuroskill compare --json                   # 自动：最近 2 次会话
npx neuroskill compare --a-start <UTC> --a-end <UTC> --b-start <UTC> --b-end <UTC> --json
```

返回包含绝对变化、百分比变化和方向的约 50 项指标的变化量。还包括 `insights.improved[]` 和 `insights.declined[]` 数组，两次会话的睡眠分期，以及一个 UMAP 任务 ID。

结合上下文解释比较结果 — 提及趋势，而不仅仅是变化量：
> “昨天你有两个高强度专注时段（上午10点和下午2点）。今天从上午11点左右开始有一个，现在还在持续。你今天的整体投入度更高，但压力峰值也更多 — 你的压力指数上升了 15%，FAA 也更频繁地变为负值。”

```bash
# 按改善百分比对指标进行排序
npx neuroskill compare --json | jq '.insights.deltas | to_entries | sort_by(.value.pct) | reverse'
```

---

## 5. 睡眠数据
```bash
npx neuroskill sleep --json                     # 最近24小时
npx neuroskill sleep 0 --json                   # 最近一次睡眠会话
npx neuroskill sleep --start <UTC> --end <UTC> --json
```
返回逐阶段睡眠分期数据（5秒时间窗口）及分析结果：
- **阶段代码**：0=清醒，1=N1，2=N2，3=N3（深度睡眠），4=REM
- **分析指标**：效率百分比、入睡潜伏期（分钟）、REM潜伏期（分钟）、睡眠片段计数
- **健康目标**：N3占比15–25%，REM占比20–25%，效率>85%，入睡潜伏期 &lt;20 分钟

```bash
npx neuroskill sleep --json | jq '.summary | {n3: .n3_epochs, rem: .rem_epochs}'
npx neuroskill sleep --json | jq '.analysis.efficiency_pct'
```
当用户提及睡眠、疲劳或恢复时使用此功能。

---

## 6. 标记时刻
```bash
npx neuroskill label "breakthrough"
npx neuroskill label "studying algorithms"
npx neuroskill label "post-meditation"
npx neuroskill label --json "focus block start"   # 返回 label_id
```
在以下情况自动标记时刻：
- 用户报告突破或顿悟
- 用户开始新的任务类型（例如“切换到代码审查”）
- 用户完成一个重要的协议流程
- 用户要求标记当前时刻
- 发生显著的状态转换（进入/离开心流状态）

标签存储在数据库中，并通过 `search-labels` 和 `interactive` 命令建立索引以供后续检索。

---

## 7. 实时流式传输
```bash
npx neuroskill listen --seconds 30 --json
npx neuroskill listen --seconds 5 --json | jq '[.[] | select(.event == "scores")]'
```
在指定持续时间内流式传输实时 WebSocket 事件（EXG、PPG、IMU、分数、标签）。需要 WebSocket 连接（`--http` 模式不可用）。

用于连续监测场景，或在协议执行期间实时观察指标变化。

---

## 8. UMAP 可视化
```bash
npx neuroskill umap --json                      # 自动：最近2次会话
npx neuroskill umap --a-start <UTC> --a-end <UTC> --b-start <UTC> --b-end <UTC> --json
```
对 ZUNA 嵌入进行 GPU 加速的 3D UMAP 投影。`separation_score` 表示两次会话在神经层面的差异程度：
- **> 1.5** → 会话在神经上具有显著差异（不同的大脑状态）
- **&lt; 0.5** → 两次会话的大脑状态相似

---

## 9. 主动状态感知

### 会话开始检查
会话开始时，如果用户提及正在佩戴设备或询问其状态，可选择性地运行状态检查：
```bash
npx neuroskill status --json
```
注入简要的状态摘要：
> “快速检查：专注度正在提升至 0.62，放松度良好为 0.55，您的 FAA 为正——接近动机已激活。看起来是个扎实的开始。”

### 何时主动提及状态
**仅在**以下情况提及认知状态：
- 用户明确询问（“我状态如何？”，“检查一下我的专注度”）
- 用户报告难以集中注意力、压力或疲劳
- 关键阈值被突破（嗜睡度 > 0.70，专注度持续 &lt; 0.30）
- 用户即将进行认知要求高的任务并询问准备情况

**切勿**打断心流状态来报告指标。如果专注度 > 0.75，保护该会话——保持沉默是正确的回应。

---

## 10. 建议协议流程
当指标显示需要时，建议从 `references/protocols.md` 中选取合适的协议。开始前务必询问——切勿打断心流状态：
> “过去15分钟您的专注度一直在下降，TBR 攀升超过 1.5——这是 theta 波占主导和精神疲劳的迹象。要我引导您做一个 Theta-Beta 神经反馈锚定练习吗？这是一个90秒的练习，通过有节奏的计数和呼吸来抑制 theta 波并提升 beta 波。”

关键触发条件：
- **专注度 &lt; 0.40，TBR > 1.5** → Theta-Beta 神经反馈锚定或箱式呼吸
- **放松度 &lt; 0.30，压力指数高** → 心脏相干性或 4-7-8 呼吸法
- **认知负荷持续 > 0.70** → 认知负荷卸载（思维倾倒）
- **嗜睡度 > 0.60** → 超日节律重置或清醒重置
- **FAA &lt; 0（负值）** → FAA 再平衡
- **心流状态（专注度 > 0.75，参与度 > 0.70）** → 切勿打断
- **高度静止 + 头痛指数高** → 颈部放松序列
- **低 RMSSD（&lt; 25ms）** → 迷走神经调节

---

## 11. 其他工具

### 专注计时器
```bash
npx neuroskill timer --json
```
启动专注计时器窗口，提供番茄工作法（25/5）、深度工作（50/10）或短时专注（15/5）预设。

### 校准
```bash
npx neuroskill calibrate
npx neuroskill calibrate --profile "Eyes Open"
```
打开校准窗口。当信号质量较差或用户希望建立个性化基线时使用。

### 操作系统通知
```bash
npx neuroskill notify "休息时间" "您的专注度已下降20分钟"
```

### 原始 JSON 直通
```bash
npx neuroskill raw '{"command":"status"}' --json
```
用于任何尚未映射到 CLI 子命令的服务器命令。

---

## 错误处理

| 错误 | 可能原因 | 解决方法 |
|-------|-------------|-----|
| `npx neuroskill status` 挂起 | NeuroSkill 应用未运行 | 打开 NeuroSkill 桌面应用 |
| `device.state: "disconnected"` | BCI 设备未连接 | 检查蓝牙、设备电量 |
| 所有分数返回 0 | 电极接触不良 | 重新佩戴头带，润湿电极 |
| `signal_quality` 值 &lt; 0.7 | 电极松动 | 调整贴合度，清洁电极触点 |
| SNR &lt; 3 dB | 信号有噪声 | 尽量减少头部移动，检查环境 |
| `command not found: npx` | 未安装 Node.js | 安装 Node.js 20+ |

---

## 交互示例

**“我现在状态怎么样？”**
```bash
npx neuroskill status --json
```
→ 自然解读分数，提及专注度、放松度、情绪以及任何值得注意的比值（FAA、TBR）。仅当指标显示需要时才建议采取行动。

**“我无法集中注意力”**
```bash
npx neuroskill status --json
```
→ 检查指标是否证实（theta 波高、beta 波低、TBR 上升、嗜睡度高）。
→ 如果确认，建议从 `references/protocols.md` 中选择合适的协议。
→ 如果指标看起来正常，问题可能是动机性的而非神经性的。

**“对比一下我今天和昨天的专注度”**
```bash
npx neuroskill compare --json
```
→ 解读趋势，而非仅仅是数字。提及哪些方面改善了，哪些下降了，以及可能的原因。

**“我上次进入心流状态是什么时候？”**
```bash
npx neuroskill search-labels "flow" --json
npx neuroskill search --json
```
→ 报告时间戳、相关指标以及用户当时在做什么（根据标签）。

**“我睡得怎么样？”**
```bash
npx neuroskill sleep --json
```
→ 报告睡眠结构（N3%、REM%、效率），与健康目标进行比较，并指出任何问题（清醒片段多、REM 低）。

**“标记这个时刻——我刚刚有了个突破”**
```bash
npx neuroskill label "breakthrough"
```
→ 确认标签已保存。可选择记录当前指标以备记住该状态。

---

## 参考资料

- [NeuroSkill 论文 — arXiv:2603.03212](https://arxiv.org/abs/2603.03212) (Kosmyna & Hauptmann, MIT Media Lab)
- [NeuroSkill 桌面应用](https://github.com/NeuroSkill-com/skill) (GPLv3)
- [NeuroLoop CLI 配套工具](https://github.com/NeuroSkill-com/neuroloop) (GPLv3)
- [MIT Media Lab 项目](https://www.media.mit.edu/projects/neuroskill/overview/)