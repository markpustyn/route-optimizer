# Waypoint

A simple driving-route planner built from the existing Next.js template. Enter a start and 2–50 destinations (one full address per line), choose time or distance, and optimize. Includes an optional return to start, a route map, ordered stops, estimated totals, per-leg Google Maps navigation, and a text download. The sample fills in ten Sacramento destinations.

## Run

```sh
npm install
npm run dev
```

## Neon database and Drizzle

Set `DATABASE_URL` in `.env.local` and in your hosting provider's server environment to the Postgres connection string from Neon's Connect dialog:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@YOUR_HOST.neon.tech/neondb?sslmode=require
```

Never use a `NEXT_PUBLIC_` prefix for database credentials. The server-only client in `db/client.ts` uses `@neondatabase/serverless` with `drizzle-orm/neon-http`; Drizzle Kit reads the same `DATABASE_URL`. This driver supports the existing individual selects and inserts over HTTP. Interactive callback transactions require a different driver; use Drizzle's batch API for supported atomic batches.

```sh
npm run db:check     # Read-only connection and table-existence check
npm run db:generate # Generate SQL after changing drizzle/schema.ts
npm run db:migrate  # Apply reviewed migrations to the configured database
npm run db:studio   # Open Drizzle's database browser
```

Google authentication uses Auth.js JWT cookies and saves verified Google profiles to `users` (SQL table `user`). The `signIn` callback in `auth.ts` uses `lib/google-user.ts` to insert or update name, email, and image by a unique Google account ID. Repeat sign-ins preserve `createdAt` and `savedAddress`. A failed database save returns to the map with an error instead of completing sign-in. Existing sessions need a new sign-in to create a database profile. Route saving is not connected. Schema migrations do not copy records from Supabase: moving existing records requires a separate data transfer.

## Google Maps setup

- Existing `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: enable Maps JavaScript API and restrict this browser key to your website origins.
- Add `GOOGLE_MAPS_SERVER_API_KEY` to `.env.local`: enable Routes API and Geocoding API with billing and restrict this separate server key to those APIs (and server IPs where applicable). Never prefix the server key with `NEXT_PUBLIC_`.
- Optional `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`; otherwise the map uses `DEMO_MAP_ID`.
- Routing requires the separate server key; the publicly exposed browser key is never used for server routing.

The affordable default geocodes each address once per optimization and uses a local geographic-distance matrix with multi-start nearest-neighbor and 2-opt to order stops. Google then supplies actual driving directions, geometry, distance and estimated duration. Geographic ordering does not optimize road travel time or road distance: rivers, bridges and one-way streets can make the geographic order worse. Savings percentages are hidden because no road baseline is purchased. Google results are not persisted. Both metric inputs use geographic ordering in this mode. Estimates exclude live traffic.

At 50 destinations plus the start, the default purchases 51 geocodes and five Essentials Compute Routes calls, approximately $0.28 per optimization at initial paid-tier global USD prices, before monthly free allowances. Directions are split into at most 10 intermediate stops to retain Essentials pricing. Shared endpoints preserve all connecting legs.

For explicit road-based optimization, set `ROUTE_OPTIMIZATION_MODE=road-matrix` in the server environment. This purchases 2,601 matrix elements at maximum size: approximately $13.03 including five route requests, before free allowances. Batching reduces HTTP requests, not billable elements. There is no automatic paid-matrix fallback when geocoding fails. The old matrix implementation could explain a $40 day after just a few large runs once free allowances were exhausted; confirm the actual SKU and element usage in Cloud Billing, grouped by SKU and filtered to the relevant date.

Set daily quotas for Geocoding API, Compute Routes and Compute Route Matrix in Google Cloud Console, and restrict both API keys. A budget alert alone does not cap spending. Deployment-level rate limits are also needed for a public endpoint; this change does not impose a global daily spending cap. Enable Geocoding API before deploying this change, then restart/redeploy the app. Other map loads and Places autocomplete usage remain separately billable.

