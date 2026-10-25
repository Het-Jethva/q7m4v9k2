# Forecast selection and error evaluation

## Decision time comes before delivery

The brief asks for purchase decisions made in January 2026. Northline interprets this as January 1 through January 31 inclusive. Each decision concerns the next London calendar day's delivery, so the delivery period runs from January 2 through February 1.

The brief does not name an exchange or an auction deadline. Northline therefore uses a configurable assumed cutoff, initially 09:00 Europe/London. It is not an asserted market gate closure. All dates in scope fall in GMT. The backend still constructs timezone-aware London dates and converts source timestamps to UTC.

For each target hour, select the forecast with the greatest publishTime less than or equal to the cutoff. A publication exactly at the cutoff is eligible. Later updates are excluded. If there is no eligible record, return an explicit gap. Each hour retains its selected publication time and source identifier. Selection is per target, so a displayed day may combine several publication times.

Source publication time is the dataset's timestamp. The pilot assumes publication is usable at that time. It cannot reconstruct historical API latency or a particular trader's receipt time.

## Source data and hourly comparison

[Elexon's wind generation explanation](https://bmrs.elexon.co.uk/wind-generation) describes hourly forecasts for visible, operationally metered wind farms and compares them with generation-by-fuel outturn. This is a Great Britain system-level proxy, not every UK renewable source or the customer's renewable portfolio.

Northline uses only the two datasets required by the assignment:

- [WINDFOR stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream) provides forecast target time, publication time, and generation in MW.
- [FUELHH stream](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream), filtered to fuelType=WIND, provides half-hourly actual generation in MW.

The retrieved WINDFOR records occur on the hour. FUELHH occurs every half-hour. The pilot treats each hourly forecast as representative of the hour beginning at startTime and compares it with the arithmetic mean of the two actual half-hours in that hour. This representative-hour convention is an explicit analytical assumption. Hourly timestamp cadence alone does not establish that the forecast is an interval average.

Both actual halves must exist. Missing actual halves make the hour unavailable for error calculation. There is no interpolation, forward filling, zero filling, or duplication of hourly forecasts into two independent predictions. Latest retained actual revisions are hindsight evidence, not information the trader had at the decision cutoff. The forecast desk hides them until the user enables comparison.

This comparison measures error under a common hourly convention. It is not a statement that the source dataset is a perfect measurement of all national wind output. Elexon describes outturn as an estimate of telemetered generation that may use estimates where telemetry is unavailable.

## Error definitions

For each matched hour, let f be forecast MW, a be the mean actual MW, and e = f - a.

| Quantity | Calculation | Interpretation |
| --- | --- | --- |
| MAE | sum(abs(e)) / n | Typical absolute power error in MW. |
| RMSE | sqrt(sum(e²) / n) | Gives larger misses more weight, in MW. |
| Bias | sum(e) / n | Positive means overforecast wind. |
| WAPE | 100 × sum(abs(e)) / sum(a) | Absolute error relative to actual output over the matched sample. |
| P90 absolute error | Linearly interpolated 90th percentile of abs(e). | Descriptive historical magnitude, in MW. |

Monthly metrics pool all matched hours. They do not average daily RMSE or daily percentages. Every metric carries its paired-hour count. WAPE is unavailable when total actual generation is zero. All non-count metrics are unavailable when no hours match.

The P90 uses sorted absolute errors at position 0.9 × (n - 1), with linear interpolation between neighboring values. GW display divides MW values by 1,000. CSV always exports MW, irrespective of display units.

## Findings from the bundled snapshot

At 09:00, all 744 next-day hourly targets have forecasts and complete actual pairs. The pooled MAE is 2,038.91 MW, RMSE is 2,504.76 MW, and bias is +1,747.89 MW. WAPE is 18.07%. These are descriptive results for this downloaded sample, alignment convention, and cutoff.

At midnight, the snapshot lacks eligible forecasts for the final two delivery hours of every day. Coverage is 682 of 744 hours. Northline preserves those 62 gaps and excludes them from paired metrics. This is why the app reports coverage beside error metrics.

Positive forecast bias means actual wind was lower than forecast on average in this sample. That can increase a utility's residual procurement exposure, but this application has no customer demand, contracts, positions, prices, or plant data. It cannot calculate a purchase instruction or procurement cost.

These are in-sample historical summaries. They are not calibrated prediction intervals. No future-period validation, probabilistic forecast calibration, or trading profitability claim is made.

## Provenance and refresh

The repository contains all 64 compressed original source responses. The manifest records request URLs, retrieval timestamps, response SHA256 hashes, and row counts. A separate hash covers the normalized snapshot. Every normalized observation references a retained source response. Backend startup verifies hashes and observation evidence.

Forecast publications were requested from December 30, 2025 through January 31, 2026, with a publication-window upper bound of February 1. Targets outside January 2 through February 1 are discarded. Actuals cover all delivery days. Original FUELHH responses retain all returned fuels for audit, but only WIND enters the normalized snapshot or application analysis.

Production reads the bundled snapshot. It does not claim to be a live feed. Download again into a separate folder for a fresh revision comparison, review the differences, rerun tests, and redeploy deliberately. A source may revise historical actuals, so refreshes may change measured errors.
