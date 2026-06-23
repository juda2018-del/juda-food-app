 "use client";

import Link from "next/link";

const stats = [
  { title: "طلبات اليوم", value: "128", sub: "+18%", icon: "📦" },
  { title: "مبيعات اليوم", value: "1,850,000", sub: "د.ع", icon: "💰" },
  { title: "المطاعم", value: "12", sub: "نشطة", icon: "🍽️" },
  { title: "السائقين", value: "34", sub: "متاحين", icon: "🛵" },
];

const sections = [
  { title: "الطلبات المباشرة", desc: "متابعة الطلبات الحالية", href: "/live-orders", icon: "📦" },
  { title: "لوحة المطعم", desc: "جهاز طلبات المطاعم", href: "/restaurant-admin", icon: "🍽️" },
  { title: "الإشعارات", desc: "تنبيهات النظام", href: "/notifications", icon: "🔔" },
  { title: "التقييمات", desc: "آراء الزبائن", href: "/ratings", icon: "⭐" },
  { title: "تتبع الطلب", desc: "حالة الطلب والسائق", href: "/order-status", icon: "📍" },
  { title: "الدعم", desc: "خدمة العملاء", href: "/support", icon: "🎧" },
];

export default function CEODashboardPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box}
        body{margin:0;background:#efe8df;font-family:"Cairo",sans-serif}
        .app{max-width:430px;min-height:100vh;margin:0 auto;padding:18px;background:linear-gradient(180deg,#fffaf4,#fff);direction:rtl;color:#151515}
        .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
        .back{width:44px;height:44px;border-radius:16px;background:white;color:#151515;text-decoration:none;display:grid;place-items:center;font-size:26px;font-weight:900;box-shadow:0 12px 28px rgba(0,0,0,.07)}
        .title{text-align:center}.title h1{margin:0;font-size:26px;font-weight:900}.title p{margin:4px 0 0;color:#888;font-size:13px;font-weight:800}
        .hero{border-radius:30px;padding:22px;color:white;background:linear-gradient(135deg,#151515,#ff4d00);box-shadow:0 18px 42px rgba(0,0,0,.18);margin-bottom:16px}
        .hero h2{margin:0;font-size:25px;font-weight:900}.hero p{margin:8px 0 0;color:#eee;font-size:13px;font-weight:800;line-height:1.8}
        .stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}
        .stat{background:white;border-radius:24px;padding:14px;box-shadow:0 12px 30px rgba(0,0,0,.07)}
        .stat .icon{font-size:25px}.stat p{margin:6px 0 0;color:#888;font-size:12px;font-weight:800}.stat b{display:block;margin-top:4px;font-size:22px;font-weight:900;color:#151515}.stat span{color:#ff4d00;font-size:12px;font-weight:900}
        .section-title{display:flex;justify-content:space-between;align-items:center;margin:8px 0 13px}
        .section-title h2{margin:0;font-size:21px;font-weight:900}.section-title span{color:#ff4d00;font-size:12px;font-weight:900}
        .grid{display:flex;flex-direction:column;gap:12px}
        .card{background:white;border-radius:24px;padding:15px;text-decoration:none;color:#151515;display:flex;justify-content:space-between;align-items:center;box-shadow:0 12px 30px rgba(0,0,0,.07)}
        .left{display:flex;align-items:center;gap:12px}.card-icon{width:52px;height:52px;border-radius:18px;background:#fff3e9;display:grid;place-items:center;font-size:25px}
        .card h3{margin:0;font-size:17px;font-weight:900}.card p{margin:3px 0 0;color:#888;font-size:12px;font-weight:800}.arrow{color:#ff4d00;font-size:22px;font-weight:900}
      `}</style>

      <main className="app">
        <header className="top">
          <Link href="/" className="back">‹</Link>
          <div className="title">
            <h1>لوحة CEO</h1>
            <p>إدارة FUSE بالكامل</p>
          </div>
          <div style={{ width: 44 }} />
        </header>

        <section className="hero">
          <h2>FUSE Command Center</h2>
          <p>نظرة مباشرة على الطلبات، المبيعات، المطاعم، السائقين والتقييمات.</p>
        </section>

        <section className="stats">
          {stats.map((s) => (
            <div className="stat" key={s.title}>
              <div className="icon">{s.icon}</div>
              <p>{s.title}</p>
              <b>{s.value}</b>
              <span>{s.sub}</span>
            </div>
          ))}
        </section>

        <div className="section-title">
          <h2>أقسام الإدارة</h2>
          <span>FUSE</span>
        </div>

        <section className="grid">
          {sections.map((item) => (
            <Link href={item.href} className="card" key={item.title}>
              <div className="left">
                <div className="card-icon">{item.icon}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
              <div className="arrow">‹</div>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}