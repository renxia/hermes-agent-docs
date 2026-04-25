---
title: "Guidance"
sidebar_label: "Guidance"
description: "使用正则表达式和语法控制 LLM 输出，保证生成有效的 JSON/XML/代码，强制使用结构化格式，并使用 Guidance 构建多步骤工作流..."
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Guidance

使用正则表达式和语法控制 LLM 输出，保证生成有效的 JSON/XML/代码，强制使用结构化格式，并使用 Guidance 构建多步骤工作流 - 微软研究院的约束生成框架

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/mlops/guidance` 安装 |
| 路径 | `optional-skills/mlops/guidance` |
| 版本 | `1.0.0` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖项 | `guidance`, `transformers` |
| 标签 | `提示工程`, `Guidance`, `约束生成`, `结构化输出`, `JSON 验证`, `语法`, `微软研究院`, `格式强制`, `多步骤工作流` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在该技能被触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 指导：约束性大语言模型生成

## 何时使用此技能

在以下情况使用 Guidance：
- **通过正则表达式或语法控制 LLM 输出语法**
- **保证生成有效的 JSON/XML/代码**
- **与传统提示方法相比降低延迟**
- **强制使用结构化格式**（日期、电子邮件、ID 等）
- **使用类 Python 控制流构建多步骤工作流**
- **通过语法约束防止无效输出**

**GitHub Stars**：18,000+ | **来自**：微软研究院

## 安装

```bash
# 基础安装
pip install guidance

# 带特定后端
pip install guidance[transformers]  # Hugging Face 模型
pip install guidance[llama_cpp]     # llama.cpp 模型
```

## 快速开始

### 基础示例：结构化生成

```python
from guidance import models, gen

# 加载模型（支持 OpenAI、Transformers、llama.cpp）
lm = models.OpenAI("gpt-4")

# 带约束生成
result = lm + "法国的首都是 " + gen("capital", max_tokens=5)

print(result["capital"])  # "巴黎"
```

### 使用 Anthropic Claude

```python
from guidance import models, gen, system, user, assistant

# 配置 Claude
lm = models.Anthropic("claude-sonnet-4-5-20250929")

# 使用上下文管理器实现聊天格式
with system():
    lm += "你是一个有用的助手。"

with user():
    lm += "法国的首都是什么？"

with assistant():
    lm += gen(max_tokens=20)
```

## 核心概念

### 1. 上下文管理器

Guidance 使用类 Python 的上下文管理器实现聊天式交互。

```python
from guidance import system, user, assistant, gen

lm = models.Anthropic("claude-sonnet-4-5-20250929")

# 系统消息
with system():
    lm += "你是一个 JSON 生成专家。"

# 用户消息
with user():
    lm += "生成一个包含姓名和年龄的人员对象。"

# 助手回复
with assistant():
    lm += gen("response", max_tokens=100)

print(lm["response"])
```

**优势：**
- 自然的聊天流程
- 清晰的角色分离
- 易于阅读和维护

### 2. 约束性生成

Guidance 确保输出符合指定的正则表达式或语法规则。

#### 正则表达式约束

```python
from guidance import models, gen

lm = models.Anthropic("claude-sonnet-4-5-20250929")

