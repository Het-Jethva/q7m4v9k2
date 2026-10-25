---
name: Northline
description: A wind forecast workspace built with shadcn/ui.
colors:
  primary: "oklch(0.527 0.154 150.069)"
  actual: "oklch(0.556 0 0)"
  ink: "oklch(0.145 0 0)"
  muted: "oklch(0.556 0 0)"
  paper: "#ffffff"
  rail: "oklch(0.97 0 0)"
  line: "oklch(0.922 0 0)"
---

# Northline design system

Northline uses shadcn/ui Radix Vega components. `components.json` records the registry style and aliases. `frontend/components/ui` contains the generated source. Tailwind CSS v4 and `frontend/styles.css` supply one shared theme.

## Visual identity

Use a white workspace, graphite text, restrained borders, and DM Sans. The active preset is `bInDwe3`. It supplies a green primary theme, neutral chart palette, variable DM Sans, Tabler icons, and inverted translucent menus. Forecast curves and error magnitude use `--chart-3`. Actual generation and signed bias use `--chart-2` and dashed lines. Preserve that series mapping across legends, charts, and tooltips.

Theme colors use shadcn roles such as background, foreground, muted, muted-foreground, border, input, primary, and ring. The base radius is 0.625rem. Components derive their corner sizes from that scale. Do not introduce a second set of custom button, input, table, badge, or tab styles.

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
- Cards group filters, the methodology introduction, and each metric. All use the preset variants.

## Layout and type

The desktop header is horizontal. Tailwind layout utilities set a screen-2xl maximum workspace width, responsive padding, and a 3-to-1 analysis grid at the large breakpoint. Metrics use stock small Cards. Methodology formulas and snapshot metadata use Tables. Wide evidence tables scroll within the page. No application CSS selectors override generated components.

DM Sans is self-hosted. Page headings use text-2xl, section headings text-lg, and supporting prose text-sm. Component labels and tables retain their generated typography. Metric values use text-2xl with tabular numerals.

## Motion and accessibility

Shadcn owns control interaction states and animation. Custom metric transitions and their stylesheet are removed. Reduced motion disables smooth drill-down scrolling.

Keep visible keyboard focus, meaningful labels, native input bounds, table headers, and named chart descriptions. Actuals begin disabled. Keep the London timezone, decision-time cutoff, missing-data explanation, retrospective caveat, and source evidence visible where relevant.

## Copy

Use short labels. Add supporting copy when it explains a source assumption, a missing value, a unit, or a data limitation. Avoid marketing taglines and repeated descriptions of controls.

## Verification

The build runs `scripts/check-ui.mjs` to reject raw controls, application CSS selectors, inline styles, extra stylesheets, and DOM animation in the application. Browser checks cover forecast defaults, hindsight, unit conversion, midnight gaps, accuracy drill-down, disclosures, narrow layouts, and keyboard table scrolling.
