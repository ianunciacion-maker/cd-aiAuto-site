/**
 * Ai-Auto Main JavaScript File
 * Handles all client-side functionality and interactions
 */

// Import modules
import { Navigation } from './components/navigation.js';
import { ThemeManager } from './modules/theme.js';
import { AnimationController } from './modules/animations.js';
import { FormHandler } from './components/forms.js';
import './modules/social-captions-history.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize components
  new Navigation();
  new ThemeManager();
  new AnimationController();
  new FormHandler();

  // Global error handling
  window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
  });

  // Performance monitoring
  if ('performance' in window) {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
    });
  }
});