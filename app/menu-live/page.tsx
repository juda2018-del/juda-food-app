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
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

type MenuItem = {
  docId: string;
  name: string;
  desc: string;
  price: number;
  category: string;
  restaurant: string;
  emoji: string;
  active: boolean;
  popular?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

type Restaurant = {
  docId: string;
  name: string;
  desc?: string;
  area?: string;
  category?: string;
  emoji?: string;
  active?: boolean;
  open?: boolean;
};

const fallbackRestaurants = ["فيروز", "شلتتة", "خان قدوري", "الفرن"];

const categories = ["فطور", "كاهي", "معجنات", "مشلتت", "حلو", "غداء", "مشروبات"];

const emptyForm = {
  name: "",
  desc: "",
  price: 5000,
  category: "فطور",
  restaurant: "فيروز",
  emoji: "🍳",
  active: true,
  popular: false,
};

const seedItems = [
  {
    name: "مخلمة فيروز",
    desc: "مخلمة عراقية دسمة على الطريقة البغدادية",
    price: 7000,
    category: "فطور",
    restaurant: "فيروز",
    emoji: "🍳",
    active: true,
    popular: true,
  },
  {
    name: "باكلة بالدهن",
    desc: "باكلة حارة مع دهن حر وخبز",
    price: 6000,
    category: "فطور",
    restaurant: "فيروز",
    emoji: "🥣",
    active: true,
    popular: false,
  },
  {
    name: "كاهي وقيمر",
    desc: "كاهي طازج مع قيمر وعسل",
    price: 5000,
    category: "كاهي",
    restaurant: "فيروز",
    emoji: "🥐",
    active: true,
    popular: true,
  },
  {
    name: "بورك جبن",
    desc: "بورك محشي جبن ومحمص",
    price: 4000,
    category: "معجنات",
    restaurant: "فيروز",
    emoji: "🧀",
    active: true,
    popular: false,
  },
  {
    name: "مشلتت سادة",
    desc: "مشلتت خفيف ومقرمش",
    price: 8000,
    category: "مشلتت",
    restaurant: "شلتتة",
    emoji: "🫓",
    active: true,
    popular: true,
  },
  {
    name: "مشلتت نوتيلا",
    desc: "مشلتت حلو بالنوتيلا",
    price: 9000,
    category: "حلو",
    restaurant: "شلتتة",
    emoji: "🍫",
    active: true,
    popular: false,
  },
  {
    name: "كباب خان",
    desc: "كباب عراقي مع خبز وصمون",
    price: 12000,
    category: "غداء",
    restaurant: "خان قدوري",
    emoji: "🍢",
    active: true,
    popular: true,
  },
  {
    name: "تمن ومرگ",
    desc: "تمن عراقي مع مرگ",
    price: 10000,
    category: "غداء",
    restaurant: "خان قدوري",
    emoji: "🍛",
    active: true,
    popular: false,
  },
];

function formatMoney(value?: number) {
  return `${Number(value || 0).toLocaleString("ar-IQ")} د.ع`;
}

function formatDate(value: any) {
  if (!value) return "بدون وقت";

  try {
    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : value instanceof Date
        ? value
        : new Date(value);

    if (isNaN(date.getTime())) return "بدون وقت";

    return date.toLocaleString("ar-IQ", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "بدون وقت";
  }
}

export default function MenuLivePage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [filterRestaurant, setFilterRestaurant] = useState("الكل");
  const [filterCategory, setFilterCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const q = query(collection(db, "menu"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<MenuItem, "docId">),
          docId: item.id,
        }));

        setItems(data);
        setLoading(false);
      },
      () => {
        setLoading(false);
        setToast("صار خطأ بقراءة المنيو من Firestore");
        setTimeout(() => setToast(""), 3500);
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "restaurants"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<Restaurant, "docId">),
          docId: item.id,
        }));

        setRestaurants(data);
        setRestaurantsLoading(false);
      },
      () => {
        setRestaurantsLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const restaurantOptions = useMemo(() => {
    const liveNames = restaurants
      .filter((restaurant) => restaurant.active !== false)
      .map((restaurant) => restaurant.name)
      .filter(Boolean);

    const names = liveNames.length > 0 ? liveNames : fallbackRestaurants;
    return Array.from(new Set(names));
  }, [restaurants]);

  useEffect(() => {
    if (editingId) return;
    if (restaurantOptions.length === 0) return;

    if (!restaurantOptions.includes(form.restaurant)) {
      setForm((prev) => ({
        ...prev,
        restaurant: restaurantOptions[0],
      }));
    }
  }, [restaurantOptions, form.restaurant, editingId]);

  const restaurantMap = useMemo(() => {
    const map = new Map<string, Restaurant>();
    restaurants.forEach((restaurant) => {
      if (restaurant.name) map.set(restaurant.name, restaurant);
    });
    return map;
  }, [restaurants]);

  const filteredItems = useMemo(() => {
    const q = search.trim();

    return items.filter((item) => {
      const matchRestaurant =
        filterRestaurant === "الكل" || item.restaurant === filterRestaurant;

      const matchCategory =
        filterCategory === "الكل" || item.category === filterCategory;

      const matchSearch =
        !q ||
        item.name.includes(q) ||
        item.desc.includes(q) ||
        item.restaurant.includes(q) ||
        item.category.includes(q);

      return matchRestaurant && matchCategory && matchSearch;
    });
  }, [items, filterRestaurant, filterCategory, search]);

  const activeItems = items.filter((item) => item.active).length;
  const inactiveItems = items.filter((item) => !item.active).length;
  const popularItems = items.filter((item) => item.popular).length;
  const averagePrice =
    items.length > 0
      ? Math.round(
          items.reduce((sum, item) => sum + Number(item.price || 0), 0) /
            items.length
        )
      : 0;

  const liveRestaurantsCount = restaurants.filter(
    (restaurant) => restaurant.active !== false && restaurant.open
  ).length;

  async function saveItem() {
    if (!form.name.trim() || !form.desc.trim()) {
      setToast("كمل اسم الصنف والوصف");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    if (!form.restaurant.trim()) {
      setToast("اختار المطعم");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      setToast("السعر لازم يكون صحيح");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await updateDoc(doc(db, "menu", editingId), {
          ...form,
          price: Number(form.price),
          updatedAt: Date.now(),
        });

        setToast("تم تعديل الصنف");
      } else {
        await addDoc(collection(db, "menu"), {
          ...form,
          price: Number(form.price),
          createdAt: serverTimestamp(),
          updatedAt: Date.now(),
        });

        setToast("تمت إضافة الصنف للمنيو");
      }

      setForm({
        ...emptyForm,
        restaurant: restaurantOptions[0] || "فيروز",
      });
      setEditingId("");
      setTimeout(() => setToast(""), 3000);
    } catch {
      setToast("صار خطأ بالحفظ");
      setTimeout(() => setToast(""), 3000);
    } finally {
      setSaving(false);
    }
  }

  function editItem(item: MenuItem) {
    setEditingId(item.docId);
    setForm({
      name: item.name || "",
      desc: item.desc || "",
      price: Number(item.price || 0),
      category: item.category || "فطور",
      restaurant: item.restaurant || restaurantOptions[0] || "فيروز",
      emoji: item.emoji || "🍽️",
      active: Boolean(item.active),
      popular: Boolean(item.popular),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleActive(item: MenuItem) {
    await updateDoc(doc(db, "menu", item.docId), {
      active: !item.active,
      updatedAt: Date.now(),
    });

    setToast(item.active ? "تم تعطيل الصنف" : "تم تفعيل الصنف");
    setTimeout(() => setToast(""), 2500);
  }

  async function togglePopular(item: MenuItem) {
    await updateDoc(doc(db, "menu", item.docId), {
      popular: !item.popular,
      updatedAt: Date.now(),
    });

    setToast(item.popular ? "تم إزالة التمييز" : "تم تمييز الصنف");
    setTimeout(() => setToast(""), 2500);
  }

  async function removeItem(item: MenuItem) {
    const sure = window.confirm(`متأكد تحذف ${item.name}؟`);
    if (!sure) return;

    await deleteDoc(doc(db, "menu", item.docId));

    setToast("تم حذف الصنف");
    setTimeout(() => setToast(""), 2500);
  }

  async function seedMenu() {
    setSaving(true);

    try {
      await Promise.all(
        seedItems.map((item) =>
          addDoc(collection(db, "menu"), {
            ...item,
            createdAt: serverTimestamp(),
            updatedAt: Date.now(),
          })
        )
      );

      setToast("تمت إضافة المنيو التجريبي");
      setTimeout(() => setToast(""), 3500);
    } catch {
      setToast("صار خطأ بإضافة المنيو التجريبي");
      setTimeout(() => setToast(""), 3500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main dir="rtl" className="menu-page">
      <style jsx global>{`
        body {
          margin: 0;
          background: #050505;
        }

        * {
          box-sizing: border-box;
        }

        .menu-page {
          min-height: 100vh;
          color: white;
          background:
            radial-gradient(circle at 12% 8%, rgba(255, 122, 0, 0.18), transparent 32%),
            radial-gradient(circle at 88% 15%, rgba(34, 197, 94, 0.1), transparent 28%),
            radial-gradient(circle at 50% 96%, rgba(56, 189, 248, 0.08), transparent 34%),
            linear-gradient(135deg, #050505, #0d0d10 55%, #050505);
          font-family:
            Cairo,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .shell {
          width: min(1680px, calc(100% - 36px));
          margin: 0 auto;
          padding: 22px 0 42px;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px;
          margin-bottom: 18px;
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(10, 10, 11, 0.78);
          backdrop-filter: blur(18px);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .logo {
          width: 58px;
          height: 58px;
          border-radius: 22px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #ff7a00, #ffc266);
          color: #050505;
          font-size: 24px;
          font-weight: 1000;
          box-shadow: 0 16px 45px rgba(255, 122, 0, 0.28);
        }

        .brand h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 1000;
          letter-spacing: -0.5px;
        }

        .brand p {
          margin: 5px 0 0;
          color: rgba(255, 255, 255, 0.45);
          font-size: 13px;
          font-weight: 850;
        }

        .nav {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .nav a,
        .nav button {
          text-decoration: none;
          border-radius: 999px;
          padding: 12px 16px;
          color: white;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-weight: 1000;
          font-size: 13px;
          cursor: pointer;
        }

        .nav a.main {
          color: #050505;
          background: linear-gradient(135deg, #ff7a00, #ffc266);
          border: 0;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .hero-card,
        .form-card {
          position: relative;
          overflow: hidden;
          min-height: 390px;
          border-radius: 36px;
          padding: 30px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background:
            linear-gradient(135deg, rgba(255, 122, 0, 0.18), transparent 48%),
            rgba(12, 12, 14, 0.82);
          box-shadow: 0 24px 90px rgba(0, 0, 0, 0.34);
        }

        .hero-card::after {
          content: "";
          position: absolute;
          width: 420px;
          height: 420px;
          left: -140px;
          bottom: -170px;
          border-radius: 999px;
          background: rgba(255, 122, 0, 0.19);
          filter: blur(4px);
        }

        .kicker {
          display: inline-flex;
          gap: 8px;
          align-items: center;
          padding: 10px 14px;
          border-radius: 999px;
          color: #ffb86b;
          border: 1px solid rgba(255, 122, 0, 0.24);
          background: rgba(255, 122, 0, 0.11);
          font-size: 13px;
          font-weight: 1000;
        }

        .hero-card h2 {
          position: relative;
          z-index: 1;
          margin: 20px 0 0;
          max-width: 850px;
          font-size: clamp(38px, 5vw, 74px);
          line-height: 1.05;
          letter-spacing: -2px;
          font-weight: 1000;
        }

        .hero-card h2 span {
          color: #ff7a00;
        }

        .hero-card p {
          position: relative;
          z-index: 1;
          margin: 18px 0 0;
          max-width: 740px;
          color: rgba(255, 255, 255, 0.54);
          line-height: 2;
          font-weight: 850;
        }

        .hero-stats {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 25px;
        }

        .mini {
          border-radius: 24px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.32);
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        .mini strong {
          display: block;
          font-size: 25px;
          font-weight: 1000;
        }

        .mini small {
          display: block;
          margin-top: 6px;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 900;
        }

        .form-card h3 {
          margin: 0 0 16px;
          font-size: 24px;
          font-weight: 1000;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .field {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.36);
          color: white;
          outline: none;
          border-radius: 20px;
          padding: 15px 16px;
          font-size: 14px;
          font-weight: 850;
        }

        .field option {
          color: black;
        }

        textarea.field {
          min-height: 96px;
          resize: vertical;
          grid-column: 1 / -1;
        }

        .check-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          grid-column: 1 / -1;
        }

        .check {
          display: flex;
          align-items: center;
          gap: 9px;
          border-radius: 18px;
          padding: 12px 14px;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.7);
          font-weight: 900;
        }

        .buttons {
          display: grid;
          grid-template-columns: 1fr 0.7fr;
          gap: 10px;
          margin-top: 12px;
        }

        .submit,
        .ghost {
          border: 0;
          border-radius: 22px;
          padding: 16px;
          font-weight: 1000;
          cursor: pointer;
          font-size: 15px;
        }

        .submit {
          color: #050505;
          background: linear-gradient(135deg, #ff7a00, #ffc266);
        }

        .ghost {
          color: white;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .submit:disabled,
        .ghost:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .layout {
          display: grid;
          grid-template-columns: 330px 1fr;
          gap: 18px;
          align-items: start;
        }

        .panel {
          border-radius: 34px;
          padding: 18px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(10, 10, 11, 0.8);
          backdrop-filter: blur(18px);
          box-shadow: 0 24px 90px rgba(0, 0, 0, 0.34);
        }

        .panel-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 16px;
        }

        .panel-title h3 {
          margin: 0;
          font-size: 22px;
          font-weight: 1000;
        }

        .filters {
          display: grid;
          gap: 12px;
        }

        .restaurant-note {
          border-radius: 22px;
          padding: 14px;
          background: rgba(255, 122, 0, 0.08);
          border: 1px solid rgba(255, 122, 0, 0.16);
          color: rgba(255, 255, 255, 0.58);
          line-height: 1.9;
          font-weight: 850;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .item-card {
          border-radius: 30px;
          padding: 18px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.025));
        }

        .item-card.off {
          opacity: 0.55;
        }

        .item-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .emoji {
          width: 62px;
          height: 62px;
          border-radius: 23px;
          display: grid;
          place-items: center;
          font-size: 31px;
          background: rgba(255, 122, 0, 0.12);
          border: 1px solid rgba(255, 122, 0, 0.18);
        }

        .badge {
          border-radius: 999px;
          padding: 8px 11px;
          font-size: 12px;
          font-weight: 1000;
        }

        .badge-on {
          color: #bbf7d0;
          background: rgba(34, 197, 94, 0.14);
          border: 1px solid rgba(34, 197, 94, 0.22);
        }

        .badge-off {
          color: #fecaca;
          background: rgba(239, 68, 68, 0.14);
          border: 1px solid rgba(239, 68, 68, 0.22);
        }

        .item-card h4 {
          margin: 16px 0 0;
          font-size: 22px;
          font-weight: 1000;
        }

        .item-card p {
          margin: 8px 0 0;
          color: rgba(255, 255, 255, 0.48);
          line-height: 1.8;
          font-weight: 850;
          min-height: 60px;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .chip {
          border-radius: 999px;
          padding: 8px 11px;
          color: #ffb86b;
          background: rgba(255, 122, 0, 0.1);
          border: 1px solid rgba(255, 122, 0, 0.16);
          font-size: 12px;
          font-weight: 1000;
        }

        .chip-green {
          color: #bbf7d0;
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.18);
        }

        .chip-red {
          color: #fecaca;
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.18);
        }

        .item-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-top: 14px;
        }

        .action {
          border: 0;
          border-radius: 17px;
          padding: 11px 10px;
          font-size: 12px;
          font-weight: 1000;
          cursor: pointer;
        }

        .action-main {
          color: #050505;
          background: linear-gradient(135deg, #ff7a00, #ffc266);
        }

        .action-dark {
          color: white;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .action-red {
          color: #fecaca;
          background: rgba(239, 68, 68, 0.14);
        }

        .empty {
          min-height: 340px;
          display: grid;
          place-items: center;
          border-radius: 28px;
          border: 1px dashed rgba(255, 255, 255, 0.11);
          background: rgba(0, 0, 0, 0.24);
          color: rgba(255, 255, 255, 0.42);
          font-weight: 1000;
          text-align: center;
          line-height: 2;
        }

        .toast {
          position: fixed;
          left: 18px;
          top: 18px;
          z-index: 60;
          padding: 15px 18px;
          border-radius: 22px;
          border: 1px solid rgba(255, 122, 0, 0.32);
          background: rgba(15, 15, 15, 0.96);
          color: #ff7a00;
          font-weight: 1000;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
        }

        @media (max-width: 1320px) {
          .hero,
          .layout {
            grid-template-columns: 1fr;
          }

          .items-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .shell {
            width: min(100% - 24px, 1680px);
            padding-top: 12px;
          }

          .topbar {
            flex-direction: column;
            align-items: stretch;
          }

          .hero-stats,
          .items-grid,
          .form-grid,
          .buttons,
          .item-actions {
            grid-template-columns: 1fr;
          }

          textarea.field,
          .check-row {
            grid-column: auto;
          }

          .hero-card,
          .form-card,
          .panel {
            padding: 18px;
          }
        }
      `}</style>

      {toast && <div className="toast">{toast}</div>}

      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="logo">F</div>
            <div>
              <h1>FUSE Menu Live</h1>
              <p>إدارة المنيو من Firestore — المطاعم تقرأ من Restaurants Admin</p>
            </div>
          </div>

          <nav className="nav">
            <a href="/">الرئيسية</a>
            <a href="/restaurants-admin">المطاعم</a>
            <a href="/live-orders">طلب جديد</a>
            <a href="/restaurant-live">المطعم</a>
            <a href="/reports-live">التقارير</a>
            <a className="main" href="/menu-live">المنيو</a>
            <button onClick={seedMenu} disabled={saving}>
              إضافة منيو تجريبي
            </button>
          </nav>
        </header>

        <section className="hero">
          <div className="hero-card">
            <div className="kicker">🍽️ LIVE MENU + RESTAURANTS</div>

            <h2>
              المنيو صار مربوط ويا <span>المطاعم Live</span>
            </h2>

            <p>
              أي مطعم تضيفه من restaurants-admin راح يظهر هنا بحقل اختيار المطعم.
              وهنا تضيف الأصناف على المطعم الصحيح، وبعدها تظهر تلقائياً بصفحة
              الطلبات.
            </p>

            <div className="hero-stats">
              <div className="mini">
                <strong>{items.length}</strong>
                <small>كل الأصناف</small>
              </div>

              <div className="mini">
                <strong>{activeItems}</strong>
                <small>متاحة</small>
              </div>

              <div className="mini">
                <strong>{liveRestaurantsCount}</strong>
                <small>مطاعم مفتوحة</small>
              </div>

              <div className="mini">
                <strong>{formatMoney(averagePrice)}</strong>
                <small>متوسط السعر</small>
              </div>
            </div>
          </div>

          <aside className="form-card">
            <h3>{editingId ? "تعديل صنف" : "إضافة صنف جديد"}</h3>

            <div className="form-grid">
              <input
                className="field"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="اسم الصنف"
              />

              <input
                className="field"
                value={form.emoji}
                onChange={(event) => setForm({ ...form, emoji: event.target.value })}
                placeholder="Emoji"
              />

              <input
                type="number"
                className="field"
                value={form.price}
                onChange={(event) =>
                  setForm({ ...form, price: Number(event.target.value) })
                }
                placeholder="السعر"
              />

              <select
                className="field"
                value={form.restaurant}
                onChange={(event) =>
                  setForm({ ...form, restaurant: event.target.value })
                }
              >
                {restaurantOptions.map((restaurant) => (
                  <option key={restaurant}>{restaurant}</option>
                ))}
              </select>

              <select
                className="field"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>

              <textarea
                className="field"
                value={form.desc}
                onChange={(event) => setForm({ ...form, desc: event.target.value })}
                placeholder="وصف الصنف"
              />

              <div className="check-row">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      setForm({ ...form, active: event.target.checked })
                    }
                  />
                  متاح
                </label>

                <label className="check">
                  <input
                    type="checkbox"
                    checked={form.popular}
                    onChange={(event) =>
                      setForm({ ...form, popular: event.target.checked })
                    }
                  />
                  مميز
                </label>
              </div>
            </div>

            <div className="buttons">
              <button onClick={saveItem} disabled={saving} className="submit">
                {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديل" : "إضافة للمنيو"}
              </button>

              <button
                onClick={() => {
                  setForm({
                    ...emptyForm,
                    restaurant: restaurantOptions[0] || "فيروز",
                  });
                  setEditingId("");
                }}
                className="ghost"
              >
                تصفير
              </button>
            </div>
          </aside>
        </section>

        <section className="layout">
          <aside className="panel">
            <div className="panel-title">
              <h3>فلترة المنيو</h3>
            </div>

            <div className="filters">
              <input
                className="field"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="بحث باسم الصنف..."
              />

              <select
                className="field"
                value={filterRestaurant}
                onChange={(event) => setFilterRestaurant(event.target.value)}
              >
                <option>الكل</option>
                {restaurantOptions.map((restaurant) => (
                  <option key={restaurant}>{restaurant}</option>
                ))}
              </select>

              <select
                className="field"
                value={filterCategory}
                onChange={(event) => setFilterCategory(event.target.value)}
              >
                <option>الكل</option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>

              <div className="restaurant-note">
                {restaurantsLoading
                  ? "جاري قراءة المطاعم..."
                  : restaurants.length > 0
                  ? `المطاعم مربوطة Live: ${restaurantOptions.length} مطعم فعال`
                  : "ماكو مطاعم مضافة بعد. استخدم Restaurants Admin، أو راح نستخدم الأسماء الاحتياطية مؤقتاً."}
              </div>
            </div>
          </aside>

          <section className="panel">
            <div className="panel-title">
              <h3>الأصناف</h3>
              <span style={{ color: "#FF7A00", fontWeight: 1000 }}>
                {loading ? "تحميل..." : `${filteredItems.length} صنف`}
              </span>
            </div>

            {loading ? (
              <div className="empty">جاري تحميل المنيو...</div>
            ) : filteredItems.length === 0 ? (
              <div className="empty">
                ماكو أصناف بعد.
                <br />
                اضغط إضافة منيو تجريبي أو ضيف صنف من الفورم.
              </div>
            ) : (
              <div className="items-grid">
                {filteredItems.map((item) => {
                  const restaurantInfo = restaurantMap.get(item.restaurant);
                  const restaurantAvailable =
                    !restaurantInfo ||
                    (restaurantInfo.active !== false && restaurantInfo.open !== false);

                  return (
                    <article
                      key={item.docId}
                      className={`item-card ${item.active ? "" : "off"}`}
                    >
                      <div className="item-head">
                        <div className="emoji">{item.emoji || "🍽️"}</div>
                        <span
                          className={`badge ${
                            item.active && restaurantAvailable ? "badge-on" : "badge-off"
                          }`}
                        >
                          {item.active
                            ? restaurantAvailable
                              ? "متاح"
                              : "مطعم مغلق"
                            : "معطل"}
                        </span>
                      </div>

                      <h4>{item.name}</h4>
                      <p>{item.desc}</p>

                      <div className="chips">
                        <span className="chip">{formatMoney(item.price)}</span>
                        <span className="chip">{item.restaurant}</span>
                        <span className="chip">{item.category}</span>
                        {item.popular && <span className="chip">مميز ⭐</span>}
                        {restaurantInfo && (
                          <span
                            className={`chip ${
                              restaurantAvailable ? "chip-green" : "chip-red"
                            }`}
                          >
                            {restaurantAvailable ? "المطعم مفتوح" : "المطعم مغلق"}
                          </span>
                        )}
                        <span className="chip">{formatDate(item.createdAt)}</span>
                      </div>

                      <div className="item-actions">
                        <button onClick={() => editItem(item)} className="action action-main">
                          تعديل
                        </button>

                        <button onClick={() => toggleActive(item)} className="action action-dark">
                          {item.active ? "تعطيل" : "تفعيل"}
                        </button>

                        <button onClick={() => togglePopular(item)} className="action action-dark">
                          {item.popular ? "إزالة مميز" : "تمييز"}
                        </button>

                        <button onClick={() => removeItem(item)} className="action action-red">
                          حذف
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}