# Spotify

Hermes 可以直接控制 Spotify——播放、队列、搜索、播放列表、已保存的曲目/专辑以及收听历史——使用 Spotify 官方的 Web API 配合 PKCE OAuth。令牌存储在 `~/.hermes/auth.json` 中，遇到 401 时自动刷新；每台机器只需登录一次（刷新令牌约 6 个月后过期；届时重新运行 `hermes auth spotify` 即可）。

与 Hermes 内置的 OAuth 集成（Google、GitHub Copilot、Codex）不同，Spotify 要求每位用户注册自己的轻量级开发者应用。Spotify 不允许第三方发布任何人都可以使用的公共 OAuth 应用。整个过程大约需要两分钟，`hermes auth spotify` 会引导你完成。

## 前置条件

- 一个 Spotify 账户。**免费版**适用于搜索、播放列表、媒体库和活动工具。**Premium（高级版）**才支持播放控制（播放、暂停、跳过、跳转、音量、添加队列、转移）。
- 已安装并运行 Hermes 智能体。
- 对于播放工具：需要一个**已激活的 Spotify Connect 设备**——至少一台设备（手机、桌面端、网页播放器、音箱）上必须打开 Spotify 应用，这样 Web API 才有可控制的对象。如果没有已激活的设备，你会收到 `403 Forbidden` 及"无活动设备"的提示信息；在任意设备上打开 Spotify 后重试即可。

## 设置

### 一次性配置：`hermes tools` 或首次运行设置

最快的方式。运行：

```bash
hermes tools
```

滚动到 `🎵 Spotify`，按空格键切换开启，然后按 `s` 保存。在首次运行 `hermes setup` / `hermes setup tools` 流程中也可以使用相同的切换选项。Spotify 保持为可选启用，因此在那里启用它与运行 `hermes tools` 一样会执行相同的感知提供商的配置。

Hermes 会直接带你进入 OAuth 流程——如果你还没有 Spotify 应用，它会引导你在线创建。完成后，工具集会在一次操作中同时启用和认证。

如果你更倾向于分步操作（或稍后重新认证），请使用下面的两步流程。

### 两步流程

#### 1. 启用工具集

```bash
hermes tools
```

切换 `🎵 Spotify` 开启，保存，当内联向导打开时，关闭它（Ctrl+C）。工具集保持开启状态；仅认证步骤被推迟。

#### 2. 运行登录向导

```bash
hermes auth spotify
```

只有在完成第 1 步后，7 个 Spotify 工具才会出现在智能体的工具集中——它们默认处于关闭状态，因此不想要这些工具的用户不会在每次 API 调用中附带额外的工具模式。

如果未设置 `HERMES_SPOTIFY_CLIENT_ID`，Hermes 会引导你在线完成应用注册：

1. 在浏览器中打开 `https://developer.spotify.com/dashboard`
2. 打印出需要粘贴到 Spotify "Create app" 表单中的确切值
3. 提示你输入返回的 Client ID
4. 将其保存到 `~/.hermes/.env`，以便后续运行跳过此步骤
5. 直接进入 OAuth 授权流程

授权批准后，令牌会写入 `~/.hermes/auth.json` 中的 `providers.spotify` 下。当前推理提供商**不会**被更改——Spotify 认证独立于你的 LLM 提供商。

### 创建 Spotify 应用（向导要求的内容）

仪表板打开后，点击 **Create app** 并填写：

| 字段 | 值 |
|-------|-------|
| App name | 任意名称（例如 `hermes-agent`） |
| App description | 任意描述（例如 `personal Hermes integration`） |
| Website | 留空 |
| Redirect URI | `http://127.0.0.1:43827/spotify/callback` |
| Which API/SDKs? | 勾选 **Web API** |

同意条款并点击 **Save**。在下一页点击 **Settings** → 复制 **Client ID** 并粘贴到 Hermes 提示符中。这是 Hermes 唯一需要的值——PKCE 不使用客户端密钥。

### 通过 SSH / 在无头环境中运行

