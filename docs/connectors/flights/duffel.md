---
title: Duffel
sidebar_label: Duffel
sidebar_position: 2
---

# Duffel

Duffel is a modern flight distribution platform that connects to airlines via NDC and traditional GDS channels through a REST API. Unlike legacy GDS integrations, Duffel provides a developer-friendly JSON API with real-time pricing and instant booking confirmation.

## At a glance

| Property | Value |
|----------|-------|
| **Vertical** | Flights |
| **Commercial model** | Per-booking fee |
| **Auth** | Bearer (static API token) |
| **Sandbox** | Token prefix `duffel_test_` |
| **Status** | Live |

## What our platform uses today

| Capability key | Description |
|---------------|-------------|
| `flight_search` | Offer request with full offer return |
| `flight_book` | Instant order creation with balance payment |
| `fare_calendar` | Cheapest-per-date fare lookup across a date range |

The connector also implements `holdFlight` and `cancelFlight` operations.

## Endpoints we call

### searchFlights(request)

- **HTTP:** `POST /air/offer_requests?return_offers=true`
- **Timeout:** 130 seconds (Duffel recommended minimum)
- **Behaviour:** Creates an offer request and returns all available offers in a single response. Monitors the `ratelimit-remaining` response header and logs a warning when fewer than 5 requests remain in the current window.

### bookFlight(request)

- **HTTP:** `POST /air/orders`
- **Timeout:** 60 seconds
- **Behaviour:** Creates an order with `payment_type: balance`. Booking status is `confirmed` immediately -- Duffel does not require a two-step provisional-then-confirm flow.

### holdFlight(request)

- **HTTP:** `POST /air/orders` with `type: 'hold'`
- **Timeout:** 60 seconds
- **Behaviour:** Creates a held order with no payment required. Returns a `provisional` status with a `payment_required_by` expiry timestamp.

### cancelFlight(orderId)

- **HTTP:** `POST /air/order_cancellations`
- **Timeout:** 30 seconds
- **Behaviour:** Cancels a confirmed order. Returns refund details.

### getFareCalendar(request)

- **HTTP:** `POST /air/offer_requests` with partial dates
- **Timeout:** 60 seconds
- **Behaviour:** Groups returned offers by departure date and selects the cheapest offer per date to build a fare calendar view.

## Auth mechanism

The connector uses `DuffelBearerAuth`. All requests include two headers:

- `Authorization: Bearer {token}`
- `Duffel-Version: v2`

The `isSandbox()` method returns `true` if the configured token starts with `duffel_test_`, enabling automatic sandbox detection.

## Rate limits

Duffel enforces **60 requests per 60-second interval** globally. This limit is shared between the flights and stays connectors. The connector monitors the `ratelimit-remaining` response header and logs a warning when the remaining quota drops below 5.

## Integration notes

- **API base URL:** `https://api.duffel.com`
- **Duration parsing** handles ISO 8601 format (`PT5H30M`).
- Booking is single-step: `bookFlight` creates a confirmed order immediately with balance payment.
- Holds have a supplier-defined expiry (`payment_required_by`) after which the held inventory is released.
- Sandbox mode is automatically detected from the API token prefix -- no separate configuration is needed.
- The fare calendar capability enables date-flexible search UIs by returning the cheapest available fare per departure date.

## Gap analysis

No gap analysis document exists for this supplier.

## Glossary

| Term | Definition |
|------|-----------|
| **NDC** | New Distribution Capability -- IATA standard for airline direct distribution |
| **Fare Brand** | Airline-defined fare product (e.g., Basic Economy, Flex) with bundled attributes |
| **Cabin Class** | Travel class: economy, premium economy, business, first |
| **Ancillary** | Optional add-ons (seat selection, baggage, meals) purchasable on top of the base fare |
