/* Linky BAIC · catálogo
   Constantes y valores de fábrica. Si cambias un valor de fábrica, sube CONFIG_VERSION. */
"use strict";

/* ============================================================ Catálogos */
const CONFIG_VERSION = 1;
const LS = { config:'linky_baic_config', history:'linky_baic_history', prefs:'linky_baic_prefs', theme:'linky_baic_theme' };
const MEDIUM = 'paid_social';
const UTM_KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Setiembre','Octubre','Noviembre','Diciembre'];
const MES3 = ['ene','feb','mar','abr','may','jun','jul','ago','set','oct','nov','dic'];
const PLATAFORMAS = [ { id:'meta', label:'Meta', utm:'facebook', sugeridos:['leads','trafico'] }, { id:'tiktok', label:'TikTok', utm:'tiktok', sugeridos:['leads','reproducciones'] } ];
const OBJETIVOS = [ { id:'leads', label:'Leads', utm:'leads' }, { id:'trafico', label:'Tráfico', utm:'trafico' }, { id:'reproducciones', label:'Reproducciones', utm:'reproducciones' }, { id:'conversiones', label:'Conversiones', utm:'conversiones' }, { id:'interacciones', label:'Interacciones', utm:'interacciones' }, { id:'alcance', label:'Alcance', utm:'alcance' } ];
const FORMATOS = [ { id:'ppa', label:'PPA', utm:'ppa', video:false }, { id:'ppv', label:'PPV', utm:'ppv', video:true }, { id:'car', label:'CAR', utm:'car', video:false } ];
const SOLO_VIDEO = new Set(['reproducciones']);

function getDefaultConfig(){
  const c = (id,label,utm,cob) => ({ id, label, utm, cobertura:cob, core:true, hidden:false });
  const m = (id,label,utm,url,group='Modelos') => ({ id, label, utm, url, group, core:true, hidden:false });
  const s = (id,label) => ({ id, label, utm:id, core:true, hidden:false });
  return { version: CONFIG_VERSION, catalogs: {
    concesionarios: [ c('generico','Genérico','generico','Arequipa, Piura, Trujillo, Chiclayo, Chimbote, Huaraz, Cajamarca'), c('aion_zual_satelital','Lima: Aion + Zual + Satelital','aion_zual_satelital','Lima, Callao'), c('aion','Aion','aion','Lima'), c('satelital','Satelital','satelital','Lima, Callao'), c('zual','Zual','zual','Chimbote, Huaraz'), c('sanantonio','San Antonio','sanantonio','Chiclayo, Piura'), c('bmotors','Bmotors','bmotors','Trujillo'), c('incamotors','Incamotors','incamotors','Arequipa'), c('msa','MSA','msa','Cajamarca'), c('nacional','Nacional','nacional','Las 9 ciudades') ],
    modelos: [ m('u5','U5 Plus','u5','https://baic.pe/modelos/u5-plus'), m('x35','X35','x35','https://baic.pe/modelos/x35'), m('x55','X55','x55','https://baic.pe/modelos/x55'), m('x7','X7','x7','https://baic.pe/modelos/x7'), m('bj30','BJ30 Gasolina','bj30','https://baic.pe/modelos/bj30'), m('bj30_hev','BJ30 HEV','bj30','https://baic.pe/modelos/bj30-hev'), m('bj40','BJ40','bj40','https://baic.pe/modelos/bj40'), m('bj40_pro','BJ40 PRO','bj40','https://baic.pe/modelos/bj40-pro'), m('bj60','BJ60','bj60','https://baic.pe/modelos/bj60'), m('gama','Toda la gama','gama','https://baic.pe/modelos','Sin modelo específico'), m('marca','Marca','marca','https://baic.pe/','Sin modelo específico') ],
    mensajes: [ s('gen','Sin motivo propio'), s('bono','Bono'), s('beneficio','Beneficio') ],
    publicos: [ s('int','Intereses'), s('bbdd','Base de datos'), s('lal','Lookalike'), s('int_bbdd','Intereses + base de datos'), s('advantage','Advantage+'), s('rmkt','Remarketing') ]
  }};
}
