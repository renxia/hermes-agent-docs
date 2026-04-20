---
sidebar_position: 2
title: "技能系统"
description: "按需知识文档 — 渐进式披露、智能体管理的技能和技能中心"
---

# 技能系统

技能是智能体在需要时可以加载的按需知识文档。它们遵循**渐进式披露**模式以最小化令牌使用，并与 [agentskills.io](https://agentskills.io/specification) 开放标准兼容。

所有技能都位于 **`~/.hermes/skills/`** —— 主要目录和事实来源。在新安装时，捆绑的技能会从仓库复制过来。从中心安装的和智能体创建的也在这里。智能体可以修改或删除任何技能。

您还可以将 Hermes 指向**外部技能目录** —— 除了本地目录外，还会扫描其他文件夹。详见下文[外部技能目录](#external-skill-directories)。

另见：

- [捆绑技能目录](/docs/reference/skills-catalog)
- [官方可选技能目录](/docs/reference/optional-skills-catalog)

## 使用技能

每个已安装的技能都会自动作为斜杠命令可用：

```bash
# 在 CLI 或任何消息平台中：
/gif-search funny cats
/axolotl help me fine-tune Llama 3 on my dataset
/github-pr-workflow create a PR for the auth refactor
/plan design a rollout for migrating our auth provider

# 仅技能名称即可加载并让智能体询问您的需求：
/excalidraw
```

捆绑的 `plan` 技能是一个很好的示例，展示了具有自定义行为的技能支持的斜杠命令。运行 `/plan [request]` 会告诉 Hermes 检查上下文（如有必要），编写 Markdown 实现计划而不是执行任务，并将结果保存到 `.hermes/plans/` 下相对于活动工作区/后端工作目录的位置。

您也可以通过自然对话与技能交互：

```bash
hermes chat --toolsets skills -q "What skills do you have?"
hermes chat --toolsets skills -q "Show me the axolotl skill"
```

## 渐进式披露

技能采用令牌高效的加载模式：

```
Level 0: skills_list()           → [{name, description, category}, ...]   (~3k tokens)
Level 1: skill_view(name)        → 完整内容 + 元数据       (可变)
Level 2: skill_view(name, path)  → 特定引用文件       (可变)
```

只有当智能体真正需要时才会加载完整的技能内容。

## SKILL.md 格式

```markdown
---
name: my-skill
description: 此技能的作用简述
version: 1.0.0
platforms: [macos, linux]     # 可选 — 限制为特定操作系统
metadata:
  hermes:
    tags: [python, automation]
    category: devops
    fallback_for_toolsets: [web]    # 可选 — 条件激活 (见下文)
    requires_toolsets: [terminal]   # 可选 — 条件激活 (见下文)
    config:                          # 可选 — config.yaml 设置
      - key: my.setting
        description: "此设置控制的内容"
        default: "value"
        prompt: "设置提示"
---

# 技能标题

## 何时使用
触发此技能的场景。

## 操作步骤
1. 第一步
2. 第二步

## 注意事项
- 已知失败模式和修复方法

## 验证方式
如何确认其成功运行。
```

### 特定平台的技能

技能可以通过 `platforms` 字段限制为特定的操作系统：

| 值 | 匹配 |
|-------|---------|
| `macos` | macOS (Darwin) |
| `linux` | Linux |
| `windows` | Windows |

```yaml
platforms: [macos]            # 仅限 macOS (例如 iMessage, Apple Reminders, FindMy)
platforms: [macos, linux]     # macOS 和 Linux
```

设置后，该技能会自动在系统提示符、`skills_list()` 和斜杠命令中隐藏，适用于不兼容的平台。如果省略，则会在所有平台上加载。

### 条件激活（备用技能）

技能可以根据当前会话中可用的工具自动显示或隐藏自己。这对**备用技能**最有用 —— 免费或本地的替代方案，只有在高级工具不可用时才应出现。

```yaml
metadata:
  hermes:
    fallback_for_toolsets: [web]      # 仅在这些工具集不可用时显示
    requires_toolsets: [terminal]     # 仅在这些工具集可用时显示
    fallback_for_tools: [web_search]  # 仅在这些特定工具不可用时显示
    requires_tools: [terminal]        # 仅在这些特定工具可用时显示
```

| 字段 | 行为 |
|-------|----------|
| `fallback_for_toolsets` | 当列出的工具集可用时技能**隐藏**。缺失时显示。 |
| `fallback_for_tools` | 同上，但检查单个工具而非工具集。 |
| `requires_toolsets` | 当列出的工具集不可用时技能**隐藏**。存在时显示。 |
| `requires_tools` | 同上，但检查单个工具。 |

**示例：** 内置的 `duckduckgo-search` 技能使用 `fallback_for_toolsets: [web]`。当您设置了 `FIRECRAWL_API_KEY` 时，网络工具集可用，智能体使用 `web_search` —— DuckDuckGo 技能保持隐藏。如果 API 密钥缺失，网络工具集不可用，DuckDuckGo 技能会自动作为备用方案出现。

没有条件字段的技能表现与之前完全相同 —— 始终显示。

## 安全加载时的设置

技能可以声明所需的环境变量而不会从发现中消失：

```yaml
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: Tenor API 密钥
    help: 从 https://developers.google.com/tenor 获取密钥
    required_for: 完整功能
```

遇到缺失值时，Hermes 仅在技能实际加载到本地 CLI 时安全地询问它。您可以跳过设置继续使用技能。消息界面永远不会在聊天中要求秘密 —— 而是告诉您使用 `hermes setup` 或 `~/.hermes/.env` 本地操作。

设置后，声明的环境变量会自动传递给 `execute_code` 和 `terminal` 沙箱 —— 技能的脚本可以直接使用 `$TENOR_API_KEY`。对于非技能环境变量，请使用 `terminal.env_passthrough` 配置选项。详情见[环境变量透传](/docs/user-guide/security#environment-variable-passthrough)。

### 技能配置设置

技能还可以声明非机密配置设置（路径、首选项），存储在 `config.yaml` 中：

```yaml
metadata:
  hermes:
    config:
      - key: myplugin.path
        description: 插件数据目录路径
        default: "~/myplugin-data"
        prompt: 插件数据目录路径
```

设置存储在您的 config.yaml 的 `skills.config` 下。`hermes config migrate` 会提示未配置的设置，`hermes config show` 会显示它们。当技能加载时，其解析后的配置值会被注入上下文，使智能体自动知道配置的值。

详情见[技能设置](/docs/user-guide/configuration#skill-settings)和[创建技能 — 配置设置](/docs/developer-guide/creating-skills#config-settings-configyaml)。

## 技能目录结构

```text
~/.hermes/skills/                  # 单一事实来源
├── mlops/                         # 分类目录
│   ├── axolotl/
│   │   ├── SKILL.md               # 主说明 (必需)
│   │   ├── references/            # 附加文档
│   │   ├── templates/             # 输出格式
│   │   ├── scripts/               # 可从技能调用的辅助脚本
│   │   └── assets/                # 补充文件
│   └── vllm/
│       └── SKILL.md
├── devops/
│   └── deploy-k8s/                # 智能体创建的
│       ├── SKILL.md
│       └── references/
├── .hub/                          # 技能中心状态
│   ├── lock.json
│   ├── quarantine/
│   └── audit.log
└── .bundled_manifest              # 跟踪播种的捆绑技能
```

## 外部技能目录

如果您在 Hermes 之外维护技能 —— 例如多个 AI 工具共享的 `~/.agents/skills/` 目录 —— 您可以告诉 Hermes 也扫描这些目录。

在 `~/.hermes/config.yaml` 的 `skills` 部分添加 `external_dirs`：

```yaml
skills:
  external_dirs:
    - ~/.agents/skills
    - /home/shared/team-skills
    - ${SKILLS_REPO}/skills
```

路径支持 `~` 展开和 `${VAR}` 环境变量替换。

### 工作原理

- **只读**：外部目录仅用于技能发现。当智能体创建或编辑技能时，总是写入 `~/.hermes/skills/`。
- **本地优先**：如果在本地目录和外部目录中存在同名技能，本地版本获胜。
- **完全集成**：外部技能出现在系统提示符索引、`skills_list`、`skill_view` 中，并作为 `/skill-name` 斜杠命令 —— 与本地技能无异。
- **不存在的路径被静默跳过**：如果配置目录不存在，Hermes 会忽略它而不报错。这对可能不在每台机器上存在的可选共享目录很有用。

### 示例

```text
~/.hermes/skills/               # 本地 (主要, 读写)
├── devops/deploy-k8s/
│   └── SKILL.md
└── mlops/axolotl/
    └── SKILL.md

~/.agents/skills/               # 外部 (只读, 共享)
├── my-custom-workflow/
│   └── SKILL.md
└── team-conventions/
    └── SKILL.md
```

所有四个技能都出现在您的技能索引中。如果您在本地创建一个名为 `my-custom-workflow` 的新技能，它会屏蔽外部版本。

## 智能体管理的技能 (skill_manage 工具)

智能体可以通过 `skill_manage` 工具创建、更新和删除自己的技能。这是智能体的**程序性记忆** —— 当它找到非平凡的流程时，会将方法保存为技能以供将来重用。

### 智能体创建技能的时机

- 成功完成复杂任务后 (5+ 次工具调用)
- 遇到错误或死胡同并找到可行路径时
- 用户纠正了其方法时
- 发现非平凡的工作流程时

### 操作

| 操作 | 用途 | 关键参数 |
|--------|---------|------------|
| `create` | 从头创建新技能 | `name`, `content` (完整的 SKILL.md), 可选 `category` |
| `patch` | 针对性修复 (推荐) | `name`, `old_string`, `new_string` |
| `edit` | 重大结构重写 | `name`, `content` (完整 SKILL.md 替换) |
| `delete` | 完全移除技能 | `name` |
| `write_file` | 添加/更新支持文件 | `name`, `file_path`, `file_content` |
| `remove_file` | 移除支持文件 | `name`, `file_path` |

:::tip
`patch` 操作是推荐的更新方式 —— 它比 `edit` 更高效，因为只有更改的文本出现在工具调用中。
:::

## 技能中心

浏览、搜索、安装和管理来自在线注册表、`skills.sh`、知名技能端点和官方可选技能的技能。

### 常用命令

```bash
hermes skills browse                              # 浏览所有中心技能 (官方优先)
hermes skills browse --source official            # 仅浏览官方可选技能
hermes skills search kubernetes                   # 搜索所有来源
hermes skills search react --source skills-sh     # 搜索 skills.sh 目录
hermes skills search https://mintlify.com/docs --source well-known
hermes skills inspect openai/skills/k8s           # 安装前预览
hermes skills install openai/skills/k8s           # 带安全检查安装
hermes skills install official/security/1password
hermes skills install skills-sh/vercel-labs/json-render/json-render-react --force
hermes skills install well-known:https://mintlify.com/docs/.well-known/skills/mintlify
hermes skills list --source hub                   # 列出中心安装的
hermes skills check                               # 检查已安装的
hermes skills update                              # 必要时重新安装
hermes skills audit                               # 重新扫描所有
hermes skills uninstall k8s                       # 移除一个
hermes skills reset google-workspace              # 取消固定 "用户修改" 的捆绑技能 (见下文)
hermes skills reset google-workspace --restore    # 同时恢复捆绑版本，删除您的本地编辑
hermes skills publish skills/my-skill --to github --repo owner/repo
hermes skills snapshot export setup.json          # 导出技能配置
hermes skills tap add myorg/skills-repo           # 添加自定义 GitHub 源
```

### 支持的源

| 源 | 示例 | 备注 |
|--------|---------|-------|
| `official` | `official/security/1password` | 与 Hermes 一起提供的可选技能。 |
| `skills-sh` | `skills-sh/vercel-labs/agent-skills/vercel-react-best-practices` | 可通过 `hermes skills search <query> --source skills-sh` 搜索。Hermes 会解析别名风格的技能，当 skills.sh slug 与仓库文件夹不同时。 |
| `well-known` | `well-known:https://mintlify.com/docs/.well-known/skills/mintlify` | 直接从网站 `/.well-known/skills/index.json` 提供。搜索使用站点或文档 URL。 |
| `github` | `openai/skills/k8s` | 直接 GitHub 仓库/路径安装和自定义 tap。 |
| `clawhub`, `lobehub`, `claude-marketplace` | 特定源的标识符 | 社区或市场集成。 |

### 集成的中心和注册表

Hermes 目前集成了这些技能生态系统和发现源：

#### 1. 官方可选技能 (`official`)

这些维护在 Hermes 仓库本身中，安装时有内置信任。

- 目录：[官方可选技能目录](../../reference/optional-skills-catalog)
- 仓库中的源：`optional-skills/`
- 示例：

```bash
hermes skills browse --source official
hermes skills install official/security/1password
```

#### 2. skills.sh (`skills-sh`)

这是 Vercel 的公共技能目录。Hermes 可以直接搜索它，检查技能详情页，解析别名风格的 slug，并从底层源仓库安装。

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

这是从发布 `/.well-known/skills/index.json` 的网站进行基于 URL 的发现。这不是单一的集中式中心 —— 这是一个网络发现约定。

- 实时端点示例：[Mintlify docs skills index](https://mintlify.com/docs/.well-known/skills/index.json)
- 参考服务器实现：[vercel-labs/skills-handler](https://github.com/vercel-labs/skills-handler)
- 示例：

```bash
hermes skills search https://mintlify.com/docs --source well-known
hermes skills inspect well-known:https://mintlify.com/docs/.well-known/skills/mintlify
hermes skills install well-known:https://mintlify.com/docs/.well-known/skills/mintlify
```

#### 4. 直接 GitHub 技能 (`github`)

Hermes 可以直接从 GitHub 仓库和基于 GitHub 的 tap 安装。这在您已经知道仓库/路径或想添加自己的自定义源仓库时很有用。

默认 tap (无需设置即可浏览)：
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

作为社区源集成的第三方技能市场。

- 网站：[clawhub.ai](https://clawhub.ai/)
- Hermes 源 ID：`clawhub`

#### 6. Claude 市场风格仓库 (`claude-marketplace`)

Hermes 支持发布 Claude 兼容插件/市场清单的市场仓库。

集成的已知源包括：
- [anthropics/skills](https://github.com/anthropics/skills)
- [aiskillstore/marketplace](https://github.com/aiskillstore/marketplace)

Hermes 源 ID：`claude-marketplace`

#### 7. LobeHub (`lobehub`)

Hermes 可以搜索并将 LobeHub 公共目录中的智能体条目转换为可安装的 Hermes 技能。

- 网站：[LobeHub](https://lobehub.com/)
- 公共智能体索引：[chat-agents.lobehub.com](https://chat-agents.lobehub.com/)
- 后台仓库：[lobehub/lobe-chat-agents](https://github.com/lobehub/lobe-chat-agents)
- Hermes 源 ID：`lobehub`

### 安全扫描和 `--force`

所有从中心安装的技能都会通过**安全扫描器**检查数据泄露、提示注入、破坏性命令、供应链信号和其他威胁。

`hermes skills inspect ...` 现在还会在可用时显示上游元数据：
- 仓库 URL
- skills.sh 详情页面 URL
- 安装命令
- 每周安装量
- 上游安全审计状态
- well-known 索引/端点 URL

当您审查过第三方技能并希望覆盖非危险策略阻止时，请使用 `--force`：

```bash
hermes skills install skills-sh/anthropics/skills/pdf --force
```

重要行为：
- `--force` 可以覆盖谨慎/警告类型的发现。
- `--force` **不会**覆盖 `dangerous` 扫描判定。
- 官方可选技能 (`official/...`) 被视为内置信任，不显示第三方警告面板。

### 信任级别

| 级别 | 来源 | 策略 |
|-------|--------|--------|
| `builtin` | 随 Hermes 一起发布 | 始终可信 |
| `official` | 仓库中的 `optional-skills/` | 内置信任，无第三方警告 |
| `trusted` | 可信注册表/仓库如 `openai/skills`, `anthropics/skills` | 比社区源更宽松的策略 |
| `community` | 其他所有 (`skills.sh`, well-known 端点, 自定义 GitHub 仓库, 大多数市场) | 非危险发现可被 `--force` 覆盖；`dangerous` 判定仍被阻止 |

### 更新生命周期

中心现在跟踪足够的上游溯源信息以重新检查已安装技能的上游副本：

```bash
hermes skills check          # 报告哪些已安装的
hermes skills update         # 仅重新安装有更新的技能
hermes skills update react   # 更新一个特定的
```

这使用存储的源标识符加上当前上游包内容的哈希来检测漂移。

:::tip GitHub 速率限制
技能中心操作使用 GitHub API，未认证用户每小时有 60 个请求的限制。如果在安装或搜索期间看到速率限制错误，请在 `.env` 文件中设置 `GITHUB_TOKEN` 将限制增加到每小时 5,000 个请求。错误消息包含此情况下的可操作提示。
:::

## 捆绑技能更新 (`hermes skills reset`)

Hermes 在仓库的 `skills/` 中包含一组捆绑技能。在安装和每次 `hermes update` 时，同步过程会将这些技能复制到 `~/.hermes/skills/` 并在 `~/.hermes/skills/.bundled_manifest` 记录清单，映射每个技能名称到同步时的内容哈希 (**原始哈希**)。

每次同步时，Hermes 重新计算本地副本的哈希并与原始哈希比较：

- **未更改** → 可以安全地从上游拉取更改，复制新的捆绑版本，记录新的原始哈希。
- **已更改** → 被视为**用户修改**并永远跳过，因此您的编辑不会被覆盖。

保护是好的，但有一个尖锐的边缘。如果您编辑了捆绑技能，然后后来想放弃更改并回到捆绑版本，只需从 `~/.hermes/hermes-agent/skills/` 复制粘贴即可，清单仍然持有上次成功同步时的*旧*原始哈希。您的新复制粘贴内容 (当前捆绑哈希) 不会匹配那个陈旧的原始哈希，所以同步会不断将其标记为用户修改。

`hermes skills reset` 是逃生舱：

```bash
# 安全：清除此技能的清单条目。您的当前副本被保留，
# 但下次同步会重新基准化以它为准，使未来的更新正常工作。
hermes skills reset google-workspace

# 完全恢复：还删除您的本地副本并重新复制当前的捆绑版本。当您想要原始的
# 上游技能时使用此选项。
hermes skills reset google-workspace --restore

# 非交互式 (例如在脚本或 TUI 模式中) — 跳过 --restore 确认。
hermes skills reset google-workspace --restore --yes
```

相同的命令在聊天中作为斜杠命令也能工作：

```text
/skills reset google-workspace
/skills reset google-workspace --restore
```

:::note 配置文件
每个配置文件都有自己的 `.bundled_manifest`，位于其自己的 `HERMES_HOME` 下，所以 `hermes -p coder skills reset <name>` 只影响该配置文件。
:::

### 斜杠命令 (在聊天中)

所有相同的命令都适用于 `/skills`：

```text
/skills browse
/skills search react --source skills-sh
/skills search https://mintlify.com/docs --source well-known
/skills inspect skills-sh/vercel-labs/json-render/json-render-react
/skills install openai/skills/skill-creator --force
/skills check
/skills update
/skills reset google-workspace
/skills list
```

官方可选技能仍然使用像 `official/security/1password` 和 `official/migration/openclaw-migration` 这样的标识符。