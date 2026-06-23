 "use client";

import { useState } from "react";

type Item = {
  name: string;
  price: number;
  category: string;
  image: string;
};

type CartItem = Item & { qty: number };

const menuItems: Item[] = [
  { name: "مشلتت سادة", price: 9000, category: "المشلتت الأصلي", image: "/images/m4.jpg" },
  { name: "فطير جبن موزريلا", price: 12000, category: "المشلتت الأصلي", image: "/images/m4.jpg" },
  { name: "فطير مكس جبن", price: 13000, category: "المشلتت الأصلي", image: "/images/m6.jpg" },
  { name: "فطير خضروات", price: 14000, category: "المشلتت الأصلي", image: "/images/m3.jpg" },
  { name: "فطير دجاج", price: 14000, category: "المشلتت الأصلي", image: "/images/m6.jpg" },
  { name: "فطير سجق", price: 14000, category: "المشلتت الأصلي", image: "/images/m5.jpg" },
  { name: "فطير لحم مثروم", price: 14000, category: "المشلتت الأصلي", image: "/images/m6.jpg" },
  { name: "فطير باسطرمة", price: 14000, category: "المشلتت الأصلي", image: "/images/m1.jpg" },
  { name: "فطير شلتتة برو ماكس", price: 16000, category: "المشلتت الأصلي", image: "/images/m5.jpg" },

  { name: "قلبض رول جبن", price: 12000, category: "قلبض رول", image: "/images/m8.jpg" },
  { name: "قلبض رول خضروات", price: 12000, category: "قلبض رول", image: "/images/m8.jpg" },
  { name: "قلبض رول دجاج", price: 14000, category: "قلبض رول", image: "/images/m9.jpg" },
  { name: "قلبض رول سجق", price: 14000, category: "قلبض رول", image: "/images/m9.jpg" },
  { name: "قلبض رول لحم", price: 14000, category: "قلبض رول", image: "/images/m9.jpg" },
  { name: "قلبض رول باسطرمة", price: 14000, category: "قلبض رول", image: "/images/m8.jpg" },

  { name: "بيتزا مارغريتا وسط", price: 10000, category: "البيتزا", image: "/images/m1.jpg" },
  { name: "بيتزا مارغريتا كبير", price: 12000, category: "البيتزا", image: "/images/m2.jpg" },
  { name: "بيتزا خضروات وسط", price: 10000, category: "البيتزا", image: "/images/m3.jpg" },
  { name: "بيتزا خضروات كبير", price: 12000, category: "البيتزا", image: "/images/m3.jpg" },
  { name: "بيتزا دجاج وسط", price: 12000, category: "البيتزا", image: "/images/m5.jpg" },
  { name: "بيتزا دجاج كبير", price: 14000, category: "البيتزا", image: "/images/m5.jpg" },
  { name: "بيتزا سجق وسط", price: 12000, category: "البيتزا", image: "/images/m7.jpg" },
  { name: "بيتزا سجق كبير", price: 14000, category: "البيتزا", image: "/images/m7.jpg" },
  { name: "بيتزا باسطرمة وسط", price: 12000, category: "البيتزا", image: "/images/m1.jpg" },
  { name: "بيتزا باسطرمة كبير", price: 14000, category: "البيتزا", image: "/images/m2.jpg" },
  { name: "بيتزا شلتتة برو ماكس وسط", price: 14000, category: "البيتزا", image: "/images/m5.jpg" },
  { name: "بيتزا شلتتة برو ماكس كبير", price: 16000, category: "البيتزا", image: "/images/m5.jpg" },

  { name: "مشلتت نوتيلا", price: 8000, category: "مشلتت حلو", image: "/images/m10.jpg" },
  { name: "مشلتت بستاشيو", price: 8000, category: "مشلتت حلو", image: "/images/m10.jpg" },
  { name: "مشلتت لوتس", price: 8000, category: "مشلتت حلو", image: "/images/m10.jpg" },
  { name: "مشلتت حلو برو ماكس", price: 10000, category: "مشلتت حلو", image: "/images/m10.jpg" },

  { name: "قيمر عرب", price: 3000, category: "إضافات تغميس", image: "/images/ahram.jpg" },
  { name: "عسل", price: 2500, category: "إضافات تغميس", image: "/images/ahram.jpg" },
  { name: "راشي", price: 2500, category: "إضافات تغميس", image: "/images/ahram.jpg" },
  { name: "دبس", price: 1500, category: "إضافات تغميس", image: "/images/ahram.jpg" },
];

