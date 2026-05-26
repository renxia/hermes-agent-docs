# Spotify

Hermes 智能体可以直接控制 Spotify——播放、队列、搜索、播放列表、已保存的曲目/专辑以及收听历史——通过使用 Spotify 的官方 Web API 和 PKCE OAuth。令牌存储在 `~/.hermes/auth.json` 中，并在遇到 401 错误时自动刷新；你只需在每台机器上登录一次。

与 Hermes 内置的 OAuth 集成（Google、GitHub Copilot、Codex）不同，Spotify 要求每个用户都注册自己的轻量级开发者应用。Spotify 不允许第三方发布任何人都能使用的公共 OAuth 应用。这大约需要两分钟，`hermes auth spotify` 命令会引导你完成整个过程。

## 先决条件

- 一个 Spotify 账户。**免费版**可用于搜索、播放列表、媒体库和活动工具。**高级版**才能进行播放控制（播放、暂停、跳过、定位、音量、添加到队列、转移播放）。
- 已安装并运行 Hermes 智能体。
- 对于播放工具：需要一个**活跃的 Spotify Connect 设备**——至少需要在一台设备（手机、桌面端、网页播放器、音箱）上打开 Spotify 应用，这样 Web API 才有东西可以控制。如果没有任何活跃设备，你将收到 `403 Forbidden` 错误和 "no active device" 消息；在任何设备上打开 Spotify 并重试即可。

## 设置

### 一键式：`hermes tools` 或首次运行设置

最快路径。运行：

```bash
hermes tools
```

滚动到 `🎵 Spotify`，按空格键将其开启，然后按 `s` 保存。首次运行的 `hermes setup` / `hermes setup tools` 流程中同样提供此开关。Spotify 默认为选择性启用，因此在那里启用它等同于运行与 `hermes tools` 相同的、感知提供商的配置。

Hermes 会将你直接带入 OAuth 流程——如果你还没有 Spotify 应用，它会引导你在流程中创建一个。完成后，工具集在一次操作中即被启用并完成身份验证。

如果你偏好分步执行（或之后重新验证），请使用下面的两步流程。

### 两步流程

#### 1. 启用工具集

```bash
hermes tools
```

将 `🎵 Spotify` 开启，保存，并在内嵌向导启动时，将其关闭（Ctrl+C）。工具集保持开启状态；仅将身份验证步骤推迟。

#### 2. 运行登录向导

```bash
hermes auth spotify
```

这 7 个 Spotify 工具只有在步骤 1 之后才会出现在智能体的工具集中——它们默认是关闭的，这样不需要它们的用户就不会在每次 API 调用时发送额外的工具模式。

如果没有设置 `HERMES_SPOTIFY_CLIENT_ID`，Hermes 会引导你完成应用的内嵌注册：

1. 在浏览器中打开 `https://developer.spotify.com/dashboard`
2. 打印需要粘贴到 Spotify "Create app" 表单中的精确值
3. 提示你输入获得的 Client ID
4. 将其保存到 `~/.hermes/.env`，以便未来的运行跳过此步骤
5. 直接继续进入 OAuth 授权同意流程

授权通过后，令牌将被写入 `~/.hermes/auth.json` 的 `providers.spotify` 部分。当前活跃的推理提供商不会更改——Spotify 身份验证独立于你的 LLM 提供商。

### 创建 Spotify 应用（向导要求的信息）

当仪表板打开时，点击 **Create app** 并填写：

| 字段 | 值 |
|-------|-------|
| App name | 任意名称（例如 `hermes-agent`） |
| App description | 任意描述（例如 `personal Hermes integration`） |
| Website | 留空 |
| Redirect URI | `http://127.0.0.1:43827/spotify/callback` |
| Which API/SDKs? | 勾选 **Web API** |

同意条款并点击 **Save**。在下一页点击 **Settings** → 复制 **Client ID** 并将其粘贴到 Hermes 的提示中。这是 Hermes 需要的唯一值——PKCE 不使用客户端密钥。

### 通过 SSH / 在无头环境中运行

