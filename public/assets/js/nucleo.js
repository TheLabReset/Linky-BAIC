/* Linky BAIC · núcleo
   Almacenamiento local, utilidades y limpieza de valores para la UTM. */
"use strict";

/* ============================================================ Almacenamiento */
let storageOk = true;
const store = { get(k, fb){ try{ const v = localStorage.getItem(k); return v==null ? fb : JSON.parse(v); }catch{ return fb; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); storageOk = true; return true; }catch{ storageOk = false; return false; } } };
function loadConfig(){
  const base = getDefaultConfig(); const st = store.get(LS.config, null);
  if (!st || !st.catalogs) return base;
  if ((st.version || 0) < CONFIG_VERSION){ for (const k of Object.keys(base.catalogs)){ st.catalogs[k] = st.catalogs[k] || []; const ids = new Set(st.catalogs[k].map(x=>x.id)); base.catalogs[k].forEach(x => { if (!ids.has(x.id)) st.catalogs[k].push(x); }); } st.version = CONFIG_VERSION; store.set(LS.config, st); }
  for (const k of Object.keys(base.catalogs)) if (!st.catalogs[k]) st.catalogs[k] = base.catalogs[k];
  return st;
}

/* ============================================================ Utilidades */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function limaNow(){ const p = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit'}).formatToParts(new Date()); return { anio:Number(p.find(x=>x.type==='year').value), mes:Number(p.find(x=>x.type==='month').value) }; }
function fecha(iso){ const d = new Date(iso); return `${d.getDate()} ${MES3[d.getMonth()]}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
async function copiar(t){ try{ await navigator.clipboard.writeText(t); return true; } catch{ const a=document.createElement('textarea'); a.value=t; a.setAttribute('readonly',''); a.style.position='fixed'; a.style.opacity='0'; document.body.appendChild(a); a.select(); let ok=false; try{ ok=document.execCommand('copy'); }catch{} a.remove(); return ok; } }
/* Valor para la UTM: a-z0-9 y "_"; el "-" queda reservado como separador */
function sanitizeLive(str){ return String(str ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ñ/g,'n').replace(/[\s\-\/\\.+,;:|&·]+/g,'_').replace(/[^a-z0-9_]/g,'').replace(/_{2,}/g,'_').replace(/^_+/,''); }
const sanitizeValue = str => sanitizeLive(str).replace(/_+$/,'');
