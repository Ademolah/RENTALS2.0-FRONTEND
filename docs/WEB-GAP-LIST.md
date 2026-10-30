# Web vs mobile [BOTH] gap list (audit of 2026-10-30)

Source: Desktop/Rentals/app/docs/MOBILE-FEATURE-CHECKLIST.md, [BOTH] lines of sections 1-13. Verified by reading web code (grep + file reads), not by running signed-in flows.

Status: DONE = exists and wired; PARTIAL = exists but part missing; MISSING = not in web.
Totals: 111 lines, DONE 75, PARTIAL 25, MISSING 11.

## 1. Launch, onboarding, navigation
- MISSING Error boundary / friendly crash screen: no ErrorBoundary/componentDidCatch anywhere. Needs a boundary around Routes in App.jsx.
- MISSING Toasts: no shared toast; pages use inline notice boxes, PropertyCard has its own local toast, one alert() left. Needs a ToastProvider.
- PARTIAL Skeletons/empty/error states: done in browse lists, Trips, Saved, Notifications, dashboards; detail pages (Property/Hotel/Car/Vip) still use spinners.

## 2. Authentication and account
- DONE Sign in (AuthModal, POST /auth/login)
- DONE Sign up (AuthModal, /auth/register)
- DONE Email verification + resend (VerifyEmailModal)
- DONE Forgot password (ForgotPasswordModal)
- DONE Reset password (pages/ResetPassword.jsx)
- DONE Google sign-in (AuthModal GoogleLogin)
- PARTIAL Choose account type guest/host: only a USER/LANDLORD toggle inside the sign-up form; no "Skip for now" step or post-login chooser.
- DONE Sign out (Navbar menu)
- DONE Session expiry: client.js 401 clears session, reopens sign-in
- DONE (group 6) "Sign in to continue" gate with resume: AuthContext.requireAuth(action) runs the action after sign-in/Google/verify; callers must adopt it (FavoriteHeart, Reserve) to benefit.

## 3. Home
- DONE (group 4) Header with greeting + bell with unread dot: unread badge exists only in the Navbar profile menu; Home has no greeting/bell header.
- DONE Category shortcuts (Home service cards, Navbar tabs)
- DONE Search bar dates/guests/filters (AdvancedSearch + browse filter panel)
- DONE Recommended/featured rows (Home featured card + grid, VipListingView, HotelCard)
- DONE (group 4) "Upcoming trip" card on Home: only a tile on GuestDashboard.
- DONE City selector Lagos/Abuja (CitySelectorModal)
- DONE Messages bell hidden (chat not built, nothing shown)

## 4. Explore, search, filters, map
- DONE Explore list with category tabs, sort, grid (Home + components/browse/BrowseShell)
- DONE (group 4) Free-text search "Search shortlets, hotels, cars": AdvancedSearch searches location/service only, not a listing keyword search across categories.
- DONE (group 4) Recent searches (remember, clear)
- DONE (group 4) Filters: city, price, bedrooms, rating, amenities, sort, clear-all exist; bathrooms and property type filters are missing for shortlets.
- DONE Date + guests filter (AdvancedSearch; cars pickup/drop-off dates)
- DONE (group 4) List / Map view toggle with price pins (shortlets, cars, hotels; listings without coordinates are pinned near their neighbourhood like mobile): InteractiveMap exists only on detail pages.
- DONE "Nothing matches" empty state with reset (browse/States.jsx)
- DONE Stays list Hotels/Shortlets tabs, hero, featured first card (Home, "Featured Hotel/Shortlet")
- DONE Cars list class chips, dates (Home CAR_FILTERS + AdvancedSearch)
- DONE VIP list venues + security services (VipListingView)
- DONE Listing cards with tag, rating, price, heart (PropertyCard, CarCard, HotelCard, VipCard)

