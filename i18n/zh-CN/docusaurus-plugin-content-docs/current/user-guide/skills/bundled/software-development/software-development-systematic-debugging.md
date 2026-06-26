---
title: "系统化调试 — 4阶段根因分析：在修复错误之前理解它们"
sidebar_label: "系统化调试"
description: "4阶段根因分析：在修复错误之前理解它们"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# 系统化调试

4阶段根因分析：在修复错误之前理解它们。

## 技能元数据 (Skill metadata)

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/software-development/systematic-debugging` |
| Version | `1.1.0` |
| Author | Hermes Agent (adapted from obra/superpowers) |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `debugging`, `troubleshooting`, `problem-solving`, `root-cause`, `investigation` |
| Related skills | [`test-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-test-driven-development), [`plan`](/docs/user-guide/skills/bundled/software-development/software-development-plan), [`subagent-driven-development`](/docs/user-guide/skills/optional/software-development/software-development-subagent-driven-development) |

## 参考: full SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# 系统化调试

## 概述 (Overview)

随机修复会浪费时间并引入新的错误。快速补丁掩盖了根本问题。

**核心原则：** 永远先找到根因，再尝试修复。症状式修复是失败。

**违反此流程的字面要求，就是违背调试的精神。**

## 铁律 (The Iron Law)

```
在进行根因调查之前，禁止任何修复
```

如果你没有完成第1阶段，你就不能提出修复方案。

## 何时使用 (When to Use)

用于任何技术问题：
- 测试失败
- 生产环境中的错误
- 意外行为
- 性能问题
- 构建失败
- 集成问题

**尤其在使用此流程时：**
- 面临时间压力（紧急情况会让人产生猜测的冲动）
- “只是一个快速修复”看起来很明显
- 你已经尝试了多个修复方案
- 先前的修复无效
- 你没有完全理解这个问题

**不要跳过以下情况：**
- 问题看似简单（简单的错误也存在根因）
- 你感到匆忙（仓促只会导致返工）
- 有人要求立即修复（系统化方法比盲目乱试更快）

## 四个阶段 (The Four Phases)

你必须完成每个阶段后才能进入下一个阶段。

---

## 第1阶段：根因调查 (Phase 1: Root Cause Investigation)

**在尝试任何修复之前：**

### 1. 仔细阅读错误信息

- 不要跳过错误或警告
- 它们通常包含确切的解决方案
- 完全阅读堆栈跟踪（stack traces）
- 记下行号、文件路径、错误代码

**行动：** 对相关的源文件使用 `read_file`。使用 `search_files` 在代码库中查找错误字符串。

### 2. 一致性地重现问题 (Reproduce Consistently)

- 你能否可靠地触发它？
- 具体步骤是什么？
- 它是否每次都发生？
- 如果无法重现 → 收集更多数据，不要猜测

**行动：** 使用 `terminal` 工具运行失败的测试或触发错误：

```bash
# 运行特定的失败测试
pytest tests/test_module.py::test_name -v

# 以详细输出运行
pytest tests/test_module.py -v --tb=long
```

### 3. 检查最近的更改 (Check Recent Changes)

- 有什么改变可能导致这个问题？
- Git diff，近期提交记录
- 新增依赖、配置更改

**行动：**

```bash
# 近期提交记录
git log --oneline -10

# 未提交的更改
git diff

# 特定文件的更改
git log -p --follow src/problematic_file.py | head -100
```

### 4. 在多组件系统中收集证据 (Gather Evidence in Multi-Component Systems)

**当系统包含多个组件时（API → 服务 → 数据库，CI → 构建 → 部署）：**

**在提出修复方案之前，添加诊断性工具 (diagnostic instrumentation)：**

对于每个组件边界：
- 记录进入该组件的数据
- 记录离开该组件的数据
- 验证环境/配置的传递性
- 检查每一层的状态

运行一次以收集证据，确定问题出在哪里。
然后分析证据以识别失败的组件。
然后调查那个特定的组件。

### 5. 追踪数据流 (Trace Data Flow)

**当错误发生在调用堆栈深处时：**

