---
title: Stripe Link Cli — Agent payments via Stripe Link — cards, SPT, approvals
sidebar_label: Stripe Link Cli
description: 通过 Stripe Link 进行智能体支付——卡片、SPT 和审批
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Stripe Link Cli

通过 Stripe Link 进行智能体支付——卡片、SPT 和审批。

## Skill metadata

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/payments/stripe-link-cli` 安装 |
| Path | `optional-skills/payments/stripe-link-cli` |
| Version | `0.1.0` |
| Author | Teknium (teknium1), Hermes Agent |
| License | MIT |
| Platforms | linux, macos |
| Tags | `Payments`, `Stripe`, `Link`, `Checkout`, `MPP` |
| Related skills | [`mpp-agent`](/docs/user-guide/skills/optional/payments/payments-mpp-agent), [`stripe-projects`](/docs/user-guide/skills/optional/payments/payments-stripe-projects) |

## Reference: full SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时的指令。
:::

# Stripe Link CLI Skill

它封装了 [@stripe/link-cli](https://github.com/stripe/link-cli)，使 Hermes 能够代表用户，使用一次性虚拟卡或共享支付令牌（SPT）来完成购买。每一次消费都受到应用内审批的限制——Hermes 本身无法自我批准。

目前仅限美国地区（Link 账户要求）。Windows 不受上游 CLI 支持——此技能限定为 `[linux, macos]`。

## When to Use (何时使用)

触发短语：

- "buy X"（购买 X），"pay for X"（支付 X），"make a purchase"（进行购买），"complete checkout"（完成结账）
- "get me a card"（给我一张卡），"I need a payment method"（我需要一种支付方式）
- "log in to Link"（登录 Link），"connect my Link wallet"（连接我的 Link 钱包）
- 来自商家 API 的 HTTP 402 响应，其中包含 `www-authenticate: ... method="stripe"`

如果用户想要进行付费 API 调用（HTTP 402，没有结账表单），那么 `card` 路径是错误的——请使用此技能中的 SPT，或转交给 `mpp-agent` 技能。

## Prerequisites (先决条件)

- Node.js 20+ 可在 `PATH` 中找到（`node --version`）
- 基于美国的（Link 账户要求）

无需预先设置 Link 账户、支付方式和消费审批应用——CLI 会在首次运行时引导用户完成这些步骤：

- 一个位于 https://app.link.com 的 Link 账户——在首次 `link-cli` 认证时创建/链接
- 至少一种支付方式——在首次访问 https://app.link.com/wallet 时添加
- Link 移动/Web 应用——当发起首次消费请求时，打开该应用进行审批

无需环境变量——身份验证状态由 CLI 在其配置目录中本地存储。

## Install (安装)

全局一次性安装：

```
npm install -g @stripe/link-cli
```

或者通过 `npx @stripe/link-cli` 临时调用。下面的技能使用了已安装的 `link-cli` 形式。

## How to Run (如何运行)

所有命令都通过 `terminal` 工具运行。CLI 会自动检测非 TTY 调用者，并默认发出紧凑的 `toon` 输出——这对模型来说是足够的。如果某个步骤需要结构化字段，请传递 `--format json`。

发现命令：`link-cli --llms-full`。
在调用前获取命令的 schema：`link-cli <command> --schema`。

## Procedure (流程)

### 1. Check / establish auth (检查/建立认证)

```
link-cli auth status
```

如果未进行身份验证，请使用清晰的客户端名称登录（此标签将显示在用户的 Link 应用中）：

```
link-cli auth login --client-name "Hermes" --interval 5 --timeout 300
```

`--interval`/`--timeout` 形式会内联轮询，因此智能体无需管理 `_next` 步骤。将验证 URL + 短语打印给用户，并等待 CLI 返回。

**在 `auth status` 确认登录之前，请勿继续执行此步骤。**

### 2. Evaluate the merchant before creating a spend request (在创建消费请求前评估商家)

决定凭证类型：

| Merchant surface (商家界面) | `--credential-type` |
|---|---|
| 标准网页结账表单 / Stripe Elements | `card` (默认) |
| 返回包含 `www-authenticate` 中 `method="stripe"` 的 HTTP 402 | `shared_payment_token` |
| 返回不包含 `method="stripe"` 的 HTTP 402 | unsupported — 停止 |

对于 402 响应，请勿手动解码挑战。传递原始头部：

```
link-cli mpp decode --challenge '<full WWW-Authenticate header>'
```

这会验证挑战并提取网络 ID + 解码后的请求体。

### 3. List payment methods + shipping (列出支付方式 + 配送)

```
link-cli payment-methods list
link-cli shipping-address list
```

除非用户另有指定，否则使用第一个条目。来自 `payment-methods list` 的 `id` 是下一步中的 `--payment-method-id`。

### 4. Create the spend request (创建消费请求)

在发出此命令前，与用户确认最终总额。金额以分（cents）为单位。

```
link-cli spend-request create \
  --payment-method-id <pm_id> \
  --merchant-name "<name>" \
  --merchant-url "<url>" \
  --context "<one sentence: what is being purchased and why>" \
  --amount <cents> \
  --line-item "name:<item>,unit_amount:<cents>,quantity:1" \
  --total "type:total,display_text:Total,amount:<cents>" \
  --request-approval
