// programming-teacher 6.1.0 — 复用默认主题，只扩展教材样式和答案组件。
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Answer from './components/Answer.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Answer', Answer)
  }
} satisfies Theme
