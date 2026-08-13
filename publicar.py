# -*- coding: utf-8 -*-
"""
================================================================================
 PUBLICAR — prepara la copia que se sube a GitHub Pages
 Promociones Urbanas Montellano, S.L.
================================================================================

 Toma el index.html que produce build.py y le pone delante la pantalla de acceso,
 si hay una configurada con acceso.py. El fichero que se abre en local no se toca:
 esta pantalla existe solo en la copia publicada.

   python build.py        genera index.html          (sin pantalla, para trabajar)
   python publicar.py     genera publicado/index.html (con pantalla, para subir)

 Si no hay acceso.json, o si le falta alguna de las tres piezas -usuario, sal y
 hash-, no se inyecta nada y se avisa por pantalla. Media puerta es peor que
 ninguna: saldria el dialogo, dejaria pasar a cualquiera y encima tranquilizaria
 a quien lo viera.

 Este paso es el ULTIMO de la cadena, a proposito: envuelve el documento ya
 terminado y asi nada puede colarse por delante del velo.
================================================================================
"""
import os, sys, json

HERE = os.path.dirname(os.path.abspath(__file__))
CONF = os.path.join(HERE, 'acceso.json')

# ------------------------------------------------------------------------------
# El velo. Oculta todo el body menos el dialogo. Al validar se retiran los dos.
# ------------------------------------------------------------------------------
VELO = ('<style id="velo-acceso">body>*:not(#puerta-acceso){display:none!important}'
        'body{background:#102C57!important}</style>')

DIALOGO = """<div id="puerta-acceso" role="dialog" aria-modal="true" aria-labelledby="pa-t">
 <div class="pa-caja">
  <div class="pa-marca"><i></i></div>
  <h1 id="pa-t">Control de promociones</h1>
  <p class="pa-sub">Promociones Urbanas Montellano, S.L. · Uso interno</p>
  <form id="pa-form" autocomplete="off">
   <label for="pa-u">Usuario</label>
   <input id="pa-u" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required>
   <label for="pa-p">Contraseña</label>
   <input id="pa-p" type="password" autocomplete="current-password" required>
   <button type="submit" id="pa-b">Entrar</button>
   <p id="pa-e" class="pa-err" role="alert" hidden>Usuario o contraseña incorrectos.</p>
  </form>
  <p class="pa-pie">Esta pantalla evita entrar por casualidad; no cifra los datos.</p>
 </div>
 <style>
  #puerta-acceso{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;
   background:#102C57;padding:24px;font-family:"Libre Franklin",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  #puerta-acceso .pa-caja{background:#fff;border-radius:12px;padding:34px 32px 26px;width:100%;max-width:376px;
   box-shadow:0 12px 40px rgba(0,0,0,.28)}
  #puerta-acceso .pa-marca{width:40px;height:40px;border:1.6px solid #102C57;display:flex;align-items:center;
   justify-content:center;margin-bottom:20px}
  #puerta-acceso .pa-marca i{width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;
   border-bottom:16px solid #102C57}
  #puerta-acceso h1{margin:0;font-size:17px;font-weight:600;color:#102C57;letter-spacing:-.2px}
  #puerta-acceso .pa-sub{margin:5px 0 22px;font-size:12px;color:#8a94a8}
  #puerta-acceso label{display:block;font-size:9.5px;text-transform:uppercase;letter-spacing:1px;
   color:#8a94a8;font-weight:600;margin-bottom:5px}
  #puerta-acceso input{width:100%;box-sizing:border-box;border:1px solid #e3e7ef;border-radius:7px;
   padding:9px 11px;font-size:14px;font-family:inherit;color:#16233d;margin-bottom:15px;outline:none}
  #puerta-acceso input:focus{border-color:#1c4183;box-shadow:0 0 0 3px rgba(28,65,131,.10)}
  #puerta-acceso button{width:100%;border:0;border-radius:7px;background:#102C57;color:#fff;
   font-family:inherit;font-size:13.5px;font-weight:600;padding:11px;cursor:pointer}
  #puerta-acceso button:hover{background:#183d73}
  #puerta-acceso button:disabled{opacity:.6;cursor:default}
  #puerta-acceso .pa-err{margin:13px 0 0;font-size:12.5px;color:#b3261e}
  #puerta-acceso .pa-pie{margin:22px 0 0;padding-top:15px;border-top:1px solid #eef1f6;
   font-size:11px;color:#8a94a8;line-height:1.6}
 </style>
</div>"""

