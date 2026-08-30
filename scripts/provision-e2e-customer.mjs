#!/usr/bin/env node
/** Provision a real customer account for launch E2E — no fake orders. */

const PROJECT_API_KEY = "AIzaSyB8sjJEn2meAPdYDsLn9RjLoQ3d51dsqa0";
const email = process.env.FUSE_E2E_EMAIL || "fuse.e2e.launch.083026@gmail.com";
const password = process.env.FUSE_E2E_PASSWORD || "FuseLaunch2026!";
const name = "زبون FUSE E2E";
const phone = "07701234567";
const address = "بغداد، المنصور، شارع 14";

async function signUp() {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${PROJECT_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const payload = await response.json();
  if (!response.ok) {
    if (payload?.error?.message === "EMAIL_EXISTS") {
      console.log("E2E customer already exists — use login flow.");
      return null;
    }
    throw new Error(payload?.error?.message || response.statusText);
  }
  return payload;
}

async function writeProfile(uid, idToken) {
  const fields = {
    role: { stringValue: "customer" },
    name: { stringValue: name },
    phone: { stringValue: phone },
    address: { stringValue: address },
    email: { stringValue: email },
    active: { booleanValue: true },
  };
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/juda-food-app/databases/(default)/documents/users/${uid}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    }
  );
  if (!response.ok) {
    console.warn("Profile write via client token failed — rules may require admin. uid:", uid);
  }
}

async function main() {
  const result = await signUp();
  if (result?.localId) {
    await writeProfile(result.localId, result.idToken);
    console.log("Created E2E customer account.");
  }
  console.log("E2E email ready (password set in script/env, not printed).");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
