---
title: نمونه Expressive Code
published: 2024-04-10
description: ظاهر بلوک‌های کد در Markdown با استفاده از Expressive Code.
tags: [مارک‌داون, وبلاگ, نمونه]
category: نمونه‌ها
lang: fa
translationKey: expressive-code
draft: false
---

در این مطلب ظاهر بلوک‌های کد با [Expressive Code](https://expressive-code.com/) را مرور می‌کنیم. نمونه‌های کد اصلی حفظ شده‌اند و توضیح‌ها به فارسی ارائه شده‌اند.

## Expressive Code

### هایلایت سینتکس

```js
console.log('This code is syntax highlighted!')
```

### فریم‌های ادیتور و ترمینال

```js title="my-test-file.js"
console.log('Title attribute example')
```

```bash
echo "This terminal frame has no title"
```

### نشانه‌گذاری خط و متن

```js {1, 4, 7-8}
// Line 1 - targeted by line number
// Line 2
// Line 3
// Line 4 - targeted by line number
// Line 5
// Line 6
// Line 7 - targeted by range "7-8"
// Line 8 - targeted by range "7-8"
```

```diff lang="js"
  function thisIsJavaScript() {
    // This entire block gets highlighted as JavaScript,
    // and we can still add diff markers to it!
-   console.log('Old code to be removed')
+   console.log('New and shiny code!')
  }
```

### شکستن خطوط طولانی

```js wrap
function getLongString() {
  return 'This is a very long string that will most probably not fit into the available space unless the container is extremely wide'
}
```

### بخش‌های تاشو

```js collapse={1-5, 12-14, 21-24}
// All this boilerplate setup code will be collapsed
import { someBoilerplateEngine } from '@example/some-boilerplate'
import { evenMoreBoilerplate } from '@example/even-more-boilerplate'

const engine = someBoilerplateEngine(evenMoreBoilerplate())

engine.doSomething(1, 2, 3, calcFn)

function calcFn() {
  const a = 1
  const b = 2
  const c = a + b
  console.log(`Calculation result: ${a} + ${b} = ${c}`)
  return c
}
```

### شماره خطوط

```js showLineNumbers
console.log('Greetings from line 2!')
console.log('I am on line 3')
```