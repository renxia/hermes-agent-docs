---
title: "Excel Author"
sidebar_label: "Excel Author"
description: "使用 openpyxl 无界面构建可审计的 Excel 工作簿 — 蓝/黑/绿单元格规范、公式优于硬编码、名称区域、余额检查、敏感性..."
---

{/* 本页面由网站脚本/scripts/generate-skill-docs.py 从技能文件 SKILL.md 自动生成。请编辑源 SKILL.md，而非本页面。*/}

# Excel Author

使用 openpyxl 无界面构建可审计的 Excel 工作簿 — 蓝/黑/绿单元格规范、公式优于硬编码、名称区域、余额检查、敏感性表格。适用于财务模型、审计输出、对账核验。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/finance/excel-author` 安装 |
| 路径 | `optional-skills/finance/excel-author` |
| 版本 | `1.0.0` |
| 作者 | Anthropic (由 Nous Research 改编) |
| 许可 | Apache-2.0 |
| 平台 | linux, macos, windows |
| 标签 | `excel`, `openpyxl`, `finance`, `spreadsheet`, `modeling` |
| 相关技能 | [`pptx-author`](/docs/user-guide/skills/optional/finance/finance-pptx-author), [`dcf-model`](/docs/user-guide/skills/optional/finance/finance-dcf-model), [`comps-analysis`](/docs/user-guide/skills/optional/finance/finance-comps-analysis), [`lbo-model`](/docs/user-guide/skills/optional/finance/finance-lbo-model), [`3-statement-model`](/docs/user-guide/skills/optional/finance/finance-3-statement-model) |

```markdown
---
title: "excel-author"
description: "Produce an .xlsx file on disk using `openpyxl`. Follow the banker-grade conventions below so the model is auditable, flexible, and reviewable by someone other than the person who built it."
slug: excel-author
---

# excel-author

使用 `openpyxl` 在磁盘上生成一个 `.xlsx` 文件。遵循以下银行级的惯例，以确保模型可审计、灵活，并能由构建者以外的人进行审阅。

