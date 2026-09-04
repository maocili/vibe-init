## 文档分层与篇幅预算（dsh-rules feature: docBudgets）

- **分层两档为主**：tutorial（教程：按序导向一个结果，每步只引入所需概念）与 reference（参考：定义查询
  范围与当前行为，无教学序列）。**one home per fact**——每个事实只在它的档位详述，其它位置用链接指向。
- **篇幅预算是护栏而非削减目标**：长期维护文档设字数软上限；超限先重组、下移内容或链接到所属档位，
  而不是新增重复文档；确需提额时在变更里说明理由。
- 文档分类与分层选择先于写作：先定位文档归属、再定详略与档位、tutorial 按前置知识排序、低层细节用链接替代。
- Agent Note（.agents/notes/）与代码注释不属本档位。预算的机械执行由 dsh-rules 的 docGates 工具链提供
  （verify-doc-budgets，默认安装；默认只预算根 AGENTS.md，档位清单在 `.dsh-rules/toolchain/scripts/doc-budgets.manifest.json`）。

EN: doc tiers (tutorial/reference, one home per fact) plus wordcount budgets as guardrails;
classification precedes writing. Budget ceilings are enforced mechanically by the docGates
toolchain (verify-doc-budgets, installed by default; budget list lives in
`.dsh-rules/toolchain/scripts/doc-budgets.manifest.json`).
