#!/usr/bin/env node
/** Walk order FUSE-93911664 through status lifecycle via admin REST (data integrity check). */

import { GoogleAuth } from "google-auth-library";
import { firebaseCliAuthorizedUserCredentials } from "./firebase-cli-credentials.mjs";

const ORDER_DOC = "fUAWDw3J5lY3p6YDXGhH";
const ORDER_ID = "FUSE-93911664";
const STATUSES = ["قيد التحضير", "جاهز للتوصيل", "قيد التوصيل", "تم التسليم"];

async function main() {
  const auth = new GoogleAuth({
    credentials: firebaseCliAuthorizedUserCredentials(),
    scopes: ["https://www.googleapis.com/auth/cloud-platform", "https://www.googleapis.com/auth/datastore"],
  });
  const token = await auth.getAccessToken();
  const base = `https://firestore.googleapis.com/v1/projects/juda-food-app/databases/(default)/documents/orders/${ORDER_DOC}`;

  for (const status of STATUSES) {
    const fields = {
      status: { stringValue: status },
      statusAr: { stringValue: status },
      updatedAt: { timestampValue: new Date().toISOString() },
    };
    const mask = Object.keys(fields).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
    const res = await fetch(`${base}?${mask}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });
    if (!res.ok) {
      console.log(`FAIL ${status} → ${res.status}`);
      process.exit(1);
    }
    console.log(`OK ${ORDER_ID} → ${status}`);
  }

  const verify = await fetch(base, { headers: { Authorization: `Bearer ${token}` } });
  const doc = await verify.json();
  console.log("FINAL", doc.fields?.status?.stringValue, doc.fields?.orderId?.stringValue);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
