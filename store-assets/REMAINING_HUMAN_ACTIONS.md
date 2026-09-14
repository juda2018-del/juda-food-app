# Remaining human actions — FUSE commercial launch

Repository-side prep is complete for version **1.0.2** (Android versionCode **14**, iOS build **18**). The items below require human credentials or store consoles. Do not commit secrets.

## Mandatory — Android signing / Play upload

| Action | Console / page | Value / file needed |
|--------|----------------|---------------------|
| Place upload keystore locally or in Codemagic file secrets | Local machine or Codemagic → Environment → File secrets | `upload-keystore.jks` (never commit) |
| Set keystore passwords | Codemagic env vars or `android/app/keystore.properties` (gitignored) | `FUSE_KEYSTORE_PASSWORD`, `FUSE_KEY_PASSWORD`, optional `FUSE_KEY_ALIAS=upload`, `FUSE_KEYSTORE_FILE` |
| Build signed AAB | Codemagic workflow `fuse-android-build` (runs `npx cap sync android` then `bundleRelease`) or local `npm run mobile:sync` + `./gradlew bundleRelease` | Signed `app-release.aab` |
| Upload AAB | Google Play Console → FUSE → Production (or testing track) → Create release | The signed AAB |
| Confirm Play App Signing | Play Console → Setup → App signing | Keep Google app-signing key; only rotate **upload** key if needed |
| Paste store listing copy | Play Console → Store presence → Main store listing | From `store-assets/PLAY_STORE_METADATA.md` |
| Upload screenshots | Play Console → Store listing → Graphics | Capture per `store-assets/SCREENSHOT_CHECKLIST.md` |
| Add review credentials | Play Console → App content → App access | Dedicated customer review account (password not in git) |

## Mandatory — iOS / App Store

| Action | Console / page | Value / file needed |
|--------|----------------|---------------------|
| Confirm Codemagic ↔ App Store Connect integration | Codemagic → Teams → Integrations → App Store Connect | API key / integration named in `codemagic.yaml` |
| Ensure signing profiles for `com.fuseiraq.app` | Codemagic iOS signing / Apple Developer | Distribution certificate + App Store provisioning profile |
| Run `fuse-ios-build` | Codemagic → Start build | Produces IPA + TestFlight submit (`submit_to_testflight: true`) |
| Complete App Store version 1.0.2 | App Store Connect → FUSE → iOS version | Metadata from `store-assets/APP_STORE_METADATA.md` |
| Paste review notes + credentials | App Store Connect → App Review Information | `store-assets/REVIEW_NOTES.md` + reviewer user/password |
| Upload screenshots | App Store Connect → App Store → Previews and Screenshots | Per `store-assets/SCREENSHOT_CHECKLIST.md` |
| Submit for review | App Store Connect → version → Add for Review / Submit | After TestFlight build is selected |

## Mandatory — Production ops (if not already done)

| Action | Console / page | Value / file needed |
|--------|----------------|---------------------|
| Confirm Vercel env for production domain | Vercel → Project → Settings → Environment Variables | Names in `.env.example` (no secrets in git). Web Firebase config is already in `app/firebase.ts`. |
| Confirm staff Auth claims/profiles | Firebase Console / `npm run sync:staff-auth` with STAFF_* passwords | Staff must have claims or Firestore profile roles (email alone no longer elevates) |
| Create App Store / Play review customer | Firebase Auth + store review forms | Dedicated customer account |
| Deploy rules if remote differs | `npm run firebase:deploy` with Firebase login / ADC | Uses `firestore.rules`, `firestore.indexes.json`, `storage.rules` |

## Optional

| Action | Console / page | Notes |
|--------|----------------|-------|
| Add `google-services.json` / `GoogleService-Info.plist` | Firebase Console → Project settings → Your apps | Needed for native push; not required for static Capacitor web shell orders |
| Enable App Check | Firebase Console → App Check | Keep off until Capacitor-compatible test passes |
| Play upload-key rotation | Play Console → App signing | Only if old upload key was exposed |
| Branded support email | DNS / mailbox | Replace `fuseiraq@gmail.com` when ready |
| Run full E2E lifecycle | Local/CI with secrets | `E2E_CUSTOMER_PASSWORD` + `STAFF_*_PASSWORD` then `npm run test:e2e-lifecycle` |

## Explicitly out of scope for automation here
- Inventing or resetting production passwords
- Committing keystores, certificates, or API secrets
- Claiming store upload or commercial launch complete while any mandatory row above is unfinished
