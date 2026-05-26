---
sidebar_position: 15
title: "Microsoft Foundry"
description: "在 Microsoft Foundry 上使用 Hermes 智能体 — OpenAI 风格和 Anthropic 风格端点，自动检测传输协议与已部署模型"
---

# Microsoft Foundry

Hermes 智能体的 `azure-foundry` 提供程序支持 Microsoft Foundry（前身为 Azure AI Foundry）和 Azure OpenAI。单个 Foundry 资源可以托管具有两种不同网络格式的模型：

- **OpenAI 风格** — 在类似 `https://<resource>.openai.azure.com/openai/v1` 的端点上执行 `POST /v1/chat/completions`。适用于 GPT-4.x、GPT-5.x、Llama、Mistral 以及大多数开源权重模型。
- **Anthropic 风格** — 在类似 `https://<resource>.services.ai.azure.com/anthropic` 的端点上执行 `POST /v1/messages`。当 Microsoft Foundry 通过 Anthropic Messages API 格式提供 Claude 模型服务时使用。

设置向导会探测您的端点，自动检测其使用的传输协议、可用的部署以及每个模型的上下文长度。

## 先决条件

- 一个至少具有一个部署的 Microsoft Foundry 或 Azure OpenAI 资源
- 该部署的端点 URL
- **要么**一个 API 密钥（从 Azure 门户的“密钥和端点”下获取），**要么**在 Foundry 资源上拥有 **Azure AI 用户** RBAC 角色（如果您计划使用 Microsoft Entra ID，即 Microsoft 推荐的无密钥路径）。在 Microsoft 的更名过渡期间，某些租户可能会将该角色显示为 **Foundry 用户**。

## 快速开始

```bash
hermes model
# → 选择 "Azure Foundry"
# → 输入您的端点 URL
# → 选择身份验证方式：
#     1. API 密钥
#     2. Microsoft Entra ID  （托管身份/工作负载身份/az 登录）
# → （Entra）Hermes 探测 DefaultAzureCredential；成功则永不询问密钥
# → （API 密钥）输入您的 API 密钥
# Hermes 探测端点并自动检测传输方式和模型
# → 从列表中选择模型（或手动输入部署名称）
```

该向导将：

1. **解析 URL 路径** — 以 `/anthropic` 结尾的 URL 被识别为 Microsoft Foundry Claude 路由。
2. **探测 `GET <base>/models`** — 如果端点返回 OpenAI 格式的模型列表，Hermes 将切换到 `chat_completions` 模式，并预填返回的部署 ID 以供选择。
3. **探测 Anthropic Messages 格式** — 针对不公开 `/models` 端点但接受 Anthropic Messages 格式的端点作为备选方案。
4. **回退到手动输入** — 拒绝所有探测的私有/受限端点仍然有效；您可以选择 API 模式并手动输入部署名称。

所选模型的上下文长度通过 Hermes 的标准元数据链（`models.dev`、提供商元数据和硬编码的家族回退）进行解析，并存储在 `config.yaml` 中，以便模型可以正确调整其自身的上下文窗口大小。

## Microsoft Entra ID（无密钥，RBAC）— 推荐

