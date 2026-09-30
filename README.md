# Linky BAIC

Herramienta para armar los links etiquetados (UTM) de la pauta de BAIC en Meta y TikTok. La persona elige o escribe los campos, el link se arma en vivo, se copia con un clic y queda en un historial descargable.

Hecha por The Lab (Reset) sobre el sistema visual SiReset 3.0, con el acento del módulo Linky (`#2E8BFF`). Aprobada por el cliente el 30 de setiembre de 2026.

---

## Uso local

Es un sitio estático: HTML, CSS y JavaScript sin paso de build.

```bash
npm install
npx playwright install chromium   # solo la primera vez, para las pruebas
npm run dev                       # http://localhost:4173
npm test                          # 14 pruebas de aceptación
```

`npm run dev` levanta el sitio con las mismas cabeceras de seguridad que Netlify. Abrir `public/index.html` con doble clic también funciona, pero sin esas cabeceras.

## Estructura

```
linky-baic/
├── public/                      ← lo que se publica
│   ├── index.html
│   ├── favicon.svg
│   ├── assets/
│   │   ├── css/fonts.css        ← @font-face de las fuentes locales
│   │   ├── css/linky.css        ← tokens SiReset 3.0 y componentes
│   │   ├── fonts/               ← Bebas Neue y Montserrat, subconjunto latino
│   │   └── js/
│   │       ├── catalogo.js      ← valores de fábrica: concesionarios, modelos, etc.
│   │       ├── nucleo.js        ← almacenamiento, utilidades, limpieza de valores
│   │       ├── componentes.js   ← botón-estado, desplegable y campo con sugerencias
│   │       └── app.js           ← armado del link, reglas, historial, descargas
│   └── vendor/xlsx.full.min.js  ← SheetJS, se carga solo al descargar Excel
├── tests/
│   ├── linky.spec.js            ← pruebas de aceptación (Playwright)
│   └── server.mjs               ← servidor local con las cabeceras de netlify.toml
├── docs/
│   ├── nomenclatura.md          ← la regla de las UTM y los catálogos
│   └── decisiones.md            ← qué se decidió, quién y por qué
├── netlify.toml                 ← publicación, cabeceras de seguridad y caché
├── HANDOFF.md                   ← plan de despliegue para Claude Code
└── CHANGELOG.md
```

Los cuatro archivos de `js/` son scripts clásicos que se cargan en orden con `defer` y comparten el ámbito global. No hay módulos ni dependencias en tiempo de ejecución, salvo SheetJS al exportar a Excel.

## Cambiar un catálogo

Los valores de fábrica viven en `public/assets/js/catalogo.js`, dentro de `getDefaultConfig()`.

1. Agrega, cambia o quita el valor.
2. **Sube `CONFIG_VERSION` en uno.** Sin eso, quien ya abrió la herramienta nunca ve el cambio, porque su configuración vive en su navegador.
3. Corre `npm test`.

La migración agrega los valores de fábrica nuevos y conserva lo que cada persona agregó por su cuenta. No borra valores que se quitaron de fábrica: si hay que retirar uno, ocúltalo (`hidden: true`) en vez de borrarlo.

## Dónde se guardan los datos

Todo queda en el `localStorage` del navegador de cada persona: la configuración (`linky_baic_config`), el historial (`linky_baic_history`), las preferencias (`linky_baic_prefs`) y el tema (`linky_baic_theme`). No hay servidor ni base de datos.

Dos consecuencias que hay que saber:

- El historial es por navegador y por dirección web. Lo generado en el archivo de prueba no aparece en el sitio publicado, y si alguien borra los datos de su navegador, pierde su historial. La mitigación es descargar el CSV o el Excel seguido.
- Lo que una persona agrega con «Agregar» solo existe en su navegador.

## Despliegue

Ver [HANDOFF.md](HANDOFF.md). En corto: Netlify, carpeta de publicación `public`, sin comando de build.

## Créditos

- Fuentes Bebas Neue y Montserrat, licencia SIL Open Font License 1.1.
- SheetJS Community Edition 0.18.5, licencia Apache 2.0 (`public/vendor/LICENSE-sheetjs.txt`).
