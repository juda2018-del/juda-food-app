import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/firebase";
import type { FuseOrderStatus } from "@/lib/fuse-order-status";

const STATUS_MESSAGES: Record<FuseOrderStatus, { title: string; message: string }> = {
  "جديد": { title: "تم استلام طلبك", message: "تم استلام طلبك بنجاح وسيبدأ المطعم بمعالجته." },
  "قيد التحضير": { title: "طلبك قيد التحضير", message: "المطعم بدأ بتحضير طلبك الآن." },
  "جاهز للتوصيل": { title: "طلبك جاهز", message: "طلبك أصبح جاهزاً وسيتم تسليمه للسائق." },
  "السائق استلم الطلب": { title: "السائق استلم طلبك", message: "السائق استلم طلبك وسيبدأ التوصيل قريباً." },
  "قيد التوصيل": { title: "طلبك بالطريق", message: "طلبك الآن قيد التوصيل إليك." },
  "تم التسليم": { title: "تم تسليم طلبك", message: "تم تأكيد تسليم طلبك. بالعافية!" },
  "مرفوض": { title: "تم رفض الطلب", message: "عذراً، المطعم رفض طلبك." },
  "ملغي": { title: "تم إلغاء الطلب", message: "تم إلغاء طلبك." },
};

export async function notifyOrderStatusChange(input: {
  customerUid?: string | null;
  orderDocumentId: string;
  orderId: string;
  status: FuseOrderStatus;
}) {
  if (!input.customerUid) return;
  const copy = STATUS_MESSAGES[input.status];
  if (!copy) return;
  await addDoc(collection(db, "notifications"), {
    type: "order_status",
    audience: "customer",
    title: copy.title,
    message: copy.message,
    customerUid: input.customerUid,
    orderDocumentId: input.orderDocumentId,
    orderId: input.orderId,
    status: input.status,
    read: false,
    createdAt: serverTimestamp(),
  });
}
