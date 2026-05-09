---
sidebar_position: 3
---

# 配置文件分发：共享整个智能体

**配置文件分发**将一个完整的 Hermes 智能体（包括个性、技能、定时任务、MCP 连接和配置）打包为一个 Git 仓库。任何有权访问该仓库的人都可以通过一条命令安装整个智能体，就地更新，同时保留其自己的记忆、会话和 API 密钥。

如果说[配置文件](./profiles.md)是一个本地智能体，那么分发就是让该智能体可共享。

## 这意味着什么

在分发功能出现之前，共享一个 Hermes 智能体意味着需要向他人发送：

1. 你的 SOUL.md
2. 需要安装的技能列表
3. 你的 config.yaml（不含密钥）
4. 你连接的 MCP 服务器描述
5. 你设置的任何定时任务
6. 需要设置哪些环境变量的说明

……并希望他们能正确组装。每次版本更新或错误修复都意味着要重复这一交接过程。

通过分发，所有这些内容都存在于一个 Git 仓库中：

```
my-research-agent/
├── distribution.yaml    # 清单：名称、版本、环境变量要求
├── SOUL.md              # 智能体的个性/系统提示
├── config.yaml          # 模型、温度、推理、工具默认值
├── skills/              # 随智能体捆绑的技能
├── cron/                # 智能体运行的定时任务
└── mcp.json             # 智能体连接的 MCP 服务器
```

接收方运行：

```bash
hermes profile install github.com/you/my-research-agent --alias
```

……他们现在就拥有了整个智能体。他们填写自己的 API 密钥（`.env.EXAMPLE` → `.env`），然后可以运行 `my-research-agent chat` 或通过 Telegram / Discord / Slack / 任何网关平台与其交互。当你推送新版本时，他们运行 `hermes profile update my-research-agent` 并拉取你的更改——他们的记忆和会话保持不变。

## 为什么选择 git？

我们曾考虑过 tarball、HTTP 归档文件、自定义格式。但它们都不如 git：

- **对作者而言零构建步骤。** 推送到 GitHub；使用者直接安装。无需“打包这个，上传那个，更新索引”的循环操作。
- **标签、分支和提交本身就是一个版本控制系统。** 推送一个标签就能完成其他工具“打包 + 上传发布版本”所做的工作。
- **更新只需一次 fetch 操作。** 无需重新下载整个归档文件。
- **透明。** 用户可以浏览仓库，查看版本之间的差异，针对它提出问题，或 fork 它进行自定义。
- **私有仓库免费使用。** SSH 密钥、`git credential` 助手、GitHub CLI 存储的凭据——无论你的终端已经配置了何种认证方式，都可以透明地应用。
- **可重现性由提交 SHA 保证。** 这与 pip 和 npm 记录的方式相同。

权衡：接收者需要安装 git。到 2026 年，在任何运行 Hermes 的机器上，这已经是事实。

## 何时应该使用分发版？

适合的情况：

- **你正在与团队或社区共享一个专用智能体**——例如合规监控器、代码审查员、研究助手、客服机器人。
- **你正在将同一个智能体部署到多台机器上**，并且不想每次都手动复制文件。
- **你正在迭代一个智能体**，并希望接收者能用一条命令获取新版本。
- **你正在将一个智能体构建为产品**——带有预设的默认配置、精选的技能、调优的提示词——其他人可以将其作为起点使用。

不适合的情况：

