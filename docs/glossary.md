---
sidebar_position: 100
title: Glossary
description: Travel industry and platform terminology used throughout this documentation.
---

# Glossary

A comprehensive reference of travel industry and Al Rais platform terminology used throughout this documentation, organized alphabetically.

---

## A

### ADR (Average Daily Rate)

Total room revenue divided by the number of rooms sold over a given period. ADR is a core hotel performance metric used alongside RevPAR and occupancy rate. In the middleware, ADR appears in hotel curation scoring where lower-ADR options contribute to the `best_value` label.

### Agency / Commission Model

A distribution model where the travel supplier sets the retail price and pays the intermediary (OTA or travel agent) a commission on each sale. The intermediary never owns the inventory or takes on pricing risk. Contrast with the merchant model.

### Allotment

A block of rooms pre-negotiated between a hotel and a distributor (bedbank, OTA, or tour operator) at a fixed contracted rate, often with release dates after which unsold rooms return to general availability. In the bedbank world, allotments enable guaranteed availability without real-time connectivity to the hotel PMS.

### Ancillary

Optional add-on products or services purchasable alongside a primary travel product. For flights, ancillaries include seat selection, extra baggage, lounge access, and onboard meals. For activities, ancillaries may include photo packages, equipment rentals, or insurance upgrades. In the middleware, ancillary data is normalized per-connector and surfaced in offer details.

### ARC (Airlines Reporting Corporation)

The US equivalent of BSP, handling financial settlement between airlines and travel agencies for tickets sold within the United States.

## B

### BAR (Best Available Rate)

The lowest unrestricted rate a hotel offers to the general public on a given date. BAR serves as the benchmark against which negotiated, corporate, and promotional rates are compared. Hotels use BAR parity clauses to ensure their direct channel matches or beats OTA pricing.

### Bedbank

A hotel wholesaler that aggregates inventory from thousands of hotels and distributes it to travel agencies, OTAs, and tour operators. Bedbanks typically operate on a net-rate merchant model. The Al Rais platform connects to Hotelbeds and RateHawk (ETG) as bedbank suppliers. See the [connectors overview](/connectors) for details.

### Board Basis

The meal plan included with a hotel room. Standard abbreviations used across the platform:

| Code | Meaning |
|------|---------|
| **RO** | Room Only -- no meals |
| **BB** | Bed and Breakfast -- breakfast included |
| **HB** | Half Board -- breakfast and dinner |
| **FB** | Full Board -- breakfast, lunch, and dinner |
| **AI** | All Inclusive -- all meals and selected beverages |

In the middleware, board basis codes from each supplier (Hotelbeds `RO`/`BB`/`HB`/`FB`/`AI`, RateHawk `nomeal`/`breakfast`/`half-board`/`full-board`/`all-inclusive`) are normalized to a common enum.

### Booking Class

A single-letter inventory bucket code (Y, B, M, H, etc.) used by airlines to manage seat availability and pricing within a cabin. Each booking class maps to a fare basis code and determines upgrade eligibility, frequent flyer accrual, and change/refund rules. Also known as RBD (Reservation Booking Designator).

### Booking Question

A supplier-defined data field that must be answered during the booking process. Viator uses booking questions to collect traveler names, pickup locations, flight numbers, and other information required for fulfillment. In the middleware, booking question types are normalized from Viator's `STRING`, `NUMBER`, `DATE`, `BOOLEAN`, `SELECT`, and `LOCATION_REF` to a common type system.

### Booking Window

The time span between when a traveler makes a booking and when the service is consumed. A short booking window (last-minute) typically commands higher prices due to scarcity, while a long booking window (advance purchase) often qualifies for discounted fares. In the middleware, the yield management system adjusts pricing based on proximity-to-departure bands.

### BSP (Billing and Settlement Plan)

An IATA-operated financial settlement system that simplifies the billing and payment process between airlines and travel agencies. Instead of each agency settling directly with each airline, BSP acts as a centralized clearinghouse. BSP is the primary settlement mechanism outside the United States (where ARC serves the same function).

