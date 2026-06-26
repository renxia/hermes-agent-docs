---
sidebar_position: 3
---

# 配置分发：分享一个完整的智能体

一个**配置分发**将一个完整的 Hermes 智能体（包括个性、技能、cron 作业、MCP 连接、配置）打包成一个 Git 仓库。任何有权限访问该仓库的人都可以用一条命令安装整个智能体，原地更新它，并保持他们自己的记忆、会话和 API 密钥不受影响。

如果一个[配置](./profiles.md) 是一个本地智能体，那么这个分发就是将该智能体使其可分享。

## 这意味着什么

在配置分发之前，分享一个 Hermes 智能体意味着需要发送给某人：

1. 你的 SOUL.md
2. 一份待安装的技能列表
3. 你的 config.yaml（不含密钥）
4. 关于你配置了哪些 MCP 服务器的描述
5. 你排定的任何 cron 作业
6. 设置哪些环境变量的说明

……然后祈祷他们能正确地组装起来。每一次版本更新或错误修复都意味着需要重复交接。

通过配置分发，所有这些内容都保存在一个 Git 仓库中：

```
my-research-agent/
├── distribution.yaml    # manifest: name, version, env-var requirements
├── SOUL.md              # the agent's personality / system prompt
├── config.yaml          # model, temperature, reasoning, tool defaults
├── skills/              # bundled skills that come with the agent
├── cron/                # scheduled tasks the agent runs
└── mcp.json             # MCP servers the agent connects to
```

接收方运行：

```bash
hermes profile install github.com/you/my-research-agent --alias
```

……他们现在拥有了完整的智能体。他们填入自己的 API 密钥（`.env.EXAMPLE` → `.env`），然后可以运行 `my-research-agent chat` 或通过 Telegram / Discord / Slack / 任何网关平台来与其交互。当你推送新版本时，他们运行 `hermes profile update my-research-agent` 并拉取你的更改——而他们的记忆和会话则保持不变。

## 为什么使用 git？

我们考虑过 tarball、HTTP 归档文件和自定义格式。但没有一个能超越 git：

- **作者无需构建步骤。** 推送到 GitHub；消费者即可安装。不存在“打包、上传、更新索引”的循环流程。
- **标签、分支和提交本身就是版本控制系统。** 一个标签推送所做的事情，对于其他工具来说相当于“打包 + 上传发布”。
- **更新即是拉取（fetch）。** 而不是重新下载整个归档文件。
- **透明化。** 用户可以浏览仓库，阅读不同版本之间的差异，发起相关的 Issues，克隆它以进行定制。
- **私人仓库免费可用。** SSH 密钥、`git credential` 助手、GitHub CLI 存储凭证——无论你的终端配置了哪种身份验证方式，都能透明地应用。
- **可重现性即是提交 SHA。** 这与 pip 和 npm 所记录的内容相同。

权衡点：接收者需要安装 git。在 2026 年运行 Hermes 的任何机器上，这都是既定事实。

## 何时应该使用分发包？

适用场景：

- **你正在分享一个专业的智能体** — 例如合规监控器、代码审查员、研究助理或客户支持机器人 — 给团队或社区。
- **你正在将同一个智能体部署到多台机器上**，不想每次都手动复制文件。
- **你正在迭代一个智能体**，希望接收者只需一条命令就能获取新版本。
- **你正在将一个智能体构建成产品** — 包含意见性的默认设置、精选技能和调整过的提示词——供其他人作为起点使用。

不适用场景：

