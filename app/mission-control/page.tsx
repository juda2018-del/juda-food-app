"use client";

export default function MissionControlPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-black text-white p-6">

      <div className="max-w-7xl mx-auto">

        <h1 className="text-center text-6xl font-black text-yellow-400">
          🚀 Mission Control
        </h1>

        <p className="text-center text-gray-300 mt-3 mb-10">
          غرفة القيادة الذكية لفيوز
        </p>

        <div className="grid md:grid-cols-3 gap-6">

          <div className="bg-white rounded-3xl p-6 text-black">
            <h2 className="text-3xl font-black mb-6">
              🧠 Customer AI
            </h2>

            <div className="bg-green-400 rounded-3xl p-8 text-center">
              <h3 className="text-5xl font-black">
                92%
              </h3>

              <p className="mt-3">
                رضا العملاء
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 text-black">
            <h2 className="text-3xl font-black mb-6">
              🚗 Driver AI
            </h2>

            <div className="bg-yellow-300 rounded-3xl p-8 text-center">
              <h3 className="text-5xl font-black">
                14
              </h3>

              <p className="mt-3">
                سائق متاح الآن
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 text-black">
            <h2 className="text-3xl font-black mb-6">
              🍽 Restaurant AI
            </h2>

            <div className="bg-blue-400 rounded-3xl p-8 text-center">
              <h3 className="text-5xl font-black">
                8
              </h3>

              <p className="mt-3">
                مطاعم نشطة
              </p>
            </div>
          </div>

        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">

          <div className="bg-white rounded-3xl p-6 text-black">

            <h2 className="text-3xl font-black mb-6">
              🔥 الأنظمة الذكية
            </h2>

            <div className="space-y-4">

              <div className="bg-gray-100 rounded-2xl p-5">
                🧠 Dispatch AI
              </div>

              <div className="bg-gray-100 rounded-2xl p-5">
                🗺 Fuse Live Map
              </div>

              <div className="bg-gray-100 rounded-2xl p-5">
                🚗 Fleet Control
              </div>

              <div className="bg-gray-100 rounded-2xl p-5">
                📊 Analytics AI
              </div>

            </div>

          </div>

          <div className="bg-white rounded-3xl p-6 text-black">

            <h2 className="text-3xl font-black mb-6">
              🎤 Voice AI Assistant
            </h2>

            <div className="bg-black text-white rounded-3xl p-10 text-center">

              <h3 className="text-4xl font-black">
                Fuse GPT
              </h3>

              <p className="mt-5">
                قريباً
              </p>

              <p className="text-gray-400 mt-3">
                مساعد صوتي يدير الطلبات والسائقين والمطاعم
              </p>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}