### Bundle Discount

A percentage reduction applied when multiple travel components are purchased together as a dynamic package. In the middleware's bundle pricing engine: 2 components receive a 3% discount, 3 components receive 5%, and 4+ components receive 7% (with an additional 1% if insurance is included).

## C

### Cabin Class

The travel class on a flight: economy, premium economy, business, or first. Cabin class determines seat pitch, service level, baggage allowance, and lounge access. The middleware normalizes cabin class values from each supplier (Provesio uses `Y`/`W`/`C`/`F`, Duffel uses descriptive strings) to a common enum.

### CDC (Change Data Capture)

A data integration pattern that detects and propagates incremental changes from a source system rather than performing full re-syncs. The Viator connector uses CDC for catalog synchronization -- `POST /products/modified-since` and `POST /availability/schedules/modified-since` endpoints return only products or schedules that changed since the last sync. The catalog sync worker runs every 6 hours.

### Channel Manager

Software that distributes a hotel's rates and availability across multiple online sales channels (OTAs, bedbanks, direct website) from a single interface. Channel managers prevent overbooking by synchronizing inventory in real time and enable rate parity enforcement.

### Circuit Breaker

A resilience pattern that prevents cascading failures by temporarily blocking requests to a failing supplier. The middleware implements per-supplier circuit breakers with three states: CLOSED (normal operation), OPEN (all requests rejected), and HALF_OPEN (single probe request allowed). See [failure isolation](/orchestration/failure-isolation) for per-supplier thresholds.

### Confirmation Type

Whether a booking is finalized immediately or requires supplier review. Viator supports two models: `INSTANT` (booking auto-confirmed on submission) and `MANUAL` (booking requires supplier review, typically 24-48 hours). The confirmation type affects hold management and user experience flows.

### Connector

In the middleware context, a connector is a TypeScript class that implements the `SupplierConnector` interface, providing a unified contract for search, book, hold, cancel, and enrichment operations against a specific travel supplier's API. Connectors handle authentication, request mapping, response normalization, and error handling. See the [connector overview](/connectors) for the full registry.

### Cross-sell

Offering complementary products from a different category alongside the primary purchase. For example, suggesting hotel options after a flight booking, or activities relevant to the destination. Contrast with upsell.

### Curation Engine

The Al Rais platform's deterministic scoring and selection system that evaluates raw supplier offers across flights, hotels, activities, and packages. It applies weighted rules (price position, duration, star rating, review scores, etc.) to produce labeled recommendations (`recommended`, `cheapest`, `fastest`, `best_overall`, `best_value`, `luxury`). No LLM or randomization is involved. See [curation engine](/orchestration/curation-engine) for the full rule set.

### Cut-off Time

The latest point before a service begins at which a booking, modification, or cancellation can be made. For activities, cut-off times are typically 24-48 hours before the experience start time. For hotels, cut-off times determine free cancellation deadlines. In dynamic packages, the package cancellation deadline is the minimum cut-off across all components.

## D

### Dispatch Worker

An asynchronous Lambda function in the Al Rais middleware that executes supplier-specific operations (holds, confirmations, cancellations) on behalf of the saga orchestrator. Dispatch workers decouple the orchestration logic from the supplier interaction, enabling independent scaling and retry behavior per supplier.

### Dynamic Packaging

The practice of combining individually priced travel components (flights, hotels, activities, transfers, insurance) into a single bundled product at the time of booking, with pricing that reflects real-time availability. Unlike pre-built tour packages, dynamic packages are assembled on demand from live supplier inventory. See [package composition](/orchestration/package-composition) for the Al Rais implementation.

### Dynamic Pricing

A pricing strategy where the retail price changes in real time based on demand, supply, competitor pricing, and other market signals. In the middleware, the yield management system implements dynamic pricing through proximity-to-departure bands, day-of-week adjustments, and seasonal factors.

### DynamoDB

