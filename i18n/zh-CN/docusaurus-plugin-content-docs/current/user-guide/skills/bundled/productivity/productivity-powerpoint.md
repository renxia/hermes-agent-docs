---
title: "Powerpoint — 每当需要时都可使用此技能"
sidebar_label: "Powerpoint"
description: "每当需要时都可使用此技能"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Powerpoint

每当以任何方式涉及 .pptx 文件时（无论是作为输入、输出或两者兼具），都可使用此技能。这包括：创建幻灯片、推介文档或演示文稿；读取、解析或从任何 .pptx 文件中提取文本（即使提取的内容将用于其他用途，例如在电子邮件或摘要中）；编辑、修改或更新现有演示文稿；合并或拆分幻灯片文件；使用模板、布局、演讲者备注或评论。无论用户之后打算如何处理内容，只要他们提到“deck”、“slides”、“presentation”或引用 .pptx 文件名，就应触发此技能。如果需要打开、创建或修改 .pptx 文件，请使用此技能。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/productivity/powerpoint` |
| 许可证 | 专有。LICENSE.txt 包含完整条款 |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时 Hermes 加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# PowerPoint 技能

## 快速参考

| 任务 | 指南 |
|------|-------|
| 读取/分析内容 | `python -m markitdown presentation.pptx` |
| 从模板编辑或创建 | 阅读 [editing.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/productivity/powerpoint/editing.md) |
| 从头创建 | 阅读 [pptxgenjs.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/productivity/powerpoint/pptxgenjs.md) |

---

## 读取内容

```bash
# 文本提取
python -m markitdown presentation.pptx

# 视觉概览
python scripts/thumbnail.py presentation.pptx

# 原始 XML
python scripts/office/unpack.py presentation.pptx unpacked/
```

---

## 编辑工作流

**阅读 [editing.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/productivity/powerpoint/editing.md) 获取完整细节。**

1. 使用 `thumbnail.py` 分析模板
2. 解包 → 操作幻灯片 → 编辑内容 → 清理 → 打包

---

## 从头创建

**阅读 [pptxgenjs.md](https://github.com/NousResearch/hermes-agent/blob/main/skills/productivity/powerpoint/pptxgenjs.md) 获取完整细节。**

在没有模板或参考演示文稿时使用。

---

## 设计思路

**不要创建无聊的幻灯片。** 白色背景上的纯项目符号无法打动任何人。请考虑以下列表中的想法，为每一张幻灯片进行设计。

### 开始前

- **选择一个大胆且与内容相关的配色方案**：该配色方案应感觉是为**此主题**专门设计的。如果将你的颜色替换到完全不同的演示文稿中仍然“可行”，说明你的选择不够具体。
- **主次分明，而非平等对待**：一种颜色应占主导地位（视觉权重 60-70%），搭配 1-2 种辅助色调和一种醒目的强调色。切勿让所有颜色权重相等。
- **明暗对比**：标题和结论幻灯片使用深色背景，内容幻灯片使用浅色背景（“三明治”结构）。或者全程使用深色以营造高级感。
- **坚持一种视觉主题**：选择**一种**独特元素并重复使用——圆角图片框、彩色圆圈中的图标、单侧粗边框。在每一张幻灯片上保持一致。

### 配色方案

选择与你主题相匹配的颜色——不要默认使用 generic blue（通用蓝色）。以下配色方案可供参考：

| 主题 | 主色 | 次色 | 强调色 |
|-------|---------|-----------|--------|
| **午夜高管** | `1E2761`（海军蓝） | `CADCFC`（冰蓝） | `FFFFFF`（白色） |
| **森林与苔藓** | `2C5F2D`（森林绿） | `97BC62`（苔藓绿） | `F5F5F5`（奶油色） |
| **珊瑚能量** | `F96167`（珊瑚红） | `F9E795`（金色） | `2F3C7E`（海军蓝） |
| **暖陶土** | `B85042`（陶土色） | `E7E8D1`（沙色） | `A7BEAE`（鼠尾草绿） |
| **海洋渐变** | `065A82`（深蓝） | `1C7293`（水鸭色） | `21295C`（午夜蓝） |
| **炭灰极简** | `36454F`（炭灰） | `F2F2F2`（灰白色） | `212121`（黑色） |
| **水鸭信任** | `028090`（水鸭色） | `00A896`（海泡沫绿） | `02C39A`（薄荷绿） |
| **浆果与奶油** | `6D2E46`（浆果色） | `A26769`（ dusty rose） | `ECE2D0`（奶油色） |
| **鼠尾草宁静** | `84B59F`（鼠尾草绿） | `69A297`（桉树绿） | `50808E`（石板灰） |
| **樱桃大胆** | `990011`（樱桃红） | `FCF6F5`（灰白色） | `2F3C7E`（海军蓝） |

### 每张幻灯片

**每张幻灯片都需要一个视觉元素**——图片、图表、图标或形状。纯文本幻灯片容易被遗忘。

**布局选项：**
- 两栏布局（左侧文本，右侧插图）
- 图标 + 文本行（彩色圆圈中的图标，粗体标题，下方为描述）
- 2x2 或 2x3 网格（一侧为图片，另一侧为内容块网格）
- 半出血图片（左侧或右侧全幅）叠加内容

**数据展示：**
- 大型统计突出显示（60-72pt 大数字，下方为小标签）
- 对比列（之前/之后，优点/缺点，并排选项）
- 时间线或流程（编号步骤，箭头）

**视觉润色：**
- 在章节标题旁使用小型彩色圆圈中的图标
- 关键统计数据或标语使用斜体强调文本

### 字体排版

**选择有趣的字体组合**——不要默认使用 Arial。选择有特色的标题字体，并搭配简洁的正文字体。

| 标题字体 | 正文字体 |
|-------------|-----------|
| Georgia | Calibri |
| Arial Black | Arial |
| Calibri | Calibri Light |
| Cambria | Calibri |
| Trebuchet MS | Calibri |
| Impact | Arial |
| Palatino | Garamond |
| Consolas | Calibri |

| 元素 | 字号 |
|---------|------|
| 幻灯片标题 | 36-44pt 粗体 |
| 章节标题 | 20-24pt 粗体 |
| 正文文本 | 14-16pt |
| 图注 | 10-12pt 柔和 |

### 间距

- 最小边距 0.5 英寸
- 内容块之间 0.3-0.5 英寸
- 留出呼吸空间——不要填满每一寸

### 避免（常见错误）

- **不要重复相同布局**——在幻灯片之间变化使用列、卡片和突出显示
- **不要居中正文文本**——段落和列表左对齐；仅标题居中
- **不要吝啬字号对比**——标题需要 36pt 以上才能与 14-16pt 正文区分开
- **不要默认使用蓝色**——选择反映特定主题的颜色
- **不要随机混合间距**——选择 0.3 英寸或 0.5 英寸的间隙并保持一致使用
- **不要只设计一张幻灯片而其余保持朴素**——要么全程投入设计，要么全程保持简洁
- **不要创建纯文本幻灯片**——添加图片、图标、图表或视觉元素；避免纯标题 + 项目符号
- **不要忘记文本框内边距**——当对齐线条或形状与文本边缘时，请将文本框的 `margin: 0` 或偏移形状以考虑内边距
- **不要使用低对比度元素**——图标和文本都需要与背景形成强烈对比；避免浅色文本 on 浅色背景或深色文本 on 深色背景
- **切勿在标题下使用强调线**——这是 AI 生成幻灯片的标志；请使用空白或背景色代替

---

## 质量保证（必需）

**假设存在问题。你的任务是找到它们。**

你的第一次渲染几乎永远不会正确。将 QA 视为 bug 狩猎，而不是确认步骤。如果你在第一次检查时发现了零个问题，说明你看得不够仔细。

### 内容 QA

```bash
python -m markitdown output.pptx
```

检查缺失内容、拼写错误、顺序错误。

**使用模板时，检查残留的占位符文本：**

```bash
python -m markitdown output.pptx | grep -iE "xxxx|lorem|ipsum|this.*(page|slide).*layout"
```

如果 grep 返回结果，请在宣布成功之前修复它们。

### 视觉 QA

**⚠️ 使用子智能体**——即使是 2-3 张幻灯片。你一直盯着代码看，会看到你期望的内容，而不是实际存在的内容。子智能体有 fresh eyes（新鲜视角）。

将幻灯片转换为图像（参见 [转换为图像](#converting-to-images)），然后使用此提示：

```
视觉检查这些幻灯片。假设存在问题——找到它们。

