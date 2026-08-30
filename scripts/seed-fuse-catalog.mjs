#!/usr/bin/env node

/**
 * Idempotent catalog seed for juda-food-app.
 * Credentials (first match wins):
 *   1) GOOGLE_APPLICATION_CREDENTIALS / FUSE_SERVICE_ACCOUNT_PATH
 *   2) firebase login session (configstore refresh token)
 *   3) application default credentials
 *
 * Does NOT create fake orders, customers, or revenue.
 */

import { readFileSync, existsSync } from "node:fs";
import { initializeApp, cert, getApps, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { GoogleAuth } from "google-auth-library";
import { FUSE_MENU, FUSE_RESTAURANTS } from "./fuse-catalog-data.mjs";
import { firebaseCliAuthorizedUserCredentials } from "./firebase-cli-credentials.mjs";

const PROJECT_ID = "juda-food-app";

function firestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === "string") return { stringValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([key, entry]) => [key, firestoreValue(entry)])
        ),
      },
    };
  }
  return { stringValue: String(value) };
}

async function createRestWriter(auth) {
  async function get(collection, id) {
    const token = await auth.getAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${id}`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`${collection}/${id}: ${response.status}`);
    return response.json();
  }

  async function set(collection, id, data) {
    const token = await auth.getAccessToken();
    const fieldPaths = Object.keys(data);
    const updateMask = fieldPaths.map((path) => `updateMask.fieldPaths=${encodeURIComponent(path)}`).join("&");
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${id}?${updateMask}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, firestoreValue(value)])),
      }),
    });
    if (!response.ok) {
      throw new Error(`${collection}/${id}: ${response.status} ${await response.text()}`);
    }
  }

  return { mode: "rest", get, set };
}

async function createAdminWriter() {
  if (!getApps().length) {
    initializeApp({ projectId: PROJECT_ID, credential: applicationDefault() });
  }
  const db = getFirestore();
  return {
    mode: "admin",
    async get(collection, id) {
      const snap = await db.collection(collection).doc(id).get();
      return snap.exists ? { exists: true } : null;
    },
    async set(collection, id, data) {
      await db.collection(collection).doc(id).set(data, { merge: true });
    },
  };
}

async function createWriter() {
  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FUSE_SERVICE_ACCOUNT_PATH;
  if (credentialPath && existsSync(credentialPath)) {
    const serviceAccount = JSON.parse(readFileSync(credentialPath, "utf8"));
    initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID });
    console.log("Using service account credentials.");
    const db = getFirestore();
    return {
      mode: "admin",
      async get(collection, id) {
        const snap = await db.collection(collection).doc(id).get();
        return snap.exists ? { exists: true } : null;
      },
      async set(collection, id, data) {
        await db.collection(collection).doc(id).set(data, { merge: true });
      },
    };
  }

  const cliCredentials = firebaseCliAuthorizedUserCredentials();
  if (cliCredentials) {
    const auth = new GoogleAuth({
      credentials: cliCredentials,
      scopes: [
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/datastore",
      ],
    });
    const token = await auth.getAccessToken();
    if (token) {
      console.log("Using Firebase CLI login credentials.");
      return createRestWriter(auth);
    }
  }

  try {
    console.log("Using application default credentials.");
    return createAdminWriter();
  } catch {
    /* fall through */
  }

  console.error("Missing admin credentials.");
  console.error("Options:");
  console.error("  1) firebase login  (then rerun npm run seed:catalog)");
  console.error("  2) set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON file");
  process.exit(1);
}

function nowField(writer) {
  return writer.mode === "admin" ? FieldValue.serverTimestamp() : new Date().toISOString();
}

async function seedRestaurants(writer) {
  for (const restaurant of FUSE_RESTAURANTS) {
    const existing = await writer.get("restaurants", restaurant.id);
    await writer.set("restaurants", restaurant.id, {
      name: restaurant.name,
      title: restaurant.name,
      restaurantName: restaurant.name,
      description: restaurant.description,
      desc: restaurant.description,
      cuisine: restaurant.cuisine,
      category: restaurant.category,
      area: restaurant.area,
      deliveryTime: restaurant.deliveryTime,
      deliveryFee: restaurant.deliveryFee,
      minOrder: restaurant.minOrder,
      rating: restaurant.rating,
      image: restaurant.image,
      cover: restaurant.cover,
      logo: restaurant.image,
      emoji: restaurant.emoji,
      slug: restaurant.id,
      open: true,
      isOpen: true,
      active: true,
      status: "مفتوح",
      updatedAt: nowField(writer),
      ...(existing ? {} : { createdAt: nowField(writer) }),
    });
    console.log(`${existing ? "updated" : "created"} restaurant/${restaurant.id}`);
  }
}

async function seedMenu(writer) {
  for (const item of FUSE_MENU) {
    const existing = await writer.get("menu", item.id);
    const restaurant = FUSE_RESTAURANTS.find((entry) => entry.id === item.restaurantId);
    await writer.set("menu", item.id, {
      name: item.name,
      title: item.name,
      category: item.category,
      price: item.price,
      image: item.image,
      restaurantId: item.restaurantId,
      restaurant: restaurant?.name || item.restaurantId,
      restaurantName: restaurant?.name || item.restaurantId,
      available: true,
      isAvailable: true,
      active: true,
      updatedAt: nowField(writer),
      ...(existing ? {} : { createdAt: nowField(writer) }),
    });
    console.log(`${existing ? "updated" : "created"} menu/${item.id}`);
  }
}

async function main() {
  const writer = await createWriter();
  console.log(`Seeding FUSE catalog into ${PROJECT_ID}...`);
  await seedRestaurants(writer);
  await seedMenu(writer);
  console.log("Done. Verify with: npm run check:catalog");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
