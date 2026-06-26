---
sidebar_position: 4
---

# 同时运行多个网关 (Gateways)

在单台机器上，以托管服务的形式运行多个[配置档案 (profiles)](./profiles.md) — 每个配置档案都拥有自己的机器人令牌、会话和内存。本页面涵盖操作方面的考量：如何一次性启动它们、跨配置档案查看日志、防止主机休眠以及从常见的 launchd/systemd 怪癖中恢复。

如果你只运行一个 Hermes 智能体 (agent)，则不需要本页 — 请参阅[配置档案 (Profiles)](./profiles.md) 以了解基础知识。

## 何时使用此功能

当你需要两个或更多个同时在线的 Hermes 智能体时，就需要这个设置。常见的原因包括：

- 一个用于 Telegram 机器人的个人助理和一个用于编码的智能体
- 每个家庭成员一个智能体，或者每个 Slack 工作区一个智能体
- 同一配置文件的沙盒 (Sandbox) 和生产实例
- 一个研究智能体 + 一个写作智能体 + 一个由 cron 驱动的机器人 — 每个都拥有隔离的内存和技能

每个配置档案本身就拥有自己的平台级 LaunchAgent (`ai.hermes.gateway-<name>.plist`) 或 systemd 用户服务 (`hermes-gateway-<name>.service`)。本指南增加了集体管理这些网关的模式。

## 快速入门 (Quick start)

```bash
# 创建配置文件（只需一次）
hermes profile create coder
hermes profile create personal-bot
hermes profile create research

# 配置每个配置文件
coder setup
personal-bot setup
research setup

# 安装每个网关作为托管服务
coder gateway install
personal-bot gateway install
research gateway install

# 启动它们全部
coder gateway start
personal-bot gateway start
research gateway start
```

就是这样——三个独立的智能体，每个都在自己的进程中运行，在崩溃和用户登录时都会自动重启。

## 替代方案：一个网关服务所有配置文件（多路复用）(Alternative: one gateway for all profiles (multiplexing))

上述模型是**每个配置文件运行一个进程**。这是默认设置，也是大多数配置的最佳选择。但在拥有大量配置文件的宿主机上——或者在一个以“每个配置文件一个进程”操作量很大的容器部署中——您可以转而运行一个**单一的多路复用网关**：默认配置文件的网关将成为唯一的入口进程，负责为箱内*所有*配置文件提供服务。

这是**可选的**，并且**默认关闭**。当它关闭时，本页面的任何内容都不会改变——下面的所有行为都是惰性的。

### 何时选择多路复用 (When to prefer multiplexing)

- 容器/VPS部署中，N个监督单元、N个端口和N个PID文件构成了负担。
- 许多低流量的配置文件，它们各自不值得一个完整的进程。
- 您希望启动、监控和重启一件事物。

如果您需要配置文件之间进行硬性的进程级隔离（独立的内存占用、独立的崩溃域、在不影响其他配置文件的同时重启某个配置文件），请坚持使用“每个配置文件一个进程”模式。

### 如何启用 (How to opt in)

设置**默认配置文件**（它拥有多路复用器）的标志，并重启其网关：

```bash
hermes config set gateway.multiplex_profiles true
hermes gateway restart
```

等效地，在默认配置文件的 `~/.hermes/config.yaml` 中：

```yaml
gateway:
  multiplex_profiles: true
```

（该标志也接受作为顶级的 `multiplex_profiles: true` 以方便使用。）在下次启动时，默认网关会枚举所有配置文件，并在其自身的凭据下启动每个配置文件的启用平台，并将每个传入消息路由到它所属的配置文件。每次轮次都会解析被路由的配置、技能、内存、SOUL和**提供者密钥**——凭据绝不会在不同配置文件之间共享。

您**不需要**为二级配置文件运行 `hermes gateway start`——默认网关会为它们服务。请参阅下面的合同更改。

### 启用多路复用后发生了什么变化 (What changes when multiplexing is on)

启用该标志会改变一些事情的行为方式。一旦关闭该标志，所有这些都会恢复原状。

#### 1. 二级配置文件不得启动自己的网关 (Secondary profiles must not start their own gateway)

