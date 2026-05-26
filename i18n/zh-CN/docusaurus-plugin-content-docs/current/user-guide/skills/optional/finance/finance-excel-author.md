---
title: "Excel Author"
sidebar_label: "Excel Author"
description: "使用 openpyxl 构建可审计的 Excel 工作簿 — 蓝/黑/绿色单元格规范、公式优于硬编码、命名区域、平衡检查、敏感性分析表。适用于财务模型、审计输出、对账。"
---

{/* 本页面由网站脚本 generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非本页面。 */}

# Excel Author

使用 openpyxl 以无头方式构建可审计的 Excel 工作簿 — 蓝/黑/绿色单元格规范、公式优于硬编码、命名区域、平衡检查、敏感性分析表。适用于财务模型、审计输出、对账。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/finance/excel-author` 安装 |
| 路径 | `optional-skills/finance/excel-author` |
| 版本 | `1.0.0` |
| 作者 | Anthropic（由 Nous Research 改编） |
| 许可证 | Apache-2.0 |
| 平台 | linux, macos, windows |
| 标签 | `excel`, `openpyxl`, `finance`, `spreadsheet`, `modeling` |
| 相关技能 | [`pptx-author`](/user-guide/skills/optional/finance/finance-pptx-author), [`dcf-model`](/user-guide/skills/optional/finance/finance-dcf-model), [`comps-analysis`](/user-guide/skills/optional/finance/finance-comps-analysis), [`lbo-model`](/user-guide/skills/optional/finance/finance-lbo-model), [`3-statement-model`](/user-guide/skills/optional/finance/finance-3-statement-model) |

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# excel-author

使用 `openpyxl` 在磁盘上生成一个 `.xlsx` 文件。遵循以下银行级惯例，以便模型可审计、灵活，并能由构建者以外的人进行审查。

改编自 Anthropic 在 [anthropics/financial-services](https://github.com/anthropics/financial-services) 仓库中的 `xlsx-author` 和 `audit-xls` 技能。原始版本中 MCP / Office-JS / Cowork 特定的分支已被移除——此技能假设使用无头 Python。

## 输出合约

- 写入到 `./out/<name>.xlsx`。如果 `./out/` 目录不存在，则创建它。
- 在您的最终消息中返回相对路径，以便后续工具可以获取它。
- 每个文件一个逻辑模型。除非明确要求，否则不要向现有工作簿追加内容。

## 设置

```bash
pip install "openpyxl>=3.0"
```

## 核心惯例（不可协商）

### 蓝色/黑色/绿色单元格颜色
- **蓝色** (`Font(color="0000FF")`) — 人类输入的硬编码值。收入驱动因素、WACC 输入值、终值增长率、市场数据。
- **黑色**（默认）— 公式。每个派生单元格都是一个动态的 Excel 公式。
- **绿色** (`Font(color="006100")`) — 链接到另一个工作表或外部文件。

这样审阅者就可以扫描工作表，并立即看到哪些是假设，哪些是计算出来的。

### 公式优先于硬编码
每个计算单元格都**必须**是公式字符串，而不是在 Python 中计算并作为值粘贴的数字。

```python
# 错误 — 可能导致静默的错误
ws["D20"] = revenue_prior_year * (1 + growth)

# 正确 — 当用户更改假设时会自动调整
ws["D20"] = "=D19*(1+$B$8)"
```

允许的硬编码数字仅限于：
1. 原始历史输入（实际收入、报告的 EBITDA 等）。
2. 用户需要调整的假设驱动因素（增长率、WACC 输入值、终值 g）。
3. 当前市场数据（股价、债务余额）— 需在单元格批注中注明来源和日期。

如果您发现自己正在 Python 中计算一个值并写入结果，请立即停止。

### 使用命名范围进行跨工作表引用
对于从另一个工作表、演示文稿或备忘录中引用的任何数字，请使用命名范围。

```python
from openpyxl.workbook.defined_name import DefinedName
wb.defined_names["WACC"] = DefinedName("WACC", attr_text="Inputs!$C$8")
# 然后在其他地方：
calc["D30"] = "=D29/WACC"
```

### 核对检查表
包含一个 `Checks` 表，用于核对所有数据并显示 TRUE/FALSE：
- 资产负债表是否平衡（资产 = 负债 + 权益）
- 现金流量表是否与资产负债表上现金的逐期变动相吻合
- 分部加总是否与合并总数相符
- 计算范围内没有随机的硬编码

示例：
```python
checks = wb.create_sheet("Checks")
checks["A2"] = "BS balances"
checks["B2"] = "=IS!D20-IS!D21-IS!D22"
checks["C2"] = "=ABS(B2)<0.01"  # TRUE/FALSE
```

### 对每个硬编码输入添加单元格批注
在创建单元格时**立即**添加批注，而不是稍后。

```python
from openpyxl.comments import Comment
ws["C2"] = 1_250_000_000
ws["C2"].font = Font(color="0000FF")
ws["C2"].comment = Comment("来源：10-K FY2024, p.47, 收入行", "analyst")
```

格式：`来源：[系统/文档]，[日期]，[参考]，[如适用则提供URL]`。

绝不延迟提供来源信息。绝不写 `TODO：添加来源`。

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

# --- 输入表 ---
inp = wb.active
inp.title = "Inputs"
inp["A1"] = "市场数据与关键输入"
inp["A1"].font = HEADER_FONT
inp["A1"].fill = HEADER_FILL
inp.merge_cells("A1:C1")

inp["B3"] = "FY2024 收入"
inp["C3"] = 1_250_000_000
inp["C3"].font = BLUE
inp["C3"].comment = Comment("来源：10-K FY2024 p.47", "model")

inp["B4"] = "增长率"
inp["C4"] = 0.12
inp["C4"].font = BLUE

# --- 计算表 ---
calc = wb.create_sheet("DCF")
calc["B2"] = "预测收入"
calc["C2"] = "=Inputs!C3*(1+Inputs!C4)"   # 公式，黑色

# --- 核对表 ---
chk = wb.create_sheet("Checks")
chk["A2"] = "资产负债表平衡"
chk["B2"] = "=ABS(BS!D20-BS!D21-BS!D22)<0.01"

Path("./out").mkdir(exist_ok=True)
wb.save("./out/model.xlsx")
```

