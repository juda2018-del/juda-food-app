"use client";

import Link from "next/link";

export default function UberDashboardPage() {
  const systems = [
    {
      title: "🧠 Fuse Brain AI",
      desc: "العقل المركزي والتنبيهات",
      href: "/fuse-brain",
      color: "bg-red-400",
    },
    {
      title: "🤖 Fuse GPT",
      desc: "المساعد الذكي",
      href: "/fuse-gpt",
      color: "bg-green-400",
    },
    {
      title: "🧠 Fuse Copilot",
      desc: "مساعد الإدارة",
      href: "/fuse-copilot",
      color: "bg-yellow-400",
    },
    {
      title: "⚡ Dispatch AI",
      desc: "التوزيع الذكي",
      href: "/dispatch-ai",
      color: "bg-purple-400",
    },
    {
      title: "🚗 Fleet Control",
      desc: "إدارة السائقين",
      href: "/fleet-control",
      color: "bg-blue-400",
    },
    {
      title: "🗺️ Live Map",
      desc: "الخريطة الحية",
      href: "/fuse-map",
      color: "bg-pink-400",
    },
    {
      title: "🎤 Voice AI",
      desc: "المساعد الصوتي",
      href: "/fuse-voice",
      color: "bg-orange-400",
    },
    {
      title: "📊 Analytics",
      desc: "تحليل البيانات",
      href: "/analytics",
      color: "bg-cyan-400",
    },
    {
      title: "⭐ Ratings",
      desc: "إدارة التقييمات",
      href: "/ratings-admin",
      color: "bg-emerald-400",
    },
  ];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-black text-white p-6"
    >
      <div className="max-w-7xl mx-auto">

        <h1 className="text-center text-7xl font-black text-yellow-400">
          🚀 Uber Mission Dashboard
        </h1>

        <p className="text-center text-gray-300 mt-4">
          غرفة العمليات الذكية لفيوز
        </p>

        <div className="grid md:grid-cols-3 gap-8 mt-14">

          {systems.map((system) => (

            <Link
              key={system.href}
              href={system.href}
              className="bg-white rounded-3xl p-8 text-black hover:scale-105 duration-300"
            >

              <div
                className={`${system.color} rounded-3xl p-10 text-center`}
              >

                <h2 className="text-4xl font-black">
                  {system.title}
                </h2>

                <p className="mt-4 text-xl">
                  {system.desc}
                </p>

              </div>

            </Link>

          ))}

        </div>

      </div>
    </main>
  );
}