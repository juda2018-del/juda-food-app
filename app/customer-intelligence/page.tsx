"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

type Order = {
  id: string;
  customerName?: string;
  phone?: string;
  address?: string;
  restaurant?: string;
  total?: number;
  status?: string;
  createdAt?: any;
};

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-IQ")} د.ع`;
}

function buildCustomers(orders: Order[]) {
  const map: Record<
    string,
    {
      name: string;
      phone: string;
      orders: number;
      delivered: number;
      active: number;
      rejected: number;
      spent: number;
      lastAddress: string;
      favoriteRestaurant: string;
    }
  > = {};

  orders.forEach((order) => {
    const key = order.phone || order.customerName || "زبون غير محدد";

    if (!map[key]) {
      map[key] = {
        name: order.customerName || "زبون",
        phone: order.phone || "لا يوجد رقم",
        orders: 0,
        delivered: 0,
        active: 0,
        rejected: 0,
        spent: 0,
        lastAddress: order.address || "غير محدد",
        favoriteRestaurant: order.restaurant || "غير محدد",
      };
    }

    map[key].orders += 1;

    if (order.address) map[key].lastAddress = order.address;
    if (order.restaurant) map[key].favoriteRestaurant = order.restaurant;

    if (order.status === "تم التسليم") {
      map[key].delivered += 1;
      map[key].spent += Number(order.total || 0);
    } else if (order.status === "مرفوض") {
      map[key].rejected += 1;
    } else {
      map[key].active += 1;
    }
  });

  return Object.values(map).sort((a, b) => b.spent - a.spent);
}

export default function CustomerIntelligencePage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Order[];

      setOrders(data);
    });

    return () => unsub();
  }, []);

  const customers = useMemo(() => buildCustomers(orders), [orders]);

  const vipCustomers = customers.filter(
    (customer) => customer.spent >= 50000 || customer.delivered >= 3
  );

  const topCustomer = customers[0];
  const mostOrdersCustomer = [...customers].sort(
    (a, b) => b.orders - a.orders
  )[0];

  const totalSpent = customers.reduce(
    (sum, customer) => sum + customer.spent,
    0
  );

  const avgCustomerValue =
    customers.length === 0 ? 0 : Math.round(totalSpent / customers.length);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-black text-yellow-400">
            👥 Customer Intelligence
          </h1>

          <p className="text-slate-400 mt-3 text-lg">
            مركز ذكاء الزبائن والولاء داخل فيوز
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-5">
          <Stat title="كل الزبائن" value={customers.length} color="text-white" />
          <Stat title="زبائن VIP" value={vipCustomers.length} color="text-yellow-400" />
          <Stat title="إجمالي صرف الزبائن" value={formatMoney(totalSpent)} color="text-green-400" />
          <Stat title="متوسط قيمة الزبون" value={formatMoney(avgCustomerValue)} color="text-purple-400" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black text-yellow-400">
              🏆 ترتيب الزبائن حسب الصرف
            </h2>

            <div className="mt-6 space-y-4">
              {customers.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
                  لا توجد بيانات زبائن حالياً
                </div>
              ) : (
                customers.slice(0, 12).map((customer, index) => (
                  <div
                    key={`${customer.phone}-${index}`}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-5"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black">
                          #{index + 1} {customer.name}
                        </h3>

                        <p className="text-slate-400 mt-1">
                          📞 {customer.phone}
                        </p>
                      </div>

                      <span className="bg-yellow-400 text-black rounded-full px-4 py-2 font-black">
                        {formatMoney(customer.spent)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <Badge label="كل الطلبات" value={customer.orders} />
                      <Badge label="المسلّمة" value={customer.delivered} />
                      <Badge label="النشطة" value={customer.active} />
                      <Badge
                        label="مطعم مفضل"
                        value={customer.favoriteRestaurant}
                      />
                    </div>

                    <p className="mt-4 text-slate-400">
                      📍 آخر عنوان: {customer.lastAddress}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black text-purple-400">
              🎁 Customer AI
            </h2>

            <div className="mt-6 space-y-4">
              <AiBox
                title="أعلى زبون صرفاً"
                value={
                  topCustomer
                    ? `${topCustomer.name} - ${formatMoney(topCustomer.spent)}`
                    : "لا يوجد"
                }
              />

              <AiBox
                title="أكثر زبون طلباً"
                value={
                  mostOrdersCustomer
                    ? `${mostOrdersCustomer.name} - ${mostOrdersCustomer.orders} طلب`
                    : "لا يوجد"
                }
              />

              <AiBox
                title="اقتراح كوبون"
                value={
                  topCustomer
                    ? `أرسل كوبون VIP إلى ${topCustomer.name}`
                    : "لا توجد بيانات كافية"
                }
              />

              <AiBox
                title="برنامج ولاء"
                value="كل زبون يكمل 5 طلبات يحصل خصم خاص"
              />
            </div>
          </div>

        </div>

        <div className="mt-8 bg-yellow-400 text-black rounded-3xl p-6 text-center">
          <p className="text-sm font-bold">اقتراح ذكي للولاء</p>

          <h2 className="mt-2 text-3xl font-black">
            {vipCustomers.length > 0
              ? `عندك ${vipCustomers.length} زبون VIP، سوِّ لهم عروض خاصة`
              : "بعد ماكو زبائن VIP كافيين"}
          </h2>

          <p className="mt-2 font-bold">
            الزبون المتكرر أرخص بالتسويق وأكثر ربحاً من الزبون الجديد.
          </p>
        </div>

      </div>
    </main>
  );
}

function Stat({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center">
      <p className="text-slate-400 text-sm">{title}</p>
      <p className={`mt-3 text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function Badge({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-slate-900 rounded-xl p-3">
      <p className="text-slate-400">{label}</p>
      <p className="font-black mt-1">{value}</p>
    </div>
  );
}

function AiBox({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
      <p className="text-slate-400">{title}</p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
    </div>
  );
}