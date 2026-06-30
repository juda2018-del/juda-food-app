"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { firebaseApp, firebaseAuth } from "@/lib/firebase/client";

type CustomerStatus = "checking" | "allowed" | "blocked";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  restaurantId: string;
  restaurantName: string;
};

type CartItem = MenuItem & {
  qty: number;
};

const db = getFirestore(firebaseApp);

const MENU_ITEMS: MenuItem[] = [
  {
    id: "fayrouz_mukhlama",
    name: "مخلمة فيروز",
    price: 6000,
    restaurantId: "fayrouz",
    restaurantName: "فيروز",
  },
  {
    id: "fayrouz_kahi",
    name: "كاهي وقيمر",
    price: 5000,
    restaurantId: "fayrouz",
    restaurantName: "فيروز",
  },
  {
    id: "shalteta_cheese",
    name: "مشلتت جبن",
    price: 7000,
    restaurantId: "shalteta",
    restaurantName: "شلتتة",
  },
  {
    id: "shalteta_mix",
    name: "مشلتت مكس",
    price: 9000,
    restaurantId: "shalteta",
    restaurantName: "شلتتة",
  },
  {
    id: "khan_breakfast",
    name: "فطور خان قدوري",
    price: 8000,
    restaurantId: "khan",
    restaurantName: "خان قدوري",
  },
];

