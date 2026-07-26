import { redirect } from "next/navigation";

export default function OrdersPage({
  searchParams,
}: {
  searchParams?: { phone?: string; orderId?: string; order?: string };
}) {
  const phone = searchParams?.phone?.trim();
  const orderId = (searchParams?.orderId || searchParams?.order)?.trim();
  const params = new URLSearchParams();

  if (phone) params.set("phone", phone);
  if (orderId) params.set("orderId", orderId);

  const query = params.toString();
  redirect(query ? `/order-status?${query}` : "/order-status");
}
