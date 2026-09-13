---
name: JobWatch
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353943'
  surface-container-lowest: '#0a0e17'
  surface-container-low: '#181b25'
  surface-container: '#1c1f29'
  surface-container-high: '#262a34'
  surface-container-highest: '#31353f'
  on-surface: '#dfe2ef'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dfe2ef'
  inverse-on-surface: '#2c303a'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#e29100'
  on-tertiary-container: '#523200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0f131c'
  on-background: '#dfe2ef'
  surface-variant: '#31353f'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 3.5rem
    fontWeight: '700'
    lineHeight: 4rem
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.625rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: -0.01em
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '400'
    lineHeight: 1rem
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.6875rem
    fontWeight: '700'
    lineHeight: 1rem
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The brand persona is defined by operational vigilance, speed, and surgical precision. Built for candidates and aggregators who cannot afford millisecond delays, the interface evokes the quiet authority of high-frequency trading terminals filtered through high-end consumer hardware aesthetics.

The design movement merges **Modern Technical Minimalism** with **Tonal Glass Layers**. It rejects garish dashboard clutter in favor of high visual breathing room, crisp structural borders, and purposeful luminance. Information hierarchy is instant: scanning is effortless, high-priority status indicators cut sharply through deep dark slate backdrops, and interactive states offer subtle, mechanical spring.

## Colors

The palette is engineered specifically for protracted low-light monitoring environments, minimizing retinal fatigue while maximizing signal clarity.

### Background & Neutral Structure
- **Canvas Base (`#090D16`)**: Deep pitch slate foundation; absorbs ambient luminance.
- **Surface Elevation 1 (`#0F172A`)**: Primary card, panel, and container background.
- **Surface Elevation 2 (`#1E293B`)**: Hover states, nested rows, modal surfaces, and active wells.
- **Border / Structural (`#334155` at 40%–60% opacity)**: Whisper-thin structural framing (`border-slate-800`).
- **Text Primary (`#F8FAFC`)**: High-contrast, optical white for critical headlines and active values.
- **Text Secondary (`#94A3B8`)**: Mid-tone slate for supporting labels, meta-values, and column headers.
- **Text Muted (`#475569`)**: De-emphasized timestamps, inactive IDs, and disabled states.

### Chromatic Signals & Status Tokens
- **Emerald Pulse (`#10B981`)**: Primary engine active, online status, successfully acquired shifts, automated worker healthy.
- **Electric Cyan (`#06B6D4`)**: Brand accent, instant "New Job Match" badges, high-velocity triggers, secondary action buttons.
- **Amber Caution (`#F59E0B`)**: Throttle limits, proxy rotation, worker paused, session renewal warnings.
- **Rose Alert (`#F43F5E`)**: Worker failure, bot blocked/captcha encountered, rejected application.

## Typography

The type ecosystem balances contemporary architectural clarity with technical speed:

- **Headlines (`Plus Jakarta Sans`)**: Geometrically grounded with tight letter-spacing to impart momentum and premium finish.
- **Body & Controls (`Inter`)**: Neutral and highly legible at micro scale, maintaining vertical rhythm throughout complex configurations and data tables.
- **Technical Telemetry (`JetBrains Mono`)**: Strict tabular lining numerals for millisecond response times, shift wage figures, warehouse node IDs (e.g., `GYR1`, `BFI4`), and API polling intervals.

## Layout & Spacing

The layout is anchored by a structured 12-column responsive fluid grid operating with controlled maximum widths (1440px max content canvas) to avoid excessive eye scanning on ultrawide monitors.

- **Desktop (1280px+)**: 12 columns, 24px gutters, 32px margins. Side navigation remains persistent at a fixed 260px rail; primary work surfaces scale fluidly.
- **Tablet (768px – 1279px)**: 8 columns, 16px gutters, 24px margins. Navigation collapses to an icon dock or dynamic overlay.
- **Mobile (< 768px)**: 4 columns, 12px gutters, 16px margins. Metric ribbons reflow horizontally into snap-scroll containers; table views collapse into individual status cards.
- **Spacing Rhythm**: All paddings and layout gaps abide strictly by an 8-point base rhythm, with 4px intervals allocated solely for micro-component internals (badges, input paddings, tab switchers).

