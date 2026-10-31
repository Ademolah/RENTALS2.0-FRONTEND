# Static QA report (read-only, 2026-10-31)

Scope: code review of the whole web app against docs/WEB-APP-BRIEF.md and docs/MOBILE-FEATURE-CHECKLIST.md.
Not covered: anything that needs a signed-in session or the live server (booking, trips, host tools were read, not run).

Summary: BLOCKER 0 · HIGH 2 · MEDIUM 7 · LOW 11

`npx vite build` passes (2054 modules). Only warning: main JS chunk is 1,098 kB (gzip 286 kB), no code splitting.
`npx eslint src`: 163 problems = 147 errors + 16 warnings (92 unused vars, 32 set-state-in-effect, 13 immutability, 9 only-export-components, 16 exhaustive-deps, 1 no-control-regex). Lint does not gate the build. None of the "used before declared" hook errors is a runtime bug (they are inside callbacks that run later).

---

## HIGH

1. **Host and admin dashboards have no sign-in or role guard.**
   `src/pages/LandlordDashboard.jsx:40`, `src/pages/AdminDashboard.jsx` (no useAuth at all), routes `src/App.jsx` (`/dashboard/landlord`, `/dashboard/admin`). A signed-out visitor or a plain guest who opens the URL sees the full dashboard shell; every call then returns 401/403 and the 401 handler (`src/api/client.js:37`) does a full page reload to `/?session=expired`, so a signed-out visitor is told their session expired. Server still protects data, but the UI is exposed and the experience is wrong.
   Fix: add a small `RequireRole` wrapper in App.jsx (not signed in → open sign-in and go home; wrong role → redirect to their own dashboard).

2. **API base URL is unsafe in production.**
   `src/api/client.js:4` falls back to `http://localhost:8000/api/v1`; six other places use the bare `import.meta.env.VITE_API_URL` with no fallback: `src/api/properties.js:17,34`, `src/api/reviews.js:5`, `src/components/AddCarModal.jsx:14`, `src/components/AuthModal.jsx:64` (Google sign-in posts to `undefined/auth/google`), `src/components/BankSetupModal.jsx:21`. `.env` is (correctly) untracked and there is no `.env.example` or README note, so a deploy missing `VITE_API_URL` or `VITE_GOOGLE_CLIENT_ID_WEB` (`src/main.jsx:14`) breaks silently.
   Fix: one exported `API_URL` constant in `src/lib/config.js` (default to the production URL), use it everywhere, add `.env.example` and document both variables.

## MEDIUM

3. **Email verification dialog cannot be closed.** `src/components/VerifyEmailModal.jsx:7` receives `onClose` but never uses it and has no back or change-email control. A user who typed the wrong email is stuck until they reload.

4. **Broken link in the map popup.** `src/components/InteractiveMap.jsx:339` links to `/properties/<id>`; the real route is `/property/:id`, and hotels (`type="HOTEL"`, used at `src/pages/HotelDetails.jsx:683`) should go to `/hotel/:id`. Clicking "View" lands on an empty page.

5. **Raw `axios` calls bypass the shared client**, so an expired session during these calls shows a generic error instead of the sign-in flow: `src/api/properties.js:19,36`, `src/api/vip.js` (lines 9-90), `src/api/hotel.js:61`, `src/api/reviews.js:8,13`, `src/components/AddCarModal.jsx:170`, `src/components/BankSetupModal.jsx:42,67,91`, `src/components/AuthModal.jsx:64` (this one is fine, it is pre-login). Fix: use `apiClient` and drop the manual `Authorization` headers.

6. **Accessibility: icon-only buttons without a name.** Confirmed examples: `PropertyCard.jsx:46,52` (image arrows), `BookModal.jsx:161`, `EditCarModal.jsx:139`, `EditHotelModal.jsx:189`, `EditPropertyModal.jsx:133`, `EditVipModal.jsx:185`, `AddCarModal.jsx:203`, `AddPropertyModal.jsx:268`, `AddVipModal.jsx:265` (all close X), `BookingWidget.jsx:347,351` (calendar month arrows), `BankSetupModal.jsx:131`, `HostUpgradeModal.jsx:214,229`, `DeleteAssetModal.jsx:43`. A scan flagged 59 candidates; roughly 35 are real (the rest have text built from an expression). Fix: add `aria-label` ("Close", "Previous image", "Next month", ...).

7. **Accessibility: inputs with no label, id or aria-label** (scan found 49, heuristic): `AddVipModal.jsx` 7, `AdvancedSearch.jsx` 6 (placeholder only), `AuthModal.jsx` 6 (first at 293), `AddCarModal.jsx` 3, `CreateHotelModal.jsx` 3, `HostUpgradeModal.jsx` 3, `AddPropertyModal.jsx` 2, `browse/BrowseShell.jsx` 2, `ListYourProperty.jsx` 2, `ResetPassword.jsx` 2, `VipDetails.jsx` 2, `ForgotPasswordModal.jsx:98`, `VerifyEmailModal.jsx:157`.

8. **Hotel page wording and note.** `src/pages/HotelDetails.jsx:485` says "About this property" (shortlet-style label on a hotel page; brief says hotels never show shortlet labels). The page itself has no cancellation note (its booking dialog `BookModal.jsx` does, and the WhatsApp block does not carry it). Fix: "About this hotel" and add the standard note near the booking panel.

9. **No code splitting.** One 1.1 MB bundle that includes the admin dashboard, host forms and Leaflet. Fix: `React.lazy` for dashboards, host modals and map components.

