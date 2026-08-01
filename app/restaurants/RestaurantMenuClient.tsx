"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";
import {
  addFuseCartItem,
  FUSE_CART_EVENT,
  readFuseCart,
  type FuseCartItem,
} from "@/lib/fuse-cart";

type MenuDoc = {
  documentId: string;
  name?: string;
  title?: string;
  restaurant?: string;
  restaurantName?: string;
  restaurantId?: string;
  category?: string;
  price?: number;
  available?: boolean;
  isAvailable?: boolean;
  image?: string;
};

type RestaurantDoc = {
  documentId: string;
  name?: string;
  title?: string;
  restaurantName?: string;
  open?: boolean;
  isOpen?: boolean;
  active?: boolean;
  status?: string;
};

const fallbackMenu: MenuDoc[] = [
  { documentId: "fayrouz-1", restaurantId: "fayrouz", restaurant: "فيروز", name: "مخلمة", category: "فطور", price: 7000, image: "/images/m1.jpg" },
  { documentId: "fayrouz-2", restaurantId: "fayrouz", restaurant: "فيروز", name: "كاهي وقيمر", category: "كاهي", price: 5000, image: "/images/m2.jpg" },
  { documentId: "fayrouz-3", restaurantId: "fayrouz", restaurant: "فيروز", name: "باقلة بالدهن", category: "فطور", price: 6000, image: "/images/m3.jpg" },
  { documentId: "shalteta-1", restaurantId: "shalteta", restaurant: "شلتتة", name: "مشلتت سادة", category: "مشلتت", price: 8000, image: "/images/m4.jpg" },
  { documentId: "shalteta-2", restaurantId: "shalteta", restaurant: "شلتتة", name: "فطير جبن", category: "فطائر", price: 9000, image: "/images/m5.jpg" },
  { documentId: "khan-1", restaurantId: "khan", restaurant: "خان قدوري", name: "وجبة عراقية", category: "وجبات", price: 12000, image: "/images/m6.jpg" },
  { documentId: "khan-2", restaurantId: "khan", restaurant: "خان قدوري", name: "دجاج مشوي", category: "مشاوي", price: 9000, image: "/images/m7.jpg" },
  { documentId: "forn-1", restaurantId: "alforn", restaurant: "الفرن", name: "منقوشة جبن", category: "مناقيش", price: 5000, image: "/images/m8.jpg" },
  { documentId: "forn-2", restaurantId: "alforn", restaurant: "الفرن", name: "وافل شوكولاتة", category: "حلويات", price: 7000, image: "/images/m9.jpg" },
];

function itemName(item: MenuDoc) {
  return (item.name || item.title || "صنف").trim();
}

function itemRestaurant(item: MenuDoc) {
  return (item.restaurant || item.restaurantName || "").trim();
}

function isAvailable(item: MenuDoc) {
  return item.available !== false && item.isAvailable !== false;
}

function sameRestaurant(
  item: Pick<MenuDoc | FuseCartItem, "restaurant" | "restaurantId"> & { restaurantName?: string },
  restaurant: string,
  restaurantId: string
) {
  const itemId = String(item.restaurantId || "").trim().toLowerCase();
  const itemNameValue = String(item.restaurant || item.restaurantName || "").trim();
  return itemId === restaurantId.trim().toLowerCase() || itemNameValue === restaurant;
}

function formatIQD(value: number) {
  return `${Number(value || 0).toLocaleString("en-US")} د.ع`;
}

