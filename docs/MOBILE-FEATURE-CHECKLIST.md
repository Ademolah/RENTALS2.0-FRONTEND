# Rentals Africa mobile app: complete feature checklist

Source: `app/src/app` (screens), `app/src/features`, `app/src/components`, `app/src/widget`, `app/src/lib/queries.ts`, `app/src/lib/features.ts` (30 Oct 2026).
Same API for web and mobile: `https://rentals2-0-server-2.onrender.com/api/v1`.

Tags (exactly one per line):
- **[BOTH]** should also exist on web
- **[MOBILE-ONLY]** unique to the phone app (device features)
- **[NOT-BUILT-API]** hidden because the API does not support it yet (flag in `src/lib/features.ts`)

Global rules that apply to every [BOTH] line: host and guest never see each other's details (only "Rentals Africa"); guests pay the listed price (the 5% commission comes out of the host payout); never name Paystack in the UI; Lagos and Abuja only; money in NGN. See `WEB-APP-BRIEF.md`.

---

## 1. Launch, onboarding and navigation
- [MOBILE-ONLY] Native splash + branded splash (`components/splash.tsx`): logo, tagline, fades after 0.8s
- [MOBILE-ONLY] Onboarding (`onboarding.tsx`): 3 image slides + "Everything in one place" card, Skip, Get Started, "I already have an account" (shown once). Web equivalent is the landing page
- [MOBILE-ONLY] Bottom tab bar (`(tabs)/_layout.tsx`): Home, Explore, Trips, Host, Profile. Web uses a top nav
- [BOTH] Error boundary / friendly crash screen (`components/error-boundary.tsx`)
- [BOTH] Toasts for success/error messages (`components/ui/toast.tsx`)
- [BOTH] Loading skeletons, empty states, error states (`components/ui/states.tsx`)
- [MOBILE-ONLY] Deep links `rentalsafrica://` (payment-success, host, notifications) (`+native-intent.tsx`). Web uses normal URLs
- [MOBILE-ONLY] Home-screen widget for hosts (`widget/*`)

## 2. Authentication and account
- [BOTH] Sign in with email + password (`login.tsx`) `POST /auth/login`
- [BOTH] Sign up: full name, email, phone, password (`signup.tsx`) `POST /auth/register`
- [BOTH] Email verification code after sign-up, resend code (`verify-email.tsx`)
- [BOTH] Forgot password: send reset link/code (`forgot.tsx`) `POST /auth/forgot-password`
- [BOTH] Reset password with token (`POST /auth/reset-password`)
- [BOTH] Google sign-in (`features/auth/social.tsx`), account picker every time
- [MOBILE-ONLY] Apple sign-in (iOS only)
- [BOTH] Choose account type: guest or host/landlord, Skip for now (`user-type.tsx`)
- [BOTH] Sign out (clears session, unregisters push token)
- [BOTH] Session expiry: a 401 clears the session and returns to sign-in (`lib/api.ts`)
- [BOTH] "Sign in to continue" gate: guest actions open sign-in, then resume the action (`requireAuth`)
- [MOBILE-ONLY] Fingerprint/Face ID quick sign-in: offer after sign-in, toggle in settings, credentials in secure hardware (`lib/biometric.ts`, `features/auth/biometric-setting.tsx`)
- [MOBILE-ONLY] Fingerprint/Face confirmation before paying (`confirmWithBiometric`, `checkout.tsx`)
- [MOBILE-ONLY] Auto sign-out after 3 minutes away, also after the app was fully closed (`lib/inactivity.ts`)

## 3. Home tab (`(tabs)/index.tsx`)
- [BOTH] Header with greeting, notification bell with unread dot, search entry
- [BOTH] Category shortcuts: Shortlets, Hotels, Cars, VIP (`/stays?tab=…`, `/cars`, explore `category=vip`)
- [BOTH] Search bar with dates/guests and Filters button
- [BOTH] Recommended/featured listing rows (`GET /properties`, `/hotels`, `/cars/all`, `/vip`)
- [BOTH] "Upcoming trip" card linking to the next booking
- [BOTH] City selector Lagos / Abuja (`store.city`)
- [MOBILE-ONLY] "Nearby, right now" shortcut (GPS)
- [MOBILE-ONLY] Image prefetching for the first recommendations
- [BOTH] Messages bell to inbox (hidden while chat is not built)

