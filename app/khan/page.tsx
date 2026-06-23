 "use client";

import { useState } from "react";

type MenuItem = {
  name: string;
  price: number;
  category: string;
};

type CartItem = MenuItem & {
  qty: number;
};

const menuItems: MenuItem[] = [
  { name: "مخلمة", price: 5000, category: "الفطور" },
  { name: "باكلة", price: 5000, category: "الفطور" },
  { name: "لوبية", price: 5000, category: "الفطور" },
  { name: "كبة", price: 5500, category: "الفطور" },
  { name: "طماطة وبيض", price: 3500, category: "الفطور" },
  { name: "طماطة ولحم", price: 4000, category: "الفطور" },
  { name: "بيض بالدهن", price: 2500, category: "الفطور" },
  { name: "جلفراي", price: 6000, category: "الفطور" },
  { name: "عروك", price: 6000, category: "الفطور" },
  { name: "وجبة عروك", price: 8000, category: "الفطور" },
  { name: "شوربة عدس", price: 3000, category: "الفطور" },
  { name: "كاهي سادة", price: 1500, category: "كاهي وبورك" },
  { name: "كاهي حليب", price: 2000, category: "كاهي وبورك" },
  { name: "كاهي وقيمر", price: 3500, category: "كاهي وبورك" },
  { name: "بورك لحم", price: 1500, category: "كاهي وبورك" },
  { name: "بورك جبن", price: 2000, category: "كاهي وبورك" },
  { name: "بورك شاورما لحم", price: 3000, category: "كاهي وبورك" },
  { name: "ماء", price: 250, category: "مشروبات" },
  { name: "علبة مشروب غازي", price: 500, category: "مشروبات" },
  { name: "قدح شاي", price: 500, category: "مشروبات" },
  { name: "نسكافيه", price: 3000, category: "مشروبات" },
  { name: "كابتشينو", price: 3000, category: "مشروبات" },
  { name: "سيت منيو خان قدوري", price: 30000, category: "سيت منيو" },
];

const categories = ["الكل", "الفطور", "كاهي وبورك", "مشروبات", "سيت منيو"];

