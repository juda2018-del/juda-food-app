# COMMERCIAL HANDOFF — ANDROID

Product: **FUSE Iraq**  
Package / applicationId: **`com.fuseiraq.app`**  
versionName: **`1.0.2`**  
versionCode: **`14`** (do not increment unless Play rejects the upload)  
Repo: `juda2018-del/juda-food-app`  
Capacitor `appId`: `com.fuseiraq.app` (`capacitor.config.ts`)

## Goal
Produce a **signed** production-quality AAB for Play Console upload.  
Do **not** commit keystores or passwords.

## Codemagic workflow
- File: `codemagic.yaml`
- Workflow name: **`fuse-android-build`**
- Steps (already configured):
  1. `npm ci`
  2. Verify Java 21
  3. `npm run build` (Next.js static export → `out/`)
  4. `npx cap sync android`
  5. Configure signing from Codemagic secrets → `android/app/keystore.properties`
  6. `cd android && ./gradlew clean bundleRelease`

## Required secrets (names only)
| Name | Type | Notes |
|------|------|-------|
| `upload-keystore.jks` | File secret | Upload keystore file |
| `FUSE_KEYSTORE_FILE` | Env (default in YAML: `upload-keystore.jks`) | Or rely on `CM_KEYSTORE_PATH` |
| `CM_KEYSTORE_PATH` | Codemagic-provided path | Used if file not at `FUSE_KEYSTORE_FILE` |
| `FUSE_KEYSTORE_PASSWORD` | Env | Store password — **required** |
| `FUSE_KEY_PASSWORD` | Env | Key password — **required** |
| `FUSE_KEY_ALIAS` | Env | Default **`upload`** if unset |

Repo Gradle (`android/app/build.gradle`) **fails closed** before packaging if signing is missing — prevents unsigned “release” artifacts.

## Local build (optional, same secrets)
```bash
npm ci
npm run build
npx cap sync android
# Provide android/app/keystore.properties (gitignored) OR env vars above
cd android
./gradlew clean bundleRelease
```

Template: `android/keystore.properties.example` → copy to `android/app/keystore.properties` (never commit).

## Expected AAB output path
- **Primary:** `android/app/build/outputs/bundle/release/app-release.aab`
- Codemagic artifacts also collect:
  - `android/app/build/outputs/bundle/release/*.aab`
  - `android/app/build/outputs/apk/release/*.apk` (if produced)

## Signing requirements
- Use the **upload** keystore registered with Play App Signing.
- Keep Google Play App Signing enabled; do not replace the app-signing key.
- If a prior upload key was exposed, rotate **upload** key in Play Console → App signing.

## Exact upload steps (human)
1. Codemagic → select app → start **`fuse-android-build`** on `main`.
2. Download `app-release.aab` from build artifacts.
3. Play Console → FUSE (`com.fuseiraq.app`) → create release on the authorized track.
4. Upload AAB → review → roll out per owner policy.
5. **Do not** claim Production approval in this handoff; owner decides track and go-live.

## Related metadata
- Listing copy: `store-assets/PLAY_STORE_METADATA.md`
- Master handoff: `COMMERCIAL_HANDOFF.md`
