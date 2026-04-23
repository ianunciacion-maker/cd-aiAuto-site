/**
 * Marketing redesign verification tests.
 *
 * Every marketing page must:
 *  (1) Match openclaw.html's design language (dark bg, Inter font, .hero pattern,
 *      .sec-* sections, openclaw-vocabulary cards like .border-box/.pillar-card/
 *      .capability-card/.analogy-card/.step-card)
 *  (2) Include all three anchor quotes:
 *      - "Business as we know it will never be the same." (hero tagline)
 *      - "ClawLauncher automates new startups as it lowers expenses and increases revenue for any business." (pull quote)
 *      - "AI will not replace humans, but those who use AI will replace those who don't." (closer)
 *  (3) Preserve all original sections and assets (page-specific content checks)
 *  (4) Not have console errors or broken resource loads
 */

const { test, expect } = require('@playwright/test');

const ANCHOR_Q1 = 'Business as we know it will never be the same';
const ANCHOR_Q2 = 'ClawLauncher automates new startups';
const ANCHOR_Q2_TAIL = 'increases revenue for any business';
const ANCHOR_Q3 = 'AI will not replace humans';
const ANCHOR_Q3_TAIL = 'replace those who don';

const MARKETING_PAGES = [
  { name: 'Home', path: '/index.html' },
  { name: 'About', path: '/about.html' },
  { name: 'Tools', path: '/tools.html' },
  { name: 'Blog', path: '/blog.html' },
  { name: 'AI Resources', path: '/ai-resources.html' },
];

// Helper: capture all console errors + failed requests on a page
async function withErrorCapture(page, fn) {
  const errors = [];
  const failedRequests = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('requestfailed', (req) => {
    // Ignore known-OK failures: supabase REST calls when DB tables may not exist,
    // external image hosts being slow. We care about asset 404s for our own pages.
    const url = req.url();
    if (url.includes('localhost:8123') || url.startsWith('file://')) {
      failedRequests.push(`${req.method()} ${url} — ${req.failure()?.errorText || ''}`);
    }
  });
  await fn();
  return { errors, failedRequests };
}

// ───── DESIGN PARITY ─────
test.describe('Design parity with openclaw.html', () => {
  for (const p of MARKETING_PAGES) {
    test(`${p.name}: ClawLauncher design language`, async ({ page }) => {
      await page.goto(p.path);
      await page.waitForLoadState('load');

      // 1. Body uses Inter font family
      const bodyFontFamily = await page.evaluate(() =>
        getComputedStyle(document.body).fontFamily
      );
      expect(bodyFontFamily.toLowerCase()).toContain('inter');

      // 2. Body is dark (background resolves to a dark color)
      const bg = await page.evaluate(() => {
        // Walk up from body to find the actual dark background
        const body = document.body;
        const cs = getComputedStyle(body);
        return cs.backgroundColor;
      });
      // Parse rgb(r,g,b) and ensure it's dark (each channel < 40)
      const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      expect(match, `Body background must be set, got: ${bg}`).not.toBeNull();
      const [, r, g, b] = match;
      const sum = parseInt(r) + parseInt(g) + parseInt(b);
      expect(sum, `Body should be dark (r+g+b < 90), got rgb(${r},${g},${b}) = ${sum}`).toBeLessThan(90);

      // 3. Hero section present with openclaw-vocabulary class
      const heroCount = await page.locator('section.hero').count();
      expect(heroCount, 'Must have a .hero section').toBeGreaterThanOrEqual(1);

      // 4. At least one openclaw-vocabulary section class present
      //    (sec-what-is / sec-how / sec-capabilities / sec-full-stack / sec-real-world / etc.)
      const openclawSections = await page
        .locator(
          'section[class*="sec-what-is"], section[class*="sec-how"], section[class*="sec-capabilities"], section[class*="sec-full-stack"], section[class*="anchor-"]'
        )
        .count();
      expect(
        openclawSections,
        'Page must use openclaw section vocabulary (.sec-*, .anchor-*)'
      ).toBeGreaterThan(0);

      // 5. openclaw-style card pattern present (pillar-card / capability-card /
      //    step-card / analogy-card / border-box / blog-card / resource-card / tool-card)
      const cards = await page
        .locator(
          '.pillar-card, .capability-card, .step-card, .analogy-card, .border-box, .blog-card, .resource-card, .tool-card, .anchor-pull-quote, .dark-card'
        )
        .count();
      expect(cards, 'Page must use openclaw card vocabulary').toBeGreaterThan(0);
    });
  }
});

