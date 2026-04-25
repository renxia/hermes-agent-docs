---
title: "Huggingface Tokenizers — 面向研究和生产环境优化的快速分词器"
sidebar_label: "Huggingface Tokenizers"
description: "面向研究和生产环境优化的快速分词器"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从 skill 的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Huggingface Tokenizers

面向研究和生产环境优化的快速分词器。基于 Rust 的实现可在 &lt;20 秒内对 1GB 文本进行分词。支持 BPE、WordPiece 和 Unigram 算法。可训练自定义词表、跟踪对齐关系、处理填充/截断。与 transformers 无缝集成。当您需要进行高性能分词或自定义分词器训练时使用。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/mlops/huggingface-tokenizers` 安装 |
| 路径 | `optional-skills/mlops/huggingface-tokenizers` |
| 版本 | `1.0.0` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖项 | `tokenizers`, `transformers`, `datasets` |
| 标签 | `分词`, `HuggingFace`, `BPE`, `WordPiece`, `Unigram`, `快速分词`, `Rust`, `自定义分词器`, `对齐跟踪`, `生产环境` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# HuggingFace Tokenizers - 用于 NLP 的快速分词

具有 Rust 性能和 Python 易用性的快速、可用于生产环境的分词器。

## 何时使用 HuggingFace Tokenizers

**在以下情况下使用 HuggingFace Tokenizers：**
- 需要极快的分词速度（每 GB 文本 <20 秒）
- 从头开始训练自定义分词器
- 需要对齐跟踪（分词 → 原始文本位置）
- 构建生产级 NLP 流水线
- 需要高效地对大型语料库进行分词

**性能**：
- **速度**：在 CPU 上分词 1GB 文本 <20 秒
- **实现**：Rust 核心，带有 Python/Node.js 绑定
- **效率**：比纯 Python 实现快 10-100 倍

**使用替代方案**：
- **SentencePiece**：语言无关，被 T5/ALBERT 使用
- **tiktoken**：OpenAI 的 GPT 模型 BPE 分词器
- **transformers AutoTokenizer**：仅加载预训练模型（内部使用此库）

## 快速开始

### 安装

```bash
# 安装 tokenizers
pip install tokenizers

# 包含 transformers 集成
pip install tokenizers transformers
```

### 加载预训练分词器

```python
from tokenizers import Tokenizer

# 从 HuggingFace Hub 加载
tokenizer = Tokenizer.from_pretrained("bert-base-uncased")

# 编码文本
output = tokenizer.encode("Hello, how are you?")
print(output.tokens)  # ['hello', ',', 'how', 'are', 'you', '?']
print(output.ids)     # [7592, 1010, 2129, 2024, 2017, 1029]

# 解码回原文
text = tokenizer.decode(output.ids)
print(text)  # "hello, how are you?"
```

### 训练自定义 BPE 分词器

```python
from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.trainers import BpeTrainer
from tokenizers.pre_tokenizers import Whitespace

# 使用 BPE 模型初始化分词器
tokenizer = Tokenizer(BPE(unk_token="[UNK]"))
tokenizer.pre_tokenizer = Whitespace()

# 配置训练器
trainer = BpeTrainer(
    vocab_size=30000,
    special_tokens=["[UNK]", "[CLS]", "[SEP]", "[PAD]", "[MASK]"],
    min_frequency=2
)

# 在文件上训练
files = ["train.txt", "validation.txt"]
tokenizer.train(files, trainer)

# 保存
tokenizer.save("my-tokenizer.json")
```

**训练时间**：100MB 语料库约 1-2 分钟，1GB 语料库约 10-20 分钟

### 批量编码与填充

```python
# 启用填充
tokenizer.enable_padding(pad_id=3, pad_token="[PAD]")

# 编码批次
texts = ["Hello world", "This is a longer sentence"]
encodings = tokenizer.encode_batch(texts)

for encoding in encodings:
    print(encoding.ids)
