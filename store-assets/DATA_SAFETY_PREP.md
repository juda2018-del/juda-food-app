# Google Play Data Safety preparation — FUSE Iraq

Paste answers into Play Console → App content → Data safety.
Do not invent collection practices that the app does not perform.
App Check is not enabled on production yet.

## App overview
- Food delivery for Baghdad.
- Cash on delivery only (no in-app card processing).
- Auth / database: Firebase Authentication + Cloud Firestore.
- Hosting: Vercel web shell inside Capacitor (`com.fuseiraq.app`).

## Data collected (linked to user identity)

| Data type | Collected | Shared with third parties | Purpose | Optional? |
|-----------|-----------|---------------------------|---------|-----------|
| Name | Yes | No (infra processors only: Firebase/Google) | App functionality (orders, profile) | Required for orders |
| Email address | Yes | No (Firebase Auth) | Account creation / login | Required for account |
| Phone number | Yes | Shared with assigned restaurant/driver for the order | App functionality (delivery contact) | Required for orders |
| Physical address | Yes | Shared with assigned restaurant/driver for the order | App functionality (delivery) | Required for orders |
| Approximate / precise location | Yes (when user grants OS permission) | No beyond delivery operations | App functionality (delivery context) | Optional OS permission |
| App activity / order history | Yes | Restaurant/driver as needed for fulfillment | App functionality | Required for ordering |
| Device or other IDs | May be processed by Firebase/Google SDKs | Google/Firebase as processor | App functionality / analytics if Measurement enabled | System |

## Data NOT collected by FUSE product features
- Payment card numbers / bank accounts (COD only)
- Precise financial info beyond order totals in IQD
- Photos/videos from camera for ordering (reels are separate restaurant content)
- Contacts, SMS, call logs
- Health, genetics, sexual orientation, political beliefs

## Encryption & deletion
- Data encrypted in transit (HTTPS / Firebase TLS).
- Users may request account/data deletion via https://www.fuseiraq.com/data-deletion or in-app profile flows.
- Support: https://www.fuseiraq.com/support
- Privacy policy: https://www.fuseiraq.com/privacy

## App Access (review credentials)
- Prepare a dedicated **customer** Firebase Auth account.
- Paste username/password only in Play Console → App content → App access.
- Review path: Home → Restaurants → Fayrouz → add item → Cart → confirm COD order → Order status.
- Do not commit reviewer passwords to git. See `store-assets/REVIEW_NOTES.md`.
