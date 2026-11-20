/* Botree homepage — interactions (no dependencies) */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Hello bar ---------- */
  const hello = $('#hello');
  try { if (sessionStorage.getItem('botree-hello-closed') === '1') hello.hidden = true; } catch (e) {}
  $('.hello-close', hello).addEventListener('click', () => {
    hello.hidden = true;
    try { sessionStorage.setItem('botree-hello-closed', '1'); } catch (e) {}
  });

  /* ---------- Header on scroll ---------- */
  const header = $('#header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Smart nav: hide on scroll down, reveal on scroll up ---------- */
  (function smartNav() {
    let lastY = window.scrollY, ticking = false;
    const SHOW_ZONE = 160;   // always visible near the top
    const DELTA = 6;         // ignore tiny jitters
    function update() {
      ticking = false;
      const y = window.scrollY;
      const menuOpen = !!document.querySelector('.mega.open') || document.getElementById('drawer')?.classList.contains('open');
      if (y < SHOW_ZONE || menuOpen) {
        header.classList.remove('nav-hidden');
      } else if (y > lastY + DELTA) {
        header.classList.add('nav-hidden');
      } else if (y < lastY - DELTA) {
        header.classList.remove('nav-hidden');
      }
      if (Math.abs(y - lastY) > DELTA) lastY = y;
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    // Keyboard users: reveal the nav whenever focus moves into it
    header.addEventListener('focusin', () => header.classList.remove('nav-hidden'));
  })();

  /* ---------- Mega menus ---------- */
  const scrim = $('#scrim');
  const triggers = $$('.nav-trigger');
  let openId = null, hoverTimer = null;
  const canHover = () => window.matchMedia('(hover: hover)').matches;
  function openMega(id) {
    if (openId === id) return;
    closeMega(true);
    const panel = document.getElementById(id);
    if (!panel) return;
    panel.classList.add('open');
    triggers.forEach(t => t.setAttribute('aria-expanded', String(t.getAttribute('aria-controls') === id)));
    scrim.classList.add('show');
    openId = id;
  }
  function closeMega(silent) {
    if (!openId) return;
    document.getElementById(openId).classList.remove('open');
    triggers.forEach(t => t.setAttribute('aria-expanded', 'false'));
    if (!silent) scrim.classList.remove('show');
    openId = null;
  }
  triggers.forEach(t => {
    const id = t.getAttribute('aria-controls');
    t.addEventListener('click', () => (openId === id ? closeMega() : openMega(id)));
    t.addEventListener('mouseenter', () => { if (!canHover()) return; clearTimeout(hoverTimer); hoverTimer = setTimeout(() => openMega(id), 120); });
    t.addEventListener('mouseleave', () => clearTimeout(hoverTimer));
  });
  header.addEventListener('mouseleave', () => { if (!canHover()) return; clearTimeout(hoverTimer); hoverTimer = setTimeout(() => closeMega(), 220); });
  header.addEventListener('mouseenter', () => clearTimeout(hoverTimer));
  scrim.addEventListener('click', () => closeMega());
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && openId) {
      const trig = triggers.find(t => t.getAttribute('aria-controls') === openId);
      closeMega(); trig && trig.focus();
    }
  });
  document.addEventListener('click', e => { if (openId && !header.contains(e.target)) closeMega(); });

  /* ---------- Generic tabs (roving tabindex, arrow keys) ---------- */
  function setupTabs(tablist, onSelect) {
    const tabs = $$('[role="tab"]', tablist);
    function select(tab, focus) {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const id = t.getAttribute('aria-controls');
        const panel = id && document.getElementById(id);
        if (panel) {
          panel.hidden = !on;
          if (on && !reduceMotion) { panel.classList.remove('j-anim'); void panel.offsetWidth; panel.classList.add('j-anim'); }
        }
      });
      if (focus) tab.focus();
      if (tablist.scrollWidth > tablist.clientWidth) tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
      onSelect && onSelect(tabs.indexOf(tab));
    }
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', e => {
        let j = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); select(tabs[j], true); }
      });
    });
    return { select: (i, focus) => select(tabs[(i + tabs.length) % tabs.length], focus), count: tabs.length };
  }
  setupTabs($('.mega-tabs'));
  $$('[data-tabs]').forEach(tl => setupTabs(tl));

  /* ---------- Three people: metrics count up when a panel appears ---------- */
  (function () {
    const panels = $$('.tp-panel');
    if (!panels.length) return;
    function countUp(panel) {
      $$('[data-tp-count]', panel).forEach(el => {
        const to = +el.dataset.tpCount, suf = el.dataset.suffix || '';
        if (reduceMotion) { el.textContent = to + suf; return; }
        const t0 = performance.now(), dur = 900;
        (function tick(now) {
          const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * e) + suf;
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }
    // Re-run when a panel is un-hidden by the tabs
    const mo = new MutationObserver(muts => muts.forEach(m => { if (!m.target.hidden) countUp(m.target); }));
    panels.forEach(p => mo.observe(p, { attributes: true, attributeFilter: ['hidden'] }));
    // First run when the section scrolls into view
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { countUp(panels.find(p => !p.hidden)); io.disconnect(); }
      }), { threshold: 0.4 });
      io.observe($('.tp-stage'));
    }
  })();

  /* ---------- Testimonials: logo tabs + arrows ---------- */
  let tIndex = 0;
  const tTabs = setupTabs($('#t-logos'), i => { tIndex = i; });
  $('[data-t-prev]').addEventListener('click', () => tTabs.select(tIndex - 1));
  $('[data-t-next]').addEventListener('click', () => tTabs.select(tIndex + 1));

  /* ---------- Carton journey (immersive player) ---------- */
  (function journey() {
    // DUMMY COPY: stops 3–8 are draft content written (stop 1 is client copy, stop 2 is from the site PDF)
    // for layout. It must be confirmed or replaced by the client before launch.
    const STOPS = [
      // Stop 1: client-supplied copy (from the client's layout)
      { rider: 'truck', phase: 'morning', time: '6:00 am', step: 'Stop 1 of 8 · Brand and sales leadership',
        tip: 'The month’s plan is approved and goes out to the market.',
        h: 'The plan is made. Now it has to reach 5 million shelves.',
        p: 'National targets, price lists and schemes are set at headquarters and pushed to the market through your ERP.',
        wrong: 'The plan is national, but growth is won outlet by outlet. Targets and schemes lose their shape on the way down.',
        prod: ['ERP connectors', 'RnA'],
        ticks: ['Two-way sync with SAP, Tally and your ERP, so the plan reaches the market as set', 'Schemes defined once and carried to every distributor, rep and retailer'],
        prism: 'Target Disaggregation breaks national targets down to every rep and outlet, and Scheme Simulation tests a scheme before spend is committed.',
        outcome: 'Targets reach every rep and outlet the way the plan intended' },
      { rider: 'truck', phase: 'morning', time: '8:30 am', step: 'Stop 2 of 8 · The distributor',
        tip: 'Cartons leave the depot for the distributor’s warehouse.',
        h: 'The distributor decides how much of your brand to carry.',
        p: 'The distributor places a primary order and stock is dispatched from your depot.',
        wrong: 'He orders on instinct and last month’s numbers, and holds back while claims are pending. Fast lines run short midweek.',
        prod: 'Botree DMS',
        ticks: ['Primary orders suggested from real secondary sales', 'Claims and schemes settled on time, so he orders for real demand', 'Stock visibility across every distributor'],
        prism: 'Auto Replenishment suggests the next order before fast lines run out.',
        stat: '32%', statLabel: 'improvement in fill rates' },
      { rider: 'truck', phase: 'morning', time: '11:00 am', step: 'Stop 3 of 8 · The distributor',
        tip: 'Cartons are received, billed and stored for the beat.',
        h: 'Every case is billed, stored and claimed.',
        p: 'The distributor receives stock, bills retailers and files claims for the schemes he ran.',
        wrong: 'Billing is keyed in by hand, claims sit in paperwork for weeks, and slow stock ages unseen.',
        prod: 'Botree DMS',
        ticks: ['E-invoice and e-way bill built into billing', 'Claims calculated from actual scheme sales', 'Stock ageing visible before it expires'],
        prism: 'Fraudulent distributor analysis flags claims that don’t match real sales.',
        stat: '85%', statLabel: 'faster order-to-billing' },
      { rider: 'rep', phase: 'field', time: '1:30 pm', step: 'Stop 4 of 8 · The salesperson',
        tip: 'The rep starts the beat with the day’s plan on the phone.',
        h: 'The salesperson decides where your growth goes.',
        p: 'The rep visits outlets on the beat, takes orders and checks what’s on the shelf.',
        wrong: 'The same route every week. Slipping outlets get missed, and orders depend on memory.',
        prod: 'Botree SFA',
        ticks: ['Beat planned around the outlets that need a visit', 'A suggested order ready at every outlet', 'Visits verified with GPS and time stamps'],
        prism: 'Route Optimization reshapes the beat, and Product Recommender suggests the order.',
        stat: '12%', statLabel: 'increase in product assortment' },
      { rider: 'store', phase: 'field', time: '3:00 pm', step: 'Stop 5 of 8 · The retailer',
        tip: 'Your carton reaches the store counter.',
        h: 'The retailer decides who earns the shelf.',
        p: 'The retailer chooses what to stock, how much, and which schemes are worth it.',
        wrong: 'He orders what the rep remembers to mention, and rarely hears about the latest scheme.',
        prod: 'Botree Retailer App',
        ticks: ['Live schemes and offers on his own phone', 'Past orders ready to repeat in one tap', 'Delivery status he can track'],
        prism: 'AI Ordering prepares the order from buying patterns and live schemes.',
        stat: 'One tap', statLabel: 'to confirm a suggested order' },
      { rider: 'store', phase: 'field', time: '4:30 pm', step: 'Stop 6 of 8 · Rep and retailer',
        tip: 'Your brand goes on the shelf.',
        h: 'Your brand shows up the way it was planned.',
        p: 'The rep checks shelf placement, displays and range against the plan.',
        wrong: 'Displays go up late or not at all, and nobody at HQ knows until the month ends.',
        prod: 'Botree SFA',
        ticks: ['Photo audits of shelves and displays', 'Range gaps listed outlet by outlet', 'Merchandising tasks assigned to the beat'],
        prism: 'AI Nudges prompt the rep on range gaps and low stock while still in the store.',
        stat: 'Same day', statLabel: 'range gaps closed' },
      { rider: 'store', phase: 'night', time: '9:00 pm', step: 'Stop 7 of 8 · The retailer',
        tip: 'The store closes. The shelf keeps telling you what sold.',
        h: 'The shelf reorders itself after closing.',
        p: 'After closing, the retailer checks what sold and tops up for tomorrow.',
        wrong: 'Reorders wait for the next rep visit, so fast lines sit empty for days.',
        prod: 'Botree Retailer App',
        ticks: ['Reorder anytime, not only on visit days', 'Suggested quantities from what actually sold', 'The order goes straight to the distributor'],
        prism: 'Product Recommender suggests what to reorder before the shelf runs dry.',
        stat: 'Before morning', statLabel: 'reorders reach the distributor' },
      { rider: 'signal', phase: 'night', time: '11:00 pm', step: 'Stop 8 of 8 · Your HQ',
        tip: 'The day’s sales travel back to HQ.',
        h: 'Every sale comes back as tomorrow’s decision.',
        p: 'Orders, visits and sales from the day flow back to HQ overnight.',
        wrong: 'Secondary sales arrive weeks late in spreadsheets, so decisions run on old numbers.',
        prod: 'Botree Prism',
        ticks: ['Secondary sales visible by distributor, beat and outlet', 'Channel performance tracked every day', 'Tomorrow’s targets and beats adjusted from today’s sales'],
        prism: 'Outletpulse and the Channel Performance Dashboard show what to fix tomorrow.',
        stat: '100%', statLabel: 'visibility into secondary sales' }
    ];

    const section = $('#journey');
    const player = $('#jx-player');
    const timeline = $('#timeline');
    if (!section || !timeline) return;
    const items = $$('.tl-stop', timeline);
    const buttons = items.map(li => $('.tl-btn', li));
    const segs = $$('.jx-prog i', player);
    const detail = $('#j-detail');
    const fillEl = $('#tl-fill');
    const rider = $('#tl-truck');
    const lineEl = $('.tl-line', timeline);
    const playBtn = $('[data-j-play]');
    const ring = $('.jx-ring circle', player);
    let idx = 1, playing = !reduceMotion, hold = false, visible = false, rmTimer = null;
    const SKY = ['dawn', 'morning', 'morning', 'day', 'day', 'dusk', 'night', 'night'];
    const caption = $('#j-tip'), sun = $('#jr-sun');

    const set = (id, v) => { $(id).textContent = v; };

    function position() {
      const dot = $('.dot', buttons[idx]);
      const t = timeline.getBoundingClientRect();
      const d = dot.getBoundingClientRect();
      const l = lineEl.getBoundingClientRect();
      const x = d.left + d.width / 2;
      fillEl.style.width = Math.max(0, x - l.left) + 'px';
      rider.style.left = (x - t.left) + 'px';
      if (caption) {
        const half = Math.min(caption.offsetWidth / 2, t.width / 2);
        caption.style.left = Math.min(Math.max(x - t.left, half + 16), t.width - half - 16) + 'px';
      }
      if (sun) {
        const p = idx / (STOPS.length - 1);
        sun.style.left = (6 + p * 88) + '%';
        sun.style.top = (54 - Math.sin(Math.PI * Math.min(p, .85) / .85) * 34) + 'px';
      }
    }

    function render(animate) {
      const s = STOPS[idx];
      items.forEach((li, i) => {
        li.classList.toggle('active', i === idx);
        li.classList.toggle('past', i < idx);
        buttons[i].setAttribute('aria-expanded', String(i === idx));
      });
      set('#j-time', s.time); set('#j-step', s.step); set('#j-tip', s.tip);
      set('#j-h', s.h); set('#j-p', s.p); set('#j-wrong', s.wrong); set('#j-prism-t', s.prism);
      const tags = $('#j-prod'); tags.textContent = '';
      [].concat(s.prod).forEach(p => { const t = document.createElement('span'); t.textContent = p; tags.append(t); });
      const ticks = $('#j-ticks'); ticks.textContent = '';
      s.ticks.forEach(t => { const li = document.createElement('li'); li.textContent = t; ticks.append(li); });
      const out = $('#j-fill'); out.textContent = '';
      out.classList.toggle('is-text', !!s.outcome);
      if (s.outcome) {
        const b = document.createElement('b'); b.textContent = 'OUTCOME';
        const o = document.createElement('span'); o.textContent = s.outcome;
        out.append(b, o);
      } else {
        const fs = document.createElement('strong'); fs.textContent = s.stat;
        const fl = document.createElement('span'); fl.textContent = s.statLabel;
        out.append(fs, fl);
      }
      section.dataset.phase = s.phase;
      section.dataset.sky = SKY[idx];
      if (rider.dataset.rider !== s.rider) rider.dataset.rider = s.rider;
      if (animate && !reduceMotion) {
        detail.classList.remove('j-anim'); caption.classList.remove('pop');
        void detail.offsetWidth;
        detail.classList.add('j-anim'); caption.classList.add('pop');
        timeline.classList.add('driving');
        clearTimeout(render.t); render.t = setTimeout(() => timeline.classList.remove('driving'), 1200);
      }
      requestAnimationFrame(position);
    }

    function updatePaused() { player.classList.toggle('paused', hold || !visible || document.hidden); }
    function restartCount() {
      player.classList.remove('counting');
      void player.offsetWidth;
      if (playing && !reduceMotion) player.classList.add('counting');
    }
    function go(i, focus) {
      idx = (i + STOPS.length) % STOPS.length;
      render(true);
      restartCount();
      if (focus) buttons[idx].focus();
    }
    function setPlaying(on) {
      playing = on;
      player.classList.toggle('is-playing', on);
      playBtn.setAttribute('aria-label', on ? 'Pause journey' : 'Play journey');
      clearInterval(rmTimer);
      if (reduceMotion && on) rmTimer = setInterval(() => { if (!hold && visible && !document.hidden) go(idx + 1); }, 6500);
      restartCount();
    }

    // The countdown ring drives autoplay: when it completes, advance.
    ring.addEventListener('animationend', () => { if (playing) go(idx + 1); });

    buttons.forEach((b, i) => {
      b.addEventListener('click', () => go(i));
      // Hover drives the journey too: rest on a stop briefly and the vehicle drives there
      let hoverT = null;
      b.addEventListener('mouseenter', () => { clearTimeout(hoverT); hoverT = setTimeout(() => { if (i !== idx) go(i); }, 140); });
      b.addEventListener('mouseleave', () => clearTimeout(hoverT));
      b.addEventListener('keydown', e => {
        let j = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = i + 1;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = i - 1;
        else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = STOPS.length - 1;
        if (j !== null) { e.preventDefault(); setPlaying(false); go(j, true); }
      });
    });
    $('[data-j-prev]').addEventListener('click', () => go(idx - 1));
    $('[data-j-next]').addEventListener('click', () => go(idx + 1));
    // Only the Pause button stops the loop for good; hovering the road just holds it
    let userPaused = false;
    playBtn.addEventListener('click', () => { userPaused = playing; setPlaying(!playing); });
    timeline.addEventListener('mouseenter', () => { hold = true; updatePaused(); });
    timeline.addEventListener('mouseleave', () => { hold = false; updatePaused(); if (!userPaused && !reduceMotion && !playing) setPlaying(true); });
    timeline.addEventListener('focusin', () => { hold = true; updatePaused(); });
    timeline.addEventListener('focusout', () => { hold = false; updatePaused(); });
    document.addEventListener('visibilitychange', updatePaused);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; updatePaused(); }, { threshold: 0.35 }).observe(player);
    } else visible = true;
    window.addEventListener('resize', position);
    window.addEventListener('load', position);
    if ('ResizeObserver' in window) new ResizeObserver(position).observe(timeline);

    updatePaused();
    render(false);
    setPlaying(playing);
  })();

  /* ---------- Flow diagram: hover/focus highlights a path; idle auto-cycle ---------- */
  (function flowDiagram() {
    const fd = $('#fd');
    if (!fd) return;
    const ins = $$('[data-i]', fd), outs = $$('[data-o]', fd);
    const inPaths = $$('.fd-lines .in path', fd), outPaths = $$('.fd-lines .out path', fd);
    let auto = -1, timer = null, user = false;

    function setActive(i, o) {
      const any = i !== null || o !== null;
      fd.classList.toggle('focus', any);
      ins.forEach((b, j) => b.classList.toggle('on', j === i));
      inPaths.forEach((p, j) => p.classList.toggle('on', j === i));
      outs.forEach((b, j) => b.classList.toggle('on', o === 'all' || j === o));
      outPaths.forEach((p, j) => p.classList.toggle('on', o === 'all' || j === o));
    }

    // Source → Prism → every outcome
    ins.forEach((b, j) => {
      const on = () => { user = true; setActive(j, 'all'); };
      const off = () => { user = false; setActive(null, null); };
      b.addEventListener('mouseenter', on); b.addEventListener('focus', on);
      b.addEventListener('mouseleave', off); b.addEventListener('blur', off);
    });
    // Outcome → its own line (all sources feed it)
    outs.forEach((b, j) => {
      const on = () => { user = true; setActive(null, j); inPaths.forEach(p => p.classList.add('on')); };
      const off = () => { user = false; setActive(null, null); };
      b.addEventListener('mouseenter', on); b.addEventListener('focus', on);
      b.addEventListener('mouseleave', off); b.addEventListener('blur', off);
    });

  })();

  /* ---------- Mobile drawer ---------- */
  const drawer = $('#drawer');
  const menuBtn = $('.nav-shell .menu-toggle');
  let lastFocus = null;
  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.classList.add('open');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('[data-close-drawer]', drawer).focus(), 50);
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    (lastFocus || menuBtn).focus();
  }
  menuBtn.addEventListener('click', openDrawer);
  $('[data-close-drawer]', drawer).addEventListener('click', closeDrawer);
  drawer.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
    if (e.key !== 'Tab') return;
    const f = $$('a, button, summary', drawer).filter(el => el.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
  $$('details', drawer).forEach(d => d.addEventListener('toggle', () => {
    if (d.open) $$('details', drawer).forEach(o => { if (o !== d) o.open = false; });
  }));
  window.addEventListener('resize', () => { if (window.innerWidth > 1023 && drawer.classList.contains('open')) closeDrawer(); });

  /* ---------- Video modal ---------- */
  const modal = $('#video-modal');
  const frame = $('#video-frame');
  $$('[data-video]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-video');
    frame.textContent = '';
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
    iframe.title = 'Customer story video';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    frame.appendChild(iframe);
    if (typeof modal.showModal === 'function') modal.showModal();
    else window.open('https://youtu.be/' + id, '_blank', 'noopener');
  }));
  $('[data-close-video]').addEventListener('click', () => modal.close());
  modal.addEventListener('close', () => { frame.textContent = ''; });
  modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });

  /* ---------- Count-up (final text always equals the source copy) ---------- */
  function countUp(el) {
    const finalText = el.textContent.trim();
    const m = finalText.match(/^(\D*)([\d.,]+)(.*)$/);
    if (!m || reduceMotion) return;
    const [, prefix, numStr, suffix] = m;
    const decimals = (numStr.split('.')[1] || '').length;
    const target = parseFloat(numStr.replace(/,/g, ''));
    const start = performance.now(), dur = 1300;
    el.setAttribute('aria-label', finalText);
    (function frameFn(now) {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = prefix + (target * (1 - Math.pow(1 - t, 3))).toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(frameFn); else el.textContent = finalText;
    })(start);
  }

  /* ---------- Reveal + sticky mobile CTA ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        $$('[data-count]', en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach((el, i) => { el.style.transitionDelay = reduceMotion ? '0ms' : ((i % 4) * 70) + 'ms'; io.observe(el); });

    const sticky = $('#sticky-cta');
    let heroOut = false, footIn = false;
    const update = () => sticky.classList.toggle('show', heroOut && !footIn);
    new IntersectionObserver(([e]) => { heroOut = !e.isIntersecting; update(); }).observe($('.hero'));
    new IntersectionObserver(([e]) => { footIn = e.isIntersecting; update(); }).observe($('.site-footer'));
  } else {
    $$('.reveal').forEach(el => el.classList.add('in'));
  }
})();

/* Three people: headline icons select the matching person (mouse shortcut; the tabs stay the keyboard path) */
(function () {
  var tabs = document.querySelectorAll('.tw-list [role="tab"]');
  document.querySelectorAll('.tw-faces i').forEach(function (f) {
    f.addEventListener('click', function () { var t = tabs[+f.dataset.i]; if (t) t.click(); });
  });
})();

