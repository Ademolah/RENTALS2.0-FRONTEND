# Browser QA report (signed-out, read-only)

Run: 2026-10-31 against http://localhost:5174 (live Render API reachable). No credentials were used, no source files edited.
Widths: 1440x900, 768x1024, 375x812. Signed-in flows (booking, trips, host, admin) were NOT testable.

Totals: BLOCKER 0, HIGH 2, MEDIUM 10, LOW 9.

Environment notes
- At the 375 emulation `window.innerWidth` reports 541 while `documentElement.clientWidth` is 375. This is a symptom of issue H1 (the page is 541px wide, so the layout viewport expanded). Checks at 375 use `clientWidth`.
- Smooth scrolling does not progress in this pane (a plain `scrollTo({behavior:'smooth'})` did not move). Anchor and TOC scroll behaviour is therefore marked "needs manual check".
- Programmatic focus does not fire React `onFocus` here (window not focused), so the recent-searches dropdown could not be shown.
- Screenshots often catch the fade-in animation (washed colours). Computed opacity was 1 everywhere it was checked.

## HIGH

### H1. Home (Shortlets, Hotels, Car Rentals tabs) scrolls sideways at 375 (page is 541px wide)
- Where: `/` at 375. VIP tab is fine.
- Saw: `scrollWidth` 541 vs 375. Offending row: `div.flex.items-center.gap-3` (the toolbar with "6 stays | List | Map | Filters | Sort by [select]") is 525px wide; the sort `label`/`select` end at 541/524.
- Reproduce: open `/` at 375, dismiss overlays, scroll horizontally.
- Likely cause: toolbar row in the browse shell has no `flex-wrap` / min-width handling; the sort select is too wide for a phone.

### H2. Fixed overlays are clipped/shifted at 375 because of H1
- Where: header search modal at 375, first-visit Welcome overlay card.
- Saw: search modal card spans x=16 to 525 on a 375px screen, content cut off at the right edge (screenshot confirmed); Welcome card 400px wide, left 70, right 470.
- Likely cause: overlays are sized against the 541px layout viewport. Probably fixed by H1; re-verify at 375 after the fix.

## MEDIUM

### M1. Google button wider than its card on phones
- Where: sign-in/register modal at 375.
- Saw: Google button 400px wide (right edge 388) inside a 343px card (right edge 359).
- Cause: `GoogleLogin width="400"` is a fixed pixel width in `AuthModal.jsx`.

### M2. `/help` scrolls sideways by 11px at 768
- Saw: `scrollWidth` 764 vs 753. The Email card in the 3-column contact grid (`md:grid-cols-3`) overflows; `privacy@rentalsafrica.com` is too wide.

