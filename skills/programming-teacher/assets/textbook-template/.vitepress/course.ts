// programming-teacher 6.1.0 — 示例课程；复制模板后在此维护课程名称与章节顺序。
import type { DefaultTheme } from 'vitepress'

export const course = {
  title: 'JavaScript 基础',
  description: '从代码的输入、执行过程与结果，理解 JavaScript 的基础概念。',
  sidebar: [
    { text: '课程总览', link: '/' },
    {
      text: '01 · 语言基础',
      items: [
        { text: '本章导读', link: '/basics/' },
        { text: '01 变量与表达式', link: '/basics/01-variables' },
        { text: '02 函数与返回值', link: '/basics/02-functions' },
        { text: '03 作用域', link: '/basics/03-scope' }
      ]
    }
  ] satisfies DefaultTheme.SidebarItem[]
}
