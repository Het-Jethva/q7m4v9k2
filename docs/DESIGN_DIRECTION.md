# Interface direction

## Decision

The user delegated product naming and visual choices. The product is called Northline. Build directly in code, as an analyst app rather than a marketing page.

Seven reference systems were considered. Met Office analytical graphics offer clear axes and compact legends. National Grid reports offer disciplined numeric hierarchy. Railway timetables offer aligned dates and interval tables. Ordnance Survey mapping offers warm paper, deep evergreen ink, measured spacing, and purposeful amber marks. Energy market reports offer restrained editorial summaries. Scientific field notebooks offer provenance next to observations. Financial broadsheets offer contrast between concise prose and dense numeric tables.

The selected fourth direction uses the Ordnance Survey palette and typographic restraint. It contributes a warm off-white workspace, evergreen navigation, forest-green forecast line, orange observed line, and a single signature interaction. A day selector changes the chart, source vintage, totals, and interval table together. Navigation, tabs, inputs, and chart controls remain conventional web controls. No map illustration or decorative grid is needed.

The concept-seed reference is seed:0c8db3b6dd8a642a. The user delegated selection. Typography-specimen concepts lose on readable information density. Dense catalog concepts lose on chart prominence. Zoo-map concepts lose on analytical clarity. The useful discipline from these alternatives is consistent alignment, meaningful density, and a limited palette.

## First viewport

A narrow evergreen sidebar holds the product identity, Forecast desk, Accuracy lab, and Methodology. A slim top bar shows the January 2026 archive and source status. The forecast workspace leads with a delivery-day heading, date and cutoff controls, a ruled row of decision metrics, and a large forecast chart. A nearby decision note explains the selected vintage and excludes retrospective actuals by default. A lower interval table supports audit and CSV download.

## Responsive behavior

At narrow widths the sidebar becomes a compact header and horizontal navigation. Filters wrap, chart labels reduce, and the interval table scrolls within its own container. All controls remain keyboard-accessible. Reduced motion disables transitions. Loading, missing data, and errors remain explicit.

## Risk

The restricted dataset cannot quantify a customer's net procurement requirement or a calibrated future uncertainty band. Show historical error as retrospective evidence and do not imply that a national forecast is a portfolio recommendation.
