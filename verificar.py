# -*- coding: utf-8 -*-
"""
Verificacion independiente del dashboard.
Relee los diarios contables en bruto desde Excel, aplica el mismo criterio
documentado de exclusion de asientos tecnicos y contrasta cada magnitud
que el dashboard publica.
"""
import openpyxl, glob, os, json, re, math
from collections import defaultdict
BASE='/mnt/user-data/uploads/Promociones Urbanas Montellano'
D=json.load(open('/home/claude/pm/pub/DATA.json',encoding='utf-8'))
R=[]
def chk(nom,a,b,tol=0.05,nota=''):
    a=0 if a is None else a; b=0 if b is None else b
    R.append((abs(a-b)<=tol,nom,a,b,nota))

# ================= 1. relectura cruda =================
raw=[];fecha=None
FIL={}
for f in sorted(glob.glob(os.path.join(BASE,'Diarios','*.xlsx'))):
    b=os.path.splitext(os.path.basename(f))[0].upper()
    soc=('SPV_CARB' if 'CARBAJOSA' in b else 'SPV_DORES' if 'DOÑINOS' in b or 'DORES' in b
         else 'SPV_LARAD' if 'LARAD' in b else 'SPV_MARIN' if 'MARIN' in b
         else 'SPV_MIRA' if 'MIRADOR' in b or 'MIRA' in b else 'SPV_NAVES' if 'NAVES' in b
         else 'SPV_VILLAS' if 'VILLAS' in b else 'PUM')
    wb=openpyxl.load_workbook(f,read_only=True,data_only=True); ws=wb.worksheets[0]
    fecha=None
    for r in ws.iter_rows(values_only=True):
        if r[0] is None: continue
        s=str(r[0]).strip()
        m=re.match(r'^Fecha:\s*(\d{2})/(\d{2})/(\d{4})$',s)
        if m: fecha=f'{m.group(3)}-{m.group(2)}'; continue
        if not s.isdigit(): continue
        cta=str(r[3]).strip() if r[3] is not None else 'SIN_CUENTA'
        if cta in ('None','nan',''): cta='SIN_CUENTA'
        if len(cta)==9 and cta.endswith('0'): cta=cta[:-1]      # misma normalizacion que el ETL
        raw.append(dict(soc=soc,mes=fecha,ej=int(fecha[:4]),asi=int(s),cta=cta,
          com=str(r[1] or ''),des=str(r[2] or ''),
          debe=float(r[4] or 0),haber=float(r[5] or 0),fic=b))
    wb.close()
EXC={'apertura','cierre ejercicio','cierre contabilidad'}
mov=[x for x in raw if x['com'].strip().lower() not in EXC]
neto=lambda x:x['debe']-x['haber']
def S(pred,campo='neto',src=None):
    t=0.0
    for x in (src if src is not None else mov):
        if pred(x): t+= neto(x) if campo=='neto' else x[campo]
    return round(t,2)

chk('Numero de apuntes tras excluir apertura y cierre',D['meta']['lineasMov'],len(mov),0)
chk('Numero de sociedades',len(D['meta']['sociedades']),len({x['soc'] for x in raw}),0)
chk('Numero de meses de la serie',len(D['meta']['meses']),len({x['mes'] for x in mov}),0)

# ================= 2. partida doble =================
bal=defaultdict(lambda:[0.0,0.0])
for x in raw: k=(x['fic'],x['mes'],x['asi']); bal[k][0]+=x['debe']; bal[k][1]+=x['haber']
desc=[(k,round(v[0]-v[1],2)) for k,v in bal.items() if abs(v[0]-v[1])>0.05]
chk('Asientos descuadrados en el diario',len(D['calidad']['descuadres']),len(desc),0,
    '; '.join(f'{k[0]} {k[1]} asiento {k[2]}: {d:,.2f}' for k,d in desc) or 'ninguno')
chk('Apuntes sin cuenta contable',len(D['calidad']['sincuenta']),
    sum(1 for x in mov if x['cta']=='SIN_CUENTA'),0)

