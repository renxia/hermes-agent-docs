# Spotify

Hermes 可以直接控制 Spotify —— 包括播放、队列、搜索、播放列表、已保存的曲目/专辑以及收听历史 —— 使用 Spotify 官方的 Web API 和 PKCE OAuth。令牌存储在 `~/.hermes/auth.json` 中，并在收到 401 响应时自动刷新；您只需在每台机器上登录一次。

与 Hermes 内置的 OAuth 集成（Google、GitHub Copilot、Codex）不同，Spotify 要求每个用户注册自己的轻量级开发者应用。Spotify 不允许第三方发布任何人都可以使用的公共 OAuth 应用。这大约需要两分钟，`hermes auth spotify` 会引导您完成该过程。

## 先决条件

- 一个 Spotify 账户。**免费版**适用于搜索、播放列表、音乐库和活动工具。**高级版**是播放控制（播放、暂停、跳过、定位、音量、添加到队列、转移）所必需的。
- 已安装并运行 Hermes 智能体。
- 对于播放工具：一个**活跃的 Spotify Connect 设备** —— Spotify 应用必须在至少一个设备（手机、桌面、网页播放器、扬声器）上打开，以便 Web API 有可控制的对象。如果没有活跃设备，您将收到 `403 Forbidden` 和“无活跃设备”消息；请在任意设备上打开 Spotify 并重试。

## 设置

### 一步到位：`hermes tools`

最快捷的方式。运行：

```bash
hermes tools
```

滚动到 `🎵 Spotify`，按空格键启用，然后按 `s` 保存。Hermes 会直接引导你进入 OAuth 流程——如果你还没有 Spotify 应用，它会引导你内联创建一个。完成后，工具集将一次性启用并认证。

如果你更愿意分步操作（或者稍后重新认证），请使用下面的两步流程。

### 两步流程

#### 1. 启用工具集

```bash
hermes tools
```

启用 `🎵 Spotify`，保存，当内联向导打开时，关闭它（Ctrl+C）。工具集保持启用状态；只有认证步骤被推迟。

#### 2. 运行登录向导

```bash
hermes auth spotify
```

7 个 Spotify 工具仅在步骤 1 完成后才出现在智能体的工具集中——它们默认是关闭的，因此不需要这些工具的用户不会在每个 API 调用中携带额外的工具模式。

如果未设置 `HERMES_SPOTIFY_CLIENT_ID`，Hermes 会引导你内联完成应用注册：

1. 在浏览器中打开 `https://developer.spotify.com/dashboard`
2. 打印出需要粘贴到 Spotify “创建应用”表单中的确切值
3. 提示你输入获得的客户端 ID
4. 将其保存到 `~/.hermes/.env`，以便后续运行跳过此步骤
5. 直接进入 OAuth 同意流程

在你批准后，令牌将写入 `~/.hermes/auth.json` 的 `providers.spotify` 下。活跃的推理提供者不会被更改——Spotify 认证与你的 LLM 提供者无关。

### 创建 Spotify 应用（向导要求的内容）

当仪表板打开时，点击 **创建应用** 并填写：

| 字段 | 值 |
|------|----|
| 应用名称 | 任意（例如 `hermes-agent`） |
| 应用描述 | 任意（例如 `个人 Hermes 集成`） |
| 网站 | 留空 |
| 重定向 URI | `http://127.0.0.1:43827/spotify/callback` |
| 使用哪些 API/SDK？ | 勾选 **Web API** |

同意条款并点击 **保存**。在下一页点击 **设置** → 复制 **客户端 ID** 并将其粘贴到 Hermes 提示中。这是 Hermes 唯一需要的值——PKCE 不使用客户端密钥。

### 通过 SSH 运行 / 在无头环境中运行

如果设置了 `SSH_CLIENT` 或 `SSH_TTY`，Hermes 会在向导和 OAuth 步骤中跳过自动打开浏览器的操作。复制 Hermes 打印的仪表板 URL 和授权 URL，在本地机器的浏览器中打开它们，然后正常继续——本地 HTTP 监听器仍在远程主机的 43827 端口上运行。如果需要通过 SSH 隧道访问它，请转发该端口：`ssh -L 43827:127.0.0.1:43827 remote`。

## 验证

```bash
hermes auth status spotify
```

显示令牌是否存在以及访问令牌何时过期。刷新是自动的：当任何 Spotify API 调用返回 401 时，客户端会交换刷新令牌并重试一次。刷新令牌在 Hermes 重启后仍然保留，因此你只需在 Spotify 账户设置中撤销应用或运行 `hermes auth logout spotify` 时重新认证。

## 使用

登录后，智能体可以访问 7 个 Spotify 工具。你可以自然地与智能体对话——它会选择合适的工具和操作。为了获得最佳行为，智能体会加载一个配套技能，用于教授规范的使用模式（例如先搜索再播放，何时不要预检 `get_state` 等）。

