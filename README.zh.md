# vibe-init

[English](README.md) | 中文

`vibe-init` 是一个**独立 CLI 初始化器**，负责项目本地规则和文档。它把版本化的规则包安装到一个项目中，而不触碰用户全局配置或用户技能目录。

它管理的内容包括项目根 `AGENTS.md` 中带 marker 的规则段、`.agents/notes/` 骨架说明、声明的 `.agents/skills/` 技能副本、生成的 `docs/AGENTS.md` 和 `.vibe-init/toolchain/` 文档门禁工具链。规则正文的唯一来源是 [`packages/`](packages/README.md)；CLI 代码只负责计划、比对和物化内容。

## 快速开始

先从版本化 Git 仓库全局安装独立 CLI：

```bash
pnpm install --global github:maocili/vibe-init#v0.3.0
```

在目标项目中先预览，再明确执行：

```bash
vibe-init init --dry-run
vibe-init init --yes
```

之后可用：

```bash
# 检查受管内容、规则包摘要与旧命名空间残留（只读）
vibe-init audit

# 将规则包的新版内容迁移到项目（先加 --dry-run 更稳妥）
vibe-init upgrade --yes
```

默认入口是当前目录所属的 Git 项目；也可指定 `--project <dir>`。写入命令在非交互环境必须带 `--yes` 或 `--dry-run`。

## 默认安装的内容

| 落点 | 内容 |
|---|---|
| `<project>/AGENTS.md` | Agent Note、文本链接、文档预算三个受管规则段 |
| `<project>/.agents/notes/` | 双语就绪的笔记骨架与四象限生命周期目录 |
| `<project>/.agents/skills/` | 全部随包的项目级 skill 副本 |
| `<project>/.vibe-init/toolchain/` | 默认 docGates 脚本、配置和确定性组装的 `package.json` |

默认开启 `textLinkManagement`、`bilingualPairing`、`docBudgets` 和 `docGates`；默认关闭 `bilingualDocsDiscipline` 与 `docGatesExtras`。例如：

```bash
# 为本次迁移启用双语纪律及其门禁
vibe-init upgrade \
  --feature bilingualDocsDiscipline=true --yes

# 移除由初始化器管理的 docGates 工具链
vibe-init upgrade \
  --feature docGates=false --yes
```

关闭特性或清单移除时，初始化器只删除 `state.json` 确认且内容仍等于上次安装哈希的受管副本；用户改过的文件、用户新增文件和无法判断归属的文件会报告为冲突并保留。升级不会修改日期命名的 Agent Note、笔记 `manifest.json` 或业务 `docs/**`。

每个项目的 `.vibe-init/state.json` 记录 pack 版本、feature 配置、marker 和受管文件的源/安装哈希。`upgrade` 始终先展示分类 dry-run；非交互写入必须带 `--yes`。工具链 package 或依赖集合变化时，文件迁移成功后会运行 `pnpm -C .vibe-init/toolchain install`，只有文件和依赖都成功才提交新状态。旧 `.dsh-vibe/` 命名空间不被发现或迁移。

## 命令

| 命令 | 用途 |
|---|---|
| `init` | 为一个项目创建受管面 |
| `upgrade` | 以同一幂等引擎迁移到规则包当前版本 |
| `status` | 查看逐项状态，不写盘 |
| `audit` | `status` 加规则包完整性和旧命名空间残留检查，不写盘 |
| `hash --pack packages` | 在修改规则包后刷新规则行与技能资产的 manifest sha256 |
| `list-skills` | 列出默认安装的项目技能 |

`init` 与 `upgrade` 默认复制 manifest 声明的全部技能到项目 `.agents/skills/`；`--skill <name>` 仅为兼容旧调用保留。`init` 遇到用户编辑的技能会报告 conflict；`upgrade` 会覆盖规则包声明的技能文件，但保留技能目录中的用户新增文件。

## 开发与文档

```bash
pnpm test
```

`pnpm test` 运行仓库的 Node 测试套件。`pnpm run package:check` 会验证测试和打包清单；`pnpm run package:build` 会把发布 tarball 写入 `artifacts/`。修改 `packages/` 后必须刷新摘要：

```bash
node bin/vibe-init.mjs hash --pack packages
```

详细资料在 [`docs/`](docs/README.md)：

- [需求与范围](docs/REQUIREMENTS-vibe-init.md) 是定案口径；
- [文档规范](docs/AGENTS.md) 定义分层、篇幅目标与预算门禁；
- [验收矩阵](docs/ACCEPTANCE.md) 对应实现和测试；
- [实现设计 Agent Note](.agents/notes/implemented/architecture/2026-09-04-vibe-init-implementation-design.md) 记录实现取舍；
- [实现历史 Agent Note](.agents/notes/implemented/process/2026-09-04-vibe-init-implementation-history.md) 记录里程碑；
- [Upgrade 所有权迁移 Agent Note](.agents/notes/implemented/process/2026-09-04-upgrade-ownership-migration.md) 记录状态与覆盖边界；
- [独立硬切 Agent Note](.agents/notes/implemented/simplification/2026-09-06-standalone-vibe-init.md) 记录移除理由与兼容边界。
