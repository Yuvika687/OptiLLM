---
name: OptiLLM Design System
colors:
  surface: '#0d141d'
  surface-dim: '#0d141d'
  surface-bright: '#333a44'
  surface-container-lowest: '#080f17'
  surface-container-low: '#151c25'
  surface-container: '#192029'
  surface-container-high: '#232a34'
  surface-container-highest: '#2e353f'
  on-surface: '#dce3f0'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dce3f0'
  inverse-on-surface: '#2a313b'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0d141d'
  on-background: '#dce3f0'
  surface-variant: '#2e353f'
typography:
  display-lg:
    fontFamily: Geist Sans
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist Sans
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Geist Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Geist Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-md:
    fontFamily: Geist Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  container-max: 1440px
  gutter: 20px
---

## Brand & Style
The design system is engineered for high-performance AI infrastructure management. It balances the precision of developer tools with the sophisticated polish of modern fintech platforms. The aesthetic is a hybrid of **Minimalism** and **Glassmorphism**, specifically drawing inspiration from the "Linear meets Stripe" school of design—characterized by high density, crisp borders, and subtle depth through luminosity rather than traditional shadows.

**Target Audience:** DevOps engineers, CTOs, and AI researchers who require clarity in complex data environments.
**Emotional Response:** Efficiency, reliability, cutting-edge technical capability, and absolute control over infrastructure costs.

## Colors
The palette is rooted in a "Deep Charcoal" environment to reduce eye strain during prolonged technical monitoring. 

- **Primary (Electric Blue):** Used for critical actions, active states, and primary data paths.
- **Success (Emerald Green):** Specifically designated for "Savings" metrics and healthy system status.
- **Warning (Amber):** Used for rate-limit alerts and cost threshold warnings.
- **Neutral:** A scaled grey system providing high-contrast readability against the dark surfaces.

Backgrounds utilize a tiered approach: `#0B0F19` for the base layer and `#111827` for interactive surfaces and cards. Borders use `#1F2937` for structural separation and `#374151` for interactive hover states.

## Typography
This design system employs **Geist Sans** for its exceptional legibility in technical interfaces and its geometric, developer-centric aesthetic. 

- **Hierarchy:** Use `display-lg` sparingly for marketing or landing hero sections. `headline-md` is the standard for dashboard module titles.
- **Metadata:** Use `label-caps` for table headers, small section dividers, and overlines.
- **Technical Content:** For API keys, logs, and JSON payloads, use the monospaced variant of the font at `mono-md`.
- **Optimization:** Text rendering should favor `antialiased` performance. For mobile, scale `headline-lg` down to 24px to maintain readability.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. The sidebar remains at a fixed width (240px expanded, 64px collapsed), while the main content area utilizes a 12-column fluid grid.

- **Grid:** 12 columns with 20px gutters. 
- **Margins:** 32px horizontal margins on desktop; 16px on mobile.
- **Density:** High density is preferred. Use `md (16px)` for standard padding within cards and `sm (8px)` for list items.
- **Breakpoints:**
  - Mobile: < 768px (Switch to vertical stack, hide sidebar in hamburger)
  - Tablet: 768px - 1024px (Collapse sidebar to icons)
  - Desktop: > 1024px (Full sidebar)

## Elevation & Depth
Depth is achieved through **Tonal Layering** and **Glassmorphism** rather than heavy shadows.

1.  **Level 0 (Base):** `#0B0F19` – The background foundation.
2.  **Level 1 (Cards/Surface):** `#111827` – Elevated containers with a 1px border of `#1F2937`.
3.  **Level 2 (Modals/Popovers):** Semi-transparent `#111827` with a 20px backdrop blur (Glassmorphism) and a slightly lighter border (`#374151`) to suggest proximity to the user.
4.  **Highlights:** A subtle top-down linear gradient (1% opacity white to 0%) on cards can be used to simulate a physical light source hitting the top edge.

## Shapes
The design system uses a **Soft (Level 1)** roundedness profile to maintain a professional, architectural feel. 

- **Standard Elements:** 0.25rem (4px) for inputs, buttons, and small tags.
- **Containers:** 0.5rem (8px) for cards and main dashboard modules.
- **Large Components:** 0.75rem (12px) for modals and primary layout wrappers.
- **Status Indicators:** Use fully rounded (999px) pills for "Status" chips to differentiate them from interactive buttons.

## Components
- **Buttons:** Primary buttons use a subtle gradient (Primary Blue to a slightly darker shade) with a 1px inner light stroke on the top edge. Secondary buttons are ghost-style with a white border at 10% opacity.
- **Cards:** Incorporate a 1px border. For featured metrics, use a very subtle background glow using a radial gradient of the primary color at 5% opacity in the top-right corner.
- **Data Tables:** High-density rows (32-40px height). Row hover states should use `#1F2937`. No vertical borders; only horizontal separators.
- **Input Fields:** Dark background (`#0B0F19`), 1px border. Focus state uses the Primary Blue border and a subtle 2px outer glow.
- **Sidebar:** Collapsible. Active states are indicated by a vertical 2px "Electric Blue" line on the far left and a subtle background tint.
- **Visualizations:** Charts should use the accent palette (Blue, Emerald, Amber) with 0.5px stroke widths. Fill areas in area charts should use a 10% opacity gradient.
- **Chips/Badges:** Small font size (`label-caps`), low-contrast backgrounds (e.g., Success Green at 10% opacity with solid Green text).