---
sidebar_position: 3
title: "创建技能"
description: "如何为 Hermes Agent 创建技能 — SKILL.md 格式、指南和发布流程"
---

# 创建技能

技能是为 Hermes Agent 添加新功能的首选方式。它们比工具更容易创建，不需要修改智能体代码，并且可以与社区共享。

## 技能还是工具？

当满足以下条件时，应将其作为**技能 (Skill)**：
- 该能力可以表示为指令 + Shell 命令 + 现有工具的组合
- 它封装了一个外部 CLI 或 API，智能体可以通过 `terminal` 或 `web_extract` 调用
- 它不需要在智能体中内置自定义 Python 集成或 API 密钥管理
- 示例：arXiv 搜索、git 工作流、Docker 管理、PDF 处理、通过 CLI 工具发送电子邮件

当满足以下条件时，应将其作为**工具 (Tool)**：
- 它需要与 API 密钥、认证流程或多组件配置进行端到端集成
- 它需要自定义处理逻辑，并且必须每次都精确执行
- 它处理二进制数据、流式传输或实时事件
- 示例：浏览器自动化、TTS（文本转语音）、视觉分析

## 技能目录结构

打包的技能位于 `skills/` 目录下，并按类别组织。官方可选技能在 `optional-skills/` 中使用相同的结构：

```text
skills/
├── research/
│   └── arxiv/
│       ├── SKILL.md              # 必需：主要指令
│       └── scripts/              # 可选：辅助脚本
│           └── search_arxiv.py
├── productivity/
│   └── ocr-and-documents/
│       ├── SKILL.md
│       ├── scripts/
│       └── references/
└── ...
```

## SKILL.md 格式

```markdown
---
name: my-skill
description: 简短描述（显示在技能搜索结果中）
version: 1.0.0
author: Your Name
license: MIT
platforms: [macos, linux]          # 可选 — 限制到特定的操作系统平台
                                   #   有效值：macos, linux, windows
                                   #   省略则在所有平台上加载（默认）
metadata:
  hermes:
    tags: [Category, Subcategory, Keywords]
    related_skills: [other-skill-name]
    requires_toolsets: [web]            # 可选 — 仅当这些工具集激活时显示
    requires_tools: [web_search]        # 可选 — 仅当这些工具可用时显示
    fallback_for_toolsets: [browser]    # 可选 — 当这些工具集激活时隐藏
    fallback_for_tools: [browser_navigate]  # 可选 — 当这些工具存在时隐藏
    config:                              # 可选 — 技能所需的 config.yaml 设置
      - key: my.setting
        description: "此设置控制的内容"
        default: "sensible-default"
        prompt: "显示设置提示"
required_environment_variables:          # 可选 — 技能所需的环境变量
  - name: MY_API_KEY
    prompt: "请输入您的 API 密钥"
    help: "在 https://example.com 获取"
    required_for: "API 访问"
---

# 技能标题

简短介绍。

## 使用场景
触发条件 — 何时应加载此技能？

## 快速参考
常见命令或 API 调用的表格。

## 流程
智能体遵循的逐步指令。

## 注意事项
已知的故障模式以及如何处理它们。

## 验证
智能体如何确认它已成功运行。
```

### 特定平台技能

技能可以使用 `platforms` 字段限制到特定的操作系统：

```yaml
platforms: [macos]            # 仅限 macOS（例如：iMessage、Apple Reminders）
platforms: [macos, linux]     # macOS 和 Linux
platforms: [windows]          # 仅限 Windows
```

设置后，该技能将自动从系统提示、`skills_list()` 和不兼容平台上的斜杠命令中隐藏。如果省略或为空，则技能在所有平台上加载（向后兼容）。

### 条件技能激活

技能可以声明对特定工具或工具集的依赖。这控制了技能是否在给定会话的系统提示中显示。

```yaml
metadata:
  hermes:
    requires_toolsets: [web]           # 如果 web 工具集未激活，则隐藏
    requires_tools: [web_search]       # 如果 web_search 工具不可用，则隐藏
    fallback_for_toolsets: [browser]   # 如果浏览器工具集已激活，则隐藏
    fallback_for_tools: [browser_navigate]  # 如果 browser_navigate 工具可用，则隐藏
```

| 字段 | 行为 |
|-------|----------|
| `requires_toolsets` | 当任何列出的工具集**未**可用时，技能将**隐藏** |
| `requires_tools` | 当任何列出的工具**未**可用时，技能将**隐藏** |
| `fallback_for_toolsets` | 当任何列出的工具集**已**可用时，技能将**隐藏** |
| `fallback_for_tools` | 当任何列出的工具**已**可用时，技能将**隐藏** |