## 5. Listing detail
- DONE Gallery: mosaic + lightbox with keyboard, touch swipe and photo count on shortlet, hotel, VIP venue and VIP service pages (group 2).
- DONE Header back / share (copy link) / favourite (ShareButton, FavoriteHeart)
- DONE Tags verified/type/breakfast
- DONE Video tour (PropertyDetail, CarDetails)
- DONE Description + amenities + show all
- DONE Stay facts: check-in/out times, 1-night minimum, weekly/monthly hint (components/detail/extras.jsx StayFacts) on shortlet and hotel pages (group 2).
- DONE Hotel room types with select (HotelDetails)
- PARTIAL Vehicle specs/licence/features/delivery info: specs and licence acknowledgement done; delivery info and fee not shown.
- DONE VIP venue info (dress code, hours, deposit) and security service info (VipDetails, VipServiceDetails)
- DONE "Managed by Rentals Africa" on all detail pages
- DONE Cancellation line
- DONE Green Book via WhatsApp with intent reference (all four detail types)
- DONE Reviews list + rating summary on shortlet, hotel, VIP venue and VIP service pages (shared ReviewsSection, GET /reviews/:id); reviewers shown as 'Verified guest'. Cars have no reviews on mobile either (group 2).
- DONE Sticky price + CTA panel (BookingWidget, HotelDetails mobile bar)
- DONE Own-listing mode: owner sees a 'Manage listing' card instead of the booking panel (isOwnListing + ManageListingCard; CarDetails left to group 3).
- DONE Map pin of listing location (InteractiveMap on PropertyDetail)
- DONE No "Currently unavailable" label

