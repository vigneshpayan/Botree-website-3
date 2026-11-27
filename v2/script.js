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

  /* Hero visual: option A by default; ?hero=b (data → hub → cards) or ?hero=c (Prism refraction) to compare */
  const heroSvg = $('#map');
  if (heroSvg) { const h = new URLSearchParams(location.search).get('hero'); heroSvg.dataset.hero = ['b', 'c'].includes(h) ? h : 'a'; }

  /* ---------- Hero visual C: raw RTM data → Botree Prism → outcomes ---------- */
  (function prismHero() {
    const svg = $('#map');
    if (!svg || svg.dataset.hero !== 'c') return;
    const el = (tag, attrs, parent = svg) => {
      const n = document.createElementNS(SVGNS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      parent.appendChild(n);
      return n;
    };
    const defs = el('defs', {});
    const blur = (id, sd) => { const f = el('filter', { id, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs); el('feGaussianBlur', { stdDeviation: sd }, f); };
    blur('pzGlow', 18); blur('pzSoft', 4); blur('pzFloor', 8);
    const pg = el('linearGradient', { id: 'pzBody', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
    [['0', '#FFFFFF'], ['.6', '#F6F0FD'], ['1', '#E6D8FA']].forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, pg));

    // Prism (centre) and the beam geometry
    const C = [250, 220], H = 55;               // centre, half size
    const L = C[0] - H, R = C[0] + H;
    const INS = [['Distributor billing', 112], ['Field visits', 166], ['Retailer orders', 226], ['Claims', 280], ['Schemes', 336]];
    const OUTS = [
      ['More sell-out per outlet', 'Sell-out ↑', '#FF6A3D', 104],
      ['Fewer stock-outs', 'Stock-outs ↓', '#F72585', 182],
      ['Faster claims and billing', 'Claims faster', '#8B3DFF', 262],
      ['Schemes that pay back', 'Schemes pay back', '#7209B7', 340]
    ];
    const curve = (x1, y1, x2, y2, k = 0.5) => `M${x1} ${y1} C${x1 + (x2 - x1) * k} ${y1} ${x2 - (x2 - x1) * k} ${y2} ${x2} ${y2}`;

    // Floor reflection + glow behind the prism
    el('ellipse', { class: 'pz-floor', cx: C[0], cy: C[1] + H + 46, rx: 96, ry: 12, filter: 'url(#pzFloor)' });
    el('rect', { class: 'pz-glow', x: L - 6, y: C[1] - H - 6, width: 2 * H + 12, height: 2 * H + 12, rx: 30, filter: 'url(#pzGlow)' });

    // Inputs: thin grey, slightly uneven beams that converge on the prism's left face
    const gIn = el('g', { class: 'pz-ins' });
    const inPaths = INS.map(([label, y], i) => {
      const ey = C[1] - 26 + i * 13;
      const d = curve(0, y, L, ey, 0.55);
      el('path', { class: 'pz-in', d, pathLength: 1, style: `--d:${i * 0.07}s` }, gIn);
      const t = el('text', { class: 'pz-lbl', x: 0, y: y - 8, style: `--d:${i * 0.07}s` }, gIn);
      t.textContent = label;
      return d;
    });

    // Outputs: wide coloured beams that fan out to outcome pills
    const PX = 382;
    const gOut = el('g', { class: 'pz-outs' });
    const outPaths = OUTS.map(([, , c, py], i) => {
      const sy = C[1] - 24 + i * 16;
      const d = curve(R, sy, PX, py + 17, 0.5);
      const lg = el('linearGradient', { id: `pzOut${i}`, x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
      el('stop', { offset: '0', 'stop-color': c, 'stop-opacity': 1 }, lg);
      el('stop', { offset: '1', 'stop-color': c, 'stop-opacity': 0.35 }, lg);
      const g = el('g', { class: 'pz-out', 'data-i': i, style: `--d:${0.7 + i * 0.08}s` }, gOut);
      el('path', { class: 'pz-beam-glow', d, stroke: c, filter: 'url(#pzSoft)', pathLength: 1 }, g);
      el('path', { class: 'pz-beam', d, stroke: `url(#pzOut${i})`, pathLength: 1 }, g);
      el('path', { class: 'pz-core', d, pathLength: 1 }, g);
      return d;
    });

    // The prism itself
    const prism = el('g', { class: 'pz-prism' });
    el('rect', { x: L, y: C[1] - H, width: 2 * H, height: 2 * H, rx: 24, fill: 'url(#pzBody)', class: 'pz-body' }, prism);
    el('rect', { x: L + 7, y: C[1] - H + 7, width: 2 * H - 14, height: 2 * H - 14, rx: 18, class: 'pz-inner' }, prism);
    el('path', { d: `M${L + 16} ${C[1] - H + 10} H${R - 30}`, class: 'pz-shine' }, prism);
    const mark = el('text', { x: C[0], y: C[1] + 12, 'text-anchor': 'middle', class: 'pz-mark' }, prism); mark.textContent = '✦';
    const cap = el('text', { x: C[0], y: C[1] + H + 26, 'text-anchor': 'middle', class: 'pz-cap' }, prism); cap.textContent = 'BOTREE PRISM';

    // Outcome pills
    const pills = OUTS.map(([long, short, c, py], i) => {
      const g = el('g', { class: 'pz-pill', 'data-i': i, style: `--d:${0.95 + i * 0.08}s`, tabindex: -1 });
      el('rect', { x: PX, y: py, width: 190, height: 34, rx: 17, class: 'pz-pill-bg' }, g);
      el('circle', { cx: PX + 17, cy: py + 17, r: 5, fill: c }, g);
      const tl = el('text', { x: PX + 30, y: py + 21.5, class: 'pz-pill-t t-long' }, g); tl.textContent = long;
      const ts = el('text', { x: PX + 30, y: py + 21.5, class: 'pz-pill-t t-short' }, g); ts.textContent = short;
      g.addEventListener('mouseenter', () => svg.dataset.hot = i);
      g.addEventListener('mouseleave', () => delete svg.dataset.hot);
      return g;
    });

    requestAnimationFrame(() => svg.classList.add('is-in'));
    if (reduce) return;

    // Idle loop: a grey pulse enters the prism, a coloured pulse leaves on one outcome beam
    const pulse = (d, cls, dur, color) => {
      const dot = el('circle', { class: cls, r: cls === 'pz-p-out' ? 4 : 3, ...(color ? { stroke: color } : {}) });
      const anim = el('animateMotion', { dur: `${dur}s`, path: d, fill: 'freeze', calcMode: 'spline', keyTimes: '0;1', keySplines: '.45 0 .25 1' }, dot);
      anim.beginElement();
      setTimeout(() => dot.remove(), dur * 1000 + 50);
    };
    let n = 0;
    setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const i = n++;
      pulse(inPaths[i % inPaths.length], 'pz-p-in', 1.1);
      const o = i % outPaths.length;
      setTimeout(() => pulse(outPaths[o], 'pz-p-out', 1.2, OUTS[o][2]), 1050);
    }, 700);
  })();

  /* ---------- Hero visual B: RTM data dots → Botree Prism hub → outcome cards ---------- */
  (function heroB() {
    const svg = $('#map');
    if (!svg || svg.dataset.hero !== 'b') return;
    const el = (tag, attrs, parent = svg) => {
      const n = document.createElementNS(SVGNS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      parent.appendChild(n);
      return n;
    };
    const defs = el('defs', {});
    const f = el('filter', { id: 'hbShadow', x: '-30%', y: '-30%', width: '160%', height: '170%' }, defs);
    el('feDropShadow', { dx: 0, dy: 8, stdDeviation: 9, 'flood-color': '#2A1240', 'flood-opacity': .14 }, f);
    const fg = el('filter', { id: 'hbGlow', x: '-60%', y: '-60%', width: '220%', height: '220%' }, defs);
    el('feGaussianBlur', { stdDeviation: 14 }, fg);

    const HUB = [222, 236], HR = 42;
    const ROLE = { d: '#FF6A3D', r: '#F72585', s: '#8B3DFF' };
    // Input lines: start off the left edge, sweep into the hub; dots sit along them
    const LINES = [
      [-10, 96, ['d', 0.32], ['r', 0.62]], [-10, 150, ['s', 0.45]], [-10, 206, ['d', 0.28], ['s', 0.6]],
      [-10, 262, ['r', 0.38]], [-10, 318, ['s', 0.3], ['d', 0.66]], [-10, 376, ['r', 0.5]]
    ];
    const curve = (x1, y1, x2, y2) => `M${x1} ${y1} C${x1 + (x2 - x1) * 0.55} ${y1} ${x2 - (x2 - x1) * 0.35} ${y2} ${x2} ${y2}`;
    const gIn = el('g', { class: 'hb-ins' });
    const inPaths = LINES.map(([x, y, ...dots], i) => {
      const ey = HUB[1] - 18 + i * 7;
      const d = curve(x, y, HUB[0] - HR + 4, ey);
      const p = el('path', { class: 'hb-in', d, pathLength: 1, style: `--d:${i * 0.06}s` }, gIn);
      dots.forEach(([role, t], k) => {
        // Point on the cubic at t (computed directly so it works before layout)
        const [x0, y0, cx1, cy1, cx2, cy2, x3, y3] = [x, y, x + (HUB[0] - HR + 4 - x) * 0.55, y, HUB[0] - HR + 4 - (HUB[0] - HR + 4 - x) * 0.35, ey, HUB[0] - HR + 4, ey];
        const u = 1 - t, bx = u * u * u * x0 + 3 * u * u * t * cx1 + 3 * u * t * t * cx2 + t * t * t * x3, by = u * u * u * y0 + 3 * u * u * t * cy1 + 3 * u * t * t * cy2 + t * t * t * y3;
        el('circle', { class: 'hb-dot', cx: bx.toFixed(1), cy: by.toFixed(1), r: 6, stroke: ROLE[role], style: `--d:${0.2 + i * 0.06 + k * 0.05}s` }, gIn);
      });
      return d;
    });

    // Output rail from the hub through the three cards
    const CY = 236, CW = 84, CH = 104, CX = [306, 400, 494];
    el('path', { class: 'hb-rail', d: `M${HUB[0] + HR} ${CY} H${CX[2] + CW}`, pathLength: 1 });

    // Hub
    el('circle', { class: 'hb-halo', cx: HUB[0], cy: HUB[1], r: HR + 10, filter: 'url(#hbGlow)' });
    el('circle', { class: 'hb-ring', cx: HUB[0], cy: HUB[1], r: HR + 8 });
    const hub = el('g', { class: 'hb-hub' });
    el('circle', { cx: HUB[0], cy: HUB[1], r: HR, class: 'hb-hub-bg' }, hub);
    const m = el('text', { x: HUB[0], y: HUB[1] + 11, 'text-anchor': 'middle', class: 'hb-mark' }, hub); m.textContent = '✦';
    const cap = el('text', { x: HUB[0], y: HUB[1] + HR + 26, 'text-anchor': 'middle', class: 'hb-cap' }, hub); cap.textContent = 'BOTREE PRISM';

    // Outcome cards: sell-out bars, fill-rate donut, growth line
    const cards = CX.map((x, i) => {
      const y = CY - CH / 2;
      const g = el('g', { class: 'hb-card', style: `--d:${0.9 + i * 0.12}s` });
      el('rect', { x, y, width: CW, height: CH, rx: 14, class: 'hb-card-bg', filter: 'url(#hbShadow)' }, g);
      const label = ['SELL-OUT', 'FILL RATE', 'GROWTH'][i];
      if (i === 0) {
        [[0.86, '#FF6A3D'], [0.7, '#B794F6'], [0.95, '#FF6A3D'], [0.55, '#B794F6']].forEach(([w, c], k) =>
          el('rect', { x: x + 12, y: y + 16 + k * 13, width: (CW - 24) * w, height: 6, rx: 3, fill: c, class: 'hb-bar', style: `--d:${1.1 + k * 0.08}s` }, g));
      } else if (i === 1) {
        const cx = x + CW / 2, cy = y + 40, r = 21, C = 2 * Math.PI * r;
        el('circle', { cx, cy, r, class: 'hb-donut-bg' }, g);
        el('circle', { cx, cy, r, class: 'hb-donut', 'stroke-dasharray': `${C * 0.72} ${C}`, transform: `rotate(-90 ${cx} ${cy})`, style: `--c:${C}` }, g);
        const t = el('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', class: 'hb-num' }, g); t.textContent = '32%';
      } else {
        const pts = [[0, 0.2], [0.2, 0.35], [0.4, 0.3], [0.6, 0.55], [0.8, 0.62], [1, 0.9]].map(([a, b]) => `${(x + 12 + a * (CW - 24)).toFixed(1)},${(y + 64 - b * 46).toFixed(1)}`).join(' ');
        el('polyline', { points: pts, class: 'hb-line', pathLength: 1 }, g);
        el('circle', { cx: x + CW - 12, cy: y + 64 - 0.9 * 46, r: 3.5, class: 'hb-line-dot' }, g);
      }
      el('line', { x1: x + 12, y1: y + CH - 26, x2: x + CW - 12, y2: y + CH - 26, class: 'hb-sep' }, g);
      const lt = el('text', { x: x + 12, y: y + CH - 11, class: 'hb-lbl' }, g); lt.textContent = label;
      return g;
    });

    requestAnimationFrame(() => svg.classList.add('is-in'));
    if (reduce) return;

    // Idle loop: data dots flow into the hub, then out along the rail to a card, which pings
    const pulse = (d, cls, dur) => {
      const dot = el('circle', { class: cls, r: 3.5 });
      const a = el('animateMotion', { dur: `${dur}s`, path: d, fill: 'freeze', calcMode: 'spline', keyTimes: '0;1', keySplines: '.45 0 .25 1' }, dot);
      a.beginElement();
      setTimeout(() => dot.remove(), dur * 1000 + 50);
    };
    let n = 0;
    setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const i = n++;
      pulse(inPaths[i % inPaths.length], 'hb-p-in', 1.1);
      const c = i % cards.length, tx = CX[c] + CW / 2;
      setTimeout(() => {
        pulse(`M${HUB[0] + HR} ${CY} H${tx}`, 'hb-p-out', 0.6 + c * 0.15);
        setTimeout(() => { cards[c].classList.remove('ping'); void cards[c].getBBox(); cards[c].classList.add('ping'); }, (0.6 + c * 0.15) * 1000);
      }, 1000);
    }, 800);
  })();

  /* ---------- Hero visual A: many threads of RTM data → one point → the next right decision ---------- */
  (function heroA() {
    const svg = $('#map');
    if (!svg || svg.dataset.hero !== 'a') return;
    const el = (tag, attrs, parent = svg) => {
      const n = document.createElementNS(SVGNS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      parent.appendChild(n);
      return n;
    };
    const defs = el('defs', {});
    const lin = (id, x1, x2, stops) => { const g = el('linearGradient', { id, gradientUnits: 'userSpaceOnUse', x1, y1: 0, x2, y2: 0 }, defs); stops.forEach(([o, c, a = 1]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g)); };
    lin('haThread', 0, 300, [['0', '#CFC4DE', 0.7], ['.7', '#B794F6', 0.85], ['1', '#8B3DFF', 1]]);
    lin('haBeam', 300, 410, [['0', '#FF7A45'], ['.5', '#F72585'], ['1', '#7209B7']]);
    const fg = el('filter', { id: 'haGlow', x: '-100%', y: '-100%', width: '300%', height: '300%' }, defs);
    el('feGaussianBlur', { stdDeviation: 10 }, fg);
    const fs = el('filter', { id: 'haShadow', x: '-20%', y: '-40%', width: '140%', height: '200%' }, defs);
    el('feDropShadow', { dx: 0, dy: 8, stdDeviation: 9, 'flood-color': '#2A1240', 'flood-opacity': .14 }, fs);

    const P = [300, 236], END = 404, N = 14;
    const LABELS = { 0: 'Distributor billing', 2: 'Stock', 4: 'Claims', 6: 'Field visits', 8: 'Orders', 10: 'Retailer reorders', 12: 'Schemes' };
    const threads = [];
    const gT = el('g', { class: 'ha-threads' });
    for (let i = 0; i < N; i++) {
      const y = 98 + i * (278 / (N - 1));
      const bend = 104 + (i % 3) * 14;
      const d = `M0 ${y.toFixed(1)} H${bend} C${bend + 110} ${y.toFixed(1)} ${P[0] - 70} ${P[1]} ${P[0]} ${P[1]}`;
      el('path', { class: 'ha-thread', d, pathLength: 1, style: `--d:${(Math.abs(i - (N - 1) / 2) * 0.04).toFixed(2)}s` }, gT);
      if (LABELS[i]) { const t = el('text', { class: 'ha-lbl', x: 0, y: (y - 7).toFixed(1), style: `--d:${(i * 0.03).toFixed(2)}s` }, gT); t.textContent = LABELS[i]; }
      if (i % 2 === 1) el('circle', { class: 'ha-pt', cx: 40 + ((i * 37) % 70), cy: y.toFixed(1), r: 2.6, style: `--d:${(0.3 + i * 0.03).toFixed(2)}s` }, gT);
      threads.push(d);
    }

    // Single line to the decision
    el('path', { class: 'ha-beam-glow', d: `M${P[0]} ${P[1]} H${END}`, filter: 'url(#haGlow)' });
    el('path', { class: 'ha-beam', d: `M${P[0]} ${P[1]} H${END}`, pathLength: 1 });

    // Convergence point: Botree Prism
    el('circle', { class: 'ha-halo', cx: P[0], cy: P[1], r: 18, filter: 'url(#haGlow)' });
    const core = el('g', { class: 'ha-core' });
    el('circle', { cx: P[0], cy: P[1], r: 9, class: 'ha-core-dot' }, core);
    const cap = el('text', { x: (P[0] + END) / 2 + 6, y: P[1] + 24, 'text-anchor': 'middle', class: 'ha-cap' }, core); cap.textContent = 'BOTREE PRISM';

    // The decision chip
    const chip = el('g', { class: 'ha-chip' });
    el('rect', { x: END, y: P[1] - 21, width: 172, height: 42, rx: 21, class: 'ha-chip-bg', filter: 'url(#haShadow)' }, chip);
    el('circle', { cx: END + 21, cy: P[1], r: 10, class: 'ha-chip-ic' }, chip);
    const tick = el('text', { x: END + 21, y: P[1] + 4.5, 'text-anchor': 'middle', class: 'ha-chip-tick' }, chip); tick.textContent = '✓';
    const ct = el('text', { x: END + 39, y: P[1] + 4.5, class: 'ha-chip-t' }, chip); ct.textContent = 'Next right decision';

    requestAnimationFrame(() => svg.classList.add('is-in'));
    if (reduce) return;

    // Idle loop: pulses run along random threads, through the point, to the decision
    let n = 0;
    setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const d = threads[(n * 5) % N] + ` H${END}`;
      n++;
      const dot = el('circle', { class: 'ha-p', r: 3 });
      const a = el('animateMotion', { dur: '1.6s', path: d, fill: 'freeze', calcMode: 'spline', keyTimes: '0;1', keySplines: '.5 0 .3 1' }, dot);
      a.beginElement();
      setTimeout(() => { dot.remove(); chip.classList.remove('ping'); void chip.getBBox(); chip.classList.add('ping'); }, 1600);
    }, 520);
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

  /* ---------- 04 Prism in action: a carton travels the road through four stops ---------- */
  (function trip() {
    const root = $('#trip');
    if (!root) return;
    const section = $('#action'), road = $('#road'), carton = $('#carton'), list = $('#tstops');

    /* Isometric 3D drawing: every face gets a soft gradient (lit top, mid front, shaded side),
       rounded joins, a light rim on the top edges and a blurred floor shadow */
    const S = 12, COS = Math.cos(Math.PI / 6);
    const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const shade = (h, amt) => '#' + hex(h).map(v => Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt)).toString(16).padStart(2, '0')).join('');
    let sceneId = 0;
    const scene = draw => {
      const id = 's' + (++sceneId), pts = [], parts = [], defs = new Map();
      const pt = (x, y, z) => { const p = [(x - y) * COS * S, (x + y) * 0.5 * S - z * S]; pts.push(p); return p; };
      const P = ps => ps.map(p => pt(...p).map(n => n.toFixed(1)).join(',')).join(' ');
      // Gradient per colour + face, shared within this svg
      const grad = (c, face) => {
        const key = c + face;
        if (!defs.has(key)) {
          const gid = `${id}g${defs.size}`;
          const [a, b, dir] = face === 'top' ? [shade(c, 0.46), shade(c, 0.2), 'x2="1" y2="1"']
            : face === 'front' ? [shade(c, 0.1), shade(c, -0.14), 'x2="0" y2="1"']
            : [shade(c, -0.12), shade(c, -0.36), 'x2="0" y2="1"'];
          defs.set(key, `<linearGradient id="${gid}" x1="0" y1="0" ${dir}><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`);
        }
        return `url(#${id}g${[...defs.keys()].indexOf(key)})`;
      };
      const isHex = c => /^#[0-9a-f]{6}$/i.test(c);
      const api = {
        poly: (ps, fill) => parts.push(`<polygon points="${P(ps)}" fill="${fill}" stroke="${fill}" stroke-width="1.2" stroke-linejoin="round"/>`),
        face: (ps, c, face) => api.poly(ps, isHex(c) ? grad(c, face) : c),
        box: (x, y, z, w, d, h, c) => {
          api.face([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], c, 'side');
          api.face([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], c, 'front');
          api.face([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], c, 'top');
          // Rim light along the two top edges that face the viewer
          parts.push(`<polyline points="${P([[x, y + d, z + h], [x + w, y + d, z + h], [x + w, y, z + h]])}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".9" stroke-linejoin="round" stroke-linecap="round"/>`);
        },
        front: (x, yf, z, w, h, fill) => api.poly([[x, yf, z], [x + w, yf, z], [x + w, yf, z + h], [x, yf, z + h]], fill),
        side: (xf, y, z, d, h, fill) => api.poly([[xf, y, z], [xf, y + d, z], [xf, y + d, z + h], [xf, y, z + h]], fill),
        circle: (x, y, z, r, fill) => {
          const [cx, cy] = pt(x, y, z);
          pts.push([cx - r, cy - r], [cx + r, cy + r]);
          const gid = `${id}r${parts.length}`;
          defs.set(gid, `<radialGradient id="${gid}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="${shade(fill, 0.5)}"/><stop offset=".55" stop-color="${fill}"/><stop offset="1" stop-color="${shade(fill, -0.25)}"/></radialGradient>`);
          parts.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="url(#${gid})"/>`);
        },
        shadow: (w, d) => parts.push(`<polygon points="${P([[0.4, 0.8, -1.1], [w + 0.4, 0.8, -1.1], [w + 0.4, d + 0.8, -1.1], [0.4, d + 0.8, -1.1]])}" fill="rgba(42,18,64,.28)" filter="url(#${id}blur)"/>`)
      };
      draw(api);
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), pad = 6;
      const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, w = Math.max(...xs) - x0 + pad, h = Math.max(...ys) - y0 + pad;
      const defsOut = [...defs.entries()].map(([k, v]) => v).join('') + `<filter id="${id}blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>`;
      return `<svg viewBox="${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" aria-hidden="true"><defs>${defsOut}</defs>${parts.join('')}</svg>`;
    };
    const ground = (g, c) => { g.shadow(9.5, 9.5); g.box(0, 0, -0.5, 9.5, 9.5, 0.5, shade(c, 0.8)); };
    const CARTON = '#E9A15E';
    const SCENES = {
      dist: g => {
        const c = '#FF6A3D';
        ground(g, c);
        g.box(1, 1, 0, 5.6, 4.6, 3, '#FF7A45');
        g.box(0.8, 0.8, 3, 6, 5, 0.5, '#B9401F');
        g.front(2.4, 5.6, 0, 2.2, 2.1, '#6E2210');
        for (let i = 0; i < 4; i++) g.front(2.4, 5.6, 0.4 + i * 0.45, 2.2, 0.08, 'rgba(255,255,255,.18)');
        g.side(6.6, 2, 1.2, 2.4, 1.1, 'rgba(255,255,255,.35)');
        g.box(7, 4.6, 0, 1.4, 1.4, 1.2, CARTON); g.box(7, 4.6, 1.2, 1.4, 1.4, 1.2, CARTON); g.box(7, 6.4, 0, 1.4, 1.4, 1.2, CARTON);
      },
      rep: g => {
        const c = '#F72585';
        ground(g, c);
        g.box(0.8, 0.8, 0, 1.8, 1.8, 1.6, '#F7A8CB'); g.box(3.2, 0.6, 0, 1.8, 1.8, 2.2, '#F48DBC'); g.box(0.6, 3.4, 0, 1.8, 1.8, 1.3, '#F9BFD9');
        g.box(4.7, 5, 0, 1.3, 0.9, 1.9, '#2A1240');
        g.box(4.5, 4.8, 1.9, 1.7, 1.3, 2.2, c);
        g.box(6.2, 5.1, 2.3, 0.5, 0.8, 1.1, '#7209B7');
        g.circle(5.35, 5.45, 4.95, 10, '#FFD6C4');
        g.box(7.2, 6.6, 0, 1.2, 1.2, 1, CARTON);
      },
      shop: g => {
        const c = '#9B5CF6';
        ground(g, c);
        g.box(1.4, 1.4, 0, 5.6, 4.6, 3.2, '#B794F6');
        g.front(2.1, 6, 0, 1.5, 2.2, '#4B1F8C');
        g.front(4.2, 6, 1, 2.2, 1.3, '#F3EDFF');
        for (let i = 0; i < 5; i++) g.box(1.4 + i * 1.12, 6, 2.5, 1.12, 1, 0.34, i % 2 ? '#FFFFFF' : '#8B3DFF');
        g.box(2.4, 5.8, 3.2, 3.6, 0.2, 0.8, '#2A1240');
        g.box(7.3, 6.8, 0, 1.2, 1.2, 1, CARTON);
      },
      hq: g => {
        const c = '#7209B7';
        ground(g, c);
        g.box(0.8, 4.6, 0, 3, 3.2, 2, '#A46BD8');
        g.box(4.2, 1.8, 0, 3.2, 3.2, 7.2, c);
        for (let z = 0.9; z < 6.8; z += 1.15) {
          for (let x = 4.55, k = 0; x < 7.1; x += 0.95, k++) g.front(x, 5, z, 0.5, 0.6, (k + Math.round(z)) % 3 === 0 ? '#FFE3A3' : 'rgba(255,255,255,.55)');
          for (let y = 2.15; y < 4.7; y += 0.95) g.side(7.4, y, z, 0.5, 0.6, 'rgba(255,255,255,.28)');
        }
        g.box(5.7, 3.3, 7.2, 0.25, 0.25, 1.5, '#2A1240');
        g.circle(5.82, 3.42, 8.9, 4, '#F72585');
      }
    };
    const cartonSvg = scene(g => {
      g.box(0, 0, 0, 2, 2, 1.7, CARTON);
      g.poly([[0.9, 0, 1.7], [1.1, 0, 1.7], [1.1, 2, 1.7], [0.9, 2, 1.7]], '#C77B3A');
      g.front(0.9, 2, 1.1, 0.2, 0.6, '#C77B3A');
    });

    // DRAFT COPY: merged from the earlier 8-stop day. Confirm with the client before launch.
    const STOPS = [
      { time: '8:30 am', who: 'The distributor', art: 'dist', c: 'var(--orange)', prod: 'Botree DMS',
        h: 'The distributor decides how much of your brand to carry.',
        p: 'Cartons leave your depot. The distributor places the order, bills retailers and files claims for the schemes he ran.',
        wrong: 'He orders on instinct and last month’s numbers, holds back while claims are pending, and keys bills in by hand.',
        prism: 'Auto Replenishment suggests the next order before fast lines run out, and Fraudulent distributor analysis flags claims that don’t match real sales.',
        stats: [['32%', 'improvement in fill rates'], ['85%', 'faster order-to-billing']] },
      { time: '1:30 pm', who: 'The salesperson', art: 'rep', c: 'var(--pink)', prod: 'Botree SFA',
        h: 'The salesperson decides where your growth goes.',
        p: 'The rep works the beat, takes orders and checks the shelf against the plan.',
        wrong: 'The same route every week. Slipping outlets get missed, and range gaps surface only at month end.',
        prism: 'Route Optimization reshapes the beat, Product Recommender suggests the order, and AI Nudges flag range gaps in the store.',
        stats: [['12%', 'increase in product assortment']] },
      { time: '6:00 pm', who: 'The retailer', art: 'shop', c: 'var(--lilac)', prod: 'Botree Retailer App',
        h: 'The retailer decides who earns the shelf.',
        p: 'The retailer chooses what to stock, and tops up after closing for tomorrow.',
        wrong: 'He orders what the rep remembers to mention, rarely hears about schemes, and waits for the next visit to reorder.',
        prism: 'AI Ordering prepares the order from buying patterns and live schemes, at any time of day.',
        stats: [['One tap', 'to confirm a suggested order']] },
      { time: '11:00 pm', who: 'Back to HQ', art: 'hq', c: 'var(--purple)', prod: 'Botree Prism',
        h: 'Every sale comes back as tomorrow’s plan.',
        p: 'Orders, visits and sales flow back to HQ overnight.',
        wrong: 'Secondary sales arrive weeks late in spreadsheets, so decisions run on old numbers.',
        prism: 'Outletpulse and the Channel Performance Dashboard show what to fix, and Target Disaggregation sets tomorrow’s targets.',
        stats: [['100%', 'visibility into secondary sales']] }
    ];
    const N = STOPS.length;
    const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    list.innerHTML = STOPS.map((s, i) => `
      <li class="tstop" style="--c:${s.c}">
        <div class="tnode"><div class="tart">${scene(SCENES[s.art])}</div><span class="ttime">${s.time}</span></div>
        <article class="tcard">
          <p class="t-meta"><span class="t-who">${esc(s.who)}</span><span>Stop ${i + 1} of ${N}</span><span class="t-prod">${esc(s.prod)}</span></p>
          <h3>${esc(s.h)}</h3>
          <p class="t-p">${esc(s.p)}</p>
          <div class="t-cmp">
            <div><span class="lab">Usually</span><p>${esc(s.wrong)}</p></div>
            <div class="with"><span class="lab">✦ With Prism</span><p>${esc(s.prism)}</p></div>
          </div>
          <div class="t-out">${s.stats.map(([v, l]) => `<p><b>${esc(v)}</b><span>${esc(l)}</span></p>`).join('')}</div>
        </article>
      </li>`).join('');
    carton.innerHTML = cartonSvg;
    const stops = $$('.tstop', list), arts = $$('.tart', list);

    /* Road through the scene centres; the carton rides it as you scroll */
    let samples = [], total = 0, firstY = 0, lastY = 0, nodeYs = [], prog = null;
    const build = () => {
      const box = root.getBoundingClientRect();
      const W = Math.round(box.width), H = Math.round(box.height);
      const P = arts.map(a => { const r = a.getBoundingClientRect(); return [r.left - box.left + r.width / 2, r.top - box.top + r.height * 0.88]; });
      nodeYs = P.map(p => p[1]);
      const lead = Math.min(140, P[0][1]);
      let d = `M${P[0][0].toFixed(1)} ${(P[0][1] - lead).toFixed(1)} L${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
      for (let i = 1; i < P.length; i++) {
        const [x1, y1] = P[i - 1], [x2, y2] = P[i], k = (y2 - y1) * 0.55;
        d += ` C${x1.toFixed(1)} ${(y1 + k).toFixed(1)} ${x2.toFixed(1)} ${(y2 - k).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
      }
      road.setAttribute('width', W); road.setAttribute('height', H); road.setAttribute('viewBox', `0 0 ${W} ${H}`);
      road.innerHTML = `<defs><linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF7A45"/><stop offset=".5" stop-color="#F72585"/><stop offset="1" stop-color="#8B3DFF"/></linearGradient></defs>
        <path class="r-edge" d="${d}"/><path class="r-base" d="${d}"/><path class="r-dash" d="${d}"/><path class="r-prog" d="${d}"/>`;
      prog = $('.r-prog', road);
      total = prog.getTotalLength();
      prog.style.strokeDasharray = total;
      samples = [];
      for (let l = 0; l <= total; l += 4) { const p = prog.getPointAtLength(l); samples.push([l, p.x, p.y]); }
      firstY = P[0][1]; lastY = P[P.length - 1][1];
      update();
    };
    const SKY = ['#FFF1E8', '#FDF2F6', '#F3DDF0', '#22093A'];
    const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
    let cur = -1, ticking = false;
    const update = () => {
      ticking = false;
      if (!samples.length) return;
      const r = root.getBoundingClientRect();
      const y = reduce ? lastY : Math.min(lastY, Math.max(firstY, innerHeight * 0.5 - r.top));
      let lo = 0, hi = samples.length - 1;
      while (lo < hi) { const m = (lo + hi) >> 1; if (samples[m][2] < y) lo = m + 1; else hi = m; }
      const [len, x, py] = samples[lo];
      carton.style.transform = `translate(${x.toFixed(1)}px, ${py.toFixed(1)}px) translate(-50%, -78%)`;
      prog.style.strokeDashoffset = (total - len).toFixed(1);
      let a = 0;
      nodeYs.forEach((ny, i) => { if (y >= ny - 120) a = i; });
      if (a !== cur) { cur = a; stops.forEach((s, i) => { s.classList.toggle('is-on', reduce || i === a); s.classList.toggle('done', i < a); }); }
      if (!reduce) {
        const t = (y - firstY) / Math.max(1, lastY - firstY) * (SKY.length - 1), i = Math.min(SKY.length - 2, Math.floor(t));
        section.style.setProperty('--sky', mix(SKY[i], SKY[i + 1], t - i));
        section.classList.toggle('is-night', t > 2.55);
      }
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    let rt; const rebuild = () => { clearTimeout(rt); rt = setTimeout(build, 120); };
    addEventListener('resize', rebuild);
    if (window.ResizeObserver) new ResizeObserver(rebuild).observe(root);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    build();
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
