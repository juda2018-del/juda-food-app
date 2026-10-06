import ClientRedirect from "@/components/ClientRedirect";

export default function LiveMapTrackingRedirect() {
  return <ClientRedirect href="/live-orders/" message="جاري التحويل إلى الطلبات المباشرة..." dark />;
}