如果设置了 `SSH_CLIENT` 或 `SSH_TTY`，Hermes 会在向导和 OAuth 步骤中跳过自动打开浏览器。复制 Hermes 打印的仪表板 URL 和授权 URL，在本地机器的浏览器中打开它们，然后继续正常操作——本地 HTTP 监听器仍在远程主机上的端口 `43827` 上运行。你的笔记本电脑的浏览器无法在没有 SSH 本地端口转发的情况下访问远程回环地址：

```bash
ssh -N -L 43827:127.0.0.1:43827 user@remote-host
```

关于跳板机/堡垒机设置和其他注意事项（mosh、tmux、端口冲突），请参阅 [OAuth over SSH / Remote Hosts](../../guides/oauth-over-ssh.md)。

## 验证

```bash
hermes auth status spotify
```

显示令牌是否存在以及访问令牌的过期时间。刷新是自动的：当任何 Spotify API 调用返回 401 时，客户端会交换刷新令牌并重试一次。刷新令牌在 Hermes 重启后仍然保留，因此只有在你在 Spotify 账户设置中撤销应用或运行 `hermes auth logout spotify` 时才需要重新认证。

## 使用

登录后，智能体可以访问 7 个 Spotify 工具。你自然地与智能体对话——它会选择合适的工具和操作。为了获得最佳行为，智能体加载一个配套技能，教授规范使用模式（单次搜索后播放、何时不需要预检 `get_state` 等）。

```
> play some miles davis
> what am I listening to
> add this track to my Late Night Jazz playlist
> skip to the next song
> make a new playlist called "Focus 2026" and add the last three songs I played
> which of my saved albums are by Radiohead
> search for acoustic covers of Blackbird
> transfer playback to my kitchen speaker
```

### 工具参考

所有会改变播放的操作都接受可选的 `device_id` 以指定目标设备。如果省略，Spotify 使用当前活跃设备。

#### `spotify_playback`
控制和检查播放，以及获取最近播放的历史记录。

| 操作 | 功能 | 需要 Premium? |
|--------|---------|----------|
| `get_state` | 完整播放状态（曲目、设备、进度、随机/重复） | 否 |
| `get_currently_playing` | 仅当前曲目（204 时返回空——见下文） | 否 |
| `play` | 开始/恢复播放。可选：`context_uri`、`uris`、`offset`、`position_ms` | 是 |
| `pause` | 暂停播放 | 是 |
| `next` / `previous` | 跳过曲目 | 是 |
| `seek` | 跳转到 `position_ms` | 是 |
| `set_repeat` | `state` = `track` / `context` / `off` | 是 |
| `set_shuffle` | `state` = `true` / `false` | 是 |
| `set_volume` | `volume_percent` = 0-100 | 是 |
| `recently_played` | 最近播放的曲目。可选 `limit`、`before`、`after`（Unix 毫秒） | 否 |

#### `spotify_devices`
| 操作 | 功能 |
|--------|---------|
| `list` | 你的账户可见的所有 Spotify Connect 设备 |
| `transfer` | 将播放转移到 `device_id`。可选 `play: true` 在转移时开始播放 |

### Home Assistant 管理的扬声器

如果 Home Assistant 管理着已支持 Spotify Connect 的扬声器（例如 Sonos、Echo、Nest 或其他支持 Connect 的扬声器），只要 Spotify 能看到它们，它们就会自动出现在 `spotify_devices list` 中。Hermes 不需要 Home Assistant ↔ Spotify 桥接来实现此路径——Spotify 原生处理设备路由。

让 Hermes 通过显示名称转移播放（例如，"transfer Spotify to the kitchen speaker"），或者在脚本化时调用 `spotify_devices list` 并将精确的 `device_id` 传递给 `spotify_devices transfer`。如果扬声器缺失，打开 Spotify 应用或扬声器的 Spotify 集成一次，以便 Spotify 将其注册为活跃的 Connect 目标。

