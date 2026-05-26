---
title: 凭证池
description: 为每个供应商配置多个API密钥或OAuth令牌，实现自动轮换与频率限制恢复。
sidebar_label: 凭证池
sidebar_position: 9
---

# 凭证池

凭证池允许您为同一供应商注册多个API密钥或OAuth令牌。当某个密钥达到频率限制或账单配额时，Hermes会自动轮换到下一个健康的密钥——无需切换供应商即可保持会话存活。

这与[备用供应商](./fallback-providers.md)不同，后者会切换到一个*完全不同的*供应商。凭证池是同供应商轮换；备用供应商是跨供应商故障转移。会优先尝试池——如果所有池密钥都已耗尽，*然后*备用供应商才会激活。

## 工作原理

```
您的请求
  → 从池中选取密钥 (round_robin / least_used / fill_first / random)
  → 发送至供应商
  → 429 频率限制？
      → 重试同一密钥一次 (瞬时波动)
      → 第二次 429 → 轮换至下一个池密钥
      → 所有密钥耗尽 → fallback_model (不同供应商)
  → 402 账单错误？
      → 立即轮换至下一个池密钥 (24小时冷却)
  → 401 认证过期？
      → 尝试刷新令牌 (OAuth)
      → 刷新失败 → 轮换至下一个池密钥
  → 成功 → 正常继续
```

## 快速开始

如果您已在 `.env` 中设置了API密钥，Hermes会将其自动发现为单密钥池。要利用池功能，请添加更多密钥：

```bash
# 添加第二个 OpenRouter 密钥
hermes auth add openrouter --api-key sk-or-v1-your-second-key

# 添加第二个 Anthropic 密钥
hermes auth add anthropic --type api-key --api-key sk-ant-api03-your-second-key

# 添加一个 Anthropic OAuth 凭证 (需要 Claude Max 计划 + 额外使用额度)
hermes auth add anthropic --type oauth
# 打开浏览器进行 OAuth 登录
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

`←` 标记了当前选定的凭证。

## 交互式管理

不带子命令运行 `hermes auth` 可启动交互式向导：

```bash
hermes auth
```

这会显示您的完整池状态并提供一个菜单：

```
您想做什么？
  1. 添加凭证
  2. 移除凭证
  3. 重置供应商的冷却时间
  4. 设置供应商的轮换策略
  5. 退出
```

对于同时支持API密钥和OAuth的供应商（如Anthropic、Nous、Codex），添加流程会询问类型：

```
anthropic 同时支持 API 密钥和 OAuth 登录。
  1. API 密钥 (粘贴供应商控制台的密钥)
  2. OAuth 登录 (通过浏览器认证)
输入 [1/2]:
```

## CLI 命令

| 命令 | 描述 |
|---------|-------------|
| `hermes auth` | 交互式池管理向导 |
| `hermes auth list` | 显示所有池和凭证 |
| `hermes auth list <provider>` | 显示特定供应商的池 |
| `hermes auth add <provider>` | 添加凭证 (提示输入类型和密钥) |
| `hermes auth add <provider> --type api-key --api-key <key>` | 非交互式添加API密钥 |
| `hermes auth add <provider> --type oauth` | 通过浏览器登录添加OAuth凭证 |
| `hermes auth remove <provider> <index>` | 按1为基数的索引移除凭证 |
| `hermes auth reset <provider>` | 清除所有冷却/耗尽状态 |

## 轮换策略

通过 `hermes auth` → "设置轮换策略" 或在 `config.yaml` 中配置：

```yaml
credential_pool_strategies:
  openrouter: round_robin
  anthropic: least_used
