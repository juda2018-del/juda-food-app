# FUSE Iraq — Commercial Release Readiness

**12-TESTER GOOGLE PLAY GATE INTENTIONALLY DEFERRED**

This document prepares FUSE for upload/submission by an account that can publish without the personal-developer 12-tester / 14-day Closed Testing restriction. That gate is **not** worked in this run.

## Current SHAs
- **MAIN SHA:** `5e4881528c5cf446f7e831350c3c74c5c31467b7` (baseline audited)
- **Follow-up SHA:** see latest `main` after merge of restaurant-checkout harden PR (if landed)
- **PRODUCTION SHA:** must match `main` after any merge (Vercel Production `juda-food-app` + `fuse-iraq`)
- **Production URL:** https://www.fuseiraq.com

## Build / quality status
| Gate | Status |
|------|--------|
| `npm run build` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| `npm run check:catalog` | PASS |
| Staff auth login tests | SKIP without `STAFF_*_PASSWORD` |
| E2E lifecycle | BLOCKED without `E2E_CUSTOMER_PASSWORD` |
| Security / auth fail-closed | PASS (claims/profile only; email elevation removed) |
| Firestore rules (repo) | PASS (fail-closed staff; validated order create) |

## Android status
| Item | Value / status |
|------|----------------|
| Package | `com.fuseiraq.app` |
| versionName | `1.0.2` |
| versionCode | `14` (do not bump unless Play rejects the upload) |
| Capacitor sync | Ready (`npx cap sync android` after `npm run build`) |
| Icons | Present under `android/app/src/main/res/mipmap-*` |
| Splash | Branded `drawable/splash.xml` (duplicate base `splash.png` removed) |
| Release signing | Fail-closed before packaging |
| Codemagic workflow | `fuse-android-build` |
| Signed production AAB in this env | **NOT built** (keystore secrets missing) |

### Exact missing Android secrets (human / Codemagic)
1. File secret: `upload-keystore.jks` (via `FUSE_KEYSTORE_FILE` or `CM_KEYSTORE_PATH`)
2. `FUSE_KEYSTORE_PASSWORD`
3. `FUSE_KEY_PASSWORD`
4. `FUSE_KEY_ALIAS` (defaults to `upload` if unset)

Never commit `*.jks`, `keystore.properties`, or passwords.

## Google Play package status (console paste-ready)
| Asset | Location / status |
|-------|-------------------|
| Listing copy | `store-assets/PLAY_STORE_METADATA.md` |
| Short description | ≤80 chars present |
| Category | Food & Drink |
| Privacy | https://www.fuseiraq.com/privacy |
| Terms | https://www.fuseiraq.com/terms |
| Support | https://www.fuseiraq.com/support |
| Data deletion | https://www.fuseiraq.com/data-deletion |
| Data Safety prep | `store-assets/DATA_SAFETY_PREP.md` |
| App Access / review notes | `store-assets/REVIEW_NOTES.md` |
| Screenshot checklist | `store-assets/SCREENSHOT_CHECKLIST.md` (capture on real devices; none invented) |
| Closed test recruitment page | https://www.fuseiraq.com/beta/ (kept live; recruitment not pursued this run) |
| Production publish | **NOT done / not authorized this run** |
| 12-tester / 14-day gate | **INTENTIONALLY DEFERRED** |

## iOS status
| Item | Value / status |
|------|----------------|
| Bundle ID | `com.fuseiraq.app` |
| Version | `1.0.2` |
| Build | `18` (Codemagic overwrites with `BUILD_NUMBER`) |
| PrivacyInfo.xcprivacy | Present + in Xcode target |
| Info.plist | `ITSAppUsesNonExemptEncryption=false`; location usage string set |
| Codemagic workflow | `fuse-ios-build` → IPA + `submit_to_testflight: true` |
| Metadata | `store-assets/APP_STORE_METADATA.md` |
| Review notes | `store-assets/REVIEW_NOTES.md` |
| Signed IPA / TestFlight in this env | **NOT built** (Apple/Codemagic credentials missing) |

### Exact missing Apple / Codemagic credentials
1. Codemagic ↔ App Store Connect integration (YAML name: `Codemagic`)
2. Apple Distribution certificate + App Store provisioning profile for `com.fuseiraq.app`
3. Run `fuse-ios-build` in Codemagic UI
4. ASC version 1.0.2 screenshots + reviewer customer account (password not in git)

## Codemagic
- `codemagic.yaml` workflows: `fuse-android-build`, `fuse-ios-build` — production-ready structure
- No secrets in git

## Commercial UX (customer)
- Registration/login, restaurants, menu, cart (hardened), order status, profile, Arabic RTL, legal pages: verified routes HTTP 200 on Production
- Restaurant-page weak direct Firestore checkout removed in favor of hardened `/cart` path (integrity fix)

## Staff system
- Admin / restaurant / driver: route guards + Firestore role fail-closed
- Staff elevation requires Auth claims or provisioned profile — not email alone

## Remaining human actions (excluding deferred 12-tester gate)
1. Add Android upload keystore + passwords to Codemagic → run `fuse-android-build` → download signed AAB
2. Upload AAB + paste listing / Data Safety / App Access / graphics in Play Console (use org/account that can publish without 12-tester restriction if available)
3. Confirm Codemagic ASC signing → run `fuse-ios-build` → finish App Store Connect 1.0.2 + TestFlight → submit when ready
4. Capture real device screenshots per checklist
5. Optional: set `E2E_CUSTOMER_PASSWORD` + `STAFF_*_PASSWORD` for full automated lifecycle proof
6. Confirm remote Firestore rules match repo (`npm run firebase:deploy` with ADC) if not already deployed

## Explicit non-goals this run
- Recruiting Closed Testers
- Claiming 12/12 or 14-day completion
- Publishing Google Play Production without human approval
- Inventing keystores, Apple certs, screenshots, or tester activity
