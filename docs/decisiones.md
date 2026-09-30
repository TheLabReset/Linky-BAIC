# Decisiones

Qué se decidió, quién lo cerró y por qué. Si alguien pregunta «¿por qué es así?», la respuesta está acá.

## Nomenclatura

| Decisión | Quién | Por qué |
|---|---|---|
| El reporte se ordena por concesionario (Propuesta 1) | Cliente | La campaña del link coincide con la campaña de Meta y con la línea del plan que tiene presupuesto |
| `utm_source` es solo la plataforma | Reset | En los archivos anteriores el source llevaba once datos juntos y Analytics no reconocía la pauta |
| `utm_medium = paid_social` | Reset | Es lo que Analytics necesita para clasificar la visita como Paid Social |
| Periodo `aaaamm` | Reset | En agosto y setiembre el mes se escribió de dos formas distintas |
| Google Ads no pasa por Linky | Cliente | Se etiqueta solo con auto-tagging |
| Lead Ads no necesita UTM | Cliente | El formulario vive dentro de Meta |
| Formato con los códigos PPA, PPV y CAR | Cliente | Es como ya trabajan |
| Campaña conjunta de Lima como `aion_zual_satelital` | Cliente, ajustado por Reset | Pidieron `AION+ZUAL+SATELITAL`; el `+` se lee como espacio dentro de un link |
| Modelo con nombre base en el link | Alonso | BJ40 y BJ40 PRO son el mismo modelo para el reporte; la página sí distingue la versión |
| Motivo libre; si no hay, `gen` | Reset, validado por el cliente | Depende de cada campaña y pieza. Vacío deja un doble guion |
| La cobertura no va en el link | Reset | Analytics ya reporta la ciudad real; una campaña cubre varias ciudades |

## Producto

| Decisión | Quién | Por qué |
|---|---|---|
| Configuración e historial en el navegador | Alonso | Igual que el Linky de Sifrah, que ya está en producción. Sin servidor que mantener |
| Concesionario, modelo y público se escriben y permiten agregar | Alonso | Rápido sin poner candado. Lo nuevo queda en el catálogo de esa persona |
| Plataforma, formato, mes y año como opciones cerradas | Reset | Definen reglas: con reproducciones solo va video |
| Mes y año separados; año de −1 a +2 | Alonso | Siempre queda al día sin tocar el código |
| Mes y año arrancan siempre en el actual | Reset | Recordar el último periodo usado se presta a armar links del mes pasado sin darse cuenta |
| El enlace de destino es editable | Cliente | Quieren probar otras páginas |
| Sin encabezado de SiReset, solo «Linky BAIC» | Alonso | Es una página externa para el cliente |
| Arranca en modo oscuro | Reset | El brand book reserva el modo claro para documentos y salas con luz |
| Fuentes y SheetJS servidos desde el mismo sitio | Reset | Funciona sin depender de terceros y permite una política de seguridad estricta |
