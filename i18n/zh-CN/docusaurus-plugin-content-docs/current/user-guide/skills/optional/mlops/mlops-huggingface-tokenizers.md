---
title: "Huggingface 分词器 — 面向研究与生产的优化快速分词器"
sidebar_label: "Huggingface 分词器"
description: "面向研究与生产的优化快速分词器"
---

{/* 本页面由网站脚本 `website/scripts/generate-skill-docs.py` 从技能的 `SKILL.md` 文件自动生成。请编辑源文件 `SKILL.md`，而非本页面。 */}

# Huggingface 分词器

面向研究与生产的优化快速分词器。基于 Rust 的实现可在 &lt;20 秒内处理 1GB 文本。支持 BPE、WordPiece 和 Unigram 算法。可训练自定义词表、跟踪对齐关系、处理填充/截断。与 transformers 库无缝集成。适用于需要高性能分词或自定义分词器训练的场景。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/mlops/huggingface-tokenizers` 安装 |
| 路径 | `optional-skills/mlops/huggingface-tokenizers` |
| 版本 | `1.0.0` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖 | `tokenizers`, `transformers`, `datasets` |
| 平台 | linux, macos, windows |
| 标签 | `分词`, `HuggingFace`, `BPE`, `WordPiece`, `Unigram`, `快速分词`, `Rust`, `自定义分词器`, `对齐跟踪`, `生产环境` |

# HuggingFace Tokenizers - 面向 NLP 的快速分词器

具备 Rust 性能和 Python 易用性的快速、生产级分词器。

## 何时使用 HuggingFace Tokenizers

**在以下情况下使用 HuggingFace Tokenizers：**
- 需要极快的分词速度（每 GB 文本 &lt;20 秒）
- 从零开始训练自定义分词器
- 需要对齐跟踪（分词 → 原始文本位置）
- 构建生产级 NLP 管道
- 需要高效地对大型语料库进行分词

**性能**：
- **速度**：在 CPU 上对 1GB 文本进行分词 &lt;20 秒
- **实现**：Rust 核心，带 Python/Node.js 绑定
- **效率**：比纯 Python 实现快 10-100 倍

**请改用替代方案**：
- **SentencePiece**：语言无关，被 T5/ALBERT 使用
- **tiktoken**：OpenAI 针对 GPT 模型的 BPE 分词器
- **transformers AutoTokenizer**：仅用于加载预训练模型（内部使用本库）

## 快速开始

### 安装

```bash
# 安装分词器
pip install tokenizers

# 集成 transformers
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

# 解码回文本
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

**训练时间**：100MB 语料库约 1-2 分钟，1GB 约 10-20 分钟

### 带填充的批量编码

```python
# 启用填充
tokenizer.enable_padding(pad_id=3, pad_token="[PAD]")

# 批量编码
texts = ["Hello world", "This is a longer sentence"]
encodings = tokenizer.encode_batch(texts)

for encoding in encodings:
    print(encoding.ids)
# [101, 7592, 2088, 102, 3, 3, 3]
# [101, 2023, 2003, 1037, 2936, 6251, 102]
```

## 分词算法

### BPE (字节对编码)

**工作原理**：
1. 从字符级词汇表开始
2. 找到最频繁的字符对
3. 将其合并为新标记，添加到词汇表
4. 重复直到达到词汇表大小

**使用者**：GPT-2, GPT-3, RoBERTa, BART, DeBERTa

```python
from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.trainers import BpeTrainer
from tokenizers.pre_tokenizers import ByteLevel

tokenizer = Tokenizer(BPE(unk_token="

---
title: Hugging Face Tokenizers
description: A library providing an implementation of today's most used tokenizers, with a focus on performance and versatility.
slug: /tokenizers
sidebar_position: 2
---

# Hugging Face Tokenizers

一个提供当今最常用分词器实现的库，注重性能和多功能性。

## 核心特性

- ⚡ **快速**: 在 Rust 中实现的分词算法，训练和分词速度极快。
- 🔧 **多功能**: 提供多种分词算法（BPE、WordPiece、Unigram）。
- 📦 **易用**: 简单的 API 用于训练、保存和加载分词器。
- 🔗 **集成**: 与 🤗 Transformers 无缝集成。

## 快速入门

### 安装

```bash
pip install tokenizers
```

### 基础用法

```python
from tokenizers import Tokenizer
from tokenizers.models import BPE

