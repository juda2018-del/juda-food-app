"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const restaurants = [
  {
    name: "فيروز",
    desc: "فطور عراقي، كاهي، قيمر وبورك",
    href: "/fayrouz",
    image: "/images/fayrouz.jpg",
    rating: 4.8,
    time: "25-35 د",
    category: "فطور",
    delivery: "1,500 د.ع",
  },
  {
    name: "شلتتة",
    desc: "مشلتت، فطائر، بيتزا وقلبض رول",
    href: "/ahram",
    image: "/images/ahram.jpg",
    rating: 4.7,
    time: "30-40 د",
    category: "فطائر",
    delivery: "2,000 د.ع",
  },
  {
    name: "خان قدوري",
    desc: "أكلات عراقية وفطور أصيل",
    href: "/khan",
    image: "/images/khan.jpg",
    rating: 4.6,
    time: "35-45 د",
    category: "عراقي",
    delivery: "2,000 د.ع",
  },
];

const filters = ["الكل", "فطور", "فطائر", "عراقي", "الأعلى تقييماً"];

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("الكل");

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((item) => {
      const bySearch =
        item.name.includes(search) ||
        item.desc.includes(search) ||
        item.category.includes(search);

      const byFilter =
        filter === "الكل" ||
        item.category === filter ||
        (filter === "الأعلى تقييماً" && item.rating >= 4.7);

      return bySearch && byFilter;
    });
  }, [search, filter]);

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
          direction: rtl;
          padding: 18px 18px 96px;
          background: linear-gradient(180deg, #fffaf4 0%, #ffffff 100%);
          color: #151515;
        }

        .top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }

        .back {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          background: white;
          color: #151515;
          text-decoration: none;
          display: grid;
          place-items: center;
          font-size: 26px;
          font-weight: 900;
          box-shadow: 0 12px 28px rgba(0,0,0,.07);
        }

        .title {
          text-align: center;
        }

        .title h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 900;
        }

        .title p {
          margin: 4px 0 0;
          color: #888;
          font-size: 13px;
          font-weight: 800;
        }

        .search {
          height: 56px;
          border-radius: 22px;
          background: #ffffff;
          display: flex;
          align-items: center;
          padding: 0 17px;
          box-shadow: 0 14px 32px rgba(0,0,0,.06);
          border: 1px solid rgba(0,0,0,.04);
          margin-bottom: 14px;
        }

        .search input {
          width: 100%;
          border: 0;
          outline: none;
          background: transparent;
          font-family: inherit;
          font-size: 14px;
          font-weight: 800;
          color: #151515;
        }

        .filters {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 18px;
          scrollbar-width: none;
        }

        .filters::-webkit-scrollbar {
          display: none;
        }

        .filter {
          flex: 0 0 auto;
          border: 0;
          border-radius: 999px;
          padding: 11px 18px;
          background: white;
          color: #151515;
          font-family: inherit;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 10px 24px rgba(0,0,0,.06);
        }

        .filter.active {
          background: #ff4d00;
          color: white;
          box-shadow: 0 12px 26px rgba(255,77,0,.22);
        }

        .hero {
          background: linear-gradient(135deg, #151515, #2a2a2a);
          border-radius: 30px;
          padding: 20px;
          color: white;
          margin-bottom: 18px;
          box-shadow: 0 18px 40px rgba(0,0,0,.18);
        }

        .hero h2 {
          margin: 0;
          font-size: 25px;
          font-weight: 900;
        }

        .hero p {
          margin: 7px 0 0;
          color: #d7d7d7;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.7;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .card {
          background: white;
          border-radius: 26px;
          overflow: hidden;
          text-decoration: none;
          color: #151515;
          box-shadow: 0 14px 34px rgba(0,0,0,.08);
          border: 1px solid rgba(0,0,0,.04);
        }

        .image {
          height: 150px;
          position: relative;
          background: #f4f4f4;
        }

        .image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #ff4d00;
          color: white;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 900;
        }

        .heart {
          position: absolute;
          top: 12px;
          left: 12px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: white;
          display: grid;
          place-items: center;
          font-size: 18px;
          font-weight: 900;
          box-shadow: 0 10px 22px rgba(0,0,0,.12);
        }

        .info {
          padding: 14px;
        }

        .info h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 900;
        }

        .info p {
          margin: 5px 0 12px;
          color: #777;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.6;
        }

        .meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .meta span {
          background: #f8f3ee;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 900;
          color: #555;
        }

        .meta .orange {
          background: #fff3e9;
          color: #ff4d00;
        }

        .empty {
          background: white;
          border-radius: 26px;
          padding: 28px;
          text-align: center;
          color: #888;
          font-weight: 900;
          box-shadow: 0 12px 30px rgba(0,0,0,.06);
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
      `}</style>

      <main className="app">
        <header className="top">
          <Link className="back" href="/">‹</Link>

          <div className="title">
            <h1>استكشف</h1>
            <p>مطاعم قريبة واختيارات مميزة</p>
          </div>

          <div style={{ width: 44 }} />
        </header>

        <div className="search">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن مطعم أو نوع أكل..."
          />
        </div>

        <section className="filters">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={filter === item ? "filter active" : "filter"}
            >
              {item}
            </button>
          ))}
        </section>

        <section className="hero">
          <h2>اكتشف أفضل المطاعم</h2>
          <p>
            جمعنالك المطاعم الأقرب والأكثر طلباً حتى تختار بسرعة وتطلب بثواني.
          </p>
        </section>

        <section className="list">
          {filteredRestaurants.length === 0 ? (
            <div className="empty">ماكو نتائج بهذا البحث</div>
          ) : (
            filteredRestaurants.map((item) => (
              <Link href={item.href} className="card" key={item.name}>
                <div className="image">
                  <img src={item.image} alt={item.name} />
                  <div className="badge">{item.category}</div>
                  <div className="heart">♡</div>
                </div>

                <div className="info">
                  <h3>{item.name}</h3>
                  <p>{item.desc}</p>

                  <div className="meta">
                    <span className="orange">⭐ {item.rating}</span>
                    <span>{item.time}</span>
                    <span>توصيل {item.delivery}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </section>

        <nav className="nav">
          <Link href="/">⌂<br />الرئيسية</Link>
          <Link href="/explore" className="active">⌕<br />استكشف</Link>
          <Link href="/cart">▱<br />السلة</Link>
          <Link href="/order-status">▣<br />طلباتي</Link>
          <Link href="/profile">○<br />حسابي</Link>
        </nav>
      </main>
    </>
  );
}