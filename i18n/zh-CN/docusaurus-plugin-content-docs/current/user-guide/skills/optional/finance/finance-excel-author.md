---
title: "Excel 作者"
sidebar_label: "Excel 作者"
description: "使用 openpyxl 无头构建可审计的 Excel 工作簿——蓝/黑/绿单元格约定、公式优于硬编码、命名范围、平衡检查、敏感性分析表。适用于财务模型、审计输出、对账工作。"
---

{/* 此页面由网站脚本 generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源 SKILL.md，而非此页面。 */}

# Excel 作者

使用 openpyxl 无头构建可审计的 Excel 工作簿——蓝/黑/绿单元格约定、公式优于硬编码、命名范围、平衡检查、敏感性分析表。适用于财务模型、审计输出、对账工作。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/finance/excel-author` 安装 |
| 路径 | `optional-skills/finance/excel-author` |
| 版本 | `1.0.0` |
| 作者 | Anthropic（由 Nous Research 改编） |
| 许可证 | Apache-2.0 |
| 平台 | linux, macos, windows |
| 标签 | `excel`, `openpyxl`, `finance`, `spreadsheet`, `modeling` |
| 相关技能 | [`pptx 作者`](/docs/user-guide/skills/optional/finance/finance-pptx-author), [`dcf 模型`](/docs/user-guide/skills/optional/finance/finance-dcf-model), [`可比公司分析`](/docs/user-guide/skills/optional/finance/finance-comps-analysis), [`lbo 模型`](/docs/user-guide/skills/optional/finance/finance-lbo-model), [`三表模型`](/docs/user-guide/skills/optional/finance/finance-3-statement-model) |

:::info
以下是 Hermes 在此技能触发时加载的完整技能定义。这是技能激活时智能体所看到的指令。
:::

# excel-author

使用 `openpyxl` 在磁盘上生成 .xlsx 文件。遵循下面银行家级的标准，使模型可审计、灵活，并能让构建者之外的其他人进行审查。

改编自 [anthropics/financial-services](https://github.com/anthropics/financial-services) 仓库中 Anthropic 的 `xlsx-author` 和 `audit-xls` 技能。原版中与 MCP / Office-JS / Cowork 特定相关的部分已移除——本技能假定在无头 Python 环境下运行。

## 输出约定

- 写入 `./out/<name>.xlsx`。如果 `./out/` 不存在，则创建它。
- 在你的最终消息中返回相对路径，以便后续工具可以获取。
- 每个文件对应一个逻辑模型。除非明确要求，否则不要追加到现有工作簿。

## 环境设置

```bash
pip install "openpyxl>=3.0"
```

## 核心标准（不可协商）

### 蓝色 / 黑色 / 绿色单元格颜色
- **蓝色** (`Font(color="0000FF")`) — 人工输入的硬编码值。收入驱动因素、WACC 输入值、永续增长率、市场数据。
- **黑色** (默认) — 公式。每个衍生单元格都应是一个实时 Excel 公式。
- **绿色** (`Font(color="006100")`) — 链接到另一张工作表或外部文件。

这样审查者可以扫描工作表，立即区分出哪些是假设，哪些是计算得出的。

### 公式优先于硬编码
每个计算单元格 **必须** 是一个公式字符串，绝不能是 Python 计算后粘贴的数值。

```python
# 错误 — 隐含错误，等待发生
ws["D20"] = revenue_prior_year * (1 + growth)

