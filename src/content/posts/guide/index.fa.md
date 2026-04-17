---
title: راهنماهای ساده برای Tadawi Life Tech
published: 2024-04-01
description: "اینکه Tadawi Life Tech چگونه از این سایت استفاده و آن را سفارشی می‌کند."
image: "/uploads/posts/guide-cover.jpeg"
tags: ["Tadawi Life Tech", "وبلاگ", "سفارشی‌سازی"]
category: راهنماها
lang: fa
translationKey: guide
draft: false
---

> منبع تصویر کاور: [Source](https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/208fc754-890d-4adb-9753-2c963332675d/width=2048/01651-1456859105-(colour_1.5),girl,_Blue,yellow,green,cyan,purple,red,pink,_best,8k,UHD,masterpiece,male%20focus,%201boy,gloves,%20ponytail,%20long%20hair,.jpeg)

این قالب وبلاگ با [Astro](https://astro.build/) ساخته شده است. اگر چیزی در این راهنما نیامده، معمولاً پاسخ آن را در [مستندات Astro](https://docs.astro.build/) پیدا می‌کنید.

## فرانت‌متر پست‌ها

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

| ویژگی | توضیح |
|-------|-------|
| `title` | عنوان پست |
| `published` | تاریخ انتشار |
| `description` | توضیح کوتاه برای نمایش در لیست |
| `image` | مسیر تصویر کاور |
| `tags` | برچسب‌های پست |
| `category` | دسته‌بندی پست |
| `draft` | مشخص می‌کند پست پیش‌نویس است یا نه |

## محل قرارگیری فایل‌های پست

فایل‌های پست را داخل `src/content/posts/` قرار دهید. برای نظم بهتر می‌توانید زیرپوشه هم بسازید.

```text
src/content/posts/
├── post-1.md
└── post-2/
    ├── cover.png
    └── index.md
```