**`fallback_for_*` 的用例：** 创建一个作为主要工具不可用时的替代方案的技能。例如，一个带有 `fallback_for_tools: [web_search]` 的 `duckduckgo-search` 技能，仅在网络搜索工具（需要 API 密钥）未配置时显示。

**`requires_*` 的用例：** 创建一个只有在某些工具存在时才有意义的技能。例如，一个带有 `requires_toolsets: [web]` 的网络爬取工作流技能，在网络工具禁用时不会污染提示。

### 环境变量要求

技能可以声明它们所需的环境变量。当通过 `skill_view` 加载技能时，其所需的变量会自动注册，以便传递到沙箱执行环境（terminal, execute_code）。

```yaml
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: "Tenor API 密钥"               # 提示用户时显示
    help: "在 https://tenor.com 获取您的密钥"  # 帮助文本或 URL
    required_for: "GIF 搜索功能"   # 需要此变量的功能描述
```

每个条目支持：
- `name` (必需) — 环境变量名称
- `prompt` (可选) — 询问用户值时的提示文本
- `help` (可选) — 获取值的帮助文本或 URL
- `required_for` (可选) — 描述需要此变量的功能

用户也可以在 `config.yaml` 中手动配置透传变量：

```yaml
terminal:
  env_passthrough:
    - MY_CUSTOM_VAR
    - ANOTHER_VAR
```

有关 macOS 专用技能的示例，请参阅 `skills/apple/`。

## 加载时的安全设置

当技能需要 API 密钥或令牌时，请使用 `required_environment_variables`。缺失的值**不会**隐藏技能的发现。相反，当技能在本地 CLI 加载时，Hermes 会安全地提示用户输入这些值。

```yaml
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: Tenor API 密钥
    help: 从 https://developers.google.com/tenor 获取密钥
    required_for: 完全功能
```

用户可以跳过设置并继续加载技能。Hermes 绝不会向模型暴露原始密钥值。网关和消息会话会显示本地设置指南，而不是在会话中收集密钥。

