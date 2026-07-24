"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  FUSE_LOCAL_SESSION,
  parseFuseRole,
  roleHome,
  type FuseRole,
  type FuseSession,
} from "@/lib/fuse-auth";

type RestaurantDoc = {
  documentId: string;
  name?: string;
  title?: string;
  description?: string;
  desc?: string;
  cuisine?: string;
  category?: string;
  area?: string;
  address?: string;
  phone?: string;
  image?: string;
  cover?: string;
  logo?: string;
  deliveryTime?: string;
  deliveryFee?: number;
  minOrder?: number;
  open?: boolean;
  isOpen?: boolean;
  active?: boolean;
};

type MenuDoc = {
  documentId: string;
  name?: string;
  title?: string;
  restaurant?: string;
  restaurantName?: string;
  restaurantId?: string;
  category?: string;
  price?: number;
  image?: string;
  available?: boolean;
  isAvailable?: boolean;
};

type OrderDoc = {
  documentId: string;
  customerName?: string;
  customer?: string;
  phone?: string;
  customerPhone?: string;
  address?: string;
  restaurant?: string;
  restaurantName?: string;
  restaurantId?: string;
  total?: number;
  amount?: number;
  status?: string;
};

const emptyRestaurant = {
  name: "",
  description: "",
  cuisine: "",
  area: "",
  address: "",
  phone: "",
  image: "",
  deliveryTime: "25 - 35 دقيقة",
  deliveryFee: "2000",
  minOrder: "5000",
  open: true,
};

const emptyMenu = {
  name: "",
  category: "",
  price: "",
  image: "",
};

