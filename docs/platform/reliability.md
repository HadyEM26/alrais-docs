---
sidebar_position: 3
title: Reliability & Resilience
description: How the middleware handles supplier failures, rate limits, and partial degradation.
---

# Reliability & Resilience

An OTA aggregator sits at the intersection of multiple third-party supplier APIs, each with its own latency profile, error semantics, rate limits, and uptime characteristics. A single flight search fans out to Provesio, Duffel, and potentially others simultaneously; a package booking may chain hotel holds, flight confirmations, and activity reservations across three different suppliers in sequence. If the middleware treated any one supplier failure as a total failure, users would see errors on the majority of requests. The Al Rais middleware is designed around the principle of **partial degradation**: return the best results available, even when some suppliers are down.

This page documents the concrete reliability mechanisms implemented in the middleware codebase, organized by the layer at which they operate.

## Circuit Breakers

Every supplier has a dedicated circuit breaker instance managed by the orchestrator. The implementation lives in `src/orchestrator/circuit-breaker.ts` and follows the standard three-state model:

```
CLOSED (normal) --> OPEN (blocked) --> HALF_OPEN (probe) --> CLOSED
```

**CLOSED**: All requests pass through. Failures are counted within a rolling time window. When the failure count exceeds the threshold within that window, the circuit transitions to OPEN.

**OPEN**: All requests to that supplier are immediately rejected (the orchestrator records the status as `circuit_open` and skips the Lambda invocation entirely). After the reset timeout elapses, the circuit transitions to HALF_OPEN.

**HALF_OPEN**: A single probe request is allowed through. If it succeeds, the circuit resets to CLOSED and the failure history is cleared. If it fails, the circuit reopens.

### Per-Supplier Configuration

Each supplier has tuned thresholds based on observed reliability and the cost of false-positive circuit trips:

| Supplier | Failure Threshold | Window | Reset Timeout |
|---|---|---|---|
| `provesio` | 5 failures | 60 s | 30 s |
| `duffel` | 3 failures | 60 s | 60 s |
| `duffel_stays` | 3 failures | 60 s | 60 s |
| `viator` | 5 failures | 60 s | 30 s |
| `hotelbeds` | 3 failures | 60 s | 60 s |
| `ratehawk` | 3 failures | 60 s | 60 s |
| `teleport` | 5 failures | 60 s | 30 s |
| `open_meteo` | 5 failures | 60 s | 30 s |
| `budget_your_trip` | 3 failures | 60 s | 60 s |
| `tavily` | 3 failures | 60 s | 60 s |
| `foursquare` | 5 failures | 60 s | 30 s |

Suppliers with lower failure thresholds (3) tend to be paid APIs where repeated failures represent wasted cost. Suppliers with higher thresholds (5) tend to be free or enrichment APIs where occasional failures are tolerable.

Suppliers not explicitly configured fall back to defaults: 5 failures in 60 seconds, 30-second reset timeout.

### How Failures Are Counted

- A worker Lambda invocation that returns `status: 'error'` records a failure.
- A worker invocation that times out records a failure.
- A worker that returns `status: 'unsupported'` does **not** count as a failure (the supplier simply does not support that operation type).
- A successful response resets the circuit entirely, clearing the failure history.

### Observability

Circuit breaker state transitions are logged at `warn` level (open/reopen) and `info` level (half-open/close). The orchestrator exposes a `getCircuitMetrics()` method that returns the current state, failure count, and timestamps for all tracked suppliers.

## Rate Limiting

### Viator: Sliding-Window Rate Tracking

The Viator Partner API enforces a limit of **150 requests per 10-second sliding window** (approximately 15 TPS sustained). The `ViatorHttpClient` in `src/connectors/viator/http-client.ts` implements client-side rate tracking:

```
RATE_LIMIT_WINDOW_MS = 10,000
RATE_LIMIT_MAX_REQUESTS = 150
```

The client maintains a ring buffer of request timestamps. Before each request, timestamps older than 10 seconds are pruned. When the count within the window reaches 80% of the limit (120 requests), a warning is logged. The current implementation is **advisory**: it tracks and warns but does not proactively throttle or queue requests. If the supplier responds with HTTP 429, the retry logic (described below) handles backoff.

### Other Connectors

Most other connectors do not implement explicit client-side rate tracking. Their rate limit strategies are:

