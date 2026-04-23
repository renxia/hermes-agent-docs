---
sidebar_position: 3
title: "创建技能"
description: "如何为 Hermes 智能体创建技能 — SKILL.md 格式、指南与发布"
---

# 创建技能

技能是为 Hermes 智能体添加新功能的首选方式。相比工具，它们更易于创建，无需对智能体进行代码修改，并且可以与社区共享。

## 应该使用技能还是工具？

当满足以下条件时，请创建为**技能**：
- 该功能可以通过指令 + Shell 命令 + 现有工具来表达
- 它封装了外部 CLI 或 API，智能体可通过 `terminal` 或 `web_extract` 调用
- 它不需要将自定义 Python 集成或 API 密钥管理内置到智能体中
- 示例：arXiv 搜索、git 工作流、Docker 管理、PDF 处理、通过 CLI 工具发送邮件

当满足以下条件时，请创建为**工具**：
- 它需要端到端的集成，涉及 API 密钥、认证流程或多组件配置
- 它需要自定义处理逻辑，且每次都必须精确执行
- 它处理二进制数据、流媒体或实时事件
- 示例：浏览器自动化、TTS（文本转语音）、视觉分析

## 技能目录结构

内置技能存放在按类别组织的 `skills/` 目录中。官方可选技能在 `optional-skills/` 中使用相同的结构：

```text
skills/
├── research/
│    └── arxiv/
│        ├── SKILL.md               # 必填：主要指令
│        └── scripts/               # 可选：辅助脚本
│            └── search_arxiv.py
├── productivity/
│    └── ocr-and-documents/
│        ├── SKILL.md
│        ├── scripts/
│        └── references/
└── ...
```

## SKILL.md 格式

```markdown
---
name: my-skill
description: 简要描述（显示在技能搜索结果中）
version: 1.0.0
author: 你的名字
license: MIT
platforms: [macos, linux]           # 可选 — 限制为特定的操作系统平台
                                    #   有效值：macos, linux, windows
                                    #   省略则默认在所有平台上加载
metadata:
  hermes:
    tags: [Category, Subcategory, Keywords]
    related_skills: [other-skill-name]
    requires_toolsets: [web]             # 可选 — 仅当这些工具集处于激活状态时显示
    requires_tools: [web_search]         # 可选 — 仅当这些工具可用时显示
    fallback_for_toolsets: [browser]     # 可选 — 当这些工具集处于激活状态时隐藏
    fallback_for_tools: [browser_navigate]   # 可选 — 当这些工具存在时隐藏
    config:                               # 可选 — 技能所需的 config.yaml 配置项
       - key: my.setting
        description: "该配置项控制的内容"
        default: "sensible-default"
        prompt: "显示设置时的提示文本"
required_environment_variables:           # 可选 — 技能所需的环境变量
   - name: MY_API_KEY
    prompt: "输入你的 API 密钥"
    help: "在 https://example.com 获取"
    required_for: "API 访问权限"
---

# 技能标题

简要介绍。

## 何时使用
触发条件 — 智能体应在何时加载此技能？

## 快速参考
常用命令或 API 调用表。

## 操作流程
智能体需遵循的分步指令。

## 注意事项
已知的故障模式及其处理方法。

## 验证
智能体如何确认操作已成功。
```

### 平台特定技能

技能可以使用 `platforms` 字段将自己限制在特定的操作系统上：

```yaml
platforms: [macos]             # 仅限 macOS（例如 iMessage、Apple Reminders）
platforms: [macos, linux]      # macOS 和 Linux
platforms: [windows]           # 仅限 Windows
```

设置后，该技能将在不兼容的系统提示词、`skills_list()` 和斜杠命令中自动隐藏。如果省略或为空，该技能将在所有平台上加载（向后兼容）。

### 条件性技能激活

技能可以声明对特定工具或工具集的依赖关系。这决定了该技能是否会在给定会话的系统提示词中显示。

