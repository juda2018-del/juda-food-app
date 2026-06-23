 "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

type OrderItem = {
  name?: string;
  qty?: number;
  quantity?: number;
};

type Order = {
  id: string;
  customerName?: string;
  phone?: string;
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

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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

function getHour(value: any) {
  const date = toDate(value);
  if (!date) return "غير محدد";
  return `${date.getHours()}:00`;
}

function money(value: number) {
  return value.toLocaleString();
}

export default function FuseAIPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("اسألني عن فيوز: أفضل سائق، أفضل مطعم، ساعة الذروة، المبيعات، أو أكثر وجبة مطلوبة.");

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

  const totalSales = deliveredOrders.reduce(
    (sum, order) => sum + (order.total || 0),
    0
  );

  const topRestaurants = useMemo(() => {
    return topList(
      deliveredOrders.map((order) => ({
        name: order.restaurant || "غير محدد",
        value: order.total || 0,
      }))
    );
  }, [deliveredOrders]);

  const topDrivers = useMemo(() => {
    return topList(
      deliveredOrders.map((order) => ({
        name: order.driverName || "غير محدد",
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

  const driverRatings = ratings
    .map((rating) => Number(rating.driverRating || 0))
    .filter((value) => value > 0);

  const restaurantRatings = ratings
    .map((rating) => Number(rating.restaurantRating || 0))
    .filter((value) => value > 0);

  const appRating = average([...driverRatings, ...restaurantRatings]);

  const bestDriver = topDrivers[0];
  const bestRestaurant = topRestaurants[0];
  const bestMeal = topMeals[0];
  const rushHour = rushHours[0];

  const expectedToday = Math.round(totalSales / Math.max(deliveredOrders.length, 1)) * Math.max(activeOrders.length + deliveredOrders.length, 1);

  const weakRatings = ratings.filter(
    (rating) =>
      Number(rating.driverRating || 0) <= 2 ||
      Number(rating.restaurantRating || 0) <= 2
  );

  function askAI() {
    const q = question.trim();

    if (!q) {
      setAnswer("اكتب سؤال حتى أجاوبك من بيانات فيوز.");
      return;
    }

    if (q.includes("سائق") || q.includes("درايفر")) {
      setAnswer(
        bestDriver
          ? `🚗 أفضل سائق حالياً هو ${bestDriver.name}.\n📦 عدد الطلبات المسلّمة: ${bestDriver.value} طلب.\n🧠 نصيحتي: خلي هذا السائق أولوية وقت الزخم.`
          : "ماكو بيانات كافية حتى أحدد أفضل سائق بعد."
      );
      return;
    }

    if (q.includes("مطعم")) {
      setAnswer(
        bestRestaurant
          ? `🍽️ أفضل مطعم حالياً هو ${bestRestaurant.name}.\n💰 المبيعات: ${money(bestRestaurant.value)} د.ع.\n🧠 نصيحتي: ركّز عليه بالإعلانات والعروض.`
          : "ماكو بيانات كافية حتى أحدد أفضل مطعم بعد."
      );
      return;
    }

    if (q.includes("وجبة") || q.includes("اكل") || q.includes("أكلة")) {
      setAnswer(
        bestMeal
          ? `🥇 أكثر وجبة مطلوبة هي ${bestMeal.name}.\n📦 عدد الطلبات: ${bestMeal.value} مرة.\n🧠 نصيحتي: خلّيها بالواجهة الرئيسية والعروض.`
          : "ماكو بيانات كافية عن الوجبات بعد."
      );
      return;
    }

    if (q.includes("ذروة") || q.includes("زخم") || q.includes("ضغط")) {
      setAnswer(
        rushHour
          ? `🔥 ساعة الذروة الحالية هي ${rushHour.name}.\n📦 عدد الطلبات بهذا الوقت: ${rushHour.value}.\n🧠 نصيحتي: جهّز سائقين أكثر قبل هذا الوقت بنصف ساعة.`
          : "ماكو بيانات كافية حتى أحدد ساعة الذروة بعد."
      );
      return;
    }

    if (q.includes("مبيعات") || q.includes("ارباح") || q.includes("أرباح")) {
      setAnswer(
        `📈 إجمالي المبيعات المسلّمة: ${money(totalSales)} د.ع.\n📦 الطلبات المسلّمة: ${deliveredOrders.length}.\n🚚 الطلبات الحالية: ${activeOrders.length}.\n🧠 التوقع التقريبي اليوم: ${money(expectedToday)} د.ع.`
      );
      return;
    }

    if (q.includes("تقييم") || q.includes("نجوم")) {
      setAnswer(
        `⭐ متوسط تقييم التطبيق: ${appRating.toFixed(1)}.\n💬 عدد التقييمات: ${ratings.length}.\n⚠️ التقييمات الضعيفة: ${weakRatings.length}.\n🧠 راقب أي تقييم أقل من 3 نجوم واتصل بالزبون لمعرفة السبب.`
      );
      return;
    }

    if (q.includes("احتاج") || q.includes("سائقين") || q.includes("اضيف")) {
      setAnswer(
        activeOrders.length > 5
          ? `🚨 نعم، تحتاج سائقين إضافيين حالياً.\nالطلبات الحالية: ${activeOrders.length}.\n🧠 نصيحتي: فعّل سائقين إضافيين فوراً.`
          : `✅ الوضع مسيطر حالياً.\nالطلبات الحالية: ${activeOrders.length}.\n🧠 لا تحتاج إضافة سائقين إلا وقت الذروة.`
      );
      return;
    }

    setAnswer(
      `🤖 فهمت سؤالك، وهذا ملخص ذكي من بيانات فيوز:\n\n📦 الطلبات الحالية: ${activeOrders.length}\n✅ الطلبات المسلّمة: ${deliveredOrders.length}\n💰 المبيعات: ${money(totalSales)} د.ع\n⭐ التقييم: ${appRating.toFixed(1)}\n🔥 ساعة الذروة: ${rushHour?.name || "غير محددة"}`
    );
  }

  const suggestions = [
    activeOrders.length > 5
      ? "🚨 الطلبات الحالية مرتفعة، يفضل تشغيل سائقين إضافيين الآن."
      : "✅ الطلبات الحالية تحت السيطرة.",
    bestRestaurant
      ? `🍽️ ${bestRestaurant.name} هو أفضل مطعم بالمبيعات.`
      : "🍽️ لا توجد بيانات كافية للمطاعم بعد.",
    bestDriver
      ? `🚗 ${bestDriver.name} هو أفضل سائق حسب عدد الطلبات.`
      : "🚗 لا توجد بيانات كافية للسائقين بعد.",
    rushHour
      ? `🔥 أكثر ساعة ضغط هي ${rushHour.name}.`
      : "🔥 لم يتم تحديد ساعة الذروة بعد.",
    weakRatings.length > 0
      ? `⚠️ يوجد ${weakRatings.length} تقييم ضعيف يحتاج متابعة.`
      : "⭐ لا توجد مشاكل واضحة بالتقييمات.",
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-black px-4 py-6 text-white">
      <section className="mx-auto max-w-7xl">
        <h1 className="text-center text-5xl font-black text-yellow-400">
          Fuse AI 🤖
        </h1>

        <p className="mt-2 text-center text-gray-300">
          مساعد ذكي يقرأ بيانات فيوز ويعطيك قرارات فورية
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <AiCard
            title="🚗 أفضل سائق"
            main={bestDriver?.name || "لا يوجد بعد"}
            sub={bestDriver ? `${bestDriver.value} طلب` : "بانتظار بيانات"}
            color="bg-yellow-400"
          />

          <AiCard
            title="🍽️ أفضل مطعم"
            main={bestRestaurant?.name || "لا يوجد بعد"}
            sub={bestRestaurant ? `${money(bestRestaurant.value)} د.ع` : "بانتظار بيانات"}
            color="bg-green-400"
          />

          <AiCard
            title="🔥 ساعة الذروة"
            main={rushHour?.name || "غير محددة"}
            sub={rushHour ? `${rushHour.value} طلب` : "بانتظار بيانات"}
            color="bg-red-400"
          />

          <AiCard
            title="📈 توقع المبيعات"
            main={`${money(expectedToday)} د.ع`}
            sub="توقع تقريبي حسب البيانات"
            color="bg-blue-400"
          />
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 text-black">
          <h2 className="text-center text-3xl font-black">
            🧠 Fuse AI Copilot
          </h2>

          <p className="mt-2 text-center text-gray-500">
            اسأل النظام عن السائقين، المطاعم، المبيعات، التقييمات، أو ساعة الذروة
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") askAI();
              }}
              placeholder="مثال: من أفضل سائق؟"
              className="rounded-2xl border border-gray-300 p-4 outline-none focus:border-black"
            />

            <button
              onClick={askAI}
              className="rounded-2xl bg-black px-8 py-4 font-black text-white"
            >
              اسأل Fuse AI
            </button>
          </div>

          <div className="mt-5 whitespace-pre-line rounded-2xl bg-gray-100 p-5 text-lg font-bold leading-9">
            {answer}
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 text-black">
          <h2 className="text-center text-3xl font-black">
            🤖 اقتراحات الذكاء الاصطناعي
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {suggestions.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl bg-yellow-100 p-5 text-lg font-bold"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function AiCard({
  title,
  main,
  sub,
  color,
}: {
  title: string;
  main: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 text-black">
      <h2 className="text-xl font-black">{title}</h2>

      <div className={`mt-4 rounded-2xl ${color} p-5 text-center`}>
        <h3 className="text-3xl font-black">{main}</h3>
        <p className="mt-2 font-bold">{sub}</p>
      </div>
    </div>
  );
}