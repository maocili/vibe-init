# dsh-rules 插件：需求与目标

> 状态：**定案 v1.0（2026-09-03）**。
> **本文档取代 DESIGN-dsh-rules-plugin.md 的 §1/§2 作为范围口径**（DP-D 定案，2026-09-03）：
> 范围与目标冲突处一律以本文档为准；DESIGN 退为纯实现方案稿（分层归属、规则包格式、命令面、
> 权限模型、里程碑），并已按本文档对齐修订（2026-09-03，全局面设计移除；见 §6）。
> EN TL;DR: the dsh-rules plugin is a **per-project initializer**, not a global installer: it
> never writes the user-global plane (~/.dsh/AGENTS.md, user skill roots stay untouched). For each
> project it materializes a managed surface — a fresh notes skeleton, a marker-wrapped rule block
> in the root AGENTS.md (note discipline + text-link management by default; the bilingual
> discipline section stays off), and user-selected skill copies under .agents/skills/ managed like
> a dependency package manager (declared, versioned, upgradeable; user-installed skills are left
> alone). rules-pack/ under this repo stays the single versioned content source; the plugin only
> installs and manages, never hardcodes rule text.

## 0. 决策基线（用户拍板，2026-09-03）

| 决策 | 内容 | 影响 |
|---|---|---|
| D1 | **不做全局规则/全局安装面**：不改 ~/.dsh/AGENTS.md、不动用户级技能根；插件只对项目动作 | §1 G 映射、§2 R1/R3、§3 布局、命令面（install-global 退役）、DESIGN §2/§6 待同步 |
| D2 | **每个项目显式初始化**，替代「一次安装、处处生效」：插件 = 项目初始化器/管理器 | 定位重述、R1 重写 |
| D3 | **textLinkManagement、bilingualPairing 默认开**；bilingualPairing 语义 = 双语骨架三件套 | §3.2 默认矩阵、manifest features 语义 |
| D4 | **双语纪律段默认关**（骨架双语就绪 ≠ 强制双语纪律）；重机制留给需要者 | §3.2、独立开关待定（DP-E） |
| D5 | **技能 = 项目级副本 + 依赖包管理模式**：声明/版本化/可升级；也允许用户自装技能，插件不覆盖 | §2 R3、§3.2、§4 边界 |
| D6 | 本文档为范围口径，**定案后取代 DESIGN §1/§2**；DESIGN 退为纯方案稿 | §0 D7、§7 |
| D7 | **DP-D 定案**：本文档定案（v1.0）即取代 DESIGN… §1/§2 作为范围口径；DESIGN 仅承载 §3 起的实现方案 | 本文档权威关系 |
| D8 | **DP-A 定案**：项目根规则块 = **指针式**——短块指向 .agents/notes/ 骨架门规；细节在骨架内；受基线字节预算约束 | §1 G1、§3.2 根块行、standing-orders-block 内容形态 |
| D9 | **DP-E 定案**：双语纪律段 = **独立 feature key**（不并入 docBudgets），默认关（D4）；key 命名实现期定 | §3.2 feature 语义 |
| D10 | **docBudgets 默认开启**：轻量 doc 分层/预算语义随默认开箱（与双语纪律段互不归属） | §3.2 feature 语义、§5 |

## 1. 目标重述（病根 → 目标 → 验收）

把「vibe-coding-templates 纪律」应用到新项目的旧做法是**拷贝整棵容器子树**，由此产生三个已证实
的病根。本插件把消费方式改成：**每个项目由插件初始化出一份受管面（规则块 + 笔记骨架 + 选定技能），
内容来自版本化规则包，插件负责装入与维护**——不拷贝裸内容，也不触碰用户全局面。

| 病根（问题域） | 目标（解空间） | 验收口径（可判定的证据） |
|---|---|---|
| P1 **规则不生效**：常设规则写在嵌套目录（如 .template/AGENTS.md），不在会话基线；笔记语料成死目录 | G1 **项目规则随项目生效**：init 把常设规则以 marker 段写进项目根 AGENTS.md（基线自动注入处），并生成可被引用的笔记骨架；不依赖也不修改全局面 | 新会话基线含项目规则块；agent 引用门规/骨架而非找不到规则；~/.dsh 相关文件运行前后字节不变 |
| P2 **拷贝即漂移**：手动复制技能/规则进项目后无版本跟踪，容器改了已拷贝项目不跟进，且冗余不可审计 | G2 **受管副本，依赖包式演进**：项目内规则块与选定技能副本由插件声明式管理（版本/sha256 可查、可升级、可审计）；用户自装内容不受干扰 | status 能报项目内各受管文件的版本与漂移；upgrade 只更新声明内副本；用户自装技能未被覆盖 |
| P3 **开发史污染**：拷贝容器把历史决策记录与 harness 专用物原样带入下游仓库 | G3 **污染在构造上不可达**：init 只物化「新鲜骨架 + 规则块 + 精选通用技能」；内容源历史不进项目 | 项目 .agents/notes/ 无容器历史命名 note；audit 对残留可识别并报告 |

