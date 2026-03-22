# OpenClaw Page Redesign: Agency Service Page

**Date**: 2026-03-22
**Branch**: redesign-march-21
**File**: openclaw.html

## Context

Ai-Auto is now a white-label OpenClaw agency. The openclaw.html page shifts from reselling the OpenClaw product to selling **done-for-you AI automation installation services**. Customers buy the installation from us — they never need to know about agency licenses or member areas.

## Design

Keep the existing CentralHQ dark theme CSS. Only the HTML body content changes.

## Pricing

| Tier | Price | Model |
|------|-------|-------|
| Basic Install | $1,497 | One-time payment |
| Custom Install | $2,497 + $297/mo | One-time + monthly support |

**Differentiator**: Custom Install adds custom configuration, ongoing monthly support, and priority support.

---

## Page Flow (Section by Section)

### 1. Hero

**Tag badges**: "Done-For-You AI Installation" + "Limited Availability"

**Headline**: "A Fully Installed, Fully Integrated AI Command Center That Builds, Manages, and Runs Your Entire Operation"

**Sub-headline**: "We handle the installation, configuration, training, and ongoing support — plus you get the complete software suite, done-for-you skills, and a custom Control Board built to ensure you actually win."

**8 Feature capsules** (use `.hero-badges` area or a new capsule grid):
- Complete Software Suite
- Full Installation & Setup
- Live Support Access
- Done-For-You Skills
- Full Training Program
- Custom Control Board
- Fully Installed & Integrated
- Ongoing Monthly Support

**Stats line**: "500+ Installs Done · 350+ Clients Onboarded · 4.7 Client Rating"

**CTA buttons**: "Get Installed Now" (anchor to pricing) + "See What's Included" (anchor to what-you-get)

**Dashboard preview**: Display `dashboard1.png` and `dashboard2.png` in a side-by-side or stacked layout below the hero CTA, showing what the installed system looks like. Use bordered card treatment with subtle shadow.

**Video embed**: Vimeo iframe `https://player.vimeo.com/video/1174520054` in the existing video-block pattern.

### 2. Sticky TOC

Updated pill labels:
- What You Get
- Results
- What's Included
- Full Suite
- Pricing
- Guarantee

### 3. Marquee Ticker

Updated items:
- 500+ Installs Done
- 350+ Clients Onboarded
- 4.7 Client Rating
- 30-Day Money-Back Guarantee
- No Technical Skills Required
- Setup in Under 5 Minutes
- Zero Prompt Engineering
- Full Business Automation

### 4. What You Get (replaces "What Is OpenClaw?")

**Section id**: `what-you-get`
**Tag**: "What You Get"
**Title**: "Your Complete AI Automation System — Installed & Ready"
**Subtitle**: "We take the most powerful open-source AI agent framework and install it as a fully managed system for your business — configured, connected, and ready to generate results from day one."

**Analogy grid (2 cards)**:
- Left card — "DIY Setup" label: "You research, configure servers, install dependencies, troubleshoot errors, connect APIs — weeks of trial and error with no guarantee it works."
- Right card (featured) — "We Install It For You" label: "We handle the entire setup — server, configuration, integrations, custom skills, and onboarding. You get a working AI system from day one."

**Three pillar cards**:
1. "Complete Installation" — accent bar blue — "We set up your entire AI system on secure cloud infrastructure — fully configured, connected, and tested before handoff."
2. "Custom Configuration" — accent bar gold — "Your system is tailored to your business — custom skills, workflows, and integrations set up to match your operations."
3. "Ongoing Support" — accent bar coral — "We don't just install and disappear. Get live training, a 3-day onboarding workshop, and continued support to ensure you succeed."

**Origin box**: "Built on the 85,000+ star open-source AI agent framework trusted by 100,000+ developers. We package this battle-tested technology into a fully managed installation — no coding, no terminal, no configuration required."

**Video block**: Same Vimeo embed or keep existing local video explainer.

### 5. Testimonials #1

**Section id**: `social-proof`
**Tag**: "Real Results"
**Title**: "They're Already Crushing It"
**Subtitle**: "No hype. No filters. Just screenshots straight from the community."

4 testimonial cards, each with:
- Star rating row (5 stars)
- "Verified Result" badge
- Quote text
- Screenshot image
- Reaction counts

