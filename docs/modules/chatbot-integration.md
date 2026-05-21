---
title: "Chatbot Integration"
sidebar_label: "Chatbot integration"
---

# Chatbot Integration

## Middleware endpoints available for chatbot

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/middleware/flights/search` | POST | Search flights |
| `/middleware/hotels/search` | POST | Search hotels |
| `/middleware/packages/search` | POST | Search dynamic packages |
| `/middleware/packages/compose` | POST | Compose a custom package |
| `/middleware/packages/{id}/hold` | POST | Hold a package |
| `/middleware/packages/{id}/confirm` | POST | Confirm a package |
| `/middleware/packages/{id}/status` | GET | Check package status |
| `/middleware/activities/{code}` | GET | Get enriched activity details |
| `/middleware/activities/{code}/booking-questions` | GET | Get booking questions |
| `/middleware/transfers/search` | POST | Search transfers |
| `/middleware/bookings/{id}/status` | GET | Check booking status |

:::note Chatbot repo not in scope
The chatbot source lives in a separate repository (travel_chatbot). This page documents the middleware endpoints it should consume. Agent structure and conversation flow documentation will be added when the chatbot repo is included in the documentation scope.
:::