- **你只是想备份自己机器上的一个配置文件。** 请使用 [`hermes profile export` / `import`](../reference/profile-commands.md#hermes-profile-export) — 这就是这些命令的用途。
- **你想和智能体一起分享 API 密钥。** `auth.json` 和 `.env` 被故意排除在分发包之外。每个安装程序都会自带其所需的凭证。
- **你想分享记忆/会话/对话历史记录。** 这些是用户数据，而不是分发内容。它们永远不会被打包发送。

:::caution
**Hermes 不控制 git。** 本页面描述的文件排除规则是在有人运行 `hermes profile install` 或 `hermes profile update` 时由**安装程序**应用的。这些规则在你运行 `git add` 或 `git commit` 时是**不**适用的。
:::

## 生命周期：作者 -> 安装器 -> 更新

下面是完整的端到端流程。请选择你关心的那一部分。

---

## 对于作者：发布分发包

### 第 1 步 — 从一个可用的配置文件开始

像处理任何其他配置文件的一样，构建和完善智能体：

```bash
hermes profile create research-bot
research-bot setup                    # 配置模型、API 密钥
# 编辑 ~/.hermes/profiles/research-bot/SOUL.md
# 安装技能，连接 MCP 服务器，安排 cron 作业等。
research-bot chat                     # 自我测试直到感觉合适
```

### 第 2 步 — 添加 `distribution.yaml`

创建 `~/.hermes/profiles/research-bot/distribution.yaml`：

```yaml
name: research-bot
version: 1.0.0
description: "Autonomous research assistant with arXiv and web tools"
hermes_requires: ">=0.12.0"
author: "Your Name"
license: "MIT"

# 告知安装程序智能体所需的环境变量。这些变量会与
# 安装程序的 shell 和现有的 .env 文件进行检查，以确保它们不会被
# 提示那些已经配置好密钥的键。
env_requires:
  - name: OPENAI_API_KEY
    description: "OpenAI API key (for model access)"
    required: true
  - name: SERPAPI_KEY
    description: "SerpAPI key for web search"
    required: false
    default: ""
```

这就是整个清单。除了 `name` 字段外，所有其他字段都有合理的默认值。

### 第 3 步 — 在首次提交前创建 `.gitignore`

:::warning
在运行 `git init` 或 `git add` **之前**执行此操作。如果你已经与该配置文件进行过聊天、运行了 setup 或以其他方式使用了它，那么该目录中现在包含了一些你不应该打包的文件：`.env`、`auth.json`、`memories/`、`sessions/`、`state.db*`、`logs/` 等。
:::

创建 `~/.hermes/profiles/research-bot/.gitignore`，至少包括以下内容：

```gitignore
# 凭证和秘密信息 — 切勿提交
auth.json
.env
.env.EXAMPLE    # 由安装程序生成，非作者域内文件

# 运行时数据库和状态
state.db
state.db-shm
state.db-wal
hermes_state.db
response_store.db
response_store.db-shm
response_store.db-wal
gateway.pid
gateway_state.json
processes.json
auth.lock
active_profile
.update_check

# 用户数据 — 切勿提交
memories/
sessions/
logs/
plans/
workspace/
home/

# 缓存和生成的文件
image_cache/
audio_cache/
document_cache/
browser_screenshots/
cache/

# 基础设施（不应在配置文件目录中，但可以排除）
hermes-agent/
.worktrees/
profiles/
bin/
node_modules/

# 用户定制命名空间 — 你的本地覆盖设置
local/

# 快照和备份（可能非常大）
checkpoints/
sandboxes/
backups/

# 日志
errors.log
.hermes_history
```

这与安装程序端剥离的 [硬排除路径](#whats-not-in-a-distribution-ever) 是对应的。任何你希望保留在仓库之外的内容（临时文件、大型资源、仅本地使用的技能）也应该包含在这里。

### 第 4 步 — 推送到 git 仓库

```bash
cd ~/.hermes/profiles/research-bot
git init
git add .
git commit -m "v1.0.0"
git remote add origin git@github.com:you/research-bot.git
git tag v1.0.0
git push -u origin main --tags
```

该仓库现在是一个分发包。任何有权限的人都可以安装它。

:::note
即使作者不小心将这些文件打包进去，安装程序也会剥离 [硬排除路径](#whats-not-in-a-distribution-ever) — 但这只保护安装程序，而不能保护作者。
:::

### 第 5 步 — 打上版本标签

每当智能体达到一个稳定的状态时，就增加版本号并打标签：

```bash
# 编辑 distribution.yaml: version: 1.1.0
git add distribution.yaml SOUL.md skills/
git commit -m "v1.1.0: tighter research SOUL, add arxiv skill"
git tag v1.1.0
git push --tags
```

运行 `hermes profile update research-bot` 的接收者将拉取最新版本。

### 仓库的样子

一个完整的作者发布的分发包：

```
research-bot/
├── .gitignore                   # 排除秘密信息和用户数据（参见第 3 步）
├── distribution.yaml            # 必需
├── SOUL.md                      # 强烈推荐
├── config.yaml                  # 模型、提供者、工具默认设置
├── mcp.json                     # MCP 服务器连接
├── skills/
│   ├── arxiv-search/SKILL.md
│   ├── paper-summarization/SKILL.md
│   └── citation-lookup/SKILL.md
├── cron/
│   └── weekly-digest.json       # 定时任务
└── README.md                    # 面向人类的描述（可选）
```

### 分发包所有 vs 用户所有

当安装程序更新到新版本时，有些内容会被替换（作者的领域），而有些内容会保持不变（安装者的领域）。默认设置如下：

| 类别 | 路径 | 更新时 |
|---|---|---|
| **分发包所有** | `SOUL.md`, `config.yaml`, `mcp.json`, `skills/`, `cron/`, `distribution.yaml` | 从新的克隆中替换 |
| **配置覆盖** | `config.yaml` | 默认情况下会被保留 — 安装程序可能调整了模型或提供者。运行 `--force-config` 来重置。 |
| **用户所有** | `memories/`, `sessions/`, `state.db*`, `auth.json`, `.env`, `logs/`, `workspace/`, `plans/`, `home/`, `*_cache/`, `local/` | 永远不会被触碰 |

你可以在清单中覆盖分发包所有列表：

```yaml
distribution_owned:
  - SOUL.md
  - skills/research/            # 仅我的研究技能；其他已安装的技能保持不变
  - cron/digest.json
```

如果省略，则应用上述默认设置——这正是大多数分发包所期望的。

---

## 对于安装器：使用分发包

### 安装

```bash
hermes profile install github.com/you/research-bot --alias
```

会发生什么：

1. 将仓库克隆到一个临时目录。
2. 读取 `distribution.yaml`，显示清单（名称、版本、描述、作者、所需的环境变量）。
3. 将每个必需的环境变量与你的 shell 环境和目标配置文件的现有 `.env` 进行比对。标记为 `✓ set` 或 `needs setting`，以便你知道需要配置哪些内容。
4. 询问确认。使用 `-y` / `--yes` 跳过。
5. 将分发包所有文件复制到 `~/.hermes/profiles/research-bot/`（或清单中 `name` 所解析到的任何位置）。即使作者意外地将这些文件保留在仓库中，它们也会在此复制过程中被剥离 [硬排除路径](#whats-not-in-a-distribution-ever)。
6. 写入包含必需键的 `.env.EXAMPLE` 文件——将其复制到 `.env` 并填写内容。
7. 使用 `--alias` 创建一个包装器，这样你就可以直接运行 `research-bot chat`。

### 源类型

任何 git URL 都适用：

```bash
# GitHub 简写
hermes profile install github.com/you/research-bot

# 完整 HTTPS
hermes profile install https://github.com/you/research-bot.git

# SSH
hermes profile install git@github.com:you/research-bot.git

# 自托管、GitLab、Gitea、Forgejo — 任何 Git 主机
hermes profile install https://git.example.com/team/research-bot.git

# 使用你配置的 git 身份验证的私人仓库
hermes profile install git@github.com:your-org/internal-bot.git

# 开发过程中的本地目录（无需 git push）
hermes profile install ~/my-profile-in-progress/
```

### 覆盖配置文件名

两个想要使用同一分发包但想使用不同配置名称的用户：

```bash
# Alice
hermes profile install github.com/acme/support-bot --name support-us --alias
# Bob（相同的分发包，不同的本地名称）
hermes profile install github.com/acme/support-bot --name support-eu --alias
```

### 填写环境变量

安装后，智能体的配置文件中会包含一个 `.env.EXAMPLE`：

```
# 此 Hermes 分发包所需的环境变量。
# 请将其复制到 .env 文件中并填写自己的值后再运行。

# OpenAI API key (for model access)
# (required)
OPENAI_API_KEY=

# SerpAPI key for web search
# (optional)
# SERPAPI_KEY=
```

复制它：

```bash
cp ~/.hermes/profiles/research-bot/.env.EXAMPLE ~/.hermes/profiles/research-bot/.env
# 编辑 .env，粘贴你真实的密钥
```

那些已经在你的 shell 环境中（例如在 `~/.zshrc` 中导出的 `OPENAI_API_KEY`）存在的必需密钥，在安装过程中会被标记为 `✓ set` — 你不需要将它们重复写入 `.env`。

### 检查已安装的内容

```bash
hermes profile info research-bot
```

显示内容：

```
Distribution: research-bot
Version:      1.0.0
Description:  Autonomous research assistant with arXiv and web tools
Author:       Your Name
Requires:     Hermes >=0.12.0
Source:       https://github.com/you/research-bot
Installed:    2026-05-08T17:04:32+00:00

Environment variables:
  OPENAI_API_KEY (required) — OpenAI API key (for model access)
  SERPAPI_KEY (optional) — SerpAPI key for web search
```

`hermes profile list` 也会显示一个 `Distribution` 列，这样你就可以一目了然地看到哪些配置文件来自仓库，哪些是你自己手工构建的：

```
 Profile          Model                        Gateway      Alias        Distribution
 ───────────────    ───────────────────────────    ───────────    ───────────    ────────────────────
 ◆default         claude-sonnet-4              stopped      —            —
  coder           gpt-5                        stopped      coder        —
  research-bot    claude-opus-4                stopped      research-bot research-bot@1.0.0
  telemetry       claude-sonnet-4              running      telemetry    telemetry@2.3.1
```

### 更新

```bash
hermes profile update research-bot
```

会发生什么：

1. 从记录的源 URL 重新克隆仓库。
2. 替换分发包所有文件（SOUL、技能、cron、mcp.json）。
3. **保留**你的 `config.yaml` — 你可能调整了模型、温度或其他设置。运行 `--force-config` 可以覆盖它。
4. **绝不触碰**用户数据：记忆、会话、身份验证、`.env`、日志、状态。

不会重新下载整个归档文件。不会覆盖你对配置所做的本地更改。不会删除你的对话历史记录。

### 删除

```bash
hermes profile delete research-bot
```

删除提示会在询问你确认之前显示分发包信息：

```
Profile: research-bot
Path:    ~/.hermes/profiles/research-bot
Model:   claude-opus-4 (anthropic)
Skills:  12
Distribution: research-bot@1.0.0
Installed from: https://github.com/you/research-bot

这将永久删除：
  • 所有配置、API 密钥、记忆、会话、技能、定时任务
  • 命令别名（~/.local/bin/research-bot）

输入 'research-bot' 进行确认：
```

这样你就永远不会在不知道它来自哪里或无法重新安装它的情况下意外删除一个智能体。

## 用例和模式

### 个人使用：跨机器同步一个智能体

你在一台笔记本电脑上构建了一个研究助手。你想在你的工作站上也拥有这个相同的智能体。

```bash
# 笔记本电脑 — 先创建 .gitignore (参见“作者须知”第 3 步)，然后：
cd ~/.hermes/profiles/research-bot
git init && git add . && git status   # 确认未暂存任何秘密信息
git commit -m "initial"
git remote add origin git@github.com:you/research-bot.git
git push -u origin main

# 工作站
hermes profile install github.com/you/research-bot --alias
# 填写 .env。完成。
```

笔记本电脑上的任何迭代（`git commit && push`）都会拉取到工作站，通过 `hermes profile update research-bot` 完成。记忆信息是按机器划分的——笔记本电脑记得自己的对话，工作站记得自己的，它们不会互相冲突。

### 团队使用：发布一个经过审查的内部智能体

你的工程团队想要一个具有特定 SOUL、特定技能，并且可以对所有 PR 进行检查的共享 PR 审查机器人。

```bash
# 工程主管 — 先创建 .gitignore (参见“作者须知”第 3 步)，然后：
cd ~/.hermes/profiles/pr-reviewer
# ... 构建和调整 ...
git init && git add . && git status   # 确认未暂存任何秘密信息
git commit -m "v1.0 PR reviewer"
git tag v1.0.0
git push -u origin main --tags    # 推送到公司内部 Git 主机

# 每个工程师
hermes profile install git@github.com:your-org/pr-reviewer.git --alias
# 用他们自己的 API 密钥（按他们计费）填写 .env，.env.EXAMPLE 指向所需的内容
pr-reviewer chat
```

当主管发布 v1.1（更好的 SOUL、新技能）时，工程师运行 `hermes profile update pr-reviewer`，几分钟内所有人都可以使用新版本。

### 社区使用：发布一个公共智能体

你构建了一些新颖的东西——也许是一个“Polymarket 交易员”或“学术论文摘要器”或“Minecraft 服务器操作助手”。你想分享它。

```bash
# 你 — 先创建 .gitignore (参见“作者须知”第 3 步)，然后：
cd ~/.hermes/profiles/polymarket-trader
# 在仓库根目录编写一个完善的 README.md — GitHub 会在仓库页面上显示它
git init && git add . && git status   # 确认未暂存任何秘密信息
git commit -m "v1.0"
git tag v1.0.0
# 发布到公共 GitHub 仓库
git remote add origin https://github.com/you/hermes-polymarket-trader.git
git push -u origin main --tags

# 任何人
hermes profile install github.com/you/hermes-polymarket-trader --alias
```

在推特上发布安装命令。尝试使用它的人会向你发送问题和 PR。如果有人想自定义，他们就进行分叉（fork）——这与每个人都已知的相同 Git 工作流程是一致的。

### 产品使用：发布一个有主见的智能体

你构建了基于 Hermes 的东西——也许是一个合规性监控套件、一个客户支持堆栈、一个特定领域的研究平台。你想将其作为产品分发。

```yaml
# distribution.yaml
name: telemetry-harness
version: 2.3.1
description: "Compliance telemetry harness — monitors and reviews regulated workflows"
hermes_requires: ">=0.13.0"
author: "Acme Compliance Inc."
license: "Commercial"

env_requires:
  - name: ACME_API_KEY
    description: "Your Acme Compliance license key (email support@acme.com)"
    required: true
  - name: OPENAI_API_KEY
    description: "OpenAI API key for model access"
    required: true
  - name: GRAPHITI_MCP_URL
    description: "URL for your Graphiti knowledge graph instance"
    required: false
    default: "http://127.0.0.1:8000/sse"
```

你的客户通过一个命令进行安装；安装预览会明确告诉他们需要准备哪些密钥；一旦你标记了一个新版本，更新就会推出；他们的合规数据（`memories/`、`sessions/`）永远不会离开他们的机器。

### 临时使用：共享基础设施上的一次性脚本

你是运维主管。你需要一个临时的智能体来诊断生产事故——一个具有正确工具和 MCP 连接的预设 SOUL，它将在未来一周内运行在三名值班工程师的笔记本电脑上。

```bash
# 你 — 先创建 .gitignore (参见“作者须知”第 3 步)，然后：
# 构建配置文件，提交，推送到私有仓库
git push -u origin main

# 每位值班工程师
hermes profile install git@github.com:your-org/incident-2026-q2.git --alias

# 事故解决后 — 销毁它
hermes profile delete incident-2026-q2
```

安装和删除的周期成本足够低廉，可以被当作一次性使用。

---

## 配方 (Recipes)

### 固定到特定版本

:::note
Git 版本固定（`#v1.2.0`）已计划但不在初始发布中——当前安装会跟踪默认分支。请通过 `hermes profile info <name>` 跟踪你安装的版本，并在准备好之前暂缓更新。
:::

### 检查自己所使用的版本与最新版本的差异

```bash
# 你安装的版本
hermes profile info research-bot | grep Version

# 最新的上游版本（不进行安装）
git ls-remote --tags https://github.com/you/research-bot | tail -5
```

### 在更新过程中保留本地配置自定义设置

默认的更新行为已经实现了这一点：`config.yaml` 会被保留。为了安全起见，请将你的本地修改写入一个该分发物不拥有的文件：

```yaml
# ~/.hermes/profiles/research-bot/local/my-overrides.yaml
# (分发物永远不会触碰 local/)
```

...并根据需要从 `config.yaml` 或你的 SOUL 中引用它。

### 强制进行一次干净的重新安装

```bash
# 彻底删除并从零开始重新安装（也会丢失记忆/会话）
hermes profile delete research-bot --yes
hermes profile install github.com/you/research-bot --alias

# 更新到当前的 main 分支，但将 config.yaml 重置为分发物的默认值
hermes profile update research-bot --force-config --yes
```

### 分叉和自定义

标准的 Git 工作流程——分发物只是仓库：

```bash
# 在 GitHub 上分叉该仓库，然后安装你的分叉版本
hermes profile install github.com/yourname/forked-research-bot --alias

# 在 ~/.hermes/profiles/forked-research-bot/ 中本地迭代
# 编辑 SOUL.md，提交，推送到你的分叉版本
# 上游更改：以常规方式拉取到你的分叉版本中
```

### 在推送之前测试一个分发物

从作者的机器上执行：

```bash
# 从本地目录安装（无需 git push）
hermes profile install ~/.hermes/profiles/research-bot --name research-bot-test --alias

# 调整、删除、重新安装直到正确为止
hermes profile delete research-bot-test --yes
hermes profile install ~/.hermes/profiles/research-bot --name research-bot-test
```

---

## 分发物中永远不会包含的内容

即使作者不小心推送了这些路径，安装程序也会强制排除它们。没有任何配置选项可以覆盖这一点——这个安全卫士是一个经过回归测试的不变式：

- `auth.json` — OAuth 令牌、平台凭证
- `.env` — API 密钥、秘密信息
- `memories/` — 对话记忆
- `sessions/` — 对话历史记录
- `state.db`, `state.db-shm`, `state.db-wal` — 会话元数据
- `logs/` — 智能体和错误日志
- `workspace/` — 生成的工作文件
- `plans/` — 草稿计划
- `home/` — Docker 后端中的用户主挂载点
- `*_cache/` — 图像 / 音频 / 文档缓存
- `local/` — 用户保留的自定义命名空间

当你将一个分发物克隆为安装程序时，这些内容就不会被复制到你的配置文件目录中。当你更新时，你的副本也会保持不变。如果你在五台机器上安装了同一个分发物，你就有五套隔离的数据——每台机器一套。

:::caution
此排除是在**安装/更新时的安装程序机器上**执行的。它**并不能**阻止作者提交敏感/不必要的文件。作者必须使用 [`.gitignore`](#step-3--create-a-gitignore-before-the-first-commit) 来将秘密信息排除在仓库之外。
:::

## 安全和信任

配置文件分发物默认是未签名的。你所信任的是：

- **Git 主机**（GitHub / GitLab / 无论哪里）能够提供作者推送的字节数据。
- **作者**不会发布恶意 SOUL、技能或定时任务。

来自分发物的定时任务**不会自动调度**——安装程序会打印 `hermes -p <name> cron list`，你需要显式地启用它们。SOUL.md 和技能在您开始与该配置文件聊天时就会激活，因此如果您是从不认识的人那里安装，请在第一次运行之前阅读它们。

一个粗略的比喻：安装一个分发物就像安装一个浏览器扩展或 VS Code 扩展。摩擦力小、功能强大，信任源头。对于内部公司分发物，使用私有仓库和正常的 Git 身份验证——无需配置任何新东西。

未来的版本可能会增加签名、带有已解析提交 SHA 的锁文件（`.distribution-lock.yaml`）以及一个在应用更新之前打印差异的 `--dry-run` 标志。这些目前都还没有发布。

## 底层工作原理 (Under the hood)

有关实现细节、精确的 CLI 行为和所有标志，请参阅 [Profile Commands 参考](../reference/profile-commands.md#distribution-commands)。

简而言：

- `install`、`update` 和 `info` 存在于 `hermes profile` 中——而不是一个平行的命令树。
- 清单（manifest）格式是 YAML，并包含一个微小的必需模式（仅包含 `name`）。
- 安装程序使用你本地的 `git` 二进制文件进行克隆，因此你的 shell 已经处理的所有身份验证（SSH 密钥、凭证助手）都会透明地生效。
- 克隆后，`.git/` 会被剥离——安装的配置文件本身不是一个 Git 检出，从而避免了“天哪，我不小心把 `.env` 提交到分发物的 Git 历史记录中”这样的陷阱。
- 保留的配置文件名称（`hermes`、`test`、`tmp`、`root`、`sudo`）在安装时会被拒绝，以避免与常用二进制文件发生冲突。

## 参见

- [Profiles: Running Multiple Agents](./profiles.md) — 基本概念
- [Profile Commands 参考](../reference/profile-commands.md) — 每个标志、每个选项
- [`hermes profile export` / `import`](../reference/profile-commands.md#hermes-profile-export) — 本地备份 / 恢复（非分发物）
- [Using SOUL with Hermes](../guides/use-soul-with-hermes.md) — 作者化个性
- [Personality & SOUL](./features/personality.md) — SOUL 如何融入智能体
- [Skills catalog](../reference/skills-catalog.md) — 你可以捆绑的技能