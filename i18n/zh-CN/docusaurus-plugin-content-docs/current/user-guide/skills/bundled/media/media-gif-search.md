title: Gif Search — 通过 curl + jq 从 Tenor 搜索/下载 GIF
sidebar_label: Gif Search
description: 通过 curl + jq 从 Tenor 搜索/下载 GIF
---

{/* 此页面由网站/scripts/generate-skill-docs.py 脚本自动生成自技能的SKILL.md。请编辑源文件SKILL.md，而不是本页面。 */}

# Gif Search

通过 curl + jq 从 Tenor 搜索/下载 GIF。

## 技能元数据

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/media/gif-search` |
| Version | `1.1.0` |
| Author | Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `GIF`, `Media`, `Search`, `Tenor`, `API` |

## 参考：完整的SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# GIF 搜索（Tenor API）

使用 curl 直接通过 Tenor API 搜索和下载 GIF。无需额外的工具。

## 何时使用

可用于查找反应 GIF、创建视觉内容以及在聊天中发送 GIF。

## 设置

将您的 Tenor API 密钥设置到环境变量中（添加到 `${HERMES_HOME:-~/.hermes}/.env`）：

```bash
TENOR_API_KEY=your_key_here
```

前往 https://developers.google.com/tenor/guides/quickstart 获取免费的 API 密钥——Google Cloud Console 的 Tenor API 密钥是免费的，且具有慷慨的速率限制。

## 先决条件

- `curl` 和 `jq`（macOS/Linux 上均是标准工具）
- `TENOR_API_KEY` 环境变量

## 搜索 GIF

```bash
# 搜索并获取 GIF URL
curl -s "https://tenor.googleapis.com/v2/search?q=thumbs+up&limit=5&key=${TENOR_API_KEY}" | jq -r '.results[].media_formats.gif.url'

# 获取较小/预览版本
curl -s "https://tenor.googleapis.com/v2/search?q=nice+work&limit=3&key=${TENOR_API_KEY}" | jq -r '.results[].media_formats.tinygif.url'
```

## 下载 GIF

```bash
# 搜索并下载第一个结果
URL=$(curl -s "https://tenor.googleapis.com/v2/search?q=celebration&limit=1&key=${TENOR_API_KEY}" | jq -r '.results[0].media_formats.gif.url')
curl -sL "$URL" -o celebration.gif
```

## 获取完整元数据

```bash
curl -s "https://tenor.googleapis.com/v2/search?q=cat&limit=3&key=${TENOR_API_KEY}" | jq '.results[] | {title: .title, url: .media_formats.gif.url, preview: .media_formats.tinygif.url, dimensions: .media_formats.gif.dims}'
```

## API 参数

| Parameter | Description |
|-----------|-------------|
| `q` | 搜索查询（将空格 URL 编码为 `+`） |
| `limit` | 最大结果数（1-50，默认为 20） |
| `key` | API 密钥（来自 `$TENOR_API_KEY` 环境变量） |
| `media_filter` | 媒体格式过滤器：`gif`、`tinygif`、`mp4`、`tinymp4`、`webm` |
| `contentfilter` | 安全性设置：`off`、`low`、`medium`、`high` |
| `locale` | 语言：`en_US`、`es`、`fr` 等。 |

## 可用的媒体格式

每个结果都包含 `.media_formats` 下的多种格式：

| Format | 用途 |
|--------|----------|
| `gif` | 全尺寸 GIF |
| `tinygif` | 小预览 GIF |
| `mp4` | 视频版本（文件大小较小） |
| `tinymp4` | 小预览视频 |
| `webm` | WebM 视频 |
| `nanogif` | 微型缩略图 |

## 备注

- 对查询进行 URL 编码：空格为 `+`，特殊字符为 `%XX`
- 用于聊天发送时，`tinygif` URL 更轻量。
- GIF URL 可以直接在 Markdown 中使用：`![alt](https://github.com/NousResearch/hermes-agent/blob/main/skills/media/gif-search/url)`