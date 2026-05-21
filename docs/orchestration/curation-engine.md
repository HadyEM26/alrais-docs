---
title: "Curation Engine"
sidebar_label: "Curation engine"
---

# Curation Engine

The curation engine scores, selects, and explains offers across three verticals (flights, hotels, activities) and packages. It is deterministic — no LLM, no randomization.

## Flight curation

7 rules with weights:

| Rule | Weight | Logic |
|------|--------|-------|
| `price_position` | 0.30 | Cheaper is better. `(max - offer) / (max - min)`. |
| `duration_position` | 0.20 | Shorter total duration is better. |
| `stop_penalty` | 0.15 | 0 stops = 1.0, 1 = 0.7, 2 = 0.4, 3+ = 0.0. |
| `departure_time_fit` | 0.10 | Fit to user's preferred departure window. |
| `family_compatibility` | 0.10 | Active only when `isFamily=true`. Scores: fewer stops (0.4), mid-morning departure (0.3), shorter duration (0.3). When not a family trip, weight redistributed proportionally. |
| `carrier_preference` | 0.10 | Preferred = 1.0, Major Gulf/European = 0.8, Known = 0.6, Unknown = 0.4. |
| `data_freshness` | 0.05 | `max(0, 1 - age/300s)`. 5-minute threshold. |

**Composite score** = sum of all `(rawScore * effectiveWeight)`.

**Selection:** cheapest, fastest, recommended (highest composite).

**Collision handling:** if recommended == cheapest, bump recommended to next-best.

## Hotel curation

6 rules:

| Rule | Weight | Logic |
|------|--------|-------|
| `hotel_price_position` | 0.25 | Lower price scores higher. |
| `hotel_star_rating` | 0.20 | Higher star rating scores higher. |
| `hotel_location_proximity` | 0.20 | Haversine distance to city center, max 30 km. |
| `hotel_review_score` | 0.15 | Higher review score is better. |
| `hotel_board_basis` | 0.10 | breakfast = 1.0, room_only = 0.7. |
| `hotel_cancellation_flexibility` | 0.10 | Free cancellation scores higher. |

**Labels:** `best_overall`, `best_value`, `luxury` (highest star).

## Activity curation

5 rules:

| Rule | Weight | Logic |
|------|--------|-------|
| `activity_review_score` | 0.30 | Higher review score is better. |
| `activity_price_position` | 0.20 | Lower price scores higher. |
| `activity_category_match` | 0.20 | Trip-type aware: family → kids/theme_park, adventure → outdoor/desert, business → cultural/museum. |
| `activity_duration_fit` | 0.15 | Sweet spot 2–4 h = 1.0. |
| `activity_availability` | 0.15 | More available slots score higher. |

**Labels:** `top_rated`, `best_value`, `unique_experience`.

## Package curation

6 rules:

| Rule | Weight |
|------|--------|
| `package_total_price` | 0.25 |
| `package_component_quality` | 0.20 |
| `package_schedule_coherence` | 0.20 |
| `package_savings` | 0.15 |
| `package_supplier_diversity` | 0.10 |
| `package_flexibility` | 0.10 |

## Explanation generation

Template-based, one sentence each:

- **explainRecommended:** `"Best overall option — balances {dominant} with {secondary}."`
- **explainCheapest:** `"Lowest fare at {price}, departure {time}."`
- **explainFastest:** `"{stops text}, arrives {time}."`

## Tradeoff annotations

- **Recommended:** "Saves X vs cheapest for Y more."
- **Cheapest:** "Adds X travel time vs fastest."
- **Fastest:** "Y more than cheapest option."
