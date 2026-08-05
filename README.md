# Control de promociones — Promociones Urbanas Montellano, S.L.

Dashboard de control de gestión de las promociones inmobiliarias del grupo. Ejercicios 2023 a 2026, último cierre incorporado 31/07/2026. Uso interno.

**→ [Abrir el dashboard](https://alejandrovicente97.github.io/montellano-control-promociones/)**

## Qué contiene

Un único fichero `index.html` autocontenido: CSS, JavaScript y Chart.js van incrustados, sin dependencias externas. Se abre con doble clic y funciona sin conexión.

En la cabecera hay dos selectores, de ejercicio y de promoción, y todas las pestañas responden a los dos. La cabecera indica además la fecha en que se generó el fichero, que también aparece en la banda de contexto junto al último cierre contable incorporado y en el pie con la hora.

**Resumen.** KPIs del grupo, coste incurrido por mes, evolución de la caja y cuadro de mando comparativo de las promociones, con alerta de cobertura de tesorería.

**P&L.** Ingresos, coste de las unidades entregadas y margen, con la composición del consolidado promoción a promoción, el desglose por naturaleza, el contraste del margen realizado frente al objetivo del estudio económico y un desglose ampliado en desplegables con la cuenta de resultados mes a mes, los ratios, la aportación por sociedad y las facturas emitidas del periodo.

**Presupuesto vs Real.** Coste real de la contabilidad frente al presupuestado, avance económico, ventas realizadas, desviaciones destacadas, detalle de partidas y capítulos de obra.

**Comercial.** Unidades libres, reservadas, contratadas y escrituradas sobre el total, ritmo de ventas mensual y meses para agotar el stock, precio medio realizado frente al del estudio y €/m², con el detalle unidad a unidad.

**Obra.** Curva S de certificación real frente al cronograma del estudio, desfase en plazo y en coste, avance por promoción y detalle por capítulo de obra.

**Caja.** Cobrado frente a facturado a clientes, pagado frente a facturado a proveedores, posición por cuenta bancaria y cobertura de tesorería, con el detalle de cobros y pagos en dos modos: lo ejecutado, movimiento a movimiento de las cuentas de tesorería agrupado por concepto, y lo pendiente, factura a factura de lo que queda por cobrar y por pagar.

**Proyección.** Tesorería a dieciocho meses con cobros por escrituración, pagos de obra, disposiciones y amortizaciones del préstamo y punto de máxima necesidad de financiación; rendimiento de cada promoción como inversión con TIR, múltiplo sobre fondos propios y ratios por metro cuadrado; y escenarios de sensibilidad de coste de obra, precios de venta y tipo de interés.

**Deuda.** Dispuesto, límite y disponible de los préstamos promotor, financiación prevista pendiente de formalizar y otra financiación del grupo.

**Clientes y proveedores.** Facturado, cobrado y pagado, con el saldo vivo de cada tercero, la posición neta, la concentración del riesgo de pago y el reparto por promoción.

**Analítica.** Contraste entre la analítica contable del cliente y el coste que sale de las cuentas de existencias, con el detalle factura a factura de los apuntes en los que ambos criterios no coinciden y el desglose por sección y fase que la analítica aporta y el diario no permite.

**Detalle.** Drill-down con filtros hasta el apunte contable, la factura recibida, la factura emitida y el cobro.

**Calidad de datos.** Criterios de asignación aplicados, bandeja «Sin asignar», conciliaciones, facturas sin pago identificado y descuadres.

## Fuentes

- Diarios contables 2023, 2024, 2025 y 2026 de las ocho sociedades del grupo (`Diarios/`). Los asientos de apertura y de cierre se excluyen para encadenar los cuatro ejercicios sin duplicar saldos; el cierre de existencias de 2023 coincide al céntimo con la apertura de 2024.
- Presupuestos operativos por promoción (`Presupuestos/`). Además del estudio económico se explotan las hojas `DATOS GENERALES` (superficies y unidades), `PLANNING MENSUAL` (cronograma de coste y calendario de cobros de compradores), `FLUJO FINANCIERO` (proyección de obra, préstamo, intereses y fondos propios), `CAPITULOS OBRA` y `COMPRADORES` (unidad a unidad).
- Analítica contable del cliente (`ANALITICA*.xlsx`), opcional.
- Registro de facturas emitidas y recibidas.
- Carpeta `Logos/` (opcional): si existe junto a `Diarios/`, cada imagen que contenga se incrusta como logo de su promoción. El nombre del fichero puede ser el código interno (`CARBAJOSA.png`) o el nombre comercial (`Jardines de Carbajosa.svg`); se admiten png, jpg, svg y webp. Sin esa carpeta, cada promoción usa un monograma con su color corporativo.

## Cómo se genera

```
pip install openpyxl pandas
npm install chart.js@4.4.1     # opcional: incrusta la libreria y permite uso sin conexion

python etl.py "<carpeta con Diarios y Presupuestos>" .
python build.py .
```

`etl.py` produce `DATA.json` en cinco fases: carga y asignación de los diarios, series mensuales por promoción, presupuestos y facturas, contraste con la analítica contable, y modelo de promoción con el detalle comercial, de obra y de flujo financiero. `build.py` ensambla `src_layout.html`, `src_app.js`, Chart.js y `DATA.json` en el `index.html` final.

## Cómo actualizar un mes

Lo habitual es volver a ejecutar los dos comandos con los diarios del nuevo cierre. Si se prefiere no reconstruir el fichero entero, dentro de `index.html` basta con sustituir el bloque delimitado por estos comentarios:

```
/* ===== BLOQUE DE DATOS - sustituir integramente al actualizar el mes ===== */
const DATA = { ... };
/* ======================= FIN DEL BLOQUE DE DATOS ==================== */
```

Todo lo que hay fuera de ese bloque es presentación y lógica de cálculo, y no necesita tocarse.

## Facturas escaneadas

Las facturas en PDF viven en las carpetas `FACTURAS RECIBIDAS*` y `FACTURAS EMITIDAS*`, junto al dashboard. Son escaneos sin capa de texto y su nombre de fichero no aparece en la contabilidad, así que el enlace entre cada apunte y su PDF se construye por reconocimiento óptico:

```
pip install pillow
apt-get install poppler-utils tesseract-ocr tesseract-ocr-spa
python ocr/mapa.py "<carpeta con FACTURAS *>"
```

`ocr/leer.py` extrae de cada PDF la fecha, los importes y el texto; `ocr/casar.py` lo empareja con el registro de facturas por importe, fecha, referencia y nombre del tercero, y solo acepta la correspondencia cuando es inequívoca. El resultado se guarda en `ocr/mapa_facturas.json`, que el ETL incorpora: cada factura enlazada se vuelve clicable en **Detalle** y en la ficha de tercero de **Clientes y proveedores**, y las que no casan se listan en **Calidad de datos** para revisión manual, sin enlace, para no mostrar nunca una factura equivocada.

Los enlaces son rutas relativas, así que funcionan al abrir el dashboard desde la carpeta que contiene las facturas.

## Verificación

`verificar.py` vuelve a leer los diarios contables desde Excel, aplica el mismo criterio de exclusión de asientos técnicos y contrasta 153 magnitudes contra `DATA.json`: apuntes, partida doble, coste incurrido, obra en curso, ingresos, coste de las unidades entregadas, caja, deuda, saldos de clientes y proveedores cuenta a cuenta, tesorería, presupuesto, cuadro comercial, capítulos de obra, cronograma y analítica. Incluye además comprobaciones de coherencia interna: la misma magnitud no puede salir distinta en dos pestañas.

```
python verificar.py
```

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
| `verificar.py` | Verificación independiente de todas las cifras |
