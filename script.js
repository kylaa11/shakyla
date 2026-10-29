/* ===== Layar pembuka: petir plasma + titik-titik langsung membentuk kalimat ===== */
(() => {
  const loader = document.getElementById('loader');
  const inner = loader.querySelector('.loader-inner');
  const welcome = document.getElementById('welcome');
  const fill = document.getElementById('loaderFill');
  const pct = document.getElementById('loaderPct');
  const lc = document.getElementById('lightning'), lx = lc.getContext('2d');
  const tc = document.getElementById('textParticles'), tx = tc.getContext('2d');
  let W, H, K = 1, running = true, parts = [], stars = [];

  function size() {
    W = lc.width = tc.width = innerWidth;
    H = lc.height = tc.height = innerHeight;
    K = Math.max(.7, Math.min(1.3, W / 1500));
    stars = Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.1 + .3, p: Math.random() * 6.28 }));
  }
  size();
  addEventListener('resize', size);

  /* --- petir: jalur melengkung, terus merayap dari atas ke bawah --- */
  function jag(x1, y1, x2, y2, levels, off) {
    let pts = [[x1, y1], [x2, y2]];
    for (let l = 0; l < levels; l++) {
      const n = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        n.push(a, [(a[0] + b[0]) / 2 + (Math.random() - .5) * off, (a[1] + b[1]) / 2 + (Math.random() - .5) * off * .3]);
      }
      n.push(pts[pts.length - 1]);
      pts = n; off *= .55;
    }
    return pts;
  }
  function smooth(pts, it) {
    for (let k = 0; k < it; k++) {
      const n = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        n.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]);
      }
      n.push(pts[pts.length - 1]);
      pts = n;
    }
    return pts;
  }
  function makeBolt(t) {
    const cx = W * (.52 + .07 * Math.sin(t / 1800));
    const main = smooth(jag(cx + (Math.random() - .5) * W * .12, -30, cx + (Math.random() - .5) * W * .2, H + 30, 5, W * .2), 2);
    const branches = [];
    for (let i = 0; i < 3; i++) {
      const p = main[20 + Math.floor(Math.random() * 90)];
      const dir = Math.random() < .5 ? -1 : 1;
      branches.push(smooth(jag(p[0], p[1], p[0] + dir * (60 + Math.random() * 140), p[1] + 60 + Math.random() * 160, 4, 50), 1));
    }
    return { main, branches };
  }
  const lerp = (a, b, k) => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * k, p[1] + (b[i][1] - p[1]) * k]);
  let cur = makeBolt(0), nxt = makeBolt(0), nextAt = 0;

  function stroke(pts, w, color, blur, glow) {
    lx.beginPath();
    pts.forEach((p, i) => i ? lx.lineTo(p[0], p[1]) : lx.moveTo(p[0], p[1]));
    lx.lineWidth = w; lx.strokeStyle = color; lx.shadowBlur = blur; lx.shadowColor = glow;
    lx.lineJoin = 'round'; lx.lineCap = 'round'; lx.stroke();
  }
  function drawBolt(t) {
    if (t > nextAt) { nxt = makeBolt(t); nextAt = t + 110 + Math.random() * 60; }
    cur = { main: lerp(cur.main, nxt.main, .24), branches: cur.branches.map((b, i) => lerp(b, nxt.branches[i], .24)) };
    lx.globalCompositeOperation = 'source-over';
    lx.clearRect(0, 0, W, H);
    lx.shadowBlur = 0;
    for (const s of stars) {                       // bintang kecil berkelip
      lx.fillStyle = `rgba(210,225,255,${.35 + .35 * Math.sin(t / 700 + s.p)})`;
      lx.fillRect(s.x, s.y, s.r, s.r);
    }
    lx.globalCompositeOperation = 'lighter';
    const jit = pts => pts.map(p => [p[0] + (Math.random() - .5) * 2.4, p[1] + (Math.random() - .5) * 2.4]);
    const flick = .88 + Math.random() * .12;
    const sets = [[jit(cur.main), 1]].concat(cur.branches.map(b => [jit(b), .4]));
    for (const [pts, s] of sets) {
      stroke(pts, 74 * K * s, `rgba(15,80,210,${.10 * flick})`, 0, 'transparent');
      stroke(pts, 38 * K * s, `rgba(30,130,255,${.20 * flick})`, 0, 'transparent');
      stroke(pts, 18 * K * s, `rgba(90,195,255,${.45 * flick})`, 30, '#3ec6ff');
      stroke(pts, 8 * K * s, 'rgba(225,242,255,.95)', 12, '#ffffff');
      stroke(pts, 3 * K * s + .4, '#ffffff', 0, 'transparent');
    }
    // percikan kecil di sekitar petir
    for (let i = 0; i < 9; i++) {
      const p = cur.main[Math.floor(Math.random() * cur.main.length)];
      const ang = Math.random() * 6.28, len = (12 + Math.random() * 34) * K;
      stroke([[p[0], p[1]], [p[0] + Math.cos(ang) * len * .5 + (Math.random() - .5) * 8, p[1] + Math.sin(ang) * len * .5], [p[0] + Math.cos(ang) * len, p[1] + Math.sin(ang) * len]], 1.2 * K, 'rgba(170,225,255,.8)', 6, '#8fd8ff');
    }
    // gumpalan plasma terang
    lx.shadowBlur = 0;
    for (let i = 0; i < 3; i++) {
      const p = cur.main[Math.floor(Math.random() * cur.main.length)], r = (8 + Math.random() * 10) * K;
      const g = lx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
      g.addColorStop(0, 'rgba(210,240,255,.9)'); g.addColorStop(1, 'rgba(60,150,255,0)');
      lx.fillStyle = g; lx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
    }
    lx.globalCompositeOperation = 'source-over';
  }

  /* --- titik-titik kecil langsung berkumpul membentuk kalimat --- */
  function buildTargets() {
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const o = off.getContext('2d');
    const step = W < 700 ? 3 : 3, T = [], rects = [];
    [['ln1', 0], ['ln2', 1]].forEach(([id, li]) => {
      const el = document.getElementById(id), r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      o.clearRect(0, 0, W, H);
      o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillStyle = '#000';
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      o.fillText(el.textContent, cx, cy);
      const w = o.measureText(el.textContent).width;
      rects.push({ cx, cy, w, h: r.height });
      const d = o.getImageData(0, 0, W, H).data;
      for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (d[(y * W + x) * 4 + 3] > 128) T.push([x, y, li]);
    });
    return { T, rects };
  }
  function initParticles() {
    const { T, rects } = buildTargets();
    parts = T.map(([x, y, li]) => {
      const rc = rects[li];
      return {
        tx: x, ty: y, li,
        x0: rc.cx + (Math.random() - .5) * (rc.w + 320), y0: rc.cy + (Math.random() - .5) * (rc.h * 3 + 200),
        delay: Math.random() * 300, dur: 900 + Math.random() * 700, ph: Math.random() * 6.28, sz: 1.3 + Math.random() * 1.1
      };
    });
  }
  function drawParticles(t) {
    tx.clearRect(0, 0, W, H);
    for (const p of parts) {
      const u = Math.min(1, Math.max(0, (t - p.delay) / p.dur));
      const e = 1 - Math.pow(1 - u, 3), wob = (1 - e) * 14;
      const x = p.x0 + (p.tx - p.x0) * e + Math.sin(t / 240 + p.ph) * wob;
      const y = p.y0 + (p.ty - p.y0) * e + Math.cos(t / 280 + p.ph) * wob;
      tx.fillStyle = p.li ? `rgba(70,120,255,${.55 + .4 * e})` : `rgba(255,255,255,${.55 + .4 * e})`;
      const s = p.sz * (.8 + .4 * e);
      tx.fillRect(x, y, s, s);
    }
  }

  /* --- loop utama --- */
  let t0 = 0, shown = false, finished = false;
  function frame(now) {
    if (!running) return;
    if (!t0) t0 = now;
    const t = now - t0;
    drawBolt(t);
    drawParticles(t);
    if (t > 150) inner.classList.add('ready');
    if (t > 1700 && !shown) { shown = true; welcome.classList.add('show'); tc.style.transition = 'opacity .9s'; tc.style.opacity = 0; }
    const p = Math.min(1, t / 4300);
    const v = Math.round(100 * (1 - Math.pow(1 - p, 1.5)));
    fill.style.width = v + '%'; pct.textContent = v + '%';
    if (p >= 1 && !finished) {
      finished = true;
      setTimeout(() => {
        loader.classList.add('done');
        document.dispatchEvent(new Event('loaderdone'));
        setTimeout(() => { running = false; }, 1400);
      }, 900);
    }
    requestAnimationFrame(frame);
  }
  initParticles();
  requestAnimationFrame(frame);
})();

