---
title: 凭据池
description: 为每个提供商汇集多个 API 密钥或 OAuth 令牌，以实现自动轮换和速率限制恢复。
sidebar_label: 凭据池
sidebar_position: 9
---

# 凭据池

凭据池允许您为同一提供商注册多个 API 密钥或 OAuth 令牌。当一个密钥触发速率限制或计费配额时，Hermes 会自动切换到下一个健康的密钥——无需切换提供商即可保持您的会话活跃。

这与[备用提供商](./fallback-providers.md)不同，后者会完全切换到*不同的*提供商。凭据池是同一提供商内的轮换；而备用提供商是跨提供商的故障转移。系统会优先尝试凭据池——如果池中的所有密钥都已耗尽，*然后*才会激活备用提供商。

## 工作原理

```
您的请求
  → 从池中选择一个密钥（轮询 / 最少使用 / 先填满 / 随机）
  → 发送到提供商
  → 遇到 429 速率限制？
      → 重试同一密钥一次（瞬时波动）
      → 第二次 429 → 切换到池中的下一个密钥
      → 所有密钥耗尽 → 切换到 fallback_model（不同提供商）
  → 遇到 402 计费错误？
      → 立即切换到池中的下一个密钥（24 小时冷却时间）
  → 遇到 401 认证过期？
      → 尝试刷新令牌（OAuth）
      → 刷新失败 → 切换到池中的下一个密钥
  → 成功 → 正常继续
```

## 快速入门

如果您已经在 `.env` 文件中设置了 API 密钥，Hermes 会将其自动发现为一个单密钥池。要享受凭据池带来的好处，请添加更多密钥：

```bash
# 添加第二个 OpenRouter 密钥
hermes auth add openrouter --api-key sk-or-v1-your-second-key

# 添加第二个 Anthropic 密钥
hermes auth add anthropic --type api-key --api-key sk-ant-api03-your-second-key

# 添加一个 Anthropic OAuth 凭据（需要 Claude Max 计划 + 额外使用额度）
hermes auth add anthropic --type oauth
# 打开浏览器进行 OAuth 登录
```

查看您的凭据池：

```bash
hermes auth list
```

输出：
```
openrouter (2 个凭据):
  #1  OPENROUTER_API_KEY   api_key env:OPENROUTER_API_KEY ←
  #2  backup-key           api_key manual

anthropic (3 个凭据):
  #1  hermes_pkce          oauth   hermes_pkce ←
  #2  claude_code          oauth   claude_code
  #3  ANTHROPIC_API_KEY    api_key env:ANTHROPIC_API_KEY
```

`←` 标记当前选中的凭据。

## 交互式管理

不带子命令运行 `hermes auth` 可进入交互式向导：

```bash
hermes auth
```

这将显示您的完整凭据池状态，并提供一个菜单：

```
您想做什么？
  1. 添加凭据
  2. 移除凭据
  3. 重置某个提供商的冷却时间
  4. 为某个提供商设置轮换策略
  5. 退出
```

对于同时支持 API 密钥和 OAuth 的提供商（Anthropic、Nous、Codex），添加流程会询问类型：

```
anthropic 同时支持 API 密钥和 OAuth 登录。
  1. API 密钥（从提供商控制台粘贴密钥）
  2. OAuth 登录（通过浏览器认证）
请选择 [1/2]:
```

## CLI 命令

| 命令 | 描述 |
|---------|-------------|
| `hermes auth` | 交互式凭据池管理向导 |
| `hermes auth list` | 显示所有凭据池和凭据 |
| `hermes auth list <provider>` | 显示特定提供商的凭据池 |
| `hermes auth add <provider>` | 添加凭据（提示输入类型和密钥） |
| `hermes auth add <provider> --type api-key --api-key <key>` | 非交互式添加 API 密钥 |
| `hermes auth add <provider> --type oauth` | 通过浏览器登录添加 OAuth 凭据 |
| `hermes auth remove <provider> <index>` | 按 1 起始索引移除凭据 |
| `hermes auth reset <provider>` | 清除所有冷却时间/耗尽状态 |

## 轮换策略

可通过 `hermes auth` → “设置轮换策略” 或在 `config.yaml` 中配置：

```yaml
credential_pool_strategies:
  openrouter: round_robin
  anthropic: least_used
```

| 策略 | 行为 |
|----------|----------|
| `fill_first`（默认） | 使用第一个健康密钥直到其耗尽，然后移至下一个 |
| `round_robin` | 均匀循环使用密钥，每次选择后轮换 |
| `least_used` | 始终选择请求计数最低的密钥 |
| `random` | 在健康密钥中随机选择 |

