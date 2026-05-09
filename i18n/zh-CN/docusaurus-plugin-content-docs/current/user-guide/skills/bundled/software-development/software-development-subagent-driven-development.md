---
title: "子智能体驱动开发 — 通过 delegate_task 子智能体执行计划（两阶段审查）"
sidebar_label: "子智能体驱动开发"
description: "通过 delegate_task 子智能体执行计划（两阶段审查）"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成的。请编辑源文件 SKILL.md，而不是此页面。 */}

# 子智能体驱动开发

通过 delegate_task 子智能体执行计划（两阶段审查）。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/software-development/subagent-driven-development` |
| 版本 | `1.1.0` |
| 作者 | Hermes Agent（改编自 obra/superpowers） |
| 许可证 | MIT |
| 标签 | `委派`, `子智能体`, `实现`, `工作流`, `并行` |
| 相关技能 | [`编写计划`](/docs/user-guide/skills/bundled/software-development/software-development-writing-plans), [`请求代码审查`](/docs/user-guide/skills/bundled/software-development/software-development-requesting-code-review), [`测试驱动开发`](/docs/user-guide/skills/bundled/software-development/software-development-test-driven-development) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在此技能触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 子智能体驱动开发

## 概述

通过为每个任务分派新的子智能体，并结合系统化的两阶段审查来执行实现计划。

**核心原则：** 每个任务使用新的子智能体 + 两阶段审查（规范审查，然后质量审查）= 高质量、快速迭代。

## 何时使用

在以下情况下使用此技能：
- 您有一个实现计划（来自 writing-plans 技能或用户需求）
- 任务大多是独立的
- 质量和规范合规性很重要
- 您希望在任务之间进行自动审查

**与手动执行相比：**
- 每个任务都有新的上下文（不会因累积状态而产生混淆）
- 自动审查过程可以及早发现问题
- 对所有任务进行一致的质量检查
- 子智能体可以在开始工作之前提出问题

## 流程

### 1. 读取和解析计划

读取计划文件。预先提取所有任务及其完整文本和上下文。创建待办事项列表：

```python
# 读取计划
read_file("docs/plans/feature-plan.md")