/* Integration orbit: hovering a card lights its connection to Botree */
(function () {
  var stage = document.getElementById('ox');
  if (!stage) return;
  stage.querySelectorAll('.ox-node').forEach(function (n) {
    n.addEventListener('mouseenter', function () { stage.dataset.hot = n.dataset.s; });
    n.addEventListener('mouseleave', function () { delete stage.dataset.hot; });
  });
})();

/* Integration orbit — True orbit: chips travel the rings, stay upright, pause on hover */
(function () {
  var stage = document.getElementById('ox');
  if (!stage) return;
  var nodes = Array.prototype.slice.call(stage.querySelectorAll('.ox-node'));
  var spokes = nodes.map(function (n) { return stage.querySelector('.ox-spoke[data-s="' + n.dataset.s + '"]'); });
  var RINGS = { 1: [150, 150], 2: [228, 228], 3: [306, 306] }, CX = 600, CY = 330;
  var SPEED = { 1: 0.07, 2: 0.07, 3: 0.07 };        // one shared speed keeps the six chips evenly spaced        // radians per second
  var ang = nodes.map(function (n) { return (+n.dataset.a) * Math.PI / 180; });
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = false, last = 0;

  function place() {
    nodes.forEach(function (n, i) {
      var r = RINGS[n.dataset.ring], a = ang[i];
      var x = CX + r[0] * Math.cos(a), y = CY + r[1] * Math.sin(a);
      var depth = (Math.sin(a) + 1) / 2;                // 0 = back (top), 1 = front (bottom)
      n.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)';
      n.style.zIndex = n.matches(':hover, :focus') ? 20 : 3 + Math.round(depth * 10);
      if (spokes[i]) spokes[i].setAttribute('d', 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' L600 280');
    });
  }
  function frame(t) {
    var dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    if (visible && !stage.dataset.hot && !document.hidden) {
      nodes.forEach(function (n, i) { ang[i] += SPEED[n.dataset.ring] * dt; });
      place();
    }
    requestAnimationFrame(frame);
  }
  nodes.forEach(function (n) {
    n.addEventListener('focus', function () { stage.dataset.hot = n.dataset.s; place(); });
    n.addEventListener('blur', function () { delete stage.dataset.hot; });
    n.addEventListener('mouseenter', function () { requestAnimationFrame(place); });
  });
  place();
  if (still) return;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(stage);
  else visible = true;
  requestAnimationFrame(frame);
})();

