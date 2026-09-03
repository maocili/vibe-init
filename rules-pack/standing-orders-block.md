## Agent Note 纪律（dsh-rules 管理）

本项目把非平凡变更的决策与提案记录为 Agent Note（位于 .agents/notes/），这是会话级常设要求：

- **何时写**：任何改变行为、架构、跨文件契约、流程/工具链、测试策略或格式（磁盘/网络/配置）的变更，
  必须在同一变更里新增或更新笔记；纯机械或局部编辑豁免。已有笔记拥有该决策时更新它即可，不另起重复。
- **写在哪里**：按生命周期四象限目录（proposed/ implemented/ rejected/ archived/）与
  yyyy-mm-dd-topic-title.md 命名；完整规则见 .agents/notes/README.md。
- **格式底线**：标题为 # Agent Note: <标题>，前三行含 Status: 行；正文以 ## Problem 开头，
  并必须含 ## Alternatives considered。
- **一致性**：新笔记先做 supersession 检查并与相关旧笔记交叉链接；implemented/ 笔记随实现保持现行
  （只更新事实）；archived/ 是冻结历史，不可改动、不可当作现行依据。

EN: standing order — record non-trivial decisions as Agent Notes under .agents/notes/
(four-quadrant lifecycle, dated naming, required header/format). Full rules: .agents/notes/README.md.
