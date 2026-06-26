Stripe Projects — 通过 Stripe Projects 供应 SaaS 服务并同步凭证
sidebar_label: "Stripe Projects"
description: "通过 Stripe Projects 供应 SaaS 服务并同步凭证"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Stripe Projects

通过 Stripe Projects 供应 SaaS 服务并同步凭证。

## Skill metadata

| | |
|---|---|
| Source | Optional — install with `hermes skills install official/payments/stripe-projects` |
| Path | `optional-skills/payments/stripe-projects` |
| Version | `0.1.0` |
| Author | Teknium (teknium1)，Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos |
| Tags | `Payments`, `Stripe`, `Projects`, `Provisioning`, `Infrastructure` |
| Related skills | [`stripe-link-cli`](/docs/user-guide/skills/optional/payments/payments-stripe-link-cli), [`mpp-agent`](/docs/user-guide/skills/optional/payments/payments-mpp-agent) |

## Reference: full SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# Stripe Projects 技能

它封装了 [Stripe Projects](https://projects.dev) CLI 插件，使 Hermes 能够供应 SaaS 服务（Neon, Twilio, Vercel 等），生成并同步凭证到用户的 `.env` 文件中，从而在一个地方管理跨提供商的计费。

尽管更广泛的支付集群正在 Windows 上成熟，但此功能仅限于 `[linux, macos]`。Stripe CLI 本身是跨平台的；这个限制是针对整个集群的准备措施，而非硬性限制。

## 何时使用

触发短语:

- "设置 &lt;提供商>"、"供应 &lt;Neon|Twilio|Vercel|...>"、"创建一个数据库"
- "为这个项目提供一个 &lt;Postgres|Redis|Twilio 号码|...>"
- "管理我的堆栈凭证"、"轮换此密钥"、"升级我的套餐"
- "我能添加哪些提供商？"

如果用户已经拥有某个提供商的账户，此技能仍然可以通过 `stripe projects link <provider>` 进行连接。如果用户想要使用现有的提供商资源（例如现有的数据库或 Vercel 项目），请先检查提供商是否支持；许多提供商目前支持供应新资源，但不支持导入现有资源。

## 先决条件

- 已安装 Stripe CLI (macOS 上的 Homebrew，Linux 上的包管理器，或从 https://docs.stripe.com/stripe-cli/install 下载)
- 已安装 Stripe Projects 插件
- 一个 Stripe 账户。如果用户尚未拥有，CLI 可在设置过程中通过浏览器引导他们完成登录或创建账户。

## 安装

macOS:

```
brew install stripe/stripe-cli/stripe
stripe plugin install projects
```

Linux: 参考 https://docs.stripe.com/stripe-cli/install 进行特定平台的安装，然后执行：

```
stripe plugin install projects
```

## 如何运行

所有命令都通过用户项目目录内的 `terminal` 工具运行（CLI 会将 `.env` 和 `.projects/vault/vault.json` 写入到 CWD）。

## 流程

### 1. 初始化项目

```
cd <project-root>
stripe projects init
```

这会创建 `.projects/vault/vault.json`（加密凭证存储）并准备好项目以接收提供商。

### 2. 发现可用提供商

```
stripe projects catalog
```

列出了 Stripe Projects 支持的所有提供商——数据库、托管、身份验证、AI、分析、消息传递等。

### 3. 添加服务

```
stripe projects add <provider>/<service>
```

示例:

- `stripe projects add neon/postgres`
- `stripe projects add twilio/sms`
- `stripe projects add runloop/sandbox`

CLI 会使用提供商在用户自己的账户中供应该服务，生成凭证，将其同步到 `.env` 文件中，并在保险库中记录该资源。用户可能需要确认套餐选择或定价提示。

### 4. 验证

```
stripe projects list
```

应显示新添加的提供商及其 `.env` 键。

### 5. 管理/升级/移除

```
stripe projects upgrade <provider>     # 更改套餐
stripe projects remove <provider>      # 取消供应
stripe projects rotate <provider>      # 轮换凭证
```

## 潜在问题

- **`.env` 的写入是真实写入。** CLI 会追加到项目根目录中的任何 `.env` 文件中。如果用户的 `.env` 被 gitignored（正常情况），则这些密钥会安全地存储；否则，此技能可能成为一个凭证泄露的向量。请务必先检查 `.gitignore`。
- **按项目状态划分。** `.projects/vault/vault.json` 是针对每个项目的。在两个不同的项目中供应相同的服务会创建两个独立的资源——以及两份账单。
- **计费发生在 Stripe 端。** `add`/`upgrade` 过程中的套餐提示是真实的收费；在确认之前应将这些信息展示给用户。
- **提供商可用性会变化。** 目录一直在增长；如果用户指定的提供商未列出，请先运行 `stripe projects catalog | grep <name>` 而不是直接使 `add` 调用失败。
- **保险库中的凭证是加密的，但 `.env` 是明文的。** 应遵循标准的 `.env` 清洁度要求——切勿提交它。
- **移除服务并不总是会销毁底层资源。** 有些提供商会留下一个暂停/休眠的资源。对于高成本的服务（尤其是托管数据库），请在运行 `remove` 后检查提供商自己的仪表板。

## 验证

```
stripe projects --version && stripe projects list
```

在一个已初始化的项目中，退出代码为 0 表示插件状态良好。