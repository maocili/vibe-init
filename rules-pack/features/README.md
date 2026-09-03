# features — 特性规则族（默认关闭，manifest.features 开关物化）

> 依据 DESIGN §4：默认「精简版」（无双语配对、无 doc-budget 门禁）；需要时打开对应开关物化文件。
> 每份规则以 marker 段追加到目标 `AGENTS.md`（`mode: append-under-marker`），与核心规则块分离，
> 便于 `upgrade` 定位与用户按需裁撤。

| 文件 | feature 开关 | 规划内容 |
|---|---|---|
| `text-link-management.md` | `textLinkManagement` | 文本链接管理：交叉引用、链接校验语义（doc-sync 子集） |
| `bilingual-docs.md` | `bilingualPairing` | 双语文档：md/zh 配对 + `README.i18n.yaml` 登记纪律 |

（占位：实现期从 vibe-coding-templates 提炼全文）
