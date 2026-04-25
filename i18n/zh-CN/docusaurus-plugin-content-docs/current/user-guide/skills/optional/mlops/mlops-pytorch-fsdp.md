---
title: "Pytorch Fsdp"
sidebar_label: "Pytorch Fsdp"
description: "针对 PyTorch FSDP 全分片数据并行训练的权威指南 - 参数分片、混合精度、CPU 卸载、FSDP2"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成的。请编辑源文件 SKILL.md，而不是此页面。 */}

# Pytorch Fsdp

针对 PyTorch FSDP 全分片数据并行训练的权威指南 - 参数分片、混合精度、CPU 卸载、FSDP2

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/mlops/pytorch-fsdp` 安装 |
| 路径 | `optional-skills/mlops/pytorch-fsdp` |
| 版本 | `1.0.0` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖项 | `torch>=2.0`, `transformers` |
| 标签 | `分布式训练`, `PyTorch`, `FSDP`, `数据并行`, `分片`, `混合精度`, `CPU 卸载`, `FSDP2`, `大规模训练` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Pytorch-Fsdp 技能

来自官方文档的关于 pytorch-fsdp 开发的全面辅助。

## 何时使用此技能

当出现以下情况时，应触发此技能：
- 使用 pytorch-fsdp 时
- 询问 pytorch-fsdp 功能或 API 时
- 实现 pytorch-fsdp 解决方案时
- 调试 pytorch-fsdp 代码时
- 学习 pytorch-fsdp 最佳实践时

## 快速参考

### 常见模式

**模式 1：** 通用 Join 上下文管理器# 创建时间：2025年6月6日 | 最后更新：2025年6月6日 通用 join 上下文管理器支持在不均匀输入上进行分布式训练。本页面概述了相关类的 API：Join、Joinable 和 JoinHook。有关教程，请参阅使用 Join 上下文管理器进行不均匀输入的分布式训练。 class torch.distributed.algorithms.Join(joinables, enable=True, throw_on_early_termination=False, **kwargs)[source]# 此类定义了通用 join 上下文管理器，它允许在进程加入后调用自定义钩子。这些钩子应模拟未加入进程的集体通信，以防止挂起和错误，并确保算法正确性。有关钩子定义的详细信息，请参阅 JoinHook。 警告 上下文管理器要求每个参与的 Joinable 在自身每次迭代的集体通信之前调用 notify_join_context() 方法，以确保正确性。 警告 上下文管理器要求 JoinHook 对象中的所有 process_group 属性都相同。如果有多个 JoinHook 对象，则使用第一个对象的设备。过程组和设备信息用于检查未加入的进程，以及在 throw_on_early_termination 启用时通知进程抛出异常，这两者都使用 all-reduce 实现。 参数 joinables (List[Joinable]) – 参与的 Joinable 列表；它们的钩子按给定顺序迭代。 enable (bool) – 启用不均匀输入检测的标志；设置为 False 会禁用上下文管理器的功能，仅当用户知道输入不会不均匀时才应设置（默认值：True）。 throw_on_early_termination (bool) – 控制在检测到不均匀输入时是否抛出异常的标志（默认值：False）。 示例： >>> import os >>> import torch >>> import torch.distributed as dist >>> import torch.multiprocessing as mp >>> import torch.nn.parallel.DistributedDataParallel as DDP >>> import torch.distributed.optim.ZeroRedundancyOptimizer as ZeRO >>> from torch.distributed.algorithms.join import Join >>> >>> # 在每个生成的 worker 上 >>> def worker(rank): >>> dist.init_process_group("nccl", rank=rank, world_size=2) >>> model = DDP(torch.nn.Linear(1, 1).to(rank), device_ids=[rank]) >>> optim = ZeRO(model.parameters(), torch.optim.Adam, lr=0.01) >>> # Rank 1 比 rank 0 多一个输入 >>> inputs = [torch.tensor([1.]).to(rank) for _ in range(10 + rank)] >>> with Join([model, optim]): >>> for input in inputs: >>> loss = model(input).sum() >>> loss.backward() >>> optim.step() >>> # 所有 rank 都到达此处，无挂起/错误 static notify_join_context(joinable)[source]# 通知 join 上下文管理器调用进程尚未加入。然后，如果 throw_on_early_termination=True，检查是否检测到不均匀输入（即某个进程已加入），如果是，则抛出异常。此方法应在 Joinable 对象进行每次迭代的集体通信之前调用。例如，应在 DistributedDataParallel 的前向传播开始时调用。只有传递给上下文管理器的第一个 Joinable 对象会在此方法中执行集体通信，对于其他对象，此方法为空操作。 参数 joinable (Joinable) – 调用此方法的 Joinable 对象。 返回 如果 joinable 是传递给上下文管理器的第一个对象，则返回用于通知上下文管理器进程尚未加入的 all-reduce 的异步工作句柄；否则返回 None。 class torch.distributed.algorithms.Joinable[source]# 这定义了可加入类的抽象基类。可加入类（继承自 Joinable）应实现 join_hook()，该方法返回一个 JoinHook 实例，以及 join_device() 和 join_process_group()，分别返回设备和过程组信息。 abstract property join_device: device# 返回执行 join 上下文管理器所需的集体通信的设备。 abstract join_hook(**kwargs)[source]# 为给定的 Joinable 返回一个 JoinHook 实例。 参数 kwargs (dict) – 包含运行时修改 join 钩子行为的任何关键字参数的字典；共享同一 join 上下文管理器的所有 Joinable 实例都会收到相同的 kwargs 值。 返回类型 JoinHook abstract property join_process_group: Any# 返回 join 上下文管理器自身所需的集体通信的过程组。 class torch.distributed.algorithms.JoinHook[source]# 这定义了 join 钩子，它在 join 上下文管理器中提供两个入口点。入口点：主钩子，在存在未加入进程时重复调用；后钩子，在所有进程加入后调用一次。要为通用 join 上下文管理器实现 join 钩子，请定义一个继承自 JoinHook 的类，并根据需要重写 main_hook() 和 post_hook()。 main_hook()[source]# 在存在未加入进程时调用此钩子，以模拟训练迭代中的集体通信。训练迭代，即一次前向传播、反向传播和优化器步骤。 post_hook(is_last_joiner)[source]# 在所有进程加入后调用钩子。它传递一个额外的布尔参数 is_last_joiner，指示该 rank 是否是最后一个加入的。 参数 is_last_joiner (bool) – 如果该 rank 是最后一个加入的，则为 True；否则为 False。

```
Join
```

**模式 2：** 分布式通信包 - torch.distributed# 创建时间：2017年7月12日 | 最后更新：2025年9月4日 注意 有关分布式训练所有功能的简要介绍，请参阅 PyTorch 分布式概述。 后端# torch.distributed 支持四种内置后端，每种后端具有不同的功能。下表显示了每个后端在 CPU 或 GPU 上可用的函数。对于 NCCL，GPU 指 CUDA GPU，而对于 XCCL 指 XPU GPU。仅当用于构建 PyTorch 的实现支持时，MPI 才支持 CUDA。 后端 gloo mpi nccl xccl 设备 CPU GPU CPU GPU CPU GPU CPU GPU send ✓ ✘ ✓ ? ✘ ✓ ✘ ✓ recv ✓ ✘ ✓ ? ✘ ✓ ✘ ✓ broadcast ✓ ✓ ✓ ? ✘ ✓ ✘ ✓ all_reduce ✓ ✓ ✓ ? ✘ ✓ ✘ ✓ reduce ✓ ✓ ✓ ? ✘ ✓ ✘ ✓ all_gather ✓ ✓ ✓ ? ✘ ✓ ✘ ✓ gather ✓ ✓ ✓ ? ✘ ✓ ✘ ✓ scatter ✓ ✓ ✓ ? ✘ ✓ ✘ ✓ reduce_scatter ✓ ✓ ✘ ✘ ✘ ✓ ✘ ✓ all_to_all ✓ ✓ ✓ ? ✘ ✓ ✘ ✓ barrier ✓ ✘ ✓ ? ✘ ✓ ✘ ✓ 随 PyTorch 提供的后端# PyTorch 分布式包支持 Linux（稳定版）、MacOS（稳定版）和 Windows（原型）。默认情况下，对于 Linux，会构建并包含 Gloo 和 NCCL 后端（仅在构建时启用 CUDA 时包含 NCCL）。MPI 是一个可选后端，仅在从源代码构建 PyTorch 时才能包含。（例如，在安装了 MPI 的主机上构建 PyTorch。） 注意 从 PyTorch v1.8 开始，Windows 支持除 NCCL 外的所有集体通信后端。如果 init_process_group() 的 init_method 参数指向文件，则必须符合以下模式： 本地文件系统，init_method="file:///d:/tmp/some_file" 共享文件系统，init_method="file://////&#123;machine_name&#125;/&#123;share_folder_name&#125;/some_file" 与 Linux 平台相同，您可以通过设置环境变量 MASTER_ADDR 和 MASTER_PORT 来启用 TcpStore。 使用哪个后端？# 过去，我们经常被问到：“我应该使用哪个后端？” 经验法则 对使用 CUDA GPU 的分布式训练使用 NCCL 后端。对使用 XPU GPU 的分布式训练使用 XCCL 后端。对使用 CPU 的分布式训练使用 Gloo 后端。 具有 InfiniBand 互连的 GPU 主机 使用 NCCL，因为它是目前唯一支持 InfiniBand 和 GPUDirect 的后端。 具有以太网互连的 GPU 主机 使用 NCCL，因为它目前提供最佳的分布式 GPU 训练性能，尤其是对于多进程单节点或多节点分布式训练。如果遇到 NCCL 问题，请使用 Gloo 作为备用选项。（注意，Gloo 目前在 GPU 上的运行速度比 NCCL 慢。） 具有 InfiniBand 互连的 CPU 主机 如果您的 InfiniBand 启用了 IP over IB，请使用 Gloo，否则请使用 MPI。我们计划在即将发布的版本中为 Gloo 添加 InfiniBand 支持。 具有以太网互连的 CPU 主机 使用 Gloo，除非您有使用 MPI 的特定原因。 常见环境变量# 选择要使用的网络接口# 默认情况下，NCCL 和 Gloo 后端都会尝试找到要使用的正确网络接口。如果自动检测到的接口不正确，您可以使用以下环境变量（适用于各自的后端）覆盖它： NCCL_SOCKET_IFNAME，例如 export NCCL_SOCKET_IFNAME=eth0 GLOO_SOCKET_IFNAME，例如 export GLOO_SOCKET_IFNAME=eth0 如果您使用 Gloo 后端，可以通过逗号分隔指定多个接口，如下所示：export GLOO_SOCKET_IFNAME=eth0,eth1,eth2,eth3。后端将以轮询方式在这些接口上分发操作。所有进程必须在此变量中指定相同数量的接口。 其他 NCCL 环境变量# 调试 - 如果 NCCL 失败，可以设置 NCCL_DEBUG=INFO 以打印显式警告消息以及基本的 NCCL 初始化信息。您也可以使用 NCCL_DEBUG_SUBSYS 获取 NCCL 特定方面的更多详细信息。例如，NCCL_DEBUG_SUBSYS=COLL 会打印集体调用的日志，这在调试挂起时可能很有帮助，尤其是由集体类型或消息大小不匹配引起的挂起。如果拓扑检测失败，设置 NCCL_DEBUG_SUBSYS=GRAPH 以检查详细的检测结果并保存为参考（如果需要 NCCL 团队的进一步帮助）会很有帮助。 性能调优 - NCCL 根据其拓扑检测执行自动调优，以节省用户的调优工作。在某些基于套接字的系统上，用户仍可尝试调整 NCCL_SOCKET_NTHREADS 和 NCCL_NSOCKS_PERTHREAD 以提高套接字网络带宽。这两个环境变量已由 NCCL 为某些云提供商（如 AWS 或 GCP）进行了预调优。有关 NCCL 环境变量的完整列表，请参阅 NVIDIA NCCL 的官方文档。您甚至可以使用 torch.distributed.ProcessGroupNCCL.NCCLConfig 和 torch.distributed.ProcessGroupNCCL.Options 进一步调整 NCCL 通信器。使用 help（例如 help(torch.distributed.ProcessGroupNCCL.NCCLConfig)）在解释器中了解它们的更多信息。 基础# torch.distributed 包为在多个计算节点上运行的多个进程的并行性提供了 PyTorch 支持和通信原语。torch.nn.parallel.DistributedDataParallel() 类基于此功能，为任何 PyTorch 模型提供同步分布式训练作为包装器。这与 Multiprocessing 包 - torch.multiprocessing 和 torch.nn.DataParallel() 提供的并行性不同，后者支持多个网络连接的机器，并且用户必须为每个进程显式启动主训练脚本的单独副本。在单机同步情况下，torch.distributed 或 torch.nn.parallel.DistributedDataParallel() 包装器仍可能比数据并行性的其他方法（包括 torch.nn.DataParallel()）具有优势： 每个进程维护自己的优化器，并在每次迭代中执行完整的优化步骤。虽然这看起来是多余的，因为梯度已经收集并平均到所有进程中，因此每个进程的梯度相同，但这意味着不需要参数广播步骤，从而减少了节点间传输张量的时间。每个进程包含一个独立的 Python 解释器，消除了从单个 Python 进程驱动多个执行线程、模型副本或 GPU 带来的额外解释器开销和“GIL 争用”。这对于大量使用 Python 运行时的模型尤其重要，包括具有循环层或许多小组件的模型。 初始化# 在调用任何其他方法之前，需要使用 torch.distributed.init_process_group() 或 torch.distributed.device_mesh.init_device_mesh() 函数初始化包。两者都会阻塞，直到所有进程都加入。 警告 初始化不是线程安全的。过程组创建应从单个线程执行，以防止跨 rank 的不一致“UUID”分配，并防止在初始化期间导致挂起的竞争条件。 torch.distributed.is_available()[source]# 如果分布式包可用，则返回 True。否则，torch.distributed 不会暴露任何其他 API。目前，torch.distributed 在 Linux、MacOS 和 Windows 上可用。在从源代码构建 PyTorch 时，设置 USE_DISTRIBUTED=1 以启用它。目前，Linux 和 Windows 的默认值为 USE_DISTRIBUTED=1，MacOS 的默认值为 USE_DISTRIBUTED=0。 返回类型 bool torch.distributed.init_process_group(backend=None, init_method=None, timeout=None, world_size=-1, rank=-1, store=None, group_name='', pg_options=None, device_id=None)[source]# 初始化默认分布式过程组。这也将初始化分布式包。有两种主要方法可以初始化过程组： 显式指定 store、rank 和 world_size。指定 init_method（URL 字符串），指示如何发现对等进程。可选择指定 rank 和 world_size，或在 URL 中编码所有必需参数并省略它们。如果两者都未指定，则假设 init_method 为“env://”。 参数 backend (str 或 Backend，可选) – 要使用的后端。根据构建时配置，有效值包括 mpi、gloo、nccl、ucc、xccl 或由第三方插件注册的后端。从 2.6 开始，如果未提供 backend，c10d 将使用为 device_id 关键字参数（如果提供）指示的设备类型注册的后端。目前已知

## 参考文件

此技能包含 `references/` 中的综合文档：

- **other.md** - 其他文档

当需要详细信息时，使用 `view` 读取特定参考文件。

## 使用此技能

### 初学者
从 getting_started 或 tutorials 参考文件开始，了解基本概念。

### 特定功能
使用适当的类别参考文件（api、guides 等）获取详细信息。

### 代码示例
上面的快速参考部分包含从官方文档中提取的常见模式。

## 资源

### references/
从官方来源提取的有组织文档。这些文件包含：
- 详细解释
- 带有语言注释的代码示例
- 原始文档链接
- 目录，便于快速导航

### scripts/
在此处添加用于常见自动化任务的辅助脚本。

### assets/
在此处添加模板、样板或示例项目。

## 注意事项

- 此技能是根据官方文档自动生成的
- 参考文件保留了源文档的结构和示例
- 代码示例包含语言检测，以实现更好的语法高亮
- 快速参考模式是从文档中的常见用法示例中提取的

## 更新

要使用更新的文档刷新此技能：
1. 使用相同的配置重新运行抓取器
2. 技能将使用最新信息重建