#### `spotify_queue`
| 操作 | 功能 | 需要 Premium? |
|--------|---------|----------|
| `get` | 当前排队的曲目 | 否 |
| `add` | 将 `uri` 追加到队列 | 是 |

#### `spotify_search`
搜索目录。`query` 是必需的。可选：`types`（`track` / `album` / `artist` / `playlist` / `show` / `episode` 的数组）、`limit`、`offset`、`market`。

#### `spotify_playlists`
| 操作 | 功能 | 必需参数 |
|--------|---------|---------------|
| `list` | 用户的播放列表 | — |
| `get` | 单个播放列表 + 曲目 | `playlist_id` |
| `create` | 新建播放列表 | `name`（+ 可选 `description`、`public`、`collaborative`） |
| `add_items` | 添加曲目 | `playlist_id`、`uris`（可选 `position`） |
| `remove_items` | 移除曲目 | `playlist_id`、`uris`（+ 可选 `snapshot_id`） |
| `update_details` | 重命名/编辑 | `playlist_id` + 任意 `name`、`description`、`public`、`collaborative` |

#### `spotify_albums`
| 操作 | 功能 | 必需参数 |
|--------|---------|---------------|
| `get` | 专辑元数据 | `album_id` |
| `tracks` | 专辑曲目列表 | `album_id` |

#### `spotify_library`
统一访问已收藏的曲目和已收藏的专辑。使用 `kind` 参数选择集合。

| 操作 | 功能 |
|--------|---------|
| `list` | 分页的收藏列表 |
| `save` | 将 `ids` / `uris` 添加到收藏 |
| `remove` | 从收藏中移除 `ids` / `uris` |

必需：`kind` = `tracks` 或 `albums`，加上 `action`。

### 功能对比：免费版 vs Premium

只读工具可在免费版账户上使用。任何改变播放或队列的操作都需要 Premium。

| 免费版可用 | 需要 Premium |
|---------------|------------------|
| `spotify_search`（全部） | `spotify_playback` — play、pause、next、previous、seek、set_repeat、set_shuffle、set_volume |
| `spotify_playback` — get_state、get_currently_playing、recently_played | `spotify_queue` — add |
| `spotify_devices` — list | `spotify_devices` — transfer |
| `spotify_queue` — get | |
| `spotify_playlists`（全部） | |
| `spotify_albums`（全部） | |
| `spotify_library`（全部） | |

## 调度：Spotify + cron

由于 Spotify 工具是常规的 Hermes 工具，在 Hermes 会话中运行的 cron 任务可以在任何调度上触发播放。无需新代码。

### 早晨唤醒播放列表

```bash
hermes cron add \
  --name "morning-commute" \
  "0 7 * * 1-5" \
  "Transfer playback to my kitchen speaker and start my 'Morning Commute' playlist. Volume to 40. Shuffle on."
```

每个工作日上午 7 点会发生什么：
1. Cron 启动一个无头 Hermes 会话。
2. 智能体读取提示，调用 `spotify_devices list` 按名称查找 "kitchen speaker"，然后依次调用 `spotify_devices transfer` → `spotify_playback set_volume` → `spotify_playback set_shuffle` → `spotify_search` + `spotify_playback play`。
3. 音乐在目标扬声器上开始播放。总成本：一个会话，几次工具调用，无需人工输入。

### 夜间放松

```bash
hermes cron add \
  --name "wind-down" \
  "30 22 * * *" \
  "Pause Spotify. Then set volume to 20 so it's quiet when I start it again tomorrow."
```

### 注意事项

- **cron 触发时必须存在活跃设备。** 如果没有运行任何 Spotify 客户端（手机/桌面/Connect 扬声器），播放操作将返回 `403 no active device`。对于早晨播放列表的技巧是，以始终在线的设备（Sonos、Echo、智能扬声器）为目标，而不是你的手机。
- **任何改变播放的操作都需要 Premium** — play、pause、skip、volume、transfer。只读的 cron 任务（定时 "邮件发送我的最近播放曲目"）在免费版上运行良好。
- **cron 智能体继承你当前的工具集。** Spotify 必须在 `hermes tools` 中启用，cron 会话才能看到 Spotify 工具。
- **Cron 任务以 `skip_memory=True` 运行**，因此它们不会写入你的记忆存储。

