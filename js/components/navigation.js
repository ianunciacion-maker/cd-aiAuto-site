// Shared Navigation and Footer Component
// This file provides consistent navigation and footer across all pages

class SiteNavigation {
  constructor() {
    this.navContainer = null;
    this.footerContainer = null;
  }

  // Generate navigation HTML
  generateNav() {
    return `
      <nav class="nav">
        <div class="container nav-inner">
          <a href="${this.getBaseUrl()}index.html" class="logo">Ai-Auto</a>
          <div class="nav-links">
            <a href="${this.getBaseUrl()}index.html" class="nav-link" id="homeLink">Home</a>
            <div class="nav-dropdown">
              <a href="${this.getBaseUrl()}openclaw.html" class="nav-link" id="openclawLink">
                ClawLauncher <span class="nav-dropdown-caret">&#9662;</span></a>
              <div class="nav-dropdown-menu">
                <a href="${this.getBaseUrl()}openclaw.html"
                  class="nav-dropdown-item">The Full Bundle</a>
                <a href="${this.getBaseUrl()}clawlauncher-explained.html"
                  class="nav-dropdown-item">What It Actually Does</a>
              </div>
            </div>
            <a href="${this.getBaseUrl()}tools.html" class="nav-link" id="toolsLink">Tools</a>
            <a href="${this.getBaseUrl()}about.html" class="nav-link" id="aboutLink">About</a>
            <a href="${this.getBaseUrl()}blog.html" class="nav-link" id="blogLink">Blog</a>
            <a href="${this.getBaseUrl()}ai-resources.html" class="nav-link" id="aiResourcesLink">AI Resources</a>
          </div>
          <div class="nav-auth">
            ${this.isOpenClawPage()
              ? '<a href="#bundle-pricing" class="nav-cta nav-cta--primary" onclick="document.querySelector(\'#bundle-pricing\').scrollIntoView({behavior:\'smooth\',block:\'start\'});return false;">Get Installed Now</a>'
              : `<a href="${this.getBaseUrl()}user/login.html" class="nav-cta nav-cta--ghost">Log In</a>
            <a href="${this.getBaseUrl()}user/signup.html" class="nav-cta nav-cta--primary">Get Started</a>`}
          </div>
        </div>
      </nav>

      <!-- HAMBURGER BUTTON (outside nav for proper z-index stacking) -->
      <button class="hamburger" id="hamburger" aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <!-- MOBILE MENU -->
      <div class="mobile-menu" id="mobileMenu">
        <div class="mobile-menu-header">
          <button class="hamburger active" id="closeMenu" aria-label="Close menu" style="margin-left: auto;">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <div class="mobile-menu-links">
          <a href="${this.getBaseUrl()}index.html" class="mobile-menu-link">Home</a>
          <a href="${this.getBaseUrl()}openclaw.html" class="mobile-menu-link">ClawLauncher</a>
          <a href="${this.getBaseUrl()}clawlauncher-explained.html"
            class="mobile-menu-link mobile-menu-sublink">&rarr; What It Actually Does</a>
          <a href="${this.getBaseUrl()}tools.html" class="mobile-menu-link">Tools</a>
          <a href="${this.getBaseUrl()}about.html" class="mobile-menu-link">About</a>
          <a href="${this.getBaseUrl()}blog.html" class="mobile-menu-link">Blog</a>
          <a href="${this.getBaseUrl()}ai-resources.html" class="mobile-menu-link">AI Resources</a>
          ${this.isOpenClawPage()
            ? '<a href="#bundle-pricing" class="nav-cta nav-cta--primary nav-cta--block" onclick="document.getElementById(\'mobileMenu\').classList.remove(\'active\');document.querySelector(\'#bundle-pricing\').scrollIntoView({behavior:\'smooth\',block:\'start\'});return false;">Get Installed Now</a>'
            : `<a href="${this.getBaseUrl()}user/login.html" class="mobile-menu-link">Log In</a>
          <a href="${this.getBaseUrl()}user/signup.html" class="nav-cta nav-cta--primary nav-cta--block">Get Started</a>`}
        </div>
      </div>
    `;
  }

  // Generate footer HTML with login button
  generateFooter() {
    return `
      <section class="footer-cta">
        <div class="container">
          <h2>Ready to Automate?</h2>
          <p>Join thousands building their automated future</p>
          <a href="${this.getBaseUrl()}user/signup.html" class="btn"
            style="background: var(--bg-white); color: var(--blue); font-size: 16px; padding: 18px 36px; display: inline-block;">Get Started
            Free</a>
        </div>
      </section>

      <!-- SITE FOOTER -->
      <footer class="site-footer">
        <div class="container">
          <div class="footer-inner">
            <div class="footer-brand">
              <h3>Ai-Auto</h3>
              <p style="max-width: 300px;">
                Building the future of work, one automation at a time. Set your own salary with AI-powered tools.
              </p>
            </div>
            <div class="footer-links">
              <h4>Product</h4>
              <ul>
                <li><a href="${this.getBaseUrl()}tools.html">Tools</a></li>
                <li><a href="${this.getBaseUrl()}blog.html">Blog</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">Features</a></li>
                <li><a href="#">Roadmap</a></li>
              </ul>
            </div>
            <div class="footer-links">
              <h4>Company</h4>
              <ul>
                <li><a href="${this.getBaseUrl()}about.html">About</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            <div class="footer-links">
              <h4>Account</h4>
              <ul>
                <li><a href="${this.getBaseUrl()}user/login.html">Log In</a></li>
                <li><a href="${this.getBaseUrl()}user/signup.html">Sign Up</a></li>
                <li><a href="#">Forgot Password</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            &copy; 2024 Ai-Auto. All rights reserved. Built with AI.
          </div>
        </div>
      </footer>
    `;
  }

