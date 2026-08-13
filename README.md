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

**Calidad de datos.** Criterios de asignación aplicados, bandeja «Sin asignar», conciliaciones, facturas sin pago identificado y descuadres. Incluye el contraste entre el coste real contable y el ejecutado del estudio económico, con **reparto de coste**: pinchando en cualquier promoción se abre el puente de su diferencia, los asientos de activación que forman el Real contable, las facturas de proveedor que hay detrás, el gasto todavía sin activar y la bandeja de candidatos sin obra. La obra de cualquier apunte se puede cambiar en pantalla: las cifras se recalculan al momento y las decisiones se descargan en JSON o CSV para incorporarlas al ETL.

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

`verificar.py` vuelve a leer los diarios contables desde Excel, aplica el mismo criterio de exclusión de asientos técnicos y contrasta 267 magnitudes contra `DATA.json`: apuntes, partida doble, coste incurrido, obra en curso, ingresos, coste de las unidades entregadas, caja, deuda, saldos de clientes y proveedores cuenta a cuenta, tesorería, presupuesto, cuadro comercial, capítulos de obra, cronograma, analítica, reparto de coste, cuadre por capítulo y conciliación contra la analítica. Incluye además comprobaciones de coherencia interna: la misma magnitud no puede salir distinta en dos pestañas.

```
python verificar.py
```

## Criterios de asignación

El coste incurrido se imputa a promoción por la cuenta de existencias 330000xx: es la propia contabilidad la que lo reparte por promoción y fase en el asiento mensual de variación de existencias, de modo que la cobertura es del 100 %. El resto de criterios —sociedad vehículo, cuenta de solar, cuenta 606 de obra, sufijo de promoción en la cuenta de cliente, serie de la factura emitida, número de préstamo y cuenta bancaria— sirven para el desglose por naturaleza, la tesorería y la deuda.

Nada se reparte por estimación. Lo que no encaja en un criterio verificable permanece en la bandeja «Sin asignar» —estructura, tributos genéricos, servicios centrales e intereses con el grupo— y se muestra íntegro en la pestaña de calidad de datos.

## Reparto de coste y diferencias con el estudio

La columna *Ejecutado* del estudio económico es una cifra que se mantiene a mano en el Excel de cada promoción: no tiene facturas detrás. Las facturas solo existen del lado contable, así que la diferencia entre ambas columnas se explica por el lado que sí es trazable.

El ETL aísla en `DATA.rep` cuatro conjuntos de apuntes por promoción: las **activaciones** en existencias, que son las que literalmente forman el Real contable; el **gasto 6xx** que la contabilidad imputa a la promoción, factura a factura; el **coste incurrido posterior al último asiento de variación de existencias**, que está en los libros pero todavía no forma parte del coste de ninguna obra; y la **bandeja** de gasto sin promoción, como candidatos. Sobre esos conjuntos, el cuadro construye el puente de la diferencia y permite reasignar la obra de cualquier apunte.

Sobre esos conjuntos el cuadro construye un **cuadre por capítulo** que cierra al céntimo: la columna contable suma exactamente el Real contable de la promoción y la columna del estudio su ejecutado, de modo que la diferencia entre ambas queda repartida entre líneas concretas sin dejar residuo. Cada apunte se clasifica en el capítulo equivalente del estudio por su cuenta y, cuando cae en una cuenta 606 de obra —que en esta contabilidad recoge también suelo, honorarios y comercialización—, por el proveedor del asiento. Esa clasificación es un punto de partida revisable: cada línea se abre en sus facturas y cada factura se puede mover de capítulo o de obra. Marcando líneas como explicadas, el indicador *Por explicar* de la promoción baja hasta cero.

La pestaña de calidad incluye además el contraste entre el reparto de este cuadro y la analítica que mantiene contabilidad, promoción a promoción, descontando lo que no es comparable —las sociedades vehículo, que no entran en ese fichero, y el asiento de apertura—. En seis de las ocho promociones con estudio la cifra de la analítica y la columna *Ejecutado* del estudio económico coinciden al céntimo, de modo que ambos contrastes miran la misma diferencia desde dos ángulos.

Reasignar no toca `DATA.json`: la decisión vive en memoria, las tablas se recalculan al momento y el resultado se descarga en un fichero que recoge tanto las reasignaciones apunte a apunte como el estado del cuadre. Ese fichero es lo que se incorpora al ETL como regla permanente, de modo que el cambio queda documentado y el cierre siguiente ya nace bien.

## Ficheros

| Fichero | Contenido |
|---|---|
| `index.html` | Dashboard completo y autocontenido |
| `etl.py` | Diarios, presupuestos y analítica → `DATA.json` |
| `build.py` | Ensamblado del `index.html` |
| `src_layout.html` | Estructura y CSS |
| `src_app.js` | Lógica del dashboard, sin datos |
| `verificar.py` | Verificación independiente de todas las cifras |