/* Testimonials: split a leading number in each story headline into a big stat + label (text unchanged) */
(function () {
  document.querySelectorAll('.t-copy .tag').forEach(function (h) {
    var text = h.textContent.trim();
    var m = text.match(/^(\d[\d.,]*\s*[%+xX]?)\s+(.+)$/);
    if (!m) { h.classList.add('t-word'); return; }
    h.textContent = '';
    var n = document.createElement('span'); n.className = 't-num'; n.textContent = m[1];
    var l = document.createElement('span'); l.className = 't-lbl'; l.textContent = ' ' + m[2];
    h.append(n, l);
  });
})();

/* Footer wordmark (first version, aligned): a liquid-edged gradient spot follows the cursor; star sparkles trail it */
(function () {
  var wm = document.querySelector('.wm');
  if (!wm || !window.matchMedia('(hover: hover)').matches) return;
  var svg = wm.querySelector('.wm-svg'), spot = wm.querySelector('#wmSpot'), sparks = wm.querySelector('.wm-sparks');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLORS = ['#FF7A3D', '#FF4F7B', '#D63BE0', '#FFB27A'];
  var R = 260, cur = { x: -500, y: -500 }, tgt = { x: -500, y: -500 }, r = 0, want = 0, running = false, lastSpark = 0;

  function toSvg(e) { var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
  function frame() {
    var k = still ? 1 : 0.18;
    cur.x += (tgt.x - cur.x) * k; cur.y += (tgt.y - cur.y) * k;
    r += (want - r) * (still ? 1 : 0.1);
    spot.setAttribute('cx', cur.x.toFixed(1)); spot.setAttribute('cy', cur.y.toFixed(1)); spot.setAttribute('r', (R * r).toFixed(1));
    if (r > 0.005 || want) requestAnimationFrame(frame); else running = false;
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }

  wm.addEventListener('pointerenter', function (e) { var p = toSvg(e); tgt = { x: p.x, y: p.y }; cur = { x: p.x, y: p.y }; want = 1; wm.classList.add('on'); kick(); });
  wm.addEventListener('pointerleave', function () { want = 0; wm.classList.remove('on'); kick(); });
  wm.addEventListener('pointermove', function (e) {
    var p = toSvg(e); tgt = { x: p.x, y: p.y }; kick();
    if (still) return;
    var now = performance.now();
    if (now - lastSpark < 45 || sparks.childElementCount > 28) return;
    lastSpark = now;
    var w = wm.getBoundingClientRect(), s = document.createElement('i'), size = 6 + Math.random() * 12;
    s.className = 'wm-spark v1';
    s.style.cssText = 'left:' + (e.clientX - w.left + (Math.random() - .5) * 60) + 'px;top:' + (e.clientY - w.top + (Math.random() - .5) * 60) +
      'px;width:' + size + 'px;height:' + size + 'px;--c:' + COLORS[(Math.random() * COLORS.length) | 0] + ';--dx:' + ((Math.random() - .5) * 40) + 'px;--dy:' + (-20 - Math.random() * 40) + 'px';
    s.addEventListener('animationend', function () { s.remove(); });
    sparks.appendChild(s);
  });
})();
