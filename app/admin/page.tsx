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
import { db } from "../firebase";
export default function MenuAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("الفطور");
  const [restaurant, setRestaurant] = useState("فيروز");
  const [image, setImage] = useState("");

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
      category,
      restaurant,
      image,
      active: true,
      createdAt: Date.now(),
    });

    setName("");
    setPrice("");
    setImage("");
    alert("تمت إضافة الصنف");
  };

  const deleteItem = async (docId: string) => {
    if (!confirm("تريد تحذف هذا الصنف؟")) return;
    await deleteDoc(doc(db, "menuItems", docId));
  };

  return (
    <main className="min-h-screen bg-black text-white p-6" dir="rtl">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">
        إدارة المنيو
      </h1>

      <div className="max-w-md space-y-3 mb-8">
        <select
          value={restaurant}
          onChange={(e) => setRestaurant(e.target.value)}
          className="w-full p-3 rounded bg-zinc-800"
        >
          <option>فيروز</option>
          <option>شلتتة</option>
          <option>خان قدوري</option>
        </select>

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
          <option>المشلتت الأصلي</option>
          <option>قلبض رول</option>
          <option>البيتزا</option>
          <option>مشلتت حلو</option>
          <option>إضافات تغميس</option>
        </select>

        <input
          placeholder="رابط الصورة أو اسمها مثل /images/m1.jpg"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="w-full p-3 rounded bg-zinc-800"
        />

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
            className="bg-zinc-800 border border-yellow-500 rounded-xl p-4"
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-40 object-cover rounded-xl mb-3 bg-white"
              />
            )}

            <p className="font-bold text-yellow-400 text-xl">{item.name}</p>
            <p>{item.price} د.ع</p>
            <p className="text-sm text-gray-300">{item.restaurant}</p>
            <p className="text-sm text-gray-300">{item.category}</p>

            <button
              onClick={() => deleteItem(item.docId)}
              className="bg-red-600 px-3 py-2 rounded-lg mt-3"
            >
              حذف
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}