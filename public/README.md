# YATRIO — Nepal Travel Marketplace

**Tagline:** One platform. Every journey.  
**Live site:** https://yatrio-nepal-bus.hatchable.site  
**Project console:** https://hatchable.com/console/projects/yatrio-nepal-bus  
**Product category:** Nepal-focused bus booking, trip planning and travel-services marketplace.  
**Current release at time of this document:** V149 (expanded destination-specific itineraries, licensed destination imagery and an official Nepal Tourism Board video embed).

---

## 1. Product overview

YATRIO is a multi-sided travel platform intended to help travellers discover and plan journeys across Nepal, compare and book intercity bus seats, build multi-day itineraries, and discover accommodation, local rides and experiences offered by partner businesses.

The platform also provides workspaces for transport operators, marketplace partners and administrators. Its long-term operating model is a verified-partner marketplace: provider identity and documents are reviewed, fleet images are moderated, and inventory is only presented as bookable when a provider publishes it and availability is open.

**Important product distinction:** a destination card, itinerary suggestion, sample operator, demo vehicle or illustrative photo is not a live service offer. A booking request is not a paid booking. A payment is not successful until the provider callback/status verification confirms it.

## 2. Main user groups

- **Travellers:** search bus journeys, inspect seat layouts, reserve seats, manage bookings, request cancellations, plan trips, save/share itineraries and opt into trip notifications or location sharing.
- **Bus operators:** apply to join, submit verification documents, manage buses, fleet images, drivers, schedules, seat layouts, passenger trip-location access and cancellation terms.
- **Travel-service partners:** apply to list stays, rides and experiences, manage listings and availability, and respond to booking requests.
- **Administrators:** review operators and documents, moderate fleet/listing images, monitor payments and commission reconciliation, manage cancellation policy, support and communications, and assess pilot launch readiness.

## 3. Traveller-facing features

- Nepal bus search with origin, destination and journey date.
- Journey sorting and filters, including fare, departure, duration, available seats and estimated cancellation refund.
- Bus comparison for up to three journeys.
- Interactive seat selection and bus layout previews, including configurable coach layouts and 3D fleet experiences.
- Booking and seat-hold workflow with expiry handling.
- Payment initiation/status and callback routes for supported wallet integrations (provider credentials and live verification are still required).
- Passenger dashboard, booking history, booking timeline, notifications and support.
- Time-based cancellation quote/request workflow and refund status transparency.
- Trip planner with destination, trip duration and travel-style choices; destination-specific daily outlines and nearby highlights across the expanded Nepal catalogue, hotel and bus inventory lookup, editable NPR budget estimate, spending tracker, save/share/print options.
- Destination discovery, map pins, regional filtering and photo gallery.
- Marketplace discovery for stays, local rides and experiences.
- Optional passenger trip-location sharing, explicitly consented, time-limited and restricted to the assigned operator workflow.

## 4. Operator, partner and administrator features

### Operator workspace
- Operator application and onboarding checklist.
- Four-document verification workflow and operator status.
- Bus/fleet management, photo submission and moderation.
- Driver management and schedule creation.
- Seat layout and vehicle configuration tools.
- Live location sharing for a specific trip where enabled.
- Passenger location access only where the traveller has opted in.
- Operator cancellation terms constrained by platform policy.

### Partner marketplace
- Partner application and review.
- Listing and image management.
- Availability and booking request workflows for stays, rides and experiences.
- Published partner inventory is distinct from destination inspiration content.

### Administration
- Operator verification and document moderation.
- Fleet image and marketplace listing image moderation.
- Support tickets and communications.
- Cancellation policy configuration and audit history.
- Cancellation/refund review workflow.
- Payment reconciliation and commission ledger.
- Pilot Launch QA Centre for operator, document, bus, photo, schedule, driver, payment and cancellation readiness.
- Admin endpoints are role-protected; anonymous requests should be rejected.

## 5. Nepal destination coverage

The destination catalogue is stored in `marketplace_destinations` and served by `GET /api/marketplace`. It supports the seven province filters: Koshi, Madhesh, Bagmati, Gandaki, Lumbini, Karnali and Sudurpashchim.

The V146 catalogue expansion adds 34 destination entries, including Dhulikhel, Panauti, Kirtipur, Ghandruk, Ghorepani, Kanyam, Itahari, Taplejung, Janakpur-region destinations, Tilaurakot, Ramgram, Jumla, Sinja Valley, Shey Phoksundo, Dolpo, Simikot, Khaptad, Dadeldhura, Tikapur, Shuklaphanta and Api Nampa.

Remote Himalayan and protected-area destinations can require flights, permits, guides, seasonal planning and local access checks. A destination being listed does not imply a direct bus route or currently available service.

## 6. Visual assets and media policy