/* ===== Partikel titik putih yang bergerak ===== */
(() => {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, dots = [];
  const mouse = { x: -999, y: -999 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round((innerWidth * innerHeight) / 9000);
    dots = Array.from({ length: Math.min(count, 160) }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.4 + 0.4,
      a: Math.random() * 0.6 + 0.3,
    }));
  }
  addEventListener('resize', resize);
  addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  addEventListener('mouseleave', () => { mouse.x = mouse.y = -999; });

  function frame() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const d of dots) {
      // dorongan halus saat kursor mendekat
      const dx = d.x - mouse.x, dy = d.y - mouse.y, dist = Math.hypot(dx, dy);
      if (dist < 120) { d.x += (dx / dist) * 1.2; d.y += (dy / dist) * 1.2; }
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0) d.x = innerWidth; if (d.x > innerWidth) d.x = 0;
      if (d.y < 0) d.y = innerHeight; if (d.y > innerHeight) d.y = 0;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${d.a})`;
      ctx.fill();
    }
    // garis tipis antar titik yang berdekatan
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dist = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
        if (dist < 95) {
          ctx.strokeStyle = `rgba(150,180,255,${0.14 * (1 - dist / 95)})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.stroke();
        }
      }
    }
    if (!reduce) requestAnimationFrame(frame);
  }
  resize();
  frame();
})();

