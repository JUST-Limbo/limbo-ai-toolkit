---
title: 作用域
---

<span class="lesson-kicker">语言基础 / 03</span>

# 作用域

<p class="lesson-lead">变量能在哪里使用，取决于它声明的位置。先确认代码所在范围，再查找变量声明。</p>

## 函数内部与外部

```js
const price = 20;

function calculateTotal(quantity) {
  const total = price * quantity;
  return total;
}

console.log(calculateTotal(3)); // 60
console.log(total); // ReferenceError
```

函数内部可以读取外部的 `price`，外部无法访问函数内部声明的 `total`。返回一个值，不等于将函数内的变量声明移到外部。

## 块内的变量

`let` 和 `const` 声明的变量也受到代码块范围限制：

```js
if (true) {
  const message = '已完成';
  console.log(message); // 已完成
}

console.log(message); // ReferenceError
```

## 理解检查

两个不同函数中都声明 `const total`，是否一定发生命名冲突？

<Answer>

不会。两个声明分别属于各自函数的作用域，可以使用相同名称。

</Answer>
