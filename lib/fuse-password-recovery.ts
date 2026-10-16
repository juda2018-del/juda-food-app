/** Password recovery copy. Account existence is never confirmed. */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RECOVERY_SENT_MESSAGE =
  "إذا كان هناك حساب مرتبط بهذا البريد، ستصلك رسالة لإعادة تعيين كلمة المرور. راجع الوارد والبريد غير الهام.";

export type RecoveryOutcomeKind = "sent" | "invalid-email" | "rate-limited" | "failed";

export type RecoveryOutcome = {
  kind: RecoveryOutcomeKind;
  message: string;
};

export function normalizeRecoveryEmail(value: string) {
  return value.trim().toLowerCase();
}

/** Client-side format check. A valid format is not proof that an account exists. */
export function recoveryEmailError(value: string): string | null {
  const email = normalizeRecoveryEmail(value);
  if (!email) return "اكتب البريد الإلكتروني.";
  if (email.length > 120 || !EMAIL_PATTERN.test(email)) return "البريد الإلكتروني غير صحيح.";
  return null;
}

/**
 * Map Firebase Auth codes to customer copy.
 * `auth/user-not-found` uses the same message as a successful send.
 */
export function passwordRecoveryOutcome(code: string | null | undefined): RecoveryOutcome {
  const normalized = String(code || "").trim();

  if (
    !normalized ||
    normalized === "auth/user-not-found" ||
    normalized === "auth/invalid-credential"
  ) {
    return { kind: "sent", message: RECOVERY_SENT_MESSAGE };
  }

  if (normalized === "auth/invalid-email" || normalized === "auth/missing-email") {
    return { kind: "invalid-email", message: "البريد الإلكتروني غير صحيح." };
  }

  if (normalized === "auth/too-many-requests") {
    return {
      kind: "rate-limited",
      message: "محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.",
    };
  }

  return {
    kind: "failed",
    message: "تعذر إرسال رسالة الاستعادة الآن. حاول مرة ثانية.",
  };
}
