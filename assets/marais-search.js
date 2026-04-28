/* ============================================================
   MARAIS — marais-search.js
   Search page: autocomplete + tab filtering
   ============================================================ */

(function () {
  'use strict';

  /* ── Autocomplete ── */
  var autocompleteTimer;
  var currentQuery = '';

  function initAutocomplete() {
    var input    = document.querySelector('.search-hero__input');
    var dropdown = document.querySelector('.search-autocomplete');
    if (!input || !dropdown) return;

    input.addEventListener('input', function () {
      var q = this.value.trim();
      clearTimeout(autocompleteTimer);
      if (q.length < 2) {
        closeDropdown(dropdown);
        return;
      }
      currentQuery = q;
      autocompleteTimer = setTimeout(function () {
        fetchSuggestions(q, dropdown);
      }, 220);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDropdown(dropdown);
    });

    document.addEventListener('click', function (e) {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        closeDropdown(dropdown);
      }
    });
  }

  function fetchSuggestions(q, dropdown) {
    var url = '/search/suggest.json?q=' + encodeURIComponent(q)
      + '&resources[type]=product&resources[limit]=6&resources[fields]=title,vendor,price';

    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (q !== currentQuery) return;
        var products = (data.resources && data.resources.results && data.resources.results.products) || [];
        renderDropdown(products, dropdown);
      })
      .catch(function () { closeDropdown(dropdown); });
  }

  function renderDropdown(products, dropdown) {
    if (!products.length) {
      closeDropdown(dropdown);
      return;
    }

    var html = products.map(function (p) {
      var img = p.featured_image
        ? '<img class="search-autocomplete__img" src="' + p.featured_image.url + '" alt="" loading="lazy">'
        : '<div class="search-autocomplete__img"></div>';
      var price = p.price ? formatMoney(p.price) : '';
      return '<a href="' + p.url + '" class="search-autocomplete__item">'
        + img
        + '<span class="search-autocomplete__title">' + escHtml(p.title) + '</span>'
        + (price ? '<span class="search-autocomplete__price">' + price + '</span>' : '')
        + '</a>';
    }).join('');

    dropdown.innerHTML = html;
    dropdown.classList.add('is-open');
  }

  function closeDropdown(dropdown) {
    if (dropdown) {
      dropdown.classList.remove('is-open');
      dropdown.innerHTML = '';
    }
  }

  /* ── Tab filtering ── */
  function initTabs() {
    var tabs     = document.querySelectorAll('.search-tab');
    var sections = document.querySelectorAll('.search-results__section');
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = this.dataset.tab;

        tabs.forEach(function (t) { t.classList.remove('is-active'); });
        this.classList.add('is-active');

        sections.forEach(function (sec) {
          var type = sec.dataset.type;
          if (target === 'all' || type === target) {
            sec.style.display = '';
          } else {
            sec.style.display = 'none';
          }
        });
      });
    });
  }

  /* ── Helpers ── */
  function formatMoney(cents) {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Header search panel ── */
  function initHeaderSearch() {
    var trigger    = document.getElementById('mh-search-trigger');
    var mobTrigger = document.getElementById('mh-mob-search-trigger');
    var panel      = document.getElementById('mh-search-panel');
    var overlay    = document.getElementById('mh-search-overlay');
    var input      = document.getElementById('mh-search-input');
    var closeBtn   = document.getElementById('mh-search-close');
    var resultsEl  = document.getElementById('mh-search-panel-results');
    if (!panel || !input) return;

    var timer = null;
    var activeQuery = '';

    function openPanel() {
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      overlay.classList.add('is-open');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
      input.focus();
    }

    function closePanel() {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('is-open');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      input.value = '';
      resultsEl.innerHTML = '';
      activeQuery = '';
    }

    if (trigger) trigger.addEventListener('click', openPanel);

    if (mobTrigger) mobTrigger.addEventListener('click', function () {
      var mobNav = document.getElementById('mh-mob-nav');
      var mobOverlay = document.getElementById('mh-mob-overlay');
      if (mobNav) { mobNav.classList.remove('is-open'); mobNav.setAttribute('aria-hidden', 'true'); }
      if (mobOverlay) { mobOverlay.classList.remove('is-visible'); mobOverlay.setAttribute('aria-hidden', 'true'); }
      document.body.style.overflow = '';
      openPanel();
    });

    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) closePanel();
    });

    input.addEventListener('input', function () {
      var q = this.value.trim();
      clearTimeout(timer);
      if (q.length < 2) { resultsEl.innerHTML = ''; activeQuery = ''; return; }
      activeQuery = q;
      timer = setTimeout(function () { fetchPanelSuggestions(q); }, 220);
    });

    function fetchPanelSuggestions(q) {
      var url = '/search/suggest.json?q=' + encodeURIComponent(q)
        + '&resources[type]=product&resources[limit]=6&resources[fields]=title,vendor,price';
      fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (q !== activeQuery) return;
          var products = (data.resources && data.resources.results && data.resources.results.products) || [];
          renderPanelResults(products, q);
        })
        .catch(function () { resultsEl.innerHTML = ''; });
    }

    function renderPanelResults(products, q) {
      if (!products.length) { resultsEl.innerHTML = ''; return; }
      var html = products.map(function (p) {
        var img = p.featured_image
          ? '<img class="search-autocomplete__img" src="' + p.featured_image.url + '" alt="" loading="lazy">'
          : '<div class="search-autocomplete__img"></div>';
        var price = p.price ? formatMoney(p.price) : '';
        return '<a href="' + p.url + '" class="search-autocomplete__item">'
          + img
          + '<span class="search-autocomplete__title">' + escHtml(p.title) + '</span>'
          + (price ? '<span class="search-autocomplete__price">' + price + '</span>' : '')
          + '</a>';
      }).join('');
      html += '<a href="/search?q=' + encodeURIComponent(q) + '&type=product,article" class="mh-search-panel__view-all">View all results for &ldquo;' + escHtml(q) + '&rdquo; &rarr;</a>';
      resultsEl.innerHTML = html;
    }
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    initHeaderSearch();
    initAutocomplete();
    initTabs();
  });

}());