- 坏值是从哪里产生的？
- 是什么函数用这个坏值调用的它？
- 继续向上追踪，直到找到源头
- 在源头修复，而不是在症状上修复

**行动：** 使用 `search_files` 追踪引用：

```python
# 查找函数被调用的地方
search_files("function_name(", path="src/", file_glob="*.py")

# 查找变量被设置的地方
search_files("variable_name\\s*=", path="src/", file_glob="*.py")
```

### 第1阶段完成检查清单 (Phase 1 Completion Checklist)

- [ ] 错误信息已完全阅读并理解
- [ ] 问题已一致性地重现
- [ ] 已识别并审查最近的更改
- [ ] 已收集证据（日志、状态、数据流）
- [ ] 问题已被隔离到特定的组件/代码中
- [ ] 已形成根因假设

**停止：** 在理解“为什么会发生”之前，不要进入第2阶段。

---

## 第2阶段：模式分析 (Phase 2: Pattern Analysis)

**在修复之前找到模式：**

### 1. 查找工作示例 (Find Working Examples)

- 在同一代码库中定位相似工作的代码
- 什么东西是好的，它与坏的（问题）有什么相似之处？

**行动：** 使用 `search_files` 查找可比较的模式：

```python
search_files("similar_pattern", path="src/", file_glob="*.py")
```

### 2. 与参考资料进行比较 (Compare Against References)

- 如果正在实现一个模式，请彻底阅读参考实现
- 不要浏览——要读完每一行
- 在应用之前完全理解该模式

### 3. 识别差异 (Identify Differences)

- 工作和失败之处有什么不同？
- 列出所有差异，无论多小
- 不要假设“这不重要”

### 4. 理解依赖关系 (Understand Dependencies)

- 这需要哪些其他组件？
- 需要哪些设置、配置、环境？
- 它做出了哪些假设？

---

## 第3阶段：假设与测试 (Phase 3: Hypothesis and Testing)

**科学方法：**

### 1. 形成单一假设 (Form a Single Hypothesis)

- 清晰地陈述：“我认为 X 是根因，因为 Y”
- 将其写下来
- 要具体，不要模糊不清

### 2. 最小化测试 (Test Minimally)

- 进行最小程度的更改来测试该假设
- 一次只改一个变量
- 不要一次修复多件事情

### 3. 继续前行前的验证 (Verify Before Continuing)

- 有效了吗？ → 进入第4阶段
- 无效吗？ → 形成新的假设
- **不要**在现有修复上再添加更多更改

### 4. 当你不知道时 (When You Don't Know)

- 说“我不理解 X”
- 不要假装知道
- 向用户寻求帮助
- 进行更多研究

---

## 第4阶段：实施 (Phase 4: Implementation)

**修复根因，而不是症状：**

### 1. 创建失败测试用例 (Create Failing Test Case)

- 最简单的重现方式
- 如果可能，进行自动化测试
- **在修复之前必须有此项**
- 使用 `test-driven-development` 技能

### 2. 实现单一修复 (Implement Single Fix)

- 解决已识别的根因
- 一次只做一项更改
- 不要添加“顺便”改进
- 不进行捆绑式重构

### 3. 验证修复 (Verify Fix)

```bash
# 运行特定的回归测试
pytest tests/test_module.py::test_regression -v

# 运行完整的套件 — 没有回归问题
pytest tests/ -q
```

### 4. 如果修复无效 — 三次尝试法则 (If Fix Doesn't Work — The Rule of Three)

- **停止。**
- 计数：你尝试了多少个修复？
- 如果 &lt; 3 次：返回第1阶段，带着新信息重新分析
- **如果 ≥ 3 次：停止并质疑架构（见下文第5步）**
- 在进行架构讨论之前，不要尝试第4个修复

### 5. 如果多次修复失败：质疑架构 (If 3+ Fixes Failed: Question Architecture)

**表明存在架构问题的模式：**
- 每次修复都揭示了不同位置的新共享状态/耦合关系
- 修复需要“大规模重构”才能实现
- 每次修复都会在其他地方产生新的症状

**停止并质疑基础原理：**
- 这个模式从根本上来说是合理的吗？
- 我们是在“凭借惯性坚持下去”吗？
- 是应该重构架构，还是继续修复症状？

