---
title: "编写计划 — 编写实施计划：小块任务、路径、代码"
sidebar_label: "编写计划"
description: "编写实施计划：小块任务、路径、代码"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# 编写计划

编写实施计划：小块任务、路径、代码。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/software-development/writing-plans` |
| 版本 | `1.1.0` |
| 作者 | Hermes 智能体（改编自 obra/superpowers） |
| 许可证 | MIT |
| 标签 | `planning`, `design`, `implementation`, `workflow`, `documentation` |
| 相关技能 | [`subagent-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-subagent-driven-development), [`test-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-test-driven-development), [`requesting-code-review`](/docs/user-guide/skills/bundled/software-development/software-development-requesting-code-review) |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 编写实施计划

## 概述

编写全面的实施计划，假设实施者对代码库一无所知且品味存疑。记录他们所需的一切：要修改哪些文件、完整代码、测试命令、要检查的文档、如何验证。给他们小块的任务。DRY。YAGNI。TDD。频繁提交。

假设实施者是一名熟练的开发者，但对工具集或问题领域几乎一无所知。假设他们不太懂良好的测试设计。

**核心原则：** 一个好的计划能让实施显而易见。如果有人需要猜测，说明计划不完整。

## 何时使用

**始终在以下情况之前使用：**
- 实现多步骤功能
- 分解复杂需求
- 通过 subagent-driven-development 委派给子智能体

**不要跳过以下情况：**
- 功能看似简单（假设会导致错误）
- 你计划自己实现它（未来的你需要指导）
- 独自工作（文档很重要）

## 小块任务粒度

**每个任务 = 2-5 分钟的专注工作。**

每一步都是一个动作：
- “编写失败的测试” — 步骤
- “运行它以确认失败” — 步骤
- “实现使测试通过的最少代码” — 步骤
- “运行测试并确认通过” — 步骤
- “提交” — 步骤

**太大：**
```markdown
### 任务 1：构建认证系统
[5 个文件共 50 行代码]
```

**合适大小：**
```markdown
### 任务 1：创建带 email 字段的 User 模型
[1 个文件 10 行]

### 任务 2：为 User 添加 password_hash 字段
[1 个文件 8 行]

### 任务 3：创建密码哈希工具
[1 个文件 15 行]
```

## 计划文档结构

### 标题（必需）

每个计划必须以以下内容开头：

```markdown
# [功能名称] 实施计划

> **对于 Hermes：** 使用 subagent-driven-development 技能逐个任务实现此计划。

**目标：** [一句话描述此构建内容]

**架构：** [2-3 句话说明方法]

**技术栈：** [关键技术/库]

---
```

### 任务结构

每个任务遵循以下格式：

````markdown
### 任务 N：[描述性名称]

**目标：** 此任务完成的内容（一句话）

**文件：**
- 创建：`exact/path/to/new_file.py`
- 修改：`exact/path/to/existing.py:45-67`（如果已知行号）
- 测试：`tests/path/to/test_file.py`

**步骤 1：编写失败的测试**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**步骤 2：运行测试以验证失败**

运行：`pytest tests/path/test.py::test_specific_behavior -v`
预期：失败 — “function not defined”

**步骤 3：编写最小实现**

```python
def function(input):
    return expected
```

**步骤 4：运行测试以验证通过**

运行：`pytest tests/path/test.py::test_specific_behavior -v`
预期：通过

**步骤 5：提交**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## 编写流程

### 步骤 1：理解需求

阅读并理解：
- 功能需求
- 设计文档或用户描述
- 验收标准
- 约束条件

### 步骤 2：探索代码库

使用 Hermes 工具了解项目：

```python
# 了解项目结构
search_files("*.py", target="files", path="src/")

# 查看类似功能
search_files("similar_pattern", path="src/", file_glob="*.py")

# 检查现有测试
search_files("*.py", target="files", path="tests/")

# 读取关键文件
read_file("src/app.py")
```

### 步骤 3：设计方法

决定：
- 架构模式
- 文件组织
- 所需依赖
- 测试策略

### 步骤 4：编写任务

按顺序创建任务：
1. 设置/基础设施
2. 核心功能（每个都采用 TDD）
3. 边缘情况
4. 集成
5. 清理/文档

### 步骤 5：添加完整细节

对于每个任务，包括：
- **确切的文件路径**（不是“配置文件”，而是 `src/config/settings.py`）
- **完整的代码示例**（不是“添加验证”，而是实际代码）
- **确切的命令**及预期输出
- **验证步骤**，证明任务有效

### 步骤 6：审查计划

检查：
- [ ] 任务按顺序且逻辑清晰
- [ ] 每个任务都是小块（2-5 分钟）
- [ ] 文件路径确切
- [ ] 代码示例完整（可复制粘贴）
- [ ] 命令确切且包含预期输出
- [ ] 无缺失上下文
- [ ] 应用了 DRY、YAGNI、TDD 原则

### 步骤 7：保存计划

```bash
mkdir -p docs/plans
# 将计划保存到 docs/plans/YYYY-MM-DD-feature-name.md
git add docs/plans/
git commit -m "docs: add implementation plan for [feature]"
```

## 原则

### DRY（不要重复自己）

**坏：** 在 3 个地方复制粘贴验证逻辑  
**好：** 提取验证函数，随处使用

### YAGNI（你不需要它）

**坏：** 为未来需求添加“灵活性”  
**好：** 只实现现在需要的内容

```python
# 坏 — 违反 YAGNI
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email
        self.preferences = {}  # 目前不需要！
        self.metadata = {}     # 目前不需要！

# 好 — 符合 YAGNI
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email
```

### TDD（测试驱动开发）

每个产生代码的任务都应包含完整的 TDD 周期：
1. 编写失败的测试
2. 运行以验证失败
3. 编写最少代码
4. 运行以验证通过

详见 `test-driven-development` 技能。

### 频繁提交

每个任务后提交：
```bash
git add [files]
git commit -m "type: description"
```

## 常见错误

### 模糊的任务

**坏：** “添加认证”  
**好：** “创建带 email 和 password_hash 字段的 User 模型”

### 不完整的代码

**坏：** “步骤 1：添加验证函数”  
**好：** “步骤 1：添加验证函数”，后跟完整的函数代码

### 缺少验证

**坏：** “步骤 3：测试它是否有效”  
**好：** “步骤 3：运行 `pytest tests/test_auth.py -v`，预期：3 个通过”

### 缺少文件路径

**坏：** “创建模型文件”  
**好：** “创建：`src/models/user.py`”

## 执行交接

保存计划后，提供执行方法：

**“计划已完成并保存。准备使用 subagent-driven-development 执行 — 我将为每个任务分派一个新的子智能体，并进行两阶段审查（规范合规性，然后代码质量）。是否继续？”**

执行时，使用 `subagent-driven-development` 技能：
- 每个任务使用全新的 `delegate_task` 并附带完整上下文
- 每个任务后进行规范合规性审查
- 规范通过后进行代码质量审查
- 仅在两项审查均通过后才继续

## 记住

```
小块任务（每个 2-5 分钟）
确切的文件路径
完整的代码（可复制粘贴）
确切的命令及预期输出
验证步骤
DRY、YAGNI、TDD
频繁提交
```

**一个好的计划能让实施显而易见。**