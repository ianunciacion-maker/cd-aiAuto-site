# Ai-Auto Design System & Theme Guide

This document serves as the single source of truth for the Ai-Auto website's design language. Use these tokens and guidelines when creating new pages or components to ensure consistency and ease of maintenance.

## 1. Core Design Tokens (CSS Variables)

These variables are defined in the `:root` scope and control the global look and feel.

### 🎨 Color Palette

#### Brand Colors
| Variable | Value | Description |
|----------|-------|-------------|
| `--navy` | `#111834` | Primary dark color, used for headings and primary buttons. |
| `--blue` | `#2357ff` | Primary accent color, used for links, active states, and highlights. |
| `--gold` | `#f7d35c` | Secondary accent, used for highlights and special cards. |
| `--coral` | `#ff8c7a` | Accent color for variety in tags or borders. |
| `--cream` | `#f5f0e6` | Warm background tone. |

#### Neutral Colors
| Variable | Value | Description |
|----------|-------|-------------|
| `--light-gray` | `#e3e6ee` | Used for borders and subtle backgrounds. |
| `--text-main` | `#111834` | Main body text color. |
| `--text-muted` | `#55586a` | Secondary text color for descriptions and metadata. |

### 📐 Layout & Spacing
| Variable | Value | Description |
|----------|-------|-------------|
| `--max-width` | `1120px` | Maximum width for the main content container. |
| `--radius-lg` | `24px` | Large border radius for cards and modals. |
| `--radius-md` | `16px` | Medium border radius for inner elements. |
| `--radius-pill`| `999px` | Fully rounded radius for buttons and badges. |

### 🌑 Shadows
| Variable | Value | Description |
|----------|-------|-------------|
| `--shadow-soft`| `0 18px 45px rgba(9, 16, 69, 0.12)` | Deep, soft shadow for floating elements. |
| `--shadow-card`| `0 12px 30px rgba(9, 16, 69, 0.08)` | Standard shadow for cards. |

---

## 2. Theming (Dark Mode)

The site uses a semantic variable system to handle light and dark modes automatically. **Always use these semantic variables instead of hardcoded colors.**

### Semantic Color Mapping

| Semantic Variable | Light Mode Value | Dark Mode Value | Usage |
|-------------------|------------------|-----------------|-------|
| `--bg-primary` | `#ffffff` | `#0a0d1a` | Main page background. |
| `--bg-secondary` | `#faf9ff` | `#111834` | Alternating section background. |
| `--bg-tertiary` | `#f5f3ff` | `#1a1f3a` | Third-level background depth. |
| `--surface` | `#ffffff` | `#111834` | Card or panel background. |
| `--border-color` | `#f0f2f7` | `#2a2f4a` | Main borders. |
| `--nav-bg` | `#ffffff` | `#0a0d1a` | Navigation bar background. |
| `--card-gradient-start`| `#ffffff` | `#1a1f3a` | Card gradient start. |
| `--card-gradient-end` | `#f8f9ff` | `#1e2340` | Card gradient end. |

### How to Apply
The theme is toggled by adding the `data-theme="dark"` attribute to the `<html>` tag.
```css
[data-theme="dark"] {
  /* Overrides for dark mode */
  --navy: #e8eaf5;
  --text-main: #e8eaf5;
  /* ... other overrides */
}
```

---

## 3. Typography

### Font Families
- **Headings:** `Playfair Display`, serif
  - Weights: 600, 700
  - Usage: `h1`, `h2`, `.hero-title`, `.section-heading`
- **Body:** `Inter`, sans-serif
  - Weights: 400, 500, 600, 700
  - Usage: Paragraphs, buttons, navigation, UI elements

### Standard Classes
- `.hero-title`: Large display text (clamp: 36px - 54px).
- `.section-heading`: Section titles (32px).
- `.hero-eyebrow`: Uppercase, tracking-wide labels (11px).

---

