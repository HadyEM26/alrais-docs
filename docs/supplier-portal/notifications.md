---
title: Notifications & Campaigns
sidebar_label: Notifications
sidebar_position: 7
---

# Notifications, Campaigns & A/B Testing

The notification system manages supplier communication preferences, tracks campaign engagement (opens and clicks), and supports A/B testing with deterministic variant assignment.

## Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/portal/v1/notifications/preferences` | GET | Any role | Get notification preferences |
| `/portal/v1/notifications/preferences` | PATCH | Any role | Update notification preferences |
| `/portal/v1/notifications/unsubscribe` | POST | Any role | Unsubscribe from all notifications |
| `/portal/v1/admin/campaigns/analytics` | GET | `admin` | Campaign engagement metrics |
| `/portal/v1/admin/ab-tests` | GET | `admin` | A/B test results |
| `/portal/v1/ab-tests/assign` | POST | Any role | Get deterministic variant assignment |

## Notification Preferences

Suppliers configure which notifications they receive across channels and categories.

### Channels

| Channel | Description |
|---------|-------------|
| `email` | Email notifications |
| `in_app` | In-app notification center |
| `sms` | SMS alerts (where supported) |

### Categories

| Category | Description |
|----------|-------------|
| `booking_alerts` | New booking confirmations and cancellations |
| `performance_reports` | Weekly/monthly performance digests |
| `rate_approvals` | Rate submission approval/rejection notices |
| `product_updates` | Product catalog status changes |
| `platform_news` | Platform-wide announcements |
| `competitive_insights` | Competitive positioning changes |

### Get Preferences

**`GET /portal/v1/notifications/preferences`**

```json
{
  "success": true,
  "data": {
    "supplierId": "SUP-001",
    "preferences": {
      "booking_alerts": { "email": true, "in_app": true, "sms": false },
      "performance_reports": { "email": true, "in_app": true, "sms": false },
      "rate_approvals": { "email": true, "in_app": true, "sms": true },
      "product_updates": { "email": false, "in_app": true, "sms": false },
      "platform_news": { "email": true, "in_app": true, "sms": false },
      "competitive_insights": { "email": false, "in_app": true, "sms": false }
    },
    "unsubscribedAll": false
  }
}
```

### Update Preferences

**`PATCH /portal/v1/notifications/preferences`**

Send only the categories you want to update:

```json
{
  "preferences": {
    "booking_alerts": { "email": true, "in_app": true, "sms": true },
    "competitive_insights": { "email": true, "in_app": true, "sms": false }
  }
}
```

### Unsubscribe All

**`POST /portal/v1/notifications/unsubscribe`**

Sets `unsubscribedAll: true` and disables all notification channels. Individual preferences are preserved and restored if the user re-subscribes.

```json
{
  "success": true,
  "data": {
    "message": "Unsubscribed from all notifications.",
    "unsubscribedAll": true
  }
}
```

## Campaign Analytics

:::warning Admin only
Campaign analytics requires the `admin` role.
:::

**`GET /portal/v1/admin/campaigns/analytics`**

Returns engagement metrics for notification campaigns.

```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "campaignId": "CAMP-2025-001",
        "name": "Q2 Performance Review",
        "sentCount": 150,
        "openCount": 92,
        "clickCount": 34,
        "openRate": 61.3,
        "clickRate": 22.7,
        "sentAt": "2025-04-15T10:00:00Z"
      }
    ]
  }
}
```

| Metric | Calculation |
|--------|-------------|
| `openRate` | `openCount / sentCount * 100` |
| `clickRate` | `clickCount / sentCount * 100` |

## A/B Testing

The A/B testing system supports deterministic variant assignment for notification experiments.

### Get Test Results

:::warning Admin only
A/B test results require the `admin` role.
:::

**`GET /portal/v1/admin/ab-tests`**

```json
{
  "success": true,
  "data": {
    "tests": [
      {
        "testId": "ABT-001",
        "name": "Email Subject Line Test",
        "status": "completed",
        "startDate": "2025-04-01",
        "endDate": "2025-04-15",
        "variants": [
          {
            "variantId": "A",
            "name": "Short Subject",
            "sampleSize": 75,
            "openRate": 58.7,
            "clickRate": 21.3,
            "conversionRate": 12.0
          },
          {
            "variantId": "B",
            "name": "Personalized Subject",
            "sampleSize": 75,
            "openRate": 66.7,
            "clickRate": 28.0,
            "conversionRate": 18.7,
            "winner": true
          }
        ]
      }
    ]
  }
}
```

### Assign Variant

**`POST /portal/v1/ab-tests/assign`**

Deterministic assignment ensures the same user always gets the same variant for a given test.

```json
{
  "testId": "ABT-001"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "testId": "ABT-001",
    "variantId": "B",
    "variantName": "Personalized Subject"
  }
}
```

### Assignment Algorithm

Variant assignment uses a hash-based deterministic algorithm:

```
hash(supplierId + testId) % variantCount → variantIndex
```

This ensures:
- Same supplier always gets the same variant for a given test
- No database lookup needed for assignment (stateless)
- Even distribution across variants