```yaml
metadata:
  hermes:
    requires_toolsets: [web]            # 当列出的任一工具集不可用时隐藏
    requires_tools: [web_search]        # 当列出的任一工具不可用时隐藏
    fallback_for_toolsets: [browser]    # 当列出的任一工具集可用时隐藏
    fallback_for_tools: [browser_navigate]   # 当列出的任一工具可用时隐藏
```

| 字段 | 行为 |
|-------|----------|
| `requires_toolsets` | 当列出的任一工具集**不可用**时，技能将被**隐藏** |
| `requires_tools` | 当列出的任一工具**不可用**时，技能将被**隐藏** |
| `fallback_for_toolsets` | 当列出的任一工具集**可用**时，技能将被**隐藏** |
| `fallback_for_tools` | 当列出的任一工具**可用**时，技能将被**隐藏** |

**`fallback_for_*` 的使用场景：** 创建一个在主工具不可用时作为替代方案的技能。例如，带有 `fallback_for_tools: [web_search]` 的 `duckduckgo-search` 技能仅在未配置网页搜索工具（需要 API 密钥）时才会显示。

**`requires_*` 的使用场景：** 创建一个仅在特定工具存在时才有意义的技能。例如，带有 `requires_toolsets: [web]` 的网络抓取工作流技能在网页工具被禁用时不会使提示词变得杂乱。

### 环境变量要求

技能可以声明其所需的环境变量。当通过 `skill_view` 加载技能时，其所需变量会自动注册，以便透传至沙箱执行环境（terminal, execute_code）。

```yaml
required_environment_variables:
   - name: TENOR_API_KEY
    prompt: "Tenor API 密钥"                # 提示用户时显示
    help: "在 https://tenor.com 获取密钥"   # 帮助文本或 URL
    required_for: "GIF 搜索功能"            # 哪个功能需要此变量
```

每个条目支持：
- `name`（必填）— 环境变量名称
- `prompt`（可选）— 向用户请求值时显示的提示文本
- `help`（可选）— 获取该值的帮助文本或 URL
- `required_for`（可选）— 描述哪个功能需要此变量

用户也可以在 `config.yaml` 中手动配置透传变量：

```yaml
terminal:
  env_passthrough:
     - MY_CUSTOM_VAR
     - ANOTHER_VAR
```

请参阅 `skills/apple/` 以获取仅限 macOS 的技能示例。

## 加载时的安全配置

当技能需要 API 密钥或令牌时，请使用 `required_environment_variables`。缺失值**不会**使技能在发现列表中隐藏。相反，当技能在本地 CLI 中加载时，Hermes 会安全地提示用户输入。

```yaml
required_environment_variables:
   - name: TENOR_API_KEY
    prompt: Tenor API 密钥
    help: 从 https://developers.google.com/tenor 获取密钥
    required_for: 完整功能
```

用户可以跳过配置并继续加载技能。Hermes 绝不会向模型暴露原始密钥值。网关和消息会话会显示本地配置指南，而不是在会话内收集密钥。