当多路复用器运行时，对命名配置文件的 `hermes gateway start` / `run` 是一个**硬错误**，它会指明多路复用器：

```
The default gateway is running as a profile multiplexer and already serves
profile 'coder'. ...
```

多路复用器是唯一的入口进程；第二个配置文件网关将重复绑定该配置文件的平台。仅当您故意需要为该配置文件设置一个单独的进程时，才使用 `--force`（在多路复用器运行时不推荐）。因此，本页面上文提到的跨配置文件生命周期包装脚本**不会**在多路复用模式中使用——您只需要管理默认网关。

#### 2. HTTP入口平台通过 `/p/<profile>/` URL 前缀访问 (HTTP-inbound platforms are reached via a `/p/<profile>/` URL prefix)

二级配置文件的 Webhook（以及其他 HTTP 入口）流量会到达默认监听器下的一个配置文件前缀，**而不是**第二个端口：

```
# 默认配置文件
POST http://host:8644/webhooks/<route>
# "coder" 配置文件的同一监听器
POST http://host:8644/p/coder/webhooks/<route>
```

前缀中不存在或未配置的配置文件会返回 `404`。由于这个共享的监听器已经以这种方式服务了所有配置文件，**二级配置文件不得自己启用一个端口绑定平台**——这样做是一个配置错误，网关将拒绝启动，并命名该配置文件和平台：

```
Profile 'coder' enables the port-binding platform 'webhook', but
gateway.multiplex_profiles is on. ... Remove platforms.webhook from profile
'coder's config.yaml (configure it only on the default profile).
```

受此规则约束的端口绑定平台包括：`webhook`、`api_server`、`msgraph_webhook`、`feishu`、`wecom_callback`、`bluebubbles`、`sms`。请**仅在默认配置文件上**配置其中任何一个；所有配置文件都可通过其 `/p/<profile>/` 前缀进行访问。

#### 3. 每个凭证的平台仍需要各自的令牌 (Per-credential platforms still need their own token per profile)

