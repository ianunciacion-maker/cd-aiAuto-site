# Homepage Redesign: Ai-Auto Ecosystem Integration

**Date:** 2026-03-27
**Goal:** Redesign the homepage to showcase the full Ai-Auto ecosystem — 4 individual AI tools + ClawLauncher (OpenClaw) — with a progressive light-to-dark visual journey and futuristic CSS animations.

## Design Decisions

- **Approach C:** Progressive darkening as user scrolls — light neobrutalist top transitions to dark CentralHQ aesthetic bottom
- **Hero OpenClaw link:** Secondary element below existing CTAs — dark banner strip with lobster-red accent, links to openclaw.html
- **Animations:** Medium impact, CSS-only — scroll-triggered fade-ins, animated gradient borders, floating dot particles, glowing pulse effects, counter animations
- **Tool presentation:** 4 individual tool cards in a 2x2 grid (replacing the single bundled card), plus ClawLauncher as premium offering in the dark zone

## Page Structure

### Zone 1: Light (Neobrutalist)

**Hero Section**
- Keeps existing layout: tag, headline ("Set Your Own Salary With AI"), subtitle, CTAs
- "Explore Tools" + "Learn More" buttons remain primary
- NEW: OpenClaw banner below CTAs, above stat boxes
  - Dark background (#0e0e0e), thin border, lobster-red left accent bar
  - Two lines: "AUTOMATE YOUR BUSINESS" (bold) / "Built with OpenClaw -> Use Now" (link)
  - Subtle pulsing glow on accent bar
  - Links to openclaw.html
- 4 floating cards (right side) remain as tool previews
- 3 stat boxes remain

**Who It's For Section**
- No changes — stays as-is

**"Your AI Toolkit" Section (replaces Core Tools)**
- 2x2 grid of individual tool cards
- Each card: colored top accent bar, tool name, 2-3 line description, output type tag
  1. Blog Post Generator (blue)
  2. Social Media Captions (coral)
  3. Email Campaigns (gold)
  4. Product Descriptions (green)
- Below grid: centered "$39.95/month — all 4 tools" + "Get Started" button
- "Coming Soon: Marketing Engine" teaser removed

### Zone 2: Transition Strip

- Full-width, ~200-300px tall
- Background gradient: #f2f0e9 (top) to #0e0e0e (bottom)
- Animated dot grid fading in
- Animated gradient borders top and bottom (gold -> coral -> red cycling)
- Soft glowing horizontal line at midpoint, pulsing
- Content: "NEXT LEVEL" tag, "Stop building alone. Let us install it for you.", bouncing chevron
- Typography shifts to Inter (from Playfair)
- No buttons or links — purely atmospheric

### Zone 3: Dark (CentralHQ-inspired)

**ClawLauncher Section**
- Background: #0e0e0e with radial gradient accents (gold bottom-left, purple bottom-right), dot grid
- Pill-shaped tag: "OpenClaw by Ai-Auto"
- Headline: "We Build Your AI System. You Run Your Business." (gradient-text on "AI System")
- Subtitle in #b0bcd4
- 3 feature cards in a row (thin borders, gradient-card bg, animated gradient border on hover):
  1. Custom AI Workflows
  2. Full Integration
  3. Training & Support
- Lobster-red pulse CTA: "Get Your OpenClaw Installation" -> openclaw.html
- Muted line: "Starting from $497 — one-time setup"

**Pricing Section (dark zone)**
- Header: "Choose Your Path" / "DIY tools or done-for-you automation"
- Two cards side by side:
  - Left: "AI Content Suite" (self-service) — $39.95/mo, 4 tool bullets, gold button
  - Right: "ClawLauncher Install" (done-for-you) — from $497, feature bullets, animated gradient border, lobster-red pulse CTA, "BEST VALUE" badge

**Footer CTA**
- Dark gradient background (#1a0000 to #2a0000)
- "Ready to Automate?" headline
- Lobster-red pulse button

**Site Footer**
- Stays dark, add "OpenClaw" to Product links

## Sections Removed

- "How It Works" (3-step cards) — redundant, tool cards are self-explanatory
- "App Preview" (dashboard mockup) — placeholder content, not adding value
- "Coming Soon: Marketing Engine" waitlist — dilutes focus, can live elsewhere

## Animation Inventory (all CSS-only)

1. **Scroll fade-ins** — elements fade up as they enter viewport (IntersectionObserver + CSS classes)
2. **Animated gradient borders** — `@keyframes` cycling border colors (gold -> coral -> red) on dark zone cards
3. **Floating dot particles** — CSS-only pseudo-elements with looping translate/opacity animations in dark sections
4. **Glowing pulse** — lobster-red CTA button pulse (existing `claw-pulse` keyframe), transition strip glow
5. **Stat counter animation** — numbers count up when scrolled into view (lightweight JS)
6. **Bouncing chevron** — CSS translateY loop on transition strip arrow
7. **Card hover effects** — light zone: neobrutalist translate + shadow grow; dark zone: border glow + subtle lift

## CSS Architecture

- All styles remain inline in index.html (matching current pattern)
- Dark zone variables defined as scoped overrides within dark section selectors
- No external CSS files or libraries added
- Animations use `@keyframes` and `will-change` for GPU acceleration
- `prefers-reduced-motion` media query disables animations for accessibility