# 约束为有效的电子邮件格式
lm += "Email: " + gen("email", regex=r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")

# 约束为日期格式（YYYY-MM-DD）
lm += "Date: " + gen("date", regex=r"\d{4}-\d{2}-\d{2}")

# 约束为电话号码
lm += "Phone: " + gen("phone", regex=r"\d{3}-\d{3}-\d{4}")

print(lm["email"])  # 保证是有效的电子邮件
print(lm["date"])   # 保证是 YYYY-MM-DD 格式
```

**工作原理：**
- 正则表达式在 token 级别转换为语法
- 在生成过程中过滤无效的 token
- 模型只能生成匹配的输出

#### 选择约束

```python
from guidance import models, gen, select

lm = models.Anthropic("claude-sonnet-4-5-20250929")

# 约束为特定选项
lm += "Sentiment: " + select(["positive", "negative", "neutral"], name="sentiment")

# 多项选择
lm += "Best answer: " + select(
    ["A) Paris", "B) London", "C) Berlin", "D) Madrid"],
    name="answer"
)

print(lm["sentiment"])  # 其中之一：positive, negative, neutral
print(lm["answer"])     # 其中之一：A, B, C, 或 D
```

### 3. Token 修复

Guidance 自动“修复”提示和生成之间的 token 边界。

**问题：** Token 化创建了不自然的边界。

```python
# 无 token 修复
prompt = "The capital of France is "
# 最后一个 token: " is "
# 第一个生成的 token 可能是 " Par"（带前导空格）
# 结果: "The capital of France is  Paris"（双空格！）
```

**解决方案：** Guidance 回退一个 token 并重新生成。

```python
from guidance import models, gen

lm = models.Anthropic("claude-sonnet-4-5-20250929")

# Token 修复默认启用
lm += "The capital of France is " + gen("capital", max_tokens=5)
# 结果: "The capital of France is Paris"（正确的间距）
```

**优势：**
- 自然的文本边界
- 无尴尬的间距问题
- 更好的模型性能（看到自然的 token 序列）

### 4. 基于语法的生成

使用上下文无关语法定义复杂结构。

```python
from guidance import models, gen

lm = models.Anthropic("claude-sonnet-4-5-20250929")

# JSON 语法（简化）
json_grammar = """
{
    "name": <gen name regex="[A-Za-z ]+" max_tokens=20>,
    "age": <gen age regex="[0-9]+" max_tokens=3>,
    "email": <gen email regex="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}" max_tokens=50>
}
"""

# 生成有效的 JSON
lm += gen("person", grammar=json_grammar)

print(lm["person"])  # 保证是有效的 JSON 结构
```

**用例：**
- 复杂的结构化输出
- 嵌套数据结构
- 编程语言语法
- 领域特定语言

### 5. Guidance 函数

使用 `@guidance` 装饰器创建可重用的生成模式。

```python
from guidance import guidance, gen, models

@guidance
def generate_person(lm):
    """生成一个包含姓名和年龄的人员。"""
    lm += "Name: " + gen("name", max_tokens=20, stop="\n")
    lm += "\nAge: " + gen("age", regex=r"[0-9]+", max_tokens=3)
    return lm

# 使用函数
lm = models.Anthropic("claude-sonnet-4-5-20250929")
lm = generate_person(lm)

print(lm["name"])
print(lm["age"])
```

**有状态函数：**

```python
@guidance(stateless=False)
def react_agent(lm, question, tools, max_rounds=5):
    """带工具使用的 ReAct 智能体。"""
    lm += f"Question: {question}\n\n"

    for i in range(max_rounds):
        # 思考
        lm += f"Thought {i+1}: " + gen("thought", stop="\n")

        # 行动
        lm += "\nAction: " + select(list(tools.keys()), name="action")

        # 执行工具
        tool_result = tools[lm["action"]]()
        lm += f"\nObservation: {tool_result}\n\n"

        # 检查是否完成
        lm += "Done? " + select(["Yes", "No"], name="done")
        if lm["done"] == "Yes":
            break

    # 最终答案
    lm += "\nFinal Answer: " + gen("answer", max_tokens=100)
    return lm
```

## 后端配置

### Anthropic Claude

```python
from guidance import models

lm = models.Anthropic(
    model="claude-sonnet-4-5-20250929",
    api_key="your-api-key"  # 或设置 ANTHROPIC_API_KEY 环境变量
)
```

### OpenAI

```python
lm = models.OpenAI(
    model="gpt-4o-mini",
    api_key="your-api-key"  # 或设置 OPENAI_API_KEY 环境变量
)
```

### 本地模型（Transformers）

```python
from guidance.models import Transformers

lm = Transformers(
    "microsoft/Phi-4-mini-instruct",
    device="cuda"  # 或 "cpu"
)
```

### 本地模型（llama.cpp）

```python
from guidance.models import LlamaCpp

lm = LlamaCpp(
    model_path="/path/to/model.gguf",
    n_ctx=4096,
    n_gpu_layers=35
)
```

## 常见模式

### 模式 1：JSON 生成

```python
from guidance import models, gen, system, user, assistant

lm = models.Anthropic("claude-sonnet-4-5-20250929")

with system():
    lm += "你生成有效的 JSON。"

with user():
    lm += "生成一个包含姓名、年龄和电子邮件的用户配置文件。"

with assistant():
    lm += """{
    "name": """ + gen("name", regex=r'"[A-Za-z ]+"', max_tokens=30) + """,
    "age": """ + gen("age", regex=r"[0-9]+", max_tokens=3) + """,
    "email": """ + gen("email", regex=r'"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"', max_tokens=50) + """
}"""

print(lm)  # 保证是有效的 JSON
```

### 模式 2：分类

```python
from guidance import models, gen, select

lm = models.Anthropic("claude-sonnet-4-5-20250929")

text = "This product is amazing! I love it."

lm += f"Text: {text}\n"
lm += "Sentiment: " + select(["positive", "negative", "neutral"], name="sentiment")
lm += "\nConfidence: " + gen("confidence", regex=r"[0-9]+", max_tokens=3) + "%"

print(f"Sentiment: {lm['sentiment']}")
print(f"Confidence: {lm['confidence']}%")
```

### 模式 3：多步推理

```python
from guidance import models, gen, guidance

@guidance
def chain_of_thought(lm, question):
    """通过逐步推理生成答案。"""
    lm += f"Question: {question}\n\n"

    # 生成多个推理步骤
    for i in range(3):
        lm += f"Step {i+1}: " + gen(f"step_{i+1}", stop="\n", max_tokens=100) + "\n"

    # 最终答案
    lm += "\nTherefore, the answer is: " + gen("answer", max_tokens=50)

    return lm

lm = models.Anthropic("claude-sonnet-4-5-20250929")
lm = chain_of_thought(lm, "What is 15% of 200?")

print(lm["answer"])
```

### 模式 4：ReAct 智能体

```python
from guidance import models, gen, select, guidance

@guidance(stateless=False)
def react_agent(lm, question):
    """带工具使用的 ReAct 智能体。"""
    tools = {
        "calculator": lambda expr: eval(expr),
        "search": lambda query: f"Search results for: {query}",
    }

    lm += f"Question: {question}\n\n"

    for round in range(5):
        # 思考
        lm += f"Thought: " + gen("thought", stop="\n") + "\n"

        # 行动选择
        lm += "Action: " + select(["calculator", "search", "answer"], name="action")

        if lm["action"] == "answer":
            lm += "\nFinal Answer: " + gen("answer", max_tokens=100)
            break

        # 行动输入
        lm += "\nAction Input: " + gen("action_input", stop="\n") + "\n"

        # 执行工具
        if lm["action"] in tools:
            result = tools[lm["action"]](lm["action_input"])
            lm += f"Observation: {result}\n\n"

    return lm

lm = models.Anthropic("claude-sonnet-4-5-20250929")
lm = react_agent(lm, "What is 25 * 4 + 10?")
print(lm["answer"])
```

### 模式 5：数据提取

```python
from guidance import models, gen, guidance

@guidance
def extract_entities(lm, text):
    """从文本中提取结构化实体。"""
    lm += f"Text: {text}\n\n"

    # 提取人员
    lm += "Person: " + gen("person", stop="\n", max_tokens=30) + "\n"

    # 提取组织
    lm += "Organization: " + gen("organization", stop="\n", max_tokens=30) + "\n"

    # 提取日期
    lm += "Date: " + gen("date", regex=r"\d{4}-\d{2}-\d{2}", max_tokens=10) + "\n"

    # 提取位置
    lm += "Location: " + gen("location", stop="\n", max_tokens=30) + "\n"

    return lm

text = "Tim Cook announced at Apple Park on 2024-09-15 in Cupertino."

lm = models.Anthropic("claude-sonnet-4-5-20250929")
lm = extract_entities(lm, text)

print(f"Person: {lm['person']}")
print(f"Organization: {lm['organization']}")
print(f"Date: {lm['date']}")
print(f"Location: {lm['location']}")
```

## 最佳实践

### 1. 使用正则表达式进行格式验证

```python
# ✅ 好：正则表达式确保格式有效
lm += "邮箱：" + gen("email", regex=r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")

# ❌ 坏：自由生成可能产生无效邮箱
lm += "邮箱：" + gen("email", max_tokens=50)
```

### 2. 使用 select() 处理固定类别

```python
# ✅ 好：保证类别有效
lm += "状态：" + select(["待处理", "已批准", "已拒绝"], name="status")

# ❌ 坏：可能生成拼写错误或无效值
lm += "状态：" + gen("status", max_tokens=20)
```

### 3. 利用 Token Healing

```python
# Token healing 默认启用
# 无需特殊操作 - 只需自然拼接
lm += "首都是 " + gen("capital")  # 自动修复
```

### 4. 使用停止序列

```python
# ✅ 好：在换行符处停止以生成单行输出
lm += "姓名：" + gen("name", stop="\n")

# ❌ 坏：可能生成多行
lm += "姓名：" + gen("name", max_tokens=50)
```

### 5. 创建可复用函数

```python
# ✅ 好：可复用模式
@guidance
def generate_person(lm):
    lm += "姓名：" + gen("name", stop="\n")
    lm += "\n年龄：" + gen("age", regex=r"[0-9]+")
    return lm

# 多次使用
lm = generate_person(lm)
lm += "\n\n"
lm = generate_person(lm)
```

### 6. 平衡约束条件

```python
# ✅ 好：合理的约束条件
lm += gen("name", regex=r"[A-Za-z ]+", max_tokens=30)

# ❌ 过于严格：可能失败或非常缓慢
lm += gen("name", regex=r"^(张三|李四)$", max_tokens=10)
```

## 与其他方案的比较

| 特性 | Guidance | Instructor | Outlines | LMQL |
|---------|----------|------------|----------|------|
| 正则表达式约束 | ✅ 支持 | ❌ 不支持 | ✅ 支持 | ✅ 支持 |
| 语法支持 | ✅ CFG | ❌ 不支持 | ✅ CFG | ✅ CFG |
| Pydantic 验证 | ❌ 不支持 | ✅ 支持 | ✅ 支持 | ❌ 不支持 |
| Token Healing | ✅ 支持 | ❌ 不支持 | ✅ 支持 | ❌ 不支持 |
| 本地模型 | ✅ 支持 | ⚠️ 有限支持 | ✅ 支持 | ✅ 支持 |
| API 模型 | ✅ 支持 | ✅ 支持 | ⚠️ 有限支持 | ✅ 支持 |
| Python 风格语法 | ✅ 支持 | ✅ 支持 | ✅ 支持 | ❌ SQL 风格 |
| 学习曲线 | 低 | 低 | 中等 | 高 |

**何时选择 Guidance：**
- 需要正则表达式/语法约束
- 需要 token healing
- 构建具有控制流的复杂工作流
- 使用本地模型（Transformers、llama.cpp）
- 偏好 Python 风格语法

**何时选择其他方案：**
- Instructor：需要 Pydantic 验证并自动重试
- Outlines：需要 JSON schema 验证
- LMQL：偏好声明式查询语法

## 性能特征

**延迟降低：**
- 比传统提示方法快 30-50%（针对约束输出）
- Token healing 减少不必要的重新生成
- 语法约束防止生成无效 token

**内存使用：**
- 与无约束生成相比开销极小
- 首次使用后语法编译结果会被缓存
- 推理时高效的 token 过滤

**Token 效率：**
- 避免在无效输出上浪费 token
- 无需重试循环
- 直接生成有效输出

## 资源

- **文档**：https://guidance.readthedocs.io
- **GitHub**：https://github.com/guidance-ai/guidance (18k+ stars)
- **Notebooks**：https://github.com/guidance-ai/guidance/tree/main/notebooks
- **Discord**：提供社区支持

## 另见

- `references/constraints.md` - 全面的正则表达式和语法模式
- `references/backends.md` - 后端特定配置
- `references/examples.md` - 生产就绪示例