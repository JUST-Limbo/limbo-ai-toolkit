<script setup lang="ts">
// programming-teacher 6.1.0 — <Answer>答案正文</Answer>；默认展开，可由读者手动收起。
withDefaults(defineProps<{ title?: string }>(), { title: '参考答案' })
</script>

<template>
  <details class="textbook-answer" open>
    <summary>{{ title }}</summary>
    <div class="textbook-answer-body"><slot /></div>
  </details>
</template>
