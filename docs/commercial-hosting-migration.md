# Commercial hosting migration — 2026-11-18

## Static site

The frontend is published to Cloudflare Pages Free as `taekilso`, with the existing
`taekilso.com` domain retained. The source repository remains on GitHub. Firebase
Authentication/Firestore and all existing backend/PayApp URLs are unchanged by
the frontend migration.

Build from a clean output directory with `node build-public.cjs`. The build copies
only tracked browser assets, HTML pages and public content data to `dist/`.
It excludes repository metadata, Firebase rules/configuration, tests, internal
documentation and contract manifests. The build refuses files larger than the
Pages per-file limit. Upload the **contents** of `dist/` to the existing Pages
project; do not upload the repository root. Direct Upload does not automatically
publish future GitHub commits. A later Git integration or deployment credential
must be configured explicitly before relying on automatic releases.

The Pages hostname has a `noindex` header. Existing canonical URLs, search
verification files, sitemap, HTML, scripts, images and videos are retained.
There are no Pages Functions, paid upgrades or new analytics integrations.

## DNS and recovery

Back up every record from Gabia before changing nameservers. The original zone
contained 11 records: four apex A records, `www` and `auth` CNAME records, two MX
records, and three TXT records. Keep the mail records, their priorities, Google
verification and `auth.taekilso.com -> taekilso.web.app` intact. Authentication
stays DNS-only and uses the existing Firebase Hosting auth site.

First configure the copied zone to preserve the original destinations. Confirm
those records before changing nameservers. Then associate the apex and `www`
with the Pages project, verifying TLS and the public origin before retiring
GitHub Pages. Keep the original Gabia records as a rollback reference until the
new origin, authentication and payment-return routes are confirmed.

## Operator information

The optional parenthetical legal-dong and apartment-name reference has been
removed from all 70 business footers; the street address, building/unit details
and usable contacts remain. The hosting provider label is Cloudflare, Inc.
Business information is explicitly excluded from generic opacity/reveal effects
so it remains readable after navigation.

Source: [Road Name Address Act Enforcement Decree, Article 6](https://www.law.go.kr/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=900260823).

## Backend plan decision

The authenticated Vercel Billing screen showed **Hobby Plan / Active**, with no
payment method. This migration does not upgrade the account or change payment
settings. Vercel's [Hobby plan](https://vercel.com/docs/plans/hobby) is restricted
to personal, noncommercial use. [Pro pricing](https://vercel.com/pricing) starts
at USD 20/month, excluding applicable taxes and additional usage. No paid
upgrade has been authorized.

Moving the frontend alone does not resolve the backend's commercial-plan
restriction. Alternative backends require a separate compatibility check:

- [Cloudflare Workers Free limits](https://developers.cloudflare.com/workers/platform/limits/): 10 ms CPU per request; the existing Node/Firebase Admin service cannot be presumed compatible.
- [Netlify synchronous functions](https://docs.netlify.com/build/functions/configuration/): 60-second execution limit; existing annual generation allows a 150-second upstream call. [Background functions](https://docs.netlify.com/build/functions/background-functions/) are available on credit-based Free plans, but require asynchronous result delivery and verification.
- [Render Free](https://render.com/docs/free): the provider explicitly advises against production use and services can sleep/restart.
- [Cloud Run](https://cloud.google.com/run/pricing): free usage allowances exist, but a billing-enabled account and possible overage/build/storage/network charges mean it is not an unconditional zero-cost option. Do not enable billing without approval.

## Validation boundaries

### Cutover verification

Both `taekilso.com` and `www.taekilso.com` are Active with SSL enabled in
Cloudflare Pages. Public resolvers 1.1.1.1 and 8.8.8.8 point to Cloudflare; the
assigned nameservers are `april.ns.cloudflare.com` and `damian.ns.cloudflare.com`.
The free Single Redirect named `Taekilso www to primary domain` matches only
`http.host eq "www.taekilso.com"`, redirects with status 301 to
`concat("https://taekilso.com", http.request.uri.path)`, and preserves query strings.
Actual HTTP/HTTPS www requests retained their path and test query parameters.

The local default resolver still returned an old GitHub address during checks.
GitHub Pages is therefore temporarily retained for propagation/rollback instead
of breaking clients with cached DNS. Do not describe legacy-host retirement or
universal resolver propagation as complete. Direct HTTPS checks against current
public DNS returned Cloudflare, HTTP 200, the new footer, and no `noindex` header
on the primary domain. Preview domains remain `noindex`.

The existing signed-in browser session survived reopening the production home.
Both viewport checks also passed against actual Cloudflare production responses,
fetched through current public DNS and supplied to an isolated browser because
of that machine's stale resolver. No new Google account login, charged payment,
AI answer or annual report was generated by these checks.

The frontend now points all existing consultation, membership, administration,
Kakao-token and new-order PayApp callbacks to the Seoul Cloud Run service.
[Backend migration](https://github.com/ganzibit7-eng/taekilso-backend/pull/50)
passes 152 tests and the container build. The operator approved usage-based
billing, dedicated identities/secrets and public service invocation; existing
Firebase and payment authentication remain in application handlers.
Monthly KRW 10,000 project budget alerts are configured at actual 50/90/100%
and forecast 100%. They are not a spending cap and exclude external Claude costs.

Live checks completed Firebase token exchange, authenticated status and an actual
Claude answer (free use 1/3), rejection of annual generation without a pass, and
12-month report generation/evidence validation using the existing annual engine.
PayApp transport accepted the configured LINKVAL then rejected an invalid order;
no new real charge was made. Temporary member data was removed. Existing signed-in
Google sessions, premium status and stored reports remain available.
Historical order callbacks can still reference the old Vercel URL, so that endpoint
is retained while PayApp common-notification routing is verified. Do not describe
legacy-host retirement as complete until this dependency has been removed.

### Scope of checks

103 frontend checks and UI-preservation verification pass. The uploaded release
was checked on 390 px and 1440 px screens using an isolated read-only rehearsal
of `taekilso.com` served from Pages. It covers video playback, visible business
identity, no horizontal overflow, enabled checkout UI, guest login gating and
annual-report entry, with no payment orders or charges created. Every business
footer was also checked against the deployed Pages content. Internal files return
404. These checks do not constitute a new charged payment or a newly generated
paid annual report. Final domain/TLS/login checks must be recorded after cutover.
