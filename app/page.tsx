"use client";

import Link from "next/link";

const restaurants = [
  {
    name: "فيروز",
    desc: "فطور عراقي، كاهي، قيمر وبورك",
    href: "/fayrouz",
    image: "/images/fayrouz.jpg",
    rating: "4.8",
    time: "25-35 د",
  },
  {
    name: "شلتتة",
    desc: "مشلتت وفطائر حار وحلو",
    href: "/ahram",
    image: "/images/ahram.jpg",
    rating: "4.7",
    time: "30-40 د",
  },
  {
    name: "خان قدوري",
    desc: "أكلات عراقية بطعم أصيل",
    href: "/khan",
    image: "/images/khan.jpg",
    rating: "4.6",
    time: "35-45 د",
  },
];

const categories = [
  { name: "بركر", image: "/images/1.jpg" },
  { name: "بيتزا", image: "/images/3.jpg" },
  { name: "مشاوي", image: "/images/4.jpg" },
  { name: "فطور", image: "/images/fayrouz.jpg" },
  { name: "مشروبات", image: "/images/5.1.jpg" },
];

const popular = [
  { name: "بركر لحم", price: "8,500", image: "/images/1.jpg" },
  { name: "بيتزا مارغريتا", price: "7,000", image: "/images/3.jpg" },
  { name: "دجاج مشوي", price: "9,000", image: "/images/4.jpg" },
  { name: "عصير برتقال", price: "3,000", image: "/images/5.1.jpg" },
];

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        body {
          margin: 0;
          font-family: "Cairo", sans-serif;
          background: #efe8df;
        }

        .app {
          width: 100%;
          max-width: 430px;
          min-height: 100vh;
          margin: 0 auto;
          padding: 18px 18px 96px;
          direction: rtl;
          color: #151515;
          background:
            radial-gradient(circle at 15% -4%, rgba(255, 91, 18, 0.12), transparent 35%),
            linear-gradient(180deg, #fffaf4 0%, #ffffff 100%);
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .profile {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff4d00, #ff8a00);
          display: grid;
          place-items: center;
          color: white;
          font-size: 20px;
          font-weight: 900;
          box-shadow: 0 12px 28px rgba(255, 77, 0, .22);
          text-decoration: none;
        }

        .location {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 15px;
          font-weight: 900;
          color: #181818;
        }

        .pin {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #ff4d00;
          box-shadow: 0 0 0 5px rgba(255,77,0,.10);
        }

        .bell {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          background: #ffffff;
          color: #151515;
          box-shadow: 0 12px 28px rgba(0,0,0,.07);
          font-size: 19px;
          font-weight: 900;
          position: relative;
          text-decoration: none;
          display: grid;
          place-items: center;
        }

        .bell::after {
          content: "2";
          position: absolute;
          top: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ff4d00;
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 10px;
          font-weight: 900;
        }

        .search-row {
          margin-top: 22px;
          display: grid;
          grid-template-columns: 1fr 54px;
          gap: 12px;
        }

        .search {
          height: 56px;
          border-radius: 22px;
          background: #ffffff;
          display: flex;
          align-items: center;
          padding: 0 17px;
          color: #969696;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 14px 32px rgba(0,0,0,.06);
          border: 1px solid rgba(0,0,0,.04);
        }

        .filter {
          height: 56px;
          border: 0;
          border-radius: 22px;
          background: linear-gradient(135deg, #ff4d00, #ff7a00);
          color: white;
          font-size: 22px;
          font-weight: 900;
          box-shadow: 0 15px 30px rgba(255,77,0,.25);
        }

        .cats {
          margin-top: 22px;
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: none;
        }

        .cats::-webkit-scrollbar,
        .rest-row::-webkit-scrollbar,
        .popular-row::-webkit-scrollbar {
          display: none;
        }

        .cat {
          min-width: 66px;
          text-align: center;
          color: #171717;
          font-size: 12px;
          font-weight: 900;
        }

        .cat-img {
          width: 62px;
          height: 62px;
          border-radius: 50%;
          background: #ffffff;
          padding: 8px;
          margin: 0 auto 8px;
          box-shadow: 0 12px 28px rgba(0,0,0,.07);
        }

        .cat-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .hero {
          margin-top: 20px;
          height: 214px;
          border-radius: 28px;
          background:
            radial-gradient(circle at 78% 40%, rgba(255,255,255,.18), transparent 32%),
            linear-gradient(135deg, #ff3f00 0%, #ff6b00 52%, #ff8a00 100%);
          position: relative;
          overflow: hidden;
          padding: 24px;
          box-shadow: 0 20px 45px rgba(255,77,0,.25);
        }

        .hero-content {
          position: relative;
          z-index: 2;
          width: 50%;
        }

        .hero h1 {
          margin: 0;
          color: white;
          font-size: 38px;
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .hero p {
          margin: 9px 0 18px;
          color: white;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.7;
        }

        .hero a {
          display: inline-block;
          text-decoration: none;
          color: white;
          background: #111111;
          border-radius: 999px;
          padding: 12px 23px;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 12px 28px rgba(0,0,0,.25);
        }

        .hero img {
          position: absolute;
          left: -18px;
          bottom: -3px;
          width: 245px;
          height: 168px;
          object-fit: cover;
          border-radius: 30px;
          filter: drop-shadow(0 18px 25px rgba(0,0,0,.20));
        }

        .dots {
          margin: 13px auto 0;
          display: flex;
          width: fit-content;
          gap: 6px;
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 20px;
          background: #dedede;
        }

        .dot.active {
          width: 22px;
          background: #ff4d00;
        }

        .section {
          margin-top: 25px;
          margin-bottom: 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .section h2 {
          margin: 0;
          color: #151515;
          font-size: 20px;
          font-weight: 900;
        }

        .section span {
          color: #ff4d00;
          font-size: 12px;
          font-weight: 900;
        }

        .rest-row {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding-bottom: 10px;
        }

        .rest-card {
          flex: 0 0 164px;
          background: #ffffff;
          border-radius: 26px;
          overflow: hidden;
          text-decoration: none;
          color: #151515;
          box-shadow: 0 14px 34px rgba(0,0,0,.08);
          border: 1px solid rgba(0,0,0,.04);
          position: relative;
        }

        .rest-img {
          height: 126px;
          position: relative;
          background: #f4f4f4;
        }

        .rest-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .heart {
          position: absolute;
          top: 9px;
          left: 9px;
          width: 33px;
          height: 33px;
          border-radius: 50%;
          background: rgba(255,255,255,.92);
          display: grid;
          place-items: center;
          color: #151515;
          font-size: 17px;
          font-weight: 900;
          box-shadow: 0 8px 18px rgba(0,0,0,.10);
        }

        .rest-info {
          padding: 12px;
        }

        .rest-info h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 900;
          color: #111;
        }

        .rating-line {
          margin-top: 7px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 900;
          color: #555;
        }

        .star {
          color: #ff8a00;
        }

        .rest-info p {
          margin: 7px 0 0;
          color: #8a8a8a;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.5;
        }

        .popular-row {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding-bottom: 12px;
        }

        .food-card {
          flex: 0 0 120px;
          background: #ffffff;
          border-radius: 22px;
          padding: 10px;
          box-shadow: 0 13px 30px rgba(0,0,0,.07);
          border: 1px solid rgba(0,0,0,.04);
        }

        .food-card img {
          width: 100%;
          height: 84px;
          object-fit: cover;
          border-radius: 17px;
          background: #f4f4f4;
        }

        .food-card h3 {
          margin: 10px 0 4px;
          color: #111;
          font-size: 12px;
          font-weight: 900;
          line-height: 1.35;
        }

        .food-card p {
          margin: 0;
          color: #ff4d00;
          font-size: 12px;
          font-weight: 900;
        }

        .food-bottom {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .plus {
          width: 29px;
          height: 29px;
          border: 0;
          border-radius: 50%;
          background: #ff4d00;
          color: #ffffff;
          font-size: 18px;
          font-weight: 900;
          line-height: 1;
        }

        .nav {
          position: fixed;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          height: 76px;
          background: #ffffff;
          box-shadow: 0 -12px 32px rgba(0,0,0,.08);
          display: grid;
          grid-template-columns: repeat(5,1fr);
          align-items: center;
          text-align: center;
          color: #777;
          font-size: 11px;
          font-weight: 800;
          z-index: 50;
          border-top: 1px solid rgba(0,0,0,.04);
        }

        .nav a {
          text-decoration: none;
          color: inherit;
          line-height: 1.6;
        }

        .nav .active {
          color: #ff4d00;
          font-weight: 900;
        }

        @media (min-width: 700px) {
          .app {
            border-left: 1px solid rgba(0,0,0,.05);
            border-right: 1px solid rgba(0,0,0,.05);
          }
        }
      `}</style>

      <main className="app">
        <header className="header">
          <Link href="/profile" className="profile">F</Link>

          <div className="location">
            <span className="pin" />
            بغداد - المنصور
          </div>

          <Link href="/notifications" className="bell">⌁</Link>
        </header>

        <div className="search-row">
          <div className="search">ابحث عن مطعم أو وجبة...</div>
          <button className="filter">≡</button>
        </div>

        <section className="cats">
          {categories.map((cat) => (
            <div className="cat" key={cat.name}>
              <div className="cat-img">
                <img src={cat.image} alt={cat.name} />
              </div>
              {cat.name}
            </div>
          ))}
        </section>

        <section className="hero">
          <div className="hero-content">
            <h1>
              خصم حتى
              <br />
              50%
            </h1>
            <p>على أول طلب داخل FUSE</p>
            <Link href="/fayrouz">اطلب الآن</Link>
          </div>

          <img src="/images/1.jpg" alt="عرض فيوز" />
        </section>

        <div className="dots">
          <span className="dot active" />
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>

        <div className="section">
          <span>عرض الكل</span>
          <h2>المطاعم المميزة</h2>
        </div>

        <section className="rest-row">
          {restaurants.map((r) => (
            <Link href={r.href} className="rest-card" key={r.name}>
              <div className="rest-img">
                <img src={r.image} alt={r.name} />
                <div className="heart">♡</div>
              </div>

              <div className="rest-info">
                <h3>{r.name}</h3>

                <div className="rating-line">
                  <span>
                    {r.rating} <span className="star">★</span>
                  </span>
                  <span>{r.time}</span>
                </div>

                <p>{r.desc}</p>
              </div>
            </Link>
          ))}
        </section>

        <div className="section">
          <span>عرض الكل</span>
          <h2>الأكثر طلباً</h2>
        </div>

        <section className="popular-row">
          {popular.map((item) => (
            <div className="food-card" key={item.name}>
              <img src={item.image} alt={item.name} />
              <h3>{item.name}</h3>

              <div className="food-bottom">
                <p>{item.price} د.ع</p>
                <button className="plus">+</button>
              </div>
            </div>
          ))}
        </section>

        <nav className="nav">
          <Link href="/" className="active">
            ⌂
            <br />
            الرئيسية
          </Link>

          <Link href="/explore">
            ⌕
            <br />
            استكشف
          </Link>

          <Link href="/cart">
            ▱
            <br />
            السلة
          </Link>

          <Link href="/order-status">
            ▣
            <br />
            طلباتي
          </Link>

          <Link href="/profile">
            ○
            <br />
            حسابي
          </Link>
        </nav>
      </main>
    </>
  );
}