# 历史版本快照

本目录保存已发布 AI 资产的完整历史快照，仅供维护、对照与审计使用，**不属于对外分发内容**。

## 目录结构

```text
history/
├── skills/<skill-name>/<version>.md
└── rules/<rule-name>/<version>.md
```

- 当前生效的 Skill 和 Rule 分别以 `skills/`、`rules/` 中的文件为准。
- 历史 Skill 快照不得命名为 `SKILL.md`，避免被安装器递归识别为可安装 Skill。
- 使用侧获取资产时不得复制本目录。
- 已发布快照只新增、不覆盖；未提交的迭代不创建快照。
