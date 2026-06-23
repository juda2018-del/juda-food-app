 "use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";

type NotificationType =
  | "order"
  | "driver"
  | "restaurant"
  | "admin"
  | "customer"
  | "danger"
  | "ai";

type NotificationItem = {
  id: string;
  title?: string;
  body?: string;
  type?: NotificationType;
  target?: "all" | "admin" | "restaurant" | "driver" | "customer";
  isRead?: boolean;
  createdAt?: number;
};

function formatTime(value?: number) {
  if (!value) return "";
  return new Date(value).toLocaleString("ar-IQ", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function getIcon(type?: NotificationType) {
  switch (type) {
    case "order":
      return "📦";
    case "driver":
      return "🛵";
    case "restaurant":
      return "🍽️";
    case "customer":
      return "👤";
    case "admin":
      return "👑";
    case "danger":
      return "🚨";
    case "ai":
      return "🤖";
    default:
      return "🔔";
  }
}

function getTypeName(type?: NotificationType) {
  switch (type) {
    case "order":
      return "طلب";
    case "driver":
      return "سائق";
    case "restaurant":
      return "مطعم";
    case "customer":
      return "زبون";
    case "admin":
      return "إدارة";
    case "danger":
      return "خطر";
    case "ai":
      return "AI";
    default:
      return "عام";
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | NotificationType>("all");

  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NotificationItem[];

      setNotifications(data);
    });

    return () => unsub();
  }, []);

  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    return notifications.filter((item) => item.type === filter);
  }, [notifications, filter]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  async function createNotification(
    type: NotificationType,
    title: string,
    body: string,
    target: NotificationItem["target"] = "all"
  ) {
    await addDoc(collection(db, "notifications"), {
      title,
      body,
      type,
      target,
      isRead: false,
      createdAt: Date.now(),
    });
  }

  async function addOrderNotification() {
    await createNotification(
      "order",
      "طلب جديد",
      "وصل طلب جديد من مطعم فيروز ويحتاج متابعة.",
      "restaurant"
    );
  }

  async function addDriverNotification() {
    await createNotification(
      "driver",
      "السائق استلم الطلب",
      "تم استلام الطلب من المطعم والسائق بالطريق.",
      "admin"
    );
  }

  async function addRestaurantNotification() {
    await createNotification(
      "restaurant",
      "المطعم بدأ التحضير",
      "مطعم فيروز بدأ بتحضير الطلب.",
      "customer"
    );
  }

  async function addDangerNotification() {
    await createNotification(
      "danger",
      "ضغط مرتفع",
      "عدد الطلبات الجاهزة مرتفع ويحتاج توزيع سريع.",
      "admin"
    );
  }

  async function addAINotification() {
    await createNotification(
      "ai",
      "اقتراح AI",
      "النظام يقترح تشغيل سائقين إضافيين في زيونة.",
      "admin"
    );
  }

  const filters: { label: string; value: "all" | NotificationType }[] = [
    { label: "الكل", value: "all" },
    { label: "الطلبات", value: "order" },
    { label: "السائقين", value: "driver" },
    { label: "المطاعم", value: "restaurant" },
    { label: "الزبائن", value: "customer" },
    { label: "الإدارة", value: "admin" },
    { label: "الخطر", value: "danger" },
    { label: "AI", value: "ai" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        body {
          margin: 0;
          font-family: "Cairo", sans-serif;
          background: #efe8df;
        }

        .app {
          width: 100%;
          max-width: 430px;
          min-height: 100vh;
          margin: 0 auto;
          direction: rtl;
          padding: 18px 18px 34px;
          background: linear-gradient(180deg, #fffaf4 0%, #ffffff 100%);
          color: #151515;
        }

        .top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }

        .back {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          background: white;
          color: #151515;
          text-decoration: none;
          display: grid;
          place-items: center;
          font-size: 26px;
          font-weight: 900;
          box-shadow: 0 12px 28px rgba(0,0,0,.07);
        }

        .title {
          text-align: center;
        }

        .title h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 900;
        }

        .title p {
          margin: 4px 0 0;
          color: #888;
          font-size: 13px;
          font-weight: 800;
        }

        .hero {
          background:
            radial-gradient(circle at 15% 20%, rgba(255,255,255,.25), transparent 28%),
            linear-gradient(135deg, #ff4d00, #ff8a00);
          border-radius: 30px;
          padding: 20px;
          color: white;
          box-shadow: 0 18px 42px rgba(255,77,0,.22);
          margin-bottom: 16px;
        }

        .hero-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .hero-icon {
          width: 58px;
          height: 58px;
          border-radius: 20px;
          background: rgba(255,255,255,.22);
          display: grid;
          place-items: center;
          font-size: 28px;
        }

        .hero h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 900;
        }

        .hero p {
          margin: 5px 0 0;
          color: rgba(255,255,255,.9);
          font-size: 13px;
          font-weight: 800;
        }

        .hero-number {
          font-size: 34px;
          font-weight: 900;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }

        .stat {
          background: white;
          border-radius: 24px;
          padding: 14px 10px;
          text-align: center;
          box-shadow: 0 12px 30px rgba(0,0,0,.07);
        }

        .stat p {
          margin: 0;
          color: #888;
          font-size: 11px;
          font-weight: 800;
        }

        .stat b {
          display: block;
          margin-top: 5px;
          font-size: 20px;
          font-weight: 900;
          color: #151515;
        }

        .quick {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 16px;
        }

        .quick button {
          border: 0;
          border-radius: 20px;
          padding: 13px;
          font-family: inherit;
          font-weight: 900;
          background: white;
          color: #151515;
          box-shadow: 0 12px 30px rgba(0,0,0,.06);
        }

        .quick button.primary {
          background: #ff4d00;
          color: white;
          box-shadow: 0 12px 28px rgba(255,77,0,.22);
        }

        .filters {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 16px;
          scrollbar-width: none;
        }

        .filters::-webkit-scrollbar {
          display: none;
        }

        .filter {
          flex: 0 0 auto;
          border: 0;
          border-radius: 999px;
          padding: 10px 16px;
          background: white;
          color: #151515;
          font-family: inherit;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 10px 24px rgba(0,0,0,.06);
        }

        .filter.active {
          background: #151515;
          color: white;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .empty {
          background: white;
          border-radius: 26px;
          padding: 24px;
          text-align: center;
          color: #888;
          font-weight: 800;
          box-shadow: 0 12px 30px rgba(0,0,0,.06);
        }

        .item {
          background: white;
          border-radius: 26px;
          padding: 14px;
          display: grid;
          grid-template-columns: 54px 1fr;
          gap: 12px;
          box-shadow: 0 12px 30px rgba(0,0,0,.07);
          border: 1px solid rgba(0,0,0,.04);
        }

        .icon {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          background: #fff3e9;
          display: grid;
          place-items: center;
          font-size: 25px;
        }

        .item-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }

        .item h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 900;
          color: #151515;
        }

        .time {
          color: #999;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .item p {
          margin: 6px 0 10px;
          color: #666;
          font-size: 13px;
          line-height: 1.7;
          font-weight: 700;
        }

        .chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .chip {
          background: #f8f3ee;
          color: #555;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 900;
        }

        .chip.unread {
          background: #ff4d00;
          color: white;
        }
      `}</style>

      <main className="app">
        <header className="top">
          <a className="back" href="/">‹</a>

          <div className="title">
            <h1>الإشعارات</h1>
            <p>تنبيهات مباشرة لكل النظام</p>
          </div>

          <div style={{ width: 44 }} />
        </header>

        <section className="hero">
          <div className="hero-top">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="hero-icon">🔔</div>
              <div>
                <h2>مركز التنبيهات</h2>
                <p>الطلبات، السائقين، المطاعم والإدارة</p>
              </div>
            </div>

            <div className="hero-number">{unreadCount}</div>
          </div>
        </section>

        <section className="stats">
          <div className="stat">
            <p>الكل</p>
            <b>{notifications.length}</b>
          </div>

          <div className="stat">
            <p>غير مقروءة</p>
            <b>{unreadCount}</b>
          </div>

          <div className="stat">
            <p>خطر</p>
            <b>{notifications.filter((n) => n.type === "danger").length}</b>
          </div>
        </section>

        <section className="quick">
          <button className="primary" onClick={addOrderNotification}>
            📦 طلب جديد
          </button>
          <button onClick={addDriverNotification}>🛵 السائق استلم</button>
          <button onClick={addRestaurantNotification}>🍽️ المطعم يحضّر</button>
          <button onClick={addDangerNotification}>🚨 خطر</button>
          <button onClick={addAINotification}>🤖 AI</button>
        </section>

        <section className="filters">
          {filters.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={filter === item.value ? "filter active" : "filter"}
            >
              {item.label}
            </button>
          ))}
        </section>

        <section className="list">
          {filteredNotifications.length === 0 ? (
            <div className="empty">لا توجد إشعارات حالياً</div>
          ) : (
            filteredNotifications.map((item) => (
              <div key={item.id} className="item">
                <div className="icon">{getIcon(item.type)}</div>

                <div>
                  <div className="item-head">
                    <h3>{item.title || "إشعار جديد"}</h3>
                    <span className="time">{formatTime(item.createdAt)}</span>
                  </div>

                  <p>{item.body || "لا توجد تفاصيل"}</p>

                  <div className="chips">
                    <span className="chip">النوع: {getTypeName(item.type)}</span>
                    <span className="chip">الهدف: {item.target || "all"}</span>
                    <span className={item.isRead ? "chip" : "chip unread"}>
                      {item.isRead ? "مقروء" : "غير مقروء"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </>
  );
}