---
title: قابلیت‌های پیشرفته Markdown
published: 2024-05-01
updated: 2024-11-29
description: 'بیشتر درباره قابلیت‌های Markdown در Tadawi Life Tech بخوانید'
image: ''
tags: [نمونه, مثال, مارک‌داون, "Tadawi Life Tech"]
category: 'نمونه‌ها'
lang: fa
translationKey: markdown-extended
draft: false
---

## کارت مخزن GitHub

می‌توانید کارت‌های پویا برای مخازن GitHub اضافه کنید. اطلاعات مخزن هنگام بارگذاری صفحه از GitHub API دریافت می‌شود.

::github{repo="Fabrizz/MMM-OnSpotify"}

برای ساخت کارت مخزن از این دستور استفاده کنید:

```markdown
::github{repo="tadawilifetech/tadawilifetech.github.io"}
```

## Admonitionها

نوع‌های پشتیبانی‌شده عبارت‌اند از: `note`، `tip`، `important`، `warning` و `caution`.

:::note
اطلاعاتی را نمایش می‌دهد که حتی در مرور سریع هم باید به آن توجه شود.
:::

:::tip
اطلاعات اختیاری برای موفق‌تر شدن کاربر.
:::

:::important
اطلاعات مهمی که برای انجام درست کار ضروری است.
:::

:::warning
محتوای حساس که به‌دلیل ریسک احتمالی نیاز به توجه فوری دارد.
:::

:::caution
پیامدهای منفی احتمالی یک اقدام را توضیح می‌دهد.
:::

### عنوان سفارشی

می‌توانید عنوان admonition را سفارشی کنید.

:::note[عنوان سفارشی]
این یک یادداشت با عنوان سفارشی است.
:::

### اسپویلر

می‌توانید از spoiler داخل متن استفاده کنید و **Markdown** هم درون آن پشتیبانی می‌شود.

محتوا :spoiler[اینجا **پنهان** است]!