function readSession(): FuseSession | null {
  try {
    const raw = localStorage.getItem(FUSE_LOCAL_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FuseSession;
    const role = parseFuseRole(parsed.role);
    if (!parsed.email || !role) return null;
    return { ...parsed, role };
  } catch {
    return null;
  }
}

function restaurantName(item: RestaurantDoc | MenuDoc | OrderDoc) {
  return item.name || item.title || item.restaurantName || item.restaurant || "مطعم";
}

function sessionRestaurant(session: FuseSession | null) {
  return session?.restaurant || session?.restaurantName || session?.restaurantId || "";
}

function money(value?: number) {
  return `${Number(value || 0).toLocaleString("ar-IQ")} د.ع`;
}

export default function RestaurantAdminPage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantDoc[]>([]);
  const [menu, setMenu] = useState<MenuDoc[]>([]);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [restaurantForm, setRestaurantForm] = useState(emptyRestaurant);
  const [menuForm, setMenuForm] = useState(emptyMenu);
  const [editingRestaurantId, setEditingRestaurantId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      window.location.href = "/login?next=/restaurant-admin";
      return;
    }
    if (saved.role !== "admin" && saved.role !== "restaurant") {
      window.location.href = roleHome[saved.role] || "/login";
      return;
    }
    setSession(saved);
  }, []);

  useEffect(() => {
    const unsubRestaurants = onSnapshot(query(collection(db, "restaurants")), (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        ...(item.data() as Omit<RestaurantDoc, "documentId">),
        documentId: item.id,
      }));
      setRestaurants(data);
      setSelectedId((current) => {
        if (current && data.some((item) => item.documentId === current)) return current;
        const own = sessionRestaurant(readSession());
        const ownDoc = data.find((item) => item.documentId === own || restaurantName(item) === own);
        return ownDoc?.documentId || data[0]?.documentId || "";
      });
    });

    const unsubMenu = onSnapshot(query(collection(db, "menu")), (snapshot) => {
      setMenu(snapshot.docs.map((item) => ({
        ...(item.data() as Omit<MenuDoc, "documentId">),
        documentId: item.id,
      })));
    });

    const unsubOrders = onSnapshot(query(collection(db, "orders")), (snapshot) => {
      setOrders(snapshot.docs.map((item) => ({
        ...(item.data() as Omit<OrderDoc, "documentId">),
        documentId: item.id,
      })));
    });

    return () => {
      unsubRestaurants();
      unsubMenu();
      unsubOrders();
    };
  }, []);

  const role: FuseRole | null = session?.role || null;
  const selectedRestaurant = restaurants.find((item) => item.documentId === selectedId) || null;
  const selectedName = selectedRestaurant ? restaurantName(selectedRestaurant) : "";

  const visibleMenu = useMemo(() => menu.filter((item) => {
    if (!selectedRestaurant) return false;
    return item.restaurantId === selectedRestaurant.documentId || restaurantName(item) === selectedName;
  }), [menu, selectedName, selectedRestaurant]);

  const visibleOrders = useMemo(() => orders.filter((item) => {
    if (!selectedRestaurant) return false;
    return item.restaurantId === selectedRestaurant.documentId || restaurantName(item) === selectedName;
  }), [orders, selectedName, selectedRestaurant]);

  function flash(text: string, bad = false) {
    setMessage(bad ? "" : text);
    setError(bad ? text : "");
    window.setTimeout(() => {
      setMessage("");
      setError("");
    }, 2800);
  }

  async function saveRestaurant() {
    if (!restaurantForm.name.trim()) return flash("اكتب اسم المطعم.", true);
    setSaving(true);
    try {
      const payload = {
        name: restaurantForm.name.trim(),
        title: restaurantForm.name.trim(),
        restaurantName: restaurantForm.name.trim(),
        description: restaurantForm.description.trim(),
        desc: restaurantForm.description.trim(),
        cuisine: restaurantForm.cuisine.trim() || "مطعم",
        category: restaurantForm.cuisine.trim() || "مطعم",
        area: restaurantForm.area.trim() || "بغداد",
        address: restaurantForm.address.trim(),
        phone: restaurantForm.phone.trim(),
        image: restaurantForm.image.trim(),
        cover: restaurantForm.image.trim(),
        deliveryTime: restaurantForm.deliveryTime.trim() || "25 - 35 دقيقة",
        deliveryFee: Number(restaurantForm.deliveryFee || 0),
        minOrder: Number(restaurantForm.minOrder || 0),
        open: restaurantForm.open,
        isOpen: restaurantForm.open,
        active: restaurantForm.open,
        status: restaurantForm.open ? "مفتوح" : "مغلق",
        updatedAt: serverTimestamp(),
      };

      if (editingRestaurantId) {
        await updateDoc(doc(db, "restaurants", editingRestaurantId), payload);
        setSelectedId(editingRestaurantId);
        flash("تم تحديث تفاصيل المطعم.");
      } else {
        const created = await addDoc(collection(db, "restaurants"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setSelectedId(created.id);
        flash("تمت إضافة المطعم، تقدر تضيف المنيو هسه.");
      }
      setEditingRestaurantId("");
      setRestaurantForm(emptyRestaurant);
    } catch (e) {
      flash(e instanceof Error ? e.message : "تعذر حفظ المطعم.", true);
    } finally {
      setSaving(false);
    }
  }

  function editRestaurant(item: RestaurantDoc) {
    setEditingRestaurantId(item.documentId);
    setSelectedId(item.documentId);
    setRestaurantForm({
      name: restaurantName(item),
      description: item.description || item.desc || "",
      cuisine: item.cuisine || item.category || "",
      area: item.area || "",
      address: item.address || "",
      phone: item.phone || "",
      image: item.image || item.cover || item.logo || "",
      deliveryTime: item.deliveryTime || "25 - 35 دقيقة",
      deliveryFee: String(item.deliveryFee || 0),
      minOrder: String(item.minOrder || 0),
      open: item.open !== false && item.isOpen !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleRestaurant(item: RestaurantDoc) {
    const currentlyOpen = item.active !== false && item.open !== false && item.isOpen !== false && item.status !== "مغلق";
    const next = !currentlyOpen;
    setSaving(true);
    try {
      await updateDoc(doc(db, "restaurants", item.documentId), {
        active: next,
        open: next,
        isOpen: next,
        status: next ? "مفتوح" : "مغلق",
        updatedAt: serverTimestamp(),
      });
      flash(next ? "تم تشغيل المطعم وظهر للزبائن." : "تم إطفاء المطعم وإخفاؤه من التطبيق.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "تعذر تغيير حالة المطعم.", true);
    } finally {
      setSaving(false);
    }
  }

  async function addMenuItem() {
    if (!selectedRestaurant) return flash("أضف أو اختر مطعماً أولاً.", true);
    if (!menuForm.name.trim()) return flash("اكتب اسم الصنف.", true);
    setSaving(true);
    try {
      await addDoc(collection(db, "menu"), {
        name: menuForm.name.trim(),
        title: menuForm.name.trim(),
        category: menuForm.category.trim() || "عام",
        price: Number(menuForm.price || 0),
        image: menuForm.image.trim(),
        restaurantId: selectedRestaurant.documentId,
        restaurant: selectedName,
        restaurantName: selectedName,
        available: true,
        isAvailable: true,
        createdAt: serverTimestamp(),
      });
      setMenuForm(emptyMenu);
      flash("تمت إضافة الصنف للمنيو.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "تعذر إضافة الصنف.", true);
    } finally {
      setSaving(false);
    }
  }

  async function toggleMenu(item: MenuDoc) {
    const next = !(item.available !== false && item.isAvailable !== false);
    await updateDoc(doc(db, "menu", item.documentId), {
      available: next,
      isAvailable: next,
      updatedAt: serverTimestamp(),
    });
  }

  async function updateOrder(order: OrderDoc, status: string) {
    await updateDoc(doc(db, "orders", order.documentId), {
      status,
      restaurantUpdatedAt: serverTimestamp(),
    });
  }

  return (
    <main dir="rtl" className="page">
      <section className="shell">
        <header className="topbar">
          <div><small>FUSE Restaurant</small><h1>إدارة المطاعم والمنيو</h1></div>
          <nav>
            <Link href="/">الرئيسية</Link>
            <Link href="/restaurant-reels">نشر ريل</Link>
            {role === "admin" ? <Link href="/fuse-admin">الإدارة</Link> : null}
          </nav>
        </header>

        {message ? <div className="alert ok">{message}</div> : null}
        {error ? <div className="alert bad">{error}</div> : null}

        {role === "admin" ? (
          <section className="panel form-panel">
            <div className="panel-head">
              <div><small>Restaurant Setup</small><h2>{editingRestaurantId ? "تعديل المطعم" : "إضافة مطعم جديد"}</h2></div>
              <b>كل التفاصيل بمكان واحد</b>
            </div>
            <div className="form-grid">
              <input placeholder="اسم المطعم" value={restaurantForm.name} onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })} />
              <input placeholder="نوع الأكل / القسم" value={restaurantForm.cuisine} onChange={(e) => setRestaurantForm({ ...restaurantForm, cuisine: e.target.value })} />
              <input placeholder="المنطقة" value={restaurantForm.area} onChange={(e) => setRestaurantForm({ ...restaurantForm, area: e.target.value })} />
              <input placeholder="العنوان الكامل" value={restaurantForm.address} onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })} />
              <input placeholder="رقم الهاتف" dir="ltr" value={restaurantForm.phone} onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })} />
              <input placeholder="وقت التوصيل: 25 - 35 دقيقة" value={restaurantForm.deliveryTime} onChange={(e) => setRestaurantForm({ ...restaurantForm, deliveryTime: e.target.value })} />
              <input placeholder="أجرة التوصيل" inputMode="numeric" value={restaurantForm.deliveryFee} onChange={(e) => setRestaurantForm({ ...restaurantForm, deliveryFee: e.target.value })} />
              <input placeholder="أقل طلب" inputMode="numeric" value={restaurantForm.minOrder} onChange={(e) => setRestaurantForm({ ...restaurantForm, minOrder: e.target.value })} />
              <input className="wide" placeholder="رابط صورة المطعم" dir="ltr" value={restaurantForm.image} onChange={(e) => setRestaurantForm({ ...restaurantForm, image: e.target.value })} />
              <textarea className="wide" placeholder="وصف المطعم" value={restaurantForm.description} onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })} />
              <label className="switch wide"><input type="checkbox" checked={restaurantForm.open} onChange={(e) => setRestaurantForm({ ...restaurantForm, open: e.target.checked })} /><span>المطعم مفتوح ويستقبل طلبات</span></label>
            </div>
            <button className="primary wide-btn" onClick={saveRestaurant} disabled={saving}>{saving ? "جاري الحفظ..." : editingRestaurantId ? "حفظ التعديلات" : "إضافة المطعم"}</button>
          </section>
        ) : null}

        <section className="panel selector">
          <div className="panel-head"><div><small>Restaurant</small><h2>اختر المطعم</h2></div><b>{restaurants.length}</b></div>
          <div className="restaurant-tabs">
            {restaurants.map((item) => (
              <button key={item.documentId} className={selectedId === item.documentId ? "active" : ""} onClick={() => setSelectedId(item.documentId)}>
                {restaurantName(item)}
              </button>
            ))}
          </div>
          {selectedRestaurant ? (
            <div className="restaurant-summary">
              <div><h3>{selectedName}</h3><p>{selectedRestaurant.description || selectedRestaurant.desc || "بدون وصف"}</p></div>
              <div className="stats"><span>{selectedRestaurant.deliveryTime || "غير محدد"}</span><span>{money(selectedRestaurant.deliveryFee)}</span><span>أقل طلب {money(selectedRestaurant.minOrder)}</span></div>
              <div className="restaurant-actions">
                <button className={selectedRestaurant.active !== false && selectedRestaurant.open !== false && selectedRestaurant.isOpen !== false && selectedRestaurant.status !== "مغلق" ? "danger" : "success"} onClick={() => toggleRestaurant(selectedRestaurant)} disabled={saving}>
                  {selectedRestaurant.active !== false && selectedRestaurant.open !== false && selectedRestaurant.isOpen !== false && selectedRestaurant.status !== "مغلق" ? "إطفاء المطعم وإخفاؤه" : "تشغيل المطعم وإظهاره"}
                </button>
                {role === "admin" ? <button onClick={() => editRestaurant(selectedRestaurant)}>تعديل التفاصيل</button> : null}
              </div>
            </div>
          ) : <div className="empty">ماكو مطاعم حالياً. أضف أول مطعم من الأعلى.</div>}
        </section>

        <section className="layout">
          <section className="panel">
            <div className="panel-head"><div><small>Live Orders</small><h2>طلبات المطعم</h2></div><b>{visibleOrders.length}</b></div>
            {visibleOrders.length ? visibleOrders.slice(0, 40).map((order) => (
              <article className="card" key={order.documentId}>
                <div><h3>{order.customerName || order.customer || "زبون"}</h3><p>{order.address || "بدون عنوان"} — {order.phone || order.customerPhone || "بدون هاتف"}</p></div>
                <strong>{money(order.total || order.amount)}</strong>
                <select value={order.status || "جديد"} onChange={(e) => updateOrder(order, e.target.value)}>
                  {["جديد", "قيد التحضير", "جاهز للتوصيل", "قيد التوصيل", "تم التسليم", "مرفوض"].map((status) => <option key={status}>{status}</option>)}
                </select>
              </article>
            )) : <div className="empty"><h3>ماكو طلبات مطابقة</h3><p>الطلب الجديد يظهر هنا مباشرة.</p></div>}
          </section>

          <aside className="panel">
            <div className="panel-head"><div><small>Menu Control</small><h2>منيو {selectedName || "المطعم"}</h2></div><b>{visibleMenu.length}</b></div>
            <div className="menu-form">
              <input placeholder="اسم الصنف" value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} />
              <input placeholder="السعر" inputMode="numeric" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} />
              <input placeholder="القسم" value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} />
              <input placeholder="رابط صورة الصنف" dir="ltr" value={menuForm.image} onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })} />
              <button className="primary" onClick={addMenuItem} disabled={saving || !selectedRestaurant}>إضافة صنف</button>
            </div>
            <div className="menu-list">
              {visibleMenu.map((item) => {
                const available = item.available !== false && item.isAvailable !== false;
                return <article className="menu-card" key={item.documentId}>
                  <div><h3>{item.name || item.title || "صنف"}</h3><p>{item.category || "عام"}</p></div>
                  <strong>{money(item.price)}</strong>
                  <button className={available ? "danger" : "primary"} onClick={() => toggleMenu(item)}>{available ? "إيقاف" : "تفعيل"}</button>
                </article>;
              })}
              {!visibleMenu.length ? <div className="empty"><h3>ماكو أصناف حالياً</h3><p>اختار المطعم وأضف أصنافه من الأعلى.</p></div> : null}
            </div>
          </aside>
        </section>
      </section>

      <style jsx>{`
        *{box-sizing:border-box}.page{min-height:100vh;background:radial-gradient(circle at top right,rgba(255,122,0,.15),transparent 30%),#050505;color:#fff;padding:22px 14px;font-family:Arial,sans-serif}.shell{max-width:1180px;margin:auto}.topbar{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:16px}.topbar small,.panel-head small{color:#ff7a00;font-weight:900}.topbar h1,.panel-head h2{margin:5px 0 0}.topbar nav{display:flex;gap:8px}.topbar a,.restaurant-tabs button,.restaurant-summary button{color:#fff;text-decoration:none;border:1px solid #333;background:#151515;border-radius:14px;padding:11px 14px;font-weight:900}.panel{background:rgba(24,20,18,.96);border:1px solid #34302e;border-radius:28px;padding:18px;margin-bottom:16px}.panel-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.panel-head>b{background:#ff7a00;color:#050505;padding:10px 13px;border-radius:14px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.form-grid .wide{grid-column:1/-1}input,textarea,select{width:100%;border:1px solid #31363a;background:#030303;color:#fff;border-radius:16px;padding:15px;font-size:16px;font-weight:800}textarea{min-height:90px;resize:vertical}.switch{display:flex;gap:10px;align-items:center;background:#090909;border:1px solid #333;border-radius:16px;padding:14px}.switch input{width:22px;height:22px}.primary{background:#ff7a00!important;color:#050505!important;border:0!important;font-weight:950}.wide-btn{width:100%;border-radius:16px;padding:16px;margin-top:12px}.restaurant-tabs{display:flex;gap:8px;overflow:auto;padding-bottom:5px}.restaurant-tabs button.active{background:#ff7a00;color:#050505;border-color:#ff7a00}.restaurant-summary{margin-top:14px;background:#080808;border:1px solid #333;border-radius:20px;padding:15px;display:grid;gap:12px}.restaurant-summary h3{font-size:26px;margin:0}.restaurant-summary p{color:#aaa}.stats{display:flex;gap:8px;flex-wrap:wrap}.stats span{background:#1a1a1a;border-radius:12px;padding:9px 11px;color:#ddd}.layout{display:grid;grid-template-columns:1.15fr .85fr;gap:16px}.card,.menu-card{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;background:#090909;border:1px solid #303030;border-radius:18px;padding:13px;margin-bottom:9px}.card h3,.menu-card h3{margin:0}.card p,.menu-card p{margin:5px 0 0;color:#999}.card select{min-width:150px;padding:10px}.menu-form{display:grid;gap:9px;margin-bottom:14px}.menu-card button{border:0;border-radius:12px;padding:10px 12px;font-weight:900}.danger{background:#3b1111;color:#ff9d9d}.empty{text-align:center;background:#090909;border:1px dashed #333;border-radius:20px;padding:24px;color:#aaa}.alert{position:sticky;top:8px;z-index:5;border-radius:16px;padding:13px;margin-bottom:12px;font-weight:900}.ok{background:#12351d;color:#9cffb8}.bad{background:#401313;color:#ffaaaa}@media(max-width:760px){.page{padding:12px 8px}.topbar{align-items:flex-start}.topbar h1{font-size:25px}.layout{grid-template-columns:1fr}.form-grid{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}.panel{border-radius:22px;padding:14px}.card,.menu-card{grid-template-columns:1fr}.card select{min-width:0}.restaurant-summary{display:block}.restaurant-summary button{margin-top:10px;width:100%}}
      `}</style>
    </main>
  );
}
