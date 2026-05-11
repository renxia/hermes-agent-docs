---
title: "Dogfood — Web应用探索性QA测试：发现缺陷、收集证据、生成报告"
sidebar_label: "Dogfood"
description: "Web应用探索性QA测试：发现缺陷、收集证据、生成报告"
---

{/* 本页面由website/scripts/generate-skill-docs.py脚本从技能的SKILL.md文件自动生成。请直接编辑源文件SKILL.md，而非本页面。*/}

# Dogfood

Web应用探索性QA测试：发现缺陷、收集证据、生成报告。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/dogfood` |
| 版本 | `1.0.0` |
| 平台 | linux, macos, windows |
| 标签 | `qa`, `testing`, `browser`, `web`, `dogfood` |

## 参考：完整的SKILL.md

:::info
以下是当此技能被触发时，Hermes加载的完整技能定义。这是技能激活时智能体所看到的指令。
:::

# Dogfood：系统化Web应用QA测试

## 概述

此技能引导您使用浏览器工具集对Web应用程序进行系统化的探索性QA测试。您将导航应用、与页面元素交互、捕获问题证据，并生成结构化的缺陷报告。

## 前提条件

- 浏览器工具集必须可用 (`browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_vision`, `browser_console`, `browser_scroll`, `browser_back`, `browser_press`)
- 用户需提供目标URL和测试范围

## 输入

用户需提供：
1. **目标URL** — 测试的入口点
2. **范围** — 需要关注的领域/功能（或输入“全站”进行全面测试）
3. **输出目录**（可选）— 用于保存截图和报告的位置（默认：`./dogfood-output`）

## 工作流程

遵循以下5阶段系统化工作流程：

### 阶段1：计划

1. 创建输出目录结构：
<!-- ascii-guard-ignore -->
   ```
   {output_dir}/
   ├── screenshots/       # 证据截图
   └── report.md          # 最终报告（在阶段5生成）
   ```
<!-- ascii-guard-ignore-end -->
2. 根据用户输入确定测试范围。
3. 通过规划需要测试的页面和功能来构建一个粗略的站点地图：
   - 着陆页/主页
   - 导航链接（页头、页脚、侧边栏）
   - 关键用户流程（注册、登录、搜索、结账等）
   - 表单和交互元素
   - 边界情况（空状态、错误页面、404页面）

### 阶段2：探索

对于计划中的每个页面或功能：

1. **导航**到页面：
   ```
   browser_navigate(url="https://example.com/page")
   ```

2. **获取快照**以了解DOM结构：
   ```
   browser_snapshot()
   ```

3. **检查控制台**是否有JavaScript错误：
   ```
   browser_console(clear=true)
   ```
   在每次导航和每次重要交互后都要执行此操作。静默的JS错误是高价值的发现。

4. **拍摄带注释的截图**以视觉评估页面并识别交互元素：
   ```
   browser_vision(question="描述页面布局，识别任何视觉问题、损坏的元素或无障碍性问题", annotate=true)
   ```
   `annotate=true` 标志会在交互元素上覆盖带编号的 `[N]` 标签。每个 `[N]` 对应于后续浏览器命令中使用的引用 `@eN`。

5. **系统性地测试交互元素**：
   - 点击按钮和链接：`browser_click(ref="@eN")`
   - 填写表单：`browser_type(ref="@eN", text="测试输入")`
   - 测试键盘导航：`browser_press(key="Tab")`, `browser_press(key="Enter")`
   - 滚动内容：`browser_scroll(direction="down")`
   - 使用无效输入测试表单验证
   - 测试空提交

6. **每次交互后**，检查：
   - 控制台错误：`browser_console()`
   - 视觉变化：`browser_vision(question="交互后发生了什么变化？")`
   - 预期行为与实际行为的对比

### 阶段3：收集证据

对于发现的每个问题：

1. **拍摄截图**展示问题：
   ```
   browser_vision(question="捕获并描述此页面上可见的问题", annotate=false)
   ```
   保存响应中的 `screenshot_path` — 您将在报告中引用它。

2. **记录详细信息**：
   - 问题发生的URL
   - 复现步骤
   - 预期行为
   - 实际行为
   - 控制台错误（如有）
   - 截图路径

3. **使用问题分类法对问题进行分类**（参见 `references/issue-taxonomy.md`）：
   - 严重程度：严重 / 高 / 中 / 低
   - 类别：功能 / 视觉 / 无障碍性 / 控制台 / 用户体验 / 内容

### 阶段4：分类

1. 回顾所有收集到的问题。
2. 去重 — 合并在不同地方表现出来的相同缺陷。
3. 为每个问题分配最终的严重程度和类别。
4. 按严重程度排序（严重优先，然后是高、中、低）。
5. 按严重程度和类别统计问题数量，用于执行摘要。

### 阶段5：报告

使用位于 `templates/dogfood-report-template.md` 的模板生成最终报告。

报告必须包括：
1. **执行摘要**，包含问题总数、按严重程度的分类以及测试范围
2. **每个问题的章节**，包含：
   - 问题编号和标题
   - 严重程度和类别徽章
   - 观察到的URL
   - 问题描述
   - 复现步骤
   - 预期行为与实际行为
   - 截图引用（使用 `MEDIA:<screenshot_path>` 来显示内联图片）
   - 相关的控制台错误
3. 所有问题的**汇总表**
4. **测试备注** — 测试了什么、未测试什么、遇到的阻碍

将报告保存到 `{output_dir}/report.md`。

## 工具参考

| 工具 | 用途 |
|------|---------|
| `browser_navigate` | 跳转到URL |
| `browser_snapshot` | 获取DOM文本快照（无障碍树） |
| `browser_click` | 通过引用 (`@eN`) 或文本点击元素 |
| `browser_type` | 在输入字段中输入内容 |
| `browser_scroll` | 在页面上向上/向下滚动 |
| `browser_back` | 在浏览器历史记录中后退 |
| `browser_press` | 按下键盘按键 |
| `browser_vision` | 截图+AI分析；使用 `annotate=true` 来添加元素标签 |
| `browser_console` | 获取JS控制台输出和错误 |

## 技巧

- **始终在导航和重要交互后检查 `browser_console()`。** 静默的JS错误是最有价值的发现之一。
- 当需要推断交互元素位置或快照引用不清楚时，**使用带 `annotate=true` 的 `browser_vision`**。
- **使用有效和无效输入进行测试** — 表单验证缺陷很常见。
- **滚动长页面** — 首屏以下的内容可能存在渲染问题。
- **测试导航流程** — 端到端地点击完成多步骤流程。
- **通过注意截图中可见的布局问题来检查响应式行为**。
- **不要忘记边界情况**：空状态、非常长的文本、特殊字符、快速连续点击。
- 向用户报告截图时，包含 `MEDIA:<screenshot_path>`，以便他们可以内联查看证据。