export default function RestaurantMenuClient({
  restaurant,
  restaurantId,
}: {
  restaurant: string;
  restaurantId: string;
}) {
  const [menu, setMenu] = useState<MenuDoc[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantDoc[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("الكل");
  const [cart, setCart] = useState<FuseCartItem[]>([]);
  const [notice, setNotice] = useState("");
  const [connectionWarning, setConnectionWarning] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setConnectionWarning(true), 3500);
    const unsubscribe = onSnapshot(
      query(collection(db, "menu")),
      (snapshot) => {
        window.clearTimeout(timeout);
        setConnectionWarning(false);
        setMenu(
          snapshot.docs.map((doc) => ({
            ...(doc.data() as Omit<MenuDoc, "documentId">),
            documentId: doc.id,
          }))
        );
      },
      () => {
        window.clearTimeout(timeout);
        setConnectionWarning(true);
        setMenu([]);
      }
    );
    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "restaurants")),
      (snapshot) =>
        setRestaurants(
          snapshot.docs.map((doc) => ({
            ...(doc.data() as Omit<RestaurantDoc, "documentId">),
            documentId: doc.id,
          }))
        ),
      () => setRestaurants([])
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const refresh = () => setCart(readFuseCart());
    refresh();
    window.addEventListener(FUSE_CART_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(FUSE_CART_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const restaurantOpen = useMemo(() => {
    const current = restaurants.find((item) => {
      const name = (item.restaurantName || item.name || item.title || "").trim();
      return item.documentId === restaurantId || name === restaurant;
    });
    if (!current) return true;
    return (
      current.active !== false &&
      current.open !== false &&
      current.isOpen !== false &&
      current.status !== "مغلق"
    );
  }, [restaurant, restaurantId, restaurants]);

  const source = useMemo(() => {
    const remote = menu.filter(
      (item) => sameRestaurant(item, restaurant, restaurantId) && isAvailable(item)
    );
    return remote.length
      ? remote
      : fallbackMenu.filter((item) => sameRestaurant(item, restaurant, restaurantId));
  }, [menu, restaurant, restaurantId]);

  const categories = useMemo(
    () => ["الكل", ...Array.from(new Set(source.map((item) => item.category || "عام")))],
    [source]
  );

  const visibleMenu = useMemo(() => {
    const term = search.trim().toLowerCase();
    return source.filter((item) => {
      const matchesSearch =
        !term || `${itemName(item)} ${item.category || ""}`.toLowerCase().includes(term);
      const matchesCategory = category === "الكل" || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, search, source]);

  const restaurantCart = useMemo(
    () => cart.filter((item) => sameRestaurant(item, restaurant, restaurantId)),
    [cart, restaurant, restaurantId]
  );
  const cartCount = restaurantCart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = restaurantCart.reduce((sum, item) => sum + item.price * item.qty, 0);

  function addItem(item: MenuDoc) {
    if (!restaurantOpen) {
      setNotice("المطعم مغلق حالياً ولا يستقبل طلبات.");
      return;
    }

    const previousCart = readFuseCart();
    const replacingOtherRestaurant =
      previousCart.length > 0 && !sameRestaurant(previousCart[0], restaurant, restaurantId);

    const next = addFuseCartItem({
      id: item.documentId,
      name: itemName(item),
      restaurant,
      restaurantId,
      category: item.category || "عام",
      price: Math.max(0, Number(item.price || 0)),
      qty: 1,
      image: item.image,
    });

    setCart(next);
    setNotice(
      replacingOtherRestaurant
        ? `بدأنا سلة جديدة من ${restaurant} وأضفنا ${itemName(item)}`
        : `تمت إضافة ${itemName(item)} للسلة`
    );
    window.setTimeout(() => setNotice(""), 1900);
  }

  return (
    <main className="page restaurant-detail-page" dir="rtl">
      <header className="header customer-header">
        <a href="/restaurants/" className="back" aria-label="العودة إلى المطاعم">
          <span aria-hidden="true">→</span>
        </a>
        <div>
          <small>مطعم</small>
          <h1>{restaurant}</h1>
        </div>
        <Link href="/cart" className="cart-link">
          <span>السلة</span>
          <b>{cartCount}</b>
        </Link>
      </header>

      {!restaurantOpen ? (
        <section className="closed">
          <strong>المطعم مغلق حالياً</strong>
          <span>تقدر تشوف المنيو، لكن الإضافة للسلة متوقفة مؤقتاً.</span>
        </section>
      ) : null}

      {connectionWarning ? <p className="warning">تعذر تحديث المنيو الآن؛ عرضنا الأصناف المتاحة داخل التطبيق.</p> : null}

      <section className="hero">
        <div>
          <span className="status">{restaurantOpen ? "مفتوح الآن" : "مغلق"}</span>
          <h2>اختار وجبتك<br />وأكمل الطلب من السلة</h2>
          <p>سلة واحدة متصلة بكل التطبيق، بدون تكرار أو ضياع للكميات.</p>
        </div>
        <div className="hero-stat"><b>{source.length}</b><span>صنف متاح</span></div>
      </section>

      <section className="filters">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث داخل المنيو" />
        <div className="categories">
          {categories.map((item) => (
            <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
      </section>

      <section className="menu-grid">
        {visibleMenu.map((item) => (
          <article className="menu-card" key={item.documentId}>
            <div className="food-image">{item.image ? <img src={item.image} alt={itemName(item)} /> : itemName(item).slice(0, 1)}</div>
            <div className="food-info">
              <small>{item.category || "عام"}</small>
              <h3>{itemName(item)}</h3>
              <strong>{formatIQD(Number(item.price || 0))}</strong>
            </div>
            <button type="button" disabled={!restaurantOpen} onClick={() => addItem(item)} aria-label={`إضافة ${itemName(item)}`}>+</button>
          </article>
        ))}
      </section>

      {!visibleMenu.length ? <div className="empty">ماكو أصناف مطابقة للبحث.</div> : null}

      {cartCount ? (
        <Link href="/cart" className="checkout-bar">
          <div><b>{cartCount} صنف</b><span>{formatIQD(cartTotal)}</span></div>
          <strong>عرض السلة ←</strong>
        </Link>
      ) : null}

      {notice ? <div className="toast">{notice}</div> : null}

      <style jsx>{`
        :global(*){box-sizing:border-box}:global(html),:global(body){margin:0;background:#efe8df}
        .page{width:100%;max-width:430px;min-height:100dvh;margin:auto;background:#fffaf4;color:#171717;padding:calc(12px + env(safe-area-inset-top)) 16px 170px;font-family:Cairo,Arial,sans-serif}
        .header{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px}.header>div{text-align:center;min-width:0}.header small{color:#ff5a00;font-weight:900}.header h1{margin:1px 0 0;font-size:21px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.back{height:46px;border-radius:16px;background:#171717;display:flex;direction:rtl;align-items:center;justify-content:center;gap:5px;padding:0 12px;text-decoration:none;color:#fff;font-size:11px;font-weight:900;box-shadow:0 9px 22px rgba(0,0,0,.14)}.back span:first-child{font-size:19px}
        .cart-link{height:46px;border-radius:16px;background:#171717;color:#fff;text-decoration:none;display:flex;align-items:center;gap:8px;padding:0 13px;font-size:12px;font-weight:900}.cart-link b{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#ff5a00}
        .closed{margin-top:14px;border-radius:20px;background:#fff1f2;border:1px solid #fecdd3;color:#be123c;padding:14px;display:grid;gap:4px}.closed span{font-size:12px}
        .hero{margin-top:14px;border-radius:24px;background:linear-gradient(135deg,#181818,#2b2723);color:#fff;padding:17px;display:grid;grid-template-columns:1fr 72px;gap:10px;align-items:center;box-shadow:0 14px 32px rgba(0,0,0,.16)}.status{display:inline-block;padding:5px 8px;border-radius:999px;background:#ff5a00;font-size:9px;font-weight:900}.hero h2{margin:8px 0 5px;font-size:21px;line-height:1.3}.hero p{margin:0;color:#d6d3d1;font-size:11px;line-height:1.65}.hero-stat{height:76px;border-radius:20px;background:rgba(255,255,255,.1);display:grid;place-items:center;align-content:center}.hero-stat b{font-size:25px;color:#ff7a00}.hero-stat span{font-size:9px;color:#e7e5e4}
        .filters{margin-top:16px}.filters input{width:100%;height:50px;border:1px solid #eee0d3;border-radius:17px;background:#fff;padding:0 15px;font-family:inherit;font-size:14px;outline:none}.categories{display:flex;gap:8px;overflow:auto;padding:10px 0 4px;scrollbar-width:none}.categories::-webkit-scrollbar{display:none}.categories button{white-space:nowrap;border:1px solid #eee0d3;background:#fff;color:#665f59;padding:9px 13px;border-radius:999px;font-family:inherit;font-weight:900}.categories button.active{background:#ff5a00;color:#fff;border-color:#ff5a00}
        .menu-grid{display:grid;gap:10px;margin-top:12px}.menu-card{display:grid;grid-template-columns:60px 1fr 44px;gap:11px;align-items:center;background:#fff;border:1px solid #f1e7dd;border-radius:20px;padding:10px;box-shadow:0 8px 22px rgba(0,0,0,.05)}.food-image{width:60px;height:60px;border-radius:17px;background:linear-gradient(135deg,#222,#443a32);color:#ff7a00;display:grid;place-items:center;font-size:25px;font-weight:900}.food-info{min-width:0}.food-info small{color:#8b8179;font-size:9px;font-weight:800}.food-info h3{margin:2px 0 5px;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.food-info strong{color:#ff5a00;font-size:13px}.menu-card>button{width:42px;height:42px;border:0;border-radius:14px;background:#ff5a00;color:#fff;font-size:24px;font-weight:900}.menu-card>button:disabled{background:#d6d3d1}
        .empty{text-align:center;padding:30px;color:#78716c;font-weight:800}.checkout-bar{position:fixed;z-index:90;left:50%;transform:translateX(-50%);bottom:88px;width:calc(100% - 32px);max-width:398px;min-height:64px;border-radius:20px;background:#171717;color:#fff;text-decoration:none;padding:11px 15px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 16px 38px rgba(0,0,0,.3)}.checkout-bar div{display:grid;gap:2px}.checkout-bar div b{font-size:13px}.checkout-bar div span{font-size:11px;color:#ff8a3d}.checkout-bar>strong{font-size:13px}
        .toast{position:fixed;z-index:120;left:50%;transform:translateX(-50%);bottom:170px;background:#fff;color:#111;padding:12px 17px;border-radius:999px;font-weight:900;box-shadow:0 12px 35px rgba(0,0,0,.2);white-space:nowrap;max-width:calc(100% - 32px);overflow:hidden;text-overflow:ellipsis}
      `}</style>
    </main>
  );
}
