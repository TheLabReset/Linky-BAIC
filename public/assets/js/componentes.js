/* Linky BAIC · componentes
   Íconos, botón-estado, desplegable de píldora y campo que se escribe y sugiere. */
"use strict";

const ICONS = {
  help:'<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', chev:'<path d="m6 9 6 6 6-6"/>', check:'<path d="M20 6 9 17l-5-5"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  alert:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>'
};
function pintar(root=document){ root.querySelectorAll('svg[data-i]').forEach(s=>{ s.setAttribute('viewBox','0 0 24 24'); s.setAttribute('fill','none'); s.setAttribute('stroke','currentColor'); s.setAttribute('stroke-width','2'); s.setAttribute('stroke-linecap','round'); s.setAttribute('stroke-linejoin','round'); s.setAttribute('aria-hidden','true'); s.innerHTML = ICONS[s.dataset.i] || ''; }); }
const ic = (n, cls='') => `<svg data-i="${n}"${cls?` class="${cls}"`:''}></svg>`;

/* ============================================================ Botón-estado */
function bsState(btn, estado, textos = {}){
  btn.classList.remove('falta','listo','hecho','trabaja'); btn.classList.add(estado);
  for (const [k,v] of Object.entries(textos)) btn.querySelectorAll(`[data-s="${k}"]`).forEach(s => s.textContent = v);
  btn.querySelectorAll('.capa > span').forEach(s => s.style.visibility = s.dataset.s === estado ? 'visible' : 'hidden');
  btn.setAttribute('aria-disabled', estado === 'falta' || estado === 'trabaja' ? 'true' : 'false');
  const vis = btn.querySelector(`.base [data-s="${estado}"]`); if (vis) btn.setAttribute('aria-label', vis.textContent);
}

/* ============================================================ Lista flotante compartida */
function renderOpciones(list, prefix, groups, selected, extra){
  let n = 0;
  const html = groups.filter(g=>g.items.length).map(g => `${g.label?`<div class="dd-g" role="presentation">${esc(g.label)}</div>`:''}${g.items.map(it => `<div class="dd-o" role="option" id="${prefix}-o${n++}" data-v="${esc(it.id)}" aria-selected="${it.id===selected}" ${it.disabled?'aria-disabled="true"':''}><span class="ol"><span>${esc(it.label)}</span>${it.sub?`<span class="os">${esc(it.sub)}</span>`:''}</span>${ic('check')}</div>`).join('')}`).join('');
  const nuevo = extra ? `<div class="dd-o nuevo" role="option" id="${prefix}-o${n++}" data-new="1"><span class="ol"><span>${esc(extra.label)}</span>${extra.sub?`<span class="os">${esc(extra.sub)}</span>`:''}</span>${ic('plus')}</div>` : '';
  list.innerHTML = (html + nuevo) || `<div class="dd-vacio">Nada coincide.</div>`;
  pintar(list);
}
function moverAct(ctx, d){
  const os = ctx.opts(); if (!os.length) return; let i = ctx.act;
  for (let k=0; k<os.length; k++){ i = (i + d + os.length) % os.length; if (os[i].getAttribute('aria-disabled')!=='true'){ ctx.setAct(i); return; } }
}