- Local destination image assets currently live in `public/images/`; the gallery now includes 14 destination/location images plus two illustrative fleet images (16 total gallery items).
- Added Rara Lake (Supermaanis), Khaptad National Park (Dwellers) and Api Himal (Mahendra177), sourced from Wikimedia Commons under CC BY-SA 4.0; their attribution and licence links are listed at `/image-credits.html`.
- Fleet demo images are illustrative and must never be represented as an actual partner's vehicle.
- Destination images are inspiration; where a specific local photo is not available, the interface may use a neutral visual treatment rather than claim an unrelated image depicts that exact place.
- Operator-uploaded fleet photographs are not public until approved through moderation.
- Photo attribution and licence notes are published at `/image-credits.html`.
- The gallery includes 16 still images and one embedded video hosted by YouTube: “NEPAL HIMALAYA | A Breathtaking Journey Through the Peaks” from the official Nepal Tourism Board channel. The video is embedded using youtube-nocookie, lazy loading and no autoplay; YouTube may still process playback data when loaded.
- Added Panauti (Tibtak01, CC BY-SA 3.0), Ghandruk village (Peretz Partensky, CC BY-SA 2.0) and Phoksundo Lake (Passangdolpo, CC BY-SA 4.0). Attribution and licence links are on `/image-credits.html`.
- Use responsive image sizing, lazy loading, meaningful alt text, fallbacks and reduced-motion support. Avoid autoplay video with sound.

## 7. Architecture and repository map

YATRIO is hosted on Hatchable with a dedicated PostgreSQL database and serverless API functions.

- `public/` — static HTML, CSS, JavaScript and image assets.
- `public/images/` — local image library.
- `api/` — one serverless endpoint per JavaScript file.
- `lib/` — shared server-side modules, including booking notification logic.
- `migrations/` — ordered SQL migrations, applied once during deployment.
- `seed.sql` — initial demonstration/reference data for a fresh database.
- `hatchable.toml` — hosting/runtime configuration when present.

Important public pages include:
- `/` — bus search/home
- `/travel.html` — destination discovery, map, photo gallery and partner application
- `/plan.html` — trip planner
- `/explore.html` — stays, rides and experiences marketplace
- `/fleet-showroom.html` — fleet showcase
- `/image-credits.html` — image attribution
- `/admin-verified-operators.html` — operator verification centre (admin)
- `/admin-pilot-qa.html` — pilot launch QA centre (admin)

Selected API routes:
- `/api/search`, `/api/seats`, `/api/bookings`
- `/api/bus-payment-initiate`, `/api/bus-payment-status`, `/api/bus-payment-callback`
- `/api/marketplace`, `/api/marketplace-listings`, `/api/marketplace-bookings`
- `/api/operator-overview`, `/api/operator-documents`, `/api/operator-buses`, `/api/operator-schedules`
- `/api/admin-launch-readiness`, `/api/admin-operators`, `/api/admin-operator-documents`
- `/api/bus-cancellation-requests`, `/api/admin-cancellation-requests`
- `/api/passenger-trip-location`, `/api/operator-live-location`, `/api/bus-trip-share`

The deployed project has a larger API surface than this representative list; consult the Hatchable project function registry for the current inventory.

## 8. Data model and migrations

The PostgreSQL schema is migration-managed. Key domains include:
- Operators, verification documents, buses, drivers, fleet images and schedules.
- Cities, terminals, routes, seats, seat inventory, bookings and payment records.
- Marketplace categories, destinations, provider listings, listing images, availability and bookings.
- Traveller profiles, saved trips, trip shares, notifications and support communications.
- Cancellation policies, cancellation requests, refund records, payment settlement and commission reconciliation.
- Per-trip live location and passenger location-sharing records with expiry/retention controls.

Migrations are numbered and run in order during deployment. Never edit an already-applied migration to change production data; create a new forward migration. Keep migrations idempotent where practical and test them with a dry run before deployment.

## 9. Integrations and required configuration

### Wallet payments
The codebase includes Khalti and eSewa integration paths and payment callback/status handling. Live transactions require valid merchant credentials, correct production/sandbox configuration, verified callback URLs and end-to-end reconciliation. Do not mark a booking paid from a browser redirect alone.

Fonepay should only be activated after the merchant has supplied the current official integration specification and credentials; do not infer endpoints or signing rules.

### WhatsApp
The notification module is prepared for Meta WhatsApp Cloud API. Activation requires the Meta access token, phone-number ID, Graph API version, approved message template name, template language and template approval. Consent and template requirements must be respected. Until configured and tested, messages must be described as inactive/not sent.

### Email and maps
Email delivery depends on the configured provider and verified sender. The destination map uses Leaflet with OpenStreetMap tiles; tile availability and attribution requirements apply.