## 6. Booking and checkout
- DONE Date range calendar with booked days struck out: shortlet widget and car calendar strike booked days (BookingWidget fetches the listing's bookedDates; CarDetails uses car.bookedDates). Hotel rooms are checked per room by the availability API.
- DONE Cars single 12-hour day, later date extends (CarDetails slotRange)
- DONE Room select + guests stepper
- DONE Car add-ons: delivery toggle + address + fee added (fee included in the total; the address is shown at checkout and in the WhatsApp message, but /cars/book has no delivery field, same as mobile).
- DONE VIP venue date/arrival/party size; security day range
- DONE Live quote, no guest fee
- DONE Availability on Continue (AvailabilityNotice, lib/availability.js)
- DONE "These dates have been booked" + nearby date chips
- DONE Continue requires sign-in (opens AuthModal)
- DONE Book via WhatsApp instead (/reservations/whatsapp-intent then wa.me)
- DONE Checkout screen: /checkout summary with price lines, escrow + cancellation note, Confirm and pay (shortlets, hotels, cars; VIP pages still go straight to the payment page).
- DONE Pay online redirect + return (callback /trips, VipSuccess for VIP)
- BLOCKED Payment sheet with bank-transfer details: the server's booking response only returns a hosted payment link, no transfer account; mobile's TransferSheet is defined but never fed by an API. Needs an endpoint from Charles.

## 7. Trips (guest)
- DONE Trips: tabs + category filter All/Shortlets/Hotels/Cars/VIP (pages/Trips.jsx).
- DONE Merged bookings from 3 endpoints (api/trips.js)
- DONE Booking detail (account/BookingDetail.jsx)
- DONE Arrival guide
- DONE Confirm check-in / pickup / arrival (confirmArrival)
- DONE Cancel with refund explanation and terms note
- DONE Leave a review after stay (submitReview)
- DONE Get directions link in booking detail (Google Maps search)

## 8. Saved, reviews, notifications
- DONE Saved listings page (pages/Saved.jsx)
- DONE Listing reviews screen: /reviews/:id with summary, star filter and full list (pages/Reviews.jsx) (group 2).
- DONE Notifications list with unread, icons, relative date
- DONE Mark one / all read
- DONE Delete one and Clear all with confirmation (ids hidden locally; server has no delete route)
- DONE Tap a notification opens its detail, then the exact booking (/trips?booking=ID).
- DONE Notification detail dialog; Open booking deep-links to /trips?booking=ID

## 9. Profile and settings
- DONE Profile header avatar/name/role (pages/Profile.jsx)
- DONE Personal information edit
- DONE Delete account (confirm)
- DONE Saved / My bookings shortcuts
- DONE Terms, Privacy, About pages
- DONE Log out
- DONE Help / contact with WhatsApp (pages/Help.jsx)

## 10. Messaging
- (all NOT-BUILT-API, skipped)

## 11. Become a host and host dashboard
- DONE Host application (HostUpgradeModal, POST /hosts/apply)
- DONE Application status (GET /hosts/status on Profile)
- PARTIAL Host dashboard hero: tabs and stat tiles exist; no earnings hero with released vs in-escrow, no quick actions row.
- DONE Recent reservations masked as "#REF / Managed by Rentals Africa"
- PARTIAL Arriving Today cards: no "arriving today" section; confirmations are inside Ledger & Actions.
- DONE Your listings with LIVE/paused/pending status (components/host/hostApi.js)
- DONE Host bookings merged from 3 endpoints
- PARTIAL Host booking detail: masked renter and payout shown; no cancel-reservation action.
- DONE Host confirms check-in/handover/arrival (LandlordDashboard handlers for all 4 types)
- DONE Earnings analytics (GET /hosts/analytics, Earnings tab)
- PARTIAL Earnings/payouts list and retry: executePayout exists in api/payouts.js but PayoutActionCard is not rendered in LandlordDashboard.
- DONE Bank account setup (BankSetupModal)
- DONE Host reviews tab
- MISSING Suggested price helper when creating a listing

## 12. Host listing create/edit/manage
- DONE Add Asset chooser (separate modals per type opened from dashboard)
- PARTIAL Create shortlet/property/hotel: modals create with photos/amenities/price; no Save & Exit draft, no address search/locate, no arrival photos.
- DONE Hotel room types add/remove (CreateHotelModal roomTypes)
- PARTIAL Create vehicle: AddCarModal lacks delivery + delivery fee fields.
- DONE Create VIP venue (AddVipModal)
- DONE Create VIP security service (AddVipModal serviceType)
- PARTIAL Manage listing: cards have Edit / Mark unavailable / Delete; no per-listing stats, Rooms shortcut or "View as guest".
- DONE Edit listing for all types (Edit*Modal)
- DONE Delete listing (DeleteAssetModal; server blocks future reservations)
- MISSING Arrival guide editor (notes + photos for guests)
- DONE Wizard UI parts (checklists, options inside modals)

## 13. Shared UI and logic
- PARTIAL Component set: ui.jsx has Button, Badge, Card, Container, PageHero, SectionTitle, EmptyState, Skeleton, ConfirmDialog, CityBackdrop, WhatsAppIcon; Stepper, Toggle, Segmented, Range, Rating, Avatar are inline per page, not shared.
- DONE Colours, fonts, radii (index.css tokens)
- PARTIAL Business logic: refund note text and pricing live inline in components; no shared cancellation-policy / escrow / quote module.

---

# TO BUILD (priority order; groups own disjoint files)

1. **Account + trips polish** (files: pages/Trips.jsx, pages/Notifications.jsx, components/account/*, api/trips.js, api/notifications.js)
   Trips category filter, Get Directions link, notification tap opens the exact booking, notification detail view.
2. **Detail-page reviews and facts** (files: pages/PropertyDetail.jsx, pages/HotelDetails.jsx, pages/VipDetails.jsx, components/VipServiceDetails.jsx, api/reviews.js, new pages/Reviews.jsx + App.jsx route)
   DONE (group 2): reviews + summary + reviews page, stay facts, gallery swipe/count, own-listing Manage CTA, Get directions link under the map on detail pages. Not done: CarDetails (group 3).
3. **Booking and checkout** (files: pages/CarDetails.jsx, components/BookingWidget.jsx, components/BookModal.jsx, api/car.js, api/reservation.js, new pages/Checkout.jsx)
   Car delivery toggle + address + delivery info, booked-days marked in calendars, checkout summary step, bank-transfer payment sheet.
4. **Browse and home** (files: pages/Home.jsx, components/AdvancedSearch.jsx, components/browse/*)
   Recent searches, free-text listing search, bathrooms + property type filters, list/map toggle with price pins, Home greeting + bell + upcoming-trip card.
5. **Host dashboard and listing forms** (files: pages/LandlordDashboard.jsx, components/Add*Modal.jsx, Create*Modal.jsx, Edit*Modal.jsx, components/PayoutActionCard.jsx, components/host/*)
   Earnings hero, Arriving Today, payouts list + retry, cancel reservation, suggested price, arrival guide editor, car delivery fields, draft save, manage-listing stats/View as guest.
6. **Auth flow** (files: components/AuthModal.jsx, context/AuthContext.jsx)
   DONE: "What brings you here?" step with Skip after sign-up, interests editable on Profile, field validation, show/hide password, resend code, requireAuth resume.
7. **Cross-cutting** (files: App.jsx, main.jsx, new components/Toast.jsx + ErrorBoundary.jsx; later ui.jsx additions)
   ErrorBoundary, ToastProvider replacing inline notices and the last alert(), skeletons on detail pages, shared Stepper/Toggle/Segmented/Range, shared cancellation/pricing modules. Do last; touches App.jsx and many pages.