const categories = [
  "الكل",
  "المشلتت الأصلي",
  "قلبض رول",
  "البيتزا",
  "مشلتت حلو",
  "إضافات تغميس",
];

export default function Ahram() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [street, setStreet] = useState("");
  const [nearestPoint, setNearestPoint] = useState("");

  const filteredItems = menuItems.filter((item) => {
    const byCategory =
      selectedCategory === "الكل" || item.category === selectedCategory;
    const bySearch = item.name.toLowerCase().includes(search.toLowerCase());
    return byCategory && bySearch;
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const getQty = (name: string) =>
    cart.find((item) => item.name === name)?.qty || 0;

  const addToCart = (item: Item) => {
    setCart((old) => {
      const found = old.find((x) => x.name === item.name);
      if (found) {
        return old.map((x) =>
          x.name === item.name ? { ...x, qty: x.qty + 1 } : x
        );
      }
      return [...old, { ...item, qty: 1 }];
    });
  };

  const removeOne = (name: string) => {
    setCart((old) =>
      old
        .map((x) => (x.name === name ? { ...x, qty: x.qty - 1 } : x))
        .filter((x) => x.qty > 0)
    );
  };

  const sendOrder = () => {
    if (!customerName || !phone || !area || !street || !nearestPoint) {
      alert("اكتب بيانات التوصيل كاملة");
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

    const message = `طلب جديد من شلتتة

اسم الزبون: ${customerName}
رقم الهاتف: ${phone}
المنطقة: ${area}
الشارع: ${street}
أقرب نقطة دالة: ${nearestPoint}

الطلبات:
${orderText}

عدد الأصناف: ${cartCount}
المجموع: ${total.toLocaleString()} د.ع`;

    setCart([]);
    setCheckoutOpen(false);

    window.open(
      `https://wa.me/9647725859000?text=${encodeURIComponent(message)}`,
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
          grid-template-columns: 102px 1fr;
          gap: 13px;
          box-shadow: 0 12px 30px rgba(0,0,0,.07);
        }

        .item-img {
          width: 102px;
          height: 102px;
          border-radius: 22px;
          overflow: hidden;
          background: #f5f1eb;
          display: grid;
          place-items: center;
          font-size: 34px;
        }

        .item-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
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
          <img src="/images/ahram.jpg" alt="شلتتة" />

          <div className="topbar">
            <a href="/" className="topbtn">‹</a>
            <button className="topbtn">♡</button>
          </div>

          <div className="hero-info">
            <div className="status">مفتوح الآن</div>
            <h1>شلتتة</h1>
            <p>مشلتت، فطائر، بيتزا وقلبض رول</p>
            <div className="stats">
              <span>⭐ 4.7</span>
              <span>30-40 د</span>
              <span>زيونة - قرب كاهي فيروز</span>
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
                placeholder="المنطقة"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />

              <input
                className="input"
                placeholder="الشارع"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />

              <input
                className="input"
                placeholder="أقرب نقطة دالة"
                value={nearestPoint}
                onChange={(e) => setNearestPoint(e.target.value)}
              />

              <div className="checkout-list">
                {cart.map((item) => (
                  <div className="checkout-item" key={item.name}>
                    <span>{item.name} × {item.qty}</span>
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
                  <div className="item-img">
                    {item.category === "إضافات تغميس" ? (
                      "🥣"
                    ) : (
                      <img src={item.image} alt={item.name} />
                    )}
                  </div>

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
              <b>{cartCount} صنف • {total.toLocaleString()} د.ع</b>
            </div>

            <button onClick={() => setCheckoutOpen(true)}>إتمام الطلب</button>
          </div>
        )}
      </main>
    </>
  );
}