An AWS fully managed NoSQL database service used throughout the Al Rais middleware for saga state persistence, hold tracking, offer caching, Viator destination/catalog storage, idempotency checks, and booking records. DynamoDB's single-table design with composite keys (e.g., `PK=SAGA#{id}, SK=STEP#{id}`) is the standard data modeling pattern in the platform.

## E

### E-ticket

An electronic airline ticket stored in the airline's reservation system, replacing paper tickets. The e-ticket is issued after the PNR is confirmed and payment is settled. E-ticket numbers are unique identifiers used for check-in and boarding.

### Enrichment Connector

A non-transactional connector that provides contextual or supplementary data rather than bookable inventory. The Al Rais platform uses enrichment connectors for weather (Open-Meteo), city quality-of-life insights (Teleport), points of interest (Foursquare), destination cost estimates (BudgetYourTrip), and web search context (Tavily).

## F

### Fan-out / Fan-in

A concurrency pattern where a single request is dispatched to multiple services simultaneously (fan-out), and results are aggregated as they return (fan-in). The middleware uses `Promise.allSettled` to fan out search requests to all suppliers with a given capability. Partial results are accepted -- a slow or failed supplier never blocks the response. The curation engine works with whatever arrives.

### Fare Basis Code

An alphanumeric code assigned by an airline that defines the pricing rules, restrictions, and conditions of a ticket. The fare basis determines change/refund penalties, advance purchase requirements, minimum stay rules, and fare class. Example: `YOWUS` might indicate a full-fare economy one-way ticket to the US.

### Fare Brand

An airline-defined product tier (e.g., Basic Economy, Economy Flex, Business Saver) that bundles a booking class with specific attributes like baggage allowance, seat selection, and flexibility. Fare brands provide consumer-friendly names for what are technically booking class and fare basis combinations.

### Fare Calendar

A date-flexible search view showing the cheapest available fare per departure date across a range. The Duffel connector implements fare calendar by grouping offers by departure date and selecting the minimum-price offer for each date.

## G

### GDS (Global Distribution System)

A centralized reservation network that connects travel suppliers (airlines, hotels, car rentals) with travel agencies and OTAs. The three major GDS providers are Amadeus, Sabre, and Travelport. The Al Rais platform accesses GDS airline content indirectly through Provesio (legacy API) and directly through Duffel (which aggregates GDS and NDC sources). See the [connectors overview](/connectors) for details.

### GCC (Gulf Cooperation Council)

The political and economic alliance of six Middle Eastern states: Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, and Oman. The GCC travel market has distinct seasonality (peak winter, Ramadan shoulder, summer low) that directly influences the middleware's yield management configuration.

## H

### HMAC (Hash-based Message Authentication Code)

A cryptographic authentication method using a shared secret to sign API requests. The Hotelbeds connector uses HMAC with SHA-256, computing `SHA256(apiKey + secret + unixTimestamp)` for each request. HMAC signatures are time-sensitive, so clock synchronization between the middleware and the supplier is important.

### Hold

A temporary reservation that secures inventory (a flight seat, hotel room, or activity slot) without requiring immediate payment. Holds have a supplier-defined expiry after which the inventory is released. In the middleware, the `HoldManager` tracks per-component hold records with expiry timestamps, and a scheduled Lambda scans for holds expiring within the next 2 minutes.

## I

### IATA (International Air Transport Association)

The trade association for the world's airlines, responsible for setting standards across the aviation industry including airline designator codes (two-letter, e.g., EK for Emirates), airport codes (three-letter, e.g., DXB for Dubai), NDC standards, and the BSP settlement system.

### IATA Code

A standardized identifier assigned by IATA. Airline codes are two letters (EK, EY, QR), airport codes are three letters (DXB, LHR, JFK). The middleware uses IATA codes extensively for destination resolution, carrier identification, and airline logo URLs.

### Idempotency

The property that performing the same operation multiple times produces the same result as performing it once. The middleware enforces idempotency on package confirmation via an `IdempotencyCheck` mechanism, preventing duplicate bookings if a confirmation request is retried.

## L

### Lambda

