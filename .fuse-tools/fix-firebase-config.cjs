const fs = require("fs");
const path = require("path");

const root = process.cwd();

const ignoreDirs = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "out",
  ".vercel",
  ".turbo",
  ".fuse-tools"
]);

const wanted = {
  apiKey: [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "FIREBASE_API_KEY",
    "FB_API_KEY",
    "REACT_APP_FIREBASE_API_KEY",
    "VITE_FIREBASE_API_KEY"
  ],
  authDomain: [
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "FIREBASE_AUTH_DOMAIN",
    "FB_AUTH_DOMAIN",
    "REACT_APP_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_AUTH_DOMAIN"
  ],
  projectId: [
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "FIREBASE_PROJECT_ID",
    "FB_PROJECT_ID",
    "REACT_APP_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_PROJECT_ID"
  ],
  storageBucket: [
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "FIREBASE_STORAGE_BUCKET",
    "FB_STORAGE_BUCKET",
    "REACT_APP_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_STORAGE_BUCKET"
  ],
  messagingSenderId: [
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "FIREBASE_MESSAGING_SENDER_ID",
    "FB_MESSAGING_SENDER_ID",
    "REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_MESSAGING_SENDER_ID"
  ],
  appId: [
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    "FIREBASE_APP_ID",
    "FB_APP_ID",
    "REACT_APP_FIREBASE_APP_ID",
    "VITE_FIREBASE_APP_ID"
  ],
};

const finalEnvNames = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
};

const found = {};

function badValue(v) {
  if (!v) return true;
  const s = String(v).trim();
  if (!s) return true;
  if (/process\.env/i.test(s)) return true;
  if (/undefined|null|placeholder|your_|YOUR_|xxxx|demo_api|invalid/i.test(s)) return true;
  return false;
}

function clean(v) {
  if (v == null) return "";
  let s = String(v).trim();
  s = s.replace(/^export\s+/i, "").trim();
  s = s.replace(/^["'`]/, "").replace(/["'`]\s*[,;]?$/, "").trim();
  s = s.replace(/\r/g, "").trim();
  return s;
}

function remember(field, value, source) {
  const v = clean(value);
  if (badValue(v)) return;

  if (!found[field]) {
    found[field] = { value: v, source };
    return;
  }

  if (field === "apiKey" && v.startsWith("AIza") && !found[field].value.startsWith("AIza")) {
    found[field] = { value: v, source };
  }

  if (source.includes(".env") && !found[field].source.includes(".env")) {
    found[field] = { value: v, source };
  }
}

function walk(dir, out = []) {
  let items = [];
  try {
    items = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const item of items) {
    const full = path.join(dir, item.name);

    if (item.isDirectory()) {
      if (ignoreDirs.has(item.name)) continue;
      walk(full, out);
      continue;
    }

    const ext = path.extname(item.name).toLowerCase();
    const ok =
      item.name.startsWith(".env") ||
      [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".txt"].includes(ext);

    if (ok) out.push(full);
  }

  return out;
}

const files = walk(root);

for (const file of files) {
  let text = "";
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }

  const rel = path.relative(root, file);

  if (path.basename(file).startsWith(".env")) {
    const lines = text.split(/\n/);
    for (const line of lines) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m) continue;

      const key = m[1].trim();
      const value = clean(m[2].replace(/\s+#.*$/, ""));

      for (const [field, aliases] of Object.entries(wanted)) {
        if (aliases.includes(key)) remember(field, value, rel);
      }
    }
  }

  for (const field of Object.keys(wanted)) {
    const re = new RegExp("\\b" + field + "\\s*[:=]\\s*[\"'`]([^\"'`\\r\\n]+)[\"'`]", "gi");
    let m;
    while ((m = re.exec(text))) {
      remember(field, m[1], rel);
    }
  }
}

const required = ["apiKey", "authDomain", "projectId", "appId"];
const missing = required.filter((k) => !found[k]?.value);

if (missing.length) {
  console.error("❌ ما لكيت Firebase config كامل بالمشروع.");
  console.error("المفقود:", missing.join(", "));
  console.error("دزلي هذا الخرج حتى نجيبه من مكانه الصحيح.");
  process.exit(2);
}

const envPath = path.join(root, ".env.local");
let envText = "";
if (fs.existsSync(envPath)) {
  envText = fs.readFileSync(envPath, "utf8");
}

let envLines = envText.split(/\r?\n/).filter(Boolean);
const keysToWrite = Object.values(finalEnvNames);
envLines = envLines.filter((line) => {
  const key = line.split("=")[0]?.trim();
  return !keysToWrite.includes(key);
});

envLines.push("");
envLines.push("# FUSE Firebase Auth - restored clean config");
for (const [field, envName] of Object.entries(finalEnvNames)) {
  if (found[field]?.value) {
    envLines.push(`${envName}=${found[field].value}`);
  }
}

fs.writeFileSync(envPath, envLines.join("\n") + "\n", "utf8");

const useSrc = fs.existsSync(path.join(root, "src", "app"));
const libDir = useSrc ? path.join(root, "src", "lib") : path.join(root, "lib");
const targetDir = path.join(libDir, "firebase");
const target = path.join(targetDir, "client.ts");

fs.mkdirSync(targetDir, { recursive: true });

const backupDir = path.join(root, ".fuse-backups", "firebase_config_fix_" + new Date().toISOString().replace(/[:.]/g, "-"));
fs.mkdirSync(backupDir, { recursive: true });

if (fs.existsSync(target)) {
  fs.copyFileSync(target, path.join(backupDir, "client.ts.bak"));
}

const fallbackConfig = {
  apiKey: found.apiKey.value,
  authDomain: found.authDomain.value,
  projectId: found.projectId.value,
  storageBucket: found.storageBucket?.value || "",
  messagingSenderId: found.messagingSenderId?.value || "",
  appId: found.appId.value,
};

const clientTs = `import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const fallbackConfig = ${JSON.stringify(fallbackConfig, null, 2)} as const;

function readEnv(name: string, fallback: string) {
  const value = process.env[name];
  if (!value || value === "undefined" || value === "null") return fallback;
  return value;
}

const firebaseConfig = {
  apiKey: readEnv("NEXT_PUBLIC_FIREBASE_API_KEY", fallbackConfig.apiKey),
  authDomain: readEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", fallbackConfig.authDomain),
  projectId: readEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", fallbackConfig.projectId),
  storageBucket: readEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", fallbackConfig.storageBucket),
  messagingSenderId: readEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", fallbackConfig.messagingSenderId),
  appId: readEnv("NEXT_PUBLIC_FIREBASE_APP_ID", fallbackConfig.appId),
};

const missing = Object.entries({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId,
}).filter(([, value]) => !value);

if (missing.length > 0) {
  throw new Error(
    "FUSE Firebase config missing: " + missing.map(([key]) => key).join(", ")
  );
}

export const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const firebaseAuth: Auth = getAuth(firebaseApp);
`;

fs.writeFileSync(target, clientTs, "utf8");

console.log("✅ Firebase config restored.");
for (const [field, data] of Object.entries(found)) {
  console.log(`✅ ${field}: from ${data.source}`);
}
console.log("✅ Wrote .env.local");
console.log("✅ Wrote " + path.relative(root, target));
