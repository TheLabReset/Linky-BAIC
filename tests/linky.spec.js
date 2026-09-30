// Linky BAIC · pruebas de aceptación.
// Corren contra el sitio servido con las mismas cabeceras de seguridad que Netlify.
// El reloj va fijo en setiembre 2026 para que los links esperados no dependan del día.
import { test, expect } from '@playwright/test';

const HOY = '2026-09-15T10:00:00-05:00';

async function abrir(page, fecha = HOY) {
  const problemas = [];
  page.on('pageerror', e => problemas.push(`JS: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') problemas.push(`consola: ${m.text()}`); });
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith('http://localhost')) problemas.push(`${r.status()} ${r.url()}`); });
  await page.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`)); });
  await page.route('https://baic.pe/**', r => r.fulfill({ status: 200, body: 'ok' }));
  await page.clock.setFixedTime(fecha);
  await page.goto('/');
  await page.waitForFunction(() => window.linky && window.linky.F);
  return problemas;
}
const val = (page, k) => page.evaluate(k => window.linky.F[k].value, k);
const link = page => page.locator('#url').innerText();
async function pill(page, host, v) { await page.click(`#${host}-b`); await page.click(`#${host}-l .dd-o[data-v="${v}"]`); }
async function escribe(page, cb, texto, enter = true) {
  await page.click(`#${cb}-i`); await page.fill(`#${cb}-i`, ''); await page.type(`#${cb}-i`, texto);
  if (enter) await page.keyboard.press('Enter');
}
async function pieza(page, { conc, mod, obj = 'leads', fmt = 'ppa', pub, mot }) {
  await escribe(page, 'cbConc', conc); await escribe(page, 'cbMod', mod); await pill(page, 'ddObj', obj);
  await page.click(`#segFmt input[value=${fmt}]`, { force: true }); await escribe(page, 'cbPub', pub);
  if (mot !== undefined) { await escribe(page, 'cbMot', mot, false); await page.keyboard.press('Tab'); }
}

test('carga limpia: sin errores, sin violaciones de seguridad, todos los archivos', async ({ page }) => {
  const problemas = await abrir(page);
  await page.waitForTimeout(300);
  expect(problemas).toEqual([]);
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
  expect(await page.evaluate(() => document.fonts.check('16px "Bebas Neue"') && document.fonts.check('600 14px Montserrat'))).toBe(true);
});

test('mes y año separados, con rango que se corre solo', async ({ page, browser }) => {
  await abrir(page);
  expect(await page.evaluate(() => window.linky.F.mes.items().length)).toBe(12);
  expect(await page.evaluate(() => window.linky.F.anio.items().map(i => i.id))).toEqual(['2025', '2026', '2027', '2028']);
  expect(await page.evaluate(() => [window.linky.F.mes.value, window.linky.F.anio.value])).toEqual(['09', '2026']);
  const p2 = await browser.newPage();
  await abrir(p2, '2027-01-15T10:00:00-05:00');
  expect(await p2.evaluate(() => [window.linky.F.anio.items().map(i => i.id), window.linky.F.anio.value, window.linky.F.mes.value]))
    .toEqual([['2026', '2027', '2028', '2029'], '2027', '01']);
  await p2.close();
});

test('armado del link: Lima conjunta, BJ40 PRO', async ({ page }) => {
  await abrir(page);
  await escribe(page, 'cbConc', 'lima');
  expect(await val(page, 'conc')).toBe('aion_zual_satelital');
  await escribe(page, 'cbMod', 'bj40 p');
  expect(await val(page, 'mod')).toBe('bj40_pro');
  expect(await val(page, 'url')).toBe('https://baic.pe/modelos/bj40-pro');
  await pill(page, 'ddObj', 'leads'); await page.click('#segFmt input[value=ppa]', { force: true });
  await escribe(page, 'cbPub', 'int +');
  expect(await val(page, 'pub')).toBe('int_bbdd');
  expect(await link(page)).toBe('https://baic.pe/modelos/bj40-pro?utm_source=facebook&utm_medium=paid_social&utm_campaign=baic-202609-aion_zual_satelital-leads&utm_content=bj40-gen-ppa-int_bbdd');
  await escribe(page, 'cbMod', 'bj40');
  expect((await link(page)).startsWith('https://baic.pe/modelos/bj40?')).toBe(true);
});

test('el filtro ordena por relevancia', async ({ page }) => {
  await abrir(page);
  await escribe(page, 'cbConc', 'sat'); expect(await val(page, 'conc')).toBe('satelital');
  await escribe(page, 'cbMod', 'bj6'); expect(await val(page, 'mod')).toBe('bj60');
});

test('motivo libre: se limpia en vivo y vacío va gen', async ({ page }) => {
  await abrir(page);
  await pieza(page, { conc: 'satelital', mod: 'x55', pub: 'lal' });
  await escribe(page, 'cbMot', 'Día de la Madre', false); await page.keyboard.press('Tab');
  expect(await page.inputValue('#cbMot-i')).toBe('dia_de_la_madre');
  expect(await link(page)).toContain('utm_content=x55-dia_de_la_madre-ppa-lal');
  await escribe(page, 'cbMot', '', false); await page.keyboard.press('Tab');
  expect(await link(page)).toContain('utm_content=x55-gen-ppa-lal');
});

