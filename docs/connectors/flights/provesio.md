---
title: Provesio (Legacy Flight API)
sidebar_label: Provesio
sidebar_position: 1
---

# Provesio (Legacy Flight API)

Provesio is the GDS-based flight supplier accessed through Al Rais's legacy API Gateway. The middleware does not call Provesio directly -- instead it calls a legacy flight-search service that handles Provesio auth, session management, async polling, caching, DynamoDB booking records, and SQS async booking pipelines internally. The middleware adds multi-supplier fan-out, offer normalization, deduplication, and curation.

## At a glance

| Property | Value |
|----------|-------|
| **Vertical** | Flights |
| **Commercial model** | GDS fare filing |
| **Auth** | Bearer (request-scoped JWT forwarding) |
| **Sandbox** | N/A (legacy API handles) |
| **Status** | Live |

## What our platform uses today

| Capability key | Description |
|---------------|-------------|
| `flight_search` | Multi-segment flight search with cabin class and passenger type mapping |
| `flight_book` | Two-step provisional booking + final ticketing |
| `flight_fare_rules` | Fare rule retrieval by offer ID |

## Endpoints we call

### searchFlights(request)

- **HTTP:** `POST ${legacyApiUrl}/flightSearch`
- **Timeout:** 45 seconds
- **Behaviour:** Builds segments from origin, destination, date, and cabin class. Maps passengers to `{ passengerType, quantity }` format. Returns normalized offers via `normalizeProvesioOffers()`.

### bookFlight(request)

- **HTTP:** `POST ${legacyApiUrl}/flightProvBooking`
- **Timeout:** 30 seconds
- **Behaviour:** Creates a provisional booking. The legacy service handles Provesio auth and `conversationId` lookup internally.

### confirmBooking(bookingId)

- **HTTP:** `POST ${legacyApiUrl}/reservationFlightBooking`
- **Timeout:** 30 seconds
- **Behaviour:** Final ticketing step. Extracts PNR from the response.

### getFareRules(offerId, searchKey?)

- **HTTP:** `POST ${legacyApiUrl}/fareRuleSearch`
- **Timeout:** 15 seconds
- **Behaviour:** Retrieves fare rules for a given offer. Accepts an optional `searchKey` for correlation.

## Auth mechanism

The connector uses `LegacyApiAuth` with `type='bearer'`. The caller's JWT from the frontend is forwarded verbatim to the legacy API Gateway. `setRequestToken()` is called before each orchestration cycle to inject the current token. `isExpired()` always returns `false` -- token validity is checked by the legacy API Gateway authorizer, not by the middleware.

## Normalizer mappings

| Provesio field | Normalized field |
|---------------|-----------------|
| `data[i].offerId` | `supplierOfferId` |
| `journey[j].flightSegments[k].marketingAirline` | `segment.carrier.iataCode` |
| `fare.totalFare` | `price.supplierTotal` |

**Cabin class mapping:**

| Provesio value | Normalized value |
|---------------|-----------------|
| `Y` / `ECONOMY` | `economy` |
| `W` / `PREMIUM_ECONOMY` | `premium_economy` |
| `C` / `BUSINESS` | `business` |
| `F` / `FIRST` | `first` |

The `searchKey` from the search response is attached to offer metadata for downstream booking correlation.

**Airline logos** are resolved from `https://emt-logos.s3.eu-west-1.amazonaws.com/airline-logos/{IATA}.png`.

**Duration parsing** handles three formats: ISO 8601 (`PT5H30M`), colon-separated (`5:30`), and raw minute strings.

## Rate limits

None enforced by the connector -- the legacy API Gateway handles all rate limiting internally.

## Integration notes

- The middleware never communicates with Provesio directly; all requests are proxied through the legacy flight-search service.
- Booking is a two-step process: `bookFlight` creates a provisional booking, `confirmBooking` issues the ticket and returns the PNR.
- The legacy service manages its own DynamoDB booking records and SQS async booking pipelines.

## Gap analysis

No gap analysis document exists for this supplier.

## Glossary

| Term | Definition |
|------|-----------|
| **GDS** | Global Distribution System -- aggregated airline inventory (Amadeus, Sabre, Travelport) |
| **PNR** | Passenger Name Record -- unique booking reference in the GDS |
| **Fare Basis** | Airline fare code that determines pricing rules and restrictions |
| **Booking Class** | Single-letter code (Y, B, M, etc.) indicating inventory bucket |
| **Cabin Class** | Travel class: economy, premium economy, business, first |
| **searchKey** | Provesio-specific correlation token linking a search session to its offers for downstream booking |
