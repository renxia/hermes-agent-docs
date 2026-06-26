---
title: "Qmd"
sidebar_label: "Qmd"
description: "使用 qmd——一个具有 BM25、向量搜索和 LLM 重排的混合检索引擎，在本地搜索个人知识库、笔记、文档和会议记录"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Qmd

使用 qmd——一个具有 BM25、向量搜索和 LLM 重排的混合检索引擎，在本地搜索个人知识库、笔记、文档和会议记录。支持 CLI 和 MCP 集成。

## Skill metadata

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/research/qmd` 安装 |
| Path | `optional-skills/research/qmd` |
| Version | `1.0.0` |
| Author | Hermes 智能体 + Teknium |
| License | MIT |
| Platforms | macos, linux |
| Tags | `Search`, `Knowledge-Base`, `RAG`, `Notes`, `MCP`, `Local-AI` |
| Related skills | [`obsidian`](/docs/user-guide/skills/bundled/note-taking/note-taking-obsidian), `native-mcp`, [`arxiv`](/docs/user-guide/skills/bundled/research/research-arxiv) |

## 关键路径和配置

```
~/.hermes/config.yaml       主配置文件
~/.hermes/.env              API密钥和秘密信息（如果设置了$HERMES_HOME）
```

# QMD — 查询标记文档

本地设备上的搜索引擎，用于个人知识库。它索引Markdown笔记、会议记录、文档和任何文本文件，然后提供混合搜索功能，结合关键词匹配、语义理解和LLM驱动的重排序——所有功能均在本地运行，无需云依赖。

由 [Tobi Lütke](https://github.com/tobi/qmd) 创建。MIT许可。

## 何时使用

- 用户要求搜索他们的笔记、文档、知识库或会议记录
- 用户想在一个大型的Markdown/文本文件集合中查找内容
- 用户需要语义搜索（“查找关于X概念的笔记”），而不仅仅是关键词grep
- 用户已经设置了qmd集合，并希望查询它们
- 用户要求设置本地知识库或文档搜索系统
- 关键词：“搜索我的笔记”、“在我的文档中查找”、“知识库”、“qmd”

## 先决条件

### Node.js >= 22 (必需)

```bash
# 检查版本
node --version  # 必须大于等于 22

# macOS — 通过 Homebrew 安装或升级
brew install node@22

# Linux — 使用 NodeSource 或 nvm
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
# 或者使用 nvm:
nvm install 22 && nvm use 22
```

### SQLite 及扩展支持 (仅限macOS)

macOS系统自带的SQLite不支持加载扩展。请通过Homebrew安装：

```bash
brew install sqlite
```

### 安装 qmd

```bash
npm install -g @tobilu/qmd
# 或者使用 Bun:
bun install -g @tobilu/qmd
```

首次运行时会自动下载3个本地GGUF模型（总计约2GB）：

| 模型 | 用途 | 大小 |
|-------|---------|------|
| embeddinggemma-300M-Q8_0 | 向量嵌入 | ~300MB |
| qwen3-reranker-0.6b-q8_0 | 结果重排序 | ~640MB |
| qmd-query-expansion-1.7B | 查询扩展 | ~1.1GB |

### 验证安装

```bash
qmd --version
qmd status
```

## 快速参考

| 命令 | 功能描述 | 速度 |
|---------|-------------|-------|
| `qmd search "query"` | BM25关键词搜索（不使用模型） | ~0.2s |
| `qmd vsearch "query"` | 语义向量搜索（1个模型） | ~3s |
| `qmd query "query"` | 混合搜索 + 重排序（所有3个模型） | ~2-3s预热，~19s冷启动 |
| `qmd get <docid>` | 检索完整文档内容 | 即时 |
| `qmd multi-get "glob"` | 批量检索文件 | 即时 |
| `qmd collection add <path> --name <n>` | 添加一个目录作为集合 | 即时 |
| `qmd context add <path> "description"` | 添加上下文元数据以提高检索质量 | 即时 |
| `qmd embed` | 生成/更新向量嵌入 | 视情况而定 |
| `qmd status` | 显示索引健康状况和集合信息 | 即时 |
| `qmd mcp` | 启动MCP服务器（stdio） | 持久化 |
| `qmd mcp --http --daemon` | 启动MCP服务器（HTTP，预热模型） | 持久化 |

## 设置工作流程

### 1. 添加集合 (Collections)

将qmd指向包含您文档的目录：

```bash
# 添加笔记目录
qmd collection add ~/notes --name notes

# 添加项目文档
qmd collection add ~/projects/myproject/docs --name project-docs

# 添加会议记录
qmd collection add ~/meetings --name meetings