## Elevation & Depth

This system shuns heavy drop shadows in favor of **Tonal Layering** and **Subtle Edge Occlusion**:

1. **Surface 0 (Base Canvas)**: `#090D16` pure matte canvas.
2. **Surface 1 (Panels & Feed)**: `#0F172A` with a 1px border colored `rgba(51, 65, 85, 0.4)`. No box-shadow.
3. **Surface 2 (Flyouts & Dropdowns)**: `#1E293B` backed by a 12px backdrop-filter blur (`backdrop-filter: blur(12px)`), framed with `rgba(148, 163, 184, 0.15)`. Shadow: `0 8px 32px -4px rgba(0, 0, 0, 0.5)`.
4. **Active Focus / Glowing State**: Subtle chromatic bloom. Key elements trigger an ambient aura using their respective status token: `0 0 20px -5px rgba(16, 185, 129, 0.25)` for live monitors and `0 0 20px -5px rgba(6, 182, 212, 0.25)` for selected jobs.

## Shapes

The design system maintains a **Soft** shape geometry (`roundedness: 1`). 

- Standard inputs, buttons, and status chips apply `0.25rem` to `0.375rem` corners to retain a crisp, industrial silhouette.
- Job cards, telemetry modules, and notification trays use `0.5rem` (`rounded-lg`).
- Modals and persistent sheet containers use `0.75rem` (`rounded-xl`).
- Fully rounded pills are strictly reserved for tiny live status indicator badges and avatar placeholders.

## Components

### Buttons
- **Primary Action (Scan / Apply / Activate)**: Electric Emerald (`#10B981`) solid fill with rich dark slate text (`#090D16`), weight 600. Hover state: `#059669` accompanied by a gentle outward emerald glow.
- **Secondary Action (Filters / Sort / Export)**: Elevated Slate (`#1E293B`) with a 1px border (`#334155`), text in `#F8FAFC`. Hover state: border transitions to `#64748B`.
- **Destructive Action**: Transparent fill with 1px border (`#F43F5E` at 30% opacity) and `#F43F5E` text.

### Telemetry Badges & Chips
- Designed as low-luminance pills.
- **Active / Monitoring**: Emerald tinted background (`rgba(16, 185, 129, 0.1)`), Emerald border (`rgba(16, 185, 129, 0.25)`), Emerald text, fronted by an animated pulsing 6px radial dot.
- **New Match**: Cyan background (`rgba(6, 182, 212, 0.1)`), Cyan border (`rgba(6, 182, 212, 0.3)`), Cyan text, JetBrains Mono font.
- **Warning / Paused**: Amber background (`rgba(245, 158, 11, 0.1)`), Amber border and text.

### Cards (Job Postings & Node Monitors)
- Background: `#0F172A`.
- Inactive state: 1px border `#1E293B`.
- Hover/Selection state: 1px border `#334155`, subtle upward lift (1px translate), and secondary text brightness increment.
- Structural layout: Grid dividing Warehouse Code (bold mono), Shift Window, Hourly Pay (high-contrast white), and Instant Dispatch status.

### Form Inputs & Filters
- Background `#090D16` inset against `#0F172A` cards.
- Border: 1px `#334155`.
- Focus: Border shifts to `#06B6D4` with zero ring offsets; crisp, tight boundary. Placeholder text in `#475569`.

### Specialized Feature: Live Heartbeat Streamer
- Real-time polling ticker displaying warehouse fetch logs.
- JetBrains Mono compact list, alternating zebra transparency (`rgba(30, 41, 59, 0.3)`), dynamic micro-pills documenting server latency (e.g., `42ms` in muted Emerald).