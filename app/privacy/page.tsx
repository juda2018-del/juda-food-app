import Link from "next/link";

export const metadata = {
  title: "FUSE Iraq Privacy Policy",
  description: "Privacy policy for FUSE Iraq food delivery app.",
};

export default function PrivacyPage() {
  return (
    <main dir="rtl" style={{ minHeight: "100vh", background: "#050505", color: "white", fontFamily: "Cairo, system-ui, sans-serif", padding: 24 }}>
      <section style={{ maxWidth: 920, margin: "0 auto", border: "1px solid rgba(255,255,255,.12)", borderRadius: 28, padding: 24, background: "rgba(255,255,255,.06)", lineHeight: 1.9 }}>
        <Link href="/support" style={{ color: "#FF7A00", textDecoration: "none", fontWeight: 900 }}>الدعم</Link>
        <h1>سياسة الخصوصية - FUSE Iraq</h1>
        <p>نستخدم بيانات الحساب والطلب ورقم الهاتف والعنوان فقط لتشغيل خدمة الطلب والتوصيل وتحسين تجربة المستخدم.</p>
        <h2>البيانات التي قد نستخدمها</h2>
        <p>الاسم، رقم الهاتف، عنوان التوصيل، تفاصيل الطلب، حالة الطلب، ومعلومات التواصل مع الدعم.</p>
        <h2>الغرض من الاستخدام</h2>
        <p>تجهيز الطلبات، إرسالها للمطاعم والسائقين، تتبع حالة الطلب، معالجة الشكاوى، وتحسين الخدمة.</p>
        <h2>التواصل</h2>
        <p>لأي سؤال حول الخصوصية أو حذف البيانات، راسلنا على: <b dir="ltr">fuseiraq@gmail.com</b></p>
      </section>
    </main>
  );
}
