---
title: "Failure Isolation"
sidebar_label: "Failure isolation"
---

# Failure Isolation

## Circuit breaker pattern

Per-supplier circuit breakers prevent cascading failures. Three states:

- **CLOSED** (normal): All requests pass. Failures counted in a rolling window. Threshold exceeded triggers transition to OPEN.
- **OPEN** (blocked): All requests rejected immediately. After `resetTimeoutMs` elapses, transitions to HALF_OPEN.
- **HALF_OPEN** (probe): One request allowed through. Success transitions to CLOSED. Failure transitions back to OPEN.

## Per-supplier configuration

| Supplier | Failure threshold | Window | Reset timeout |
|----------|-------------------|--------|---------------|
| Provesio | 5 failures | 60 s | 30 s |
| Duffel | 3 failures | 60 s | 60 s |
| Duffel Stays | 3 failures | 60 s | 60 s |
| Viator | 5 failures | 60 s | 30 s |
| Hotelbeds | 3 failures | 60 s | 60 s |
| RateHawk | 3 failures | 60 s | 60 s |
| Teleport | 5 failures | 60 s | 30 s |
| Open-Meteo | 5 failures | 60 s | 30 s |
| BudgetYourTrip | 3 failures | 60 s | 60 s |
| Tavily | 3 failures | 60 s | 60 s |
| Foursquare | 5 failures | 60 s | 30 s |

## Per-supplier timeouts

| Supplier | Timeout |
|----------|---------|
| Provesio | 8,000 ms |
| Duffel | 8,000 ms |
| Duffel Stays | 6,000 ms |
| Viator | 4,000 ms |
| Hotelbeds | 5,000 ms |
| RateHawk | 30,000 ms |
| Teleport | 3,000 ms |
| Open-Meteo | 3,000 ms |
| BudgetYourTrip | 4,000 ms |
| Tavily | 5,000 ms |
| Foursquare | 3,000 ms |

## Fan-out with Promise.allSettled

The orchestrator fans out to all suppliers with a given capability using `Promise.allSettled`. Each supplier call is wrapped with `invokeWithTimeout()` which applies the per-supplier timeout and circuit breaker check. This means:

- A slow or failed supplier never blocks the response.
- Partial results are returned (the curation engine works with whatever arrives).
- Circuit breaker metrics are updated per-call (success/failure).
- `supplierStatuses` array in the response shows each supplier's outcome.

## Retry strategy

Viator HTTP client: exponential backoff with 500 ms base, max 3 retries, only on 429 (rate limited) or 503 (service unavailable).

Other connectors do not implement retry at the connector level — the orchestrator's circuit breaker handles repeated failures.