// ───── LOGO VISIBILITY ─────
test.describe('Brand logo is visible on every page', () => {
  for (const p of MARKETING_PAGES) {
    test(`${p.name}: "Ai-Auto" logo is readable (not same-color-as-background)`, async ({ page }) => {
      await page.goto(p.path);
      await page.waitForLoadState('load');
      // navigation.js injects the nav on DOMContentLoaded, but give it a beat.
      await page.waitForSelector('.nav .logo', { timeout: 5000 });

      const logo = page.locator('.nav .logo').first();
      await expect(logo).toBeVisible();
      await expect(logo).toHaveText(/Ai-Auto/i);

      // Check that logo text color differs from its background significantly
      // (RGB distance > 150 prevents cream-on-cream invisibility).
      const contrast = await logo.evaluate((el) => {
        const cs = getComputedStyle(el);
        function parse(s) {
          const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          return m ? [+m[1], +m[2], +m[3]] : null;
        }
        const fg = parse(cs.color);
        // If background is transparent, walk up to find first non-transparent ancestor
        let bg = parse(cs.backgroundColor);
        let node = el;
        while ((!bg || cs.backgroundColor === 'rgba(0, 0, 0, 0)') && node.parentElement) {
          node = node.parentElement;
          const pcs = getComputedStyle(node);
          const pbg = parse(pcs.backgroundColor);
          if (pbg && pcs.backgroundColor !== 'rgba(0, 0, 0, 0)') { bg = pbg; break; }
        }
        if (!fg || !bg) return { fg, bg, distance: null };
        const d = Math.sqrt(
          (fg[0] - bg[0]) ** 2 + (fg[1] - bg[1]) ** 2 + (fg[2] - bg[2]) ** 2
        );
        return { fg, bg, distance: Math.round(d) };
      });

      expect(
        contrast.distance,
        `Logo fg ${JSON.stringify(contrast.fg)} vs bg ${JSON.stringify(contrast.bg)} — distance too low`
      ).toBeGreaterThan(150);
    });
  }
});

// ───── ANCHOR QUOTES ─────
test.describe('Anchor quotes present on every page', () => {
  for (const p of MARKETING_PAGES) {
    test(`${p.name}: all 3 anchor quotes`, async ({ page }) => {
      await page.goto(p.path);
      await page.waitForLoadState('load');

      const bodyText = await page.evaluate(() => document.body.textContent);

      expect(bodyText, 'Quote 1 — hero tagline').toContain(ANCHOR_Q1);
      expect(bodyText, 'Quote 2 — positioning').toContain(ANCHOR_Q2);
      expect(bodyText, 'Quote 2 tail').toContain(ANCHOR_Q2_TAIL);
      expect(bodyText, 'Quote 3 — closer').toContain(ANCHOR_Q3);
      expect(bodyText, 'Quote 3 tail').toContain(ANCHOR_Q3_TAIL);

      // Quote 1 must specifically appear as the tagline pill (gold-tinted element)
      const tagline = page.locator(
        '.anchor-tagline, .hero-tag:has-text("Business as we know")'
      );
      await expect(
        tagline.first(),
        'Quote 1 must appear as a visible hero tagline element'
      ).toBeVisible();

      // Quote 2 must appear in a pull-quote container
      const pullQuote = page.locator('.anchor-pull-quote');
      await expect(
        pullQuote.first(),
        'Quote 2 must appear inside a .anchor-pull-quote container'
      ).toBeVisible();

      // Quote 3 must appear in closer block
      const closer = page.locator('.anchor-closer');
      await expect(
        closer.first(),
        'Quote 3 must appear inside a .anchor-closer section'
      ).toBeVisible();
    });
  }
});

