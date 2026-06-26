---
title: "Dspy — DSPy: 声明式LM程序、自动优化提示词、RAG"
sidebar_label: "DSPy"
description: "DSPy: 声明式LM程序、自动优化提示词、RAG"
---

{/* 本页面由网站/脚本/generate-skill-docs.py 从技能的SKILL.md自动生成。请编辑源文件SKILL.md，而不是本页面。 */}

# Dspy

DSPy：声明式LM程序、自动优化提示词、RAG。

## 技能元数据

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/mlops/dspy` 安装 |
| Path | `optional-skills/mlops/research/dspy` |
| Version | `1.0.0` |
| Author | Orchestra Research |
| License | MIT |
| Dependencies | `dspy`, `openai`, `anthropic` |
| Platforms | linux, macos, windows |
| Tags | `提示工程`, `DSPy`, `声明式编程`, `RAG`, `智能体`, `提示优化`, `LM编程`, `Stanford NLP`, `自动优化`, `模块化AI` |

## Key Paths & Config

```
~/.hermes/config.yaml       Main configuration
~/.hermes/.env              API keys and secrets (under $HERMES_HOME if set)
$HERMES_HOME
```

# DSPy: 声明式语言模型编程

## 何时使用此技能

当您需要以下任一项任务时，请使用DSPy：
- **构建复杂的AI系统**，包含多个组件和工作流程
- **以声明式方式编程LM**，而不是进行手动提示工程（prompt engineering）
- **使用数据驱动的方法自动优化提示词**
- **创建可维护、可移植的模块化AI管道**
- **通过优化器系统地改进模型输出**
- **构建具有更高可靠性的RAG系统、智能体或分类器**

**GitHub 星数**: 22,000+ | **创建者**: Stanford NLP

## 安装

```bash
# 稳定版本
pip install dspy

# 最新开发版本
pip install git+https://github.com/stanfordnlp/dspy.git

# 包含特定LM提供商
pip install dspy[openai]        # OpenAI
pip install dspy[anthropic]     # Anthropic Claude
pip install dspy[all]           # 所有提供商
```

## 快速入门

### 基本示例：问答

```python
import dspy

# 配置您的语言模型
lm = dspy.Claude(model="claude-sonnet-4-5-20250929")
dspy.settings.configure(lm=lm)

# 定义签名（输入 → 输出）
class QA(dspy.Signature):
    """用简短的事实性答案回答问题。"""
    question = dspy.InputField()
    answer = dspy.OutputField(desc="通常在1到5个词之间")

# 创建一个模块
qa = dspy.Predict(QA)

# 使用它
response = qa(question="法国的首都是哪里？")
print(response.answer)  # "巴黎"
```

### 思维链（Chain of Thought）推理

```python
import dspy

lm = dspy.Claude(model="claude-sonnet-4-5-20250929")
dspy.settings.configure(lm=lm)

# 使用ChainOfThought进行更好的推理
class MathProblem(dspy.Signature):
    """解决数学文字题。"""
    problem = dspy.InputField()
    answer = dspy.OutputField(desc="数值答案")

# ChainOfThought会自动生成推理步骤
cot = dspy.ChainOfThought(MathProblem)

response = cot(problem="约翰有5个苹果，给了玛丽2个，他还剩几个？")
print(response.rationale)  # 显示推理步骤
print(response.answer)     # "3"
```

## 核心概念

### 1. 签名（Signatures）

签名定义了您的AI任务结构（输入 → 输出）：

```python
# 内联签名（简单）
qa = dspy.Predict("question -> answer")

# 类签名（详细）
class Summarize(dspy.Signature):
    """将文本总结成要点。"""
    text = dspy.InputField()
    summary = dspy.OutputField(desc="3-5个项目符号")

summarizer = dspy.ChainOfThought(Summarize)
```

**何时使用各类型：**
- **内联（Inline）**: 快速原型设计，简单任务
- **类（Class）**: 复杂任务、类型提示、更好的文档说明

### 2. 模块（Modules）

模块是用于将输入转换为输出的可重用组件：

#### dspy.Predict
基础预测模块：

```python
predictor = dspy.Predict("context, question -> answer")
result = predictor(context="巴黎是法国的首都",
                   question="首都是什么？")
