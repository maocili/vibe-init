# Changelog

本记录保留影响使用方式、范围或架构的变更；细粒度提交历史以 Git 为准。

## 2026-09-04 — 文档收敛与仓库根插件布局

- 根 `README.md` 改为使用者入口；`docs/` 改为权威文档导航，移除重复的命令、状态和范围复述。
- 插件源码从 `plugin/` 展平到仓库根，项目文档集中到 `docs/`；挂载入口更新为
  `…/dsh-rules/dsh-rules.mjs`。
- `.template/` 与仓库自身旧 `.agents/` 容器树退役；可物化语料已位于 `rules-pack/`。

## 2026-09-04 — M1b：docGates 工具链

- `rules-pack/toolchain/` 以 `spec.json` 声明 scaffold、挂钩、基础、链接、预算、双语和扩展组。
- 引擎按 feature 物化/移除组，并确定性组装消费者 `package.json`；用户修改的副本保留为 conflict。
- 默认与双语启用场景均通过真实项目 `init → pnpm install → doc-sync` 验证；自动化测试为 26/26。

## 2026-09-03 — v1.0 项目级初始化器

- 范围定案为“每项目显式初始化，绝不触碰全局面”；`install-global` 退役。
- 完成 marker 段、笔记骨架、内容寻址、冲突保护、幂等升级、状态/审计与按次 feature 覆盖。
- 真实项目完成初始化、重跑、状态和审计验证。

## 待定

- DP-F：可选技能内容；DP-G：自装技能识别；M3：可分发形态。