- **Duffel**: Rate limits are handled reactively via 429 detection in the error normalization layer. Duffel's API returns `Retry-After` headers, though the current implementation uses fixed exponential backoff rather than parsing the header.
- **Hotelbeds**: Uses HMAC-signed requests; rate limits are contractual rather than enforced via HTTP 429. No client-side tracking is implemented.
- **Free APIs** (Teleport, Open-Meteo): No rate limiting is implemented. These APIs have generous or no rate limits, and the middleware's per-supplier circuit breaker provides a safety net if requests start failing.
- **Enrichment APIs** (Tavily, Foursquare, Budget Your Trip): No client-side rate tracking. These are called less frequently (enrichment, not core search) and are protected by circuit breakers.

:::info Gap: Unified Rate Limiter
A centralized rate-limiting layer (e.g., a Redis-backed token-bucket shared across Lambda instances) is a planned capability. The current per-instance tracking in the Viator client does not coordinate across concurrent Lambda invocations.
:::

## Retry & Backoff

### Viator HTTP Client

The Viator HTTP client retries on **HTTP 429** (rate limited) and **HTTP 503** (service unavailable) with exponential backoff:

| Attempt | Backoff Delay |
|---|---|
| 1st retry | 500 ms |
| 2nd retry | 1,000 ms |
| 3rd retry | 2,000 ms |

Maximum of 3 retries (4 total attempts). All other HTTP error codes fail immediately without retry.

### Redis Connection

The Redis client (`src/lib/redis.ts`) uses ioredis with a retry strategy that increases delay linearly and gives up after 5 attempts:

```
Delay = min(attempts * 200ms, 2000ms)
Max retries: 5
```

