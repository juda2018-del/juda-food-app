#!/usr/bin/env node
/**
 * Provision Firestore profiles + custom claims for EXISTING Auth staff accounts.
 * Links drivers/{uid} to the driver Auth account (idempotent).
 * Does NOT create Auth users, reset passwords, or fake orders.
 */

import { GoogleAuth } from "google-auth-library";
import { firebaseCliAuthorizedUserCredentials } from "./firebase-cli-credentials.mjs";

const PROJECT_ID = "juda-food-app";
const PROJECT_NUMBER = "309377324974";

const STAFF = [
  { email: "admin@fuse.iq", role: "admin", restaurantId: "", name: "FUSE Admin" },
  { email: "restaurant@fuse.iq", role: "restaurant", restaurantId: "fayrouz", name: "فيروز" },
  { email: "driver@fuse.iq", role: "driver", restaurantId: "", name: "سائق FUSE" },
];

async function lookupUid(token, email) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_NUMBER}/accounts:lookup`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: [email] }),
    }
  );
  const data = await res.json();
  return data.users?.[0]?.localId || null;
}

async function patchUserDoc(token, uid, fields) {
  const mask = Object.keys(fields)
    .map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`)
    .join("&");
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}?${mask}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    }
  );
  return res.ok ? "OK" : String(res.status);
}

async function setClaims(token, uid, claims) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_NUMBER}/accounts:update`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ localId: uid, customAttributes: JSON.stringify(claims) }),
    }
  );
  return res.ok ? "OK" : String(res.status);
}

async function upsertDriverDoc(token, uid, entry) {
  const fields = {
    uid: { stringValue: uid },
    email: { stringValue: entry.email },
    name: { stringValue: entry.name || "سائق FUSE" },
    role: { stringValue: "driver" },
    fuseRole: { stringValue: "driver" },
    active: { booleanValue: true },
    online: { booleanValue: false },
    isOnline: { booleanValue: false },
    status: { stringValue: "غير متصل" },
    updatedAt: { timestampValue: new Date().toISOString() },
  };
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/drivers/${uid}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    }
  );
  return res.ok ? "OK" : String(res.status);
}

async function main() {
  const auth = new GoogleAuth({
    credentials: firebaseCliAuthorizedUserCredentials(),
    scopes: ["https://www.googleapis.com/auth/cloud-platform", "https://www.googleapis.com/auth/datastore"],
  });
  const token = await auth.getAccessToken();

  for (const entry of STAFF) {
    const uid = await lookupUid(token, entry.email);
    if (!uid) {
      console.log(`skip ${entry.email} — Auth user not found`);
      continue;
    }

    const fields = {
      role: { stringValue: entry.role },
      fuseRole: { stringValue: entry.role },
      email: { stringValue: entry.email },
      name: { stringValue: entry.name || entry.role },
      active: { booleanValue: true },
      updatedAt: { timestampValue: new Date().toISOString() },
    };
    if (entry.restaurantId) {
      fields.restaurantId = { stringValue: entry.restaurantId };
      fields.restaurant = { stringValue: entry.name || entry.restaurantId };
    }

    console.log(`users/${uid} (${entry.email}) → ${await patchUserDoc(token, uid, fields)}`);

    const claims = { role: entry.role, fuseRole: entry.role };
    if (entry.restaurantId) claims.restaurantId = entry.restaurantId;
    console.log(`claims ${entry.email} → ${await setClaims(token, uid, claims)}`);

    if (entry.role === "driver") {
      console.log(`drivers/${uid} (${entry.email}) → ${await upsertDriverDoc(token, uid, entry)}`);
    }
  }

  const fixUid = await lookupUid(token, "juda2018@gmaih.com");
  if (fixUid) {
    const fields = {
      role: { stringValue: "restaurant" },
      fuseRole: { stringValue: "restaurant" },
      restaurantId: { stringValue: "fayrouz" },
      restaurant: { stringValue: "فيروز" },
      active: { booleanValue: true },
      updatedAt: { timestampValue: new Date().toISOString() },
    };
    console.log(`fix juda2018@gmaih.com → ${await patchUserDoc(token, fixUid, fields)}`);
  }

  console.log("provision:staff complete");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
