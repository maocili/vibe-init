# Agent Notes（中文）

[English](README.md) | 中文

本目录存放一种设计文档。**Agent Note** 记录会影响本代码库的决策或提案——代码与正文承载不了的
「为什么」与「放弃了什么」。本文档定义笔记的位置、何时写、以及文件内格式；[项目根 AGENTS.md](../../AGENTS.md) 的
常设规则块指向这里。该说明及其配对元数据由初始化器拥有；升级过程中日期命名的笔记仍属于项目。

## 布局与命名

每篇笔记有两个路径轴：生命周期与分类；生命周期也就是状态：

- **proposed/** —— 尚未实现（或仅部分实现）的提案。
- **implemented/** —— 已落地的决策。笔记须与落地现状保持一致：当代码随后移动文件、重命名包、
  或修改键/默认值时，在同一变更里更新笔记事实。见 [implemented/AGENTS.md](implemented/AGENTS.md)。
- **rejected/** —— 审议后否决。仅当其裁决能阻止一个诱人的错误时保留；否则删除该笔记及其配套记录。
- **archived/** —— 已实现笔记的冻结历史快照。见 [archived/AGENTS.md](archived/AGENTS.md)。

分类是每个生命周期下的子目录：

| 分类 | 覆盖范围 |
| --- | --- |
| `feature` | 用户或 agent 可见的能力。 |
| `bug-fix` | 缺陷修复或事故暴露的缺口。 |
| `simplification` | 不新增能力地移除代码、行为或表面积。 |
| `architecture` | 有关已交付源代码及其所有权的结构决策。 |
| `process` | 代码外围的工具、策略或工作流。 |
| `testing` | 测试基础设施或测试策略。 |

命名统一为 lifecycle/class/yyyy-mm-dd-topic-title.md —— 日期 = 主题首次提出之日（以 git 历史为准）。笔记间
交叉引用一律用相对 Markdown 链接，不用裸叙述，从而可机械校验、并能在目录间移动后保持有效。不建集中式索引：
目录树本身就是清单。

## 何时写

每个非平凡变更 MUST 在同一变更中新增或更新至少一篇 Agent Note。非平凡 = 改变行为、架构、跨文件
契约、流程/工具链、测试策略、磁盘/网络/配置格式，或维护者可能回看的其它决策。重大未来工作的提案
从 proposed/ 开始；已定案者从 implemented/ 开始。更新已拥有该决策的笔记即满足规则——不另起重复。
仅纯机械或局部编辑（无行为后果）豁免。

新笔记一律先做 **supersession 检查**：在活动树中检索覆盖同一决策或机制的旧笔记。完全被取代的旧笔记
并入拥有者笔记（保留每一份独有 rationale、备选、后果与所需验证）后，连同配套记录一并删除；部分
取代则两篇都保持活动并交叉链接。

## 文件格式

每篇笔记的前三行必须是：

```markdown
# Agent Note: <title>

Status: <proposed | implemented | rejected — why, in one line>
```

后接空行。Status: 必须与所在生命周期目录一致（archived 中的笔记保留 Status: implemented 并在其下加
Archived: 行）。

正文一律以 **## Problem** 开头——动机要能脱离方案独立成立。后续结构取决于生命周期：

- **proposed/**：## Proposal（可用未来时——计划与开放问题在此）、可选专节、## Alternatives considered、## Acceptance criteria、## Risks。
- **implemented/**：## Decision（现在时、随实现保持现行）、专节、## Alternatives considered、## Consequences。提案期标题（## Proposal / ## Acceptance criteria）不属于这里。
- **rejected/**：提案冻结；只有 Status: 行承载裁决。

**每篇笔记都必须含 ## Alternatives considered**：每个真实备选及其落选理由，一备选一段（加粗引导句）。
没有记录被击败对象的决策会招致重新争辩。

## 归档

当已实现笔记的决策已完成、其 rationale 不太可能再指导未来工作时归档；只要其备选、所有权边界、
负向保证、持久语义、安全规则或回归条件仍有价值就保持活动。proposed/ 永不归档——过时提案应否决。rejected/
只在还能阻止一个可信的未来错误时保留，否则删除完整记录。

归档时把完整的中英/sidecar 三件套从 `implemented/<分类>/` 移到 `archived/<分类>/`，在两种语言的
`Status: implemented` 下插入同一 `Archived: YYYY-MM-DD`，重录 sidecar，并修复或删除入链。归档 manifest
以 append-only 方式封存 artifact hash。封存后的三件套永久冻结：不得编辑、翻译、重排、移动、删除，或修复其出链。

## 中文配对

.zh.md 与英文姊妹版逐节对应；机器校验的头 token（# Agent Note: 与 Status: 行）保持英文原样。
配对在 [README.i18n.yaml](README.i18n.yaml) 中声明；未启用双语的项目只保留 .md 并忽略 sidecar。
