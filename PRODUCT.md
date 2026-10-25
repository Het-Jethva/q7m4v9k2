# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React frontend, Python backend, Docker, and Vercel or Heroku hosting, as required by the assignment. Implementation choices are delegated to the agent.

## Users

UK utility analysts buying electricity in the day-ahead market. They need the national wind forecast available at their decision time and quantitative evidence about forecast error.

## Product purpose

Reconstruct January 2026 purchasing decisions using only Elexon WIND actuals and WINDFOR forecasts. Make the decision cutoff explicit and keep later forecast updates out of the decision evidence.

## Operating context

Historical pilot for purchase decisions dated January 2026. The brief does not specify an exchange or gate closure. A configurable cutoff is an application assumption, not a claim about a particular auction.

## Capabilities and constraints

Forecast replay, actual comparison, quantitative error evaluation, coverage reporting, provenance, and downloadable data. No demand feed or prices are allowed by the brief. The app cannot calculate a customer's procurement volume without demand and portfolio positions. The user requested a demo script instead of a video.

## Brand commitments

The user delegated naming and visual decisions. Build a restrained, readable analyst workspace.

## Evidence on hand

Assignment PDF, extracted to .firecrawl/challenge.md. Official Elexon API references. Source observations must be retrieved and retained with provenance. Never replace unavailable observations with synthetic data.
