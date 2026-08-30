# GTA VI Vice City Utility Suite — Project Guidelines & Architecture

## Overview
This application is a full-stack GTA VI companion web app featuring live community player chat rooms, interactive vehicle/weapon/map databases, AI tactical assistants, and a Firebase Auth user profile system with VIP membership management.

---

## Environment Variables & Configuration

All environment variables are declared in `.env.example` with fallback defaults and examples, and are accessed via the centralized helper `/src/lib/envConfig.ts` (`ENV`):

| Variable | Environment / Scope | Purpose & Example |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server Only (`process.env`) | Gemini AI key (`AIzaSy...`) powering Gemini 3.7 Flash with automatic quota & rate-limit downgrade waterfall |
| `APP_URL` | Server & Client | Base Cloud Run service deployment URL (`https://ais-dev-...run.app`) |
| `APP_NAME` | Client & Server | Application display name (`viceintel`) |
| `GA_MEASUREMENT_ID` | Client & Server | Google Analytics 4 Measurement ID (`G-VICE2026INTEL`) |
| `PORT` | Server Only | Ingress proxy port (`3000`) |
| `NODE_ENV` | Server & Client | Execution mode (`development` or `production`) |
| `RATE_LIMIT_WINDOW_MS` | Server Only | Express API rate limiting window in ms (`60000`) |
| `RATE_LIMIT_MAX_REQUESTS` | Server Only | Max requests per IP per window (`100`) |
| `STRIPE_SECRET_KEY` | Server Only | Stripe checkout API secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Server Only | Stripe webhook signature key (`whsec_...`) |
| `VIP_PRICE` | Client & Server | B2C VIP Monthly Pass price ($3.99/mo) |
| `B2B_SPONSOR_PRICE` | Client & Server | B2B Sponsored RP Server Spot price ($49.00/mo) |
| `DISCORD_CLIENT_ID` | Server & Client | Discord bot/widget integration client ID (`123456789012345678`) |
| `DATABASE_URL` | Server Only | Optional PostgreSQL connection string (`postgresql://...`) |
| `DEFAULT_LOCALE` | Client & Server | Currency and date formatting locale (`en-US`) |
| `ADMIN_PASSKEY` | Server & Client | Admin HQ authentication passkey (`VICE2026_L4`) |
| `STAFF_PASSKEY` | Server & Client | Staff HQ authentication passkey (`VICE2026_L3`) |
| `CRON_SECRET_KEY` | Server Only | Authentication token for automated midnight cron webhooks (`vice_midnight_cron_secret_2026`) |
| `AUTO_PSEO_ENABLED` | Server Only | Toggle background midnight news crawling and pSEO generation (`true` / `false`) |
| `NEWS_SEARCH_QUERY` | Server Only | Target search query keywords for news crawling (`GTA 6 Rockstar Games Vice City news leaks updates`) |
| `EMAIL_WEBHOOK_URL` | Server Only | Optional outbound webhook endpoint (SendGrid / Make) for automated VIP expiration alerts |
| `ENABLE_SUBDOMAIN_ROUTING` | Client & Server | Toggle multi-subdomain routing for standalone docs and admin hubs (`true` / `false`) |
| `DOCS_SUBDOMAIN_URL` | Client & Server | Public URL for dedicated Developer Documentation subdomain (`https://docs.viceintel.app`) |
| `ADMIN_SUBDOMAIN_URL` | Client & Server | Public URL for dedicated Executive Admin Control Plane subdomain (`https://admin.viceintel.app`) |
| `MAIN_PORTAL_URL` | Client & Server | Public URL for the primary unified community gaming portal (`https://viceintel.app`) |

---

## Key Features & Business Logic

### 1. User Profiles & GamerTags
- **Unique GamerTags**: User GamerTags must be verified against existing Firestore user profiles (`userProfiles` collection) before saving to ensure global uniqueness.
- **Annual Change Limits**: Users are allowed a **maximum of 2 GamerTag changes per 365-day rolling window**. Attempting a 3rd change within 1 year will present a clear lockout date indicator.
- **GTA VI Animated Avatars**: Profile avatars are stylized GTA VI character avatars (e.g. Lucia, Jason, Vice Squad Officer, Ocean Drive DJ, Outlaw Biker, Cartel Don) generated dynamically using vector avatar presets (`/src/data/avatars.ts`).

