Plan — 计划模式：撰写可操作的markdown计划
sidebar_label: "计划"
description: "计划模式：撰写可操作的markdown计划"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# 计划

计划模式：撰写可操作的markdown计划到.hermes/plans/，不执行。包含小份任务、精确路径和完整代码。

## 技能元数据

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/software-development/plan` |
| Version | `2.0.0` |
| Author | Hermes 智能体 (基于obra/superpowers的写作工艺) |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `planning`, `plan-mode`, `implementation`, `workflow`, `design`, `documentation` |
| Related skills | [`subagent-driven-development`](/docs/user-guide/skills/optional/software-development/software-development-subagent-driven-development), [`test-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-test-driven-development), [`requesting-code-review`](/docs/user-guide/skills/bundled/software-development/software-development-requesting-code-review) |

## 参考：完整SKILL.md

:::info
以下是当此技能被触发时，Hermes加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# 计划模式

当用户需要计划而不是执行时，请使用此技能。

## 核心行为

对于本次轮次，你只需进行规划。

- 不实现代码。
- 除了计划markdown文件外，不编辑项目文件。
- 不运行会修改的终端命令、提交或推送，也不执行外部操作。
- 在需要时，可以使用只读命令/工具检查仓库或其他上下文。
- 你的交付物是保存在活动工作区下的`.hermes/plans/`中的一个markdown计划。

## 输出要求

撰写一份具体且可操作的markdown计划。

包括（如果相关）：
- 目标 (Goal)
- 当前上下文/假设 (Current context / assumptions)
- 拟议方法 (Proposed approach)
- 循序渐进的计划 (Step-by-step plan)
- 可能更改的文件 (Files likely to change)
- 测试/验证 (Tests / validation)
- 风险、权衡和未决问题 (Risks, tradeoffs, and open questions)

如果任务与代码相关，请包括精确的文件路径、可能的测试目标和验证步骤。

## 保存位置

使用`write_file`以以下名称保存计划：
- `.hermes/plans/YYYY-MM-DD_HHMMSS-<slug>.md`

这相对于活动工作目录/后端工作区而言。Hermes文件工具具有后端感知能力，因此使用此相对路径可以确保计划与本地、docker、ssh、modal和daytona后端的工作区保持一致。

如果运行时提供了特定的目标路径，请使用该精确路径。
如果没有，请自行在`.hermes/plans/`下创建一个合理的带时间戳的文件名。

## 交互风格

- 如果请求足够清晰，则直接撰写计划。
- 如果`/plan`没有伴随任何明确指令，请从当前的对话上下文推断任务。
- 如果任务确实不完整，请提出一个简短的澄清问题，而不是猜测。
- 保存计划后，简要回复你规划的内容和保存的路径。

---

# 撰写高质量的计划

本技能的其余部分是撰写一份*优质*实施计划的技艺——即放入上述markdown文件中的内容。

## 概述

撰写全面的实施计划，假设执行者对代码库一无所知，并且品味堪忧。记录他们所需的一切：需要修改哪些文件、完整的代码、测试命令、需要检查的文档、如何验证。给他们小份任务。DRY（不要重复自己）。YAGNI（你不需要它）。TDD（测试驱动开发）。频繁提交。

假设执行者是一位熟练的开发者，但对工具集或问题领域几乎一无所知。假设他们不太了解好的测试设计。

**核心原则：** 一个好的计划能让实施变得显而易见。如果有人需要猜测，那么这个计划就是不完整的。

## 何时一份完整的实施计划会有帮助

**始终使用：**
- 实施多步骤功能
- 拆分复杂的需求
- 通过智能体驱动的开发（subagent-driven-development）委托给子智能体

**不要跳过：**
- 功能看起来很简单时（假设会导致错误）
- 你打算自己实现它时（未来的你需要指导）
- 单独工作时（文档很重要）

## 小份任务粒度

**每个任务 = 2-5 分钟的专注工作。**

每一步都是一个行动：
- "编写失败的测试" — 一步
- "运行测试以确保它失败" — 一步
- "实现最小代码以使测试通过" — 一步
- "运行测试并确保它们通过" — 一步
- "提交" — 一步

**太大：**
```markdown
### 任务 1: 构建认证系统
[跨5个文件，50行代码]
```

**合适的尺寸：**
```markdown
### 任务 1: 使用电子邮件字段创建用户模型
[10行, 1个文件]

### 任务 2: 为User添加密码哈希字段
[8行, 1个文件]

### 任务 3: 创建密码哈希工具
[15行, 1个文件]
```

## 计划文档结构

### 头部（必需）

每个计划都必须以以下内容开头：

```markdown
# [功能名称] 实施计划

> **致Hermes:** 使用智能体驱动的开发技能来逐任务地实现此计划。

**目标:** [用一句话描述这构建了什么]

**架构:** [关于方法的2-3句话]

**技术栈:** [关键技术/库]

---
```