如果设置了 `SSH_CLIENT` 或 `SSH_TTY`，Hermes 会在向导和 OAuth 步骤中跳过自动打开浏览器的操作。复制 Hermes 打印的仪表板 URL 和授权 URL，在本地机器上的浏览器中打开它们，并正常继续操作——本地 HTTP 监听器仍然在远程主机的端口 `43827` 上运行。你的笔记本浏览器无法在没有 SSH 本地转发的情况下访问远程回环地址：

```bash
ssh -N -L 43827:127.0.0.1:43827 user@remote-host
```

关于跳板机/堡垒机设置和其他注意事项（mosh、tmux、端口冲突），请参阅 [通过 SSH / 远程主机进行 OAuth](../../guides/oauth-over-ssh.md)。

## 验证

```bash
hermes auth status spotify
```

显示令牌是否存在以及访问令牌的过期时间。刷新是自动的：当任何 Spotify API 调用返回 401 时，客户端会交换刷新令牌并重试一次。刷新令牌在 Hermes 重启后仍然存在，因此只有在你撤销了 Spotify 账户设置中的应用授权或运行 `hermes auth logout spotify` 时才需要重新验证。

## 使用它

登录后，智能体可以访问 7 个 Spotify 工具。你可以自然地与智能体对话——它会选择正确的工具和操作。为了获得最佳行为，智能体会加载一个配套技能，该技能教授规范的使用模式（单次搜索后播放、何时不预检 `get_state` 等）。

```
> 播放一些迈尔斯·戴维斯的音乐
> 我在听什么
> 把这首歌添加到我的深夜爵士播放列表
> 跳到下一首歌
> 创建一个名为 "Focus 2026" 的新播放列表，并把我最近听的三首歌添加进去
> 我保存的专辑里有哪些是 Radiohead 的
> 搜索 Blackbird 的原声翻唱版本
> 将播放转移到我的厨房音箱
```

### 工具参考

所有会改变播放状态的操作都接受一个可选的 `device_id` 参数来指定目标设备。如果省略，Spotify 将使用当前活动的设备。

#### `spotify_playback`
控制和检查播放状态，以及获取最近播放历史。

| 操作 | 目的 | 需要 Premium？ |
|--------|---------|----------|
| `get_state` | 完整的播放状态（曲目、设备、进度、随机/重复播放） | 否 |
| `get_currently_playing` | 仅当前曲目（在 204 时返回空——见下文） | 否 |
| `play` | 开始/恢复播放。可选参数：`context_uri`、`uris`、`offset`、`position_ms` | 是 |
| `pause` | 暂停播放 | 是 |
| `next` / `previous` | 跳过曲目 | 是 |
| `seek` | 跳转到 `position_ms` | 是 |
| `set_repeat` | `state` = `track` / `context` / `off` | 是 |
| `set_shuffle` | `state` = `true` / `false` | 是 |
| `set_volume` | `volume_percent` = 0-100 | 是 |
| `recently_played` | 最近播放的曲目。可选参数 `limit`、`before`、`after`（Unix 毫秒时间戳） | 否 |

#### `spotify_devices`
| 操作 | 目的 |
|--------|---------|
| `list` | 你的账户可见的所有 Spotify Connect 设备 |
| `transfer` | 将播放转移到 `device_id`。可选参数 `play: true` 表示转移后开始播放 |

### Home Assistant 管理的音箱

如果 Home Assistant 管理的音箱已经支持 Spotify Connect（例如 Sonos、Echo、Nest 或其他支持 Connect 的音箱），每当 Spotify 能够发现它们时，它们会自动出现在 `spotify_devices list` 中。Hermes 不需要 Home Assistant ↔ Spotify 桥接器来实现此功能——Spotify 原生处理设备路由。

要求 Hermes 按音箱的显示名称转移播放（例如，“将 Spotify 转移到厨房音箱”），或者在编写脚本时调用 `spotify_devices list` 并将确切的 `device_id` 传递给 `spotify_devices transfer`。如果音箱缺失，请打开一次 Spotify 应用或音箱的 Spotify 集成，以便 Spotify 将其注册为活动的 Connect 目标。

