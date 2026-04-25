---
title: "Instructor"
sidebar_label: "Instructor"
description: "使用 Pydantic 验证从 LLM 响应中提取结构化数据，自动重试失败的提取，以类型安全的方式解析复杂 JSON，并流式传输部分结果..."
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Instructor

使用 Instructor（经过实战检验的结构化输出库）从 LLM 响应中提取结构化数据，结合 Pydantic 验证，自动重试失败的提取，以类型安全的方式解析复杂 JSON，并流式传输部分结果。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/mlops/instructor` 安装 |
| 路径 | `optional-skills/mlops/instructor` |
| 版本 | `1.0.0` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖项 | `instructor`, `pydantic`, `openai`, `anthropic` |
| 标签 | `提示工程`, `Instructor`, `结构化输出`, `Pydantic`, `数据提取`, `JSON 解析`, `类型安全`, `验证`, `流式传输`, `OpenAI`, `Anthropic` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在该技能被触发时加载的完整技能定义。这是当技能激活时智能体看到的指令。
:::

# Instructor：结构化 LLM 输出

## 何时使用此技能

当您需要以下功能时，请使用 Instructor：
- **可靠地从 LLM 响应中提取结构化数据**
- **根据 Pydantic 模式自动验证输出**
- **自动处理错误并重试失败的提取**
- **以类型安全和验证的方式解析复杂 JSON**
- **流式传输部分结果以进行实时处理**
- **通过一致的 API 支持多个 LLM 提供商**

**GitHub Stars**：15,000+ | **经过实战检验**：100,000+ 开发者

## 安装

```bash
# 基础安装
pip install instructor

# 包含特定提供商
pip install "instructor[anthropic]"  # Anthropic Claude
pip install "instructor[openai]"     # OpenAI
pip install "instructor[all]"        # 所有提供商
```

## 快速入门

### 基本示例：提取用户数据

```python
import instructor
from pydantic import BaseModel
from anthropic import Anthropic

# 定义输出结构
class User(BaseModel):
    name: str
    age: int
    email: str

# 创建 instructor 客户端
client = instructor.from_anthropic(Anthropic())

# 提取结构化数据
user = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "John Doe 30岁。他的邮箱是 john@example.com"
    }],
    response_model=User
)

print(user.name)   # "John Doe"
print(user.age)    # 30
print(user.email)  # "john@example.com"
```

### 使用 OpenAI

```python
from openai import OpenAI

client = instructor.from_openai(OpenAI())

user = client.chat.completions.create(
    model="gpt-4o-mini",
    response_model=User,
    messages=[{"role": "user", "content": "提取：Alice，25岁，alice@email.com"}]
)
```

## 核心概念

### 1. 响应模型（Pydantic）

响应模型定义了 LLM 输出的结构和验证规则。

#### 基本模型

```python
from pydantic import BaseModel, Field

class Article(BaseModel):
    title: str = Field(description="文章标题")
    author: str = Field(description="作者姓名")
    word_count: int = Field(description="字数", gt=0)
    tags: list[str] = Field(description="相关标签列表")

article = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "分析这篇文章：[文章内容]"
    }],
    response_model=Article
)
```

**优点：**
- 通过 Python 类型提示实现类型安全
- 自动验证（word_count > 0）
- 通过 Field 描述实现自文档化
- 支持 IDE 自动补全

#### 嵌套模型

```python
class Address(BaseModel):
    street: str
    city: str
    country: str

class Person(BaseModel):
    name: str
    age: int
    address: Address  # 嵌套模型

person = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "John 住在 123 Main St, Boston, USA"
    }],
    response_model=Person
)

print(person.address.city)  # "Boston"
```

#### 可选字段

```python
from typing import Optional

class Product(BaseModel):
    name: str
    price: float
    discount: Optional[float] = None  # 可选
    description: str = Field(default="无描述")  # 默认值

# LLM 无需提供折扣或描述
```

#### 枚举用于约束

```python
from enum import Enum

class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"

class Review(BaseModel):
    text: str
    sentiment: Sentiment  # 仅允许这三个值

review = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "这个产品太棒了！"
    }],
    response_model=Review
)

print(review.sentiment)  # Sentiment.POSITIVE
```

### 2. 验证

Pydantic 会自动验证 LLM 输出。如果验证失败，Instructor 会重试。

#### 内置验证器

```python
from pydantic import Field, EmailStr, HttpUrl

