---
title: Supplier Connectors
sidebar_label: Overview
sidebar_position: 1
---

# Supplier connectors

The Al Rais middleware integrates with multiple travel suppliers across five verticals. Each connector implements the `SupplierConnector` interface, providing a unified contract for search, book, hold, cancel, and enrichment operations.

## Connector landscape

| Connector | Vertical | Auth | Capabilities | Status |
|-----------|----------|------|-------------|--------|
| **Provesio** | Flights | Bearer (forwarded) | Search, book, fare rules | Live |
| **Duffel** | Flights | Bearer (static) | Search, book, hold, cancel, fare calendar | Live |
| **Duffel Stays** | Hotels | Bearer (shared with flights) | Search, book, cancel | Live |
| **Hotelbeds** | Hotels | HMAC (SHA-256) | Search | Built (booking Phase 4) |
| **RateHawk (ETG)** | Hotels | Basic | Search, book, hold, cancel, details | Live |
| **Viator** | Activities | API Key | Search, book, cancel, details, availability, booking questions | Live |
| **Viator Transfers** | Transfers | API Key (shared) | Search, book, cancel | Live |

## Enrichment connectors

These connectors provide destination context and enrichment data, not transactional operations:

| Connector | Purpose | Auth |
|-----------|---------|------|
| Teleport | City quality-of-life insights | None (free API) |
| Open-Meteo | Weather forecasts | None (free API) |
| Foursquare | Points of interest | API Key |
| BudgetYourTrip | Destination cost estimates | API Key |
| Tavily | Web search for destination context | API Key |

## How connectors are registered

All connectors are wired at Lambda cold start via `createDefaultRegistry()` in `src/connectors/registry.ts`. The registry provides two key operations:

- **`get(name)`** -- exact lookup by connector name
- **`getByCapability(capability)`** -- returns all connectors declaring a given capability, enabling fan-out search across competing suppliers

Connectors with optional API keys (Viator, Hotelbeds, RateHawk, etc.) are only registered when their credentials are present in the environment.
