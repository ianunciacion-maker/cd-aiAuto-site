/**
 * Immersive 3D Video Carousel System
 * Implements circular carousel with momentum physics and 3D perspective effects
 */

class VideoCarousel3D {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = {
      radius: 300, // Circular radius in pixels
      itemWidth: 280,
      itemHeight: 500,
      perspective: 1200,
      friction: 0.92,
      springStrength: 0.08,
      autoRotate: false,
      autoRotateSpeed: 0.5,
      visibleItems: 7,
      enableGestures: true,
      enableKeyboard: true,
      enableParticles: true,
      particleCount: 50,
      ...options
    };

    this.videos = [];
    this.currentIndex = 0;
    this.targetRotation = 0;
    this.currentRotation = 0;
    this.velocity = 0;
    this.isAnimating = false;
    this.isDragging = false;
    this.dragStartX = 0;
    this.lastDragX = 0;
    this.particles = [];
    this.animationId = null;
    this.touchStartX = 0;
    this.touchStartTime = 0;

    this.init();
  }

  init() {
    this.createStructure();
    this.bindEvents();
    this.initParticles();
    this.startAnimation();
  }

  createStructure() {
    // Create carousel container
    this.carouselElement = document.createElement('div');
    this.carouselElement.className = 'video-carousel-3d';
    this.carouselElement.setAttribute('role', 'region');
    this.carouselElement.setAttribute('aria-label', '3D Video Carousel');

    // Create viewport for 3D perspective
    this.viewport = document.createElement('div');
    this.viewport.className = 'carousel-viewport';
    
    // Create carousel stage
    this.stage = document.createElement('div');
    this.stage.className = 'carousel-stage';

    // Create particle canvas
    if (this.options.enableParticles) {
      this.particleCanvas = document.createElement('canvas');
      this.particleCanvas.className = 'carousel-particles';
      this.particleCanvas.width = window.innerWidth;
      this.particleCanvas.height = window.innerHeight;
      this.particleCtx = this.particleCanvas.getContext('2d');
    }

    // Create controls
    this.controls = this.createControls();

    // Assemble structure
    this.stage.appendChild(this.carouselElement);
    this.viewport.appendChild(this.stage);
    this.container.innerHTML = '';
    this.container.appendChild(this.viewport);
    
    if (this.options.enableParticles) {
      this.container.appendChild(this.particleCanvas);
    }
    
    this.container.appendChild(this.controls);

    // Apply 3D perspective
    this.viewport.style.perspective = `${this.options.perspective}px`;
    this.stage.style.transformStyle = 'preserve-3d';
  }

  createControls() {
    const controls = document.createElement('div');
    controls.className = 'carousel-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Carousel controls');

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'carousel-btn carousel-btn-prev';
    prevBtn.innerHTML = '←';
    prevBtn.setAttribute('aria-label', 'Previous video');
    prevBtn.addEventListener('click', () => this.navigate('prev'));

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'carousel-btn carousel-btn-next';
    nextBtn.innerHTML = '→';
    nextBtn.setAttribute('aria-label', 'Next video');
    nextBtn.addEventListener('click', () => this.navigate('next'));

    // Play/Pause button
    const playPauseBtn = document.createElement('button');
    playPauseBtn.className = 'carousel-btn carousel-btn-play';
    playPauseBtn.innerHTML = '▶';
    playPauseBtn.setAttribute('aria-label', 'Play/Pause auto-rotation');
    playPauseBtn.addEventListener('click', () => this.toggleAutoRotate());

    // Progress indicator
    const progress = document.createElement('div');
    progress.className = 'carousel-progress';
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', '100');
    progress.setAttribute('aria-valuenow', '0');

    const progressBar = document.createElement('div');
    progressBar.className = 'carousel-progress-bar';
    progress.appendChild(progressBar);

    controls.appendChild(prevBtn);
    controls.appendChild(progress);
    controls.appendChild(nextBtn);
    controls.appendChild(playPauseBtn);

    this.progressBar = progressBar;
    this.playPauseBtn = playPauseBtn;

    return controls;
  }

  loadVideos(videoData) {
    this.videos = videoData;
    this.renderVideos();
    this.updateCarousel();
  }

  renderVideos() {
    this.carouselElement.innerHTML = '';

    this.videos.forEach((video, index) => {
      const item = document.createElement('div');
      item.className = 'carousel-item';
      item.setAttribute('data-index', index);
      item.setAttribute('role', 'article');
      item.setAttribute('aria-label', `Video: ${video.title}`);

      // Video container
      const videoContainer = document.createElement('div');
      videoContainer.className = 'video-container';

      // Video element
      const videoEl = document.createElement('video');
      videoEl.className = 'carousel-video';
      videoEl.src = video.src;
      videoEl.poster = video.poster || '';
      videoEl.muted = true;
      videoEl.loop = true;
      videoEl.playsInline = true;
      videoEl.setAttribute('preload', 'metadata');

      // Video overlay
      const overlay = document.createElement('div');
      overlay.className = 'video-overlay';

      // Title
      const title = document.createElement('h3');
      title.className = 'video-title';
      title.textContent = video.title;

      // Description
      const description = document.createElement('p');
      description.className = 'video-description';
      description.textContent = video.description || '';

      // Play button overlay
      const playBtn = document.createElement('button');
      playBtn.className = 'video-play-btn';
      playBtn.innerHTML = '▶';
      playBtn.setAttribute('aria-label', `Play ${video.title}`);

      overlay.appendChild(title);
      overlay.appendChild(description);
      overlay.appendChild(playBtn);

      videoContainer.appendChild(videoEl);
      videoContainer.appendChild(overlay);
      item.appendChild(videoContainer);

      // Click handler
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.video-play-btn')) {
          this.goToVideo(index);
        }
      });

      // Play button handler
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playVideo(index);
      });

      this.carouselElement.appendChild(item);
    });
  }

  updateCarousel() {
    const angleStep = (2 * Math.PI) / this.videos.length;
    
    this.videos.forEach((video, index) => {
      const item = this.carouselElement.children[index];
      const angle = angleStep * index + this.currentRotation;
      
      // Calculate 3D position
      const x = Math.sin(angle) * this.options.radius;
      const z = Math.cos(angle) * this.options.radius;
      
      // Apply 3D transforms
      item.style.transform = `
        translateX(${x}px)
        translateZ(${z}px)
        rotateY(${-angle}rad)
      `;
      
      // Update opacity based on Z position
      const opacity = (z + this.options.radius) / (2 * this.options.radius);
      item.style.opacity = 0.4 + (opacity * 0.6);
      
      // Update z-index based on Z position
      item.style.zIndex = Math.floor(z + this.options.radius);
      
      // Add active class to center item
      const isActive = Math.abs(index - this.currentIndex) < 0.5;
      item.classList.toggle('active', isActive);
    });

    // Update progress bar
    this.updateProgress();
  }

  navigate(direction) {
    const delta = direction === 'next' ? 1 : -1;
    this.currentIndex = (this.currentIndex + delta + this.videos.length) % this.videos.length;
    this.targetRotation = -(this.currentIndex * (2 * Math.PI) / this.videos.length);
    this.velocity = 0;
  }

  goToVideo(index) {
    if (index === this.currentIndex) return;
    
    const diff = index - this.currentIndex;
    const shortestDiff = ((diff + this.videos.length / 2) % this.videos.length) - this.videos.length / 2;
    
    this.currentIndex = index;
    this.targetRotation = -(this.currentIndex * (2 * Math.PI) / this.videos.length);
    this.velocity = 0;
  }

  playVideo(index) {
    const video = this.videos[index];
    // Implement video playback logic
    console.log('Playing video:', video.title);
  }

  toggleAutoRotate() {
    this.options.autoRotate = !this.options.autoRotate;
    this.playPauseBtn.innerHTML = this.options.autoRotate ? '⏸' : '▶';
    this.playPauseBtn.setAttribute('aria-label', 
      this.options.autoRotate ? 'Pause auto-rotation' : 'Play auto-rotation'
    );
  }

  bindEvents() {
    // Mouse events
    this.carouselElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // Touch events
    if (this.options.enableGestures) {
      this.carouselElement.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
      this.carouselElement.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      this.carouselElement.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    }

    // Keyboard events
    if (this.options.enableKeyboard) {
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    // Wheel events
    this.carouselElement.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

    // Resize events
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  handleMouseDown(e) {
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.lastDragX = e.clientX;
    this.velocity = 0;
    this.carouselElement.style.cursor = 'grabbing';
  }

  handleMouseMove(e) {
    if (!this.isDragging) return;
    
    e.preventDefault();
    const deltaX = e.clientX - this.lastDragX;
    this.velocity = deltaX * 0.5;
    this.targetRotation += deltaX * 0.01;
    this.lastDragX = e.clientX;
  }

  handleMouseUp(e) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.carouselElement.style.cursor = 'grab';
    
    // Calculate snap-to position based on velocity
    const snapAngle = (2 * Math.PI) / this.videos.length;
    const currentAngle = this.currentRotation % (2 * Math.PI);
    const targetIndex = Math.round(-currentAngle / snapAngle) % this.videos.length;
    
    this.currentIndex = (targetIndex + this.videos.length) % this.videos.length;
    this.targetRotation = -(this.currentIndex * snapAngle);
  }

  handleTouchStart(e) {
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartTime = Date.now();
    this.isDragging = true;
  }

  handleTouchMove(e) {
    if (!this.isDragging) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchStartX;
    this.targetRotation += deltaX * 0.01;
  }

  handleTouchEnd(e) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - this.touchStartTime;
    
    // Calculate swipe velocity
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const velocity = deltaX / touchDuration;
    
    if (Math.abs(velocity) > 0.5) {
      // Swipe detected
      const direction = velocity > 0 ? 'prev' : 'next';
      this.navigate(direction);
    } else {
      // Snap to nearest item
      const snapAngle = (2 * Math.PI) / this.videos.length;
      const currentAngle = this.currentRotation % (2 * Math.PI);
      const targetIndex = Math.round(-currentAngle / snapAngle) % this.videos.length;
      
      this.currentIndex = (targetIndex + this.videos.length) % this.videos.length;
      this.targetRotation = -(this.currentIndex * snapAngle);
    }
  }

  handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowLeft':
        this.navigate('prev');
        break;
      case 'ArrowRight':
        this.navigate('next');
        break;
      case ' ':
        e.preventDefault();
        this.toggleAutoRotate();
        break;
      case 'Home':
        this.goToVideo(0);
        break;
      case 'End':
        this.goToVideo(this.videos.length - 1);
        break;
    }
  }

  handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    this.navigate(delta > 0 ? 'next' : 'prev');
  }

  handleResize() {
    if (this.options.enableParticles && this.particleCanvas) {
      this.particleCanvas.width = window.innerWidth;
      this.particleCanvas.height = window.innerHeight;
    }
  }

  initParticles() {
    if (!this.options.enableParticles) return;

    for (let i = 0; i < this.options.particleCount; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        hue: Math.random() * 60 + 200 // Blue to purple range
      });
    }
  }

  updateParticles() {
    if (!this.options.enableParticles || !this.particleCtx) return;

    this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);

    this.particles.forEach(particle => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Wrap around edges
      if (particle.x < 0) particle.x = this.particleCanvas.width;
      if (particle.x > this.particleCanvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.particleCanvas.height;
      if (particle.y > this.particleCanvas.height) particle.y = 0;

      // Draw particle
      this.particleCtx.beginPath();
      this.particleCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.particleCtx.fillStyle = `hsla(${particle.hue}, 70%, 60%, ${particle.opacity})`;
      this.particleCtx.fill();

      // Add glow effect
      this.particleCtx.shadowBlur = 10;
      this.particleCtx.shadowColor = `hsla(${particle.hue}, 70%, 60%, 0.5)`;
    });
  }

  updateProgress() {
    const progress = ((this.currentIndex + 1) / this.videos.length) * 100;
    this.progressBar.style.width = `${progress}%`;
    
    // Update ARIA attributes
    const progressContainer = this.progressBar.parentElement;
    progressContainer.setAttribute('aria-valuenow', Math.round(progress));
  }

  startAnimation() {
    const animate = () => {
      // Auto-rotation
      if (this.options.autoRotate && !this.isDragging) {
        this.targetRotation -= this.options.autoRotateSpeed * 0.01;
        
        // Update current index based on rotation
        const snapAngle = (2 * Math.PI) / this.videos.length;
        const currentAngle = this.currentRotation % (2 * Math.PI);
        const targetIndex = Math.round(-currentAngle / snapAngle) % this.videos.length;
        
        if (targetIndex !== this.currentIndex) {
          this.currentIndex = (targetIndex + this.videos.length) % this.videos.length;
        }
      }

      // Spring physics for smooth rotation
      const rotationDiff = this.targetRotation - this.currentRotation;
      this.velocity += rotationDiff * this.options.springStrength;
      this.velocity *= this.options.friction;
      this.currentRotation += this.velocity;

      // Update carousel
      this.updateCarousel();

      // Update particles
      this.updateParticles();

      // Continue animation
      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Remove event listeners
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this));
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoCarousel3D;
} else {
  window.VideoCarousel3D = VideoCarousel3D;
}