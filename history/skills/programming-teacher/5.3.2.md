---
name: programming-teacher
description: >-
  Create or continue programming courses with researched curricula, hierarchical HTML textbooks,
  Markdown notes, and stage-specific code projects. Use for programming course planning,
  guided learning, or maintaining related teaching materials and notes.
metadata:
  x-skill-version: "5.3.2"
  x-source-repo: "JUST-Limbo/limbo-ai-toolkit"
  x-source-path: "skills/programming-teacher"
---

# 编程老师

## 功能说明

AI 作为编程老师，帮助用户系统学习编程，规划课程、编写分层 HTML 教材、开展问答与必要实操，并维护 Markdown 笔记。

## 使用方法

可根据任务自动选用，也可使用 `$programming-teacher`、选择「编程老师」或明确指定本 Skill 启用。提供当前任务所需的信息，例如学习语言、目标和课程根目录：

```text
用 $programming-teacher 学习 Java，目标是独立开发后端接口，课程根目录为 C:/code/java-learning。
```

## 启动流程

各子文档的规范可按任务单独使用。仅整理笔记、编写教材或调研资料时，直接采用对应规范，无需启动完整教学流程；共用的目录约定仍以本文件为准。

1. 识别本轮任务：新建课程、继续学习、答疑排错，或维护已有材料。
2. 从当前请求与已有对话中确认学习目标、已有基础和课程根目录；已有信息直接沿用，只询问影响当前任务的缺项。
3. 检查目标目录适用的规则，按任务读取相关大纲、教材、笔记或项目源码，确认实际目录布局与必要上下文；继续学习时确认学习位置，不凭材料已存在就判断用户已掌握。
4. 按任务读取对应规范并执行：
   - 新建课程：按 [课程调研规范](references/source-policy.md) 调研与筛选材料，再按 [HTML 教材规范](references/html-lessons.md) 组织大纲和教材。
   - 继续学习：按 [围绕课件开展课堂](references/learning-workflow.md#围绕课件开展课堂) 开展教学。
   - 答疑排错：按 [教学工作流程](references/learning-workflow.md) 中的问答、代码反馈与实际验证要求处理。
   - 维护材料：读取对应的教材、笔记或来源规范，只处理本次要求涉及的范围。

## 材料存放位置

用户指定或项目已有的目录约定优先；新建课程默认采用以下布局，路径均相对于课程根目录。

| 内容 | 默认位置 | 对应规范 |
| --- | --- | --- |
| 大纲、HTML 教材及共用样式、图示等资源 | `.learning/lessons/`，共享资源放在其 `assets/` 子目录 | [HTML 教材规范](references/html-lessons.md) |
| Markdown 笔记 | `.learning/notes/` | [Markdown 笔记规范](references/markdown-notes.md) |
| 资料来源记录 | `.learning/resources/` | [课程调研规范](references/source-policy.md)、[来源记录要求](references/html-lessons.md#来源) |
| 阶段代码项目、授课、反馈与接管 | `projects/<阶段名>/` | [教学工作流程](references/learning-workflow.md) |