References: [Route matrix](https://developers.google.com/maps/documentation/routes/compute_route_matrix), [Compute routes](https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes).

## Google sign-in

The public homepage leads to `/map`. Signed-out visitors see a simple Google sign-in overlay above the planner. A shadcn avatar in the bottom-left corner opens sign-in or account/sign-out controls. The map has no account header or logo. Auth.js returns to `/map` after sign-in or sign-out, and `/login` redirects there for old links. The planner is inert while signed out, and the proxy returns JSON 401 for signed-out requests to `/api/optimize`.

Configure `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` in the server environment. Register `http://localhost:3000/api/auth/callback/google` for local development and `https://YOUR_DOMAIN/api/auth/callback/google` for production in the Google OAuth client's authorized redirect URIs. These OAuth credentials are separate from the Maps API key. Auth.js uses an encrypted JWT session cookie and persists verified Google profiles in Neon. No route-saving or browser local storage is connected. Complete a real Google sign-in on your configured deployment to validate the OAuth consent and callback settings.

## Verify

```sh
npm test
npm run lint
npm run build
```

Tests cover ten-stop optimization, 24-stop asymmetric costs, round trips, API validation, and a mocked Google integration. Live Google routing requires enabled APIs and valid credentials.

## Contact form

The footer Contact button opens the shared UI dialog and submits to Formspree. Add your form ID to `.env.local`:

```dotenv
NEXT_PUBLIC_FORMSPREE_FORM_ID=your_form_id
```

Use the ID from your Formspree integration endpoint (`https://formspree.io/f/your_form_id`). Restart the dev server after adding it; for production, set the variable in your hosting environment and rebuild. Until configured, the dialog opens but sending is disabled.

## Stripe Premium billing

The Premium button opens Stripe Checkout for product `prod_VNMOo2og1ESzk1`, price `price_1UMbgBBMi1VZB10HaSdaVDSD` ($10 USD/month). The existing key and product are **test mode**. No real payments are enabled. The account menu includes Manage billing, with cancellation at the end of the paid month.

Server environment:

```dotenv
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_endpoint_signing_secret
STRIPE_PORTAL_CONFIGURATION_ID=your_billing_portal_configuration_id
APP_URL=https://your-public-domain.example
```

The local secret key was retained and a test portal configuration was created. Never prefix Stripe secrets with `NEXT_PUBLIC_`. For localhost, set `APP_URL=http://localhost:3000` or omit it. On deployment, set APP_URL explicitly to the public HTTPS origin. Configure all these server variables in the hosting environment too.

Register `https://YOUR_DOMAIN/api/stripe/webhook` in Stripe with these events:

- `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
- `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`
- `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`, `invoice.voided`, `invoice.marked_uncollectible`

Copy that endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`. For local testing, run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and use the signing secret printed by the Stripe CLI. Restart the development server after changing environment variables. A public webhook endpoint has not been registered by this implementation; renewals and cancellation synchronization require this setup.

Apply schema changes with `npm run db:migrate`. Google sign-in stores a stable Google account ID in new sessions; sign out and back in if using an older session. Checkout requires an authenticated database user, uses a server-selected price, and reuses open checkout sessions. The return page verifies session ownership and payment with Stripe; a success URL alone never grants Premium. Signed webhooks read current subscription state to tolerate duplicate and out-of-order deliveries. Active subscriptions with paid invoices unlock 50 destinations; other statuses revert to the standard limit of 15 destinations, excluding the starting point and return to start. Stripe-managed access expires at the paid period end even if webhook delivery stops. Manually granted Premium accounts without a Stripe customer remain supported.

Validation: `npm run test:billing`, `npm run test:auth`, `npm run test:premium`, `npm test`, and `npm run build`. To test the hosted payment flow, sign in, choose Upgrade, and use Stripe test card `4242 4242 4242 4242`, a future expiry, and any three-digit CVC. Confirm 50 destinations unlock, then verify cancellation through Manage billing and the signed webhook. No end-to-end card payment has been performed automatically.

Before accepting real payments, replace the plan IDs in `lib/billing-plan.ts` with the corresponding live product/price, configure a live secret key, live portal, and live webhook signing secret, and verify the complete flow. Test and live Stripe objects are separate.
