#!/usr/bin/env node
/**
 * Provision Firestore profiles + custom claims for EXISTING Auth staff accounts.
 * Does NOT create Auth users or fake orders.
 */

import { GoogleAuth } from "google-auth-library";
import { firebaseCliAuthorizedUserCredentials } from "./firebase-cli-credentials.mjs";

const PROJECT_NUMBER = "309377324974";

const STAFF = [
  { email: "admin@fuse.iq", role: "admin", restaurantId: "" },
  { email: "restaurant@fuse.iq", role: "restaurant", restaurantId: "fayrouz", name: "فيروز" },
  { email: "driver@fuse.iq", role: "driver", restaurantId: "", name: "سائق FUSE" },
];

async function main() {
  const auth = new GoogleAuth({
    credentials: firebaseCliAuthorizedUserCredentials(),
    scopes: ["https://www.googleapis.com/auth/cloud-platform", "https://www.googleapis.com/auth/datastore"],
  });
  const token = await auth.getAccessToken();

  for (const entry of STAFF) {
    const lookup = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_NUMBER}/accounts:lookup`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email: [entry.email] }),
      }
    );
    const users = await lookup.json();
    const uid = users.users?.[0]?.localId;
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

    const mask = Object.keys(fields)
      .map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`)
      .join("&");
    const write = await fetch(
      `https://firestore.googleapis.com/v1/projects/juda-food-app/databases/(default)/documents/users/${uid}?${mask}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      }
    );
    console.log(`users/${uid} (${entry.email}) → ${write.ok ? "OK" : write.status}`);

    const claims = { role: entry.role, fuseRole: entry.role };
    if (entry.restaurantId) claims.restaurantId = entry.restaurantId;
    const claimRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_NUMBER}/accounts:update`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ localId: uid, customAttributes: JSON.stringify(claims) }),
      }
    );
    console.log(`claims ${entry.email} → ${claimRes.ok ? "OK" : claimRes.status}`);
  }

  // Fix juda2018@gmaih.com restaurant profile if missing restaurantId
  const fixLookup = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_NUMBER}/accounts:lookup`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: ["juda2018@gmaih.com"] }),
    }
  );
  const fixUser = await fixLookup.json();
  const fixUid = fixUser.users?.[0]?.localId;
  if (fixUid) {
    const fields = {
      role: { stringValue: "restaurant" },
      restaurantId: { stringValue: "fayrouz" },
      restaurant: { stringValue: "فيروز" },
      active: { booleanValue: true },
      updatedAt: { timestampValue: new Date().toISOString() },
    };
    const mask = Object.keys(fields).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/juda-food-app/databases/(default)/documents/users/${fixUid}?${mask}`,
      { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ fields }) }
    );
    console.log(`fix juda2018@gmaih.com restaurantId → ${res.ok ? "OK" : res.status}`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