## 4. Explore, search, filters, map
- [BOTH] Explore list (`(tabs)/explore.tsx`): search box "Search shortlets, hotels, cars…", category chips, sort, 2-column grid, result count
- [BOTH] Recent searches (remembered, clear)
- [BOTH] Filters (`filters.tsx`): location/city, price range slider, bedrooms, bathrooms, amenities, type, sort, Clear All
- [BOTH] Date + guests filter (`components/trip-sheet.tsx`): range calendar, guests stepper, pickup/return time for cars (`checkIn`, `checkOut`, `guests` query params)
- [BOTH] List view / Map view toggle (`map.tsx`, `components/price-map.tsx`): price pins per listing
- [BOTH] "Nothing matches yet" empty state with reset
- [MOBILE-ONLY] Nearby, right now (`nearby.tsx`): GPS, stays and cars free tonight (`useAvailableTonight`)
- [BOTH] Stays list with Hotels / Shortlets tabs, hero, dates and guests bar, "Hotel/Shortlet of the week" featured first card (`stays.tsx`)
- [BOTH] Cars list: class chips (All, SUV, Luxury, Sedan, Chauffeur, Van), pickup location, dates and time (`cars.tsx`) `GET /cars/all`
- [BOTH] VIP list via Explore `category=vip` (venues + security services)
- [BOTH] Listing cards: image, type tag, title, area/city, rating, price/unit, favourite heart (`features/listings/cards.tsx`)

## 5. Listing detail (`listing/[id].tsx`)
- [BOTH] Image gallery with swipe and count (`features/listings/gallery.tsx`)
- [BOTH] Header: back, share, favourite (not for car/own listing)
- [BOTH] Tags: Verified, type, Breakfast included; title; location; rating + reviews
- [MOBILE-ONLY] Native share sheet. Web: copy link / web share
- [BOTH] Video tour (`features/listings/listing-video.tsx`)
- [BOTH] Description, amenities ("What this place offers"), "Show all"
- [BOTH] Stay facts: bedrooms, baths, guests, check-in/out times, minimum stay, weekly/monthly price hints
- [BOTH] Room types list for hotels with per-room Select Room (`GET /hotels/:id`)
- [BOTH] Vehicle specs: class, year, transmission, seats; licence requirement; features; delivery info (cars)
- [BOTH] VIP venue info: type, days open, hours, dress code, services, deposit; VIP security service info
- [BOTH] "Managed by Rentals Africa" card (replaces host profile) (`features/listings/managed-by.tsx`)
- [BOTH] Cancellation line ("No cancellation after check-in/pickup/arrival")
- [BOTH] Green "Book via WhatsApp" concierge button `POST /reservations/whatsapp-intent` then wa.me link
- [BOTH] Reviews list on the listing (`GET /reviews/:id`) with rating summary
- [BOTH] Sticky bottom bar with price and main CTA (Reserve / Select Room / Book Now / Manage listing)
- [BOTH] Own-listing mode: CTA becomes "Manage listing" (host)
- [BOTH] Map pin of the listing location (`components/pin-map.tsx`)
- [BOTH] No "Currently unavailable" label (availability is checked when continuing)