class Contact(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    age: int = Field(ge=0, le=120)  # 0 <= age <= 120
    email: EmailStr  # 验证邮箱格式
    website: HttpUrl  # 验证 URL 格式

# 如果 LLM 提供无效数据，Instructor 会自动重试
```

#### 自定义验证器

```python
from pydantic import field_validator

class Event(BaseModel):
    name: str
    date: str
    attendees: int

    @field_validator('date')
    def validate_date(cls, v):
        """确保日期格式为 YYYY-MM-DD。"""
        import re
        if not re.match(r'\d{4}-\d{2}-\d{2}', v):
            raise ValueError('日期必须为 YYYY-MM-DD 格式')
        return v

    @field_validator('attendees')
    def validate_attendees(cls, v):
        """确保参会人数为正数。"""
        if v < 1:
            raise ValueError('必须至少有 1 位参会者')
        return v
```

#### 模型级验证

```python
from pydantic import model_validator

class DateRange(BaseModel):
    start_date: str
    end_date: str

    @model_validator(mode='after')
    def check_dates(self):
        """确保 end_date 在 start_date 之后。"""
        from datetime import datetime
        start = datetime.strptime(self.start_date, '%Y-%m-%d')
        end = datetime.strptime(self.end_date, '%Y-%m-%d')

        if end < start:
            raise ValueError('end_date 必须在 start_date 之后')
        return self
```

### 3. 自动重试

当验证失败时，Instructor 会自动重试，并向 LLM 提供错误反馈。

```python
# 如果验证失败，最多重试 3 次
user = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "从以下文本中提取用户：John，年龄未知"
    }],
    response_model=User,
    max_retries=3  # 默认为 3
)

# 如果无法提取年龄，Instructor 会告诉 LLM：
# "验证错误：age - 字段为必填项"
# LLM 会尝试再次提取，并提供更好的结果
```

**工作原理：**
1. LLM 生成输出
2. Pydantic 进行验证
3. 如果无效：将错误消息发送回 LLM
4. LLM 根据错误反馈再次尝试
5. 重复此过程，最多重试 max_retries 次

### 4. 流式传输

流式传输部分结果以进行实时处理。

#### 流式传输部分对象

```python
from instructor import Partial

class Story(BaseModel):
    title: str
    content: str
    tags: list[str]

# 随着 LLM 生成内容，流式传输部分更新
for partial_story in client.messages.create_partial(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "写一个简短的科幻故事"
    }],
    response_model=Story
):
    print(f"标题：{partial_story.title}")
    print(f"目前内容：{partial_story.content[:100]}...")
    # 实时更新 UI
```

#### 流式传输可迭代对象

```python
class Task(BaseModel):
    title: str
    priority: str

# 随着生成内容，流式传输列表项
tasks = client.messages.create_iterable(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "生成 10 个项目任务"
    }],
    response_model=Task
)

for task in tasks:
    print(f"- {task.title} ({task.priority})")
    # 每收到一个任务就处理它
```

## 提供商配置

### Anthropic Claude

```python
import instructor
from anthropic import Anthropic

client = instructor.from_anthropic(
    Anthropic(api_key="your-api-key")
)

# 与 Claude 模型一起使用
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[...],
    response_model=YourModel
)
```

### OpenAI

```python
from openai import OpenAI

client = instructor.from_openai(
    OpenAI(api_key="your-api-key")
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    response_model=YourModel,
    messages=[...]
)
```

### 本地模型（Ollama）

```python
from openai import OpenAI

# 指向本地 Ollama 服务器
client = instructor.from_openai(
    OpenAI(
        base_url="http://localhost:11434/v1",
        api_key="ollama"  # 必需，但会被忽略
    ),
    mode=instructor.Mode.JSON
)

response = client.chat.completions.create(
    model="llama3.1",
    response_model=YourModel,
    messages=[...]
)
```

## 常见模式

### 模式 1：从文本中提取数据

```python
class CompanyInfo(BaseModel):
    name: str
    founded_year: int
    industry: str
    employees: int
    headquarters: str

text = """
特斯拉公司于 2003 年成立。它在汽车和能源行业运营，
拥有约 140,000 名员工。公司总部位于德克萨斯州奥斯汀。
"""

company = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": f"从以下文本中提取公司信息：{text}"
    }],
    response_model=CompanyInfo
)
```

### 模式 2：分类

```python
class Category(str, Enum):
    TECHNOLOGY = "technology"
    FINANCE = "finance"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    OTHER = "other"

class ArticleClassification(BaseModel):
    category: Category
    confidence: float = Field(ge=0.0, le=1.0)
    keywords: list[str]

classification = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "对这篇文章进行分类：[文章内容]"
    }],
    response_model=ArticleClassification
)
```

### 模式 3：多实体提取

```python
class Person(BaseModel):
    name: str
    role: str

class Organization(BaseModel):
    name: str
    industry: str

class Entities(BaseModel):
    people: list[Person]
    organizations: list[Organization]
    locations: list[str]

text = "苹果公司的首席执行官 Tim Cook 在库比蒂诺的活动中宣布..."

entities = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": f"从以下文本中提取所有实体：{text}"
    }],
    response_model=Entities
)

for person in entities.people:
    print(f"{person.name} - {person.role}")
```

### 模式 4：结构化分析

```python
class SentimentAnalysis(BaseModel):
    overall_sentiment: Sentiment
    positive_aspects: list[str]
    negative_aspects: list[str]
    suggestions: list[str]
    score: float = Field(ge=-1.0, le=1.0)

review = "这个产品很好用，但设置过程令人困惑..."

analysis = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": f"分析这条评论：{review}"
    }],
    response_model=SentimentAnalysis
)
```

### 模式 5：批处理

```python
def extract_person(text: str) -> Person:
    return client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"从以下文本中提取人物：{text}"
        }],
        response_model=Person
    )

