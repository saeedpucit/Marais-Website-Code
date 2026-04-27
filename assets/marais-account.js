/* ============================================================
   MARAIS — marais-account.js
   Wishlist (localStorage) + wishlist page rendering
   ============================================================ */

(function () {
  'use strict';

  var WISHLIST_KEY = 'marais-wishlist';

  /* ── Storage helpers ── */
  function getWishlist() {
    try { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; }
    catch (e) { return []; }
  }

  function saveWishlist(items) {
    try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(items)); }
    catch (e) {}
  }

  function isWishlisted(id) {
    var list = getWishlist();
    return list.some(function (item) { return String(item.id) === String(id); });
  }

  function addToWishlist(data) {
    var list = getWishlist();
    if (!list.some(function (item) { return String(item.id) === String(data.id); })) {
      list.push(data);
      saveWishlist(list);
    }
  }

  function removeFromWishlist(id) {
    var list = getWishlist().filter(function (item) { return String(item.id) !== String(id); });
    saveWishlist(list);
  }

  function toggleWishlist(btn) {
    var id = btn.dataset.productId;
    if (!id) return;

    if (isWishlisted(id)) {
      removeFromWishlist(id);
    } else {
      addToWishlist({
        id:           id,
        handle:       btn.dataset.productHandle  || '',
        title:        btn.dataset.productTitle   || '',
        vendor:       btn.dataset.productVendor  || '',
        price:        btn.dataset.productPrice   || '',
        comparePrice: btn.dataset.productComparePrice || '',
        url:          btn.dataset.productUrl     || '',
        image:        btn.dataset.productImage   || ''
      });
    }
    syncAllButtons(id);
  }

  /* ── Sync all buttons for a given product ID ── */
  function syncAllButtons(id) {
    var wishlisted = isWishlisted(id);
    document.querySelectorAll('.product-card__wish[data-product-id="' + id + '"]').forEach(function (btn) {
      btn.classList.toggle('is-wishlisted', wishlisted);
      btn.setAttribute('aria-pressed', wishlisted ? 'true' : 'false');
    });
  }

  /* ── Init wishlist buttons on current page ── */
  function initWishlistButtons() {
    document.querySelectorAll('.product-card__wish[data-product-id]').forEach(function (btn) {
      var id = btn.dataset.productId;
      btn.classList.toggle('is-wishlisted', isWishlisted(id));
      btn.setAttribute('aria-pressed', isWishlisted(id) ? 'true' : 'false');

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(btn);
      });
    });
  }

  /* ── Wishlist page ── */
  function formatMoney(cents) {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(cents) / 100);
  }

  function renderWishlistPage() {
    var grid  = document.getElementById('WishlistGrid');
    var empty = document.getElementById('WishlistEmpty');
    var count = document.getElementById('WishlistCount');
    if (!grid) return;

    var items = getWishlist();

    if (count) {
      count.textContent = items.length === 1 ? '1 piece' : items.length + ' pieces';
    }

    if (items.length === 0) {
      grid.style.display = 'none';
      if (empty) empty.style.display = '';
      return;
    }

    grid.style.display = '';
    if (empty) empty.style.display = 'none';

    grid.innerHTML = items.map(function (item) {
      var priceHtml = '';
      if (item.comparePrice && Number(item.comparePrice) > Number(item.price)) {
        priceHtml = '<span class="product-card__price-was">' + formatMoney(item.comparePrice) + '</span> '
          + '<span class="product-card__price-sale">' + formatMoney(item.price) + '</span>';
      } else {
        priceHtml = formatMoney(item.price || 0);
      }

      var imgHtml = item.image
        ? '<img class="product-card__img product-card__img--primary" src="' + item.image + '" alt="' + escHtml(item.title) + '" loading="lazy" width="600" height="800">'
        : '<div class="product-card__img-placeholder"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>';

      return '<article class="product-card">'
        + '<a href="' + escHtml(item.url) + '" class="product-card__img-link" tabindex="-1" aria-hidden="true">'
        + '<div class="product-card__img-wrap">'
        + imgHtml
        + '<button class="product-card__wish is-wishlisted" data-product-id="' + escHtml(item.id) + '" aria-label="Remove from wishlist" aria-pressed="true">'
        + '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
        + '</button>'
        + '</div></a>'
        + '<div class="product-card__info">'
        + '<p class="product-card__vendor">' + escHtml(item.vendor) + '</p>'
        + '<h3 class="product-card__title"><a href="' + escHtml(item.url) + '" class="product-card__title-link">' + escHtml(item.title) + '</a></h3>'
        + '<div class="product-card__footer"><div class="product-card__price">' + priceHtml + '</div></div>'
        + '</div></article>';
    }).join('');

    /* Bind remove buttons on rendered cards */
    grid.querySelectorAll('.product-card__wish').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var id = btn.dataset.productId;
        removeFromWishlist(id);
        renderWishlistPage();
      });
    });
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    initWishlistButtons();
    renderWishlistPage();
  });

  /* Expose toggle for use in other scripts */
  window.MaraisWishlist = { toggle: toggleWishlist, isWishlisted: isWishlisted };

}());
