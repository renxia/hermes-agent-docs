---
sidebar_position: 3
title: "Creating Skills"
description: "How to create skills for Hermes Agent — SKILL.md format, guidelines, and publishing"
---

# 创建技能

技能是为 Hermes 智能体添加新能力的首选方式。它们比工具更容易创建，无需对智能体进行代码修改，并且可以与社区共享。

## 应该是技能还是工具？

在以下情况下创建**技能**：
- 该能力可以表示为指令 + Shell 命令 + 现有工具
- 它封装了一个外部 CLI 或 API，智能体可以通过 `terminal` 或 `web_extract` 调用
- 它不需要自定义 Python 集成或内嵌到智能体中的 API 密钥管理
- 示例：arXiv 搜索、Git 工作流、Docker 管理、PDF 处理、通过 CLI 工具发送邮件

在以下情况下创建**工具**：
- 它需要与 API 密钥、认证流程或多组件配置的端到端集成
- 它需要每次都能精确执行的自定义处理逻辑
- 它处理二进制数据、流式数据或实时事件
- 示例：浏览器自动化、文本转语音、视觉分析

## 技能目录结构

内置技能按类别存放在 `skills/` 目录中。官方可选技能使用相同的结构存放在 `optional-skills/` 目录中：

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
description: 简要描述（显示在技能搜索结果中）
version: 1.0.0
author: Your Name
license: MIT
platforms: [macos, linux]          # 可选 — 限制在特定操作系统平台上
                                   #   有效值：macos, linux, windows
                                   #   省略则默认在所有平台上加载
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
        prompt: "设置的显示提示"
    blueprint:                              # 可选 — 将此技能标记为可运行的自动化
      schedule: "0 9 * * *"              #   cron 表达式 / "every 2h" / ISO 时间戳
      deliver: origin                    #   可选（默认 origin）
      prompt: "每次运行的任务指令"  # 可选
      no_agent: false                    # 可选
required_environment_variables:          # 可选 — 技能需要的环境变量
  - name: MY_API_KEY
    prompt: "输入你的 API 密钥"
    help: "从 https://example.com 获取"
    required_for: "API 访问"
---

# 技能标题

简要介绍。

## 使用时机
触发条件 — 智能体应在何时加载此技能？

## 快速参考
常用命令或 API 调用的表格。

## 操作步骤
智能体遵循的分步指令。

## 注意事项
已知的故障模式及处理方法。

## 验证方式
智能体如何确认操作成功。
```

### 平台特定技能

技能可以使用 `platforms` 字段将自己限制在特定的操作系统上：

```yaml
platforms: [macos]            # 仅 macOS（例如 iMessage、Apple 提醒事项）
platforms: [macos, linux]     # macOS 和 Linux
platforms: [windows]          # 仅 Windows
```

设置后，该技能会在不兼容的平台上自动从系统提示、`skills_list()` 和斜杠命令中隐藏。如果省略或为空，技能将在所有平台上加载（向后兼容）。

### 条件性技能激活

技能可以声明对特定工具或工具集的依赖。这控制了该技能是否出现在给定会话的系统提示中。

```yaml
metadata:
  hermes:
    requires_toolsets: [web]           # 当 web 工具集未激活时隐藏
    requires_tools: [web_search]       # 当 web_search 工具不可用时隐藏
    fallback_for_toolsets: [browser]   # 当浏览器工具集已激活时隐藏
    fallback_for_tools: [browser_navigate]  # 当 browser_navigate 可用时隐藏
```

| 字段 | 行为 |
|-------|----------|
| `requires_toolsets` | 当任何列出的工具集**不可用**时，技能**隐藏** |
| `requires_tools` | 当任何列出的工具**不可用**时，技能**隐藏** |
| `fallback_for_toolsets` | 当任何列出的工具集**可用**时，技能**隐藏** |
| `fallback_for_tools` | 当任何列出的工具**可用**时，技能**隐藏** |

**`fallback_for_*` 的用例：** 创建一个在主要工具不可用时作为替代方案的技能。例如，带有 `fallback_for_tools: [web_search]` 的 `duckduckgo-search` 技能仅在网络搜索工具（需要 API 密钥）未配置时显示。

**`requires_*` 的用例：** 创建一个仅在特定工具存在时才有意义的技能。例如，带有 `requires_toolsets: [web]` 的网络抓取工作流技能在网络工具被禁用时不会干扰提示。

### 环境变量要求

技能可以声明其需要的环境变量。当技能通过 `skill_view` 加载时，其需要的变量会自动注册，以便传递到沙盒执行环境（终端、execute_code）中。

```yaml
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: "Tenor API 密钥"               # 提示用户时显示
    help: "从 https://tenor.com 获取你的密钥"  # 帮助文本或 URL
    required_for: "GIF 搜索功能"   # 哪个功能需要此变量
