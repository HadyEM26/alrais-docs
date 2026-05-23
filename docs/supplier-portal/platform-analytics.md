---
title: Platform Analytics
sidebar_label: Platform Analytics
sidebar_position: 3
---

# Platform Analytics

:::warning Admin only
All endpoints in this section require the `admin` role. Non-admin users will receive a `403 Forbidden` response.
:::

Platform analytics provides an aggregate view across **all suppliers** on the platform. This is the admin-level counterpart to the per-supplier performance dashboard.

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/portal/v1/admin/analytics/summary` | GET | Platform-wide aggregate metrics |
| `/portal/v1/admin/analytics/top-suppliers` | GET | Ranked supplier leaderboard |
| `/portal/v1/admin/analytics/conversion-funnel` | GET | Platform-wide conversion funnel |
| `/portal/v1/admin/reports` | GET | Downloadable reports (CSV/JSON) |

## Platform Summary

Aggregates metrics across all suppliers using the `PLATFORM#ALL` partition key.

**`GET /portal/v1/admin/analytics/summary`**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | `daily` \| `weekly` \| `monthly` | `weekly` | Aggregation window |

**Response:**

```json
{
  "success": true,
  "data": {
    "searchCount": 15200,
    "offerCount": 12800,
    "avgLatencyMs": 1450,
    "availability": 97.2,
    "errorCount": 45,
    "circuitTrips": 3,
    "winCount": 4200,
    "bookingCount": 1050,
    "revenue": 892000.50,
    "dataPoints": 7,
    "lastUpdated": "2025-04-28T14:30:00Z"
  },
  "meta": { "period": "weekly" }
}
```

### DynamoDB Partition Pattern

Platform-wide metrics use a special partition key `PLATFORM#ALL` rather than a supplier-specific key. The sort key follows the same `DAILY#`, `MONTHLY#` pattern as supplier metrics.

## Top Suppliers

Returns a ranked list of suppliers sorted by the specified metric.

**`GET /portal/v1/admin/analytics/top-suppliers`**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | `daily` \| `weekly` \| `monthly` | `weekly` | Aggregation window |
| `sortBy` | `bookingCount` \| `revenue` \| `searchCount` | `bookingCount` | Ranking criteria |
| `limit` | `1–50` | `10` | Number of suppliers to return |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "supplierId": "SUP-001",
      "searchCount": 3200,
      "bookingCount": 420,
      "revenue": 185000.00,
      "winCount": 890,
      "availability": 99.1
    },
    {
      "supplierId": "SUP-002",
      "searchCount": 2800,
      "bookingCount": 380,
      "revenue": 162000.00,
      "winCount": 720,
      "availability": 97.5
    }
  ],
  "meta": { "period": "weekly", "sortBy": "bookingCount", "limit": 10 }
}
```

## Platform Conversion Funnel

Same funnel structure as the per-supplier intelligence funnel, but aggregated across the entire platform.

**`GET /portal/v1/admin/analytics/conversion-funnel`**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | `daily` \| `weekly` \| `monthly` | `weekly` | Aggregation window |

**Response:**

```json
{
  "success": true,
  "data": {
    "searches": 15200,
    "offers": 12800,
    "wins": 4200,
    "bookings": 1050,
    "searchToOfferRate": 84.2,
    "offerToWinRate": 32.8,
    "winToBookingRate": 25.0,
    "overallConversion": 6.9
  },
  "meta": { "period": "weekly" }
}
```

## Admin Reports

Generate downloadable reports in CSV or JSON format. Reports aggregate supplier performance data and support three report types.

**`GET /portal/v1/admin/reports`**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | `bookings` \| `revenue` \| `supplier_performance` | **required** | Report type |
| `period` | `daily` \| `weekly` \| `monthly` | `weekly` | Aggregation window |
| `format` | `csv` \| `json` | `json` | Output format |

### JSON Response

```json
{
  "success": true,
  "data": [
    {
      "supplierId": "SUP-001",
      "searchCount": 3200,
      "bookingCount": 420,
      "revenue": 185000.00,
      "winCount": 890,
      "availability": 99.1
    }
  ],
  "meta": {
    "reportType": "supplier_performance",
    "period": "weekly",
    "generatedAt": "2025-04-28T15:00:00Z"
  }
}
```

### CSV Response

When `format=csv`, the response returns with:
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="{type}-report-{period}-{date}.csv"`

```csv
supplierId,searchCount,bookingCount,revenue,winCount,availability
SUP-001,3200,420,185000.00,890,99.1
SUP-002,2800,380,162000.00,720,97.5
```

### Report Types

| Type | Description | Sorted By |
|------|-------------|-----------|
| `bookings` | Top 50 suppliers by booking volume | `bookingCount` DESC |
| `revenue` | Top 50 suppliers by gross booking value | `revenue` DESC |
| `supplier_performance` | Combined platform summary + supplier rankings | `bookingCount` DESC |

:::info Timeout
Report generation has a 60-second Lambda timeout to accommodate large data scans.
:::