# 从预训练模型加载
tokenizer = Tokenizer.from_pretrained("bert-base-uncased")

# 编码文本
output = tokenizer.encode("Hello, world!")

print(output.tokens)
# ['[CLS]', 'hello', ',', 'world', '!', '[SEP]']
print(output.ids)
# [101, 7592, 1010, 2088, 999, 102]
```

### 训练自定义分词器

```python
from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.trainers import BpeTrainer
from tokenizers.pre_tokenizers import Whitespace

# 初始化空分词器
tokenizer = Tokenizer(BPE(unk_token="[UNK]"))
tokenizer.pre_tokenizer = Whitespace()

# 配置训练器
trainer = BpeTrainer(
    special_tokens=["[UNK]", "[CLS]", "[SEP]", "[PAD]", "[MASK]"],
    vocab_size=30000,
    min_frequency=2
)

# 训练
files = ["data/text1.txt", "data/text2.txt"]
tokenizer.train(files, trainer)

# 保存
tokenizer.save("custom-tokenizer.json")

# 之后加载
tokenizer = Tokenizer.from_file("custom-tokenizer.json")
```

## 分词算法

### BPE (Byte Pair Encoding)

- **工作原理**: 从单个字符开始，迭代地合并最常见的符号对。
- **用于**: GPT-2, RoBERTa, BART。
- **优点**: 处理未知词效果好，平衡词汇量和表达能力。

```python
from tokenizers.models import BPE

# 初始化 BPE 模型
bpe = BPE(unk_token="[UNK]")

# 或从文件加载
bpe = BPE.from_file("vocab.json", "merges.txt")
```

### WordPiece

- **工作原理**: 类似 BPE，但选择合并时使用基于可能性的评分。
- **用于**: BERT, DistilBERT。
- **优点**: 在子词分割方面更优化。

```python
from tokenizers.models import WordPiece

wp = WordPiece(unk_token="[UNK]")
```

### Unigram

- **工作原理**: 从大词汇表开始，迭代地删除对整体似然性影响最小的 token。
- **用于**: T5, ALBERT。
- **优点**: 概率模型，可输出多个可能的分词结果。

```python
from tokenizers.models import Unigram

uni = Unigram()
```

## 处理流程

每个分词器由多个组件组成：

1. **归一化器 (Normalizer)**: 清理文本（小写、去除重音等）。
2. **预分词器 (Pre-tokenizer)**: 将文本拆分为单词。
3. **模型 (Model)**: 核心分词算法。
4. **后处理器 (Post-processor)**: 添加特殊 token（如 `[CLS]`, `[SEP]`）。
5. **解码器 (Decoder)**: 将 token ID 转换回文本。

```python
from tokenizers import Tokenizer
from tokenizers.normalizers import NFD, Lowercase, StripAccents, Sequence
from tokenizers.pre_tokenizers import Whitespace
from tokenizers.models import WordPiece
from tokenizers.processors import TemplateProcessing
from tokenizers.decoders import WordPiece as WordPieceDecoder

# 定义完整流程
tokenizer = Tokenizer(WordPiece(unk_token="[UNK]"))
tokenizer.normalizer = Sequence([NFD(), Lowercase(), StripAccents()])
tokenizer.pre_tokenizer = Whitespace()
tokenizer.post_processor = TemplateProcessing(
    single="[CLS] $A [SEP]",
    pair="[CLS] $A [SEP] $B:1 [SEP]:1",
    special_tokens=[
        ("[CLS]", 1),
        ("[SEP]", 2),
    ],
)
tokenizer.decoder = WordPieceDecoder(prefix="##")
```

## 常见模式

### 从迭代器训练（大数据集）

```python
from datasets import load_dataset

# 加载数据集
dataset = load_dataset("wikitext", "wikitext-103-raw-v1", split="train")

