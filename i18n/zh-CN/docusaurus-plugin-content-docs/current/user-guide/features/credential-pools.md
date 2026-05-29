---
title: 凭证池
description: 为每个提供商池化多个API密钥或OAuth令牌，以实现自动轮换和速率限制恢复。
sidebar_label: 凭证池
sidebar_position: 9
---

# 凭证池

凭证池允许您为同一提供商注册多个API密钥或OAuth令牌。当某个密钥达到速率限制或账单配额时，Hermes 会自动轮换到下一个健康的密钥——保持您的会话存活，无需切换提供商。

这与[备用提供商](./fallback-providers.md)不同，后者会切换到一个*完全不同的*提供商。凭证池是同一提供商内的轮换；备用提供商是跨提供商的故障转移。系统会首先尝试池中的密钥——如果所有池密钥都已耗尽，*然后*备用提供商才会激活。

:::tip
凭证池主要适用于API密钥提供商（如OpenRouter、Anthropic）。单个 [Nous Portal](/integrations/nous-portal) OAuth 可涵盖 300 多个模型，因此在 Portal 上大多数用户不需要凭证池。
:::

## 工作原理

```
您的请求
  → 从池中选取密钥（轮询 / 最少使用 / 优先填充 / 随机）
  → 发送至提供商
  → 429 速率限制？
      → 使用同一密钥重试一次（瞬时波动）
      → 第二次 429 → 轮换到池中的下一个密钥
      → 所有密钥耗尽 → 备用模型（不同提供商）
  → 402 账单错误？
      → 立即轮换到池中的下一个密钥（24小时冷却期）
  → 401 授权过期？
      → 尝试刷新令牌（OAuth）
      → 刷新失败 → 轮换到池中的下一个密钥
  → 成功 → 正常继续
```

## 快速入门

如果您已经在 `.env` 文件中设置了 API 密钥，Hermes 会自动将其发现为一个 1 密钥的池。要从池化中受益，请添加更多密钥：

```bash
# 添加第二个 OpenRouter 密钥
hermes auth add openrouter --api-key sk-or-v1-your-second-key

# 添加第二个 Anthropic 密钥
hermes auth add anthropic --type api-key --api-key sk-ant-api03-your-second-key

# 添加一个 Anthropic OAuth 凭证（需要 Claude Max 计划 + 额外用量额度）
hermes auth add anthropic --type oauth
# 将打开浏览器进行 OAuth 登录
```

检查您的池：

```bash
hermes auth list
```

输出：
```
openrouter (2 个凭证):
  #1  OPENROUTER_API_KEY   api_key env:OPENROUTER_API_KEY ←
  #2  backup-key           api_key manual

anthropic (3 个凭证):
  #1  hermes_pkce          oauth   hermes_pkce ←
  #2  claude_code          oauth   claude_code
  #3  ANTHROPIC_API_KEY    api_key env:ANTHROPIC_API_KEY
```

`←` 标记了当前选中的凭证。

## 交互式管理

运行不带子命令的 `hermes auth` 可启动交互式向导：

```bash
hermes auth
```

这会显示您的完整池状态并提供一个菜单：

```
您想做什么？
  1. 添加凭证
  2. 移除凭证
  3. 为提供商重置冷却期
  4. 为提供商设置轮换策略
  5. 退出
```

对于同时支持 API 密钥和 OAuth 的提供商（Anthropic, Nous, Codex），添加流程会询问您选择哪种类型：

```
anthropic 同时支持 API 密钥和 OAuth 登录。
  1. API 密钥（从提供商控制台粘贴一个密钥）
  2. OAuth 登录（通过浏览器进行身份验证）
输入 [1/2]:
```

## CLI 命令

| 命令 | 描述 |
|---------|-------------|
| `hermes auth` | 交互式池管理向导 |
| `hermes auth list` | 显示所有池和凭证 |
| `hermes auth list <provider>` | 显示特定提供商的池 |
| `hermes auth add <provider>` | 添加凭证（会提示输入类型和密钥） |
| `hermes auth add <provider> --type api-key --api-key <key>` | 非交互式添加 API 密钥 |
| `hermes auth add <provider> --type oauth` | 通过浏览器登录添加 OAuth 凭证 |
| `hermes auth remove <provider> <index>` | 通过从 1 开始的索引移除凭证 |
| `hermes auth reset <provider>` | 清除所有冷却期/耗尽状态 |

## 轮换策略

通过 `hermes auth` → "设置轮换策略" 或在 `config.yaml` 中配置：

```yaml
credential_pool_strategies:
  openrouter: round_robin
  anthropic: least_used
```

| 策略 | 行为 |
|----------|----------|
| `fill_first` (默认) | 使用第一个健康的密钥，直到其耗尽，然后移动到下一个 |
| `round_robin` | 均匀地轮换密钥，每次选择后轮换 |
| `least_used` | 总是选择请求计数最低的密钥 |
| `random` | 在健康的密钥中随机选择 |

## 错误恢复

池对不同错误的处理方式不同：

| 错误 | 行为 | 冷却期 |
|-------|----------|----------|
| **429 速率限制** | 使用同一密钥重试一次（瞬时）。连续第二次 429 则轮换到下一个密钥 | 1 小时 |
| **402 账单/配额** | 立即轮换到下一个密钥 | 24 小时 |
| **401 授权过期** | 首先尝试刷新 OAuth 令牌。仅在刷新失败时才轮换 | — |
| **所有密钥耗尽** | 如果配置了，穿透到 `fallback_model` | — |

