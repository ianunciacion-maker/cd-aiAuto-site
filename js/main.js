/**
 * Ai-Auto Main JavaScript File
 * Handles all client-side functionality and interactions
 */

// Import modules
import { Navigation } from './components/navigation.js';
import { ThemeManager } from './modules/theme.js';
import { AnimationController } from './modules/animations.js';
import { FormHandler } from './components/forms.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize components
  const navigation = new Navigation();
  const themeManager = new ThemeManager();
  const animationController = new AnimationController();
  const formHandler = new FormHandler();

  // Global error handling
  window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
    // In production, you might want to send this to an error tracking service
  });

  // Performance monitoring
  if ('performance' in window) {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
    });
  }

  // Initialize analytics (placeholder)
  if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href
    });
  }
});

// Export for potential use in other modules
export { navigation, themeManager, animationController, formHandler };