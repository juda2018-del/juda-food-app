"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";

type Message = {
  id: string;
  roomId?: string;
  sender?: string;
  senderRole?: string;
  text?: string;
  createdAt?: number;
};

const rooms = [
  {
    id: "customer-driver",
    title: "الزبون ↔ السائق",
    desc: "محادثة متابعة التوصيل",
    icon: "👤🛵",
  },
  {
    id: "driver-restaurant",
    title: "السائق ↔ المطعم",
    desc: "استلام الطلب وتجهيزه",
    icon: "🛵🍽️",
  },
  {
    id: "admin-driver",
    title: "الإدارة ↔ السائق",
    desc: "تنبيهات وتشغيل الأسطول",
    icon: "👑🚗",
  },
];

function formatTime(value?: number) {
  if (!value) return "";

  const date = new Date(value);

  if (isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("ar-IQ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomId, setRoomId] = useState("customer-driver");
  const [sender, setSender] = useState("الإدارة");
  const [senderRole, setSenderRole] = useState("مدير");
  const [text, setText] = useState("");

  useEffect(() => {
    const q = query(collection(db, "chatMessages"), orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Message[];

      setMessages(data);
    });

    return () => unsub();
  }, []);

  const roomMessages = useMemo(() => {
    return messages.filter((message) => message.roomId === roomId);
  }, [messages, roomId]);

  async function sendMessage() {
    const cleanText = text.trim();

    if (!cleanText) return;

    await addDoc(collection(db, "chatMessages"), {
      roomId,
      sender: sender || "مستخدم",
      senderRole: senderRole || "غير محدد",
      text: cleanText,
      createdAt: Date.now(),
      seen: false,
    });

    setText("");
  }

  return (
    <main dir="rtl" className="min-h-screen bg-black px-4 py-6 text-white">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-center text-5xl font-black text-yellow-400">
          💬 محادثات فيوز
        </h1>

        <p className="mt-2 text-center text-gray-300">
          شات مباشر بين الزبون والسائق والمطعم والإدارة
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-[320px_1fr]">
          <div className="rounded-3xl bg-white p-5 text-black">
            <h2 className="mb-4 text-2xl font-black">الغرف</h2>

            <div className="flex flex-col gap-3">
              {rooms.map((room) => {
                const active = roomId === room.id;

                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setRoomId(room.id)}
                    className={`rounded-2xl p-4 text-right ${
                      active ? "bg-yellow-400" : "bg-gray-100"
                    }`}
                  >
                    <h3 className="text-xl font-black">
                      {room.icon} {room.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">{room.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl bg-gray-100 p-4">
              <label className="mb-2 block text-sm font-bold">اسم المرسل</label>
              <input
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full rounded-xl border p-3 outline-none"
              />

              <label className="mb-2 mt-4 block text-sm font-bold">
                نوع الحساب
              </label>
              <select
                value={senderRole}
                onChange={(e) => setSenderRole(e.target.value)}
                className="w-full rounded-xl border p-3 outline-none"
              >
                <option>مدير</option>
                <option>مطعم</option>
                <option>سائق</option>
                <option>زبون</option>
              </select>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 text-black">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">
                {rooms.find((room) => room.id === roomId)?.title}
              </h2>

              <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
                🟢 مباشر
              </span>
            </div>

            <div className="flex h-[520px] flex-col gap-3 overflow-y-auto rounded-3xl bg-gray-100 p-4">
              {roomMessages.length === 0 ? (
                <div className="m-auto text-center text-gray-500">
                  لا توجد رسائل بعد
                </div>
              ) : (
                roomMessages.map((message) => {
                  const isMine = message.sender === sender;

                  return (
                    <div
                      key={message.id}
                      className={`max-w-[80%] rounded-3xl p-4 ${
                        isMine
                          ? "mr-auto bg-yellow-400 text-black"
                          : "ml-auto bg-white text-black"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold text-gray-600">
                        <span>
                          {message.sender || "مستخدم"} ·{" "}
                          {message.senderRole || "غير محدد"}
                        </span>
                        <span>{formatTime(message.createdAt)}</span>
                      </div>

                      <p className="text-lg leading-8">{message.text}</p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="اكتب رسالة..."
                className="rounded-2xl border border-gray-300 p-4 text-lg outline-none focus:border-black"
              />

              <button
                onClick={sendMessage}
                className="rounded-2xl bg-black px-8 py-4 text-lg font-black text-white"
              >
                إرسال
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}