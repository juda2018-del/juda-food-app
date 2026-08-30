import fs from "fs";
import path from "path";

const root = process.cwd();
const files = [
  "app/page.tsx",
  "app/restaurants/page.tsx",
  "app/restaurants/[restaurantId]/DynamicRestaurantClient.tsx",
  "app/cart/page.tsx",
  "app/order-status/page.tsx",
  "app/profile/page.tsx",
  "app/reels/page.tsx",
  "app/signup/page.tsx",
  "app/login/LoginClient.tsx",
  "app/auth/page.tsx",
  "app/settings/page.tsx",
];

const outDir = path.join(root, "app", "styles", "extracted");
fs.mkdirSync(outDir, { recursive: true });

const re = /<style jsx>\{`([\s\S]*?)`\}<\/style>/g;

for (const file of files) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    console.log("missing", file);
    continue;
  }
  const text = fs.readFileSync(full, "utf8");
  const match = text.match(re);
  if (!match) {
    console.log("no styled-jsx:", file);
    continue;
  }
  const css = match[0].replace(/<style jsx>\{`/, "").replace(/`\}<\/style>/, "");
  const name = file.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") + ".css";
  fs.writeFileSync(path.join(outDir, name), css.trim() + "\n");
  console.log("extracted", file, "->", name, css.length, "chars");
}