export default function Khan() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const filteredItems = menuItems.filter((item) => {
    const byCategory =
      selectedCategory === "الكل" || item.category === selectedCategory;
    const bySearch = item.name.toLowerCase().includes(search.toLowerCase());
    return byCategory && bySearch;
  });

  const getQty = (name: string) =>
    cart.find((item) => item.name === name)?.qty || 0;

  const addToCart = (item: MenuItem) => {
    setCart((oldCart) => {
      const found = oldCart.find((x) => x.name === item.name);

      if (found) {
        return oldCart.map((x) =>
          x.name === item.name ? { ...x, qty: x.qty + 1 } : x
        );
      }

      return [...oldCart, { ...item, qty: 1 }];
    });
  };

  const removeOne = (name: string) => {
    setCart((oldCart) =>
      oldCart
        .map((x) => (x.name === name ? { ...x, qty: x.qty - 1 } : x))
        .filter((x) => x.qty > 0)
    );
  };

  const sendOrder = () => {
    if (!customerName || !phone || !address) {
      alert("اكتب اسم الزبون ورقم الهاتف والعنوان");
      return;
    }

    if (cart.length === 0) {
      alert("السلة فارغة");
      return;
    }

    const orderText = cart
      .map(
        (item) =>
          `• ${item.name} × ${item.qty} = ${(
            item.price * item.qty
          ).toLocaleString()} د.ع`
      )
      .join("\n");

    const message = `طلب جديد من خان قدوري

اسم الزبون: ${customerName}
رقم الهاتف: ${phone}
العنوان: ${address}

الطلبات:
${orderText}

عدد الأصناف: ${cartCount}
المجموع: ${total.toLocaleString()} د.ع`;

    setCart([]);
    setCheckoutOpen(false);

    window.open(
      `https://wa.me/9647733778077?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

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
          padding-bottom: 105px;
          direction: rtl;
          background: linear-gradient(180deg, #fffaf4 0%, #ffffff 100%);
          color: #151515;
        }

        .hero {
          height: 310px;
          position: relative;
          overflow: hidden;
          border-bottom-left-radius: 34px;
          border-bottom-right-radius: 34px;
          background: #ddd;
        }

        .hero img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,.72), rgba(0,0,0,.08));
        }

        .topbar {
          position: absolute;
          top: 18px;
          left: 18px;
          right: 18px;
          z-index: 3;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .topbtn {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          border: 0;
          background: rgba(255,255,255,.94);
          color: #151515;
          display: grid;
          place-items: center;
          text-decoration: none;
          font-weight: 900;
          box-shadow: 0 12px 26px rgba(0,0,0,.16);
        }

        .hero-info {
          position: absolute;
          z-index: 3;
          right: 18px;
          left: 18px;
          bottom: 20px;
          color: white;
        }

        .status {
          display: inline-flex;
          background: #ff4d00;
          color: white;
          padding: 8px 13px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 10px;
        }

        .hero-info h1 {
          margin: 0;
          font-size: 42px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .hero-info p {
          margin: 8px 0 14px;
          color: rgba(255,255,255,.88);
          font-size: 14px;
          font-weight: 700;
        }

        .stats {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .stats span {
          background: rgba(255,255,255,.94);
          color: #151515;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
        }

        .content {
          padding: 18px;
        }

        .checkout {
          background: white;
          border-radius: 26px;
          padding: 16px;
          box-shadow: 0 14px 34px rgba(0,0,0,.07);
          margin-bottom: 18px;
        }

        .checkout h2 {
          margin: 0 0 12px;
          font-size: 20px;
          font-weight: 900;
        }

        .input {
          width: 100%;
          border: 0;
          outline: none;
          border-radius: 18px;
          background: #f8f3ee;
          padding: 14px 15px;
          font-family: inherit;
          font-weight: 800;
          margin-bottom: 10px;
          color: #151515;
        }

        .checkout-list {
          margin: 10px 0 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .checkout-item {
          background: #f8f3ee;
          border-radius: 16px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 800;
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .orange-btn {
          width: 100%;
          border: 0;
          border-radius: 18px;
          background: #ff4d00;
          color: white;
          padding: 14px;
          font-family: inherit;
          font-weight: 900;
          margin-top: 4px;
          box-shadow: 0 12px 26px rgba(255,77,0,.22);
        }

        .search {
          height: 54px;
          border-radius: 21px;
          background: white;
          box-shadow: 0 12px 28px rgba(0,0,0,.06);
          display: flex;
          align-items: center;
          padding: 0 16px;
          color: #999;
          margin-bottom: 14px;
        }

        .search input {
          width: 100%;
          border: 0;
          outline: none;
          background: transparent;
          font-family: inherit;
          font-weight: 800;
          color: #151515;
        }

        .tabs {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 16px;
          scrollbar-width: none;
        }

        .tabs::-webkit-scrollbar { display: none; }

        .tab {
          flex: 0 0 auto;
          border: 0;
          border-radius: 999px;
          padding: 11px 18px;
          background: white;
          color: #151515;
          font-family: inherit;
          font-weight: 900;
          box-shadow: 0 10px 24px rgba(0,0,0,.06);
        }

        .tab.active {
          background: #ff4d00;
          color: white;
          box-shadow: 0 12px 26px rgba(255,77,0,.25);
        }

        .section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 10px 0 14px;
        }

        .section-title h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 900;
        }

        .section-title span {
          color: #ff4d00;
          font-size: 12px;
          font-weight: 900;
        }

        .items {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .item {
          background: white;
          border-radius: 25px;
          padding: 12px;
          display: grid;
          grid-template-columns: 82px 1fr;
          gap: 13px;
          box-shadow: 0 12px 30px rgba(0,0,0,.07);
        }

        .item-icon {
          width: 82px;
          height: 82px;
          border-radius: 22px;
          background: #fff3e9;
          display: grid;
          place-items: center;
          color: #ff4d00;
          font-size: 34px;
          font-weight: 900;
        }

        .item h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 900;
          line-height: 1.35;
        }

        .item .cat-name {
          margin: 4px 0 8px;
          font-size: 12px;
          color: #888;
          font-weight: 800;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .price {
          color: #ff4d00;
          font-size: 15px;
          font-weight: 900;
        }

        .add {
          min-width: 42px;
          height: 36px;
          border: 0;
          border-radius: 14px;
          background: #ff4d00;
          color: white;
          font-size: 20px;
          font-weight: 900;
        }

        .qty {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ff4d00;
          color: white;
          border-radius: 14px;
          padding: 5px 7px;
          font-weight: 900;
        }

        .qty button {
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 10px;
          background: white;
          color: #151515;
          font-size: 18px;
          font-weight: 900;
        }

        .cartbar {
          position: fixed;
          left: 50%;
          bottom: 14px;
          transform: translateX(-50%);
          width: calc(100% - 32px);
          max-width: 398px;
          background: #151515;
          color: white;
          border-radius: 26px;
          padding: 13px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 20px 45px rgba(0,0,0,.28);
          z-index: 80;
        }

        .cartbar p {
          margin: 0;
          font-size: 12px;
          color: #aaa;
          font-weight: 800;
        }

        .cartbar b {
          font-size: 16px;
          font-weight: 900;
        }

        .cartbar button {
          border: 0;
          border-radius: 18px;
          background: #ff4d00;
          color: white;
          padding: 13px 18px;
          font-family: inherit;
          font-weight: 900;
        }
      `}</style>

      <main className="app">
        <section className="hero">
          <img src="/images/khan.jpg" alt="خان قدوري" />

          <div className="topbar">
            <a href="/" className="topbtn">‹</a>
            <button className="topbtn">♡</button>
          </div>

          <div className="hero-info">
            <div className="status">مفتوح الآن</div>
            <h1>خان قدوري</h1>
            <p>أكلات عراقية وفطور أصيل بطعم البيت</p>
            <div className="stats">
              <span>⭐ 4.6</span>
              <span>35-45 د</span>
              <span>توصيل سريع</span>
            </div>
          </div>
        </section>

        <section className="content">
          {checkoutOpen && (
            <div className="checkout">
              <h2>بيانات الطلب</h2>

              <input
                className="input"
                placeholder="اسم الزبون"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />

              <input
                className="input"
                placeholder="رقم الهاتف"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <input
                className="input"
                placeholder="العنوان"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <div className="checkout-list">
                {cart.map((item) => (
                  <div className="checkout-item" key={item.name}>
                    <span>
                      {item.name} × {item.qty}
                    </span>
                    <span>{(item.price * item.qty).toLocaleString()} د.ع</span>
                  </div>
                ))}
              </div>

              <button className="orange-btn" onClick={sendOrder}>
                إرسال الطلب واتساب
              </button>
            </div>
          )}

          <div className="search">
            <input
              placeholder="ابحث عن صنف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? "tab active" : "tab"}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="section-title">
            <span>{filteredItems.length} صنف</span>
            <h2>
              {selectedCategory === "الكل" ? "قائمة الطعام" : selectedCategory}
            </h2>
          </div>

          <section className="items">
            {filteredItems.map((item) => {
              const qty = getQty(item.name);

              return (
                <div className="item" key={item.name}>
                  <div className="item-icon">🍽️</div>

                  <div>
                    <h3>{item.name}</h3>
                    <p className="cat-name">{item.category}</p>

                    <div className="price-row">
                      <div className="price">
                        {item.price.toLocaleString()} د.ع
                      </div>

                      {qty > 0 ? (
                        <div className="qty">
                          <button onClick={() => removeOne(item.name)}>-</button>
                          <span>{qty}</span>
                          <button onClick={() => addToCart(item)}>+</button>
                        </div>
                      ) : (
                        <button className="add" onClick={() => addToCart(item)}>
                          +
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        </section>

        {cartCount > 0 && (
          <div className="cartbar">
            <div>
              <p>السلة</p>
              <b>
                {cartCount} صنف • {total.toLocaleString()} د.ع
              </b>
            </div>

            <button onClick={() => setCheckoutOpen(true)}>إتمام الطلب</button>
          </div>
        )}
      </main>
    </>
  );
}