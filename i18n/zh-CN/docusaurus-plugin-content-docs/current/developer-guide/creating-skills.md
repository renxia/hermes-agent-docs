---
sidebar_position: 3
title: "创建技能"
description: "如何为 Hermes 智能体创建技能——SKILL.md 格式、指南及发布"
---

# 创建技能

技能是为 Hermes 智能体添加新功能的首选方式。它们比工具更容易创建，无需对智能体进行代码修改，且能与社区共享。

## 应该使用技能还是工具？

当满足以下条件时，请将其设为**技能**：
- 该功能可通过指令 + shell 命令 + 现有工具实现
- 它封装了智能体可通过 `terminal` 或 `web_extract` 调用的外部 CLI 或 API
- 它不需要将自定义 Python 集成或 API 密钥管理内置到智能体中
- 示例：arXiv 搜索、Git 工作流、Docker 管理、PDF 处理、通过 CLI 工具收发邮件

当满足以下条件时，请将其设为**工具**：
- 它需要与 API 密钥、认证流程或多组件配置进行端到端集成
- 它需要每次精确执行的自定义处理逻辑
- 它处理二进制数据、流式传输或实时事件
- 示例：浏览器自动化、文本转语音、视觉分析

## 技能目录结构

捆绑的技能位于 `skills/` 目录下，按类别组织。官方可选技能在 `optional-skills/` 中采用相同结构：

```text
skills/
├── research/
│   └── arxiv/
│       ├── SKILL.md              # 必需：主指令
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
description: 简要描述（在技能搜索结果中显示）
version: 1.0.0
author: 你的名字
license: MIT
platforms: [macos, linux]          # 可选 — 限制为特定操作系统平台
                                   #   有效值：macos, linux, windows
                                   #   省略则在所有平台加载（默认）
metadata:
  hermes:
    tags: [类别, 子类别, 关键词]
    related_skills: [其他技能名称]
    requires_toolsets: [web]            # 可选 — 仅在这些工具集激活时显示
    requires_tools: [web_search]        # 可选 — 仅在这些工具可用时显示
    fallback_for_toolsets: [browser]    # 可选 — 在这些工具集激活时隐藏
    fallback_for_tools: [browser_navigate]  # 可选 — 在这些工具存在时隐藏
    config:                              # 可选 — 技能所需的 config.yaml 设置
      - key: my.setting
        description: "此设置控制的内容"
        default: "合理的默认值"
        prompt: "设置提示显示"
required_environment_variables:          # 可选 — 技能所需的环境变量
  - name: MY_API_KEY
    prompt: "输入你的 API 密钥"
    help: "从 https://example.com 获取"
    required_for: "API 访问"
---

# 技能标题

简要介绍。

## 何时使用
触发条件 — 智能体何时应加载此技能？

## 快速参考
常用命令或 API 调用的表格。

## 步骤
智能体遵循的分步指令。

## 注意事项
已知的失败模式及处理方法。

## 验证
智能体如何确认操作成功。
```

### 平台特定技能

技能可以使用 `platforms` 字段限制在特定操作系统上运行：

```yaml
platforms: [macos]            # 仅限 macOS（例如 iMessage, Apple Reminders）
platforms: [macos, linux]     # macOS 和 Linux
platforms: [windows]          # 仅限 Windows
```

设置后，该技能将在不兼容的平台上自动从系统提示、`skills_list()` 和斜杠命令中隐藏。如果省略或为空，该技能将在所有平台加载（向后兼容）。

### 技能条件激活

技能可以声明对特定工具或工具集的依赖。这控制了在给定会话中技能是否出现在系统提示中。

```yaml
metadata:
  hermes:
    requires_toolsets: [web]           # 如果 web 工具集未激活则隐藏
    requires_tools: [web_search]       # 如果 web_search 工具不可用则隐藏
    fallback_for_toolsets: [browser]   # 如果 browser 工具集已激活则隐藏
    fallback_for_tools: [browser_navigate]  # 如果 browser_navigate 工具可用则隐藏
```