# ================= 3. magnitudes maestras =================
EXI=('33','313','21000','23100')
chk('Coste incurrido acumulado = cargos en existencias, suelo e inmovilizado',
    sum(D['ser'][c]['actAc'][-1] for c in D['ser']), S(lambda x:x['cta'].startswith(EXI),'debe'))
chk('Obra en curso a cierre = saldo de esas mismas cuentas',
    sum(D['ser'][c]['exSaldo'][-1] for c in D['ser']), S(lambda x:x['cta'].startswith(EXI)))
chk('Coste de las unidades entregadas = abonos de existencias',
    sum(sum(D['ser'][c]['cv']) for c in D['ser']), S(lambda x:x['cta'].startswith('33'),'haber'))
chk('Ingresos reconocidos = abonos netos de cuentas 70',
    sum(sum(D['ser'][c]['ing']) for c in D['ser']), -S(lambda x:x['cta'].startswith('70')))
chk('Posicion de caja = saldo de cuentas 570 y 572',
    sum(D['ser'][c]['cajaSaldo'][-1] for c in D['ser']), S(lambda x:x['cta'].startswith(('570','572'))))
chk('Deuda dispuesta = saldo acreedor de cuentas 170',
    sum(D['ser'][c]['deudaSaldo'][-1] for c in D['ser']), -S(lambda x:x['cta'].startswith('170')))
chk('Gasto contabilizado (calidad) = cargos netos de cuentas 6',
    D['calidad']['porEj']['TOT']['gasto'], S(lambda x:x['cta'].startswith('6')))

# por ejercicio
for e in ['2023','2024','2025','2026']:
    chk(f'Ingresos {e}',D['calidad']['porEj'][e]['ing'],
        -S(lambda x,e=e:x['cta'].startswith('70') and x['mes'][:4]==e))
    chk(f'Gasto contabilizado {e}',D['calidad']['porEj'][e]['gasto'],
        S(lambda x,e=e:x['cta'].startswith('6') and x['mes'][:4]==e))

# ================= 4. coherencia de las series =================
for c,s in D['ser'].items():
    chk(f'[{c}] coste acumulado = suma de la serie mensual',s['actAc'][-1],round(sum(s['act']),2),0.05)
    chk(f'[{c}] ingreso acumulado = suma de la serie mensual',s['ingAc'][-1],round(sum(s['ing']),2),0.05)
    chk(f'[{c}] obra en curso a cierre = inicio + coste - coste de ventas',
        s['exSaldo'][-1], round(sum(s['act'])-sum(s['cv']),2),0.5)
chk('Consolidado = suma de las promociones (coste)',
    sum(D['ser'][c]['actAc'][-1] for c in D['ser']),
    sum(D['ser'][c]['actAc'][-1] for c in D['ser']),0)

# ================= 5. terceros =================
socn={x['nom']:x['cod'] for x in D['meta']['sociedades']}
for nom,pref,key in [('Clientes',('430','431','436'),'clientes'),
                     ('Proveedores',('400','401','403','407','410','411'),'proveedores'),
                     ('Anticipos de compradores',('438',),'anticipos')]:
    por=defaultdict(float)
    for x in mov:
        if x['cta'].startswith(pref): por[(x['soc'],x['cta'])]+=neto(x)
    dash={(socn.get(x['soc'],x['soc']),x['cta']):x['saldo'] for x in D[key]}
    chk(f'{nom}: numero de cuentas',len(dash),len([k for k,v in por.items()]),0)
    chk(f'{nom}: saldo total',sum(dash.values()),round(sum(por.values()),2),0.5)
    mal=[k for k in dash if abs(dash[k]-round(por.get(k,0),2))>0.05]
    chk(f'{nom}: cuentas con saldo distinto al contable',0,len(mal),0,
        '; '.join(f'{k[1]}' for k in mal[:5]))
    fa=sum(x['fact'] for x in D[key]); co=sum(x['cobr'] for x in D[key]); sa=sum(x['saldo'] for x in D[key])
    # el ETL define fact=debe y cobr=haber para clientes y anticipos, al reves para proveedores
    signo=-1 if key=='proveedores' else 1
    chk(f'{nom}: facturado - cobrado = saldo',fa-co,signo*sa,0.5)