# 列出所有集合
qmd collection list
```

### 2. 添加上下文描述

上下文元数据有助于搜索引擎理解每个集合包含的内容。这能显著提高检索质量：

```bash
qmd context add qmd://notes "个人笔记、想法和日记条目"
qmd context add qmd://project-docs "主项目的技术文档"
qmd context add qmd://meetings "团队同步会议记录和待办事项"
```

### 3. 生成嵌入 (Embeddings)

```bash
qmd embed
```

这将处理所有集合中的所有文档并生成向量嵌入。在添加新文档或新集合后重新运行此命令。

### 4. 验证

```bash
qmd status   # 显示索引健康状况、集合统计信息、模型信息
```

## 搜索模式

### 快速关键词搜索 (BM25)

适用于：精确术语、代码标识符、名称、已知短语。
不加载任何模型——结果几乎是即时的。

```bash
qmd search "authentication middleware"
qmd search "handleError async"
```

### 语义向量搜索

适用于：自然语言问题、概念性查询。
会加载嵌入模型（首次查询约3秒）。

```bash
qmd vsearch "rate limiter如何处理突发流量"
qmd vsearch "改进入职流程的想法"
```

### 带重排序的混合搜索 (最佳质量)

适用于：质量至关重要的重要查询。
使用所有3个模型——查询扩展、并行BM25+向量、重排序。

```bash
qmd query "关于数据库迁移做出了哪些决定"
```

### 结构化多模式查询

在单个查询中结合不同的搜索类型以提高精度：

```bash
# BM25用于精确术语 + 向量用于概念
qmd query $'lex: rate limiter\nvec: how does throttling work under load'

# 带查询扩展
qmd query $'expand: database migration plan\nlex: "schema change"'
```

### 查询语法 (lex/BM25模式)

| 语法 | 效果 | 示例 |
|--------|--------|---------|
| `term` | 前缀匹配 | `perf` 匹配 "performance" |
| `"phrase"` | 精确短语 | `"rate limiter"` |
| `-term` | 排除术语 | `performance -sports` |

### HyDE (假设性文档嵌入)

对于复杂的主题，请写出您期望的答案是什么样的：

```bash
qmd query $'hyde: 迁移计划包括三个阶段。首先，我们添加新列而不删除旧列。然后我们回填数据。最后我们切换并移除旧列。'
```

### 限定到集合 (Scoping to Collections)

```bash
qmd search "query" --collection notes
qmd query "query" --collection project-docs
```

### 输出格式

```bash
qmd search "query" --json        # JSON输出（最适合解析）
qmd search "query" --limit 5     # 限制结果数量
qmd get "#abc123"                # 按文档ID获取
qmd get "path/to/file.md"       # 按文件路径获取
qmd get "file.md:50" -l 100     # 获取特定行范围
qmd multi-get "journals/*.md" --json  # 按glob批量检索
```

## MCP 集成 (推荐)

qmd 提供了一个MCP服务器，通过原生的MCP客户端直接将搜索工具提供给Hermes智能体。这是首选的集成方式——配置完成后，智能体会自动获得qmd工具，而无需每次都加载此技能。

### 选项 A: Stdio模式（简单）

添加到 `~/.hermes/config.yaml`：

```yaml
mcp_servers:
  qmd:
    command: "qmd"
    args: ["mcp"]
    timeout: 30
    connect_timeout: 45
```

这注册了工具：`mcp_qmd_search`、`mcp_qmd_vsearch`、`mcp_qmd_deep_search`、`mcp_qmd_get`、`mcp_qmd_status`。

**权衡:** 模型在首次搜索调用时加载（约19秒冷启动），然后保持会话的温暖状态。对于偶尔使用的情况是可接受的。

### 选项 B: HTTP守护进程模式 (快速，推荐用于重度使用)

单独启动qmd守护进程——它将模型保存在内存中：

```bash
# 启动守护进程（跨智能体重启保持持久）
qmd mcp --http --daemon

# 默认在 http://localhost:8181 上运行
```

然后配置Hermes智能体通过HTTP连接：

```yaml
mcp_servers:
  qmd:
    url: "http://localhost:8181/mcp"
    timeout: 30
```

**权衡:** 运行时占用约2GB RAM，但每次查询都非常快（~2-3秒）。最适合经常进行搜索的用户。

### 保持守护进程运行

#### macOS (launchd)

```bash
cat > ~/Library/LaunchAgents/com.qmd.daemon.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.qmd.daemon</string>
  <key>ProgramArguments</key>
  <array>
    <string>qmd</string>
    <string>mcp</string>
    <string>--http</string>
    <string>--daemon</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/qmd-daemon.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/qmd-daemon.log</string>
</dict>
</plist>
EOF

launchctl load ~/Library/LaunchAgents/com.qmd.daemon.plist
```

#### Linux (systemd用户服务)

```bash
mkdir -p ~/.config/systemd/user

cat > ~/.config/systemd/user/qmd-daemon.service << 'EOF'
[Unit]
Description=QMD MCP Daemon
After=network.target

