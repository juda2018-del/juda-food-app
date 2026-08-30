"use client";

import Link from "next/link";
import FuseIcon from "@/components/FuseIcon";

export default function FavoritesPage() {
  return (
    <main dir="rtl" className="app">
      <header className="top customer-header">
        <Link href="/profile" className="back fuse-back-btn" aria-label="الرجوع">
          <FuseIcon name="chevron-back" />
        </Link>
        <div className="title">
          <h1>المفضلة</h1>
          <p>مطاعمك ووجباتك المحفوظة</p>
        </div>
        <div className="space" aria-hidden="true" />
      </header>

      <section className="state form-card">
        <div className="empty-icon">
          <FuseIcon name="heart" size="lg" />
        </div>
        <h2>ما عندك مفضلة بعد</h2>
        <p>ميزة الحفظ ستظهر هنا بعد إضافة زر المفضلة إلى صفحات المطاعم والوجبات. حالياً ما نعرض أي بيانات تجريبية أو مطاعم وهمية.</p>
        <Link href="/restaurants" className="btn-primary">تصفح المطاعم</Link>
      </section>
    </main>
  );
}