## 6. Booking sheet and checkout
- [BOTH] Booking sheet (`features/checkout/booking-sheet.tsx`): date range calendar with booked days struck out
- [BOTH] Cars: tap ONE day for a single 12-hour rental, tap a later day to extend; pickup/return time (return defaults to pickup + 12h)
- [BOTH] Room type select (hotels), guests stepper (stays)
- [BOTH] Car add-ons: chauffeur (NGN 25,000 per 12h, not on chauffeur-driven cars), delivery with address, licence acknowledgement
- [BOTH] VIP venue: one date, arrival time, party size; VIP security: day range
- [BOTH] Live price quote: lines + total, no guest-side fee (`lib/remote.ts quoteFor`)
- [BOTH] Availability checked on Continue: `POST /properties/:id/availability`, `GET /hotels/:id/rooms/:roomId/availability?checkIn&checkOut`, `POST /cars/:id/availability`
- [BOTH] "These dates have been booked" + Check availability button listing nearby free dates as chips
- [BOTH] Continue opens checkout (sign-in required)
- [BOTH] Book via WhatsApp instead (green icon), creates intent reference first
- [BOTH] Checkout (`checkout.tsx`): summary, dates, price breakdown, "Confirm and Pay"
- [BOTH] Pay online through the hosted payment page; success/return handling (`features/checkout/pay-in-browser.ts`, `payment-notice.tsx`) `POST /reservations/book`, `/cars/book`, `/vip/reserve`, `/vip/services/reserve` (callbackUrl `rentalsafrica://payment-success` on mobile; web uses its own URL)
- [BOTH] Payment sheet with bank-transfer details while waiting for confirmation (`features/checkout/payment-sheet.tsx`)
- [NOT-BUILT-API] First-booking discount in checkout (`GET /promotions/me`, flag `firstBookingDiscount`)
- [NOT-BUILT-API] Pay with saved card (flag `savedCards`)
- [NOT-BUILT-API] Pay from wallet balance (flag `wallet`)

## 7. Trips and bookings (guest)
- [BOTH] Trips tab (`(tabs)/trips.tsx`): Upcoming / Past / Cancelled, category filter All/Shortlets/Hotels/Cars/VIP; sign-in prompt when signed out
- [BOTH] Merged bookings from `GET /reservations/my-bookings`, `/cars/my-bookings`, `/hotels/guest/bookings`
- [BOTH] Booking detail (`booking/[id].tsx`): status, dates, guests, room type, price, reference, "Managed by Rentals Africa"
- [BOTH] Arrival guide: notes and photos from the host (`features/booking/arrival-guide.tsx`) `GET /reservations/:id/arrival-guide`
- [BOTH] Confirm check-in / pickup / arrival handshake with escrow explanation (`features/booking/handshake.tsx`, `components/escrow-badge.tsx`) `PATCH /reservations/:id/confirm-checkin`, `PATCH /hotels/guest/bookings/:id/confirm`, `PATCH /cars/reservations/:id/handover`
- [BOTH] Cancel booking sheet with refund explanation and terms note (`features/booking/cancel-sheet.tsx`) `POST /reservations/:id/cancel`
- [BOTH] Leave a review after the stay (`write-review/[id].tsx`) `POST /reviews/:id`
- [BOTH] Get Directions to the listing (opens maps; web: maps link)
- [MOBILE-ONLY] Check-in pass with QR code for the host to scan (`pass/[id].tsx`, `features/booking/checkin.ts`)
- [MOBILE-ONLY] Trip reminders as local notifications: day before, 1h before car pickup, check-out morning (`components/trip-reminders.tsx`)
- [NOT-BUILT-API] Download receipt as PDF (flag `receipts`)
- [NOT-BUILT-API] Message the host from a booking (flag `chat`)

## 8. Saved, reviews, notifications
- [BOTH] Saved listings (`saved.tsx`) `GET /users/favorites`, `POST /users/favorites/:id` (toggle heart anywhere)
- [BOTH] Listing reviews screen with summary and list (`reviews/[id].tsx`, `features/listings/review-parts.tsx`)
- [NOT-BUILT-API] My Reviews list (`my-reviews.tsx`, flag `myReviews`)
- [BOTH] Notifications list (`notifications.tsx`) `GET /notifications`: unread dot, type icon, relative date
- [BOTH] Mark one read `PATCH /notifications/:id/read`; mark all read (falls back to one by one)
- [BOTH] Delete one notification with confirmation; Clear all with confirmation (server has no delete route yet, so ids are hidden locally)
- [BOTH] Tap a notification to open its booking/screen (`components/notification-router.tsx`)
- [BOTH] Notification detail sheet on long press
- [MOBILE-ONLY] Push notifications: register token `POST /notifications/push-token`, unregister on sign-out (`lib/notifications.ts`)
- [MOBILE-ONLY] Local alerts for new items while the app is open (`components/local-notifier.tsx`)

