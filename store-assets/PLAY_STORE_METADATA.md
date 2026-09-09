# Play Store metadata — FUSE Iraq

Use these values in Play Console. Do not put signing secrets or live passwords in this file.

## Identity
- Name: FUSE
- Application ID: com.fuseiraq.app
- Version name: 1.0.2
- Version code: 14
- Category: Food & Drink
- Production URL: https://www.fuseiraq.com

## URLs
- Privacy: https://www.fuseiraq.com/privacy
- Terms: https://www.fuseiraq.com/terms
- Support: https://www.fuseiraq.com/support
- Data deletion: https://www.fuseiraq.com/data-deletion

## Signing
Release builds read the upload keystore from a local `keystore.properties` file or these environment variables:
- `FUSE_KEYSTORE_FILE`
- `FUSE_KEYSTORE_PASSWORD`
- `FUSE_KEY_ALIAS`
- `FUSE_KEY_PASSWORD`

The upload keystore is not stored in the repository. Play App Signing should stay enabled in Play Console so existing users can still receive updates.

## Play upload-key rotation
If the previous upload keystore was ever in git, rotate the upload key in Play Console:
1. Open Play Console → the FUSE app → Setup → App signing.
2. Request upload key reset and follow Google’s current form.
3. Keep Play App Signing as-is. Do not replace the app signing key.
4. After Google accepts the new upload certificate, store the new keystore only in CI secrets / a local gitignored path.

## App Check
Not enabled on production yet.
