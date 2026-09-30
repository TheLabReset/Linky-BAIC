# Nomenclatura UTM de BAIC

La regla que arma Linky. Aprobada por el cliente (Propuesta 1: el reporte se ordena por concesionario).

## Estructura

```
utm_source   = facebook | tiktok
utm_medium   = paid_social
utm_campaign = baic-{aaaamm}-{concesionario}-{objetivo}
utm_content  = {modelo}-{motivo}-{formato}-{público}[-v{n}]
```

No se usan `utm_term` ni `utm_id`. Google Ads no pasa por Linky porque se etiqueta solo (auto-tagging).

**Por qué `paid_social`:** Analytics clasifica una visita como *Paid Social* cuando el source es una red social y el medium empieza con `paid`. Con `facebook` o `tiktok` más `paid_social`, la pauta cae en su canal sin configurar nada en Analytics.

## Reglas de forma

- Todo en minúscula, solo `a-z`, `0-9`, `-` y `_`. Sin tildes, ñ, espacios ni `+`.
- El guion medio `-` separa campos y nunca va dentro de un valor. El guion bajo `_` sí puede ir dentro de un valor (`int_bbdd`, `aion_zual_satelital`). Así el link se lee por posición: el tercer bloque del campaign es siempre el concesionario y el primero del content es siempre el modelo.
- El periodo va como `aaaamm` (`202609`): se ordena solo y no se confunde entre años.
- Si no hay motivo propio, va `gen`. Nunca queda vacío, porque un campo vacío deja un doble guion y corre la lectura por posición.
- La versión solo aparece desde `v2`. Una pieza sin versión es la `v1`.
- Si el link de destino ya trae UTM, se borran y se reemplazan. Los demás parámetros y el `#fragmento` se conservan.

## Catálogos de fábrica

### Concesionario

| En la lista | En el link | Cobertura |
|---|---|---|
| Genérico | `generico` | Arequipa, Piura, Trujillo, Chiclayo, Chimbote, Huaraz, Cajamarca |
| Lima: Aion + Zual + Satelital | `aion_zual_satelital` | Lima, Callao |
| Aion | `aion` | Lima |
| Satelital | `satelital` | Lima, Callao |
| Zual | `zual` | Chimbote, Huaraz |
| San Antonio | `sanantonio` | Chiclayo, Piura |
| Bmotors | `bmotors` | Trujillo |
| Incamotors | `incamotors` | Arequipa |
| MSA | `msa` | Cajamarca |
| Nacional | `nacional` | Las 9 ciudades |

La cobertura se muestra en pantalla y viaja al Excel, pero no va en el link: Analytics ya reporta la ciudad real de cada visita.

### Modelo

En el link va el nombre base; la página es la de la versión elegida.

| En la lista | En el link | Página |
|---|---|---|
| U5 Plus | `u5` | https://baic.pe/modelos/u5-plus |
| X35 | `x35` | https://baic.pe/modelos/x35 |
| X55 | `x55` | https://baic.pe/modelos/x55 |
| X7 | `x7` | https://baic.pe/modelos/x7 |
| BJ30 Gasolina | `bj30` | https://baic.pe/modelos/bj30 |
| BJ30 HEV | `bj30` | https://baic.pe/modelos/bj30-hev |
| BJ40 | `bj40` | https://baic.pe/modelos/bj40 |
| BJ40 PRO | `bj40` | https://baic.pe/modelos/bj40-pro |
| BJ60 | `bj60` | https://baic.pe/modelos/bj60 |
| Toda la gama | `gama` | https://baic.pe/modelos |
| Marca | `marca` | https://baic.pe/ |

### Objetivo

`leads`, `trafico`, `reproducciones`, `conversiones`, `interacciones`, `alcance`. En Meta se sugieren primero leads y tráfico; en TikTok, leads y reproducciones.

### Formato

`ppa` (conversión), `ppv` (video), `car` (carrusel). Son los códigos que eligió el cliente.

### Público

`int` (intereses), `bbdd` (base de datos), `lal` (lookalike), `int_bbdd` (intereses + base de datos), `advantage` (Advantage+), `rmkt` (remarketing).

### Motivo

Texto libre. La lista sugiere `gen` (sin motivo propio), `bono` y `beneficio`, más los motivos que el equipo ya usó antes.

## Reglas entre campos

| Cuando | Pasa |
|---|---|
| Objetivo = reproducciones | Formato solo acepta `ppv`. Si había otro elegido, se quita y se avisa |
| Se elige un modelo | La página se llena con la de esa versión, salvo que alguien la haya editado a mano |
| La página es de otro modelo | Aviso, sin bloquear |
| La página no es de baic.pe | Aviso, sin bloquear |
| La página no es una dirección web | Bloquea |
| Se escribe un concesionario, modelo o público que no existe | Aviso y opción «Agregar» en la misma lista |
| La etiqueta ya existe en el historial | Pregunta si es la misma pieza o crea la versión siguiente |

**Mes y año.** Mes tiene los 12. Año va de uno antes del actual a dos después (en 2026: 2025 a 2028) y se recalcula solo cada año. Los dos arrancan en el mes y el año actuales, en hora de Lima.

## Ejemplos

```
Meta · Lima conjunta · BJ40 PRO · sin motivo · PPA · intereses + base de datos · setiembre 2026
https://baic.pe/modelos/bj40-pro?utm_source=facebook&utm_medium=paid_social&utm_campaign=baic-202609-aion_zual_satelital-leads&utm_content=bj40-gen-ppa-int_bbdd

Meta · Satelital · X55 · bono · PPA · intereses + base de datos, segunda pieza igual
https://baic.pe/modelos/x55?utm_source=facebook&utm_medium=paid_social&utm_campaign=baic-202609-satelital-leads&utm_content=x55-bono-ppa-int_bbdd-v2

TikTok · Nacional · toda la gama · reproducciones · PPV · intereses
https://baic.pe/modelos?utm_source=tiktok&utm_medium=paid_social&utm_campaign=baic-202609-nacional-reproducciones&utm_content=gama-gen-ppv-int
```