/* ===== Teks mengetik: ulang setiap 5 detik ===== */
(() => {
  const el = document.getElementById('typed');
  const word = 'Faculty of Engineering';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let started = false;
  async function loop() {
    while (true) {
      for (let i = 1; i <= word.length; i++) { el.textContent = word.slice(0, i); await sleep(75); }
      await sleep(5000);                      // jeda 5 detik
      for (let i = word.length; i >= 0; i--) { el.textContent = word.slice(0, i); await sleep(25); }
      await sleep(250);                       // lalu mengetik kembali
    }
  }
  document.addEventListener('loaderdone', () => { if (!started) { started = true; setTimeout(loop, 500); } });
})();

/* ===== Nav aktif saat scroll ===== */
(() => {
  const links = [...document.querySelectorAll('.nav a')];
  const secs = links.map(a => document.querySelector(a.getAttribute('href')));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => s && io.observe(s));
})();

/* ===== Foto: Spiderman hanya muncul di titik yang disentuh kursor ===== */
(() => {
  const photo = document.getElementById('photo');
  const cv = document.getElementById('photoCanvas'), ctx = cv.getContext('2d');
  const base = document.getElementById('imgBase'), spi = document.getElementById('imgSpidey');
  const W = cv.width, H = cv.height, R = 175;
  const tmp = document.createElement('canvas'); tmp.width = tmp.height = R * 2;
  const t = tmp.getContext('2d');
  let mx = W / 2, my = H * .2, rad = 0, goal = 0, busy = false, ready = false;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(base, 0, 0);
    if (rad > 1) {
      const r = rad, s = Math.ceil(r * 2), sx = mx - r, sy = my - r;
      t.globalCompositeOperation = 'source-over';
      t.clearRect(0, 0, R * 2, R * 2);
      t.drawImage(spi, -sx, -sy);
      t.globalCompositeOperation = 'destination-in';
      const g = t.createRadialGradient(r, r, r * .55, r, r, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      t.fillStyle = g; t.fillRect(0, 0, s, s);
      ctx.drawImage(tmp, 0, 0, s, s, sx, sy, s, s);
    }
  }
  function tick() {
    rad += (goal - rad) * .22;
    if (Math.abs(goal - rad) < .5) rad = goal;
    draw();
    if (rad !== goal) requestAnimationFrame(tick); else busy = false;
  }
  function kick() { if (ready && !busy) { busy = true; requestAnimationFrame(tick); } }
  function pos(e) {
    const r = cv.getBoundingClientRect();
    mx = (e.clientX - r.left) * W / r.width; my = (e.clientY - r.top) * H / r.height;
  }
  photo.addEventListener('pointerenter', e => { pos(e); goal = R; kick(); });
  photo.addEventListener('pointermove', e => { pos(e); goal = R; if (ready) { if (!busy) draw(); } });
  photo.addEventListener('pointerleave', () => { goal = 0; kick(); });
  photo.addEventListener('pointerdown', e => { pos(e); goal = R; kick(); });

  Promise.all([base, spi].map(i => i.complete ? Promise.resolve() : new Promise(r => { i.onload = r; i.onerror = r; })))
    .then(() => { ready = true; draw(); });
})();