查找：
- 重叠元素（文本穿过形状，线条穿过单词，堆叠元素）
- 文本溢出或在边缘/框边界处被截断
- 装饰线为单行文本定位但标题换行为两行
- 来源引用或页脚与上方内容碰撞
- 元素太近（< 0.3 英寸间隙）或卡片/部分几乎接触
- 不均匀的间隙（一处有大片空白区域，另一处拥挤）
- 与幻灯片边缘的边距不足（< 0.5 英寸）
- 列或类似元素未 consistently 对齐
- 低对比度文本（例如，浅灰色文本 on 奶油色背景）
- 低对比度图标（例如，深色图标 on 深色背景 without a contrasting circle）
- 文本框太窄导致 excessive wrapping
- 残留的占位符内容

对于每张幻灯片，列出问题或关注区域，即使是 minor 的。

阅读并分析这些图像：
1. /path/to/slide-01.jpg（预期：[brief description]）
2. /path/to/slide-02.jpg（预期：[brief description]）

报告发现的所有问题，包括 minor 的。
```

### 验证循环

1. 生成幻灯片 → 转换为图像 → 检查
2. **列出发现的问题**（如果未发现问题，请更 critical 地再次查看）
3. 修复问题
4. **重新验证受影响的幻灯片**——一个修复 often 会创建另一个问题
5. 重复直到完整通过 reveals no new issues

**不要宣布成功，直到你完成了至少一个 fix-and-verify cycle。**

---

## 转换为图像

将演示文稿转换为单独的幻灯片图像以进行视觉检查：

```bash
python scripts/office/soffice.py --headless --convert-to pdf output.pptx
pdftoppm -jpeg -r 150 output.pdf slide
```

这将创建 `slide-01.jpg`、`slide-02.jpg` 等。

要在修复后重新渲染特定幻灯片：

```bash
pdftoppm -jpeg -r 150 -f N -l N output.pdf slide-fixed
```

---

## 依赖项

- `pip install "markitdown[pptx]"` - 文本提取
- `pip install Pillow` - 缩略图网格
- `npm install -g pptxgenjs` - 从头创建
- LibreOffice (`soffice`) - PDF 转换（通过 `scripts/office/soffice.py` 为沙盒环境自动配置）
- Poppler (`pdftoppm`) - PDF 转图像