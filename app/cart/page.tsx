"use client";

import Link from "next/link";

const cartItems = [
  {
    name: "كاهي وقيمر",
    restaurant: "فيروز",
    price: 3500,
    qty: 2,
    image: "/images/fayrouz.jpg",
  },
  {
    name: "فطير جبن موزريلا",
    restaurant: "شلتتة",
    price: 12000,
    qty: 1,
    image: "/images/m4.jpg",
  },
];

export default function CartPage() {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const delivery = 2000;
  const total = subtotal + delivery;

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

        .items {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .item {
          background: white;
          border-radius: 26px;
          padding: 12px;
          display: grid;
          grid-template-columns: 92px 1fr;
          gap: 13px;
          box-shadow: 0 12px 30px rgba(0,0,0,.07);
        }

        .item img {
          width: 92px;
          height: 92px;
          border-radius: 22px;
          object-fit: cover;
        }

        .item h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 900;
        }

        .item p {
          margin: 4px 0 8px;
          color: #888;
          font-size: 12px;
          font-weight: 800;
        }

        .row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .price {
          color: #ff4d00;
          font-size: 15px;
          font-weight: 900;
        }

        .qty {
          background: #fff3e9;
          color: #151515;
          border-radius: 14px;
          padding: 7px 10px;
          font-weight: 900;
          font-size: 12px;
        }

        .summary {
          margin-top: 18px;
          background: white;
          border-radius: 28px;
          padding: 18px;
          box-shadow: 0 14px 34px rgba(0,0,0,.07);
        }

        .summary h2 {
          margin: 0 0 14px;
          font-size: 22px;
          font-weight: 900;
        }

        .line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          color: #666;
          font-size: 14px;
          font-weight: 800;
        }

        .total {
          border-top: 1px solid #f1e9e0;
          margin-top: 12px;
          padding-top: 14px;
          display: flex;
          justify-content: space-between;
          font-size: 20px;
          font-weight: 900;
        }

        .checkout {
          margin-top: 16px;
          display: block;
          text-align: center;
          text-decoration: none;
          border-radius: 22px;
          background: #ff4d00;
          color: white;
          padding: 16px;
          font-weight: 900;
          box-shadow: 0 14px 30px rgba(255,77,0,.24);
        }

        .note {
          margin-top: 14px;
          background: #151515;
          color: white;
          border-radius: 24px;
          padding: 16px;
          font-size: 13px;
          line-height: 1.8;
          font-weight: 800;
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
            <h1>السلة</h1>
            <p>راجع طلبك قبل الإكمال</p>
          </div>

          <div style={{ width: 44 }} />
        </header>

        <section className="items">
          {cartItems.map((item) => (
            <div className="item" key={item.name}>
              <img src={item.image} alt={item.name} />

              <div>
                <h3>{item.name}</h3>
                <p>{item.restaurant}</p>

                <div className="row">
                  <span className="price">
                    {(item.price * item.qty).toLocaleString()} د.ع
                  </span>

                  <span className="qty">× {item.qty}</span>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="summary">
          <h2>ملخص الطلب</h2>

          <div className="line">
            <span>المجموع الفرعي</span>
            <span>{subtotal.toLocaleString()} د.ع</span>
          </div>

          <div className="line">
            <span>التوصيل</span>
            <span>{delivery.toLocaleString()} د.ع</span>
          </div>

          <div className="total">
            <span>الإجمالي</span>
            <span>{total.toLocaleString()} د.ع</span>
          </div>

          <Link href="/order-status" className="checkout">
            إكمال الطلب
          </Link>
        </section>

        <div className="note">
          ملاحظة: هذه صفحة سلة عامة للواجهة. السلة الحقيقية حالياً موجودة داخل صفحات المطاعم، وبعدها نربطها بسلة موحدة لكل التطبيق.
        </div>

        <nav className="nav">
          <Link href="/">⌂<br />الرئيسية</Link>
          <Link href="/explore">⌕<br />استكشف</Link>
          <Link href="/cart" className="active">▱<br />السلة</Link>
          <Link href="/order-status">▣<br />طلباتي</Link>
          <Link href="/profile">○<br />حسابي</Link>
        </nav>
      </main>
    </>
  );
}