- **你只是想备份自己机器上的配置文件。** 请使用 [`hermes profile export` / `import`](../reference/profile-commands.md#hermes-profile-export)——这些命令就是为此设计的。
- **你想将 API 密钥与智能体一起共享。** `auth.json` 和 `.env` 被明确排除在分发版之外。每个安装者都应自带凭据。
- **你想共享记忆/会话/对话历史。** 这些属于用户数据，而非分发版内容。绝不能随分发版一起发送。

## 生命周期：从作者到安装者再到更新

以下是完整的端到端流程。请选择你关心的部分。

---

## 针对作者：发布一个分发版

### 步骤 1 —— 从一个可工作的配置文件开始

像构建其他配置文件一样构建并完善智能体：

```bash
hermes profile create research-bot
research-bot setup                    # 配置模型、API 密钥
# 编辑 ~/.hermes/profiles/research-bot/SOUL.md
# 安装技能、连接 MCP 服务器、安排 cron 任务等。
research-bot chat                     # 进行内部测试，直到感觉良好
```

### 步骤 2 —— 添加 `distribution.yaml`

创建 `~/.hermes/profiles/research-bot/distribution.yaml`：

```yaml
name: research-bot
version: 1.0.0
description: "带有 arXiv 和网络工具的自主任研助手"
hermes_requires: ">=0.12.0"
author: "你的名字"
license: "MIT"

# 告知安装者该智能体需要哪些环境变量。这些变量会与安装者的 shell 环境和现有的 .env 文件进行比对，
# 以避免对已经配置好的密钥反复提醒。
env_requires:
  - name: OPENAI_API_KEY
    description: "OpenAI API 密钥（用于模型访问）"
    required: true
  - name: SERPAPI_KEY
    description: "SerpAPI 密钥（用于网络搜索）"
    required: false
    default: ""
```

这就是整个清单文件。除了 `name` 字段外，其他字段都有合理的默认值。

### 步骤 3 —— 推送到 git 仓库

```bash
cd ~/.hermes/profiles/research-bot
git init
git add .
git commit -m "v1.0.0"
git remote add origin git@github.com:you/research-bot.git
git tag v1.0.0
git push -u origin main --tags
```

该仓库现在就是一个分发版。任何有权限的人都可以安装它。

:::note
git 仓库包含**配置文件目录中的所有内容，但以下已被明确排除在分发版之外的内容除外**：`auth.json`、`.env`、`memories/`、`sessions/`、`state.db*`、`logs/`、`workspace/`、`*_cache/`、`local/`。这些内容保留在你的机器上。你也可以添加一个 `.gitignore` 文件来排除额外的路径。
:::

### 步骤 4 —— 标记版本化发布

每当智能体达到一个稳定状态时，提升版本号并打标签：

```bash
# 编辑 distribution.yaml: version: 1.1.0
git add distribution.yaml SOUL.md skills/
git commit -m "v1.1.0: 更严谨的研究 SOUL，添加 arxiv 技能"
git tag v1.1.0
git push --tags
```

运行 `hermes profile update research-bot` 的接收者将会拉取最新版本。

### 仓库的结构示例

一个完整的已发布分发版：

```
research-bot/
├── distribution.yaml            # 必需
├── SOUL.md                      # 强烈建议
├── config.yaml                  # 模型、提供商、工具默认值
├── mcp.json                     # MCP 服务器连接
├── skills/
│   ├── arxiv-search/SKILL.md
│   ├── paper-summarization/SKILL.md
│   └── citation-lookup/SKILL.md
├── cron/
│   └── weekly-digest.json       # 计划任务
└── README.md                    # 面向人类的描述（可选）
```

### 分发版拥有 vs 用户拥有

当安装者更新到新版本时，某些内容会被替换（作者的领域），而某些内容保持不变（安装者的领域）。默认规则如下：

| 类别 | 路径 | 更新时 |
|---|---|---|
| **分发版拥有** | `SOUL.md`、`config.yaml`、`mcp.json`、`skills/`、`cron/`、`distribution.yaml` | 从新的克隆中替换 |
| **配置覆盖** | `config.yaml` | 实际上默认会被保留——安装者可能已经调整了模型或提供商。在更新时传递 `--force-config` 以重置。 |
| **用户拥有** | `memories/`、`sessions/`、`state.db*`、`auth.json`、`.env`、`logs/`、`workspace/`、`plans/`、`home/`、`*_cache/`、`local/` | 永不触碰 |

你可以在清单文件中覆盖“分发版拥有”列表：

```yaml
distribution_owned:
  - SOUL.md
  - skills/research/            # 仅包含我的研究技能；其他已安装的技能保留
  - cron/digest.json
```

如果省略，则应用上述默认规则——这也是大多数分发版所期望的。

---

## 针对安装者：使用一个分发版

### 安装

```bash
hermes profile install github.com/you/research-bot --alias
```

执行过程：

1. 将仓库克隆到临时目录。
2. 读取 `distribution.yaml`，向你展示清单（名称、版本、描述、作者、所需环境变量）。
3. 将每个必需的环境变量与你的 shell 环境以及目标配置文件现有的 `.env` 文件进行比对。标记为 `✓ 已设置` 或 `需要设置`，以便你确切知道需要配置什么。
4. 请求确认。传递 `-y` / `--yes` 可跳过。
5. 将“分发版拥有”的文件复制到 `~/.hermes/profiles/research-bot/`（或清单中 `name` 字段解析到的位置）。
6. 写入 `.env.EXAMPLE`，其中包含必需的密钥（已注释掉）——将其复制为 `.env` 并填写。
7. 使用 `--alias` 时，会创建一个包装器，使你能够直接运行 `research-bot chat`。

### 源类型

任何 git URL 都可以：

```bash
# GitHub 简写
hermes profile install github.com/you/research-bot

# 完整 HTTPS
hermes profile install https://github.com/you/research-bot.git

# SSH
hermes profile install git@github.com:you/research-bot.git

# 自托管、GitLab、Gitea、Forgejo —— 任何 Git 托管服务
hermes profile install https://git.example.com/team/research-bot.git

# 使用你已配置的 git 认证方式的私有仓库
hermes profile install git@github.com:your-org/internal-bot.git

# 开发期间的本地目录（无需 git push）
hermes profile install ~/my-profile-in-progress/
```

### 覆盖配置文件名称

两个用户希望使用相同的分发版，但使用不同的本地配置文件名称：

```bash
# Alice
hermes profile install github.com/acme/support-bot --name support-us --alias
# Bob（相同的分发版，不同的本地名称）
hermes profile install github.com/acme/support-bot --name support-eu --alias
```

### 填写环境变量

安装后，智能体的配置文件目录中会包含一个 `.env.EXAMPLE`：

```
# 此 Hermes 分发版所需的环境变量。
# 在运行前，请将其复制为 `.env` 并填入你自己的值。

# OpenAI API 密钥（用于模型访问）
# （必需）
OPENAI_API_KEY=

# SerpAPI 密钥（用于网络搜索）
# （可选）
# SERPAPI_KEY=
```

复制它：

```bash
cp ~/.hermes/profiles/research-bot/.env.EXAMPLE ~/.hermes/profiles/research-bot/.env
# 编辑 .env，粘贴你的真实密钥
```

如果某些必需密钥已经存在于你的 shell 环境中（例如，在 `~/.zshrc` 中导出的 `OPENAI_API_KEY`），则在安装过程中会被标记为 `✓ 已设置`——你无需在 `.env` 中重复填写它们。

### 检查你安装的内容

```bash
hermes profile info research-bot
```

显示：

```
分发版: research-bot
版本:      1.0.0
描述:  带有 arXiv 和网络工具的自主任研助手
作者:       你的名字
要求:     Hermes >=0.12.0
源:       https://github.com/you/research-bot
安装时间:    2026-05-08T17:04:32+00:00

环境变量:
  OPENAI_API_KEY (必需) — OpenAI API 密钥（用于模型访问）
  SERPAPI_KEY (可选) — SerpAPI 密钥（用于网络搜索）
```

`hermes profile list` 也会显示一个 `分发版` 列，这样你可以一目了然地看出哪些配置文件来自仓库，哪些是你手动构建的：

```
 配置文件          模型                        网关      别名        分发版
 ───────────────    ───────────────────────────    ───────────    ───────────    ────────────────────
 ◆default         claude-sonnet-4              已停止      —            —
  coder           gpt-5                        已停止      coder        —
  research-bot    claude-opus-4                已停止      research-bot research-bot@1.0.0
  telemetry       claude-sonnet-4              运行中      telemetry    telemetry@2.3.1
```

### 更新

```bash
hermes profile update research-bot
```

执行过程：

1. 从记录的源 URL 重新克隆仓库。
2. 替换“分发版拥有”的文件（SOUL、技能、cron、mcp.json）。
3. **保留**你的 `config.yaml`——你可能已经调整了模型、温度或其他设置。传递 `--force-config` 可覆盖。
4. **绝不触碰**用户数据：记忆、会话、认证、`.env`、日志、状态。

无需重新下载整个归档文件。不会覆盖你对配置的本地更改。不会删除你的对话历史。

### 删除

```bash
hermes profile delete research-bot
```

删除提示会在请求你确认之前显示分发版信息：

```
配置文件: research-bot
路径:    ~/.hermes/profiles/research-bot
模型:   claude-opus-4 (anthropic)
技能:  12
分发版: research-bot@1.0.0
安装来源: https://github.com/you/research-bot

这将永久删除：
  • 所有配置、API 密钥、记忆、会话、技能、cron 任务
  • 命令别名 (~/.local/bin/research-bot)

输入 'research-bot' 以确认：
```

因此，你永远不会在不知道智能体来源或无法重新安装的情况下意外删除它。

## 使用场景与模式

### 个人：跨设备同步一个智能体

你在笔记本电脑上构建了一个研究助手。你希望在工作站上也拥有相同的智能体。

```bash
# 笔记本电脑
cd ~/.hermes/profiles/research-bot
git init && git add . && git commit -m "initial"
git remote add origin git@github.com:you/research-bot.git
git push -u origin main

# 工作站
hermes profile install github.com/you/research-bot --alias
# 填写 .env 文件。完成。
```

在笔记本电脑上的任何迭代（`git commit && push`）都会通过 `hermes profile update research-bot` 同步到工作站。记忆数据按设备独立保存——笔记本电脑记住自己的对话，工作站记住自己的对话，它们不会相互干扰。

### 团队：发布一个经过审核的内部智能体

你的工程团队希望拥有一个共享的 PR 审查机器人，具有特定的 SOUL、特定技能，并且每次 PR 都会通过它运行。

```bash
# 工程负责人
cd ~/.hermes/profiles/pr-reviewer
# ... 构建和调优 ...
git init && git add . && git commit -m "v1.0 PR reviewer"
git tag v1.0.0
git push -u origin main --tags    # 推送到你公司的内部 Git 主机

# 每位工程师
hermes profile install git@github.com:your-org/pr-reviewer.git --alias
# 用他们自己的 API 密钥填写 .env 文件（费用记在他们名下），.env.EXAMPLE 指明了所需内容
pr-reviewer chat
```

当负责人发布 v1.1（更好的 SOUL、新技能）时，工程师运行 `hermes profile update pr-reviewer`，所有人几分钟内就能使用新版本。

### 社区：发布一个公开的智能体

你构建了一些新颖的东西——也许是一个“Polymarket 交易员”或“学术论文摘要生成器”或“Minecraft 服务器运维助手”。你希望分享它。

```bash
# 你
cd ~/.hermes/profiles/polymarket-trader
# 在仓库根目录编写一个扎实的 README.md —— GitHub 会在仓库页面上显示它
git init && git add . && git commit -m "v1.0"
git tag v1.0.0
# 发布到公共 GitHub 仓库
git remote add origin https://github.com/you/hermes-polymarket-trader.git
git push -u origin main --tags

# 任何人
hermes profile install github.com/you/hermes-polymarket-trader --alias
```

发布安装命令的推文。试用的人会向你提交问题和 PR。如果有人想要自定义，他们可以 fork —— 使用每个人都熟悉的相同 git 工作流。

### 产品：发布一个带有特定观点的智能体

你构建了基于 Hermes 的产品——也许是一个合规监控套件、一个客户支持栈、一个特定领域的研究平台。你希望将其作为产品分发。

```yaml
# distribution.yaml
name: telemetry-harness
version: 2.3.1
description: "合规遥测套件 —— 监控和审查受监管的工作流"
hermes_requires: ">=0.13.0"
author: "Acme 合规公司"
license: "商业"

env_requires:
  - name: ACME_API_KEY
    description: "你的 Acme 合规许可证密钥（发送邮件至 support@acme.com）"
    required: true
  - name: OPENAI_API_KEY
    description: "用于模型访问的 OpenAI API 密钥"
    required: true
  - name: GRAPHITI_MCP_URL
    description: "你的 Graphiti 知识图谱实例的 URL"
    required: false
    default: "http://127.0.0.1:8000/sse"
```

你的客户通过单个命令安装；安装预览会告诉他们需要准备哪些密钥；一旦你标记了一个新版本，更新就会立即推送；他们的合规数据（`memories/`、`sessions/`）永远不会离开他们的机器。

### 临时：在共享基础设施上运行一次性脚本

你是运维负责人。你希望有一个临时智能体来诊断生产事故——一个带有正确工具和 MCP 连接的预制 SOUL——并在接下来的一周内在三位待命工程师的笔记本电脑上运行。

```bash
# 你
# 构建配置文件，提交，推送到一个私有仓库
git push -u origin main

# 每位待命工程师
hermes profile install git@github.com:your-org/incident-2026-q2.git --alias

# 事故解决 —— 拆除它
hermes profile delete incident-2026-q2
```

安装-删除周期足够便宜，可以一次性使用。

---

## 实用技巧

### 固定到特定版本

:::note
Git 引用固定（`#v1.2.0`）已计划但不在初始版本中 —— 安装目前跟踪默认分支。通过 `hermes profile info <name>` 跟踪你安装的版本，并在准备好之前暂停更新。
:::

### 检查你当前使用的版本与最新版本

```bash
# 你安装的版本
hermes profile info research-bot | grep Version

# 最新上游版本（不安装）
git ls-remote --tags https://github.com/you/research-bot | tail -5
```

### 在更新过程中保留本地配置自定义项

默认的更新行为已经做到了这一点：`config.yaml` 会被保留。为了安全起见，将你的本地调整写入分发版不拥有的文件中：

```yaml
# ~/.hermes/profiles/research-bot/local/my-overrides.yaml
# （分发版永远不会触及 local/ 目录）
```

……并根据需要从 `config.yaml` 或你的 SOUL 中引用它。

### 强制进行全新重新安装

```bash
# 彻底删除并重新安装（也会丢失 memories/sessions）
hermes profile delete research-bot --yes
hermes profile install github.com/you/research-bot --alias

# 更新到当前 main 分支，但将 config.yaml 重置为分发版的默认值
hermes profile update research-bot --force-config --yes
```

### Fork 并自定义

标准的 git 工作流 —— 分发版就是仓库：

```bash
# 在 GitHub 上 fork 仓库，然后安装你的 fork
hermes profile install github.com/yourname/forked-research-bot --alias

# 在 ~/.hermes/profiles/forked-research-bot/ 本地进行迭代
# 编辑 SOUL.md，提交，推送到你的 fork
# 上游更改：以通常的方式将它们拉取到你的 fork 中
```

### 在推送之前测试分发版

从作者的机器上：

```bash
# 从本地目录安装（无需 git push）
hermes profile install ~/.hermes/profiles/research-bot --name research-bot-test --alias

# 调整、删除、重新安装，直到正确为止
hermes profile delete research-bot-test --yes
hermes profile install ~/.hermes/profiles/research-bot --name research-bot-test
```

---

## 分发版中**不包含**的内容（永远）

即使作者意外包含了这些路径，安装程序也会硬性排除它们。没有任何配置选项可以让你覆盖此行为 —— 安全防护是一个经过回归测试的不变量：

- `auth.json` —— OAuth 令牌、平台凭据
- `.env` —— API 密钥、机密信息
- `memories/` —— 对话记忆
- `sessions/` —— 对话历史
- `state.db`、`state.db-shm`、`state.db-wal` —— 会话元数据
- `logs/` —— 智能体和错误日志
- `workspace/` —— 生成的工作文件
- `plans/` —— 草稿计划
- `home/` —— 用户在 Docker 后端中的主目录挂载点
- `*_cache/` —— 图像/音频/文档缓存
- `local/` —— 用户保留的自定义命名空间

当你克隆一个分发版时，这些内容根本不存在。当你更新时，它们保持不变。如果你在五台机器上安装了相同的分发版，你将拥有五组隔离的数据 —— 每台机器一组。

## 安全与信任

配置文件分发版默认未签名。你信任：

- **Git 主机**（GitHub / GitLab / 其他任何地方）提供作者推送的字节。
- **作者**不会分发恶意的 SOUL、技能或 cron 作业。

来自分发版的 cron 作业**不会自动调度** —— 安装程序会打印 `hermes -p <name> cron list`，你需要显式启用它们。SOUL.md 和技能在你开始与该配置文件聊天时**即处于活动状态**，因此如果你从你不认识的人那里安装，请在首次运行前阅读它们。

粗略类比：安装分发版就像安装浏览器扩展或 VS Code 扩展。低摩擦、高能力，信任来源。对于公司内部的分发版，请使用私有仓库和你正常的 git 身份验证 —— 无需配置任何新内容。

未来版本可能会添加签名、一个包含已解析提交 SHA 的锁文件（`.distribution-lock.yaml`），以及一个在应用更新前打印差异的 `--dry-run` 标志。这些功能目前尚未发布。

## 底层实现

有关实现细节、精确的 CLI 行为以及所有标志，请参阅 [配置文件命令参考](../reference/profile-commands.md#distribution-commands)。

简要版本：

- `install`、`update`、`info` 位于 `hermes profile` 内部 —— 而不是一个并行的命令树。
- 清单格式是 YAML，具有一个微小的必需模式（仅 `name`）。
- 安装程序使用你本地的 `git` 二进制文件进行克隆，因此你的 shell 已经处理的任何身份验证（SSH 密钥、凭据助手）都可以透明地工作。
- 克隆后，`.git/` 会被剥离 —— 安装的配置文件本身不是一个 git 检出，避免了“哦不，我不小心把我的 `.env` 提交到了分发版的 git 历史记录”的陷阱。
- 保留的配置文件名称（`hermes`、`test`、`tmp`、`root`、`sudo`）在安装时被拒绝，以避免与常见二进制文件发生冲突。

## 另请参阅

- [配置文件：运行多个智能体](./profiles.md) —— 基础概念
- [配置文件命令参考](../reference/profile-commands.md) —— 每个标志、每个选项
- [`hermes profile export` / `import`](../reference/profile-commands.md#hermes-profile-export) —— 本地备份/恢复（非分发版）
- [在 Hermes 中使用 SOUL](../guides/use-soul-with-hermes.md) —— 创作个性
- [个性与 SOUL](./features/personality.md) —— SOUL 如何融入智能体
- [技能目录](../reference/skills-catalog.md) —— 你可以捆绑的技能