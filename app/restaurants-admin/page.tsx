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

type Restaurant = {
  docId: string;
  name: string;
  desc: string;
  area: string;
  address: string;
  phone: string;
  category: string;
  emoji: string;
  active: boolean;
  open: boolean;
  rating: number;
  deliveryFee: number;
  minOrder: number;
  deliveryTime: string;
  createdAt?: any;
  updatedAt?: any;
};

type LiveOrder = {
  docId: string;
  restaurant?: string;
  total?: number;
  amount?: number;
  status?: string;
  createdAt?: any;
};

const emptyForm = {
  name: "",
  desc: "",
  area: "زيونة",
  address: "زيونة - قرب كاهي فيروز",
  phone: "07800000000",
  category: "فطور",
  emoji: "🍽️",
  active: true,
  open: true,
  rating: 4.8,
  deliveryFee: 2000,
  minOrder: 5000,
  deliveryTime: "25 - 35 دقيقة",
};

const areas = [
  "زيونة",
  "الكرادة",
  "المنصور",
  "الأعظمية",
  "الجادرية",
  "بغداد الجديدة",
  "اليرموك",
  "الحارثية",
];

const categories = [
  "فطور",
  "غداء",
  "مشلتت",
  "كاهي",
  "معجنات",
  "حلويات",
  "مشروبات",
  "مطعم عراقي",
];

const seedRestaurants = [
  {
    name: "فيروز",
    desc: "فطور عراقي، كاهي، بورك، مخلمة وباكلە",
    area: "زيونة",
    address: "زيونة - قرب كاهي فيروز",
    phone: "07800000001",
    category: "فطور",
    emoji: "🍳",
    active: true,
    open: true,
    rating: 4.9,
    deliveryFee: 2000,
    minOrder: 5000,
    deliveryTime: "20 - 30 دقيقة",
  },
  {
    name: "شلتتة",
    desc: "مشلتت وفطائر وحلويات نوتيلا وعسل",
    area: "زيونة",
    address: "زيونة - شارع المطاعم",
    phone: "07800000002",
    category: "مشلتت",
    emoji: "🫓",
    active: true,
    open: true,
    rating: 4.7,
    deliveryFee: 2000,
    minOrder: 7000,
    deliveryTime: "25 - 35 دقيقة",
  },
  {
    name: "خان قدوري",
    desc: "أكل عراقي، كباب، تمن ومرگ",
    area: "الكرادة",
    address: "الكرادة داخل",
    phone: "07800000003",
    category: "مطعم عراقي",
    emoji: "🍢",
    active: true,
    open: true,
    rating: 4.6,
    deliveryFee: 2500,
    minOrder: 10000,
    deliveryTime: "30 - 40 دقيقة",
  },
  {
    name: "الفرن",
    desc: "مناقيش، معجنات، كريبات ووافل",
    area: "المنصور",
    address: "المنصور - شارع المطاعم",
    phone: "07800000004",
    category: "معجنات",
    emoji: "🥐",
    active: true,
    open: false,
    rating: 4.8,
    deliveryFee: 2500,
    minOrder: 8000,
    deliveryTime: "25 - 35 دقيقة",
  },
];

function formatMoney(value?: number) {
  return `${Number(value || 0).toLocaleString("ar-IQ")} د.ع`;
}

function getOrderTotal(order: LiveOrder) {
  return Number(order.total || order.amount || 0);
}

function normalizeStatus(status?: string) {
  if (status === "جاهز") return "جاهز للتوصيل";
  return status || "جديد";
}

