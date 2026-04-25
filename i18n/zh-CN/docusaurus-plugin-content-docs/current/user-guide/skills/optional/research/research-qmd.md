---
title: "Qmd"
sidebar_label: "Qmd"
description: "使用 qmd 在本地搜索个人知识库、笔记、文档和会议记录——一种结合 BM25、向量搜索和 LLM 重排序的混合检索引擎"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Qmd

使用 qmd 在本地搜索个人知识库、笔记、文档和会议记录——一种结合 BM25、向量搜索和 LLM 重排序的混合检索引擎。支持 CLI 和 MCP 集成。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/research/qmd` 安装 |
| 路径 | `optional-skills/research/qmd` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 + Teknium |
| 许可证 | MIT |
| 平台 | macos, linux |
| 标签 | `搜索`, `知识库`, `RAG`, `笔记`, `MCP`, `本地AI` |
| 相关技能 | [`obsidian`](/docs/user-guide/skills/bundled/note-taking/note-taking-obsidian), [`native-mcp`](/docs/user-guide/skills/bundled/mcp/mcp-native-mcp), [`arxiv`](/docs/user-guide/skills/bundled/research/research-arxiv) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# QMD — 查询标记文档

用于个人知识库的本机设备上搜索引擎。对 Markdown 笔记、会议记录、文档以及任何基于文本的文件建立索引，然后提供结合关键词匹配、语义理解和 LLM 驱动重排序的混合搜索 —— 所有功能均在本地运行，无需依赖云服务。

由 [Tobi Lütke](https://github.com/tobi/qmd) 创建。MIT 许可。

## 何时使用

- 用户要求搜索其笔记、文档、知识库或会议记录
- 用户希望在大量 Markdown/文本文件中查找内容
- 用户希望进行语义搜索（“查找关于 X 概念的笔记”），而不仅仅是关键词 grep
- 用户已设置 qmd 集合并希望查询它们
- 用户要求设置本地知识库或文档搜索系统
- 关键词：“搜索我的笔记”、“在我的文档中查找”、“知识库”、“qmd”

## 先决条件

### Node.js >= 22（必需）

```bash
# 检查版本
node --version  # 必须 >= 22

# macOS — 通过 Homebrew 安装或升级
brew install node@22

# Linux — 使用 NodeSource 或 nvm
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
# 或使用 nvm：
nvm install 22 && nvm use 22
```

### 支持扩展的 SQLite（仅限 macOS）

macOS 系统自带的 SQLite 不支持扩展加载。请通过 Homebrew 安装：

```bash
brew install sqlite
```

### 安装 qmd

```bash
npm install -g @tobilu/qmd
# 或使用 Bun：
bun install -g @tobilu/qmd
```

首次运行时会自动下载 3 个本地 GGUF 模型（总计约 2GB）：

| 模型 | 用途 | 大小 |
|------|------|------|
| embeddinggemma-300M-Q8_0 | 向量嵌入 | ~300MB |
| qwen3-reranker-0.6b-q8_0 | 结果重排序 | ~640MB |
| qmd-query-expansion-1.7B | 查询扩展 | ~1.1GB |

### 验证安装

```bash
qmd --version
qmd status
```

## 快速参考

| 命令 | 功能 | 速度 |
|------|------|------|
| `qmd search "query"` | BM25 关键词搜索（无模型） | ~0.2 秒 |
| `qmd vsearch "query"` | 语义向量搜索（1 个模型） | ~3 秒 |
| `qmd query "query"` | 混合搜索 + 重排序（全部 3 个模型） | 热启动 ~2-3 秒，冷启动 ~19 秒 |
| `qmd get <docid>` | 检索完整文档内容 | 即时 |
| `qmd multi-get "glob"` | 检索多个文件 | 即时 |
| `qmd collection add <path> --name <n>` | 将目录添加为集合 | 即时 |
| `qmd context add <path> "description"` | 添加上下文元数据以改进检索 | 即时 |
| `qmd embed` | 生成/更新向量嵌入 | 视情况而定 |
| `qmd status` | 显示索引健康状况和集合信息 | 即时 |
| `qmd mcp` | 启动 MCP 服务器（stdio） | 持久化 |
| `qmd mcp --http --daemon` | 启动 MCP 服务器（HTTP，热模型） | 持久化 |

## 设置工作流

### 1. 添加集合

将 qmd 指向包含文档的目录：

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

上下文元数据有助于搜索引擎理解每个集合包含的内容。这显著提高了检索质量：

```bash
qmd context add qmd://notes "个人笔记、想法和日记条目"
qmd context add qmd://project-docs "主要项目的技术文档"
qmd context add qmd://meetings "团队同步会议的会议记录和行动项"
```

### 3. 生成嵌入

```bash
qmd embed
```

此操作会处理所有集合中的所有文档并生成向量嵌入。添加新文档或集合后请重新运行。

### 4. 验证

```bash
qmd status   # 显示索引健康状况、集合统计信息、模型信息
```

## 搜索模式

### 快速关键词搜索（BM25）

适用场景：精确术语、代码标识符、名称、已知短语。
不加载模型 —— 近乎即时返回结果。

```bash
qmd search "authentication middleware"
qmd search "handleError async"
```

### 语义向量搜索

适用场景：自然语言问题、概念性查询。
加载嵌入模型（首次查询约 3 秒）。

```bash
qmd vsearch "rate limiter 如何处理突发流量"
qmd vsearch "改进 onboarding 流程的想法"
```

### 混合搜索 + 重排序（最佳质量）

适用场景：对质量要求最高的查询。
使用全部 3 个模型 —— 查询扩展、并行 BM25+向量搜索、重排序。

```bash
qmd query "关于数据库迁移做了哪些决策"
```

### 结构化多模式查询

在单个查询中组合不同类型的搜索以提高精度：

```bash
# BM25 用于精确术语 + 向量用于概念
qmd query $'lex: rate limiter\nvec: 负载下如何进行限流'

