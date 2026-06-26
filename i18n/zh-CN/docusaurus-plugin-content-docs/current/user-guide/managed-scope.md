---
sidebar_position: 3
title: "Managed Scope"
description: "通过系统级托管目录实现的管理员固定、用户不可更改的配置和密钥"
---

# 托管作用域

**托管作用域**允许管理员推送一组配置和密钥的基线，标准（非 root）用户**无法覆盖**此基线。它适用于 IT 需要在整个机器上的每个用户范围内固定（例如）模型提供商、共享 API 基础 URL 或 `security.redact_secrets: true` 等设置的场景。

当存在托管作用域时，它指定的值优先于用户的 `~/.hermes/config.yaml`、`~/.hermes/.env`，甚至 shell 环境变量——但仅限于它所固定的确切键。其余所有配置仍完全由用户控制。

:::note 与包管理器锁定安装不同
包管理器托管安装（声明式发行版/formula）会阻止*所有*配置变更，并告知用户使用包管理器。托管作用域是一种独立机制：它按具体键注入*特定的不可变值*，而不是锁定整个配置。两者相互独立，可以共存。:::

## 所在位置

托管作用域从系统级目录读取，默认为 `/etc/hermes`：

```text
/etc/hermes/
├── config.yaml     # 托管配置层（优先于 ~/.hermes/config.yaml）
└── .env            # 托管环境层（优先于 ~/.hermes/.env + shell）
```

目录和文件由 `root` 拥有（目录权限 `0755`，文件 `0644`）：所有人可读，仅管理员可写。**文件系统权限即为执行机制**——标准用户可以读取托管文件，但无法编辑。

任一文件都是可选的。缺少托管目录或缺少文件仅表示"无托管作用域"，配置的解析方式与没有此功能时完全一致。

### 重定位目录

该位置可通过 `HERMES_MANAGED_DIR` 环境变量重定位（适用于容器或非 `/etc` 部署）。这是一个部署/引导路径参数——类似 `HERMES_HOME`——由拥有托管文件的同一管理员设置。它**永远不会**被 Hermes 持久化到任何 `.env` 中。

```bash
# 将托管作用域指向自定义目录（由 IT / 部署设置，而非用户）
export HERMES_MANAGED_DIR=/opt/org/hermes-policy
```

:::warning
能够设置 `HERMES_MANAGED_DIR` 的用户可以将托管作用域重定向到其控制的目录，从而绕过它。在实际部署中，此变量应由管理员固定（例如写入服务单元/容器镜像中），而不是留给用户可设置。`hermes doctor` 会报告*已解析*的托管目录，使重定向可见。
:::

## 优先级

对于托管层指定的键，优先级顺序为（最高优先）：

| 层级 | config.yaml | .env |
|---|---|---|
| 1 | `/etc/hermes/config.yaml`（托管） | `/etc/hermes/.env`（托管） |
| 2 | `~/.hermes/config.yaml`（用户） | `~/.hermes/.env`（用户） |
| 3 | 内置默认值 | 已存在的 shell 环境变量 |

合并是**叶子级别**的：固定 `model.default` 不会冻结 `model.*` 的其余部分。如下的托管 `config.yaml`：

```yaml
model:
  default: org/standard-model
```

会为每个用户强制 `model.default`，同时让 `model.fallback`（以及所有其他键）仍由用户控制。

:::note 优先级说明
对于它所固定的键，托管作用域有意优先于 shell 环境变量——否则它就不是"托管"的了。这是对通常的"环境变量覆盖 config.yaml"规则的唯一反转，且仅适用于托管层指定的具体键。
:::

## 查看托管内容

```bash
hermes config        # 显示托管来源名称及固定键的标题
hermes doctor        # 报告已解析的托管目录及固定键数量
```

如果你尝试更改托管值，Hermes 会拒绝并指明来源：

```bash
$ hermes config set model.default my/model
无法设置 'model.default'：它由你的管理员托管
（/etc/hermes/config.yaml），无法更改。
```

托管密钥同理——`hermes config set` / 设置不会为托管 `.env` 固定的环境键写入用户值。

## 设置托管作用域（管理员）

```bash
sudo mkdir -p /etc/hermes

# 为这台机器上的每个用户固定一些配置值
sudo tee /etc/hermes/config.yaml >/dev/null <<'YAML'
model:
  provider: nous
security:
  redact_secrets: true
YAML

# 可选：固定一个共享的、不敏感的环境值
sudo tee /etc/hermes/.env >/dev/null <<'ENV'
OPENAI_API_BASE=https://inference.example.com/v1
ENV

sudo chmod 0755 /etc/hermes
sudo chmod 0644 /etc/hermes/config.yaml /etc/hermes/.env
```

更改在下次 Hermes 启动时生效（格式错误的托管文件会被记录并忽略——它不会阻止启动，但管理员应检查 `hermes doctor` 以确认策略已生效）。

## 安全模型与限制（v1）

- **执行仅依赖文件系统权限。** 如果用户对托管目录有写权限（或以 `root` 运行 Hermes），托管作用域仅为建议性。
- **托管 `.env` 全局可读**（`0644`），因此任何本地用户都可以读取通过它推送的密钥。应用于共享的、不敏感的值（组织 API 基础 URL、功能默认值），而非高敏感度密钥。
- **智能体自身的工具不会被硬性阻止覆盖托管的*环境*值。** 托管的环境变量在启动时应用，但没有什么能阻止智能体在自己的子进程 shell 中设置不同的值。v1 是针对普通用户的管理便利边界，而非不可逃逸的沙箱。

以下在 v1 中**有意排除**，后续可能加入：

- 智能体自身无法逃逸的硬性边界。
- macOS 和 Windows 上的原生托管位置（v1 优先支持 Linux/POSIX）。
- 用于分层策略的即插即用片段目录（`managed.d/`）。
- 已签名/完整性检查的托管文件。
- 远程/设备管理（MDM）交付。
- 托管密钥的更严格（组范围）权限。