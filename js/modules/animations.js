/**
 * Animation Controller Module
 * Handles scroll animations, intersection observers, and micro-interactions
 */

export class AnimationController {
  constructor() {
    this.observedElements = new Set();
    this.animationOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    this.init();
  }

  init() {
    // Initialize Intersection Observer for scroll animations
    this.initIntersectionObserver();
    
    // Initialize hover effects
    this.initHoverEffects();
    
    // Initialize parallax effects
    this.initParallax();
    
    // Initialize floating animations
    this.initFloatingAnimations();
  }

  initIntersectionObserver() {
    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
      this.fallbackAnimations();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, this.animationOptions);

    // Observe elements with animation classes
    this.observeAnimatedElements(observer);
  }

  observeAnimatedElements(observer) {
    const animatedElements = document.querySelectorAll([
      '.fade-in-up',
      '.fade-in-left',
      '.fade-in-right',
      '.slide-in-left',
      '.slide-in-right',
      '.scale-in'
    ].join(', '));

    animatedElements.forEach(element => {
      if (!this.observedElements.has(element)) {
        observer.observe(element);
        this.observedElements.add(element);
        
        // Set initial state
        element.style.opacity = '0';
        element.style.transform = this.getInitialTransform(element);
      }
    });
  }

  getInitialTransform(element) {
    const classList = element.classList;
    
    if (classList.contains('fade-in-up')) return 'translateY(30px)';
    if (classList.contains('fade-in-left')) return 'translateX(-30px)';
    if (classList.contains('fade-in-right')) return 'translateX(30px)';
    if (classList.contains('slide-in-left')) return 'translateX(-100%)';
    if (classList.contains('slide-in-right')) return 'translateX(100%)';
    if (classList.contains('scale-in')) return 'scale(0.8)';
    
    return 'none';
  }

  animateElement(element) {
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    element.style.opacity = '1';
    element.style.transform = 'translate(0, 0) scale(1)';
    
    // Add animation complete class
    element.classList.add('animated');
  }

  initHoverEffects() {
    // Enhanced button hover effects
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', (e) => this.handleButtonHover(e, 'enter'));
      button.addEventListener('mouseleave', (e) => this.handleButtonHover(e, 'leave'));
      button.addEventListener('mousemove', (e) => this.handleButtonMouseMove(e));
    });

    // Card hover effects
    const cards = document.querySelectorAll('.card, .tool-card, .feature-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => this.handleCardHover(card, true));
      card.addEventListener('mouseleave', () => this.handleCardHover(card, false));
    });
  }

  handleButtonHover(e, state) {
    const button = e.currentTarget;
    const ripple = this.createRipple(e);
    
    if (state === 'enter') {
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }
  }

  handleButtonMouseMove(e) {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    button.style.setProperty('--mouse-x', `${x}px`);
    button.style.setProperty('--mouse-y', `${y}px`);
  }

  createRipple(e) {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    
    ripple.className = 'ripple';
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    
    return ripple;
  }

  handleCardHover(card, isHovering) {
    if (isHovering) {
      card.style.transform = 'translateY(-8px) rotate(-1deg)';
      card.style.boxShadow = '12px 12px 0 var(--ink)';
    } else {
      card.style.transform = '';
      card.style.boxShadow = '';
    }
  }

  initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      parallaxElements.forEach(element => {
        const speed = element.dataset.parallax || 0.5;
        const yPos = -(scrollY * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  initFloatingAnimations() {
    const floatingElements = document.querySelectorAll('[data-float]');
    
    floatingElements.forEach((element, index) => {
      const delay = index * 0.5;
      element.style.animation = `float 6s ease-in-out ${delay}s infinite`;
    });
  }

  fallbackAnimations() {
    // Fallback for browsers without Intersection Observer
    const animatedElements = document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right');
    
    const showElements = () => {
      animatedElements.forEach(element => {
        element.style.opacity = '1';
        element.style.transform = 'translate(0, 0)';
      });
    };

    // Show elements immediately for older browsers
    setTimeout(showElements, 100);
  }

  // Public method to animate new elements
  observeNewElements(elements) {
    if (!('IntersectionObserver' in window)) {
      elements.forEach(element => {
        element.style.opacity = '1';
        element.style.transform = 'translate(0, 0)';
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, this.animationOptions);

    elements.forEach(element => {
      if (!this.observedElements.has(element)) {
        observer.observe(element);
        this.observedElements.add(element);
        
        element.style.opacity = '0';
        element.style.transform = this.getInitialTransform(element);
      }
    });
  }

  // Cleanup method
  destroy() {
    this.observedElements.clear();
    // Remove event listeners and clean up animations
  }
}

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transform: scale(0);
    animation: ripple 0.6s linear;
    pointer-events: none;
  }
  
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
`;
document.head.appendChild(style);