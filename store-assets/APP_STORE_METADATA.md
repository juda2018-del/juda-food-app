# App Store metadata — FUSE Iraq

Use these values in App Store Connect. Do not put live passwords in this file.

## Identity
- Name: FUSE
- Subtitle: توصيل الطعام في بغداد
- Bundle ID: com.fuseiraq.app
- Version: 1.0.2
- iOS build: 18 (Codemagic overwrites CURRENT_PROJECT_VERSION with BUILD_NUMBER)
- Category: Food & Drink
- Production URL: https://www.fuseiraq.com

## Promotional text (optional, ≤170)
اطلب من مطاعم بغداد، تتبّع طلبك، وادفع نقداً عند الاستلام مع FUSE.

## Description
FUSE تطبيق طلب وتوصيل الطعام في بغداد.

الميزات:
• مطاعم وقوائم حية
• سلة وطلب نقد عند الاستلام
• تتبع حالة الطلب
• تقييم بعد التسليم
• صفحات الخصوصية والشروط والدعم وحذف الحساب

الموقع: https://www.fuseiraq.com

## Keywords
طعام,توصيل,بغداد,مطاعم,طلب,فيوز,FUSE,delivery,food

## What’s New (1.0.2)
تحسينات الاستقرار والخصوصية ومسارات الطلب للتجهيز التجاري.

## URLs
- Privacy: https://www.fuseiraq.com/privacy
- Terms: https://www.fuseiraq.com/terms
- Support: https://www.fuseiraq.com/support
- Data deletion: https://www.fuseiraq.com/data-deletion
- Marketing: https://www.fuseiraq.com

## Review notes
Paste `store-assets/REVIEW_NOTES.md` into App Store Connect Review Information.
Put the reviewer username and password only in App Store Connect, not in git.

## Encryption
Info.plist sets `ITSAppUsesNonExemptEncryption` to false.
Privacy manifest: `ios/App/App/PrivacyInfo.xcprivacy`.

## App Check
Not enabled on production yet. Keep it off until a Capacitor-compatible test is complete.