### M3. Stale browser tab titles on pages with no title of their own
- Where: `/about`, `/help`, `/terms`, `/privacy`, `/sitemap`, `/list-property`, `/reset-password`, unknown URLs, `/vip-success` (SPA navigation keeps the previous page's title, e.g. `/reset-password` showed "My trips", the 404 showed "Guest reviews"). A fresh load shows the generic default title.
- Cause: these pages do not call `useDocumentMeta`.

### M4. No 404 page
- Where: `/this-page-does-not-exist` shows only header and footer, empty content.

### M5. `/vip-success` shows a confirmation to anyone
- Saw: "Reservation Secured... Your deposit has been securely held" when opened directly with no reservation or payment.

### M6. "Managed by Rentals Africa" only on the property page
- Hotel, car and VIP venue detail pages do not show it (no host details are shown either, so privacy is fine). VIP service shows "Provided by Rentals Africa". Brief parity gap.

### M7. Signed-out dashboards: hard redirect and stacked modals
- Where: `/dashboard/landlord` and `/dashboard/admin` signed out.
- Saw: full-page reload to `/`, then the sign-in modal opens on top of the city picker ("Where to?"), two modals at once. `/dashboard/guest` instead shows an in-page sign-in prompt (fine).

### M8. Auth modal remembers values and mode after closing
- Saw: after closing, the email and a 9-character password were still in state; the modal reopens in "Create account" if it was left there (heart/Book Now then opened Create account instead of Sign in).
- Impact: stale data, small security/UX concern. Reset the form on close.

### M9. No indication or way to clear a header search on desktop
- Saw: after searching dates/guests the bar shows the values but there is no chip and no clear control; filter "Clear all" does not reset it (results stayed 5 vs 6). Only changing tab resets.

### M10. Card carousel arrows are hover-only and unnamed
- Saw: arrows `opacity: 0` until hover, so not reachable on touch or by keyboard; no `aria-label`. Dots show but are not clickable.

## LOW

- L1. Footer buttons "English (NG)" and "₦ NGN" do nothing (no handlers).
- L2. Accessible names missing: card carousel arrows; header search submit button; lightbox prev/next; property page (2 buttons, `w-9`), hotel page (4), VIP venue (3 inputs, date/time), `/list-property` range sliders (2), `/reset-password` show/hide buttons (2).
- L3. No `<main>` landmark on `/help`, `/about`, `/sitemap`, `/list-property`, `/reset-password` and the signed-out account pages (`/trips`, `/saved`, `/notifications`, `/profile`, `/dashboard/guest`).
- L4. Forgot-password dialog: empty email gives an inline message, but a malformed email is stopped silently by the browser's native validation (no inline message), unlike the login form.
- L5. `/reset-password` without a token shows "Invalid or missing recovery token" but still shows an enabled form.
- L6. Sticky header is tall: 136px on phones (17% of an 812px screen), 138px on desktop home (two rows).
- L7. Hotels tab starts with "Filters (1)" and a "Clear all" button already active; users may not realise results are filtered.
- L8. First visit shows the Welcome overlay (z 110) on top of the city picker (z 100) at the same time.
- L9. Invalid listing ids return HTTP 400 from the API (console errors); the UI correctly shows "not found" messages.

## Needs manual check
- Smooth anchor scrolling: `/help#safety|#cancellation|#contact` (elements exist, instant scroll works) and the Terms/Privacy table-of-contents buttons.
- Recent-searches dropdown (saved correctly to `rentals_recent_searches`; code in `SearchBox.jsx:62` looks right).
- Google sign-in account chooser (needs a real Google session).
- Everything signed-in.

## PASS (by area)

Home 1440: no sideways scroll; hero, city modal (Abuja gives "Abuja, Nigeria" banner and only Abuja listings); category cards switch all four tabs and set `aria-pressed`; header search: Where/Check in/Check out/Who dropdowns open, fit the viewport, pick dates (past days disabled), guests stepper, search filters list (6 to 5), dropdowns fit at 768; sort (price low/high, rating), filters (city, bedrooms stepper, Clear all), Map toggle with pins (shortlets 5, cars 7, hotels 2), List returns; car filters (Luxury 3, Chauffeur 0); VIP Venues/Services tabs (3 venues, 2 services); heart signed-out opens sign-in; carousel arrows work on multi-photo cards; no broken images, no text under 12px, no duplicate ids on any page.

Detail pages 1440/768/375: property, hotel, car, VIP venue, VIP service all load with correct titles; "Check out via WhatsApp" pill scrolls the green block into view; one visible WhatsApp block each (hotel has a second hidden mobile one); no platform-fee, "currently unavailable", Paystack or escrow text; property booking panel: calendar opens in view, 3 nights = 3,000,000 (no fee line), "Dates are available!", "Check Availability" with no dates shows an inline message, Book Now and the WhatsApp button signed-out open the sign-in modal; lightbox opens, arrow key changes photo, Escape closes; invalid ids show "Property/Hotel/Vehicle not found".

Static pages (all three widths unless noted): `/about`, `/terms`, `/privacy`, `/sitemap`, `/list-property`, `/checkout` (empty state), `/reviews/<id>` (empty state), `/trips|/saved|/notifications|/profile` (sign-in prompts, no crash). Help FAQ accordions open/close; all footer and header links point to real routes; Sitemap links real; no dead `#` links.

Auth modal: empty login shows both inline errors; invalid email, short password, mismatched passwords and invalid phone show inline messages on register; show/hide password works; forgot-password dialog opens and closes; "Continue with Google" renders; register form and sign-in fit a 375x812 viewport (card scrolls internally).

Navbar: signed-out shows Home, Help, Become a host, Sign in with no hamburger on desktop; at 375/768 the menu button opens (Sign in or register, Help, Become a host), closes on toggle and on outside click, stays inside the viewport.

768: no sideways scroll on any page except `/help` (M2); filter drawer opens full height with "Show N stays".
375: no sideways scroll on detail pages, static pages or account pages; property booking calendar and WhatsApp block fit.

---
## Fix status (2026-10-31)
Fixed after this report: H1/H2 phone overflow, M1 Google button width, M2 Help overflow, M3 page titles, M4 404 page, M5 /vip-success guard, M6 Managed by Rentals Africa, M7 dashboard guard + stacked modals, M8 auth form reset, M9 header search Clear, M10 carousel arrows, L1 footer buttons, L2/L3 labels and main landmarks, L4 forgot-password email check, L6 header not sticky on phones, L8 welcome before city picker.
Not changed: L7 (Hotels tab starts with a city filter on), L9 (API returns 400 for invalid ids; UI already handles it).
