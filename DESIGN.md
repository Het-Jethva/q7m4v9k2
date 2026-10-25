---
name: Northline
description: A restrained workspace for historical national wind forecast decisions.
colors:
  primary: "#2d7658"
  evergreen: "#193d30"
  actual: "#c47736"
  neutral-bg: "#f8f9f5"
  paper: "#fff"
  ink: "#253e32"
  muted: "#637269"
  border: "#e1e6de"
  note: "#edf2e7"
  focus: "#b27436"
  available: "#456e3b"
  missing: "#8a5729"
typography:
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "33px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontWeight: 400
  metric:
    fontFamily: "Manrope, sans-serif"
    fontSize: "27px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.035em"
rounded:
  input: "5px"
  button: "6px"
  note: "7px"
  chart: "10px"
spacing:
  compact: "8px"
  medium: "16px"
  chart-inset: "24px"
components:
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "9px 13px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "8px"
    height: "34px"
  chart-container:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.chart}"
    padding: "23px 24px 15px"
  navigation-active:
    backgroundColor: "#315241"
    textColor: "#f2f5df"
    rounded: "{rounded.button}"
    padding: "13px 13px"
  vintage-chip:
    textColor: "#5b7752"
    rounded: "4px"
    padding: "5px 7px"
---

# Design System: Northline

## Overview

Northline is a compact analyst workspace. Evergreen navigation frames a warm off-white work area. Charts and aligned numeric tables carry the evidence, with source context beside the values.

The existing identity comes from the Ordnance Survey direction in [Interface direction](docs/DESIGN_DIRECTION.md). Its concept-seed reference is `seed:0c8db3b6dd8a642a`. This document records the implementation in `frontend/styles.css` and `frontend/main.tsx`.

## Colors

The primary green identifies forecasts. Orange identifies retrospective actuals. Evergreen belongs to the shell. Paper, warm off-white, ink, muted text, and borders establish the reading hierarchy.

The available and missing status colors are darker text treatments. Status labels accompany their dots, so color is not the only signal. The note color separates source and vintage explanations from chart data.

## Typography

Manrope carries headings, identity, and metric values. DM Sans carries controls, tables, and explanatory copy. Both use a sans-serif fallback. Tables and metric values use tabular numerals.

The headline reduces to 28px on mobile. Section titles use the title token. Most desktop control and table text is compact, between 10px and 13px. Units are smaller than their metric values and remain explicit.

## Layout

The desktop shell has a fixed 218px sidebar and a 70px top bar. Main content has a maximum width of 1600px and horizontal padding of 42px. At 1150px the sidebar narrows to 185px. At 900px it narrows to 170px and the metric row becomes two columns.

At 650px and below, the sidebar becomes a header with horizontal navigation. The workspace loses its left offset. Main content uses 20px horizontal padding. Filters wrap, chart controls stack, and tables scroll within their own containers. At 1450px and above, the content inset grows to 55px and the forecast chart grows taller.

## Elevation & Depth

Borders, pale fills, and rules separate most content. Shadows are limited to switch thumbs, selected unit buttons, and chart tooltips. There is no elevated card grid. Hover transitions last 0.18 seconds. Switch transitions last 0.2 seconds. Reduced motion disables animations and transitions.

## Shapes

Controls have small rounded corners. Notes and tables use slightly broader corners. Chart containers use the broadest regular radius. The switch is a pill. Status dots are circles. Desktop navigation uses rounded rectangles, while mobile navigation uses an underline for the active page.

## Components

Secondary buttons have a white fill, a thin border, and a pale green hover fill. Keyboard focus uses a two-pixel focus outline with a four-pixel offset. Disabled buttons reduce opacity and change the cursor.

Date controls have previous and next buttons. The cutoff uses a required native time input with a London time label. The default is 09:00. The methodology states the supported daily range as 00:00 to 23:59. Keep this label beside the control.

The comparison switch starts off. Its label identifies actuals as retrospective. Forecasts use a green line with a light area fill. Actuals use an orange line when comparison is enabled. Both lines preserve gaps for null observations and disable chart animation. Chart descriptions direct readers to exact values in the interval table.

The GW and MW unit buttons expose their selected state and have a minimum width of 44px and height of 40px. Mobile date navigation buttons measure 40px square. Native date and time inputs retain their compact 27px height. The mobile export button has a 32px minimum height. These are implementation measurements, not a claim that every control meets a 44px target.

The interval table aligns numeric columns to the right. Missing observations remain explicit. Vintage notes use a pale fill, a source explanation, and a compact chip.

## Do's and Don'ts

- Do keep forecast green and actual orange consistent across charts and legends.
- Do show units and London time beside the values or controls they qualify.
- Do retain keyboard focus, selected control states, null gaps, and textual status labels.
- Do keep source explanations beside the evidence they describe.
- Don't connect missing observations or substitute a zero for a gap.
- Don't enable retrospective actuals by default.
- Don't add decorative map illustrations or a decorative grid to express the identity.
