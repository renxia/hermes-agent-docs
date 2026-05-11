---
title: "Pptx Author — 使用 python-pptx 无头构建 PowerPoint 演示文稿"
sidebar_label: "Pptx Author"
description: "使用 python-pptx 无头构建 PowerPoint 演示文稿"
---

{/* 此页面由网站脚本 generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源 SKILL.md，而非此页面。*/}

# Pptx Author

使用 python-pptx 无头构建 PowerPoint 演示文稿。与 excel-author 配合使用，用于模型支持的演示文稿，其中每个数字都可追溯到工作簿单元格。适用于路演文件、投资委员会备忘录、盈利报告。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/finance/pptx-author` 安装 |
| 路径 | `optional-skills/finance/pptx-author` |
| 版本 | `1.0.0` |
| 作者 | Anthropic (由 Nous Research 改编) |
| 许可证 | Apache-2.0 |
| 平台 | linux, macos, windows |
| 标签 | `powerpoint`, `pptx`, `python-pptx`, `presentation`, `finance` |
| 相关技能 | [`excel-author`](/docs/user-guide/skills/optional/finance/finance-excel-author), [`powerpoint`](/docs/user-guide/skills/bundled/productivity/productivity-powerpoint) |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 触发此技能时加载的完整技能定义。这是技能激活时智能体看到的指示。
:::

# pptx-author

使用 `python-pptx` 在磁盘上生成一个 .pptx 文件。当您需要将演示文稿作为文件工件交付，而不是驱动实时 PowerPoint 会话时使用。

改编自 Anthropic 的 `pptx-author` 和 `pitch-deck` 技能，位于 [anthropics/financial-services](https://github.com/anthropics/financial-services)。原版的 MCP / Office-JS 分支已移除 — 此处假设为无头 Python 环境。

关于更全面的、已发布的 PowerPoint 创作技能（幻灯片、演讲者备注、嵌入内容、媒体），请参见内置的 `powerpoint` 技能。此技能是为模型支持的演示文稿（路演文件、投资委员会备忘录、盈利报告）定制的更轻量模式，其中每个数字都必须可追溯到源工作簿。

## 输出约定

- 写入 `./out/<name>.pptx`。如果 `./out/` 不存在，则创建它。
- 在最终消息中返回相对路径。

## 设置

```bash
pip install "python-pptx>=0.6"
```

## 核心约定

### 每张幻灯片一个观点
标题陈述要点；正文支持该观点。标题为“Q3 收入”的幻灯片较弱；“Q3 收入同比增长加速至 14%”则更强。

### 每个数字可追溯到模型
如果幻灯片上的某个数字来自 `./out/model.xlsx`，请为工作表和单元格添加脚注。

```
收入: $1,250M  (来源: model.xlsx, Inputs!C3)
```

切勿凭记忆或摘要抄录数字 — 打开工作簿，读取命名范围，并在可能时将演示文稿中的值以编程方式绑定到它。

### 当挂载了公司模板时使用公司模板
如果 `./templates/firm-template.pptx` 存在，请加载它，以便演示文稿继承品牌颜色、字体和母版布局。

```python
from pptx import Presentation
from pathlib import Path

template = Path("./templates/firm-template.pptx")
prs = Presentation(str(template)) if template.exists() else Presentation()
```

### 图表：从模型生成 PNG 优于原生 pptx 图表
当保真度很重要时（模型的图表样式必须与演示文稿完全匹配），请从源工作簿将图表渲染为 PNG 并嵌入该图像。原生 `pptx.chart` 图表很脆弱，且通常不符合公司惯例。

```python
from pptx.util import Inches
slide.shapes.add_picture("./out/charts/football_field.png",
                         Inches(1), Inches(2),
                         width=Inches(8))
```

### 无外部发送
此技能只写入文件。它从不发送邮件、上传或发布。编排层负责处理交付。

## 骨架

```python
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pathlib import Path

