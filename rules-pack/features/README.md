# features — 特性规则族（manifest.features 开关物化）

> 依据 REQUIREMENTS §3.2 / DESIGN §4：每份规则以 marker 段追加到项目根 AGENTS.md
> （mode: append-under-marker），与核心 note 纪律块分离，便于 upgrade 定位与按次 --feature 开关。

| 文件 | feature 键 | 默认（v1.0） | 语义 |
|---|---|---|---|
| `text-link-management.md` | `textLinkManagement` | 开 | 文本链接管理：交叉引用、链接校验语义（轻量子集） |
| `bilingual-docs.md` | `bilingualDocsDiscipline` | 关 | 双语文档 md/zh 配对纪律（独立 key，不与骨架解耦混淆） |
| `doc-budgets.md` | `docBudgets` | 开 | doc 分层（tutorial/reference）与字数预算护栏（轻量） |
