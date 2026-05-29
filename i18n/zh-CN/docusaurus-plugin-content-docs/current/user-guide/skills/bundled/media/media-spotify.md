---
title: "Spotify — Spotify：播放、搜索、队列、管理播放列表和设备"
sidebar_label: "Spotify"
description: "Spotify：播放、搜索、队列、管理播放列表和设备"
---

{/* 此页面由网站脚本 scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源 SKILL.md，而非此页面。 */}

# Spotify

Spotify：播放、搜索、队列、管理播放列表和设备。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/media/spotify` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `spotify`, `音乐`, `播放`, `播放列表`, `媒体` |
| 相关技能 | [`gif-search`](/docs/user-guide/skills/bundled/media/media-gif-search) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Spotify

通过 Hermes Spotify 工具集（7个工具）控制用户的 Spotify 账户。设置指南：https://hermes-agent.nousresearch.com/docs/user-guide/features/spotify

## 何时使用此技能

当用户说类似 "播放 X"、"暂停"、"跳过"、"将 X 加入队列"、"正在播放什么"、"搜索 X"、"添加到我的 X 播放列表"、"创建一个播放列表"、"将此保存到资料库" 等内容时。

## 7 个工具

- `spotify_playback` — 播放、暂停、下一曲、上一曲、定位、设置重复、设置随机播放、设置音量、获取状态、获取当前播放、最近播放
- `spotify_devices` — 列出、转移
- `spotify_queue` — 获取、添加
- `spotify_search` — 搜索目录
- `spotify_playlists` — 列出、获取、创建、添加项目、移除项目、更新详细信息
- `spotify_albums` — 获取、曲目列表
- `spotify_library` — 列出/保存/移除，使用 `kind: "tracks"|"albums"`

改变播放状态的操作需要 Spotify Premium；搜索/资料库/播放列表操作在免费版上可用。

## 典型模式（尽量减少工具调用）

### "播放 &lt;艺术家/曲目/专辑>"
先进行一次搜索，然后通过 URI 播放。除非用户要求选项，否则不要循环遍历搜索结果描述它们。

```
spotify_search({"query": "miles davis kind of blue", "types": ["album"], "limit": 1})
→ 得到专辑 URI spotify:album:1weenld61qoidwYuZ1GESA
spotify_playback({"action": "play", "context_uri": "spotify:album:1weenld61qoidwYuZ1GESA"})
```

对于 "播放一些 &lt;艺术家>"（没有特定歌曲），优先使用 `types: ["artist"]` 并播放艺术家上下文 URI — Spotify 会处理智能随机播放。如果用户说 "那首歌" 或 "那首曲子"，则搜索 `types: ["track"]` 并传递 `uris: [track_uri]` 来播放。

### "正在播放什么？" / "我在听什么？"
单次调用 — 不要在 get_currently_playing 之后链接 get_state。

```
spotify_playback({"action": "get_currently_playing"})
```

如果返回 204/空（`is_playing: false`），则告知用户没有正在播放的内容。不要重试。

### "暂停" / "跳过" / "音量 50"
直接操作，无需预先检查。

```
spotify_playback({"action": "pause"})
spotify_playback({"action": "next"})
spotify_playback({"action": "set_volume", "volume_percent": 50})
```

### "添加到我的 &lt;播放列表名称> 播放列表"
1. `spotify_playlists list` 通过名称查找播放列表 ID
2. 获取曲目 URI（从当前播放或搜索中获取）
3. `spotify_playlists add_items`，使用 playlist_id 和 URI

```
spotify_playlists({"action": "list"})
→ 找到 "Late Night Jazz" = 37i9dQZF1DX4wta20PHgwo
spotify_playback({"action": "get_currently_playing"})
→ 当前曲目 URI = spotify:track:0DiWol3AO6WpXZgp0goxAV
spotify_playlists({"action": "add_items",
                   "playlist_id": "37i9dQZF1DX4wta20PHgwo",
                   "uris": ["spotify:track:0DiWol3AO6WpXZgp0goxAV"]})
```

### "创建一个名为 X 的播放列表，并添加我最近播放的 3 首歌"
```
spotify_playback({"action": "recently_played", "limit": 3})
spotify_playlists({"action": "create", "name": "Focus 2026"})
→ 响应中返回了 playlist_id
spotify_playlists({"action": "add_items", "playlist_id": <id>, "uris": [<3个uri>]})
```

### "保存/取消保存/这个已保存了吗？"
使用 `spotify_library` 并选择正确的 `kind`。

```
spotify_library({"kind": "tracks", "action": "save", "uris": ["spotify:track:..."]})
spotify_library({"kind": "albums", "action": "list", "limit": 50})
```

### "将播放转移到我的 &lt;设备>"
```
spotify_devices({"action": "list"})
→ 通过匹配名称/类型选择 device_id
spotify_devices({"action": "transfer", "device_id": "<id>", "play": true})
```

## 关键失败模式

**任何播放操作返回 `403 Forbidden — No active device found`** 意味着 Spotify 没有在任何地方运行。告知用户："请先在手机/桌面端/网页播放器上打开 Spotify，随便播放一首歌几秒钟，然后重试。" 不要盲目重试工具调用 — 它会以同样方式失败。你可以调用 `spotify_devices list` 来确认；列表为空表示没有活动设备。

**`403 Forbidden — Premium required`** 意味着用户是免费版并尝试了改变播放状态的操作。不要重试；告诉他们此操作需要 Premium。读取操作（搜索、播放列表、资料库、获取状态）仍然有效。

**`get_currently_playing` 返回 `204 No Content`** 不是错误 — 它意味着没有正在播放的内容。工具返回 `is_playing: false`。直接告知用户即可。

**`429 Too Many Requests`** = 频率限制。等待并重试一次。如果持续发生，说明你在循环 — 停止。

**重试后出现 `401 Unauthorized`** — 刷新令牌被撤销。告诉用户再次运行 `hermes auth spotify`。

## URI 和 ID 格式

Spotify 使用三种可互换的 ID 格式。工具接受所有三种并进行标准化：

- URI: `spotify:track:0DiWol3AO6WpXZgp0goxAV`（首选）
- URL: `https://open.spotify.com/track/0DiWol3AO6WpXZgp0goxAV`
- 裸 ID: `0DiWol3AO6WpXZgp0goxAV`

如有疑问，请使用完整 URI。搜索结果在 `uri` 字段中返回 URI — 直接传递即可。

实体类型：`track`、`album`、`artist`、`playlist`、`show`、`episode`。为操作使用正确的类型 — `spotify_playback.play` 配合 `context_uri` 期望专辑/播放列表/艺术家；`uris` 期望曲目 URI 数组。

## 不要做的事

- **不要在每次操作前调用 `get_state`。** Spotify 允许播放/暂停/跳过而无需预先检查。只有在用户询问 "正在播放什么" 或你需要推理设备/曲目时才检查状态。
- **除非被要求，否则不要描述搜索结果。** 如果用户说 "播放 X"，搜索，获取顶部 URI，播放它。如果错了，他们会听到。
- **不要在 `403 Premium required` 或 `403 No active device` 时重试。** 那些是永久性的，除非用户采取行动。
- **不要使用 `spotify_search` 按名称查找播放列表** — 那搜索的是公共 Spotify 目录。用户的播放列表来自 `spotify_playlists list`。
- **不要在 `spotify_library` 中混合 `kind: "tracks"` 和专辑 URI**（反之亦然）。工具会标准化 ID，但 API 端点不同。