:::tip 沙箱透传
当您的技能加载时，任何声明的 `required_environment_variables` 如果已设置，将**自动透传**到 `execute_code` 和 `terminal` 沙箱——包括 Docker 和 Modal 等远程后端。您的技能脚本可以访问 `$TENOR_API_KEY`（或 Python 中的 `os.environ["TENOR_API_KEY"]`），而无需用户配置任何额外内容。有关详细信息，请参阅 [环境变量透传](/docs/user-guide/security#environment-variable-passthrough)。
:::

遗留的 `prerequisites.env_vars` 仍然作为向后兼容的别名支持。

### 配置设置 (config.yaml)

技能可以声明非秘密设置，这些设置存储在 `config.yaml` 的 `skills.config` 命名空间下。与环境变量（存储在 `.env` 中的秘密）不同，配置设置用于路径、偏好设置和其他非敏感值。

```yaml
metadata:
  hermes:
    config:
      - key: myplugin.path
        description: 插件数据目录的路径
        default: "~/myplugin-data"
        prompt: 插件数据目录路径
      - key: myplugin.domain
        description: 插件操作的领域
        default: ""
        prompt: 插件领域（例如：AI/ML 研究）
```

每个条目支持：
- `key` (必需) — 设置的点路径（例如：`myplugin.path`）
- `description` (必需) — 解释设置控制的内容
- `default` (可选) — 如果用户未配置的默认值
- `prompt` (可选) — 在 `hermes config migrate` 期间显示的提示文本；如果缺失，则回退到 `description`

**工作原理：**

1. **存储：** 值写入 `config.yaml` 的 `skills.config.<key>` 下：
   ```yaml
   skills:
     config:
       myplugin:
         path: ~/my-data
   ```

2. **发现：** `hermes config migrate` 扫描所有已启用的技能，查找未配置的设置，并提示用户。设置也会在 `hermes config show` 的“技能设置”下显示。

3. **运行时注入：** 当技能加载时，其配置值会被解析并附加到技能消息中：
   ```
   [技能配置 (来自 ~/.hermes/config.yaml):
     myplugin.path = /home/user/my-data
   ]
   ```
   智能体无需读取 `config.yaml` 本身，就能看到配置的值。

4. **手动设置：** 用户也可以直接设置值：
   ```bash
   hermes config set skills.config.myplugin.path ~/my-data
   ```

:::tip 何时使用哪个
对于 API 密钥、令牌和其他**秘密**，请使用 `required_environment_variables`（存储在 `~/.hermes/.env` 中，绝不会显示给模型）。对于**路径、偏好设置和非敏感设置**，请使用 `config`（存储在 `config.yaml` 中，在配置显示中可见）。
:::

### 凭证文件要求 (OAuth 令牌等)

使用 OAuth 或基于文件的凭证的技能可以声明需要挂载到远程沙箱的文件。这是指存储为**文件**（而非环境变量）的凭证——通常由设置脚本生成的 OAuth 令牌文件。

```yaml
required_credential_files:
  - path: google_token.json
    description: Google OAuth2 令牌（由设置脚本创建）
  - path: google_client_secret.json
    description: Google OAuth2 客户端凭证
```

每个条目支持：
- `path` (必需) — 相对于 `~/.hermes/` 的文件路径
- `description` (可选) — 解释文件是什么以及如何创建

加载时，Hermes 会检查这些文件是否存在。缺少文件会触发 `setup_needed`。现有文件会自动：
- **挂载到 Docker** 容器作为只读绑定挂载
- **同步到 Modal** 沙箱（在创建时 + 每次命令前，以便会话中进行 OAuth 操作）
- 在**本地**后端可用，无需任何特殊处理

:::tip 何时使用哪个
对于简单的 API 密钥和令牌（存储在 `~/.hermes/.env` 中的字符串），请使用 `required_environment_variables`。对于 OAuth 令牌文件、客户端密钥、服务账号 JSON、证书或任何磁盘上的文件凭证，请使用 `required_credential_files`。
:::

有关使用两者进行完整示例，请参阅 `skills/productivity/google-workspace/SKILL.md`。

## 技能指南

### 无外部依赖

优先使用标准库 Python、curl 和现有的 Hermes 工具（`web_extract`、`terminal`、`read_file`）。如果需要依赖，请在技能中记录安装步骤。

### 渐进式披露

将最常见的工作流放在最前面。边缘案例和高级用法放在底部。这可以保持常见任务的 Token 使用量较低。

### 包含辅助脚本

对于 XML/JSON 解析或复杂逻辑，请在 `scripts/` 中包含辅助脚本——不要期望 LLM 每次都能在行内编写解析器。

### 测试它

运行技能并验证智能体是否正确遵循了指令：

```bash
hermes chat --toolsets skills -q "使用 X 技能完成 Y"
```

## 技能应放置在哪里？

打包的技能（在 `skills/` 中）随每个 Hermes 安装包一起提供。它们应该对**大多数用户都具有广泛的实用性**：

- 文档处理、网络研究、常见开发工作流、系统管理
- 被广泛人群定期使用

如果您的技能是官方的且有用，但并非普遍必需（例如，付费服务集成、重量级依赖），请将其放在 **`optional-skills/`** — 它随仓库一起发布，可通过 `hermes skills browse` 发现（标记为“官方”），并带有内置信任安装。

如果您的技能是专业化的、社区贡献的或小众的，则更适合 **技能中心 (Skills Hub)** — 将其上传到注册表并通过 `hermes skills install` 进行分享。

## 技能发布

### 发布到技能中心

```bash
hermes skills publish skills/my-skill --to github --repo owner/repo
```

### 发布到自定义仓库

将您的仓库添加为 tap：

```bash
hermes skills tap add owner/repo
```

用户随后可以从您的仓库搜索和安装。

## 安全扫描

所有通过中心安装的技能都会经过安全扫描器，检查以下内容：

- 数据外泄模式
- 提示注入尝试
- 破坏性命令
- Shell 注入

信任级别：
- `builtin` — 随 Hermes 提供（始终信任）
- `official` — 来自仓库中的 `optional-skills/`（内置信任，无第三方警告）
- `trusted` — 来自 openai/skills, anthropics/skills
- `community` — 非危险的发现可以使用 `--force` 覆盖；`dangerous` 判定仍然被阻止

现在，Hermes 可以从多个外部发现模型消费第三方技能：
- 直接 GitHub 标识符（例如 `openai/skills/k8s`）
- `skills.sh` 标识符（例如 `skills-sh/vercel-labs/json-render/json-render-react`）
- 从 `/.well-known/skills/index.json` 提供的知名端点

如果您希望您的技能在没有特定 GitHub 安装程序的情况下也能被发现，请考虑除了发布到仓库或市场外，还从知名端点提供服务。