# 创建包含所有任务的待办事项列表
todo([
    {"id": "task-1", "content": "创建带有 email 字段的 User 模型", "status": "pending"},
    {"id": "task-2", "content": "添加密码哈希工具", "status": "pending"},
    {"id": "task-3", "content": "创建登录端点", "status": "pending"},
])
```

**关键点：** 仅读取计划一次。提取所有内容。不要让子智能体读取计划文件 —— 而是在上下文中直接提供完整的任务文本。

### 2. 每个任务的流程

对于计划中的每个任务：

#### 步骤 1：分派实现者子智能体

使用 `delegate_task` 并提供完整的上下文：

```python
delegate_task(
    goal="实现任务 1：创建带有 email 和 password_hash 字段的 User 模型",
    context="""
    计划中的任务：
    - 创建：src/models/user.py
    - 添加带有 email (str) 和 password_hash (str) 字段的 User 类
    - 使用 bcrypt 进行密码哈希
    - 包含用于调试的 __repr__

    遵循 TDD：
    1. 在 tests/models/test_user.py 中编写失败的测试
    2. 运行：pytest tests/models/test_user.py -v（验证失败）
    3. 编写最小实现
    4. 运行：pytest tests/models/test_user.py -v（验证通过）
    5. 运行：pytest tests/ -q（验证无回归）
    6. 提交：git add -A && git commit -m "feat: add User model with password hashing"

    项目上下文：
    - Python 3.11，Flask 应用程序位于 src/app.py
    - 现有模型位于 src/models/
    - 测试使用 pytest，从项目根目录运行
    - bcrypt 已在 requirements.txt 中
    """,
    toolsets=['terminal', 'file']
)
```

#### 步骤 2：分派规范合规性审查者

实现者完成后，对照原始规范进行验证：

```python
delegate_task(
    goal="审查实现是否符合计划中的规范",
    context="""
    原始任务规范：
    - 创建带有 User 类的 src/models/user.py
    - 字段：email (str), password_hash (str)
    - 使用 bcrypt 进行密码哈希
    - 包含 __repr__

    检查：
    - [ ] 是否实现了规范中的所有要求？
    - [ ] 文件路径是否与规范匹配？
    - [ ] 函数签名是否与规范匹配？
    - [ ] 行为是否符合预期？
    - [ ] 没有添加额外内容（无范围蔓延）？

    输出：通过或列出需要修复的具体规范差距。
    """,
    toolsets=['file']
)
```

**如果发现规范问题：** 修复差距，然后重新运行规范审查。仅在符合规范后才继续。

#### 步骤 3：分派代码质量审查者

规范合规性通过后：

```python
delegate_task(
    goal="审查任务 1 实现的代码质量",
    context="""
    要审查的文件：
    - src/models/user.py
    - tests/models/test_user.py

    检查：
    - [ ] 是否遵循项目约定和风格？
    - [ ] 是否有适当的错误处理？
    - [ ] 变量/函数名称是否清晰？
    - [ ] 是否有足够的测试覆盖？
    - [ ] 是否有明显的错误或遗漏的边缘情况？
    - [ ] 是否有安全问题？

    输出格式：
    - 关键问题：[继续之前必须修复]
    - 重要问题：[应该修复]
    - 次要问题：[可选]
    - 结论：通过或请求更改
    """,
    toolsets=['file']
)
```

**如果发现质量问题：** 修复问题，重新审查。仅在获得批准后继续。

#### 步骤 4：标记完成

```python
todo([{"id": "task-1", "content": "创建带有 email 字段的 User 模型", "status": "completed"}], merge=True)
```

### 3. 最终审查

所有任务完成后，分派一个最终集成审查者：

```python
delegate_task(
    goal="审查整个实现的一致性和集成问题",
    context="""
    计划中的所有任务都已完成。审查完整实现：
    - 所有组件是否协同工作？
    - 任务之间是否存在不一致？
    - 所有测试是否通过？
    - 是否准备好合并？
    """,
    toolsets=['terminal', 'file']
)
```

### 4. 验证和提交

```bash
# 运行完整测试套件
pytest tests/ -q

# 审查所有更改
git diff --stat

