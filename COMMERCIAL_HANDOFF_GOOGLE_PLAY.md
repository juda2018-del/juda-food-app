# COMMERCIAL HANDOFF — GOOGLE PLAY

Product: **FUSE**  
Application ID: **`com.fuseiraq.app`**  
Release versionName: **`1.0.2`**  
versionCode: **`14`**  
Production web: https://www.fuseiraq.com

## Explicit deferral
**The 12-tester / 14-day personal-account requirement is intentionally deferred and must be handled by the publishing account owner where applicable.**

- Do **not** claim opted-in tester count from this package.
- Do **not** claim 14-day completion.
- Do **not** claim Production store approval.
- Do **not** publish Play Production without the product owner’s explicit approval.

## Store listing metadata
Source of truth: **`store-assets/PLAY_STORE_METADATA.md`**

| Field | Value / location |
|-------|------------------|
| Name | FUSE |
| Category | Food & Drink |
| Short description | In PLAY_STORE_METADATA.md (≤80 chars) |
| Full description | In PLAY_STORE_METADATA.md |
| Privacy | https://www.fuseiraq.com/privacy |
| Terms | https://www.fuseiraq.com/terms |
| Support | https://www.fuseiraq.com/support |
| Data deletion | https://www.fuseiraq.com/data-deletion |

## Screenshots / graphics
- Checklist only (no fake images in repo): **`store-assets/SCREENSHOT_CHECKLIST.md`**
- Capture from a real device running the current production/app build.
- Android phone set: Home, Restaurant menu, Cart, Order status, Support.

## Data Safety
Paste using: **`store-assets/DATA_SAFETY_PREP.md`**  
(COD only; Firebase Auth/Firestore; no card vaulting in-app.)

## App Access (review)
- Dedicated **customer** Firebase Auth account.
- Paste credentials only in Play Console → App content → App access.
- Instructions: **`store-assets/REVIEW_NOTES.md`**
- Suggested path: Home → Restaurants → Fayrouz → add → Cart → COD order → Order status.

## Release notes (1.0.2)
Use What’s New / release notes consistent with commercial soft launch:
stability, privacy pages, order tracking lifecycle, and store compliance links.  
Arabic/English copy may follow App Store “What’s New” in `store-assets/APP_STORE_METADATA.md` adapted for Play.

## AAB upload instructions
1. Obtain signed AAB via **`COMMERCIAL_HANDOFF_ANDROID.md`** (Codemagic `fuse-android-build`).
2. Play Console → FUSE → Releases → create release on the track the publisher is authorized to use.
3. Upload `app-release.aab` (package `com.fuseiraq.app`, versionCode 14).
4. Complete Store presence, App content (Privacy, Data safety, App access), and graphics.
5. Roll out only with owner authorization.

## Closed Testing status
- Official testing URL (exists): https://play.google.com/apps/testing/com.fuseiraq.app
- Recruitment page (exists, optional): https://www.fuseiraq.com/beta/
- **12-tester / 14-day personal gate: DEFERRED** — publishing account owner handles if still required for that account type.

## Related
- Android build: `COMMERCIAL_HANDOFF_ANDROID.md`
- Master: `COMMERCIAL_HANDOFF.md`
- Remaining actions: `store-assets/REMAINING_HUMAN_ACTIONS.md`