`has_retried_429` 标志在每次成功的 API 调用时重置，因此单次瞬时的 429 不会触发轮换。

## 自定义端点池

自定义的 OpenAI 兼容端点（如 Together.ai、RunPod、本地服务器）拥有它们自己的池，以 config.yaml 中 `custom_providers` 里的端点名称为键。

当您通过 `hermes model` 设置自定义端点时，它会自动生成一个名称，如 "Together.ai" 或 "Local (localhost:8080)"。这个名称就成为了池的键。

```bash
# 通过 hermes model 设置自定义端点后：
hermes auth list
# 显示：
#   Together.ai (1 个凭证):
#     #1  config key    api_key config:Together.ai ←

# 为同一端点添加第二个密钥：
hermes auth add Together.ai --api-key sk-together-second-key
```

自定义端点池存储在 `auth.json` 的 `credential_pool` 下，并带有 `custom:` 前缀：

```json
{
  "credential_pool": {
    "openrouter": [...],
    "custom:together.ai": [...]
  }
}
```

## 自动发现

Hermes 在启动时会自动从多个来源发现凭证并初始化池：

| 来源 | 示例 | 自动初始化？ |
|--------|---------|-------------|
| 环境变量 | `OPENROUTER_API_KEY`、`ANTHROPIC_API_KEY` | 是 |
| OAuth 令牌 (auth.json) | Codex 设备代码、Nous 设备代码 | 是 |
| Claude Code 凭证 | `~/.claude/.credentials.json` | 是 (Anthropic) |
| Hermes PKCE OAuth | `~/.hermes/auth.json` | 是 (Anthropic) |
| 自定义端点配置 | config.yaml 中的 `model.api_key` | 是 (自定义端点) |
| 手动条目 | 通过 `hermes auth add` 添加 | 持久化在 auth.json 中 |

自动初始化的条目在每次池加载时都会更新——如果您移除一个环境变量，其对应的池条目会自动被清理。手动条目（通过 `hermes auth add` 添加）永远不会被自动清理。

借用的运行时密钥（例如环境变量、Bitwarden/Vault/密钥环/systemd 引用和自定义配置值）在 `auth.json` 边界处仅为引用。Hermes 可以在内存中使用解析后的值进行当前运行，但它只持久化元数据，如来源引用、标签、状态、请求计数器和不可逆的哈希指纹。手动条目和 Hermes 拥有的 OAuth/设备代码状态会保留它们刷新所需的持久令牌。

## 委派与子智能体共享

当智能体通过 `delegate_task` 生成子智能体时，父级的凭证池会自动与子智能体共享：

- **同一提供商** — 子智能体接收父级的完整池，使其能够在速率限制时轮换密钥
- **不同提供商** — 子智能体加载该提供商自己的池（如果已配置）
- **未配置池** — 子智能体回退到继承的单个 API 密钥

这意味着子智能体受益于与父级相同的速率限制弹性，无需额外配置。按任务进行的凭证租赁确保子智能体在并发轮换密钥时不会相互冲突。

## 线程安全

凭证池对所有状态变更（`select()`、`mark_exhausted_and_rotate()`、`try_refresh_current()`、`mark_used()`）使用线程锁。这确保了当网关同时处理多个聊天会话时，并发访问的安全性。

## 架构

完整的数据流图请参见仓库中的 [`docs/credential-pool-flow.excalidraw`](https://excalidraw.com/#json=2Ycqhqpi6f12E_3ITyiwh,c7u9jSt5BwrmiVzHGbm87g)。

凭证池集成在提供商解析层：

1. **`agent/credential_pool.py`** — 池管理器：存储、选择、轮换、冷却期
2. **`hermes_cli/auth_commands.py`** — CLI 命令和交互式向导
3. **`hermes_cli/runtime_provider.py`** — 感知池的凭证解析
4. **`run_agent.py`** — 错误恢复：429/402/401 → 池轮换 → 备用

## 存储

池状态存储在 `~/.hermes/auth.json` 的 `credential_pool` 键下：

```json
{
  "version": 1,
  "credential_pool": {
    "openrouter": [
      {
        "id": "abc123",
        "label": "OPENROUTER_API_KEY",
        "auth_type": "api_key",
        "priority": 0,
        "source": "env:OPENROUTER_API_KEY",
        "secret_source": "bitwarden",
        "secret_fingerprint": "sha256:12ab34cd56ef7890",
        "last_status": "ok",
        "request_count": 142
      }
    ],
    "anthropic": [
      {
        "id": "manual1",
        "label": "personal-api-key",
        "auth_type": "api_key",
        "priority": 0,
        "source": "manual",
        "access_token": "sk-ant-api03-..."
      }
    ]
  }
}
```

上面的 OpenRouter 条目是从外部来源借用的，因此原始密钥不存储在 `auth.json` 中。手动的 Anthropic 条目是特意添加到 Hermes 的凭证存储中的，因此其令牌是可持久化的。

策略存储在 `config.yaml` 中（不是 `auth.json`）：

```yaml
credential_pool_strategies:
  openrouter: round_robin
  anthropic: least_used
```