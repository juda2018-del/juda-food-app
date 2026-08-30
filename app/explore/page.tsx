"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CustomerHeader from "@/components/customer/CustomerHeader";
import CustomerPageShell from "@/components/customer/CustomerPageShell";
import FuseIcon from "@/components/FuseIcon";

const restaurants = [
  {
    name: "فيروز",
    desc: "فطور عراقي، كاهي، قيمر وبورك",
    href: "/restaurants/fayrouz",
    image: "/images/fayrouz.jpg",
    rating: 4.8,
    time: "25-35 د",
    category: "فطور",
    delivery: "1,500 د.ع",
  },
  {
    name: "شلتتة",
    desc: "مشلتت، فطائر، بيتزا وقلبض رول",
    href: "/restaurants/shalteta",
    image: "/images/ahram.jpg",
    rating: 4.7,
    time: "30-40 د",
    category: "فطائر",
    delivery: "2,000 د.ع",
  },
  {
    name: "خان قدوري",
    desc: "أكلات عراقية وفطور أصيل",
    href: "/restaurants/khan",
    image: "/images/khan.jpg",
    rating: 4.6,
    time: "35-45 د",
    category: "عراقي",
    delivery: "2,000 د.ع",
  },
];

const filters = ["الكل", "فطور", "فطائر", "عراقي", "الأعلى تقييماً"];

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("الكل");

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((item) => {
      const bySearch =
        item.name.includes(search) ||
        item.desc.includes(search) ||
        item.category.includes(search);

      const byFilter =
        filter === "الكل" ||
        item.category === filter ||
        (filter === "الأعلى تقييماً" && item.rating >= 4.7);

      return bySearch && byFilter;
    });
  }, [search, filter]);

  return (
    <CustomerPageShell className="explore-page">
      <CustomerHeader title="استكشف" subtitle="مطاعم قريبة واختيارات مميزة" backHref="/" backLabel="الرئيسية" />

      <section className="explore-search form-card">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن مطعم أو نوع أكل..."
        />
      </section>

      <section className="explore-filters">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={filter === item ? "is-active" : undefined}
          >
            {item}
          </button>
        ))}
      </section>

      <section className="hero">
        <h2>اكتشف أفضل المطاعم</h2>
        <p>جمعنالك المطاعم الأقرب والأكثر طلباً حتى تختار بسرعة وتطلب بثواني.</p>
      </section>

      <section className="explore-list">
        {filteredRestaurants.length === 0 ? (
          <div className="fuse-state-card">ماكو نتائج بهذا البحث</div>
        ) : (
          filteredRestaurants.map((item) => (
            <Link href={item.href} className="explore-card" key={item.name}>
              <div className="explore-card__image">
                <img src={item.image} alt={item.name} />
                <span className="explore-card__badge">{item.category}</span>
              </div>
              <div className="explore-card__body">
                <h3>{item.name}</h3>
                <p>{item.desc}</p>
                <div className="explore-card__meta">
                  <span><FuseIcon name="star" size="sm" /> {item.rating}</span>
                  <span><FuseIcon name="clock" size="sm" /> {item.time}</span>
                  <span>توصيل {item.delivery}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </section>
    </CustomerPageShell>
  );
}
