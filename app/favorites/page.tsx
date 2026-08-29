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
        :global(body){margin:0;background:#f4efe6;font-family:var(--fuse-body-font);color:#15171a}
        .app{width:100%;max-width:430px;min-height:100dvh;margin:auto;padding:calc(14px + env(safe-area-inset-top)) 16px calc(104px + env(safe-area-inset-bottom));background:transparent}
        .top{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding:8px 10px;border-radius:28px;background:rgba(255,252,247,.82);border:1px solid rgba(255,255,255,.95);box-shadow:0 10px 28px rgba(21,23,26,.08);backdrop-filter:blur(22px) saturate(145%)}
        .back,.space{width:46px;height:46px}.back{display:grid;place-items:center;border-radius:50%;background:rgba(255,252,247,.92);color:#1f7a4f;text-decoration:none;font-size:26px;font-weight:900;box-shadow:0 8px 22px rgba(21,23,26,.06);border:1px solid rgba(21,23,26,.08)}
        .title{text-align:center}.title h1{margin:0;font-size:24px;font-weight:950;font-family:var(--fuse-title-font)}.title p{margin:4px 0 0;color:#6f7175;font-size:12px;font-weight:800}
        .hero{margin-top:48px;text-align:center;border-radius:22px;padding:34px 24px;background:rgba(255,252,247,.82);border:1px solid rgba(255,255,255,.92);box-shadow:0 10px 28px rgba(21,23,26,.08);backdrop-filter:blur(22px) saturate(145%)}
        .heart{width:86px;height:86px;margin:auto;display:grid;place-items:center;border-radius:50%;background:rgba(31,122,79,.12);color:#1f7a4f;font-size:50px}
        h2{margin:20px 0 8px;font-size:24px}p{margin:0;color:#6f7175;line-height:1.9;font-size:13px;font-weight:700}
        .hero a{display:inline-flex;margin-top:22px;padding:14px 22px;border-radius:18px;background:linear-gradient(135deg,#1f7a4f,#2f915f);color:#fff;text-decoration:none;font-weight:950;box-shadow:0 12px 28px rgba(31,122,79,.22)}
      `}</style>
    </main>
  );
}
