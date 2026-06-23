"use client";

import Link from "next/link";

export default function FuseOSPage() {
  const systems = [
    {
      title: "🗼 Control Tower",
      desc: "أعلى مركز تحكم ومراقبة",
      href: "/control-tower",
      color: "bg-yellow-600",
    },
    {
      title: "👑 CEO Command Center",
      desc: "مركز القيادة النهائي",
      href: "/ceo-command-center",
      color: "bg-yellow-500",
    },
    {
      title: "🧠 AI Engine",
      desc: "عقل فيوز التشغيلي",
      href: "/ai-engine",
      color: "bg-purple-600",
    },
    {
      title: "🖥️ System Monitor",
      desc: "مراقبة صحة النظام",
      href: "/system-monitor",
      color: "bg-lime-500",
    },
    {
      title: "🌍 Smart City Map",
      desc: "الخريطة الذكية للمدينة",
      href: "/smart-city-map",
      color: "bg-green-600",
    },
    {
      title: "🛵 Dispatch AI",
      desc: "التوزيع الذكي للطلبات",
      href: "/dispatch-ai",
      color: "bg-indigo-500",
    },
    {
      title: "🧠 Fuse Brain",
      desc: "العقل المركزي لفيوز",
      href: "/fuse-brain",
      color: "bg-red-500",
    },
    {
      title: "🤖 Fuse GPT",
      desc: "المساعد الذكي",
      href: "/fuse-gpt",
      color: "bg-purple-500",
    },
    {
      title: "🧠 Fuse Copilot",
      desc: "مساعد الإدارة التنفيذي",
      href: "/fuse-copilot",
      color: "bg-cyan-500",
    },
    {
      title: "🔔 Notification Center",
      desc: "الإشعارات والتنبيهات",
      href: "/notification-center",
      color: "bg-rose-500",
    },
    {
      title: "📈 Analytics Center",
      desc: "التحليلات والإحصائيات",
      href: "/analytics",
      color: "bg-green-500",
    },
    {
      title: "💰 Revenue Center",
      desc: "الإيرادات والأرباح",
      href: "/revenue-center",
      color: "bg-emerald-500",
    },
    {
      title: "🚗 Fleet Intelligence",
      desc: "ذكاء السائقين والأسطول",
      href: "/fleet-intelligence",
      color: "bg-blue-500",
    },
    {
      title: "🍽️ Restaurant Intelligence",
      desc: "ذكاء المطاعم",
      href: "/restaurant-intelligence",
      color: "bg-orange-500",
    },
    {
      title: "👥 Customer Intelligence",
      desc: "ذكاء الزبائن والولاء",
      href: "/customer-intelligence",
      color: "bg-pink-500",
    },
    {
      title: "📍 Live Tracking",
      desc: "تتبع السائقين المباشر",
      href: "/live-map-tracking",
      color: "bg-teal-500",
    },
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-black text-yellow-400">
            ⚡ Fuse OS
          </h1>

          <p className="mt-4 text-slate-400 text-lg">
            نظام تشغيل فيوز الكامل لإدارة التوصيل والذكاء الاصطناعي
          </p>
        </div>

        <div className="mt-10 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-3xl font-black text-yellow-400">
            👑 مركز النظام
          </h2>

          <p className="mt-3 text-slate-300 leading-8">
            من هنا تدخل لكل أنظمة فيوز: الإدارة، التحليلات، السائقين،
            المطاعم، الزبائن، التوزيع الذكي، التتبع، والتنبيهات.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-6">
          {systems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-slate-900 border border-slate-800 hover:border-yellow-400 rounded-3xl p-5 shadow-2xl hover:scale-105 duration-300"
            >
              <div className={`${item.color} rounded-3xl p-8 text-center`}>
                <h2 className="text-2xl font-black">
                  {item.title}
                </h2>

                <p className="mt-4 text-lg">
                  {item.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}