---
title: "注册 Microsoft Graph 应用程序"
description: "在 Azure 门户中创建支持 Teams 会议管道的应用程序注册的逐步指南"
---

# 注册 Microsoft Graph 应用程序

Teams 会议管道使用**仅应用**（守护程序）身份验证从 Microsoft Graph 读取会议转录文本、录制文件及相关工件 — 无需用户登录，也无需针对每次会议进行交互式同意。这需要一个 Azure AD 应用程序注册，并授予管理员同意的应用程序权限。

本指南将引导您完成以下步骤：

1. 创建应用程序注册  
2. 创建客户端密钥  
3. 授予管道所需的 Graph API 权限  
4. 管理员同意这些权限  
5. （可选）使用应用程序访问策略将应用限定到特定用户  

您需要**租户管理员权限**（或让管理员代表您授予同意）才能完成此操作。请保存您收集到的值 — 它们最终将写入 `~/.hermes/.env` 文件中。

## 先决条件

- 一个 Microsoft 365 租户，且该租户拥有 Teams Premium 或可生成会议转录文本和录制文件的 Teams 许可证  
- 能够访问 [entra.microsoft.com](https://entra.microsoft.com) 的 Azure 门户管理员权限  
- 一个可从公网访问的 HTTPS 终结点，用于接收 Graph 更改通知（稍后在 Webhook 监听器步骤中设置）

## 步骤 1：创建应用程序注册

1. 以租户管理员身份登录 [entra.microsoft.com](https://entra.microsoft.com)。  
2. 导航至 **身份 → 应用程序 → 应用程序注册**。  
3. 单击 **新建注册**。  
4. 填写以下信息：  
   - **名称：** `Hermes Teams 会议管道`（或任何您能识别的名称）。  
   - **支持的账户类型：** *仅此组织目录中的账户（单租户）*。  
   - **重定向 URI：** 留空 — 仅应用身份验证不需要此字段。  
5. 单击 **注册**。

您将进入该应用的概览页面。请复制以下两个值：

- **应用程序（客户端）ID** → `MSGRAPH_CLIENT_ID`  
- **目录（租户）ID** → `MSGRAPH_TENANT_ID`

## 步骤 2：创建客户端密钥

1. 在左侧导航栏中，打开 **证书和密钥**。  
2. 单击 **新建客户端密钥**。  
3. **描述：** `hermes-graph-secret`。**过期时间：** 选择一个符合您轮换策略的值（通常为 6-24 个月）。  
4. 单击 **添加**。  
5. 立即复制 **值** 列中的内容 — 该值仅显示一次。该值即为 `MSGRAPH_CLIENT_SECRET`。

> **密钥 ID** 列不是密钥本身。您需要的是 **值** 列。

## 步骤 3：授予 Graph API 权限

该管道使用一组最小可行的应用程序权限。仅添加您需要的权限；每项权限都会扩大该应用在租户范围内可读取的内容。

1. 在左侧导航栏中，打开 **API 权限**。  
2. 单击 **添加权限** → **Microsoft Graph** → **应用程序权限**。  
3. 添加下表中的权限，这些权限应与管道要执行的操作相匹配。  
4. 添加完成后，单击 **为 `<您的租户>` 授予管理员同意**。状态列应为每项权限显示绿色对勾标记。

### 转录文本优先摘要所需权限

| 权限 | 该权限允许应用执行的操作 |
|------|--------------------------|
| `OnlineMeetings.Read.All` | 读取 Teams 在线会议元数据（主题、参与者、加入 URL）。 |
| `OnlineMeetingTranscript.Read.All` | 读取 Teams 生成的会议转录文本。 |

### 录制文件回退所需权限（当转录文本不可用时）

| 权限 | 该权限允许应用执行的操作 |
|------|--------------------------|
| `OnlineMeetingRecording.Read.All` | 下载 Teams 会议录制文件以进行离线语音转文本处理。 |
| `CallRecords.Read.All` | 当仅知道加入 URL 时，从通话记录中解析会议。 |

### 出站摘要投递所需权限（仅限 Graph 模式）

如果 `platforms.teams.extra.delivery_mode` 设置为 `graph`，则管道将通过 Graph API 将摘要发布到 Teams 频道或聊天中。如果您使用的是 `incoming_webhook` 投递模式，请跳过以下权限。

| 权限 | 该权限允许应用执行的操作 |
|------|--------------------------|
| `ChannelMessage.Send` | 代表应用向 Teams 频道发布消息。 |
| `Chat.ReadWrite.All` | 向 1:1 聊天和群聊发布消息（仅当您设置 `chat_id` 作为投递目标时）。 |

### 不推荐使用的权限

- `OnlineMeetings.ReadWrite.All` / 不带 `.All` 后缀的 `Chat.ReadWrite` — 权限范围超出管道实际需求。  
- 委托权限 — 管道使用仅应用（客户端凭据）流程；委托权限需要用户登录，因此无法使用。

## 步骤 4：（推荐）使用应用程序访问策略限定应用范围

默认情况下，像 `OnlineMeetings.Read.All` 这样的应用程序权限会授予应用访问租户中**所有**会议的权限。对于合作伙伴演示或开发租户来说，这没有问题；但对于生产环境，您几乎肯定希望限制应用可以读取哪些用户的会议。

Microsoft 为 Teams 专门提供了**应用程序访问策略**来实现此目的。该策略只能通过 PowerShell 使用；Azure 门户中没有对应的用户界面。

在已安装并连接 MicrosoftTeams 模块的管理员 PowerShell 中（`Connect-MicrosoftTeams`）：

```powershell
# 创建一个限定到 Hermes 应用的策略
New-CsApplicationAccessPolicy `
  -Identity "Hermes-Meeting-Pipeline-Policy" `
  -AppIds "<MSGRAPH_CLIENT_ID>" `
  -Description "将 Hermes 会议管道限制为仅允许列表中的用户"

# 将策略授予特定用户，允许管道读取这些用户的会议
Grant-CsApplicationAccessPolicy `
  -PolicyName "Hermes-Meeting-Pipeline-Policy" `
  -Identity "alice@example.com"

Grant-CsApplicationAccessPolicy `
  -PolicyName "Hermes-Meeting-Pipeline-Policy" `
  -Identity "bob@example.com"
```

授予策略后，传播可能需要最多 30 分钟。可通过以下命令验证：

```powershell
Test-CsApplicationAccessPolicy -Identity "alice@example.com" -AppId "<MSGRAPH_CLIENT_ID>"
```

如果没有此策略，则**任何**用户的会议均可被读取 — 这正是该权限在技术上所授予的权限。请勿在生产租户上跳过此步骤。

## 步骤 5：将凭据写入您的环境文件

将您收集到的三个值放入 `~/.hermes/.env` 文件中：

```bash
MSGRAPH_TENANT_ID=<directory-tenant-id>
MSGRAPH_CLIENT_ID=<application-client-id>
MSGRAPH_CLIENT_SECRET=<client-secret-value>
```

设置文件权限，确保只有您可以读取该密钥：

```bash
chmod 600 ~/.hermes/.env
```

## 步骤 6：验证令牌流程

Hermes 提供了一个 Graph 身份验证冒烟测试。在您的 Hermes 安装目录中运行：

```python
python -c "
import asyncio
from tools.microsoft_graph_auth import MicrosoftGraphTokenProvider
provider = MicrosoftGraphTokenProvider.from_env()
token = asyncio.run(provider.get_access_token())
print('令牌已获取，长度：', len(token))
print(provider.inspect_token_health())
"
```

成功运行将打印一个长令牌字符串和一个健康状态字典，显示 `cached: True` 以及接近 3600 的 `expires_in_seconds` 值。失败将产生一个带有 Azure 错误代码的 `MicrosoftGraphTokenError` — 最常见的错误如下：

| Azure 错误 | 含义 | 解决方法 |
|------------|------|----------|
| `AADSTS7000215: 无效的客户端密钥` | 密钥值不匹配或已过期。 | 在步骤 2 中生成新密钥；更新 `.env` 文件。 |
| `AADSTS700016: 找不到应用程序` | `MSGRAPH_CLIENT_ID` 错误或租户错误。 | 再次检查步骤 1 中的值是否来自同一应用。 |
| `AADSTS90002: 找不到租户` | `MSGRAPH_TENANT_ID` 中存在拼写错误。 | 重新从应用概览页面复制目录（租户）ID。 |
| 调用时出现 `insufficient_claims`（而非获取令牌时） | 令牌获取成功，但 Graph 返回 401/403。 | 您可能跳过了步骤 3 的管理员同意，或添加了权限但未重新同意。请重新访问 API 权限并再次单击 **授予管理员同意**。 |

## 轮换客户端密钥

Azure 客户端密钥具有硬性过期时间。在您的密钥过期之前：

1. 在步骤 2 中创建第二个客户端密钥，不要删除第一个密钥。  
2. 使用新值更新 `~/.hermes/.env` 中的 `MSGRAPH_CLIENT_SECRET`。  
3. 重启网关以使用新密钥：`hermes gateway restart`。  
4. 使用上述冒烟测试进行验证。  
5. 从 Azure 门户中删除旧密钥。

## 后续步骤

一旦凭据验证通过，请继续执行以下步骤：

- **Webhook 监听器设置** — 部署 `msgraph_webhook` 网关平台，用于接收 Graph 更改通知。  
- **管道配置** — 配置 Teams 会议管道运行时和操作员 CLI。  
- **出站投递** — 将摘要发送回 Teams 频道或聊天。

这些页面将与添加相应运行时的 PR 一起提供。此凭据设置是一个独立的前提条件，可以提前安全地完成。