# ------------------------------------------------------------------------------
# La logica. Va en cadena RAW: el \n de la formula del hash tiene que llegar al
# navegador como los dos caracteres barra-ene, no como un salto de linea real.
# Si Python se lo comiera, la cadena de JavaScript quedaria partida, el fichero
# no compilaria y la puerta no dejaria entrar ni con la clave buena.
# ------------------------------------------------------------------------------
LOGICA = r"""<script>
/* Pantalla de acceso. Evita entrar por casualidad; no cifra los datos: el HTML
   ya esta descargado con todo dentro cuando esto se ejecuta. */
(function(){
  var C={u:"__USUARIO__",s:"__SAL__",h:"__HASH__"};
  /* Unica clave de almacenamiento del fichero publicado, y a proposito en
     sessionStorage y no en localStorage: la sesion se olvida al cerrar el
     navegador, que es lo que toca en un ordenador compartido. */
  var LLAVE="montellano.acceso";
  var velo=document.getElementById("velo-acceso");
  var caja=document.getElementById("puerta-acceso");

  function abrir(){
    if(velo&&velo.parentNode) velo.parentNode.removeChild(velo);
    if(caja&&caja.parentNode) caja.parentNode.removeChild(caja);
    /* Los graficos se han medido a cero mientras estaban ocultos. */
    try{window.dispatchEvent(new Event("resize"));}catch(e){}
  }

  try{ if(sessionStorage.getItem(LLAVE)===C.h){ abrir(); return; } }catch(e){}

  async function sha256(t){
    var b=new TextEncoder().encode(t);
    var d=await crypto.subtle.digest("SHA-256",b);
    return Array.prototype.map.call(new Uint8Array(d),function(x){
      return x.toString(16).padStart(2,"0");}).join("");
  }

  document.addEventListener("DOMContentLoaded",function(){
    var f=document.getElementById("pa-form"),
        u=document.getElementById("pa-u"),
        p=document.getElementById("pa-p"),
        e=document.getElementById("pa-e"),
        b=document.getElementById("pa-b");
    if(!f) return;
    u.focus();
    f.addEventListener("submit",async function(ev){
      ev.preventDefault();
      e.hidden=true; b.disabled=true;
      try{
        if(!(window.crypto&&crypto.subtle)){
          e.textContent="Este navegador no puede comprobar la contraseña. Abre la página con https.";
          e.hidden=false; b.disabled=false; return;
        }
        var calc=await sha256(C.s+"\n"+u.value.trim()+"\n"+p.value);
        if(u.value.trim()===C.u&&calc===C.h){
          try{sessionStorage.setItem(LLAVE,C.h);}catch(er){}
          abrir();
        }else{
          e.textContent="Usuario o contraseña incorrectos.";
          e.hidden=false; p.value=""; p.focus();
        }
      }finally{ b.disabled=false; }
    });
  });
})();
</script>"""


def inyectar(html, conf):
    js = (LOGICA.replace('__USUARIO__', conf['usuario'])
                .replace('__SAL__', conf['sal'])
                .replace('__HASH__', conf['hash']))
    i = html.index('<body>') + len('<body>')
    html = html[:i] + '\n' + VELO + '\n' + DIALOGO + html[i:]
    j = html.rindex('</body>')
    return html[:j] + js + '\n' + html[j:]


def main():
    ent = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'index.html')
    sal = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'publicado', 'index.html')
    if not os.path.exists(ent):
        raise SystemExit('No se encuentra %s. Ejecuta antes: python build.py' % ent)
    html = open(ent, encoding='utf-8').read()

    conf, aviso = None, None
    if os.path.exists(CONF):
        try:
            c = json.load(open(CONF, encoding='utf-8'))
        except Exception as ex:
            aviso = 'acceso.json no se puede leer (%s)' % ex
        else:
            faltan = [k for k in ('usuario', 'sal', 'hash') if not c.get(k)]
            if faltan:
                aviso = 'acceso.json esta incompleto, faltan: %s' % ', '.join(faltan)
            else:
                conf = c

    if conf:
        html = inyectar(html, conf)
        estado = 'CON pantalla de acceso, usuario "%s"' % conf['usuario']
    else:
        estado = 'SIN pantalla de acceso'
        if aviso:
            print('  AVISO: %s.' % aviso)
            print('  No se inyecta nada: con las tres piezas o con ninguna. Media puerta')
            print('  saldria en pantalla, dejaria pasar a cualquiera y ademas tranquilizaria')
            print('  a quien la viera. Arreglalo con: python acceso.py poner')
        else:
            print('  Sin acceso.json: la copia publicada se abrira directamente.')
            print('  Para ponerle pantalla: python acceso.py poner')

    os.makedirs(os.path.dirname(sal), exist_ok=True)
    open(sal, 'w', encoding='utf-8').write(html)
    print('%s generado: %.1f MB, %s' % (sal, len(html.encode('utf-8')) / 1024 / 1024, estado))
    print('Recuerda: la pantalla evita entrar por casualidad, no cifra los datos.')
    print('Los ficheros sueltos que se publiquen al lado se abren por su direccion directa.')


if __name__ == '__main__':
    main()
