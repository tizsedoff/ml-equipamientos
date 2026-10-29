/* Interactividad: escenas 3D, configurador, tilt 3D, efectos de scroll */
(function () {
  'use strict';
  var g = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(pointer:fine)').matches;
  var TI = window.TRUCK_INFO;
  var RANGER_URL = location.hostname === 'localhost' ? 'models/ranger.glb' : 'https://cdn.jsdelivr.net/gh/tizsedoff/ml-equipamientos@70592bf4efe498a220247b7c63b643676b425e27/models/ranger.glb';
  function fallbackHero() {
    var el = g('heroStage'); if (!window.createTruck || !el) return; el.innerHTML = '';
    window.createTruck(el, { theme: 'light', autoAssemble: true });
  }

  // ---------- Escena 3D del hero ----------
  var hero = null;
  if (g('heroStage')) {
    hero = window.createRanger && window.createRanger(g('heroStage'), { theme: 'light', autoAssemble: true, interactive: true, model: RANGER_URL, onError: function () { fallbackHero(); } });
    if (!hero && window.createTruck) hero = window.createTruck(g('heroStage'), { theme: 'light', autoAssemble: true });
    if (hero) g('heroTruck').classList.add('has3d');
  }

  // ---------- Configurador ----------
  var cfg = null, cfgSync = function () {};
  if (g('cfgStage')) {
    if (window.createRanger) cfg = window.createRanger(g('cfgStage'), { theme: 'dark', interactive: true, model: RANGER_URL, onError: function () {
      var el = g('cfgStage'); if (window.createTruck && el) { el.innerHTML = ''; var t = window.createTruck(el, { theme: 'dark' }); if (t) { cfg = t; t.onChange(function (s) { cfgSync(s); }); } }
    } });
    if (!cfg && window.createTruck) cfg = window.createTruck(g('cfgStage'), { theme: 'dark' });
  }
  if (!cfg) {
    document.querySelectorAll('[data-needs3d]').forEach(function (e) { e.remove(); });
  } else {
    var optsEl = g('cfgOpts');
    optsEl.innerHTML = TI.ORDER.map(function (k) {
      return '<button type="button" class="opt" data-k="' + k + '"><b>' + TI.INFO[k].n + '</b><small>' + TI.INFO[k].d + '</small></button>';
    }).join('');
    optsEl.onclick = function (e) { var b = e.target.closest('.opt'); if (b) cfg.toggle(b.dataset.k); };

    var swEl = g('cfgColors');
    swEl.innerHTML = Object.keys(TI.COLORS).map(function (k) {
      return '<button type="button" data-c="' + k + '" title="' + TI.COLOR_NAMES[k] + '" aria-label="' + TI.COLOR_NAMES[k] + '" style="background:#' + ('000000' + TI.COLORS[k].toString(16)).slice(-6) + '"></button>';
    }).join('');
    swEl.onclick = function (e) { var b = e.target.closest('button'); if (b) cfg.setColor(b.dataset.c); };

    g('cfgViews').onclick = function (e) { var b = e.target.closest('button'); if (b) cfg.setView(b.dataset.v); };
    g('cfgAll').onclick = function () { cfg.all(true); };
    g('cfgReset').onclick = function () { cfg.all(false); cfg.setColor('blanco'); cfg.setView('three'); };
    g('cfgSend').onclick = function () {
      var on = TI.ORDER.filter(function (k) { return cfg.state.parts[k]; }).map(function (k) { return TI.INFO[k].n; });
      var msg = 'Hola! Armé mi 4x4 en la web de ML Equipamiento. Color: ' + TI.COLOR_NAMES[cfg.state.color] +
        '. Equipamiento: ' + (on.length ? on.join(', ') : 'todavía sin elegir') + '. ¿Me pasan presupuesto?';
      window.open(waURL(msg), '_blank');
    };

    cfgSync = function (s) {
      var n = 0;
      optsEl.querySelectorAll('.opt').forEach(function (b) { var on = !!s.parts[b.dataset.k]; b.classList.toggle('on', on); if (on) n++; });
      swEl.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.c === s.color); });
      g('cfgViews').querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === s.view); });
      g('cfgCount').textContent = n;
    };
    cfg.onChange(function (s) { cfgSync(s); });

    // demo inicial: se arma sola la primera vez que se ve
    if (window.IntersectionObserver && !reduce) {
      var once = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) {
          once.disconnect();
          cfg.assemble(['llantas', 'estribos', 'defensa', 'barras', 'tapa', 'faros'], 380, 500);
        }
      }, { threshold: 0.35 });
      once.observe(g('cfgStage'));
    }
  }

  // ---------- Recorrido 3D guiado por scroll ----------
  var scrEl = g('recorrido');
  if (scrEl) {
    var st = null, doUpdate = null;
    if (window.createRanger) st = window.createRanger(g('scrStage'), { model: RANGER_URL, onError: function () { swapToProcedural(); } });
    var proc = false;
    if (!st && window.createTruck) { st = window.createTruck(g('scrStage'), { theme: 'dark', hint: false }); proc = true; }
    function swapToProcedural() {
      if (proc || !window.createTruck) return;
      try { st.destroy && st.destroy(); } catch (e) {}
      g('scrStage').innerHTML = '';
      st = window.createTruck(g('scrStage'), { theme: 'dark', hint: false }); proc = true; KEYS = KP; cur = -1; if (doUpdate) doUpdate();
    }
    if (!st) { scrEl.remove(); }
    else {
      var KP = [[-0.55, 0.28, 1.05, 0.75], [0.0, 0.12, 0.8, 0.55], [0.3, 0.08, 0.85, 0.5], [1.75, 0.42, 0.85, 1.1],
        [4.35, 0.14, 0.78, 0.8], [4.95, 0.12, 0.62, 1.35], [5.73, 0.28, 1.05, 0.75]];
      var KR = [[-0.6, 0.26, 1.0, 0.8], [-0.1, 0.1, 0.8, 0.6], [-1.57, 0.08, 0.85, 0.55], [-3.5, 0.5, 0.85, 1.0],
        [-4.7, 0.16, 0.8, 0.8], [-5.9, 0.12, 0.62, 1.1], [-6.88, 0.26, 1.0, 0.8]];
      var KEYS = proc ? KP : KR;
      var PARTS = [[], ['llantas'], ['llantas','estribos'], ['llantas','estribos','barras','tapa'],
        ['llantas','estribos','barras','tapa','defensa'], ['llantas','estribos','barras','tapa','defensa','faros'],
        ['llantas','estribos','barras','tapa','defensa','faros']];
      var chs = scrEl.querySelectorAll('.ch'), nEl = g('scrN'), bar = g('scrBar'), sc = scrEl.querySelector('.scr-sc');
      var cur = -1, N = KEYS.length - 1;
      function sm(x) { return x * x * (3 - 2 * x); }
      function update() {
        var r = scrEl.getBoundingClientRect(), total = r.height - innerHeight;
        var p = total > 0 ? Math.max(0, Math.min(1, -r.top / total)) : 0;
        var f = p * N, i = Math.min(N - 1, Math.floor(f)), t = sm(Math.min(1, Math.max(0, (f - i - 0.12) / 0.76)));
        var a = KEYS[i], b = KEYS[i + 1];
        st.scrub({ yaw: a[0] + (b[0] - a[0]) * t, pitch: a[1] + (b[1] - a[1]) * t, zoom: a[2] + (b[2] - a[2]) * t, ty: a[3] + (b[3] - a[3]) * t });
        var idx = Math.round(f);
        if (idx !== cur) {
          cur = idx;
          TI.ORDER.forEach(function (k) { st.set(k, PARTS[idx].indexOf(k) > -1); });
          chs.forEach(function (c, n) { c.classList.toggle('on', n === idx); });
          nEl.textContent = ('0' + idx).slice(-2);
        }
        bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        sc.classList.toggle('gone', p > 0.04);
      }
      scrEl.addEventListener('click', function (e) {
        var a = e.target.closest('a[data-q]'); if (!a) return;
        e.preventDefault();
        window.open(waURL('Hola! Vi el recorrido 3D en la web de ML Equipamiento y quiero cotizar: ' + a.dataset.q + '.'), '_blank');
      });
      doUpdate = update;
      addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update();
    }
  }

  // ---------- Tilt 3D en tarjetas + botones magnéticos ----------
  if (fine && !reduce) {
    var lastCard = null, lastBtn = null;
    document.addEventListener('pointermove', function (e) {
      var t = e.target;
      var card = t.closest ? t.closest('.cat,.p,.step') : null;
      if (lastCard && lastCard !== card) { lastCard.classList.remove('tilting'); lastCard.style.transform = ''; }
      if (card) {
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.classList.add('tilting');
        card.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y) * 10).toFixed(2) + 'deg) rotateY(' + ((x - 0.5) * 12).toFixed(2) + 'deg) translateY(-6px)';
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      }
      lastCard = card;

      var btn = t.closest ? t.closest('.btn') : null;
      if (lastBtn && lastBtn !== btn) lastBtn.style.transform = '';
      if (btn) {
        var b = btn.getBoundingClientRect();
        btn.style.transform = 'translate(' + (((e.clientX - b.left) / b.width - 0.5) * 8).toFixed(1) + 'px,' + (((e.clientY - b.top) / b.height - 0.5) * 6).toFixed(1) + 'px)';
      }
      lastBtn = btn;
    });
  }

  // ---------- Scroll: barra de progreso, parallax y velocidad de la cinta ----------
  var prog = g('prog'), topo = document.querySelector('.topo'), mq = g('mq');
  function onScroll() {
    var max = document.documentElement.scrollHeight - innerHeight;
    if (prog) prog.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
    if (topo && !reduce && scrollY < 1400) topo.style.transform = 'translateY(' + (scrollY * 0.12).toFixed(1) + 'px)';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  if (!reduce && mq && mq.getAnimations) {
    var lastY = scrollY, vel = 0;
    (function loop() {
      var dy = Math.abs(scrollY - lastY); lastY = scrollY;
      vel += (dy - vel) * 0.1;
      var a = mq.getAnimations();
      if (a[0]) a[0].playbackRate = 1 + Math.min(vel, 40) * 0.25;
      requestAnimationFrame(loop);
    })();
  }

  // ---------- Contadores ----------
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && window.IntersectionObserver) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (x) {
        if (!x.isIntersecting) return;
        co.unobserve(x.target);
        var el = x.target, end = +el.dataset.count, t0 = performance.now();
        (function step(t) {
          var p = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * e);
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }
})();
