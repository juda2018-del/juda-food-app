"use client";

import Link from "next/link";

export default function FuseUniversePage() {
  const systems = [
    {
      title: "⚡ Fuse OS",
      desc: "نظام تشغيل فيوز الكامل",
      href: "/fuse-os",
      color: "bg-yellow-500",
    },
    {
      title: "🤖 Autonomous AI",
      desc: "الإدارة الذاتية والقرارات التلقائية",
      href: "/autonomous-ai",
      color: "bg-purple-600",
    },
    {
      title: "🗼 Control Tower",
      desc: "أعلى مركز تحكم ومراقبة",
      href: "/control-tower",
      color: "bg-yellow-600",
    },
    {
      title: "🔥 Operations Center",
      desc: "مركز العمليات المباشر",
      href: "/operations-center",
      color: "bg-red-500",
    },
    {
      title: "🧠 AI Engine",
      desc: "عقل فيوز التشغيلي",
      href: "/ai-engine",
      color: "bg-indigo-600",
    },
    {
      title: "👑 CEO Command Center",
      desc: "مركز القيادة النهائي",
      href: "/ceo-command-center",
      color: "bg-amber-500",
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
      color: "bg-blue-600",
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
      title: "🧠 Fuse Brain",
      desc: "العقل المركزي لفيوز",
      href: "/fuse-brain",
      color: "bg-red-600",
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
      title: "📍 Live Tracking",
      desc: "تتبع السائقين المباشر",
      href: "/live-map-tracking",
      color: "bg-teal-500",
    },
    {
      title: "📦 Live Orders",
      desc: "الطلبات الحية",
      href: "/live-orders",
      color: "bg-amber-600",
    },
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-black text-yellow-400">
            🌌 Fuse Universe
          </h1>

          <p className="mt-4 text-slate-400 text-lg">
            النظام الأعلى لإدارة وتشغيل منصة فيوز بالكامل
          </p>
        </div>

        <div className="mt-10 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-3xl font-black text-yellow-400">
            👑 مركز الكون التشغيلي
          </h2>

          <p className="mt-3 text-slate-300 leading-8">
            من هنا تدخل لكل أنظمة فيوز: الذكاء الاصطناعي، العمليات،
            السائقين، المطاعم، الزبائن، الإيرادات، التتبع، والتنبيهات.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-6">
          {systems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-slate-900 border border-slate-800 hover:border-yellow-400 rounded-3xl p-5 shadow-2xl hover:scale-105 duration-300"
            >
              <div className={`${item.color} rounded-3xl p-7 text-center`}>
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