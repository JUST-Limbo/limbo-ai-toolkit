---
title: 变量与表达式
---

<span class="lesson-kicker">语言基础 / 01</span>

# 变量与表达式

<p class="lesson-lead">用变量保存数据，用表达式描述计算。读代码时，先分清每个名称代表什么，再追踪结果如何产生。</p>

<div class="lesson-meta">
  <span><strong>先修</strong>无</span>
  <span><strong>目标</strong>理解声明、赋值和计算结果</span>
</div>

## 为数据命名

```js
const price = 20;
let quantity = 3;

console.log(price * quantity); // 60
quantity = 4;
console.log(price * quantity); // 80
```

`price` 保存单价，`quantity` 保存数量。`const` 声明的绑定不能重新赋值，`let` 声明的变量可以重新赋值。更新数量后，下一次乘法使用更新后的值。

## 表达式与结果

`price * quantity` 是表达式，执行后产生一个值。可以直接打印这个值，也可以为结果命名：

```js
const unitPrice = 20;
const count = 3;
const total = unitPrice * count;
console.log(total); // 60
```

这里的 `total` 保存计算得到的数值，并不会随着其他变量的变化而自动重算。

## 理解检查

下面代码最后打印什么？

```js
let count = 2;
const total = count * 10;
count = 3;
console.log(total);
```

<Answer>

打印 `20`。声明 `total` 时表达式已经完成计算，后续修改 `count` 不会重新执行之前的乘法。

</Answer>
