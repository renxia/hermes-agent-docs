---
title: "健身营养 — 健身房锻炼计划与营养追踪器"
sidebar_label: "健身营养"
description: "健身房锻炼计划与营养追踪器"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# 健身营养

健身房锻炼计划与营养追踪器。通过 wger 按肌肉群、器械或类别搜索 690+ 种锻炼动作。通过美国农业部食品数据中心查询 380,000+ 种食物的营养成分和卡路里。计算 BMI、TDEE、单次最大重量、宏量营养素分配和体脂率 — 纯 Python 实现，无需 pip 安装。专为追求增肌、减脂或只是想吃得更好的人群打造。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/health/fitness-nutrition` 安装 |
| 路径 | `optional-skills/health/fitness-nutrition` |
| 版本 | `1.0.0` |
| 许可证 | MIT |
| 标签 | `health`, `fitness`, `nutrition`, `gym`, `workout`, `diet`, `exercise` |

## 参考：完整的 SKILL.md

:::info
以下是触发此技能时 Hermes 加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 健身与营养

专业健身教练和运动营养师技能。两个数据源
加上离线计算器——健身爱好者所需的一切尽在一处。

**数据源（全部免费，无 pip 依赖）：**

- **wger** (https://wger.de/api/v2/) — 开放式运动数据库，包含 690+ 个动作及其涉及肌肉、器械和图片。公共端点无需身份验证。
- **USDA FoodData Central** (https://api.nal.usda.gov/fdc/v1/) — 美国政府营养数据库，包含 380,000+ 种食物。`DEMO_KEY` 可立即使用；免费注册可获得更高限额。

**离线计算器（纯标准库 Python）：**

- BMI、TDEE（Mifflin-St Jeor）、单次最大重量（Epley/Brzycki/Lombardi）、宏量营养素分配、体脂率%（美国海军法）

---

## 何时使用

当用户询问以下内容时触发此技能：
- 动作、训练计划、健身房常规、肌群、训练分化
- 食物宏量营养素、卡路里、蛋白质含量、膳食计划、卡路里计算
- 身体成分：BMI、体脂率、TDEE、热量盈余/赤字
- 单次最大重量估算、训练百分比、渐进式超负荷
- 减脂、增肌或维持的宏量营养素比例

---

## 流程

### 动作查询（wger API）

所有 wger 公共端点均返回 JSON 且无需身份验证。务必在动作查询中添加
`format=json` 和 `language=2`（英语）。

**第 1 步 — 确定用户想要什么：**

- 按肌肉 → 使用 `/api/v2/exercise/?muscles={id}&language=2&status=2&format=json`
- 按类别 → 使用 `/api/v2/exercise/?category={id}&language=2&status=2&format=json`
- 按器械 → 使用 `/api/v2/exercise/?equipment={id}&language=2&status=2&format=json`
- 按名称 → 使用 `/api/v2/exercise/search/?term={query}&language=english&format=json`
- 完整详情 → 使用 `/api/v2/exerciseinfo/{exercise_id}/?format=json`

**第 2 步 — 参考 ID（避免额外 API 调用）：**

动作类别：

| ID | 类别       |
|----|------------|
| 8  | 手臂       |
| 9  | 腿部       |
| 10 | 腹部       |
| 11 | 胸部       |
| 12 | 背部       |
| 13 | 肩部       |
| 14 | 小腿       |
| 15 | 有氧运动   |

肌肉：

| ID | 肌肉                     | ID | 肌肉                   |
|----|--------------------------|----|------------------------|
| 1  | 肱二头肌                 | 2  | 前三角肌               |
| 3  | 前锯肌                   | 4  | 胸大肌                 |
| 5  | 外斜肌                   | 6  | 腓肠肌                 |
| 7  | 腹直肌                   | 8  | 臀大肌                 |
| 9  | 斜方肌                   | 10 | 股四头肌               |
| 11 | 股二头肌                 | 12 | 背阔肌                 |
| 13 | 肱肌                     | 14 | 肱三头肌               |
| 15 | 比目鱼肌                 |    |                        |

器械：

| ID | 器械         |
|----|--------------|
| 1  | 杠铃         |
| 3  | 哑铃         |
| 4  | 健身垫       |
| 5  | 瑞士球       |
| 6  | 引体向上杆   |
| 7  | 无（自重）   |
| 8  | 平板凳       |
| 9  | 上斜凳       |
| 10 | 壶铃         |

**第 3 步 — 获取并呈现结果：**

```bash
# 按名称搜索动作
QUERY="$1"
ENCODED=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$QUERY")
curl -s "https://wger.de/api/v2/exercise/search/?term=${ENCODED}&language=english&format=json" \
  | python3 -c "
