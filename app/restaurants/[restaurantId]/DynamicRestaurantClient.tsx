"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../../firebase";
import { addFuseCartItem, readFuseCart } from "@/lib/fuse-cart";
import { isCatalogMenuItemId, restaurantHasLiveCatalog } from "@/lib/fuse-catalog";
import FuseIcon from "@/components/FuseIcon";

type RestaurantDoc = {
  documentId: string;
  name?: string;
  title?: string;
  restaurantName?: string;
  desc?: string;
  description?: string;
  category?: string;
  cuisine?: string;
  area?: string;
  address?: string;
  phone?: string;
  emoji?: string;
  image?: string;
  cover?: string;
  logo?: string;
  open?: boolean;
  isOpen?: boolean;
  active?: boolean;
  deliveryTime?: string;
  deliveryFee?: number;
  minOrder?: number;
  rating?: number;
};

type MenuDoc = {
  documentId: string;
  name?: string;
  title?: string;
  restaurantId?: string;
  restaurant?: string;
  restaurantName?: string;
  category?: string;
  price?: number;
  image?: string;
  available?: boolean;
  isAvailable?: boolean;
};

const fallbackRestaurants: RestaurantDoc[] = [
  { documentId: "fayrouz", name: "فيروز", description: "فطور عراقي، كاهي وقيمر وبورك.", area: "زيونة", cuisine: "فطور", image: "/images/m6.jpg", open: true, active: true, rating: 4.9, deliveryTime: "20 - 30 دقيقة" },
  { documentId: "shalteta", name: "شلتتة", description: "مشلتت وفطائر حار وحلو.", area: "زيونة", cuisine: "فطور", image: "/images/m7.jpg", open: true, active: true, rating: 4.7, deliveryTime: "25 - 35 دقيقة" },
  { documentId: "khan", name: "خان قدوري", description: "أكلات عراقية شعبية ووجبات يومية.", area: "بغداد", cuisine: "مشاوي", image: "/images/m4.jpg", open: true, active: true, rating: 4.6, deliveryTime: "30 - 40 دقيقة" },
  { documentId: "alforn", name: "الفرن", description: "مناقيش، معجنات، كريب ووافل.", area: "بغداد", cuisine: "بيتزا", image: "/images/m5.jpg", open: true, active: true, rating: 4.5, deliveryTime: "30 - 40 دقيقة" },
];

const fallbackMenu: MenuDoc[] = [
  { documentId: "fayrouz-makhlema", restaurantId: "fayrouz", name: "مخلمة", category: "فطور", price: 7000, image: "/images/m6.jpg", available: true },
  { documentId: "fayrouz-kahi", restaurantId: "fayrouz", name: "كاهي وقيمر", category: "كاهي", price: 5000, image: "/images/m6.jpg", available: true },
  { documentId: "fayrouz-baqala", restaurantId: "fayrouz", name: "باقلة بالدهن", category: "فطور", price: 6000, image: "/images/m6.jpg", available: true },
];

function formatIQD(value?: number) {
  return `${Number(value || 0).toLocaleString("ar-IQ")} د.ع`;
}

