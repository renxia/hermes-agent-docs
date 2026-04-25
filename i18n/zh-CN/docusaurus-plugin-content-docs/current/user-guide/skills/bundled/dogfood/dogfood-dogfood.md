---
title: "Dogfood"
sidebar_label: "Dogfood"
description: "对 Web 应用程序进行系统性探索性 QA 测试 — 发现缺陷、收集证据并生成结构化报告"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Dogfood

对 Web 应用程序进行系统性探索性 QA 测试 — 发现缺陷、收集证据并生成结构化报告

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/dogfood` |
| 版本 | `1.0.0` |
| 标签 | `qa`, `testing`, `browser`, `web`, `dogfood` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Dogfood：系统性 Web 应用程序 QA 测试

## 概述

本技能指导你使用浏览器工具集对 Web 应用程序进行系统性探索性 QA 测试。你将导航应用程序、与元素交互、收集问题证据并生成结构化的缺陷报告。

## 先决条件

- 必须提供浏览器工具集（`browser_navigate`、`browser_snapshot`、`browser_click`、`browser_type`、`browser_vision`、`browser_console`、`browser_scroll`、`browser_back`、`browser_press`）
- 来自用户的测试目标 URL 和范围

## 输入

用户提供：
1. **目标 URL** — 测试的入口点
2. **范围** — 需要重点关注的区域/功能（或“全站”以进行全面测试）
3. **输出目录**（可选）— 保存截图和报告的位置（默认：`./dogfood-output`）

## 工作流程

遵循以下 5 个阶段的系统性工作流程：

### 阶段 1：规划

1. 创建输出目录结构：
   ```
   {output_dir}/
   ├── screenshots/       # 证据截图
   └── report.md          # 最终报告（在阶段 5 生成）
   ```
2. 根据用户输入确定测试范围。
3. 通过规划要测试的页面和功能来构建粗略的站点地图：
   - 着陆页/首页
   - 导航链接（页眉、页脚、侧边栏）
   - 关键用户流程（注册、登录、搜索、结账等）
   - 表单和交互元素
   - 边缘情况（空状态、错误页面、404）

### 阶段 2：探索

对于计划中的每个页面或功能：

1. **导航**到页面：
   ```
   browser_navigate(url="https://example.com/page")
   ```

2. **拍摄快照**以了解 DOM 结构：
   ```
   browser_snapshot()
   ```

3. **检查控制台**是否有 JavaScript 错误：
   ```
   browser_console(clear=true)
   ```
   每次导航和每次重要交互后都执行此操作。静默 JS 错误是高价值发现。

4. **拍摄带注释的截图**以直观评估页面并识别交互元素：
   ```
   browser_vision(question="描述页面布局，识别任何视觉问题、损坏的元素或可访问性问题", annotate=true)
   ```
   `annotate=true` 标志会在交互元素上叠加编号 `[N]` 标签。每个 `[N]` 映射到后续浏览器命令的 ref `@eN`。

5. **系统地测试交互元素**：
   - 点击按钮和链接：`browser_click(ref="@eN")`
   - 填写表单：`browser_type(ref="@eN", text="test input")`
   - 测试键盘导航：`browser_press(key="Tab")`、`browser_press(key="Enter")`
   - 滚动浏览内容：`browser_scroll(direction="down")`
   - 使用无效输入测试表单验证
   - 测试空提交

6. **每次交互后**，检查：
   - 控制台错误：`browser_console()`
   - 视觉变化：`browser_vision(question="交互后发生了什么变化？")`
   - 预期行为与实际行为

### 阶段 3：收集证据

对于发现的每个问题：

1. **拍摄显示问题的截图**：
   ```
   browser_vision(question="捕获并描述此页面上可见的问题", annotate=false)
   ```
   保存响应中的 `screenshot_path` — 你将在报告中引用它。

2. **记录详细信息**：
   - 问题出现的 URL
   - 重现步骤
   - 预期行为
   - 实际行为
   - 控制台错误（如果有）
   - 截图路径

3. **使用问题分类法对问题进行分类**（参见 `references/issue-taxonomy.md`）：
   - 严重性：严重 / 高 / 中 / 低
   - 类别：功能性 / 视觉 / 可访问性 / 控制台 / 用户体验 / 内容

### 阶段 4：分类

1. 审查所有收集到的问题。
2. 去重 — 合并在不同位置表现相同缺陷的问题。
3. 为每个问题分配最终严重性和类别。
4. 按严重性排序（严重优先，然后是高、中、低）。
5. 按严重性和类别统计问题数量，用于执行摘要。

### 阶段 5：报告

使用模板 `templates/dogfood-report-template.md` 生成最终报告。

报告必须包括：
1. **执行摘要**，包含问题总数、按严重性细分和测试范围
2. **每个问题的章节**，包含：
   - 问题编号和标题
   - 严重性和类别标签
   - 观察到问题的 URL
   - 问题描述
   - 重现步骤
   - 预期行为与实际行为
   - 截图引用（使用 `MEDIA:<screenshot_path>` 显示内联图像）
   - 相关控制台错误
3. **所有问题的汇总表**
4. **测试说明** — 测试了哪些内容、未测试哪些内容、任何阻碍

将报告保存到 `{output_dir}/report.md`。

## 工具参考

| 工具 | 用途 |
|------|---------|
| `browser_navigate` | 跳转到 URL |
| `browser_snapshot` | 获取 DOM 文本快照（可访问性树） |
| `browser_click` | 通过 ref (`@eN`) 或文本点击元素 |
| `browser_type` | 在输入字段中输入文本 |
| `browser_scroll` | 在页面上向上/向下滚动 |
| `browser_back` | 在浏览器历史记录中后退 |
| `browser_press` | 按下键盘按键 |
| `browser_vision` | 截图 + AI 分析；使用 `annotate=true` 显示元素标签 |
| `browser_console` | 获取 JS 控制台输出和错误 |

## 提示

- **每次导航和每次重要交互后始终检查 `browser_console()`。** 静默 JS 错误是最有价值的发现之一。
- **当需要推理交互元素位置或快照 ref 不清晰时，使用 `browser_vision` 的 `annotate=true`。**
- **使用有效和无效输入进行测试** — 表单验证缺陷很常见。
- **滚动浏览长页面** — 折叠下方内容可能存在渲染问题。
- **测试导航流程** — 端到端点击多步骤流程。
- **通过注意截图中可见的任何布局问题来检查响应式行为。**
- **不要忘记边缘情况**：空状态、非常长的文本、特殊字符、快速点击。
- 向用户报告截图时，包含 `MEDIA:<screenshot_path>`，以便他们可以内联查看证据。