# Rentals Africa Web — Project Checklist

Goal: a world-class, standard web app that shares the mobile app's brand (coral #F25F5C, navy #000D2E, Outfit + DM Sans) but is designed for desktop — not a copy of the phone UI.

STATUS 2026-10-31: all pages redesigned; brief features built (trips, saved, notifications, profile, host apply, filters, availability check, WhatsApp intent, host listings/bookings/reviews/earnings). Codebase cleanup done (153-file refactor, 17 test files, 146 tests green, ESLint clean). VIP availability check wired. Amenity/feature cleanList applied. NOT yet tested signed-in against the live API (needs a test account). Open: VIP services pause endpoint, delivery/licence fields, notifications read-flag shape, real social + store links.

Legend: [x] done · [ ] to do · [?] needs Rodiat's decision

## 0. Design system (foundation)
- [x] Brand tokens, shadows, fade-up animation (index.css)
- [x] Typography scale fixed (16px body, no text below 12px, no negative letter-spacing)
- [ ] Shared UI primitives: Button, Badge, Card, Section, PageHeader, Field/Input, Modal, EmptyState, Skeleton loaders
- [ ] Consistent page shell (max width 1360, spacing rhythm, breadcrumb)
- [ ] Skeleton loading instead of spinners
- [ ] Toast system (replace alert())
- [ ] Mobile-responsive pass on every page

## 1. Public / guest pages
- [x] Home (curated, featured, services, trust, grid)
- [x] Navbar, Footer, Welcome overlay, search bar text sizes
- [x] PropertyCard, CarCard sizes
- [ ] City selector modal
- [ ] Property detail page
- [ ] Hotel listing card + hotel details
- [ ] Car details
- [ ] VIP listing view, VIP card, VIP details, VIP service details, VIP success
- [ ] Booking widget + book modal (checkout look)
- [ ] Auth modal, forgot password, verify email, reset password
- [ ] About, Terms, Privacy, Sitemap
- [ ] List your property (host landing)

## 2. Guest account
- [ ] Guest dashboard (trips, saved, reviews, profile)
- [ ] Saved/favourites, My reviews, Write review
- [ ] Inbox / chat with host [?] parity with mobile
- [ ] Notifications [?]
- [ ] Wallet / payment methods [?]

## 3. Host
- [ ] Landlord dashboard (listings, bookings, earnings)
- [ ] Add/Edit property, car, hotel, VIP modals
- [ ] Bank setup, payout card
- [ ] Analytics (earnings charts) [?] parity with mobile
- [ ] Calendar / availability [?]

## 4. Admin
- [ ] Admin dashboard

## 5. Mobile parity - source of truth: Desktop/Rentals/app/docs/WEB-APP-BRIEF.md
Decision: keep web type LARGER than the brief's mobile scale (Rodiat complained text was tiny). Coral = actions only. Admin out of scope. Mobile-only (skip): QR pass/scan, fingerprint, push, GPS nearby, idle logout, widget.

Guest
- [x] Home hero/tabs/search/featured (redesigned)
- [ ] Filters (price, type, bedrooms/class, amenities, city Lagos/Abuja), sort, skeleton loading
- [ ] Listing detail: "Managed by Rentals Africa" only, verified pill, cancellation note
- [x] Availability check on Continue: "These dates have been booked." + Check availability button with nearby free-date chips (no "Currently unavailable" label) — also wired for VIP single-day dates
- [ ] Car: single 12h day bookable alone; chauffeur N25,000/12h; delivery toggle; licence acknowledgement
- [x] Quote: NO guest platform fee (corrected 2026-10-30: 5% commission comes out of host payout, host gets 95%)
- [ ] WhatsApp: POST /reservations/whatsapp-intent then wa.me with Reference
- [ ] Checkout success/failure screens
- [ ] Trips: upcoming/past/cancelled, detail, arrival guide, cancel + refund note, write review
- [ ] Saved page
- [ ] Notifications page (list, read, read-all, delete, clear-all refreshes once)
- [ ] Profile: edit, avatar (square crop), delete account
- [ ] Become a host: application + status
- [ ] Session expiry: 401 clears session, goes to login
- [ ] Cancellation wording; never name Paystack
- [ ] Privacy: guest and host never see each other's details
- [ ] Tags from real type; Hotels tab no shortlet labels

Host
- [x] Earnings tab (GET /hosts/analytics)
- [ ] My listings from landlord endpoints (hotels/portfolio, cars/landlord/fleet, vip/landlord) - blocked: no own-properties endpoint [?]
- [ ] Pause/resume (Mark as unavailable/available) [?] endpoint unknown
- [ ] Host bookings merged from 3 landlord endpoints, shown as "Booking #ABC123 / Managed by Rentals Africa"
- [ ] Payouts + bank setup (token bug fixed)
- [ ] Host reviews

Feature flags (do not fake; show "coming soon"): chat/inbox, wallet, saved cards, host calendar, public host profiles, PDF receipts, my-reviews, first-booking discount.

Web-only extras: SEO meta per listing, shareable URLs/copy link, print-friendly confirmation.

## 6. Quality & release
- [ ] Browser verification of every page (desktop + mobile width)
- [ ] Build passes, no console errors from our code
- [ ] Commit and push per milestone
- [ ] .env never committed