Card 1: "Total newbie — and he had a live bot in MINUTES!" — test21.png — 312/248/197
Card 2: "Bilingual AI bot. Built & live. Under 10 minutes!" — test22.png — 289/221/178
Card 3: "10 minutes to build. She called it a GAME CHANGER." — test23.png — 341/274/203
Card 4: "Full setup — data, logos, API keys — done in 15 mins!" — test24.png — 267/198/154

**Bottom line**: "500+ entrepreneurs already deployed their AI business"

### 6. Bundle Contents

**Section id**: `bundle-contents`
**Tag**: "What's Included"
**Title**: "One Bundle. Total Domination."
**Subtitle**: "Here is everything you are going to get — the complete software suite, training, live support, done-for-you skills, and your own custom Control Board."

**Bundle cover image**: `cover.png` (centered, bordered)

**4 component cards** (2x2 grid, numbered 01-04):

1. **Claw Launcher Install** — Value: $297 — "We'll walk you through the exact installation process so your system is ready to go." Checklist: Complete system setup / Connect everything correctly / Get your system ready to start generating results

2. **Claw Launcher Onboarder** — Value: $497 — "A simple onboarding system that shows you exactly how to start using the system the right way." Checklist: Step-by-step onboarding / Understand how the system works / Avoid beginner mistakes / Start using the system faster

3. **3-Day Onboarding Workshop** — Value: $497 — "Join our live 3-day workshop where we walk you through everything step-by-step." Checklist: Watch the system being implemented live / Ask questions and get guidance / See exactly how to use the tools for results / Learn the fastest path to getting started

4. **Cashflow Engine** — Value: $497 — "A powerful suite of skills designed to help you create revenue assets fast." Checklist: Revenue Page Architect / Conversion Copywriter / Hero Hook Builder / VSL Script Creator

**Total value box**: "Total Value: $1,788"
**Guarantee callout**: "100% Installation Guarantee — You will be installed and operational. If you can't complete the two simple setup steps, we will do it for you."

### 7. Product Showcases (Bundle Upgrades)

**Section id**: `bundle-upgrades`
**Tag**: "Full Suite"
**Title**: "Plus Everything You Need to Win"
**Subtitle**: "The complete ecosystem — skill repository, control panel, business builder, and connector series."

4 upgrade items (horizontal card layout: image left, content right):

1. **Skill Repository** — Value: $3,997 — Image: `oto1-skill-repo.png`
   "Unlock access to 100+ ready-to-deploy automation skills that dramatically expand what your AI system can do."
   8 feature icons: Email & Marketing / CRM & Sales / Productivity / AI & Voice / Cloud & Storage / Ecommerce / Developer Tools / Forms & Data

2. **Control Panel** — Value: $997 — Image: `oto2-control-panel.png`
   "The advanced dashboard that makes managing your entire AI automation system simple and organized."
   4 features: Manage agents, skills, workflows / Monitor activity and performance / Launch and control tasks instantly / Access logs and system insights

3. **Business Builder** — Value: $2,997 — Image: `oto4-business-builder.png`
   "A complete training system designed to help you turn your AI system into a real business."
   4 features: Create profitable AI service offers / Build systems that generate consistent income / Package and sell AI solutions / Scale into a sustainable business

4. **Connector Series** — Value: $2,997 — Image: `oto6-connector-series.png`
   "Expand what your system can do by connecting it with apps, tools, and online services."
   4 features: Connect with external apps and services / Send and receive data between tools / Trigger automations across platforms / Build more powerful workflows

**REMOVED**: Agency License, Members Area, Titanium Suite

### 8. Pricing

**Section id**: `bundle-pricing`
**Tag**: "Get Started"
**Title**: "Get Your AI System Installed"
**Subtitle**: "Choose the installation package that fits your business."

**Two pricing cards** (side by side using pricing-grid-3 or a 2-col flex):

**Basic Install card**:
- Image: `silver.png`
- Tier icon: gear emoji
- Name: "Basic Install"
- Price: ~~$13,276~~ → $1,497
- Tagline: "One-Time Payment"
- CTA: "Get Basic Install" (links to setup modal or direct checkout)
- Features: Install ✅ / Onboarder ✅ / Workshop ✅ / Cashflow Engine ✅ / Skill Repository ✅ / Control Panel ✅ / Business Builder ✅ / Connector Series ✅ / Custom Configuration ❌ / Ongoing Monthly Support ❌ / Priority Support ❌

