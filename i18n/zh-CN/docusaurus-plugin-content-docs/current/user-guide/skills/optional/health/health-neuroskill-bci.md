---
title: "Neuroskill Bci"
sidebar_label: "Neuroskill Bci"
description: "连接到正在运行的 NeuroSkill 实例，并将用户的实时认知和情绪状态（专注度、放松度、情绪、认知负荷、困倦度..."
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Neuroskill Bci

连接到正在运行的 NeuroSkill 实例，并将用户的实时认知和情绪状态（专注度、放松度、情绪、认知负荷、困倦度、心率、心率变异性、睡眠分期以及 40 多个衍生的 EXG 分数）融入响应中。需要佩戴 BCI 可穿戴设备（Muse 2/S 或 OpenBCI）并本地运行 NeuroSkill 桌面应用程序。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/health/neuroskill-bci` 安装 |
| 路径 | `optional-skills/health/neuroskill-bci` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 + Nous Research |
| 许可证 | MIT |
| 标签 | `BCI`、`神经反馈`、`健康`、`专注度`、`脑电图`、`认知状态`、`生物特征`、`neuroskill` |

## 参考：完整的 SKILL.md

:::info
以下是触发此技能时 Hermes 加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# NeuroSkill BCI 集成

将 Hermes 连接至正在运行的 [NeuroSkill](https://neuroskill.com/) 实例，以读取来自 BCI 可穿戴设备的实时大脑和身体指标。利用这些指标提供认知感知响应、建议干预措施，并长期追踪心智表现。

> **⚠️ 仅限研究用途** — NeuroSkill 是一个开源研究工具。它**不是**医疗设备，也未经 FDA、CE 或任何监管机构批准。切勿将这些指标用于临床诊断或治疗。

完整指标参考请参见 `references/metrics.md`，干预协议请参见 `references/protocols.md`，WebSocket/HTTP API 请参见 `references/api.md`。

---

## 先决条件

- 已安装 **Node.js 20+**（`node --version`）
- **NeuroSkill 桌面应用**正在运行，且 BCI 设备已连接
- **BCI 硬件**：Muse 2、Muse S 或 OpenBCI（通过 BLE 支持 4 通道 EEG + PPG + IMU）
- `npx neuroskill status` 返回数据且无错误

### 验证设置
```bash
node --version                    # 必须为 20+
npx neuroskill status             # 完整系统快照
npx neuroskill status --json      # 可机器解析的 JSON
```

如果 `npx neuroskill status` 返回错误，请告知用户：
- 确保 NeuroSkill 桌面应用已打开
- 确保 BCI 设备已开机并通过蓝牙连接
- 检查信号质量 — NeuroSkill 中绿色指示灯（每个电极 ≥0.7）
- 如果提示“command not found”，请安装 Node.js 20+

---

## CLI 参考：`npx neuroskill <command>`

所有命令均支持 `--json`（原始 JSON，可管道传输）和 `--full`（人类可读摘要 + JSON）。

| 命令 | 描述 |
|---------|-------------|
| `status` | 完整系统快照：设备、得分、频段、比率、睡眠、历史记录 |
| `session [N]` | 单次会话详细分析（含前半段/后半段趋势，0=最近一次） |
| `sessions` | 列出所有已记录的跨天会话 |
| `search` | 基于神经相似性的近似最近邻（ANN）搜索 |
| `compare` | A/B 会话对比（含指标变化量和趋势分析） |
| `sleep [N]` | 睡眠分期分类（清醒/N1/N2/N3/REM）及分析 |
| `label "text"` | 在当前时刻创建带时间戳的注释 |
| `search-labels "query"` | 对过往标签进行语义向量搜索 |
| `interactive "query"` | 跨模态四层图搜索（文本 → EXG → 标签） |
| `listen` | 实时事件流（默认 5 秒，可通过 `--seconds N` 设置） |
| `umap` | 会话嵌入的 3D UMAP 投影 |
| `calibrate` | 打开校准窗口并开始配置文件 |
| `timer` | 启动专注计时器（番茄钟/深度工作/短时专注预设） |
| `notify "title" "body"` | 通过 NeuroSkill 应用发送操作系统通知 |
| `raw '{json}'` | 原始 JSON 直通至服务器 |

### 全局标志
| 标志 | 描述 |
|------|-------------|
| `--json` | 原始 JSON 输出（无 ANSI 转义，可管道传输） |
| `--full` | 人类可读摘要 + 彩色 JSON |
| `--port <N>` | 覆盖服务器端口（默认：自动发现，通常为 8375） |
| `--ws` | 强制使用 WebSocket 传输 |
| `--http` | 强制使用 HTTP 传输 |
| `--k <N>` | 最近邻数量（用于 search、search-labels） |
| `--seconds <N>` | listen 持续时间（默认：5） |
| `--trends` | 显示每次会话的指标趋势（用于 sessions） |
| `--dot` | Graphviz DOT 输出（用于 interactive） |

---

## 1. 检查当前状态

### 获取实时指标
```bash
npx neuroskill status --json
```

**始终使用 `--json`** 以确保可靠解析。默认输出为彩色人类可读文本。

### 响应中的关键字段

`scores` 对象包含所有实时指标（除非另有说明，范围为 0–1）：

```jsonc
{
  "scores": {
    "focus": 0.70,           // β / (α + θ) — 持续注意力
    "relaxation": 0.40,      // α / (β + θ) — 平静清醒状态
    "engagement": 0.60,      // 主动心智投入
    "meditation": 0.52,      // alpha + 静止 + HRV 协调性
    "mood": 0.55,            // 由 FAA、TAR、BAR 综合得出
    "cognitive_load": 0.33,  // 额叶 θ / 颞叶 α · f(FAA, TBR)
    "drowsiness": 0.10,      // TAR + TBR + 频谱质心下降
    "hr": 68.2,              // 心率（bpm，来自 PPG）
    "snr": 14.3,             // 信噪比（dB）
    "stillness": 0.88,       // 0–1；1 = 完全静止
    "faa": 0.042,            // 额叶 Alpha 不对称性（+ = 趋近动机）
    "tar": 0.56,             // Theta/Alpha 比率
    "bar": 0.53,             // Beta/Alpha 比率
    "tbr": 1.06,             // Theta/Beta 比率（ADHD 代理指标）
    "apf": 10.1,             // Alpha 峰值频率（Hz）
    "coherence": 0.614,      // 半球间相干性
    "bands": {
      "rel_delta": 0.28, "rel_theta": 0.18,
      "rel_alpha": 0.32, "rel_beta": 0.17, "rel_gamma": 0.05
    }
  }
}
```

还包括：`device`（状态、电量、固件）、`signal_quality`（每电极 0–1）、`session`（持续时间、epoch）、`embeddings`、`labels`、`sleep` 摘要和 `history`。

### 解读输出

解析 JSON 并将指标转化为自然语言。切勿仅报告原始数值 — 必须赋予其含义：

**正确做法：**
> “你当前的专注度很稳定，达到 0.70 —— 这已接近心流状态。心率稳定在 68 bpm，且你的 FAA 为正，表明趋近动机良好。现在是处理复杂任务的好时机。”

**错误做法：**
> “专注度：0.70，放松度：0.40，心率：68”

关键解读阈值（完整指南请参见 `references/metrics.md`）：
- **专注度 > 0.70** → 接近心流状态，需保护
- **专注度 < 0.40** → 建议休息或启动干预协议
- **困倦度 > 0.60** → 疲劳警告，存在微睡眠风险
- **放松度 < 0.30** → 需要压力干预
- **认知负荷 > 0.70 持续** → 建议思维清空或休息
- **TBR > 1.5** → θ 波主导，执行控制能力下降
- **FAA < 0** → 退缩/负面情绪 — 考虑 FAA 再平衡
- **SNR < 3 dB** → 信号不可靠，建议重新调整电极位置

---

## 2. 会话分析

### 单次会话详细分析
```bash
npx neuroskill session --json         # 最近一次会话
npx neuroskill session 1 --json       # 上一次会话
npx neuroskill session 0 --json | jq '{focus: .metrics.focus, trend: .trends.focus}'
```

返回完整指标及**前半段 vs 后半段趋势**（`"up"`、`"down"`、`"flat"`）。可用于描述会话如何演变：

> “你的专注度从开始的 0.64 上升至结束时的 0.76 —— 呈明显上升趋势。认知负荷从 0.38 降至 0.28，表明随着你逐渐适应，任务变得更加自动化。”

### 列出所有会话
```bash
npx neuroskill sessions --json
npx neuroskill sessions --trends      # 显示每次会话的指标趋势
```

---

## 3. 历史搜索

### 神经相似性搜索
```bash
npx neuroskill search --json                    # 自动：最近一次会话，k=5
npx neuroskill search --k 10 --json             # 10 个最近邻
npx neuroskill search --start <UTC> --end <UTC> --json
```

使用 HNSW 近似最近邻搜索在 128 维 ZUNA 嵌入中查找历史上神经状态相似的时刻。返回距离统计、时间分布（一天中的小时）以及最匹配的日期。

当用户询问以下问题时可使用此功能：
- “我上次处于类似状态是什么时候？”
- “找出我专注度最高的会话”
- “我通常下午什么时候状态下滑？”

### 语义标签搜索
```bash
npx neuroskill search-labels "deep focus" --k 10 --json
npx neuroskill search-labels "stress" --json | jq '[.results[].EXG_metrics.tbr]'
```

使用向量嵌入（Xenova/bge-small-en-v1.5）搜索标签文本。返回匹配的标签及其在标注时刻的相关 EXG 指标。

### 跨模态图搜索
```bash
npx neuroskill interactive "deep focus" --json
npx neuroskill interactive "deep focus" --dot | dot -Tsvg > graph.svg
```

四层图结构：查询 → 文本标签 → EXG 点 → 附近标签。可使用 `--k-text`、`--k-EXG`、`--reach <minutes>` 进行调优。

---

## 4. 会话对比
```bash
npx neuroskill compare --json                   # 自动：最近两次会话
npx neuroskill compare --a-start <UTC> --a-end <UTC> --b-start <UTC> --b-end <UTC> --json
```

返回约 50 项指标的绝对变化、百分比变化和方向。还包括 `insights.improved[]` 和 `insights.declined[]` 数组、两次会话的睡眠分期以及一个 UMAP 任务 ID。

解读对比结果时需结合上下文 — 提及趋势，而不仅仅是变化量：
> “昨天你有两个高强度专注时段（上午 10 点和下午 2 点）。今天你有一个从上午 11 点左右开始并仍在持续的专注时段。总体参与度今天更高，但出现了更多压力峰值 — 你的压力指数上升了 15%，且 FAA 更频繁地变为负值。”

```bash
# 按改善百分比排序指标
npx neuroskill compare --json | jq '.insights.deltas | to_entries | sort_by(.value.pct) | reverse'
```

## 5. 睡眠数据
```bash
npx neuroskill sleep --json                     # 过去24小时
npx neuroskill sleep 0 --json                   # 最近一次睡眠会话
npx neuroskill sleep --start <UTC> --end <UTC> --json
```

返回逐段睡眠分期（5秒窗口）及分析：
- **分期代码**：0=清醒，1=N1，2=N2，3=N3（深睡），4=REM（快速眼动）
- **分析指标**：efficiency_pct（睡眠效率百分比）、onset_latency_min（入睡潜伏期分钟）、rem_latency_min（REM潜伏期分钟）、各睡眠阶段持续段数（bout counts）
- **健康目标**：N3 15–25%，REM 20–25%，睡眠效率 >85%，入睡潜伏期 <20 分钟

```bash
npx neuroskill sleep --json | jq '.summary | {n3: .n3_epochs, rem: .rem_epochs}'
npx neuroskill sleep --json | jq '.analysis.efficiency_pct'
```

当用户提及睡眠、疲劳或恢复时，使用此命令。

---

## 6. 标记时刻
```bash
npx neuroskill label "breakthrough"
npx neuroskill label "studying algorithms"
npx neuroskill label "post-meditation"
npx neuroskill label --json "focus block start"   # 返回 label_id
```

在以下情况自动标记时刻：
- 用户报告突破性进展或顿悟
- 用户开始新任务类型（例如：“切换到代码审查”）
- 用户完成一项重要协议
- 用户要求你标记当前时刻
- 发生显著状态转换（进入/离开心流状态）

标签存储在数据库中，可通过 `search-labels` 和 `interactive` 命令进行后续检索。

---

## 7. 实时流数据
```bash
npx neuroskill listen --seconds 30 --json
npx neuroskill listen --seconds 5 --json | jq '[.[] | select(.event == "scores")]'
```

以指定时长流式传输实时 WebSocket 事件（EXG、PPG、IMU、评分、标签）。需要 WebSocket 连接（使用 `--http` 时不可用）。

用于持续监测场景，或在协议执行期间实时观察指标变化。

---

## 8. UMAP 可视化
```bash
npx neuroskill umap --json                      # 自动：最近2次会话
npx neuroskill umap --a-start <UTC> --a-end <UTC> --b-start <UTC> --b-end <UTC> --json
```

对 ZUNA 嵌入进行 GPU 加速的 3D UMAP 投影。`separation_score` 表示两次会话在神经层面的差异程度：
- **> 1.5** → 会话在神经层面显著不同（不同脑状态）
- **< 0.5** → 两次会话脑状态相似

---

## 9. 主动状态感知

### 会话开始检查
在会话开始时，如果用户提到他们已佩戴设备或询问自身状态，可选择性地运行状态检查：
```bash
npx neuroskill status --json
```

插入简要状态摘要：
> “快速检查：专注度正在建立，为 0.62，放松度良好，为 0.55，且你的 FAA 为正 —— 趋近动机已激活。看起来是一个良好的开端。”

### 何时主动提及状态

仅在以下情况提及认知状态：
- 用户明确询问（“我状态如何？”、“检查我的专注度”）
- 用户报告难以集中注意力、压力或疲劳
- 跨越关键阈值（嗜睡度 > 0.70，专注度 < 0.30 持续）
- 用户即将进行认知要求高的活动并询问准备情况

**切勿** 为了报告指标而打断心流状态。如果专注度 > 0.75，请保护该会话 —— 保持沉默是正确的回应。

---

## 10. 建议协议

当指标显示需要时，从 `references/protocols.md` 中建议一个协议。开始前务必询问 —— 切勿打断心流状态：

> “你的专注度在过去 15 分钟内持续下降，且 TBR 已攀升至 1.5 以上 —— 这是 θ 波主导和精神疲劳的迹象。是否要我引导你进行一个 θ-β 神经反馈锚定练习？这是一个 90 秒的练习，通过节奏性计数和呼吸来抑制 θ 波并提升 β 波。”

关键触发条件：
- **专注度 < 0.40，TBR > 1.5** → θ-β 神经反馈锚定 或 箱式呼吸法
- **放松度 < 0.30，stress_index 高** → 心脏相干性训练 或 4-7-8 呼吸法
- **认知负荷 > 0.70 持续** → 认知负荷卸载（思维清空）
- **嗜睡度 > 0.60** → 超昼夜节律重置 或 清醒重置
- **FAA < 0（负值）** → FAA 再平衡
- **心流状态（专注度 > 0.75，参与度 > 0.70）** → 切勿打断
- **高度静止 + headache_index 高** → 颈部释放序列
- **RMSSD 低（< 25ms）** → 迷走神经张力训练

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
打开校准窗口。当信号质量差或用户希望建立个性化基线时非常有用。

### 操作系统通知
```bash
npx neuroskill notify "Break Time" "Your focus has been declining for 20 minutes"
```

### 原始 JSON 透传
```bash
npx neuroskill raw '{"command":"status"}' --json
```
用于任何尚未映射到 CLI 子命令的服务器命令。

---

## 错误处理

| 错误 | 可能原因 | 解决方法 |
|-------|-------------|-----|
| `npx neuroskill status` 卡住 | NeuroSkill 应用未运行 | 打开 NeuroSkill 桌面应用 |
| `device.state: "disconnected"` | BCI 设备未连接 | 检查蓝牙、设备电量 |
| 所有评分返回 0 | 电极接触不良 | 重新调整头带位置，润湿电极 |
| `signal_quality` 值 < 0.7 | 电极松动 | 调整佩戴，清洁电极接触点 |
| SNR < 3 dB | 信号噪声大 | 减少头部运动，检查环境 |
| `command not found: npx` | 未安装 Node.js | 安装 Node.js 20+ |

---

## 示例交互

**“我现在状态如何？”**
```bash
npx neuroskill status --json
```
→ 自然地解释评分，提及专注度、放松度、情绪以及任何显著比率（FAA、TBR）。仅在指标显示需要时才建议采取行动。

**“我无法集中注意力”**
```bash
npx neuroskill status --json
```
→ 检查指标是否证实这一点（θ 波高、β 波低、TBR 上升、嗜睡度高）。
→ 如果确认，建议 `references/protocols.md` 中的适当协议。
→ 如果指标看起来正常，问题可能是动机性的而非神经性的。

**“比较我今天和昨天的专注度”**
```bash
npx neuroskill compare --json
```
→ 解释趋势，而不仅仅是数字。提及哪些方面改善了，哪些下降了，以及可能的原因。

**“我上次进入心流状态是什么时候？”**
```bash
npx neuroskill search-labels "flow" --json
npx neuroskill search --json
```
→ 报告时间戳、相关指标以及用户当时正在做什么（来自标签）。

**“我睡得怎么样？”**
```bash
npx neuroskill sleep --json
```
→ 报告睡眠结构（N3%、REM%、效率），与健康目标进行比较，并注意任何问题（清醒段过多、REM 过低）。

**“标记这个时刻 —— 我刚刚有了一个突破”**
```bash
npx neuroskill label "breakthrough"
```
→ 确认标签已保存。可选择性地记录当前指标以记住该状态。

---

## 参考资料

- [NeuroSkill 论文 — arXiv:2603.03212](https://arxiv.org/abs/2603.03212)（Kosmyna & Hauptmann，MIT 媒体实验室）
- [NeuroSkill 桌面应用](https://github.com/NeuroSkill-com/skill)（GPLv3）
- [NeuroLoop CLI 伴侣](https://github.com/NeuroSkill-com/neuroloop)（GPLv3）
- [MIT 媒体实验室项目](https://www.media.mit.edu/projects/neuroskill/overview/)