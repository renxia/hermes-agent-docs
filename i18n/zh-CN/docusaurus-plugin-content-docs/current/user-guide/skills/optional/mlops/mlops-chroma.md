---
title: "Chroma — AI 应用开源嵌入数据库"
sidebar_label: "Chroma"
description: "AI 应用开源嵌入数据库"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Chroma

AI 应用开源嵌入数据库。存储嵌入向量和元数据，执行向量和全文搜索，按元数据过滤。简洁的四功能 API。可从笔记本扩展至生产集群。适用于语义搜索、RAG 应用或文档检索。最适合本地开发和开源项目。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/mlops/chroma` 安装 |
| 路径 | `optional-skills/mlops/chroma` |
| 版本 | `1.0.0` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖项 | `chromadb`, `sentence-transformers` |
| 标签 | `RAG`, `Chroma`, `向量数据库`, `嵌入向量`, `语义搜索`, `开源`, `自托管`, `文档检索`, `元数据过滤` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Chroma - 开源嵌入数据库

用于构建带记忆功能的 LLM 应用的 AI 原生数据库。

## 何时使用 Chroma

**在以下情况使用 Chroma：**
- 构建 RAG（检索增强生成）应用
- 需要本地/自托管向量数据库
- 希望使用开源解决方案（Apache 2.0）
- 在笔记本中进行原型设计
- 对文档进行语义搜索
- 存储带元数据的嵌入向量

**指标**：
- **24,300+ GitHub stars**
- **1,900+ forks**
- **v1.3.3**（稳定，每周发布）
- **Apache 2.0 许可证**

**改用其他替代方案**：
- **Pinecone**：托管云服务，自动扩展
- **FAISS**：纯相似性搜索，无元数据
- **Weaviate**：生产级 ML 原生数据库
- **Qdrant**：高性能，基于 Rust

## 快速开始

### 安装

```bash
# Python
pip install chromadb

# JavaScript/TypeScript
npm install chromadb @chroma-core/default-embed
```

### 基本用法（Python）

```python
import chromadb

# 创建客户端
client = chromadb.Client()

# 创建集合
collection = client.create_collection(name="my_collection")

# 添加文档
collection.add(
    documents=["这是文档 1", "这是文档 2"],
    metadatas=[{"source": "doc1"}, {"source": "doc2"}],
    ids=["id1", "id2"]
)

# 查询
results = collection.query(
    query_texts=["关于主题的文档"],
    n_results=2
)

print(results)
```

## 核心操作

### 1. 创建集合

```python
# 简单集合
collection = client.create_collection("my_docs")

# 使用自定义嵌入函数
from chromadb.utils import embedding_functions

openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key="your-key",
    model_name="text-embedding-3-small"
)

collection = client.create_collection(
    name="my_docs",
    embedding_function=openai_ef
)

# 获取现有集合
collection = client.get_collection("my_docs")

# 删除集合
client.delete_collection("my_docs")
```

### 2. 添加文档

```python
# 添加并使用自动生成的 ID
collection.add(
    documents=["文档 1", "文档 2", "文档 3"],
    metadatas=[
        {"source": "web", "category": "tutorial"},
        {"source": "pdf", "page": 5},
        {"source": "api", "timestamp": "2025-01-01"}
    ],
    ids=["id1", "id2", "id3"]
)

# 添加并使用自定义嵌入向量
collection.add(
    embeddings=[[0.1, 0.2, ...], [0.3, 0.4, ...]],
    documents=["文档 1", "文档 2"],
    ids=["id1", "id2"]
)
```

### 3. 查询（相似性搜索）

```python
# 基本查询
results = collection.query(
    query_texts=["机器学习教程"],
    n_results=5
)

# 带过滤器的查询
results = collection.query(
    query_texts=["Python 编程"],
    n_results=3,
    where={"source": "web"}
)

# 带元数据过滤器的查询
results = collection.query(
    query_texts=["高级主题"],
    where={
        "$and": [
            {"category": "tutorial"},
            {"difficulty": {"$gte": 3}}
        ]
    }
)

# 访问结果
print(results["documents"])      # 匹配文档列表
print(results["metadatas"])      # 每个文档的元数据
print(results["distances"])      # 相似性得分
print(results["ids"])            # 文档 ID
```

### 4. 获取文档

```python
# 按 ID 获取
docs = collection.get(
    ids=["id1", "id2"]
)

# 带过滤器的获取
docs = collection.get(
    where={"category": "tutorial"},
    limit=10
)

# 获取所有文档
docs = collection.get()
```

### 5. 更新文档

```python
# 更新文档内容
collection.update(
    ids=["id1"],
    documents=["更新后的内容"],
    metadatas=[{"source": "updated"}]
)
```

### 6. 删除文档

```python
# 按 ID 删除
collection.delete(ids=["id1", "id2"])