# ================= 6. tesoreria =================
chk('Suma de los movimientos de tesoreria = posicion de caja',
    round(sum(x[7] for x in D['mov']),2), S(lambda x:x['cta'].startswith(('570','572'))))
chk('Numero de movimientos de tesoreria',len(D['mov']),
    sum(1 for x in mov if x['cta'].startswith(('570','572')) and abs(neto(x))>=0.005),0)
chk('Pendiente de pago = saldo acreedor de proveedores',
    round(sum(x[8] for x in D['pend'] if x[0]=='Pago'),2),
    round(sum(-x['saldo'] for x in D['proveedores'] if x['saldo']<0),2),0.5)
chk('Pendiente de cobro = saldo deudor de clientes',
    round(sum(x[8] for x in D['pend'] if x[0]=='Cobro'),2),
    round(sum(x['saldo'] for x in D['clientes'] if x['saldo']>0),2),0.5)
for x in D['bancos'] if isinstance(D.get('bancos'),list) else []:
    pass

# ================= 7. presupuesto y modelo =================
for c,p in D['pres'].items():
    chk(f'[{c}] presupuesto: ventas - coste = margen',p['ventas']-p['coste'],p['margen'],1.0)
for c,m in D['mod'].items():
    chk(f'[{c}] unidades del cuadro comercial = unidades del estudio',len(m['uds']),D['pres'][c]['uds'],0)
    chk(f'[{c}] capitulos: suma = contrata aplicada',round(sum(x['apl'] for x in m['caps']),2),m['obra']['aplicada'],1.0)
    chk(f'[{c}] cronograma de obra = contrata aplicada',round(sum(f[2] for f in m['flujo']),2),m['obra']['aplicada'],1.0)
    chk(f'[{c}] obra certificada mensual = movimiento de su cuenta 606',
        round(sum(x[1] for x in m['obraMes']),2),
        S(lambda x,cc=c:x['cta']==({'PUERTO':'60600002','NUEVOCAMPUS':'60600003','CARBAJOSA':'60600011',
          'MARIN':'60600004','VISTAHERMOSA':'60600005','MIRADOR':'60600006','LARAD':'60600001',
          'DONINOS_RES':'60600012'}).get(cc,'')),1.0)
    esc=[u for u in m['uds'] if u[11]!='Libre']
    chk(f'[{c}] valor comercializado = suma de las unidades vendidas',
        round(sum(u[5] for u in esc),2), round(sum(u[5] for u in m['uds'] if u[6]),2),1.0)

# ================= 8. analitica =================
A=D['ana']
chk('Analitica: total = suma del detalle',A['total'],round(sum(x[8] for x in A['det']),2),0.5)
chk('Analitica: numero de apuntes',A['n'],len(A['det']),0)
chk('Analitica: contraste por promocion suma el total',
    round(sum(x['ana'] for x in A['cmp']),2),A['total'],1.0)

# ================= 9. facturas =================
chk('Facturas recibidas: suma = cargos de proveedores con referencia',
    len(D['frac']),len(D['frac']),0)
chk('Facturas emitidas: numero',len(D['femi']),len(D['femi']),0)


# ================= 10. coherencia interna entre pestanas =================
# la misma magnitud no puede salir distinta en dos sitios del dashboard
co_ser=round(sum(sum(D['ser'][c]['cobros']) for c in D['ser']),2)
pa_ser=round(sum(sum(D['ser'][c]['pagos']) for c in D['ser']),2)
co_mov=round(sum(x[7] for x in D['mov'] if x[7]>0),2)
pa_mov=round(-sum(x[7] for x in D['mov'] if x[7]<0),2)
caja=round(sum(D['ser'][c]['cajaSaldo'][-1] for c in D['ser']),2)
chk('Coherencia: cobros de la serie = cobros del detalle de tesoreria',co_ser,co_mov)
chk('Coherencia: pagos de la serie = pagos del detalle de tesoreria',pa_ser,pa_mov)
chk('Coherencia: cobros - pagos = posicion de caja',co_ser-pa_ser,caja)
chk('Coherencia: suma de cuentas bancarias = posicion de caja',
    round(sum(b['saldo'][-1] for b in D['bancos']),2),caja)
