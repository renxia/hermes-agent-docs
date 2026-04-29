---
sidebar_position: 12
title: "使用技能"
description: "查找、安装、使用并创建技能——按需获取知识，教 Hermes 掌握新的工作流"
---

# 使用技能

技能是按需提供的知识文档，用于指导 Hermes 如何处理特定任务——从生成 ASCII 艺术到管理 GitHub PR。本指南将引导你日常使用技能。

如需完整的技术参考，请参阅[技能系统](/docs/user-guide/features/skills)。

---

## 查找技能

每次 Hermes 安装都会附带捆绑技能。查看有哪些可用技能：

```bash
# 在任何聊天会话中：
/skills

# 或通过 CLI：
hermes skills list
```

这会显示一个包含名称和描述的简洁列表：

```
ascii-art         使用 pyfiglet、cowsay、boxes 等生成 ASCII 艺术
arxiv             从 arXiv 搜索并检索学术论文
github-pr-workflow 完整的 PR 生命周期——创建分支、提交...
plan              规划模式——检查上下文，编写 markdown...
excalidraw        使用 Excalidraw 创建手绘风格图表
```

### 搜索技能

```bash
# 按关键词搜索
/skills search docker
/skills search music
```

### 技能中心

官方可选技能（默认未激活的较重或小众技能）可通过技能中心获取：

```bash
# 浏览官方可选技能
/skills browse

# 在技能中心搜索
/skills search blockchain
```

---

## 使用技能

每个已安装的技能都会自动成为一个斜杠命令。只需输入其名称：

```bash
# 加载技能并给它一个任务
/ascii-art 制作一个写着 "HELLO WORLD" 的横幅
/plan 为待办事项应用设计一个 REST API
/github-pr-workflow 为身份验证重构创建一个 PR

# 仅输入技能名称（无任务）会加载它，并让你描述所需内容
/excalidraw
```

你也可以通过自然对话触发技能——要求 Hermes 使用特定技能，它会通过 `skill_view` 工具加载该技能。

### 渐进式披露

技能采用一种节省 token 的加载模式。智能体不会一次性加载所有内容：

1. **`skills_list()`** —— 所有技能的简洁列表（约 3k token）。在会话开始时加载。
2. **`skill_view(name)`** —— 单个技能的完整 SKILL.md 内容。当智能体决定需要该技能时加载。
3. **`skill_view(name, file_path)`** —— 技能内的特定参考文件。仅在需要时加载。

这意味着技能只有在实际使用时才会消耗 token。

---

## 从技能中心安装

官方可选技能随 Hermes 一起提供，但默认未激活。请显式安装它们：

```bash
# 安装官方可选技能
hermes skills install official/research/arxiv

# 在聊天会话中从技能中心安装
/skills install official/creative/songwriting-and-ai-music

# 直接从任意 HTTP(S) URL 安装单个 SKILL.md 文件
hermes skills install https://sharethis.chat/SKILL.md
/skills install https://example.com/SKILL.md --name my-skill
```

会发生什么：
1. 技能目录被复制到 `~/.hermes/skills/`
2. 它会出现在你的 `skills_list` 输出中
3. 它会变成一个斜杠命令

:::tip
已安装的技能在新会话中生效。如果你希望它在当前会话中可用，请使用 `/reset` 重新开始，或添加 `--now` 立即使提示缓存失效（下次交互会消耗更多 token）。
:::

### 验证安装

```bash
# 检查它是否存在
hermes skills list | grep arxiv

# 或在聊天中
/skills search arxiv
```

---

## 插件提供的技能

插件可以使用命名空间名称（`plugin:skill`）捆绑自己的技能。这可以防止与内置技能发生名称冲突。

```bash
# 通过其限定名称加载插件技能
skill_view("superpowers:writing-plans")

# 同名基础名称的内置技能不受影响
skill_view("writing-plans")
```

插件技能**不会**列在系统提示中，也不会出现在 `skills_list` 中。它们是选择加入的——当你知道某个插件提供了某个技能时，才显式加载它。加载后，智能体会看到一个横幅，列出来自同一插件的其他技能。

