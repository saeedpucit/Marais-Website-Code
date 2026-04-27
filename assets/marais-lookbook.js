/* ============================================================
   MARAIS — marais-lookbook.js
   Lookbook: scroll progress, slide fade-in, shop-this-look
   ============================================================ */

(function () {
  'use strict';

  var container   = document.querySelector('.lookbook');
  var progressFill = document.querySelector('.lookbook-progress__fill');
  var slides      = document.querySelectorAll('.lookbook__slide');
  var counter     = document.querySelector('.lookbook__counter');
  if (!container || !slides.length) return;

  /* ── Scroll progress bar ── */
  function updateProgress() {
    if (!progressFill) return;
    var scrollTop  = container.scrollTop;
    var scrollable = container.scrollHeight - container.clientHeight;
    var pct = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;
    progressFill.style.height = pct.toFixed(1) + '%';
  }

  /* ── Slide counter ── */
  function updateCounter() {
    if (!counter || !slides.length) return;
    var scrollTop = container.scrollTop;
    var slideH    = container.clientHeight;
    var idx       = Math.round(scrollTop / slideH) + 1;
    idx = Math.min(Math.max(idx, 1), slides.length);
    counter.textContent = idx + ' / ' + slides.length;
  }

  /* ── IntersectionObserver for slide fade-in ── */
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    },
    {
      root: container,
      threshold: 0.4
    }
  );
  slides.forEach(function (slide) { observer.observe(slide); });

  /* ── "Shop This Look" toggles ── */
  document.querySelectorAll('.lookbook__shop-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var slideEl  = btn.closest('.lookbook__slide');
      if (!slideEl) return;
      var products = slideEl.querySelector('.lookbook__products');
      if (!products) return;

      var open = products.classList.toggle('is-open');
      btn.classList.toggle('is-open', open);
      btn.querySelector('span').textContent = open ? 'Close' : 'Shop This Look';
    });
  });

  /* ── Keyboard navigation ── */
  container.addEventListener('keydown', function (e) {
    var scrollH = container.clientHeight;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      container.scrollBy({ top: scrollH, behavior: 'smooth' });
    }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      container.scrollBy({ top: -scrollH, behavior: 'smooth' });
    }
  });

  /* ── Bind scroll ── */
  container.addEventListener('scroll', function () {
    updateProgress();
    updateCounter();
  }, { passive: true });

  /* Initial state */
  updateProgress();
  updateCounter();

}());
