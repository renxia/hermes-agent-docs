---
title: "Pytorch Fsdp"
sidebar_label: "Pytorch Fsdp"
description: "使用 PyTorch FSDP 进行全分片数据并行训练的专家指南 - 参数分片、混合精度、CPU 卸载、FSDP2"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源 SKILL.md，而非此页面。 */}

# Pytorch Fsdp

使用 PyTorch FSDP 进行全分片数据并行训练的专家指南 - 参数分片、混合精度、CPU 卸载、FSDP2

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/mlops/pytorch-fsdp` 安装 |
| 路径 | `optional-skills/mlops/pytorch-fsdp` |
| 版本 | `1.0.0` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖项 | `torch>=2.0`, `transformers` |
| 平台 | linux, macos |
| 标签 | `分布式训练`, `PyTorch`, `FSDP`, `数据并行`, `分片`, `混合精度`, `CPU 卸载`, `FSDP2`, `大规模训练` |

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这就是智能体在技能激活时看到的指令。
:::

# Pytorch-Fsdp 技能

基于官方文档生成的，关于 pytorch-fsdp 开发的全面协助。

## 何时使用此技能

当出现以下情况时应触发此技能：
- 使用 pytorch-fsdp 进行开发
- 询问 pytorch-fsdp 的功能或 API
- 实现 pytorch-fsdp 解决方案
- 调试 pytorch-fsdp 代码
- 学习 pytorch-fsdp 最佳实践

## 快速参考

### 常见模式

**模式 1：** 泛型加入上下文管理器# 创建于：Jun 06, 2025 | 最后更新于：Jun 06, 2025 泛型加入上下文管理器有助于在不均匀输入上进行分布式训练。本页概述了相关类的 API：Join、Joinable 和 JoinHook。有关教程，请参阅使用加入上下文管理器进行不均匀输入分布式训练。class torch.distributed.algorithms.Join(joinables, enable=True, throw_on_early_termination=False, **kwargs)[source]# 此类定义了泛型加入上下文管理器，允许在进程加入后调用自定义钩子。这些钩子应遮蔽未加入进程的集体通信，以防止挂起和错误，并确保算法正确性。有关钩子定义的详细信息，请参阅 JoinHook。警告 上下文管理器要求每个参与的 Joinable 在其自身每次迭代的集体通信之前调用 notify_join_context() 方法，以确保正确性。警告 上下文管理器要求所有 JoinHook 对象中的 process_group 属性相同。如果有多个 JoinHook 对象，则使用第一个对象的设备。进程组和设备信息用于检查未加入的进程，并在启用 throw_on_early_termination 时通知进程抛出异常，两者均使用 all-reduce 操作。参数 joinables (List[Joinable]) – 参与的 Joinable 列表；它们的钩子按给定顺序迭代。enable (bool) – 启用不均匀输入检测的标志；设置为 False 将禁用上下文管理器的功能，仅当用户知道输入不会不均匀时才应设置（默认：True）。throw_on_early_termination (bool) – 控制是否在检测到不均匀输入时抛出异常的标志（默认：False）。示例： >>> import os >>> import torch >>> import torch.distributed as dist >>> import torch.multiprocessing as mp >>> import torch.nn.parallel.DistributedDataParallel as DDP >>> import torch.distributed.optim.ZeroRedundancyOptimizer as ZeRO >>> from torch.distributed.algorithms.join import Join >>> >>> # 在每个生成的 worker 上 >>> def worker(rank): >>> dist.init_process_group("nccl", rank=rank, world_size=2) >>> model = DDP(torch.nn.Linear(1, 1).to(rank), device_ids=[rank]) >>> optim = ZeRO(model.parameters(), torch.optim.Adam, lr=0.01) >>> # Rank 1 比 rank 0 多一个输入 >>> inputs = [torch.tensor([1.]).to(rank) for _ in range(10 + rank)] >>> with Join([model, optim]): >>> for input in inputs: >>> loss = model(input).sum() >>> loss.backward() >>> optim.step() >>> # 所有 rank 都能到达这里，不会挂起/报错 static notify_join_context(joinable)[source]# 通知加入上下文管理器调用进程尚未加入。然后，如果 throw_on_early_termination=True，检查是否检测到不均匀输入（即一个进程已经加入），如果检测到则抛出异常。此方法应由 Joinable 对象在其每次迭代的集体通信之前调用。例如，在 DistributedDataParallel 中应在前向传播开始时调用此方法。只有传递给上下文管理器的第一个 Joinable 对象执行此方法中的集体通信，对于其他对象，此方法是空操作。参数 joinable (Joinable) – 调用此方法的 Joinable 对象。返回 如果 joinable 是传递给上下文管理器的第一个对象，则返回用于通知上下文管理器进程尚未加入的 all-reduce 的异步工作句柄；否则返回 None。class torch.distributed.algorithms.Joinable[source]# 这定义了可加入类的抽象基类。一个可加入类（继承自 Joinable）应实现 join_hook()，该方法返回一个 JoinHook 实例，此外还要实现返回设备信息和进程组信息的 join_device() 和 join_process_group()。abstract property join_device: device# 返回用于执行加入上下文管理器所需的集体通信的设备。abstract join_hook(**kwargs)[source]# 返回给定 Joinable 的 JoinHook 实例。参数 kwargs (dict) – 一个字典，包含在运行时修改加入钩子行为的关键字参数；共享相同加入上下文管理器的所有 Joinable 实例将被转发相同的 kwargs 值。返回类型 JoinHook abstract property join_process_group: Any# 返回加入上下文管理器本身所需的集体通信进程组。class torch.distributed.algorithms.JoinHook[source]# 这定义了一个加入钩子，它在加入上下文管理器中提供两个入口点。入口点：一个主钩子，在存在未加入进程时重复调用，以及一个后置钩子，在所有进程加入后调用一次。要为泛型加入上下文管理器实现加入钩子，请定义一个继承自 JoinHook 的类并根据需要重写 main_hook() 和 post_hook()。main_hook()[source]# 当存在未加入进程时调用此钩子，以遮蔽训练迭代中的集体通信。训练迭代即一次前向传播、反向传播和优化器步骤。post_hook(is_last_joiner)[source]# 在所有进程加入后调用钩子。传递一个额外的布尔参数 is_last_joiner，指示该 rank 是否是最后加入的进程之一。参数 is_last_joiner (bool) – 如果该 rank 是最后加入的进程之一则为 True；否则为 False。

```
Join
```

**模式 2：** 分布式通信包 - torch.distributed# 创建于：Jul 12, 2017 | 最后更新于：Sep 04, 2025 注意 请参阅 PyTorch 分布式概览，了解与分布式训练相关的所有功能的简要介绍。后端# torch.distributed 支持四个内置后端，每个后端具有不同的能力。下表显示了每个后端可用于 CPU 或 GPU 的函数。对于 NCCL，GPU 指 CUDA GPU，对于 XCCL 指 XPU GPU。MPI 仅在构建 PyTorch 时使用的实现支持 CUDA 时才支持 CUDA。后端 gloo mpi nccl xccl 设备 CPU GPU CPU GPU CPU GPU CPU GPU send ✓ ✘ ✓ ? ✘ ✓ ✘ ✓ recv ✓ ✘ ✓ ? ✘ ✓ ✘ ✓ broadcast ✓ ✓ ✓ ? ✘ ✓ ✘ ✓ all_reduce ✓ ✓ ✓ ? ✘ ✓ ✘ ✓ reduce ✓ ✓ ✓ ? ✘ ✓ ✘ ✓ all_gather ✓ ✓ ✓ ? ✘ ✓ ✘ ✓ gather ✓ ✓ ✓ ? ✘ ✓ ✘ ✓ scatter ✓ ✓ ✓ ? ✘ ✓ ✘ ✓ reduce_scatter ✓ ✓ ✘ ✘ ✘ ✓ ✘ ✓ all_to_all ✓ ✓ ✓ ? ✘ ✓ ✘ ✓ barrier ✓ ✘ ✓ ? ✘ ✓ ✘ ✓ 随 PyTorch 附带的后端# PyTorch 分布式包支持 Linux（稳定）、MacOS（稳定）和 Windows（原型）。对于 Linux，默认构建并包含 Gloo 和 NCCL 后端（NCCL 仅在使用 CUDA 构建时）。MPI 是一个可选后端，只有在从源代码构建 PyTorch 时才能包含。（例如，在安装了 MPI 的主机上构建 PyTorch。）注意 从 PyTorch v1.8 开始，Windows 支持除 NCCL 外的所有集体通信后端，如果 init_process_group() 的 init_method 参数指向一个文件，它必须遵循以下模式：本地文件系统，init_method="file:///d:/tmp/some_file" 共享文件系统，init_method="file://////&#123;machine_name&#125;/&#123;share_folder_name&#125;/some_file" 与 Linux 平台相同，你可以通过设置环境变量 MASTER_ADDR 和 MASTER_PORT 来启用 TcpStore。使用哪个后端？# 过去，我们经常被问到：“我应该使用哪个后端？”。经验法则 对于使用 CUDA GPU 的分布式训练，使用 NCCL 后端。对于使用 XPU GPU 的分布式训练，使用 XCCL 后端。对于使用 CPU 的分布式训练，使用 Gloo 后端。使用 InfiniBand 互连的 GPU 主机 使用 NCCL，因为它是目前唯一支持 InfiniBand 和 GPUDirect 的后端。使用以太网互连的 GPU 主机 使用 NCCL，因为它目前提供最佳的分布式 GPU 训练性能，特别是对于多进程单节点或多节点分布式训练。如果遇到任何 NCCL 问题，请使用 Gloo 作为后备选项。（请注意，对于 GPU，Gloo 目前比 NCCL 运行得慢。）使用 InfiniBand 互连的 CPU 主机 如果你的 InfiniBand 已启用 IP over IB，请使用 Gloo，否则使用 MPI。我们计划在即将发布的版本中为 Gloo 添加 InfiniBand 支持。使用以太网互连的 CPU 主机 使用 Gloo，除非你有特定理由使用 MPI。常见环境变量# 选择要使用的网络接口# 默认情况下，NCCL 和 Gloo 后端都会尝试找到正确的网络接口来使用。如果自动检测的接口不正确，你可以使用以下环境变量覆盖它（适用于相应的后端）：NCCL_SOCKET_IFNAME，例如 export NCCL_SOCKET_IFNAME=eth0 GLOO_SOCKET_IFNAME，例如 export GLOO_SOCKET_IFNAME=eth0 如果你使用的是 Gloo 后端，你可以通过逗号分隔指定多个接口，如下所示：export GLOO_SOCKET_IFNAME=eth0,eth1,eth2,eth3。后端将以轮询方式在这些接口上调度操作。所有进程必须在此变量中指定相同数量的接口，这一点至关重要。其他 NCCL 环境变量# 调试 - 如果发生 NCCL 失败，你可以设置 NCCL_DEBUG=INFO 来打印明确的警告消息以及基本的 NCCL 初始化信息。你也可以使用 NCCL_DEBUG_SUBSYS 来获取有关 NCCL 特定方面的更多详细信息。例如，NCCL_DEBUG_SUBSYS=COLL 将打印集体调用的日志，这在调试挂起（尤其是由集体类型或消息大小不匹配引起的挂起）时可能会有所帮助。如果拓扑检测失败，设置 NCCL_DEBUG_SUBSYS=GRAPH 来检查详细的检测结果并在需要进一步寻求 NCCL 团队帮助时保存参考会很有帮助。性能调优 - NCCL 根据其拓扑检测执行自动调优，以节省用户的调优工作。在某些基于套接字的系统上，用户仍可尝试调整 NCCL_SOCKET_NTHREADS 和 NCCL_NSOCKS_PERTHREAD 以增加套接字网络带宽。这两个环境变量已被一些云提供商（如 AWS 或 GCP）预先调优。有关 NCCL 环境变量的完整列表，请参阅 NVIDIA NCCL 官方文档。你可以使用 torch.distributed.ProcessGroupNCCL.NCCLConfig 和 torch.distributed.ProcessGroupNCCL.Options 进一步调整 NCCL 通信器。在解释器中使用 help（例如 help(torch.distributed.ProcessGroupNCCL.NCCLConfig)）了解更多信息。基础知识# torch.distributed 包提供了 PyTorch 支持和通信原语，用于在一台或多台机器上运行的多个计算节点之间进行多进程并行。类 torch.nn.parallel.DistributedDataParallel() 建立在此功能之上，作为任何 PyTorch 模型的包装器，提供同步分布式训练。这与 Multiprocessing 包 - torch.multiprocessing 和 torch.nn.DataParallel() 提供的并行类型不同，因为它支持多台网络连接的机器，并且用户必须为每个进程显式启动主训练脚本的独立副本。在单机同步情况下，torch.distributed 或 torch.nn.parallel.DistributedDataParallel() 包装器可能仍比其他数据并行方法具有优势，包括 torch.nn.DataParallel()：每个进程维护自己的优化器，并在每次迭代中执行完整的优化步骤。虽然这看起来可能是冗余的，因为梯度已经在进程间收集和平均，因此对每个进程都相同，但这意味着不需要参数广播步骤，减少了在节点之间传输张量所花费的时间。每个进程包含一个独立的 Python 解释器，消除了从单个 Python 进程驱动多个执行线程、模型副本或 GPU 所带来的额外解释器开销和“GIL 竞争”。这对于大量使用 Python 运行时的模型尤其重要，包括具有循环层或许多小组件的模型。初始化# 在调用任何其他方法之前，需要使用 torch.distributed.init_process_group() 或 torch.distributed.device_mesh.init_device_mesh() 函数初始化包。两者都会阻塞直到所有进程加入。警告 初始化不是线程安全的。进程组创建应从单个线程执行，以防止跨 rank 的不一致 'UUID' 分配，并防止初始化期间可能导致挂起的竞争条件。torch.distributed.is_available()[source]# 如果分布式包可用则返回 True。否则，torch.distributed 不会暴露任何其他 API。目前，torch.distributed 在 Linux、MacOS 和 Windows 上可用。从源代码构建 PyTorch 时设置 USE_DISTRIBUTED=1 以启用它。目前，Linux 和 Windows 的默认值为 USE_DISTRIBUTED=1，MacOS 为 USE_DISTRIBUTED=0。返回类型 bool torch.distributed.init_process_group(backend=None, init_method=None, timeout=None, world_size=-1, rank=-1, store=None, group_name='', pg_options=None, device_id=None)[source]# 初始化默认的分布式进程组。这也将初始化分布式包。初始化进程组有 2 种主要方法：显式指定 store、rank 和 world_size。指定 init_method（URL 字符串），指示如何/在哪里发现对等方。可以选择指定 rank 和 world_size，或在 URL 中编码所有必需参数并省略它们。如果两者都未指定，则假定 init_method 为 "env://"。参数 backend (str 或 Backend, optional) – 要使用的后端。根据构建时配置，有效值包括 mpi、gloo、nccl、ucc、xccl 或由第三方插件注册的后端。从 2.6 开始，如果未提供 backend，c10d 将使用为 device_id kwarg 指示的设备类型（如果提供）注册的后端。目前已知的默认注册是：cuda 使用 nccl，cpu 使用 gloo，xpu 使用 xccl。如果既未提供 backend 也未提供 device_id，c10d 将检测运行时机器上的加速器，并使用为该检测到的加速器（或 cpu）注册的后端。此字段可以小写字符串形式给出（例如，"gloo"），也可以通过 Backend 属性访问（例如，Backend.GLOO）。如果使用 nccl 后端时每台机器有多个进程，每个进程必须独占访问其使用的每个 GPU，因为进程间共享 GPU 可能导致死锁或 NCCL 无效用法。ucc 后端是实验性的。设备的默认后端可以通过 get_default_backend_for_device() 查询。init_method (str, optional) – 指定如何初始化进程组的 URL。如果未指定 init_method 或 store，则默认为 "env://"。与 store 互斥。world_size (int, optional) – 参与作业的进程数。如果指定了 store 则必填。rank (int, optional) – 当前进程的 rank（应为 0 到 world_size-1 之间的数字）。如果指定了 store 则必填。store (Store, optional) – 所有 worker 可访问的键/值存储，用于交换连接/地址信息。与 init_method 互斥。timeout (timedelta, optional) – 针对进程组执行的操作的超时时间。NCCL 的默认值为 10 分钟，其他后端为 30 分钟。这是在集体通信被异步中止且进程将崩溃之前的持续时间。这样做是因为 CUDA 执行是异步的，并且继续执行用户代码不再安全，因为失败的异步 NCCL 操作可能导致后续 CUDA 操作在损坏的数据上运行。设置 TORCH_NCCL_BLOCKING_WAIT 时，进程将阻塞并等待此超时。group_name (str, optional, deprecated) – 组名。此参数被忽略。pg_options (ProcessGroupOptions, optional) – 进程组选项，指定在构建特定进程组期间需要传递的额外选项。截至目前，我们支持的唯一选项是 ProcessGroupNCCL.Options（用于 nccl 后端），可以指定 is_high_priority_stream 以便 nccl 后端在有计算内核等待时可以使用高优先级 cuda 流。有关配置 nccl 的其他可用选项，请参阅 https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/api/types.html#ncclconfig-t。device_id (torch.device | int, optional) – 此进程将使用的单个特定设备，允许进行特定于后端的优化。目前这有两个效果，仅在 NCCL 下：立即形成通信器（立即调用 ncclCommInit* 而不是正常的惰性调用），并且子组将在可能时使用 ncclCommSplit 以避免组创建的不必要开销。如果你想提前知道 NCCL 初始化错误，也可以使用此字段。如果提供 int，API 假定将使用编译时的加速器类型。注意 要启用 backend == Backend.MPI，PyTorch 需要在支持 MPI 的系统上从源代码构建。注意 对多后端的支持是实验性的。目前，如果未指定 backend，则会创建 gloo 和 nccl 两个后端。gloo 后端将用于 CPU 张量的集体通信，nccl 后端将用于 CUDA 张量的集体通信。可以通过传递格式为 “&lt;device_type>:&lt;backend_name>,&lt;device_type>:&lt;backend_name>” 的字符串来指定自定义后端，例如 “cpu:gloo,cuda:custom_backend”。torch.distributed.device_mesh.init_device_mesh(device_type, mesh_shape, *, mesh_dim_names=None, backend_override=None)[source]# 根据 device_type、mesh_shape 和 mesh_dim_names 参数初始化 DeviceMesh。这将创建一个具有 n 维数组布局的 DeviceMesh，其中 n 是 mesh_shape 的长度。如果提供了 mesh_dim_names，则每个维度被标记为 mesh_dim_names[i]。注意 init_device_mesh 遵循 SPMD 编程模型，意味着相同的 PyTorch Python 程序在集群中的所有进程/rank 上运行。确保 mesh_shape（描述设备布局的 n 维数组的维度）在所有 rank 上相同。不一致的 mesh_shape 可能导致挂起。注意 如果未找到进程组，init_device_mesh 将在后台初始化分布式通信所需的进程组。参数 device_type (str) – 网格的设备类型。目前支持："cpu"、"cuda/cuda-like"、"xpu"。不允许传入带有 GPU 索引的设备类型，例如 "cuda:0"。mesh_shape (Tuple[int]) – 一个元组，定义了描述设备布局的多维数组的维度。mesh_dim_names (Tuple[str], optional) – 一个元组，包含要分配给描述设备布局的多维数组每个维度的网格维度名称。其长度必须与 mesh_shape 的长度匹配。mesh_dim_names 中的每个字符串必须唯一。backend_override (Dict[int | str, tuple[str, Options] | str | Options], optional) – 覆盖将为每个网格维度创建的部分或全部 ProcessGroups。每个键可以是维度的索引或其名称（如果提供了 mesh_dim_names）。每个值可以是包含后端名称及其选项的元组，或者只是这两个组件之一（另一种情况下，另一个将设置为其默认值）。返回 表示设备布局的 DeviceMesh 对象。返回类型 DeviceMesh 示例： >>> from torch.distributed.device_mesh import init_device_mesh >>> >>> mesh_1d = init_device_mesh("cuda", mesh_shape=(8,)) >>> mesh_2d = init_device_mesh("cuda", mesh_shape=(2, 8), mesh_dim_names=("dp", "tp")) torch.distributed.is_initialized()[source]# 检查默认进程组是否已初始化。返回类型 bool torch.distributed.is_mpi_available()[source]# 检查 MPI 后端是否可用。返回类型 bool torch.distributed.is_nccl_available()[source]# 检查 NCCL 后端是否可用。返回类型 bool torch.distributed.is_gloo_available()[source]# 检查 Gloo 后端是否可用。返回类型 bool torch.distributed.distributed_c10d.is_xccl_available()[source]# 检查 XCCL 后端是否可用。返回类型 bool torch.distributed.is_torchelastic_launched()[source]# 检查此进程是否是用 torch.distributed.elastic（即 torchelastic）启动的。使用 TORCHELASTIC_RUN_ID 环境变量的存在作为代理来确定当前进程是否是用 torchelastic 启动的。这是一个合理的代理，因为 TORCHELASTIC_RUN_ID 映射到始终为非空值的会合 ID，指示用于对等发现的作业 ID。返回类型 bool torch.distributed.get_default_backend_for_device(device)[source]# 返回给定设备的默认后端。参数 device (Union[str, torch.device]) – 要获取默认后端的设备。返回 给定设备的默认后端，小写字符串。返回类型 str 目前支持三种初始化方法：TCP 初始化# 使用 TCP 初始化有两种方法，都需要一个所有进程可达的网络地址和一个期望的 world_size。第一种方法需要指定一个属于 rank 0 进程的地址。这种初始化方法要求所有进程手动指定 rank。请注意，最新的分布式包不再支持多播地址。group_name 也被弃用。import torch.distributed as dist # 使用其中一台机器的地址 dist.init_process_group(backend, init_method='tcp://10.1.1.20:23456', rank=args.rank, world_size=4) 共享文件系统初始化# 另一种初始化方法利用了一个共享的文件系统，该系统在组中所有机器上可见，以及一个期望的 world_size。URL 应以 file:// 开头，并包含共享文件系统上一个现有目录中不存在的文件的路径。如果文件不存在，文件系统初始化将自动创建该文件，但不会删除该文件。因此，你有责任确保在对相同文件路径/名称的下一次 init_process_group() 调用之前清理该文件。请注意，最新的分布式包不再支持自动 rank 分配，group_name 也被弃用。警告 此方法假定文件系统支持使用 fcntl 进行锁定 - 大多数本地系统和 NFS 支持它。警告 此方法将始终创建文件，并尽力在程序结束时清理和删除文件。换句话说，每次使用文件 init 方法初始化都需要一个全新的空文件才能成功初始化。如果再次使用之前初始化使用的（碰巧未被清理的）相同文件，这是意外行为，通常会导致死锁和失败。因此，即使此方法会尽力清理文件，如果自动删除失败，你有责任确保在训练结束时删除文件，以防止下次重用同一个文件。如果你计划对同一个文件名多次调用 init_process_group()，这一点尤其重要。换句话说，如果文件未被删除/清理，而你再次对该文件调用 init_process_group()，则预期会出现失败。这里的经验法则是，确保每次调用 init_process_group() 时文件都不存在或为空。import torch.distributed as dist # rank 应始终指定 dist.init_process_group(backend, init_method='file:///mnt/nfs/sharedfile', world_size=4, rank=args.rank) 环境变量初始化# 此方法将从环境变量读取配置，允许完全自定义信息的获取方式。需要设置的变量有：MASTER_PORT - 必填；必须是 rank 0 机器上的一个空闲端口 MASTER_ADDR - 必填（rank 0 除外）；rank 0 节点的地址 WORLD_SIZE - 必填；可以在此处设置，或在 init 函数调用中设置 RANK - 必填；可以在此处设置，或在 init 函数调用中设置 rank 为 0 的机器将用于建立所有连接。这是默认方法，意味着不必指定 init_method（或可以是 env://）。改进初始化时间# TORCH_GLOO_LAZY_INIT - 按需建立连接，而不是使用完整网格，这可以极大地改善非 all2all 操作的初始化时间。

```
torch.distributed.init_process_group()
```

**模式 3：** 初始化# 在调用任何其他方法之前，需要使用 torch.distributed.init_process_group() 或 torch.distributed.device_mesh.init_device_mesh() 函数初始化包。两者都会阻塞直到所有进程加入。警告 初始化不是线程安全的。进程组创建应从单个线程执行，以防止跨 rank 的不一致 'UUID' 分配，并防止初始化期间可能导致挂起的竞争条件。torch.distributed.is_available()[source]# 如果分布式包可用则返回 True。否则，torch.distributed 不会暴露任何其他 API。目前，torch.distributed 在 Linux、MacOS 和 Windows 上可用。从源代码构建 PyTorch 时设置 USE_DISTRIBUTED=1 以启用它。目前，Linux 和 Windows 的默认值为 USE_DISTRIBUTED=1，MacOS 为 USE_DISTRIBUTED=0。返回类型 bool torch.distributed.init_process_group(backend=None, init_method=None, timeout=None, world_size=-1, rank=-1, store=None, group_name='', pg_options=None, device_id=None)[source]# 初始化默认的分布式进程组。这也将初始化分布式包。初始化进程组有 2 种主要方法：显式指定 store、rank 和 world_size。指定 init_method（URL 字符串），指示如何/在哪里发现对等方。可以选择指定 rank 和 world_size，或在 URL 中编码所有必需参数并省略它们。如果两者都未指定，则假定 init_method 为 "env://"。参数 backend (str 或 Backend, optional) – 要使用的后端。根据构建时配置，有效值包括 mpi、gloo、nccl、ucc、xccl 或由第三方插件注册的后端。从 2.6 开始，如果未提供 backend，c10d 将使用为 device_id kwarg 指示的设备类型（如果提供）注册的后端。目前已知的默认注册是：cuda 使用 nccl，cpu 使用 gloo，xpu 使用 xccl。如果既未提供 backend 也未提供 device_id，c10d 将检测运行时机器上的加速器，并使用为该检测到的加速器（或 cpu）注册的后端。此字段可以小写字符串形式给出（例如，"gloo"），也可以通过 Backend 属性访问（例如，Backend.GLOO）。如果使用 nccl 后端时每台机器有多个进程，每个进程必须独占访问其使用的每个 GPU，因为进程间共享 GPU 可能导致死锁或 NCCL 无效用法。ucc 后端是实验性的。设备的默认后端可以通过 get_default_backend_for_device() 查询。init_method (str, optional) – 指定如何初始化进程组的 URL。如果未指定 init_method 或 store，则默认为 "env://"。与 store 互斥。world_size (int, optional) – 参与作业的进程数。如果指定了 store 则必填。rank (int, optional) – 当前进程的 rank（应为 0 到 world_size-1 之间的数字）。如果指定了 store 则必填。store (Store, optional) – 所有 worker 可访问的键/值存储，用于交换连接/地址信息。与 init_method 互斥。timeout (timedelta, optional) – 针对进程组执行的操作的超时时间。NCCL 的默认值为 10 分钟，其他后端为 30 分钟。这是在集体通信被异步中止且进程将崩溃之前的持续时间。这样做是因为 CUDA 执行是异步的，并且继续执行用户代码不再安全，因为失败的异步 NCCL 操作可能导致后续 CUDA 操作在损坏的数据上运行。设置 TORCH_NCCL_BLOCKING_WAIT 时，进程将阻塞并等待此超时。group_name (str, optional, deprecated) – 组名。此参数被忽略。pg_options (ProcessGroupOptions, optional) – 进程组选项，指定在构建特定进程组期间需要传递的额外选项。截至目前，我们支持的唯一选项是 ProcessGroupNCCL.Options（用于 nccl 后端），可以指定 is_high_priority_stream 以便 nccl 后端在有计算内核等待时可以使用高优先级 cuda 流。有关配置 nccl 的其他可用选项，请参阅 https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/api/types.html#ncclconfig-t。device_id (torch.device | int, optional) – 此进程将使用的单个特定设备，允许进行特定于后端的优化。目前这有两个效果，仅在 NCCL 下：立即形成通信器（立即调用 ncclCommInit* 而不是正常的惰性调用），并且子组将在可能时使用 ncclCommSplit 以避免组创建的不必要开销。如果你想提前知道 NCCL 初始化错误，也可以使用此字段。如果提供 int，API 假定将使用编译时的加速器类型。注意 要启用 backend == Backend.MPI，PyTorch 需要在支持 MPI 的系统上从源代码构建。注意 对多后端的支持是实验性的。目前，如果未指定 backend，则会创建 gloo 和 nccl 两个后端。gloo 后端将用于 CPU 张量的集体通信，nccl 后端将用于 CUDA 张量的集体通信。可以通过传递格式为 “&lt;device_type>:&lt;backend_name>,&lt;device_type>:&lt;backend_name>” 的字符串来指定自定义后端，例如 “cpu:gloo,cuda:custom_backend”。torch.distributed.device_mesh.init_device_mesh(device_type, mesh_shape, *, mesh_dim_names=None, backend_override=None)[source]# 根据 device_type、mesh_shape 和 mesh_dim_names 参数初始化 DeviceMesh。这将创建一个具有 n 维数组布局的 DeviceMesh，其中 n 是 mesh_shape 的长度。如果提供了 mesh_dim_names，则每个维度被标记为 mesh_dim_names[i]。注意 init_device_mesh 遵循 SPMD 编程模型，意味着相同的 PyTorch Python 程序在集群中的所有进程/rank 上运行。确保 mesh_shape（描述设备布局的 n 维数组的维度）在所有 rank 上相同。不一致的 mesh_shape 可能导致挂起。注意 如果未找到进程组，init_device_mesh 将在后台初始化分布式通信所需的进程组。参数 device_type (str) – 网格的设备类型。目前支持："cpu"、"cuda/cuda-like"、"xpu"。不允许传入带有 GPU 索引的设备类型，例如 "cuda:0"。mesh_shape (Tuple[int]) – 一个元组，定义了描述设备布局的多维数组的维度。mesh_dim_names (Tuple[str], optional) – 一个元组，包含要分配给描述设备布局的多维数组每个维度的网格维度名称。其长度必须与 mesh_shape 的长度匹配。mesh_dim_names 中的每个字符串必须唯一。backend_override (Dict[int | str, tuple[str, Options] | str | Options], optional) – 覆盖将为每个网格维度创建的部分或全部 ProcessGroups。每个键可以是维度的索引或其名称（如果提供了 mesh_dim_names）。每个值可以是包含后端名称及其选项的元组，或者只是这两个组件之一（另一种情况下，另一个将设置为其默认值）。返回 表示设备布局的 DeviceMesh 对象。返回类型 DeviceMesh 示例： >>> from torch.distributed.device_mesh import init_device_mesh >>> >>> mesh_1d = init_device_mesh("cuda", mesh_shape=(8,)) >>> mesh_2d = init_device_mesh("cuda", mesh_shape=(2, 8), mesh_dim_names=("dp", "tp")) torch.distributed.is_initialized()[source]# 检查默认进程组是否已初始化。返回类型 bool torch.distributed.is_mpi_available()[source]# 检查 MPI 后端是否可用。返回类型 bool torch.distributed.is_nccl_available()[source]# 检查 NCCL 后端是否可用。返回类型 bool torch.distributed.is_gloo_available()[source]# 检查 Gloo 后端是否可用。返回类型 bool torch.distributed.distributed_c10d.is_xccl_available()[source]# 检查 XCCL 后端是否可用。返回类型 bool torch.distributed.is_torchelastic_launched()[source]# 检查此进程是否是用 torch.distributed.elastic（即 torchelastic）启动的。使用 TORCHELASTIC_RUN_ID 环境变量的存在作为代理来确定当前进程是否是用 torchelastic 启动的。这是一个合理的代理，因为 TORCHELASTIC_RUN_ID 映射到始终为非空值的会合 ID，指示用于对等发现的作业 ID。返回类型 bool torch.distributed.get_default_backend_for_device(device)[source]# 返回给定设备的默认后端。参数 device (Union[str, torch.device]) – 要获取默认后端的设备。返回 给定设备的默认后端，小写字符串。返回类型 str 目前支持三种初始化方法：TCP 初始化# 使用 TCP 初始化有两种方法，都需要一个所有进程可达的网络地址和一个期望的 world_size。第一种方法需要指定一个属于 rank 0 进程的地址。这种初始化方法要求所有进程手动指定 rank。请注意，最新的分布式包不再支持多播地址。group_name 也被弃用。import torch.distributed as dist # 使用其中一台机器的地址 dist.init_process_group(backend, init_method='tcp://10.1.1.20:23456', rank=args.rank, world_size=4) 共享文件系统初始化# 另一种初始化方法利用了一个共享的文件系统，该系统在组中所有机器上可见，以及一个期望的 world_size。URL 应以 file:// 开头，并包含共享文件系统上一个现有目录中不存在的文件的路径。如果文件不存在，文件系统初始化将自动创建该文件，但不会删除该文件。因此，你有责任确保在对相同文件路径/名称的下一次 init_process_group() 调用之前清理该文件。请注意，最新的分布式包不再支持自动 rank 分配，group_name 也被弃用。警告 此方法假定文件系统支持使用 fcntl 进行锁定 - 大多数本地系统和 NFS 支持它。警告 此方法将始终创建文件，并尽力在程序结束时清理和删除文件。换句话说，每次使用文件 init 方法初始化都需要一个全新的空文件才能成功初始化。如果再次使用之前初始化使用的（碰巧未被清理的）相同文件，这是意外行为，通常会导致死锁和失败。因此，即使此方法会尽力清理文件，如果自动删除失败，你有责任确保在训练结束时删除文件，以防止下次重用同一个文件。如果你计划对同一个文件名多次调用 init_process_group()，这一点尤其重要。换句话说，如果文件未被删除/清理，而你再次对该文件调用 init_process_group()，则预期会出现失败。这里的经验法则是，确保每次调用 init_process_group() 时文件都不存在或为空。import torch.distributed as dist # rank 应始终指定 dist.init_process_group(backend, init_method='file:///mnt/nfs/sharedfile', world_size=4, rank=args.rank) 环境变量初始化# 此方法将从环境变量读取配置，允许完全自定义信息的获取方式。需要设置的变量有：MASTER_PORT - 必填；必须是 rank 0 机器上的一个空闲端口 MASTER_ADDR - 必填（rank 0 除外）；rank 0 节点的地址 WORLD_SIZE - 必填；可以在此处设置，或在 init 函数调用中设置 RANK - 必填；可以在此处设置，或在 init 函数调用中设置 rank 为 0 的机器将用于建立所有连接。这是默认方法，意味着不必指定 init_method（或可以是 env://）。改进初始化时间# TORCH_GLOO_LAZY_INIT - 按需建立连接，而不是使用完整网格，这可以极大地改善非 all2all 操作的初始化时间。

```
torch.distributed.init_process_group()
```

**模式 4：** 示例：

```
>>> from torch.distributed.device_mesh import init_device_mesh
>>>
>>> mesh_1d = init_device_mesh("cuda", mesh_shape=(8,))
>>> mesh_2d = init_device_mesh("cuda", mesh_shape=(2, 8), mesh_dim_names=("dp", "tp"))
```

**模式 5：** 组# 默认情况下，集体通信作用于默认组（也称为 world），并要求所有进程进入分布式函数调用。然而，某些工作负载可以从更细粒度的通信中受益。这就是分布式组发挥作用的地方。new_group() 函数可用于创建新组，包含所有进程的任意子集。它返回一个不透明的组句柄，可以作为组参数传递给所有集体通信（集体通信是以某些众所周知的编程模式交换信息的分布式函数）。torch.distributed.new_group(ranks=None, timeout=None, backend=None, pg_options=None, use_local_synchronization=False, group_desc=None, device_id=None)[source]# 创建一个新的分布式组。此函数要求主组中的所有进程（即属于分布式作业的所有进程）进入此函数，即使它们不打算成为该组的成员。此外，组应在所有进程中以相同的顺序创建。警告 安全并发使用：使用多个进程组与 NCCL 后端时，用户必须确保跨 rank 的集体通信具有全局一致的执行顺序。如果进程中的多个线程发起集体通信，则需要显式同步以确保一致的顺序。使用 torch.distributed 通信 API 的异步变体时，会返回一个工作对象，并且通信内核被排入单独的 CUDA 流，允许通信和计算重叠。一旦在一个进程组上发出了一个或多个异步操作，在使用另一个进程组之前，必须通过调用 work.wait() 与其他 cuda 流同步。有关详细信息，请参阅同时使用多个 NCCL 通信器 &lt;https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/communicators.html#using-multiple-nccl-communicators-concurrently>。参数 ranks (list[int]) – 组成员的 rank 列表。如果为 None，将设置为所有 rank。默认为 None。timeout (timedelta, optional) – 详见 init_process_group 的详细信息和默认值。backend (str 或 Backend, optional) – 要使用的后端。根据构建时配置，有效值为 gloo 和 nccl。默认使用与全局组相同的后端。此字段应以小写字符串形式给出（例如，"gloo"），也可以通过 Backend 属性访问（例如，Backend.GLOO）。如果传入 None，将使用与默认进程组对应的后端。默认为 None。pg_options (ProcessGroupOptions, optional) – 进程组选项，指定在构建特定进程组期间需要传递的额外选项。例如，对于 nccl 后端，可以指定 is_high_priority_stream，以便进程组可以使用高优先级 cuda 流。有关配置 nccl 的其他可用选项，请参阅 https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/api/types.html#ncclconfig-t。use_local_synchronization (bool, optional)：在进程组创建结束时执行组局部屏障。不同之处在于，非成员 rank 不需要调用 API 且不加入屏障。group_desc (str, optional) – 描述进程组的字符串。device_id (torch.device, optional) – 一个特定的设备，用于“绑定”此进程，new_group 调用将尝试立即为该设备初始化通信后端（如果提供了此字段）。返回 一个分布式组的句柄，可以传递给集体调用，或者如果 rank 不属于 ranks 则为 GroupMember.NON_GROUP_MEMBER。注意 use_local_synchronization 不适用于 MPI。注意 虽然 use_local_synchronization=True 可以显著加快大型集群和小型进程组的速度，但必须小心，因为它会改变集群行为，因为非成员 rank 不加入组的 barrier()。注意 当每个 rank 创建多个重叠的进程组时，use_local_synchronization=True 可能导致死锁。为避免这种情况，请确保所有 rank 遵循相同的全局创建顺序。torch.distributed.get_group_rank(group, global_rank)[source]# 将全局 rank 转换为组 rank。global_rank 必须是 group 的一部分，否则会引发 RuntimeError。参数 group (ProcessGroup) – 要查找相对 rank 的 ProcessGroup。global_rank (int) – 要查询的全局 rank。返回 global_rank 相对于 group 的组 rank。返回类型 int 注意 在默认进程组上调用此函数返回恒等值。torch.distributed.get_global_rank(group, group_rank)[source]# 将组 rank 转换为全局 rank。group_rank 必须是 group 的一部分，否则会引发 RuntimeError。参数 group (ProcessGroup) – 要从中查找全局 rank 的 ProcessGroup。group_rank (int) – 要查询的组 rank。返回 group_rank 相对于 group 的全局 rank。返回类型 int 注意 在默认进程组上调用此函数返回恒等值。torch.distributed.get_process_group_ranks(group)[source]# 获取与 group 关联的所有 rank。参数 group (Optional[ProcessGroup]) – 要获取所有 rank 的 ProcessGroup。如果为 None，将使用默认进程组。返回 按组 rank 排序的全局 rank 列表。返回类型 list[int]

```
new_group()
```

**模式 6：** 警告 安全并发使用：使用多个进程组与 NCCL 后端时，用户必须确保跨 rank 的集体通信具有全局一致的执行顺序。如果进程中的多个线程发起集体通信，则需要显式同步以确保一致的顺序。使用 torch.distributed 通信 API 的异步变体时，会返回一个工作对象，并且通信内核被排入单独的 CUDA 流，允许通信和计算重叠。一旦在一个进程组上发出了一个或多个异步操作，在使用另一个进程组之前，必须通过调用 work.wait() 与其他 cuda 流同步。有关详细信息，请参阅同时使用多个 NCCL 通信器 &lt;https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/communicators.html#using-multiple-nccl-communicators-concurrently>。

```
NCCL
```

**模式 7：** 注意 如果你将 DistributedDataParallel 与分布式 RPC 框架结合使用，应始终使用 torch.distributed.autograd.backward() 计算梯度，并使用 torch.distributed.optim.DistributedOptimizer 优化参数。示例： >>> import torch.distributed.autograd as dist_autograd >>> from torch.nn.parallel import DistributedDataParallel as DDP >>> import torch >>> from torch import optim >>> from torch.distributed.optim import DistributedOptimizer >>> import torch.distributed.rpc as rpc >>> from torch.distributed.rpc import RRef >>> >>> t1 = torch.rand((3, 3), requires_grad=True) >>> t2 = torch.rand((3, 3), requires_grad=True) >>> rref = rpc.remote("worker1", torch.add, args=(t1, t2)) >>> ddp_model = DDP(my_model) >>> >>> # 设置优化器 >>> optimizer_params = [rref] >>> for param in ddp_model.parameters(): >>> optimizer_params.append(RRef(param)) >>> >>> dist_optim = DistributedOptimizer( >>> optim.SGD, >>> optimizer_params, >>> lr=0.05, >>> ) >>> >>> with dist_autograd.context() as context_id: >>> pred = ddp_model(rref.to_here()) >>> loss = loss_func(pred, target) >>> dist_autograd.backward(context_id, [loss]) >>> dist_optim.step(context_id)

```
torch.distributed.autograd.backward()
```

**模式 8：** static_graph (bool) – 当设置为 True 时，DDP 知道训练的图是静态的。静态图意味着 1）使用和未使用的参数集在整个训练循环中不会改变；在这种情况下，用户是否设置 find_unused_parameters = True 并不重要。2）图的训练方式在整个训练循环中不会改变（意味着没有依赖于迭代的控制流）。当 static_graph 设置为 True 时，DDP 将支持过去无法支持的情况：1）可重入反向传播。2）多次激活检查点。3）当模型有未使用的参数时进行激活检查点。4）存在模型参数在前向函数之外。5）当存在未使用的参数时可能提高性能，因为 DDP 不会在每次迭代中搜索图以检测未使用的参数。要检查是否可以将 static_graph 设置为 True，一种方法是检查之前模型训练结束时的 ddp 日志数据，如果 ddp_logging_data.get("can_set_static_graph") == True，大多数情况下你也可以设置 static_graph = True。示例：>>> model_DDP = torch.nn.parallel.DistributedDataParallel(model) >>> # 训练循环 >>> ... >>> ddp_logging_data = model_DDP._get_ddp_logging_data() >>> static_graph = ddp_logging_data.get("can_set_static_graph")

```
True
```

## 参考文件

本技能在 `references/` 目录下包含详尽的文档：

- **other.md** - 其他文档

当需要详细信息时，使用 `view` 命令读取特定的参考文件。

## 使用本技能

### 初学者
建议先阅读入门指南或教程参考文件，以掌握基础概念。

### 针对特定功能
使用相应的分类参考文件（api、指南等）获取详细信息。

### 代码示例
上方的快速参考部分包含了从官方文档中提取的常用模式。

## 资源

### references/
从官方来源提取并组织的文档。这些文件包含：
- 详细说明
- 带有语言标注的代码示例
- 指向原始文档的链接
- 用于快速导航的目录

### scripts/
在此处添加用于常见自动化任务的辅助脚本。

### assets/
在此处添加模板、样板或示例项目。

## 注意

- 本技能自动生成于官方文档
- 参考文件保留了源文档的结构和示例
- 代码示例包含语言检测，以实现更好的语法高亮
- 快速参考模式提取自文档中的常用示例

## 更新

要使用更新的文档刷新本技能：
1. 使用相同配置重新运行爬虫脚本
2. 本技能将使用最新信息重建