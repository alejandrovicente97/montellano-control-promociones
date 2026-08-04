# Control de promociones — Promociones Urbanas Montellano, S.L.

Dashboard de control de gestión de las promociones inmobiliarias del grupo. Ejercicios 2023 a 2026, último cierre incorporado 31/07/2026. Uso interno.

**→ [Abrir el dashboard](https://alejandrovicente97.github.io/montellano-control-promociones/)**

## Qué contiene

Un único fichero `index.html` autocontenido: CSS, JavaScript y Chart.js van incrustados, sin dependencias externas. Se abre con doble clic y funciona sin conexión.

En la cabecera hay dos selectores, de ejercicio y de promoción, y todas las pestañas responden a los dos.

**Resumen.** KPIs del grupo, coste incurrido por mes, evolución de la caja y cuadro de mando comparativo de las promociones, con alerta de cobertura de tesorería.

**P&L.** Ingresos, coste de las unidades entregadas y margen, con la composición del consolidado promoción a promoción, el desglose por naturaleza y el contraste del margen realizado frente al objetivo del estudio económico.

**Presupuesto vs Real.** Coste real de la contabilidad frente al presupuestado, avance económico, ventas realizadas, desviaciones destacadas, detalle de partidas y capítulos de obra.

**Caja.** Cobrado frente a facturado a clientes, pagado frente a facturado a proveedores, posición por cuenta bancaria, mayores saldos pendientes y cobertura de tesorería.

**Deuda.** Dispuesto, límite y disponible de los préstamos promotor, financiación prevista pendiente de formalizar y otra financiación del grupo.

**Analítica.** Contraste entre la analítica contable del cliente y el coste que sale de las cuentas de existencias, con el desglose por sección y por fase que la analítica aporta y el diario no permite.

**Detalle.** Drill-down con filtros hasta el apunte contable, la factura recibida, la factura emitida y el cobro.

**Calidad de datos.** Criterios de asignación aplicados, bandeja «Sin asignar», conciliaciones, facturas sin pago identificado y descuadres.

## Fuentes

- Diarios contables 2023, 2024, 2025 y 2026 de las ocho sociedades del grupo (`Diarios/`). Los asientos de apertura y de cierre se excluyen para encadenar los cuatro ejercicios sin duplicar saldos; el cierre de existencias de 2023 coincide al céntimo con la apertura de 2024.
- Presupuestos operativos por promoción (`Presupuestos/`).
- Analítica contable del cliente (`ANALITICA*.xlsx`), opcional.
- Registro de facturas emitidas y recibidas.

## Cómo se genera

```
pip install openpyxl pandas
npm install chart.js@4.4.1     # opcional: incrusta la libreria y permite uso sin conexion

python etl.py "<carpeta con Diarios y Presupuestos>" .
python build.py .
```

`etl.py` produce `DATA.json` en cuatro fases: carga y asignación de los diarios, series mensuales por promoción, presupuestos y facturas, y contraste con la analítica contable. `build.py` ensambla `src_layout.html`, `src_app.js`, Chart.js y `DATA.json` en el `index.html` final.

## Cómo actualizar un mes

Lo habitual es volver a ejecutar los dos comandos con los diarios del nuevo cierre. Si se prefiere no reconstruir el fichero entero, dentro de `index.html` basta con sustituir el bloque delimitado por estos comentarios:

```
/* ===== BLOQUE DE DATOS - sustituir integramente al actualizar el mes ===== */
const DATA = { ... };
/* ======================= FIN DEL BLOQUE DE DATOS ==================== */
```

Todo lo que hay fuera de ese bloque es presentación y lógica de cálculo, y no necesita tocarse.

## Criterios de asignación

El coste incurrido se imputa a promoción por la cuenta de existencias 330000xx: es la propia contabilidad la que lo reparte por promoción y fase en el asiento mensual de variación de existencias, de modo que la cobertura es del 100 %. El resto de criterios —sociedad vehículo, cuenta de solar, cuenta 606 de obra, sufijo de promoción en la cuenta de cliente, serie de la factura emitida, número de préstamo y cuenta bancaria— sirven para el desglose por naturaleza, la tesorería y la deuda.

Nada se reparte por estimación. Lo que no encaja en un criterio verificable permanece en la bandeja «Sin asignar» —estructura, tributos genéricos, servicios centrales e intereses con el grupo— y se muestra íntegro en la pestaña de calidad de datos.

## Ficheros

| Fichero | Contenido |
|---|---|
| `index.html` | Dashboard completo y autocontenido |
| `etl.py` | Diarios, presupuestos y analítica → `DATA.json` |
| `build.py` | Ensamblado del `index.html` |
| `src_layout.html` | Estructura y CSS |
| `src_app.js` | Lógica del dashboard, sin datos |