**Custom Install card** (featured, BEST VALUE badge):
- Image: `gold.png`
- Tier icon: trophy emoji
- Name: "Custom Install"
- Price: ~~$23,273~~ → $2,497 + $297/mo
- Tagline: "One-Time + Monthly Support"
- CTA: "Get Custom Install" (links to setup modal or direct checkout)
- Features: All Basic features ✅ + Custom Configuration ✅ / Ongoing Monthly Support ✅ / Priority Support ✅

**Guarantee bar**: "One-Time Payment — No Hidden Fees. Basic is a single payment. Custom includes hands-on monthly support at $297/mo after installation."

**Email CTA box**: "Need a setup for your whole team? Drop your email and we'll send you everything you need."

### 9. Guarantee

**Section id**: `guarantee`
**Tag**: "Risk-Free"
**Title**: "30-Day Simple Guarantee"
**Subtitle**: "No hoops. No fine print. Just results — or your money back."

**Guarantee box** with badge (30 / DAY):
Steps format:
- "Go through the guide."
- "Deploy your first AI worker."
- "Test the system."
- "If you don't see how this changes execution... email us within 30 days. We'll refund you."
- "No drama. No questions. You take the risk off your shoulders."

### 10. Testimonials #2 (with proof screenshots woven in)

**Tag**: "More Results"
**Title**: "The Community Keeps Winning"
**Subtitle**: "Still on the fence? Let them do the talking."

**Grid**: Mix of 4 testimonial cards (test25-28.png) AND 6 proof screenshots (proof1-6.png) from agency page in a combined grid.

Layout: 2-column grid with testimonial cards and proof images interleaved:
- Row 1: testimonial card (test25) + proof image (proof1)
- Row 2: proof image (proof2) + testimonial card (test26)
- Row 3: testimonial card (test27) + proof image (proof3)
- Row 4: proof image (proof4) + testimonial card (test28)
- Row 5: proof image (proof5) + proof image (proof6)

Proof images use simple bordered card treatment (`.testimonial-card` with just the image inside).

**Bottom line**: "450+ entrepreneurs already seeing results just like these"

### 11. Bigger Picture

Keep as-is. Dario Amodei quote about AI displacing jobs. CTA to pricing.

### 12. Enterprise Strip

Keep as-is. "Deploying across your business?" link to enterprise page.

### 13. Setup Selector Modal

Updated for new pricing:
- Option 1 (featured): "Basic Install" — 1 Setup — $1,497
- Option 2: "Custom Install" — 1 Setup + Monthly — $2,497

Links TBD (placeholder for now).

### 14. Waitlist Modal

Keep as-is.

---

## Images Used

| Image | Path | Section |
|-------|------|---------|
| cover.png | images/openclaw/cover.png | Bundle Contents |
| silver.png | images/openclaw/silver.png | Pricing (Basic) |
| gold.png | images/openclaw/gold.png | Pricing (Custom) |
| oto1-skill-repo.png | images/openclaw/oto1-skill-repo.png | Skill Repository |
| oto2-control-panel.png | images/openclaw/oto2-control-panel.png | Control Panel |
| oto4-business-builder.png | images/openclaw/oto4-business-builder.png | Business Builder |
| oto6-connector-series.png | images/openclaw/oto6-connector-series.png | Connector Series |
| dashboard1.png | images/openclaw/agency/dashboard1.png | Hero (system preview) |
| dashboard2.png | images/openclaw/agency/dashboard2.png | Hero (system preview) |
| test21-24.png | images/openclaw/test21-24.png | Testimonials #1 |
| test25-28.png | images/openclaw/test25-28.png | Testimonials #2 |
| proof1-6.png | images/openclaw/agency/proof1-6.png | Testimonials #2 (woven in) |
| dario-amodei.jpg | images/dario-amodei.jpg | Bigger Picture |

## CSS Changes

None. All existing CentralHQ dark theme classes are reused. Minor inline styles for new elements (capsule grid, proof image cards, dashboard preview).

## JS Changes

Minimal — update scroll reveal selectors if any new class names are introduced. Update setup modal pricing text. Everything else stays.
