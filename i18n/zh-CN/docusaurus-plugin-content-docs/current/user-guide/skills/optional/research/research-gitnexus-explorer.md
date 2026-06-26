---
title: Gitnexus Explorer
sidebar_label: Gitnexus Explorer
description: 使用 GitNexus 索引代码库，并通过 Web UI + Cloudflare tunnel 提供交互式知识图谱
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Gitnexus Explorer

使用 GitNexus 索引代码库，并通过 Web UI + Cloudflare tunnel 提供交互式知识图谱。

## Skill metadata

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/research/gitnexus-explorer` 安装 |
| Path | `optional-skills/research/gitnexus-explorer` |
| Version | `1.0.0` |
| Author | Hermes 智能体 + Teknium |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `gitnexus`, `code-intelligence`, `knowledge-graph`, `visualization` |
| Related skills | `native-mcp`, [`codebase-inspection`](/docs/user-guide/skills/bundled/github/github-codebase-inspection) |

## Reference: full SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# GitNexus Explorer

将任何代码库索引为知识图谱，并提供一个用于探索符号、调用链、集群和执行流程的交互式 Web UI。通过 Cloudflare 进行隧道传输以实现远程访问。

## 何时使用 (When to Use)

- 用户希望可视化地探索代码库的架构
- 用户要求获取仓库的知识图谱/依赖图
- 用户希望与他人分享一个交互式的代码库浏览器

## 先决条件 (Prerequisites)

- **Node.js** (v18+) — GitNexus 和代理所需的
- **git** — 仓库必须包含 `.git` 目录
- **cloudflared** — 用于隧道传输（如果缺失，将自动安装到 ~/.local/bin）

## 大小警告 (Size Warning)

Web UI 会在浏览器中渲染所有节点。少于约 5,000 个文件的仓库运行良好。大型仓库（30k+ 节点）可能会导致卡顿或崩溃浏览器标签页。CLI/MCP 工具可以在任何规模下工作——只有 Web 可视化有此限制。

## 步骤 (Steps)

### 1. 克隆和构建 GitNexus (一次性设置)

```bash
GITNEXUS_DIR="${GITNEXUS_DIR:-$HOME/.local/share/gitnexus}"

if [ ! -d "$GITNEXUS_DIR/gitnexus-web/dist" ]; then
  git clone https://github.com/abhigyanpatwari/GitNexus.git "$GITNEXUS_DIR"
  cd "$GITNEXUS_DIR/gitnexus-shared" && npm install && npm run build
  cd "$GITNEXUS_DIR/gitnexus-web" && npm install
