# Control de promociones — Promociones Urbanas Montellano, S.L.

Dashboard de control de gestión de las promociones inmobiliarias del grupo. Uso interno.

**→ [Abrir el dashboard](https://alejandrovicente97.github.io/montellano-control-promociones/)**

## Qué contiene

Un único fichero `index.html` autocontenido (CSS, JavaScript y Chart.js en línea, sin dependencias externas). Se abre en cualquier navegador y funciona sin conexión.

- **Resumen** — KPIs del grupo y cuadro de mando comparativo de las promociones.
- **P&L** — ingresos, coste de las ventas, margen y coste por naturaleza, con contraste frente al margen objetivo del estudio económico.
- **Presupuesto vs Real** — ejecutado frente a presupuestado por capítulo, avance económico y desviaciones destacadas, con detalle de partidas y de capítulos de obra.
- **Caja** — cobrado frente a facturado a clientes, pagado frente a facturado a proveedores, posición por cuenta bancaria y alerta de cobertura de tesorería.
- **Deuda** — dispuesto, límite y disponible de los préstamos promotor, más la financiación del grupo.
- **Detalle** — drill-down con filtros hasta el apunte contable, la factura recibida, la factura emitida y el cobro.
- **Calidad de datos** — criterios de asignación aplicados, bandeja «Sin asignar», conciliaciones y descuadres.

## Fuentes

- Diarios contables del ejercicio de las ocho sociedades del grupo (`Diarios/`).
- Presupuestos operativos por promoción (`Presupuestos/`).
- Registro de facturas emitidas y recibidas.

## Cómo actualizar el mes

El fichero está construido para actualizarse sustituyendo un único bloque. Dentro de `index.html`, entre los marcadores:

```
/* ===== BLOQUE DE DATOS — sustituir integramente al actualizar el mes ===== */
const DATA = { ... };
/* ===== FIN DEL BLOQUE DE DATOS ===== */
```

Todo lo que hay fuera de ese bloque es presentación y lógica de cálculo: no necesita tocarse al cerrar un mes nuevo.

## Criterios de asignación

Las partidas se imputan a promoción únicamente mediante criterios verificables en el diario: sociedad vehículo, cuenta de existencias o de suelo, cuenta de coste de obra, sufijo de promoción en la cuenta de cliente, serie de la factura emitida, número de préstamo y cuenta bancaria. Nada se reparte por estimación: lo que no encaja en un criterio permanece en la bandeja «Sin asignar» y se muestra íntegro en la pestaña de calidad de datos.