# 带查询扩展
qmd query $'expand: 数据库迁移计划\nlex: "schema change"'
```

### 查询语法（lex/BM25 模式）

| 语法 | 效果 | 示例 |
|------|------|------|
| `term` | 前缀匹配 | `perf` 匹配 "performance" |
| `"phrase"` | 精确短语 | `"rate limiter"` |
| `-term` | 排除术语 | `performance -sports` |

### HyDE（假设文档嵌入）

对于复杂主题，写出你期望答案的样子：

```bash
qmd query $'hyde: 迁移计划涉及三个阶段。首先，我们添加新列而不删除旧列。然后回填数据。最后切换并移除遗留列。'
```

### 限定到集合

```bash
qmd search "query" --collection notes
qmd query "query" --collection project-docs
```

### 输出格式

```bash
qmd search "query" --json        # JSON 输出（最适合解析）
qmd search "query" --limit 5     # 限制结果数量
qmd get "#abc123"                # 通过文档 ID 获取
qmd get "path/to/file.md"       # 通过文件路径获取
qmd get "file.md:50" -l 100     # 获取特定行范围
qmd multi-get "journals/*.md" --json  # 通过 glob 批量检索
```

## MCP 集成（推荐）

qmd 暴露一个 MCP 服务器，通过原生 MCP 客户端直接向 Hermes 智能体提供搜索工具。这是首选集成方式 —— 一旦配置完成，智能体将自动获得 qmd 工具，无需加载此技能。

### 选项 A：Stdio 模式（简单）

添加到 `~/.hermes/config.yaml`：

```yaml
mcp_servers:
  qmd:
    command: "qmd"
    args: ["mcp"]
    timeout: 30
    connect_timeout: 45
```

这将注册以下工具：`mcp_qmd_search`、`mcp_qmd_vsearch`、`mcp_qmd_deep_search`、`mcp_qmd_get`、`mcp_qmd_status`。

**权衡：** 模型在首次搜索调用时加载（冷启动约 19 秒），之后在会话期间保持热状态。偶尔使用时可接受。

### 选项 B：HTTP 守护进程模式（快速，推荐用于频繁使用）

单独启动 qmd 守护进程 —— 它会在内存中保持模型热状态：

```bash
# 启动守护进程（在智能体重启后仍持续运行）
qmd mcp --http --daemon

# 默认运行在 http://localhost:8181
```

然后配置 Hermes 智能体通过 HTTP 连接：

```yaml
mcp_servers:
  qmd:
    url: "http://localhost:8181/mcp"
    timeout: 30