// ───── CONTENT PRESERVATION — PER PAGE ─────
test.describe('Home: preserved sections + assets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('load');
  });

  test('hero preserved — pill, headlines, product name, endorsement, feature lines', async ({ page }) => {
    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toContain('Only 2 reputable builders in the country');
    expect(body).toContain('Runs Entire Business');
    expect(body).toContain('Voice Commands');
    expect(body).toContain('Saves Expenses and Makes More Money');
    expect(body).toContain('Business Builder');
    expect(body).toContain('Clinton E. Day');
    expect(body).toContain('Works While You Sleep');
    expect(body).toContain('Software Authorities');
    expect(body).toContain('Ongoing Support');
  });

  test('Picture1.png hero image loads', async ({ page }) => {
    const img = page.locator('img[src="Picture1.png"]');
    await expect(img).toBeVisible();
    const naturalWidth = await img.evaluate((el) => el.naturalWidth);
    expect(naturalWidth, 'Picture1.png must load (naturalWidth > 0)').toBeGreaterThan(0);
  });

  test('What You Just Found section + 3 cards', async ({ page }) => {
    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toContain('What You Just Found');
    expect(body).toContain('Software Jockeys Charge');
    expect(body).toContain('Built by Three of the Best');
    expect(body).toContain('Chad Nicely');
    expect(body).toContain('Karthik Ramana');
    expect(body).toContain('Matt Garrett');
    expect(body).toContain('Extremely Difficult to Build');
  });

  test('One System capabilities + 9 verb pills', async ({ page }) => {
    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toContain('One System');
    expect(body).toContain('Entire Business');
    for (const verb of ['Plan', 'Build', 'Sell', 'Scale', 'Automate', 'Create', 'Launch', 'Grow', 'Monetize']) {
      expect(body).toContain(verb);
    }
  });

  test('Three Steps section — We Build It / Train You / Runs Your Business', async ({ page }) => {
    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toContain('Three Steps');
    expect(body).toContain('We Build It');
    expect(body).toContain('We Train You');
    expect(body).toContain('It Runs Your Business');
  });

  test('Built-In AI Tools section — all 4 tools', async ({ page }) => {
    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toContain('Built-In AI Tools');
    expect(body).toContain('Blog Post Generator');
    expect(body).toContain('Social Media Captions');
    expect(body).toContain('Email Campaigns');
    expect(body).toContain('Product Descriptions');
  });

  test('Choose Your Path — 2 tiers with $39.95 and $1,297', async ({ page }) => {
    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toContain('Choose Your Path');
    expect(body).toContain('AI Content Suite');
    expect(body).toContain('ClawLauncher Install');
    expect(body).toContain('$39.95');
    expect(body).toContain('$1,297');
  });

  test('Ready to Automate CTA', async ({ page }) => {
    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toContain('Ready to Automate');
  });
});

