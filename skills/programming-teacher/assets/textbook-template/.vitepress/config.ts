// programming-teacher 6.1.0 — VitePress 教材配置。
import { defineConfig } from 'vitepress'
import { course } from './course'

export default defineConfig({
  lang: 'zh-CN',
  title: course.title,
  description: course.description,
  cleanUrls: true,
  lastUpdated: false,
  themeConfig: {
    siteTitle: course.title,
    nav: [
      { text: '课程总览', link: '/' },
      { text: '开始阅读', link: '/basics/01-variables' }
    ],
    sidebar: course.sidebar,
    outline: { level: [2, 3], label: '本页内容' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    sidebarMenuLabel: '章节目录',
    returnToTopLabel: '回到顶部',
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '使用浅色主题',
    darkModeSwitchTitle: '使用深色主题',
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: '搜索教材', buttonAriaLabel: '搜索教材' },
              modal: {
                displayDetails: '显示详细列表',
                resetButtonTitle: '清除搜索',
                backButtonTitle: '返回',
                noResultsText: '没有找到相关内容',
                footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
              }
            }
          }
        }
      }
    }
  },
  markdown: { lineNumbers: false }
})
