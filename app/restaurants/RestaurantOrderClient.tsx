"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, onSnapshot, query, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

type MenuDoc = {
  documentId: string;
  name?: string;
  title?: string;
  restaurant?: string;
  restaurantName?: string;
  category?: string;
  price?: number;
  available?: boolean;
  isAvailable?: boolean;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  category: string;
};

const fallbackMenu: MenuDoc[] = [
  { documentId: "fayrouz-1", restaurant: "فيروز", name: "مخلمة", category: "فطور", price: 7000, available: true },
  { documentId: "fayrouz-2", restaurant: "فيروز", name: "كاهي قشطة", category: "كاهي وبورك", price: 5000, available: true },
  { documentId: "fayrouz-3", restaurant: "فيروز", name: "باقلة بالدهن", category: "فطور", price: 6000, available: true },
  { documentId: "fayrouz-4", restaurant: "فيروز", name: "طماطة وبيض", category: "فطور", price: 6000, available: true },
  { documentId: "shalteta-1", restaurant: "شلتتة", name: "مشلتت سادة", category: "مشلتت", price: 8000, available: true },
  { documentId: "shalteta-2", restaurant: "شلتتة", name: "فطير جبن موزريلا", category: "فطائر", price: 9000, available: true },
  { documentId: "khan-1", restaurant: "خان قدوري", name: "وجبة عراقية", category: "وجبات", price: 12000, available: true },
  { documentId: "forn-1", restaurant: "الفرن", name: "منقوشة جبن", category: "مناقيش", price: 5000, available: true },
  { documentId: "forn-2", restaurant: "الفرن", name: "وافل شوكولاتة", category: "حلويات", price: 7000, available: true }
];

function getMenuName(item: MenuDoc) {
  return item.name || item.title || "صنف";
}

function getRestaurant(item: MenuDoc) {
  return item.restaurant || item.restaurantName || "مطعم";
}

function menuAvailable(item: MenuDoc) {
  return item.available !== false && item.isAvailable !== false;
}

