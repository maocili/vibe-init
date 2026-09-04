# dsh-rules

`dsh-rules` 是一个**项目级初始化器**。它把版本化的规则包安装到一个项目中，而不触碰用户全局
配置或用户技能目录。

它管理的内容只有三类：项目根 `AGENTS.md` 中带 marker 的规则段、`.agents/notes/` 笔记骨架，以及
`.dsh-rules/toolchain/` 文档门禁工具链。规则正文的唯一来源是
[`rules-pack/`](rules-pack/README.md)；插件代码只负责计划、比对和物化。

## 快速开始

在目标项目中先预览，再明确执行：

```bash
node /Users/xuxifeng/Work/dsh-rules/bin/dsh-rules.mjs init --dry-run
node /Users/xuxifeng/Work/dsh-rules/bin/dsh-rules.mjs init --yes
```

之后可用：

```bash
# 检查受管内容、规则包摘要与旧容器残留（只读）
node /Users/xuxifeng/Work/dsh-rules/bin/dsh-rules.mjs audit

# 将规则包的新版内容迁移到项目（先加 --dry-run 更稳妥）
node /Users/xuxifeng/Work/dsh-rules/bin/dsh-rules.mjs upgrade --yes
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
node /Users/xuxifeng/Work/dsh-rules/bin/dsh-rules.mjs upgrade \
  --feature bilingualDocsDiscipline=true --yes

# 移除由插件管理的 docGates 工具链
node /Users/xuxifeng/Work/dsh-rules/bin/dsh-rules.mjs upgrade \
  --feature docGates=false --yes
```

关闭特性时，插件只删除内容仍与规则包一致的受管副本；用户改过的文件会报告为冲突并保留。

## 命令

| 命令 | 用途 |
|---|---|
| `init` | 为一个项目创建受管面 |
| `upgrade` | 以同一幂等引擎迁移到规则包当前版本 |
| `status` | 查看逐项状态，不写盘 |
| `audit` | `status` 加规则包完整性和旧残留检查，不写盘 |
| `hash --pack rules-pack` | 在修改规则包后刷新规则行与技能资产的 manifest sha256 |
| `list-skills` | 列出默认安装的项目技能 |

`init` 与 `upgrade` 默认复制 manifest 声明的全部技能到项目 `.agents/skills/`；`--skill <name>` 仅为
兼容旧调用保留。用户编辑过的技能会报告 conflict 而不会被覆盖。

## 作为 DSH 本地插件挂载

将 [`cordis.patch.sample.yml`](cordis.patch.sample.yml) 的条目合并到本机 profile，并使用仓库根入口：

```yaml
- insert:
    - id: dsh-rules
      name: file:////Users/xuxifeng/Work/dsh-rules/dsh-rules.mjs
```

重启 profile 后，日志出现 `[dsh-rules] mounted` 即表示加载成功。挂载本身没有写盘副作用；仍须运行
上面的 CLI 命令来初始化项目。

## 开发与文档

```bash
pnpm test
```

`pnpm test` 运行 31 个 Node 测试。修改 `rules-pack/` 后必须刷新摘要：

```bash
node bin/dsh-rules.mjs hash --pack rules-pack
```

详细资料在 [`docs/`](docs/README.md)：

- [需求与范围](docs/REQUIREMENTS-dsh-rules-plugin.md) 是定案口径；
- [文档规范](docs/AGENTS.md) 定义分层、篇幅目标与预算门禁；
- [验收矩阵](docs/ACCEPTANCE.md) 对应实现和测试；
- [实现设计 Agent Note](.agents/notes/implemented/architecture/2026-09-04-dsh-rules-implementation-design.md) 记录实现取舍；
- [实现历史 Agent Note](.agents/notes/implemented/process/2026-09-04-dsh-rules-implementation-history.md) 记录里程碑。