## LOW

10. Dead code: `src/components/PriceTagIcon.jsx` is never imported. 12 exported API functions are never used: `car.js createCar, logCarWhatsappIntent`; `hotel.js getLandlordHotels, logHotelWhatsappIntent`; `properties.js logPropertyWhatsappIntent`; `reservation.js confirmCheckIn`; `reviews.js getPropertyReviewsApi, summarizeReviews`; `trips.js TYPE_LABEL, normaliseBooking`; `vip.js getLandlordVipEstablishments, logWhatsappIntent`. The four per-type WhatsApp intent functions call `/cars|hotels|properties|vip/whatsapp-intent`, which are not in the brief (pages correctly use `/reservations/whatsapp-intent`).
11. 92 unused imports/variables (full list from `npx eslint src`), mostly lucide icons and `React`. Notable: `Navbar.jsx:99` unused `Icon`, `badge` (leftover from the old link markup).
12. `src/pages/CarDetails.jsx:59,853` `isRedirecting` is never set to true (`setIsRedirecting` unused): dead state.
13. WhatsApp number is redeclared as a local constant instead of importing `src/lib/config.js`: `VipServiceDetails.jsx:42`, `HotelDetails.jsx:61`, `VipDetails.jsx:45`, `Help.jsx:6`. Value is correct (2347063688222) everywhere, no other numbers found.
14. `src/components/Navbar.jsx:123` bell badge uses `text-[11px]` (only text below text-xs in the app).
15. Two images without `alt`: `src/components/VipServiceDetails.jsx:282`, `src/pages/VipDetails.jsx:295` (gallery slides).
16. Headings "Service Unavailable" (`VipServiceDetails.jsx:173`) and "Venue Unavailable" (`VipDetails.jsx:185`) show when a listing fails to load. They are error states, not the banned availability label, but the wording could be "Listing not found".
17. `BookingWidget.jsx:187` shortlet booking payload has no `bookingType` while mobile sends `bookingType: 'PROPERTY'` (`BookModal.jsx:139` sends 'HOTEL'). Unknown whether the server needs it; worth confirming with the mobile session.
18. 8 `window.open(..., '_blank')` calls to wa.me have no `noopener` (BookingWidget:249, BookModal:104, VipServiceDetails:124, CarDetails:353, Help:46,49, HotelDetails:159, VipDetails:128). Add `'noopener,noreferrer'`.
19. `AdminDashboard.jsx:454` reads the data field `draft.paystackReference` (admin only, never shown as text); lint-only `no-control-regex` at `VipListingView.jsx:62`.
20. 16 `react-hooks/exhaustive-deps` warnings (stale-closure risk in effects), 32 `set-state-in-effect` errors under the React 19 hooks plugin (Home.jsx:112,120,157; Trips.jsx:41,63; Navbar.jsx:23,26; others). Style/perf, not user-visible bugs today.

---

## Checks that passed

- Every route in `App.jsx` renders a real page; every `Link`/`navigate` target exists except item 4.
- No `href="#"`, no empty `onClick`, no `console.log`, no TODO/FIXME, no `dangerouslySetInnerHTML`/`eval`.
- `.env` is gitignored and not tracked (`git ls-files | grep env` is empty). Token key is consistently `rentals_token`. No credentials in source.
- Every `target="_blank"` anchor has `rel="noreferrer"`.
- No fixed bottom bars or bottom sheets left (only full-screen modal backdrops).
- No hardcoded off-brand hex colours (only WhatsApp green and the hero tints).
- No wide `<table>` without a scroll wrapper.
- Guests never see a platform fee (quotes use `platformFee = 0`); 5%/95% wording appears only on host and admin screens and the Help FAQ states there is no fee.
- No "escrow" or "Paystack" in user-facing text (remaining hits are code identifiers and comments).
- No "Currently unavailable" label; hotel cards use `listingTag(..., 'hotel')`, hotel pages show no shortlet tag (except item 8).
- Privacy: no guest/host names, phones, emails or avatars rendered across views (host ledger shows "Booking #REF", reviewers show "Verified guest"); only ownership checks and the user's own profile fields touch those data.
- Chauffeur is N25,000 per 12 hours (`CarDetails.jsx:155`). Booking payload names for cars, VIP venue, VIP service and hotel match the mobile app.
- Cancellation note present on shortlet, hotel dialog, car, VIP venue, VIP service, Checkout and booking detail (gap: item 8).
- All API paths and methods in `src/api/*.js` match brief section 7 (extra admin routes `/admin/*`, `/hosts/requests*`, `/reservations/generate-checkout`, `/reservations/whatsapp-pending` are admin-only and not in the brief).
- Signed-out behaviour: Navbar unread count, Home upcoming trip, Notifications, Saved, Trips and GuestDashboard only call the API when a token/user exists.

---
## Fix status (2026-10-31)
Fixed: #1 role guard on dashboards, #2 API_URL constant + .env.example, #3 verify-email close button, #4 map link routes, #6/#7 accessible names (76 buttons, 33 inputs), #8 hotel wording + cancellation note, #9 lazy-loaded dashboards, #14 badge size, #15 image alt, #18 noopener on WhatsApp links, dead PriceTagIcon removed.
Left open: #5 (raw axios calls bypass shared client), #10/#11 unused exports/imports and lint errors, #12 dead state in CarDetails, #13 WhatsApp number redeclared in 4 files (value correct), #16 error-state wording, #17 shortlet bookingType (confirm with mobile), #20 hooks lint style warnings.
