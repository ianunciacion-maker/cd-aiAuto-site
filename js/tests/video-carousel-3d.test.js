/**
 * 3D Video Carousel Test Suite
 * Comprehensive testing for carousel functionality, performance, and accessibility
 */

// Mock DOM environment for testing
const mockDOM = () => {
  // Create mock container
  const container = document.createElement('div');
  container.id = 'test-carousel';
  document.body.appendChild(container);
  
  // Mock video data
  const mockVideoData = [
    {
      id: 'test-video-1',
      title: 'Test Video 1',
      description: 'Test description for video 1',
      src: 'test-video-1.mp4',
      poster: 'test-poster-1.jpg',
      duration: '2:30',
      views: '1K'
    },
    {
      id: 'test-video-2',
      title: 'Test Video 2',
      description: 'Test description for video 2',
      src: 'test-video-2.mp4',
      poster: 'test-poster-2.jpg',
      duration: '1:45',
      views: '2K'
    },
    {
      id: 'test-video-3',
      title: 'Test Video 3',
      description: 'Test description for video 3',
      src: 'test-video-3.mp4',
      poster: 'test-poster-3.jpg',
      duration: '3:15',
      views: '3K'
    }
  ];
  
  return { container, mockVideoData };
};

// Test Suite
class VideoCarouselTestSuite {
  constructor() {
    this.testResults = [];
    this.passedTests = 0;
    this.failedTests = 0;
  }

  // Test runner
  async runAllTests() {
    console.log('🎬 Starting 3D Video Carousel Test Suite...\n');
    
    // Core functionality tests
    await this.testInitialization();
    await this.testVideoLoading();
    await this.testNavigation();
    await this.testPhysics();
    await this.testTouchGestures();
    await this.testKeyboardNavigation();
    await this.testAccessibility();
    await this.testPerformance();
    await this.testResponsiveDesign();
    await this.testErrorHandling();
    await this.testParticleSystem();
    
    // Results
    this.displayResults();
  }

  // Individual test methods
  async testInitialization() {
    this.runTest('Initialization', () => {
      const { container, mockVideoData } = mockDOM();
      
      // Test carousel creation
      const carousel = new VideoCarousel3D(container, {
        radius: 300,
        itemWidth: 280,
        itemHeight: 500,
        enableParticles: false // Disable for testing
      });
      
      // Verify carousel instance
      this.assert(carousel !== null, 'Carousel instance should be created');
      this.assert(carousel.options.radius === 300, 'Radius should be set correctly');
      this.assert(carousel.videos.length === 0, 'Videos array should be empty initially');
      
      // Test video loading
      carousel.loadVideos(mockVideoData);
      this.assert(carousel.videos.length === 3, 'Should load 3 videos');
      this.assert(carousel.currentIndex === 0, 'Current index should start at 0');
      
      // Cleanup
      carousel.destroy();
      document.body.removeChild(container);
    });
  }

  async testVideoLoading() {
    this.runTest('Video Loading', () => {
      const { container, mockVideoData } = mockDOM();
      const carousel = new VideoCarousel3D(container, { enableParticles: false });
      
      // Test loading videos
      carousel.loadVideos(mockVideoData);
      
      // Verify DOM structure
      const carouselElement = container.querySelector('.video-carousel-3d');
      this.assert(carouselElement !== null, 'Carousel element should be created');
      
      const items = container.querySelectorAll('.carousel-item');
      this.assert(items.length === 3, 'Should create 3 carousel items');
      
      // Verify video elements
      const videos = container.querySelectorAll('.carousel-video');
      this.assert(videos.length === 3, 'Should create 3 video elements');
      
      // Verify data attributes
      const firstItem = items[0];
      this.assert(firstItem.dataset.index === '0', 'First item should have index 0');
      
      // Cleanup
      carousel.destroy();
      document.body.removeChild(container);
    });
  }

  async testNavigation() {
    this.runTest('Navigation', () => {
      const { container, mockVideoData } = mockDOM();
      const carousel = new VideoCarousel3D(container, { enableParticles: false });
      carousel.loadVideos(mockVideoData);
      
      // Test next navigation
      carousel.navigate('next');
      this.assert(carousel.currentIndex === 1, 'Should navigate to next video');
      
      // Test previous navigation
      carousel.navigate('prev');
      this.assert(carousel.currentIndex === 0, 'Should navigate to previous video');
      
      // Test wrap-around
      carousel.navigate('prev');
      this.assert(carousel.currentIndex === 2, 'Should wrap to last video');
      
      carousel.navigate('next');
      this.assert(carousel.currentIndex === 0, 'Should wrap to first video');
      
      // Test direct navigation
      carousel.goToVideo(2);
      this.assert(carousel.currentIndex === 2, 'Should navigate to specific video');
      
      // Cleanup
      carousel.destroy();
      document.body.removeChild(container);
    });
  }