# [101, 7592, 2088, 102, 3, 3, 3]
# [101, 2023, 2003, 1037, 2936, 6251, 102]
```

## 分词算法

### BPE（字节对编码）

**工作原理**：
1. 从字符级词汇表开始
2. 找到最频繁的字符对
3. 合并为新分词，添加到词汇表
4. 重复直到达到词汇表大小

**被以下模型使用**：GPT-2、GPT-3、RoBERTa、BART、DeBERTa

```python
from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.trainers import BpeTrainer
from tokenizers.pre_tokenizers import ByteLevel

tokenizer = Tokenizer(BPE(unk_token=""))
tokenizer.pre_tokenizer = ByteLevel()

trainer = BpeTrainer(
    vocab_size=50257,
    special_tokens=[""],
    min_frequency=2
)

tokenizer.train(files=["data.txt"], trainer=trainer)
```

**优点**：
- 很好地处理 OOV 词（分解为子词）
- 灵活的词汇表大小
- 适用于形态丰富的语言

**权衡**：
- 分词依赖于合并顺序
- 可能会意外拆分常见词

### WordPiece

**工作原理**：
1. 从字符词汇表开始
2. 对合并对进行评分：`frequency(pair) / (frequency(first) × frequency(second))`
3. 合并得分最高的对
4. 重复直到达到词汇表大小

**被以下模型使用**：BERT、DistilBERT、MobileBERT

```python
from tokenizers import Tokenizer
from tokenizers.models import WordPiece
from tokenizers.trainers import WordPieceTrainer
from tokenizers.pre_tokenizers import Whitespace
from tokenizers.normalizers import BertNormalizer

tokenizer = Tokenizer(WordPiece(unk_token="[UNK]"))
tokenizer.normalizer = BertNormalizer(lowercase=True)
tokenizer.pre_tokenizer = Whitespace()

trainer = WordPieceTrainer(
    vocab_size=30522,
    special_tokens=["[UNK]", "[CLS]", "[SEP]", "[PAD]", "[MASK]"],
    continuing_subword_prefix="##"
)

tokenizer.train(files=["corpus.txt"], trainer=trainer)
```

**优点**：
- 优先考虑有意义的合并（高分 = 语义相关）
- 在 BERT 中成功使用（最先进的成果）

**权衡**：
- 如果没有子词匹配，未知词将变为 `[UNK]`
- 保存词汇表，而不是合并规则（文件更大）

### Unigram

**工作原理**：
1. 从大型词汇表开始（所有子字符串）
2. 计算当前词汇表下语料库的损失
3. 移除对损失影响最小的分词
4. 重复直到达到词汇表大小

**被以下模型使用**：ALBERT、T5、mBART、XLNet（通过 SentencePiece）

```python
from tokenizers import Tokenizer
from tokenizers.models import Unigram
from tokenizers.trainers import UnigramTrainer

tokenizer = Tokenizer(Unigram())

trainer = UnigramTrainer(
    vocab_size=8000,
    special_tokens=["<unk>", "<s>", "</s>"],
    unk_token="<unk>"
)

tokenizer.train(files=["data.txt"], trainer=trainer)
```

**优点**：
- 概率性（找到最可能的分词）
- 适用于没有词边界的语言
- 处理多样化的语言上下文

**权衡**：
- 训练计算成本高
- 需要调整的超参数更多

## 分词流水线

完整流水线：**标准化 → 预分词 → 模型 → 后处理**

### 标准化

清理和标准化文本：

```python
from tokenizers.normalizers import NFD, StripAccents, Lowercase, Sequence

tokenizer.normalizer = Sequence([
    NFD(),           # Unicode 标准化（分解）
    Lowercase(),     # 转换为小写
    StripAccents()   # 移除重音符号
])

# 输入："Héllo WORLD"
# 标准化后："hello world"
```

**常见标准化器**：
- `NFD`、`NFC`、`NFKD`、`NFKC` - Unicode 标准化形式
- `Lowercase()` - 转换为小写
- `StripAccents()` - 移除重音符号（é → e）
- `Strip()` - 移除空白字符
- `Replace(pattern, content)` - 正则表达式替换

### 预分词

将文本拆分为类似词的单元：

```python
from tokenizers.pre_tokenizers import Whitespace, Punctuation, Sequence, ByteLevel

