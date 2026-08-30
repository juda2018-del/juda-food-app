#!/usr/bin/env node

/**
 * Idempotent catalog seed for juda-food-app.
 * Requires admin credentials:
 *   set GOOGLE_APPLICATION_CREDENTIALS=C:\path\service-account.json
 *   npm run seed:catalog
 *
 * Does NOT create fake orders, customers, or revenue.
 */

import { readFileSync, existsSync } from "node:fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { FUSE_MENU, FUSE_RESTAURANTS } from "./fuse-catalog-data.mjs";

const PROJECT_ID = "juda-food-app";

function initAdmin() {
  if (getApps().length) return getFirestore();

  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FUSE_SERVICE_ACCOUNT_PATH;
  if (!credentialPath || !existsSync(credentialPath)) {
    console.error("Missing admin credentials.");
    console.error("Set GOOGLE_APPLICATION_CREDENTIALS to a Firebase service account JSON file, then rerun:");
    console.error("  npm run seed:catalog");
    process.exit(1);
  }

  const serviceAccount = JSON.parse(readFileSync(credentialPath, "utf8"));
  initializeApp({
    credential: cert(serviceAccount),
    projectId: PROJECT_ID,
  });

  return getFirestore();
}

async function seedRestaurants(db) {
  for (const restaurant of FUSE_RESTAURANTS) {
    const ref = db.collection("restaurants").doc(restaurant.id);
    const existing = await ref.get();

    await ref.set(
      {
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
        updatedAt: FieldValue.serverTimestamp(),
        ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true }
    );

    console.log(`${existing.exists ? "updated" : "created"} restaurant/${restaurant.id}`);
  }
}

async function seedMenu(db) {
  for (const item of FUSE_MENU) {
    const ref = db.collection("menu").doc(item.id);
    const existing = await ref.get();
    const restaurant = FUSE_RESTAURANTS.find((entry) => entry.id === item.restaurantId);

    await ref.set(
      {
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
        updatedAt: FieldValue.serverTimestamp(),
        ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true }
    );

    console.log(`${existing.exists ? "updated" : "created"} menu/${item.id}`);
  }
}

async function main() {
  const db = initAdmin();
  console.log(`Seeding FUSE catalog into ${PROJECT_ID}...`);
  await seedRestaurants(db);
  await seedMenu(db);
  console.log("Done. Verify with: npm run check:catalog");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
