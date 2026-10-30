# Rentals Africa web app: full brief (from the mobile app session)

Goal: the web app (RENTALS2.0-FRONTEND, own codebase) must be fully functional and look like the mobile app. Same company, same brand. Charles (client) wants parity "where it makes sense". Backend is the client's Render API: `https://rentals2-0-server-2.onrender.com/api/v1`. Docs are thin and partly wrong (e.g. `/hosts/...` not `/host/...`); when unsure, test the real response.

## 1. Brand and design system (copy exactly)

Colours: coral `#F25F5C` (CTAs, buttons, links only; pressed `#DC4A47`; soft `#FEEFEE`). Navy `#000D2E` (headings, icons, dark cards `#0C1B40`, border `#1D2C54`). Accent `#1A2B50`, accent soft `#EEF1F7`. Page light `#F7F7F7`, white `#FFFFFF`. Text `#0A1330`, secondary `#5B6275`, muted `#9197A6`, border `#E8E8E8`. Success `#1F9D63` (soft `#E8F6EF`), warning `#D98A00` (soft `#FFF4DD`), purple `#7A5AF8`, star `#F5A524`. WhatsApp green `#25D366` (only for WhatsApp buttons/icons).
Fonts: Outfit 700/600 for headings and prices; DM Sans 400/500/700 for body.
Type scale: h1 28/34, h2 22/28, h3 18/24, body 15/22, caption 13/18, label 11 caps with letter-spacing, price 18 Outfit.
Radius: 8 / 12 / 16 / 24 / pill. Soft shadows (very light). Premium, airy, image-led cards, rounded, generous whitespace.
Rules: coral is for actions only; decorative icons use navy/accent. Large text needs enough line-height so nothing is clipped. Everything must be responsive (phone width to wide desktop), fast (lazy images, skeletons, cache), accessible (labels, focus states, contrast), no horizontal scroll.
Money is Naira (NGN), format like N120,000.

## 2. Hard business rules (client's, apply to web too)

