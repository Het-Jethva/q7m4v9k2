# Verification record

Verified on October 25, 2026. The normalized snapshot hash is de6db29066f1431918bfa10a74d18ea42bc656036f875ab6b863768ac79ffa40.

## Automated checks

| Check | Result |
| --- | --- |
| Python behavioral and API suite | 49 tests passed. |
| TypeScript and React production build | Passed with npm run build. |
| Original source response hashes | 64 verified. |
| Forecast records compared with retained raw responses | 17,864 verified. |
| Actual records compared with retained raw WIND responses | 1,488 verified. |
| Independent local API replay comparisons | 124 replays, 2,976 target hours verified. |
| Independent Docker API replay comparisons | 124 replays, 2,976 target hours verified. |
| Independent production API replay comparisons | 124 replays, 2,976 target hours verified. |
| Cached source rebuild | Exact manifest and snapshot identity preserved. |
| Source refresh spot-check | WINDFOR January 15 and FUELHH January 16 matched fresh Elexon responses. |

The full independent API comparison covers all 31 January purchase dates at 00:00, 09:00, 12:00, and 23:59. It recomputes expected forecasts and actual means from raw responses without importing backend analysis. There are 62 unavailable forecast target hours across the midnight decisions and no incomplete actual pairs in the bundled source sample.

[Local report](data-verification.json) and [production report](production-verification.json) retain the machine-readable results. The final report overwrites prior report results, so the separately executed live spot-check is recorded here rather than implied by the final JSON's empty live-source list.

## Browser checks

The app was driven in the Codex in-app browser against the running Python production server. The initial viewport, 1440-pixel desktop viewport, and 390-pixel mobile viewport were inspected. Native scrollbars account for a small difference between CSS viewport size and screenshot width.

- Initial forecast has actual comparison off and displays January 15 purchase for January 16 delivery.
- Hindsight comparison reveals actuals, paired metrics, and actual half-hour evidence.
- Entering 00:00 changes forecast coverage to 22 of 24 hours, shows the late-hour gaps, and updates CSV query parameters.
- Entering 09:00 restores full coverage. MW and GW controls convert displayed values.
- January 31 correctly targets February 1 and disables the next-day navigation button.
- Accuracy lab displays 744 matched hours, pooled MAE, RMSE, bias, and WAPE at 09:00.
- Selecting January 15 from the daily table opens its forecast replay with comparison enabled.
- Browser CSV download contains 744 interval rows and includes publication times, actual half-hour evidence, and snapshot identity.
- Methodology displays temporal assumptions, equations, source manifests, source hashes, and the exact snapshot identity.
- A separate server with an actually missing snapshot displays an error and a working Retry loading control. It never substitutes generated data.
- The mobile page has no horizontal document overflow. Interval tables scroll inside their own containers.

The time-field synchronization issue found during browser testing was fixed by handling valid input events as well as change events. The final selected date and cutoff remain consistent with the displayed replay and export URL.

## Independent review

Separate GPT-6.1 Sol reviewers inspected analytical correctness and the rendered interface. The correctness reviewer independently recomputed the default monthly metrics from raw data. It found a cached-download timestamp bug, now fixed with a regression that changes a raw file's modification time to the year 2000. Retrieval metadata remains the original source timestamp.

The earlier interface review requested larger mobile controls and a corrected accuracy capture. A later shadcn migration regressed the control sizes. The UI audit and fixes below supersede that review's size and styling claims.

The mechanical interface detector reported no findings. Screenshots and the local decision trail are working artifacts under .impeccable/review and .audit.

## Known tool warnings

The Python suite emits an upstream FastAPI TestClient warning about Starlette's httpx adapter. Tests pass. The latest split build has no chunk above Vite's default 500 kB advisory threshold. No performance benchmark or speedup claim is made.

## UI audit fixes

The October 25 UI audit identified eight findings. All eight have local fixes and browser verification. [Post-fix evidence](UI_AUDIT_FIXES.md) records reproduction, recovery checks, bundle observations, and testing limits. The original report remains under `.audit/ui-2026-10-25/report.md` as a local working artifact.

## Scope of evidence

These checks verify this historical snapshot and application implementation. They do not validate an exchange-specific deadline, predict future error, measure customer procurement cost, or establish the semantics of a source forecast as a guaranteed hourly interval mean. The methodology states those limits.

## Public access

Unauthenticated HTTP requests returned 200 for the production root, health, metadata, replay, accuracy, and CSV endpoints. All 124 production replays matched the retained source evidence. Native Chrome private-window automation was blocked because computer use could not verify the current browser URL. The assignment's literal incognito-window access check remains a manual handoff item for both the app and repository links. Anonymous HTTP verification is not described as an incognito check.