### 任务结构

每个任务都遵循以下格式：

````markdown
### 任务 N: [描述性名称]

**目标:** 这个任务完成了什么（一句话）

**文件:**
- 创建: `exact/path/to/new_file.py`
- 修改: `exact/path/to/existing.py:45-67` (如果知道行号)
- 测试: `tests/path/to/test_file.py`

**步骤 1: 编写失败的测试**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**步骤 2: 运行测试以验证失败**

运行: `pytest tests/path/test.py::test_specific_behavior -v`
预期: FAIL — "function not defined"

**步骤 3: 编写最小实现**

```python
def function(input):
    return expected
```

**步骤 4: 运行测试以验证通过**

运行: `pytest tests/path/test.py::test_specific_behavior -v`
预期: PASS

**步骤 5: 提交**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## 工作流程

### 步骤 1: 理解需求

阅读并理解：
- 功能需求
- 设计文档或用户描述
- 可接受性标准
- 限制条件

### 步骤 2: 探索代码库

使用Hermes工具来了解项目：

```python
# 理解项目结构
search_files("*.py", target="files", path="src/")

# 查看相似功能
search_files("similar_pattern", path="src/", file_glob="*.py")

# 检查现有测试
search_files("*.py", target="files", path="tests/")

# 读取关键文件
read_file("src/app.py")
```

### 步骤 3: 设计方法

决定：
- 架构模式
- 文件组织结构
- 所需的依赖项
- 测试策略

### 步骤 4: 编写任务

按顺序创建任务：
1. 设置/基础设施
2. 核心功能（对每个功能进行TDD）
3. 边缘情况
4. 集成
5. 清理/文档

### 步骤 5: 添加完整细节

对于每个任务，包括：
- **精确的文件路径** (不是“配置文件”而是`src/config/settings.py`)
- **完整的代码示例** (不是“添加验证”而是实际的代码)
- **带有预期输出的精确命令**
- **证明该任务有效的验证步骤**

### 步骤 6: 审查计划

检查：
- [ ] 任务是顺序且合乎逻辑的
- [ ] 每个任务都是小份量的（2-5分钟）
- [ ] 文件路径是精确的
- [ ] 代码示例是完整的（可复制粘贴）
- [ ] 命令是精确的，并有预期输出
- [ ] 没有遗漏的上下文
- [ ] 遵循DRY、YAGNI、TDD原则

## 原则

### DRY (不要重复自己)

**错误做法：** 在3个地方复制代码验证逻辑
**正确做法：** 提取验证函数，并在所有地方使用它

```python
# 错误 — YAGNI 违规
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email
        self.preferences = {}  # 暂时不需要！
        self.metadata = {}     # 暂时不需要！

# 正确 — YAGNI
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email
```

### YAGNI (你不需要它)

**错误做法：** 添加为未来需求准备的“灵活性”
**正确做法：** 只实现当前所需的功能

```python
# 错误 — YAGNI 违规
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email
        self.preferences = {}  # 暂时不需要！
        self.metadata = {}     # 暂时不需要！

# 正确 — YAGNI
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email
```

### TDD (测试驱动开发)

任何产生代码的任务都应包括完整的TDD循环：
1. 编写失败的测试
2. 运行以验证失败
3. 编写最小代码
4. 运行以验证通过

请参考`test-driven-development`技能以获取详细信息。

### 频繁提交

每个任务完成后都进行提交：
```bash
git add [files]
git commit -m "type: description"
```

## 常见错误

### 模糊的任务

**错误做法：** “添加认证”
**正确做法：** “使用电子邮件和password_hash字段创建用户模型”

### 不完整的代码

**错误做法：** “步骤 1: 添加验证函数”
**正确做法：** “步骤 1: 添加验证函数”，后跟完整的函数代码

### 缺乏验证

**错误做法：** “步骤 3: 测试它是否工作”
**正确做法：** “步骤 3: 运行`pytest tests/test_auth.py -v`，预期: 3 passed”

### 缺少文件路径

**错误做法：** “创建模型文件”
**正确做法：** “创建: `src/models/user.py`”

## 执行交接

保存计划后，提供执行方法：

**“计划已完成并保存。准备使用智能体驱动的开发进行执行——我将为每个任务派发一个全新的子智能体，并进行两阶段审查（规范合规性然后代码质量）。是否继续？”**

执行时，请使用`subagent-driven-development`技能：
- 为每个任务提供新的`delegate_task`和完整的上下文
- 每个任务后都进行规范合规性审查
- 规范通过后进行代码质量审查
- 只有当两次审查都批准后才继续

## 记住

```
小份任务（每个2-5分钟）
精确的文件路径
完整代码（可复制粘贴）
带有预期输出的精确命令
验证步骤
DRY、YAGNI、TDD
频繁提交
```

**一个好的计划能让实施变得显而易见。**