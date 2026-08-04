/* =============================================================================
   Dashboard de control de promociones - Promociones Urbanas Montellano, S.L.
   Capa de presentacion. Se ensambla en index.html mediante build.py.
   No contiene datos: todo llega en el objeto global DATA.
   ============================================================================= */
/* ===================== LÓGICA DEL DASHBOARD (multiejercicio) ===================== */
const CONS='__CONSOLIDADO__', TODOS='TODOS';
const P_ALL=DATA.promos, PMAP=Object.fromEntries(P_ALL.map(p=>[p.cod,p]));
const P_REAL=P_ALL.filter(p=>p.cod!=='SIN_ASIGNAR');
const MESES=DATA.meta.meses, ML=DATA.meta.mesesLbl, NM=MESES.length, EJ=DATA.meta.ejercicios;

const nf=new Intl.NumberFormat('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:'always'});
const nf0=new Intl.NumberFormat('es-ES',{maximumFractionDigits:0,useGrouping:'always'});
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
const CH={},COL=['#1f6feb','#0f9d58','#e8a33d','#8b5cf6','#d7443e','#14b8a6','#ec4899','#64748b','#0ea5e9','#a3612a','#7c3aed','#059669','#f97316','#94a3b8','#cbd5e1'];
function chart(id,cfg){if(CH[id])CH[id].destroy();const el=document.getElementById(id);if(el)CH[id]=new Chart(el,cfg);}
const gopt={responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
 plugins:{legend:{position:'bottom',labels:{boxWidth:10,boxHeight:10,font:{size:11},usePointStyle:true,pointStyle:'circle'}},
 tooltip:{callbacks:{label:c=>' '+c.dataset.label+': '+eur(c.parsed.y??c.parsed)}}},
 scales:{x:{grid:{display:false},ticks:{font:{size:10},maxRotation:0,autoSkip:true,maxTicksLimit:14}},
 y:{grid:{color:'#eef1f6'},ticks:{font:{size:11},callback:v=>kEur(v)}}}};
function tbl(head,rows){
  let h='<table><thead><tr>'+head.map(x=>`<th class="${x.l?'l':''}">${x.t}</th>`).join('')+'</tr></thead><tbody>';
  h+=rows.map(r=>`<tr class="${r.cls||''}">`+r.c.map((c,i)=>`<td class="${head[i].l?'l':''} ${c.cls||''}">${c.v??c}</td>`).join('')+'</tr>').join('');
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
      {v:av!=null?barPct(av,av>105?'#d7443e':(av>85?'#e8a33d':'#1f6feb')):'<span class="muted">—</span>'},
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
  return k+al+`
  <div class="grid2">
    <div class="card"><h3>Coste incurrido por mes <span class="note">imputación a existencias, suelo e inmovilizado</span></h3><div class="cbody"><div class="chartbox"><canvas id="c1"></canvas></div><div class="legend">Hasta 2024 la variación de existencias se contabilizaba una vez al año, por eso el coste de 2023 y 2024 aparece concentrado en diciembre. Desde 2025 la imputación es mensual.</div></div></div>
    <div class="card"><h3>Evolución de la caja <span class="note">saldo acumulado de las cuentas de la promoción</span></h3><div class="cbody"><div class="chartbox"><canvas id="c2"></canvas></div></div></div>
  </div>
  <div class="card"><h3>Cuadro de mando por promoción <span class="note">${periodo()}</span></h3><div class="cbody scroll">${tbl(head,rows)}</div></div>
  <div class="grid2">
    <div class="card"><h3>Inversión acumulada por promoción <span class="note">vida completa 2023-2026</span></h3><div class="cbody"><div class="chartbox"><canvas id="c3"></canvas></div></div></div>
    <div class="card"><h3>Obra en curso y deuda <span class="note">evolución mensual</span></h3><div class="cbody"><div class="chartbox"><canvas id="c4"></canvas></div></div></div>
  </div>
  ${bandeja}`;
}
function cRes(){
  const cs=SEL===CONS?P_REAL.map(p=>p.cod):[SEL], L=lblW();
  chart('c1',{type:'bar',data:{labels:L,datasets:cs.filter(c=>serW([c],'act').some(v=>v>0))
    .map((c,i)=>({label:PMAP[c].nom,data:serW([c],'act'),backgroundColor:COL[i%COL.length],borderRadius:2,stack:'a'}))},
    options:{...gopt,scales:{...gopt.scales,x:{...gopt.scales.x,stacked:true},y:{...gopt.scales.y,stacked:true}}}});
  const c=caja(SEL);
  chart('c2',{type:'line',data:{labels:L,datasets:[
    {label:'Saldo de caja',data:c.saldo,borderColor:'#1f6feb',backgroundColor:'rgba(31,111,235,.10)',fill:true,tension:.3,pointRadius:0},
    {label:'Variación del mes',data:c.mens,type:'bar',backgroundColor:'#e8a33d'}]},options:gopt});
  const lt=(SEL===CONS?P_REAL.map(p=>p.cod):[SEL]).map(c=>({n:PMAP[c].nom,v:S(c,'actAc')[NM-1]})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v);
  chart('c3',{type:'bar',data:{labels:lt.map(x=>x.n),datasets:[{label:'Coste incurrido acumulado',data:lt.map(x=>x.v),backgroundColor:'#1f6feb',borderRadius:3}]},
    options:{...gopt,indexAxis:'y',plugins:{...gopt.plugins,legend:{display:false}},
      scales:{x:{grid:{color:'#eef1f6'},ticks:{font:{size:10},callback:v=>kEur(v)}},y:{grid:{display:false},ticks:{font:{size:10}}}}}});
  chart('c4',{type:'line',data:{labels:L,datasets:[
    {label:'Obra en curso',data:serW(codes(SEL),'exSaldo'),borderColor:'#0f9d58',backgroundColor:'rgba(15,157,88,.10)',fill:true,tension:.3,pointRadius:0},
    {label:'Deuda con entidades',data:serW(codes(SEL),'deudaSaldo'),borderColor:'#d7443e',tension:.3,pointRadius:0}]},options:gopt});
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
  return `<div class="grid2">
    <div class="card"><h3>Cuenta de resultados · ${esc(SEL===CONS?'Consolidado':PMAP[SEL].nom)} <span class="note">${esc(subt)}</span></h3><div class="cbody">${tbl([{t:'Concepto',l:1},{t:'Importe'},{t:'% s/ ingresos'}],r1)}
      <div class="legend">El margen recoge únicamente las unidades entregadas y escrituradas en el periodo. Lo vendido pero no entregado permanece en obra en curso.</div></div></div>
    <div class="card"><h3>Coste por naturaleza <span class="note">parte trazable a cuenta contable</span></h3><div class="cbody">${tbl([{t:'Naturaleza',l:1},{t:'Importe'},{t:'% s/ total'}],r2r)}
      <div class="legend">${poco?'<b>En esta promoción el desglose por naturaleza es muy limitado:</b> la mayor parte del coste entra por la cuenta común de Doñinos y por el asiento de variación de existencias, que imputa la promoción pero no la naturaleza. El detalle por capítulos está en la pestaña <i>Presupuesto vs Real</i>.':'El diario identifica la naturaleza únicamente en las cuentas específicas de cada promoción. El resto se imputa a la promoción en el asiento mensual de variación de existencias, sin desglose por naturaleza.'}</div></div></div>
  ${comp}${ltd}
  <div class="grid2">
    <div class="card"><h3>Ingresos, coste de ventas y margen por mes</h3><div class="cbody"><div class="chartbox"><canvas id="p1"></canvas></div></div></div>
    <div class="card"><h3>Obra en curso</h3><div class="cbody">${tbl([{t:'Movimiento de la obra en curso',l:1},{t:'Importe'}],r3)}<div class="chartbox sm" style="margin-top:10px"><canvas id="p2"></canvas></div>
      <div class="legend">En 2023 y 2024 la variación de existencias se contabilizó una vez al año; desde 2025 es mensual. Por eso el reparto mensual del coste anterior a 2025 aparece concentrado en diciembre.</div></div></div>`;
}
function cPyg(){
  const cs=codes(SEL),L=lblW(),ing=serW(cs,'ing'),cv=serW(cs,'cv');
  chart('p1',{type:'bar',data:{labels:L,datasets:[
    {label:'Ingresos',data:ing,backgroundColor:'#0f9d58',borderRadius:2},
    {label:'Coste de ventas',data:cv.map(v=>-v),backgroundColor:'#d7443e',borderRadius:2},
    {label:'Margen',data:ing.map((v,i)=>v-cv[i]),type:'line',borderColor:'#1f6feb',tension:.3,pointRadius:0}]},options:gopt});
  chart('p2',{type:'bar',data:{labels:L,datasets:[{label:'Coste incurrido',data:serW(cs,'act'),backgroundColor:'#1f6feb',borderRadius:2}]},
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
      {v:v.pres?pct1(100*des/v.pres):'—',cls:des>0?'neg':'pos'},{v:barPct(av,av>105?'#d7443e':(av>85?'#e8a33d':'#1f6feb'))}]};});
  rows.push({cls:'tot',c:[{v:'TOTAL'},{v:eur(pr.pres)},{v:eur(pr.ejec)},{v:eur(pr.ejec-pr.pres),cls:pr.ejec>pr.pres?'neg':'pos'},
    {v:pr.pres?pct1(100*(pr.ejec-pr.pres)/pr.pres):'—'},{v:barPct(pr.pres?100*pr.ejec/pr.pres:0,'#0d3b7a')}]});
  const desv=Object.entries(pr.caps).map(([cap,v])=>({cap,d:v.ejec-v.pres,p:v.pres?100*(v.ejec-v.pres)/v.pres:0}))
    .filter(x=>Math.abs(x.d)>1000).sort((a,b)=>Math.abs(b.d)-Math.abs(a.d)).slice(0,6);
  const t2=tbl([{t:'Capítulo',l:1},{t:'Desviación'},{t:'%'},{t:'Lectura',l:1}],desv.map(x=>({c:[
    {v:esc(x.cap)},{v:eur(x.d),cls:x.d>0?'neg':'pos'},{v:pct1(x.p),cls:x.d>0?'neg':'pos'},
    {v:x.d>0?'<span class="chip bad">Sobrecoste</span> el ejecutado ya supera el presupuesto del capítulo'
            :'<span class="chip ok">Bajo presupuesto</span> puede ser ahorro real o gasto aún no incurrido'}]})));

  const t0=tbl([{t:'Contraste global',l:1},{t:'Presupuesto'},{t:'Real (contabilidad)'},{t:'Ejecutado (estudio)'},{t:'Avance real'}],[
    {c:[{v:'Coste total de la promoción'},{v:eur(pr.coste)},{v:eur(pr.real)},{v:eur(pr.ejec)},{v:barPct(pr.avance,pr.avance>105?'#d7443e':'#1f6feb')}]},
    {c:[{v:'Ventas'},{v:eur(pr.ventas)},{v:eur(pr.ingR)},{v:'<span class="muted">—</span>'},{v:barPct(pr.ventasPct,'#0f9d58')}]},
  ]);

  let t3='';
  if(cod && DATA.pres[cod]?.cobra?.length){
    const co=DATA.pres[cod].cobra;
    const r=co.map(x=>{const d=x.real-x.contrata,av=x.contrata?100*x.real/x.contrata:0;
      return {c:[{v:x.n+'. '+esc(x.cap)},{v:eur(x.pres)},{v:eur(x.contrata)},{v:eur(x.real)},
        {v:eur(d),cls:d>0?'neg':'pos'},{v:barPct(av,av>105?'#d7443e':(av>85?'#e8a33d':'#1f6feb'))}]};});
    const T=co.reduce((a,x)=>({p:a.p+x.pres,c:a.c+x.contrata,r:a.r+x.real}),{p:0,c:0,r:0});
    r.push({cls:'tot',c:[{v:'TOTAL CAPÍTULOS DE OBRA'},{v:eur(T.p)},{v:eur(T.c)},{v:eur(T.r)},
      {v:eur(T.r-T.c),cls:T.r>T.c?'neg':'pos'},{v:barPct(T.c?100*T.r/T.c:0,'#0d3b7a')}]});
    t3=`<div class="card"><h3>Capítulos de obra · ${esc(PMAP[cod].nom)} <span class="note">contrata aplicada frente a certificado real</span></h3><div class="cbody scroll">${tbl([{t:'Capítulo',l:1},{t:'Presupuesto'},{t:'Contrata aplicada'},{t:'Real'},{t:'Desviación'},{t:'Avance'}],r)}</div></div>`;
  }
  let t4='';
  if(cod && DATA.pres[cod]?.partidas?.length){
    const by={};DATA.pres[cod].partidas.forEach(x=>{(by[x.cap]=by[x.cap]||[]).push(x);});
    t4='<div class="card"><h3>Detalle de partidas del estudio económico</h3>'+Object.entries(by).map(([cap,arr])=>{
      const sp=arr.reduce((a,x)=>a+x.pres,0),se=arr.reduce((a,x)=>a+x.ejec,0);
      return `<details><summary><span>${esc(cap)} <span class="muted small">· ${arr.length} partidas</span></span>
        <span class="small">Ppto. <b>${eur(sp)}</b> · Ejec. <b>${eur(se)}</b> · <span class="${se>sp?'neg':'pos'}">${eur(se-sp)}</span></span></summary>
        <div class="dbody">${tbl([{t:'Partida',l:1},{t:'Presupuestado'},{t:'Ejecutado'},{t:'Desviación'}],
          arr.map(x=>({c:[{v:esc(x.part)},{v:eur(x.pres)},{v:eur(x.ejec)},{v:eur(x.ejec-x.pres),cls:x.ejec>x.pres?'neg':'pos'}]})))}</div></details>`;}).join('')+'</div>';
  }
  return k+sem+`<div class="card"><h3>Presupuesto, real contable y ejecutado del estudio</h3><div class="cbody">${t0}
    <div class="legend">«Real (contabilidad)» es el coste incurrido acumulado que sale de los diarios 2023-2026. «Ejecutado (estudio)» es la columna que mantiene el estudio económico. Las diferencias entre ambos se detallan en la pestaña de calidad de datos.</div></div></div>
  <div class="grid3">
    <div class="card"><h3>Presupuesto frente a ejecutado por capítulo</h3><div class="cbody">${tbl([{t:'Capítulo',l:1},{t:'Presupuestado'},{t:'Ejecutado'},{t:'Desviación'},{t:'% desv.'},{t:'Avance'}],rows)}</div></div>
    <div class="card"><h3>Distribución del presupuesto</h3><div class="cbody"><div class="chartbox"><canvas id="r2"></canvas></div></div></div>
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
    {label:'Coste real acumulado',data:acum,borderColor:'#1f6feb',backgroundColor:'rgba(31,111,235,.10)',fill:true,tension:.25,pointRadius:0},
    {label:'Presupuesto total',data:new Array(NM).fill(pr.coste),borderColor:'#d7443e',borderDash:[6,4],pointRadius:0},
    {label:'Ventas acumuladas',data:(()=>{const o=[];for(let i=0;i<NM;i++)o.push(cs.reduce((t,c)=>t+S(c,'ingAc')[i],0));return o;})(),borderColor:'#0f9d58',tension:.25,pointRadius:0}
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
  <div class="grid2">
   <div class="card"><h3>Mayores saldos pendientes de cobro</h3><div class="cbody scroll">${topC.length?tbl([{t:'Cliente',l:1},{t:'Facturado'},{t:'Cobrado'},{t:'Pendiente'}],topC.map(x=>({c:[{v:esc(x.nom)+'<div class="muted small">'+x.cta+'</div>'},{v:eur(x.fact)},{v:eur(x.cobr)},{v:eur(x.saldo),cls:'wrn'}]}))):'<div class="muted">Sin saldos pendientes de cobro.</div>'}</div></div>
   <div class="card"><h3>Mayores saldos pendientes de pago</h3><div class="cbody scroll">${topP.length?tbl([{t:'Proveedor',l:1},{t:'Facturado'},{t:'Pagado'},{t:'Pendiente'}],topP.map(x=>({c:[{v:esc(x.nom)+'<div class="muted small">'+x.cta+'</div>'},{v:eur(x.fact)},{v:eur(x.cobr)},{v:eur(-x.saldo),cls:'wrn'}]}))):'<div class="muted">Sin saldos pendientes de pago.</div>'}</div></div>
  </div>`;
}
function cCaja(){
  const c=caja(SEL),L=lblW(),[a,b]=win();
  chart('k1',{type:'line',data:{labels:L,datasets:[{label:'Saldo de caja',data:c.saldo,borderColor:'#1f6feb',backgroundColor:'rgba(31,111,235,.10)',fill:true,tension:.3,pointRadius:0}]},
    options:{...gopt,plugins:{...gopt.plugins,legend:{display:false}}}});
  const co=[],pa=[];for(let i=a;i<=b;i++){let x=0,y=0;c.cuentas.forEach(v=>{x+=v.cob[i];y+=v.pag[i];});co.push(x);pa.push(-y);}
  chart('k2',{type:'bar',data:{labels:L,datasets:[
    {label:'Cobros',data:co,backgroundColor:'#0f9d58',borderRadius:2},
    {label:'Pagos',data:pa,backgroundColor:'#d7443e',borderRadius:2},
    {label:'Variación neta',data:c.mens,type:'line',borderColor:'#0e1420',tension:.3,pointRadius:0}]},options:gopt});
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
  if(SEL===CONS&&DATA.otras.length) otras=`<div class="card"><h3>Otra financiación del grupo <span class="note">deudas con empresas del grupo, socios y arrendamiento financiero</span></h3><div class="cbody">
    ${tbl([{t:'Concepto',l:1},{t:'Saldo inicial'},{t:'Saldo a cierre'},{t:'Variación'}],DATA.otras.filter(x=>Math.abs(x.serie[b])>1||Math.abs(a===0?0:x.serie[a-1])>1).sort((x,y)=>y.serie[b]-x.serie[b]).map(x=>({c:[
      {v:esc(x.nom)+'<div class="muted small">cuenta '+x.cta+'</div>'},{v:eur(a===0?0:x.serie[a-1])},{v:eur(x.serie[b])},
      {v:eur(x.serie[b]-(a===0?0:x.serie[a-1])),cls:x.serie[b]>(a===0?0:x.serie[a-1])?'neg':'pos'}]})))}
    <div class="legend">Estas deudas no llevan límite de disposición formalizado, por lo que no procede calcular disponible.</div></div></div>`;
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
      r.slice(0,1500).map(x=>({c:[{v:'<b>'+esc(x[1])+'</b><div class="muted small">'+x[0]+'</div>'},{v:'<span class="pill">'+esc(x[2])+'</span>'},{v:x[3]},
        {v:eur(x[4])},{v:eur(x[5])},{v:eur(x[6]),cls:x[6]>0.05?'wrn':'muted'},{v:x[9]||'<span class="muted">—</span>'},
        {v:x[7]==='Pagada'?'<span class="chip ok">Pagada</span>':(x[7]==='Parcial'?'<span class="chip warn">Parcial</span>':'<span class="chip bad">Sin pago identificado</span>')},
        {v:'<span class="chip">'+esc(PMAP[x[8]]?.nom||x[8])+'</span>'}]})));
  } else if(F.tipo==='femi'){
    let r=DATA.femi.filter(x=>cs.includes(x[5])&&okEj(x[6]));
    if(F.mes)r=r.filter(x=>x[3].slice(6)+'-'+x[3].slice(3,5)===F.mes);
    if(q)r=r.filter(x=>(x[1]+' '+x[2]).toLowerCase().includes(q));
    r=r.slice().sort((p,s)=>s[4]-p[4]); n=r.length;tot=r.reduce((s,x)=>s+x[4],0);
    html=tbl([{t:'Cliente',l:1},{t:'Concepto',l:1},{t:'Fecha'},{t:'Importe (con IVA)'},{t:'Promoción',l:1}],
      r.slice(0,1500).map(x=>({c:[{v:'<b>'+esc(x[1])+'</b><div class="muted small">'+x[0]+'</div>'},{v:esc(x[2])},{v:x[3]},{v:eur(x[4])},
        {v:'<span class="chip">'+esc(PMAP[x[5]]?.nom||x[5])+'</span>'}]})));
  } else {
    let r=DATA.cobr.filter(x=>cs.includes(x[5])&&okEj(x[6]));
    if(F.mes)r=r.filter(x=>x[3].slice(6)+'-'+x[3].slice(3,5)===F.mes);
    if(q)r=r.filter(x=>(x[1]+' '+x[2]).toLowerCase().includes(q));
    r=r.slice().sort((p,s)=>s[4]-p[4]); n=r.length;tot=r.reduce((s,x)=>s+x[4],0);
    html=tbl([{t:'Cliente',l:1},{t:'Concepto',l:1},{t:'Fecha'},{t:'Importe'},{t:'Promoción',l:1}],
      r.slice(0,1500).map(x=>({c:[{v:'<b>'+esc(x[1])+'</b><div class="muted small">'+x[0]+'</div>'},{v:esc(x[2])},{v:x[3]},{v:eur(x[4])},
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
    secOrd.map(s2=>({c:[{v:esc(s2)},{v:eur(secTot[s2])},{v:gt?pct1(100*secTot[s2]/gt):'—'},{v:barPct(gt?100*secTot[s2]/gt:0,'#1f6feb')}]}))
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
        {v:barPct(difTot?100*Math.abs(f.imp)/Math.abs(difTot):0,'#8b5cf6')}]}))
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
  // contraste real contable vs ejecutado del estudio
  const cmp=P_REAL.filter(p=>p.pres).map(p=>{const x=DATA.pres[p.cod],real=S(p.cod,'actAc')[NM-1];
    return {c:[{v:'<b>'+esc(p.nom)+'</b>'},{v:eur(real)},{v:eur(x.ejec)},{v:eur(real-x.ejec),cls:Math.abs(real-x.ejec)>200000?'wrn':''},
      {v:x.ejec?pct1(100*(real-x.ejec)/x.ejec):'—'}]};});
  const tDesc=q.descuadres.length?tbl([{t:'Sociedad',l:1},{t:'Fecha'},{t:'Asiento'},{t:'Debe'},{t:'Haber'},{t:'Diferencia'}],
    q.descuadres.map(x=>({c:[{v:esc(x.soc)},{v:x.fecha},{v:x.asiento},{v:eur(x.debe)},{v:eur(x.haber)},{v:eur(x.dif),cls:'neg'}]}))):'';
  const tSc=q.sincuenta.length?tbl([{t:'Sociedad',l:1},{t:'Fecha'},{t:'Asiento'},{t:'Concepto',l:1},{t:'Descripción',l:1},{t:'Debe'},{t:'Haber'}],
    q.sincuenta.map(x=>({c:[{v:esc(x.soc)},{v:x.fecha},{v:x.asiento},{v:esc(x.com)},{v:esc(x.desc)},{v:eur(x.debe)},{v:eur(x.haber)}]}))):'';
  return k+alertas.map(x=>`<div class="alert ${x.t}"><b>${x.h}.</b> ${x.x}</div>`).join('')+
   `<div class="card"><h3>Criterios de asignación aplicados</h3><div class="cbody">${tReglas}
     <div class="legend">Ninguna partida se reparte por estimación. Lo que no encaja en un criterio verificable permanece en una bandeja y se muestra íntegro más abajo.</div></div></div>
   <div class="card"><h3>Coste real contable frente al ejecutado del estudio económico <span class="note">acumulado a 31/07/2026</span></h3><div class="cbody">
     ${tbl([{t:'Promoción',l:1},{t:'Real contable'},{t:'Ejecutado (estudio)'},{t:'Diferencia'},{t:'%'}],cmp)}
     <div class="legend">Diferencias relevantes indican que la columna <i>Ejecutado</i> del estudio no está actualizada al último cierre contable, o que el estudio incluye conceptos que la contabilidad no activa en existencias.</div></div></div>
   <div class="card"><h3>Conciliación entre gasto contabilizado y coste imputado a promociones</h3><div class="cbody scroll">${tConc}
     <div class="legend">El coste imputado incluye compras de suelo e inmovilizado de promoción, que no son gasto del ejercicio: por eso puede superar al gasto contabilizado.</div></div></div>
   <div class="grid1">
     <div class="card"><h3>Bandeja «Sin asignar» · detalle por cuenta <span class="note">${eur(cq.sin)} de gasto de estructura</span></h3><div class="cbody scroll">${tSin}</div></div>
   </div>
   <div class="card"><h3>Facturas de proveedor sin pago identificado o con pago parcial <span class="note">${nf0.format(frSin.length)} facturas · ${eur(frSin.reduce((a,x)=>a+x[6],0))} pendiente</span></h3><div class="cbody scroll">${tFr}</div></div>
   ${q.descuadres.length?`<div class="card"><h3>Descuadres contables</h3><div class="cbody">${tDesc}</div></div>`:''}
   ${q.sincuenta.length?`<div class="card"><h3>Apuntes sin cuenta contable en el fichero de origen</h3><div class="cbody">${tSc}</div></div>`:''}`;
}
function cCal(){}

/* ============================== ARRANQUE ============================== */
const TABS=[['res','Resumen'],['pyg','P&L'],['pres','Presupuesto vs Real'],['caja','Caja'],['deuda','Deuda'],['ana','Analítica'],['det','Detalle'],['cal','Calidad de datos']];
function render(){
  document.getElementById('subtitle').textContent=
   `${DATA.meta.periodo} · ${DATA.meta.sociedades.length} sociedades · ${nf0.format(DATA.meta.lineasMov)} apuntes contables · ${nf0.format(DATA.frac.length)} facturas de proveedor y ${nf0.format(DATA.femi.length)} emitidas`;
  document.getElementById('tabs').innerHTML=TABS.map(([k,l])=>`<div class="tab ${k===TAB?'on':''}" data-t="${k}">${l}</div>`).join('');
  document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{TAB=t.dataset.t;render();window.scrollTo(0,0);});
  document.getElementById('main').innerHTML=({res:vRes,pyg:vPyg,pres:vPres,caja:vCaja,deuda:vDeuda,ana:vAna,det:vDet,cal:vCal})[TAB]();
  ({res:cRes,pyg:cPyg,pres:cPres,caja:cCaja,deuda:cDeuda,ana:cAna,det:cDet,cal:cCal})[TAB]?.();
  document.getElementById('footer').innerHTML=
   `Fuente: diarios contables 2023-2026 de las ${DATA.meta.sociedades.length} sociedades del grupo, presupuestos operativos por promoción, analítica contable del cliente y registro de facturas emitidas y recibidas. `+
   `Importes en euros. Último cierre incorporado: ${DATA.meta.ultimo}. Para actualizar un mes basta con sustituir el bloque <code>const DATA</code> del fichero.`;
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