# 正确 — 当用户更改假设时公式会自动调整
ws["D20"] = "=D19*(1+$B$8)"
```

允许硬编码的数字仅限于：
1.  原始历史输入（实际收入、报告的 EBITDA 等）。
2.  用户需要调整的假设驱动因素（增长率、WACC 输入值、永续增长率 g）。
3.  当前市场数据（股价、债务余额）— 并在单元格注释中注明来源和日期。

如果你发现自己在 Python 中计算一个值然后写入结果，请立即停止。

### 使用命名范围进行跨表引用
对于任何从其他工作表、演示文稿或备忘录引用的数字，请使用命名范围。

```python
from openpyxl.workbook.defined_name import DefinedName
wb.defined_names["WACC"] = DefinedName("WACC", attr_text="Inputs!$C$8")
# 然后在其他地方：
calc["D30"] = "=D29/WACC"
```

### 平衡检查标签页
包含一个 `Checks` 标签页，用于核对所有数据并显示 TRUE/FALSE：
- 资产负债表平衡（资产 = 负债 + 所有者权益）
- 现金流量表与资产负债表上期间现金变动额一致
- 分部估值合计与合并总额一致
- 计算范围内没有随意硬编码的数字

示例：
```python
checks = wb.create_sheet("Checks")
checks["A2"] = "BS balances"
checks["B2"] = "=IS!D20-IS!D21-IS!D22"
checks["C2"] = "=ABS(B2)<0.01"  # TRUE/FALSE
```

### 每个硬编码输入都应有单元格注释
在创建单元格时 **立即** 添加注释，不要事后补充。

```python
from openpyxl.comments import Comment
ws["C2"] = 1_250_000_000
ws["C2"].font = Font(color="0000FF")
ws["C2"].comment = Comment("Source: 10-K FY2024, p.47, revenue line", "analyst")
```

格式：`来源：[系统/文档]，[日期]，[参考编号]，[适用URL]`。

切勿推迟来源记录。永远不要写 `TODO: add source`。

## 骨架：典型财务模型

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.comments import Comment
from openpyxl.utils import get_column_letter
from pathlib import Path

BLUE = Font(color="0000FF")
BLACK = Font(color="000000")
GREEN = Font(color="006100")
BOLD = Font(bold=True)
HEADER_FILL = PatternFill("solid", fgColor="1F4E79")
HEADER_FONT = Font(color="FFFFFF", bold=True)

wb = Workbook()

# --- Inputs 标签页 ---
inp = wb.active
inp.title = "Inputs"
inp["A1"] = "MARKET DATA & KEY INPUTS"
inp["A1"].font = HEADER_FONT
inp["A1"].fill = HEADER_FILL
inp.merge_cells("A1:C1")

inp["B3"] = "Revenue FY2024"
inp["C3"] = 1_250_000_000
inp["C3"].font = BLUE
inp["C3"].comment = Comment("Source: 10-K FY2024 p.47", "model")

inp["B4"] = "Growth Rate"
inp["C4"] = 0.12
inp["C4"].font = BLUE

# --- Calc 标签页 ---
calc = wb.create_sheet("DCF")
calc["B2"] = "Projected Revenue"
calc["C2"] = "=Inputs!C3*(1+Inputs!C4)"   # 公式，黑色

# --- Checks 标签页 ---
chk = wb.create_sheet("Checks")
chk["A2"] = "BS balances"
chk["B2"] = "=ABS(BS!D20-BS!D21-BS!D22)<0.01"

Path("./out").mkdir(exist_ok=True)
wb.save("./out/model.xlsx")
```

## 使用合并单元格的章节标题

openpyxl 的一个特点：当你合并单元格时，在左上角单元格设置值，并单独为整个范围设置样式。

```python
ws["A7"] = "CASH FLOW PROJECTION"
ws["A7"].font = HEADER_FONT
ws.merge_cells("A7:H7")
for col in range(1, 9):  # A 到 H
    ws.cell(row=7, column=col).fill = HEADER_FILL
```

## 敏感性分析表格

使用循环构建，而不是为每个单元格硬编码公式。规则：

- **奇数行/列**（5×5 或 7×7）— 确保有一个真正的中心单元格。
- **中心单元格 = 基准情景。** 中间行/列的标题必须等于模型的实际 WACC 和永续增长率 g，这样中心输出才等于基准情景下隐含的股价。这是一个完整性检查。
- **突出显示中心单元格**，使用中蓝色填充 (`"BDD7EE"`) 和加粗字体。
- 为每个单元格填充完整的重计算公式——绝不使用近似值。