```

#### dspy.ChainOfThought
在回答之前生成推理步骤：

```python
cot = dspy.ChainOfThought("question -> answer")
result = cot(question="为什么天空是蓝色的？")
print(result.rationale)  # 推理步骤
print(result.answer)     # 最终答案
```

#### dspy.ReAct
带有工具的智能体式推理：

```python
from dspy.predict import ReAct

class SearchQA(dspy.Signature):
    """使用搜索回答问题。"""
    question = dspy.InputField()
    answer = dspy.OutputField()

def search_tool(query: str) -> str:
    """搜索维基百科。"""
    # 您的搜索实现
    return results

react = ReAct(SearchQA, tools=[search_tool])
result = react(question="Python是什么时候创建的？")
```

#### dspy.ProgramOfThought
生成并执行代码进行推理：

```python
pot = dspy.ProgramOfThought("question -> answer")
result = pot(question="240的15%是多少？")
# 生成: answer = 240 * 0.15
```

### 3. 优化器（Optimizers）

优化器使用训练数据自动改进您的模块：

#### BootstrapFewShot
从示例中学习：

```python
from dspy.teleprompt import BootstrapFewShot

# 训练数据
trainset = [
    dspy.Example(question="2+2等于多少？", answer="4").with_inputs("question"),
    dspy.Example(question="3+5等于多少？", answer="8").with_inputs("question"),
]

# 定义指标
def validate_answer(example, pred, trace=None):
    return example.answer == pred.answer

# 优化
optimizer = BootstrapFewShot(metric=validate_answer, max_bootstrapped_demos=3)
optimized_qa = optimizer.compile(qa, trainset=trainset)

# 现在 optimized_qa 会表现更好！
```

#### MIPRO (Most Important Prompt Optimization)
迭代改进提示词：

```python
from dspy.teleprompt import MIPRO

optimizer = MIPRO(
    metric=validate_answer,
    num_candidates=10,
    init_temperature=1.0
)

optimized_cot = optimizer.compile(
    cot,
    trainset=trainset,
    num_trials=100
)
```

#### BootstrapFinetune
创建用于模型微调的数据集：

```python
from dspy.teleprompt import BootstrapFinetune

optimizer = BootstrapFinetune(metric=validate_answer)
optimized_module = optimizer.compile(qa, trainset=trainset)

# 导出用于微调的训练数据
```

### 4. 构建复杂系统

#### 多阶段管道（Multi-Stage Pipeline）

```python
import dspy

class MultiHopQA(dspy.Module):
    def __init__(self):
        super().__init__()
        self.retrieve = dspy.Retrieve(k=3)
        self.generate_query = dspy.ChainOfThought("question -> search_query")
        self.generate_answer = dspy.ChainOfThought("context, question -> answer")

    def forward(self, question):
        # 阶段 1: 生成搜索查询
        search_query = self.generate_query(question=question).search_query

        # 阶段 2: 检索上下文
        passages = self.retrieve(search_query).passages
        context = "\n".join(passages)

        # 阶段 3: 生成答案
        answer = self.generate_answer(context=context, question=question).answer
        return dspy.Prediction(answer=answer, context=context)

# 使用管道
qa_system = MultiHopQA()
result = qa_system(question="启发了电影《银翼杀手》的书籍是谁写的？")
```

#### 带有优化的RAG系统

```python
import dspy
from dspy.retrieve.chromadb_rm import ChromadbRM

# 配置检索器
retriever = ChromadbRM(
    collection_name="documents",
    persist_directory="./chroma_db"
)

class RAG(dspy.Module):
    def __init__(self, num_passages=3):
        super().__init__()
        self.retrieve = dspy.Retrieve(k=num_passages)
        self.generate = dspy.ChainOfThought("context, question -> answer")

    def forward(self, question):
        context = self.retrieve(question).passages
        return self.generate(context=context, question=question)

# 创建并优化
rag = RAG()

# 使用训练数据进行优化
from dspy.teleprompt import BootstrapFewShot

