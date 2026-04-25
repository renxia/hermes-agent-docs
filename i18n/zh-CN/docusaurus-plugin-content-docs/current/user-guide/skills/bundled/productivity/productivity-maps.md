---
title: "地图"
sidebar_label: "地图"
description: "位置智能 — 地理编码地点、反向地理编码坐标、查找附近地点（46 个兴趣点类别）、驾车/步行/骑行距离 + 时间、逐向导航..."
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# 地图

位置智能 — 地理编码地点、反向地理编码坐标、查找附近地点（46 个兴趣点类别）、驾车/步行/骑行距离 + 时间、逐向导航、时区查询、命名地点的边界框 + 面积，以及矩形区域内的兴趣点搜索。使用 OpenStreetMap + Overpass + OSRM。免费，无需 API 密钥。

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/productivity/maps` |
| 版本 | `1.2.0` |
| 作者 | Mibayy |
| 许可证 | MIT |
| 标签 | `maps`, `geocoding`, `places`, `routing`, `distance`, `directions`, `nearby`, `location`, `openstreetmap`, `nominatim`, `overpass`, `osrm` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 地图技能

使用免费开放数据源的位置智能。8 个命令，44 个兴趣点类别，零依赖（仅 Python 标准库），无需 API 密钥。

数据源：OpenStreetMap/Nominatim、Overpass API、OSRM、TimeAPI.io。

此技能取代了旧的 `find-nearby` 技能 — `find-nearby` 的所有功能均由下面的 `nearby` 命令覆盖，使用相同的 `--near "<place>"` 快捷方式和多类别支持。

## 何时使用

- 用户发送 Telegram 位置图钉（消息中包含纬度/经度）→ `nearby`
- 用户想要地点名称的坐标 → `search`
- 用户有坐标并想要地址 → `reverse`
- 用户询问附近的餐厅、医院、药店、酒店等 → `nearby`
- 用户想要驾车/步行/骑行距离或旅行时间 → `distance`
- 用户想要两个地点之间的逐向导航 → `directions`
- 用户想要某地的时区信息 → `timezone`
- 用户想要在地理区域内搜索兴趣点 → `area` + `bbox`

## 先决条件

Python 3.8+（仅标准库 — 无需 pip 安装）。

脚本路径：`~/.hermes/skills/maps/scripts/maps_client.py`

## 命令

```bash
MAPS=~/.hermes/skills/maps/scripts/maps_client.py
```

### search — 地理编码地点名称

```bash
python3 $MAPS search "Eiffel Tower"
python3 $MAPS search "1600 Pennsylvania Ave, Washington DC"
```

返回：纬度、经度、显示名称、类型、边界框、重要性得分。

### reverse — 坐标转地址

```bash
python3 $MAPS reverse 48.8584 2.2945
```

返回：完整地址分解（街道、城市、州、国家、邮政编码）。

### nearby — 按类别查找地点

```bash
# 通过坐标（例如来自 Telegram 位置图钉）
python3 $MAPS nearby 48.8584 2.2945 restaurant --limit 10
python3 $MAPS nearby 40.7128 -74.0060 hospital --radius 2000

# 通过地址 / 城市 / 邮政编码 / 地标 — --near 自动地理编码
python3 $MAPS nearby --near "Times Square, New York" --category cafe
python3 $MAPS nearby --near "90210" --category pharmacy

