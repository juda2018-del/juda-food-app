import Link from "next/link";
import FuseIcon from "@/components/FuseIcon";

const features = [
  "تصفح المطاعم والقوائم المتاحة فعلياً.",
  "طلب آمن مرتبط بحساب الزبون.",
  "متابعة حالة الطلب والتقييم بعد التسليم.",
  "بوابات منفصلة للمطاعم والسائقين والإدارة.",
  "طلبات انضمام رسمية للمطاعم والسائقين.",
];

export default function AboutPage() {
  return (
    <main dir="rtl" className="app">
      <header className="top customer-header">
        <Link href="/profile" className="back fuse-back-btn" aria-label="الرجوع">
          <FuseIcon name="chevron-back" />
        </Link>
        <div className="title">
          <h1>حول FUSE</h1>
          <p>منصة طلب وتوصيل عراقية</p>
        </div>
        <div className="space" aria-hidden="true" />
      </header>

      <section className="hero">
        <div className="empty-icon" style={{ width: 74, height: 74, borderRadius: 24, fontSize: 32, fontWeight: 900, marginBottom: 18 }}>
          F
        </div>
        <h2>FUSE Iraq</h2>
        <p>تطبيق يجمع الزبائن والمطاعم والسائقين في تجربة طلب واحدة، مع متابعة واضحة للطلب من لحظة الإرسال إلى التسليم.</p>
      </section>

      <section className="feature-list form-card">
        <h2>شنو يوفر FUSE؟</h2>
        {features.map((item) => (
          <div className="feature-item" key={item}>
            <span className="check-icon"><FuseIcon name="check" size="sm" /></span>
            <span>{item}</span>
          </div>
        ))}
      </section>

      <section className="notice form-card">
        <h2 style={{ margin: "0 0 8px", fontSize: 17 }}>الدعم والخصوصية</h2>
        <p style={{ margin: 0, color: "var(--ref-muted)", lineHeight: 1.8, fontSize: 13 }}>
          تواصل مع الدعم بخصوص حسابك أو طلباتك، وراجع سياسة الخصوصية وشروط الاستخدام من الروابط أدناه.
        </p>
        <div className="links-row">
          <Link href="/support" className="btn-primary">الدعم</Link>
          <Link href="/privacy" className="btn-secondary">الخصوصية</Link>
          <Link href="/terms" className="btn-secondary">الشروط</Link>
        </div>
      </section>
    </main>
  );
}
