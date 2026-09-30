# Handoff · Linky BAIC a Netlify

Este documento es para quien despliega, humano o Claude Code. El producto está terminado y aprobado por el cliente. El trabajo es publicarlo en Netlify como sitio independiente, verificar que funcione igual que en local y dejarlo documentado.

**Regla principal: no cambies la funcionalidad ni la nomenclatura.** Si algo parece un error de la herramienta, avisa antes de corregirlo. Las reglas de las UTM se cerraron con el cliente y cualquier cambio altera links que ya están publicados en anuncios.

---

## Estado al 30 de setiembre de 2026

| Qué | Estado |
|---|---|
| Repositorio | `TheLabReset/Linky-BAIC` en GitHub. El trabajo está en la rama `claude/serene-maxwell-dg7c3s`, falta llevarlo a `main` |
| Pruebas en local | 14 de 14. Las 6 pruebas negativas (mutaciones) fallan como deben |
| CI | `.github/workflows/pruebas.yml` corre las 14 pruebas en cada push y en cada PR a `main` |
| SheetJS | Actualizado a 0.20.3 (ver *Tareas opcionales*) |
| Netlify | **Sin publicar.** No había sesión de Netlify ni `NETLIFY_AUTH_TOKEN` en el entorno. Los pasos están abajo, en *Pendiente para una persona* |
| Dominio | `*.netlify.app`. No se configuró dominio propio ni DNS |

## 0. Decisiones tomadas

1. **Repositorio.** `TheLabReset/Linky-BAIC`.
2. **Sitio de Netlify.** Nombre `linky-baic`. Si está tomado, `linky-baic-reset`. El equipo de Netlify lo elige quien despliega.
3. **Dominio.** `*.netlify.app`. Un dominio propio necesita instrucción explícita (paso 5).

## 1. Verifica en local

```bash
node -v                              # 20 o más; el proyecto trae .nvmrc con 22
npm ci
npx playwright install chromium
npm test
```

**Criterio: 14 de 14 pruebas pasan.** Si alguna falla, para acá y reporta cuál y con qué mensaje. No sigas al despliegue con pruebas en rojo.

Las pruebas fijan el reloj en setiembre de 2026, así que dan el mismo resultado cualquier día que se corran.

## 2. El código

Ya está en `TheLabReset/Linky-BAIC`. `.gitignore` excluye `node_modules/`, `test-results/`, `playwright-report/` y `.netlify/`. Antes de publicar, lleva la rama de trabajo a `main` con un pull request y espera a que el flujo *Pruebas* quede en verde.

## 3. Publica en Netlify

`netlify.toml` ya declara la carpeta de publicación (`public`), las cabeceras de seguridad y el caché. No hace falta configurarlos en la interfaz. No hay comando de build.

Con la línea de comandos (probado con netlify-cli 27.10.2), desde la raíz del repositorio y en `main`:

```bash
npm install -g netlify-cli
netlify login                                   # o exporta NETLIFY_AUTH_TOKEN
netlify sites:create --name linky-baic          # si está tomado: --name linky-baic-reset
                                                # con varios equipos, agrega --account-slug <equipo>
netlify link --id <site-id que imprime el paso anterior>   # sites:create ya vincula; esto lo confirma
netlify status                                  # debe mostrar tu cuenta y el sitio

# Primero un borrador, que no toca producción
netlify deploy --dir=public --json              # copia el "deploy_url"
scripts/verificar-despliegue.sh <deploy_url>    # debe terminar en "== TODO OK"

# Solo si el borrador dio TODO OK
netlify deploy --prod --dir=public --json       # copia el "url"
scripts/verificar-despliegue.sh https://linky-baic.netlify.app
```

`scripts/verificar-despliegue.sh` revisa las seis cabeceras de seguridad, el caché largo de `/vendor/` y `/assets/fonts/`, y corre las 14 pruebas contra la URL (`BASE_URL=<url> npx playwright test`). Si algo falla, sale con código 1 y dice «HAY FALLAS: no publiques». El caché solo sale bien en Netlify: el servidor local de pruebas (`tests/server.mjs`) no aplica `Cache-Control`.

## 4. Verifica el sitio publicado

**Criterio:**

- `scripts/verificar-despliegue.sh <url>` termina en `== TODO OK`.
- Abierto a mano en Chrome y Safari, el link se arma, *Generar y copiar* pega el link en el portapapeles y *Excel* descarga un archivo que abre.

La prueba *carga limpia* falla si el navegador bloquea algo por la política de seguridad o si falta un archivo de los que se cargan al abrir la página. `vendor/xlsx.full.min.js` se carga recién al exportar, así que si falta, la que falla es *Excel se arma con la librería local*. Entre las dos atrapan los problemas típicos de un despliegue.

### Volver atrás

- **Interfaz:** en Netlify, *Deploys*, elige el deploy anterior y usa *Publish deploy*.
- **Línea de comandos:** netlify-cli 27.10.2 no trae un comando de restauración propio, pero `netlify api --list` sí muestra el método `restoreSiteDeploy` de la API. Lo confirmé en la lista y no lo ejecuté:

