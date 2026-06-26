---
title: "Canvas — Canvas LMS 集成 — 使用 API 令牌身份验证获取已注册的课程和作业"
sidebar_label: "Canvas"
description: "Canvas LMS 集成 — 使用 API 令牌身份验证获取已注册的课程和作业"
---

{/* 此页面由网站/scripts/generate-skill-docs.py 脚本自动生成自技能的SKILL.md。请编辑源文件SKILL.md，而不是本页面。 */}

# Canvas

Canvas LMS 集成 — 使用 API 令牌身份验证获取已注册的课程和作业。

## Skill metadata

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/productivity/canvas` 安装 |
| Path | `optional-skills/productivity/canvas` |
| Version | `1.0.0` |
| Author | community |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `Canvas`, `LMS`, `Education`, `Courses`, `Assignments` |

## Reference: full SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# Canvas LMS — 课程和作业访问

对 Canvas LMS 的只读访问，用于列出课程和作业。

## Scripts

- `scripts/canvas_api.py` — 用于 Canvas API 调用的 Python CLI

## Setup

1. 在浏览器中登录您的 Canvas 实例
2. 导航到 **账户 → 设置**（点击您的个人资料图标，然后选择设置）
3. 滚动到 **已批准的集成** 并点击 **+ 新建访问令牌**
4. 为令牌命名（例如：“Hermes 智能体”），设置可选的过期时间，然后点击 **生成令牌**
5. 复制令牌并添加到 `${HERMES_HOME:-~/.hermes}/.env`：

```
CANVAS_API_TOKEN=your_token_here
CANVAS_BASE_URL=https://yourschool.instructure.com
```

基础 URL 是您登录 Canvas 时浏览器中显示的任何内容（不带尾斜杠）。

## Usage

```bash
CANVAS="python $HERMES_HOME/skills/productivity/canvas/scripts/canvas_api.py"

# 列出所有活跃课程
$CANVAS list_courses --enrollment-state active

# 列出所有课程（任何状态）
$CANVAS list_courses

# 列出特定课程的作业
$CANVAS list_assignments 12345

# 按截止日期排序并列出作业
$CANVAS list_assignments 12345 --order-by due_at
```

## Output Format

**list_courses** 返回：
```json
[{"id": 12345, "name": "Intro to CS", "course_code": "CS101", "workflow_state": "available", "start_at": "...", "end_at": "..."}]
```

**list_assignments** 返回：
```json
[{"id": 67890, "name": "Homework 1", "due_at": "2025-02-15T23:59:00Z", "points_possible": 100, "submission_types": ["online_upload"], "html_url": "...", "description": "...", "course_id": 12345}]
```

注意：作业描述已被截断至 500 个字符。`html_url` 字段链接到 Canvas 中的完整作业页面。

## API Reference (curl)

```bash
# 列出课程
curl -s -H "Authorization: Bearer $CANVAS_API_TOKEN" \
  "$CANVAS_BASE_URL/api/v1/courses?enrollment_state=active&per_page=10"

# 列出特定课程的作业
curl -s -H "Authorization: Bearer $CANVAS_API_TOKEN" \
  "$CANVAS_BASE_URL/api/v1/courses/COURSE_ID/assignments?per_page=10&order_by=due_at"
```

Canvas 使用 `Link` 标头进行分页。Python 脚本会自动处理分页。

## Rules

- 此技能是**只读**的——它只获取数据，绝不会修改课程或作业
- 首次使用时，通过运行 `$CANVAS list_courses` 来验证身份——如果返回 401 错误，请引导用户完成设置。
- Canvas 的速率限制约为每 10 分钟 700 次请求；如果达到限制，请检查 `X-Rate-Limit-Remaining` 标头。

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 401 Unauthorized | 令牌无效或已过期——在 Canvas 设置中重新生成 |
| 403 Forbidden | 令牌缺乏此课程的权限 |
| Empty course list | 尝试使用 `--enrollment-state active` 或省略该标志以查看所有状态 |
| Wrong institution | 验证 `CANVAS_BASE_URL` 是否与浏览器中的 URL 匹配 |
| Timeout errors | 检查到您的 Canvas 实例的网络连接性 |