After 5 failed attempts, the Redis client stops retrying and the connection is considered failed. Cache operations are designed to fail open (see [Cache as Resilience](#cache-as-resilience) below).

### Saga Compensation

Compensation steps use exponential backoff with a base delay of 1,000 ms:

| Attempt | Backoff Delay |
|---|---|
| 1st retry | 1,000 ms |
| 2nd retry | 2,000 ms |
| 3rd retry | 4,000 ms |

Maximum of 3 retries per compensation step. If all retries fail, the step remains in `compensating` status for manual intervention.

### Idempotency

Booking mutations are protected by deterministic idempotency keys generated from the combination of `offerId + supplier + passengerHash`. The passenger hash is a truncated SHA-256 digest of sorted passenger details (name + DOB), ensuring that resubmissions with the same passengers produce the same key regardless of array ordering.

Idempotency is enforced at two levels:
1. **Application level**: DynamoDB conditional `PutItem` with `attribute_not_exists(pk)` ensures only the first caller succeeds. Subsequent calls receive the original `correlationId` for status polling.
2. **Queue level**: SQS FIFO `MessageDeduplicationId` prevents duplicate messages within the 5-minute deduplication window.

## Timeout Strategy

### Per-Supplier Timeouts

Each supplier has a tuned timeout based on its observed latency characteristics. The orchestrator wraps every worker Lambda invocation in a `withTimeout()` race:

| Supplier | Timeout |
|---|---|
| `provesio` | 8,000 ms |
| `duffel` | 8,000 ms |
| `duffel_stays` | 6,000 ms |
| `viator` | 4,000 ms |
| `hotelbeds` | 5,000 ms |
| `ratehawk` | 30,000 ms |
| `teleport` | 3,000 ms |
| `open_meteo` | 3,000 ms |
| `budget_your_trip` | 4,000 ms |
| `tavily` | 5,000 ms |
| `foursquare` | 3,000 ms |

The default timeout for unconfigured suppliers is 8,000 ms.

RateHawk's 30-second timeout is notably higher than others. This reflects the RateHawk/ETG API's architecture, which performs its own internal supplier aggregation and can take significantly longer than direct-integration suppliers.

### Viator HTTP-Level Timeout

In addition to the orchestrator-level timeout, the Viator HTTP client has its own per-request timeout defaulting to **30,000 ms**. This is configurable via `ViatorHttpClientConfig.defaultTimeoutMs`. The effective timeout for a Viator call is `min(orchestrator timeout, HTTP client timeout)` -- in practice, the orchestrator's 4,000 ms timeout fires first for search operations.

### Timeout Resolution Priority

Timeouts are resolved in this order (first match wins):

1. Per-request override via `OrchestratorConfig.supplierTimeoutMs`
2. Per-instance override via `OrchestratorInit.supplierTimeouts`
3. Static `SUPPLIER_TIMEOUTS` map
4. Default: 8,000 ms

## Error Normalization

All supplier-specific errors are mapped to a canonical `MiddlewareError` hierarchy defined in `src/lib/errors.ts`. The `normalizeSupplierError()` function accepts any thrown value and produces a typed error with a canonical code, safe message, and appropriate HTTP status code.

### Canonical Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request failed schema validation |
| `SUPPLIER_AUTH_FAILED` | 502 | Supplier returned 401 or 403 |
| `SUPPLIER_TIMEOUT` | 504 | Request timed out or `ETIMEDOUT`/`ECONNABORTED` |
| `SUPPLIER_ERROR` | 502 | Generic supplier-side failure |
| `SUPPLIER_RATE_LIMITED` | 429 | Supplier returned 429 |
| `CIRCUIT_OPEN` | (skipped) | Circuit breaker is open; request not attempted |
| `NO_RESULTS` | 404 | Search returned zero results |
| `OFFER_EXPIRED` | 410 | Cached offer is no longer valid |
| `OFFER_NOT_FOUND` | 404 | Offer ID not found in the offer map |
| `BOOKING_FAILED` | 502 | Booking operation failed at the supplier |
| `INTERNAL_ERROR` | 500 | Catch-all for unexpected errors |

### Detection Heuristics

Error normalization uses pattern matching on the raw error:

- **HTTP status detection**: Checks `error.response.status` for 429 (rate limited), 401/403 (auth failed).
- **Timeout detection**: Checks `error.message` for the substrings `timeout`, `ETIMEDOUT`, or `ECONNABORTED`.
- **Passthrough**: If the error is already a `MiddlewareError`, it passes through unchanged.

### Information Leakage Prevention

The `toJSON()` method on `MiddlewareError` strips internal details (stack traces, raw supplier response bodies, internal IPs) from the error response sent to the client. Only the canonical `code`, a sanitized `message`, and optionally the `supplier` name are included:

```json
{
  "error": {
    "code": "SUPPLIER_TIMEOUT",
    "message": "Supplier duffel error: timeout of 8000ms exceeded",
    "supplier": "duffel"
  }
}
```

## Fan-Out Isolation

The orchestrator's search pipeline is the primary example of fan-out isolation. The flow is:

1. Build one `SupplierMessage` per supplier.
2. For each supplier, check the circuit breaker. If open, skip with status `circuit_open`.
3. Fan out remaining suppliers via `Promise.allSettled()`, each wrapped in a per-supplier timeout.
4. Collect results. Successful suppliers contribute offers; failed or timed-out suppliers contribute status metadata.
5. Normalize all successful results into the canonical format.
6. Deduplicate cross-supplier duplicates.
7. Run the curation engine to select top results.
8. Return curated results plus a `supplierStatuses` array documenting per-supplier outcomes.

The critical design choice is `Promise.allSettled()` rather than `Promise.all()`. This means:

- A 30-second RateHawk timeout does not block Duffel results from returning.
- A Viator 429 does not cause the entire search to fail.
- The client always receives whatever results are available, along with transparency about which suppliers responded.

### Supplier Status Metadata

Every search response includes a `supplierStatuses` array with one entry per supplier:

```typescript
interface SupplierStatusEntry {
  supplier: string;
  status: 'success' | 'timeout' | 'error' | 'circuit_open' | 'unsupported';
  latencyMs?: number;
  offerCount?: number;
  error?: string;
}
```

This allows the frontend to show users messages like "Showing results from 2 of 3 suppliers" or to indicate that more results may be available if a supplier was temporarily unavailable.

## Saga Compensation

Multi-component bookings (e.g., flight + hotel + activity packages) use a saga pattern implemented in `src/saga/`. The saga orchestrator coordinates ordered steps across suppliers and provides rollback capability when a downstream step fails.

### Saga Lifecycle

```
createSaga(steps) --> executeStep(1) --> executeStep(2) --> ... --> completed
                            |                  |
                          fails              fails
                            |                  |
                            v                  v
                     compensate(saga)    compensate(saga)
                            |                  |
                     reverse-order        reverse-order
                     cancellations        cancellations
```

### Compensation Rules

From PRD Section 5.6:

1. **Reverse order**: Completed steps are compensated last-booked-first. If steps were flight-hold, hotel-hold, activity-hold, and activity-hold fails, compensation cancels hotel-hold first, then flight-hold.
2. **Retry with backoff**: Each compensation step retries up to 3 times with exponential backoff (1s, 2s, 4s).
3. **Idempotent**: Compensation uses the original `correlationId`, so retries do not create duplicate cancellations.
4. **Dead letter**: If all retries fail, the step remains in `compensating` status. These are surfaced for manual intervention.

### Compensation Map

The `COMPENSATION_MAP` in `src/types/saga.ts` defines the reverse operation for each forward operation:

| Forward Operation | Compensating Operation |
|---|---|
| `book` | `cancel` |
| `hold` | `cancel` |
| `confirm` | `cancel` |

### Hold Expiry Management

The `HoldManager` in `src/saga/hold-manager.ts` tracks supplier-side holds across all components in a package. The effective hold expiry for a package is the **minimum** expiry across all active component holds (the earliest-expiring hold is the binding constraint).

Two mechanisms trigger auto-compensation when holds expire:

1. **DynamoDB TTL + Streams**: Expired hold records trigger a worker Lambda via DynamoDB Streams.
2. **Scheduled Lambda**: Scans for holds expiring within the next 2 minutes and triggers pre-emptive compensation.

A warning is emitted when 80% of the hold duration has elapsed, giving the system time to prompt the user for confirmation before automatic compensation fires.

### AWS Step Functions Integration

For production workloads, saga execution is delegated to AWS Step Functions via the adapter in `src/saga/step-functions-adapter.ts`. The adapter translates Step Functions task tokens into saga step executions and sends success/failure callbacks. This provides durable execution guarantees: if the Lambda instance is recycled mid-saga, Step Functions resumes the workflow on a new instance.

### State Persistence

Saga state is persisted in DynamoDB with the following schema:

| PK | SK | Content |
|---|---|---|
| `SAGA#{sagaId}` | `META` | Saga definition, status, timestamps |
| `SAGA#{sagaId}` | `STEP#{stepId}` | Individual step state and compensation action |

Records have a 7-day TTL. Both saga metadata and individual steps are updated after every state transition, ensuring recoverability after Lambda restarts.

## Cache as Resilience

The caching layer serves two purposes: performance optimization and resilience during supplier outages. The `ResponseCache` in `src/cache/response-cache.ts` is backed by Redis (ElastiCache in production).

### TTLs by Domain

| Cache Domain | TTL | Rationale |
|---|---|---|
| Flight search results | 120 s (2 min) | Fare availability changes frequently |
| Hotel search results | 60 s (1 min) | Room inventory is volatile |
| Activity search results | 300 s (5 min) | Activity availability changes slowly |
| Transfer search results | 300 s (5 min) | Transfer availability is moderately stable |
| Product reviews | 3,600 s (1 hr) | UGC updates infrequently |
| Booking questions | 86,400 s (24 hr) | Rarely change |
| Destination taxonomy | 86,400 s (24 hr) | Semi-static reference data |
| Offer map entries | 1,800 s (30 min) | Must outlive the user's selection flow |

### Fail-Open Design

Both `get` and `set` operations on the response cache are wrapped in try/catch blocks that log warnings but never throw. This means:

- **Cache get failure**: Returns `null` (cache miss). The orchestrator proceeds with a live supplier call. The user experiences slightly higher latency but no error.
- **Cache set failure**: The response is returned to the user but not cached. The next identical request will hit the suppliers again.

This fail-open design ensures that a Redis outage degrades performance but never blocks the request path.

### Cache Key Determinism

Cache keys are generated by SHA-256 hashing the sorted JSON representation of search parameters, prefixed by domain. This guarantees:

- Same search parameters always produce the same key (deterministic).
- Different parameter orderings produce the same key (order-independent).
- Key collisions are practically impossible (SHA-256 truncated to 16 hex characters).

Example key format: `middleware:flights:a3b2c1d4e5f6a7b8`

### Offer Map as Session Context

The `OfferMap` in `src/cache/offer-map.ts` bridges search results to booking operations. When the middleware normalizes supplier offers, each gets a new UUID. The offer map stores the mapping from this middleware UUID back to the supplier's native offer ID plus session context. This DynamoDB-backed map has a 30-minute TTL, ensuring that users can complete a booking flow within a reasonable time after searching.

## Summary of Resilience Layers

| Layer | Mechanism | Failure Mode Handled |
|---|---|---|
| Circuit breaker | Per-supplier state machine | Sustained supplier outage |
| Rate tracking | Sliding-window counter (Viator) | Self-inflicted rate limiting |
| Retry + backoff | Exponential backoff on 429/503 | Transient supplier errors |
| Timeout | Per-supplier deadline | Slow or hung suppliers |
| Error normalization | Canonical error mapping | Information leakage, inconsistent errors |
| Fan-out isolation | `Promise.allSettled` | Single supplier failure |
| Saga compensation | Reverse-order rollback | Partial booking failure |
| Cache fail-open | Silent fallback on Redis errors | Cache infrastructure failure |
| Idempotency | Deterministic keys + conditional writes | Duplicate booking submissions |