# 多个类别合并为一个查询
python3 $MAPS nearby --near "downtown austin" --category restaurant --category bar --limit 10
```

46 个类别：restaurant（餐厅）、cafe（咖啡馆）、bar（酒吧）、hospital（医院）、pharmacy（药店）、hotel（酒店）、guest_house（宾馆）、camp_site（露营地）、supermarket（超市）、atm（ATM）、gas_station（加油站）、parking（停车场）、museum（博物馆）、park（公园）、school（学校）、university（大学）、bank（银行）、police（警察局）、fire_station（消防站）、library（图书馆）、airport（机场）、train_station（火车站）、bus_stop（公交车站）、church（教堂）、mosque（清真寺）、synagogue（犹太教堂）、dentist（牙医）、doctor（医生）、cinema（电影院）、theatre（剧院）、gym（健身房）、swimming_pool（游泳池）、post_office（邮局）、convenience_store（便利店）、bakery（面包店）、bookshop（书店）、laundry（洗衣店）、car_wash（洗车店）、car_rental（汽车租赁）、bicycle_rental（自行车租赁）、taxi（出租车）、veterinary（兽医）、zoo（动物园）、playground（游乐场）、stadium（体育场）、nightclub（夜总会）。

每个结果包括：`name`（名称）、`address`（地址）、`lat`/`lon`（纬度/经度）、`distance_m`（距离，单位：米）、`maps_url`（可点击的 Google 地图链接）、`directions_url`（从搜索点出发的 Google 地图导航链接），以及可用时的推广标签 — `cuisine`（菜系）、`hours`（营业时间）、`phone`（电话）、`website`（网站）。

### distance — 旅行距离和时间

```bash
python3 $MAPS distance "Paris" --to "Lyon"
python3 $MAPS distance "New York" --to "Boston" --mode driving
python3 $MAPS distance "Big Ben" --to "Tower Bridge" --mode walking
```

模式：driving（驾车，默认）、walking（步行）、cycling（骑行）。返回道路距离、持续时间以及直线距离（用于比较）。

### directions — 逐向导航

```bash
python3 $MAPS directions "Eiffel Tower" --to "Louvre Museum" --mode walking
python3 $MAPS directions "JFK Airport" --to "Times Square" --mode driving
```

返回带编号的步骤，包括指令、距离、持续时间、道路名称和操作类型（转弯、出发、到达等）。

### timezone — 坐标的时区

```bash
python3 $MAPS timezone 48.8584 2.2945
python3 $MAPS timezone 35.6762 139.6503
```

返回时区名称、UTC 偏移量和当前本地时间。

### area — 地点的边界框和面积

```bash
python3 $MAPS area "Manhattan, New York"
python3 $MAPS area "London"
```

返回边界框坐标、宽/高（单位：公里）和近似面积。可用作 `bbox` 命令的输入。

### bbox — 在边界框内搜索

```bash
python3 $MAPS bbox 40.75 -74.00 40.77 -73.98 restaurant --limit 20
```

在地理矩形区域内查找兴趣点。请先使用 `area` 获取命名地点的边界框坐标。

## 处理 Telegram 位置图钉

当用户发送位置图钉时，消息包含 `latitude:` 和 `longitude:` 字段。提取这些字段并直接传递给 `nearby`：

```bash
# 用户在 36.17, -115.14 发送了图钉并询问“查找附近的咖啡馆”
python3 $MAPS nearby 36.17 -115.14 cafe --radius 1500
```

将结果以带编号的列表形式呈现，包括名称、距离和 `maps_url` 字段，以便用户在聊天中获得“点击打开”链接。对于“现在营业吗？”等问题，请检查 `hours` 字段；如果缺失或不清楚，请使用 `web_search` 验证，因为 OSM 的营业时间由社区维护，并不总是最新的。

## 工作流示例

**“查找罗马斗兽场附近的意大利餐厅”：**
1. `nearby --near "Colosseum Rome" --category restaurant --radius 500`
   — 一个命令，自动地理编码

**“他们发送的这个位置图钉附近有什么？”：**
1. 从 Telegram 消息中提取纬度/经度
2. `nearby LAT LON cafe --radius 1500`

**“我如何从酒店步行到会议中心？”：**
1. `directions "Hotel Name" --to "Conference Center" --mode walking`

**“西雅图市中心有哪些餐厅？”：**
1. `area "Downtown Seattle"` → 获取边界框
2. `bbox S W N E restaurant --limit 30`

## 陷阱

- Nominatim 服务条款：最大 1 请求/秒（脚本自动处理）
- `nearby` 需要纬度/经度或 `--near "<address>"` — 两者之一必需
- OSRM 路由覆盖在欧洲和北美最佳
- Overpass API 在高峰时段可能较慢；脚本会自动在镜像之间回退（overpass-api.de → overpass.kumi.systems）
- `distance` 和 `directions` 使用 `--to` 标志指定目的地（而非位置参数）
- 如果仅使用邮政编码在全球范围内产生 ambiguous 结果，请包含国家/州

## 验证

```bash
python3 ~/.hermes/skills/maps/scripts/maps_client.py search "Statue of Liberty"
# 应返回纬度 ~40.689，经度 ~-74.044

python3 ~/.hermes/skills/maps/scripts/maps_client.py nearby --near "Times Square" --category restaurant --limit 3
# 应返回 Times Square 附近约 500 米内的餐厅列表
```