### 2. Community Live Chat, Voice Comms & Custom VIP Hubs
- **Real-Time Firebase Synchronization**: Chat messages are persisted to the `chatMessages` Firestore collection and synchronized via `onSnapshot`.
- **Deduplication Safeguard**: To prevent duplicate message UI rendering across simultaneous websocket/SSE and Firestore listener callbacks, messages are filtered by matching both unique message IDs and exact combinations of content, sender, and timestamp.
- **Channel Member Moderation (Kick & Ban)**: VIP Hub creators and Staff/Moderators can moderate custom channel members:
  - **Kick Member**: Instantly removes user from channel `members` array.
  - **Ban / Unban User**: Adds user to channel `bannedUsers` array to prevent re-joining. Creators can review banned users and unban them at any time.
- **Voice Comms & Screen Sharing Suite**:
  - **Multi-Participant Live Stream Resolver**: `getParticipantStream` maps live camera and screen streams for both local and remote connected channel members, rendering high-framerate video feeds across both the main stage viewport and participant filmstrip cards.
  - **In-Modal Screen Share Mini-Preview (PiP)**: A floating Picture-in-Picture mini-preview window inside the voice modal renders the active broadcast stream (`localScreenStreamRef.current`) when focused on other participants, allowing broadcasters to inspect their stream without switching windows.
  - **Document Picture-in-Picture & Pop-out Windows**: Supports Chrome/Edge `documentPictureInPicture` API for always-on-top floating voice call overlays with zero reload, as well as standalone window pop-outs with URL route parameters (`?popout=true&channel=...`) and `localStorage` auth session preservation to avoid re-login prompts.
  - **90 FPS GPU Stream Player**: `VideoStreamPlayer` component utilizes `React.memo` and `will-change: transform; transform: translateZ(0);` hardware acceleration for high-framerate rendering with minimal CPU overhead, backed by background tab keep-alive handlers for WebRTC and AudioContext.

### 3. Admin Control Panel, Role Security & Moderation
- **Real-Time Firestore Sync**: `AdminDashboardTab` subscribes directly to the `userProfiles` and `pendingApprovals` Firestore collections via `onSnapshot` for instant updates when players sign up or submit content.
- **Role Level & VIP Expiration Synchronization**:
  - **L4 Admin**: `vipExpires` is set to `'Lifetime'`.
  - **L3 Staff**: `vipExpires` is set to `'Staff Account'`.
  - **L2 VIP Member**: `vipExpires` is set to a 1-year rolling subscription date (e.g. `2027-08-15`).
  - **L1 Regular User**: Demoting a VIP to L1 User updates `vipExpires` to `'Expired'`.
- **Account Moderation**: Toggling VIP status or suspending/unbanning accounts updates the respective `userProfiles` document directly in Firestore.
- **Security & Authorization Rules**: Admin/Staff access is restricted strictly to Level 4 (`L4`) authorized accounts and Firestore role assignments. Arbitrary self-granting admin buttons are strictly prohibited.

### 4. Ads, Sponsorships & Monetization Engine
- **Dynamic Stripe Pricing**: VIP Membership Pass (`VIP_PRICE`) and B2B Sponsored RP Server Spot (`B2B_SPONSOR_PRICE`) are configured dynamically via environment variables and synchronized with Stripe checkout endpoints (`/api/stripe/config` and `/api/stripe/checkout`).
- **Ad Placement & VIP Ad-Free Toggle**: Interactive preview toggle allows staff/publishers to preview AdSense / Mediavine banner placements or test VIP ad-free subscriber views across all portal views.
- **B2B Server Placement**: Server owners can sponsor top-tier placement in the FiveM RP Server Directory.

### 5. Modal & Viewport Scroll Behavior
- **Modal Overflow & Scrollability**: All overlays and modals (`AuthModal`, `AiTacticalAssistant`, `managingChannel`, `reportModalTarget`, `vipLockModalTarget`, `showObsGuideModal`) use fixed backdrop overlays (`fixed inset-0 overflow-y-auto`) and inner scroll containers (`max-h-[85vh] overflow-y-auto`) to guarantee full accessibility on all device sizes without clipping.
- **Chat Layout Stability**: The chat stream and typing input area maintain balanced vertical constraints (`min-h-[580px]` container, scrollable `max-h-[520px]` message feed) to prevent unwanted whitespace gaps.

### 6. Hybrid Persistence Architecture & LocalForage Cache
- **Firebase Cloud Firestore**: Handles all real-time dynamic user data:
  - `userProfiles`: User GamerTags, annual change limit timestamps, avatars, clearance levels, VIP roles, `vcBalance`, `dailyStreak`, and `vipExpires`.
  - `chatMessages`: Live community chat messages synchronized via `onSnapshot` with deduplication filters.
  - `customChannels`: VIP player hubs with kick/ban moderation arrays.
  - `userNotifications`: Channel join request approvals/declines and system broadcasts.
- **IndexedDB via LocalForage**: Stores large static datasets locally (`STORAGE_KEYS`: vehicles, weapons, map locations, businesses, RP servers, blog posts, custom vehicle builds) for instant offline access and Service Worker caching (`/sw.js`).

