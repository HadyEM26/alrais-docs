---
title: "Dynamic Packages — Gaps"
sidebar_label: "Package gaps"
---

# Dynamic Packages — Gaps

## DI slots using stub pattern

The package handlers use a consistent lazy-init singleton pattern: `let dependency: SomeType | null = null`. These must be wired to production implementations:

| Handler | Stub Variable | Interface | Production Implementation |
|---------|---------------|-----------|--------------------------|
| `package-compose.ts` | `offerResolver` | `OfferResolver` | DynamoDB offer map lookup |
| `package-hold.ts` | `holdDispatch` | `HoldDispatchFn` | Lambda invoke to supplier worker |
| `package-hold.ts` | `sagaOrchestrator` | `ISagaOrchestrator` | DynamoDB-backed SagaOrchestrator |
| `package-hold.ts` | `holdManager` | `HoldManager` | DynamoDB-backed HoldManager |
| `package-confirm.ts` | `confirmDispatch` | `ConfirmDispatchFn` | Lambda invoke to supplier worker |
| `package-confirm.ts` | `idempotencyCheck` | `IdempotencyCheck` | DynamoDB idempotency table |
| `package-status.ts` | `packageStore` | `IPackageStore` | DynamoDB packages table |

## Missing from serverless.yml

The admin API handlers (pricing-rules, package-templates, supplier-priorities, yield-config) are not registered as Lambda functions in `serverless.yml`. They exist as code but have no deployment configuration.

## Currency conversion

`LiveCurrencyConverter` exists but requires `OPEN_EXCHANGE_RATES_APP_ID` in config. Bundle pricing falls back to `PassthroughCurrencyConverter` (1:1 rates) when not configured.

## Transfer and insurance gaps

- **Insurance connector** is a stub (`InsuranceConnectorStub`) — no real supplier connected.
- **Transfer connector** is live via Viator but relies on a tag-based heuristic, not a dedicated transfer API.
