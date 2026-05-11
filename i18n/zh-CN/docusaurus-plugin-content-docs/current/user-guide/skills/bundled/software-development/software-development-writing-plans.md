---
title: "撰写计划 — 编写实现计划：细分任务、路径、代码"
sidebar_label: "撰写计划"
description: "编写实现计划：细分任务、路径、代码"
---

{/* 本页面由网站脚本 scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 撰写计划

编写实现计划：细分任务、路径、代码。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/software-development/writing-plans` |
| 版本 | `1.1.0` |
| 作者 | Hermes 智能体（改编自 obra/superpowers） |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `planning`, `design`, `implementation`, `workflow`, `documentation` |
| 相关技能 | [`子智能体驱动开发`](/docs/user-guide/skills/bundled/software-development/software-development-subagent-driven-development), [`测试驱动开发`](/docs/user-guide/skills/bundled/software-development/software-development-test-driven-development), [`请求代码审查`](/docs/user-guide/skills/bundled/software-development/software-development-requesting-code-review) |

## 参考：完整 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# 编写实现计划

## 概述

编写全面的实现计划，假设执行者对代码库零了解且品味存疑。记录他们需要的一切：需要修改哪些文件、完整的代码、测试命令、要检查的文档、如何验证。为他们提供细分的任务。DRY。YAGNI。TDD。频繁提交。

假设执行者是一名熟练的开发人员，但对工具集或问题领域几乎一无所知。假设他们不太擅长设计好的测试。

**核心原则：** 好的计划能让实现变得显而易见。如果有人需要猜测，那么计划就不完整。

## 何时使用

**务必在以下情况之前使用：**
- 实现多步骤功能
- 分解复杂需求
- 通过子智能体驱动开发委派任务

**在以下情况不要跳过：**
- 功能看似简单（假设会导致错误）
- 你计划自己实现（未来的你需要指导）
- 独自工作（文档很重要）

## 任务细分粒度

**每个任务 = 2-5 分钟的专注工作。**

每个步骤都是一个动作：
- "编写失败的测试" — 步骤
- "运行它以确保失败" — 步骤
- "编写使测试通过的最小代码" — 步骤
- "运行测试并确保通过" — 步骤
- "提交" — 步骤

**范围太大：**
```markdown
### 任务 1：构建身份验证系统
[跨 5 个文件的 50 行代码]
```

**范围合适：**
```markdown
### 任务 1：创建带 email 字段的 User 模型
[10 行，1 个文件]

### 任务 2：向 User 添加密码哈希字段
[8 行，1 个文件]

### 任务 3：创建密码哈希工具
[15 行，1 个文件]
```

## 计划文档结构

### 标题（必需）

每个计划都必须以以下内容开头：

```markdown
# [功能名称] 实现计划

> **致 Hermes：** 使用子智能体驱动开发技能逐任务实现此计划。

**目标：** [一句话描述构建内容]

**架构：** [2-3 句关于方法的描述]

**技术栈：** [关键技术/库]

---
```

### 任务结构

每个任务遵循此格式：

````markdown
### 任务 N：[描述性名称]

**目标：** 本任务要完成什么（一句话）

**文件：**
- 创建：`exact/path/to/new_file.py`
- 修改：`exact/path/to/existing.py:45-67`（如果知道行号）
- 测试：`tests/path/to/test_file.py`

**步骤 1：编写失败的测试**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**步骤 2：运行测试以验证失败**

运行：`pytest tests/path/test.py::test_specific_behavior -v`
预期：失败 — "function not defined"

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

使用 Hermes 工具理解项目：

```python
# 理解项目结构
search_files("*.py", target="files", path="src/")

# 查看类似功能
search_files("similar_pattern", path="src/", file_glob="*.py")

# 检查现有测试
search_files("*.py", target="files", path="tests/")

# 阅读关键文件
read_file("src/app.py")
```

### 步骤 3：设计方法

决定：
- 架构模式
- 文件组织
- 所需依赖项
- 测试策略

### 步骤 4：编写任务

按顺序创建任务：
1. 设置/基础设施
2. 核心功能（对每个功能进行 TDD）
3. 边缘情况
4. 集成
5. 清理/文档

### 步骤 5：添加完整细节

对于每个任务，包括：
- **精确的文件路径**（不是"配置文件"而是 `src/config/settings.py`）
- **完整的代码示例**（不是"添加验证"而是实际的代码）
- **精确的命令**及其预期输出
- **验证步骤**，证明任务已完成

### 步骤 6：审查计划

检查：
- [ ] 任务是顺序的、符合逻辑的
- [ ] 每个任务是细分的（2-5 分钟）
- [ ] 文件路径是精确的
- [ ] 代码示例是完整的（可复制粘贴）
- [ ] 命令是精确的，并带有预期输出
- [ ] 没有缺失的上下文
- [ ] 应用了 DRY、YAGNI、TDD 原则

### 步骤 7：保存计划

```bash
mkdir -p docs/plans
# 将计划保存至 docs/plans/YYYY-MM-DD-feature-name.md
git add docs/plans/
git commit -m "docs: add implementation plan for [feature]"
```

## 原则

### DRY（不要重复自己）

**糟糕：** 在 3 个地方复制粘贴验证
**优秀：** 提取验证函数，到处使用

### YAGNI（你不会需要它）

**糟糕：** 为未来需求添加"灵活性"
**优秀：** 只实现当前需要的功能

```python
# 糟糕 — 违反 YAGNI
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email
        self.preferences = {}  # 还不需要！
        self.metadata = {}     # 还不需要！

# 优秀 — YAGNI
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email
```

### TDD（测试驱动开发）

每个产生代码的任务都应包含完整的 TDD 循环：
1. 编写失败的测试
2. 运行以验证失败
3. 编写最小代码
4. 运行以验证通过

详情请参阅 `test-driven-development` 技能。

### 频繁提交

每个任务后提交：
```bash
git add [files]
git commit -m "type: description"
```

## 常见错误

### 任务模糊

**糟糕：** "添加身份验证"
**优秀：** "创建带 email 和 password_hash 字段的 User 模型"

### 代码不完整

**糟糕：** "步骤 1：添加验证函数"
**优秀：** "步骤 1：添加验证函数" 后接完整的函数代码

### 缺少验证

**糟糕：** "步骤 3：测试它是否工作"
**优秀：** "步骤 3：运行 `pytest tests/test_auth.py -v`，预期：3 passed"

### 缺少文件路径

**糟糕：** "创建模型文件"
**优秀：** "创建：`src/models/user.py`"

## 执行交接

保存计划后，提供执行方法：

**"计划已完成并保存。准备好使用子智能体驱动开发执行 — 我将为每个任务派遣一个新的子智能体，进行两阶段审查（规格符合性审查然后代码质量审查）。要继续吗？"**

执行时，使用 `subagent-driven-development` 技能：
- 每个任务使用新的 `delegate_task`，附带完整上下文
- 每个任务后进行规格符合性审查
- 规格通过后进行代码质量审查
- 仅当两项审查都通过时才继续

## 记住

```
细分任务（每个 2-5 分钟）
精确的文件路径
完整的代码（可复制粘贴）
精确的命令及其预期输出
验证步骤
DRY, YAGNI, TDD
频繁提交
```

**好的计划能让实现变得显而易见。**