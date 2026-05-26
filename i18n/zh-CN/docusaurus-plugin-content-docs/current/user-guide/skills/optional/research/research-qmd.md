---
title: "Qmd"
sidebar_label: "Qmd"
description: "使用 qmd 本地搜索个人知识库、笔记、文档和会议记录——一种结合了 BM25、向量搜索和 LLM 重排序的混合检索引擎"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Qmd

使用 qmd 本地搜索个人知识库、笔记、文档和会议记录——一种结合了 BM25、向量搜索和 LLM 重排序的混合检索引擎。支持命令行界面和 MCP 集成。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/research/qmd` 安装 |
| 路径 | `optional-skills/research/qmd` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 + Teknium |
| 许可证 | MIT |
| 平台 | macos, linux |
| 标签 | `搜索`, `知识库`, `RAG`, `笔记`, `MCP`, `本地AI` |
| 相关技能 | [`obsidian`](/user-guide/skills/bundled/note-taking/note-taking-obsidian), [`native-mcp`](/user-guide/skills/bundled/mcp/mcp-native-mcp), [`arxiv`](/user-guide/skills/bundled/research/research-arxiv) |

:::info
以下是此技能被触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# QMD — 查询标记文档

本地、设备端个人知识库搜索引擎。索引 Markdown 笔记、会议记录、文档以及任何基于文本的文件，然后提供结合关键词匹配、语义理解和 LLM 驱动重排序的混合搜索——全部在本地运行，无云依赖。

由 [Tobi Lütke](https://github.com/tobi/qmd) 创建。MIT 许可。

## 何时使用

- 用户要求搜索其笔记、文档、知识库或会议记录
- 用户希望在大量 Markdown/文本文件集合中查找内容
- 用户想要语义搜索（"查找关于 X 概念的笔记"）而不仅仅是关键词匹配
- 用户已设置 qmd 集合并希望查询它们
- 用户要求设置本地知识库或文档搜索系统
- 关键词："搜索我的笔记"、"在我的文档中查找"、"知识库"、"qmd"

## 前提条件

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

### 带扩展支持的 SQLite（仅限 macOS）

macOS 系统 SQLite 缺少扩展加载。通过 Homebrew 安装：

```bash
brew install sqlite
```

### 安装 qmd

```bash
npm install -g @tobilu/qmd
# 或使用 Bun：
bun install -g @tobilu/qmd
```

首次运行自动下载 3 个本地 GGUF 模型（总共约 2GB）：

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

| 命令 | 功能 | 速度 |
|---------|-------------|-------|
| `qmd search "query"` | BM25 关键词搜索（无模型） | ~0.2秒 |
| `qmd vsearch "query"` | 语义向量搜索（1 个模型） | ~3秒 |
| `qmd query "query"` | 混合搜索 + 重排序（全部 3 个模型） | ~2-3秒 热启动，~19秒 冷启动 |
| `qmd get <docid>` | 检索完整文档内容 | 瞬时 |
| `qmd multi-get "glob"` | 检索多个文件 | 瞬时 |
| `qmd collection add <path> --name <n>` | 将目录添加为集合 | 瞬时 |
| `qmd context add <path> "description"` | 添加上下文元数据以提高检索质量 | 瞬时 |
| `qmd embed` | 生成/更新向量嵌入 | 不定 |
| `qmd status` | 显示索引健康状况和集合信息 | 瞬时 |
| `qmd mcp` | 启动 MCP 服务器（标准输入输出） | 持续 |
| `qmd mcp --http --daemon` | 启动 MCP 服务器（HTTP，预热模型） | 持续 |

## 设置工作流程

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

上下文元数据帮助搜索引擎理解每个集合包含的内容。这可以显著提高检索质量：

```bash
qmd context add qmd://notes "个人笔记、想法和日志条目"
qmd context add qmd://project-docs "主项目的技术文档"
qmd context add qmd://meetings "团队同步的会议记录和行动项"
```

### 3. 生成嵌入

```bash
qmd embed
```

这会处理所有集合中的所有文档并生成向量嵌入。添加新文档或集合后需重新运行。

### 4. 验证

```bash
qmd status   # 显示索引健康状况、集合统计、模型信息
```

## 搜索模式

### 快速关键词搜索（BM25）

适用于：精确术语、代码标识符、名称、已知短语。
不加载模型——近乎瞬时返回结果。

```bash
qmd search "认证中间件"
qmd search "handleError async"
```

### 语义向量搜索

适用于：自然语言问题、概念性查询。
加载嵌入模型（首次查询约 3 秒）。

```bash
qmd vsearch "速率限制器如何处理突发流量"
qmd vsearch "改进用户引导流程的想法"
```

### 带重排序的混合搜索（最佳质量）

适用于：质量至关重要的重要查询。
使用全部 3 个模型——查询扩展、并行 BM25+向量搜索、重排序。

```bash
qmd query "关于数据库迁移做出了哪些决定"
```

### 结构化多模式查询

在单个查询中结合不同搜索类型以提高精度：

```bash
# BM25 用于精确术语 + 向量搜索用于概念
qmd query $'lex: 速率限制器\nvec: 节流在负载下如何工作'

