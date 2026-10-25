# Northline demo script

Target length is nine minutes, leaving one minute of margin under the assignment's maximum. Part one presents the pilot to the client. Part two explains the implementation to the technical lead. Numbers below refer to the bundled snapshot at a 09:00 London cutoff.

## Prepare the demonstration

1. Open the deployed app in a private browser window.
2. Open the repository and docs/METHODOLOGY.md in separate tabs.
3. Keep the terminal ready with the Python environment activated.
4. Select purchase decision January 15, 2026 and cutoff 09:00. Keep actual comparison off and use GW display.
5. Use a desktop viewport so the chart and decision details are visible together.

No video is created by this deliverable. Record the following script when ready.

## Part one, client presentation, 0:00 to 4:30

### 0:00 to 0:40, introduce the purchasing problem

Show the Forecast view.

"When your team buys tomorrow's power, the wind forecast is one of the inputs that determines how much other generation may be needed. The difficult question is not what the forecast says now. It is what forecast was available when you had to make the decision, and how much trust to place in it.

Northline is a pilot workspace for answering those questions. It reconstructs January 2026 decisions using Elexon wind forecasts and actual generation. It keeps decision-time evidence separate from hindsight."

### 0:40 to 1:40, replay a real decision

Point out the purchase date, next-day delivery date, and cutoff. Read the selected publication time from the interface.

"Here we are replaying the purchase decision on January 15 for delivery on January 16. The assumed cutoff is 09:00 London time. The brief does not specify an auction deadline, so you can change this cutoff.

For every delivery hour, the application selects the latest forecast published by the cutoff. It never substitutes a forecast published later. The source publication is visible beside the forecast values.

On this day the average forecast is about 7.93 GW. The forecast ranges from about 6.24 to 10.38 GW. All 24 delivery hours have an eligible forecast. This is a system-level wind view. It is not a calculation of your portfolio's purchase volume."

Hover over a chart point and show its forecast value.

### 1:40 to 2:30, demonstrate missing evidence

Change the cutoff to 00:00. Point to coverage and the final two missing hours. Change back to 09:00.

"Changing the cutoff reconstructs the information set available at that earlier time. At midnight, this snapshot has no eligible forecast for the last two delivery hours. The chart leaves a gap and the table marks those hours unavailable. It does not invent a value or borrow a later update.

This matters because a smooth-looking chart could otherwise conceal missing decision evidence. Coverage is part of the result."

### 2:30 to 3:10, compare with hindsight

Enable actual comparison. Show the two chart series and one interval-table row.

"Now I explicitly turn on hindsight comparison. Elexon actuals arrive every half-hour, while the forecasts are hourly. We compare each forecast with the mean of its two actual half-hours. Both halves must exist.

The representative-hour convention is an assumption documented in the methodology. On this selected day, the mean absolute error is about 0.783 GW. The actuals help us evaluate the decision evidence. They were not available at the purchase cutoff."

### 3:10 to 4:00, evaluate the full pilot

Open Accuracy. Use the full January purchase-date range and 09:00 cutoff.

"Across the full month, we have 744 matched hourly observations. Mean absolute error is about 2.04 GW and RMSE is about 2.50 GW. Positive bias is about 1.75 GW, so wind was overforecast on average in this sample. WAPE is about 18.07 percent.

Overforecast wind can increase the amount of other generation a utility needs. These figures quantify historical error. They are not a calibrated guarantee about tomorrow, and they do not include demand, portfolio positions, or prices."

Point to the daily comparison. Open a day to show how an analyst can investigate an individual result.

### 4:00 to 4:30, close the client pitch

Show Export CSV and Methodology.

"The pilot gives your analysts a repeatable decision-time forecast, visible missing-data coverage, and quantitative historical error evidence. They can export every selected observation with its publication time, source identifiers, and snapshot hash.

The next production step would be to agree the exact operational cutoff and portfolio requirements, then validate the analysis on a separate period. This first version deliberately stays within the two Elexon feeds in the brief."

## Part two, technical review, 4:30 to 9:00

### 4:30 to 5:15, explain the architecture

Show the repository and docs/ARCHITECTURE.md.

"The client is React with TypeScript. The backend is Python with FastAPI. React owns view state, controls, and charts. Python owns forecast selection, interval matching, metrics, and CSV exports, so the browser does not carry a second version of the calculation.

For this fixed historical month, I chose a compressed immutable snapshot instead of a database. Two design candidates compared those options. A separate reviewer favored the snapshot for scope and deployment simplicity. It contains every relevant publication version, not just the final forecast."

### 5:15 to 6:00, show the data pipeline

Open scripts/fetch_data.py, data/manifest.json, and one data/raw file name.

"The acquisition script fetches forecasts by publication window and actuals by delivery date. January purchase decisions mean January 2 through February 1 delivery, so the snapshot includes that February boundary.

The manifest records 64 requests, retrieval times, row counts, and SHA256 hashes. Original responses are retained in compressed form. Only WIND actuals enter the analysis. Backend loading verifies hashes and checks each normalized observation against its retained source response."

### 6:00 to 6:50, show the central domain logic

Open backend/analysis.py, especially replay and metrics.

"The core data shape is a target time with an ordered publication history. Replay uses the greatest publication time no later than the cutoff, independently for each target hour. A forecast exactly at the cutoff is eligible. No eligible forecast means null.

Actual matching requires both half-hours. Actuals use the latest retained revision because evaluation is retrospective. The forecast desk hides actuals by default. Monthly RMSE comes from all matched hourly errors, rather than averaging daily RMSE. Empty samples and zero denominators return unavailable values."

### 6:50 to 7:40, demonstrate verification

Run `python -m pytest -q`. Then show docs/data-verification.json or run `python scripts/verify_data.py --base-url http://127.0.0.1:8000` when a local server is running.

"The test suite covers exact cutoff inclusion, future-publication exclusion, January-to-February delivery, missing forecast hours, incomplete actual pairs, revisions, known metric values, validation errors, unavailable snapshots, and CSV parity.

A separate verification script independently reconstructs expected values from the original Elexon responses. It checks every January decision at four cutoffs, covering 124 replays and 2,976 hourly targets. That provides a check beyond testing the same analysis implementation against itself."

### 7:40 to 8:20, explain the frontend and delivery

Show frontend/api.ts and Dockerfile, then return to the deployed application.

"The interface uses shadcn components with one shared theme. The frontend validates API responses before displaying them. Requests cancel when filters change, and the interface avoids showing old values under new date labels. Controls include date, cutoff, unit conversion, explicit hindsight comparison, and data exports. There are visible loading, error, and missing-data states.

Docker builds the React assets and serves the complete app through Python. Vercel serves the frontend and Python API from one project. Production reads the tested snapshot rather than calling Elexon during user requests. This keeps the demonstration reproducible and avoids upstream outages changing a demo."

### 8:20 to 9:00, disclose limits and close

Show docs/METHODOLOGY.md and the README AI disclosure.

"The main analytical limits are explicit. Hourly forecast cadence does not prove interval-average semantics, so the comparison uses a documented representative-hour assumption. Actuals can be revised. Forecast publication time stands in for availability, without modeling transmission latency. These are historical descriptive errors, not a calibrated prediction interval or portfolio trading recommendation.

AI assisted the design, implementation, documentation, and verification. Only GPT-6.1 Sol was used for delegated work, as requested. The README records that disclosure and gives setup, deployment, architecture, and source details. The repository and app links can be checked without authentication."