test.describe('About: preserved sections + assets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about.html');
    await page.waitForLoadState('load');
  });

  test('hero + mission + values preserved', async ({ page }) => {
    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toContain('Empowering');
    expect(body).toContain('Your Work');
    expect(body).toMatch(/Rooted In[\s\S]*Efficiency/);
    expect(body).toContain('Transparency');
    expect(body).toContain('Speed');
    expect(body).toContain('Empowerment');
  });

  test('Clint Day profile + founder image', async ({ page }) => {
    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toContain('Clint Day');
    expect(body).toContain('Vietnam veteran');
    expect(body).toContain('entrepreneurship');
    expect(body).toContain('Silver Star');

    const img = page.locator('img[src*="founder.jpeg"]');
    await expect(img).toBeVisible();
    const nw = await img.evaluate((el) => el.naturalWidth);
    expect(nw, 'founder.jpeg must load').toBeGreaterThan(0);
  });

  test('Journey 4 steps', async ({ page }) => {
    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toContain('Concept');
    expect(body).toContain('Prototype');
    expect(body).toContain('Beta');
    expect(body).toContain('Launch');
  });

  test('Team 3 disciplines', async ({ page }) => {
    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toContain('Engineering');
    expect(body).toContain('Design');
    expect(body).toContain('Support');
  });
});

test.describe('Tools: preserved sections + assets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools.html');
    await page.waitForLoadState('load');
  });

  test('hero + AI Content Creation Tools', async ({ page }) => {
    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toContain('AI Content Creation');
  });

  test('all 4 core tools present with descriptions', async ({ page }) => {
    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toContain('Blog Generator');
    expect(body).toContain('Social Captions');
    expect(body).toContain('Email Campaigns');
    expect(body).toContain('Product Descriptions');
    expect(body).toMatch(/SEO[\-\s]optimized/);
    expect(body).toMatch(/Hashtag/);
  });

  test('Roadmap 4-step Marketing Engine', async ({ page }) => {
    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toContain('Marketing Engine');
    expect(body).toContain('Ideation');
    expect(body).toContain('Creation');
    expect(body).toContain('Multiplication');
    expect(body).toContain('Distribution');
  });

  test('Key Features — all 6', async ({ page }) => {
    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toContain('Lightning Fast');
    expect(body).toContain('Secure');
    expect(body).toContain('Seamless Integration');
    expect(body).toContain('Advanced Analytics');
    expect(body).toContain('AI-Powered');
    expect(body).toContain('Built to Scale');
  });

  test('waitlist form present + functional', async ({ page }) => {
    const email = page.locator('input[type="email"]#waitlistEmail');
    await expect(email).toBeVisible();
    const submit = page.locator('#waitlistForm button[type="submit"]');
    await expect(submit).toBeVisible();
  });
});

test.describe('Blog: preserved structure', () => {
  test('hero + grid container render', async ({ page }) => {
    await page.goto('/blog.html');
    await page.waitForLoadState('load');

    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toMatch(/(actually happening to work|Content Hub|blog)/i);

    // The grid container must exist (even if empty / loading posts)
    const grid = page.locator('#blogPostsGrid');
    await expect(grid).toBeAttached();
  });
});

test.describe('AI Resources: preserved structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-resources.html');
    await page.waitForLoadState('load');
  });

  test('hero + both category columns', async ({ page }) => {
    const body = await page.evaluate(() => document.body.textContent);
    expect(body).toContain('AI News');
    expect(body).toContain('AI for Entrepreneurs');

    await expect(page.locator('#aiNewsList')).toBeAttached();
    await expect(page.locator('#aiEntrepreneursList')).toBeAttached();
  });

  test('article lists populate (from DB or fallback)', async ({ page }) => {
    // Wait for dynamic content; fallback kicks in if DB is empty/missing
    await page.waitForTimeout(1500);
    const newsItems = await page.locator('#aiNewsList .article-item').count();
    const entItems = await page.locator('#aiEntrepreneursList .article-item').count();
    expect(newsItems, 'AI News column must render at least one article (fallback OK)').toBeGreaterThan(0);
    expect(entItems, 'AI Entrepreneurs column must render at least one article').toBeGreaterThan(0);
  });
});

