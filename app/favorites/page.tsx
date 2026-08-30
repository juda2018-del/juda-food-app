"use client";

import CustomerHeader from "@/components/customer/CustomerHeader";
import CustomerPageShell from "@/components/customer/CustomerPageShell";
import { FusePrimaryButton } from "@/components/customer/FuseCards";
import FuseIcon from "@/components/FuseIcon";

export default function FavoritesPage() {
  return (
    <CustomerPageShell>
      <CustomerHeader title="المفضلة" subtitle="مطاعمك ووجباتك المحفوظة" backHref="/profile" />

      <section className="state form-card">
        <div className="empty-icon">
          <FuseIcon name="heart" size="lg" />
        </div>
        <h2>ما عندك مفضلة بعد</h2>
        <p>ميزة الحفظ ستظهر هنا بعد إضافة زر المفضلة إلى صفحات المطاعم والوجبات. حالياً ما نعرض أي بيانات تجريبية أو مطاعم وهمية.</p>
        <FusePrimaryButton href="/restaurants">تصفح المطاعم</FusePrimaryButton>
      </section>
    </CustomerPageShell>
  );
}