## 4. Layout Patterns

### Containers & Sections
- **Container:** `.container` sets the max-width (`1120px`) and horizontal padding (`24px`). Center it with `margin: 0 auto`.
- **Section:** `.section` adds standard vertical padding (`56px 0`).
- **Soft Section:** `.section--soft` uses `--bg-secondary` or gradient for visual separation.

### Grid Systems
Common grid layouts used across the site:
- **4-Column Grid:** Used for "Who It's For" cards.
  - `grid-template-columns: repeat(4, minmax(0, 1fr))`
- **3-Column Grid:** Used for "Daily Tools".
  - `grid-template-columns: repeat(3, minmax(0, 1fr))`
- **2-Column Grid:** Used for "Core Tools" and Hero sections.
  - `grid-template-columns: repeat(2, minmax(0, 1fr))`
- **Responsive:** All grids should collapse to 1 column on mobile (`max-width: 960px`).

---

## 5. UI Components

### Navigation (`.nav`)
- **Sticky:** `position: sticky; top: 0;`
- **Background:** `--nav-bg` (Theme aware).
- **Links:** `.nav-link` with hover color change and bottom border animation.
- **Active State:** `.nav-link--active` forces the bottom border.

### Buttons (`.btn`)
Base class: `.btn` (includes flex layout, pill radius, transition).

**Variants:**
- **Primary:** `.btn-primary`
  - Background: `--navy`
  - Text: White
  - Hover: Lift (`translateY(-1px)`) + Shadow increase.
- **Outline:** `.btn-outline`
  - Background: Transparent
  - Border: 1px solid `--light-gray`
  - Text: `--navy`

### Cards (`.card`, `.tool-card`)
Standard card styles include:
- Background: `--card-bg` or gradient variables.
- Border Radius: `--radius-lg` or `--radius-md`.
- Shadow: `--shadow-card`.
- Hover Effect: `transform: translateY(-8px)` and increased shadow.

**Color Variants:**
- `.card--blue`: Gradient Blue background, White text.
- `.card--gold`: Gold background, Dark text.
- `.tool-card--[color]`: Adds a colored left border (e.g., `border-left: 4px solid var(--blue)`).

### Pricing Table (`.pricing-table`)
- **Structure:** Rounded container with overflow hidden.
- **Rows:** `.pricing-row` with grid layout.
- **Striping:** Odd rows use `--bg-row-odd` for readability.

### Tags & Badges (`.tag`, `.pill`)
- Background: `--bg-tag` (Theme aware).
- Text: `--text-tag` (Theme aware).
- Radius: `--radius-pill`.

---

## 6. Animations

The site uses CSS keyframes for engaging entrances and continuous motion.

| Animation Name | Description | Usage |
|----------------|-------------|-------|
| `fadeInUp` | Fades in while moving up. | Page content, cards, buttons on load. |
| `slideInLeft/Right`| Slides element in from side. | Hero images, side cards. |
| `float` | Gentle up/down hovering. | Logos, avatars, hero graphics. |
| `pulse` | Subtle opacity pulse. | Highlights, attention grabbers. |
| `shimmer` | Light reflection effect. | Loading states or special feature cards. |
| `glow` | Box-shadow pulsing. | Hover states on feature cards. |
| `orbit` | Circular motion. | Icons in feature cards. |

---

## 7. Best Practices for Updates

1. **Use Variables:** Never hardcode hex values (e.g., `#111834`). Always use `var(--navy)` or `var(--text-main)`.
2. **Mobile First:** Write styles for mobile first, then use media queries (e.g., `@media (min-width: ...)` or override at `max-width`) for larger screens.
3. **Theme Check:** When adding a new component, check it in both Light and Dark modes. Ensure text has sufficient contrast against its background variable.
4. **Class Naming:** Use BEM-like naming (e.g., `.card`, `.card-title`, `.card--blue`) to keep styles modular and readable.
