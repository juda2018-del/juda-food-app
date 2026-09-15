/** Public closed-test recruitment copy for FUSE Iraq. No secrets. */

export const FUSE_CLOSED_TEST_URL =
  "https://play.google.com/apps/testing/com.fuseiraq.app";

export const FUSE_TESTER_FEEDBACK_EMAIL = "fuseiraq@gmail.com";

export const FUSE_WHATSAPP_INVITE = `نحتاج مستخدمين أندرويد حقيقيين لاختبار بيتا تطبيق FUSE Iraq (توصيل طعام في بغداد).

المطلوب:
• حساب Google حقيقي على جهاز أندرويد
• الانضمام للاختبار الرسمي من Google Play فقط
• استخدام التطبيق وإرسال ملاحظات صادقة
• البقاء منضمّاً للاختبار لمدة 14 يوماً بدون إلغاء الاشتراك

الرابط الرسمي:
${FUSE_CLOSED_TEST_URL}

مهم: نرفض الحسابات الوهمية أو التثبيت الاصطناعي. نريد مختبرين حقيقيين فقط.
ملاحظاتكم على: ${FUSE_TESTER_FEEDBACK_EMAIL}`;

export const FUSE_TELEGRAM_INVITE = `اختبار بيتا — FUSE Iraq

نبحث عن مختبرين أندرويد حقيقيين لتطبيق توصيل الطعام في بغداد.

1) افتح الرابط الرسمي من Google Play
2) انضم للاختبار بحساب Google الحقيقي
3) ثبّت FUSE واستخدمه
4) أرسل ملاحظات صادقة
5) ابقَ منضمّاً طوال فترة الاختبار (يفضّل 14 يوماً)

${FUSE_CLOSED_TEST_URL}

لا حسابات وهمية ولا تثبيت اصطناعي.`;

export const FUSE_REDDIT_ENGLISH_INVITE = `Looking for REAL Android users to beta-test FUSE Iraq (food delivery app for Baghdad).

What we need:
• A real Google account on a real Android phone
• Join only via the official Google Play closed-test link
• Use the app and send genuine feedback (bugs / UX notes)
• Stay opted in for 14 consecutive days (please don’t leave the test early)

Official link:
${FUSE_CLOSED_TEST_URL}

No fake accounts, no bots, no artificial installs. Real testers and real feedback only. Happy to reciprocal-test your closed-test app if you’re a fellow developer.

Feedback: ${FUSE_TESTER_FEEDBACK_EMAIL}`;

export const FUSE_RECRUIT_SOURCES = [
  {
    name: "Twelve Testers",
    url: "https://twelvetesters.com/",
    note: "منصة تبادل اختبار مغلق مجانية",
  },
  {
    name: "r/AndroidClosedTesting",
    url: "https://www.reddit.com/r/AndroidClosedTesting/",
    note: "مجتمع Reddit لتبادل اختبار Play",
  },
  {
    name: "r/TestMyApp",
    url: "https://www.reddit.com/r/TestMyApp/",
    note: "تبادل اختبارات تطبيقات",
  },
  {
    name: "TheClosedTest",
    url: "https://theclosedtest.neerajlovecyber.com/",
    note: "منصة تبادل مع إثبات تثبيت",
  },
  {
    name: "FeatureGate",
    url: "https://featuregate.de/",
    note: "منصة مختبرين حقيقيين للمطورين",
  },
  {
    name: "BetaPool",
    url: "https://betapool.app/",
    note: "مطابقة حملات اختبار مغلق",
  },
] as const;

export const FUSE_IRAQI_SOURCES_ASK_FIRST = [
  {
    name: "تجمع اندرويد العراق (Telegram)",
    url: "https://t.me/IAGGroup",
  },
  {
    name: "مجموعة النقاش",
    url: "https://t.me/IAGroup2",
  },
  {
    name: "فيسبوك تجمع اندرويد العراق",
    url: "https://www.facebook.com/android4iraq",
  },
] as const;