```

每个条目支持：
- `name`（必需）— 环境变量名称
- `prompt`（可选）— 向用户请求值时的提示文本
- `help`（可选）— 获取值的帮助文本或 URL
- `required_for`（可选）— 描述哪个功能需要此变量

用户也可以在 `config.yaml` 中手动配置传递变量：

```yaml
terminal:
  env_passthrough:
    - MY_CUSTOM_VAR
    - ANOTHER_VAR
```

有关仅 macOS 技能的示例，请参见 `skills/apple/`。

## 加载时的安全设置

当技能需要 API 密钥或令牌时，使用 `required_environment_variables`。缺失的值**不会**在发现过程中隐藏该技能。相反，当技能在本地 CLI 中加载时，Hermes 会安全地提示用户输入。

```yaml
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: Tenor API 密钥
    help: 从 https://developers.google.com/tenor 获取密钥
    required_for: 完整功能
```

用户可以跳过设置并继续加载技能。Hermes 绝不会将原始密钥值暴露给模型。网关和消息会话会显示本地设置指导，而不是在通道中收集密钥。

:::tip 沙盒传递
当你的技能被加载时，任何已设置的 `required_environment_variables` 都会**自动传递**到 `execute_code` 和 `terminal` 沙盒 — 包括 Docker 和 Modal 等远程后端。你的技能脚本可以访问 `$TENOR_API_KEY`（或在 Python 中访问 `os.environ["TENOR_API_KEY"]`），无需用户进行任何额外配置。详情请参阅[环境变量传递](/user-guide/security#environment-variable-passthrough)。
:::

旧版的 `prerequisites.env_vars` 仍作为向后兼容的别名受支持。

### 配置设置 (config.yaml)

技能可以声明非敏感设置，这些设置存储在 `config.yaml` 的 `skills.config` 命名空间下。与环境变量（存储在 `.env` 中的密钥）不同，配置设置用于路径、偏好和其他非敏感值。

```yaml
metadata:
  hermes:
    config:
      - key: myplugin.path
        description: 插件数据目录的路径
        default: "~/myplugin-data"
        prompt: 插件数据目录路径
      - key: myplugin.domain
        description: 插件操作的域名
        default: ""
        prompt: 插件域名（例如 AI/ML 研究）
```

每个条目支持：
- `key`（必需）— 设置的点路径（例如 `myplugin.path`）
- `description`（必需）— 解释设置控制的内容
- `default`（可选）— 用户未配置时的默认值
- `prompt`（可选）— 在 `hermes config migrate` 期间显示的提示文本；回退到 `description`

**工作原理：**

1. **存储：** 值写入 `config.yaml` 的 `skills.config.<key>` 下：
   ```yaml
   skills:
     config:
       myplugin:
         path: ~/my-data
   ```

2. **发现：** `hermes config migrate` 扫描所有已启用的技能，找到未配置的设置，并提示用户。设置也会出现在 `hermes config show` 的"技能设置"下。

3. **运行时注入：** 当技能加载时，其配置值会被解析并附加到技能消息中：
   ```
   [技能配置（来自 ~/.hermes/config.yaml）：
     myplugin.path = /home/user/my-data
   ]
   ```
   智能体可以看到配置值，无需自己读取 `config.yaml`。

4. **手动设置：** 用户也可以直接设置值：
   ```bash
   hermes config set skills.config.myplugin.path ~/my-data
   ```

:::tip 何时使用哪种方式
对 API 密钥、令牌和其他**密钥**（存储在 `~/.hermes/.env` 中，不暴露给模型）使用 `required_environment_variables`。对**路径、偏好和非敏感设置**（存储在 `config.yaml` 中，在配置显示中可见）使用 `config`。
:::

### 凭据文件要求（OAuth 令牌等）

使用 OAuth 或基于文件的凭据的技能可以声明需要挂载到远程沙盒中的文件。这适用于存储为**文件**（而非环境变量）的凭据 — 通常是由设置脚本生成的 OAuth 令牌文件。

```yaml
required_credential_files:
  - path: google_token.json
    description: Google OAuth2 令牌（由设置脚本创建）
  - path: google_client_secret.json
    description: Google OAuth2 客户端凭据