// ───── TECHNICAL INTEGRITY ─────
test.describe('No console errors or broken local resources', () => {
  for (const p of MARKETING_PAGES) {
    test(`${p.name}: clean console + no 404s`, async ({ page }) => {
      const errors = [];
      const failed = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      page.on('pageerror', (err) => errors.push(String(err)));
      page.on('response', (res) => {
        const url = res.url();
        if (
          res.status() >= 400 &&
          url.includes('localhost:8123') &&
          // Ignore /api/* and /supabase calls — server isn't running APIs
          !url.includes('/api/')
        ) {
          failed.push(`${res.status()} ${url}`);
        }
      });

      await page.goto(p.path);
      await page.waitForLoadState('load');

      // Filter expected-benign errors
      const realErrors = errors.filter((e) => {
        const lower = e.toLowerCase();
        // Supabase schema errors when tables don't exist are OK (page falls back)
        if (lower.includes('supabase') || lower.includes('fetch') || lower.includes('cors')) return false;
        if (lower.includes('failed to load resource') && lower.includes('supabase.co')) return false;
        return true;
      });

      expect(realErrors, `Page ${p.path} had console errors:\n${realErrors.join('\n')}`).toEqual([]);
      expect(failed, `Page ${p.path} had broken local resources:\n${failed.join('\n')}`).toEqual([]);
    });
  }
});

// ───── SHARED CSS ACTUALLY LOADS ─────
test('clawlauncher.css serves 200 + contains openclaw tokens', async ({ request }) => {
  const res = await request.get('/css/clawlauncher.css');
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain('--bg-paper');
  expect(body).toContain('--gradient-card');
  expect(body).toContain('.border-box');
  expect(body).toContain('.hero');
  expect(body).toContain('.anchor-closer');
  expect(body).toContain('.anchor-pull-quote');
  expect(body).toContain('.anchor-tagline');
});

test('marketing-animations.js serves 200', async ({ request }) => {
  const res = await request.get('/js/marketing-animations.js');
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain('IntersectionObserver');
});

// ───── AMBIENT BACKGROUND ANIMATIONS ─────
test.describe('Ambient background animations on every page', () => {
  for (const p of MARKETING_PAGES) {
    test(`${p.name}: body has drifting grid + pseudo-element orbs + shimmer animations`, async ({
      page,
    }) => {
      await page.goto(p.path);
      await page.waitForLoadState('load');

      // body element itself runs the grid-drift animation
      const bodyAnim = await page.evaluate(() => {
        const cs = getComputedStyle(document.body);
        return {
          name: cs.animationName,
          duration: cs.animationDuration,
          iteration: cs.animationIterationCount,
          playState: cs.animationPlayState,
        };
      });
      expect(bodyAnim.name, `${p.name}: body should run an ambient grid animation`).toMatch(
        /ambient-grid-drift/
      );
      expect(bodyAnim.iteration).toBe('infinite');
      expect(bodyAnim.playState).toBe('running');

      // body::before runs the orb-drift animation
      const beforeAnim = await page.evaluate(() => {
        const cs = getComputedStyle(document.body, '::before');
        return {
          name: cs.animationName,
          duration: cs.animationDuration,
          iteration: cs.animationIterationCount,
          playState: cs.animationPlayState,
          blendMode: cs.mixBlendMode,
          pointerEvents: cs.pointerEvents,
          position: cs.position,
        };
      });
      expect(beforeAnim.name, `${p.name}: body::before should run ambient-orbs`).toMatch(
        /ambient-orbs/
      );
      expect(beforeAnim.iteration).toBe('infinite');
      expect(beforeAnim.playState).toBe('running');
      // Must sit above content via blend mode — screen (dark) or multiply (light)
      expect(['screen', 'multiply']).toContain(beforeAnim.blendMode);
      // Must not block clicks
      expect(beforeAnim.pointerEvents).toBe('none');
      // Must be fixed (stays put on scroll)
      expect(beforeAnim.position).toBe('fixed');

      // body::after runs the conic shimmer
      const afterAnim = await page.evaluate(() => {
        const cs = getComputedStyle(document.body, '::after');
        return {
          name: cs.animationName,
          iteration: cs.animationIterationCount,
          playState: cs.animationPlayState,
          pointerEvents: cs.pointerEvents,
        };
      });
      expect(afterAnim.name, `${p.name}: body::after should run ambient-shimmer`).toMatch(
        /ambient-shimmer/
      );
      expect(afterAnim.iteration).toBe('infinite');
      expect(afterAnim.playState).toBe('running');
      expect(afterAnim.pointerEvents).toBe('none');
    });
  }

  test('Home: orbs are actually moving over time', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('load');
    // The orb animation runs on transforms of body::before.
    // We read the currentTime of the animation to prove it's progressing.
    const first = await page.evaluate(() => {
      const anims = document.body.getAnimations({ subtree: true });
      const orb = anims.find((a) => a.animationName === 'ambient-orbs');
      return orb ? orb.currentTime : null;
    });
    expect(first, 'ambient-orbs web animation should be present').not.toBeNull();

    await page.waitForTimeout(600);

    const second = await page.evaluate(() => {
      const anims = document.body.getAnimations({ subtree: true });
      const orb = anims.find((a) => a.animationName === 'ambient-orbs');
      return orb ? orb.currentTime : null;
    });
    expect(second, 'orb animation should still be running').not.toBeNull();
    expect(second).toBeGreaterThan(first);
  });
});

