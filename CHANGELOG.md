# Cambios

## 1.0.0 · publicado · 30 de setiembre de 2026

En https://linky-baic.netlify.app, con publicación automática desde `main`. Sin cambios de comportamiento respecto de lo aprobado.

- `scripts/verificar-despliegue.sh` compara el caché sin espacios (Netlify los quita) y avisa si Netlify inyecta el badge «Powered by Netlify».

- CI: `.github/workflows/pruebas.yml` corre las 14 pruebas en cada push y en cada PR a `main`, y sube el reporte si fallan.
- Dependabot semanal para npm y GitHub Actions.
- SheetJS 0.18.5 → 0.20.3, desde `cdn.sheetjs.com`. Cierra GHSA-4r6h-8v6p-xvw6 y GHSA-5pgg-2g8v-p4x9.
- `scripts/verificar-despliegue.sh`: cabeceras, caché y pruebas contra una URL publicada.
- Documentación: pasos de despliegue y de vuelta atrás, pruebas negativas y limitaciones que encontró la revisión.

## 1.0.0 · 30 de setiembre de 2026

Primera versión para producción, aprobada por el cliente.

- Nomenclatura: 4 parámetros, catálogos de 10 concesionarios, 11 modelos, 6 objetivos, 3 formatos, 6 públicos y motivo libre.
- Campos que se escriben y filtran por relevancia, con «Agregar» en la misma lista.
- Link final que se arma en vivo y muestra lo que falta como huecos.
- Mes y año separados; el rango de años se recalcula solo.
- Orden de campos: plataforma sola, mes y año juntos, concesionario solo, y el resto en grilla de tres.
- Detección de duplicados con versión automática (`-v2`, `-v3`…).
- Historial con búsqueda, filtros, *Usar de base* y descarga en CSV y Excel.
- Sistema visual SiReset 3.0 con el acento de Linky, modo oscuro y claro.
- Publicable en Netlify con cabeceras de seguridad; 14 pruebas de aceptación.
