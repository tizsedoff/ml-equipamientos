/* Ford Ranger real (GLB) + accesorios armables, controlada por scroll (Three.js r128) */
(function () {
  'use strict';
  var T = window.THREE;
  var COLORS = { blanco: 0xdcdbd6, negro: 0x1a1c1f, gris: 0x636a72, rojo: 0xa8271d, azul: 0x20426b, arena: 0xb7a27a };
  var ORDER = ['llantas', 'estribos', 'barras', 'tapa', 'defensa', 'faros', 'enganche'];

  // perfiles por camioneta: anclajes de los accesorios (m), llantas, escalas y puntos de los rótulos
  var PROFILES = {
    ranger: { file: 'models/ranger.glb', fit: 0, wheels: [1.8, -1.43], track: 0.945, wy: 0.405, pos: {}, sc: {}, accS: 1, hs: {} },
    amarok: {
      file: 'models/amarok.glb', fit: 5.25, wheels: [1.73, -1.25], track: 0.9, wy: 0.395,
      pos: { estribos: [0, 0.4, 0.17], defensa: [0, 0.5, 2.24], barras: [0, 1.27, -1.2], tapa: [0, 1.27, -1.62], faros: [0, 1.72, 0.5], enganche: [0, 0.5, -2.39] },
      sc: { estribos: 0.97, barras: 0.9, tapa: 0.88, faros: 0.9 }, accS: 0.9,
      hs: { estribos: [1.0, 0.5, 0.17], defensa: [0, 0.8, 2.8], barras: [0, 1.9, -1.2], tapa: [0, 1.4, -1.65], faros: [0, 1.8, 0.5], llantas: [0.9, 0.8, 1.73], enganche: [0, 0.5, -2.8] }
    }
  };
  function glOK() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
  }
  function easeOutBack(x) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function envTexture() {
    var c = document.createElement('canvas'); c.width = 512; c.height = 256;
    var g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, '#dfe6ea'); gr.addColorStop(0.5, '#ffc89a');
    gr.addColorStop(0.56, '#7a7e82'); gr.addColorStop(1, '#2a2c2e');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    g.fillStyle = 'rgba(255,255,255,.95)'; g.fillRect(60, 30, 120, 50); g.fillRect(330, 20, 140, 40);
    var t = new T.CanvasTexture(c); t.mapping = T.EquirectangularReflectionMapping; return t;
  }

  window.createRanger = function (container, opts) {
    opts = opts || {};
    var P = PROFILES[opts.vehicle] || PROFILES.ranger, dead = false;
    if (!T || !T.GLTFLoader || !T.DRACOLoader || !container || !glOK()) return null;
    var renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    var canvas = renderer.domElement; canvas.className = 'gl'; container.appendChild(canvas);

    var scene = new T.Scene(), camera = new T.PerspectiveCamera(32, 1, 0.1, 100);
    try {
      var pm = new T.PMREMGenerator(renderer), et = envTexture();
      scene.environment = pm.fromEquirectangular(et).texture; et.dispose(); pm.dispose();
    } catch (e) {}
    scene.add(new T.HemisphereLight(0xffffff, 0x8a8f94, 0.5));
    var key = new T.DirectionalLight(0xffffff, 0.9); key.position.set(5, 8, 5); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 5; key.shadow.camera.bottom = -5; key.shadow.bias = -0.0006;
    scene.add(key);
    var fill = new T.DirectionalLight(0xbcd0ff, 0.45); fill.position.set(-6, 3, -3); scene.add(fill);
    var rim = new T.DirectionalLight(0xffb98a, 0.7); rim.position.set(-4, 4, -6); scene.add(rim);

    function mat(c, m, r, extra) { var o = { color: c, metalness: m, roughness: r }; if (extra) for (var k in extra) o[k] = extra[k]; return new T.MeshStandardMaterial(o); }
    var steel = mat(0xb8bcc2, 0.9, 0.3), orange = mat(0xe8590c, 0.4, 0.38), blk = mat(0x0b0c0e, 0.5, 0.45),
      lidM = mat(0x2a2e33, 0.5, 0.45), darkM = mat(0x15171a, 0.3, 0.6),
      led = mat(0xfff2d0, 0, 0.4, { emissive: 0xffe2a8, emissiveIntensity: 1.6 });
    function M(geo, m, x, y, z, p) { var o = new T.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; o.receiveShadow = true; if (p) p.add(o); return o; }
    function B(w, h, d, m, x, y, z, p) { return M(new T.BoxGeometry(w, h, d), m, x, y, z, p); }
    function C(r, h, m, x, y, z, p, axis) {
      var g = new T.CylinderGeometry(r, r, h, 16);
      if (axis === 'x') g.rotateZ(Math.PI / 2); else if (axis === 'z') g.rotateX(Math.PI / 2);
      return M(g, m, x, y, z, p);
    }

    // plataforma
    var rig = new T.Group(); scene.add(rig);
    var lightT = opts.theme === 'light';
    var disc = M(new T.CylinderGeometry(4.1, 4.1, 0.06, 80), mat(lightT ? 0xece9e2 : 0x2b3036, 0, 0.95, { envMapIntensity: 0.15 }), 0, -0.03, 0, rig); disc.castShadow = false;
    var ring = new T.Mesh(new T.RingGeometry(3.9, 3.96, 96), new T.MeshBasicMaterial({ color: 0xe8590c, side: T.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.004; rig.add(ring);
    var ticks = new T.InstancedMesh(new T.BoxGeometry(0.03, 0.01, 0.16), new T.MeshBasicMaterial({ color: lightT ? 0xb9b4aa : 0x8a9097 }), 72), dm = new T.Object3D();
    for (var i = 0; i < 72; i++) { var an = i / 72 * Math.PI * 2; dm.position.set(Math.cos(an) * 3.7, 0.006, Math.sin(an) * 3.7); dm.rotation.set(0, -an, 0); dm.updateMatrix(); ticks.setMatrixAt(i, dm.matrix); }
    rig.add(ticks);

    if (opts.interactive) { disc.scale.set(0.66, 1, 0.66); ring.scale.setScalar(0.66); ticks.scale.set(0.66, 1, 0.66); }
    var truck = new T.Group(); rig.add(truck);   // frente = +z, lado izquierdo = +x
    var holder = new T.Group(); truck.add(holder);
    var paintMats = [], targetColor = new T.Color(COLORS.blanco);

    // ---- accesorios (medidas de la Ranger, en metros) ----
    var acc = {};
    function addAcc(name, px, py, pz, build) {
      var o = P.pos[name]; if (o) { px = o[0]; py = o[1]; pz = o[2]; }
      var g = new T.Group(); g.position.set(px, py, pz); build(g); g.visible = false; g.scale.setScalar(0.0001);
      truck.add(g); acc[name] = { g: g, px: px, py: py, pz: pz, a: 0, t: 0, s: P.sc[name] || 1 };
    }
    addAcc('estribos', 0, 0.42, 0.1, function (g) {
      [-1, 1].forEach(function (s) {
        B(0.17, 0.07, 1.95, blk, s * 1.0, 0, 0, g);
        B(0.19, 0.02, 1.95, orange, s * 1.0, 0.045, 0, g);
        for (var k = -4; k <= 4; k++) B(0.15, 0.012, 0.03, blk, s * 1.0, 0.058, k * 0.2, g);
        [-0.7, 0.7].forEach(function (z) { B(0.2, 0.05, 0.08, steel, s * 0.92, 0.02, z, g); });
      });
    });
    addAcc('defensa', 0, 0.5, 2.48, function (g) {
      B(1.55, 0.2, 0.14, blk, 0, -0.25, -0.02, g);
      B(0.7, 0.14, 0.05, orange, 0, -0.22, 0.07, g);
      C(0.04, 1.5, blk, 0, 0.05, 0.1, g, 'x');
      C(0.04, 1.5, blk, 0, 0.32, 0.06, g, 'x');
      [-0.72, -0.38, 0.38, 0.72].forEach(function (x) { C(0.04, 0.6, blk, x, 0.08, 0.08, g); });
      [-0.72, 0.72].forEach(function (x) { C(0.04, 0.34, blk, x, -0.1, 0.0, g, 'z'); });
    });
    addAcc('barras', 0, 1.3, -1.12, function (g) {
      [-1, 1].forEach(function (s) {
        C(0.04, 0.6, blk, s * 0.78, 0.28, 0, g);
        C(0.035, 0.62, blk, s * 0.78, 0.5, -0.3, g, 'z');
      });
      C(0.04, 1.56, blk, 0, 0.58, 0, g, 'x');
      C(0.035, 1.56, orange, 0, 0.28, -0.04, g, 'x');
      C(0.03, 1.56, blk, 0, 0.5, -0.6, g, 'x');
      [-1, 1].forEach(function (s) { C(0.03, 0.6, blk, s * 0.78, 0.5, -0.6, g); });
    });
    addAcc('tapa', 0, 1.3, -1.78, function (g) {
      B(1.66, 0.06, 1.62, lidM, 0, 0.02, 0, g);
      B(1.7, 0.07, 0.07, orange, 0, 0.03, 0.78, g);
      for (var k = -9; k <= 9; k++) B(1.64, 0.07, 0.012, blk, 0, 0.03, k * 0.08, g);
      B(0.07, 0.1, 1.64, blk, 0.83, 0.03, 0, g);
      B(0.07, 0.1, 1.64, blk, -0.83, 0.03, 0, g);
    });
    var headlight = new T.PointLight(0xffe7b8, 0, 8); headlight.position.set(0, 2.0, 2.4); truck.add(headlight);
    addAcc('faros', 0, 1.82, 0.3, function (g) {
      B(1.16, 0.09, 0.12, blk, 0, 0, 0, g);
      B(1.1, 0.06, 0.02, led, 0, 0, 0.07, g);
      [-0.45, 0.45].forEach(function (x) { B(0.06, 0.09, 0.07, steel, x, -0.07, 0, g); });
      [-0.62, 0.62].forEach(function (x) {
        C(0.1, 0.08, led, x, -1.1, 2.0, g, 'z'); C(0.12, 0.05, blk, x, -1.1, 1.97, g, 'z');
      });
    });
    addAcc('enganche', 0, 0.62, -2.51, function () {});
    // modelos reales de accesorios (GLB): defensa y enganche
    var modelUrl = opts.model || P.file, accBase = modelUrl.replace(/[^\/]*$/, '');
    var accMat = mat(0x17191c, 0.65, 0.38), hitchMat = mat(0x2b2e33, 0.7, 0.4);
    function loadAcc(file, name, m, place, replace) {
      try {
        var dr = new T.DRACOLoader(); dr.setDecoderPath(opts.dracoPath || 'https://www.gstatic.com/draco/versioned/decoders/1.4.1/');
        var ld = new T.GLTFLoader(); ld.setDRACOLoader(dr);
        ld.load(accBase + file, function (gltf) {
          var o = gltf.scene; o.traverse(function (c) { if (c.isMesh) { c.material = m; c.castShadow = true; c.receiveShadow = true; } });
          var w = new T.Group(); w.add(o); place(o, w);
          var g = acc[name].g; if (replace) { while (g.children.length) g.remove(g.children[0]); } g.add(w);
        }, undefined, function () {});
      } catch (e) {}
    }
    loadAcc('acc_defensa.glb', 'defensa', accMat, function (o) { o.scale.setScalar(0.8 * P.accS); o.position.set(0, -0.64 * 0.8 * P.accS, 0); }, true);
    loadAcc('acc_enganche.glb', 'enganche', hitchMat, function (o) { o.scale.setScalar(0.85 * P.accS); o.rotation.y = Math.PI; }, false);

    // llantas deportivas (se superponen a las de serie)
    var wheels = [];
    [[1, P.wheels[0]], [-1, P.wheels[0]], [1, P.wheels[1]], [-1, P.wheels[1]]].forEach(function (p) {
      var s = p[0], z = p[1];
      var g = new T.Group(); g.position.set(s * P.track, P.wy, z); if (s < 0) g.rotation.y = Math.PI;
      var spin = new T.Group(); g.add(spin);
      C(0.285, 0.05, darkM, 0, 0, 0, spin, 'x');
      var tor = new T.Mesh(new T.TorusGeometry(0.28, 0.035, 10, 40), orange); tor.rotation.y = Math.PI / 2; tor.position.x = 0.03; tor.castShadow = true; spin.add(tor);
      for (var k = 0; k < 3; k++) { var sp = B(0.04, 0.54, 0.06, steel, 0.03, 0, 0, spin); sp.rotation.x = k * Math.PI / 3; }
      C(0.07, 0.04, orange, 0.05, 0, 0, spin, 'x');
      g.visible = false; g.scale.setScalar(0.0001);
      truck.add(g); wheels.push({ g: g, spin: spin, a: 0, t: 0 });
    });

    // ---- estado ----
    var state = { parts: {}, color: 'blanco', view: 'three', loaded: false };
    var interactive = !!opts.interactive, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var VIEWS = { three: { yaw: -0.6, pitch: 0.26 }, front: { yaw: 0, pitch: 0.12 }, side: { yaw: -Math.PI / 2, pitch: 0.08 }, rear: { yaw: -Math.PI, pitch: 0.16 }, top: { yaw: -0.5, pitch: 1.1 } };
    var HS = { estribos: ['Estribos', 1.0, 0.55, 0.1], defensa: ['Defensa', 0, 0.95, 3.0], barras: ['Barras', 0, 1.95, -1.1], tapa: ['Tapa de caja', 0, 1.45, -1.8], faros: ['Faros LED', 0, 1.95, 0.3], llantas: ['Llantas', 0.95, 0.85, 1.8], enganche: ['Enganche', 0, 0.62, -2.85] };
    for (var hk in P.hs) HS[hk] = [HS[hk][0]].concat(P.hs[hk]);
    var iYaw = VIEWS.three.yaw, iPitch = VIEWS.three.pitch, tView = null, yawVel = 0, idle = 0, dragging = false;
    ORDER.forEach(function (k) { state.parts[k] = false; });
    var listeners = [], spinVal = 0, spinTarget = 0, bounceY = 0, bounceV = 0;
    function emit() { listeners.forEach(function (f) { f(state); }); }
    function set(name, on, silent) {
      on = !!on; if (state.parts[name] === on || ORDER.indexOf(name) < 0) return;
      state.parts[name] = on;
      if (name === 'llantas') { wheels.forEach(function (w) { w.t = on ? 1 : 0; }); spinTarget += (on ? 1 : -1) * Math.PI * 2; } else acc[name].t = on ? 1 : 0;
      bounceV = -1.4; if (!silent) emit();
    }
    function toggle(n) { set(n, !state.parts[n]); }
    function all(on) { ORDER.forEach(function (k) { set(k, on, true); }); emit(); }
    function setColor(key) { if (!COLORS[key]) return; state.color = key; targetColor.setHex(COLORS[key]); emit(); }
    function assemble(list, gap, delay) { list.forEach(function (k, i) { setTimeout(function () { set(k, true); }, (delay || 0) + i * gap); }); }

    // ---- cámara ----
    var target = new T.Vector3(0, 0.8, 0), R = 11, W = 1, H = 1;
    var ext = { yaw: -0.6, pitch: 0.26, zoom: 1, ty: 0.8 }, cYaw = ext.yaw, cPitch = ext.pitch, cZoom = 1, cTy = 0.8;
    function scrub(o) { ext = o; container.classList.add('scrubbing'); }
    function resize() {
      W = Math.max(1, container.clientWidth); H = Math.max(1, container.clientHeight);
      renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
      R = Math.max(10.6, 16 / camera.aspect);
    }
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(container); else window.addEventListener('resize', resize);

    // ---- carga del modelo ----
    var failed = false;
    try {
      var draco = new T.DRACOLoader(); draco.setDecoderPath(opts.dracoPath || 'https://www.gstatic.com/draco/versioned/decoders/1.4.1/');
      var loader = new T.GLTFLoader(); loader.setDRACOLoader(draco);
      loader.load(modelUrl, function (gltf) {
        var m = gltf.scene;
        m.traverse(function (o) {
          if (o.isMesh) {
            o.castShadow = true; o.receiveShadow = true;
            var arr = Array.isArray(o.material) ? o.material : [o.material];
            arr.forEach(function (mt) {
              if (mt && mt.name === 'Car_Paint' && paintMats.indexOf(mt) < 0) { paintMats.push(mt); mt.map = null; mt.color.setHex(COLORS.blanco); mt.metalness = 0.45; mt.roughness = 0.3; mt.envMapIntensity = 1; }
            });
          }
        });
        if (P.fit) { // normaliza modelos exportados en otras unidades: largo en metros, apoyado en el piso y centrado
          var bx = new T.Box3().setFromObject(m), sz = bx.getSize(new T.Vector3()), ct = bx.getCenter(new T.Vector3()), sc = P.fit / sz.z;
          m.scale.multiplyScalar(sc); m.position.set(-ct.x * sc, -bx.min.y * sc, -ct.z * sc);
        }
        holder.add(m); state.loaded = true; container.classList.add('ready');
        if (opts.onLoad) opts.onLoad(api);
      }, undefined, function (e) { failed = true; if (opts.onError) opts.onError(e); });
    } catch (e) { failed = true; if (opts.onError) setTimeout(function () { opts.onError(e); }, 0); }

    // ---- interacción (hero / configurador) ----
    var labels = null, hint = null, started = false, lx = 0, ly = 0, tmp = new T.Vector3();
    function setView(name) { if (!VIEWS[name]) return; state.view = name; tView = VIEWS[name]; yawVel = 0; idle = 0; emit(); }
    function updateLabels() {
      var dc = camera.position.distanceTo(target);
      ORDER.forEach(function (k) {
        var h = HS[k]; tmp.set(h[1], h[2], h[3]); truck.localToWorld(tmp);
        var d = camera.position.distanceTo(tmp); tmp.project(camera);
        var x = (tmp.x * 0.5 + 0.5) * W, y = (-tmp.y * 0.5 + 0.5) * H, el = labels[k], hide = d > dc + 2.4;
        el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
        el.style.opacity = hide ? '0' : '1'; el.style.pointerEvents = hide ? 'none' : ''; el.classList.toggle('lf', x > W * 0.68);
      });
    }
    if (interactive) {
      canvas.addEventListener('pointerdown', function (e) { dragging = true; lx = e.clientX; ly = e.clientY; yawVel = 0; tView = null; idle = 0; try { canvas.setPointerCapture(e.pointerId); } catch (er) {} container.classList.add('grabbing'); if (hint) hint.classList.add('gone'); });
      canvas.addEventListener('pointermove', function (e) {
        if (!dragging) return; var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
        iYaw += dx * 0.009; yawVel = dx * 0.009; if (e.pointerType !== 'touch') iPitch = Math.max(0.04, Math.min(1.2, iPitch + dy * 0.005)); idle = 0;
      });
      var endDrag = function () { dragging = false; container.classList.remove('grabbing'); };
      canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
      var overlay = document.createElement('div'); overlay.className = 'ovl'; container.appendChild(overlay); labels = {};
      ORDER.forEach(function (k) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'hs'; b.dataset.k = k;
        b.innerHTML = '<i></i><span>' + HS[k][0] + '</span>'; b.setAttribute('aria-label', HS[k][0]);
        b.addEventListener('click', function () { toggle(k); }); overlay.appendChild(b); labels[k] = b;
      });
      listeners.push(function (st) { ORDER.forEach(function (k) { labels[k].classList.toggle('on', !!st.parts[k]); }); });
      if (opts.hint !== false) { hint = document.createElement('div'); hint.className = 'hint'; hint.innerHTML = '<b>↔</b> Arrastrá para girar · tocá los puntos'; container.appendChild(hint); }
    }

    // ---- loop ----
    var visible = true, clock = new T.Clock();
    if (window.IntersectionObserver) new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !started && interactive && opts.autoAssemble) { started = true; if (reduce) all(true); else assemble(['llantas', 'estribos', 'defensa', 'barras', 'tapa', 'faros', 'enganche'], 560, 900); }
    }, { threshold: 0.15 }).observe(container);
    function frame() {
      if (dead) return;
      requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      var dt = Math.min(clock.getDelta(), 0.05), k2 = Math.min(1, dt * 6);
      if (interactive) {
        if (tView) { var dy0 = tView.yaw - iYaw; dy0 -= Math.round(dy0 / (Math.PI * 2)) * Math.PI * 2; iYaw += dy0 * k2; iPitch += (tView.pitch - iPitch) * k2; if (Math.abs(dy0) < 0.003) tView = null; }
        else if (!dragging) { idle += dt; iYaw += yawVel; yawVel *= 0.93; if (idle > 2.5 && !reduce) iYaw += dt * 0.28; }
        ext = { yaw: iYaw, pitch: iPitch, zoom: 0.72, ty: 0.8 }; cYaw = iYaw; cPitch = iPitch; cZoom = 0.72; cTy = 0.8;
      } else { cYaw += (ext.yaw - cYaw) * k2; cPitch += (ext.pitch - cPitch) * k2; cZoom += ((ext.zoom || 1) - cZoom) * k2; cTy += ((ext.ty == null ? 0.8 : ext.ty) - cTy) * k2; }
      rig.rotation.y = cYaw; target.set(0, cTy, 0);
      var RR = R * cZoom;
      camera.position.set(0, target.y + Math.sin(cPitch) * RR, Math.cos(cPitch) * RR); camera.lookAt(target);
      for (var k in acc) {
        var a = acc[k]; a.a += (a.t - a.a) * Math.min(1, dt * 5); if (Math.abs(a.t - a.a) < 0.002) a.a = a.t;
        a.g.visible = a.a > 0.01; a.g.scale.setScalar(Math.max(0.0001, easeOutBack(a.a) * a.s));
        a.g.position.set(a.px, a.py + (1 - a.a) * 1.2, a.pz); a.g.rotation.y = (1 - a.a) * 0.5;
      }
      headlight.intensity = acc.faros.a * 1.6;
      spinVal += (spinTarget - spinVal) * Math.min(1, dt * 4);
      wheels.forEach(function (w) {
        w.a += (w.t - w.a) * Math.min(1, dt * 6); if (Math.abs(w.t - w.a) < 0.002) w.a = w.t;
        w.g.visible = w.a > 0.01; w.g.scale.setScalar(Math.max(0.0001, easeOutBack(w.a))); w.spin.rotation.x = -spinVal;
      });
      bounceV += (-90 * bounceY - 7 * bounceV) * dt; bounceY += bounceV * dt; truck.position.y = bounceY * 0.05;
      paintMats.forEach(function (mt) { mt.color.lerp(targetColor, Math.min(1, dt * 6)); });
      if (labels) updateLabels();
      renderer.render(scene, camera);
    }
    frame();

    var api = { state: state, set: set, toggle: toggle, all: all, setColor: setColor, assemble: assemble, scrub: scrub, setView: setView, onChange: function (f) { listeners.push(f); f(state); },
      destroy: function () { dead = true; renderer.dispose(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); } };
    return api;
  };
})();
