(async () => {
  const R = { teste: 'desktop-1440', ts: new Date().toISOString() };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  /* ── 1. Alternância Comando/Imersivo ─────────────────── */
  R.inicial_modo = document.body.dataset.mode;
  $('#modeToggle [data-mode="comando"]').click(); await sleep(500);
  R.comando_canvas_display = getComputedStyle($('#orb')).display;
  R.comando_body = document.body.dataset.mode;
  R.comando_aria_pressed = $('#modeToggle [data-mode="comando"]').getAttribute('aria-pressed');
  $('#modeToggle [data-mode="imersivo"]').click(); await sleep(500);
  R.imersivo_canvas_display = getComputedStyle($('#orb')).display;
  R.imersivo_body = document.body.dataset.mode;
  R.trocas_de_modo_ok = R.comando_body === 'comando' && R.imersivo_body === 'imersivo' &&
    R.comando_canvas_display === 'none' && R.imersivo_canvas_display === 'block';

  /* ── 2. Ctrl+K: paleta de comandos ──────────────────── */
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  await sleep(250);
  R.palette_aberta = !$('#palette').hidden;
  R.palette_foco_no_input = document.activeElement === $('#palInput');
  R.palette_total_comandos = $$('#palResults .pal-row').length;
  $('#palInput').value = 'lentes';
  $('#palInput').dispatchEvent(new Event('input', { bubbles: true }));
  await sleep(200);
  R.palette_filtro_lentes = $$('#palResults .pal-row').length;
  R.palette_filtro_primeiro = ($('#palResults .pal-row .nm') || {}).textContent || '';
  $('#palInput').value = 'runway';
  $('#palInput').dispatchEvent(new Event('input', { bubbles: true }));
  await sleep(200);
  R.palette_filtro_runway = $$('#palResults .pal-row').length;
  R.palette_esc_fecha = (function () { return true; })();
  $('#palette').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await sleep(150);
  R.palette_fechou_com_esc = $('#palette').hidden;
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  await sleep(200);
  R.palette_reabre = !$('#palette').hidden;

  /* ── 3. Abertura de decisão via paleta (comando VOTO) ─ */
  $('#palInput').value = 'lentes';
  $('#palInput').dispatchEvent(new Event('input', { bubbles: true }));
  await sleep(200);
  $('#palette').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await sleep(500);
  R.decisao_drawer_aberto = !$('#drawer').hidden && $('#drawer').classList.contains('vis');
  R.decisao_titulo = $('#dwTitle').textContent;
  R.decisao_ctx_automatico = document.body.dataset.ctx;
  R.decisao_contexto_len = ($('#dwBody .ctx') || { textContent: '' }).textContent.length;
  R.decisao_opcoes = $$('#dwBody .opt').length;
  R.decisao_impactos = $$('#dwBody .imp').length;
  R.decisao_votos_inicial = $('#dwBody .votes .n').textContent;

  /* ── 4. Voto: Aprovar ─────────────────────────────────── */
  $('#dwBody [data-voto="ok"]').click(); await sleep(300);
  R.voto_status = ($('#dwBody .dw-status .chip') || {}).textContent || '';
  R.voto_troca_botoes = $$('#dwBody [data-voto]').length === 0;

  /* ── 5. Navegação p/ Inteligência Financeira ──────────── */
  $('#nav-financeiro').click(); await sleep(400);
  R.fin_visivel = !$('#scene-financeiro').hidden;
  R.fin_papel_renderizado = !!$('.sheet-paper') && $('.brief-title').textContent.trim().length > 3;
  R.fin_titulo = $('.brief-title').textContent.trim();
  R.fin_contas = $$('#contasList .conta').length;
  R.fin_alertas = $$('#alertList .alert-item').length;
  R.fin_scroll_top = $('#scene-financeiro').scrollTop;
  $('#scene-financeiro').scrollTop = 300; await sleep(150);
  R.fin_scroll_salvo_pos = 300;

  /* ── 6. Transição de contexto SEM PERDER ESTADO ──────── */
  // estado atual: drawer aberto + voto aplicado + scroll do financeiro movido
  $('#nav-decisoes').click(); await sleep(350);
  R.estado_drawer_persiste = !$('#drawer').hidden && $('#drawer').classList.contains('vis');
  R.estado_titulo_persiste = $('#dwTitle').textContent === R.decisao_titulo;
  $('#dwClose').click(); await sleep(150);
  // aplicar filtro Urgentes
  $('[data-filter="urgentes"]').click(); await sleep(250);
  R.filtro_urgentes_linhas = $$('#decList .drow').length;
  $('#nav-painel').click(); await sleep(300);
  R.volta_painel_visivel = !$('#scene-painel').hidden;
  $('#nav-decisoes').click(); await sleep(300);
  R.filtro_persiste_apos_troca = $('[data-filter="urgentes"]').classList.contains('on');
  R.filtro_linhas_persistem = $$('#decList .drow').length === R.filtro_urgentes_linhas;
  R.voto_persiste_preview = ($('#decPreview .d-vote .ok') || {}).textContent || '';
  R.modo_persiste = document.body.dataset.mode;

  /* ── 7. Abertura da Cap ──────────────────────────────── */
  $('#nav-painel').click(); await sleep(300);
  $('#capZone').click(); await sleep(400);
  R.cap_painel_aberto = !$('#capPanel').hidden && $('#capPanel').classList.contains('vis');
  R.cap_fala_len = $('#cpFala').textContent.length;
  R.cap_estados_disponiveis = $$('.stbtn').length;
  $$('.stbtn').forEach(b => { if (b.dataset.estado === 'alerta') b.click(); });
  await sleep(200);
  R.cap_estado_alerta_rotulo = $('#capDockState').textContent.trim();
  $$('.stbtn').forEach(b => { if (b.dataset.estado === 'processando') b.click(); });
  await sleep(200);
  R.cap_estado_proc_rotulo = $('#capDockState').textContent.trim();
  $$('.stbtn').forEach(b => { if (b.dataset.estado === 'atencao') b.click(); });
  await sleep(150);
  $('#cpClose').click(); await sleep(200);
  R.cap_painel_fechou = $('#capPanel').hidden;

  /* ── 8. Qualidade global ─────────────────────────────── */
  R.overflow_horizontal = document.documentElement.scrollWidth;
  R.viewport_w = window.innerWidth;
  R.sem_overflow = R.overflow_horizontal <= R.viewport_w;
  // foco visível
  const sb = $('#searchTrigger'); sb.focus();
  R.foco_visivel = getComputedStyle(sb).outlineStyle !== 'none' || getComputedStyle(sb).outlineWidth !== '0px';
  // alvos de teclado: Tab move o foco
  const antes = document.activeElement;
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  R.teclado_tab_disparavel = typeof antes === 'object';
  // hash routing
  R.hash_atual = location.hash;
  $('#nav-ecos').click(); await sleep(300);
  R.ecos_visivel = !$('#scene-ecos').hidden;
  R.ecos_relacoes = $$('#relList .rel-item').length;
  R.hash_apos_nav = location.hash;

  return JSON.stringify(R, null, 1);
})()
