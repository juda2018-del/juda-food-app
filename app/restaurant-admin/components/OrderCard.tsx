 import { useState } from "react";
import { Driver, Order } from "./types";
import { ActionButton, ActionLink } from "./ActionButtons";

type Props = {
  order: Order;
  availableDrivers: Driver[];
  changeStatus: (docId: string, status: string) => void;
  smartReadyForDelivery: (order: Order) => void;
  assignDriver: (order: Order, driver: Driver) => void;
  printOrder: (order: Order) => void;
};

function cleanPhone(phone?: string) {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

function whatsappPhone(phone?: string) {
  const cleaned = cleanPhone(phone);
  if (!cleaned) return "";
  if (cleaned.startsWith("964")) return cleaned;
  if (cleaned.startsWith("0")) return `964${cleaned.slice(1)}`;
  return cleaned;
}

function formatDate(createdAt: any) {
  if (!createdAt) return "لا يوجد وقت";
  const date =
    typeof createdAt?.toDate === "function"
      ? createdAt.toDate()
      : new Date(createdAt);

  if (isNaN(date.getTime())) return "لا يوجد وقت";

  return date.toLocaleString("ar-IQ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusStyle(status: string) {
  if (status === "قيد التحضير")
    return {
      background: "rgba(59,130,246,.14)",
      color: "#93c5fd",
      border: "1px solid rgba(59,130,246,.32)",
    };

  if (status === "جاهز للتوصيل")
    return {
      background: "rgba(34,197,94,.14)",
      color: "#86efac",
      border: "1px solid rgba(34,197,94,.32)",
    };

  if (status === "قيد التوصيل")
    return {
      background: "rgba(255,122,0,.14)",
      color: "#ffb347",
      border: "1px solid rgba(255,122,0,.35)",
    };

  if (status === "تم التسليم")
    return {
      background: "rgba(161,161,170,.12)",
      color: "#d4d4d8",
      border: "1px solid rgba(161,161,170,.26)",
    };

  if (status === "مرفوض")
    return {
      background: "rgba(239,68,68,.14)",
      color: "#fca5a5",
      border: "1px solid rgba(239,68,68,.32)",
    };

  return {
    background: "rgba(255,122,0,.14)",
    color: "#ffb347",
    border: "1px solid rgba(255,122,0,.35)",
  };
}

export default function OrderCard({
  order,
  availableDrivers,
  changeStatus,
  smartReadyForDelivery,
  assignDriver,
  printOrder,
}: Props) {
  const [open, setOpen] = useState(false);

  const status = order.status || "جديد";
  const phoneForCall = cleanPhone(order.phone);
  const phoneForWhatsapp = whatsappPhone(order.phone);
  const statusStyle = getStatusStyle(status);
  const itemsCount =
    order.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;

  return (
    <div
      style={{
        background: "#080706",
        border: "1px solid rgba(255,255,255,.12)",
        borderRadius: 18,
        padding: 12,
        boxShadow: "0 12px 28px rgba(0,0,0,.30)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, color: "#71717a", fontSize: 11, fontWeight: 900 }}>
            {formatDate(order.createdAt)}
          </p>

          <h3
            style={{
              margin: "5px 0 0",
              color: "white",
              fontSize: 16,
              fontWeight: 950,
              lineHeight: 1.25,
            }}
          >
            {order.customerName || "زبون"}
          </h3>
        </div>

        <span
          style={{
            ...statusStyle,
            borderRadius: 999,
            padding: "5px 8px",
            fontSize: 10,
            fontWeight: 950,
            whiteSpace: "nowrap",
            alignSelf: "flex-start",
          }}
        >
          {status}
        </span>
      </div>

      <div
        style={{
          marginTop: 10,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div>
          <p style={{ margin: 0, color: "#d4d4d8", fontSize: 12, fontWeight: 850 }}>
            📞 {order.phone || "لا يوجد رقم"}
          </p>

          <p style={{ margin: "5px 0 0", color: "#71717a", fontSize: 11, fontWeight: 800 }}>
            {itemsCount} مادة
          </p>
        </div>

        <div style={{ textAlign: "left" }}>
          <p style={{ margin: 0, color: "#71717a", fontSize: 11, fontWeight: 800 }}>
            المجموع
          </p>

          <p style={{ margin: "4px 0 0", color: "#ffb347", fontSize: 20, fontWeight: 950 }}>
            {(order.total || 0).toLocaleString()} د.ع
          </p>
        </div>
      </div>

      <button
        onClick={() => setOpen((value) => !value)}
        style={{
          marginTop: 10,
          width: "100%",
          border: "1px solid rgba(255,255,255,.10)",
          background: "rgba(255,255,255,.04)",
          color: "#ffb347",
          borderRadius: 12,
          padding: "8px 10px",
          fontSize: 12,
          fontWeight: 950,
          cursor: "pointer",
        }}
      >
        {open ? "إخفاء التفاصيل ▲" : "عرض التفاصيل ▼"}
      </button>

      {open && (
        <div
          style={{
            marginTop: 10,
            borderRadius: 14,
            background: "rgba(0,0,0,.42)",
            padding: 10,
          }}
        >
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 11, fontWeight: 950 }}>
            📍 {order.address || "لا يوجد عنوان"}
          </p>

          {order.items && order.items.length > 0 && (
            <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
              {order.items.slice(0, 5).map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 8,
                    color: "#f4f4f5",
                    fontSize: 12,
                    fontWeight: 850,
                  }}
                >
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.name} × {item.qty}
                  </span>

                  <span>{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {order.driverName && (
            <div
              style={{
                marginTop: 10,
                borderRadius: 12,
                background: "rgba(255,122,0,.10)",
                padding: 9,
                color: "#ffb347",
                fontSize: 12,
                fontWeight: 950,
              }}
            >
              السائق: {order.driverName}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: 10,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 7,
        }}
      >
        {phoneForCall ? (
          <ActionLink href={`tel:${phoneForCall}`} text="اتصال" white />
        ) : (
          <ActionButton text="اتصال" white />
        )}

        {phoneForWhatsapp ? (
          <ActionLink
            href={`https://wa.me/${phoneForWhatsapp}`}
            text="واتساب"
            green
          />
        ) : (
          <ActionButton text="واتساب" green />
        )}

        <ActionButton text="طباعة" orange onClick={() => printOrder(order)} />
      </div>

      <div style={{ marginTop: 8, display: "grid", gap: 7 }}>
        {status === "جديد" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            <ActionButton
              text="قبول"
              orange
              onClick={() => changeStatus(order.docId, "قيد التحضير")}
            />

            <ActionButton
              text="رفض"
              red
              onClick={() => changeStatus(order.docId, "مرفوض")}
            />
          </div>
        )}

        {status === "قيد التحضير" && (
          <ActionButton
            text="جاهز + توزيع ذكي"
            orange
            onClick={() => smartReadyForDelivery(order)}
          />
        )}

        {status === "جاهز للتوصيل" && (
          <>
            <ActionButton
              text="إسناد ذكي"
              orangeOutline
              onClick={() => smartReadyForDelivery(order)}
            />

            {availableDrivers.length > 0 && (
              <select
                defaultValue=""
                onChange={(e) => {
                  const driver = availableDrivers.find(
                    (d) => d.id === e.target.value
                  );

                  if (driver) assignDriver(order, driver);
                }}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,.10)",
                  background: "rgba(0,0,0,.5)",
                  color: "white",
                  padding: "9px 10px",
                  fontSize: 12,
                  fontWeight: 900,
                  outline: "none",
                }}
              >
                <option value="">اختيار سائق</option>

                {availableDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name || driver.id}
                  </option>
                ))}
              </select>
            )}
          </>
        )}

        {status === "قيد التوصيل" && (
          <ActionButton
            text="تم التسليم"
            green
            onClick={() => changeStatus(order.docId, "تم التسليم")}
          />
        )}
      </div>
    </div>
  );
}