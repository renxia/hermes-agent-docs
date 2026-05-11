---
title: "Sherlock — 在400多个社交网络中进行OSINT用户名搜索"
sidebar_label: "Sherlock"
description: "在400多个社交网络中进行OSINT用户名搜索"
---

{/* 此页面由网站脚本 `website/scripts/generate-skill-docs.py` 从技能的 `SKILL.md` 自动生成。请编辑源文件 `SKILL.md`，而非此页面。 */}

# Sherlock

在400多个社交网络中进行OSINT用户名搜索。通过用户名追查社交媒体账户。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/security/sherlock` 安装 |
| 路径 | `optional-skills/security/sherlock` |
| 版本 | `1.0.0` |
| 作者 | unmodeled-tyler |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `osint`, `security`, `username`, `social-media`, `reconnaissance` |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这就是智能体在技能激活时看到的指令。
:::

# Sherlock OSINT 用户名搜索

使用 [Sherlock 项目](https://github.com/sherlock-project/sherlock) 通过用户名在400多个社交网络中追查社交媒体账户。

## 何时使用

- 用户要求查找与某个用户名关联的账户
- 用户希望检查用户名在各平台的可用性
- 用户正在进行OSINT或侦察研究
- 用户询问"此用户名在哪里注册了？"或类似问题

## 要求

- 已安装 Sherlock CLI: `pipx install sherlock-project` 或 `pip install sherlock-project`
- 或者：Docker 可用 (`docker run -it --rm sherlock/sherlock`)
- 网络访问以查询社交平台

## 流程

### 1. 检查是否已安装 Sherlock

**在进行任何其他操作之前**，验证 sherlock 是否可用：

```bash
sherlock --version
```

如果命令失败：
- 提供安装选项：`pipx install sherlock-project`（推荐）或 `pip install sherlock-project`
- **不要** 尝试多种安装方法 — 选择一种并继续
- 如果安装失败，通知用户并停止

### 2. 提取用户名

**如果用户名在用户消息中明确给出，则直接提取。**

**不应使用** 澄清的示例：
- "查找 nasa 的账户" → 用户名是 `nasa`
- "搜索 johndoe123" → 用户名是 `johndoe123`
- "检查 alice 是否在社交媒体上存在" → 用户名是 `alice`
- "在社交网络上查找用户 bob" → 用户名是 `bob`

**仅在以下情况使用澄清：**
- 提及了多个潜在用户名（"搜索 alice 或 bob"）
- 措辞模糊（"搜索我的用户名" 但未指定）
- 完全没有提及用户名（"做一次OSINT搜索"）

提取时，使用所述的**确切**用户名 — 保留大小写、数字、下划线等。

### 3. 构建命令

**默认命令**（除非用户明确要求，否则使用此命令）：
```bash
sherlock --print-found --no-color "<username>" --timeout 90
```

**可选标志**（仅在用户明确请求时添加）：
- `--nsfw` — 包含NSFW网站（仅当用户询问时）
- `--tor` — 通过Tor路由（仅当用户要求匿名时）

**不要** 通过澄清询问选项 — 直接运行默认搜索。用户可以在需要时请求特定选项。

### 4. 执行搜索

通过 `terminal` 工具运行。该命令通常需要30-120秒，具体取决于网络条件和网站数量。

**示例终端调用：**
```json
{
  "command": "sherlock --print-found --no-color \"target_username\"",
  "timeout": 180
}
```

### 5. 解析并展示结果

Sherlock 以简单格式输出找到的账户。解析输出并展示：

1. **摘要行：** "为用户名 'Y' 找到了 X 个账户"
2. **分类链接：** 如果有助于理解，按平台类型分组（社交、专业、论坛等）
3. **输出文件位置：** Sherlock 默认将结果保存到 `<username>.txt`

**示例输出解析：**
```
[+] Instagram: https://instagram.com/username
[+] Twitter: https://twitter.com/username
[+] GitHub: https://github.com/username
```

尽可能将发现结果展示为可点击的链接。

## 陷阱

### 未找到结果
如果Sherlock没有找到账户，这通常是正确的 — 该用户名可能未在检查的平台上注册。建议：
- 检查拼写/变体
- 尝试使用 `?` 通配符的类似用户名：`sherlock "user?name"`
- 用户可能有隐私设置或已删除账户

### 超时问题
某些网站响应缓慢或阻止自动化请求。使用 `--timeout 120` 增加等待时间，或使用 `--site` 限制范围。

### Tor 配置
`--tor` 需要运行 Tor 守护进程。如果用户想要匿名但Tor不可用，建议：
- 安装 Tor 服务
- 使用带有替代代理的 `--proxy`

### 误报
由于其响应结构，某些网站总是返回"已找到"。对于意外的结果，请与手动检查进行交叉验证。

### 速率限制
激进的搜索可能触发速率限制。对于批量用户名搜索，在调用之间添加延迟或使用带有缓存数据的 `--local`。

## 安装

### pipx (推荐)
```bash
pipx install sherlock-project
```

### pip
```bash
pip install sherlock-project
```

### Docker
```bash
docker pull sherlock/sherlock
docker run -it --rm sherlock/sherlock <username>
```

### Linux 软件包
适用于 Debian 13+、Ubuntu 22.10+、Homebrew、Kali、BlackArch。

## 道德使用

此工具仅用于合法的OSINT和研究目的。提醒用户：
- 仅搜索他们拥有或有权调查的用户名
- 尊重平台的服务条款
- 不要用于骚扰、跟踪或非法活动
- 在分享结果前考虑隐私影响

## 验证

运行 sherlock 后，验证：
1. 输出列出了带有URL的找到网站
2. 如果使用文件输出，则创建了 `<username>.txt` 文件（默认输出）
3. 如果使用了 `--print-found`，输出应仅包含匹配项的 `[+]` 行

## 示例交互

**用户：** "你能检查用户名 'johndoe123' 是否存在于社交媒体上吗？"

**智能体流程：**
1. 检查 `sherlock --version`（验证已安装）
2. 用户名已提供 — 直接继续
3. 运行：`sherlock --print-found --no-color "johndoe123" --timeout 90`
4. 解析输出并展示链接

**响应格式：**
> 为用户名 'johndoe123' 找到了 12 个账户：
>
> • https://twitter.com/johndoe123
> • https://github.com/johndoe123
> • https://instagram.com/johndoe123
> • [... 其他链接]
>
> 结果已保存到：johndoe123.txt

---

**用户：** "搜索用户名 'alice'，包括NSFW网站"

**智能体流程：**
1. 检查 sherlock 是否已安装
2. 用户名 + NSFW 标志均已提供
3. 运行：`sherlock --print-found --no-color --nsfw "alice" --timeout 90`
4. 展示结果