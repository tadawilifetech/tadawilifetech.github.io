---
title: مثال على Expressive Code
published: 2024-04-10
description: كيف تبدو كتل الكود في Markdown باستخدام Expressive Code.
tags: [ماركداون, تدوين, عرض]
category: أمثلة
lang: ar
translationKey: expressive-code
draft: false
---

في هذا المقال نستعرض شكل كتل الكود باستخدام [Expressive Code](https://expressive-code.com/). أبقينا أمثلة الكود كما هي، وركزنا هنا على شرح الميزات الأساسية باللغة العربية.

## Expressive Code

### تلوين الشيفرة

```js
console.log('This code is syntax highlighted!')
```

### إطارات المحرر والطرفية

```js title="my-test-file.js"
console.log('Title attribute example')
```

```bash
echo "This terminal frame has no title"
```

### تمييز السطور والنصوص

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

### التفاف الأسطر

```js wrap
function getLongString() {
  return 'This is a very long string that will most probably not fit into the available space unless the container is extremely wide'
}
```

### الأقسام القابلة للطي

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

### أرقام الأسطر

```js showLineNumbers
console.log('Greetings from line 2!')
console.log('I am on line 3')
```