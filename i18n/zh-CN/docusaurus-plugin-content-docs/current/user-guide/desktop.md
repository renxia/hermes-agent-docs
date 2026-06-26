---
sidebar_position: 3
title: "桌面应用"
description: "Hermes 原生桌面应用程序——一个经过精心打磨的体验，用于与 Hermes 进行聊天，支持工具输出流式传输、并排预览、文件浏览器、语音、定时任务（cron）、配置文件、技能和设置。适用于 macOS、Windows 和 Linux。"
---

# 桌面应用

Hermes 桌面应用程序是一个原生应用，它围绕着你从 CLI 和网关获取的**同一个智能体**构建——相同的配置、相同的 API 密钥、相同的会话、相同的技能、相同的记忆。它不是一个独立的产品或轻量级的克隆；它使用了相同的 Hermes 智能体核心和设置，并通过现代且精心设计的 UI 来驱动它。如果你在终端中使用 `hermes`，那么你设置的所有内容都已在此处实现，而你在此处所做的一切都会同步显示在那里。

它可在**macOS、Windows 和 Linux**上运行。

:::tip 哪个界面是哪个？
Hermes 有几个前端（front ends），它们都与同一个智能体进行交互：

- **桌面应用 (Desktop App)** (本页面) — 一个具有特定用途 UI 的原生应用程序，用于聊天、配置和管理。
- **CLI** (`hermes`) 和 **[TUI](./tui.md)** (`hermes --tui`) — 终端界面。
- **[Web Dashboard](./features/web-dashboard.md)** (`hermes dashboard`) — 一个浏览器管理员面板；其可选的**聊天 (Chat)** 标签页通过伪终端嵌入了 TUI。

选择最适合当前需求的那个。它们共享状态，因此你可以在一个应用中开始会话，然后在另一个应用中恢复它。
:::

## 安装

请遵循 [Hermes 桌面应用程序的安装说明](../getting-started/installation.md)。

如果你已经安装了 Hermes，只需运行

```bash
hermes desktop
```

这将使用你当前的配置、密钥、会话和技能。

## 应用功能

桌面应用设计为一个聊天优先的窗口，配有一个用于导航的侧边栏。它旨在支持管理多个同时进行的智能体对话、配置消息提供商、创建工件、浏览项目文件夹结构以及同时处理多个项目。

### 聊天

这是应用的中心部分。您将获得：

- **流式响应**，实时显示工具活动和结构化的工具调用摘要，以供智能体工作。
- **与所有其他 Hermes 界面相同的对话历史记录**——在此处开始的会话可以在 CLI/TUI 中恢复，反之亦然。
- **拖放文件**到聊天区域的任何位置，将其附加到您的下一条消息中。
- **右侧预览栏**——边聊天时，即可并排渲染网页、文件和工具输出。
- **合成器历史记录和队列编辑**——在空白的合成器中按下上/下箭头键，即可调出和重用先前的提示，并在消息发送之前编辑已排队的消息。

#### 状态栏

位于聊天底部的一条栏显示实时的会话状态，并提供快速控制功能，而无需打开设置：

