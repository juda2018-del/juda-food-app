#!/usr/bin/env node
/** Report staff Auth lookup + optional login test when STAFF_*_PASSWORD env is set. */

const PROJECT_NUMBER = "309377324974";
const API_KEY = "AIzaSyB8sjJEn2meAPdYDsLn9RjLoQ3d51dsqa0";

const STAFF = [
  { key: "admin", email: "admin@fuse.iq", env: "STAFF_ADMIN_PASSWORD" },
  { key: "restaurant", email: "restaurant@fuse.iq", env: "STAFF_RESTAURANT_PASSWORD" },
  { key: "driver", email: "driver@fuse.iq", env: "STAFF_DRIVER_PASSWORD" },
];

async function tryLogin(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!res.ok) return data.error?.message || `HTTP ${res.status}`;
  return `OK uid=${data.localId}`;
}

async function main() {
  for (const entry of STAFF) {
    const password = process.env[entry.env];
    if (!password) {
      console.log(`${entry.key} (${entry.email}) → SKIP login (set ${entry.env} to test)`);
      continue;
    }
    const result = await tryLogin(entry.email, password);
    console.log(`${entry.key} (${entry.email}) → ${result}`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
