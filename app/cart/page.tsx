"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  clearFuseCart,
  FUSE_CART_EVENT,
  fuseCartTotals,
  readFuseCart,
  updateFuseCartQty,
  type FuseCartItem,
} from "@/lib/fuse-cart";
import { normalizeFuseOrderStatus } from "@/lib/fuse-order-status";
import { resolveFuseSession } from "@/lib/fuse-session-resolve";
import { resolveRestaurantDeliveryFee } from "@/lib/fuse-restaurant";
import FuseIcon from "@/components/FuseIcon";
import { fuseUserFacingError } from "@/lib/fuse-user-errors";
import {
  buildCustomerCodOrder,
  buildRestaurantNewOrderNotification,
  createSubmitGuard,
  newOrderAttemptId,
  type MenuRecord,
  type RestaurantRecord,
} from "@/lib/fuse-order-draft";

function formatIQD(value: number) {
  return `${Number(value || 0).toLocaleString("en-US")} د.ع`;
}

function CartThumb({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(!src);
  if (failed) return <>{name.slice(0, 1)}</>;
  return <img src={src} alt={name} onError={() => setFailed(true)} />;
}

async function loadCustomerOrder(input: {
  items: FuseCartItem[];
  actor: { uid: string; email?: string | null; role: string };
  customerName: string;
  phone: string;
  address: string;
  note: string;
  attemptId: string;
}) {
  const restaurantId = String(input.items[0]?.restaurantId || "").trim();
  const restaurantSnap = restaurantId
    ? await getDoc(doc(db, "restaurants", restaurantId))
    : null;
  const restaurantData = restaurantSnap?.exists() ? restaurantSnap.data() : {};
  const restaurant: RestaurantRecord = {
    exists: Boolean(restaurantSnap?.exists()),
    name: typeof restaurantData.name === "string" ? restaurantData.name : "",
    active: restaurantData.active as boolean | undefined,
    open: restaurantData.open as boolean | undefined,
    isOpen: restaurantData.isOpen as boolean | undefined,
    status: typeof restaurantData.status === "string" ? restaurantData.status : undefined,
    deliveryFee: restaurantData.deliveryFee,
    minOrder: restaurantData.minOrder,
    minimumOrder: restaurantData.minimumOrder,
  };

  const menuSnaps = await Promise.all(
    input.items.map((item) => getDoc(doc(db, "menu", String(item.id || ""))))
  );
  const menuById: Record<string, MenuRecord> = {};
  input.items.forEach((item, index) => {
    const snap = menuSnaps[index];
    const data = snap.exists() ? snap.data() : {};
    menuById[String(item.id || "")] = {
      exists: snap.exists(),
      restaurantId: typeof data.restaurantId === "string" ? data.restaurantId : "",
      name: typeof data.name === "string" ? data.name : "",
      title: typeof data.title === "string" ? data.title : "",
      category: typeof data.category === "string" ? data.category : "",
      price: data.price,
      available: data.available as boolean | undefined,
      isAvailable: data.isAvailable as boolean | undefined,
      active: data.active as boolean | undefined,
    };
  });

  return buildCustomerCodOrder({
    actor: {
      uid: input.actor.uid,
      email: input.actor.email || "",
      role: input.actor.role,
    },
    items: input.items,
    restaurantId,
    restaurant,
    menuById,
    customerName: input.customerName,
    phone: input.phone,
    address: input.address,
    note: input.note,
    attemptId: input.attemptId,
  });
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<FuseCartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(2000);
  const [minimumOrder, setMinimumOrder] = useState(0);
  const submitGuard = useRef(createSubmitGuard());
  const attemptRef = useRef("");

  useEffect(() => {
    const refresh = () => setItems(readFuseCart());
    refresh();
    window.addEventListener(FUSE_CART_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(FUSE_CART_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    const restaurantId = String(items[0]?.restaurantId || "").trim();
    if (!restaurantId) {
      setDeliveryFee(2000);
      setMinimumOrder(0);
      return;
    }

    let cancelled = false;
    void getDoc(doc(db, "restaurants", restaurantId)).then((snap) => {
      if (cancelled) return;
      if (!snap.exists()) {
        setDeliveryFee(2000);
        setMinimumOrder(0);
        return;
      }
      const restaurantData = snap.data();
      const minimum = Number(restaurantData.minOrder || restaurantData.minimumOrder || 0);
      setMinimumOrder(Number.isFinite(minimum) && minimum > 0 ? minimum : 0);
      setDeliveryFee(resolveRestaurantDeliveryFee(restaurantData));
    }).catch(() => {
      if (!cancelled) {
        setDeliveryFee(2000);
        setMinimumOrder(0);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [items]);

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (!currentUser) return;

      setCustomerName((value) => value || currentUser.displayName || "");

      try {
        const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (!profileSnap.exists()) return;
        const profile = profileSnap.data();
        setCustomerName((value) => value || String(profile.name || ""));
        setPhone((value) => value || String(profile.phone || ""));
        setAddress((value) => value || String(profile.address || ""));
      } catch {
        // Checkout remains usable with manually entered delivery details.
      }
    });
  }, []);

  const totals = fuseCartTotals(items, deliveryFee);
  const minimumOrderShortfall = Math.max(0, minimumOrder - totals.subtotal);
  const restaurant = items[0]?.restaurant || "FUSE";

  function changeQty(item: FuseCartItem, nextQty: number) {
    setItems(updateFuseCartQty(item.id, Math.max(0, Math.min(50, nextQty))));
  }

  function clearCart() {
    clearFuseCart();
    setItems([]);
    setMessage("تم تفريغ السلة.");
    setError("");
  }

  async function submitOrder() {
    if (!submitGuard.current.acquire()) return;
    setMessage("");
    setError("");
    let writing = false;

    try {
      if (!authReady) {
        setError("جاري التحقق من الحساب، حاول بعد لحظة.");
        return;
      }
      if (!user) {
        router.push("/login?next=/cart");
        return;
      }

      const token = await user.getIdTokenResult(true);
      const role = typeof token.claims.role === "string" ? token.claims.role : "";
      if (role && role !== "customer") {
        setError("تأكيد الطلب متاح لحساب الزبون فقط.");
        return;
      }

      let sessionRole = "";
      try {
        const session = await resolveFuseSession(user);
        sessionRole = session.role;
      } catch (sessionError) {
        setError(fuseUserFacingError(sessionError, "تعذر تثبيت جلسة الزبون."));
        return;
      }
      if (sessionRole !== "customer") {
        setError("تأكيد الطلب متاح لحساب الزبون فقط.");
        return;
      }

      writing = true;
      setSaving(true);
      if (!attemptRef.current) attemptRef.current = newOrderAttemptId();

      const draft = await loadCustomerOrder({
        items,
        actor: { uid: user.uid, email: user.email, role: sessionRole },
        customerName,
        phone,
        address,
        note,
        attemptId: attemptRef.current,
      });
      if (!draft.ok) {
        setError("message" in draft ? draft.message : "تعذر تثبيت الطلب.");
        return;
      }

      const { documentId, ...orderBody } = draft.order;
      const orderRef = doc(db, "orders", documentId);
      const notificationRef = doc(collection(db, "notifications"));
      const batch = writeBatch(db);
      batch.set(orderRef, {
        ...orderBody,
        status: normalizeFuseOrderStatus(orderBody.status),
        pricingVerifiedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(notificationRef, {
        ...buildRestaurantNewOrderNotification(draft.order),
        createdAt: serverTimestamp(),
      });

      try {
        await batch.commit();
      } catch (commitError) {
        const existing = await getDoc(orderRef);
        const existingCustomer = existing.exists() ? String(existing.data().customerUid || "") : "";
        if (!existing.exists() || existingCustomer !== user.uid) throw commitError;
      }

      const shortOrderId = draft.order.orderId;
      attemptRef.current = "";
      clearFuseCart();
      setItems([]);
      setMessage(`تم إرسال الطلب بنجاح. رقم الطلب: ${shortOrderId}`);
      window.setTimeout(() => router.replace(`/order-status?orderId=${encodeURIComponent(shortOrderId)}`), 700);
    } catch (submitError) {
      if (submitError instanceof Error && submitError.message && !/firestore|firebase/i.test(submitError.message)) {
        setError(submitError.message);
      } else {
        setError(fuseUserFacingError(submitError, "تعذر إرسال الطلب. حاول مرة ثانية."));
      }
    } finally {
      if (writing) setSaving(false);
      submitGuard.current.release();
    }
  }

  return (
    <main dir="rtl" className="app">
      <header className="top">
        <button className="back fuse-back-btn" type="button" aria-label="رجوع" onClick={() => history.length > 1 ? history.back() : router.push("/restaurants")}><FuseIcon name="chevron-back" /></button>
        <div className="title"><h1>السلة</h1><p>{items.length ? `${items.reduce((sum, item) => sum + item.qty, 0)} قطعة` : "ابدأ بإضافة وجبات"}</p></div>
        <Link className="support" href="/support">دعم</Link>
      </header>

      {!authReady ? <section className="notice">جاري التحقق من الحساب...</section> : null}
      {authReady && !user && items.length ? (
        <section className="notice"><b>سجّل دخولك قبل تأكيد الطلب</b><p>نحفظ الطلب بحسابك حتى تتابعه وتقيّمه بأمان.</p><Link href="/login?next=/cart">تسجيل الدخول</Link></section>
      ) : null}

      {!items.length ? (
        <section className="empty"><div className="empty-icon"><FuseIcon name="cart" size="lg" /></div><h2>السلة فارغة</h2><p>اختار مطعماً وأضف وجبتك.</p><Link href="/restaurants">تصفح المطاعم</Link></section>
      ) : (
        <>
          <section className="group">
            <div className="groupHead"><h2>{restaurant}</h2><small>{items.length} صنف</small></div>
            {items.map((item) => (
              <article className="item" key={`${item.restaurantId || restaurant}-${item.id}`}>
                <div className="thumb">
                  <CartThumb src={item.image} name={item.name} />
                </div>
                <div className="info"><h3>{item.name}</h3><p>{item.category || "عام"} · {formatIQD(item.price)}</p><div className="row"><div className="qty"><button type="button" aria-label="تقليل الكمية" onClick={() => changeQty(item, item.qty - 1)}><FuseIcon name="minus" size="sm" /></button><b>{item.qty}</b><button type="button" aria-label="زيادة الكمية" onClick={() => changeQty(item, item.qty + 1)}><FuseIcon name="plus" size="sm" /></button></div><strong>{formatIQD(item.price * item.qty)}</strong></div></div>
              </article>
            ))}
          </section>

          <section className="summary"><h2>ملخص الطلب</h2><div><span>المجموع الفرعي</span><b>{formatIQD(totals.subtotal)}</b></div><div><span>التوصيل</span><b>{formatIQD(totals.deliveryFee)}</b></div><div className="total"><span>الإجمالي</span><b>{formatIQD(totals.total)}</b></div><small>يُراجع السعر والتوفر عند تأكيد الطلب.</small>{minimumOrderShortfall > 0 ? <small className="minimum-order-note" role="status">باقي {formatIQD(minimumOrderShortfall)} من قيمة الأصناف حتى تصل للحد الأدنى للمطعم.</small> : null}</section>
          <section className="payment"><h2>طريقة الدفع</h2><div className="payment-row"><span>الدفع عند الاستلام (COD)</span><b>نقداً فقط</b></div><small>الإطلاق التجاري الحالي يعتمد الدفع نقداً عند التسليم فقط. لا توجد بوابة دفع إلكتروني متصلة حالياً.</small></section>
          <section className="form"><h2>بيانات التوصيل</h2><input aria-label="الاسم الكامل" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="الاسم الكامل" autoComplete="name" maxLength={80}/><input aria-label="رقم الهاتف العراقي" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07701234567" inputMode="tel" autoComplete="tel" dir="ltr" maxLength={14}/><input aria-label="عنوان التوصيل" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="المنطقة، الشارع، أقرب نقطة دالة" autoComplete="street-address" maxLength={220}/><input aria-label="ملاحظة للمطعم أو السائق" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة اختيارية للمطعم أو السائق" maxLength={300}/></section>
          <button className="checkout" type="button" onClick={submitOrder} disabled={saving || !authReady}>{saving ? "جاري فحص الأسعار وتثبيت الطلب..." : user ? `تأكيد الطلب · ${formatIQD(totals.total)}` : "سجّل دخولك لتأكيد الطلب"}</button>
          <button className="clear" type="button" onClick={clearCart} disabled={saving}>تفريغ السلة</button>
        </>
      )}

      {message && <div className="message ok">{message}</div>}
      {error && <div className="message bad">{error}</div>}

    </main>
  );
}