# 带过滤器删除
collection.delete(
    where={"source": "outdated"}
)
```

## 持久化存储

```python
# 持久化到磁盘
client = chromadb.PersistentClient(path="./chroma_db")

collection = client.create_collection("my_docs")
collection.add(documents=["文档 1"], ids=["id1"])

# 数据自动持久化
# 稍后使用相同路径重新加载
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_collection("my_docs")
```

## 嵌入函数

### 默认（Sentence Transformers）

```python
# 默认使用 sentence-transformers
collection = client.create_collection("my_docs")
# 默认模型：all-MiniLM-L6-v2
```

### OpenAI

```python
from chromadb.utils import embedding_functions

openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key="your-key",
    model_name="text-embedding-3-small"
)

collection = client.create_collection(
    name="openai_docs",
    embedding_function=openai_ef
)
```

### HuggingFace

```python
huggingface_ef = embedding_functions.HuggingFaceEmbeddingFunction(
    api_key="your-key",
    model_name="sentence-transformers/all-mpnet-base-v2"
)

collection = client.create_collection(
    name="hf_docs",
    embedding_function=huggingface_ef
)
```

### 自定义嵌入函数

```python
from chromadb import Documents, EmbeddingFunction, Embeddings

class MyEmbeddingFunction(EmbeddingFunction):
    def __call__(self, input: Documents) -> Embeddings:
        # 你的嵌入逻辑
        return embeddings

my_ef = MyEmbeddingFunction()
collection = client.create_collection(
    name="custom_docs",
    embedding_function=my_ef
)
```

## 元数据过滤

```python
# 精确匹配
results = collection.query(
    query_texts=["查询"],
    where={"category": "tutorial"}
)

# 比较操作符
results = collection.query(
    query_texts=["查询"],
    where={"page": {"$gt": 10}}  # $gt, $gte, $lt, $lte, $ne
)

# 逻辑操作符
results = collection.query(
    query_texts=["查询"],
    where={
        "$and": [
            {"category": "tutorial"},
            {"difficulty": {"$lte": 3}}
        ]
    }  # 还有：$or
)

# 包含
results = collection.query(
    query_texts=["查询"],
    where={"tags": {"$in": ["python", "ml"]}}
)
```

## LangChain 集成

```python
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 分割文档
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000)
docs = text_splitter.split_documents(documents)

# 创建 Chroma 向量存储
vectorstore = Chroma.from_documents(
    documents=docs,
    embedding=OpenAIEmbeddings(),
    persist_directory="./chroma_db"
)

# 查询
results = vectorstore.similarity_search("机器学习", k=3)

# 作为检索器
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
```

## LlamaIndex 集成

```python
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import VectorStoreIndex, StorageContext
import chromadb

# 初始化 Chroma
db = chromadb.PersistentClient(path="./chroma_db")
collection = db.get_or_create_collection("my_collection")

# 创建向量存储
vector_store = ChromaVectorStore(chroma_collection=collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

# 创建索引
index = VectorStoreIndex.from_documents(
    documents,
    storage_context=storage_context
)

# 查询
query_engine = index.as_query_engine()
response = query_engine.query("什么是机器学习？")
```

## 服务器模式

```python
# 运行 Chroma 服务器
# 终端：chroma run --path ./chroma_db --port 8000

# 连接到服务器
import chromadb
from chromadb.config import Settings

client = chromadb.HttpClient(
    host="localhost",
    port=8000,
    settings=Settings(anonymized_telemetry=False)
)

# 正常使用
collection = client.get_or_create_collection("my_docs")
```

## 最佳实践

1. **使用持久化客户端** — 重启时不丢失数据
2. **添加元数据** — 启用过滤和跟踪
3. **批量操作** — 一次添加多个文档
4. **选择合适的嵌入模型** — 平衡速度/质量
5. **使用过滤器** — 缩小搜索空间
6. **唯一 ID** — 避免冲突
7. **定期备份** — 复制 chroma_db 目录
8. **监控集合大小** — 必要时扩容
9. **测试嵌入函数** — 确保质量
10. **生产环境使用服务器模式** — 更适合多用户

## 性能

| 操作 | 延迟 | 说明 |
|-----------|---------|-------|
| 添加 100 个文档 | ~1-3 秒 | 包含嵌入 |
| 查询（前 10） | ~50-200 毫秒 | 取决于集合大小 |
| 元数据过滤 | ~10-50 毫秒 | 正确索引下速度很快 |

## 资源

- **GitHub**: https://github.com/chroma-core/chroma ⭐ 24,300+
- **文档**: https://docs.trychroma.com
- **Discord**: https://discord.gg/MMeYNTmh3x
- **版本**: 1.3.3+
- **许可证**: Apache 2.0