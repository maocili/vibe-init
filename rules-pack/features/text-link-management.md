## 文本链接管理（dsh-rules feature: textLinkManagement）

- 文档、规则与笔记之间的引用一律用**相对 Markdown 链接**（如 [格式约定](../docs/format.md)），
  不用裸标题文字、章节编号或无法校验的指向。
- 链接目标必须真实存在、大小写与相对路径正确；新增、改名、移动或删除目标文件时，在**同一变更**里
  更新所有入链，保持无断链。
- 悬空链接只允许出现在显式标注处（示意图、说明性锚点）；其余一律视为待修复缺陷。
- 可对 .md 文件做机械校验（枚举链接并检查目标存在性）；本项目不要求运行时全量移植 doc-sync 门禁，
  轻量校验由各项目按需启用。

EN: cross-references between docs/rules/notes use relative markdown links; targets must exist and
every rename/move/delete updates all inbound links in the same change.
