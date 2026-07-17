# FUSE Release Notes

## What was cleaned in this package

- Fixed the `app/system-tools/page.tsx` TypeScript issue around `Restaurant.restaurant`.
- Kept one active Next.js config: `next.config.js` with static export and unoptimized images.
- Removed the duplicate `next.config.ts` to avoid config confusion.
- Updated `eslint.config.mjs` so lint ignores generated/mobile build output and legacy backup folders.
- Updated `tsconfig.json` excludes for backups, generated outputs, Android cache/build output, and iOS generated public output.

## Verified in this workspace

```bash
npm ci --ignore-scripts
npx tsc --noEmit --pretty false
npm run lint -- --max-warnings=0
npx next build --debug-build-paths app/customer/page.tsx,app/restaurant-admin/page.tsx,app/driver-app/page.tsx,app/system-tools/page.tsx
```

The key production pages checked are:

- `/customer`
- `/restaurant-admin`
- `/driver-app`
- `/system-tools`

## Run locally

```bash
npm install
npm run build
npm run dev
```

## Mobile sync after web build

```bash
npm run build
npx cap sync android
npx cap sync ios
```

## Important

Do not commit or upload `.env.local`, `node_modules`, `.next`, `out`, `build`, `backups`, `.fuse-backups`, `.fuse-tools`, or generated native build folders.

## Reels option added
- Added `/reels` customer-facing restaurant reels page.
- Reels reads from Firestore collection `reels` and falls back to demo reels when empty.
- Added reels navigation to home and customer bottom nav.
- Added reels item to FUSE navigation and allowed `/reels` routing.
- TypeScript check passed with `npx tsc --noEmit --pretty false`.
