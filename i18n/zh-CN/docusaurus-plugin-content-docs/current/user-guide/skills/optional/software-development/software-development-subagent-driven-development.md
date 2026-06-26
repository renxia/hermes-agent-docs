---
title: Subagent Driven Development — Execute plans via delegate_task subagents (2-stage review)
sidebar_label: Subagent Driven Development
description: Execute plans via delegate_task subagents (2-stage review)
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# 子智能体驱动开发

通过 `delegate_task` 子智能体执行计划（两阶段审查）。

## 技能元数据

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/software-development/subagent-driven-development` 安装 |
| Path | `optional-skills/software-development/subagent-driven-development` |
| Version | `1.1.0` |
| Author | Hermes 智能体 (基于 obra/superpowers 适配) |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `delegation`, `subagent`, `implementation`, `workflow`, `parallel` |
| Related skills | [`plan`](/docs/user-guide/skills/bundled/software-development/software-development-plan), [`requesting-code-review`](/docs/user-guide/skills/bundled/software-development/software-development-requesting-code-review), [`test-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-test-driven-development) |

## 参考: full SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 子智能体驱动开发

## 概述

通过分派针对每个任务的新鲜子智能体，并进行系统性的两阶段审查来执行实现计划。

**核心原则：** 每个任务一个新智能体 + 两阶段审查（规范 -> 质量）= 高质量、快速迭代。

## 何时使用

当满足以下条件时，请使用此技能：
- 您有一个实现计划（来自 `plan` 技能或用户需求）。
- 任务大多是独立的。
- 质量和规范合规性很重要。
- 您希望在任务之间进行自动化审查。

**与手动执行的对比：**
- 每个任务都有新的上下文（不会受到累积状态的影响而产生困惑）。
- 自动化审查过程能及早地发现问题。
- 所有任务都具有一致的质量检查。
- 子智能体可以在开始工作前提出问题。

## 流程

### 1. 读取和解析计划

读取计划文件。预先提取所有任务及其完整文本和上下文。创建一个待办事项列表：

```python
# 读取计划
read_file("docs/plans/feature-plan.md")

# 创建包含所有任务的待办事项列表
todo([
    {"id": "task-1", "content": "创建带有电子邮件字段的用户模型", "status": "pending"},
    {"id": "task-2", "content": "添加密码哈希工具", "status": "pending"},
    {"id": "task-3", "content": "创建登录端点", "status": "pending"},
])
```

**要点：** 只读取计划一次。提取所有内容。不要让子智能体去阅读计划文件——而是直接在上下文中提供完整的任务文本。

### 2. 每个任务的工作流程

对于计划中的每个任务：

#### 步骤 1: 分派实现者智能体

使用 `delegate_task` 并提供完整的上下文：

```python
delegate_task(
    goal="实现任务 1: 创建带有电子邮件和 password_hash 字段的用户模型",
    context="""
    来自计划的任务:
    - 创建: src/models/user.py
    - 使用包含 email (str) 和 password_hash (str) 字段的用户类
    - 使用 bcrypt 进行密码哈希处理
    - 为调试目的包括 __repr__

    遵循 TDD:
    1. 在 tests/models/test_user.py 中编写失败的测试用例
    2. 运行: pytest tests/models/test_user.py -v (验证 FAIL)
    3. 编写最小实现代码
    4. 运行: pytest tests/models/test_user.py -v (验证 PASS)
    5. 运行: pytest tests/ -q (验证无回归问题)
    6. 提交: git add -A && git commit -m "feat: add User model with password hashing"

    项目上下文:
    - Python 3.11, Flask 应用在 src/app.py 中
    - src/models/ 中的现有模型
    - 测试使用 pytest，从项目根目录运行
    - bcrypt 已包含在 requirements.txt 中
    """,
    toolsets=['terminal', 'file']
)
```

#### 步骤 2: 分派规范合规性审查者

实现者完成后，进行与原始规范的对比验证：

