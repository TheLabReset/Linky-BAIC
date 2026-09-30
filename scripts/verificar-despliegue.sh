#!/usr/bin/env bash
# Verifica un despliegue de Linky BAIC (borrador o producción).
# Uso: scripts/verificar-despliegue.sh https://<sitio>.netlify.app
# Sale con código distinto de 0 si falta una cabecera, el caché no es el esperado o falla una prueba.
set -euo pipefail
URL="${1:?Uso: $0 <url del despliegue>}"
URL="${URL%/}"
fallas=0

echo "== Cabeceras de seguridad en $URL/"
cab="$(curl -sSI "$URL/")"
for h in Content-Security-Policy X-Frame-Options X-Content-Type-Options Referrer-Policy Permissions-Policy X-Robots-Tag; do
  if linea="$(grep -i "^$h:" <<<"$cab")"; then echo "  ok  ${linea%$'\r'}"; else echo "  FALTA $h"; fallas=1; fi
done

echo "== Caché largo de fuentes y SheetJS"
for ruta in /vendor/xlsx.full.min.js /assets/fonts/bebas-neue-latin.woff2 /assets/fonts/montserrat-latin-var.woff2; do
  cc="$(curl -sSI "$URL$ruta" | grep -i '^cache-control:' | tr -d '\r' || true)"
  # Netlify quita los espacios (public,max-age=...); se comparan sin espacios.
  if grep -qi 'public,max-age=31536000,immutable' <<<"${cc// /}"; then echo "  ok  $ruta"; else echo "  MAL $ruta -> ${cc:-sin Cache-Control}"; fallas=1; fi
done

echo "== Nada inyectado por Netlify en la página"
if curl -sS "$URL/" | grep -q '/.netlify/scripts/'; then
  echo "  MAL Netlify inyecta un script (badge «Powered by Netlify»). La CSP lo bloquea y «carga limpia» falla."
  echo "      Apágalo en Netlify: Project configuration > General > Powered by Netlify badge. No hace falta redeploy."
  fallas=1
else echo "  ok  sin scripts inyectados"; fi

echo "== Pruebas de aceptación contra $URL"
BASE_URL="$URL" npx playwright test || fallas=1

[ "$fallas" -eq 0 ] && echo "== TODO OK" || { echo "== HAY FALLAS: no publiques"; exit 1; }
