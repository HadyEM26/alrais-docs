---
title: Revenue Analytics
sidebar_label: Revenue Analytics
sidebar_position: 4
---

# Revenue Analytics

The Revenue API provides suppliers with financial performance data: gross booking value, per-route revenue breakdowns, and historical trends.

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/portal/v1/revenue/summary` | GET | Revenue summary for the current period |
| `/portal/v1/revenue/by-route` | GET | Revenue breakdown by route |
| `/portal/v1/revenue/trend` | GET | Historical revenue trend |

## Revenue Summary

Returns aggregate revenue metrics for the authenticated supplier.

**`GET /portal/v1/revenue/summary`**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | `daily` \| `weekly` \| `monthly` | `daily` | Aggregation window |

**Response:**

```json
{
  "success": true,
  "data": {
    "grossBookingValue": 185000.00,
    "bookingCount": 420,
    "avgBookingValue": 440.48,
    "winCount": 890
  },
  "meta": {
    "period": "weekly",
    "dataPoints": 7,
    "lastUpdated": "2025-04-28T14:30:00Z"
  }
}
```

| Field | Calculation |
|-------|-------------|
| `grossBookingValue` | Sum of `revenue` from all booking events in the period |
| `avgBookingValue` | `grossBookingValue / bookingCount` |
| `winCount` | Curation engine selections (superset of bookings) |

## Revenue by Route

Breaks down revenue by origin–destination route, ranked by total revenue.

**`GET /portal/v1/revenue/by-route`**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | `daily` \| `weekly` \| `monthly` | `daily` | Aggregation window |
| `limit` | `1–50` | `20` | Max routes returned |
| `from` | `YYYY-MM-DD` | — | Optional start date filter |
| `to` | `YYYY-MM-DD` | — | Optional end date filter |

**Response:**

```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "route": "DXB-LHR",
        "revenue": 45000.00,
        "bookingCount": 102,
        "avgBookingValue": 441.18,
        "winCount": 215
      },
      {
        "route": "DXB-BOM",
        "revenue": 32000.00,
        "bookingCount": 89,
        "avgBookingValue": 359.55,
        "winCount": 178
      }
    ]
  }
}
```

## Revenue Trend

Historical time series of revenue and bookings for charting.

**`GET /portal/v1/revenue/trend`**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `granularity` | `daily` \| `weekly` \| `monthly` | `daily` | Time bucket size |
| `from` | `YYYY-MM-DD` | — | Optional start date |
| `to` | `YYYY-MM-DD` | — | Optional end date |

**Response:**

```json
{
  "success": true,
  "data": {
    "trend": [
      { "period": "2025-04-21", "revenue": 22000.00, "bookingCount": 52 },
      { "period": "2025-04-22", "revenue": 28500.00, "bookingCount": 64 },
      { "period": "2025-04-23", "revenue": 19800.00, "bookingCount": 45 },
      { "period": "2025-04-24", "revenue": 31200.00, "bookingCount": 71 },
      { "period": "2025-04-25", "revenue": 26400.00, "bookingCount": 58 }
    ]
  }
}
```

## Data Source

Revenue metrics are sourced from the `supplier-portal-metrics` DynamoDB table. Metrics are pre-aggregated by the middleware event pipeline — the portal reads, not computes.

| Partition Key | Sort Key Pattern | Data |
|---------------|-----------------|------|
| `SUPPLIER#{supplierId}` | `DAILY#{YYYY-MM-DD}` | Daily aggregates |
| `SUPPLIER#{supplierId}` | `MONTHLY#{YYYY-MM}` | Monthly rollups |

Revenue data has the same freshness characteristics as performance metrics (real-time writes from middleware, up to 5-minute lag).
