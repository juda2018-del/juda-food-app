"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

type MenuItem = {
  name: string;
  price: number;
  category: string;
  restaurant?: string;
  image?: string;
  active?: boolean;
};

type CartItem = MenuItem & {
  qty: number;
};

const categories = ["الكل", "الفطور", "كاهي وبورك", "مشروبات", "سيت منيو"];

export default function Fayrouz() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "menuItems"), (snapshot) => {
      const data = snapshot.docs
        .map((doc) => doc.data() as MenuItem)
        .filter((item) => item.active !== false)
        .filter((item) => !item.restaurant || item.restaurant === "فيروز");

      setMenuItems(data);
    });

    return () => unsubscribe();
  }, []);

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

  const sendOrder = async () => {
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

    const message = `طلب جديد من فيروز

اسم الزبون: ${customerName}
رقم الهاتف: ${phone}
العنوان: ${address}

الطلبات:
${orderText}

عدد الأصناف: ${cartCount}
المجموع: ${total.toLocaleString()} د.ع`;

    const newOrder = {
      id: Date.now(),
      restaurant: "فيروز",
      customerName,
      phone,
      address,
      items: cart,
      total,
      status: "جديد",
      createdAt: new Date().toLocaleString("ar-IQ"),
    };

    localStorage.setItem(
      "orders",
      JSON.stringify([
        newOrder,
        ...JSON.parse(localStorage.getItem("orders") || "[]"),
      ])
    );

    await addDoc(collection(db, "orders"), newOrder);

    window.open(
  `https://wa.me/9647733778077?text=${encodeURIComponent(message)}`,
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
          <h1 className="text-4xl font-extrabold">مطعم فيروز</h1>
          <p className="text-lg mt-2">اطلب مباشرة من فيروز عبر الواتساب</p>
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
            🛒 السلة: {cartCount} صنف | المجموع: {total.toLocaleString()} د.ع
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
              {cart.map((item, index) => (
                <div
                  key={`cart-${item.name}-${index}`}
                  className="bg-purple-900 p-4 rounded-2xl flex items-center justify-between gap-3 border border-purple-500"
                >
                  <div>
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-sm text-yellow-300 font-bold">
                      {(item.price * item.qty).toLocaleString()} د.ع
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
            {filteredItems.map((item, index) => (
              <div
                key={`menu-${item.name}-${item.category}-${index}`}
                className="bg-gradient-to-l from-purple-700 to-purple-900 p-4 rounded-2xl shadow-lg border border-purple-500 flex items-center justify-between gap-3"
              >
                <div>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-20 object-cover rounded-xl mb-2 bg-white"
                    />
                  )}

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
      </div>
    </main>
  );
}