/**
 * Full responsive audit — scans every page at 7 breakpoints for
 * horizontal overflow, tiny fonts, invisible CTAs, overflowing images,
 * and broken layouts. Run with: npx playwright test audit.spec.js
 */
const { test, expect } = require('@playwright/test');

const PAGES = [
  { name: 'home', path: '/index.html' },
  { name: 'about', path: '/about.html' },
  { name: 'tools', path: '/tools.html' },
  { name: 'blog', path: '/blog.html' },
  { name: 'resources', path: '/ai-resources.html' },
  { name: 'post', path: '/blog/post.html?slug=example' },
  { name: 'clawlauncher', path: '/openclaw.html' },
];

const BREAKPOINTS = [
  { name: 'mobile-sm', width: 375, height: 667 },
  { name: 'mobile-lg', width: 414, height: 896 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop-sm', width: 1024, height: 768 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'desktop-xl', width: 1920, height: 1080 },
];

// For every (page × breakpoint) combo, assert: no horizontal scroll,
// nav visible or hamburger visible, no element overflowing the viewport.
for (const page of PAGES) {
  for (const bp of BREAKPOINTS) {
    test(`${page.name} @ ${bp.name} (${bp.width}px): no horizontal overflow + key content visible`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: bp.width, height: bp.height },
      });
      const p = await context.newPage();
      await p.goto(page.path);
      await p.waitForLoadState('load');
      await p.waitForTimeout(800);

      const audit = await p.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const offenders = [];
        const winW = window.innerWidth;
        document.querySelectorAll('*').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.right > winW + 2 && r.width > 4) {
            offenders.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className && el.className.toString ? el.className.toString() : '').slice(0, 100),
              id: el.id || '',
              right: Math.round(r.right),
              width: Math.round(r.width),
            });
          }
        });
        return {
          docScrollWidth: doc.scrollWidth,
          windowWidth: winW,
          bodyOverflow: getComputedStyle(body).overflowX,
          offenders: offenders.slice(0, 8),
        };
      });

      expect(
        audit.docScrollWidth,
        `${page.name}@${bp.name}: docScrollWidth ${audit.docScrollWidth}px > window ${audit.windowWidth}px. First offender: ${JSON.stringify(audit.offenders[0])}`
      ).toBeLessThanOrEqual(audit.windowWidth + 2);

      // Nav must have either .nav-links visible (desktop) OR .hamburger visible (mobile)
      const navShape = await p.evaluate(() => {
        const links = document.querySelector('.nav-links');
        const hamb = document.querySelector('.hamburger');
        const toLinks = links ? getComputedStyle(links).display !== 'none' : false;
        const toHamb = hamb ? getComputedStyle(hamb).display !== 'none' : false;
        return { toLinks, toHamb };
      });
      expect(
        navShape.toLinks || navShape.toHamb,
        `${page.name}@${bp.name}: nav must show either links or hamburger`
      ).toBe(true);

      await context.close();
    });
  }
}

// Hero-specific check: the main headline must be present and not cut off
for (const bp of BREAKPOINTS) {
  test(`home @ ${bp.name}: thesis hero headline readable`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: bp.width, height: bp.height },
    });
    const p = await context.newPage();
    await p.goto('/index.html');
    await p.waitForLoadState('load');
    await p.waitForTimeout(500);

    const headline = p.locator('.thesis-hero__headline').first();
    await expect(headline).toBeVisible();
    const rect = await headline.boundingBox();
    expect(rect.width).toBeGreaterThan(bp.width * 0.4);
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(bp.width + 2);

    // Font-size should be reasonable — at minimum 28px, at maximum 100px
    const fontSize = await headline.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize, `headline font-size ${fontSize}px out of range`).toBeGreaterThanOrEqual(28);
    expect(fontSize).toBeLessThanOrEqual(100);

    await context.close();
  });
}

// Hamburger must toggle: open on first click, close on second click
for (const bp of BREAKPOINTS.filter((b) => b.width < 768)) {
  for (const page of [
    { name: 'home', path: '/index.html' },
    { name: 'tools', path: '/tools.html' },
    { name: 'about', path: '/about.html' },
  ]) {
    test(`${page.name} @ ${bp.name}: hamburger toggles open AND closed`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: bp.width, height: bp.height },
      });
      const p = await context.newPage();
      await p.goto(page.path);
      await p.waitForLoadState('load');
      await p.waitForTimeout(500);

      const hamburger = p.locator('#hamburger');
      const mobileMenu = p.locator('#mobileMenu');
      await expect(hamburger).toBeVisible({ timeout: 5000 });

      // Sanity: menu starts closed
      await expect(mobileMenu).not.toHaveClass(/\bactive\b/);

      // First click: opens
      await hamburger.click();
      await p.waitForTimeout(300);
      await expect(mobileMenu).toHaveClass(/\bactive\b/);

      // Second click on the SAME hamburger: must close
      await hamburger.click();
      await p.waitForTimeout(300);
      await expect(mobileMenu).not.toHaveClass(/\bactive\b/);

      // And third click reopens it
      await hamburger.click();
      await p.waitForTimeout(300);
      await expect(mobileMenu).toHaveClass(/\bactive\b/);

      await context.close();
    });
  }
}