关于如何在自己的插件中捆绑技能，请参阅[构建 Hermes 插件 → 捆绑技能](/docs/guides/build-a-hermes-plugin#bundle-skills)。

---

## 配置技能设置

某些技能在其 frontmatter 中声明了所需的配置：

```yaml
metadata:
  hermes:
    config:
      - key: tenor.api_key
        description: "用于 GIF 搜索的 Tenor API 密钥"
        prompt: "请输入你的 Tenor API 密钥"
        url: "https://developers.google.com/tenor/guides/quickstart"
```

当首次加载带有配置的技能时，Hermes 会提示你输入这些值。它们会被存储在 `config.yaml` 的 `skills.config.*` 下。

通过 CLI 管理技能配置：

```bash
# 为特定技能进行交互式配置
hermes skills config gif-search

# 查看所有技能配置
hermes config get skills.config
```

---

## 创建你自己的技能

技能只是带有 YAML frontmatter 的 markdown 文件。创建一个技能只需不到五分钟。

### 1. 创建目录

```bash
mkdir -p ~/.hermes/skills/my-category/my-skill
```

### 2. 编写 SKILL.md

```markdown title="~/.hermes/skills/my-category/my-skill/SKILL.md"
---
name: my-skill
description: 此技能功能的简要描述
version: 1.0.0
metadata:
  hermes:
    tags: [my-tag, automation]
    category: my-category
---

# 我的技能

## 何时使用
当用户询问[特定主题]或需要[特定任务]时，使用此技能。

## 流程
1. 首先，检查[先决条件]是否可用
2. 运行 `command --with-flags`
3. 解析输出并呈现结果

## 陷阱
- 常见错误：[描述]。修复方法：[解决方案]
- 注意[边缘情况]

## 验证
运行 `check-command` 以确认结果正确。
```

### 3. 添加参考文件（可选）

技能可以包含支持文件，智能体可按需加载：

```
my-skill/
├── SKILL.md                    # 主技能文档
├── references/
│   ├── api-docs.md             # 智能体可查阅的 API 参考
│   └── examples.md             # 示例输入/输出
├── templates/
│   └── config.yaml             # 智能体可使用的模板文件
└── scripts/
    └── setup.sh                # 智能体可执行的脚本
```

在你的 SKILL.md 中引用这些文件：

```markdown
如需 API 详细信息，请加载参考：`skill_view("my-skill", "references/api-docs.md")`
```

### 4. 测试它

启动新会话并尝试你的技能：

```bash
hermes chat -q "/my-skill help me with the thing"
```

该技能会自动出现——无需注册。将其放入 `~/.hermes/skills/` 中即可生效。

:::info
智能体也可以使用 `skill_manage` 自行创建和更新技能。在解决复杂问题后，Hermes 可能会建议将方法保存为技能以备下次使用。
:::

---

## 按平台管理技能

控制哪些技能在哪些平台上可用：

```bash
hermes skills
```

这会打开一个交互式 TUI，你可以在其中按平台（CLI、Telegram、Discord 等）启用或禁用技能。当你希望某些技能仅在特定上下文中可用时非常有用——例如，将开发技能从 Telegram 中移除。

---

## 技能 vs 记忆

两者在会话之间都是持久的，但它们的用途不同：

| | 技能 | 记忆 |
|---|---|---|
| **是什么** | 程序性知识——如何做事情 | 事实性知识——事情是什么 |
| **何时使用** | 按需加载，仅在相关时 | 自动注入每个会话 |
| **大小** | 可能很大（数百行） | 应保持简洁（仅关键事实） |
| **成本** | 加载前零 token | 小而恒定的 token 成本 |
| **示例** | "如何部署到 Kubernetes" | "用户偏好深色模式，居住在 PST 时区" |
| **谁创建** | 你、智能体或从技能中心安装 | 智能体，基于对话 |

**经验法则：** 如果你会将其放入参考文档中，那就是技能。如果你会将其贴在便利贴上，那就是记忆。

---

## 提示

**保持技能专注。** 试图涵盖“所有 DevOps”的技能会太长且太模糊。涵盖“将 Python 应用部署到 Fly.io”的技能则足够具体，才能真正有用。

**让智能体创建技能。** 在复杂的 multistep 任务之后，Hermes 通常会建议将方法保存为技能。同意它——这些由智能体创建的技能会捕获确切的工作流，包括沿途发现的陷阱。

**使用分类。** 将技能组织到子目录中（`~/.hermes/skills/devops/`、`~/.hermes/skills/research/` 等）。这有助于保持列表的可管理性，并帮助智能体更快地找到相关技能。

**当技能过时时要更新它们。** 如果你使用某个技能并遇到其未涵盖的问题，请告诉 Hermes 用你学到的内容更新该技能。未维护的技能会变成负担。

---

*如需完整的技能参考——frontmatter 字段、条件激活、外部目录等，请参阅[技能系统](/docs/user-guide/features/skills)。*