# 使用查询扩展
qmd query $'expand: 数据库迁移计划\nlex: "模式变更"'
```

### 查询语法（词法/BM25 模式）

| 语法 | 效果 | 示例 |
|--------|--------|---------|
| `term` | 前缀匹配 | `perf` 匹配 "performance" |
| `"phrase"` | 精确短语 | `"rate limiter"` |
| `-term` | 排除术语 | `performance -sports` |

### HyDE（假设文档嵌入）

对于复杂主题，写出您期望的答案是什么样的：

```bash
qmd query $'hyde: 迁移计划涉及三个阶段。首先，我们添加新列而不删除旧列。然后我们回填数据。最后我们切换并删除遗留列。'
```

### 限定搜索范围到集合

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

qmd 提供了一个 MCP 服务器，通过原生 MCP 客户端将搜索工具直接暴露给 Hermes 智能体。这是首选的集成方式——配置完成后，智能体无需加载此技能即可自动获得 qmd 工具。

### 方案 A：标准输入输出模式（简单）

添加到 `~/.hermes/config.yaml`：

```yaml
mcp_servers:
  qmd:
    command: "qmd"
    args: ["mcp"]
    timeout: 30
    connect_timeout: 45
```

这会注册工具：`mcp_qmd_search`、`mcp_qmd_vsearch`、`mcp_qmd_deep_search`、`mcp_qmd_get`、`mcp_qmd_status`。

**权衡：** 模型在首次搜索调用时加载（冷启动约 19 秒），然后在会话期间保持热状态。适用于偶尔使用。

### 方案 B：HTTP 守护进程模式（快速，推荐频繁使用）

单独启动 qmd 守护进程——它会将模型保持在内存中热状态：

```bash
# 启动守护进程（在智能体重启后持续运行）
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

**权衡：** 运行时使用约 2GB 内存，但每个查询都很快（约 2-3 秒）。最适合频繁搜索的用户。

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
Description=QMD MCP 守护进程
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

连接后，以下工具可用，名称为 `mcp_qmd_*`：

| MCP 工具 | 对应命令 | 描述 |
|----------|---------|-------------|
| `mcp_qmd_search` | `qmd search` | BM25 关键词搜索 |
| `mcp_qmd_vsearch` | `qmd vsearch` | 语义向量搜索 |
| `mcp_qmd_deep_search` | `qmd query` | 混合搜索 + 重排序 |
| `mcp_qmd_get` | `qmd get` | 通过 ID 或路径检索文档 |
| `mcp_qmd_status` | `qmd status` | 索引健康状况和统计信息 |

MCP 工具接受结构化的 JSON 查询进行多模式搜索：

```json
{
  "searches": [
    {"type": "lex", "query": "认证中间件"},
    {"type": "vec", "query": "用户登录如何验证"}
  ],
  "collections": ["项目文档"],
  "limit": 10
}
```

