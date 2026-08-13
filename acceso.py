# -*- coding: utf-8 -*-
"""
================================================================================
 ACCESO — pone o quita la pantalla de usuario y contrasena de la copia publicada
 Promociones Urbanas Montellano, S.L.
================================================================================

 QUE ES ESTO, Y QUE NO ES

 Es un cartel de "no pasar". Evita que alguien de la organizacion que abra la
 direccion por casualidad se ponga a mirar cifras que no le tocan.

 NO cifra nada. El cuadro es un fichero estatico: cuando el navegador ensena la
 pantalla de la contrasena ya se ha descargado el HTML entero con los datos
 dentro. Quien guarde la pagina y la abra con un editor los ve sin pasar por
 ninguna pantalla. Si lo que hace falta es proteger el dato de verdad, la via es
 autenticacion en el servidor: Cloudflare Access sobre Cloudflare Pages, el
 repositorio en privado, o el hosting corporativo.

 LA CONTRASENA NO SE GUARDA EN NINGUN SITIO

 Ni aqui, ni en el HTML, ni en el repositorio. Lo que se guarda en acceso.json
 es el usuario, una sal aleatoria distinta en cada instalacion, y

     sha256( sal + "\\n" + usuario + "\\n" + contrasena )

 El navegador calcula el mismo hash con crypto.subtle y compara. Quien mire el
 codigo fuente publicado no lee la contrasena.

 USO
   python acceso.py poner     pide usuario y contrasena por teclado
   python acceso.py quitar    borra la configuracion; la copia publicada
                              volvera a salir sin pantalla
   python acceso.py ver       dice si hay acceso configurado, sin ensenar nada

 Despues de poner o quitar hay que volver a generar la copia publicada:
   python build.py && python publicar.py
================================================================================
"""
import os, sys, json, getpass, hashlib, secrets

HERE = os.path.dirname(os.path.abspath(__file__))
CONF = os.path.join(HERE, 'acceso.json')
MINIMO = 8


def huella(sal, usuario, clave):
    """El mismo calculo que hace el navegador. El separador es un salto de linea."""
    return hashlib.sha256((sal + "\n" + usuario + "\n" + clave).encode('utf-8')).hexdigest()


def poner():
    print(__doc__.split('USO')[0].strip()[:0] or '', end='')
    print('Pantalla de acceso del cuadro publicado\n' + '-' * 62)
    usuario = input('Usuario: ').strip()
    if not usuario:
        print('\nEl usuario no puede quedar vacio. No se ha cambiado nada.')
        return 1
    clave = getpass.getpass('Contrasena (no se muestra): ')
    if len(clave) < MINIMO:
        print(f'\nLa contrasena necesita al menos {MINIMO} caracteres. No se ha cambiado nada.')
        return 1
    otra = getpass.getpass('Reptela: ')
    if clave != otra:
        print('\nLas dos contrasenas no coinciden. No se ha cambiado nada.')
        return 1
    sal = secrets.token_hex(16)
    json.dump(dict(usuario=usuario, sal=sal, hash=huella(sal, usuario, clave)),
              open(CONF, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'\nGuardado en {os.path.basename(CONF)}: usuario, sal y hash.')
    print('La contrasena no se ha escrito en ningun sitio.')
    print('\nAhora regenera la copia publicada:  python build.py && python publicar.py')
    return 0


def quitar():
    if not os.path.exists(CONF):
        print('No habia ninguna pantalla de acceso configurada.')
        return 0
    os.remove(CONF)
    print('Pantalla de acceso retirada. Vuelve a generar la copia publicada para que surta efecto.')
    return 0


def ver():
    if not os.path.exists(CONF):
        print('Sin pantalla de acceso: la copia publicada se abre directamente.')
        return 0
    c = json.load(open(CONF, encoding='utf-8'))
    faltan = [k for k in ('usuario', 'sal', 'hash') if not c.get(k)]
    if faltan:
        print('Configuracion incompleta, faltan:', ', '.join(faltan))
        print('Con las tres piezas o con ninguna. Vuelve a ejecutar:  python acceso.py poner')
        return 1
    print(f'Pantalla de acceso activa para el usuario "{c["usuario"]}".')
    print('La contrasena no esta guardada; solo la sal y el hash.')
    return 0


if __name__ == '__main__':
    modo = (sys.argv[1] if len(sys.argv) > 1 else 'ver').lower()
    sys.exit({'poner': poner, 'quitar': quitar, 'ver': ver}.get(modo, ver)())
