---
sidebar_position: 14
title: "AWS Bedrock"
description: "在 Amazon Bedrock 上使用 Hermes 智能体 — 原生 Converse API、IAM 身份验证、Guardrails 和跨区域推理"
---

# AWS Bedrock

Hermes 智能体支持将 Amazon Bedrock 作为原生提供商，使用 **Converse API** — 而非 OpenAI 兼容端点。这使您可以完全访问 Bedrock 生态系统：IAM 身份验证、Guardrails、跨区域推理配置文件以及所有基础模型。

## 先决条件

- **AWS 凭证** — 支持 [boto3 凭证链](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/credentials.html) 的任何来源：
  - IAM 实例角色（EC2、ECS、Lambda — 零配置）
  - `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` 环境变量
  - `AWS_PROFILE`（用于 SSO 或命名配置文件）
  - `aws configure`（用于本地开发）
- **boto3** — 使用 `pip install hermes-agent[bedrock]` 安装
- **IAM 权限** — 至少需要：
  - `bedrock:InvokeModel` 和 `bedrock:InvokeModelWithResponseStream`（用于推理）
  - `bedrock:ListFoundationModels` 和 `bedrock:ListInferenceProfiles`（用于模型发现）

:::tip EC2 / ECS / Lambda
在 AWS 计算服务上，附加一个具有 `AmazonBedrockFullAccess` 权限的 IAM 角色即可完成配置。无需 API 密钥，无需 `.env` 配置 — Hermes 会自动检测实例角色。
:::

## 快速开始

```bash
# 安装 Bedrock 支持
pip install hermes-agent[bedrock]

# 选择 Bedrock 作为您的提供商
hermes model
# → 选择“更多提供商...” → “AWS Bedrock”
# → 选择您的区域和模型

# 开始聊天
hermes chat
```

## 配置

运行 `hermes model` 后，您的 `~/.hermes/config.yaml` 将包含：

```yaml
model:
  default: us.anthropic.claude-sonnet-4-6
  provider: bedrock
  base_url: https://bedrock-runtime.us-east-2.amazonaws.com

bedrock:
  region: us-east-2
```

### 区域

可通过以下任意方式设置 AWS 区域（优先级从高到低）：

1. `config.yaml` 中的 `bedrock.region`
2. `AWS_REGION` 环境变量
3. `AWS_DEFAULT_REGION` 环境变量
4. 默认值：`us-east-1`

### Guardrails

要对所有模型调用应用 [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)：

```yaml
bedrock:
  region: us-east-2
  guardrail:
    guardrail_identifier: "abc123def456"  # 来自 Bedrock 控制台
    guardrail_version: "1"                # 版本号或 "DRAFT"
    stream_processing_mode: "async"       # "sync" 或 "async"
    trace: "disabled"                     # "enabled"、"disabled" 或 "enabled_full"
```

### 模型发现

Hermes 通过 Bedrock 控制平面自动发现可用模型。您可以自定义发现过程：

```yaml
bedrock:
  discovery:
    enabled: true
    provider_filter: ["anthropic", "amazon"]  # 仅显示这些提供商
    refresh_interval: 3600                     # 缓存 1 小时
```

## 可用模型

Bedrock 模型使用 **推理配置文件 ID** 进行按需调用。`hermes model` 选择器会自动显示这些模型，推荐模型位于顶部：

| 模型 | ID | 说明 |
|-------|-----|-------|
| Claude Sonnet 4.6 | `us.anthropic.claude-sonnet-4-6` | 推荐 — 速度与能力之间的最佳平衡 |
| Claude Opus 4.6 | `us.anthropic.claude-opus-4-6-v1` | 能力最强 |
| Claude Haiku 4.5 | `us.anthropic.claude-haiku-4-5-20251001-v1:0` | 最快的 Claude |
| Amazon Nova Pro | `us.amazon.nova-pro-v1:0` | Amazon 旗舰模型 |
| Amazon Nova Micro | `us.amazon.nova-micro-v1:0` | 最快、最便宜 |
| DeepSeek V3.2 | `deepseek.v3.2` | 强大的开源模型 |
| Llama 4 Scout 17B | `us.meta.llama4-scout-17b-instruct-v1:0` | Meta 最新模型 |

:::info 跨区域推理
以 `us.` 为前缀的模型使用跨区域推理配置文件，可提供更好的容量和跨 AWS 区域的自动故障转移。以 `global.` 为前缀的模型会路由到全球所有可用区域。
:::

## 会话中切换模型

在对话过程中使用 `/model` 命令：

```
/model us.amazon.nova-pro-v1:0
/model deepseek.v3.2
/model us.anthropic.claude-opus-4-6-v1
```

## 诊断

```bash
hermes doctor
```

诊断工具会检查：
- AWS 凭证是否可用（环境变量、IAM 角色、SSO）
- 是否已安装 `boto3`
- Bedrock API 是否可访问（ListFoundationModels）
- 您所在区域可用模型的数量

## 网关（消息平台）

Bedrock 与所有 Hermes 网关平台（Telegram、Discord、Slack、飞书等）兼容。将 Bedrock 配置为您的提供商，然后正常启动网关：

```bash
hermes gateway setup
hermes gateway start
```

网关会读取 `config.yaml` 并使用相同的 Bedrock 提供商配置。

## 故障排除

### “未找到 API 密钥” / “未找到 AWS 凭证”

Hermes 按此顺序检查凭证：
1. `AWS_BEARER_TOKEN_BEDROCK`
2. `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`
3. `AWS_PROFILE`
4. EC2 实例元数据（IMDS）
5. ECS 容器凭证
6. Lambda 执行角色

如果均未找到，请运行 `aws configure` 或将 IAM 角色附加到您的计算实例。

### “不支持使用按需吞吐量调用模型 ID ...”

请使用 **推理配置文件 ID**（以 `us.` 或 `global.` 为前缀），而非基础模型 ID。例如：
- ❌ `anthropic.claude-sonnet-4-6`
- ✅ `us.anthropic.claude-sonnet-4-6`

### “ThrottlingException”

您已达到 Bedrock 每模型速率限制。Hermes 会自动进行退避重试。要增加限制，请在 [AWS Service Quotas 控制台](https://console.aws.amazon.com/servicequotas/) 中申请配额增加。

## 一键 AWS 部署

要在 EC2 上使用 CloudFormation 实现全自动部署：

**[sample-hermes-agent-on-aws-with-bedrock](https://github.com/JiaDe-Wu/sample-hermes-agent-on-aws-with-bedrock)** — 自动创建 VPC、IAM 角色、EC2 实例并配置 Bedrock。只需一键即可在任何区域部署。