- **按会话划分的 YOLO 开关**——仅针对当前会话翻转开启或关闭 YOLO（与 TUI 一致）。YOLO 会绕过危险命令审批提示，因此请了解您正在禁用什么功能——参阅 [Security → YOLO 模式](./security.md#yolo-mode)。

是否在另一台机器上与 Hermes 实例进行聊天，而不是使用捆绑的本地后端？请参阅下方的 [Connecting to a remote backend](#connecting-to-a-remote-backend)（连接到远程后端）——关于远程托管仪表板工作原理的完整图景（身份验证网关、`/api/ws` 聊天套接字和 WebSocket 关闭代码分诊），请参阅 [Web Dashboard → Connecting Hermes Desktop to a remote backend](./features/web-dashboard.md#connecting-hermes-desktop-to-a-remote-backend)。

#### 选择模型

模型选择器位于**合成器**中，在麦克风图标的左侧。点击它可以在一个下拉菜单中切换模型、推理工作量和快速模式。

- **合成器选择器是粘性 UI 状态，永不触碰您的默认设置。** 它会本地记住（按设备），并且在新的聊天和重启后**保持一致**，而不是跳回默认值——请选择一个模型，下次使用 `Cmd/Ctrl+N` 时它就会以该模型打开。对于实时聊天，切换模型会将更改限定在该**当前聊天**中；无论哪种方式，一旦会话创建/切换，选择都会随之保留，并且**绝不会**写入配置文件默认值。（切换 [profiles](#sessions--profiles) 会重新设置到该配置文件的默认值。）
- **在 Settings → Model 中设置默认值。** 这个“主”模型是您的**按配置文件划分的全局默认值**——它是新聊天、cron 任务、智能体和辅助任务启动的基础，也是唯一会写入此项的地方。每个 [profile](#sessions--profiles) 都保留自己的默认值。
- **按模型的工作量/快速预设。** 每个模型都会记住自己在桌面应用中的推理工作量和快速模式选择，并在您选择该模型时重新应用于会话。这些预设是桌面端的便利功能，不会更改 cron 任务或智能体。

### 文件浏览器

在不离开应用的情况下探索和预览工作目录——这对于跟踪智能体读取、写入和编辑文件非常有用。使用 `hermes desktop --cwd <path>`（或 `HERMES_DESKTOP_CWD` 环境变量）设置初始项目目录。

### 语音

与 Hermes 对话并听取反馈，这是其他地方可用的相同 [voice mode](./features/voice-mode.md)。在 macOS 上，操作系统将提示一次麦克风权限。

### 设置和入门引导

从真实的 UI 而不是编辑 YAML 来管理提供商、模型、工具和凭证。首次运行的入门引导可在几秒内完成您的第一条消息。设置面板涵盖了提供商/密钥、模型选择、工具集配置、MCP 服务器、网关和会话管理。

- **提供商设置面板**——一个专门用于管理推理提供商的地方，提供了账户/API 密钥的用户体验，用于登录和按提供商存储凭证。
- **菜单中的每个提供商和模型**——GUI 显示完整的提供商列表以及 `hermes model` 所知晓的所有模型，因此您是从 CLI 看到的而不是一个精选子集相同的目录中进行选择。
- **xAI Grok OAuth**——Grok 是启动器中的一流 OAuth 提供商；像其他 OAuth 提供商一样通过浏览器流程登录。
- **来自 GUI 的工具后端安装**——直接从应用中运行工具后设置步骤，而不是转到终端。
- **辅助模型警告**——如果您在辅助任务（标题、摘要和类似助手）仍绑定到另一个提供商时更改主模型到一个新的提供商，则应用会发出警告，以防您不知不觉地将工作分散到两个提供商上。

首次运行的入门引导已基于统一的覆盖设计系统进行了重新设计，您可以选择**稍后选择提供商**来跳过提供商设置并先进入应用。

### 管理面板

该应用还提供了更广泛的 Hermes 管理界面，这样您就不必转到终端：

- **Skills（技能）**——浏览、安装和管理 [skills](./features/skills.md)。
- **Cron**——查看和管理 [scheduled jobs](../reference/cli-commands.md#hermes-cron)。
- **Profiles（配置文件）**——在 [Hermes profiles](./profiles.md) 之间切换（隔离的配置/技能/会话）。
- **Messaging（消息传递）**——设置网关通道。
- **Agents（智能体们）和 Command Center（命令中心）**——用于多智能体工作的编排界面。

### 键盘和导航

- **命令调色板**——按下 **Cmd+K** (Windows/Linux 上的 Ctrl+K) 即可跳转到操作并从键盘上导航应用。
- **可重新绑定的快捷键**——设置中的快捷键面板允许您将应用的键盘快捷键映射到您自己的按键。
- **自定义缩放快捷键**——以半步增量放大界面，以便更精细地控制文本大小。
- **UI 语言切换器**——在应用内更改应用的界面语言，包括简体中文 (zh-Hans)。

### 会话和配置文件

- **会话列表大修**——一个经过重新设计的会话列表，包含存档和一般的会话卫生功能，以保持列表的可管理性，使其随着增长而不会失控。
- **按 ID 搜索会话**——通过其 ID 直接查找特定会话。
- **并发多配置文件会话**——同时在多个 [profiles](./profiles.md) 上运行会话，并使用跨配置文件的 `@session` 链接引用另一个配置文件的会话。

## 更新

应用会在后台检查更新，当有可用更新时提供一键式更新。

[手动更新流程](https://hermes-agent.nousresearch.com/docs/getting-started/updating) 也支持 GUI 操作。

## 卸载

打开**Settings → About → Danger zone**（设置 → 关于 → 危险区域），选择要移除的内容：

- **仅卸载聊天 GUI**——移除桌面应用及其数据；Hermes 智能体、您的配置和您的聊天记录将保留。（与 `hermes uninstall --gui` 相同。）
- **卸载 GUI + 智能体，保留我的数据**——移除应用和智能体，但会保留配置、聊天记录和秘密信息以供未来重新安装使用。（与 `hermes uninstall` 相同。）
- **彻底卸载所有内容**——移除应用、智能体和所有用户数据。（与 `hermes uninstall --full` 相同。）

应用会关闭以完成任务（清理是在它退出后运行的，以便它可以移除正在运行的应用包及其自己的 venv）。当未安装本地智能体时，智能体移除选项会自动隐藏（例如，连接到远程后端的 GUI-only “轻量级”客户端）。

您也可以从终端执行相同的操作——对于仅 GUI 的情况使用 `hermes uninstall --gui`，或者对于智能体也进行卸载，使用 `hermes uninstall` / `hermes uninstall --full`。

:::note
从**源代码检出**（一个 `hermes desktop` 开发构建）运行 `hermes uninstall --gui` 也会移除工作区中的 `node_modules` 和 `apps/desktop/{dist,release}` 构建输出，因为这些是 GUI 的构建产物。它们可以通过 `hermes desktop`（或 `npm install` + 重新构建）恢复——但如果您正在积极地修改桌面应用，请预料到之后需要重新安装依赖项。
:::

## CLI 参考：`hermes desktop`

要通过 CLI 启动，只需运行 `hermes desktop`。默认情况下，它会安装工作区 Node 依赖项，构建当前操作系统的未打包 Electron 应用，然后启动该软件包产物。

| Flag | Description (描述) |
| :--- | :--- |
| `--skip-build` | 跳过 npm 安装/打包，并从 `apps/desktop/release` 启动现有的未打包应用 |
| `--force-build` | 强制完整重建，即使内容戳匹配 |
| `--build-only` | 构建桌面应用但不启动它（由 `hermes update` 使用） |
| `--source` | 不使用已打包的应用，而是通过 `electron .` 对 `apps/desktop/dist` 进行启动 |
| `--cwd PATH` | 桌面聊天会话的初始项目目录（设置 `HERMES_DESKTOP_CWD`） |
| `--hermes-root PATH` | 覆盖应用使用的 Hermes 源代码根目录（设置 `HERMES_DESKTOP_HERMES_ROOT`） |
| `--ignore-existing` | 强制应用忽略 `PATH` 上已有的任何 `hermes` CLI，以进行后端解析 |
| `--fake-boot` | 启用确定性的启动延迟，用于验证启动 UI |

## 工作原理

打包的应用包含了 Electron shell 和一个原生的 React 聊天界面。首次运行时，它可以将 Hermes Agent runtime 安装到 `HERMES_HOME`（`~/.hermes` 或 Windows 上的 `%LOCALAPPDATA%\hermes`）——**与 CLI 安装使用的相同布局**，这就是两者可以互换的原因。后端解析首先优先考虑 `HERMES_DESKTOP_HERMES_ROOT`，然后是已完成的管理安装，然后是 `PATH` 上被探测到的 `hermes`（除非设置了 `--ignore-existing` / `HERMES_DESKTOP_IGNORE_EXISTING=1`），最后是对 Nix 等打包工具的显式 `HERMES_DESKTOP_HERMES` 命令覆盖。React 渲染器通过 `tui_gateway`/dashboard API 与 `hermes dashboard` 后端通信，而不是嵌入 `hermes --tui`，而是重用智能体运行时。安装、后端解析和自我更新逻辑都存在于 Electron 主进程中。

## 连接到远程后端

默认情况下，应用会启动并管理自己的**本地**后端。您也可以将其指向在另一台机器上运行的 Hermes 后端——可以是 VPS、家庭服务器或 Tailscale 后的 Mini。

:::info 远程后端是一个正在运行的 `hermes dashboard` 进程
“远程后端”指的是一台远程机器上运行的 **`hermes dashboard`** 服务器——这是桌面应用连接的对象。除非该仪表板实际处于运行状态并且可达，否则本节中的任何内容都无法工作。桌面应用不会为您启动它；您（或一个 `systemd` 服务）负责在远程主机上保持 `hermes dashboard` 运行，而应用则附着到它上面。如果您还使用消息传递通道（Telegram、Discord 等），那么**网关**是一个*独立的*长期运行进程，需要您单独启动——请参阅设置步骤后的说明。
:::

该连接包含两个部分：在后端您需要用一个**身份验证提供商**来保护仪表板；在应用中，您输入后端的 URL 并登录。将仪表板绑定到一个非回环地址会自动激活其身份验证网关，而您配置的提供商决定了桌面应用是否能够通过。

**根据后端的所在地选择一个提供商：**

- **OAuth (Nous Portal) — 推荐用于任何超出本机可达范围的功能。** 登录会与您的 Nous 账户进行验证，因此这是适用于 VPS、公共主机或任何远程后端的选项。使用 `hermes dashboard register`（或门户 [`/local-dashboards`](https://portal.nousresearch.com/local-dashboards) 页面）将仪表板注册以配置其 OAuth 客户端，然后从应用中通过**Sign in with Nous Research**登录。如果您运行自己的身份提供商，一个自托管的 OIDC 提供商也适用相同的方式。
- **用户名/密码 — 仅限本地/信任网络使用。** 当后端位于同一信任 LAN 或只能通过 VPN（例如 Tailscale）访问时，这是最简单的选项。它用一个共享凭证来保护，而没有外部身份提供商，因此**请勿将其用于暴露给公共互联网的仪表板**——此时应选择 OAuth。

本节的其余部分展示了用户名/密码路径，因为它在信任网络上是最快的；有关 OAuth 路径，请参阅 [Web Dashboard → Default provider: Nous Research](./features/web-dashboard.md#default-provider-nous-research)。

### 在后端（远程机器）操作

设置一个用户名和密码，然后启动绑定到可达地址的仪表板。凭证存储在 `~/.hermes/.env`（秘密文件，模式 0600）：

```bash
# 1. 设置仪表板登录凭证。
cat >> ~/.hermes/.env <<'EOF'
HERMES_DASHBOARD_BASIC_AUTH_USERNAME=admin
HERMES_DASHBOARD_BASIC_AUTH_PASSWORD=choose-a-strong-password
# 推荐：一个稳定的签名密钥，以确保会话在重启后仍然有效。
# 如果没有它，每次启动都会生成一个随机密钥，您将在每次重启时被登出。
HERMES_DASHBOARD_BASIC_AUTH_SECRET=$(openssl rand -base64 32)
EOF
chmod 600 ~/.hermes/.env

# 2. 运行绑定到可达地址的仪表板。非回环绑定会激活身份验证网关；用户名/密码提供商负责登录。
hermes dashboard --no-open --host 0.0.0.0 --port 9119
```

请保持该 `hermes dashboard` 进程运行，以确保桌面应用能够连接——如果它停止了，应用将无法再到达后端。请在 `systemd`、`tmux` 或您选择的进程管理器下运行它，使其能够在用户注销和重启后存活。

另外，如果您依赖消息传递通道，请务必确保**网关正在运行**在远程主机上——桌面应用连接的是仪表板后端，但您的 Telegram/Discord/Slack 网关会话是另一个您需要独立启动并保持运行的进程。有关网关设置，请参阅 [Messaging](./messaging/index.md)。

不希望保留明文密码吗？可以将其设置为 scrypt 哈希（`HERMES_DASHBOARD_BASIC_AUTH_PASSWORD_HASH`）——使用 `python -c "from plugins.dashboard_auth.basic import hash_password; print(hash_password('PW'))"` 进行计算。完整的配置界面（config.yaml 键、每个环境变量、速率限制器）：[Web Dashboard → Username/password provider](./features/web-dashboard.md#usernamepassword-provider-no-oauth-idp)。

将仪表板作为 systemd 服务运行？请提供单元文件 `EnvironmentFile=%h/.hermes/.env`，以便凭证在启动时存在于环境中。

:::warning
仪表板会读取和写入您的 `.env`（API 密钥、秘密信息），并且可以运行智能体命令。上面展示的**用户名/密码**设置适用于信任网络——切勿将受密码保护的仪表板直接暴露给开放互联网；请将其置于 VPN 之后。[Tailscale](https://tailscale.com/) 是一个干净的选项：绑定到机器的 tailscale IP（`--host <tailscale-ip>`），并使用 `http://<tailscale-ip>:9119` 作为远程 URL，这样只有您的 tailnet 才能访问它。要通过公共互联网访问后端，请改用**OAuth (Nous Portal)** 提供商。
:::

### 在应用中操作

**Settings → Gateway → Remote gateway（设置 → 网关 → 远程网关）：**

1. **Remote URL（远程 URL）** — `http://<backend-host>:9119`（如果使用反向代理，路径前缀如 `/hermes` 是有效的）
2. **Sign in（登录）** — 应用会检测后端所宣传的提供商并相应地调整按钮。对于用户名/密码后端，它显示一个**Sign in** 按钮，打开一个凭证表单（输入第 1 步中的凭证）。对于 OAuth 后端，它显示 **Sign in with `<provider>`**（例如 *Sign in with Nous Research*），这会运行该提供商的浏览器登录。无论哪种方式，应用最终都会获得针对后端的已认证会话。
3. **Save and reconnect（保存并重新连接）** — 将桌面 shell 切换到远程后端。会话会自动刷新；如果设置了 `HERMES_DASHBOARD_BASIC_AUTH_SECRET`，则在重启时保持登录状态。

您也可以在启动应用之前通过 `HERMES_DESKTOP_REMOTE_URL` 环境变量（它会覆盖应用内设置）来设置后端 URL；但您仍然需要从网关设置面板中进行登录。

:::note 按配置文件划分的远程主机
远程网关主机是按 [profile](./profiles.md) 配置的，因此每个配置文件都可以指向自己的远程后端（或保持使用本地后端）。切换配置文件会改变应用连接到哪个远程主机。
:::

### 故障排除

- **使用 401 / “Invalid credentials”（无效凭证）登录失败** — 用户名或密码与后端的 `HERMES_DASHBOARD_BASIC_AUTH_USERNAME` / `HERMES_DASHBOARD_BASIC_AUTH_PASSWORD` 不匹配。后端会为未知用户和错误的密码返回相同的通用错误（没有枚举原语），因此请仔细检查两者。使用 `curl -s http://<host>:9119/api/status | jq '.auth_required, .auth_providers'` 确认网关是否开启——它应该报告 `true` 并包含 `"basic"`。
- **没有“Sign in”按钮，而是要求会话令牌** — 后端的用户名/密码提供商未激活。`/api/status` 不会在 `auth_providers` 中列出 `"basic"`。请确保在 `~/.hermes/.env` 中设置了用户名和密码（或密码哈希），并且仪表板进程确实加载了它们。
- **每次重启都已登出** — 设置 `HERMES_DASHBOARD_BASIC_AUTH_SECRET` 为一个稳定的值。如果没有它，令牌签名密钥会在每次启动时重新生成，从而使所有会话失效。
- **Connection refused / times out（连接被拒绝 / 超时）** — 后端绑定到 `127.0.0.1`（默认值）或防火墙/VPN 正在阻止该端口。请将其绑定到 `0.0.0.0` 或 tailscale IP，并打开端口以供您的信任网络访问。

有关从 Web Dashboard 角度进行的相同设置，请参阅 [Web Dashboard → Connecting Hermes Desktop to a remote backend](./features/web-dashboard.md#connecting-hermes-desktop-to-a-remote-backend)；环境变量已收录在 [Environment Variables → Web Dashboard & Hermes Desktop](../reference/environment-variables.md#web-dashboard--hermes-desktop)。

## 故障排除 (Troubleshooting)

引导日志文件位于 `HERMES_HOME/logs/desktop.log`（其中包含后端输出和最近的 Python 追溯信息）— 如果应用程序报告启动失败，请先检查此文件。您也可以从 CLI 中跟踪它：

```bash
hermes logs gui -f
```

常见的重置操作：

```bash
# 强制执行一次干净的首次启动设置 (macOS/Linux)
rm "$HOME/.hermes/hermes-agent/.hermes-bootstrap-complete"

# 重建损坏的 Python 虚拟环境 (venv) (macOS/Linux)
rm -rf "$HOME/.hermes/hermes-agent/venv"

# 重置卡住的 macOS 麦克风提示
tccutil reset Microphone com.nousresearch.hermes
```

### “构建桌面应用”卡在 Electron 下载上

构建过程会从 `github.com/electron/electron/releases` 下载 Electron 运行时（约 114&nbsp;MB）。如果安装程序在 **构建桌面应用** 步骤中挂起，并且实时输出重复显示 `retrying attempt=…`，则表明您的网络（防火墙、代理或地区）正在阻止或限制 GitHub。

安装程序会自动自我修复此问题：如果构建失败，它会 (1) 清除损坏的缓存 Electron zip 文件并重试；然后 (2) 如果仍然失败且您未设置 `ELECTRON_MIRROR`，则会通过 `npmmirror.com`（事实上的 Electron 社区镜像）再尝试一次。`@electron/get` 会进行 SHASUM 检查下载文件，但这些校验和来自同一个镜像——这只能检测到损坏或部分下载，而不能检测到镜像被篡改。如果您不信任第三方主机，请指定您自己的 `ELECTRON_MIRROR`（如下所示）；构建过程永远不会覆盖您设置的镜像。

要 **选择您自己的镜像**（例如公司/可信赖的镜像），请在安装之前或手动重建时设置 `ELECTRON_MIRROR` — 构建过程会尊重它并不会覆盖它：

```bash
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ \
  bash -c 'cd "$HOME/.hermes/hermes-agent/apps/desktop" && CSC_IDENTITY_AUTO_DISCOVERY=false npm run pack'
```

要手动清除损坏的缓存 zip 文件：

```bash
rm -f "$HOME/Library/Caches/electron"/electron-*.zip   # macOS
rm -f "$HOME/.cache/electron"/electron-*.zip            # Linux
```

## 从源代码构建 (Building from source)

如果您想对应用程序本身进行修改，请先从仓库根目录安装工作区依赖项，然后从 `apps/desktop` 运行开发服务器：

```bash
npm install          # 来自仓库根目录 — 会链接 apps/desktop, web, apps/shared
cd apps/desktop
npm run dev          # Vite renderer + Electron，它会启动 Python 后端
```

将应用程序指向特定的检出版本，或从您的真实配置中进行沙盒测试：

```bash
HERMES_DESKTOP_HERMES_ROOT=/path/to/clone npm run dev
HERMES_HOME=/tmp/throwaway npm run dev
npm run dev:fake-boot   # 使用确定性延迟来练习启动覆盖层 (startup overlay)
```

构建安装程序：

```bash
npm run dist:mac     # DMG + zip
npm run dist:win     # NSIS + MSI
npm run dist:linux   # AppImage + deb + rpm
npm run pack         # 位于 release/ 下的未压缩应用 (无安装程序)
```

macOS 和 Windows 的签名和公证（notarization）会在环境中存在相关凭据时自动运行（macOS 的 `CSC_LINK` / `CSC_KEY_PASSWORD` / `APPLE_*`，Windows 的 `WIN_CSC_*`）。

## 另请参阅 (See also)

- [CLI 指南](./cli.md) — 命令行界面
- [TUI](./tui.md) — 由 `hermes --tui` 和仪表板聊天标签使用的现代终端 UI
- [Web 仪表板](./features/web-dashboard.md) — 带嵌入式聊天标签的浏览器管理面板
- [配置](./configuration.md) — 桌面应用读取和写入的配置文件
- [Windows (原生)](./windows-native.md) — 原生 Windows 安装路径