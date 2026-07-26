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
  { documentId: "fayrouz-1", restaurantId: "fayrouz", restaurant: "فيروز", name: "مخلمة", category: "فطور", price: 7000 },
  { documentId: "fayrouz-2", restaurantId: "fayrouz", restaurant: "فيروز", name: "كاهي وقيمر", category: "كاهي", price: 5000 },
  { documentId: "fayrouz-3", restaurantId: "fayrouz", restaurant: "فيروز", name: "باقلة بالدهن", category: "فطور", price: 6000 },
  { documentId: "shalteta-1", restaurantId: "shalteta", restaurant: "شلتتة", name: "مشلتت سادة", category: "مشلتت", price: 8000 },
  { documentId: "shalteta-2", restaurantId: "shalteta", restaurant: "شلتتة", name: "فطير جبن", category: "فطائر", price: 9000 },
  { documentId: "khan-1", restaurantId: "khan", restaurant: "خان قدوري", name: "وجبة عراقية", category: "وجبات", price: 12000 },
  { documentId: "khan-2", restaurantId: "khan", restaurant: "خان قدوري", name: "دجاج مشوي", category: "مشاوي", price: 9000 },
  { documentId: "forn-1", restaurantId: "alforn", restaurant: "الفرن", name: "منقوشة جبن", category: "مناقيش", price: 5000 },
  { documentId: "forn-2", restaurantId: "alforn", restaurant: "الفرن", name: "وافل شوكولاتة", category: "حلويات", price: 7000 },
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

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "menu")),
      (snapshot) =>
        setMenu(
          snapshot.docs.map((doc) => ({
            ...(doc.data() as Omit<MenuDoc, "documentId">),
            documentId: doc.id,
          }))
        ),
      () => setMenu([])
    );
    return unsubscribe;
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
    <main className="page" dir="rtl">
      <header className="header">
        <Link href="/restaurants" className="back" aria-label="رجوع">‹</Link>
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
            <div className="food-image">{itemName(item).slice(0, 1)}</div>
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

      <nav className="bottom-nav">
        <Link href="/"><b>⌂</b><span>الرئيسية</span></Link>
        <Link href="/restaurants" className="active"><b>⌕</b><span>المطاعم</span></Link>
        <Link href="/reels"><b>▶</b><span>ريلز</span></Link>
        <Link href="/order-status"><b>▣</b><span>طلباتي</span></Link>
        <Link href="/profile"><b>●</b><span>حسابي</span></Link>
      </nav>

      <style jsx>{`
        :global(*){box-sizing:border-box}:global(html),:global(body){margin:0;background:#efe8df}
        .page{width:100%;max-width:430px;min-height:100dvh;margin:auto;background:linear-gradient(180deg,#fff8f0,#fff);color:#171717;padding:16px 16px 170px;font-family:Cairo,Arial,sans-serif}
        .header{display:grid;grid-template-columns:48px 1fr auto;align-items:center;gap:12px}.header small{color:#ff5a00;font-weight:900}.header h1{margin:2px 0 0;font-size:24px}.back{width:46px;height:46px;border-radius:16px;background:#fff;display:grid;place-items:center;text-decoration:none;color:#111;font-size:34px;box-shadow:0 10px 28px rgba(0,0,0,.08)}
        .cart-link{height:46px;border-radius:16px;background:#171717;color:#fff;text-decoration:none;display:flex;align-items:center;gap:8px;padding:0 13px;font-size:12px;font-weight:900}.cart-link b{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#ff5a00}
        .closed{margin-top:14px;border-radius:20px;background:#fff1f2;border:1px solid #fecdd3;color:#be123c;padding:14px;display:grid;gap:4px}.closed span{font-size:12px}
        .hero{margin-top:16px;border-radius:28px;background:linear-gradient(135deg,#181818,#38302a);color:#fff;padding:20px;display:grid;grid-template-columns:1fr 90px;gap:12px;align-items:center;box-shadow:0 18px 42px rgba(0,0,0,.18)}.status{display:inline-block;padding:6px 9px;border-radius:999px;background:#ff5a00;font-size:10px;font-weight:900}.hero h2{margin:10px 0 6px;font-size:25px;line-height:1.25}.hero p{margin:0;color:#d6d3d1;font-size:12px;line-height:1.7}.hero-stat{height:92px;border-radius:24px;background:rgba(255,255,255,.1);display:grid;place-items:center;align-content:center}.hero-stat b{font-size:30px;color:#ff7a00}.hero-stat span{font-size:10px;color:#e7e5e4}
        .filters{margin-top:16px}.filters input{width:100%;height:50px;border:1px solid #eee0d3;border-radius:17px;background:#fff;padding:0 15px;font-family:inherit;font-size:14px;outline:none}.categories{display:flex;gap:8px;overflow:auto;padding:10px 0 4px;scrollbar-width:none}.categories::-webkit-scrollbar{display:none}.categories button{white-space:nowrap;border:1px solid #eee0d3;background:#fff;color:#665f59;padding:9px 13px;border-radius:999px;font-family:inherit;font-weight:900}.categories button.active{background:#ff5a00;color:#fff;border-color:#ff5a00}
        .menu-grid{display:grid;gap:11px;margin-top:12px}.menu-card{display:grid;grid-template-columns:70px 1fr 46px;gap:12px;align-items:center;background:#fff;border:1px solid #f1e7dd;border-radius:22px;padding:11px;box-shadow:0 10px 28px rgba(0,0,0,.055)}.food-image{width:70px;height:70px;border-radius:19px;background:linear-gradient(135deg,#222,#443a32);color:#ff7a00;display:grid;place-items:center;font-size:29px;font-weight:900}.food-info{min-width:0}.food-info small{color:#8b8179;font-size:10px;font-weight:800}.food-info h3{margin:3px 0 7px;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.food-info strong{color:#ff5a00;font-size:14px}.menu-card>button{width:44px;height:44px;border:0;border-radius:15px;background:#ff5a00;color:#fff;font-size:25px;font-weight:900}.menu-card>button:disabled{background:#d6d3d1}
        .empty{text-align:center;padding:30px;color:#78716c;font-weight:800}.checkout-bar{position:fixed;z-index:90;left:50%;transform:translateX(-50%);bottom:88px;width:calc(100% - 32px);max-width:398px;min-height:64px;border-radius:20px;background:#171717;color:#fff;text-decoration:none;padding:11px 15px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 16px 38px rgba(0,0,0,.3)}.checkout-bar div{display:grid;gap:2px}.checkout-bar div b{font-size:13px}.checkout-bar div span{font-size:11px;color:#ff8a3d}.checkout-bar>strong{font-size:13px}
        .toast{position:fixed;z-index:120;left:50%;transform:translateX(-50%);bottom:170px;background:#fff;color:#111;padding:12px 17px;border-radius:999px;font-weight:900;box-shadow:0 12px 35px rgba(0,0,0,.2);white-space:nowrap;max-width:calc(100% - 32px);overflow:hidden;text-overflow:ellipsis}
        .bottom-nav{position:fixed;bottom:max(8px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:calc(100% - 24px);max-width:406px;height:72px;background:rgba(255,255,255,.98);border-radius:24px;box-shadow:0 12px 35px rgba(0,0,0,.18);display:grid;grid-template-columns:repeat(5,1fr);padding:6px;z-index:99}.bottom-nav a{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:3px;text-decoration:none;color:#78716c;font-size:10px;font-weight:900;border-radius:17px}.bottom-nav a.active{color:#ff5a00;background:#fff1e8}.bottom-nav b{font-size:19px;line-height:1}
      `}</style>
    </main>
  );
}