```
> 播放一些迈尔斯·戴维斯的作品
> 我在听什么
> 将这首歌曲添加到我的“深夜爵士”播放列表
> 跳到下一首歌
> 创建一个名为“专注 2026”的新播放列表，并添加我最近播放的三首歌曲
> 我收藏的专辑中哪些是电台司令的
> 搜索《Blackbird》的原声翻唱版本
> 将播放转移到我的厨房音箱
```

### 工具参考

所有会改变播放状态的操作都接受一个可选的 `device_id` 参数，用于指定特定设备。如果省略，Spotify 将使用当前活跃的设备。

#### `spotify_playback`
控制和检查播放状态，以及获取最近播放历史。

| 操作 | 用途 | 是否需要 Premium |
|------|------|------------------|
| `get_state` | 完整播放状态（曲目、设备、进度、随机/重复） | 否 |
| `get_currently_playing` | 仅当前曲目（204 时返回空——见下文） | 否 |
| `play` | 开始/恢复播放。可选参数：`context_uri`、`uris`、`offset`、`position_ms` | 是 |
| `pause` | 暂停播放 | 是 |
| `next` / `previous` | 跳过曲目 | 是 |
| `seek` | 跳转到 `position_ms` | 是 |
| `set_repeat` | `state` = `track` / `context` / `off` | 是 |
| `set_shuffle` | `state` = `true` / `false` | 是 |
| `set_volume` | `volume_percent` = 0-100 | 是 |
| `recently_played` | 最近播放的曲目。可选参数：`limit`、`before`、`after`（Unix 毫秒） | 否 |

#### `spotify_devices`
| 操作 | 用途 |
|------|------|
| `list` | 你的账户可见的所有 Spotify Connect 设备 |
| `transfer` | 将播放转移到 `device_id`。可选参数 `play: true` 会在转移时开始播放 |

#### `spotify_queue`
| 操作 | 用途 | 是否需要 Premium |
|------|------|------------------|
| `get` | 当前队列中的曲目 | 否 |
| `add` | 将 `uri` 添加到队列末尾 | 是 |

#### `spotify_search`
搜索目录。`query` 是必需的。可选参数：`types`（`track` / `album` / `artist` / `playlist` / `show` / `episode` 数组）、`limit`、`offset`、`market`。

#### `spotify_playlists`
| 操作 | 用途 | 必需参数 |
|------|------|----------|
| `list` | 用户的播放列表 | — |
| `get` | 一个播放列表 + 曲目 | `playlist_id` |
| `create` | 新建播放列表 | `name`（+ 可选 `description`、`public`、`collaborative`） |
| `add_items` | 添加曲目 | `playlist_id`、`uris`（可选 `position`） |
| `remove_items` | 移除曲目 | `playlist_id`、`uris`（+ 可选 `snapshot_id`） |
| `update_details` | 重命名 / 编辑 | `playlist_id` + `name`、`description`、`public`、`collaborative` 中的任意项 |

#### `spotify_albums`
| 操作 | 用途 | 必需参数 |
|------|------|----------|
| `get` | 专辑元数据 | `album_id` |
| `tracks` | 专辑曲目列表 | `album_id` |

#### `spotify_library`
统一访问已保存的曲目和已保存的专辑。使用 `kind` 参数选择集合。

| 操作 | 用途 |
|------|------|
| `list` | 分页库列表 |
| `save` | 将 `ids` / `uris` 添加到库 |
| `remove` | 从库中移除 `ids` / `uris` |

必需参数：`kind` = `tracks` 或 `albums`，以及 `action`。

### 功能矩阵：免费版 vs Premium

只读工具可在免费账户上使用。任何会改变播放状态或队列的操作都需要 Premium。

| 免费版可用 | 需要 Premium |
|------------|--------------|
| `spotify_search`（全部） | `spotify_playback` — play、pause、next、previous、seek、set_repeat、set_shuffle、set_volume |
| `spotify_playback` — get_state、get_currently_playing、recently_played | `spotify_queue` — add |
| `spotify_devices` — list | `spotify_devices` — transfer |
| `spotify_queue` — get | |
| `spotify_playlists`（全部） | |
| `spotify_albums`（全部） | |
| `spotify_library`（全部） | |

## 调度：Spotify + cron

由于 Spotify 工具是常规的 Hermes 工具，因此在 Hermes 会话中运行的 cron 作业可以按计划触发播放。无需编写新代码。

### 早晨唤醒播放列表

```bash
hermes cron add \
  --name "morning-commute" \
  "0 7 * * 1-5" \
  "将播放转移到我的厨房音箱并开始播放我的“早晨通勤”播放列表。音量设为 40。启用随机播放。"
```

每个工作日早上 7 点会发生什么：
1. Cron 启动一个无头 Hermes 会话。
2. 智能体读取提示，调用 `spotify_devices list` 按名称查找“厨房音箱”，然后依次调用 `spotify_devices transfer` → `spotify_playback set_volume` → `spotify_playback set_shuffle` → `spotify_search` + `spotify_playback play`。
3. 音乐开始在目标音箱上播放。总成本：一次会话，几次工具调用，无需人工干预。

