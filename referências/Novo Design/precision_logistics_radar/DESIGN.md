---
name: Precision Logistics Radar
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#8d4b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#b15f00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2.5rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
---

## Brand & Style

This design system establishes a high-performance, real-time logistics intelligence experience. The aesthetic synthesizes utilitarian developer tools with high-end enterprise SaaS: clinical, immediate, and ultra-readable under time-critical operational pressures.

Targeting candidates, dispatch operators, and automation-driven job monitors tracking Amazon Warehouse openings, the interface avoids decorative friction in favor of crisp information density. The emotional tone projects calm authority, instantaneous reactivity, and mechanical reliability. Visual motifs borrow from high-frequency trading dashboards and telemetry consoles, refined through modern European minimalist software aesthetics.

## Colors

The palette is engineered for prolonged visual scanning and instant status recognition in a high-refresh light environment:

- **Canvas & Structural Layers**: Base application canvas defaults to `#f8fafc` (slate-50). Elevated card structures and interactive surfaces sit on crisp pure white `#ffffff`. Subordinate nesting modules use `#f1f5f9` (surface-container-low), while structural separators and dividers use `#e2e8f0` with active highlights moving through `#cbd5e1`.
- **Text & Contrast Hierarchy**: Primary content and actionable headers leverage `#0f172a` (slate-900) for uncompromised contrast ratios exceeding WCAG AAA standards. Metadata, telemetry timestamps, and secondary captions resolve to `#64748b` (slate-500).
- **Signal Accents**: Primary action triggers and live inventory indicators use precision emerald (`#059669` interact, `#10b981` beacon/badge). Network latency, telemetry graphs, and secondary data channels route through electric cyan (`#0284c7` / `#0ea5e9`). Operational warnings leverage balanced amber (`#d97706`), while dropouts and errors trigger soft crimson (`#dc2626`).

## Typography

Plus Jakarta Sans delivers geometric precision balanced by gentle humanist curves, preserving legibility across dense shift schedules and fulfillment center designations. 

Numeric tabular values, latency clocks, and warehouse station codes (e.g., `OAK4`, `JFK8`) transition into tabular numerals or JetBrains Mono via the `mono-data` token to eliminate visual jitter during real-time updates. Letter tracking is kept deliberately tight on headlines to convey structural solidity.

## Layout & Spacing

The architecture operates on an 8-point base grid (with a 4-point micro-scale for compact data rows and indicator chips). 

- **Grid Model**: A 12-column responsive fluid grid governs desktop environments (max-width `1440px`), compressing into 8 columns on tablet viewports and 4 columns on mobile handsets.
- **Breakpoints**: Mobile under `640px` (utilizing `margin: 1rem`), Tablet between `641px` and `1024px` (`margin-md: 1.5rem`), and Desktop beyond `1024px` (`margin-lg: 2.5rem`).
- **Data Densities**: Monitoring feeds require rapid content scanning. Internal row card padding strictly uses `space-md` vertically and `space-lg` horizontally to avoid loose, bloated interfaces while preserving tap/click targets.

## Elevation & Depth

This design system avoids theatrical drop shadows, adopting an approach combining low-contrast micro-outlines and soft ambient diffusion:

- **Flat/Base (`level-0`)**: Canvas backgrounds and segmented sub-panels. No shadow; framed strictly by `#e2e8f0` borders (1px).
- **Surface Elevation (`level-1`)**: Warehouse opening cards, analytical metric containers, and filter modules. Border `1px solid #e2e8f0`, accompanied by an ambient resting shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
- **Raised/Hover (`level-2`)**: Interactive cards under cursor focus or active selection. Shifts border to `#cbd5e1` with amplified ambient elevation: `0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Flyouts & Overlays (`level-3`)**: Filter dropdowns, modal alerts, and real-time popovers. `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`, bounded by a sharp `1px solid #cbd5e1` contour.

## Shapes

A modern geometry defined by level 2 roundedness conveys precision without the severity of square interfaces. 

Interactive controls, inputs, and regular containers adhere to `rounded-lg` (0.75rem / 12px) to frame content reliably. Micro elements such as badges, status dots, and pill tags implement fully rounded forms (`rounded-full`) for quick categorical scanning. Large dashboard surface cards utilize `rounded-xl` (1rem / 16px).

## Components

### Buttons
- **Primary Action**: Solid `#059669` fill with white text, font weight 600. Hover state darkens to `#047857` with a 1px matching ring. Active state depresses subtly without scale degradation.
- **Secondary / Tech**: Transparent surface with `#0f172a` text, 1px border `#e2e8f0`. Hover activates `#f1f5f9` background and `#cbd5e1` border.
- **Critical Catch / Urgent**: For instantaneous warehouse slot claiming, provide a beacon variant using `#10b981` with an oscillating soft emerald aura (`rgba(16, 185, 129, 0.2)`).

### Chips & Status Badges
- **Live / Active Shift**: Pill shape (`rounded-full`), background `#ecfdf5` (emerald-50), border `1px solid #a7f3d0`, text `#065f46`. Accompanied by a pulsing 6px `#10b981` radial indicator.
- **Telemetry / Network**: Background `#f0f9ff` (cyan-50), border `1px solid #bae6fd`, text `#0369a1`.
- **Shift Type**: Neutral chip `#f1f5f9`, border `#e2e8f0`, text `#475569`.

### Input Fields & Selectors
- Background `#ffffff`, border `1px solid #e2e8f0`, border-radius 8px (`rounded-md`).
- Focus state brings an immediate `1px solid #0284c7` border combined with a 3px ring of `#0ea5e9` at 15% opacity.
- Placeholder copy rendered in `#94a3b8`.

### Job Card (Core Domain Component)
- Background `#ffffff`, border `1px solid #e2e8f0`, border-radius 12px (`rounded-xl`).
- Internal layout includes a top metadata strip (facility code, distance, real-time availability pulse), a prominent middle tier for pay rate and shift times (using bold tabular figures), and a bottom-aligned operational trigger button.
- Unviewed or newly populated openings display a 3px left border accent in `#10b981`.

### Data Feeds & Real-time Lists
- Row heights standardized at 52px for standard rows, 40px for compact views.
- Alternating row interaction relies on mouse hover transition to `#f8fafc`. Row borders resolve to a hairline 1px `#f1f5f9`.