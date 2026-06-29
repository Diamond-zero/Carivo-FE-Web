---
name: Luminous Precision
colors:
  surface: '#f6f9ff'
  surface-dim: '#d4dbe2'
  surface-bright: '#f6f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4fc'
  surface-container: '#e8eef6'
  surface-container-high: '#e3e9f1'
  surface-container-highest: '#dde3eb'
  on-surface: '#161c22'
  on-surface-variant: '#45464d'
  inverse-surface: '#2b3137'
  inverse-on-surface: '#ebf1f9'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#191c1e'
  on-tertiary-container: '#818486'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f6f9ff'
  on-background: '#161c22'
  surface-variant: '#dde3eb'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-xs:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1440px
  gutter: 1rem
  margin-mobile: 1rem
  margin-desktop: 2rem
  stack-xs: 0.25rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 1.5rem
---

## Brand & Style
The design system is engineered for high-stakes operational environments where clarity and rapid data processing are paramount. It adopts a **Modern SaaS** aesthetic that balances extreme information density with strategic whitespace to prevent cognitive overload. 

The brand personality is authoritative, systematic, and reliable. It utilizes a precision-focused visual language that blends "Corporate Modern" efficiency with "Minimalist" restraint. The UI should evoke a sense of calm control for service technicians and coordinators managing complex schedules and staff allocations. Key visual drivers include crisp borders, subtle tonal layering, and a rigid adherence to a functional grid.

## Colors
The palette is anchored by "Midnight Navy" (#0f172a), providing a strong professional foundation used for primary navigation and high-level headings. "Silver Mist" and "Slate" tones handle the UI's structural elements, creating a low-fatigue environment for long-duration usage.

- **Primary:** Deep navy for core actions and brand presence.
- **Secondary/Neutral:** Grayscale scale from `#f8fafc` to `#64748b` for backgrounds, borders, and secondary text.
- **Semantic States:** 
    - **Pending:** Amber for high visibility without immediate alarm.
    - **In Progress:** Corporate Blue to signify active movement.
    - **Completed:** Emerald Green for successful resolution.
    - **Warning/Error:** Vivid Red for critical technical issues or scheduling conflicts.

## Typography
Inter is used exclusively to leverage its exceptional legibility in data-heavy environments. The scale is optimized for high-density layouts, favoring smaller base sizes (14px) and tighter line-heights to maximize visible information per screen.

- **Headlines:** Use tighter letter spacing and Semi-Bold/Bold weights to create clear section hierarchy.
- **Labels:** Small caps or slightly tracked-out uppercase labels (label-xs) are used for table headers and metadata categorization.
- **Numeric Data:** Ensure the use of tabular num features for alignment in staff counts, time logs, and technical metrics.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a sidebar-driven navigation structure. For staff management, the dashboard maximizes horizontal space to accommodate multi-column tables and Gantt-style schedules.

- **Desktop (1280px+):** 12-column grid, 240px fixed sidebar, 32px page margins.
- **Tablet (768px - 1279px):** 8-column grid, 64px collapsed icon-sidebar, 24px page margins.
- **Mobile (<767px):** 4-column grid, 16px margins, bottom-sheet navigation for primary actions.

Spacing follows an 8px base unit (4px for micro-adjustments). Horizontal density is prioritized; use 12px padding in data cells and 16px-20px padding for card containers.

## Elevation & Depth
This design system utilizes **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows to maintain a professional, flat SaaS aesthetic. 

- **Level 0 (Background):** Base color `#f8fafc`.
- **Level 1 (Cards/Sidebar):** White surface (`#ffffff`) with a 1px solid border in `#e2e8f0`. No shadow.
- **Level 2 (Dropdowns/Modals):** White surface with a crisp 1px border and a subtle, high-diffusions shadow (0px 4px 12px rgba(15, 23, 42, 0.08)) to indicate temporary interaction.
- **Depth Cues:** Depth is achieved through the contrast between the dark primary sidebar and the light workspace, emphasizing the "command center" feel.

## Shapes
The design system utilizes **Rounded** (0.5rem / 8px) corner radii for standard UI elements. This provides a modern, approachable feel while remaining structured and professional.

- **Buttons & Inputs:** 8px (rounded-md).
- **Cards & Containers:** 16px (rounded-lg) to clearly define major content groupings.
- **Status Badges/Chips:** Fully rounded (pill) to distinguish them from interactive buttons.
- **Data Tables:** Outer container uses 8px radius; internal cells remain square for grid integrity.

## Components

### Buttons
- **Primary:** Background `#0f172a`, Text White. High-contrast for main actions like "Assign Task" or "Add Staff."
- **Secondary:** White background, 1px border `#e2e8f0`, Text `#0f172a`.
- **Ghost:** No background/border, Text `#64748b`. Used for utility actions in dense rows.

### Chips & Badges (Semantic)
Small, semi-bold text with subtle background tints:
- **Pending:** Text `#92400e`, Bg `#fef3c7`.
- **In Progress:** Text `#1e40af`, Bg `#dbeafe`.
- **Completed:** Text `#065f46`, Bg `#d1fae5`.
- **Warning:** Text `#991b1b`, Bg `#fee2e2`.

### Inputs & Tables
- **Form Fields:** 1px solid `#e2e8f0` borders. Focus state uses a 2px ring of `#0f172a` with an inset white border.
- **Data Tables:** Zebra striping (Background: `#f8fafc` on even rows). Header row uses `#f1f5f9` with Uppercase Labels (label-xs).

### Cards
- Standard cards use the `rounded-lg` radius with a 1px border.
- Card headers should include a bottom border separating the title from the content to enhance scannability in dashboards.

### Specialized Components
- **Staff Avatar:** Circular with status indicator dot in the bottom-right corner.
- **Timeline Rail:** A horizontal line element used in scheduling views, utilizing the semantic color tokens to represent task duration and status.