### 晚上放松

```bash
hermes cron add \
  --name "wind-down" \
  "30 22 * * *" \
  "暂停 Spotify。然后将音量设为 20，以便明天再次启动时保持安静。"
```

### 注意事项

- **cron 触发时必须存在活跃设备。** 如果没有运行 Spotify 客户端（手机/桌面/Connect 音箱），播放操作将返回 `403 no active device`。对于早晨播放列表，诀窍是 targeting 一个始终在线的设备（如 Sonos、Echo 或智能音箱），而不是你的手机。
- **任何会改变播放状态的操作都需要 Premium** — play、pause、skip、volume、transfer。只读 cron 作业（例如定时“将我最近播放的曲目发送给我”）在免费版上可以正常工作。
- **cron 智能体会继承你当前启用的工具集。** 必须在 `hermes tools` 中启用 Spotify，cron 会话才能看到 Spotify 工具。
- **cron 作业运行时 `skip_memory=True`**，因此它们不会写入你的记忆存储。

完整的 cron 参考：[Cron 作业](./cron)。

## 退出登录

```bash
hermes auth logout spotify
```

从 `~/.hermes/auth.json` 中移除令牌。如果要同时清除应用配置，请从 `~/.hermes/.env` 中删除 `HERMES_SPOTIFY_CLIENT_ID`（如果你设置了 `HERMES_SPOTIFY_REDIRECT_URI`，也请一并删除），或重新运行向导。

要在 Spotify 端撤销应用，请访问[已连接到你账户的应用](https://www.spotify.com/account/apps/)并点击 **移除访问权限**。

## 故障排除

**`403 禁止访问 — 播放器命令失败：未找到活动设备`** — 您需要在至少一个设备上运行 Spotify。请在手机、桌面或网页播放器上打开 Spotify 应用，播放任意曲目一秒钟以进行注册，然后重试。`spotify_devices list` 命令会显示当前可见的设备。

**`403 禁止访问 — 需要 Premium 账户`** — 您正在使用免费账户尝试执行会改变播放状态的操作。请参阅上文的功能矩阵。

**`get_currently_playing` 返回 `204 无内容`** — 当前没有任何设备正在播放。这是 Spotify 的正常响应，并非错误；Hermes 将其显示为解释性的空结果（`is_playing: false`）。

**`INVALID_CLIENT: 无效的重定向 URI`** — 您的 Spotify 应用设置中的重定向 URI 与 Hermes 使用的 URI 不匹配。默认值为 `http://127.0.0.1:43827/spotify/callback`。请将该 URI 添加到您应用的允许重定向 URI 列表中，或者在 `~/.hermes/.env` 中设置 `HERMES_SPOTIFY_REDIRECT_URI` 为您注册的 URI。

**`429 请求过多`** — Spotify 的速率限制。Hermes 会返回友好的错误提示；请等待一分钟后重试。如果问题持续存在，您可能正在脚本中运行一个紧凑的循环 — Spotify 的配额大约每 30 秒重置一次。

**`401 未授权` 反复出现** — 您的刷新令牌已被撤销（通常是因为您从账户中移除了该应用，或者该应用已被删除）。请再次运行 `hermes auth spotify`。

**向导未打开浏览器** — 如果您通过 SSH 连接或在无显示器的容器中运行，Hermes 会检测到并跳过自动打开。请复制其打印的控制台 URL 并手动打开。

## 高级：自定义作用域

默认情况下，Hermes 会请求每个内置工具所需的作用域。如果您希望限制访问权限，可以覆盖默认设置：

```bash
hermes auth spotify --scope "user-read-playback-state user-modify-playback-state playlist-read-private"
```

作用域参考：[Spotify Web API 作用域](https://developer.spotify.com/documentation/web-api/concepts/scopes)。如果您请求的作用域少于某个工具所需的作用域，则该工具的调用将因 403 错误而失败。

## 高级：自定义客户端 ID / 重定向 URI

```bash
hermes auth spotify --client-id <id> --redirect-uri http://localhost:3000/callback
```

或者在 `~/.hermes/.env` 中永久设置它们：

```
HERMES_SPOTIFY_CLIENT_ID=<your_id>
HERMES_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
```

重定向 URI 必须在您的 Spotify 应用设置中被允许。默认设置对大多数人来说都适用 — 只有在端口 43827 被占用时才需要更改。

## 文件位置

| 文件 | 内容 |
|------|------|
| `~/.hermes/auth.json` → `providers.spotify` | 访问令牌、刷新令牌、过期时间、作用域、重定向 URI |
| `~/.hermes/.env` | `HERMES_SPOTIFY_CLIENT_ID`，可选的 `HERMES_SPOTIFY_REDIRECT_URI` |
| Spotify 应用 | 您在 [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) 上拥有的应用；包含客户端 ID 和重定向 URI 允许列表 |