"use client";

import { useState } from "react";

export default function FuseVoicePage() {
  const [command, setCommand] = useState("");
  const [response, setResponse] = useState(
    "🎤 أهلاً بك، أنا مساعد فيوز الصوتي."
  );

  function runCommand() {
    const text = command.toLowerCase();

    if (text.includes("أفضل سائق")) {
      setResponse(
        "🏆 أفضل سائق حالياً هو حيدر كريم بتقييم 4.8."
      );
    }

    else if (text.includes("أفضل مطعم")) {
      setResponse(
        "🍽 أفضل مطعم حالياً هو فيروز."
      );
    }

    else if (text.includes("المبيعات")) {
      setResponse(
        "💰 المبيعات المتوقعة اليوم 620 ألف دينار."
      );
    }

    else if (text.includes("الذروة")) {
      setResponse(
        "🔥 أعلى ضغط متوقع الساعة 8 مساءً."
      );
    }

    else {
      setResponse(
        "🤖 لم أفهم الأمر الصوتي."
      );
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-black text-white p-6"
    >
      <div className="max-w-5xl mx-auto">

        <h1 className="text-center text-6xl font-black text-yellow-400">
          🎤 Fuse Voice AI
        </h1>

        <p className="text-center text-gray-300 mt-3">
          المساعد الصوتي الذكي لفيوز
        </p>

        <div className="bg-white rounded-3xl p-8 mt-10">

          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="اكتب الأمر الصوتي..."
            className="w-full rounded-2xl border p-5 text-black text-xl"
          />

          <button
            onClick={runCommand}
            className="w-full bg-black text-white py-5 rounded-2xl mt-5 text-xl font-black"
          >
            تنفيذ الأمر
          </button>

          <div className="bg-gray-100 rounded-3xl p-8 mt-8 text-black">

            <h2 className="text-3xl font-black mb-5">
              رد Fuse Voice
            </h2>

            <p className="text-xl leading-10">
              {response}
            </p>

          </div>

        </div>

      </div>
    </main>
  );
}