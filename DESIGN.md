---
name: Northline
description: A restrained wind forecast analyst workspace.
colors:
  primary: "#275ee7"
  actual: "#c17a19"
  ink: "#202631"
  muted: "#636d7b"
  paper: "#fff"
  rail: "#f4f6f9"
  line: "#dfe4eb"
  control-border: "#cdd4df"
  warning: "#a26513"
  tabs-bar: "#edf0f5"
typography:
  headline:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  title:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    letterSpacing: "-0.02em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  metric:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.035em"
rounded:
  control: "4px"
  segment: "48px"
spacing:
  compact: "8px"
  small: "12px"
  medium: "16px"
  section: "20px"
  wide: "24px"
components:
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
    typography: "{typography.label}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "7px 10px"
    height: "40px"
  metrics-rail:
    backgroundColor: "{colors.rail}"
    rounded: "{rounded.control}"
    padding: "0 20px"
  unit-segment:
    textColor: "{colors.ink}"
    rounded: "{rounded.segment}"
    padding: "4px 12px"
    height: "30px"
---

# Design System: Northline

## Overview

**Creative North Star: "The Forecast Bulletin"**

An open, precise workspace for reading national wind forecasts and checking their evidence. White plotting space, graphite text and cool gray subdivisions keep the data prominent. Sparse copy identifies the decision, units and source limits.

**Key Characteristics:**
- Open charts with adjacent measurements.
- Compact horizontal navigation and rectangular controls.
- Cobalt forecasts and amber retrospective observations.
- One sans family with tabular numerals for measurement.

## Colors

### Primary
- **Cobalt:** forecast curves, error bars, active navigation, links and focus outlines.

### Secondary
- **Observation amber:** actual curves and mean bias. The darker warning token serves signed-error text.

### Neutral
- **Paper:** page and plotting field.
- **Graphite ink:** headings, values and primary text.
- **Muted graphite:** explanatory text and supporting labels.
- **Cool rail:** filter toolbar, metric rail and table headings.
- **Line / control border:** structural dividers and control boundaries.
- **Tabs bar:** recessed unit selector track.

**The Series Identity Rule.** Keep forecast and error magnitude cobalt; keep actuals and signed bias amber. Legends and units identify the meaning of each series.

## Typography

**Display and Body Font:** DM Sans, with sans-serif fallback.

The family stays consistent across headings, controls, charts and evidence. Hierarchy comes from measured size and weight changes rather than a separate display face.

### Hierarchy
- **Headline:** page title; reduces to 24px on narrow screens.
- **Title:** section headings; compact layouts may use 15–16px.
- **Body:** general reading and application text.
- **Label:** controls and supporting labels; table text is 12px and table headings are 11px.
- **Metric:** numeric summaries; long forecast ranges use a smaller local treatment.

**The Numeric Alignment Rule.** Use tabular numerals for metric values and tables, and right-align quantitative table columns. Keep units next to the values or in the column heading.

## Layout

A horizontal header (minimum 68px) precedes a centered workspace (maximum 1600px). Desktop side padding is 36px. A compact heading and export action lead into the filter toolbar. The principal analysis grid places the open chart beside a narrow metric rail, using a 3.4:1 ratio with a 30px gutter.

At 1050px and below, padding becomes 24px and the analysis gutter 20px. At 760px and below, padding becomes 20px, navigation wraps beneath the brand, filters wrap, and analysis becomes one column. The metric rail becomes a two-column grid. Evidence tables keep their column structure and scroll horizontally. Methodology reading copy stays within 75ch.

Use the compact spacing scale for controls and table details; use wider steps between analytical sections. Do not elevate every measured offset into a new token.

## Elevation & Depth

The workspace is flat. Cool gray fields and thin dividers separate functions; chart surfaces have no card shell or structural shadow. The forecast area uses a low-opacity cobalt fill as a data mark, not a surface treatment.

**The Open Plot Rule.** Keep the plotting field on the white workspace. Use the adjacent tonal rail to collect measurements.

## Shapes

Controls and tonal containers share subtle corners. The unit selector is the deliberate rounded exception: a compact track with a sliding white selection. Tables and section dividers retain straight edges. Icons use consistent stroked SVG geometry.

## Components

### Buttons

White outlined controls use compact label type and a small corner radius. Hover uses the rail background and a darker border. Disabled controls reduce opacity. Links use cobalt without a filled button shell. Interactive elements share a cobalt focus outline (2px, offset 3px).

### Inputs / Fields

White fields have cool gray borders, compact labels and the shared control radius. Date and time controls combine the field with small icon actions. Carets and focus outlines use cobalt.

### Navigation

Horizontal text navigation uses muted default labels and cobalt active text with a bottom rule. Hover becomes cobalt. On narrow screens the navigation occupies a full row beneath the wordmark.

### Cards / Containers

Filters and metric summaries use a cool rail field without shadows. Metrics are divided by fine rules, with the label above the value and a short supporting line beneath. This replaces separate raised metric cards.

### Unit selector

A measured white pill slides within a gray track. Selection remains visible independently of animation. Motion uses the shipped easing and timing in the sidecar; reduced motion removes transitions. Numeric text can crossfade and blur during a unit change, with width adapting to the new value.

### Charts and evidence

Charts pair a compact legend with visible units, restrained horizontal guides and adjacent measurement summaries. Actuals appear as retrospective comparison. Tables use tonal headers, fine row dividers, right-aligned numbers and a subtle row hover. Source details expand in place.

## Do's and Don'ts

### Do:
- **Do** preserve cobalt and amber series identities across charts and legends.
- **Do** keep units, coverage and source limits readable beside the evidence.
- **Do** use sparse labels and the shared DM Sans hierarchy.
- **Do** preserve visible keyboard focus and reduced-motion behavior.

### Don't:
- **Don't** restore the green sidebar or Manrope display hierarchy.
- **Don't** wrap open plots in decorative rounded cards.
- **Don't** replace source gaps with visual certainty.
