---
sidebar_position: 2
title: "技能系统"
description: "按需加载的知识文档 — 渐进式披露、智能体管理的技能以及技能中心"
---

# 技能系统

技能是智能体可以在需要时加载的按需知识文档。它们遵循**渐进式披露**模式以最小化令牌使用量，并且兼容 [agentskills.io](https://agentskills.io/specification) 开放标准。

所有技能都存储在 **`~/.hermes/skills/`** — 这是主要目录和真实数据源。初次安装时，打包的技能会从代码仓库复制至此。中心安装的和智能体创建的技能也会存放在此。智能体可以修改或删除任何技能。

您也可以让Hermes指向**外部技能目录** — 这些是与本地目录一起扫描的额外文件夹。请参阅下方的 [外部技能目录](#外部-skill-directories)。

另请参阅：

- [内置技能目录](/reference/skills-catalog)
- [官方可选技能目录](/reference/optional-skills-catalog)

## 使用技能

每个已安装的技能都自动可用作斜杠命令：

```bash
# 在命令行界面或任何消息平台中：
/gif-search 有趣的猫
/axolotl 帮我在我的数据集上微调 Llama 3
/github-pr-workflow 为身份验证重构创建PR
/plan 设计一个迁移我们的身份验证提供商的部署方案

# 仅使用技能名称可以加载该技能并让智能体询问你需要什么：
/excalidraw
```

打包的 `plan` 技能是一个很好的例子。运行 `/plan [请求]` 会加载该技能的指令，告诉Hermes在需要时检查上下文，编写一个Markdown实施计划而不是直接执行任务，并将结果保存在相对于活动工作空间/后端工作目录的 `.hermes/plans/` 下。

您也可以通过自然对话与技能交互：

```bash
hermes chat --toolsets skills -q "你有什么技能？"
hermes chat --toolsets skills -q "向我展示 axolotl 技能"
```

## 渐进式加载

技能使用一种节省令牌的加载模式：

```
Level 0: skills_list()           → [{name, description, category}, ...]   (~3k tokens)
Level 1: skill_view(name)        → 完整内容 + 元数据       (视情况而定)
Level 2: skill_view(name, path)  → 特定的参考文件       (视情况而定)
```

智能体仅在实际需要时才加载完整的技能内容。

## SKILL.md 格式

```markdown
---
name: my-skill
description: 简要描述此技能的功能
version: 1.0.0
platforms: [macos, linux]     # 可选 — 限制特定的操作系统平台
metadata:
  hermes:
    tags: [python, automation]
    category: devops
    fallback_for_toolsets: [web]    # 可选 — 条件激活（见下文）
    requires_toolsets: [terminal]   # 可选 — 条件激活（见下文）
    config:                          # 可选 — config.yaml 设置
      - key: my.setting
        description: "此选项控制的内容"
        default: "value"
        prompt: "设置提示"
---

# 技能标题

## 何时使用
触发此技能的条件。

## 步骤
1. 第一步
2. 第二步

## 注意事项
- 已知的失败模式及修复方法

## 验证
如何确认操作成功。
```

### 平台特定技能

技能可以使用 `platforms` 字段将自身限制在特定的操作系统上：

| 值 | 匹配 |
|-------|---------|
| `macos` | macOS (Darwin) |
| `linux` | Linux |
| `windows` | Windows |

```yaml
platforms: [macos]            # 仅限 macOS (例如, iMessage, Apple Reminders, FindMy)
platforms: [macos, linux]     # macOS 和 Linux
```

设置后，该技能将在不兼容的平台上自动从系统提示、`skills_list()` 和斜杠命令中隐藏。如果省略，则该技能将在所有平台上加载。

## 技能输出与媒体传递

当技能响应（或任何智能体响应）包含指向媒体文件的裸绝对路径时 — 例如 `/home/user/screenshots/diagram.png` — 网关会自动检测它，将其从可见文本中剥离，并将文件原生地传递到用户的聊天中（Telegram 照片、Discord 附件等），而不是在消息中留下原始路径。

特别是对于音频，`[[audio_as_voice]]` 指令可将音频文件提升为支持该功能的平台（Telegram、WhatsApp）上的原生语音消息气泡。

### 强制以文档形式传递：`[[as_document]]`

有时你需要的是**相反**的效果：你希望文件作为可下载附件传递，而不是重新压缩的图片气泡。一个典型的例子是高分辨率的屏幕截图或图表 — Telegram 的 `sendPhoto` 会将其重新压缩到约 200 KB，宽度 1280 像素，破坏可读性。通过 `sendDocument` 发送 1-2 MB 的 PNG 文件可以保留原始字节的完整性。

如果响应（或其中的任何文本 — 通常是最后一行）包含字面指令 `[[as_document]]`，则从该响应中提取的每个媒体路径都将作为文档/文件附件传递，而不是图片气泡：

```
这是你渲染的图表：

/home/user/.hermes/cache/chart-q4-2025.png

[[as_document]]
```

该指令会在传递前被剥离，因此用户永远不会看到它。粒度在每个响应中是有意设置的“全有或全无”：发出一次 `[[as_document]]`，同一响应中的所有图片路径都将作为文档传递。这与 `[[audio_as_voice]]` 的作用范围一致。

在以下情况下从技能中使用它：

- 你生成的屏幕截图或图表用户需要作为文件（用于在其他工具中编辑、存档、完整分享）。
- 默认的有损预览会模糊细节（小文本、像素精确的图表、对颜色敏感的渲染）。

没有单独文档路径的平台（例如 SMS）会回退到其拥有的任何附件机制。

### 条件激活（回退技能）

技能可以根据当前会话中可用的工具自动显示或隐藏自身。这对于**回退技能**最为有用 — 当高级工具不可用时才应显示的免费或本地替代方案。

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
| `fallback_for_toolsets` | 当列出的工具集**可用**时，技能被**隐藏**。当它们缺失时显示。 |
| `fallback_for_tools` | 相同，但检查的是单个工具而不是工具集。 |
| `requires_toolsets` | 当列出的工具集**不可用**时，技能被**隐藏**。当它们存在时显示。 |
| `requires_tools` | 相同，但检查的是单个工具。 |

**示例：** 内置的 `duckduckgo-search` 技能使用 `fallback_for_toolsets: [web]`。当你设置了 `FIRECRAWL_API_KEY` 时，Web 工具集可用，智能体使用 `web_search` — DuckDuckGo 技能保持隐藏。如果 API 密钥缺失，Web 工具集不可用，DuckDuckGo 技能将自动作为回退出现。

没有任何条件字段的技能行为与以前完全相同 — 它们始终显示。

## 加载时的安全设置

技能可以声明所需的环境变量，而不会从发现列表中消失：

```yaml
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: Tenor API 密钥
    help: 从 https://developers.google.com/tenor 获取密钥
    required_for: 完整功能
```

当遇到缺失的值时，Hermes 仅在本地 CLI 中实际加载该技能时才会安全地要求提供该值。你可以跳过设置并继续使用该技能。消息平台永远不会在聊天中要求提供密钥 — 它们会告诉您在本地使用 `hermes setup` 或 `~/.hermes/.env`。

设置后，声明的环境变量会**自动传递**到 `execute_code` 和 `terminal` 沙箱 — 技能的脚本可以直接使用 `$TENOR_API_KEY`。对于非技能环境变量，请使用 `terminal.env_passthrough` 配置选项。详情请参阅 [环境变量传递](/user-guide/security#environment-variable-passthrough)。

### 技能配置设置

技能还可以声明存储在 `config.yaml` 中的非机密配置设置（路径、首选项）：

```yaml
metadata:
  hermes:
    config:
      - key: myplugin.path
        description: 插件数据目录的路径
        default: "~/myplugin-data"
        prompt: 插件数据目录路径
```

设置存储在 config.yaml 的 `skills.config` 下。`hermes config migrate` 会提示输入未配置的设置，`hermes config show` 会显示它们。当技能加载时，其解析的配置值会注入到上下文中，这样智能体就能自动知道已配置的值。

详情请参阅 [技能设置](/user-guide/configuration#skill-settings) 和 [创建技能 — 配置设置](/developer-guide/creating-skills#config-settings-configyaml)。

## 技能目录结构

```text
~/.hermes/skills/                  # 单一真实来源
├── mlops/                         # 类别目录
│   ├── axolotl/
│   │   ├── SKILL.md               # 主要指令（必需）
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
└── .bundled_manifest              # 跟踪已播种的捆绑技能
```

## 外部技能目录

如果你在 Hermes 之外维护技能 — 例如，一个被多个 AI 工具使用的共享 `~/.agents/skills/` 目录 — 你可以告诉 Hermes 也扫描这些目录。

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

- **本地创建，就地更新**：新创建的智能体技能会被写入 `~/.hermes/skills/`。现有技能在其被找到的位置进行修改，包括 `external_dirs` 下的技能，当智能体使用 `skill_manage` 操作（如 `patch`、`edit`、`write_file`、`remove_file` 或 `delete`）时。
- **外部目录不是写保护边界**：如果外部技能目录对 Hermes 进程可写，那么智能体管理的技能更新可以更改该目录中的文件。如果共享的外部技能必须保持只读，请使用文件系统权限或单独的配置文件/工具集设置。
- **本地优先**：如果同一技能名称同时存在于本地目录和外部目录中，则本地版本优先。
- **完全集成**：外部技能出现在系统提示索引、`skills_list`、`skill_view` 以及 `/skill-name` 斜杠命令中 — 与本地技能无异。
- **不存在的路径会被静默跳过**：如果配置的目录不存在，Hermes 会忽略它而不报错。这对于可能不在每台机器上都存在的可选共享目录很有用。

### 示例

```text
~/.hermes/skills/               # 本地（主要，可读写）
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

所有四个技能都会出现在你的技能索引中。如果你在本地创建一个名为 `my-custom-workflow` 的新技能，它会覆盖外部版本。

## 技能包

技能包是微小的 YAML 文件，将多个技能组合到一个斜杠命令下。当您运行 `/<bundle-name>` 时，包中列出的所有技能会同时加载——当一项任务总是受益于相同的一组技能组合时，这非常有用。

### 快速示例

```bash
# 为后端功能工作创建一个技能包
hermes bundles create backend-dev \
  --skill github-code-review \
  --skill test-driven-development \
  --skill github-pr-workflow \
  -d "后端功能工作 —— 代码审查、测试、PR 工作流"
```

然后在 CLI 或任何网关平台中：

```
/backend-dev 重构认证中间件
```

智能体会收到所有三个技能加载到同一条用户消息中，斜杠命令后的任何文本都会作为用户指令附上。

### YAML 模式

技能包位于 **`~/.hermes/skill-bundles/<slug>.yaml`** 中，其结构如下：

```yaml
name: backend-dev
description: 后端功能工作 —— 代码审查、测试、PR 工作流。
skills:
  - github-code-review
  - test-driven-development
  - github-pr-workflow
instruction: |
  始终从编写失败的测试开始，然后再实现。
  通过标准工作流打开 PR，并附上合著者标签。
```

字段：
- `name`（可选 —— 默认为文件名主干）—— 技能包的显示名称。会标准化为斜杠命令的连字符形式（`Backend Dev` → `/backend-dev`）。
- `description`（可选）—— 在 `/bundles` 和 `hermes bundles list` 中显示的简短文本。
- `skills`（必需，非空列表）—— 技能名称或相对于您技能目录的路径。使用与传递给 `/<skill-name>` 相同的标识符。
- `instruction`（可选）—— 附加的指导，会预置在加载的技能内容之前。对于规范“我们如何始终一起使用这些技能”很有用。

### 管理技能包

```bash
# 列出所有已安装的技能包
hermes bundles list

# 检查一个技能包
hermes bundles show backend-dev

# 交互式创建一个技能包（省略 --skill 标志以每行输入一个技能）
hermes bundles create research

# 覆盖现有的技能包
hermes bundles create backend-dev --skill ... --force

# 删除一个技能包
hermes bundles delete backend-dev

# 重新扫描 ~/.hermes/skill-bundles/ 并报告更改
hermes bundles reload
```

在聊天会话中，`/bundles` 会列出每个已安装的技能包及其技能。

### 行为

- **当别名冲突时，技能包优先于单个技能。** 如果您将技能包命名为 `research`，同时也拥有一个名为 `research` 的技能，`/research` 会调用技能包。这是有意为之——通过命名它，您就选择了该技能包。
- **缺失的技能会被跳过，不会导致致命错误。** 如果一个技能包列出了 `skill-foo` 而您尚未安装它，该技能包仍会加载那些可以解析的技能，智能体会收到一条说明哪些技能被跳过的注释。
- **技能包适用于所有界面** —— 交互式 CLI、TUI、仪表盘聊天以及每个网关平台（Telegram、Discord、Slack 等）—— 因为调度逻辑与单个技能命令集中在同一位置。
- **技能包不会使提示缓存失效。** 它们在调用时会生成一条新的用户消息，与 `/<skill-name>` 的工作方式相同——不会修改系统提示。

### 当技能包优于手动安装每个技能时

在以下情况下使用技能包：
- 您总是为重复性任务配对相同的技能（`/backend-dev`、`/release-prep`、`/incident-response`）。
- 您希望比连续输入多个 `/skill` 调用在心智模型上少一个字符。
- 您希望通过将技能包 YAML 文件提交到共享的 dotfiles 仓库并将其符号链接到 `~/.hermes/skill-bundles/` 中，来分发团队范围的“任务配置文件”。

技能包只是一个 YAML 别名——它不会为您安装技能。技能本身必须已经存在（在 `~/.hermes/skills/` 或外部技能目录中）。否则，调用技能包只会跳过缺失的部分。

---
title: 智能体管理的技能 (skill_manage 工具)
description: 智能体可以通过 `skill_manage` 工具创建、更新和删除自身的技能。这是智能体的**过程性记忆**——当它发现一个非平凡的工作流时，会将该方法保存为技能以供将来重用。
slug: skill_manage
---
## 智能体管理的技能 (skill_manage 工具)

智能体可以通过 `skill_manage` 工具创建、更新和删除自身的技能。这是智能体的**过程性记忆**——当它发现一个非平凡的工作流时，会将该方法保存为技能以供将来重用。

### 智能体何时创建技能

- 成功完成复杂任务（5次以上工具调用）后
- 遇到错误或死胡同并找到可行路径时
- 用户纠正了其方法时
- 发现了一个非平凡的工作流时

### 操作

| 操作 | 用途 | 关键参数 |
|--------|---------|------------|
| `create` | 从头创建新技能 | `name`, `content` (完整的 SKILL.md)，可选 `category` |
| `patch` | 针对性修复（首选） | `name`, `old_string`, `new_string` |
| `edit` | 主要结构性重写 | `name`, `content` (替换完整的 SKILL.md) |
| `delete` | 完全删除一个技能 | `name` |
| `write_file` | 添加/更新支持文件 | `name`, `file_path`, `file_content` |
| `remove_file` | 删除支持文件 | `name`, `file_path` |

:::tip
`patch` 操作是更新的首选方式——它比 `edit` 更节省 token，因为只有更改的文本会出现在工具调用中。
:::

## 技能中心

浏览、搜索、安装和管理来自在线注册表、`skills.sh`、知名技能端点和官方可选技能的技能。

### 常用命令

```bash
hermes skills browse                              # 浏览所有中心技能（官方优先）
hermes skills browse --source official            # 仅浏览官方可选技能
hermes skills search kubernetes                   # 搜索所有来源
hermes skills search react --source skills-sh     # 搜索 skills.sh 目录
hermes skills search https://mintlify.com/docs --source well-known
hermes skills inspect openai/skills/k8s           # 安装前预览
hermes skills install openai/skills/k8s           # 带安全扫描的安装
hermes skills install official/security/1password
hermes skills install skills-sh/vercel-labs/json-render/json-render-react --force
hermes skills install well-known:https://mintlify.com/docs/.well-known/skills/mintlify
hermes skills install https://sharethis.chat/SKILL.md              # 直接 URL（单文件 SKILL.md）
hermes skills install https://example.com/SKILL.md --name my-skill # 当前置元数据无名称时覆盖名称
hermes skills list --source hub                   # 列出从中心安装的技能
hermes skills check                               # 检查已安装的中心技能是否有上游更新
hermes skills update                              # 需要时重新安装具有上游变更的中心技能
hermes skills audit                               # 重新扫描所有中心技能以检查安全
hermes skills uninstall k8s                       # 删除一个中心技能
hermes skills reset google-workspace              # 从 "用户已修改" 状态解除一个捆绑技能的粘滞（见下文）
hermes skills reset google-workspace --restore    # 同时恢复捆绑版本，删除您的本地编辑
hermes skills publish skills/my-skill --to github --repo owner/repo
hermes skills snapshot export setup.json          # 导出技能配置
hermes skills tap add myorg/skills-repo           # 添加自定义 GitHub 源
```

### 支持的中心源

| 源 | 示例 | 说明 |
|--------|---------|-------|
| `official` | `official/security/1password` | 随 Hermes 发布的可选技能。 |
| `skills-sh` | `skills-sh/vercel-labs/agent-skills/vercel-react-best-practices` | 可通过 `hermes skills search <query> --source skills-sh` 搜索。当 skills.sh 的 slug 与仓库文件夹不同时，Hermes 会解析别名样式的技能。 |
| `well-known` | `well-known:https://mintlify.com/docs/.well-known/skills/mintlify` | 直接从网站上的 `/.well-known/skills/index.json` 提供服务的技能。使用站点或文档 URL 进行搜索。 |
| `url` | `https://sharethis.chat/SKILL.md` | 直接指向单文件 `SKILL.md` 的 HTTP(S) URL。名称解析：前置元数据 → URL slug → 交互式提示 → `--name` 标志。 |
| `github` | `openai/skills/k8s` | 直接从 GitHub 仓库/路径安装和自定义 taps。 |
| `clawhub`, `lobehub`, `browse-sh` | 特定于源的标识符 | 社区或市场集成。 |

### 集成的中心和注册表

Hermes 目前与这些技能生态系统和发现源集成：

#### 1. 官方可选技能 (`official`)

这些维护在 Hermes 仓库本身中，并以内置信任安装。

- 目录：[官方可选技能目录](../../reference/optional-skills-catalog)
- 仓库中的源：`optional-skills/`
- 示例：

```bash
hermes skills browse --source official
hermes skills install official/security/1password
```

#### 2. skills.sh (`skills-sh`)

这是 Vercel 的公共技能目录。Hermes 可以直接搜索它，检查技能详细信息页面，解析别名样式的 slug，并从底层源仓库安装。

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

这是基于 URL 的发现，来自发布 `/.well-known/skills/index.json` 的网站。它不是一个单一的集中式中心——它是一种网络发现惯例。

- 实时端点示例：[Mintlify 文档技能索引](https://mintlify.com/docs/.well-known/skills/index.json)
- 参考服务器实现：[vercel-labs/skills-handler](https://github.com/vercel-labs/skills-handler)
- 示例：

```bash
hermes skills search https://mintlify.com/docs --source well-known
hermes skills inspect well-known:https://mintlify.com/docs/.well-known/skills/mintlify
hermes skills install well-known:https://mintlify.com/docs/.well-known/skills/mintlify
```

#### 4. 直接 GitHub 技能 (`github`)

Hermes 可以直接从 GitHub 仓库和基于 GitHub 的 taps 安装。当您已经知道仓库/路径或想要添加自己的自定义源仓库时，这很有用。

默认 taps（无需设置即可浏览）：
- [openai/skills](https://github.com/openai/skills)
- [anthropics/skills](https://github.com/anthropics/skills)
- [huggingface/skills](https://github.com/huggingface/skills)
- [garrytan/gstack](https://github.com/garrytan/gstack)

- 示例：

```bash
hermes skills install openai/skills/k8s
hermes skills tap add myorg/skills-repo
```

#### 5. ClawHub (`clawhub`)

作为社区源集成的第三方技能市场。

- 站点：[clawhub.ai](https://clawhub.ai/)
- Hermes 源 ID：`clawhub`

#### 6. Claude 市场式仓库 (`claude-marketplace`)

Hermes 支持发布 Claude 兼容插件/市场清单的市场仓库。

已知的集成源包括：
- [anthropics/skills](https://github.com/anthropics/skills)
- [aiskillstore/marketplace](https://github.com/aiskillstore/marketplace)

Hermes 源 ID：`claude-marketplace`

#### 7. LobeHub (`lobehub`)

Hermes 可以搜索并转换 LobeHub 公共目录中的智能体条目，使其成为可安装的 Hermes 技能。

- 站点：[LobeHub](https://lobehub.com/)
- 公共智能体索引：[chat-agents.lobehub.com](https://chat-agents.lobehub.com/)
- 底层仓库：[lobehub/lobe-chat-agents](https://github.com/lobehub/lobe-chat-agents)
- Hermes 源 ID：`lobehub`

#### 8. browse.sh (`browse-sh`)

Hermes 集成了 [browse.sh](https://browse.sh)，这是 Browserbase 的包含 200 多个特定站点浏览器自动化 SKILL.md 文件的目录（Airbnb、Amazon、arXiv、12306.cn、Etsy、Xero 等等）。每个技能描述了如何端到端驱动一个网站，适用于与 Hermes 的浏览器工具以及您已安装的任何浏览器自动化技能一起使用。

- 站点：[browse.sh](https://browse.sh/)
- 目录 API：`https://browse.sh/api/skills`
- Hermes 源 ID：`browse-sh`
- 信任级别：`community`

```bash
hermes skills search airbnb --source browse-sh
hermes skills inspect browse-sh/airbnb.com/search-listings-ddgioa
hermes skills install browse-sh/airbnb.com/search-listings-ddgioa
```

标识符使用 `browse-sh/<主机名>/<任务-id>` 的形式，并与 browse.sh 目录公开的 slug 匹配。内容通过每个技能的详细信息端点（`/api/skills/<slug>` → `skillMdUrl`）解析，而不是通过目录的 GitHub `sourceUrl`。

#### 9. 直接 URL (`url`)

从任何 HTTP(S) URL 直接安装单文件 `SKILL.md`——当作者在他们自己的站点上托管技能（没有中心列表，没有 GitHub 路径可输入）时很有用。Hermes 获取 URL，解析 YAML 前置元数据，进行安全扫描，然后安装。

- Hermes 源 ID：`url`
- 标识符：URL 本身（无需前缀）
- 范围：**仅限单文件 `SKILL.md`**。包含 `references/` 或 `scripts/` 的多文件技能需要清单，应通过上面列出的其他源之一发布。

```bash
hermes skills install https://sharethis.chat/SKILL.md
hermes skills install https://example.com/my-skill/SKILL.md --category productivity
```

名称解析顺序：
1.  SKILL.md YAML 前置元数据中的 `name:` 字段（推荐——每个格式正确的技能都有）。
2.  URL 路径中的父目录名称（例如 `.../my-skill/SKILL.md` → `my-skill`，或 `.../my-skill.md` → `my-skill`），当它是一个有效的标识符时（`^[a-z][a-z0-9_-]*$`）。
3.  终端上有 TTY 时的交互式提示。
4.  在非交互式界面（TUI 内的 `/skills install` 斜杠命令、网关平台、脚本），会显示一个清晰的错误，指向 `--name` 覆盖。

```bash
# 前置元数据没有名称，且 URL slug 无用——请提供一个：
hermes skills install https://example.com/SKILL.md --name sharethis-chat

# 或在聊天会话内：
/skills install https://example.com/SKILL.md --name sharethis-chat
```

信任级别始终为 `community`——对所有其他源都运行相同的安全扫描。URL 作为安装标识符存储，因此当您想要刷新时，`hermes skills update` 会自动从相同的 URL 重新获取。

### 安全扫描与 `--force`

所有从中心安装的技能都经过**安全扫描器**检查，该扫描器检查数据泄露、提示注入、破坏性命令、供应链信号和其他威胁。

`hermes skills inspect ...` 现在也会在可用时显示上游元数据：
- 仓库 URL
- skills.sh 详细信息页面 URL
- 安装命令
- 每周安装量
- 上游安全审计状态
- 知名索引/端点 URL

当您审查过第三方技能并想覆盖非危险策略阻止时，请使用 `--force`：

```bash
hermes skills install skills-sh/anthropics/skills/pdf --force
```

重要行为：
- `--force` 可以覆盖用于警告/警告风格发现的策略阻止。
- `--force` **不会**覆盖 `dangerous` 扫描判定。
- 官方可选技能 (`official/...`) 被视为内置信任，不会显示第三方警告面板。

### 信任级别

| 级别 | 源 | 策略 |
|-------|--------|--------|
| `builtin` | 与 Hermes 一起发布 | 始终信任 |
| `official` | 仓库中的 `optional-skills/` | 内置信任，无第三方警告 |
| `trusted` | 可信的注册表/仓库，如 `openai/skills`, `anthropics/skills`, `huggingface/skills` | 比社区源更宽松的策略 |
| `community` | 其他所有 (`skills.sh`, 知名端点, 自定义 GitHub 仓库, 大多数市场) | 非危险发现可用 `--force` 覆盖；`dangerous` 判定保持阻止 |

### 更新生命周期

中心现在跟踪足够的溯源信息，以重新检查已安装技能的上游副本：

```bash
hermes skills check          # 报告哪些已安装的中心技能上游发生了变化
hermes skills update         # 仅重新安装有可用更新的技能
hermes skills update react   # 更新一个特定的已安装中心技能
```

这使用存储的源标识符加上当前的上游包内容哈希来检测漂移。

:::tip GitHub 速率限制
技能中心操作使用 GitHub API，未认证用户的速率限制为每小时 60 个请求。如果您在安装或搜索期间看到速率限制错误，请在 `.env` 文件中设置 `GITHUB_TOKEN` 以将限制提高到每小时 5,000 个请求。发生这种情况时，错误消息包含一个可操作的提示。
:::

### 发布自定义技能 tap

如果您想分享一组策划好的技能——为您的团队、您的组织或公开地——您可以将它们发布为一个 **tap**：一个其他 Hermes 用户使用 `hermes skills tap add <owner/repo>` 添加的 GitHub 仓库。无需服务器，无需注册，无需发布流水线。只需一个包含 `SKILL.md` 文件的目录。

#### 仓库布局

一个 tap 是任何 GitHub 仓库（公开或私有——私有需要 `GITHUB_TOKEN`），布局如下：

```
owner/repo
├── skills/                       # 默认路径；可按 tap 配置
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
- 每个技能位于 tap 根路径（默认 `skills/`）下的自己的目录中。
- 目录名称成为该技能的安装 slug。
- 每个技能目录必须包含一个具有标准 [SKILL.md 前置元数据](#skillmd格式) 的 `SKILL.md`（`name`、`description`，以及可选的 `metadata.hermes.tags`、`version`、`author`、`platforms`、`metadata.hermes.config`）。
- 子目录如 `references/`、`templates/`、`scripts/`、`assets/` 会在安装时与 `SKILL.md` 一起下载。
- 目录名以 `.` 或 `_` 开头的技能将被忽略。

Hermes 通过列出 tap 路径下的每个子目录并探测其中的 `SKILL.md` 来发现技能。

#### 最小化 tap 示例

```
my-org/hermes-skills
└── skills/
    └── deploy-runbook/
        └── SKILL.md
```

`skills/deploy-runbook/SKILL.md`：

```markdown
---
name: deploy-runbook
description: 我们的部署手册 — 服务、回滚、Slack 频道
version: 1.0.0
author: My Org Platform Team
metadata:
  hermes:
    tags: [deployment, runbook, internal]
---

# 部署手册

步骤 1： ...
```

推送到 GitHub 后，任何 Hermes 用户都可以订阅和安装：

```bash
hermes skills tap add my-org/hermes-skills
hermes skills search deploy
hermes skills install my-org/hermes-skills/deploy-runbook
```

#### 非默认路径

如果您的技能不在 `skills/` 下（当您向现有项目添加 `skills/` 子树时很常见），请编辑 `~/.hermes/.hub/taps.json` 中的 tap 条目：

```json
{
  "taps": [
    {"repo": "my-org/platform-docs", "path": "internal/skills/"}
  ]
}
```

`hermes skills tap add` CLI 默认将新 tap 设置为 `path: "skills/"`；如果需要不同的路径，请直接编辑文件。`hermes skills tap list` 显示每个 tap 的有效路径。

#### 直接安装单个技能（无需添加 tap）

用户也可以在不将整个仓库添加为 tap 的情况下，从任何公共 GitHub 仓库安装单个技能：

```bash
hermes skills install owner/repo/skills/my-workflow
```

当您想分享一个技能，而不必让用户订阅您的整个注册表时很有用。

#### tap 的信任级别

新 tap 默认分配 `community` 信任级别。从中安装的技能会经过标准安全扫描，并在首次安装时显示第三方警告面板。如果您的组织或广泛信任的来源应获得更高的信任，请将其仓库添加到 `tools/skills_hub.py` 中的 `TRUSTED_REPOS`（需要 Hermes 核心 PR）。

#### Tap 管理

```bash
hermes skills tap list                                # 显示所有已配置的 taps
hermes skills tap add myorg/skills-repo               # 添加（默认路径：skills/）
hermes skills tap remove myorg/skills-repo            # 移除
```

在运行中的会话内：

```
/skills tap list
/skills tap add myorg/skills-repo
/skills tap remove myorg/skills-repo
```

Taps 存储在 `~/.hermes/.hub/taps.json`（按需创建）。

## 捆绑技能更新（`hermes skills reset`）

Hermes 在仓库内的 `skills/` 目录中附带了一套捆绑技能。在安装时以及每次执行 `hermes update` 时，一个同步过程会将这些技能复制到 `~/.hermes/skills/`，并在 `~/.hermes/skills/.bundled_manifest` 处记录一个清单文件，该清单将每个技能名称映射到其同步时的内容哈希值（**起源哈希**）。

每次同步时，Hermes 会重新计算您本地副本的哈希值，并将其与起源哈希进行比较：

- **未更改** → 可以安全地拉取上游更改，将新的捆绑版本复制进来，并记录新的起源哈希。
- **已更改** → 被视为**用户修改**，将永远跳过同步，因此您的编辑不会被覆盖。

这种保护机制很好，但它有一个棘手之处。如果您编辑了一个捆绑技能，然后又想放弃更改并恢复到捆绑版本，仅仅从 `~/.hermes/hermes-agent/skills/` 复制粘贴内容是不够的。清单文件仍然保存着上次成功同步运行时的*旧*起源哈希。您新复制粘贴的内容（当前的捆绑哈希）将无法匹配那个过时的起源哈希，因此同步会持续将其标记为用户修改。

`hermes skills reset` 是解决此问题的应急措施：

```bash
# 安全操作：清除此技能的清单条目。您当前的副本会被保留，
# 但下次同步将以它为基准重新建立基线，以便未来的更新能正常工作。
hermes skills reset google-workspace

# 完全恢复：同时删除您的本地副本并重新复制当前的捆绑版本。
# 当您希望恢复原始上游技能时，请使用此选项。
hermes skills reset google-workspace --restore

# 非交互模式（例如在脚本或 TUI 模式下）——跳过 --restore 的确认提示。
hermes skills reset google-workspace --restore --yes
```

同样的命令也可以在聊天中作为斜杠命令使用：

```text
/skills reset google-workspace
/skills reset google-workspace --restore
```

:::note 配置文件
每个配置文件在其各自的 `HERMES_HOME` 下都有自己的 `.bundled_manifest`，因此 `hermes -p coder skills reset <name>` 仅影响该配置文件。
:::

### 斜杠命令（聊天内）

所有相同的命令都可以通过 `/skills` 使用：

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

官方可选技能仍然使用诸如 `official/security/1password` 和 `official/migration/openclaw-migration` 之类的标识符。