```python
# 5x5 敏感性分析：WACC（行）x 永续增长率（列）
wacc_axis = [0.08, 0.085, 0.09, 0.095, 0.10]        # 中心行 = 基准 9.0%
term_axis = [0.02, 0.025, 0.03, 0.035, 0.04]        # 中心列 = 基准 3.0%

start_row = 40
ws.cell(row=start_row, column=1).value = "Implied Share Price ($)"
ws.cell(row=start_row, column=1).font = BOLD

for j, g in enumerate(term_axis):
    ws.cell(row=start_row+1, column=2+j).value = g
    ws.cell(row=start_row+1, column=2+j).font = BLUE

for i, w in enumerate(wacc_axis):
    r = start_row + 2 + i
    ws.cell(row=r, column=1).value = w
    ws.cell(row=r, column=1).font = BLUE
    for j, g in enumerate(term_axis):
        c = 2 + j
        # 完整的 DCF 重计算公式（为简化说明）。在实际模型中，这应引用完整的预测块。
        ws.cell(row=r, column=c).value = (
            f"=SUMPRODUCT(FCF_range,1/(1+{w})^year_offset) + "
            f"FCF_terminal*(1+{g})/({w}-{g})/(1+{w})^terminal_year"
        )

# 突出显示中心单元格（基准情景）
center = ws.cell(row=start_row+2+len(wacc_axis)//2,
                 column=2+len(term_axis)//2)
center.fill = PatternFill("solid", fgColor="BDD7EE")
center.font = BOLD
```

## 交付前重新计算

openpyxl 写入的是公式字符串，并不会计算它们。Excel 会在打开时重新计算，但下游消费者（自动检查脚本、CI）需要计算后的数值。

在交付前运行 LibreOffice 或执行专门的重计算步骤：

```bash
# 使用 LibreOffice 进行无头重计算
libreoffice --headless --calc --convert-to xlsx ./out/model.xlsx --outdir ./out/
```

或者使用 Python 重计算辅助脚本（参见本技能中的 `scripts/recalc.py`）。

## 模型布局规划

在编写任何公式之前：
1.  定义 **所有** 章节的行位置。
2.  编写 **所有** 标题和标签。
3.  编写 **所有** 章节分隔符和空行。
4.  **然后** 才使用固定的行位置编写公式。

这可以防止“级联公式错误”模式，即在公式编写后插入标题行会导致所有下游引用发生偏移。

## 与用户逐步验证

对于大型模型（DCF、三表模型、LBO），请在继续之前停下来向用户展示中间结果。在构建下游敏感性分析表格之前发现一个错误的利润率假设，可以节省一小时时间。

检查点模式：
- 输入块完成后 → 展示原始输入，确认后再进行预测。
- 收入预测完成后 → 确认总收入和增长率。
- 自由现金流构建完成后 → 确认完整的预测表。
- WACC 完成后 → 确认输入值。
- 估值完成后 → 确认股权桥梁。
- **然后** 构建敏感性分析表格。

## 何时 **不** 使用此技能

- 用户正在实时 Excel 会话中且有 Office MCP 可用 — 应直接操作他们的实时工作簿。
- 纯表格数据导出，无公式 — `csv` 或 `pandas.to_excel` 更简单。
- 具有高度交互性的仪表板/图表 — 请使用真正的 BI 工具。

## 归属说明

相关标准（蓝/黑/绿、公式优先、命名范围、敏感性分析规则）改编自 Anthropic 的 Claude for Financial Services 插件套件，采用 Apache-2.0 许可。原版：https://github.com/anthropics/financial-services/tree/main/plugins/vertical-plugins/financial-analysis/skills/xlsx-author