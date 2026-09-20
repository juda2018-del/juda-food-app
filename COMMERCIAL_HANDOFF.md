# FUSE IRAQ
# Commercial Handoff — Final

**Audience:** External store publisher / account owner  
**Scope:** Upload and submit only. Do not redesign the product.  
**12-TESTER GATE:** DEFERRED (handle on the publishing account where applicable)

## CURRENT SHA
`9e0573ac39928b4bdeb6d047cbddc12f25a9a95c`

(Prior splash/signing baseline: `5e4881528c5cf446f7e831350c3c74c5c31467b7`. Current tip includes commercial checkout harden + readiness docs.)

## PRODUCTION
https://www.fuseiraq.com

MAIN = PRODUCTION = `9e0573a` (verified Vercel Production for `juda-food-app` and `fuse-iraq`).

## STATUS
- CODE READY
- PRODUCTION READY
- ANDROID READY FOR SIGNING
- GOOGLE PLAY PACKAGE READY
- IOS PIPELINE READY
- 12-TESTER GATE DEFERRED

---

## A. Product verification
| Check | Result |
|-------|--------|
| `git status` | Clean on `main` |
| Build / typecheck / lint | PASS |
| Catalog check | PASS |
| Staff login tests | SKIP — needs `STAFF_*_PASSWORD` (HUMAN CREDENTIAL BLOCKER) |
| E2E lifecycle | BLOCKED — needs `E2E_CUSTOMER_PASSWORD` (HUMAN CREDENTIAL BLOCKER) |
| Auth / Firestore fail-closed | PASS (repo) |
| Legal URLs live | `/privacy` `/terms` `/support` `/data-deletion` |
| Beta recruitment page | https://www.fuseiraq.com/beta/ (available; not required for this handoff) |

Identity:
- Android / Capacitor / iOS: `com.fuseiraq.app`
- Marketing version: `1.0.2`
- Android `versionCode`: `14`
- iOS build: `18` (Codemagic may overwrite with `BUILD_NUMBER`)

---

## B. Android publishing
See **`COMMERCIAL_HANDOFF_ANDROID.md`**.

Pipeline: Codemagic workflow **`fuse-android-build`** → signed `app-release.aab`.

---

## C. Google Play publishing
See **`COMMERCIAL_HANDOFF_GOOGLE_PLAY.md`**.

Paste listing from `store-assets/PLAY_STORE_METADATA.md`, Data Safety from `store-assets/DATA_SAFETY_PREP.md`, review notes from `store-assets/REVIEW_NOTES.md`.

**Do not publish Play Production without explicit owner approval.**

---

## D. iOS / TestFlight publishing
See **`COMMERCIAL_HANDOFF_IOS.md`**.

Pipeline: Codemagic workflow **`fuse-ios-build`** → IPA → TestFlight (`submit_to_testflight: true`).

---

## E. Required secrets (names only — never commit values)
### Android / Codemagic
- File: `upload-keystore.jks`
- `FUSE_KEYSTORE_FILE` (or `CM_KEYSTORE_PATH`)
- `FUSE_KEYSTORE_PASSWORD`
- `FUSE_KEY_PASSWORD`
- `FUSE_KEY_ALIAS` (default `upload`)

### iOS / Codemagic
- App Store Connect integration named **`Codemagic`** (as in `codemagic.yaml`)
- Apple Distribution certificate
- App Store provisioning profile for `com.fuseiraq.app`

### Optional verification only
- `E2E_CUSTOMER_PASSWORD`
- `STAFF_ADMIN_PASSWORD` / `STAFF_RESTAURANT_PASSWORD` / `STAFF_DRIVER_PASSWORD`

---

## F. Required human account actions
1. Add Android keystore file + password env vars in Codemagic; run `fuse-android-build`.
2. Upload signed AAB in Play Console; paste listing / Data Safety / App Access / real screenshots.
3. Connect Codemagic ↔ App Store Connect; ensure cert + profile; run `fuse-ios-build`.
4. Complete App Store Connect 1.0.2 metadata, screenshots, review credentials; submit when authorized.
5. Where the publishing account still has a personal Closed Testing restriction, the account owner handles it — **this package intentionally defers the 12-tester / 14-day gate**.

---

## G. Final launch sequence
1. Confirm git SHA on `main` matches Production.
2. Codemagic `fuse-android-build` → download AAB → Play upload (testing or Production track as authorized).
3. Paste Play metadata + Data Safety + App Access + graphics.
4. Codemagic `fuse-ios-build` → TestFlight → select build in ASC → submit for review.
5. Owner approval before any irreversible Production store release.

## Related files
- `COMMERCIAL_HANDOFF_ANDROID.md`
- `COMMERCIAL_HANDOFF_GOOGLE_PLAY.md`
- `COMMERCIAL_HANDOFF_IOS.md`
- `COMMERCIAL_RELEASE_READINESS.md`
- `store-assets/*`
