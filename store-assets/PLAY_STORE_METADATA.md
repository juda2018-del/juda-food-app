# Play Store metadata — FUSE Iraq

Use these values in Play Console. Do not put signing secrets or live passwords in this file.

## Identity
- Name: FUSE
- Application ID: com.fuseiraq.app
- Version name: 1.0.2
- Version code: 14
- Category: Food & Drink
- Production URL: https://www.fuseiraq.com

## Short description (≤80 chars)
اطلب طعامك من مطاعم بغداد مع FUSE — توصيل سريع وتتبع مباشر.

## Full description
FUSE تطبيق طلب وتوصيل الطعام في بغداد.

ماذا يمكنك أن تفعل؟
• تصفّح المطاعم والقوائم المتاحة
• أضف الأصناف إلى السلة وأكّد الطلب نقداً عند الاستلام
• تتبّع حالة الطلب من المطعم حتى التسليم
• قيّم تجربتك بعد اكتمال الطلب
• اطلب حذف حسابك من داخل التطبيق أو عبر صفحة حذف البيانات

روابط مهمة:
الموقع: https://www.fuseiraq.com
الخصوصية: https://www.fuseiraq.com/privacy
الشروط: https://www.fuseiraq.com/terms
الدعم: https://www.fuseiraq.com/support
حذف البيانات: https://www.fuseiraq.com/data-deletion

## URLs
- Privacy: https://www.fuseiraq.com/privacy
- Terms: https://www.fuseiraq.com/terms
- Support: https://www.fuseiraq.com/support
- Data deletion: https://www.fuseiraq.com/data-deletion

## Signing
Release builds read the upload keystore from a local `android/app/keystore.properties` file or these environment variables:
- `FUSE_KEYSTORE_FILE`
- `FUSE_KEYSTORE_PASSWORD`
- `FUSE_KEY_ALIAS`
- `FUSE_KEY_PASSWORD`

Template: `android/keystore.properties.example` → copy to `android/app/keystore.properties` (gitignored).

The upload keystore is not stored in the repository. Play App Signing should stay enabled in Play Console so existing users can still receive updates.

`bundleRelease` / `assembleRelease` fail closed if signing is missing — this prevents shipping an unsigned AAB.

## Play upload-key rotation
If the previous upload keystore was ever in git, rotate the upload key in Play Console:
1. Open Play Console → the FUSE app → Setup → App signing.
2. Request upload key reset and follow Google’s current form.
3. Keep Play App Signing as-is. Do not replace the app signing key.
4. After Google accepts the new upload certificate, store the new keystore only in CI secrets / a local gitignored path.

## App Check
Not enabled on production yet. Keep off until a Capacitor-compatible path is verified.
