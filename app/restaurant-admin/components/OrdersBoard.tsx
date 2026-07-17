 import OrderCard from "./OrderCard";

type Props = {
  columns: string[];
  ordersByStatus: Record<string, any[]>;
  availableDrivers: any[];
  changeStatus: (docId: string, status: string) => void;
  smartReadyForDelivery: (order: any) => void;
  assignDriver: (order: any, driver: any) => void;
  printOrder: (order: any) => void;
};

function statusColor(status: string) {
  if (status === "جديد") return "#ff7a00";
  if (status === "قيد التحضير") return "#f59e0b";
  if (status === "جاهز للتوصيل") return "#22c55e";
  if (status === "قيد التوصيل") return "#3b82f6";
  if (status === "تم التسليم") return "#86efac";
  if (status === "مرفوض") return "#ef4444";
  return "#ffb347";
}

function statusIcon(status: string) {
  if (status === "جديد") return "🔥";
  if (status === "قيد التحضير") return "👨‍🍳";
  if (status === "جاهز للتوصيل") return "✅";
  if (status === "قيد التوصيل") return "🛵";
  if (status === "تم التسليم") return "🏁";
  if (status === "مرفوض") return "🚫";
  return "📦";
}

export default function OrdersBoard({
  columns,
  ordersByStatus,
  availableDrivers,
  changeStatus,
  smartReadyForDelivery,
  assignDriver,
  printOrder,
}: Props) {
  const total = columns.reduce(
    (sum, status) => sum + (ordersByStatus[status]?.length || 0),
    0
  );

  const newOrders = ordersByStatus["جديد"]?.length || 0;
  const preparingOrders = ordersByStatus["قيد التحضير"]?.length || 0;
  const readyOrders = ordersByStatus["جاهز للتوصيل"]?.length || 0;
  const deliveringOrders = ordersByStatus["قيد التوصيل"]?.length || 0;
  const doneOrders = ordersByStatus["تم التسليم"]?.length || 0;
  const rejectedOrders = ordersByStatus["مرفوض"]?.length || 0;

  const completionRate = total > 0 ? Math.round((doneOrders / total) * 100) : 0;
  const pressure =
    newOrders >= 8 || preparingOrders >= 8
      ? "ضغط عالي"
      : newOrders >= 4 || readyOrders >= 4
      ? "نشط"
      : "مستقر";

  const alerts = [
    newOrders > 0 ? `🔥 ${newOrders} طلب جديد يحتاج قبول` : "✅ لا توجد طلبات جديدة عالقة",
    readyOrders > 0
      ? `🛵 ${readyOrders} طلب جاهز للتوصيل`
      : "✅ لا توجد طلبات تنتظر سائق",
    availableDrivers.length < 2
      ? "⚠️ السائقين المتاحين قليلين"
      : `🟢 ${availableDrivers.length} سائق متاح`,
  ];

  return (
    <section
      style={{
        marginTop: 16,
        border: "1px solid rgba(255,255,255,.10)",
        background:
          "linear-gradient(180deg, rgba(14,13,11,.98), rgba(6,5,4,.98))",
        borderRadius: 28,
        padding: 16,
        boxShadow: "0 22px 60px rgba(0,0,0,.35)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "start",
          marginBottom: 14,
          gap: 16,
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
            LIVE ORDERS BOARD
          </p>

          <h2
            style={{
              margin: "7px 0 0",
              color: "white",
              fontSize: 25,
              fontWeight: 950,
            }}
          >
            📦 طلبات المطعم
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              color: "#a1a1aa",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            لوحة تشغيل مباشرة بنظام Kanban مع متابعة الضغط والتوزيع.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto auto",
            gap: 10,
            alignItems: "center",
          }}
        >
          <Badge label="كل الطلبات" value={total} color="#ffb347" />
          <Badge label="حالة التشغيل" value={pressure} color="#86efac" />
        </div>
      </div>

      <div
        style={{
          marginBottom: 14,
          display: "grid",
          gridTemplateColumns: "repeat(6,1fr)",
          gap: 10,
        }}
      >
        <Mini title="جديدة" value={newOrders} icon="🔥" color="#ff7a00" />
        <Mini title="تحضير" value={preparingOrders} icon="👨‍🍳" color="#f59e0b" />
        <Mini title="جاهزة" value={readyOrders} icon="✅" color="#22c55e" />
        <Mini title="توصيل" value={deliveringOrders} icon="🛵" color="#3b82f6" />
        <Mini title="مسلّمة" value={doneOrders} icon="🏁" color="#86efac" />
        <Mini title="إنجاز" value={`${completionRate}%`} icon="📈" color="#ffb347" />
      </div>

      <div
        style={{
          marginBottom: 14,
          border: "1px solid rgba(255,122,0,.18)",
          background: "rgba(255,122,0,.07)",
          borderRadius: 20,
          padding: 12,
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 10,
        }}
      >
        {alerts.map((alert, index) => (
          <div
            key={index}
            style={{
              background: "rgba(0,0,0,.22)",
              borderRadius: 14,
              padding: "10px 12px",
              color: "#d4d4d8",
              fontSize: 12,
              fontWeight: 900,
              lineHeight: 1.6,
            }}
          >
            {alert}
          </div>
        ))}
      </div>

      <div style={{ overflowX: "auto", paddingBottom: 8 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            minWidth: "max-content",
            alignItems: "flex-start",
          }}
        >
          {columns.map((status) => {
            const count = ordersByStatus[status]?.length || 0;
            const color = statusColor(status);

            return (
              <div
                key={status}
                style={{
                  width: 276,
                  minWidth: 276,
                  background: "#100d0a",
                  border: `1px solid ${color}22`,
                  borderRadius: 22,
                  padding: 10,
                  minHeight: 560,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
                }}
              >
                <div
                  style={{
                    background:
                      count > 0
                        ? `linear-gradient(135deg, ${color}1f, rgba(0,0,0,.55))`
                        : "rgba(0,0,0,.55)",
                    border: `1px solid ${color}33`,
                    borderRadius: 16,
                    padding: 11,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display: "block",
                        color: "white",
                        fontSize: 14,
                        fontWeight: 950,
                      }}
                    >
                      {statusIcon(status)} {status}
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: 4,
                        color: "#71717a",
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      {count === 0
                        ? "لا توجد طلبات"
                        : status === "جديد"
                        ? "بانتظار القبول"
                        : status === "قيد التحضير"
                        ? "داخل المطبخ"
                        : status === "جاهز للتوصيل"
                        ? "بانتظار السائق"
                        : status === "قيد التوصيل"
                        ? "بالطريق للزبون"
                        : status === "تم التسليم"
                        ? "مكتملة"
                        : "تحتاج مراجعة"}
                    </span>
                  </div>

                  <span
                    style={{
                      background: color,
                      color: status === "تم التسليم" ? "#111" : "white",
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 950,
                    }}
                  >
                    {count}
                  </span>
                </div>

                <div
                  style={{
                    height: 7,
                    borderRadius: 999,
                    background: "rgba(255,255,255,.08)",
                    overflow: "hidden",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: `${total > 0 ? Math.min((count / total) * 100, 100) : 0}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: color,
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {count === 0 ? (
                    <div
                      style={{
                        border: "1px dashed rgba(255,255,255,.12)",
                        borderRadius: 16,
                        padding: 18,
                        textAlign: "center",
                        color: "#52525b",
                        fontSize: 12,
                        fontWeight: 900,
                        background: "rgba(0,0,0,.18)",
                      }}
                    >
                      لا توجد طلبات
                    </div>
                  ) : (
                    ordersByStatus[status].map((order) => (
                      <OrderCard
                        key={order.docId}
                        order={order}
                        availableDrivers={availableDrivers}
                        changeStatus={changeStatus}
                        smartReadyForDelivery={smartReadyForDelivery}
                        assignDriver={assignDriver}
                        printOrder={printOrder}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Badge({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${color}33`,
        background: `${color}12`,
        color,
        borderRadius: 999,
        padding: "8px 13px",
        fontSize: 12,
        fontWeight: 950,
        whiteSpace: "nowrap",
      }}
    >
      {label}: {value}
    </div>
  );
}

function Mini({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${color}22`,
        background: "rgba(0,0,0,.22)",
        borderRadius: 16,
        padding: 12,
      }}
    >
      <p style={{ margin: 0, color: "#a1a1aa", fontSize: 11, fontWeight: 900 }}>
        {icon} {title}
      </p>

      <p style={{ margin: "7px 0 0", color, fontSize: 20, fontWeight: 950 }}>
        {value}
      </p>
    </div>
  );
}