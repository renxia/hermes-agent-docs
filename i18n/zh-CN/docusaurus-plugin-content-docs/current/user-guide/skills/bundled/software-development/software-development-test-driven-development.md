---
title: "Test Driven Development — TDD: enforce RED-GREEN-REFACTOR, tests before code"
sidebar_label: "Test Driven Development"
description: "TDD: enforce RED-GREEN-REFACTOR, tests before code"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# 测试驱动开发 (Test Driven Development)

TDD: 强制执行 RED-GREEN-REFACTOR，代码编写前先写测试。

## 技能元数据 (Skill metadata)

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/software-development/test-driven-development` |
| Version | `1.1.0` |
| Author | Hermes 智能体 (adapted from obra/superpowers) |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `testing`, `tdd`, `development`, `quality`, `red-green-refactor` |
| Related skills | [`systematic-debugging`](/docs/user-guide/skills/bundled/software-development/software-development-systematic-debugging), [`plan`](/docs/user-guide/skills/bundled/software-development/software-development-plan), [`subagent-driven-development`](/docs/user-guide/skills/optional/software-development/software-development-subagent-driven-development) |

## 参考: full SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# 测试驱动开发 (TDD)

## 概述 (Overview)

先编写测试。观察它失败。然后编写最小代码使其通过。

**核心原则：** 如果你没有看到测试失败，你就不知道它是否测试了正确的事情。

**违反规则的字面意思，就是违背规则的精神。**

## 何时使用 (When to Use)

**始终使用：**
- 新功能
- Bug 修复
- 重构
- 行为变更

**例外情况（先询问用户）：**
- 临时原型 (Throwaway prototypes)
- 生成代码
- 配置文件

想“这次跳过 TDD”？停下。那是合理化。

## 铁律 (The Iron Law)

```
在有失败的测试之前，绝不编写生产代码
```

先写代码再写测试？删除它。重新开始。

**没有例外：**
- 不要将其作为“参考”保留
- 不要一边写测试一边“调整”它
- 不要看它
- 删除就意味着彻底删除

从测试中全新实现。就这样。

## Red-Green-Refactor 循环

### RED — 编写失败的测试 (Write Failing Test)

编写一个最小的测试，展示应该发生什么。

**好的测试：**
```python
def test_retries_failed_operations_3_times():
    attempts = 0
    def operation():
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise Exception('fail')
        return 'success'

    result = retry_operation(operation)

    assert result == 'success'
    assert attempts == 3
```
名称清晰，测试真实行为，只关注一件事。

**坏的测试：**
```python
def test_retry_works():
    mock = MagicMock()
    mock.side_effect = [Exception(), Exception(), 'success']
    result = retry_operation(mock)
    assert result == 'success'  # 那么重试次数呢？时序呢？
```
名称模糊，测试的是模拟对象 (mock)，而不是真实代码。

**要求：**
- 每个测试只关注一种行为
- 清晰的描述性名称（名字里带“和”字吗？那就拆分）
- 真实的代码，而不是模拟对象（除非绝对无法避免）
- 名称描述行为，而非实现细节

### 验证 RED — 观察它失败 (Verify RED — Watch It Fail)

**强制要求。绝不能跳过。**

```bash
# 使用终端工具运行特定的测试
pytest tests/test_feature.py::test_specific_behavior -v
```

确认：
- 测试失败（不是拼写错误导致的错误）
- 失败信息是预期的
- 之所以失败是因为功能缺失

**测试立即通过？** 你正在测试已有的行为。请修复测试。

**测试报错？** 修复错误，重新运行直到它正确地失败。

### GREEN — 最小代码 (Minimal Code)

编写最简单的代码使其通过测试。不多一分。

**好的实现：**
```python
def add(a, b):
    return a + b  # 没有多余的功能
```

**坏的实现：**
```python
def add(a, b):
    result = a + b
    logging.info(f"Adding {a} + {b} = {result}")  # 多余！
    return result