```

每个条目支持：
- `path`（必需）— 相对于 `~/.hermes/` 的文件路径
- `description`（可选）— 解释文件是什么以及如何创建

加载时，Hermes 会检查这些文件是否存在。缺失的文件会触发 `setup_needed`。现有文件会自动：
- **挂载到 Docker** 容器中作为只读绑定挂载
- **同步到 Modal** 沙盒中（在创建时及每次命令之前同步，以便会话中途的 OAuth 正常工作）
- 在**本地**后端上无需任何特殊处理即可使用

:::tip 何时使用哪种方式
对简单的 API 密钥和令牌（存储在 `~/.hermes/.env` 中的字符串）使用 `required_environment_variables`。对 OAuth 令牌文件、客户端密钥、服务账户 JSON、证书或任何作为磁盘文件的凭据使用 `required_credential_files`。
:::

有关同时使用两者的完整示例，请参见 `skills/productivity/google-workspace/SKILL.md`。

## 技能指南

### 无外部依赖

优先使用 Python 标准库、curl 和现有的 Hermes 工具（`web_extract`、`terminal`、`read_file`）。如果需要依赖项，请在技能中记录安装步骤。

### 渐进式展示

将最常见的工作流放在最前面。边缘情况和高级用法放在最底部。这可以在常见任务中保持较低的 token 使用量。

### 包含辅助脚本

对于 XML/JSON 解析或复杂逻辑，请在 `scripts/` 中包含辅助脚本 — 不要期望 LLM 每次都在行内编写解析器。

### 以文档形式交付媒体（`[[as_document]]`）

如果你的技能生成高分辨率截图、图表或任何有损预览压缩会造成损害的图像 — 在响应中的某处（通常是最后一行）发出字面指令 `[[as_document]]`。网关会剥离该指令，并将该响应中所有提取的媒体路径作为可下载的文件附件发送，而不是内联图片气泡。有关完整语义，请参阅[技能输出和媒体交付](../user-guide/features/skills.md#skill-output-and-media-delivery)。

#### 从 SKILL.md 引用捆绑脚本

当技能被加载时，激活消息会将绝对技能目录暴露为 `[Skill directory: /abs/path]`，并在 SKILL.md 正文中的任何位置替换两个模板标记：

| 标记 | 替换为 |
|---|---|
| `${HERMES_SKILL_DIR}` | 技能目录的绝对路径 |
| `${HERMES_SESSION_ID}` | 当前会话 ID（如果没有会话则保留原样） |

因此，SKILL.md 可以指示智能体直接运行捆绑脚本：

```markdown
要分析输入，运行：

    node ${HERMES_SKILL_DIR}/scripts/analyse.js <input>
```

智能体看到替换后的绝对路径，并使用准备好的命令调用 `terminal` 工具 — 无需路径计算，无需额外的 `skill_view` 往返。可以在 `config.yaml` 中使用 `skills.template_vars: false` 全局禁用替换。

#### 内联 shell 代码片段（可选启用）

技能还可以在 SKILL.md 正文中嵌入写作 `` !`cmd` `` 的内联 shell 代码片段。启用后，每个片段的 stdout 会在智能体读取之前内联到消息中，因此技能可以注入动态上下文：

```markdown
当前日期：!`date -u +%Y-%m-%d`
Git 分支：!`git -C ${HERMES_SKILL_DIR} rev-parse --abbrev-ref HEAD`
```

此功能**默认关闭** — SKILL.md 中的任何片段都会在主机上未经批准即运行，因此仅对你信任的技能源启用：

```yaml
# config.yaml
skills:
  inline_shell: true
  inline_shell_timeout: 10   # 每个片段的超时秒数
```

代码片段以技能目录作为工作目录运行，输出限制为 4000 个字符。失败（超时、非零退出）会显示为简短的 `[inline-shell error: ...]` 标记，而不会破坏整个技能。

### 测试

运行技能并验证智能体是否正确遵循指令：

```bash
hermes chat --toolsets skills -q "使用 X 技能完成 Y"
```

## 技能应该放在哪里？

捆绑技能（位于 `skills/`）随每次 Hermes 安装一起发布。它们应该**对大多数用户有广泛用途**：

- 文档处理、网络研究、常见开发工作流、系统管理
- 被广泛的人群定期使用

如果你的技能是官方且有用的，但并非普遍需要（例如付费服务集成、重量级依赖），请将其放入 **`optional-skills/`** —— 它随仓库一起发布，可通过 `hermes skills browse` 发现（标记为"官方"），并以内置信任进行安装。

如果你的技能是专业性的、社区贡献的，或面向小众用户的，则更适合放在 **技能中心（Skills Hub）** —— 上传到注册表并通过 `hermes skills install` 分享。

## 蓝图：同时也是自动化的技能

**蓝图**是一种在其 frontmatter 中额外声明了调度计划的普通技能。添加 `metadata.hermes.blueprint` 块，该技能就变成了可分享、可运行的自动化：

```yaml
metadata:
  hermes:
    tags: [blueprint, email]
    blueprint:
      schedule: "0 8 * * *"     # `blueprint:` 的存在将其标记为可运行
      deliver: telegram          # 可选（默认：来源）
      prompt: "总结我未读的邮件和今天的日程。"  # 可选
      no_agent: false            # 可选
