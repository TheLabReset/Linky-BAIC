# Handoff · Linky BAIC a Netlify

Este documento es para quien despliega, humano o Claude Code. El producto está terminado y aprobado por el cliente. El trabajo es publicarlo en Netlify como sitio independiente, verificar que funcione igual que en local y dejarlo documentado.

**Regla principal: no cambies la funcionalidad ni la nomenclatura.** Si algo parece un error de la herramienta, avisa antes de corregirlo. Las reglas de las UTM se cerraron con el cliente y cualquier cambio altera links que ya están publicados en anuncios.

---

## 0. Antes de empezar, confirma con Alonso

Estas tres decisiones no están tomadas. No las asumas:

1. **Repositorio.** En qué cuenta u organización de GitHub vive el proyecto, y con qué nombre.
2. **Sitio de Netlify.** En qué equipo de Netlify se crea, y el nombre del sitio (sugerido: `linky-baic`).
3. **Dominio.** Si queda en `*.netlify.app` o va en un dominio propio. Si es propio, quién administra el DNS.

## 1. Verifica en local

```bash
node -v                              # 20 o más; el proyecto trae .nvmrc con 22
npm install
npx playwright install chromium
npm test
```

**Criterio: 14 de 14 pruebas pasan.** Si alguna falla, para acá y reporta cuál y con qué mensaje. No sigas al despliegue con pruebas en rojo.

Las pruebas fijan el reloj en setiembre de 2026, así que dan el mismo resultado cualquier día que se corran.

## 2. Sube el código

```bash
git init
git add .
git commit -m "Linky BAIC 1.0.0"
git branch -M main
git remote add origin <URL del repositorio confirmado en el paso 0>
git push -u origin main
```

`.gitignore` ya excluye `node_modules/`, `test-results/`, `playwright-report/` y `.netlify/`.

## 3. Crea el sitio en Netlify

Por la interfaz, con el repositorio conectado:

| Campo | Valor |
|---|---|
| Base directory | *(vacío)* |
| Build command | *(vacío)* |
| Publish directory | `public` |

O por la línea de comandos:

```bash
npm install -g netlify-cli
netlify login
netlify init            # crea el sitio y lo vincula al repositorio
npm run deploy          # netlify deploy --prod --dir=public
```

`netlify.toml` ya declara la carpeta de publicación, las cabeceras de seguridad y el caché. No hace falta configurarlos en la interfaz.

## 4. Verifica el sitio publicado

```bash
curl -sI https://<sitio>.netlify.app/ | grep -iE "content-security-policy|x-frame-options|x-robots-tag"
BASE_URL=https://<sitio>.netlify.app npm test
```

**Criterio:**

- Las tres cabeceras aparecen.
- Las 14 pruebas pasan también contra la URL publicada.
- Abierto a mano en Chrome y Safari, el link se arma, *Generar y copiar* pega el link en el portapapeles y *Excel* descarga un archivo que abre.

La prueba *carga limpia* falla si el navegador bloquea algo por la política de seguridad o si falta cualquier archivo. Es la que atrapa los problemas típicos de un despliegue.

## 5. Dominio propio (solo si se confirmó en el paso 0)

En Netlify: *Domain management → Add a domain*. Sigue las instrucciones de DNS que da Netlify y espera a que el certificado HTTPS quede activo. Repite el paso 4 con el dominio nuevo.

## 6. Entrega

Reporta a Alonso:

- La URL final.
- El resultado de las pruebas contra esa URL.
- El enlace al repositorio.

---

## Lo que no hay que tocar

| Qué | Dónde | Por qué |
|---|---|---|
| Estructura de las UTM | `armar()` en `app.js` | Cerrada con el cliente. Cambiarla parte el historial del reporte en dos |
| Valores de fábrica | `catalogo.js` | Son los que aprobó el cliente. Si hay que cambiar uno, sube `CONFIG_VERSION` |
| Limpieza de valores | `sanitizeLive` / `sanitizeValue` en `nucleo.js` | Garantiza que ningún link lleve mayúsculas, tildes, espacios ni `+` |
| Claves de `localStorage` | `LS` en `catalogo.js` | Si cambian, cada persona pierde su historial y su configuración |
| Tokens visuales | `:root` en `linky.css` | Vienen del brand book SiReset 3.0 |

## Tareas opcionales, no bloquean el despliegue

**SheetJS: hecho el 30 de setiembre de 2026.** La copia en `public/vendor/` pasó de la 0.18.5 (la última de npm) a la 0.20.3, descargada de `https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js` (sha256 `cc015130aa8521e7f088f88898eba949ccdcbfb38df0bd129b44b7273c3a6f41`). Eso cierra los dos avisos altos de la 0.18.5: contaminación de prototipo ([GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6), corregido en 0.19.3) y ReDoS ([GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9), corregido en 0.20.2). Linky no estaba expuesto, porque los dos se disparan al *leer* archivos y Linky solo *escribe*. Ojo: `npm audit` nunca los mostró, porque SheetJS va copiado en `public/vendor/` y no es una dependencia de npm; revisar esa carpeta a mano cuando salga una versión nueva. La licencia (Apache 2.0) no cambió.

**Caché de CSS y JS.** Hoy usan el caché por defecto de Netlify, que revalida en cada visita. Es lo seguro sin nombres con hash. Si más adelante se agrega un paso de build con hash en los nombres, ahí sí conviene caché largo.

## Limitaciones conocidas

- **Historial por navegador.** No se comparte entre personas ni entre computadoras. Es una decisión de producto (igual que el Linky de Sifrah), no un error.
- **Revisión de página.** El estado «Sin errores detectados» no garantiza que la página exista. El navegador no deja leer la respuesta de otro dominio sin permiso de ese dominio, así que solo se detectan errores cuando el servidor sí responde con permiso, o cuando no hay red.
- **Safari desde archivo local.** El copiado automático puede fallar. En el sitio publicado con HTTPS funciona; si igual falla, el botón lo dice y el link queda en el historial.
