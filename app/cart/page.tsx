"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
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
  const phone = normalizePhone(value).replace(/^\+964/, "0");
  return /^07\d{9}$/.test(phone);
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<FuseCartItem[]>([]);
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

  const totals = fuseCartTotals(items);
  const restaurant = items[0]?.restaurant || "FUSE";

  function changeQty(item: FuseCartItem, nextQty: number) {
    setItems(updateFuseCartQty(item.id, nextQty));
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

    if (!items.length) return setError("السلة فارغة. أضف صنفاً واحداً على الأقل.");
    if (!customerName.trim()) return setError("اكتب اسم الزبون.");
    if (!validIraqiPhone(phone)) return setError("اكتب رقم هاتف عراقي صحيح مثل 07701234567.");
    if (address.trim().length < 5) return setError("اكتب عنوان توصيل واضحاً.");

    setSaving(true);
    try {
      const cleanPhone = normalizePhone(phone).replace(/^\+964/, "0");
      const shortOrderId = `FUSE-${Date.now().toString().slice(-6)}`;
      const orderRef = doc(collection(db, "orders"));
      const notificationRef = doc(collection(db, "notifications"));
      const batch = writeBatch(db);

      batch.set(orderRef, {
        orderId: shortOrderId,
        customerName: customerName.trim(),
        customer: customerName.trim(),
        phone: cleanPhone,
        customerPhone: cleanPhone,
        address: address.trim(),
        note: note.trim(),
        restaurant,
        restaurantName: restaurant,
        restaurantId: items[0]?.restaurantId || "",
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          title: item.name,
          qty: item.qty,
          quantity: item.qty,
          price: item.price,
          category: item.category || "عام",
        })),
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        total: totals.total,
        amount: totals.total,
        status: "جديد",
        source: "customer-cart-page",
        createdAt: serverTimestamp(),
      });

      batch.set(notificationRef, {
        type: "order",
        title: "طلب جديد",
        message: `وصل طلب جديد من ${customerName.trim()} بقيمة ${formatIQD(totals.total)}.`,
        restaurant,
        restaurantName: restaurant,
        restaurantId: items[0]?.restaurantId || "",
        phone: cleanPhone,
        orderId: shortOrderId,
        read: false,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      clearFuseCart();
      setItems([]);
      setMessage(`تم إرسال الطلب بنجاح. رقم الطلب: ${shortOrderId}`);
      window.setTimeout(() => {
        router.replace(`/order-status?orderId=${encodeURIComponent(shortOrderId)}`);
      }, 900);
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
        <div className="title"><h1>السلة</h1><p>{items.length ? `${items.reduce((sum, item) => sum + item.qty, 0)} قطعة من ${restaurant}` : "ابدأ بإضافة وجبات"}</p></div>
        <Link className="support" href="/support">دعم</Link>
      </header>

      {!items.length ? (
        <section className="empty"><div>🛒</div><h2>السلة فارغة</h2><p>اختار مطعماً وأضف وجبتك.</p><Link href="/restaurants">تصفح المطاعم</Link></section>
      ) : (
        <>
          <section className="group">
            <div className="groupHead"><h2>{restaurant}</h2><small>{items.length} صنف</small></div>
            {items.map((item) => (
              <article className="item" key={`${item.restaurantId || restaurant}-${item.id}`}>
                <div className="thumb">{item.name.slice(0, 1)}</div>
                <div className="info"><h3>{item.name}</h3><p>{item.category || "عام"} · {formatIQD(item.price)}</p><div className="row"><div className="qty"><button onClick={() => changeQty(item, item.qty - 1)}>−</button><b>{item.qty}</b><button onClick={() => changeQty(item, item.qty + 1)}>+</button></div><strong>{formatIQD(item.price * item.qty)}</strong></div></div>
              </article>
            ))}
          </section>

          <section className="summary"><h2>ملخص الطلب</h2><div><span>المجموع الفرعي</span><b>{formatIQD(totals.subtotal)}</b></div><div><span>التوصيل</span><b>{formatIQD(totals.deliveryFee)}</b></div><div className="total"><span>الإجمالي</span><b>{formatIQD(totals.total)}</b></div></section>

          <section className="form"><h2>بيانات التوصيل</h2><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="الاسم الكامل" autoComplete="name"/><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="07701234567" inputMode="tel" autoComplete="tel" dir="ltr"/><input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="المنطقة، الشارع، أقرب نقطة دالة" autoComplete="street-address"/><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="ملاحظة اختيارية للمطعم أو السائق"/></section>

          <button className="checkout" type="button" onClick={submitOrder} disabled={saving}>{saving ? "جاري تثبيت الطلب..." : `تأكيد الطلب · ${formatIQD(totals.total)}`}</button>
          <button className="clear" type="button" onClick={clearCart} disabled={saving}>تفريغ السلة</button>
        </>
      )}

      {message && <div className="message ok">{message}</div>}
      {error && <div className="message bad">{error}</div>}

      <nav className="nav"><Link href="/">⌂<span>الرئيسية</span></Link><Link href="/restaurants">⌕<span>المطاعم</span></Link><Link href="/reels">▶<span>ريلز</span></Link><Link href="/order-status">▣<span>طلباتي</span></Link><Link href="/profile">●<span>حسابي</span></Link></nav>

      <style jsx>{`
        :global(*){box-sizing:border-box}:global(html),:global(body){margin:0;background:#efe8df}.app{width:100%;max-width:430px;min-height:100dvh;margin:auto;padding:18px 16px 105px;background:linear-gradient(180deg,#fffaf4,#fff);color:#171717;font-family:Cairo,system-ui,sans-serif}.top{display:grid;grid-template-columns:48px 1fr 48px;align-items:center;gap:8px;margin-bottom:18px}.back,.support{height:44px;border:0;border-radius:15px;background:#fff;color:#171717;display:grid;place-items:center;text-decoration:none;box-shadow:0 8px 24px rgba(0,0,0,.08);font-family:inherit;font-weight:900}.back{font-size:30px}.support{font-size:12px;color:#f45100}.title{text-align:center}.title h1{margin:0;font-size:27px}.title p{margin:3px 0 0;color:#777;font-size:11px;font-weight:800}.empty,.group,.summary,.form{background:#fff;border-radius:25px;padding:17px;margin-bottom:13px;box-shadow:0 12px 30px rgba(0,0,0,.07)}.empty{text-align:center;padding:30px 18px}.empty>div{font-size:42px}.empty h2{margin:8px 0}.empty p{color:#777}.empty a{display:block;padding:14px;border-radius:17px;background:#f45100;color:#fff;text-decoration:none;font-weight:900}.groupHead{display:flex;justify-content:space-between;align-items:center}.groupHead h2{margin:0}.groupHead small{color:#f45100;font-weight:900}.item{display:grid;grid-template-columns:68px 1fr;gap:11px;padding:13px 0;border-top:1px solid #f3e8dc}.item:first-of-type{border-top:0}.thumb{width:68px;height:68px;border-radius:20px;background:#171717;color:#ff7800;display:grid;place-items:center;font-size:29px;font-weight:900}.info h3{margin:0;font-size:16px}.info p{margin:3px 0 9px;color:#777;font-size:11px;font-weight:700}.row,.summary>div{display:flex;justify-content:space-between;align-items:center;gap:8px}.row strong,.total b{color:#f45100}.qty{display:flex;align-items:center;gap:9px;padding:4px;border-radius:14px;background:#fff0e5}.qty button{width:30px;height:30px;border:0;border-radius:10px;background:#f45100;color:#fff;font-size:18px;font-weight:900}.qty b{min-width:18px;text-align:center}.summary h2,.form h2{margin:0 0 13px}.summary>div{margin:9px 0;color:#666;font-weight:800}.summary .total{padding-top:13px;border-top:1px solid #eee;color:#171717;font-size:19px}.form{display:grid;gap:10px}.form input{width:100%;border:1px solid #eee2d8;border-radius:16px;padding:14px;font:inherit;font-size:13px;outline:none}.form input:focus{border-color:#ff7800;box-shadow:0 0 0 3px rgba(255,120,0,.12)}.checkout,.clear{width:100%;border:0;border-radius:19px;padding:16px;font:inherit;font-weight:900;margin-top:9px}.checkout{background:#f45100;color:#fff}.checkout:disabled,.clear:disabled{opacity:.55}.clear{background:#171717;color:#fff}.message{margin-top:12px;border-radius:18px;padding:13px;font-weight:900}.ok{background:#dcfce7;color:#166534}.bad{background:#fee2e2;color:#991b1b}.nav{position:fixed;left:50%;bottom:max(8px,env(safe-area-inset-bottom));transform:translateX(-50%);width:calc(100% - 24px);max-width:406px;height:70px;background:rgba(255,255,255,.97);border-radius:23px;box-shadow:0 12px 35px rgba(0,0,0,.16);display:grid;grid-template-columns:repeat(5,1fr);padding:6px;z-index:99}.nav a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:#666;text-decoration:none;font-size:18px;font-weight:900}.nav span{font-size:9px}
      `}</style>
    </main>
  );
}