## 9. Profile and settings (`(tabs)/profile.tsx`)
- [BOTH] Profile header: avatar, name, role
- [BOTH] Personal information (`personal-info.tsx`): full name, email (read only), phone, Save Changes `PATCH /users/me`
- [MOBILE-ONLY] Profile photo: pick from phone gallery, auto square crop, upload `PATCH /users/me/avatar` (web uses a file input; same endpoint)
- [BOTH] Delete my account `DELETE /users/me`
- [BOTH] Saved Listings, My Bookings & Trips shortcuts
- [BOTH] Terms of Service, Privacy Policy, About Rentals Africa (legal pages)
- [BOTH] Log Out
- [MOBILE-ONLY] Quick sign-in (fingerprint) toggle
- [NOT-BUILT-API] My Rentals Africa Wallet (`wallet.tsx`: balance, top-up, withdraw, transactions; flag `wallet`)
- [NOT-BUILT-API] Payment methods: saved cards (`payment-methods.tsx`, flag `savedCards`)
- [NOT-BUILT-API] Get verified: identity document upload (`verify/[id].tsx`, `useVerification`)
- [NOT-BUILT-API] Public provider/host profile page (`provider/[id].tsx`, flag `hostProfiles`)
- [BOTH] Help / contact (concierge WhatsApp link)

## 10. Messaging
- [NOT-BUILT-API] Inbox: conversation list (`inbox.tsx`, flag `chat`)
- [NOT-BUILT-API] Chat thread with "Rentals Africa" (`chat/[id].tsx`)
- [NOT-BUILT-API] Unread message badge

## 11. Become a host and host dashboard
- [BOTH] Host application: address, city, state, NIN `POST /hosts/apply`
- [BOTH] Application status Pending / Rejected / Approved, "Ask the concierge" button `GET /hosts/status`
- [BOTH] Host tab dashboard (`(tabs)/host.tsx`): earnings hero (released + in escrow), stats (listings, bookings, rating), quick actions Add Asset / Payouts / Scan Pass / Analytics
- [BOTH] Recent Reservations list showing "Booking #REF" and "Rentals Africa" only, status pill
- [BOTH] Arriving Today cards with renter-confirmed pill and confirm button
- [BOTH] Your Listings list: image, title, price/unit, LIVE / paused / pending status (`GET /hotels/landlord/portfolio`, `/cars/landlord/fleet`, `/vip/landlord`, `/properties?ownerId=`)
- [BOTH] Host bookings merged from `/properties/landlord-bookings`, `/cars/landlord/bookings`, `/hotels/landlord/bookings`
- [BOTH] Host booking detail: renter shown only as "Managed by Rentals Africa", payout after 5% commission, cancel reservation (payment goes to Rentals Africa for review)
- [BOTH] Host confirms check-in / handover / arrival: `POST /hotels/bookings/:id/confirm-checkin`, `PATCH /reservations/:id/confirm-checkin`, `PATCH /cars/reservations/:id/handover`, `POST /vip/confirm-arrival/:id`
- [MOBILE-ONLY] Scan guest pass with the camera (`scan.tsx`). Web: enter the booking code manually
- [BOTH] Earnings analytics (`host/analytics.tsx`): year totals, chart by month, per listing `GET /hosts/analytics`
- [BOTH] Earnings / payouts list and retry payout (`useHostPayouts`, `POST /payouts/execute/:bookingId`)
- [BOTH] Bank account setup: list banks, verify account number, save (`payment-methods.tsx` payout section) `GET /payouts/banks`, `POST /payouts/banks/verify`, `POST /payouts/banks/save`
- [BOTH] Host reviews of their listings (Guest Reviews screen)
- [BOTH] Suggested price helper when listing (`useSuggestedPrice`)
- [NOT-BUILT-API] Host calendar: block dates, seasonal rates (`host/calendar/[id].tsx`, flag `hostCalendar`)