# 在空白字符和标点符号上拆分
tokenizer.pre_tokenizer = Sequence([
    Whitespace(),
    Punctuation()
])

# 输入："Hello, world!"
# 预分词后：["Hello", ",", "world", "!"]
```

**常见预分词器**：
- `Whitespace()` - 在空格、制表符、换行符上拆分
- `ByteLevel()` - GPT-2 风格的字节级拆分
- `Punctuation()` - 隔离标点符号
- `Digits(individual_digits=True)` - 单独拆分数字
- `Metaspace()` - 用 ▁ 替换空格（SentencePiece 风格）

### 后处理

为模型输入添加特殊分词：

```python
from tokenizers.processors import TemplateProcessing

# BERT 风格：[CLS] 句子 [SEP]
tokenizer.post_processor = TemplateProcessing(
    single="[CLS] $A [SEP]",
    pair="[CLS] $A [SEP] $B [SEP]",
    special_tokens=[
        ("[CLS]", 1),
        ("[SEP]", 2),
    ],
)
```

**常见模式**：
```python
# GPT-2：句子 
TemplateProcessing(
    single="$A ",
    special_tokens=[("", 50256)]
)

# RoBERTa：<s> 句子 </s>
TemplateProcessing(
    single="<s> $A </s>",
    pair="<s> $A </s> </s> $B </s>",
    special_tokens=[("<s>", 0), ("</s>", 2)]
)
```

## 对齐跟踪

跟踪原始文本中的分词位置：

```python
output = tokenizer.encode("Hello, world!")

# 获取分词偏移量
for token, offset in zip(output.tokens, output.offsets):
    start, end = offset
    print(f"{token:10} → [{start:2}, {end:2}): {text[start:end]!r}")

# 输出：
# hello      → [ 0,  5): 'Hello'
# ,          → [ 5,  6): ','
# world      → [ 7, 12): 'world'
# !          → [12, 13): '!'
```

**用例**：
- 命名实体识别（将预测映射回文本）
- 问答（提取答案跨度）
- 分词分类（将标签与原始位置对齐）

## 与 transformers 集成

### 使用 AutoTokenizer 加载

```python
from transformers import AutoTokenizer

# AutoTokenizer 自动使用快速分词器
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

# 检查是否使用快速分词器
print(tokenizer.is_fast)  # True

# 访问底层 tokenizers.Tokenizer
fast_tokenizer = tokenizer.backend_tokenizer
print(type(fast_tokenizer))  # <class 'tokenizers.Tokenizer'>
```

### 将自定义分词器转换为 transformers

```python
from tokenizers import Tokenizer
from transformers import PreTrainedTokenizerFast

# 训练自定义分词器
tokenizer = Tokenizer(BPE())
# ... 训练分词器 ...
tokenizer.save("my-tokenizer.json")

# 包装为 transformers
transformers_tokenizer = PreTrainedTokenizerFast(
    tokenizer_file="my-tokenizer.json",
    unk_token="[UNK]",
    pad_token="[PAD]",
    cls_token="[CLS]",
    sep_token="[SEP]",
    mask_token="[MASK]"
)

# 像使用任何 transformers 分词器一样使用
outputs = transformers_tokenizer(
    "Hello world",
    padding=True,
    truncation=True,
    max_length=512,
    return_tensors="pt"
)
```

## 常见模式

### 从迭代器训练（大型数据集）

```python
from datasets import load_dataset

# 加载数据集
dataset = load_dataset("wikitext", "wikitext-103-raw-v1", split="train")

# 创建批处理迭代器
def batch_iterator(batch_size=1000):
    for i in range(0, len(dataset), batch_size):
        yield dataset[i:i + batch_size]["text"]

# 训练分词器
tokenizer.train_from_iterator(
    batch_iterator(),
    trainer=trainer,
    length=len(dataset)  # 用于进度条
)
```

**性能**：处理 1GB 数据约需 10-20 分钟

### 启用截断和填充

```python
# 启用截断
tokenizer.enable_truncation(max_length=512)

