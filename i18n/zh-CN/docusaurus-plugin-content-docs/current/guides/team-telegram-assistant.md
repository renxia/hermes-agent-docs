---
sidebar_position: 4
title: "教程：团队 Telegram 助手"
description: "逐步指南，指导您如何设置一个 Telegram 机器人，让整个团队都能用于代码帮助、研究、系统管理等"
---

# 设置团队 Telegram 助手

本教程将引导您设置一个由 Hermes Agent 驱动的 Telegram 机器人，您的多个团队成员都可以使用。完成后，您的团队将拥有一个共享的 AI 助手，他们可以通过消息寻求代码、研究、系统管理等方面的帮助——并通过每用户授权确保安全。

## 我们正在构建什么

一个 Telegram 机器人，它具有以下特点：

- **任何授权的团队成员**都可以通过私信寻求帮助——代码审查、研究、Shell 命令、调试
- **在您的服务器上运行**，具备完整的工具访问权限——终端、文件编辑、网络搜索、代码执行
- **每用户会话**——每个人都有自己的对话上下文
- **默认安全**——只有被批准的用户才能交互，并提供两种授权方法
- **定时任务**——每日站会、健康检查和提醒推送到团队频道

---

## 先决条件

开始之前，请确保您已具备：

- **在服务器或 VPS 上安装了 Hermes 智能体**（不要在笔记本电脑上安装——机器人需要持续运行）。如果尚未安装，请按照[安装指南](/getting-started/installation)操作。
- **您自己的 Telegram 账号**（机器人所有者）
- **配置了 LLM 提供商** —— 最起码在 `~/.hermes/.env` 文件中配置了 OpenAI、Anthropic 或其他受支持提供商的 API 密钥

:::tip
每月 5 美元的 VPS 完全足够运行网关。Hermes 本身很轻量——花钱的是 LLM API 调用，而这些调用是远程发生的。
:::

---

## 步骤一：创建 Telegram 机器人

每个 Telegram 机器人都始于 **@BotFather** —— Telegram 官方用于创建机器人的机器人。

