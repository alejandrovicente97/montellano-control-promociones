# Control de promociones — Promociones Urbanas Montellano, S.L.

Dashboard de control de gestión de las promociones inmobiliarias del grupo. Ejercicios 2023 a 2026 (último cierre incorporado: 31/07/2026). Uso interno.

**→ [Abrir el dashboard](https://alejandrovicente97.github.io/montellano-control-promociones/)**

## Qué contiene

Un único fichero `index.html` autocontenido (CSS, JavaScript y Chart.js en línea, sin dependencias externas). Se abre en cualquier navegador y funciona sin conexión.

Selector de ejercicio (acumulado 2023-2026 o año concreto) y selector de promoción en la cabecera; todas las pestañas responden a ambos.

- **Resumen** — KPIs del grupo y cuadro de mando comparativo de las promociones.
- **P&L** — ingresos, coste de las ventas, margen y coste por naturaleza, con contraste frente al margen objetivo del estudio económico.
- **Presupuesto vs Real** — ejecutado frente a presupuestado por capítulo, avance económico y desviaciones destacadas, con detalle de partidas y de capítulos de obra.
- **Caja** — cobrado frente a facturado a clientes, pagado frente a facturado a proveedores, posición por cuenta bancaria y alerta de cobertura de tesorería.
- **Deuda** — dispuesto, límite y disponible de los préstamos promotor, más la financiación del grupo.
- **Detalle** — drill-down con filtros hasta el apunte contable, la factura recibida, la factura emitida y el cobro.
- **Calidad de datos** — criterios de asignación aplicados, bandeja «Sin asignar», conciliaciones y descuadres.

## Fuentes

- Diarios contables 2023, 2024, 2025 y 2026 de las ocho sociedades del grupo (`Diarios/`). Los asientos de apertura y de cierre se excluyen para encadenar los cuatro ejercicios sin duplicar saldos.
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

El coste incurrido se imputa a promoción a través del asiento de variación de existencias, que la propia contabilidad reparte por promoción y fase: la cobertura es del 100 %. El resto de criterios —sociedad vehículo, cuenta de solar, cuenta de coste de obra, sufijo de promoción en la cuenta de cliente, serie de la factura emitida, número de préstamo y cuenta bancaria— sirven para el desglose por naturaleza, la tesorería y la deuda.

Nada se reparte por estimación. Lo que no encaja en un criterio verificable permanece en una de las dos bandejas —«Doñinos común», para lo que no separa Puerto de Salamanca de Doñinos Residencial, y «Sin asignar», para estructura y partidas genéricas— y se muestra íntegro en la pestaña de calidad de datos.
