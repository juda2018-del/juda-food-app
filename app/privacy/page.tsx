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
        <p>
          تشرح هذه السياسة كيف يجمع تطبيق FUSE Iraq بياناتك ويعالجها عند طلب الطعام والتوصيل داخل بغداد.
          باستخدامك التطبيق أو الموقع <span dir="ltr">https://www.fuseiraq.com</span> فإنك توافق على هذه السياسة.
        </p>

        <h2>1. من نحن</h2>
        <p>
          FUSE منصة طلب وتوصيل طعام. نتواصل معك عبر الدعم على{" "}
          <b dir="ltr">fuseiraq@gmail.com</b> أو صفحة{" "}
          <Link href="/support">الدعم</Link>.
        </p>

        <h2>2. البيانات التي نجمعها</h2>
        <p>قد نجمع ونعالج:</p>
        <ul>
          <li>بيانات الحساب: الاسم، البريد الإلكتروني، رقم الهاتف، ومعرّف المستخدم.</li>
          <li>بيانات الطلب: عنوان التوصيل، تفاصيل الأصناف، المبالغ، وحالة الطلب.</li>
          <li>بيانات الموقع عند تفعيلها لتحديد عنوان التوصيل أو تتبع التوصيل.</li>
          <li>محتوى الدعم وطلبات حذف الحساب.</li>
          <li>بيانات تقنية أساسية لتشغيل الجلسة والأمان (مثل حالة تسجيل الدخول).</li>
        </ul>

        <h2>3. كيف نستخدم البيانات</h2>
        <p>
          نستخدم البيانات لتسجيل الدخول، عرض المطاعم والقوائم، إنشاء الطلبات وتتبعها، إشعار المطعم والسائق،
          معالجة التقييمات وطلبات الانضمام، وتحسين الخدمة ومنع الإساءة. الدفع الحالي نقد عند الاستلام ما لم يُعلن خلاف ذلك.
        </p>

        <h2>4. مع من نشارك البيانات</h2>
        <p>
          نشارك الحد الأدنى اللازم لتنفيذ الطلب مع المطعم والسائق المرتبطين بالطلب، ومع مزوّدي البنية التحتية
          (مثل الاستضافة وFirebase) لتشغيل التطبيق. لا نبيع بياناتك الشخصية.
        </p>

        <h2>5. الاحتفاظ والحذف</h2>
        <p>
          نحتفظ ببيانات الحساب والطلبات طالما الحساب نشط أو للمدة اللازمة للتشغيل والامتثال والمنازعات.
          يمكنك طلب حذف الحساب من{" "}
          <Link href="/data-deletion">صفحة حذف البيانات</Link>. بعد التحقق تراجع الإدارة الطلب وتنفّذه وفق السياسة التشغيلية.
        </p>

        <h2>6. الأمان وحقوقك</h2>
        <p>
          نطبق ضوابط وصول حسب الدور (زبون / مطعم / سائق / إدارة) عبر المصادقة وقواعد Firestore.
          يمكنك طلب تصحيح بياناتك أو حذف حسابك عبر الدعم أو صفحة الحذف. لا نستخدم التتبع الإعلاني عبر الطرف الثالث في التطبيق حالياً.
        </p>

        <h2>7. الأطفال والتحديثات</h2>
        <p>
          الخدمة مخصّصة للاستخدام العام وليست موجّهة للأطفال دون سن مناسب لاستخدام خدمات التوصيل.
          قد نحدّث هذه السياسة؛ النسخة الحالية تُنشر على هذه الصفحة مع استمرار توفر الروابط القانونية من داخل التطبيق.
        </p>

        <h2>8. التواصل</h2>
        <p>
          لأي سؤال حول الخصوصية أو البيانات: <b dir="ltr">fuseiraq@gmail.com</b>
        </p>

        <div className="links-row">
          <Link href="/support" className="btn-primary">الدعم</Link>
          <FuseSecondaryButton href="/terms">الشروط</FuseSecondaryButton>
          <FuseSecondaryButton href="/data-deletion">حذف الحساب</FuseSecondaryButton>
        </div>
      </FuseCard>
    </CustomerPageShell>
  );
}
