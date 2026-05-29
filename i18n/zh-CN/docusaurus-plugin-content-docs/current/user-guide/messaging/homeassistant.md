---
title: Home Assistant
description: 通过 Home Assistant 集成，使用 Hermes 智能体控制您的智能家居。
sidebar_label: Home Assistant
sidebar_position: 5
---

# Home Assistant 集成

Hermes 智能体通过以下两种方式与 [Home Assistant](https://www.home-assistant.io/) 集成：

1. **网关平台** — 通过 WebSocket 订阅实时状态变更并响应事件
2. **智能家居工具** — 四个可通过大语言模型调用的工具，用于通过 REST API 查询和控制设备

## 设置

### 1. 创建长期访问令牌

1. 打开您的 Home Assistant 实例
2. 进入您的 **个人资料** (点击侧边栏中的您的名字)
3. 滚动到 **长期访问令牌**
4. 点击 **创建令牌**，为其起一个名称，例如 "Hermes Agent"
5. 复制该令牌

### 2. 配置环境变量

```bash
# 添加到 ~/.hermes/.env

# 必需: 您的长期访问令牌
HASS_TOKEN=your-long-lived-access-token

# 可选: HA URL (默认: http://homeassistant.local:8123)
HASS_URL=http://192.168.1.100:8123
```

:::info
当设置了 `HASS_TOKEN` 时，`homeassistant` 工具集将自动启用。网关平台和设备控制工具都通过此单一令牌激活。
:::

### 3. 启动网关

```bash
hermes gateway
```

Home Assistant 将作为已连接的平台出现在任何其他消息平台（Telegram、Discord 等）旁边。

## 可用工具

Hermes 智能体注册了四个用于智能家居控制的工具：

### `ha_list_entities`

列出 Home Assistant 实体，可选按域或区域过滤。

**参数：**
- `domain` *(可选)* — 按实体域过滤：`light`、`switch`、`climate`、`sensor`、`binary_sensor`、`cover`、`fan`、`media_player` 等。
- `area` *(可选)* — 按区域/房间名称过滤（与友好名称匹配）：`living room`、`kitchen`、`bedroom` 等。

**示例：**
```
列出客厅的所有灯
```

返回实体 ID、状态和友好名称。

### `ha_get_state`

获取单个实体的详细状态，包括所有属性（亮度、颜色、温度设定值、传感器读数等）。

**参数：**
- `entity_id` *(必需)* — 要查询的实体，例如 `light.living_room`、`climate.thermostat`、`sensor.temperature`

**示例：**
```
climate.thermostat 的当前状态是什么？
```

返回：状态、所有属性、最后更改/更新时间戳。

### `ha_list_services`

列出用于设备控制的可用服务（操作）。显示每种设备类型可以执行哪些操作以及它们接受哪些参数。

**参数：**
- `domain` *(可选)* — 按域过滤，例如 `light`、`climate`、`switch`

**示例：**
```
气候设备有哪些可用服务？
```

### `ha_call_service`

调用 Home Assistant 服务以控制设备。

**参数：**
- `domain` *(必需)* — 服务域：`light`、`switch`、`climate`、`cover`、`media_player`、`fan`、`scene`、`script`
- `service` *(必需)* — 服务名称：`turn_on`、`turn_off`、`toggle`、`set_temperature`、`set_hvac_mode`、`open_cover`、`close_cover`、`set_volume_level`
- `entity_id` *(可选)* — 目标实体，例如 `light.living_room`
- `data` *(可选)* — 作为 JSON 对象的附加参数

**示例：**

```
打开客厅灯
→ ha_call_service(domain="light", service="turn_on", entity_id="light.living_room")
```

```
将恒温器设置为 22 度加热模式
→ ha_call_service(domain="climate", service="set_temperature",
    entity_id="climate.thermostat", data={"temperature": 22, "hvac_mode": "heat"})
```

```
将客厅灯设置为蓝色，亮度 50%
→ ha_call_service(domain="light", service="turn_on",
    entity_id="light.living_room", data={"brightness": 128, "color_name": "blue"})
```

## 网关平台：实时事件

Home Assistant 网关适配器通过 WebSocket 连接并订阅 `state_changed` 事件。当设备状态发生变化并匹配您的过滤器时，它会作为消息转发给智能体。

### 事件过滤

:::warning 必需配置
默认情况下，**不会转发任何事件**。您必须配置 `watch_domains`、`watch_entities` 或 `watch_all` 中的至少一个才能接收事件。如果没有过滤器，启动时会记录警告，并且所有状态变更都会被静默丢弃。
:::

在 `~/.hermes/config.yaml` 中 Home Assistant 平台的 `extra` 部分配置智能体可以看到哪些事件：

```yaml
platforms:
  homeassistant:
    enabled: true
    extra:
      watch_domains:
        - climate
        - binary_sensor
        - alarm_control_panel
        - light
      watch_entities:
        - sensor.front_door_battery
      ignore_entities:
        - sensor.uptime
        - sensor.cpu_usage
        - sensor.memory_usage
      cooldown_seconds: 30
```

| 设置 | 默认值 | 描述 |
|---------|---------|-------------|
| `watch_domains` | *(无)* | 仅监控这些实体域（例如 `climate`、`light`、`binary_sensor`） |
| `watch_entities` | *(无)* | 仅监控这些特定的实体 ID |
| `watch_all` | `false` | 设置为 `true` 以接收 **所有** 状态变更（不推荐用于大多数设置） |
| `ignore_entities` | *(无)* | 始终忽略这些实体（在域/实体过滤器之前应用） |
| `cooldown_seconds` | `30` | 同一实体事件之间的最小间隔秒数 |

:::tip
从一组聚焦的域开始 — `climate`、`binary_sensor` 和 `alarm_control_panel` 涵盖最有用的自动化。根据需要添加更多。使用 `ignore_entities` 来抑制 CPU 温度或正常运行时间计数器等嘈杂的传感器。
:::

### 事件格式化

状态变更根据域格式化为人类可读的消息：

| 域 | 格式 |
|--------|--------|
| `climate` | "HVAC 模式从 'off' 更改为 'heat' (当前: 21, 目标: 23)" |
| `sensor` | "从 21°C 变为 22°C" |
| `binary_sensor` | "触发" / "清除" |
| `light`、`switch`、`fan` | "打开" / "关闭" |
| `alarm_control_panel` | "报警状态从 'armed_away' 更改为 'triggered'" |
| *(其他)* | "从 '旧值' 变为 '新值'" |

### 智能体响应

来自智能体的出站消息作为 **Home Assistant 持久通知** 投递（通过 `persistent_notification.create`）。它们会出现在 HA 通知面板中，标题为 "Hermes Agent"。

### 连接管理

- **WebSocket** 带有 30 秒心跳用于实时事件
- **自动重连** 带有退避策略：5s → 10s → 30s → 60s
- **REST API** 用于出站通知（单独会话以避免 WebSocket 冲突）
- **授权** — HA 事件始终是授权的（无需用户允许列表，因为 `HASS_TOKEN` 验证了连接）

## 安全性

Home Assistant 工具强制执行安全限制：

:::warning 被阻止的域
以下服务域被 **阻止** 以防止在 HA 主机上执行任意代码：

- `shell_command` — 任意 shell 命令
- `command_line` — 执行命令的传感器/开关
- `python_script` — 脚本化的 Python 执行
- `pyscript` — 更广泛的脚本集成
- `hassio` — 插件控制、主机关闭/重启
- `rest_command` — 来自 HA 服务器的 HTTP 请求（SSRF 攻击向量）

尝试调用这些域中的服务会返回错误。
:::

实体 ID 会根据模式 `^[a-z_][a-z0-9_]*\.[a-z0-9_]+$` 进行验证，以防止注入攻击。

## 自动化示例

### 早间例程

```
用户：开始我的早间例程

智能体：
1. ha_call_service(domain="light", service="turn_on",
     entity_id="light.bedroom", data={"brightness": 128})
2. ha_call_service(domain="climate", service="set_temperature",
     entity_id="climate.thermostat", data={"temperature": 22})
3. ha_call_service(domain="media_player", service="turn_on",
     entity_id="media_player.kitchen_speaker")
```

### 安全检查

```
用户：房子安全吗？

智能体：
1. ha_list_entities(domain="binary_sensor")
     → 检查门窗传感器
2. ha_get_state(entity_id="alarm_control_panel.home")
     → 检查报警器状态
3. ha_list_entities(domain="lock")
     → 检查锁的状态
4. 报告："所有门已关闭，报警器处于 armed_away 状态，所有锁已锁好。"
```

### 响应式自动化（通过网关事件）

当作为网关平台连接时，智能体可以对事件做出反应：

```
[Home Assistant] 前门：已触发 (之前是清除状态)

智能体自动执行：
1. ha_get_state(entity_id="binary_sensor.front_door")
2. ha_call_service(domain="light", service="turn_on",
     entity_id="light.hallway")
3. 发送通知："前门已打开。走廊灯已打开。"
```

## 故障排除

**环境变量未被读取。**
适配器从 `~/.hermes/.env`（启动时自动合并）或 `config.yaml` 读取凭据。请仔细检查该文件是否位于活动的 Hermes 配置主目录下，并且 URL/令牌周围没有多余的引号。编辑后请重启网关 — 环境变量仅在进程启动时应用。

**`conversation entity not found` / 智能体从不回复。**
Home Assistant 的对话 API 需要配置一个 *Assist* 对话智能体。在 HA 中，打开 **设置 → 语音助手 → 添加助手**，记下生成的实体 ID（看起来像 `conversation.home_assistant` 或 `conversation.openai_<name>`）。在适配器的 `conversation_entity` 设置中设置该实体 ID；默认值可能在您的实例上不存在。

**REST 认证失败 (`401 Unauthorized`)。**
该令牌必须是来自您的 HA 用户资料页面 (**个人资料 → 安全 → 长期访问令牌**) 创建的 *长期访问令牌*。短期的 UI 会话令牌不起作用。同时验证基础 URL 包含协议和端口（例如 `http://homeassistant.local:8123`），并且可以从运行 Hermes 的主机访问 — `curl -H "Authorization: Bearer <token>" <url>/api/` 应该返回 `{"message": "API running."}`。