/* ===== Tombol Lihat CV (versi satu file memakai blob) ===== */
(() => {
  const a = document.getElementById('cvLink');
  if (!a || !window.CV_B64) return;
  a.addEventListener('click', e => {
    e.preventDefault();
    const bin = atob(window.CV_B64), arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    window.open(URL.createObjectURL(new Blob([arr], { type: 'application/pdf' })), '_blank');
  });
})();

/* ===== Form kontak: membuka aplikasi email ===== */
document.getElementById('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const subject = encodeURIComponent('Pesan dari ' + f.get('nama'));
  const body = encodeURIComponent(f.get('pesan') + '\n\nEmail: ' + f.get('email'));
  location.href = `mailto:26050974046@mhs.unesa.ac.id?subject=${subject}&body=${body}`;
});

/* ===== Komentar (disimpan di browser) ===== */
(() => {
  const KEY = 'komentar-portofolio-nadia';
  const list = document.getElementById('commentList');
  const count = document.getElementById('count');
  let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch { items = []; }

  function render() {
    count.textContent = `(${items.length})`;
    list.innerHTML = '';
    items.slice().reverse().forEach(it => {
      const li = document.createElement('li');
      const b = document.createElement('b'); b.textContent = it.name;
      const s = document.createElement('small'); s.textContent = it.date;
      const p = document.createElement('p'); p.textContent = it.text;
      li.append(b, s, p);
      list.append(li);
    });
  }
  document.getElementById('commentForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('cName');
    const text = document.getElementById('cText');
    items.push({ name: name.value.trim(), text: text.value.trim(), date: new Date().toLocaleDateString('id-ID') });
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
    name.value = text.value = '';
    render();
  });
  render();
})();

/* ===== Kursor bulatan putih ===== */
(() => {
  const cur = document.getElementById('cursor');
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
  addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  addEventListener('mouseover', e => {
    cur.classList.toggle('big', !!e.target.closest('a,button,.photo,input,textarea'));
  });
  (function move() {
    x += (tx - x) * .35; y += (ty - y) * .35;
    cur.style.transform = `translate3d(${x - cur.offsetWidth / 2}px,${y - cur.offsetHeight / 2}px,0)`;
    requestAnimationFrame(move);
  })();
})();

/* ===== Animasi teks dan elemen saat di-scroll (berulang naik & turun) ===== */
(() => {
  const sel = '.hero-title,.role,.lead,.btn-row,.socials,.player,.hi,.about-left .btn,.about-right p,.more,' +
    '.col-title,.card,.skills span,.sec-title,.sec-sub,.project,footer,.photo';
  const els = [...document.querySelectorAll(sel)];
  const timers = new WeakMap();
  els.forEach(el => {
    el.classList.add('reveal');
    if (el.matches('.hi,.about-left .btn')) el.classList.add('from-left');
    if (el.matches('.about-right p,.more,.player')) el.classList.add('from-right');
    if (el.matches('.photo')) el.classList.add('zoom');
    const sibs = [...el.parentElement.children].filter(s => s.matches(sel));
    el.dataset.d = Math.min(sibs.indexOf(el) * 0.09, 0.6) + 's';
    el.style.transitionDelay = '0s';
  });
  function start() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const el = e.target;
        clearTimeout(timers.get(el));
        if (e.isIntersecting) {
          el.style.transitionDelay = el.dataset.d;
          el.classList.add('in');
          timers.set(el, setTimeout(() => { el.style.transitionDelay = '0s'; }, 1600));
        } else {
          el.style.transitionDelay = '0s';
          el.classList.remove('in');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    els.forEach(el => io.observe(el));
  }
  document.addEventListener('loaderdone', start);
})();