Microsoft 为生产 Foundry 工作负载推荐使用 [Microsoft Entra ID 无密钥身份验证](https://learn.microsoft.com/azure/ai-foundry/foundry-models/how-to/configure-entra-id)。Hermes 在 **两个** API 接口上都支持 Entra ID：

- **OpenAI 风格** (`api_mode: chat_completions` / `codex_responses`) — GPT-4/5、Llama、Mistral、DeepSeek 等。
- **Anthropic 风格** (`api_mode: anthropic_messages`) — Microsoft Foundry 上的 Claude 模型。

Foundry 的 RBAC 是按资源分配的（`Azure AI User` 授予两个接口权限；某些租户可能显示为 `Foundry User`），并且 Microsoft 记录了相同的推理范围（`https://ai.azure.com/.default`）。其内部原理如下：

- OpenAI 风格使用 OpenAI Python SDK 的原生可调用 `api_key=` 约定 — SDK 每个请求自动铸造一个新的 JWT。
- Anthropic 风格使用一个 `httpx.Client`，并通过 `agent.azure_identity_adapter.build_bearer_http_client` 安装请求事件钩子，因为 Anthropic SDK 不原生接受可调用的 `auth_token`。该钩子在每个出站请求中重写 `Authorization: Bearer <fresh-jwt>`。相同的 Microsoft RBAC，相同的 Foundry 范围 — 唯一的区别在于 SDK 的约定。

### 为何使用 Entra ID？

- 无需轮换或吊销长期存在的 API 密钥。
- RBAC 驱动的访问控制 — 在 Foundry 资源上授予或移除 `Azure AI User` 角色，无需修改配置。
- 访问和审计日志按被分配者进行分段，而非所有调用者共享一个静态密钥。
- 为 Azure VM、AKS Pod、App Service、Functions、Container Apps 和 Foundry Agent Service 通过托管身份提供单一身份验证接口。
- 为 CI/CD 管道提供工作负载身份和服务主体流程。

### 一次性设置（Azure 端）

1. 在 Azure 门户中，打开您的 Foundry 资源 → **访问控制 (IAM)** → **添加 → 添加角色分配**。
2. 选择 **Azure AI User** 角色（如果您的租户有重命名后的角色，则选择 **Foundry User**）。
3. 将其分配给：
   - **您的用户账户**，用于通过 `az login` 进行本地开发。
   - **托管身份或工作负载身份**，用于 Azure 托管计算（推荐用于生产环境）。
   - **Foundry Agent Service 托管智能体的智能体身份**，当 Hermes 在托管智能体内运行时。
   - **服务主体**，用于当工作负载身份不可用时的 CI/CD 管道。
4. 等待约 5 分钟让角色传播。

等效的 Azure CLI 命令：

```bash
az role assignment create \
  --assignee <principal-or-agent-identity-client-id> \
  --role "Azure AI User" \
  --scope <foundry-resource-id>
```

### 一次性设置（Hermes 端）

```bash
hermes model
# → 选择 "Azure Foundry"
# → 输入您的端点 URL
# → 身份验证方式：2 (Microsoft Entra ID)
# → （可选）用户分配的托管身份客户端 ID
# → （可选）Azure 租户 ID
# → Hermes 探测 DefaultAzureCredential() 并报告哪个内部
#    凭据成功（例如 AzureCliCredential、ManagedIdentityCredential）
```

向导运行一个有限预检探测（10 秒超时）。失败时它会提供“仍要保存，稍后验证”的选项 — 这在配置当前尚无凭据但运行时会有的机器时很有用（例如，为托管身份部署准备配置）。

`azure-identity` 在首次使用时通过 Hermes 的延迟安装路径自动安装。要预安装：

```bash
pip install azure-identity
```

### 写入 `config.yaml` 的配置

```yaml
model:
  provider: azure-foundry
  base_url: https://my-resource.openai.azure.com/openai/v1
  api_mode: chat_completions
  auth_mode: entra_id
  default: gpt-4o
  context_length: 128000
  entra:
    scope: https://ai.azure.com/.default        # 仅当覆盖默认值时使用
```

Hermes 在 `config.yaml` 中仅管理一个 Entra 相关的旋钮：

- **`scope`** — OAuth 资源范围。默认为 Microsoft 文档记录的推理范围（`https://ai.azure.com/.default`）。仅当您的资源是针对非标准受众预配时才需覆盖。

其他所有内容（租户、服务主体密钥、联合令牌文件、主权云授权机构、代理首选项）均由 `azure-identity` 直接从标准的 `AZURE_*` 环境变量读取 — 请参阅下面的 [凭据解析顺序](#凭据解析顺序)。在 `~/.hermes/.env` 或您的部署环境中设置这些变量，完全按照 Microsoft SDK 参考文档所述。

在 Entra 模式下，`~/.hermes/.env` 中不会存放任何密钥 — `azure-identity` 在进程内（以及在可用时，在您的操作系统密钥链/`~/.IdentityService` 中）缓存令牌。

### 凭据解析顺序

`azure-identity` 的 `DefaultAzureCredential` 在每个令牌请求时遍历此链，在第一个返回令牌的凭据处停止：

1. **环境凭据** — `AZURE_TENANT_ID` + `AZURE_CLIENT_ID` + `AZURE_CLIENT_SECRET`（或 `AZURE_CLIENT_CERTIFICATE_PATH` / `AZURE_FEDERATED_TOKEN_FILE`）。
2. **工作负载身份** — `AZURE_FEDERATED_TOKEN_FILE`（AKS 联合令牌 / OIDC）。
3. **托管身份** — 虚拟机使用 IMDS 端点（`169.254.169.254`）；App Service / Functions / Container Apps 使用 `IDENTITY_ENDPOINT`。Foundry Agent Service 托管智能体使用托管智能体的智能体身份。
4. **Visual Studio Code** — Azure 账户扩展。
5. **Azure CLI** — `az login` 会话。
6. **Azure Developer CLI** — `azd auth login`。
7. **Azure PowerShell** — `Connect-AzAccount`。
8. **代理**（仅限 Windows / WSL） — Web Account Manager。

默认情况下，为无人值守的 Hermes 运行排除交互式浏览器凭据；请改用 Azure CLI、Azure Developer CLI、托管身份、工作负载身份或服务主体凭据。

### 部署模式

**本地开发：**
```bash
az login
hermes model   # 选择 Azure Foundry → Entra ID
hermes         # 使用您的 az 登录令牌
```

**Azure VM / Functions / App Service / Container Apps（系统分配的托管身份）：**
1. 在计算资源上启用系统分配的身份。
2. 向该身份授予 Foundry 资源上的 `Azure AI User`（或 `Foundry User`）角色。
3. 在 config.yaml 中设置 `model.auth_mode: entra_id` — 无需环境变量。

**Azure VM / Functions / App Service / Container Apps（用户分配的托管身份）：**
- 将 `AZURE_CLIENT_ID` 设置为用户分配身份的客户端 ID，以便 `DefaultAzureCredential` 选择正确的身份。

**Foundry Agent Service 托管智能体：**
- 创建托管智能体，并在 Foundry 资源上向该智能体的身份授予 `Azure AI User`（或 `Foundry User`）角色。Hermes 在托管智能体内部使用 `ManagedIdentityCredential`；角色分配属于智能体身份，而非仅父项目或您的用户。

**AKS 工作负载身份（取代 AAD Pod Identity）：**
- 用工作负载身份客户端 ID 注解 Pod 的服务账户。
- Pod 的联合令牌文件通过 `AZURE_FEDERATED_TOKEN_FILE` 自动检测。
- `model.auth_mode: entra_id` 无需进一步配置更改即可工作。

**CI 中的服务主体：**
- 在运行器环境中设置 `AZURE_TENANT_ID`、`AZURE_CLIENT_ID`、`AZURE_CLIENT_SECRET`。

#### 主权云（政府、中国）

导出 `AZURE_AUTHORITY_HOST`（例如，Azure Government 使用 `https://login.microsoftonline.us`，Azure 中国使用 `https://login.partner.microsoftonline.cn`）。`azure-identity` 会直接读取它。

### 运行状况检查

`hermes doctor` 在 `model.auth_mode: entra_id` 时，对 `DefaultAzureCredential` 运行 10 秒探测，报告哪个内部凭据获胜（环境变量是否存在、托管身份端点是否可达等）。

`hermes auth` 显示一个结构化的状态块：

```
azure-foundry (Microsoft Entra ID):
  Endpoint: https://my-resource.openai.azure.com/openai/v1
  Scope: https://ai.azure.com/.default
  Status: configured; live token probe is skipped here
```

### 局限性

- **Anthropic 风格端点使用 httpx 事件钩子。** Anthropic Python SDK 不原生接受可调用的 `auth_token`（≤ 0.86.0）。Hermes 在自定义 `httpx.Client` 上安装一个请求事件钩子，该钩子为每个出站请求铸造一个新的 JWT 并重写 `Authorization: Bearer <jwt>`。这在功能上等同于 OpenAI SDK 的原生 `Callable[[], str]` 约定，但增加了一个间接层。如果 Anthropic SDK 在未来版本中添加了对可调用身份验证的原生支持，Hermes 将透明地切换到它。
- **批处理作业和 `multiprocessing.Pool`。** Entra 令牌提供程序是一个闭包，无法跨进程边界进行序列化（pickle）。`batch_runner.py` 会自动从工作进程配置中移除可调用对象，并让每个工作进程根据 `config.yaml` 重建自己的提供程序 — 无需用户操作，但每个工作进程在启动时都需支付一次链遍历。
- **`auth.json` 中不持久化承载 JWT。** Hermes 不复制 `azure-identity` 的内部令牌缓存；冷启动在首次推理时遍历凭据链。

## 配置（写入 `config.yaml`）

运行向导后，您将看到类似如下内容：

```yaml
model:
  provider: azure-foundry
  base_url: https://my-resource.openai.azure.com/openai/v1
  api_mode: chat_completions         # 或 "anthropic_messages"
  default: gpt-5.4-mini              # 您的部署名称 / 模型名称
  context_length: 400000             # 自动检测
```

以及在 `~/.hermes/.env` 文件中：

```
AZURE_FOUNDRY_API_KEY=<your-azure-key>
```

## OpenAI 风格端点（GPT、Llama 等）

Azure OpenAI 的 v1 GA 端点接受标准的 `openai` Python 客户端，只需进行少量更改：

```yaml
model:
  provider: azure-foundry
  base_url: https://my-resource.openai.azure.com/openai/v1
  api_mode: chat_completions
  default: gpt-5.4
```

重要行为：

- **GPT-5.x、Codex 和 o 系列模型会自动路由到 Responses API。** Microsoft Foundry 将 GPT-5 / codex / o1 / o3 / o4 模型部署为仅限 Responses API——对它们调用 `/chat/completions` 会返回 `400 "The requested operation is unsupported."`。Hermes 会根据模型名称自动检测这些模型系列，并透明地将 `api_mode` 升级为 `codex_responses`，即使 `config.yaml` 中仍显示为 `api_mode: chat_completions`。GPT-4、GPT-4o、Llama、Mistral 和其他部署仍保持使用 `/chat/completions`。
- **`max_completion_tokens` 会自动使用。** Azure OpenAI（与直接 OpenAI 类似）要求 gpt-4o、o 系列和 gpt-5.x 模型使用 `max_completion_tokens`。Hermes 会根据端点自动发送正确的参数。
- **需要 `api-version` 的旧版端点。** 如果您有旧的基 URL，例如 `https://<resource>.openai.azure.com/openai?api-version=2025-04-01-preview`，Hermes 会提取查询字符串，并通过 `default_query` 在每个请求中转发它（否则 OpenAI SDK 在连接路径时会丢弃它）。

## Anthropic 风格端点（通过 Microsoft Foundry 的 Claude）

对于 Claude 部署，请使用 Anthropic 风格路由：

```yaml
model:
  provider: azure-foundry
  base_url: https://my-resource.services.ai.azure.com/anthropic
  api_mode: anthropic_messages
  default: claude-sonnet-4-6
```

重要行为：

- **`/v1` 会从基 URL 中移除。** Anthropic SDK 会在每个请求 URL 后追加 `/v1/messages`——Hermes 会在将 URL 传递给 SDK 之前移除所有尾部的 `/v1`，以避免产生双 `/v1` 路径。
- **`api-version` 通过 `default_query` 发送，而不是附加到 URL。** Azure Anthropic 需要一个 `api-version` 查询字符串。将其烘焙到基 URL 中会产生类似 `/anthropic?api-version=.../v1/messages` 的畸形路径，并返回 404。Hermes 改为通过 Anthropic SDK 的 `default_query` 传递 `api-version=2025-04-15`。
- **使用 Bearer 认证而非 `x-api-key`。** Azure 的 Anthropic 兼容路由需要 `Authorization: Bearer <key>` 头，而不是 Anthropic 原生的 `x-api-key` 头。Hermes 会在基 URL 中检测 `azure.com`，并通过 SDK 的 `auth_token` 字段路由 API 密钥，以确保正确的头部传递到上游。
- **保留 1M 上下文窗口测试版头部。** Azure 仍然通过 `anthropic-beta: context-1m-2025-08-07` 头来限制 1M 令牌的 Claude 上下文（Opus 4.6/4.7，Sonnet 4.6）。Hermes 在 Azure 路径上保留该测试版头部（它会从原生 Anthropic OAuth 请求中剥离，因为某些订阅会拒绝它，但 Azure 需要它）。
- **禁用 OAuth 令牌刷新。** Azure 部署使用静态 API 密钥。应用于 Anthropic 控制台的 `~/.claude/.credentials.json` OAuth 令牌刷新循环会明确跳过 Azure 端点，以防止 Claude Code OAuth 令牌在会话中覆盖您的 Azure 密钥。

## 替代方案：`provider: anthropic` + Azure 基 URL

如果您已经配置了 `provider: anthropic`，并且只是想将其指向 Microsoft Foundry 以使用 Claude，您可以完全跳过 `azure-foundry` 提供程序：

```yaml
model:
  provider: anthropic
  base_url: https://my-resource.services.ai.azure.com/anthropic
  key_env: AZURE_ANTHROPIC_KEY
  default: claude-sonnet-4-6
```

并在 `~/.hermes/.env` 中设置 `AZURE_ANTHROPIC_KEY`。Hermes 会在基 URL 中检测到 `azure.com`，并绕过 Claude Code OAuth 令牌链，直接使用 Azure 密钥进行 `x-api-key` 认证。

`key_env` 是规范的蛇形字段名称；`api_key_env`（以及驼峰式的 `keyEnv` / `apiKeyEnv`）作为别名被接受。如果同时设置了 `key_env` 和 `AZURE_ANTHROPIC_KEY`/`ANTHROPIC_API_KEY`，则 `key_env` 指定的环境变量优先。

## 模型发现

Azure **不**提供纯 API 密钥端点来列出您*已部署*的模型部署。部署枚举需要 Azure Resource Manager 认证（`az cognitiveservices account deployment list`）和 Azure AD 主体，而不是推理 API 密钥。

Hermes 可以做到的是：

- Azure OpenAI v1 端点（`<resource>.openai.azure.com/openai/v1`）暴露 `GET /models`，其中包含该资源的**可用**模型目录。Hermes 使用此列表来预填充模型选择器。
- Microsoft Foundry `/anthropic` 路由：通过 URL 路径检测，模型名称需手动输入。
- 私有/受防火墙保护的端点：手动输入，并显示友好的"无法探测"消息。

您始终可以直接输入部署名称——Hermes 不会针对返回的列表进行验证。

## 环境变量

| 变量 | 用途 |
|----------|---------|
| `AZURE_FOUNDRY_API_KEY` | Microsoft Foundry / Azure OpenAI 的主 API 密钥（api_key 模式） |
| `AZURE_FOUNDRY_BASE_URL` | 端点 URL（通过 `hermes model` 设置；环境变量用作后备） |
| `AZURE_ANTHROPIC_KEY` | 由 `provider: anthropic` + Azure 基 URL 使用（替代 `ANTHROPIC_API_KEY`） |
| `AZURE_TENANT_ID` | 用于服务主体流的 Entra ID 租户 |
| `AZURE_CLIENT_ID` | Entra ID 客户端 ID（服务主体、工作负载标识或用户分配的托管标识） |
| `AZURE_CLIENT_SECRET` | 服务主体密钥 |
| `AZURE_CLIENT_CERTIFICATE_PATH` | 服务主体证书（替代密钥） |
| `AZURE_FEDERATED_TOKEN_FILE` | 工作负载标识联合令牌路径（AKS） |
| `AZURE_AUTHORITY_HOST` | 主权云授权主机覆盖 |
| `IDENTITY_ENDPOINT` / `MSI_ENDPOINT` | 用于 App Service、Functions 和 Container Apps 的托管标识端点；虚拟机通常改用 IMDS |

Azure SDK 会直接读取 `AZURE_*` 环境变量。除了在 `hermes doctor` 输出中报告哪些源存在外，Hermes 不会检查它们。

## 故障排除

**gpt-5.x 部署出现 401 未授权错误。**
Azure 在 `/chat/completions` 上提供 gpt-5.x 服务，而不是 `/responses`。当 URL 包含 `openai.azure.com` 时，Hermes 会自动处理，但如果您看到带有 `Invalid API key` 正文的 401 错误，请检查您的 `config.yaml` 中的 `api_mode` 是否为 `chat_completions`。

**`/v1/messages?api-version=.../v1/messages` 出现 404 错误。**
这是修复前 Azure Anthropic 设置中 URL 格式错误的问题。请升级 Hermes——`api-version` 参数现在通过 `default_query` 传递，而不是烘焙到基 URL 中，因此 SDK 在 URL 连接期间无法破坏它。

**向导显示"自动检测不完整。"**
该端点同时拒绝了 `/models` 探测和 Anthropic Messages 探测。这在防火墙后或使用 IP 白名单的私有端点中是正常的。请退回到手动 API 模式选择，并输入您的部署名称——一切仍然可以工作，Hermes 只是无法预填充选择器。

**选择了错误的传输方式。**
再次运行 `hermes model`，向导将重新探测。如果探测仍然选择了错误的模式，您可以直接编辑 `config.yaml`：

```yaml
model:
  provider: azure-foundry
  api_mode: anthropic_messages   # 或 chat_completions
```

**Entra ID："凭证链耗尽"或切换到 `auth_mode: entra_id` 后出现 401 未授权错误。**
- 运行 `az login` 以刷新您的开发者会话（缓存的令牌可能已过期）。
- 验证 `Azure AI User`（或 `Foundry User`）角色分配是否已生效：`az role assignment list --assignee <user-or-identity-id>` 应列出您的 Foundry 资源上的角色。角色传播最多可能需要 5 分钟。
- 对于用户分配的托管标识，请仔细检查 `AZURE_CLIENT_ID` 是否与计算资源上附加的标识匹配。
- 运行 `hermes doctor`——Azure Entra 探测会报告令牌获取是否成功，并包含修复提示。

**Entra ID：向导预检挂起或超时。**
10 秒预检是一个软检查。选择"仍然保存，稍后验证"，然后在部署到目标环境后运行 `hermes doctor`。常见原因包括令牌服务不可达或本地登录状态过时——在 CI 中首选工作负载标识，使用服务主体时设置 `AZURE_TENANT_ID`+`AZURE_CLIENT_ID`+`AZURE_CLIENT_SECRET`，或在本地开发时运行 `az login`。

**使用 Entra ID 时 Anthropic 风格端点出现 401 错误。**
验证在 Foundry 资源上分配了相同的 `Azure AI User`（或 `Foundry User`）角色（它同时涵盖 `/openai/v1` 和 `/anthropic` 路径）。如果 OpenAI 风格探测在向导期间有效，但 `claude-*` 请求在运行时失败，最常见的原因是之前向导运行遗留的过时 `model.entra.scope`——请从 `config.yaml` 中删除 `entra.scope` 行，以便运行时退回到默认的 `https://ai.azure.com/.default` 范围。

## 相关链接

- [环境变量](/reference/environment-variables)
- [配置](/user-guide/configuration)
- [AWS Bedrock](/guides/aws-bedrock) — 另一个主要的云提供商集成
- [Microsoft：为 Foundry 配置 Entra ID](https://learn.microsoft.com/azure/ai-foundry/foundry-models/how-to/configure-entra-id) — 无密钥路径的上游文档