### 7. Client-Side History Routing & Dynamic SEO JSON-LD
- **URL History Routing**: Clean `window.history.pushState` and `popstate` navigation mapping (`/vehicles`, `/weapons`, `/comparison`, `/mod-calculator`, `/roi-calculator`, `/map`, `/blog`, `/rp-servers`, `/chat`, `/profile`, `/docs`) allowing bookmarkable URLs without breaking single-page application state.
- **Programmatic Schema.org JSON-LD**: Automatically updates `<title>`, `<meta name="description">`, and injects dynamic JSON-LD structured data tags into `<head>` (`#seo-page-jsonld`) on tab and entity selection for search engine indexing.

### 8. FiveM RP Server Directory, No-Code Whitelist Engine & Discord Gateway
- **Server Connection Workflow**: Provides step-by-step guidance for connecting to FiveM / VMP / Custom C# servers (Copy connect command -> Launch FiveM -> Press F8 / ~ console -> Ctrl+V paste and Enter).
- **No-Code Dynamic Form Builder (`/servers/[slug]/manage`)**:
  - Allows server owners and staff to configure custom question templates (`text`, `textarea`, `dropdown`, `multiple_choice`, `number`, `boolean`) with minimum word requirements and custom placeholder hints.
  - Configures Discord Guild ID, Whitelisted Role ID, and Discord Webhook URLs for real-time application routing.
  - Live applicant form preview and instant Firestore persistence to `serverWhitelistForms`.
- **Player Application Portal (`/servers/[slug]/apply`)**:
  - Gated access verifying applicant identity and Discord account linking before form submission.
  - Automatic Discord webhook notifications dispatching rich embeds upon new application submission.
- **Staff Review Queue & Review Portal (`/servers/[slug]/review`)**:
  - Real-time queue filtering by application status (`Pending`, `Under Review`, `Approved`, `Rejected`) and player GamerTag search.
  - Detailed modal inspection showing applicant backstory, scenario answers, and staff internal notes.
  - 1-click **Approve** and **Reject** actions that dispatch rich Discord embed notifications to the server's configured webhook.
- **Applicant Real-Time Status Tracker (`/servers/[slug]/status`)**:
  - Live status tracking with visual timeline milestones and reviewer feedback for active applicants.
- **Discord OAuth2 Account Linking**:
  - Endpoint `/api/auth/discord` initiates OAuth authorization flow with state token preservation.
  - Endpoint `/api/auth/discord/callback` verifies OAuth code and exchanges for Discord identity (`discordId`, `discordUsername`, `discordAvatar`), attaching it securely to the user's Firestore profile (`userProfiles`).
  - Webhook dispatcher `/api/discord/webhook` sends rich formatted embeds for application events (new application, approval, rejection).

### 9. Automated Midnight Web Search & pSEO News Spider Engine
- **Background Cron Scheduler**: `server.ts` executes a recurring interval check every 30 minutes (or on UTC midnight / when `AUTO_PSEO_ENABLED === 'true'`).
- **Gemini AI Web Search & Synthesis**: Calls `@google/genai` model cascade (`gemini-3.7-flash` with automatic fallback to `gemini-flash-latest`, `gemini-3.1-flash-lite`, and `gemini-3.1-pro-preview`) with targeted query `NEWS_SEARCH_QUERY` to crawl recent GTA 6 Rockstar Games Newswire announcements, Vice City leaks, and PC/console updates.
- **Structured pSEO Page Generation**: Produces complete SEO-optimized topic pages containing H1 titles, meta descriptions, content sections, telemetry tables, FAQ schemas, and keyword tags.
- **Firestore Permanent Persistence**: Articles are saved permanently to the `pseoArticles` Firestore collection and synchronized into server state (`state.autoGeneratedPseoPages`) at boot time alongside an 8-day historical news archive seed.
- **Unique Article Identifiers**: Each crawl iteration attaches a timestamp token (`gta6-midnight-news-${dateStr}-${uniqueToken}`) to avoid daily overwrites and support continuous search indexing.
- **Rest & Webhook Endpoints**:
  - `GET /api/seo/pages`: Retrieves all auto-generated pSEO pages stored in server state & Firestore.
  - `POST /api/seo/auto-generate` / `POST /api/cron/midnight-spider`: Triggers the spider on-demand (secured by `CRON_SECRET_KEY` header `"x-cron-secret"`, `"Authorization: Bearer <token>"`, or query param `"?secret=YOUR_KEY"`).
- **Interactive Knowledge Hub**: `GtaSeoKnowledgeHub.tsx` loads generated pages live with an active index counter (`X Articles Indexed`) and includes a `⚡ Run Live Crawler & Fetch Articles` trigger button.