An AWS serverless compute service that runs code without provisioning servers. The Al Rais middleware runs as a collection of Lambda functions -- API handlers, dispatch workers, catalog sync workers, and hold-expiry scanners.

## M

### Margin

The difference between the retail (selling) price and the cost (net rate from supplier), expressed as a percentage of the retail price. The middleware applies per-module margins: flights 3%, hotels 12%, activities 10%, transfers 8%, insurance 15%. A margin floor (2% above supplier cost) is enforced to prevent below-cost sales.

### Markup

The amount added on top of the supplier's net rate to arrive at the retail price, expressed as a percentage of the cost. While margin and markup are related, they are calculated differently: a 12% margin on a $100 net rate yields a $113.64 retail price, while a 12% markup yields $112. The middleware's bundle pricing engine uses margin-based calculations.

### MC (Multi-City)

A flight itinerary with multiple separate segments that do not follow a simple outbound-return pattern. Example: Dubai to London, London to Paris, Paris to Dubai. Multi-city itineraries are typically more complex to price and book than one-way or round-trip.

### Merchant Model

A distribution model where the intermediary (OTA or bedbank) purchases inventory at a net rate from the supplier and sets its own retail price. The intermediary takes on pricing risk but controls margins. Hotelbeds, RateHawk, and Viator all operate on the merchant model with the Al Rais platform. Contrast with the agency/commission model.

## N

### NDC (New Distribution Capability)

An IATA standard (based on XML/JSON messaging) that enables airlines to distribute rich content and ancillary offers directly to travel sellers, bypassing or supplementing traditional GDS channels. NDC allows airlines to offer differentiated products, dynamic pricing, and merchandising capabilities. Duffel aggregates NDC and GDS content through a single API.

### Net Rate

The wholesale price charged by a supplier before the OTA adds its markup. The net rate is the cost to the platform. In the middleware, Viator exposes net rates via the `merchantNetPrice` field, RateHawk returns net rates natively, and Hotelbeds provides net rates after HMAC-authenticated API calls.

### Normalizer

A module within each connector that transforms supplier-specific response formats into the platform's unified data model. Normalizers handle field mapping (e.g., Provesio's `totalFare` to `price.supplierTotal`), enum translation (e.g., board basis codes), unit conversion, and data enrichment. Every connector has a dedicated normalizer.

## O

### Offer

A bookable travel product returned by a supplier search, containing price, availability, conditions, and product details. In the middleware, offers from different suppliers are normalized to a common schema, deduplicated, and scored by the curation engine before being returned to the frontend.

### OTA (Online Travel Agency)

A platform that sells travel products (flights, hotels, activities, packages) to end consumers via the internet. Al Rais is a UAE-based OTA that aggregates inventory from multiple suppliers through its middleware layer, applying curation, packaging, and pricing logic before presenting options to travelers.

### OW (One-Way)

A flight itinerary with a single outbound segment and no return. One-way fares are typically priced independently and can be combined from different airlines to build a round-trip.

## P

### Package Composition Pipeline

The Al Rais middleware's 5-phase system for assembling, validating, pricing, and confirming dynamic travel packages. The phases are: Search (fan-out to suppliers), Compose (compatibility check + bundle pricing), Hold (saga-backed sequential holds), Confirm (idempotent confirmation), and Status (read-only state). See [package composition](/orchestration/package-composition) for the full specification.

### Pax

Industry shorthand for passenger or traveler. Used in booking requests to indicate the number and type of travelers (adults, children, infants). Pax count determines room occupancy requirements, activity group sizing, and transfer vehicle selection.

### PNR (Passenger Name Record)

A unique alphanumeric booking reference (typically 6 characters) created in a GDS or airline reservation system when a flight is booked. The PNR contains itinerary details, passenger information, ticket numbers, and special service requests. In the middleware, the PNR is extracted from the Provesio confirmation response after the final ticketing step.

### Prebook

A rate validation step that locks a selected hotel rate and confirms the current price before committing to a booking. RateHawk's `POST /hotel/prebook/` endpoint returns a `price_changed` flag indicating whether the rate shifted since the search. Duffel Stays uses quotes (`POST /stays/quotes`) as its equivalent prebook mechanism.

