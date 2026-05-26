# 密钥管理

Hermes 可以在进程启动时从外部密钥管理器中提取 API 密钥，而不是将它们存储在 `~/.hermes/.env` 中。密钥管理器的引导令牌存放在 `.env` 文件中；其他所有提供商密钥（如 OpenAI、Anthropic、OpenRouter 等）都可以保留在管理器中并进行集中轮换。

已支持：

- [Bitwarden Secrets Manager](./bitwarden) — 使用 `bws` CLI，支持懒安装，免费版可用。

更多后端（如 Vault、AWS Secrets Manager、1Password CLI）可以轻松添加到相同接口背后——只需在 `agent/secret_sources/` 目录下添加一个模块和一个 CLI 处理程序。如果您有特定需求，请提交请求。