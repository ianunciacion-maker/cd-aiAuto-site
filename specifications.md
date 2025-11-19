# Ai-Auto Website Specifications

## Project Overview
**Ai-Auto** is a web platform designed to help users "Set Your Own Salary with AI". It showcases a suite of AI-powered tools and resources aimed at automating tasks and enhancing productivity. The website features a modern, responsive design with a focus on user experience and visual appeal.

## Technology Stack
- **Core:** HTML5, CSS3, JavaScript (Vanilla)
- **Styling:** Custom CSS with CSS Variables for theming
- **Fonts:** 
  - Headings: [Playfair Display](https://fonts.google.com/specimen/Playfair+Display)
  - Body: [Inter](https://fonts.google.com/specimen/Inter)
- **External Libraries:** None (Pure Vanilla implementation)

## Site Structure & Pages

### 1. Home (`index.html`)
The landing page serves as the main entry point, introducing the value proposition and key offerings.
- **Hero Section:** Engaging headline, subheadline, and Call-to-Action (CTA) with a trust bar.
- **Target Audience:** "Who It's For" section using a grid layout to highlight different user personas.
- **Tool Showcases:**
  - **Core Tools:** Highlighted premium tools with detailed descriptions and tags.
  - **Daily Tools:** Grid of smaller, everyday utility tools.
- **App Preview:** Visual section demonstrating the application interface.

### 2. About (`about.html`)
Dedicated to the mission, vision, and the team behind Ai-Auto.
- **Mission Statement:** "Rooted In" section explaining the philosophy.
- **Founder Profile:** Detailed section for Clint (Creator), including bio and credentials.
- **Journey:** "From Book to App" timeline/mapping.
- **Team:** Introduction to the development and support team.

### 3. Tools (`tools.html`)
A comprehensive catalog of available AI tools and pricing.
- **Tool Categories:** Organized lists of tools (e.g., Core, Daily).
- **Detailed Cards:** Each tool card includes tags, pricing, descriptions, and feature lists.
- **Pricing Table:** Comparative table showing costs for different tools.
- **Features Comparison:** Grid of feature cards highlighting specific capabilities (e.g., Automation, Analytics).

## Key Features

### 🎨 Design System
- **Color Palette:**
  - Primary: Navy (`#111834`), Blue (`#2357ff`)
  - Accents: Gold (`#f7d35c`), Coral (`#ff8c7a`)
  - Backgrounds: Cream (`#f5f0e6`), Light Gray (`#e3e6ee`)
- **Typography:** Clean hierarchy with Serif headings and Sans-serif body text.
- **Visuals:** Extensive use of gradients, soft shadows (`--shadow-soft`), and rounded corners (`--radius-lg`, `--radius-pill`).

### 🌗 Dark Mode
- **Implementation:** CSS Variables based theming.
- **Toggle:** Interactive toggle switch in the navigation bar.
- **Persistence:** Theme preference is saved and applied across pages (via JavaScript).
- **Adaptive Colors:** All semantic colors (backgrounds, text, borders, shadows) automatically adjust based on the `[data-theme="dark"]` attribute.

### 📱 Responsiveness
- **Mobile-First:** Layouts adapt to different screen sizes using CSS Grid and Flexbox.
- **Breakpoints:** Specific media queries (e.g., `max-width: 960px`) handle navigation changes and grid collapsing for mobile devices.

### ✨ Animations
The site utilizes a rich set of CSS animations to enhance engagement:
- **Entry Animations:** `fadeInUp`, `slideInLeft`, `slideInRight` for smooth content loading.
- **Micro-interactions:** Hover effects on cards (lift & shadow), buttons, and links.
- **Continuous Animations:** `float` (for logos/avatars), `pulse`, `glow`, `shimmer`, `rotate`, `orbit`.

## File Structure
```
/
├── index.html      # Homepage
├── about.html      # About page
├── tools.html      # Tools catalog page
└── (Assets inline or external links)
```
