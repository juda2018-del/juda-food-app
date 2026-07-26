"use client";

import Link from "next/link";
import { performFuseLogout } from "@/lib/fuse-logout";

const menu = [
  ["⭐", "نقاطي والمكافآت", "اجمع النقاط واستبدلها بعروض", "/rewards"],
  ["📦", "طلباتي السابقة", "راجع طلباتك وتفاصيلها", "/order-status"],
  ["❤️", "المفضلة", "مطاعمك ووجباتك المحفوظة", "/favorites"],
  ["📍", "العناوين المحفوظة", "إدارة عناوين التوصيل", "/addresses"],
  ["💳", "المحفظة وطرق الدفع", "الرصيد والبطاقات المحفوظة", "/wallet"],
  ["🎁", "القسائم والعروض", "الكوبونات والخصومات المتاحة", "/offers"],
  ["👥", "دعوة الأصدقاء", "شارك FUSE واحصل على مكافآت", "/invite"],
  ["🚴", "انضم كسائق", "ابدأ العمل مع FUSE", "/driver-register"],
  ["🍔", "سجّل مطعمك", "اعرض مطعمك ووصل لزبائن أكثر", "/restaurant-register"],
  ["💬", "المساعدة والدعم", "تواصل ويا فريق FUSE", "/support"],
  ["ℹ️", "حول FUSE", "تعرف على التطبيق والخدمات", "/about"],
];

