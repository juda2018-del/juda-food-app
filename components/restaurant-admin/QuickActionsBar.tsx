"use client";

export function QuickActionsBar({
  restaurantOpen,
  setRestaurantOpen,
}: {
  restaurantOpen: boolean;
  setRestaurantOpen: (v: boolean) => void;
}) {
  return (
    <div className="sticky top-0 z-30 rounded-3xl border border-white/10 bg-[#050505]/95 p-5 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black md:text-3xl">
            لوحة مطعم FUSE الاحترافية
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Talabat Vendor UI Pro — Orders Board / KPI / Revenue / AI
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRestaurantOpen(!restaurantOpen)}
            className={`rounded-2xl px-4 py-3 text-sm font-bold ${
              restaurantOpen ? "bg-green-500 text-black" : "bg-red-500 text-white"
            }`}
          >
            {restaurantOpen ? "المطعم مفتوح" : "المطعم مغلق"}
          </button>

          <button className="rounded-2xl bg-[#FF7A00] px-4 py-3 text-sm font-bold text-black">
            إضافة عرض
          </button>

          <button className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold">
            تحديث المنيو
          </button>
        </div>
      </div>
    </div>
  );
}

