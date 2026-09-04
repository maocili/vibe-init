# skills-optional — 项目级通用技能

本目录的每个子目录是一个完整的 `SKILL.md` 包。`init` 与 `upgrade` 默认将 manifest 中声明的全部技能
复制到目标项目的 `.agents/skills/`；它们永不写入用户全局技能根。技能安装不等于自动执行：只有用户任务
匹配且环境前置条件存在时才会使用。

技能是受管副本：`init` 对用户改过的技能报告 conflict 而不覆盖；`upgrade` 会按 state 和 manifest 覆盖规则包
声明的文件，同时保留技能目录中的用户新增文件。`--skill <name>` 仍可用于兼容旧调用，但所有随包技能已经默认选择。
