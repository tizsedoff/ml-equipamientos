/* Camioneta 4x4 en 3D (Three.js r128) - armable, girable e interactiva */
(function () {
  'use strict';
  var T = window.THREE;

  var COLORS = { blanco: 0xdcdbd6, negro: 0x1a1c1f, gris: 0x636a72, rojo: 0xa8271d, azul: 0x20426b, arena: 0xb7a27a };
  var COLOR_NAMES = { blanco: 'Blanco', negro: 'Negro', gris: 'Gris', rojo: 'Rojo', azul: 'Azul', arena: 'Arena' };
  var ORDER = ['estribos', 'defensa', 'barras', 'tapa', 'faros', 'llantas'];
  var INFO = {
    estribos: { n: 'Estribos', d: 'Acceso cómodo y protección lateral', hs: [0.15, 0.85, 1.1] },
    defensa:  { n: 'Defensa', d: 'Defensa delantera reforzada', hs: [2.5, 1.3, 0] },
    barras:   { n: 'Barras', d: 'Barras portaequipaje y antivuelco', hs: [-1.35, 2.45, 0] },
    tapa:     { n: 'Tapa de caja', d: 'Tapa rígida o retráctil', hs: [-1.35, 1.8, 0.6] },
    faros:    { n: 'Faros LED', d: 'Barra LED de techo y auxiliares', hs: [0.5, 2.2, 0] },
    llantas:  { n: 'Llantas', d: 'Llantas deportivas todo terreno', hs: [1.45, 0.62, 1.2] }
  };
  var VIEWS = {
    three: { yaw: -0.55, pitch: 0.28 },
    front: { yaw: -Math.PI / 2, pitch: 0.15 },
    side:  { yaw: 0, pitch: 0.1 },
    rear:  { yaw: Math.PI / 2, pitch: 0.2 },
    top:   { yaw: -0.4, pitch: 1.15 }
  };
  window.TRUCK_INFO = { COLORS: COLORS, COLOR_NAMES: COLOR_NAMES, ORDER: ORDER, INFO: INFO };

  function glOK() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }
  function easeOutBack(x) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function wrapPI(a) { return ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; }

  function envTexture() {
    var c = document.createElement('canvas'); c.width = 512; c.height = 256;
    var g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, '#dfe6ea'); gr.addColorStop(0.5, '#ffc89a');
    gr.addColorStop(0.56, '#7a7e82'); gr.addColorStop(1, '#2a2c2e');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    g.fillStyle = 'rgba(255,255,255,.95)'; g.fillRect(60, 30, 120, 50); g.fillRect(330, 20, 140, 40);
    var t = new T.CanvasTexture(c); t.mapping = T.EquirectangularReflectionMapping; return t;
  }

  window.createTruck = function (container, opts) {
    opts = opts || {};
    if (!T || !container || !glOK()) return null;
    var dark = opts.theme === 'dark';
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    var renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    var canvas = renderer.domElement; canvas.className = 'gl';
    container.appendChild(canvas);

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(32, 1, 0.1, 100);
    try {
      var pm = new T.PMREMGenerator(renderer);
      var et = envTexture();
      scene.environment = pm.fromEquirectangular(et).texture;
      et.dispose(); pm.dispose();
    } catch (e) { /* sin reflejos */ }

    // ---- luces ----
    scene.add(new T.HemisphereLight(0xffffff, 0x8a8f94, 0.42));
    var key = new T.DirectionalLight(0xffffff, 0.85);
    key.position.set(5, 8, 4); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
    key.shadow.bias = -0.0006;
    scene.add(key);
    var fill = new T.DirectionalLight(0xbcd0ff, 0.45); fill.position.set(-6, 3, -3); scene.add(fill);
    var rim = new T.DirectionalLight(0xffb98a, 0.7); rim.position.set(-4, 4, -6); scene.add(rim);

    // ---- materiales ----
    function mat(c, m, r, extra) {
      var o = { color: c, metalness: m, roughness: r };
      if (extra) for (var k in extra) o[k] = extra[k];
      return new T.MeshStandardMaterial(o);
    }
    var paint = mat(COLORS.blanco, 0.4, 0.33);
    var darkM = mat(0x15171a, 0.3, 0.6);
    var glass = mat(0x7f98a8, 0.85, 0.1, { transparent: true, opacity: 0.72 });
    var tireM = mat(0x0d0e10, 0, 0.95);
    var steel = mat(0xb8bcc2, 0.9, 0.3);
    var orange = mat(0xe8590c, 0.4, 0.38);
    var blk = mat(0x0b0c0e, 0.5, 0.45);
    var lidM = mat(0x2a2e33, 0.5, 0.45);
    var led = mat(0xfff2d0, 0, 0.4, { emissive: 0xffe2a8, emissiveIntensity: 1.6 });
    var tail = mat(0x7a0d0d, 0, 0.5, { emissive: 0xff2a1a, emissiveIntensity: 0.8 });

    // ---- helpers ----
    function M(geo, m, x, y, z, parent) {
      var o = new T.Mesh(geo, m);
      o.position.set(x || 0, y || 0, z || 0);
      o.castShadow = true; o.receiveShadow = true;
      if (parent) parent.add(o);
      return o;
    }
    function B(w, h, d, m, x, y, z, p) { return M(new T.BoxGeometry(w, h, d), m, x, y, z, p); }
    function C(r, h, m, x, y, z, p, axis) {
      var g = new T.CylinderGeometry(r, r, h, 16);
      if (axis === 'x') g.rotateZ(Math.PI / 2); else if (axis === 'z') g.rotateX(Math.PI / 2);
      return M(g, m, x, y, z, p);
    }
    function ext(pts, depth, m, parent, bevel) {
      var s = new T.Shape(); s.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
      s.closePath();
      var g = new T.ExtrudeGeometry(s, { depth: depth, bevelEnabled: !!bevel, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, steps: 1 });
      g.translate(0, 0, -depth / 2);
      var o = new T.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
    }

    // ---- escena base: plataforma giratoria + camioneta ----
    var rig = new T.Group(); scene.add(rig);
    var disc = M(new T.CylinderGeometry(3.3, 3.3, 0.06, 72), mat(dark ? 0x2b3036 : 0x9a9588, 0, 0.95, { envMapIntensity: 0.15 }), 0, -0.03, 0, rig);
    disc.castShadow = false;
    var ring = new T.Mesh(new T.RingGeometry(3.12, 3.18, 96), new T.MeshBasicMaterial({ color: 0xe8590c, side: T.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.004; rig.add(ring);
    var ticks = new T.InstancedMesh(new T.BoxGeometry(0.03, 0.01, 0.16), new T.MeshBasicMaterial({ color: dark ? 0x8a9097 : 0x8c887c }), 72);
    var dm = new T.Object3D();
    for (var i = 0; i < 72; i++) {
      var an = i / 72 * Math.PI * 2;
      dm.position.set(Math.cos(an) * 2.98, 0.006, Math.sin(an) * 2.98); dm.rotation.set(0, -an, 0); dm.updateMatrix();
      ticks.setMatrixAt(i, dm.matrix);
    }
    rig.add(ticks);

    var truck = new T.Group(); rig.add(truck);

    // carrocería
    B(4.7, 0.5, 1.85, paint, 0, 0.95, 0, truck);
    B(4.72, 0.13, 1.88, darkM, 0, 0.72, 0, truck);
    B(1.3, 0.4, 1.8, paint, 1.7, 1.4, 0, truck);
    B(0.04, 0.3, 1.2, blk, 2.36, 1.4, 0, truck);
    B(0.05, 0.14, 0.32, led, 2.37, 1.42, 0.7, truck);
    B(0.05, 0.14, 0.32, led, 2.37, 1.42, -0.7, truck);
    B(0.22, 0.32, 1.95, darkM, 2.4, 0.92, 0, truck);
    // cabina
    ext([[-0.45, 1.2], [-0.4, 2.05], [0.55, 2.05], [1.05, 1.6], [1.05, 1.2]], 1.78, paint, truck, true);
    ext([[-0.46, 1.55], [-0.41, 1.97], [0.67, 1.97], [1.08, 1.62], [1.08, 1.55]], 1.9, glass, truck, false);
    [-1, 1].forEach(function (s) {
      B(0.06, 0.45, 0.05, paint, 0.2, 1.75, s * 0.95, truck);
      B(0.015, 0.8, 0.02, darkM, -0.1, 1.55, s * 0.925, truck);
      B(0.015, 0.8, 0.02, darkM, 0.7, 1.55, s * 0.925, truck);
      B(0.14, 0.04, 0.05, steel, 0.45, 1.5, s * 0.93, truck);
      B(0.12, 0.1, 0.07, darkM, 0.95, 1.74, s * 1.02, truck);
      B(0.04, 0.04, 0.16, darkM, 0.95, 1.7, s * 0.93, truck);
      B(0.04, 0.22, 0.12, tail, -2.34, 1.4, s * 0.8, truck);
    });
    // caja
    B(1.85, 0.08, 1.76, darkM, -1.375, 1.27, 0, truck);
    B(1.85, 0.45, 0.08, paint, -1.375, 1.45, 0.88, truck);
    B(1.85, 0.45, 0.08, paint, -1.375, 1.45, -0.88, truck);
    B(0.08, 0.45, 1.84, paint, -2.3, 1.45, 0, truck);

    // ruedas
    var wheels = [];
    function makeWheel(x, z) {
      var g = new T.Group(); g.position.set(x, 0.62, z);
      var spin = new T.Group(); g.add(spin);
      C(0.62, 0.42, tireM, 0, 0, 0, spin, 'z');
      var tr = new T.InstancedMesh(new T.BoxGeometry(0.1, 0.15, 0.4), tireM, 28);
      var o = new T.Object3D();
      for (var k = 0; k < 28; k++) {
        var a = k / 28 * Math.PI * 2;
        o.position.set(Math.cos(a) * 0.65, Math.sin(a) * 0.65, 0); o.rotation.set(0, 0, a); o.updateMatrix(); tr.setMatrixAt(k, o.matrix);
      }
      tr.castShadow = true; spin.add(tr);
      // llanta de serie
      var stock = new T.Group(); spin.add(stock);
      C(0.35, 0.43, steel, 0, 0, 0, stock, 'z');
      C(0.22, 0.44, darkM, 0, 0, 0, stock, 'z');
      for (var n = 0; n < 5; n++) {
        var an2 = n / 5 * Math.PI * 2;
        C(0.025, 0.02, steel, Math.cos(an2) * 0.15, Math.sin(an2) * 0.15, 0.225, stock, 'z');
        C(0.025, 0.02, steel, Math.cos(an2) * 0.15, Math.sin(an2) * 0.15, -0.225, stock, 'z');
      }
      // llanta deportiva
      var sport = new T.Group(); spin.add(sport); sport.visible = false;
      C(0.34, 0.38, darkM, 0, 0, 0, sport, 'z');
      [0.21, -0.21].forEach(function (zz) {
        var tor = new T.Mesh(new T.TorusGeometry(0.36, 0.045, 10, 40), orange); tor.position.z = zz; tor.castShadow = true; sport.add(tor);
        for (var s2 = 0; s2 < 3; s2++) {
          var sp = B(0.72, 0.075, 0.07, steel, 0, 0, zz, sport); sp.rotation.z = s2 * Math.PI / 3;
        }
        C(0.1, 0.03, orange, 0, 0, zz * 1.1, sport, 'z');
      });
      truck.add(g);
      // pasarruedas
      var fl = new T.Mesh(new T.TorusGeometry(0.74, 0.06, 8, 32, Math.PI), darkM);
      fl.position.set(x, 0.62, z * 0.98); fl.castShadow = true; truck.add(fl);
      return { g: g, spin: spin, stock: stock, sport: sport, pop: 1 };
    }
    [[1.45, 0.97], [1.45, -0.97], [-1.4, 0.97], [-1.4, -0.97]].forEach(function (p) { wheels.push(makeWheel(p[0], p[1])); });

    // ---- accesorios (cada uno con su pivote) ----
    var acc = {};
    function addAcc(name, px, py, pz, build) {
      var g = new T.Group(); g.position.set(px, py, pz); build(g); g.visible = false; g.scale.setScalar(0.0001);
      truck.add(g); acc[name] = { g: g, px: px, py: py, pz: pz, a: 0, t: 0 };
    }
    addAcc('estribos', 0.15, 0.8, 0, function (g) {
      [-1, 1].forEach(function (s) {
        B(1.15, 0.07, 0.26, blk, 0, 0, s * 1.08, g);
        B(1.15, 0.02, 0.05, orange, 0, 0.04, s * 1.08, g);
        for (var i = -2; i <= 2; i++) B(0.02, 0.015, 0.2, orange, i * 0.2, 0.045, s * 1.08, g);
        B(0.07, 0.07, 0.2, steel, -0.4, 0.04, s * 0.97, g);
        B(0.07, 0.07, 0.2, steel, 0.4, 0.04, s * 0.97, g);
      });
    });
    addAcc('defensa', 2.45, 1.1, 0, function (g) {
      B(0.18, 0.26, 1.95, blk, 0.08, -0.12, 0, g);
      C(0.045, 1.7, blk, 0.2, 0.3, 0, g, 'z');
      C(0.045, 1.7, blk, 0.2, 0.62, 0, g, 'z');
      [-0.8, -0.3, 0.3, 0.8].forEach(function (z) { C(0.045, 0.62, blk, 0.2, 0.31, z, g); });
      B(0.07, 0.24, 0.9, orange, 0.22, 0.08, 0, g);
      B(0.2, 0.16, 0.34, steel, 0.12, -0.12, 0, g);
    });
    addAcc('barras', -1.35, 1.72, 0, function (g) {
      [-1, 1].forEach(function (s) {
        [-0.75, 0.75].forEach(function (x) { C(0.035, 0.68, blk, x, 0.28, s * 0.86, g); });
        C(0.035, 1.5, blk, 0, 0.62, s * 0.86, g, 'x');
      });
      [-0.75, 0.75].forEach(function (x) { C(0.035, 1.72, blk, x, 0.62, 0, g, 'z'); });
      [-0.4, 0, 0.4].forEach(function (x) { C(0.03, 1.72, orange, x, 0.62, 0, g, 'z'); });
    });
    addAcc('tapa', -1.375, 1.7, 0, function (g) {
      B(1.9, 0.07, 1.84, lidM, 0, 0.03, 0, g);
      B(1.9, 0.078, 0.08, orange, 0, 0.035, 0, g);
      for (var i = -11; i <= 11; i++) B(0.012, 0.08, 1.82, blk, i * 0.08, 0.035, 0, g);
      B(0.1, 0.13, 1.86, blk, 0.95, 0.04, 0, g);
      B(0.1, 0.13, 1.86, blk, -0.95, 0.04, 0, g);
    });
    var headlight = new T.PointLight(0xffe7b8, 0, 7); headlight.position.set(1.6, 2.3, 0); truck.add(headlight);
    addAcc('faros', 0.5, 2.12, 0, function (g) {
      B(0.14, 0.1, 1.25, blk, 0, 0, 0, g);
      B(0.02, 0.07, 1.15, led, 0.075, 0, 0, g);
      B(0.05, 0.08, 0.06, steel, 0, -0.07, 0.4, g);
      B(0.05, 0.08, 0.06, steel, 0, -0.07, -0.4, g);
      [-0.6, 0.6].forEach(function (z) {
        var pod = C(0.09, 0.08, led, 1.95, -1.14, z, g, 'x');
        C(0.11, 0.05, blk, 1.9, -1.14, z, g, 'x');
      });
    });

    // ---- estado ----
    var state = { parts: {}, color: 'blanco', view: 'three' };
    ORDER.forEach(function (k) { state.parts[k] = false; });
    var listeners = [];
    var sportOn = false, spinVal = 0, spinTarget = 0;
    var bounceY = 0, bounceV = 0;
    var targetColor = new T.Color(COLORS.blanco);

    function emit() { listeners.forEach(function (f) { f(state); }); }
    function set(name, on, silent) {
      if (!INFO[name]) return;
      on = !!on;
      if (state.parts[name] === on) return;
      state.parts[name] = on;
      if (name === 'llantas') {
        sportOn = on; spinTarget += (on ? 1 : -1) * Math.PI * 2;
        wheels.forEach(function (w) { w.pop = 0.55; });
      } else {
        acc[name].t = on ? 1 : 0;
      }
      bounceV = -1.4;
      refreshLabels();
      if (!silent) emit();
    }
    function toggle(name) { set(name, !state.parts[name]); }
    function all(on) { ORDER.forEach(function (k) { set(k, on, true); }); emit(); }
    function setColor(key) { if (!COLORS[key]) return; state.color = key; targetColor.setHex(COLORS[key]); emit(); }

    // ---- cámara / órbita ----
    var yaw = VIEWS.three.yaw, pitch = VIEWS.three.pitch;
    var yawVel = 0, tView = null, idle = 0, dragging = false;
    var offYaw = 0, offPitch = 0, tOffYaw = 0, tOffPitch = 0;
    var target = new T.Vector3(0, 0.75, 0);
    var R = 9;
    var ext = null, eYaw = yaw, ePitch = pitch, eZoom = 1, eTy = 0.75, eTx = 0;
    function scrub(o) { ext = o; if (o) container.classList.add('scrubbing'); else container.classList.remove('scrubbing'); }
    function setView(name) {
      if (!VIEWS[name]) return;
      state.view = name; tView = VIEWS[name]; yawVel = 0; idle = 0; emit();
    }

    var lx = 0, ly = 0;
    canvas.addEventListener('pointerdown', function (e) {
      dragging = true; lx = e.clientX; ly = e.clientY; yawVel = 0; tView = null; idle = 0;
      try { canvas.setPointerCapture(e.pointerId); } catch (er) {}
      container.classList.add('grabbing');
      if (hint) hint.classList.add('gone');
    });
    canvas.addEventListener('pointermove', function (e) {
      var r = container.getBoundingClientRect();
      tOffYaw = ((e.clientX - r.left) / r.width - 0.5) * 0.3;
      tOffPitch = ((e.clientY - r.top) / r.height - 0.5) * -0.08;
      if (!dragging) return;
      var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      yaw += dx * 0.009; yawVel = dx * 0.009;
      if (e.pointerType !== 'touch') pitch = Math.max(0.05, Math.min(1.2, pitch + dy * 0.005));
      idle = 0;
    });
    function endDrag() { dragging = false; container.classList.remove('grabbing'); }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('pointerleave', function () { tOffYaw = 0; tOffPitch = 0; });

    // ---- etiquetas (hotspots) ----
    var overlay = document.createElement('div'); overlay.className = 'ovl'; container.appendChild(overlay);
    var labels = {};
    ORDER.forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'hs'; b.dataset.k = k;
      b.innerHTML = '<i></i><span>' + INFO[k].n + '</span>';
      b.setAttribute('aria-label', INFO[k].n);
      b.addEventListener('click', function () { toggle(k); });
      overlay.appendChild(b); labels[k] = b;
    });
    function refreshLabels() { ORDER.forEach(function (k) { labels[k].classList.toggle('on', !!state.parts[k]); }); }
    var hint = null;
    if (opts.hint !== false) {
      hint = document.createElement('div'); hint.className = 'hint';
      hint.innerHTML = '<b>↔</b> Arrastrá para girar · tocá los puntos';
      container.appendChild(hint);
    }
    var tmp = new T.Vector3();
    function updateLabels(w, h) {
      var dc = camera.position.distanceTo(target);
      ORDER.forEach(function (k) {
        var p = INFO[k].hs; tmp.set(p[0], p[1], p[2]); truck.localToWorld(tmp);
        var d = camera.position.distanceTo(tmp); tmp.project(camera);
        var x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h;
        var el = labels[k], hide = d > dc + 1.0;
        el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
        el.style.opacity = hide ? '0' : '1';
        el.style.pointerEvents = hide ? 'none' : '';
        el.classList.toggle('lf', x > w * 0.68);
      });
    }

    // ---- tamaño ----
    var W = 1, H = 1;
    function resize() {
      W = Math.max(1, container.clientWidth); H = Math.max(1, container.clientHeight);
      renderer.setSize(W, H, false);
      camera.aspect = W / H; camera.updateProjectionMatrix();
      R = Math.max(9.2, 13.4 / camera.aspect);
    }
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(container); else window.addEventListener('resize', resize);

    // ---- loop ----
    var visible = true, clock = new T.Clock(), started = false;
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible && !started) { started = true; if (opts.autoAssemble && !reduce) assemble(ORDER.slice().sort(function (a, b) { return a === 'llantas' ? -1 : b === 'llantas' ? 1 : 0; }), 560, 900); else if (opts.autoAssemble) all(true); }
      }, { threshold: 0.15 }).observe(container);
    }
    function assemble(list, gap, delay) {
      list.forEach(function (k, i) { setTimeout(function () { set(k, true); }, (delay || 0) + i * gap); });
    }

    function frame() {
      requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      var dt = Math.min(clock.getDelta(), 0.05);

      // órbita
      if (ext) {
        var k2 = Math.min(1, dt * 6);
        eYaw += (ext.yaw - eYaw) * k2; ePitch += (ext.pitch - ePitch) * k2;
        eZoom += ((ext.zoom || 1) - eZoom) * k2; eTy += ((ext.ty == null ? 0.75 : ext.ty) - eTy) * k2; eTx += ((ext.tx || 0) - eTx) * k2;
        yaw = eYaw; pitch = ePitch; yawVel = 0; idle = 0;
      } else if (tView) {
        yaw += wrapPI(tView.yaw - yaw) * Math.min(1, dt * 5);
        pitch += (tView.pitch - pitch) * Math.min(1, dt * 5);
        if (Math.abs(wrapPI(tView.yaw - yaw)) < 0.01 && Math.abs(tView.pitch - pitch) < 0.01) tView = null;
      } else if (!dragging) {
        yaw += yawVel; yawVel *= 0.93;
        idle += dt;
        if (idle > 2.5 && !reduce) yaw += dt * 0.22;
      }
      offYaw += (tOffYaw - offYaw) * Math.min(1, dt * 4);
      offPitch += (tOffPitch - offPitch) * Math.min(1, dt * 4);
      rig.rotation.y = yaw + offYaw;
      var p = pitch + offPitch;
      if (ext) { target.set(eTx, eTy, 0); } else { target.set(0, 0.75, 0); }
      var RR = ext ? R * eZoom : R;
      camera.position.set(target.x, target.y + Math.sin(p) * RR, Math.cos(p) * RR);
      camera.lookAt(target);

      // accesorios
      for (var k in acc) {
        var a = acc[k];
        a.a += (a.t - a.a) * Math.min(1, dt * 5);
        if (Math.abs(a.t - a.a) < 0.002) a.a = a.t;
        a.g.visible = a.a > 0.01;
        var e = Math.max(0.0001, easeOutBack(a.a));
        a.g.scale.setScalar(e);
        a.g.position.set(a.px, a.py + (1 - a.a) * 1.1, a.pz);
        a.g.rotation.y = (1 - a.a) * 0.6;
      }
      headlight.intensity = acc.faros.a * 1.6;
      spinVal += (spinTarget - spinVal) * Math.min(1, dt * 4);
      wheels.forEach(function (w) {
        w.sport.visible = sportOn; w.stock.visible = !sportOn;
        w.spin.rotation.z = -spinVal;
        w.pop += (1 - w.pop) * Math.min(1, dt * 6);
        w.g.scale.setScalar(w.pop);
      });
      // rebote de suspensión
      bounceV += (-90 * bounceY - 7 * bounceV) * dt; bounceY += bounceV * dt;
      truck.position.y = bounceY * 0.05;
      paint.color.lerp(targetColor, Math.min(1, dt * 6));

      rig.updateMatrixWorld(true);
      renderer.render(scene, camera);
      updateLabels(W, H);
    }
    frame();

    return {
      state: state, set: set, toggle: toggle, all: all, setColor: setColor, setView: setView,
      assemble: assemble, scrub: scrub, onChange: function (f) { listeners.push(f); f(state); }
    };
  };
})();
