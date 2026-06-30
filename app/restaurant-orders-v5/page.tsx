const VERSION = "FUSE_RESTAURANT_ORDERS_V21_STATIC_BROWSER_FETCH";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";

export default function RestaurantOrdersV5StaticPage() {
  const clientScript = `
(function () {
  var VERSION = ${JSON.stringify("FUSE_RESTAURANT_ORDERS_V21_STATIC_BROWSER_FETCH")};
  var projectId = ${JSON.stringify(projectId)};
  var apiKey = ${JSON.stringify(apiKey)};
  var orders = [];

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(id, text) {
    var el = byId(id);
    if (el) el.textContent = String(text);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function decodeValue(value) {
    if (!value || typeof value !== "object") return value;
    if ("stringValue" in value) return value.stringValue;
    if ("integerValue" in value) return Number(value.integerValue);
    if ("doubleValue" in value) return Number(value.doubleValue);
    if ("booleanValue" in value) return Boolean(value.booleanValue);
    if ("timestampValue" in value) return value.timestampValue;
    if ("nullValue" in value) return null;

    if ("arrayValue" in value) {
      var values = (value.arrayValue && value.arrayValue.values) || [];
      return values.map(decodeValue);
    }

    if ("mapValue" in value) {
      var fields = (value.mapValue && value.mapValue.fields) || {};
      var obj = {};
      Object.keys(fields).forEach(function (key) {
        obj[key] = decodeValue(fields[key]);
      });
      return obj;
    }

    return value;
  }

  function decodeDoc(doc) {
    var name = String((doc && doc.name) || "");
    var id = name.split("/").pop() || "unknown";
    var fields = (doc && doc.fields) || {};
    var out = { id: id };

    Object.keys(fields).forEach(function (key) {
      out[key] = decodeValue(fields[key]);
    });

    return out;
  }

  function toMillis(order) {
    var value =
      order.createdAt ||
      order.created_at ||
      order.created ||
      order.date ||
      order.updatedAt;

    if (!value) return 0;

    if (typeof value === "number") {
      return value < 100000000000 ? value * 1000 : value;
    }

    if (typeof value === "string") {
      var parsed = Date.parse(value);
      return isNaN(parsed) ? 0 : parsed;
    }

    if (value && typeof value.seconds === "number") {
      return value.seconds * 1000;
    }

    return 0;
  }

  function formatDate(order) {
    var ms = toMillis(order);
    if (!ms) return "بدون وقت";

    try {
      return new Intl.DateTimeFormat("ar-IQ", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(ms));
    } catch (e) {
      return "وقت غير معروف";
    }
  }

  function pick(order, keys, fallback) {
    for (var i = 0; i < keys.length; i++) {
      var value = order[keys[i]];

      if (typeof value === "string" && value.trim()) return value.trim();
      if (typeof value === "number" && isFinite(value)) return String(value);
    }

    return fallback;
  }

  function pickTotal(order) {
    var keys = ["total", "totalPrice", "grandTotal", "amount", "subtotal", "finalTotal"];

    for (var i = 0; i < keys.length; i++) {
      var value = order[keys[i]];

      if (typeof value === "number" && isFinite(value)) return value;

      if (typeof value === "string") {
        var parsed = Number(value.replace(/[^\\d.]/g, ""));
        if (isFinite(parsed) && parsed > 0) return parsed;
      }
    }

    return null;
  }

  function money(value) {
    if (value === null || value === undefined) return "غير محدد";

    try {
      return new Intl.NumberFormat("ar-IQ", {
        maximumFractionDigits: 0
      }).format(value) + " د.ع";
    } catch (e) {
      return String(value) + " د.ع";
    }
  }

  function getItems(order) {
    var raw =
      order.items ||
      order.cart ||
      order.orderItems ||
      order.products ||
      order.meals ||
      [];

    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") return Object.keys(raw).map(function (key) { return raw[key]; });

    return [];
  }

  function itemName(item) {
    if (typeof item === "string") return item;

    return (
      (item && item.name) ||
      (item && item.title) ||
      (item && item.itemName) ||
      (item && item.mealName) ||
      (item && item.productName) ||
      "مادة بدون اسم"
    );
  }

  function itemQty(item) {
    var qty = Number((item && (item.qty || item.quantity || item.count)) || 1);
    return isFinite(qty) && qty > 0 ? qty : 1;
  }

  function itemPrice(item) {
    var price = Number(
      (item &&
        (item.price ||
          item.unitPrice ||
          item.itemPrice ||
          item.totalPrice ||
          item.total)) ||
        0
    );

    return isFinite(price) && price > 0 ? price : null;
  }

  function statusOf(order) {
    return pick(order, ["status", "orderStatus", "state"], "جديد");
  }

  function isNewOrder(order) {
    var status = String(statusOf(order)).toLowerCase();
    return status === "جديد" || status.indexOf("new") >= 0 || status.indexOf("pending") >= 0;
  }

  function renderStats() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var todayCount = orders.filter(function (order) {
      return toMillis(order) >= today.getTime();
    }).length;

    var newCount = orders.filter(isNewOrder).length;

    setText("orders-total", orders.length);
    setText("orders-today", todayCount);
    setText("orders-new", newCount);
  }

  function renderOrders() {
    var list = byId("orders-list");
    var empty = byId("orders-empty");

    if (!list || !empty) return;

    list.innerHTML = "";

    if (!orders.length) {
      empty.style.display = "block";
      return;
    }

    empty.style.display = "none";

    orders.forEach(function (order) {
      var items = getItems(order);
      var itemsHtml = "";

      if (items.length) {
        itemsHtml = items.map(function (item) {
          return (
            '<div class="row">' +
              '<span class="item-name">' + escapeHtml(itemName(item)) + '</span>' +
              '<span class="center">' + escapeHtml(itemQty(item)) + '</span>' +
              '<span class="left">' + escapeHtml(money(itemPrice(item))) + '</span>' +
            '</div>'
          );
        }).join("");
      } else {
        itemsHtml = '<div class="empty-items">الطلب موجود، لكن ما لقينا items/cart داخله.</div>';
      }

      var raw = escapeHtml(JSON.stringify(order, null, 2));

      var html =
        '<article class="order-card">' +
          '<div class="order-top">' +
            '<div>' +
              '<div class="badges">' +
                '<span class="status-badge">' + escapeHtml(statusOf(order)) + '</span>' +
                '<span class="time-badge">' + escapeHtml(formatDate(order)) + '</span>' +
              '</div>' +
              '<p class="order-id">طلب #' + escapeHtml(String(order.id).slice(0, 8)) + '</p>' +
              '<h2>' + escapeHtml(pick(order, ["restaurantName", "restaurant", "storeName", "branchName"], "مطعم غير محدد")) + '</h2>' +
            '</div>' +
            '<div class="total-box">' +
              '<p>الإجمالي</p>' +
              '<b>' + escapeHtml(money(pickTotal(order))) + '</b>' +
            '</div>' +
          '</div>' +

          '<div class="info-grid">' +
            '<div><small>الزبون</small><p>' + escapeHtml(pick(order, ["customerName", "name", "clientName", "userName"], "زبون غير محدد")) + '</p></div>' +
            '<div><small>الهاتف</small><p>' + escapeHtml(pick(order, ["customerPhone", "phone", "mobile", "clientPhone"], "غير محدد")) + '</p></div>' +
            '<div><small>العنوان</small><p>' + escapeHtml(pick(order, ["address", "customerAddress", "deliveryAddress", "locationText"], "غير محدد")) + '</p></div>' +
          '</div>' +

          '<div class="items-table">' +
            '<div class="head"><span>المادة</span><span class="center">الكمية</span><span class="left">السعر</span></div>' +
            itemsHtml +
          '</div>' +

          '<details class="raw-box">' +
            '<summary>بيانات Firestore الخام</summary>' +
            '<pre dir="ltr">' + raw + '</pre>' +
          '</details>' +
        '</article>';

      list.insertAdjacentHTML("beforeend", html);
    });
  }

  function showError(message) {
    var box = byId("error-box");
    var msg = byId("error-message");
    if (!box || !msg) return;

    msg.textContent = message;
    box.style.display = "block";
  }

  function hideError() {
    var box = byId("error-box");
    if (box) box.style.display = "none";
  }

  function setLoading(value) {
    var loading = byId("loading-box");
    if (loading) loading.style.display = value ? "block" : "none";
  }

  async function loadOrders() {
    try {
      setLoading(true);
      hideError();

      if (!projectId || !apiKey) {
        throw new Error("Firebase ENV ناقصة: NEXT_PUBLIC_FIREBASE_PROJECT_ID / NEXT_PUBLIC_FIREBASE_API_KEY");
      }

      var url =
        "https://firestore.googleapis.com/v1/projects/" +
        encodeURIComponent(projectId) +
        "/databases/(default)/documents/orders?pageSize=50&key=" +
        encodeURIComponent(apiKey);

      var response = await fetch(url);
      var data = await response.json().catch(function () { return null; });

      if (!response.ok) {
        throw new Error(
          (data && data.error && (data.error.message || data.error.status)) ||
          "Firestore REST read failed"
        );
      }

      var docs = Array.isArray(data && data.documents) ? data.documents : [];

      orders = docs
        .map(decodeDoc)
        .sort(function (a, b) {
          return toMillis(b) - toMillis(a);
        });

      renderStats();
      renderOrders();
      setText("last-refresh", new Date().toLocaleTimeString("ar-IQ"));
    } catch (err) {
      showError((err && err.message) || String(err));
      orders = [];
      renderStats();
      renderOrders();
    } finally {
      setLoading(false);
    }
  }

  window.fuseRefreshOrders = loadOrders;

  setText("page-version", VERSION);
  loadOrders();
  window.setInterval(loadOrders, 10000);
})();
`;

  return (
    <main dir="rtl" className="page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .page {
              min-height: 100vh;
              background: #050505;
              color: white;
              padding: 28px;
              font-family: Arial, sans-serif;
            }

            .shell {
              max-width: 1280px;
              margin: 0 auto;
            }

            .version {
              border: 1px solid rgba(34, 197, 94, 0.45);
              background: rgba(34, 197, 94, 0.12);
              color: #bbf7d0;
              border-radius: 22px;
              padding: 16px;
              font-weight: 900;
              margin-bottom: 22px;
            }

            .hero {
              background: #111116;
              border: 1px solid rgba(255, 122, 0, 0.35);
              border-radius: 30px;
              padding: 26px;
              margin-bottom: 22px;
            }

            .eyebrow {
              color: #ff7a00;
              margin: 0;
              font-weight: 900;
            }

            h1 {
              font-size: clamp(34px, 5vw, 54px);
              line-height: 1.1;
              margin: 12px 0;
              font-weight: 950;
            }

            .muted {
              color: #aaa;
              line-height: 1.8;
            }

            .actions {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
              margin-top: 18px;
            }

            .btn-orange,
            .btn-dark,
            .btn-green {
              padding: 14px 22px;
              border-radius: 18px;
              font-weight: 900;
              text-decoration: none;
              cursor: pointer;
              font-size: 14px;
            }

            .btn-orange {
              background: #ff7a00;
              color: #000;
              border: 0;
            }

            .btn-dark {
              background: rgba(255, 255, 255, 0.06);
              color: #fff;
              border: 1px solid rgba(255, 255, 255, 0.14);
            }

            .btn-green {
              background: rgba(34, 197, 94, 0.12);
              color: #bbf7d0;
              border: 1px solid rgba(34, 197, 94, 0.4);
            }

            .stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              gap: 16px;
              margin-bottom: 22px;
            }

            .stat,
            .order-card,
            .loading,
            .empty {
              background: #111116;
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 24px;
              padding: 20px;
            }

            .stat p {
              color: #888;
              margin: 0;
            }

            .stat b {
              display: block;
              font-size: 42px;
              margin-top: 8px;
            }

            .orange {
              color: #ff7a00;
            }

            .error {
              display: none;
              border: 1px solid rgba(239, 68, 68, 0.45);
              background: rgba(239, 68, 68, 0.12);
              color: #fecaca;
              border-radius: 24px;
              padding: 22px;
              margin-bottom: 22px;
            }

            .error pre {
              white-space: pre-wrap;
              font-family: Arial, sans-serif;
              line-height: 1.8;
            }

            .loading,
            .empty {
              text-align: center;
              color: #aaa;
              padding: 45px;
              margin-bottom: 18px;
            }

            .empty {
              display: none;
              border-style: dashed;
              border-color: rgba(255, 122, 0, 0.45);
            }

            .orders {
              display: grid;
              gap: 16px;
            }

            .order-top {
              display: flex;
              justify-content: space-between;
              gap: 18px;
              flex-wrap: wrap;
              align-items: flex-start;
            }

            .badges {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
              margin-bottom: 12px;
            }

            .status-badge {
              background: #ff7a00;
              color: #000;
              border-radius: 999px;
              padding: 6px 12px;
              font-size: 12px;
              font-weight: 900;
            }

            .time-badge {
              background: rgba(255, 255, 255, 0.06);
              color: #ddd;
              border-radius: 999px;
              padding: 6px 12px;
              font-size: 12px;
            }

            .order-id {
              color: #ff7a00;
              margin: 0;
            }

            .order-card h2 {
              font-size: 26px;
              margin: 8px 0 0;
            }

            .total-box {
              background: rgba(0, 0, 0, 0.3);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 18px;
              padding: 14px 18px;
              min-width: 150px;
            }

            .total-box p,
            .info-grid small {
              color: #888;
              margin: 0;
              font-size: 12px;
            }

            .total-box b {
              display: block;
              color: #ff7a00;
              margin-top: 6px;
              font-size: 24px;
            }

            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
              gap: 12px;
              margin-top: 18px;
            }

            .info-grid div {
              background: rgba(0, 0, 0, 0.25);
              border-radius: 18px;
              padding: 14px;
            }

            .info-grid p {
              margin: 6px 0 0;
              font-weight: 800;
            }

            .items-table {
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 18px;
              overflow: hidden;
              margin-top: 18px;
            }

            .head,
            .row {
              display: grid;
              grid-template-columns: 1fr 80px 130px;
              padding: 12px;
            }

            .head {
              background: rgba(255, 255, 255, 0.06);
              color: #aaa;
              font-size: 12px;
              font-weight: 900;
            }

            .row {
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              font-size: 14px;
            }

            .item-name {
              font-weight: 800;
            }

            .center {
              text-align: center;
            }

            .left {
              text-align: left;
            }

            .empty-items {
              padding: 14px;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              color: #aaa;
            }

            .raw-box {
              background: rgba(0, 0, 0, 0.3);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 18px;
              padding: 14px;
              margin-top: 18px;
            }

            .raw-box summary {
              cursor: pointer;
              font-weight: 800;
              color: #ddd;
            }

            .raw-box pre {
              margin-top: 14px;
              max-height: 300px;
              overflow: auto;
              white-space: pre-wrap;
              color: #aaa;
              font-size: 12px;
              text-align: left;
            }
          `,
        }}
      />

      <section className="shell">
        <div className="version">
          النسخة الحالية: <span id="page-version">FUSE_RESTAURANT_ORDERS_V21_STATIC_BROWSER_FETCH</span>
        </div>

        <header className="hero">
          <p className="eyebrow">FUSE /restaurant-orders-v5</p>
          <h1>الطلبات الحقيقية من Firestore</h1>
          <p className="muted">
            نسخة Static 100% للـ build، والطلبات تنجلب من المتصفح بعد فتح الصفحة.
          </p>
          <p className="muted">
            آخر تحديث: <span id="last-refresh">جاري التحميل...</span>
          </p>

          <div className="actions">
            <a className="btn-orange" href="/customer">
              فتح الزبون
            </a>
            <a className="btn-dark" href="/restaurant-admin">
              رجوع للوحة المطعم
            </a>
            <button className="btn-green" type="button" onClick="window.fuseRefreshOrders && window.fuseRefreshOrders()">
              تحديث الطلبات
            </button>
          </div>
        </header>

        <section className="stats">
          <div className="stat">
            <p>كل الطلبات</p>
            <b id="orders-total">0</b>
          </div>

          <div className="stat">
            <p>طلبات اليوم</p>
            <b id="orders-today" className="orange">0</b>
          </div>

          <div className="stat">
            <p>طلبات جديدة</p>
            <b id="orders-new">0</b>
          </div>
        </section>

        <section id="error-box" className="error">
          <h2>خطأ بقراءة Firestore</h2>
          <pre id="error-message"></pre>
          <p>
            إذا مكتوب PERMISSION_DENIED، فهذا يعني الصفحة وصلت Firestore والقواعد تمنع قراءة orders.
          </p>
        </section>

        <section id="loading-box" className="loading">
          جاري تحميل orders...
        </section>

        <section id="orders-empty" className="empty">
          <h2>ماكو طلبات بعد</h2>
          <p>أرسل طلب جديد من /customer وارجع هنا.</p>
        </section>

        <section id="orders-list" className="orders"></section>
      </section>

      <script dangerouslySetInnerHTML={{ __html: clientScript }} />
    </main>
  );
}
