# Delivery plan

- [x] Read the Principles section of the poteto-mode skill.
- [x] Phase A: Frame.
- [x] Phase B: Design the workflow.
- [x] Phase C: Run the loop.
- [x] Phase D: Keep the audit trail.
- [x] Phase E: Verify and hand back. Native private-window check remains a documented manual handoff after browser automation stopped.

## Definition of done

The React app runs against a Python API with real Elexon January 2026 decision data. Each selected forecast has a publish time no later than its decision cutoff. The UI exposes coverage, forecast provenance, matched error metrics, and CSV exports. Automated tests verify selection, missing data, metrics, and API behavior. Browser checks verify unit conversion and desktop and mobile views. Docker configuration and Vercel deployment are provided. The repository includes setup, methodology, sources, an AI disclosure, and a demo script under ten minutes. External publication is reported only after its URL is verified.

## Units and rigor

Five units, scoped to the assignment's 16-hour cap. Data retrieval and temporal semantics come first. Analysis receives deterministic behavioral tests. UI receives browser interaction checks. Deployment receives an anonymous-access check. No video is recorded and no submission form is sent.

## Architecture steps

- [x] Ground. Greenfield, no incumbent application.
- [x] Sketch. Compare two distinct domain and storage designs.
- [x] Agree. Synthesize the designs against correctness, reproducibility, and small deployment size.
- [x] Implement. Build against the selected API contract.
- [x] Scrap. skip: Implementation did not disprove the selected design.

## Arena steps

- [x] Frame.
- [x] Fan out.
- [x] Cross-judge.
- [x] Pick.
- [x] Graft.
- [x] Verify.

## Execution units

1. Retrieve real FUELHH and WINDFOR data and establish interval alignment.
2. Build and test the Python analysis API with a reproducible local snapshot.
3. Build the React dashboard with working date, cutoff, comparison, accuracy, export, and methodology flows.
4. Integrate Docker, production deployment, documentation, and the customer and technical demo script.
5. Run tests, inspect real UI interactions at desktop and mobile sizes, independently review the artifact, and verify public URLs.

## Throughput checkpoint

The bottleneck is source data correctness, particularly hourly forecasts versus half-hourly actuals and forecast issue times. Resolve and test those before UI implementation. Partition frontend and backend only after a shared API contract exists. Reassess after the first complete day is served and after the first browser walkthrough. Add no unrelated feeds or trading execution.