# 如果需要，进行最终提交
git add -A && git commit -m "feat: complete [feature name] implementation"
```

## 任务粒度

**每个任务 = 2-5 分钟的专注工作。**

**太大：**
- “实现用户认证系统”

**合适的大小：**
- “创建带有 email 和密码字段的 User 模型”
- “添加密码哈希函数”
- “创建登录端点”
- “添加 JWT 令牌生成”
- “创建注册端点”

## 危险信号 —— 切勿执行以下操作

- 没有计划就开始实现
- 跳过审查（规范合规性或代码质量）
- 继续存在未修复的关键/重要问题
- 为触及相同文件的任务分派多个实现子智能体
- 让子智能体读取计划文件（而是在上下文中提供完整文本）
- 跳过场景设置上下文（子智能体需要理解任务的位置）
- 忽略子智能体的问题（在让他们继续之前回答）
- 在规范合规性上接受“差不多”
- 跳过审查循环（审查者发现问题 → 实现者修复 → 再次审查）
- 让实现者自我审查代替实际审查（两者都需要）
- **在规范合规性通过之前开始代码质量审查**（顺序错误）
- 在任一审查存在未解决问题时进入下一个任务

## 处理问题

### 如果子智能体提出问题

- 清晰完整地回答
- 如果需要，提供额外的上下文
- 不要催促他们进入实现

### 如果审查者发现问题

- 实现者子智能体（或新的子智能体）修复它们
- 审查者再次审查
- 重复直到获得批准
- 不要跳过重新审查

### 如果子智能体任务失败

- 分派一个新的修复子智能体，并提供关于出错内容的具体说明
- 不要尝试在控制器会话中手动修复（上下文污染）

## 效率说明

**为什么每个任务使用新的子智能体：**
- 防止因累积状态导致的上下文污染
- 每个子智能体获得干净、专注的上下文
- 不会因先前任务的代码或推理而产生混淆

**为什么进行两阶段审查：**
- 规范审查可以及早发现构建不足/过度构建的问题
- 质量审查确保实现构建良好
- 在问题累积到多个任务之前发现问题

**成本权衡：**
- 更多的子智能体调用（每个任务一个实现者 + 两个审查者）
- 但可以及早发现问题（比稍后调试累积问题更便宜）

## 与其他技能的集成

### 与 writing-plans

此技能执行由 writing-plans 技能创建的**计划**：
1. 用户需求 → writing-plans → 实现计划
2. 实现计划 → 子智能体驱动开发 → 可工作代码

### 与 test-driven-development

实现者子智能体应遵循 TDD：
1. 首先编写失败的测试
2. 实现最小代码
3. 验证测试通过
4. 提交

在每个实现者上下文中包含 TDD 说明。

### 与 requesting-code-review

两阶段审查过程就是代码审查。对于最终集成审查，请使用 requesting-code-review 技能的审查维度。

### 与 systematic-debugging

如果子智能体在实现过程中遇到错误：
1. 遵循 systematic-debugging 流程
2. 在修复之前找到根本原因
3. 编写回归测试
4. 恢复实现

## 示例工作流程

```
[读取计划：docs/plans/auth-feature.md]
[创建包含 5 个任务的待办事项列表]

--- 任务 1：创建 User 模型 ---
[分派实现者子智能体]
  实现者：“email 应该是唯一的吗？”
  您：“是的，email 必须是唯一的”
  实现者：已实现，3/3 测试通过，已提交。

[分派规范审查者]
  规范审查者：✅ 通过 — 满足所有要求

[分派质量审查者]
  质量审查者：✅ 批准 — 代码清晰，测试良好

[标记任务 1 完成]

--- 任务 2：密码哈希 ---
[分派实现者子智能体]
  实现者：没有问题，已实现，5/5 测试通过。

[分派规范审查者]
  规范审查者：❌ 缺失：密码强度验证（规范要求“最少 8 个字符”）

[实现者修复]
  实现者：添加了验证，7/7 测试通过。

[再次分派规范审查者]
  规范审查者：✅ 通过

[分派质量审查者]
  质量审查者：重要：魔法数字 8，提取为常量
  实现者：提取了 MIN_PASSWORD_LENGTH 常量
  质量审查者：✅ 批准

[标记任务 2 完成]

...（继续所有任务）

[所有任务完成后：分派最终集成审查者]
[运行完整测试套件：全部通过]
[完成！]
```

## 记住

```
每个任务使用新的子智能体
每次都要进行两阶段审查
首先确保符合规范
其次保证代码质量
绝不跳过审查
尽早发现问题
```

**质量不是偶然的。它是系统性流程的结果。**

## 进一步阅读（在相关时加载）

当编排涉及大量上下文使用、长审查循环或复杂的验证检查点时，请加载以下特定学科的参考资料：

- **`references/context-budget-discipline.md`** — 四级上下文退化模型（峰值 / 良好 / 退化 / 差），根据上下文窗口大小调整的深度阅读规则，以及无声退化的早期预警信号。当运行明显会消耗大量上下文时（多阶段计划、多个子智能体、大型工件）加载。
- **`references/gates-taxonomy.md`** — 四种规范的门类型（预检、修订、升级、中止）及其行为、恢复和示例。在设计或审查任何具有验证检查点的工作流时加载 — 明确使用该词汇，以便每个门都有明确的入口、失败行为和恢复规则。

两个参考资料均改编自 gsd-build/get-shit-done (MIT © 2025 Lex Christopherson)。