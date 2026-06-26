---
sidebar_position: 2
title: "Skills System"
description: "On-demand knowledge documents — progressive disclosure, agent-managed skills, and the Skills Hub"
---

# Skills System

技能是**按需知识文档**，智能体可以在需要时加载它们。它们遵循**渐进式披露**模式，以最大限度地减少 token 使用量，并且与 [agentskills.io](https://agentskills.io/specification) 开放标准兼容。

所有技能都保存在 **`~/.hermes/skills/`** 中——这是主要的目录和真相来源。在首次安装时，捆绑的技能会从仓库中复制过来。通过 Hub 安装和智能体创建的技能也会放在这里。智能体可以修改或删除任何技能。

您也可以将 Hermes 指向**外部技能目录**——这些额外的文件夹会与本地目录一起被扫描。请参阅下方的 [External Skill Directories](#external-skill-directories)。

另请参考：

- [Bundled Skills Catalog](/reference/skills-catalog)
- [Official Optional Skills Catalog](/reference/optional-skills-catalog)

## 从空白状态开始

默认情况下，每个配置（profile）都会被捆绑技能目录初始化，而每次运行 `hermes update` 都会添加任何新捆绑的技能。如果您想要一个**不包含任何捆绑技能**的配置——并且这个状态在更新后保持不变——您有两种方法：

**在安装时**（适用于默认的 `~/.hermes` 配置）：

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash -s -- --no-skills
```

**在创建配置时**（命名配置）：

```bash
hermes profile create research --no-skills
```

**在已安装的配置上**（默认或命名），运行时进行切换：

```bash
hermes skills opt-out            # 停止未来的初始化——磁盘上的任何内容都不会被触碰
hermes skills opt-out --remove   # 同时删除未修改的捆绑技能（先确认）
hermes skills opt-in --sync      # 反向操作：移除标记并立即重新初始化
```

这三种路径都会在配置目录中写入一个 `.no-bundled-skills` 标记。只要该标记存在，安装程序、`hermes update` 以及任何技能同步都会跳过对该配置的捆绑技能初始化。要重新启用此功能，请删除该标记（或运行 `hermes skills opt-in`）。

:::note 默认安全
`hermes skills opt-out` 只会停止*未来的*初始化——它绝不会删除磁盘上已有的任何内容。可选的 `--remove` 标志**仅当**捆绑技能未被修改时才会删除它们（与 Hermes 安装的版本字节完全一致）。您自己编辑过的技能、从 Hub 安装的技能以及您自己编写的技能都将始终保留下来。
:::

## 使用技能（Using Skills）

每个已安装的技能都作为斜杠命令自动可用：

```bash
# 在 CLI 或任何消息平台中:
/gif-search funny cats
/axolotl help me fine-tune Llama 3 on my dataset
/github-pr-workflow create a PR for the auth refactor
/plan design a rollout for migrating our auth provider

# 只需技能名称即可加载，然后让智能体询问你需要什么:
/excalidraw
```

捆绑的 `plan` 技能就是一个很好的例子。运行 `/plan [请求]` 会加载该技能的说明，指示 Hermes 在需要时检查上下文、而不是执行任务，而是编写一个 Markdown 实现计划，并将结果保存在相对于活动工作区/后端工作目录的 `.hermes/plans/` 下。

您也可以通过自然对话与技能进行交互：

```bash
hermes chat --toolsets skills -q "你有哪些技能？"
hermes chat --toolsets skills -q "给我看看 axolotl 技能"
```

## 从源头学习技能（Learning a skill from sources, `/learn`）

`/learn` 是将您已知的东西——或一大堆参考资料——转化为可重用技能的快速方法，而无需手动编写 `SKILL.md`。它具有开放性：您可以将其指向*任何可以描述的事物*，智能体就会利用其已有的工具收集材料，然后撰写一个遵循 [房屋作者标准](#skillmd-format)（≤60 个字符的描述、标准的章节顺序、Hermes 工具框架、不虚构命令）的技能。

```bash
# 一个本地 SDK 或文档目录 — 使用 read_file / search_files 读取
/learn ~/projects/acme-sdk 中的 REST 客户端，重点关注认证和分页

# 一个在线文档页面 — 使用 web_extract 获取
/learn https://docs.example.com/api/quickstart

# 您刚刚在本次对话中引导智能体完成的工作流程
/learn 我如何部署了暂存服务器

# 粘贴的笔记 / 一种描述的程序
/learn 报销：打开门户，新建 > 费用，附加收据，提交
```

由于实时智能体负责源头收集（sourcing），因此 `/learn` 在 CLI、消息网关、TUI 和仪表板上都功能相同——因为没有单独的摄取引擎。在**仪表板**中，“技能”页面有一个“学习一个技能”按钮，它会打开一个包含目录字段、URL 字段和开放式文本框的面板；它会组合一个 `/learn` 请求并在聊天中运行它。

这里没有模型-工具足迹：`/learn` 构建一个遵循标准的提示词，并将其作为正常的轮次交给智能体。智能体使用 `skill_manage` 工具保存结果，因此如果您启用了 [限制技能写入的批准门控](#gating-agent-skill-writes-skillswrite_approval)，该门控就会生效。

## 渐进式披露（Progressive Disclosure）

技能采用一种高效的令牌加载模式：

```
Level 0: skills_list()           → [{name, description, category}, ...]   (~3k tokens)
Level 1: skill_view(name)        → 全部内容 + 元数据       (varies)
Level 2: skill_view(name, path)  → 特定参考文件       (varies)
```

智能体只有在真正需要时才会加载完整的技能内容。

## SKILL.md 格式

```markdown
---
name: my-skill
description: 此技能功能的简要描述
version: 1.0.0
platforms: [macos, linux]     # 可选 — 限制到特定的操作系统平台
metadata:
  hermes:
    tags: [python, automation]
    category: devops
    fallback_for_toolsets: [web]    # 可选 — 条件激活（见下文）
    requires_toolsets: [terminal]   # 可选 — 条件激活（见下文）
    config:                          # 可选 — config.yaml 设置
      - key: my.setting
        description: "此项控制的内容"
        default: "value"
        prompt: "设置提示词"
---

# 技能标题

## 何时使用 (When to Use)
该技能的触发条件。

## 流程 (Procedure)
1. 第一步
2. 第二步

## 潜在陷阱 (Pitfalls)
- 已知的故障模式和修复方法

## 验证 (Verification)
如何确认它已成功运行。
```

### 特定平台技能（Platform-Specific Skills）

技能可以使用 `platforms` 字段限制自身到特定的操作系统：

| 值 | 匹配项 |
|-------|---------|
| `macos` | macOS (Darwin) |
| `linux` | Linux |
| `windows` | Windows |

```yaml
platforms: [macos]            # 仅限 macOS（例如 iMessage、Apple Reminders、查找我的）
platforms: [macos, linux]     # macOS 和 Linux
```

设置后，该技能将自动从系统提示符、`skills_list()` 和不兼容的平台上的斜杠命令中隐藏。如果省略，则在所有平台上加载。

## 技能输出和媒体交付（Skill output and media delivery）

当一个技能响应（或任何智能体响应）包含一个媒体文件的裸绝对路径——例如 `/home/user/screenshots/diagram.png` ——网关会自动检测到它，将其从可见文本中剥离，并原生地将文件交付给用户的聊天（Telegram 照片、Discord 附件等），而不是在消息中留下原始路径。

对于音频而言，`[[audio_as_voice]]` 指令会将音频文件提升为支持该功能的平台上的原生语音消息气泡（Telegram, WhatsApp）。

### 强制文档式交付：`[[as_document]]`

有时您需要的是**相反的**内联预览：您希望文件作为可下载附件交付，而不是一个重新压缩的图像气泡。经典的例子是高分辨率截图或图表——Telegram 的 `sendPhoto` 会将其重新压缩到约 200 KB / 1280 px，从而破坏可读性。通过 `sendDocument` 发送的 1-2 MB PNG 可以保持原始字节不变。

如果一个响应（或其中的任何文本——通常是最后一行）包含字面指令 `[[as_document]]`，则从该响应中提取的每个媒体路径都将作为文档/文件附件交付，而不是图像气泡：

```
这是您渲染的图表:

/home/user/.hermes/cache/chart-q4-2025.png

[[as_document]]
```

该指令会在交付前被剥离，因此用户永远不会看到它。粒度是故意为所有或无（all-or-nothing）的响应级别：只需发出一次 `[[as_document]]`，同一响应中的所有图像路径都将作为文档交付。这与 `[[audio_as_voice]]` 的范围是一致的。

在以下情况下使用它：

- 您生成了用户需要作为文件（用于在其他工具中编辑、归档、完整分享）的截图或图表。
- 默认的有损预览会遮盖细节（小文本、像素精确的图表、颜色敏感的渲染）。

没有单独文档路径的平台（例如 SMS）将回退到它们拥有的任何附件机制。

### 条件激活（Fallback Skills）

技能可以根据当前会话中可用的工具自动显示或隐藏自身。这对于**备用技能 (fallback skills)**——仅当高级工具不可用时才应该出现的免费或本地替代方案——最为有用。

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
| `fallback_for_toolsets` | 当列出的工具集**可用**时，技能将被**隐藏**。当它们缺失时才显示。 |
| `fallback_for_tools` | 相同，但检查单个工具而不是工具集。 |
| `requires_toolsets` | 当列出的工具集**不可用**时，技能将被**隐藏**。当它们存在时才显示。 |
| `requires_tools` | 相同，但检查单个工具。 |

**示例：** 内置的 `duckduckgo-search` 技能使用了 `fallback_for_toolsets: [web]`。当您设置了 `FIRECRAWL_API_KEY` 时，Web 工具集是可用的，智能体使用 `web_search`——DuckDuckGo 技能将保持隐藏。如果 API 密钥缺失，Web 工具集不可用，DuckDuckGo 技能将自动作为备用选项出现。

没有条件字段的技能行为与以前完全相同——它们总是可见的。

## 加载时的安全设置（Secure Setup on Load）

技能可以声明所需的环境变量，而不会从发现中消失：

```yaml
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: Tenor API 密钥
    help: 从 https://developers.google.com/tenor 获取密钥
    required_for: 完全功能性
```

当遇到缺失的值时，Hermes 只在技能实际加载到本地 CLI 时才会安全地询问它。您可以跳过设置并继续使用该技能。消息界面永远不会在聊天中询问秘密信息——它们会告诉您使用 `hermes setup` 或在本地使用 `~/.hermes/.env`。

一旦设置好，声明的环境变量就会**自动传递**给 `execute_code` 和 `terminal` 沙箱——技能的脚本可以直接使用 `$TENOR_API_KEY`。对于非技能环境变量，请使用 `terminal.env_passthrough` 配置选项。有关详细信息，请参阅 [环境变量传递](/user-guide/security#environment-variable-passthrough)。

### 技能配置设置（Skill Config Settings）

技能还可以声明存储在 `config.yaml` 中的非秘密配置设置（路径、偏好）：

```yaml
metadata:
  hermes:
    config:
      - key: myplugin.path
        description: 插件数据目录的路径
        default: "~/myplugin-data"
        prompt: 插件数据目录路径
```

这些设置存储在您的 `config.yaml` 中的 `skills.config` 下。`hermes config migrate` 会提示未配置的设置，而 `hermes config show` 会显示它们。当一个技能加载时，其解析后的配置值会被注入到上下文中，因此智能体会自动知道这些配置值。

有关详细信息，请参阅 [技能设置](/user-guide/configuration#skill-settings) 和 [创建技能 — 配置设置](/developer-guide/creating-skills#config-settings-configyaml)。

## 技能目录结构

```text
~/.hermes/skills/                  # 单一真相来源
├── mlops/                         # 分类目录
│   ├── axolotl/
│   │   ├── SKILL.md               # 主要说明（必需）
│   │   ├── references/            # 附加文档
│   │   ├── templates/             # 输出格式
│   │   ├── scripts/               # 可由技能调用的辅助脚本
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
└── .bundled_manifest              # 跟踪已播种捆绑技能
```

## 外部技能目录

如果您在 Hermes 之外维护技能——例如，一个由多个 AI 工具使用的共享 `~/.agents/skills/` 目录——您可以指示 Hermes 扫描这些目录。

在 `~/.hermes/config.yaml` 的 `skills` 部分下添加 `external_dirs`：

```yaml
skills:
  external_dirs:
    - ~/.agents/skills
    - /home/shared/team-skills
    - ${SKILLS_REPO}/skills
```

路径支持 `~` 扩展和 `${VAR}` 环境变量替换。

### 工作原理

- **本地创建，原地更新**: 新的智能体创建的技能会写入 `~/.hermes/skills/`。现有技能会在它们被找到的地方进行修改，包括位于 `external_dirs` 下的技能，当智能体使用 `patch`、`edit`、`write_file`、`remove_file` 或 `delete` 等 `skill_manage` 操作时。
- **外部目录不是写入保护边界**: 如果 Hermes 进程可以写入一个外部技能目录，则智能体管理的技能更新可能会更改该目录中的文件。如果共享的外部技能必须保持只读，请使用文件系统权限或单独的配置文件/工具集设置。
- **本地优先**: 如果同一个技能名称同时存在于本地目录和外部目录中，则以本地版本为准。
- **完全集成**: 外部技能会出现在系统提示索引、`skills_list`、`skill_view` 中，并作为 `/skill-name` 斜杠命令出现——与本地技能没有任何区别。
- **不存在的路径会被静默跳过**: 如果配置的目录不存在，Hermes 会忽略它而不会报错。这对于可能在每台机器上都不存在的可选共享目录非常有用。

### 示例

```text
~/.hermes/skills/               # 本地（主要、读写）
├── devops/deploy-k8s/
│   └── SKILL.md
└── mlops/axolotl/
    └── SKILL.md

~/.agents/skills/               # 外部（共享，如果可写则可变）
├── my-custom-workflow/
│   └── SKILL.md
└── team-conventions/
    └── SKILL.md
```

所有四个技能都会出现在您的技能索引中。如果您在本地创建了一个名为 `my-custom-workflow` 的新技能，它将覆盖外部版本。

## 技能捆绑包 (Skill Bundles)

技能捆绑包是用于将多个技能归类到一个斜杠命令下的微小 YAML 文件。当你运行 `/<bundle-name>` 时，捆绑包中列出的所有技能都会一次性加载——这在某个特定任务总是受益于同一组技能时特别有用。

### 快速示例 (Quick example)

```bash
# 为后端功能工作创建捆绑包
hermes bundles create backend-dev \
  --skill github-code-review \
  --skill test-driven-development \
  --skill github-pr-workflow \
  -d "Backend feature work — review, test, PR workflow"
```

然后在 CLI 或任何网关平台中：

```
/backend-dev refactor the auth middleware
```

智能体接收到所有三个技能，它们被加载到一个用户消息中，斜杠命令后的任何文本都被附加为用户的指令。

### YAML 模式 (YAML schema)

捆绑包位于 **`~/.hermes/skill-bundles/<slug>.yaml`** 中，格式如下：

```yaml
name: backend-dev
description: Backend feature work — review, test, PR workflow.
skills:
  - github-code-review
  - test-driven-development
  - github-pr-workflow
instruction: |
  Always start by writing failing tests, then implement.
  Open the PR through the standard workflow with co-author tags.
```

字段说明：
- `name` (可选 — 默认为文件名干): 捆绑包的显示名称。它会被规范化为一个连字符分隔符（hyphen slug）用于斜杠命令（例如 `Backend Dev` → `/backend-dev`）。
- `description` (可选)：在 `/bundles` 和 `hermes bundles list` 中显示的简短文本。
- `skills` (必需，非空列表)：技能名称或相对于你的技能目录的路径。使用你传递给 `/<skill-name>` 的相同标识符。
- `instruction` (可选)：附加到加载技能内容前的额外指导。可用于固化“我们如何总是将它们一起使用”的方法。

### 管理捆绑包 (Managing bundles)

```bash
# 列出所有已安装的捆绑包
hermes bundles list

# 检查一个捆绑包
hermes bundles show backend-dev

# 交互式创建捆绑包（省略 --skill 标志以逐行输入）
hermes bundles create research

# 覆盖现有捆绑包
hermes bundles create backend-dev --skill ... --force

# 删除一个捆绑包
hermes bundles delete backend-dev

# 重新扫描 ~/.hermes/skill-bundles/ 并报告更改
hermes bundles reload
```

在聊天会话中，`/bundles` 会列出所有已安装的捆绑包及其技能。

### 行为 (Behavior)

- **当斜杠命令冲突时，捆绑包优先于单个技能**。如果你命名了一个名为 `research` 的捆绑包，而你还有一个名为 `research` 的技能，那么 `/research` 将会调用该捆绑包。这是故意的——你是通过命名来选择使用此捆绑包的。
- **缺失的技能会被跳过，而不是致命错误**。如果一个捆绑包列出了 `skill-foo` 但你尚未安装它，则捆绑包仍会加载可解析的技能，并且智能体会收到一份说明了哪些被跳过的列表。
- **捆绑包在所有表面上都有效**——包括交互式 CLI、TUI、仪表板聊天和所有网关平台（Telegram、Discord、Slack 等）——因为分派是集中在与单个技能命令相同的地点进行的。
- **捆绑包不会使提示缓存失效**。它们在调用时生成一个全新的用户消息，这与 `/<skill-name>` 的行为方式相同——没有系统提示的突变。

### 何时使用捆绑包优于手动安装每个技能

当你满足以下条件时，请使用捆绑包：
- 你总是将相同的技能配对用于重复性的任务（例如 `/backend-dev`、`/release-prep`、`/incident-response`）。
- 你希望比一行接一行的 `/skill` 调用更少一个字符的心理模型。
- 你希望通过将捆绑 YAML 检查到共享的 dotfiles 仓库中，并将其符号链接到 `~/.hermes/skill-bundles/` 来发布一个团队范围的“任务配置”。

捆绑包只是一个 YAML 别名——它不会为你安装技能。技能本身必须已经存在（在 `~/.hermes/skills/` 或外部技能目录中）。否则，捆绑调用的操作只会跳过缺失的部分。

## 智能体管理的技能 (Agent-Managed Skills) (skill_manage 工具)

智能体可以通过 `skill_manage` 工具创建、更新和删除自己的技能。这是该智能体的**程序性记忆**——当它弄清楚一个非平凡的工作流程时，它会将这种方法保存为技能以供未来重用。

技能和记忆共同构成了自我改进循环：记忆存储应该始终处于上下文中的少量持久事实，而技能则存储应该仅在相关时加载的更长远程序。背景审查可以在会话结束后建议或暂存技能更改，但下面的写入审批门控允许你要求人工审核这些更改后再落地。

### 智能体创建技能的情况 (When the Agent Creates Skills)

- 成功完成一个复杂的任务（5 个以上的工具调用）后
- 它遇到错误或死胡同时并找到了可行的路径
- 用户修正了它的方法
- 它发现了一个非平凡的工作流程

### 操作 (Actions)

| 操作 | 用途 | 关键参数 |
|--------|---------|------------|
| `create` | 从零开始创建新技能 | `name`, `content` (完整的 SKILL.md), 可选的 `category` |
| `patch` | 定向修复（首选） | `name`, `old_string`, `new_string` |
| `edit` | 重大的结构性重写 | `name`, `content` (完整的 SKILL.md 替换内容) |
| `delete` | 完全移除一个技能 | `name` |
| `write_file` | 添加/更新支持文件 | `name`, `file_path`, `file_content` |
| `remove_file` | 移除支持文件 | `name`, `file_path` |

:::tip
对于更新，推荐使用 `patch` 操作——因为它比 `edit` 更节省令牌，因为只有更改的文本会出现在工具调用中。
:::

### 门控智能体技能写入 (`skills.write_approval`)

默认情况下，智能体可以自由地写入技能——包括来自运行在回合后的[背景自我改进审查](/user-guide/features/memory#controlling-memory-writes-write_approval)。如果你宁愿先批准每一次技能写入（那些判断失误的小模型、安全环境或只是想让人们关注自我改进循环），请开启写入审批门控：

```yaml
skills:
  write_approval: false     # false = 自由写入 (默认) | true = 需要批准
```

当 `write_approval: true` 时，每一次 `skill_manage` 写入（创建 / 编辑 / patch / 删除 / write_file / remove_file）都会被**暂存**而不是提交——SKILL.md 文件太大无法进行行内审查，因此无论写入是来自前台回合还是背景审查，暂存都适用。暂存的写入会在 `~/.hermes/pending/skills/` 下幸存下来，并以与危险命令相同的熟悉批准/拒绝流程进行审查：

```
/skills pending             # 列出暂存的技能写入 + 每个的一行摘要
/skills diff <id>           # 完整的统一差异（最好在 CLI 或仪表板中查看）
/skills approve <id>        # 应用它（或 'all'）
/skills reject <id>         # 丢弃它（或 'all'）
/skills approval on         # 打开门控（或 'off'）并持久化它
```

审查界面在交互式 CLI 和消息平台中工作（聊天气泡中的差异输出会被截断——请在 CLI 或在 pending JSON 文件中阅读完整的差异）。记忆写入也有相同的门控，位于 `memory.write_approval` 下——参见[控制记忆写入](/user-guide/features/memory#controlling-memory-writes-write_approval)。

> 单独的 `skills.guard_agent_created` 设置是一个内容扫描器（危险模式启发式），而不是一个审批门控——两者是独立的。参见[对智能体创建的技能写入进行防护](/user-guide/configuration#guard-on-agent-created-skill-writes)。

## 技能中心 (Skills Hub)

从在线注册表、`skills.sh`、直接知名的技能端点和官方可选技能中浏览、搜索、安装和管理技能。

### 常用命令 (Common commands)

```bash
hermes skills browse                              # 浏览所有中心技能（官方优先）
hermes skills browse --source official            # 只浏览官方可选技能
hermes skills search kubernetes                   # 搜索所有来源
hermes skills search react --source skills-sh     # 搜索 skills.sh 目录
hermes skills search https://mintlify.com/docs --source well-known
hermes skills inspect openai/skills/k8s           # 在安装前预览
hermes skills install openai/skills/k8s           # 进行安全扫描后安装
hermes skills install official/security/1password
hermes skills install skills-sh/vercel-labs/json-render/json-render-react --force
hermes skills install well-known:https://mintlify.com/docs/.well-known/skills/mintlify
hermes skills install https://sharethis.chat/SKILL.md              # 直接 URL (单文件 SKILL.md)
hermes skills install https://example.com/SKILL.md --name my-skill # 当前言没有名称时覆盖名称
hermes skills list --source hub                   # 列出已安装的中心技能
hermes skills check                               # 检查已安装的中心技能是否有上游更新
hermes skills update                              # 在需要时重新安装具有上游更改的中心技能
hermes skills audit                               # 重新扫描所有中心技能以进行安全审计
hermes skills uninstall k8s                       # 移除一个中心技能
hermes skills reset google-workspace              # 将捆绑技能从“用户修改”状态中解绑（见下文）
hermes skills reset google-workspace --restore    # 同时恢复捆绑版本，删除本地编辑
hermes skills publish skills/my-skill --to github --repo owner/repo
hermes skills snapshot export setup.json          # 导出技能配置
hermes skills tap add myorg/skills-repo           # 添加一个自定义 GitHub 源
```

### 支持的中心来源 (Supported hub sources)

| 来源 | 示例 | 说明 |
|--------|---------|-------|
| `official` | `official/security/1password` | 与 Hermes 一同提供的可选技能。 |
| `skills-sh` | `skills-sh/vercel-labs/agent-skills/vercel-react-best-practices` | 可通过 `hermes skills search <query> --source skills-sh` 搜索。当 skills.sh 的 slug 与仓库文件夹不同时，Hermes 会解析别名风格的技能。 |
| `well-known` | `well-known:https://mintlify.com/docs/.well-known/skills/mintlify` | 直接从网站上的 `/.well-known/skills/index.json` 文件提供的技能。搜索时使用站点或文档 URL。 |
| `url` | `https://sharethis.chat/SKILL.md` | 指向单文件 `SKILL.md` 的直接 HTTP(S) URL。名称解析顺序：前言 → URL 路径 → 交互式提示 → `--name` 标志。 |
| `github` | `openai/skills/k8s` | 直接从 GitHub 仓库/路径安装和自定义 Tap。 |
| `clawhub`, `lobehub`, `browse-sh` | 特定来源标识符 | 社区或市场集成。 |

### 集成的中心和注册表 (Integrated hubs and registries)

Hermes 目前集成了以下技能生态系统和发现源：

#### 1. 官方可选技能 (`official`)

这些技能保存在 Hermes 仓库本身中，并带有内置信任。

- 目录：[官方可选技能目录](../../reference/optional-skills-catalog)
- 仓库中的来源：`optional-skills/`
- 示例：

```bash
hermes skills browse --source official
hermes skills install official/security/1password
```

#### 2. skills.sh (`skills-sh`)

这是 Vercel 的公共技能目录。Hermes 可以直接搜索它、检查技能详情页面、解析别名风格的 slug，并从底层源仓库安装。

- 目录：[skills.sh](https://skills.sh/)
- CLI/工具仓库：[vercel-labs/skills](https://github.com/vercel-labs/skills)
- 官方 Vercel 技能仓库：[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)
- 示例：

```bash
hermes skills search react --source skills-sh
hermes skills inspect skills-sh/vercel-labs/json-render/json-render-react
hermes skills install skills-sh/vercel-labs/json-render/json-render-react --force
```

#### 3. 知名技能端点 (`well-known`)

这是来自发布 `/.well-known/skills/index.json` 的网站的基于 URL 的发现机制。它不是一个单一的集中枢纽——它是一种网络发现约定。

- 示例实时端点：[Mintlify 文档技能索引](https://mintlify.com/docs/.well-known/skills/index.json)
- 参考服务器实现：[vercel-labs/skills-handler](https://github.com/vercel-labs/skills-handler)
- 示例：

```bash
hermes skills search https://mintlify.com/docs --source well-known
hermes skills inspect well-known:https://mintlify.com/docs/.well-known/skills/mintlify
hermes skills install well-known:https://mintlify.com/docs/.well-known/skills/mintlify
```

#### 4. 直接 GitHub 技能 (`github`)

Hermes 可以直接从 GitHub 仓库和基于 GitHub 的 Tap 进行安装。当你已知仓库/路径或想添加自己的自定义源时，这非常有用。

默认 Tap（无需任何设置即可浏览）：
- [openai/skills](https://github.com/openai/skills)
- [anthropics/skills](https://github.com/anthropics/skills)
- [huggingface/skills](https://github.com/huggingface/skills)
- [NVIDIA/skills](https://github.com/NVIDIA/skills) — NVIDIA 验证的技能（带有 `skill.oms.sig` + 治理 `skill-card.md`）
- [garrytan/gstack](https://github.com/garrytan/gstack)

- 示例：

```bash
hermes skills install openai/skills/k8s
hermes skills tap add myorg/skills-repo
```

**类别分组 (`skills.sh.json`)。** 一个 GitHub Tap 可以在其仓库根部发布一个 `skills.sh.json` 文件，遵循[skills.sh 模式](https://skills.sh/schemas/skills.sh.schema.json)。它的 `groupings`（每个都包含一个 `title` 和技能名称列表）会在索引时被读取，并成为在[技能中心](https://hermes-agent.nousresearch.com/docs)页面上显示的类别标签——而不是基于标签推断的。这是通用的：任何发布该文件的 Tap 都能获得真正的分类，无需 Hermes 端进行更改。

```json
{
  "$schema": "https://skills.sh/schemas/skills.sh.schema.json",
  "groupings": [
    { "title": "推理 AI (Inference AI)", "skills": ["dynamo-recipe-runner", "dynamo-router-sla"] },
    { "title": "决策优化 (Decision Optimization)", "skills": ["cuopt-developer", "cuopt-install"] }
  ]
}
```

#### 5. ClawHub (`clawhub`)

一个作为社区源集成的第三方技能市场。

- 网站：[clawhub.ai](https://clawhub.ai/)
- Hermes 源 ID：`clawhub`

#### 6. Claude 市场风格的仓库 (`claude-marketplace`)

Hermes 支持发布 Claude 兼容插件/市场清单的市场仓库。

已知的集成源包括：
- [anthropics/skills](https://github.com/anthropics/skills)
- [aiskillstore/marketplace](https://github.com/aiskillstore/marketplace)

Hermes 源 ID：`claude-marketplace`

#### 7. LobeHub (`lobehub`)

Hermes 可以搜索并将 LobeHub 公共目录中的智能体条目转换为可安装的 Hermes 技能。

- 网站：[LobeHub](https://lobehub.com/)
- 公众智能体索引：[chat-agents.lobehub.com](https://chat-agents.lobehub.com/)
- 后端仓库：[lobehub/lobe-chat-agents](https://github.com/lobehub/lobe-chat-agents)
- Hermes 源 ID：`lobehub`

#### 8. browse.sh (`browse-sh`)

Hermes 集成了 [browse.sh](https://browse.sh)，这是 Browserbase 提供的包含 200+ 个特定网站的浏览器自动化 SKILL.md 文件（Airbnb, Amazon, arXiv, 12306.cn, Etsy, Xero 等）。每个技能都描述了如何端到端地驱动一个网站，适用于与 Hermes 的浏览器工具和任何你已安装的浏览器自动化技能一起使用。

- 网站：[browse.sh](https://browse.sh/)
- 目录 API：`https://browse.sh/api/skills`
- Hermes 源 ID：`browse-sh`
- 信任级别：`community`

```bash
hermes skills search airbnb --source browse-sh
hermes skills inspect browse-sh/airbnb.com/search-listings-ddgioa
hermes skills install browse-sh/airbnb.com/search-listings-ddgioa
```

标识符采用 `browse-sh/<hostname>/<task-id>` 的形式，并匹配 browse.sh 目录暴露的 slug。内容是通过每个技能详情端点（`/api/skills/<slug>` → `skillMdUrl`）而不是通过目录的 GitHub `sourceUrl` 来解析的。

#### 9. 直接 URL (`url`)

直接从任何 HTTP(S) URL 安装一个单文件 `SKILL.md`——当作者在其自己的网站上托管技能时特别有用（没有中心列表，没有可供输入的 GitHub 路径）。Hermes 会获取该 URL，解析 YAML 前言，进行安全扫描并安装。

- Hermes 源 ID：`url`
- 标识符：URL 本身（无需前缀）
- 范围：**仅限单文件 `SKILL.md`**。带有 `references/` 或 `scripts/` 的多文件技能需要一个清单，应该通过上述任一来源发布。

```bash
hermes skills install https://sharethis.chat/SKILL.md
hermes skills install https://example.com/my-skill/SKILL.md --category productivity
```

名称解析顺序：
1. SKILL.md YAML 前言中的 `name:` 字段（推荐——每个格式正确的技能都应该有）。
2. 来自 URL 路径的父目录名（例如 `.../my-skill/SKILL.md` → `my-skill`，或 `.../my-skill.md` → `my-skill`），前提是它是一个有效的标识符（`^[a-z][a-z0-9_-]*$`）。
3. 具有 TTY 的终端中的交互式提示。
4. 在非交互式表面上（TUI 中的 `/skills install` 斜杠命令、网关平台、脚本），显示一个指向 `--name` 覆盖的清晰错误。

```bash
# 前言中没有名称，而 URL slug 没有帮助——请提供一个：
hermes skills install https://example.com/SKILL.md --name sharethis-chat

# 或在聊天会话中：
/skills install https://example.com/SKILL.md --name sharethis-chat
```

信任级别始终为 `community`——与所有其他来源一样进行相同的安全扫描。URL 被存储为安装标识符，因此当你想要刷新时，`hermes skills update` 会自动从同一 URL 重新获取。

### 安全扫描和 `--force`

所有中心安装的技能都会经过一个**安全扫描器**，该扫描器会检查数据泄露、提示注入、破坏性命令、供应链信号和其他威胁。

`hermes skills inspect ...` 现在也会显示可用的上游元数据：
- 仓库 URL
- skills.sh 详情页面 URL
- 安装命令
- 每周安装量
- 上游安全审计状态
- well-known 索引/端点 URL

当你审查了第三方技能并想覆盖一个非危险的策略块时，请使用 `--force`：

```bash
hermes skills install skills-sh/anthropics/skills/pdf --force
```

重要行为：
- `--force` 可以覆盖用于警告/提示性发现的策略块。
- `--force` **不会**覆盖 `dangerous`（危险）的安全扫描裁决。
- 官方可选技能 (`official/...`) 被视为内置信任，不会显示第三方警告面板。

### 信任级别 (Trust levels)

| 级别 | 来源 | 策略 |
|-------|--------|--------|
| `builtin` | 与 Hermes 一同提供 | 始终信任 |
| `official` | 仓库中的 `optional-skills/` | 内置信任，无第三方警告 |
| `trusted` | 受信任的注册表/仓库，例如 `openai/skills`, `anthropics/skills`, `huggingface/skills`, `NVIDIA/skills` | 比社区来源更宽松的策略 |
| `community` | 所有其他内容（`skills.sh`、知名端点、自定义 GitHub 仓库、大多数市场） | 非危险的发现可以使用 `--force` 覆盖；`dangerous` 裁决仍会被阻止 |

### 更新生命周期 (Update lifecycle)

中心现在跟踪了足够的出处信息，可以重新检查已安装技能的上游副本：

```bash
hermes skills check          # 报告哪些已安装的中心技能发生了上游更改
hermes skills update         # 仅重新安装有可用更新的技能
hermes skills update react   # 更新一个特定的已安装中心技能
```

这使用了存储的来源标识符加上当前的上游捆绑内容哈希值来检测漂移。

:::tip GitHub 速率限制 (GitHub rate limits)
技能中心操作使用 GitHub API，对于未经验证的用户，其速率限制为每小时 60 个请求。如果你在安装或搜索过程中看到速率限制错误，请在 `.env` 文件中设置 `GITHUB_TOKEN` 以将限制提高到每小时 5,000 个请求。错误消息会包含一个可操作的提示来解决此问题。
:::

### 发布自定义技能 Tap (Publishing a custom skill tap)

如果你想分享一套精选的技能——无论是为了你的团队、组织还是公开——你可以将它们发布为一个**Tap**：这是一个 GitHub 仓库，其他 Hermes 用户通过 `hermes skills tap add <owner/repo>` 添加。不需要服务器、无需注册注册表、无需发布流程。只需要一个包含 `SKILL.md` 文件的目录。

#### 仓库布局 (Repo layout)

一个 Tap 是任何 GitHub 仓库（公共或私有——私有的需要 `GITHUB_TOKEN`）以这种方式布局：

```
owner/repo
├── skills/                       # 默认路径；可为每个 Tap 配置
│   ├── my-workflow/
│   │   ├── SKILL.md              # 必需
│   │   ├── references/           # 可选的支持文件
│   │   ├── templates/
│   │   └── scripts/
│   ├── another-skill/
│   │   └── SKILL.md
│   └── third-skill/
│       └── SKILL.md
└── README.md                     # 可选但有帮助
```

规则：
- 每个技能都位于 Tap 根路径下的自己的目录中（默认 `skills/`）。
- 目录名将成为该技能的安装 slug。
- 每个技能目录必须包含一个带有标准[SKILL.md 前言](#skillmd-format) (`name`, `description`，以及可选的 `metadata.hermes.tags`, `version`, `author`, `platforms`, `metadata.hermes.config`) 的 `SKILL.md`。
- `references/`, `templates/`, `scripts/`, `assets/` 等子目录会在安装时与 `SKILL.md` 一起下载。
- 目录名以 `.` 或 `_` 开头的技能将被忽略。

Hermes 通过列出 Tap 路径下的每个子目录并对每个目录进行探测来发现技能。

#### 最小 Tap 示例 (Minimal tap example)

```
my-org/hermes-skills
└── skills/
    └── deploy-runbook/
        └── SKILL.md
```

`skills/deploy-runbook/SKILL.md`:

```markdown
---
name: deploy-runbook
description: 我们的部署手册 — 服务、回滚、Slack 通道
version: 1.0.0
author: My Org Platform Team
metadata:
  hermes:
    tags: [deployment, runbook, internal]
---

# Deploy Runbook

步骤 1: ...
```

将其推送到 GitHub 后，任何 Hermes 用户都可以订阅并安装：

```bash
hermes skills tap add my-org/hermes-skills
hermes skills search deploy
hermes skills install my-org/hermes-skills/deploy-runbook
```

#### 非默认路径 (Non-default paths)

如果你的技能没有位于 `skills/` 下（当你在现有项目中添加一个 `skills/` 子树时很常见），请编辑 `~/.hermes/.hub/taps.json` 中的 Tap 条目：

```json
{
  "taps": [
    {"repo": "my-org/platform-docs", "path": "internal/skills/"}
  ]
}
```

`hermes skills tap add` CLI 默认将新 Tap 的 `path` 设置为 `"skills/"`；如果需要不同的路径，请直接编辑该文件。`hermes skills tap list` 会显示每个 Tap 的有效路径。

#### 直接安装单个技能（无需添加 Tap）(Installing individual skills directly (without adding a tap))

用户也可以从任何公共 GitHub 仓库中安装单个技能，而无需将整个仓库添加为 Tap：

```bash
hermes skills install owner/repo/skills/my-workflow
```

当你想要分享一个技能而不是要求用户订阅你的整个注册表时，这非常有用。

#### Tap 的信任级别 (Trust levels for taps)

新的 Tap 默认被分配 `community` 信任。从它们安装的技能会经过标准的安全扫描，并在首次安装时显示第三方警告面板。如果你的组织或一个广受信任的来源应该获得更高的信任度，请将它的仓库添加到 `tools/skills_hub.py` 中的 `TRUSTED_REPOS`（需要 Hermes 核心 PR）。

#### Tap 管理 (Tap management)

```bash
hermes skills tap list                                # 显示所有已配置的 Tap
hermes skills tap add myorg/skills-repo               # 添加 (默认路径: skills/)
hermes skills tap remove myorg/skills-repo            # 移除
```

在运行会话中：

```
/skills tap list
/skills tap add myorg/skills-repo
/skills tap remove myorg/skills-repo
```

Tap 存储在 `~/.hermes/.hub/taps.json` 中（按需创建）。

## 捆绑技能更新 (hermes skills reset)

Hermes 内置了一套位于仓库 `skills/` 目录下的捆绑技能。在安装和每次运行 `hermes update` 时，系统都会执行一次同步过程，将这些技能复制到 `~/.hermes/skills/` 中，并在 `~/.hermes/skills/.bundled_manifest` 文件中记录一份清单，该清单将每个技能名称映射到它被同步时的内容哈希（**原始哈希**）。

在每次同步过程中，Hermes 都会重新计算本地副本的哈希值并将其与原始哈希进行比较：

- **未更改 (Unchanged)** → 安全地拉取上游更改，复制新的捆绑版本，记录新的原始哈希。
- **已更改 (Changed)** → 被视为**用户修改**并永久跳过，因此您的编辑内容不会被覆盖。

这种保护机制是可靠的，但它有一个锋利的侧面。如果您编辑了一个捆绑技能，然后稍后想放弃这些更改，通过从 `~/.hermes/hermes-agent/skills/` 复制粘贴来恢复到捆绑版本，那么清单仍然保留着上次成功同步时的*旧*原始哈希。您新鲜的复制粘贴内容（当前的捆绑哈希）将与那个陈旧的原始哈希不匹配，因此同步会继续将其标记为用户修改。

`hermes skills reset` 就是逃生舱：

```bash
# 安全操作：清除此技能的清单条目。您的当前副本会被保留，
# 但下一次同步会基于它进行重新基线设置，从而使未来的更新正常工作。
hermes skills reset google-workspace

# 完全恢复：也会删除本地副本并重新复制当前的捆绑版本。当您想要恢复到原始的上游技能时，请使用此命令。
hermes skills reset google-workspace --restore

# 非交互式（例如在脚本或 TUI 模式中）—跳过 --restore 的确认。
hermes skills reset google-workspace --restore --yes
```

相同的命令也可以作为聊天中的斜杠命令使用：

```text
/skills reset google-workspace
/skills reset google-workspace --restore
```

:::note Profiles
每个配置文件都有自己 `HERMES_HOME` 下的 `.bundled_manifest`，因此 `hermes -p coder skills reset <name>` 只会影响该配置文件。
:::

### 斜杠命令 (在聊天中)

所有这些命令都可以使用 `/skills`：

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

官方可选技能仍然使用 `official/security/1password` 和 `official/migration/openclaw-migration` 等标识符。