```

不要添加功能、重构其他代码，或“超越”测试的范畴。

**在 GREEN 阶段作弊是允许的：**
- 硬编码返回值
- 复制粘贴
- 重复代码
- 跳过边缘案例

我们会在 REFACTOR 阶段修复它。

### 验证 GREEN — 观察它通过 (Verify GREEN — Watch It Pass)

**强制要求。**

```bash
# 运行特定的测试
pytest tests/test_feature.py::test_specific_behavior -v

# 然后运行所有测试以检查回归问题
pytest tests/ -q
```

确认：
- 测试通过
- 其他测试仍然通过
- 输出干净（没有错误、警告）

**测试失败？** 修复代码，而不是修复测试。

**其他测试失败？** 现在就修复回归问题。

### REFACTOR — 清理 (Clean Up)

仅在 GREEN 之后进行：
- 移除重复的代码
- 改进名称
- 提取辅助函数
- 简化表达式

保持测试通过。不要添加新功能。

**如果在重构过程中测试失败：** 立即撤销。采取更小的步骤。

### 重复 (Repeat)

下一个失败的测试对应下一个行为。一次一个循环地进行。

## 为什么顺序很重要 (Why Order Matters)

**“我等代码写完再写测试来验证它是否工作”**

在代码编写完成后立即通过的测试，并不能证明任何事情：
- 可能测试错了东西
- 可能测试了实现细节，而不是行为
- 可能遗漏了你忘记的边缘案例
- 你从未见过它捕获 Bug

先测试强制你看到测试失败，这才能证明它确实在测试某件事。

**“我已经手动测试了所有边缘案例”**

手动测试是临时性的 (ad-hoc)。你认为自己测试了一切，但：
- 没有记录你测试了什么
- 当代码改变时无法重新运行
- 在压力下很容易忘记某些情况
- “我尝试的时候它能工作” ≠ 彻底全面

自动化测试是系统的。它们每次都以相同的方式运行。

**“删除 X 小时的工作是浪费的”**

沉没成本谬误 (Sunk cost fallacy)。时间已经过去了。你现在的选择是：
- 删除并使用 TDD 重写（高置信度）
- 保留它并在之后添加测试（低置信度，很可能存在 Bug）

“浪费”在于保留着你无法信任的代码。

**“TDD 是教条主义的，务实地做意味着适应”**

TDD 是务实的：
- 在提交前发现 Bug（比调试后更快）
- 防止回归问题（测试会立即捕获中断）
- 记录行为（测试展示了如何使用代码）
- 支持重构（可以自由更改，测试会捕获中断）

“务实”的捷径 = 在生产环境中调试 = 更慢。

**“先写测试后实现能达到相同的目标——这是精神而非仪式”**

不。先测试回答的是“它应该做什么？” 先写测试后实现回答的是“它做的是什么？”

先写测试后的测试受制于你的实现。你测试了你构建的东西，而不是所需的东西。先测试强制你在实现之前发现边缘案例。

## 常见的借口 (Common Rationalizations)

| 借口 | 现实情况 |
|--------|---------|
| “太简单了，不需要测试” | 简单的代码也会出错。测试需要 30 秒。 |
| “我等以后再测” | 测试立即通过并不能证明任何事情。 |
| “先写测试后实现能达到相同的目标” | 先写测试后 = “它做的是什么？” 先测试 = “它应该做什么？” |
| “我已经手动测试过了” | 临时性 ≠ 系统化。没有记录，无法重新运行。 |
| “删除 X 小时是浪费的” | 沉没成本谬误。保留未经验证的代码就是技术债务。 |
| “先作为参考保留，再写测试” | 你会去调整它。那就是先测试后实现。删除就意味着彻底删除。 |
| “需要先探索一下” | 可以。扔掉探索结果，从 TDD 开始。 |
| “测试困难 = 设计不清” | 听从测试的意见。难以测试 = 难用。 |
| “TDD 会拖慢我的进度” | TDD 比调试更快。务实地做就是先测试。 |
| “手动测试更快” | 手动测试不能证明边缘案例。你将不得不重新测试每一次更改。 |
| “现有代码没有测试” | 你正在改进它。为你触及的代码添加测试。 |

## 警示信号 — 停止并重来 (Red Flags — STOP and Start Over)

如果你发现自己做出了以下任何一件事，请删除代码并使用 TDD 重启：

- 先于测试编写代码
- 代码实现后再进行测试
- 测试第一次运行时立即通过
- 无法解释为什么测试失败
- “稍后”添加的测试
- 合理化“就这一次”
- “我已经手动测试过了”
- “先写测试后能达到相同的目的”
- “作为参考保留”或“调整现有代码”
- “已经花了 X 小时，删除是浪费的”
- “TDD 是教条主义的，我是在务实地做”
- “因为这是不同的…”

**所有这些都意味着：删除代码。使用 TDD 重启。**

## 验证清单 (Verification Checklist)

在标记工作完成之前：

- [ ] 每个新的函数/方法都有测试
- [ ] 在实现前观察了每个测试失败
- [ ] 每个测试的失败原因都是预期的（功能缺失，而不是拼写错误）
- [ ] 为通过每个测试编写了最小代码
- [ ] 所有测试都通过
- [ ] 输出干净（没有错误、警告）
- [ ] 测试使用了真实的代码（只有在不可避免时才使用模拟对象）
- [ ] 覆盖了边缘案例和错误

无法勾选所有方框？你跳过了 TDD。请重来。

## 卡住时的解决方案 (When Stuck)

| 问题 | 解决方案 |
|---------|----------|
| 不知道如何测试 | 编写期望的 API。先写断言。询问用户。 |
| 测试过于复杂 | 设计过于复杂。简化接口。 |
| 必须模拟所有东西 | 代码耦合度过高。使用依赖注入 (dependency injection)。 |
| 测试设置庞大 | 提取辅助函数。仍然复杂？请简化设计。 |

## Hermes 智能体集成 (Hermes Agent Integration)

### 运行测试 (Running Tests)

使用 `terminal` 工具在每个步骤运行测试：

```python
# RED — 验证失败
terminal("pytest tests/test_feature.py::test_name -v")