template = Path("./templates/firm-template.pptx")
prs = Presentation(str(template)) if template.exists() else Presentation()

# 标题幻灯片
slide = prs.slides.add_slide(prs.slide_layouts[0])
slide.shapes.title.text = "Aurora 项目 — 战略替代方案"
slide.placeholders[1].text = "初步讨论材料"

# 估值摘要幻灯片（仅标题布局）
slide = prs.slides.add_slide(prs.slide_layouts[5])
slide.shapes.title.text = "估值显示每股价值 38 至 52 美元（跨多种方法）"

# 添加一个绑定到模型输出的表格
rows, cols = 5, 4
tbl_shape = slide.shapes.add_table(rows, cols,
                                   Inches(0.5), Inches(1.5),
                                   Inches(9), Inches(3))
tbl = tbl_shape.table
headers = ["方法", "低值 ($)", "中值 ($)", "高值 ($)"]
for c, h in enumerate(headers):
    tbl.cell(0, c).text = h

# 在实际演示文稿中，使用 openpyxl 从模型工作簿读取这些数据
data = [
    ("交易可比公司",     "35", "41", "48"),
    ("先例并购",         "39", "45", "52"),
    ("现金流折现（基准）", "36", "43", "51"),
    ("杠杆收购（10% IRR）","33", "38", "44"),
]
for r, row in enumerate(data, start=1):
    for c, val in enumerate(row):
        tbl.cell(r, c).text = val

# 嵌入从模型渲染的图表
slide = prs.slides.add_slide(prs.slide_layouts[5])
slide.shapes.title.text = "足球场图 — 当前价格 $42"
slide.shapes.add_picture("./out/charts/football_field.png",
                         Inches(1), Inches(1.8), width=Inches(8))

Path("./out").mkdir(exist_ok=True)
prs.save("./out/pitch-aurora.pptx")
```

## 将演示文稿数字绑定到源工作簿

从您的 Excel 模型读取命名范围或特定单元格，以便演示文稿中的数字永不偏离。

```python
from openpyxl import load_workbook

wb = load_workbook("./out/model.xlsx", data_only=True)
def nr(name):
    """将命名范围解析为其当前计算值。"""
    rng = wb.defined_names[name]
    sheet, coord = next(rng.destinations)
    return wb[sheet][coord].value

revenue_fy24 = nr("RevenueFY24")
implied_mid  = nr("ImpliedSharePriceBase")
```

然后使用这些值构建演示文稿内容：
```python
slide.shapes.title.text = f"隐含股价为 ${implied_mid:.2f}（基准情况）"
```

请记住在读取工作簿之前重新计算它 — openpyxl 仅在某些内容已计算过工作表时才能看到计算值。首先运行 `excel-author` 技能中的重新计算帮助程序，或通过真实的 Excel 会话打开/保存。

## 路演文件的幻灯片类型清单

典型的银行路演文件遵循此结构。并非强制性规定，但可作为有用的起始骨架：

1. 封面 / 标题
2. 免责声明
3. 目录
4. 情况概述
5. 公司概况（目标公司）
6. 市场 / 行业背景
7. 估值摘要（足球场图） — 关键幻灯片
8. 交易可比公司详情
9. 先例交易详情
10. 现金流折现摘要
11. 说明性杠杆收购 / 赞助方案例
12. 流程考虑因素
13. 附录

## 何时不使用此技能

- 用户正在使用可用 Office MCP 的实时 PowerPoint 会话中 — 请改为驱动其实时文档。
- 非金融类幻灯片（季度全员会议、营销演示文稿）— 请使用更全面的 `powerpoint` 技能。
- 包含大量动画、过渡效果或演讲者备注的演示文稿 — 请使用更全面的 `powerpoint` 技能。

## 署名

惯例改编自 Anthropic 的 Claude for Financial Services 插件套件，Apache-2.0 许可。原文：https://github.com/anthropics/financial-services/tree/main/plugins/agent-plugins/pitch-agent/skills/pptx-author