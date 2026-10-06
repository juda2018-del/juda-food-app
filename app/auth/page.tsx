import ClientRedirect from "@/components/ClientRedirect";

/** Legacy /auth role self-select removed — force customer login path. */
export default function AuthLegacyRedirect() {
  return <ClientRedirect href="/login/" message="جاري التحويل إلى صفحة تسجيل الدخول..." />;
}
