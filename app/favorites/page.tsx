"use client";

import Link from "next/link";

const favorites = [
  {
    name: "فيروز",
    desc: "فطور عراقي، كاهي، قيمر وبورك",
    image: "/images/fayrouz.jpg",
    href: "/fayrouz",
    rating: "4.8",
  },
  {
    name: "شلتتة",
    desc: "فطائر ومشلتت حار وحلو",
    image: "/images/ahram.jpg",
    href: "/ahram",
    rating: "4.7",
  },
];

export default function FavoritesPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

        *{box-sizing:border-box;}

        body{
          margin:0;
          background:#efe8df;
          font-family:"Cairo",sans-serif;
        }

        .app{
          width:100%;
          max-width:430px;
          min-height:100vh;
          margin:0 auto;
          padding:18px 18px 95px;
          direction:rtl;
          background:linear-gradient(180deg,#fffaf4 0%,#fff 100%);
        }

        .top{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:22px;
        }

        .back{
          width:44px;
          height:44px;
          border-radius:16px;
          background:white;
          text-decoration:none;
          color:#151515;
          display:grid;
          place-items:center;
          font-size:26px;
          font-weight:900;
          box-shadow:0 12px 28px rgba(0,0,0,.07);
        }

        .title{
          text-align:center;
        }

        .title h1{
          margin:0;
          font-size:28px;
          font-weight:900;
        }

        .title p{
          margin:4px 0 0;
          color:#888;
          font-size:13px;
          font-weight:800;
        }

        .hero{
          background:linear-gradient(135deg,#ff4d00,#ff8a00);
          color:white;
          border-radius:30px;
          padding:22px;
          margin-bottom:18px;
          box-shadow:0 18px 42px rgba(255,77,0,.22);
        }

        .hero h2{
          margin:0;
          font-size:24px;
          font-weight:900;
        }

        .hero p{
          margin:7px 0 0;
          color:rgba(255,255,255,.9);
          font-size:13px;
          font-weight:800;
        }

        .list{
          display:flex;
          flex-direction:column;
          gap:14px;
        }

        .card{
          background:white;
          border-radius:26px;
          overflow:hidden;
          text-decoration:none;
          color:#151515;
          box-shadow:0 14px 34px rgba(0,0,0,.08);
        }

        .image{
          height:150px;
          position:relative;
        }

        .image img{
          width:100%;
          height:100%;
          object-fit:cover;
        }

        .heart{
          position:absolute;
          top:14px;
          left:14px;
          width:42px;
          height:42px;
          border-radius:50%;
          background:white;
          color:#ff4d00;
          display:grid;
          place-items:center;
          font-size:22px;
          font-weight:900;
        }

        .info{
          padding:15px;
        }

        .info h3{
          margin:0;
          font-size:20px;
          font-weight:900;
        }

        .info p{
          margin:6px 0 10px;
          color:#777;
          font-size:13px;
          font-weight:800;
          line-height:1.7;
        }

        .rate{
          color:#ff8a00;
          font-size:13px;
          font-weight:900;
        }

        .nav{
          position:fixed;
          left:50%;
          bottom:0;
          transform:translateX(-50%);
          width:100%;
          max-width:430px;
          height:76px;
          background:white;
          display:grid;
          grid-template-columns:repeat(5,1fr);
          align-items:center;
          text-align:center;
          box-shadow:0 -12px 32px rgba(0,0,0,.08);
          font-size:11px;
          font-weight:800;
        }

        .nav a{
          text-decoration:none;
          color:#777;
          line-height:1.6;
        }

        .active{
          color:#ff4d00 !important;
          font-weight:900;
        }

      `}</style>

      <main className="app">

        <header className="top">
          <Link href="/profile" className="back">‹</Link>

          <div className="title">
            <h1>المفضلة</h1>
            <p>مطاعمك المحفوظة</p>
          </div>

          <div style={{width:44}} />
        </header>

        <section className="hero">
          <h2>❤️ مطاعمك المفضلة</h2>
          <p>
            احفظ المطاعم والوجبات التي تحبها للوصول إليها بسرعة.
          </p>
        </section>

        <section className="list">
          {favorites.map((item) => (
            <Link key={item.name} href={item.href} className="card">

              <div className="image">
                <img src={item.image} alt={item.name}/>
                <div className="heart">♥</div>
              </div>

              <div className="info">
                <h3>{item.name}</h3>

                <p>{item.desc}</p>

                <div className="rate">
                  ⭐ {item.rating}
                </div>
              </div>

            </Link>
          ))}
        </section>

        <nav className="nav">
          <Link href="/">⌂<br/>الرئيسية</Link>
          <Link href="/explore">⌕<br/>استكشف</Link>
          <Link href="/cart">▱<br/>السلة</Link>
          <Link href="/order-status">▣<br/>طلباتي</Link>
          <Link href="/profile" className="active">○<br/>حسابي</Link>
        </nav>

      </main>
    </>
  );
}