---
title: Hotelbeds
sidebar_label: Hotelbeds
sidebar_position: 2
---

# Hotelbeds

Hotelbeds is the world's largest bedbank (hotel wholesaler), distributing 300,000+ hotel properties. They operate on a net-rate merchant model with HMAC-authenticated API access. The integration is currently in search-only mode -- the booking flow (checkrates followed by booking confirmation) is planned for Phase 4.

## At a glance

| Property | Value |
|----------|-------|
| **Vertical** | Hotels |
| **Commercial model** | Net rates (merchant model) |
| **Auth** | HMAC (SHA-256 signature) |
| **Sandbox** | `https://api.test.hotelbeds.com/hotel-api/1.0` (default) |
| **Status** | Built (booking Phase 4) |

## What our platform uses today

| Capability key | Description |
|---------------|-------------|
| `hotel_search` | Hotel availability search |
| `hotel_book` | Declared but throws "not yet implemented" |

The connector declares booking capability but currently throws an error if invoked. Search is fully operational.

## What the supplier API offers that we don't use yet

| Endpoint | Purpose | Phase |
|----------|---------|-------|
| `POST /checkrates` | Pre-booking rate validation and confirmation | Phase 4 |
| `POST /bookings` | Booking confirmation | Phase 4 |
| `POST /bookings/{id}/cancel` | Booking cancellation | Phase 4 |

These three endpoints form the complete booking lifecycle: validate rate, confirm booking, and cancel if needed.

## Endpoints we call

### searchHotels(request)

- **HTTP:** `POST /hotels`
- **Implementation:** Uses native `fetch`
- **Behaviour:** Searches hotel availability. Results are normalized through the Hotelbeds normalizer.

### bookHotel(offerId, guestDetails)

- **Status:** Not implemented
- **Behaviour:** Throws `"Hotelbeds booking not yet implemented"`. The Phase 4 plan involves a two-step flow: `POST /checkrates` to validate the rate, then `POST /bookings` to confirm.

### getHotelDetails(hotelId)

- **Status:** Not implemented
- **Behaviour:** Throws `"Hotelbeds hotel details not yet implemented"`. Planned as a Phase 4 extension.

### healthCheck()

- **HTTP:** `GET /status`
- **Behaviour:** Returns one of three states: `healthy`, `degraded`, or `down`.

## Auth mechanism

The connector uses `HotelbedsHmacAuth`. Each request is signed with:

- **Signature:** `SHA256(apiKey + secret + unixTimestamp)`
- **Headers:**
  - `Api-key` -- the API key
  - `X-Signature` -- the computed HMAC signature

The signature is recomputed for every request using the current Unix timestamp, ensuring each request has a unique, time-bound signature.

## Normalizer mappings

**Board code mapping:**

| Hotelbeds code | Normalized value |
|---------------|-----------------|
| `RO` | `room_only` |
| `BB` | `breakfast` |
| `HB` | `half_board` |
| `FB` | `full_board` |
| `AI` | `all_inclusive` |

**Star rating:** Parsed from the category code string (e.g., `"5EST"` extracts to `5`).

**Review score:** Normalized from the Hotelbeds 0--10 scale to a 0--5 scale.

## Integration notes

- The connector defaults to the **TEST/sandbox** endpoint (`https://api.test.hotelbeds.com/hotel-api/1.0`). The production URL must be passed explicitly via configuration.
- HMAC signatures are time-sensitive -- clock drift between the middleware and Hotelbeds servers can cause auth failures.
- Search is fully operational and participates in multi-supplier fan-out for hotel queries.
- The booking lifecycle (checkrates, bookings, cancellations) is deferred to Phase 4 of the integration roadmap.

## Gap analysis

No gap analysis document exists for this supplier.

## Glossary

| Term | Definition |
|------|-----------|
| **Bedbank** | Hotel wholesaler that aggregates inventory from hotels and distributes to travel agencies and OTAs |
| **Net Rate** | Wholesale price before OTA markup -- the cost paid to the supplier |
| **Board Basis** | Meal plan included with the room (room only, breakfast, half board, full board, all inclusive) |
| **Allotment** | Block of rooms pre-negotiated with a hotel at a fixed rate |
| **HMAC** | Hash-based Message Authentication Code -- a cryptographic signature using a shared secret |
