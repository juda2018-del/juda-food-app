/** Map technical/Firebase errors to short Arabic copy for customers. */
export function fuseUserFacingError(error: unknown, fallback = "تعذر إكمال العملية. حاول مرة ثانية.") {
  if (error && typeof error === "object") {
    const code = String((error as { code?: string }).code || "").toLowerCase();
    const message = String((error as { message?: string }).message || "");

    if (code.includes("permission-denied") || message.toLowerCase().includes("permission")) {
      return "ليس لديك صلاحية لهذا الإجراء.";
    }
    if (code.includes("unavailable") || code.includes("network") || message.toLowerCase().includes("network")) {
      return "تعذر الاتصال. تأكد من الإنترنت وحاول مرة ثانية.";
    }
    if (code.includes("not-found")) {
      return "البيانات المطلوبة غير متاحة حالياً.";
    }
    if (code.includes("deadline") || code.includes("timeout")) {
      return "انتهت مهلة الاتصال. حاول مرة ثانية.";
    }
    if (code.includes("unauthenticated") || code.includes("auth/")) {
      return "يلزم تسجيل الدخول أولاً.";
    }

    // Never surface raw SDK / internal jargon to customers.
    const lower = message.toLowerCase();
    if (
      lower.includes("firestore") ||
      lower.includes("firebase") ||
      lower.includes("cloud firestore") ||
      lower.includes("missing or insufficient permissions") ||
      /^(firebase|firestore)_/i.test(message)
    ) {
      return fallback;
    }

    if (message && message.length <= 160 && !/[A-Za-z]{12,}/.test(message)) {
      return message;
    }
  }

  if (typeof error === "string" && error.length <= 160) {
    const lower = error.toLowerCase();
    if (lower.includes("firestore") || lower.includes("firebase")) return fallback;
    return error;
  }

  return fallback;
}
