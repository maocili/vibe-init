# Agent Note: Harness agents parity

Status: implemented

## Problem

规则包提供了简化的 Agent Note 骨架，但已安装的 verifier 仍要求 Harness 风格的生命周期/分类路径。双语
配对设置也只声明 feature，不能控制骨架配对文件，导致初始化项目的说明与行为相互矛盾。

## Decision

规则包现在在每个活动生命周期下使用封闭的 Harness 兼容 Agent Note 分类，物化相应目录骨架，并记录同一
路径模型。`bilingualPairing` 控制 note README 的中文 counterpart 与 sidecar；关闭时只移除未经修改的受管
副本。其余 Harness `.agents` 工作流仍作为项目级受管内容交付，绝不安装到用户全局面。全部 11 个可复用 skill
默认安装，并提供详尽的通用工作流：保留决策记录生命周期、证据驱动的评审与验证、文档归属、双语配对协调、
简化、浏览器演示与 GitHub 官方 stack 防护。说明会发现目标项目的契约、站点配置、验证命令与可选能力，不再
引用 Harness 的 package、CI 或产品架构。既有元数据、支持性示例、recall battery 与确定性的 GIF encoder
仍作为受管资产。仅显式调用的翻译 skill 也成为内置双语工具链文档与 briefing 注释使用的名称。

## Alternatives considered

**压平 verifier。** 这会保留缩减后的说明，却丢弃工具链已经实现且可机械校验的有用分类体系。

**让双语骨架文件始终物化。** 无法改变物化行为的设置具有误导性，也让单语项目无法选择纯英文笔记骨架。

**逐字复制 Harness 路径和命令。** 这些说明绑定一个仓库的包和自动化；可复用规则应发现目标项目自身的
契约和能力。

## Consequences

新项目获得自洽的笔记结构和完整的默认 skill 集，却不会继承某个产品特有的源代码布局或发布流程。现有项目在
关闭双语配对时会将用户编辑过的配对文件保留为 conflict。规则包改动仍须刷新 manifest hash，并为 feature
移除和冲突保护补充回归覆盖。纯英文物化不会链接到被关闭 feature 有意省略的配对文件，但双语源文件保留双向
语言切换链接，以供配对校验。
