import Link from "next/link";

const restaurants = [
  { href: "/restaurants/fayrouz", name: "فيروز", desc: "فطور عراقي، كاهي، قيمر وبورك.", icon: "🥣" },
  { href: "/restaurants/shalteta", name: "شلتتة", desc: "مشلتت وفطائر حار وحلو.", icon: "🥐" },
  { href: "/restaurants/khan", name: "خان قدوري", desc: "وجبات عراقية ومشاوي.", icon: "🍗" },
  { href: "/restaurants/alforn", name: "الفرن", desc: "مناقيش، بيتزا، كريب ووافل.", icon: "🍕" },
];

export default function RestaurantsPage() {
  return (
    <main dir="rtl" className="page">
      <section className="phone">
        <header className="top">
          <Link href="/" className="back">‹</Link>
          <div>
            <p>FUSE Iraq</p>
            <h1>المطاعم</h1>
          </div>
          <Link href="/cart" className="cart">السلة</Link>
        </header>

        <section className="hero">
          <span>اختار مطعمك</span>
          <h2>كل المطاعم جاهزة للطلب والتجربة</h2>
          <p>اضغط على أي مطعم، أضف صنف للسلة، وبعدها كمل الطلب من صفحة السلة.</p>
        </section>

        <section className="grid">
          {restaurants.map((restaurant) => (
            <Link href={restaurant.href} className="card" key={restaurant.href}>
              <div className="icon">{restaurant.icon}</div>
              <div>
                <h3>{restaurant.name}</h3>
                <p>{restaurant.desc}</p>
              </div>
              <b>اطلب الآن</b>
            </Link>
          ))}
        </section>
      </section>

      <style>{`
        * { box-sizing: border-box; }
        html, body { margin: 0; background: #efe8df; }
        .page { min-height: 100vh; display: grid; place-items: start center; padding: 24px; background: #efe8df; font-family: Cairo, system-ui, sans-serif; color: #151515; }
        .phone { width: min(100%, 430px); min-height: calc(100vh - 48px); border-radius: 38px; background: linear-gradient(180deg,#fffaf4,#fff); padding: 18px; box-shadow: 0 34px 90px rgba(0,0,0,.12); }
        .top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
        .top p { margin: 0; color: #ff4d00; font-weight: 900; font-size: 13px; }
        .top h1 { margin: 2px 0 0; font-size: 30px; font-weight: 950; }
        .back, .cart { min-width: 44px; height: 44px; border-radius: 16px; background: white; color: #151515; text-decoration: none; display: grid; place-items: center; padding: 0 12px; font-weight: 950; box-shadow: 0 12px 28px rgba(0,0,0,.07); }
        .back { font-size: 30px; }
        .cart { color: #ff4d00; font-size: 13px; }
        .hero { border-radius: 30px; padding: 22px; background: linear-gradient(135deg,#151515,#2a2a2a); color: white; margin-bottom: 14px; box-shadow: 0 18px 44px rgba(0,0,0,.16); }
        .hero span { color: #ff8a00; font-weight: 950; }
        .hero h2 { margin: 8px 0; font-size: 26px; font-weight: 950; line-height: 1.25; }
        .hero p { margin: 0; color: rgba(255,255,255,.75); line-height: 1.8; font-weight: 800; }
        .grid { display: grid; gap: 12px; }
        .card { display: grid; grid-template-columns: 64px 1fr auto; gap: 12px; align-items: center; text-decoration: none; color: #151515; background: white; border-radius: 26px; padding: 14px; box-shadow: 0 14px 34px rgba(0,0,0,.08); }
        .icon { width: 64px; height: 64px; border-radius: 22px; background: #fff3e9; display: grid; place-items: center; font-size: 30px; }
        .card h3 { margin: 0; font-size: 20px; font-weight: 950; }
        .card p { margin: 4px 0 0; color: #777; font-size: 12px; line-height: 1.6; font-weight: 800; }
        .card b { color: #ff4d00; font-size: 12px; }
        @media (max-width: 520px) { .page { padding: 0; } .phone { min-height: 100vh; border-radius: 0; box-shadow: none; } }
      `}</style>
    </main>
  );
}