optimizer = BootstrapFewShot(metric=validate_answer)
optimized_rag = optimizer.compile(rag, trainset=trainset)
```

## LM提供商配置

### Anthropic Claude

```python
import dspy

lm = dspy.Claude(
    model="claude-sonnet-4-5-20250929",
    api_key="your-api-key",  # 或设置 ANTHROPIC_API_KEY 环境变量
    max_tokens=1000,
    temperature=0.7
)
dspy.settings.configure(lm=lm)
```

### OpenAI

```python
lm = dspy.OpenAI(
    model="gpt-4",
    api_key="your-api-key",
    max_tokens=1000
)
dspy.settings.configure(lm=lm)
```

### 本地模型（Ollama）

```python
lm = dspy.OllamaLocal(
    model="llama3.1",
    base_url="http://localhost:11434"
)
dspy.settings.configure(lm=lm)
```

### 多个模型

```python
# 为不同任务使用不同的模型
cheap_lm = dspy.OpenAI(model="gpt-3.5-turbo")
strong_lm = dspy.Claude(model="claude-sonnet-4-5-20250929")

# 使用廉价模型进行检索，使用强大的模型进行推理
with dspy.settings.context(lm=cheap_lm):
    context = retriever(question)

with dspy.settings.context(lm=strong_lm):
    answer = generator(context=context, question=question)
```

## 常见模式（Common Patterns）

### 模式 1: 结构化输出

```python
from pydantic import BaseModel, Field

class PersonInfo(BaseModel):
    name: str = Field(description="全名")
    age: int = Field(description="年龄（岁）")
    occupation: str = Field(description="当前职业")

class ExtractPerson(dspy.Signature):
    """从文本中提取人物信息。"""
    text = dspy.InputField()
    person: PersonInfo = dspy.OutputField()

extractor = dspy.TypedPredictor(ExtractPerson)
result = extractor(text="John Doe是一位35岁的软件工程师。")
print(result.person.name)  # "John Doe"
print(result.person.age)   # 35
```

### 模式 2: 断言驱动的优化（Assertion-Driven Optimization）

```python
import dspy
from dspy.primitives.assertions import assert_transform_module, backtrack_handler

class MathQA(dspy.Module):
    def __init__(self):
        super().__init__()
        self.solve = dspy.ChainOfThought("problem -> solution: float")

    def forward(self, problem):
        solution = self.solve(problem=problem).solution

        # 断言解决方案是数字
        dspy.Assert(
            isinstance(float(solution), float),
            "Solution must be a number",
            backtrack=backtrack_handler
        )

        return dspy.Prediction(solution=solution)
```

### 模式 3: 自洽性（Self-Consistency）

```python
import dspy
from collections import Counter

class ConsistentQA(dspy.Module):
    def __init__(self, num_samples=5):
        super().__init__()
        self.qa = dspy.ChainOfThought("question -> answer")
        self.num_samples = num_samples

    def forward(self, question):
        # 生成多个答案
        answers = []
        for _ in range(self.num_samples):
            result = self.qa(question=question)
            answers.append(result.answer)

        # 返回最常见的答案
        most_common = Counter(answers).most_common(1)[0][0]
        return dspy.Prediction(answer=most_common)
```

### 模式 4: 带重排（Reranking）的检索

```python
class RerankedRAG(dspy.Module):
    def __init__(self):
        super().__init__()
        self.retrieve = dspy.Retrieve(k=10)
        self.rerank = dspy.Predict("question, passage -> relevance_score: float")
        self.answer = dspy.ChainOfThought("context, question -> answer")

    def forward(self, question):
        # 检索候选片段
        passages = self.retrieve(question).passages

        # 对片段进行重排
        scored = []
        for passage in passages:
            score = float(self.rerank(question=question, passage=passage).relevance_score)
            scored.append((score, passage))

        # 取前3名
        top_passages = [p for _, p in sorted(scored, reverse=True)[:3]]
        context = "\n\n".join(top_passages)

        # 生成答案
        return self.answer(context=context, question=question)
```

## 评估和指标（Evaluation and Metrics）

### 自定义指标

```python
def exact_match(example, pred, trace=None):
    """精确匹配指标。"""
    return example.answer.lower() == pred.answer.lower()