- PRIVACY: host and guest must NEVER see each other's names, phone numbers, emails or avatars. Both sides only see "Rentals Africa" as the middleman (booking lists, booking detail, chat, notifications, check-in). Host booking shows "Booking #ABC123" and "Managed by Rentals Africa".
- Do NOT show "Currently unavailable" on listings. Availability is checked when the user continues to book; if dates are taken, show "These dates have been booked." plus a "Check availability" button that lists nearby free dates as chips to pick.
- Hotels tab must never show shortlet labels. Card tags come from the real type (Hotel / Shortlet / Vacation Home / Studio / Car / Chauffeur / VIP / VIP Security). A featured first card reads "Featured Hotel" etc.
- Cars are priced per 12 hours. A guest must be able to book ONE day (12h) by selecting a single date; selecting a later date extends it. Same-day = 1 block minimum.
- Fees: guests pay the LISTED price only (no fee added to the guest's total, for every category). The platform's 5% commission is taken from the host's payout (host receives 95%). Chauffeur add-on N25,000 per 12 hours (not offered on chauffeur-driven cars). Delivery fee if the car offers delivery.
- Cancellation: show "Terms and conditions apply. Payment processing fees are non-refundable, so the refund amount may differ from the original payment." Rentals Africa reviews and processes refunds. NEVER name Paystack to users anywhere in the UI (say "payment processing").
- No cancellation after check-in / pickup / service start / arrival.
- Service area: Lagos and Abuja only.
- WhatsApp booking: a clear green "Book via WhatsApp" option on listings and "Book via WhatsApp instead" in the booking panel. Flow: POST `/reservations/whatsapp-intent` returns a reference, then open `https://wa.me/<concierge number>?text=<prefilled message with listing, dates, price, Reference>`.
- Profile photo: crop to a centred square before upload.

## 3. Screens and features the WEB must have

Public / guest
1. Home: hero ("Stay Somewhere Exceptional"), category tabs (Shortlets, Hotels, Cars, VIP), search bar (dates, guests, filters), recommended/featured rows, "Shortlet/Hotel of the week" featured card.
2. Stays (Hotels and Shortlets tabs), Cars, VIP lists: cards with image, tag, title, area/city, rating, price/unit, favourite heart. Filters (price, type, bedrooms/class, amenities, city Lagos/Abuja), sort, search, empty states, skeleton loading. Optional map view.
3. Listing detail: image gallery, title, tag, verified pill, rating and reviews, description, amenities, rules, host info shown ONLY as "Managed by Rentals Africa", room types (hotels), vehicle specs and licence requirement (cars), venue/service info (VIP), cancellation note, sticky booking panel with the CTA (Reserve / Select Room / Book Now) and green WhatsApp option.
4. Booking panel/modal: date range calendar (cars: single-day allowed), guests stepper, room select, car pickup/return time, chauffeur toggle, delivery toggle + address, licence acknowledgement, VIP date + arrival time + party size, live price quote with lines + total (no guest-side fee), availability check on Continue (see rules), then checkout.
5. Checkout: summary, price breakdown, pay online (payment processing page/redirect from the booking response), success and failure screens. Do not collect or store card data yourself.
6. My bookings / Trips: upcoming, past, cancelled; booking detail (status, dates, price, reference, arrival guide, cancel with refund explanation, write review after stay, receipt when available).
7. Saved (favourites).
8. Reviews: list on listings, write a review for a completed stay.
9. Notifications page: list, mark read, mark all read, delete one, clear all (clear all must delete everything then refresh ONCE so items do not reappear).
10. Auth: sign up (with email verification code), login, forgot/reset password, Google sign-in, sign out, session expiry handling (401 clears session and goes to login). Optional 3-minute-idle auto sign-out is mobile; on web use normal token expiry.
11. Profile: personal info edit, profile photo, change interests, delete account, legal pages (Terms, Privacy), help/contact.
12. Become a host: host application + status.

Host side
13. Host dashboard: earnings hero (big amount, lineHeight must not clip), active reservations, arriving today, quick stats.
14. My listings: create and edit per type (property/shortlet, hotel + rooms, car, VIP venue, VIP service), photo upload, pause/resume ("Mark as unavailable/available"), delete, approval status.
15. Host bookings (three landlord endpoints merged), confirm check-in/handover steps, cancel reservation (payment goes to Rentals Africa for review).
16. Earnings analytics (GET `/hosts/analytics`), payouts, bank account setup (banks list, verify account, save).
17. Host reviews for their listings.

Admin is out of scope unless Charles asks.

## 4. Mobile-only (do NOT build on web)
QR check-in pass and scanner, fingerprint/Face ID sign-in, push and local trip reminders, "nearby / available tonight" using GPS, 3-minute inactivity auto-logout, home-screen widget, native camera picker, native share sheet (use web share/copy link instead).

## 5. Web-only (fine to add)
SEO pages and meta tags per listing, shareable URLs, desktop multi-column layouts with sticky booking panel, footer (About, Terms, Privacy, Contact, Lagos/Abuja), keyboard navigation, print-friendly receipts/booking confirmation, larger tables for host bookings and earnings, bulk listing management.

## 6. NOT supported by the API yet (hide or show "coming soon"; do not fake)
In-app chat/inbox, wallet and top-ups, saved cards, host calendar (block dates/seasonal rates), public host profile pages, PDF receipts, "my reviews" list, first-booking discount (`GET /promotions/me` exists but unconfirmed). Keep each behind a feature flag so it can be switched on when the endpoints exist.

## 7. Endpoints the mobile app uses (all under /api/v1)
Auth/profile: `/users/me` (GET, PATCH), `/users/me/avatar` (PATCH), favourites `/users/favorites` (GET), `/users/favorites/:id` (POST toggles).
Listings: `/properties`, `/properties/:id`, `/hotels`, `/hotels/:id`, `/cars`, `/cars/:id`, `/vip` (venues), `/vip/services`; reviews `/reviews/:id`.
Availability: POST `/properties/:id/availability` {startDate,endDate}; GET `/hotels/:id/rooms/:roomId/availability?checkIn&checkOut`; POST `/cars/:id/availability` {startDate,endDate as ISO with +01:00}. VIP has no availability route (server checks at booking).
Book: POST `/reservations/book` (shortlets), `/cars/book`, `/vip/reserve`, `/vip/services/reserve`; each returns a payment page link to open. WhatsApp intent: POST `/reservations/whatsapp-intent`.
My bookings: `/reservations/my-bookings`, `/cars/my-bookings`, `/hotels/guest/bookings`. Cancel: POST `/reservations/:id/cancel`. Arrival guide: GET `/reservations/:id/arrival-guide`.
Host: `/properties/landlord-bookings`, `/cars/landlord/bookings`, `/hotels/landlord/bookings`, `/hotels/landlord/portfolio`, `/cars/landlord/fleet`, `/vip/landlord`, create/edit with PATCH/PUT/DELETE on `/cars/:id`, `/hotels/:id`, `/properties/:id`, `/vip/:id`, `/vip/services/:id`; `/hosts/analytics`, `/hosts/status`; payouts `/payouts/banks`, `/payouts/banks/verify`, `/payouts/banks/save`, POST `/payouts/execute/:bookingId`.
Notifications: GET `/notifications`, PATCH `/notifications/:id/read`, PATCH `/notifications/read-all`, DELETE `/notifications/:id`.

## 8. Quality bar
Every button must work end to end against the real API; every list has loading, empty and error states; forms validate and show clear messages; no dead links; consistent spacing/typography with the tokens above; test at 360px, 768px and 1440px widths; keep it fast. Ask Rodiat for anything the API cannot do rather than inventing data.