function itemPrice(value?: number) {
  return Number(value || 0);
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top right, rgba(255,122,0,0.18), transparent 34%), #050505",
    color: "white",
    padding: "26px 16px",
    fontFamily: "Arial, sans-serif"
  },
  shell: { width: "100%", maxWidth: 1180, margin: "0 auto" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 },
  nav: { display: "flex", gap: 10, flexWrap: "wrap" },
  pill: {
    border: "1px solid rgba(255,255,255,0.13)",
    borderRadius: 999,
    background: "rgba(255,255,255,0.05)",
    padding: "11px 16px",
    color: "rgba(255,255,255,0.82)",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 900
  },
  activePill: {
    border: "1px solid rgba(255,122,0,0.35)",
    borderRadius: 999,
    background: "#FF7A00",
    padding: "11px 16px",
    color: "#000",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 950
  },
  hero: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 34,
    background: "linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,122,0,0.12))",
    boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
    padding: 22,
    marginBottom: 16
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) repeat(3, minmax(150px, 0.32fr))",
    gap: 12,
    alignItems: "stretch"
  },
  card: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    background: "rgba(0,0,0,0.36)",
    padding: 20
  },
  compactCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 24,
    background: "rgba(0,0,0,0.34)",
    padding: 16,
    minHeight: 118
  },
  eyebrow: { margin: 0, color: "#FF7A00", fontSize: 13, fontWeight: 950 },
  title: { margin: "8px 0 0", fontSize: "clamp(38px, 6vw, 70px)", lineHeight: 1.06, fontWeight: 950 },
  orange: { color: "#FF7A00" },
  muted: { color: "rgba(255,255,255,0.60)", lineHeight: 1.85, fontSize: 14 },
  statLabel: { margin: 0, color: "rgba(255,255,255,0.54)", fontSize: 13, fontWeight: 850 },
  statValue: { margin: "9px 0 0", fontSize: 28, fontWeight: 950 },
  layout: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.42fr)", gap: 14, alignItems: "start" },
  section: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 30,
    background: "rgba(255,255,255,0.045)",
    padding: 18
  },
  sectionTitle: { margin: 0, fontSize: 28, fontWeight: 950 },
  filterGrid: { display: "grid", gridTemplateColumns: "minmax(220px, 1fr) minmax(160px, 0.34fr)", gap: 12, marginTop: 14, marginBottom: 14 },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    background: "#070707",
    color: "white",
    padding: "14px 15px",
    outline: "none",
    fontSize: 14
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    background: "#070707",
    color: "white",
    padding: "14px 15px",
    outline: "none",
    fontSize: 14
  },
  menuGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 },
  menuCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 24,
    background: "linear-gradient(135deg, rgba(0,0,0,0.35), rgba(255,122,0,0.06))",
    padding: 16
  },
  menuTop: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid rgba(34,197,94,0.42)",
    borderRadius: 999,
    background: "rgba(34,197,94,0.12)",
    color: "#86EFAC",
    padding: "7px 11px",
    fontSize: 12,
    fontWeight: 950
  },
  addButton: {
    width: "100%",
    border: 0,
    borderRadius: 16,
    background: "#FF7A00",
    color: "#000",
    padding: "13px 14px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 950,
    marginTop: 14
  },
  disabledButton: {
    width: "100%",
    border: 0,
    borderRadius: 16,
    background: "rgba(255,255,255,0.09)",
    color: "rgba(255,255,255,0.35)",
    padding: "13px 14px",
    fontSize: 13,
    fontWeight: 950,
    marginTop: 14
  },
  cartBox: {
    position: "sticky",
    top: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 30,
    background: "rgba(255,255,255,0.045)",
    padding: 18
  },
  cartList: { display: "grid", gap: 10, marginTop: 14, marginBottom: 14 },
  cartRow: {
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 18,
    background: "rgba(0,0,0,0.26)",
    padding: 12
  },
  qtyRow: { display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  smallButton: {
    width: 34,
    height: 34,
    border: "1px solid rgba(255,122,0,0.32)",
    borderRadius: 12,
    background: "rgba(255,122,0,0.12)",
    color: "#FFB56B",
    cursor: "pointer",
    fontWeight: 950
  },
  formGrid: { display: "grid", gap: 10, marginTop: 14 },
  mainButton: {
    width: "100%",
    border: 0,
    borderRadius: 18,
    background: "#FF7A00",
    color: "#000",
    padding: "15px 16px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 950,
    marginTop: 14
  },
  messageOk: {
    border: "1px solid rgba(34,197,94,0.30)",
    borderRadius: 18,
    background: "rgba(34,197,94,0.10)",
    color: "#86EFAC",
    padding: 14,
    marginTop: 14,
    fontSize: 14,
    fontWeight: 900
  },
  messageBad: {
    border: "1px solid rgba(239,68,68,0.30)",
    borderRadius: 18,
    background: "rgba(239,68,68,0.10)",
    color: "#FCA5A5",
    padding: 14,
    marginTop: 14,
    fontSize: 14,
    fontWeight: 900
  },
  empty: {
    border: "1px dashed rgba(255,255,255,0.16)",
    borderRadius: 24,
    background: "rgba(255,255,255,0.035)",
    padding: 24,
    textAlign: "center"
  }
};