test('lo que falta se ve en el link y se marca al intentar generar', async ({ page }) => {
  await abrir(page);
  await escribe(page, 'cbConc', 'satelital'); await escribe(page, 'cbMod', 'x55'); await pill(page, 'ddObj', 'leads');
  await page.click('#segFmt input[value=ppa]', { force: true });
  expect(await page.locator('#url .hueco').allInnerTexts()).toEqual(['público']);
  expect(await page.getAttribute('#btnGen', 'aria-label')).toBe('Falta el público');
  await page.click('#btnGen', { force: true });
  await expect(page.locator('.field[data-f=publico]')).toHaveClass(/pide/);
  await escribe(page, 'cbPub', 'lal');
  await expect(page.locator('.field[data-f=publico]')).not.toHaveClass(/pide/);
});

test('agregar desde la misma lista y avisar lo que no existe', async ({ page }) => {
  await abrir(page);
  await escribe(page, 'cbConc', 'Motors Norte', false);
  await expect(page.locator('#cbConc-l')).toContainText('Agregar «Motors Norte»');
  await page.keyboard.press('ArrowUp'); await page.keyboard.press('Enter');
  expect(await val(page, 'conc')).toBe('motors_norte');
  await escribe(page, 'cbMod', 'Tanque 300', false); await page.keyboard.press('Escape'); await page.click('#cbPub-i'); await page.keyboard.press('Escape');
  expect(await val(page, 'mod')).toBe('');
  await expect(page.locator('#avisoMod')).toContainText('no está en la lista');
});

test('página: se llena con el modelo, respeta lo editado y avisa', async ({ page }) => {
  await abrir(page);
  await escribe(page, 'cbMod', 'x55');
  await escribe(page, 'cbUrl', 'https://baic.pe/lanzamiento', false); await page.keyboard.press('Escape'); await page.keyboard.press('Tab');
  await escribe(page, 'cbMod', 'bj60');
  expect(await val(page, 'url')).toBe('https://baic.pe/lanzamiento');
  await page.click('#btnRestaurar');
  expect(await val(page, 'url')).toBe('https://baic.pe/modelos/bj60');
  await escribe(page, 'cbUrl', 'https://baic.pe/modelos/bj30-hev', false); await page.keyboard.press('Escape');
  await expect(page.locator('#avisoUrl')).toContainText('la del BJ30 HEV');
  await escribe(page, 'cbUrl', 'https://otro.com/x', false); await page.keyboard.press('Escape');
  await expect(page.locator('#avisoUrl')).toContainText('no de baic.pe');
  await escribe(page, 'cbUrl', 'baic pe', false); await page.keyboard.press('Escape');
  await expect(page.locator('#avisoUrl .aviso')).toHaveClass(/bloquea/);
  await escribe(page, 'cbUrl', 'baic.pe/modelos/x55?ref=x&utm_source=viejo#cotizar', false); await page.keyboard.press('Escape');
  await escribe(page, 'cbMod', 'x55'); await escribe(page, 'cbConc', 'satelital'); await pill(page, 'ddObj', 'leads');
  await page.click('#segFmt input[value=ppa]', { force: true }); await escribe(page, 'cbPub', 'int');
  const l = await link(page);
  expect(l.startsWith('https://baic.pe/modelos/x55?ref=x&')).toBe(true);
  expect(l).not.toContain('viejo'); expect(l.endsWith('#cotizar')).toBe(true);
});

test('reproducciones solo acepta video', async ({ page }) => {
  await abrir(page);
  await page.click('#segFmt input[value=ppa]', { force: true });
  await pill(page, 'ddObj', 'reproducciones');
  await expect(page.locator('#segFmt input[value=ppa]')).toBeDisabled();
  expect(await page.evaluate(() => !document.querySelector('#segFmt input:checked'))).toBe(true);
});