[Service]
ExecStart=qmd mcp --http --daemon
Restart=on-failure
RestartSec=10
Environment=PATH=/usr/local/bin:/usr/bin:/bin

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now qmd-daemon
systemctl --user status qmd-daemon
```

### MCP 工具参考

连接后，这些工具以 `mcp_qmd_*` 的形式可用：

| MCP 工具 | 对应命令 | 描述 |
|----------|---------|-------------|
| `mcp_qmd_search` | `qmd search` | BM25关键词搜索 |
| `mcp_qmd_vsearch` | `qmd vsearch` | 语义向量搜索 |
| `mcp_qmd_deep_search` | `qmd query` | 混合搜索 + 重排序 |
| `mcp_qmd_get` | `qmd get` | 按ID或路径检索文档 |
| `mcp_qmd_status` | `qmd status` | 索引健康状况和统计信息 |

MCP工具接受结构化JSON查询进行多模式搜索：

```json
{
  "searches": [
    {"type": "lex", "query": "authentication middleware"},
    {"type": "vec", "query": "how user login is verified"}
  ],
  "collections": ["project-docs"],
  "limit": 10
}
```

## CLI 使用方法 (不使用MCP)

当未配置MCP时，请通过终端直接使用qmd：

```
terminal(command="qmd query 'what was decided about the API redesign' --json", timeout=30)
```

对于设置和管理任务，始终使用终端：

```
terminal(command="qmd collection add ~/Documents/notes --name notes")
terminal(command="qmd context add qmd://notes 'Personal research notes and ideas'")
terminal(command="qmd embed")
terminal(command="qmd status")
```

## 搜索流程工作原理

了解内部机制有助于选择正确的搜索模式：

1. **查询扩展** — 一个经过微调的1.7B模型生成2个替代查询。原始查询在融合中获得2倍权重。
2. **并行检索** — BM25 (SQLite FTS5) 和向量搜索同时对所有查询变体进行运行。
3. **RRF 融合** — Reciprocal Rank Fusion (k=60) 合并结果。顶级排名奖励：#1获得+0.05，#2-3获得+0.02。
4. **LLM 重排序** — qwen3-reranker 对前30个候选者进行评分（0.0-1.0）。
5. **位置感知混合** — 排名1-3：75%检索 / 25%重排序。排名4-10：60/40。排名11+：40/60（更信任重排序以覆盖长尾）。

**智能分块 (Smart Chunking):** 文档在自然断点（标题、代码块、空行）处分割，目标是约900个token，有15%的重叠。代码块绝不会被中途分割。

## 最佳实践

1. **始终添加上下文描述** — `qmd context add` 能极大地提高检索准确性。请描述每个集合包含的内容。
2. **添加文档后重新生成嵌入** — 当集合中添加新文件时，必须重新运行 `qmd embed`。
3. **使用 `qmd search` 以获得速度** — 当您需要快速关键词查找（代码标识符、精确名称）时，BM25是即时的，无需模型。
4. **使用 `qmd query` 以获得质量** — 当问题是概念性的或用户需要最好的结果时，请使用混合搜索。
5. **优先使用MCP集成** — 配置完成后，智能体将自动获得工具，而无需每次都加载此技能。
6. **对于高频用户，推荐守护进程模式** — 如果用户定期搜索他们的知识库，建议使用HTTP守护进程设置。
7. **结构化搜索中的首次查询权重更高** — 在结合lex和vec时，请将最重要的/最确定的查询放在前面。

## 故障排除

### "首次运行时下载模型"
正常情况 — qmd 在首次使用时会自动下载约 2GB 的 GGUF 模型。这是一个一次性操作。

### 冷启动延迟（~19秒）
当模型未加载到内存中时会发生这种情况。解决方案：
- 使用 HTTP 守护进程模式（`qmd mcp --http --daemon`）来保持热状态
- 在不需要模型时使用 `qmd search`（仅 BM25）
- MCP 标准 I/O 模式在首次搜索时加载模型，并在会话中保持热状态

### macOS: "无法加载扩展"
安装 Homebrew SQLite：`brew install sqlite`
然后确保它在系统 SQLite 之前位于 PATH 中。

### "未找到集合"
运行 `qmd collection add <path> --name <name>` 来添加目录，然后运行 `qmd embed` 进行索引。

### 嵌入模型覆盖（CJK/多语言）
为非英语内容设置 `QMD_EMBED_MODEL` 环境变量：
```bash
export QMD_EMBED_MODEL="your-multilingual-model"
```

## 数据存储

- **Index & vectors:** `~/.cache/qmd/index.sqlite`
- **模型：** 首次运行时自动下载到本地缓存
- **无云依赖** — 所有内容均在本地运行

## 参考资料

- [GitHub: tobi/qmd](https://github.com/tobi/qmd)
- [QMD Changelog](https://github.com/tobi/qmd/blob/main/CHANGELOG.md)