# UI audit fixes

Verified locally on October 25, 2026 against the Python server serving the production Vite build at `http://127.0.0.1:8000`. All agents used GPT-6.1 Sol. This record concerns local changes and does not claim a deployment or accessibility certification.

## Findings and results

| Finding | Reproduced before the fix | Verified after the fix |
| --- | --- | --- |
| Invisible tab-panel keyboard focus | Panel outline and shadow were both none. | The keyboard-focused panel has a solid 2 px input-colored outline and 3 px focus ring. Radix tab navigation remains in place. |
| Faint control boundaries | Unchecked checkbox and input used `oklch(0.922 0 0)` on white. | Both compute `oklch(0.65 0 0)`. Calculated contrast against white is about 3.23:1. Decorative `--border` remains unchanged. This is a token calculation, not pixel sampling. |
| Hindsight toggle loses focus and error escape | Space remounted the checkbox and left BODY focused. A blocked hindsight request removed the checkbox. | The same checkbox stays focused through loading, success, and error. Turning actuals off after the blocked request restores the forecast and interval table. Unit controls remain available. |
| Daily drill-down loses focus | Enter on 15 Jan left BODY focused after Forecast opened. | Enter focuses the Wind forecast H1 and enables hindsight. Scrolling still respects reduced motion. |
| Metadata cannot recover independently | Metadata-only failure left working replay, no Retry, a misleading source failure label, and a pending footer. | Header and footer name metadata specifically. Methodology exposes Retry metadata. Recovery requests only `/api/meta` and restores the source tables. Loading has its own status. |
| Small mobile controls and stale documentation | At 390 CSS px, arrows were 24 by 24 and units about 42 by 32. | Arrows measure 40 by 40 and units 44 by 40. The shared shadcn size variants own these dimensions. A 24 px target was not treated as an automatic WCAG AA failure. |
| Eager chart bundle and Accuracy request | Initial Forecast load requested the single chart-inclusive entry and monthly Accuracy. | Initial load requests metadata, replay, the Forecast chart module, and shared chart code. Accuracy's API request and chart module wait until its tab opens. Returning to an unchanged selection sends no API request. A cutoff change on Forecast waits to refresh Accuracy until entry. |
| Reduced-motion loading still pulses | All three held-request skeletons computed pulse under reduced motion. | All three compute animation none with 0 s duration. The labelled loading status and active checkbox remain present. |

Chart splitting introduced a separate failure case that was reproduced and fixed during this work. Blocking the Forecast chart module originally blanked the root. A chart-local error boundary now preserves the heading, filters, summaries, and interval table. Its alert offers Reload page, which recovers after the block is removed.

## Packaging observations

The original production entry was 835.37 kB minified and 244.44 kB gzip. The latest build has a 428.29 kB entry, 129.7 kB gzip, plus asynchronous shared chart code of 372.39 kB, 108.01 kB gzip. Forecast-specific code is 15.12 kB, 5.45 kB gzip. Accuracy-specific code is 25.37 kB, 8.28 kB gzip.

These are build artifact sizes and observed request boundaries. Forecast still needs shared chart code. Splitting does not reduce all JavaScript bytes or prove a faster complete page load. No cold-load timing target, latency benchmark, or speedup claim is made.

## Regression checks

- `npm run build` passes the UI guard, TypeScript, and Vite build.
- The UI guard covers the top-level application TSX files, including the extracted charts. A temporary new TSX file containing a raw button was rejected, then removed before the passing build.
- All 49 Python tests pass. The independent verifier checks 124 replays and 2,976 target hours against 64 retained responses, with the snapshot hash unchanged.
- The default forecast remains January 15 for January 16 delivery, 09:00 London, actuals off, average 7.93 GW, and coverage 24/24.
- Midnight still gives 22/24 on the default decision and 682/744 monthly pairs. The two missing forecast intervals remain gaps.
- Accuracy at 09:00 has 31 bars and 744/744 matched hours. MW display shows MAE 2,039. Export URLs retain the shared cutoff and hindsight selection.
- Holding a 12:00 Accuracy request keeps unit controls present. Returning to the cached 09:00 selection restores 744/744 pairs and 31 bars without waiting for the held request.
- January 31 delivers February 1 and disables Next. January 1 disables Previous.
- The named forecast table scroller responds to ArrowRight, with scrollLeft moving from 0 to 40 at 390 px.
- Forecast, Accuracy, and Methodology have no document overflow at 320, 390, 768, 1024, and 1440 CSS px.

## Evidence and limits

The original report, screenshots, machine-readable post-fix observations, data verification, and decision trail remain in `.audit/ui-2026-10-25`. Desktop and mobile post-fix captures are `fixed-desktop.png` and `fixed-mobile.png`.

Testing used Chromium in the Codex in-app browser and temporary request blocking, interception, reduced-motion emulation, and viewport overrides. These settings were cleared afterward. There was no physical phone, synthetic touch, screen reader, forced-colors, Firefox, Safari, or real browser zoom test. Narrow viewport reflow is not a 400% browser-zoom test. Dark mode is not exposed by the application and was not tested.

Model the Domain kept controls outside the request-result state and preserved separate metadata states. Type System Discipline kept parsed API types and URL/revision checks. Prove It Works required browser reproductions, fault injection, actual measurements, and independent data comparisons.