# 创建批量迭代器
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

**性能**: 处理 1GB 数据约需 10-20 分钟

### 启用截断和填充

```python
# 启用截断
tokenizer.enable_truncation(max_length=512)

# 启用填充
tokenizer.enable_padding(
    pad_id=tokenizer.token_to_id("[PAD]"),
    pad_token="[PAD]",
    length=512  # 固定长度，或设为 None 使用批次最大长度
)

# 使用两者编码
output = tokenizer.encode("This is a long sentence that will be truncated...")
print(len(output.ids))  # 512
```

### 多处理

```python
from tokenizers import Tokenizer
from multiprocessing import Pool

# 加载分词器
tokenizer = Tokenizer.from_file("tokenizer.json")

def encode_batch(texts):
    return tokenizer.encode_batch(texts)

# 并行处理大型语料库
with Pool(8) as pool:
    # 将语料库拆分为块
    chunk_size = 1000
    chunks = [corpus[i:i+chunk_size] for i in range(0, len(corpus), chunk_size)]

    # 并行编码
    results = pool.map(encode_batch, chunks)
```

**加速比**: 8 核可达 5-8 倍

## 性能基准

### 训练速度

| 语料库大小 | BPE (30k 词表) | WordPiece (30k) | Unigram (8k) |
|-------------|-----------------|-----------------|--------------|
| 10 MB       | 15 秒          | 18 秒          | 25 秒       |
| 100 MB      | 1.5 分钟         | 2 分钟           | 4 分钟        |
| 1 GB        | 15 分钟          | 20 分钟          | 40 分钟       |

**硬件**: 16 核 CPU，在英文维基百科上测试

### 分词速度

| 实现方式 | 1 GB 语料库 | 吞吐量    |
|----------------|-------------|---------------|
| 纯 Python    | ~20 分钟 | ~50 MB/分钟    |
| HF Tokenizers  | ~15 秒 | ~4 GB/分钟     |
| **加速比**    | **80×**     | **80×**       |

**测试**: 英文文本，平均句长 20 词

### 内存使用

| 任务                    | 内存  |
|-------------------------|---------|
| 加载分词器          | ~10 MB  |
| 训练 BPE (30k 词表)   | ~200 MB |
| 编码 100 万个句子     | ~500 MB |

## 支持的模型

预训练分词器可通过 `from_pretrained()` 获得：

**BERT 系列**:
- `bert-base-uncased`, `bert-large-cased`
- `distilbert-base-uncased`
- `roberta-base`, `roberta-large`

**GPT 系列**:
- `gpt2`, `gpt2-medium`, `gpt2-large`
- `distilgpt2`

**T5 系列**:
- `t5-small`, `t5-base`, `t5-large`
- `google/flan-t5-xxl`

**其他**:
- `facebook/bart-base`, `facebook/mbart-large-cc25`
- `albert-base-v2`, `albert-xlarge-v2`
- `xlm-roberta-base`, `xlm-roberta-large`

浏览全部: https://huggingface.co/models?library=tokenizers

## 参考资料

- **[训练指南](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/mlops/huggingface-tokenizers/references/training.md)** - 训练自定义分词器、配置训练器、处理大数据集
- **[算法深入解析](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/mlops/huggingface-tokenizers/references/algorithms.md)** - BPE、WordPiece、Unigram 详细解释
- **[流水线组件](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/mlops/huggingface-tokenizers/references/pipeline.md)** - 归一化器、预分词器、后处理器、解码器
- **[Transformers 集成](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/mlops/huggingface-tokenizers/references/integration.md)** - AutoTokenizer, PreTrainedTokenizerFast, 特殊 token

## 资源

- **文档**: https://huggingface.co/docs/tokenizers
- **GitHub**: https://github.com/huggingface/tokenizers ⭐ 9,000+
- **版本**: 0.20.0+
- **课程**: https://huggingface.co/learn/nlp-course/chapter6/1
- **论文**: BPE (Sennrich et al., 2016), WordPiece (Schuster & Nakajima, 2012)