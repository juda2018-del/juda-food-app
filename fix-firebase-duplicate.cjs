const fs = require("fs");

const file = "app/firebase.ts";

if (!fs.existsSync(file)) {
  console.error("Missing app/firebase.ts");
  process.exit(1);
}

let code = fs.readFileSync(file, "utf8");

// عدل import مال firebase/app
code = code.replace(
  /import\s*\{\s*initializeApp\s*\}\s*from\s*["']firebase\/app["'];?/,
  'import { getApp, getApps, initializeApp } from "firebase/app";'
);

// إذا import موجود بس ناقص getApps/getApp
code = code.replace(
  /import\s*\{\s*([^}]+)\s*\}\s*from\s*["']firebase\/app["'];?/,
  (match, imports) => {
    const parts = imports.split(",").map((x) => x.trim()).filter(Boolean);
    for (const name of ["getApp", "getApps", "initializeApp"]) {
      if (!parts.includes(name)) parts.push(name);
    }
    return `import { ${parts.join(", ")} } from "firebase/app";`;
  }
);

// بدل initialize المباشر
code = code.replace(
  /export\s+const\s+app\s*=\s*initializeApp\s*\(\s*firebaseConfig\s*\)\s*;?/,
  "export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);"
);

// إذا عندك const app بدون export
code = code.replace(
  /const\s+app\s*=\s*initializeApp\s*\(\s*firebaseConfig\s*\)\s*;?/,
  "export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);"
);

fs.writeFileSync(file, code, "utf8");
console.log("DONE fixed app/firebase.ts duplicate app guard");
