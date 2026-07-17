 "use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  restaurant: string;
  createdAt?: number;
};

const restaurantName = "فيروز";

export default function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("الفطور");
  const [image, setImage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "menuItems"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as MenuItem[];

      setItems(data.filter((item) => item.restaurant === restaurantName));
    });

    return () => unsub();
  }, []);

  const filteredItems = useMemo(() => {
    const word = search.trim();
    if (!word) return items;

    return items.filter(
      (item) =>
        item.name.includes(word) ||
        item.category.includes(word) ||
        String(item.price).includes(word)
    );
  }, [items, search]);

  async function addItem() {
    if (!name.trim()) return alert("اكتب اسم المنتج");
    if (!price.trim()) return alert("اكتب السعر");

    await addDoc(collection(db, "menuItems"), {
      name: name.trim(),
      price: Number(price),
      category,
      image: image.trim(),
      available: true,
      restaurant: restaurantName,
      createdAt: Date.now(),
    });

    setName("");
    setPrice("");
    setImage("");
    setCategory("الفطور");
  }

  async function toggleAvailable(item: MenuItem) {
    await updateDoc(doc(db, "menuItems", item.id), {
      available: !item.available,
    });
  }

  async function removeItem(item: MenuItem) {
    const ok = confirm(`تحذف ${item.name} من المنيو؟`);
    if (!ok) return;

    await deleteDoc(doc(db, "menuItems", item.id));
  }

  return (
    <section
      style={{
        marginTop: 18,
        border: "1px solid rgba(255,255,255,.10)",
        background: "linear-gradient(135deg, rgba(17,16,14,.98), rgba(7,6,5,.98))",
        borderRadius: 26,
        padding: 18,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, color: "white", fontSize: 24, fontWeight: 950 }}>
            🍽️ إدارة المنيو
          </h2>
          <p style={{ marginTop: 6, color: "#a1a1aa", fontWeight: 800 }}>
            إضافة، حذف، وإخفاء منتجات المطعم
          </p>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث داخل المنيو..."
          style={{
            width: 260,
            height: 44,
            borderRadius: 14,
            background: "#060504",
            border: "1px solid rgba(255,255,255,.12)",
            color: "white",
            padding: "0 14px",
            outline: "none",
            fontWeight: 800,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "1.2fr 120px 150px 1fr 130px",
          gap: 10,
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المنتج" style={inputStyle} />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="السعر" type="number" style={inputStyle} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
          <option>الفطور</option>
          <option>المعجنات</option>
          <option>المشروبات</option>
          <option>سيت منيو</option>
        </select>
        <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="رابط الصورة اختياري" style={inputStyle} />
        <button onClick={addItem} style={orangeButton}>
          + إضافة
        </button>
      </div>

      <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
        {filteredItems.length === 0 ? (
          <div style={emptyStyle}>لا توجد منتجات حالياً</div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} style={rowStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 16,
                    background: item.image ? `url(${item.image}) center/cover` : "#060504",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                  }}
                >
                  {!item.image && "🍽️"}
                </div>

                <div>
                  <p style={{ margin: 0, color: "white", fontSize: 16, fontWeight: 950 }}>
                    {item.name}
                  </p>
                  <p style={{ margin: "5px 0 0", color: "#a1a1aa", fontSize: 12, fontWeight: 800 }}>
                    {item.category}
                  </p>
                </div>
              </div>

              <p style={{ margin: 0, color: "#ffb347", fontWeight: 950 }}>
                {item.price.toLocaleString()} د.ع
              </p>

              <p style={{ margin: 0, color: item.available ? "#22c55e" : "#ef4444", fontWeight: 950 }}>
                {item.available ? "متوفر" : "مخفي"}
              </p>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => toggleAvailable(item)} style={darkButton}>
                  {item.available ? "إخفاء" : "إظهار"}
                </button>
                <button onClick={() => removeItem(item)} style={redButton}>
                  حذف
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  height: 44,
  borderRadius: 14,
  background: "#060504",
  border: "1px solid rgba(255,255,255,.12)",
  color: "white",
  padding: "0 12px",
  outline: "none",
  fontWeight: 800,
};

const orangeButton: React.CSSProperties = {
  border: 0,
  borderRadius: 14,
  background: "#ff7a00",
  color: "#111",
  fontWeight: 950,
  cursor: "pointer",
};

const darkButton: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 12,
  background: "#060504",
  color: "white",
  padding: "9px 12px",
  fontWeight: 900,
  cursor: "pointer",
};

const redButton: React.CSSProperties = {
  ...darkButton,
  border: "1px solid rgba(239,68,68,.35)",
  background: "rgba(239,68,68,.12)",
  color: "#fca5a5",
};

const rowStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 18,
  padding: 14,
  background: "rgba(0,0,0,.22)",
  display: "grid",
  gridTemplateColumns: "1fr 140px 100px 150px",
  alignItems: "center",
  gap: 12,
};

const emptyStyle: React.CSSProperties = {
  border: "1px dashed rgba(255,255,255,.12)",
  borderRadius: 18,
  padding: 24,
  textAlign: "center",
  color: "#71717a",
  fontWeight: 900,
};