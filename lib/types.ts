export type Status =
  | "جديد"
  | "قيد التحضير"
  | "جاهز"
  | "قيد التوصيل"
  | "تم التسليم"
  | "مرفوض";

export type Priority = "عادي" | "مهم" | "عاجل";

export type Order = {
  id: string;
  customer: string;
  phone: string;
  driver: string;
  area: string;
  amount: number;
  status: Status;
  priority: Priority;
  time: string;
  items: string[];
  prepMinutes: number;
  payment: "كاش" | "بطاقة" | "محفظة";
};

export type MenuItem = {
  id: number;
  name: string;
  category: string;
  price: number;
  discount: number;
  active: boolean;
  outOfStock: boolean;
  ordersToday: number;
};

export type Customer = {
  id: number;
  name: string;
  area: string;
  orders: number;
  totalSpend: number;
  lastOrder: string;
  favoriteCategory: string;
  satisfaction: number;
  segment: "VIP" | "Frequent" | "Normal" | "At Risk";
  returning: boolean;
};

export type RestaurantAlert = {
  id: number;
  title: string;
  message: string;
  type: "طلب" | "مطبخ" | "منيو" | "سائق" | "جودة" | "مالي";
  level: "منخفض" | "متوسط" | "عالي";
  status: "جديد" | "قيد المعالجة" | "تم الحل";
  time: string;
};

export type Branch = {
  id: number;
  name: string;
  area: string;
  orders: number;
  sales: number;
  rating: number;
  status: "ممتاز" | "جيد" | "يحتاج متابعة";
};

export type Settings = {
  openTime: string;
  closeTime: string;
  minOrder: number;
  deliveryFee: number;
  prepTime: number;
  mode: "مفتوح" | "مشغول" | "مغلق";
};