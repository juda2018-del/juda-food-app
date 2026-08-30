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

const re = /\n?\s*<style jsx>\{`[\s\S]*?`\}<\/style>\n?/g;

for (const file of files) {
  const full = path.join(root, file);
  const before = fs.readFileSync(full, "utf8");
  const after = before.replace(re, "\n");
  if (after === before) {
    console.log("unchanged", file);
    continue;
  }
  fs.writeFileSync(full, after);
  console.log("stripped styled-jsx from", file);
}