#### `spotify_queue`
| 操作 | 目的 | 需要 Premium？ |
|--------|---------|----------|
| `get` | 当前队列中的曲目 | 否 |
| `add` | 将 `uri` 附加到队列 | 是 |

#### `spotify_search`
搜索目录。`query` 是必需参数。可选参数：`types`（`track` / `album` / `artist` / `playlist` / `show` / `episode` 数组）、`limit`、`offset`、`market`。

#### `spotify_playlists`
| 操作 | 目的 | 必需参数 |
|--------|---------|---------------|
| `list` | 用户的播放列表 | — |
| `get` | 一个播放列表及其曲目 | `playlist_id` |
| `create` | 新建播放列表 | `name`（+ 可选参数 `description`、`public`、`collaborative`） |
| `add_items` | 添加曲目 | `playlist_id`、`uris`（可选参数 `position`） |
| `remove_items` | 移除曲目 | `playlist_id`、`uris`（+ 可选参数 `snapshot_id`） |
| `update_details` | 重命名/编辑 | `playlist_id` + 以下任意参数：`name`、`description`、`public`、`collaborative` |

#### `spotify_albums`
| 操作 | 目的 | 必需参数 |
|--------|---------|---------------|
| `get` | 专辑元数据 | `album_id` |
| `tracks` | 专辑曲目列表 | `album_id` |

#### `spotify_library`
统一访问已保存的曲目和专辑。通过 `kind` 参数选择集合。

| 操作 | 目的 |
|--------|---------|
| `list` | 分页库列表 |
| `save` | 将 `ids` / `uris` 添加到库 |
| `remove` | 从库中移除 `ids` / `uris` |

必需参数：`kind` = `tracks` 或 `albums`，以及 `action`。

### 功能矩阵：免费版 vs Premium 版

只读工具适用于免费账户。任何会改变播放状态或队列的操作都需要 Premium。

| 免费可用 | 需要 Premium |
|---------------|------------------|
| `spotify_search`（全部） | `spotify_playback` — play、pause、next、previous、seek、set_repeat、set_shuffle、set_volume |
| `spotify_playback` — get_state、get_currently_playing、recently_played | `spotify_queue` — add |
| `spotify_devices` — list | `spotify_devices` — transfer |
| `spotify_queue` — get | |
| `spotify_playlists`（全部） | |
| `spotify_albums`（全部） | |
| `spotify_library`（全部） | |

## 调度：Spotify + cron

由于 Spotify 工具是常规的 Hermes 工具，因此在 Hermes 会话中运行的 cron 作业可以按任何计划触发播放。无需新代码。

### 早晨唤醒播放列表

```bash
hermes cron add \
  --name "morning-commute" \
  "0 7 * * 1-5" \
  "将播放转移到我的厨房音箱，并开始播放我的 'Morning Commute' 播放列表。音量设为 40。开启随机播放。"
```

每个工作日早上 7 点会发生什么：
1. Cron 启动一个无头的 Hermes 会话。
2. 智能体读取提示，调用 `spotify_devices list` 通过名称找到“厨房音箱”，然后调用 `spotify_devices transfer` → `spotify_playback set_volume` → `spotify_playback set_shuffle` → `spotify_search` + `spotify_playback play`。
3. 音乐在目标音箱上开始播放。总成本：一个会话，几次工具调用，无需人工干预。

### 夜晚放松

```bash
hermes cron add \
  --name "wind-down" \
  "30 22 * * *" \
  "暂停 Spotify。然后将音量设为 20，这样明天我再次启动时声音会很轻。"
```

### 注意事项

- **触发 cron 作业时必须存在活动设备。** 如果没有 Spotify 客户端正在运行（手机/桌面/Connect 音箱），播放操作将返回 `403 no active device`。对于早晨播放列表，诀窍是针对一个始终开启的设备（Sonos、Echo、智能音箱），而不是你的手机。
- **任何改变播放状态的操作都需要 Premium** — play、pause、skip、volume、transfer。只读的 cron 作业（例如计划“将我最近播放的曲目通过邮件发送给我”）在免费版上运行良好。
- **cron 智能体继承你当前活动的工具集。** Spotify 必须在 `hermes tools` 中启用，cron 会话才能看到 Spotify 工具。
- **Cron 作业运行时带有 `skip_memory=True`**，因此它们不会写入你的记忆存储。