### Live location
Browser geolocation requires HTTPS and explicit permission. Location sharing is opt-in and time-limited. Do not expose a passenger's phone number or precise location to public viewers.

## 10. Local QA and safe demonstration testing

Use synthetic data only in a clearly marked test environment or isolated test records. Never use demo records to claim a real operator has been verified, a bus is actually scheduled, a payment has settled, or a refund has been issued.

**V149 live smoke-test evidence:** the public marketplace API returns 61 destinations; the travel page renders 61 destination cards and 61 Leaflet map markers; all 16 gallery images loaded with non-zero dimensions; the official Nepal Tourism Board video iframe and outbound watch link are present; and all 34 newly expanded destination profiles generated three itinerary day cards and four nearby highlights each. Ten representative destinations across all seven provinces were additionally checked for correct title and image behaviour. The tested pages produced zero browser page errors. This is a focused smoke test, not a full booking/payment end-to-end certification or a complete mobile/cross-browser audit.

Recommended smoke-test sequence:
1. Open the home page and verify bus search loads.
2. Open `/travel.html`; search/filter destinations by each province and category.
3. Select destination pins on the map; confirm the selected destination opens the planner.
4. Open `/plan.html`; test 2-, 3- and 7-day plans, all travel styles, and destination-specific highlights for the 34 new destination profiles. Confirm remote-area permit, guide, weather and access cautions are retained.
5. Change travel style, starting city, budget inputs and print view.
6. Open `/explore.html`; verify empty-state handling when no partner listings are published.
7. Verify each local image returns HTTP 200 and has a valid image content type; check image credits.
8. Verify protected API routes reject anonymous requests and allow the intended role.
9. Exercise operator application, document review, bus/fleet image moderation and schedule creation with synthetic accounts in a non-production test environment.
10. Test booking/seat holds with non-real payment mode; ensure payment remains pending until a verified callback.
11. Test cancellation quote and review state transitions without issuing a real wallet refund.
12. Test notification opt-in and provider integration using approved test templates/credentials only.
13. Check desktop, tablet and mobile layouts, keyboard focus, reduced-motion preferences and browser console errors.

## 11. Security, privacy and reliability principles

- Server-side authorization is required for every protected action; hiding a UI button is not access control.
- Validate request bodies, IDs, monetary amounts, state transitions and ownership server-side.
- Payment callbacks must verify provider signatures/status with the provider before confirming bookings.
- Never store merchant secrets in public JavaScript or commit them to source files.
- Apply least privilege to admin, operator and passenger data.
- Keep precise location private, consent-based, scoped to a trip and automatically expired.
- Use safe HTML escaping for user/provider content and avoid unsafe dynamic HTML.
- Keep audit trails for verification, policy and refund decisions.
- Use rate limits, input limits and monitoring for public endpoints.
- Maintain backups and a tested rollback/recovery process.

## 12. Known launch blockers and limitations

The application is feature-rich but is not yet proven as a live nationwide booking operation. At the time this README was written:
- There were no future published departures available for a real end-to-end search-to-payment test.
- No successful payment transactions were recorded.
- Wallet merchant credentials and provider-side callback verification still need configuration and live testing.
- WhatsApp Cloud API secrets/template configuration still need to be supplied and tested.
- The pilot readiness audit showed no approved verification documents and no approved fleet photos. One operator record was marked approved despite having zero documents; this is a data-integrity warning that requires manual admin review, not automatic approval or deletion.
- Real driver assignments, operator GPS sessions and passenger-consented location sharing have not been validated with a genuine pilot trip.
- Actual refund execution through a wallet provider remains a separate integration step; an internal refund record is not proof that money was returned.
- The local image library is a starter set, not a comprehensive licensed photo/video collection for every destination.
- Cross-device and cross-browser testing is still required before a public production launch.

## 13. Release and deployment workflow

1. Inspect the current source and database schema.
2. Make targeted changes; do not overwrite large files without reading the current version first.
3. Add a new migration for schema/data changes.
4. Run the Hatchable deployment dry-run and resolve hard errors.
5. Deploy with a plain-language release summary.
6. Verify the deployment version and status.
7. Test affected API routes at each relevant access tier.
8. Test public pages and static assets; record actual HTTP/status/browser results.
9. Review runtime logs for new errors.
10. Update this README whenever the architecture, integration status, major feature set or release constraints materially change.

## 14. Ownership and operational notes

YATRIO is a project name and product concept; brand/trademark clearance should be completed before large-scale commercial launch. Operator names and demo assets in the current database may be illustrative. Obtain written permission and valid business documentation before onboarding real operators, publishing their photographs, or advertising their services.

**Status language matters:** use “demo”, “illustrative”, “pending”, “configured”, “provider-verified”, “paid” and “refunded” precisely. Do not promote a test state into a production claim.