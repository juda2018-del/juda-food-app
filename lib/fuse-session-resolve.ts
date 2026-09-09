import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/app/firebase";
import { parseFuseRole, roleTitle, type FuseRole, type FuseSession } from "@/lib/fuse-auth";

type UserProfile = {
  role?: string;
  fuseRole?: string;
  name?: string;
  displayName?: string;
  phone?: string;
  restaurant?: string;
  restaurantId?: string;
  restaurantName?: string;
  active?: boolean;
  disabled?: boolean;
};

function clean(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function legacyRoleFromEmail(email: string): FuseRole | null {
  const value = clean(email);
  if (value === "admin@fuse.iq") return "admin";
  if (value === "restaurant@fuse.iq") return "restaurant";
  if (value === "driver@fuse.iq") return "driver";
  if (value === "customer@fuse.iq") return "customer";
  return null;
}

async function readProfile(user: User): Promise<UserProfile | null> {
  const collections = ["users", "accounts", "profiles"];

  for (const collectionName of collections) {
    try {
      const snapshot = await getDoc(doc(db, collectionName, user.uid));
      if (snapshot.exists()) return snapshot.data() as UserProfile;
    } catch {
      // Try the next compatible profile collection.
    }
  }

  return null;
}

export async function resolveFuseSession(user: User): Promise<FuseSession> {
  const token = await user.getIdTokenResult(true);
  const profile = await readProfile(user);

  if (profile?.disabled === true || profile?.active === false) {
    throw new Error("هذا الحساب موقوف من إدارة FUSE.");
  }

  const claimRole = parseFuseRole(token.claims.role || token.claims.fuseRole);
  const profileRole = parseFuseRole(profile?.role || profile?.fuseRole);
  const legacyRole = legacyRoleFromEmail(user.email || "");
  const role = claimRole || profileRole || legacyRole || "customer";

  if (role === "customer" && !profile) {
    try {
      await setDoc(doc(db, "users", user.uid), {
        role: "customer",
        name: user.displayName || roleTitle.customer,
        phone: user.phoneNumber || "",
        email: clean(user.email),
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Session still resolves as customer even if the profile write is denied.
    }
  }

  const email = clean(user.email);
  const source = claimRole
    ? "firebase-custom-claims"
    : profileRole
      ? "firestore-user-profile"
      : legacyRole
        ? "legacy-email-migration"
        : "authenticated-customer-fallback";
  const restaurant = String(
    token.claims.restaurantId ||
      token.claims.restaurant ||
      profile?.restaurantId ||
      profile?.restaurant ||
      profile?.restaurantName ||
      ""
  ).trim();

  if (typeof console !== "undefined") {
    console.info("[FUSE AUTH]", {
      uid: user.uid,
      authState: "signed-in",
      profileFound: Boolean(profile),
      resolvedRole: role,
      source,
      restaurantId: restaurant || null,
    });
  }

  return {
    uid: user.uid,
    email,
    role,
    name:
      profile?.name ||
      profile?.displayName ||
      user.displayName ||
      roleTitle[role],
    displayName:
      profile?.displayName ||
      profile?.name ||
      user.displayName ||
      roleTitle[role],
    phone: profile?.phone || user.phoneNumber || "",
    restaurant,
    restaurantId:
      String(token.claims.restaurantId || profile?.restaurantId || restaurant).trim() ||
      restaurant,
    restaurantName: profile?.restaurantName || profile?.restaurant || restaurant,
    fuseRole: role,
    fuseEmail: email,
    source,
    loggedAt: Date.now(),
    createdAt: Date.now(),
  };
}