```

**权衡：** 运行时占用约 2GB 内存，但每次查询都很快（~2-3 秒）。最适合频繁搜索的用户。

### 保持守护进程运行

#### macOS（launchd）

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

#### Linux（systemd 用户服务）

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

连接后，以下工具可用，前缀为 `mcp_qmd_*`：

| MCP 工具 | 映射到 | 描述 |
|----------|--------|------|
| `mcp_qmd_search` | `qmd search` | BM25 关键词搜索 |
| `mcp_qmd_vsearch` | `qmd vsearch` | 语义向量搜索 |
| `mcp_qmd_deep_search` | `qmd query` | 混合搜索 + 重排序 |
| `mcp_qmd_get` | `qmd get` | 通过 ID 或路径检索文档 |
| `mcp_qmd_status` | `qmd status` | 索引健康状况和统计信息 |

MCP 工具接受结构化 JSON 查询以进行多模式搜索：

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

## CLI 用法（不使用 MCP）

当未配置 MCP 时，请直接通过终端使用 qmd：

```
terminal(command="qmd query '关于 API 重新设计的决定是什么' --json", timeout=30)
```

对于设置和管理任务，请始终使用终端：

```
terminal(command="qmd collection add ~/Documents/notes --name notes")
terminal(command="qmd context add qmd://notes '个人研究笔记和想法'")
terminal(command="qmd embed")
terminal(command="qmd status")
```

## 搜索流水线的工作原理

了解内部机制有助于选择正确的搜索模式：

1. **查询扩展** —— 一个经过微调的 1.7B 模型会生成 2 个替代查询。原始查询在融合中权重为 2 倍。
2. **并行检索** —— BM25（SQLite FTS5）和向量搜索会同时在所有查询变体上运行。
3. **RRF 融合** —— 互逆排名融合（k=60）合并结果。排名奖励：第 1 名获得 +0.05，第 2-3 名获得 +0.02。
4. **大语言模型重排序** —— qwen3-reranker 对前 30 个候选项进行评分（0.0-1.0）。
5. **位置感知融合** —— 排名 1-3：75% 检索 / 25% 重排序。排名 4-10：60/40。排名 11+：40/60（对长尾结果更信任重排序）。

**智能分块：** 文档在自然断点（标题、代码块、空行）处拆分，目标约为 900 个 token，重叠 15%。代码块绝不会在块中间拆分。

## 最佳实践

1. **始终添加上下文描述** —— `qmd context add` 可显著提高检索准确性。描述每个集合包含的内容。
2. **添加文档后重新嵌入** —— 当新文件添加到集合中时，必须重新运行 `qmd embed`。
3. **使用 `qmd search` 以提高速度** —— 当您需要快速关键词查找（代码标识符、确切名称）时，BM25 是即时的，无需模型。
4. **使用 `qmd query` 以获得质量** —— 当问题是概念性的或用户需要最佳可能结果时，请使用混合搜索。
5. **优先使用 MCP 集成** —— 一旦配置，智能体将获得原生工具，无需每次加载此技能。
6. **频繁用户请使用守护进程模式** —— 如果用户定期搜索其知识库，请推荐 HTTP 守护进程设置。
7. **结构化搜索中的第一个查询权重为 2 倍** —— 在组合词法和向量搜索时，将最重要/最确定的查询放在第一位。

## 故障排除

### “首次运行时下载模型”
正常 —— qmd 首次使用时会自动下载约 2GB 的 GGUF 模型。这是一次性操作。

### 冷启动延迟（约 19 秒）
当模型未加载到内存中时会发生这种情况。解决方案：
- 使用 HTTP 守护进程模式（`qmd mcp --http --daemon`）以保持热状态
- 当不需要模型时，使用 `qmd search`（仅 BM25）
- MCP stdio 模式在首次搜索时加载模型，并在会话期间保持热状态

### macOS：“无法加载扩展”
安装 Homebrew SQLite：`brew install sqlite`
然后确保它在系统 SQLite 之前在 PATH 中。

### “未找到集合”
运行 `qmd collection add <path> --name <name>` 添加目录，然后运行 `qmd embed` 对其进行索引。

### 嵌入模型覆盖（CJK/多语言）
为非英语内容设置 `QMD_EMBED_MODEL` 环境变量：
```bash
export QMD_EMBED_MODEL="your-multilingual-model"
```

## 数据存储

- **索引和向量：** `~/.cache/qmd/index.sqlite`
- **模型：** 首次运行时自动下载到本地缓存
- **无云依赖** —— 所有操作均在本地运行

## 参考

- [GitHub: tobi/qmd](https://github.com/tobi/qmd)
- [QMD 更新日志](https://github.com/tobi/qmd/blob/main/CHANGELOG.md)