## 带合并单元格的章节标题

openpyxl 的一个特性：当您合并单元格时，请在左上角单元格设置值，并单独为整个范围设置样式。

```python
ws["A7"] = "现金流预测"
ws["A7"].font = HEADER_FONT
ws.merge_cells("A7:H7")
for col in range(1, 9):  # A..H
    ws.cell(row=7, column=col).fill = HEADER_FILL
```

## 敏感性分析表

使用循环构建，而不是为每个单元格硬编码公式。规则：

- **行/列数为奇数**（5×5 或 7×7）— 确保有一个真正的中心单元格。
- **中心单元格 = 基准情景。** 中间行/列的标题必须等于模型的实际 WACC 和终值 g，这样中心输出才等于基准情景的隐含股价。这就是健全性检查。
- 使用中蓝色填充 (`"BDD7EE"`) 和粗体**突出显示中心单元格**。
- 为每个单元格填充完整的重计算公式——绝不使用近似值。

```python
# 5x5 WACC (行) x 终值增长率 (列) 敏感性分析
wacc_axis = [0.08, 0.085, 0.09, 0.095, 0.10]        # 中心行 = 基准 9.0%
term_axis = [0.02, 0.025, 0.03, 0.035, 0.04]        # 中心列 = 基准 3.0%

start_row = 40
ws.cell(row=start_row, column=1).value = "隐含股价 ($)"
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
        # 完整的 DCF 重计算公式（为说明目的而简化）。
        # 在实际模型中，这会引用完整的预测块。
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

openpyxl 只写入公式字符串但不计算它们。Excel 在打开时会重新计算，但下游消费者（自动检查脚本、CI）需要计算后的值。

在交付前运行 LibreOffice 或专用的重新计算步骤：

```bash
# LibreOffice 无头重新计算
libreoffice --headless --calc --convert-to xlsx ./out/model.xlsx --outdir ./out/
```

或者使用 Python 重新计算助手（参见此技能中的 `scripts/recalc.py`）。

## 模型布局规划

在编写任何公式之前：
1. 定义所有部分的**行位置**
2. 编写所有**标题和标签**
3. 编写所有**分隔符和空行**
4. **然后** 使用固定的行位置编写公式

这可以防止在编写公式后插入标题行导致每个下游引用发生偏移的级联公式失效模式。

## 与用户逐步验证

对于大型模型（DCF、三表模型、LBO），请暂停并向用户展示中间成果，然后再继续。在构建下游敏感性分析表之前发现一个错误的利润率假设，可以节省一小时的时间。

检查点模式：
- 输入块后 → 显示原始输入，投影前确认
- 收入预测后 → 确认顶线 + 增长率
- FCF 构建后 → 确认完整时间表
- WACC 后 → 确认输入值
- 估值后 → 确认权益桥接
- **然后** 构建敏感性分析表

## 何时不使用此技能

- 用户处于实时 Excel 会话中且可用 Office MCP 时——应直接驱动他们的活动工作簿。
- 纯表格数据导出，无公式 — `csv` 或 `pandas.to_excel` 更简单。
- 需要高度交互性的仪表板/图表 — 请使用真正的 BI 工具。

## 署名

惯例（蓝/黑/绿、公式优先于硬编码、命名范围、敏感性分析规则）改编自 Anthropic 的 Claude for Financial Services 插件套件，采用 Apache-2.0 许可。原始：https://github.com/anthropics/financial-services/tree/main/plugins/vertical-plugins/financial-analysis/skills/xlsx-author