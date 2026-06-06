"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";

const fayrouzMenu = [
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

export default function MenuAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("الفطور");

  useEffect(() => {
    const q = query(collection(db, "menuItems"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        docId: item.id,
        ...item.data(),
      }));

      setItems(data);
    });

    return () => unsubscribe();
  }, []);

  const addItem = async () => {
    if (!name || !price) {
      alert("اكتب اسم الصنف والسعر");
      return;
    }

    await addDoc(collection(db, "menuItems"), {
      name,
      price: Number(price),
      restaurant: "فيروز",
      category,
      active: true,
      createdAt: Date.now(),
    });

    setName("");
    setPrice("");
    alert("تمت إضافة الصنف");
  };

  const loadFayrouzMenu = async () => {
    if (!confirm("تريد تحميل منيو فيروز كامل؟")) return;

    for (const item of fayrouzMenu) {
      await addDoc(collection(db, "menuItems"), {
        ...item,
        restaurant: "فيروز",
        active: true,
        createdAt: Date.now(),
      });
    }

    alert("تم تحميل منيو فيروز بالكامل");
  };

  const deleteItem = async (docId: string) => {
    if (!confirm("تريد تحذف هذا الصنف؟")) return;
    await deleteDoc(doc(db, "menuItems", docId));
  };

  return (
    <div className="min-h-screen bg-black text-white p-6" dir="rtl">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">
        إدارة المنيو
      </h1>

      <div className="max-w-md space-y-4 mb-8">
        <button
          onClick={loadFayrouzMenu}
          className="bg-yellow-500 text-black px-4 py-3 rounded-lg w-full font-bold"
        >
          تحميل منيو فيروز كامل
        </button>

        <input
          placeholder="اسم الصنف"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 rounded bg-zinc-800"
        />

        <input
          placeholder="السعر"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-3 rounded bg-zinc-800"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-3 rounded bg-zinc-800"
        >
          <option>الفطور</option>
          <option>كاهي وبورك</option>
          <option>مشروبات</option>
          <option>سيت منيو</option>
        </select>

        <button
          onClick={addItem}
          className="bg-green-600 px-4 py-3 rounded-lg w-full font-bold"
        >
          إضافة صنف
        </button>
      </div>

      <div className="max-w-md space-y-3">
        {items.map((item) => (
          <div
            key={item.docId}
            className="bg-zinc-800 border border-yellow-500 rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-bold text-yellow-400">{item.name}</p>
              <p>{item.price} د.ع</p>
              <p className="text-sm text-gray-300">{item.category}</p>
            </div>

            <button
              onClick={() => deleteItem(item.docId)}
              className="bg-red-600 px-3 py-2 rounded-lg"
            >
              حذف
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}