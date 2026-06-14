"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Restaurant = {
  name: string;
  desc: string;
  href: string;
  image: string;
  button: string;
  lat: number;
  lng: number;
};

type RestaurantWithDistance = Restaurant & {
  distance: number | null;
  isAvailable: boolean;
};

const restaurants: Restaurant[] = [
  {
    name: "فيروز",
    desc: "كاهي، قيمر، بورك وفطور عراقي",
    href: "/fayrouz",
    image: "/images/fayrouz.jpg",
    button: "اطلب من فيروز",
    lat: 33.2965,
    lng: 44.4445,
  },
  {
    name: "شلتتة",
    desc: "مشلتت وفطير مصري حار وحلو",
    href: "/ahram",
    image: "/images/ahram.jpg",
    button: "اطلب من شلتتة",
    lat: 33.2968,
    lng: 44.445,
  },
  {
    name: "خان قدوري",
    desc: "أكلات عراقية بطعم أصيل",
    href: "/khan",
    image: "/images/khan.jpg",
    button: "اطلب من خان قدوري",
    lat: 33.3152,
    lng: 44.3661,
  },
];

const DELIVERY_RADIUS_KM = 7;

function getDistanceKm(
  userLat: number,
  userLng: number,
  restaurantLat: number,
  restaurantLng: number
) {
  const R = 6371;
  const dLat = ((restaurantLat - userLat) * Math.PI) / 180;
  const dLng = ((restaurantLng - userLng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((restaurantLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default function Home() {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("جهازك لا يدعم تحديد الموقع");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setLocationError("فعّل الموقع حتى نعرض المطاعم القريبة منك");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const restaurantsWithDistance: RestaurantWithDistance[] = useMemo(() => {
    if (!userLocation) {
      return restaurants.map((restaurant) => ({
        ...restaurant,
        distance: null,
        isAvailable: true,
      }));
    }

    return restaurants
      .map((restaurant) => {
        const distance = getDistanceKm(
          userLocation.lat,
          userLocation.lng,
          restaurant.lat,
          restaurant.lng
        );

        return {
          ...restaurant,
          distance,
          isAvailable: distance <= DELIVERY_RADIUS_KM,
        };
      })
      .sort((a, b) => {
        const distanceA = a.distance ?? 999;
        const distanceB = b.distance ?? 999;
        return distanceA - distanceB;
      });
  }, [userLocation]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-950 via-black to-black px-5 py-8 text-white">
      <section className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <img
              src="/images/fuse-logo.png"
              alt="FUSE Logo"
              className="h-40 w-40 object-contain"
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
          <p className="text-sm text-gray-200">توصيل سريع داخل بغداد</p>

          <p className="mt-1 text-2xl font-bold text-yellow-400">
            المطاعم القريبة منك
          </p>

          <p className="mt-2 text-sm text-gray-300">
            نطاق التوصيل الحالي: {DELIVERY_RADIUS_KM} كم
          </p>

          {locationError && (
            <p className="mt-3 rounded-2xl bg-red-500/20 p-3 text-sm text-red-200">
              {locationError}
            </p>
          )}

          {!userLocation && !locationError && (
            <p className="mt-3 rounded-2xl bg-yellow-400/20 p-3 text-sm text-yellow-100">
              جاري تحديد موقعك...
            </p>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {restaurantsWithDistance.map((restaurant) => {
            const isDisabled =
              userLocation !== null && restaurant.isAvailable === false;

            return (
              <div
                key={restaurant.name}
                className={`overflow-hidden rounded-[2rem] bg-white text-black shadow-2xl ${
                  isDisabled ? "opacity-60" : ""
                }`}
              >
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="h-52 w-full object-cover"
                />

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-3xl font-black">{restaurant.name}</h2>

                    {restaurant.distance !== null && (
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-900">
                        {restaurant.distance.toFixed(1)} كم
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-base text-gray-600">
                    {restaurant.desc}
                  </p>

                  {isDisabled ? (
                    <div className="mt-4 rounded-2xl bg-gray-300 py-3 text-center text-lg font-black text-gray-700">
                      خارج نطاق التوصيل
                    </div>
                  ) : (
                    <Link
                      href={restaurant.href}
                      className="mt-4 block rounded-2xl bg-yellow-400 py-3 text-center text-lg font-black text-black transition active:scale-95"
                    >
                      {restaurant.button}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}