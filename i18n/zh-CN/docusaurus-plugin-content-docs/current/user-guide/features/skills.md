---
sidebar_position: 2
title: "技能系统"
description: "按需知识文档 — 渐进式披露、智能体管理技能和技能中心"
---

# 技能系统

技能是智能体在需要时可以加载的按需知识文档。它们遵循**渐进式披露**模式，以最小化 Token 使用量，并兼容 [agentskills.io](https://agentskills.io/specification) 开放标准。

所有技能都存储在 **`~/.hermes/skills/`** — 这是主要的目录和唯一真相来源。在全新安装时，捆绑的技能会从仓库复制过来。通过中心安装和智能体创建的技能也会存放在此处。智能体可以修改或删除任何技能。

您还可以将 Hermes 指向**外部技能目录** — 这些额外的文件夹会与本地目录一起被扫描。请参阅下方的 [外部技能目录](#external-skill-directories)。

另请参阅：

- [捆绑技能目录](/docs/reference/skills-catalog)
- [官方可选技能目录](/docs/reference/optional-skills-catalog)

## 使用技能

每个已安装的技能都会自动作为一个斜杠命令可用：

```bash
# 在 CLI 或任何消息平台：
/gif-search funny cats
/axolotl help me fine-tune Llama 3 on my dataset
/github-pr-workflow create a PR for the auth refactor
/plan design a rollout for migrating our auth provider

# 仅技能名称即可加载，并让智能体询问您需要什么：
/excalidraw
```

捆绑的 `plan` 技能就是一个很好的示例，它是一个带有自定义行为的技能支持的斜杠命令。运行 `/plan [请求]` 会告诉 Hermes 如果需要则检查上下文，而是编写一个 Markdown 实现计划，而不是执行任务，并将结果保存在相对于活动工作区/后端工作目录的 `.hermes/plans/` 下。

您也可以通过自然对话与技能进行交互：

```bash
hermes chat --toolsets skills -q "你有哪些技能？"
hermes chat --toolsets skills -q "给我看看 axolotl 技能"
```

## 渐进式披露

技能使用了一种高效的 Token 加载模式：

```
Level 0: skills_list()           → [{name, description, category}, ...]   (~3k tokens)
Level 1: skill_view(name)        → 完整内容 + 元数据       (varies)
Level 2: skill_view(name, path)  → 特定参考文件       (varies)
```

只有当智能体真正需要时，才会加载完整的技能内容。

## SKILL.md 格式

```markdown
---
name: my-skill
description: 简要描述此技能的功能
version: 1.0.0
platforms: [macos, linux]     # 可选 — 限制到特定的操作系统平台
metadata:
  hermes:
    tags: [python, automation]
    category: devops
    fallback_for_toolsets: [web]    # 可选 — 条件激活 (见下文)
    requires_toolsets: [terminal]   # 可选 — 条件激活 (见下文)
    config:                          # 可选 — config.yaml 设置
      - key: my.setting
        description: "此项控制的内容"
        default: "value"
        prompt: "设置提示"
---

# 技能标题

## 使用场景
此技能的触发条件。

## 流程
1. 第一步
2. 第二步

## 潜在陷阱
- 已知的故障模式和修复方法

## 验证
如何确认它已成功工作。
```

### 特定平台技能

技能可以使用 `platforms` 字段限制到特定的操作系统：

| 值 | 匹配 |
|-------|---------|
| `macos` | macOS (Darwin) |
| `linux` | Linux |
| `windows` | Windows |

```yaml
platforms: [macos]            # 仅限 macOS (例如 iMessage, Apple Reminders, FindMy)
platforms: [macos, linux]     # macOS 和 Linux
```

设置后，该技能将自动从不兼容平台的系统提示、`skills_list()` 和斜杠命令中隐藏。如果省略，则技能在所有平台上加载。

### 条件激活（备用技能）

技能可以根据当前会话中可用的工具来自动显示或隐藏自身。这对于**备用技能**特别有用——即在高级工具不可用时才应该出现的免费或本地替代方案。

```yaml
metadata:
  hermes:
    fallback_for_toolsets: [web]      # 仅当这些工具集不可用时显示
    requires_toolsets: [terminal]     # 仅当这些工具集可用时显示
    fallback_for_tools: [web_search]  # 仅当这些特定工具不可用时显示
    requires_tools: [terminal]        # 仅当这些特定工具可用时显示
```

| 字段 | 行为 |
|-------|----------|
| `fallback_for_toolsets` | 当列出的工具集可用时，技能将**隐藏**。当它们缺失时显示。 |
| `fallback_for_tools` | 相同，但检查单个工具而不是工具集。 |
| `requires_toolsets` | 当列出的工具集不可用时，技能将**隐藏**。当它们存在时显示。 |
| `requires_tools` | 相同，但检查单个工具。 |

**示例：** 内置的 `duckduckgo-search` 技能使用 `fallback_for_toolsets: [web]`。当您设置了 `FIRECRAWL_API_KEY` 时，Web 工具集可用，智能体使用 `web_search` — DuckDuckGo 技能保持隐藏。如果 API 密钥丢失，Web 工具集不可用，DuckDuckGo 技能将自动作为备用方案出现。

没有条件字段的技能行为与之前完全一样 — 它们始终显示。

## 加载时的安全设置

技能可以在不从发现列表中消失的情况下声明所需的环境变量：

```yaml
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: Tenor API 密钥
    help: 从 https://developers.google.com/tenor 获取密钥
    required_for: 完整功能
```

当遇到缺失值时，Hermes 只在本地 CLI 中实际加载技能时，才会安全地要求您提供。您可以跳过设置并继续使用该技能。消息界面绝不会在聊天中要求秘钥 — 它们会告诉您在本地使用 `hermes setup` 或 `~/.hermes/.env`。

设置后，声明的环境变量会自动传递给 `execute_code` 和 `terminal` 沙箱 — 技能的脚本可以直接使用 `$TENOR_API_KEY`。对于非技能环境变量，请使用 `terminal.env_passthrough` 配置选项。有关详细信息，请参阅 [环境变量传递](/docs/user-guide/security#environment-variable-passthrough)。

### 技能配置设置

技能还可以声明非秘密的配置设置（路径、偏好），并存储在 `config.yaml` 中：

```yaml
metadata:
  hermes:
    config:
      - key: myplugin.path
        description: 插件数据目录的路径
        default: "~/myplugin-data"
        prompt: 插件数据目录路径
```

设置存储在您的 config.yaml 的 `skills.config` 下。`hermes config migrate` 会提示未配置的设置，而 `hermes config show` 会显示它们。当技能加载时，其解析后的配置值会被注入到上下文中，以便智能体自动知道已配置的值。

有关详细信息，请参阅 [技能设置](/docs/user-guide/configuration#skill-settings) 和 [创建技能 — 配置设置](/docs/developer-guide/creating-skills#config-settings-configyaml)。

## 技能目录结构

```text
~/.hermes/skills/                  # 唯一真相来源
├── mlops/                         # 类别目录
│   ├── axolotl/
│   │   ├── SKILL.md               # 主要说明 (必需)
│   │   ├── references/            # 附加文档
│   │   ├── templates/             # 输出格式
│   │   ├── scripts/               # 可从技能调用的辅助脚本
│   │   └── assets/                # 补充文件
│   └── vllm/
│       └── SKILL.md
├── devops/
│   └── deploy-k8s/                # 智能体创建的技能
│       ├── SKILL.md
│       └── references/
├── .hub/                          # 技能中心状态
│   ├── lock.json
│   ├── quarantine/
│   └── audit.log
└── .bundled_manifest              # 跟踪植入的捆绑技能
```

## 外部技能目录

如果您在 Hermes 外部维护技能 — 例如，一个由多个 AI 工具共享的 `~/.agents/skills/` 目录 — 您可以告诉 Hermes 也扫描这些目录。

在 `~/.hermes/config.yaml` 的 `skills` 部分添加 `external_dirs`：

```yaml
skills:
  external_dirs:
    - ~/.agents/skills
    - /home/shared/team-skills
    - ${SKILLS_REPO}/skills
```

路径支持 `~` 扩展和 `${VAR}` 环境变量替换。

### 工作原理

- **只读**: 外部目录仅用于技能发现扫描。当智能体创建或编辑技能时，它总是写入 `~/.hermes/skills/`。
- **本地优先**: 如果本地目录和外部目录中存在相同名称的技能，则本地版本优先。
- **完全集成**: 外部技能会出现在系统提示索引、`skills_list`、`skill_view` 和 `/skill-name` 斜杠命令中 — 与本地技能没有任何区别。
- **不存在的路径会被静默跳过**: 如果配置的目录不存在，Hermes 不会报错而忽略它。这对于可能不在每台机器上的可选共享目录很有用。

### 示例

```text
~/.hermes/skills/               # 本地 (主要，读写)
├── devops/deploy-k8s/
│   └── SKILL.md
└── mlops/axolotl/
    └── SKILL.md

~/.agents/skills/               # 外部 (只读，共享)
├── my-custom-workflow/
│   └── SKILL.md
└── team-conventions/
    └── SKILL.md
```

所有四个技能都会出现在您的技能索引中。如果您在本地创建了一个名为 `my-custom-workflow` 的新技能，它将覆盖外部版本。

## 智能体管理技能 (skill_manage 工具)

智能体可以通过 `skill_manage` 工具创建、更新和删除自己的技能。这是智能体的**过程记忆** — 当它发现一个非平凡的工作流程时，它会将其方法保存为技能以供将来重用。

### 智能体何时创建技能

- 成功完成复杂任务（5 个以上工具调用）后
- 当它遇到错误或死胡同时并找到了可行的路径时
- 当用户纠正了其方法时
- 当它发现了一个非平凡的工作流程时

### 操作

| 操作 | 用途 | 关键参数 |
|--------|---------|------------|
| `create` | 从零创建新技能 | `name`, `content` (完整的 SKILL.md), 可选 `category` |
| `patch` | 定点修复（首选） | `name`, `old_string`, `new_string` |
| `edit` | 重大的结构重写 | `name`, `content` (完整的 SKILL.md 替换) |
| `delete` | 彻底移除技能 | `name` |
| `write_file` | 添加/更新支持文件 | `name`, `file_path`, `file_content` |
| `remove_file` | 移除支持文件 | `name`, `file_path` |

:::tip
`patch` 操作是更新的首选 — 它比 `edit` 更节省 Token，因为工具调用中只包含更改的文本。
:::

## 技能中心 (Skills Hub)

浏览、搜索、安装和管理来自在线注册表、`skills.sh`、直接知名的技能端点和官方可选技能的技能。

### 常用命令

```bash
hermes skills browse                              # 浏览所有中心技能（官方优先）
hermes skills browse --source official            # 仅浏览官方可选技能
hermes skills search kubernetes                   # 搜索所有来源
hermes skills search react --source skills-sh     # 搜索 skills.sh 目录
hermes skills search https://mintlify.com/docs --source well-known
hermes skills inspect openai/skills/k8s           # 安装前预览
hermes skills install openai/skills/k8s           # 带有安全扫描安装
hermes skills install official/security/1password
hermes skills install skills-sh/vercel-labs/json-render/json-render-react --force
hermes skills install well-known:https://mintlify.com/docs/.well-known/skills/mintlify
hermes skills list --source hub                   # 列出中心已安装的技能
hermes skills check                               # 检查中心已安装的技能是否有上游更新
hermes skills update                              # 在需要时重新安装中心技能以获取上游更改
hermes skills audit                               # 重新扫描所有中心技能以进行安全审计
hermes skills uninstall k8s                       # 移除中心技能
hermes skills publish skills/my-skill --to github --repo owner/repo
hermes skills snapshot export setup.json          # 导出技能配置
hermes skills tap add myorg/skills-repo           # 添加自定义 GitHub 源
```

### 支持的中心来源

| 来源 | 示例 | 说明 |
|--------|---------|-------|
| `official` | `official/security/1password` | 与 Hermes 捆绑的可选技能。 |
| `skills-sh` | `skills-sh/vercel-labs/agent-skills/vercel-react-best-practices` | 可通过 `hermes skills search <query> --source skills-sh` 搜索。当 skills.sh 的 slug 与仓库文件夹不同时，Hermes 会解析别名风格的技能。 |
| `well-known` | `well-known:https://mintlify.com/docs/.well-known/skills/mintlify` | 直接从网站的 `/.well-known/skills/index.json` 发布的技能。使用站点或文档 URL 进行搜索。 |
| `github` | `openai/skills/k8s` | 直接从 GitHub 仓库/路径安装和自定义 tap。 |
| `clawhub`, `lobehub`, `claude-marketplace` | 特定来源标识符 | 社区或市场集成。 |

### 集成中心和注册表

Hermes 目前集成了以下技能生态系统和发现来源：

#### 1. 官方可选技能 (`official`)

这些技能存储在 Hermes 仓库本身，并带有内置信任。

- 目录：[官方可选技能目录](../../reference/optional-skills-catalog)
- 仓库来源：`optional-skills/`
- 示例：

```bash
hermes skills browse --source official
hermes skills install official/security/1password
```

#### 2. skills.sh (`skills-sh`)

这是 Vercel 的公共技能目录。Hermes 可以直接搜索它，检查技能详情页面，解析别名风格的 slug，并从底层源仓库安装。

- 目录：[skills.sh](https://skills.sh/)
- CLI/工具仓库：[vercel-labs/skills](https://github.com/vercel-labs/skills)
- 官方 Vercel 技能仓库：[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)
- 示例：

```bash
hermes skills search react --source skills-sh
hermes skills inspect skills-sh/vercel-labs/json-render/json-render-react
hermes skills install skills-sh/vercel-labs/json-render/json-render-react --force
```

#### 3. Well-known 技能端点 (`well-known`)

这是基于 URL 的发现机制，用于从发布 `/.well-known/skills/index.json` 的网站获取技能。它不是一个单一的中央中心 — 它是一种网络发现约定。

- 示例实时端点：[Mintlify 文档技能索引](https://mintlify.com/docs/.well-known/skills/index.json)
- 参考服务器实现：[vercel-labs/skills-handler](https://github.com/vercel-labs/skills-handler)
- 示例：

```bash
hermes skills search https://mintlify.com/docs --source well-known
hermes skills inspect well-known:https://mintlify.com/docs/.well-known/skills/mintlify
hermes skills install well-known:https://mintlify.com/docs/.well-known/skills/mintlify
```

#### 4. 直接 GitHub 技能 (`github`)

Hermes 可以直接从 GitHub 仓库和基于 GitHub 的 tap 进行安装。当您已经知道仓库/路径，或想要添加自己的自定义源仓库时，这非常有用。

默认 tap（无需任何设置即可浏览）：
- [openai/skills](https://github.com/openai/skills)
- [anthropics/skills](https://github.com/anthropics/skills)
- [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)
- [garrytan/gstack](https://github.com/garrytan/gstack)

- 示例：

```bash
hermes skills install openai/skills/k8s
hermes skills tap add myorg/skills-repo
```

#### 5. ClawHub (`clawhub`)

一个作为社区来源集成的第三方技能市场。

- 网站：[clawhub.ai](https://clawhub.ai/)
- Hermes 来源 ID：`clawhub`

#### 6. Claude 市场风格仓库 (`claude-marketplace`)

Hermes 支持发布兼容 Claude 的插件/市场清单的仓库。

已知的集成来源包括：
- [anthropics/skills](https://github.com/anthropics/skills)
- [aiskillstore/marketplace](https://github.com/aiskillstore/marketplace)

Hermes 来源 ID：`claude-marketplace`

#### 7. LobeHub (`lobehub`)

Hermes 可以搜索并将其从 LobeHub 的公共目录中的智能体条目转换为可安装的 Hermes 技能。

- 网站：[LobeHub](https://lobehub.com/)
- 公共智能体索引：[chat-agents.lobehub.com](https://chat-agents.lobehub.com/)
- 后端仓库：[lobehub/lobe-chat-agents](https://github.com/lobehub/lobe-chat-agents)
- Hermes 来源 ID：`lobehub`

### 安全扫描和 `--force`

所有中心安装的技能都会经过**安全扫描器**，检查数据泄露、提示注入、破坏性命令、供应链信号和其他威胁。

`hermes skills inspect ...` 现在还会显示可用的上游元数据：
- 仓库 URL
- skills.sh 详情页面 URL
- 安装命令
- 周度安装量
- 上游安全审计状态
- well-known 索引/端点 URL

当您审查了第三方技能并希望覆盖非危险的策略阻止时，请使用 `--force`：

```bash
hermes skills install skills-sh/anthropics/skills/pdf --force
```

重要行为：
- `--force` 可以覆盖用于警示/警告风格发现的策略阻止。
- `--force` **不会**覆盖 `dangerous`（危险）扫描判定。
- 官方可选技能 (`official/...`) 被视为内置信任，不会显示第三方警告面板。

### 信任级别

| 级别 | 来源 | 策略 |
|-------|--------|--------|
| `builtin` | 与 Hermes 捆绑 | 始终信任 |
| `official` | 仓库中的 `optional-skills/` | 内置信任，无第三方警告 |
| `trusted` | 受信任的注册表/仓库，如 `openai/skills`, `anthropics/skills` | 比社区来源更宽松的策略 |
| `community` | 所有其他来源 (`skills.sh`, well-known 端点, 自定义 GitHub 仓库, 大多数市场) | 非危险发现可以用 `--force` 覆盖；`dangerous` 判定仍被阻止 |

### 更新生命周期

中心现在跟踪了足够的出处信息，可以重新检查已安装技能的上游副本：

```bash
hermes skills check          # 报告哪些已安装的中心技能的上游已更改
hermes skills update         # 仅重新安装有可用更新的技能
hermes skills update react   # 更新一个特定的已安装中心技能
```

这使用存储的来源标识符加上当前的上游捆绑内容哈希来检测漂移。

:::tip GitHub 速率限制
技能中心操作使用 GitHub API，对于未认证用户，速率限制为每小时 60 个请求。如果在安装或搜索过程中看到速率限制错误，请在 `.env` 文件中设置 `GITHUB_TOKEN` 以将限制提高到每小时 5,000 个请求。错误消息会在发生此情况时包含可操作的提示。
:::

### 斜杠命令（在聊天中）

所有相同的命令都可以使用 `/skills`：

```text
/skills browse
/skills search react --source skills-sh
/skills search https://mintlify.com/docs --source well-known
/skills inspect skills-sh/vercel-labs/json-render/json-render-react
/skills install openai/skills/skill-creator --force
/skills check
/skills update
/skills list
```

官方可选技能仍然使用 `official/security/1password` 和 `official/migration/openclaw-migration` 等标识符。