import { signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { clearFuseBrowserSession } from "@/lib/fuse-session-clear";

function safeNextPath(nextPath?: string) {
  const value = String(nextPath || "/").trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/logout")) {
    return "/";
  }
  return value;
}

/**
 * Reliable logout for iOS/Capacitor and web.
 * Clears the local FUSE session immediately, then performs a best-effort
 * Firebase sign-out with a short timeout so navigation can never hang.
 */
export async function performFuseLogout(nextPath = "/") {
  if (typeof window === "undefined") return;

  const next = safeNextPath(nextPath);

  // Clear app state first so auth guards cannot restore the old role while
  // Firebase is completing its asynchronous sign-out in a WebView.
  clearFuseBrowserSession();

  try {
    await Promise.race([
      signOut(firebaseAuth),
      new Promise<void>((resolve) => window.setTimeout(resolve, 900)),
    ]);
  } catch (error) {
    console.error("FUSE Firebase logout failed", error);
  } finally {
    clearFuseBrowserSession();
    window.location.replace(`/login?next=${encodeURIComponent(next)}&loggedOut=1`);
  }
}
