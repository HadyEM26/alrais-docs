---
title: Viator (Activities & Transfers)
sidebar_label: Viator
sidebar_position: 1
---

# Viator (Activities & Transfers)

Viator, a TripAdvisor company, is the world's largest marketplace for tours, activities, and experiences. The Al Rais platform uses Viator's Partner API across 14 endpoint groups with a three-class architecture: `ViatorActivityConnector` (transactional -- search, book, cancel), `ViatorTransferConnector` (transfer products filtered by tag taxonomy), and `ViatorContentService` (read-only enrichment -- attractions, destinations, tags, reviews, photos, locations, booking questions). All three share a single `ViatorHttpClient` with unified rate-limit tracking.

## At a glance

| Property | Value |
|----------|-------|
| **Vertical** | Activities & Transfers |
| **Commercial model** | Net rates (merchant model) |
| **Auth** | API Key (`exp-api-key` header) |
| **Sandbox** | N/A |
| **Status** | Live |

## What our platform uses today

### Activity connector

| Capability key | Description |
|---------------|-------------|
| `activity_search` | Destination-based product search with category filters |
| `activity_book` | Two-step cart-then-book confirmation |
| `activity_details` | Product detail retrieval |
| `activity_availability` | Availability and start time lookup |
| `activity_cancel` | Booking cancellation with refund info |
| `activity_booking_questions` | Booking question retrieval for guest data collection |

### Transfer connector

| Capability key | Description |
|---------------|-------------|
| `transfer_search` | Transfer product search filtered by tag taxonomy |
| `transfer_book` | Two-step cart-then-book with flight number support |
| `transfer_cancel` | Transfer booking cancellation |

## Activity endpoints

### searchActivities(request)

- **HTTP:** `POST /products/search`
- **Timeout:** 30 seconds
- **Behaviour:** Searches products by destination, date range, and category filters. Uses `getViatorDestinationId()` for destination resolution (IATA code or city name mapped to Viator destination ID). Returns an empty result set if the destination cannot be resolved.

### getActivityDetails(productCode)

- **HTTP:** `GET /products/{productCode}`
- **Behaviour:** Returns full product details. Returns `null` on error (graceful degradation -- errors are logged but do not propagate).

### checkActivityAvailability(request)

- **HTTP:** `POST /availability/check`
- **Behaviour:** Returns available start times for a given product and date combination.

### bookActivity(request)

- **Flow:** Two-step process:
  1. `POST /carts` -- hold the product with `bookingQuestionAnswers`
  2. `POST /bookings/book` -- confirm the booking
- **Timeout:** 30 seconds per step
- **Behaviour:** The cart step captures traveler information via booking question answers. The book step finalizes the reservation.

### cancelActivity(bookingRef, reason?)

- **HTTP:** `POST /bookings/{bookingRef}/cancel`
- **Behaviour:** Cancels a confirmed booking. Returns refund information. An optional cancellation reason can be provided.

### getBookingQuestions(productCode)

- **Mechanism:** Delegates to `ViatorContentService`
- **Returns:** `BookingQuestionSet` -- the set of questions that must be answered during booking (e.g., traveler names, pickup locations, flight numbers)

## Transfer endpoints

### searchTransfers(request)

- **HTTP:** `POST /products/search` with transfer tag filter `[14001]`
- **Behaviour:** Viator has no dedicated transfer API. Transfer products are regular activity products tagged with IDs 14001--14005. The connector uses `isTransferProduct()` -- a hybrid detection method combining tag-based filtering with title keyword heuristics.
- **Transfer keywords:** transfer, shuttle, airport pickup, airport drop, private car, limousine, chauffeur
- **Type inference:** `luxury` (title contains luxury, limousine, or vip), `shared` (title contains shared or shuttle, or tagged 14004), default `private`
- **Output:** Normalized to `NormalizedTransferOffer` with inferred transfer type.

### bookTransfer(request)

- **Flow:** Two-step cart-then-book (same as activity booking)
- **Behaviour:** Includes `FLIGHT_NUMBER` as a booking question answer if a flight number is provided in the request.

### cancelTransfer(bookingRef, reason?)

- **HTTP:** `POST /bookings/{bookingRef}/cancel`
- **Behaviour:** Identical to activity cancellation.

## Content service endpoints

The `ViatorContentService` is a read-only enrichment layer, not a `SupplierConnector`. It provides destination context and product metadata.

### searchAttractions(destinationId, topN)

- **HTTP:** `GET /attractions/search`
- **Behaviour:** Returns top attractions for a destination, ordered by relevance.

### getAllDestinations()

- **HTTP:** `GET /destinations`
- **Behaviour:** Returns the full destination taxonomy tree: `COUNTRY` > `REGION` > `CITY`.

