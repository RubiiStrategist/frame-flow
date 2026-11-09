/* ════════════════════════════════════════════════════════════════════
   FRAME FLOW OS · PROMPT 04 — Núcleo orbital (canvas 2D, projeção 3D)
   Engine independente, sem dependências externas.
   • Perspectiva real: divisão por z + fog por profundidade
   • Câmera responde discretamente ao contexto (presets com lerp)
   • Parallax de ponteiro (desktop, opcional)
   • prefers-reduced-motion: cena estática, sem lerp/parallax
   • Pausa total quando: modo Comando, aba oculta
   • Degradação adaptativa: DPR e densidade caem se dt médio subir
   Nenhuma entidade fictícia: nós e arestas vêm de FFDATA.ecos.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var FOV = 3.0;

  /* presets de câmera por contexto — a câmera “olha” para onde
     importa naquele momento, sem nunca cobrir a leitura dos painéis */
  var PRESETS = {
    painel:     { yaw: 0.55, pitch: 0.16, dist: 3.6, ox: 0.62, oy: -0.12, labels: false, hl: [] },
    financeiro: { yaw: -0.95, pitch: 0.22, dist: 3.3, ox: 0.50, oy: -0.02, labels: false, hl: ['receita', 'contas'] },
    decisoes:   { yaw: 1.25, pitch: 0.12, dist: 3.1, ox: 0.38, oy: 0.02, labels: false, hl: ['lentes', 'editor', 'festival'] },
    ecos:       { yaw: 0.35, pitch: 0.30, dist: 2.55, ox: 0.85, oy: -0.02, labels: true, hl: [] },
    'ecos-m':   { yaw: 0.40, pitch: 0.26, dist: 2.9, ox: 0.0, oy: -3.15, labels: true, hl: [] },
    'painel-m': { yaw: 0.55, pitch: 0.14, dist: 4.15, ox: 0.0, oy: -1.45, labels: false, hl: [] },
    'fin-m':    { yaw: -0.90, pitch: 0.20, dist: 4.15, ox: 0.0, oy: -1.45, labels: false, hl: ['receita', 'contas'] },
    'dec-m':    { yaw: 1.20, pitch: 0.12, dist: 4.15, ox: 0.0, oy: -1.45, labels: false, hl: ['lentes', 'editor', 'festival'] },
    'ecos-box': { yaw: 0.40, pitch: 0.26, dist: 2.60, ox: 0.0, oy: 0.0, labels: true, hl: [] }
  };

  /* anéis por tipo de nó: raio (mundo), inclinação e fase inicial */
  var RING = {
    hub:       { r: 0.0,  tilt: 0.0,   n: 1 },
    projeto:   { r: 1.0,  tilt: 0.24,  n: 0 },
    decisao:   { r: 1.55, tilt: -0.34, n: 0 },
    indicador: { r: 1.95, tilt: 0.14,  n: 0 },
    alerta:    { r: 1.25, tilt: 0.50,  n: 0 }
  };

  function create(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var reduced = !!opts.reduced;
    var parallax = opts.parallax !== false && !reduced;
    var lowDensity = !!opts.lowDensity;
    var onHover = opts.onHover || function () {};
    var onSelect = opts.onSelect || function () {};

    var data = window.FFDATA.ecos;
    var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);

    /* nós com posição no mundo */
    var nodes = data.nodes.map(function (n, i) {
      var ring = RING[n.tipo] || RING.projeto;
      var idx = ring.n++;
      var count = Math.max(1, data.nodes.filter(function (o) { return o.tipo === n.tipo; }).length);
      var ang = (idx / count) * Math.PI * 2 + (n.tipo === 'projeto' ? 0.4 : n.tipo === 'decisao' ? 1.1 : 2.0);
      return {
        id: n.id, tipo: n.tipo, nome: n.nome, sub: n.sub,
        ring: ring, ang: ang,
        x: Math.cos(ang) * ring.r,
        y: 0, z: Math.sin(ang) * ring.r,
        tiltY: Math.sin(ang) * ring.tilt * ring.r * 0.5,
        sx: 0, sy: 0, sr: 0, fog: 0
      };
    });
    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });

    /* poeira de ambiente (profundidade extra) */
    var dust = [];
    var dustN = lowDensity ? 14 : 42;
    for (var d = 0; d < dustN; d++) {
      dust.push({
        x: (Math.random() - 0.5) * 5.2,
        y: (Math.random() - 0.5) * 3.2,
        z: (Math.random() - 0.5) * 5.2,
        p: Math.random() * Math.PI * 2
      });
    }

    var cam = { yaw: 0, pitch: 0, dist: 4, ox: 0, oy: 0 };
    var tgt = null;
    var theta = 0.35;                 /* rotação global lenta */
    var mx = 0, my = 0;                /* parallax */
    var t0 = performance.now();
    var raf = 0, running = false, rafPending = false;
    var hoverNode = null;
    var fps = 60, slowFrames = 0;
    var labelsOn = false;

    function resize() {
      W = canvas.clientWidth || canvas.parentElement.clientWidth;
      H = canvas.clientHeight || canvas.parentElement.clientHeight;
      DPR = Math.min(window.devicePixelRatio || 1, DPR);
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (reduced && !running) draw(); /* cena estática: redesenha ao redimensionar */
    }

    function rot(p, yaw, pitch) {
      /* yaw em torno de Y */
      var cx = Math.cos(yaw), sx = Math.sin(yaw);
      var x = p.x * cx + p.z * sx;
      var z = -p.x * sx + p.z * cx;
      /* pitch em torno de X */
      var cy = Math.cos(pitch), sy = Math.sin(pitch);
      var y = p.y * cy - z * sy;
      z = p.y * sy + z * cy;
      return { x: x, y: y, z: z };
    }

    function project(p) {
      var r = rot(p, cam.yaw + mx, cam.pitch + my);
      var zc = r.z + cam.dist;
      var s = FOV / Math.max(0.6, zc);
      var unit = Math.min(W, H) * (lowDensity ? 0.165 : 0.21);
      return {
        x: W / 2 + (r.x * s + cam.ox) * unit,
        y: H / 2 + (r.y * s + cam.oy) * unit,
        s: s,
        fog: Math.max(0.16, Math.min(1, (cam.dist + 1.6 - r.z) / (cam.dist * 2)))
      };
    }

    function nodeWorld(n, tSec) {
      var wob = reduced ? 0 : Math.sin(tSec * 0.6 + n.ang * 2.1) * 0.05;
      return {
        x: n.x * Math.cos(theta) - n.z * Math.sin(theta),
        z: n.x * Math.sin(theta) + n.z * Math.cos(theta),
        y: n.tiltY + n.y + wob
      };
    }

    function draw() {
      var t = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, W, H);

      var unit = Math.min(W, H) * (lowDensity ? 0.165 : 0.21);

      /* anéis-guia (percepção de profundidade) */
      ['projeto', 'decisao', 'indicador'].forEach(function (tipo) {
        if (lowDensity && tipo === 'indicador') return;
        var ring = RING[tipo];
        ctx.beginPath();
        var SEG = 44;
        for (var i = 0; i <= SEG; i++) {
          var a = (i / SEG) * Math.PI * 2;
          var w = { x: Math.cos(a) * ring.r, y: 0, z: Math.sin(a) * ring.r };
          w = { x: w.x * Math.cos(theta) - w.z * Math.sin(theta), y: ring.tilt * Math.sin(a) * ring.r * 0.5, z: w.x * Math.sin(theta) + w.z * Math.cos(theta) };
          var pr = project(w);
          if (i === 0) ctx.moveTo(pr.x, pr.y); else ctx.lineTo(pr.x, pr.y);
        }
        ctx.strokeStyle = 'rgba(244,240,231,0.055)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      /* poeira */
      for (var di = 0; di < dust.length; di++) {
        var dn = dust[di];
        var dp = project({ x: dn.x, y: reduced ? dn.y : dn.y + Math.sin(t * 0.35 + dn.p) * 0.12, z: dn.z });
        ctx.fillStyle = 'rgba(244,240,231,' + (0.10 + dp.fog * 0.22).toFixed(3) + ')';
        var ds = Math.max(0.6, 1.4 * dp.s);
        ctx.fillRect(dp.x, dp.y, ds, ds);
      }

      /* arestas — relações reais do dataset */
      data.edges.forEach(function (e) {
        var A = byId[e.a], B = byId[e.b];
        if (!A || !B) return;
        var pa = project(nodeWorld(A, t)), pb = project(nodeWorld(B, t));
        var alpha = ((pa.fog + pb.fog) / 2) * (e.tone === 'red' ? 0.30 : e.tone === 'alerta' ? 0.34 : 0.14);
        ctx.strokeStyle = e.tone === 'red' ? 'rgba(225,6,6,' + alpha + ')'
          : e.tone === 'alerta' ? 'rgba(225,6,6,' + alpha + ')'
          : 'rgba(244,240,231,' + alpha + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      });

      /* nós */
      nodes.forEach(function (n) {
        var pr = project(nodeWorld(n, t));
        n.sx = pr.x; n.sy = pr.y; n.fog = pr.fog;
        var r = (n.tipo === 'hub' ? 26 : n.tipo === 'indicador' ? 9 : n.tipo === 'alerta' ? 10 : 8) * pr.s * (unit / 160);
        n.sr = Math.max(3, r);
        var hl = tgt && tgt.hl && tgt.hl.indexOf(n.id) >= 0;
        var isHover = hoverNode === n;

        ctx.globalAlpha = 0.35 + pr.fog * 0.65;

        if (n.tipo === 'hub') {
          ctx.beginPath(); ctx.arc(pr.x, pr.y, n.sr, 0, 7);
          ctx.strokeStyle = 'rgba(244,240,231,0.85)'; ctx.lineWidth = 1.4; ctx.stroke();
          ctx.beginPath(); ctx.arc(pr.x, pr.y, n.sr * 0.58, 0, 7);
          ctx.fillStyle = '#E10606'; ctx.fill();
          ctx.beginPath(); ctx.arc(pr.x, pr.y, n.sr * 1.28, 0, 7);
          ctx.strokeStyle = 'rgba(244,240,231,0.22)'; ctx.lineWidth = 1; ctx.stroke();
        } else if (n.tipo === 'projeto') {
          ctx.beginPath(); ctx.arc(pr.x, pr.y, n.sr, 0, 7);
          ctx.fillStyle = 'rgba(244,240,231,0.92)'; ctx.fill();
        } else if (n.tipo === 'decisao') {
          ctx.beginPath(); ctx.arc(pr.x, pr.y, n.sr, 0, 7);
          ctx.fillStyle = '#E10606'; ctx.fill();
          ctx.beginPath(); ctx.arc(pr.x, pr.y, n.sr + 3.5, 0, 7);
          ctx.strokeStyle = 'rgba(225,6,6,0.5)'; ctx.lineWidth = 1; ctx.stroke();
        } else if (n.tipo === 'indicador') {
          ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(Math.PI / 4);
          ctx.strokeStyle = 'rgba(244,240,231,0.9)'; ctx.lineWidth = 1.4;
          ctx.strokeRect(-n.sr, -n.sr, n.sr * 2, n.sr * 2);
          ctx.restore();
        } else if (n.tipo === 'alerta') {
          var pulse = reduced ? 1.14 : 1.14 + Math.sin(t * 2.4) * 0.10;
          ctx.beginPath(); ctx.arc(pr.x, pr.y, n.sr * pulse, 0, 7);
          ctx.strokeStyle = 'rgba(225,6,6,0.75)'; ctx.lineWidth = 1.3; ctx.stroke();
          ctx.beginPath(); ctx.arc(pr.x, pr.y, n.sr * 0.5, 0, 7);
          ctx.fillStyle = '#E10606'; ctx.fill();
        }

        if (hl || isHover) {
          ctx.beginPath(); ctx.arc(pr.x, pr.y, n.sr + 7, 0, 7);
          ctx.strokeStyle = isHover ? 'rgba(244,240,231,0.95)' : 'rgba(225,6,6,0.55)';
          ctx.lineWidth = isHover ? 1.6 : 1.2;
          ctx.stroke();
        }

        /* rótulos: hub sempre; demais quando próximos, no Ecossistema,
           destacados ou sob hover — nunca em massa, nunca sobre painéis */
        var wantLabel = n.tipo === 'hub' || labelsOn && pr.fog > 0.72 || hl || isHover;
        if (wantLabel) {
          ctx.globalAlpha = (n.tipo === 'hub' ? 0.95 : 0.5 + pr.fog * 0.5) * (isHover ? 1 : 0.92);
          ctx.font = (isHover ? '600 ' : '') + '10.5px "JetBrains Mono", ui-monospace, monospace';
          ctx.fillStyle = n.tipo === 'decisao' || n.tipo === 'alerta' ? '#F4F0E7' : 'rgba(244,240,231,0.95)';
          ctx.textAlign = 'left';
          ctx.fillText(n.nome.toUpperCase(), pr.x + n.sr + 8, pr.y - 1);
          if (isHover || hl || n.tipo === 'hub') {
            ctx.font = '9px "JetBrains Mono", ui-monospace, monospace';
            ctx.fillStyle = 'rgba(244,240,231,0.55)';
            ctx.fillText(n.sub, pr.x + n.sr + 8, pr.y + 11);
          }
        }
        ctx.globalAlpha = 1;
      });
    }

    function step(now) {
      if (!running) { rafPending = false; return; }
      raf = requestAnimationFrame(step);
      var dt = Math.min(64, now - (step.last || now)); step.last = now;
      fps = fps * 0.92 + (1000 / Math.max(1, dt)) * 0.08;

      /* degradação adaptativa silenciosa */
      if (dt > 34) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames > 45 && DPR > 1) { DPR = 1; resize(); slowFrames = 0; }

      if (!reduced) theta += dt * 0.000058 * 16; /* ~0,05 rad/s */

      if (tgt) {
        var k = reduced ? 1 : 0.045;
        cam.yaw += (tgt.yaw - cam.yaw) * k;
        cam.pitch += (tgt.pitch - cam.pitch) * k;
        cam.dist += (tgt.dist - cam.dist) * k;
        cam.ox += (tgt.ox - cam.ox) * k;
        cam.oy += (tgt.oy - cam.oy) * k;
        labelsOn = tgt.labels;
      }
      draw();
    }

    function pick(x, y) {
      var best = null, bd = 1e9;
      nodes.forEach(function (n) {
        var dx = n.sx - x, dy = n.sy - y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < Math.max(16, n.sr + 9) && dist < bd) { bd = dist; best = n; }
      });
      return best;
    }

    canvas.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (parallax) {
        mx = ((x / W) - 0.5) * 0.05;
        my = ((y / H) - 0.5) * 0.03;
      }
      var n = pick(x, y);
      if (n !== hoverNode) {
        hoverNode = n;
        canvas.style.cursor = n ? 'pointer' : 'default';
        onHover(n, n ? n.sx : x, n ? n.sy : y);
      }
    });
    canvas.addEventListener('pointerleave', function () {
      hoverNode = null; mx = 0; my = 0; onHover(null, 0, 0);
    });
    canvas.addEventListener('click', function (e) {
      var r = canvas.getBoundingClientRect();
      var n = pick(e.clientX - r.left, e.clientY - r.top);
      if (n) onSelect(n);
    });

    var api = {
      start: function () {
        if (running) return;
        running = true;
        if (!rafPending) { rafPending = true; raf = requestAnimationFrame(step); }
        step.last = 0;
      },
      stop: function () {
        running = false;
        cancelAnimationFrame(raf);
        rafPending = false;
      },
      setContext: function (name) {
        tgt = PRESETS[name] || PRESETS.painel;
        if (reduced) { /* aplica direto: sem movimento */
          cam.yaw = tgt.yaw; cam.pitch = tgt.pitch; cam.dist = tgt.dist;
          cam.ox = tgt.ox; cam.oy = tgt.oy; labelsOn = tgt.labels;
          if (!running) draw();
        }
      },
      setReduced: function (v) { reduced = !!v; parallax = parallax && !reduced; },
      isRunning: function () { return running; },
      fps: function () { return Math.round(fps); },
      drawOnce: draw
    };

    resize();
    window.addEventListener('resize', function () { resize(); if (!running && reduced) draw(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) api.stop();
      else if (canvas.offsetParent !== null) api.start();
    });

    return api;
  }

  window.Orbital = { create: create, PRESETS: PRESETS };
})();
