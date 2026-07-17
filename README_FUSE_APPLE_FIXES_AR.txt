تحديث FUSE لإعادة إرسال أبل

هذا التحديث يعالج رفض Apple:

1. إصلاح السلة:
- زر + في الصفحة الرئيسية صار يضيف للسلة فعلياً.
- زر إضافة للسلة داخل صفحات المطاعم صار يخزن بالسلة الموحدة.
- صفحة /cart صارت تقرأ السلة الحقيقية، تعدل الكميات، تفرغ السلة، وترسل الطلب.

2. إصلاح تسجيل الخروج:
- زر تسجيل الخروج في /profile صار يشتغل فعلياً.
- زر خروج الصفحة الرئيسية صار ظاهر ويقوم بتنظيف جلسة Firebase والجلسات القديمة.

3. دعم Apple Guideline 1.5:
- أضفنا صفحة دعم رسمية /support.
- أضفنا صفحة خصوصية /privacy.
- لازم تغيّر Support URL في App Store Connect إلى:
  https://www.fuseiraq.com/support

4. إصلاحات إضافية:
- أضفنا صفحة /restaurants حتى روابط المطاعم/استكشف ما تفتح صفحة ناقصة.
- أزرار عامة بالواجهة صارت لديها روابط أو أفعال واضحة.
- next.config.js صار output export حتى يبني out المناسب لـ Capacitor.

قبل إعادة الإرسال:
1. ارفع هذا الكود إلى GitHub.
2. انتظر Vercel يكمل النشر.
3. افتح https://www.fuseiraq.com/support وتأكد تفتح.
4. افتح https://www.fuseiraq.com/privacy وتأكد تفتح.
5. ابنِ iOS build جديد من Codemagic.
6. في App Store Connect غيّر Support URL إلى /support.
7. الصق ملاحظات المراجعة الموجودة داخل APPLE_REVIEW_NOTES_FUSE.txt.
