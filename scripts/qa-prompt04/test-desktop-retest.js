(async () => {
  const R = { teste: 'desktop-retest', ts: new Date().toISOString() };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  /* ── 1. Alternância (após fix) ─────────────────────────── */
  $('#modeToggle [data-mode="comando"]').click(); await sleep(500);
  R.comando_body = document.body.dataset.mode;
  R.comando_canvas = getComputedStyle($('#orb')).display;
  R.comando_aria = $('#modeToggle [data-mode="comando"]').getAttribute('aria-pressed');
  R.letterbox_comando = getComputedStyle($('.lbox.top')).height;
  $('#modeToggle [data-mode="imersivo"]').click(); await sleep(600);
  R.imersivo_body = document.body.dataset.mode;
  R.imersivo_canvas = getComputedStyle($('#orb')).display;
  R.letterbox_imersivo = getComputedStyle($('.lbox.top')).height;
  R.troca_ok = R.comando_body === 'comando' && R.comando_canvas === 'none' && R.imersivo_body === 'imersivo';

  /* ── 2. Filtro runway (após fix no dataset) ───────────── */
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  await sleep(250);
  $('#palInput').value = 'runway';
  $('#palInput').dispatchEvent(new Event('input', { bubbles: true }));
  await sleep(200);
  R.runway_resultados = $$('#palResults .pal-row').length;
  R.runway_primeiro = ($('#palResults .pal-row .nm') || {}).textContent || '';
  $('#palette').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await sleep(150);

  /* ── 3. Fechamento da Cap (timing correto) ───────────── */
  $('#capZone').click(); await sleep(400);
  R.cap_abriu = !$('#capPanel').hidden;
  $('#cpClose').click(); await sleep(450);
  R.cap_fechou = $('#capPanel').hidden;

  /* ── 4. Movimento reduzido: engine congela de fato ──── */
  $('#btnSettings').click(); await sleep(250);
  $('#swReduced').click(); await sleep(500);
  R.reduced_classe = document.documentElement.classList.contains('reduced');
  R.reduced_aria = $('#swReduced').getAttribute('aria-checked');
  const cv = $('#orb');
  const px1 = cv.toDataURL();
  await sleep(800);
  const px2 = cv.toDataURL();
  R.reduced_quadro_estatico = px1 === px2;
  // desliga e confirma que volta a animar
  $('#swReduced').click(); await sleep(500);
  const px3 = cv.toDataURL();
  await sleep(800);
  const px4 = cv.toDataURL();
  R.movimento_retomado = px3 !== px4;
  $('#btnSettings').click(); await sleep(200);

  /* ── 5. FPS indicativo (imersivo, 3s) ─────────────────── */
  const fps = await new Promise(res => {
    let n = 0; const t0 = performance.now();
    (function loop() { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(loop); else res(Math.round(n / 3)); })();
  });
  R.fps_medio_3s = fps;

  /* ── 6. Painel vs orbital: contraste de leitura ──────── */
  const panel = $('.panel');
  const pcs = getComputedStyle(panel);
  R.painel_bg_imersivo = pcs.backgroundColor;
  R.painel_cor_titulo = getComputedStyle($('.p-head .t')).color;
  return JSON.stringify(R, null, 1);
})()
