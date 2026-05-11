---
title: "地图 — 通过 OpenStreetMap/OSRM 进行地理编码、查找兴趣点、路线和时区"
sidebar_label: "地图"
description: "通过 OpenStreetMap/OSRM 进行地理编码、查找兴趣点、路线和时区"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源 SKILL.md，而非此页面。 */}

# 地图

通过 OpenStreetMap/OSRM 进行地理编码、查找兴趣点、路线和时区。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/productivity/maps` |
| 版本 | `1.2.0` |
| 作者 | Mibayy |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `maps`, `geocoding`, `places`, `routing`, `distance`, `directions`, `nearby`, `location`, `openstreetmap`, `nominatim`, `overpass`, `osrm` |

## 参考：完整的 SKILL.md

:::info
以下是触发此技能时，Hermes 加载的完整技能定义。这是技能激活时，智能体看到的指令内容。
:::

# 地图技能

使用免费、开放的数据源进行位置情报分析。8个命令，44个兴趣点类别，零依赖（仅使用 Python 标准库），无需 API 密钥。

数据来源：OpenStreetMap/Nominatim、Overpass API、OSRM、TimeAPI.io。

此技能取代了旧的 `find-nearby` 技能——`find-nearby` 的所有功能都已包含在下面的 `nearby` 命令中，并保留了相同的 `--near "<place>"` 快捷方式和多类别支持。

## 何时使用

- 用户发送一个 Telegram 位置标记（消息中包含纬度/经度）→ 使用 `nearby`
- 用户想要某个地名的坐标 → 使用 `search`
- 用户有坐标并想要地址 → 使用 `reverse`
- 用户询问附近的餐厅、医院、药房、酒店等 → 使用 `nearby`
- 用户想要驾车/步行/骑行距离或行程时间 → 使用 `distance`
- 用户想要两个地点之间的分步导航 → 使用 `directions`
- 用户想要某个位置的时区信息 → 使用 `timezone`
- 用户想要在某个地理区域内搜索兴趣点 → 使用 `area` + `bbox`

## 前提条件

Python 3.8+（仅使用标准库——无需 pip 安装任何包）。

脚本路径：`~/.hermes/skills/maps/scripts/maps_client.py`

## 命令

```bash
MAPS=~/.hermes/skills/maps/scripts/maps_client.py
```

### search — 对地名进行地理编码

```bash
python3 $MAPS search "埃菲尔铁塔"
python3 $MAPS search "华盛顿特区宾夕法尼亚大道1600号"
```

返回：纬度、经度、显示名称、类型、边界框、重要性评分。

### reverse — 坐标转地址

```bash
python3 $MAPS reverse 48.8584 2.2945
```

返回：完整的地址分解（街道、城市、州、国家、邮编）。

### nearby — 按类别查找地点

```bash
# 按坐标（例如来自 Telegram 位置标记）
python3 $MAPS nearby 48.8584 2.2945 restaurant --limit 10
python3 $MAPS nearby 40.7128 -74.0060 hospital --radius 2000

# 按地址/城市/邮编/地标 — --near 会自动进行地理编码
python3 $MAPS nearby --near "纽约时代广场" --category cafe
python3 $MAPS nearby --near "90210" --category pharmacy