export default function DynamicRestaurantClient({ restaurantId: restaurantIdProp }: { restaurantId: string }) {
  const restaurantId = decodeURIComponent(restaurantIdProp || "");
  const [restaurants, setRestaurants] = useState<RestaurantDoc[]>(fallbackRestaurants);
  const [menu, setMenu] = useState<MenuDoc[]>(fallbackMenu);
  const [cartCount, setCartCount] = useState(0);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [connectionWarning, setConnectionWarning] = useState(false);
  const [menuLive, setMenuLive] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setRestaurants((current) => current.length ? current : fallbackRestaurants);
      setMenu((current) => current.length ? current : fallbackMenu);
      setLoading(false);
      setConnectionWarning(true);
    }, 4500);
    const unsubscribeRestaurants = onSnapshot(
      query(collection(db, "restaurants")),
      (snapshot) => {
        window.clearTimeout(timeout);
        const remote = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<RestaurantDoc, "documentId">),
          documentId: item.id,
        }));
        setRestaurants(remote.length ? remote : fallbackRestaurants);
        setLoading(false);
        setConnectionWarning(false);
      },
      () => {
        window.clearTimeout(timeout);
        setRestaurants(fallbackRestaurants);
        setLoading(false);
        setConnectionWarning(true);
        setMenuLive(false);
      }
    );
    const unsubscribeMenu = onSnapshot(
      query(collection(db, "menu")),
      (snapshot) => {
        const remote = snapshot.docs.map((item) => ({
        ...(item.data() as Omit<MenuDoc, "documentId">),
        documentId: item.id,
        }));
        setMenu(remote.length ? remote : fallbackMenu);
        setMenuLive(restaurantHasLiveCatalog(remote, restaurantId));
      },
      () => { setMenu(fallbackMenu); setConnectionWarning(true); setMenuLive(false); }
    );
    return () => {
      window.clearTimeout(timeout);
      unsubscribeRestaurants();
      unsubscribeMenu();
    };
  }, []);

  useEffect(() => {
    setCartCount(readFuseCart().reduce((sum, item) => sum + item.qty, 0));
  }, []);

  const restaurant = useMemo(() => {
    const clean = restaurantId.toLowerCase();
    return restaurants.find((item) => {
      const name = item.name || item.title || item.restaurantName || "";
      return item.documentId === restaurantId || name.toLowerCase() === clean;
    });
  }, [restaurantId, restaurants]);

  const restaurantName = restaurant?.name || restaurant?.title || restaurant?.restaurantName || "المطعم";
  const items = useMemo(() => menu.filter((item) => {
    const sameRestaurant = item.restaurantId === restaurantId || item.restaurantId === restaurant?.documentId;
    const sameName = item.restaurantName === restaurantName || item.restaurant === restaurantName;
    const available = item.available !== false && item.isAvailable !== false;
    return available && (sameRestaurant || sameName);
  }), [menu, restaurant, restaurantId, restaurantName]);

  function addItem(item: MenuDoc) {
    if (!menuLive || !isCatalogMenuItemId(item.documentId)) {
      setNotice("المنيو غير متصل بقاعدة البيانات. لا يمكن إضافة هذا الصنف للسلة الآن.");
      window.setTimeout(() => setNotice(""), 2600);
      return;
    }
    const next = addFuseCartItem({
      id: item.documentId,
      name: item.name || item.title || "صنف",
      restaurant: restaurantName,
      restaurantId: restaurant?.documentId || restaurantId,
      category: item.category || "عام",
      price: Number(item.price || 0),
      qty: 1,
      image: item.image,
    });
    setCartCount(next.reduce((sum, cartItem) => sum + cartItem.qty, 0));
    setNotice("تمت الإضافة للسلة");
    window.setTimeout(() => setNotice(""), 1800);
  }

  if (restaurants.length > 0 && !restaurant) {
    return <main dir="rtl" className="missing"><h1>المطعم غير موجود</h1><Link href="/restaurants">العودة للمطاعم</Link>
</main>;
  }

  const isOpen = restaurant?.active !== false && restaurant?.open !== false && restaurant?.isOpen !== false;
  const image = restaurant?.image || restaurant?.cover || restaurant?.logo || "";

  return (
    <main dir="rtl" className="page restaurant-detail-page dynamic-restaurant-page">
      <section className="phone">
        <header className="customer-header">
          <Link href="/restaurants/" className="back fuse-back-btn" aria-label="العودة إلى المطاعم"><FuseIcon name="chevron-back" /></Link>
          <div><small>FUSE Iraq</small><b>تفاصيل المطعم</b></div>
          <Link href="/cart" className="cart">السلة {cartCount ? `(${cartCount})` : ""}</Link>
        </header>

        {loading && !restaurant ? <div className="state-card">جاري تحميل المطعم…</div> : null}
        {connectionWarning && restaurant ? <div className="state-card">تعذر تحديث المطعم الآن. الطلب يتطلب منيوً متصلاً بـ Firebase.</div> : null}

        <section className="hero" style={image ? { backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.78)),url(${image})` } : undefined}>
          <span className="emoji"><FuseIcon name="store" size="lg" /></span>
          <div>
            <p>{restaurant?.category || restaurant?.cuisine || "مطعم"} · {restaurant?.area || "بغداد"}</p>
            <h1>{restaurantName}</h1>
            <p>{restaurant?.desc || restaurant?.description || "اطلب وجبتك المفضلة مباشرة من FUSE."}</p>
          </div>
        </section>

        <section className="info">
          <div><span>الحالة</span><b className={isOpen ? "green" : "red"}>{isOpen ? "مفتوح" : "مغلق"}</b></div>
          <div><span>التوصيل</span><b>{restaurant?.deliveryTime || "25 - 35 دقيقة"}</b></div>
          <div><span>التقييم</span><div className="rating-row"><FuseIcon name="star" size="sm" /><b>{Number(restaurant?.rating || 5).toFixed(1)}</b></div></div>
          <div><span>الأدنى</span><b>{formatIQD(restaurant?.minOrder)}</b></div>
        </section>

        <div className="title"><div><small>المنيو</small><h2>اختار وجبتك</h2></div><span>{items.length} صنف</span></div>

        <section className="menu">
          {items.length === 0 ? <div className="empty"><h3>المنيو قيد الإضافة</h3><p>تظهر الأصناف هنا فور إضافتها من لوحة الإدارة.</p></div> : items.map((item) => (
            <article key={item.documentId}>
              <div className="item-image">{item.image ? <img src={item.image} alt={item.name || "صنف"} /> : <FuseIcon name="breakfast" size="lg" />}</div>
              <div className="copy"><small>{item.category || "عام"}</small><h3>{item.name || item.title || "صنف"}</h3><b>{formatIQD(item.price)}</b></div>
              <button type="button" className="add-btn" disabled={!isOpen || !menuLive} onClick={() => addItem(item)} title={menuLive ? "إضافة للسلة" : "المنيو غير متصل"} aria-label="إضافة للسلة"><FuseIcon name="plus" size="sm" /></button>
            </article>
          ))}
        </section>

        {restaurant?.address || restaurant?.phone ? <section className="contact"><b>معلومات المطعم</b><p>{restaurant.address || restaurant.area}</p>{restaurant.phone ? <a href={`tel:${restaurant.phone}`}>{restaurant.phone}</a> : null}</section> : null}
        {notice ? <div className="toast">{notice}</div> : null}
      </section>

    </main>
  );
}