def f1_score(example, pred, trace=None):
    """文本重叠的F1分数。"""
    pred_tokens = set(pred.answer.lower().split())
    gold_tokens = set(example.answer.lower().split())

    if not pred_tokens:
        return 0.0

    precision = len(pred_tokens & gold_tokens) / len(pred_tokens)
    recall = len(pred_tokens & gold_tokens) / len(gold_tokens)

    if precision + recall == 0:
        return 0.0

    return 2 * (precision * recall) / (precision + recall)
```

### 评估

```python
from dspy.evaluate import Evaluate

# 创建评估器
evaluator = Evaluate(
    devset=testset,
    metric=exact_match,
    num_threads=4,
    display_progress=True
)

# 评估模型
score = evaluator(qa_system)
print(f"准确率: {score}")

# 比较优化前后的结果
score_before = evaluator(qa)
score_after = evaluator(optimized_qa)
print(f"提升幅度: {score_after - score_before:.2%}")
```

## 最佳实践

### 1. 从简单开始，然后迭代

```python
# Start with Predict
qa = dspy.Predict("question -> answer")

# Add reasoning if needed
qa = dspy.ChainOfThought("question -> answer")

# Add optimization when you have data
optimized_qa = optimizer.compile(qa, trainset=data)
```

### 2. 使用描述性的签名 (Signatures)

```python
# ❌ Bad: Vague
class Task(dspy.Signature):
    input = dspy.InputField()
    output = dspy.OutputField()

# ✅ Good: Descriptive
class SummarizeArticle(dspy.Signature):
    """Summarize news articles into 3-5 key points."""
    article = dspy.InputField(desc="full article text")
    summary = dspy.OutputField(desc="bullet points, 3-5 items")
```

### 3. 使用代表性数据进行优化

```python
# Create diverse training examples
trainset = [
    dspy.Example(question="factual", answer="...).with_inputs("question"),
    dspy.Example(question="reasoning", answer="...").with_inputs("question"),
    dspy.Example(question="calculation", answer="...").with_inputs("question"),
]

# Use validation set for metric
def metric(example, pred, trace=None):
    return example.answer in pred.answer
```

### 4. 保存和加载优化后的模型

```python
# Save
optimized_qa.save("models/qa_v1.json")

# Load
loaded_qa = dspy.ChainOfThought("question -> answer")
loaded_qa.load("models/qa_v1.json")
```

### 5. 监控和调试

```python
# Enable tracing
dspy.settings.configure(lm=lm, trace=[])

# Run prediction
result = qa(question="...")

# Inspect trace
for call in dspy.settings.trace:
    print(f"Prompt: {call['prompt']}")
    print(f"Response: {call['response']}")
```

## 与其他方法的比较

| 特性 | 手动提示 (Manual Prompting) | LangChain | DSPy |
|---------|-----------------|-----------|------|
| 提示工程 | 手动 | 手动 | 自动 |
| 优化 | 试错法 | 无 | 数据驱动 |
| 模块化程度 | 低 | 中等 | 高 |
| 类型安全 | 无 | 有限 | 是 (签名) |
| 可移植性 | 低 | 中等 | 高 |
| 学习曲线 | 低 | 中等 | 中高 |

**何时选择 DSPy：**
- 您有训练数据或可以生成它
- 您需要系统性的提示改进
- 您正在构建复杂的多阶段系统
- 您希望跨不同的LM进行优化

**何时选择替代方案：**
- 快速原型设计（手动提示）
- 使用现有工具的简单链式调用（LangChain）
- 需要自定义优化逻辑

## 资源

- **文档**: https://dspy.ai
- **GitHub**: https://github.com/stanfordnlp/dspy (22k+ stars)
- **Discord**: https://discord.gg/XCGy2WDCQB
- **Twitter**: @DSPyOSS
- **论文**: "DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines"

## 另请参阅

- `references/modules.md` - 详细的模块指南（Predict, ChainOfThought, ReAct, ProgramOfThought）
- `references/optimizers.md` - 优化算法（BootstrapFewShot, MIPRO, BootstrapFinetune）
- `references/examples.md` - 真实世界示例（RAG、智能体，分类器）