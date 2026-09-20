# COMMERCIAL HANDOFF — iOS / TestFlight / App Store

Product: **FUSE**  
Bundle ID: **`com.fuseiraq.app`**  
Marketing version (`MARKETING_VERSION`): **`1.0.2`**  
Build (`CURRENT_PROJECT_VERSION`): **`18`** (Codemagic overwrites with `BUILD_NUMBER` during `fuse-ios-build`)  
Privacy manifest: **`ios/App/App/PrivacyInfo.xcprivacy`** (included in Xcode target)  
Info.plist: `ITSAppUsesNonExemptEncryption` = false; location usage string present  

## Codemagic workflow
- File: `codemagic.yaml`
- Workflow name: **`fuse-ios-build`**
- Instance: `mac_mini_m2`
- Integration key in YAML: **`app_store_connect: Codemagic`**
- Signing: `ios_signing.distribution_type: app_store`, `bundle_identifier: com.fuseiraq.app`
- Scripts: `npm ci` → `npm run build` → `npx cap sync ios` → assert `PrivacyInfo.xcprivacy` → set build number → `xcode-project use-profiles` → `xcode-project build-ipa`
- Publishing: App Store Connect auth via integration, **`submit_to_testflight: true`**
- Artifacts: `build/ios/ipa/*.ipa`

## Required human setup (no values in git)
| Requirement | Where |
|-------------|--------|
| App Store Connect API / Codemagic integration named **Codemagic** | Codemagic → Teams → Integrations |
| Apple Distribution certificate | Codemagic iOS code signing / Apple Developer |
| App Store provisioning profile for `com.fuseiraq.app` | Same |
| Start **`fuse-ios-build`** on `main` | Codemagic UI |

## Metadata
Source: **`store-assets/APP_STORE_METADATA.md`**

| Field | Value |
|-------|--------|
| Name | FUSE |
| Subtitle | توصيل الطعام في بغداد |
| Category | Food & Drink |
| Privacy | https://www.fuseiraq.com/privacy |
| Support | https://www.fuseiraq.com/support |
| Marketing | https://www.fuseiraq.com |
| Data deletion | https://www.fuseiraq.com/data-deletion |
| Keywords / description / What’s New | In APP_STORE_METADATA.md |

## Screenshots
Checklist (capture real device/simulator — do not invent):  
**`store-assets/SCREENSHOT_CHECKLIST.md`**  
iPhone 6.7" / 6.3" set required; iPad only if listed.

## Review notes + demo account
- Paste **`store-assets/REVIEW_NOTES.md`** into App Review Information.
- Provide a dedicated **customer** reviewer username/password **only** in App Store Connect (never commit).
- Reviewer path: browse → Fayrouz → cart → COD order → order status → data-deletion/support links.

## Exact publish sequence (human)
1. Confirm Codemagic ↔ ASC integration + cert + profile for `com.fuseiraq.app`.
2. Run **`fuse-ios-build`** on `main`.
3. Confirm IPA artifact and TestFlight processing in App Store Connect.
4. Create/select iOS version **1.0.2**; paste metadata; upload screenshots.
5. Attach TestFlight build; paste review notes + credentials.
6. Submit for review only with product owner authorization.

## Related
- Master: `COMMERCIAL_HANDOFF.md`
- Remaining actions: `store-assets/REMAINING_HUMAN_ACTIONS.md`
