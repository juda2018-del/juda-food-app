import Link from "next/link";
import CustomerHeader from "@/components/customer/CustomerHeader";
import CustomerPageShell from "@/components/customer/CustomerPageShell";
import { FuseCard, FuseSecondaryButton } from "@/components/customer/FuseCards";

export const metadata = {
  title: "FUSE Iraq Privacy Policy",
  description: "Privacy policy for FUSE Iraq food delivery app.",
};

export default function PrivacyPage() {
  return (
    <CustomerPageShell variant="legal">
      <CustomerHeader title="سياسة الخصوصية" subtitle="FUSE Iraq" backHref="/profile" />
      <FuseCard className="legal-card">
        <p>نستخدم بيانات الحساب والطلب ورقم الهاتف والعنوان فقط لتشغيل خدمة الطلب والتوصيل وتحسين تجربة المستخدم.</p>
        <h2>البيانات التي قد نستخدمها</h2>
        <p>الاسم، رقم الهاتف، عنوان التوصيل، تفاصيل الطلب، حالة الطلب، ومعلومات التواصل مع الدعم.</p>
        <h2>الغرض من الاستخدام</h2>
        <p>تجهيز الطلبات، إرسالها للمطاعم والسائقين، تتبع حالة الطلب، معالجة الشكاوى، وتحسين الخدمة.</p>
        <h2>التواصل</h2>
        <p>
          لأي سؤال حول الخصوصية أو حذف البيانات، راسلنا على: <b dir="ltr">fuseiraq@gmail.com</b>
        </p>
        <div className="links-row">
          <Link href="/support" className="btn-primary">الدعم</Link>
          <FuseSecondaryButton href="/terms">الشروط</FuseSecondaryButton>
        </div>
      </FuseCard>
    </CustomerPageShell>
  );
}
