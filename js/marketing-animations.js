/**
 * Shared marketing-page animations.
 * Loads on: index.html, about.html, tools.html, blog.html, blog/post.html, ai-resources.html
 *
 * Behaviors:
 *  - Scroll reveal: .reveal elements fade+translate in on viewport entry
 *  - Sticky TOC bar scroll spy: highlights .toc-pill matching visible section[id]
 *  - Smooth anchor scrolling for .toc-link and [href^="#"]
 *  - Number counter animation for .stat-number
 */

(function () {
  'use strict';

  // ===== Body js-loaded state =====
  document.body.classList.add('js-loaded');

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== SCROLL REVEAL =====
  (function () {
    var targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) {
        el.classList.add('revealed');
        el.classList.add('visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (el) { observer.observe(el); });
  })();

  // ===== TOC SCROLL SPY =====
  (function () {
    var sections = document.querySelectorAll('section[id]');
    var pills = document.querySelectorAll('.toc-pill');
    if (!sections.length || !pills.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          pills.forEach(function (p) { p.classList.remove('active'); });
          var active = document.querySelector('.toc-pill[data-section="' + entry.target.id + '"]');
          if (active) {
            active.classList.add('active');
            active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        }
      });
    }, { rootMargin: '-150px 0px -60% 0px', threshold: 0 });

    sections.forEach(function (s) { observer.observe(s); });
  })();

  // ===== SMOOTH ANCHOR SCROLLING =====
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var hash = link.getAttribute('href');
    if (!hash || hash === '#') return;
    var target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    var top = target.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: top, behavior: reducedMotion ? 'auto' : 'smooth' });
  });

  // ===== STAT NUMBER COUNTER =====
  (function () {
    var stats = document.querySelectorAll('[data-count]');
    if (!stats.length) return;

    if (reducedMotion) {
      stats.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var duration = 1400;
        var start = performance.now();
        function step(now) {
          var t = Math.min((now - start) / duration, 1);
          var eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(target * eased).toLocaleString('en-US');
          if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    stats.forEach(function (el) { observer.observe(el); });
  })();

})();
