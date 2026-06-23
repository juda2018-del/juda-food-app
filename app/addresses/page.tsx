"use client";

import Link from "next/link";

const addresses = [
  {
    title: "المنزل",
    address: "بغداد - المنصور - قرب مول المنصور",
    icon: "🏠",
  },
  {
    title: "العمل",
    address: "بغداد - الكرادة - شارع الصناعة",
    icon: "💼",
  },
];

export default function AddressesPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

        *{box-sizing:border-box}

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
          padding:16px;
          display:flex;
          justify-content:space-between;
          align-items:center;
          box-shadow:0 14px 34px rgba(0,0,0,.08);
        }

        .left{
          display:flex;
          align-items:center;
          gap:14px;
        }

        .icon{
          width:56px;
          height:56px;
          border-radius:18px;
          background:#fff3e9;
          color:#ff4d00;
          display:grid;
          place-items:center;
          font-size:28px;
        }

        .card h3{
          margin:0;
          font-size:18px;
          font-weight:900;
        }

        .card p{
          margin:4px 0 0;
          color:#777;
          font-size:12px;
          font-weight:800;
          line-height:1.7;
        }

        .edit{
          color:#ff4d00;
          font-size:22px;
          font-weight:900;
        }

        .add{
          margin-top:18px;
          width:100%;
          border:0;
          border-radius:22px;
          background:#151515;
          color:white;
          padding:16px;
          font-family:inherit;
          font-weight:900;
          font-size:15px;
        }
      `}</style>

      <main className="app">

        <header className="top">
          <Link href="/profile" className="back">‹</Link>

          <div className="title">
            <h1>العناوين</h1>
            <p>أماكن التوصيل المحفوظة</p>
          </div>

          <div style={{width:44}} />
        </header>

        <section className="hero">
          <h2>📍 عناوينك</h2>
          <p>
            أضف أكثر من عنوان للوصول السريع أثناء الطلب.
          </p>
        </section>

        <section className="list">
          {addresses.map((item) => (
            <div className="card" key={item.title}>

              <div className="left">
                <div className="icon">
                  {item.icon}
                </div>

                <div>
                  <h3>{item.title}</h3>
                  <p>{item.address}</p>
                </div>
              </div>

              <div className="edit">
                ✎
              </div>

            </div>
          ))}
        </section>

        <button className="add">
          + إضافة عنوان جديد
        </button>

      </main>
    </>
  );
}