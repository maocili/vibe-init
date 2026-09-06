# Agent Note: Commit after each completed step

Status: implemented

## Problem

多步骤 agent 会话可能已经完成多个可独立验证的变更，却把它们留在同一个未提交批次中。这会削弱可追溯性，也让单个步骤的审查、隔离或回滚变得困难。

## Decision

项目常设规则要求每个可独立验证的 step 完成后立即创建一个 Git commit。step 指一个有明确结果的实现、文档、配置或测试变更；为得到该结果可以涉及多个文件。提交前必须运行适用校验，多个已完成 step 不得共用一个 commit。生成项目使用的[提交规则](../../../../packages/standing-orders-block.md)是该要求的来源；当任务明确要求最终只创建一个 commit 时，以任务级要求优先于这条通用常设规则。

## Alternatives considered

**整项任务结束后再提交。** 否决，因为它隐藏了已完成的边界，并使部分恢复的范围不必要地扩大。

**每条命令或每个文件编辑都提交。** 否决，因为它们不一定是可独立验证的 step，会产生嘈杂且没有意义的历史。

## Consequences

Agent 必须在执行前识别 step 边界，完成适用校验后立即提交。尚不能验证的 step 保持进行中，不创建表示完成的 commit。只要源码、测试、文档和生成内容共同构成一个可验证结果，一个 step 仍可以包含这些协调变更。
