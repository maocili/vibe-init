# dsh-rules：实现设计

> 本文档只说明实现；范围、默认值和非目标由
> [REQUIREMENTS](REQUIREMENTS-dsh-rules-plugin.md) 定义。

## 1. 结构

```text
rules-pack/ ── manifest + sha256 + feature/toolchain 声明 ──┐
                                                             │ plan → evaluate → apply
插件：dsh-rules.mjs · bin/ · lib/ · test/ ───────────────────┤
                                                             ▼
项目：AGENTS.md marker 段 · .agents/notes/ · .agents/skills/ · .dsh-rules/toolchain/
```

`dsh-rules.mjs` 是无副作用的 Cordis 入口；`bin/dsh-rules.mjs` 调用 CLI；`lib/pack.mjs` 加载和校验
规则包；`lib/engine.mjs` 负责计划与物化；`lib/diff.mjs` 生成写前预览。

## 2. 规则包

`rules-pack/manifest.json` 声明版本、文件条目、sha256、feature 默认值和可选 `toolchain`。普通文件
通过 `target`/`source` 镜像；根规则通过 `mode: append-under-marker` 写入：

```text
<!-- dsh-rules:<id>:start -->
…规则正文…
<!-- dsh-rules:<id>:end -->
```

写入前会移除规则包中的规划注释和旧 marker。`hash --pack rules-pack` 是修改规则包后的唯一摘要刷新命令。
规则正文不得硬编码在 `lib/` 中。

`rules-pack/toolchain/spec.json` 把工具链分为 scaffold、hooks、base、text-link、doc-budgets、bilingual
和 extras 组。每组声明 feature、源目录、验证脚本和依赖；引擎只镜像启用的组，并从启用集合确定性组装
消费者 `package.json`。

## 3. 物化与冲突策略

引擎依次生成 plan、计算每项 action、展示 diff、再应用：

| 内容 | 规则 |
|---|---|
| marker 段 | 按 id 原位替换；同文件多段累积写入；段外文字保留。 |
| 骨架和技能 | 内容相同跳过；不同即 conflict，除非显式 `--force`。 |
| 工具链 | 关闭 feature 时仅删除仍与源一致的受管副本；用户修改转为 conflict。 |
| 目录 | 仅按需要创建；移除后裁剪空目录。 |

所有计划使用当前磁盘内容重新评估，所以重复 `init`/`upgrade` 收敛到无写入。`status` 复用计划但不
应用；`audit` 额外检查规则包摘要、旧 `.template/` 残留、冗余 dsh 技能与工具链中的未知文件。

## 4. CLI 与挂载

CLI 提供 `init`、`upgrade`、`status`、`audit`、`hash` 和 `list-skills`。项目根从 `--project` 或当前目录
向上查找 `.git`；规则包默认位于仓库根 `rules-pack/`，可由 `--pack` 或 `DSH_RULES_PACK` 覆盖。

Cordis 挂载使用 [`../cordis.patch.sample.yml`](../cordis.patch.sample.yml) 中的仓库根入口。`apply()` 只校验
规则包并输出就绪日志；写项目内容只能通过显式 CLI 或将来的会话工具发生。

## 5. 验证与演进

仓库根 `pnpm test` 运行 26 个 Node 测试，覆盖规则包加载、幂等、冲突保护、feature 开关、CLI 和
docGates 的物化/移除。需求到证据的完整映射在 [ACCEPTANCE](ACCEPTANCE.md)。

下一步是明确 DP-F/DP-G、验证会话工具/GUI 注册面，并决定 M3 分发方式；这些工作不改变项目级和
不触碰全局面的边界。