test('generar, copiar, duplicado, nueva pieza, historial y CSV', async ({ page }) => {
  await abrir(page);
  await pieza(page, { conc: 'satelital', mod: 'x55', pub: 'int_bbdd', mot: 'bono' });
  await page.click('#btnGen');
  await expect(page.locator('#btnGen')).toHaveAttribute('aria-label', 'Copiado');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain('utm_campaign=baic-202609-satelital-leads');
  expect(clip).toContain('utm_content=x55-bono-ppa-int_bbdd');
  await expect(page.locator('#btnGen')).toHaveAttribute('aria-label', 'Generar y copiar', { timeout: 4000 });
  await page.click('#btnGen');
  await expect(page.locator('#dlgDup')).toBeVisible();
  await page.click('#dupNueva');
  await expect(page.locator('#hBody tr:first-child .lnk')).toContainText('int_bbdd-v2');
  await page.click('#btnNueva');
  expect(await page.evaluate(() => { const F = window.linky.F; return [F.conc.value, F.obj.value, F.mod.value, F.mot.value]; })).toEqual(['satelital', 'leads', '', '']);
  await pieza(page, { conc: 'satelital', mod: 'x35', fmt: 'ppv', pub: 'lal', mot: 'cyber_wow' });
  await page.click('#btnGen'); await page.click('#btnNueva');
  await page.click('#cbMot-i');
  await expect(page.locator('#cbMot-l')).toContainText('cyber_wow');
  await page.keyboard.press('Escape');
  await page.click('#hBody tr:first-child [data-act=copy]');
  await expect(page.locator('#hBody tr:first-child [data-act=copy]')).toHaveAttribute('aria-label', 'Copiado');
  const [descarga] = await Promise.all([page.waitForEvent('download'), page.click('#btnCsv')]);
  const csv = await (await descarga.createReadStream()).toArray();
  const texto = Buffer.concat(csv);
  expect(texto.subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
  expect(texto.toString('utf8')).toContain('Motivo');
  await expect(page.locator('#notaDesc')).toContainText('carpeta de descargas');
  const links = await page.evaluate(() => JSON.parse(localStorage.getItem('linky_baic_history')).map(h => h.urlFinal));
  expect(links.length).toBe(3);
  for (const l of links) expect(l.split('?')[1]).not.toMatch(/[A-Z\s+áéíóúñ]/);
});

test('Excel se arma con la librería local', async ({ page }) => {
  await abrir(page);
  await pieza(page, { conc: 'satelital', mod: 'x55', pub: 'lal' });
  await page.click('#btnGen');
  const [descarga] = await Promise.all([page.waitForEvent('download'), page.click('#btnXlsx')]);
  expect(descarga.suggestedFilename()).toBe('utm_baic_2026-09-15.xlsx');
  const buf = Buffer.concat(await (await descarga.createReadStream()).toArray());
  expect(buf.subarray(0, 2).toString()).toBe('PK');
});

test('recuerda plataforma, concesionario y objetivo, y migra catálogos', async ({ page }) => {
  await abrir(page);
  await pieza(page, { conc: 'satelital', mod: 'x55', pub: 'lal' });
  await page.click('#btnGen');
  await page.reload(); await page.waitForFunction(() => window.linky);
  expect(await page.evaluate(() => [window.linky.F.conc.value, window.linky.F.obj.value])).toEqual(['satelital', 'leads']);
  await page.evaluate(() => { const c = JSON.parse(localStorage.getItem('linky_baic_config')) || getDefaultConfig(); c.version = 0; c.catalogs.modelos = c.catalogs.modelos.filter(m => m.id !== 'x7'); localStorage.setItem('linky_baic_config', JSON.stringify(c)); });
  await page.reload(); await page.waitForFunction(() => window.linky);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('linky_baic_config')).catalogs.modelos.some(m => m.id === 'x7'))).toBe(true);
});

test('listas: agregar limpia el valor y los de fábrica solo se ocultan', async ({ page }) => {
  await abrir(page);
  await page.click('#btnListas');
  await page.fill('#cfgNom', 'San Martín + Norte');
  await expect(page.locator('#cfgPrev')).toHaveText('san_martin_norte');
  await page.click('#cfgAdd');
  expect(await page.evaluate(() => window.linky.F.conc.items().some(i => i.id === 'san_martin_norte'))).toBe(true);
  await expect(page.locator('#cfgBody [data-id=satelital]')).toHaveAttribute('data-cfg', 'ver');
});

test('sistema visual: rótulos visibles, un solo acento, sin scroll lateral', async ({ page }) => {
  await abrir(page);
  await pieza(page, { conc: 'satelital', mod: 'x55', pub: 'lal' });
  await page.click('#btnGen');
  const vacios = await page.evaluate(() => [...document.querySelectorAll('.bs')]
    .filter(b => b.offsetParent && !b.closest('dialog:not([open]),[hidden]'))
    .filter(b => ![...b.querySelectorAll('.base > span')].some(s => getComputedStyle(s).visibility === 'visible' && s.textContent.trim()))
    .map(b => b.id || b.dataset.act));
  expect(vacios).toEqual([]);
  const colores = await page.evaluate(() => { const s = new Set(); for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || el.closest('[hidden],dialog:not([open])')) continue; for (const p of ['color', 'backgroundColor', 'borderTopColor']) { const m = cs[p].match(/rgba?\((\d+), (\d+), (\d+)/); if (!m) continue; const [r, g, b] = m.slice(1).map(Number); if (Math.max(r, g, b) - Math.min(r, g, b) > 80) s.add(`${r},${g},${b}`); } } return [...s]; });
  for (const c of colores) expect(['46,139,255', '255,107,92']).toContain(c);
  for (const w of [1440, 900, 390, 320]) {
    await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(100);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `ancho ${w}`).toBeLessThanOrEqual(w);
  }
});
