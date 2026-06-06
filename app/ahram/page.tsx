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

const categories = ["الكل", "المشلتت الأصلي", "قلبض رول", "البيتزا", "مشلتت حلو", "إضافات تغميس"];

export default function Ahram() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [street, setStreet] = useState("");
  const [nearestPoint, setNearestPoint] = useState("");

  const filteredItems = menuItems.filter((item) => {
    const matchCategory = selectedCategory === "الكل" || item.category === selectedCategory;
    const matchSearch = item.name.includes(search);
    return matchCategory && matchSearch;
  });

  const addToCart = (item: Item) => {
    setCart((oldCart) => {
      const found = oldCart.find((x) => x.name === item.name);
      if (found) {
        return oldCart.map((x) =>
          x.name === item.name ? { ...x, qty: x.qty + 1 } : x
        );
      }
      return [...oldCart, { ...item, qty: 1 }];
    });

    setNotice(`تمت إضافة ${item.name}`);
    setTimeout(() => setNotice(""), 1800);
  };

  const removeOne = (name: string) => {
    setCart((oldCart) =>
      oldCart
        .map((x) => (x.name === name ? { ...x, qty: x.qty - 1 } : x))
        .filter((x) => x.qty > 0)
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

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
      .map((item) => `• ${item.name} × ${item.qty} = ${item.price * item.qty} د.ع`)
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
المجموع: ${total} د.ع`;

    window.open(
      `https://wa.me/9647725859000?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-orange-500 via-orange-800 to-black text-white p-5 pb-32">
      <a
        href="/"
        className="fixed top-4 left-4 bg-white text-black px-4 py-2 rounded-xl font-bold shadow-lg z-50"
      >
        🏠 الرئيسية
      </a>

      {notice && (
        <div className="fixed top-16 left-4 right-4 z-50 bg-green-600 text-white text-center py-3 rounded-2xl font-extrabold shadow-2xl">
          ✅ {notice}
        </div>
      )}

      <div className="max-w-md mx-auto">
        <div className="bg-black/50 rounded-3xl p-4 mb-5 border border-yellow-400/40 shadow-2xl">
          <img
            src="/images/ahram.jpg"
            alt="شلتتة"
            className="w-full max-h-64 object-contain rounded-2xl bg-white p-3"
          />

          <h1 className="text-5xl font-extrabold text-center text-yellow-300 mt-4">
            شلتتة
          </h1>

          <p className="text-center text-white font-bold mt-2">
            زيونة - قرب كاهي فيروز
          </p>
        </div>

        <div id="cart" className="bg-black/85 rounded-3xl p-4 mb-7 border-2 border-yellow-400 shadow-2xl">
          <h2 className="text-yellow-300 text-2xl font-extrabold mb-4 text-center">
            السلة وبيانات التوصيل
          </h2>

          <div className="space-y-3 mb-5">
            <input className="w-full p-3 rounded-xl bg-white text-black placeholder-gray-600 border-2 border-yellow-400 font-bold" placeholder="اسم الزبون" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <input className="w-full p-3 rounded-xl bg-white text-black placeholder-gray-600 border-2 border-yellow-400 font-bold" placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className="w-full p-3 rounded-xl bg-white text-black placeholder-gray-600 border-2 border-yellow-400 font-bold" placeholder="المنطقة" value={area} onChange={(e) => setArea(e.target.value)} />
            <input className="w-full p-3 rounded-xl bg-white text-black placeholder-gray-600 border-2 border-yellow-400 font-bold" placeholder="الشارع" value={street} onChange={(e) => setStreet(e.target.value)} />
            <input className="w-full p-3 rounded-xl bg-white text-black placeholder-gray-600 border-2 border-yellow-400 font-bold" placeholder="أقرب نقطة دالة" value={nearestPoint} onChange={(e) => setNearestPoint(e.target.value)} />
          </div>

          <h3 className="text-yellow-300 text-xl font-extrabold mb-3">
            الطلبات | {cartCount} صنف | المجموع: {total.toLocaleString()} د.ع
          </h3>

          {cart.length === 0 ? (
            <p className="text-white font-bold">السلة فارغة</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.name} className="flex justify-between items-center border-b border-yellow-400/30 pb-3">
                  <div>
                    <p className="font-extrabold text-white">{item.name}</p>
                    <p className="text-yellow-200 font-bold">
                      {item.qty} × {item.price.toLocaleString()} = {(item.qty * item.price).toLocaleString()} د.ع
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => addToCart(item)} className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold">+</button>
                    <button onClick={() => removeOne(item.name)} className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold">-</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={sendOrder} className="w-full bg-green-500 text-white py-4 rounded-xl font-extrabold mt-4 text-lg shadow-lg">
            إرسال الطلب واتساب
          </button>
        </div>

        <input
          className="w-full p-4 rounded-2xl bg-white text-black placeholder-gray-600 border-2 border-yellow-400 font-bold mb-4"
          placeholder="ابحث عن صنف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-2 overflow-x-auto mb-5 pb-2 sticky top-2 z-20 bg-orange-800/90 p-2 rounded-2xl backdrop-blur">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl font-extrabold whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-yellow-400 text-black"
                  : "bg-black/70 text-white border border-yellow-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <section className="mb-8">
          <h2 className="text-3xl font-extrabold text-yellow-300 mb-3">
            {selectedCategory === "الكل" ? "كل المنيو" : selectedCategory}
          </h2>

          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div key={item.name} className="bg-black/75 rounded-3xl overflow-hidden border border-yellow-400/40 shadow-xl">
                {item.category !== "إضافات تغميس" && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-52 object-cover bg-white"
                  />
                )}

                <div className="p-4">
                  <h3 className="font-extrabold text-white text-xl">
                    {item.name}
                  </h3>

                  <p className="text-yellow-200 font-bold mb-3">
                    {item.price.toLocaleString()} د.ع
                  </p>

                  <button
                    onClick={() => addToCart(item)}
                    className="w-full bg-yellow-400 text-black py-3 rounded-xl font-extrabold"
                  >
                    أضف للسلة
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {cartCount > 0 && (
          <div className="fixed bottom-4 left-4 right-4 z-50">
            <button
              className="w-full bg-green-500 text-white py-4 rounded-2xl font-extrabold text-xl shadow-2xl"
              onClick={() =>
                document.getElementById("cart")?.scrollIntoView({
                  behavior: "smooth",
                })
              }
            >
              🛒 السلة ({cartCount}) | {total.toLocaleString()} د.ع
            </button>
          </div>
        )}
      </div>
    </main>
  );
}