export default function RestaurantOrderClient({ restaurant }: { restaurant: string }) {
  const router = useRouter();
  const [menu, setMenu] = useState<MenuDoc[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("الكل");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "menu")),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<MenuDoc, "documentId">),
          documentId: item.id
        }));
        setMenu(data);
      },
      () => setMenu([])
    );

    return () => unsubscribe();
  }, []);

  const restaurantMenu = useMemo(() => {
    const firestoreItems = menu.filter((item) => getRestaurant(item) === restaurant).filter(menuAvailable);
    const source = firestoreItems.length ? firestoreItems : fallbackMenu.filter((item) => getRestaurant(item) === restaurant);
    const cleanSearch = search.trim().toLowerCase();

    return source.filter((item) => {
      const matchesSearch = !cleanSearch || [getMenuName(item), item.category || ""].join(" ").toLowerCase().includes(cleanSearch);
      const matchesCategory = category === "الكل" || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, menu, restaurant, search]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    const firestoreItems = menu.filter((item) => getRestaurant(item) === restaurant);
    const source = firestoreItems.length ? firestoreItems : fallbackMenu.filter((item) => getRestaurant(item) === restaurant);

    source.forEach((item) => {
      if (item.category) set.add(item.category);
    });

    return ["الكل", ...Array.from(set)];
  }, [menu, restaurant]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = cart.length ? 2000 : 0;
  const total = subtotal + deliveryFee;

  function addToCart(item: MenuDoc) {
    const id = item.documentId;
    const name = getMenuName(item);
    const selectedPrice = itemPrice(item.price);
    const itemCategory = item.category || "عام";

    setCart((current) => {
      const exists = current.find((cartItem) => cartItem.id === id);

      if (exists) {
        return current.map((cartItem) =>
          cartItem.id === id ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem
        );
      }

      return [...current, { id, name, price: selectedPrice, qty: 1, category: itemCategory }];
    });
  }

  function changeQty(id: string, direction: 1 | -1) {
    setCart((current) =>
      current
        .map((item) => (item.id === id ? { ...item, qty: Math.max(0, item.qty + direction) } : item))
        .filter((item) => item.qty > 0)
    );
  }

  async function submitOrder() {
    setMessage("");
    setError("");
    setOrderId("");

    if (!cart.length) {
      setError("السلة فارغة.");
      return;
    }

    if (!customerName.trim()) {
      setError("اكتب اسمك.");
      return;
    }

    if (!phone.trim()) {
      setError("اكتب رقم الهاتف.");
      return;
    }

    if (!address.trim()) {
      setError("اكتب العنوان.");
      return;
    }

    setSaving(true);

    try {
      const shortOrderId = "FUSE-" + Date.now().toString().slice(-6);

      await addDoc(collection(db, "orders"), {
        orderId: shortOrderId,
        customerName: customerName.trim(),
        customer: customerName.trim(),
        phone: phone.trim(),
        customerPhone: phone.trim(),
        address: address.trim(),
        note: note.trim(),
        restaurant,
        restaurantName: restaurant,
        items: cart.map((item) => ({
          name: item.name,
          title: item.name,
          qty: item.qty,
          quantity: item.qty,
          price: item.price,
          category: item.category
        })),
        subtotal,
        deliveryFee,
        total,
        amount: total,
        status: "جديد",
        source: "customer-restaurant-page",
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "notifications"), {
        type: "order",
        title: "طلب جديد",
        message: "وصل طلب جديد من " + customerName.trim() + " إلى مطعم " + restaurant + ".",
        restaurant,
        restaurantName: restaurant,
        phone: phone.trim(),
        orderId: shortOrderId,
        read: false,
        createdAt: serverTimestamp()
      });

      setOrderId(shortOrderId);
      setMessage("تم إرسال الطلب بنجاح. راح يظهر مباشرة للمتابعة.");
      setCart([]);

      setTimeout(() => {
        router.push("/order-status?phone=" + encodeURIComponent(phone.trim()));
      }, 1500);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر إرسال الطلب.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.topBar}>
          <nav style={styles.nav}>
            <Link href="/" style={styles.pill}>الرئيسية</Link>
            <Link href="/live-orders" style={styles.pill}>الطلبات المباشرة</Link>
            <Link href="/order-status" style={styles.pill}>حالة الطلب</Link>
          </nav>

          <Link href="/" style={styles.activePill}>رجوع للمطاعم</Link>
        </header>

        <section style={styles.hero}>
          <div style={styles.heroGrid}>
            <div style={styles.card}>
              <p style={styles.eyebrow}>مطعم</p>
              <h1 style={styles.title}>
                {restaurant}
                <br />
                <span style={styles.orange}>المنيو والطلب</span>
              </h1>
              <p style={styles.muted}>اختار الأصناف، أضفها للسلة، وأرسل الطلب مباشرة إلى لوحة المطعم.</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>الأصناف</p>
              <p style={{ ...styles.statValue, color: "#86EFAC" }}>{restaurantMenu.length}</p>
              <p style={styles.muted}>متاحة للطلب</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>السلة</p>
              <p style={{ ...styles.statValue, color: "#FFB56B" }}>{cart.length}</p>
              <p style={styles.muted}>أصناف مختارة</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>المجموع</p>
              <p style={{ ...styles.statValue, color: "#7DD3FC" }}>{total.toLocaleString()}</p>
              <p style={styles.muted}>دينار عراقي</p>
            </div>
          </div>
        </section>

        <section style={styles.layout}>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>المنيو</h2>

            <div style={styles.filterGrid}>
              <input value={search} onChange={(event) => setSearch(event.target.value)} style={styles.input} placeholder="ابحث عن صنف..." />
              <select value={category} onChange={(event) => setCategory(event.target.value)} style={styles.select}>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            {restaurantMenu.length === 0 ? (
              <div style={styles.empty}>
                <h3 style={{ margin: 0 }}>ماكو أصناف لهذا المطعم حالياً</h3>
                <p style={styles.muted}>أضف الأصناف من لوحة المطعم حتى تظهر هنا.</p>
              </div>
            ) : (
              <div style={styles.menuGrid}>
                {restaurantMenu.map((item) => (
                  <article key={item.documentId} style={styles.menuCard}>
                    <div style={styles.menuTop}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 21, fontWeight: 950 }}>{getMenuName(item)}</h3>
                        <p style={{ ...styles.muted, margin: "8px 0 0" }}>{item.category || "عام"}</p>
                      </div>

                      <span style={styles.badge}>متاح</span>
                    </div>

                    <p style={{ margin: "14px 0 0", color: "#FFB56B", fontSize: 24, fontWeight: 950 }}>
                      {itemPrice(item.price).toLocaleString()} د.ع
                    </p>

                    <button onClick={() => addToCart(item)} style={styles.addButton}>إضافة للسلة</button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside style={styles.cartBox}>
            <h2 style={styles.sectionTitle}>السلة</h2>

            {cart.length === 0 ? (
              <div style={{ ...styles.empty, marginTop: 14 }}>
                <h3 style={{ margin: 0 }}>السلة فارغة</h3>
                <p style={styles.muted}>اختار صنف من المنيو حتى يظهر هنا.</p>
              </div>
            ) : (
              <div style={styles.cartList}>
                {cart.map((item) => (
                  <div key={item.id} style={styles.cartRow}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <strong>{item.name}</strong>
                      <span style={{ color: "#FFB56B", fontWeight: 950 }}>{(item.price * item.qty).toLocaleString()} د.ع</span>
                    </div>

                    <div style={styles.qtyRow}>
                      <button onClick={() => changeQty(item.id, -1)} style={styles.smallButton}>-</button>
                      <strong>{item.qty}</strong>
                      <button onClick={() => changeQty(item.id, 1)} style={styles.smallButton}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.card}>
              <p style={styles.statLabel}>المجموع الفرعي</p>
              <p style={{ margin: "8px 0 0", fontWeight: 950 }}>{subtotal.toLocaleString()} د.ع</p>

              <p style={{ ...styles.statLabel, marginTop: 12 }}>التوصيل</p>
              <p style={{ margin: "8px 0 0", fontWeight: 950 }}>{deliveryFee.toLocaleString()} د.ع</p>

              <p style={{ ...styles.statLabel, marginTop: 12 }}>الإجمالي</p>
              <p style={{ margin: "8px 0 0", fontSize: 28, color: "#FFB56B", fontWeight: 950 }}>{total.toLocaleString()} د.ع</p>
            </div>

            <div style={styles.formGrid}>
              <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} style={styles.input} placeholder="اسمك" />
              <input value={phone} onChange={(event) => setPhone(event.target.value)} style={styles.input} placeholder="رقم الهاتف" dir="ltr" />
              <input value={address} onChange={(event) => setAddress(event.target.value)} style={styles.input} placeholder="العنوان" />
              <input value={note} onChange={(event) => setNote(event.target.value)} style={styles.input} placeholder="ملاحظة اختيارية" />
            </div>

            <button onClick={submitOrder} disabled={saving} style={saving ? styles.disabledButton : styles.mainButton}>
              {saving ? "جاري إرسال الطلب..." : "إرسال الطلب"}
            </button>

            {message ? (
              <div style={styles.messageOk}>
                {message}
                {orderId ? <div style={{ marginTop: 8 }}>رقم الطلب: {orderId}</div> : null}
              </div>
            ) : null}

            {error ? <div style={styles.messageBad}>{error}</div> : null}
          </aside>
        </section>
      </section>
    </main>
  );
}