texts = [
    "John Doe 是一名 30 岁的工程师",
    "Jane Smith，25 岁，从事市场营销工作",
    "Bob Johnson，40 岁，软件开发人员"
]

people = [extract_person(text) for text in texts]
```

## 高级功能

### 联合类型

```python
from typing import Union

class TextContent(BaseModel):
    type: str = "text"
    content: str

class ImageContent(BaseModel):
    type: str = "image"
    url: HttpUrl
    caption: str

class Post(BaseModel):
    title: str
    content: Union[TextContent, ImageContent]  # 任意一种类型

# 大语言模型根据内容选择适当的类型
```

### 动态模型

```python
from pydantic import create_model

# 在运行时创建模型
DynamicUser = create_model(
    'User',
    name=(str, ...),
    age=(int, Field(ge=0)),
    email=(EmailStr, ...)
)

user = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[...],
    response_model=DynamicUser
)
```

### 自定义模式

```python
# 适用于不支持原生结构化输出的提供者
client = instructor.from_anthropic(
    Anthropic(),
    mode=instructor.Mode.JSON  # JSON 模式
)

# 可用模式：
# - Mode.ANTHROPIC_TOOLS（推荐用于 Claude）
# - Mode.JSON（备用）
# - Mode.TOOLS（OpenAI 工具）
```

### 上下文管理

```python
# 一次性客户端
with instructor.from_anthropic(Anthropic()) as client:
    result = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1024,
        messages=[...],
        response_model=YourModel
    )
    # 客户端自动关闭
```

## 错误处理

### 处理验证错误

```python
from pydantic import ValidationError

try:
    user = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1024,
        messages=[...],
        response_model=User,
        max_retries=3
    )
except ValidationError as e:
    print(f"重试后失败：{e}")
    # 优雅处理

except Exception as e:
    print(f"API 错误：{e}")
```

### 自定义错误消息

```python
class ValidatedUser(BaseModel):
    name: str = Field(description="全名，2-100 个字符")
    age: int = Field(description="年龄介于 0 到 120 之间", ge=0, le=120)
    email: EmailStr = Field(description="有效的电子邮件地址")

    class Config:
        # 自定义错误消息
        json_schema_extra = {
            "examples": [
                {
                    "name": "John Doe",
                    "age": 30,
                    "email": "john@example.com"
                }
            ]
        }
```

## 最佳实践

### 1. 清晰的字段描述

```python
# ❌ 差：模糊
class Product(BaseModel):
    name: str
    price: float

# ✅ 好：描述性
class Product(BaseModel):
    name: str = Field(description="文本中的产品名称")
    price: float = Field(description="美元价格，不带货币符号")
```

### 2. 使用适当的验证

```python
# ✅ 好：约束值
class Rating(BaseModel):
    score: int = Field(ge=1, le=5, description="1 到 5 星的评分")
    review: str = Field(min_length=10, description="评论文本，至少 10 个字符")
```

### 3. 在提示中提供示例

```python
messages = [{
    "role": "user",
    "content": """从以下文本中提取人员信息："John, 30, engineer"

示例格式：
{
  "name": "John Doe",
  "age": 30,
  "occupation": "engineer"
}"""
}]
```

### 4. 对固定类别使用枚举

```python
# ✅ 好：枚举确保有效值
class Status(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class Application(BaseModel):
    status: Status  # 大语言模型必须从枚举中选择
```

### 5. 优雅处理缺失数据

```python
class PartialData(BaseModel):
    required_field: str
    optional_field: Optional[str] = None
    default_field: str = "default_value"

# 大语言模型只需提供 required_field
```

## 与其他方案的比较

| 功能 | Instructor | 手动 JSON | LangChain | DSPy |
|---------|------------|-------------|-----------|------|
| 类型安全 | ✅ 是 | ❌ 否 | ⚠️ 部分 | ✅ 是 |
| 自动验证 | ✅ 是 | ❌ 否 | ❌ 否 | ⚠️ 有限 |
| 自动重试 | ✅ 是 | ❌ 否 | ❌ 否 | ✅ 是 |
| 流式传输 | ✅ 是 | ❌ 否 | ✅ 是 | ❌ 否 |
| 多提供者支持 | ✅ 是 | ⚠️ 手动 | ✅ 是 | ✅ 是 |
| 学习曲线 | 低 | 低 | 中等 | 高 |

**何时选择 Instructor：**
- 需要结构化、已验证的输出
- 希望获得类型安全和 IDE 支持
- 需要自动重试
- 构建数据提取系统

**何时选择其他方案：**
- DSPy：需要提示优化
- LangChain：构建复杂链
- 手动：简单、一次性提取

## 资源

- **文档**：https://python.useinstructor.com
- **GitHub**：https://github.com/jxnl/instructor (15k+ 星标)
- **示例手册**：https://python.useinstructor.com/examples
- **Discord**：提供社区支持

## 另见

- `references/validation.md` - 高级验证模式
- `references/providers.md` - 提供者特定配置
- `references/examples.md` - 实际用例