---
sidebar_position: 12
title: "Working with Skills"
description: "Find, install, use, and create skills — on-demand knowledge that teaches Hermes new workflows"
---

# 使用技能

技能是一种按需知识文档，教会 Hermes 如何处理特定任务——从生成 ASCII 艺术到管理 GitHub PR。本指南将带你了解如何在日常工作中使用它们。

有关完整的技术参考，请参阅[技能系统](/user-guide/features/skills)。

---

## 查找技能

每个 Hermes 安装都自带捆绑的技能。查看可用的技能：

```bash
# 在任何聊天会话中：
/skills

# 或从 CLI：
hermes skills list
```

这将显示一个包含名称和描述的紧凑列表：

```
ascii-art         使用 pyfiglet、cowsay、boxes 等生成 ASCII 艺术...
arxiv             搜索并检索 arXiv 上的学术论文...
github-pr-workflow 完整的 PR 生命周期——创建分支、提交...
plan               计划模式——检查上下文，编写 markdown...
excalidraw        使用 Excalidraw 创建手绘风格图表...
```

### 搜索技能

```bash
# 按关键词搜索
/skills search docker
/skills search music
```

### 技能中心

官方可选技能（较重或较偏门的技能默认不激活）可通过技能中心获取：

```bash
# 浏览官方可选技能
/skills browse

# 搜索技能中心
/skills search blockchain
```

---

## 使用技能

每个已安装的技能都会自动成为斜杠命令。只需输入其名称：

```bash
# 加载技能并给出任务
/ascii-art 制作一个写着 "HELLO WORLD" 的横幅
/plan 设计一个待办应用的 REST API
/github-pr-workflow 为认证重构创建一个 PR

# 仅输入技能名称（无任务）即可加载它，然后描述你的需求
/excalidraw
```

你也可以通过自然对话触发技能——要求 Hermes 使用某个特定技能，它会通过 `skill_view` 工具加载该技能。

### 渐进式加载

技能采用一种节省 token 的加载模式。智能体不会一次性加载所有内容：

1. **`skills_list()`** —— 所有技能的紧凑列表（约 3k token）。在会话开始时加载。
2. **`skill_view(name)`** —— 某个技能的完整 SKILL.md 内容。当智能体判断需要该技能时加载。
3. **`skill_view(name, file_path)`** —— 技能内的特定参考文件。仅在需要时加载。

这意味着技能在真正被使用之前不会消耗 token。

---

## 从技能中心安装

官方可选技能随 Hermes 一起提供，但默认未激活。需要显式安装：

```bash
# 安装官方可选技能
hermes skills install official/research/arxiv

# 在聊天会话中从技能中心安装
/skills install official/creative/songwriting-and-ai-music

# 直接从任意 HTTP(S) URL 安装单文件 SKILL.md
hermes skills install https://sharethis.chat/SKILL.md
/skills install https://example.com/SKILL.md --name my-skill
```

执行过程：
1. 技能目录被复制到 `~/.hermes/skills/`
2. 它会出现在你的 `skills_list` 输出中
3. 它将成为可用的斜杠命令

:::tip
已安装的技能在新会话中生效。如果希望在当前会话中也立即可用，使用 `/reset` 重新开始，或添加 `--now` 立即使提示缓存失效（下一次轮转会消耗更多 token）。
:::

### 验证安装

```bash
# 检查是否存在
hermes skills list | grep arxiv

# 或在聊天中
/skills search arxiv
```

---

## 插件提供的技能

插件可以使用命名空间名称（`plugin:skill`）捆绑自己的技能。这可以防止与内置技能发生名称冲突。

```bash
# 通过限定名称加载插件技能
skill_view("superpowers:writing-plans")

# 同名的内置技能不受影响
skill_view("writing-plans")
```

插件技能**不会**在系统提示中列出，也不会出现在 `skills_list` 中。它们是按需加载的——只有当你知道某个插件提供了某个技能时才显式加载。加载后，智能体会看到一个横幅，列出同一插件中的同级技能。

