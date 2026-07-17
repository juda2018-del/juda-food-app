"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

type Order = {
  id: string;
  restaurant?: string;
  total?: number;
  status?: string;
  createdAt?: any;
};

type Rating = {
  id: string;
  restaurant?: string;
  restaurantRating?: number;
  createdAt?: any;
};

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-IQ")} د.ع`;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildRestaurantStats(orders: Order[], ratings: Rating[]) {
  const map: Record<
    string,
    {
      name: string;
      sales: number;
      orders: number;
      delivered: number;
      active: number;
      rejected: number;
      rating: number;
    }
  > = {};

  orders.forEach((order) => {
    const name = order.restaurant || "غير محدد";

    if (!map[name]) {
      map[name] = {
        name,
        sales: 0,
        orders: 0,
        delivered: 0,
        active: 0,
        rejected: 0,
        rating: 0,
      };
    }

    map[name].orders += 1;

    if (order.status === "تم التسليم") {
      map[name].delivered += 1;
      map[name].sales += Number(order.total || 0);
    } else if (order.status === "مرفوض") {
      map[name].rejected += 1;
    } else {
      map[name].active += 1;
    }
  });

  Object.keys(map).forEach((restaurantName) => {
    const restaurantRatings = ratings
      .filter((rating) => rating.restaurant === restaurantName)
      .map((rating) => Number(rating.restaurantRating || 0))
      .filter((value) => value > 0);

    map[restaurantName].rating = average(restaurantRatings);
  });

  return Object.values(map).sort((a, b) => b.sales - a.sales);
}

export default function RestaurantIntelligencePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);

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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ratings"), (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Rating[];

      setRatings(data);
    });

    return () => unsub();
  }, []);

  const restaurantStats = useMemo(() => {
    return buildRestaurantStats(orders, ratings);
  }, [orders, ratings]);

  const activeRestaurants = restaurantStats.filter(
    (restaurant) => restaurant.active > 0 || restaurant.delivered > 0
  );

  const totalSales = restaurantStats.reduce(
    (sum, restaurant) => sum + restaurant.sales,
    0
  );

  const totalOrders = restaurantStats.reduce(
    (sum, restaurant) => sum + restaurant.orders,
    0
  );

  const topRestaurant = restaurantStats[0];

  const needsFollowUp = restaurantStats.filter(
    (restaurant) =>
      restaurant.rejected > 0 ||
      (restaurant.rating > 0 && restaurant.rating < 3) ||
      restaurant.active >= 5
  );

  const avgRestaurantRating = average(
    restaurantStats
      .map((restaurant) => restaurant.rating)
      .filter((value) => value > 0)
  );

  const health =
    needsFollowUp.length >= 3
      ? {
          title: "يحتاج تدخل",
          color: "text-red-400",
          bg: "bg-red-500/15",
          border: "border-red-500/30",
        }
      : needsFollowUp.length >= 1
      ? {
          title: "يحتاج متابعة",
          color: "text-yellow-400",
          bg: "bg-yellow-500/15",
          border: "border-yellow-500/30",
        }
      : {
          title: "ممتاز",
          color: "text-green-400",
          bg: "bg-green-500/15",
          border: "border-green-500/30",
        };

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-black text-yellow-400">
            🍽️ Restaurant Intelligence
          </h1>

          <p className="text-slate-400 mt-3 text-lg">
            مركز ذكاء وتحليل أداء المطاعم في فيوز
          </p>
        </div>

        <div className={`mt-10 rounded-3xl border ${health.border} ${health.bg} p-6`}>
          <h2 className={`text-4xl font-black ${health.color}`}>
            🟢 صحة المطاعم: {health.title}
          </h2>

          <p className="mt-3 text-slate-300">
            يتم تقييم الحالة حسب الطلبات النشطة، المرفوضة، وتقييمات المطاعم.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-5">
          <Stat title="كل المطاعم" value={restaurantStats.length} color="text-white" />
          <Stat title="المطاعم النشطة" value={activeRestaurants.length} color="text-green-400" />
          <Stat title="كل المبيعات" value={formatMoney(totalSales)} color="text-yellow-400" />
          <Stat title="متوسط التقييم" value={`⭐ ${avgRestaurantRating.toFixed(1)}`} color="text-purple-400" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black text-yellow-400">
              💰 ترتيب المطاعم حسب المبيعات
            </h2>

            <div className="mt-6 space-y-4">
              {restaurantStats.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
                  لا توجد بيانات مطاعم حالياً
                </div>
              ) : (
                restaurantStats.map((restaurant, index) => (
                  <div
                    key={restaurant.name}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-5"
                  >
                    <div className="flex justify-between gap-4">
                      <h3 className="text-xl font-black">
                        #{index + 1} {restaurant.name}
                      </h3>

                      <span className="text-yellow-400 font-black">
                        {formatMoney(restaurant.sales)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <Badge label="كل الطلبات" value={restaurant.orders} />
                      <Badge label="المسلّمة" value={restaurant.delivered} />
                      <Badge label="النشطة" value={restaurant.active} />
                      <Badge label="التقييم" value={`⭐ ${restaurant.rating.toFixed(1)}`} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black text-red-400">
              🚨 تحتاج متابعة
            </h2>

            <div className="mt-6 space-y-4">
              {needsFollowUp.length === 0 ? (
                <div className="bg-green-500/15 border border-green-500/30 rounded-2xl p-5 text-green-300">
                  ✅ كل المطاعم وضعها جيد حالياً
                </div>
              ) : (
                needsFollowUp.map((restaurant) => (
                  <div
                    key={restaurant.name}
                    className="bg-red-500/15 border border-red-500/30 rounded-2xl p-5"
                  >
                    <h3 className="font-black text-xl">{restaurant.name}</h3>
                    <p className="mt-2 text-slate-300">
                      نشطة: {restaurant.active} | مرفوضة: {restaurant.rejected} | تقييم:{" "}
                      {restaurant.rating.toFixed(1)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <AiCard
            title="🤖 Restaurant AI"
            text={
              topRestaurant
                ? `أفضل مطعم حالياً هو ${topRestaurant.name}. ركّز عليه بالعروض لأنه الأعلى دخلاً.`
                : "لا توجد بيانات كافية بعد."
            }
          />

          <AiCard
            title="📈 اقتراح نمو"
            text="ارفع ظهور المطاعم الأعلى تقييماً وقت الذروة لزيادة التحويل."
          />

          <AiCard
            title="⚠️ متابعة"
            text={
              needsFollowUp.length > 0
                ? `يوجد ${needsFollowUp.length} مطعم يحتاج متابعة تشغيلية.`
                : "لا توجد مشاكل واضحة حالياً."
            }
          />
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

function AiCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
      <h2 className="text-2xl font-black text-purple-400">{title}</h2>
      <p className="mt-4 text-slate-300 leading-8">{text}</p>
    </div>
  );
}