## 12. Host listing: create, edit, manage
- [BOTH] Add Asset chooser (`host-listing.tsx`): Property, Hotel, Vehicle, VIP venue, VIP security service
- [BOTH] Create shortlet/property/hotel wizard (`new-listing.tsx`): type, title, description, address with locate-me, photos (up to 10 / hotel 15), amenities, rules, check-in/out, price, minimum stay, capacity, video, arrival photos, draft saved ("Save & Exit") `POST /properties`, `POST /hotels` (multipart)
- [BOTH] Hotel room types: add/remove rooms with price, features, units, guests (`host/rooms/[id].tsx`) sent as `roomTypes` JSON
- [BOTH] Create vehicle (`new-vehicle.tsx`): make, model, year, class, transmission, seats, price per 12h, features, location, delivery + fee, licence required, chauffeur option, photos (up to 5), video `POST /cars`
- [BOTH] Create VIP venue (`new-venue.tsx`): type, deposit, hours, days open, dress code, services, photos, Lagos/Abuja only `POST /vip`
- [BOTH] Create VIP security service (`new-service.tsx`): service type (Armed Escort, Close Protection, Convoy, Bodyguard, Airport Protocol, Other), daily rate, area, photos `POST /vip/services`
- [BOTH] Manage listing screen (`host/listing/[id].tsx`): stats, Edit details, Mark as unavailable / available, Rooms, View as guest, Delete
- [BOTH] Edit listing (`host/edit/[id].tsx`) `PATCH /properties/:id`, `PATCH /hotels/:id`, `PATCH /cars/:id`, `PUT /vip/:id`, `PATCH /vip/services/:id` with `existingImages`
- [BOTH] Delete listing (blocked when there are future reservations) `DELETE /properties/:id`, `/hotels/:id`, `/cars/:id`, `/vip/:id`, `/vip/services/:id`
- [BOTH] Arrival guide editor: notes and photos for guests (`features/host/arrival-photos.tsx`)
- [MOBILE-ONLY] "Locate me" GPS button to fill the address (`features/host/locate-button.tsx`). Web: address search
- [MOBILE-ONLY] Video picker from the phone library (`features/host/video-picker.tsx`). Web: file input
- [MOBILE-ONLY] Photo picker/camera and compression before upload (`lib/upload.ts`)
- [BOTH] Wizard UI parts: checklist items, selectable options (`features/host/wizard-ui.tsx`)

## 13. Shared UI building blocks (for design parity)
- [BOTH] Button (primary coral, dark, outline, outlineDark, ghost, link; optional icon colour), Pill, Chip, Segmented, Input, Select, Stepper, Toggle, Range slider, Progress, Rating stars, Avatar (dark variant with white initials), Bottom sheet (modal on web), Calendar (range / single / same-day cars), Price lines, Screen header, Promo header, Logo
- [BOTH] Colours, fonts, radii from `constants/theme.ts` (see `WEB-APP-BRIEF.md`)
- [BOTH] Business logic copied from `src/core`: cancellation policy/refund (`cancellation.ts`), escrow (`escrow.ts`), pricing and quote (`pricing.ts`, `quote.ts`), payment webhook routing is server side only

## 14. Summary
- [MOBILE-ONLY] QR pass + scanner, fingerprint/Face ID, push + local reminders, GPS nearby and locate-me, home-screen widget, native share, camera/gallery pickers, idle auto sign-out, Apple sign-in, deep links, bottom tabs + onboarding
- [NOT-BUILT-API] Chat/inbox, wallet, saved cards, host calendar, public host profiles, PDF receipts, My Reviews, first-booking discount, identity verification upload
- Everything else is **[BOTH]**
