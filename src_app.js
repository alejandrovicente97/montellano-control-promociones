/* =============================================================================
   Dashboard de control de promociones - Promociones Urbanas Montellano, S.L.
   ============================================================================= */
/* ===================== LÓGICA DEL DASHBOARD (multiejercicio) ===================== */
const CONS='__CONSOLIDADO__', TODOS='TODOS';
const P_ALL=DATA.promos, PMAP=Object.fromEntries(P_ALL.map(p=>[p.cod,p]));
const P_REAL=P_ALL.filter(p=>p.cod!=='SIN_ASIGNAR');
const MESES=DATA.meta.meses, ML=DATA.meta.mesesLbl, NM=MESES.length, EJ=DATA.meta.ejercicios;

const nf=new Intl.NumberFormat('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:'always'});
const nf0=new Intl.NumberFormat('es-ES',{maximumFractionDigits:0,useGrouping:'always'});
const nf1=new Intl.NumberFormat('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1,useGrouping:'always'});
const MLBL=Object.fromEntries(MESES.map((m,i)=>[m,ML[i]]));
const MIDX=Object.fromEntries(MESES.map((m,i)=>[m,i]));
const ULT=MESES[MESES.length-1];
const sum=a=>(a||[]).reduce((x,y)=>x+(y||0),0);
/* Enlace al PDF escaneado de la factura. La ruta es relativa a la carpeta del
   dashboard, asi que funciona al abrirlo desde la carpeta de OneDrive. */
const pdfLink=(ruta,txt)=>ruta
  ? `<a class="pdf" href="${encodeURI(ruta)}" target="_blank" rel="noopener" title="Abrir la factura escaneada">${txt}<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path fill="currentColor" d="M9 1v1.5h3.4L6.2 8.7l1.1 1.1 6.2-6.2V7H15V1H9zM2 3h5v1.5H3.5v8H12V9h1.5v5H2V3z"/></svg></a>`
  : txt;
const z=v=>(typeof v==='number'&&Math.abs(v)<0.005)?0:v;
const eur=v=>(v==null||isNaN(v))?'—':nf.format(z(v))+' €';
const eur0=v=>(v==null||isNaN(v))?'—':nf0.format(z(v))+' €';
const kEur=v=>{if(v==null||isNaN(v))return '—'; v=z(v); const a=Math.abs(v);
  if(a>=1e6)return (v/1e6).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+' M€';
  if(a>=1e3)return (v/1e3).toLocaleString('es-ES',{maximumFractionDigits:0,useGrouping:'always'})+' k€';
  return nf0.format(v)+' €';};
const pct1=v=>(v==null||isNaN(v))?'—':v.toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1})+' %';
const sgn=v=>v>0?'pos':(v<0?'neg':'muted');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const mes1=v=>v==null?'—':(v>=60?'más de 60 meses':v.toLocaleString('es-ES',{maximumFractionDigits:1})+' meses');

/* ---------- estado ---------- */
let SEL=CONS, EJS=TODOS, TAB='res';
function win(){ // [i0,i1] inclusive
  if(EJS===TODOS) return [0,NM-1];
  const idx=MESES.map((m,i)=>[m,i]).filter(([m])=>+m.slice(0,4)===+EJS).map(([,i])=>i);
  return [idx[0],idx[idx.length-1]];
}
function codes(sel){return sel===CONS?P_ALL.map(p=>p.cod):[sel];}
function codesReal(sel){return sel===CONS?P_REAL.map(p=>p.cod):[sel];}
function S(c,k){return DATA.ser[c]?.[k]||new Array(NM).fill(0);}
function sumW(cods,k){const[a,b]=win();let t=0;cods.forEach(c=>{const s=S(c,k);for(let i=a;i<=b;i++)t+=s[i]||0;});return t;}
function serW(cods,k){const[a,b]=win();const o=[];for(let i=a;i<=b;i++){let t=0;cods.forEach(c=>t+=S(c,k)[i]||0);o.push(t);}return o;}
function lblW(){const[a,b]=win();return ML.slice(a,b+1);}
function endW(cods,k){const[,b]=win();return cods.reduce((t,c)=>t+(S(c,k)[b]||0),0);}
function startW(cods,k){const[a]=win();return a===0?0:cods.reduce((t,c)=>t+(S(c,k)[a-1]||0),0);}

function pnl(sel){
  const cs=codes(sel);
  const ing=sumW(cs,'ing'), cv=sumW(cs,'cv'), act=sumW(cs,'act');
  const ex0=startW(cs,'exSaldo'), ex1=endW(cs,'exSaldo');
  const ingLTD=cs.reduce((t,c)=>t+S(c,'ingAc')[NM-1],0);
  const cvLTD=cs.reduce((t,c)=>t+S(c,'cvAc')[NM-1],0);
  const actLTD=cs.reduce((t,c)=>t+S(c,'actAc')[NM-1],0);
  const nat={};const ejs=EJS===TODOS?EJ:[+EJS];
  cs.forEach(c=>ejs.forEach(e=>{const n=DATA.nat[c]?.[e]||{};for(const k in n)nat[k]=(nat[k]||0)+n[k];}));
  const natT=Object.values(nat).reduce((a,b)=>a+b,0);
  return {ing,cv,act,margen:ing-cv,mpct:ing?100*(ing-cv)/ing:null,ex0,ex1,nat,natT,resto:act-natT,
          ingLTD,cvLTD,actLTD,margenLTD:ingLTD-cvLTD,mpctLTD:ingLTD?100*(ingLTD-cvLTD)/ingLTD:null};
}
function caja(sel){
  const cs=codes(sel);
  const ini=startW(cs,'cajaSaldo'), fin=endW(cs,'cajaSaldo');
  return {ini,fin,co:sumW(cs,'cobros'),pa:sumW(cs,'pagos'),
    mens:serW(cs,'cajaVar'),saldo:serW(cs,'cajaSaldo'),
    cuentas:DATA.bancos.filter(b=>cs.includes(b.promo))};
}
function deuda(sel){
  const cs=codes(sel), [a,b]=win();
  const ls=DATA.deuda.filter(l=>cs.includes(l.promo));
  const dis=ls.reduce((t,l)=>t+l.saldo[b],0);
  let lim=0,hay=false,prev=[];
  codesReal(sel).forEach(c=>{const p=DATA.pres[c];if(!p||!p.limite)return;
    const mine=ls.filter(l=>l.promo===c);
    if(mine.some(l=>l.saldo[b]>0.05)){lim+=p.limite;hay=true;}
    else prev.push({cod:c,limite:p.limite,formalizado:mine.length>0});});
  return {lineas:ls,dispuesto:dis,limite:hay?lim:null,disponible:hay?lim-dis:null,
    pct:hay&&lim?100*dis/lim:null,previstos:prev,
    disp:ls.reduce((t,l)=>{let s=0;for(let i=a;i<=b;i++)s+=l.disp[i];return t+s;},0),
    amort:ls.reduce((t,l)=>{let s=0;for(let i=a;i<=b;i++)s+=l.amort[i];return t+s;},0)};
}
function pres(sel){
  const cs=codesReal(sel).filter(c=>DATA.pres[c]); if(!cs.length)return null;
  const caps={};let p=0,e=0,ventas=0,coste=0,margen=0,lim=0,uds=0;
  cs.forEach(c=>{const x=DATA.pres[c];ventas+=x.ventas;coste+=x.coste;margen+=x.margen;lim+=x.limite||0;uds+=x.uds||0;
    x.caps.forEach(k=>{caps[k.cap]=caps[k.cap]||{pres:0,ejec:0};caps[k.cap].pres+=k.pres;caps[k.cap].ejec+=k.ejec;});});
  Object.values(caps).forEach(v=>{p+=v.pres;e+=v.ejec;});
  const real=cs.reduce((t,c)=>t+S(c,'actAc')[NM-1],0);
  const ingR=cs.reduce((t,c)=>t+S(c,'ingAc')[NM-1],0);
  return {caps,pres:p,ejec:e,ventas,coste,margen,uds,limite:lim,cods:cs,n:cs.length,
    mpct:ventas?100*margen/ventas:0,avance:coste?100*real/coste:0,avanceXls:coste?100*e/coste:0,
    real,ingR,ventasPct:ventas?100*ingR/ventas:0};
}
function burn(sel){
  const c=caja(sel), n=c.mens.length;
  const b3=n?c.mens.slice(-3).reduce((a,x)=>a+x,0)/Math.min(3,n):0;
  const bT=n?c.mens.reduce((a,x)=>a+x,0)/n:0;
  const b=Math.min(b3,bT), d=deuda(sel), disp=d.disponible!=null?d.disponible:0;
  const cap=x=>x==null?null:Math.min(x,60);
  return {b,b3,bT,disp,runway:b<0?cap(c.fin/(-b)):null,runwayTot:b<0?cap((c.fin+disp)/(-b)):null};
}
/* ---------- charts ---------- */
const CH={};
/* Paleta corporativa: azul Montellano #102C57 como base y un acento por promocion.
   Jardines de Carbajosa toma el verde oliva de su propia identidad. */
const ACC={PUERTO:'#1c4183',NUEVOCAMPUS:'#102C57',CARBAJOSA:'#4E6735',DONINOS_RES:'#3b6ea5',
 MARIN:'#2f7d72',VISTAHERMOSA:'#7a5aa6',MIRADOR:'#a8783a',LARAD:'#5b7c99',ISLARUA:'#6b7a8f',
 PTE_VILLANUEVA:'#8a6f4e',SUELO_IND:'#7b8794',NAVES:'#557089',OFICINAS:'#94a1b3',SIN_ASIGNAR:'#98a2b3'};
const acc=c=>ACC[c]||'#102C57';
const SOCN=Object.fromEntries((DATA.meta.sociedades||[]).map(s2=>[s2.cod,s2.nom]));
const COL=['#102C57','#1c4183','#4E6735','#2f7d72','#a8783a','#7a5aa6','#3b6ea5','#6b7a8f','#5b7c99','#8a6f4e','#557089','#7b8794','#94a1b3','#b0bac7','#cbd5e1'];
const inic=n=>n.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ]/g,'').split(/\s+/).filter(w=>w.length>2&&!/^(de|del|la|el|los|las|y|para)$/i.test(w)).slice(0,2).map(w=>w[0].toUpperCase()).join('');
function chart(id,cfg){if(CH[id])CH[id].destroy();const el=document.getElementById(id);if(el)CH[id]=new Chart(el,cfg);}
/* valor del punto sea cual sea la orientacion del grafico */
const val=c=>{const p=c.parsed;if(p==null)return 0;
  if(typeof p==='number')return p;
  return (c.chart?.options?.indexAxis==='y')?(p.x??0):(p.y??p.x??0);};
const gopt={responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
 plugins:{legend:{position:'bottom',labels:{boxWidth:8,boxHeight:8,font:{size:10.5},usePointStyle:true,pointStyle:'circle',padding:14}},
 tooltip:{itemSort:(a,b)=>Math.abs(val(b))-Math.abs(val(a)),
  filter:it=>Math.abs(val(it))>0.5,
  callbacks:{label:c=>' '+c.dataset.label+': '+eur(val(c)),
   footer:it=>{if(it.length<2)return'';const t=it.reduce((s2,x)=>s2+val(x),0);return 'Total: '+eur(t);}}}},
 scales:{x:{grid:{display:false},ticks:{font:{size:10},maxRotation:0,autoSkip:true,maxTicksLimit:14}},
 y:{grid:{color:'#eef1f6'},ticks:{font:{size:10.5},callback:v=>kEur(v)}}}};
function tbl(head,rows){
  let h='<table><thead><tr>'+head.map(x=>`<th class="${x.l?'l':''}">${x.t}</th>`).join('')+'</tr></thead><tbody>';
  h+=rows.map(r=>r.raw!=null
    ? `<tr class="${r.cls||''}" ${r.attr||''}>${r.raw}</tr>`
    : `<tr class="${r.cls||''}" ${r.attr||''}>`+r.c.map((c,i)=>`<td class="${head[i].l?'l':''} ${c.cls||''}">${c.v??c}</td>`).join('')+'</tr>').join('');
  return h+'</tbody></table>';
}
function barPct(p,color){const w=Math.max(0,Math.min(100,p||0));
  return `<div class="rowflex"><div class="bar wfull"><i style="width:${w}%;background:${color}"></i></div><span style="min-width:52px">${pct1(p)}</span></div>`;}
const periodo=()=>EJS===TODOS?`${DATA.meta.periodo}`:(EJS==2026?'01/01/2026 – 31/07/2026':`Ejercicio ${EJS}`);
/* ============================== RESUMEN ============================== */
function vRes(){
  const p=pnl(SEL), c=caja(SEL), d=deuda(SEL), bn=burn(SEL), pr=pres(SEL);
  const k=`<div class="kpis">
   <div class="kpi"><div class="l">Ingresos del periodo</div><div class="v">${kEur(p.ing)}</div><div class="d">Ventas escrituradas y obra facturada</div></div>
   <div class="kpi"><div class="l">Margen de las ventas</div><div class="v ${sgn(p.margen)}">${kEur(p.margen)}</div><div class="d">${p.mpct!=null?pct1(p.mpct)+' sobre ingresos':'sin ventas en el periodo'}</div></div>
   <div class="kpi"><div class="l">Coste incurrido</div><div class="v">${kEur(p.act)}</div><div class="d">Inversión imputada a promociones</div></div>
   <div class="kpi"><div class="l">Obra en curso a cierre</div><div class="v">${kEur(p.ex1)}</div><div class="d">Existencias, suelo e inmovilizado de promoción</div></div>
   <div class="kpi"><div class="l">Posición de caja</div><div class="v ${c.fin<0?'neg':''}">${kEur(c.fin)}</div><div class="d">${c.fin-c.ini>=0?'▲':'▼'} ${kEur(Math.abs(c.fin-c.ini))} en el periodo</div></div>
   <div class="kpi"><div class="l">Préstamo dispuesto</div><div class="v">${kEur(d.dispuesto)}</div><div class="d">${d.disponible!=null?'Disponible '+kEur(d.disponible)+' · '+pct1(d.pct)+' del límite':'Sin línea viva a cierre'}</div></div>
  </div>`;
  let al = bn.b<0
   ? `<div class="alert ${bn.runway<3?'bad':(bn.runway<8?'':'ok')}"><b>Consumo neto de caja de ${eur0(-bn.b)} al mes</b> (escenario más exigente entre la media de los 3 últimos meses, ${eur0(bn.b3)}, y la media del periodo, ${eur0(bn.bT)}). Con la caja actual de ${eur0(c.fin)} la cobertura es de <b>${mes1(bn.runway)}</b>${bn.disp>0?`; sumando el préstamo disponible (${eur0(bn.disp)}) alcanza <b>${mes1(bn.runwayTot)}</b>. El agotamiento de la caja propia marca cuándo hay que empezar a disponer del préstamo.`:'. No hay línea de préstamo viva con disponible para cubrir el déficit.'}</div>`
   : `<div class="alert ok"><b>La caja no consume recursos en el periodo:</b> variación media mensual de ${eur0(bn.b)} y saldo a cierre de ${eur0(c.fin)}${bn.disp>0?`, más ${eur0(bn.disp)} de préstamo disponible`:''}.</div>`;

  const lista=SEL===CONS?P_REAL.map(x=>x.cod):[SEL];
  const rows=lista.map(cd=>{
    const q=pnl(cd), cc=caja(cd), dd=deuda(cd), ps=DATA.pres[cd];
    const av=ps&&ps.coste?100*S(cd,'actAc')[NM-1]/ps.coste:null;
    return {c:[
      {v:`<b>${esc(PMAP[cd].nom)}</b><div class="muted small">${esc(PMAP[cd].tipo)}</div>`},
      {v:`<span class="chip">${esc(PMAP[cd].estado)}</span>`},
      {v:kEur(q.ing)},{v:kEur(q.cv)},{v:kEur(q.margen),cls:sgn(q.margen)},
      {v:q.ing?pct1(q.mpct):'—'},{v:kEur(q.act)},{v:kEur(q.ex1)},
      {v:kEur(cc.fin),cls:cc.fin<0?'neg':''},
      {v:dd.dispuesto?kEur(dd.dispuesto):'<span class="muted">—</span>'},
      {v:dd.disponible!=null?kEur(dd.disponible):'<span class="muted">—</span>'},
      {v:av!=null?barPct(av,av>105?'#b3261e':(av>85?'#b57407':acc(cd))):'<span class="muted">—</span>'},
    ]};});
  if(SEL===CONS){
    const t=lista.reduce((a,cd)=>{const q=pnl(cd),cc=caja(cd),dd=deuda(cd);
      return {ing:a.ing+q.ing,cv:a.cv+q.cv,mg:a.mg+q.margen,act:a.act+q.act,ex:a.ex+q.ex1,
        caja:a.caja+cc.fin,dis:a.dis+dd.dispuesto,disp:a.disp+(dd.disponible||0)};},
      {ing:0,cv:0,mg:0,act:0,ex:0,caja:0,dis:0,disp:0});
    rows.push({cls:'tot',c:[{v:'TOTAL promociones y proyectos'},{v:''},{v:kEur(t.ing)},{v:kEur(t.cv)},
      {v:kEur(t.mg),cls:sgn(t.mg)},{v:t.ing?pct1(100*t.mg/t.ing):'—'},{v:kEur(t.act)},{v:kEur(t.ex)},
      {v:kEur(t.caja)},{v:kEur(t.dis)},{v:kEur(t.disp)},{v:''}]});
  }
  const head=[{t:'Promoción',l:1},{t:'Estado',l:1},{t:'Ingresos'},{t:'Coste ventas'},{t:'Margen'},{t:'% mg'},
    {t:'Coste incurrido'},{t:'Obra en curso'},{t:'Caja'},{t:'Ptmo. dispuesto'},{t:'Disponible'},{t:'Avance econ.'}];

  let bandeja='';
  if(SEL===CONS){
    const q=DATA.calidad, e=EJS===TODOS?'TOT':String(EJS), cq=q.porEj[e];
    bandeja=`<div class="card"><h3>Bandeja «Sin asignar» <span class="note">gasto de estructura, no imputable a una promoción</span></h3><div class="cbody">
     ${tbl([{t:'Bandeja',l:1},{t:'Contenido',l:1},{t:'Importe'},{t:'% s/ gasto contabilizado'}],[
       {c:[{v:'<b>Estructura y partidas sin criterio</b>'},{v:'Personal, tributos genéricos, servicios centrales, amortizaciones e intereses con el grupo: gasto de la sociedad, no de una promoción concreta'},{v:eur(cq.sin)},{v:pct1(cq.pct_sin)}]},
     ])}
     <div class="legend"><b>Importante:</b> esto afecta solo al desglose <i>por naturaleza</i>. El coste incurrido <i>por promoción</i> está asignado al ${pct1(q.pctActAsig)}, porque la imputación la resuelve el asiento mensual de variación de existencias, que sí distingue promoción y fase.</div>
     </div></div>`;
  }
  /* ---------- cierre a fecha: mes vigente vs anterior vs mismo mes del año anterior ---------- */
  const iU=NM-1, iA=NM-2, iY=NM-13;
  const cz=codes(SEL);
  const mv=(k,i2)=>i2>=0?cz.reduce((t2,c)=>t2+(S(c,k)[i2]||0),0):null;
  const sv=(k,i2)=>i2>=0?cz.reduce((t2,c)=>t2+(S(c,k)[i2]||0),0):null;
  const MET=[
    ['Ingresos reconocidos','ing','flujo'],
    ['Coste incurrido','act','flujo'],
    ['Obra en curso','exSaldo','saldo'],
    ['Posición de caja','cajaSaldo','saldo'],
    ['Deuda con entidades','deudaSaldo','saldo'],
  ];
  const rc=MET.map(([nom,k])=>{
    const a=mv(k,iU), b=mv(k,iA), c2=mv(k,iY);
    const dm=(a!=null&&b!=null)?a-b:null, da=(a!=null&&c2!=null)?a-c2:null;
    return {c:[{v:'<b>'+nom+'</b>'},{v:eur(a)},{v:b!=null?eur(b):'—'},
      {v:dm!=null?eur(dm):'—',cls:sgn(dm)},{v:(dm!=null&&Math.abs(b)>1)?pct1(100*dm/Math.abs(b)):'<span class="muted">—</span>'},
      {v:c2!=null?eur(c2):'—'},{v:da!=null?eur(da):'—',cls:sgn(da)}]};});
  /* las tres desviaciones que explican el movimiento del coste incurrido */
  const movP=codesReal(SEL).map(c=>({c,v:(S(c,'act')[iU]||0)-(S(c,'act')[iA]||0)}))
    .filter(x=>Math.abs(x.v)>500).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v)).slice(0,3);
  const dAct=(mv('act',iU)||0)-(mv('act',iA)||0);
  const cierreCard=`<div class="card"><h3>Cierre a ${esc(ML[iU])} <span class="note">mes vigente frente al anterior y al mismo mes del año pasado</span></h3><div class="cbody">
    ${tbl([{t:'Concepto',l:1},{t:esc(ML[iU])},{t:esc(ML[iA]||'—')},{t:'Var. mes'},{t:'%'},{t:esc(ML[iY]||'—')},{t:'Var. interanual'}],rc)}
    ${movP.length?`<div class="legend"><b>Qué explica el movimiento del mes.</b> El coste incurrido ${dAct>=0?'sube':'baja'} ${eur0(Math.abs(dAct))} respecto a ${esc(ML[iA])}, y lo explican `+
      movP.map(x=>`<b>${esc(PMAP[x.c].nom)}</b> con ${eur0(x.v)}`).join(', ')+
      `, que suman ${eur0(movP.reduce((a,x)=>a+x.v,0))} de los ${eur0(dAct)} de variación.</div>`:''}
    </div></div>`;
  return k+al+cierreCard+`
  <div class="grid2">
    <div class="card"><h3>Coste incurrido por mes <span class="note">imputación a existencias, suelo e inmovilizado</span></h3><div class="cbody"><div class="chartbox"><canvas id="c1"></canvas></div><div class="legend">Hasta 2024 la variación de existencias se contabilizaba una vez al año, por eso el coste de 2023 y 2024 aparece concentrado en diciembre. Desde 2025 la imputación es mensual.</div></div></div>
    <div class="card"><h3>Evolución de la caja <span class="note">saldo acumulado de las cuentas de la promoción</span></h3><div class="cbody"><div class="chartbox"><canvas id="c2"></canvas></div></div></div>
  </div>
  <div class="card"><h3>Cuadro de mando por promoción <span class="note">${periodo()}</span></h3><div class="cbody scroll">${tbl(head,rows)}</div></div>`;
  /* Fuera de Resumen, a propósito: la inversión acumulada ya es una columna del
     cuadro de mando, la obra en curso y la deuda viven en sus pestañas, y la
     bandeja de estructura está en el respaldo de Conciliación. Menos y mejor. */
}
function cRes(){
  const cs=SEL===CONS?P_REAL.map(p=>p.cod):[SEL], L=lblW();
  chart('c1',{type:'bar',data:{labels:L,datasets:cs.filter(c=>serW([c],'act').some(v=>v>0))
    .map((c,i)=>({label:PMAP[c].nom,data:serW([c],'act'),backgroundColor:acc(c),borderRadius:2,stack:'a'}))},
    options:{...gopt,scales:{...gopt.scales,x:{...gopt.scales.x,stacked:true},y:{...gopt.scales.y,stacked:true}}}});
  const c=caja(SEL);
  chart('c2',{type:'line',data:{labels:L,datasets:[
    {label:'Saldo de caja',data:c.saldo,borderColor:acc(SEL===CONS?'NUEVOCAMPUS':SEL),backgroundColor:'rgba(16,44,87,.08)',fill:true,tension:.3,pointRadius:0},
    {label:'Variación del mes',data:c.mens,type:'bar',backgroundColor:'#a8783a'}]},options:gopt});
}

