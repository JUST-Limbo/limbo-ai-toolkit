---
title: 函数与返回值
---

<span class="lesson-kicker">语言基础 / 02</span>

# 函数与返回值

<p class="lesson-lead">函数把一组操作组织为可重复调用的行为。通过参数传入数据，通过返回值取得结果。</p>

<div class="lesson-meta">
  <span><strong>先修</strong>变量、表达式与条件判断</span>
  <span><strong>目标</strong>读懂调用过程与返回结果</span>
</div>

## 定义与调用

计算商品总价需要单价和数量。将计算过程写成函数，同一种计算就能用于不同商品。

```js
function calculateTotal(price, quantity) {
  return price * quantity;
}

const total = calculateTotal(20, 3);
console.log(total); // 60
```

调用时，`20` 传给 `price`，`3` 传给 `quantity`。函数体完成乘法后，`return` 将 `60` 交给调用方。

<p class="reading-note">定义函数保存行为；调用函数才执行函数体。同一个函数可以接收不同输入。</p>

## 参数如何进入函数

声明中的参数是**形参**，调用时提供的值是**实参**。普通位置参数按顺序对应。

| 调用 | `price` | `quantity` | 返回结果 |
| --- | --- | --- | --- |
| `calculateTotal(20, 3)` | `20` | `3` | `60` |
| `calculateTotal(12, 4)` | `12` | `4` | `48` |

### 缺少参数时的结果（了解即可）

```js
console.log(calculateTotal(20)); // NaN
```

未提供的 `quantity` 为 `undefined`，本例的乘法得到 `NaN`。这个函数要求调用方提供两个有效数字。

## 返回结果与打印结果

以下 `showTotal` 是独立示例：

```js
function showTotal(price, quantity) {
  console.log(price * quantity);
}

const result = showTotal(20, 3); // 打印 60
console.log(result); // undefined
```

`console.log` 显示信息，`return` 提供调用结果。函数没有返回总价时，调用结果为 `undefined`。调用方需要继续计算，应使用前面的 `calculateTotal`。

## 提前返回

下面是 `calculateTotal` 的另一个版本，独立于前面的示例：

```js
function calculateTotal(price, quantity) {
  if (quantity === 0) {
    return 0;
  }
  return price * quantity;
}
```

`return` 同时结束本次调用。数量为零时先返回 `0`，最后一行不再执行。

## 理解检查

### 预测结果

`calculateTotal(12, 4)` 的结果是什么？两个实参分别对应哪个形参？

<Answer>

结果是 `48`。`12` 对应 `price`，`4` 对应 `quantity`，函数返回它们的乘积。

</Answer>

### 解释行为

`showTotal` 已经打印了总价，为什么赋给 `result` 后仍得到 `undefined`？

<Answer>

打印与返回是两件事。`showTotal` 没有返回值，调用结果为 `undefined`。将函数体改为 `return price * quantity;`，调用方才能得到总价。

</Answer>

### 追踪执行顺序

调用提前返回版本的 `calculateTotal(20, 0)` 时，最后一行会执行吗？

<Answer>

不会。条件成立后执行 `return 0`，本次函数调用随即结束。

</Answer>

## 参考资料

[MDN：函数](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Functions)，可对照阅读函数声明、调用和返回值。
