---
title: "Saga Orchestrator"
sidebar_label: "Saga orchestrator"
---

# Saga Orchestrator

## What sagas do

A saga is a multi-step distributed transaction with automatic rollback (compensation). In the dynamic packaging context, holding or booking a package involves sequential operations across multiple suppliers — if the hotel hold fails after the flight hold succeeded, the flight hold must be rolled back.

## State machine

```
Saga: running → completed (all steps done)
              → failed (any step failed)
              → compensating → compensated

Step: pending → completed → compensating → compensated
                          → failed
```

## Lifecycle

1. **`createSaga(packageId, steps)`** — Generates `saga-{uuid}`, all steps start `pending`, saga status `running`.
2. **`executeStep(sagaId, stepId)`** — Validates step is `pending`, delegates to step-executor, persists result. Failed step sets saga to `failed`. All completed sets saga to `completed`.
3. **`compensate(sagaId)`** — Sets saga to `compensating`, runs `compensateAll()` in reverse order.

## Compensation rules (PRD 5.6)

- **Reverse order:** last completed step compensated first.
- **3 retries** with exponential backoff: 1 s, 2 s, 4 s.
- **Idempotent:** compensation actions are safe to retry.
- **Dead letter** on all retries exhausted.
- **Compensation map:** `book` → `cancel`, `hold` → `cancel`, `confirm` → `cancel`.
- Steps without a `compensationAction` are skipped (counted as success).

## Hold management

`HoldManager` tracks per-component hold records:

- `packageId`
- `sagaId`
- `module`
- `supplier`
- `offerId`
- `holdExpiresAt`
- `status` (`active` | `expired` | `released` | `compensated`)

**Effective hold** = minimum expiry across all active holds.

**Warning threshold** at 80% of remaining duration.

Scheduled Lambda scans every minute for holds expiring in the next 2 minutes.

## Persistence

**DynamoDB schema:**

| Key | Value |
|-----|-------|
| PK = `SAGA#{sagaId}`, SK = `META` | Saga definition |
| PK = `SAGA#{sagaId}`, SK = `STEP#{id}` | Step state |

**TTL:** 7 days.

Two implementations:
- `SagaStateStore` — DynamoDB-backed (production).
- `InMemorySagaStateStore` — in-memory (testing).

## Step Functions adapter

`StepFunctionsAdapter` bridges AWS Step Functions callbacks to the `SagaOrchestrator`.

Methods:

- **`handleTask`** — Execute step, send SFN success/failure.
- **`handleCompensation`** — Trigger rollback.
- **`handleConfirmationCallback`** — Client decision (confirm or cancel).
