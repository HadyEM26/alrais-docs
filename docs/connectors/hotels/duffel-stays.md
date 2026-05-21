---
title: Duffel Stays
sidebar_label: Duffel Stays
sidebar_position: 3
---

# Duffel Stays

Duffel Stays extends the Duffel platform into hotel distribution, sharing the same API credentials as the flights connector. The quote step acts as an implicit hold with approximately 30 minutes of validity. The connector reuses `DuffelBearerAuth` from the flights integration.

## At a glance

| Property | Value |
|----------|-------|
| **Vertical** | Hotels |
| **Commercial model** | Per-booking fee |
| **Auth** | Bearer (shared with Duffel Flights) |
| **Sandbox** | Token prefix `duffel_test_` |
| **Status** | Live |

## What our platform uses today

| Capability key | Description |
|---------------|-------------|
| `hotel_search` | Three-step search with paginated rate fetching |
| `hotel_book` | Two-step quote-then-book confirmation |
| `hotel_details` | Declared but returns `null` (no dedicated property endpoint in Duffel Stays) |
| `hotel_rate_fetch` | Rate retrieval during search flow |
| `hotel_quote` | Rate lock with ~30 minute hold validity |

The connector also implements `cancelBooking`.

## Endpoints we call

### searchHotels(request)

- **Flow:** Three-step process:
  1. `POST /stays/search` -- initiate the search
  2. `GET /stays/search_results/{id}/rates` -- fetch rates (paginated, up to `maxRatePages=3`)
  3. Combine and normalize results
- **Timeout:** 30 seconds
- **Behaviour:** Rate pages are paginated. The `maxRatePages` configuration caps the number of pages fetched to control latency and payload size.

### getHotelDetails(hotelId)

- **Returns:** `null`
- **Behaviour:** Duffel Stays does not have a dedicated property content endpoint. Hotel details are only available as part of the search response.

### bookHotel(offerId, guestDetails)

- **Flow:** Two-step process:
  1. `POST /stays/quotes` -- lock the rate (acts as implicit hold, ~30 min validity)
  2. `POST /stays/bookings` -- confirm the booking
- **Timeout:** 30 seconds per step
- **Behaviour:** The quote step validates rate availability and locks the price. The booking step finalizes the reservation.

### cancelBooking(bookingId)

- **HTTP:** `DELETE /stays/bookings/{bookingId}`
- **Timeout:** 30 seconds

## Auth mechanism

Duffel Stays shares the `DuffelBearerAuth` instance with the flights connector. All requests include:

- `Authorization: Bearer {token}`
- `Duffel-Version: v2`

Sandbox mode is automatically detected when the token starts with `duffel_test_`.

## Normalizer mappings

**Board basis mapping:**

| Value | Description |
|-------|-------------|
| `room_only` | No meals included |
| `breakfast` | Breakfast included |
| `half_board` | Breakfast and dinner included |
| `full_board` | All meals included |
| `all_inclusive` | All meals and selected drinks included |

## Rate limits

Duffel Stays shares the global rate limit of **60 requests per 60-second interval** with Duffel Flights. Both connectors draw from the same quota.

## Integration notes

- **API base URL:** `https://api.duffel.com`
- Rate pages are paginated during search. The `maxRatePages` configuration (default: 3) controls how many pages of rates the connector fetches, balancing completeness against latency.
- The quote step (`POST /stays/quotes`) doubles as an implicit hold mechanism with approximately 30 minutes of validity.
- `getHotelDetails()` returns `null` because Duffel Stays does not expose a standalone property content endpoint. All property information is embedded in search results.
- Credentials are shared with the Duffel Flights connector -- a single API token covers both verticals.
- The shared rate limit means high search volume on flights can impact stays availability and vice versa.

## Gap analysis

No gap analysis document exists for this supplier.

## Glossary

| Term | Definition |
|------|-----------|
| **Board Basis** | Meal plan included with the room (room only, breakfast, half board, full board, all inclusive) |
| **Net Rate** | Wholesale price before OTA markup -- the cost paid to the supplier |
