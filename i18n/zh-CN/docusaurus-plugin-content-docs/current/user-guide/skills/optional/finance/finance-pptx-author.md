---
title: "Pptx Author — 使用 python-pptx 无界面构建 PowerPoint 演示文稿"
sidebar_label: "Pptx Author"
description: "使用 python-pptx 无界面构建 PowerPoint 演示文稿"
---

{/* 本页面由网站脚本 scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Pptx Author

使用 python-pptx 无界面构建 PowerPoint 演示文稿。与 excel-author 配合使用，用于模型驱动的演示文稿，确保每个数字都可追溯至工作簿的单元格。适用于路演材料、投资委员会备忘录、财报说明。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/finance/pptx-author` 安装 |
| 路径 | `optional-skills/finance/pptx-author` |
| 版本 | `1.0.0` |
| 作者 | Anthropic (由 Nous Research 适配) |
| 许可 | Apache-2.0 |
| 平台 | linux, macos, windows |
| 标签 | `powerpoint`, `pptx`, `python-pptx`, `presentation`, `finance` |
| 相关技能 | [`excel-author`](/docs/user-guide/skills/optional/finance/finance-excel-author), [`powerpoint`](/docs/user-guide/skills/bundled/productivity/productivity-powerpoint) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 加载此技能时看到的完整技能定义。这是技能激活时智能体看到的指令。
:::

# pptx-author

使用 `python-pptx` 在磁盘上生成一个 `.pptx` 文件。当您需要将演示文稿作为文件工件交付，而不是驱动实时 PowerPoint 会话时使用。

改编自 [anthropics/financial-services](https://github.com/anthropics/financial-services) 中 Anthropic 的 `pptx-author` 和 `pitch-deck` 技能。原始版本的 MCP / Office-JS 分支已被移除——这里假设是无界面 Python 环境。

关于更广泛、已发布的 PowerPoint 作者技能（幻灯片、演讲者备注、嵌入、媒体），请参阅内置的 `powerpoint` 技能。此技能是一个更轻量级的模式，专为模型驱动的演示文稿（路演材料、投资委员会备忘录、财报说明）调优，其中每个数字都必须追溯到源工作簿。

## 输出约定

- 写入 `./out/<name>.pptx`。如果 `./out/` 不存在则创建它。
- 在您的最终消息中返回相对路径。

## 设置

```bash
pip install "python-pptx>=0.6"
```

## 核心惯例

### 一张幻灯片一个观点
标题陈述要点；正文提供支持。标题为“第三季度营收”的幻灯片很弱；标题为“第三季度营收同比增长加速至14%”则很强。

### 每个数字都追溯到模型
如果幻灯片上的数字来自 `./out/model.xlsx`，请在脚注中标注工作表和单元格。

```
营收：12.5亿美元  (来源：model.xlsx, Inputs!C3)
```
切勿凭记忆或从摘要中抄录数字——请打开工作簿，读取命名范围，并在可能时以编程方式将演示文稿的值与其绑定。

### 使用已挂载的公司模板
如果 `./templates/firm-template.pptx` 存在，请加载它，以便演示文稿继承品牌颜色、字体和母版布局。

```python
from pptx import Presentation
from pathlib import Path

template = Path("./templates/firm-template.pptx")
prs = Presentation(str(template)) if template.exists() else Presentation()
```

### 图表：从模型生成的 PNG 优于原生 pptx 图表
当保真度很重要（模型的图表样式必须与演示文稿完全匹配）时，请从源工作簿将图表渲染为 PNG 并嵌入图像。原生的 `pptx.chart` 图表很脆弱，且通常不符合公司惯例。

```python
from pptx.util import Inches
slide.shapes.add_picture("./out/charts/football_field.png",
                         Inches(1), Inches(2),
                         width=Inches(8))
```

### 不进行外部发送
此技能仅写入文件。它不会通过电子邮件发送、上传或发布。编排层负责交付。

## 骨架代码

```python
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pathlib import Path

template = Path("./templates/firm-template.pptx")
prs = Presentation(str(template)) if template.exists() else Presentation()

# 标题幻灯片
slide = prs.slides.add_slide(prs.slide_layouts[0])
slide.shapes.title.text = "极光项目 — 战略替代方案"
slide.placeholders[1].text = "初步讨论材料"

# 估值摘要幻灯片（仅标题布局）
slide = prs.slides.add_slide(prs.slide_layouts[5])
slide.shapes.title.text = "估值表明不同方法下每股价值在38至52美元之间"

# 添加一个绑定到模型输出的表格
rows, cols = 5, 4
tbl_shape = slide.shapes.add_table(rows, cols,
                                   Inches(0.5), Inches(1.5),
                                   Inches(9), Inches(3))
tbl = tbl_shape.table
headers = ["估值方法", "低值 ($)", "中值 ($)", "高值 ($)"]
for c, h in enumerate(headers):
    tbl.cell(0, c).text = h

# 在实际演示文稿中，使用 openpyxl 从模型工作簿中读取这些数据
data = [
    ("可比上市公司分析",     "35", "41", "48"),
    ("先例并购交易分析",     "39", "45", "52"),
    ("现金流折现 (基础)",        "36", "43", "51"),
    ("杠杆收购 (10% 内部收益率)",     "33", "38", "44"),
]
for r, row in enumerate(data, start=1):
    for c, val in enumerate(row):
        tbl.cell(r, c).text = val

# 嵌入从模型渲染的图表
slide = prs.slides.add_slide(prs.slide_layouts[5])
slide.shapes.title.text = "估值比较图 — 当前股价 $42"
slide.shapes.add_picture("./out/charts/football_field.png",
                         Inches(1), Inches(1.8), width=Inches(8))

Path("./out").mkdir(exist_ok=True)
prs.save("./out/pitch-aurora.pptx")
```

## 将演示文稿数字绑定到源工作簿

从 Excel 模型中读取命名范围或特定单元格，确保演示文稿中的数字不会出现偏差。

```python
from openpyxl import load_workbook

wb = load_workbook("./out/model.xlsx", data_only=True)
def nr(name):
    """解析一个命名范围到其当前的计算值。"""
    rng = wb.defined_names[name]
    sheet, coord = next(rng.destinations)
    return wb[sheet][coord].value

revenue_fy24 = nr("RevenueFY24")
implied_mid  = nr("ImpliedSharePriceBase")
```

然后使用这些值构建演示文稿内容：
```python
slide.shapes.title.text = f"隐含每股股价为 ${implied_mid:.2f} (基础情况)"
```

请记得在读取前重新计算工作簿——openpyxl 只能看到已经计算过的值。请先运行 `excel-author` 技能中的重算帮助程序，或者通过真实的 Excel 会话打开/保存。

## 路演材料的幻灯片类型清单

典型的投行路演材料通常遵循以下结构。这不是强制性的，但可作为有用的起始框架：

1. 封面 / 标题
2. 免责声明
3. 目录
4. 情况概述
5. 公司概况（目标公司）
6. 市场 / 行业背景
7. 估值摘要（估值比较图）— 核心幻灯片
8. 可比公司分析详情
9. 先例交易分析详情
10. 现金流折现分析摘要
11. 示例性杠杆收购 / 赞助方案例
12. 流程考量
13. 附录

## 何时不使用此技能

- 用户正在与可用的 Office MCP 进行实时 PowerPoint 会话 — 应驱动他们的实时文档。
- 非金融类演示文稿（季度全员会议、营销材料）— 请使用更广泛的 `powerpoint` 技能。
- 包含大量动画、切换效果或演讲者备注的演示文稿 — 请使用更广泛的 `powerpoint` 技能。

## 来源

惯例改编自 Anthropic 的 Claude for Financial Services 插件套件，采用 Apache-2.0 许可。原始来源：https://github.com/anthropics/financial-services/tree/main/plugins/agent-plugins/pitch-agent/skills/pptx-author