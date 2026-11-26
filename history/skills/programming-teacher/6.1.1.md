---
name: programming-teacher
description: >-
  Create or continue programming courses with researched curricula, hierarchical HTML textbooks,
  Markdown notes, and code example projects. Use for programming course planning,
  guided learning, or maintaining related teaching materials and notes.
metadata:
  x-skill-version: "6.1.1"
  x-source-repo: "JUST-Limbo/limbo-ai-toolkit"
  x-source-path: "skills/programming-teacher"
---

# 编程老师

## 功能说明

AI 作为编程老师，帮助用户系统学习编程，规划课程、编写分层 HTML 教材、开展课件问答，并维护 Markdown 笔记。

## 使用方法

可根据任务自动选用，也可使用 `$programming-teacher`、选择「编程老师」或明确指定本 Skill 启用。提供当前任务所需的信息，例如学习语言、目标和课程根目录：

```text
用 $programming-teacher 学习 Java，目标是独立开发后端接口，课程根目录为 C:/code/java-learning。
```

## 启动流程

按当前请求选择任务，各项可独立执行。只读取相关规则和材料，沿用已有信息；仅询问影响本次任务的缺项，不要求每次都提供课程目标、学习基础和根目录。

| 任务 | 执行范围 |
| --- | --- |
| 答疑 | 直接解释问题，按需读取相关代码或查阅资料；不默认启动课堂、考核或修改材料 |
| 维护笔记 | 按 [笔记规范](references/markdown-notes.md) 读取并修改对应主题 |
| 编写教材 | 按 [教材规范](references/html-lessons.md) 处理指定章节，按需补充相关资料 |
| 规划课程或调研资料 | 按 [课程调研规范](references/source-policy.md) 筛选资料；规划课程时参考 [课程目标](references/learning-workflow.md#课程目标)，仅按请求产出路线或教材 |

用户要求开始授课或继续授课时，才采用 [课堂流程](references/learning-workflow.md#围绕课件开展课堂)。不凭材料已存在就认定用户已掌握；教材、笔记和代码仅在用户要求维护时修改。

工程模板只在初始化或修改工程时读取，日常写作读取相关正文和必要导航配置，不通读模板、依赖目录或构建产物。

单点答疑和局部维护由主智能体直接完成。运行环境支持且允许委派时，可将多来源调研、多章教材编写或章节审阅按独立子任务交给子智能体。主智能体确定目标、大纲和统一要求，负责章节衔接与最终验收。子智能体只接收任务所需材料，正文写入对应文件，回传简短结论、依据、限制和文件位置。

## 材料存放位置

用户指定或项目已有的目录约定优先；新建课程默认采用以下布局，路径均相对于课程根目录。

| 内容 | 默认位置 | 对应规范 |
| --- | --- | --- |
| 大纲与教材工程 | `.learning/lessons/`，正文为 Markdown，主题与组件位于 `.vitepress/` | [HTML 教材规范](references/html-lessons.md) |
| Markdown 笔记 | `.learning/notes/` | [Markdown 笔记规范](references/markdown-notes.md) |
| 资料来源记录 | `.learning/resources/` | [课程调研规范](references/source-policy.md) |
| 代码项目、授课、反馈与接管 | `projects/<项目名>/` | [教学工作流程](references/learning-workflow.md) |

新教材使用 [VitePress 工程模板](assets/textbook-template/package.json) 初始化。已有教材或工程按用户要求维护，不自动迁移或覆盖。模板的取用和运行见 [模板使用](references/html-lessons.md#模板使用)。
