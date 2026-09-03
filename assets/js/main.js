/**
 * main.js — site behaviour: nav, reveal-on-scroll, accordions, gallery
 * filtering, counters and form validation. Progressive: every page is
 * readable and navigable with JavaScript disabled.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- sticky header ---------------- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------- mobile menu ---------------- */
  function initMenu() {
    var burger = document.querySelector('.burger');
    var menu = document.getElementById('mobile-menu');
    if (!burger || !menu) return;

    var setOpen = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
    };

    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 940) setOpen(false);
    });
  }

  /* ---------------- reveal on scroll ---------------- */
  function initReveal() {
    var nodes = document.querySelectorAll('[data-reveal]');
    if (!nodes.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(nodes, function (n) { n.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = Number(entry.target.dataset.revealDelay || 0);
        setTimeout(function () { entry.target.classList.add('is-visible'); }, delay);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
  }

  /* ---------------- FAQ accordion ---------------- */
  function initFaq() {
    document.querySelectorAll('.faq').forEach(function (faq) {
      var single = faq.dataset.single !== 'false';
      faq.querySelectorAll('.faq__q').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var item = btn.closest('.faq__item');
          var open = item.classList.contains('is-open');
          if (single) {
            faq.querySelectorAll('.faq__item.is-open').forEach(function (other) {
              if (other === item) return;
              other.classList.remove('is-open');
              other.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
            });
          }
          item.classList.toggle('is-open', !open);
          btn.setAttribute('aria-expanded', String(!open));
        });
      });
    });
  }

  /* ---------------- animated counters ---------------- */
  function initCounters() {
    var nodes = document.querySelectorAll('[data-count]');
    if (!nodes.length) return;
    var run = function (node) {
      var target = parseFloat(node.dataset.count);
      var suffix = node.dataset.countSuffix || '';
      if (reduceMotion) { node.textContent = target + suffix; return; }
      var start = performance.now(), dur = 1200;
      var tick = function (now) {
        var t = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        var value = target % 1 ? (target * eased).toFixed(1) : Math.round(target * eased);
        node.textContent = value + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(nodes, run);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: .6 });
    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
  }

  /* ---------------- gallery ---------------- */
  var GALLERY = [
    { title: 'Porcelain French',     cat: 'bridal',    finish: 'french',    palette: 'blush',    note: 'Soft-gel extension · almond' },
    { title: 'Liquid Chrome',        cat: 'editorial', finish: 'chrome',    palette: 'chrome',   note: 'Mirror powder · coffin' },
    { title: 'Carrara Study',        cat: 'editorial', finish: 'marble',    palette: 'mocha',    note: 'Hand-veined marble · almond' },
    { title: 'Wildflower Press',     cat: 'handpaint', finish: 'floral',    palette: 'sage',     note: 'Freehand florals · short square' },
    { title: 'Midnight Constellation', cat: 'editorial', finish: 'celestial', palette: 'midnight', note: 'Foil stars · stiletto' },
    { title: 'Champagne Flake',      cat: 'bridal',    finish: 'glitter',   palette: 'gold',     note: 'Encapsulated flake · almond' },
    { title: 'Ink Line Study',       cat: 'handpaint', finish: 'line',      palette: 'noir',     note: 'Fine-liner brush · squoval' },
    { title: 'Peach Jelly',          cat: 'seasonal',  finish: 'jelly',     palette: 'coral',    note: 'Sheer jelly build · round' },
    { title: 'Rose Ombré',           cat: 'bridal',    finish: 'ombre',     palette: 'rose',     note: 'Airbrushed baby boomer' },
    { title: 'House Leopard',        cat: 'seasonal',  finish: 'leopard',   palette: 'mocha',    note: 'Signature print · coffin' },
    { title: 'Violet Marble',        cat: 'editorial', finish: 'marble',    palette: 'lilac',    note: 'Alcohol-ink marble · almond' },
    { title: 'Sugar Glass',          cat: 'seasonal',  finish: 'glitter',   palette: 'lilac',    note: 'Iridescent glass gel' },
    { title: 'Botanical Noir',       cat: 'handpaint', finish: 'floral',    palette: 'noir',     note: 'One-stroke florals · long almond' },
    { title: 'Bridal Veil',          cat: 'bridal',    finish: 'french',    palette: 'rose',     note: 'Micro-french · natural length' },
    { title: 'Solar Flare',          cat: 'editorial', finish: 'ombre',     palette: 'coral',    note: 'Gradient airbrush · stiletto' },
    { title: 'Cocoa Stripe',         cat: 'handpaint', finish: 'line',      palette: 'mocha',    note: 'Negative-space linework' }
  ];

  function galleryCard(item, index) {
    var a = document.createElement('a');
    a.className = 'work';
    a.href = 'contact.html?look=' + encodeURIComponent(item.title);
    a.dataset.cat = item.cat;
    a.setAttribute('data-reveal', '');
    a.dataset.revealDelay = String((index % 3) * 80);
    a.setAttribute('aria-label', item.title + ' — ' + item.note);

    var art = document.createElement('div');
    art.className = 'art';
    art.dataset.art = item.finish;
    art.dataset.palette = item.palette;
    art.dataset.seed = item.title;
    a.appendChild(art);

    var overlay = document.createElement('div');
    overlay.className = 'work__overlay';
    overlay.innerHTML =
      '<div><div class="work__title">' + item.title + '</div>' +
      '<div class="work__sub">' + item.note + '</div></div>' +
      '<span class="work__pin" aria-hidden="true">' +
      '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 12 4M6 4h6v6"/></svg></span>';
    a.appendChild(overlay);
    return a;
  }

  function initGallery() {
    var grid = document.getElementById('gallery-grid');
    if (!grid) return;
    var limit = Number(grid.dataset.limit || GALLERY.length);
    var frag = document.createDocumentFragment();
    GALLERY.slice(0, limit).forEach(function (item, i) { frag.appendChild(galleryCard(item, i)); });
    grid.innerHTML = '';
    grid.appendChild(frag);
    if (window.NailArt) window.NailArt.mount(grid);

    var filters = document.querySelectorAll('.filter');
    var empty = document.getElementById('gallery-empty');
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.dataset.filter;
        filters.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        var shown = 0;
        grid.querySelectorAll('.work').forEach(function (card) {
          var match = cat === 'all' || card.dataset.cat === cat;
          card.classList.toggle('is-hidden', !match);
          if (match) shown++;
        });
        if (empty) empty.hidden = shown > 0;
      });
    });
  }

  /* ---------------- contact / enrolment form ---------------- */
  function initForm() {
    var form = document.getElementById('booking-form');
    if (!form) return;

    /* Pre-select a look when arriving from a gallery card. */
    var look = new URLSearchParams(window.location.search).get('look');
    var notes = form.querySelector('#notes');
    if (look && notes && !notes.value) {
      notes.value = 'I would love something like "' + look + '".';
    }
    var intent = new URLSearchParams(window.location.search).get('intent');
    var subject = form.querySelector('#subject');
    if (intent && subject) {
      Array.prototype.forEach.call(subject.options, function (opt) {
        if (opt.value === intent) subject.value = intent;
      });
    }

    var status = document.getElementById('form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('[required]').forEach(function (input) {
        var msg = input.parentElement.querySelector('.error');
        var ok = input.checkValidity() && String(input.value).trim() !== '';
        if (msg) msg.textContent = ok ? '' : (input.dataset.error || 'This field is required.');
        input.setAttribute('aria-invalid', String(!ok));
        if (!ok && valid) input.focus();
        valid = valid && ok;
      });
      if (!valid) return;

      status.hidden = false;
      status.textContent = 'Thanks, ' + form.querySelector('#name').value.trim().split(' ')[0] +
        ' — your request is in. We reply to every enquiry within one working day.';
      form.reset();
      status.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });
  }

  /* ---------------- certificate check ---------------- */
  var CERTIFICATES = [
    { id: 'LCA-2021-0142', name: 'Sarah Meadow',     level: 'Artist Diploma',    issued: '2021-05-14', years: 3 },
    { id: 'LCA-2023-0091', name: 'Jasmine Byrne',      level: 'Artist Diploma',    issued: '2023-11-02', years: 3 },
    { id: 'LCA-2024-0207', name: 'Amara Okafor',     level: 'Master &amp; Business', issued: '2024-03-20', years: 5 },
    { id: 'LCA-2025-0338', name: 'Elena Fitzgerald', level: 'Foundation',        issued: '2025-09-01', years: 2 }
  ];

  function formatCertDate(d) {
    return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function initCertCheck() {
    var form = document.getElementById('cert-form');
    var result = document.getElementById('cert-result');
    var certViz = document.querySelector('.certificate');
    if (!form || !result) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('[required]').forEach(function (input) {
        var msg = input.parentElement.querySelector('.error');
        var ok = String(input.value).trim() !== '';
        if (msg) msg.textContent = ok ? '' : (input.dataset.error || 'This field is required.');
        input.setAttribute('aria-invalid', String(!ok));
        if (!ok && valid) input.focus();
        valid = valid && ok;
      });
      if (!valid) return;

      var number = form.querySelector('#cert-number').value.trim().toUpperCase();
      var surname = form.querySelector('#cert-surname').value.trim().toLowerCase();
      var record = CERTIFICATES.filter(function (c) {
        var certSurname = c.name.split(' ').pop().toLowerCase();
        return c.id === number && certSurname === surname;
      })[0];

      result.hidden = false;

      if (!record) {
        result.innerHTML =
          '<span class="cert-pill cert-pill--unknown">No match</span>' +
          '<p class="cert-result__msg">We couldn&rsquo;t find a certificate with that number and surname. Double-check both against the printed certificate, or <a class="link-arrow" href="contact.html?intent=course">contact the academy</a>.</p>';
        return;
      }

      var issued = new Date(record.issued + 'T00:00:00');
      var expires = new Date(issued);
      expires.setFullYear(expires.getFullYear() + record.years);
      var daysLeft = Math.round((expires - new Date()) / 86400000);

      var pillClass, pillLabel, statusMsg;
      if (daysLeft < 0) {
        pillClass = 'cert-pill--expired';
        pillLabel = 'Expired';
        statusMsg = 'This certificate has expired. A refresher module is required before it can be renewed.';
      } else if (daysLeft <= 90) {
        pillClass = 'cert-pill--soon';
        pillLabel = 'Expiring soon';
        statusMsg = 'This certificate is valid but expires in ' + daysLeft + ' day' + (daysLeft === 1 ? '' : 's') +
          '. Renewal is recommended now.';
      } else {
        pillClass = 'cert-pill--valid';
        pillLabel = 'Valid';
        statusMsg = 'This certificate is valid and in good standing.';
      }

      result.innerHTML =
        '<span class="cert-pill ' + pillClass + '">' + pillLabel + '</span>' +
        '<p class="cert-result__msg">' + statusMsg + '</p>' +
        '<dl class="cert-result__grid">' +
          '<div><dt>Level</dt><dd>' + record.level + '</dd></div>' +
          '<div><dt>Issued</dt><dd>' + formatCertDate(issued) + '</dd></div>' +
          '<div><dt>Validity period</dt><dd>' + record.years + ' year' + (record.years === 1 ? '' : 's') + ' from issue</dd></div>' +
        '</dl>';

      if (certViz) {
        certViz.querySelector('.certificate__name').textContent = record.name;
        certViz.querySelector('.certificate__course').textContent = record.level + ' programme';
        certViz.querySelector('.certificate__number').textContent = 'Certificate No. ' + record.id + ' — verify it below';
        certViz.querySelector('.certificate__sig-line:first-of-type').textContent = 'Nia Fairweather';
        var dateEl = certViz.querySelectorAll('.certificate__sig-line')[1];
        if (dateEl) dateEl.textContent = formatCertDate(issued);
      }
    });
  }

  /* ---------------- misc ---------------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (n) {
      n.textContent = String(new Date().getFullYear());
    });
  }

  function init() {
    initHeader();
    initMenu();
    initFaq();
    initCounters();
    initGallery();
    initForm();
    initCertCheck();
    initYear();
    if (window.NailArt) window.NailArt.mount(document);
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
