---
title: مزايا Markdown المتقدمة
published: 2024-05-01
updated: 2024-11-29
description: 'اقرأ المزيد عن مزايا Markdown في Tadawi Life Tech'
image: ''
tags: [عرض, مثال, ماركداون, "Tadawi Life Tech"]
category: 'أمثلة'
lang: ar
translationKey: markdown-extended
draft: false
---

## بطاقات مستودعات GitHub

يمكنك إضافة بطاقات ديناميكية تربط بمستودعات GitHub، ويتم جلب معلومات المستودع من واجهة GitHub API عند تحميل الصفحة.

::github{repo="Fabrizz/MMM-OnSpotify"}

أنشئ بطاقة مستودع باستخدام الكود `::github{repo="<owner>/<repo>"}`.

```markdown
::github{repo="tadawilifetech/tadawilifetech.github.io"}
```

## التنبيهات

الأنواع المدعومة هي: `note` و`tip` و`important` و`warning` و`caution`.

:::note
يعرض معلومات مهمة ينبغي أخذها بعين الاعتبار حتى عند القراءة السريعة.
:::

:::tip
معلومة اختيارية تساعد المستخدم على النجاح أكثر.
:::

:::important
معلومة أساسية يجب معرفتها لإتمام المهمة بنجاح.
:::

:::warning
محتوى حساس يتطلب الانتباه الفوري بسبب مخاطر محتملة.
:::

:::caution
يعرض عواقب سلبية محتملة لفعل معيّن.
:::

### عناوين مخصصة

يمكن تخصيص عنوان صندوق التنبيه.

:::note[عنوان مخصص]
هذه ملاحظة بعنوان مخصص.
:::

### إخفاء النص

يمكنك استخدام spoiler داخل النص، كما يدعم تنسيق **Markdown** أيضاً.

المحتوى :spoiler[مخفي **هنا**]!