```

对于 MPP 商家，请添加 `--credential-type shared_payment_token`。

`--request-approval` 会向用户的 Link 应用发送信号并轮询，直到用户批准或拒绝。如果被拒绝/超时，CLI 将以非零状态退出。

### 5. Retrieve the credential — SECURELY (安全地检索凭证)

**切勿将卡片详情打印到标准输出（stdout）。** 使用 `--output-file`，以确保 PAN 永远不会进入智能体的转录或日志中：

```
link-cli spend-request retrieve <lsrq_id> \
  --include card \
  --output-file /tmp/link-card.json \
  --format json
```

文件将使用 `0600` 权限写入；stdout 只显示经过脱敏的字段（品牌、后四位、有效期）以及一个 `card_output_file` 路径。

### 6. Use the credential (使用凭证)

- 对于网页结账：将文件路径交给用户，或者将其传递给一个直接从磁盘填写表单的浏览器驱动工具。切勿使用 `read_file` 或 `cat` 将卡片文件读入智能体的推理上下文。
- 对于 MPP 商家：

  ```
  link-cli mpp pay <merchant-url> \
    --spend-request-id <lsrq_id> \
    --method POST \
    --data '<json body>'
  ```

### 7. Clean up (清理)

购买完成后，立即删除卡片文件：

```
rm -f /tmp/link-card.json
```

## Optional: run as an MCP server instead (可选：转而作为 MCP 服务器运行)

`@stripe/link-cli --mcp` 通过 stdio 暴露了与 MCP 工具相同的命令。要将其注册到 Hermes 的原生 MCP 中，请执行以下操作：

```
hermes mcp add stripe-link --command "npx" --args "@stripe/link-cli --mcp"
```

然后 `hermes mcp list` 应该显示 `stripe-link`。相同的审批规则也适用——MCP 并不能绕过 Link 应用的审批步骤。

## Pitfalls (潜在陷阱)

- **仅限美国地区。** 在美国境外，`auth login` 将失败。请告知用户，不要反复尝试。
- **卡片 PAN 绝不能进入智能体上下文。** 每次都使用 `--output-file`。如果你已经没有使用它就检索了凭证，立即执行 `link-cli auth logout` 是不够的——该卡片是一次性使用的，但安全卫生仍然很重要。
- **`--request-approval` 会阻塞直到用户采取行动。** 如果用户正在睡觉，CLI 将达到超时限制。请设定期望。
- **多步 `_next` 命令。** 有些命令会返回必须执行才能继续的 `_next.command`。如有疑问，请优先使用内联轮询标志（`--interval`/`--timeout`）。
- **输出格式默认为 `toon`** 在非 TTY 模式下。这对散文来说是足够的，但如果下游步骤需要解析特定字段，请传递 `--format json`。
- **不要默认使用 `card`。** 商家评估步骤（第 2 节）存在的原因是选择错误的凭证类型会导致购买静默失败或泄露不必要的更多数据。

## Verification (验证)

```
link-cli --version && link-cli auth status
```

退出代码为 0 表示已安装并已登录。