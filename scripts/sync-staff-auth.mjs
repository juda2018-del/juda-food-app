#!/usr/bin/env node
/**
 * Align production Firebase Auth staff accounts with STAFF_*_PASSWORD env.
 * Never prints passwords, tokens, or API keys.
 */

import { GoogleAuth } from "google-auth-library";
import { firebaseCliAuthorizedUserCredentials } from "./firebase-cli-credentials.mjs";

const PROJECT_ID = "juda-food-app";
const PROJECT_NUMBER = "309377324974";
const API_KEY = "AIzaSyB8sjJEn2meAPdYDsLn9RjLoQ3d51dsqa0";

const STAFF = [
  {
    key: "admin",
    email: "admin@fuse.iq",
    env: "STAFF_ADMIN_PASSWORD",
    role: "admin",
    restaurantId: "",
    name: "FUSE Admin",
  },
  {
    key: "restaurant",
    email: "restaurant@fuse.iq",
    env: "STAFF_RESTAURANT_PASSWORD",
    role: "restaurant",
    restaurantId: "fayrouz",
    name: "فيروز",
  },
  {
    key: "driver",
    email: "driver@fuse.iq",
    env: "STAFF_DRIVER_PASSWORD",
    role: "driver",
    restaurantId: "",
    name: "سائق FUSE",
  },
];

function requiredPassword(envName) {
  const value = process.env[envName];
  if (!value) throw new Error(`missing ${envName}`);
  return value;
}

async function adminToken() {
  const credentials = firebaseCliAuthorizedUserCredentials();
  if (!credentials) {
    throw new Error("missing Firebase CLI login (refresh token). Run firebase login, or set GOOGLE_APPLICATION_CREDENTIALS");
  }
  const auth = new GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/cloud-platform",
      "https://www.googleapis.com/auth/identitytoolkit",
      "https://www.googleapis.com/auth/datastore",
      "https://www.googleapis.com/auth/firebase",
    ],
  });
  const token = await auth.getAccessToken();
  if (!token) throw new Error("could not obtain Google admin access token");
  return token;
}

async function lookupUser(token, email) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_NUMBER}/accounts:lookup`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: [email] }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    return { error: data.error?.message || `lookup HTTP ${res.status}` };
  }
  return { user: data.users?.[0] || null };
}

function summarizeUser(user) {
  const providers = (user.providerUserInfo || []).map((item) => item.providerId).filter(Boolean);
  return {
    uid: user.localId,
    disabled: Boolean(user.disabled),
    emailVerified: Boolean(user.emailVerified),
    providers: providers.length ? providers.join(",") : "password",
  };
}

async function createUser(token, entry, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_NUMBER}/accounts`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: entry.email,
        password,
        emailVerified: true,
        disabled: false,
        displayName: entry.name,
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) return { error: data.error?.message || `create HTTP ${res.status}` };
  return { uid: data.localId };
}

async function updatePassword(token, uid, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_NUMBER}/accounts:update`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        localId: uid,
        password,
        emailVerified: true,
        disableUser: false,
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) return data.error?.message || `update HTTP ${res.status}`;
  return "OK";
}

async function setClaims(token, uid, entry) {
  const claims = { role: entry.role, fuseRole: entry.role };
  if (entry.restaurantId) claims.restaurantId = entry.restaurantId;
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

async function patchDoc(token, collection, uid, fields) {
  const mask = Object.keys(fields)
    .map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`)
    .join("&");
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${uid}?${mask}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    }
  );
  return res.ok ? "OK" : String(res.status);
}

async function verifyLogin(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error?.message || `HTTP ${res.status}` };
  return { ok: true, uid: data.localId };
}

async function main() {
  for (const entry of STAFF) {
    if (!process.env[entry.env]) {
      console.log(`${entry.key}: FAIL missing ${entry.env}`);
    }
  }
  if (STAFF.some((entry) => !process.env[entry.env])) {
    process.exit(1);
  }

  const token = await adminToken();

  for (const entry of STAFF) {
    const password = requiredPassword(entry.env);
    const looked = await lookupUser(token, entry.email);
    if (looked.error) {
      console.log(`${entry.key}: FAIL lookup ${looked.error}`);
      continue;
    }

    let uid = looked.user?.localId || null;
    let action = "update-password";
    if (looked.user) {
      const info = summarizeUser(looked.user);
      console.log(`${entry.key}: found uid=${info.uid} disabled=${info.disabled} provider=${info.providers} emailVerified=${info.emailVerified}`);
      if (looked.user.disabled) {
        console.log(`${entry.key}: enabling disabled account`);
      }
      const updated = await updatePassword(token, uid, password);
      if (updated !== "OK") {
        console.log(`${entry.key}: FAIL password-sync ${updated}`);
        continue;
      }
    } else {
      action = "create";
      const created = await createUser(token, entry, password);
      if (created.error || !created.uid) {
        console.log(`${entry.key}: FAIL create ${created.error || "no uid"}`);
        continue;
      }
      uid = created.uid;
      console.log(`${entry.key}: created uid=${uid}`);
    }

    const claims = await setClaims(token, uid, entry);
    const userFields = {
      role: { stringValue: entry.role },
      fuseRole: { stringValue: entry.role },
      email: { stringValue: entry.email },
      name: { stringValue: entry.name },
      active: { booleanValue: true },
      disabled: { booleanValue: false },
      updatedAt: { timestampValue: new Date().toISOString() },
    };
    if (entry.restaurantId) {
      userFields.restaurantId = { stringValue: entry.restaurantId };
      userFields.restaurant = { stringValue: entry.name };
    }
    const profile = await patchDoc(token, "users", uid, userFields);
    let driverDoc = "skip";
    if (entry.role === "driver") {
      driverDoc = await patchDoc(token, "drivers", uid, {
        uid: { stringValue: uid },
        email: { stringValue: entry.email },
        name: { stringValue: entry.name },
        role: { stringValue: "driver" },
        fuseRole: { stringValue: "driver" },
        active: { booleanValue: true },
        online: { booleanValue: false },
        isOnline: { booleanValue: false },
        status: { stringValue: "غير متصل" },
        updatedAt: { timestampValue: new Date().toISOString() },
      });
    }

    const login = await verifyLogin(entry.email, password);
    if (!login.ok) {
      console.log(`${entry.key}: FAIL login-after-sync ${login.error} action=${action} claims=${claims} profile=${profile} driver=${driverDoc}`);
      continue;
    }
    console.log(`${entry.key}: PASS uid=${login.uid} action=${action} claims=${claims} profile=${profile} driver=${driverDoc} login=OK`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
