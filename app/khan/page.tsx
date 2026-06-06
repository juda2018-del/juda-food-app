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
  { name: "سيت منيو فيروز", price: 30000, category: "سيت منيو" },
];

const categories = ["الكل", "الفطور", "كاهي وبورك", "مشروبات", "سيت منيو"];

export default function Fayrouz() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const filteredItems = menuItems.filter((item) => {
    const byCategory =
      selectedCategory === "الكل" || item.category === selectedCategory;
    const bySearch = item.name.toLowerCase().includes(search.toLowerCase());
    return byCategory && bySearch;
  });

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
      .map((item) => `• ${item.name} × ${item.qty} = ${item.price * item.qty} د.ع`)
      .join("\n");

    const message = `طلب جديد من فيروز

اسم الزبون: ${customerName}
رقم الهاتف: ${phone}
العنوان: ${address}

الطلبات:
${orderText}

عدد الأصناف: ${cartCount}
المجموع: ${total} د.ع`;

    window.open(
      `https://wa.me/9647833778077?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#120018] text-white p-4 pb-28">
      <a
        href="/"
        className="fixed top-4 left-4 bg-white text-black px-4 py-2 rounded-xl font-bold shadow-lg z-50"
      >
        🏠 الرئيسية
      </a>

      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-l from-yellow-500 via-orange-400 to-purple-700 p-6 rounded-3xl mb-5 shadow-2xl">
          <h1 className="text-4xl font-extrabold">مطعم خان قدوري</h1>
          <p className="text-lg mt-2">اطلب مباشرة من خان قدوري عبر الواتساب</p>
        </div>

        <div className="bg-white/10 p-4 rounded-2xl mb-5 border border-white/10">
          <h2 className="text-yellow-300 text-xl font-bold mb-3">
            بيانات الزبون
          </h2>

          <input
            type="text"
            placeholder="اسم الزبون"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full p-3 mb-2 bg-white text-black rounded-xl font-bold"
          />

          <input
            type="text"
            placeholder="رقم الهاتف"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 mb-2 bg-white text-black rounded-xl font-bold"
          />

          <input
            type="text"
            placeholder="العنوان"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-3 bg-white text-black rounded-xl font-bold"
          />
        </div>

        <div className="bg-black/60 p-4 rounded-2xl mb-5 sticky top-2 z-10 border border-yellow-400/40 shadow-xl">
          <div className="text-yellow-300 text-xl font-extrabold mb-3">
            🛒 السلة: {cartCount} صنف | المجموع: {total} د.ع
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCart([])}
              className="bg-red-600 px-4 py-2 rounded-xl font-bold"
            >
              🗑️ تفريغ
            </button>

            <button
              onClick={sendOrder}
              className="bg-green-600 px-4 py-2 rounded-xl font-bold"
            >
              📱 إرسال للواتساب
            </button>
          </div>
        </div>

        {cart.length > 0 && (
          <div className="bg-zinc-900 p-4 rounded-2xl mb-6 border border-purple-400/30">
            <h2 className="text-xl font-bold text-yellow-400 mb-3">طلباتك</h2>

            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.name}
                  className="bg-purple-900 p-4 rounded-2xl flex items-center justify-between gap-3 border border-purple-500"
                >
                  <div className="text-right">
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-sm text-yellow-300 font-bold">
                      {item.price * item.qty} د.ع
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => removeOne(item.name)}
                      className="bg-red-600 w-8 h-8 rounded-full font-bold"
                    >
                      -
                    </button>

                    <span className="font-bold">{item.qty}</span>

                    <button
                      onClick={() => addToCart(item)}
                      className="bg-green-600 w-8 h-8 rounded-full font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <input
          type="text"
          placeholder="ابحث عن صنف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-4 mb-4 bg-white text-black rounded-2xl font-bold border-2 border-yellow-400"
        />

        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl font-extrabold whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-yellow-400 text-black"
                  : "bg-black/60 text-white border border-yellow-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <section className="mb-7">
          <h2 className="text-2xl font-extrabold text-yellow-400 mb-3">
            {selectedCategory === "الكل" ? "كل المنيو" : selectedCategory}
          </h2>

          <div className="grid gap-3">
            {filteredItems.map((item) => (
              <div
                key={item.name}
                className="bg-gradient-to-l from-purple-700 to-purple-900 p-4 rounded-2xl shadow-lg border border-purple-500 flex items-center justify-between gap-3"
              >
                <div className="text-right">
                  <h3 className="text-xl font-bold text-white">{item.name}</h3>

                  <p className="text-yellow-300 font-bold mt-1">
                    {item.price.toLocaleString()} د.ع
                  </p>
                </div>

                <button
                  onClick={() => addToCart(item)}
                  className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-xl font-bold"
                >
                  أضف
                </button>
              </div>
            ))}
          </div>
        </section>

        {cartCount > 0 && (
          <div className="fixed bottom-4 left-4 right-4 z-50">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-extrabold text-xl shadow-2xl"
            >
              🛒 السلة ({cartCount}) | {total} د.ع
            </button>
          </div>
        )}
      </div>
    </main>
  );
}