/* ============================================================ Desplegable píldora (lista cerrada) */
class Pill {
  constructor(host, { labelledby, placeholder, onChange }){
    this.host = host; this.ph = placeholder; this.onChange = onChange; this.groups = []; this._v = ''; this.act = -1; this.buf=''; this.bufT=0;
    const id = host.id;
    host.innerHTML = `<button type="button" class="dd-btn press" aria-haspopup="listbox" aria-expanded="false" id="${id}-b" aria-labelledby="${labelledby} ${id}-b"><span class="v ph"></span>${ic('chev','chev')}</button><div class="dd-list" role="listbox" tabindex="-1" id="${id}-l" aria-labelledby="${labelledby}" hidden></div>`;
    this.btn = host.querySelector('.dd-btn'); this.list = host.querySelector('.dd-list'); pintar(host);
    this.btn.addEventListener('click', () => this.open ? this.close(true) : this.show());
    this.btn.addEventListener('keydown', e => { if (['ArrowDown','ArrowUp','Enter',' '].includes(e.key)){ e.preventDefault(); this.show(); } });
    this.list.addEventListener('keydown', e => this.key(e));
    this.list.addEventListener('click', e => { const o = e.target.closest('.dd-o'); if (o && o.getAttribute('aria-disabled')!=='true') this.pick(o.dataset.v); });
    this.list.addEventListener('mousemove', e => { const o = e.target.closest('.dd-o'); if (o){ const i = this.opts().indexOf(o); if (i !== this.act) this.setAct(i, false); } });
    document.addEventListener('pointerdown', e => { if (this.open && !host.contains(e.target)) this.close(false); });
    this.list.addEventListener('focusout', e => { if (this.open && !host.contains(e.relatedTarget)) this.close(false); });
    FLOT.push(this);
  }
  get open(){ return !this.list.hidden; }
  get value(){ return this._v; }
  set value(v){ this._v = this.has(v) ? v : ''; this.renderBtn(); }
  items(){ return this.groups.flatMap(g => g.items); }
  has(v){ return !!v && this.items().some(i => i.id === v); }
  label(v){ const it = this.items().find(i=>i.id===v); return it ? it.label : ''; }
  setGroups(groups, keep = this._v){ this.groups = groups; this._v = this.has(keep) ? keep : ''; this.renderBtn(); }
  renderBtn(){ const s = this.btn.querySelector('.v'); const l = this.label(this._v); s.textContent = l || this.ph; s.classList.toggle('ph', !l); }
  opts(){ return Array.from(this.list.querySelectorAll('.dd-o')); }
  setAct(i, scroll=true){ const os = this.opts(); os.forEach(o=>o.classList.remove('act')); this.act = i; if (os[i]){ os[i].classList.add('act'); this.list.setAttribute('aria-activedescendant', os[i].id); if (scroll) os[i].scrollIntoView({ block:'nearest' }); } }
  show(){ cerrarOtros(this); renderOpciones(this.list, this.host.id, this.groups, this._v); this.list.hidden = false; this.btn.setAttribute('aria-expanded','true'); ubicar(this.btn, this.list);
    const os = this.opts(); let i = os.findIndex(o => o.dataset.v === this._v); if (i < 0) i = 0; this.setAct(i); this.list.focus({ preventScroll:true }); }
  close(focus){ this.list.hidden = true; this.btn.setAttribute('aria-expanded','false'); if (focus) this.btn.focus(); }
  key(e){
    const os = this.opts();
    if (e.key==='ArrowDown'){ e.preventDefault(); moverAct(this,1); } else if (e.key==='ArrowUp'){ e.preventDefault(); moverAct(this,-1); }
    else if (e.key==='Enter'||e.key===' '){ e.preventDefault(); const o = os[this.act]; if (o && o.getAttribute('aria-disabled')!=='true') this.pick(o.dataset.v); }
    else if (e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); this.close(true); } else if (e.key==='Tab'){ this.close(false); }
    else if (e.key.length===1 && /\S/.test(e.key)){ clearTimeout(this.bufT); this.buf += e.key.toLowerCase(); this.bufT = setTimeout(()=>this.buf='',600); const i = os.findIndex(o => norm(o.textContent).startsWith(norm(this.buf))); if (i>-1) this.setAct(i); }
  }
  pick(v){ const ch = v !== this._v; this._v = v; this.renderBtn(); this.close(true); if (ch && this.onChange) this.onChange(v); }
}

/* ============================================================ Campo que se escribe y sugiere
   modo 'lista': el valor es un ítem del catálogo; si no existe, ofrece agregarlo.
   modo 'libre': el valor es el texto; la lista solo sugiere. */