```python
delegate_task(
    goal="审查实现是否符合计划中的规范",
    context="""
    原始任务规范:
    - 创建包含 User 类的 src/models/user.py
    - 字段: email (str), password_hash (str)
    - 使用 bcrypt 进行密码哈希处理
    - 包括 __repr__

    检查项:
    - [ ] 是否实现了所有规范要求？
    - [ ] 文件路径是否符合规范？
    - [ ] 函数签名是否符合规范？
    - [ ] 行为是否符合预期？
    - [ ] 是否没有添加额外内容（无范围蔓延）？

    输出: PASS 或需要修复的具体规范差距列表。
    """,
    toolsets=['file']
)
```

**如果发现规范问题：** 修复差距，然后重新运行规范审查。只有在符合规范后才能继续。

#### 步骤 3: 分派代码质量审查者

规范合规性通过后：

```python
delegate_task(
    goal="审查任务 1 实现的代码质量",
    context="""
    需要审查的文件:
    - src/models/user.py
    - tests/models/test_user.py

    检查项:
    - [ ] 是否遵循项目约定和风格？
    - [ ] 是否有适当的错误处理？
    - [ ] 变量/函数名称是否清晰？
    - [ ] 测试覆盖率是否足够？
    - [ ] 是否没有明显的错误或遗漏的边界情况？
    - [ ] 是否没有安全问题？

    输出格式:
    - 关键问题 (Critical Issues): [必须在继续之前修复]
    - 重要问题 (Important Issues): [应该修复]
    - 次要问题 (Minor Issues): [可选]
    - 裁决结果 (Verdict): APPROVED 或 REQUEST_CHANGES
    """,
    toolsets=['file']
)
```

**如果发现质量问题：** 修复问题，重新审查。只有在批准后才能继续。

#### 步骤 4: 标记完成

```python
todo([{"id": "task-1", "content": "创建带有电子邮件字段的用户模型", "status": "completed"}], merge=True)
```

### 3. 最终审查

所有任务完成后，分派一个最终的集成审查者：

```python
delegate_task(
    goal="审查整个实现以确保一致性和集成问题",
    context="""
    计划中的所有任务均已完成。请审查完整的实现:
    - 所有组件是否协同工作？
    - 任务之间是否存在任何不一致之处？
    - 所有测试都通过了吗？
    - 是否准备好合并？
    """,
    toolsets=['terminal', 'file']
)
```

### 4. 验证和提交

```bash
# 运行完整的测试套件
pytest tests/ -q

# 审查所有更改
git diff --stat

# 如果需要，则最终提交
git add -A && git commit -m "feat: complete [feature name] implementation"
```

## 任务粒度

**每个任务 = 2-5 分钟的专注工作。**

**太大：**
- “实现用户认证系统”

**合适的尺寸：**
- “创建带有电子邮件和密码字段的用户模型”
- “添加密码哈希函数”
- “创建登录端点”
- “添加 JWT 代币生成”
- “创建注册端点”

## 警示信号 — 切勿做这些事

- 在没有计划的情况下开始实现。
- 跳过审查（规范合规性或代码质量）。
- 继续处理未修复的关键/重要问题。
- 为涉及相同文件的任务分派多个实现者智能体。
- 让子智能体阅读计划文件（请在上下文中提供完整文本）。
- 跳过场景设置上下文（子智能体需要了解该任务处于什么位置）。
- 忽略子智能体提出的问题（让他们继续之前先回答）。
- 对规范合规性采取“差不多就行”的态度。
- 跳过审查循环（审查者发现问题 -> 实现者修复 -> 再次审查）。
- 让实现者自我审查来替代实际审查（两者都需要）。
- **在规范合规性通过之前开始代码质量审查** (顺序错误)。
- 在任一审查仍有未解决的问题时移动到下一个任务。

## 处理问题

### 如果子智能体提出问题

- 清晰、完整地回答。
- 如有必要，提供额外的上下文。
- 不要催促他们进行实现。

### 如果审查者发现问题

- 实现者智能体（或新的智能体）进行修复。
- 审查者再次审查。
- 重复直到批准。
- 不要跳过重新审查。

### 如果子智能体失败一个任务

- 分派一个新的修复智能体，并提供关于哪里出了错的具体指示。
- 不要尝试在控制器会话中手动修复（上下文污染）。

