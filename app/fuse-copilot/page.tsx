 "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

type OrderItem = {
  name?: string;
  qty?: number;
  quantity?: number;
  price?: number;
};

type Order = {
  id: string;
  customerName?: string;
  phone?: string;
  address?: string;
  restaurant?: string;
  total?: number;
  status?: string;
  driverName?: string;
  createdAt?: any;
  items?: OrderItem[];
};

type Rating = {
  id: string;
  restaurant?: string;
  driverName?: string;
  driverRating?: number;
  restaurantRating?: number;
  comment?: string;
  createdAt?: number;
};

function money(value: number) {
  return value.toLocaleString();
}

function topList(items: { name: string; value: number }[]) {
  const map: Record<string, number> = {};

  items.forEach((item) => {
    const name = item.name || "غير محدد";
    map[name] = (map[name] || 0) + item.value;
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

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

function getHour(value: any) {
  const date = toDate(value);
  if (!date) return "غير محدد";
  return `${date.getHours()}:00`;
}

export default function FuseCopilotPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(
    "🤖 أهلاً بك، أنا Fuse Copilot. اسألني عن التشغيل، السائقين، المطاعم، الطلبات، المبيعات، أو التقييمات."
  );

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

  const deliveredOrders = orders.filter(
    (order) => order.status === "تم التسليم"
  );

  const activeOrders = orders.filter(
    (order) => order.status !== "تم التسليم" && order.status !== "مرفوض"
  );

  const rejectedOrders = orders.filter((order) => order.status === "مرفوض");

  const totalSales = deliveredOrders.reduce(
    (sum, order) => sum + (order.total || 0),
    0
  );

  const topDrivers = useMemo(() => {
    return topList(
      deliveredOrders.map((order) => ({
        name: order.driverName || "غير محدد",
        value: 1,
      }))
    );
  }, [deliveredOrders]);

  const topRestaurants = useMemo(() => {
    return topList(
      deliveredOrders.map((order) => ({
        name: order.restaurant || "غير محدد",
        value: order.total || 0,
      }))
    );
  }, [deliveredOrders]);

  const topCustomers = useMemo(() => {
    return topList(
      deliveredOrders.map((order) => ({
        name: order.customerName || order.phone || "زبون",
        value: 1,
      }))
    );
  }, [deliveredOrders]);

  const topMeals = useMemo(() => {
    const meals: { name: string; value: number }[] = [];

    deliveredOrders.forEach((order) => {
      order.items?.forEach((item) => {
        meals.push({
          name: item.name || "وجبة",
          value: item.qty || item.quantity || 1,
        });
      });
    });

    return topList(meals);
  }, [deliveredOrders]);

  const rushHours = useMemo(() => {
    return topList(
      deliveredOrders.map((order) => ({
        name: getHour(order.createdAt),
        value: 1,
      }))
    );
  }, [deliveredOrders]);

  const appRating = average([
    ...ratings
      .map((rating) => Number(rating.driverRating || 0))
      .filter((value) => value > 0),
    ...ratings
      .map((rating) => Number(rating.restaurantRating || 0))
      .filter((value) => value > 0),
  ]);

  const weakRatings = ratings.filter(
    (rating) =>
      Number(rating.driverRating || 0) <= 2 ||
      Number(rating.restaurantRating || 0) <= 2
  );

  function askCopilot() {
    const q = question.trim().toLowerCase();

    if (!q) {
      setAnswer("اكتب سؤال حتى أجاوبك من بيانات فيوز.");
      return;
    }

    if (q.includes("سائق") || q.includes("درايفر")) {
      const best = topDrivers[0];

      setAnswer(
        best
          ? `🏆 أفضل سائق حالياً هو ${best.name}\n📦 الطلبات المسلّمة: ${best.value}\n🧠 قرار Copilot: خلي هذا السائق أولوية وقت الزخم.`
          : "ماكو بيانات كافية عن السائقين بعد."
      );
      return;
    }

    if (q.includes("مطعم")) {
      const best = topRestaurants[0];

      setAnswer(
        best
          ? `🍽 أفضل مطعم حالياً هو ${best.name}\n💰 المبيعات: ${money(best.value)} د.ع\n🧠 قرار Copilot: ركّز عليه بالعروض والإعلانات.`
          : "ماكو بيانات كافية عن المطاعم بعد."
      );
      return;
    }

    if (q.includes("مبيعات") || q.includes("ارباح") || q.includes("أرباح")) {
      const expected = Math.round(
        (totalSales / Math.max(deliveredOrders.length, 1)) *
          Math.max(orders.length, 1)
      );

      setAnswer(
        `💰 المبيعات المسلّمة: ${money(totalSales)} د.ع\n✅ الطلبات المسلّمة: ${deliveredOrders.length}\n📦 كل الطلبات: ${orders.length}\n📈 التوقع التقريبي: ${money(expected)} د.ع\n🧠 قرار Copilot: راقب ساعات الذروة وارفع جاهزية السائقين.`
      );
      return;
    }

    if (q.includes("ذروة") || q.includes("زخم") || q.includes("ضغط")) {
      const rush = rushHours[0];

      setAnswer(
        rush
          ? `🔥 أعلى ساعة ضغط هي ${rush.name}\n📦 الطلبات بهذا الوقت: ${rush.value}\n🧠 قرار Copilot: جهّز سائقين أكثر قبل هذا الوقت بنصف ساعة.`
          : "ماكو بيانات كافية عن ساعة الذروة بعد."
      );
      return;
    }

    if (q.includes("طلبات") || q.includes("طلب")) {
      setAnswer(
        `📦 الطلبات الحالية: ${activeOrders.length}\n✅ الطلبات المسلّمة: ${deliveredOrders.length}\n❌ الطلبات المرفوضة: ${rejectedOrders.length}\n📊 إجمالي الطلبات: ${orders.length}`
      );
      return;
    }

    if (q.includes("زبون") || q.includes("عميل")) {
      const best = topCustomers[0];

      setAnswer(
        best
          ? `👤 أكثر زبون طلباً هو ${best.name}\n📦 عدد الطلبات: ${best.value}\n🎁 قرار Copilot: أرسل له كوبون ولاء خاص.`
          : "ماكو بيانات كافية عن الزبائن بعد."
      );
      return;
    }

    if (q.includes("وجبة") || q.includes("اكل") || q.includes("أكلة")) {
      const best = topMeals[0];

      setAnswer(
        best
          ? `🥇 أكثر وجبة مطلوبة هي ${best.name}\n📦 تكررت: ${best.value} مرة\n🧠 قرار Copilot: خليها بالواجهة الرئيسية والعروض.`
          : "ماكو بيانات كافية عن الوجبات بعد."
      );
      return;
    }

    if (q.includes("تقييم") || q.includes("نجوم")) {
      setAnswer(
        `⭐ متوسط تقييم فيوز: ${appRating.toFixed(1)}\n💬 عدد التقييمات: ${ratings.length}\n⚠️ تقييمات ضعيفة: ${weakRatings.length}\n🧠 قرار Copilot: أي تقييم أقل من 3 نجوم يحتاج متابعة مباشرة.`
      );
      return;
    }

    if (q.includes("مشكلة") || q.includes("مشاكل") || q.includes("تنبيه")) {
      setAnswer(
        `🚨 تنبيهات Copilot:\n\n${
          activeOrders.length > 10
            ? "⚠️ الطلبات النشطة مرتفعة.\n"
            : "✅ الطلبات النشطة تحت السيطرة.\n"
        }${
          weakRatings.length > 0
            ? `⚠️ يوجد ${weakRatings.length} تقييم ضعيف يحتاج متابعة.\n`
            : "✅ لا توجد تقييمات ضعيفة خطيرة.\n"
        }${
          rejectedOrders.length > 0
            ? `⚠️ يوجد ${rejectedOrders.length} طلب مرفوض.\n`
            : "✅ لا توجد طلبات مرفوضة حالياً.\n"
        }`
      );
      return;
    }

    setAnswer(
      `🤖 ملخص Copilot لفيوز:\n\n📦 الطلبات الحالية: ${activeOrders.length}\n✅ الطلبات المسلّمة: ${deliveredOrders.length}\n❌ المرفوضة: ${rejectedOrders.length}\n💰 المبيعات: ${money(totalSales)} د.ع\n⭐ التقييم: ${appRating.toFixed(1)}\n🍽 أفضل مطعم: ${topRestaurants[0]?.name || "غير محدد"}\n🚗 أفضل سائق: ${topDrivers[0]?.name || "غير محدد"}`
    );
  }

  const quickQuestions = [
    "من أفضل سائق؟",
    "شنو أفضل مطعم؟",
    "شكد المبيعات؟",
    "شنو ساعة الذروة؟",
    "من أكثر زبون طلب؟",
    "شنو أكثر وجبة مطلوبة؟",
    "شنو المشاكل؟",
    "كم عدد الطلبات؟",
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-center text-6xl font-black text-yellow-400">
          🧠 Fuse Copilot
        </h1>

        <p className="mt-3 text-center text-gray-300">
          مساعد الإدارة الذكي المرتبط ببيانات Firestore
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
          <MiniStat title="كل الطلبات" value={orders.length} />
          <MiniStat title="النشطة" value={activeOrders.length} />
          <MiniStat title="المبيعات" value={`${money(totalSales)} د.ع`} />
          <MiniStat title="التقييم" value={`⭐ ${appRating.toFixed(1)}`} />
          <MiniStat title="تنبيهات" value={weakRatings.length + rejectedOrders.length} />
        </div>

        <div className="mt-10 rounded-3xl bg-white p-8">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") askCopilot();
            }}
            placeholder="اسأل Fuse Copilot..."
            className="w-full rounded-2xl border p-5 text-xl text-black outline-none focus:border-black"
          />

          <button
            onClick={askCopilot}
            className="mt-5 w-full rounded-2xl bg-black py-5 text-xl font-black text-white"
          >
            اسأل Fuse Copilot
          </button>

          <div className="mt-8 rounded-3xl bg-gray-100 p-8 text-black">
            <h2 className="mb-5 text-3xl font-black">الإجابة</h2>

            <p className="whitespace-pre-line text-xl leading-10">{answer}</p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {quickQuestions.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setQuestion(item);
                  setTimeout(() => askCopilot(), 50);
                }}
                className="rounded-2xl bg-yellow-400 p-3 font-bold text-black"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function MiniStat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-3xl bg-white/10 p-4 text-center">
      <p className="text-sm text-gray-300">{title}</p>
      <p className="mt-2 text-2xl font-black text-yellow-400">{value}</p>
    </div>
  );
}