完整的 cron 参考：[Cron 作业](./cron)。

## 退出登录

```bash
hermes auth logout spotify
```

这会从 `~/.hermes/auth.json` 中移除令牌。若还需清除应用配置，请从 `~/.hermes/.env` 中删除 `HERMES_SPOTIFY_CLIENT_ID`（以及您曾设置过的 `HERMES_SPOTIFY_REDIRECT_URI`），或重新运行配置向导。

要在 Spotify 端撤销该应用授权，请访问[已连接到您账户的应用](https://www.spotify.com/account/apps/)并点击 **REMOVE ACCESS**。

## 故障排除

**`403 Forbidden — Player command failed: No active device found`** — 您需要在至少一台设备上运行 Spotify。在手机、桌面或网页播放器上打开 Spotify 应用，播放任意曲目几秒以注册设备，然后重试。`spotify_devices list` 命令可显示当前可见的设备。

**`403 Forbidden — Premium required`** — 您正在使用免费账户尝试执行需要 Premium 的操作（如播放控制）。请参见上方的功能矩阵。

**`get_currently_playing` 返回 `204 No Content`** — 当前没有任何设备正在播放。这是 Spotify 的正常响应，并非错误；Hermes 会将其作为解释性的空结果返回（`is_playing: false`）。

**`INVALID_CLIENT: Invalid redirect URI`** — 您 Spotify 应用设置中的重定向 URI 与 Hermes 使用的不匹配。默认为 `http://127.0.0.1:43827/spotify/callback`。请将其添加到您应用的允许重定向 URI 列表中，或在 `~/.hermes/.env` 中设置 `HERMES_SPOTIFY_REDIRECT_URI` 为您注册的地址。

**`429 Too Many Requests`** — Spotify 的速率限制。Hermes 会返回友好的错误提示；请等待一分钟后重试。如果问题持续，您可能在脚本中运行了紧密循环 — Spotify 的配额大约每 30 秒重置一次。

**`401 Unauthorized` 持续出现** — 您的刷新令牌已被撤销（通常是因为您从账户中移除了该应用，或该应用已被删除）。请重新运行 `hermes auth spotify`。

**配置向导无法打开浏览器** — 如果您通过 SSH 连接或在没有显示器的容器中，Hermes 会检测到并跳过自动打开。请复制它打印的仪表板 URL 并手动打开。

## 高级：自定义权限范围

默认情况下，Hermes 会请求所有已发布工具所需的权限范围。如果您想限制访问权限，可以进行覆盖：

```bash
hermes auth spotify --scope "user-read-playback-state user-modify-playback-state playlist-read-private"
```

权限范围参考：[Spotify Web API 权限范围](https://developer.spotify.com/documentation/web-api/concepts/scopes)。如果您请求的范围少于某个工具所需的权限，该工具的调用将因 403 错误而失败。

## 高级：自定义客户端 ID / 重定向 URI

```bash
hermes auth spotify --client-id <id> --redirect-uri http://localhost:3000/callback
```

或在 `~/.hermes/.env` 中永久设置：

```
HERMES_SPOTIFY_CLIENT_ID=<your_id>
HERMES_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
```

重定向 URI 必须在您 Spotify 应用的设置中添加到允许列表。默认值适用于绝大多数人 — 仅当端口 43827 被占用时才需更改。

## 文件存储位置

| 文件 | 内容 |
|------|------|
| `~/.hermes/auth.json` → `providers.spotify` | 访问令牌、刷新令牌、过期时间、权限范围、重定向 URI |
| `~/.hermes/.env` | `HERMES_SPOTIFY_CLIENT_ID`、可选的 `HERMES_SPOTIFY_REDIRECT_URI` |
| Spotify 应用 | 由您在 [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) 拥有；包含客户端 ID 和重定向 URI 允许列表 |