关于如何在你的自己的插件中发布技能，请参阅[构建 Hermes 插件 → 捆绑技能](/guides/build-a-hermes-plugin#bundle-skills)。

---

## 配置技能设置

某些技能在其前置元数据中声明它们所需的配置：

```yaml
metadata:
  hermes:
    config:
      - key: tenor.api_key
        description: "用于 GIF 搜索的 Tenor API 密钥"
        prompt: "输入你的 Tenor API 密钥"
        url: "https://developers.google.com/tenor/guides/quickstart"
```

当带有配置的技能首次被加载时，Hermes 会提示你输入这些值。它们存储在 `config.yaml` 中的 `skills.config.*` 下。

从 CLI 管理技能配置：

```bash
# 针对特定技能的交互式配置
hermes skills config gif-search

# 查看所有技能配置
hermes config show | grep '^skills\.config'
```

---

## 创建你自己的技能

技能只是带有 YAML 前置元数据的 markdown 文件。创建一个技能不到五分钟。

### 1. 创建目录

```bash
mkdir -p ~/.hermes/skills/my-category/my-skill
```

### 2. 编写 SKILL.md

```markdown title="~/.hermes/skills/my-category/my-skill/SKILL.md"
---
name: my-skill
description: 简要描述此技能的功能
version: 1.0.0
metadata:
  hermes:
    tags: [my-tag, automation]
    category: my-category
---

# 我的技能

## 何时使用
当用户询问[特定话题]或需要[特定任务]时使用此技能。

## 流程
1. 首先，检查[前置条件]是否可用
2. 运行 `command --with-flags`
3. 解析输出并展示结果

## 注意事项
- 常见失败：[描述]。解决方案：[方案]
- 注意[边界情况]

## 验证
运行 `check-command` 确认结果正确。
```

### 3. 添加参考文件（可选）

技能可以包含智能体按需加载的支持文件：

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
有关 API 详情，加载参考文件：`skill_view("my-skill", "references/api-docs.md")`
```

### 4. 测试

启动一个新会话并试用你的技能：

```bash
hermes chat -q "/my-skill 帮我处理那个事情"
```

技能会自动出现——无需注册。将其放入 `~/.hermes/skills/` 即可生效。

:::info
智能体也可以使用 `skill_manage` 创建和更新技能。在解决一个复杂问题后，Hermes 可能会提议将该方法保存为技能供下次使用。
:::

---

## 按平台管理技能

控制在哪些平台上可以使用哪些技能：

```bash
hermes skills
```

这会打开一个交互式 TUI，你可以在其中按平台（CLI、Telegram、Discord 等）启用或禁用技能。当你希望某些技能仅在特定上下文中可用时很有用——例如，将开发技能从 Telegram 上移除。

---

## 技能与记忆

两者都在会话之间持久存在，但用途不同：

| | 技能 | 记忆 |
|---|---|---|
| **是什么** | 程序性知识——如何做事情 | 事实性知识——事情是什么 |
| **何时加载** | 按需加载，仅在相关时 | 自动注入到每个会话中 |
| **大小** | 可以很大（数百行） | 应保持紧凑（仅关键事实） |
| **成本** | 加载前零 token | 较小但持续的 token 消耗 |
| **示例** | "如何部署到 Kubernetes" | "用户偏好深色模式，位于 PST 时区" |
| **创建者** | 你、智能体，或从技能中心安装 | 智能体，基于对话内容 |

**经验法则：** 如果你会把它放在参考文档中，那就是技能。如果你会把它写在便利贴上，那就是记忆。

---

## 提示

**保持技能聚焦。** 一个试图涵盖"所有 DevOps"的技能会太长且太模糊。一个涵盖"将 Python 应用部署到 Fly.io"的技能足够具体，才能真正有用。

**让智能体创建技能。** 在完成一个复杂的多步骤任务后，Hermes 通常会提议将该方法保存为技能。答应就好——这些由智能体编写的技能捕获了确切的工作流程，包括过程中发现的注意事项。

**使用分类。** 将技能组织到子目录中（`~/.hermes/skills/devops/`、`~/.hermes/skills/research/` 等）。这保持了列表的可管理性，并帮助智能体更快找到相关技能。

**在技能过时时更新它们。** 如果你使用某个技能时遇到了它未涵盖的问题，告诉 Hermes 用你学到的内容更新该技能。不维护的技能会成为负担。

---

*有关完整的技能参考——前置元数据字段、条件激活、外部目录等——请参阅[技能系统](/user-guide/features/skills)。*