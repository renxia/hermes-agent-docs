---
sidebar_position: 2
title: "技能系统"
description: "按需加载的知识文档——渐进式披露、智能体管理的技能与技能中心"
---

# 技能系统

技能是智能体在需要时可加载的按需知识文档。它们遵循**渐进式披露**模式以最小化令牌使用量，并且兼容 [agentskills.io](https://agentskills.io/specification) 开放标准。

所有技能均存放在 **`~/.hermes/skills/`** 中——这是主要目录及真实数据源。初次安装时，捆绑技能会从仓库复制。中心安装的和智能体创建的技能也会存放于此。智能体可以修改或删除任何技能。

你也可以将 Hermes 指向**外部技能目录**——作为本地目录之外额外的扫描文件夹。请参阅下方的 [外部技能目录](#external-skill-directories)。

另请参阅：

- [捆绑技能目录](/reference/skills-catalog)
- [官方可选技能目录](/reference/optional-skills-catalog)

## 使用技能

每个已安装的技能都自动作为斜杠命令可用：

```bash
# 在 CLI 或任何消息平台中：
/gif-search funny cats
/axolotl help me fine-tune Llama 3 on my dataset
/github-pr-workflow create a PR for the auth refactor
/plan design a rollout for migrating our auth provider

# 仅使用技能名称会加载它，并让智能体询问你的需求：
/excalidraw
```

内置的 `plan` 技能就是一个很好的例子。运行 `/plan [请求]` 会加载该技能的指令，指示 Hermes 根据需要检查上下文，撰写 Markdown 格式的实施计划（而非执行任务），并将结果保存在当前活动工作空间/后端工作目录下的 `.hermes/plans/` 中。

你也可以通过自然对话与技能交互：

```bash
hermes chat --toolsets skills -q "你有哪些技能？"
hermes chat --toolsets skills -q "给我看看 axolotl 技能"
```

## 渐进式加载

技能使用节省令牌的加载模式：

```
Level 0: skills_list()           → [{name, description, category}, ...]   (~3k 令牌)
Level 1: skill_view(name)        → 完整内容 + 元数据                (长度不定)
Level 2: skill_view(name, path)  → 特定参考文件                   (长度不定)
```

智能体只在实际需要时才加载完整的技能内容。

## SKILL.md 格式

```markdown
---
name: my-skill
description: 简要描述此技能的功能
version: 1.0.0
platforms: [macos, linux]     # 可选 — 限制特定操作系统平台
metadata:
  hermes:
    tags: [python, automation]
    category: devops
    fallback_for_toolsets: [web]    # 可选 — 条件激活（见下文）
    requires_toolsets: [terminal]   # 可选 — 条件激活（见下文）
    config:                          # 可选 — config.yaml 设置
      - key: my.setting
        description: "控制内容"
        default: "value"
        prompt: "设置提示"
---

# 技能标题

## 何时使用
触发此技能的条件。

## 步骤
1. 步骤一
2. 步骤二

## 注意事项
- 已知的失败模式和解决方法

## 验证
如何确认操作成功。
```

### 平台特定技能

技能可以使用 `platforms` 字段将自身限制在特定的操作系统：

| 值      | 匹配系统         |
|---------|----------------|
| `macos` | macOS (Darwin) |
| `linux` | Linux          |
| `windows` | Windows        |

```yaml
platforms: [macos]            # 仅限 macOS（例如 iMessage、Apple Reminders、FindMy）
platforms: [macos, linux]     # macOS 和 Linux
```

设置后，该技能在不兼容的平台上会自动从系统提示、`skills_list()` 和斜杠命令中隐藏。如果省略，技能将在所有平台上加载。

## 技能输出与媒体交付

当技能响应（或任何智能体响应）包含媒体文件的裸绝对路径时——例如 `/home/user/screenshots/diagram.png` ——网关会自动检测它，将其从可见文本中移除，并将文件原生地交付给用户的聊天（Telegram 照片、Discord 附件等），而不是在消息中保留原始路径。

具体来说，对于音频，`[[audio_as_voice]]` 指令会将音频文件提升为支持平台的原生语音消息气泡（Telegram、WhatsApp）。

### 强制文档式交付：`[[as_document]]`

有时你想要的是**内联预览的反面**：你希望文件作为可下载附件交付，而不是重新压缩的图像气泡。典型例子是高分辨率的截图或图表——Telegram 的 `sendPhoto` 会将其重新压缩至 ~200 KB（1280 px），破坏可读性。通过 `sendDocument` 发送的 1-2 MB PNG 能保持原始字节完好无损。

如果响应（或其中的任何文本——通常是最后一行）包含字面指令 `[[as_document]]`，那么从该响应中提取的每个媒体路径都将作为文档/文件附件而不是图像气泡交付：

```
这是您渲染的图表：

/home/user/.hermes/cache/chart-q4-2025.png

[[as_document]]
```

该指令在交付前会被剥离，因此用户永远不会看到它。粒度设计上，每个响应是全部或没有：发出一次 `[[as_document]]`，同一响应中的所有图像路径都将以文档形式交付。这与 `[[audio_as_voice]]` 的作用域一致。

在技能中使用它的场景：

- 您生成的截图或图表需要用户作为文件使用（以便在其他工具中编辑、归档、完整共享）。
- 默认的有损预览会模糊细节（小文本、像素精确的图表、对颜色敏感的渲染）。

没有单独文档路径的平台（例如 SMS）会回退到其拥有的任何附件机制。

### 条件激活（回退技能）

技能可以根据当前会话中可用的工具自动显示或隐藏自身。这对于**回退技能**最为有用——当高级工具不可用时才应出现的免费或本地替代方案。

```yaml
metadata:
  hermes:
    fallback_for_toolsets: [web]      # 仅当这些工具集不可用时显示
    requires_toolsets: [terminal]     # 仅当这些工具集可用时显示
    fallback_for_tools: [web_search]  # 仅当这些特定工具不可用时显示
    requires_tools: [terminal]        # 仅当这些特定工具可用时显示
```

| 字段                   | 行为                                             |
|----------------------|------------------------------------------------|
| `fallback_for_toolsets` | 当列出的工具集可用时，技能**隐藏**。缺失时显示。               |
| `fallback_for_tools`    | 同上，但检查单个工具而不是工具集。                         |
| `requires_toolsets`     | 当列出的工具集不可用时，技能**隐藏**。存在时显示。             |
| `requires_tools`        | 同上，但检查单个工具。                                 |

**示例：** 内置的 `duckduckgo-search` 技能使用 `fallback_for_toolsets: [web]`。当你设置了 `FIRECRAWL_API_KEY`，web 工具集可用，智能体会使用 `web_search` —— DuckDuckGo 技能保持隐藏。如果缺少 API 密钥，web 工具集不可用，DuckDuckGo 技能会自动作为回退显示。

没有任何条件字段的技能行为与之前完全相同——它们始终显示。

## 加载时的安全设置

技能可以声明所需的环境变量，而不会从发现中消失：

```yaml
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: Tenor API 密钥
    help: 从 https://developers.google.com/tenor 获取密钥
    required_for: 完整功能
```

当遇到缺失的值时，Hermes 仅在技能实际加载到本地 CLI 时才会安全地请求它。你可以跳过设置并继续使用该技能。消息界面绝不会在聊天中询问密钥——它们会告诉您在本地使用 `hermes setup` 或 `~/.hermes/.env`。

一旦设置，声明的环境变量会**自动传递**到 `execute_code` 和 `terminal` 沙箱——技能的脚本可以直接使用 `$TENOR_API_KEY`。对于非技能环境变量，请使用 `terminal.env_passthrough` 配置选项。详见 [环境变量传递](/user-guide/security#environment-variable-passthrough)。

### 技能配置设置

技能还可以声明存储在 `config.yaml` 中的非机密配置设置（路径、偏好等）：

```yaml
metadata:
  hermes:
    config:
      - key: myplugin.path
        description: 插件数据目录的路径
        default: "~/myplugin-data"
        prompt: 插件数据目录路径
```

设置存储在您的 config.yaml 中的 `skills.config` 下。`hermes config migrate` 会提示未配置的设置，`hermes config show` 会显示它们。当技能加载时，其解析后的配置值会被注入到上下文中，因此智能体会自动知道配置的值。

详见 [技能设置](/user-guide/configuration#skill-settings) 和 [创建技能 — 配置设置](/developer-guide/creating-skills#config-settings-configyaml)。

## 技能目录结构

```text
~/.hermes/skills/                  # 单一真实来源
├── mlops/                         # 类别目录
│   ├── axolotl/
│   │   ├── SKILL.md               # 主要说明（必需）
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
└── .bundled_manifest              # 跟踪已植入的捆绑技能
```

## 外部技能目录

如果您在 Hermes 之外维护技能——例如，一个供多个 AI 工具使用的共享 `~/.agents/skills/` 目录——您可以让 Hermes 也扫描这些目录。

在 `~/.hermes/config.yaml` 中的 `skills` 部分下添加 `external_dirs`：

```yaml
skills:
  external_dirs:
    - ~/.agents/skills
    - /home/shared/team-skills
    - ${SKILLS_REPO}/skills
```

路径支持 `~` 扩展和 `${VAR}` 环境变量替换。

### 工作原理

- **本地创建，在原地更新**：新的智能体创建的技能会写入 `~/.hermes/skills/`。现有技能会就地修改，包括 `external_dirs` 下的技能，当智能体使用 `skill_manage` 操作（如 `patch`、`edit`、`write_file`、`remove_file` 或 `delete`）时。
- **外部目录不是写保护边界**：如果外部技能目录对 Hermes 进程可写，智能体管理的技能更新可以更改该目录中的文件。如果共享的外部技能必须保持只读，请使用文件系统权限或单独的配置文件/工具集设置。
- **本地优先**：如果同一技能名称同时存在于本地目录和外部目录中，本地版本优先。
- **完全集成**：外部技能出现在系统提示索引、`skills_list`、`skill_view` 和 `/skill-name` 斜杠命令中——与本地技能无异。
- **不存在的路径被静默跳过**：如果配置的目录不存在，Hermes 会忽略它而不报错。这对于在每台机器上都可能不存在的可选共享目录很有用。

### 示例

```text
~/.hermes/skills/               # 本地（主要，读写）
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

所有这四个技能都会出现在您的技能索引中。如果您在本地创建了一个名为 `my-custom-workflow` 的新技能，它会遮蔽外部版本。

# 技能捆绑

技能捆绑是小型的YAML文件，可将多个技能组合在一个斜杠命令下。当您运行 `/<bundle-name>` 时，捆绑中列出的每个技能都会一次性加载——这在某项任务始终受益于相同技能组合时非常有用。

### 快速示例

```bash
# 为后端功能开发创建一个捆绑包
hermes bundles create backend-dev \
  --skill github-code-review \
  --skill test-driven-development \
  --skill github-pr-workflow \
  -d "后端功能开发——代码审查、测试、PR工作流"
```

然后在命令行或任何网关平台中：

```
/backend-dev 重构身份验证中间件
```

智能体会将所有三个技能加载到一条用户消息中，斜杠命令后的任何文本将作为用户指令附加。

### YAML 模式

捆绑包位于 **`~/.hermes/skill-bundles/<slug>.yaml`**，其结构如下：

```yaml
name: backend-dev
description: 后端功能开发——代码审查、测试、PR工作流。
skills:
  - github-code-review
  - test-driven-development
  - github-pr-workflow
instruction: |
  始终从编写失败的测试开始，然后实现。
  通过标准工作流开启PR，并添加共同作者标签。
```

字段：
- `name`（可选——默认为文件名主体）——捆绑包的显示名称。标准化为连字符形式，用于斜杠命令（`Backend Dev` → `/backend-dev`）。
- `description`（可选）——在 `/bundles` 和 `hermes bundles list` 中显示的简短文本。
- `skills`（必需，非空列表）——技能名称或相对于技能目录的路径。使用与传递给 `/<skill-name>` 相同的标识符。
- `instruction`（可选）——附加指导，在加载的技能内容前添加。可用于编纂"我们通常如何组合使用这些技能"。

### 管理捆绑包

```bash
# 列出所有已安装的捆绑包
hermes bundles list

# 检查一个捆绑包
hermes bundles show backend-dev

# 交互式创建捆绑包（省略 --skill 标志可逐行输入）
hermes bundles create research

# 覆盖现有捆绑包
hermes bundles create backend-dev --skill ... --force

# 删除一个捆绑包
hermes bundles delete backend-dev

# 重新扫描 ~/.hermes/skill-bundles/ 并报告更改
hermes bundles reload
```

在聊天会话中，`/bundles` 会列出每个已安装的捆绑包及其技能。

### 行为

- **当短标识符冲突时，捆绑包优先于单个技能。** 如果您将一个捆绑包命名为 `research`，同时也有一个名为 `research` 的技能，`/research` 将调用捆绑包。这是有意的——您通过命名选择了该捆绑包。
- **缺失的技能会被跳过，不会导致致命错误。** 如果捆绑包列出了 `skill-foo` 而您尚未安装它，捆绑包仍会加载那些能解析的技能，并且智能体会收到一份列出被跳过内容的说明。
- **捆绑包在所有界面中都有效** ——交互式命令行、文本用户界面、仪表盘聊天，以及每个网关平台（Telegram、Discord、Slack等）——因为分派逻辑与单个技能命令集中在同一位置。
- **捆绑包不会使提示缓存失效。** 它们在调用时生成一个新的用户消息，方式与 `/<skill-name>` 相同——不会修改系统提示词。

### 何时使用捆绑包优于手动安装每个技能

在以下情况下使用捆绑包：
- 您总是为重复性任务组合相同的技能（`/backend-dev`、`/release-prep`、`/incident-response`）。
- 您想要比连续输入多个 `/skill` 调用更简短的心理模型。
- 您希望通过将捆绑包YAML提交到共享的dotfiles仓库并将其符号链接到 `~/.hermes/skill-bundles/` 来提供团队范围的"任务配置文件"。

捆绑包只是一个YAML别名——它不会为您安装技能。技能本身必须已经存在（在 `~/.hermes/skills/` 或外部技能目录中）。否则，捆绑包调用只会跳过缺失的技能。

## 智能体管理技能（skill_manage 工具）

智能体可以通过 `skill_manage` 工具创建、更新和删除其自身的技能。这是智能体的**程序性记忆** —— 当它找出一个非简单的工作流程时，会将该方法保存为技能以便未来重用。

### 智能体何时创建技能

- 在成功完成复杂任务（5次以上工具调用）后
- 当它遇到错误或死胡同并找到可行路径时
- 当用户纠正了其方法时
- 当它发现了一个非简单的工作流程时

### 操作

| 操作 | 用途 | 关键参数 |
|------|------|----------|
| `create` | 从头创建新技能 | `name`、`content`（完整的 SKILL.md）、可选 `category` |
| `patch` | 针对性修复（首选） | `name`、`old_string`、`new_string` |
| `edit` | 主要的结构性重写 | `name`、`content`（替换完整的 SKILL.md） |
| `delete` | 彻底删除一个技能 | `name` |
| `write_file` | 添加/更新支持文件 | `name`、`file_path`、`file_content` |
| `remove_file` | 删除一个支持文件 | `name`、`file_path` |

:::tip
对于更新操作，首选 `patch` 操作 —— 因为它只在工具调用中包含更改的文本，比 `edit` 更节省 token。
:::

## 技能中心

浏览、搜索、安装和管理来自在线注册表、`skills.sh`、直接的知名技能端点以及官方可选技能的技能。

### 常用命令

```bash
hermes skills browse                              # 浏览所有中心技能（官方优先）
hermes skills browse --source official            # 仅浏览官方可选技能
hermes skills search kubernetes                   # 在所有来源中搜索
hermes skills search react --source skills-sh     # 搜索 skills.sh 目录
hermes skills search https://mintlify.com/docs --source well-known
hermes skills inspect openai/skills/k8s           # 安装前预览
hermes skills install openai/skills/k8s           # 通过安全扫描进行安装
hermes skills install official/security/1password
hermes skills install skills-sh/vercel-labs/json-render/json-render-react --force
hermes skills install well-known:https://mintlify.com/docs/.well-known/skills/mintlify
hermes skills install https://sharethis.chat/SKILL.md              # 直接 URL（单文件 SKILL.md）
hermes skills install https://example.com/SKILL.md --name my-skill # 当前置元数据中没有名称时覆盖名称
hermes skills list --source hub                   # 列出已安装的中心技能
hermes skills check                               # 检查已安装的中心技能是否有上游更新
hermes skills update                              # 需要时重新安装具有上游更改的中心技能
hermes skills audit                               # 重新扫描所有中心技能以确保安全
hermes skills uninstall k8s                       # 移除一个中心技能
hermes skills reset google-workspace              # 使捆绑技能脱离"用户已修改"状态（见下文）
hermes skills reset google-workspace --restore    # 同时恢复捆绑版本，删除您的本地编辑
hermes skills publish skills/my-skill --to github --repo owner/repo
hermes skills snapshot export setup.json          # 导出技能配置
hermes skills tap add myorg/skills-repo           # 添加自定义 GitHub 来源
```

### 支持的中心来源

| 来源 | 示例 | 说明 |
|------|------|------|
| `official` | `official/security/1password` | 随 Hermes 一起提供的可选技能。 |
| `skills-sh` | `skills-sh/vercel-labs/agent-skills/vercel-react-best-practices` | 可通过 `hermes skills search <query> --source skills-sh` 搜索。当 skills.sh 的标识符与存储库文件夹不同时，Hermes 会解析别名形式的技能。 |
| `well-known` | `well-known:https://mintlify.com/docs/.well-known/skills/mintlify` | 直接从网站上的 `/.well-known/skills/index.json` 提供的技能。使用站点或文档 URL 进行搜索。 |
| `url` | `https://sharethis.chat/SKILL.md` | 指向单文件 `SKILL.md` 的直接 HTTP(S) URL。名称解析：前置元数据 → URL 标识符 → 交互提示 → `--name` 标志。 |
| `github` | `openai/skills/k8s` | 直接的 GitHub 存储库/路径安装和自定义 tap。 |
| `clawhub`、`lobehub`、`browse-sh`、`claude-marketplace` | 来源特定标识符 | 社区或市场集成。 |

### 集成的中心和注册表

Hermes 目前与这些技能生态系统和发现来源集成：

#### 1. 官方可选技能 (`official`)

这些技能在 Hermes 存储库本身中维护，并以内置信任进行安装。

- 目录：[官方可选技能目录](../../reference/optional-skills-catalog)
- 存储库中的来源：`optional-skills/`
- 示例：

```bash
hermes skills browse --source official
hermes skills install official/security/1password
```

#### 2. skills.sh (`skills-sh`)

这是 Vercel 的公共技能目录。Hermes 可以直接搜索它、检查技能详细信息页面、解析别名形式的标识符，并从底层源存储库进行安装。

- 目录：[skills.sh](https://skills.sh/)
- CLI/工具存储库：[vercel-labs/skills](https://github.com/vercel-labs/skills)
- Vercel 官方技能存储库：[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)
- 示例：

```bash
hermes skills search react --source skills-sh
hermes skills inspect skills-sh/vercel-labs/json-render/json-render-react
hermes skills install skills-sh/vercel-labs/json-render/json-render-react --force
```

#### 3. 知名技能端点 (`well-known`)

这是基于 URL 的发现方式，来自发布 `/.well-known/skills/index.json` 的站点。它不是单一的中心化中心——它是一种 Web 发现约定。

- 示例活动端点：[Mintlify 文档技能索引](https://mintlify.com/docs/.well-known/skills/index.json)
- 参考服务器实现：[vercel-labs/skills-handler](https://github.com/vercel-labs/skills-handler)
- 示例：

```bash
hermes skills search https://mintlify.com/docs --source well-known
hermes skills inspect well-known:https://mintlify.com/docs/.well-known/skills/mintlify
hermes skills install well-known:https://mintlify.com/docs/.well-known/skills/mintlify
```

#### 4. 直接 GitHub 技能 (`github`)

Hermes 可以直接从 GitHub 存储库和基于 GitHub 的 tap 进行安装。当您已经知道存储库/路径或想要添加自己的自定义源存储库时，这很有用。

默认 tap（无需任何设置即可浏览）：
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

一个作为社区来源集成的第三方技能市场。

- 站点：[clawhub.ai](https://clawhub.ai/)
- Hermes 来源 ID：`clawhub`

#### 6. Claude 市场风格的存储库 (`claude-marketplace`)

Hermes 支持发布 Claude 兼容的插件/市场清单的市场存储库。

已知的集成来源包括：
- [anthropics/skills](https://github.com/anthropics/skills)
- [aiskillstore/marketplace](https://github.com/aiskillstore/marketplace)

Hermes 来源 ID：`claude-marketplace`

#### 7. LobeHub (`lobehub`)

Hermes 可以搜索 LobeHub 公共目录中的智能体条目，并将其转换为可安装的 Hermes 技能。

- 站点：[LobeHub](https://lobehub.com/)
- 公共智能体索引：[chat-agents.lobehub.com](https://chat-agents.lobehub.com/)
- 支持存储库：[lobehub/lobe-chat-agents](https://github.com/lobehub/lobe-chat-agents)
- Hermes 来源 ID：`lobehub`

#### 8. browse.sh (`browse-sh`)

Hermes 与 [browse.sh](https://browse.sh) 集成，这是 Browserbase 的包含 200 多个特定站点浏览器自动化 SKILL.md 文件的目录（Airbnb、Amazon、arXiv、12306.cn、Etsy、Xero 等等）。每个技能描述如何端到端地驱动一个网站，适用于与 Hermes 的浏览器工具以及您已安装的任何浏览器自动化技能一起使用。

- 站点：[browse.sh](https://browse.sh/)
- 目录 API：`https://browse.sh/api/skills`
- Hermes 来源 ID：`browse-sh`
- 信任级别：`community`

```bash
hermes skills search airbnb --source browse-sh
hermes skills inspect browse-sh/airbnb.com/search-listings-ddgioa
hermes skills install browse-sh/airbnb.com/search-listings-ddgioa
```

标识符使用 `browse-sh/<hostname>/<task-id>` 的形式，并与 browse.sh 目录暴露的标识符匹配。内容通过每个技能的详细信息端点（`/api/skills/<slug>` → `skillMdUrl`）解析，而不是通过目录的 GitHub `sourceUrl`。

#### 9. 直接 URL (`url`)

直接从任何 HTTP(S) URL 安装单文件 `SKILL.md` —— 当作者将技能托管在自己的站点上时很有用（无需中心列表，无需输入 GitHub 路径）。Hermes 获取 URL，解析 YAML 前置元数据，进行安全扫描并安装。

- Hermes 来源 ID：`url`
- 标识符：URL 本身（无需前缀）
- 范围：**仅限单文件 `SKILL.md`**。包含 `references/` 或 `scripts/` 的多文件技能需要清单，并且应该通过上述其他来源之一发布。

```bash
hermes skills install https://sharethis.chat/SKILL.md
hermes skills install https://example.com/my-skill/SKILL.md --category productivity
```

名称解析顺序：
1. SKILL.md YAML 前置元数据中的 `name:` 字段（推荐——每个格式正确的技能都有一个）。
2. URL 路径中的父目录名称（例如 `.../my-skill/SKILL.md` → `my-skill`，或 `.../my-skill.md` → `my-skill`），当它是有效的标识符时（`^[a-z][a-z0-9_-]*$`）。
3. 带有 TTY 的终端上的交互提示。
4. 在非交互式界面（TUI 内的 `/skills install` 斜杠命令、网关平台、脚本）上，显示一个指向 `--name` 覆盖的清晰错误。

```bash
# 前置元数据中没有名称且 URL 标识符无用 —— 请提供一个：
hermes skills install https://example.com/SKILL.md --name sharethis-chat

# 或者在聊天会话中：
/skills install https://example.com/SKILL.md --name sharethis-chat
```

信任级别始终为 `community` —— 与其他任何来源一样运行安全扫描。URL 被存储为安装标识符，因此当您想要刷新时，`hermes skills update` 会自动从相同的 URL 重新获取。

### 安全扫描和 `--force`

所有中心安装的技能都经过**安全扫描器**，该扫描器检查数据泄露、提示注入、破坏性命令、供应链信号和其他威胁。

`hermes skills inspect ...` 现在也会在可用时显示上游元数据：
- 存储库 URL
- skills.sh 详细信息页面 URL
- 安装命令
- 每周安装量
- 上游安全审计状态
- 知名索引/端点 URL

当您已审查第三方技能并想要覆盖非危险性策略阻止时，请使用 `--force`：

```bash
hermes skills install skills-sh/anthropics/skills/pdf --force
```

重要行为：
- `--force` 可以覆盖针对谨慎/警告式发现的策略阻止。
- `--force` **不会**覆盖 `dangerous`（危险）扫描结果。
- 官方可选技能（`official/...`）被视为内置信任，不显示第三方警告面板。

### 信任级别

| 级别 | 来源 | 策略 |
|------|------|------|
| `builtin` | 随 Hermes 一起提供 | 始终受信任 |
| `official` | 存储库中的 `optional-skills/` | 内置信任，无第三方警告 |
| `trusted` | 可信的注册表/存储库，如 `openai/skills`、`anthropics/skills`、`huggingface/skills` | 比社区来源更宽松的策略 |
| `community` | 其他所有（`skills.sh`、知名端点、自定义 GitHub 存储库、大多数市场） | 非危险性发现可以用 `--force` 覆盖；`dangerous`（危险）结果保持阻止 |

### 更新生命周期

中心现在跟踪足够的来源信息，以重新检查已安装技能的上游副本：

```bash
hermes skills check          # 报告哪些已安装的中心技能上游已更改
hermes skills update         # 仅重新安装具有可用更新的技能
hermes skills update react   # 更新一个特定的已安装中心技能
```

这使用存储的源标识符加上当前的上游包内容哈希来检测漂移。

:::tip GitHub 速率限制
技能中心操作使用 GitHub API，该 API 对未认证用户的速率限制为 60 次请求/小时。如果您在安装或搜索期间遇到速率限制错误，请在 `.env` 文件中设置 `GITHUB_TOKEN` 以将限制增加到 5,000 次请求/小时。发生此情况时，错误消息会包含一个可操作的提示。
:::

### 发布自定义技能 Tap

如果您想共享一组精选的技能——为您的团队、您的组织或公开地——您可以将它们发布为一个 **tap**：其他 Hermes 用户可以通过 `hermes skills tap add <owner/repo>` 添加的 GitHub 存储库。无需服务器、无需注册表注册、无需发布管道。只需一个 `SKILL.md` 文件目录。

#### 存储库布局

一个 tap 是任何 GitHub 存储库（公共或私有——私有需要 `GITHUB_TOKEN`），布局如下：

```
owner/repo
├── skills/                       # 默认路径；每个 tap 可配置
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
- 每个技能位于 tap 根路径下的自己的目录中（默认为 `skills/`）。
- 目录名称成为技能的安装标识符。
- 每个技能目录必须包含一个具有标准 [SKILL.md 前置元数据](#skillmd-format)（`name`、`description`，以及可选的 `metadata.hermes.tags`、`version`、`author`、`platforms`、`metadata.hermes.config`）的 `SKILL.md`。
- `references/`、`templates/`、`scripts/`、`assets/` 等子目录会在安装时与 `SKILL.md` 一起下载。
- 目录名称以 `.` 或 `_` 开头的技能会被忽略。

Hermes 通过列出 tap 路径下的每个子目录并探测其中的 `SKILL.md` 来发现技能。

#### 最小 tap 示例

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
description: 我们的部署操作手册 —— 服务、回滚、Slack 频道
version: 1.0.0
author: 我的组织平台团队
metadata:
  hermes:
    tags: [deployment, runbook, internal]
---

# 部署操作手册

步骤 1: ...
```

将其推送到 GitHub 后，任何 Hermes 用户都可以订阅和安装：

```bash
hermes skills tap add my-org/hermes-skills
hermes skills search deploy
hermes skills install my-org/hermes-skills/deploy-runbook
```

#### 非默认路径

如果您的技能不在 `skills/` 下（当您将 `skills/` 子树添加到现有项目时很常见），请编辑 `~/.hermes/.hub/taps.json` 中的 tap 条目：

```json
{
  "taps": [
    {"repo": "my-org/platform-docs", "path": "internal/skills/"}
  ]
}
```

`hermes skills tap add` 命令行将新 tap 的默认路径设为 `path: "skills/"`；如果需要不同的路径，请直接编辑该文件。`hermes skills tap list` 显示每个 tap 的有效路径。

#### 直接安装单个技能（无需添加 tap）

用户也可以在不添加整个存储库作为 tap 的情况下，从任何公共 GitHub 存储库安装单个技能：

```bash
hermes skills install owner/repo/skills/my-workflow
```

当您想共享一个技能而不必让用户订阅您的整个注册表时很有用。

#### Tap 的信任级别

新 tap 默认分配 `community` 信任级别。从中安装的技能会通过标准安全扫描，并在首次安装时显示第三方警告面板。如果您的组织或广泛信任的来源应该获得更高的信任，请将其存储库添加到 `tools/skills_hub.py` 中的 `TRUSTED_REPOS`（需要 Hermes 核心 PR）。

#### Tap 管理

```bash
hermes skills tap list                                # 显示所有已配置的 tap
hermes skills tap add myorg/skills-repo               # 添加（默认路径：skills/）
hermes skills tap remove myorg/skills-repo            # 移除
```

在运行的会话内部：

```
/skills tap list
/skills tap add myorg/skills-repo
/skills tap remove myorg/skills-repo
```

Tap 存储在 `~/.hermes/.hub/taps.json`（按需创建）。

```markdown
---
title: "Hermes智能体：内置技能更新与管理指南"
description: "详细说明如何通过hermes skills reset命令管理Hermes的内置技能，包括重置、恢复和在不同配置文件中操作。"
slug: hermes-agent-bundled-skill-updates
---

## 内置技能更新 (`hermes skills reset`)

Hermes在代码库的 `skills/` 目录中附带了一组内置技能。在安装时以及每次执行 `hermes update` 时，都会进行一个同步过程，将这些技能复制到 `~/.hermes/skills/` 中，并在 `~/.hermes/skills/.bundled_manifest` 记录一个清单，将每个技能名称映射到同步时的内容哈希值（即**原始哈希**）。

在每次同步时，Hermes会重新计算你本地副本的哈希值，并与原始哈希进行比较：

- **未修改** → 可以安全地拉取上游更新，复制新的内置版本进来，并记录新的原始哈希。
- **已修改** → 将被视为**用户修改版**并永久跳过，因此你的编辑不会被覆盖。

这种保护机制很好，但有一个棘手之处。如果你编辑了一个内置技能，之后又想放弃更改并恢复到原始内置版本，仅仅通过从 `~/.hermes/hermes-agent/skills/` 复制粘贴是行不通的。清单中仍然保存着上次成功同步时的*旧*原始哈希。你新复制粘贴的内容（当前的内置哈希）与那个过时的原始哈希不匹配，因此同步过程会持续将其标记为用户修改版。

`hermes skills reset` 是解决此问题的专用命令：

```bash
# 安全重置：清除该技能的清单条目。保留你当前的副本，
# 但下次同步会基于它重新建立基准，从而使未来的更新恢复正常。
hermes skills reset google-workspace

# 完全恢复：同时删除你的本地副本，并重新复制当前的内置版本。
# 当你想要恢复原始的上游技能时使用此选项。
hermes skills reset google-workspace --restore

# 非交互模式（例如在脚本或TUI模式中）——跳过 --restore 的确认提示。
hermes skills reset google-workspace --restore --yes
```

同样的命令也可以在聊天界面中作为斜杠命令使用：

```text
/skills reset google-workspace
/skills reset google-workspace --restore
```

:::note 配置文件
每个配置文件（profile）在其自己的 `HERMES_HOME` 下都有独立的 `.bundled_manifest`，因此 `hermes -p coder skills reset <name>` 命令只会影响该指定的配置文件。
:::

### 斜杠命令（在聊天中使用）

所有相同的命令都可以通过 `/skills` 来使用：

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

官方可选技能仍然使用诸如 `official/security/1password` 和 `official/migration/openclaw-migration` 这样的标识符。
```