| 字段 | 行为 |
|-------|----------|
| `requires_toolsets` | 当列出的任何工具集**不可用**时，技能被**隐藏** |
| `requires_tools` | 当列出的任何工具**不可用**时，技能被**隐藏** |
| `fallback_for_toolsets` | 当列出的任何工具集**可用**时，技能被**隐藏** |
| `fallback_for_tools` | 当列出的任何工具**可用**时，技能被**隐藏** |

**`fallback_for_*` 的使用场景：** 创建一个在主要工具不可用时作为变通方案的技能。例如，一个带有 `fallback_for_tools: [web_search]` 的 `duckduckgo-search` 技能，仅在 web 搜索工具（需要 API 密钥）未配置时显示。

**`requires_*` 的使用场景：** 创建一个仅在特定工具存在时才有意义的技能。例如，一个带有 `requires_toolsets: [web]` 的网页抓取工作流技能，在 web 工具被禁用时不会干扰提示。

### 环境变量要求

技能可以声明它们需要的环境变量。当通过 `skill_view` 加载技能时，其必需的变量会自动注册，以便在沙箱执行环境（终端、execute_code）中透传。

```yaml
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: "Tenor API 密钥"               # 提示用户时显示
    help: "在 https://tenor.com 获取你的密钥"  # 帮助文本或 URL
    required_for: "GIF 搜索功能"   # 哪个功能需要此变量
```

每个条目支持：
- `name`（必需）— 环境变量名称
- `prompt`（可选）— 向用户询问该值时的提示文本
- `help`（可选）— 用于获取该值的帮助文本或 URL
- `required_for`（可选）— 描述哪个功能需要此变量

用户也可以在 `config.yaml` 中手动配置透传变量：

```yaml
terminal:
  env_passthrough:
    - MY_CUSTOM_VAR
    - ANOTHER_VAR
```

参见 `skills/apple/` 获取仅限 macOS 技能的示例。

## 加载时的安全设置

当技能需要 API 密钥或令牌时，使用 `required_environment_variables`。缺失的值**不会**隐藏该技能使其无法被发现。相反，当在本地 CLI 中加载该技能时，Hermes 会安全地提示输入。

```yaml
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: Tenor API 密钥
    help: 从 https://developers.google.com/tenor 获取密钥
    required_for: 完整功能
```

用户可以跳过设置并继续加载该技能。Hermes 永远不会向模型暴露原始秘密值。网关和消息传递会话会显示本地设置指导，而不是在运行中收集秘密。

