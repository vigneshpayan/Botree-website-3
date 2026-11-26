/* Botree homepage V2 */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* Fires cb(el, entry) when an element crosses the middle band of the viewport */
  const midObserver = (els, cb, margin = '-45% 0px -45% 0px') => {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && cb(e.target, e)), { rootMargin: margin });
    els.forEach(el => io.observe(el));
  };

  /* ---------- Header: border once scrolled ---------- */
  const top = $('#top');
  const onScroll = () => top.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Hero map: HQ → distributors → reps → shelves ---------- */
  (function map() {
    const svg = $('#map');
    if (!svg) return;
    const el = (tag, attrs, parent = svg) => {
      const n = document.createElementNS(SVGNS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      parent.appendChild(n);
      return n;
    };
    const defs = el('defs', {});
    const g = el('linearGradient', { id: 'mapGrad', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    [['0', '#FF7A45'], ['.55', '#F72585'], ['1', '#8B3DFF']].forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, g));

    const HQ = [56, 230];
    const D = [[200, 100], [200, 230], [200, 360]];
    const R = [[340, 60], [340, 140], [340, 200], [340, 260], [340, 320], [340, 400]];
    const S = [];
    for (let i = 0; i < 16; i++) S.push([500, 28 + i * 26]);
    const curve = ([x1, y1], [x2, y2]) => `M${x1} ${y1} C${(x1 + x2) / 2} ${y1} ${(x1 + x2) / 2} ${y2} ${x2} ${y2}`;

    const wires = el('g', {});
    const paths = [];
    D.forEach(d => paths.push(el('path', { class: 'wire w1', d: curve(HQ, d) }, wires)));
    R.forEach((r, i) => paths.push(el('path', { class: 'wire w1', d: curve(D[Math.floor(i / 2)], r) }, wires)));
    S.forEach((s, i) => el('path', { class: 'wire', d: curve(R[Math.floor(i / (S.length / R.length))] || R[R.length - 1], s) }, wires));

    const shelves = S.map(([x, y]) => { const n = el('g', { class: 'n-s' }); el('rect', { x: x - 9, y: y - 8, width: 18, height: 16, rx: 4 }, n); return n; });
    R.forEach(([x, y]) => { const n = el('g', { class: 'n-r' }); el('circle', { cx: x, cy: y, r: 8 }, n); });
    D.forEach(([x, y]) => { const n = el('g', { class: 'n-d' }); el('circle', { cx: x, cy: y, r: 12 }, n); });
    const hq = el('g', { class: 'n-hq' });
    el('rect', { x: HQ[0] - 44, y: HQ[1] - 22, width: 88, height: 44, rx: 12 }, hq);
    const t = el('text', { x: HQ[0], y: HQ[1] + 5, 'text-anchor': 'middle' }, hq); t.textContent = 'HQ plan';

    if (reduce) { shelves.forEach(s => s.classList.add('lit')); return; }
    // Pulses travel HQ → distributor → rep, then light a shelf
    const pulse = (i) => {
      const di = i % 3, ri = di * 2 + (Math.random() > .5 ? 1 : 0);
      const route = [curve(HQ, D[di]), curve(D[di], R[ri])].join(' ').replace(/ M/g, ' L');
      const dot = el('circle', { class: 'pulse', r: 4 });
      const anim = el('animateMotion', { dur: '1.8s', path: route, fill: 'freeze', calcMode: 'spline', keyTimes: '0;1', keySplines: '.4 0 .2 1' }, dot);
      anim.beginElement();
      setTimeout(() => {
        dot.remove();
        const per = S.length / R.length;
        const s = shelves[Math.min(S.length - 1, Math.floor(ri * per + Math.random() * per))];
        s.classList.add('lit');
        setTimeout(() => s.classList.remove('lit'), 2600);
      }, 1800);
    };
    let n = 0;
    setInterval(() => document.visibilityState === 'visible' && pulse(n++), 650);
  })();

  /* ---------- Logo marquee: duplicate for a seamless loop ---------- */
  const track = $('#logo-track');
  if (track && !reduce) track.innerHTML += track.innerHTML.replace(/alt="[^"]*"/g, 'alt="" aria-hidden="true"');

  /* ---------- 01 Problem: each pain lights up as it reaches the middle ---------- */
  const pains = $$('.pain');
  midObserver(pains, p => pains.forEach(x => x.classList.toggle('is-on', x === p)), '-35% 0px -35% 0px');

  /* ---------- 02 Outcomes: rows flip from Today to With Botree ---------- */
  const rowIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    $$('[data-count]', e.target).forEach(countUp);
    rowIO.unobserve(e.target);
  }), { threshold: .6 });
  $$('.ba-row').forEach(r => rowIO.observe(r));

  /* ---------- Count-up for numbers like $36B, 18M+, 85% ---------- */
  function countUp(node) {
    if (node.dataset.done) return;
    node.dataset.done = 1;
    const raw = node.textContent.trim();
    const m = raw.match(/^([^\d]*)([\d.]+)(.*)$/);
    if (!m || reduce) return;
    const [, pre, num, post] = m, target = parseFloat(num), dec = (num.split('.')[1] || '').length;
    const t0 = performance.now(), dur = 1400;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      node.textContent = pre + (target * e).toFixed(dec) + post;
      if (k < 1) requestAnimationFrame(step); else node.textContent = raw;
    };
    requestAnimationFrame(step);
  }
  const statIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { $$('[data-count]', e.target).forEach(countUp); statIO.unobserve(e.target); }
  }), { threshold: .4 });
  const stats = $('.stats'); if (stats) statIO.observe(stats);

  /* ---------- 03 Prism scene: pinned on desktop, scroll moves through the 4 levels ---------- */
  (function prismScene() {
    const scene = $('#engine');
    if (!scene) return;
    const eng = $('#eng'), caps = $$('.cap', scene), box = $('#core-sample'), fill = $('#pstep-fill'), now = $('#core-now');
    const btns = $$('.pstep button', scene);
    const steps = $$('.core-steps li', scene);
    const ins = $$('.eng-in i', scene), outs = $$('.eng-out i', scene);
    const NOW = ['01 · Sees', '02 · Predicts', '03 · Prescribes', '04 · Acts'];
    // The core shows each level's sample card; the stacked (mobile) cards keep their own copy
    caps.forEach(c => { box.appendChild($('.cs', c).cloneNode(true)); });
    const samples = $$('.cs', box);

    let cur = -1, pinned = false, ticking = false;
    const set = l => {
      if (l === cur) return;
      cur = l;
      eng.dataset.l = l;
      caps.forEach((c, i) => c.classList.toggle('is-on', i === l));
      samples.forEach((c, i) => c.classList.toggle('on', i === l));
      btns.forEach((b, i) => { b.classList.toggle('is-on', i === l); b.classList.toggle('done', i < l); b.toggleAttribute('aria-current', i === l); });
      steps.forEach((s, i) => { s.classList.toggle('lit', i <= l); s.classList.toggle('now', i === l); });
      now.textContent = NOW[l];
      // Context lights up first; outcomes arrive as Prism starts prescribing and acting
      const inCount = Math.round(ins.length * Math.min(1, (l + 1) / 2));
      ins.forEach((x, i) => x.classList.toggle('lit', i < inCount));
      const outCount = l < 2 ? 0 : l === 2 ? 2 : outs.length;
      outs.forEach((x, i) => x.classList.toggle('lit', i < outCount));
    };
    const metrics = () => {
      const topH = top.offsetHeight, stageH = innerHeight - topH;
      const start = scene.getBoundingClientRect().top + scrollY - topH;
      return { start, total: Math.max(1, scene.offsetHeight - stageH) };
    };
    const update = () => {
      ticking = false;
      if (!pinned) return;
      const { start, total } = metrics();
      const p = Math.min(1, Math.max(0, (scrollY - start) / total));
      fill.style.setProperty('--p', p.toFixed(3));
      set(Math.min(3, Math.floor(p * 4)));
    };
    const mode = () => {
      pinned = !reduce && innerWidth > 1024 && innerHeight >= 640;
      scene.classList.toggle('pin', pinned);
      cur = -1;
      if (pinned) update(); else set(3);
    };
    addEventListener('scroll', () => { if (pinned && !ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', mode);
    btns.forEach((b, i) => b.addEventListener('click', () => {
      const { start, total } = metrics();
      scrollTo({ top: start + total * (i + 0.5) / 4, behavior: reduce ? 'auto' : 'smooth' });
    }));
    mode();
  })();

  /* ---------- Tabs helper (roving tabindex, arrow keys) ---------- */
  function tabs(list, onSelect) {
    const btns = $$('[role="tab"]', list);
    const select = (i, focus) => {
      i = (i + btns.length) % btns.length;
      btns.forEach((b, j) => {
        const on = i === j;
        b.setAttribute('aria-selected', on);
        b.tabIndex = on ? 0 : -1;
        const p = document.getElementById(b.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      if (focus) btns[i].focus();
      onSelect && onSelect(i);
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => select(i));
      b.addEventListener('keydown', e => {
        const k = e.key, cur = btns.indexOf(document.activeElement);
        if (['ArrowDown', 'ArrowRight'].includes(k)) { e.preventDefault(); select(cur + 1, true); }
        if (['ArrowUp', 'ArrowLeft'].includes(k)) { e.preventDefault(); select(cur - 1, true); }
        if (k === 'Home') { e.preventDefault(); select(0, true); }
        if (k === 'End') { e.preventDefault(); select(btns.length - 1, true); }
      });
    });
    return { select };
  }
  tabs($('.jobs-tabs'));

  /* ---------- Ask Prism chat (sample answers) ---------- */
  (function chat() {
    // SAMPLE answers written for the demo. Confirm wording with the client before launch.
    const QA = [
      ['Which outlets should Beat 4 visit tomorrow?', '28 outlets, ranked by order potential. Six of them haven’t ordered in three weeks. <strong>A revised beat is ready for the rep’s approval.</strong>'],
      ['Is the festive scheme paying back?', 'It is lifting sell-out on two of five lines. On the other three, outlets are buying the same volume as before. <strong>A narrower scheme is ready to simulate.</strong>'],
      ['Why are secondary sales down in Madurai this month?', 'Three distributors are under 3 days of stock on fast lines, and 142 outlets on Beat 9 were not visited in two weeks. <strong>Reorders and a revised beat are ready for review.</strong>']
    ];
    const log = $('#chat-log');
    const btns = $$('.chat-try button');
    let busy = false;
    btns.forEach(b => b.addEventListener('click', () => {
      if (busy) return;
      busy = true;
      btns.forEach(x => x.setAttribute('aria-pressed', x === b));
      const [q, a] = QA[+b.dataset.q];
      log.innerHTML = '';
      const pq = document.createElement('p'); pq.className = 'q'; pq.textContent = q; log.appendChild(pq);
      const typing = document.createElement('p'); typing.className = 'a typing'; typing.setAttribute('aria-label', 'Prism is typing');
      typing.innerHTML = '<i></i><i></i><i></i>';
      setTimeout(() => log.appendChild(typing), reduce ? 0 : 250);
      setTimeout(() => {
        typing.remove();
        const pa = document.createElement('p'); pa.className = 'a'; pa.innerHTML = a; log.appendChild(pa);
        busy = false;
      }, reduce ? 0 : 1300);
    }));
  })();

  /* ---------- 04 Prism in action: the day, stop by stop ---------- */
  (function day() {
    // DUMMY COPY: stops 3–8 are draft content carried over from V1 (stop 1 is client copy,
    // stop 2 from the site PDF). Confirm or replace with the client before launch.
    const STOPS = [
      { time: '6:00 am', sky: 'dawn', who: 'Brand and sales leadership', name: 'Factory and HQ', prod: 'ERP connectors',
        h: 'The plan is made. Now it has to reach 5 million shelves.',
        p: 'National targets, price lists and schemes are set at headquarters and pushed to the market through your ERP.',
        wrong: 'The plan is national, but growth is won outlet by outlet. Targets and schemes lose their shape on the way down.',
        prism: 'Target Disaggregation breaks national targets down to every rep and outlet, and Scheme Simulation tests a scheme before spend is committed.',
        out: 'Targets reach every rep and outlet the way the plan intended' },
      { time: '8:30 am', sky: 'dawn', who: 'The distributor', name: 'Primary dispatch', prod: 'Botree DMS',
        h: 'The distributor decides how much of your brand to carry.',
        p: 'The distributor places a primary order and stock is dispatched from your depot.',
        wrong: 'He orders on instinct and last month’s numbers, and holds back while claims are pending. Fast lines run short midweek.',
        prism: 'Auto Replenishment suggests the next order before fast lines run out.',
        stat: '32%', statLabel: 'improvement in fill rates' },
      { time: '11:00 am', sky: 'day', who: 'The distributor', name: 'Distributor warehouse', prod: 'Botree DMS',
        h: 'Every case is billed, stored and claimed.',
        p: 'The distributor receives stock, bills retailers and files claims for the schemes he ran.',
        wrong: 'Billing is keyed in by hand, claims sit in paperwork for weeks, and slow stock ages unseen.',
        prism: 'Fraudulent distributor analysis flags claims that don’t match real sales.',
        stat: '85%', statLabel: 'faster order-to-billing' },
      { time: '1:30 pm', sky: 'day', who: 'The salesperson', name: 'On the beat', prod: 'Botree SFA',
        h: 'The salesperson decides where your growth goes.',
        p: 'The rep visits outlets on the beat, takes orders and checks what’s on the shelf.',
        wrong: 'The same route every week. Slipping outlets get missed, and orders depend on memory.',
        prism: 'Route Optimization reshapes the beat, and Product Recommender suggests the order.',
        stat: '12%', statLabel: 'increase in product assortment' },
      { time: '3:00 pm', sky: 'day', who: 'The retailer', name: 'At the store counter', prod: 'Botree Retailer App',
        h: 'The retailer decides who earns the shelf.',
        p: 'The retailer chooses what to stock, how much, and which schemes are worth it.',
        wrong: 'He orders what the rep remembers to mention, and rarely hears about the latest scheme.',
        prism: 'AI Ordering prepares the order from buying patterns and live schemes.',
        stat: 'One tap', statLabel: 'to confirm a suggested order' },
      { time: '4:30 pm', sky: 'dusk', who: 'Rep and retailer', name: 'In-store execution', prod: 'Botree SFA',
        h: 'Your brand shows up the way it was planned.',
        p: 'The rep checks shelf placement, displays and range against the plan.',
        wrong: 'Displays go up late or not at all, and nobody at HQ knows until the month ends.',
        prism: 'AI Nudges prompt the rep on range gaps and low stock while still in the store.',
        stat: 'Same day', statLabel: 'range gaps closed' },
      { time: '9:00 pm', sky: 'night', who: 'The retailer', name: 'Store, after hours', prod: 'Botree Retailer App',
        h: 'The shelf reorders itself after closing.',
        p: 'After closing, the retailer checks what sold and tops up for tomorrow.',
        wrong: 'Reorders wait for the next rep visit, so fast lines sit empty for days.',
        prism: 'Product Recommender suggests what to reorder before the shelf runs dry.',
        stat: 'Before morning', statLabel: 'reorders reach the distributor' },
      { time: '11:00 pm', sky: 'night', who: 'Your HQ', name: 'Back to HQ', prod: 'Botree Prism',
        h: 'Every sale comes back as tomorrow’s decision.',
        p: 'Orders, visits and sales from the day flow back to HQ overnight.',
        wrong: 'Secondary sales arrive weeks late in spreadsheets, so decisions run on old numbers.',
        prism: 'Outletpulse and the Channel Performance Dashboard show what to fix tomorrow.',
        stat: '100%', statLabel: 'visibility into secondary sales' }
    ];
    const list = $('#stops'), side = $('#day-list');
    if (!list) return;
    const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    list.innerHTML = STOPS.map((s, i) => `
      <li class="stop" id="stop-${i + 1}" data-i="${i}">
        <div class="stop-step"><span class="t">${s.time}</span><span>Stop ${i + 1} of 8 · ${esc(s.who)}</span><span class="prod">${esc(s.prod)}</span></div>
        <h3>${esc(s.h)}</h3>
        <p>${esc(s.p)}</p>
        <p class="stop-wrong"><b>What usually goes wrong:</b> ${esc(s.wrong)}</p>
        <p class="stop-prism"><span class="spark" aria-hidden="true">✦</span><span><strong>Prism here:</strong> ${esc(s.prism)}</span></p>
        <p class="stop-out"><span class="lab">Outcome</span>${s.stat ? `<b>${esc(s.stat)}</b><span>${esc(s.statLabel)}</span>` : `<span style="color:var(--text);font-weight:600">${esc(s.out)}</span>`}</p>
      </li>`).join('');
    side.innerHTML = STOPS.map((s, i) => `<li><a href="#stop-${i + 1}" tabindex="-1">${esc(s.name)}</a></li>`).join('');
    const stops = $$('.stop', list), dots = $$('li', side);
    const clock = $('.clock'), tEl = $('#day-time'), stepEl = $('#day-step');
    const set = i => {
      stops.forEach((s, j) => s.classList.toggle('is-on', j === i));
      dots.forEach((d, j) => { d.classList.toggle('done', j < i); d.classList.toggle('now', j === i); });
      side.style.setProperty('--p', (i / (STOPS.length - 1)).toFixed(3));
      tEl.textContent = STOPS[i].time;
      stepEl.textContent = `Stop ${i + 1} of 8 · ${STOPS[i].name}`;
      clock.dataset.sky = STOPS[i].sky;
    };
    midObserver(stops, s => set(+s.dataset.i), '-40% 0px -50% 0px');
    set(0);
    if (reduce) stops.forEach(s => s.classList.add('is-on'));
  })();

  /* ---------- 05 Proof: testimonials ---------- */
  (function quotes() {
    const Q = [
      { tag: '100%', sub: 'DMS coverage', logo: 'https://cms.botree.ai/wp-content/uploads/2025/11/replicate-prediction-bb2hb6zba6xp6mn7kmi43ux7zu-3.webp', co: 'Jyothy Labs',
        q: 'With 2000+ distributors now on board, our DMS has 100% coverage, providing us with invaluable data insights and visibility to boost nationwide sales. The team and product’s ability to handle mass rollouts without any major challenges was appreciable.',
        who: 'Ravi Razdan', role: 'Director IT & HR, Jyothy Labs Ltd.', img: 'https://cms.botree.ai/wp-content/uploads/2025/11/Mask-group-22.webp', vid: '7GLsjv808Mk', link: 'https://www.botree.ai/success-stories/jyothy-labs' },
      { tag: 'Trusted tech partnership', logo: 'https://cms.botree.ai/wp-content/uploads/2025/10/botree-Amul-Logo-2.svg', co: 'Amul',
        q: 'We wanted to provide one of the best applications to our distributors and salesmen, so we partnered with Botree for end-to-end services, which include DMS, Mobile DMS, SFA, Retailer app, and even our server management.',
        who: 'Ajay Seth', role: 'Head – IT, Amul (GCMMF)', img: 'https://cms.botree.ai/wp-content/uploads/2025/11/Mask-group-25.webp', vid: 'j9nSZn-i2JU', link: 'https://www.botree.ai/success-stories/amul-retailer-app-transformation-journey' },
      { tag: 'Delivering sales excellence', logo: 'https://cms.botree.ai/wp-content/uploads/2025/10/botree-Royal-Canin-Logo-2.svg', co: 'Royal Canin',
        q: 'With seamless stock reporting, data-driven analytics and comprehensive visibility of our sales distribution across multiple channels, Botree DMS & SFA streamlined our operations, boosting order fulfillment and retailer satisfaction.',
        who: 'Aritra Chakraborty', role: 'Digital Technologies Lead, Royal Canin India', img: 'https://cms.botree.ai/wp-content/uploads/2025/11/Mask-group-26.webp', vid: 'erLJBqQ_Opg', link: 'https://www.botree.ai/success-stories/royal-canin' },
      { tag: 'Smooth rollout experience', logo: 'https://cms.botree.ai/wp-content/uploads/2025/11/Dabur-Logo-PNG-3.webp', co: 'Dabur',
        q: 'Botree SFA provides granular-level data visibility to our sales team. It combines a refreshingly simple user interface along with some of the best functionalities, such as interactive dashboards and scheme visibility while order booking.',
        who: 'Kaustubh Dabral', role: 'Global Chief Information Officer, Dabur India Limited', img: 'https://cms.botree.ai/wp-content/uploads/2025/11/Mask-group-23.webp', vid: 'DGTsIC8lqpo', link: 'https://youtu.be/DGTsIC8lqpo' },
      { tag: 'Smart data excellence', logo: 'https://cms.botree.ai/wp-content/uploads/2025/10/botree-Nivea_Logo-1.svg', co: 'Nivea',
        q: 'The Botree Suite has greatly enhanced our operational efficiency, providing data-driven insights that have empowered us to make informed decisions and improve financial management.',
        who: 'Rohit Sahni', role: 'Associate Director S&CM, Nivea', img: 'https://cms.botree.ai/wp-content/uploads/2025/11/Mask-group-29.webp', vid: 'h9hFqT6t0Ck', link: 'https://youtu.be/h9hFqT6t0Ck' },
      { tag: '35,000+', sub: 'outlets added', logo: 'https://cms.botree.ai/wp-content/uploads/2025/10/botree-MKAgrotech-logo-2.svg', co: 'MK Agrotech',
        q: 'Botree Software has helped us streamline operations, enabling end-to-end visibility of our sales operations and market coverage. This visibility helped us identify billed and unbilled outlets, thus expanding our market presence.',
        who: 'Sridhar Vaidhyanathan', role: 'COO, MK Agrotech', img: 'https://cms.botree.ai/wp-content/uploads/2025/11/Mask-group-30.webp', link: 'https://www.botree.ai/success-stories/mk-agrotech' }
    ];
    const stage = $('#quotes'), bar = $('#quote-logos');
    if (!stage) return;
    const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    bar.innerHTML = Q.map((q, i) => `<button role="tab" id="ql-${i}" aria-controls="quotes" aria-selected="${i === 0}" ${i ? 'tabindex="-1"' : ''}><img src="${q.logo}" alt="${esc(q.co)}" loading="lazy"></button>`).join('');
    const render = i => {
      const q = Q[i];
      stage.innerHTML = `
        <article class="quote">
          <div class="quote-copy">
            <p class="quote-tag ${q.sub ? '' : 'txt'}">${esc(q.tag)}</p>${q.sub ? `<p class="mono">${esc(q.sub)}</p>` : ''}
            <blockquote>“${esc(q.q)}”</blockquote>
            <p class="quote-who"><strong>${esc(q.who)}</strong><span>${esc(q.role)}</span></p>
            <a class="link-u" href="${q.link}">Read the case study <span class="arr">→</span></a>
          </div>
          <div class="quote-photo"><img src="${q.img}" alt="${esc(q.who)}" loading="lazy">
            ${q.vid ? `<button class="play" type="button" aria-label="Play ${esc(q.who)}’s video" data-vid="${q.vid}"><svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z"/></svg></button>` : ''}
          </div>
        </article>`;
    };
    render(0);
    tabs(bar, render);

    const dlg = $('#video'), frame = $('#video-frame');
    stage.addEventListener('click', e => {
      const b = e.target.closest('[data-vid]');
      if (!b || !dlg.showModal) return;
      frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${b.dataset.vid}?autoplay=1&rel=0" title="Customer story video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      dlg.showModal();
    });
    const close = () => { dlg.close(); };
    $('[data-close]', dlg).addEventListener('click', close);
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
    dlg.addEventListener('close', () => { frame.innerHTML = ''; });
  })();

  /* ---------- Generic reveal ---------- */
  const rvs = $$('.ch-main > *, .board, .fit-col, .jobs-head, .ask-copy, .chat, .close-in > *');
  rvs.forEach(el => el.classList.add('rv'));
  const rvIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); rvIO.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  rvs.forEach(el => reduce ? el.classList.add('is-in') : rvIO.observe(el));
})();
