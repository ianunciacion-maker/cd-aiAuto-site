/**
 * Theme Manager Module
 * Handles dark/light theme switching and persistence
 */

export class ThemeManager {
  constructor() {
    this.themeToggle = null;
    this.currentTheme = 'light';
    this.storageKey = 'ai-auto-theme';
    
    this.init();
  }

  init() {
    // Get theme toggle button
    this.themeToggle = document.getElementById('themeToggle');
    
    // Load saved theme or detect system preference
    this.loadTheme();
    
    // Apply theme immediately
    this.applyTheme(this.currentTheme);
    
    // Bind events
    this.bindEvents();
  }

  loadTheme() {
    // Check localStorage first
    const savedTheme = localStorage.getItem(this.storageKey);
    
    if (savedTheme) {
      this.currentTheme = savedTheme;
    } else {
      // Detect system preference
      this.currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  }

  bindEvents() {
    // Theme toggle button
    this.themeToggle?.addEventListener('click', () => this.toggleTheme());
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.storageKey)) {
        this.currentTheme = e.matches ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
      }
    });

    // Keyboard shortcut for theme toggle (Ctrl/Cmd + Shift + T)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    this.saveTheme();
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme: this.currentTheme }
    }));
  }

  applyTheme(theme) {
    const html = document.documentElement;
    
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }

    // Update toggle button text/icon
    this.updateToggleUI();
    
    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme);
  }

  updateToggleUI() {
    if (!this.themeToggle) return;

    const isDark = this.currentTheme === 'dark';
    const icon = this.themeToggle.querySelector('.theme-icon');
    const text = this.themeToggle.querySelector('.theme-text');
    
    if (icon) {
      icon.textContent = isDark ? '☀️' : '🌙';
      icon.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    
    if (text) {
      text.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    }

    // Update button aria-label
    this.themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  updateMetaThemeColor(theme) {
    let themeColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
    
    // Update existing meta tag or create new one
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = themeColor;
  }

  saveTheme() {
    localStorage.setItem(this.storageKey, this.currentTheme);
  }

  // Public method to get current theme
  getCurrentTheme() {
    return this.currentTheme;
  }

  // Public method to set theme programmatically
  setTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      this.currentTheme = theme;
      this.applyTheme(theme);
      this.saveTheme();
    }
  }

  // Cleanup method
  destroy() {
    this.themeToggle?.removeEventListener('click', this.toggleTheme);
  }
}