完整的 cron 参考：[Cron Jobs](./cron)。

## 登出

```bash
hermes auth logout spotify
```

从 `~/.hermes/auth.json` 中移除令牌。要同时清除应用配置，从 `~/.hermes/.env` 中删除 `HERMES_SPOTIFY_CLIENT_ID`（如果设置了 `HERMES_SPOTIFY_REDIRECT_URI` 也一并删除），或重新运行向导。

要在 Spotify 端撤销应用访问权限，请访问 [Apps connected to your account](https://www.spotify.com/account/apps/) 并点击 **REMOVE ACCESS**。

## 故障排除

**`403 Forbidden — Player command failed: No active device found`** — 你需要在至少一个设备上运行 Spotify。在手机、桌面或网页播放器上打开 Spotify 应用，播放任意曲目一秒钟以使其注册，然后重试。`spotify_devices list` 显示当前可见的内容。

**`403 Forbidden — Premium required`** — 你使用的是免费版账户，但尝试使用改变播放的操作。请参见上面的功能对比。

**`204 No Content` on `get_currently_playing`** — 当前没有任何设备在播放。这是 Spotify 的正常响应，不是错误；Hermes 将其表示为带有说明的空结果（`is_playing: false`）。

**`INVALID_CLIENT: Invalid redirect URI`** — 你的 Spotify 应用设置中的重定向 URI 与 Hermes 使用的默认值 `http://127.0.0.1:43827/spotify/callback` 不匹配。要么将其添加到应用的允许重定向 URI 中，要么在 `~/.hermes/.env` 中设置 `HERMES_SPOTIFY_REDIRECT_URI` 为你注册的值。

**`429 Too Many Requests`** — Spotify 的速率限制。Hermes 返回一个友好的错误；等待一分钟后重试。如果持续存在，你可能在脚本中运行了一个紧密循环——Spotify 的配额大约每 30 秒重置一次。

**`401 Unauthorized` 反复出现** — 你的刷新令牌已被撤销（通常是因为你从账户中移除了应用，或应用被删除）。重新运行 `hermes auth spotify`。

**向导没有打开浏览器** — 如果你通过 SSH 连接或在没有显示器的容器中运行，Hermes 会检测到并跳过自动打开。复制它打印的仪表板 URL 并手动打开。

## 高级：自定义作用域

默认情况下，Hermes 会请求每个内置工具所需的所有作用域。如需限制访问，可进行覆盖：

```bash
hermes auth spotify --scope "user-read-playback-state user-modify-playback-state playlist-read-private"
```

作用域参考：[Spotify Web API 作用域](https://developer.spotify.com/documentation/web-api/concepts/scopes)。如果您请求的作用域少于某个工具所需，该工具的调用将以 403 错误失败。

## 高级：自定义客户端 ID / 重定向 URI

```bash
hermes auth spotify --client-id <id> --redirect-uri http://localhost:3000/callback
```

或在 `~/.hermes/.env` 中永久设置：

```
HERMES_SPOTIFY_CLIENT_ID=<your_id>
HERMES_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
```

重定向 URI 必须在您的 Spotify 应用设置中列入白名单。默认值适用于几乎所有人——仅在端口 43827 被占用时才需要更改。

## 各项配置所在位置

| 文件 | 内容 |
|------|----------|
| `~/.hermes/auth.json` → `providers.spotify` | 访问令牌、刷新令牌、过期时间、作用域、重定向 URI |
| `~/.hermes/.env` | `HERMES_SPOTIFY_CLIENT_ID`，可选的 `HERMES_SPOTIFY_REDIRECT_URI` |
| Spotify 应用 | 由您在 [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) 拥有；包含客户端 ID 和重定向 URI 白名单 |