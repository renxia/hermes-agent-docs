---
sidebar_position: 4
title: "教程：团队 Telegram 助手"
description: "分步指南，教您设置一个整个团队都可以用于代码帮助、研究、系统管理等的 Telegram 机器人"
---

# 设置团队 Telegram 助手

本教程将指导您设置一个由 Hermes Agent 驱动的 Telegram 机器人，供多个团队成员使用。完成本教程后，您的团队将拥有一个共享的 AI 助手，可以通过它来获取代码、研究、系统管理和任何其他方面的帮助——所有操作都通过用户级别的授权进行安全保护。

## 我们将构建什么

一个 Telegram 机器人，具备以下功能：

- **任何授权团队成员** 都可以私信寻求帮助——代码审查、研究、Shell 命令、调试
- **在您的服务器上运行**，并拥有完整的工具访问权限——终端、文件编辑、网络搜索、代码执行
- **用户级会话** — 每个用户都有自己独立的对话上下文
- **默认安全** — 只有批准的用户可以互动，并提供两种授权方式
- **定时任务** — 将每日站会、健康检查和提醒发送到团队频道

---

## 前提条件

开始之前，请确保您已具备以下条件：

- **在服务器或 VPS 上安装了 Hermes Agent**（不要安装在您的笔记本电脑上——机器人需要持续运行）。如果尚未安装，请遵循 [安装指南](/docs/getting-started/installation)。
- **您自己的 Telegram 账户**（机器人所有者）
- **配置了 LLM 提供商** — 至少在 `~/.hermes/.env` 中配置了 OpenAI、Anthropic 或其他受支持提供商的 API 密钥

:::tip
每月 5 美元的 VPS 足够运行网关。Hermes 本身非常轻量——消耗金钱的是 LLM API 调用，这些调用是在远程发生的。
:::

---

## 步骤 1：创建 Telegram 机器人

每个 Telegram 机器人都从 **@BotFather** 开始——这是 Telegram 官方用于创建机器人的机器人。

