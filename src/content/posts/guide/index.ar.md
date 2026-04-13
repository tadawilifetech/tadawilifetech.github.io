---
title: أدلة مبسطة لـ Tadawi Life Tech
published: 2024-04-01
description: "كيف يستخدم Tadawi Life Tech هذا الموقع ويخصصه."
image: "./cover.jpeg"
tags: ["Tadawi Life Tech", "تدوين", "تخصيص"]
category: أدلة
lang: ar
translationKey: guide
draft: false
---

> مصدر صورة الغلاف: [Source](https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/208fc754-890d-4adb-9753-2c963332675d/width=2048/01651-1456859105-(colour_1.5),girl,_Blue,yellow,green,cyan,purple,red,pink,_best,8k,UHD,masterpiece,male%20focus,%201boy,gloves,%20ponytail,%20long%20hair,.jpeg)

هذا القالب مبني باستخدام [Astro](https://astro.build/). وإذا لم تجد ما تحتاجه هنا، فغالباً ستجد الإجابة في [توثيق Astro](https://docs.astro.build/).

## الـ Front Matter للمقالات

```yaml
---
title: My First Blog Post
published: 2023-09-09
description: This is the first post of my new Astro blog.
image: ./cover.jpg
tags: [Foo, Bar]
category: Front-end
draft: false
---
```

| الخاصية | الوصف |
|---------|-------|
| `title` | عنوان المقال. |
| `published` | تاريخ النشر. |
| `description` | وصف مختصر للمقال. |
| `image` | مسار صورة الغلاف. |
| `tags` | وسوم المقال. |
| `category` | تصنيف المقال. |
| `draft` | يحدد ما إذا كان المقال مسودة أم لا. |

## مكان وضع ملفات المقالات

ضع ملفاتك داخل `src/content/posts/` ويمكنك إنشاء مجلدات فرعية لتنظيم المحتوى والأصول.

```text
src/content/posts/
├── post-1.md
└── post-2/
    ├── cover.png
    └── index.md
```