// ───── HOMEPAGE TOOLKIT SECTION (openclaw-style dark redesign) ─────
test.describe('Home: Built-In AI Tools section matches ClawLauncher dark design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('load');
  });

  test('toolkit section has a dark background, not the old light cream', async ({ page }) => {
    const bg = await page.evaluate(() => {
      const el = document.querySelector('.toolkit-section');
      if (!el) return null;
      return getComputedStyle(el).backgroundColor;
    });
    expect(bg, '.toolkit-section must exist').not.toBeNull();
    // Accept any bg color as long as each channel is dark (r+g+b < 80) to ensure it's not cream.
    const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    expect(match, `got bg ${bg}`).not.toBeNull();
    const sum = parseInt(match[1]) + parseInt(match[2]) + parseInt(match[3]);
    expect(sum, `toolkit-section must be dark, got ${bg} (sum=${sum})`).toBeLessThan(80);
  });

  test('toolkit section headline uses Inter, not Playfair Display', async ({ page }) => {
    const font = await page.evaluate(() => {
      const h2 = document.querySelector('.toolkit-section .section-header h2');
      return h2 ? getComputedStyle(h2).fontFamily : null;
    });
    expect(font).not.toBeNull();
    expect(font.toLowerCase()).toContain('inter');
    expect(font.toLowerCase()).not.toContain('playfair');
  });

  test('toolkit cards have dark gradient background and light text', async ({ page }) => {
    const { cardBg, textColor, borderTopExists } = await page.evaluate(() => {
      const card = document.querySelector('.toolkit-card');
      if (!card) return { cardBg: null, textColor: null, borderTopExists: false };
      const cs = getComputedStyle(card);
      const before = getComputedStyle(card, '::before');
      const h3 = card.querySelector('h3');
      return {
        cardBg: cs.backgroundImage || cs.backgroundColor,
        textColor: h3 ? getComputedStyle(h3).color : null,
        borderTopExists: before.content !== 'none' && (before.height !== 'auto' && parseFloat(before.height) > 0),
      };
    });

    expect(cardBg, '.toolkit-card must have a background').not.toBeNull();
    // Card bg should be dark — check it's NOT cream #ffffff/#f5f5f5 style.
    // Accept linear-gradient(... #19...) etc. by making sure it isn't "rgb(255, 255, 255)".
    expect(cardBg.toLowerCase()).not.toBe('rgb(255, 255, 255)');
    expect(cardBg.toLowerCase()).not.toContain('242, 240, 233'); // --bg-paper neobrutalist cream

    // Heading should be light-colored (blue-white #f1f5f9 or warm cream #efe5cd)
    const m = textColor && textColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    expect(m, `heading color "${textColor}" must be parsable`).not.toBeNull();
    const sum = parseInt(m[1]) + parseInt(m[2]) + parseInt(m[3]);
    expect(sum, `toolkit-card h3 must be light text (sum ${sum})`).toBeGreaterThan(500);

    expect(borderTopExists, 'each toolkit card must show a colored top-border accent via ::before').toBe(true);
  });

  test('all 4 tools present with tags in the expected order', async ({ page }) => {
    const data = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.toolkit-card')];
      return cards.map((c) => ({
        title: (c.querySelector('h3') || {}).textContent,
        tag: (c.querySelector('.toolkit-tag') || {}).textContent,
      }));
    });
    expect(data.length).toBe(4);
    expect(data[0].title).toContain('Blog Post Generator');
    expect(data[1].title).toContain('Social Media Captions');
    expect(data[2].title).toContain('Email Campaigns');
    expect(data[3].title).toContain('Product Descriptions');
    // Tags should still be present (textual content preserved from old design)
    expect(data[0].tag).toMatch(/Blog Posts/i);
    expect(data[3].tag).toMatch(/Product Copy/i);
  });

  test('old neobrutalist "transition zone" is removed from the DOM', async ({ page }) => {
    const count = await page.locator('.transition-zone, .transition-tag, .transition-chevron').count();
    expect(count, 'legacy transition-zone markup should be gone').toBe(0);
  });

  test('"Included" tag pill is visible at the top of the toolkit section', async ({ page }) => {
    const pill = page.locator('.toolkit-section .section-header .tag');
    await expect(pill).toBeVisible();
    await expect(pill).toHaveText(/Included/i);
    // Must be gold-ish (openclaw tag style), not the old lavender/black pill
    const color = await pill.evaluate((el) => getComputedStyle(el).color);
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    expect(m).not.toBeNull();
    const [, r, g, b] = m.map((x) => parseInt(x));
    // Gold #f5a623 = rgb(245, 166, 35). Red channel should dominate.
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b + 100);
  });

  test('Also available standalone CTA retains the $39.95/mo price and points to signup', async ({ page }) => {
    const bodyText = await page.evaluate(() => document.body.textContent);
    expect(bodyText).toContain('$39.95');
    const cta = page.locator('.toolkit-cta a.btn-light');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', /signup/);
  });
});

