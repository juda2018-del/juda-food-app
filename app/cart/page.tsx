"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

function formatIQD(value: number) {
  return `${Number(value || 0).toLocaleString("en-US")} د.ع`;
}

function normalizePhone(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[^0-9+]/g, "");
}

function validIraqiPhone(value: string) {
  return /^07\d{9}$/.test(normalizePhone(value).replace(/^\+964/, "0"));
}

async function validateCart(items: FuseCartItem[]) {
  if (!items.length) throw new Error("السلة فارغة.");

  const restaurantId = String(items[0].restaurantId || "").trim();
  if (!restaurantId) throw new Error("تعذر تحديد المطعم. فرّغ السلة وأعد إضافة الأصناف.");

  if (items.some((item) => String(item.restaurantId || "").trim() !== restaurantId)) {
    throw new Error("السلة تحتوي أصنافاً من أكثر من مطعم. فرّغ السلة وأعد الطلب.");
  }

  const restaurantSnap = await getDoc(doc(db, "restaurants", restaurantId));
  if (!restaurantSnap.exists()) throw new Error("هذا المطعم غير موجود أو لم يعد متاحاً.");

  const restaurantData = restaurantSnap.data();
  const restaurantOpen =
    restaurantData.active !== false &&
    restaurantData.open !== false &&
    restaurantData.isOpen !== false &&
    restaurantData.status !== "مغلق";

  if (!restaurantOpen) throw new Error("المطعم مغلق حالياً ولا يستقبل طلبات.");

  const restaurantName = String(
    restaurantData.name || restaurantData.title || restaurantData.restaurantName || "مطعم"
  ).trim();

  const verified: FuseCartItem[] = [];
  for (const item of items) {
    const menuSnap = await getDoc(doc(db, "menu", item.id));
    if (!menuSnap.exists()) throw new Error(`الصنف ${item.name} لم يعد متوفراً.`);

    const data = menuSnap.data();
    if (data.available === false || data.isAvailable === false || data.active === false) {
      throw new Error(`الصنف ${item.name} غير متوفر حالياً.`);
    }

    if (String(data.restaurantId || "").trim() !== restaurantId) {
      throw new Error(`الصنف ${item.name} لا يتبع لهذا المطعم.`);
    }

    const price = Number(data.price);
    if (!Number.isFinite(price) || price < 0) throw new Error(`سعر الصنف ${item.name} غير صالح.`);

    verified.push({
      ...item,
      restaurantId,
      restaurant: restaurantName,
      name: String(data.name || data.title || item.name).trim(),
      category: String(data.category || item.category || "عام"),
      price,
      qty: Math.max(1, Math.min(50, Math.round(Number(item.qty) || 1))),
    });
  }

  return verified;
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

  const totals = fuseCartTotals(items);
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
    if (saving) return;
    setMessage("");
    setError("");

    if (!authReady) return setError("جاري التحقق من الحساب، حاول بعد لحظة.");
    if (!user) {
      router.push("/login?next=/cart");
      return;
    }

    const token = await user.getIdTokenResult(true);
    const role = typeof token.claims.role === "string" ? token.claims.role : "";
    if (role && role !== "customer") {
      return setError("تأكيد الطلب متاح لحساب الزبون فقط.");
    }

    if (!items.length) return setError("السلة فارغة. أضف صنفاً واحداً على الأقل.");
    if (customerName.trim().length < 2) return setError("اكتب اسم الزبون.");
    if (!validIraqiPhone(phone)) return setError("اكتب رقم هاتف عراقي صحيح مثل 07701234567.");
    if (address.trim().length < 8) return setError("اكتب عنوان توصيل واضحاً.");

    setSaving(true);
    try {
      const verifiedItems = await validateCart(items);
      const verifiedTotals = fuseCartTotals(verifiedItems);
      const cleanPhone = normalizePhone(phone).replace(/^\+964/, "0");
      const shortOrderId = `FUSE-${Date.now().toString().slice(-8)}`;
      const orderRef = doc(collection(db, "orders"));
      const notificationRef = doc(collection(db, "notifications"));
      const batch = writeBatch(db);
      const restaurantId = String(verifiedItems[0].restaurantId || "");
      const restaurantName = verifiedItems[0].restaurant;

      batch.set(orderRef, {
        orderId: shortOrderId,
        customerUid: user.uid,
        customerEmail: user.email || "",
        customerName: customerName.trim(),
        customer: customerName.trim(),
        phone: cleanPhone,
        customerPhone: cleanPhone,
        address: address.trim(),
        note: note.trim().slice(0, 300),
        restaurant: restaurantName,
        restaurantName,
        restaurantId,
        items: verifiedItems.map((item) => ({
          id: item.id,
          name: item.name,
          title: item.name,
          qty: item.qty,
          quantity: item.qty,
          price: item.price,
          category: item.category || "عام",
        })),
        subtotal: verifiedTotals.subtotal,
        deliveryFee: verifiedTotals.deliveryFee,
        total: verifiedTotals.total,
        amount: verifiedTotals.total,
        currency: "IQD",
        status: "جديد",
        source: "customer-cart-page",
        pricingVerifiedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(notificationRef, {
        type: "order",
        audience: "restaurant",
        title: "طلب جديد",
        message: `وصل طلب جديد من ${customerName.trim()} بقيمة ${formatIQD(verifiedTotals.total)}.`,
        customerUid: user.uid,
        restaurant: restaurantName,
        restaurantName,
        restaurantId,
        phone: cleanPhone,
        orderId: shortOrderId,
        orderDocumentId: orderRef.id,
        read: false,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      clearFuseCart();
      setItems([]);
      setMessage(`تم إرسال الطلب بنجاح. رقم الطلب: ${shortOrderId}`);
      window.setTimeout(() => router.replace(`/order-status?orderId=${encodeURIComponent(shortOrderId)}`), 700);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر إرسال الطلب. حاول مرة ثانية.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main dir="rtl" className="app">
      <header className="top">
        <button className="back" type="button" onClick={() => history.length > 1 ? history.back() : router.push("/restaurants")}>‹</button>
        <div className="title"><h1>السلة</h1><p>{items.length ? `${items.reduce((sum, item) => sum + item.qty, 0)} قطعة` : "ابدأ بإضافة وجبات"}</p></div>
        <Link className="support" href="/support">دعم</Link>
      </header>

      {!authReady ? <section className="notice">جاري التحقق من الحساب...</section> : null}
      {authReady && !user && items.length ? (
        <section className="notice"><b>سجّل دخولك قبل تأكيد الطلب</b><p>نحفظ الطلب بحسابك حتى تتابعه وتقيّمه بأمان.</p><Link href="/login?next=/cart">تسجيل الدخول</Link></section>
      ) : null}

      {!items.length ? (
        <section className="empty"><div>🛒</div><h2>السلة فارغة</h2><p>اختار مطعماً وأضف وجبتك.</p><Link href="/restaurants">تصفح المطاعم</Link></section>
      ) : (
        <>
          <section className="group">
            <div className="groupHead"><h2>{restaurant}</h2><small>{items.length} صنف</small></div>
            {items.map((item) => (
              <article className="item" key={`${item.restaurantId || restaurant}-${item.id}`}>
                <div className="thumb">{item.name.slice(0, 1)}</div>
                <div className="info"><h3>{item.name}</h3><p>{item.category || "عام"} · {formatIQD(item.price)}</p><div className="row"><div className="qty"><button type="button" onClick={() => changeQty(item, item.qty - 1)}>−</button><b>{item.qty}</b><button type="button" onClick={() => changeQty(item, item.qty + 1)}>+</button></div><strong>{formatIQD(item.price * item.qty)}</strong></div></div>
              </article>
            ))}
          </section>

          <section className="summary"><h2>ملخص الطلب</h2><div><span>المجموع الفرعي</span><b>{formatIQD(totals.subtotal)}</b></div><div><span>التوصيل</span><b>{formatIQD(totals.deliveryFee)}</b></div><div className="total"><span>الإجمالي</span><b>{formatIQD(totals.total)}</b></div><small>يُراجع السعر والتوفر من Firestore عند تأكيد الطلب.</small></section>
          <section className="form"><h2>بيانات التوصيل</h2><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="الاسم الكامل" autoComplete="name" maxLength={80}/><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07701234567" inputMode="tel" autoComplete="tel" dir="ltr" maxLength={14}/><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="المنطقة، الشارع، أقرب نقطة دالة" autoComplete="street-address" maxLength={220}/><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة اختيارية للمطعم أو السائق" maxLength={300}/></section>
          <button className="checkout" type="button" onClick={submitOrder} disabled={saving || !authReady}>{saving ? "جاري فحص الأسعار وتثبيت الطلب..." : user ? `تأكيد الطلب · ${formatIQD(totals.total)}` : "سجّل دخولك لتأكيد الطلب"}</button>
          <button className="clear" type="button" onClick={clearCart} disabled={saving}>تفريغ السلة</button>
        </>
      )}

      {message && <div className="message ok">{message}</div>}
      {error && <div className="message bad">{error}</div>}

      <style jsx>{`
        :global(*){box-sizing:border-box}:global(html),:global(body){margin:0;background:#f4efe6}
        .app{width:100%;max-width:430px;min-height:100dvh;margin:auto;padding:0;background:transparent;color:#15171a;font-family:var(--fuse-body-font)}
        .top{display:grid;grid-template-columns:46px 1fr 46px;align-items:center;gap:8px;margin-bottom:16px;padding:8px 10px;border-radius:28px;background:rgba(255,252,247,.82);border:1px solid rgba(255,255,255,.95);box-shadow:0 10px 28px rgba(21,23,26,.08);backdrop-filter:blur(22px) saturate(145%)}.back,.support{height:46px;border:0;border-radius:50%;background:rgba(255,252,247,.92);color:#1f7a4f;display:grid;place-items:center;text-decoration:none;box-shadow:0 8px 22px rgba(21,23,26,.06);font-family:inherit;font-weight:900}.back{font-size:26px;border:1px solid rgba(21,23,26,.08)}.support{font-size:11px;border-radius:18px;background:rgba(31,122,79,.12)}.title{text-align:center}.title h1{margin:0;font-size:24px;font-family:var(--fuse-title-font)}.title p{margin:3px 0 0;color:#6f7175;font-size:11px;font-weight:800}
        .empty,.group,.summary,.form,.notice{background:rgba(255,252,247,.82);border:1px solid rgba(255,255,255,.92);border-radius:22px;padding:17px;margin-bottom:13px;box-shadow:0 10px 28px rgba(21,23,26,.08);backdrop-filter:blur(22px) saturate(145%)}.empty{text-align:center;padding:30px 18px}.empty>div{font-size:42px}.empty h2{margin:8px 0}.empty p,.notice p{color:#6f7175}.empty a,.notice a{display:block;padding:14px;border-radius:18px;background:linear-gradient(135deg,#1f7a4f,#2f915f);color:#fff;text-align:center;text-decoration:none;font-weight:900;box-shadow:0 12px 28px rgba(31,122,79,.22)}.notice{text-align:center;background:rgba(31,122,79,.08)}
        .groupHead,.row,.summary>div{display:flex;justify-content:space-between;align-items:center;gap:8px}.groupHead h2{margin:0}.groupHead small,.row strong,.total b{color:#1f7a4f;font-weight:900}.item{display:grid;grid-template-columns:68px 1fr;gap:11px;padding:13px 0;border-top:1px solid rgba(21,23,26,.08)}.thumb{width:68px;height:68px;border-radius:20px;background:linear-gradient(135deg,#1a2235,#263759);color:#fff;display:grid;place-items:center;font-size:29px;font-weight:900}.info h3{margin:0;font-size:16px}.info p{margin:3px 0 9px;color:#6f7175;font-size:11px;font-weight:700}.qty{display:flex;align-items:center;gap:9px;padding:4px;border-radius:14px;background:rgba(31,122,79,.1)}.qty button{width:30px;height:30px;border:0;border-radius:10px;background:linear-gradient(135deg,#1f7a4f,#2f915f);color:#fff;font-size:18px;font-weight:900}.qty b{min-width:18px;text-align:center}
        .summary h2,.form h2{margin:0 0 13px}.summary>div{margin:9px 0;color:#6f7175;font-weight:800}.summary .total{padding-top:13px;border-top:1px solid rgba(21,23,26,.08);color:#15171a;font-size:19px}.summary small{display:block;color:#6f7175;line-height:1.6}.form{display:grid;gap:10px}.form input{width:100%;border:1px solid rgba(21,23,26,.08);border-radius:16px;padding:14px;font:inherit;font-size:13px;outline:none;background:rgba(255,255,255,.72)}
        .checkout,.clear{width:100%;border:0;border-radius:19px;padding:16px;font:inherit;font-weight:900;margin-top:9px}.checkout{background:linear-gradient(135deg,#1f7a4f,#2f915f);color:#fff;box-shadow:0 12px 28px rgba(31,122,79,.22)}.checkout:disabled,.clear:disabled{opacity:.55}.clear{background:#1a2235;color:#fff}.message{margin-top:12px;border-radius:18px;padding:13px;font-weight:900}.ok{background:#dcfce7;color:#166534}.bad{background:#fee2e2;color:#991b1b}
      `}</style>
    </main>
  );
}