# GREEN — 验证通过
terminal("pytest tests/test_feature.py::test_name -v")

# 全套测试 — 验证没有回归问题
terminal("pytest tests/ -q")
```

### 使用 delegate_task (With delegate_task)

在分派子智能体进行实现时，必须在目标中强制执行 TDD：

```python
delegate_task(
    goal="使用严格的 TDD 实现 [功能]",
    context="""
    遵循测试驱动开发技能：
    1. 先编写失败的测试
    2. 运行测试以验证它失败
    3. 编写最小代码使其通过
    4. 运行测试以验证它通过
    5. 必要时进行重构
    6. 提交

    项目测试命令: pytest tests/ -q
    项目结构: [描述相关文件]
    """,
    toolsets=['terminal', 'file']
)
```

### 使用 systematic-debugging (With systematic-debugging)

发现 Bug 了？编写一个重现它的失败测试。遵循 TDD 循环。该测试证明了修复有效，并防止了回归问题。

绝不能在没有测试的情况下修复 Bug。

## 测试反模式 (Testing Anti-Patterns)

- **测试模拟对象的行为而不是真实的行为** — 模拟对象应该验证交互，而不是替代被测系统
- **测试实现细节** — 测试行为/结果，而不是内部方法调用
- **只关注正常路径 (Happy path)** — 始终测试边缘案例、错误和边界条件
- **脆弱的测试 (Brittle tests)** — 测试应该验证行为，而不是结构；重构不应该破坏它们

## 最终规则 (Final Rule)

```
生产代码 → 存在且先失败的测试
否则 → 不是 TDD
```

除非获得用户的明确许可，否则没有例外。