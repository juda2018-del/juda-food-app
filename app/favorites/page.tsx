"use client";

import Link from "next/link";

export default function FavoritesPage() {
  return (
    <main dir="rtl" className="app">
      <header className="top">
        <Link href="/profile" className="back" aria-label="الرجوع">‹</Link>
        <div className="title"><h1>المفضلة</h1><p>مطاعمك ووجباتك المحفوظة</p></div>
        <div className="space" />
      </header>

      <section className="hero">
        <div className="heart">♡</div>
        <h2>ما عندك مفضلة بعد</h2>
        <p>ميزة الحفظ ستظهر هنا بعد إضافة زر المفضلة إلى صفحات المطاعم والوجبات. حالياً ما نعرض أي بيانات تجريبية أو مطاعم وهمية.</p>
        <Link href="/restaurants">تصفح المطاعم</Link>
      </section>

      <style jsx>{`
        :global(*){box-sizing:border-box}
        :global(body){margin:0;background:#efe8df;font-family:Arial,"Cairo",sans-serif;color:#181818}
        .app{width:100%;max-width:430px;min-height:100dvh;margin:auto;padding:18px;background:linear-gradient(180deg,#fffaf4,#fff)}
        .top{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}
        .back,.space{width:44px;height:44px}.back{display:grid;place-items:center;border-radius:16px;background:#fff;color:#181818;text-decoration:none;font-size:28px;font-weight:900;box-shadow:0 10px 28px rgba(0,0,0,.08)}
        .title{text-align:center}.title h1{margin:0;font-size:28px;font-weight:950}.title p{margin:4px 0 0;color:#888;font-size:12px;font-weight:800}
        .hero{margin-top:70px;text-align:center;border-radius:30px;padding:34px 24px;background:#fff;box-shadow:0 18px 46px rgba(0,0,0,.08)}
        .heart{width:86px;height:86px;margin:auto;display:grid;place-items:center;border-radius:50%;background:#fff0e7;color:#ff4d00;font-size:50px}
        h2{margin:20px 0 8px;font-size:24px}p{margin:0;color:#777;line-height:1.9;font-size:13px;font-weight:700}
        .hero a{display:inline-flex;margin-top:22px;padding:14px 22px;border-radius:16px;background:#ff5a00;color:#fff;text-decoration:none;font-weight:950}
      `}</style>
    </main>
  );
}