function clean(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function formatIQD(value: number) {
  return `${value.toLocaleString("ar-IQ")} دينار`;
}

function roleFromEmail(email: string) {
  const e = clean(email);

  if (e === "admin@fuse.iq") return "admin";
  if (e === "restaurant@fuse.iq") return "restaurant";
  if (e === "driver@fuse.iq") return "driver";
  if (e === "customer@fuse.iq") return "customer";

  return "unknown";
}

function targetForRole(role: string) {
  if (role === "admin") return "/fuse-admin";
  if (role === "restaurant") return "/restaurant-admin";
  if (role === "driver") return "/driver?fuseRole=driver&fuseEmail=driver%40fuse.iq";
  if (role === "customer") return "/customer?fuseRole=customer&fuseEmail=customer%40fuse.iq";
  return "/login?next=/customer";
}

function writeCustomerSession(email: string) {
  const session = {
    role: "customer",
    fuseRole: "customer",
    email,
    fuseEmail: email,
    uid: "fuse-customer",
    name: "FUSE Customer",
    displayName: "FUSE Customer",
    customerId: "customer-demo",
    createdAt: new Date().toISOString(),
    source: "customer-real-order-page",
  };

  try {
    localStorage.setItem("FUSE_LOCAL_SESSION", JSON.stringify(session));
    localStorage.setItem("fuseRole", "customer");
    localStorage.setItem("fuseEmail", email);
    localStorage.setItem("fuseUser", JSON.stringify(session));
  } catch (error) {
    console.error("Customer session write failed", error);
  }
}

export default function CustomerClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<CustomerStatus>("checking");
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("جاري فحص حساب الزبون...");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("زبون تجربة");
  const [phone, setPhone] = useState("07700000000");
  const [address, setAddress] = useState("زيونة - قرب كاهي فيروز");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastOrderId, setLastOrderId] = useState("");

  const urlEmail = useMemo(() => clean(searchParams.get("fuseEmail")), [searchParams]);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const selectedRestaurant = useMemo(() => {
    if (cart.length === 0) return null;
    return {
      restaurantId: cart[0].restaurantId,
      restaurantName: cart[0].restaurantName,
    };
  }, [cart]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      const email = clean(nextUser?.email || urlEmail);
      const role = roleFromEmail(email);

      setUser(nextUser);

      if (!nextUser?.email) {
        setStatus("checking");
        setMessage("ماكو حساب داخل. جاري تحويلك إلى دخول الزبون...");
        router.replace("/login?next=/customer");
        return;
      }

      if (role !== "customer") {
        setStatus("blocked");
        setMessage(`الحساب الحالي ${email} مو حساب زبون.`);
        return;
      }

      writeCustomerSession(email);
      setStatus("allowed");
      setMessage("تم تثبيت جلسة الزبون بنجاح.");
    });

    return () => unsubscribe();
  }, [router, urlEmail]);

  function addToCart(item: MenuItem) {
    setLastOrderId("");

    setCart((prev) => {
      if (prev.length > 0 && prev[0].restaurantId !== item.restaurantId) {
        return [{ ...item, qty: 1 }];
      }

      const existing = prev.find((cartItem) => cartItem.id === item.id);

      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, qty: cartItem.qty + 1 }
            : cartItem
        );
      }

      return [...prev, { ...item, qty: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          return { ...item, qty: item.qty + delta };
        })
        .filter((item) => item.qty > 0)
    );
  }

  async function submitOrder() {
    if (!user?.email) {
      setMessage("لازم تدخل بحساب الزبون أولاً.");
      return;
    }

    if (cart.length === 0) {
      setMessage("السلة فارغة. أضف صنف قبل إرسال الطلب.");
      return;
    }

    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      setMessage("كمّل الاسم والهاتف والعنوان.");
      return;
    }

    setSubmitting(true);
    setMessage("جاري إرسال الطلب إلى Firestore...");

    const restaurantId = selectedRestaurant?.restaurantId || "unknown";
    const restaurantName = selectedRestaurant?.restaurantName || "غير محدد";

    try {
      const orderPayload = {
        source: "fuse-customer-production",
        orderType: "delivery",

        status: "new",
        statusAr: "جديد",
        paymentMethod: "cash",
        currency: "IQD",

        restaurantId,
        restaurantName,
        restaurant: restaurantName,

        customerId: "customer-demo",
        customerName: customerName.trim(),
        customerEmail: clean(user.email),
        customerPhone: phone.trim(),
        phone: phone.trim(),
        address: address.trim(),
        customerAddress: address.trim(),
        note: note.trim(),

        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          quantity: item.qty,
          total: item.price * item.qty,
          restaurantId: item.restaurantId,
          restaurantName: item.restaurantName,
        })),

        total,
        subtotal: total,
        deliveryFee: 0,
        grandTotal: total,

        driverId: "",
        driverName: "",
        driverEmail: "",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdAtText: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "orders"), orderPayload);

      setLastOrderId(docRef.id);
      setCart([]);
      setNote("");
      setMessage(`تم إرسال الطلب بنجاح. رقم الطلب: ${docRef.id}`);
    } catch (error) {
      console.error(error);
      setMessage("فشل إرسال الطلب إلى Firestore. دزلي الخطأ من Console إذا تكرر.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "checking") {
    return (
      <main dir="rtl" style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#050505",
        color: "#fff",
        fontFamily: "Cairo, system-ui, sans-serif",
        padding: 24
      }}>
        <section style={{
          width: "min(520px, 100%)",
          border: "1px solid rgba(255,122,0,0.28)",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 24,
          padding: 28,
          textAlign: "center"
        }}>
          <p style={{ margin: 0, color: "#FF7A00", fontWeight: 900 }}>
            FUSE Customer Guard
          </p>
          <h1 style={{ margin: "12px 0", fontSize: 30 }}>
            جاري فتح صفحة الزبون...
          </h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", lineHeight: 1.8 }}>
            {message}
          </p>
        </section>
      </main>
    );
  }

  if (status === "blocked") {
    const currentEmail = clean(user?.email);
    const currentRole = roleFromEmail(currentEmail);

    return (
      <main dir="rtl" style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#050505",
        color: "#fff",
        fontFamily: "Cairo, system-ui, sans-serif",
        padding: 24
      }}>
        <section style={{
          width: "min(560px, 100%)",
          border: "1px solid rgba(255,122,0,0.30)",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 24,
          padding: 28
        }}>
          <p style={{ margin: 0, color: "#FF7A00", fontWeight: 900 }}>
            FUSE Customer Access
          </p>
          <h1 style={{ margin: "12px 0", fontSize: 28 }}>
            هذا الحساب مو زبون
          </h1>
          <p style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8 }}>
            الحساب الحالي: <b>{currentEmail || "غير معروف"}</b>
          </p>

          <div style={{ display: "grid", gap: 12 }}>
            <button
              onClick={() => router.replace(targetForRole(currentRole))}
              style={{
                border: 0,
                borderRadius: 16,
                padding: "14px 18px",
                background: "#FF7A00",
                color: "#111",
                fontWeight: 950,
                cursor: "pointer"
              }}
            >
              رجوع للوحة الحساب الحالي
            </button>

            <button
              onClick={async () => {
                await signOut(firebaseAuth);
                router.replace("/login?next=/customer");
              }}
              style={{
                border: "1px solid rgba(255,120,120,0.38)",
                borderRadius: 16,
                padding: "14px 18px",
                background: "rgba(255,0,0,0.12)",
                color: "#ffb6b6",
                fontWeight: 900,
                cursor: "pointer"
              }}
            >
              تسجيل خروج والدخول بحساب الزبون
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main dir="rtl" style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top right, rgba(255,122,0,0.20), transparent 36%), #050505",
      color: "#fff",
      fontFamily: "Cairo, system-ui, sans-serif",
      padding: 24
    }}>
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "center",
        marginBottom: 24
      }}>
        <div style={{
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 999,
          padding: "14px 24px",
          fontWeight: 950,
          fontSize: 22
        }}>
          FUSE Customer
        </div>

        <button
          onClick={async () => {
            await signOut(firebaseAuth);
            router.replace("/login?next=/customer");
          }}
          style={{
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "#fff",
            borderRadius: 999,
            padding: "13px 22px",
            fontWeight: 900,
            cursor: "pointer"
          }}
        >
          تسجيل خروج
        </button>
      </header>

      <section style={{
        border: "1px solid rgba(255,255,255,0.12)",
        background: "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,122,0,0.12))",
        borderRadius: 30,
        padding: 28
      }}>
        <p style={{ margin: 0, color: "#FF7A00", fontWeight: 900 }}>
          صفحة الزبون
        </p>

        <h1 style={{
          fontSize: "clamp(42px, 7vw, 78px)",
          lineHeight: 1.15,
          margin: "12px 0 10px",
          fontWeight: 950
        }}>
          الطلب الحقيقي
          <br />
          <span style={{ color: "#FF7A00" }}>من الزبون إلى المطعم</span>
        </h1>

        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 18, marginBottom: 24 }}>
          الحساب الحالي: <b dir="ltr">{user?.email}</b>
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16
        }}>
          {[
            ["المطاعم المتاحة", "3", "فيروز، شلتتة، خان قدوري"],
            ["السلة", String(cart.length), "عدد الأصناف المختارة"],
            ["المجموع", formatIQD(total), "قبل أجور التوصيل"],
            ["آخر طلب", lastOrderId ? "تم" : "—", lastOrderId || "لم ترسل طلب بعد"]
          ].map(([title, value, caption]) => (
            <div key={title} style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.36)",
              borderRadius: 24,
              padding: 22,
              minHeight: 130
            }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.70)", fontWeight: 900 }}>
                {title}
              </p>
              <h2 style={{
                margin: "12px 0 6px",
                color: "#FF7A00",
                fontSize: 32
              }}>
                {value}
              </h2>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.58)", lineHeight: 1.7, wordBreak: "break-word" }}>
                {caption}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{
        marginTop: 20,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
        gap: 18
      }}>
        <div style={{
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 26,
          padding: 24
        }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 30 }}>
            المنيو التجريبي
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14
          }}>
            {MENU_ITEMS.map((item) => (
              <div key={item.id} style={{
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.28)",
                borderRadius: 22,
                padding: 20
              }}>
                <p style={{ margin: "0 0 6px", color: "#FF7A00", fontWeight: 900 }}>
                  {item.restaurantName}
                </p>
                <h3 style={{ margin: "0 0 8px", fontSize: 24 }}>
                  {item.name}
                </h3>
                <p style={{ margin: "0 0 14px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>
                  {formatIQD(item.price)}
                </p>
                <button
                  onClick={() => addToCart(item)}
                  style={{
                    width: "100%",
                    border: 0,
                    borderRadius: 14,
                    padding: "12px 14px",
                    background: "#FF7A00",
                    color: "#111",
                    fontWeight: 950,
                    cursor: "pointer"
                  }}
                >
                  إضافة للسلة
                </button>
              </div>
            ))}
          </div>
        </div>

        <aside style={{
          border: "1px solid rgba(255,122,0,0.22)",
          background: "rgba(0,0,0,0.34)",
          borderRadius: 26,
          padding: 24,
          alignSelf: "start"
        }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 30 }}>
            السلة وإرسال الطلب
          </h2>

          {cart.length === 0 ? (
            <div style={{
              border: "1px dashed rgba(255,255,255,0.18)",
              borderRadius: 18,
              padding: 18,
              color: "rgba(255,255,255,0.65)",
              lineHeight: 1.8
            }}>
              السلة فارغة. اختار صنف من المنيو.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
              {cart.map((item) => (
                <div key={item.id} style={{
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 16,
                  padding: 14,
                  background: "rgba(255,255,255,0.04)"
                }}>
                  <strong>{item.name}</strong>
                  <p style={{ margin: "6px 0", color: "rgba(255,255,255,0.60)" }}>
                    {item.restaurantName} — {formatIQD(item.price * item.qty)}
                  </p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={() => updateQty(item.id, -1)} style={smallButtonStyle}>-</button>
                    <b>{item.qty}</b>
                    <button onClick={() => updateQty(item.id, 1)} style={smallButtonStyle}>+</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gap: 12 }}>
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="اسم الزبون"
              style={inputStyle}
            />

            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="رقم الهاتف"
              style={{ ...inputStyle, direction: "ltr" }}
            />

            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="العنوان"
              style={inputStyle}
            />

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="ملاحظة اختيارية"
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />

            <div style={{
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 16,
              padding: 14,
              background: "rgba(255,255,255,0.04)"
            }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.62)" }}>
                المطعم
              </p>
              <h3 style={{ margin: "6px 0 0", color: "#FF7A00" }}>
                {selectedRestaurant?.restaurantName || "اختار صنف أولاً"}
              </h3>
            </div>

            <button
              onClick={submitOrder}
              disabled={submitting || cart.length === 0}
              style={{
                width: "100%",
                border: 0,
                borderRadius: 18,
                padding: "16px 18px",
                background: submitting || cart.length === 0 ? "rgba(255,255,255,0.18)" : "#FF7A00",
                color: submitting || cart.length === 0 ? "rgba(255,255,255,0.55)" : "#111",
                fontWeight: 950,
                fontSize: 17,
                cursor: submitting || cart.length === 0 ? "not-allowed" : "pointer"
              }}
            >
              {submitting ? "جاري إرسال الطلب..." : `إرسال الطلب — ${formatIQD(total)}`}
            </button>

            <p style={{
              margin: 0,
              color: message.includes("فشل") ? "#ff8d8d" : "rgba(255,255,255,0.72)",
              lineHeight: 1.8,
              wordBreak: "break-word"
            }}>
              {message}
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "#050505",
  color: "#fff",
  borderRadius: 14,
  padding: "13px 14px",
  fontSize: 16,
  fontFamily: "inherit",
};

const smallButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  borderRadius: 10,
  fontWeight: 900,
  cursor: "pointer",
};
