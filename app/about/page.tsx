import Link from "next/link";
import CustomerHeader from "@/components/customer/CustomerHeader";
import CustomerPageShell from "@/components/customer/CustomerPageShell";
import { FuseCard, FusePrimaryButton, FuseSecondaryButton } from "@/components/customer/FuseCards";
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
    <CustomerPageShell>
      <CustomerHeader title="حول FUSE" subtitle="منصة طلب وتوصيل عراقية" backHref="/profile" />

      <section className="hero">
        <div className="empty-icon">
          <FuseIcon name="store" size="lg" />
        </div>
        <h2>FUSE Iraq</h2>
        <p>تطبيق يجمع الزبائن والمطاعم والسائقين في تجربة طلب واحدة، مع متابعة واضحة للطلب من لحظة الإرسال إلى التسليم.</p>
      </section>

      <FuseCard className="feature-list">
        <h2>شنو يوفر FUSE؟</h2>
        {features.map((item) => (
          <div className="feature-item" key={item}>
            <span className="check-icon"><FuseIcon name="check" size="sm" /></span>
            <span>{item}</span>
          </div>
        ))}
      </FuseCard>

      <FuseCard>
        <h2 style={{ margin: "0 0 8px", fontSize: 17 }}>الدعم والخصوصية</h2>
        <p style={{ margin: 0, color: "var(--fuse-muted)", lineHeight: 1.8, fontSize: 13 }}>
          تواصل مع الدعم بخصوص حسابك أو طلباتك، وراجع سياسة الخصوصية وشروط الاستخدام من الروابط أدناه.
        </p>
        <div className="links-row">
          <FusePrimaryButton href="/support">الدعم</FusePrimaryButton>
          <FuseSecondaryButton href="/privacy">الخصوصية</FuseSecondaryButton>
          <FuseSecondaryButton href="/terms">الشروط</FuseSecondaryButton>
        </div>
      </FuseCard>
    </CustomerPageShell>
  );
}