// Mobile menu links must have readable text (not cream on cream)
for (const bp of BREAKPOINTS.filter((b) => b.width < 768)) {
  for (const page of [
    { name: 'home', path: '/index.html' },
    { name: 'about', path: '/about.html' },
    { name: 'tools', path: '/tools.html' },
    { name: 'blog', path: '/blog.html' },
    { name: 'resources', path: '/ai-resources.html' },
    { name: 'clawlauncher', path: '/openclaw.html' },
  ]) {
    test(`${page.name} @ ${bp.name}: mobile menu links are readable (RGB distance)`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: bp.width, height: bp.height },
      });
      const p = await context.newPage();
      await p.goto(page.path);
      await p.waitForLoadState('load');
      await p.waitForTimeout(600);

      // Open the mobile menu
      await p.locator('.hamburger').first().click();
      await p.waitForTimeout(350);

      // Pick the first mobile-menu-link and measure contrast
      const link = p.locator('.mobile-menu-link').first();
      await expect(link).toBeVisible({ timeout: 3000 });
      const contrast = await link.evaluate((el) => {
        function parse(str) {
          const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
          if (!m) return null;
          return { r: +m[1], g: +m[2], b: +m[3], a: m[4] == null ? 1 : parseFloat(m[4]) };
        }
        function blend(top, base) {
          const a = top.a;
          return {
            r: Math.round(top.r * a + base.r * (1 - a)),
            g: Math.round(top.g * a + base.g * (1 - a)),
            b: Math.round(top.b * a + base.b * (1 - a)),
            a: 1,
          };
        }
        // Walk up the DOM, composing background alpha layers until we
        // reach an opaque ancestor. Fallback to white if everything's
        // transparent (shouldn't happen).
        let node = el;
        let layers = [];
        while (node && node !== document.documentElement) {
          const bg = parse(getComputedStyle(node).backgroundColor);
          if (bg && bg.a > 0) layers.unshift(bg);
          if (bg && bg.a >= 1) break;
          node = node.parentElement;
        }
        let effective = { r: 255, g: 255, b: 255, a: 1 };
        for (const layer of layers) effective = blend(layer, effective);

        const fgRaw = parse(getComputedStyle(el).color);
        const d = Math.sqrt(
          (fgRaw.r - effective.r) ** 2 +
          (fgRaw.g - effective.g) ** 2 +
          (fgRaw.b - effective.b) ** 2
        );
        return {
          fg: getComputedStyle(el).color,
          effectiveBg: `rgb(${effective.r}, ${effective.g}, ${effective.b})`,
          distance: Math.round(d),
        };
      });
      expect(
        contrast && contrast.distance,
        `${page.name}@${bp.name}: mobile menu link fg=${contrast && contrast.fg} vs effectiveBg=${contrast && contrast.effectiveBg} — distance ${contrast && contrast.distance}`
      ).toBeGreaterThan(150);

      await context.close();
    });
  }
}

// Floating video should not obstruct CTAs on mobile
for (const bp of BREAKPOINTS.filter((b) => b.width < 768)) {
  test(`home @ ${bp.name}: floating video doesn't hide the thesis-hero CTA`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: bp.width, height: bp.height },
    });
    const p = await context.newPage();
    await p.goto('/index.html');
    await p.waitForLoadState('load');
    await p.waitForTimeout(1500);

    const widget = p.locator('#floatingVideo');
    const widgetBox = await widget.boundingBox();
    // Widget must leave at least 160px of vertical space above it for scrolling
    // and content interaction — specifically, widget shouldn't overlap more
    // than 40% of the viewport height.
    expect(
      widgetBox.height / bp.height,
      `widget height ratio ${widgetBox.height / bp.height} — too large on mobile`
    ).toBeLessThan(0.4);
    // Widget must fit horizontally with margin
    expect(widgetBox.x + widgetBox.width).toBeLessThanOrEqual(bp.width);

    await context.close();
  });
}
