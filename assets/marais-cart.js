/* ============================================================
   MARAIS — marais-cart.js
   Cart page: qty updates, remove, promo code
   ============================================================ */

(function () {
  'use strict';

  /* ── Helpers ── */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; }

  function formatMoney(cents) {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);
  }

  /* ── Update a line item ── */
  function updateLineItem(key, qty) {
    const row = document.querySelector(`.cart-item[data-key="${CSS.escape(key)}"]`);
    if (row) row.classList.add('cart-item--loading');

    return fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: qty })
    })
      .then(r => r.json())
      .then(cart => {
        if (qty === 0 && row) {
          row.remove();
        }
        refreshTotals(cart);
        refreshCount(cart.item_count);
        if (row) row.classList.remove('cart-item--loading');
        return cart;
      })
      .catch(() => {
        if (row) row.classList.remove('cart-item--loading');
      });
  }

  /* ── Refresh summary panel ── */
  function refreshTotals(cart) {
    const subtotalEl = qs('[data-cart-subtotal]');
    const totalEl    = qs('[data-cart-total]');
    const countEl    = qs('[data-cart-count]');

    if (subtotalEl) subtotalEl.textContent = formatMoney(cart.items_subtotal_price);
    if (totalEl)    totalEl.textContent    = formatMoney(cart.total_price);
    if (countEl)    countEl.textContent    = cart.item_count === 1
      ? '1 item' : `${cart.item_count} items`;

    /* Show/hide empty state */
    const hasItems = cart.item_count > 0;
    const itemsArea = qs('[data-cart-items-area]');
    const emptyArea = qs('[data-cart-empty-area]');
    const summaryArea = qs('[data-cart-summary-area]');
    if (itemsArea)  itemsArea.style.display  = hasItems ? '' : 'none';
    if (summaryArea) summaryArea.style.display = hasItems ? '' : 'none';
    if (emptyArea)  emptyArea.style.display  = hasItems ? 'none' : '';
  }

  /* ── Refresh header cart badge ── */
  function refreshCount(count) {
    const badge = qs('.mh-cart-badge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  /* ── Qty buttons ── */
  function bindQtyControls() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.cart-item__qty-btn');
      if (!btn) return;
      const row   = btn.closest('.cart-item');
      if (!row) return;
      const key   = row.dataset.key;
      const input = row.querySelector('.cart-item__qty-val');
      if (!input) return;
      let qty = parseInt(input.value, 10) || 1;

      if (btn.dataset.dir === 'up') qty += 1;
      if (btn.dataset.dir === 'down') qty = Math.max(0, qty - 1);

      input.value = qty;
      updateLineItem(key, qty);
    });

    /* Direct input edit */
    document.addEventListener('change', function (e) {
      if (!e.target.matches('.cart-item__qty-val')) return;
      const row = e.target.closest('.cart-item');
      if (!row) return;
      const qty = Math.max(0, parseInt(e.target.value, 10) || 0);
      e.target.value = qty;
      updateLineItem(row.dataset.key, qty);
    });
  }

  /* ── Remove buttons ── */
  function bindRemoveButtons() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.cart-item__remove');
      if (!btn) return;
      const row = btn.closest('.cart-item');
      if (!row) return;
      updateLineItem(row.dataset.key, 0);
    });
  }

  /* ── Promo / discount code ── */
  function bindPromoForm() {
    const form = qs('.cart-promo__form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = qs('.cart-promo__input', form);
      const code  = input ? input.value.trim() : '';
      if (!code) return;
      /* Shopify doesn't have a cart discount API endpoint on Online Store;
         redirect to checkout with discount applied */
      window.location.href = `/checkout?discount=${encodeURIComponent(code)}`;
    });
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    bindQtyControls();
    bindRemoveButtons();
    bindPromoForm();
  });

}());