改编自 Anthropic 的 `xlsx-author` 和 `audit-xls` 技能，位于 [anthropics/financial-services](https://github.com/anthropics/financial-services) 仓库。原文中的 MCP / Office-JS / Cowork 特定分支已被移除——本技能假设在无头 Python 环境下运行。

## 输出契约

- 写入 `./out/<name>.xlsx`。如果 `./out/` 目录不存在，则创建它。
- 在最终消息中返回相对路径，以便下游工具可以拾取文件。
- 每个文件一个逻辑模型。除非明确要求，否则不要追加到现有工作簿。

## 设置

```bash
pip install "openpyxl>=3.0"
```

## 核心惯例（不可协商）

### 蓝色 / 黑色 / 绿色单元格颜色
- **蓝色** (`Font(color="0000FF")`) —— 人工输入的硬编码值。收入驱动因素、WACC 输入值、终端增长率、市场数据。
- **黑色** (默认) —— 公式。每个派生单元格都是一个活动的 Excel 公式。
- **绿色** (`Font(color="006100")`) —— 链接到另一个工作表或外部文件。

审阅者可以扫描工作表，并立即看到哪些是假设值，哪些是计算值。

### 公式优先于硬编码
每个计算单元格都**必须**是一个公式字符串，而不是在 Python 中计算后粘贴为数值的结果。

```python
# 错误 —— 潜在的静默错误
ws["D20"] = revenue_prior_year * (1 + growth)

# 正确 —— 当用户更改假设时公式会自动调整
ws["D20"] = "=D19*(1+$B$8)"
```

唯一允许硬编码的数字是：
1. 原始历史输入（实际收入、报告的 EBITDA 等）。
2. 用户打算调整的假设驱动因素（增长率、WACC 输入值、终端增长率 g）。
3. 当前市场数据（股价、债务余额）—— 需要添加单元格注释记录来源和日期。

如果你发现自己正在 Python 中计算一个值并准备写入结果，请立即停止。

### 跨表引用使用命名范围
对于任何从另一个工作表、演示文稿或备忘录中引用的数值，都应使用命名范围。

```python
from openpyxl.workbook.defined_name import DefinedName
wb.defined_names["WACC"] = DefinedName("WACC", attr_text="Inputs!$C$8")
# 然后在其他地方：
calc["D30"] = "=D29/WACC"
```

### 平衡检查选项卡
包含一个 `Checks` 选项卡，用于关联所有内容并显示 TRUE/FALSE：
- 资产负债表平衡（资产 = 负债 + 权益）
- 现金流量表与资产负债表上逐期现金变动相勾稽
- 分项加总与合并总额相勾稽
- 计算范围内没有随意的硬编码值

示例：
```python
checks = wb.create_sheet("Checks")
checks["A2"] = "BS balances"
checks["B2"] = "=IS!D20-IS!D21-IS!D22"
checks["C2"] = "=ABS(B2)<0.01"  # TRUE/FALSE
```

### 每个硬编码输入都要有单元格注释
在创建单元格时就添加注释，而不是事后添加。

```python
from openpyxl.comments import Comment
ws["C2"] = 1_250_000_000
ws["C2"].font = Font(color="0000FF")
ws["C2"].comment = Comment("Source: 10-K FY2024, p.47, revenue line", "analyst")
```

格式：`来源: [系统/文档], [日期], [参考], [URL（如适用）]`。

切勿延迟记录来源。切勿写 `TODO: add source`。

## 框架：典型财务模型

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

# --- 输入选项卡 ---
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

# --- 计算选项卡 ---
calc = wb.create_sheet("DCF")
calc["B2"] = "Projected Revenue"
calc["C2"] = "=Inputs!C3*(1+Inputs!C4)"   # 公式，黑色

# --- 检查选项卡 ---
chk = wb.create_sheet("Checks")
chk["A2"] = "BS balances"
chk["B2"] = "=ABS(BS!D20-BS!D21-BS!D22)<0.01"

Path("./out").mkdir(exist_ok=True)
wb.save("./out/model.xlsx")
```

## 带合并单元格的章节标题

openpyxl 的一个特性：当你合并单元格时，需要在左上角的单元格设置值，并单独设置整个范围的样式。

```python
ws["A7"] = "CASH FLOW PROJECTION"
ws["A7"].font = HEADER_FONT
ws.merge_cells("A7:H7")
for col in range(1, 9):  # A..H
    ws.cell(row=7, column=col).fill = HEADER_FILL
```

## 敏感性分析表

使用循环构建，而不是为每个单元格硬编码公式。规则：

- **奇数行/列** (5×5 或 7×7) —— 确保有一个真正的中心单元格。
- **中心单元格 = 基准情况。** 中间行/列的标题必须等于模型的实际 WACC 和终端增长率 g，这样中心输出才等于基准情况下的隐含每股价格。这是一个完整性检查。
- **高亮中心单元格**，使用中蓝色填充 (`"BDD7EE"`) 并加粗。
- 使用完整的重算公式填充每个单元格 —— 切勿使用近似值。

```python
# 5x5 WACC (行) x 终端增长率 (列) 敏感性分析
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
        # 完整的 DCF 重算公式（简化示例）。
        # 在实际模型中，这会引用完整的预测块。
        ws.cell(row=r, column=c).value = (
            f"=SUMPRODUCT(FCF_range,1/(1+{w})^year_offset) + "
            f"FCF_terminal*(1+{g})/({w}-{g})/(1+{w})^terminal_year"
        )

# 高亮中心单元格（基准情况）
center = ws.cell(row=start_row+2+len(wacc_axis)//2,
                 column=2+len(term_axis)//2)
center.fill = PatternFill("solid", fgColor="BDD7EE")
center.font = BOLD
```

## 交付前重新计算

openpyxl 只写入公式字符串，不计算它们。Excel 在打开时会重新计算，但下游消费者（自动检查脚本、CI）需要计算后的值。

在交付前运行 LibreOffice 或专门的重算步骤：

```bash
# LibreOffice 无头重算
libreoffice --headless --calc --convert-to xlsx ./out/model.xlsx --outdir ./out/
```

或者使用 Python 重算辅助工具（参见本技能的 `scripts/recalc.py`）。

## 模型布局规划

在编写任何公式之前：
1. 定义**所有**章节的行位置
2. 编写**所有**标题和标签
3. 编写**所有**章节分隔符和空白行
4. **然后**使用锁定的行位置编写公式

这可以防止级联公式损坏的模式，即在公式编写完成后插入标题行会导致每个下游引用都发生偏移。

## 与用户逐步验证

对于大型模型（DCF、三表模型、LBO），请在继续之前停下来向用户展示中间结果。在构建下游敏感性分析表之前发现错误的利润率假设，可以节省一个小时。

检查点模式：
- 输入块之后 → 显示原始输入，确认后再进行预测
- 收入预测之后 → 确认总收入和增长率
- FCF 构建之后 → 确认完整的计划表
- WACC 之后 → 确认输入值
- 估值之后 → 确认股权桥接表
- **然后**构建敏感性分析表

## 何时不使用此技能

- 用户正在实时 Excel 会话中，并且有可用的 Office MCP —— 应直接操作他们的活动工作簿。
- 纯表格数据导出，没有公式 —— 使用 `csv` 或 `pandas.to_excel` 更简单。
- 具有高度交互性的仪表板/图表 —— 使用真正的 BI 工具。

## 署名

惯例（蓝色/黑色/绿色、公式优先于硬编码、命名范围、敏感性规则）改编自 Anthropic 的 Claude for Financial Services 插件套件，采用 Apache-2.0 许可。原文：https://github.com/anthropics/financial-services/tree/main/plugins/vertical-plugins/financial-analysis/skills/xlsx-author
```