轮询/连接平台（Telegram、Discord、Slack、Matrix、Signal等）在多路复用下运行良好，但每个启用此类平台的配置文件都必须提供它**自己的**机器人令牌——同一个令牌不能同时被两个配置文件轮询。如果两个配置文件配置了相同的 `(platform, token)`，启动就会快速失败，并命名这两个配置文件（参见[Token-conflict safety](#token-conflict-safety) — 规则没有改变，只是现在在单个进程中强制执行）。

#### 4. 会话密钥按配置文件进行命名空间划分 (Session keys are namespaced by profile)

每个配置文件的会话都存储在 `agent:<profile>:…` 命名空间下，这样同一平台/聊天中的两个配置文件就不会在共享的会话存储中发生冲突。**默认**配置文件保持着历史性的 `agent:main:…` 命名空间，做到逐字节匹配，因此现有的默认配置文件会话不会受到影响——无需迁移，没有孤立的历史记录。

#### 5. 一个PID/锁和一个状态表面 (One PID/lock and one status surface)

存在一个单一的进程级PID和锁（多路复用器，位于默认主目录）。`hermes status` 会报告多路复用器及其所服务的配置文件；`hermes status -p <name>` 则针对单个配置文件进行切片。每个配置文件仍然在其自己的主目录下写入自己的 `runtime_status.json`，因此现有的按配置文件划分的读取器可以继续工作。

#### 不会改变的内容 (What does not change)

按配置文件的 `.env` 凭证隔离得到了保留，甚至更加严格：一个配置文件的密钥是从其自身的范围解析出来的，绝不会被合并到共享环境中（这也意味着 MCP 服务器和看板工人等子进程只会看到它们自己的配置文件秘密）。看板、按配置文件划分的技能/内存/SOUL以及模型路由都与使用单独网关时一样，完全按照配置文件进行。

## 一次性启动、停止或重启所有网关 (Start, stop, or restart all gateways at once)

CLI 附带单配置文件生命周期命令。要跨所有配置文件操作，请将它们包装在一个 shell 循环中。将下面的片段放入 `~/.local/bin/hermes-gateways` 并赋予执行权限：

```sh
#!/bin/sh
set -eu

# 在创建/删除配置文件时在此处添加或移除配置文件名称。
profiles="default coder personal-bot research"

usage() {
  echo "Usage: hermes-gateways {start|stop|restart|status|list}"
}

run_for_profile() {
  profile="$1"
  action="$2"
  if [ "$profile" = "default" ]; then
    hermes gateway "$action"
  else
    hermes -p "$profile" gateway "$action"
  fi
}

action="${1:-}"
case "$action" in
  start|stop|restart|status)
    for profile in $profiles; do
      echo "==> $action $profile"
      run_for_profile "$profile" "$action"
    done
    ;;
  list)
    hermes gateway list
    ;;
  *)
    usage
    exit 2
    ;;
esac
```

然后：

```bash
hermes-gateways start      # 启动所有配置的配置文件
hermes-gateways stop       # 停止所有配置的配置文件
hermes-gateways restart    # 重启所有
hermes-gateways status     # 查看所有状态
hermes-gateways list       # 委托给 `hermes gateway list`
```

:::tip
`default` 配置文件的操作是使用 `hermes gateway <action>`（不带 `-p`），而不是 `hermes -p default gateway <action>`。上面的包装器都处理了这两种形式。
:::

## 管理单个配置文件 (Manage one profile)

快捷命令为每个配置文件提供了：

```bash
coder gateway run        # 前台运行（Ctrl-C 停止）
coder gateway start      # 启动托管服务
coder gateway stop       # 停止托管服务
coder gateway restart    # 重启
coder gateway status     # 查看状态
coder gateway install    # 创建 LaunchAgent / systemd unit
coder gateway uninstall  # 移除服务文件
```

这些命令等同于 `hermes -p coder gateway <action>`——如果配置文件别名不在 `PATH` 中，或者您从脚本动态地针对配置文件进行操作时，这会很有用。

## 服务文件 (Service files)

每个配置文件都安装了自己的服务，并具有唯一的名称，因此不会发生冲突：

| 平台 | 路径 |
| -------- | ----------------------------------------------------------------- |
| macOS    | `~/Library/LaunchAgents/ai.hermes.gateway-<profile>.plist`        |
| Linux    | `~/.config/systemd/user/hermes-gateway-<profile>.service`         |

默认配置文件保留历史名称：`ai.hermes.gateway.plist` / `hermes-gateway.service`。

## 查看日志 (Viewing logs)

每个配置文件都写入自己的日志文件：

```bash
# 默认配置文件
tail -f ~/.hermes/logs/gateway.log
tail -f ~/.hermes/logs/gateway.error.log

# 命名配置文件
tail -f ~/.hermes/profiles/<name>/logs/gateway.log
tail -f ~/.hermes/profiles/<name>/logs/gateway.error.log
```

同时流式传输所有配置文件的日志：

```bash
tail -f ~/.hermes/logs/gateway.log ~/.hermes/profiles/*/logs/gateway.log
```

CLI 还提供了一个结构化日志查看器：

```bash
hermes logs -f                  # 跟踪默认配置文件
hermes -p coder logs -f         # 跟踪一个配置文件
hermes logs --help              # 过滤器、级别、JSON 输出
```

## 识别实际运行的内容 (Identify what's actually running)

```bash
hermes profile list             # 配置文件 + 模型 + 网关状态
hermes-gateways status          # 所有配置文件的完整状态
launchctl list | grep hermes    # macOS — PID 和标签
systemctl --user list-units 'hermes-gateway-*'   # Linux — 单元
```

## 编辑配置 (Editing configuration)

每个配置文件都将自己的配置保存在自己的目录中：

```
~/.hermes/profiles/<name>/
├── .env              # API 密钥、机器人令牌（chmod 600）
├── config.yaml       # 模型、提供者、工具集、网关设置
└── SOUL.md           # 人格 / 系统提示
```

默认配置文件直接使用 `~/.hermes/`，包含相同的三个文件。

使用任何编辑器或通过 CLI 进行编辑：

```bash
hermes config set model.model anthropic/claude-sonnet-4    # 默认配置文件
coder config set model.model openai/gpt-5                  # 命名配置文件
```

编辑 `.env` 或 `config.yaml` 后，请重启受影响的网关：

```bash
coder gateway restart
# 或者，针对所有配置：
hermes-gateways restart
```

## 保持宿主机清醒 (Keeping the host awake)

网关进程可以全天运行，但操作系统仍然会在空闲时尝试休眠。有两种模式：

### macOS — `caffeinate`

`caffeinate` 内建于 macOS 中，并在运行时防止系统休眠。无需安装。

```bash
caffeinate -dis                    # 阻止显示、空闲和系统休眠
caffeinate -dis -t 28800           # 相同，自动在 8 小时后退出
caffeinate -i -w $(cat ~/.hermes/gateway.pid) &   # 在默认网关运行时保持清醒

# 持久化：在后台运行并忘记它
nohup caffeinate -dis >/dev/null 2>&1 &
disown

# 检查 / 停止
pmset -g assertions | grep -iE 'caffeinate|prevent|user is active'
pkill caffeinate
```

| Flag   | 效果 |
| ------ | ------------------------------------------------- |
| `-d`   | 阻止显示休眠 |
| `-i`   | 阻止空闲系统休眠（默认） |
| `-m`   | 阻止磁盘休眠 |
| `-s`   | 阻止系统休眠（仅限 AC 供电的 Mac） |
| `-u`   | 模拟用户活动（防止屏幕锁定） |
| `-t N` | 在 `N` 秒后自动退出 |
| `-w P` | 当 PID `P` 退出时退出 |

:::warning 盖子合上仍然会使 Mac 休眠
`caffeinate` 不能覆盖硬件驱动的盖子关闭休眠功能。对于盖子关闭的操作，请更改您的节能/电池设置或使用第三方工具。
:::

### Linux — `systemd-inhibit` 或 `loginctl`

```bash
# 在命令运行时阻止挂起
systemd-inhibit --what=idle:sleep --who=hermes --why="gateways running" \
  sleep infinity &

# 允许用户服务在注销后继续运行（推荐）
sudo loginctl enable-linger "$USER"
```

启用持续运行功能后，您的 systemd 用户单元（包括 `hermes-gateway-<profile>.service`）将跨 SSH 断开和重启继续运行。

## 代币冲突安全

每个配置文件必须为每个平台使用唯一的机器人代币。如果两个配置文件共享一个Telegram、Discord、Slack、WhatsApp或Signal的代币，第二个网关将拒绝启动，并会报错指出冲突的配置文件。

审计方法：

```bash
grep -H 'TELEGRAM_BOT_TOKEN\|DISCORD_BOT_TOKEN' \
     ~/.hermes/.env ~/.hermes/profiles/*/.env
```

## 更新代码

`hermes update` 会一次性拉取最新代码，并将新的捆绑技能同步到每个配置文件中：

```bash
hermes update
hermes-gateways restart
```

用户修改过的技能永远不会被覆盖。

## 故障排除

### “无法在域中找到服务，用户gui: 501”

你在之前的 `hermes gateway stop` 之后运行了 `hermes gateway start`。CLI 的 `stop` 会执行完整的 `launchctl unload`，这会将服务从 launchd 的注册表中移除。CLI 在 `start` 时捕获到这个特定的错误，并自动重新加载 plist（`↻ launchd job was unloaded; reloading service definition`）。服务正常启动。无需修复。

### 崩溃后的僵尸PID (Stale PID)

如果某个配置文件的网关显示为 `not running`（未运行），但进程仍然存活：

```bash
ps -ef | grep "hermes_cli.*-p <profile>"
cat ~/.hermes/profiles/<profile>/gateway.pid
kill -TERM <pid>          # graceful (优雅地终止)
kill -KILL <pid>          # if that fails after a few seconds (如果几秒后仍失败，则强制终止)
<profile> gateway start
```

### 强制重置某个服务

```bash
# macOS
launchctl unload ~/Library/LaunchAgents/ai.hermes.gateway-<profile>.plist
launchctl load   ~/Library/LaunchAgents/ai.hermes.gateway-<profile>.plist

# Linux
systemctl --user restart hermes-gateway-<profile>.service
```

### 健康检查

```bash
hermes doctor                  # default profile (默认配置文件)
hermes -p <profile> doctor     # one profile (单个配置文件)
```