class Combo {
  constructor(host, { labelledby, placeholder, modo, mono=false, grupos, onChange, crear, limpiar }){
    Object.assign(this, { host, modo, grupos, onChange, crear, limpiar }); this._v = ''; this.act = -1; this.suelto = '';
    const id = host.id;
    host.innerHTML = `<input class="inp${mono?' mono':''}" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-l" id="${id}-i" aria-labelledby="${labelledby}" placeholder="${esc(placeholder)}" spellcheck="false" autocomplete="off"><button type="button" class="combo-tog" tabindex="-1" aria-label="Ver opciones">${ic('chev','chev')}</button><div class="dd-list" role="listbox" id="${id}-l" aria-labelledby="${labelledby}" hidden></div>`;
    this.inp = host.querySelector('input'); this.list = host.querySelector('.dd-list'); pintar(host);
    this.inp.addEventListener('focus', () => this.show(false));
    this.inp.addEventListener('click', () => { if (!this.open) this.show(false); });
    this.inp.addEventListener('input', () => {
      if (this.limpiar){ const p = this.inp.selectionStart, a = this.inp.value.length; const v = this.limpiar(this.inp.value); if (v !== this.inp.value){ this.inp.value = v; const np = Math.max(0, p - (a - v.length)); this.inp.setSelectionRange(np, np); } }
      if (this.modo === 'libre') this.set(this.inp.value, true);
      else { this.suelto = this.inp.value; if (this._v && this.inp.value !== this.labelDe(this._v)){ this._v = ''; this.onChange && this.onChange('', 'escribe'); } }
      this.show(true);
    });
    this.inp.addEventListener('keydown', e => this.key(e));
    host.querySelector('.combo-tog').addEventListener('pointerdown', e => { e.preventDefault(); if (this.open) this.close(); else { this.inp.focus(); this.show(false); } });
    this.list.addEventListener('pointerdown', e => e.preventDefault());
    this.list.addEventListener('click', e => { const o = e.target.closest('.dd-o'); if (o) this.elegir(o); });
    this.list.addEventListener('mousemove', e => { const o = e.target.closest('.dd-o'); if (o){ const i = this.opts().indexOf(o); if (i !== this.act) this.setAct(i, false); } });
    this.inp.addEventListener('blur', () => { this.close(); this.confirmar(); });
    FLOT.push(this);
  }
  get open(){ return !this.list.hidden; }
  get value(){ return this._v; }
  set value(v){ this.set(v, false); }
  items(){ return this.grupos().flatMap(g=>g.items); }
  labelDe(v){ const it = this.items().find(i=>i.id===v); return it ? it.label : ''; }
  set(v, desdeInput){
    if (this.modo === 'libre'){ this._v = v || ''; if (!desdeInput) this.inp.value = this._v; if (desdeInput && this.onChange) this.onChange(this._v, 'escribe'); return; }
    this._v = v && this.items().some(i=>i.id===v) ? v : ''; this.suelto = ''; this.inp.value = this.labelDe(this._v);
  }
  opts(){ return Array.from(this.list.querySelectorAll('.dd-o')); }
  setAct(i, scroll=true){ const os = this.opts(); os.forEach(o=>o.classList.remove('act')); this.act = i; if (os[i]){ os[i].classList.add('act'); this.inp.setAttribute('aria-activedescendant', os[i].id); if (scroll) os[i].scrollIntoView({ block:'nearest' }); } else this.inp.removeAttribute('aria-activedescendant'); }
  filtrar(){
    const q = norm(this.inp.value.trim());
    const muestra = this.modo === 'lista' && this._v && this.inp.value === this.labelDe(this._v) ? '' : q;
    const puntaje = it => { if (!muestra) return 1; const l = norm(it.label), u = norm(it.utm||it.sub||''), sm = sanitizeLive(muestra);
      if (l === muestra || u === sm) return 5; if (l.startsWith(muestra)) return 4; if (u.startsWith(sm)) return 3; if (l.split(/[\s:+]+/).some(w => w.startsWith(muestra))) return 2;
      return (l.includes(muestra) || u.includes(sm) || norm(it.id).includes(sm)) ? 1 : 0; };
    const grupos = this.grupos().map(g => ({ label:g.label, items: g.items.map(it => [it, puntaje(it)]).filter(x => x[1] > 0).sort((a,b) => b[1]-a[1]).map(x => x[0]) }));
    let extra = null;
    if (this.modo === 'lista' && this.crear && q){ const u = sanitizeValue(this.inp.value); const exacto = this.items().some(it => norm(it.label) === q || it.utm === u || it.id === u); if (u && !exacto) extra = { label:`Agregar «${this.inp.value.trim()}»`, sub:u }; }
    return { grupos, extra };
  }
  show(tipeando){
    cerrarOtros(this); const { grupos, extra } = this.filtrar();
    if (this.modo === 'libre' && !grupos.some(g=>g.items.length)){ this.close(); return; }
    renderOpciones(this.list, this.host.id, grupos, this.modo==='libre' ? '' : this._v, extra);
    this.list.hidden = false; this.inp.setAttribute('aria-expanded','true'); ubicar(this.inp, this.list);
    const os = this.opts(); let i = tipeando ? 0 : os.findIndex(o => o.dataset.v === this._v); if (i < 0 && !tipeando) i = -1; this.setAct(i);
  }
  close(){ this.list.hidden = true; this.inp.setAttribute('aria-expanded','false'); this.inp.removeAttribute('aria-activedescendant'); }
  elegir(o){
    if (o.dataset.new){ const id = this.crear(this.inp.value.trim()); if (id){ this.set(id); this.close(); this.onChange && this.onChange(id, 'crea'); } return; }
    const v = o.dataset.v;
    if (this.modo === 'libre'){ const it = this.items().find(i=>i.id===v); this._v = it ? (it.valor ?? it.id) : v; this.inp.value = this._v; }
    else this.set(v);
    this.close(); this.onChange && this.onChange(this._v, 'elige');
  }
  confirmar(){
    if (this.modo === 'libre'){ if (this.limpiar){ const v = sanitizeValue(this.inp.value); if (v !== this.inp.value){ this.inp.value = v; this._v = v; this.onChange && this.onChange(v, 'escribe'); } } return; }
    if (this._v) { this.inp.value = this.labelDe(this._v); return; }
    const q = norm(this.inp.value.trim()); if (!q){ this.suelto=''; return; }
    const u = sanitizeValue(this.inp.value);
    const hit = this.items().find(it => norm(it.label) === q || it.utm === u || it.id === u);
    if (hit){ this.set(hit.id); this.onChange && this.onChange(hit.id, 'elige'); } else { this.suelto = this.inp.value.trim(); this.onChange && this.onChange('', 'suelto'); }
  }
  key(e){
    const os = this.opts();
    if (e.key==='ArrowDown'){ e.preventDefault(); if (!this.open) this.show(false); moverAct(this,1); }
    else if (e.key==='ArrowUp'){ e.preventDefault(); if (!this.open) this.show(false); moverAct(this,-1); }
    else if (e.key==='Enter'){ if (this.open && os[this.act]){ e.preventDefault(); this.elegir(os[this.act]); } }
    else if (e.key==='Escape'){ if (this.open){ e.preventDefault(); e.stopPropagation(); this.close(); } }
    else if (e.key==='Tab'){ if (this.open && this.act >= 0 && os[this.act] && this.inp.value.trim() && !os[this.act].dataset.new) this.elegir(os[this.act]); this.close(); }
  }
}
const FLOT = [];
function cerrarOtros(yo){ FLOT.forEach(p => { if (p !== yo && p.open) p.close(false); }); }
function ubicar(ancla, list){ const r = ancla.getBoundingClientRect(); list.classList.toggle('up', window.innerHeight - r.bottom < 260 && r.top > 320); }