/* ============================== P&L ============================== */
const NORD=['Suelo','Obra','Honorarios técnicos','Tasas e impuestos','Acometidas','Comercial','Jurídicos','Seguros','Seguros y avales','Financieros','Estructura','Amortizaciones','Var. existencias','Otros'];
function vPyg(){
  const p=pnl(SEL), pr=pres(SEL);
  const r1=[{cls:'sub2',c:[{v:'INGRESOS'},{v:''},{v:''}]},
    {c:[{v:'Ventas de promoción y obra facturada'},{v:eur(p.ing)},{v:p.ing?'100,0 %':'—'}]},
    {cls:'sub2',c:[{v:'COSTE DE LAS VENTAS'},{v:''},{v:''}]},
    {c:[{v:'Coste de las unidades entregadas (salida de existencias)'},{v:eur(-p.cv),cls:'neg'},{v:p.ing?pct1(100*p.cv/p.ing):'—'}]},
    {cls:'tot',c:[{v:'MARGEN DE LAS VENTAS'},{v:eur(p.margen),cls:sgn(p.margen)},{v:p.mpct!=null?pct1(p.mpct):'—'}]}];
  const nats=Object.entries(p.nat).sort((a,b)=>NORD.indexOf(a[0])-NORD.indexOf(b[0]));
  const r2r=nats.map(([k,v])=>({c:[{v:k},{v:eur(v)},{v:p.act?pct1(100*v/p.act):'—'}]}));
  if(Math.abs(p.resto)>1)r2r.push({c:[{v:'Resto de coste incurrido <span class="muted small">(suelo, inmovilizado y partidas sin desglose de naturaleza)</span>'},{v:eur(p.resto)},{v:p.act?pct1(100*p.resto/p.act):'—'}]});
  r2r.push({cls:'tot',c:[{v:'Total coste incurrido del periodo'},{v:eur(p.act)},{v:'100,0 %'}]});
  const r3=[{c:[{v:'Obra en curso al inicio del periodo'},{v:eur(p.ex0)}]},
    {c:[{v:'(+) Coste incurrido en el periodo'},{v:eur(p.act),cls:'pos'}]},
    {c:[{v:'(−) Coste de las unidades entregadas'},{v:eur(-p.cv),cls:'neg'}]},
    {cls:'tot',c:[{v:'Obra en curso a cierre del periodo'},{v:eur(p.ex1)}]}];

  let ltd='';
  if(EJS!==TODOS||true){
    ltd=`<div class="card"><h3>Vida completa de la promoción <span class="note">acumulado 2023 – 31/07/2026 según contabilidad</span></h3><div class="cbody">
      ${tbl([{t:'Magnitud',l:1},{t:'Real acumulado'},{t:'Estudio económico'},{t:'% ejecutado'}],[
        {c:[{v:'Ingresos por ventas'},{v:eur(p.ingLTD)},{v:pr?eur(pr.ventas):'<span class="muted">—</span>'},{v:pr&&pr.ventas?pct1(100*p.ingLTD/pr.ventas):'—'}]},
        {c:[{v:'Coste de las unidades entregadas'},{v:eur(p.cvLTD)},{v:'<span class="muted">—</span>'},{v:''}]},
        {cls:'tot',c:[{v:'Margen realizado sobre lo entregado'},{v:eur(p.margenLTD)+(p.mpctLTD!=null?' <span class="pill">'+pct1(p.mpctLTD)+'</span>':''),cls:sgn(p.margenLTD)},
          {v:pr?eur(pr.margen)+' <span class="pill">'+pct1(pr.mpct)+'</span>':'<span class="muted">—</span>'},{v:''}]},
        {c:[{v:'Coste incurrido acumulado'},{v:eur(p.actLTD)},{v:pr?eur(pr.coste):'<span class="muted">—</span>'},{v:pr&&pr.coste?pct1(100*p.actLTD/pr.coste):'—'}]},
      ])}
      ${pr&&p.mpctLTD!=null?`<div class="alert ${p.mpctLTD<pr.mpct-2?'bad':(p.mpctLTD<pr.mpct?'':'ok')}" style="margin-top:12px">
        El margen realizado sobre las unidades ya entregadas es del <b>${pct1(p.mpctLTD)}</b> frente al <b>${pct1(pr.mpct)}</b> del estudio económico:
        <b>${pct1(Math.abs(p.mpctLTD-pr.mpct))}</b> ${p.mpctLTD<pr.mpct?'por debajo':'por encima'} del objetivo${p.mpctLTD<pr.mpct?`, equivalente a ${eur0(p.ingLTD*(pr.mpct-p.mpctLTD)/100)} de margen sobre lo ya vendido.`:'.'}</div>`:''}
      <div class="legend">El «Real acumulado» procede íntegramente de los diarios contables de 2023 a 2026, no de la columna <i>Ejecutado</i> del estudio económico.</div>
      </div></div>`;
  }
  const poco=p.act&&Math.abs(p.resto)/Math.abs(p.act)>0.7;
  const cs=codes(SEL);
  const ventas=(DATA.femi||[]).filter(f=>cs.includes(f[5])&&(EJS===TODOS||f[6]==EJS)).sort((a,b)=>b[4]-a[4]);
  /* composicion del consolidado */
  let comp='',subt=periodo();
  if(SEL===CONS){
    const filas=P_ALL.map(cd=>({cd,q:pnl(cd)})).filter(x=>Math.abs(x.q.ing)>0.5||Math.abs(x.q.cv)>0.5||Math.abs(x.q.act)>0.5)
      .sort((a,b)=>b.q.ing-a.q.ing||b.q.act-a.q.act);
    const conVenta=filas.filter(x=>Math.abs(x.q.ing)>0.5);
    subt=`${periodo()} · suma de ${filas.length} promociones y proyectos`;
    const rr=filas.map(x=>({c:[
      {v:`<b>${esc(PMAP[x.cd].nom)}</b><div class="muted small">${esc(PMAP[x.cd].tipo)}</div>`},
      {v:kEur(x.q.ing)},{v:p.ing?pct1(100*x.q.ing/p.ing):'—'},{v:kEur(x.q.cv)},
      {v:kEur(x.q.margen),cls:sgn(x.q.margen)},{v:x.q.ing?pct1(x.q.mpct):'<span class="muted">—</span>'},
      {v:kEur(x.q.act)},{v:p.act?pct1(100*x.q.act/p.act):'—'}]}));
    rr.push({cls:'tot',c:[{v:'TOTAL CONSOLIDADO'},{v:kEur(p.ing)},{v:'100,0 %'},{v:kEur(p.cv)},
      {v:kEur(p.margen),cls:sgn(p.margen)},{v:p.mpct!=null?pct1(p.mpct):'—'},{v:kEur(p.act)},{v:'100,0 %'}]});
    comp=`<div class="card"><h3>Composición del consolidado <span class="note">qué promociones forman cada cifra</span></h3><div class="cbody scroll">
      ${tbl([{t:'Promoción o proyecto',l:1},{t:'Ingresos'},{t:'% ing.'},{t:'Coste ventas'},{t:'Margen'},{t:'% mg'},{t:'Coste incurrido'},{t:'% coste'}],rr)}
      <div class="legend">${conVenta.length?`Aportan ingresos en el periodo: <b>${conVenta.map(x=>esc(PMAP[x.cd].nom)).join(', ')}</b>. `:''}El resto están en fase de suelo, proyecto u obra y solo acumulan coste, sin ingresos reconocidos todavía.</div>
      </div></div>`;
  } else {
    const so=PMAP[SEL].soc||[];
    subt=`${periodo()}${so.length?' · '+so.join(' + '):''}`;
  }
  /* ---- desglose ampliado en desplegables ---- */
  const [wa,wb]=win();
  const M2=MESES.slice(wa,wb+1), L2=ML.slice(wa,wb+1);
  const sI=serW(cs,'ing'),sC=serW(cs,'cv'),sA=serW(cs,'act'),sE=serW(cs,'exSaldo');
  const filasMes=M2.map((m,i)=>{const ing=sI[i],cv=sC[i],mg=ing-cv;
    return {c:[{v:L2[i]},{v:ing?eur(ing):'<span class="muted">—</span>'},{v:cv?eur(cv):'<span class="muted">—</span>'},
      {v:eur(mg),cls:sgn(mg)},{v:ing?pct1(100*mg/ing):'<span class="muted">—</span>'},
      {v:sA[i]?eur(sA[i]):'<span class="muted">—</span>'},{v:eur(sE[i])}]};})
   .filter((r,i)=>Math.abs(sI[i])>0.5||Math.abs(sC[i])>0.5||Math.abs(sA[i])>0.5);
  const totM={i:sI.reduce((a,b)=>a+b,0),c:sC.reduce((a,b)=>a+b,0),a:sA.reduce((a,b)=>a+b,0)};
  filasMes.push({cls:'tot',c:[{v:'TOTAL'},{v:eur(totM.i)},{v:eur(totM.c)},{v:eur(totM.i-totM.c),cls:sgn(totM.i-totM.c)},
    {v:totM.i?pct1(100*(totM.i-totM.c)/totM.i):'—'},{v:eur(totM.a)},{v:eur(sE[sE.length-1])}]});

  const porSoc={};
  DATA.apuntes.filter(x=>cs.includes(x[8])&&(EJS===TODOS||x[10]==EJS)).forEach(x=>{
    const g=String(x[5]);
    const esIng=/^70/.test(g), esGas=/^6/.test(g)&&!/^61/.test(g);
    if(!esIng&&!esGas)return;
    const k=x[0]||'—'; const o=(porSoc[k]=porSoc[k]||{ing:0,gas:0});
    if(esIng) o.ing+=(x[7]-x[6]); else o.gas+=(x[6]-x[7]);});
  const socOrd=Object.keys(porSoc).sort((a,b)=>(porSoc[b].ing+porSoc[b].gas)-(porSoc[a].ing+porSoc[a].gas));

  const rat=[
    ['Margen bruto sobre ingresos',p.ing?pct1(p.mpct):'—','Margen de las unidades entregadas'],
    ['Coste de ventas sobre ingresos',p.ing?pct1(100*p.cv/p.ing):'—','Cuánto del ingreso se lleva el coste de la unidad entregada'],
    ['Facturas emitidas en el periodo',nf0.format(ventas.length),'Escrituras y facturación de obra registradas'],
    ['Importe medio por factura emitida',ventas.length?eur(ventas.reduce((a,v)=>a+v[4],0)/ventas.length):'—','Ticket medio de las operaciones del periodo'],
    ['Mayor operación del periodo',ventas.length?eur(ventas[0][4]):'—',ventas.length?esc(ventas[0][1]):'Sin operaciones'],
    ['Obra en curso a cierre',eur(p.ex1),'Lo vendido pero no entregado sigue aquí, no en el margen'],
    ['Coste incurrido acumulado',eur(p.act),'Inversión total imputada a la promoción'],
    ['Rotación de la inversión',p.act?pct1(100*p.ing/p.act):'—','Ingresos reconocidos sobre coste incurrido'],
  ];
  const detalles=`
   <div class="card"><h3>Desglose ampliado <span class="note">abre el apartado que necesites</span></h3>
    <details><summary>Cuenta de resultados mes a mes<span class="muted small">${filasMes.length-1} meses con movimiento</span></summary>
     <div class="dbody">${tbl([{t:'Mes',l:1},{t:'Ingresos'},{t:'Coste de ventas'},{t:'Margen'},{t:'% margen'},{t:'Coste incurrido'},{t:'Obra en curso'}],filasMes)}</div></details>
    <details><summary>Indicadores y ratios<span class="muted small">${nf0.format(ventas.length)} operaciones en el periodo</span></summary>
     <div class="dbody">${tbl([{t:'Indicador',l:1},{t:'Valor'},{t:'Lectura',l:1}],rat.map(r=>({c:[{v:'<b>'+r[0]+'</b>'},{v:r[1]},{v:'<span class="muted small">'+r[2]+'</span>'}]})))}</div></details>
    <details><summary>Aportación por sociedad<span class="muted small">${socOrd.length} sociedades · ventas y gasto contabilizado, sin variación de existencias</span></summary>
     <div class="dbody">${socOrd.length?tbl([{t:'Sociedad',l:1},{t:'Ingresos'},{t:'Gasto contabilizado'},{t:'Neto'}],
       socOrd.map(k=>({c:[{v:'<b>'+esc(SOCN[k]||k)+'</b><div class="muted small">'+esc(k)+'</div>'},{v:eur(porSoc[k].ing)},{v:eur(porSoc[k].gas)},{v:eur(porSoc[k].ing-porSoc[k].gas),cls:sgn(porSoc[k].ing-porSoc[k].gas)}]}))
       .concat([{cls:'tot',c:[{v:'TOTAL'},{v:eur(socOrd.reduce((a,k)=>a+porSoc[k].ing,0))},{v:eur(socOrd.reduce((a,k)=>a+porSoc[k].gas,0))},{v:''}]}])):'<div class="muted">Sin movimiento en el periodo.</div>'}</div></details>
    <details><summary>Facturas emitidas del periodo<span class="muted small">${nf0.format(ventas.length)} operaciones · ${kEur(ventas.reduce((a,v)=>a+v[4],0))}</span></summary>
     <div class="dbody">${ventas.length?tbl([{t:'Fecha',l:1},{t:'Cliente',l:1},{t:'Concepto',l:1},{t:'Promoción',l:1},{t:'Importe'}],
       ventas.slice(0,400).map(v=>({c:[{v:v[3]},{v:'<b>'+esc(v[1])+'</b><div class="muted small">'+v[0]+'</div>'},{v:esc(v[2])},{v:'<span class="chip">'+esc(PMAP[v[5]]?.nom||v[5])+'</span>'},{v:eur(v[4])}]}))):'<div class="muted">Sin entregas en el periodo.</div>'}</div></details>
   </div>`;
  return `<div class="grid2">
    <div class="card"><h3>Cuenta de resultados · ${esc(SEL===CONS?'Consolidado':PMAP[SEL].nom)} <span class="note">${esc(subt)}</span></h3><div class="cbody">${tbl([{t:'Concepto',l:1},{t:'Importe'},{t:'% s/ ingresos'}],r1)}
      <div class="legend">El margen recoge únicamente las unidades entregadas y escrituradas en el periodo. Lo vendido pero no entregado permanece en obra en curso.</div></div></div>
    <div class="card"><h3>Coste por naturaleza <span class="note">parte trazable a cuenta contable</span></h3><div class="cbody">${tbl([{t:'Naturaleza',l:1},{t:'Importe'},{t:'% s/ total'}],r2r)}
      <div class="legend">${poco?'<b>En esta promoción el desglose por naturaleza es muy limitado:</b> la mayor parte del coste entra por la cuenta común de Doñinos y por el asiento de variación de existencias, que imputa la promoción pero no la naturaleza. El detalle por capítulos está en la pestaña <i>Presupuesto vs Real</i>.':'El diario identifica la naturaleza únicamente en las cuentas específicas de cada promoción. El resto se imputa a la promoción en el asiento mensual de variación de existencias, sin desglose por naturaleza.'}</div></div></div></div>
  ${comp}${detalles}${ltd}
  <div class="grid2">
    <div class="card"><h3>Ingresos, coste de ventas y margen por mes</h3><div class="cbody"><div class="chartbox"><canvas id="p1"></canvas></div></div></div>
    <div class="card"><h3>Obra en curso</h3><div class="cbody">${tbl([{t:'Movimiento de la obra en curso',l:1},{t:'Importe'}],r3)}<div class="chartbox sm" style="margin-top:10px"><canvas id="p2"></canvas></div>
      <div class="legend">En 2023 y 2024 la variación de existencias se contabilizó una vez al año; desde 2025 es mensual. Por eso el reparto mensual del coste anterior a 2025 aparece concentrado en diciembre.</div></div></div>`;
}
function cPyg(){
  const cs=codes(SEL),L=lblW(),ing=serW(cs,'ing'),cv=serW(cs,'cv');
  chart('p1',{type:'bar',data:{labels:L,datasets:[
    {label:'Ingresos',data:ing,backgroundColor:'#1b7f4d',borderRadius:2},
    {label:'Coste de ventas',data:cv.map(v=>-v),backgroundColor:'#b3261e',borderRadius:2},
    {label:'Margen',data:ing.map((v,i)=>v-cv[i]),type:'line',borderColor:'#102C57',tension:.3,pointRadius:0}]},options:gopt});
  chart('p2',{type:'bar',data:{labels:L,datasets:[{label:'Coste incurrido',data:serW(cs,'act'),backgroundColor:acc(SEL===CONS?'NUEVOCAMPUS':SEL),borderRadius:2}]},
    options:{...gopt,plugins:{...gopt.plugins,legend:{display:false}}}});
}
/* ============================== PRESUPUESTO VS REAL ============================== */
function vPres(){
  const pr=pres(SEL);
  if(!pr) return `<div class="card"><div class="cbody"><div class="alert">Esta selección no tiene estudio económico en los ficheros aportados. Las promociones con presupuesto son: ${P_REAL.filter(p=>p.pres).map(p=>esc(p.nom)).join(', ')}.</div></div></div>`;
  const cod=SEL===CONS?null:SEL, p=pnl(SEL);
  const k=`<div class="kpis">
   <div class="kpi"><div class="l">Coste presupuestado</div><div class="v">${kEur(pr.coste)}</div><div class="d">Vida completa${pr.n>1?' · '+pr.n+' promociones':''}</div></div>
   <div class="kpi"><div class="l">Coste real incurrido</div><div class="v">${kEur(pr.real)}</div><div class="d">Contabilidad 2023 – 07/2026</div></div>
   <div class="kpi"><div class="l">Avance económico</div><div class="v ${pr.avance>100?'neg':''}">${pct1(pr.avance)}</div><div class="d">Real sobre presupuesto</div></div>
   <div class="kpi"><div class="l">${pr.coste-pr.real>=0?'Pendiente de incurrir':'Exceso sobre presupuesto'}</div><div class="v ${pr.coste-pr.real<0?'neg':''}">${kEur(Math.abs(pr.coste-pr.real))}</div><div class="d">${pr.coste-pr.real>=0?'Hasta completar el presupuesto':'Coste real por encima del presupuesto'}</div></div>
   <div class="kpi"><div class="l">Ventas realizadas</div><div class="v">${pct1(pr.ventasPct)}</div><div class="d">${kEur(pr.ingR)} de ${kEur(pr.ventas)}</div></div>
   <div class="kpi"><div class="l">Margen objetivo</div><div class="v ${sgn(pr.margen)}">${kEur(pr.margen)}</div><div class="d">${pct1(pr.mpct)} sobre ventas</div></div>
  </div>`;
  let sem='';
  if(pr.avance>pr.ventasPct+8 && pr.avance>25){
    sem=`<div class="alert ${pr.avance>100?'bad':''}"><b>El coste va por delante de la venta.</b> Se ha incurrido el <b>${pct1(pr.avance)}</b> del presupuesto de costes mientras se ha realizado el <b>${pct1(pr.ventasPct)}</b> de las ventas previstas. ${pr.avance>100?'El coste real ya supera el presupuesto total de la promoción.':'Conviene revisar el calendario de escrituras y el cierre de contratas pendientes.'}</div>`;
  }
  const rows=Object.entries(pr.caps).sort((a,b)=>b[1].pres-a[1].pres).map(([cap,v])=>{
    const des=v.ejec-v.pres, av=v.pres?100*v.ejec/v.pres:0;
    return {c:[{v:'<b>'+esc(cap)+'</b>'},{v:eur(v.pres)},{v:eur(v.ejec)},{v:eur(des),cls:des>0?'neg':'pos'},
      {v:v.pres?pct1(100*des/v.pres):'—',cls:des>0?'neg':'pos'},{v:barPct(av,av>105?'#b3261e':(av>85?'#b57407':'#1c4183'))}]};});
  rows.push({cls:'tot',c:[{v:'TOTAL'},{v:eur(pr.pres)},{v:eur(pr.ejec)},{v:eur(pr.ejec-pr.pres),cls:pr.ejec>pr.pres?'neg':'pos'},
    {v:pr.pres?pct1(100*(pr.ejec-pr.pres)/pr.pres):'—'},{v:barPct(pr.pres?100*pr.ejec/pr.pres:0,'#102C57')}]});
  const desv=Object.entries(pr.caps).map(([cap,v])=>({cap,d:v.ejec-v.pres,p:v.pres?100*(v.ejec-v.pres)/v.pres:0}))
    .filter(x=>Math.abs(x.d)>1000).sort((a,b)=>Math.abs(b.d)-Math.abs(a.d)).slice(0,6);
  const t2=tbl([{t:'Capítulo',l:1},{t:'Desviación'},{t:'%'},{t:'Lectura',l:1}],desv.map(x=>({c:[
    {v:esc(x.cap)},{v:eur(x.d),cls:x.d>0?'neg':'pos'},{v:pct1(x.p),cls:x.d>0?'neg':'pos'},
    {v:x.d>0?'<span class="chip bad">Sobrecoste</span> el ejecutado ya supera el presupuesto del capítulo'
            :'<span class="chip ok">Bajo presupuesto</span> puede ser ahorro real o gasto aún no incurrido'}]})));

  const t0=tbl([{t:'Contraste global',l:1},{t:'Presupuesto'},{t:'Real (contabilidad)'},{t:'Ejecutado (estudio)'},{t:'Avance real'}],[
    {c:[{v:'Coste total de la promoción'},{v:eur(pr.coste)},{v:eur(pr.real)},{v:eur(pr.ejec)},{v:barPct(pr.avance,pr.avance>105?'#b3261e':'#1c4183')}]},
    {c:[{v:'Ventas'},{v:eur(pr.ventas)},{v:eur(pr.ingR)},{v:'<span class="muted">—</span>'},{v:barPct(pr.ventasPct,'#1b7f4d')}]},
  ]);

  let t3='';
  if(cod && DATA.pres[cod]?.cobra?.length){
    const co=DATA.pres[cod].cobra;
    const r=co.map(x=>{const d=x.real-x.contrata,av=x.contrata?100*x.real/x.contrata:0;
      return {c:[{v:x.n+'. '+esc(x.cap)},{v:eur(x.pres)},{v:eur(x.contrata)},{v:eur(x.real)},
        {v:eur(d),cls:d>0?'neg':'pos'},{v:barPct(av,av>105?'#b3261e':(av>85?'#b57407':'#1c4183'))}]};});
    const T=co.reduce((a,x)=>({p:a.p+x.pres,c:a.c+x.contrata,r:a.r+x.real}),{p:0,c:0,r:0});
    r.push({cls:'tot',c:[{v:'TOTAL CAPÍTULOS DE OBRA'},{v:eur(T.p)},{v:eur(T.c)},{v:eur(T.r)},
      {v:eur(T.r-T.c),cls:T.r>T.c?'neg':'pos'},{v:barPct(T.c?100*T.r/T.c:0,'#102C57')}]});
    t3=`<div class="card"><h3>Capítulos de obra · ${esc(PMAP[cod].nom)} <span class="note">contrata aplicada frente a certificado real</span></h3><div class="cbody scroll">${tbl([{t:'Capítulo',l:1},{t:'Presupuesto'},{t:'Contrata aplicada'},{t:'Real'},{t:'Desviación'},{t:'Avance'}],r)}</div></div>`;
  }
  let t4='';
  if(cod && DATA.pres[cod]?.partidas?.length){
    const by={};DATA.pres[cod].partidas.forEach(x=>{(by[x.cap]=by[x.cap]||[]).push(x);});
    t4='';
  }
  return k+sem+`<div class="card"><h3>Presupuesto, real contable y ejecutado del estudio</h3><div class="cbody">${t0}
    <div class="legend">«Real (contabilidad)» es el coste incurrido acumulado que sale de los diarios 2023-2026. «Ejecutado (estudio)» es la columna que mantiene el estudio económico. Las diferencias entre ambos se detallan en la pestaña de calidad de datos.</div></div></div>
  <div class="grid3">
    <div class="card"><h3>Presupuesto frente a ejecutado por capítulo</h3><div class="cbody">${tbl([{t:'Capítulo',l:1},{t:'Presupuestado'},{t:'Ejecutado'},{t:'Desviación'},{t:'% desv.'},{t:'Avance'}],rows)}</div></div>
    
  </div>
  <div class="card"><h3>Desviaciones destacadas</h3><div class="cbody">${desv.length?t2:'<div class="muted">Sin desviaciones relevantes.</div>'}</div></div>
  <div class="card"><h3>Coste incurrido acumulado frente al presupuesto</h3><div class="cbody"><div class="chartbox"><canvas id="r1"></canvas></div></div></div>
  ${t3}${t4}`;
}
function cPres(){
  const pr=pres(SEL);if(!pr)return;
  const cs=pr.cods, L=ML;
  const acum=[];for(let i=0;i<NM;i++)acum.push(cs.reduce((t,c)=>t+S(c,'actAc')[i],0));
  chart('r1',{type:'line',data:{labels:L,datasets:[
    {label:'Coste real acumulado',data:acum,borderColor:'#1c4183',backgroundColor:'rgba(16,44,87,.08)',fill:true,tension:.25,pointRadius:0},
    {label:'Presupuesto total',data:new Array(NM).fill(pr.coste),borderColor:'#b3261e',borderDash:[6,4],pointRadius:0},
    {label:'Ventas acumuladas',data:(()=>{const o=[];for(let i=0;i<NM;i++)o.push(cs.reduce((t,c)=>t+S(c,'ingAc')[i],0));return o;})(),borderColor:'#1b7f4d',tension:.25,pointRadius:0}
  ]},options:gopt});
  const ks=Object.keys(pr.caps).sort((a,b)=>pr.caps[b].pres-pr.caps[a].pres);
  chart('r2',{type:'doughnut',data:{labels:ks,datasets:[{data:ks.map(k=>pr.caps[k].pres),backgroundColor:COL,borderWidth:2,borderColor:'#fff'}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'58%',plugins:{legend:{position:'right',labels:{boxWidth:9,boxHeight:9,font:{size:11},usePointStyle:true,pointStyle:'circle'}},
    tooltip:{callbacks:{label:c=>' '+c.label+': '+eur(c.parsed)+' ('+pct1(100*c.parsed/pr.pres)+')'}}}}});
}

/* ============================== CAJA ============================== */
function vCaja(){
  const c=caja(SEL), d=deuda(SEL), bn=burn(SEL), cs=codes(SEL), [a,b]=win();
  const cli=DATA.clientes.filter(x=>cs.includes(x.promo)), pro=DATA.proveedores.filter(x=>cs.includes(x.promo)), ant=DATA.anticipos.filter(x=>cs.includes(x.promo));
  const ejs=EJS===TODOS?EJ.map(String):[String(EJS)];
  const sf=(arr,f)=>arr.reduce((t,x)=>t+(EJS===TODOS?x[f]:(x.ej?.[String(EJS)]||0)),0);
  const facC=sf(cli,'fact'), facP=sf(pro,'fact');
  const cobC=EJS===TODOS?cli.reduce((t,x)=>t+x.cobr,0):null, pagP=EJS===TODOS?pro.reduce((t,x)=>t+x.cobr,0):null;
  const pdteC=cli.reduce((t,x)=>t+x.saldo,0), pdteP=-pro.reduce((t,x)=>t+x.saldo,0);
  const antC=ant.reduce((t,x)=>t+x.cobr,0);
  const k=`<div class="kpis">
   <div class="kpi"><div class="l">Caja al inicio</div><div class="v">${kEur(c.ini)}</div></div>
   <div class="kpi"><div class="l">Caja a cierre</div><div class="v ${c.fin<0?'neg':''}">${kEur(c.fin)}</div><div class="d">${c.fin-c.ini>=0?'▲ ':'▼ '}${kEur(Math.abs(c.fin-c.ini))}</div></div>
   <div class="kpi"><div class="l">Cobros del periodo</div><div class="v pos">${kEur(c.co)}</div></div>
   <div class="kpi"><div class="l">Pagos del periodo</div><div class="v neg">${kEur(c.pa)}</div></div>
   <div class="kpi"><div class="l">Variación media mensual</div><div class="v ${bn.b<0?'neg':'pos'}">${kEur(bn.b)}</div><div class="d">3 meses ${kEur(bn.b3)} · periodo ${kEur(bn.bT)}</div></div>
   <div class="kpi"><div class="l">Cobertura con caja</div><div class="v">${bn.runway!=null?mes1(bn.runway):'—'}</div><div class="d">${bn.b>=0?'Sin consumo neto':(bn.disp>0?'Con préstamo: '+mes1(bn.runwayTot):'Sin préstamo disponible')}</div></div>
  </div>`;
  const al = bn.b<0
    ? `<div class="alert ${bn.runway<3?'bad':(bn.runway<8?'':'ok')}"><b>Alerta de tesorería.</b> Con un consumo neto de ${eur0(-bn.b)} al mes y una caja de ${eur0(c.fin)}, la posición se agotaría en <b>${mes1(bn.runway)}</b>. ${bn.disp>0?`A partir de ahí hay que disponer del préstamo promotor, con <b>${eur0(bn.disp)}</b> disponibles que llevarían la cobertura total a <b>${mes1(bn.runwayTot)}</b>.`:'No hay disponible de préstamo vivo: la cobertura depende de aportaciones del grupo, de acelerar cobros o de formalizar financiación.'}<br><span class="muted">Criterio: escenario más exigente entre la media de los 3 últimos meses (${eur0(bn.b3)}) y la del periodo (${eur0(bn.bT)}). No incorpora el calendario previsto de escrituras.</span></div>`
    : `<div class="alert ok"><b>Sin consumo neto de caja.</b> Variación media mensual de ${eur0(bn.b)} y saldo a cierre de ${eur0(c.fin)}${bn.disp>0?`, con ${eur0(bn.disp)} adicionales de préstamo disponible`:''}.</div>`;
  const rb=c.cuentas.map(x=>({c:[
    {v:'<b>'+esc(x.nom)+'</b><div class="muted small">'+esc(x.soc)+(SEL===CONS?' · '+esc(PMAP[x.promo]?.nom||x.promo):'')+'</div>'},
    {v:eur(a===0?0:x.saldo[a-1])},{v:eur(x.cob.slice(a,b+1).reduce((s,v)=>s+v,0)),cls:'pos'},
    {v:eur(x.pag.slice(a,b+1).reduce((s,v)=>s+v,0)),cls:'neg'},{v:eur(x.saldo[b]),cls:x.saldo[b]<0?'neg':''}]}))
    .sort((p,q)=>0);
  rb.push({cls:'tot',c:[{v:'TOTAL'},{v:eur(c.ini)},{v:eur(c.co)},{v:eur(c.pa)},{v:eur(c.fin)}]});
  const tCli=tbl([{t:'Clientes',l:1},{t:'Importe'},{t:'%'}],[
    {c:[{v:'Facturado en el periodo'},{v:eur(facC)},{v:''}]},
    {c:[{v:'Cobrado (acumulado 2023-2026)'},{v:cobC!=null?eur(cobC):'<span class="muted">—</span>',cls:'pos'},{v:facC&&cobC!=null?'':''}]},
    {cls:'tot',c:[{v:'Saldo pendiente de cobro a cierre'},{v:eur(pdteC),cls:pdteC>0.5?'wrn':''},{v:''}]},
    {c:[{v:'Anticipos y reservas de compradores cobrados <span class="muted small">(cuentas 438)</span>'},{v:eur(antC),cls:'pos'},{v:''}]}]);
  const tPro=tbl([{t:'Proveedores',l:1},{t:'Importe'},{t:'%'}],[
    {c:[{v:'Facturado en el periodo'},{v:eur(facP)},{v:''}]},
    {c:[{v:'Pagado (acumulado 2023-2026)'},{v:pagP!=null?eur(pagP):'<span class="muted">—</span>',cls:'neg'},{v:''}]},
    {cls:'tot',c:[{v:'Saldo pendiente de pago a cierre'},{v:eur(pdteP),cls:pdteP>0.5?'wrn':''},{v:''}]}]);
  const topC=cli.filter(x=>x.saldo>1).sort((p,q)=>q.saldo-p.saldo).slice(0,15);
  const topP=pro.filter(x=>x.saldo<-1).sort((p,q)=>p.saldo-q.saldo).slice(0,15);

  /* ---- detalle de cobros y pagos: ejecutado y pendiente ---- */
  const [ia,ib]=win();
  const mv=DATA.mov.filter(x=>cs.includes(x[6])&&(EJS===TODOS||x[9]==EJS));
  const clsM={};
  mv.forEach(x=>{const k2=x[5];(clsM[k2]=clsM[k2]||{co:0,pa:0,n:0}).n++;
    if(x[7]>0)clsM[k2].co+=x[7]; else clsM[k2].pa+=x[7];});
  const clsOrd=Object.keys(clsM).sort((a,b)=>(Math.abs(clsM[b].co)+Math.abs(clsM[b].pa))-(Math.abs(clsM[a].co)+Math.abs(clsM[a].pa)));
  const TC=clsOrd.reduce((a,k2)=>({co:a.co+clsM[k2].co,pa:a.pa+clsM[k2].pa,n:a.n+clsM[k2].n}),{co:0,pa:0,n:0});
  const tEjec=tbl([{t:'Concepto',l:1},{t:'Movimientos'},{t:'Cobros'},{t:'Pagos'},{t:'Neto'}],
    clsOrd.map(k2=>({c:[{v:'<b>'+esc(k2)+'</b>'},{v:nf0.format(clsM[k2].n)},
      {v:clsM[k2].co?eur(clsM[k2].co):'<span class="muted">—</span>',cls:'pos'},
      {v:clsM[k2].pa?eur(clsM[k2].pa):'<span class="muted">—</span>',cls:'neg'},
      {v:eur(clsM[k2].co+clsM[k2].pa),cls:sgn(clsM[k2].co+clsM[k2].pa)}]}))
     .concat([{cls:'tot',c:[{v:'TOTAL'},{v:nf0.format(TC.n)},{v:eur(TC.co)},{v:eur(TC.pa)},{v:eur(TC.co+TC.pa)}]}]));

  const pe=DATA.pend.filter(x=>cs.includes(x[5]));
  const pgP={};
  pe.forEach(x=>{const k2=x[5];(pgP[k2]=pgP[k2]||{co:0,pa:0,n:0}).n++;
    if(x[0]==='Cobro')pgP[k2].co+=x[8]; else pgP[k2].pa+=x[8];});
  const pOrd=Object.keys(pgP).sort((a,b)=>(pgP[b].co+pgP[b].pa)-(pgP[a].co+pgP[a].pa));
  const TP=pOrd.reduce((a,k2)=>({co:a.co+pgP[k2].co,pa:a.pa+pgP[k2].pa,n:a.n+pgP[k2].n}),{co:0,pa:0,n:0});
  const tPend=tbl([{t:'Promoción',l:1},{t:'Documentos'},{t:'Pendiente de cobro'},{t:'Pendiente de pago'},{t:'Posición neta'}],
    pOrd.map(k2=>({c:[{v:'<b>'+esc(PMAP[k2]?.nom||k2)+'</b>'},{v:nf0.format(pgP[k2].n)},
      {v:pgP[k2].co?eur(pgP[k2].co):'<span class="muted">—</span>',cls:'pos'},
      {v:pgP[k2].pa?eur(pgP[k2].pa):'<span class="muted">—</span>',cls:'neg'},
      {v:eur(pgP[k2].co-pgP[k2].pa),cls:sgn(pgP[k2].co-pgP[k2].pa)}]}))
     .concat([{cls:'tot',c:[{v:'TOTAL'},{v:nf0.format(TP.n)},{v:eur(TP.co)},{v:eur(TP.pa)},{v:eur(TP.co-TP.pa)}]}]));

  window.__tEjec=tEjec; window.__tPend=tPend;
  return k+al+`
  <div class="grid2">
    <div class="card"><h3>Posición de caja mes a mes</h3><div class="cbody"><div class="chartbox"><canvas id="k1"></canvas></div></div></div>
    <div class="card"><h3>Cobros y pagos por mes</h3><div class="cbody"><div class="chartbox"><canvas id="k2"></canvas></div></div></div>
  </div>
  <div class="card"><h3>Cuentas bancarias de la promoción</h3><div class="cbody scroll">${tbl([{t:'Cuenta',l:1},{t:'Saldo inicial'},{t:'Cobros'},{t:'Pagos'},{t:'Saldo a cierre'}],rb)}</div></div>
  <div class="grid2">
    <div class="card"><h3>Cobrado frente a facturado a clientes</h3><div class="cbody">${tCli}<div class="legend">Los anticipos y reservas se contabilizan en cuentas 438 y se aplican contra la factura en el momento de la escritura, por eso no tienen «facturado» propio.</div></div></div>
    <div class="card"><h3>Pagado frente a facturado a proveedores</h3><div class="cbody">${tPro}<div class="legend">Incluye pagarés y confirming emitidos: el importe figura como pagado desde la emisión del efecto, no desde su vencimiento.</div></div></div>
  </div>
  <div class="card"><h3>Detalle de cobros y pagos <span class="note">lo ejecutado y lo pendiente · ${periodo()}</span></h3><div class="cbody">
    <div class="toolbar">
      <select id="mModo"><option value="ej">Ejecutado — movimientos de tesorería</option><option value="pe">Pendiente — facturas sin cobrar o sin pagar</option></select>
      <select id="mT"><option value="">Cobros y pagos</option><option value="co">Solo cobros</option><option value="pa">Solo pagos</option></select>
      <select id="mC"><option value="">Todos los conceptos</option>${clsOrd.map(c2=>`<option value="${esc(c2)}">${esc(c2)}</option>`).join('')}</select>
      <select id="mM"><option value="">Todos los meses</option>${MESES.slice(ia,ib+1).map((m2,i2)=>`<option value="${m2}">${ML[ia+i2]}</option>`).join('')}</select>
      <input type="search" id="mQ" placeholder="Buscar tercero, concepto, cuenta…">
      <span class="muted small" id="mCount"></span>
    </div>
    <div id="mSum">${tEjec}</div>
    <div class="scroll" id="mTbl" style="margin-top:12px"></div>
    <div id="mLeg" class="legend"></div>
  </div></div>`;
}
let FM={modo:'ej',t:'',c:'',m:'',q:''};
function drawMov(){
  const box=document.getElementById('mTbl');if(!box)return;
  const cs=codes(SEL), q=FM.q.toLowerCase().trim(), pend=FM.modo==='pe';
  document.getElementById('mSum').innerHTML = pend?window.__tPend:window.__tEjec;
  document.getElementById('mC').classList.toggle('hide',pend);
  document.getElementById('mM').classList.toggle('hide',pend);
  document.getElementById('mLeg').innerHTML = pend
   ? 'El saldo de la cuenta del tercero es la cifra cierta. Las facturas que lo componen se obtienen aplicando los pagos a las más antiguas, que es como se liquidan en la práctica, de modo que el detalle suma siempre el saldo. Un pagaré o confirming emitido figura como pagado desde su emisión, no desde el vencimiento.'
   : 'Un movimiento es cada apunte de una cuenta 570 o 572. La contrapartida es el concepto dominante del asiento; en remesas y confirming, que agrupan varias facturas, se indica el primer tercero y cuántos más incluye.';
  if(pend){
    let r=DATA.pend.filter(x=>cs.includes(x[5]));
    if(FM.t==='co')r=r.filter(x=>x[0]==='Cobro'); else if(FM.t==='pa')r=r.filter(x=>x[0]==='Pago');
    if(q)r=r.filter(x=>(x[2]+' '+x[4]+' '+x[3]).toLowerCase().includes(q));
    const co=r.filter(x=>x[0]==='Cobro').reduce((s,x)=>s+x[8],0), pa=r.filter(x=>x[0]==='Pago').reduce((s,x)=>s+x[8],0);
    document.getElementById('mCount').textContent=`${nf0.format(r.length)} documentos · pendiente de cobro ${eur(co)} · pendiente de pago ${eur(pa)} · neto ${eur(co-pa)}`;
    box.innerHTML=tbl([{t:'Tipo',l:1},{t:'Fecha'},{t:'Tercero',l:1},{t:'Factura o concepto',l:1},{t:'Promoción',l:1},{t:'Importe'},{t:'Liquidado'},{t:'Pendiente'}],
      r.slice(0,1200).map(x=>({c:[
        {v:x[0]==='Cobro'?'<span class="chip ok">Cobro</span>':'<span class="chip warn">Pago</span>'},
        {v:x[1]||'<span class="muted">—</span>'},
        {v:'<b>'+esc(x[2])+'</b><div class="muted small">'+x[3]+'</div>'},
        {v:esc(x[4])},{v:'<span class="chip">'+esc(PMAP[x[5]]?.nom||x[5])+'</span>'},
        {v:x[6]?eur(x[6]):'<span class="muted">—</span>'},{v:x[7]?eur(x[7]):'<span class="muted">—</span>'},
        {v:eur(x[8]),cls:'wrn'}]})));
    return;
  }
  let r=DATA.mov.filter(x=>cs.includes(x[6])&&(EJS===TODOS||x[9]==EJS));
  if(FM.t==='co')r=r.filter(x=>x[7]>0); else if(FM.t==='pa')r=r.filter(x=>x[7]<0);
  if(FM.c)r=r.filter(x=>x[5]===FM.c);
  if(FM.m)r=r.filter(x=>x[8]===FM.m);
  if(q)r=r.filter(x=>(x[2]+' '+x[3]+' '+x[1]+' '+x[4]).toLowerCase().includes(q));
  const co=r.filter(x=>x[7]>0).reduce((s,x)=>s+x[7],0), pa=r.filter(x=>x[7]<0).reduce((s,x)=>s+x[7],0);
  document.getElementById('mCount').textContent=`${nf0.format(r.length)} movimientos · cobros ${eur(co)} · pagos ${eur(pa)} · neto ${eur(co+pa)}`;
  box.innerHTML=tbl([{t:'Fecha',l:1},{t:'Cuenta bancaria',l:1},{t:'Concepto',l:1},{t:'Contrapartida',l:1},{t:'Tipo',l:1},{t:'Promoción',l:1},{t:'Cobro'},{t:'Pago'}],
    r.slice(0,1200).map(x=>({c:[{v:x[0]},{v:esc(x[1])},{v:esc(x[2])},
      {v:esc(x[3])+'<div class="muted small">'+x[4]+'</div>'},
      {v:'<span class="chip">'+esc(x[5])+'</span>'},
      {v:'<span class="chip info">'+esc(PMAP[x[6]]?.nom||x[6])+'</span>'},
      {v:x[7]>0?eur(x[7]):'<span class="muted">—</span>',cls:'pos'},
      {v:x[7]<0?eur(-x[7]):'<span class="muted">—</span>',cls:'neg'}]})));
}
function cCaja(){
  ['mModo','mT','mC','mM','mQ'].forEach(id=>{const e=document.getElementById(id);if(!e)return;
    e.value=FM[{mModo:'modo',mT:'t',mC:'c',mM:'m',mQ:'q'}[id]];
    e.oninput=e.onchange=()=>{FM.modo=mModo.value;FM.t=mT.value;FM.c=mC.value;FM.m=mM.value;FM.q=mQ.value;drawMov();};});
  drawMov();
  const c=caja(SEL),L=lblW(),[a,b]=win();
  chart('k1',{type:'line',data:{labels:L,datasets:[{label:'Saldo de caja',data:c.saldo,borderColor:'#1c4183',backgroundColor:'rgba(16,44,87,.08)',fill:true,tension:.3,pointRadius:0}]},
    options:{...gopt,plugins:{...gopt.plugins,legend:{display:false}}}});
  const co=[],pa=[];for(let i=a;i<=b;i++){let x=0,y=0;c.cuentas.forEach(v=>{x+=v.cob[i];y+=v.pag[i];});co.push(x);pa.push(-y);}
  chart('k2',{type:'bar',data:{labels:L,datasets:[
    {label:'Cobros',data:co,backgroundColor:'#1b7f4d',borderRadius:2},
    {label:'Pagos',data:pa,backgroundColor:'#b3261e',borderRadius:2},
    {label:'Variación neta',data:c.mens,type:'line',borderColor:'#102C57',tension:.3,pointRadius:0}]},options:gopt});
}
/* ============================== DEUDA ============================== */
function vDeuda(){
  const d=deuda(SEL), c=caja(SEL), [a,b]=win();
  const vivas=d.lineas.filter(l=>l.saldo[b]>0.05).length;
  const k=`<div class="kpis">
   <div class="kpi"><div class="l">Dispuesto (saldo vivo)</div><div class="v">${kEur(d.dispuesto)}</div><div class="d">${vivas} línea(s) viva(s) de ${d.lineas.length}</div></div>
   <div class="kpi"><div class="l">Límite de líneas vivas</div><div class="v">${d.limite!=null?kEur(d.limite):'—'}</div><div class="d">${d.limite!=null?'Según estudio económico':'Sin línea viva con límite informado'}</div></div>
   <div class="kpi"><div class="l">Disponible</div><div class="v ${d.disponible!=null&&d.disponible<0?'neg':'pos'}">${d.disponible!=null?kEur(d.disponible):'—'}</div><div class="d">${d.pct!=null?pct1(d.pct)+' del límite consumido':'Sin línea viva'}</div></div>
   <div class="kpi"><div class="l">Dispuesto en el periodo</div><div class="v">${kEur(d.disp)}</div><div class="d">Amortizado ${kEur(d.amort)}</div></div>
   <div class="kpi"><div class="l">Caja + disponible</div><div class="v">${kEur(c.fin+(d.disponible||0))}</div><div class="d">Liquidez total accesible</div></div>
  </div>`;
  let bar = d.limite
   ? `<div class="card"><h3>Consumo de las líneas vivas de préstamo promotor</h3><div class="cbody">
      <div class="bar" style="height:22px;border-radius:8px"><i style="width:${Math.min(100,d.pct)}%;background:linear-gradient(90deg,#1f6feb,#0d3b7a)"></i></div>
      <div class="rowflex" style="justify-content:space-between;margin-top:8px;font-size:12.5px">
        <span>Dispuesto <b>${eur(d.dispuesto)}</b> (${pct1(d.pct)})</span>
        <span class="muted">Disponible <b>${eur(d.disponible)}</b> · Límite ${eur(d.limite)}</span></div>
      <div class="legend">El límite procede de la hoja <i>FLUJO FINANCIERO</i> del estudio económico. El diario no recoge el límite formalizado con la entidad, por lo que el disponible es una referencia de gestión, no una confirmación bancaria.</div></div></div>`
   : (d.lineas.length
      ? `<div class="card"><div class="cbody"><div class="alert ok">Todas las líneas de préstamo de esta selección están canceladas a cierre del periodo. No procede calcular disponible.</div></div></div>`
      : `<div class="card"><div class="cbody"><div class="alert">Sin préstamo promotor registrado en el diario para esta selección. La estructura queda preparada: en cuanto se registren disposiciones en una cuenta 1700000x, el dispuesto y el disponible se calculan solos.</div></div></div>`);
  const rows=d.lineas.map(l=>({c:[
    {v:'<b>'+esc(l.nom)+'</b><div class="muted small">'+esc(l.fase)+' · cuenta '+l.cta+'</div>'},
    {v:SEL===CONS?esc(PMAP[l.promo]?.nom||l.promo):''},
    {v:eur(a===0?0:l.saldo[a-1])},
    {v:eur(l.disp.slice(a,b+1).reduce((s,v)=>s+v,0)),cls:'pos'},
    {v:eur(l.amort.slice(a,b+1).reduce((s,v)=>s+v,0)),cls:'neg'},
    {v:eur(l.saldo[b])},
    {v:l.saldo[b]<=0.05?'<span class="chip ok">Cancelado</span>':'<span class="chip info">Vivo</span>'}]}));
  if(d.lineas.length){const T=d.lineas.reduce((t,l)=>({i:t.i+(a===0?0:l.saldo[a-1]),
    d:t.d+l.disp.slice(a,b+1).reduce((s,v)=>s+v,0),m:t.m+l.amort.slice(a,b+1).reduce((s,v)=>s+v,0),s:t.s+l.saldo[b]}),{i:0,d:0,m:0,s:0});
    rows.push({cls:'tot',c:[{v:'TOTAL'},{v:''},{v:eur(T.i)},{v:eur(T.d)},{v:eur(T.m)},{v:eur(T.s)},{v:''}]});}
  let prev='';
  if(d.previstos.length) prev=`<div class="card"><h3>Financiación prevista pendiente de formalizar o ya cancelada <span class="note">estructura preparada</span></h3><div class="cbody">
    ${tbl([{t:'Promoción',l:1},{t:'Límite previsto en el estudio'},{t:'Situación',l:1}],d.previstos.sort((x,y)=>y.limite-x.limite).map(x=>({c:[
      {v:'<b>'+esc(PMAP[x.cod]?.nom||x.cod)+'</b>'},{v:eur(x.limite)},
      {v:x.formalizado?'<span class="chip ok">Línea cancelada a cierre</span>':'<span class="chip">Sin disposiciones en el diario</span>'}]})))}
    <div class="legend">No se suman al disponible porque no corresponden a líneas vivas. Sirven para dimensionar la necesidad futura de financiación.</div></div></div>`;
  let otras='';
  if(SEL===CONS&&DATA.otras.length) otras=``;
  return k+bar+`
  <div class="card"><h3>Detalle de préstamos promotor</h3><div class="cbody scroll">${d.lineas.length?tbl([{t:'Préstamo',l:1},{t:'Promoción',l:1},{t:'Saldo inicial'},{t:'Disposiciones'},{t:'Amortizaciones'},{t:'Saldo a cierre'},{t:'Estado',l:1}],rows):'<div class="muted">Sin préstamo promotor en el periodo.</div>'}</div></div>
  ${d.lineas.length?`<div class="card"><h3>Saldo vivo y movimientos por mes</h3><div class="cbody"><div class="chartbox"><canvas id="d1"></canvas></div></div></div>`:''}
  ${prev}${otras}`;
}
function cDeuda(){
  const d=deuda(SEL);if(!d.lineas.length)return;const [a,b]=win(),L=lblW();
  const ds=d.lineas.map((l,i)=>({label:l.nom,data:l.saldo.slice(a,b+1),backgroundColor:COL[i%COL.length],borderRadius:2,stack:'a'}));
  chart('d1',{type:'bar',data:{labels:L,datasets:ds},options:{...gopt,scales:{...gopt.scales,x:{...gopt.scales.x,stacked:true},y:{...gopt.scales.y,stacked:true}}}});
}

/* ============================== DETALLE ============================== */
let F={q:'',mes:'',nat:'',tipo:'apuntes'};
function vDet(){
  return `<div class="card"><h3>Drill-down hasta el apunte y la factura <span class="note">respeta el filtro de promoción y de ejercicio de la cabecera</span></h3><div class="cbody">
   <div class="toolbar">
     <select id="fTipo">
       <option value="apuntes">Apuntes del diario</option>
       <option value="frec">Facturas recibidas</option>
       <option value="femi">Facturas emitidas</option>
       <option value="cobr">Cobros de clientes</option>
     </select>
     <input type="search" id="fQ" placeholder="Buscar concepto, tercero, cuenta, referencia…">
     <select id="fMes"><option value="">Todos los meses</option>${MESES.map((m,i)=>`<option value="${m}">${ML[i]}</option>`).join('')}</select>
     <select id="fNat"><option value="">Todas las naturalezas</option>${[...new Set(DATA.apuntes.map(x=>x[9]))].sort().map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('')}</select>
     <span class="muted small" id="fCount"></span>
   </div>
   <div class="scroll" id="detTbl"></div>
   <div class="legend">Los importes de facturas recibidas y emitidas son con IVA incluido, tal y como figuran en la cuenta del tercero.</div>
  </div></div>`;
}
function cDet(){
  ['fTipo','fQ','fMes','fNat'].forEach(id=>{const e=document.getElementById(id);
    e.value=F[{fTipo:'tipo',fQ:'q',fMes:'mes',fNat:'nat'}[id]];
    e.oninput=e.onchange=()=>{F.tipo=fTipo.value;F.q=fQ.value;F.mes=fMes.value;F.nat=fNat.value;drawDet();};});
  drawDet();
}
function drawDet(){
  const cs=codes(SEL), q=F.q.toLowerCase().trim(), box=document.getElementById('detTbl'); if(!box)return;
  document.getElementById('fNat').classList.toggle('hide',F.tipo!=='apuntes');
  document.getElementById('fMes').classList.toggle('hide',F.tipo==='frec');
  const okEj=e=>EJS===TODOS||+e===+EJS;
  let html='',n=0,tot=0;
  if(F.tipo==='apuntes'){
    let r=DATA.apuntes.filter(x=>cs.includes(x[8])&&okEj(x[10]));
    if(F.mes)r=r.filter(x=>x[1].slice(6)+'-'+x[1].slice(3,5)===F.mes);
    if(F.nat)r=r.filter(x=>x[9]===F.nat);
    if(q)r=r.filter(x=>(x[3]+' '+x[4]+' '+x[5]).toLowerCase().includes(q));
    n=r.length;tot=r.reduce((s,x)=>s+x[6],0);
    html=tbl([{t:'Fecha',l:1},{t:'Asiento'},{t:'Concepto',l:1},{t:'Descripción',l:1},{t:'Cuenta',l:1},{t:'Debe'},{t:'Haber'},{t:'Promoción',l:1},{t:'Naturaleza',l:1}],
      r.slice(0,1500).map(x=>({c:[{v:x[1]},{v:x[2]},{v:esc(x[3])},{v:esc(x[4])},{v:'<span class="pill">'+x[5]+'</span>'},
        {v:x[6]?eur(x[6]):'<span class="muted">—</span>'},{v:x[7]?eur(x[7]):'<span class="muted">—</span>'},
        {v:'<span class="chip">'+esc(PMAP[x[8]]?.nom||x[8])+'</span>'},{v:esc(x[9])}]})));
  } else if(F.tipo==='frec'){
    let r=DATA.frac.filter(x=>cs.includes(x[8])&&okEj(x[10]));
    if(q)r=r.filter(x=>(x[1]+' '+x[2]+' '+x[0]).toLowerCase().includes(q));
    r=r.slice().sort((p,s)=>s[4]-p[4]); n=r.length;tot=r.reduce((s,x)=>s+x[4],0);
    html=tbl([{t:'Proveedor',l:1},{t:'Referencia',l:1},{t:'Fecha'},{t:'Importe'},{t:'Pagado'},{t:'Pendiente'},{t:'Fecha pago'},{t:'Estado',l:1},{t:'Promoción',l:1}],
      r.slice(0,1500).map(x=>({c:[{v:'<b>'+esc(x[1])+'</b><div class="muted small">'+x[0]+'</div>'},{v:pdfLink(x[11],'<span class="pill">'+esc(x[2])+'</span>')},{v:x[3]},
        {v:eur(x[4])},{v:eur(x[5])},{v:eur(x[6]),cls:x[6]>0.05?'wrn':'muted'},{v:x[9]||'<span class="muted">—</span>'},
        {v:x[7]==='Pagada'?'<span class="chip ok">Pagada</span>':(x[7]==='Parcial'?'<span class="chip warn">Parcial</span>':'<span class="chip bad">Sin pago identificado</span>')},
        {v:'<span class="chip">'+esc(PMAP[x[8]]?.nom||x[8])+'</span>'}]})));
  } else if(F.tipo==='femi'){
    let r=DATA.femi.filter(x=>cs.includes(x[5])&&okEj(x[6]));
    if(F.mes)r=r.filter(x=>x[3].slice(6)+'-'+x[3].slice(3,5)===F.mes);
    if(q)r=r.filter(x=>(x[1]+' '+x[2]).toLowerCase().includes(q));
    r=r.slice().sort((p,s)=>s[4]-p[4]); n=r.length;tot=r.reduce((s,x)=>s+x[4],0);
    html=tbl([{t:'Cliente',l:1},{t:'Concepto',l:1},{t:'Fecha'},{t:'Importe (con IVA)'},{t:'Promoción',l:1}],
      r.slice(0,1500).map(x=>({c:[{v:'<b>'+esc(x[1])+'</b><div class="muted small">'+x[0]+'</div>'},{v:pdfLink(x[7],esc(x[2]))},{v:x[3]},{v:eur(x[4])},
        {v:'<span class="chip">'+esc(PMAP[x[5]]?.nom||x[5])+'</span>'}]})));
  } else {
    let r=DATA.cobr.filter(x=>cs.includes(x[5])&&okEj(x[6]));
    if(F.mes)r=r.filter(x=>x[3].slice(6)+'-'+x[3].slice(3,5)===F.mes);
    if(q)r=r.filter(x=>(x[1]+' '+x[2]).toLowerCase().includes(q));
    r=r.slice().sort((p,s)=>s[4]-p[4]); n=r.length;tot=r.reduce((s,x)=>s+x[4],0);
    html=tbl([{t:'Cliente',l:1},{t:'Concepto',l:1},{t:'Fecha'},{t:'Importe'},{t:'Promoción',l:1}],
      r.slice(0,1500).map(x=>({c:[{v:'<b>'+esc(x[1])+'</b><div class="muted small">'+x[0]+'</div>'},{v:pdfLink(x[7],esc(x[2]))},{v:x[3]},{v:eur(x[4])},
        {v:'<span class="chip">'+esc(PMAP[x[5]]?.nom||x[5])+'</span>'}]})));
  }
  document.getElementById('fCount').textContent=`${nf0.format(n)} registros · ${F.tipo==='apuntes'?'suma del debe':'importe total'} ${eur(tot)}${n>1500?' · se muestran los 1.500 primeros':''}`;
  box.innerHTML=html;
}
/* ============================== ANALÍTICA CONTABLE ============================== */
const ANA=()=>DATA.ana;
function vAna(){
  const A=ANA(); if(!A) return '<div class="card"><div class="cbody"><div class="alert">No se ha cargado la analítica contable.</div></div></div>';
  const soloUna=SEL!==CONS;
  const filas=A.cmp.filter(x=>!soloUna||x.cod===SEL);
  const T=A.cmp.reduce((a,x)=>({base:a.base+x.base,ana:a.ana+x.ana}),{base:0,ana:0});
  const est=A.cmp.filter(x=>['SIN_ASIGNAR','OFICINAS','PTE_VILLANUEVA','LARAD'].includes(x.cod)).reduce((a,x)=>a+x.dif,0);
  const resto=T.base-T.ana-est;
  const grandes=A.cmp.filter(x=>x.ana>50000&&Math.abs(x.dif)/Math.max(x.ana,1)>0.05&&!['SIN_ASIGNAR','OFICINAS','PTE_VILLANUEVA','NAVES','LARAD'].includes(x.cod));
  const coincide=T.ana?100*(1-Math.abs(T.base-T.ana-est)/T.ana):0;
  const k=`<div class="kpis">
   <div class="kpi"><div class="l">Analítica del cliente</div><div class="v">${kEur(A.total)}</div><div class="d">${nf0.format(A.n)} apuntes · cierre a ${A.corte}</div></div>
   <div class="kpi"><div class="l">Modelo del dashboard</div><div class="v">${kEur(T.base)}</div><div class="d">Coste activado en la matriz, misma fecha</div></div>
   <div class="kpi"><div class="l">Diferencia explicada</div><div class="v">${kEur(-est)}</div><div class="d">Estructura, oficinas y obra no capitalizada</div></div>
   <div class="kpi"><div class="l">Diferencia sin explicar</div><div class="v ${Math.abs(resto)>300000?'neg':'wrn'}">${kEur(resto)}</div><div class="d">${pct1(100*Math.abs(resto)/A.total)} del total de la analítica</div></div>
   <div class="kpi"><div class="l">Coincidencia</div><div class="v ${coincide>97?'pos':'wrn'}">${pct1(coincide)}</div><div class="d">Tras neutralizar las causas conocidas</div></div>
   <div class="kpi"><div class="l">Promociones a revisar</div><div class="v ${grandes.length?'wrn':'pos'}">${grandes.length}</div><div class="d">Desviación superior al 5 %</div></div>
  </div>`;
  const alertas=[
   {t:coincide>97?'ok':'',h:'Las dos fuentes cuadran en lo esencial',
    x:`El coste imputado a promociones por la analítica del cliente (${eur0(A.total)}) y el que sale de las cuentas de existencias del diario (${eur0(T.base)}) coinciden al <b>${pct1(coincide)}</b> una vez neutralizadas las tres causas conocidas de diferencia. En Nuevo Campus, la promoción de mayor volumen, la diferencia es de ${eur0(Math.abs(A.cmp.find(x=>x.cod==='NUEVOCAMPUS').dif))} sobre ${kEur(A.cmp.find(x=>x.cod==='NUEVOCAMPUS').ana)}.`},
   {t:'',h:'Por qué difieren las cifras y por qué el dashboard no las cambia',
    x:`La analítica reparte <i>todo</i> el gasto contabilizado, incluida la estructura, que trata como un proyecto más («Gastos generales indirectos»). El dashboard mide el coste que la contabilidad <i>activa en existencias</i>, que es el que forma el valor de la promoción y el que compara contra el presupuesto. Son dos preguntas distintas: la analítica responde «cuánto ha costado gestionar cada proyecto» y el dashboard «cuánto vale la obra en curso de cada promoción». Ninguna de las dos sustituye a la otra.`},
   {t:'',h:'Lo que la analítica aporta y el diario no',
    x:`El desglose por <b>sección</b> (naturaleza del coste) y por <b>fase</b>. El diario solo identifica la naturaleza en las cuentas específicas de cada promoción; la analítica la asigna apunte a apunte. Las tablas de más abajo usan esa información tal cual, sin alterar ninguna cifra del dashboard.`},
  ];
  if(grandes.length) alertas.push({t:'bad',h:'Diferencias que conviene revisar',
    x:grandes.map(x=>`<b>${esc(PMAP[x.cod]?.nom||x.cod)}</b>: analítica ${eur0(x.ana)} frente a ${eur0(x.base)} activado, ${eur0(x.dif)} (${pct1(100*x.dif/x.ana)})`).join('; ')+'.'});

  const ESTR=['SIN_ASIGNAR','OFICINAS','PTE_VILLANUEVA','NAVES','LARAD'];
  const CAUSA={SIN_ASIGNAR:'La analítica trata la estructura como un proyecto; la contabilidad no la activa en existencias',
   OFICINAS:'Gastos de oficinas y mejoras propias que la analítica imputa al proyecto y la contabilidad lleva a resultado',
   PTE_VILLANUEVA:'Obra para terceros: se factura y se lleva a resultado, no pasa por existencias',
   CARBAJOSA:'Diferencia de imputación en la matriz; el suelo y las construcciones de la sociedad vehículo quedan fuera del alcance de la analítica',
   NAVES:'Sociedad vehículo no incluida en la analítica',
   LARAD:'El solar procede del saldo de apertura de 2023, anterior al alcance de la analítica'};
  const rows=filas.map(x=>{
    const p=x.ana?100*x.dif/x.ana:null;
    const sev=ESTR.includes(x.cod)?'exp':(Math.abs(x.dif)<1000?'ok':(Math.abs(p||0)>5?'bad':'warn'));
    return {c:[
      {v:`<b>${esc(PMAP[x.cod]?.nom||x.cod)}</b>${x.spv?`<div class="muted small">incluye ${kEur(x.spv)} en sociedad vehículo</div>`:''}`},
      {v:eur(x.ana)},{v:eur(x.base)},{v:eur(x.dif),cls:x.dif<0?'neg':(x.dif>0?'pos':'muted')},
      {v:p!=null?pct1(p):'—'},
      {v:sev==='exp'?'<span class="chip info">Explicada</span>':(sev==='ok'?'<span class="chip ok">Cuadra</span>':(sev==='warn'?'<span class="chip warn">Diferencia menor</span>':'<span class="chip bad">Revisar</span>'))},
      {v:`<span class="muted small">${esc(CAUSA[x.cod]||'Diferencia de imputación entre la analítica y la activación en existencias')}</span>`}]};});
  if(!soloUna) rows.push({cls:'tot',c:[{v:'TOTAL'},{v:eur(T.ana)},{v:eur(T.base)},{v:eur(T.base-T.ana)},{v:pct1(100*(T.base-T.ana)/T.ana)},{v:''},{v:''}]});

  /* secciones */
  const cods=soloUna?[SEL]:A.cods.filter(c=>Object.keys(A.sec[c]||{}).length);
  const secTot={};cods.forEach(c=>{const s=A.sec[c]||{};for(const k2 in s)secTot[k2]=(secTot[k2]||0)+s[k2];});
  const secOrd=Object.keys(secTot).sort((a,b)=>secTot[b]-secTot[a]);
  const gt=Object.values(secTot).reduce((a,b)=>a+b,0);
  const tSec=tbl([{t:'Sección (naturaleza del coste)',l:1},{t:'Importe'},{t:'% s/ total'},{t:'Peso',l:1}],
    secOrd.map(s2=>({c:[{v:esc(s2)},{v:eur(secTot[s2])},{v:gt?pct1(100*secTot[s2]/gt):'—'},{v:barPct(gt?100*secTot[s2]/gt:0,'#1c4183')}]}))
     .concat([{cls:'tot',c:[{v:'TOTAL'},{v:eur(gt)},{v:'100,0 %'},{v:''}]}]));
  const fasTot={};cods.forEach(c=>{const s2=A.fas[c]||{};for(const k2 in s2)fasTot[k2]=(fasTot[k2]||0)+s2[k2];});
  const fasOrd=Object.keys(fasTot).sort();
  const ft=Object.values(fasTot).reduce((a,b)=>a+b,0);
  const fasChips=fasOrd.map(f=>`<span class="chip" style="margin-right:6px">${esc(f)}: <b>${kEur(fasTot[f])}</b> · ${ft?pct1(100*fasTot[f]/ft):'—'}</span>`).join('');
  /* --- facturas que originan las diferencias --- */
  const flu=A.flu.filter(f=>!soloUna||f.ana===SEL||f.dia===SEL);
  const difTot=flu.reduce((a,f)=>a+f.imp,0);
  const nomP=c=>esc(PMAP[c]?.nom||c);
  return k+alertas.map(x=>`<div class="alert ${x.t}"><b>${x.h}.</b> ${x.x}</div>`).join('')+`
  <div class="card"><h3>Contraste por promoción <span class="note">analítica del cliente frente al coste activado en existencias, ambos a ${A.corte}</span></h3><div class="cbody scroll">
    ${tbl([{t:'Promoción',l:1},{t:'Analítica'},{t:'Dashboard'},{t:'Diferencia'},{t:'%'},{t:'Estado',l:1},{t:'Causa',l:1}],rows)}</div></div>

  <div class="card"><h3>Qué facturas originan las diferencias <span class="note">apuntes en los que la analítica y la cuenta contable no coinciden</span></h3><div class="cbody">
    ${tbl([{t:'La analítica lo imputa a',l:1},{t:'La cuenta del diario dice',l:1},{t:'Apuntes'},{t:'Importe'},{t:'Peso',l:1}],
      flu.map(f=>({c:[{v:'<b>'+nomP(f.ana)+'</b>'},{v:nomP(f.dia)},{v:nf0.format(f.n)},{v:eur(f.imp),cls:f.imp<0?'neg':''},
        {v:barPct(difTot?100*Math.abs(f.imp)/Math.abs(difTot):0,'#7a5aa6')}]}))
       .concat([{cls:'tot',c:[{v:'TOTAL'},{v:''},{v:nf0.format(flu.reduce((a,f)=>a+f.n,0))},{v:eur(difTot)},{v:''}]}]))}
    <div class="toolbar" style="margin-top:14px">
      <input type="search" id="dQ" placeholder="Buscar proveedor, concepto, cuenta…">
      <select id="dP"><option value="">Todos los movimientos</option>${A.flu.map(f=>`<option value="${f.ana}|${f.dia}">${esc(PMAP[f.ana]?.nom||f.ana)} → ${esc(PMAP[f.dia]?.nom||f.dia)}</option>`).join('')}</select>
      <span class="muted small" id="dCount"></span>
    </div>
    <div class="scroll" id="dTbl"></div>
    <div class="legend">Estas diferencias afectan al <i>desglose por naturaleza</i>, no al coste por promoción del dashboard: ese lo fija el asiento de variación de existencias, que reparte directamente entre las cuentas 33000001, 33000003 y 33000004. La lista sirve para decidir si conviene abrir subcuentas 606 por promoción y dejar de depender del criterio manual de la analítica.</div>
  </div></div>

  <div class="grid3">
    <div class="card"><h3>Coste por sección según la analítica <span class="note">el desglose por naturaleza que el diario no permite</span></h3><div class="cbody scroll">${tSec}
      <div style="margin-top:12px">${fasChips}</div></div></div>
    <div class="card"><h3>Distribución por sección</h3><div class="cbody"><div class="chartbox" style="height:320px"><canvas id="a1"></canvas></div></div></div>
  </div>

  <div class="card"><h3>Detalle completo de la analítica <span class="note">${nf0.format(A.n)} apuntes</span></h3><div class="cbody">
    <div class="toolbar">
      <input type="search" id="aQ" placeholder="Buscar comentario, sección, cuenta…">
      <select id="aSec"><option value="">Todas las secciones</option>${A.secciones.map(s2=>`<option value="${esc(s2)}">${esc(s2)}</option>`).join('')}</select>
      <select id="aAnio"><option value="">Todos los ejercicios</option>${A.anios.map(y=>`<option value="${y}">${y}</option>`).join('')}</select>
      <span class="muted small" id="aCount"></span>
    </div>
    <div class="scroll" id="aTbl"></div></div></div>`;
}
let FA={q:'',sec:'',anio:''}, FD={q:'',par:''};
function cAna(){
  const A=ANA();if(!A)return;
  const soloUna=SEL!==CONS, cods=soloUna?[SEL]:A.cods;
  const secTot={};cods.forEach(c=>{const s=A.sec[c]||{};for(const k in s)secTot[k]=(secTot[k]||0)+s[k];});
  const ks=Object.keys(secTot).sort((a,b)=>secTot[b]-secTot[a]);
  chart('a1',{type:'doughnut',data:{labels:ks,datasets:[{data:ks.map(k=>secTot[k]),backgroundColor:COL,borderWidth:2,borderColor:'#fff'}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'58%',plugins:{legend:{position:'right',labels:{boxWidth:9,boxHeight:9,font:{size:10},usePointStyle:true,pointStyle:'circle'}},
    tooltip:{callbacks:{label:c=>' '+c.label+': '+eur(c.parsed)}}}}});
  ['aQ','aSec','aAnio'].forEach(id=>{const e=document.getElementById(id);if(!e)return;
    e.value=FA[{aQ:'q',aSec:'sec',aAnio:'anio'}[id]];
    e.oninput=e.onchange=()=>{FA.q=aQ.value;FA.sec=aSec.value;FA.anio=aAnio.value;drawAna();};});
  ['dQ','dP'].forEach(id=>{const e=document.getElementById(id);if(!e)return;
    e.value=FD[{dQ:'q',dP:'par'}[id]];
    e.oninput=e.onchange=()=>{FD.q=dQ.value;FD.par=dP.value;drawDif();};});
  drawAna();drawDif();
}
function drawDif(){
  const A=ANA(),box=document.getElementById('dTbl');if(!box)return;
  const q=FD.q.toLowerCase().trim(), soloUna=SEL!==CONS;
  let r=A.dif.filter(x=>(!soloUna||x[1]===SEL||x[2]===SEL)&&(EJS===TODOS||x[8]==EJS));
  if(FD.par){const[a,b]=FD.par.split('|');r=r.filter(x=>x[1]===a&&x[2]===b);}
  if(q)r=r.filter(x=>(x[7]+' '+x[3]+' '+x[4]).toLowerCase().includes(q));
  const tot=r.reduce((s,x)=>s+x[6],0);
  document.getElementById('dCount').textContent=`${nf0.format(r.length)} apuntes · ${eur(tot)}`;
  box.innerHTML=tbl([{t:'Fecha',l:1},{t:'Analítica',l:1},{t:'Diario',l:1},{t:'Cuenta',l:1},{t:'Sección',l:1},{t:'Concepto o factura',l:1},{t:'Importe'}],
    r.slice(0,600).map(x=>({c:[{v:x[0]},{v:'<span class="chip">'+esc(PMAP[x[1]]?.nom||x[1])+'</span>'},
      {v:'<span class="chip info">'+esc(PMAP[x[2]]?.nom||x[2])+'</span>'},{v:'<span class="pill">'+x[3]+'</span>'},
      {v:esc(x[4])},{v:esc(x[7])},{v:eur(x[6]),cls:x[6]<0?'neg':''}]})));
}
function drawAna(){
  const A=ANA(),box=document.getElementById('aTbl');if(!box)return;
  const q=FA.q.toLowerCase().trim(), soloUna=SEL!==CONS;
  let r=A.det.filter(x=>(!soloUna||x[0]===SEL)&&(EJS===TODOS||x[6]==EJS));
  if(FA.sec)r=r.filter(x=>x[2]===FA.sec);
  if(FA.anio)r=r.filter(x=>x[6]==FA.anio);
  if(q)r=r.filter(x=>(x[9]+' '+x[2]+' '+x[3]+' '+x[7]+' '+x[1]).toLowerCase().includes(q));
  const tot=r.reduce((s,x)=>s+x[8],0);
  document.getElementById('aCount').textContent=`${nf0.format(r.length)} apuntes · ${eur(tot)}`;
  box.innerHTML=tbl([{t:'Fecha',l:1},{t:'Proyecto',l:1},{t:'Sección',l:1},{t:'Canal',l:1},{t:'Fase',l:1},{t:'Cuenta',l:1},{t:'Concepto',l:1},{t:'Importe'}],
    r.slice(0,1200).map(x=>({c:[{v:x[5]},{v:esc(x[1])},{v:esc(x[2])},{v:esc(x[3])},{v:esc(x[4])},
      {v:'<span class="pill">'+x[7]+'</span>'},{v:esc(x[9])},{v:eur(x[8])}]})));
}
/* ====================== CONTROL DE CLIENTES Y PROVEEDORES ====================== */
function terceros(sel){
  const cs=codes(sel);
  const cli=(DATA.clientes||[]).filter(x=>cs.includes(x.promo));
  const pro=(DATA.proveedores||[]).filter(x=>cs.includes(x.promo));
  const T=l=>l.reduce((a,x)=>({fact:a.fact+x.fact,cobr:a.cobr+x.cobr,saldo:a.saldo+x.saldo}),{fact:0,cobr:0,saldo:0});
  const tc=T(cli), tp=T(pro);
  const antc=(DATA.anticipos||[]).filter(x=>cs.includes(x.promo)).reduce((a,x)=>a+(x.cobr||0),0);
  return {cli,pro,tc,tp,antc,
    debenos:cli.filter(x=>x.saldo>0.05).reduce((a,x)=>a+x.saldo,0),
    debemos:pro.filter(x=>x.saldo<-0.05).reduce((a,x)=>a-x.saldo,0)};
}
let FT={v:'pro',q:'',o:'saldo',solo:'',sel:''};
function vTer(){
  const t=terceros(SEL);
  const neto=t.debenos-t.debemos;
  const pctC=t.tc.fact?100*t.tc.cobr/t.tc.fact:null;
  const pctP=t.tp.fact?100*t.tp.cobr/t.tp.fact:null;
  const conc=[...t.pro].filter(x=>x.saldo<-0.05).sort((a,b)=>a.saldo-b.saldo);
  const top5=conc.slice(0,5).reduce((a,x)=>a-x.saldo,0);
  const k=`<div class="kpis">
   <div class="kpi"><div class="l">Facturado a clientes</div><div class="v">${kEur(t.tc.fact)}</div><div class="d">${nf0.format(t.cli.length)} cuentas de cliente</div></div>
   <div class="kpi"><div class="l">Cobrado</div><div class="v pos">${kEur(t.tc.cobr)}</div><div class="d">${pctC!=null?pct1(pctC)+' de lo facturado':'—'}</div></div>
   <div class="kpi"><div class="l">Nos deben</div><div class="v ${t.debenos>50000?'wrn':''}">${kEur(t.debenos)}</div><div class="d">Saldo vivo de clientes</div></div>
   <div class="kpi"><div class="l">Facturado por proveedores</div><div class="v">${kEur(t.tp.fact)}</div><div class="d">${nf0.format(t.pro.length)} cuentas de proveedor</div></div>
   <div class="kpi"><div class="l">Pagado</div><div class="v">${kEur(t.tp.cobr)}</div><div class="d">${pctP!=null?pct1(pctP)+' de lo facturado':'—'}</div></div>
   <div class="kpi"><div class="l">Debemos</div><div class="v ${t.debemos>500000?'wrn':''}">${kEur(t.debemos)}</div><div class="d">Saldo vivo de proveedores</div></div>
  </div>`;
  const al=[];
  al.push({t:neto<0?'':'ok',h:'Posición neta con terceros',
    x:`Nos deben <b>${eur(t.debenos)}</b> y debemos <b>${eur(t.debemos)}</b>, una posición neta de <b>${eur(neto)}</b>. `+
      (neto<0?`El circulante comercial financia la actividad: se ha facturado obra que aún no se ha pagado por ${eur(-neto)} más de lo que está pendiente de cobrar.`
             :`La promoción tiene más pendiente de cobrar que de pagar.`)+
      (t.antc?` A esto se añaden <b>${eur(t.antc)}</b> de anticipos y reservas de compradores ya cobrados en cuentas 438, que no figuran como facturación hasta la escritura.`:'')});
  if(conc.length>=5&&t.debemos>0) al.push({t:'',h:'Concentración del saldo a pagar',
    x:`Los cinco mayores proveedores concentran <b>${eur(top5)}</b>, el <b>${pct1(100*top5/t.debemos)}</b> de todo lo pendiente de pago: ${conc.slice(0,5).map(x=>esc(x.nom)).join(', ')}.`});
  if(pctC!=null&&pctC>99&&t.debenos<50000) al.push({t:'ok',h:'Cobro prácticamente al día',
    x:`Se ha cobrado el ${pct1(pctC)} de lo facturado a clientes. El saldo vivo, ${eur(t.debenos)}, es residual frente a los ${eur(t.tc.fact)} facturados.`});

  const esCli=FT.v==='cli';
  const lst0=esCli?t.cli:t.pro;
  const q=FT.q.toLowerCase().trim();
  let lst=lst0.filter(x=>!q||(x.nom+' '+x.cta).toLowerCase().includes(q));
  if(FT.solo==='deuda') lst=lst.filter(x=>esCli?x.saldo>0.05:x.saldo<-0.05);
  else if(FT.solo==='cerrado') lst=lst.filter(x=>Math.abs(x.saldo)<=0.05);
  const sg=x=>esCli?x.saldo:-x.saldo;
  lst=[...lst].sort((a,b)=>FT.o==='saldo'?sg(b)-sg(a):(FT.o==='fact'?b.fact-a.fact:a.nom.localeCompare(b.nom)));
  const TT=lst.reduce((a,x)=>({fact:a.fact+x.fact,cobr:a.cobr+x.cobr,s:a.s+sg(x)}),{fact:0,cobr:0,s:0});
  const rows=lst.slice(0,600).map(x=>{
    const s=sg(x), pc=x.fact?100*x.cobr/x.fact:null;
    return {cls:'clk'+(FT.sel===x.cta?' sel':''),attr:`data-cta="${x.cta}"`,c:[
      {v:`<b>${esc(x.nom)}</b><div class="muted small">${x.cta} <span class="lupa">ver facturas</span></div>`},
      {v:`<span class="chip">${esc(PMAP[x.promo]?.nom||x.promo)}</span>`},
      {v:x.fact?eur(x.fact):'<span class="muted">—</span>'},
      {v:x.cobr?eur(x.cobr):'<span class="muted">—</span>'},
      {v:Math.abs(s)>0.05?eur(s):'<span class="muted">0,00 €</span>',cls:Math.abs(s)>0.05?'wrn':'muted'},
      {v:pc!=null?barPct(Math.min(pc,100),pc>=99.5?'#1b7f4d':(pc>=60?'#1c4183':'#b57407')):'<span class="muted">—</span>'}]};});
  rows.push({cls:'tot',c:[{v:`TOTAL · ${nf0.format(lst.length)} ${esCli?'clientes':'proveedores'}`},{v:''},
    {v:eur(TT.fact)},{v:eur(TT.cobr)},{v:eur(TT.s)},{v:TT.fact?pct1(100*TT.cobr/TT.fact):'—'}]});

  /* ---- ficha del tercero seleccionado ---- */
  let ficha='';
  if(FT.sel){
    const o=(esCli?t.cli:t.pro).find(z=>z.cta===FT.sel)||(DATA.clientes.concat(DATA.proveedores)).find(z=>z.cta===FT.sel);
    if(o){
      const esC=(DATA.clientes||[]).some(z=>z.cta===FT.sel);
      const fr=(DATA.frac||[]).filter(z=>z[0]===FT.sel);
      const fe=(DATA.femi||[]).filter(z=>z[0]===FT.sel);
      const co=(DATA.cobr||[]).filter(z=>z[0]===FT.sel);
      const mv=(DATA.mov||[]).filter(z=>String(z[4])===FT.sel);
      const sal=esC?o.saldo:-o.saldo;
      const rFac = esC
        ? tbl([{t:'Fecha',l:1},{t:'Concepto',l:1},{t:'Promoción',l:1},{t:'Importe'}],
            fe.sort((a,b)=>b[4]-a[4]).slice(0,300).map(z=>({c:[{v:z[3]},{v:pdfLink(z[7],esc(z[2]))},
              {v:'<span class="chip">'+esc(PMAP[z[5]]?.nom||z[5])+'</span>'},{v:eur(z[4])}]})))
        : tbl([{t:'Fecha',l:1},{t:'Referencia',l:1},{t:'Promoción',l:1},{t:'Importe'},{t:'Pagado'},{t:'Pendiente'},{t:'Estado',l:1},{t:'Fecha de pago',l:1}],
            fr.sort((a,b)=>b[4]-a[4]).slice(0,300).map(z=>({c:[{v:z[3]},{v:pdfLink(z[11],esc(z[2]))},
              {v:'<span class="chip">'+esc(PMAP[z[8]]?.nom||z[8])+'</span>'},{v:eur(z[4])},{v:eur(z[5])},
              {v:z[6]>0.5?eur(z[6]):'<span class="muted">—</span>',cls:z[6]>0.5?'wrn':''},
              {v:z[7]==='Pagada'?'<span class="chip ok">Pagada</span>':(z[7]==='Parcial'?'<span class="chip warn">Parcial</span>':'<span class="chip bad">'+esc(z[7])+'</span>')},
              {v:z[9]||'<span class="muted">—</span>'}]})));
      const rMov = esC
        ? tbl([{t:'Fecha',l:1},{t:'Concepto',l:1},{t:'Promoción',l:1},{t:'Cobrado'}],
            co.sort((a,b)=>b[4]-a[4]).slice(0,300).map(z=>({c:[{v:z[3]},{v:esc(z[2])},
              {v:'<span class="chip">'+esc(PMAP[z[5]]?.nom||z[5])+'</span>'},{v:eur(z[4]),cls:'pos'}]})))
        : tbl([{t:'Fecha',l:1},{t:'Cuenta bancaria',l:1},{t:'Concepto',l:1},{t:'Importe'}],
            mv.sort((a,b)=>Math.abs(b[7])-Math.abs(a[7])).slice(0,300).map(z=>({c:[{v:z[0]},{v:esc(z[1])},{v:esc(z[2])},
              {v:eur(z[7]),cls:z[7]<0?'neg':'pos'}]})));
      const nF=esC?fe.length:fr.length, nM=esC?co.length:mv.length;
      ficha=`<div class="card" id="ficha" style="border-color:var(--navy)"><h3>${esc(o.nom)}
        <span class="note">${o.cta} · ${esc(PMAP[o.promo]?.nom||o.promo)} <a href="#" id="tX" style="margin-left:12px;color:var(--navy3)">cerrar</a></span></h3><div class="cbody">
        ${tbl([{t:'Facturado',l:1},{t:esC?'Cobrado':'Pagado'},{t:esC?'Nos deben':'Debemos'},{t:'% liquidado'},{t:'Documentos'}],[
          {c:[{v:eur(o.fact)},{v:eur(o.cobr)},{v:Math.abs(sal)>0.05?eur(sal):'0,00 €',cls:Math.abs(sal)>0.05?'wrn':'muted'},
              {v:o.fact?pct1(100*o.cobr/o.fact):'—'},{v:nf0.format(nF)+' facturas · '+nf0.format(nM)+(esC?' cobros':' pagos')}]}])}
        <details open><summary>${esC?'Facturas emitidas':'Facturas recibidas'}<span class="muted small">${nf0.format(nF)}</span></summary>
          <div class="dbody">${nF?rFac:'<div class="muted">Sin facturas registradas para esta cuenta.</div>'}</div></details>
        <details><summary>${esC?'Cobros recibidos':'Pagos realizados'}<span class="muted small">${nf0.format(nM)}</span></summary>
          <div class="dbody">${nM?rMov:'<div class="muted">Sin movimientos de tesorería identificados para esta cuenta.</div>'}</div></details>
        </div></div>`;
    }
  }
  return k+al.map(x=>`<div class="alert ${x.t}"><b>${x.h}.</b> ${x.x}</div>`).join('')+ficha+`
  <div class="grid2">
   <div class="card"><h3>Clientes <span class="note">facturado, cobrado y pendiente</span></h3><div class="cbody">
    ${tbl([{t:'Concepto',l:1},{t:'Importe'},{t:'%'}],[
      {c:[{v:'Facturado en el periodo'},{v:eur(t.tc.fact)},{v:'100,0 %'}]},
      {c:[{v:'Cobrado (acumulado 2023-2026)'},{v:eur(t.tc.cobr),cls:'pos'},{v:pctC!=null?pct1(pctC):'—'}]},
      {cls:'tot',c:[{v:'Nos deben a cierre'},{v:eur(t.debenos),cls:'wrn'},{v:t.tc.fact?pct1(100*t.debenos/t.tc.fact):'—'}]},
      {c:[{v:'Anticipos y reservas cobrados <span class="muted small">(cuentas 438)</span>'},{v:eur(t.antc)},{v:''}]},
    ])}
    <div class="legend">Los anticipos y reservas se cobran antes de la escritura y se aplican contra la factura en ese momento, por eso no cuentan como facturación hasta entonces.</div></div></div>
   <div class="card"><h3>Proveedores <span class="note">facturado, pagado y pendiente</span></h3><div class="cbody">
    ${tbl([{t:'Concepto',l:1},{t:'Importe'},{t:'%'}],[
      {c:[{v:'Facturado en el periodo'},{v:eur(t.tp.fact)},{v:'100,0 %'}]},
      {c:[{v:'Pagado (acumulado 2023-2026)'},{v:eur(t.tp.cobr),cls:'neg'},{v:pctP!=null?pct1(pctP):'—'}]},
      {cls:'tot',c:[{v:'Debemos a cierre'},{v:eur(t.debemos),cls:'wrn'},{v:t.tp.fact?pct1(100*t.debemos/t.tp.fact):'—'}]},
      {c:[{v:'Posición neta con terceros'},{v:eur(neto),cls:sgn(neto)},{v:''}]},
    ])}
    <div class="legend">Un pagaré o confirming emitido figura como pagado desde su emisión, no desde el vencimiento: lo pendiente es deuda comercial viva, no calendario de salidas de caja.</div></div></div>
  </div>
  <div class="card"><h3>Detalle por tercero <span class="note">${periodo()}</span></h3><div class="cbody">
    <div class="toolbar">
      <select id="tV"><option value="pro">Proveedores</option><option value="cli">Clientes</option></select>
      <select id="tS"><option value="">Todos</option><option value="deuda">Solo con saldo vivo</option><option value="cerrado">Solo saldados</option></select>
      <select id="tO"><option value="saldo">Ordenar por saldo</option><option value="fact">Ordenar por facturado</option><option value="nom">Ordenar por nombre</option></select>
      <input type="search" id="tQ" placeholder="Buscar por nombre o cuenta…">
      <span class="muted small">${nf0.format(lst.length)} de ${nf0.format(lst0.length)} · saldo ${eur(TT.s)}</span>
    </div>
    <div class="scroll">${tbl([{t:esCli?'Cliente':'Proveedor',l:1},{t:'Promoción',l:1},{t:'Facturado'},{t:esCli?'Cobrado':'Pagado'},{t:esCli?'Nos deben':'Debemos'},{t:'% liquidado',l:1}],rows)}</div>
    <div class="legend">El saldo de la cuenta del tercero es la cifra cierta. Las facturas concretas que lo componen están en <b>Caja › Detalle de cobros y pagos › Pendiente</b>, y el registro completo de facturas en <b>Detalle</b>.</div>
  </div></div>`;
}
function cTer(){
  document.querySelectorAll('tr.clk').forEach(tr=>tr.onclick=()=>{
    const c=tr.getAttribute('data-cta');
    FT.sel=(FT.sel===c)?'':c; render();
    const f=document.getElementById('ficha'); if(f)f.scrollIntoView({block:'center'});});
  const x=document.getElementById('tX');
  if(x)x.onclick=ev=>{ev.preventDefault();FT.sel='';render();};
  ['tV','tS','tO','tQ'].forEach(id=>{const e=document.getElementById(id);if(!e)return;
    e.value=FT[{tV:'v',tS:'solo',tO:'o',tQ:'q'}[id]];
    e.oninput=e.onchange=()=>{FT.v=tV.value;FT.solo=tS.value;FT.o=tO.value;FT.q=tQ.value;FT.sel='';
      const sc=window.scrollY;render();window.scrollTo(0,sc);};});
  const t=terceros(SEL), esCli=FT.v==='cli';
}
/* ============================== COMERCIAL ============================== */
const MOD=()=>DATA.mod||{};
const EST=['Escriturada','Contratada','Reservada','Libre'];
const ESTC={Escriturada:'#1b7f4d',Contratada:'#1c4183',Reservada:'#b57407',Libre:'#c3cbd8'};
function comer(sel){
  const cs=codes(sel).filter(c=>MOD()[c]);
  let u=[],sup=0,supU=0,ptoV=0,ptoU=0;
  cs.forEach(c=>{const m=MOD()[c];
    u=u.concat(m.uds.map(x=>x.concat([c])));
    sup+=m.sup.constr||0; supU+=m.sup.util||0;
    const p=DATA.pres[c]; if(p){ptoV+=p.ventas;ptoU+=p.uds||0;}});
  const by=e=>u.filter(x=>x[11]===e);
  const vend=u.filter(x=>x[11]!=='Libre');
  const val=u.reduce((a,x)=>a+x[5],0), valV=vend.reduce((a,x)=>a+x[5],0);
  const cobr=u.reduce((a,x)=>a+x[7],0);
  const mes={};vend.forEach(x=>{if(x[9])mes[x[9]]=(mes[x[9]]||0)+1;});
  const ms=Object.keys(mes).sort();
  return {u,vend,cs,sup,supU,ptoV,ptoU,val,valV,cobr,mes,ms,by,
    libres:by('Libre').length,
    pctV:u.length?100*vend.length/u.length:0,
    pmR:vend.length?valV/vend.length:0,
    pmP:ptoU?ptoV/ptoU:0,
    m2R:sup?valV/sup:0};
}
let FC={est:'',q:'',prom:''};
function vCom(){
  const t=comer(SEL);
  if(!t.u.length) return `<div class="card"><div class="cbody"><div class="alert">Esta selección no tiene cuadro de comercialización en el estudio económico.</div></div></div>`;
  /* ritmo: media de los ultimos 12 meses con actividad hasta el cierre */
  const ult=ULT;
  const ms12=t.ms.filter(m=>m<=ult).slice(-12);
  const v12=ms12.reduce((a,m)=>a+t.mes[m],0);
  const ritmo=ms12.length?v12/ms12.length:0;
  const meses=ritmo>0.05?t.libres/ritmo:null;
  const desv=t.pmP?100*(t.pmR/1.1-t.pmP)/t.pmP:null;   /* precio realizado sin IVA vs estudio */
  const k=`<div class="kpis">
   <div class="kpi"><div class="l">Unidades</div><div class="v">${nf0.format(t.u.length)}</div><div class="d">${nf0.format(t.vend.length)} comercializadas · ${nf0.format(t.libres)} libres</div></div>
   <div class="kpi"><div class="l">Comercializado</div><div class="v ${t.pctV>70?'pos':(t.pctV>30?'':'wrn')}">${pct1(t.pctV)}</div><div class="d">${kEur(t.valV)} sobre ${kEur(t.val)} c/IVA</div></div>
   <div class="kpi"><div class="l">Ritmo de ventas</div><div class="v">${ritmo.toFixed(1)} <span style="font-size:13px;font-weight:400">uds/mes</span></div><div class="d">media de los últimos ${ms12.length} meses con actividad</div></div>
   <div class="kpi"><div class="l">Meses para agotar</div><div class="v ${meses&&meses>36?'wrn':''}">${meses!=null?(meses>240?'—':meses.toFixed(0)):'—'}</div><div class="d">${t.libres?nf0.format(t.libres)+' unidades libres al ritmo actual':'Sin stock libre'}</div></div>
   <div class="kpi"><div class="l">Precio medio realizado</div><div class="v">${kEur(t.pmR/1.1)}</div><div class="d">estudio ${kEur(t.pmP)}${desv!=null?' · '+(desv>=0?'+':'')+pct1(desv):''}</div></div>
   <div class="kpi"><div class="l">Cobrado de compradores</div><div class="v">${kEur(t.cobr)}</div><div class="d">${t.valV?pct1(100*t.cobr/t.valV):'—'} del valor comercializado</div></div>
  </div>`;
  const al=[];
  const full=t.cs.filter(c=>{const m=MOD()[c];return m.uds.length&&m.uds.every(x=>x[11]!=='Libre');});
  if(full.length) al.push({t:'ok',h:'Promociones íntegramente vendidas',
    x:`${full.map(c=>`<b>${esc(PMAP[c].nom)}</b>`).join(', ')} ${full.length>1?'tienen':'tiene'} el 100 % de las unidades comercializadas. `+
      full.map(c=>{const m=MOD()[c],v=m.uds.reduce((a,x)=>a+x[5],0),p=m.uds.reduce((a,x)=>a+x[7],0);
        const ing=sum(DATA.ser[c].ing);
        return `En ${esc(PMAP[c].nom)} son ${nf0.format(m.uds.length)} unidades por ${eur0(v)} con IVA, de las que se han cobrado ${eur0(p)}; la contabilidad solo ha reconocido ${eur0(ing)} de ingreso porque la entrega está pendiente.`;}).join(' ')});
  if(desv!=null&&Math.abs(desv)>2) al.push({t:desv<0?'':'ok',h:'Precio realizado frente al del estudio',
    x:`El precio medio de las unidades comercializadas es de ${eur0(t.pmR/1.1)} sin IVA, ${desv>=0?'un '+pct1(desv)+' por encima':'un '+pct1(-desv)+' por debajo'} de los ${eur0(t.pmP)} del estudio económico. `+
      (desv<0?`Sobre las ${nf0.format(t.u.length)} unidades, esa diferencia vale ${eur0(Math.abs(t.pmR/1.1-t.pmP)*t.u.length)} de ingresos.`
             :`Sobre las ${nf0.format(t.u.length)} unidades, ese diferencial aporta ${eur0(Math.abs(t.pmR/1.1-t.pmP)*t.u.length)} de ingreso adicional si se mantiene.`)});
  if(meses!=null&&meses>36&&t.libres>20) al.push({t:'bad',h:'Ritmo insuficiente para el stock',
    x:`Al ritmo de ${ritmo.toFixed(1)} unidades al mes harían falta <b>${meses.toFixed(0)} meses</b> para colocar las ${nf0.format(t.libres)} unidades libres. Con el coste financiero corriendo sobre la obra, un plazo así erosiona el margen antes de la entrega.`});

  /* tabla por promocion */
  const filas=t.cs.map(c=>{
    const m=MOD()[c], u=m.uds, n=u.length;
    const cnt=Object.fromEntries(EST.map(e=>[e,u.filter(x=>x[11]===e).length]));
    const v=u.reduce((a,x)=>a+x[5],0), vv=u.filter(x=>x[11]!=='Libre').reduce((a,x)=>a+x[5],0);
    const pv=n?100*(n-cnt.Libre)/n:0;
    const p=DATA.pres[c], pmP=p&&p.uds?p.ventas/p.uds:null;
    const pmR=(n-cnt.Libre)?vv/(n-cnt.Libre)/1.1:null;
    return {c:[
      {v:`<b>${esc(PMAP[c].nom)}</b><div class="muted small">${esc(m.sup.tipo||PMAP[c].tipo)}</div>`},
      {v:nf0.format(n)},{v:nf0.format(cnt.Escriturada)},{v:nf0.format(cnt.Contratada)},{v:nf0.format(cnt.Reservada)},
      {v:nf0.format(cnt.Libre),cls:cnt.Libre?'wrn':'muted'},
      {v:barPct(pv,acc(c))},
      {v:pmR?eur(pmR):'<span class="muted">—</span>'},{v:pmP?eur(pmP):'<span class="muted">—</span>'},
      {v:m.sup.constr?eur(v/1.1/m.sup.constr):'<span class="muted">—</span>'},
      {v:kEur(vv)}]};});
  const T=EST.map(e=>t.by(e).length);
  filas.push({cls:'tot',c:[{v:'TOTAL'},{v:nf0.format(t.u.length)},{v:nf0.format(T[0])},{v:nf0.format(T[1])},{v:nf0.format(T[2])},
    {v:nf0.format(T[3])},{v:pct1(t.pctV)},{v:eur(t.pmR/1.1)},{v:t.pmP?eur(t.pmP):'—'},{v:t.sup?eur(t.valV/1.1/t.sup):'—'},{v:kEur(t.valV)}]});

  /* detalle unidad a unidad */
  const q=FC.q.toLowerCase().trim();
  let ud=t.u.filter(x=>(!FC.est||x[11]===FC.est)&&(!FC.prom||x[13]===FC.prom)&&
    (!q||((x[0]||'')+' '+(x[6]||'')+' '+(x[1]||'')).toLowerCase().includes(q)));
  ud=[...ud].sort((a,b)=>(a[13]||'').localeCompare(b[13]||'')||(a[1]||'').localeCompare(b[1]||'')||(a[0]||'').localeCompare(b[0]||''));
  const rd=ud.slice(0,700).map(x=>({c:[
    {v:`<b>${esc(x[0])}</b>`},{v:`<span class="chip">${esc(PMAP[x[13]]?.nom||x[13])}</span>`},{v:esc(x[1])},
    {v:x[2]?nf1.format(x[2])+' m²':'—'},{v:x[3]?nf1.format(x[3])+' m²':'—'},
    {v:eur(x[4])},{v:eur(x[5])},
    {v:x[6]?esc(x[6]):'<span class="muted">—</span>'},
    {v:x[9]||'<span class="muted">—</span>'},
    {v:`<span class="chip" style="background:${ESTC[x[11]]}22;color:${ESTC[x[11]]}">${x[11]}</span>`},
    {v:x[7]?eur(x[7]):'<span class="muted">—</span>'},
    {v:x[8]>0.5?eur(x[8]):'<span class="muted">—</span>',cls:x[8]>0.5?'wrn':''}]}));

  return k+al.map(x=>`<div class="alert ${x.t}"><b>${x.h}.</b> ${x.x}</div>`).join('')+`
  <div class="grid3">
   <div class="card"><h3>Ritmo de comercialización <span class="note">unidades vendidas por mes y acumulado</span></h3><div class="cbody"><div class="chartbox"><canvas id="q1"></canvas></div></div></div>
   <div class="card"><h3>Estado del stock</h3><div class="cbody"><div class="chartbox"><canvas id="q2"></canvas></div></div></div>
  </div>
  <div class="card"><h3>Comercialización por promoción <span class="note">precio medio realizado frente al del estudio</span></h3><div class="cbody scroll">
   ${tbl([{t:'Promoción',l:1},{t:'Uds'},{t:'Escrit.'},{t:'Contrat.'},{t:'Reserv.'},{t:'Libres'},{t:'% comercializado',l:1},
     {t:'Precio medio real'},{t:'Precio estudio'},{t:'€/m² constr.'},{t:'Valor vendido'}],filas)}
   <div class="legend">Escriturada es la unidad con el 90 % o más del precio cobrado o con fecha de escritura; contratada, entre el 15 % y el 90 %; reservada, por debajo del 15 % con comprador identificado. El precio medio real se muestra sin IVA para poder compararlo con el estudio económico.</div></div></div>
  <div class="card"><h3>Detalle de unidades <span class="note">${nf0.format(ud.length)} de ${nf0.format(t.u.length)}</span></h3><div class="cbody">
   <div class="toolbar">
     <select id="cE"><option value="">Todos los estados</option>${EST.map(e=>`<option value="${e}">${e}</option>`).join('')}</select>
     ${SEL===CONS?`<select id="cP"><option value="">Todas las promociones</option>${t.cs.map(c=>`<option value="${c}">${esc(PMAP[c].nom)}</option>`).join('')}</select>`:''}
     <input type="search" id="cQ" placeholder="Buscar vivienda o comprador…">
     <span class="muted small">valor ${eur(ud.reduce((a,x)=>a+x[5],0))} · cobrado ${eur(ud.reduce((a,x)=>a+x[7],0))}</span>
   </div>
   <div class="scroll">${tbl([{t:'Vivienda',l:1},{t:'Promoción',l:1},{t:'Fase',l:1},{t:'S. útil'},{t:'S. constr.'},
     {t:'Precio s/IVA'},{t:'Total c/IVA'},{t:'Comprador',l:1},{t:'Reserva',l:1},{t:'Estado',l:1},{t:'Cobrado'},{t:'Pendiente'}],rd)}</div>
   <div class="legend">Fuente: cuadro de compradores del estudio económico de cada promoción. Los cobros de esta tabla son los del cuadro comercial; los contabilizados están en <b>Caja</b> y en <b>Clientes y proveedores</b>.</div>
  </div></div>`;
}
function cCom(){
  const t=comer(SEL); if(!t.u.length)return;
  ['cE','cP','cQ'].forEach(id=>{const e=document.getElementById(id);if(!e)return;
    e.value=FC[{cE:'est',cP:'prom',cQ:'q'}[id]];
    e.oninput=e.onchange=()=>{FC.est=(document.getElementById('cE')||{}).value||'';
      FC.prom=(document.getElementById('cP')||{}).value||'';FC.q=(document.getElementById('cQ')||{}).value||'';
      const s=window.scrollY;render();window.scrollTo(0,s);};});
  const ms=t.ms.filter(m=>m>='2023-01');
  let ac=0;const acum=ms.map(m=>ac+=t.mes[m]);
  chart('q1',{data:{labels:ms.map(m=>MLBL[m]||m),datasets:[
    {type:'bar',label:'Unidades vendidas en el mes',data:ms.map(m=>t.mes[m]),backgroundColor:'#1c4183',borderRadius:3,yAxisID:'y'},
    {type:'line',label:'Acumulado',data:acum,borderColor:'#b57407',tension:.3,pointRadius:0,yAxisID:'y1'}]},
    options:{...gopt,scales:{x:{grid:{display:false},ticks:{font:{size:10},maxRotation:0,autoSkip:true,maxTicksLimit:14}},
      y:{grid:{color:'#eef1f6'},ticks:{font:{size:10.5},precision:0}},
      y1:{position:'right',grid:{display:false},ticks:{font:{size:10.5},precision:0}}},
     plugins:{...gopt.plugins,tooltip:{callbacks:{label:c=>' '+c.dataset.label+': '+nf0.format(c.parsed.y)+' uds'}}}}});
  chart('q2',{type:'doughnut',data:{labels:EST,datasets:[{data:EST.map(e=>t.by(e).length),
    backgroundColor:EST.map(e=>ESTC[e]),borderWidth:2,borderColor:'#fff'}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'58%',
     plugins:{legend:{position:'right',labels:{boxWidth:9,boxHeight:9,font:{size:11},usePointStyle:true,pointStyle:'circle'}},
      tooltip:{callbacks:{label:c=>' '+c.label+': '+nf0.format(c.parsed)+' uds ('+pct1(100*c.parsed/t.u.length)+')'}}}}});
}
/* ============================== OBRA · CURVA S ============================== */
function obra(sel){
  const cs=codes(sel).filter(c=>MOD()[c]&&(MOD()[c].flujo||[]).length);
  const P={},R={};
  cs.forEach(c=>{const m=MOD()[c];
    (m.flujo||[]).forEach(f=>{P[f[1]]=(P[f[1]]||0)+f[2];});
    (m.obraMes||[]).forEach(o=>{R[o[0]]=(R[o[0]]||0)+o[1];});});
  const ms=[...new Set(Object.keys(P).concat(Object.keys(R)))].sort();
  let a=0,b=0;
  const pa=[],ra=[];
  ms.forEach(m=>{a+=P[m]||0;pa.push(a);b+=R[m]||0;ra.push(b);});
  const totP=a, totR=b;
  const iHoy=ms.indexOf(ULT);
  const rHoy=iHoy>=0?ra[iHoy]:totR, pHoy=iHoy>=0?pa[iHoy]:0;
  const pctR=totP?100*rHoy/totP:0, pctP=totP?100*pHoy/totP:0;
  /* mes en que el plan alcanzaba el avance real de hoy */
  let iEq=pa.findIndex(v=>v>=rHoy); if(iEq<0)iEq=pa.length-1;
  /* el desfase en plazo solo tiene sentido si el alcance de la contrata y el de la
     cuenta contable coinciden; si lo certificado supera con mucho la contrata, la
     comparacion mide diferencia de alcance, no de calendario. */
  const alcance = totP>0 && rHoy > totP*1.15;
  const retraso=(iHoy>=0&&rHoy>0&&!alcance)?(iHoy-iEq):null;
  const caps={};
  cs.forEach(c=>MOD()[c].caps.forEach(x=>{const k=x.nom||'—';
    const o=caps[k]=caps[k]||{pto:0,apl:0,real:0};o.pto+=x.pto;o.apl+=x.apl;o.real+=x.real;}));
  const contrata=cs.reduce((s,c)=>s+(MOD()[c].obra.aplicada||0),0);
  const pem=cs.reduce((s,c)=>s+(MOD()[c].obra.pem||0),0);
  return {cs,ms,pa,ra,P,R,totP,totR,rHoy,pHoy,pctR,pctP,retraso,alcance,caps,contrata,pem,iHoy};
}
function vObra(){
  const o=obra(SEL);
  if(!o.cs.length) return `<div class="card"><div class="cbody"><div class="alert">Esta selección no tiene cronograma de obra en el estudio económico.</div></div></div>`;
  const desvC=o.rHoy-o.pHoy;
  const capOrd=Object.entries(o.caps).sort((a,b)=>b[1].apl-a[1].apl);
  const tc=capOrd.reduce((a,[,v])=>({pto:a.pto+v.pto,apl:a.apl+v.apl,real:a.real+v.real}),{pto:0,apl:0,real:0});
  const k=`<div class="kpis">
   <div class="kpi"><div class="l">Contrata aplicada</div><div class="v">${kEur(o.contrata)}</div><div class="d">PEM ${kEur(o.pem)}${o.pem?' · coeficiente '+(o.contrata/o.pem).toLocaleString('es-ES',{maximumFractionDigits:2}):''}</div></div>
   <div class="kpi"><div class="l">Certificado real</div><div class="v">${kEur(o.rHoy)}</div><div class="d">${pct1(o.pctR)} de la obra prevista</div></div>
   <div class="kpi"><div class="l">Planificado a la fecha</div><div class="v">${kEur(o.pHoy)}</div><div class="d">${pct1(o.pctP)} según cronograma</div></div>
   <div class="kpi"><div class="l">Certificado sobre contrata</div><div class="v ${o.contrata&&o.rHoy>o.contrata*1.05?'neg':''}">${o.contrata?pct1(100*o.rHoy/o.contrata):'—'}</div><div class="d">${o.contrata&&o.rHoy>o.contrata?kEur(o.rHoy-o.contrata)+' por encima de la contrata':'dentro de la contrata firmada'}</div></div>
   <div class="kpi"><div class="l">Desfase en plazo</div><div class="v ${o.retraso!=null&&o.retraso>2?'wrn':(o.retraso!=null&&o.retraso<-1?'pos':'')}">${o.retraso!=null?(o.retraso>0?'+':'')+o.retraso+' m':'—'}</div><div class="d">${o.alcance?'alcance no comparable':(o.retraso==null?'sin obra certificada':(o.retraso>0?'meses de retraso sobre el plan':(o.retraso<0?'meses de adelanto':'en plazo')))}</div></div>
   <div class="kpi"><div class="l">Pendiente de certificar</div><div class="v">${kEur(Math.max(0,o.totP-o.rHoy))}</div><div class="d">${o.totP&&o.rHoy<o.totP?pct1(100*(o.totP-o.rHoy)/o.totP)+' de la obra por ejecutar':'obra certificada por encima del cronograma'}</div></div>
  </div>`;
  const al=[];
  if(o.alcance) al.push({t:'bad',h:'El alcance de la contrata y el de la cuenta contable no coinciden',
    x:`Se han certificado <b>${eur0(o.rHoy)}</b> contra una contrata aplicada de <b>${eur0(o.contrata)}</b>, un ${pct1(100*o.rHoy/o.contrata)}. `+
      `Una diferencia de esta magnitud no es un adelanto de obra: o la cuenta 606 recoge coste que el cronograma no contempla —compra de obra en curso, mejoras de comprador, obra de otra fase—, o la contrata del estudio se quedó corta. `+
      `Mientras no se concilie, el desfase en plazo no es interpretable y la desviación hay que leerla como <b>sobrecoste de ${eur0(o.rHoy-o.contrata)}</b> sobre la contrata prevista.`});
  if(o.retraso!=null&&o.retraso>2) al.push({t:'bad',h:'La obra va por detrás del cronograma',
    x:`A ${MLBL[ULT]} el cronograma preveía ${eur0(o.pHoy)} certificados y se llevan ${eur0(o.rHoy)}: <b>${eur0(Math.abs(desvC))} menos</b>, equivalente a <b>${o.retraso} meses de retraso</b>. Cada mes de retraso arrastra el coste financiero del préstamo y de los fondos propios sobre el saldo dispuesto, y retrasa la escrituración que libera la caja.`});
  else if(o.retraso!=null&&o.retraso<-1) al.push({t:'ok',h:'La obra va por delante del cronograma',
    x:`Se llevan certificados ${eur0(o.rHoy)} frente a los ${eur0(o.pHoy)} previstos, <b>${Math.abs(o.retraso)} meses de adelanto</b>. Conviene comprobar que la tesorería y el ritmo de disposiciones del préstamo acompañan ese adelanto.`});
  const sob=capOrd.filter(([,v])=>v.real>v.apl+500);
  if(sob.length) al.push({t:'',h:'Capítulos por encima de la contrata',
    x:`${sob.length} capítulos superan la contrata aplicada, en conjunto ${eur0(sob.reduce((a,[,v])=>a+v.real-v.apl,0))}: `+
      sob.slice(0,4).map(([n,v])=>`<b>${esc(n)}</b> ${eur0(v.real-v.apl)}`).join(', ')+'.'});
  const conObra=o.cs.filter(c=>(MOD()[c].obraMes||[]).some(x=>Math.abs(x[1])>1000));
  const sinObra=o.cs.filter(c=>!conObra.includes(c));
  if(sinObra.length) al.push({t:'',h:'Promociones sin obra oficial en ejecución',
    x:`${sinObra.map(c=>`<b>${esc(PMAP[c].nom)}</b>`).join(', ')} ${sinObra.length>1?'no tienen':'no tiene'} obra en ejecución todavía, así que ${sinObra.length>1?'sus curvas':'su curva'} de certificación ${sinObra.length>1?'están':'está'} a cero y solo se muestra el cronograma previsto. `+
      `La columna «Real» de capítulos únicamente se rellena en las promociones con obra oficial en marcha, porque el coste se imputa factura a factura según indica el jefe de obra.`});
  if(!o.alcance) al.push({t:'',h:'Cómo leer esta curva',
    x:`La línea planificada sale del cronograma de obra del estudio económico de cada promoción; la real, del movimiento mensual de las cuentas 606 de obra en la contabilidad. La comparación es de <i>coste certificado</i>, no de avance físico: un retraso en la certificación puede deberse a obra no ejecutada o a certificaciones pendientes de emitir.`});

  const rows=capOrd.map(([n,v])=>{
    const d=v.real-v.apl, p=v.apl?100*v.real/v.apl:null;
    return {c:[{v:'<b>'+esc(n)+'</b>'},{v:eur(v.pto)},{v:eur(v.apl)},{v:eur(v.real)},
      {v:Math.abs(d)>0.5?eur(d):'<span class="muted">—</span>',cls:d>0.5?'neg':(d<-0.5?'':'muted')},
      {v:p!=null?barPct(Math.min(p,120),p>105?'#b3261e':(p>0?'#1c4183':'#c3cbd8')):'—'}]};});
  rows.push({cls:'tot',c:[{v:'TOTAL'},{v:eur(tc.pto)},{v:eur(tc.apl)},{v:eur(tc.real)},
    {v:eur(tc.real-tc.apl),cls:tc.real>tc.apl?'neg':'muted'},{v:tc.apl?pct1(100*tc.real/tc.apl):'—'}]});

  const filas=o.cs.map(c=>{
    const m=MOD()[c];
    let pa=0,ra=0,ph=0,rh=0;
    (m.flujo||[]).forEach(f=>{pa+=f[2];if(f[1]<=ULT)ph+=f[2];});
    (m.obraMes||[]).forEach(x=>{ra+=x[1];if(x[0]<=ULT)rh+=x[1];});
    const d=rh-ph;
    return {c:[{v:`<b>${esc(PMAP[c].nom)}</b>`},{v:eur(m.obra.aplicada)},{v:eur(ph)},{v:eur(rh)},
      {v:Math.abs(d)>0.5?eur(d):'<span class="muted">—</span>',cls:d<0?'wrn':''},
      {v:barPct(pa?Math.min(100*rh/pa,120):0,acc(c))}]};});

  return k+al.map(x=>`<div class="alert ${x.t}"><b>${x.h}.</b> ${x.x}</div>`).join('')+`
  <div class="card"><h3>Curva S de obra <span class="note">certificado real frente a cronograma del estudio económico</span></h3><div class="cbody"><div class="chartbox" style="height:330px"><canvas id="o1"></canvas></div></div></div>
  <div class="grid2">
   <div class="card"><h3>Certificación mensual</h3><div class="cbody"><div class="chartbox"><canvas id="o2"></canvas></div></div></div>
   <div class="card"><h3>Avance por promoción <span class="note">a ${esc(MLBL[ULT]||ULT)}</span></h3><div class="cbody scroll">
    ${tbl([{t:'Promoción',l:1},{t:'Contrata'},{t:'Planificado'},{t:'Certificado'},{t:'Desviación'},{t:'% s/ contrata',l:1}],filas)}</div></div>
  </div>
  <div class="card"><h3>Capítulos de obra <span class="note">${capOrd.length} capítulos</span></h3><div class="cbody scroll">
   ${tbl([{t:'Capítulo',l:1},{t:'Presupuesto'},{t:'Contrata aplicada'},{t:'Real'},{t:'Desviación'},{t:'% s/ contrata',l:1}],rows)}
   <div class="legend">«Presupuesto» es la medición del proyecto; «contrata aplicada» es esa medición corregida por el coeficiente PEM→contrata que recoge el estudio; «real» es lo certificado según el propio estudio económico.</div></div></div>`;
}
function cObra(){
  const o=obra(SEL); if(!o.cs.length)return;
  const L=o.ms.map(m=>MLBL[m]||m);
  const corte=o.iHoy>=0?o.iHoy:o.ms.length-1;
  chart('o1',{data:{labels:L,datasets:[
    {type:'line',label:'Planificado acumulado',data:o.pa,borderColor:'#8a94a8',borderDash:[5,4],tension:.25,pointRadius:0,fill:false},
    {type:'line',label:'Certificado acumulado',data:o.ra.map((v,i)=>i<=corte?v:null),borderColor:'#1c4183',
     backgroundColor:'rgba(28,65,131,.10)',fill:true,tension:.25,pointRadius:0,spanGaps:false}]},
    options:{...gopt,plugins:{...gopt.plugins,
      tooltip:{...gopt.plugins.tooltip,callbacks:{label:c=>' '+c.dataset.label+': '+eur(c.parsed.y),
        footer:it=>{const p=it.find(x=>x.datasetIndex===0),r=it.find(x=>x.datasetIndex===1);
          return (p&&r)?'Desviación: '+eur(r.parsed.y-p.parsed.y):'';}}}}}});
  chart('o2',{type:'bar',data:{labels:L,datasets:[
    {label:'Planificado',data:o.ms.map(m=>o.P[m]||0),backgroundColor:'#c3cbd8',borderRadius:2},
    {label:'Certificado',data:o.ms.map(m=>(m<=ULT?(o.R[m]||0):null)),backgroundColor:'#1c4183',borderRadius:2}]},
    options:gopt});
}
/* ==================== PROYECCIÓN · TESORERÍA, RETORNO Y ESCENARIOS ==================== */
const HOR=18;
function proy(sel){
  const cs=codes(sel).filter(c=>MOD()[c]&&(MOD()[c].flujo||[]).length);
  /* horizonte: 18 meses desde el ultimo cierre */
  const y0=+ULT.slice(0,4), m0=+ULT.slice(5,7);
  const ms=[];for(let i=1;i<=HOR;i++){const d=new Date(Date.UTC(y0,m0-1+i,1));
    ms.push(d.toISOString().slice(0,7));}
  const Z=()=>new Array(HOR).fill(0);
  const cob=Z(),obr=Z(),noObr=Z(),intB=Z(),intF=Z(),disp=Z(),amo=Z();
  const porP={};
  cs.forEach(c=>{const m=MOD()[c];
    const pl=Object.fromEntries((m.plan||[]).map(p=>[p[1],p]));
    const fl=Object.fromEntries((m.flujo||[]).map(f=>[f[1],f]));
    const acc2=Z().map(()=>0); porP[c]={cob:Z(),pag:Z(),net:Z()};
    let prevS=null;
    ms.forEach((mm,i)=>{
      const p=pl[mm], f=fl[mm];
      if(p){cob[i]+=p[6]; porP[c].cob[i]+=p[6];}
      if(f){
        obr[i]+=f[2]; noObr[i]+=f[7]; intB[i]+=f[6]; intF[i]+=f[10];
        disp[i]+=f[4];
        const s=f[5];
        if(prevS!=null&&s<prevS-0.5) amo[i]+=(prevS-s);
        prevS=s;
        porP[c].pag[i]+=f[2]+f[7]+f[6]+f[10];
      }
    });
    ms.forEach((mm,i)=>porP[c].net[i]=porP[c].cob[i]-porP[c].pag[i]);
  });
  const caja0=cs.reduce((t,c)=>t+(S(c,'cajaSaldo')[NM-1]||0),0);
  /* deuda viva: saldo del cronograma al inicio y al final del horizonte */
  let deu0=0,deu1=0,vivas=[];
  cs.forEach(c=>{const m=MOD()[c],fl=m.flujo||[];
    const ant=fl.filter(f=>f[1]<=ULT); if(ant.length)deu0+=ant[ant.length-1][5];
    const fin=fl.find(f=>f[1]===ms[HOR-1]); if(fin)deu1+=fin[5];
    if((S(c,'deudaSaldo')[NM-1]||0)>1000) vivas.push(c);});
  const neto=[],saldo=[];let s=caja0;
  ms.forEach((mm,i)=>{
    const n=cob[i]+disp[i]-obr[i]-noObr[i]-intB[i]-intF[i]-amo[i];
    neto.push(n); s+=n; saldo.push(s);});
  const min=Math.min(...saldo), iMin=saldo.indexOf(min);
  return {cs,ms,cob,obr,noObr,intB,intF,disp,amo,neto,saldo,caja0,min,iMin,porP,deu0,deu1,vivas};
}
function retorno(sel){
  const cs=codes(sel).filter(c=>DATA.pres[c]);
  const r=cs.map(c=>{
    const p=DATA.pres[c], m=MOD()[c]||{}, sup=(m.sup||{}).constr||0;
    const fl=m.flujo||[];
    const ffpp=fl.length?Math.max(...fl.map(f=>f[9])):0;
    const pl=m.plan||[];
    /* flujo mensual del proyecto: cobros de compradores menos coste (obra + no obra) */
    const F=[];
    const key=[...new Set(pl.map(x=>x[1]).concat(fl.map(x=>x[1])))].sort();
    const plM=Object.fromEntries(pl.map(x=>[x[1],x])), flM=Object.fromEntries(fl.map(x=>[x[1],x]));
    key.forEach(k=>{const a=plM[k],b=flM[k];
      F.push((a?a[6]:0)-((b?b[2]+b[7]:0)));});
    return {cod:c,nom:PMAP[c].nom,ventas:p.ventas,coste:p.coste,margen:p.margen,mpct:p.margen_pct,
      uds:p.uds,sup,ffpp,tir:tirAnual(F),
      cM2:sup?p.coste/sup:null,vM2:sup?p.ventas/sup:null,mM2:sup?p.margen/sup:null,
      mult:ffpp?1+p.margen/ffpp:null, roi:p.coste?100*p.margen/p.coste:null,
      meses:F.length};
  });
  return r;
}
function tirAnual(F){
  if(!F||F.length<3) return null;
  if(!F.some(v=>v>0)||!F.some(v=>v<0)) return null;
  const van=r=>F.reduce((a,v,i)=>a+v/Math.pow(1+r,i),0);
  let lo=-0.95,hi=1.5;
  if(van(lo)*van(hi)>0) return null;
  for(let i=0;i<200;i++){const mid=(lo+hi)/2; if(van(lo)*van(mid)<=0)hi=mid;else lo=mid;}
  const rm=(lo+hi)/2;
  const a=Math.pow(1+rm,12)-1;
  return (isFinite(a)&&a>-0.99&&a<10)?100*a:null;
}
let FE={obra:10,precio:-5,tipo:100};
function vProy(){
  const p=proy(SEL), R=retorno(SEL);
  if(!p.cs.length) return `<div class="card"><div class="cbody"><div class="alert">Esta selección no tiene flujo financiero en el estudio económico.</div></div></div>`;
  const T=k=>sum(p[k]);
  const nec=p.min<0?-p.min:0;
  const lim=p.cs.reduce((t,c)=>t+((MOD()[c].fin||{}).limite||0),0);
  const disp0=DATA.deuda?sum((DATA.deuda||[]).filter(x=>p.cs.includes(x.promo)).map(x=>Math.max(0,(x.limite||0)-(x.dispuesto||0)))):0;
  const k=`<div class="kpis">
   <div class="kpi"><div class="l">Caja de partida</div><div class="v">${kEur(p.caja0)}</div><div class="d">saldo a ${esc(MLBL[ULT]||ULT)}</div></div>
   <div class="kpi"><div class="l">Cobros previstos ${HOR} m</div><div class="v pos">${kEur(T('cob'))}</div><div class="d">contratos, aplazados y escrituras</div></div>
   <div class="kpi"><div class="l">Pagos previstos ${HOR} m</div><div class="v neg">${kEur(T('obr')+T('noObr')+T('intB')+T('intF'))}</div><div class="d">obra ${kEur(T('obr'))} · resto ${kEur(T('noObr')+T('intB')+T('intF'))}</div></div>
   <div class="kpi"><div class="l">Disposición prevista</div><div class="v">${kEur(T('disp'))}</div><div class="d">amortización ${kEur(T('amo'))} · límite ${kEur(lim)}</div></div>
   <div class="kpi"><div class="l">Saldo a ${HOR} meses</div><div class="v ${p.saldo[HOR-1]<0?'neg':'pos'}">${kEur(p.saldo[HOR-1])}</div><div class="d">flujo neto ${kEur(sum(p.neto))}</div></div>
   <div class="kpi"><div class="l">Máxima necesidad</div><div class="v ${nec>0?'neg':'pos'}">${nec>0?kEur(nec):'sin déficit'}</div><div class="d">${nec>0?'en '+esc(MLBL[p.ms[p.iMin]]||p.ms[p.iMin]):'la caja no entra en negativo'}</div></div>
   <div class="kpi"><div class="l">Deuda viva proyectada</div><div class="v ${p.deu1>p.deu0?'wrn':''}">${kEur(p.deu1)}</div><div class="d">hoy ${kEur(p.deu0)} · ${p.deu1>p.deu0?'crece '+kEur(p.deu1-p.deu0):'se reduce '+kEur(p.deu0-p.deu1)}</div></div>
  </div>`;
  const al=[];
  if(nec>0) al.push({t:'bad',h:'Punto de máxima necesidad de financiación',
    x:`Partiendo de ${eur0(p.caja0)} de caja, el cronograma del estudio lleva el saldo a <b>${eur0(p.min)}</b> en <b>${esc(MLBL[p.ms[p.iMin]]||p.ms[p.iMin])}</b>. `+
      `Hacen falta <b>${eur0(nec)}</b> adicionales para llegar a ese punto sin tensión, y el disponible actual de línea es de ${eur0(disp0)}. `+
      `Este es el número que hay que llevar a la mesa de negociación con la entidad, con ${Math.max(1,p.iMin)} meses de antelación.`});
  else al.push({t:'ok',h:'La caja aguanta el horizonte',
    x:`Con la caja de partida y el calendario de cobros y disposiciones del estudio, el saldo no entra en negativo en los próximos ${HOR} meses; el mínimo es de ${eur0(p.min)} en ${esc(MLBL[p.ms[p.iMin]]||p.ms[p.iMin])}.`});
  const pend=p.cs.filter(c=>!p.vivas.includes(c)&&((MOD()[c].fin||{}).limite||0)>0);
  if(pend.length&&p.deu1>p.deu0) al.push({t:'bad',h:'Financiación que el cronograma da por hecha y todavía no está formalizada',
    x:`El plan lleva la deuda viva de ${eur0(p.deu0)} a <b>${eur0(p.deu1)}</b> en ${HOR} meses. Ese salto se apoya en préstamos promotor de `+
      pend.map(c=>`<b>${esc(PMAP[c].nom)}</b> (${eur0((MOD()[c].fin||{}).limite||0)})`).join(', ')+
      ` que a día de hoy no tienen saldo dispuesto en la contabilidad. Sin esas formalizaciones, el saldo de caja de este calendario no se sostiene: la caja proyectada de ${eur0(p.saldo[HOR-1])} incorpora ${eur0(sum(p.disp))} de disposiciones.`});
  al.push({t:'',h:'Esto es una simulación, no un calendario',
    x:`Las disposiciones del préstamo promotor dependen de las certificaciones de obra según su ejecución real, y la amortización se produce al escriturar cada vivienda: ninguna de las dos cosas se puede fijar de antemano. Lo que ves es el cronograma del estudio económico proyectado desde el último cierre, útil para dimensionar la necesidad de financiación y anticipar el punto de tensión, pero no un calendario comprometido. Los cobros son los del cuadro de compradores —10 % a contrato, aplazados y 80 % a escritura—; los pagos, el avance de obra y los gastos no imputables a obra del propio modelo. Si la obra se desplaza, este calendario se desplaza con ella: cotéjalo con la pestaña <b>Obra</b>.`});

  const rows=p.ms.map((m,i)=>({cls:i===p.iMin?'sub2':'',c:[
    {v:esc(MLBL[m]||m)},
    {v:p.cob[i]?eur(p.cob[i]):'<span class="muted">—</span>',cls:'pos'},
    {v:p.obr[i]?eur(-p.obr[i]):'<span class="muted">—</span>',cls:'neg'},
    {v:(p.noObr[i]+p.intB[i]+p.intF[i])?eur(-(p.noObr[i]+p.intB[i]+p.intF[i])):'<span class="muted">—</span>',cls:'neg'},
    {v:p.disp[i]?eur(p.disp[i]):'<span class="muted">—</span>'},
    {v:p.amo[i]?eur(-p.amo[i]):'<span class="muted">—</span>'},
    {v:eur(p.neto[i]),cls:sgn(p.neto[i])},
    {v:eur(p.saldo[i]),cls:p.saldo[i]<0?'neg':''}]}));
  rows.push({cls:'tot',c:[{v:'TOTAL '+HOR+' MESES'},{v:eur(T('cob'))},{v:eur(-T('obr'))},
    {v:eur(-(T('noObr')+T('intB')+T('intF')))},{v:eur(T('disp'))},{v:eur(-T('amo'))},
    {v:eur(sum(p.neto)),cls:sgn(sum(p.neto))},{v:eur(p.saldo[HOR-1])}]});

  /* ---- retorno ---- */
  const rr=R.filter(x=>x.ventas>0).sort((a,b)=>b.margen-a.margen);
  const tR=rr.reduce((a,x)=>({v:a.v+x.ventas,c:a.c+x.coste,m:a.m+x.margen,s:a.s+x.sup,f:a.f+x.ffpp,u:a.u+(x.uds||0)}),{v:0,c:0,m:0,s:0,f:0,u:0});
  const tblR=tbl([{t:'Promoción',l:1},{t:'Ventas'},{t:'Coste'},{t:'Margen'},{t:'% margen'},{t:'ROI s/ coste'},
     {t:'TIR anual'},{t:'Múltiplo s/ FFPP'},{t:'Coste €/m²'},{t:'Venta €/m²'},{t:'Margen €/m²'}],
    rr.map(x=>({c:[{v:'<b>'+esc(x.nom)+'</b><div class="muted small">'+nf0.format(x.uds||0)+' uds · '+nf0.format(x.sup)+' m²</div>'},
      {v:kEur(x.ventas)},{v:kEur(x.coste)},{v:kEur(x.margen),cls:sgn(x.margen)},{v:pct1(x.mpct)},
      {v:x.roi!=null?pct1(x.roi):'—'},{v:x.tir==null?'<span class="muted">—</span>':(x.tir>150?'<span class="muted" title="El cronograma sitúa cobros antes que desembolsos, la TIR pierde significado">n.s.</span>':pct1(x.tir))},
      {v:x.mult!=null?x.mult.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+'×':'—'},
      {v:x.cM2?eur(x.cM2):'—'},{v:x.vM2?eur(x.vM2):'—'},{v:x.mM2?eur(x.mM2):'—'}]}))
      .concat([{cls:'tot',c:[{v:'TOTAL'},{v:kEur(tR.v)},{v:kEur(tR.c)},{v:kEur(tR.m)},{v:tR.v?pct1(100*tR.m/tR.v):'—'},
      {v:tR.c?pct1(100*tR.m/tR.c):'—'},{v:''},{v:tR.f?(1+tR.m/tR.f).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+'×':'—'},
      {v:tR.s?eur(tR.c/tR.s):'—'},{v:tR.s?eur(tR.v/tR.s):'—'},{v:tR.s?eur(tR.m/tR.s):'—'}]}]));

  /* ---- escenarios ---- */
  const eo=FE.obra/100, ep=FE.precio/100, et=FE.tipo/10000;
  const esc2=rr.map(x=>{
    const m=MOD()[x.cod]||{}, contrata=(m.obra||{}).aplicada||x.coste*0.7;
    const fl=m.flujo||[];
    const saldoMedio=fl.length?fl.reduce((a,f)=>a+f[5],0)/fl.length:0;
    const anios=fl.length/12;
    const dObra=-contrata*eo, dPrec=x.ventas*ep, dTipo=-saldoMedio*et*anios;
    const nm=x.margen+dObra+dPrec+dTipo;
    return {...x,dObra,dPrec,dTipo,nm,npct:x.ventas*(1+ep)?100*nm/(x.ventas*(1+ep)):null};
  });
  const tE=esc2.reduce((a,x)=>({m:a.m+x.margen,o:a.o+x.dObra,p:a.p+x.dPrec,t:a.t+x.dTipo,n:a.n+x.nm,v:a.v+x.ventas*(1+ep)}),{m:0,o:0,p:0,t:0,n:0,v:0});
  const tblE=tbl([{t:'Promoción',l:1},{t:'Margen base'},{t:'Obra '+(FE.obra>=0?'+':'')+FE.obra+' %'},
     {t:'Precios '+(FE.precio>=0?'+':'')+FE.precio+' %'},{t:'Tipo '+(FE.tipo>=0?'+':'')+FE.tipo+' pb'},{t:'Margen resultante'},{t:'% margen'}],
    esc2.map(x=>({c:[{v:'<b>'+esc(x.nom)+'</b>'},{v:kEur(x.margen)},{v:kEur(x.dObra),cls:sgn(x.dObra)},
      {v:kEur(x.dPrec),cls:sgn(x.dPrec)},{v:kEur(x.dTipo),cls:sgn(x.dTipo)},
      {v:kEur(x.nm),cls:x.nm<0?'neg':(x.nm<x.margen*0.5?'wrn':'pos')},{v:x.npct!=null?pct1(x.npct):'—'}]}))
    .concat([{cls:'tot',c:[{v:'TOTAL'},{v:kEur(tE.m)},{v:kEur(tE.o)},{v:kEur(tE.p)},{v:kEur(tE.t)},
      {v:kEur(tE.n),cls:tE.n<0?'neg':'pos'},{v:tE.v?pct1(100*tE.n/tE.v):'—'}]}]));
  const pierde=esc2.filter(x=>x.nm<0);
  const alE=pierde.length?`<div class="alert bad" style="margin:12px 0 0"><b>Promociones en pérdidas en este escenario.</b> ${pierde.map(x=>`<b>${esc(x.nom)}</b> ${eur0(x.nm)}`).join(', ')}. El margen del conjunto pasa de ${eur0(tE.m)} a ${eur0(tE.n)}, una caída de ${pct1(tE.m?100*(tE.m-tE.n)/tE.m:0)}.</div>`
    :`<div class="alert ok" style="margin:12px 0 0"><b>Ninguna promoción entra en pérdidas.</b> El margen del conjunto pasa de ${eur0(tE.m)} a ${eur0(tE.n)}, una caída de ${pct1(tE.m?100*(tE.m-tE.n)/tE.m:0)}. El colchón se lo lleva ${esc((esc2.slice().sort((a,b)=>(a.nm/Math.max(a.margen,1))-(b.nm/Math.max(b.margen,1)))[0]||{}).nom||'')}, la más sensible.</div>`;

  return k+al.map(x=>`<div class="alert ${x.t}"><b>${x.h}.</b> ${x.x}</div>`).join('')+`
  <div class="card"><h3>Tesorería proyectada a ${HOR} meses <span class="note">desde ${esc(MLBL[ULT]||ULT)}</span></h3><div class="cbody"><div class="chartbox" style="height:320px"><canvas id="p1"></canvas></div></div></div>
  <div class="card"><h3>Calendario de caja <span class="note">el mes sombreado es el de máxima necesidad</span></h3><div class="cbody scroll">
   ${tbl([{t:'Mes',l:1},{t:'Cobros'},{t:'Obra'},{t:'Resto de pagos'},{t:'Disposición'},{t:'Amortización'},{t:'Flujo neto'},{t:'Saldo'}],rows)}
   <div class="legend">«Resto de pagos» agrupa los gastos no imputables a obra, los intereses del préstamo promotor y el coste de los fondos propios que recoge el modelo. La amortización se deduce de la caída del saldo vivo del préstamo en el cronograma.</div></div></div>
  <div class="card"><h3>Rendimiento de la promoción como inversión <span class="note">sobre el estudio económico completo, no sobre lo ejecutado</span></h3><div class="cbody scroll">
   ${tblR}
   <div class="legend">La TIR se calcula sobre el flujo mensual del modelo —cobros de compradores menos coste de obra y de gastos no imputables a obra— y se anualiza; se marca como no significativa cuando el cronograma sitúa cobros antes que desembolsos y el resultado pierde sentido económico. El múltiplo es el margen sobre la punta máxima de fondos propios del cronograma, más uno. Los importes por metro cuadrado usan la superficie total construida del proyecto.</div></div></div>
  <div class="card"><h3>Escenarios <span class="note">mueve los tres parámetros y mira el margen</span></h3><div class="cbody">
   <div class="toolbar">
     <label class="muted small">Coste de obra
       <select id="eO">${[0,5,10,15,20].map(v=>`<option value="${v}">${v>0?'+':''}${v} %</option>`).join('')}</select></label>
     <label class="muted small">Precios de venta
       <select id="eP">${[0,-2.5,-5,-7.5,-10,5].map(v=>`<option value="${v}">${v>0?'+':''}${v} %</option>`).join('')}</select></label>
     <label class="muted small">Tipo de interés
       <select id="eT">${[0,50,100,150,200].map(v=>`<option value="${v}">${v>0?'+':''}${v} pb</option>`).join('')}</select></label>
   </div>
   ${tblE}${alE}
   <div class="legend">El impacto de obra se aplica sobre la contrata aplicada de cada promoción; el de precios, sobre las ventas del estudio; el de tipos, sobre el saldo medio del préstamo a lo largo del cronograma y por los años que dura. Es una sensibilidad de primer orden: no recalcula el calendario ni el ritmo de ventas.</div>
  </div></div>`;
}
function cProy(){
  const p=proy(SEL); if(!p.cs.length)return;
  ['eO','eP','eT'].forEach(id=>{const e=document.getElementById(id);if(!e)return;
    e.value=String(FE[{eO:'obra',eP:'precio',eT:'tipo'}[id]]);
    e.onchange=()=>{FE.obra=+eO.value;FE.precio=+eP.value;FE.tipo=+eT.value;
      const s=window.scrollY;render();window.scrollTo(0,s);};});
  const L=p.ms.map(m=>MLBL[m]||m);
  chart('p1',{data:{labels:L,datasets:[
    {type:'bar',label:'Cobros',data:p.cob,backgroundColor:'#1b7f4d',borderRadius:2,stack:'a'},
    {type:'bar',label:'Disposición de préstamo',data:p.disp,backgroundColor:'#7a5aa6',borderRadius:2,stack:'a'},
    {type:'bar',label:'Obra',data:p.obr.map(v=>-v),backgroundColor:'#b3261e',borderRadius:2,stack:'a'},
    {type:'bar',label:'Resto de pagos',data:p.ms.map((m,i)=>-(p.noObr[i]+p.intB[i]+p.intF[i])),backgroundColor:'#e0857f',borderRadius:2,stack:'a'},
    {type:'bar',label:'Amortización',data:p.amo.map(v=>-v),backgroundColor:'#8a6f4e',borderRadius:2,stack:'a'},
    {type:'line',label:'Saldo de caja',data:p.saldo,borderColor:'#102C57',borderWidth:2,tension:.25,pointRadius:0,yAxisID:'y'}]},
    options:{...gopt,scales:{...gopt.scales,x:{...gopt.scales.x,stacked:true},y:{...gopt.scales.y,stacked:false}}}});
}
/* =============================================================================
   REPARTO DE COSTE
   Explica y permite corregir la diferencia entre el coste real contable y el
   ejecutado del estudio economico, promocion a promocion.

   De donde sale cada cosa
     - "Real contable" lo forman los asientos de activacion en existencias
       (cuentas 33x de la matriz, 313x/21000x/23100x de solar e inmovilizado y
       las sociedades vehiculo). Son pocos apuntes y son los que mandan.
     - Detras de cada activacion mensual esta el gasto 6xx contabilizado en el
       mes: las facturas de proveedor. Ese es el detalle que se lista aqui.
     - El coste incurrido en meses posteriores al ultimo asiento de variacion de
       existencias todavia no forma parte del Real contable. Es la causa
       mecanica de buena parte de las diferencias y se aisla en el puente.

   Reasignar un apunte no toca el fichero de datos: se guarda en memoria, la
   tabla se recalcula al momento y las decisiones se descargan en un fichero
   para incorporarlas al ETL como regla permanente.
   ============================================================================= */
const RP=DATA.rep||{};
const APU=DATA.apuntes||[];
/* apunte: 0 soc 1 fecha 2 asiento 3 concepto 4 descripcion 5 cuenta 6 debe 7 haber 8 promo 9 naturaleza 10 ejercicio */
const RPS={sel:null, ov:{}, ovc:{}, ok:{}, cap:null, csel:null, vista:'cuadre', q:'', tope:120};
const RESN=RP.residNom||'Suelo y regularizaciones aportados directamente a existencias';
const CAPS=(RP.caps||[]).concat([RESN]);
const capDe=(i,base)=>(RPS.ovc[i]!==undefined?RPS.ovc[i]:base);
const capBase=i=>(RP.cap||{})[i]||'Otros';
const nOvc=()=>Object.keys(RPS.ovc).length;
const okKey=(cod,cap)=>cod+'|'+cap;

const apDebe=i=>APU[i][6]||0;
const apNeto=i=>(APU[i][6]||0)-(APU[i][7]||0);
const apMes =i=>{const f=APU[i][1];return f.slice(6,10)+'-'+f.slice(3,5);};
const apPdf =i=>(RP.pdf||{})[i]||null;
const destino=(i,base)=>(RPS.ov[i]!==undefined?RPS.ov[i]:base);
const nOv=()=>Object.keys(RPS.ov).length;

/* ---- recalculo completo teniendo en cuenta las reasignaciones en pantalla ---- */
function repCalc(){
  const real={},pend={},gas={},nGas={},cap={},idx={};
  const act=RP.act||{}, gg=RP.gas||{}, ua=RP.ultAct||{};
  const add=(d,c,v,i)=>{(cap[d]=cap[d]||{})[c]=(cap[d][c]||0)+v;
                        ((idx[d]=idx[d]||{})[c]=idx[d][c]||[]).push(i);};
  for(const p in act) for(const i of act[p]){
    const d=destino(i,p), v=apDebe(i); real[d]=(real[d]||0)+v;
    const c=(RP.cap||{})[i]; if(c) add(d,capDe(i,c),v,i);
  }
  for(const p in gg)  for(const i of gg[p]){
    const d=destino(i,p), v=apNeto(i);
    gas[d]=(gas[d]||0)+v; nGas[d]=(nGas[d]||0)+1;
    add(d,capDe(i,capBase(i)),v,i);
    const u=ua[d]; if(u&&apMes(i)>u) pend[d]=(pend[d]||0)+v;
  }
  /* el residuo de cada promoción no procede de ningún apunte: es la diferencia entre lo
     que el contable activa contra la 71x y el gasto del periodo. Va en su propia línea. */
  for(const p in (RP.resid||{})){const v=RP.resid[p]; if(v){(cap[p]=cap[p]||{})[RESN]=(cap[p][RESN]||0)+v;}}
  return {real,pend,gas,nGas,cap,idx};
}

/* ---- cuadre por capítulo: cierra siempre contra Real contable y Ejecutado ---- */
function repFilas(cod,c){
  const con=c.cap[cod]||{}, est=(RP.est||{})[cod]||{};
  const nom=new Set(CAPS.concat(Object.keys(con)).concat(Object.keys(est)));
  const o=[];
  nom.forEach(k=>{const a=con[k]||0, b=est[k]||0;
    if(Math.abs(a)<0.005&&Math.abs(b)<0.005) return;
    o.push({cap:k,con:a,est:b,dif:a-b,n:((c.idx[cod]||{})[k]||[]).length,ok:!!RPS.ok[okKey(cod,k)]});});
  o.sort((x,y)=>Math.abs(y.dif)-Math.abs(x.dif));
  return o;
}
/* diferencia que queda sin dar por buena: es lo que el usuario lleva a cero */
function repPorExplicar(cod,c){
  return repFilas(cod,c).filter(f=>!f.ok).reduce((a,f)=>a+f.dif,0);
}

/* ---- desplegable de obra para un apunte ---- */
function oSel(i,base){
  const d=destino(i,base), mod=d!==base;
  const op=P_REAL.map(p=>`<option value="${p.cod}"${p.cod===d?' selected':''}>${esc(p.nom)}</option>`).join('')
    +`<option value="SIN_ASIGNAR"${d==='SIN_ASIGNAR'?' selected':''}>— Sin asignar / Estructura —</option>`;
  return `<select class="osel${mod?' mod':''}" data-i="${i}" data-base="${base}" title="${mod?'Reasignado desde '+esc(PMAP[base]?.nom||base):'Obra segun la contabilidad'}">${op}</select>`;
}

/* ---- tabla de apuntes con selector ---- */
function repTabla(idx,base,opt){
  opt=opt||{};
  const q=(RPS.q||'').toLowerCase().trim();
  let f=idx.slice();
  if(q) f=f.filter(i=>{const r=APU[i];
    return (r[3]+' '+r[4]+' '+r[5]+' '+r[0]+' '+r[1]).toLowerCase().includes(q);});
  f.sort((a,b)=>Math.abs(apNeto(b))-Math.abs(apNeto(a)));
  const n=f.length, corte=f.slice(0,RPS.tope);
  const filas=corte.map(i=>{const r=APU[i], b=opt.base||r[8], mod=destino(i,b)!==b;
    const txt=esc(r[3])+(r[4]&&r[4]!==r[3]?'<div class="muted small">'+esc(r[4])+'</div>':'');
    const pv=(RP.prov||{})[i];
    const cc=[{v:r[1]},
      {v:'<span class="pill">'+esc(r[5])+'</span>'},
      {v:apPdf(i)?pdfLink(apPdf(i),txt):txt,cls:'l'},
      {v:esc(pv||SOCN[r[0]]||r[0]),cls:'l'},
      {v:eur(opt.debe?apDebe(i):apNeto(i))}];
    if(opt.cap) cc.push({v:cSel(i),cls:'l'});
    cc.push({v:oSel(i,b),cls:'l'});
    return {cls:(mod||(opt.cap&&capDe(i,capBase(i))!==capBase(i)))?'mod':'',c:cc};});
  const cab=[{t:'Fecha'},{t:'Cuenta',l:1},{t:'Concepto',l:1},{t:opt.cap?'Proveedor':'Sociedad',l:1},{t:'Importe'}];
  if(opt.cap) cab.push({t:'Capítulo',l:1});
  cab.push({t:'Obra imputada',l:1});
  const t=tbl(cab,filas);
  const tot=f.reduce((a,i)=>a+(opt.debe?apDebe(i):apNeto(i)),0);
  const pie=n>corte.length
    ? `<div class="legend">Se muestran los ${nf0.format(corte.length)} apuntes de mayor importe de ${nf0.format(n)}, que suman ${eur(tot)}. Acota con el buscador o <button class="btn" id="rpMas" style="padding:3px 9px;font-size:11.2px">ver ${nf0.format(Math.min(500,n-corte.length))} más</button></div>`
    : (n?`<div class="legend">${nf0.format(n)} apuntes, ${eur(tot)} en total.</div>`
        :`<div class="legend">No hay apuntes que cumplan el filtro.</div>`);
  return `<div class="scroll">${t}</div>${pie}`;
}

/* ---- selector de capítulo para un apunte ---- */
function cSel(i){
  const b=capBase(i), d=capDe(i,b), mod=d!==b;
  const op=CAPS.filter(x=>x!==RESN).map(x=>`<option value="${esc(x)}"${x===d?' selected':''}>${esc(x)}</option>`).join('');
  return `<select class="csel${mod?' mod':''}" data-i="${i}" data-base="${esc(b)}" title="${mod?'Reclasificado desde '+esc(b):'Capítulo propuesto por la cuenta y el proveedor'}">${op}</select>`;
}

/* ---- cuadre por capítulo, con desglose de facturas al pinchar cada línea ---- */
function repCuadre(cod,c){
  const f=repFilas(cod,c);
  const tc=f.reduce((a,x)=>a+x.con,0), te=f.reduce((a,x)=>a+x.est,0);
  const pe=repPorExplicar(cod,c);
  const filas=[];
  f.forEach(x=>{
    const ab=RPS.cap===x.cap, cl=(x.ok?'ok ':'')+(ab?'sel ':'')+'clk clkc';
    filas.push({cls:cl,attr:`data-c="${esc(x.cap)}"`,c:[
      {v:`<b>${esc(x.cap)}</b>${x.n?` <span class="muted small">${nf0.format(x.n)} apuntes</span>`:''} <span class="lupa">${ab?'▾':'▸'}</span>`},
      {v:eur(x.con)},{v:eur(x.est)},
      {v:eur(x.dif),cls:x.ok?'muted':(Math.abs(x.dif)>100000?'neg':(Math.abs(x.dif)>20000?'wrn':''))},
      {v:x.est?pct1(100*x.dif/x.est):'—',cls:x.ok?'muted':''},
      {v:`<button class="btn tick${x.ok?' on':''}" data-ok="${esc(x.cap)}">${x.ok?'✓ explicado':'marcar explicado'}</button>`,cls:'l'}]});
    if(ab){
      const ii=(c.idx[cod]||{})[x.cap]||[];
      const cuerpo=ii.length
        ? repTabla(ii,cod,{cap:1})
        : `<div class="legend">Esta línea no procede de apuntes individuales: ${x.cap===RESN
            ? 'es la diferencia entre lo que el contable activa cada mes contra la cuenta 71x y el gasto de proveedor del periodo, es decir suelo y regularizaciones que entran directamente en existencias.'
            : 'solo tiene importe en el estudio, la contabilidad no recoge nada en este concepto.'}</div>`;
      filas.push({raw:`<td class="expand2 l" colspan="6"><div class="expwrap2">${cuerpo}</div></td>`});
    }
  });
  filas.push({cls:'tot',c:[{v:'<b>Total</b>'},{v:eur(tc)},{v:eur(te)},{v:eur(tc-te)},
    {v:te?pct1(100*(tc-te)/te):'—'},{v:''}]});
  const t=tbl([{t:'Capítulo',l:1},{t:'Contabilidad'},{t:'Estudio / analítica'},{t:'Diferencia'},{t:'%'},{t:'',l:1}],filas);
  return `${t}
   <div class="legend">La columna <i>Contabilidad</i> suma exactamente el Real contable de la promoción y la columna <i>Estudio</i> el ejecutado, de modo que la diferencia queda repartida al céntimo entre estas líneas: no hay residuo.
   Pincha una línea para ver las facturas que la componen y, si alguna está en el capítulo equivocado, cámbiala en el desplegable. Cuando una línea ya esté entendida, márcala como explicada y dejará de contar en <b>Por explicar</b>, que ahora mismo es ${eur(pe)}.</div>`;
}

/* ---- puente de la diferencia ---- */
function repPuente(cod,c){
  const real=c.real[cod]||0, pend=c.pend[cod]||0, ej=(RP.ejec||{})[cod];
  const aj=real+pend, dif=ej!=null?aj-ej:null, difBruta=ej!=null?real-ej:null;
  const ua=(RP.ultAct||{})[cod];
  const f=[
    {c:[{v:'<b>Real contable</b><div class="muted small">Activación en existencias acumulada a '+esc(DATA.meta.ultimo)+'</div>',cls:'l'},{v:eur(real)}]},
    {c:[{v:'Coste incurrido posterior al último cierre activado<div class="muted small">Gasto contabilizado después de '+(ua?esc(MLBL[ua]||ua):'—')+', todavía sin asiento de variación de existencias</div>',cls:'l'},{v:eur(pend),cls:pend?'wrn':''}]},
    {cls:'tot',c:[{v:'<b>Real contable ajustado</b>',cls:'l'},{v:eur(aj)}]},
  ];
  if(ej!=null){
    f.push({c:[{v:'Ejecutado según el estudio económico',cls:'l'},{v:eur(ej)}]});
    f.push({cls:'tot',c:[{v:'<b>Diferencia por explicar</b>'+(ej?' <span class="muted small">('+pct1(100*dif/ej)+')</span>':''),cls:'l'},
      {v:eur(dif),cls:Math.abs(dif)>150000?'neg':(Math.abs(dif)>50000?'wrn':'pos')}]});
  }
  const t=tbl([{t:'Concepto',l:1},{t:'Importe'}],f);
  let nota='';
  if(ej!=null&&difBruta!=null&&pend){
    const abs0=Math.abs(difBruta), abs1=Math.abs(dif);
    nota=abs1<abs0
      ? `El cierre pendiente explica ${eur(Math.abs(abs0-abs1))} de la diferencia inicial de ${eur(difBruta)}. Queda por explicar ${eur(dif)}.`
      : `El cierre pendiente no acerca las dos cifras: la diferencia pasa de ${eur(difBruta)} a ${eur(dif)}, lo que apunta a que el estudio y la contabilidad no recogen los mismos conceptos.`;
  }
  return `${t}${nota?`<div class="legend">${nota}</div>`:''}`;
}

/* ---- bloque desplegable que se abre dentro de la propia tabla de diferencias ---- */
function repPanel(cod,c){
  const nom=PMAP[cod]?.nom||cod;
  const iAct=(RP.act||{})[cod]||[], iGas=(RP.gas||{})[cod]||[], iPen=(RP.pend||{})[cod]||[];
  const iSin=RP.sin||[];
  /* apuntes traídos desde otras obras por el usuario */
  const traidos=Object.keys(RPS.ov).map(Number).filter(i=>RPS.ov[i]===cod&&APU[i][8]!==cod);
  const real=c.real[cod]||0, pend=c.pend[cod]||0, ej=(RP.ejec||{})[cod];
  const dif=ej!=null?real-ej:null, dif2=ej!=null?real+pend-ej:null;
  const fl=repFilas(cod,c), pex=repPorExplicar(cod,c), nCap=fl.length, nOk=fl.filter(x=>x.ok).length;

  /* resumen en tarjetas: de qué se compone la diferencia de esta promoción */
  const cab=`<div class="pback">
    <div><div class="l">Diferencia a explicar</div><div class="v ${dif!=null&&Math.abs(dif)>150000?'neg':''}">${eur(dif)}</div><div class="d">Real contable menos ejecutado del estudio</div></div>
    <div><div class="l">Facturas aún sin activar</div><div class="v ${pend?'wrn':''}">${eur(pend)}</div><div class="d">${nf0.format(iPen.length)} facturas posteriores al último cierre activado</div></div>
    <div><div class="l">Queda por explicar</div><div class="v ${Math.abs(pex)>150000?'neg':(Math.abs(pex)>1?'wrn':'pos')}">${eur(pex)}</div><div class="d">${nOk} de ${nCap} líneas del cuadre dadas por explicadas</div></div>
   </div>`;

  const V=[['cuadre','Cuadre con el estudio',null],
           ['pen','Facturas aún sin activar',iPen.length],
           ['gas','Todas las facturas imputadas',iGas.length],
           ['act','Asientos que forman el Real contable',iAct.length],
           ['sin','Facturas sin obra asignada',iSin.length],
           ['puente','Puente completo',null]];
  const tabs=V.filter(v=>v[2]===null||v[2]>0).map(v=>
    `<div class="rtab ${RPS.vista===v[0]?'on':''}" data-v="${v[0]}">${v[1]}${v[2]!=null?`<span class="n">${nf0.format(v[2])}</span>`:''}</div>`).join('');
  let cuerpo='';
  if(RPS.vista==='cuadre') cuerpo=repCuadre(cod,c);
  else if(RPS.vista==='puente') cuerpo=repPuente(cod,c);
  else if(RPS.vista==='act') cuerpo=repTabla(iAct,cod,{debe:1,base:cod})
    +`<div class="legend">Estos son los asientos de variación de existencias que forman literalmente el <b>Real contable</b> de la promoción. No son facturas: cada uno agrupa el coste de un mes entero. Cambiar la obra de cualquiera de ellos mueve la cifra al momento, aquí y en la tabla de arriba.</div>`;
  else if(RPS.vista==='gas') cuerpo=repTabla(iGas.concat(traidos),cod)
    +`<div class="legend">Todas las facturas de proveedor y demás gasto que la contabilidad imputa a esta promoción: es el detalle que hay detrás de cada asiento mensual de variación de existencias. Reasignarlas corrige la trazabilidad y el coste por naturaleza; el Real contable se moverá cuando el asiento de variación de existencias recoja el cambio.</div>`;
  else if(RPS.vista==='pen') cuerpo=(iPen.length?repTabla(iPen,cod):'<div class="legend">Esta promoción no tiene facturas posteriores al último cierre activado, de modo que su diferencia con el estudio no viene de un cierre pendiente sino de conceptos que el estudio recoge y la contabilidad no activa en existencias. Mira el puente completo.</div>')
    +(iPen.length?`<div class="legend">Estas son las facturas que justifican la diferencia por el lado contable: están contabilizadas pero son posteriores al último asiento de variación de existencias, así que todavía no forman parte del coste de la obra. Al cambiar la obra de cualquiera de ellas, las tres tarjetas de arriba y la tabla se recalculan al momento.</div>`:'');
  else if(RPS.vista==='sin') cuerpo=repTabla(iSin,'SIN_ASIGNAR')
    +`<div class="legend">Gasto que hoy no está imputado a ninguna promoción: estructura, personal, tributos generales, servicios centrales e intereses del grupo. Si alguno corresponde en realidad a esta obra, elígela en el desplegable y quedará recogido en el fichero de reasignaciones.</div>`;
  const acc=[`<button class="btn pri" id="rpExp"${(nOv()||nOvc())?'':' disabled'}>Descargar reasignaciones${(nOv()+nOvc())?' ('+(nOv()+nOvc())+')':''}</button>`,
             `<button class="btn" id="rpCsv"${(nOv()||nOvc())?'':' disabled'}>Descargar en CSV</button>`,
             `<button class="btn" id="rpDes"${(nOv()||nOvc())?'':' disabled'}>Deshacer todo</button>`,
             `<button class="btn" id="rpCerrar">Cerrar</button>`].join('');
  return `<div class="expwrap">
    <div style="font-weight:600;color:var(--navy);font-size:13.5px;margin-bottom:11px">Facturas y asientos que explican la diferencia de ${esc(nom)}</div>
    ${cab}
    <div class="rtabs">${tabs}</div>
    <div class="toolbar">
      ${RPS.vista==='puente'?'':`<input type="search" id="rpQ" placeholder="Buscar por concepto, cuenta, fecha o sociedad" value="${esc(RPS.q)}">`}
      ${acc}
      <span class="muted small">${nOv()?nOv()+' apunte(s) reasignado(s) en pantalla. Nada se ha modificado en la contabilidad.':''}</span>
    </div>
    ${cuerpo}
  </div>`;
}

/* ---- descarga de las decisiones ---- */
function repDatos(){
  const ks=new Set(Object.keys(RPS.ov).concat(Object.keys(RPS.ovc)).map(Number));
  return [...ks].sort((a,b)=>a-b).map(i=>{const r=APU[i], o=RPS.ov[i], c=RPS.ovc[i];
    return {apunte:i, sociedad:r[0], fecha:r[1], asiento:r[2], cuenta:r[5], concepto:r[3], descripcion:r[4],
            proveedor:(RP.prov||{})[i]||'', importe:apNeto(i), debe:r[6], haber:r[7],
            naturaleza:r[9], ejercicio:r[10],
            obra_contabilidad:r[8], obra_asignada:o!==undefined?o:'',
            obra_contabilidad_nom:PMAP[r[8]]?.nom||r[8], obra_asignada_nom:o!==undefined?(PMAP[o]?.nom||o):'',
            capitulo_propuesto:capBase(i), capitulo_asignado:c!==undefined?c:''};});
}
/* estado del cuadre: que lineas se han dado por explicadas y con que diferencia */
function repCuadreDatos(){
  const c=repCalc(), o=[];
  P_REAL.filter(p=>p.pres).forEach(p=>repFilas(p.cod,c).forEach(f=>o.push({
    promocion:p.cod, promocion_nom:p.nom, capitulo:f.cap,
    contabilidad:+f.con.toFixed(2), estudio:+f.est.toFixed(2), diferencia:+f.dif.toFixed(2),
    apuntes:f.n, explicado:f.ok?'si':'no'})));
  return o;
}
function repBaja(nombre,texto,tipo){
  const b=new Blob([texto],{type:tipo+';charset=utf-8'}), u=URL.createObjectURL(b);
  const a=document.createElement('a'); a.href=u; a.download=nombre; document.body.appendChild(a); a.click();
  document.body.removeChild(a); setTimeout(()=>URL.revokeObjectURL(u),2000);
}
function repExporta(){
  const d=repDatos();
  const j={generado:new Date().toISOString().slice(0,19).replace('T',' '),
           origen:'Cuadro de control de promociones · Promociones Urbanas Montellano, S.L.',
           cierre:DATA.meta.ultimo, datos:DATA.meta.generado||null, n:d.length,
           nota:'Cada linea reasigna un apunte del diario a otra obra, a otro capitulo del estudio, o a las dos cosas. El campo apunte es la posicion en la lista de apuntes del fichero de datos con el que se genero este cuadro; sociedad, fecha, asiento y cuenta lo identifican de forma univoca en la contabilidad. Un campo asignado vacio significa que ese aspecto no se ha tocado.',
           reasignaciones:d, cuadre:repCuadreDatos()};
  repBaja('reasignaciones-coste-'+(DATA.meta.ultimo||'').replace(/\//g,'-')+'.json',JSON.stringify(j,null,1),'application/json');
}
function repExportaCsv(){
  const d=repDatos();
  const col=['apunte','sociedad','fecha','asiento','cuenta','concepto','descripcion','proveedor','importe','naturaleza','ejercicio','obra_contabilidad','obra_contabilidad_nom','obra_asignada','obra_asignada_nom','capitulo_propuesto','capitulo_asignado'];
  const esc2=v=>{const s=String(v==null?'':v); return /[";\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
  const txt='﻿'+col.join(';')+'\n'+d.map(r=>col.map(k=>esc2(k==='importe'?String(r[k]).replace('.',','):r[k])).join(';')).join('\n');
  repBaja('reasignaciones-coste-'+(DATA.meta.ultimo||'').replace(/\//g,'-')+'.csv',txt,'text/csv');
}

/* ---- conexion de eventos del panel ---- */
function repWire(){
  document.querySelectorAll('#main tr.clkp').forEach(tr=>tr.onclick=ev=>{
    if(ev.target.closest('select,a,button')) return;
    const p=tr.dataset.p; RPS.sel=(RPS.sel===p?null:p); RPS.vista='cuadre'; RPS.cap=null; RPS.q=''; RPS.tope=120; render();});
  document.querySelectorAll('#main .rtab').forEach(t=>t.onclick=()=>{RPS.vista=t.dataset.v; RPS.tope=120; RPS.cap=null; render();});
  document.querySelectorAll('#main tr.clka').forEach(tr=>tr.onclick=ev=>{
    if(ev.target.closest('select,a,button')) return;
    const a=tr.dataset.a; RPS.csel=(RPS.csel===a?null:a); RPS.cap=null; RPS.tope=15; render();});
  document.querySelectorAll('#main tr.clkc').forEach(tr=>tr.onclick=ev=>{
    if(ev.target.closest('select,a,button')) return;
    const k=tr.dataset.c; RPS.cap=(RPS.cap===k?null:k); RPS.tope=120; render();});
  document.querySelectorAll('#main button.tick').forEach(b=>b.onclick=ev=>{
    ev.stopPropagation(); const k=okKey(RPS.sel,b.dataset.ok);
    if(RPS.ok[k]) delete RPS.ok[k]; else RPS.ok[k]=true; render();});
  document.querySelectorAll('#main select.csel').forEach(s2=>s2.onchange=()=>{
    const i=+s2.dataset.i, base=s2.dataset.base;
    if(s2.value===base) delete RPS.ovc[i]; else RPS.ovc[i]=s2.value;
    render();});
  document.querySelectorAll('#main select.osel').forEach(s=>s.onchange=()=>{
    const i=+s.dataset.i, base=s.dataset.base;
    if(s.value===base) delete RPS.ov[i]; else RPS.ov[i]=s.value;
    render();});
  const q=document.getElementById('rpQ');
  if(q) q.oninput=()=>{clearTimeout(window.__rpT);
    window.__rpT=setTimeout(()=>{const v=q.value; RPS.q=v; RPS.tope=120; render();
      const n=document.getElementById('rpQ'); if(n){n.focus(); n.setSelectionRange(v.length,v.length);} },260);};
  const m=document.getElementById('rpMas'); if(m) m.onclick=()=>{RPS.tope+=500; render();};
  document.querySelectorAll('#main button.masconc').forEach(b=>b.onclick=ev=>{
    ev.stopPropagation(); RPS.tope+=100; render();});
  const x=document.getElementById('rpCerrar'); if(x) x.onclick=()=>{RPS.sel=null; render();};
  const e=document.getElementById('rpExp'); if(e) e.onclick=repExporta;
  const c=document.getElementById('rpCsv'); if(c) c.onclick=repExportaCsv;
  const d=document.getElementById('rpDes'); if(d) d.onclick=()=>{RPS.ov={}; render();};
}

/* =============================================================================
   CONCILIACION CONTRA LA ANALITICA DE CONTABILIDAD
   Descompone la diferencia entre lo que este cuadro imputa a cada promocion y lo
   que le imputa la analitica. Las partidas suman la diferencia exacta: no hay
   nada que dar por bueno a mano, cada linea es una factura con nombre y fecha.
   ============================================================================= */
const CONC=RP.conc||{};
/* Tres bloques, no seis: la misma factura repartida distinto, facturas que solo tiene
   uno de los dos, y coste que entra en existencias sin pasar por factura. */
const CGRP={reparto:'reparto',otra_obra:'reparto',importe:'importe',
            solo_ana:'solo_uno',no_ana:'solo_uno',
            residuo:'activacion',directa:'activacion'};
const CTIP={
  reparto:['La misma factura, repartida entre obras de otra manera','Los dos tenemos la factura por el mismo importe, pero la asignamos a obras distintas: la analítica la trocea entre proyectos y fases. Sumando todas las promociones este bloque netea cero, porque lo que una obra pierde otra lo gana. Es un criterio de reparto a acordar, no un error.'],
  importe:['La misma factura, con importe distinto','El importe total de la factura no coincide entre la analítica y el diario. Esto no se reparte: es una incidencia a resolver. La causa principal son abonos que la analítica suma en positivo y nóminas contabilizadas por el doble.'],
  solo_uno:['Facturas que solo tiene uno de los dos','Apuntes de la analítica que no encuentro en el diario, y movimientos míos que su fichero no recoge por ser de sociedad vehículo o posteriores a su fecha de corte.'],
  activacion:['Coste que entra en existencias sin factura','Compras de suelo e inmovilizado que no pasan por una cuenta de gasto, y la parte que el contable activa cada mes por encima del gasto del periodo.'],
};
function concFilas(cod){
  const it=CONC[cod]||[], g={};
  it.forEach(x=>{const k=CGRP[x.t]||x.t;
    (g[k]=g[k]||{n:0,imp:0,it:[]}); g[k].n++; g[k].imp+=x.imp; g[k].it.push(x);});
  return Object.entries(g).sort((a,b)=>Math.abs(b[1].imp)-Math.abs(a[1].imp));
}
function concDetalle(cod,t){
  const it=(concFilas(cod).find(x=>x[0]===t)||[null,{it:[]}])[1].it.slice()
    .sort((a,b)=>Math.abs(b.imp)-Math.abs(a.imp)).slice(0,RPS.tope);
  const filas=it.map(x=>{
    const i=x.i, r=i!=null?APU[i]:null;
    const txt=r?esc(r[3])+(r[4]&&r[4]!==r[3]?'<div class="muted small">'+esc(r[4])+'</div>':''):'<span class="muted">—</span>';
    const rep=[];
    const SUB={otra_obra:'la analítica lo lleva entero a otro proyecto',solo_ana:'no aparece en el diario',
               no_ana:'la analítica no lo recoge',residuo:'activación sobre el gasto del periodo',
               directa:'compra directa a existencias',
               importe:'incidencia: el importe no coincide'};
    if(SUB[x.t]) rep.push('<i>'+SUB[x.t]+'</i>');
    if(x.otros&&Object.keys(x.otros).length) rep.push('analítica → '+Object.entries(x.otros).map(([k,v])=>`${esc(PMAP[k]?.nom||k)} ${eur(v)}`).join(' · '));
    if(x.mios&&Object.keys(x.mios).length) rep.push('yo también → '+Object.entries(x.mios).map(([k,v])=>`${esc(PMAP[k]?.nom||k)} ${eur(v)}`).join(' · '));
    return {c:[{v:r?r[1]:'—'},{v:r?'<span class="pill">'+esc(r[5])+'</span>':''},
      {v:(r&&apPdf(i))?pdfLink(apPdf(i),txt):txt,cls:'l'},
      {v:x.mio!=null?eur(x.mio):'<span class="muted">—</span>'},
      {v:x.ana!=null?eur(x.ana):'<span class="muted">—</span>'},
      {v:eur(x.imp),cls:Math.abs(x.imp)>100000?'neg':(Math.abs(x.imp)>20000?'wrn':'')},
      {v:rep.length?'<span class="muted small">'+rep.join('<br>')+'</span>':'',cls:'l'},
      {v:(i!=null&&APU[i])?oSel(i,APU[i][8]):'<span class="muted">—</span>',cls:'l'}]};});
  return `<div class="scroll">${tbl([{t:'Fecha'},{t:'Cuenta',l:1},{t:'Concepto',l:1},{t:'Mi reparto'},{t:'Analítica'},{t:'Diferencia'},{t:'Cómo lo reparte',l:1},{t:'Cambiar la obra',l:1}],filas)}</div>
   <div class="legend">Si una factura está imputada a la obra equivocada, cámbiala en el desplegable de la derecha. La decisión queda recogida y se descarga con el botón <i>Descargar reasignaciones</i> de la pestaña de promoción, para incorporarla al ETL como regla permanente. <b>Ojo:</b> esta tabla no se recalcula al momento, porque la columna de la analítica es un fichero cerrado; el efecto se ve al regenerar el cuadro.</div>`;
}
function concPanel(cod){
  /* Una sola lista, plana y ordenada por peso: cada fila es una factura o un
     movimiento concreto, con su motivo escrito en castellano y su efecto en
     euros sobre la diferencia. Nada queda escondido detras de un segundo clic:
     lo que no cabe se agrega en la fila "resto", de modo que la columna de
     efecto suma exactamente la diferencia publicada. */
  const it=(CONC[cod]||[]).slice().sort((a,b)=>Math.abs(b.imp)-Math.abs(a.imp));
  const cm=(DATA.ana?.cmp||[]).find(x=>x.cod===cod)||{base:0,ana:0,dif:0,spv:0,apert:0,julio:0};
  const dif=cm.dif||0, N=Math.min(RPS.tope,it.length);
  const motivo=x=>{
    if(x.t==='importe') return `<b>El importe no coincide.</b> Yo tengo ${eur(x.mio)} y la analítica ${eur(x.ana)}: probable abono sumado en positivo o importe duplicado. Incidencia para contabilidad.`;
    if(x.t==='otra_obra'){const o=Object.entries(x.otros||{}).map(([k,v])=>`${esc(PMAP[k]?.nom||k)} (${eur(v)})`).join(' y ');
      return `<b>La analítica la lleva a otra obra:</b> ${o||'otro proyecto'}. Yo la dejo aquí porque la cuenta y el asiento apuntan a esta promoción.`;}
    if(x.t==='reparto'){const o=Object.entries(x.otros||{}).map(([k,v])=>`${esc(PMAP[k]?.nom||k)} ${eur(v)}`).join(' · ');
      return `<b>Repartida distinto.</b> La analítica la trocea: ${o||'entre proyectos y fases'}.`;}
    if(x.t==='solo_ana') return `<b>Solo está en la analítica.</b> No encuentro un apunte del diario con esa fecha, cuenta y concepto.`;
    if(x.t==='no_ana') return `<b>Solo está en el diario.</b> Su fichero no la recoge: sociedad vehículo o posterior a su corte de junio.`;
    if(x.t==='residuo') return `<b>Activación sin factura.</b> El asiento mensual de variación de existencias activa más de lo que suma el gasto del periodo.`;
    if(x.t==='directa') return `<b>Compra directa a existencias.</b> Suelo o inmovilizado que entra sin pasar por una cuenta de gasto.`;
    return '';};
  const filas=it.slice(0,N).map(x=>{
    const i=x.i, r=i!=null?APU[i]:null;
    const txt=r?esc(r[3])+(r[4]&&r[4]!==r[3]?'<div class="muted small">'+esc(r[4])+'</div>':'')
             :'<span class="muted">(sin apunte en el diario)</span>';
    return {c:[
      {v:r?r[1]:'—'},
      {v:(r&&apPdf(i))?pdfLink(apPdf(i),txt):txt,cls:'l'},
      {v:'<span class="small">'+motivo(x)+'</span>',cls:'l'},
      {v:eur(-x.imp),cls:Math.abs(x.imp)>100000?'neg':(Math.abs(x.imp)>20000?'wrn':'')},
      {v:(i!=null&&APU[i])?oSel(i,APU[i][8]):'<span class="muted">—</span>',cls:'l'}]};});
  const resto=it.slice(N), rimp=resto.reduce((a,x)=>a+x.imp,0);
  if(resto.length) filas.push({c:[{v:'—'},
    {v:`<b>Resto</b>: ${nf0.format(resto.length)} partidas menores`,cls:'l'},
    {v:`<button class="btn masconc">Ver las ${nf0.format(Math.min(100,resto.length))} siguientes</button>`,cls:'l'},
    {v:eur(-rimp)},{v:''}]});
  filas.push({cls:'tot',c:[{v:''},{v:'<b>Diferencia total</b>',cls:'l'},
    {v:'<span class="small">Contabilidad '+eur(cm.base)+' menos analítica '+eur(cm.ana)+'</span>',cls:'l'},
    {v:eur(dif),cls:Math.abs(dif)>100000?'neg':'wrn'},{v:''}]});
  const cubierto=it.slice(0,N).reduce((a,x)=>a+Math.abs(x.imp),0);
  const total=it.reduce((a,x)=>a+Math.abs(x.imp),0);
  return `<div class="expwrap">
    <div style="font-weight:600;color:var(--navy);font-size:13.5px;margin-bottom:4px">Qué compone la diferencia de ${esc(PMAP[cod]?.nom||cod)}: ${eur(dif)}</div>
    <div class="legend" style="margin:0 0 10px">Contabilidad y OCR de facturas: ${eur(cm.base)} · Analítica: ${eur(cm.ana)}. Debajo, cada factura o movimiento que separa las dos cifras, de mayor a menor, con su motivo. La columna de efecto suma exactamente la diferencia.
    ${total?`Las ${nf0.format(N)} partidas visibles cubren el ${pct1(100*cubierto/total)} del importe en juego.`:''}</div>
    <div class="toolbar">
      <button class="btn pri" id="rpExp"${(nOv()||nOvc())?'':' disabled'}>Descargar cambios de obra${(nOv()+nOvc())?' ('+(nOv()+nOvc())+')':''}</button>
      <button class="btn" id="rpCsv"${(nOv()||nOvc())?'':' disabled'}>Descargar en CSV</button>
      <button class="btn" id="rpDes"${(nOv()||nOvc())?'':' disabled'}>Deshacer todo</button>
      ${resto.length?`<button class="btn masconc">Ver ${nf0.format(Math.min(100,resto.length))} más</button>`:''}
      <span class="muted small">${nOv()+nOvc()?(nOv()+nOvc())+' apunte(s) con cambio de obra propuesto.':'Si una factura está en la obra equivocada, cámbiala en el desplegable: la propuesta se descarga con el botón.'}</span>
    </div>
    <div class="scroll">${tbl([{t:'Fecha'},{t:'Factura / movimiento',l:1},{t:'Qué ocurre',l:1},{t:'Efecto'},{t:'Cambiar la obra',l:1}],filas)}</div>
    <div class="legend">Positivo acerca mi cifra a la suya; negativo la aleja. Se descuentan antes los movimientos que su fichero no recoge (sociedad vehículo, apertura y julio), que no son discrepancia sino perímetro.</div>
  </div>`;
}
/* ============================== CALIDAD DE DATOS ============================== */
function vCal(){
  const q=DATA.calidad, e=EJS===TODOS?'TOT':String(EJS), cq=q.porEj[e];
  const frTot=(q.fr_n['Pagada']||0)+(q.fr_n['Parcial']||0)+(q.fr_n['Sin pago identificado']||0);
  const k=`<div class="kpis">
   <div class="kpi"><div class="l">Coste asignado a promoción</div><div class="v pos">${pct1(q.pctActAsig)}</div><div class="d">${kEur(q.actTot)} de coste incurrido, todo imputado</div></div>
   <div class="kpi"><div class="l">Ingresos asignados</div><div class="v ${cq.pct_ing>95?'pos':'wrn'}">${pct1(cq.pct_ing)}</div><div class="d">${kEur(cq.ing-cq.ing_sin)} de ${kEur(cq.ing)}</div></div>
   <div class="kpi"><div class="l">Naturaleza trazable</div><div class="v ${(100-cq.pct_sin)>60?'pos':'wrn'}">${pct1(100-cq.pct_sin)}</div><div class="d">del gasto contabilizado</div></div>
   <div class="kpi"><div class="l">Gasto de estructura</div><div class="v wrn">${pct1(cq.pct_sin)}</div><div class="d">${kEur(cq.sin)} no imputable a promoción</div></div>
   <div class="kpi"><div class="l">Facturas conciliadas</div><div class="v ${(q.fr_n.Pagada/frTot)>0.8?'pos':'wrn'}">${pct1(100*q.fr_n.Pagada/frTot)}</div><div class="d">${nf0.format(q.fr_n.Pagada)} de ${nf0.format(frTot)} facturas de proveedor</div></div>
   <div class="kpi"><div class="l">Descuadres contables</div><div class="v ${q.descuadres.length?'neg':'pos'}">${q.descuadres.length}</div><div class="d">Asientos con debe ≠ haber</div></div>
  </div>`;
  const alertas=[];
  const sinAct=q.conc.filter(x=>x.act===0&&x.gasto>1000&&x.ej>=2025&&(EJS===TODOS||x.ej==EJS));
  const anual=q.conc.filter(x=>x.act===0&&x.gasto>1000&&x.ej<2025&&(EJS===TODOS||x.ej==EJS));
  if(sinAct.length) alertas.push({t:'bad',h:'Meses cerrados sin imputar a promoción',
    x:`No hay asiento de variación de existencias en ${sinAct.map(x=>x.mes).join(', ')}. El gasto de ${eur0(sinAct.reduce((a,x)=>a+x.gasto,0))} está contabilizado pero todavía no repartido entre promociones, por lo que no aparece en el coste de ninguna de ellas.`});
  if(anual.length) alertas.push({t:'',h:'Imputación anual en 2023 y 2024',
    x:`En ${anual.length} meses de 2023 y 2024 no hay asiento de variación de existencias porque en esos ejercicios la imputación a promociones se hacía una sola vez al año, en diciembre. El acumulado por promoción es correcto; lo que no es representativo es el reparto mensual anterior a 2025.`});
  if(q.descuadres.length) alertas.push({t:'bad',h:'Asientos descuadrados',
    x:`${q.descuadres.length} asiento(s) con debe distinto de haber, por ${eur(q.descuadres.reduce((a,x)=>a+x.dif,0))}.`});
  if(q.sincuenta.length) alertas.push({t:'',h:'Apuntes sin cuenta contable',
    x:`${q.sincuenta.length} apunte(s) llegan del fichero sin número de cuenta, por ${eur(q.sincuenta.reduce((a,x)=>a+x.debe-x.haber,0))}.`});
  alertas.push({t:'',h:'Cuenta de obra común de Doñinos',
    x:`La cuenta 60600002 «Coste obra chalets Doñinos» recoge la obra de las dos promociones de Doñinos sin distinguirlas. Se atribuye a <b>Puerto de Salamanca</b> por ser la única en ejecución y con compradores en el periodo; Doñinos Residencial arranca obra en 09/2026 y ya tiene su propia cuenta 60600012. El coste por promoción no depende de esta atribución: lo fija el asiento de variación de existencias, que sí separa las cuentas 33000001, 33000003 y 33000004. Abrir subcuentas 606 por promoción cerraría también el desglose por naturaleza.`});
  if(q.fr_n['Sin pago identificado']) alertas.push({t:'',h:'Facturas sin pago identificado',
    x:`${q.fr_n['Sin pago identificado']} facturas por ${eur(q.fr_estado['Sin pago identificado'])} no tienen pago casado por referencia. Incluye facturas realmente pendientes y facturas pagadas cuyo concepto de pago no reproduce la referencia.`});
  if(q.pagos_sin_n) alertas.push({t:'',h:'Pagos sin factura en el registro',
    x:`${q.pagos_sin_n} pagos por ${eur(q.pagos_sin)} corresponden a facturas anteriores a 2023 o a efectos cuya referencia no aparece en el registro de facturas.`});

  const tReglas=tbl([{t:'Criterio de asignación',l:1},{t:'Ámbito',l:1},{t:'Fiabilidad',l:1}],[
    {c:[{v:'<b>Cuenta de existencias</b>'},{v:'Las cuentas 330000xx identifican promoción y fase; el asiento mensual de variación de existencias reparte ahí todo el coste incurrido'},{v:'<span class="chip ok">Alta</span>'}]},
    {c:[{v:'<b>Sociedad vehículo</b>'},{v:'Cada SPV del grupo corresponde a una única promoción'},{v:'<span class="chip ok">Alta</span>'}]},
    {c:[{v:'<b>Cuenta de solar e inmovilizado</b>'},{v:'Cuentas 313000xx, 21000x y 23100x con la promoción en su denominación'},{v:'<span class="chip ok">Alta</span>'}]},
    {c:[{v:'<b>Cuenta de coste de obra</b>'},{v:'Cuentas 606000xx abiertas por promoción, salvo la común de Doñinos'},{v:'<span class="chip ok">Alta</span>'}]},
    {c:[{v:'<b>Sufijo en la cuenta de cliente</b>'},{v:'Las cuentas 430000xx llevan el código de promoción y fase (NCF1, DOF2, DOF3, VVH…)'},{v:'<span class="chip ok">Alta</span>'}]},
    {c:[{v:'<b>Serie de la factura emitida</b>'},{v:'El concepto indica la serie (DO2, DO3, NCM, PV) que identifica promoción y fase'},{v:'<span class="chip ok">Alta</span>'}]},
    {c:[{v:'<b>Número de préstamo</b>'},{v:'Cada préstamo promotor (21873 a 21877) está vinculado a una promoción y fase'},{v:'<span class="chip ok">Alta</span>'}]},
    {c:[{v:'<b>Cuenta bancaria</b>'},{v:'Cuentas de reservas y de pagos abiertas por promoción y, en varios casos, por fase'},{v:'<span class="chip ok">Alta</span>'}]},
    {c:[{v:'<b>Herencia dentro del asiento</b>'},{v:'IVA y cuentas de tercero heredan la promoción cuando el asiento identifica una sola'},{v:'<span class="chip info">Media</span>'}]},
    {c:[{v:'<b>Cuentas comunes de Doñinos</b>'},{v:'La obra, los avales y la tesorería de Doñinos se atribuyen a Puerto de Salamanca, única promoción de Doñinos en ejecución y con compradores en el periodo'},{v:'<span class="chip info">Media</span>'}]},
    {c:[{v:'<b>Sin criterio</b>'},{v:'Personal, tributos genéricos, servicios centrales e intereses con el grupo'},{v:'<span class="chip bad">No asignado</span>'}]},
  ]);
  const conc=q.conc.filter(x=>EJS===TODOS||x.ej==EJS);
  const tConc=tbl([{t:'Mes',l:1},{t:'Gasto contabilizado'},{t:'Coste imputado a promoción'},{t:'Diferencia'},{t:'Situación',l:1}],
    conc.map(x=>({c:[{v:x.mes},{v:eur(x.gasto)},{v:eur(x.act)},{v:eur(x.dif),cls:Math.abs(x.dif)>80000?'wrn':''},
      {v:x.act===0&&x.gasto>1000?'<span class="chip bad">Sin variación de existencias</span>':(Math.abs(x.dif)>80000?'<span class="chip warn">Diferencia relevante</span>':'<span class="chip ok">Conciliado</span>')}]})));
  const tSin=tbl([{t:'Cuenta',l:1},{t:'Denominación',l:1},{t:'Naturaleza',l:1},{t:'Apuntes'},{t:'Importe'}],
    q.sindet.slice(0,45).map(x=>({c:[{v:'<span class="pill">'+x.cta+'</span>'},{v:esc(x.desc)},{v:esc(x.nat)},{v:nf0.format(x.n)},{v:eur(x.imp)}]})));
  const tDon=tbl([{t:'Cuenta',l:1},{t:'Denominación',l:1},{t:'Naturaleza',l:1},{t:'Apuntes'},{t:'Importe'}],
    q.dondet.map(x=>({c:[{v:'<span class="pill">'+x.cta+'</span>'},{v:esc(x.desc)},{v:esc(x.nat)},{v:nf0.format(x.n)},{v:eur(x.imp)}]})));
  const frSin=DATA.frac.filter(x=>x[7]!=='Pagada'&&(EJS===TODOS||x[10]==EJS)).sort((a,b)=>b[6]-a[6]);
  const tFr=tbl([{t:'Proveedor',l:1},{t:'Referencia',l:1},{t:'Fecha'},{t:'Importe'},{t:'Pagado'},{t:'Pendiente'},{t:'Promoción',l:1}],
    frSin.slice(0,60).map(x=>({c:[{v:esc(x[1])+'<div class="muted small">'+x[0]+'</div>'},{v:'<span class="pill">'+esc(x[2])+'</span>'},{v:x[3]},
      {v:eur(x[4])},{v:eur(x[5])},{v:eur(x[6]),cls:'wrn'},{v:'<span class="chip">'+esc(PMAP[x[8]]?.nom||x[8])+'</span>'}]})));
  // mi reparto frente a la analitica de contabilidad
  const AC=DATA.ana?.cmp||[];
  const expl=x=>{
    if(Math.abs(x.dif)<0.5) return '<span class="chip ok">Coincide</span>';
    const p=[];
    if(x.spv) p.push('la analítica no recoge la sociedad vehículo');
    if(x.apert) p.push('el suelo entra por el asiento de apertura');
    if(x.cod==='SIN_ASIGNAR') p.push('la analítica reparte estructura que aquí no se imputa a obra');
    if(x.cod==='OFICINAS') p.push('la analítica trata oficinas como proyecto');
    return p.length?'<span class="chip info">'+esc(p.join(' · '))+'</span>':'<span class="chip warn">Pendiente de explicar</span>';};
  const acr=[];
  AC.filter(x=>x.base>0.5||Math.abs(x.ana)>0.5).forEach(x=>{
   const ab=RPS.csel===x.cod, hay=(DATA.rep?.conc||{})[x.cod];
   acr.push({cls:hay?('clk clka'+(ab?' sel':'')):'',attr:hay?`data-a="${x.cod}"`:'',c:[
      {v:'<b>'+esc(PMAP[x.cod]?.nom||x.cod)+'</b>'+(hay?` <span class="lupa">${ab?'▾ ocultar desglose':'▸ desglosar la diferencia'}</span>`:'')},
      {v:eur(x.mio_total)},
      {v:x.spv||x.apert?eur(-(x.spv+x.apert)):'<span class="muted">—</span>',cls:'muted'},
      {v:eur(x.base)},{v:eur(x.ana)},
      {v:eur(x.dif),cls:Math.abs(x.dif)<0.5?'pos':(Math.abs(x.dif)>100000?'neg':'wrn')},
      {v:x.ana?pct1(100*x.dif/x.ana):'—'},
      {v:expl(x),cls:'l'}]});
   if(ab) acr.push({raw:`<td class="expand l" colspan="8">${concPanel(x.cod)}</td>`});});
  {const t=AC.reduce((a,x)=>({m:a.m+x.mio_total,s:a.s+x.spv+x.apert,b:a.b+x.base,a:a.a+x.ana,d:a.d+x.dif}),{m:0,s:0,b:0,a:0,d:0});
   acr.push({cls:'tot',c:[{v:'<b>Total</b>'},{v:eur(t.m)},{v:eur(-t.s)},{v:eur(t.b)},{v:eur(t.a)},{v:eur(t.d)},
     {v:t.a?pct1(100*t.d/t.a):'—'},{v:''}]});}
  const tAna=tbl([{t:'Promoción',l:1},{t:'Según la contabilidad'},{t:'No comparable'},{t:'Base comparable'},{t:'Analítica'},{t:'Diferencia'},{t:'%'},{t:'Motivo',l:1}],acr);
  // contraste real contable vs ejecutado del estudio
  const RC=repCalc();
  const cmpP=P_REAL.filter(p=>p.pres);
  const cmp=[];
  cmpP.forEach(p=>{const x=DATA.pres[p.cod];
    const real=RC.real[p.cod]||0, pend=RC.pend[p.cod]||0, dif=real-x.ejec, dif2=real+pend-x.ejec;
    const ab=RPS.sel===p.cod;
    cmp.push({cls:'clk clkp'+(ab?' sel':''),attr:`data-p="${p.cod}"`,c:[
      {v:`<b>${esc(p.nom)}</b> <span class="lupa">${ab?'▾ ocultar facturas':'▸ ver facturas de la diferencia'}</span>`},
      {v:eur(real)},{v:eur(x.ejec)},{v:eur(dif),cls:Math.abs(dif)>200000?'wrn':''},
      {v:x.ejec?pct1(100*dif/x.ejec):'—'},
      {v:pend?eur(pend):'<span class="muted">—</span>',cls:pend?'wrn':''},
      {v:eur(dif2),cls:Math.abs(dif2)>200000?'neg':(Math.abs(dif2)>50000?'wrn':'pos')}]});
    if(ab) cmp.push({raw:`<td class="expand l" colspan="7">${repPanel(p.cod,RC)}</td>`});});
  {const tr=cmpP.reduce((a,p)=>{const x=DATA.pres[p.cod];a.r+=RC.real[p.cod]||0;a.e+=x.ejec;a.p+=RC.pend[p.cod]||0;return a;},{r:0,e:0,p:0});
   cmp.push({cls:'tot',c:[{v:'<b>Total promociones con estudio</b>'},{v:eur(tr.r)},{v:eur(tr.e)},{v:eur(tr.r-tr.e)},
     {v:tr.e?pct1(100*(tr.r-tr.e)/tr.e):'—'},{v:eur(tr.p)},{v:eur(tr.r+tr.p-tr.e)}]});}
  const tDesc=q.descuadres.length?tbl([{t:'Sociedad',l:1},{t:'Fecha'},{t:'Asiento'},{t:'Debe'},{t:'Haber'},{t:'Diferencia'}],
    q.descuadres.map(x=>({c:[{v:esc(x.soc)},{v:x.fecha},{v:x.asiento},{v:eur(x.debe)},{v:eur(x.haber)},{v:eur(x.dif),cls:'neg'}]}))):'';
  const tSc=q.sincuenta.length?tbl([{t:'Sociedad',l:1},{t:'Fecha'},{t:'Asiento'},{t:'Concepto',l:1},{t:'Descripción',l:1},{t:'Debe'},{t:'Haber'}],
    q.sincuenta.map(x=>({c:[{v:esc(x.soc)},{v:x.fecha},{v:x.asiento},{v:esc(x.com)},{v:esc(x.desc)},{v:eur(x.debe)},{v:eur(x.haber)}]}))):'';
  /* La pestana responde a una sola pregunta: cuanto sale de la contabilidad leyendo
     todas las facturas, cuanto dice la analitica, y que facturas explican la diferencia.
     Todo lo demas es respaldo y va plegado al final. */
  const AT=AC.reduce((a,x)=>({m:a.m+x.base,n:a.n+x.ana,d:a.d+x.dif}),{m:0,n:0,d:0});
  const nCoinc=AC.filter(x=>Math.abs(x.dif)<0.5&&(x.base>0.5||Math.abs(x.ana)>0.5)).length;
  const nCon=AC.filter(x=>x.base>0.5||Math.abs(x.ana)>0.5).length;
  const nPart=Object.values(DATA.rep?.conc||{}).reduce((a,v)=>a+v.length,0);
  const kc=`<div class="kpis">
   <div class="kpi"><div class="l">Según la contabilidad</div><div class="v">${kEur(AT.m)}</div><div class="d">Coste imputado leyendo ${nf0.format(DATA.meta.lineasMov)} apuntes y ${nf0.format(DATA.frac.length)} facturas</div></div>
   <div class="kpi"><div class="l">Según la analítica</div><div class="v">${kEur(AT.n)}</div><div class="d">Lo que el fichero de contabilidad asigna a proyecto, hasta ${esc(DATA.ana?.corte||'—')}</div></div>
   <div class="kpi"><div class="l">Diferencia</div><div class="v ${Math.abs(AT.d)>500000?'neg':'wrn'}">${kEur(AT.d)}</div><div class="d">${pct1(AT.n?100*AT.d/AT.n:0)} sobre la analítica</div></div>
   <div class="kpi"><div class="l">Explicada al céntimo</div><div class="v pos">100,0 %</div><div class="d">${nf0.format(nPart)} partidas identificadas, sin residuo</div></div>
   <div class="kpi"><div class="l">Promociones que cuadran</div><div class="v ${nCoinc?'pos':'wrn'}">${nCoinc} de ${nCon}</div><div class="d">Sin ninguna diferencia frente a la analítica</div></div>
  </div>`;
  return kc+
   `<div class="card"><h3>Contabilidad frente a analítica <span class="note">pincha una promoción para ver las facturas que causan su diferencia</span></h3><div class="cbody">
     ${tAna}
     <div class="legend"><b>Según la contabilidad</b> es el coste que este cuadro imputa a cada promoción leyendo los diarios factura a factura. <b>Analítica</b> es lo que el fichero que mantiene contabilidad asigna a ese mismo proyecto.
     Para comparar lo mismo se descuenta lo que la analítica no recoge: las sociedades vehículo, que no entran en su fichero, y el asiento de apertura.
     Al pinchar una promoción se despliegan directamente las facturas y movimientos que componen su diferencia, de mayor a menor, cada uno con su motivo y su efecto en euros; la columna de efecto suma la diferencia exacta.</div></div></div>
   `+alertas.map(x=>`<div class="alert ${x.t}"><b>${x.h}.</b> ${x.x}</div>`).join('')+
   `<div class="card"><h3>Respaldo del cuadre <span class="note">criterios, bandeja y avisos del diario</span></h3>
     <details><summary><span>Criterios de asignación aplicados</span></summary><div class="dbody">${tReglas}
       <div class="legend">Ninguna partida se reparte por estimación. Lo que no encaja en un criterio verificable permanece en la bandeja.</div></div></details>
     <details><summary><span>Bandeja «Sin asignar» · ${eur(cq.sin)} de gasto de estructura</span></summary><div class="dbody">${tSin}</div></details>
     <details><summary><span>Facturas de proveedor sin pago identificado · ${nf0.format(frSin.length)} facturas, ${eur(frSin.reduce((a,x)=>a+x[6],0))} pendiente</span></summary><div class="dbody">${tFr}</div></details>
     ${q.descuadres.length?`<details><summary><span>Descuadres contables · ${q.descuadres.length}</span></summary><div class="dbody">${tDesc}</div></details>`:''}
     ${q.sincuenta.length?`<details><summary><span>Apuntes sin cuenta contable · ${q.sincuenta.length}</span></summary><div class="dbody">${tSc}</div></details>`:''}
   </div>`;
}
function cCal(){repWire();}

/* ============================== ARRANQUE ============================== */
/* Seis pestanas. Lo que antes estaba repartido en doce se agrupa por decision:
   la promocion entera en una vista, todo el dinero en otra, y una sola
   conciliacion en lugar de las cinco versiones que habia del mismo cuadre. */
const TABS=[['res','Resumen'],['prom','Promoción'],['caja','Caja y deuda'],
            ['com','Comercial'],['ter','Clientes y proveedores'],
            ['conc','Conciliación'],['det','Detalle']];
const sep=t=>`<div class="secdiv"><span>${esc(t)}</span></div>`;
/* Al encadenar vistas dentro de una misma pestana, solo la primera conserva su fila de
   indicadores: las demas repetian metricas que ya estaban arriba. */
function sinK(h){const i=h.indexOf('<div class="kpis">');
  if(i<0) return h;
  let j=i,prof=0;
  while(j<h.length){
    const a=h.indexOf('<div',j), b=h.indexOf('</div>',j);
    if(b<0) return h;
    if(a>=0&&a<b){prof++;j=a+4;} else {prof--;j=b+6; if(prof===0) return h.slice(0,i)+h.slice(j);}
  }
  return h;}
function vProm(){return vPyg()+sep('Presupuesto frente a real')+sinK(vPres())+sep('Ejecución de obra')+sinK(vObra());}
function cProm(){cPyg?.();cPres?.();cObra?.();}
function vDinero(){return vCaja()+sep('Deuda con entidades')+sinK(vDeuda())+sep('Proyección de tesorería')+sinK(vProy());}
function cDinero(){cCaja?.();cDeuda?.();cProy?.();}
function vConc(){return vCal();}
function cConc(){cCal?.();}
function bandaInfo(){
  const it=[];
  if(SEL===CONS){
    const cv=P_REAL.filter(p=>pnl(p.cod).ing>0.5).length;
    const ob=P_REAL.filter(p=>/obra|ejecu/i.test(p.estado)).length;
    it.push(['Sociedades',DATA.meta.sociedades.length]);
    it.push(['Con ventas en el periodo',cv]);
    it.push(['En obra',ob]);
    it.push(['Unidades presupuestadas',nf0.format(P_REAL.reduce((s,p)=>s+(DATA.pres[p.cod]?.uds||0),0))]);
    it.push(['Último cierre',DATA.meta.ultimo]);
    if(DATA.meta.generado) it.push(['Actualizado',DATA.meta.generado]);
  } else {
    const p=PMAP[SEL], pr=DATA.pres[SEL];
    it.push(['Sociedades',(p.soc||[]).join(' + ')||'—']);
    if(pr?.uds) it.push(['Unidades',nf0.format(pr.uds)]);
    if(pr?.ventas) it.push(['Ventas presupuestadas',kEur(pr.ventas)]);
    if(pr?.margen_pct!=null) it.push(['Margen objetivo',pct1(pr.margen_pct)]);
    it.push(['Último cierre',DATA.meta.ultimo]);
    if(DATA.meta.generado) it.push(['Actualizado',DATA.meta.generado]);
  }
  return it.map(([l,v])=>`<div class="pstat"><div class="l">${esc(l)}</div><div class="v">${esc(String(v))}</div></div>`).join('');
}
function render(){
  document.documentElement.style.setProperty('--accent', SEL===CONS?'#102C57':acc(SEL));
  document.getElementById('subtitle').innerHTML=
   `${esc(DATA.meta.periodo)} · ${DATA.meta.sociedades.length} sociedades · ${nf0.format(DATA.meta.lineasMov)} apuntes`+
   (DATA.meta.generado?`<b class="act">Actualizado el ${esc(DATA.meta.generado)}</b>`:'');
  document.getElementById('tabs').innerHTML=TABS.map(([k,l])=>`<div class="tab ${k===TAB?'on':''}" data-t="${k}">${l}</div>`).join('');
  document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{TAB=t.dataset.t;render();window.scrollTo(0,0);});
  /* banda de contexto */
  const p=pnl(SEL), c=caja(SEL), d=deuda(SEL), pr=pres(SEL);
  const nom=SEL===CONS?'Consolidado del grupo':PMAP[SEL].nom;
  const sub=SEL===CONS
    ? `${P_REAL.length} promociones y proyectos · ${DATA.meta.sociedades.length} sociedades`
    : `${esc(PMAP[SEL].tipo)} · ${esc(PMAP[SEL].loc)}`;
  const col=SEL===CONS?'#102C57':acc(SEL);
  const est=SEL===CONS?'':`<span class="chip" style="margin-left:10px">${esc(PMAP[SEL].estado)}</span>`;
  const lg=(DATA.logos||{})[SEL];
  const marca=lg?`<div class="plogo img"><img src="${lg}" alt="${esc(nom)}"></div>`
               :`<div class="plogo" style="background:${col}">${esc(SEL===CONS?'M':inic(nom)||'M')}</div>`;
  document.getElementById('pband').innerHTML=`<div class="pbin">
    ${marca}
    <div class="pmeta"><b>${esc(nom)}</b>${est}<div>${sub}</div></div>
    <div class="pstats">${bandaInfo()}</div></div>`;
  document.getElementById('main').innerHTML=({res:vRes,prom:vProm,caja:vDinero,com:vCom,ter:vTer,conc:vConc,det:vDet})[TAB]();
  ({res:cRes,prom:cProm,caja:cDinero,com:cCom,ter:cTer,conc:cConc,det:cDet})[TAB]?.();
  document.getElementById('footer').innerHTML=
   `Promociones Urbanas Montellano, S.L. · Documento de uso interno. `+
   `Fuente: diarios contables 2023-2026 de las ${DATA.meta.sociedades.length} sociedades del grupo, presupuestos operativos por promoción, analítica contable y registro de facturas emitidas y recibidas. `+
   `Importes en euros. Último cierre contable incorporado: <b>${DATA.meta.ultimo}</b>.`+(DATA.meta.generado?` Este cuadro de mando se generó el <b>${esc(DATA.meta.generado)}</b>${DATA.meta.generadoHora?' a las '+esc(DATA.meta.generadoHora):''}.`:'')+` Para actualizar un mes basta con sustituir el bloque <code>const DATA</code> del fichero.`;
}
function init(){
  const s=document.getElementById('selPromo');
  const o=[`<option value="${CONS}">▣ Consolidado — todas las promociones</option>`,'<optgroup label="Promociones con presupuesto">'];
  P_REAL.filter(p=>p.pres).forEach(p=>o.push(`<option value="${p.cod}">${esc(p.nom)}</option>`));
  o.push('</optgroup><optgroup label="Otros proyectos y suelos">');
  P_REAL.filter(p=>!p.pres).forEach(p=>o.push(`<option value="${p.cod}">${esc(p.nom)}</option>`));
  o.push('</optgroup><optgroup label="Bandeja">');
  o.push(`<option value="SIN_ASIGNAR">${esc(PMAP['SIN_ASIGNAR'].nom)}</option>`);
  o.push('</optgroup>');
  s.innerHTML=o.join(''); s.value=SEL; s.onchange=()=>{SEL=s.value;render();};
  const y=document.getElementById('selEj');
  y.innerHTML=[`<option value="${TODOS}">Acumulado ${EJ[0]}–${EJ[EJ.length-1]}</option>`].concat(EJ.map(e=>`<option value="${e}">Ejercicio ${e}${e===2026?' (hasta julio)':''}</option>`)).join('');
  y.value=EJS; y.onchange=()=>{EJS=y.value;render();};
}
init();render();