// ───── WIDER CONTENT AREA ─────
test.describe('Container max-width uses modern 1400px', () => {
  for (const p of MARKETING_PAGES) {
    test(`${p.name}: .container max-width ≥ 1400px`, async ({ page }) => {
      await page.goto(p.path);
      await page.waitForLoadState('load');
      const maxW = await page.evaluate(() => {
        const el = document.querySelector('.container, .nav-inner');
        if (!el) return null;
        const raw = getComputedStyle(el).maxWidth;
        if (!raw.endsWith('px')) return null;
        return parseInt(raw, 10);
      });
      expect(maxW, `${p.name}: .container must define a px max-width`).not.toBeNull();
      expect(maxW).toBeGreaterThanOrEqual(1400);
    });
  }
});

// ───── RESPONSIVE ─────
test.describe('Responsive check — pages render at mobile width', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const p of MARKETING_PAGES) {
    test(`${p.name}: renders at 390px wide without horizontal scroll`, async ({ page }) => {
      await page.goto(p.path);
      await page.waitForLoadState('load');

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 2;
      });
      expect(hasOverflow, `${p.name} overflows horizontally at mobile width`).toBe(false);

      // Anchor tagline + closer still present
      const body = await page.evaluate(() => document.body.textContent);
      expect(body).toContain(ANCHOR_Q1);
      expect(body).toContain(ANCHOR_Q3);
    });
  }
});