:::tip 沙箱透传
当你的技能被加载时，任何已设置且已声明的 `required_environment_variables` 都**会自动透传**到 `execute_code` 和 `terminal` 沙箱中 — 包括 Docker 和 Modal 等远程后端。你的技能脚本可以访问 `$TENOR_API_KEY`（或在 Python 中访问 `os.environ["TENOR_API_KEY"]`），而用户无需进行任何额外配置。详情请参见 [环境变量透传](/user-guide/security#environment-variable-passthrough)。
:::

旧版 `prerequisites.env_vars` 仍然作为向后兼容别名受支持。

### 配置设置 (config.yaml)

技能可以声明非敏感设置，这些设置存储在 `config.yaml` 的 `skills.config` 命名空间下。与环境变量（存储在 `.env` 中的秘密）不同，配置设置用于路径、偏好和其他非敏感值。

```yaml
metadata:
  hermes:
    config:
      - key: myplugin.path
        description: 插件数据目录的路径
        default: "~/myplugin-data"
        prompt: 插件数据目录路径
      - key: myplugin.domain
        description: 插件运行的域
        default: ""
        prompt: 插件域（例如，AI/ML 研究）
```

每个条目支持：
- `key`（必需）— 设置的点分路径（例如 `myplugin.path`）
- `description`（必需）— 解释该设置控制什么
- `default`（可选）— 如果用户未配置时的默认值
- `prompt`（可选）— 在 `hermes config migrate` 期间显示的提示文本；回退到 `description`

**工作原理：**

1. **存储：** 值写入 `config.yaml` 下的 `skills.config.<key>`：
   ```yaml
   skills:
     config:
       myplugin:
         path: ~/my-data
   ```

2. **发现：** `hermes config migrate` 扫描所有已启用的技能，找到未配置的设置，并提示用户。设置也会出现在 `hermes config show` 的 "技能设置" 下。

3. **运行时注入：** 当技能加载时，其配置值被解析并附加到技能消息中：
   ```
   [技能配置（来自 ~/.hermes/config.yaml）：
     myplugin.path = /home/user/my-data
   ]
   ```
   智能体可以看到已配置的值，而无需自己读取 `config.yaml`。

4. **手动设置：** 用户也可以直接设置值：
   ```bash
   hermes config set skills.config.myplugin.path ~/my-data
   ```

:::tip 何时使用哪种方式
对于 API 密钥、令牌和其他**秘密**，使用 `required_environment_variables`（存储在 `~/.hermes/.env`，永远不向模型显示）。对于**路径、偏好和非敏感设置**，使用 `config`（存储在 `config.yaml`，在配置显示中可见）。
:::

### 凭证文件要求（OAuth 令牌等）

使用 OAuth 或基于文件的凭证的技能可以声明需要挂载到远程沙箱中的文件。这是针对存储为**文件**的凭证（不是环境变量） — 通常是设置脚本生成的 OAuth 令牌文件。

```yaml
required_credential_files:
  - path: google_token.json
    description: Google OAuth2 令牌（由设置脚本创建）
  - path: google_client_secret.json
    description: Google OAuth2 客户端凭证
```

每个条目支持：
- `path`（必需）— 相对于 `~/.hermes/` 的文件路径
- `description`（可选）— 解释文件是什么以及如何创建

加载时，Hermes 会检查这些文件是否存在。缺失的文件会触发 `setup_needed`。现有文件会被自动：
- 作为只读绑定挂载**挂载到 Docker** 容器中
- **同步到 Modal** 沙箱中（在创建时以及每次命令前，因此会话中途 OAuth 仍然有效）
- 在**本地**后端上无需任何特殊处理即可使用

:::tip 何时使用哪种方式
对于简单的 API 密钥和令牌（存储在 `~/.hermes/.env` 中的字符串），使用 `required_environment_variables`。对于 OAuth 令牌文件、客户端密钥、服务账户 JSON、证书或任何存储在磁盘上的文件形式的凭证，使用 `required_credential_files`。
:::

参见 `skills/productivity/google-workspace/SKILL.md` 获取同时使用两者的完整示例。

```markdown
---
title: 技能指南
description: 为 Hermes 智能体创建和发布技能
slug: skills-guidelines
---

## 技能指南

### 无外部依赖

优先使用 Python 标准库、curl 和现有的 Hermes 工具（`web_extract`、`terminal`、`read_file`）。如果需要依赖项，请在技能中记录安装步骤。

### 渐进式披露

将最常见工作流程放在最前面。边缘情况和高级用法放在底部。这可以降低常见任务的 token 使用量。

### 包含辅助脚本

对于 XML/JSON 解析或复杂逻辑，在 `scripts/` 目录中包含辅助脚本——不要期望 LLM 每次都内联编写解析器。

### 将媒体作为文档交付（`[[as_document]]`）

如果你的技能生成高分辨率截图、图表或任何有损预览压缩会损害质量的图像——请在响应中的某处（通常是最后一行）发出指令字面量 `[[as_document]]`。网关会剥离该指令，并将该响应中提取的每个媒体路径作为可下载文件附件交付，而不是作为内联图像气泡。完整语义请参见[技能输出和媒体交付](../user-guide/features/skills.md#skill-output-and-media-delivery)。

#### 在 SKILL.md 中引用捆绑脚本

当一个技能被加载时，激活消息会将绝对技能目录暴露为 `[Skill directory: /abs/path]`，并且还会在 SKILL.md 正文的任何位置替换两个模板令牌：

| 令牌 | 替换为 |
|---|---|
| `${HERMES_SKILL_DIR}` | 技能目录的绝对路径 |
| `${HERMES_SESSION_ID}` | 活动会话 ID（如果没有会话则保留原样） |

因此，SKILL.md 可以直接告诉智能体运行一个捆绑的脚本：

```markdown
要分析输入，请运行：

    node ${HERMES_SKILL_DIR}/scripts/analyse.js <input>
```

智能体看到替换后的绝对路径，并使用一个准备运行的命令调用 `terminal` 工具——无需路径计算，无需额外的 `skill_view` 往返。使用 `config.yaml` 中的 `skills.template_vars: false` 可以全局禁用替换。

#### 内联 shell 片段（选择加入）

技能还可以在 SKILL.md 正文中嵌入写成 `` !`cmd` `` 的内联 shell 片段。启用后，每个片段的标准输出会在智能体读取之前内联到消息中，因此技能可以注入动态上下文：

```markdown
当前日期: !`date -u +%Y-%m-%d`
Git 分支: !`git -C ${HERMES_SKILL_DIR} rev-parse --abbrev-ref HEAD`
```

此功能**默认关闭**——SKILL.md 中的任何片段都在主机上运行，无需批准，因此只对你信任的技能源启用：

```yaml
# config.yaml
skills:
  inline_shell: true
  inline_shell_timeout: 10   # 每个片段的超时时间（秒）
```

片段以技能目录作为工作目录运行，输出上限为 4000 个字符。失败（超时、非零退出）会显示为一个简短的 `[inline-shell error: ...]` 标记，而不会破坏整个技能。

### 测试它

运行该技能并验证智能体是否正确遵循了说明：

```bash
hermes chat --toolsets skills -q "使用 X 技能来完成 Y"
```

## 技能应该放在哪里？

捆绑技能（在 `skills/` 目录中）随每次 Hermes 安装一起提供。它们应该**对大多数用户普遍有用**：

- 文档处理、网络研究、常见开发工作流、系统管理
- 被广泛范围的人群定期使用

如果你的技能是官方的且有用，但不是普遍需要的（例如，付费服务集成、重量级依赖项），请将其放在 **`optional-skills/`** 中——它随仓库一起提供，可通过 `hermes skills browse` 发现（标记为“官方”），并以内置信任进行安装。

如果你的技能是专门的、社区贡献的或小众的，它更适合放在 **技能中心**——将其上传到注册表并通过 `hermes skills install` 共享。

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

然后用户可以从你的仓库中搜索和安装。

## 安全扫描

所有通过中心安装的技能都会经过安全扫描器检查：

- 数据泄露模式
- 提示注入尝试
- 破坏性命令
- Shell 注入

信任级别：
- `builtin` — 随 Hermes 一起提供（始终受信任）
- `official` — 来自仓库中的 `optional-skills/`（内置信任，无第三方警告）
- `trusted` — 来自 openai/skills、anthropics/skills、huggingface/skills
- `community` — 非危险发现可以使用 `--force` 覆盖；`dangerous` 判定结果仍然被阻止

Hermes 现在可以从多个外部发现模型获取第三方技能：
- 直接的 GitHub 标识符（例如 `openai/skills/k8s`）
- `skills.sh` 标识符（例如 `skills-sh/vercel-labs/json-render/json-render-react`）
- 从 `/.well-known/skills/index.json` 提供的知名端点

如果你希望你的技能无需特定于 GitHub 的安装程序即可被发现，请考虑除了在仓库或市场中发布之外，还在知名端点上提供它们。
```