:::tip 沙箱透传
当你的技能加载时，任何已设置的 `required_environment_variables` 都会**自动透传**至 `execute_code` 和 `terminal` 沙箱——包括 Docker 和 Modal 等远程后端。你的技能脚本可以直接访问 `$TENOR_API_KEY`（或在 Python 中使用 `os.environ["TENOR_API_KEY"]`），用户无需进行额外配置。详见 [环境变量透传](/docs/user-guide/security#environment-variable-passthrough)。
:::

旧的 `prerequisites.env_vars` 仍作为向后兼容的别名提供支持。

### 配置项设置 (config.yaml)

技能可以声明非密钥的配置项，这些配置项将存储在 `config.yaml` 的 `skills.config` 命名空间下。与存储在 `.env` 中的环境变量（属于密钥）不同，配置项用于存储路径、偏好设置和其他非敏感值。

```yaml
metadata:
  hermes:
    config:
       - key: myplugin.path
        description: 插件数据目录的路径
        default: "~/myplugin-data"
        prompt: 插件数据目录路径
       - key: myplugin.domain
        description: 插件运行的域名
        default: ""
        prompt: 插件域名（例如 AI/ML 研究）
```

每个条目支持：
- `key`（必填）— 配置项的点路径（例如 `myplugin.path`）
- `description`（必填）— 说明该配置项控制的内容
- `default`（可选）— 用户未配置时的默认值
- `prompt`（可选）— 在 `hermes config migrate` 期间显示的提示文本；若未提供则回退到 `description`

**工作原理：**

1. **存储：** 值将写入 `config.yaml` 的 `skills.config.<key>` 下：
    ```yaml
   skills:
     config:
       myplugin:
         path: ~/my-data
    ```

2. **发现：** `hermes config migrate` 会扫描所有已启用的技能，查找未配置的设置并提示用户。设置项也会显示在 `hermes config show` 的“技能设置”中。

3. **运行时注入：** 当技能加载时，其配置值会被解析并附加到技能消息中：
    ```
   [技能配置 (来自 ~/.hermes/config.yaml):
    myplugin.path = /home/user/my-data
   ]
   ```
   智能体可以直接看到配置后的值，而无需自行读取 `config.yaml`。

4. **手动配置：** 用户也可以直接设置值：
    ```bash
   hermes config set skills.config.myplugin.path ~/my-data
    ```

:::tip 何时使用哪种方式
对于 API 密钥、令牌和其他**密钥**（存储在 `~/.hermes/.env`，绝不向模型显示），请使用 `required_environment_variables`。对于**路径、偏好设置和非敏感配置**（存储在 `config.yaml`，可在配置查看中显示），请使用 `config`。
:::

### 凭证文件要求（OAuth 令牌等）

使用 OAuth 或基于文件的凭证的技能可以声明需要挂载到远程沙箱的文件。这适用于以**文件**形式（而非环境变量）存储的凭证——通常是由配置脚本生成的 OAuth 令牌文件。

```yaml
required_credential_files:
   - path: google_token.json
    description: Google OAuth2 令牌（由配置脚本生成）
   - path: google_client_secret.json
    description: Google OAuth2 客户端凭证
```

每个条目支持：
- `path`（必填）— 相对于 `~/.hermes/` 的文件路径
- `description`（可选）— 说明该文件的用途及生成方式

加载时，Hermes 会检查这些文件是否存在。缺失文件将触发 `setup_needed`。已存在的文件会自动：
- **挂载到 Docker** 容器中作为只读绑定挂载
- **同步到 Modal** 沙箱中（在创建时 + 每条命令执行前，以便会话中途的 OAuth 正常工作）
- 在**本地**后端上无需任何特殊处理即可直接使用

:::tip 何时使用哪种方式
对于简单的 API 密钥和令牌（存储在 `~/.hermes/.env` 中的字符串），请使用 `required_environment_variables`。对于 OAuth 令牌文件、客户端密钥、服务账户 JSON、证书或任何以文件形式存储在磁盘上的凭证，请使用 `required_credential_files`。
:::

请参阅 `skills/productivity/google-workspace/SKILL.md` 以获取同时使用这两者的完整示例。

## 技能指南

### 无外部依赖

优先使用 Python 标准库、curl 和现有的 Hermes 工具（`web_extract`、`terminal`、`read_file`）。如果需要依赖项，请在技能中记录安装步骤。

### 渐进式披露

将最常用的工作流程放在最前面。边缘情况和高级用法放在底部。这可以确保常见任务保持较低的 token 消耗。

### 包含辅助脚本

对于 XML/JSON 解析或复杂逻辑，请在 `scripts/` 中包含辅助脚本——不要指望 LLM 每次都能内联编写解析器。

#### 在 SKILL.md 中引用内置脚本

当技能加载时，激活消息会将绝对技能目录暴露为 `[Skill directory: /abs/path]`，并在 SKILL.md 正文的任何位置替换两个模板令牌：

| 令牌 | 替换为 |
|---|---|
| `${HERMES_SKILL_DIR}` | 技能目录的绝对路径 |
| `${HERMES_SESSION_ID}` | 当前会话 ID（若无会话则保留原样） |

因此，SKILL.md 可以指示智能体直接运行内置脚本：

```markdown
要分析输入内容，请运行：

    node ${HERMES_SKILL_DIR}/scripts/analyse.js <input>
```

智能体看到替换后的绝对路径，并使用现成的命令调用 `terminal` 工具——无需路径计算，也无需额外的 `skill_view` 往返。在 `config.yaml` 中设置 `skills.template_vars: false` 可全局禁用此替换。

#### 内联 Shell 代码片段（可选启用）

技能还可以在 SKILL.md 正文中嵌入内联 Shell 代码片段，格式为 `` !`cmd` ``。启用后，每个代码片段的 stdout 会在智能体读取前内联到消息中，从而使技能能够注入动态上下文：

```markdown
当前日期：!`date -u +%Y-%m-%d`
Git 分支：!`git -C ${HERMES_SKILL_DIR} rev-parse --abbrev-ref HEAD`
```

此功能**默认关闭**——SKILL.md 中的任何代码片段都会在主机上运行而无需审批，因此仅对你信任的技能源启用它：

```yaml
# config.yaml
skills:
  inline_shell: true
  inline_shell_timeout: 10    # 每个代码片段的超时时间（秒）
```

代码片段以技能目录作为工作目录运行，输出限制为 4000 个字符。失败情况（超时、非零退出）会显示为简短的 `[inline-shell error: ...]` 标记，而不会破坏整个技能。

### 测试它

运行该技能并验证智能体是否正确遵循了指令：

```bash
hermes chat --toolsets skills -q "Use the X skill to do Y"
```

## 技能应放置在哪里？

内置技能（位于 `skills/`）会随每次 Hermes 安装一起提供。它们应该对**大多数用户具有广泛的实用性**：

- 文档处理、网页研究、常见开发工作流、系统管理
- 被广泛人群定期使用

如果你的技能是官方的且有用，但并非 universally needed（例如付费服务集成、重量级依赖），请将其放入 **`optional-skills/`** ——它会随仓库一起提供，可通过 `hermes skills browse` 发现（标记为“official”），并以内置信任级别安装。

如果你的技能是专业化的、社区贡献的或小众的，它更适合放入**技能中心（Skills Hub）**——将其上传至注册表并通过 `hermes skills install` 分享。

## 发布技能

### 发布到技能中心

```bash
hermes skills publish skills/my-skill --to github --repo owner/repo
```

### 发布到自定义仓库

将你的仓库添加为 tap：

```bash
hermes skills tap add owner/repo
```

用户随后可以从你的仓库中搜索和安装。

## 安全扫描

所有通过中心安装的技能都会经过安全扫描器检查，内容包括：

- 数据外泄模式
- 提示词注入尝试
- 破坏性命令
- Shell 注入

信任级别：
- `builtin` — 随 Hermes 内置（始终受信任）
- `official` — 来自仓库中的 `optional-skills/`（内置信任，无第三方警告）
- `trusted` — 来自 openai/skills、anthropics/skills
- `community` — 非危险发现可通过 `--force` 覆盖；危险判定仍保持拦截

Hermes 现在可以通过多种外部发现模型使用第三方技能：
- 直接 GitHub 标识符（例如 `openai/skills/k8s`）
- `skills.sh` 标识符（例如 `skills-sh/vercel-labs/json-render/json-render-react`）
- 从 `/.well-known/skills/index.json` 提供服务的标准端点

如果你希望你的技能在不依赖 GitHub 特定安装程序的情况下也能被发现，除了发布在仓库或市场中外，还可以考虑通过一个标准端点（well-known endpoint）提供服务。