```

因为蓝图**就是**一种技能，它会原封不动地流经整个技能管线 —— 搜索、检查、安装、安全扫描、来源验证、taps、集中索引，以及通过 `hermes skills publish` 进行分享。无需学习新的东西。

**安装蓝图。** 当你安装一个带有 `blueprint:` 块的技能时，Hermes 会将其注册为**建议的定时任务**，而非直接调度它。调度是**可选的** —— 安装永远不会静默创建周期性任务。你通过 `/suggestions` 来审查并接受它：

```bash
hermes skills install owner/morning-brief
# → 蓝图：'morning-brief' 是一个自动化（调度计划 0 8 * * *）。
#   已添加到你的建议中 —— 运行 /suggestions 来调度或忽略它。

# 然后在会话中：
/suggestions             # 列出待处理的建议，带编号
/suggestions accept 1    # 创建定时任务
/suggestions dismiss 1   # 不再提供此建议
```

蓝图是统一的建议定时任务界面的一个**来源** —— 精选的入门自动化和（后续的）使用模式及建议集成也出现在同一位置。参见下面的[建议定时任务](#建议定时任务)。

**分享你构建的自动化。** 通过定时任务加载的蓝图（`hermes cron create --skill <name> ...`）可以导出回 SKILL.md 并像任何其他技能一样发布，因此你为自己调整的自动化可以成为他人一键安装的自动化。

蓝图层不添加任何新的对象类型、存储或传输机制 —— 蓝图是技能，调度计划是定时任务，分享则是现有的发布/tap/索引路径。

## 建议定时任务

Hermes 可以*提议*自动化并通过一键接受，而不是让你手动组装定时任务。每个提案都流经同一个界面 —— `/suggestions` 命令 —— 无论其来源如何：

| 来源 | 触发条件 |
|--------|---------|
| `catalog` | 精选的入门自动化（`/suggestions catalog`）—— 每日简报、重要邮件监控、每周回顾、工作日启动提醒 |
| `blueprint` | 你安装了一个带有 `blueprint:` 块的技能 |
| `usage` | 后台审查注意到一个周期性请求可以由调度计划服务 |
| `integration` | 你连接了一个账户（Gmail、GitHub 等），系统提供明显的自动化建议 |

```bash
/suggestions             # 列出待处理项
/suggestions accept N    # 调度建议 N（创建定时任务）
/suggestions dismiss N   # 忽略它 —— 锁定，永不再次提供
/suggestions catalog     # 添加精选的入门自动化
```

接受建议会调用与 `cronjob` 工具相同的 `cron.jobs.create_job` —— 不存在第二个任务引擎。建议**永远不会**自动创建任务；接受始终是显式操作。被忽略的建议通过稳定键锁定，因此同一提案永远不会再次出现。待处理列表有上限，因此永远不会变成骚扰墙。

**重要邮件监控** 目录条目是 poll→classify→surface 模式：它使用廉价分类器模型（`config.yaml` 中的 `auxiliary.monitor`）对收件箱项目进行评分，仅传递高于紧急阈值的项目，其余情况保持静默。

## 发布技能

### 发布到技能中心（Skills Hub）

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

所有从中心安装的技能都会经过安全扫描器检查以下内容：

- 数据外泄模式
- 提示注入尝试
- 破坏性命令
- Shell 注入

信任级别：
- `builtin` —— 随 Hermes 一起发布（始终受信任）
- `official` —— 来自仓库中的 `optional-skills/`（内置信任，无第三方警告）
- `trusted` —— 来自 openai/skills、anthropics/skills、huggingface/skills
- `community` —— 非危险发现可以用 `--force` 覆盖；`dangerous` 判定仍然被阻止

Hermes 现在可以从多个外部发现模型消费第三方技能：
- 直接的 GitHub 标识符（例如 `openai/skills/k8s`）
- `skills.sh` 标识符（例如 `skills-sh/vercel-labs/json-render/json-render-react`）
- 来自 `/.well-known/skills/index.json` 的知名端点

如果你希望你的技能无需特定的 GitHub 安装器即可被发现，请考虑除了在市场或仓库中发布外，还从知名端点提供它们。