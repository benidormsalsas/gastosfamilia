/* fijos.js — checklist de la solapa "Gastos Fijos". Se carga DESPUÉS del script principal.
   Qué es fijo lo decide la pestaña "Estructura" de la planilla: el script de Google
   completa la columna FIJO de cada gasto y este archivo la lee. No hay lista a mano.
   Se muestra en dos bloques: "Casa" (todo lo del grupo Casa) y "Extras" (el resto). */
(function(){
// Los que se pagan con la tarjeta: no cuentan como pendientes hasta que llega el resumen.
// Tiene que coincidir con "Medio habitual = TC" en la pestaña Estructura.
const FIJOS_CON_TC = ["Seguro moto", "Cuotas cubiertas", "Cuotas calefón"];

// Gastos que se repiten todos los meses pero sin monto ni fecha fija: van en Extras
// con el total del mes, sin pagado/pendiente.
const VARIABLES = [{ nombre: "Nafta", empieza: "Nafta" }];

const norm = s => (s||"").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();
const escH = s => String(s==null?"":s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

window.renderFijos = function(){
  const meses = [...new Set(RAW.map(r=>r.ym))].sort();
  const sel = currentMonth();
  const ym = sel==="ALL" ? meses[meses.length-1] : sel;
  const checklist = document.getElementById("fijosChecklist");

  const gastos = RAW.filter(r=>r.tipo==="Gasto" && r.sub);
  const grupoDe = {};
  gastos.forEach(r=>{ if(r.fijo) grupoDe[r.sub] = r.categoria; });
  const subsFijas = Object.keys(grupoDe);

  if(!subsFijas.length){
    checklist.innerHTML = `<div class="state-msg" style="padding:30px 20px;">Todavía no hay gastos marcados como fijos. Revisá la columna FIJO en la planilla.</div>`;
    return;
  }

  let pagado = 0, pendMonto = 0, tcMonto = 0;
  const pend = [];

  const items = subsFijas.map(sub=>{
    const delMes = gastos.filter(r=>r.sub===sub && r.ym===ym);
    const previos = gastos.filter(r=>r.sub===sub && r.ym<ym).sort((a,b)=>b.fechaSort-a.fechaSort);
    const ref = previos.length ? previos[0].monto : 0;   // último pago, como referencia
    const montoMes = delMes.reduce((s,r)=>s+r.monto,0);
    const ultimoConTC = previos.length && norm(previos[0].medio)==="tc";
    let estado;
    if(delMes.length){ estado = "ok"; pagado += montoMes; }
    else if(FIJOS_CON_TC.includes(sub) || ultimoConTC){ estado = "tc"; tcMonto += ref; }
    else { estado = "pending"; pendMonto += ref; pend.push(sub); }
    const notas = delMes.map(r=>r.notaOrig!=null ? r.notaOrig : r.nota).filter(n=>n && norm(n)!==norm(sub));
    return { sub, grupo: grupoDe[sub], estado, montoMes, ref, delMes, notas };
  });

  // Recurrentes variables (nafta): total del mes y promedio
  VARIABLES.forEach(v=>{
    const filas = gastos.filter(r=>r.sub.startsWith(v.empieza));
    const delMes = filas.filter(r=>r.ym===ym);
    const montoMes = delMes.reduce((s,r)=>s+r.monto,0);
    const mesesCon = [...new Set(filas.filter(r=>r.ym<ym).map(r=>r.ym))];
    const prom = mesesCon.length ? filas.filter(r=>mesesCon.includes(r.ym)).reduce((s,r)=>s+r.monto,0)/mesesCon.length : 0;
    pagado += montoMes;
    items.push({ sub: v.nombre, grupo: "Extras", estado: "var", montoMes, ref: prom, delMes, notas: [] });
  });

  const ordenEstado = {pending:0, tc:1, ok:2, var:3};
  const montoDe = it => (it.estado==="ok" || it.estado==="var") ? it.montoMes : it.ref;
  const etiqueta = {ok:"Pagado", pending:"Pendiente", tc:"Con TC", var:"Variable"};

  const fila = it=>{
    let nota, monto;
    if(it.estado==="ok"){
      nota = it.delMes.map(r=>r.fecha).join(", ") + (it.notas.length ? " · "+escH(it.notas.join(" / ")) : "");
      monto = fmtMoney(it.montoMes);
    } else if(it.estado==="var"){
      nota = `${it.delMes.length} ${it.delMes.length===1?"carga":"cargas"} este mes${it.ref ? " · promedio "+fmtMoney(it.ref)+"/mes" : ""}`;
      monto = fmtMoney(it.montoMes);
    } else {
      nota = (it.ref ? "Último pago "+fmtMoney(it.ref) : "Sin pagos anteriores") + (it.estado==="tc" ? " · se tilda al cargar el resumen" : "");
      monto = it.ref ? "~"+fmtMoney(it.ref) : "";
    }
    return `<div class="fijos-row"><div>
        <div class="fijos-name">${escH(it.sub)}</div>
        <div class="fijos-note">${nota}</div>
      </div>
      <div style="display:flex;align-items:center;gap:14px;">
        <span class="fijos-amt">${monto}</span>
        <span class="fijos-status ${it.estado}">${etiqueta[it.estado]}</span>
      </div></div>`;
  };

  const bloques = [
    { nombre: "Casa",   items: items.filter(it=>it.grupo==="Casa") },
    { nombre: "Extras", items: items.filter(it=>it.grupo!=="Casa") }
  ];
  checklist.innerHTML = bloques.filter(b=>b.items.length).map(b=>{
    b.items.sort((a,c)=> ordenEstado[a.estado]-ordenEstado[c.estado] || montoDe(c)-montoDe(a));
    const tot = b.items.reduce((s,it)=>s+montoDe(it),0);
    const nPend = b.items.filter(it=>it.estado==="pending").length;
    return `<div class="fijos-group"><span class="g-name">${b.nombre}</span>
      <span class="g-tot">${fmtMoney(tot)}${nPend ? " · "+nPend+" pendiente"+(nPend>1?"s":"") : ""}</span></div>` +
      b.items.map(fila).join("");
  }).join("");

  const total = pagado + pendMonto + tcMonto;
  document.getElementById("sumFijos").textContent = fmtMoney(total);
  const card = document.getElementById("sumFijos").parentElement;
  let subEl = document.getElementById("fijosSub");
  if(!subEl){ subEl = document.createElement("div"); subEl.id="fijosSub"; subEl.className="subvalue"; card.appendChild(subEl); }
  subEl.textContent = `${ymLabel(ym)} · Pagado ${fmtMoney(pagado)} · Falta ~${fmtMoney(pendMonto)}${tcMonto ? " · Con TC ~"+fmtMoney(tcMonto) : ""}`;
  document.getElementById("sumPendientes").textContent = pend.length;
  document.getElementById("pendientesDetalle").textContent = pend.length
    ? `${pend.join(", ")} · faltan ~${fmtMoney(pendMonto)}`
    : "Todo pagado este mes ✓";

  // Evolución mensual del total de fijos
  const evo = meses.map(m=>({ym:m, total:gastos.filter(r=>r.ym===m && r.fijo).reduce((s,r)=>s+r.monto,0)}));
  const max = Math.max(1, ...evo.map(d=>d.total));
  document.getElementById("fijosEvoChart").innerHTML = `<div class="hbar-list">${evo.map(d=>`
    <div class="hbar-row"><div class="hbar-label">${ymLabel(d.ym)}</div>
    <div class="hbar-track"><div class="hbar-fill fixed" style="width:${(d.total/max*100).toFixed(0)}%"></div></div>
    <div class="hbar-val">${fmtMoney(d.total)}</div></div>`).join("")}</div>`;
};
})();
