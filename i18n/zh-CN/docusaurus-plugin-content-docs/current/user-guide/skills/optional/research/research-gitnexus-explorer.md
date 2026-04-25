---
title: "Gitnexus Explorer"
sidebar_label: "Gitnexus Explorer"
description: "使用 GitNexus 对代码库建立索引，并通过 Web UI + Cloudflare 隧道提供交互式知识图谱"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Gitnexus Explorer

使用 GitNexus 对任意代码库建立索引，并通过 Web UI + Cloudflare 隧道提供交互式知识图谱，用于探索符号、调用链、聚类和执行流程。

## 何时使用

- 用户希望可视化探索代码库的架构
- 用户请求仓库的知识图谱/依赖关系图
- 用户希望与他人共享交互式代码库浏览器

## 先决条件

- **Node.js** (v18+) — GitNexus 和代理所必需
- **git** — 仓库必须包含 `.git` 目录
- **cloudflared** — 用于隧道（如果缺失，将自动安装到 ~/.local/bin）

## 大小警告

Web UI 会在浏览器中渲染所有节点。约 5,000 个文件以下的仓库运行良好。大型仓库（30k+ 节点）可能会导致浏览器标签页卡顿或崩溃。CLI/MCP 工具可在任何规模下工作 — 仅 Web 可视化存在此限制。

## 步骤

### 1. 克隆并构建 GitNexus（一次性设置）

```bash
GITNEXUS_DIR="${GITNEXUS_DIR:-$HOME/.local/share/gitnexus}"

if [ ! -d "$GITNEXUS_DIR/gitnexus-web/dist" ]; then
  git clone https://github.com/abhigyanpatwari/GitNexus.git "$GITNEXUS_DIR"
  cd "$GITNEXUS_DIR/gitnexus-shared" && npm install && npm run build
  cd "$GITNEXUS_DIR/gitnexus-web" && npm install
fi
```

### 2. 修补 Web UI 以支持远程访问

Web UI 默认对 API 调用使用 `localhost:4747`。请将其修改为使用同源策略，以便通过隧道/代理正常工作：

**文件：`$GITNEXUS_DIR/gitnexus-web/src/config/ui-constants.ts`**
将：
```typescript
export const DEFAULT_BACKEND_URL = 'http://localhost:4747';
```
改为：
```typescript
export const DEFAULT_BACKEND_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'http://localhost:4747';
```

**文件：`$GITNEXUS_DIR/gitnexus-web/vite.config.ts`**
在 `server: { }` 块内添加 `allowedHosts: true`（仅在运行开发模式而非生产构建时需要）：
```typescript
server: {
    allowedHosts: true,
    // ... 现有配置
},
```

然后构建生产包：
```bash
cd "$GITNEXUS_DIR/gitnexus-web" && npx vite build
```

### 3. 为目标仓库建立索引

```bash
cd /path/to/target-repo
npx gitnexus analyze --skip-agents-md
rm -rf .claude/    # 移除 Claude Code 特定的产物
```

添加 `--embeddings` 以启用语义搜索（较慢 — 需要几分钟而非几秒钟）。

索引位于仓库内的 `.gitnexus/` 目录中（自动被 git 忽略）。

### 4. 创建代理脚本

将此内容写入一个文件（例如 `$GITNEXUS_DIR/proxy.mjs`）。它提供生产 Web UI 并将 `/api/*` 代理到 GitNexus 后端 — 同源，无 CORS 问题，无需 sudo，无需 nginx。

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

### 5. 启动服务

```bash
# 终端 1：GitNexus 后端 API
npx gitnexus serve &

# 终端 2：代理（Web UI + API 共用一个端口）
node "$GITNEXUS_DIR/proxy.mjs" "$GITNEXUS_DIR/gitnexus-web/dist" 8888 &
```

验证：`curl -s http://localhost:8888/api/repos` 应返回已建立索引的仓库。

### 6. 使用 Cloudflare 隧道（可选 — 用于远程访问）

```bash
# 如果需要，安装 cloudflared（无需 sudo）
if ! command -v cloudflared &>/dev/null; then
  mkdir -p ~/.local/bin
  curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
    -o ~/.local/bin/cloudflared
  chmod +x ~/.local/bin/cloudflared
  export PATH="$HOME/.local/bin:$PATH"
fi

# 启动隧道（--config /dev/null 可避免与现有的命名隧道配置冲突）
cloudflared tunnel --config /dev/null --url http://localhost:8888 --no-autoupdate --protocol http2
```

隧道 URL（例如 `https://random-words.trycloudflare.com`）将打印到 stderr。分享它 — 任何拥有链接的人都可以探索图谱。

### 7. 清理

```bash
# 停止服务
pkill -f "gitnexus serve"
pkill -f "proxy.mjs"
pkill -f cloudflared

# 从目标仓库移除索引
cd /path/to/target-repo
npx gitnexus clean
rm -rf .claude/
```

## 陷阱

- **如果用户已在 `~/.cloudflared/config.yml` 拥有现有的命名隧道配置，则 cloudflared 必须使用 `--config /dev/null`。** 否则，配置中的通配符入口规则将为所有快速隧道请求返回 404。

- **隧道必须使用生产构建。** Vite 开发服务器默认阻止非 localhost 主机（`allowedHosts`）。生产构建 + Node 代理可完全避免此问题。

- **Web UI 不会创建 `.claude/` 或 `CLAUDE.md`。** 这些是由 `npx gitnexus analyze` 创建的。使用 `--skip-agents-md` 抑制 markdown 文件，然后使用 `rm -rf .claude/` 删除其余内容。这些是 Claude Code 集成，hermes-agent 用户不需要。

- **浏览器内存限制。** Web UI 会将整个图谱加载到浏览器内存中。拥有 5k+ 文件的仓库可能会卡顿。30k+ 文件很可能会导致标签页崩溃。

- **嵌入是可选的。** `--embeddings` 启用语义搜索，但在大型仓库上需要几分钟。快速探索时可跳过；如果希望通过 AI 聊天面板进行自然语言查询，则可添加它。

- **多个仓库。** `gitnexus serve` 会提供所有已建立索引的仓库。建立多个仓库的索引，启动一次 serve，Web UI 即可让你在它们之间切换。