```bash
netlify api listSiteDeploys --data '{"site_id":"<site-id>"}'            # busca el id del deploy anterior
netlify api restoreSiteDeploy --data '{"site_id":"<site-id>","deploy_id":"<deploy-id>"}'
```

Después de volver atrás, corre de nuevo `scripts/verificar-despliegue.sh` contra la URL de producción.

## 5. Dominio propio (solo con instrucción explícita)

En Netlify: *Domain management → Add a domain*. Sigue las instrucciones de DNS que da Netlify y espera a que el certificado HTTPS quede activo. Repite el paso 4 con el dominio nuevo.

## 6. Entrega

Reporta a Alonso:

- La URL final.
- El resultado de las pruebas contra esa URL.
- El enlace al repositorio.

## Pendiente para una persona

1. **Publicar.** Sigue el paso 3. Quedó sin hacer porque este entorno no tenía credenciales de Netlify.
2. **Despliegue continuo.** Se configura solo desde la interfaz: *Add new site → Import an existing project → GitHub → TheLabReset/Linky-BAIC*, rama `main`, Base directory vacío, Build command vacío, Publish directory `public`. Si el sitio ya existe por el paso 3: *Site configuration → Build & deploy → Continuous deployment → Link repository*. Luego haz un push chico a `main` y confirma que aparece un deploy nuevo en *Deploys*.
3. **Tag de versión.** Cuando producción dé TODO OK: `git tag -a v1.0.0 -m "Linky BAIC 1.0.0 en producción" && git push origin v1.0.0`.
4. **Registrar la URL real.** Reemplaza `https://linky-baic.netlify.app` en este documento, en `README.md` y en `CHANGELOG.md` si el nombre final fue otro.

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

**Caché de CSS y JS.** Los archivos de `assets/css` y `assets/js` usan el caché por defecto de Netlify, que revalida en cada visita. Es lo seguro sin nombres con hash. Si más adelante se agrega un paso de build con hash en los nombres, ahí sí conviene caché largo.

**Caché de `vendor/`: cuidado al actualizar.** `netlify.toml` le da a `/vendor/*` un caché `immutable` de un año, y el archivo no lleva la versión en el nombre. Si se reemplaza `vendor/xlsx.full.min.js` después de publicar, los navegadores que ya lo tengan en caché siguen usando el viejo hasta un año. En la próxima actualización, publica el archivo con otro nombre (por ejemplo `vendor/xlsx-0.20.4.full.min.js`) y cambia la ruta donde se carga. La 0.18.5 nunca se publicó, así que el cambio a 0.20.3 no tiene este problema.

## Pruebas negativas (30 de setiembre de 2026)

Cada mutación se aplicó sola, se corrió la prueba indicada, falló, y se revirtió. Después, `npm test` volvió a 14 de 14.

| Mutación | Prueba que falló |
|---|---|
| `<script>console.log(1)</script>` antes de `</body>` | *carga limpia* (línea 36, CSP) |
| `utm_medium:MEDIUM` → `'social'` en `armar()` | *armado del link* (línea 63) |
| Quitar `.toLowerCase()` en `sanitizeLive` | *motivo libre* (línea 78) |
| Borrar `bebas-neue-latin.woff2` | *carga limpia* (línea 36) |
| Borrar `bsState(...btnCsv/btnXlsx...)` | *sistema visual* (línea 209) |
| URL de BJ40 PRO → `bj40-pro-x` | *armado del link* (línea 59) |

La revisión adversarial encontró cuatro mutaciones que **no** hacen fallar ninguna prueba. Son huecos de cobertura, no errores del producto:

- Plataforma fija en `'meta'`: *recuerda plataforma…* no elige TikTok.
- Excel con la hoja vacía: *Excel se arma…* solo revisa que el archivo empiece con `PK`.
- *Ocultar* que borra en vez de ocultar: *listas…* nunca aprieta el botón.
- Falta `vendor/xlsx.full.min.js`: *carga limpia* no lo carga (sí lo atrapa *Excel*).

## Limitaciones conocidas

- **Historial por navegador.** No se comparte entre personas ni entre computadoras. Es una decisión de producto (igual que el Linky de Sifrah), no un error.
- **Revisión de página.** El estado «Sin errores detectados» no garantiza que la página exista. El navegador no deja leer la respuesta de otro dominio sin permiso de ese dominio, así que solo se detectan errores cuando el servidor sí responde con permiso, o cuando no hay red.
- **Nombre del CSV y del Excel en UTC.** El archivo se llama con la fecha UTC (`app.js`, `hoy()`), así que desde las 19:00 de Lima sale con la fecha del día siguiente. El periodo de las UTM sí usa la hora de Lima.
- **Limpieza de UTM viejas.** Solo se reemplazan las seis claves `utm_*` exactas en minúscula. Sobreviven variantes como `UTM_SOURCE` o `utm_source_platform` si ya venían en el enlace de destino.
- **Safari desde archivo local.** El copiado automático puede fallar. En el sitio publicado con HTTPS funciona; si igual falla, el botón lo dice y el link queda en el historial.
