# -*- coding: utf-8 -*-
"""
================================================================================
 BUILD — ensamblado del dashboard en un unico fichero HTML autocontenido
 Promociones Urbanas Montellano, S.L.
================================================================================

 Junta cuatro piezas en index.html:

   src_layout.html   estructura, CSS y marcadores <!--CHARTJS--> y <!--APP-->
   chart.umd.js      libreria de graficos, incrustada para que el fichero
                     funcione sin conexion y sin depender de ningun CDN
   DATA.json         bloque de datos que produce etl.py
   src_app.js        logica del dashboard

 El resultado no tiene dependencias externas: se abre con doble clic.

 EJECUCION
   python etl.py && python build.py

 ACTUALIZAR UN MES
   Basta con volver a ejecutar etl.py con los diarios del nuevo cierre y
   relanzar build.py. Si se prefiere no reconstruir el fichero entero, se puede
   sustituir a mano el bloque delimitado por los comentarios
   "BLOQUE DE DATOS" y "FIN DEL BLOQUE DE DATOS" dentro de index.html.
================================================================================
"""
import os, sys, json

HERE = os.path.dirname(os.path.abspath(__file__))
OUT  = sys.argv[1] if len(sys.argv) > 1 else HERE

def leer(*p):
    ruta = os.path.join(*p)
    if not os.path.exists(ruta):
        raise SystemExit('No se encuentra %s' % ruta)
    return open(ruta, encoding='utf-8').read()

def chartjs():
    """Chart.js desde node_modules si esta instalado; si no, se deja el CDN."""
    local = os.path.join(HERE, 'node_modules', 'chart.js', 'dist', 'chart.umd.js')
    if os.path.exists(local):
        return ('<script>/* Chart.js v4.4.1 - MIT - https://www.chartjs.org */\n'
                + open(local, encoding='utf-8').read() + '\n</script>')
    print('  aviso: no hay node_modules/chart.js, se enlaza el CDN '
          '(el fichero dejara de funcionar sin conexion). '
          'Para incrustarlo: npm install chart.js@4.4.1')
    return ('<script src="https://cdnjs.cloudflare.com/ajax/libs/'
            'Chart.js/4.4.1/chart.umd.min.js"></script>')

layout = leer(HERE, 'src_layout.html')
app    = leer(HERE, 'src_app.js')
datos  = leer(OUT,  'DATA.json')

json.loads(datos)   # falla pronto si el ETL dejo un JSON invalido

bloque = (
 '<script>\n'
 '/* ==================================================================\n'
 '   BLOQUE DE DATOS  -  sustituir integramente al actualizar el mes.\n'
 '   Se genera con etl.py a partir de los diarios contables 2023-2026 de\n'
 '   las ocho sociedades del grupo y de los presupuestos por promocion.\n'
 '   ================================================================== */\n'
 'const DATA = ' + datos + ';\n'
 '/* ======================= FIN DEL BLOQUE DE DATOS ==================== */\n'
 '</script>\n')

html = (layout
        .replace('<!--CHARTJS-->', chartjs())
        .replace('<!--APP-->', bloque + '<script>\n' + app + '\n</script>'))

destino = os.path.join(OUT, 'index.html')
open(destino, 'w', encoding='utf-8').write(html)
print('index.html generado: %.1f MB' % (len(html.encode('utf-8')) / 1024 / 1024))