## 错误恢复

凭据池针对不同类型的错误采取不同的处理方式：

| 错误 | 行为 | 冷却时间 |
|-------|----------|----------|
| **429 速率限制** | 重试同一密钥一次（瞬时）。连续第二次 429 则切换到下一个密钥 | 1 小时 |
| **402 计费/配额** | 立即切换到下一个密钥 | 24 小时 |
| **401 认证过期** | 首先尝试刷新 OAuth 令牌。仅在刷新失败时切换 | — |
| **所有密钥耗尽** | 如果已配置，则回退到 `fallback_model` | — |

`has_retried_429` 标志会在每次成功的 API 调用后重置，因此单个瞬时的 429 不会触发轮换。

## 自定义端点池

自定义 OpenAI 兼容端点（Together.ai、RunPod、本地服务器）拥有各自的凭据池，池的键名由 `config.yaml` 中 `custom_providers` 定义的端点名称决定。

当您通过 `hermes model` 设置自定义端点时，系统会自动生成一个名称，例如 “Together.ai” 或 “Local (localhost:8080)”。该名称即成为凭据池的键名。

```bash
# 在通过 hermes model 设置自定义端点后：
hermes auth list
# 显示：
#   Together.ai (1 个凭据):
#     #1  config key    api_key config:Together.ai ←

# 为同一端点添加第二个密钥：
hermes auth add Together.ai --api-key sk-together-second-key
```

自定义端点池存储在 `auth.json` 的 `credential_pool` 字段下，并带有 `custom:` 前缀：

```json
{
  "credential_pool": {
    "openrouter": [...],
    "custom:together.ai": [...]
  }
}
```

## 自动发现

Hermes 会自动从多个来源发现凭据，并在启动时将其填充到池中：

| 来源 | 示例 | 是否自动填充？ |
|--------|---------|-------------|
| 环境变量 | `OPENROUTER_API_KEY`、`ANTHROPIC_API_KEY` | 是 |
| OAuth 令牌（auth.json） | Codex 设备码、Nous 设备码 | 是 |
| Claude Code 凭据 | `~/.claude/.credentials.json` | 是（Anthropic） |
| Hermes PKCE OAuth | `~/.hermes/auth.json` | 是（Anthropic） |
| 自定义端点配置 | `config.yaml` 中的 `model.api_key` | 是（自定义端点） |
| 手动条目 | 通过 `hermes auth add` 添加 | 持久化保存在 auth.json 中 |

自动填充的条目会在每次加载池时更新——如果您删除了某个环境变量，其对应的池条目也会被自动清理。手动条目（通过 `hermes auth add` 添加）永远不会被自动清理。

## 委托与子智能体共享

当智能体通过 `delegate_task` 创建子智能体时，父智能体的凭据池会自动共享给子智能体：

- **同一提供商** — 子智能体获得父智能体的完整凭据池，从而能够在遇到速率限制时进行密钥轮换
- **不同提供商** — 子智能体加载该提供商自身的凭据池（如果已配置）
- **未配置凭据池** — 子智能体回退到继承的单个 API 密钥

这意味着子智能体能够享受与父智能体相同的速率限制弹性，且无需额外配置。按任务分配凭据的机制确保子智能体在并发轮换密钥时不会相互冲突。

## 线程安全

凭据池对所有状态变更操作（`select()`、`mark_exhausted_and_rotate()`、`try_refresh_current()`、`mark_used()`）使用线程锁。这确保了网关同时处理多个聊天会话时的安全并发访问。

## 架构

完整的数据流图请参见仓库中的 [`docs/credential-pool-flow.excalidraw`](https://excalidraw.com/#json=2Ycqhqpi6f12E_3ITyiwh,c7u9jSt5BwrmiVzHGbm87g)。

凭据池集成在提供商解析层：

1. **`agent/credential_pool.py`** — 池管理器：存储、选择、轮换、冷却时间
2. **`hermes_cli/auth_commands.py`** — CLI 命令和交互式向导
3. **`hermes_cli/runtime_provider.py`** — 感知凭据池的凭据解析
4. **`run_agent.py`** — 错误恢复：429/402/401 → 池轮换 → 回退

## 存储

池状态存储在 `~/.hermes/auth.json` 的 `credential_pool` 字段下：

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
        "access_token": "sk-or-v1-...",
        "last_status": "ok",
        "request_count": 142
      }
    ]
  },
}
```

轮换策略存储在 `config.yaml` 中（而非 `auth.json`）：

```yaml
credential_pool_strategies:
  openrouter: round_robin
  anthropic: least_used
```