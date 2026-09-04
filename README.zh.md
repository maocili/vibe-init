# dsh-rules

[English](README.md) | 中文

`dsh-rules` 是一个**项目级初始化器**。它把版本化的规则包安装到一个项目中，而不触碰用户全局
配置或用户技能目录。

它管理的内容包括项目根 `AGENTS.md` 中带 marker 的规则段、`.agents/notes/` 骨架说明、声明的
`.agents/skills/` 技能副本、生成的 `docs/AGENTS.md` 和 `.dsh-rules/toolchain/` 文档门禁工具链。规则正文的唯一来源是
[`packages/`](packages/README.md)；插件代码只负责计划、比对和物化。

## 快速开始

在目标项目中先预览，再明确执行：

```bash
pnpm dlx @xuxf/dsh-rules init --dry-run
pnpm dlx @xuxf/dsh-rules init --yes
```

如果要把它作为项目依赖安装，而不是用 `pnpm dlx` 临时运行：

```bash
pnpm add @xuxf/dsh-rules
pnpm exec dsh-rules init --dry-run
pnpm exec dsh-rules init --yes
```

`pnpm add` 会把包写入 `package.json`；`pnpm install` 只安装已经声明的依赖。`pnpm dlx` 直接运行已发布的 CLI，不会添加项目依赖。

之后可用：

```bash
# 检查受管内容、规则包摘要与旧容器残留（只读）
pnpm dlx @xuxf/dsh-rules audit

# 将规则包的新版内容迁移到项目（先加 --dry-run 更稳妥）
pnpm dlx @xuxf/dsh-rules upgrade --yes
```

默认入口是当前目录所属的 Git 项目；也可指定 `--project <dir>`。写入命令在非交互环境必须带
`--yes` 或 `--dry-run`。

## 默认安装的内容

| 落点 | 内容 |
|---|---|
| `<project>/AGENTS.md` | Agent Note、文本链接、文档预算三个受管规则段 |
| `<project>/.agents/notes/` | 双语就绪的笔记骨架与四象限生命周期目录 |
| `<project>/.agents/skills/` | 全部随包的项目级 skill 副本 |
| `<project>/.dsh-rules/toolchain/` | 默认 docGates 脚本、配置和确定性组装的 `package.json` |

默认开启 `textLinkManagement`、`bilingualPairing`、`docBudgets` 和 `docGates`；默认关闭
`bilingualDocsDiscipline` 与 `docGatesExtras`。例如：

```bash
# 为本次迁移启用双语纪律及其门禁
pnpm dlx @xuxf/dsh-rules upgrade \
  --feature bilingualDocsDiscipline=true --yes

# 移除由插件管理的 docGates 工具链
pnpm dlx @xuxf/dsh-rules upgrade \
  --feature docGates=false --yes
```

关闭特性或清单移除时，插件只删除 `state.json` 确认且内容仍等于上次安装哈希的受管副本；用户改过的
文件、用户新增文件和无法判断归属的遗留文件会报告为冲突并保留。升级不会修改日期命名的 Agent Note、
笔记 `manifest.json` 或业务 `docs/**`。

每个项目的 `.dsh-rules/state.json` 记录 pack 版本、feature 配置、marker 和受管文件的源/安装哈希。
`upgrade` 始终先展示分类 dry-run；非交互写入必须带 `--yes`。工具链 package 或依赖集合变化时，文件迁移
成功后会运行 `pnpm -C .dsh-rules/toolchain install`，只有文件和依赖都成功才提交新状态。

## 命令

| 命令 | 用途 |
|---|---|
| `init` | 为一个项目创建受管面 |
| `upgrade` | 以同一幂等引擎迁移到规则包当前版本 |
| `status` | 查看逐项状态，不写盘 |
| `audit` | `status` 加规则包完整性和旧残留检查，不写盘 |
| `hash --pack packages` | 在修改规则包后刷新规则行与技能资产的 manifest sha256 |
| `list-skills` | 列出默认安装的项目技能 |

`init` 与 `upgrade` 默认复制 manifest 声明的全部技能到项目 `.agents/skills/`；`--skill <name>` 仅为
兼容旧调用保留。`init` 遇到用户编辑的技能会报告 conflict；`upgrade` 会覆盖规则包声明的技能文件，
但保留技能目录中的用户新增文件。

## 安装到 DSH profile

公共包以 DSH bundle 形式发布。在 profile 中安装后，宿主会依据包的 `dsh.bundle.patch` 声明自动加入插件层：

```bash
dsh plugin --profile web add @xuxf/dsh-rules
```

重启 profile 后，日志出现 `[dsh-rules] mounted` 即表示加载成功。挂载本身没有写盘副作用；仍须运行上面的 CLI 命令来初始化项目。

## 本地 checkout 开发挂载

本地开发或未安装宿主包时，可将 [`cordis.patch.sample.yml`](cordis.patch.sample.yml) 的条目合并到本机 profile：

```yaml
- insert:
    - id: dsh-rules
      name: file:////Users/xuxifeng/Work/dsh-rules/dsh-rules.mjs
```

这是 checkout 专用的回退路径，不是发布包的安装方式。

## 开发与文档

```bash
pnpm test
```

`pnpm test` 运行 48 个 Node 测试。修改 `packages/` 后必须刷新摘要：

```bash
node bin/dsh-rules.mjs hash --pack packages
```

详细资料在 [`docs/`](docs/README.md)：

- [需求与范围](docs/REQUIREMENTS-dsh-rules-plugin.md) 是定案口径；
- [文档规范](docs/AGENTS.md) 定义分层、篇幅目标与预算门禁；
- [验收矩阵](docs/ACCEPTANCE.md) 对应实现和测试；
- [实现设计 Agent Note](.agents/notes/implemented/architecture/2026-09-04-dsh-rules-implementation-design.md) 记录实现取舍；
- [实现历史 Agent Note](.agents/notes/implemented/process/2026-09-04-dsh-rules-implementation-history.md) 记录里程碑；
- [Upgrade 所有权迁移 Agent Note](.agents/notes/implemented/process/2026-09-04-upgrade-ownership-migration.md) 记录状态与覆盖边界。
