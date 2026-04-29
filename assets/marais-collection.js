/**
 * MARAIS — marais-collection.js
 * Shopify storefront filter interactions with AJAX filtering.
 */

'use strict';

(function () {

  /* ── AJAX filter navigation ── */

  function fetchFilter(url, pushState) {
    var sidebar = document.getElementById('CollectionSidebar');
    var main    = document.getElementById('CollectionMain');
    if (main) main.classList.add('is-loading');

    fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc        = new DOMParser().parseFromString(html, 'text/html');
        var newSidebar = doc.getElementById('CollectionSidebar');
        var newMain    = doc.getElementById('CollectionMain');
        if (newSidebar && sidebar) sidebar.replaceWith(newSidebar);
        if (newMain    && main)    main.replaceWith(newMain);
        if (pushState !== false) history.pushState(null, '', url);
        initFiltersAndUI();
      })
      .catch(function () { window.location.href = url; });
  }

  function navigateTo(url) { fetchFilter(url); }

  window.addEventListener('popstate', function () {
    fetchFilter(location.href, false);
  });

  /* Intercept <a> filter links — category tree, active chips, pagination */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.fcat-opt, .active-chip, .pagination a');
    if (!link) return;
    e.preventDefault();
    fetchFilter(link.href);
  });

  /* ── Filter controls ── */

  function initFilterCheckboxes() {
    document.querySelectorAll('.filter-checkbox').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var url = this.checked ? this.dataset.urlAdd : this.dataset.urlRemove;
        if (!url) return;
        if (this.checked && this.closest('.filter-size-grid')) {
          if (url.indexOf('filter.v.availability') === -1) {
            url = url + (url.indexOf('?') === -1 ? '?' : '&') + 'filter.v.availability=1';
          }
        }
        navigateTo(url);
      });
    });
  }

  function initSortSelect() {
    var select = document.getElementById('SortBy');
    if (!select) return;
    select.addEventListener('change', function () {
      var url = new URL(window.location.href);
      url.searchParams.set('sort_by', this.value);
      navigateTo(url.toString());
    });
    var current = new URLSearchParams(window.location.search).get('sort_by');
    if (current) select.value = current;
  }

  function initGridToggle() {
    var grid    = document.getElementById('ProductGrid');
    var buttons = document.querySelectorAll('.grid-toggle__btn');
    if (!grid || !buttons.length) return;
    var saved = localStorage.getItem('marais-grid-cols') || '3';
    applyGrid(saved);
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyGrid(this.dataset.cols);
        localStorage.setItem('marais-grid-cols', this.dataset.cols);
      });
    });
    function applyGrid(cols) {
      grid.className = grid.className.replace(/product-grid--\d-col/g, '').trim();
      grid.classList.add('product-grid--' + cols + '-col');
      buttons.forEach(function (b) {
        b.classList.toggle('grid-toggle__btn--active', b.dataset.cols === cols);
        b.setAttribute('aria-pressed', b.dataset.cols === cols ? 'true' : 'false');
      });
    }
  }

  function initMobileSidebar() {
    var openBtn  = document.getElementById('MobFilterBtn');
    var closeBtn = document.getElementById('SidebarCloseBtn');
    var sidebar  = document.getElementById('CollectionSidebar');
    var overlay  = document.getElementById('SidebarOverlay');
    if (!sidebar) return;
    function open() {
      sidebar.classList.add('collection-sidebar--open');
      if (overlay) { overlay.classList.add('sidebar-overlay--open'); overlay.setAttribute('aria-hidden', 'false'); }
      document.body.style.overflow = 'hidden';
      if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    }
    function close() {
      sidebar.classList.remove('collection-sidebar--open');
      if (overlay) { overlay.classList.remove('sidebar-overlay--open'); overlay.setAttribute('aria-hidden', 'true'); }
      document.body.style.overflow = '';
      if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    }
    if (openBtn)  openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay)  overlay.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  function initPriceForm() {
    var form = document.getElementById('PriceFilterForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var url    = new URL(window.location.href);
      var params = url.searchParams;
      params.delete('filter.v.price.gte');
      params.delete('filter.v.price.lte');
      var min = document.getElementById('FilterMinPrice');
      var max = document.getElementById('FilterMaxPrice');
      if (min && min.value) params.set('filter.v.price.gte', (parseFloat(min.value) * 100).toFixed(0));
      if (max && max.value) params.set('filter.v.price.lte', (parseFloat(max.value) * 100).toFixed(0));
      params.delete('page');
      navigateTo(url.toString());
    });
  }

  function initColourSwatches() {
    var CM = {
      /* Blacks */
      'black':'#111','noir':'#111','jet':'#111','off-black':'#222',
      /* Whites */
      'white':'#f5f5f5','bright-white':'#f5f5f5','optic-white':'#f5f5f5',
      /* Creams / ivories */
      'ivory':'#fffff0','cream':'#fffdd0','ecru':'#fffdd0','off-white':'#f8f4ef','bone':'#f8f4ef','parchment':'#f8f4ef',
      /* Neutrals */
      'beige':'#f5f0e8','nude':'#f5f0e8','natural':'#f5f0e8','linen':'#f5f0e8',
      'sand':'#c2b280','stone':'#c2b280','oat':'#c2b280','wheat':'#c2b280',
      'camel':'#c19a6b','caramel':'#c19a6b','honey':'#c19a6b',
      'tan':'#d2b48c','toffee':'#d2b48c',
      'taupe':'#b09f8c','mushroom':'#b09f8c','mink':'#b09f8c',
      /* Browns */
      'brown':'#8b4513','chocolate':'#7b3f00','cognac':'#7b3f00','tobacco':'#7b3f00',
      /* Greys */
      'grey':'#878787','gray':'#878787','slate':'#878787',
      'light-grey':'#cccccc','light-gray':'#cccccc','pale-grey':'#cccccc','silver-grey':'#cccccc',
      'silver':'#c0c0c0',
      'charcoal':'#36454f','dark-grey':'#36454f','dark-gray':'#36454f','graphite':'#36454f','anthracite':'#36454f',
      /* Reds */
      'red':'#cc0000','tomato':'#cc0000','scarlet':'#cc0000','crimson':'#cc0000',
      'burgundy':'#800020','wine':'#800020','bordeaux':'#800020','merlot':'#800020','claret':'#800020','oxblood':'#800020',
      /* Pinks */
      'pink':'#ffc0cb','blush':'#ffb6c1','petal':'#ffb6c1','powder-pink':'#ffb6c1','baby-pink':'#ffb6c1','peach':'#ffb6c1',
      'rose':'#e75480','dusty-rose':'#e75480','antique-rose':'#e75480',
      'coral':'#ff7f50','terracotta':'#ff7f50',
      /* Oranges / Yellows */
      'orange':'#ff6600','amber':'#ff6600','rust':'#b7410e','burnt-orange':'#b7410e',
      'yellow':'#ffd700','butter':'#ffd700',
      'mustard':'#ffdb58','ochre':'#ffdb58','saffron':'#ffdb58',
      'olive':'#808000','khaki':'#808000',
      /* Greens */
      'green':'#3a7d44','bottle-green':'#3a7d44','hunter-green':'#3a7d44',
      'sage':'#9caf88','pistachio':'#9caf88','celadon':'#9caf88',
      'emerald':'#006400','forest':'#228b22','racing-green':'#228b22',
      'mint':'#98ff98','aqua':'#00ffff','teal':'#008080','jade':'#008080','duck-egg':'#008080',
      /* Blues */
      'blue':'#1e3a8a','royal-blue':'#1e3a8a','electric-blue':'#1e3a8a',
      'navy':'#001f5b','navy-blue':'#001f5b','dark-navy':'#001f5b','midnight':'#001f5b','midnight-blue':'#001f5b','marine':'#001f5b',
      'cobalt':'#0047ab','indigo':'#0047ab',
      'denim':'#1560bd','chambray':'#1560bd',
      'sky':'#87ceeb','powder-blue':'#87ceeb','baby-blue':'#87ceeb','cornflower':'#87ceeb',
      /* Purples */
      'purple':'#6b21a8','violet':'#6b21a8','plum':'#6b21a8','aubergine':'#6b21a8','eggplant':'#6b21a8',
      'lilac':'#c084fc','lavender':'#c084fc','mauve':'#c084fc',
      /* Metallics */
      'metallic':'#a8a9ad','pewter':'#a8a9ad','bronze':'#a8a9ad',
      'gold':'#d4a017','champagne':'#d4a017',
      /* Multi / print */
      'multi':'#b86bdf','multicolour':'#b86bdf','multicolor':'#b86bdf','print':'#b86bdf','pattern':'#b86bdf'
    };
    document.querySelectorAll('.product-card__swatch[data-c]').forEach(function (el) {
      var key = el.getAttribute('data-c').replace(/ /g, '-');
      if (CM[key]) el.style.background = CM[key];
    });
  }

  function initColourLabel() {
    var label = document.getElementById('ColourFilterLabel');
    if (!label) return;
    document.querySelectorAll('.filter-colour').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        var t = this.getAttribute('title');
        if (t) label.textContent = t.split(' (')[0];
      });
      el.addEventListener('mouseleave', function () {
        var active = [];
        document.querySelectorAll('.filter-colour--active').forEach(function (a) {
          active.push(a.getAttribute('title').split(' (')[0]);
        });
        label.textContent = active.join(', ');
      });
    });
  }

  /* ── Product card interactions ── */

  function initWishlist() {
    var wishlist = JSON.parse(localStorage.getItem('marais-wishlist') || '[]');
    function render() {
      document.querySelectorAll('.product-card__wish').forEach(function (btn) {
        var wished = wishlist.includes(btn.dataset.productId);
        btn.setAttribute('aria-pressed', wished ? 'true' : 'false');
        var path = btn.querySelector('svg path');
        if (path) path.style.fill = wished ? '#0a0a0a' : 'none';
      });
    }
    render();
    document.querySelectorAll('.product-card__wish').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var id  = this.dataset.productId;
        var idx = wishlist.indexOf(id);
        if (idx === -1) { wishlist.push(id); showToast('Saved to wishlist'); }
        else { wishlist.splice(idx, 1); showToast('Removed from wishlist'); }
        localStorage.setItem('marais-wishlist', JSON.stringify(wishlist));
        render();
      });
    });
  }

  function initQuickAdd() {
    document.querySelectorAll('.product-card__quick-add[data-variant-id]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var variantId = this.dataset.variantId;
        var orig = this.textContent;
        this.textContent = 'Adding…';
        this.style.opacity = '.7';
        this.style.pointerEvents = 'none';
        var self = this;
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: parseInt(variantId, 10), quantity: 1 })
        })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.id) { showToast('Added to bag'); if (window.MaraisCart) { window.MaraisCart.refresh(true); } else { updateCartCount(); } }
          else showToast(d.message || 'Could not add to bag');
        })
        .catch(function () { showToast('Could not add to bag'); })
        .finally(function () { self.textContent = orig; self.style.opacity = ''; self.style.pointerEvents = ''; });
      });
    });
  }

  function updateCartCount() {
    fetch('/cart.js').then(function (r) { return r.json(); }).then(function (c) {
      var badge = document.querySelector('.mh-cart-badge');
      if (badge) { badge.textContent = c.item_count; }
      else if (c.item_count > 0) {
        var cartBtn = document.querySelector('.mh-cart-btn');
        if (cartBtn) {
          var b = document.createElement('span');
          b.className = 'mh-cart-badge';
          b.textContent = c.item_count;
          cartBtn.appendChild(b);
        }
      }
    });
  }

  var toastTimer;
  function showToast(msg) {
    var t = document.getElementById('marais-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('marais-toast--show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('marais-toast--show'); }, 2400);
  }

  function initQuickView() {
    var overlay = document.createElement('div');
    overlay.id = 'QvOverlay';
    overlay.className = 'qv-overlay';
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('role', 'dialog');
    overlay.innerHTML =
      '<div class="qv-panel" id="QvPanel">' +
        '<button class="qv-close" id="QvClose" aria-label="Close">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
            '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
          '</svg>' +
        '</button>' +
        '<div id="QvContent" class="qv-loading">Loading…</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var panel    = document.getElementById('QvPanel');
    var closeBtn = document.getElementById('QvClose');
    var content  = document.getElementById('QvContent');
    var currentProduct = null;
    var selectedOpts   = {};

    function openModal()  { overlay.classList.add('is-open');    document.body.style.overflow = 'hidden'; }
    function closeModal() { overlay.classList.remove('is-open'); document.body.style.overflow = ''; }

    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    closeBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.product-card__qv');
      if (!btn) return;
      e.preventDefault(); e.stopPropagation();
      var handle = btn.dataset.handle;
      if (!handle) return;
      selectedOpts = {};
      currentProduct = null;
      openModal();
      content.className = 'qv-loading';
      content.innerHTML = 'Loading…';
      panel.style.gridTemplateColumns = '';

      fetch('/products/' + handle + '.js')
        .then(function (r) { return r.json(); })
        .then(function (product) { currentProduct = product; renderModal(product); })
        .catch(function () {
          content.className = '';
          content.innerHTML = '<p style="padding:40px;font-family:var(--mh-sans);font-size:13px;color:var(--mh-gray);">Could not load product.</p>';
        });
    });

    function renderModal(p) {
      var imgs = p.images || [];
      var hasGallery = imgs.length > 0;

      var galleryHTML = '';
      if (hasGallery) {
        galleryHTML = '<div class="qv-gallery"><div class="qv-gallery-grid">';
        imgs.forEach(function (img, i) {
          var isHalf = (i % 3 !== 0);
          var cls = 'qv-gallery-img' + (isHalf ? ' qv-gallery-img--half' : '');
          var load = i < 2 ? 'eager' : 'lazy';
          galleryHTML += '<img class="' + cls + '" src="' + sizedImg(img.src, '900x') + '" alt="' + (i === 0 ? esc(p.title) : '') + '" loading="' + load + '">';
        });
        galleryHTML += '</div></div>';
      }

      var compareAt = p.compare_at_price_max;
      var priceLine = (compareAt && compareAt > p.price_min)
        ? '<span class="qv-price-was">' + money(compareAt) + '</span><span class="qv-price-sale">' + money(p.price_min) + '</span>'
        : money(p.price_min);

      var hasRealOptions = p.options && p.options.length && !(p.options.length === 1 && p.options[0] === 'Title');
      var optsHTML = '';
      if (hasRealOptions) {
        p.options.forEach(function (optName, oi) {
          var vals = [];
          p.variants.forEach(function (v) { if (vals.indexOf(v.options[oi]) === -1) vals.push(v.options[oi]); });
          optsHTML += '<div class="qv-opt-group">';
          optsHTML += '<div class="qv-opt-label">' + esc(optName) + '<strong id="QvOptVal-' + oi + '"></strong></div>';
          optsHTML += '<div class="qv-opts">';
          vals.forEach(function (val) {
            optsHTML += '<button class="qv-opt" data-opt-idx="' + oi + '" data-opt-val="' + esc(val) + '">' + esc(val) + '</button>';
          });
          optsHTML += '</div></div>';
        });
      }

      var infoHTML = '<div class="qv-info">' +
        '<p class="qv-vendor">' + esc(p.vendor) + '</p>' +
        '<h2 class="qv-title">' + esc(p.title) + '</h2>' +
        '<div class="qv-price" id="QvPrice">' + priceLine + '</div>' +
        optsHTML +
        '<div class="qv-atc">' +
          '<button class="qv-atc-btn" id="QvAtcBtn" disabled>' + (hasRealOptions ? 'Select Options' : 'Add to Bag') + '</button>' +
          '<a href="/products/' + p.handle + '" class="qv-link">View Full Details</a>' +
        '</div>' +
      '</div>';

      content.className = '';
      content.innerHTML = galleryHTML + infoHTML;
      panel.style.gridTemplateColumns = hasGallery ? '' : '1fr';

      content.querySelectorAll('.qv-opt').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var oi  = parseInt(this.dataset.optIdx, 10);
          var val = this.dataset.optVal;
          selectedOpts[oi] = val;
          content.querySelectorAll('.qv-opt[data-opt-idx="' + oi + '"]').forEach(function (b) {
            b.classList.toggle('is-active', b.dataset.optVal === val);
          });
          var lbl = document.getElementById('QvOptVal-' + oi);
          if (lbl) lbl.textContent = ': ' + val;
          updateVariant();
        });
      });

      if (!hasRealOptions) {
        var v = p.variants[0];
        var atcBtn = document.getElementById('QvAtcBtn');
        if (atcBtn && v) {
          atcBtn.disabled = !v.available;
          atcBtn.textContent = v.available ? 'Add to Bag' : 'Sold Out';
          atcBtn.dataset.variantId = v.id;
        }
      }
    }

    function updateVariant() {
      var atcBtn = document.getElementById('QvAtcBtn');
      if (!atcBtn || !currentProduct) return;
      var numOpts = currentProduct.options ? currentProduct.options.length : 0;
      var hasReal = !(numOpts === 1 && currentProduct.options[0] === 'Title');
      if (!hasReal) return;

      for (var i = 0; i < numOpts; i++) {
        if (selectedOpts[i] === undefined) {
          atcBtn.disabled = true; atcBtn.textContent = 'Select Options'; return;
        }
      }

      var matched = null;
      currentProduct.variants.forEach(function (v) {
        if (matched) return;
        var ok = true;
        for (var i = 0; i < numOpts; i++) { if (v.options[i] !== selectedOpts[i]) { ok = false; break; } }
        if (ok) matched = v;
      });

      if (!matched) { atcBtn.disabled = true; atcBtn.textContent = 'Unavailable'; return; }
      atcBtn.dataset.variantId = matched.id;
      atcBtn.disabled = !matched.available;
      atcBtn.textContent = matched.available ? 'Add to Bag' : 'Sold Out';
    }

    document.addEventListener('click', function (e) {
      if (e.target.id !== 'QvAtcBtn') return;
      var btn = e.target;
      if (btn.disabled) return;
      var variantId = btn.dataset.variantId;
      if (!variantId) return;
      var orig = btn.textContent;
      btn.textContent = 'Adding…';
      btn.disabled = true;
      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(variantId, 10), quantity: 1 })
      })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.id) {
          showToast('Added to bag');
          if (window.MaraisCart) { window.MaraisCart.refresh(true); } else { updateCartCount(); }
          btn.textContent = 'Added!';
          setTimeout(function () { btn.textContent = orig; btn.disabled = false; }, 1600);
        } else {
          showToast(d.message || 'Could not add to bag');
          btn.textContent = orig;
          btn.disabled = false;
        }
      })
      .catch(function () { showToast('Could not add to bag'); btn.textContent = orig; btn.disabled = false; });
    });

    function sizedImg(url, size) {
      return url.replace(/(\.(jpg|jpeg|png|gif|webp))(\?.*)?$/i, '_' + size + '$1');
    }
    function esc(str) {
      return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function money(cents) {
      return '$' + (cents / 100).toFixed(2).replace(/\.00$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  }

  function initSizePills() {
    document.addEventListener('click', function (e) {
      var pill = e.target.closest('.product-card__size-pill[data-variant-id]');
      if (!pill) return;
      e.preventDefault(); e.stopPropagation();
      var variantId = pill.dataset.variantId;
      var orig = pill.textContent;
      pill.textContent = '…';
      pill.style.pointerEvents = 'none';
      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(variantId, 10), quantity: 1 })
      })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.id) { showToast('Added to bag'); if (window.MaraisCart) { window.MaraisCart.refresh(true); } else { updateCartCount(); } }
        else showToast(d.message || 'Could not add to bag');
      })
      .catch(function () { showToast('Could not add to bag'); })
      .finally(function () { pill.textContent = orig; pill.style.pointerEvents = ''; });
    });
  }

  /* ── Re-run after every AJAX swap ── */
  function initFiltersAndUI() {
    initFilterCheckboxes();
    initSortSelect();
    initGridToggle();
    initMobileSidebar();
    initPriceForm();
    initColourSwatches();
    initColourLabel();
    initWishlist();
    initQuickAdd();
    initQuickView();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initFiltersAndUI();
    initSizePills(); /* delegated on document — init once only */
  });

})();