fi
```

### 2. 为远程访问修补 Web UI

Web UI 默认使用 `localhost:4747` 进行 API 调用。将其修补为使用相同源（same-origin），以便它可以通过隧道/代理工作：

**文件: `$GITNEXUS_DIR/gitnexus-web/src/config/ui-constants.ts`**
将：
```typescript
export const DEFAULT_BACKEND_URL = 'http://localhost:4747';
```
更改为：
```typescript
export const DEFAULT_BACKEND_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'http://localhost:4747';
```

**文件: `$GITNEXUS_DIR/gitnexus-web/vite.config.ts`**
在 `server: { }` 块中添加 `allowedHosts: true`（仅在运行开发模式而不是生产构建时才需要）：
```typescript
server: {
    allowedHosts: true,
    // ... existing config
},
```

然后构建生产包：
```bash
cd "$GITNEXUS_DIR/gitnexus-web" && npx vite build
```

### 3. 索引目标仓库

```bash
cd /path/to/target-repo
npx gitnexus analyze --skip-agents-md
rm -rf .claude/    # 移除 Claude 特定工件
```

添加 `--embeddings` 以进行语义搜索（较慢——几分钟而不是几秒）。

索引文件位于仓库内的 `.gitnexus/` 中（自动忽略）。

### 4. 创建代理脚本 (Proxy Script)

将以下内容写入文件（例如 `$GITNEXUS_DIR/proxy.mjs`）。它提供生产 Web UI，并将 `/api/*` 代理到 GitNexus 后端——相同源，没有 CORS 问题，无需 sudo，无需 nginx。

```javascript
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const API_PORT = parseInt(process.env.API_PORT || '4747');
const DIST_DIR = process.argv[2] || './dist';
const PORT = parseInt(process.argv[3] || '8888');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.wasm': 'application/wasm',
};

function proxyToApi(req, res) {
  const opts = {
    hostname: '127.0.0.1', port: API_PORT,
    path: req.url, method: req.method, headers: req.headers,
  };
  const proxy = http.request(opts, (upstream) => {
    res.writeHead(upstream.statusCode, upstream.headers);
    upstream.pipe(res, { end: true });
  });
  proxy.on('error', () => { res.writeHead(502); res.end('Backend unavailable'); });
  req.pipe(proxy, { end: true });
}

function serveStatic(req, res) {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(filePath)) filePath = path.join(DIST_DIR, 'index.html');
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'public, max-age=3600' });
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
}

http.createServer((req, res) => {
  if (req.url.startsWith('/api')) proxyToApi(req, res);
  else serveStatic(req, res);
}).listen(PORT, () => console.log(`GitNexus proxy on http://localhost:${PORT}`));
```

### 5. 启动服务 (Start the Services)

```bash
# Terminal 1: GitNexus 后端 API
npx gitnexus serve &

# Terminal 2: 代理（Web UI + API 在一个端口上）
node "$GITNEXUS_DIR/proxy.mjs" "$GITNEXUS_DIR/gitnexus-web/dist" 8888 &
```

验证：`curl -s http://localhost:8888/api/repos` 应返回已索引的仓库。

### 6. 使用 Cloudflare 进行隧道传输 (可选 — 用于远程访问)

```bash
# 如果需要，则安装 cloudflared（无需 sudo）
if ! command -v cloudflared &>/dev/null; then
  mkdir -p ~/.local/bin
  curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
    -o ~/.local/bin/cloudflared
  chmod +x ~/.local/bin/cloudflared
  export PATH="$HOME/.local/bin:$PATH"
fi

# 启动隧道（--config /dev/null 可避免与现有命名隧道冲突）
cloudflared tunnel --config /dev/null --url http://localhost:8888 --no-autoupdate --protocol http2
```

隧道 URL（例如 `https://random-words.trycloudflare.com`）将打印到 stderr。
分享它——拥有该链接的任何人都可以探索图谱。

### 7. 清理 (Cleanup)

```bash
# 停止服务
pkill -f "gitnexus serve"
pkill -f "proxy.mjs"
pkill -f cloudflared

# 从目标仓库中移除索引
cd /path/to/target-repo
npx gitnexus clean
rm -rf .claude/
```

## 潜在问题 (Pitfalls)

- **`--config /dev/null` 对于 cloudflared 是必需的**，如果用户在 `~/.cloudflared/config.yml` 中有现有的命名隧道配置。否则，配置中的捕获所有入口规则会返回 404，导致快速隧道请求失败。

- **必须进行生产构建才能进行隧道传输。** Vite 开发服务器默认会阻止非 localhost 主机（`allowedHosts`）。生产构建 + Node 代理完全避免了这个问题。

- **Web UI 不会创建 `.claude/` 或 `CLAUDE.md`。** 这些文件是由 `npx gitnexus analyze` 创建的。使用 `--skip-agents-md` 可以抑制这些 markdown 文件，然后运行 `rm -rf .claude/` 来移除它们。这些是 Claude Code 集成功能，并非 hermes-agent 用户所必需。

- **浏览器内存限制。** Web UI 会将整个图谱加载到浏览器内存中。拥有 5k+ 个文件的仓库可能会卡顿。30k+ 个文件很可能会导致标签页崩溃。

- **嵌入（Embeddings）是可选的。** `--embeddings` 启用了语义搜索，但在大型仓库上需要几分钟时间。如果只是快速探索，可以跳过；如果你想通过 AI 聊天面板进行自然语言查询，则应添加它。

- **多个仓库。** `gitnexus serve` 会提供所有已索引的仓库。索引多个仓库，只启动一次服务，Web UI 就可以让你在它们之间切换。