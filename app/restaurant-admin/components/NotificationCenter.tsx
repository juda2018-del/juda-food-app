 "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

type NotificationItem = {
  id: string;
  title?: string;
  body?: string;
  type?: string;
  restaurant?: string;
  target?: string;
  createdAt?: any;
  seen?: boolean;
};

const restaurantName = "فيروز";

function toDate(value: any) {
  if (!value) return null;

  try {
    if (typeof value?.toDate === "function") return value.toDate();

    const date = new Date(value);
    if (isNaN(date.getTime())) return null;

    return date;
  } catch {
    return null;
  }
}

function formatTime(value: any) {
  const date = toDate(value);
  if (!date) return "لا يوجد وقت";

  return date.toLocaleString("ar-IQ", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMeta(type?: string) {
  if (type === "driver") {
    return { icon: "🛵", color: "#86efac" };
  }

  if (type === "danger" || type === "warning") {
    return { icon: "⚠️", color: "#fca5a5" };
  }

  if (type === "success") {
    return { icon: "✅", color: "#93c5fd" };
  }

  if (type === "ai") {
    return { icon: "🧠", color: "#facc15" };
  }

  return { icon: "📦", color: "#ffb347" };
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as NotificationItem[];

      setNotifications(
        data.filter((item) => {
          if (!item.restaurant) return true;
          return item.restaurant === restaurantName;
        })
      );
    });

    return () => unsub();
  }, []);

  const latest = useMemo(() => notifications.slice(0, 12), [notifications]);

  return (
    <section
      style={{
        marginTop: 18,
        border: "1px solid rgba(255,255,255,.10)",
        background:
          "linear-gradient(135deg, rgba(17,16,14,.98), rgba(7,6,5,.98))",
        borderRadius: 26,
        padding: 18,
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            color: "#ffb347",
            letterSpacing: 3,
            fontSize: 11,
            fontWeight: 950,
          }}
        >
          NOTIFICATION CENTER
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            color: "white",
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          🔔 مركز الإشعارات
        </h2>

        <p
          style={{
            marginTop: 8,
            color: "#a1a1aa",
            fontWeight: 800,
          }}
        >
          إشعارات حقيقية من Firestore حسب Collection notifications
        </p>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gap: 12,
        }}
      >
        {latest.length === 0 ? (
          <div
            style={{
              border: "1px dashed rgba(255,255,255,.12)",
              background: "rgba(0,0,0,.22)",
              borderRadius: 18,
              padding: 22,
              textAlign: "center",
              color: "#71717a",
              fontWeight: 900,
            }}
          >
            لا توجد إشعارات حالياً
          </div>
        ) : (
          latest.map((item) => {
            const meta = getMeta(item.type);

            return (
              <div
                key={item.id}
                style={{
                  border: item.seen
                    ? "1px solid rgba(255,255,255,.08)"
                    : "1px solid rgba(255,122,0,.25)",
                  background: item.seen
                    ? "rgba(0,0,0,.22)"
                    : "rgba(255,122,0,.08)",
                  borderRadius: 18,
                  padding: 16,
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 16,
                    background: "rgba(255,255,255,.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                  }}
                >
                  {meta.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      color: meta.color,
                      fontWeight: 950,
                      fontSize: 16,
                    }}
                  >
                    {item.title || "إشعار"}
                  </p>

                  <p
                    style={{
                      marginTop: 6,
                      color: "#d4d4d8",
                      fontWeight: 800,
                    }}
                  >
                    {item.body || "لا توجد تفاصيل"}
                  </p>
                </div>

                <div
                  style={{
                    color: "#71717a",
                    fontSize: 12,
                    fontWeight: 850,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatTime(item.createdAt)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}