---
title: "Package Composition"
sidebar_label: "Package composition"
---

# Package Composition

## 5-phase pipeline

1. **Search** — `POST /packages/search`: Fan-out to flight, hotel, activity suppliers. Auto-assembles 3 labeled packages (`best_overall`, `best_value`, `luxury`).
2. **Compose** — `POST /packages/compose`: User selects specific offer IDs. Compatibility check + bundle pricing + cancellation summary produces a holdable `packageId`.
3. **Hold** — `POST /packages/{id}/hold`: Sequential holds: flight, hotel, activity, transfer, insurance (`HOLD_ORDER`). Saga-backed with rollback on critical failure.
4. **Confirm** — `POST /packages/{id}/confirm`: Idempotency-gated. Confirms each held component. Compensates on partial failure.
5. **Status** — `GET /packages/{id}/status`: Read-only. Returns phase, holds, bookings, pricing.

## Composition engine pipeline

`CompositionEngine.compose()` runs:

1. Wrap offers as `PackageComponent[]`
2. `validateCompatibility` (9 rules)
3. `BundlePricingEngine.priceBundle()`
4. `deriveCancellationSummary`
5. `buildPackage`

`inferModule()` duck-types raw offers:

- `slices` → flight
- `rooms` → hotel
- `duration` + `category` → activity
- `pickup` + `dropoff` → transfer
- `coverageDetails` + `planName` → insurance

## Bundle pricing 7-step pipeline (PRD 4.4)

1. Convert supplier price to display currency.
2. Apply per-module margin: flight 3%, hotel 12%, activity 10%, transfer 8%, insurance 15%.
3. Sum all margins into `aLaCarteTotal`.
4. Apply bundle discount: 2 components → 3%, 3 → 5%, 4+ → 7% (+1% if insurance included).
5. Apply yield adjustment: `yieldFactor` from proximity x day-of-week x season.
6. Compute `bundleTotal`.
7. Enforce margin floor: total >= sum(supplierPrices x (1 + 2%)).

## Yield management

`yieldFactor = proximity * dayOfWeek * season`, clamped to `[0.85, 1.25]`.

**Proximity bands:**

| Days to departure | Adjustment |
|-------------------|------------|
| 0–3 days | +15% |
| 3–7 days | +10% |
| 7–14 days | +5% |
| 14–30 days | neutral |
| 30–90 days | -3% |
| 90+ days | -5% |

**Day of week:**

| Day | Adjustment |
|-----|------------|
| Fri–Sat | +3% |
| Sun | +2% |
| Mon–Wed | neutral |
| Thu | +1% |

**Seasons (UAE):**

| Season | Months | Adjustment |
|--------|--------|------------|
| peak_winter | Dec–Feb | +8% |
| peak_spring | Mar–Apr | +3% |
| ramadan_shoulder | May | -5% |
| summer_low | Jun–Aug | -10% |
| autumn | Sep–Nov | neutral |

## 9 compatibility rules

| # | Rule | Severity | Logic |
|---|------|----------|-------|
| 1 | Hotel check-in alignment | Error | Check-in must not be after flight arrival |
| 2 | Hotel check-out alignment | Error | Check-out must not be before return flight departure |
| 3 | Location match | Error | Hotel city must match flight destination |
| 4 | Passenger count | Error | Room occupancy must accommodate passengers |
| 5 | Activity date range | Warning | Activity must fall within trip dates |
| 6 | Transfer timing | Warning | Arrival transfer >= 1 h after landing; departure >= 3 h before flight |
| 7 | Activity overlap | Warning | No time-slot collisions on same day |
| 8 | Insurance coverage | Warning | Must cover full trip duration |
| 9 | Hold expiry alignment | Info | All holds within 30 minutes of each other |

## Cancellation summary

- Package free-cancel deadline = `min(all component deadlines)`.
- Non-refundable = `true` if ANY component is non-refundable.
- Insurance: `coveredAmount = min(totalPenalties, coverageLimit)`.

:::caution Wiring pending
The following DI slots are currently stubs: `OfferResolver`, `PackageStore`, `HoldDispatchFn`, `ConfirmDispatchFn`, `IdempotencyCheck`. These use the `let resolver: X | null = null` pattern and must be wired to DynamoDB-backed implementations for production.
:::
