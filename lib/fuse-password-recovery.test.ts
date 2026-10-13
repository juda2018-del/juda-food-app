import assert from "node:assert/strict";
import test from "node:test";
import {
  RECOVERY_SENT_MESSAGE,
  passwordRecoveryOutcome,
  recoveryEmailError,
} from "./fuse-password-recovery";

test("rejects an empty recovery email", () => {
  assert.equal(recoveryEmailError("   "), "اكتب البريد الإلكتروني.");
});

test("rejects a malformed recovery email", () => {
  assert.equal(recoveryEmailError("not-an-email"), "البريد الإلكتروني غير صحيح.");
});

test("accepts a formatted recovery email without proving the account exists", () => {
  assert.equal(recoveryEmailError(" Customer@Example.com "), null);
});

test("uses one message for a successful send and an unknown account", () => {
  const sent = passwordRecoveryOutcome(null);
  const missing = passwordRecoveryOutcome("auth/user-not-found");
  assert.equal(sent.kind, "sent");
  assert.equal(missing.kind, "sent");
  assert.equal(sent.message, missing.message);
  assert.equal(sent.message, RECOVERY_SENT_MESSAGE);
  assert.equal(sent.message.includes("غير مسجل"), false);
});

test("reports an invalid email separately from account existence", () => {
  const outcome = passwordRecoveryOutcome("auth/invalid-email");
  assert.equal(outcome.kind, "invalid-email");
  assert.equal(outcome.message, "البريد الإلكتروني غير صحيح.");
});

test("reports Firebase rate limits", () => {
  const outcome = passwordRecoveryOutcome("auth/too-many-requests");
  assert.equal(outcome.kind, "rate-limited");
  assert.match(outcome.message, /انتظر/);
});

test("reports network and unexpected failures without account details", () => {
  const outcome = passwordRecoveryOutcome("auth/network-request-failed");
  assert.equal(outcome.kind, "failed");
  assert.equal(outcome.message.includes("@"), false);
});
