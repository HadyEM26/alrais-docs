---
title: "Admin Panel Wiring"
sidebar_label: "Admin panel wiring"
---

# Admin Panel Wiring

## Available admin endpoints

| Handler | Method | Path | Status |
|---------|--------|------|--------|
| Pricing Rules | GET | `/api/admin/pricing-rules` | Working |
| Pricing Rules | GET | `/api/admin/pricing-rules/:ruleId` | Working |
| Pricing Rules | POST | `/api/admin/pricing-rules` | Working |
| Pricing Rules | PUT | `/api/admin/pricing-rules/:ruleId` | Working |
| Pricing Rules | DELETE | `/api/admin/pricing-rules/:ruleId` | Working (soft-delete) |
| Package Templates | GET | `/api/admin/package-templates` | Working |
| Package Templates | GET | `/api/admin/package-templates/:id` | Working |
| Package Templates | POST | `/api/admin/package-templates` | Working |
| Package Templates | PUT | `/api/admin/package-templates/:id` | Working |
| Supplier Priorities | GET | `/api/admin/supplier-priorities` | Working |
| Supplier Priorities | POST | `/api/admin/supplier-priorities` | Working |
| Supplier Priorities | PUT | `/api/admin/supplier-priorities/:id` | Working |
| Yield Config | GET | `/api/admin/yield-config` | Working |
| Yield Config | PUT | `/api/admin/yield-config` | Working |

## Pricing rules

`PricingRuleConfig` schema:

| Field | Type | Notes |
|-------|------|-------|
| `ruleId` | string | Unique identifier |
| `name` | string | Display name |
| `description` | string? | Optional description |
| `type` | enum | `margin_override`, `bundle_discount`, `promotional_discount`, `yield_adjustment`, `minimum_floor`, `maximum_cap` |
| `scope` | enum | `global`, `module`, `supplier`, `route`, `destination`, `seasonal` |
| `priority` | number | Lower number = higher priority |
| `active` | boolean | Whether rule is applied |
| `conditions` | object | `module?`, `supplier?`, `origin?`, `destination?`, `validFrom?`, `validUntil?` |
| `value` | number | Rule value (percentage or absolute depending on type) |
| `createdBy` | string? | Author |
| `createdAt` | string | ISO timestamp |
| `updatedAt` | string | ISO timestamp |

## Package templates

`PackageTemplate` schema:

| Field | Type | Notes |
|-------|------|-------|
| `templateId` | string | Unique identifier |
| `name` | string | Display name |
| `description` | string | Template description |
| `label` | string? | Optional label (e.g., `best_value`) |
| `destination` | string | Target destination |
| `durationNights` | number | Trip length |
| `components` | array | `{module, required, preferences?}` per component |
| `preferences` | object | `hotelStarRating?`, `cabinClass?`, `activityCategories?`, `boardBasis?` |
| `active` | boolean | Whether template is available |
| `validFrom` | string? | Start of validity window |
| `validUntil` | string? | End of validity window |
| `createdBy` | string? | Author |
| `createdAt` | string | ISO timestamp |
| `updatedAt` | string | ISO timestamp |

## Supplier priorities

`SupplierPriorityRule` schema:

| Field | Type | Notes |
|-------|------|-------|
| `priorityId` | string | Unique identifier |
| `capability` | string | Supplier capability (e.g., `flights`, `hotels`) |
| `supplierOrder` | string[] | Ordered list of supplier IDs |
| `destination` | string? | Optional destination scope |
| `active` | boolean | Whether rule is active |
| `createdAt` | string | ISO timestamp |
| `updatedAt` | string | ISO timestamp |

## Yield config

`YieldConfig` schema:

| Field | Type | Notes |
|-------|------|-------|
| `configId` | string | Unique identifier |
| `proximityBands` | array | Departure proximity adjustment bands |
| `dayOfWeekFactors` | object | Per-day-of-week multipliers |
| `seasons` | array | Season definitions with date ranges and factors |
| `maxYieldFactor` | number | Upper clamp (default 1.25) |
| `minYieldFactor` | number | Lower clamp (default 0.85) |
| `enabled` | boolean | Whether yield management is active |
| `updatedAt` | string | ISO timestamp |
| `updatedBy` | string? | Last modifier |

:::caution Frontend not wired
All admin endpoints are built and tested in the middleware, but the admin panel frontend (Al-Rais-Admin-Panel) is not yet connected to them. The frontend currently uses mock seed data. Wiring requires: adding `VITE_MIDDLEWARE_BASE_URL` to the frontend env, adding admin type definitions, and building admin CRUD pages.
:::