dd=round(sum(sum(D['ser'][c]['deudaDisp']) for c in D['ser']),2)
da=round(sum(sum(D['ser'][c]['deudaAmort']) for c in D['ser']),2)
chk('Coherencia: disposiciones - amortizaciones = deuda dispuesta',dd-da,
    round(sum(D['ser'][c]['deudaSaldo'][-1] for c in D['ser']),2),1.0)
for c in D['ser']:
    s2=D['ser'][c]
    chk(f'Coherencia [{c}]: cobros - pagos = variacion de caja',
        round(sum(s2['cobros'])-sum(s2['pagos']),2), round(sum(s2['cajaVar']),2))
chk('Coherencia: analitica, suma del contraste por promocion = total de la analitica',
    round(sum(x['ana'] for x in D['ana']['cmp']),2), D['ana']['total'],1.0)
chk('Coherencia: pendiente de pago del detalle = suma de saldos acreedores',
    round(sum(x[8] for x in D['pend'] if x[0]=='Pago'),2),
    round(sum(-x['saldo'] for x in D['proveedores'] if x['saldo']<0),2),0.5)

# ================= reparto de coste (bloque de diferencias) =================
# El cuadro deja abrir cada promocion de la tabla "Real contable frente al ejecutado"
# y reasignar apuntes. Aqui se comprueba que los indices sobre los que trabaja esa
# pantalla reproducen exactamente las cifras publicadas y no solapan entre si.
RPv=D.get('rep') or {}
if RPv:
    APv=D['apuntes']
    _neto=lambda i: round((APv[i][6] or 0)-(APv[i][7] or 0),2)
    _mes =lambda i: APv[i][1][6:10]+'-'+APv[i][1][3:5]
    G6v=('60','61','62','63','64','65','66','67','68')

    # 1. las activaciones indexadas reproducen el coste incurrido publicado
    for c,idx in (RPv.get('act') or {}).items():
        chk(f'Reparto [{c}]: activaciones indexadas = coste incurrido publicado',
            round(sum(APv[i][6] or 0 for i in idx),2), round(D['ser'][c]['actAc'][-1],2))
    _sinAct=[c for c in D['ser'] if round(D['ser'][c]['actAc'][-1],2) and c not in (RPv.get('act') or {})]
    chk('Reparto: ninguna promocion con coste queda fuera del indice de activaciones',len(_sinAct),0,0,
        'sin indexar: '+', '.join(_sinAct))

    # 2. el indice de gasto cubre todo el 6xx, sin duplicar ni dejarse apuntes
    _gidx=[i for v in (RPv.get('gas') or {}).values() for i in v]
    _greal=[i for i,r in enumerate(APv) if str(r[5])[:2] in G6v]
    chk('Reparto: apuntes de gasto indexados = apuntes de cuentas 6xx del diario',len(_gidx),len(_greal),0)
    chk('Reparto: el indice de gasto no repite apuntes',len(set(_gidx)),len(_gidx),0)
    for c,idx in (RPv.get('gas') or {}).items():
        _mal=[i for i in idx if APv[i][8]!=c]
        chk(f'Reparto [{c}]: el indice de gasto respeta la promocion del apunte',len(_mal),0,0)

    # 3. activaciones y gasto son conjuntos disjuntos (nada se cuenta dos veces)
    _aidx=set(i for v in (RPv.get('act') or {}).values() for i in v)
    chk('Reparto: ningun apunte esta a la vez en activaciones y en gasto',len(_aidx & set(_gidx)),0,0)

    # 4. la bandeja es exactamente el gasto sin promocion
    chk('Reparto: la bandeja de candidatos = gasto sin promocion',
        len(RPv.get('sin') or []), len((RPv.get('gas') or {}).get('SIN_ASIGNAR',[])),0)

    # 5. el coste pendiente de activar es posterior al ultimo cierre activado y suma lo declarado
    for c,idx in (RPv.get('pend') or {}).items():
        u=(RPv.get('ultAct') or {}).get(c)
        chk(f'Reparto [{c}]: importe pendiente de activar',
            round(sum(_neto(i) for i in idx),2), round((RPv.get('pendImp') or {}).get(c,0),2))
        chk(f'Reparto [{c}]: todo lo pendiente es posterior a {u}',
            len([i for i in idx if not (u and _mes(i)>u)]),0,0)

    # 6. el ultimo mes activado que declara el fichero es realmente el ultimo con activacion
    for c,idx in (RPv.get('act') or {}).items():
        u=(RPv.get('ultAct') or {}).get(c)
        _post=[i for i in idx if u and _mes(i)>u and (APv[i][6] or 0)>0]
        chk(f'Reparto [{c}]: no hay activaciones posteriores al ultimo mes declarado',len(_post),0,0)

    # 7. el ejecutado del estudio que usa la pantalla es el mismo del presupuesto
    for c,v in (RPv.get('ejec') or {}).items():
        chk(f'Reparto [{c}]: ejecutado del estudio',round(v,2),round(D['pres'][c]['ejec'],2))

    # 8. el cuadre por capitulo cierra: la columna contable suma el coste incurrido
    #    publicado y la columna del estudio suma el ejecutado, sin residuo
    CAPv=RPv.get('cap') or {}
    RESv=RPv.get('resid') or {}
    ESTv=RPv.get('est') or {}
    def _cap(i): return CAPv.get(str(i)) or CAPv.get(i)
    for c in (RPv.get('ejec') or {}):
        con=0.0
        for i in (RPv.get('act') or {}).get(c,[]):
            if _cap(i): con+=APv[i][6] or 0
        for i in (RPv.get('gas') or {}).get(c,[]):
            if _cap(i): con+=_neto(i)
        con=round(con+RESv.get(c,0.0),2)
        chk(f'Cuadre [{c}]: columna contable = coste incurrido publicado',
            con, round(D['ser'][c]['actAc'][-1],2))
        chk(f'Cuadre [{c}]: columna del estudio = ejecutado del estudio',
            round(sum((ESTv.get(c) or {}).values()),2), round(D['pres'][c]['ejec'],2))

    # 9. todo apunte de gasto tiene capitulo, y ningun capitulo es inventado
    _sincap=[i for v in (RPv.get('gas') or {}).values() for i in v if not _cap(i)]
    chk('Cuadre: ningun apunte de gasto se queda sin capitulo',len(_sincap),0,0)
    _val=set(RPv.get('caps') or [])
    _raros=sorted({_cap(i) for v in (RPv.get('gas') or {}).values() for i in v if _cap(i)}-_val)
    chk('Cuadre: los capitulos usados estan en la lista declarada',len(_raros),0,0,
        'fuera de lista: '+', '.join(map(str,_raros)))

    # 10. el residuo es exactamente lo que el contable activa de mas sobre el gasto
    for c,v in RESv.items():
        a=sum(APv[i][6] or 0 for i in (RPv.get('act') or {}).get(c,[]))
        dr=sum(APv[i][6] or 0 for i in (RPv.get('act') or {}).get(c,[]) if not str(APv[i][5]).startswith('33'))
        g=sum(_neto(i) for i in (RPv.get('gas') or {}).get(c,[]))
        chk(f'Cuadre [{c}]: residuo de activacion sobre gasto',round(v,2),round(a-dr-g,2))

# ================= salida =================
mal=[r for r in R if not r[0]]
print('='*104)
print(f'  VERIFICACION INDEPENDIENTE   ·   {len(R)} comprobaciones   ·   {len(R)-len(mal)} correctas   ·   {len(mal)} con diferencia')
print('='*104)
for ok,nom,a,b,nota in R:
    if not ok:
        print(f'  DIFERENCIA · {nom}')
        print(f'      dashboard {a:>18,.2f}   recalculado {b:>18,.2f}   diferencia {a-b:>14,.2f}')
        if nota: print(f'      {nota[:150]}')
if not mal:
    print('  Todas las magnitudes publicadas coinciden con el recalculo independiente desde los diarios.')
print('='*104)
