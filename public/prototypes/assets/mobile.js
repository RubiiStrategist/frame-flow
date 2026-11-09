/* ════════════════════════════════════════════════════════════════════
   FRAME FLOW OS · PROMPT 04 — interações do protótipo mobile
   Versão própria para 390px: navegação inferior, bottom sheet,
   paleta em tela cheia, imersivo adaptado (orbital em baixa
   densidade, sem parallax). Mesma fonte de dados (FFDATA).
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.FFDATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var state = {
    ctx: 'm-painel', mode: 'comando', filter: 'todas',
    sheet: null, capEstado: 'atencao',
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };
  var votes = {};
  D.decisoes.forEach(function (d) { votes[d.id] = { v: d.votos, done: false, result: null, txt: '' }; });

  function toast(msg) {
    var box = $('#toasts');
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    box.appendChild(t);
    while (box.children.length > 2) box.removeChild(box.firstChild);
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 350); }, 4200);
  }

  /* ── contexto ─────────────────────────────────────────── */
  var TITULOS = {
    'm-painel': 'Início', 'm-financeiro': 'Financeiro', 'm-indic': 'Indicadores',
    'm-decisoes': 'Decisões', 'm-cap': 'Cap', 'm-ecos': 'Ecossistema'
  };
  var HASH = {
    'm-painel': 'inicio', 'm-financeiro': 'financeiro', 'm-indic': 'indicadores',
    'm-decisoes': 'decisoes', 'm-cap': 'cap', 'm-ecos': 'ecos'
  };
  var ORB_KEY = {
    'm-painel': 'painel-m', 'm-financeiro': 'fin-m', 'm-indic': 'painel-m',
    'm-decisoes': 'dec-m', 'm-cap': 'painel-m', 'm-ecos': 'ecos-m'
  };

  function setCtx(name, push) {
    if (!TITULOS[name]) name = 'm-painel';
    state.ctx = name;
    document.body.dataset.ctx = name;
    $$('.mscene').forEach(function (s) { s.hidden = s.dataset.ctx !== name; });
    $$('.bn').forEach(function (b) {
      var on = b.dataset.ctx === name;
      b.classList.toggle('active', on);
      b.setAttribute('aria-current', on ? 'page' : 'false');
    });
    $('#crumbTitle').textContent = TITULOS[name];
    applyEngines();
    if (name !== 'm-ecos') window.scrollTo(0, 0);
    if (push !== false && location.hash !== '#' + HASH[name]) location.hash = HASH[name];
  }
  function fromHash() {
    var h = (location.hash || '#inicio').replace('#', '');
    var map = { inicio: 'm-painel', financeiro: 'm-financeiro', indicadores: 'm-indic', decisoes: 'm-decisoes', cap: 'm-cap', ecos: 'm-ecos' };
    setCtx(map[h] || 'm-painel', false);
  }
  window.addEventListener('hashchange', fromHash);

  /* ── modo ─────────────────────────────────────────────── */
  function setMode(m, silencioso) {
    state.mode = m;
    document.body.dataset.mode = m;
    $$('#modeToggle .mopt').forEach(function (b) {
      var on = b.dataset.mode === m;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    applyEngines();
    if (!silencioso) toast(m === 'imersivo'
      ? 'Modo Imersivo — orbital adaptado ao celular, sem parallax.'
      : 'Modo Comando — ambiente 3D desativado.');
  }
  function setReduced(v, silencioso) {
    state.reduced = v;
    document.documentElement.classList.toggle('reduced', v);
    if (orb) { orb.setReduced(v); }
    if (orb2) { orb2.setReduced(v); }
    applyEngines();
    if (!silencioso) toast(v ? 'Movimento reduzido ativado.' : 'Movimento pleno restabelecido.');
  }

  /* ── orbital ──────────────────────────────────────────── */
  var orb = window.Orbital.create($('#orb'), {
    parallax: false, lowDensity: true, reduced: state.reduced,
    onSelect: function (n) { openNodeCard(n); }
  });
  var orb2 = null;
  function ensureOrb2() {
    if (orb2) return;
    orb2 = window.Orbital.create($('#orbEco'), {
      parallax: false, lowDensity: true, reduced: state.reduced,
      onSelect: function (n) { openNodeCard(n); }
    });
  }
  /* ciclo de vida único: modo × contexto definem qual canvas respira */
  function applyEngines() {
    var im = state.mode === 'imersivo';
    if (state.ctx === 'm-ecos') {
      if (orb) orb.stop();
      ensureOrb2();
      if (orb2) {
        orb2.setContext('ecos-box');
        if (im) orb2.start(); else orb2.stop();
      }
    } else {
      if (orb2) orb2.stop();
      if (orb) {
        orb.setContext(ORB_KEY[state.ctx] || 'painel-m');
        if (im) orb.start(); else orb.stop();
      }
    }
  }
  var CTX_DO_NO = { projeto: 'm-painel', decisao: 'm-decisoes', indicador: 'm-financeiro', alerta: 'm-financeiro', hub: 'm-painel' };
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
      setCtx(CTX_DO_NO[n.tipo] || 'm-painel');
      if (n.tipo === 'decisao') openSheet(n.id);
    };
  }
  $('#ncardClose').addEventListener('click', function () { $('#nodecard').hidden = true; });

  /* ── decisões ─────────────────────────────────────────── */
  function voteBar(d, v) {
    var seg = '';
    for (var i = 0; i < d.total; i++) seg += '<span class="s' + (i < v ? ' on' : '') + '"></span>';
    return seg + '<span class="n">' + v + '/' + d.total + '</span>';
  }
  function renderDecPreview() {
    $('#decPreview').innerHTML = D.decisoes.map(function (d) {
      var st = votes[d.id];
      return '<div class="d-item"><div class="d-top"><h3>' + d.titulo + '</h3>' +
        '<span class="pr' + (d.urgente ? ' urgent' : '') + '">' + d.prazo + '</span></div>' +
        '<div class="d-ctx">' + d.resumo + '</div>' +
        '<div class="d-vote">' + voteBar(d, st.v) +
        (st.done ? '<span class="' + (st.result === 'ok' ? 'ok' : 'rej') + '">' + st.txt + '</span>' : '') +
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
      return '<button class="dmrow" data-dec="' + d.id + '" aria-label="Abrir decisão ' + d.titulo + '">' +
        '<span class="idx">' + d.idx + '</span>' +
        '<span class="corpo"><h3 class="serif">' + d.titulo + '</h3><span class="res">' + d.resumo + '</span></span>' +
        '<span class="prazo' + (d.urgente ? ' urgent' : '') + '">' + d.prazo + '</span></button>';
    }).join('') : '<p class="pal-empty">Nenhuma decisão neste filtro.</p>';
  }
  function renderSheet(id) {
    var d = D.decisoes.filter(function (x) { return x.id === id; })[0];
    if (!d) return;
    state.sheet = id;
    var st = votes[id];
    $('#shTitle').textContent = d.titulo;
    $('#shCode').textContent = 'DC·03 · DECISÃO ' + d.idx;
    var seg = '';
    for (var i = 0; i < d.total; i++) seg += '<span class="s' + (i < st.v ? ' on' : '') + '"></span>';
    $('#shBody').innerHTML =
      '<div class="dw-sec"><span class="smallcaps">Contexto</span><p class="ctx">' + d.contexto + '</p></div>' +
      '<div class="dw-sec"><span class="smallcaps">Opções em mesa</span>' +
      d.opcoes.map(function (o) {
        return '<div class="opt"><span class="l">' + o.l + '</span><span><span class="t">' + o.t + '</span><span class="d">' + o.d + '</span></span></div>';
      }).join('') + '</div>' +
      '<div class="dw-sec"><span class="smallcaps">Impactos (demo)</span>' +
      d.impactos.map(function (m) { return '<div class="imp"><span class="k">' + m.k + '</span><span class="v">' + m.v + '</span></div>'; }).join('') +
      '</div>' +
      '<div class="dw-sec"><span class="smallcaps">Votação · regra: ' + d.regra + '</span>' +
      '<div class="votes">' + seg + '<span class="n">' + st.v + '/' + d.total + '</span></div>' +
      '<div class="dw-parceiros">' + d.votoParceiros + ' · seu voto pendente</div>' +
      '</div>';
    /* ações sempre visíveis no rodapé do sheet (nunca abaixo do fold) */
    $('#shActions').innerHTML = st.done
      ? '<span class="chip ' + (st.result === 'ok' ? 'solid' : 'red') + '">' + st.txt + '</span>'
      : '<button class="btn btn-primary" data-voto="ok">Aprovar</button>' +
        '<button class="btn btn-ghost" data-voto="ctx">Contexto</button>' +
        '<button class="btn btn-ghost" data-voto="no" style="border-color:var(--red-55)">Rejeitar</button>';
  }
  function openSheet(id) {
    setCtx('m-decisoes');
    renderSheet(id);
    $('#scrim').hidden = false;
    var sh = $('#sheet');
    sh.hidden = false;
    requestAnimationFrame(function () { sh.classList.add('vis'); });
    $('#shClose').focus();
  }
  function closeSheet() {
    state.sheet = null;
    var sh = $('#sheet');
    sh.classList.remove('vis');
    setTimeout(function () { sh.hidden = true; }, state.reduced ? 0 : 280);
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
      toast(aprovada ? 'Aprovada pela regra ' + d.regra + ' (demo — nada real foi alterado).' : 'Voto registrado. Aguardando sócios (demo).');
    } else if (kind === 'no') {
      st.result = 'no'; st.txt = 'REJEITADA · veto do CEO';
      toast('Decisão rejeitada (demo — nada real foi alterado).');
    } else {
      toast('Pedido de contexto enviado aos sócios (demo).');
      return;
    }
    st.done = true;
    renderDecPreview(); renderDecList();
    if (state.sheet === id) renderSheet(id);
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-dec],[data-ctx],[data-filter],[data-voto],[data-estado]');
    if (el) {
      if (el.dataset.dec) { openSheet(el.dataset.dec); return; }
      if (el.dataset.ctx) { setCtx(el.dataset.ctx); return; }
      if (el.dataset.filter) {
        state.filter = el.dataset.filter;
        $$('[data-filter]').forEach(function (b) { b.classList.toggle('on', b === el); });
        renderDecList();
        return;
      }
      if (el.dataset.voto && state.sheet) { applyVote(state.sheet, el.dataset.voto); return; }
      if (el.dataset.estado) { setCapEstado(el.dataset.estado); return; }
    }
  });
  $('#goDec').addEventListener('click', function () { setCtx('m-decisoes'); });
  $('#goFin').addEventListener('click', function () { setCtx('m-financeiro'); });
  $('#shClose').addEventListener('click', closeSheet);
  $('#scrim').addEventListener('click', closeSheet);

  /* ── Cap ──────────────────────────────────────────────── */
  function setCapEstado(nome) {
    state.capEstado = nome;
    var est = D.cap.estados[nome];
    $('#capMState').innerHTML = '<i aria-hidden="true"></i>' + est.rotulo;
    $('#capMState').dataset.estado = nome;
    $('#capMSay').innerHTML = '<b>Cap:</b> ' + est.fala.replace(/^Cap:\s*/, '');
    var acts = $('#capMActions');
    acts.innerHTML = '';
    if (est.acao) {
      var b = document.createElement('button');
      b.className = 'btn btn-primary';
      b.textContent = est.acao.t;
      b.dataset.ctx = est.acao.ctx === 'financeiro' ? 'm-financeiro' : (est.acao.ctx === 'decisoes' ? 'm-decisoes' : 'm-' + est.acao.ctx);
      if (est.acao.dec) b.dataset.dec = est.acao.dec;
      acts.appendChild(b);
    }
    $$('.stbtn').forEach(function (b) { b.classList.toggle('on', b.dataset.estado === nome); });
  }

  /* ── paleta ───────────────────────────────────────────── */
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
      palItems.push(c);
      html += '<button class="pal-row' + (c.urgent ? ' urgent' : '') + '" data-i="' + (palItems.length - 1) + '" role="option">' +
        '<span class="ic">' + c.ic + '</span><span class="nm">' + c.t + '</span></button>';
    });
    if (!palItems.length) html = '<div class="pal-empty">Nada encontrado para “' + q + '”.</div>';
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
  function palOpen() { pal.hidden = false; palRender(''); palInput.value = ''; palInput.focus(); }
  function palClose() { pal.hidden = true; $('#searchTrigger').focus(); }
  function palRun(c) {
    palClose();
    var run = c.run, parts = run.split(':'), kind = parts[0], arg = parts[1];
    if (kind === 'ctx') setCtx('m-' + arg);
    else if (kind === 'dec') openSheet(arg);
    else if (run === 'cap:open') setCtx('m-cap');
    else if (run === 'cap:resumo') {
      setCtx('m-cap'); setCapEstado('processando');
      setTimeout(function () { setCapEstado('confirmacao'); }, 1500);
    } else if (run === 'modo:toggle') setMode(state.mode === 'comando' ? 'imersivo' : 'comando');
    else if (run === 'a11y:toggle') setReduced(!state.reduced);
    else if (run === 'nova:decisao') toast('Criação de decisões fará parte da aplicação real.');
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

  /* ── esc / atalhos ────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (pal.hidden) { palOpen(); } else { palClose(); } return; }
    if (e.key === 'Escape') {
      if (!pal.hidden) { palClose(); return; }
      if (state.sheet) { closeSheet(); return; }
      if (!$('#nodecard').hidden) { $('#nodecard').hidden = true; return; }
      if (state.ctx === 'm-ecos') { setCtx('m-painel'); return; }
    }
    if (e.key === 'Tab' && state.sheet) {
      var f = $$('#sheet button');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ── render inicial ──────────────────────────────────── */
  $('#pipeList').innerHTML = D.comercial.pipeline.map(function (p) {
    return '<div class="p-row"><span class="k">' + p.k + '</span><span class="bar"><i class="' + (p.hot ? 'hot' : '') + '" style="width:' + p.pct + '%"></i></span><span class="v">' + p.v + '</span></div>';
  }).join('');
  $('#opStats').innerHTML = '<div class="op3">' + D.pulso.stats.map(function (s) {
    return '<div class="s"><span class="k">' + s.k + '</span><span class="v' + (s.alerta ? ' alertv' : '') + '">' + s.v + (s.nota ? ' <small>' + s.nota + '</small>' : '') + '</span></div>';
  }).join('') + '</div>';
  $('#projList').innerHTML = D.pulso.projetos.map(function (p) {
    return '<div class="pr-row"><span class="nm">' + p.nome + '</span><span class="stchip' + (p.hot ? ' hot' : '') + '">' + p.status + '</span><span class="cl">' + p.desc + '</span></div>';
  }).join('');
  $('#weekline').innerHTML = D.pulso.semana.map(function (w) {
    return '<div class="wd ' + w.cls + '">' + w.d + '<span class="dot"></span></div>';
  }).join('');
  $('#contasList').innerHTML = D.financeiro.contas.map(function (c) {
    return '<div class="conta ' + c.tone + '"><span class="cl">' + c.cliente + '</span><span class="cv">' + c.v + '</span><span class="nf">' + c.nf + '</span><span class="ce">' + c.estado + '</span></div>';
  }).join('');
  $('#alertList').innerHTML = D.financeiro.alertas.map(function (a) {
    return '<div class="alert-item"><span class="t">' + a.t + '</span><span class="d">' + a.d + '</span>' +
      (a.acao ? '<button class="a" data-ctx="m-' + a.ctx + '" ' + (a.acao === 'Abrir decisão das lentes' ? 'data-dec="lentes"' : '') + '>' + a.acao + '</button>' : '') +
      '</div>';
  }).join('');
  $('#relList').innerHTML = D.ecos.relacoes.map(function (r) {
    return '<div class="rel-item"><span class="arrow">→</span><span>' + r + '</span></div>';
  }).join('');
  renderDecPreview();
  renderDecList();

  $('#heroData').textContent = window.FFTIME.dataLonga();
  $('#heroSaud').textContent = window.FFTIME.saudacao();
  $('#ff01tc').textContent = window.FFTIME.relogio();

  /* ── liga tudo ───────────────────────────────────────── */
  setCapEstado('atencao');
  fromHash();
  setMode('comando', true);
  if (state.reduced) setReduced(true, true);
})();

