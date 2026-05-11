---
title: "Blender Mcp — 通过与blender-mcp插件的套接字连接，直接从Hermes控制Blender"
sidebar_label: "Blender Mcp"
description: "通过与blender-mcp插件的套接字连接，直接从Hermes控制Blender"
---

{/* 本页面由网站脚本/scripts/generate-skill-docs.py根据技能的SKILL.md文件自动生成。请编辑源文件SKILL.md，而非本页面。 */}

# Blender Mcp

通过与blender-mcp插件的套接字连接，直接从Hermes控制Blender。创建3D对象、材质、动画，并运行任意Blender Python (bpy) 代码。当用户希望在Blender中创建或修改任何内容时使用此技能。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/creative/blender-mcp` 安装 |
| 路径 | `optional-skills/creative/blender-mcp` |
| 版本 | `1.0.0` |
| 作者 | alireza78a |
| 平台 | linux, macos, windows |

## 参考：完整的SKILL.md

:::info
以下是此技能被触发时Hermes加载的完整技能定义。这是技能激活时智能体看到的说明。
:::

# Blender MCP

通过TCP端口9876上的套接字，从Hermes控制一个正在运行的Blender实例。

## 设置（一次性）

### 1. 安装Blender插件

    curl -sL https://raw.githubusercontent.com/ahujasid/blender-mcp/main/addon.py -o ~/Desktop/blender_mcp_addon.py

在Blender中：
    编辑 > 偏好设置 > 插件 > 安装 > 选择 blender_mcp_addon.py
    启用 "Interface: Blender MCP"

### 2. 在Blender中启动套接字服务器

在Blender视口按N键打开侧边栏。
找到 "BlenderMCP" 选项卡并点击 "启动服务器"。

### 3. 验证连接

    nc -z -w2 localhost 9876 && echo "OPEN" || echo "CLOSED"

## 协议

通过TCP传输纯UTF-8 JSON —— 无长度前缀。

发送：     &#123;"type": "&lt;command>", "params": &#123;&lt;kwargs>&#125;&#125;
接收：  &#123;"status": "success", "result": &lt;value>&#125;
          &#123;"status": "error",   "message": "&lt;reason>"&#125;

## 可用命令

| 类型                    | 参数              | 描述                            |
|-------------------------|-------------------|---------------------------------|
| execute_code            | code (str)        | 运行任意bpy Python代码          |
| get_scene_info          | (无)              | 列出场景中的所有对象            |
| get_object_info         | object_name (str) | 获取特定对象的详细信息          |
| get_viewport_screenshot | (无)              | 当前视口的截图                  |

## Python辅助函数

在execute_code工具调用中使用此函数：

    import socket, json

    def blender_exec(code: str, host="localhost", port=9876, timeout=15):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((host, port))
        s.settimeout(timeout)
        payload = json.dumps(&#123;"type": "execute_code", "params": &#123;"code": code&#125;&#125;)
        s.sendall(payload.encode("utf-8"))
        buf = b""
        while True:
            try:
                chunk = s.recv(4096)
                if not chunk:
                    break
                buf += chunk
                try:
                    json.loads(buf.decode("utf-8"))
                    break
                except json.JSONDecodeError:
                    continue
            except socket.timeout:
                break
        s.close()
        return json.loads(buf.decode("utf-8"))

## 常用bpy模式

### 清空场景
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

### 添加网格对象
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(0, 0, 0))
    bpy.ops.mesh.primitive_cube_add(size=2, location=(3, 0, 0))
    bpy.ops.mesh.primitive_cylinder_add(radius=0.5, depth=2, location=(-3, 0, 0))

### 创建并分配材质
    mat = bpy.data.materials.new(name="MyMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (R, G, B, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.3
    bsdf.inputs["Metallic"].default_value = 0.0
    obj.data.materials.append(mat)

### 关键帧动画
    obj.location = (0, 0, 0)
    obj.keyframe_insert(data_path="location", frame=1)
    obj.location = (0, 0, 3)
    obj.keyframe_insert(data_path="location", frame=60)

### 渲染到文件
    bpy.context.scene.render.filepath = "/tmp/render.png"
    bpy.context.scene.render.engine = 'CYCLES'
    bpy.ops.render.render(write_still=True)

## 注意事项

- 运行前必须检查套接字是否打开 (nc -z localhost 9876)
- 插件服务器在每次会话中必须在Blender内部启动 (N面板 > BlenderMCP > 连接)
- 将复杂场景分解为多个较小的execute_code调用以避免超时
- 渲染输出路径必须是绝对路径 (/tmp/...)，而非相对路径
- shade_smooth() 要求对象处于已选中且为对象模式