## 效率说明

**为什么每个任务都使用新的子智能体：**
- 防止来自累积状态的上下文污染。
- 每个子智能体都能获得干净、集中的上下文。
- 不会因为先前任务的代码或推理而产生困惑。

**为什么进行两阶段审查：**
- 规范审查可以及早地发现过度/不足构建的问题。
- 质量审查确保实现是高质量的。
- 在问题累积起来之前就捕获它们。

**成本权衡：**
- 需要更多的子智能体调用（每个任务一个实现者 + 2 个审查者）。
- 但这可以及早地发现问题（比稍后调试已复合的问题要便宜得多）。

## 与其他技能的集成

### 与 plan (计划)

此技能执行由 `plan` 技能创建的计划：
1. 用户需求 → 计划 → 实现计划
2. 实现计划 → 子智能体驱动开发 → 可工作代码

### 与 test-driven-development (测试驱动开发)

实现者智能体应遵循 TDD：
1. 先编写失败的测试用例。
2. 实现最小代码。
3. 验证测试通过。
4. 提交。

在每个实现者的上下文中包含 TDD 指令。

### 与 requesting-code-review (请求代码审查)

两阶段审查过程本身就是代码审查。对于最终的集成审查，请使用 `requesting-code-review` 技能的审查维度。

### 与 systematic-debugging (系统性调试)

如果子智能体在实现过程中遇到错误：
1. 遵循系统性调试流程。
2. 在修复之前找到根本原因。
3. 编写回归测试用例。
4. 恢复实现。

## 示例工作流程

```
[读取计划: docs/plans/auth-feature.md]
[创建包含 5 个任务的待办事项列表]

--- 任务 1: 创建用户模型 ---
[分派实现者智能体]
  实现者: "电子邮件是否必须是唯一的？"
  您: "是的，电子邮件必须是唯一的"
  实现者: 已实现，3/3 测试通过，已提交。

[分派规范审查者]
  规范审查者: ✅ 通过 — 所有要求均已满足

[分派质量审查者]
  质量审查者: ✅ 批准 — 代码干净，测试良好

[标记任务 1 完成]

--- 任务 2: 密码哈希 ---
[分派实现者智能体]
  实现者: 没有问题，已实现，5/5 测试通过。

[分派规范审查者]
  规范审查者: ❌ 缺失: 密码强度验证（规范要求“最小 8 个字符”）

[实现者修复]
  实现者: 已添加验证，7/7 测试通过。

[再次分派规范审查者]
  规范审查者: ✅ 通过

[分派质量审查者]
  质量审查者: 重要: 数字 8，提取为常量
  实现者: 已提取 MIN_PASSWORD_LENGTH 常量
  质量审查者: ✅ 批准

[标记任务 2 完成]

... (继续所有任务)

[所有任务完成后: 分派最终集成审查者]
[运行完整的测试套件: 全部通过]
[完成!]
```

## 记住

```
每个任务一个新智能体
每次都进行两阶段审查
规范合规性优先
代码质量其次
绝不跳过审查
及早地发现问题
```

**质量不是偶然的。它是系统化流程的结果。**

## 进一步阅读（在相关时加载）

当编排涉及大量的上下文使用、漫长的审查循环或复杂的验证检查点时，请加载这些参考资料以实现特定的纪律：

- **`references/context-budget-discipline.md`** — 四级上下文退化模型 (PEAK / GOOD / DEGRADING / POOR)、随上下文窗口大小扩展的读取深度规则以及静默退化的早期预警信号。当运行将明显消耗大量上下文时（多阶段计划、多个智能体、大型工件），请加载此文件。
- **`references/gates-taxonomy.md`** — 四种规范的范式类型（Pre-flight, Revision, Escalation, Abort）及其行为、恢复和示例。当设计或审查任何具有验证检查点的流程时，请加载此文件——明确使用这些词汇，确保每个门都有定义的进入点、失败行为和恢复规则。

两个参考资料均改编自 gsd-build/get-shit-done (MIT © 2025 Lex Christopherson)。