**在尝试更多修复之前与用户讨论。**

这不是一个失败的假设——这是一个错误的架构。

---

## 警示信号 — 停止并遵循流程 (Red Flags — STOP and Follow Process)

如果你发现自己有以下想法：
- “先快速修复，以后再调查”
- “试试改 X 看是否有效”
- “添加多个更改，然后运行测试”
- “跳过测试，我将手动验证”
- “它可能是 X，让我修复它”
- “我不完全理解，但这可能有用”
- “模式说 A，但我会以不同的方式适应它”
- “主要问题如下：[列出修复方案，但没有调查]”
- 在追踪数据流之前提出解决方案
- **“再尝试一次修复”（当已经尝试了2次以上）**
- **每次修复都揭示了一个不同位置的新问题**

**所有这些都意味着：停止。返回第1阶段。**

**如果3个以上的修复失败：质疑架构（第4阶段第5步）。**

## 常见借口 (Common Rationalizations)

| 借口 | 现实情况 |
|--------|---------|
| “问题很简单，不需要流程” | 简单的问题也存在根因。对于简单的错误来说，流程是快速的。 |
| “紧急情况，没有时间做流程” | 系统化调试比盲目猜测和检查要快得多。 |
| “先试试这个，然后再调查” | 第一个修复奠定了模式。从一开始就把它做好。 |
| “我会在确认修复有效后写测试” | 未经测试的修复是不可靠的。先测试才能证明它有效。 |
| “一次性修复多个问题可以省时间” | 无法隔离出哪些地方奏效了。这会引入新的错误。 |
| “参考资料太长，我要自己适应模式” | 部分理解必然导致错误。请彻底阅读。 |
| “我看到了问题，让我去修复它” | 看到了症状 ≠ 理解根因。 |
| “再尝试一次修复”（失败2次以上） | 3次以上的失败 = 架构问题。质疑模式，不要再次修复。 |

## 快速参考 (Quick Reference)

| 阶段 | 关键活动 | 成功标准 |
|-------|---------------|------------------|
| **1. 根因** | 阅读错误、重现、检查更改、收集证据、追踪数据流 | 理解“是什么”和“为什么” |
| **2. 模式** | 查找工作示例、比较、识别差异 | 知道哪些地方不同了 |
| **3. 假设** | 形成理论、最小化测试、一次一个变量 | 已确认或有新的假设 |
| **4. 实施** | 创建回归测试、修复根因、验证 | 错误已解决，所有测试均通过 |

## Hermes Agent 集成 (Hermes Agent Integration)

### 调查工具 (Investigation Tools)

在第1阶段使用这些 Hermes 工具：

- **`search_files`** — 查找错误字符串、追踪函数调用、定位模式
- **`read_file`** — 对源文件进行带行号的精确分析
- **`terminal`** — 运行测试、检查 Git 历史、重现错误
- **`web_search`/`web_extract`** — 研究错误信息、库文档

### 使用 delegate_task (With delegate_task)

对于复杂的、多组件的调试，派遣调查子智能体：

```python
delegate_task(
    goal="调查为什么 [特定测试/行为] 失败",
    context="""
    遵循 systematic-debugging 技能：
    1. 仔细阅读错误信息
    2. 重现问题
    3. 追踪数据流以找到根因
    4. 报告发现——不要先修复

    错误: [粘贴完整的错误]
    文件: [失败代码的路径]
    测试命令: [确切的命令]
    """,
    toolsets=['terminal', 'file']
)
```

### 使用 test-driven-development (With test-driven-development)

在修复错误时：
1. 编写一个重现错误的测试（RED）
2. 系统化地调试以找到根因
3. 修复根因（GREEN）
4. 测试证明了修复有效，并防止回归

## 实际影响 (Real-World Impact)

从调试会话中得出：
- 系统化方法：15-30 分钟内修复
- 随机修复方法：2-3 小时的盲目乱试
- 首次修复率：95% 对比 40%
- 新引入的错误：接近零 对比常见现象

**没有捷径。没有猜测。系统化总是胜利。**