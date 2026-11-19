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

  /* ---------- Testimonials: logo tabs + arrows ---------- */
  let tIndex = 0;
  const tTabs = setupTabs($('#t-logos'), i => { tIndex = i; });
  $('[data-t-prev]').addEventListener('click', () => tTabs.select(tIndex - 1));
  $('[data-t-next]').addEventListener('click', () => tTabs.select(tIndex + 1));

  /* ---------- Carton journey (vertical timeline) ---------- */
  (function journey() {
    const TODO = 'copy to supply';
    // Index 1 is the only stop shown in the reference; the others render marked placeholders.
    const STOPS = [
      { label: 'Factory and HQ' },
      {
        label: 'Primary dispatch', time: '8:30 am',
        tip: 'Cartons leave the depot for the distributor’s warehouse.',
        step: 'Stop 2 of 8 · The distributor',
        h: 'The distributor decides how much of your brand to carry.',
        p: 'The distributor places a primary order and stock is dispatched from your depot.',
        wrong: 'He orders on instinct and last month’s numbers, and holds back while claims are pending. Fast lines run short midweek.',
        prod: 'Botree DMS',
        ticks: ['Primary orders suggested from real secondary sales', 'Claims and schemes settled on time, so he orders for real demand', 'Stock visibility across every distributor'],
        prism: 'Auto Replenishment suggests the next order before fast lines run out.',
        stat: '32%', statLabel: 'improvement in fill rates'
      },
      { label: 'Distributor warehouse' },
      { label: 'On the beat' },
      { label: 'At the store counter' },
      { label: 'In-store execution' },
      { label: 'Store, after hours' },
      { label: 'Back to HQ' }
    ];

    const timeline = $('#timeline');
    const items = $$('.tl-stop', timeline);
    const buttons = items.map(li => $('.tl-btn', li));
    const detail = $('#j-detail');
    const fillEl = $('#tl-fill');
    const truck = $('#tl-truck');
    const lineEl = $('.tl-line', timeline);
    const time = $('#j-time');
    const playBtn = $('[data-j-play]');
    let idx = 1, timer = null, playing = !reduceMotion, hold = false;

    const todo = text => { const s = document.createElement('span'); s.className = 'todo'; s.textContent = `[${text} — ${TODO}]`; return s; };
    const setText = (el, value, placeholder) => { el.textContent = ''; el.append(value ? document.createTextNode(value) : todo(placeholder)); };
    const labelled = (el, label, value, placeholder) => {
      el.textContent = '';
      const b = document.createElement('b'); b.textContent = label;
      el.append(b, document.createTextNode(' '), value ? document.createTextNode(value) : todo(placeholder));
    };

    function position() {
      const dot = $('.dot', buttons[idx]);
      const t = timeline.getBoundingClientRect();
      const d = dot.getBoundingClientRect();
      const l = lineEl.getBoundingClientRect();
      const y = d.top + d.height / 2;
      fillEl.style.height = Math.max(0, y - l.top) + 'px';
      truck.style.top = (y - t.top) + 'px';
    }

    function render(animate) {
      const s = STOPS[idx];
      items.forEach((li, i) => {
        const on = i === idx;
        li.classList.toggle('active', on);
        buttons[i].setAttribute('aria-expanded', String(on));
      });
      items[idx].appendChild(detail);
      setText(time, s.time, 'time');
      setText($('#j-tip'), s.tip, `Stop ${idx + 1} caption`);
      setText($('#j-step'), s.step, `Stop ${idx + 1} of 8 label`);
      setText($('#j-h'), s.h, `${s.label} headline`);
      setText($('#j-p'), s.p, `${s.label} description`);
      labelled($('#j-wrong'), 'What usually goes wrong:', s.wrong, 'what goes wrong');
      setText($('#j-prod'), s.prod, 'product');
      const ticks = $('#j-ticks'); ticks.textContent = '';
      (s.ticks || [null]).forEach(t => { const li = document.createElement('li'); li.append(t ? document.createTextNode(t) : todo('with-Botree points')); ticks.append(li); });
      labelled($('#j-prism'), 'Prism here:', s.prism, 'Prism module');
      const fill = $('#j-fill'); fill.textContent = '';
      if (s.stat) {
        const fs = document.createElement('strong'); fs.textContent = s.stat;
        const fl = document.createElement('span'); fl.textContent = s.statLabel;
        fill.append(fs, fl);
      } else fill.append(todo('stat'));
      if (animate && !reduceMotion) { detail.classList.remove('j-anim'); void detail.offsetWidth; detail.classList.add('j-anim'); }
      requestAnimationFrame(position);
    }

    function go(i, focus) {
      idx = (i + STOPS.length) % STOPS.length;
      render(true);
      if (focus) buttons[idx].focus();
    }
    function tick() {
      if (!playing || hold || document.hidden) return;
      const r = timeline.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return; // advance only while visible
      go(idx + 1);
    }
    function setPlaying(on) {
      playing = on;
      playBtn.textContent = on ? 'Pause' : 'Play';
      playBtn.setAttribute('aria-pressed', String(!on));
      clearInterval(timer);
      if (on) timer = setInterval(tick, 6500);
    }

    buttons.forEach((b, i) => {
      b.addEventListener('click', () => { setPlaying(false); go(i); });
      b.addEventListener('keydown', e => {
        let j = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = i + 1;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = i - 1;
        else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = STOPS.length - 1;
        if (j !== null) { e.preventDefault(); setPlaying(false); go(j, true); }
      });
    });
    $('[data-j-prev]').addEventListener('click', () => { setPlaying(false); go(idx - 1); });
    $('[data-j-next]').addEventListener('click', () => { setPlaying(false); go(idx + 1); });
    playBtn.addEventListener('click', () => setPlaying(!playing));
    timeline.addEventListener('mouseenter', () => { hold = true; });
    timeline.addEventListener('mouseleave', () => { hold = false; });
    timeline.addEventListener('focusin', () => { hold = true; });
    timeline.addEventListener('focusout', () => { hold = false; });
    window.addEventListener('resize', position);
    window.addEventListener('load', position);
    if ('ResizeObserver' in window) new ResizeObserver(position).observe(timeline);

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

    // Idle auto-cycle through the sources while the diagram is on screen
    if (reduceMotion) return;
    function tick() {
      if (user || document.hidden) return;
      const r = fd.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      auto = (auto + 1) % ins.length;
      setActive(auto, auto % outs.length);
    }
    timer = setInterval(tick, 1800);
    fd.addEventListener('mouseleave', () => { if (!user) setActive(null, null); });
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
