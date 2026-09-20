# FUSE commercial launch status (repo-verified)

Last automated verification: 2026-09-20 (agent run). Do not treat this file as Play Console live data.

## Verified green

| Gate | Status | Evidence |
|------|--------|----------|
| MAIN SHA | `5e4881528c5cf446f7e831350c3c74c5c31467b7` | `git rev-parse` / GitHub |
| PRODUCTION SHA | same as main (`5e48815`) — includes Android splash/signing fix from PR #19 | GitHub Deployments `Production – fuse-iraq` + `juda-food-app` |
| VERCEL | success | commit status on main + PR previews |
| BUILD | PASS | `npm run build` |
| TYPECHECK | PASS | `npx tsc --noEmit` |
| LINT | PASS | `npm run lint` |
| CATALOG | PASS | `npm run check:catalog` |
| CAPACITOR | PASS | `npx cap sync android` + `ios` |
| /beta | LIVE | https://www.fuseiraq.com/beta/ |
| Play testing URL | LIVE (HTTP 302 → Google login) | https://play.google.com/apps/testing/com.fuseiraq.app |
| QR | Decodes to official Play testing URL | jsQR decode of `public/images/fuse-closed-test-qr.png` |
| Legal URLs | 200 | `/privacy` `/terms` `/support` `/data-deletion` |
| Android package | `com.fuseiraq.app` | `android/app/build.gradle` |
| Android version | 1.0.2 / versionCode 14 | `android/app/build.gradle` |
| iOS version | 1.0.2 / build 18 | `ios/App/App.xcodeproj/project.pbxproj` |
| Codemagic workflows | Present | `codemagic.yaml` (`fuse-ios-build`, `fuse-android-build`) |

## Blocked / unverified (human or secrets)

| Gate | Status | Exact blocker |
|------|--------|---------------|
| ANDROID SIGNING | MISSING in this environment | Need `upload-keystore.jks` + `FUSE_KEYSTORE_PASSWORD` + `FUSE_KEY_PASSWORD` (optional `FUSE_KEY_ALIAS`, `FUSE_KEYSTORE_FILE`) locally or in Codemagic |
| ANDROID AAB (signed) | NOT BUILT | Blocked by missing signing secrets. Unsigned AAB intentionally blocked. |
| GOOGLE PLAY CLOSED TEST | ACTIVE gate (config not API-verified) | Closed Testing track must remain open for `com.fuseiraq.app` |
| VERIFIED OPTED-IN TESTERS | UNVERIFIED | No Play Console / Play Developer API credentials in this environment. Previously observed ~4; target 12. Do not claim progress without Console proof. |
| 14-DAY TEST REQUIREMENT | NOT STARTED / UNVERIFIED | Starts only after 12+ real opted-in testers are retained for 14 consecutive days |
| PRODUCTION ACCESS (Play) | BLOCKED | Waiting on 12 testers + 14-day requirement + Google review of production access |
| Play Production publish | NOT DONE | Explicit human confirmation required; do not auto-publish |
| iOS / CODEMAGIC run | NOT RUN HERE | Needs Apple signing + App Store Connect integration credentials in Codemagic |
| APP STORE CONNECT submit | NOT DONE | Needs human + successful TestFlight build |
| Customer/staff E2E passwords | SKIPPED | `E2E_CUSTOMER_PASSWORD` / `STAFF_*_PASSWORD` not set |

## Exact human actions (priority order)

1. **Play Console → Closed testing:** confirm opted-in tester count. Recruit via https://www.fuseiraq.com/beta/ until **12 real** testers opted in. Keep them opted in for **14 days**.
2. **Signing:** place upload keystore + passwords in Codemagic (or local gitignored `android/app/keystore.properties`) and run `fuse-android-build` / `bundleRelease`.
3. Upload signed AAB to the Closed testing track (not Production) unless production access is already granted and human explicitly approves Production.
4. **Codemagic iOS:** confirm App Store Connect integration + distribution cert/profile for `com.fuseiraq.app`, run `fuse-ios-build`.
5. Complete store listing screenshots / Data Safety / review credentials per `PLAY_STORE_METADATA.md`, `APP_STORE_METADATA.md`, `SCREENSHOT_CHECKLIST.md`, `REVIEW_NOTES.md`.

## Explicit non-actions for automation

- Do not invent testers, fake installs, or claim 12/12 without Console evidence.
- Do not publish Play Production without explicit human confirmation.
- Do not commit keystores, passwords, or service-account JSON.
