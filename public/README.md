# YATRIO — Nepal Travel Marketplace

**Tagline:** One platform. Every journey.  
**Live site:** https://yatrio-nepal-bus.hatchable.site  
**Project console:** https://hatchable.com/console/projects/yatrio-nepal-bus  
**Product category:** Nepal-focused bus booking, trip planning and travel-services marketplace.  
**Current release at time of this document:** V173 (journey map selection stabilised: origin and destination dropdowns are the primary selection method, map pins are optional; a GPS current-location button can set the origin with permission, road preview uses GPS coordinates, and bus-search origin is labelled as the nearest mapped destination approximation. V169 custom two-point journey features remain, with the date and selected places handed into search. Travellers can select origin and destination by clicking map pins or using searchable place lists, choose a date, preview mapped road geometry where available, and transfer the chosen places/date into bus search. Remote/highland places show an access advisory for local jeep, trekking, permits, flights and seasonal checks; no bus service is implied. Existing eight suggested route corridors remain available. Road geometry is a planning estimate, not a live bus schedule, official bus route or road-condition guarantee. V166 homepage directory and prior release QA notes remain below).

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
- Destination discovery across 61 places, map pins, regional filtering and visible destination photography. Every destination card links to `/destination.html?place=<slug>`, a reusable detailed guide with a longer description, attractions/highlights, suggested stay, seasonal travel window, indicative NPR daily budget, OpenStreetMap link, YouTube video discovery, trip-planner link and stay/experience/bus search shortcuts. Exact photos are used where available; otherwise the page labels the image as regional inspiration.
- Destination guides load approved traveller stories filtered to the selected place. Stories remain hidden until community moderation approves them. The community feed API accepts an optional exact destination filter.
- Traveller community at /community.html: authenticated photo/story submissions, destination tags, optional public alias, privacy checks (including a reminder to remove photo GPS/EXIF metadata), pending moderation, public feed, user deletion and reporting. A “Completed YATRIO journey” marker is assigned only when a completed booking matches the destination; it is not self-claimed.
- Admin moderation at /admin-community-journeys.html; public posts are hidden until approval, and reported posts return to the review queue.
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

### Pilot operator onboarding kit
- `/operator-pilot-kit.html` is a printable preparation worksheet linked from the bus-partner information page.
- Covers the four required verification documents, business contact details, actual fleet evidence, driver readiness, first-route/departure worksheet and safe handover practices.
- Browser form fields and tick boxes are local-only; the page does not transmit applicant information or create an operator application.
- Includes credited illustrative exterior and interior fleet-photo examples from the existing image library, with clear warnings that operators must submit current photos of their own actual vehicles. The examples are not partner fleet evidence.
- The authenticated operator portal remains the only application/document submission path. Completing the kit does not mean YATRIO has verified or approved an operator.

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

- Local destination image assets currently live in `public/images/`; the gallery includes 14 destination/location images plus two illustrative fleet images (16 total gallery items). The 61 destination cards reuse these assets as exact-location images or clearly labelled province-level inspiration so no unrelated photo is passed off as the exact place.
- Added Rara Lake (Supermaanis), Khaptad National Park (Dwellers) and Api Himal (Mahendra177), sourced from Wikimedia Commons under CC BY-SA 4.0; their attribution and licence links are listed at `/image-credits.html`.
- Fleet demo images are illustrative and must never be represented as an actual partner's vehicle.
- Destination images are inspiration; where a specific local photo is not available, the interface may use a neutral visual treatment rather than claim an unrelated image depicts that exact place.
- Operator-uploaded fleet photographs are not public until approved through moderation.
- Photo attribution and licence notes are published at `/image-credits.html`.
- The gallery includes 16 still images and the Explore Nepal page now links every destination card to place-specific YouTube search results; Bardiya has a verified Nepal Tourism Board film link. The page also retains its embedded Nepal Tourism Board Himalaya film. The gallery includes one embedded video hosted by YouTube: “NEPAL HIMALAYA | A Breathtaking Journey Through the Peaks” from the official Nepal Tourism Board channel. The video is embedded using youtube-nocookie, lazy loading and no autoplay; YouTube may still process playback data when loaded.
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
- `/travel.html` — destination discovery, map, destination cards and partner application
- `/destination.html?place=<slug>` — detailed guide for any of the 61 destination slugs
- `/community.html` — traveller photo and story community
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

**V159 destination detail guides:** Added a single reusable destination detail page for all 61 places. Guides include place-specific editorial content for key destinations, attraction highlights for the wider catalogue, suggested stay lengths, seasonal windows, indicative NPR daily budget ranges, map links, YouTube discovery links, itinerary generation, live bus/stay/experience search shortcuts and a destination-filtered moderated traveller-story feed. Budget ranges are planning estimates only, not live supplier prices.\n\n**V157 destination card imagery and descriptions:** `/travel.html` now displays real image elements within destination cards rather than relying on CSS-only background artwork. Exact-location assets are used where available; province-level fallback images are labelled “Regional photo · inspiration”. Each of the 61 cards includes a longer description, and all images have alt text, lazy loading and a responsive cover crop.\n\n**V154 illustrated pilot onboarding kit:** enhanced `/operator-pilot-kit.html` with a dedicated photo-preparation guide showing illustrative fleet exterior and interior examples. The images are explicitly labelled as examples, not verified partner vehicles; their attribution is maintained on `/image-credits.html`. Responsive mobile and print layouts include the photo guide. It includes four-document preparation, company contacts, actual bus/fleet evidence, driver checks, a first-departure worksheet, and security/privacy reminders. Linked from `/become-a-partner.html`. The worksheet does not submit or persist applicant data and does not change operator status; all official application and document upload steps remain in the authenticated operator portal.

Use synthetic data only in a clearly marked test environment or isolated test records. Never use demo records to claim a real operator has been verified, a bus is actually scheduled, a payment has settled, or a refund has been issued.

**V150/V151 live smoke-test evidence:** the public marketplace API returns 61 destinations; the travel page renders 61 destination cards and 61 Leaflet map markers; all 16 gallery images loaded with non-zero dimensions; the official Nepal Tourism Board video iframe and outbound watch link are present; and all 34 newly expanded destination profiles generated three itinerary day cards and four nearby highlights each. Ten representative destinations across all seven provinces were additionally checked for correct title and image behaviour. Operator approval without documents was rejected with HTTP 409; the legacy incomplete operator's public profile returns HTTP 404 and operator comparison omits it. A post-test admin read confirmed the legacy demo record was not mutated. The tested pages produced zero browser page errors. This is a focused smoke test, not a full booking/payment end-to-end certification or a complete mobile/cross-browser audit.

Recommended smoke-test sequence:
0. Open `/operator-pilot-kit.html`; check all sections, editable worksheet fields, mobile layout and Print / Save PDF. Confirm the page clearly states that it does not submit data. Follow links to the partner overview and authenticated operator portal.
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
- Operator approval requires exactly four submitted documents, all four approved. Public bus search, operator profiles and comparison results also enforce this four-document rule so inconsistent legacy approval flags do not expose incomplete operators. Admin review surfaces flag the inconsistency without silently changing the stored operator status.
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