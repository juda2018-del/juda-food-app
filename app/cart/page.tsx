"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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
  return `${Number(value || 0).toLocaleString()} د.ع`;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<FuseCartItem[]>([]);
  const [customerName, setCustomerName] = useState("زبون فيوز");
  const [phone, setPhone] = useState("07700000000");
  const [address, setAddress] = useState("بغداد");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function refresh() {
      setItems(readFuseCart());
    }

    refresh();
    window.addEventListener(FUSE_CART_EVENT, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(FUSE_CART_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const groupedRestaurants = useMemo(() => {
    const map = new Map<string, FuseCartItem[]>();

    for (const item of items) {
      const key = item.restaurant || "FUSE";
      map.set(key, [...(map.get(key) || []), item]);
    }

    return Array.from(map.entries());
  }, [items]);

  const totals = fuseCartTotals(items);

  function changeQty(item: FuseCartItem, nextQty: number) {
    const next = updateFuseCartQty(item.id, nextQty);
    setItems(next);
  }

  function clearCart() {
    clearFuseCart();
    setItems([]);
    setMessage("تم تفريغ السلة.");
    setError("");
  }

  async function submitOrder() {
    setMessage("");
    setError("");

    if (!items.length) {
      setError("السلة فارغة. أضف صنف واحد على الأقل حتى تكمل الطلب.");
      return;
    }

    if (!customerName.trim()) {
      setError("اكتب اسم الزبون.");
      return;
    }

    if (!phone.trim()) {
      setError("اكتب رقم الهاتف.");
      return;
    }

    if (!address.trim()) {
      setError("اكتب عنوان التوصيل.");
      return;
    }

    setSaving(true);

    try {
      const restaurant = items[0]?.restaurant || "FUSE";
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
        items: items.map((item) => ({
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

      await addDoc(collection(db, "notifications"), {
        type: "order",
        title: "طلب جديد",
        message: `وصل طلب جديد من ${customerName.trim()} بقيمة ${formatIQD(totals.total)}.`,
        restaurant,
        restaurantName: restaurant,
        phone: phone.trim(),
        orderId: shortOrderId,
        read: false,
        createdAt: serverTimestamp(),
      });

      clearFuseCart();
      setItems([]);
      setMessage(`تم إرسال الطلب بنجاح. رقم الطلب: ${shortOrderId}`);

      window.setTimeout(() => {
        router.push(`/order-status?phone=${encodeURIComponent(phone.trim())}`);
      }, 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر إرسال الطلب. تأكد من الاتصال وحاول مرة ثانية.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main dir="rtl" className="app">
      <header className="top">
        <Link className="back" href="/">‹</Link>
        <div className="title">
          <h1>السلة</h1>
          <p>{items.length ? `${items.reduce((sum, item) => sum + item.qty, 0)} صنف جاهز للدفع` : "ابدأ بإضافة وجبات من المطاعم"}</p>
        </div>
        <Link className="support" href="/support">دعم</Link>
      </header>

      {items.length === 0 ? (
        <section className="empty">
          <div className="empty-icon">🛒</div>
          <h2>السلة فارغة</h2>
          <p>اختار مطعم وأضف صنف حتى يظهر هنا. هذه الصفحة متصلة فعلياً مع أزرار إضافة للسلة.</p>
          <Link href="/restaurants/fayrouz">ابدأ الطلب من فيروز</Link>
        </section>
      ) : (
        <>
          <section className="items">
            {groupedRestaurants.map(([restaurant, restaurantItems]) => (
              <div className="group" key={restaurant}>
                <div className="group-head">
                  <h2>{restaurant}</h2>
                  <small>{restaurantItems.length} صنف</small>
                </div>

                {restaurantItems.map((item) => (
                  <article className="item" key={item.id}>
                    <div className="thumb">{item.name.slice(0, 1)}</div>
                    <div className="info">
                      <h3>{item.name}</h3>
                      <p>{item.category || "عام"} · {formatIQD(item.price)}</p>
                      <div className="row">
                        <div className="qty">
                          <button type="button" onClick={() => changeQty(item, item.qty - 1)}>-</button>
                          <b>{item.qty}</b>
                          <button type="button" onClick={() => changeQty(item, item.qty + 1)}>+</button>
                        </div>
                        <strong>{formatIQD(item.price * item.qty)}</strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </section>

          <section className="summary">
            <h2>ملخص الطلب</h2>
            <div className="line"><span>المجموع الفرعي</span><b>{formatIQD(totals.subtotal)}</b></div>
            <div className="line"><span>التوصيل</span><b>{formatIQD(totals.deliveryFee)}</b></div>
            <div className="total"><span>الإجمالي</span><b>{formatIQD(totals.total)}</b></div>
          </section>

          <section className="form">
            <h2>بيانات التوصيل</h2>
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="اسم الزبون" />
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="رقم الهاتف" dir="ltr" />
            <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="العنوان" />
            <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="ملاحظة اختيارية" />
          </section>

          <button type="button" className="checkout" onClick={submitOrder} disabled={saving}>
            {saving ? "جاري إرسال الطلب..." : "تأكيد وإرسال الطلب"}
          </button>

          <button type="button" className="clear" onClick={clearCart}>تفريغ السلة</button>
        </>
      )}

      {message ? <div className="message ok">{message}</div> : null}
      {error ? <div className="message bad">{error}</div> : null}

      <nav className="nav">
        <Link href="/">⌂<br />الرئيسية</Link>
        <Link href="/explore">⌕<br />استكشف</Link>
        <Link href="/cart" className="active">▱<br />السلة</Link>
        <Link href="/order-status">▣<br />طلباتي</Link>
        <Link href="/profile">○<br />حسابي</Link>
      </nav>

      <style jsx>{`
        :global(*) { box-sizing: border-box; }
        :global(html), :global(body) { margin: 0; padding: 0; background: #efe8df; }

        .app {
          width: 100%;
          max-width: 430px;
          min-height: 100vh;
          margin: 0 auto;
          padding: 18px 18px 96px;
          direction: rtl;
          font-family: Cairo, system-ui, sans-serif;
          background: linear-gradient(180deg, #fffaf4 0%, #ffffff 100%);
          color: #151515;
        }

        .top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 20px; }
        .back, .support {
          min-width: 44px;
          height: 44px;
          border-radius: 16px;
          background: white;
          color: #151515;
          text-decoration: none;
          display: grid;
          place-items: center;
          padding: 0 12px;
          font-size: 32px;
          font-weight: 900;
          box-shadow: 0 12px 28px rgba(0,0,0,.07);
        }
        .support { color: #ff4d00; font-size: 13px; }
        .title { text-align: center; }
        .title h1 { margin: 0; font-size: 28px; font-weight: 900; }
        .title p { margin: 4px 0 0; color: #777; font-size: 13px; font-weight: 800; }

        .empty, .summary, .form, .group {
          background: white;
          border-radius: 28px;
          padding: 18px;
          box-shadow: 0 14px 34px rgba(0,0,0,.08);
          margin-bottom: 14px;
        }
        .empty { text-align: center; padding: 28px 18px; }
        .empty-icon { width: 72px; height: 72px; border-radius: 26px; margin: 0 auto 12px; display: grid; place-items: center; background: #fff3e9; font-size: 34px; }
        .empty h2 { margin: 0; font-size: 24px; font-weight: 900; }
        .empty p { color: #777; line-height: 1.8; font-weight: 800; }
        .empty a { display: block; border-radius: 22px; background: #ff4d00; color: white; text-decoration: none; padding: 15px; font-weight: 900; }

        .items { display: grid; gap: 14px; }
        .group-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .group-head h2 { margin: 0; font-size: 20px; font-weight: 900; }
        .group-head small { color: #ff4d00; font-weight: 900; }
        .item { display: grid; grid-template-columns: 74px 1fr; gap: 12px; padding: 12px 0; border-top: 1px solid #f1e9e0; }
        .item:first-of-type { border-top: 0; }
        .thumb { width: 74px; height: 74px; border-radius: 22px; background: linear-gradient(135deg,#151515,#303030); color: #ff8a00; display: grid; place-items: center; font-size: 32px; font-weight: 900; }
        .info h3 { margin: 0; font-size: 17px; font-weight: 900; }
        .info p { margin: 4px 0 10px; color: #777; font-size: 12px; font-weight: 800; }
        .row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .row strong { color: #ff4d00; font-weight: 900; }
        .qty { display: inline-flex; align-items: center; gap: 10px; background: #fff3e9; border-radius: 16px; padding: 5px; }
        .qty button { width: 30px; height: 30px; border: 0; border-radius: 12px; background: #ff4d00; color: white; font-size: 18px; font-weight: 900; }
        .qty b { min-width: 20px; text-align: center; }

        .summary h2, .form h2 { margin: 0 0 14px; font-size: 22px; font-weight: 900; }
        .line, .total { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 10px; color: #666; font-weight: 800; }
        .total { border-top: 1px solid #f1e9e0; padding-top: 14px; color: #151515; font-size: 20px; font-weight: 900; }
        .total b { color: #ff4d00; }

        .form { display: grid; gap: 10px; }
        .form h2 { margin-bottom: 4px; }
        .form input { width: 100%; border: 1px solid #f1e9e0; border-radius: 18px; padding: 14px; font-family: inherit; font-weight: 800; outline: none; }
        .form input:focus { border-color: #ff8a00; box-shadow: 0 0 0 3px rgba(255,77,0,.10); }

        .checkout, .clear { width: 100%; border: 0; border-radius: 22px; padding: 16px; font-family: inherit; font-weight: 900; margin-top: 10px; }
        .checkout { background: #ff4d00; color: white; box-shadow: 0 14px 30px rgba(255,77,0,.24); }
        .checkout:disabled { opacity: .65; }
        .clear { background: #151515; color: white; }
        .message { margin-top: 12px; border-radius: 20px; padding: 14px; font-weight: 900; line-height: 1.7; }
        .ok { background: #dcfce7; color: #166534; }
        .bad { background: #fee2e2; color: #991b1b; }

        .nav {
          position: fixed;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          height: 86px;
          background: #ffffff;
          box-shadow: 0 -12px 32px rgba(0,0,0,.08);
          display: grid;
          grid-template-columns: repeat(5,1fr);
          align-items: center;
          text-align: center;
          color: #777;
          font-size: 14px;
          font-weight: 800;
          z-index: 50;
          border-top: 1px solid rgba(0,0,0,.04);
        }
        .nav a { min-height: 64px; text-decoration: none; color: inherit; line-height: 1.45; display: grid; place-content: center; font-size: 14px; font-weight: 900; }
        .nav .active { color: #ff4d00; font-weight: 900; }
      `}</style>
    </main>
  );
}