## R

### Rack Rate

The standard published room rate set by a hotel before any discounts, negotiations, or promotions are applied. Rack rate is the highest rate a hotel will charge and serves as the baseline from which all other rates are discounted.

### RBD (Reservation Booking Designator)

See Booking Class.

### RevPAR (Revenue Per Available Room)

A hotel performance metric calculated as total room revenue divided by total available rooms (or equivalently, ADR multiplied by occupancy rate). RevPAR measures a hotel's ability to fill rooms at an optimal rate.

### RT (Round-Trip)

A flight itinerary with an outbound and return segment between the same origin and destination. Round-trip fares are often discounted relative to two one-way tickets on the same route.

## S

### Saga

A distributed transaction pattern that coordinates multi-step operations across different services with automatic rollback (compensation) on failure. In the middleware, the saga orchestrator manages package hold and confirm sequences -- if a hotel hold fails after a flight hold succeeds, the saga compensates by rolling back the flight hold. See [saga orchestrator](/orchestration/saga-orchestrator) for the state machine and compensation rules.

### SQS (Simple Queue Service)

An AWS fully managed message queuing service. The legacy Provesio flight integration uses SQS for asynchronous booking pipelines. SQS decouples the booking request from the fulfillment process, enabling retry and dead-letter handling.

### SSR (Special Service Request)

A standardized code communicated to an airline or supplier indicating specific traveler requirements. Common SSRs include wheelchair assistance (WCHR), dietary preferences (VGML for vegetarian), unaccompanied minor (UMNR), and medical oxygen (OXYG). SSRs are attached to the PNR during or after booking.

### Stop-sale

A temporary halt on the sale of a specific hotel room type, rate, or allotment block through a distribution channel. Hotels use stop-sales to manage overselling risk during high-demand periods. Bedbanks must respect stop-sale directives in real time.

### Supplier Connector Interface

The TypeScript interface (`SupplierConnector`) that all transactional connectors in the Al Rais middleware must implement. It defines a unified contract for `search`, `book`, `hold`, `cancel`, and capability declaration, enabling the orchestrator to interact with any supplier through the same API surface. Connectors are registered in `createDefaultRegistry()` at Lambda cold start.

## T

### T&A (Tours and Activities)

The travel vertical encompassing tours, excursions, experiences, attractions, and ground transfers. T&A distribution is more fragmented than flights or hotels -- there is no equivalent of a GDS, and supplier APIs vary significantly. Viator (a TripAdvisor company) is the primary T&A supplier in the Al Rais platform.

### TPS (Transactions Per Second)

A throughput metric measuring the number of API requests a system can handle per second. Viator enforces approximately 15 TPS (150 requests per 10-second sliding window). The middleware tracks TPS internally using a timestamp ring buffer and logs warnings at 80% utilization.

## U

### UGC (User-Generated Content)

Content created by travelers rather than the supplier or platform, including reviews, ratings, photos, and trip reports. The Viator content service exposes UGC through product reviews (`POST /reviews/product`) and traveler photos (`GET /photos/product/{code}`). UGC data feeds into the curation engine's review score rules.

### Upsell

Offering a higher-tier or enhanced version of the same product category. For example, suggesting a business class upgrade on a flight search, or a sea-view room when a city-view was selected. Contrast with cross-sell.

## V

### Vertical

A distinct travel product category. The Al Rais platform operates across five verticals: flights, hotels, activities, transfers, and insurance. Each vertical has its own set of supplier connectors, normalizers, and curation rules.

## Y

### Yield Management

A pricing strategy that adjusts prices based on predicted demand patterns to maximize revenue. The middleware's yield management system computes a `yieldFactor = proximity * dayOfWeek * season`, clamped to [0.85, 1.25]. Proximity bands add up to 15% for last-minute bookings and subtract up to 5% for far-out bookings. Weekend and peak-season surcharges further adjust the factor. See [package composition](/orchestration/package-composition#yield-management) for the complete configuration.