```

| 策略 | 行为 |
|----------|----------|
| `fill_first` (默认) | 使用第一个健康的密钥直到耗尽，然后转向下一个 |
| `round_robin` | 均匀循环使用密钥，每次选择后轮换 |
| `least_used` | 始终选择请求计数最低的密钥 |
| `random` | 在健康的密钥中随机选择 |

## 错误恢复

池针对不同错误采用不同处理方式：

| 错误 | 行为 | 冷却时间 |
|-------|----------|----------|
| **429 频率限制** | 重试同一密钥一次 (瞬时)。连续第二次 429 轮换至下一个密钥 | 1小时 |
| **402 账单/配额** | 立即轮换至下一个密钥 | 24小时 |
| **401 认证过期** | 首先尝试刷新OAuth令牌。仅在刷新失败时轮换 | — |
| **所有密钥耗尽** | 如果配置了，将回退到 `fallback_model` | — |

`has_retried_429` 标志在每次成功的API调用后重置，因此单个瞬时429不会触发轮换。

## 自定义端点池

自定义的OpenAI兼容端点（如Together.ai、RunPod、本地服务器）会获得自己的池，其键名来自 config.yaml 中 `custom_providers` 的端点名称。

当您通过 `hermes model` 设置自定义端点时，它会自动生成一个名称，如 "Together.ai" 或 "Local (localhost:8080)"。此名称成为池键名。

```bash
# 通过 hermes model 设置自定义端点后：
hermes auth list
# 显示：
#   Together.ai (1 个凭证):
#     #1  config key    api_key config:Together.ai ←

# 为同一端点添加第二个密钥：
hermes auth add Together.ai --api-key sk-together-second-key
```

自定义端点池存储在 `auth.json` 的 `credential_pool` 下，带有 `custom:` 前缀：

```json
{
  "credential_pool": {
    "openrouter": [...],
    "custom:together.ai": [...]
  }
}
```

## 自动发现

Hermes 会自动从多个来源发现凭证，并在启动时填充池：

| 来源 | 示例 | 自动填充? |
|--------|---------|-------------|
| 环境变量 | `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY` | 是 |
| OAuth 令牌 (auth.json) | Codex 设备码, Nous 设备码 | 是 |
| Claude Code 凭证 | `~/.claude/.credentials.json` | 是 (Anthropic) |
| Hermes PKCE OAuth | `~/.hermes/auth.json` | 是 (Anthropic) |
| 自定义端点配置 | config.yaml 中的 `model.api_key` | 是 (自定义端点) |
| 手动条目 | 通过 `hermes auth add` 添加 | 持久化在 auth.json 中 |

自动填充的条目在每次池加载时更新——如果您移除一个环境变量，其池条目将自动清理。手动条目（通过 `hermes auth add` 添加）永远不会被自动清理。

借用的运行时密钥（例如环境变量、Bitwarden/Vault/钥匙串/systemd 引用以及自定义配置值）在 `auth.json` 边界处仅为引用。Hermes 可以在内存中使用解析后的值用于当前运行，但只持久化元数据，例如源引用、标签、状态、请求计数器和不可逆的指纹。手动条目和 Hermes 拥有的 OAuth/设备码状态保留其刷新所需的持久令牌。

## 委托与子智能体共享

当智能体通过 `delegate_task` 生成子智能体时，父级的凭证池会自动与子级共享：

- **同一供应商** — 子级接收父级的完整池，实现频率限制下的密钥轮换
- **不同供应商** — 子级加载该供应商自己的池（如果已配置）
- **未配置池** — 子级回退到继承的单个API密钥

这意味着子智能体受益于与父级相同的频率限制弹性，无需额外配置。按任务的凭证租赁确保子级在并发轮换密钥时不会相互冲突。

## 线程安全

凭证池使用线程锁保护所有状态变异（`select()`、`mark_exhausted_and_rotate()`、`try_refresh_current()`、`mark_used()`）。这确保了当网关同时处理多个聊天会话时，可以安全地并发访问。

## 架构

完整的数据流图，请参阅仓库中的 [`docs/credential-pool-flow.excalidraw`](https://excalidraw.com/#json=2Ycqhqpi6f12E_3ITyiwh,c7u9jSt5BwrmiVzHGbm87g)。

凭证池在供应商解析层集成：

1. **`agent/credential_pool.py`** — 池管理器：存储、选择、轮换、冷却
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

上面的 OpenRouter 条目是从外部来源借用的，因此原始密钥不存储在 `auth.json` 中。手动添加的 Anthropic 条目是特意添加到 Hermes 凭证存储中的，因此其令牌是可持久化的。

策略存储在 `config.yaml`（而非 `auth.json`）中：

```yaml
credential_pool_strategies:
  openrouter: round_robin
  anthropic: least_used
```