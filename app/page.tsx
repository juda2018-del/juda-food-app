 import Link from "next/link";

const restaurants = [
  {
    name: "فيروز",
    desc: "كاهي، قيمر، بورك وفطور عراقي",
    href: "/fayrouz",
    image: "/images/fayrouz.jpg",
    button: "اطلب من فيروز",
  },
  {
    name: "شلتتة",
    desc: "مشلتت وفطير مصري حار وحلو",
    href: "/ahram",
    image: "/images/ahram.jpg",
    button: "اطلب من شلتتة",
  },
  {
    name: "خان قدوري",
    desc: "أكلات عراقية بطعم أصيل",
    href: "/khan",
    image: "/images/khan.jpg",
    button: "اطلب من خان قدوري",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-950 via-black to-black px-5 py-8 text-white">
      <section className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/images/fuse-logo.png"
              alt="FUSE Logo"
              className="w-40 h-40 object-contain"
            />
          </div>

          <h1 className="text-5xl font-black tracking-widest text-yellow-400">
            FUSE
          </h1>

          <p className="mt-3 text-lg text-gray-200">
            اختار مطعمك واطلب خلال دقيقة
          </p>
        </div>

        <div className="rounded-3xl bg-white/10 p-4 text-center shadow-xl">
          <p className="text-sm text-gray-200">
            توصيل سريع داخل بغداد
          </p>

          <p className="mt-1 text-2xl font-bold text-yellow-400">
            منيو المطاعم
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {restaurants.map((restaurant) => (
            <Link
              key={restaurant.name}
              href={restaurant.href}
              className="overflow-hidden rounded-[2rem] bg-white text-black shadow-2xl transition active:scale-95"
            >
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="h-52 w-full object-cover"
              />

              <div className="p-5">
                <h2 className="text-3xl font-black">
                  {restaurant.name}
                </h2>

                <p className="mt-2 text-base text-gray-600">
                  {restaurant.desc}
                </p>

                <div className="mt-4 rounded-2xl bg-yellow-400 py-3 text-center text-lg font-black text-black">
                  {restaurant.button}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}