# 启用填充
tokenizer.enable_padding(
    pad_id=tokenizer.token_to_id("[PAD]"),
    pad_token="[PAD]",
    length=512  # 固定长度，或 None 表示使用批次最大长度
)

# 同时使用截断和填充进行编码
output = tokenizer.encode("This is a long sentence that will be truncated...")
print(len(output.ids))  # 512
```

### 多进程处理

```python
from tokenizers import Tokenizer
from multiprocessing import Pool

# 加载分词器
tokenizer = Tokenizer.from_file("tokenizer.json")

def encode_batch(texts):
    return tokenizer.encode_batch(texts)

# 并行处理大型语料库
with Pool(8) as pool:
    # 将语料库分割成块
    chunk_size = 1000
    chunks = [corpus[i:i+chunk_size] for i in range(0, len(corpus), chunk_size)]

    # 并行编码
    results = pool.map(encode_batch, chunks)
```

**加速比**：8 核 CPU 下可达 5-8 倍

## 性能基准

### 训练速度

| 语料库大小 | BPE（3万词表） | WordPiece（3万） | Unigram（8千） |
|-------------|-----------------|-----------------|--------------|
| 10 MB       | 15 秒          | 18 秒          | 25 秒       |
| 100 MB      | 1.5 分钟         | 2 分钟           | 4 分钟        |
| 1 GB        | 15 分钟          | 20 分钟          | 40 分钟       |

**硬件**：16 核 CPU，测试基于英文维基百科

### 分词速度

| 实现方式       | 1 GB 语料库 | 吞吐量         |
|----------------|-------------|---------------|
| 纯 Python      | ~20 分钟     | ~50 MB/分钟   |
| HF Tokenizers  | ~15 秒       | ~4 GB/分钟    |
| **加速比**     | **80×**     | **80×**       |

**测试**：英文文本，平均句子长度 20 词

### 内存使用

| 任务                    | 内存占用  |
|-------------------------|---------|
| 加载分词器              | ~10 MB  |
| 训练 BPE（3万词表）     | ~200 MB |
| 编码 100 万句子         | ~500 MB |

## 支持的模型

可通过 `from_pretrained()` 加载的预训练分词器：

**BERT 系列**：
- `bert-base-uncased`、`bert-large-cased`
- `distilbert-base-uncased`
- `roberta-base`、`roberta-large`

**GPT 系列**：
- `gpt2`、`gpt2-medium`、`gpt2-large`
- `distilgpt2`

**T5 系列**：
- `t5-small`、`t5-base`、`t5-large`
- `google/flan-t5-xxl`

**其他**：
- `facebook/bart-base`、`facebook/mbart-large-cc25`
- `albert-base-v2`、`albert-xlarge-v2`
- `xlm-roberta-base`、`xlm-roberta-large`

浏览全部：https://huggingface.co/models?library=tokenizers

## 参考资料

- **[训练指南](https://github.com/NousResearch/hermes-智能体/blob/main/optional-skills/mlops/huggingface-tokenizers/references/training.md)** - 训练自定义分词器、配置训练器、处理大型数据集
- **[算法详解](https://github.com/NousResearch/hermes-智能体/blob/main/optional-skills/mlops/huggingface-tokenizers/references/algorithms.md)** - BPE、WordPiece、Unigram 详细解释
- **[流水线组件](https://github.com/NousResearch/hermes-智能体/blob/main/optional-skills/mlops/huggingface-tokenizers/references/pipeline.md)** - 标准化器、预分词器、后处理器、解码器
- **[Transformers 集成](https://github.com/NousResearch/hermes-智能体/blob/main/optional-skills/mlops/huggingface-tokenizers/references/integration.md)** - AutoTokenizer、PreTrainedTokenizerFast、特殊词元

## 资源

- **文档**：https://huggingface.co/docs/tokenizers
- **GitHub**：https://github.com/huggingface/tokenizers ⭐ 9,000+
- **版本**：0.20.0+
- **课程**：https://huggingface.co/learn/nlp-course/chapter6/1
- **论文**：BPE（Sennrich 等，2016）、WordPiece（Schuster & Nakajima，2012）