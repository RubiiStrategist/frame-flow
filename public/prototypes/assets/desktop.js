/* ════════════════════════════════════════════════════════════════════
   FRAME FLOW OS · PROMPT 04 — interações do protótipo desktop
   Interdependências:
   • Modo Comando/Imersivo — o 3D só existe no Imersivo; tudo funciona
     de forma idêntica nos dois modos (Comando = zero custo 3D)
   • Contextos vivem no DOM (hidden) — estado, scroll e votos persistem
   • ⌘K executa tudo; Esc fecha o topo da pilha de overlays
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.FFDATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var state = {
    ctx: 'painel',
    mode: 'imersivo',
    filter: 'todas',
    drawer: null,          /* id da decisão aberta */
    capEstado: 'atencao',
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };
  var votes = {};          /* votos mutáveis (demonstração) */
  D.decisoes.forEach(function (d) { votes[d.id] = { v: d.votos, done: false, result: null }; });

  /* ── toasts ─────────────────────────────────────────────── */
  function toast(msg) {
    var box = $('#toasts');
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    box.appendChild(t);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 350); }, 4200);
  }

  /* ── contexto ──────────────────────────────────────────── */
  var TITULOS = { painel: 'Visão Geral', financeiro: 'Inteligência Financeira', decisoes: 'Central de Decisões', ecos: 'Ecossistema' };

  function setCtx(name, push) {
    if (!TITULOS[name]) name = 'painel';
    state.ctx = name;
    document.body.dataset.ctx = name;
    $$('.scene').forEach(function (s) { s.hidden = s.dataset.ctx !== name; });
    $$('.railnav .navico').forEach(function (b) {
      var on = b.dataset.ctx === name;
      b.classList.toggle('active', on);
      b.setAttribute('aria-current', on ? 'page' : 'false');
    });
    $('#crumbTitle').textContent = TITULOS[name];
    if (orb) orb.setContext(name);
    if (push !== false) {
      if (location.hash !== '#' + name) location.hash = name;
    }
  }

  /* ── modo Comando/Imersivo ─────────────────────────────── */
  function setMode(m, silencioso) {
    state.mode = m;
    document.body.dataset.mode = m;
    $$('#modeToggle .mopt').forEach(function (b) {
      var on = b.dataset.mode === m;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (orb) {
      if (m === 'imersivo') orb.start(); else orb.stop();
      if (m === 'imersivo') orb.setContext(state.ctx);
    }
    if (!silencioso) {
      toast(m === 'imersivo'
        ? 'Modo Imersivo — ambiente 3D em cena. Painéis seguem legíveis.'
        : 'Modo Comando — ambiente 3D desativado. Zero custo de render.');
    }
  }

  /* ── movimento reduzido ────────────────────────────────── */
  function setReduced(v, silencioso) {
    state.reduced = v;
    document.documentElement.classList.toggle('reduced', v);
    var sw = $('#swReduced');
    sw.setAttribute('aria-checked', v ? 'true' : 'false');
    if (orb) { orb.setReduced(v); orb.setContext(state.ctx); }
    if (!silencioso) toast(v ? 'Movimento reduzido: rotação, parallax e transições congelados.' : 'Movimento pleno restabelecido.');
  }

  /* ── orbital ───────────────────────────────────────────── */
  var orb = window.Orbital.create($('#orb'), {
    parallax: true,
    reduced: state.reduced,
    onHover: function (n, x, y) {
      var chip = $('#nodechip');
      if (!n) { chip.hidden = true; return; }
      $('#ncTitle').textContent = n.nome;
      $('#ncSub').textContent = n.sub;
      chip.hidden = false;
      chip.style.left = x + 'px';
      chip.style.top = y + 'px';
    },
    onSelect: function (n) { openNodeCard(n); }
  });

  var CTX_DO_NO = { projeto: 'painel', decisao: 'decisoes', indicador: 'financeiro', alerta: 'financeiro', hub: 'painel' };
  function openNodeCard(n) {
    var rels = D.ecos.edges.filter(function (e) { return e.a === n.id || e.b === n.id; });
    var txt = rels.length
      ? rels.map(function (e) {
        var other = e.a === n.id ? e.b : e.a;
        var on = D.ecos.nodes.filter(function (x) { return x.id === other; })[0];
        return (on ? on.nome : '?') + ' — ' + e.rel;
      }).join(' · ')
      : 'Núcleo do ambiente executivo';
    $('#ncardCode').textContent = 'EC·05 · ' + n.tipo.toUpperCase();
    $('#ncardTitle').textContent = n.nome;
    $('#ncardRel').textContent = txt;
    var card = $('#nodecard');
    card.hidden = false;
    var go = $('#ncardGo');
    go.onclick = function () {
      card.hidden = true;
      setCtx(CTX_DO_NO[n.tipo] || 'painel');
      if (n.tipo === 'decisao') openDrawer(n.id);
    };
    go.focus();
  }
  $('#ncardClose').addEventListener('click', function () { $('#nodecard').hidden = true; });

  /* ── decisões ──────────────────────────────────────────── */
  function voteBar(d, v) {
    var seg = '';
    for (var i = 0; i < d.total; i++) seg += '<span class="s' + (i < v ? ' on' : '') + '"></span>';
    return seg + '<span class="n">' + v + '/' + d.total + '</span>';
  }

  function renderDecPreview() {
    $('#decPreview').innerHTML = D.decisoes.map(function (d) {
      var st = votes[d.id];
      return '<div class="d-item" role="button" tabindex="0" data-dec="' + d.id + '" aria-label="Abrir decisão ' + d.titulo + '">' +
        '<div class="d-top"><h3>' + d.titulo + '</h3>' +
        '<span class="pr' + (d.urgente ? ' urgent' : '') + '">' + d.prazo + '</span></div>' +
        '<div class="d-ctx">' + d.resumo + '</div>' +
        '<div class="d-vote">' + voteBar(d, st.v) +
        (st.done
          ? '<span class="' + (st.result === 'ok' ? 'ok' : 'rej') + '">' + st.txt + '</span>'
          : '<button class="cta" data-dec="' + d.id + '">Votar →</button>') +
        '</div></div>';
    }).join('');
  }

  function renderDecList() {
    var f = state.filter;
    var rows = D.decisoes.filter(function (d) {
      if (f === 'urgentes') return d.urgente || d.diasRestantes <= 3;
      if (f === 'financeiras') return d.financeira;
      return true;
    });
    $('#decList').innerHTML = rows.length ? rows.map(function (d) {
      var st = votes[d.id];
      return '<div class="drow" role="button" tabindex="0" data-dec="' + d.id + '" aria-label="Abrir decisão ' + d.titulo + '">' +
        '<span class="idx">' + d.idx + '</span>' +
        '<span><h3 class="serif">' + d.titulo + '</h3><span class="res">' + d.resumo + '</span>' +
        '<span class="meta">' +
        '<span class="chip">' + d.impacto + '</span>' +
        '<span class="chip">regra: ' + d.regra + '</span>' +
        (st.done ? '<span class="chip ' + (st.result === 'ok' ? 'solid' : 'red') + '">' + st.txt + '</span>' : '') +
        '</span></span>' +
        '<span class="lado"><span class="prazo' + (d.urgente ? ' urgent' : '') + '">' + d.prazo + '</span>' +
        '<span class="abr">Abrir detalhe →</span></span></div>';
    }).join('') : '<p class="pal-empty">Nenhuma decisão neste filtro.</p>';
  }

  function renderDrawer(id) {
    var d = D.decisoes.filter(function (x) { return x.id === id; })[0];
    if (!d) return;
    state.drawer = id;
    var st = votes[id];
    $('#dwTitle').textContent = d.titulo;
    $('#dwCode').textContent = 'DC·03 · DECISÃO ' + d.idx;
    var seg = '';
    for (var i = 0; i < d.total; i++) seg += '<span class="s' + (i < st.v ? ' on' : '') + '"></span>';
    $('#dwBody').innerHTML =
      '<div class="dw-sec"><span class="smallcaps">Contexto</span><p class="ctx">' + d.contexto + '</p></div>' +
      '<div class="dw-sec"><span class="smallcaps">Opções em mesa</span>' +
      d.opcoes.map(function (o) {
        return '<div class="opt"><span class="l">' + o.l + '</span><span><span class="t">' + o.t + '</span><span class="d">' + o.d + '</span></span></div>';
      }).join('') + '</div>' +
      '<div class="dw-sec"><span class="smallcaps">Impactos financeiros (demo)</span>' +
      d.impactos.map(function (m) { return '<div class="imp"><span class="k">' + m.k + '</span><span class="v">' + m.v + '</span></div>'; }).join('') +
      '</div>' +
      '<div class="dw-sec"><span class="smallcaps">Votação dos sócios · regra: ' + d.regra + '</span>' +
      '<div class="votes">' + seg + '<span class="n">' + st.v + '/' + d.total + '</span></div>' +
      '<div class="dw-parceiros">' + d.votoParceiros + ' · seu voto pendente</div>' +
      (st.done
        ? '<div class="dw-status"><span class="chip ' + (st.result === 'ok' ? 'solid' : 'red') + '">' + st.txt + '</span></div>'
        : '<div class="dw-actions">' +
        '<button class="btn btn-primary" data-voto="ok">Aprovar</button>' +
        '<button class="btn btn-ghost" data-voto="ctx">Pedir contexto</button>' +
        '<button class="btn btn-ghost" data-voto="no" style="border-color:var(--red-55)">Rejeitar</button>' +
        '</div>') +
      '</div>';
  }

  function openDrawer(id) {
    setCtx('decisoes');
    renderDrawer(id);
    $('#scrim').hidden = false;
    var dr = $('#drawer');
    dr.hidden = false;
    requestAnimationFrame(function () { dr.classList.add('vis'); });
    $('#dwClose').focus();
  }
  function closeDrawer() {
    state.drawer = null;
    var dr = $('#drawer');
    dr.classList.remove('vis');
    setTimeout(function () { dr.hidden = true; }, state.reduced ? 0 : 300);
    $('#scrim').hidden = true;
  }

  function applyVote(id, kind) {
    var d = D.decisoes.filter(function (x) { return x.id === id; })[0];
    var st = votes[id];
    if (st.done) return;
    if (kind === 'ok') {
      st.v += 1;
      var aprovada = d.regra === 'unanimidade' ? st.v === d.total : st.v >= 2;
      st.result = 'ok';
      st.txt = aprovada ? 'APROVADA · ' + st.v + '/' + d.total : 'SEU VOTO REGISTRADO · ' + st.v + '/' + d.total;
      toast(aprovada ? 'Decisão aprovada pela regra ' + d.regra + ' (demonstrativo — nada real foi alterado).' : 'Voto registrado. Aguardando sócios (demonstrativo).');
    } else if (kind === 'no') {
      st.result = 'no'; st.txt = 'REJEITADA · veto do CEO';
      toast('Decisão rejeitada (demonstrativo — nada real foi alterado).');
    } else {
      toast('Pedido de contexto enviado aos sócios (demonstrativo).');
      return;
    }
    st.done = kind !== 'ctx';
    renderDecPreview(); renderDecList();
    if (state.drawer === id) renderDrawer(id);
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-dec],[data-ctx],[data-filter],[data-voto],[data-estado]');
    if (el) {
      if (el.dataset.dec) { openDrawer(el.dataset.dec); return; }
      if (el.dataset.ctx) { setCtx(el.dataset.ctx); return; }
      if (el.dataset.filter) {
        state.filter = el.dataset.filter;
        $$('[data-filter]').forEach(function (b) { b.classList.toggle('on', b === el); });
        renderDecList();
        return;
      }
      if (el.dataset.voto && state.drawer) { applyVote(state.drawer, el.dataset.voto); return; }
      if (el.dataset.estado) { setCapEstado(el.dataset.estado); return; }
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      var el = e.target.closest ? e.target.closest('.d-item,.drow') : null;
      if (el && el.dataset.dec) { e.preventDefault(); openDrawer(el.dataset.dec); }
    }
  });

  /* ── Cap ───────────────────────────────────────────────── */
  function setCapEstado(nome) {
    state.capEstado = nome;
    var est = D.cap.estados[nome];
    $('#capDockState').innerHTML = '<i aria-hidden="true"></i>' + est.rotulo;
    $('#capDockState').dataset.estado = nome;
    $('#capDockSay').innerHTML = '<b>Cap:</b> ' + est.fala.replace(/^Cap:\s*/, '');
    $('#cpState').textContent = nome;
    $('#cpBadge').dataset.estado = nome;
    $('#cpFala').innerHTML = '<b>Cap:</b> ' + est.fala.replace(/^Cap:\s*/, '');
    var acts = $('#cpActions');
    acts.innerHTML = '';
    if (est.acao) {
      var b = document.createElement('button');
      b.className = 'btn btn-primary';
      b.textContent = est.acao.t;
      b.dataset.ctx = est.acao.ctx;
      if (est.acao.dec) b.dataset.dec = est.acao.dec;
      acts.appendChild(b);
    }
    $$('.stbtn').forEach(function (b) { b.classList.toggle('on', b.dataset.estado === nome); });
  }
  function openCap() {
    var p = $('#capPanel');
    p.hidden = false;
    requestAnimationFrame(function () { p.classList.add('vis'); });
    $('#cpClose').focus();
  }
  function closeCap() {
    var p = $('#capPanel');
    p.classList.remove('vis');
    setTimeout(function () { p.hidden = true; }, state.reduced ? 0 : 280);
  }
  $('#capZone').addEventListener('click', openCap);
  $('#heroCap').addEventListener('click', openCap);
  $('#cpClose').addEventListener('click', closeCap);
  $('#bell').addEventListener('click', function () { openCap(); toast('Notificações do dia: 2 contas vencidas · 3 decisões abertas.'); });

  /* ── paleta ⌘K ─────────────────────────────────────────── */
  var pal = $('#palette'), palInput = $('#palInput'), palSel = 0, palItems = [];
  var GRUPOS = { IR: 'Navegação', VOTO: 'Decisões', CAP: 'Cap', MODO: 'Modo', A11Y: 'Acessibilidade', NOVA: 'Ações' };

  function palRender(q) {
    q = (q || '').toLowerCase().trim();
    var html = '';
    palItems = [];
    var lastG = null;
    D.comandos.forEach(function (c) {
      var texto = (c.t.replace(/<[^>]+>/g, '') + ' ' + c.kw).toLowerCase();
      if (q && texto.indexOf(q) < 0) return;
      var g = GRUPOS[c.ic] || 'Ações';
      if (g !== lastG) { html += '<div class="pal-group">' + g + '</div>'; lastG = g; }
      var idx = palItems.length;
      palItems.push(c);
      html += '<button class="pal-row' + (c.urgent ? ' urgent' : '') + '" data-i="' + idx + '" role="option">' +
        '<span class="ic">' + c.ic + '</span><span class="nm">' + c.t + '</span><span class="sc">' + c.k + '</span></button>';
    });
    if (!palItems.length) html = '<div class="pal-empty">Nada encontrado para “' + q + '”. Tente “decisão”, “runway” ou “cap”.</div>';
    $('#palResults').innerHTML = html;
    palSel = 0;
    palHl();
  }
  function palHl() {
    $$('.pal-row').forEach(function (r, i) {
      var on = i === palSel;
      r.classList.toggle('hl', on);
      r.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    var cur = $$('.pal-row')[palSel];
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  }
  function palOpen() {
    pal.hidden = false;
    palRender('');
    palInput.value = '';
    palInput.focus();
  }
  function palClose() {
    pal.hidden = true;
    $('#searchTrigger').focus();
  }
  function palRun(c) {
    palClose();
    var run = c.run, parts = run.split(':'), kind = parts[0], arg = parts[1];
    if (kind === 'ctx') setCtx(arg);
    else if (kind === 'dec') openDrawer(arg);
    else if (run === 'cap:open') openCap();
    else if (run === 'cap:resumo') {
      openCap(); setCapEstado('processando');
      setTimeout(function () { setCapEstado('confirmacao'); }, 1500);
    } else if (run === 'modo:toggle') setMode(state.mode === 'comando' ? 'imersivo' : 'comando');
    else if (run === 'a11y:toggle') setReduced(!state.reduced);
    else if (run === 'nova:decisao') toast('Criação de decisões fará parte da aplicação real — fora do escopo do protótipo.');
  }
  $('#searchTrigger').addEventListener('click', palOpen);
  $('#modeToggle').addEventListener('click', function (e) {
    var b = e.target.closest('[data-mode]');
    if (b) setMode(b.dataset.mode);
  });
  palInput.addEventListener('input', function () { palRender(palInput.value); });
  pal.addEventListener('click', function (e) {
    if (e.target === pal) { palClose(); return; }
    var row = e.target.closest('.pal-row');
    if (row) palRun(palItems[+row.dataset.i]);
  });
  pal.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); palSel = Math.min(palItems.length - 1, palSel + 1); palHl(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = Math.max(0, palSel - 1); palHl(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (palItems[palSel]) palRun(palItems[palSel]); }
  });

  /* ── overlays: esc fecha o topo da pilha ───────────────── */
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (pal.hidden) { palOpen(); } else { palClose(); } return; }
    if (e.key === 'Escape') {
      if (!pal.hidden) { palClose(); return; }
      if (state.drawer) { closeDrawer(); return; }
      if (!$('#nodecard').hidden) { $('#nodecard').hidden = true; return; }
      if (!$('#capPanel').hidden) { closeCap(); return; }
      if (!$('#settingsPop').hidden) { $('#settingsPop').hidden = true; return; }
    }
    if (e.key === 'Tab' && state.drawer) {
      var f = $$('#drawer button, #drawer [tabindex]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  $('#scrim').addEventListener('click', closeDrawer);
  $('#dwClose').addEventListener('click', closeDrawer);

  /* ── configurações ────────────────────────────────────── */
  var sp = $('#settingsPop');
  $('#btnSettings').addEventListener('click', function () {
    sp.hidden = !sp.hidden;
    $('#btnSettings').setAttribute('aria-expanded', sp.hidden ? 'false' : 'true');
  });
  $('#swReduced').addEventListener('click', function () { setReduced(!state.reduced); });

  /* ── ambiente W/L fora do protótipo ────────────────────── */
  $$('.envbtn:not(.active)').forEach(function (b) {
    b.addEventListener('click', function () {
      toast('Ambiente ' + (b.dataset.env === 'W' ? 'Comercial (William · CRO)' : 'Operacional (Letícia · COO+CFO)') + ' — fora do escopo deste protótipo.');
    });
  });

  /* ── hash ──────────────────────────────────────────────── */
  function fromHash() { setCtx((location.hash || '#painel').replace('#', ''), false); }
  window.addEventListener('hashchange', fromHash);

  /* ── render inicial ───────────────────────────────────── */
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  $('#pipeList').innerHTML = D.comercial.pipeline.map(function (p) {
    return '<div class="p-row"><span class="k">' + p.k + '</span><span class="bar"><i class="' + (p.hot ? 'hot' : '') + '" style="width:' + p.pct + '%"></i></span><span class="v">' + p.v + '</span></div>';
  }).join('');
  $('#comStats').innerHTML = '<div class="com2">' + D.comercial.stats.map(function (s) {
    return '<div class="s"><div class="k">' + s.k + '</div><div class="v">' + s.v + (s.nota ? ' <small>' + s.nota + '</small>' : '') + '</div></div>';
  }).join('') + '</div>';
  $('#projList').innerHTML = D.pulso.projetos.map(function (p) {
    return '<div class="pr-row"><span class="nm">' + p.nome + '</span><span class="cl">' + p.desc + '</span><span class="stchip' + (p.hot ? ' hot' : '') + '">' + p.status + '</span></div>';
  }).join('');
  $('#opStats').innerHTML = D.pulso.stats.map(function (s) {
    return '<div class="s"><div class="k">' + s.k + '</div><div class="v' + (s.alerta ? ' alertv' : '') + '">' + s.v + (s.nota ? ' <small>' + s.nota + '</small>' : '') + '</div></div>';
  }).join('');
  $('#weekline').innerHTML = D.pulso.semana.map(function (w) {
    return '<div class="wd ' + w.cls + '">' + w.d + '<span class="dot"></span></div>';
  }).join('');
  $('#contasList').innerHTML = D.financeiro.contas.map(function (c) {
    return '<div class="conta ' + c.tone + '"><span><span class="cl">' + c.cliente + '</span><span class="nf">' + c.nf + '</span></span><span class="cv">' + c.v + '</span><span class="ce">' + c.estado + '</span></div>';
  }).join('');
  $('#alertList').innerHTML = D.financeiro.alertas.map(function (a) {
    return '<div class="alert-item"><span class="t">' + a.t + '</span><span class="d">' + a.d + '</span>' +
      (a.acao ? '<button class="a" data-ctx="' + a.ctx + '" ' + (a.acao === 'Abrir decisão das lentes' ? 'data-dec="lentes"' : '') + '>' + a.acao + '</button>' : '') +
      '</div>';
  }).join('');
  $('#aporteList').innerHTML = D.financeiro.aportes.map(function (a) {
    return '<div class="aporte"><span><span class="k">' + a.k + '</span><span class="d">' + a.d + '</span></span><span class="v' + (a.neg ? ' neg' : '') + '">' + a.v + '</span></div>';
  }).join('');
  $('#relList').innerHTML = D.ecos.relacoes.map(function (r) {
    return '<div class="rel-item"><span class="arrow">→</span><span>' + r + '</span></div>';
  }).join('');
  renderDecPreview();
  renderDecList();

  /* ── relógio + saudação (protótipo vivo) ──────────────── */
  function tick() {
    $('#clock').textContent = window.FFTIME.relogio();
    $('#ff01tc').textContent = window.FFTIME.relogio() + ' · DEMO';
  }
  tick();
  setInterval(tick, 1000);
  $('#heroData').textContent = window.FFTIME.dataLonga();
  $('#heroSaud').textContent = window.FFTIME.saudacao();
  var mh = setInterval(function () { $('#heroHora').textContent = window.FFTIME.hora(); }, 15000);
  $('#heroHora').textContent = window.FFTIME.hora();

  /* ── liga tudo ────────────────────────────────────────── */
  setCapEstado('atencao');
  fromHash();
  setMode('imersivo', true);
  if (state.reduced) setReduced(true, true);
})();