## CLI 用法（不使用 MCP 时）

当 MCP 未配置时，请通过终端直接使用 qmd：

```
terminal(command="qmd query 'what was decided about the API redesign' --json", timeout=30)
```

对于设置和管理任务，请始终使用终端：

```
terminal(command="qmd collection add ~/Documents/notes --name notes")
terminal(command="qmd context add qmd://notes 'Personal research notes and ideas'")
terminal(command="qmd embed")
terminal(command="qmd status")
```

## 搜索管道工作原理

了解内部机制有助于选择正确的搜索模式：

1.  **查询扩展** — 一个经过微调的 1.7B 模型会生成 2 个替代查询。在融合时，原始查询的权重为 2 倍。
2.  **并行检索** — BM25（SQLite FTS5）和向量搜索会在所有查询变体上同时运行。
3.  **RRF 融合** — 倒数排名融合（k=60）合并结果。顶级排名奖励：第 1 名 +0.05，第 2-3 名 +0.02。
4.  **LLM 重排序** — qwen3-reranker 对前 30 个候选项进行评分（0.0-1.0）。
5.  **位置感知融合** — 排名 1-3：75% 检索结果 / 25% 重排序器结果。排名 4-10：60/40。排名 11+：40/60（对于长尾部分更信任重排序器）。

**智能分块：** 文档会在自然断点处分割（标题、代码块、空行），目标是约 900 个 token，重叠度为 15%。代码块永远不会在块中间分割。

## 最佳实践

1.  **始终添加上下文描述** — `qmd context add` 能显著提高检索准确性。请描述每个集合包含什么内容。
2.  **添加文档后重新嵌入** — 当向集合添加新文件时，必须重新运行 `qmd embed`。
3.  **为速度使用 `qmd search`** — 当你需要快速关键词查找（代码标识符、精确名称）时，BM25 是即时的，且不需要模型。
4.  **为质量使用 `qmd query`** — 当问题是概念性的，或者用户需要尽可能好的结果时，请使用混合搜索。
5.  **优先使用 MCP 集成** — 一旦配置，智能体将获得原生工具，无需每次加载此技能。
6.  **频繁用户使用守护进程模式** — 如果用户经常搜索他们的知识库，推荐使用 HTTP 守护进程设置。
7.  **结构化搜索中第一个查询的权重为 2 倍** — 在组合词法和向量搜索时，将最重要/最确定的查询放在首位。

## 故障排除

### “首次运行时下载模型”
正常现象 — qmd 在首次使用时会自动下载约 2GB 的 GGUF 模型。这是一次性操作。

### 冷启动延迟（约 19 秒）
当模型未加载到内存中时会发生这种情况。解决方案：
- 使用 HTTP 守护进程模式 (`qmd mcp --http --daemon`) 以保持热启动状态
- 当不需要模型时使用 `qmd search`（仅 BM25）
- MCP stdio 模式会在首次搜索时加载模型，并在会话期间保持热启动状态

### macOS: “无法加载扩展”
安装 Homebrew SQLite：`brew install sqlite`
然后确保它在 PATH 中的优先级高于系统 SQLite。

### “未找到集合”
运行 `qmd collection add <路径> --name <名称>` 以添加目录，然后运行 `qmd embed` 为其建立索引。

### 嵌入模型覆盖（CJK/多语言）
为非英文内容设置 `QMD_EMBED_MODEL` 环境变量：
```bash
export QMD_EMBED_MODEL="your-multilingual-model"
```

## 数据存储

- **索引与向量：** `~/.cache/qmd/index.sqlite`
- **模型：** 首次运行时自动下载到本地缓存
- **无云依赖** — 所有内容均在本地运行

## 参考资料

- [GitHub: tobi/qmd](https://github.com/tobi/qmd)
- [QMD 更新日志](https://github.com/tobi/qmd/blob/main/CHANGELOG.md)