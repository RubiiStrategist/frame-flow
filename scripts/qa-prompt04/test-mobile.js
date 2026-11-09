(async () => {
  const R = { teste: 'mobile-390', ts: new Date().toISOString() };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  /* ── 1. Estrutura e alvos de toque ────────────────────── */
  R.viewport = window.innerWidth + 'x' + window.innerHeight;
  R.overflow_doc = document.documentElement.scrollWidth;
  R.sem_overflow_390 = document.documentElement.scrollWidth <= window.innerWidth;
  const navBtns = $$('.bn');
  R.nav_itens = navBtns.length;
  R.nav_larguras = navBtns.map(b => Math.round(b.getBoundingClientRect().width));
  R.nav_alturas = navBtns.map(b => Math.round(b.getBoundingClientRect().height));
  R.nav_alvos_44 = navBtns.every(b => b.getBoundingClientRect().width >= 44 && b.getBoundingClientRect().height >= 44);
  const toques = $$('.mcard .openbrief, .strip-cta, .m-topbar .mbtn, .mode .mopt, .stbtn, .fchip, .alert-item .a');
  R.alvos_min = Math.min.apply(null, toques.map(t => Math.round(t.getBoundingClientRect().height)));

  /* ── 2. Alternância Comando/Imersivo (mobile) ─────────── */
  R.modo_inicial = document.body.dataset.mode;
  $('#modeToggle [data-mode="imersivo"]').click(); await sleep(600);
  R.imersivo_canvas = getComputedStyle($('#orb')).display;
  R.imersivo_body = document.body.dataset.mode;
  R.letterbox_imersivo = getComputedStyle($('.lbox.top')).height;
  $('#modeToggle [data-mode="comando"]').click(); await sleep(600);
  R.comando_canvas = getComputedStyle($('#orb')).display;
  R.comando_body = document.body.dataset.mode;

  /* ── 3. Navegação inferior funcional ──────────────────── */
  const abas = ['m-financeiro', 'm-indic', 'm-decisoes', 'm-cap'];
  const vis = {};
  for (const a of abas) {
    $$('.bn').forEach(b => { if (b.dataset.ctx === a) b.click(); });
    await sleep(300);
    vis[a] = !$('.mscene[data-ctx="' + a + '"]').hidden;
  }
  R.abas_visiveis = vis;
  $$('.bn').forEach(b => { if (b.dataset.ctx === 'm-painel') b.click(); });
  await sleep(300);
  R.volta_inicio = !$('.mscene[data-ctx="m-painel"]').hidden;
  R.hash_atual = location.hash;

  /* ── 4. Paleta em tela cheia (botão de busca) ─────────── */
  $('#searchTrigger').click(); await sleep(300);
  R.palette_aberta = !$('#palette').hidden;
  R.palette_comandos = $$('#palResults .pal-row').length;
  $('#palInput').value = 'lentes';
  $('#palInput').dispatchEvent(new Event('input', { bubbles: true }));
  await sleep(250);
  R.palette_filtro = $$('#palResults .pal-row').length;
  $('#palette').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await sleep(600);
  R.sheet_aberto = !$('#sheet').hidden && $('#sheet').classList.contains('vis');
  R.sheet_titulo = $('#shTitle').textContent;
  R.sheet_ctx = document.body.dataset.ctx;
  R.sheet_alvo_fechar_h = Math.round($('#shClose').getBoundingClientRect().height);

  /* ── 5. Voto no sheet (ações no rodapé fixo) ─────────── */
  R.acoes_visiveis_sem_scroll = $('#shActions').parentElement.className === 'sh-foot';
  R.acoes_no_rodape = $$('#shActions .btn').length === 3;
  const actsRect = $('#shActions').getBoundingClientRect();
  R.acoes_dentro_viewport = actsRect.top < window.innerHeight && actsRect.bottom > 0;
  $('#shActions [data-voto="ok"]').click(); await sleep(300);
  R.voto_status = ($('#shActions .chip') || {}).textContent || '';
  $('#shClose').click(); await sleep(400);
  R.sheet_fechou = $('#sheet').hidden;

  /* ── 6. Cap: aba com 4 estados ────────────────────────── */
  $$('.bn').forEach(b => { if (b.dataset.ctx === 'm-cap') b.click(); });
  await sleep(300);
  R.cap_aba_visivel = !$('.mscene[data-ctx="m-cap"]').hidden;
  R.cap_estados = $$('.stbtn').length;
  $$('.stbtn').forEach(b => { if (b.dataset.estado === 'confirmacao') b.click(); });
  await sleep(250);
  R.cap_rotulo_confirmacao = $('#capMState').textContent.trim();
  $$('.stbtn').forEach(b => { if (b.dataset.estado === 'processando') b.click(); });
  await sleep(250);
  R.cap_rotulo_proc = $('#capMState').textContent.trim();

  /* ── 7. Ecossistema: overlay via CTA da faixa ─────────── */
  $$('.bn').forEach(b => { if (b.dataset.ctx === 'm-painel') b.click(); });
  await sleep(400);
  $('#modeToggle [data-mode="imersivo"]').click(); await sleep(500);
  $('.strip-cta').click(); await sleep(900);
  R.ecos_aberto = !$('.mscene[data-ctx="m-ecos"]').hidden;
  R.ecos_relacoes = $$('#relList .rel-item').length;
  R.ecos_legendas = $$('.legend .lg').length;
  // toque em nó: simular clique no centro do palco vivo
  const live = $('#ecoLive');
  const rect = live.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + 150;
  const el = document.elementFromPoint(cx, cy);
  R.ecos_ponto_central = el ? (el.id || el.className || el.tagName) : null;
  R.ecos_overlay_fixo = getComputedStyle($('.mscene-ecos')).position;

  /* ── 8. Safe area ──────────────────────────────────────── */
  const nav = $('.bottom-nav');
  R.nav_pb = getComputedStyle(nav).paddingBottom;
  R.safe_area_bar = !!$('.safe-area .bar');
  R.hint_presente = !!$('.hint');

  return JSON.stringify(R, null, 1);
})()