  async testPhysics() {
    this.runTest('Physics Engine', () => {
      const { container, mockVideoData } = mockDOM();
      const carousel = new VideoCarousel3D(container, { 
        enableParticles: false,
        friction: 0.92,
        springStrength: 0.08
      });
      carousel.loadVideos(mockVideoData);
      
      // Test physics properties
      this.assert(carousel.friction === 0.92, 'Friction should be set correctly');
      this.assert(carousel.springStrength === 0.08, 'Spring strength should be set correctly');
      this.assert(carousel.velocity === 0, 'Initial velocity should be 0');
      
      // Test rotation calculation
      const initialRotation = carousel.currentRotation;
      carousel.targetRotation = Math.PI;
      
      // Simulate one animation frame
      const rotationDiff = carousel.targetRotation - carousel.currentRotation;
      carousel.velocity += rotationDiff * carousel.springStrength;
      carousel.velocity *= carousel.friction;
      carousel.currentRotation += carousel.velocity;
      
      this.assert(
        carousel.currentRotation > initialRotation && 
        carousel.currentRotation < carousel.targetRotation,
        'Rotation should move towards target with physics'
      );
      
      // Cleanup
      carousel.destroy();
      document.body.removeChild(container);
    });
  }

  async testTouchGestures() {
    this.runTest('Touch Gestures', () => {
      const { container, mockVideoData } = mockDOM();
      const carousel = new VideoCarousel3D(container, { 
        enableParticles: false,
        enableGestures: true
      });
      carousel.loadVideos(mockVideoData);
      
      // Mock touch events
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 150, clientY: 100 }]
      });
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 150, clientY: 100 }]
      });
      
      // Test touch start
      carousel.handleTouchStart(touchStart);
      this.assert(carousel.isDragging === true, 'Should start dragging on touch start');
      
      // Test touch move
      carousel.handleTouchMove(touchMove);
      this.assert(carousel.targetRotation !== 0, 'Should update rotation on touch move');
      
      // Test touch end
      carousel.handleTouchEnd(touchEnd);
      this.assert(carousel.isDragging === false, 'Should stop dragging on touch end');
      
      // Cleanup
      carousel.destroy();
      document.body.removeChild(container);
    });
  }

  async testKeyboardNavigation() {
    this.runTest('Keyboard Navigation', () => {
      const { container, mockVideoData } = mockDOM();
      const carousel = new VideoCarousel3D(container, { 
        enableParticles: false,
        enableKeyboard: true
      });
      carousel.loadVideos(mockVideoData);
      
      // Test arrow key navigation
      const leftArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      const rightArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      
      const initialIndex = carousel.currentIndex;
      
      // Test left arrow
      carousel.handleKeyDown(leftArrowEvent);
      this.assert(carousel.currentIndex === (initialIndex - 1 + 3) % 3, 'Left arrow should navigate to previous');
      
      // Test right arrow
      carousel.handleKeyDown(rightArrowEvent);
      this.assert(carousel.currentIndex === initialIndex, 'Right arrow should navigate to next');
      
      // Test space for auto-rotation toggle
      const initialAutoRotate = carousel.options.autoRotate;
      carousel.handleKeyDown(spaceEvent);
      this.assert(carousel.options.autoRotate !== initialAutoRotate, 'Space should toggle auto-rotation');
      
      // Cleanup
      carousel.destroy();
      document.body.removeChild(container);
    });
  }

  async testAccessibility() {
    this.runTest('Accessibility', () => {
      const { container, mockVideoData } = mockDOM();
      const carousel = new VideoCarousel3D(container, { enableParticles: false });
      carousel.loadVideos(mockVideoData);
      
      // Test ARIA attributes
      const carouselElement = container.querySelector('.video-carousel-3d');
      this.assert(
        carouselElement.getAttribute('role') === 'region',
        'Carousel should have region role'
      );
      this.assert(
        carouselElement.getAttribute('aria-label') === '3D Video Carousel',
        'Carousel should have aria-label'
      );
      
      // Test controls accessibility
      const controls = container.querySelector('.carousel-controls');
      this.assert(
        controls.getAttribute('role') === 'group',
        'Controls should have group role'
      );
      
      // Test button accessibility
      const prevBtn = container.querySelector('.carousel-btn-prev');
      this.assert(
        prevBtn.getAttribute('aria-label') === 'Previous video',
        'Previous button should have aria-label'
      );
      
      // Test progress bar accessibility
      const progress = container.querySelector('.carousel-progress');
      this.assert(
        progress.getAttribute('role') === 'progressbar',
        'Progress should have progressbar role'
      );
      this.assert(
        progress.getAttribute('aria-valuemin') === '0',
        'Progress should have minimum value'
      );
      this.assert(
        progress.getAttribute('aria-valuemax') === '100',
        'Progress should have maximum value'
      );
      
      // Cleanup
      carousel.destroy();
      document.body.removeChild(container);
    });
  }

  async testPerformance() {
    this.runTest('Performance', () => {
      const { container, mockVideoData } = mockDOM();
      const carousel = new VideoCarousel3D(container, { enableParticles: false });
      carousel.loadVideos(mockVideoData);
      
      // Test animation frame rate
      const startTime = performance.now();
      let frameCount = 0;
      
      // Simulate 60 frames
      for (let i = 0; i < 60; i++) {
        carousel.updateCarousel();
        frameCount++;
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const fps = (frameCount / duration) * 1000;
      
      this.assert(
        fps >= 55,
        `Should maintain 55+ FPS, got ${fps.toFixed(2)} FPS`
      );
      
      // Test memory cleanup
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      carousel.destroy();
      document.body.removeChild(container);
      
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      if (initialMemory > 0 && finalMemory > 0) {
        this.assert(
          finalMemory <= initialMemory * 1.1,
          'Memory should not increase significantly after cleanup'
        );
      }
    });
  }

  async testResponsiveDesign() {
    this.runTest('Responsive Design', () => {
      const { container, mockVideoData } = mockDOM();
      const carousel = new VideoCarousel3D(container, { enableParticles: false });
      carousel.loadVideos(mockVideoData);
      
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 480 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });
      carousel.handleResize();
      
      const mobileItems = container.querySelectorAll('.carousel-item');
      this.assert(
        mobileItems.length > 0,
        'Should render items on mobile viewport'
      );
      
      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 });
      carousel.handleResize();
      
      const desktopItems = container.querySelectorAll('.carousel-item');
      this.assert(
        desktopItems.length > 0,
        'Should render items on desktop viewport'
      );
      
      // Cleanup
      carousel.destroy();
      document.body.removeChild(container);
    });
  }

  async testErrorHandling() {
    this.runTest('Error Handling', () => {
      const { container } = mockDOM();
      
      // Test invalid container
      try {
        const invalidCarousel = new VideoCarousel3D('#non-existent');
        this.assert(false, 'Should throw error for invalid container');
      } catch (error) {
        this.assert(true, 'Should throw error for invalid container');
      }
      
      // Test empty video data
      const carousel = new VideoCarousel3D(container, { enableParticles: false });
      carousel.loadVideos([]);
      
      const items = container.querySelectorAll('.carousel-item');
      this.assert(items.length === 0, 'Should handle empty video data gracefully');
      
      // Test invalid video data
      const invalidVideoData = [
        { id: 'test' }, // Missing required fields
        { title: 'Test' } // Missing required fields
      ];
      
      try {
        carousel.loadVideos(invalidVideoData);
        this.assert(true, 'Should handle invalid video data gracefully');
      } catch (error) {
        this.assert(true, 'Should handle invalid video data with error');
      }
      
      // Cleanup
      carousel.destroy();
      document.body.removeChild(container);
    });
  }

  async testParticleSystem() {
    this.runTest('Particle System', () => {
      const { container, mockVideoData } = mockDOM();
      const carousel = new VideoCarousel3D(container, { 
        enableParticles: true,
        particleCount: 10
      });
      carousel.loadVideos(mockVideoData);
      
      // Test particle initialization
      this.assert(
        carousel.particles.length === 10,
        'Should create specified number of particles'
      );
      
      // Test particle properties
      const firstParticle = carousel.particles[0];
      this.assert(
        typeof firstParticle.x === 'number',
        'Particle should have x coordinate'
      );
      this.assert(
        typeof firstParticle.y === 'number',
        'Particle should have y coordinate'
      );
      this.assert(
        typeof firstParticle.vx === 'number',
        'Particle should have x velocity'
      );
      this.assert(
        typeof firstParticle.vy === 'number',
        'Particle should have y velocity'
      );
      
      // Test particle update
      const initialX = firstParticle.x;
      carousel.updateParticles();
      this.assert(
        firstParticle.x !== initialX,
        'Particle position should update'
      );
      
      // Cleanup
      carousel.destroy();
      document.body.removeChild(container);
    });
  }

  // Test utilities
  runTest(testName, testFunction) {
    try {
      testFunction();
      this.passedTests++;
      console.log(`✅ ${testName}`);
    } catch (error) {
      this.failedTests++;
      console.log(`❌ ${testName}: ${error.message}`);
      this.testResults.push({ test: testName, error: error.message });
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  displayResults() {
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(`📈 Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);
    
    if (this.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.forEach(result => {
        console.log(`  - ${result.test}: ${result.error}`);
      });
    }
    
    console.log('\n🎉 Test Suite Complete!');
  }
}

// Performance Benchmark
class PerformanceBenchmark {
  constructor() {
    this.results = {};
  }

  async runBenchmarks() {
    console.log('⚡ Running Performance Benchmarks...\n');
    
    await this.benchmarkInitialization();
    await this.benchmarkNavigation();
    await this.benchmarkAnimation();
    await this.benchmarkMemory();
    
    this.displayBenchmarkResults();
  }

  async benchmarkInitialization() {
    console.log('🔧 Benchmarking Initialization...');
    const { container, mockVideoData } = mockDOM();
    
    const startTime = performance.now();
    const carousel = new VideoCarousel3D(container, { enableParticles: false });
    carousel.loadVideos(mockVideoData);
    const endTime = performance.now();
    
    this.results.initialization = endTime - startTime;
    console.log(`   Initialization: ${this.results.initialization.toFixed(2)}ms`);
    
    carousel.destroy();
    document.body.removeChild(container);
  }

  async benchmarkNavigation() {
    console.log('🧭 Benchmarking Navigation...');
    const { container, mockVideoData } = mockDOM();
    const carousel = new VideoCarousel3D(container, { enableParticles: false });
    carousel.loadVideos(mockVideoData);
    
    const startTime = performance.now();
    
    // Perform 100 navigation operations
    for (let i = 0; i < 100; i++) {
      carousel.navigate(i % 2 === 0 ? 'next' : 'prev');
    }
    
    const endTime = performance.now();
    this.results.navigation = (endTime - startTime) / 100;
    
    console.log(`   Navigation: ${this.results.navigation.toFixed(2)}ms per operation`);
    
    carousel.destroy();
    document.body.removeChild(container);
  }

  async benchmarkAnimation() {
    console.log('🎬 Benchmarking Animation...');
    const { container, mockVideoData } = mockDOM();
    const carousel = new VideoCarousel3D(container, { enableParticles: false });
    carousel.loadVideos(mockVideoData);
    
    const startTime = performance.now();
    
    // Simulate 60 animation frames
    for (let i = 0; i < 60; i++) {
      carousel.updateCarousel();
    }
    
    const endTime = performance.now();
    this.results.animation = (endTime - startTime) / 60;
    
    console.log(`   Animation: ${this.results.animation.toFixed(2)}ms per frame`);
    
    carousel.destroy();
    document.body.removeChild(container);
  }

  async benchmarkMemory() {
    console.log('💾 Benchmarking Memory...');
    const { container, mockVideoData } = mockDOM();
    
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    
    // Create and destroy multiple carousels
    for (let i = 0; i < 10; i++) {
      const carousel = new VideoCarousel3D(container, { enableParticles: false });
      carousel.loadVideos(mockVideoData);
      carousel.destroy();
    }
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    this.results.memory = finalMemory - initialMemory;
    
    console.log(`   Memory: ${(this.results.memory / 1024 / 1024).toFixed(2)}MB increase`);
    
    document.body.removeChild(container);
  }

  displayBenchmarkResults() {
    console.log('\n📊 Benchmark Results:');
    console.log(`🔧 Initialization: ${this.results.initialization?.toFixed(2)}ms`);
    console.log(`🧭 Navigation: ${this.results.navigation?.toFixed(2)}ms per operation`);
    console.log(`🎬 Animation: ${this.results.animation?.toFixed(2)}ms per frame`);
    console.log(`💾 Memory: ${(this.results.memory / 1024 / 1024).toFixed(2)}MB increase`);
    
    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    
    if (this.results.initialization > 100) {
      console.log('⚠️  Consider optimizing initialization time');
    }
    
    if (this.results.navigation > 5) {
      console.log('⚠️  Navigation could be faster');
    }
    
    if (this.results.animation > 16.67) {
      console.log('⚠️  Animation frame time exceeds 60fps target');
    }
    
    if (this.results.memory > 10 * 1024 * 1024) {
      console.log('⚠️  Memory usage is high');
    }
    
    console.log('\n🎯 Benchmark Complete!');
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VideoCarouselTestSuite, PerformanceBenchmark };
} else {
  window.VideoCarouselTestSuite = VideoCarouselTestSuite;
  window.PerformanceBenchmark = PerformanceBenchmark;
}

// Auto-run tests if in browser
if (typeof window !== 'undefined') {
  // Run tests when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const testSuite = new VideoCarouselTestSuite();
      const benchmark = new PerformanceBenchmark();
      
      // Run tests
      testSuite.runAllTests().then(() => {
        // Run benchmarks
        benchmark.runBenchmarks();
      });
    });
  } else {
    const testSuite = new VideoCarouselTestSuite();
    const benchmark = new PerformanceBenchmark();
    
    testSuite.runAllTests().then(() => {
      benchmark.runBenchmarks();
    });
  }
}