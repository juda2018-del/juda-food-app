"use client";

import Link from "next/link";
import { performFuseLogout } from "@/lib/fuse-logout";

const menu = [
  ["📦", "طلباتي", "تابع الطلبات الحالية والسابقة", "/order-status"],
  ["❤️", "المفضلة", "مطاعمك ووجباتك المحفوظة", "/favorites"],
  ["📍", "عناوين التوصيل", "إدارة عناوينك المحفوظة", "/addresses"],
  ["🎁", "العروض", "الخصومات المتاحة داخل FUSE", "/offers"],
  ["🚴", "انضم كسائق", "قدّم طلب انضمام لفريق التوصيل", "/driver-register"],
  ["🍔", "سجّل مطعمك", "أضف مطعمك إلى منصة FUSE", "/restaurant-register"],
  ["💬", "المساعدة والدعم", "تواصل ويا فريق FUSE", "/support"],
  ["ℹ️", "حول FUSE", "تعرف على التطبيق والخدمات", "/about"],
];

export default function ProfilePage() {
  async function handleLogout() {
    await performFuseLogout("/");
  }

  return (
    <main className="profile-shell" dir="rtl">
      <style>{`
        *{box-sizing:border-box} body{margin:0;background:#efe8df;font-family:Arial,"Cairo",sans-serif;color:#181818}
        .profile-shell{width:100%;max-width:430px;min-height:100dvh;margin:auto;background:linear-gradient(180deg,#fffaf4,#fff);padding:18px 16px 112px}
        .top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.brand{font-size:12px;font-weight:900;color:#ff4d00;background:#fff1e8;border:1px solid #ffd5c2;padding:8px 12px;border-radius:999px}
        .top-actions{display:flex;gap:8px}.icon-btn{width:44px;height:44px;border-radius:16px;background:#fff;display:grid;place-items:center;text-decoration:none;color:#181818;box-shadow:0 8px 24px rgba(0,0,0,.08);font-size:20px}
        .profile-card{background:#fff;border-radius:28px;padding:18px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 14px 34px rgba(0,0,0,.08)}.user{display:flex;align-items:center;gap:13px}.avatar{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:25px;font-weight:900;background:linear-gradient(135deg,#ff8a00,#ff3d00);box-shadow:0 10px 24px rgba(255,77,0,.25)}
        .user h1{font-size:19px;margin:0 0 5px;font-weight:900}.user p{margin:0;color:#777;font-size:12px;font-weight:700}.edit{padding:10px 12px;background:#fff3e9;border-radius:14px;text-decoration:none;color:#ff4d00;font-size:12px;font-weight:900}
        .notice{margin-top:16px;border-radius:24px;padding:17px;background:linear-gradient(135deg,#191919,#303030);color:#fff;box-shadow:0 16px 34px rgba(0,0,0,.16)}.notice h2{margin:0 0 7px;font-size:18px}.notice p{margin:0;color:rgba(255,255,255,.72);font-size:12px;line-height:1.7}.notice a{display:inline-flex;margin-top:12px;padding:10px 14px;border-radius:13px;background:#ff5a00;color:#fff;text-decoration:none;font-size:12px;font-weight:900}
        .section-title{font-size:15px;font-weight:900;margin:22px 3px 10px}.menu{background:#fff;border-radius:26px;padding:5px;box-shadow:0 12px 32px rgba(0,0,0,.06)}.item{min-height:66px;display:flex;align-items:center;justify-content:space-between;padding:9px 10px;text-decoration:none;color:#181818;border-bottom:1px solid #f1ece6}.item:last-child{border-bottom:0}.item-main{display:flex;align-items:center;gap:12px}.emoji{width:44px;height:44px;border-radius:16px;background:#fff5ec;display:grid;place-items:center;font-size:20px}.item h3{margin:0 0 3px;font-size:13px;font-weight:900}.item p{margin:0;color:#999;font-size:10px;font-weight:700}.arrow{font-size:24px;color:#bbb}
        .danger{margin-top:16px;background:#fff;border-radius:24px;padding:8px;box-shadow:0 12px 28px rgba(0,0,0,.05)}.logout,.delete{width:100%;height:52px;border:0;border-radius:16px;font-family:inherit;font-weight:900;font-size:13px;cursor:pointer}.logout{background:#fff3e9;color:#e65300}.delete{margin-top:8px;background:#fff1f2;color:#dc2626;text-decoration:none;display:grid;place-items:center}
        .bottom-nav{position:fixed;bottom:max(8px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:calc(100% - 24px);max-width:406px;height:72px;background:rgba(255,255,255,.98);border:1px solid rgba(0,0,0,.06);border-radius:24px;box-shadow:0 12px 35px rgba(0,0,0,.16);display:grid;grid-template-columns:repeat(5,1fr);padding:6px;z-index:99}.bottom-nav a{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:3px;text-decoration:none;color:#777;font-size:10px;font-weight:900;border-radius:17px}.bottom-nav a.active{color:#ff4d00;background:#fff3e9}.bottom-nav b{font-size:19px;line-height:1}
      `}</style>

      <header className="top">
        <span className="brand">FUSE العراق 🇮🇶</span>
        <div className="top-actions">
          <Link className="icon-btn" href="/notification-center" aria-label="الإشعارات">🔔</Link>
          <Link className="icon-btn" href="/settings" aria-label="الإعدادات">⚙️</Link>
        </div>
      </header>

      <section className="profile-card">
        <div className="user">
          <div className="avatar">F</div>
          <div><h1>حساب FUSE</h1><p>📍 بغداد، العراق</p></div>
        </div>
        <Link className="edit" href="/settings">تعديل</Link>
      </section>

      <section className="notice">
        <h2>كل طلباتك بمكان واحد</h2>
        <p>استخدم نفس رقم الهاتف عند الطلب حتى تتابع الحالة وتلقى طلباتك بسهولة.</p>
        <Link href="/order-status">فتح طلباتي</Link>
      </section>

      <h2 className="section-title">الخدمات</h2>
      <section className="menu">
        {menu.map(([icon,title,desc,href]) => (
          <Link key={title} href={href} className="item">
            <div className="item-main"><div className="emoji">{icon}</div><div><h3>{title}</h3><p>{desc}</p></div></div>
            <span className="arrow">‹</span>
          </Link>
        ))}
      </section>

      <section className="danger">
        <button className="logout" type="button" onClick={handleLogout}>تسجيل الخروج</button>
        <Link className="delete" href="/data-deletion">طلب حذف الحساب والبيانات</Link>
      </section>

      <nav className="bottom-nav">
        <Link href="/"><b>⌂</b><span>الرئيسية</span></Link>
        <Link href="/restaurants"><b>⌕</b><span>المطاعم</span></Link>
        <Link href="/reels"><b>▶</b><span>ريلز</span></Link>
        <Link href="/order-status"><b>▣</b><span>طلباتي</span></Link>
        <Link href="/profile" className="active"><b>●</b><span>حسابي</span></Link>
      </nav>
    </main>
  );
}
