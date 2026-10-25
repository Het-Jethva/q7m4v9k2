---
name: Northline
description: A wind forecast workspace built with shadcn/ui.
colors:
  primary: "#275ee7"
  actual: "#a26513"
  ink: "#202631"
  muted: "#626e7e"
  paper: "#ffffff"
  rail: "#f4f6f9"
  line: "#dfe4eb"
---

# Northline design system

Northline uses shadcn/ui Radix Nova components. `components.json` records the registry style and aliases. `frontend/components/ui` contains the generated source. Tailwind CSS v4 and `frontend/styles.css` supply one shared theme.

## Visual identity

Use a white workspace, graphite text, restrained borders, and DM Sans. Forecast curves and error magnitude use `--chart-1`, the cobalt primary color. Actual generation and signed bias use `--chart-2`, the amber observation color. Preserve that series mapping across legends, charts, tooltips, and error text.

Theme colors use shadcn roles such as background, foreground, muted, muted-foreground, border, input, primary, and ring. The base radius is 0.5rem. Components derive their corner sizes from that scale. Do not introduce a second set of custom button, input, table, badge, or tab styles.

## Components

- Navigation uses controlled Tabs with line-variant TabsList and labelled TabsContent.
- Actions use Button variants. Downloads compose Button with anchors so native download behavior remains.
- Filters use FieldGroup, Field, FieldLabel, Input, and InputGroup. Date and time fields retain their native pickers and validation.
- Hindsight uses Checkbox with a linked label. Its Badge identifies retrospective observations.
- Power units use a single-selection ToggleGroup. Deselection cannot clear the selected unit.
- Plots use ChartContainer and ChartTooltipContent. Missing values remain gaps.
- Tables use the full Table composition. Quantities align right. The horizontal scrolling container owns its focus stop and accessible label.
- Evidence and source hashes use Collapsible with Button triggers.
- Provenance notices use Alert. Loading uses Skeleton. Request failures use Empty with a retry action.
- Cards group filters and the methodology introduction. Metrics form one rail rather than separate cards.

## Layout and type

The desktop header is horizontal. The workspace has a maximum width of 1600px and 42px side padding. A 3.4-to-1 analysis grid places the chart before a narrow metric rail. At 1100px the grid and padding tighten. At 760px the analysis stacks vertically and the metric rail uses two columns. Wide evidence tables scroll within the page.

DM Sans is self-hosted. Desktop page headings are 27px and phone headings are 24px. Section headings are 17px. Body text is 14px. Compact evidence and supporting labels use smaller type. Metrics use tabular numerals at 25px. Long forecast ranges use 21px, reducing further on phones.

## Motion and accessibility

Shadcn owns control interaction states. The previous custom sliding unit selector is removed. Metric text keeps its short soft transition. Reduced motion disables that transition and smooth drill-down scrolling.

Keep visible keyboard focus, meaningful labels, native input bounds, table headers, and named chart descriptions. Actuals begin disabled. Keep the London timezone, decision-time cutoff, missing-data explanation, retrospective caveat, and source evidence visible where relevant.

## Copy

Use short labels. Add supporting copy when it explains a source assumption, a missing value, a unit, or a data limitation. Avoid marketing taglines and repeated descriptions of controls.

## Verification

The build runs `scripts/check-ui.mjs` to reject raw controls in the application. Browser checks cover forecast defaults, hindsight, unit conversion, midnight gaps, accuracy drill-down, disclosures, narrow layouts, and keyboard table scrolling.
