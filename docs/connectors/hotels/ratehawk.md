---
title: RateHawk (ETG)
sidebar_label: RateHawk
sidebar_position: 1
---

# RateHawk (ETG)

RateHawk, operated by Emerging Travel Group (ETG), is a B2B hotel distribution platform offering access to 2.5M+ properties worldwide. The platform uses a net-rate merchant model -- the OTA buys at wholesale and sets its own retail price. RateHawk provides the ETG API v3.

## At a glance

| Property | Value |
|----------|-------|
| **Vertical** | Hotels |
| **Commercial model** | Net rates (merchant model) |
| **Auth** | Basic (base64-encoded `KEY_ID:API_KEY`) |
| **Sandbox** | `https://api-sandbox.worldota.net/api/b2b/v3` |
| **Status** | Live |

## What our platform uses today

| Capability key | Description |
|---------------|-------------|
| `hotel_search` | Region-based hotel search with destination resolution |
| `hotel_book` | Three-step async booking with polling |
| `hotel_details` | Static hotel content (name, stars, address, coordinates, images) |
| `hotel_rate_fetch` | Rate prebook with price-lock confirmation |

The connector also implements `holdHotel`, `cancelBooking`, `getBookingStatus`, and `healthCheck` operations.

## Endpoints we call

### searchHotels(request)

- **HTTP:** `POST /search/serp/region/`
- **Timeout:** 30 seconds
- **Behaviour:** Uses `resolveRegionId()` for destination resolution across 53 mapped regions. Returns an empty result set if the destination cannot be resolved to a known region ID.

### getHotelDetails(hotelId)

- **HTTP:** `POST /hotel/info/`
- **Timeout:** 10 seconds
- **Behaviour:** Returns static hotel content: name, star rating, address, geographic coordinates, and image gallery.

### prebookRate(matchHash)

- **HTTP:** `POST /hotel/prebook/`
- **Timeout:** 30 seconds
- **Behaviour:** Locks the selected rate and confirms the price. The response includes a `price_changed` flag indicating whether the rate shifted since the search.

### holdHotel(matchHash)

- **Mechanism:** Uses `prebookRate()` as an implicit hold
- **Hold duration:** Approximately 38 minutes (`match_hash` lifetime)
- **Behaviour:** Returns a `provisional` status with price change metadata. No dedicated hold endpoint exists -- the prebook step serves as the hold mechanism.

### bookHotel(matchHash, guestDetails)

- **Flow:** Three-step asynchronous process:
  1. `POST /hotel/order/create/` -- create the order
  2. `POST /hotel/order/start/` -- initiate booking processing
  3. Poll `POST /hotel/order/info/` -- check status (2-second interval, max 15 attempts)
- **Partner order ID format:** `ALR-{uuid8}`
- **Behaviour:** Booking is asynchronous. The connector polls the order info endpoint until the booking is confirmed or the maximum retry count is reached.

### cancelBooking(orderId)

- **HTTP:** `POST /hotel/order/cancel/`
- **Timeout:** 30 seconds

### getBookingStatus(orderId)

- **HTTP:** `POST /hotel/order/info/`
- **Timeout:** 10 seconds

### healthCheck()

- **Probe:** Minimal search query (Dubai, 1 night, 1 adult)
- **Timeout:** 10 seconds
- **Behaviour:** Used as a connectivity health probe to verify API availability.

## Auth mechanism

The connector uses `RateHawkBasicAuth`. All requests include:

- `Authorization: Basic {base64(keyId:apiKey)}`

The `isSandbox()` method returns `true` if the configured `baseUrl` contains `'sandbox'`.

## Region mapping

The connector maintains 53 mapped region entries covering:

- **UAE:** DXB, AUH, SHJ, RKT
- **Major global hubs:** Additional international destinations

`resolveRegionId()` attempts resolution in three steps:

1. Exact match on the input string
2. Uppercase match (for IATA codes)
3. Lowercase match (for city names)

If none of these produce a match, the search returns an empty result.

## Normalizer mappings

**Meal type mapping:**

| RateHawk value | Normalized value |
|---------------|-----------------|
| `nomeal` | Room Only |
| `breakfast` | Breakfast Included |
| `half-board` | Half Board |
| `full-board` | Full Board |
| `all-inclusive` | All Inclusive |

**Room class labels:**

| Code | Label |
|------|-------|
| 1 | Economy |
| 2 | Standard |
| 3 | Comfort |
| 4 | Superior |
| 5 | Premium |

**View labels:**

| Code | Label |
|------|-------|
| 1 | City |
| 2 | Garden |
| 3 | Sea |
| 4 | Ocean |

## Sandbox

- **Sandbox URL:** `https://api-sandbox.worldota.net/api/b2b/v3` (auto-selected when credentials are configured for sandbox)
- **Production URL:** `https://api.worldota.net/api/b2b/v3`

ETG sandbox note: retry cancel operations on timeout, as the sandbox environment can be unreliable for cancellation responses.

## Integration notes

- Booking is fully asynchronous -- the three-step create/start/poll flow is required. There is no synchronous booking confirmation.
- The `match_hash` from a search result has an approximate 38-minute lifetime. After expiry, a new search is required.
- `prebookRate()` serves double duty: it locks the rate for booking and acts as the implicit hold mechanism.
- Partner order IDs follow the format `ALR-{uuid8}` for traceability.
- The health check uses a minimal Dubai search as its probe, so connectivity issues specific to other regions may not be detected.

## Gap analysis

No gap analysis document exists for this supplier.

## Glossary

| Term | Definition |
|------|-----------|
| **Net Rate** | Wholesale price before OTA markup -- the cost paid to the supplier |
| **Board Basis** | Meal plan included with the room (room only, breakfast, half board, full board, all inclusive) |
| **Allotment** | Block of rooms pre-negotiated with a hotel at a fixed rate |
| **ADR** | Average Daily Rate -- total room revenue divided by number of rooms sold |
