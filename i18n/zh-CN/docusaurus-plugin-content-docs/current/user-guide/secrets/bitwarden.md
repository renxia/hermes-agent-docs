# Bitwarden 密钥管理器

在进程启动时从 [Bitwarden 密钥管理器](https://bitwarden.com/products/secrets-manager/) 拉取 API 密钥，而不是将其以明文形式存储在 `~/.hermes/.env` 中。一个引导密钥（一个机器账户访问令牌）替代了 N 个供应商密钥，轮换凭证只需在 Bitwarden 网页应用中进行一次更改。

## 工作原理

1.  您在 Bitwarden 密钥管理器中创建一个 **机器账户**，授予其对一个项目的读取权限，并生成一个 **访问令牌**。
2.  Hermes 将该单个令牌存储在 `~/.hermes/.env` 中，变量名为 `BWS_ACCESS_TOKEN`。
3.  每次 `hermes`（或网关，或定时任务）启动时，在 `~/.hermes/.env` 加载后，Hermes 调用 `bws secret list <project_id>` 并将返回的密钥设置到 `os.environ` 中。
4.  默认情况下，Hermes 会 **覆盖** 您环境中已有的值，因此 Bitwarden 是唯一的权威来源 —— 在网页应用中轮换一次密钥，每个 Hermes 进程在下次启动时都会获取到。如果您希望让 `.env` 文件胜出，可以在配置中将 `override_existing` 设置为 `false`。

首次使用时，`bws` 二进制文件会自动下载到 `~/.hermes/bin/` —— 无需 `apt`、`brew` 或 `sudo`。

## 为什么使用机器账户（以及为什么没有 2FA 提示）

Bitwarden 密钥管理器专为非交互式工作负载设计：机器账户无法进行双重身份验证，因为没有人类参与。访问令牌就是凭证。任何拥有它的人都可以读取该机器账户有权限访问的所有密钥，因此请像对待高价值的不记名令牌一样对待它 —— 将其存储在 `.env`（而不是 `config.yaml`）中，如果泄露，请立即从 Bitwarden 网页应用吊销并重新生成。

您在 *网页应用* 中设置机器账户，在那里应用您的常规双重身份验证。之后，令牌就是自主运行的。

## 设置

### 1. 创建机器账户和访问令牌

在 [Bitwarden 网页应用](https://vault.bitwarden.com) 中（或欧盟账户使用 [vault.bitwarden.eu](https://vault.bitwarden.eu)）：

1.  从产品切换器切换到 **密钥管理器**。
2.  创建或选择一个 **项目**（例如“Hermes keys”）。
3.  将您的供应商密钥添加为密钥。密钥的 **名称** 将成为环境变量名 —— 使用 `OPENROUTER_API_KEY`、`ANTHROPIC_API_KEY` 等。
4.  **机器账户 → 新建机器账户 → 我的 Hermes 机器** → **项目** 选项卡 → 授予对您项目的读取权限。
5.  **访问令牌** 选项卡 → **创建访问令牌** → **永不** 过期（或选择一个日期）→ 复制令牌（以 `0.` 开头）。Bitwarden 无法再次检索它 —— 请妥善保存副本。

密钥管理器包含在 Bitwarden 免费层中，但有限制；无需付费计划即可试用。

### 2. 运行向导

```bash
hermes secrets bitwarden setup
```

它将：

1.  下载并验证 `bws v2.0.0` 到 `~/.hermes/bin/bws`。
2.  提示您输入访问令牌（输入被隐藏）。存储在 `~/.hermes/.env` 中，变量名为 `BWS_ACCESS_TOKEN`。
3.  询问您的机器账户属于哪个 Bitwarden 区域 —— **美国云**、**欧盟云**、或 **自托管 / 自定义 URL**。存储在 `config.yaml` 中，键为 `secrets.bitwarden.server_url`，并作为 `BWS_SERVER_URL` 传递给 `bws`。
4.  列出机器账户可见的项目；选择一个。存储在 `config.yaml` 中，键为 `secrets.bitwarden.project_id`。
5.  测试拉取项目的密钥，并向您显示将解析的环境变量。
6.  将 `secrets.bitwarden.enabled` 设置为 `true`。

也支持通过标志进行非交互式设置：

```bash
hermes secrets bitwarden setup \
  --access-token "$BWS_ACCESS_TOKEN" \
  --server-url https://vault.bitwarden.eu \
  --project-id <project-uuid>
```

### 3. 确认

```bash
hermes secrets bitwarden status
```

从此以后，每次 `hermes` 调用都会在启动时拉取最新密钥。您会在进程首次应用密钥时，在 stderr 中看到一行摘要。

## 命令行界面

| 命令 | 功能 |
|---|---|
| `hermes secrets bitwarden setup` | 交互式向导（安装二进制文件、提示输入令牌、选择项目、测试拉取） |
| `hermes secrets bitwarden status` | 显示配置 + 二进制文件版本 + 令牌是否存在 |
| `hermes secrets bitwarden sync` | 模拟运行：立即拉取密钥并显示将应用的内容 |
| `hermes secrets bitwarden sync --apply` | 拉取并导出到当前 shell 的环境变量 |
| `hermes secrets bitwarden install` | 仅下载固定的 `bws` 二进制文件（无需认证） |
| `hermes secrets bitwarden disable` | 将 `enabled` 设置为 `false`；保留令牌和项目 ID |

## 配置

`~/.hermes/config.yaml` 中的默认值：

```yaml
secrets:
  bitwarden:
    enabled: false
    access_token_env: BWS_ACCESS_TOKEN
    project_id: ""
    server_url: ""
    cache_ttl_seconds: 300
    override_existing: true
    auto_install: true
```

| 键 | 默认值 | 功能 |
|---|---|---|
| `enabled` | `false` | 主开关。为 false 时，从不联系 Bitwarden。 |
| `access_token_env` | `BWS_ACCESS_TOKEN` | 存放引导令牌的环境变量名。如果您已将 `BWS_ACCESS_TOKEN` 用于其他用途，请更改此项。 |
| `project_id` | `""` | 要同步的项目的 UUID。 |
| `server_url` | `""` | Bitwarden 区域或自托管端点。留空 = `bws` 默认值（美国云，`https://vault.bitwarden.com`）。欧盟云请设置为 `https://vault.bitwarden.eu`，自托管则使用您自己的 URL。作为 `BWS_SERVER_URL` 传递给 `bws` 子进程。 |
| `cache_ttl_seconds` | `300` | 进程内拉取结果的缓存重用时间。设置为 `0` 以禁用缓存。缓存是每个进程独立的；新的 `hermes` 调用会从头开始。 |
| `override_existing` | `true` | 为 true 时，Bitwarden 的值会覆盖环境中已有的任何值（因此在网页应用中进行轮换才会真正生效）。如果您希望本地让 `.env` / shell 导出胜出，请设置为 `false`。 |
| `auto_install` | `true` | 为 true 时，首次使用会自动将 `bws` 下载到 `~/.hermes/bin/`。 |

## 故障模式

Bitwarden 永远不会阻塞 Hermes 启动。如果出现任何问题，您会在 stderr 中看到一行警告，然后 Hermes 继续使用 `.env` 中已有的凭证：

| 症状 | 原因 | 解决方法 |
|---|---|---|
| `BWS_ACCESS_TOKEN is not set` | 在配置中启用了，但令牌已从 `.env` 中清除 | 重新运行 `hermes secrets bitwarden setup` |
| `bws exited 1: invalid access token` | 令牌已被吊销或错误 | 生成新令牌，重新运行 setup |
| `[400 Bad Request] {"error":"invalid_client"}` | 令牌属于非 `bws` 调用的 Bitwarden 区域（例如，欧盟令牌访问了美国身份端点） | 重新运行 setup 并选择正确的区域，或将 `secrets.bitwarden.server_url` 设置为 `https://vault.bitwarden.eu`（或您的自托管 URL） |
| `bws timed out` | 网络被阻断或 Bitwarden API 响应慢 | 检查到 `api.bitwarden.com`（或您的 `server_url`）的连通性 |
| `bws binary not available` | `auto_install: false` 且 `bws` 不在 PATH 中 | 从 [github.com/bitwarden/sdk-sm/releases](https://github.com/bitwarden/sdk-sm/releases) 手动安装，或将 `auto_install` 重新打开 |
| `Checksum mismatch` | 下载损坏或被篡改 | 重新运行，将重试；如果持续发生，请提交 issue |

## 安全说明

- 引导令牌（`BWS_ACCESS_TOKEN`）本身是敏感的 —— 任何拥有它的人都可以读取该机器账户有权限访问的所有密钥。请像对待任何其他 API 密钥一样对待它。
- 即使设置了 `override_existing: true`，Hermes 也会拒绝让 Bitwarden 覆盖引导令牌本身。如果您将 `BWS_ACCESS_TOKEN` 作为密钥存储在项目中，它在应用时会被静默跳过。
- `bws` 二进制文件的下载会通过同一 GitHub 发布版本中公布的 SHA-256 校验和进行验证。校验和不匹配会中止安装。
- 固定的版本（撰写时为 `bws v2.0.0`）通过向此仓库提交 PR 进行更新 —— Hermes 不会自动将 `bws` 升级到“最新版”，因为上游发布版本的形式可能会改变。

## 不适用此方案的情况

- **单机个人设置**，`~/.hermes/.env` 足够用。您只是用一个凭证换另一个凭证，并在启动时增加了网络依赖。
- **无法访问 `api.bitwarden.com`** 的离线环境。
- **CI/CD** 中已设置好现有的密钥注入机制（GitHub Actions secrets、Vault 等）—— 选择一条路径，而不是两条。

此方案的理想场景是多机集群、共享开发机器、网关 VPS，或任何您希望跨多个 Hermes 安装实例进行集中轮换和吊销的设置。