统摄需求一句话：**规则内容 = 版本化规则包（本仓库 rules-pack/）；项目 = 插件初始化出的受管面；
全局面（~/.dsh、用户技能根）= 插件永不触碰**。

## 2. 行为需求（what，含验收）

> 每条给一个验收场景。命令面与 marker 格式等细节见 DESIGN；此处只定行为契约。

- **R1 项目显式初始化**：插件面向**单个项目**动作；init 在项目根生成受管面（规则块 + 笔记骨架 +
  选定技能副本），不提供也不需要「一次安装、处处生效」的全局装入。验收：对项目运行 init 后
  受管面出现；无全局文件被创建/修改。
- **R2 绝不触碰全局面**：任何命令不写/不删/不更 ~/.dsh/AGENTS.md、用户级技能根等全局位置。
  验收：全局面文件在插件任何操作前后的字节快照一致。
- **R3 技能 = 依赖包式项目副本**：技能不装全局；选定技能以副本进入 <project>/.agents/skills/，
  由插件按声明管理（安装/升级/移除）；用户自行添加的技能（不在声明内）**识别但永不覆盖**。
  验收：声明内技能可随 upgrade 更新；自装技能在 status 中被标注为非受管且内容原样。
- **R4 项目只拿受管内容**：init 物化到项目的是「笔记骨架（结构，无历史内容）+ marker 规则块
  + 声明内技能副本」；内容源开发史、harness 专用物任何路径下不进入项目。验收：空项目 init 后
  无容器历史 note；含残留的仓库运行 init 会**报告**残留而非静默保留。
- **R5 内容单一出处 + 内容寻址**：规则与技能文本唯一版本化出处是 rules-pack/（含 sha256）；
  插件只引用不内联。验收：文本改动发生在 rules-pack/ 并同步 manifest；插件源码内 grep 不到正文。
- **R6 绝不覆盖用户内容**：项目已有笔记、规则块段外编辑、自装技能，在无显式确认时一律不动；
  冲突以报告代替覆盖。验收：对含用户内容的目标运行 init/upgrade，结果 = 报告 + 内容原样保留；
  --force 仅在展示差异且显式确认后生效。
- **R7 幂等**：同一规则包版本重复运行，结果与首次字节一致，并报告 nothing-to-do。
  验收：对同一项目连跑两次 init，第二次无任何写入。
- **R8 状态可观测**：status/audit 只读报告：受管文件逐项 ok/drift/conflict/missing、技能副本
  声明内 vs 自装、污染残留（旧复制 note、未知顶层文件）。验收：造出漂移/污染后报告逐项命中且不写盘。
- **R9 可安全演进**：upgrade 只更新规则包版本变化的物化文件与声明内技能副本；关闭的特性对应物
  可被移除而不伤其他。验收：版本升级后仅预期内容变化，笔记与自装技能零改动。
- **R10 显式触发**：插件加载/挂载不自动改盘；一切物化由显式命令触发。验收：挂载后无副作用。

## 3. 内容范围（what 被物化进项目）

### 3.1 布局（v0.2 修订：无全局面）

| 落点 | 物化内容 | 状态 |
|---|---|---|
| <project>/AGENTS.md | note 纪律规则块 + 文本链接纪律段（marker 包裹） | 已实写（2026-09-03 M1 提炼） |
| <project>/.agents/notes/ | 笔记骨架：README（双语三件套）+ AGENTS.md 门规 + manifest + 四象限目录 | 已实写（2026-09-03 M1 提炼） |
| <project>/.agents/skills/ | 声明内技能副本（依赖包式，挑选制） | 空（skills-optional 待提炼） |
| ~/.dsh/AGENTS.md、用户技能根 | **不物化任何内容（D1）** | — 从范围删除 |
| 规则/技能文本的版本化出处 | rules-pack/（本仓库） | manifest 有 sha256；正文占位 |

### 3.2 默认开箱矩阵（D3/D4/D5 定案）

默认 init（不带任何开关、无挑选）产出：

| 默认产出 | 说明 | 状态 |
|---|---|---|
| 笔记骨架最小集 | README + AGENTS.md 门规 + manifest + 四象限目录 | 默认 |
| 双语骨架三件套 | + README.zh.md + README.i18n.yaml（骨架双语就绪） | 默认（bilingualPairing） |
| 根 AGENTS.md：note 纪律块（指针式，DP-A） | 何时写 note / **指向 .agents/notes/ 骨架门规**：根块短、细节在骨架内 | 默认 |
| 根 AGENTS.md：文本链接管理纪律段 | 交叉引用/校验语义 | 默认（textLinkManagement） |
| 根 AGENTS.md：双语纪律段 | 双语配对/同步纪律（重机制） | **默认关**（独立 feature key，D9） |
| 技能项目副本 | 用户挑选后复制进 .agents/skills/；声明式管理、可升级；自装不覆盖 | 机制默认，内容挑选制 |

feature 开关语义（v1.0 定案，manifest 待同步）：

