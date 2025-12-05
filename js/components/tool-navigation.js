// Tool Pages Navigation Component
// Extends main navigation with tool-specific features

class ToolNavigation {
  constructor() {
    this.navContainer = null;
    this.footerContainer = null;
    this.currentTool = this.getCurrentToolName();
  }

  // Get current tool name from URL path
  getCurrentToolName() {
    const path = window.location.pathname;
    if (path.includes('/blog-generator')) return 'Blog Generator';
    if (path.includes('/social-captions')) return 'Social Captions';
    if (path.includes('/email-campaigns')) return 'Email Campaigns';
    if (path.includes('/product-descriptions')) return 'Product Descriptions';
    return 'Tool';
  }

  // Generate navigation HTML with tool context
  generateNav() {
    return `
      <nav class="nav">
        <div class="container nav-inner">
          <a href="${this.getBaseUrl()}index.html" class="logo">Ai-Auto</a>
          <div class="nav-links">
            <a href="${this.getBaseUrl()}index.html" class="nav-link" id="homeLink">Home</a>
            <a href="${this.getBaseUrl()}about.html" class="nav-link" id="aboutLink">About</a>
            <a href="${this.getBaseUrl()}tools.html" class="nav-link" id="toolsLink">Tools</a>
            <a href="${this.getBaseUrl()}blog.html" class="nav-link" id="blogLink">Blog</a>
          </div>
          <div style="display: flex; gap: 12px; align-items: center;">
            <a href="${this.getBaseUrl()}user/dashboard.html" class="nav-link" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink);">Dashboard</a>
            <a href="${this.getBaseUrl()}user/login.html" class="btn btn-gold">Get Started</a>
          </div>
          <button class="hamburger" id="hamburger" aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

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
          <a href="${this.getBaseUrl()}about.html" class="mobile-menu-link">About</a>
          <a href="${this.getBaseUrl()}tools.html" class="mobile-menu-link">Tools</a>
          <a href="${this.getBaseUrl()}blog.html" class="mobile-menu-link">Blog</a>
          <a href="${this.getBaseUrl()}user/dashboard.html" class="mobile-menu-link">Dashboard</a>
          <a href="${this.getBaseUrl()}user/login.html" class="btn btn-gold" style="width: 100%; margin-top: 16px;">Get Started</a>
        </div>
      </div>
    `;
  }

  // Generate footer HTML
  generateFooter() {
    return `
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

  // Detect base URL based on current page location
  getBaseUrl() {
    const path = window.location.pathname;

    // If we're in admin, user, tools, or blog subdirectories, go up one level
    if (path.includes('/admin/') || path.includes('/user/') || path.includes('/tools/') || path.includes('/blog/')) {
      return '../';
    }

    return './';
  }

  // Render navigation (insert at beginning of body)
  renderNav() {
    const nav = document.createElement('div');
    nav.innerHTML = this.generateNav();
    document.body.insertBefore(nav.firstElementChild, document.body.firstChild);

    // Handle mobile menu toggle
    this.setupMobileMenu();

    // Highlight current page
    this.highlightCurrentPage();
  }

  // Render footer (append at the end of body before closing tag)
  renderFooter() {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.generateFooter();
    // Extract the footer element from the temp div and append it directly
    const footerElement = tempDiv.firstElementChild;
    document.body.appendChild(footerElement);
  }

  // Setup mobile menu functionality
  setupMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMenu = document.getElementById('closeMenu');

    if (!hamburger || !mobileMenu || !closeMenu) return;

    hamburger.addEventListener('click', () => {
      mobileMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    closeMenu.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    });

    // Close menu when clicking on a link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // Highlight current page in nav
  highlightCurrentPage() {
    const currentPath = window.location.pathname;

    const homeLink = document.getElementById('homeLink');
    const aboutLink = document.getElementById('aboutLink');
    const toolsLink = document.getElementById('toolsLink');
    const blogLink = document.getElementById('blogLink');

    const highlightStyle = 'text-decoration: underline; text-decoration-thickness: 3px; text-decoration-color: var(--gold);';

    // Determine which link to highlight
    if (currentPath.includes('about.html')) {
      aboutLink.setAttribute('style', highlightStyle);
    } else if (currentPath.includes('tools.html') || currentPath.includes('/tools/')) {
      toolsLink.setAttribute('style', highlightStyle);
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
  const nav = new ToolNavigation();
  nav.init();
});