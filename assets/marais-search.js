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

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    initAutocomplete();
    initTabs();
  });

}());
