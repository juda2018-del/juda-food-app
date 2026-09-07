"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import { FUSE_LOCAL_SESSION, parseFuseRole, roleHome, type FuseRole, type FuseSession } from "@/lib/fuse-auth";
import { isCatalogMenuItemId } from "@/lib/fuse-catalog";
import {
  canRestaurantTransition,
  fuseStatusTimestampField,
  normalizeFuseOrderStatus,
  restaurantNextStatuses,
  type FuseOrderStatus,
} from "@/lib/fuse-order-status";
import { notifyOrderStatusChange } from "@/lib/fuse-order-notifications";
import { isFuseRestaurantOpen } from "@/lib/fuse-restaurant";

type RestaurantDoc = {
  documentId: string;
  name?: string;
  title?: string;
  restaurantName?: string;
  restaurant?: string;
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
  status?: string;
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
  orderId?: string;
  name?: string;
  title?: string;
  customerName?: string;
  customer?: string;
  phone?: string;
  customerPhone?: string;
  customerUid?: string;
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

const emptyMenu = { price: "" };

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

function getRestaurantName(item: RestaurantDoc | MenuDoc | OrderDoc) {
  return String(item.restaurantName || item.restaurant || item.name || item.title || "مطعم").trim();
}

function sessionRestaurantKey(session: FuseSession | null) {
  return String(session?.restaurantId || session?.restaurant || session?.restaurantName || "").trim();
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
  const [editingMenuId, setEditingMenuId] = useState("");
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
    if (!session) return;
    return onSnapshot(query(collection(db, "restaurants")), (snapshot) => {
      const all = snapshot.docs.map((item) => ({
        ...(item.data() as Omit<RestaurantDoc, "documentId">),
        documentId: item.id,
      }));

      if (session.role === "admin") {
        setRestaurants(all);
        setSelectedId((current) => current && all.some((item) => item.documentId === current) ? current : all[0]?.documentId || "");
        return;
      }

      const ownKey = sessionRestaurantKey(session);
      const own = all.find((item) => item.documentId === ownKey || getRestaurantName(item).toLowerCase() === ownKey.toLowerCase());
      setRestaurants(own ? [own] : []);
      setSelectedId(own?.documentId || "");
      if (!own) setError("حساب المطعم غير مربوط بمطعم. راجع إدارة FUSE لربط الحساب.");
    });
  }, [session]);

  useEffect(() => {
    if (!session || !selectedId) {
      setMenu([]);
      setOrders([]);
      return;
    }

    const unsubMenu = onSnapshot(
      query(collection(db, "menu"), where("restaurantId", "==", selectedId)),
      (snapshot) => setMenu(snapshot.docs.map((item) => ({ ...(item.data() as Omit<MenuDoc, "documentId">), documentId: item.id }))),
      () => setMenu([])
    );

    const unsubOrders = onSnapshot(
      query(collection(db, "orders"), where("restaurantId", "==", selectedId)),
      (snapshot) => setOrders(snapshot.docs.map((item) => ({ ...(item.data() as Omit<OrderDoc, "documentId">), documentId: item.id }))),
      () => setOrders([])
    );

    return () => {
      unsubMenu();
      unsubOrders();
    };
  }, [selectedId, session]);

  const role: FuseRole | null = session?.role || null;
  const selectedRestaurant = restaurants.find((item) => item.documentId === selectedId) || null;
  const selectedName = selectedRestaurant ? getRestaurantName(selectedRestaurant) : "";
  const canManage = Boolean(selectedRestaurant && (role === "admin" || restaurants.length === 1));
  const sortedOrders = useMemo(() => [...orders].sort((a, b) => String(b.orderId || b.documentId).localeCompare(String(a.orderId || a.documentId))), [orders]);

  function flash(text: string, bad = false) {
    setMessage(bad ? "" : text);
    setError(bad ? text : "");
    window.setTimeout(() => {
      setMessage("");
      if (!bad) setError("");
    }, 2800);
  }

  function assertManage() {
    if (!canManage || !selectedRestaurant) {
      flash("ما عندك صلاحية على هذا المطعم.", true);
      return false;
    }
    return true;
  }

  async function saveRestaurant() {
    if (role !== "admin") return flash("إضافة وتعديل المطاعم متاحة للإدارة فقط.", true);
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
        deliveryFee: Math.max(0, Number(restaurantForm.deliveryFee || 0)),
        minOrder: Math.max(0, Number(restaurantForm.minOrder || 0)),
        open: restaurantForm.open,
        isOpen: restaurantForm.open,
        active: restaurantForm.open,
        status: restaurantForm.open ? "مفتوح" : "مغلق",
        updatedAt: serverTimestamp(),
      };

      if (editingRestaurantId) {
        await updateDoc(doc(db, "restaurants", editingRestaurantId), payload);
        setSelectedId(editingRestaurantId);
      } else {
        const created = await addDoc(collection(db, "restaurants"), { ...payload, createdAt: serverTimestamp() });
        setSelectedId(created.id);
      }
      setEditingRestaurantId("");
      setRestaurantForm(emptyRestaurant);
      flash("تم حفظ المطعم.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "تعذر حفظ المطعم.", true);
    } finally {
      setSaving(false);
    }
  }

  function editRestaurant(item: RestaurantDoc) {
    if (role !== "admin") return;
    setEditingRestaurantId(item.documentId);
    setSelectedId(item.documentId);
    setRestaurantForm({
      name: getRestaurantName(item),
      description: item.description || item.desc || "",
      cuisine: item.cuisine || item.category || "",
      area: item.area || "",
      address: item.address || "",
      phone: item.phone || "",
      image: item.image || item.cover || item.logo || "",
      deliveryTime: item.deliveryTime || "25 - 35 دقيقة",
      deliveryFee: String(item.deliveryFee || 0),
      minOrder: String(item.minOrder || 0),
      open: isFuseRestaurantOpen(item),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleRestaurant() {
    if (!assertManage() || !selectedRestaurant) return;
    const open = isFuseRestaurantOpen(selectedRestaurant);
    const next = !open;
    setSaving(true);
    try {
      // Rules allow restaurant updates of open/isOpen/status only — not `active`.
      await updateDoc(doc(db, "restaurants", selectedRestaurant.documentId), {
        open: next,
        isOpen: next,
        status: next ? "مفتوح" : "مغلق",
        updatedAt: serverTimestamp(),
      });
      flash(next ? "تم تشغيل المطعم." : "تم إطفاء المطعم.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "تعذر تغيير حالة المطعم.", true);
    } finally {
      setSaving(false);
    }
  }

  async function saveMenuItem() {
    if (!assertManage() || !selectedRestaurant) return;
    if (!editingMenuId) {
      return flash("إضافة أصناف جديدة تحتاج موافقة الإدارة عبر الكتالوج الرسمي.", true);
    }
    if (!isCatalogMenuItemId(editingMenuId)) {
      return flash("هذا الصنف غير ضمن الكتالوج الرسمي ولا يمكن تعديله للطلب.", true);
    }
    const price = Number(menuForm.price || 0);
    if (!Number.isFinite(price) || price <= 0) return flash("اكتب سعراً صحيحاً.", true);
    setSaving(true);
    try {
      await updateDoc(doc(db, "menu", editingMenuId), {
        price,
        updatedAt: serverTimestamp(),
      });
      flash("تم تحديث سعر الصنف.");
      setMenuForm(emptyMenu);
      setEditingMenuId("");
    } catch (e) {
      flash(e instanceof Error ? e.message : "تعذر حفظ الصنف.", true);
    } finally {
      setSaving(false);
    }
  }

  function editMenuItem(item: MenuDoc) {
    if (!assertManage()) return;
    if (!isCatalogMenuItemId(item.documentId)) {
      flash("هذا الصنف غير قابل للطلب — راجع الإدارة لإضافته للكتالوج.", true);
      return;
    }
    setEditingMenuId(item.documentId);
    setMenuForm({
      price: String(item.price || ""),
    });
  }

  async function toggleMenu(item: MenuDoc) {
    if (!assertManage() || item.restaurantId !== selectedId) return;
    if (!isCatalogMenuItemId(item.documentId)) {
      flash("لا يمكن تفعيل صنف غير رسمي. الأصناف القابلة للطلب من الكتالوج فقط.", true);
      return;
    }
    const next = !(item.available !== false && item.isAvailable !== false);
    try {
      await updateDoc(doc(db, "menu", item.documentId), {
        available: next,
        isAvailable: next,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      flash(e instanceof Error ? e.message : "تعذر تحديث الصنف.", true);
    }
  }

  async function updateOrder(order: OrderDoc, status: string) {
    if (!assertManage() || order.restaurantId !== selectedId) return;
    try {
      const canonical = normalizeFuseOrderStatus(status);
      const previous = normalizeFuseOrderStatus(order.status);
      if (!canRestaurantTransition(previous, canonical)) {
        flash(`لا يمكن نقل الطلب من «${previous}» إلى «${canonical}».`, true);
        return;
      }
      if (previous === canonical) return;

      const stampField = fuseStatusTimestampField(canonical);
      await updateDoc(doc(db, "orders", order.documentId), {
        status: canonical,
        statusAr: canonical,
        restaurantUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(stampField !== "updatedAt" ? { [stampField]: serverTimestamp() } : {}),
      });

      if (order.customerUid) {
        try {
          await notifyOrderStatusChange({
            customerUid: order.customerUid,
            orderDocumentId: order.documentId,
            orderId: order.orderId || order.documentId,
            status: canonical,
          });
        } catch {
          flash(`تم تحديث الطلب إلى ${canonical} لكن تعذر إرسال إشعار للزبون.`, true);
          return;
        }
      }

      if (canonical === "جاهز للتوصيل") {
        flash("تم التحديث. بانتظار تعيين سائق من الإدارة عبر /smart-dispatch.");
      } else {
        flash(`تم تحديث الطلب إلى ${canonical}.`);
      }
    } catch (e) {
      flash(e instanceof Error ? e.message : "تعذر تحديث الطلب.", true);
    }
  }

  const catalogMenu = useMemo(
    () => menu.filter((item) => isCatalogMenuItemId(item.documentId)),
    [menu]
  );
  const nonCatalogMenu = useMemo(
    () => menu.filter((item) => !isCatalogMenuItemId(item.documentId)),
    [menu]
  );

  return (
    <main dir="rtl" className="page">
      <section className="shell">
        <header className="topbar">
          <div><small>FUSE Restaurant</small><h1>إدارة المطعم والمنيو</h1></div>
          <nav><Link href="/">الرئيسية</Link><Link href="/restaurant-reels">نشر ريل</Link>{role === "admin" ? <Link href="/fuse-admin">الإدارة</Link> : null}</nav>
        </header>

        {message ? <div className="alert ok">{message}</div> : null}
        {error ? <div className="alert bad">{error}</div> : null}

        {role === "admin" ? (
          <section className="panel">
            <div className="panel-head"><div><small>Restaurant Setup</small><h2>{editingRestaurantId ? "تعديل المطعم" : "إضافة مطعم"}</h2></div></div>
            <div className="form-grid">
              <input placeholder="اسم المطعم" value={restaurantForm.name} onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })} />
              <input placeholder="نوع الأكل" value={restaurantForm.cuisine} onChange={(e) => setRestaurantForm({ ...restaurantForm, cuisine: e.target.value })} />
              <input placeholder="المنطقة" value={restaurantForm.area} onChange={(e) => setRestaurantForm({ ...restaurantForm, area: e.target.value })} />
              <input placeholder="العنوان" value={restaurantForm.address} onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })} />
              <input placeholder="الهاتف" dir="ltr" value={restaurantForm.phone} onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })} />
              <input placeholder="وقت التوصيل" value={restaurantForm.deliveryTime} onChange={(e) => setRestaurantForm({ ...restaurantForm, deliveryTime: e.target.value })} />
              <input placeholder="أجرة التوصيل" inputMode="numeric" value={restaurantForm.deliveryFee} onChange={(e) => setRestaurantForm({ ...restaurantForm, deliveryFee: e.target.value })} />
              <input placeholder="أقل طلب" inputMode="numeric" value={restaurantForm.minOrder} onChange={(e) => setRestaurantForm({ ...restaurantForm, minOrder: e.target.value })} />
              <input className="wide" placeholder="رابط الصورة" dir="ltr" value={restaurantForm.image} onChange={(e) => setRestaurantForm({ ...restaurantForm, image: e.target.value })} />
              <textarea className="wide" placeholder="الوصف" value={restaurantForm.description} onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })} />
              <label className="switch wide"><input type="checkbox" checked={restaurantForm.open} onChange={(e) => setRestaurantForm({ ...restaurantForm, open: e.target.checked })} /> المطعم مفتوح</label>
            </div>
            <button className="primary wide-btn" onClick={saveRestaurant} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ المطعم"}</button>
          </section>
        ) : null}

        <section className="panel">
          <div className="panel-head"><div><small>Restaurant</small><h2>{role === "admin" ? "اختر المطعم" : "مطعمي"}</h2></div><b>{restaurants.length}</b></div>
          {role === "admin" ? <div className="tabs">{restaurants.map((item) => <button key={item.documentId} className={selectedId === item.documentId ? "active" : ""} onClick={() => setSelectedId(item.documentId)}>{getRestaurantName(item)}</button>)}</div> : null}
          {selectedRestaurant ? <div className="summary"><div><h3>{selectedName}</h3><p>{selectedRestaurant.description || selectedRestaurant.desc || "بدون وصف"}</p></div><div className="stats"><span>{selectedRestaurant.deliveryTime || "غير محدد"}</span><span>{money(selectedRestaurant.deliveryFee)}</span><span>أقل طلب {money(selectedRestaurant.minOrder)}</span></div><div className="actions"><button onClick={toggleRestaurant} disabled={saving}>تشغيل / إطفاء</button>{role === "admin" ? <button onClick={() => editRestaurant(selectedRestaurant)}>تعديل</button> : null}</div></div> : <div className="empty">ماكو مطعم مربوط بهذا الحساب.</div>}
        </section>

        <section className="layout">
          <section className="panel">
            <div className="panel-head"><div><small>Live Orders</small><h2>طلبات المطعم</h2></div><b>{sortedOrders.length}</b></div>
            {sortedOrders.length ? sortedOrders.slice(0, 40).map((order) => {
              const currentStatus = normalizeFuseOrderStatus(order.status);
              const nextStatuses = restaurantNextStatuses(currentStatus);
              const options = Array.from(new Set<FuseOrderStatus>([currentStatus, ...nextStatuses]));
              return (
                <article className="card" key={order.documentId}>
                  <div>
                    <h3>{order.customerName || order.customer || "زبون"}</h3>
                    <p>#{order.orderId || order.documentId} — {order.address || "بدون عنوان"} — {order.phone || order.customerPhone || "بدون هاتف"}</p>
                    {currentStatus === "جاهز للتوصيل" ? (
                      <p className="dispatch-wait">بانتظار تعيين سائق من الإدارة — تواصل مع الدعم أو انتظر لوحة /smart-dispatch</p>
                    ) : null}
                  </div>
                  <strong>{money(order.total || order.amount)}</strong>
                  <select
                    value={currentStatus}
                    disabled={nextStatuses.length === 1 && nextStatuses[0] === currentStatus}
                    onChange={(e) => updateOrder(order, e.target.value)}
                  >
                    {options.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </article>
              );
            }) : <div className="empty">ماكو طلبات حالياً.</div>}
          </section>

          <aside className="panel">
            <div className="panel-head"><div><small>Menu Control</small><h2>منيو {selectedName || "المطعم"}</h2></div><b>{catalogMenu.length}</b></div>
            <p className="menu-hint">إدارة الأصناف الرسمية القابلة للطلب فقط. إضافة صنف جديد يحتاج موافقة الإدارة وزرع الكتالوج.</p>
            {editingMenuId ? (
              <div className="menu-form">
                <p className="editing-label">تعديل سعر: {catalogMenu.find((item) => item.documentId === editingMenuId)?.name || editingMenuId}</p>
                <input placeholder="السعر" inputMode="numeric" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} />
                <button className="primary" onClick={saveMenuItem} disabled={saving || !selectedRestaurant}>حفظ السعر</button>
                <button type="button" onClick={() => { setEditingMenuId(""); setMenuForm(emptyMenu); }}>إلغاء</button>
              </div>
            ) : (
              <div className="menu-form">
                <button
                  type="button"
                  className="request-add"
                  onClick={() => flash("طلب إضافة صنف جديد يحتاج موافقة الإدارة عبر الكتالوج الرسمي (scripts/fuse-catalog).")}
                >
                  طلب إضافة صنف جديد (يحتاج موافقة)
                </button>
              </div>
            )}
            <div>
              {catalogMenu.map((item) => {
                const available = item.available !== false && item.isAvailable !== false;
                return (
                  <article className="menu-card" key={item.documentId}>
                    <div>
                      <h3>{item.name || item.title || "صنف"}</h3>
                      <p>{item.category || "عام"} · كتالوج رسمي</p>
                    </div>
                    <strong>{money(item.price)}</strong>
                    <div className="menu-actions">
                      <button onClick={() => toggleMenu(item)}>{available ? "إيقاف" : "تفعيل"}</button>
                      <button onClick={() => editMenuItem(item)}>تعديل السعر</button>
                    </div>
                  </article>
                );
              })}
              {!catalogMenu.length ? <div className="empty">ماكو أصناف رسمية لهذا المطعم. راجع الإدارة لزرع الكتالوج.</div> : null}
              {nonCatalogMenu.length ? (
                <div className="non-catalog">
                  <p>أصناف غير قابلة للطلب (معرف عشوائي — لن تظهر للزبون كأصناف طلب):</p>
                  {nonCatalogMenu.map((item) => (
                    <article className="menu-card muted" key={item.documentId}>
                      <div>
                        <h3>{item.name || item.title || "صنف"}</h3>
                        <p>غير مدرج في الكتالوج الرسمي</p>
                      </div>
                      <strong>{money(item.price)}</strong>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </aside>
        </section>
      </section>

      <style jsx>{`
        *{box-sizing:border-box}.page{min-height:100vh;background:#050505;color:#fff;padding:22px 14px;font-family:Arial,sans-serif}.shell{max-width:1180px;margin:auto}.topbar{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:16px}.topbar small,.panel-head small{color:#ff7a00;font-weight:900}.topbar h1,.panel-head h2{margin:5px 0 0}.topbar nav{display:flex;gap:8px;flex-wrap:wrap}.topbar a,.tabs button,.summary button{color:#fff;text-decoration:none;border:1px solid #333;background:#151515;border-radius:14px;padding:11px 14px;font-weight:900}.panel{background:#181412;border:1px solid #34302e;border-radius:28px;padding:18px;margin-bottom:16px}.panel-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.panel-head>b{background:#ff7a00;color:#050505;padding:10px 13px;border-radius:14px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.wide{grid-column:1/-1}input,textarea,select{width:100%;border:1px solid #31363a;background:#030303;color:#fff;border-radius:16px;padding:15px;font-size:16px;font-weight:800}textarea{min-height:90px}.switch{display:flex;gap:10px;align-items:center}.switch input{width:22px}.primary{background:#ff7a00!important;color:#050505!important;border:0!important;font-weight:950}.wide-btn{width:100%;border-radius:16px;padding:16px;margin-top:12px}.tabs{display:flex;gap:8px;overflow:auto}.tabs button.active{background:#ff7a00;color:#050505}.summary{margin-top:14px;background:#080808;border:1px solid #333;border-radius:20px;padding:15px;display:grid;gap:12px}.summary h3{font-size:26px;margin:0}.summary p{color:#aaa}.stats,.actions{display:flex;gap:8px;flex-wrap:wrap}.stats span{background:#1a1a1a;border-radius:12px;padding:9px 11px}.layout{display:grid;grid-template-columns:1.15fr .85fr;gap:16px}.card,.menu-card{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;background:#090909;border:1px solid #303030;border-radius:18px;padding:13px;margin-bottom:9px}.card h3,.menu-card h3{margin:0}.card p,.menu-card p{margin:5px 0 0;color:#999}.card select{min-width:150px;padding:10px}.dispatch-wait{color:#ffb347!important;font-weight:900;margin-top:8px!important}.menu-hint{color:#aaa;line-height:1.7;margin:0 0 12px;font-size:13px}.editing-label{margin:0;font-weight:900;color:#ffb347}.menu-form{display:grid;gap:9px;margin-bottom:14px}.menu-form small{color:#999;line-height:1.6}.request-add{border:1px dashed #555;background:#121212;color:#ffb347;border-radius:14px;padding:14px;font-weight:900;cursor:pointer}.menu-actions{display:flex;gap:6px;flex-wrap:wrap}.menu-card button{border:0;border-radius:12px;padding:10px 12px;font-weight:900}.menu-card.muted{opacity:.72;grid-template-columns:1fr auto}.non-catalog{margin-top:14px;padding-top:12px;border-top:1px dashed #333}.non-catalog>p{color:#ffaaaa;font-weight:900;margin:0 0 10px}.empty{text-align:center;background:#090909;border:1px dashed #333;border-radius:20px;padding:24px;color:#aaa}.alert{position:sticky;top:8px;z-index:5;border-radius:16px;padding:13px;margin-bottom:12px;font-weight:900}.ok{background:#12351d;color:#9cffb8}.bad{background:#401313;color:#ffaaaa}@media(max-width:760px){.page{padding:12px 8px}.topbar{align-items:flex-start}.layout,.form-grid{grid-template-columns:1fr}.wide{grid-column:auto}.panel{border-radius:22px;padding:14px}.card,.menu-card{grid-template-columns:1fr}.card select{min-width:0}.summary{display:block}.summary button{margin-top:10px;width:100%}}
      `}</style>
    </main>
  );
}