### getAllTags()

- **HTTP:** `GET /tags`
- **Behaviour:** Returns the complete product classification hierarchy (used for category filtering and transfer detection).

### getProductReviews(productCode, opts?)

- **HTTP:** `POST /reviews/product`
- **Behaviour:** Returns paginated user-generated content (traveler reviews).

### getProductPhotos(productCode)

- **HTTP:** `GET /photos/product/{code}`
- **Behaviour:** Returns traveler-uploaded photos for a product.

### resolveLocations(refs[])

- **HTTP:** `POST /locations/bulk`
- **Behaviour:** Bulk-resolves location references to structured location data.

### getBookingQuestions(productCode)

- **HTTP:** `GET /products/{code}`
- **Behaviour:** Parses booking questions from the product detail response.

## Auth mechanism

The connector uses `ViatorApiKeyAuth`. All requests include:

- `exp-api-key` -- the Viator Partner API key
- `Accept-Language: en-US`

## Rate limits

Viator enforces **150 requests per 10-second sliding window** (approximately 15 TPS). Rate limiting is tracked internally by the `ViatorHttpClient` using a timestamp ring buffer.

- **Warning threshold:** 80% utilization (120 requests in the current window)
- **Retry strategy:** On HTTP 429 or 503 responses, exponential backoff with a 500ms base delay and a maximum of 3 retries

## Destination taxonomy

Destination resolution follows a three-tier strategy:

1. **In-memory cache** -- 1-hour TTL
2. **DynamoDB** -- lookup via `GSI_IATA` (IATA code index) and `GSI_NAME` (city name index)
3. **Static fallback** -- 4 UAE cities:
   - `DXB` -> `d828`
   - `AUH` -> `d4474`
   - `SHJ` -> `d25614`
   - `RKT` -> `d26028`

DynamoDB table: `alrais-middleware-viator-destinations-{stage}`. The destination cache is refreshed every 24 hours via the `viator-destination-refresh` worker.

## Catalog ingestion

The connector implements a CDC (Change Data Capture) pattern for product catalog synchronization:

- **Product changes:** `POST /products/modified-since`
- **Availability changes:** `POST /availability/schedules/modified-since`

Catalog table: `alrais-middleware-viator-catalog-{stage}`. Synchronization runs every 6 hours via the `viator-catalog-sync` worker.

## Normalizer mappings

**Booking question type mapping:**

| Viator type | Normalized type |
|------------|----------------|
| `STRING` | `text` |
| `NUMBER` | `number` |
| `DATE` | `date` |
| `BOOLEAN` | `boolean` |
| `SELECT` | `select` |
| `LOCATION_REF` | `location` |

**Transfer tag IDs:** 14001--14005 (products tagged with any of these are classified as transfer products).

## Integration notes

- **Confirmation types:** Viator supports two confirmation models:
  - `INSTANT` -- booking is auto-confirmed immediately
  - `MANUAL` -- booking requires supplier review (24--48 hours)
- `merchantNetPrice` is the net rate (wholesale cost before OTA markup). The platform applies its own markup on top.
- Transfer products are not a distinct API vertical -- they are regular products filtered by tag taxonomy and keyword heuristics. This means the transfer search may occasionally include false positives or miss products that don't follow standard tagging.
- All three Viator classes (activity connector, transfer connector, content service) share a single HTTP client, meaning rate-limit consumption is aggregated across all operations.
- The destination refresh and catalog sync workers run on independent schedules (24h and 6h respectively) and must be monitored for failures to avoid stale data.

## Gap analysis

No gap analysis document exists for this supplier.

## Glossary

| Term | Definition |
|------|-----------|
| **T&A** | Tours and Activities -- the travel vertical for experiences, excursions, and transfers |
| **OTA** | Online Travel Agency -- a platform selling travel products to end consumers |
| **UGC** | User-Generated Content -- traveler reviews, photos, and ratings |
| **CDC** | Change Data Capture -- a pattern for detecting and propagating data changes incrementally |
| **TPS** | Transactions Per Second -- throughput measurement for API rate limits |
| **Net Rate** | Wholesale price before OTA markup -- the cost paid to the supplier |
| **Ancillary** | Optional add-ons purchasable alongside the primary product |
| **SSR** | Special Service Request -- specific traveler requirements communicated to the supplier |
| **Confirmation Type** | Whether a booking is instantly confirmed or requires manual supplier approval |
| **Booking Question** | Supplier-defined data fields that must be answered during booking (e.g., pickup location, flight number) |
| **Pax** | Industry shorthand for passenger or traveler |
| **Cut-off Time** | Latest time a booking or cancellation can be made before the activity start |
