#!/usr/bin/env node

import { FUSE_MENU, FUSE_RESTAURANTS } from "./fuse-catalog-data.mjs";

const PROJECT_ID = "juda-food-app";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function getDoc(path) {
  const response = await fetch(`${BASE}/${path}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${path}: ${response.status} ${await response.text()}`);
  return response.json();
}

async function runQuery(collectionId, field, value, limit = 20) {
  const body = {
    structuredQuery: {
      from: [{ collectionId }],
      where: {
        fieldFilter: {
          field: { fieldPath: field },
          op: "EQUAL",
          value: { stringValue: value },
        },
      },
      limit,
    },
  };

  const response = await fetch(`${BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`query ${collectionId}.${field}=${value}: ${response.status}`);
  const rows = await response.json();
  return rows.filter((row) => row.document).map((row) => row.document);
}

function fieldString(doc, key) {
  return doc?.fields?.[key]?.stringValue || "";
}

function fieldNumber(doc, key) {
  const value = doc?.fields?.[key];
  if (!value) return 0;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  return 0;
}

async function main() {
  console.log(`FUSE catalog check — project: ${PROJECT_ID}`);
  let ok = true;

  for (const restaurant of FUSE_RESTAURANTS) {
    const doc = await getDoc(`restaurants/${restaurant.id}`);
    if (!doc) {
      console.log(`FAIL restaurant missing: ${restaurant.id} (${restaurant.name})`);
      ok = false;
      continue;
    }

    const name = fieldString(doc, "name") || fieldString(doc, "title");
    const open =
      doc.fields?.open?.booleanValue !== false &&
      doc.fields?.isOpen?.booleanValue !== false &&
      doc.fields?.active?.booleanValue !== false;

    console.log(`OK  restaurant ${restaurant.id} | ${name || restaurant.name} | open=${open}`);
  }

  for (const item of FUSE_MENU) {
    const doc = await getDoc(`menu/${item.id}`);
    if (!doc) {
      console.log(`FAIL menu missing: ${item.id} (${item.name})`);
      ok = false;
      continue;
    }

    const restaurantId = fieldString(doc, "restaurantId");
    const price = fieldNumber(doc, "price");
    const available = doc.fields?.available?.booleanValue !== false;

    if (restaurantId !== item.restaurantId) {
      console.log(`FAIL menu ${item.id}: restaurantId=${restaurantId || "(empty)"} expected ${item.restaurantId}`);
      ok = false;
      continue;
    }

    if (price <= 0) {
      console.log(`FAIL menu ${item.id}: invalid price ${price}`);
      ok = false;
      continue;
    }

    console.log(`OK  menu ${item.id} | ${fieldString(doc, "name") || item.name} | ${restaurantId} | ${price} | available=${available}`);
  }

  const orphanMenu = await runQuery("menu", "restaurantId", "");
  if (orphanMenu.length) {
    console.log(`WARN ${orphanMenu.length} menu docs missing restaurantId in Firestore`);
    ok = false;
  }

  console.log(ok ? "\nRESULT: PASS (canonical catalog present)" : "\nRESULT: FAIL (run npm run seed:catalog with admin credentials)");
  process.exit(ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
