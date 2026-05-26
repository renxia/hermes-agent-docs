---
title: "Spotify — Spotify: 播放、搜索、排队、管理播放列表和设备"
sidebar_label: "Spotify"
description: "Spotify: 播放、搜索、排队、管理播放列表和设备"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源 SKILL.md，而非此页面。 */}

# Spotify

Spotify: 播放、搜索、排队、管理播放列表和设备。

## 技能元数据

| | |
|---|---|
| 来源 | 内置 (默认安装) |
| 路径 | `skills/media/spotify` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `spotify`, `music`, `playback`, `playlists`, `media` |
| 相关技能 | [`gif-search`](/user-guide/skills/bundled/media/media-gif-search) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# Spotify

通过 Hermes Spotify 工具集 (7 个工具) 控制用户的 Spotify 账户。设置指南：https://hermes-agent.nousresearch.com/docs/user-guide/features/spotify

## 何时使用此技能

用户说了类似“播放 X”、“暂停”、“跳过”、“将 X 加入队列”、“现在播放什么”、“搜索 X”、“添加到我的 X 播放列表”、“创建播放列表”、“保存到我的资料库”等话语。

## 7 个工具

- `spotify_playback` — 播放、暂停、下一首、上一首、跳转、设置重复、设置随机播放、设置音量、获取状态、获取当前播放、最近播放
- `spotify_devices` — 列表、转移
- `spotify_queue` — 获取、添加
- `spotify_search` — 搜索目录
- `spotify_playlists` — 列表、获取、创建、添加项目、移除项目、更新详情
- `spotify_albums` — 获取、曲目
- `spotify_library` — 列表/保存/移除，使用 `kind: "tracks"|"albums"`

改变播放状态的操作需要 Spotify Premium；搜索/资料库/播放列表操作在免费版上也可用。

## 规范模式 (尽量减少工具调用)

### “播放 <艺术家/曲目/专辑>”
一次搜索，然后通过 URI 播放。除非用户要求选择，否则不要循环浏览搜索结果并描述它们。

```
spotify_search({"query": "miles davis kind of blue", "types": ["album"], "limit": 1})
→ 获取到专辑 URI spotify:album:1weenld61qoidwYuZ1GESA
spotify_playback({"action": "play", "context_uri": "spotify:album:1weenld61qoidwYuZ1GESA"})
```

对于“播放一些 <艺术家>”（无特定歌曲），优先使用 `types: ["artist"]` 并播放艺术家上下文 URI — Spotify 会智能处理随机播放。如果用户说“那首歌”或“那首曲子”，搜索 `types: ["track"]` 并将 `uris: [track_uri]` 传给播放操作。

### “正在播放什么？” / “我在听什么？”
单次调用 — 不要在 `get_currently_playing` 之后链接 `get_state`。

```
spotify_playback({"action": "get_currently_playing"})
```

如果返回 204/空 (`is_playing: false`)，告知用户没有正在播放的内容。不要重试。

### “暂停” / “跳过” / “音量 50”
直接操作，无需预先检查。

```
spotify_playback({"action": "pause"})
spotify_playback({"action": "next"})
spotify_playback({"action": "set_volume", "volume_percent": 50})
```

### “添加到我的 <播放列表名称> 播放列表”
1. `spotify_playlists list` 按名称查找播放列表 ID
2. 获取曲目 URI (来自当前播放或搜索)
3. `spotify_playlists add_items` 使用 playlist_id 和 URI 列表

```
spotify_playlists({"action": "list"})
→ 找到 "Late Night Jazz" = 37i9dQZF1DX4wta20PHgwo
spotify_playback({"action": "get_currently_playing"})
→ 当前曲目 uri = spotify:track:0DiWol3AO6WpXZgp0goxAV
spotify_playlists({"action": "add_items",
                   "playlist_id": "37i9dQZF1DX4wta20PHgwo",
                   "uris": ["spotify:track:0DiWol3AO6WpXZgp0goxAV"]})
```

### “创建一个名为 X 的播放列表并添加我最近播放的 3 首歌”
```
spotify_playback({"action": "recently_played", "limit": 3})
spotify_playlists({"action": "create", "name": "Focus 2026"})
→ 响应中返回了 playlist_id
spotify_playlists({"action": "add_items", "playlist_id": <id>, "uris": [<3个 uri>]})
```

### “保存 / 取消保存 / 这首歌已保存了吗？”
使用 `spotify_library`，并选择正确的 `kind`。

```
spotify_library({"kind": "tracks", "action": "save", "uris": ["spotify:track:..."]})
spotify_library({"kind": "albums", "action": "list", "limit": 50})
```

### “将播放转移到我的 <设备>”
```
spotify_devices({"action": "list"})
→ 根据名称/类型匹配选择 device_id
spotify_devices({"action": "transfer", "device_id": "<id>", "play": true})
```

## 关键故障模式

**`403 Forbidden — No active device found`** 出现在任何播放操作上，表示 Spotify 未在任何地方运行。告知用户：“首先在您的手机/桌面/网页播放器上打开 Spotify，随便播放一首歌曲几秒钟，然后重试。” 不要盲目重试工具调用 — 它会以同样方式失败。你可以调用 `spotify_devices list` 来确认；空列表意味着没有活跃设备。

**`403 Forbidden — Premium required`** 表示用户是免费版用户且尝试了改变播放状态的操作。不要重试；告知他们此操作需要 Premium。读取操作仍然有效（搜索、播放列表、资料库、获取状态）。

**`204 No Content` 出现在 `get_currently_playing`** 上不是错误 — 它表示没有正在播放的内容。工具返回 `is_playing: false`。直接报告给用户即可。

**`429 Too Many Requests`** = 频率限制。等待并重试一次。如果持续发生，说明你在循环 — 停止。

**重试后出现 `401 Unauthorized`** — 刷新令牌已被撤销。告知用户再次运行 `hermes auth spotify`。

## URI 和 ID 格式

Spotify 使用三种可互换的 ID 格式。工具接受所有三种并进行标准化：

- URI: `spotify:track:0DiWol3AO6WpXZgp0goxAV` (首选)
- URL: `https://open.spotify.com/track/0DiWol3AO6WpXZgp0goxAV`
- 裸 ID: `0DiWol3AO6WpXZgp0goxAV`

如有疑问，请使用完整的 URI。搜索结果在 `uri` 字段中返回 URI — 直接传递这些 URI。

实体类型：`track`, `album`, `artist`, `playlist`, `show`, `episode`。为操作使用正确的类型 — `spotify_playback.play` 配合 `context_uri` 期望专辑/播放列表/艺术家；`uris` 期望曲目 URI 数组。

## 不要做什么

- **不要在每次操作前调用 `get_state`。** Spotify 接受播放/暂停/跳过而无需预先检查。仅在用户问“正在播放什么”或者你需要推理设备/曲目状态时检查状态。
- **除非被问及，否则不要描述搜索结果。** 如果用户说“播放 X”，搜索，获取排名第一的 URI，播放它。如果错了，他们会听到是错的。
- **不要在 `403 Premium required` 或 `403 No active device` 上重试。** 在用户操作前，这些是永久性的。
- **不要使用 `spotify_search` 按名称查找播放列表** — 那会搜索公共 Spotify 目录。用户播放列表来自 `spotify_playlists list`。
- **不要在 `spotify_library` 中混用 `kind: "tracks"` 和专辑 URI** (反之亦然)。工具会标准化 ID，但 API 端点不同。