 export type OrderItem = {
  name: string;
  price: number;
  qty: number;
};

export type Order = {
  docId: string;
  customerName?: string;
  phone?: string;
  address?: string;
  restaurant?: string;
  total?: number;
  status?: string;
  driverName?: string;
  driverPhone?: string;
  createdAt?: any;
  items?: OrderItem[];
};

export type Driver = {
  id: string;
  name?: string;
  phone?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  lastSeen?: number;
};

export const ORDER_COLUMNS = [
  "جديد",
  "قيد التحضير",
  "جاهز للتوصيل",
  "قيد التوصيل",
  "تم التسليم",
  "مرفوض",
];

export const colors = {
  bg: "#060504",
  card: "#11100e",
  card2: "#17130f",
  line: "rgba(255,255,255,0.10)",
  muted: "#a1a1aa",
  orange: "#ff7a00",
  orange2: "#ffb347",
  green: "#22c55e",
  red: "#ef4444",
};