  // Check if current page is the OpenClaw page
  isOpenClawPage() {
    return window.location.pathname.includes('openclaw');
  }

  // Detect base URL based on current page location
  getBaseUrl() {
    const path = window.location.pathname;

    // If we're in admin, user, tools, or blog subdirectories, go up one level
    if (path.includes('/admin/') || path.includes('/user/') || path.includes('/tools/') || path.includes('/blog/')) {
      return '../';
    }

    return './';
  }

  // Render navigation (insert at the beginning of body)
  renderNav() {
    const navWrapper = document.createElement('div');
    navWrapper.innerHTML = this.generateNav();
    
    // Insert ALL generated elements (nav AND mobile menu) at the beginning of body
    // We need to insert in reverse order since insertBefore keeps adding to the front
    const elementsToInsert = Array.from(navWrapper.children);
    
    // Insert the first element at the beginning of body
    if (elementsToInsert.length > 0) {
      document.body.insertBefore(elementsToInsert[0], document.body.firstChild);
    }
    
    // Insert subsequent elements after the previous one
    for (let i = 1; i < elementsToInsert.length; i++) {
      elementsToInsert[i - 1].after(elementsToInsert[i]);
    }

    // Handle mobile menu toggle
    this.setupMobileMenu();

    // Highlight current page
    this.highlightCurrentPage();
  }

  // Render footer (append at the end of body before closing tag)
  renderFooter() {
    const footer = document.createElement('div');
    footer.innerHTML = this.generateFooter();
    document.body.appendChild(footer);
  }

  // Setup mobile menu functionality
  setupMobileMenu() {
    // Use a more reliable approach to ensure DOM is ready
    const initializeMobileMenu = () => {
      const hamburger = document.getElementById('hamburger');
      const mobileMenu = document.getElementById('mobileMenu');
      const closeMenu = document.getElementById('closeMenu');

      if (!hamburger || !mobileMenu || !closeMenu) {
        console.error('Mobile menu elements not found', { hamburger, mobileMenu, closeMenu });
        return;
      }

      // Add click event listener to hamburger — toggles open/closed
      // (the hamburger stays visible above the menu overlay via high
      // z-index, so the same button must both open and close).
      hamburger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = mobileMenu.classList.toggle('active');
        document.body.style.overflow = isOpen ? 'hidden' : '';
        hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        hamburger.classList.toggle('is-open', isOpen);
      });

      // Shared close routine so every close path keeps the hamburger
      // icon, body overflow, and aria-expanded in sync.
      const closeMobileMenu = () => {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.classList.remove('is-open');
      };

      // Close button inside the mobile menu
      closeMenu.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeMobileMenu();
      });

      // Close when a menu link is tapped — let navigation proceed naturally
      mobileMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => closeMobileMenu());
      });

      // Close on any click outside both the menu and the hamburger
      document.addEventListener('click', (e) => {
        if (
          mobileMenu.classList.contains('active') &&
          !mobileMenu.contains(e.target) &&
          !hamburger.contains(e.target)
        ) {
          closeMobileMenu();
        }
      });

      // Close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
          closeMobileMenu();
        }
      });

      console.log('Mobile menu initialized successfully'); // Debug log
    };

    // Try to initialize immediately if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeMobileMenu);
    } else {
      initializeMobileMenu();
    }
  }

  // Highlight the current page in the nav
  highlightCurrentPage() {
    const currentPath = window.location.pathname;

    const homeLink = document.getElementById('homeLink');
    const aboutLink = document.getElementById('aboutLink');
    const toolsLink = document.getElementById('toolsLink');
    const blogLink = document.getElementById('blogLink');
    const aiResourcesLink = document.getElementById('aiResourcesLink');
    const openclawLink = document.getElementById('openclawLink');

    const highlightStyle = 'text-decoration: underline; text-decoration-thickness: 3px; text-decoration-color: var(--gold);';

    // Determine which link to highlight
    if (currentPath.includes('openclaw') || currentPath.includes('clawlauncher-explained')) {
      openclawLink.setAttribute('style', highlightStyle);
    } else if (currentPath.includes('about.html')) {
      aboutLink.setAttribute('style', highlightStyle);
    } else if (currentPath.includes('tools.html') || currentPath.includes('/tools/')) {
      toolsLink.setAttribute('style', highlightStyle);
    } else if (currentPath.includes('ai-resources.html')) {
      aiResourcesLink.setAttribute('style', highlightStyle);
    } else if (currentPath.includes('blog.html') || currentPath.includes('/blog/')) {
      blogLink.setAttribute('style', highlightStyle);
    } else if (currentPath === '/' || currentPath.includes('index.html')) {
      homeLink.setAttribute('style', highlightStyle);
    }
  }

  // Initialize both nav and footer
  init() {
    this.renderNav();
    this.renderFooter();
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const nav = new SiteNavigation();
  nav.init();
});
