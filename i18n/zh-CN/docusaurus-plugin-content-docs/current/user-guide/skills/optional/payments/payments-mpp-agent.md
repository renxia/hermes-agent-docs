title: MPP 智能体 — 通过机器支付协议 (MPP) 支付 HTTP 402 API
sidebar_label: Mpp 智能体
description: 通过机器支付协议 (MPP) 支付 HTTP 402 API
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# MPP 智能体

通过机器支付协议 (MPP) 支付 HTTP 402 API。

## 技能元数据

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/payments/mpp-agent` 安装 |
| Path | `optional-skills/payments/mpp-agent` |
| Version | `0.1.0` |
| Author | Teknium (teknium1)，Hermes 智能体 |
| License | MIT |
| Platforms | linux, macos |
| Tags | `Payments`, `MPP`, `HTTP-402`, `Tempo`, `Stripe` |
| Related skills | [`stripe-link-cli`](/docs/user-guide/skills/optional/payments/payments-stripe-link-cli), [`stripe-projects`](/docs/user-guide/skills/optional/payments/payments-stripe-projects) |

## 参考：完整 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# MPP 智能体技能

它封装了机器支付协议 (MPP, https://mpp.dev) 的客户端，使 Hermes 能够向响应 `HTTP 402 Payment Required` 的服务器支付每次请求的 API 访问费用。

有三种客户端选项，均通过 npm 分发。请选择能解决用户需求的轻量级选项。在更广泛的支付工具在 Windows 上成熟之前，它被限制在 `[linux, macos]` 上运行。

## 何时使用

- 一个商户 API 返回了带有 `www-authenticate` 头部的 `HTTP 402`，而用户希望实际支付它，而不仅仅是记录响应。
- 用户要求“按请求付费”、“设置智能体钱包”、“使用 Tempo / Privy / AgentCash”，或希望发现 MPP 定价的服务。
- 一个 Stripe Link 支出产生了共享支付令牌 (SPT)，智能体需要将其附加到 402 挑战中——在此流程中，请优先使用 `link-cli mpp pay`（参见 `stripe-link-cli` 技能）。

## 选择客户端

| 工具 | 何时使用 | 设置 |
|---|---|---|
| `link-cli` | 用户已设置 Stripe Link，或 402 挑战宣传 `method="stripe"` | 参见 `stripe-link-cli` 技能 |
| Tempo Wallet | 具有支出控制的 MPP 服务、服务发现 | `tempo wallet login` |
| Privy Agent CLI | 多链钱包、基于浏览器的资金 | `privy-agent-wallets login` |
| AgentCash | 通过一个 USDC.e 余额支付 300+ 个预定价 API | `npx agentcash onboard` |
| `mppx` | 开发 + 调试，最小的依赖表面 | `npm install -g mppx` 然后 `mppx account create` |

默认设置：如果用户已配置 Stripe Link 或 402 挑战指定了 `method="stripe"`，则使用 `link-cli mpp pay`（`stripe-link-cli` 技能）。否则，对于一次性付费调用和调试，请使用 `mppx`；当用户需要持久的支出控制时，请使用 Tempo Wallet。

## 先决条件

- PATH 中有 Node.js 20+
- 一个已充值的钱包（Tempo / Privy / AgentCash）或一个 `mppx` 账户
- 对于 Tempo / Privy / AgentCash：请遵循各自的入门技能：
  - `https://tempo.xyz/SKILL.md`
  - `https://agents.privy.io/skill.md`
  - `https://agentcash.dev/skill.md`

如果用户选择其中一个，请使用 `web_extract` 来获取这些 SKILL.md 文件中的任何一个。

## 流程（mppx，最快路径）

通过 `terminal` 工具运行所有命令。

### 1. 安装并创建账户

```
npm install -g mppx
mppx account create
```

将生成的账户凭证存储在 CLI 提示的位置（CLI 会将它们写入其自己的配置中——请勿将其粘贴到智能体转录中）。

### 2. 检查商户的 402 挑战

如果用户提供了一个 URL，请先探测它以确认它确实支持 MPP：

```
curl -i <url>
```

一个真实的 MPP 402 看起来像这样：

```
HTTP/1.1 402 Payment Required
www-authenticate: tempo amount=0.1 currency=...
```

### 3. 支付请求

```
mppx <url>
```

对于非 GET 方法或请求体：

```
mppx <url> --method POST --data '<json>'
```

`mppx` 会自动处理 402 挑战/凭证流程，并在成功时打印商户的实际响应。

### 4. 验证收据

`mppx` 会自动附加收据头部。要检查：

```
mppx <url> -v
```

## 流程（Tempo Wallet）

https://tempo.xyz/SKILL.md 上的 Tempo Wallet 技能是权威参考；请使用 `web_extract` 获取它并遵循其指示。标题：

```
tempo wallet login
tempo wallet pay <url>
```

支出控制和服务发现功能在 https://wallet.tempo.xyz 的钱包 UI 中实时显示。

## 潜在问题

- **如果挑战中没有 `method="stripe"`，Stripe Link 无法支付 HTTP 402。** 如果挑战只宣传 Tempo / 其他方法，请使用 `mppx`（或匹配的任何钱包）——Link 将会拒绝它。反之，如果它宣传 `method="stripe"`，则优先通过 `stripe-link-cli` 技能使用 Link，以便支出经过用户批准的卡片。
- **一个头部中的多个挑战。** `www-authenticate` 可能列出多种方法（例如：`tempo, stripe`）。Link CLI 的 `mpp decode` 会选择 Stripe；`mppx` 会选择 Tempo。没有单一的“正确”客户端——请根据用户使用的哪个钱包来选择。
- **零金额挑战。** 有些 MPP 端点收取 $0.00 并且只需要一个证明凭证。这些无需已充值的钱包即可完成。不要将其拒绝为“故障”。
- **钱包密钥从未进入智能体上下文。** 所有四个客户端都将密钥存储在其自己的配置目录中（或在 Privy 的情况下，生成会话级的临时密钥对）。请勿 `cat`/`read_file` 它们。
- **服务器端的 MPP 是另一个技能。** 如果用户想向自己的 API 添加 402，那么本技能就是错误的——请将他们引向 https://mpp.dev/quickstart/server 以及 `mppx/nextjs` / `mppx/hono` / `mppx/express` / `mppx/elysia` 中间件。一个专用的 `mpp-server` 技能可能会稍后发布。

## 验证

```
mppx --version && mppx account list
```

退出代码 0 表示已安装且存在账户。