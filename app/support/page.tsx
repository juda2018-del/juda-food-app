import Link from "next/link";
import FuseIcon from "@/components/FuseIcon";

const topics: Array<[string, string]> = [
  ["مشاكل الطلبات", "مساعدة بخصوص الطلبات، الإلغاء، أو حالة الطلب."],
  ["الحساب وتسجيل الدخول", "حل مشاكل الدخول، الخروج، أو بيانات الحساب."],
  ["المطاعم", "مساعدة المطاعم في استقبال الطلبات وإدارة القائمة."],
  ["السائقين", "مساعدة السائقين بخصوص الطلبات والتوصيل."],
];

export default function SupportPage() {
  return (
    <main dir="rtl" className="app">
      <header className="top customer-header">
        <Link href="/profile" className="back fuse-back-btn" aria-label="الرجوع">
          <FuseIcon name="chevron-back" />
        </Link>
        <div className="title">
          <h1>المساعدة والدعم</h1>
          <p>فريق FUSE Iraq</p>
        </div>
        <div className="space" aria-hidden="true" />
      </header>

      <section className="hero">
        <h2>
          <span className="hero-icon-inline"><FuseIcon name="help" size="sm" /></span>
          مركز دعم FUSE Iraq
        </h2>
        <p>تواصل معنا بخصوص الطلبات، الحسابات، المطاعم، السائقين، والمشاكل التقنية.</p>
      </section>

      <section className="support-grid">
        <div className="support-tile form-card">
          <p>البريد الإلكتروني للدعم</p>
          <a href="mailto:fuseiraq@gmail.com">fuseiraq@gmail.com</a>
          <p style={{ marginTop: 10, fontSize: 12, lineHeight: 1.7 }}>أفضل طريقة للتواصل الرسمي والردود التفصيلية.</p>
        </div>
        <div className="support-tile form-card">
          <p>وقت الاستجابة المتوقع</p>
          <strong>خلال 24 - 48 ساعة</strong>
          <p style={{ marginTop: 10, fontSize: 12, lineHeight: 1.7 }}>يتم الرد على طلبات الدعم حسب أولوية المشكلة ونوعها.</p>
        </div>
      </section>

      <section className="feature-list form-card">
        {topics.map(([title, desc]) => (
          <div className="feature-item" key={title}>
            <span className="check-icon"><FuseIcon name="info" size="sm" /></span>
            <div><b>{title}</b><p style={{ margin: "4px 0 0", color: "var(--ref-muted)", fontSize: 12 }}>{desc}</p></div>
          </div>
        ))}
      </section>

      <section className="notice form-card">
        <b>المعلومات المطلوبة عند التواصل</b>
        <ul style={{ margin: "10px 0 0", paddingInlineStart: 18, lineHeight: 1.9, fontSize: 13, color: "var(--ref-muted)" }}>
          <li>اسم المستخدم أو البريد المرتبط بالحساب إذا متوفر.</li>
          <li>رقم الطلب إذا كانت المشكلة تخص طلباً معيّناً.</li>
          <li>شرح مختصر للمشكلة مع لقطة شاشة إن وجدت.</li>
          <li>نوع الجهاز المستخدم: iPhone أو iPad أو Android.</li>
        </ul>
      </section>

      <div className="links-row">
        <a href="mailto:fuseiraq@gmail.com" className="btn-primary">مراسلة الدعم</a>
        <Link href="/privacy" className="btn-secondary">سياسة الخصوصية</Link>
        <Link href="/" className="btn-secondary">الرئيسية</Link>
      </div>
    </main>
  );
}
