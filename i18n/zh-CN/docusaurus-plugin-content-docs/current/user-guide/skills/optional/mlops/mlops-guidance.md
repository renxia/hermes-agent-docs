---
title: "指导"
sidebar_label: "指导"
description: "通过正则表达式和语法控制大语言模型输出，保证有效的JSON/XML/代码生成，强制执行结构化格式，并利用Guidance构建多步骤工作流程——微软研究院的约束生成框架..."
---

{/* 此页面由website/scripts/generate-skill-docs.py根据技能的SKILL.md自动生成。请编辑源SKILL.md，而非此页面。*/}

# 指导

通过正则表达式和语法控制大语言模型输出，保证有效的JSON/XML/代码生成，强制执行结构化格式，并利用Guidance构建多步骤工作流程——微软研究院的约束生成框架

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/mlops/guidance` 安装 |
| 路径 | `optional-skills/mlops/guidance` |
| 版本 | `1.0.0` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖项 | `guidance`, `transformers` |
| 平台 | linux, macos, windows |
| 标签 | `提示工程`, `指导`, `约束生成`, `结构化输出`, `JSON验证`, `语法`, `微软研究院`, `格式强制`, `多步骤工作流程` |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时看到的说明内容。
:::

# 指导：受限的LLM生成

## 何时使用此技能

在你需要以下情况时使用 Guidance：
- 用正则表达式或语法**控制LLM输出语法**
- **保证生成有效的JSON/XML/代码**
- **降低延迟**（相比传统提示方法）
- **强制执行结构化格式**（日期、邮箱、ID等）
- **构建具有Pythonic控制流的多步骤工作流**
- 通过语法约束**防止无效输出**

**GitHub星标**：18,000+ | **来源**：微软研究院

## 安装

```bash
# 基础安装
pip install guidance

# 包含特定后端
pip install guidance[transformers]  # Hugging Face 模型
pip install guidance[llama_cpp]     # llama.cpp 模型
```

## 快速入门

### 基础示例：结构化生成

```python
from guidance import models, gen

# 加载模型（支持 OpenAI, Transformers, llama.cpp）
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

# 使用上下文管理器进行聊天格式对话
with system():
    lm += "你是一个乐于助人的助手。"

with user():
    lm += "法国的首都是什么？"

with assistant():
    lm += gen(max_tokens=20)
```

## 核心概念

### 1. 上下文管理器

Guidance 使用 Pythonic 的上下文管理器进行类似聊天的交互。

```python
from guidance import system, user, assistant, gen

lm = models.Anthropic("claude-sonnet-4-5-20250929")

# 系统消息
with system():
    lm += "你是一个 JSON 生成专家。"

# 用户消息
with user():
    lm += "生成一个包含姓名和年龄的 person 对象。"

# 助手响应
with assistant():
    lm += gen("response", max_tokens=100)

print(lm["response"])
```

**优势：**
- 自然的对话流程
- 清晰的角色分离
- 易于阅读和维护

### 2. 受限生成

Guidance 使用正则表达式或语法确保输出符合指定模式。

#### 正则表达式约束

```python
from guidance import models, gen

lm = models.Anthropic("claude-sonnet-4-5-20250929")