1. **打开 Telegram** 并搜索 `@BotFather`，或访问 [t.me/BotFather](https://t.me/BotFather)

2. **发送 `/newbot`** — BotFather 会向您询问两件事：
   - **显示名称** — 用户看到的名字（例如：`Team Hermes Assistant`）
   - **用户名** — 必须以 `bot` 结尾（例如：`myteam_hermes_bot`）

3. **复制机器人令牌** — BotFather 会回复类似以下内容：
   ```
   Use this token to access the HTTP API:
   7123456789:AAH1bGciOiJSUzI1NiIsInR5cCI6Ikp...
   ```
   保存此令牌——您在下一步需要用到它。

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
请务必保护好您的机器人令牌。拥有该令牌的任何人都可以控制机器人。如果泄露，请在 BotFather 中使用 `/revoke` 生成新的令牌。
:::

---

## 步骤 2：配置网关 (Gateway)

您有两种选择：交互式设置向导（推荐）或手动配置。

### 选项 A：交互式设置（推荐）

```bash
hermes gateway setup
```

此向导将引导您完成所有步骤，只需使用方向键选择即可。选择 **Telegram**，粘贴您的机器人令牌，并在提示时输入您的用户 ID。

### 选项 B：手动配置

将以下行添加到 `~/.hermes/.env`：

```bash
# 从 BotFather 获取的 Telegram 机器人令牌
TELEGRAM_BOT_TOKEN=7123456789:AAH1bGciOiJSUzI1NiIsInR5cCI6Ikp...

# 您的 Telegram 用户 ID（数字）
TELEGRAM_ALLOWED_USERS=123456789
```

### 查找您的用户 ID

您的 Telegram 用户 ID 是一个数字值（而不是您的用户名）。要查找它：

1. 在 Telegram 上给 [@userinfobot](https://t.me/userinfobot) 发消息
2. 它会立即回复您的数字用户 ID
3. 将该数字复制到 `TELEGRAM_ALLOWED_USERS`

:::info
Telegram 用户 ID 是永久的数字，例如 `123456789`。它们与您的 `@username` 不同，后者可能会改变。在白名单中使用数字 ID。
:::

---

## 步骤 3：启动网关

### 快速测试

首先在前台运行网关，以确保所有功能正常：

```bash
hermes gateway
```

您应该看到类似以下的输出：

```
[Gateway] Starting Hermes Gateway...
[Gateway] Telegram adapter connected
[Gateway] Cron scheduler started (tick every 60s)
```

打开 Telegram，找到您的机器人，并给它发送一条消息。如果它回复了，说明一切就绪。按 `Ctrl+C` 停止。

### 生产环境：安装为服务

为了实现持久化部署，即使重启后也能保持运行：

```bash
hermes gateway install
sudo hermes gateway install --system   # 仅限 Linux：系统级启动服务
```

这将创建一个后台服务：默认情况下，在 Linux 上是用户级别的 **systemd** 服务，在 macOS 上是 **launchd** 服务，如果传递 `--system` 则是在启动时运行的 Linux 系统服务。

```bash
# Linux — 管理默认用户服务
hermes gateway start
hermes gateway stop
hermes gateway status

# 查看实时日志
journalctl --user -u hermes-gateway -f

# 在 SSH 登出后保持运行
sudo loginctl enable-linger $USER

# Linux 服务器 — 显式系统服务命令
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
launchd plist 在安装时捕获了您的 shell PATH，以便网关子进程可以找到 Node.js 和 ffmpeg 等工具。如果您稍后安装了新工具，请重新运行 `hermes gateway install` 来更新 plist。
:::

### 验证是否正在运行

```bash
hermes gateway status
```

然后到 Telegram 给您的机器人发送一条测试消息。您应该在几秒内收到回复。

---

## 步骤 4：设置团队访问权限

现在让我们给您的队友开通权限。有两种方法。

### 方法 A：静态白名单

收集每位团队成员的 Telegram 用户 ID（让他们给 [@userinfobot](https://t.me/userinfobot) 发消息），并将他们作为逗号分隔的列表添加：

```bash
# 在 ~/.hermes/.env 中
TELEGRAM_ALLOWED_USERS=123456789,987654321,555555555
```

更改后重启网关：

```bash
hermes gateway stop && hermes gateway start
```

### 方法 B：私信配对（团队推荐）

私信配对更灵活——您不需要预先收集用户 ID。工作原理如下：

1. **队友私信机器人** — 由于他们不在白名单上，机器人会回复一个一次性配对代码：
   ```
   🔐 Pairing code: XKGH5N7P
   请将此代码发送给机器人所有者以批准。
   ```

2. **队友将代码发送给您**（通过任何渠道——Slack、电子邮件、当面）

3. **您在服务器上批准它**：
   ```bash
   hermes pairing approve telegram XKGH5N7P
   ```

4. **他们就进来了** — 机器人会立即开始回复他们的消息

**管理配对用户：**

```bash
# 查看所有待处理和已批准的用户
hermes pairing list

# 撤销某人的访问权限
hermes pairing revoke telegram 987654321

# 清除过期的待处理代码
hermes pairing clear-pending
```

:::tip
私信配对非常适合团队，因为添加新用户时不需要重启网关。批准立即生效。
:::

### 安全注意事项

- **切勿设置 `GATEWAY_ALLOW_ALL_USERS=true`** 给具有终端访问权限的机器人——任何找到您机器人的人都可能在您的服务器上运行命令
- 配对代码在 **1 小时** 后过期，并使用加密随机性
- 速率限制可防止暴力破解攻击：每个用户每 10 分钟最多 1 次请求，每个平台最多 3 个待处理代码
- 连续 5 次批准失败后，该平台将进入 1 小时的锁定状态
- 所有配对数据都以 `chmod 0600` 的权限存储

---

## 步骤 5：配置机器人

### 设置主频道 (Home Channel)

**主频道** 是机器人发送定时任务结果和主动消息的地方。如果没有主频道，定时任务将不知道将输出发送到哪里。

**选项 1:** 在任何机器人是成员的 Telegram 群组或聊天中，使用 `/sethome` 命令。

**选项 2:** 在 `~/.hermes/.env` 中手动设置：

```bash
TELEGRAM_HOME_CHANNEL=-1001234567890
TELEGRAM_HOME_CHANNEL_NAME="团队更新"
```

要查找频道 ID，请将 [@userinfobot](https://t.me/userinfobot) 添加到群组中——它会报告群组的聊天 ID。

### 配置工具进度显示

控制机器人使用工具时显示多少细节。在 `~/.hermes/config.yaml` 中：

```yaml
display:
  tool_progress: new    # off | new | all | verbose
```

| 模式 | 您看到的内容 |
|------|-------------|
| `off` | 仅显示干净的回复——无工具活动 |
| `new` | 每个新的工具调用都会显示简短状态（消息发送推荐） |
| `all` | 显示所有工具调用及其详细信息 |
| `verbose` | 完整的工具输出，包括命令结果 |

用户也可以在聊天中使用 `/verbose` 命令按会话更改此设置。

### 使用 SOUL.md 设置个性

通过编辑 `~/.hermes/SOUL.md` 来定制机器人的交流方式：

要获取完整指南，请参阅 [使用 SOUL.md 与 Hermes](/docs/guides/use-soul-with-hermes)。

```markdown
# Soul
你是一个乐于助人的团队助手。保持简洁和技术性。
对任何代码都使用代码块。跳过客套话——团队
更看重直接。调试时，在猜测解决方案之前，务必要求提供错误日志。
```

### 添加项目上下文

如果您的团队从事特定的项目，请创建上下文文件，让机器人了解您的技术栈：

```markdown
<!-- ~/.hermes/AGENTS.md -->
# 团队上下文
- 我们使用 Python 3.12 搭配 FastAPI 和 SQLAlchemy
- 前端使用 React 和 TypeScript
- CI/CD 在 GitHub Actions 上运行
- 生产部署到 AWS ECS
- 始终建议为新代码编写测试
```

:::info
上下文文件会被注入到每个会话的系统提示中。请保持简洁——每个字符都会消耗您的令牌预算。
:::

---

## 步骤 6：设置定时任务

网关运行后，您可以设置定期任务，将结果发送到您的团队频道。

### 每日站会摘要

在 Telegram 上给机器人发送消息：

```
每天工作日早上 9 点，请检查 github.com/myorg/myproject 上的 GitHub 仓库，查找：
1. 过去 24 小时打开/合并的拉取请求
2. 创建或关闭的问题
3. 主分支上的任何 CI/CD 失败
以简洁的站会摘要格式报告。
```

代理会自动创建一个定时任务，并将结果发送到您提问的聊天（或主频道）。

### 服务器健康检查

```
每 6 小时，使用 'df -h' 检查磁盘使用情况，使用 'free -h' 检查内存，
使用 'docker ps' 检查 Docker 容器状态。报告任何异常情况——
分区超过 80%、已重启的容器，或高内存使用率。
```

### 管理定时任务

```bash
# 从 CLI
hermes cron list          # 查看所有定时任务
hermes cron status        # 检查调度器是否正在运行

# 从 Telegram 聊天
/cron list                # 查看任务
/cron remove <job_id>     # 移除任务
```

:::warning
定时任务提示会在完全独立的新会话中运行，不会保留先前的对话记忆。请确保每个提示包含代理所需**所有**上下文——文件路径、URL、服务器地址和清晰的指令。
:::

---

## 生产环境提示

### 使用 Docker 增强安全性

对于共享的团队机器人，请使用 Docker 作为终端后端，这样代理命令将在容器中运行，而不是在您的主机上：

```bash
# 在 ~/.hermes/.env 中
TERMINAL_BACKEND=docker
TERMINAL_DOCKER_IMAGE=nikolaik/python-nodejs:python3.11-nodejs20
```

或者在 `~/.hermes/config.yaml` 中：

```yaml
terminal:
  backend: docker
  container_cpu: 1
  container_memory: 5120
  container_persistent: true
```

这样，即使有人要求机器人运行破坏性命令，您的主机系统也会受到保护。

### 监控网关

```bash
# 检查网关是否正在运行
hermes gateway status

# 查看实时日志 (Linux)
journalctl --user -u hermes-gateway -f

# 查看实时日志 (macOS)
tail -f ~/.hermes/logs/gateway.log
```

### 保持 Hermes 更新

通过 Telegram 发送 `/update` 给机器人——它将拉取最新版本并重启。或者从服务器执行：

```bash
hermes update
hermes gateway stop && hermes gateway start
```

### 日志位置

| 内容 | 位置 |
|------|----------|
| 网关日志 | `journalctl --user -u hermes-gateway` (Linux) 或 `~/.hermes/logs/gateway.log` (macOS) |
| 定时任务输出 | `~/.hermes/cron/output/{job_id}/{timestamp}.md` |
| 定时任务定义 | `~/.hermes/cron/jobs.json` |
| 配对数据 | `~/.hermes/pairing/` |
| 会话历史 | `~/.hermes/sessions/` |

---

## 更进一步

您已经拥有了一个可用的团队 Telegram 助手。以下是一些后续步骤：

- **[安全指南](/docs/user-guide/security)** — 深入了解授权、容器隔离和命令批准
- **[消息网关](/docs/user-guide/messaging)** — 网关架构、会话管理和聊天命令的完整参考
- **[Telegram 设置](/docs/user-guide/messaging/telegram)** — 平台特定的详细信息，包括语音消息和 TTS
- **[定时任务](/docs/user-guide/features/cron)** — 带有交付选项和 cron 表达式的高级定时调度
- **[上下文文件](/docs/user-guide/features/context-files)** — 用于项目知识的 AGENTS.md、SOUL.md 和 .cursorrules
- **[个性](/docs/user-guide/features/personality)** — 内置的个性预设和自定义角色定义
- **添加更多平台** — 相同的网关可以同时运行 [Discord](/docs/user-guide/messaging/discord)、[Slack](/docs/user-guide/messaging/slack) 和 [WhatsApp](/docs/user-guide/messaging/whatsapp)

---

*有问题或遇到问题？请在 GitHub 上提交 Issue——欢迎贡献。*