# 将多个类别合并到一个查询中
python3 $MAPS nearby --near "奥斯汀市中心" --category restaurant --category bar --limit 10
```

46个类别：restaurant, cafe, bar, hospital, pharmacy, hotel, guest_house,
camp_site, supermarket, atm, gas_station, parking, museum, park, school,
university, bank, police, fire_station, library, airport, train_station,
bus_stop, church, mosque, synagogue, dentist, doctor, cinema, theatre, gym,
swimming_pool, post_office, convenience_store, bakery, bookshop, laundry,
car_wash, car_rental, bicycle_rental, taxi, veterinary, zoo, playground,
stadium, nightclub。

每个结果包含：`name`（名称）、`address`（地址）、`lat`/`lon`（纬度/经度）、`distance_m`（距离米）、`maps_url`（可点击的谷歌地图链接）、`directions_url`（从搜索点出发的谷歌地图导航链接），以及可用时的推荐标签 — `cuisine`（菜系）、`hours`（营业时间）、`phone`（电话）、`website`（网站）。

### distance — 旅行距离和时间

```bash
python3 $MAPS distance "巴黎" --to "里昂"
python3 $MAPS distance "纽约" --to "波士顿" --mode driving
python3 $MAPS distance "大本钟" --to "伦敦塔桥" --mode walking
```

模式：driving（默认）、walking、cycling。返回道路距离、行程时间以及用于比较的直线距离。

### directions — 分步导航

```bash
python3 $MAPS directions "埃菲尔铁塔" --to "卢浮宫" --mode walking
python3 $MAPS directions "肯尼迪国际机场" --to "时代广场" --mode driving
```

返回编号的步骤，包含指示、距离、时间、道路名称和机动类型（转弯、出发、到达等）。

### timezone — 坐标的时区

```bash
python3 $MAPS timezone 48.8584 2.2945
python3 $MAPS timezone 35.6762 139.6503
```

返回时区名称、UTC 偏移量和当前本地时间。

### area — 地点的边界框和面积

```bash
python3 $MAPS area "纽约曼哈顿"
python3 $MAPS area "伦敦"
```

返回边界框坐标、宽度/高度（公里）和近似面积。可用作 bbox 命令的输入。

### bbox — 在边界框内搜索

```bash
python3 $MAPS bbox 40.75 -74.00 40.77 -73.98 restaurant --limit 20
```

在地理矩形区域内查找兴趣点。先使用 `area` 获取命名地点的边界框坐标。

## 处理 Telegram 位置标记

当用户发送位置标记时，消息包含 `latitude:` 和 `longitude:` 字段。提取这些值并直接传递给 `nearby`：

```bash
# 用户发送了一个位于 36.17, -115.14 的标记，并询问“查找附近的咖啡馆”
python3 $MAPS nearby 36.17 -115.14 cafe --radius 1500
```

将结果呈现为带编号的列表，包含名称、距离和 `maps_url` 字段，这样用户就可以在聊天中点击链接打开。对于“现在营业吗？”的问题，检查 `hours` 字段；如果缺失或不清楚，使用 `web_search` 进行验证，因为 OSM 的营业时间由社区维护，并不总是最新的。

## 工作流示例

**“在罗马斗兽场附近找意大利餐厅”：**
1. `nearby --near "罗马斗兽场" --category restaurant --radius 500`
   — 一个命令，自动地理编码

**“他们发送的这个位置标记附近有什么？”：**
1. 从 Telegram 消息中提取纬度/经度
2. `nearby LAT LON cafe --radius 1500`

**“我怎么从酒店走到会议中心？”：**
1. `directions "酒店名称" --to "会议中心" --mode walking`

**“西雅图市中心有哪些餐厅？”：**
1. `area "西雅图市中心"` → 获取边界框
2. `bbox S W N E restaurant --limit 30`

## 注意事项

- Nominatim 服务条款：每秒最多 1 次请求（脚本会自动处理）
- `nearby` 需要纬度/经度 或 `--near "<地址>"` — 两者必有其一
- OSRM 路线覆盖在欧洲和北美地区表现最佳
- Overpass API 在高峰时段可能较慢；脚本会自动在镜像服务器之间切换（overpass-api.de → overpass.kumi.systems）
- `distance` 和 `directions` 使用 `--to` 标志指定目的地（而非位置参数）
- 如果仅凭邮编在全球范围内结果不明确，请包含国家/州信息

## 验证

```bash
python3 ~/.hermes/skills/maps/scripts/maps_client.py search "自由女神像"
# 应返回纬度约为 40.689，经度约为 -74.044

python3 ~/.hermes/skills/maps/scripts/maps_client.py nearby --near "时代广场" --category restaurant --limit 3
# 应返回时代广场约 500 米范围内的餐厅列表
```