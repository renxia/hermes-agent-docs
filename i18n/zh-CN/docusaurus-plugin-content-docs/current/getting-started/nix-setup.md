---
sidebar_position: 3
title: "Nix 与 NixOS 安装指南"
description: "使用 Nix 安装并部署 Hermes 智能体 —— 从快速 `nix run` 到完整的 NixOS 声明式模块与容器模式"
---

# Nix 与 NixOS 安装指南

Hermes 智能体提供了一个包含三个集成级别的 Nix flake：

| 级别 | 适用对象 | 功能描述 |
|-------|-------------|--------------|
| **`nix run` / `nix profile install`** | 任何 Nix 用户（macOS、Linux） | 预编译二进制文件，包含所有依赖 —— 随后可使用标准 CLI 工作流 |
| **NixOS 模块（原生）** | NixOS 服务器部署 | 声明式配置、强化 systemd 服务、托管密钥 |
| **NixOS 模块（容器）** | 需要自我修改的智能体 | 包含上述所有功能，外加一个持久化的 Ubuntu 容器，智能体可在其中使用 `apt`/`pip`/`npm install` |

:::info 与标准安装的区别
`curl | bash` 安装程序会自行管理 Python、Node.js 及其他依赖。Nix flake 替代了所有这些 —— 每个 Python 依赖都是由 [uv2nix](https://github.com/pyproject-nix/uv2nix) 构建的 Nix 派生包，而运行时工具（Node.js、git、rip、ffmpeg）被封装到二进制文件的 PATH 中。没有运行时的 pip，没有虚拟环境激活，没有 `npm install`。

**对于非 NixOS 用户**，这仅改变了安装步骤。之后的所有操作（`hermes setup`、`hermes gateway install`、编辑配置）与标准安装完全相同。

**对于 NixOS 模块用户**，整个生命周期都不同：配置位于 `configuration.nix`，密钥通过 sops-nix/agenix 管理，服务是一个 systemd 单元，并且 CLI 配置命令被禁用。您管理 hermes 的方式与管理任何其他 NixOS 服务相同。
:::

## 前提条件

- **启用 flakes 的 Nix** —— 推荐使用 [Determinate Nix](https://install.determinate.systems)（默认启用 flakes）
- 所需服务的 **API 密钥**（至少需要一个 OpenRouter 或 Anthropic 密钥）

---

## 快速入门（适用于任何 Nix 用户）

无需克隆仓库。Nix 会获取、构建并运行所有内容：

```bash
# 直接运行（首次使用时构建，之后会缓存）
nix run github:NousResearch/hermes-agent -- setup
nix run github:NousResearch/hermes-agent -- chat

# 或者进行持久化安装
nix profile install github:NousResearch/hermes-agent
hermes setup
hermes chat
```

执行 `nix profile install` 后，`hermes`、`hermes-agent` 和 `hermes-acp` 将被添加到你的 PATH 中。从此之后，工作流程与[标准安装](./installation.md)完全相同 —— `hermes setup` 会引导你选择提供商，`hermes gateway install` 会设置一个 launchd（macOS）或 systemd 用户服务，配置文件位于 `~/.hermes/`。

:::warning 消息平台（Discord、Telegram、Slack）
默认的软件包不包含消息平台库——它们已移至按需安装模式，而这无法在 Nix 的只读环境中工作。如果你计划将智能体连接到 Discord、Telegram 或 Slack，请安装 `messaging` 变体：

```bash
nix profile install github:NousResearch/hermes-agent#messaging
```

安装所有可选额外功能（语音、所有提供商、所有平台）：

```bash
nix profile install github:NousResearch/hermes-agent#full
```

`full` 变体会增加约 700 MB 的闭包大小。如果你只需要消息平台，`#messaging` 仅增加约 33 MB。
:::

<details>
<summary><strong>从本地克隆构建</strong></summary>

```bash
git clone https://github.com/NousResearch/hermes-agent.git
cd hermes-agent
nix build
./result/bin/hermes setup
```

</details>

---

## NixOS 模块

该 flake 导出了 `nixosModules.default` —— 一个完整的 NixOS 服务模块，它以声明方式管理用户创建、目录、配置生成、密钥、文档和服务生命周期。

:::note
此模块要求使用 NixOS。对于非 NixOS 系统（macOS、其他 Linux 发行版），请使用 `nix profile install` 和上述标准 CLI 工作流程。
:::

### 添加 Flake 输入

```nix
# /etc/nixos/flake.nix（或你的系统 flake）
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    hermes-agent.url = "github:NousResearch/hermes-agent";
  };

  outputs = { nixpkgs, hermes-agent, ... }: {
    nixosConfigurations.your-host = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        hermes-agent.nixosModules.default
        ./configuration.nix
      ];
    };
  };
}
```

### 最小化配置

```nix
# configuration.nix
{ config, ... }: {
  services.hermes-agent = {
    enable = true;
    settings.model.default = "anthropic/claude-sonnet-4";
    environmentFiles = [ config.sops.secrets."hermes-env".path ];
    addToSystemPackages = true;
  };
}
```

就这样。`nixos-rebuild switch` 会创建 `hermes` 用户，生成 `config.yaml`，配置密钥，并启动网关——一个长期运行的服务，负责将智能体连接到消息平台（Telegram、Discord 等）并监听传入消息。

:::warning 需要密钥
上面的 `environmentFiles` 行假设你已配置了 [sops-nix](https://github.com/Mic92/sops-nix) 或 [agenix](https://github.com/ryantm/agenix)。该文件应至少包含一个 LLM 提供商密钥（例如，`OPENROUTER_API_KEY=sk-or-...`）。完整设置请参见[密钥管理](#密钥管理)。如果你还没有密钥管理器，可以先使用一个普通文件——只需确保它不是全局可读的：

```bash
echo "OPENROUTER_API_KEY=sk-or-your-key" | sudo install -m 0600 -o hermes /dev/stdin /var/lib/hermes/env
```

```nix
services.hermes-agent.environmentFiles = [ "/var/lib/hermes/env" ];
```
:::

:::tip addToSystemPackages
设置 `addToSystemPackages = true` 会做两件事：将 `hermes` CLI 放在你的系统 PATH 中，**并且**在系统范围内设置 `HERMES_HOME`，使得交互式 CLI 与网关服务共享状态（会话、技能、定时任务）。如果不设置，在 shell 中运行 `hermes` 会创建一个单独的 `~/.hermes/` 目录。
:::

### 容器感知 CLI

:::info
当 `container.enable = true` 且 `addToSystemPackages = true` 时，主机上的**每个** `hermes` 命令都会自动路由到受管容器中。这意味着你的交互式 CLI 会话运行在与网关服务相同的环境中——可以访问所有容器安装的软件包和工具。

- 路由是透明的：`hermes chat`、`hermes sessions list`、`hermes version` 等命令实际上都会在底层执行到容器中
- 所有 CLI 标志均按原样转发
- 如果容器未运行，CLI 会短暂重试（交互使用时显示旋转动画等待 5 秒，脚本使用时静默等待 10 秒），然后以清晰的错误失败——不会静默回退
- 对于正在开发 hermes 代码库的开发者，设置 `HERMES_DEV=1` 可绕过容器路由并直接运行本地代码

设置 `container.hostUsers` 可以为服务状态目录创建一个 `~/.hermes` 符号链接，使主机 CLI 和容器共享会话、配置和记忆：

```nix
services.hermes-agent = {
  container.enable = true;
  container.hostUsers = [ "your-username" ];
  addToSystemPackages = true;
};
```

`hostUsers` 中列出的用户会被自动添加到 `hermes` 组以获得文件权限访问。

**Podman 用户：** NixOS 服务以 root 身份运行容器。Docker 用户可以通过 `docker` 组套接字获得访问权限，但 Podman 的 rootful 容器需要 sudo。请为你的容器运行时授予无密码 sudo 权限：

```nix
security.sudo.extraRules = [{
  users = [ "your-username" ];
  commands = [{
    command = "/run/current-system/sw/bin/podman";
    options = [ "NOPASSWD" ];
  }];
}];
```

CLI 会自动检测何时需要 sudo 并透明地使用它。没有此配置，你需要手动运行 `sudo hermes chat`。
:::

### 验证是否工作

在 `nixos-rebuild switch` 之后，检查服务是否正在运行：

```bash
# 检查服务状态
systemctl status hermes-agent

# 查看日志（Ctrl+C 停止）
journalctl -u hermes-agent -f

# 如果 addToSystemPackages 为 true，测试 CLI
hermes version
hermes config       # 显示生成的配置
```

### 选择部署模式

该模块支持两种模式，通过 `container.enable` 控制：

| | **原生** (默认) | **容器** |
|---|---|---|
| 运行方式 | 主机上的加固 systemd 服务 | 带有 `/nix/store` 绑定挂载的持久化 Ubuntu 容器 |
| 安全性 | `NoNewPrivileges`、`ProtectSystem=strict`、`PrivateTmp` | 容器隔离，在内部以非特权用户运行 |
| 智能体可以自行安装软件包 | 否——仅限 Nix 提供的 PATH 上的工具 | 是——`apt`、`pip`、`npm` 安装在重启后仍存在 |
| 配置接口 | 相同 | 相同 |
| 选择时机 | 标准部署、最高安全性、可重现性 | 智能体需要运行时包安装、可变环境、实验性工具 |

要启用容器模式，只需添加一行：

```nix
{
  services.hermes-agent = {
    enable = true;
    container.enable = true;
    # ... 其余配置相同
  };
}
```

:::info
容器模式通过 `mkDefault` 自动启用 `virtualisation.docker.enable`。如果你使用 Podman，请设置 `container.backend = "podman"` 和 `virtualisation.docker.enable = false`。
:::

---

## 配置

### 声明式设置

`settings` 选项接受一个任意属性集，该集合会被渲染为 `config.yaml`。它支持跨多个模块定义进行深度合并（通过 `lib.recursiveUpdate`），因此你可以将配置分散在多个文件中：

```nix
# base.nix
services.hermes-agent.settings = {
  model.default = "anthropic/claude-sonnet-4";
  toolsets = [ "all" ];
  terminal = { backend = "local"; timeout = 180; };
};

# personality.nix
services.hermes-agent.settings = {
  display = { compact = false; personality = "kawaii"; };
  memory = { memory_enabled = true; user_profile_enabled = true; };
};
```

两者在评估时会进行深度合并。Nix 声明的键始终优先于磁盘上现有 `config.yaml` 中的键，但 **Nix 未触及的、用户添加的键将被保留**。这意味着如果智能体或手动编辑添加了像 `skills.disabled` 或 `streaming.enabled` 这样的键，它们在 `nixos-rebuild switch` 后仍然存在。

:::note 模型命名
`settings.model.default` 使用你的提供商所期望的模型标识符。使用 [OpenRouter](https://openrouter.ai)（默认）时，这些标识符看起来像 `"anthropic/claude-sonnet-4"` 或 `"google/gemini-3-flash"`。如果你直接使用提供商（Anthropic、OpenAI），请将 `settings.model.base_url` 设置为指向他们的 API，并使用他们原生的模型 ID（例如，`"claude-sonnet-4-20250514"`）。当未设置 `base_url` 时，Hermes 默认使用 OpenRouter。
:::

:::tip 发现可用的配置键
运行 `nix build .#configKeys && cat result` 可以看到从 Python 的 `DEFAULT_CONFIG` 中提取的每个叶子配置键。你可以将现有的 `config.yaml` 粘贴到 `settings` 属性集中——结构是 1:1 映射的。
:::

<details>
<summary><strong>完整示例：所有常用自定义设置</strong></summary>

```nix
{ config, ... }: {
  services.hermes-agent = {
    enable = true;
    container.enable = true;

    # ── 模型 ──────────────────────────────────────────────────────────
    settings = {
      model = {
        base_url = "https://openrouter.ai/api/v1";
        default = "anthropic/claude-opus-4.6";
      };
      toolsets = [ "all" ];
      max_turns = 100;
      terminal = { backend = "local"; cwd = "."; timeout = 180; };
      compression = {
        enabled = true;
        threshold = 0.85;
        summary_model = "google/gemini-3-flash-preview";
      };
      memory = { memory_enabled = true; user_profile_enabled = true; };
      display = { compact = false; personality = "kawaii"; };
      agent = { max_turns = 60; verbose = false; };
    };

    # ── 密钥 ────────────────────────────────────────────────────────
    environmentFiles = [ config.sops.secrets."hermes-env".path ];

    # ── 文档 ──────────────────────────────────────────────────────
    documents = {
      "USER.md" = ./documents/USER.md;
    };

    # ── MCP 服务器 ────────────────────────────────────────────────────
    mcpServers.filesystem = {
      command = "npx";
      args = [ "-y" "@modelcontextprotocol/server-filesystem" "/data/workspace" ];
    };

    # ── 容器选项 ──────────────────────────────────────────────
    container = {
      image = "ubuntu:24.04";
      backend = "docker";
      hostUsers = [ "your-username" ];
      extraVolumes = [ "/home/user/projects:/projects:rw" ];
      extraOptions = [ "--gpus" "all" ];
    };

    # ── 服务调整 ─────────────────────────────────────────────────
    addToSystemPackages = true;
    extraArgs = [ "--verbose" ];
    restart = "always";
    restartSec = 5;
  };
}
```

</details>

### 逃生通道：使用你自己的配置

如果你更愿意在 Nix 之外完全管理 `config.yaml`，请使用 `configFile`：

```nix
services.hermes-agent.configFile = /etc/hermes/config.yaml;
```

这会完全绕过 `settings` —— 不合并，不生成。该文件在每次激活时会原样复制到 `$HERMES_HOME/config.yaml`。

### 自定义速查表

Nix 用户最常想要自定义内容的快速参考：

| 我想要... | 选项 | 示例 |
|---|---|---|
| 更换 LLM 模型 | `settings.model.default` | `"anthropic/claude-sonnet-4"` |
| 使用不同的提供商端点 | `settings.model.base_url` | `"https://openrouter.ai/api/v1"` |
| 添加 API 密钥 | `environmentFiles` | `[ config.sops.secrets."hermes-env".path ]` |
| 给智能体一个个性 | `${services.hermes-agent.stateDir}/.hermes/SOUL.md` | 直接管理该文件 |
| 添加 MCP 工具服务器 | `mcpServers.<name>` | 参见 [MCP 服务器](#mcp-服务器) |
| 启用 Discord/Telegram/Slack | `extraDependencyGroups` | `[ "messaging" ]` |
| 将主机目录挂载到容器中 | `container.extraVolumes` | `[ "/data:/data:rw" ]` |
| 为容器传递 GPU 访问权限 | `container.extraOptions` | `[ "--gpus" "all" ]` |
| 使用 Podman 而不是 Docker | `container.backend` | `"podman"` |
| 在主机 CLI 和容器之间共享状态 | `container.hostUsers` | `[ "sidbin" ]` |
| 为智能体提供额外工具 | `extraPackages` | `[ pkgs.pandoc pkgs.imagemagick ]` |
| 使用自定义基础镜像 | `container.image` | `"ubuntu:24.04"` |
| 覆盖 hermes 软件包 | `package` | `inputs.hermes-agent.packages.${system}.default.override { ... }` |
| 更改状态目录 | `stateDir` | `"/opt/hermes"` |
| 设置智能体的工作目录 | `workingDirectory` | `"/home/user/projects"` |

---

## 秘密管理

:::danger 切勿在 `settings` 或 `environment` 中放入 API 密钥
Nix 表达式中的值最终会进入 `/nix/store`，该目录对所有人可读。务必使用 `environmentFiles` 配合秘密管理器。
:::

`environment`（非秘密变量）和 `environmentFiles`（秘密文件）会在激活时（`nixos-rebuild switch`）合并到 `$HERMES_HOME/.env`。Hermes 在每次启动时都会读取此文件，因此更改通过 `systemctl restart hermes-agent` 即可生效——无需重建容器。

### sops-nix

```nix
{
  sops = {
    defaultSopsFile = ./secrets/hermes.yaml;
    age.keyFile = "/home/user/.config/sops/age/keys.txt";
    secrets."hermes-env" = { format = "yaml"; };
  };

  services.hermes-agent.environmentFiles = [
    config.sops.secrets."hermes-env".path
  ];
}
```

秘密文件包含键值对：

```yaml
# secrets/hermes.yaml (使用 sops 加密)
hermes-env: |
    OPENROUTER_API_KEY=sk-or-...
    TELEGRAM_BOT_TOKEN=123456:ABC...
    ANTHROPIC_API_KEY=sk-ant-...
```

### agenix

```nix
{
  age.secrets.hermes-env.file = ./secrets/hermes-env.age;

  services.hermes-agent.environmentFiles = [
    config.age.secrets.hermes-env.path
  ];
}
```

### OAuth / 认证种子

对于需要 OAuth 的平台（如 Discord），可使用 `authFile` 在首次部署时注入凭据：

```nix
{
  services.hermes-agent = {
    authFile = config.sops.secrets."hermes/auth.json".path;
    # authFileForceOverwrite = true;  # 每次激活时覆盖
  };
}
```

仅当 `auth.json` 尚不存在时才会复制该文件（除非设置了 `authFileForceOverwrite = true`）。运行时刷新的 OAuth 令牌将写入状态目录，并在重建后保留。

---

## 文档

`documents` 选项将文件安装到智能体的工作目录（即 `workingDirectory`，智能体将其读取为工作区）。Hermes 按惯例查找特定文件名：

- **`USER.md`** — 关于智能体正在交互的用户的上下文信息。
- 您放置在此处的其他文件将作为工作区文件对智能体可见。

智能体身份文件是独立的：Hermes 从 `$HERMES_HOME/SOUL.md` 加载其主要的 `SOUL.md`，在 NixOS 模块中该路径为 `${services.hermes-agent.stateDir}/.hermes/SOUL.md`。将 `SOUL.md` 放入 `documents` 只会创建工作区文件，并不会替换主身份文件。

```nix
{
  services.hermes-agent.documents = {
    "USER.md" = ./documents/USER.md;  # 路径引用，从 Nix 存储中复制
  };
}
```

值可以是内联字符串或路径引用。每次执行 `nixos-rebuild switch` 时都会安装这些文件。

---

## MCP 服务器

`mcpServers` 选项以声明式方式配置 [MCP（模型上下文协议）](https://modelcontextprotocol.io) 服务器。每台服务器使用 **stdio**（本地命令）或 **HTTP**（远程 URL）传输方式。

### Stdio 传输（本地服务器）

```nix
{
  services.hermes-agent.mcpServers = {
    filesystem = {
      command = "npx";
      args = [ "-y" "@modelcontextprotocol/server-filesystem" "/data/workspace" ];
    };
    github = {
      command = "npx";
      args = [ "-y" "@modelcontextprotocol/server-github" ];
      env.GITHUB_PERSONAL_ACCESS_TOKEN = "\${GITHUB_TOKEN}"; # 从 .env 中解析
    };
  };
}
```

:::tip
`env` 值中的环境变量在运行时从 `$HERMES_HOME/.env` 解析。使用 `environmentFiles` 注入密钥——切勿将令牌直接写入 Nix 配置中。
:::

### HTTP 传输（远程服务器）

```nix
{
  services.hermes-agent.mcpServers.remote-api = {
    url = "https://mcp.example.com/v1/mcp";
    headers.Authorization = "Bearer \${MCP_REMOTE_API_KEY}";
    timeout = 180;
  };
}
```

### 使用 OAuth 的 HTTP 传输

对于使用 OAuth 2.1 的服务器，设置 `auth = "oauth"`。Hermes 实现了完整的 PKCE 流程——元数据发现、动态客户端注册、令牌交换和自动刷新。

```nix
{
  services.hermes-agent.mcpServers.my-oauth-server = {
    url = "https://mcp.example.com/mcp";
    auth = "oauth";
  };
}
```

令牌存储在 `$HERMES_HOME/mcp-tokens/<server-name>.json` 中，在重启和重建之间持久保留。

<details>
<summary><strong>无头服务器上的初始 OAuth 授权</strong></summary>

首次 OAuth 授权需要基于浏览器的同意流程。在无头部署中，Hermes 会将授权 URL 打印到标准输出/日志中，而不是打开浏览器。

**方案 A：交互式引导** — 通过 `docker exec`（容器模式）或 `sudo -u hermes`（原生模式）运行一次流程：

```bash
# 容器模式
docker exec -it hermes-agent \
  hermes mcp add my-oauth-server --url https://mcp.example.com/mcp --auth oauth

# 原生模式
sudo -u hermes HERMES_HOME=/var/lib/hermes/.hermes \
  hermes mcp add my-oauth-server --url https://mcp.example.com/mcp --auth oauth
```

容器使用 `--network=host`，因此 `127.0.0.1` 上的 OAuth 回调监听器可从宿主机浏览器访问。

**方案 B：预置令牌** — 在工作站上完成流程，然后复制令牌：

```bash
hermes mcp add my-oauth-server --url https://mcp.example.com/mcp --auth oauth
scp ~/.hermes/mcp-tokens/my-oauth-server{,.client}.json \
    server:/var/lib/hermes/.hermes/mcp-tokens/
# 确保：chown hermes:hermes, chmod 0600
```

</details>

### 采样（服务器发起的 LLM 请求）

某些 MCP 服务器可以向智能体请求 LLM 补全：

```nix
{
  services.hermes-agent.mcpServers.analysis = {
    command = "npx";
    args = [ "-y" "analysis-server" ];
    sampling = {
      enabled = true;
      model = "google/gemini-3-flash";
      max_tokens_cap = 4096;
      timeout = 30;
      max_rpm = 10;
    };
  };
}
```

---

## 托管模式

当 hermes 通过 NixOS 模块运行时，以下 CLI 命令将被**阻止**，并显示描述性错误信息，指引你查看 `configuration.nix`：

| 被阻止的命令 | 原因 |
|---|---|
| `hermes setup` | 配置是声明式的——请在 Nix 配置中编辑 `settings` |
| `hermes config edit` | 配置由 `settings` 生成 |
| `hermes config set <key> <value>` | 配置由 `settings` 生成 |
| `hermes gateway install` | systemd 服务由 NixOS 管理 |
| `hermes gateway uninstall` | systemd 服务由 NixOS 管理 |

这可以防止 Nix 声明的配置与磁盘上的实际配置产生漂移。检测使用两个信号：

1. **`HERMES_MANAGED=true`** 环境变量——由 systemd 服务设置，对网关进程可见
2. **`.managed` 标记文件**，位于 `HERMES_HOME` 中——由激活脚本设置，对交互式 shell 可见（例如，`docker exec -it hermes-agent hermes config set ...` 也会被阻止）

要更改配置，请编辑你的 Nix 配置并运行 `sudo nixos-rebuild switch`。

---

## 容器架构

:::info
本节仅适用于使用 `container.enable = true` 的情况。原生模式部署可跳过此节。
:::

当启用容器模式时，hermes 运行在一个持久的 Ubuntu 容器内，Nix 构建的二进制文件从宿主机以只读方式绑定挂载：

```
宿主机                                   容器
────                                    ─────────
/nix/store/...-hermes-agent-0.1.0  ──►  /nix/store/... (只读)
~/.hermes -> /var/lib/hermes/.hermes       (符号链接桥接, 取决于 hostUsers)
/var/lib/hermes/                    ──►  /data/          (读写)
  ├── current-package -> /nix/store/...    (符号链接, 每次重建时更新)
  ├── .gc-root -> /nix/store/...           (防止 nix-collect-garbage 清理)
  ├── .container-identity                  (sha256 哈希, 触发容器重建)
  ├── .hermes/                             (HERMES_HOME)
  │   ├── .env                             (从 environment + environmentFiles 合并)
  │   ├── config.yaml                      (Nix 生成, 由激活脚本深度合并)
  │   ├── .managed                         (标记文件)
  │   ├── .container-mode                  (路由元数据: backend, exec_user 等)
  │   ├── state.db, sessions/, memories/   (运行时状态)
  │   └── mcp-tokens/                      (MCP 服务器的 OAuth 令牌)
  ├── home/                                ──►  /home/hermes    (读写)
  └── workspace/                           (MESSAGING_CWD)
      ├── SOUL.md                          (来自 documents 选项)
      └── (智能体创建的文件)

容器可写层 (apt/pip/npm):                 /usr, /usr/local, /tmp
```

Nix 构建的二进制文件能在 Ubuntu 容器内运行，因为 `/nix/store` 是绑定挂载的——它自带解释器和所有依赖，因此不依赖容器的系统库。容器入口点通过 `current-package` 符号链接解析：`/data/current-package/bin/hermes gateway run --replace`。执行 `nixos-rebuild switch` 时，仅更新符号链接——容器保持运行。

### 各场景下的持久性

| 事件 | 容器是否重建？ | `/data`（状态） | `/home/hermes` | 可写层（`apt`/`pip`/`npm`） |
|---|---|---|---|---|
| `systemctl restart hermes-agent` | 否 | 持久保留 | 持久保留 | 持久保留 |
| `nixos-rebuild switch`（代码变更） | 否（符号链接更新） | 持久保留 | 持久保留 | 持久保留 |
| 宿主机重启 | 否 | 持久保留 | 持久保留 | 持久保留 |
| `nix-collect-garbage` | 否（GC root） | 持久保留 | 持久保留 | 持久保留 |
| 镜像变更（`container.image`） | **是** | 持久保留 | 持久保留 | **丢失** |
| 卷/选项变更 | **是** | 持久保留 | 持久保留 | **丢失** |
| `environment`/`environmentFiles` 变更 | 否 | 持久保留 | 持久保留 | 持久保留 |

容器仅在其**身份哈希**发生变化时才会重建。该哈希涵盖：schema 版本、镜像、`extraVolumes`、`extraOptions` 和入口点脚本。环境变量、settings、documents 或 hermes 包本身的变更**不会**触发重建。

:::warning 可写层丢失
当身份哈希发生变化（镜像升级、新增卷、新增容器选项）时，容器将被销毁并从 `container.image` 的新拉取镜像重新创建。可写层中的所有 `apt install`、`pip install` 或 `npm install` 安装的包都将丢失。`/data` 和 `/home/hermes` 中的状态会保留（它们是绑定挂载的）。

如果智能体依赖特定包，请考虑将它们烘焙到自定义镜像中（`container.image = "my-registry/hermes-base:latest"`）或在智能体的 SOUL.md 中编写安装脚本。
:::

### GC Root 保护

`preStart` 脚本在 `${stateDir}/.gc-root` 创建一个 GC root，指向当前的 hermes 包。这可以防止 `nix-collect-garbage` 删除正在运行的二进制文件。如果 GC root 意外损坏，重启服务会重新创建它。

---

## 插件

NixOS 模块支持声明式插件安装——无需使用命令式的 `hermes plugins install`。

### 目录插件 (`extraPlugins`)

对于仅包含 `plugin.yaml` + `__init__.py` 源码树的插件（例如 [hermes-lcm](https://github.com/stephenschoettler/hermes-lcm)）：

```nix
services.hermes-agent.extraPlugins = [
  (pkgs.fetchFromGitHub {
    owner = "stephenschoettler";
    repo = "hermes-lcm";
    rev = "v0.7.0";
    hash = "sha256-...";
  })
];
```

插件会在激活时被符号链接到 `$HERMES_HOME/plugins/` 目录。Hermes 通过其常规目录扫描发现它们。从列表中移除插件并运行 `nixos-rebuild switch` 会移除该符号链接。

### 入口点插件 (`extraPythonPackages`)

对于通过 `[project.entry-points."hermes_agent.plugins"]` 注册的 pip 打包插件（例如 [rtk-hermes](https://github.com/ogallotti/rtk-hermes)）：

```nix
services.hermes-agent.extraPythonPackages = [
  (pkgs.python312Packages.buildPythonPackage {
    pname = "rtk-hermes";
    version = "1.0.0";
    src = pkgs.fetchFromGitHub {
      owner = "ogallotti";
      repo = "rtk-hermes";
      rev = "v1.0.0";
      hash = "sha256-...";
    };
    format = "pyproject";
    build-system = [ pkgs.python312Packages.setuptools ];
  })
];
```

该包的 `site-packages` 路径会被添加到 hermes 包装器的 PYTHONPATH 中。`importlib.metadata` 在会话启动时发现入口点。

### 可选依赖组 (`extraDependencyGroups`)

对于在 hermes-agent 的 `pyproject.toml` 中声明的可选附加功能，使用 `extraDependencyGroups` 将其包含在构建时的密封虚拟环境中。这对于任何不在默认 `[all]` 集合中的附加功能是必需的——在 Nix 上，无法在运行时向只读存储区安装内容。

```nix
# 启用 Discord、Telegram、Slack
services.hermes-agent.extraDependencyGroups = [ "messaging" ];
```

```nix
# 启用记忆提供程序
services.hermes-agent = {
  extraDependencyGroups = [ "hindsight" ];
  settings.memory.provider = "hindsight";
};
```

此功能由 uv 与核心依赖项一起解析——无需修补 PYTHONPATH，无冲突风险。可用的组包括：

| 组               | 启用的功能                     |
|------------------|--------------------------------|
| `messaging`      | Discord、Telegram、Slack       |
| `matrix`         | Matrix/Element（带加密的 mautrix；仅限 Linux） |
| `dingtalk`       | 钉钉                          |
| `feishu`         | 飞书/Lark                     |
| `voice`          | 本地语音转文字 (faster-whisper) |
| `edge-tts`       | Edge TTS 提供程序             |
| `tts-premium`    | ElevenLabs TTS                |
| `anthropic`      | 原生 Anthropic SDK（通过 OpenRouter 时不需要） |
| `bedrock`        | AWS Bedrock (boto3)           |
| `azure-identity` | Azure Entra ID 身份验证       |
| `honcho`         | Honcho 记忆提供程序           |
| `hindsight`      | Hindsight 记忆提供程序        |
| `modal`          | Modal 终端后端                |
| `daytona`        | Daytona 终端后端              |
| `exa`            | Exa 网络搜索                  |
| `firecrawl`      | Firecrawl 网络搜索            |
| `fal`            | FAL 图像生成                  |

或者，使用预构建的 `#messaging` 或 `#full` flake 包，而不是逐项配置附加功能（参见[快速开始](#quick-start-any-nix-user)）。

**何时使用哪个选项：**

| 需求                         | 选项                  |
|------------------------------|-----------------------|
| 启用 pyproject.toml 中的可选附加功能 | `extraDependencyGroups` |
| 添加不在 pyproject.toml 中的外部 Python 插件 | `extraPythonPackages` |
| 添加系统二进制文件（pandoc、jq 等） | `extraPackages` |
| 添加基于目录的插件源码树         | `extraPlugins` |

### 组合使用

一个带有第三方 Python 依赖的目录插件需要同时使用这两个选项：

```nix
services.hermes-agent = {
  extraPlugins = [ my-plugin-src ];          # 插件源码
  extraPythonPackages = [ pkgs.python312Packages.redis ];  # 其 Python 依赖
  extraPackages = [ pkgs.redis ];            # 其所需的系统二进制文件
};
```

### 使用覆盖

外部 flake 可以直接覆盖包：

```nix
{
  inputs.hermes-agent.url = "github:NousResearch/hermes-agent";
  outputs = { hermes-agent, nixpkgs, ... }: {
    nixpkgs.overlays = [ hermes-agent.overlays.default ];
    # 然后：
    #   pkgs.hermes-agent.override { extraPythonPackages = [...]; }
    #   pkgs.hermes-agent.override { extraDependencyGroups = [ "hindsight" ]; }
  };
}
```

### 插件配置

插件仍需在 `config.yaml` 中启用。通过声明式设置添加它们：

```nix
services.hermes-agent.settings.plugins.enabled = [
  "hermes-lcm"
  "rtk-rewrite"
];
```

:::note
构建时的冲突检查会防止插件包遮蔽 hermes 的核心依赖项。如果插件提供的包已存在于密封虚拟环境中，`nixos-rebuild` 将会失败并给出清晰的错误信息。
:::

## 开发

### 开发环境

该 flake 提供了一个包含 Python 3.12、uv、Node.js 和所有运行时工具的开发 shell：

```bash
cd hermes-agent
nix develop

# Shell 提供：
#   - Python 3.12 + uv（首次进入时，依赖项安装到 .venv）
#   - Node.js 22, ripgrep, git, openssh, ffmpeg 在 PATH 中
#   - 优化戳记文件：如果依赖项未更改，再次进入近乎瞬间完成

hermes setup
hermes chat
```

### direnv (推荐)

包含的 `.envrc` 可自动激活开发环境：

```bash
cd hermes-agent
direnv allow    # 一次性操作
# 后续进入近乎瞬间完成（戳记文件跳过依赖项安装）
```

### Flake 检查

该 flake 包含在 CI 和本地运行的构建时验证：

```bash
# 运行所有检查
nix flake check

# 单独检查
nix build .#checks.x86_64-linux.package-contents   # 二进制文件存在 + 版本
nix build .#checks.x86_64-linux.entry-points-sync  # pyproject.toml ↔ Nix 包同步
nix build .#checks.x86_64-linux.cli-commands        # 网关/配置子命令
nix build .#checks.x86_64-linux.managed-guard       # HERMES_MANAGED 阻止变更
nix build .#checks.x86_64-linux.bundled-skills      # 技能包含在包中
nix build .#checks.x86_64-linux.config-roundtrip    # 合并脚本保留用户键
```

<details>
<summary><strong>每项检查验证的内容</strong></summary>

| 检查项 | 测试内容 |
|---|---|
| `package-contents` | `hermes` 和 `hermes-agent` 二进制文件存在且 `hermes version` 可运行 |
| `entry-points-sync` | `pyproject.toml` 中的每个 `[project.scripts]` 条目在 Nix 包中都有一个包装后的二进制文件 |
| `cli-commands` | `hermes --help` 显示 `gateway` 和 `config` 子命令 |
| `managed-guard` | `HERMES_MANAGED=true hermes config set ...` 输出 NixOS 错误信息 |
| `bundled-skills` | Skills 目录存在，包含 SKILL.md 文件，包装脚本中设置了 `HERMES_BUNDLED_SKILLS` |
| `config-roundtrip` | 7 种合并场景：全新安装、Nix 覆盖、用户键保留、混合合并、MCP 增量合并、嵌套深度合并、幂等性 |

</details>

---

## 选项参考

### 核心

| 选项 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `enable` | `bool` | `false` | 启用 hermes-agent 服务 |
| `package` | `package` | `hermes-agent` | 要使用的 hermes-agent 软件包 |
| `user` | `str` | `"hermes"` | 系统用户 |
| `group` | `str` | `"hermes"` | 系统用户组 |
| `createUser` | `bool` | `true` | 自动创建用户/用户组 |
| `stateDir` | `str` | `"/var/lib/hermes"` | 状态目录（`HERMES_HOME` 的父目录） |
| `workingDirectory` | `str` | `"${stateDir}/workspace"` | 智能体工作目录（`MESSAGING_CWD`） |
| `addToSystemPackages` | `bool` | `false` | 将 `hermes` CLI 添加到系统 PATH 并在系统范围内设置 `HERMES_HOME` |

### 配置

| 选项 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `settings` | `attrs` (深度合并) | `{}` | 声明式配置，渲染为 `config.yaml`。支持任意嵌套；多个定义通过 `lib.recursiveUpdate` 合并 |
| `configFile` | `null` 或 `path` | `null` | 现有 `config.yaml` 的路径。如果设置，则完全覆盖 `settings` |

### 密钥与环境

| 选项 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `environmentFiles` | `listOf str` | `[]` | 包含密钥的环境文件路径。在激活时合并到 `$HERMES_HOME/.env` |
| `environment` | `attrsOf str` | `{}` | 非密钥环境变量。**在 Nix 存储中可见** — 不要在此处放置密钥 |
| `authFile` | `null` 或 `path` | `null` | OAuth 凭据种子文件。仅在首次部署时复制 |
| `authFileForceOverwrite` | `bool` | `false` | 每次激活时总是从 `authFile` 覆盖 `auth.json` |

### 文档

| 选项 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `documents` | `attrsOf (either str path)` | `{}` | 工作空间文件。键是文件名，值是内联字符串或路径。在激活时安装到 `workingDirectory` |

### MCP 服务器

| 选项 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `mcpServers` | `attrsOf submodule` | `{}` | MCP 服务器定义，合并到 `settings.mcp_servers` 中 |
| `mcpServers.<name>.command` | `null` 或 `str` | `null` | 服务器命令（stdio 传输） |
| `mcpServers.<name>.args` | `listOf str` | `[]` | 命令参数 |
| `mcpServers.<name>.env` | `attrsOf str` | `{}` | 服务器进程的环境变量 |
| `mcpServers.<name>.url` | `null` 或 `str` | `null` | 服务器端点 URL（HTTP/StreamableHTTP 传输） |
| `mcpServers.<name>.headers` | `attrsOf str` | `{}` | HTTP 头，例如 `Authorization` |
| `mcpServers.<name>.auth` | `null` 或 `"oauth"` | `null` | 认证方法。`"oauth"` 启用 OAuth 2.1 PKCE |
| `mcpServers.<name>.enabled` | `bool` | `true` | 启用或禁用此服务器 |
| `mcpServers.<name>.timeout` | `null` 或 `int` | `null` | 工具调用超时（秒）（默认：120） |
| `mcpServers.<name>.connect_timeout` | `null` 或 `int` | `null` | 连接超时（秒）（默认：60） |
| `mcpServers.<name>.tools` | `null` 或 `submodule` | `null` | 工具过滤（`include`/`exclude` 列表） |
| `mcpServers.<name>.sampling` | `null` 或 `submodule` | `null` | 服务器发起的 LLM 请求的采样配置 |

### 服务行为

| 选项 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `extraArgs` | `listOf str` | `[]` | 传递给 `hermes gateway` 的额外参数 |
| `extraPackages` | `listOf package` | `[]` | 对智能体可用的额外软件包。添加到 hermes 用户的个人配置文件中，以便终端命令、技能和定时任务都能访问到它们 |
| `extraPlugins` | `listOf package` | `[]` | 要链接到 `$HERMES_HOME/plugins/` 的目录插件包。每个必须包含 `plugin.yaml` |
| `extraPythonPackages` | `listOf package` | `[]` | 添加到 PYTHONPATH 的 Python 包，用于入口点插件发现。使用 `python312Packages` 构建 |
| `extraDependencyGroups` | `listOf str` | `[]` | pyproject.toml 中的可选依赖项组，包含在密封的 venv 中（例如 `["hindsight"]`）。由 uv 解析 — 无冲突 |
| `restart` | `str` | `"always"` | systemd `Restart=` 策略 |
| `restartSec` | `int` | `5` | systemd `RestartSec=` 值 |

### 容器

| 选项 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `container.enable` | `bool` | `false` | 启用 OCI 容器模式 |
| `container.backend` | `enum ["docker" "podman"]` | `"docker"` | 容器运行时 |
| `container.image` | `str` | `"ubuntu:24.04"` | 基础镜像（运行时拉取） |
| `container.extraVolumes` | `listOf str` | `[]` | 额外的卷挂载（`host:container:mode`） |
| `container.extraOptions` | `listOf str` | `[]` | 传递给 `docker create` 的额外参数 |
| `container.hostUsers` | `listOf str` | `[]` | 交互式用户，他们会获得一个指向服务 stateDir 的 `~/.hermes` 符号链接，并自动添加到 `hermes` 用户组 |

## 目录布局

### 原生模式

```
/var/lib/hermes/                     # stateDir（hermes:hermes 所有，0750）
├── .hermes/                         # HERMES_HOME
│   ├── config.yaml                  # Nix 生成（每次重建时深度合并）
│   ├── .managed                     # 标记：CLI 配置修改已阻止
│   ├── .env                         # 从环境变量和 environmentFiles 合并
│   ├── auth.json                    # OAuth 凭据（初始设置后自行管理）
│   ├── gateway.pid
│   ├── state.db
│   ├── mcp-tokens/                  # MCP 服务器的 OAuth 令牌
│   ├── sessions/
│   ├── memories/
│   ├── skills/
│   ├── cron/
│   └── logs/
├── home/                            # 智能体 HOME
└── workspace/                       # MESSAGING_CWD
    ├── SOUL.md                      # 来自 documents 选项
    └── (智能体创建的文件)
```

### 容器模式

相同的布局，挂载到容器中：

| 宿主路径 | 容器路径 | 模式 | 说明 |
|---|---|---|---|
| `/nix/store` | `/nix/store` | `ro` | Hermes 二进制文件 + 所有 Nix 依赖 |
| `/data` | `/var/lib/hermes` | `rw` | 所有状态、配置、工作区 |
| `/home/hermes` | `${stateDir}/home` | `rw` | 持久化的智能体主目录 — `pip install --user`、工具缓存 |
| `/usr`、`/usr/local`、`/tmp` | （可写层） | `rw` | `apt`/`pip`/`npm` 安装 — 跨重启持久化，重新创建容器时丢失 |

---

## 更新

```bash
# 更新 flake 输入（在包含 flake.nix 的目录中运行）
cd /etc/nixos && nix flake update hermes-agent

# 重建
sudo nixos-rebuild switch
```

在容器模式下，`current-package` 符号链接会被更新，智能体在重启时会获取新的二进制文件。无需重新创建容器，也不会丢失已安装的包。

---

## 故障排除

:::tip Podman 用户
下面的所有 `docker` 命令同样适用于 `podman`。如果你设置了 `container.backend = "podman"`，请相应替换。
:::

### 服务日志

```bash
# 两种模式使用相同的 systemd 单元
journalctl -u hermes-agent -f

# 容器模式：也可直接查看
docker logs -f hermes-agent
```

### 容器检查

```bash
systemctl status hermes-agent
docker ps -a --filter name=hermes-agent
docker inspect hermes-agent --format='{{.State.Status}}'
docker exec -it hermes-agent bash
docker exec hermes-agent readlink /data/current-package
docker exec hermes-agent cat /data/.container-identity
```

### 强制重新创建容器

如果需要重置可写层（全新 Ubuntu）：

```bash
sudo systemctl stop hermes-agent
docker rm -f hermes-agent
sudo rm /var/lib/hermes/.container-identity
sudo systemctl start hermes-agent
```

### 验证密钥已加载

如果智能体启动但无法与 LLM 提供商进行身份验证，请检查 `.env` 文件是否正确合并：

```bash
# 原生模式
sudo -u hermes cat /var/lib/hermes/.hermes/.env

# 容器模式
docker exec hermes-agent cat /data/.hermes/.env
```

### GC Root 验证

```bash
nix-store --query --roots $(docker exec hermes-agent readlink /data/current-package)
```

### 常见问题

| 症状 | 原因 | 解决方法 |
|---|---|---|
| `Cannot save configuration: managed by NixOS` | CLI 保护激活 | 编辑 `configuration.nix` 并执行 `nixos-rebuild switch` |
| `No adapter available for discord`（或 telegram/slack） | 密封的 Nix 虚拟环境中缺少消息依赖 | 安装 `#messaging` 变体：`nix profile install ...#messaging`。对于 NixOS 模块：`extraDependencyGroups = [ "messaging" ]`。检查 `journalctl -u hermes-agent` 中的 `FeatureUnavailable` 或 `requirements not met` 获取底层错误信息。 |
| 容器意外重新创建 | `extraVolumes`、`extraOptions` 或 `image` 已更改 | 预期行为 — 可写层重置。重新安装包或使用自定义镜像 |
| `hermes version` 显示旧版本 | 容器未重启 | `systemctl restart hermes-agent` |
| `/var/lib/hermes` 权限被拒绝 | 状态目录为 `0750 hermes:hermes` | 使用 `docker exec` 或 `sudo -u hermes` |
| `nix-collect-garbage` 删除了 hermes | GC root 缺失 | 重启服务（preStart 会重新创建 GC root） |
| `no container with name or ID "hermes-agent"`（Podman） | Podman 根容器对普通用户不可见 | 为 podman 添加无密码 sudo（参见[容器模式](#container-mode)部分） |
| `unable to find user hermes` | 容器仍在启动中（入口点尚未创建用户） | 等待几秒后重试 — CLI 会自动重试 |
| 通过 `extraPackages` 添加的工具在终端中找不到 | 需要 `nixos-rebuild switch` 来更新用户配置文件 | 重建并重启：`nixos-rebuild switch && systemctl restart hermes-agent` |