# 约束为有效邮箱格式
lm += "邮箱: " + gen("email", regex=r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")

# 约束为日期格式 (YYYY-MM-DD)
lm += "日期: " + gen("date", regex=r"\d{4}-\d{2}-\d{2}")

# 约束为电话号码
lm += "电话: " + gen("phone", regex=r"\d{3}-\d{3}-\d{4}")

print(lm["email"])  # 保证为有效邮箱
print(lm["date"])   # 保证为 YYYY-MM-DD 格式
```

**工作原理：**
- 在标记级别将正则表达式转换为语法
- 生成过程中过滤无效标记
- 模型只能产生匹配的输出

#### 选择约束

```python
from guidance import models, gen, select

lm = models.Anthropic("claude-sonnet-4-5-20250929")

# 约束为特定选项
lm += "情感: " + select(["积极", "消极", "中立"], name="sentiment")

# 多项选择
lm += "最佳答案: " + select(
    ["A) 巴黎", "B) 伦敦", "C) 柏林", "D) 马德里"],
    name="answer"
)

print(lm["sentiment"])  # 三者之一：积极, 消极, 中立
print(lm["answer"])     # 四者之一：A, B, C, 或 D
```

### 3. 标记修复

Guidance 自动"修复"提示和生成之间的标记边界。

**问题：** 分词会产生不自然的边界。

```python
# 不使用标记修复
prompt = "法国的首都是 "
# 最后一个标记: " 是 "
# 生成的第一个标记可能是 " 巴" (带前导空格)
# 结果: "法国的首都是  巴黎" (双空格！)
```

**解决方案：** Guidance 回退一个标记并重新生成。

```python
from guidance import models, gen

lm = models.Anthropic("claude-sonnet-4-5-20250929")

# 默认启用标记修复
lm += "法国的首都是 " + gen("capital", max_tokens=5)
# 结果: "法国的首都是巴黎" (间距正确)
```

**优势：**
- 自然的文本边界
- 没有尴尬的间距问题
- 更好的模型性能（看到自然的标记序列）

### 4. 基于语法的生成

使用上下文无关语法定义复杂结构。

```python
from guidance import models, gen

lm = models.Anthropic("claude-sonnet-4-5-20250929")

# JSON 语法 (简化版)
json_grammar = """
{
    "name": <gen name regex="[A-Za-z ]+" max_tokens=20>,
    "age": <gen age regex="[0-9]+" max_tokens=3>,
    "email": <gen email regex="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}" max_tokens=50>
}
"""

# 生成有效的 JSON
lm += gen("person", grammar=json_grammar)

print(lm["person"])  # 保证为有效的 JSON 结构
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
    """生成一个带有姓名和年龄的人。"""
    lm += "姓名: " + gen("name", max_tokens=20, stop="\n")
    lm += "\n年龄: " + gen("age", regex=r"[0-9]+", max_tokens=3)
    return lm

# 使用该函数
lm = models.Anthropic("claude-sonnet-4-5-20250929")
lm = generate_person(lm)

print(lm["name"])
print(lm["age"])
```

**有状态函数：**

```python
@guidance(stateless=False)
def react_agent(lm, question, tools, max_rounds=5):
    """具有工具使用的 ReAct 智能体。"""
    lm += f"问题: {question}\n\n"

    for i in range(max_rounds):
        # 思考
        lm += f"思考 {i+1}: " + gen("thought", stop="\n")

        # 动作
        lm += "\n动作: " + select(list(tools.keys()), name="action")

        # 执行工具
        tool_result = tools[lm["action"]]()
        lm += f"\n观察: {tool_result}\n\n"

        # 检查是否完成
        lm += "完成? " + select(["是", "否"], name="done")
        if lm["done"] == "是":
            break

    # 最终答案
    lm += "\n最终答案: " + gen("answer", max_tokens=100)
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

### 本地模型 (Transformers)

```python
from guidance.models import Transformers

lm = Transformers(
    "microsoft/Phi-4-mini-instruct",
    device="cuda"  # 或 "cpu"
)
```

### 本地模型 (llama.cpp)

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
    lm += "生成一个包含姓名、年龄和邮箱的用户资料。"

with assistant():
    lm += """{
    "name": """ + gen("name", regex=r'"[A-Za-z ]+"', max_tokens=30) + """,
    "age": """ + gen("age", regex=r"[0-9]+", max_tokens=3) + """,
    "email": """ + gen("email", regex=r'"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"', max_tokens=50) + """
}"""

print(lm)  # 保证为有效的 JSON
```

### 模式 2：分类

```python
from guidance import models, gen, select

lm = models.Anthropic("claude-sonnet-4-5-20250929")

text = "这个产品太棒了！我非常喜欢它。"

lm += f"文本: {text}\n"
lm += "情感: " + select(["积极", "消极", "中立"], name="sentiment")
lm += "\n置信度: " + gen("confidence", regex=r"[0-9]+", max_tokens=3) + "%"

print(f"情感: {lm['sentiment']}")
print(f"置信度: {lm['confidence']}%")
```

### 模式 3：多步推理

```python
from guidance import models, gen, guidance

@guidance
def chain_of_thought(lm, question):
    """通过逐步推理生成答案。"""
    lm += f"问题: {question}\n\n"

    # 生成多个推理步骤
    for i in range(3):
        lm += f"步骤 {i+1}: " + gen(f"step_{i+1}", stop="\n", max_tokens=100) + "\n"

    # 最终答案
    lm += "\n因此，答案是: " + gen("answer", max_tokens=50)

    return lm

lm = models.Anthropic("claude-sonnet-4-5-20250929")
lm = chain_of_thought(lm, "200 的 15% 是多少？")

print(lm["answer"])
```

### 模式 4：ReAct 智能体

```python
from guidance import models, gen, select, guidance

@guidance(stateless=False)
def react_agent(lm, question):
    """具有工具使用的 ReAct 智能体。"""
    tools = {
        "calculator": lambda expr: eval(expr),
        "search": lambda query: f"搜索结果: {query}",
    }

    lm += f"问题: {question}\n\n"

    for round in range(5):
        # 思考
        lm += f"思考: " + gen("thought", stop="\n") + "\n"

        # 动作选择
        lm += "动作: " + select(["calculator", "search", "answer"], name="action")

        if lm["action"] == "answer":
            lm += "\n最终答案: " + gen("answer", max_tokens=100)
            break

        # 动作输入
        lm += "\n动作输入: " + gen("action_input", stop="\n") + "\n"

        # 执行工具
        if lm["action"] in tools:
            result = tools[lm["action"]](lm["action_input"])
            lm += f"观察: {result}\n\n"

    return lm

lm = models.Anthropic("claude-sonnet-4-5-20250929")
lm = react_agent(lm, "25 * 4 + 10 等于多少？")
print(lm["answer"])
```

### 模式 5：数据提取

```python
from guidance import models, gen, guidance

@guidance
def extract_entities(lm, text):
    """从文本中提取结构化实体。"""
    lm += f"文本: {text}\n\n"

    # 提取人物
    lm += "人物: " + gen("person", stop="\n", max_tokens=30) + "\n"

    # 提取组织
    lm += "组织: " + gen("organization", stop="\n", max_tokens=30) + "\n"

    # 提取日期
    lm += "日期: " + gen("date", regex=r"\d{4}-\d{2}-\d{2}", max_tokens=10) + "\n"

    # 提取地点
    lm += "地点: " + gen("location", stop="\n", max_tokens=30) + "\n"

    return lm

text = "蒂姆·库克于 2024-09-15 在库比蒂诺的苹果公园宣布。"

lm = models.Anthropic("claude-sonnet-4-5-20250929")
lm = extract_entities(lm, text)

print(f"人物: {lm['person']}")
print(f"组织: {lm['organization']}")
print(f"日期: {lm['date']}")
print(f"地点: {lm['location']}")
```

## 最佳实践

### 1. 使用正则表达式进行格式验证

```python
# ✅ 好：正则表达式确保格式有效
lm += "Email: " + gen("email", regex=r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")

# ❌ 坏：自由生成可能产生无效邮箱
lm += "Email: " + gen("email", max_tokens=50)
```

### 2. 使用 select() 处理固定类别

```python
# ✅ 好：保证生成有效的类别
lm += "Status: " + select(["pending", "approved", "rejected"], name="status")

# ❌ 坏：可能产生拼写错误或无效值
lm += "Status: " + gen("status", max_tokens=20)
```

### 3. 利用 Token 修复

```python
# 默认情况下 Token 修复是启用的
# 无需特殊操作 - 只需自然地连接字符串
lm += "The capital is " + gen("capital")  # 自动修复
```

### 4. 使用停止序列

```python
# ✅ 好：在换行处停止，用于单行输出
lm += "Name: " + gen("name", stop="\n")

# ❌ 坏：可能生成多行内容
lm += "Name: " + gen("name", max_tokens=50)
```

### 5. 创建可复用函数

```python
# ✅ 好：可复用的模式
@guidance
def generate_person(lm):
    lm += "Name: " + gen("name", stop="\n")
    lm += "\nAge: " + gen("age", regex=r"[0-9]+")
    return lm

# 多次使用
lm = generate_person(lm)
lm += "\n\n"
lm = generate_person(lm)
```

### 6. 平衡约束条件

```python
# ✅ 好：合理的约束
lm += gen("name", regex=r"[A-Za-z ]+", max_tokens=30)

# ❌ 过于严格：可能失败或非常慢
lm += gen("name", regex=r"^(John|Jane)$", max_tokens=10)
```

## 与其他替代方案对比

| 特性 | Guidance | Instructor | Outlines | LMQL |
|---------|----------|------------|----------|------|
| 正则表达式约束 | ✅ 支持 | ❌ 不支持 | ✅ 支持 | ✅ 支持 |
| 语法支持 | ✅ CFG | ❌ 不支持 | ✅ CFG | ✅ CFG |
| Pydantic 验证 | ❌ 不支持 | ✅ 支持 | ✅ 支持 | ❌ 不支持 |
| Token 修复 | ✅ 支持 | ❌ 不支持 | ✅ 支持 | ❌ 不支持 |
| 本地模型 | ✅ 支持 | ⚠️ 有限支持 | ✅ 支持 | ✅ 支持 |
| API 模型 | ✅ 支持 | ✅ 支持 | ⚠️ 有限支持 | ✅ 支持 |
| Python 风格语法 | ✅ 支持 | ✅ 支持 | ✅ 支持 | ❌ 类 SQL 风格 |
| 学习曲线 | 低 | 低 | 中等 | 高 |

**何时选择 Guidance：**
- 需要正则表达式/语法约束
- 需要 Token 修复
- 构建包含控制流的复杂工作流
- 使用本地模型（Transformers、llama.cpp）
- 偏好 Python 风格的语法

**何时选择替代方案：**
- Instructor：需要带自动重试的 Pydantic 验证
- Outlines：需要 JSON Schema 验证
- LMQL：偏好声明式查询语法

## 性能特征

**延迟降低：**
- 对于受约束的输出，比传统提示方法快 30-50%
- Token 修复减少了不必要的重复生成
- 语法约束防止生成无效 token

**内存使用：**
- 与无约束生成相比，开销极小
- 首次使用后缓存编译后的语法
- 推理时进行高效的 token 过滤

**Token 效率：**
- 防止在无效输出上浪费 token
- 无需重试循环
- 直接生成有效输出

## 资源

- **文档**：https://guidance.readthedocs.io
- **GitHub**：https://github.com/guidance-ai/guidance（18k+ 星）
- **Notebooks**：https://github.com/guidance-ai/guidance/tree/main/notebooks
- **Discord**：提供社区支持

## 另请参见

- `references/constraints.md` - 全面的正则表达式和语法模式
- `references/backends.md` - 特定于后端的配置
- `references/examples.md` - 生产环境就绪的示例