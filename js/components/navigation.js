/**
 * Navigation Component
 * Handles mobile menu toggle, scroll effects, and navigation interactions
 */

export class Navigation {
  constructor() {
    this.hamburger = null;
    this.mobileMenu = null;
    this.closeMenu = null;
    this.nav = null;
    this.isMenuOpen = false;
    this.lastScrollY = 0;
    
    this.init();
  }

  init() {
    // Get DOM elements
    this.hamburger = document.getElementById('hamburger');
    this.mobileMenu = document.getElementById('mobileMenu');
    this.closeMenu = document.getElementById('closeMenu');
    this.nav = document.querySelector('.nav');

    if (!this.hamburger || !this.mobileMenu) {
      console.warn('Navigation elements not found');
      return;
    }

    this.bindEvents();
    this.initScrollEffects();
  }

  bindEvents() {
    // Mobile menu toggle
    this.hamburger?.addEventListener('click', () => this.openMenu());
    this.closeMenu?.addEventListener('click', () => this.closeMobileMenu());

    // Close menu when clicking on links
    const mobileLinks = this.mobileMenu?.querySelectorAll('.mobile-menu-link');
    mobileLinks?.forEach(link => {
      link.addEventListener('click', () => this.closeMobileMenu());
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMobileMenu();
      }
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (this.isMenuOpen && !this.mobileMenu.contains(e.target) && !this.hamburger.contains(e.target)) {
        this.closeMobileMenu();
      }
    });
  }

  openMenu() {
    this.isMenuOpen = true;
    this.mobileMenu.classList.add('active');
    this.hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus management for accessibility
    const firstFocusable = this.mobileMenu.querySelector('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    firstFocusable?.focus();
  }

  closeMobileMenu() {
    this.isMenuOpen = false;
    this.mobileMenu.classList.remove('active');
    this.hamburger.classList.remove('active');
    document.body.style.overflow = '';
    
    // Return focus to hamburger button
    this.hamburger.focus();
  }

  initScrollEffects() {
    if (!this.nav) return;

    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      
      // Add/remove scrolled class for shadow effect
      if (currentScrollY > 10) {
        this.nav.classList.add('scrolled');
      } else {
        this.nav.classList.remove('scrolled');
      }

      // Hide/show nav on scroll (optional enhancement)
      if (currentScrollY > this.lastScrollY && currentScrollY > 100) {
        this.nav.style.transform = 'translateY(-100%)';
      } else {
        this.nav.style.transform = 'translateY(0)';
      }

      this.lastScrollY = currentScrollY;
    }, { passive: true });
  }

  // Public method to update navigation state
  updateActiveLink(currentPath) {
    const navLinks = document.querySelectorAll('.nav-link, .mobile-menu-link');
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
      }
    });
  }

  // Cleanup method
  destroy() {
    this.hamburger?.removeEventListener('click', this.openMenu);
    this.closeMenu?.removeEventListener('click', this.closeMobileMenu);
    document.removeEventListener('keydown', this.handleEscape);
    document.removeEventListener('click', this.handleOutsideClick);
    window.removeEventListener('scroll', this.handleScroll);
  }
}