import json,sys
data=json.load(sys.stdin)
for s in data.get('suggestions',[])[:10]:
    d=s.get('data',{})
    print(f\"  ID {d.get('id','?'):>4} | {d.get('name','N/A'):<35} | 类别: {d.get('category','N/A')}\")
"
```

```bash
# 获取特定动作的完整详情
EXERCISE_ID="$1"
curl -s "https://wger.de/api/v2/exerciseinfo/${EXERCISE_ID}/?format=json" \
  | python3 -c "
import json,sys,html,re
data=json.load(sys.stdin)
trans=[t for t in data.get('translations',[]) if t.get('language')==2]
t=trans[0] if trans else data.get('translations',[{}])[0]
desc=re.sub('<[^>]+>','',html.unescape(t.get('description','N/A')))
print(f\"动作      : {t.get('name','N/A')}\")
print(f\"类别      : {data.get('category',{}).get('name','N/A')}\")
print(f\"主要肌群  : {', '.join(m.get('name_en','') for m in data.get('muscles',[])) or 'N/A'}\")
print(f\"次要肌群  : {', '.join(m.get('name_en','') for m in data.get('muscles_secondary',[])) or '无'}\")
print(f\"器械      : {', '.join(e.get('name','') for e in data.get('equipment',[])) or '自重'}\")
print(f\"如何做    : {desc[:500]}\")
imgs=data.get('images',[])
if imgs: print(f\"图片      : {imgs[0].get('image','')}\")
"
```

```bash
# 列出按肌肉、类别或器械筛选的动作
# 可按需组合筛选条件：?muscles=4&equipment=1&language=2&status=2
FILTER="$1"  # 例如 "muscles=4" 或 "category=11" 或 "equipment=3"
curl -s "https://wger.de/api/v2/exercise/?${FILTER}&language=2&status=2&limit=20&format=json" \
  | python3 -c "
import json,sys
data=json.load(sys.stdin)
print(f'找到 {data.get(\"count\",0)} 个动作。')
for ex in data.get('results',[]):
    print(f\"  ID {ex['id']:>4} | 肌肉: {ex.get('muscles',[])} | 器械: {ex.get('equipment',[])}\")
"
```

### 营养查询（USDA FoodData Central）

如果设置了 `USDA_API_KEY` 环境变量则使用它，否则回退到 `DEMO_KEY`。
DEMO_KEY = 每小时 30 次请求。免费注册密钥 = 每小时 1,000 次请求。

```bash
# 按名称搜索食物
FOOD="$1"
API_KEY="${USDA_API_KEY:-DEMO_KEY}"
ENCODED=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$FOOD")
curl -s "https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${API_KEY}&query=${ENCODED}&pageSize=5&dataType=Foundation,SR%20Legacy" \
  | python3 -c "
import json,sys
data=json.load(sys.stdin)
foods=data.get('foods',[])
if not foods: print('未找到食物。'); sys.exit()
for f in foods:
    n={x['nutrientName']:x.get('value','?') for x in f.get('foodNutrients',[])}
    cal=n.get('Energy','?'); prot=n.get('Protein','?')
    fat=n.get('Total lipid (fat)','?'); carb=n.get('Carbohydrate, by difference','?')
    print(f\"{f.get('description','N/A')}\")
    print(f\"  每 100 克: {cal} 千卡 | {prot} 克蛋白质 | {fat} 克脂肪 | {carb} 克碳水\")
    print(f\"  FDC ID: {f.get('fdcId','N/A')}\")
    print()
"
```

```bash
# 通过 FDC ID 获取详细营养概况
FDC_ID="$1"
API_KEY="${USDA_API_KEY:-DEMO_KEY}"
curl -s "https://api.nal.usda.gov/fdc/v1/food/${FDC_ID}?api_key=${API_KEY}" \
  | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(f\"食物: {d.get('description','N/A')}\")
print(f\"{'营养素':<40} {'含量':>8} {'单位'}\")
print('-'*56)
for x in sorted(d.get('foodNutrients',[]),key=lambda x:x.get('nutrient',{}).get('rank',9999)):
    nut=x.get('nutrient',{}); amt=x.get('amount',0)
    if amt and float(amt)>0:
        print(f\"  {nut.get('name',''):<38} {amt:>8} {nut.get('unitName','')}\")
"
```

### 离线计算器

使用 `scripts/` 中的辅助脚本进行批量操作，
或内联运行以进行单次计算：

- `python3 scripts/body_calc.py bmi <体重_公斤> <身高_厘米>`
- `python3 scripts/body_calc.py tdee <体重_公斤> <身高_厘米> <年龄> <M|F> <活动量 1-5>`
- `python3 scripts/body_calc.py 1rm <重量> <次数>`
- `python3 scripts/body_calc.py macros <TDEE_千卡> <减脂|维持|增肌>`
- `python3 scripts/body_calc.py bodyfat <M|F> <颈围_厘米> <腰围_厘米> [臀围_厘米] <身高_厘米>`

有关每个公式背后的科学原理，请参阅 `references/FORMULAS.md`。

---

## 陷阱

- wger 动作端点默认返回**所有语言** — 务必添加 `language=2` 以获取英语
- wger 包含**未经验证的用户提交内容** — 添加 `status=2` 以仅获取已审核动作
- USDA `DEMO_KEY` 限制为**每小时 30 次请求** — 在批量请求之间添加 `sleep 2` 或获取免费密钥
- USDA 数据为**每 100 克** — 提醒用户根据实际份量进行调整
- BMI 无法区分肌肉和脂肪 — 肌肉发达者的高 BMI 不一定不健康
- 体脂率公式为**估算值**（±3-5%）— 建议进行 DEXA 扫描以获得精确结果
- 单次最大重量公式在超过 10 次重复时准确性下降 — 使用 3-5 次重复组以获得最佳估算
- wger 的 `exercise/search` 端点使用 `term` 而非 `query` 作为参数名

---

## 验证

执行动作搜索后：确认结果包含动作名称、肌群和器械。
执行营养查询后：确认返回每 100 克的宏量营养素（千卡、蛋白质、脂肪、碳水）。
执行计算器后：对输出进行合理性检查（例如，大多数成年人的 TDEE 应在 1500-3500 之间）。

---

## 快速参考

| 任务 | 数据源 | 端点 |
|------|--------|------|
| 按名称搜索动作 | wger | `GET /api/v2/exercise/search/?term=&language=english` |
| 动作详情 | wger | `GET /api/v2/exerciseinfo/{id}/` |
| 按肌肉筛选 | wger | `GET /api/v2/exercise/?muscles={id}&language=2&status=2` |
| 按器械筛选 | wger | `GET /api/v2/exercise/?equipment={id}&language=2&status=2` |
| 列出类别 | wger | `GET /api/v2/exercisecategory/` |
| 列出肌肉 | wger | `GET /api/v2/muscle/` |
| 搜索食物 | USDA | `GET /fdc/v1/foods/search?query=&dataType=Foundation,SR Legacy` |
| 食物详情 | USDA | `GET /fdc/v1/food/{fdcId}` |
| BMI / TDEE / 1RM / 宏量营养素 | 离线 | `python3 scripts/body_calc.py` |