### 10. Community Tuning Championship Engine & No-Code Admin CMS
- **Handling.meta Physics Simulation**: Evaluates custom GTA VI vehicle physics parameters (`fMass`, `fInitialDriveForce`, `fDriveBiasFront`, `fInitialDragCoeff`, `fDownforceModifier`, `fTractionCurveMax`, `fTractionCurveMin`, `fBrakeForce`, `fSteeringLock`) into calculated real-world telemetry (Top Speed MPH, 0-60 Time, 1/4 Mile ET, Downforce lbs, and Slip Angle Drift Score).
- **Physics Constraint Validation**: Strictly verifies player submissions against admin-configured constraints (weight limits, drivetrain restrictions `RWD`/`AWD`/`FWD`, max drive force, and brake authority limits) to prevent illegal or cheated builds.
- **Real-Time Animated Leaderboard & Tie-Breaker Rule**:
  - Subscribes live via Firestore `onSnapshot` to `challenge_entries`.
  - **Deterministic Tie-Break Rule**: If two players submit configurations with the identical score / metric value, the submission registered earlier in the competition week (`submittedAt` timestamp) takes the higher rank.
  - Employs Framer Motion (`motion/react`) `<AnimatePresence>` and `layout` spring transitions for dynamic list reordering when new best times or speeds are submitted.
  - Sanitizes Firestore payloads via `sanitizeFirestore()` helper to prevent `undefined` write errors.
- **Admin No-Code Challenge CMS (`/admin` -> Tuning Challenge No-Code CMS)**:
  - **No-Code Builder Form**: Full visual configurator to create, edit, schedule, and immediately activate championship events with customizable target metrics (`top_speed`, `quarter_mile`, `drift_angle`), prize packages, and physics constraints.
  - **1-Click Preset Templates**: Instant loading for curated events (Ocean Drive Top Speed Run, Downtown Drift King, Everglades 1/4 Mile Drag, Vice Port Heavy Hauler, Biscayne Bay EV Hypercar).
  - **Live Leaderboard Moderation Queue**: Real-time table to inspect player submissions, review generated XML telemetry, export CSV data, disqualify/delete illegitimate builds, and grant custom bonus VC credits to player profiles (`userProfiles`).
- **Automated Weekly Payouts & Rotations (`/api/cron/challenges-payout`)**:
  - Automatically evaluates active challenge leaderboards at expiration, awards 500+ VC Cash & exclusive "Master Tuner" profile badges to 1st place winners, archives results to `past_challenges`, and rotates to the next scheduled event.

### 11. Multi-Subdomain Routing Architecture & 1-Click Deployment Engine
- **Future-Proof Isolation Architecture**: Documentation (`docs.*`) and Admin HQ (`admin.*`) can be deployed to standalone subdomains or served unified under the primary domain (`app.*` or `@`) without requiring code changes or separate builds.
- **Runtime Hostname & Param Detection (`/src/lib/subdomainRouter.ts`)**:
  - Automatically detects whether the visitor arrived via `docs.yourdomain.com`, `admin.yourdomain.com`, or query parameters (`?subdomain=docs`, `?subdomain=admin`).
  - Renders a floating contextual `SubdomainBanner` with navigation back to the primary gaming portal.
  - Automatically sets default landing tabs (`docs` or `admin`) and locks the viewport to the isolated subdomain context.
- **1-Click Deployment Blueprint & Interactive Simulator (`SubdomainDeploymentGuide.tsx`)**:
  - **Multi-Subdomain Suite Tab**: Generates complete DNS records, `.env` snippets, and multi-virtual-host Nginx configuration blocks routing `docs.*`, `admin.*`, and `@` to the single Node/Express container.
  - **Live Testing Simulator**: Allows testing and previewing `docs`, `admin`, and `portal` subdomain modes on-demand with 1 click.
  - **Provider Blueprints**: Comprehensive ready-to-run configurations for Google Cloud Run (3-domain mapping CLI), Linux VPS Nginx + Certbot SSL, Cloudflare Zero Trust Tunnels, and Docker Compose.

---

## Technical Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React icons, LocalForage (IndexedDB), Motion/React (Framer Motion).
- **Backend & Persistence**: Node.js Express server (`server.ts`) with Vite dev middleware, Firebase Auth, and Firebase Cloud Firestore.
- **Environment**: Centralized configuration accessor `/src/lib/envConfig.ts` parsing `.env` and `.env.example`.
- **SEO & Routing**: Client-side `window.history.pushState` routing with dynamic Schema.org JSON-LD metadata.
- **Avatars**: DiceBear vector SVG avatar engine configured with GTA VI aesthetic parameters.


