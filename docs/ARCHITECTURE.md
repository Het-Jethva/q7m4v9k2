# Architecture

Northline reconstructs a decision-time national wind forecast and evaluates its retrospective error. React owns controls and presentation through shadcn/ui components. Python owns all data selection, alignment, metrics, and export logic.

## Design comparison

Two GPT-6.1 Sol candidates explored immutable JSON and read-only SQLite. A third GPT-6.1 Sol judge rated both equally on temporal correctness and auditability. JSON scored higher on implementation simplicity and deployment portability. SQLite scored higher on extensibility. The selected JSON design fits one historical month and avoids a database lifecycle in a read-only serverless pilot.

The SQLite candidate contributed a stable normalized schema, per-target publication indexes, and manifest-backed provenance. Neither candidate permits later forecasts or invented observations to fill gaps.

## Ownership

scripts/fetch_data.py retrieves and retains original Elexon responses, normalizes observations, rejects conflicting duplicate values, and creates a hashed snapshot. data/manifest.json records requests, source hashes, retrieval timestamps, and scope. data/snapshot.json.gz contains all relevant forecast vintages and actual observations. backend/snapshot.py validates and indexes the snapshot. backend/analysis.py owns pure replay, matching, and error calculations. backend/app.py owns request validation and CSV serialization. The React client parses the API response before presenting it.

Production requests read the bundled immutable snapshot. Refresh is an explicit offline command followed by a tested redeployment. Runtime requests do not depend on Elexon availability or a writable filesystem.

## Temporal contract

Purchase dates are January 1 through January 31, 2026. Next-day delivery spans January 2 through February 1. Construct the cutoff in Europe/London and convert it to UTC. Select the greatest publishTime no later than that cutoff for each target hour. Expose every selected publication time. Different target hours may have different selected vintages.

## Analysis limits

Hourly forecast timestamps do not establish that the value is an hourly interval mean. This pilot explicitly treats each value as representative of the hour beginning at startTime. It compares that value with the mean of the two actual WIND half-hours in the hour. Both halves are required. This convention avoids pretending the hourly forecast is two independent half-hour predictions. The methodology and UI disclose the assumption.

Actuals are hindsight evidence and may be revised. They are hidden by default on the decision view. Evaluation metrics describe the selected historical sample. There is no fitted uncertainty model and no implied portfolio buy instruction.

## UI component system

`components.json` selects the Radix Nova shadcn registry style. Components live in `frontend/components/ui`. Tailwind CSS v4 runs through the Vite plugin. `frontend/styles.css` owns semantic colors, fonts, radius tokens, and responsive layout. Pages use component variants instead of a second set of custom control styles.

Navigation uses Tabs. Filters use Field, Input, and InputGroup. Hindsight uses Checkbox. Units use ToggleGroup. Charts use ChartContainer and ChartTooltipContent around Recharts. Evidence uses Table and Collapsible. The Table component accepts containerProps so the horizontal scrolling container owns keyboard focus and its accessible label.

`npm run check:ui` rejects raw controls in `frontend/main.tsx`. The production build runs this check before TypeScript and Vite. Date bounds, cutoff selection, unit conversions, and CSV parameters remain in the existing typed application state.
