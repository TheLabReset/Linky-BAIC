/* Linky BAIC · app
   Estado, armado del link, reglas entre campos, historial, descargas, listas y arranque. */
"use strict";

/* ============================================================ Estado */
const state = { config: loadConfig(), history: store.get(LS.history, []), prefs: store.get(LS.prefs, {}), urlDirty:false, lastAuto:'' };
const cat = k => state.config.catalogs[k];
const visibles = k => cat(k).filter(x => !x.hidden);
const byId = (k, id) => cat(k).find(x => x.id === id);
const F = {};

/* ============================================================ Formulario */
function segHTML(name, items, sel){ return items.map(it => `<label><input type="radio" name="${name}" value="${esc(it.id)}" ${it.id===sel?'checked':''}><span>${esc(it.label)}</span></label>`).join(''); }
const radio = n => { const r = document.querySelector(`input[name="${n}"]:checked`); return r ? r.value : ''; };
const setRadio = (n, v) => { const r = document.querySelector(`input[name="${n}"][value="${CSS.escape(v)}"]`); if (r) r.checked = true; };
const clearRadio = n => $$(`input[name="${n}"]`).forEach(r => r.checked = false);
/* Mes: los 12. Año: uno antes del actual y dos después; se recalcula solo cada año (hora de Lima). */
const mesesItems = () => MESES.map((m,i) => ({ id:String(i+1).padStart(2,'0'), label:m }));
function aniosItems(extra){ const { anio } = limaNow(); const xs = [anio-1, anio, anio+1, anio+2]; if (extra && !xs.includes(Number(extra))) xs.push(Number(extra)); return xs.sort((a,b)=>a-b).map(a => ({ id:String(a), label:String(a) })); }
function poblarObj(keep){ const p = PLATAFORMAS.find(x => x.id === radio('plat')); const sug = p ? p.sugeridos : []; F.obj.setGroups(p ? [{ label:'Sugeridos', items: OBJETIVOS.filter(o=>sug.includes(o.id)) }, { label:'Otros', items: OBJETIVOS.filter(o=>!sug.includes(o.id)) }] : [{ items: OBJETIVOS }], keep ?? F.obj.value); }
function gruposModelo(){ const ms = visibles('modelos'); return [...new Set(ms.map(m=>m.group||'Modelos'))].map(g => ({ label:g, items: ms.filter(m=>(m.group||'Modelos')===g).map(m => ({ ...m, sub:m.utm })) })); }
function gruposMotivo(){
  const cat_ = visibles('mensajes').map(m => ({ id:m.utm, label:m.label, sub:m.utm, valor:m.utm }));
  const usados = [...new Set(state.history.map(h => h.utm.utm_content.split('-')[1]).filter(Boolean))].filter(u => !cat_.some(c=>c.id===u)).slice(0,8).map(u => ({ id:u, label:u, valor:u }));
  return [{ label:'De la lista', items:cat_ }, { label:'Usados antes', items:usados }];
}
function gruposPagina(){
  const q = F.url ? norm(F.url.inp.value.trim()) : '';
  const mods = visibles('modelos').filter(m=>m.url).map(m => ({ id:m.url, label:m.label, sub:m.url.replace(/^https?:\/\//,''), valor:m.url }));
  const usadas = [...new Set(state.history.map(h=>h.urlDestino))].filter(u => !mods.some(m=>m.id===u)).slice(0,6).map(u => ({ id:u, label:u.replace(/^https?:\/\//,''), valor:u }));
  const f = arr => arr.filter(it => !q || norm(it.label).includes(q) || norm(it.id).includes(q));
  return [{ label:'Páginas de modelo', items:f(mods) }, { label:'Usadas antes', items:f(usadas) }];
}
function crearEn(k, extra = {}){ return texto => { const id = sanitizeValue(texto); if (!id) return ''; if (cat(k).some(x=>x.id===id)) return id; cat(k).push({ id, label:texto, utm:id, core:false, hidden:false, ...extra }); store.set(LS.config, state.config); return id; }; }

/* ============================================================ Armado */
function leer(){
  return { plat:radio('plat'), anio:Number(F.anio.value)||0, mes:Number(F.mes.value)||0, conc:F.conc.value, modelo:F.mod.value, obj:F.obj.value, fmt:radio('fmt'), pub:F.pub.value, msg:sanitizeValue(F.mot.value) || 'gen', ver:$('#fVer').value.trim(), url:F.url.value };
}
const periodoDe = f => f.anio && f.mes ? `${f.anio}${String(f.mes).padStart(2,'0')}` : '';
const vnum = v => { const n = parseInt(v,10); return Number.isFinite(n) ? n : 0; };
function parseURL(raw){
  let s = String(raw||'').trim(); if (!s) return { ok:false, vacio:true };
  if (/\s/.test(s)) return { ok:false, msg:`«${s.slice(0,40)}» tiene un espacio adentro, así que no es un link completo. Revisa que lo hayas pegado entero.` };
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try{ const u = new URL(s); if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) throw 0; return { ok:true, url:u }; }
  catch{ return { ok:false, msg:`«${String(raw).trim().slice(0,40)}» no es una dirección web. Pega el link tal como aparece en el navegador.` }; }
}
function armar(f){
  const plat = PLATAFORMAS.find(p=>p.id===f.plat), conc = byId('concesionarios', f.conc), mod = byId('modelos', f.modelo);
  const obj = OBJETIVOS.find(o=>o.id===f.obj), fmt = FORMATOS.find(x=>x.id===f.fmt), pub = byId('publicos', f.pub);
  const per = periodoDe(f), v = vnum(f.ver);
  const content = [mod?.utm, f.msg, fmt?.utm, pub?.utm]; if (v > 1) content.push('v'+v);
  return { p:{ plat, conc, mod, obj, fmt, pub, per, v, msg:f.msg },
    utm: plat && conc && obj && mod && fmt && pub && per ? { utm_source:plat.utm, utm_medium:MEDIUM, utm_campaign:['baic',per,conc.utm,obj.utm].join('-'), utm_content:content.join('-') } : null };
}
function final(u, utm){ const x = new URL(u.toString()); UTM_KEYS.forEach(k => x.searchParams.delete(k)); for (const [k,v] of Object.entries(utm)) x.searchParams.set(k,v); return x.toString(); }
function calcular(){
  const f = leer(); const { p, utm } = armar(f); const ur = parseURL(f.url); const falta = [];
  if (!p.plat) falta.push('plataforma'); if (!r_mes(f)) falta.push('mes'); if (!f.anio) falta.push('año'); if (!p.conc) falta.push('concesionario'); if (!p.mod) falta.push('modelo');
  if (!p.obj) falta.push('objetivo'); if (!p.fmt) falta.push('formato'); if (!p.pub) falta.push('público'); if (!ur.ok) falta.push('página');
  const fin = utm && ur.ok ? final(ur.url, utm) : '';
  return { f, p, utm, ur, falta, fin, ok: !falta.length && !!fin };
}
const r_mes = f => !!f.mes;
const textoFalta = falta => falta.length === 1 ? `Falta ${['página','plataforma'].includes(falta[0]) ? 'la' : 'el'} ${falta[0]}` : `Faltan ${falta.length} campos`;

/* ============================================================ Condicionales */
function aviso(sel, html){ const el = $(sel); el.innerHTML = html; pintar(el); }
function condicionales(origen){
  const f = leer();
  const soloVideo = SOLO_VIDEO.has(f.obj); let quitado = false;
  $$('input[name="fmt"]').forEach(r => { const it = FORMATOS.find(x=>x.id===r.value); r.disabled = soloVideo && !it.video; if (r.disabled && r.checked){ r.checked = false; quitado = true; } });
  aviso('#avisoFmt', soloVideo && quitado ? `<div class="aviso">${ic('info')}<span>Con reproducciones solo va video. Quitamos el formato que tenías.</span></div>` : '');
  const conc = byId('concesionarios', f.conc);
  $('#cobertura').innerHTML = conc && conc.cobertura ? conc.cobertura.split(',').map(s=>s.trim()).filter(Boolean).map(c=>`<span class="chip">${esc(c)}</span>`).join('') : '';
  for (const [cb, sel, nombre] of [[F.conc,'#avisoConc','concesionario'],[F.mod,'#avisoMod','modelo'],[F.pub,'#avisoPub','público']])
    aviso(sel, !cb.value && cb.suelto ? `<div class="aviso">${ic('info')}<span>«${esc(cb.suelto)}» no está en la lista. Elige una opción o agrégalo desde la misma lista.</span></div>` : '');
  const mod = byId('modelos', f.modelo);
  if (origen === 'modelo' && mod && !state.urlDirty){ F.url.value = mod.url || ''; state.lastAuto = mod.url || ''; }
  const rb = $('#btnRestaurar');
  if (mod && mod.url && state.urlDirty && F.url.value.trim() !== mod.url){ rb.hidden = false; rb.textContent = `Usar la página de ${mod.label}`; } else rb.hidden = true;
  validarUrl();
  $$('.field.pide').forEach(el => { const k = el.dataset.f; const r = calcular(); const map = { mes:'mes', anio:'año', pagina:'página', publico:'público' }; if (!r.falta.includes(map[k] || k)) el.classList.remove('pide'); });
}
function validarUrl(){
  const f = leer(); const r = parseURL(f.url); const inp = F.url.inp; inp.classList.remove('bad');
  if (r.vacio) return aviso('#avisoUrl','');
  if (!r.ok){ inp.classList.add('bad'); return aviso('#avisoUrl', `<div class="aviso bloquea">${ic('alert')}<span>${esc(r.msg)}</span></div>`); }
  const out = []; const host = r.url.hostname.replace(/^www\./,'');
  if (host !== 'baic.pe') out.push(`Este link es de ${host}, no de baic.pe. Si es a propósito, sigue nomás.`);
  const mod = byId('modelos', f.modelo);
  if (mod){ const path = r.url.pathname.replace(/\/+$/,'') || '/'; const dueno = cat('modelos').find(m => { try{ const u = new URL(m.url); return u.hostname.replace(/^www\./,'')===host && (u.pathname.replace(/\/+$/,'')||'/')===path; }catch{ return false; } }); if (dueno && dueno.utm !== mod.utm) out.push(`Elegiste ${mod.label}, pero esta página es la del ${dueno.label}.`); }
  aviso('#avisoUrl', out.map(m => `<div class="aviso">${ic('info')}<span>${esc(m)}</span></div>`).join(''));
}

/* ============================================================ Link en vivo */
function vistaPrevia(){
  const r = calcular(); const p = r.p; const u = $('#url');
  if (r.ok){ const i = r.fin.indexOf('utm_source='); u.innerHTML = `${esc(r.fin.slice(0,i))}<b>${esc(r.fin.slice(i))}</b>`; }
  else {
    const h = n => `<span class="hueco">${esc(n)}</span>`, v = (x, n) => x ? `<b>${esc(x)}</b>` : h(n);
    let base = h('página'), sep = '?', hash = '';
    if (r.ur.ok){ const x = new URL(r.ur.url.toString()); UTM_KEYS.forEach(k=>x.searchParams.delete(k)); hash = x.hash; x.hash = ''; const s = x.toString(); base = esc(s); sep = x.search ? '&' : '?'; }
    const cont = [v(p.mod?.utm,'modelo'), `<b>${esc(p.msg)}</b>`, v(p.fmt?.utm,'formato'), v(p.pub?.utm,'público')]; if (p.v > 1) cont.push(`<b>v${p.v}</b>`);
    u.innerHTML = `${base}${sep}<b>utm_source=</b>${v(p.plat?.utm,'plataforma')}<b>&amp;utm_medium=${MEDIUM}&amp;utm_campaign=baic-</b>${v(p.per,'mes')}<b>-</b>${v(p.conc?.utm,'concesionario')}<b>-</b>${v(p.obj?.utm,'objetivo')}<b>&amp;utm_content=</b>${cont.join('<b>-</b>')}${esc(hash)}`;
  }
  const btn = $('#btnGen');
  if (!btn.classList.contains('hecho') || !r.ok) bsState(btn, r.ok ? 'listo' : 'falta', r.ok ? {} : { falta: textoFalta(r.falta) });
}

/* ============================================================ Generar */
const baseCont = c => c.replace(/-v\d+$/, '');
const duplicado = utm => state.history.find(h => h.utm.utm_source===utm.utm_source && h.utm.utm_campaign===utm.utm_campaign && h.utm.utm_content===utm.utm_content);
function versionLibre(utm){ const base = baseCont(utm.utm_content); let max = 1; state.history.forEach(h => { if (h.utm.utm_source!==utm.utm_source || h.utm.utm_campaign!==utm.utm_campaign || baseCont(h.utm.utm_content)!==base) return; const m = h.utm.utm_content.match(/-v(\d+)$/); max = Math.max(max, m ? Number(m[1]) : 1); }); return Math.min(max+1, 99); }
let tHecho = 0;
async function generar(){
  const r = calcular();
  if (!r.ok){
    const map = { plataforma:'plataforma', mes:'mes', 'año':'anio', concesionario:'concesionario', modelo:'modelo', objetivo:'objetivo', formato:'formato', 'público':'publico', 'página':'pagina' };
    r.falta.forEach(k => $(`.field[data-f="${map[k]}"]`)?.classList.add('pide'));
    const foco = { plataforma:'#segPlat input', mes:'#ddMes-b', 'año':'#ddAnio-b', concesionario:'#cbConc-i', modelo:'#cbMod-i', objetivo:'#ddObj-b', formato:'#segFmt input:not(:disabled)', 'público':'#cbPub-i', 'página':'#cbUrl-i' }[r.falta[0]];
    $(foco)?.focus(); return;
  }
  const d = duplicado(r.utm); if (d) return abrirDup(d, r);
  await guardar(r);
}
async function guardar(r){
  const p = r.p; const msgCat = cat('mensajes').find(m=>m.utm===p.msg);
  const e = { id:uid(), createdAt:new Date().toISOString(),
    ids:{ plat:r.f.plat, mes:F.mes.value, anio:F.anio.value, conc:r.f.conc, modelo:r.f.modelo, obj:r.f.obj, fmt:r.f.fmt, pub:r.f.pub, msg:p.msg, ver:r.f.ver },
    labels:{ plat:p.plat.label, conc:p.conc.label, cobertura:p.conc.cobertura||'', modelo:p.mod.label, obj:p.obj.label, fmt:p.fmt.label, pub:p.pub.label, msg: msgCat ? msgCat.label : p.msg },
    periodo:p.per, version: p.v > 1 ? p.v : '', utm:r.utm, urlDestino:r.ur.url.toString(), urlFinal:r.fin, urlStatus:{ kind:'gris', label:'Revisando la página…' } };
  state.history.unshift(e); store.set(LS.history, state.history);
  state.prefs = { plat:r.f.plat, conc:r.f.conc, obj:r.f.obj }; store.set(LS.prefs, state.prefs);
  const ok = await copiar(r.fin); const btn = $('#btnGen');
  bsState(btn, 'hecho', { hecho: ok ? 'Copiado' : 'Cópialo del historial' });
  $('#notaGen').textContent = !storageOk ? 'Este navegador no deja guardar el historial. El link igual se copió.' : ok ? '' : 'El navegador no dejó copiar solo. El link quedó arriba del historial.';
  clearTimeout(tHecho); tHecho = setTimeout(() => { btn.classList.remove('hecho'); vistaPrevia(); }, 2200);
  historial(e.id); vistaPrevia();
  revisarPagina(e.urlDestino).then(st => { e.urlStatus = st; store.set(LS.history, state.history); historial(); });
}
function abrirDup(d, r){
  const nv = versionLibre(r.utm);
  $('#dupTxt').textContent = `La generaste el ${fecha(d.createdAt)} para ${d.labels.conc}, ${d.labels.modelo}. ¿Es la misma pieza?`;
  $('#dupN1').textContent = $('#dupN2').textContent = `Es otra pieza: crear v${nv}`; bsState($('#dupNueva'), 'listo');
  $('#dupCopiar').textContent = 'Copiar la que ya existe';
  $('#dupCopiar').onclick = async () => { const ok = await copiar(d.urlFinal); $('#dupCopiar').textContent = ok ? 'Copiada' : 'No se pudo copiar'; setTimeout(()=>$('#dlgDup').close(), 900); };
  $('#dupNueva').onclick = async () => { $('#dlgDup').close(); $('#fVer').value = nv; vistaPrevia(); const r2 = calcular(); if (r2.ok && !duplicado(r2.utm)) await guardar(r2); };
  $('#dlgDup').showModal();
}
function nuevaPieza(){
  F.mod.value = ''; clearRadio('fmt'); F.pub.value = ''; F.mot.value = ''; $('#fVer').value = ''; F.url.value = ''; state.urlDirty = false;
  $('#btnGen').classList.remove('hecho'); $('#notaGen').textContent = ''; $('#notaBase').innerHTML = ''; $$('.field.pide').forEach(el=>el.classList.remove('pide'));
  condicionales(); vistaPrevia(); F.mod.inp.focus();
}

/* ============================================================ Revisión de página */
async function revisarPagina(url){
  const c = new AbortController(); const t = setTimeout(()=>c.abort(), 8000);
  try{ const res = await fetch(url, { method:'HEAD', mode:'cors', redirect:'follow', signal:c.signal }); clearTimeout(t); return res.ok ? { kind:'ok', label:'Sin errores detectados' } : { kind:'err', label:`Error ${res.status}` }; }
  catch(e){ clearTimeout(t); if (e && e.name==='AbortError') return { kind:'gris', label:'Tardó demasiado en responder' }; try{ await fetch(url, { method:'GET', mode:'no-cors' }); return { kind:'ok', label:'Sin errores detectados' }; } catch{ return { kind:'gris', label:'No se pudo revisar' }; } }
}

/* ============================================================ Historial */
function filtrosHist(){
  const pers = [...new Set(state.history.map(h=>h.periodo))].sort().reverse();
  F.hPer.setGroups([{ items:[{ id:'*', label:'Todos los meses' }, ...pers.map(p=>({ id:p, label:`${MESES[Number(p.slice(4))-1]} ${p.slice(0,4)}` }))] }], F.hPer.value || '*');
  const cs = [...new Set(state.history.map(h=>h.labels.conc))].sort();
  F.hConc.setGroups([{ items:[{ id:'*', label:'Todos los concesionarios' }, ...cs.map(c=>({ id:c, label:c }))] }], F.hConc.value || '*');
}
function historial(nueva){
  filtrosHist();
  const q = norm($('#hBuscar').value.trim()), pv = F.hPer.value, cv = F.hConc.value, n = state.history.length;
  $('#hCount').textContent = n === 0 ? '' : n === 1 ? '1 link' : `${n} links`;
  $('#hFoot').hidden = n === 0; $('#hFiltros').hidden = n === 0;
  const lst = state.history.filter(h => (pv==='*'||!pv||h.periodo===pv) && (cv==='*'||!cv||h.labels.conc===cv) && (!q || norm(Object.values(h.labels).join(' ')+' '+h.urlFinal).includes(q)));
  const body = $('#hBody');
  if (!n){ body.innerHTML = `<tr><td colspan="5" class="vacio-h">Los links que generes aparecen acá.</td></tr>`; return; }
  if (!lst.length){ body.innerHTML = `<tr><td colspan="5" class="vacio-h">Ningún link coincide con «${esc($('#hBuscar').value.trim() || 'ese filtro')}».</td></tr>`; return; }
  const mini = (act, id, a, b) => `<button class="bs sec" type="button" data-act="${act}" data-id="${id}"><span class="capa base"><span data-s="listo">${a}</span><span data-s="hecho">${b}</span></span><span class="capa top" aria-hidden="true"><span data-s="listo">${a}</span><span data-s="hecho">${b}</span></span></button>`;
  body.innerHTML = lst.map(h => `<tr class="${h.id===nueva?'nueva':''}">
      <td class="fecha">${esc(fecha(h.createdAt))}</td>
      <td><div class="t1">${esc(h.labels.conc)}, ${esc(h.labels.modelo)}</div><div class="t2">${esc(h.labels.plat)}, ${esc(h.labels.obj)}, ${esc(h.labels.fmt)}, ${esc(h.labels.pub)}, ${esc(h.labels.msg)}${h.version?`, v${h.version}`:''}</div></td>
      <td><div class="lnk">${esc(h.urlFinal)}</div></td>
      <td><span class="est ${h.urlStatus?.kind||'gris'}">${esc(h.urlStatus?.label||'')}</span></td>
      <td><div class="fila-acc">${mini('copy',h.id,'Copiar','Copiado')}${mini('base',h.id,'Usar de base','Cargado')}${mini('del',h.id,'Quitar','Quitado')}</div></td></tr>`).join('');
  body.querySelectorAll('.bs').forEach(x => bsState(x, 'listo'));
}
function usarDeBase(h){
  const i = h.ids; const oculto = [['concesionarios',i.conc],['modelos',i.modelo],['publicos',i.pub]].some(([k,id]) => { const it = byId(k,id); return !it || it.hidden; });
  setRadio('plat', i.plat); poblarObj(i.obj);
  const im = i.mes || (i.per||'').slice(5), ia = i.anio || (i.per||'').slice(0,4);
  F.mes.value = im; F.anio.setGroups([{ items: aniosItems(ia) }], ia);
  F.conc.value = i.conc; F.mod.value = i.modelo; F.obj.value = i.obj; condicionales();
  setRadio('fmt', i.fmt); F.pub.value = i.pub; F.mot.value = i.msg === 'gen' ? '' : i.msg; $('#fVer').value = i.ver || ''; F.url.value = h.urlDestino;
  const mod = byId('modelos', i.modelo); state.urlDirty = !(mod && mod.url === h.urlDestino); state.lastAuto = mod ? mod.url : '';
  $('#btnGen').classList.remove('hecho'); condicionales(); vistaPrevia();
  aviso('#notaBase', `<div class="aviso" style="margin-bottom:20px">${ic('info')}<span>Cargaste la pieza del ${esc(fecha(h.createdAt))}. Cambia lo que necesites.${oculto?' Uno de sus valores está oculto en Listas.':''}</span></div>`);
  window.scrollTo({ top:0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

/* ============================================================ Descargas */
const COLS = [ ['Fecha',h=>new Date(h.createdAt).toLocaleString('es-PE')],['Plataforma',h=>h.labels.plat],['Concesionario',h=>h.labels.conc],['Cobertura',h=>h.labels.cobertura],['Modelo',h=>h.labels.modelo],['Objetivo',h=>h.labels.obj],['Formato',h=>h.labels.fmt],['Público',h=>h.labels.pub],['Motivo',h=>h.labels.msg],['Periodo',h=>h.periodo],['Versión',h=>h.version],['utm_source',h=>h.utm.utm_source],['utm_medium',h=>h.utm.utm_medium],['utm_campaign',h=>h.utm.utm_campaign],['utm_content',h=>h.utm.utm_content],['URL destino',h=>h.urlDestino],['URL final',h=>h.urlFinal],['Estado de la página',h=>h.urlStatus?.label||''] ];
const hoy = () => new Date().toISOString().slice(0,10);
async function bajar(blob, name){
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return 'saved';
}
function resultadoDescarga(btn, estado, name){
  if (estado === 'saved'){ flash(btn); $('#notaDesc').textContent = `${name} está en tu carpeta de descargas.`; return; }
  bsState(btn,'listo');
  $('#notaDesc').textContent = estado === 'declined' ? `No se guardó ${name}.` : estado === 'rate_limited' ? 'Ya hay una descarga esperando tu confirmación.' : `Esta vista no permite descargar ${name}. Abre el archivo HTML en tu navegador para bajarlo.`;
}
function flash(btn){ bsState(btn,'hecho'); setTimeout(()=>bsState(btn,'listo'), 2000); }
async function csv(){ const q = v => `"${String(v??'').replace(/"/g,'""')}"`; const name = `utm_baic_${hoy()}.csv`; const t = [COLS.map(c=>q(c[0])).join(','), ...state.history.map(h=>COLS.map(c=>q(c[1](h))).join(','))].join('\r\n'); const est = await bajar(new Blob(['\ufeff'+t],{type:'text/csv;charset=utf-8'}), name); resultadoDescarga($('#btnCsv'), est, name); }
const script = src => new Promise((ok,ko)=>{ const s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=ko; document.head.appendChild(s); });
async function xlsx(){
  const btn = $('#btnXlsx'); if (btn.classList.contains('trabaja')) return; bsState(btn,'trabaja'); const name = `utm_baic_${hoy()}.xlsx`;
  try{ if (!window.XLSX) await script('vendor/xlsx.full.min.js');
    const ws = XLSX.utils.aoa_to_sheet([COLS.map(c=>c[0]), ...state.history.map(h=>COLS.map(c=>c[1](h)))]); ws['!cols'] = COLS.map(c => ({ wch: /URL|utm_c/.test(c[0]) ? 48 : 16 }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'UTMs BAIC'); const buf = XLSX.write(wb, { bookType:'xlsx', type:'array' }); const est = await bajar(new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), name); resultadoDescarga(btn, est, name); }
  catch{ bsState(btn,'listo'); $('#notaDesc').innerHTML = `<span style="color:var(--bloquea)">El Excel no se pudo armar porque la librería no cargó, casi siempre por falta de conexión. Descarga el CSV, que abre igual en Excel.</span>`; }
}

/* ============================================================ Confirmación */
function confirmar({ titulo, texto, ok, escribir=false }){
  return new Promise(res => { const d = $('#dlgConf'), btn = $('#cfOk'); $('#cfT').textContent = titulo; $('#cfTxt').textContent = texto; $('#cfOk1').textContent = $('#cfOk2').textContent = ok; $('#cfEscribir').hidden = !escribir; $('#cfInp').value = '';
    bsState(btn, escribir ? 'falta' : 'listo'); $('#cfInp').oninput = () => bsState(btn, $('#cfInp').value.trim().toUpperCase()==='BORRAR' ? 'listo' : 'falta');
    let r = false; btn.onclick = () => { if (btn.getAttribute('aria-disabled')==='true') return; r = true; d.close(); }; d.onclose = () => res(r); d.showModal(); (escribir ? $('#cfInp') : btn).focus(); });
}

/* ============================================================ Listas */
const TABS = [ { key:'concesionarios', label:'Concesionarios', uno:'concesionario', extra:'cobertura', extraL:'Ciudades que cubre', ph:'Lima, Callao' }, { key:'modelos', label:'Modelos', uno:'modelo', extra:'url', extraL:'Página del modelo', ph:'https://baic.pe/modelos/…' }, { key:'mensajes', label:'Motivos', uno:'motivo' }, { key:'publicos', label:'Públicos', uno:'público' } ];
let tab = 'concesionarios';
function abrirListas(){ $('#segListas').innerHTML = segHTML('tab', TABS.map(t=>({id:t.key,label:t.label})), tab); cuerpoListas(); $('#dlgListas').showModal(); }
function cuerpoListas(msg){
  const t = TABS.find(x=>x.key===tab); const items = cat(t.key); const bases = [...new Set(cat('modelos').map(m=>m.utm))];
  const filas = items.map(it => `<div class="it ${it.hidden?'oculto':''}"><div><div class="n1">${esc(it.label)}${it.core?'<span class="tag">de fábrica</span>':''}${it.hidden?'<span class="tag">oculto</span>':''}</div><div class="n2"><code>${esc(it.utm)}</code>${t.extra && it[t.extra] ? ` · ${esc(it[t.extra])}` : ''}</div></div><button class="pill-btn press sm" type="button" data-cfg="${it.core?'ver':'quitar'}" data-id="${esc(it.id)}">${it.core ? (it.hidden?'Mostrar':'Ocultar') : 'Quitar'}</button></div>`).join('');
  $('#cfgBody').innerHTML = `<div class="lista">${filas}</div><div class="add">
      <div class="field"><label class="lbl" for="cfgNom">Agregar ${t.uno}</label><input class="inp" id="cfgNom" type="text" placeholder="Como lo quieres ver en la lista"></div>
      ${t.key==='modelos' ? `<div class="field"><label class="lbl" for="cfgUtm">Valor en el link</label><input class="inp mono" id="cfgUtm" type="text" list="cfgBases" placeholder="bj40"><datalist id="cfgBases">${bases.map(x=>`<option value="${esc(x)}">`).join('')}</datalist></div>` : '<div></div>'}
      ${t.extra ? `<div class="field full"><label class="lbl" for="cfgExtra">${t.extraL}</label><input class="inp${t.extra==='url'?' mono':''}" id="cfgExtra" type="text" placeholder="${t.ph}"></div>` : ''}
      <div class="full add-f"><p class="nota">En el link queda: <span class="mono" id="cfgPrev" style="color:var(--tinta)">…</span></p><button class="bs sec" type="button" id="cfgAdd"><span class="capa base"><span data-s="falta">Escribe un nombre</span><span data-s="listo">Agregar</span></span><span class="capa top" aria-hidden="true"><span data-s="falta">Escribe un nombre</span><span data-s="listo">Agregar</span></span></button></div>
      <div class="full" id="cfgMsg">${msg||''}</div></div>`;
  pintar($('#cfgBody'));
  const upd = () => { const n = $('#cfgNom').value; const u = $('#cfgUtm') ? sanitizeValue($('#cfgUtm').value || n) : sanitizeValue(n); $('#cfgPrev').textContent = u || '…'; bsState($('#cfgAdd'), u ? 'listo' : 'falta'); };
  $('#cfgNom').oninput = upd; if ($('#cfgUtm')) $('#cfgUtm').oninput = upd; upd(); $('#cfgAdd').onclick = () => agregar(t);
}
function agregar(t){
  const nom = $('#cfgNom').value.trim(); const box = $('#cfgMsg'); const mal = m => { box.innerHTML = `<div class="aviso bloquea">${ic('alert')}<span>${esc(m)}</span></div>`; pintar(box); };
  if (!nom) return mal(`Escribe el nombre del ${t.uno} para agregarlo.`);
  const id = sanitizeValue(nom); const utm = t.key==='modelos' ? sanitizeValue($('#cfgUtm').value || nom) : id;
  if (!id || !utm) return mal(`«${nom}» queda vacío al limpiarlo porque no tiene letras ni números.`);
  if (cat(t.key).some(x => x.id === id)) return mal(`Ya hay un ${t.uno} que queda como ${id} en el link.`);
  const it = { id, label:nom, utm, core:false, hidden:false };
  if (t.key==='concesionarios') it.cobertura = $('#cfgExtra').value.trim();
  if (t.key==='modelos'){ const r = parseURL($('#cfgExtra').value); if (!r.ok) return mal('Pon la página del modelo: es la que se autocompleta al elegirlo.'); it.url = r.url.toString(); it.group = 'Modelos'; }
  cat(t.key).push(it); store.set(LS.config, state.config); refrescar();
  cuerpoListas(`<div class="aviso">${ic('check')}<span>Agregaste ${esc(nom)}. En el link queda como ${esc(utm)}.</span></div>`); pintar($('#cfgBody'));
}
async function accionLista(accion, id){
  const items = cat(tab); const it = items.find(x=>x.id===id); if (!it) return;
  if (accion === 'ver') it.hidden = !it.hidden;
  if (accion === 'quitar'){ $('#dlgListas').close(); const ok = await confirmar({ titulo:`¿Quitar ${it.label}?`, texto:'Los links que ya generaste no cambian. Solo sale de la lista.', ok:'Quitar' }); if (ok) items.splice(items.indexOf(it),1); abrirListas(); }
  store.set(LS.config, state.config); refrescar(); cuerpoListas();
}
async function restaurar(){
  $('#dlgListas').close(); const ok = await confirmar({ titulo:'¿Restaurar los valores de fábrica?', texto:'Se borra lo que agregaste y vuelve lo que ocultaste. El historial no se toca.', ok:'Restaurar' });
  if (ok){ state.config = getDefaultConfig(); store.set(LS.config, state.config); refrescar(); }
  abrirListas(); if (ok) aviso('#cfgMsg', `<div class="aviso">${ic('check')}<span>Las listas volvieron a los valores de fábrica.</span></div>`);
}
function refrescar(){ F.conc.set(F.conc.value); F.mod.set(F.mod.value); F.pub.set(F.pub.value); condicionales(); vistaPrevia(); }

/* ============================================================ Tema */
function tema(t){ if (t === 'light') document.documentElement.setAttribute('data-theme','light'); else document.documentElement.removeAttribute('data-theme'); const claro = t === 'light'; const b = $('#btnTema'); b.innerHTML = ic(claro ? 'moon' : 'sun'); b.setAttribute('aria-label', claro ? 'Usar modo oscuro' : 'Usar modo claro'); b.title = b.getAttribute('aria-label'); pintar(b); }
function cambiarTema(){ const nx = document.documentElement.getAttribute('data-theme')==='light' ? 'dark' : 'light'; store.set(LS.theme, nx); tema(nx); }

/* ============================================================ Arranque */
function init(){
  tema(store.get(LS.theme, null));
  const on = campo => (v, como) => { if (como === 'escribe' && campo !== 'motivo' && campo !== 'pagina'){ vistaPrevia(); return; } condicionales(campo); vistaPrevia(); };
  $('#segPlat').innerHTML = segHTML('plat', PLATAFORMAS, state.prefs.plat || 'meta');
  $('#segFmt').innerHTML = segHTML('fmt', FORMATOS, '');
  F.mes  = new Pill($('#ddMes'),  { labelledby:'lMes',  placeholder:'Elige el mes', onChange:on('mes') });
  F.anio = new Pill($('#ddAnio'), { labelledby:'lAnio', placeholder:'Elige el año', onChange:on('anio') });
  F.obj  = new Pill($('#ddObj'), { labelledby:'lObj', placeholder:'Elige', onChange:on('objetivo') });
  F.conc = new Combo($('#cbConc'), { labelledby:'lConc', placeholder:'Escribe o elige', modo:'lista', grupos:()=>[{ items: visibles('concesionarios').map(c=>({ ...c, sub:c.utm })) }], onChange:on('concesionario'), crear:crearEn('concesionarios', { cobertura:'' }) });
  F.mod  = new Combo($('#cbMod'),  { labelledby:'lMod',  placeholder:'Escribe o elige', modo:'lista', grupos:gruposModelo, onChange:on('modelo'), crear:crearEn('modelos', { url:'', group:'Modelos' }) });
  F.pub  = new Combo($('#cbPub'),  { labelledby:'lPub',  placeholder:'Escribe o elige', modo:'lista', grupos:()=>[{ items: visibles('publicos').map(c=>({ ...c, sub:c.utm })) }], onChange:on('publico'), crear:crearEn('publicos') });
  F.mot  = new Combo($('#cbMot'),  { labelledby:'lMot',  placeholder:'gen', modo:'libre', mono:true, grupos:gruposMotivo, onChange:on('motivo'), limpiar:sanitizeLive });
  F.url  = new Combo($('#cbUrl'),  { labelledby:'lUrl',  placeholder:'Se llena al elegir el modelo, o pega la tuya', modo:'libre', mono:true, grupos:gruposPagina, onChange:(v, como) => { state.urlDirty = !!v.trim() && v.trim() !== state.lastAuto; condicionales('pagina'); vistaPrevia(); } });
  F.hPer = new Pill($('#ddHPer'), { labelledby:'tHist', placeholder:'Todos los meses', onChange:()=>historial() });
  F.hConc= new Pill($('#ddHConc'),{ labelledby:'tHist', placeholder:'Todos los concesionarios', onChange:()=>historial() });
  const now = limaNow(), pf = state.prefs;
  F.mes.setGroups([{ items: mesesItems() }], String(now.mes).padStart(2,'0'));
  F.anio.setGroups([{ items: aniosItems() }], String(now.anio));
  poblarObj(pf.obj || ''); F.conc.value = pf.conc || '';
  document.addEventListener('pointerdown', e => { FLOT.forEach(p => { if (p.open && !p.host.contains(e.target)) p.close(false); }); });

  const form = $('#form');
  form.addEventListener('change', e => { if (e.target.name === 'plat') poblarObj(); if (['plat','fmt'].includes(e.target.name)) { condicionales(); vistaPrevia(); } });
  $('#fVer').addEventListener('input', e => { const v = e.target.value.replace(/\D/g,'').slice(0,2); if (v !== e.target.value) e.target.value = v; vistaPrevia(); });
  form.addEventListener('submit', e => e.preventDefault());
  $('#btnRestaurar').addEventListener('click', () => { const m = byId('modelos', F.mod.value); if (m){ F.url.value = m.url; state.lastAuto = m.url; state.urlDirty = false; condicionales(); vistaPrevia(); } });

  $('#btnGen').addEventListener('click', generar); $('#btnNueva').addEventListener('click', nuevaPieza);
  document.addEventListener('keydown', e => { if ((e.ctrlKey||e.metaKey) && e.key === 'Enter'){ e.preventDefault(); FLOT.forEach(p=>p.open&&p.close(false)); if (document.activeElement?.blur) document.activeElement.blur(); generar(); } });

  $('#hBuscar').addEventListener('input', () => historial());
  $('#hBody').addEventListener('click', async e => {
    const x = e.target.closest('button[data-act]'); if (!x) return; const h = state.history.find(y=>y.id===x.dataset.id); if (!h) return;
    if (x.dataset.act === 'copy'){ const ok = await copiar(h.urlFinal); bsState(x, 'hecho', ok ? {} : { hecho:'No se pudo' }); setTimeout(()=>bsState(x,'listo'), 1800); }
    if (x.dataset.act === 'base'){ bsState(x,'hecho'); setTimeout(()=>bsState(x,'listo'), 1800); usarDeBase(h); }
    if (x.dataset.act === 'del'){ if (await confirmar({ titulo:'¿Quitar este link del historial?', texto:`${h.labels.conc}, ${h.labels.modelo}. El link sigue funcionando donde ya lo pegaste; solo sale de esta lista.`, ok:'Quitar' })){ state.history = state.history.filter(y=>y.id!==h.id); store.set(LS.history, state.history); historial(); } }
  });
  $('#btnCsv').addEventListener('click', csv); $('#btnXlsx').addEventListener('click', xlsx);
  $('#btnVaciar').addEventListener('click', async () => { const n = state.history.length; if (await confirmar({ titulo:'¿Vaciar todo el historial?', texto: n===1 ? 'Se borra el único link de esta lista. Si lo necesitas, descárgalo primero.' : `Se borran los ${n} links de esta lista. Si los necesitas, descárgalos primero.`, ok:'Vaciar', escribir:true })){ state.history = []; store.set(LS.history, state.history); historial(); } });
  $('#btnAyuda').addEventListener('click', () => $('#dlgAyuda').showModal());
  $('#btnListas').addEventListener('click', abrirListas);
  $('#btnTema').addEventListener('click', cambiarTema);
  $('#segListas').addEventListener('change', e => { tab = e.target.value; cuerpoListas(); });
  $('#cfgBody').addEventListener('click', e => { const x = e.target.closest('[data-cfg]'); if (x) accionLista(x.dataset.cfg, x.dataset.id); });
  $('#cfgReset').addEventListener('click', restaurar);
  $$('dialog [data-cerrar]').forEach(x => x.addEventListener('click', () => x.closest('dialog').close()));
  bsState($('#btnCsv'),'listo'); bsState($('#btnXlsx'),'listo');
  pintar(); condicionales(); vistaPrevia(); historial();
  window.linky = { F, state };
}
document.addEventListener('DOMContentLoaded', init);