1. **打开 Telegram** 并搜索 `@BotFather`，或访问 [t.me/BotFather](https://t.me/BotFather)

2. **发送 `/newbot`** —— BotFather 会问您两件事：
   - **显示名称** —— 用户看到的名字（例如 `Team Hermes Assistant`）
   - **用户名** —— 必须以 `bot` 结尾（例如 `myteam_hermes_bot`）

3. **复制机器人令牌** —— BotFather 会回复类似以下内容：
   ```
   Use this token to access the HTTP API:
   7123456789:AAH1bGciOiJSUzI1NiIsInR5cCI6Ikp...
   ```
   保存此令牌——下一步需要用到。

4. **设置描述**（可选但推荐）：
   ```
   /setdescription
   ```
   选择您的机器人，然后输入类似以下内容：
   ```
   Team AI assistant powered by Hermes Agent. DM me for help with code, research, debugging, and more.
   ```

5. **设置机器人命令**（可选——为用户提供命令菜单）：
   ```
   /setcommands
   ```
   选择您的机器人，然后粘贴：
   ```
   new - Start a fresh conversation
   model - Show or change the AI model
   status - Show session info
   help - Show available commands
   stop - Stop the current task
   ```

:::warning
请保管好您的机器人令牌。任何拥有此令牌的人都可以控制该机器人。如果泄露，请在 BotFather 中使用 `/revoke` 生成新令牌。
:::

---

## 步骤二：配置网关

您有两个选择：交互式设置向导（推荐）或手动配置。

### 选项 A：交互式设置（推荐）

```bash
hermes gateway setup
```

这将通过箭头键选择引导您完成所有操作。选择 **Telegram**，粘贴您的机器人令牌，并在提示时输入您的用户 ID。

### 选项 B：手动配置

将以下行添加到 `~/.hermes/.env`：

```bash
# Telegram bot token from BotFather
TELEGRAM_BOT_TOKEN=7123456789:AAH1bGciOiJSUzI1NiIsInR5cCI6Ikp...

# Your Telegram user ID (numeric)
TELEGRAM_ALLOWED_USERS=123456789
```

### 查找您的用户 ID

您的 Telegram 用户 ID 是一个数字值（不是您的用户名）。要找到它：

1. 在 Telegram 上向 [@userinfobot](https://t.me/userinfobot) 发送消息
2. 它会立即回复您的数字用户 ID
3. 将该数字复制到 `TELEGRAM_ALLOWED_USERS` 中

:::info
Telegram 用户 ID 是像 `123456789` 这样的永久数字。它们与您的 `@username` 不同，用户名可以更改。在允许列表中请始终使用数字 ID。
:::

---

## 步骤三：启动网关

### 快速测试

首先在前台运行网关以确保一切正常：

```bash
hermes gateway
```

您应该会看到类似以下输出：

```
[Gateway] Starting Hermes Gateway...
[Gateway] Telegram adapter connected
[Gateway] Cron scheduler started (tick every 60s)
```

打开 Telegram，找到您的机器人并给它发送一条消息。如果它回复了，说明您已成功。按 `Ctrl+C` 停止。

### 生产环境：安装为服务

为了在重启后也能持续运行：

```bash
hermes gateway install
sudo hermes gateway install --system   # 仅限 Linux：启动时的系统服务
```

这会创建一个后台服务：在 Linux 上默认是用户级的 **systemd** 服务，在 macOS 上是 **launchd** 服务，或者如果您传递了 `--system`，则是 Linux 启动时的系统服务。

```bash
# Linux — 管理默认用户服务
hermes gateway start
hermes gateway stop
hermes gateway status

# 查看实时日志
journalctl --user -u hermes-gateway -f

# SSH 登出后保持运行
sudo loginctl enable-linger $USER

# Linux 服务器 — 显式的系统服务命令
sudo hermes gateway start --system
sudo hermes gateway status --system
journalctl -u hermes-gateway -f
```

```bash
# macOS — 管理服务
hermes gateway start
hermes gateway stop
tail -f ~/.hermes/logs/gateway.log
```

:::tip macOS PATH
launchd plist 会在安装时捕获您 shell 的 PATH，以便网关子进程可以找到 Node.js 和 ffmpeg 等工具。如果您稍后安装了新工具，请重新运行 `hermes gateway install` 以更新 plist。
:::

### 验证是否正在运行

```bash
hermes gateway status
```

然后在 Telegram 上向您的机器人发送一条测试消息。您应该会在几秒钟内得到回复。

---

## 步骤四：设置团队访问权限

现在让我们授予您的团队成员访问权限。有两种方法。

### 方法 A：静态允许列表

收集每个团队成员的 Telegram 用户 ID（让他们向 [@userinfobot](https://t.me/userinfobot) 发送消息）并将其添加为逗号分隔的列表：

```bash
# 在 ~/.hermes/.env 中
TELEGRAM_ALLOWED_USERS=123456789,987654321,555555555
```

更改后重启网关：

```bash
hermes gateway stop && hermes gateway start
```

### 方法 B：私信配对（推荐用于团队）

私信配对更灵活——您不需要预先收集用户 ID。操作方法如下：

1. **团队成员向机器人发送私信** —— 由于他们不在允许列表中，机器人会回复一个一次性配对码：
   ```
   🔐 配对码：XKGH5N7P
   请将此代码发送给机器人所有者以供批准。
   ```

2. **团队成员将代码发送给您**（通过任何渠道——Slack、电子邮件、当面）

3. **您在服务器上批准它**：
   ```bash
   hermes pairing approve telegram XKGH5N7P
   ```

4. **他们就加入** —— 机器人立即开始回复他们的消息

**管理已配对的用户：**

```bash
# 查看所有待处理和已批准的用户
hermes pairing list

# 撤销某人的访问权限
hermes pairing revoke telegram 987654321

# 清除过期的待处理代码
hermes pairing clear-pending
```

:::tip
私信配对非常适合团队使用，因为在添加新用户时无需重启网关。批准会立即生效。
:::

### 安全注意事项

- **在具有终端访问权限的机器人上，切勿设置 `GATEWAY_ALLOW_ALL_USERS=true`** —— 任何找到您机器人都可以在您的服务器上运行命令
- 配对码在 **1 小时** 后过期，并使用加密随机性
- 速率限制可防止暴力攻击：每用户每 10 分钟 1 个请求，每个平台最多 3 个待处理代码
- 5 次批准尝试失败后，平台将锁定 1 小时
- 所有配对数据均以 `chmod 0600` 权限存储

---

## 步骤五：配置机器人

### 设置主频道

**主频道** 是机器人传递定时任务结果和主动消息的地方。没有主频道，定时任务将无处发送输出。

**选项 1：** 在机器人是成员的任何 Telegram 群组或聊天中使用 `/sethome` 命令。

**选项 2：** 在 `~/.hermes/.env` 中手动设置：

```bash
TELEGRAM_HOME_CHANNEL=-1001234567890
TELEGRAM_HOME_CHANNEL_NAME="Team Updates"
```

要查找频道 ID，请将 [@userinfobot](https://t.me/userinfobot) 添加到群组——它会报告群组的聊天 ID。

### 配置工具进度显示

控制机器人在使用工具时显示的详细程度。在 `~/.hermes/config.yaml` 中：

```yaml
display:
  tool_progress: new    # off | new | all | verbose
```

| 模式 | 您会看到的内容 |
|------|-------------|
| `off` | 仅简洁响应——无工具活动 |
| `new` | 每个新工具调用的简短状态（推荐用于消息传递） |
| `all` | 每个工具调用的详细信息 |
| `verbose` | 完整的工具输出，包括命令结果 |

用户也可以在聊天中使用 `/verbose` 命令按会话更改此设置。

### 使用 SOUL.md 设置机器人个性

通过编辑 `~/.hermes/SOUL.md` 自定义机器人的沟通方式：

完整指南，请参阅[在 Hermes 中使用 SOUL.md](/guides/use-soul-with-hermes)。

```markdown
# 灵魂
您是一个有用的团队助手。保持简洁和技术性。
对任何代码使用代码块。跳过客套——团队
重视直接性。调试时，在猜测解决方案之前，
始终要求提供错误日志。
```

### 添加项目上下文

如果您的团队处理特定项目，请创建上下文文件，以便机器人了解您的技术栈：

```markdown
<!-- ~/.hermes/AGENTS.md -->
# 团队上下文
- 我们使用 Python 3.12 配合 FastAPI 和 SQLAlchemy
- 前端是 React 配合 TypeScript
- CI/CD 在 GitHub Actions 上运行
- 生产环境部署到 AWS ECS
- 始终建议为新代码编写测试
```

:::info
上下文文件会被注入到每个会话的系统提示中。请保持简洁——每个字符都会占用您的令牌预算。
:::

---

## 步骤六：设置定时任务

网关运行后，您可以安排定期任务，将结果发送到您的团队频道。

### 每日站会总结

在 Telegram 上向机器人发送消息：

```
每个工作日上午 9 点，检查 GitHub 仓库
github.com/myorg/myproject 的以下情况：
1. 过去 24 小时内打开/合并的拉取请求
2. 创建或关闭的问题
3. main 分支上的任何 CI/CD 失败
格式为简要的站会式总结。
```

智能体会自动创建一个定时任务，并将结果发送到您提问的聊天中（或主频道）。

### 服务器健康检查

```
每 6 小时，使用 'df -h' 检查磁盘使用情况，使用 'free -h' 检查内存，
并使用 'docker ps' 检查 Docker 容器状态。报告任何异常情况——
分区使用率超过 80%、已重启的容器或高内存使用率。
```

### 管理定时任务

```bash
# 通过 CLI
hermes cron list          # 查看所有定时任务
hermes cron status        # 检查调度程序是否正在运行

# 通过 Telegram 聊天
/cron list                # 查看任务
/cron remove <job_id>     # 删除任务
```

:::warning
定时任务提示会在完全没有先前对话记忆的全新会话中运行。请确保每个提示都包含智能体所需的**所有**上下文——文件路径、URL、服务器地址和清晰的说明。
:::

---

## 生产环境提示

### 使用Docker确保安全

在共享团队机器人上，使用Docker作为终端后端，让智能体命令在容器内运行而非在宿主机上：

```bash
# 在 ~/.hermes/.env 中
TERMINAL_BACKEND=docker
TERMINAL_DOCKER_IMAGE=nikolaik/python-nodejs:python3.11-nodejs20
```

或在 `~/.hermes/config.yaml` 中：

```yaml
terminal:
  backend: docker
  container_cpu: 1
  container_memory: 5120
  container_persistent: true
```

这样，即使有人要求机器人运行破坏性命令，您的宿主机系统也能得到保护。

### 监控网关

```bash
# 检查网关是否运行中
hermes gateway status

# 实时查看日志 (Linux)
journalctl --user -u hermes-gateway -f

# 实时查看日志 (macOS)
tail -f ~/.hermes/logs/gateway.log
```

### 保持Hermes更新

通过Telegram，向机器人发送 `/update` — 它将拉取最新版本并重启。或从服务器执行：

```bash
hermes update
hermes gateway stop && hermes gateway start
```

### 日志位置

| 内容 | 位置 |
|------|------|
| 网关日志 | `journalctl --user -u hermes-gateway` (Linux) 或 `~/.hermes/logs/gateway.log` (macOS) |
| 定时任务输出 | `~/.hermes/cron/output/{job_id}/{timestamp}.md` |
| 定时任务定义 | `~/.hermes/cron/jobs.json` |
| 配对数据 | `~/.hermes/pairing/` |
| 会话历史 | `~/.hermes/sessions/` |

---

## 深入探索

您已拥有一个可运行的团队Telegram助手。以下是一些后续步骤：

- **[安全指南](/user-guide/security)** — 深入了解授权、容器隔离和命令审批
- **[消息网关](/user-guide/messaging)** — 网关架构、会话管理和聊天命令的完整参考
- **[Telegram设置](/user-guide/messaging/telegram)** — 包括语音消息和TTS在内的平台特定细节
- **[计划任务](/user-guide/features/cron)** — 高级定时调度与交付选项及Cron表达式
- **[上下文文件](/user-guide/features/context-files)** — 用于项目知识的AGENTS.md、SOUL.md和.cursorrules
- **[个性化设置](/user-guide/features/personality)** — 内置个性预设和自定义角色定义
- **添加更多平台** — 同一网关可同时运行[Discord](/user-guide/messaging/discord)、[Slack](/user-guide/messaging/slack)和[WhatsApp](/user-guide/messaging/whatsapp)

---

*有问题或遇到问题？请在GitHub上提出issue — 欢迎贡献。*