export default function ProfilePage() {
  async function handleLogout() { await performFuseLogout("/"); }

  return (
    <main className="profile-shell" dir="rtl">
      <style>{`
        *{box-sizing:border-box} body{margin:0;background:#eef2f7;font-family:Arial,"Cairo",sans-serif;color:#111827}
        .profile-shell{width:100%;max-width:430px;min-height:100dvh;margin:auto;background:#f8fafc;padding:18px 16px 110px}
        .top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.brand{font-size:12px;font-weight:900;color:#ff6500;background:#fff3e8;border:1px solid #ffd7ba;padding:8px 12px;border-radius:999px}
        .top-actions{display:flex;gap:8px}.icon-btn{width:44px;height:44px;border-radius:16px;background:white;display:grid;place-items:center;text-decoration:none;color:#111827;box-shadow:0 8px 24px rgba(15,23,42,.08);font-size:20px}
        .profile-card{background:white;border-radius:28px;padding:18px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 14px 34px rgba(15,23,42,.08)}.user{display:flex;align-items:center;gap:13px}.avatar{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;color:white;font-size:25px;font-weight:900;background:linear-gradient(135deg,#0b4dce,#ff6500);box-shadow:0 10px 24px rgba(11,77,206,.25)}
        .user h1{font-size:19px;margin:0 0 5px;font-weight:900}.user p{margin:0;color:#64748b;font-size:12px;font-weight:700}.edit{padding:10px 12px;background:#f1f5f9;border-radius:14px;text-decoration:none;color:#111827;font-size:12px;font-weight:900}
        .plus{margin-top:16px;border-radius:28px;padding:20px;color:white;background:linear-gradient(135deg,#0b4dce 0%,#123fbd 55%,#ff6500 100%);position:relative;overflow:hidden;box-shadow:0 18px 38px rgba(11,77,206,.24)}.plus:after{content:"";position:absolute;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,.12);left:-50px;bottom:-75px}.plus-head{display:flex;justify-content:space-between;align-items:center}.plus h2{margin:0;font-size:23px;font-weight:900}.badge{background:#fbbf24;color:#111827;padding:6px 9px;border-radius:10px;font-size:10px;font-weight:900}
        .benefits{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0}.benefit{background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.15);padding:10px 5px;border-radius:14px;text-align:center;font-size:10px;font-weight:800}.plus-foot{display:flex;align-items:center;justify-content:space-between;position:relative;z-index:2}.plus-foot span{font-size:11px;font-weight:800}.discover{background:white;color:#0b4dce;text-decoration:none;padding:10px 14px;border-radius:14px;font-size:11px;font-weight:900}
        .section-title{font-size:15px;font-weight:900;margin:22px 3px 10px}.menu{background:white;border-radius:26px;padding:5px;box-shadow:0 12px 32px rgba(15,23,42,.06)}.item{min-height:66px;display:flex;align-items:center;justify-content:space-between;padding:9px 10px;text-decoration:none;color:#111827;border-bottom:1px solid #f1f5f9}.item:last-child{border-bottom:0}.item-main{display:flex;align-items:center;gap:12px}.emoji{width:44px;height:44px;border-radius:16px;background:#f8fafc;display:grid;place-items:center;font-size:20px}.item h3{margin:0 0 3px;font-size:13px;font-weight:900}.item p{margin:0;color:#94a3b8;font-size:10px;font-weight:700}.arrow{font-size:24px;color:#cbd5e1}
        .danger{margin-top:16px;background:white;border-radius:24px;padding:8px;box-shadow:0 12px 28px rgba(15,23,42,.05)}.logout,.delete{width:100%;height:52px;border:0;border-radius:16px;font-family:inherit;font-weight:900;font-size:13px;cursor:pointer}.logout{background:#fff3e8;color:#e65300}.delete{margin-top:8px;background:#fff1f2;color:#dc2626;text-decoration:none;display:grid;place-items:center}
        .bottom-nav{position:fixed;bottom:max(8px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:calc(100% - 24px);max-width:406px;height:72px;background:rgba(255,255,255,.97);border-radius:24px;box-shadow:0 12px 35px rgba(15,23,42,.18);display:grid;grid-template-columns:repeat(5,1fr);padding:6px;z-index:99}.bottom-nav a{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:3px;text-decoration:none;color:#64748b;font-size:10px;font-weight:900;border-radius:17px}.bottom-nav a.active{color:#ff6500;background:#fff3e8}.bottom-nav b{font-size:19px;line-height:1}
      `}</style>
      <header className="top"><span className="brand">FUSE العراق 🇮🇶</span><div className="top-actions"><Link className="icon-btn" href="/notification-center" aria-label="الإشعارات">🔔</Link><Link className="icon-btn" href="/settings" aria-label="الإعدادات">⚙️</Link></div></header>
      <section className="profile-card"><div className="user"><div className="avatar">F</div><div><h1>ضيف فيوز</h1><p>📍 بغداد، العراق</p></div></div><Link className="edit" href="/settings">تعديل</Link></section>
      <section className="plus"><div className="plus-head"><h2>🔥 FUSE Plus</h2><span className="badge">خصم 50%</span></div><div className="benefits"><div className="benefit">🚀<br/>توصيل مجاني</div><div className="benefit">🏷️<br/>خصومات حصرية</div><div className="benefit">⚡<br/>دعم أولوية</div></div><div className="plus-foot"><span>4,999 د.ع / شهرياً</span><Link className="discover" href="/fuse-plus">اكتشف الآن</Link></div></section>
      <h2 className="section-title">حسابي</h2>
      <section className="menu">{menu.map(([icon,title,desc,href]) => <Link key={title} href={href} className="item"><div className="item-main"><div className="emoji">{icon}</div><div><h3>{title}</h3><p>{desc}</p></div></div><span className="arrow">‹</span></Link>)}</section>
      <section className="danger"><button className="logout" type="button" onClick={handleLogout}>تسجيل الخروج</button><Link className="delete" href="/settings">حذف الحساب</Link></section>
      <nav className="bottom-nav"><Link href="/"><b>⌂</b><span>الرئيسية</span></Link><Link href="/restaurants"><b>⌕</b><span>المطاعم</span></Link><Link href="/reels"><b>▶</b><span>ريلز</span></Link><Link href="/order-status"><b>▣</b><span>طلباتي</span></Link><Link href="/profile" className="active"><b>●</b><span>حسابي</span></Link></nav>
    </main>
  );
}