- `textLinkManagement`：默认 **true**；开 = 文本链接纪律段进入项目根 AGENTS.md；
- `bilingualPairing`：默认 **true**；含义 = **双语骨架三件套物化**（README.zh.md/i18n.yaml），
  与纪律段解耦；
- 双语纪律段：**独立 feature key**（不并入 docBudgets），**默认 false**（D9；key 命名实现期定，建议 bilingualDocsDiscipline）；
- `docBudgets`：默认 **true**（D10）；轻量 doc 分层/预算语义物化为根 `AGENTS.md` 规则段
  （`features/doc-budgets.md`，2026-09-03 落地；正文可随提炼微调）；
- `optionalSkills`：可挑选技能清单（声明式依赖，默认空）。

### 3.3 明确不进入规则包/项目

- 容器自己的开发史 note（P3 的病根物）；
- harness 专用物（dsh-* 等与 DSH 内置重复的技能——内置同名者不必再分发）；
- 完整 doc-sync/verify 门禁工具链正文（只以 feature 形态提供轻量语义）。

## 4. 插件行为边界（管什么 / 不管什么）

| 管（在边界内，项目级） | 不管（在边界外） |
|---|---|
| 物化/更新/移除项目根规则段（marker 按 id 定位） | 全局面：~/.dsh/AGENTS.md、用户级技能根（R2） |
| 生成笔记骨架；对已有笔记只读、绝不覆盖（R6） | 用户笔记内容、根 AGENTS.md 段外编辑、自装技能（识别报告，不动） |
| 声明内技能副本的安装/升级/移除（依赖包式） | 项目业务代码、产品规则文本的创作 |
| status/audit 只读报告（版本/漂移/冲突/污染/技能归属） | 完整 doc-sync/verify 门禁的运行时移植 |
| 写前差异展示 + 确认；一切动作显式触发（R10） | 自动/隐式行为 |

边界原则一句话：**插件 = 项目的受管面初始化器与依赖管理器；用户拥有内容面（笔记、段外编辑、
自装技能），全局面属于用户环境、插件不碰**。

## 5. 非目标（负向约束，防蔓延）

- 不做全局规则安装、不写 ~/.dsh、不动用户级技能根（D1）；
- 不做「一次安装、处处生效」的全局分发模型（D2）；
- 默认不物化双语纪律段（关 = 默认形态；docBudgets 已默认开，见 D10）；
- 不覆盖用户笔记、段外编辑、自装技能（只报告）；
- 不做规则内容的「新家」——rules-pack/ 是唯一出处；
- 不替代 DSH 内置机制（基线注入、技能扫描），只把内容放对位置。

## 6. 与现状的关系（同步项与状态）

- **plugin/（引擎）**：install-global 命令、~/.dsh 落点、全局 marker 段逻辑**已退役删除**（2026-09-03）；
  技能物化已改为项目级 .agents/skills/（依赖包语义）；status/audit 只报项目面。技能**声明集合记录与
  自装识别归属报告（DP-F/DP-G）仍暂缓**。
- **rules-pack/**：global/AGENTS.md（→ ~/.dsh）目标**已删除**；manifest features 语义已按 §3.2 修订
  （textLinkManagement/bilingualPairing 默认 true、双语纪律段独立 key bilingualDocsDiscipline 默认关）；
  skills-optional 保留为项目级技能副本内容源（内容待提炼）。
- **DESIGN…**：已按 v1.0 **对齐修订**（2026-09-03）：全局面设计移除、命令面去 install-global、
  里程碑重排为纯项目级验证。
- 本文档只锁需求口径；实现进度以 git 记录与 plugin/rules-pack 实际状态为准。

## 7. 决策点状态

已定案：D1–D10（见 §0）。含 **DP-A**（根块指针式，D8）、**DP-D**（取代 DESIGN §1/§2，D7）、
**DP-E**（双语纪律段独立 key、默认关，D9）及 **docBudgets 默认开**（D10）。

暂缓（用户 2026-09-03：「暂时不管」，留待后续）：

- **DP-F 技能内容清单**：skills-optional/ 放哪些通用技能（内容提炼期）。
- **DP-G 自装技能识别口径**：audit 如何区分声明内副本与用户自装；v1 先做到「识别 + 报告 + 不覆盖」。

## 8. 术语（速查）

- 规则包 rules-pack：规则与技能文本的唯一版本化出处（manifest + sha256 + features）。
- 受管面：插件写入/更新/移除的面 = 项目根 marker 段 + .agents/notes/ 骨架 + 声明内技能副本。
- marker 段：以 <!-- dsh-rules:<entryId>:start/end --> 包裹、可按 id 原位替换的受管块。
- 全局面：~/.dsh/AGENTS.md 与用户级技能根（插件永不触碰）。
- 依赖包模式：技能副本 = 声明在 manifest（optionalSkills）内、版本/sha256 可查、可升级移除、
  用户自装内容识别但不覆盖的管理模型。
- 污染残留：manifest 未声明、命中旧复制特征的内容（容器历史 note、未知顶层文件）。
