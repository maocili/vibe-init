## 双语文档纪律（dsh-vibe feature: bilingualDocsDiscipline，默认关）

- 启用双语后，主文档（.md）与中文配对（.zh.md）**逐节对应**；Agent Note 的头 token
  （# Agent Note: 与 Status: 行）保持英文原样。
- 每对文档登记进所在目录的 README.i18n.yaml（或项目约定的配对表）；任何一侧的修改都必须在
  **同一变更**内同步另一侧，避免两侧漂移。
- 归档/移动时须整对移动，并保留双方结构对应。
- 默认关闭：仅当项目确实双语交付时才开启；未开启时 .zh.md 与 i18n 侧车文件可忽略。

EN: bilingual docs discipline (off by default) — .md/.zh.md pairs stay section-aligned, are declared
in the i18n pair list, and change together in the same change.
