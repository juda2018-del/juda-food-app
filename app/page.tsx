import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black p-6 flex flex-col items-center justify-center gap-6">

      <h1 className="text-5xl font-extrabold text-yellow-400 mb-4">
        جودة فود
      </h1>

      <p className="text-white mb-6">
        اختر المطعم
      </p>

      <Link
        href="/fayrouz"
        className="w-full max-w-md bg-orange-600 rounded-3xl overflow-hidden"
      >
        <img src="/images/fayrouz.jpg" className="w-full h-52 object-cover" />
        <div className="p-4 text-center text-white text-3xl font-bold">
         فيروز
        </div>
      </Link>

      <Link
        href="/ahram"
        className="w-full max-w-md bg-yellow-500 rounded-3xl overflow-hidden"
      >
        <img src="/images/ahram.jpg" className="w-full h-52 object-cover" />
        <div className="p-4 text-center text-black text-3xl font-bold">
          شلتتة
        </div>
      </Link>

      <Link
        href="/khan"
        className="w-full max-w-md bg-red-700 rounded-3xl overflow-hidden"
      >
        <img src="/images/khan.jpg" className="w-full h-52 object-cover" />
        <div className="p-4 text-center text-white text-3xl font-bold">
          خان قدوري
        </div>
      </Link>

    </main>
  );
}