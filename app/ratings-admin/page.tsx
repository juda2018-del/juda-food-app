"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

type Rating = {
  id: string;
  orderId?: string;
  customerName?: string;
  phone?: string;
  restaurant?: string;
  driverName?: string;
  driverPhone?: string;
  driverRating?: number;
  restaurantRating?: number;
  comment?: string;
  total?: number;
  createdAt?: number;
};

type Summary = {
  name: string;
  count: number;
  total: number;
  average: number;
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatAverage(value: number) {
  return value ? value.toFixed(1) : "0.0";
}

function formatDate(value?: number) {
  if (!value) return "لا يوجد وقت";

  const date = new Date(value);

  if (isNaN(date.getTime())) return "لا يوجد وقت";

  return date.toLocaleString("ar-IQ", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function buildSummary(
  ratings: Rating[],
  key: "driverName" | "restaurant",
  ratingKey: "driverRating" | "restaurantRating"
): Summary[] {
  const groups: Record<string, { count: number; total: number }> = {};

  ratings.forEach((rating) => {
    const name = String(rating[key] || "غير محدد").trim();
    const value = Number(rating[ratingKey] || 0);

    if (!groups[name]) {
      groups[name] = { count: 0, total: 0 };
    }

    if (value > 0) {
      groups[name].count += 1;
      groups[name].total += value;
    }
  });

  return Object.entries(groups)
    .map(([name, data]) => ({
      name,
      count: data.count,
      total: data.total,
      average: data.count ? data.total / data.count : 0,
    }))
    .sort((a, b) => b.average - a.average);
}

export default function RatingsAdminPage() {
  const [ratings, setRatings] = useState<Rating[]>([]);

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

  const driverRatings = ratings
    .map((rating) => Number(rating.driverRating || 0))
    .filter((value) => value > 0);

  const restaurantRatings = ratings
    .map((rating) => Number(rating.restaurantRating || 0))
    .filter((value) => value > 0);

  const appAverage = average([...driverRatings, ...restaurantRatings]);
  const driverAverage = average(driverRatings);
  const restaurantAverage = average(restaurantRatings);

  const driversSummary = useMemo(() => {
    return buildSummary(ratings, "driverName", "driverRating");
  }, [ratings]);

  const restaurantsSummary = useMemo(() => {
    return buildSummary(ratings, "restaurant", "restaurantRating");
  }, [ratings]);

  const weakDrivers = driversSummary.filter((driver) => driver.average < 3);
  const lastComments = [...ratings]
    .filter((rating) => rating.comment && rating.comment.trim())
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .slice(0, 10);

  const bestDriver = driversSummary[0];
  const bestRestaurant = restaurantsSummary[0];

  return (
    <main dir="rtl" className="min-h-screen bg-black px-4 py-6 text-white">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-center text-4xl font-black text-yellow-400">
          لوحة إدارة التقييمات
        </h1>

        <p className="mt-2 text-center text-gray-300">
          متابعة تقييمات السائقين والمطاعم والتعليقات
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard title="عدد التقييمات" value={ratings.length} />
          <StatCard
            title="تقييم التطبيق"
            value={`⭐ ${formatAverage(appAverage)}`}
            green
          />
          <StatCard
            title="تقييم السائقين"
            value={`⭐ ${formatAverage(driverAverage)}`}
            green
          />
          <StatCard
            title="تقييم المطاعم"
            value={`⭐ ${formatAverage(restaurantAverage)}`}
            green
          />
          <StatCard title="تنبيهات ضعيفة" value={weakDrivers.length} red />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-5 text-black">
            <h2 className="mb-4 text-2xl font-black">🏆 أفضل السائقين</h2>

            {driversSummary.length === 0 ? (
              <EmptyText />
            ) : (
              <div className="flex flex-col gap-3">
                {driversSummary.slice(0, 5).map((driver, index) => (
                  <RankCard
                    key={driver.name}
                    index={index}
                    name={driver.name}
                    average={driver.average}
                    count={driver.count}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-5 text-black">
            <h2 className="mb-4 text-2xl font-black">🍽️ أفضل المطاعم</h2>

            {restaurantsSummary.length === 0 ? (
              <EmptyText />
            ) : (
              <div className="flex flex-col gap-3">
                {restaurantsSummary.slice(0, 5).map((restaurant, index) => (
                  <RankCard
                    key={restaurant.name}
                    index={index}
                    name={restaurant.name}
                    average={restaurant.average}
                    count={restaurant.count}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <HighlightCard
            title="أفضل سائق"
            name={bestDriver?.name || "لا يوجد بعد"}
            value={
              bestDriver
                ? `⭐ ${formatAverage(bestDriver.average)} / ${bestDriver.count} تقييم`
                : "لا توجد تقييمات"
            }
          />

          <HighlightCard
            title="أفضل مطعم"
            name={bestRestaurant?.name || "لا يوجد بعد"}
            value={
              bestRestaurant
                ? `⭐ ${formatAverage(bestRestaurant.average)} / ${
                    bestRestaurant.count
                  } تقييم`
                : "لا توجد تقييمات"
            }
          />
        </div>

        {weakDrivers.length > 0 && (
          <div className="mt-8 rounded-3xl bg-red-100 p-5 text-red-800">
            <h2 className="mb-4 text-2xl font-black">
              🚨 سائقين تقييمهم منخفض
            </h2>

            <div className="flex flex-col gap-3">
              {weakDrivers.map((driver) => (
                <div
                  key={driver.name}
                  className="rounded-2xl bg-white p-4 font-bold"
                >
                  {driver.name} — ⭐ {formatAverage(driver.average)} من{" "}
                  {driver.count} تقييم
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 rounded-3xl bg-white p-5 text-black">
          <h2 className="mb-4 text-2xl font-black">💬 آخر التعليقات</h2>

          {lastComments.length === 0 ? (
            <EmptyText />
          ) : (
            <div className="flex flex-col gap-3">
              {lastComments.map((rating) => (
                <div
                  key={rating.id}
                  className="rounded-2xl bg-gray-100 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black">
                        {rating.customerName || "زبون"}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {rating.restaurant || "مطعم غير محدد"} —{" "}
                        {rating.driverName || "سائق غير محدد"}
                      </p>
                    </div>

                    <div className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-black">
                      ⭐ {rating.driverRating || 0} / ⭐{" "}
                      {rating.restaurantRating || 0}
                    </div>
                  </div>

                  <p className="mt-3 text-gray-800">{rating.comment}</p>

                  <p className="mt-2 text-xs text-gray-500">
                    {formatDate(rating.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
  green,
  red,
}: {
  title: string;
  value: string | number;
  green?: boolean;
  red?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white/10 p-4 text-center">
      <p className="text-sm text-gray-300">{title}</p>
      <p
        className={`mt-2 text-3xl font-black ${
          green ? "text-green-400" : red ? "text-red-400" : "text-yellow-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function RankCard({
  index,
  name,
  average,
  count,
}: {
  index: number;
  name: string;
  average: number;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-gray-100 p-4">
      <div>
        <p className="text-xl font-black">
          #{index + 1} {name}
        </p>
        <p className="text-sm text-gray-500">{count} تقييم</p>
      </div>

      <div className="rounded-full bg-yellow-400 px-4 py-2 font-black">
        ⭐ {formatAverage(average)}
      </div>
    </div>
  );
}

function HighlightCard({
  title,
  name,
  value,
}: {
  title: string;
  name: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-yellow-400 p-5 text-center text-black">
      <p className="text-sm font-bold">{title}</p>
      <h3 className="mt-2 text-3xl font-black">{name}</h3>
      <p className="mt-2 font-bold">{value}</p>
    </div>
  );
}

function EmptyText() {
  return (
    <div className="rounded-2xl bg-gray-100 p-5 text-center text-gray-500">
      لا توجد بيانات حالياً
    </div>
  );
}