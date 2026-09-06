# Agent Note: 独立 vibe-init 硬切

Status: implemented

## Problem

初始化器曾同时以 Cordis plugin 和 CLI 两种形态分发，导致一个项目级物化工具还要负责 DSH bundle 元数据、profile patch、plugin 挂载行为和宿主专属的打包测试。这些宿主表面不参与项目变更的规划或应用，却扩大了发布契约，并让版本发布与 DSH profile 和 Cordis 生命周期语义耦合。

现有命名也会让项目级工具看起来像 DSH 的子系统。只重命名命令会保留别名、环境变量、持久化路径、marker 和迁移行为，从而留下两套身份和永久的兼容矩阵。

## Decision

初始化器只以独立 npm CLI 包 `@maocili/vibe-init` 发布，对外提供 `vibe-init` 二进制命令。删除 DSH/Cordis plugin 入口、bundle patch 与元数据、profile 安装行为，以及只服务于这些宿主能力的测试或文档。发布包不暴露 Cordis plugin API 或 DSH bundle 契约。

本次重命名采用完整硬切。新实现既不识别旧 package、bin 或环境变量，也不为其提供别名；只创建和管理 `.vibe-init/**` 与 `vibe-init:*` marker 段。即使新旧资产同时存在于同一个项目中，也不读取、迁移、修改或删除 `.dsh-vibe/**` 或 `dsh-vibe:*` marker 段。不提供遗留发现、迁移命令、兼容警告或清理路径。现有安装保持为不受触碰的历史资产，除非其所有者在 `vibe-init` 之外自行处理。

### Naming matrix

| 表面 | 新契约 | 旧表面及硬切处理 |
| --- | --- | --- |
| npm package | `@maocili/vibe-init` | `@maocili/dsh-vibe` 不是别名或依赖。 |
| 可执行文件 | `vibe-init` | 不以 bin 或 shim 形式分发 `dsh-vibe`。 |
| pack 覆盖变量 | `VIBE_INIT_PACK` | 忽略 `DSH_VIBE_PACK`。 |
| 工具链安装测试覆盖变量 | `VIBE_INIT_SKIP_TOOLCHAIN_INSTALL` | 忽略 `DSH_VIBE_SKIP_TOOLCHAIN_INSTALL`。 |
| 受管主目录 | `.vibe-init/` | 永不读取、迁移或删除 `.dsh-vibe/`。 |
| 持久状态 | `.vibe-init/state.json`，其中 `schemaVersion: 2` | 旧状态不作为 schema version 2 的输入。 |
| 受管工具链 | `.vibe-init/toolchain/` | 不检测或清理 `.dsh-vibe/toolchain/`。 |
| marker 命名空间 | `<!-- vibe-init:<id>:start -->` / `<!-- vibe-init:<id>:end -->` | `dsh-vibe:*` marker 视为普通既有文本并保持不变。 |
| 诊断前缀 | `[vibe-init]` | 不为兼容而保留 `[dsh-vibe]`。 |

### Retained design

确定性的 `plan` → `evaluate` → `apply` 分层继续作为实现边界。dry run 和所有只读报告都会 evaluate 与写入操作相同的 plan。`packages/` 继续作为规则、笔记骨架、技能、特性和工具链内容唯一的版本化来源；运行时代码不得重复这些内容。物化工具链中的双语提示语料和配对 manifest 由工具链负责，并从 `.vibe-init/toolchain/` 解析；项目文档继续从项目根目录解析。

冲突保护也继续保留。初始化不覆盖外来内容，更新根据新状态记录和 content hash 区分工具拥有的内容与用户改动。格式错误或重复的新 marker 段，以及用户修改过的受管文件，会阻止对应写入而非被覆盖。这些保护只适用于新命名空间，不检查旧资产。

`.vibe-init/state.json` 从 `schemaVersion: 2` 开始；version 1 明确不是可读取的前序版本。状态记录有效 pack 版本与特性，以及新命名空间所需的所有权和 source/installed hash。只有规划内文件操作和所需工具链依赖安装全部成功后，才通过临时文件和原子 rename 写入状态；失败时保留原有的有效 version 2 状态。

### Lost capabilities

用户将失去 DSH profile 安装与移除、bundle 驱动的发现、Cordis 挂载及挂载状态，以及所有由宿主管理的分发或更新路径。现有 `@maocili/dsh-vibe` 调用、`dsh-vibe` 脚本、DSH 前缀环境配置、`.dsh-vibe` 状态与工具链所有权，以及 `dsh-vibe:*` 受管段都不会得到升级或清理协助。因此，在资产所有者手动删除或协调旧材料之前，一个项目中可能同时存在新旧生成内容。

### Supersession and reintroduction

本决定部分取代[实现设计 Note](../architecture/2026-09-04-vibe-init-implementation-design.zh.md)中的宿主分发子决策：其中的历史 Cordis 入口、包名、bundle patch 和 profile 插入不再是现行事实。该设计 Note 继续负责保留的 pipeline、`packages/` 所有权、仅限项目的边界、物化语义和冲突策略。这是部分取代，不是完整取代。

只有在有证据表明用户需要独立 npm CLI 无法提供的 DSH 专属生命周期或分发操作，并明确指定宿主 API 兼容、发布耦合、安装失败和移除语义的所有者时，才可重新提议宿主集成。单独重引入旧名称或旧状态兼容，还必须有具体安装基数需求、明确的迁移与退役策略，以及证明遗留资产不会被误认作新所有权的测试。两种能力都不得以未记录的别名或偶然 adapter 形式恢复。

## Alternatives considered

**保留 plugin，同时增加 `vibe-init` 二进制命令。** 这能保留宿主便利性，但也保留 bundle、profile、Cordis 生命周期、双入口及其发布耦合；它只增加名称，并没有简化所有权。

**重命名，同时迁移现有安装。** 读取 version 1 状态、转换 marker 和移动 `.dsh-vibe` 可以减少手动清理，却会让遗留所有权和部分失败恢复成为新产品的一部分。兼容实现会比重命名存续更久，并削弱硬边界。

**只读识别旧资产并输出指引。** 检测看似比迁移便宜，但仍会使旧路径、marker 和格式错误的遗留数据成为今后每次 audit 的输入，也会形成保持检测准确的隐含义务。因此独立工具对它们保持无感知。

**现在就把 DSH 分发保留在单独的 adapter 包中。** adapter 可以隔离部分宿主代码，但在需求尚未得到证明时，只是把相同能力和发布义务保留在另一个包里。重引入条件已经定义了 adapter 何时才有依据。

**继续把 `@maocili/dsh-vibe` 发布为弃用 wrapper。** wrapper 有助于发现新命令，却会继续把旧 package 和 bin 作为支持表面，并模糊哪个实现拥有项目状态。运行时之外的 release note 足以公告这次硬切。

## Consequences

硬切会把清理和协调成本转移给现有用户，并可能在一个项目中留下重复的生成规则或工具链。忽略旧 marker 能防止意外接管，但也使新 CLI 无法检测互相矛盾的旧内容。移除宿主分发可能降低可发现性，并取消 profile 级自动化。重命名环境变量时，调用方若未更新配置，自定义 pack 或测试行为可能静默改变。Schema version 2 没有从 version 1 恢复的路径，因此所有权历史会重新开始，而保守冲突可能需要手动评审。

验证覆盖包名和二进制、宿主表面移除、命名空间和环境变量硬切、schema 2 状态、旧资产逐字节保留、共享计划、冲突保护、原子状态提交以及失去能力的文档说明。未来变更只能通过更新设计 Note 和明确交叉链接部分取代本决定；不得借此重新引入兼容别名。