function cleanPhone(phone?: string) {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

function whatsappPhone(phone?: string) {
  const cleaned = cleanPhone(phone);
  if (!cleaned) return "";
  if (cleaned.startsWith("964")) return cleaned;
  if (cleaned.startsWith("0")) return `964${cleaned.slice(1)}`;
  return cleaned;
}

export default function RestaurantsAdminPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("الكل");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [toast, setToast] = useState("");
  const [form, setForm] = useState(emptyForm);

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
        setLoading(false);
      },
      () => {
        setLoading(false);
        setToast("صار خطأ بقراءة المطاعم من Firestore");
        setTimeout(() => setToast(""), 3500);
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<LiveOrder, "docId">),
          docId: item.id,
        }));

        setOrders(data);
      },
      () => {}
    );

    return () => unsub();
  }, []);

  const restaurantStats = useMemo(() => {
    const map = new Map<
      string,
      {
        orders: number;
        delivered: number;
        active: number;
        revenue: number;
      }
    >();

    restaurants.forEach((restaurant) => {
      map.set(restaurant.name, {
        orders: 0,
        delivered: 0,
        active: 0,
        revenue: 0,
      });
    });

    orders.forEach((order) => {
      if (!order.restaurant) return;

      const current =
        map.get(order.restaurant) || {
          orders: 0,
          delivered: 0,
          active: 0,
          revenue: 0,
        };

      const status = normalizeStatus(order.status);

      current.orders += 1;

      if (status === "تم التسليم") {
        current.delivered += 1;
        current.revenue += getOrderTotal(order);
      }

      if (!["تم التسليم", "مرفوض"].includes(status)) {
        current.active += 1;
      }

      map.set(order.restaurant, current);
    });

    return map;
  }, [restaurants, orders]);

  const filteredRestaurants = useMemo(() => {
    const q = search.trim();

    return restaurants.filter((restaurant) => {
      const matchSearch =
        !q ||
        restaurant.name.includes(q) ||
        restaurant.desc.includes(q) ||
        restaurant.area.includes(q) ||
        restaurant.category.includes(q);

      const matchArea = areaFilter === "الكل" || restaurant.area === areaFilter;

      const matchStatus =
        statusFilter === "الكل" ||
        (statusFilter === "مفتوح" && restaurant.open) ||
        (statusFilter === "مغلق" && !restaurant.open) ||
        (statusFilter === "فعال" && restaurant.active) ||
        (statusFilter === "موقوف" && !restaurant.active);

      return matchSearch && matchArea && matchStatus;
    });
  }, [restaurants, search, areaFilter, statusFilter]);

  const activeRestaurants = restaurants.filter(
    (restaurant) => restaurant.active !== false
  ).length;

  const openRestaurants = restaurants.filter(
    (restaurant) => restaurant.active !== false && restaurant.open
  ).length;

  const closedRestaurants = restaurants.filter(
    (restaurant) => !restaurant.open
  ).length;

  const totalRevenue = restaurants.reduce((sum, restaurant) => {
    return sum + (restaurantStats.get(restaurant.name)?.revenue || 0);
  }, 0);

  const totalOrders = restaurants.reduce((sum, restaurant) => {
    return sum + (restaurantStats.get(restaurant.name)?.orders || 0);
  }, 0);

  async function saveRestaurant() {
    if (!form.name.trim() || !form.desc.trim()) {
      setToast("كمل اسم المطعم والوصف");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        rating: Number(form.rating || 0),
        deliveryFee: Number(form.deliveryFee || 0),
        minOrder: Number(form.minOrder || 0),
        updatedAt: Date.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, "restaurants", editingId), payload);
        setToast("تم تعديل المطعم");
      } else {
        await addDoc(collection(db, "restaurants"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setToast("تمت إضافة المطعم");
      }

      setForm(emptyForm);
      setEditingId("");
      setTimeout(() => setToast(""), 3000);
    } catch {
      setToast("صار خطأ بحفظ المطعم");
      setTimeout(() => setToast(""), 3000);
    } finally {
      setSaving(false);
    }
  }

  function editRestaurant(restaurant: Restaurant) {
    setEditingId(restaurant.docId);
    setForm({
      name: restaurant.name || "",
      desc: restaurant.desc || "",
      area: restaurant.area || "زيونة",
      address: restaurant.address || "",
      phone: restaurant.phone || "",
      category: restaurant.category || "فطور",
      emoji: restaurant.emoji || "🍽️",
      active: restaurant.active !== false,
      open: Boolean(restaurant.open),
      rating: Number(restaurant.rating || 4.8),
      deliveryFee: Number(restaurant.deliveryFee || 2000),
      minOrder: Number(restaurant.minOrder || 5000),
      deliveryTime: restaurant.deliveryTime || "25 - 35 دقيقة",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleOpen(restaurant: Restaurant) {
    await updateDoc(doc(db, "restaurants", restaurant.docId), {
      open: !restaurant.open,
      updatedAt: Date.now(),
    });

    setToast(restaurant.open ? "تم إغلاق المطعم" : "تم فتح المطعم");
    setTimeout(() => setToast(""), 2500);
  }

  async function toggleActive(restaurant: Restaurant) {
    await updateDoc(doc(db, "restaurants", restaurant.docId), {
      active: !restaurant.active,
      updatedAt: Date.now(),
    });

    setToast(restaurant.active ? "تم إيقاف المطعم" : "تم تفعيل المطعم");
    setTimeout(() => setToast(""), 2500);
  }

  async function removeRestaurant(restaurant: Restaurant) {
    const sure = window.confirm(`متأكد تحذف ${restaurant.name}؟`);
    if (!sure) return;

    await deleteDoc(doc(db, "restaurants", restaurant.docId));

    setToast("تم حذف المطعم");
    setTimeout(() => setToast(""), 2500);
  }

  async function seedRestaurantsToFirestore() {
    setSaving(true);

    try {
      await Promise.all(
        seedRestaurants.map((restaurant) =>
          addDoc(collection(db, "restaurants"), {
            ...restaurant,
            createdAt: serverTimestamp(),
            updatedAt: Date.now(),
          })
        )
      );

      setToast("تمت إضافة المطاعم التجريبية");
      setTimeout(() => setToast(""), 3500);
    } catch {
      setToast("صار خطأ بإضافة المطاعم");
      setTimeout(() => setToast(""), 3500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main dir="rtl" className="restaurants-page">
      <style jsx global>{`
        body {
          margin: 0;
          background: #050505;
        }

        * {
          box-sizing: border-box;
        }

        .restaurants-page {
          min-height: 100vh;
          color: white;
          background:
            radial-gradient(circle at 12% 8%, rgba(255, 122, 0, 0.18), transparent 32%),
            radial-gradient(circle at 88% 15%, rgba(34, 197, 94, 0.12), transparent 28%),
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
          min-height: 410px;
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

        .restaurants-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .restaurant-card {
          border-radius: 30px;
          padding: 18px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.025));
        }

        .restaurant-card.off {
          opacity: 0.58;
        }

        .restaurant-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .avatar {
          width: 64px;
          height: 64px;
          border-radius: 24px;
          display: grid;
          place-items: center;
          font-size: 30px;
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

        .restaurant-card h4 {
          margin: 16px 0 0;
          font-size: 22px;
          font-weight: 1000;
        }

        .restaurant-card p {
          margin: 8px 0 0;
          color: rgba(255, 255, 255, 0.48);
          line-height: 1.8;
          font-weight: 850;
          min-height: 52px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 14px;
        }

        .info {
          border-radius: 20px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.055);
        }

        .info small {
          display: block;
          color: rgba(255, 255, 255, 0.34);
          font-weight: 900;
        }

        .info strong {
          display: block;
          margin-top: 6px;
          font-size: 13px;
          font-weight: 1000;
          line-height: 1.6;
        }

        .restaurant-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-top: 14px;
        }

        .action {
          border: 0;
          text-decoration: none;
          text-align: center;
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

        .action-green {
          color: #bbf7d0;
          background: rgba(34, 197, 94, 0.14);
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

          .restaurants-grid {
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
          .restaurants-grid,
          .form-grid,
          .buttons,
          .restaurant-actions,
          .stats-grid {
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
              <h1>FUSE Restaurants Admin</h1>
              <p>إدارة المطاعم من Firestore — فتح، إغلاق، مناطق، توصيل، تقييم</p>
            </div>
          </div>

          <nav className="nav">
            <a href="/">الرئيسية</a>
            <a href="/menu-live">المنيو</a>
            <a href="/restaurant-live">لوحة المطعم</a>
            <a href="/reports-live">التقارير</a>
            <a className="main" href="/restaurants-admin">المطاعم</a>
            <button onClick={seedRestaurantsToFirestore} disabled={saving}>
              إضافة مطاعم تجريبية
            </button>
          </nav>
        </header>

        <section className="hero">
          <div className="hero-card">
            <div className="kicker">🏪 LIVE RESTAURANTS MANAGEMENT</div>

            <h2>
              نخلي مطاعم فيوز <span>Live</span>
            </h2>

            <p>
              هاي صفحة إدارة المطاعم. من هنا تضيف مطعم، تفتحه أو تغلقه، تغيّر
              منطقة المطعم، رسوم التوصيل، الحد الأدنى، والتقييم. الخطوة الجاية
              نربط المنيو والطلبات بهاي القائمة.
            </p>

            <div className="hero-stats">
              <div className="mini">
                <strong>{restaurants.length}</strong>
                <small>كل المطاعم</small>
              </div>

              <div className="mini">
                <strong>{openRestaurants}</strong>
                <small>مفتوحة</small>
              </div>

              <div className="mini">
                <strong>{totalOrders}</strong>
                <small>طلبات</small>
              </div>

              <div className="mini">
                <strong>{formatMoney(totalRevenue)}</strong>
                <small>مبيعات مسلّمة</small>
              </div>
            </div>
          </div>

          <aside className="form-card">
            <h3>{editingId ? "تعديل مطعم" : "إضافة مطعم جديد"}</h3>

            <div className="form-grid">
              <input
                className="field"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="اسم المطعم"
              />

              <input
                className="field"
                value={form.emoji}
                onChange={(event) => setForm({ ...form, emoji: event.target.value })}
                placeholder="Emoji"
              />

              <select
                className="field"
                value={form.area}
                onChange={(event) => setForm({ ...form, area: event.target.value })}
              >
                {areas.map((area) => (
                  <option key={area}>{area}</option>
                ))}
              </select>

              <select
                className="field"
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>

              <input
                className="field"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="رقم الهاتف"
              />

              <input
                className="field"
                value={form.deliveryTime}
                onChange={(event) =>
                  setForm({ ...form, deliveryTime: event.target.value })
                }
                placeholder="وقت التوصيل"
              />

              <input
                type="number"
                className="field"
                value={form.deliveryFee}
                onChange={(event) =>
                  setForm({ ...form, deliveryFee: Number(event.target.value) })
                }
                placeholder="رسوم التوصيل"
              />

              <input
                type="number"
                className="field"
                value={form.minOrder}
                onChange={(event) =>
                  setForm({ ...form, minOrder: Number(event.target.value) })
                }
                placeholder="الحد الأدنى"
              />

              <input
                type="number"
                step="0.1"
                className="field"
                value={form.rating}
                onChange={(event) =>
                  setForm({ ...form, rating: Number(event.target.value) })
                }
                placeholder="التقييم"
              />

              <input
                className="field"
                value={form.address}
                onChange={(event) =>
                  setForm({ ...form, address: event.target.value })
                }
                placeholder="العنوان"
              />

              <textarea
                className="field"
                value={form.desc}
                onChange={(event) => setForm({ ...form, desc: event.target.value })}
                placeholder="وصف المطعم"
              />

              <div className="check-row">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={form.open}
                    onChange={(event) =>
                      setForm({ ...form, open: event.target.checked })
                    }
                  />
                  مفتوح
                </label>

                <label className="check">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      setForm({ ...form, active: event.target.checked })
                    }
                  />
                  فعال
                </label>
              </div>
            </div>

            <div className="buttons">
              <button onClick={saveRestaurant} disabled={saving} className="submit">
                {saving
                  ? "جاري الحفظ..."
                  : editingId
                  ? "حفظ التعديل"
                  : "إضافة المطعم"}
              </button>

              <button
                onClick={() => {
                  setForm(emptyForm);
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
              <h3>فلترة المطاعم</h3>
            </div>

            <div className="filters">
              <input
                className="field"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="بحث باسم أو منطقة..."
              />

              <select
                className="field"
                value={areaFilter}
                onChange={(event) => setAreaFilter(event.target.value)}
              >
                <option>الكل</option>
                {areas.map((area) => (
                  <option key={area}>{area}</option>
                ))}
              </select>

              <select
                className="field"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option>الكل</option>
                <option>مفتوح</option>
                <option>مغلق</option>
                <option>فعال</option>
                <option>موقوف</option>
              </select>

              <div className="info">
                <small>ملخص</small>
                <strong>
                  فعالة: {activeRestaurants} · مفتوحة: {openRestaurants} · مغلقة:{" "}
                  {closedRestaurants}
                </strong>
              </div>
            </div>
          </aside>

          <section className="panel">
            <div className="panel-title">
              <h3>المطاعم</h3>
              <span style={{ color: "#FF7A00", fontWeight: 1000 }}>
                {loading ? "تحميل..." : `${filteredRestaurants.length} مطعم`}
              </span>
            </div>

            {loading ? (
              <div className="empty">جاري تحميل المطاعم...</div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="empty">
                ماكو مطاعم بعد.
                <br />
                اضغط إضافة مطاعم تجريبية أو ضيف مطعم من الفورم.
              </div>
            ) : (
              <div className="restaurants-grid">
                {filteredRestaurants.map((restaurant) => {
                  const stats = restaurantStats.get(restaurant.name) || {
                    orders: 0,
                    delivered: 0,
                    active: 0,
                    revenue: 0,
                  };

                  const phone = whatsappPhone(restaurant.phone);
                  const available = restaurant.active !== false && restaurant.open;

                  return (
                    <article
                      key={restaurant.docId}
                      className={`restaurant-card ${
                        restaurant.active !== false ? "" : "off"
                      }`}
                    >
                      <div className="restaurant-head">
                        <div className="avatar">{restaurant.emoji || "🍽️"}</div>
                        <span
                          className={`badge ${available ? "badge-on" : "badge-off"}`}
                        >
                          {restaurant.active === false
                            ? "موقوف"
                            : restaurant.open
                            ? "مفتوح"
                            : "مغلق"}
                        </span>
                      </div>

                      <h4>{restaurant.name}</h4>
                      <p>
                        {restaurant.desc}
                        <br />
                        {restaurant.area} · {restaurant.category}
                      </p>

                      <div className="stats-grid">
                        <Info title="طلبات" value={String(stats.orders)} />
                        <Info title="نشطة" value={String(stats.active)} />
                        <Info title="مسلّمة" value={String(stats.delivered)} />
                        <Info title="مبيعات" value={formatMoney(stats.revenue)} orange />
                        <Info title="التقييم" value={`⭐ ${restaurant.rating}`} />
                        <Info title="التوصيل" value={formatMoney(restaurant.deliveryFee)} />
                        <Info title="الحد الأدنى" value={formatMoney(restaurant.minOrder)} />
                        <Info title="الوقت" value={restaurant.deliveryTime} />
                      </div>

                      <div className="restaurant-actions">
                        <button
                          onClick={() => editRestaurant(restaurant)}
                          className="action action-main"
                        >
                          تعديل
                        </button>

                        <button
                          onClick={() => toggleOpen(restaurant)}
                          className="action action-dark"
                        >
                          {restaurant.open ? "إغلاق" : "فتح"}
                        </button>

                        <button
                          onClick={() => toggleActive(restaurant)}
                          className="action action-dark"
                        >
                          {restaurant.active ? "إيقاف" : "تفعيل"}
                        </button>

                        {phone ? (
                          <a
                            href={`https://wa.me/${phone}`}
                            target="_blank"
                            className="action action-green"
                          >
                            واتساب
                          </a>
                        ) : (
                          <button className="action action-green">لا رقم</button>
                        )}

                        <button
                          onClick={() => removeRestaurant(restaurant)}
                          className="action action-red"
                        >
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

function Info({
  title,
  value,
  orange,
}: {
  title: string;
  value: string;
  orange?: boolean;
}) {
  return (
    <div className="info">
      <small>{title}</small>
      <strong style={{ color: orange ? "#FF7A00" : "white" }}>{value}</strong>
    </div>
  );
}